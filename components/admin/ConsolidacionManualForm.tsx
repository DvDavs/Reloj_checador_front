'use client';

import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  DatabaseZap,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

import { getApiErrorMessage } from '@/lib/api/api-helpers';
import {
  consolidarAsistenciaManual,
  ConsolidacionResponse,
} from '@/lib/api/asistencia.api';
import {
  getAutoGenerationStatus,
  setAutoGenerationStatus,
  AutoGenerationStatus,
} from '@/lib/api/schedule-api';
import { Switch } from '@/components/ui/switch';

interface ConsolidacionManualFormProps {
  titleOverride?: string;
  descriptionOverride?: string;
  actionLabelOverride?: string;
  confirmTitleOverride?: string;
}

export function ConsolidacionManualForm({
  titleOverride,
  descriptionOverride,
  actionLabelOverride,
  confirmTitleOverride,
}: ConsolidacionManualFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<ConsolidacionResponse | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [isToggleConfirmOpen, setToggleConfirmOpen] = useState(false);
  const [pendingToggleValue, setPendingToggleValue] = useState<boolean | null>(
    null
  );
  const [autoGen, setAutoGen] = useState<AutoGenerationStatus | null>(null);
  const [autoGenBusy, setAutoGenBusy] = useState(false);
  const [lastConsolidatedDate, setLastConsolidatedDate] = useState<Date | null>(
    null
  );

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const status = await getAutoGenerationStatus();
        if (mounted) setAutoGen(status);
      } catch (err) {
        // Silencioso en UI; mostrar como info en toast
        toast({
          title: 'No se pudo obtener el estado automático',
          description: getApiErrorMessage(err),
        });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [toast]);

  const validateForm = (): boolean => {
    if (!selectedDate) {
      setError('Debe seleccionar una fecha para consolidar.');
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessInfo(null);
    if (validateForm()) {
      setConfirmOpen(true);
    }
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    setError(null);
    setConfirmOpen(false);

    try {
      const fechaFormateada = format(selectedDate!, 'yyyy-MM-dd');
      const response = await consolidarAsistenciaManual(fechaFormateada);

      setSuccessInfo(response);
      setLastConsolidatedDate(selectedDate!);
      toast({
        title: 'Generación de Asistencias Exitosa',
        description:
          response.mensaje ||
          `Registros consolidados: ${response.totalConsolidados}. Faltas: ${response.totalFaltas}.`,
      });
      setSelectedDate(null); // Reset date after success
    } catch (err) {
      const errorMessage = getApiErrorMessage(err);
      setError(errorMessage);
      toast({
        title: 'Error en la Generación de Asistencias',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            {titleOverride ?? 'Generación de Asistencias por Fecha'}
          </CardTitle>
          <CardDescription>
            {descriptionOverride ??
              'Seleccione una fecha para ejecutar manualmente el proceso de generación de asistencias diaria.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant='destructive' className='mb-4'>
              <AlertCircle className='h-4 w-4' />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successInfo && (
            <Alert className='mb-4 border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-700 dark:[&>svg]:text-green-400'>
              <CheckCircle2 className='h-4 w-4' />
              <AlertTitle>¡Proceso Completado!</AlertTitle>
              <AlertDescription>
                Fecha consolidada:{' '}
                <strong>
                  {lastConsolidatedDate
                    ? format(lastConsolidatedDate, 'PPP', { locale: es })
                    : ''}
                </strong>
                .<strong>{successInfo.totalConsolidados}</strong> registros
                consolidados. Faltas: <strong>{successInfo.totalFaltas}</strong>
                .
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-2'>
              <Label>Fecha a Consolidar</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className='w-full justify-start text-left font-normal'
                    disabled={loading}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {selectedDate ? (
                      format(selectedDate, 'PPP', { locale: es })
                    ) : (
                      <span>Seleccione una fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                  <Calendar
                    mode='single'
                    selected={selectedDate ?? undefined}
                    onSelect={(d) => {
                      setSelectedDate(d || null);
                      setError(null);
                    }}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button
              type='submit'
              disabled={loading || !selectedDate}
              className='w-full'
            >
              {loading ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <DatabaseZap className='mr-2 h-4 w-4' />
              )}
              {loading
                ? 'Procesando...'
                : (actionLabelOverride ?? 'Consolidar Asistencias')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Configuración multi‑PC y generación automática (debajo de la consolidación manual) */}
      <div className='mt-6'>
        <div className='rounded-md border p-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-1 pr-4'>
              <Label className='text-base'>Generación automática</Label>
              <p className='text-sm text-muted-foreground'>
                Controla si esta instancia ejecuta procesos automáticos (00:05).
              </p>
            </div>
            <div className='flex items-center gap-3'>
              <Switch
                checked={!!autoGen?.enabled}
                disabled={autoGen == null || autoGenBusy}
                onCheckedChange={async (checked) => {
                  setPendingToggleValue(checked);
                  setToggleConfirmOpen(true);
                }}
              />
            </div>
          </div>
          <div className='mt-4'>
            <Alert className='mb-4 border-blue-500/50 text-blue-700 dark:text-blue-400 [&>svg]:text-blue-700 dark:[&>svg]:text-blue-400'>
              <Info className='h-4 w-4' />
              <AlertTitle>Configuración multi‑PC</AlertTitle>
              <AlertDescription>
                En instalaciones con múltiples equipos, habilite la generación
                automática solo en una PC. En las demás, desactívela y utilice
                esta pantalla para realizar la consolidación manual cuando sea
                necesario.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmTitleOverride ?? '¿Confirmar Generación de Asistencias?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción ejecutará el proceso de generación de asistencias para
              la fecha{' '}
              <strong>
                {selectedDate
                  ? format(selectedDate, 'PPP', { locale: es })
                  : ''}
              </strong>
              . Esto puede sobrescribir datos de asistencia existentes para esa
              fecha si se han realizado cambios manuales. ¿Desea continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit} disabled={loading}>
              {loading ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                'Confirmar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmación para toggle de auto generación */}
      <AlertDialog
        open={isToggleConfirmOpen}
        onOpenChange={(open) => {
          setToggleConfirmOpen(open);
          if (!open) setPendingToggleValue(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingToggleValue
                ? '¿Habilitar generación automática en esta PC?'
                : '¿Deshabilitar generación automática en esta PC?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingToggleValue
                ? 'Esta instancia ejecutará los procesos programados automáticamente (00:05, 01:00 y 02:00).'
                : 'Esta instancia no ejecutará procesos automáticos. Podrá usar esta pantalla para consolidación manual cuando sea necesario.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={autoGenBusy}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (pendingToggleValue == null) return;
                setAutoGenBusy(true);
                try {
                  const updated =
                    await setAutoGenerationStatus(pendingToggleValue);
                  setAutoGen(updated);
                  toast({
                    title: 'Configuración actualizada',
                    description: `Generación automática ${updated.enabled ? 'habilitada' : 'deshabilitada'} para esta instancia.`,
                  });
                } catch (err) {
                  toast({
                    title: 'Error al actualizar',
                    description: getApiErrorMessage(err),
                    variant: 'destructive',
                  });
                } finally {
                  setAutoGenBusy(false);
                  setToggleConfirmOpen(false);
                  setPendingToggleValue(null);
                }
              }}
              disabled={autoGenBusy}
            >
              {autoGenBusy ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                'Confirmar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
