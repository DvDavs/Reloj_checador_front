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
      icon: <CheckCircle className='h-5 w-5 text-green-400' />,
      textColor: 'text-green-300',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-600/50',
      gradientBg:
        'linear-gradient(to right, rgba(34,197,94,0.15), rgba(34,197,94,0.05))',
      statusBgColor: 'bg-green-600/30',
      statusTextColor: 'text-green-300',
    };
  }

  if (isInProgress) {
    return {
      icon: <Timer className='h-5 w-5 text-blue-400' />,
      textColor: 'text-blue-300',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-600/50',
      gradientBg:
        'linear-gradient(to right, rgba(59,130,246,0.15), rgba(59,130,246,0.05))',
      statusBgColor: 'bg-blue-600/30',
      statusTextColor: 'text-blue-300',
    };
  }

  if (isAbsent && shouldShowAsAbsent) {
    return {
      icon: <Ban className='h-5 w-5 text-orange-400' />,
      textColor: 'text-orange-300',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-600/50',
      gradientBg:
        'linear-gradient(to right, rgba(251,146,60,0.15), rgba(251,146,60,0.05))',
      statusBgColor: 'bg-orange-600/30',
      statusTextColor: 'text-orange-300',
    };
  }

  return {
    icon: <Timer className='h-5 w-5 text-zinc-300' />,
    textColor: 'text-zinc-300',
    bgColor: 'bg-zinc-600/20',
    borderColor: 'border-zinc-700',
    gradientBg: '',
    statusBgColor: 'bg-zinc-700',
    statusTextColor: 'text-zinc-300',
  };
}

function getTimeBoxColor(estatus: string, tipo: 'entrada' | 'salida'): string {
  if (estatus === 'COMPLETADA') return 'border-green-600/50';
  if (estatus === 'EN_CURSO')
    return tipo === 'entrada' ? 'border-blue-600/50' : 'border-blue-600/30';
  if (estatus === 'RETARDO' || estatus === 'RETARDO_SIN_SALIDA')
    return 'border-yellow-600/50';
  if (estatus.includes('AUSENTE')) return 'border-orange-600/50';
  return 'border-zinc-700';
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
        } ${isActive ? 'border-blue-600 shadow-blue-500/40 shadow-lg active' : borderColor}`}
        style={{
          opacity: isCompleted ? 0.9 : isPending ? 0.95 : 1,
          background: isActive
            ? 'linear-gradient(to right, rgba(59,130,246,0.2), rgba(59,130,246,0.05))'
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
            <div className='flex justify-between items-center mb-3 bg-zinc-800/70 -mx-3 -mt-3 px-3 py-2 rounded-t-md'>
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
                className='mb-3 px-2 py-1 text-xs bg-green-600/40 text-green-300 border border-green-600/50 rounded-md flex items-center gap-1'
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
                className='mb-2 px-2 py-1 text-xs font-medium bg-blue-600/30 text-blue-300 rounded-md inline-flex items-center'
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
                  <LogIn className='h-4 w-4 text-zinc-400' />
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
                    <p className='text-2xl font-bold text-orange-400'>
                      Sin entrada
                    </p>
                    <Ban className='h-5 w-5 text-orange-400' />
                  </div>
                ) : (
                  <p className='text-2xl font-bold text-zinc-500'>
                    {formatTime(jornada.horaEntradaProgramada)}
                  </p>
                )}
              </div>
              <div
                className={`rounded-lg p-3 border ${getTimeBoxColor(jornada.estatusJornada, 'salida')}`}
              >
                <div className='flex items-center gap-2 mb-1'>
                  <LogOut className='h-4 w-4 text-zinc-400' />
                  <p className='text-base font-medium'>Salida</p>
                </div>
                {jornada.horaSalidaReal ? (
                  <p className='text-2xl font-bold'>
                    {formatTime(jornada.horaSalidaReal)}
                  </p>
                ) : jornada.estatusJornada === 'AUSENTE_SALIDA' &&
                  shouldShowAsAbsent ? (
                  <div className='flex items-center gap-2'>
                    <p className='text-2xl font-bold text-orange-400'>
                      Sin salida
                    </p>
                    <Ban className='h-5 w-5 text-orange-400' />
                  </div>
                ) : (
                  <p className='text-2xl font-bold text-zinc-500'>
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
                    <span className='text-green-300'>
                      E: {formatTime(jornada.horaEntradaReal)}
                    </span>
                  )}
                  {jornada.horaSalidaReal && (
                    <span className='text-blue-300'>
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
      <div className='w-full bg-zinc-900 rounded-lg p-4 border-2 border-zinc-800'>
        <div className='h-4 w-40 bg-zinc-800 rounded mb-4 animate-pulse' />
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            className='h-16 bg-zinc-800/60 rounded-md border border-zinc-800 mb-2 animate-pulse'
          />
        ))}
      </div>
    );
  }

  return (
    <div className='w-full bg-zinc-900 rounded-lg p-4 border-2 border-zinc-800'>
      <div className='flex items-center gap-2 mb-4'>
        <p className='text-lg font-semibold text-white'>Turnos del día</p>
        {nextRecommendedAction === 'ALL_COMPLETE' && (
          <span className='text-xs text-green-300 bg-green-900/40 border border-green-700 rounded-full px-2 py-0.5'>
            Completados
          </span>
        )}
      </div>

      {sortedJornadas.length === 0 ? (
        <div className='text-center py-2 text-sm text-zinc-500'>
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
