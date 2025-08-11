// components/admin/JustificacionForm.tsx

'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  CalendarIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  Building,
  Globe,
  Send,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
import { useToast } from '@/components/ui/use-toast';
import { getApiErrorMessage } from '@/lib/api/api-helpers';

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
  empleadosAfectados?: number;
  fechasAfectadas: string;
  empleadoNombre?: string;
  departamentoNombre?: string;
}

const initialState: JustificacionFormData = {
  tipo: 'individual',
  empleado: null,
  departamento: null,
  fechaInicio: null,
  fechaFin: null,
  fecha: null,
  motivo: '',
};

export function JustificacionForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<JustificacionExitosa | null>(
    null
  );
  const [formData, setFormData] = useState<JustificacionFormData>(initialState);
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  const handleTipoChange = (tipo: TipoJustificacion) => {
    setFormData({ ...initialState, tipo });
    setError(null);
    setSuccessInfo(null);
  };

  const handleDateChange = (
    field: 'fechaInicio' | 'fechaFin' | 'fecha',
    date: Date | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: date || null }));
    setError(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.motivo.trim() || formData.motivo.trim().length < 10) {
      newErrors.motivo =
        'El motivo es requerido y debe tener al menos 10 caracteres.';
    }
    switch (formData.tipo) {
      case 'individual':
        if (!formData.empleado)
          newErrors.empleado = 'Debe seleccionar un empleado.';
        if (!formData.fechaInicio)
          newErrors.fechaInicio = 'La fecha de inicio es requerida.';
        if (
          formData.fechaInicio &&
          formData.fechaFin &&
          formData.fechaFin < formData.fechaInicio
        ) {
          newErrors.fechaFin =
            'La fecha de fin debe ser posterior a la de inicio.';
        }
        break;
      case 'departamental':
        if (!formData.departamento)
          newErrors.departamento = 'Debe seleccionar un departamento.';
        if (!formData.fecha) newErrors.fecha = 'La fecha es requerida.';
        break;
      case 'masiva':
        if (!formData.fecha) newErrors.fecha = 'La fecha es requerida.';
        break;
    }
    setError(Object.values(newErrors).join(' '));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessInfo(null);
    if (validateForm()) {
      setConfirmOpen(true);
    }
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    setError(null);
    setConfirmOpen(false);

    try {
      let response: any;
      let successPayload: Partial<JustificacionExitosa> = {
        tipo: formData.tipo,
      };

      switch (formData.tipo) {
        case 'individual':
          const individualData: JustificacionIndividualData = {
            empleadoId: formData.empleado!.id,
            fechaInicio: format(formData.fechaInicio!, 'yyyy-MM-dd'),
            fechaFin: format(
              formData.fechaFin || formData.fechaInicio!,
              'yyyy-MM-dd'
            ),
            motivo: formData.motivo.trim(),
          };
          response = await createJustificacionIndividual(individualData);
          successPayload.empleadoNombre = formData.empleado?.nombreCompleto;
          successPayload.fechasAfectadas = `${format(formData.fechaInicio!, 'dd/MM/yyyy')} - ${format(formData.fechaFin || formData.fechaInicio!, 'dd/MM/yyyy')}`;
          break;

        case 'departamental':
          const departamentalData: JustificacionDepartamentalData = {
            departamentoClave: formData.departamento!.clave,
            fecha: format(formData.fecha!, 'yyyy-MM-dd'),
            motivo: formData.motivo.trim(),
          };
          response = await createJustificacionDepartamental(departamentalData);
          successPayload.departamentoNombre = formData.departamento?.nombre;
          successPayload.fechasAfectadas = format(
            formData.fecha!,
            'dd/MM/yyyy'
          );
          successPayload.empleadosAfectados = response.empleadosAfectados;
          break;

        case 'masiva':
          const masivaData: JustificacionMasivaData = {
            fecha: format(formData.fecha!, 'yyyy-MM-dd'),
            motivo: formData.motivo.trim(),
          };
          response = await createJustificacionMasiva(masivaData);
          successPayload.fechasAfectadas = format(
            formData.fecha!,
            'dd/MM/yyyy'
          );
          successPayload.empleadosAfectados = response.empleadosAfectados;
          break;
      }

      setSuccessInfo(successPayload as JustificacionExitosa);
      toast({
        title: 'Justificación Creada',
        description: 'La operación se completó exitosamente.',
      });
      setFormData(initialState);
    } catch (err) {
      setError(getApiErrorMessage(err));
      toast({
        title: 'Error',
        description: getApiErrorMessage(err),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // --- INICIO DE LA CORRECCIÓN ---
  const getConfirmationDescription = () => {
    // Se agregan validaciones para asegurar que las fechas no sean nulas antes de formatear
    switch (formData.tipo) {
      case 'individual':
        if (formData.empleado && formData.fechaInicio) {
          const startDate = format(formData.fechaInicio, 'PPP', { locale: es });
          const endDate = format(
            formData.fechaFin || formData.fechaInicio,
            'PPP',
            { locale: es }
          );
          return `Se creará una justificación para el empleado ${formData.empleado.nombreCompleto} desde el ${startDate} hasta el ${endDate}.`;
        }
        return 'Por favor, complete los detalles de la justificación individual.';

      case 'departamental':
        if (formData.departamento && formData.fecha) {
          return `Se creará una justificación para TODOS los empleados del departamento ${formData.departamento.nombre} para la fecha ${format(formData.fecha, 'PPP', { locale: es })}.`;
        }
        return 'Por favor, complete los detalles de la justificación departamental.';

      case 'masiva':
        if (formData.fecha) {
          return `Se creará una justificación masiva para TODOS los empleados del sistema para la fecha ${format(formData.fecha, 'PPP', { locale: es })}. Esta acción es de alto impacto.`;
        }
        return 'Por favor, complete los detalles de la justificación masiva.';

      default:
        return '¿Está seguro de realizar esta acción?';
    }
  };
  // --- FIN DE LA CORRECCIÓN ---

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Crear Justificación</CardTitle>
          <CardDescription>
            Seleccione el tipo de justificación y complete los campos
            requeridos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant='destructive' className='mb-4'>
              <AlertCircle className='h-4 w-4' />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successInfo && (
            <Alert className='mb-4 border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-700 dark:[&>svg]:text-green-400'>
              <CheckCircle2 className='h-4 w-4' />
              <AlertTitle>¡Completado!</AlertTitle>
              <AlertDescription>
                Justificación de tipo <strong>{successInfo.tipo}</strong> creada
                para las fechas <strong>{successInfo.fechasAfectadas}</strong>.
                {successInfo.empleadoNombre &&
                  ` Empleado: ${successInfo.empleadoNombre}.`}
                {successInfo.departamentoNombre &&
                  ` Departamento: ${successInfo.departamentoNombre}.`}
                {typeof successInfo.empleadosAfectados !== 'undefined' &&
                  ` Empleados afectados: ${successInfo.empleadosAfectados}.`}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-2'>
              <Label>Tipo de Justificación</Label>
              <Select
                value={formData.tipo}
                onValueChange={(v) => handleTipoChange(v as TipoJustificacion)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Seleccione el tipo' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='individual'>
                    <div className='flex items-center gap-2'>
                      <User /> Individual
                    </div>
                  </SelectItem>
                  <SelectItem value='departamental'>
                    <div className='flex items-center gap-2'>
                      <Building /> Departamental
                    </div>
                  </SelectItem>
                  <SelectItem value='masiva'>
                    <div className='flex items-center gap-2'>
                      <Globe /> Masiva
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.tipo === 'individual' && (
              <div className='space-y-2'>
                <Label>Empleado</Label>
                <EmployeeSearch
                  value={formData.empleado}
                  onChange={(emp) =>
                    setFormData((f) => ({ ...f, empleado: emp }))
                  }
                  disabled={loading}
                />
              </div>
            )}

            {formData.tipo === 'departamental' && (
              <div className='space-y-2'>
                <Label>Departamento</Label>
                <DepartmentSearch
                  value={formData.departamento}
                  onChange={(dep) =>
                    setFormData((f) => ({ ...f, departamento: dep }))
                  }
                  disabled={loading}
                />
              </div>
            )}

            {formData.tipo === 'individual' ? (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Fecha de Inicio</Label>
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
                          <span>Seleccione fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0'>
                      <Calendar
                        mode='single'
                        selected={formData.fechaInicio ?? undefined}
                        onSelect={(d) => handleDateChange('fechaInicio', d)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className='space-y-2'>
                  <Label>Fecha de Fin (Opcional)</Label>
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
                          <span>Igual a fecha de inicio</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0'>
                      <Calendar
                        mode='single'
                        selected={formData.fechaFin ?? undefined}
                        onSelect={(d) => handleDateChange('fechaFin', d)}
                        disabled={{
                          before: formData.fechaInicio ?? new Date(0),
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            ) : (
              <div className='space-y-2'>
                <Label>Fecha</Label>
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
                      onSelect={(d) => handleDateChange('fecha', d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className='space-y-2'>
              <Label>Motivo</Label>
              <Textarea
                placeholder='Describa el motivo de la justificación (mínimo 10 caracteres)'
                value={formData.motivo}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, motivo: e.target.value }))
                }
                disabled={loading}
                rows={3}
              />
            </div>

            <Button type='submit' disabled={loading} className='w-full'>
              {loading ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Send className='mr-2 h-4 w-4' />
              )}
              {loading ? 'Procesando...' : 'Crear Justificación'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={isConfirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              {getConfirmationDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit} disabled={loading}>
              {loading ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                'Confirmar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
