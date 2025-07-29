"use client";

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import WeeklyScheduleGrid, { type DayOfWeek, type TimeSlot, type WeeklySchedule } from './WeeklyScheduleGrid';

const ALL_DAYS: DayOfWeek[] = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

const createEmptySchedule = (): WeeklySchedule => {
  return ALL_DAYS.reduce((acc, day) => {
    acc[day] = [];
    return acc;
  }, {} as WeeklySchedule);
};

interface ScheduleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: DayOfWeek;
  initialShifts: Omit<TimeSlot, 'id' | 'error'>[];
  onSave: (shifts: Omit<TimeSlot, 'id' | 'error'>[]) => void;
}

export const ScheduleEditorModal = ({ isOpen, onClose, day, initialShifts, onSave }: ScheduleEditorModalProps) => {
  const [schedule, setSchedule] = useState<WeeklySchedule>(createEmptySchedule());

  useEffect(() => {
    if (isOpen) {
      const newSchedule = createEmptySchedule();
      newSchedule[day] = initialShifts.map(s => ({ ...s }));
      setSchedule(newSchedule);
    }
  }, [isOpen, day, initialShifts]);


  const handleSave = () => {
    onSave(schedule[day] || []);
    onClose();
  };
  
  const handleScheduleChange = (newSchedule: WeeklySchedule) => {
    setSchedule(newSchedule);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Editar Horario para {day.charAt(0) + day.slice(1).toLowerCase()}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <WeeklyScheduleGrid
            schedule={schedule}
            onScheduleChange={handleScheduleChange}
            editable={true}
            showDayHeaders={false}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 