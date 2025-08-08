'use client';

import * as React from 'react';
import { useState } from 'react';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Eye, ArrowRight, X } from 'lucide-react';

import { EmployeeSearch } from '@/app/components/shared/employee-search';
import { DepartmentSearch } from './DepartmentSearch';
import { EmpleadoSimpleDTO } from '@/app/horarios/asignados/registrar/types';
import { DepartamentoDto } from '@/lib/api/schedule-api';
import {
  createJustificacionIndividual,
  createJustificacionDepartamental,
  createJustificacionMasiva,
  JustificacionIndividualData,
  JustificacionDepartamentalData,
  JustificacionMasivaData,
} from '@/lib/api/justificaciones.api';
import { buscarAsistencias } from '@/lib/api/asistencia.api';
import { useToast } from '@/components/ui/use-toast';

type TipoJustificacion = 'individual' | 'departamental' | 'masiva';

interface JustificacionFormData {
  tipo: TipoJustificacion;
  empleado: EmpleadoSimpleDTO | null;
  departamento: DepartamentoDto | null;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  fecha: Date | null;
  motivo: string;
}

interface JustificacionExitosa {
  tipo: TipoJustificacion;
  empleadosAfectados: number;
  fechasAfectadas: string[];
  empleadoNombre?: string;
  departamentoNombre?: string;
}

interface JustificacionFormProps {
  onSuccess?: () => void;
}

export function JustificacionForm({ onSuccess }: JustificacionFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [justificacionExitosa, setJustificacionExitosa] =
    useState<JustificacionExitosa | null>(null);
  const [formData, setFormData] = useState<JustificacionFormData>({
    tipo: 'individual',
    empleado: null,
    departamento: null,
    fechaInicio: null,
    fechaFin: null,
    fecha: null,
    motivo: '',
  });

  const handleTipoChange = (tipo: TipoJustificacion) => {
    setFormData({
      ...formData,
      tipo,
      empleado: null,
      departamento: null,
      fechaInicio: null,
      fechaFin: null,
      fecha: null,
      motivo: '',
    });
    setErrors({});
    setJustificacionExitosa(null); // Limpiar mensaje de éxito al cambiar tipo
  };

  // Función para verificar si las asistencias fueron actualizadas
  const verificarAsistenciasActualizadas = async (
    fechas: string[]
  ): Promise<{ actualizadas: number; total: number }> => {
    try {
      let totalActualizadas = 0;
      let totalAsistencias = 0;

      for (const fecha of fechas) {
        // Buscar asistencias justificadas (estatus FJ = 6)
        const asistenciasJustificadas = await buscarAsistencias(
          {
            fecha,
            estatusId: 6, // FJ - Falta Justificada
          },
          1,
          1000
        );

        // Buscar asistencias con faltas completas (estatus FC = 4) para comparar
        const asistenciasFaltaCompleta = await buscarAsistencias(
          {
            fecha,
            estatusId: 4, // FC - Falta Completa
          },
          1,
          1000
        );

        totalActualizadas += asistenciasJustificadas.total;
        totalAsistencias +=
          asistenciasJustificadas.total + asistenciasFaltaCompleta.total;
      }

      return { actualizadas: totalActualizadas, total: totalAsistencias };
    } catch (error) {
      console.error('Error verificando asistencias actualizadas:', error);
      return { actualizadas: 0, total: 0 };
    }
  };

  const handleDateChange = (
    field: 'fechaInicio' | 'fechaFin' | 'fecha',
    date: Date | undefined
  ) => {
    setFormData({
      ...formData,
      [field]: date || null,
    });

    // Clear related errors
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: '',
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar motivo
    if (!formData.motivo.trim()) {
      newErrors.motivo = 'El motivo es requerido';
    }

    // Validaciones específicas por tipo
    switch (formData.tipo) {
      case 'individual':
        if (!formData.empleado) {
          newErrors.empleado = 'Debe seleccionar un empleado';
        }
        if (!formData.fechaInicio) {
          newErrors.fechaInicio = 'La fecha de inicio es requerida';
        }
        if (!formData.fechaFin) {
          newErrors.fechaFin = 'La fecha de fin es requerida';
        }
        if (
          formData.fechaInicio &&
          formData.fechaFin &&
          formData.fechaFin < formData.fechaInicio
        ) {
          newErrors.fechaFin =
            'La fecha de fin debe ser posterior a la fecha de inicio';
        }
        break;

      case 'departamental':
        if (!formData.departamento) {
          newErrors.departamento = 'Debe seleccionar un departamento';
        }
        if (!formData.fecha) {
          newErrors.fecha = 'La fecha es requerida';
        }
        break;

      case 'masiva':
        if (!formData.fecha) {
          newErrors.fecha = 'La fecha es requerida';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      let response: any;
      let empleadosAfectados = 0;
      let fechasAfectadas: string[] = [];

      switch (formData.tipo) {
        case 'individual':
          const individualData: JustificacionIndividualData = {
            empleadoId: formData.empleado!.id,
            fechaInicio: format(formData.fechaInicio!, 'yyyy-MM-dd'),
            fechaFin: format(formData.fechaFin!, 'yyyy-MM-dd'),
            motivo: formData.motivo.trim(),
          };
          response = await createJustificacionIndividual(individualData);
          empleadosAfectados = 1;

          // Calcular fechas afectadas para justificación individual
          const fechaInicio = new Date(formData.fechaInicio!);
          const fechaFin = new Date(formData.fechaFin!);
          const fechasRango: string[] = [];
          for (
            let d = new Date(fechaInicio);
            d <= fechaFin;
            d.setDate(d.getDate() + 1)
          ) {
            fechasRango.push(format(d, 'yyyy-MM-dd'));
          }
          fechasAfectadas = fechasRango;
          break;

        case 'departamental':
          const departamentalData: JustificacionDepartamentalData = {
            departamentoId: parseInt(formData.departamento!.clave, 10), // Using clave as the ID
            fecha: format(formData.fecha!, 'yyyy-MM-dd'),
            motivo: formData.motivo.trim(),
          };
          response = await createJustificacionDepartamental(departamentalData);
          empleadosAfectados =
            response.empleadosJustificados || response.empleadosAfectados || 0;
          fechasAfectadas = [format(formData.fecha!, 'yyyy-MM-dd')];
          break;

        case 'masiva':
          const masivaData: JustificacionMasivaData = {
            fecha: format(formData.fecha!, 'yyyy-MM-dd'),
            motivo: formData.motivo.trim(),
          };
          console.log('Enviando justificación masiva:', masivaData); // Debug log
          response = await createJustificacionMasiva(masivaData);
          console.log('Respuesta del backend:', response); // Debug log
          empleadosAfectados =
            response.empleadosJustificados || response.empleadosAfectados || 0;
          fechasAfectadas = [format(formData.fecha!, 'yyyy-MM-dd')];
          break;
      }

      // Verificar si las asistencias fueron realmente actualizadas
      const verificacion =
        await verificarAsistenciasActualizadas(fechasAfectadas);

      // Toast mejorado con información detallada
      const fechasTexto =
        fechasAfectadas.length === 1
          ? format(new Date(fechasAfectadas[0]), 'dd/MM/yyyy', { locale: es })
          : fechasAfectadas.length > 1
            ? `${format(new Date(fechasAfectadas[0]), 'dd/MM/yyyy', { locale: es })} - ${format(new Date(fechasAfectadas[fechasAfectadas.length - 1]), 'dd/MM/yyyy', { locale: es })}`
            : 'fechas seleccionadas';

      // Determinar si hay problemas con la actualización
      const hayProblemas =
        verificacion.actualizadas === 0 && empleadosAfectados > 0;

      const descripcionDetallada = hayProblemas
        ? `⚠️ ADVERTENCIA: La justificación se creó pero las asistencias NO fueron actualizadas automáticamente. Verifique manualmente en "Corrección de Estatus".`
        : empleadosAfectados > 0
          ? `Justificación procesada exitosamente. ${empleadosAfectados} empleado${empleadosAfectados > 1 ? 's' : ''} afectado${empleadosAfectados > 1 ? 's' : ''} para ${fechasTexto}. ${verificacion.actualizadas} asistencias actualizadas.`
          : `Justificación procesada exitosamente para ${fechasTexto}. ${verificacion.actualizadas} asistencias actualizadas.`;

      toast({
        title: hayProblemas
          ? 'Justificación creada con advertencias'
          : 'Justificación creada exitosamente',
        description: descripcionDetallada,
        duration: hayProblemas ? 10000 : 6000, // Más tiempo si hay problemas
        variant: hayProblemas ? 'destructive' : 'default',
      });

      // Guardar información de la justificación exitosa para mostrar el alert
      setJustificacionExitosa({
        tipo: formData.tipo,
        empleadosAfectados,
        fechasAfectadas,
        empleadoNombre: formData.empleado?.nombreCompleto,
        departamentoNombre: formData.departamento?.nombre,
      });

      // Reset form
      setFormData({
        tipo: 'individual',
        empleado: null,
        departamento: null,
        fechaInicio: null,
        fechaFin: null,
        fecha: null,
        motivo: '',
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error al procesar justificación',
        description:
          error.message || 'Ocurrió un error al procesar la justificación',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderDateFields = () => {
    switch (formData.tipo) {
      case 'individual':
        return (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='fechaInicio'>Fecha de Inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className='w-full justify-start text-left font-normal'
                    disabled={loading}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {formData.fechaInicio ? (
                      format(formData.fechaInicio, 'PPP', { locale: es })
                    ) : (
                      <span>Seleccione fecha de inicio</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                  <Calendar
                    mode='single'
                    selected={formData.fechaInicio ?? undefined}
                    onSelect={(date) => handleDateChange('fechaInicio', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.fechaInicio && (
                <p className='text-sm text-destructive'>{errors.fechaInicio}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='fechaFin'>Fecha de Fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className='w-full justify-start text-left font-normal'
                    disabled={loading}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {formData.fechaFin ? (
                      format(formData.fechaFin, 'PPP', { locale: es })
                    ) : (
                      <span>Seleccione fecha de fin</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                  <Calendar
                    mode='single'
                    selected={formData.fechaFin ?? undefined}
                    onSelect={(date) => handleDateChange('fechaFin', date)}
                    disabled={{ before: formData.fechaInicio ?? new Date(0) }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.fechaFin && (
                <p className='text-sm text-destructive'>{errors.fechaFin}</p>
              )}
            </div>
          </div>
        );

      case 'departamental':
      case 'masiva':
        return (
          <div className='space-y-2'>
            <Label htmlFor='fecha'>Fecha</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className='w-full justify-start text-left font-normal'
                  disabled={loading}
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {formData.fecha ? (
                    format(formData.fecha, 'PPP', { locale: es })
                  ) : (
                    <span>Seleccione fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0'>
                <Calendar
                  mode='single'
                  selected={formData.fecha ?? undefined}
                  onSelect={(date) => handleDateChange('fecha', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.fecha && (
              <p className='text-sm text-destructive'>{errors.fecha}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderJustificacionExitosaAlert = () => {
    if (!justificacionExitosa) return null;

    const fechasTexto =
      justificacionExitosa.fechasAfectadas.length === 1
        ? format(
            new Date(justificacionExitosa.fechasAfectadas[0]),
            'dd/MM/yyyy',
            { locale: es }
          )
        : justificacionExitosa.fechasAfectadas.length > 1
          ? `${format(new Date(justificacionExitosa.fechasAfectadas[0]), 'dd/MM/yyyy', { locale: es })} - ${format(new Date(justificacionExitosa.fechasAfectadas[justificacionExitosa.fechasAfectadas.length - 1]), 'dd/MM/yyyy', { locale: es })}`
          : 'fechas seleccionadas';

    let detalleAfectados = '';
    switch (justificacionExitosa.tipo) {
      case 'individual':
        detalleAfectados = `Empleado: ${justificacionExitosa.empleadoNombre}`;
        break;
      case 'departamental':
        detalleAfectados = `Departamento: ${justificacionExitosa.departamentoNombre} (${justificacionExitosa.empleadosAfectados} empleados)`;
        break;
      case 'masiva':
        detalleAfectados = `Todos los empleados del sistema (${justificacionExitosa.empleadosAfectados} empleados)`;
        break;
    }

    return (
      <Alert className='border-green-200 bg-green-50 relative'>
        <CheckCircle2 className='h-4 w-4 text-green-600' />
        <Button
          variant='ghost'
          size='icon'
          className='absolute top-2 right-2 h-6 w-6 text-green-600 hover:text-green-800 hover:bg-green-100'
          onClick={() => setJustificacionExitosa(null)}
        >
          <X className='h-4 w-4' />
        </Button>
        <AlertDescription className='text-green-800 pr-8'>
          <div className='space-y-2'>
            <div className='font-medium'>
              ✅ Justificación procesada exitosamente
            </div>
            <div className='text-sm space-y-1'>
              <div>
                <strong>Fechas afectadas:</strong> {fechasTexto}
              </div>
              <div>
                <strong>Personal afectado:</strong> {detalleAfectados}
              </div>
            </div>
            <div className='flex items-center gap-2 text-sm pt-2 border-t border-green-200'>
              <Eye className='h-4 w-4' />
              <span>
                Para verificar las asistencias actualizadas, vaya a la pestaña
              </span>
              <strong>"Corrección de Estatus"</strong>
              <ArrowRight className='h-4 w-4' />
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Justificación</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Alert de justificación exitosa */}
        {renderJustificacionExitosaAlert()}

        <form
          onSubmit={handleSubmit}
          className={`space-y-6 ${justificacionExitosa ? 'mt-6' : ''}`}
        >
          {/* Tipo de Justificación */}
          <div className='space-y-2'>
            <Label htmlFor='tipo'>Tipo de Justificación</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: TipoJustificacion) =>
                handleTipoChange(value)
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder='Seleccione el tipo' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='individual'>Individual</SelectItem>
                <SelectItem value='departamental'>Departamental</SelectItem>
                <SelectItem value='masiva'>Masiva</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campos específicos por tipo */}
          {formData.tipo === 'individual' && (
            <div className='space-y-2'>
              <Label htmlFor='empleado'>Empleado</Label>
              <EmployeeSearch
                value={formData.empleado}
                onChange={(empleado) => setFormData({ ...formData, empleado })}
                disabled={loading}
                placeholder='Buscar empleado por nombre, RFC o CURP...'
              />
              {errors.empleado && (
                <p className='text-sm text-destructive'>{errors.empleado}</p>
              )}
            </div>
          )}

          {formData.tipo === 'departamental' && (
            <div className='space-y-2'>
              <Label htmlFor='departamento'>Departamento</Label>
              <DepartmentSearch
                value={formData.departamento}
                onChange={(departamento) =>
                  setFormData({ ...formData, departamento })
                }
                disabled={loading}
                placeholder='Buscar departamento...'
              />
              {errors.departamento && (
                <p className='text-sm text-destructive'>
                  {errors.departamento}
                </p>
              )}
            </div>
          )}

          {/* Campos de fecha */}
          {renderDateFields()}

          {/* Motivo */}
          <div className='space-y-2'>
            <Label htmlFor='motivo'>Motivo</Label>
            <Textarea
              id='motivo'
              placeholder='Ingrese el motivo de la justificación...'
              value={formData.motivo}
              onChange={(e) =>
                setFormData({ ...formData, motivo: e.target.value })
              }
              disabled={loading}
              rows={3}
            />
            {errors.motivo && (
              <p className='text-sm text-destructive'>{errors.motivo}</p>
            )}
          </div>

          {/* Botón de envío */}
          <Button type='submit' disabled={loading} className='w-full'>
            {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {loading ? 'Procesando...' : 'Crear Justificación'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
