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
): {
  diaSemana: DayOfWeek;
  horaEntrada: string;
  horaSalida: string;
  turno: number;
}[] => {
  const detalles: {
    diaSemana: DayOfWeek;
    horaEntrada: string;
    horaSalida: string;
    turno: number;
  }[] = [];

  for (const day in schedule) {
    if (Object.prototype.hasOwnProperty.call(schedule, day)) {
      const daySlots = schedule[day as DayOfWeek] || [];

      daySlots.sort((a, b) => a.horaEntrada.localeCompare(b.horaEntrada));

      daySlots.forEach((slot, index) => {
        detalles.push({
          diaSemana: day as DayOfWeek,
          horaEntrada: slot.horaEntrada,
          horaSalida: slot.horaSalida,
          turno: index + 1,
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
