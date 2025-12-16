'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  AlertTriangle,
  Edit3,
  Users,
  User,
  CheckCircle2,
  Eye,
  BarChart3,
  TrendingUp,
} from 'lucide-react';

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

interface EstadisticasCorreccion {
  totalRegistros: number;
  estatusActuales: { [key: string]: number };
  empleadosAfectados: number;
  fechasAfectadas: string[];
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
  const [showPreview, setShowPreview] = useState(false);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const isIndividual = asistenciasSeleccionadas.length === 1;
  const isMasivo = asistenciasSeleccionadas.length > 1;

  const selectedEstatus = estatusDisponibles.find(
    (estatus) => estatus.id.toString() === formData.nuevoEstatusId
  );

  // Calcular estadísticas de la corrección
  const estadisticasCorreccion: EstadisticasCorreccion = useMemo(() => {
    const estatusActuales: { [key: string]: number } = {};
    const empleadosUnicos = new Set<number>();
    const fechasUnicas = new Set<string>();

    asistenciasSeleccionadas.forEach((asistencia) => {
      const estatus = asistencia.estatusAsistenciaNombre || 'Sin estatus';
      estatusActuales[estatus] = (estatusActuales[estatus] || 0) + 1;
      empleadosUnicos.add(asistencia.empleadoId);
      fechasUnicas.add(asistencia.fecha);
    });

    return {
      totalRegistros: asistenciasSeleccionadas.length,
      estatusActuales,
      empleadosAfectados: empleadosUnicos.size,
      fechasAfectadas: Array.from(fechasUnicas).sort(),
    };
  }, [asistenciasSeleccionadas]);

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
    setProgress(
      isMasivo ? { current: 0, total: asistenciasSeleccionadas.length } : null
    );

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

        const response = await corregirEstatusIndividual(
          asistencia.id,
          individualData
        );

        // Toast mejorado con información específica del backend
        const estatusAnterior = asistencia.estatusAsistenciaNombre;
        const estatusNuevo = selectedEstatus?.nombre || 'Nuevo estatus';

        let descripcionDetallada = '';
        let tituloToast = 'Corrección exitosa';
        let variantToast: 'default' | 'destructive' = 'default';
        let duracionToast = 6000;

        // Usar mensaje del backend si está disponible
        if (response.mensaje && response.mensaje !== 'Estatus corregido') {
          descripcionDetallada = response.mensaje;
        } else {
          descripcionDetallada = `${asistencia.empleadoNombre}: "${estatusAnterior}" → "${estatusNuevo}" (${asistencia.fecha})`;
        }

        // Agregar advertencias del backend
        if (response.warnings && response.warnings.length > 0) {
          const advertenciasTexto = response.warnings.join('. ');
          descripcionDetallada += ` ⚠️ Advertencias: ${advertenciasTexto}`;
          variantToast = 'destructive';
          duracionToast = 10000;
          tituloToast = 'Corrección completada con advertencias';
        }

        toast({
          title: tituloToast,
          description: descripcionDetallada,
          duration: duracionToast,
          variant: variantToast,
        });
      } else {
        // Corrección masiva
        const masiveData: EstatusCorrecionMasivaData = {
          ...correctionData,
          asistenciaIds: asistenciasSeleccionadas.map((a) => a.id),
        };

        const response = await corregirEstatusMasivo(masiveData);

        // Toast mejorado con estadísticas y información del backend
        const estatusNuevoNombre = selectedEstatus?.nombre || 'Nuevo estatus';
        const empleadosTexto =
          estadisticasCorreccion.empleadosAfectados === 1
            ? '1 empleado'
            : `${estadisticasCorreccion.empleadosAfectados} empleados`;
        const fechasTexto =
          estadisticasCorreccion.fechasAfectadas.length === 1
            ? '1 fecha'
            : `${estadisticasCorreccion.fechasAfectadas.length} fechas`;

        let descripcionDetallada = '';
        let tituloToast = 'Corrección masiva exitosa';
        let variantToast: 'default' | 'destructive' = 'default';
        let duracionToast = 8000;

        // Usar mensaje del backend si está disponible
        if (
          response.mensaje &&
          response.mensaje !== 'Estatus corregido masivamente'
        ) {
          descripcionDetallada = response.mensaje;
        } else {
          descripcionDetallada = `Se actualizaron ${asistenciasSeleccionadas.length} registros a "${estatusNuevoNombre}". Afectados: ${empleadosTexto} en ${fechasTexto}.`;
        }

        // Agregar detalles específicos si están disponibles
        if (response.detalles && response.detalles.length > 0) {
          const detallesTexto = response.detalles
            .map(
              (d) =>
                `${d.empleado} (${d.fecha}): ${d.estatusAnterior} → ${d.estatusNuevo}`
            )
            .join(', ');
          descripcionDetallada += ` Detalles: ${detallesTexto}`;
        }

        // Agregar advertencias del backend
        if (response.warnings && response.warnings.length > 0) {
          const advertenciasTexto = response.warnings.join('. ');
          descripcionDetallada += ` ⚠️ Advertencias: ${advertenciasTexto}`;
          variantToast = 'destructive';
          duracionToast = 12000;
          tituloToast = 'Corrección masiva completada con advertencias';
        }

        toast({
          title: tituloToast,
          description: descripcionDetallada,
          duration: duracionToast,
          variant: variantToast,
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
      let errorTitle = 'Error en la corrección';
      let sugerenciaSolucion = '';

      // Personalizar mensajes según el tipo de error
      if (errorMessage.includes('Sin horario asignado')) {
        errorTitle = 'Error: Sin horario asignado';
        sugerenciaSolucion =
          'Algunos empleados no tienen horario asignado para las fechas seleccionadas.';
      } else if (errorMessage.includes('estatus no válido')) {
        errorTitle = 'Error: Estatus no válido';
        sugerenciaSolucion =
          'El estatus seleccionado no es válido para estas asistencias.';
      } else if (errorMessage.includes('asistencia no encontrada')) {
        errorTitle = 'Error: Asistencia no encontrada';
        sugerenciaSolucion =
          'Una o más asistencias seleccionadas ya no existen.';
      } else if (errorMessage.includes('ya tiene el estatus')) {
        errorTitle = 'Error: Estatus duplicado';
        sugerenciaSolucion =
          'Algunas asistencias ya tienen el estatus seleccionado.';
      } else if (errorMessage.includes('fecha')) {
        errorTitle = 'Error: Fecha no válida';
        sugerenciaSolucion =
          'Verifique que las fechas de las asistencias sean válidas.';
      }

      setError(
        `${errorMessage}${sugerenciaSolucion ? ` ${sugerenciaSolucion}` : ''}`
      );

      toast({
        title: errorTitle,
        description: `${errorMessage}${sugerenciaSolucion ? ` ${sugerenciaSolucion}` : ''}`,
        variant: 'destructive',
        duration: 12000, // Más tiempo para leer errores específicos
      });
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, [
    validateForm,
    formData,
    isIndividual,
    asistenciasSeleccionadas,
    toast,
    onSuccess,
    handleClose,
    estadisticasCorreccion.empleadosAfectados,
    estadisticasCorreccion.fechasAfectadas.length,
    isMasivo,
    selectedEstatus?.nombre,
  ]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderPreviewChanges = () => {
    if (!showPreview || !selectedEstatus) return null;

    return (
      <Alert className='border-blue-200 bg-blue-50'>
        <Eye className='h-4 w-4 text-blue-600' />
        <AlertDescription className='text-blue-800'>
          <div className='space-y-3'>
            <div className='font-medium'>Vista previa de cambios:</div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-xs'>
              <div className='bg-white p-2 rounded border'>
                <div className='font-medium text-blue-900 mb-1'>Registros</div>
                <div>{estadisticasCorreccion.totalRegistros} asistencias</div>
              </div>
              <div className='bg-white p-2 rounded border'>
                <div className='font-medium text-blue-900 mb-1'>Empleados</div>
                <div>{estadisticasCorreccion.empleadosAfectados} personas</div>
              </div>
              <div className='bg-white p-2 rounded border'>
                <div className='font-medium text-blue-900 mb-1'>Fechas</div>
                <div>{estadisticasCorreccion.fechasAfectadas.length} días</div>
              </div>
            </div>

            <div className='bg-white p-3 rounded border'>
              <div className='font-medium text-blue-900 mb-2'>
                Cambios por estatus actual:
              </div>
              <div className='space-y-1 text-xs'>
                {Object.entries(estadisticasCorreccion.estatusActuales).map(
                  ([estatus, cantidad]) => (
                    <div
                      key={estatus}
                      className='flex justify-between items-center'
                    >
                      <span>"{estatus}"</span>
                      <div className='flex items-center gap-2'>
                        <Badge variant='outline' className='text-xs'>
                          {cantidad}
                        </Badge>
                        <span>→</span>
                        <Badge
                          variant='outline'
                          className='text-xs'
                          style={{
                            backgroundColor: selectedEstatus.color
                              ? `${selectedEstatus.color}20`
                              : undefined,
                            borderColor: selectedEstatus.color || undefined,
                          }}
                        >
                          {selectedEstatus.nombre}
                        </Badge>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {estadisticasCorreccion.fechasAfectadas.length <= 5 && (
              <div className='bg-white p-2 rounded border'>
                <div className='font-medium text-blue-900 mb-1'>
                  Fechas afectadas:
                </div>
                <div className='text-xs'>
                  {estadisticasCorreccion.fechasAfectadas.join(', ')}
                </div>
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  };

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
                <div className='flex items-center justify-between'>
                  <div className='text-xs text-muted-foreground'>
                    {selectedEstatus.descripcion}
                  </div>
                  {isMasivo && (
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => setShowPreview(!showPreview)}
                      disabled={!formData.nuevoEstatusId}
                      className='text-xs'
                    >
                      <Eye className='mr-1 h-3 w-3' />
                      {showPreview ? 'Ocultar' : 'Vista previa'}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Vista previa de cambios */}
            {renderPreviewChanges()}

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
                {progress ? (
                  <span>
                    Procesando... ({progress.current}/{progress.total})
                  </span>
                ) : (
                  'Procesando...'
                )}
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
