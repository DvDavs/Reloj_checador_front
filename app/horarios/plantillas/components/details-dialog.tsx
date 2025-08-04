'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '@/lib/apiClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { HorarioDto, detallesToWeeklySchedule } from '../types';
import { LoadingState } from '@/app/components/shared/loading-state';
import { ErrorState } from '@/app/components/shared/error-state';
import { ScheduleDisplay } from './schedule-display';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface DetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: number | null;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export function DetailsDialog({
  isOpen,
  onClose,
  templateId,
}: DetailsDialogProps) {
  const [template, setTemplate] = useState<HorarioDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplateDetails = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<HorarioDto>(
        `${API_BASE_URL}/api/horarios/${id}`
      );
      setTemplate(response.data);
    } catch (err: any) {
      console.error('Error fetching template details:', err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'No se pudo cargar la plantilla.';
      setError(errorMsg);
      setTemplate(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && templateId) {
      fetchTemplateDetails(templateId);
    } else {
      setTemplate(null);
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen, templateId]);

  const schedule = useMemo(() => {
    if (!template) return {};
    return detallesToWeeklySchedule(template.detalles);
  }, [template]);

  const renderContent = () => {
    if (isLoading) {
      return <LoadingState message='Cargando detalles...' />;
    }

    if (error) {
      return (
        <ErrorState
          message={error}
          onRetry={() => templateId && fetchTemplateDetails(templateId)}
        />
      );
    }

    if (template) {
      return (
        <div className='w-full'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Descripción
              </p>
              <p>{template.descripcion || 'N/A'}</p>
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                Tipo de Horario
              </p>
              <Badge variant={template.esHorarioJefe ? 'outline' : 'secondary'}>
                {template.esHorarioJefe ? 'Jefe' : 'Regular'}
              </Badge>
            </div>
          </div>
          <Separator />
          <div className='mt-4'>
            <ScheduleDisplay schedule={schedule} />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-4xl'>
        <DialogHeader>
          <DialogTitle>
            {template
              ? `Detalles de: ${template.nombre}`
              : 'Detalles de la Plantilla'}
          </DialogTitle>
          <DialogDescription>
            {template
              ? `ID: ${template.id} - Estado: ${template.activo ? 'Activo' : 'Inactivo'}`
              : 'Cargando información de la plantilla...'}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className='py-4 min-h-[200px] flex items-center justify-center'>
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
