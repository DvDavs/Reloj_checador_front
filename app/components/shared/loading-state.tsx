'use client';

import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = 'Cargando...',
  className = 'flex flex-col justify-center items-center p-12',
}: LoadingStateProps) {
  return (
    <div className={className}>
      <div className='relative'>
        <div className='absolute inset-0 rounded-full bg-primary/30 animate-ping'></div>
        <Loader2 className='relative h-10 w-10 animate-spin text-primary' />
      </div>
      <div className='mt-4 text-center space-y-1'>
        <p className='text-lg font-medium text-foreground'>{message}</p>
        <p className='text-sm text-muted-foreground'>
          Por favor espera un momento...
        </p>
      </div>
    </div>
  );
}
