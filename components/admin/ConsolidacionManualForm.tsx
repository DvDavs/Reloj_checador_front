'use client';

import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  DatabaseZap,
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
      toast({
        title: 'Consolidación Exitosa',
        description:
          response.mensaje ||
          `Registros consolidados: ${response.totalConsolidados}. Faltas: ${response.totalFaltas}.`,
      });
      setSelectedDate(null); // Reset date after success
    } catch (err) {
      const errorMessage = getApiErrorMessage(err);
      setError(errorMessage);
      toast({
        title: 'Error en la Consolidación',
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
            {titleOverride ?? 'Consolidar Asistencias por Fecha'}
          </CardTitle>
          <CardDescription>
            {descriptionOverride ??
              'Seleccione una fecha para ejecutar manualmente el proceso de consolidación diaria.'}
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
                <strong>{successInfo.totalConsolidados}</strong> registros
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

      <AlertDialog open={isConfirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmTitleOverride ?? '¿Confirmar Consolidación?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción ejecutará el proceso de consolidación para la fecha{' '}
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
    </>
  );
}
