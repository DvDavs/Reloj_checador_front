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
      // Reset state when modal is closed or no ID is provided
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
      return <ScheduleDisplay schedule={schedule} />;
    }

    return null; // Should not happen if logic is correct
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>
            {template
              ? `Detalles de: ${template.nombre}`
              : 'Detalles de la Plantilla'}
          </DialogTitle>
          <DialogDescription>
            {template
              ? `ID: ${template.id}`
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
