import { apiClient } from '@/lib/apiClient';
import { getApiErrorMessage } from './api-helpers';

// ============================================================================
// INTERFACES Y TIPOS CO-UBICADOS
// ============================================================================

export interface AsistenciaFilters {
  empleadoId?: number;
  fechaInicio?: string;
  fechaFin?: string;
  estatusId?: number;
  departamentoId?: number;
}

export interface AsistenciaRecord {
  id: number;
  empleado: {
    id: number;
    nombreCompleto: string;
    numeroEmpleado: string;
    departamento: {
      clave: string;
      nombre: string;
    };
  };
  fecha: string;
  estatus: {
    id: number;
    nombre: string;
    descripcion: string;
  };
  horaEntrada?: string;
  horaSalida?: string;
  minutosRetardo?: number;
  observaciones?: string;
}

export interface EstatusDisponible {
  id: number;
  nombre: string;
  descripcion: string;
  color?: string;
}

export interface EstatusCorrecionData {
  nuevoEstatusId: number;
  observaciones?: string;
  motivo: string;
}

export interface EstatusCorrecionMasivaData {
  asistenciaIds: number[];
  nuevoEstatusId: number;
  observaciones?: string;
  motivo: string;
}

export interface EstatusCorrecionResponse {
  id: number;
  mensaje: string;
  asistenciasAfectadas: number;
  detalles?: {
    asistenciaId: number;
    empleado: string;
    fecha: string;
    estatusAnterior: string;
    estatusNuevo: string;
  }[];
}

export interface BusquedaAsistenciasResponse {
  asistencias: AsistenciaRecord[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

// ============================================================================
// FUNCIONES DE API
// ============================================================================

/**
 * Busca asistencias según los filtros proporcionados
 * @param filters - Filtros de búsqueda
 * @param pagina - Número de página (opcional, default: 1)
 * @param limite - Límite de resultados por página (opcional, default: 50)
 * @returns Promise con los resultados de búsqueda
 */
export const buscarAsistencias = async (
  filters: AsistenciaFilters,
  pagina: number = 1,
  limite: number = 50
): Promise<BusquedaAsistenciasResponse> => {
  try {
    const params = new URLSearchParams();

    if (filters.empleadoId)
      params.append('empleadoId', filters.empleadoId.toString());
    if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
    if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
    if (filters.estatusId)
      params.append('estatusId', filters.estatusId.toString());
    if (filters.departamentoId)
      params.append('departamentoId', filters.departamentoId.toString());

    params.append('pagina', pagina.toString());
    params.append('limite', limite.toString());

    const response = await apiClient.get(
      `/api/asistencias/buscar?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        'Ocurrió un error inesperado al buscar asistencias.'
      )
    );
  }
};

/**
 * Obtiene la lista de estatus disponibles para corrección
 * @returns Promise con la lista de estatus disponibles
 */
export const getEstatusDisponibles = async (): Promise<EstatusDisponible[]> => {
  try {
    const response = await apiClient.get(
      '/api/asistencias/estatus/disponibles'
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        'Ocurrió un error inesperado al obtener los estatus disponibles.'
      )
    );
  }
};

/**
 * Corrige el estatus de una asistencia individual
 * @param id - ID de la asistencia a corregir
 * @param data - Datos de la corrección
 * @returns Promise con la respuesta del servidor
 */
export const corregirEstatusIndividual = async (
  id: number,
  data: EstatusCorrecionData
): Promise<EstatusCorrecionResponse> => {
  try {
    const response = await apiClient.put(
      `/api/asistencias/${id}/estatus`,
      data
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        'Ocurrió un error inesperado al corregir el estatus individual.'
      )
    );
  }
};

/**
 * Corrige el estatus de múltiples asistencias de forma masiva
 * @param data - Datos de la corrección masiva
 * @returns Promise con la respuesta del servidor
 */
export const corregirEstatusMasivo = async (
  data: EstatusCorrecionMasivaData
): Promise<EstatusCorrecionResponse> => {
  try {
    const response = await apiClient.put(
      '/api/asistencias/estatus/masivo',
      data
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        'Ocurrió un error inesperado al corregir el estatus masivo.'
      )
    );
  }
};

/**
 * Obtiene los detalles de una asistencia específica
 * @param id - ID de la asistencia
 * @returns Promise con los detalles de la asistencia
 */
export const getAsistenciaById = async (
  id: number
): Promise<AsistenciaRecord> => {
  try {
    const response = await apiClient.get(`/api/asistencias/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        'Ocurrió un error inesperado al obtener los detalles de la asistencia.'
      )
    );
  }
};
