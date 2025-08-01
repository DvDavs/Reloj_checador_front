'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import WeeklyScheduleGrid, {
  WeeklySchedule,
} from '@/app/components/shared/WeeklyScheduleGrid';
import {
  weeklyScheduleToDetalles,
  detallesToWeeklySchedule,
  HorarioDto,
} from '../types';
import { PageHeader } from '@/app/components/shared/page-header';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export function EditTemplateForm({
  initialData,
  templateId,
}: {
  initialData: HorarioDto;
  templateId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [nombre, setNombre] = useState(initialData.nombre);
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(
    detallesToWeeklySchedule(initialData.detalles)
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!nombre.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error de validación',
        description: 'El nombre de la plantilla es obligatorio.',
      });
      return;
    }
    if (!schedule) return;

    setIsSaving(true);

    const detalles = weeklyScheduleToDetalles(schedule);
    const payload = {
      nombre,
      detalles,
    };

    try {
      await apiClient.put(
        `${API_BASE_URL}/api/horarios/${templateId}`,
        payload
      );
      toast({
        title: 'Éxito',
        description: 'La plantilla de horario ha sido actualizada.',
      });
      router.push('/horarios/plantillas');
    } catch (error: any) {
      console.error('Error updating schedule template:', error);
      const errorMsg =
        error.response?.data?.message || 'No se pudo actualizar la plantilla.';
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: errorMsg,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className='p-6 md:p-8'>
        <PageHeader
          title='Editar Plantilla de Horario'
          isLoading={isSaving}
          actions={
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                onClick={() => router.back()}
                disabled={isSaving}
              >
                <ArrowLeft className='mr-2 h-4 w-4' />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <Save className='mr-2 h-4 w-4' />
                )}
                Guardar Cambios
              </Button>
            </div>
          }
        />

        {schedule && (
          <>
            <div className='mt-8 max-w-2xl mx-auto'>
              <div className='space-y-4'>
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
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder='Ej: Horario de Verano, Matutino, etc.'
                    disabled={isSaving}
                    className='max-w-md'
                  />
                </div>
              </div>
            </div>

            <div className='mt-8'>
              <h2 className='text-xl font-semibold mb-4'>
                Editor de Horario Semanal
              </h2>
              <div className='p-0 border rounded-lg bg-background/50 md:p-4'>
                <WeeklyScheduleGrid
                  schedule={schedule}
                  onScheduleChange={setSchedule}
                  editable={!isSaving}
                />
              </div>
            </div>
          </>
        )}
      </div>
      <Toaster />
    </>
  );
}
