'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, LogIn, LogOut } from 'lucide-react';
import { EmployeeAvatar } from '@/app/components/shared/EmployeeAvatar';
import type { AttendanceDetailsProps } from './interfaces';
import { formatTime } from '../../lib/timeClockUtils';
import { attendanceDetailsPropsAreEqual } from './utils/memoComparisons';

type Session = AttendanceDetailsProps['dailyWorkSessions'][number];

function getTimeBoxBorder(estatus: string, tipo: 'entrada' | 'salida'): string {
  // CORRECCIÓN: Para entradas con retardo, usar verde; solo salidas con retardo usan azul
  if (estatus?.includes('RETARDO')) {
    return tipo === 'entrada'
      ? 'border-green-600/50 bg-green-900/20 shadow-inner shadow-green-900/10'
      : 'border-blue-600/30 bg-blue-900/10 shadow-inner shadow-blue-900/10';
  }
  if (estatus === 'COMPLETADA')
    return 'border-green-600/50 bg-green-900/20 shadow-inner shadow-green-900/10';
  if (estatus === 'EN_CURSO')
    return tipo === 'entrada'
      ? 'border-green-600/50 bg-green-900/20 shadow-inner shadow-green-900/10'
      : 'border-blue-600/30 bg-blue-900/10 shadow-inner shadow-blue-900/10';
  if (estatus?.includes('AUSENTE'))
    return 'border-gray-500/60 bg-gray-800/30 shadow-inner shadow-gray-700/20';
  return 'border-blue-600/30 bg-blue-900/10 shadow-inner shadow-blue-900/10';
}

// Memoized PrimarySessionBoxes component
const PrimarySessionBoxes = React.memo(
  function PrimarySessionBoxes({
    dailyWorkSessions,
    activeSessionId,
  }: {
    dailyWorkSessions: Session[];
    activeSessionId: number | null;
  }) {
    const session = useMemo(() => {
      if (!dailyWorkSessions || dailyWorkSessions.length === 0) return null;
      if (activeSessionId != null) {
        return (
          dailyWorkSessions.find(
            (s) => s.detalleHorarioId === activeSessionId
          ) || null
        );
      }
      return dailyWorkSessions[0] || null;
    }, [dailyWorkSessions, activeSessionId]);

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
      // Placeholder UI
      return (
        <div className='grid grid-cols-2 gap-4'>
          {/* Placeholder Entrada */}
          <div className='rounded-lg p-4 border-2 bg-zinc-800 border-gray-700/50'>
            <div className='flex items-center gap-2 mb-2'>
              <LogIn className='h-6 w-6 text-gray-500' />
              <p className='text-lg font-medium'>Entrada</p>
            </div>
            <div className='flex flex-col'>
              <p className='text-3xl font-bold text-gray-600'>00:00</p>
              <span className='text-xs text-gray-600 font-medium mt-1'>
                Sin datos
              </span>
            </div>
          </div>
          {/* Placeholder Salida */}
          <div className='rounded-lg p-4 border-2 bg-zinc-800 border-gray-700/50'>
            <div className='flex items-center gap-2 mb-2'>
              <LogOut className='h-6 w-6 text-gray-500' />
              <p className='text-lg font-medium'>Salida</p>
            </div>
            <div className='flex flex-col'>
              <p className='text-3xl font-bold text-gray-600'>00:00</p>
              <span className='text-xs text-gray-600 font-medium mt-1'>
                Sin datos
              </span>
            </div>
          </div>
        </div>
      );
    }

    // --- CORRECCIÓN CLAVE ---
    // La condición ahora busca la subcadena "RETARDO" para ser más robusta.
    const hasRetardo = session.estatusJornada?.includes('RETARDO');

    // Ocultar recuadros de Entrada/Salida para horarios de Jefe
    const isJefe = session.esHorarioJefe === true;
    // Hora actual en formato HH:mm para mostrar "Guardado HH:mm"
    const now = new Date();
    const nowHHmm = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    if (isJefe) {
      return (
        <motion.div
          className='rounded-lg p-4 border-2 border-blue-600/30 bg-blue-900/10 shadow-inner shadow-blue-900/10'
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <p className='text-lg font-medium text-blue-200'>
            Horario Flexible - Guardado {nowHHmm}
          </p>
          {(formattedTimes.entradaReal || formattedTimes.salidaReal) && (
            <div className='mt-2 text-2xl font-bold text-gray-200'>
              {formattedTimes.entradaReal
                ? `Entrada: ${formattedTimes.entradaReal}`
                : ''}
              {formattedTimes.entradaReal && formattedTimes.salidaReal
                ? ' • '
                : ''}
              {formattedTimes.salidaReal
                ? `Salida: ${formattedTimes.salidaReal}`
                : ''}
            </div>
          )}
        </motion.div>
      );
    }

    return (
      <motion.div
        className='grid grid-cols-2 gap-4'
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {/* Caja de Entrada */}
        <div
          className={`rounded-lg p-4 border-2 transition-all duration-300 ${getTimeBoxBorder(session.estatusJornada, 'entrada')}`}
        >
          <div className='flex items-center gap-2 mb-2'>
            <LogIn
              className={`h-6 w-6 ${
                session.horaEntradaReal !== null &&
                session.horaEntradaReal !== undefined
                  ? 'text-green-400'
                  : 'text-gray-500'
              }`}
            />
            <p className='text-lg font-medium'>Entrada</p>
          </div>
          <div className='flex flex-col'>
            <div className='flex items-baseline gap-2'>
              <p
                className={`text-3xl font-bold ${
                  session.horaEntradaReal !== null &&
                  session.horaEntradaReal !== undefined
                    ? 'text-green-300'
                    : 'text-gray-400'
                }`}
              >
                {session.horaEntradaReal !== null &&
                session.horaEntradaReal !== undefined
                  ? formattedTimes.entradaReal
                  : formattedTimes.entradaProgramada}
              </p>
              {session.horaEntradaReal !== null &&
                session.horaEntradaReal !== undefined &&
                hasRetardo && (
                  <span className='px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-300'>
                    retardo
                  </span>
                )}
            </div>
            {(session.horaEntradaReal === null ||
              session.horaEntradaReal === undefined) &&
              (session.estatusJornada === 'AUSENTE_ENTRADA' ? (
                <span className='text-xs text-orange-400 font-semibold mt-1'>
                  SIN ENTRADA REGISTRADA
                </span>
              ) : (
                <span className='text-xs text-gray-500 font-medium mt-1'>
                  Programada • Sin registro
                </span>
              ))}
          </div>
        </div>

        {/* Caja de Salida */}
        <div
          className={`rounded-lg p-4 border-2 transition-all duration-300 ${getTimeBoxBorder(session.estatusJornada, 'salida')}`}
        >
          <div className='flex items-center gap-2 mb-2'>
            <LogOut
              className={`h-6 w-6 ${
                session.horaSalidaReal !== null &&
                session.horaSalidaReal !== undefined
                  ? 'text-green-400'
                  : 'text-gray-500'
              }`}
            />
            <p className='text-lg font-medium'>Salida</p>
          </div>
          <div className='flex flex-col'>
            <p
              className={`text-3xl font-bold ${
                session.horaSalidaReal !== null &&
                session.horaSalidaReal !== undefined
                  ? 'text-green-300'
                  : 'text-gray-400'
              }`}
            >
              {formattedTimes.salidaReal || formattedTimes.salidaProgramada}
            </p>
            {(session.horaSalidaReal === null ||
              session.horaSalidaReal === undefined) &&
              (session.estatusJornada === 'AUSENTE_SALIDA' ? (
                <span className='text-xs text-orange-400 font-semibold mt-1'>
                  SIN SALIDA REGISTRADA
                </span>
              ) : (
                <span className='text-xs text-gray-500 font-medium mt-1'>
                  Programada • Sin registro
                </span>
              ))}
          </div>
        </div>
      </motion.div>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.activeSessionId !== nextProps.activeSessionId) return false;
    if (
      prevProps.dailyWorkSessions.length !== nextProps.dailyWorkSessions.length
    )
      return false;
    return prevProps.dailyWorkSessions.every((session, index) => {
      const nextSession = nextProps.dailyWorkSessions[index];
      return (
        session.detalleHorarioId === nextSession.detalleHorarioId &&
        session.estatusJornada === nextSession.estatusJornada &&
        session.horaEntradaReal === nextSession.horaEntradaReal &&
        session.horaSalidaReal === nextSession.horaSalidaReal
      );
    });
  }
);

function AttendanceDetailsComponent({
  employee,
  show,
  dailyWorkSessions,
  activeSessionId,
}: AttendanceDetailsProps) {
  const hasEmployeeData = show && employee;

  return (
    <div className='w-full h-full bg-zinc-900 rounded-lg p-4 border-2 border-orange-800/40 flex flex-col'>
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
            <User className='h-10 w-10 text-zinc-600' />
          </div>
        )}
        <div className='flex-1'>
          <h2 className='text-3xl font-bold text-white'>
            {hasEmployeeData ? employee.nombreCompleto : 'Usuario'}
          </h2>
        </div>
      </div>

      <div className='flex-1 flex items-center justify-center'>
        <div className='w-full'>
          <PrimarySessionBoxes
            dailyWorkSessions={hasEmployeeData ? dailyWorkSessions : []}
            activeSessionId={hasEmployeeData ? activeSessionId : null}
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
