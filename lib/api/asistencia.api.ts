import { apiClient } from '@/lib/apiClient';
import { getApiErrorMessage } from './api-helpers';

// ============================================================================
// INTERFACES Y TIPOS CO-UBICADOS
// ============================================================================

export interface AsistenciaFilters {
  // Filtros opcionales para búsqueda flexible
  empleadoId?: number;
  departamentoId?: number;
  fechaInicio?: string; // Formato YYYY-MM-DD
  fechaFin?: string; // Formato YYYY-MM-DD
  estatusId?: number;
  // Para compatibilidad con endpoint que requiere fecha única
  fecha?: string; // Formato YYYY-MM-DD
}

export interface AsistenciaRecord {
  // Campos de AsistenciaDiaria
  id: number;
  fecha: string;
  horaEntradaProgramada: string;
  horaSalidaProgramada: string;
  horaEntradaReal: string | null;
  horaSalidaReal: string | null;
  minutosRetardo: number | null;
  observaciones: string | null;

  // Campos aplanados del Empleado
  empleadoId: number;
  empleadoNombre: string;

  // Campos aplanados del EstatusAsistencia
  estatusAsistenciaId: number;
  estatusAsistenciaNombre: string;
  estatusAsistenciaClave: string;
}

export interface EstatusDisponible {
  id: number;
  nombre: string;
  descripcion: string;
  color?: string;
}

export interface EstatusCorrecionData {
  asistenciaId: number; // Requerido por el backend DTO
  nuevoEstatusId: number;
  motivo: string;
  observaciones?: string;
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
    // Validación: Según la guía técnica, se requiere estatusId Y fecha
    const hasEstatus = filters.estatusId;
    const hasFecha = filters.fecha || filters.fechaInicio || filters.fechaFin;

    if (!hasEstatus || !hasFecha) {
      throw new Error(
        'Debe proporcionar tanto el estatus como la fecha para realizar la búsqueda.'
      );
    }

    const params = new URLSearchParams();

    // Parámetros requeridos según la guía técnica
    if (filters.estatusId) {
      params.append('estatusId', filters.estatusId.toString());
    }

    // Para fecha, usar el primer valor disponible
    const fechaParam = filters.fecha || filters.fechaInicio || filters.fechaFin;
    if (fechaParam) {
      params.append('fecha', fechaParam);
    }

    const response = await apiClient.get(
      `/api/asistencias/buscar?${params.toString()}`
    );

    // El backend devuelve { success, message, data, total }
    const backendResponse = response.data;

    // Construimos el objeto que el frontend espera, mapeando los campos del backend
    const results: BusquedaAsistenciasResponse = {
      asistencias: backendResponse.data, // Mapeamos 'data' a 'asistencias'
      total: backendResponse.total,
      pagina: pagina, // Usamos la página que se pasó a la función
      // Si el backend no devuelve totalPaginas, lo calculamos
      totalPaginas: Math.ceil(backendResponse.total / limite) || 1,
    };

    return results;
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
    // El backend devuelve { success, message, data } donde data contiene el array
    return response.data.data;
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
    // El backend devuelve { success, message, data } donde data contiene la respuesta
    return response.data.data;
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
    // El backend devuelve { success, message, data } donde data contiene la respuesta
    return response.data.data;
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
    // El backend devuelve { success, message, data } donde data contiene la asistencia
    return response.data.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        'Ocurrió un error inesperado al obtener los detalles de la asistencia.'
      )
    );
  }
};
