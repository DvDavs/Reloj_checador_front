'use client'; // <-- 1. CONVERTIR A CLIENT COMPONENT

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/apiClient'; // <-- 2. USAR apiClient
import { EditTemplateForm } from '@/app/horarios/plantillas/components/edit-form';
import { HorarioDto } from '../../types';
import { ErrorState } from '@/app/components/shared/error-state';
import { LoadingState } from '@/app/components/shared/loading-state';

export default function EditarPlantillaPage() {
  const params = useParams();
  const templateId = params.id as string;
  const [initialData, setInitialData] = useState<HorarioDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3. MOVER LA LÓGICA DE CARGA A useEffect
  const fetchHorario = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Usa apiClient que ya tiene el token de autorización
      const response = await apiClient.get<HorarioDto>(`/api/horarios/${id}`);
      setInitialData(response.data);
    } catch (error) {
      console.error('Error fetching schedule template:', error);
      setError(
        'No se pudo cargar la plantilla de horario. Verifique que la URL es correcta y tiene permisos.'
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

  // 4. RENDERIZADO CONDICIONAL
  if (isLoading) {
    return <LoadingState message='Cargando plantilla...' />;
  }

  if (error) {
    return (
      <ErrorState message={error} onRetry={() => fetchHorario(templateId)} />
    );
  }

  if (!initialData) {
    // Esto puede pasar si el fetch tiene éxito pero no devuelve datos
    return (
      <ErrorState message='No se encontraron datos para esta plantilla.' />
    );
  }

  return <EditTemplateForm initialData={initialData} templateId={templateId} />;
}
