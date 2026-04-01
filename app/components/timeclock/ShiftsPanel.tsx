'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  LogIn,
  LogOut,
  Timer,
} from 'lucide-react';
import type { ShiftsPanelProps } from './interfaces';
import { formatTime } from '../../lib/timeClockUtils';
import { shiftsPanelPropsAreEqual } from './utils/memoComparisons';

type TurnoSize = 'large' | 'medium' | 'small' | 'xsmall';

function getStatusIndicator(
  estatus: string,
  shouldShowAsAbsent: boolean
): {
  icon: React.ReactNode;
  textColor: string;
  bgColor: string;
  borderColor: string;
  gradientBg: string;
  statusBgColor: string;
  statusTextColor: string;
} {
  const isCompleted = estatus === 'COMPLETADA';
  const isInProgress =
    estatus === 'EN_CURSO' ||
    estatus === 'RETARDO' ||
    estatus === 'RETARDO_SIN_SALIDA';
  const isAbsent = estatus.includes('AUSENTE');

  if (isCompleted) {
    return {
      icon: <CheckCircle className='h-5 w-5 text-app-brand-muted' />,
      textColor: 'text-app-on-dark',
      bgColor: 'bg-app-brand/25',
      borderColor: 'border-app-brand-muted/50',
      gradientBg:
        'linear-gradient(to right, hsl(var(--app-brand) / 0.2), hsl(var(--app-brand) / 0.06))',
      statusBgColor: 'bg-app-brand/35',
      statusTextColor: 'text-app-on-dark',
    };
  }

  if (isInProgress) {
    return {
      icon: <Timer className='h-5 w-5 text-app-brand-muted' />,
      textColor: 'text-app-brand-muted',
      bgColor: 'bg-app-brand-secondary/20',
      borderColor: 'border-app-brand-secondary/50',
      gradientBg:
        'linear-gradient(to right, hsl(var(--app-brand-secondary) / 0.18), hsl(var(--app-brand-secondary) / 0.05))',
      statusBgColor: 'bg-app-brand-secondary/30',
      statusTextColor: 'text-app-on-dark',
    };
  }

  if (isAbsent && shouldShowAsAbsent) {
    return {
      icon: <Ban className='h-5 w-5 text-app-brand-muted' />,
      textColor: 'text-app-brand-muted',
      bgColor: 'bg-app-dark/60',
      borderColor: 'border-app-brand/45',
      gradientBg:
        'linear-gradient(to right, hsl(var(--app-dark) / 0.5), hsl(var(--app-brand) / 0.12))',
      statusBgColor: 'bg-app-brand/25',
      statusTextColor: 'text-app-on-dark',
    };
  }

  return {
    icon: <Timer className='h-5 w-5 text-app-brand-muted/80' />,
    textColor: 'text-app-brand-muted',
    bgColor: 'bg-app-brand/15',
    borderColor: 'border-app-brand/35',
    gradientBg: '',
    statusBgColor: 'bg-app-elevated',
    statusTextColor: 'text-app-on-dark',
  };
}

function getTimeBoxColor(estatus: string, tipo: 'entrada' | 'salida'): string {
  if (estatus === 'COMPLETADA') return 'border-app-brand-muted/50';
  if (estatus === 'EN_CURSO')
    return tipo === 'entrada'
      ? 'border-app-brand-muted/50'
      : 'border-app-brand-secondary/40';
  if (estatus === 'RETARDO' || estatus === 'RETARDO_SIN_SALIDA')
    return 'border-yellow-500/45';
  if (estatus.includes('AUSENTE')) return 'border-app-brand-muted/35';
  return 'border-app-brand/35';
}

// Memoized TurnoItem component to prevent unnecessary re-renders
const TurnoItem = React.memo(
  function TurnoItem({
    jornada,
    isActive = false,
    isExpanded = false,
    size = 'medium',
    currentTime,
    onClick,
  }: {
    jornada: ShiftsPanelProps['jornadas'][number];
    isActive?: boolean;
    isExpanded?: boolean;
    size?: TurnoSize;
    currentTime: Date;
    onClick?: () => void;
  }) {
    // Memoize expensive calculations
    const jornadaStatus = useMemo(() => {
      const isCompleted = jornada.estatusJornada === 'COMPLETADA';
      const isPending = jornada.estatusJornada === 'PENDIENTE';
      const isAbsent = jornada.estatusJornada.includes('AUSENTE');
      const isInProgress = jornada.estatusJornada === 'EN_CURSO';
      const hasDelay =
        jornada.minutosRetardoPreliminar !== null &&
        jornada.minutosRetardoPreliminar > 0;

      const currentTimeStr = currentTime.toTimeString().substring(0, 8);
      const shouldShowAsAbsent =
        isAbsent && currentTimeStr > jornada.horaSalidaProgramada;

      return {
        isCompleted,
        isPending,
        isAbsent,
        isInProgress,
        hasDelay,
        shouldShowAsAbsent,
      };
    }, [
      jornada.estatusJornada,
      jornada.minutosRetardoPreliminar,
      jornada.horaSalidaProgramada,
      currentTime,
    ]);

    const {
      isCompleted,
      isPending,
      isAbsent,
      isInProgress,
      hasDelay,
      shouldShowAsAbsent,
    } = jornadaStatus;

    // Memoize status indicator to avoid recalculation
    const statusIndicator = useMemo(() => {
      return getStatusIndicator(jornada.estatusJornada, shouldShowAsAbsent);
    }, [jornada.estatusJornada, shouldShowAsAbsent]);

    const {
      icon,
      textColor,
      bgColor,
      borderColor,
      gradientBg,
      statusBgColor,
      statusTextColor,
    } = statusIndicator;

    const sizeClasses = useMemo(() => {
      switch (size) {
        case 'large':
          return {
            container: 'p-4 mb-3',
            text: 'text-lg',
            subText: 'text-sm',
            icon: 'w-8 h-8',
            timeText: 'text-2xl',
            badge: 'px-3 py-1 text-sm',
          };
        case 'medium':
          return {
            container: 'p-3 mb-2',
            text: 'text-base',
            subText: 'text-sm',
            icon: 'w-6 h-6',
            timeText: 'text-xl',
            badge: 'px-2 py-0.5 text-xs',
          };
        case 'small':
          return {
            container: 'p-2 mb-2',
            text: 'text-sm',
            subText: 'text-xs',
            icon: 'w-5 h-5',
            timeText: 'text-lg',
            badge: 'px-2 py-0.5 text-xs',
          };
        case 'xsmall':
          return {
            container: 'p-2 mb-1',
            text: 'text-xs',
            subText: 'text-xs',
            icon: 'w-4 h-4',
            timeText: 'text-sm',
            badge: 'px-1 py-0.5 text-xs',
          };
      }
    }, [size]);

    // Memoize estado texto calculation
    const estadoTexto = useMemo(() => {
      if (isAbsent && !shouldShowAsAbsent) return 'Próximo';
      switch (jornada.estatusJornada) {
        case 'COMPLETADA':
          return 'Completado';
        case 'EN_CURSO':
          return 'En curso';
        case 'RETARDO':
          return 'En curso';
        case 'RETARDO_SIN_SALIDA':
          return shouldShowAsAbsent ? 'Sin salida' : 'En curso';
        case 'PENDIENTE':
          return 'Próximo';
        case 'AUSENTE_ENTRADA':
          return shouldShowAsAbsent ? 'Sin entrada' : 'Próximo';
        case 'AUSENTE_SALIDA':
          return shouldShowAsAbsent ? 'Sin salida' : 'Próximo';
        case 'AUSENTE':
          return shouldShowAsAbsent ? 'Ausente' : 'Próximo';
        default:
          return 'Próximo';
      }
    }, [jornada.estatusJornada, isAbsent, shouldShowAsAbsent]);

    return (
      <motion.div
        className={`${sizeClasses.container} rounded-md border transition-all duration-300 cursor-pointer ${
          isExpanded ? 'scale-100' : 'scale-98 hover:scale-100'
        } ${isActive ? 'border-app-brand-secondary shadow-app-brand-secondary/35 shadow-lg active' : borderColor}`}
        style={{
          opacity: isCompleted ? 0.9 : isPending ? 0.95 : 1,
          background: isActive
            ? 'linear-gradient(to right, hsl(var(--app-brand-secondary) / 0.28), hsl(var(--app-brand) / 0.08))'
            : gradientBg,
        }}
        onClick={onClick}
        initial={{ opacity: 0.6, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: isExpanded ? 1 : 1.02 }}
        data-testid={`shift-${jornada.detalleHorarioId}`}
      >
        {isExpanded ? (
          <>
            <div className='flex justify-between items-center mb-3 bg-app-elevated/90 -mx-3 -mt-3 px-3 py-2 rounded-t-md'>
              <div className='flex items-center gap-2'>
                <motion.div
                  className={`${sizeClasses.icon} rounded-full flex items-center justify-center ${bgColor}`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {icon}
                </motion.div>
                <p
                  className={`${sizeClasses.text} font-medium ${isActive ? 'text-white' : textColor}`}
                >
                  {formatTime(jornada.horaEntradaProgramada)} -{' '}
                  {formatTime(jornada.horaSalidaProgramada)}
                </p>
              </div>
              <motion.div
                className={`${sizeClasses.badge} font-medium rounded-full ${isActive && isCompleted ? `${statusBgColor} ${statusTextColor} animate-pulse` : `${statusBgColor} ${statusTextColor}`}`}
                initial={{ opacity: 0.7 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {estadoTexto}
                {isActive && isCompleted && ' ✓'}
              </motion.div>
            </div>

            {isActive && isCompleted && (
              <motion.div
                className='mb-3 px-2 py-1 text-xs bg-app-brand/40 text-app-on-dark border border-app-brand-muted/45 rounded-md flex items-center gap-1'
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CheckCircle className='h-3 w-3' />
                <span>Turno recién completado</span>
              </motion.div>
            )}

            {hasDelay && jornada.estatusJornada === 'RETARDO' && (
              <motion.div
                className='mb-2 px-2 py-1 text-xs font-medium bg-yellow-600/30 text-yellow-300 rounded-md inline-flex items-center'
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <AlertTriangle className='h-3 w-3 mr-1' />
                Retardo: {jornada.minutosRetardoPreliminar} min
              </motion.div>
            )}

            {isInProgress && jornada.estatusJornada !== 'RETARDO' && (
              <motion.div
                className='mb-2 px-2 py-1 text-xs font-medium bg-app-brand-secondary/30 text-app-on-dark rounded-md inline-flex items-center'
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Timer className='h-3 w-3 mr-1' />
                <span>Turno en curso</span>
              </motion.div>
            )}

            <motion.div
              className='grid grid-cols-2 gap-3'
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div
                className={`rounded-lg p-3 border ${getTimeBoxColor(jornada.estatusJornada, 'entrada')}`}
              >
                <div className='flex items-center gap-2 mb-1'>
                  <LogIn className='h-4 w-4 text-app-brand-muted/80' />
                  <p className='text-base font-medium'>Entrada</p>
                </div>
                {jornada.horaEntradaReal ? (
                  <p
                    className={`text-2xl font-bold ${hasDelay ? 'text-yellow-400' : ''}`}
                  >
                    {formatTime(jornada.horaEntradaReal)}
                  </p>
                ) : (jornada.estatusJornada === 'AUSENTE_ENTRADA' ||
                    jornada.estatusJornada === 'AUSENTE') &&
                  shouldShowAsAbsent ? (
                  <div className='flex items-center gap-2'>
                    <p className='text-2xl font-bold text-app-on-dark/85'>
                      Sin entrada
                    </p>
                    <Ban className='h-5 w-5 text-app-brand-muted/70' />
                  </div>
                ) : (
                  <p className='text-2xl font-bold text-app-brand-muted/55'>
                    {formatTime(jornada.horaEntradaProgramada)}
                  </p>
                )}
              </div>
              <div
                className={`rounded-lg p-3 border ${getTimeBoxColor(jornada.estatusJornada, 'salida')}`}
              >
                <div className='flex items-center gap-2 mb-1'>
                  <LogOut className='h-4 w-4 text-app-brand-muted/80' />
                  <p className='text-base font-medium'>Salida</p>
                </div>
                {jornada.horaSalidaReal ? (
                  <p className='text-2xl font-bold'>
                    {formatTime(jornada.horaSalidaReal)}
                  </p>
                ) : jornada.estatusJornada === 'AUSENTE_SALIDA' &&
                  shouldShowAsAbsent ? (
                  <div className='flex items-center gap-2'>
                    <p className='text-2xl font-bold text-app-on-dark/85'>
                      Sin salida
                    </p>
                    <Ban className='h-5 w-5 text-app-brand-muted/70' />
                  </div>
                ) : (
                  <p className='text-2xl font-bold text-app-brand-muted/55'>
                    {formatTime(jornada.horaSalidaProgramada)}
                  </p>
                )}
              </div>
            </motion.div>
          </>
        ) : (
          <div className='flex justify-between items-center'>
            <div className='flex items-center gap-2'>
              <motion.div
                className={`${sizeClasses.icon} rounded-full flex items-center justify-center ${bgColor}`}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                {icon}
              </motion.div>
              <div className='flex-1'>
                <p className={`${sizeClasses.text} font-bold ${textColor}`}>
                  {formatTime(jornada.horaEntradaProgramada)} -{' '}
                  {formatTime(jornada.horaSalidaProgramada)}
                </p>
                <div
                  className={`flex items-center gap-1 ${sizeClasses.subText} mt-1`}
                >
                  {jornada.horaEntradaReal && (
                    <span className='text-app-brand-muted'>
                      E: {formatTime(jornada.horaEntradaReal)}
                    </span>
                  )}
                  {jornada.horaSalidaReal && (
                    <span className='text-app-on-dark/90'>
                      {jornada.horaEntradaReal && ' • '}S:{' '}
                      {formatTime(jornada.horaSalidaReal)}
                    </span>
                  )}
                  {jornada.estatusJornada === 'RETARDO' &&
                    jornada.minutosRetardoPreliminar && (
                      <span className='text-yellow-300'>
                        {(jornada.horaEntradaReal || jornada.horaSalidaReal) &&
                          ' • '}
                        +{jornada.minutosRetardoPreliminar}min
                      </span>
                    )}
                </div>
              </div>
            </div>
            <motion.div
              className={`${sizeClasses.badge} rounded-full ${statusBgColor} ${statusTextColor} font-medium`}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              {estadoTexto}
            </motion.div>
          </div>
        )}
      </motion.div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for TurnoItem memoization
    return (
      prevProps.jornada.detalleHorarioId ===
        nextProps.jornada.detalleHorarioId &&
      prevProps.jornada.estatusJornada === nextProps.jornada.estatusJornada &&
      prevProps.jornada.horaEntradaReal === nextProps.jornada.horaEntradaReal &&
      prevProps.jornada.horaSalidaReal === nextProps.jornada.horaSalidaReal &&
      prevProps.jornada.minutosRetardoPreliminar ===
        nextProps.jornada.minutosRetardoPreliminar &&
      prevProps.isActive === nextProps.isActive &&
      prevProps.isExpanded === nextProps.isExpanded &&
      prevProps.size === nextProps.size &&
      prevProps.onClick === nextProps.onClick &&
      // Only compare minute changes for currentTime
      prevProps.currentTime.getMinutes() === nextProps.currentTime.getMinutes()
    );
  }
);

function getItemSize(total: number, isCurrent: boolean): TurnoSize {
  if (isCurrent) return total <= 3 ? 'large' : total <= 6 ? 'medium' : 'small';
  if (total <= 3) return 'medium';
  if (total <= 6) return 'small';
  return 'xsmall';
}

function ShiftsPanelComponent({
  jornadas,
  activeSessionId,
  expandedTurnoId,
  onTurnoClick,
  currentTime,
  justCompletedSessionId = null,
  nextRecommendedAction,
  isLoading,
}: ShiftsPanelProps) {
  // Ordenar jornadas por hora de entrada programada para una visualización consistente
  const sortedJornadas = useMemo(
    () =>
      [...jornadas].sort((a, b) =>
        a.horaEntradaProgramada.localeCompare(b.horaEntradaProgramada)
      ),
    [jornadas]
  );

  if (isLoading) {
    return (
      <div className='w-full bg-app-dark rounded-lg p-4 border-2 border-app-brand/35'>
        <div className='h-4 w-40 bg-app-elevated rounded mb-4 animate-pulse' />
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            className='h-16 bg-app-elevated/70 rounded-md border border-app-brand/30 mb-2 animate-pulse'
          />
        ))}
      </div>
    );
  }

  return (
    <div className='w-full bg-app-dark rounded-lg p-4 border-2 border-app-brand/35'>
      <div className='flex items-center gap-2 mb-4'>
        <p className='text-lg font-semibold text-app-on-dark'>Turnos del día</p>
        {nextRecommendedAction === 'ALL_COMPLETE' && (
          <span className='text-xs text-app-on-dark bg-app-brand/45 border border-app-brand-muted/40 rounded-full px-2 py-0.5'>
            Completados
          </span>
        )}
      </div>

      {sortedJornadas.length === 0 ? (
        <div className='text-center py-2 text-sm text-app-brand-muted/70'>
          No hay turnos programados hoy
        </div>
      ) : (
        <div>
          {sortedJornadas.map((jornada) => {
            const isActive =
              (activeSessionId !== null &&
                jornada.detalleHorarioId === activeSessionId) ||
              (justCompletedSessionId !== null &&
                jornada.detalleHorarioId === justCompletedSessionId);
            const isExpanded = true; // Siempre expandido
            const size = getItemSize(sortedJornadas.length, isExpanded);
            return (
              <TurnoItem
                key={jornada.detalleHorarioId}
                jornada={jornada}
                isActive={isActive}
                isExpanded={isExpanded}
                size={size}
                currentTime={currentTime}
                onClick={() => {}} // Sin funcionalidad de click ya que siempre está expandido
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export const ShiftsPanel = React.memo(
  ShiftsPanelComponent,
  shiftsPanelPropsAreEqual
);
