'use client';

import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  IdCard,
  Building2,
  School,
  LogIn,
  LogOut,
  CheckCircle,
  Info,
} from 'lucide-react';
import type {
  AttendanceDetailsProps,
  NextRecommendedAction,
} from './interfaces';
import { formatTime } from '../../lib/timeClockUtils';
import { attendanceDetailsPropsAreEqual } from './utils/memoComparisons';

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

// Memoized RecommendationBadge component
const RecommendationBadge = React.memo(function RecommendationBadge({
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
});

type Session = AttendanceDetailsProps['dailyWorkSessions'][number];

function getTimeBoxBorder(estatus: string, tipo: 'entrada' | 'salida'): string {
  if (estatus === 'COMPLETADA')
    return 'border-green-600/50 bg-green-900/20 shadow-inner shadow-green-900/10';
  if (estatus === 'EN_CURSO')
    return tipo === 'entrada'
      ? 'border-green-600/50 bg-green-900/20 shadow-inner shadow-green-900/10'
      : 'border-blue-600/30 bg-blue-900/10 shadow-inner shadow-blue-900/10';
  if (estatus === 'RETARDO' || estatus === 'RETARDO_SIN_SALIDA')
    return tipo === 'entrada'
      ? 'border-yellow-600/50 bg-yellow-900/20 shadow-inner shadow-yellow-900/10'
      : 'border-blue-600/30 bg-blue-900/10 shadow-inner shadow-blue-900/10';
  if (estatus.includes('AUSENTE'))
    return 'border-orange-600/40 bg-orange-900/15 shadow-inner shadow-orange-900/10';
  return 'border-blue-600/30 bg-blue-900/10 shadow-inner shadow-blue-900/10';
}

function getPrimarySession(sessions: Session[]): Session | null {
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

// Memoized PrimarySessionBoxes component
const PrimarySessionBoxes = React.memo(
  function PrimarySessionBoxes({ sessions }: { sessions: Session[] }) {
    const session = useMemo(() => getPrimarySession(sessions), [sessions]);

    // Memoize formatted times
    const formattedTimes = useMemo(() => {
      if (!session) return null;
      return {
        entradaReal: session.horaEntradaReal
          ? formatTime(session.horaEntradaReal)
          : null,
        entradaProgramada: formatTime(session.horaEntradaProgramada),
        salidaReal: session.horaSalidaReal
          ? formatTime(session.horaSalidaReal)
          : null,
        salidaProgramada: formatTime(session.horaSalidaProgramada),
      };
    }, [session]);

    if (!session || !formattedTimes) {
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
          className={`rounded-lg p-4 border ${getTimeBoxBorder(session.estatusJornada, 'entrada')}`}
        >
          <div className='flex items-center gap-2 mb-1'>
            <LogIn className='h-4 w-4 text-zinc-400' />
            <p className='text-base font-medium'>Entrada</p>
          </div>
          {formattedTimes.entradaReal ? (
            <p className='text-3xl font-bold'>{formattedTimes.entradaReal}</p>
          ) : (
            <p className='text-3xl font-bold text-zinc-400'>
              {formattedTimes.entradaProgramada}
            </p>
          )}
        </div>
        <div
          className={`rounded-lg p-4 border ${getTimeBoxBorder(session.estatusJornada, 'salida')}`}
        >
          <div className='flex items-center gap-2 mb-1'>
            <LogOut className='h-4 w-4 text-zinc-400' />
            <p className='text-base font-medium'>Salida</p>
          </div>
          {formattedTimes.salidaReal ? (
            <p className='text-3xl font-bold'>{formattedTimes.salidaReal}</p>
          ) : (
            <p className='text-3xl font-bold text-zinc-400'>
              {formattedTimes.salidaProgramada}
            </p>
          )}
        </div>
      </motion.div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for PrimarySessionBoxes
    return (
      prevProps.sessions.length === nextProps.sessions.length &&
      prevProps.sessions.every((session, index) => {
        const nextSession = nextProps.sessions[index];
        return (
          session.detalleHorarioId === nextSession.detalleHorarioId &&
          session.estatusJornada === nextSession.estatusJornada &&
          session.horaEntradaReal === nextSession.horaEntradaReal &&
          session.horaSalidaReal === nextSession.horaSalidaReal
        );
      })
    );
  }
);

function AttendanceDetailsComponent({
  employee,
  show,
  nextRecommendedAction,
  dailyWorkSessions,
}: AttendanceDetailsProps) {
  if (!show || !employee) return null;
  return (
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
                  <IdCard className='h-3.5 w-3.5' /> Tarjeta: {employee.tarjeta}
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
                  <School className='h-3.5 w-3.5' /> {employee.academiaNombre}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <RecommendationBadge action={nextRecommendedAction} />
      </div>
      <PrimarySessionBoxes sessions={dailyWorkSessions} />
    </div>
  );
}

export const AttendanceDetails = React.memo(
  AttendanceDetailsComponent,
  attendanceDetailsPropsAreEqual
);
