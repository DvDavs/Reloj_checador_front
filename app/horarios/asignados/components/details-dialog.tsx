import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Clock, Edit } from 'lucide-react';
import { HorarioAsignadoDto } from '../types';
import { apiClient } from '@/lib/apiClient';
import { LoadingState } from '@/app/components/shared/loading-state';
import { ErrorState } from '@/app/components/shared/error-state';
import SchedulePreview from '@/app/components/shared/SchedulePreview';
import { adaptHorarioTemplate } from '@/lib/adapters/horario-adapter';
import UnifiedEditModal from './unified-edit-modal';

interface DetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: HorarioAsignadoDto | null;
}

export function DetailsDialog({ isOpen, onClose, item }: DetailsDialogProps) {
  const [horarioDetails, setHorarioDetails] = useState<any>(null);
  const [isLoadingHorario, setIsLoadingHorario] = useState(false);
  const [horarioError, setHorarioError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    // Interpretar como fecha pura (YYYY-MM-DD) en horario local para evitar desfase por zona horaria
    const onlyDate = dateString.substring(0, 10);
    const [yStr, mStr, dStr] = onlyDate.split('-');
    const year = parseInt(yStr || '', 10);
    const month = parseInt(mStr || '', 10);
    const day = parseInt(dStr || '', 10);
    if (!year || !month || !day) {
      // Fallback si el formato no es el esperado
      const fallback = new Date(dateString);
      return fallback.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    const date = new Date(year, month - 1, day);
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

  const horarioDescription = useMemo(() => {
    if (!horarioDetails) return null;
    const desc =
      horarioDetails.descripcion ??
      horarioDetails.description ??
      horarioDetails.detalle ??
      horarioDetails.observaciones ??
      horarioDetails.comentarios ??
      null;
    return typeof desc === 'string' && desc.trim().length > 0 ? desc : null;
  }, [horarioDetails]);

  if (!item) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className='max-w-7xl max-h-[90vh] overflow-hidden bg-card'>
          <DialogHeader className='pb-6 border-b border-border'>
            <DialogTitle className='text-2xl font-bold flex items-center gap-3 text-foreground'>
              <Calendar className='h-6 w-6 text-blue-600' />
              Detalles del Horario Asignado
            </DialogTitle>
            <DialogDescription className='text-muted-foreground text-base'>
              Información completa de la asignación de horario para{' '}
              <span className='font-medium text-foreground'>
                {item.empleadoNombre}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className='overflow-y-auto max-h-[calc(90vh-140px)] pr-2'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
              {/* Left Column - Assignment Details */}
              <div className='space-y-8'>
                {/* Basic Info Section */}
                <div className='space-y-6'>
                  <div className='flex items-center gap-2 pb-2 border-b'>
                    <User className='h-5 w-5 text-primary' />
                    <h3 className='text-xl font-semibold text-foreground'>
                      Información del Empleado
                    </h3>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                    <div className='space-y-2'>
                      <p className='text-sm font-medium text-muted-foreground'>
                        Nombre Completo
                      </p>
                      <p className='text-lg font-medium text-foreground'>
                        {item.empleadoNombre}
                      </p>
                    </div>
                    <div className='space-y-2'>
                      <p className='text-sm font-medium text-muted-foreground'>
                        Número de Tarjeta
                      </p>
                      <p className='text-base font-mono bg-primary/10 px-3 py-1 rounded text-primary inline-block font-semibold'>
                        {item.numTarjetaTrabajador}
                      </p>
                    </div>
                    <div className='space-y-2'>
                      <p className='text-sm font-medium text-muted-foreground'>
                        ID Empleado
                      </p>
                      <p className='text-sm font-mono bg-muted/50 px-2 py-1 rounded text-muted-foreground inline-block'>
                        {item.empleadoId}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Schedule Info Section */}
                <div className='space-y-6'>
                  <div className='flex items-center justify-between gap-2 pb-2 border-b'>
                    <div className='flex items-center gap-2'>
                      <Clock className='h-5 w-5 text-accent' />
                      <h3 className='text-xl font-semibold text-foreground'>
                        Información del Horario
                      </h3>
                    </div>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => setIsEditOpen(true)}
                      title='Editar Horario'
                      className='action-button-edit'
                    >
                      <Edit className='h-4 w-4' />
                    </Button>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-2'>
                      <p className='text-sm font-medium text-muted-foreground'>
                        Nombre del Horario
                      </p>
                      <p className='text-lg font-medium text-foreground'>
                        {item.horarioNombre}
                      </p>
                    </div>
                    <div className='space-y-2'>
                      <p className='text-sm font-medium text-muted-foreground'>
                        Tipo de Horario
                      </p>
                      <Badge
                        variant='outline'
                        className='bg-accent/10 text-accent border-accent/30 text-sm px-3 py-1'
                      >
                        {item.tipoHorarioNombre}
                      </Badge>
                    </div>
                    <div className='space-y-2 md:col-span-2'>
                      <p className='text-sm font-medium text-muted-foreground'>
                        Descripción
                      </p>
                      <p className='text-base text-foreground whitespace-pre-wrap'>
                        {horarioDescription ?? 'Sin descripción'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Assignment Details Section */}
                <div className='space-y-6'>
                  <div className='flex items-center gap-2 pb-2 border-b'>
                    <Calendar className='h-5 w-5 text-primary' />
                    <h3 className='text-xl font-semibold text-foreground'>
                      Detalles de la Asignación
                    </h3>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                    <div className='space-y-2'>
                      <p className='text-sm font-medium text-muted-foreground'>
                        Estado
                      </p>
                      <Badge
                        variant={item.activo ? 'default' : 'secondary'}
                        className={
                          item.activo
                            ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200 text-sm px-3 py-1'
                            : 'bg-muted text-muted-foreground border-border text-sm px-3 py-1'
                        }
                      >
                        {item.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <div className='space-y-2'>
                      <p className='text-sm font-medium text-muted-foreground'>
                        Fecha de Inicio
                      </p>
                      <p className='text-base text-foreground'>
                        {formatDate(item.fechaInicio)}
                      </p>
                    </div>
                    <div className='space-y-2'>
                      <p className='text-sm font-medium text-muted-foreground'>
                        Fecha de Fin
                      </p>
                      <p className='text-base text-foreground'>
                        {item.fechaFin
                          ? formatDate(item.fechaFin)
                          : 'Sin fecha límite'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Schedule Preview */}
              <div className='space-y-6'>
                <div className='flex items-center gap-2 pb-2 border-b'>
                  <Clock className='h-5 w-5 text-primary' />
                  <h3 className='text-xl font-semibold text-foreground'>
                    Vista Previa del Horario
                  </h3>
                </div>

                {isLoadingHorario ? (
                  <div className='flex flex-col items-center justify-center py-16'>
                    <LoadingState message='Cargando detalles del horario...' />
                  </div>
                ) : horarioError ? (
                  <div className='py-12'>
                    <ErrorState
                      message={horarioError}
                      onRetry={() => fetchHorarioDetails(item.horarioId)}
                    />
                  </div>
                ) : adaptedTemplate ? (
                  <div className='bg-card border border-border rounded-lg p-1 shadow-sm'>
                    <SchedulePreview
                      template={adaptedTemplate}
                      className='border-none bg-transparent shadow-none'
                    />
                  </div>
                ) : (
                  <div className='bg-muted/30 border border-dashed border-border rounded-lg p-12 text-center'>
                    <div className='flex flex-col items-center gap-4'>
                      <div className='w-16 h-16 rounded-full bg-muted flex items-center justify-center'>
                        <Clock className='h-8 w-8 text-muted-foreground' />
                      </div>
                      <div>
                        <p className='text-foreground font-medium text-lg mb-2'>
                          No se pudieron cargar los detalles del horario
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          Intente cerrar y abrir nuevamente el modal
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <UnifiedEditModal
        isOpen={isEditOpen}
        assignmentId={item.id}
        onClose={() => setIsEditOpen(false)}
        onSaved={() => {
          setIsEditOpen(false);
          if (item?.horarioId) {
            fetchHorarioDetails(item.horarioId);
          }
        }}
      />
    </>
  );
}
