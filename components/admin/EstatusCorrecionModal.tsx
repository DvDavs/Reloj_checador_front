'use client';

import React, { useState, useCallback } from 'react';
import { AlertTriangle, Edit3, Users, User, CheckCircle2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

import {
  corregirEstatusIndividual,
  corregirEstatusMasivo,
  AsistenciaRecord,
  EstatusDisponible,
  EstatusCorrecionData,
  EstatusCorrecionMasivaData,
} from '@/lib/api/asistencia.api';

// ============================================================================
// INTERFACES
// ============================================================================

interface EstatusCorrecionModalProps {
  /** Si el modal está abierto */
  open: boolean;
  /** Función para cerrar el modal */
  onClose: () => void;
  /** Asistencias seleccionadas para corregir */
  asistenciasSeleccionadas: AsistenciaRecord[];
  /** Lista de estatus disponibles */
  estatusDisponibles: EstatusDisponible[];
  /** Callback ejecutado después de una corrección exitosa */
  onSuccess: () => void;
}

interface FormData {
  nuevoEstatusId: string;
  motivo: string;
  observaciones: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function EstatusCorrecionModal({
  open,
  onClose,
  asistenciasSeleccionadas,
  estatusDisponibles,
  onSuccess,
}: EstatusCorrecionModalProps) {
  const { toast } = useToast();

  // ============================================================================
  // ESTADO LOCAL
  // ============================================================================

  const [formData, setFormData] = useState<FormData>({
    nuevoEstatusId: '',
    motivo: '',
    observaciones: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const isIndividual = asistenciasSeleccionadas.length === 1;
  const isMasivo = asistenciasSeleccionadas.length > 1;

  const selectedEstatus = estatusDisponibles.find(
    (estatus) => estatus.id.toString() === formData.nuevoEstatusId
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleClose = useCallback(() => {
    if (loading) return; // Prevenir cierre durante operación

    // Limpiar formulario al cerrar
    setFormData({
      nuevoEstatusId: '',
      motivo: '',
      observaciones: '',
    });
    setError(null);
    onClose();
  }, [loading, onClose]);

  const handleFormChange = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Limpiar error cuando el usuario empiece a escribir
      if (error) {
        setError(null);
      }
    },
    [error]
  );

  const validateForm = useCallback((): string | null => {
    if (!formData.nuevoEstatusId) {
      return 'Debe seleccionar un nuevo estatus.';
    }

    if (!formData.motivo.trim()) {
      return 'Debe proporcionar un motivo para la corrección.';
    }

    if (formData.motivo.trim().length < 10) {
      return 'El motivo debe tener al menos 10 caracteres.';
    }

    return null;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    // Validar formulario
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const correctionData = {
        nuevoEstatusId: parseInt(formData.nuevoEstatusId),
        motivo: formData.motivo.trim(),
        observaciones: formData.observaciones.trim() || undefined,
      };

      if (isIndividual) {
        // Corrección individual
        const asistencia = asistenciasSeleccionadas[0];
        const individualData: EstatusCorrecionData = {
          ...correctionData,
          asistenciaId: asistencia.id, // Incluir el ID de la asistencia
        };

        await corregirEstatusIndividual(asistencia.id, individualData);

        toast({
          title: 'Corrección exitosa',
          description: `El estatus de ${asistencia.empleadoNombre} ha sido actualizado correctamente.`,
        });
      } else {
        // Corrección masiva
        const masiveData: EstatusCorrecionMasivaData = {
          ...correctionData,
          asistenciaIds: asistenciasSeleccionadas.map((a) => a.id),
        };

        await corregirEstatusMasivo(masiveData);

        toast({
          title: 'Corrección masiva exitosa',
          description: `Se actualizaron ${asistenciasSeleccionadas.length} registros de asistencia correctamente.`,
        });
      }

      // Ejecutar callback de éxito y cerrar modal
      onSuccess();
      handleClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error inesperado al corregir el estatus.';
      setError(errorMessage);

      toast({
        title: 'Error en la corrección',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [
    validateForm,
    formData,
    isIndividual,
    asistenciasSeleccionadas,
    toast,
    onSuccess,
    handleClose,
  ]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderAsistenciasSummary = () => {
    if (isIndividual) {
      const asistencia = asistenciasSeleccionadas[0];
      return (
        <div className='space-y-3'>
          <div className='flex items-center gap-2 text-sm font-medium'>
            <User className='h-4 w-4' />
            Corrección Individual
          </div>
          <div className='bg-muted/50 rounded-lg p-3 space-y-2'>
            <div className='flex justify-between items-start'>
              <div>
                <div className='font-medium'>{asistencia.empleadoNombre}</div>
                <div className='text-sm text-muted-foreground'>
                  ID: {asistencia.empleadoId} • {asistencia.fecha}
                </div>
              </div>
              <Badge variant='outline'>
                {asistencia.estatusAsistenciaNombre}
              </Badge>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className='space-y-3'>
        <div className='flex items-center gap-2 text-sm font-medium'>
          <Users className='h-4 w-4' />
          Corrección Masiva
        </div>
        <div className='bg-muted/50 rounded-lg p-3'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-sm font-medium'>
              {asistenciasSeleccionadas.length} registros seleccionados
            </span>
            <Badge variant='secondary'>{asistenciasSeleccionadas.length}</Badge>
          </div>
          <div className='text-xs text-muted-foreground'>
            Se aplicará el mismo estatus y motivo a todos los registros
            seleccionados.
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Edit3 className='h-5 w-5' />
            Corregir Estatus de Asistencia
          </DialogTitle>
          <DialogDescription>
            {isIndividual
              ? 'Modifique el estatus de la asistencia seleccionada.'
              : `Modifique el estatus de ${asistenciasSeleccionadas.length} asistencias seleccionadas.`}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Resumen de asistencias */}
          {renderAsistenciasSummary()}

          {/* Formulario de corrección */}
          <div className='space-y-4'>
            {/* Selección de nuevo estatus */}
            <div className='space-y-2'>
              <Label htmlFor='nuevo-estatus'>Nuevo Estatus *</Label>
              <Select
                value={formData.nuevoEstatusId}
                onValueChange={(value) =>
                  handleFormChange('nuevoEstatusId', value)
                }
                disabled={loading}
              >
                <SelectTrigger id='nuevo-estatus'>
                  <SelectValue placeholder='Seleccione el nuevo estatus' />
                </SelectTrigger>
                <SelectContent>
                  {estatusDisponibles.map((estatus) => (
                    <SelectItem key={estatus.id} value={estatus.id.toString()}>
                      <div className='flex items-center gap-2'>
                        {estatus.color && (
                          <div
                            className='w-3 h-3 rounded-full'
                            style={{ backgroundColor: estatus.color }}
                          />
                        )}
                        <span>{estatus.nombre}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedEstatus && (
                <div className='text-xs text-muted-foreground'>
                  {selectedEstatus.descripcion}
                </div>
              )}
            </div>

            {/* Motivo de la corrección */}
            <div className='space-y-2'>
              <Label htmlFor='motivo'>Motivo de la Corrección *</Label>
              <Textarea
                id='motivo'
                placeholder='Explique el motivo de esta corrección (mínimo 10 caracteres)'
                value={formData.motivo}
                onChange={(e) => handleFormChange('motivo', e.target.value)}
                disabled={loading}
                rows={3}
                className='resize-none'
              />
              <div className='text-xs text-muted-foreground'>
                {formData.motivo.length}/10 caracteres mínimos
              </div>
            </div>

            {/* Observaciones adicionales */}
            <div className='space-y-2'>
              <Label htmlFor='observaciones'>Observaciones Adicionales</Label>
              <Textarea
                id='observaciones'
                placeholder='Observaciones adicionales (opcional)'
                value={formData.observaciones}
                onChange={(e) =>
                  handleFormChange('observaciones', e.target.value)
                }
                disabled={loading}
                rows={2}
                className='resize-none'
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <Alert variant='destructive'>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Advertencia para corrección masiva */}
          {isMasivo && (
            <Alert>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>
                <strong>Atención:</strong> Esta acción modificará{' '}
                {asistenciasSeleccionadas.length} registros de asistencia de
                forma simultánea. Esta operación no se puede deshacer.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              loading || !formData.nuevoEstatusId || !formData.motivo.trim()
            }
          >
            {loading ? (
              <>
                <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                Procesando...
              </>
            ) : (
              <>
                <CheckCircle2 className='mr-2 h-4 w-4' />
                {isIndividual
                  ? 'Corregir Estatus'
                  : `Corregir ${asistenciasSeleccionadas.length} Registros`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
