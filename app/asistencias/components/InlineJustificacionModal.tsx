'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import { format, parse, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2, Send } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

import { AsistenciaRecord } from '@/lib/api/asistencia.api';
import { createJustificacionIndividual } from '@/lib/api/justificaciones.api';

interface InlineJustificacionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asistencia: AsistenciaRecord | null;
  onSuccess: () => void;
}

export function InlineJustificacionModal({
  open,
  onOpenChange,
  asistencia,
  onSuccess,
}: InlineJustificacionModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(undefined);
  const [fechaFin, setFechaFin] = useState<Date | undefined>(undefined);
  const [motivo, setMotivo] = useState('');
  const [numOficio, setNumOficio] = useState('');

  React.useEffect(() => {
    if (asistencia) {
      try {
        const f = parse(asistencia.fecha, 'yyyy-MM-dd', new Date());
        setFechaInicio(f);
        setFechaFin(f);
      } catch (_) {
        setFechaInicio(undefined);
        setFechaFin(undefined);
      }
      setMotivo('');
      setNumOficio('');
      setError(null);
    }
  }, [asistencia]);

  const empleadoLabel = useMemo(() => {
    if (!asistencia) return '';
    const tarjeta = asistencia.empleadoTarjeta ?? 'N/A';
    return `${asistencia.empleadoNombre} (${tarjeta})`;
  }, [asistencia]);

  const handleSubmit = async () => {
    setError(null);
    if (!asistencia || !fechaInicio) {
      setError('Faltan datos de la asistencia o la fecha de inicio.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        empleadoId: asistencia.empleadoId,
        fechaInicio: format(fechaInicio, 'yyyy-MM-dd'),
        fechaFin: format(fechaFin || fechaInicio, 'yyyy-MM-dd'),
        motivo: motivo.trim() || undefined,
      };
      if (numOficio.trim()) payload.numOficio = numOficio.trim();
      await createJustificacionIndividual(payload);
      toast({
        title: 'Justificación creada',
        description: 'La asistencia será consolidada automáticamente.',
      });
      onOpenChange(false);
      onSuccess();
    } catch (e: any) {
      setError(e?.message || 'Error al crear la justificación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Justificación del día</DialogTitle>
        </DialogHeader>

        {asistencia && (
          <div className='space-y-4'>
            <div>
              <div className='text-sm text-muted-foreground'>Empleado</div>
              <div className='font-medium'>{empleadoLabel}</div>
            </div>

            {error && (
              <Alert variant='destructive'>
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Fecha Inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant='outline' className='w-full justify-start'>
                      <CalendarIcon className='mr-2 h-4 w-4' />
                      {fechaInicio
                        ? format(fechaInicio, 'PPP', { locale: es })
                        : 'Seleccionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0'>
                    <Calendar
                      mode='single'
                      selected={fechaInicio}
                      onSelect={(d) => setFechaInicio(d || undefined)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className='space-y-2'>
                <Label>Fecha Fin (opcional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant='outline' className='w-full justify-start'>
                      <CalendarIcon className='mr-2 h-4 w-4' />
                      {fechaFin
                        ? format(fechaFin, 'PPP', { locale: es })
                        : 'Seleccionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0'>
                    <Calendar
                      mode='single'
                      selected={fechaFin}
                      onSelect={(d) => setFechaFin(d || undefined)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className='space-y-2 sm:col-span-2'>
                <Label>Motivo (opcional)</Label>
                <Textarea
                  placeholder='Describa el motivo de la justificación (opcional)'
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={3}
                />
              </div>

              <div className='space-y-2 sm:col-span-2'>
                <Label>Número de Oficio (opcional)</Label>
                <Textarea
                  placeholder='Ej. OF/1234/2025'
                  value={numOficio}
                  onChange={(e) => setNumOficio(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !asistencia}>
            {loading ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <Send className='mr-2 h-4 w-4' />
            )}
            {loading ? 'Guardando...' : 'Guardar Justificación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
