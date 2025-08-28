// Custom memo comparison functions for TimeClock components
// These functions help React.memo determine when components should re-render

import type {
  HeaderClockProps,
  ShiftsPanelProps,
  ScannerPanelProps,
  AttendanceDetailsProps,
  HistoryPanelProps,
} from '../interfaces';

/**
 * Custom comparison for HeaderClock component
 * Only re-render if time changes by more than 1 second or other props change
 */
export function headerClockPropsAreEqual(
  prevProps: HeaderClockProps,
  nextProps: HeaderClockProps
): boolean {
  // Check if time difference is less than 1 second (avoid unnecessary re-renders for sub-second changes)
  const timeDiff =
    prevProps.currentTime && nextProps.currentTime
      ? Math.abs(
          nextProps.currentTime.getTime() - prevProps.currentTime.getTime()
        )
      : prevProps.currentTime === nextProps.currentTime
        ? 0
        : 1000;

  if (timeDiff >= 1000) return false;

  // Check other props for changes
  return (
    prevProps.isConnected === nextProps.isConnected &&
    prevProps.selectedReader === nextProps.selectedReader &&
    prevProps.isFullScreen === nextProps.isFullScreen &&
    prevProps.soundEnabled === nextProps.soundEnabled &&
    prevProps.onToggleFullScreen === nextProps.onToggleFullScreen &&
    prevProps.onReload === nextProps.onReload &&
    prevProps.onToggleSound === nextProps.onToggleSound
  );
}

/**
 * Custom comparison for ShiftsPanel component
 * Deep compare jornadas array and other props
 */
export function shiftsPanelPropsAreEqual(
  prevProps: ShiftsPanelProps,
  nextProps: ShiftsPanelProps
): boolean {
  // Quick reference checks first
  if (
    prevProps.activeSessionId !== nextProps.activeSessionId ||
    prevProps.expandedTurnoId !== nextProps.expandedTurnoId ||
    prevProps.justCompletedSessionId !== nextProps.justCompletedSessionId ||
    prevProps.nextRecommendedAction !== nextProps.nextRecommendedAction ||
    prevProps.isLoading !== nextProps.isLoading ||
    prevProps.onTurnoClick !== nextProps.onTurnoClick
  ) {
    return false;
  }

  // Time comparison (only re-render if minute changes)
  const prevMinute = prevProps.currentTime.getMinutes();
  const nextMinute = nextProps.currentTime.getMinutes();
  if (prevMinute !== nextMinute) return false;

  // Deep compare jornadas array
  if (prevProps.jornadas.length !== nextProps.jornadas.length) return false;

  for (let i = 0; i < prevProps.jornadas.length; i++) {
    const prev = prevProps.jornadas[i];
    const next = nextProps.jornadas[i];

    if (
      prev.detalleHorarioId !== next.detalleHorarioId ||
      prev.estatusJornada !== next.estatusJornada ||
      prev.horaEntradaProgramada !== next.horaEntradaProgramada ||
      prev.horaSalidaProgramada !== next.horaSalidaProgramada ||
      prev.horaEntradaReal !== next.horaEntradaReal ||
      prev.horaSalidaReal !== next.horaSalidaReal ||
      prev.minutosRetardoPreliminar !== next.minutosRetardoPreliminar
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Custom comparison for ScannerPanel component
 * Focus on scan state and visual changes
 */
export function scannerPanelPropsAreEqual(
  prevProps: ScannerPanelProps,
  nextProps: ScannerPanelProps
): boolean {
  // Critical state changes that always trigger re-render
  if (
    prevProps.scanState !== nextProps.scanState ||
    prevProps.statusCode !== nextProps.statusCode ||
    prevProps.customMessage !== nextProps.customMessage ||
    prevProps.panelFlash !== nextProps.panelFlash ||
    prevProps.pinInputMode !== nextProps.pinInputMode ||
    prevProps.pinInputLoading !== nextProps.pinInputLoading ||
    prevProps.initialPinDigit !== nextProps.initialPinDigit ||
    prevProps.preparingNextScan !== nextProps.preparingNextScan
  ) {
    return false;
  }

  // Function references should be stable due to useCallback
  return (
    prevProps.onStartPinInput === nextProps.onStartPinInput &&
    prevProps.onSubmitPin === nextProps.onSubmitPin &&
    prevProps.onCancelPin === nextProps.onCancelPin
  );
}

/**
 * Custom comparison for AttendanceDetails component
 */
export function attendanceDetailsPropsAreEqual(
  prevProps: AttendanceDetailsProps,
  nextProps: AttendanceDetailsProps
): boolean {
  if (
    prevProps.show !== nextProps.show ||
    prevProps.nextRecommendedAction !== nextProps.nextRecommendedAction
  ) {
    return false;
  }

  // Re-render si cambia la sesión activa
  if (prevProps.activeSessionId !== nextProps.activeSessionId) {
    return false;
  }

  // Compare employee objects
  const prevEmployee = prevProps.employee;
  const nextEmployee = nextProps.employee;

  if (prevEmployee !== nextEmployee) {
    if (!prevEmployee || !nextEmployee) return false;
    if (
      prevEmployee.id !== nextEmployee.id ||
      prevEmployee.nombreCompleto !== nextEmployee.nombreCompleto ||
      prevEmployee.rfc !== nextEmployee.rfc ||
      prevEmployee.tarjeta !== nextEmployee.tarjeta ||
      prevEmployee.departamentoNombre !== nextEmployee.departamentoNombre ||
      prevEmployee.academiaNombre !== nextEmployee.academiaNombre
    ) {
      return false;
    }
  }

  // Compare dailyWorkSessions array
  if (
    prevProps.dailyWorkSessions.length !== nextProps.dailyWorkSessions.length
  ) {
    return false;
  }

  for (let i = 0; i < prevProps.dailyWorkSessions.length; i++) {
    const prev = prevProps.dailyWorkSessions[i];
    const next = nextProps.dailyWorkSessions[i];

    if (
      prev.detalleHorarioId !== next.detalleHorarioId ||
      prev.estatusJornada !== next.estatusJornada ||
      prev.horaEntradaReal !== next.horaEntradaReal ||
      prev.horaSalidaReal !== next.horaSalidaReal
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Custom comparison for HistoryPanel component
 */
export function historyPanelPropsAreEqual(
  prevProps: HistoryPanelProps,
  nextProps: HistoryPanelProps
): boolean {
  if (
    prevProps.soundEnabled !== nextProps.soundEnabled ||
    prevProps.onToggleSound !== nextProps.onToggleSound
  ) {
    return false;
  }

  // Only re-render if inactiveTimeSeconds changes significantly (every 10 seconds)
  const prevInactive = Math.floor((prevProps.inactiveTimeSeconds || 0) / 10);
  const nextInactive = Math.floor((nextProps.inactiveTimeSeconds || 0) / 10);
  if (prevInactive !== nextInactive) return false;

  // Compare items array (shallow comparison for performance)
  if (prevProps.items.length !== nextProps.items.length) return false;

  // Only compare first few items since they're most visible
  const compareCount = Math.min(6, prevProps.items.length);
  for (let i = 0; i < compareCount; i++) {
    const prev = prevProps.items[i];
    const next = nextProps.items[i];

    if (
      prev.employeeId !== next.employeeId ||
      prev.time.getTime() !== next.time.getTime() ||
      prev.success !== next.success ||
      prev.action !== next.action ||
      prev.statusCode !== next.statusCode
    ) {
      return false;
    }
  }

  return true;
}
