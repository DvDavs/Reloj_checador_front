import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, Clock, Tag } from 'lucide-react';
import { HorarioAsignadoDto } from '../types';
import { apiClient } from '@/lib/apiClient';
import { LoadingState } from '@/app/components/shared/loading-state';
import { ErrorState } from '@/app/components/shared/error-state';
import SchedulePreview from '@/app/components/shared/SchedulePreview';
import { adaptHorarioTemplate } from '@/lib/adapters/horario-adapter';

interface DetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: HorarioAsignadoDto | null;
}

export function DetailsDialog({ isOpen, onClose, item }: DetailsDialogProps) {
  const [horarioDetails, setHorarioDetails] = useState<any>(null);
  const [isLoadingHorario, setIsLoadingHorario] = useState(false);
  const [horarioError, setHorarioError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const fetchHorarioDetails = async (horarioId: number) => {
    setIsLoadingHorario(true);
    setHorarioError(null);
    try {
      const response = await apiClient.get(`/api/horarios/${horarioId}`);
      setHorarioDetails(response.data);
    } catch (err: any) {
      console.error('Error fetching horario details:', err);
      setHorarioError('No se pudieron cargar los detalles del horario');
    } finally {
      setIsLoadingHorario(false);
    }
  };

  useEffect(() => {
    if (isOpen && item?.horarioId) {
      fetchHorarioDetails(item.horarioId);
    } else {
      setHorarioDetails(null);
      setHorarioError(null);
      setIsLoadingHorario(false);
    }
  }, [isOpen, item?.horarioId]);

  const adaptedTemplate = useMemo(() => {
    if (!horarioDetails) return null;
    return adaptHorarioTemplate(horarioDetails);
  }, [horarioDetails]);

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-7xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800 text-white'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold flex items-center gap-2'>
            <Calendar className='h-6 w-6' />
            Detalles del Horario Asignado
          </DialogTitle>
          <DialogDescription className='text-zinc-400'>
            Información detallada de la asignación de horario.
          </DialogDescription>
        </DialogHeader>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Left Column - Assignment Details */}
          <div className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4'>
              <div className='space-y-1'>
                <p className='text-sm font-medium text-zinc-400'>
                  ID de Asignación
                </p>
                <p className='text-lg font-mono'>{item.id}</p>
              </div>
              <div className='space-y-1'>
                <p className='text-sm font-medium text-zinc-400'>Estado</p>
                <Badge
                  variant={item.activo ? 'default' : 'secondary'}
                  className={
                    item.activo
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                  }
                >
                  {item.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>

            <Separator className='bg-zinc-700' />

            <div className='space-y-4'>
              <h3 className='text-xl font-semibold flex items-center gap-2'>
                <User className='h-5 w-5 text-blue-400' />
                Empleado
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4'>
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-zinc-400'>Nombre</p>
                  <p className='text-lg'>{item.empleadoNombre}</p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-zinc-400'>
                    ID Empleado
                  </p>
                  <p className='font-mono'>{item.empleadoId}</p>
                </div>
              </div>
            </div>

            <Separator className='bg-zinc-700' />

            <div className='space-y-4'>
              <h3 className='text-xl font-semibold flex items-center gap-2'>
                <Clock className='h-5 w-5 text-purple-400' />
                Horario
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4'>
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-zinc-400'>
                    Nombre del Horario
                  </p>
                  <p className='text-lg'>{item.horarioNombre}</p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-zinc-400'>
                    ID Horario
                  </p>
                  <p className='font-mono'>{item.horarioId}</p>
                </div>
              </div>
            </div>

            <Separator className='bg-zinc-700' />

            <div className='space-y-4'>
              <h3 className='text-xl font-semibold flex items-center gap-2'>
                <Tag className='h-5 w-5 text-green-400' />
                Tipo de Horario
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4'>
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-zinc-400'>Tipo</p>
                  <p className='text-lg'>{item.tipoHorarioNombre}</p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-zinc-400'>ID Tipo</p>
                  <p className='font-mono'>{item.tipoHorarioId}</p>
                </div>
              </div>
            </div>

            <Separator className='bg-zinc-700' />

            <div className='space-y-4'>
              <h3 className='text-xl font-semibold flex items-center gap-2'>
                <Calendar className='h-5 w-5 text-orange-400' />
                Período de Vigencia
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4'>
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-zinc-400'>
                    Fecha de Inicio
                  </p>
                  <p className='text-lg'>{formatDate(item.fechaInicio)}</p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-zinc-400'>
                    Fecha de Fin
                  </p>
                  <p className='text-lg'>{formatDate(item.fechaFin)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Schedule Preview */}
          <div className='space-y-4'>
            <h3 className='text-xl font-semibold flex items-center gap-2'>
              <Clock className='h-5 w-5 text-primary' />
              Vista Previa del Horario
            </h3>

            {isLoadingHorario ? (
              <LoadingState message='Cargando detalles del horario...' />
            ) : horarioError ? (
              <ErrorState
                message={horarioError}
                onRetry={() => fetchHorarioDetails(item.horarioId)}
              />
            ) : adaptedTemplate ? (
              <div className='bg-card border border-border rounded-lg p-1'>
                <SchedulePreview
                  template={adaptedTemplate}
                  className='border-none bg-transparent'
                />
              </div>
            ) : (
              <div className='bg-muted/20 border border-muted rounded-lg p-6 text-center'>
                <p className='text-muted-foreground'>
                  No se pudieron cargar los detalles del horario
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
