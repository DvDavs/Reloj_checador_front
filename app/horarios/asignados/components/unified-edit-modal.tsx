'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import WeeklyScheduleGrid, {
  WeeklySchedule,
} from '@/app/components/shared/WeeklyScheduleGrid';
import {
  detallesToWeeklySchedule,
  weeklyScheduleToDetalles,
  HorarioDto,
} from '@/app/horarios/plantillas/types';
import {
  getHorarioAsignadoById,
  getScheduleTypes,
  updateHorarioAsignado,
  getApiErrorMessage,
} from '@/lib/api/schedule-api';
import { apiClient } from '@/lib/apiClient';
import { format, parseISO } from 'date-fns';
import { TipoHorarioDTO } from '@/app/horarios/asignados/registrar/types';

interface UnifiedEditModalProps {
  isOpen: boolean;
  assignmentId: number | null;
  onClose: () => void;
  onSaved?: () => void;
}

export function UnifiedEditModal({
  isOpen,
  assignmentId,
  onClose,
  onSaved,
}: UnifiedEditModalProps) {
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Assignment state
  const [empleadoId, setEmpleadoId] = useState<number | null>(null);
  const [horarioId, setHorarioId] = useState<number | null>(null);
  const [tipoHorarioId, setTipoHorarioId] = useState<number | null>(null);
  const [assignmentStartDate, setAssignmentStartDate] = useState<Date | null>(
    null
  );
  const [assignmentEndDate, setAssignmentEndDate] = useState<Date | null>(null);
  const [scheduleTypes, setScheduleTypes] = useState<TipoHorarioDTO[]>([]);

  // Template state
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [esHorarioJefe, setEsHorarioJefe] = useState(false);
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);

  const resetState = () => {
    setIsLoading(false);
    setIsSaving(false);
    setError(null);
    setEmpleadoId(null);
    setHorarioId(null);
    setTipoHorarioId(null);
    setAssignmentStartDate(null);
    setAssignmentEndDate(null);
    setScheduleTypes([]);
    setNombre('');
    setDescripcion('');
    setEsHorarioJefe(false);
    setSchedule(null);
  };

  useEffect(() => {
    const loadData = async () => {
      if (!isOpen || !assignmentId) return;
      setIsLoading(true);
      setError(null);
      try {
        const [assignment, types] = await Promise.all([
          getHorarioAsignadoById(assignmentId),
          getScheduleTypes(),
        ]);
        setEmpleadoId(assignment.empleadoId);
        setHorarioId(assignment.horarioId);
        setTipoHorarioId(assignment.tipoHorarioId);
        setAssignmentStartDate(
          assignment.fechaInicio ? parseISO(assignment.fechaInicio) : null
        );
        setAssignmentEndDate(
          assignment.fechaFin ? parseISO(assignment.fechaFin) : null
        );
        setScheduleTypes(types);

        // Fetch horario details
        const horarioResp = await apiClient.get<HorarioDto>(
          `/api/horarios/${assignment.horarioId}`
        );
        const h = horarioResp.data;
        setNombre(h.nombre || '');
        setDescripcion(h.descripcion || '');
        setEsHorarioJefe(!!h.esHorarioJefe);
        setSchedule(detallesToWeeklySchedule(h.detalles));
      } catch (err) {
        const msg = getApiErrorMessage(err);
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
    // Reset when closing
    if (!isOpen) {
      resetState();
    }
     
  }, [isOpen, assignmentId]);

  const handleSave = async () => {
    if (!assignmentId || !horarioId || !empleadoId) return;
    if (!nombre.trim()) {
      setError('El nombre de la plantilla es obligatorio.');
      return;
    }
    if (!schedule) {
      setError('Defina al menos un turno en el horario.');
      return;
    }
    if (!assignmentStartDate) {
      setError('La fecha de inicio es obligatoria.');
      return;
    }
    if (!tipoHorarioId) {
      setError('Seleccione el tipo de horario.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      // 1) Update horario (plantilla)
      const detalles = weeklyScheduleToDetalles(schedule);
      await apiClient.put(`/api/horarios/${horarioId}`, {
        nombre,
        descripcion,
        esHorarioJefe,
        detalles,
      });

      // 2) Update assignment
      const startStr = format(assignmentStartDate, 'yyyy-MM-dd');
      const endStr = assignmentEndDate
        ? format(assignmentEndDate, 'yyyy-MM-dd')
        : null;
      await updateHorarioAsignado(assignmentId, {
        empleadoId,
        horarioId,
        tipoHorarioId: tipoHorarioId!,
        fechaInicio: startStr,
        fechaFin: endStr,
      });

      toast({
        title: 'Éxito',
        description: 'La asignación y su horario fueron actualizados.',
      });
      onSaved?.();
      onClose();
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className='max-w-5xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Editar Asignación y Horario</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className='flex items-center gap-2 text-muted-foreground p-6'>
            <Loader2 className='h-4 w-4 animate-spin' /> Cargando datos...
          </div>
        ) : error ? (
          <div className='p-4 text-sm text-destructive bg-destructive/10 rounded border border-destructive/30'>
            {error}
          </div>
        ) : (
          <div className='space-y-6'>
            {/* Plantilla */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label className='mb-2 block'>Nombre de la Plantilla</Label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  disabled={isSaving}
                  placeholder='Ej: Horario Matutino'
                />
              </div>
              <div>
                <Label className='mb-2 block'>Descripción (Opcional)</Label>
                <Input
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  disabled={isSaving}
                  placeholder='Breve descripción del horario'
                />
              </div>
              <div className='flex items-center gap-2 pt-1'>
                <Checkbox
                  id='esHorarioJefe'
                  checked={esHorarioJefe}
                  onCheckedChange={(c) => setEsHorarioJefe(!!c)}
                  disabled={isSaving}
                />
                <Label htmlFor='esHorarioJefe'>Es un horario para Jefes</Label>
              </div>
            </div>

            {/* Asignación */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='space-y-2'>
                <Label>Fecha de Inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant='outline' className='w-full justify-start'>
                      <CalendarIcon className='mr-2 h-4 w-4' />
                      {assignmentStartDate ? (
                        format(assignmentStartDate, 'PPP')
                      ) : (
                        <span>Seleccione fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0'>
                    <Calendar
                      mode='single'
                      selected={assignmentStartDate ?? undefined}
                      onSelect={(d) => setAssignmentStartDate(d ?? null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className='space-y-2'>
                <Label>Fecha de Fin (Opcional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant='outline' className='w-full justify-start'>
                      <CalendarIcon className='mr-2 h-4 w-4' />
                      {assignmentEndDate ? (
                        format(assignmentEndDate, 'PPP')
                      ) : (
                        <span>Seleccione fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0'>
                    <Calendar
                      mode='single'
                      selected={assignmentEndDate ?? undefined}
                      onSelect={(d) => setAssignmentEndDate(d ?? null)}
                      disabled={{ before: assignmentStartDate ?? new Date(0) }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className='space-y-2'>
                <Label>Tipo de Horario</Label>
                <Select
                  value={tipoHorarioId?.toString()}
                  onValueChange={(v) => setTipoHorarioId(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Seleccione un tipo' />
                  </SelectTrigger>
                  <SelectContent>
                    {scheduleTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        {t.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Editor semanal */}
            {schedule && (
              <div className='space-y-2'>
                <Label className='block text-base font-medium'>
                  Editor de Horario Semanal
                </Label>
                <WeeklyScheduleGrid
                  schedule={schedule}
                  onScheduleChange={setSchedule}
                  editable={!isSaving}
                />
              </div>
            )}

            <div className='flex justify-end gap-3 pt-2'>
              <Button variant='outline' onClick={onClose} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />{' '}
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className='mr-2 h-4 w-4' /> Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default UnifiedEditModal;
