'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { HeaderClock } from './HeaderClock';
import { ShiftsPanel } from './ShiftsPanel';
import { ScannerPanel } from './ScannerPanel';
// import { HistoryPanel } from './HistoryPanel';
import AdvertisingPanel from './AdvertisingPanel';
import { AttendanceDetails } from './AttendanceDetails';
import { useScanStateReducer } from './useScanStateReducer';
import { useAudioFeedback } from './hooks/useAudioFeedback';
import type { ScannerPanelProps, AttendanceDetailsProps } from './interfaces';

import useStompTimeClock from '@/app/hooks/useStompTimeClock';
import useEmployeeAttendanceData from '@/app/hooks/useEmployeeAttendanceData';

import type {
  BackendChecadorEvent,
  FullAttendanceStateEvent,
  ScanHistoryItem,
} from '@/app/lib/types/timeClockTypes';
import { getUserFriendlyMessage } from '@/app/lib/timeClockUtils';
import { submitPinPadCheckin } from '@/lib/api/pinpad-api';
import { apiClient } from '@/lib/apiClient';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export type TimeClockProps = {
  selectedReader: string;
  sessionId: string;
  instanceId: string;
};

const TimeClock = React.memo<TimeClockProps>(function TimeClock({
  selectedReader,
  sessionId,
  instanceId,
}) {
  // Reloj
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  useEffect(() => {
    setCurrentTime(new Date());
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Reducer de estado de escaneo
  const {
    state: { scanState, customMessage, panelFlash, statusCode },
    setScanning,
    setSuccess,
    setFailed,
    setReady,
    setIdle,
    clearPanelFlash,
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

      // Si tenemos datos de empleado, mostrar el panel de asistencia
      if (event.employeeData) {
        setEmployeeIdToFetch(event.employeeData.id);
        setShowAttendance(true);
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

      // Determinar éxito por código de estado (evita problemas por mayúsculas/minúsculas del mensaje)
      // - 2xx => éxito (incluye 200, 201, 202, 203)
      // - 301/302 => ya registrada (lo consideramos éxito visualmente)
      // - FR => mostrar como fallo aunque pueda haberse guardado
      const code = e.statusCode || '';
      const isSuccessfulRegistration =
        code !== 'FR' &&
        (code.startsWith('2') || code === '301' || code === '302');

      if (
        e.identificado &&
        e.empleadoId &&
        e.nombreCompleto &&
        e.accion &&
        isSuccessfulRegistration
      ) {
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
        // Si hay empleado identificado pero no es registro exitoso, mostrar panel
        if (e.identificado && e.empleadoId && e.nombreCompleto) {
          setShowAttendance(true);
          setEmployeeIdToFetch(e.empleadoId);
        }
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
        const code = resp.code || '';
        const message = getUserFriendlyMessage(code, resp.data);
        const isSuccessfulRegistration =
          code !== 'FR' &&
          (code.startsWith('2') || code === '301' || code === '302');

        if (isSuccessfulRegistration) {
          setSuccess({ message, statusCode: code, statusData: resp.data });

          // 1) Usar inmediatamente el empleadoId devuelto por el backend (RegistroDto)
          const employeeIdFromResponse =
            (resp as any)?.data?.empleadoId ?? (resp as any)?.empleadoId;
          if (employeeIdFromResponse) {
            setEmployeeIdToFetch(employeeIdFromResponse);
            setShowAttendance(true);
          } else {
            // 2) Fallback: resolver por número de tarjeta (PIN)
            try {
              const empResp = await apiClient.get(
                `/api/empleados/tarjeta/${encodeURIComponent(pin)}`
              );
              const employeeId = empResp.data?.id ?? empResp.data?.data?.id;
              if (employeeId) {
                setEmployeeIdToFetch(employeeId);
                setShowAttendance(true);
              }
            } catch (_) {
              // Si falla la resolución por tarjeta, confiar en un posible evento STOMP subsecuente
            }
          }
        } else {
          setFailed({ message, statusCode: code, statusData: resp.data });
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
        setShowAttendance(false); // Ocultar el panel de asistencia
        setEmployeeIdToFetch(null); // Limpiar el ID para que el hook también se resetee
      }, 5000);

      return () => {
        clearTimeout(flashTimer);
        clearTimeout(stateTimer);
      };
    }
  }, [scanState, clearPanelFlash, setReady]);

  // Audio feedback hook
  useAudioFeedback({ soundEnabled, scanState });

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

  // Memoize current employee calculation - rely directly on hook data
  const currentEmployee = useMemo(() => {
    return currentEmployeeData;
  }, [currentEmployeeData]);

  // Debug log
  if (showAttendance) {
    console.log('🔍 ScannerPanel props:', {
      scanState,
      showAttendance,
      currentEmployee,
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

  // HistoryPanel oculto: mantenemos el estado pero no renderizamos

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
    <div className='h-screen w-full bg-black text-white p-3 xl:p-4 overflow-hidden'>
      <div className='max-w-7xl mx-auto h-full transform origin-top xl:scale-95'>
        {/* Rectángulo contenedor sin overflow */}
        <div className='h-full rounded-xl border-2 border-zinc-800 bg-zinc-950/60 p-3 xl:p-4 overflow-hidden'>
          <div className='grid grid-rows-[auto,1fr] gap-3 xl:gap-4 h-full min-h-0'>
            <HeaderClock {...headerProps} />

            {/* Layout de dos columnas como en la imagen (contenido ocupa todo el alto restante) */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 xl:gap-6 h-full min-h-0 overflow-hidden'>
              {/* Columna izquierda: Scanner + Detalles del usuario (2/3 del ancho) */}
              <div className='lg:col-span-2 grid grid-rows-[3fr,2fr] gap-3 h-full min-h-0 overflow-hidden'>
                {/* Scanner de huellas (3 partes) */}
                <div className='min-h-0 overflow-hidden'>
                  <ScannerPanel {...scannerProps} />
                </div>

                {/* Detalles del usuario (1 parte) */}
                <div className='min-h-0 overflow-hidden'>
                  <AttendanceDetails {...attendanceDetailsProps} />
                </div>
              </div>

              {/* Columna derecha: Publicidad (1/3 del ancho) */}
              <div className='lg:col-span-1 h-full min-h-0 overflow-hidden'>
                <AdvertisingPanel />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

TimeClock.displayName = 'TimeClock';

export default TimeClock;
