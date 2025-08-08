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
import { AlertCircle } from 'lucide-react';

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

interface JustificacionFormProps {
  onSuccess?: () => void;
}

export function JustificacionForm({ onSuccess }: JustificacionFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
      switch (formData.tipo) {
        case 'individual':
          const individualData: JustificacionIndividualData = {
            empleadoId: formData.empleado!.id,
            fechaInicio: format(formData.fechaInicio!, 'yyyy-MM-dd'),
            fechaFin: format(formData.fechaFin!, 'yyyy-MM-dd'),
            motivo: formData.motivo.trim(),
          };
          await createJustificacionIndividual(individualData);
          break;

        case 'departamental':
          const departamentalData: JustificacionDepartamentalData = {
            departamentoId: parseInt(formData.departamento!.clave, 10), // Using clave as the ID
            fecha: format(formData.fecha!, 'yyyy-MM-dd'),
            motivo: formData.motivo.trim(),
          };
          await createJustificacionDepartamental(departamentalData);
          break;

        case 'masiva':
          const masivaData: JustificacionMasivaData = {
            fecha: format(formData.fecha!, 'yyyy-MM-dd'),
            motivo: formData.motivo.trim(),
          };
          await createJustificacionMasiva(masivaData);
          break;
      }

      toast({
        title: 'Justificación creada',
        description: 'La justificación se ha procesado correctamente.',
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
        title: 'Error',
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Justificación</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
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
