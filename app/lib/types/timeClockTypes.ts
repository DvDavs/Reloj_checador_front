// Tipos y definiciones para el componente TimeClock y servicios relacionados

/**
 * Datos del estado de una jornada de trabajo recibido desde el backend.
 * Es la representación principal del estado de una jornada.
 */
export type JornadaEstadoDto = {
  detalleHorarioId: number;
  horarioAsignadoId: number;
  horarioNombre: string;
  turno: number;
  horaEntradaProgramada: string; // Formato "HH:mm:ss"
  horaSalidaProgramada: string; // Formato "HH:mm:ss"
  horaEntradaReal: string | null; // Formato "yyyy-MM-dd HH:mm:ss"
  horaSalidaReal: string | null; // Formato "yyyy-MM-dd HH:mm:ss"
  estatusJornada: string; // "PENDIENTE", "EN_CURSO", "COMPLETADA", "RETARDO", "AUSENTE_ENTRADA", etc.
  minutosRetardoPreliminar: number | null;
};

/**
 * Datos básicos de un empleado recibidos desde el backend.
 */
export type EmpleadoDto = {
  id: number;
  rfc: string;
  curp: string;
  primerNombre: string;
  segundoNombre: string | null;
  primerApellido: string;
  segundoApellido: string | null;
  departamentoAcademicoId: number | null;
  departamentoAdministrativoId: number | null;
  tipoNombramientoPrincipal: string | null;
  tipoNombramientoSecundario: string | null;
  estatusId: number | null;
  nombreCompleto: string;
  // Campos adicionales calculados para UI
  totalHoras?: string;
  horasSemana?: string;
};

/**
 * Evento de respuesta inmediata del checador.
 * Proporciona feedback rápido sobre el resultado de un escaneo sin datos completos.
 */
export type BackendChecadorEvent = {
  readerName: string;
  identificado: boolean;
  empleadoId?: number;
  nombreCompleto?: string;
  rfc?: string;
  errorMessage?: string;
  accion?: 'entrada' | 'salida';
  statusCode?: string;  // Código de estado del backend
  statusType?: string;  // Tipo de estado (OK, INFO, ERROR)
  data?: Record<string, any>;  // Datos adicionales del evento
};

/**
 * Evento enviado por el backend que contiene la información completa del estado
 * de asistencia de un empleado. Corresponde a FullAttendanceStateEvent.java.
 * 
 * Este evento es la fuente autoritativa de datos sobre el estado actual de
 * asistencia, incluyendo qué acción se recomienda a continuación.
 */
export type FullAttendanceStateEvent = {
  type: "FULL_ATTENDANCE_STATE_UPDATE"; // Literal type
  readerName: string;
  employeeData: EmpleadoDto;
  dailyWorkSessions: JornadaEstadoDto[];
  nextRecommendedActionBackend: "entrada" | "salida" | "ALL_COMPLETE" | "NO_ACTION";
  activeSessionIdBackend: number | null;
};

/**
 * Tipo unión para los mensajes STOMP recibidos del backend.
 * Pueden ser eventos de checador (respuestas inmediatas) o eventos de estado completo.
 */
export type StompEventMessage = BackendChecadorEvent | FullAttendanceStateEvent;

/**
 * Ítem en el historial de escaneos mostrado en la UI.
 */
export type ScanHistoryItem = {
  name: string;
  time: Date;
  success: boolean;
  action: "entrada" | "salida";
  sessionId?: number;
  employeeId: string;
  statusCode?: string;
};

/**
 * Estados posibles del escáner de huellas dactilares.
 */
export type ScanState =
  | "idle"
  | "scanning"
  | "analyzing"
  | "success"
  | "failed"
  | "ready"
  | "background-scanning"
  | "background-analyzing"
  | "background-success"
  | "background-failed";
