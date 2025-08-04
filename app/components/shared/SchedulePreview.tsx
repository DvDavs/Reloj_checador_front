'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types matching the API structure
export interface DetalleHorarioDTO {
  id?: number;
  diaSemana:
    | 'LUNES'
    | 'MARTES'
    | 'MIERCOLES'
    | 'JUEVES'
    | 'VIERNES'
    | 'SABADO'
    | 'DOMINGO';
  horaEntrada: string; // "HH:mm"
  horaSalida: string; // "HH:mm"
  turno: number;
}

export interface HorarioTemplateDTO {
  id: number;
  nombre: string;
  descripcion: string;
  esHorarioJefe: boolean;
  detalles: DetalleHorarioDTO[];
}

interface SchedulePreviewProps {
  template: HorarioTemplateDTO;
  className?: string;
}

const DAYS_ORDER = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
] as const;

const DAY_LABELS = {
  LUNES: 'Lun',
  MARTES: 'Mar',
  MIERCOLES: 'Mié',
  JUEVES: 'Jue',
  VIERNES: 'Vie',
  SABADO: 'Sáb',
  DOMINGO: 'Dom',
};

const formatTime = (time: string) => {
  // Ensure format is HH:mm
  if (time.length === 5) return time;
  if (time.length === 4) return '0' + time;
  return time;
};

const getTimeRange = (entrada: string, salida: string) => {
  return `${formatTime(entrada)} - ${formatTime(salida)}`;
};

const calculateDuration = (entrada: string, salida: string) => {
  const [entradaHours, entradaMinutes] = entrada.split(':').map(Number);
  const [salidaHours, salidaMinutes] = salida.split(':').map(Number);

  const entradaTotal = entradaHours * 60 + entradaMinutes;
  let salidaTotal = salidaHours * 60 + salidaMinutes;

  // Handle next day scenarios
  if (salidaTotal <= entradaTotal) {
    salidaTotal += 24 * 60;
  }

  const diffMinutes = salidaTotal - entradaTotal;
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
};

export default function SchedulePreview({
  template,
  className,
}: SchedulePreviewProps) {
  // Group details by day
  const scheduleByDay = React.useMemo(() => {
    const grouped: Record<string, DetalleHorarioDTO[]> = {};

    template.detalles.forEach((detalle) => {
      if (!grouped[detalle.diaSemana]) {
        grouped[detalle.diaSemana] = [];
      }
      grouped[detalle.diaSemana].push(detalle);
    });

    // Sort shifts by time for each day
    Object.keys(grouped).forEach((day) => {
      grouped[day].sort((a, b) => {
        const timeA = a.horaEntrada.split(':').map(Number);
        const timeB = b.horaEntrada.split(':').map(Number);
        return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
      });
    });

    return grouped;
  }, [template.detalles]);

  const totalShifts = template.detalles.length;
  const workingDays = Object.keys(scheduleByDay).length;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='space-y-1'>
            <CardTitle className='text-lg flex items-center gap-2'>
              <Calendar className='h-5 w-5 text-primary' />
              {template.nombre}
            </CardTitle>
            {template.descripcion && (
              <p className='text-sm text-muted-foreground'>
                {template.descripcion}
              </p>
            )}
          </div>
          <div className='flex flex-col items-end gap-1'>
            {template.esHorarioJefe && (
              <Badge variant='secondary' className='text-xs'>
                Horario Jefe
              </Badge>
            )}
            <Badge variant='outline' className='text-xs'>
              {workingDays} días • {totalShifts} turnos
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className='pt-0'>
        <div className='space-y-3'>
          {DAYS_ORDER.map((day) => {
            const dayShifts = scheduleByDay[day];
            if (!dayShifts || dayShifts.length === 0) {
              return (
                <div
                  key={day}
                  className='flex items-center gap-3 py-2 opacity-50'
                >
                  <div className='w-10 text-xs font-medium text-muted-foreground'>
                    {DAY_LABELS[day]}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    Sin horario
                  </div>
                </div>
              );
            }

            return (
              <div key={day} className='flex items-center gap-3 py-1'>
                <div className='w-10 text-xs font-medium'>
                  {DAY_LABELS[day]}
                </div>
                <div className='flex-1 space-y-1'>
                  {dayShifts.map((shift, idx) => (
                    <div
                      key={`${day}-${shift.turno}-${idx}`}
                      className='flex items-center gap-2'
                    >
                      <div className='flex items-center gap-1 bg-primary/10 rounded-md px-2 py-1 text-xs'>
                        <Clock className='h-3 w-3 text-primary' />
                        <span className='font-mono'>
                          {getTimeRange(shift.horaEntrada, shift.horaSalida)}
                        </span>
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        {calculateDuration(shift.horaEntrada, shift.horaSalida)}
                      </div>
                      {dayShifts.length > 1 && (
                        <Badge variant='outline' className='text-xs h-4 px-1'>
                          T{shift.turno}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
