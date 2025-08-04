export interface HorarioAsignadoDto {
  id: number;
  empleadoId: number;
  empleadoNombre: string;
  horarioId: number;
  horarioNombre: string;
  tipoHorarioId: number;
  tipoHorarioNombre: string;
  activo: boolean;
  fechaInicio: string;
  fechaFin: string;
}

export interface ApiError {
  message: string;
  status?: number;
}
