// Reloj_checador_front\app\horarios\plantillas\registrar\page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { getApiErrorMessage } from '@/lib/api/schedule-api';
import { PageHeader } from '@/app/components/shared/page-header';
import { ErrorState } from '@/app/components/shared/error-state';
import { TemplateForm } from '../components/template-form';

export default function RegistrarPlantillaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (payload: any) => {
    if (!payload.nombre.trim()) {
      setError('El nombre de la plantilla es obligatorio.');
      return;
    }
    if (payload.detalles.length === 0) {
      setError(
        'La plantilla debe tener al menos un intervalo de tiempo definido.'
      );
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await apiClient.post('/api/horarios', payload);
      toast({
        title: 'Éxito',
        description: 'La nueva plantilla de horario ha sido creada.',
      });
      router.push('/horarios/plantillas');
    } catch (err: any) {
      console.error('Error creating schedule template:', err);
      const errorMsg = getApiErrorMessage(err);
      setError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='p-6 md:p-8'>
      <PageHeader
        title='Crear Nueva Plantilla de Horario'
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
              Guardar Plantilla
            </Button>
          </div>
        }
      />

      {error && (
        <div className='my-4'>
          <ErrorState message={error} />
        </div>
      )}

      {/* El formulario ahora está dentro de TemplateForm */}
      <TemplateForm
        onSave={handleSave}
        isSaving={isSaving}
        error={error}
        clearError={() => setError(null)}
      />
    </div>
  );
}
