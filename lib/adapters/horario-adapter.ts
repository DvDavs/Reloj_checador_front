// Adapter para transformar datos del backend al formato del frontend
import {
  HorarioTemplateDTO,
  DetalleHorarioDTO,
} from '@/app/horarios/asignados/registrar/types';

// Mapeo de números a nombres de días
const DAY_MAP: Record<number, DetalleHorarioDTO['diaSemana']> = {
  1: 'DOMINGO',
  2: 'LUNES',
  3: 'MARTES',
  4: 'MIERCOLES',
  5: 'JUEVES',
  6: 'VIERNES',
  7: 'SABADO',
};

// Tipos del backend (lo que realmente viene de la API)
interface BackendDetalleHorarioDto {
  id?: number;
  diaSemana: number; // 1-7
  horaEntrada: string; // "HH:mm:ss"
  horaSalida: string; // "HH:mm:ss"
  turno: number;
  activo?: boolean;
}

interface BackendHorarioDto {
  id: number;
  nombre: string;
  descripcion: string;
  esHorarioJefe: boolean;
  activo?: boolean;
  detalles: BackendDetalleHorarioDto[];
}

// Convierte tiempo de HH:mm:ss a HH:mm
const formatTime = (time: string): string => {
  if (!time) return '';
  // Si ya tiene formato HH:mm, devolverlo como está
  if (time.length === 5 && time.includes(':')) return time;
  // Si tiene formato HH:mm:ss, quitar los segundos
  if (time.length === 8 && time.split(':').length === 3) {
    return time.substring(0, 5);
  }
  return time;
};

// Convierte un detalle del backend al formato del frontend
export const adaptDetalleHorario = (
  backendDetalle: BackendDetalleHorarioDto
): DetalleHorarioDTO => {
  return {
    id: backendDetalle.id,
    diaSemana: DAY_MAP[backendDetalle.diaSemana] || 'LUNES',
    horaEntrada: formatTime(backendDetalle.horaEntrada),
    horaSalida: formatTime(backendDetalle.horaSalida),
    turno: backendDetalle.turno,
  };
};

// Convierte un horario del backend al formato del frontend
export const adaptHorarioTemplate = (
  backendHorario: BackendHorarioDto
): HorarioTemplateDTO => {
  return {
    id: backendHorario.id,
    nombre: backendHorario.nombre,
    descripcion: backendHorario.descripcion,
    esHorarioJefe: backendHorario.esHorarioJefe,
    detalles: backendHorario.detalles
      .filter((detalle) => detalle.activo !== false) // Filtrar solo detalles activos
      .map(adaptDetalleHorario),
  };
};

// Convierte array de horarios del backend al formato del frontend
export const adaptHorarioTemplates = (
  backendHorarios: BackendHorarioDto[]
): HorarioTemplateDTO[] => {
  return backendHorarios
    .filter((horario) => horario.activo !== false) // Filtrar solo horarios activos
    .map(adaptHorarioTemplate);
};
