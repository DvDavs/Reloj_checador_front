// Tipos y definiciones para el componente TimeClock y servicios relacionados

/**
 * Posibles estados de una jornada de trabajo.
 */
export type EstatusJornada =
  | 'PENDIENTE'
  | 'EN_CURSO'
  | 'COMPLETADA'
  | 'RETARDO'
  | 'RETARDO_SIN_SALIDA'
  | 'AUSENTE_ENTRADA'
  | 'AUSENTE_SALIDA'
  | 'AUSENTE';

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
  estatusJornada: EstatusJornada; // Usando la union type definida arriba
  minutosRetardoPreliminar: number | null;
};

/**
 * Datos básicos de un empleado recibidos desde el backend (EmpleadoDto de Spring Boot).
 * @NOTA: Refleja los campos de la tabla `rh_personal`.
 */
export type EmpleadoDto = {
  id: number;
  rfc: string;
  curp: string;
  tarjeta?: number | null; // Nuevo campo
  primerNombre: string;
  segundoNombre: string | null;
  primerApellido: string;
  segundoApellido: string | null;

  nombramiento?: string | null; // Nuevo campo (antes era tipoNombramientoPrincipal en algunos contextos)
  departamento?: number | null; // Nuevo campo (antes era departamentoAcademicoId/departamentoAdministrativoId)
  academia?: number | null; // Nuevo campo
  departamentoNombre?: string | null; // Nuevo campo (para mostrar el nombre del departamento)
  academiaNombre?: string | null; // Nuevo campo (para mostrar el nombre de la academia)

  tipoNombramientoSecundario: string | null; // Mantenido
  estatusId: number | null; // Mantenido
  estatusNombre?: string | null; // Añadido para consistencia con backend Empleado entity

  nombreCompleto: string; // Campo calculado en el backend
  permiteChecarConPin?: boolean; // Indica si el empleado puede usar PIN para checar
  // Foto de empleado
  tieneFoto?: boolean | null;
  fotoUrl?: string | null;
  // Los campos `correoInstitucional`, `departamentoAcademicoId`, `departamentoAdministrativoId`,
  // `tipoNombramientoPrincipal` (si se usaba como campo separado) son eliminados.
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
  accion?: 'entrada' | 'salida' | 'E' | 'S';
  statusCode?: string; // Código de estado del backend
  statusType?: string; // Tipo de estado (OK, INFO, ERROR)
  data?: Record<string, any>; // Datos adicionales del evento
};

/**
 * Evento enviado por el backend que contiene la información completa del estado
 * de asistencia de un empleado. Corresponde a FullAttendanceStateEvent.java.
 *
 * Este evento es la fuente autoritativa de datos sobre el estado actual de
 * asistencia, incluyendo qué acción se recomienda a continuación.
 */
export type FullAttendanceStateEvent = {
  type: 'FULL_ATTENDANCE_STATE_UPDATE'; // Literal type
  readerName: string;
  employeeData: EmpleadoDto; // Usar el EmpleadoDto actualizado
  dailyWorkSessions: JornadaEstadoDto[];
  nextRecommendedActionBackend:
    | 'entrada'
    | 'salida'
    | 'ALL_COMPLETE'
    | 'NO_ACTION';
  activeSessionIdBackend: number | null;
  justCompletedSessionIdBackend?: number | null;
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
  action: 'entrada' | 'salida';
  sessionId?: number;
  employeeId: string;
  statusCode?: string;
};

/**
 * Estados posibles del escáner de huellas dactilares.
 */
export type ScanState = 'idle' | 'scanning' | 'success' | 'failed' | 'ready';
