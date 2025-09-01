// Tipos e interfaces para los componentes presentacionales del reloj checador
// y para el reducer de estado de escaneo

import type {
  ScanState,
  ScanHistoryItem,
  EmpleadoDto,
  JornadaEstadoDto,
  FullAttendanceStateEvent,
  BackendChecadorEvent,
} from '../../lib/types/timeClockTypes';

// Reducer: estado manejado por el contenedor para el flujo de escaneo
export type ScanStateType = ScanState;

export type PanelFlash = 'success' | 'failed' | null;

export interface ScanReducerState {
  scanState: ScanStateType;
  scanResult: 'success' | 'failed' | null;
  customMessage: string | null;
  panelFlash: PanelFlash;
  statusCode: string | null;
  statusData: Record<string, any> | null;
}

export type ScanAction =
  | { type: 'SET_SCANNING' }
  | {
      type: 'SET_SUCCESS';
      message?: string | null;
      statusCode?: string | null;
      statusData?: Record<string, any> | null;
    }
  | {
      type: 'SET_FAILED';
      message?: string | null;
      statusCode?: string | null;
      statusData?: Record<string, any> | null;
    }
  | { type: 'SET_READY' }
  | { type: 'SET_IDLE' }
  | { type: 'CLEAR_PANEL_FLASH' }
  | { type: 'RESET' };

// Props: HeaderClock (hora/fecha, estado de conexión, controles)
export interface HeaderClockProps {
  currentTime: Date | null;
  isConnected: boolean;
  selectedReader: string | null;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  onReload: () => void;
  soundEnabled?: boolean;
  onToggleSound?: (value: boolean) => void;
}

// Props: ShiftsPanel (jornadas del día y estados relacionados)
export type NextRecommendedAction =
  | 'entrada'
  | 'salida'
  | 'ALL_COMPLETE'
  | 'NO_ACTION'
  | null;

export interface ShiftsPanelProps {
  jornadas: JornadaEstadoDto[];
  activeSessionId: number | null;
  expandedTurnoId: number | null;
  onTurnoClick: (turnoId: number | null) => void;
  currentTime: Date;
  justCompletedSessionId?: number | null;
  nextRecommendedAction: NextRecommendedAction;
  isLoading: boolean;
}

// Props: ScannerPanel (animación, estado del escáner, mensajes, PIN)
export interface ScannerPanelProps {
  scanState: ScanStateType;
  statusCode?: string | null;
  statusType?: string | null;
  customMessage?: string | null;
  panelFlash?: PanelFlash;
  showInstructionMessage?: boolean;
  preparingNextScan?: boolean;

  // PIN input
  pinInputMode: boolean;
  pinInputLoading?: boolean;
  initialPinDigit?: string;
  onStartPinInput: (initialDigit?: string) => void;
  onSubmitPin: (pin: string) => void | Promise<void>;
  onCancelPin: () => void;
}

// Props: AttendanceDetails (datos del empleado, acción recomendada)
export interface AttendanceDetailsProps {
  employee: EmpleadoDto | null;
  show: boolean;
  nextRecommendedAction: NextRecommendedAction;
  dailyWorkSessions: JornadaEstadoDto[];
  activeSessionId: number | null;
}

// Props: HistoryPanel (historial de escaneos y control de sonido)
export interface HistoryPanelProps {
  items: ScanHistoryItem[];
  soundEnabled?: boolean;
  onToggleSound?: (value: boolean) => void;
  inactiveTimeSeconds?: number;
}

// (Opcional) Tipos de eventos del backend que pueden usar los componentes
export type { FullAttendanceStateEvent, BackendChecadorEvent };
