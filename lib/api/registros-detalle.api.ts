import { apiClient } from '@/lib/apiClient';
import { getApiErrorMessage } from './api-helpers';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export interface RegistroDetalle {
  id: number;
  empleadoId: number;
  empleadoNombre: string;
  tipoRegistroNombre: string;
  tipoEoS: 'E' | 'S';
  estatusCalculado: string;
  fechaHora: string; // Formato "yyyy-MM-dd HH:mm:ss"
  observaciones: string | null;
}

export interface RegistrosDetalleResponse {
  content: RegistroDetalle[];
  totalPages: number;
  totalElements: number;
  number: number; // Página actual (0-indexed)
}

export interface CorrecionRegistrosRequest {
  registroIds: number[];
  nuevoEstatusClave: string;
  motivo: string;
}

// ============================================================================
// FUNCIONES DE API
// ============================================================================

export const buscarRegistrosDetalle = async (params: {
  empleadoId?: number | null;
  departamentoClave?: string | null;
  desde?: string | null; // "yyyy-MM-dd"
  hasta?: string | null; // "yyyy-MM-dd"
  page?: number; // 0-indexed
  size?: number;
  sort?: string;
}): Promise<RegistrosDetalleResponse> => {
  try {
    const response = await apiClient.get('/api/registros-detalle', { params });
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, 'Error al buscar los registros.')
    );
  }
};

export const corregirEstatusRegistros = async (
  data: CorrecionRegistrosRequest
): Promise<RegistroDetalle[]> => {
  try {
    const response = await apiClient.put(
      '/api/registros-detalle/estatus',
      data
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        'Error al corregir el estatus de los registros.'
      )
    );
  }
};

export const getClavesEstatus = async (): Promise<string[]> => {
  try {
    const response = await apiClient.get('/api/reglas-estatus/claves');
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, 'Error al obtener las claves de estatus.')
    );
  }
};
