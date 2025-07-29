"use client";

import { DayOfWeek, WeeklySchedule } from "@/app/components/shared/WeeklyScheduleGrid";

export interface HorarioDto {
  id: number;
  nombre: string;
  detalles: DetalleHorarioDto[];
}

export interface DetalleHorarioDto {
    id: number;
    diaSemana: number;
    horaEntrada: string;
    horaSalida: string;
    turno: number;
}

export interface HorarioTemplate {
    id: number;
    nombre: string;
    activo: boolean;
}

export const weeklyScheduleToDetalles = (schedule: WeeklySchedule): Omit<DetalleHorarioDto, 'id'>[] => {
    const detalles: Omit<DetalleHorarioDto, 'id'>[] = [];
    const dayNameToIndex: { [key in DayOfWeek]: number } = {
        LUNES: 1,
        MARTES: 2,
        MIERCOLES: 3,
        JUEVES: 4,
        VIERNES: 5,
        SABADO: 6,
        DOMINGO: 7,
    };

    for (const day in schedule) {
        if (Object.prototype.hasOwnProperty.call(schedule, day)) {
            const daySlots = schedule[day as DayOfWeek] || [];
            daySlots.forEach(slot => {
                detalles.push({
                    diaSemana: dayNameToIndex[day as DayOfWeek],
                    horaEntrada: slot.horaEntrada,
                    horaSalida: slot.horaSalida,
                    turno: 1 // Assuming 1 represents a valid turn, adjust if necessary
                });
            });
        }
    }
    return detalles;
};

const dayOfWeekMapping: DayOfWeek[] = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

export const detallesToWeeklySchedule = (detalles: DetalleHorarioDto[]): WeeklySchedule => {
    const schedule: WeeklySchedule = {
        LUNES: [],
        MARTES: [],
        MIERCOLES: [],
        JUEVES: [],
        VIERNES: [],
        SABADO: [],
        DOMINGO: [],
    };

    detalles.forEach(detalle => {
        // API sends diaSemana as a number (1-7), map it to the string representation
        const dayName = dayOfWeekMapping[detalle.diaSemana - 1];
        
        if (dayName) {
            schedule[dayName].push({
                horaEntrada: detalle.horaEntrada,
                horaSalida: detalle.horaSalida
            });
        }
    });

    return schedule;
}; 