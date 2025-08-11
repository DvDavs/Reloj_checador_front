'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  CalendarIcon,
  Loader2,
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  Eye,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useToast } from '@/components/ui/use-toast';

import { EmployeeSearch } from '@/app/components/shared/employee-search';
import {
  EmpleadoSimpleDTO,
  HorarioTemplateDTO,
} from '@/app/horarios/asignados/registrar/types';
import {
  createRegistroManual,
  RegistroManualData,
} from '@/lib/api/registro-manual.api';
import { getApiErrorMessage } from '@/lib/api/api-helpers';
import { SchedulePreviewModal } from '@/app/components/shared/SchedulePreviewModal';
import { apiClient } from '@/lib/apiClient';
import { adaptHorarioTemplate } from '@/lib/adapters/horario-adapter';

interface RegistroManualFormData {
  empleado: EmpleadoSimpleDTO | null;
  fecha: Date | null;
  hora: string;
  motivo: string;
}

interface RegistroExitoso {
  empleadoNombre: string;
  fechaHora: string;
  tipo: string;
}

const initialState: RegistroManualFormData = {
  empleado: null,
  fecha: null,
  hora: '',
  motivo: '',
};

export function RegistroManualForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<RegistroExitoso | null>(null);
  const [formData, setFormData] =
    useState<RegistroManualFormData>(initialState);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] =
    useState<HorarioTemplateDTO | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.empleado)
      newErrors.empleado = 'Debe seleccionar un empleado.';
    if (!formData.fecha) newErrors.fecha = 'La fecha es requerida.';
    if (!/^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]$/.test(formData.hora))
      newErrors.hora = 'El formato de hora debe ser HH:MM.';
    if (!formData.motivo.trim() || formData.motivo.trim().length < 10)
      newErrors.motivo = 'El motivo es requerido (mínimo 10 caracteres).';

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
      const fechaHora = `${format(formData.fecha!, 'yyyy-MM-dd')} ${formData.hora}:00`;
      const registroData: RegistroManualData = {
        empleadoId: formData.empleado!.id,
        fechaHora,
        motivo: formData.motivo.trim(),
      };

      const response = await createRegistroManual(registroData);

      setSuccessInfo({
        empleadoNombre: formData.empleado!.nombreCompleto,
        fechaHora: format(new Date(response.data.fechaHora), 'PPPp', {
          locale: es,
        }),
        tipo: response.data.tipoEoS === 'E' ? 'Entrada' : 'Salida',
      });

      toast({
        title: 'Registro Creado',
        description: `Registro de ${response.data.tipoEoS === 'E' ? 'entrada' : 'salida'} creado para ${formData.empleado!.nombreCompleto}.`,
      });

      setFormData(initialState);
    } catch (err) {
      const errorMessage = getApiErrorMessage(err);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openEmployeeSchedulePreview = async () => {
    setPreviewError(null);
    setPreviewTemplate(null);
    setPreviewOpen(true);

    if (!formData.empleado) {
      setPreviewError('Seleccione un empleado para ver su horario.');
      return;
    }

    try {
      setPreviewLoading(true);
      const empleadoId = formData.empleado.id;
      const asignacionesResp = await apiClient.get(
        `/api/horarios-asignados/empleado/${empleadoId}`
      );
      const asignaciones: any[] = asignacionesResp.data || [];

      if (!asignaciones.length) {
        setPreviewError('El empleado no tiene horarios asignados.');
        return;
      }

      // Elegir la asignación más reciente (o sin fecha fin)
      const sorted = [...asignaciones].sort((a, b) => {
        const aDate = a.fechaInicio ? new Date(a.fechaInicio).getTime() : 0;
        const bDate = b.fechaInicio ? new Date(b.fechaInicio).getTime() : 0;
        return bDate - aDate;
      });
      const selected = sorted.find((a) => !a.fechaFin) ?? sorted[0];

      const horarioResp = await apiClient.get(
        `/api/horarios/${selected.horarioId}`
      );
      const template = adaptHorarioTemplate(horarioResp.data);
      setPreviewTemplate(template);
    } catch (err) {
      setPreviewError(getApiErrorMessage(err));
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Crear Registro Manual</CardTitle>
          <CardDescription>
            Esta herramienta crea un registro de checada retroactivo.
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
              <AlertTitle>¡Registro Completado!</AlertTitle>
              <AlertDescription>
                Se creó un registro de <strong>{successInfo.tipo}</strong> para{' '}
                <strong>{successInfo.empleadoNombre}</strong> el{' '}
                <strong>{successInfo.fechaHora}</strong>.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-2'>
              <Label>Empleado</Label>
              <div className='flex items-center gap-2'>
                <div className='flex-1'>
                  <EmployeeSearch
                    value={formData.empleado}
                    onChange={(emp) =>
                      setFormData((f) => ({ ...f, empleado: emp }))
                    }
                    disabled={loading}
                  />
                </div>
                <Button
                  type='button'
                  variant='outline'
                  size='icon'
                  title='Vista previa del horario del empleado'
                  aria-label='Vista previa del horario del empleado'
                  onClick={openEmployeeSchedulePreview}
                  disabled={loading || !formData.empleado}
                >
                  <Eye className='h-4 w-4' />
                </Button>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
                      onSelect={(d) =>
                        setFormData((f) => ({ ...f, fecha: d || null }))
                      }
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className='space-y-2'>
                <Label>Hora (Formato 24h)</Label>
                <Input
                  type='text'
                  placeholder='HH:MM'
                  value={formData.hora}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, hora: e.target.value }))
                  }
                  disabled={loading}
                  maxLength={5}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Motivo</Label>
              <Textarea
                placeholder='Describa el motivo del registro manual (ej: Falla de lector)'
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
              {loading ? 'Procesando...' : 'Crear Registro'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={isConfirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar Registro Manual?</AlertDialogTitle>
            <AlertDialogDescription>
              Se creará un registro de checada para{' '}
              <strong>{formData.empleado?.nombreCompleto}</strong> el{' '}
              <strong>
                {formData.fecha
                  ? format(formData.fecha, 'PPP', { locale: es })
                  : ''}{' '}
                a las {formData.hora}
              </strong>
              . Esta acción afectará su cálculo de asistencia.
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

      <SchedulePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setPreviewOpen(false)}
        template={previewTemplate}
        isLoading={previewLoading}
        error={previewError}
      />
    </>
  );
}
