'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { HorarioDto } from '../../types';
import { ErrorState } from '@/app/components/shared/error-state';
import { LoadingState } from '@/app/components/shared/loading-state';
import { TemplateForm } from '../../components/template-form';
import { PageHeader } from '@/app/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { EmpleadosWarningAlert } from '../../components/empleados-warning-alert';
import { useToast } from '@/components/ui/use-toast';
import { getApiErrorMessage } from '@/lib/api/schedule-api';

export default function EditarPlantillaPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const templateId = params.id as string;

  const [initialData, setInitialData] = useState<HorarioDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHorario = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<HorarioDto>(`/api/horarios/${id}`);
      setInitialData(response.data);
    } catch (err) {
      console.error('Error fetching schedule template:', err);
      setError(
        'No se pudo cargar la plantilla. Verifique que existe y tiene permisos.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (templateId) {
      fetchHorario(templateId);
    }
  }, [templateId, fetchHorario]);

  const handleSave = async (payload: any) => {
    if (!payload.nombre.trim()) {
      setError('El nombre de la plantilla es obligatorio.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await apiClient.put(`/api/horarios/${templateId}`, payload);
      toast({
        title: 'Éxito',
        description: 'La plantilla de horario ha sido actualizada.',
      });
      router.push('/horarios/plantillas');
    } catch (err: any) {
      console.error('Error updating schedule template:', err);
      const errorMsg = getApiErrorMessage(err);
      setError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingState message='Cargando plantilla...' />;
  }

  if (error && !initialData) {
    return (
      <ErrorState message={error} onRetry={() => fetchHorario(templateId)} />
    );
  }

  if (!initialData) {
    return (
      <ErrorState message='No se encontraron datos para esta plantilla.' />
    );
  }

  return (
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
              <ArrowLeft className='mr-2 h-4 w-4' /> Cancelar
            </Button>
            <Button type='submit' form='template-form' disabled={isSaving}>
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

      {error && (
        <div className='my-4'>
          <ErrorState message={error} />
        </div>
      )}

      <EmpleadosWarningAlert
        horarioId={parseInt(templateId)}
        className='mb-6'
      />

      <TemplateForm
        initialData={initialData}
        onSave={handleSave}
        isSaving={isSaving}
        error={error}
        clearError={() => setError(null)}
        isEditMode={true}
      />
    </div>
  );
}
