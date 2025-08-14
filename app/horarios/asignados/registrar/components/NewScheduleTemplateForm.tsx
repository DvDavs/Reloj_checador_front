'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import InteractiveWeeklySchedule, {
  TimeSlot,
  WeeklySchedule,
  DayOfWeek,
} from '@/app/components/shared/WeeklyScheduleGrid';
import { NewScheduleData, EmpleadoSimpleDTO } from '../types';
import { AlertCircle, Clock, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewScheduleTemplateFormProps {
  scheduleData: NewScheduleData;
  onDataChange: (data: Partial<NewScheduleData>) => void;
  selectedEmployee?: EmpleadoSimpleDTO | null;
}

const detallesToWeeklySchedule = (detalles: any[]): WeeklySchedule => {
  const schedule: WeeklySchedule = {
    LUNES: [],
    MARTES: [],
    MIERCOLES: [],
    JUEVES: [],
    VIERNES: [],
    SABADO: [],
    DOMINGO: [],
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
        turno: index + 1,
      });
    });
  });
  return detalles;
};

export function NewScheduleTemplateForm({
  scheduleData,
  onDataChange,
  selectedEmployee,
}: NewScheduleTemplateFormProps) {
  const isNameValid = scheduleData.nombre.trim().length > 0;
  const hasDetails = scheduleData.detalles.length > 0;

  const [weeklySchedule, setWeeklySchedule] = React.useState<WeeklySchedule>(
    detallesToWeeklySchedule(scheduleData.detalles)
  );

  // Generar ID único de 3 caracteres
  const generateUniqueId = React.useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 3; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  // Preset the schedule name with unique ID and employee's RFC when component mounts or employee changes
  React.useEffect(() => {
    if (selectedEmployee?.rfc) {
      // Only preset if the field is empty or contains a previous RFC preset format
      const currentName = scheduleData.nombre.trim();
      const isEmptyOrPreset =
        currentName === '' ||
        /^[A-Z0-9]{3} - [A-Z0-9]+ - (\s*)$/.test(currentName);

      if (isEmptyOrPreset) {
        const uniqueId = generateUniqueId();
        onDataChange({ nombre: `${uniqueId} - ${selectedEmployee.rfc} - ` });
      }
    }
  }, [
    selectedEmployee?.rfc,
    scheduleData.nombre,
    onDataChange,
    generateUniqueId,
  ]);

  React.useEffect(() => {
    setWeeklySchedule(detallesToWeeklySchedule(scheduleData.detalles));
  }, [scheduleData.detalles]);

  const handleScheduleChange = (newSchedule: WeeklySchedule) => {
    setWeeklySchedule(newSchedule);
    onDataChange({ detalles: weeklyScheduleToDetalles(newSchedule) });
  };

  return (
    <motion.div
      className='space-y-8'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className='space-y-4 rounded-lg border p-5 bg-card'
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className='flex items-center gap-3 mb-4'>
          <div className='w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center'>
            <ClipboardCheck className='h-4 w-4 text-primary' />
          </div>
          <h3 className='font-semibold text-lg text-foreground'>
            Datos del Nuevo Horario
          </h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='templateName' className='text-sm font-medium'>
                Nombre
              </Label>
              {!isNameValid && scheduleData.nombre.length > 0 && (
                <div className='text-xs text-destructive flex items-center gap-1'>
                  <AlertCircle className='h-3 w-3' />
                  <span>Nombre requerido</span>
                </div>
              )}
            </div>
            <Input
              id='templateName'
              placeholder={
                selectedEmployee?.rfc
                  ? `Se preseteará con: XXX - ${selectedEmployee.rfc} - `
                  : 'Ej: ABC - EMPLEADO123 - Turno Matutino'
              }
              value={scheduleData.nombre}
              onChange={(e) => onDataChange({ nombre: e.target.value })}
              className={cn(
                'text-lg font-medium', // Hacer el texto más grande y prominente
                !isNameValid && scheduleData.nombre.length > 0
                  ? 'border-destructive'
                  : 'border-primary/30 focus:border-primary'
              )}
            />
            {selectedEmployee?.rfc && (
              <div className='mt-2 p-2 bg-primary/5 border border-primary/20 rounded text-xs'>
                <p className='text-primary font-medium'>
                  💡 Formato automático:{' '}
                  <code className='bg-primary/10 px-1 rounded'>
                    ID-RFC-Descripción
                  </code>
                </p>
                <p className='text-muted-foreground mt-1'>
                  Se genera con ID único + RFC para evitar duplicados. Edita
                  libremente después del segundo guión.
                </p>
              </div>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='templateDesc' className='text-sm font-medium'>
              Descripción (Opcional)
            </Label>
            <Input
              id='templateDesc'
              placeholder='Breve descripción del horario'
              value={scheduleData.descripcion}
              onChange={(e) => onDataChange({ descripcion: e.target.value })}
            />
          </div>
        </div>
        <div className='flex items-center space-x-3 pt-4 p-3 bg-accent/5 border border-accent/20 rounded-lg'>
          <Checkbox
            id='isJefe'
            checked={scheduleData.esHorarioJefe}
            onCheckedChange={(checked) =>
              onDataChange({ esHorarioJefe: !!checked })
            }
            className='w-5 h-5'
          />
          <div className='flex-1'>
            <Label
              htmlFor='isJefe'
              className='text-base font-medium text-foreground cursor-pointer'
            >
              Horario para Jefes
            </Label>
            <p className='text-sm text-muted-foreground mt-1'>
              Marca esta opción si este horario está destinado para personal
              directivo
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className='flex items-center gap-3 mb-4'>
          <div className='w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center'>
            <Clock className='h-4 w-4 text-accent' />
          </div>
          <div className='flex-1'>
            <h3 className='font-semibold text-lg text-foreground'>
              Definir Turnos
            </h3>
            <p className='text-sm text-muted-foreground'>
              Configura los horarios para cada día de la semana
            </p>
          </div>
          {!hasDetails && (
            <div className='text-xs text-amber-700 flex items-center gap-1 bg-amber-100 px-2 py-1 rounded border border-amber-200'>
              <AlertCircle className='h-3 w-3' />
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
