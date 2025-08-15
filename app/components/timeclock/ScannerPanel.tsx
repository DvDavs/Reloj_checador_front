'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Fingerprint,
  User,
  IdCard,
  Building2,
  School,
  LogIn,
  LogOut,
  CheckCircle,
  Info,
} from 'lucide-react';
import type { ScannerPanelProps, NextRecommendedAction } from './interfaces';
import PinInput from '../PinInput';
import { formatTime } from '../../lib/timeClockUtils';

function getStatusBorderClasses(statusCode?: string | null): string {
  if (!statusCode) return 'border-zinc-800';
  if (statusCode.startsWith('2')) return 'border-emerald-500';
  if (statusCode.startsWith('3')) return 'border-sky-500';
  if (statusCode.startsWith('4')) return 'border-red-500';
  return 'border-zinc-800';
}

function getInstructionText(
  scanState: ScannerPanelProps['scanState'],
  pinMode: boolean,
  customMessage?: string | null
): string {
  if (pinMode) return 'Ingrese su número de tarjeta';
  if (customMessage) return customMessage;
  switch (scanState) {
    case 'ready':
      return 'Coloque su dedo en el lector';
    case 'scanning':
      return 'Escaneando...';
    case 'success':
      return 'Autenticación exitosa';
    case 'failed':
      return 'Huella no identificada';
    case 'idle':
    default:
      return 'Inicializando lector...';
  }
}

function ScannerPanelComponent({
  scanState,
  statusCode,
  customMessage,
  panelFlash,
  showInstructionMessage = true,
  pinInputMode,
  pinInputLoading,
  initialPinDigit,
  onStartPinInput,
  onSubmitPin,
  onCancelPin,
  employee,
  showAttendance,
  nextRecommendedAction,
  dailyWorkSessions,
}: ScannerPanelProps) {
  const borderClasses = useMemo(() => {
    if (panelFlash === 'success') return 'border-emerald-500';
    if (panelFlash === 'failed') return 'border-red-500';
    return getStatusBorderClasses(statusCode);
  }, [panelFlash, statusCode]);

  const ringColor = useMemo(() => {
    if (panelFlash === 'success') return 'bg-emerald-500/20';
    if (panelFlash === 'failed') return 'bg-red-500/20';
    if (scanState === 'scanning') return 'bg-cyan-500/25';
    if (scanState === 'ready') return 'bg-cyan-500/15';
    if (scanState === 'failed') return 'bg-red-500/15';
    if (scanState === 'success') return 'bg-emerald-500/15';
    return 'bg-zinc-700/20';
  }, [panelFlash, scanState]);

  const instruction = useMemo(
    () => getInstructionText(scanState, pinInputMode, customMessage),
    [scanState, pinInputMode, customMessage]
  );

  return (
    <div
      className={`flex flex-col items-center justify-center bg-zinc-900 rounded-lg p-6 border-2 ${borderClasses}`}
    >
      {/* Scanner area or PIN input */}
      <div className='relative mb-6 flex h-64 w-64 items-center justify-center'>
        {pinInputMode ? (
          <PinInput
            isVisible={true}
            onSubmit={onSubmitPin}
            onCancel={onCancelPin}
            isLoading={!!pinInputLoading}
            initialValue={initialPinDigit || ''}
          />
        ) : (
          <>
            <motion.div
              className={`absolute h-56 w-56 rounded-full ${ringColor}`}
              animate={{
                scale: scanState === 'scanning' ? [1, 1.08, 1] : [1, 1.03, 1],
                opacity: [0.35, 0.55, 0.35],
              }}
              transition={{
                duration: scanState === 'scanning' ? 1.2 : 2.2,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className='relative z-10 flex items-center justify-center rounded-full border border-zinc-700/50 bg-zinc-800/50 h-40 w-40'
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
            >
              <Fingerprint
                className={
                  'h-16 w-16 ' +
                  (scanState === 'failed'
                    ? 'text-red-400'
                    : scanState === 'success'
                      ? 'text-emerald-400'
                      : 'text-cyan-400')
                }
              />
            </motion.div>
            <motion.div
              className='absolute h-72 w-72 rounded-full border border-cyan-500/15'
              animate={{ scale: [1, 1.06, 1], opacity: [0.18, 0.33, 0.18] }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              }}
            />
          </>
        )}
      </div>

      {/* Instruction / status message */}
      {showInstructionMessage && (
        <div className='h-12 flex items-center justify-center'>
          <div
            className={
              'text-center text-xl font-medium flex items-center gap-2 ' +
              (panelFlash === 'success'
                ? 'text-emerald-300'
                : panelFlash === 'failed'
                  ? 'text-red-300'
                  : statusCode?.startsWith('2')
                    ? 'text-emerald-300'
                    : statusCode?.startsWith('3')
                      ? 'text-sky-300'
                      : statusCode?.startsWith('4')
                        ? 'text-red-300'
                        : scanState === 'ready' || scanState === 'scanning'
                          ? 'text-zinc-300'
                          : 'text-zinc-400')
            }
          >
            {instruction}
          </div>
        </div>
      )}

      {/* Optional: start PIN entry helper button when not in PIN mode */}
      {!pinInputMode && (
        <button
          type='button'
          onClick={() => onStartPinInput()}
          className='mt-2 text-xs text-zinc-400 hover:text-zinc-200 underline'
          aria-label='Usar PIN'
        >
          Usar PIN
        </button>
      )}

      {/* Attendance details under the scanner */}
      {showAttendance && employee && (
        <div className='w-full mt-6'>
          <div className='flex items-start justify-between gap-4 mb-4'>
            <div className='flex items-center gap-3'>
              <div className='p-2 rounded-full bg-zinc-800 border border-zinc-700'>
                <User className='h-5 w-5 text-zinc-300' />
              </div>
              <div>
                <p className='text-lg font-semibold text-white'>
                  {employee.nombreCompleto}
                </p>
                <div className='flex flex-wrap items-center gap-3 mt-1 text-xs text-zinc-400'>
                  <span className='inline-flex items-center gap-1'>
                    <IdCard className='h-3.5 w-3.5' /> RFC: {employee.rfc}
                  </span>
                  {employee.tarjeta ? (
                    <span className='inline-flex items-center gap-1'>
                      <IdCard className='h-3.5 w-3.5' /> Tarjeta:{' '}
                      {employee.tarjeta}
                    </span>
                  ) : null}
                  {employee.departamentoNombre ? (
                    <span className='inline-flex items-center gap-1'>
                      <Building2 className='h-3.5 w-3.5' />{' '}
                      {employee.departamentoNombre}
                    </span>
                  ) : null}
                  {employee.academiaNombre ? (
                    <span className='inline-flex items-center gap-1'>
                      <School className='h-3.5 w-3.5' />{' '}
                      {employee.academiaNombre}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <RecommendationBadge action={nextRecommendedAction} />
          </div>

          <PrimarySessionBoxes sessions={dailyWorkSessions} />
        </div>
      )}
    </div>
  );
}

// Helpers for attendance
function getRecommendationStyles(action: NextRecommendedAction | undefined): {
  label: string;
  icon: React.ReactNode;
  badgeClasses: string;
} {
  switch (action) {
    case 'entrada':
      return {
        label: 'Entrada recomendada',
        icon: <LogIn className='h-4 w-4' />,
        badgeClasses:
          'bg-green-900/40 border border-green-600/60 text-green-300',
      };
    case 'salida':
      return {
        label: 'Salida recomendada',
        icon: <LogOut className='h-4 w-4' />,
        badgeClasses: 'bg-blue-900/40 border border-blue-600/60 text-blue-300',
      };
    case 'ALL_COMPLETE':
      return {
        label: 'Jornadas completas',
        icon: <CheckCircle className='h-4 w-4' />,
        badgeClasses:
          'bg-emerald-900/40 border border-emerald-600/60 text-emerald-300',
      };
    case 'NO_ACTION':
    default:
      return {
        label: 'Sin acción recomendada',
        icon: <Info className='h-4 w-4' />,
        badgeClasses: 'bg-zinc-800 border border-zinc-700 text-zinc-300',
      };
  }
}

function RecommendationBadge({
  action,
}: {
  action: NextRecommendedAction | undefined;
}) {
  const { label, icon, badgeClasses } = useMemo(
    () => getRecommendationStyles(action),
    [action]
  );
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${badgeClasses}`}
    >
      {icon}
      <span className='text-sm font-medium'>{label}</span>
    </div>
  );
}

type Session = NonNullable<ScannerPanelProps['dailyWorkSessions']>[number];

function getTimeBoxBorder(estatus: string, tipo: 'entrada' | 'salida'): string {
  if (estatus === 'COMPLETADA') return 'border-green-600/50';
  if (estatus === 'EN_CURSO')
    return tipo === 'entrada' ? 'border-blue-600/50' : 'border-blue-600/30';
  if (estatus === 'RETARDO' || estatus === 'RETARDO_SIN_SALIDA')
    return 'border-yellow-600/50';
  if (estatus.includes('AUSENTE')) return 'border-orange-600/50';
  return 'border-zinc-700';
}

function getPrimarySession(sessions?: Session[]): Session | null {
  if (!sessions || sessions.length === 0) return null;
  const byPriority = [...sessions].sort((a, b) => {
    const order = (s: string) =>
      s === 'EN_CURSO' || s === 'RETARDO' || s === 'RETARDO_SIN_SALIDA'
        ? 0
        : s === 'PENDIENTE' || s.includes('AUSENTE')
          ? 1
          : s === 'COMPLETADA'
            ? 2
            : 3;
    return order(a.estatusJornada) - order(b.estatusJornada);
  });
  return byPriority[0];
}

function PrimarySessionBoxes({ sessions }: { sessions?: Session[] }) {
  const session = useMemo(() => getPrimarySession(sessions), [sessions]);
  if (!session) {
    return (
      <div className='text-sm text-zinc-500'>
        No hay turnos asignados para hoy
      </div>
    );
  }

  return (
    <motion.div
      className='grid grid-cols-2 gap-3'
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div
        className={`rounded-lg p-3 border ${getTimeBoxBorder(session.estatusJornada, 'entrada')}`}
      >
        <div className='flex items-center gap-2 mb-1'>
          <LogIn className='h-4 w-4 text-zinc-400' />
          <p className='text-base font-medium'>Entrada</p>
        </div>
        {session.horaEntradaReal ? (
          <p className='text-2xl font-bold'>
            {formatTime(session.horaEntradaReal)}
          </p>
        ) : (
          <p className='text-2xl font-bold text-zinc-500'>
            {formatTime(session.horaEntradaProgramada)}
          </p>
        )}
      </div>
      <div
        className={`rounded-lg p-3 border ${getTimeBoxBorder(session.estatusJornada, 'salida')}`}
      >
        <div className='flex items-center gap-2 mb-1'>
          <LogOut className='h-4 w-4 text-zinc-400' />
          <p className='text-base font-medium'>Salida</p>
        </div>
        {session.horaSalidaReal ? (
          <p className='text-2xl font-bold'>
            {formatTime(session.horaSalidaReal)}
          </p>
        ) : (
          <p className='text-2xl font-bold text-zinc-500'>
            {formatTime(session.horaSalidaProgramada)}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export const ScannerPanel = React.memo(ScannerPanelComponent);
