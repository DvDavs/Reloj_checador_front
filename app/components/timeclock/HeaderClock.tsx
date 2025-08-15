'use client';

import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Calendar,
  Clock,
  Fingerprint,
  Maximize,
  Minimize,
  RefreshCw,
} from 'lucide-react';
import type { HeaderClockProps } from './interfaces';

function HeaderClockComponent({
  currentTime,
  isConnected,
  selectedReader,
  isFullScreen,
  onToggleFullScreen,
  onReload,
}: HeaderClockProps) {
  return (
    <div className='flex justify-between items-center bg-zinc-900 rounded-lg p-4 border-2 border-zinc-800'>
      <div className='flex items-center gap-3'>
        <Clock className='h-10 w-10 text-zinc-400' />
        <span className='text-4xl font-bold text-white'>
          {currentTime ? format(currentTime, 'HH:mm:ss') : '00:00:00'}
        </span>
      </div>

      <div className='flex items-center gap-3'>
        <Calendar className='h-8 w-8 text-zinc-400' />
        <span className='text-2xl font-medium text-white'>
          {currentTime
            ? format(currentTime, 'EEE, dd MMM yyyy', { locale: es })
            : '---, -- --- ----'}
        </span>
      </div>

      <div className='flex items-center gap-3'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='outline'
                size='icon'
                onClick={onToggleFullScreen}
                className='bg-zinc-800 border-zinc-700 hover:bg-zinc-700'
                aria-label={
                  isFullScreen ? 'Exit fullscreen' : 'Enter fullscreen'
                }
              >
                {isFullScreen ? (
                  <Minimize className='h-4 w-4' />
                ) : (
                  <Maximize className='h-4 w-4' />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isFullScreen
                  ? 'Salir de pantalla completa'
                  : 'Pantalla completa'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='outline'
                size='icon'
                onClick={onReload}
                className='bg-zinc-800 border-zinc-700 hover:bg-zinc-700'
                aria-label='Reload'
              >
                <RefreshCw className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Recargar página</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {isConnected && selectedReader && (
          <div className='flex items-center space-x-2 bg-blue-900/30 p-2 rounded-lg border border-blue-800'>
            <Fingerprint className='h-4 w-4 text-blue-400' />
            <span className='text-sm text-blue-300'>{selectedReader}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export const HeaderClock = React.memo(HeaderClockComponent);
