'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, ExternalLink } from 'lucide-react';

interface ErrorWithLinksProps {
  title?: string;
  message: string;
  className?: string;
}

export function ErrorWithLinks({
  title = 'Error',
  message,
  className,
}: ErrorWithLinksProps) {
  // Función para parsear IDs del mensaje de error
  const parseScheduleConflicts = (errorMessage: string) => {
    // Regex para encontrar patrones como "ID 514 (Nombre del Empleado - Nombre del Horario del ...)"
    const conflictRegex = /ID (\d+) \(([^)]+)\)/g;
    const conflicts: { id: string; details: string }[] = [];
    let match;

    while ((match = conflictRegex.exec(errorMessage)) !== null) {
      conflicts.push({
        id: match[1],
        details: match[2],
      });
    }

    return conflicts;
  };

  // Función para renderizar el mensaje con enlaces
  const renderMessageWithLinks = (errorMessage: string) => {
    const conflicts = parseScheduleConflicts(errorMessage);

    if (conflicts.length === 0) {
      // Si no hay conflictos detectados, mostrar mensaje normal
      return <span>{errorMessage}</span>;
    }

    // Dividir el mensaje en partes para insertar los enlaces
    let result = errorMessage;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    // Encontrar y reemplazar cada conflicto con un enlace
    const conflictRegex = /ID (\d+) \(([^)]+)\)/g;
    let match;
    let elementKey = 0;

    while ((match = conflictRegex.exec(errorMessage)) !== null) {
      const matchStart = match.index;
      const matchEnd = match.index + match[0].length;
      const id = match[1];
      const details = match[2];

      // Agregar texto antes del match
      if (matchStart > lastIndex) {
        elements.push(
          <span key={`text-${elementKey++}`}>
            {errorMessage.substring(lastIndex, matchStart)}
          </span>
        );
      }

      // Agregar el enlace clickeable
      elements.push(
        <Button
          key={`link-${elementKey++}`}
          variant='link'
          size='sm'
          className='h-auto p-0 text-destructive underline inline-flex items-center gap-1'
          onClick={() => {
            const url = `/horarios/asignados?highlight=${id}`;
            window.open(url, '_blank', 'noopener,noreferrer');
          }}
        >
          ID {id} ({details})
          <ExternalLink className='h-3 w-3' />
        </Button>
      );

      lastIndex = matchEnd;
    }

    // Agregar texto restante después del último match
    if (lastIndex < errorMessage.length) {
      elements.push(
        <span key={`text-${elementKey++}`}>
          {errorMessage.substring(lastIndex)}
        </span>
      );
    }

    return <div className='inline'>{elements}</div>;
  };

  return (
    <Alert variant='destructive' className={className}>
      <AlertCircle className='h-4 w-4' />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className='mt-2'>
        {renderMessageWithLinks(message)}
      </AlertDescription>
    </Alert>
  );
}
