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
}

export interface JustificacionDepartamentalData {
  departamentoId: number;
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
    const response = await apiClient.post(
      '/api/justificaciones/departamento',
      data
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        'Ocurrió un error inesperado al procesar la justificación departamental.'
      )
    );
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

    // El backend puede devolver la respuesta directamente o envuelta
    const responseData = response.data.data ? response.data : response.data;

    return {
      id: responseData.id || 0,
      mensaje:
        responseData.message || response.data.message || 'Justificación creada',
      empleadosAfectados:
        response.data.empleadosJustificados ||
        response.data.empleadosAfectados ||
        0,
    };
  } catch (error) {
    console.error('API: Error en justificación masiva:', error); // Debug log
    throw new Error(
      getApiErrorMessage(
        error,
        'Ocurrió un error inesperado al procesar la justificación masiva.'
      )
    );
  }
};
