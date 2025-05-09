// Añadir las definiciones de tipos y exportarlas
export type SessionStatus =
  | "entrada-ok"
  | "salida-ok"
  | "entrada-tarde"
  | "salida-incidente"
  | "salida-pendiente"
  | "ausente"
  | "pendiente";

export type WorkSession = {
  id: number;
  entryTime: string | null;
  exitTime: string | null;
  scheduledEntry: string;
  scheduledExit: string;
  entryStatus: SessionStatus;
  exitStatus: SessionStatus;
  isCurrent: boolean;
  employeeId: string;
};

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

export type BackendChecadorEvent = {
  readerName: string;
  identificado: boolean;
  empleadoId?: number;
  nombreCompleto?: string;
  rfc?: string;
  errorMessage?: string;
  accion?: 'entrada' | 'salida';
  statusCode?: string;  // Nuevo: código de estado del backend
  statusType?: string;  // Nuevo: tipo de estado (OK, INFO, ERROR)
  data?: Record<string, any>;  // Nuevo: datos adicionales del evento
};

export type ScanHistoryItem = {
  name: string;
  time: Date;
  success: boolean;
  action: "entrada" | "salida";
  sessionId?: number;
  employeeId: string;
};

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
