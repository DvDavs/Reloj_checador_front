"use client";

import * as React from "react";
import { Edit, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetalleHorarioDTO } from "@/app/horarios/asignados/registrar/types";
import { cn } from "@/lib/utils";
import { ScheduleEditorModal } from "./schedule-editor-modal";

export const DIAS_SEMANA = [
  "LUNES",
  "MARTES",
  "MIERCOLES",
  "JUEVES",
  "VIERNES",
  "SABADO",
  "DOMINGO",
] as const;

type DiaSemana = (typeof DIAS_SEMANA)[number];

export interface TimeSlot {
  id?: string;
  horaEntrada: string;
  horaSalida: string;
  error?: string;
}

interface ScheduleGridEditorProps {
  value: DetalleHorarioDTO[];
  onChange: (value: DetalleHorarioDTO[]) => void;
  className?: string;
}

export function ScheduleGridEditor({ value, onChange, className }: ScheduleGridEditorProps) {
  const [schedule, setSchedule] = React.useState<Record<DiaSemana, TimeSlot[]>>(() => {
    const initial: Record<DiaSemana, TimeSlot[]> = {} as any;
    DIAS_SEMANA.forEach(dia => initial[dia] = []);
    value.forEach(detalle => {
      if (initial[detalle.diaSemana]) {
        initial[detalle.diaSemana].push({
          id: detalle.id?.toString() || crypto.randomUUID(),
          horaEntrada: detalle.horaEntrada,
          horaSalida: detalle.horaSalida,
        });
      }
    });
    return initial;
  });

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingDay, setEditingDay] = React.useState<DiaSemana | null>(null);

  React.useEffect(() => {
    const detailsByDay: { [key: string]: DetalleHorarioDTO[] } = {} as any;
    DIAS_SEMANA.forEach(d => { detailsByDay[d] = []; });
    
    value.forEach(v => {
      if (detailsByDay[v.diaSemana]) {
        detailsByDay[v.diaSemana].push(v);
      }
    });

    const newDetails: DetalleHorarioDTO[] = [];
    DIAS_SEMANA.forEach(dia => {
      const sortedTurnos = [...detailsByDay[dia]].sort((a,b) => a.horaEntrada.localeCompare(b.horaEntrada));
      sortedTurnos.forEach((detalle, index) => {
        newDetails.push({
          ...detalle,
          turno: index + 1
        });
      });
    });

    if (JSON.stringify(newDetails) !== JSON.stringify(value)) {
      onChange(newDetails);
    }
  }, [value, onChange]);

  const updateAndNotify = React.useCallback((newSchedule: Record<DiaSemana, TimeSlot[]>) => {
    const newDetails: DetalleHorarioDTO[] = [];
    let hasErrors = false;

    for (const dia of DIAS_SEMANA) {
      const turnos = newSchedule[dia];
      const sortedTurnos = [...turnos].sort((a, b) => a.horaEntrada.localeCompare(b.horaEntrada));

      for (let i = 0; i < sortedTurnos.length; i++) {
        const turno = sortedTurnos[i];
        let error: string | undefined = undefined;

        if (turno.horaEntrada && turno.horaSalida && turno.horaEntrada >= turno.horaSalida) {
          error = "Salida debe ser mayor a entrada.";
        }
        if (!error && i > 0) {
          const prevTurno = sortedTurnos[i - 1];
          if (prevTurno.horaSalida > turno.horaEntrada) {
            error = "Turno se solapa con el anterior.";
          }
        }
        if(error) hasErrors = true;
        
        const originalTurno = newSchedule[dia].find(t => t.id === turno.id);
        if(originalTurno) originalTurno.error = error;
        
        newDetails.push({
          diaSemana: dia,
          turno: i + 1,
          horaEntrada: turno.horaEntrada,
          horaSalida: turno.horaSalida,
        });
      }
    }
    setSchedule(newSchedule);
    if (!hasErrors) {
      onChange(newDetails);
    }
  }, [onChange]);

  const handleOpenModal = (dia: DiaSemana) => {
    setEditingDay(dia);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDay(null);
  };

  const handleSaveShifts = (newShifts: Omit<TimeSlot, 'id' | 'error'>[]) => {
    if (editingDay) {
      const newSchedule = { ...schedule };
      newSchedule[editingDay] = newShifts.map(s => ({...s, id: crypto.randomUUID()}));
      updateAndNotify(newSchedule);
    }
  };
  
  const formatShifts = (shifts: TimeSlot[]) => {
    if (shifts.length === 0) return <span className="text-sm text-muted-foreground">Sin turnos</span>;
    return shifts.map(s => `${s.horaEntrada.slice(0,5)} - ${s.horaSalida.slice(0,5)}`).join(', ');
  }

  return (
    <>
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
        {DIAS_SEMANA.map((dia) => (
          <Card key={dia}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-md font-semibold">{dia}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => handleOpenModal(dia)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="p-3 rounded-md border bg-muted/30 min-h-[60px] flex items-center justify-center">
                <p className="text-center">{formatShifts(schedule[dia])}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingDay && (
          <ScheduleEditorModal 
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            day={editingDay}
            initialShifts={schedule[editingDay]}
            onSave={handleSaveShifts}
          />
      )}
    </>
  );
}