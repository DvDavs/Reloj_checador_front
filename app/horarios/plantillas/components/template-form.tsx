'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import WeeklyScheduleGrid, {
  WeeklySchedule,
} from '@/app/components/shared/WeeklyScheduleGrid';
import {
  weeklyScheduleToDetalles,
  detallesToWeeklySchedule,
  HorarioDto,
} from '../types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface TemplateFormProps {
  initialData?: HorarioDto;
  onSave: (payload: any) => Promise<void>;
  isSaving: boolean;
  error?: string | null;
  clearError: () => void;
  isEditMode?: boolean;
}

const createEmptySchedule = (): WeeklySchedule => ({
  LUNES: [],
  MARTES: [],
  MIERCOLES: [],
  JUEVES: [],
  VIERNES: [],
  SABADO: [],
  DOMINGO: [],
});

export function TemplateForm({
  initialData,
  onSave,
  isSaving,
  error,
  clearError,
  isEditMode = false,
}: TemplateFormProps) {
  const [nombre, setNombre] = useState(initialData?.nombre || '');
  const [descripcion, setDescripcion] = useState(
    initialData?.descripcion || ''
  );
  const [esHorarioJefe, setEsHorarioJefe] = useState(
    initialData?.esHorarioJefe || false
  );
  const [schedule, setSchedule] = useState<WeeklySchedule>(
    initialData
      ? detallesToWeeklySchedule(initialData.detalles)
      : createEmptySchedule()
  );

  useEffect(() => {
    if (initialData) {
      setNombre(initialData.nombre);
      setDescripcion(initialData.descripcion || '');
      setEsHorarioJefe(initialData.esHorarioJefe);
      setSchedule(detallesToWeeklySchedule(initialData.detalles));
    }
  }, [initialData]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const detalles = weeklyScheduleToDetalles(schedule);

    const payload = {
      nombre,
      descripcion,
      esHorarioJefe,
      detalles,
      ...(isEditMode && { activo: true }),
    };

    onSave(payload);
  };

  const onInputChange =
    (setter: React.Dispatch<React.SetStateAction<any>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      if (error) clearError();
    };

  return (
    <form id='template-form' onSubmit={handleFormSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Plantilla</CardTitle>
          <CardDescription>
            Define la información principal y las propiedades del horario.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <label
              htmlFor='template-name'
              className='block text-sm font-medium text-gray-300 mb-2'
            >
              Nombre de la Plantilla
            </label>
            <Input
              id='template-name'
              value={nombre}
              onChange={onInputChange(setNombre)}
              placeholder='Ej: Horario de Verano, Matutino, etc.'
              disabled={isSaving}
              className='max-w-md'
            />
          </div>
          <div>
            <label
              htmlFor='template-description'
              className='block text-sm font-medium text-gray-300 mb-2'
            >
              Descripción (Opcional)
            </label>
            <Input
              id='template-description'
              value={descripcion}
              onChange={onInputChange(setDescripcion)}
              placeholder='Breve descripción del horario'
              disabled={isSaving}
              className='max-w-md'
            />
          </div>
          <div className='flex items-center space-x-2 pt-2'>
            <Checkbox
              id='esHorarioJefe'
              checked={esHorarioJefe}
              onCheckedChange={(checked) => setEsHorarioJefe(!!checked)}
              disabled={isSaving}
            />
            <label
              htmlFor='esHorarioJefe'
              className='text-sm font-medium leading-none'
            >
              Es un horario para Jefes
            </label>
          </div>
        </CardContent>
      </Card>

      <div className='mt-8'>
        <h2 className='text-xl font-semibold mb-4'>
          Editor de Horario Semanal
        </h2>
        <div className='p-0 border rounded-lg bg-background/50 md:p-4'>
          <WeeklyScheduleGrid
            schedule={schedule}
            onScheduleChange={(newSchedule) => {
              setSchedule(newSchedule);
              if (error) clearError();
            }}
            editable={!isSaving}
          />
        </div>
      </div>
    </form>
  );
}
