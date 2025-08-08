'use client';

import * as React from 'react';
import { useState } from 'react';
import { CalendarIcon, Loader2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

import { EmployeeSearch } from '@/app/components/shared/employee-search';
import { EmpleadoSimpleDTO } from '@/app/horarios/asignados/registrar/types';
import {
  createRegistroManual,
  RegistroManualData,
} from '@/lib/api/registro-manual.api';
import { useToast } from '@/components/ui/use-toast';

interface RegistroManualFormData {
  empleado: EmpleadoSimpleDTO | null;
  fecha: Date | null;
  hora: string;
  motivo: string;
}

interface RegistroManualFormProps {
  onSuccess?: () => void;
}

export function RegistroManualForm({ onSuccess }: RegistroManualFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<RegistroManualFormData>({
    empleado: null,
    fecha: null,
    hora: '',
    motivo: '',
  });

  const handleDateChange = (date: Date | undefined) => {
    setFormData({
      ...formData,
      fecha: date || null,
    });

    // Clear date error
    if (errors.fecha) {
      setErrors({
        ...errors,
        fecha: '',
      });
    }
  };

  const handleHoraChange = (value: string) => {
    // Allow only time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const partialTimeRegex = /^([0-1]?[0-9]|2[0-3])?:?[0-5]?[0-9]?$/;

    // Allow partial input while typing
    if (partialTimeRegex.test(value) || value === '') {
      setFormData({
        ...formData,
        hora: value,
      });

      // Clear hora error if format is now valid
      if (errors.hora && (timeRegex.test(value) || value === '')) {
        setErrors({
          ...errors,
          hora: '',
        });
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar empleado
    if (!formData.empleado) {
      newErrors.empleado = 'Debe seleccionar un empleado';
    }

    // Validar fecha
    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida';
    } else {
      // Validar que la fecha no sea futura
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Set to end of today
      if (formData.fecha > today) {
        newErrors.fecha = 'La fecha no puede ser futura';
      }
    }

    // Validar hora
    if (!formData.hora.trim()) {
      newErrors.hora = 'La hora es requerida';
    } else {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(formData.hora)) {
        newErrors.hora = 'Formato de hora inválido (HH:MM)';
      }
    }

    // Validar motivo
    if (!formData.motivo.trim()) {
      newErrors.motivo = 'El motivo es requerido';
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
      // Combine date and time into fechaHora format
      const fechaStr = format(formData.fecha!, 'yyyy-MM-dd');
      const fechaHora = `${fechaStr} ${formData.hora}:00`;

      const registroData: RegistroManualData = {
        empleadoId: formData.empleado!.id,
        fechaHora,
        motivo: formData.motivo.trim(),
      };

      const response = await createRegistroManual(registroData);

      toast({
        title: 'Registro creado exitosamente',
        description: `Registro manual creado para ${response.empleado.nombreCompleto}. Tipo: ${response.tipo}`,
      });

      // Reset form
      setFormData({
        empleado: null,
        fecha: null,
        hora: '',
        motivo: '',
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.message || 'Ocurrió un error al crear el registro manual',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Registro Manual</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Empleado */}
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

          {/* Fecha */}
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
                  onSelect={handleDateChange}
                  disabled={{ after: new Date() }} // Disable future dates
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.fecha && (
              <p className='text-sm text-destructive'>{errors.fecha}</p>
            )}
          </div>

          {/* Hora */}
          <div className='space-y-2'>
            <Label htmlFor='hora'>Hora</Label>
            <div className='relative'>
              <Clock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                id='hora'
                type='text'
                placeholder='HH:MM (ej: 08:30)'
                value={formData.hora}
                onChange={(e) => handleHoraChange(e.target.value)}
                disabled={loading}
                className='pl-10'
                maxLength={5}
              />
            </div>
            {errors.hora && (
              <p className='text-sm text-destructive'>{errors.hora}</p>
            )}
            <p className='text-xs text-muted-foreground'>
              Formato de 24 horas (HH:MM). El sistema determinará
              automáticamente si es entrada o salida.
            </p>
          </div>

          {/* Motivo */}
          <div className='space-y-2'>
            <Label htmlFor='motivo'>Motivo</Label>
            <Textarea
              id='motivo'
              placeholder='Ingrese el motivo del registro manual (ej: Falla de luz en el área de trabajo)...'
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
            {loading ? 'Creando registro...' : 'Crear Registro Manual'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
