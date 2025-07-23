"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InteractiveScheduleGrid } from './interactive-schedule-grid';
import { type DIAS_SEMANA, type TimeSlot } from './schedule-grid-editor';

interface ScheduleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: typeof DIAS_SEMANA[number];
  initialShifts: Omit<TimeSlot, 'id' | 'error'>[];
  onSave: (shifts: Omit<TimeSlot, 'id' | 'error'>[]) => void;
}

export const ScheduleEditorModal = ({ isOpen, onClose, day, initialShifts, onSave }: ScheduleEditorModalProps) => {
  const [shifts, setShifts] = useState(initialShifts);

  useEffect(() => {
    // Reset shifts when modal is reopened with new initialShifts
    setShifts(initialShifts);
  }, [initialShifts, isOpen]);

  const handleSave = () => {
    onSave(shifts);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar Horario para {day}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <InteractiveScheduleGrid day={day} shifts={shifts} onShiftsChange={setShifts} />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 