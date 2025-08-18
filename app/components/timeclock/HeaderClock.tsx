'use client';

import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
import { headerClockPropsAreEqual } from './utils/memoComparisons';

function HeaderClockComponent({
  currentTime,
  isConnected,
  selectedReader,
  isFullScreen,
  onToggleFullScreen,
  onReload,
  soundEnabled = true,
  onToggleSound,
}: HeaderClockProps) {
  // Memoize formatted time strings to avoid recalculating on every render
  const formattedTime = useMemo(() => {
    return currentTime ? format(currentTime, 'HH:mm:ss') : '00:00:00';
  }, [currentTime]);

  const formattedDate = useMemo(() => {
    return currentTime
      ? format(currentTime, 'EEE, dd MMM yyyy', { locale: es })
      : '---, -- --- ----';
  }, [currentTime]);

  // Mostrar solo los últimos 5 caracteres del lector, omitiendo el último
  // si es un carácter no alfanumérico (p. ej. '}' o ')'). Ej.: "B2FE}" -> "B2FE"
  const shortReaderId = useMemo(() => {
    if (!selectedReader) return null;
    const tail = selectedReader.slice(-5);
    return tail.replace(/[^A-Za-z0-9]$/, '');
  }, [selectedReader]);

  return (
    <div className='flex justify-between items-center bg-zinc-900 rounded-lg px-4 py-5 border-2 border-zinc-800'>
      <div className='flex items-center gap-3'>
        <Clock className='h-12 w-12 text-zinc-400' />
        <span className='text-5xl xl:text-6xl font-bold text-white leading-none'>
          {formattedTime}
        </span>
      </div>

      <div className='flex items-center gap-3'>
        <Calendar className='h-9 w-9 text-zinc-400' />
        <span className='text-2xl xl:text-3xl font-medium text-white'>
          {formattedDate}
        </span>
      </div>

      <div className='flex items-center gap-3'>
        {/* Sonido toggle para asemejar la vista original */}
        <div className='hidden md:flex items-center space-x-2 bg-zinc-800 p-2 rounded-lg'>
          <Switch
            id='sound-toggle'
            data-testid='sound-toggle'
            checked={soundEnabled}
            onCheckedChange={(v) => onToggleSound && onToggleSound(v)}
          />
          <label htmlFor='sound-toggle' className='text-xs text-zinc-400'>
            Sonido
          </label>
        </div>

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

        {isConnected && shortReaderId && (
          <div
            className='flex items-center space-x-2 bg-zinc-800/60 p-2 rounded-lg border border-zinc-700 connected'
            data-testid='connection-status'
          >
            <Fingerprint className='h-5 w-5 text-blue-400' />
            <span className='text-sm font-medium text-blue-300'>
              {shortReaderId}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export const HeaderClock = React.memo(
  HeaderClockComponent,
  headerClockPropsAreEqual
);
