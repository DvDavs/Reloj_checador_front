'use client';

import {
  DayOfWeek,
  WeeklySchedule,
} from '@/app/components/shared/WeeklyScheduleGrid';

export interface HorarioDto {
  id: number;
  nombre: string;
  detalles: DetalleHorarioDto[];
}

export interface DetalleHorarioDto {
  id: number;
  diaSemana: number; // Domingo=1, Lunes=2, ..., Sábado=7
  horaEntrada: string;
  horaSalida: string;
  turno: number;
}

export interface HorarioTemplate {
  id: number;
  nombre: string;
  activo: boolean;
}

export const weeklyScheduleToDetalles = (
  schedule: WeeklySchedule
): Omit<DetalleHorarioDto, 'id'>[] => {
  const detalles: Omit<DetalleHorarioDto, 'id'>[] = [];
  const dayNameToIndex: { [key in DayOfWeek]: number } = {
    DOMINGO: 1,
    LUNES: 2,
    MARTES: 3,
    MIERCOLES: 4,
    JUEVES: 5,
    VIERNES: 6,
    SABADO: 7,
  };

  for (const day in schedule) {
    if (Object.prototype.hasOwnProperty.call(schedule, day)) {
      const daySlots = schedule[day as DayOfWeek] || [];
      daySlots.forEach((slot) => {
        detalles.push({
          diaSemana: dayNameToIndex[day as DayOfWeek],
          horaEntrada: slot.horaEntrada,
          horaSalida: slot.horaSalida,
          turno: 1, // Asumimos turno 1, esto puede ajustarse si hay múltiples turnos por día.
        });
      });
    }
  }
  return detalles;
};

const dayOfWeekMapping: DayOfWeek[] = [
  'DOMINGO',
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
];

export const detallesToWeeklySchedule = (
  detalles: DetalleHorarioDto[]
): WeeklySchedule => {
  const schedule: WeeklySchedule = {
    DOMINGO: [],
    LUNES: [],
    MARTES: [],
    MIERCOLES: [],
    JUEVES: [],
    VIERNES: [],
    SABADO: [],
  };

  detalles.forEach((detalle) => {
    const dayName = dayOfWeekMapping[detalle.diaSemana - 1];

    if (dayName) {
      schedule[dayName].push({
        horaEntrada: detalle.horaEntrada,
        horaSalida: detalle.horaSalida,
      });
    }
  });

  return schedule;
};
