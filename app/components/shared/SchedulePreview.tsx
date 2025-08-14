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
    <Card
      className={cn('w-full bg-white border-gray-200 shadow-sm', className)}
    >
      <CardHeader className='pb-4 bg-gray-50/50 border-b border-gray-100'>
        <div className='flex items-start justify-between'>
          <div className='space-y-2'>
            <CardTitle className='text-xl font-semibold flex items-center gap-3 text-gray-900'>
              <Calendar className='h-5 w-5 text-blue-600' />
              {template.nombre}
            </CardTitle>
            {template.descripcion && (
              <p className='text-sm text-gray-600 leading-relaxed'>
                {template.descripcion}
              </p>
            )}
          </div>
          <div className='flex flex-col items-end gap-2'>
            {template.esHorarioJefe && (
              <Badge className='bg-amber-100 text-amber-800 border-amber-200 text-xs font-medium px-2 py-1'>
                Horario Jefe
              </Badge>
            )}
            <Badge className='bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium px-2 py-1'>
              {workingDays} días • {totalShifts} turnos
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className='pt-6 pb-6'>
        <div className='space-y-4'>
          {DAYS_ORDER.map((day) => {
            const dayShifts = scheduleByDay[day];
            if (!dayShifts || dayShifts.length === 0) {
              return (
                <div
                  key={day}
                  className='flex items-center gap-4 py-3 border-b border-gray-100 last:border-b-0'
                >
                  <div className='w-12 text-sm font-medium text-gray-400'>
                    {DAY_LABELS[day]}
                  </div>
                  <div className='text-sm text-gray-400 italic'>
                    Sin horario asignado
                  </div>
                </div>
              );
            }

            return (
              <div
                key={day}
                className='flex items-start gap-4 py-3 border-b border-gray-100 last:border-b-0'
              >
                <div className='w-12 text-sm font-semibold text-gray-700 pt-1'>
                  {DAY_LABELS[day]}
                </div>
                <div className='flex-1 space-y-2'>
                  {dayShifts.map((shift, idx) => (
                    <div
                      key={`${day}-${shift.turno}-${idx}`}
                      className='flex items-center gap-3'
                    >
                      <div className='flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm'>
                        <Clock className='h-4 w-4 text-blue-600' />
                        <span className='font-mono font-medium text-gray-900'>
                          {getTimeRange(shift.horaEntrada, shift.horaSalida)}
                        </span>
                      </div>
                      <div className='text-sm text-gray-600 font-medium'>
                        {calculateDuration(shift.horaEntrada, shift.horaSalida)}
                      </div>
                      {dayShifts.length > 1 && (
                        <Badge className='bg-gray-100 text-gray-700 border-gray-200 text-xs font-medium px-2 py-1'>
                          Turno {shift.turno}
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
