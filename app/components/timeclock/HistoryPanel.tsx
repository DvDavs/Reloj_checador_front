'use client';

import React, { useMemo } from 'react';
import { format } from 'date-fns';
import {
  History,
  Clock,
  LogIn,
  LogOut,
  AlertCircle,
  XCircle,
  ShieldAlert,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import type { HistoryPanelProps } from './interfaces';

function getBgAndBorderClasses(statusCode?: string | null): string {
  if (!statusCode) return 'bg-zinc-800/50';
  if (statusCode === 'FR') return 'bg-red-900/20 border border-red-800/30';
  if (statusCode.startsWith('2'))
    return 'bg-green-900/20 border border-green-800/30';
  if (statusCode.startsWith('3'))
    return 'bg-blue-900/20 border border-blue-800/30';
  if (statusCode.startsWith('4'))
    return 'bg-red-900/20 border border-red-800/30';
  if (statusCode.startsWith('5'))
    return 'bg-red-900/20 border border-red-800/30';
  return 'bg-zinc-800/50';
}

function getAvatarBgClass(statusCode?: string | null): string {
  if (!statusCode) return 'bg-zinc-500/30';
  if (statusCode === 'FR') return 'bg-red-500/30';
  if (statusCode.startsWith('200')) return 'bg-green-500/30';
  if (statusCode.startsWith('201')) return 'bg-blue-500/30';
  if (statusCode.startsWith('202')) return 'bg-yellow-500/30';
  return 'bg-zinc-500/30';
}

function getActionIconAndColor(
  statusCode: string | undefined | null,
  action: 'entrada' | 'salida'
) {
  if (statusCode === 'FR') {
    return { Icon: XCircle, colorClass: 'text-red-500' };
  }
  if (statusCode && statusCode.startsWith('2')) {
    const Icon = action === 'entrada' ? LogIn : LogOut;
    if (statusCode.startsWith('200'))
      return { Icon, colorClass: 'text-green-500' };
    if (statusCode.startsWith('201'))
      return { Icon, colorClass: 'text-blue-500' };
    if (statusCode.startsWith('202'))
      return { Icon, colorClass: 'text-orange-500' };
    return { Icon, colorClass: 'text-green-500' };
  }
  if (statusCode && statusCode.startsWith('3')) {
    return { Icon: AlertCircle, colorClass: 'text-blue-500' };
  }
  if (
    statusCode &&
    (statusCode.startsWith('4') || statusCode.startsWith('5'))
  ) {
    return { Icon: ShieldAlert, colorClass: 'text-red-500' };
  }
  return { Icon: LogIn, colorClass: 'text-zinc-400' };
}

function truncateName(name: string, maxLength = 28): string {
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength - 1) + '…';
}

function HistoryPanelComponent({
  items,
  soundEnabled,
  onToggleSound,
  inactiveTimeSeconds = 0,
}: HistoryPanelProps) {
  const hasItems = items && items.length > 0;
  const maxItems = 6;

  const visibleItems = useMemo(
    () => (hasItems ? items.slice(0, maxItems) : []),
    [hasItems, items]
  );

  return (
    <div className='w-full md:w-80 bg-zinc-900 rounded-lg p-4 border-2 border-zinc-800'>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-3'>
          <History className='h-6 w-6 text-zinc-400' />
          <h3 className='text-xl font-bold text-zinc-300'>Últimos Registros</h3>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-xs text-zinc-400'>Sonido</span>
          <Switch checked={soundEnabled} onCheckedChange={onToggleSound} />
        </div>
      </div>

      <div className='space-y-4'>
        {!hasItems
          ? Array.from({ length: maxItems }).map((_, index) => (
              <div
                key={`history-placeholder-${index}`}
                className='flex items-center gap-3 p-3 rounded-md bg-zinc-800/30'
              >
                <div className='h-10 w-10 rounded-full flex items-center justify-center bg-zinc-800'>
                  <Clock className='h-5 w-5 text-zinc-600' />
                </div>
                <div>
                  <p className='text-lg font-medium text-zinc-600'>
                    Sin registro
                  </p>
                  <p className='text-base text-zinc-700'>00:00:00 • —</p>
                </div>
              </div>
            ))
          : visibleItems.map((scan, index) => {
              const containerClasses = getBgAndBorderClasses(scan.statusCode);
              const { Icon, colorClass } = getActionIconAndColor(
                scan.statusCode,
                scan.action
              );
              const opacity =
                index === 0
                  ? 1
                  : Math.max(0.5, 1 - inactiveTimeSeconds * 0.01 * index);
              return (
                <div
                  key={`${scan.employeeId}-${scan.time.toString()}-${index}`}
                  className={`flex items-center gap-3 p-3 rounded-md ${containerClasses}`}
                  style={{ opacity, transition: 'opacity 1s ease' }}
                >
                  <div
                    className={`h-12 w-12 rounded-full flex items-center justify-center ${getAvatarBgClass(scan.statusCode)}`}
                  >
                    <Icon className={`h-6 w-6 ${colorClass}`} />
                  </div>
                  <div className='flex-1'>
                    <p
                      className='text-lg font-bold text-white'
                      title={scan.name}
                    >
                      {truncateName(scan.name)}
                    </p>
                    <div className='flex justify-between items-center'>
                      <p className='text-base text-zinc-400'>
                        {format(scan.time, 'HH:mm:ss')}
                      </p>
                      {scan.success ? (
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${scan.action === 'entrada' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'}`}
                        >
                          {scan.action === 'entrada' ? 'Entrada' : 'Salida'}
                        </span>
                      ) : (
                        <span className='px-2 py-0.5 text-xs font-medium rounded-full bg-zinc-700/50 text-zinc-400'>
                          Intento
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}

export const HistoryPanel = React.memo(HistoryPanelComponent);
