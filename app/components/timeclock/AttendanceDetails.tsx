'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, LogIn, LogOut, AlertTriangle } from 'lucide-react';
import { EmployeeAvatar } from '@/app/components/shared/EmployeeAvatar';
import type { AttendanceDetailsProps } from './interfaces';
import { formatTime } from '../../lib/timeClockUtils';
import { attendanceDetailsPropsAreEqual } from './utils/memoComparisons';

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

function getRelevantSession(
  sessions: Session[],
  activeSessionId: number | null
): Session | null {
  if (!sessions || sessions.length === 0) return null;

  // Regla 1 (Prioridad Máxima): Si hay una sesión activa, esa es la que mostramos.
  if (activeSessionId) {
    const activeSession = sessions.find(
      (s) => s.detalleHorarioId === activeSessionId
    );
    if (activeSession) {
      return activeSession;
    }
  }

  // Regla 2 (Fallback si no hay activa): Mostrar la primera jornada que aún no esté completada.
  const nextIncompleteSession = sessions.find(
    (s) => s.estatusJornada !== 'COMPLETADA'
  );
  if (nextIncompleteSession) {
    return nextIncompleteSession;
  }

  // Regla 3 (Fallback final): Si todas están completadas, mostrar la última de la lista.
  return sessions[sessions.length - 1];
}

// Memoized PrimarySessionBoxes component
const PrimarySessionBoxes = React.memo(
  function PrimarySessionBoxes({
    sessions,
    activeSessionId,
  }: {
    sessions: Session[];
    activeSessionId: number | null;
  }) {
    const session = useMemo(
      () => getRelevantSession(sessions, activeSessionId),
      [sessions, activeSessionId]
    );

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
        <div className='grid grid-cols-2 gap-4'>
          <div className='rounded-lg p-4 border-2 bg-zinc-800 border-zinc-700'>
            <div className='flex items-center gap-2 mb-2'>
              <LogIn className='h-6 w-6 text-zinc-400' />
              <p className='text-lg font-medium'>Entrada</p>
            </div>
            <p className='text-3xl font-bold text-zinc-600'>00:00</p>
          </div>
          <div className='rounded-lg p-4 border-2 bg-zinc-800 border-zinc-700'>
            <div className='flex items-center gap-2 mb-2'>
              <LogOut className='h-6 w-6 text-zinc-400' />
              <p className='text-lg font-medium'>Salida</p>
            </div>
            <p className='text-3xl font-bold text-zinc-600'>00:00</p>
          </div>
        </div>
      );
    }

    const hasRetardo =
      session.estatusJornada === 'RETARDO' ||
      session.estatusJornada === 'RETARDO_SIN_SALIDA';

    return (
      <motion.div
        className='grid grid-cols-2 gap-4'
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div
          className={`rounded-lg p-4 border-2 transition-all duration-300 ${getTimeBoxBorder(session.estatusJornada, 'entrada')}`}
        >
          <div className='flex items-center gap-2 mb-2'>
            <LogIn
              className={`h-6 w-6 ${
                session.horaEntradaReal
                  ? hasRetardo
                    ? 'text-yellow-400'
                    : 'text-green-400'
                  : 'text-blue-400'
              }`}
            />
            <p className='text-lg font-medium'>Entrada</p>
          </div>
          <p
            className={`text-3xl font-bold ${
              session.horaEntradaReal
                ? hasRetardo
                  ? 'text-yellow-300'
                  : 'text-green-300'
                : 'text-blue-300'
            }`}
          >
            {formattedTimes.entradaReal || formattedTimes.entradaProgramada}
          </p>
          {hasRetardo && session.horaEntradaReal && (
            <div className='mt-1 text-xs text-yellow-400 flex items-center gap-1'>
              <AlertTriangle className='h-3 w-3' /> Entrada con retardo
            </div>
          )}
        </div>

        <div
          className={`rounded-lg p-4 border-2 transition-all duration-300 ${getTimeBoxBorder(session.estatusJornada, 'salida')}`}
        >
          <div className='flex items-center gap-2 mb-2'>
            <LogOut
              className={`h-6 w-6 ${
                session.horaSalidaReal ? 'text-green-400' : 'text-blue-400'
              }`}
            />
            <p className='text-lg font-medium'>Salida</p>
          </div>
          <p
            className={`text-3xl font-bold ${
              session.horaSalidaReal ? 'text-green-300' : 'text-blue-300'
            }`}
          >
            {formattedTimes.salidaReal || formattedTimes.salidaProgramada}
          </p>
        </div>
      </motion.div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for PrimarySessionBoxes
    if (prevProps.activeSessionId !== nextProps.activeSessionId) {
      return false;
    }
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
  dailyWorkSessions,
  activeSessionId,
}: AttendanceDetailsProps) {
  // Siempre mostrar el panel, pero con placeholders cuando no hay datos
  const hasEmployeeData = show && employee;

  return (
    <div className='w-full h-full bg-zinc-900 rounded-lg p-4 border-2 border-zinc-800 flex flex-col'>
      {/* Información del usuario - con placeholders - Más compacto */}
      <div className='mb-3 flex items-center gap-4'>
        {hasEmployeeData ? (
          <EmployeeAvatar
            empleadoId={employee.id}
            nombre={employee.nombreCompleto}
            fotoUrl={employee.fotoUrl}
            tieneFoto={employee.tieneFoto}
            size={80}
          />
        ) : (
          <div className='flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800 border-2 border-zinc-700'>
            <User className='h-10 w-10 text-zinc-400' />
          </div>
        )}
        <div className='flex-1'>
          <h2 className='text-3xl font-bold text-white'>
            {hasEmployeeData ? employee.nombreCompleto : 'Usuario'}
          </h2>
        </div>
      </div>

      {/* Recuadros de Entrada/Salida - siempre visibles */}
      <div className='flex-1 flex items-center justify-center'>
        <div className='w-full'>
          <PrimarySessionBoxes
            sessions={hasEmployeeData ? dailyWorkSessions : []}
            activeSessionId={activeSessionId}
          />
        </div>
      </div>
    </div>
  );
}

export const AttendanceDetails = React.memo(
  AttendanceDetailsComponent,
  attendanceDetailsPropsAreEqual
);
