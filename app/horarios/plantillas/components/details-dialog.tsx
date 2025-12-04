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
import { HorarioDto } from '../types';
import { LoadingState } from '@/app/components/shared/loading-state';
import { ErrorState } from '@/app/components/shared/error-state';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import SchedulePreview from '@/app/components/shared/SchedulePreview';
import { adaptHorarioTemplate } from '@/lib/adapters/horario-adapter';
import { Calendar, User, Clock, Tag } from 'lucide-react';

interface DetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: number | null;
}

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
      const response = await apiClient.get<HorarioDto>(`/api/horarios/${id}`);
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

  const adaptedTemplate = useMemo(() => {
    if (!template) return null;
    return adaptHorarioTemplate(template as any);
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

    if (template && adaptedTemplate) {
      return (
        <div className='space-y-6'>
          {/* Header Information */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <Tag className='h-5 w-5 text-primary' />
                Información General
              </h3>
              <div className='space-y-3'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    ID
                  </p>
                  <p className='font-mono'>{template.id}</p>
                </div>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Estado
                  </p>
                  <Badge variant={template.activo ? 'default' : 'secondary'}>
                    {template.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Tipo
                  </p>
                  <Badge
                    variant={template.esHorarioJefe ? 'outline' : 'secondary'}
                  >
                    {template.esHorarioJefe
                      ? 'Horario Jefe'
                      : 'Horario Regular'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className='space-y-4'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <Clock className='h-5 w-5 text-primary' />
                Estadísticas
              </h3>
              <div className='space-y-3'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Días laborales
                  </p>
                  <p className='text-lg font-semibold'>
                    {new Set(template.detalles.map((d) => d.diaSemana)).size}{' '}
                    días
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Total turnos
                  </p>
                  <p className='text-lg font-semibold'>
                    {template.detalles.length} turnos
                  </p>
                </div>
              </div>
            </div>

            <div className='space-y-4'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <User className='h-5 w-5 text-primary' />
                Descripción
              </h3>
              <div className='p-3 bg-muted/50 rounded-md'>
                <p className='text-sm'>
                  {template.descripcion || 'Sin descripción disponible'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Schedule Preview */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold flex items-center gap-2'>
              <Calendar className='h-5 w-5 text-primary' />
              Vista Previa del Horario
            </h3>
            <SchedulePreview
              template={adaptedTemplate}
              className='border-2 border-primary/20'
            />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-6xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold flex items-center gap-2'>
            <Calendar className='h-6 w-6' />
            {template ? `${template.nombre}` : 'Detalles de la Plantilla'}
          </DialogTitle>
          <DialogDescription>
            {template
              ? `Plantilla de horario - ID: ${template.id}`
              : 'Cargando información de la plantilla...'}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className='py-4'>{renderContent()}</div>
      </DialogContent>
    </Dialog>
  );
}
