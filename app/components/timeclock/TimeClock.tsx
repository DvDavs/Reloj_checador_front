'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { HeaderClock } from './HeaderClock';
import { ShiftsPanel } from './ShiftsPanel';
import { ScannerPanel } from './ScannerPanel';
import { HistoryPanel } from './HistoryPanel';
import { AttendanceDetails } from './AttendanceDetails';
import { useScanStateReducer } from './useScanStateReducer';
import type {
  HistoryPanelProps,
  ScannerPanelProps,
  AttendanceDetailsProps,
} from './interfaces';

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
    clearPanelFlash,
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
  // Estado temporal para mostrar datos del empleado inmediatamente
  const [tempEmployeeData, setTempEmployeeData] = useState<{
    id: number;
    name: string;
  } | null>(null);
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

      // Si tenemos datos de empleado, mostrar el panel de asistencia
      if (event.employeeData) {
        setEmployeeIdToFetch(event.employeeData.id);
        setShowAttendance(true);
        // Almacenar datos temporales del empleado para mostrar inmediatamente
        setTempEmployeeData({
          id: event.employeeData.id,
          name: event.employeeData.nombreCompleto,
        });
        console.log('🎯 FullAttendance event - setting temp employee data:', {
          id: event.employeeData.id,
          name: event.employeeData.nombreCompleto,
          showAttendance: true,
        });
      }

      if (event.justCompletedSessionIdBackend !== undefined) {
        setJustCompletedSessionId(event.justCompletedSessionIdBackend || null);
      }

      // NO llamar a setReady() aquí - mantener el estado actual
    },
    [updateFromFullAttendanceEvent]
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
        // Almacenar datos temporales del empleado para mostrar inmediatamente
        setTempEmployeeData({
          id: e.empleadoId,
          name: e.nombreCompleto,
        });
        console.log('🎯 Success event - setting temp employee data:', {
          id: e.empleadoId,
          name: e.nombreCompleto,
          showAttendance: true,
        });
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
        setTempEmployeeData(null); // Limpiar datos temporales en caso de error
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

  // Panel flash timing: igual que el componente original
  useEffect(() => {
    if (scanState === 'success' || scanState === 'failed') {
      // Limpiar solo el panel flash después de 2.8 segundos (mantener mensaje y estado)
      const flashTimer = setTimeout(() => {
        clearPanelFlash();
      }, 2800);

      // Limpiar todo el estado después de 5 segundos (igual que el original)
      const stateTimer = setTimeout(() => {
        setReady();
        setTempEmployeeData(null); // Limpiar datos temporales
        setShowAttendance(false); // Ocultar el panel de asistencia
        setEmployeeIdToFetch(null); // Limpiar el ID para que el hook también se resetee
      }, 5000);

      return () => {
        clearTimeout(flashTimer);
        clearTimeout(stateTimer);
      };
    }
  }, [scanState, clearPanelFlash, setReady]);

  // Toggle sonido (se usa en header e historial)
  const onToggleSound = useCallback(
    (value: boolean) => setSoundEnabled(value),
    []
  );

  // Memoize expensive calculations and props objects
  const headerProps = useMemo(
    () => ({
      currentTime,
      isConnected,
      selectedReader,
      isFullScreen,
      onToggleFullScreen: toggleFullScreen,
      onReload,
      soundEnabled,
      onToggleSound,
    }),
    [
      currentTime,
      isConnected,
      selectedReader,
      isFullScreen,
      toggleFullScreen,
      onReload,
      soundEnabled,
      onToggleSound,
    ]
  );

  // Memoize current employee calculation
  const currentEmployee = useMemo(() => {
    return currentEmployeeData
      ? {
          id: currentEmployeeData.id,
          name: currentEmployeeData.nombreCompleto,
        }
      : tempEmployeeData;
  }, [currentEmployeeData, tempEmployeeData]);

  // Debug log
  if (showAttendance) {
    console.log('🔍 ScannerPanel props:', {
      scanState,
      showAttendance,
      currentEmployee,
      tempEmployeeData,
      currentEmployeeData: currentEmployeeData?.nombreCompleto,
    });
  }

  // Memoize scanner props to prevent unnecessary re-renders
  const scannerProps: ScannerPanelProps = useMemo(
    () => ({
      scanState,
      statusCode: statusCode || undefined,
      customMessage: customMessage || undefined,
      panelFlash: panelFlash || undefined,
      showInstructionMessage: true,
      pinInputMode,
      pinInputLoading,
      initialPinDigit,
      preparingNextScan: false, // TODO: Implement preparingNextScan state
      onStartPinInput,
      onSubmitPin,
      onCancelPin,
    }),
    [
      scanState,
      statusCode,
      customMessage,
      panelFlash,
      pinInputMode,
      pinInputLoading,
      initialPinDigit,
      onStartPinInput,
      onSubmitPin,
      onCancelPin,
    ]
  );

  // Memoize attendance details props
  const attendanceDetailsProps: AttendanceDetailsProps = useMemo(
    () => ({
      employee: currentEmployeeData,
      show: showAttendance,
      nextRecommendedAction,
      dailyWorkSessions: jornadasDelDia,
    }),
    [currentEmployeeData, showAttendance, nextRecommendedAction, jornadasDelDia]
  );

  // Memoize history props
  const historyProps: HistoryPanelProps = useMemo(
    () => ({
      items: scanHistory,
      soundEnabled,
      onToggleSound,
      inactiveTimeSeconds,
    }),
    [scanHistory, soundEnabled, onToggleSound, inactiveTimeSeconds]
  );

  // Memoize turno click handler
  const onTurnoClick = useCallback(
    (turnoId: number | null) => setExpandedTurnoId(turnoId),
    []
  );

  // Memoize shifts props
  const shiftsProps = useMemo(
    () => ({
      jornadas: jornadasDelDia,
      activeSessionId,
      expandedTurnoId,
      onTurnoClick,
      currentTime: currentTime || new Date(),
      justCompletedSessionId,
      nextRecommendedAction,
      isLoading,
    }),
    [
      jornadasDelDia,
      activeSessionId,
      expandedTurnoId,
      onTurnoClick,
      currentTime,
      justCompletedSessionId,
      nextRecommendedAction,
      isLoading,
    ]
  );

  return (
    <div className='min-h-screen w-full bg-black text-white p-4'>
      <div className='max-w-7xl mx-auto space-y-4'>
        <HeaderClock {...headerProps} />

        {/* Estructura de tres columnas: Izquierda (Turnos), Centro (Scanner + Detalles), Derecha (Historial) */}
        <div className='flex flex-col md:flex-row gap-4'>
          {/* Izquierda: Turnos */}
          <div className='w-full md:w-80 flex flex-col'>
            <ShiftsPanel {...shiftsProps} />
            <ShiftsPanel {...shiftsProps} />
          </div>

          {/* Centro: Scanner + Detalles */}
          <div className='flex-1 flex flex-col gap-4'>
            <ScannerPanel {...scannerProps} />
            <AttendanceDetails {...attendanceDetailsProps} />
          </div>

          {/* Derecha: Historial */}
          <div className='w-full md:w-80 flex flex-col'>
            <HistoryPanel {...historyProps} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimeClock;
