'use client';

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { getEmpleadosAsignados, EmpleadoDto } from '@/lib/api/schedule-api';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface EmpleadosWarningAlertProps {
  horarioId: number;
  className?: string;
}

export function EmpleadosWarningAlert({
  horarioId,
  className,
}: EmpleadosWarningAlertProps) {
  const [empleados, setEmpleados] = useState<EmpleadoDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchEmpleados = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getEmpleadosAsignados(horarioId);
        setEmpleados(data);
      } catch (err) {
        console.error('Error fetching empleados asignados:', err);
        setError('Error al cargar empleados asignados');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmpleados();
  }, [horarioId]);

  if (isLoading) {
    return (
      <Alert className={className}>
        <AlertTriangle className='h-4 w-4' />
        <AlertTitle>Verificando empleados asignados...</AlertTitle>
        <AlertDescription>
          Cargando información de empleados para mostrar el impacto de los
          cambios.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant='destructive' className={className}>
        <AlertTriangle className='h-4 w-4' />
        <AlertTitle>Error al cargar empleados</AlertTitle>
        <AlertDescription>
          No se pudo verificar qué empleados están asignados a esta plantilla.
        </AlertDescription>
      </Alert>
    );
  }

  if (empleados.length === 0) {
    return (
      <Alert className={className}>
        <Users className='h-4 w-4' />
        <AlertTitle>Sin empleados asignados</AlertTitle>
        <AlertDescription>
          Esta plantilla no tiene empleados asignados actualmente, por lo que
          los cambios no afectarán a ningún empleado.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant='destructive' className={className}>
      <AlertTriangle className='h-4 w-4' />
      <AlertTitle>
        ¡Advertencia! - Empleados asignados serán afectados
      </AlertTitle>
      <AlertDescription className='space-y-3'>
        <p>
          Los cambios que realices en esta plantilla de horario{' '}
          <strong>afectarán inmediatamente</strong> a{' '}
          <strong>{empleados.length}</strong> empleado
          {empleados.length !== 1 ? 's' : ''} que actualmente tienen
          asignaciones activas con esta plantilla.
        </p>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              className='h-8 px-2 text-destructive hover:bg-destructive/10'
            >
              <Users className='h-4 w-4 mr-2' />
              {isOpen ? 'Ocultar' : 'Ver'} empleados afectados
              {isOpen ? (
                <ChevronUp className='h-4 w-4 ml-2' />
              ) : (
                <ChevronDown className='h-4 w-4 ml-2' />
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className='space-y-2 mt-3'>
            <div className='max-h-40 overflow-y-auto space-y-2 bg-destructive/5 rounded-md p-3'>
              {empleados.map((empleado) => (
                <div
                  key={empleado.id}
                  className='flex items-center justify-between p-2 bg-background rounded-md border'
                >
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium text-foreground'>
                      {empleado.nombreCompleto}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      RFC: {empleado.rfc} • #{empleado.numeroEmpleado}
                    </span>
                  </div>
                  {empleado.departamento && (
                    <Badge variant='outline' className='text-xs'>
                      {empleado.departamento.clave}
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            <p className='text-sm mt-2'>
              <strong>Recomendación:</strong> Revisa cuidadosamente los cambios
              antes de guardarlos, ya que se aplicarán inmediatamente a todos
              los empleados mostrados arriba.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </AlertDescription>
    </Alert>
  );
}
