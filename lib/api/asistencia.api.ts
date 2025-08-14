import { apiClient } from '@/lib/apiClient';
import { getApiErrorMessage } from './api-helpers';

// ============================================================================
// INTERFACES Y TIPOS CO-UBICADOS
// ============================================================================

export interface AsistenciaFilters {
  empleadoId?: number;
  departamentoClave?: string; // Cambiado de departamentoId para coincidir con el backend
  fechaInicio?: string;
  fechaFin?: string;
  estatusClave?: string; // Cambiado de estatusId para usar la clave de estatus
  // El campo 'fecha' se mantiene por compatibilidad con otras herramientas si es necesario
  fecha?: string;
  numeroTarjeta?: string; // Número de tarjeta para búsqueda simple
}

export interface AsistenciaRecord {
  id: number;
  fecha: string;
  horaEntradaProgramada: string;
  horaSalidaProgramada: string;
  horaEntradaReal: string | null;
  horaSalidaReal: string | null;
  // Compatibilidad con backend DTO (horaEntrada/horaSalida)
  horaEntrada?: string | null;
  horaSalida?: string | null;
  minutosRetardo: number | null;
  observaciones: string | null;
  empleadoId: number;
  empleadoNombre: string;
  empleadoTarjeta?: number | null;
  estatusAsistenciaId: number;
  estatusAsistenciaNombre: string;
  estatusClave: string; // Corregido a estatusClave
}

export interface EstatusDisponible {
  id: number;
  nombre: string;
  descripcion: string;
  clave: string;
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
  warnings?: string[]; // Advertencias del backend
  success?: boolean;
}

export interface BusquedaAsistenciasResponse {
  asistencias: AsistenciaRecord[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export interface ConsolidacionResponse {
  totalConsolidados: number;
  totalFaltas: number;
  mensaje: string;
  // Compat: algunos consumidores antiguos pueden leer este alias
  registrosConsolidados?: number;
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
    const hasEstatus = filters.estatusClave;
    const hasFecha = filters.fecha || filters.fechaInicio || filters.fechaFin;

    if (!hasEstatus || !hasFecha) {
      throw new Error(
        'Debe proporcionar tanto el estatus como la fecha para realizar la búsqueda.'
      );
    }

    const params = new URLSearchParams();

    // Parámetros requeridos según la guía técnica
    if (filters.estatusClave) {
      params.append('estatusClave', filters.estatusClave);
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
    console.log('API: Enviando corrección individual:', { id, data }); // Debug log
    const response = await apiClient.put(
      `/api/asistencias/${id}/estatus`,
      data
    );
    console.log('API: Respuesta corrección individual:', response.data); // Debug log

    // El backend devuelve { success, message, data } donde data contiene la respuesta
    const result = response.data.data || response.data;

    return {
      ...result,
      warnings:
        result.warnings || result.advertencias || response.data.warnings || [],
      success: response.data.success !== false,
    };
  } catch (error) {
    // Extraer mensaje específico del backend si está disponible
    let backendMessage =
      'Ocurrió un error inesperado al corregir el estatus individual.';

    if (error && typeof error === 'object') {
      const errorObj = error as any;
      backendMessage =
        errorObj.response?.data?.message ||
        errorObj.response?.data?.mensaje ||
        errorObj.response?.data?.error ||
        errorObj.message ||
        backendMessage;
    }

    console.error('API: Error en corrección individual:', backendMessage); // Debug log
    throw new Error(backendMessage);
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
    console.log('API: Enviando corrección masiva:', data); // Debug log
    const response = await apiClient.put(
      '/api/asistencias/estatus/masivo',
      data
    );
    console.log('API: Respuesta corrección masiva:', response.data); // Debug log

    // El backend devuelve { success, message, data } donde data contiene la respuesta
    const result = response.data.data || response.data;

    return {
      ...result,
      warnings:
        result.warnings || result.advertencias || response.data.warnings || [],
      success: response.data.success !== false,
    };
  } catch (error) {
    // Extraer mensaje específico del backend si está disponible
    let backendMessage =
      'Ocurrió un error inesperado al corregir el estatus masivo.';

    if (error && typeof error === 'object') {
      const errorObj = error as any;
      backendMessage =
        errorObj.response?.data?.message ||
        errorObj.response?.data?.mensaje ||
        errorObj.response?.data?.error ||
        errorObj.message ||
        backendMessage;
    }

    console.error('API: Error en corrección masiva:', backendMessage); // Debug log
    throw new Error(backendMessage);
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

/**
 * Dispara manualmente el proceso de consolidación de asistencias para una fecha específica.
 * @param fecha - La fecha para la cual consolidar, en formato "yyyy-MM-dd".
 * @returns Promise con la respuesta del servidor, incluyendo el número de registros consolidados.
 */
export const consolidarAsistenciaManual = async (
  fecha: string
): Promise<ConsolidacionResponse> => {
  try {
    const response = await apiClient.post(
      `/api/estatus-asistencia/consolidar/${fecha}`
    );
    // Backend devuelve { totalConsolidados, totalFaltas }
    const data = response.data || {};
    const totalConsolidados =
      data.totalConsolidados ?? data.registrosConsolidados ?? 0;
    const totalFaltas = data.totalFaltas ?? 0;
    const mensaje =
      data.mensaje ||
      `Registros consolidados: ${totalConsolidados}. Faltas: ${totalFaltas}.`;

    return {
      totalConsolidados,
      totalFaltas,
      mensaje,
      registrosConsolidados: totalConsolidados,
    };
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        'Ocurrió un error inesperado al consolidar las asistencias.'
      )
    );
  }
};

/**
 * Busca asistencias consolidadas con filtros flexibles.
 * Ideal para la herramienta de corrección, permitiendo rangos de fecha y estatus opcional.
 * @param filters - Filtros de búsqueda.
 * @returns Promise con un array de registros de asistencia.
 */
export const buscarAsistenciasConsolidadas = async (
  filters: AsistenciaFilters
): Promise<AsistenciaRecord[]> => {
  try {
    const params = new URLSearchParams();
    if (filters.empleadoId)
      params.append('empleadoId', filters.empleadoId.toString());
    // El backend espera 'departamentoId' para la clave numérica del departamento.
    if (filters.departamentoClave)
      params.append('departamentoId', filters.departamentoClave);
    if (filters.fechaInicio) params.append('desde', filters.fechaInicio);
    if (filters.fechaFin) params.append('hasta', filters.fechaFin);
    if (filters.estatusClave) params.append('estatus', filters.estatusClave);
    // Búsqueda por número de tarjeta: resolver a empleadoId si viene
    if (filters.numeroTarjeta && !filters.empleadoId) {
      try {
        const resp = await apiClient.get(
          `/api/empleados/tarjeta/${encodeURIComponent(filters.numeroTarjeta)}`
        );
        if (resp.data?.id) {
          params.set('empleadoId', String(resp.data.id));
        }
      } catch (_) {
        // Si no se encuentra por tarjeta, la búsqueda no devolverá resultados por empleado
      }
    }

    // Llama al endpoint flexible del backend
    const response = await apiClient.get(
      `/api/asistencias?${params.toString()}`
    );

    // Este endpoint devuelve directamente un array
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, 'Error al buscar asistencias consolidadas.')
    );
  }
};
