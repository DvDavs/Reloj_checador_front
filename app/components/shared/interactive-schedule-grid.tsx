"use client";

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type TimeSlot = {
  horaEntrada: string;
  horaSalida: string;
};

interface InteractiveScheduleGridProps {
  day: string;
  shifts: TimeSlot[];
  onShiftsChange: (shifts: TimeSlot[]) => void;
}

const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

export const InteractiveScheduleGrid = ({ day, shifts, onShiftsChange }: InteractiveScheduleGridProps) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startHour, setStartHour] = useState<number | null>(null);
  const [currentSelection, setCurrentSelection] = useState<{ start: number, end: number} | null>(null);

  const hourInShift = useMemo(() => {
    const lookup = new Set<string>();
    shifts.forEach(({ horaEntrada, horaSalida }) => {
      const start = parseInt(horaEntrada.split(':')[0]);
      const end = parseInt(horaSalida.split(':')[0]);
      for (let i = start; i < end; i++) {
        lookup.add(`${day}-${i}`);
      }
    });
    return lookup;
  }, [shifts, day]);

  const handleMouseDown = (hourIndex: number) => {
    const key = `${day}-${hourIndex}`;
    if (hourInShift.has(key)) {
        // Clicked on an existing shift, remove it
        const newShifts = shifts.filter(shift => {
            const start = parseInt(shift.horaEntrada.split(':')[0]);
            const end = parseInt(shift.horaSalida.split(':')[0]);
            return !(hourIndex >= start && hourIndex < end);
        });
        onShiftsChange(newShifts);
    } else {
        // Start a new selection
        setIsSelecting(true);
        setStartHour(hourIndex);
        setCurrentSelection({ start: hourIndex, end: hourIndex });
    }
  };

  const handleMouseEnter = (hourIndex: number) => {
    if (isSelecting && startHour !== null) {
        setCurrentSelection({
            start: Math.min(startHour, hourIndex),
            end: Math.max(startHour, hourIndex)
        });
    }
  };

  const handleMouseUp = () => {
    if (isSelecting && currentSelection) {
      const newShift: TimeSlot = {
        horaEntrada: `${currentSelection.start.toString().padStart(2, '0')}:00`,
        horaSalida: `${(currentSelection.end + 1).toString().padStart(2, '0')}:00`,
      };

      // Merge with existing shifts if they overlap
      let merged = false;
      const updatedShifts = shifts.map(shift => {
          const shiftStart = parseInt(shift.horaEntrada.split(':')[0]);
          const shiftEnd = parseInt(shift.horaSalida.split(':')[0]);
          const selectionStart = currentSelection.start;
          const selectionEnd = currentSelection.end + 1;

          // Check for overlap or adjacency
          if (Math.max(shiftStart, selectionStart) <= Math.min(shiftEnd, selectionEnd)) {
              merged = true;
              return {
                  horaEntrada: `${Math.min(shiftStart, selectionStart).toString().padStart(2, '0')}:00`,
                  horaSalida: `${Math.max(shiftEnd, selectionEnd).toString().padStart(2, '0')}:00`,
              };
          }
          return shift;
      });

      if (!merged) {
        updatedShifts.push(newShift);
      }
      
      // Post-process to merge any newly overlapping shifts from the merge operation itself
      const finalShifts = updatedShifts.sort((a,b) => a.horaEntrada.localeCompare(b.horaEntrada))
        .reduce((acc, current) => {
            if (acc.length === 0) {
                return [current];
            }
            const last = acc[acc.length - 1];
            if (last.horaSalida >= current.horaEntrada) {
                last.horaSalida = current.horaSalida > last.horaSalida ? current.horaSalida : last.horaSalida;
            } else {
                acc.push(current);
            }
            return acc;
        }, [] as TimeSlot[]);


      onShiftsChange(finalShifts);
    }
    setIsSelecting(false);
    setStartHour(null);
    setCurrentSelection(null);
  };
  
  const getHourClass = (hourIndex: number) => {
      const key = `${day}-${hourIndex}`;
      if(hourInShift.has(key)) return 'bg-primary text-primary-foreground';
      if(currentSelection && hourIndex >= currentSelection.start && hourIndex <= currentSelection.end){
          return 'bg-primary/50 border-primary border';
      }
      return 'bg-muted/50 hover:bg-muted';
  }

  return (
    <div 
        className="grid grid-cols-6 gap-1 p-2 rounded-lg bg-background"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
    >
      {hours.map((hour, index) => (
        <motion.div
          key={hour}
          className={cn(
            "flex items-center justify-center h-10 rounded-md cursor-pointer select-none text-sm transition-colors duration-100",
            getHourClass(index)
          )}
          onMouseDown={() => handleMouseDown(index)}
          onMouseEnter={() => handleMouseEnter(index)}
          whileTap={{ scale: 0.95 }}
        >
          {hour}
        </motion.div>
      ))}
    </div>
  );
}; 