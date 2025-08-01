"use client";

import { Badge } from "@/components/ui/badge";
import { WeeklySchedule, DayOfWeek } from "@/app/components/shared/WeeklyScheduleGrid";

interface ScheduleDisplayProps {
  schedule: Partial<WeeklySchedule>;
}

const DAYS_ORDER: DayOfWeek[] = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

const formatDayName = (day: DayOfWeek) => {
  const formatted = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
  return formatted.replace("miercoles", "Miércoles").replace("sabado", "Sábado");
};

export function ScheduleDisplay({ schedule }: ScheduleDisplayProps) {
  
  const hasAnyTimeSlots = DAYS_ORDER.some(day => (schedule[day] || []).length > 0);

  if (!hasAnyTimeSlots) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-muted-foreground text-center">
          Esta plantilla no tiene ningún turno asignado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {DAYS_ORDER.map((day) => {
        const slots = schedule[day] || [];
        const sortedSlots = [...slots].sort((a, b) => a.horaEntrada.localeCompare(b.horaEntrada));

        return (
          <div 
            key={day} 
            className="grid grid-cols-1 md:grid-cols-3 items-start gap-x-4 gap-y-1 p-3 rounded-md transition-colors hover:bg-muted/50"
          >
            <div className="font-semibold text-foreground">
              {formatDayName(day)}
            </div>
            <div className="md:col-span-2">
              {sortedSlots.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {sortedSlots.map((slot, index) => (
                    <Badge key={index} variant="secondary" className="text-sm font-mono px-2 py-1">
                      {slot.horaEntrada} - {slot.horaSalida}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Sin turnos asignados</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
} 