'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { type DayOfWeek, type WeeklySchedule } from './WeeklyScheduleGrid';

const ALL_DAYS: DayOfWeek[] = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
];

interface CopySchedulePopoverProps {
  sourceDay: DayOfWeek;
  schedule: Partial<WeeklySchedule>;
  onScheduleChange: (newSchedule: WeeklySchedule) => void;
  children: React.ReactNode;
  days?: DayOfWeek[];
}

export function CopySchedulePopover({
  sourceDay,
  schedule,
  onScheduleChange,
  children,
  days = ALL_DAYS,
}: CopySchedulePopoverProps) {
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    if (selectedDays.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Ningún día seleccionado',
        description: 'Por favor, selecciona al menos un día de destino.',
      });
      return;
    }

    const sourceScheduleForDay = schedule[sourceDay] || [];
    const newSchedule = { ...schedule };

    selectedDays.forEach(day => {
      // Deep copy to avoid reference issues
      newSchedule[day] = JSON.parse(JSON.stringify(sourceScheduleForDay));
    });

    onScheduleChange(newSchedule as WeeklySchedule);

    // Reset and close popover
    setPopoverOpen(false);
    setSelectedDays([]);

    toast({
      title: 'Horario copiado',
      description: `El horario de ${sourceDay.toLowerCase()} ha sido copiado a ${
        selectedDays.length
      } día(s).`,
    });
  };

  const targetDays = days.filter(d => d !== sourceDay);

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Copiar Horario</h4>
            <p className="text-sm text-muted-foreground">
              Selecciona los días a los que quieres aplicar el horario de{' '}
              <strong>{sourceDay.toLowerCase()}</strong>.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {targetDays.map(day => (
              <div key={day} className="flex items-center space-x-2">
                <Checkbox
                  id={`copy-day-${day}-${sourceDay}`}
                  checked={selectedDays.includes(day)}
                  onCheckedChange={checked => {
                    setSelectedDays(prev =>
                      checked
                        ? [...prev, day]
                        : prev.filter(d => d !== day),
                    );
                  }}
                />
                <label
                  htmlFor={`copy-day-${day}-${sourceDay}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {day.charAt(0) + day.slice(1).toLowerCase()}
                </label>
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPopoverOpen(false)}
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCopy}>
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 