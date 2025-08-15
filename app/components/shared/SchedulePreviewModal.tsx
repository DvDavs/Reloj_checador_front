'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { LoadingState } from '@/app/components/shared/loading-state';
import { ErrorState } from '@/app/components/shared/error-state';
import SchedulePreview from '@/app/components/shared/SchedulePreview';
import { HorarioTemplateDTO } from '@/app/horarios/asignados/registrar/types';
import { Calendar } from 'lucide-react';

interface SchedulePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: HorarioTemplateDTO | null;
  isLoading: boolean;
  error: string | null;
}

export function SchedulePreviewModal({
  isOpen,
  onClose,
  template,
  isLoading,
  error,
}: SchedulePreviewModalProps) {
  const renderContent = () => {
    if (isLoading) {
      return <LoadingState message='Cargando horario...' />;
    }
    if (error) {
      return <ErrorState message={error} />;
    }
    if (template) {
      return <SchedulePreview template={template} />;
    }
    return (
      <div className='text-center p-8 text-muted-foreground'>
        No hay datos de horario para mostrar. Seleccione un empleado y una fecha
        válida.
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold flex items-center gap-2'>
            <Calendar className='h-6 w-6' />
            Vista Previa del Horario Asignado
          </DialogTitle>
          <DialogDescription>
            {template
              ? `Mostrando el horario "${template.nombre}"`
              : 'Detalles del horario del empleado en la fecha seleccionada.'}
          </DialogDescription>
        </DialogHeader>
        <div className='py-4'>{renderContent()}</div>
      </DialogContent>
    </Dialog>
  );
}
