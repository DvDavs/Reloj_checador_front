import { apiClient } from '@/lib/apiClient';
import { getApiErrorMessage } from './api-helpers';

// ============================================================================
// INTERFACES Y TIPOS CO-UBICADOS
// ============================================================================

export interface JustificacionIndividualData {
  empleadoId: number;
  fechaInicio: string;
  fechaFin: string;
  motivo: string;
  numOficio?: string;
}

export interface JustificacionDepartamentalData {
  departamentoClave: string; // DEBE SER departamentoClave y de tipo string
  fecha: string;
  motivo: string;
}

export interface JustificacionMasivaData {
  fecha: string;
  motivo: string;
}

export interface JustificacionResponse {
  id: number;
  mensaje: string;
  empleadosAfectados?: number;
}

// ============================================================================
// TIPOS PARA LISTADO
// ============================================================================

export interface JustificacionItem {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  motivo?: string | null;
  numOficio?: string | null;
  esMasiva: boolean;
  departamentoId?: number | null;
  empleadoId?: number | null;
  empleadoNombre?: string | null;
  tipoJustificacionNombre?: string | null;
  createdAt?: string;
}

// ============================================================================
// FUNCIONES DE API
// ============================================================================

/**
 * Crea una justificación individual para un empleado específico
 * @param data - Datos de la justificación individual
 * @returns Promise con la respuesta del servidor
 */
export const createJustificacionIndividual = async (
  data: JustificacionIndividualData
): Promise<JustificacionResponse> => {
  try {
    const response = await apiClient.post(
      '/api/justificaciones/empleado',
      data
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        'Ocurrió un error inesperado al procesar la justificación individual.'
      )
    );
  }
};

/**
 * Crea una justificación departamental para todos los empleados de un departamento
 * @param data - Datos de la justificación departamental
 * @returns Promise con la respuesta del servidor
 */
export const createJustificacionDepartamental = async (
  data: JustificacionDepartamentalData
): Promise<JustificacionResponse> => {
  try {
    console.log('API: Enviando justificación departamental:', data); // Debug log
    const response = await apiClient.post(
      '/api/justificaciones/departamento',
      data
    );
    console.log('API: Respuesta departamental:', response.data); // Debug log

    // Extraer empleados afectados de diferentes posibles ubicaciones en la respuesta
    let empleadosAfectados = 0;

    if (response.data.empleadosJustificados !== undefined) {
      empleadosAfectados = response.data.empleadosJustificados;
    } else if (response.data.empleadosAfectados !== undefined) {
      empleadosAfectados = response.data.empleadosAfectados;
    } else if (response.data.data?.empleadosJustificados !== undefined) {
      empleadosAfectados = response.data.data.empleadosJustificados;
    } else if (response.data.data?.empleadosAfectados !== undefined) {
      empleadosAfectados = response.data.data.empleadosAfectados;
    } else if (response.data.count !== undefined) {
      empleadosAfectados = response.data.count;
    }

    console.log(
      'API: Empleados afectados (departamental):',
      empleadosAfectados
    ); // Debug log

    return {
      id: response.data.id || response.data.data?.id || 0,
      mensaje:
        response.data.message ||
        response.data.data?.message ||
        'Justificación creada',
      empleadosAfectados,
    };
  } catch (error) {
    // Extraer mensaje específico del backend si está disponible
    let backendMessage =
      'Ocurrió un error inesperado al procesar la justificación departamental.';

    if (error && typeof error === 'object') {
      const errorObj = error as any;
      backendMessage =
        errorObj.response?.data?.message ||
        errorObj.response?.data?.mensaje ||
        errorObj.response?.data?.error ||
        errorObj.message ||
        backendMessage;
    }

    console.error('API: Error en justificación departamental:', backendMessage); // Debug log
    throw new Error(backendMessage);
  }
};

/**
 * Crea una justificación masiva para todos los empleados del sistema
 * @param data - Datos de la justificación masiva
 * @returns Promise con la respuesta del servidor
 */
export const createJustificacionMasiva = async (
  data: JustificacionMasivaData
): Promise<JustificacionResponse> => {
  try {
    console.log('API: Enviando justificación masiva:', data); // Debug log
    const response = await apiClient.post('/api/justificaciones/masivo', data);
    console.log('API: Respuesta completa del backend:', response); // Debug log
    console.log('API: response.data:', response.data); // Debug log

    // Extraer empleados afectados de diferentes posibles ubicaciones en la respuesta
    let empleadosAfectados = 0;

    // Intentar extraer de diferentes campos posibles
    if (response.data.empleadosJustificados !== undefined) {
      empleadosAfectados = response.data.empleadosJustificados;
    } else if (response.data.empleadosAfectados !== undefined) {
      empleadosAfectados = response.data.empleadosAfectados;
    } else if (response.data.data?.empleadosJustificados !== undefined) {
      empleadosAfectados = response.data.data.empleadosJustificados;
    } else if (response.data.data?.empleadosAfectados !== undefined) {
      empleadosAfectados = response.data.data.empleadosAfectados;
    } else if (response.data.count !== undefined) {
      empleadosAfectados = response.data.count;
    } else if (response.data.data?.count !== undefined) {
      empleadosAfectados = response.data.data.count;
    }

    console.log('API: Empleados afectados extraídos:', empleadosAfectados); // Debug log

    return {
      id: response.data.id || response.data.data?.id || 0,
      mensaje:
        response.data.message ||
        response.data.data?.message ||
        'Justificación creada',
      empleadosAfectados,
    };
  } catch (error) {
    // Extraer mensaje específico del backend si está disponible
    let backendMessage =
      'Ocurrió un error inesperado al procesar la justificación masiva.';

    if (error && typeof error === 'object') {
      const errorObj = error as any;
      backendMessage =
        errorObj.response?.data?.message ||
        errorObj.response?.data?.mensaje ||
        errorObj.response?.data?.error ||
        errorObj.message ||
        backendMessage;
    }

    console.error('API: Error en justificación masiva:', backendMessage); // Debug log
    throw new Error(backendMessage);
  }
};

/**
 * Lista todas las justificaciones registradas
 */
export const listJustificaciones = async (): Promise<JustificacionItem[]> => {
  try {
    const response = await apiClient.get('/api/justificaciones');
    const backend = response.data || {};
    const items: any[] = backend.data || [];

    // Mapear a un modelo plano y estable para la UI
    return items.map((j: any) => {
      const empleado = j.empleado || {};
      const tipo = j.tipoJustificacion || {};
      return {
        id: j.id,
        fechaInicio: j.fechaInicio,
        fechaFin: j.fechaFin,
        motivo: j.motivo ?? null,
        numOficio: j.numOficio ?? null,
        esMasiva: Boolean(j.esMasiva),
        departamentoId: j.departamentoId ?? null,
        empleadoId: j.empleadoId ?? empleado.id ?? null,
        empleadoNombre:
          j.empleadoNombre ?? empleado.nombreCompleto ?? undefined,
        tipoJustificacionNombre:
          j.tipoJustificacionNombre ?? tipo.nombre ?? undefined,
        createdAt: j.createdAt,
      } as JustificacionItem;
    });
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        'Ocurrió un error inesperado al listar las justificaciones.'
      )
    );
  }
};
