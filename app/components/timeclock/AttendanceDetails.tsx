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
  const ok =
    'border-app-brand-muted/50 bg-app-brand/15 shadow-inner shadow-app-dark/40';
  const salida =
    'border-app-brand-secondary/35 bg-app-brand-secondary/10 shadow-inner shadow-app-dark/30';
  if (estatus?.includes('RETARDO')) {
    return tipo === 'entrada' ? ok : salida;
  }
  if (estatus === 'COMPLETADA') return ok;
  if (estatus === 'EN_CURSO') return tipo === 'entrada' ? ok : salida;
  if (estatus?.includes('AUSENTE'))
    return 'border-app-brand-muted/35 bg-app-dark/40 shadow-inner shadow-black/20';
  return salida;
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
      // Placeholder UI - Responsive
      return (
        <div className='grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4'>
          {/* Placeholder Entrada */}
          <div className='rounded-lg p-2 sm:p-3 lg:p-4 border-2 bg-app-elevated border-app-brand/40'>
            <div className='flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2'>
              <LogIn className='h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-app-brand-muted/70' />
              <p className='text-sm sm:text-base lg:text-lg font-medium'>
                Entrada
              </p>
            </div>
            <div className='flex flex-col'>
              <p className='text-xl sm:text-2xl lg:text-3xl font-bold text-app-brand-muted/50'>
                00:00
              </p>
              <span className='text-[10px] sm:text-xs text-app-brand-muted/50 font-medium mt-0.5 sm:mt-1'>
                Sin datos
              </span>
            </div>
          </div>
          {/* Placeholder Salida */}
          <div className='rounded-lg p-2 sm:p-3 lg:p-4 border-2 bg-app-elevated border-app-brand/40'>
            <div className='flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2'>
              <LogOut className='h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-app-brand-muted/70' />
              <p className='text-sm sm:text-base lg:text-lg font-medium'>
                Salida
              </p>
            </div>
            <div className='flex flex-col'>
              <p className='text-xl sm:text-2xl lg:text-3xl font-bold text-app-brand-muted/50'>
                00:00
              </p>
              <span className='text-[10px] sm:text-xs text-app-brand-muted/50 font-medium mt-0.5 sm:mt-1'>
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
          className='rounded-lg p-2 sm:p-3 lg:p-4 border-2 border-app-brand-secondary/35 bg-app-brand-secondary/10 shadow-inner shadow-app-dark/30'
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <p className='text-sm sm:text-base lg:text-lg font-medium text-app-brand-muted'>
            Horario Flexible - Guardado {nowHHmm}
          </p>
          {(formattedTimes.entradaReal || formattedTimes.salidaReal) && (
            <div className='mt-1 sm:mt-2 text-lg sm:text-xl lg:text-2xl font-bold text-app-on-dark'>
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
        className='grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4'
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {/* Caja de Entrada - Responsive */}
        <div
          className={`rounded-lg p-2 sm:p-3 lg:p-4 border-2 transition-all duration-300 ${getTimeBoxBorder(session.estatusJornada, 'entrada')}`}
        >
          <div className='flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2'>
            <LogIn
              className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ${
                session.horaEntradaReal !== null &&
                session.horaEntradaReal !== undefined
                  ? 'text-app-brand-muted'
                  : 'text-app-brand-muted/50'
              }`}
            />
            <p className='text-sm sm:text-base lg:text-lg font-medium'>
              Entrada
            </p>
          </div>
          <div className='flex flex-col'>
            <div className='flex items-baseline gap-1.5 sm:gap-2'>
              <p
                className={`text-xl sm:text-2xl lg:text-3xl font-bold ${
                  session.horaEntradaReal !== null &&
                  session.horaEntradaReal !== undefined
                    ? 'text-app-on-dark'
                    : 'text-app-brand-muted/60'
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
                  <span className='px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-300'>
                    retardo
                  </span>
                )}
            </div>
            {(session.horaEntradaReal === null ||
              session.horaEntradaReal === undefined) &&
              (session.estatusJornada === 'AUSENTE_ENTRADA' ? (
                <span className='text-[10px] sm:text-xs text-app-brand-muted font-semibold mt-0.5 sm:mt-1'>
                  SIN ENTRADA REGISTRADA
                </span>
              ) : (
                <span className='text-[10px] sm:text-xs text-app-brand-muted/60 font-medium mt-0.5 sm:mt-1'>
                  Programada • Sin registro
                </span>
              ))}
          </div>
        </div>

        {/* Caja de Salida - Responsive */}
        <div
          className={`rounded-lg p-2 sm:p-3 lg:p-4 border-2 transition-all duration-300 ${getTimeBoxBorder(session.estatusJornada, 'salida')}`}
        >
          <div className='flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2'>
            <LogOut
              className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ${
                session.horaSalidaReal !== null &&
                session.horaSalidaReal !== undefined
                  ? 'text-app-brand-muted'
                  : 'text-app-brand-muted/50'
              }`}
            />
            <p className='text-sm sm:text-base lg:text-lg font-medium'>
              Salida
            </p>
          </div>
          <div className='flex flex-col'>
            <p
              className={`text-xl sm:text-2xl lg:text-3xl font-bold ${
                session.horaSalidaReal !== null &&
                session.horaSalidaReal !== undefined
                  ? 'text-app-on-dark'
                  : 'text-app-brand-muted/60'
              }`}
            >
              {formattedTimes.salidaReal || formattedTimes.salidaProgramada}
            </p>
            {(session.horaSalidaReal === null ||
              session.horaSalidaReal === undefined) &&
              (session.estatusJornada === 'AUSENTE_SALIDA' ? (
                <span className='text-[10px] sm:text-xs text-app-brand-muted font-semibold mt-0.5 sm:mt-1'>
                  SIN SALIDA REGISTRADA
                </span>
              ) : (
                <span className='text-[10px] sm:text-xs text-app-brand-muted/60 font-medium mt-0.5 sm:mt-1'>
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
    <div className='w-full h-full bg-app-dark rounded-lg p-2 sm:p-3 lg:p-4 border-2 border-app-brand-muted/40 flex flex-col'>
      <div className='mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3 lg:gap-4'>
        {hasEmployeeData ? (
          <EmployeeAvatar
            empleadoId={employee.id}
            nombre={employee.nombreCompleto}
            fotoUrl={employee.fotoUrl}
            tieneFoto={employee.tieneFoto}
            size={56}
            className='sm:!w-16 sm:!h-16 lg:!w-20 lg:!h-20'
          />
        ) : (
          <div className='flex h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 items-center justify-center rounded-full bg-app-elevated border-2 border-app-brand/45'>
            <User className='h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-app-brand-muted/60' />
          </div>
        )}
        <div className='flex-1 min-w-0'>
          <h2 className='text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white truncate'>
            {hasEmployeeData ? employee.nombreCompleto : 'Usuario'}
          </h2>
        </div>
      </div>

      <div className='flex-1 flex items-center justify-center min-h-0'>
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
