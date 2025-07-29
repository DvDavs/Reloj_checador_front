"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import InteractiveWeeklySchedule, { TimeSlot, WeeklySchedule, DayOfWeek } from "@/app/components/shared/WeeklyScheduleGrid";
import { NewScheduleData } from "../types";
import { AlertCircle, Clock, ClipboardCheck } from "lucide-react";

interface NewScheduleTemplateFormProps {
  scheduleData: NewScheduleData;
  onDataChange: (data: Partial<NewScheduleData>) => void;
}

// Utilidades para transformar entre array plano y WeeklySchedule
const detallesToWeeklySchedule = (detalles: any[]): WeeklySchedule => {
  const schedule: WeeklySchedule = {
    LUNES: [], MARTES: [], MIERCOLES: [], JUEVES: [], VIERNES: [], SABADO: [], DOMINGO: []
  };
  detalles.forEach((d) => {
    const dia = d.diaSemana as DayOfWeek;
    if (schedule[dia]) {
      schedule[dia].push({
        horaEntrada: d.horaEntrada,
        horaSalida: d.horaSalida,
      });
    }
  });
  return schedule;
};

const weeklyScheduleToDetalles = (schedule: WeeklySchedule): any[] => {
  const detalles: any[] = [];
  Object.entries(schedule).forEach(([diaSemana, slots]) => {
    slots.forEach((slot: TimeSlot, index: number) => {
      detalles.push({
        diaSemana: diaSemana as DayOfWeek,
        horaEntrada: slot.horaEntrada,
        horaSalida: slot.horaSalida,
        turno: index + 1, // Se genera el número de turno secuencialmente por día
      });
    });
  });
  return detalles;
};

export function NewScheduleTemplateForm({
  scheduleData,
  onDataChange,
}: NewScheduleTemplateFormProps) {
  const isNameValid = scheduleData.nombre.trim().length > 0;
  const hasDetails = scheduleData.detalles.length > 0;

  // Estado local para el editor
  const [weeklySchedule, setWeeklySchedule] = React.useState<WeeklySchedule>(
    detallesToWeeklySchedule(scheduleData.detalles)
  );

  // Sincronizar cambios externos
  React.useEffect(() => {
    setWeeklySchedule(detallesToWeeklySchedule(scheduleData.detalles));
  }, [scheduleData.detalles]);

  const handleScheduleChange = (newSchedule: WeeklySchedule) => {
    setWeeklySchedule(newSchedule);
    onDataChange({ detalles: weeklyScheduleToDetalles(newSchedule) });
  };

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div 
        className="space-y-4 rounded-lg border border-zinc-800 p-5 bg-zinc-900/50"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <ClipboardCheck className="h-4 w-4 text-blue-500" />
          </div>
          <h3 className="font-semibold text-lg">Datos de la Nueva Plantilla</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="templateName" className="text-sm font-medium">
                Nombre
              </Label>
              {!isNameValid && scheduleData.nombre.length > 0 && (
                <div className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Nombre requerido</span>
                </div>
              )}
            </div>
            <Input
              id="templateName"
              placeholder="Ej: Turno de Fin de Semana"
              value={scheduleData.nombre}
              onChange={(e) =>
                onDataChange({ nombre: e.target.value })
              }
              className={!isNameValid && scheduleData.nombre.length > 0 ? "border-destructive" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="templateDesc" className="text-sm font-medium">
              Descripción (Opcional)
            </Label>
            <Input
              id="templateDesc"
              placeholder="Breve descripción del horario"
              value={scheduleData.descripcion}
              onChange={(e) =>
                onDataChange({ descripcion: e.target.value })
              }
            />
          </div>
        </div>
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="isJefe"
            checked={scheduleData.esHorarioJefe}
            onCheckedChange={(checked) =>
              onDataChange({ esHorarioJefe: !!checked })
            }
          />
          <Label htmlFor="isJefe" className="text-sm">
            Es un horario para Jefes
          </Label>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Clock className="h-4 w-4 text-purple-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Definir Turnos</h3>
            <p className="text-sm text-zinc-400">
              Configura los horarios para cada día de la semana
            </p>
          </div>
          {!hasDetails && (
            <div className="text-xs text-amber-500 flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded">
              <AlertCircle className="h-3 w-3" />
              <span>Se requiere al menos un turno</span>
            </div>
          )}
        </div>
        <InteractiveWeeklySchedule
          schedule={weeklySchedule}
          onScheduleChange={handleScheduleChange}
          editable={true}
        />
      </motion.div>
    </motion.div>
  );
}