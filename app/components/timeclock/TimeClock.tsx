'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { HeaderClock } from './HeaderClock';
import { ShiftsPanel } from './ShiftsPanel';
import { ScannerPanel } from './ScannerPanel';
import { HistoryPanel } from './HistoryPanel';
import { AttendanceDetails } from './AttendanceDetails';
import { useScanStateReducer } from './useScanStateReducer';
import type { HistoryPanelProps, ScannerPanelProps } from './interfaces';

import useStompTimeClock from '@/app/hooks/useStompTimeClock';
import useEmployeeAttendanceData from '@/app/hooks/useEmployeeAttendanceData';

import type {
  BackendChecadorEvent,
  FullAttendanceStateEvent,
  ScanHistoryItem,
} from '@/app/lib/types/timeClockTypes';
import { getUserFriendlyMessage } from '@/app/lib/timeClockUtils';
import { submitPinPadCheckin } from '@/lib/api/pinpad-api';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export type TimeClockProps = {
  selectedReader: string;
  sessionId: string;
  instanceId: string;
};

export function TimeClock({
  selectedReader,
  sessionId,
  instanceId,
}: TimeClockProps) {
  // Reloj
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  useEffect(() => {
    setCurrentTime(new Date());
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Reducer de estado de escaneo
  const {
    state: { scanState, customMessage, panelFlash, statusCode, statusData },
    setScanning,
    setSuccess,
    setFailed,
    setReady,
    setIdle,
    reset,
  } = useScanStateReducer();

  // UI local
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [inactiveTimeSeconds, setInactiveTimeSeconds] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [expandedTurnoId, setExpandedTurnoId] = useState<number | null>(null);
  const [justCompletedSessionId, setJustCompletedSessionId] = useState<
    number | null
  >(null);

  // Historial
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const pushHistory = useCallback((item: ScanHistoryItem) => {
    setScanHistory((prev) => [item, ...prev].slice(0, 20));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setInactiveTimeSeconds((s) =>
        scanState === 'scanning' ? 0 : Math.min(s + 1, 600)
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [scanState]);

  // Manejo de pantalla completa
  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }, []);
  const onReload = useCallback(() => window.location.reload(), []);
  useEffect(() => {
    const onFs = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // Datos del empleado y jornadas
  const [employeeIdToFetch, setEmployeeIdToFetch] = useState<number | null>(
    null
  );
  const {
    currentEmployeeData,
    jornadasDelDia,
    activeSessionId,
    nextRecommendedAction,
    isLoading,
    updateFromFullAttendanceEvent,
  } = useEmployeeAttendanceData({
    employeeIdToFetch,
    apiBaseUrl: API_BASE_URL,
  });

  // Handlers: eventos del backend
  const handleFullAttendanceEvent = useCallback(
    (event: FullAttendanceStateEvent) => {
      updateFromFullAttendanceEvent(event);
      setShowAttendance(true);
      setReady();
      if (event.justCompletedSessionIdBackend !== undefined) {
        setJustCompletedSessionId(event.justCompletedSessionIdBackend || null);
      }
    },
    [setReady, updateFromFullAttendanceEvent]
  );

  const handleChecadorEvent = useCallback(
    (event: BackendChecadorEvent | FullAttendanceStateEvent) => {
      if (
        (event as FullAttendanceStateEvent).type ===
        'FULL_ATTENDANCE_STATE_UPDATE'
      ) {
        return handleFullAttendanceEvent(event as FullAttendanceStateEvent);
      }

      const e = event as BackendChecadorEvent;
      const friendly = getUserFriendlyMessage(
        e.statusCode,
        e.data,
        e.nombreCompleto
      );

      if (e.identificado && e.empleadoId && e.nombreCompleto && e.accion) {
        setSuccess({
          message: friendly,
          statusCode: e.statusCode || null,
          statusData: e.data || null,
        });
        setShowAttendance(true);
        setEmployeeIdToFetch(e.empleadoId);
        pushHistory({
          name: e.nombreCompleto,
          time: new Date(),
          success: true,
          action: e.accion,
          employeeId: String(e.empleadoId),
          statusCode: e.statusCode,
        });
      } else {
        setFailed({
          message: e.errorMessage || friendly,
          statusCode: e.statusCode || null,
          statusData: e.data || null,
        });
        pushHistory({
          name: e.nombreCompleto || 'Desconocido',
          time: new Date(),
          success: false,
          action: e.accion || 'entrada',
          employeeId: e.empleadoId ? String(e.empleadoId) : '0',
          statusCode: e.statusCode,
        });
      }
    },
    [pushHistory, setFailed, setSuccess, handleFullAttendanceEvent]
  );

  const handleConnectionError = useCallback(
    (error: string | null) => {
      if (error) {
        setFailed({ message: error });
      } else {
        setReady();
      }
    },
    [setFailed, setReady]
  );

  const handleReadyStateChange = useCallback(
    (isReady: boolean) => {
      if (isReady) setReady();
      else setIdle();
    },
    [setIdle, setReady]
  );

  // Conexión STOMP
  const { isConnected } = useStompTimeClock({
    initialReaderName: selectedReader,
    initialSessionId: sessionId,
    instanceId,
    onChecadorEvent: handleChecadorEvent,
    onConnectionError: handleConnectionError,
    onReadyStateChange: handleReadyStateChange,
    apiBaseUrl: API_BASE_URL,
  });

  // PIN input handlers
  const [pinInputMode, setPinInputMode] = useState(false);
  const [pinInputLoading, setPinInputLoading] = useState(false);
  const [initialPinDigit, setInitialPinDigit] = useState('');

  const onStartPinInput = useCallback<ScannerPanelProps['onStartPinInput']>(
    (digit) => {
      setInitialPinDigit(digit || '');
      setPinInputMode(true);
    },
    []
  );

  const onCancelPin = useCallback(() => {
    setPinInputMode(false);
    setInitialPinDigit('');
  }, []);

  const onSubmitPin = useCallback<ScannerPanelProps['onSubmitPin']>(
    async (pin: string) => {
      setPinInputLoading(true);
      setScanning();
      try {
        const deviceKey = selectedReader;
        const resp = await submitPinPadCheckin(pin, deviceKey);
        const message = getUserFriendlyMessage(resp.code, resp.data);
        if (resp.type === 'OK') {
          setSuccess({ message, statusCode: resp.code, statusData: resp.data });
        } else {
          setFailed({ message, statusCode: resp.code, statusData: resp.data });
        }
      } catch (err: any) {
        const code = err?.body?.code || String(err?.status || '500');
        const message = getUserFriendlyMessage(code, err?.body?.data);
        setFailed({ message, statusCode: code, statusData: err?.body?.data });
      } finally {
        setPinInputLoading(false);
        setPinInputMode(false);
        setInitialPinDigit('');
      }
    },
    [setFailed, setScanning, setSuccess, selectedReader]
  );

  // Teclado numérico: activar PIN al presionar un dígito
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key) && !pinInputMode && !pinInputLoading) {
        setInitialPinDigit(e.key);
        setPinInputMode(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pinInputLoading, pinInputMode]);

  // Render
  const headerProps = useMemo(
    () => ({
      currentTime,
      isConnected,
      selectedReader,
      isFullScreen,
      onToggleFullScreen: toggleFullScreen,
      onReload,
    }),
    [
      currentTime,
      isConnected,
      selectedReader,
      isFullScreen,
      toggleFullScreen,
      onReload,
    ]
  );

  const scannerProps: ScannerPanelProps = {
    scanState,
    statusCode: statusCode || undefined,
    customMessage: customMessage || undefined,
    panelFlash: panelFlash || undefined,
    showInstructionMessage: true,
    pinInputMode,
    pinInputLoading,
    initialPinDigit,
    onStartPinInput,
    onSubmitPin,
    onCancelPin,
  };

  const onToggleSound = useCallback(
    (value: boolean) => setSoundEnabled(value),
    []
  );

  const historyProps: HistoryPanelProps = {
    items: scanHistory,
    soundEnabled,
    onToggleSound,
    inactiveTimeSeconds,
  };
  const onTurnoClick = useCallback(
    (turnoId: number | null) => setExpandedTurnoId(turnoId),
    []
  );

  return (
    <div className='min-h-screen w-full bg-black text-white p-4'>
      <div className='max-w-7xl mx-auto space-y-4'>
        <HeaderClock {...headerProps} />

        {/* Estructura de tres columnas: Izquierda (Turnos), Centro (Scanner + Detalles), Derecha (Historial) */}
        <div className='flex flex-col md:flex-row gap-4'>
          {/* Izquierda: Turnos */}
          <div className='w-full md:w-80'>
            <ShiftsPanel
              jornadas={jornadasDelDia}
              activeSessionId={activeSessionId}
              expandedTurnoId={expandedTurnoId}
              onTurnoClick={onTurnoClick}
              currentTime={currentTime || new Date()}
              justCompletedSessionId={justCompletedSessionId}
              nextRecommendedAction={nextRecommendedAction}
              isLoading={isLoading}
            />
          </div>

          {/* Centro: Scanner + Detalles */}
          <div className='flex-1 flex flex-col gap-4'>
            <ScannerPanel {...scannerProps} />
            <AttendanceDetails
              employee={currentEmployeeData}
              show={showAttendance}
              nextRecommendedAction={nextRecommendedAction}
              dailyWorkSessions={jornadasDelDia}
            />
          </div>

          {/* Derecha: Historial */}
          <div className='w-full md:w-80'>
            <HistoryPanel {...historyProps} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimeClock;
