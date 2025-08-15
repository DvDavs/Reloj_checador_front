'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  message: string;
  className?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message,
  className = 'flex flex-col items-center justify-center gap-6 p-8 rounded-xl border-2 border-red-200 bg-red-50/80 dark:border-red-800 dark:bg-red-950/30',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className={className}>
      <div className='flex flex-col items-center gap-4 text-center'>
        <div className='relative'>
          <div className='absolute inset-0 rounded-full bg-red-200 animate-pulse dark:bg-red-800/50'></div>
          <div className='relative bg-red-100 p-3 rounded-full border-2 border-red-300 dark:bg-red-900/50 dark:border-red-700'>
            <AlertCircle className='h-8 w-8 text-red-600 dark:text-red-400' />
          </div>
        </div>
        <div className='space-y-2'>
          <p className='font-semibold text-lg text-red-800 dark:text-red-300'>
            ¡Oops! Algo salió mal
          </p>
          <p className='text-red-700 dark:text-red-400 max-w-md leading-relaxed'>
            {message}
          </p>
        </div>
      </div>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant='destructive'
          size='sm'
          className='bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 shadow-md hover:shadow-lg transition-all duration-200'
        >
          <RefreshCw className='mr-2 h-4 w-4' />
          Reintentar
        </Button>
      )}
    </div>
  );
}
