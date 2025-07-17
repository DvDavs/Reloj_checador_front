// Tipos compartidos basados en los DTOs del backend

export interface DetalleHorarioDto {
  id: number
  diaSemana: number
  turno?: number
  horaEntrada: string // "HH:mm:ss"
  horaSalida: string // "HH:mm:ss"
}

export interface HorarioDto {
  id: number
  nombre: string
  descripcion: string | null
  detalles: DetalleHorarioDto[]
}

export interface TipoHorarioDto {
  id: number
  nombre: string
  descripcion: string | null
  color: string | null
}

export interface HorarioAsignadoCreateDto {
  empleadoId: number
  horarioId: number
  tipoHorarioId: number
  fechaInicio: string // "yyyy-MM-dd"
  fechaFin?: string | null // "yyyy-MM-dd"
}

export interface HorarioAsignadoDto {
  id: number
  empleadoId: number
  empleadoNombre: string | null
  horarioId: number
  horarioNombre: string
  tipoHorarioId: number | null
  tipoHorarioNombre: string | null
  fechaInicio: string
  fechaFin: string | null
}

// Tipo para empleados del backend
export interface EmpleadoDto {
  id: number
  rfc: string
  curp: string
  primerNombre: string
  segundoNombre: string | null
  primerApellido: string
  segundoApellido: string | null
  departamentoAcademicoId: number | null
  departamentoAdministrativoId: number | null
  tipoNombramientoPrincipal: string | null
  tipoNombramientoSecundario: string | null
  estatusId: number | null
  nombreCompleto: string
}

// Tipo simplificado para la UI
export interface EmpleadoUI {
  id: number
  nombre: string
  departamento: string
  puesto: string
}
