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
import type { HistoryPanelProps } from './interfaces';
import { historyPanelPropsAreEqual } from './utils/memoComparisons';
import type { ScanHistoryItem } from '../../lib/types/timeClockTypes';

function getBgAndBorderClasses(statusCode?: string | null): string {
  if (!statusCode) return 'bg-app-elevated/50';
  if (statusCode === 'FR') return 'bg-red-900/20 border border-red-800/30';
  if (statusCode.startsWith('2'))
    return 'bg-app-brand/20 border border-app-brand-muted/30';
  if (statusCode.startsWith('3'))
    return 'bg-app-brand-secondary/18 border border-app-brand-secondary/35';
  if (statusCode.startsWith('4'))
    return 'bg-red-900/20 border border-red-800/30';
  if (statusCode.startsWith('5'))
    return 'bg-red-900/20 border border-red-800/30';
  return 'bg-app-elevated/50';
}

function getAvatarBgClass(statusCode?: string | null): string {
  if (!statusCode) return 'bg-app-brand/25';
  if (statusCode === 'FR') return 'bg-red-500/30';
  if (statusCode.startsWith('200')) return 'bg-app-brand/35';
  if (statusCode.startsWith('201')) return 'bg-app-brand-secondary/35';
  if (statusCode.startsWith('202')) return 'bg-yellow-500/30';
  return 'bg-app-brand/25';
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
      return { Icon, colorClass: 'text-app-brand-muted' };
    if (statusCode.startsWith('201'))
      return { Icon, colorClass: 'text-app-on-dark' };
    if (statusCode.startsWith('202'))
      return { Icon, colorClass: 'text-yellow-400' };
    return { Icon, colorClass: 'text-app-brand-muted' };
  }
  if (statusCode && statusCode.startsWith('3')) {
    return { Icon: AlertCircle, colorClass: 'text-app-brand-muted' };
  }
  if (
    statusCode &&
    (statusCode.startsWith('4') || statusCode.startsWith('5'))
  ) {
    return { Icon: ShieldAlert, colorClass: 'text-red-500' };
  }
  return { Icon: LogIn, colorClass: 'text-app-brand-muted/70' };
}

function truncateName(name: string, maxLength = 28): string {
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength - 1) + '…';
}

// Memoized HistoryItem component for better performance
const HistoryItem = React.memo(
  function HistoryItem({
    scan,
    index,
    inactiveTimeSeconds,
  }: {
    scan: ScanHistoryItem;
    index: number;
    inactiveTimeSeconds: number;
  }) {
    // Memoize expensive calculations
    const itemData = useMemo(() => {
      const containerClasses = getBgAndBorderClasses(scan.statusCode);
      const { Icon, colorClass } = getActionIconAndColor(
        scan.statusCode,
        scan.action
      );
      const opacity =
        index === 0 ? 1 : Math.max(0.5, 1 - inactiveTimeSeconds * 0.01 * index);
      const formattedTime = format(scan.time, 'HH:mm:ss');
      const truncatedName = truncateName(scan.name);

      return {
        containerClasses,
        Icon,
        colorClass,
        opacity,
        formattedTime,
        truncatedName,
      };
    }, [
      scan.statusCode,
      scan.action,
      scan.time,
      scan.name,
      index,
      inactiveTimeSeconds,
    ]);

    const avatarBgClass = useMemo(
      () => getAvatarBgClass(scan.statusCode),
      [scan.statusCode]
    );

    return (
      <div
        key={`${scan.employeeId}-${scan.time.toString()}-${index}`}
        className={`flex items-center gap-3 p-3 rounded-md ${itemData.containerClasses}`}
        style={{ opacity: itemData.opacity, transition: 'opacity 1s ease' }}
      >
        <div
          className={`h-12 w-12 rounded-full flex items-center justify-center ${avatarBgClass}`}
        >
          <itemData.Icon className={`h-6 w-6 ${itemData.colorClass}`} />
        </div>
        <div className='flex-1'>
          <p className='text-lg font-bold text-app-on-dark' title={scan.name}>
            {itemData.truncatedName}
          </p>
          <div className='flex justify-between items-center'>
            <p className='text-base text-app-brand-muted/80'>
              {itemData.formattedTime}
            </p>
            {scan.success ? (
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  scan.action === 'entrada'
                    ? 'bg-app-brand/30 text-app-on-dark'
                    : 'bg-app-brand-secondary/28 text-app-on-dark'
                }`}
              >
                {scan.action === 'entrada' ? 'Entrada' : 'Salida'}
              </span>
            ) : (
              <span className='px-2 py-0.5 text-xs font-medium rounded-full bg-app-dark/80 text-app-brand-muted/70'>
                Intento
              </span>
            )}
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for HistoryItem
    return (
      prevProps.scan.employeeId === nextProps.scan.employeeId &&
      prevProps.scan.time.getTime() === nextProps.scan.time.getTime() &&
      prevProps.scan.success === nextProps.scan.success &&
      prevProps.scan.action === nextProps.scan.action &&
      prevProps.scan.statusCode === nextProps.scan.statusCode &&
      prevProps.index === nextProps.index &&
      Math.floor(prevProps.inactiveTimeSeconds / 10) ===
        Math.floor(nextProps.inactiveTimeSeconds / 10)
    );
  }
);

function HistoryPanelComponent({
  items,
  inactiveTimeSeconds = 0,
}: HistoryPanelProps) {
  const hasItems = items && items.length > 0;
  const maxItems = 5;

  // Memoize visible items calculation
  const visibleItems = useMemo(
    () => (hasItems ? items.slice(0, maxItems) : []),
    [hasItems, items, maxItems]
  );

  return (
    <div className='w-full md:w-80 bg-app-dark rounded-lg p-4 border-2 border-app-brand/35'>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-3'>
          <History className='h-6 w-6 text-app-brand-muted' />
          <h3 className='text-xl font-bold text-app-on-dark'>
            Últimos Registros
          </h3>
        </div>
      </div>

      <div className='space-y-4'>
        {!hasItems
          ? Array.from({ length: maxItems }).map((_, index) => (
              <div
                key={`history-placeholder-${index}`}
                className='flex items-center gap-3 p-3 rounded-md bg-app-elevated/40'
              >
                <div className='h-10 w-10 rounded-full flex items-center justify-center bg-app-brand/25'>
                  <Clock className='h-5 w-5 text-app-brand-muted/60' />
                </div>
                <div>
                  <p className='text-lg font-medium text-app-brand-muted/55'>
                    Sin registro
                  </p>
                  <p className='text-base text-app-brand-muted/40'>
                    00:00:00 • —
                  </p>
                </div>
              </div>
            ))
          : visibleItems.map((scan, index) => (
              <HistoryItem
                key={`${scan.employeeId}-${scan.time.toString()}-${index}`}
                scan={scan}
                index={index}
                inactiveTimeSeconds={inactiveTimeSeconds}
              />
            ))}
      </div>
    </div>
  );
}

export const HistoryPanel = React.memo(
  HistoryPanelComponent,
  historyPanelPropsAreEqual
);
