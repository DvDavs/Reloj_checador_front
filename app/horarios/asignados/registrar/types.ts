// -----------------------------------------------------------------------------
// Tipos para los DTOs de la API
// -----------------------------------------------------------------------------

export interface EmpleadoSimpleDTO {
  id: number;
  nombreCompleto: string;
  rfc?: string;
  curp?: string;
}

export interface HorarioTemplateDTO {
  id: number;
  nombre: string;
  descripcion: string;
  esHorarioJefe: boolean;
  detalles: DetalleHorarioDTO[];
}

export interface DetalleHorarioDTO {
  id?: number;
  diaSemana:
    | 'LUNES'
    | 'MARTES'
    | 'MIERCOLES'
    | 'JUEVES'
    | 'VIERNES'
    | 'SABADO'
    | 'DOMINGO';
  horaEntrada: string; // "HH:mm"
  horaSalida: string; // "HH:mm"
  turno: number;
}

export interface TipoHorarioDTO {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface HorarioAsignadoCreateDto {
    empleadoId: number;
    horarioId: number;
    tipoHorarioId: number;
    fechaInicio: string;
    fechaFin: string | null;
}

// -----------------------------------------------------------------------------
// Tipos para el estado y la lógica del asistente
// -----------------------------------------------------------------------------

export type WizardStep = 'selectEmployee' | 'selectSchedule' | 'setDates' | 'summary' | 'completed';

export interface NewScheduleData {
  nombre: string;
  descripcion: string;
  esHorarioJefe: boolean;
  detalles: DetalleHorarioDTO[];
}

export interface WizardState {
  step: WizardStep;
  
  // Paso 1: Selección de empleado
  selectedEmployee: EmpleadoSimpleDTO | null;

  // Paso 2: Selección/Creación de horario
  scheduleSelectionType: 'existing' | 'new' | null;
  selectedTemplateId: number | null;
  newScheduleData: NewScheduleData;

  // Paso 3: Fechas y tipo
  assignmentStartDate: Date | null;
  assignmentEndDate: Date | null;
  selectedScheduleTypeId: number | null;
  
  // Estado general
  newlyCreatedTemplateId: number | null; 
  isSubmitting: boolean;
  error: string | null;
}

export type WizardAction =
  | { type: 'SET_STEP'; payload: WizardStep }
  | { type: 'SELECT_EMPLOYEE'; payload: EmpleadoSimpleDTO | null }
  | { type: 'SET_SCHEDULE_SELECTION_TYPE'; payload: 'existing' | 'new' | null }
  | { type: 'SELECT_EXISTING_TEMPLATE'; payload: number | null }
  | { type: 'UPDATE_NEW_SCHEDULE_DATA'; payload: Partial<NewScheduleData> }
  | { type: 'SET_ASSIGNMENT_DATES'; payload: { startDate: Date | null; endDate: Date | null } }
  | { type: 'SELECT_SCHEDULE_TYPE'; payload: number | null }
  | { type: 'SET_NEWLY_CREATED_TEMPLATE_ID'; payload: number | null }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; payload: string }
  | { type: 'RESET' }
  | { type: 'SET_STATE'; payload: Partial<WizardState> }; 