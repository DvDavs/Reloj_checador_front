'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import { getEmpleadosAsignados, EmpleadoDto } from '@/lib/api/schedule-api';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface EmpleadosAsignadosCellProps {
  horarioId: number;
}

export function EmpleadosAsignadosCell({
  horarioId,
}: EmpleadosAsignadosCellProps) {
  const [empleados, setEmpleados] = useState<EmpleadoDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmpleados = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getEmpleadosAsignados(horarioId);
        setEmpleados(data);
      } catch (err) {
        console.error('Error fetching empleados asignados:', err);
        setError('Error al cargar empleados');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmpleados();
  }, [horarioId]);

  if (isLoading) {
    return (
      <div className='flex items-center gap-2'>
        <Users className='h-4 w-4 text-muted-foreground' />
        <span className='text-sm text-muted-foreground'>Cargando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center gap-2'>
        <Users className='h-4 w-4 text-destructive' />
        <span className='text-sm text-destructive'>Error</span>
      </div>
    );
  }

  if (empleados.length === 0) {
    return (
      <div className='flex items-center gap-2'>
        <Users className='h-4 w-4 text-muted-foreground' />
        <span className='text-sm text-muted-foreground'>Sin asignaciones</span>
      </div>
    );
  }

  // Si hay pocos empleados, mostrarlos directamente
  if (empleados.length <= 2) {
    return (
      <div className='flex items-center gap-2 flex-wrap'>
        <Users className='h-4 w-4 text-blue-500' />
        {empleados.map((empleado, index) => (
          <Badge
            key={empleado.id}
            variant='secondary'
            className='text-xs'
            title={`${empleado.nombreCompleto} (${empleado.rfc})`}
          >
            {empleado.nombreCompleto}
          </Badge>
        ))}
      </div>
    );
  }

  // Si hay muchos empleados, mostrar un contador con popover
  return (
    <div className='flex items-center gap-2'>
      <Users className='h-4 w-4 text-blue-500' />

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            className='h-6 px-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-950'
          >
            {empleados.length} empleados
            <ChevronDown className='h-3 w-3 ml-1' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-80 p-3' align='start'>
          <div className='space-y-2'>
            <h4 className='font-medium text-sm text-foreground'>
              Empleados Asignados ({empleados.length})
            </h4>
            <div className='max-h-32 overflow-y-auto space-y-1'>
              {empleados.map((empleado) => (
                <div
                  key={empleado.id}
                  className='flex items-center justify-between p-2 rounded-md bg-muted/50'
                >
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium'>
                      {empleado.nombreCompleto}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {empleado.rfc} • #{empleado.numeroEmpleado}
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
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
