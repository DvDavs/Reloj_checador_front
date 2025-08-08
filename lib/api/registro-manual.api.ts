import { apiClient } from '@/lib/apiClient';
import { getApiErrorMessage } from './api-helpers';

// ============================================================================
// INTERFACES Y TIPOS CO-UBICADOS
// ============================================================================

export interface RegistroManualData {
  empleadoId: number;
  fecha: string;
  hora: string;
  tipo: 'ENTRADA' | 'SALIDA';
}

export interface RegistroManualResponse {
  id: number;
  mensaje: string;
  empleado: {
    id: number;
    nombreCompleto: string;
    numeroEmpleado: string;
  };
  fechaHora: string;
  tipo: string;
  estatusAsistenciaRecalculado?: string;
}

export interface EmpleadoBasico {
  id: number;
  nombreCompleto: string;
  numeroEmpleado: string;
  departamento?: {
    clave: string;
    nombre: string;
  };
}

// ============================================================================
// FUNCIONES DE API
// ============================================================================

/**
 * Crea un registro manual de checada retroactivo
 * @param data - Datos del registro manual
 * @returns Promise con la respuesta del servidor
 */
export const createRegistroManual = async (
  data: RegistroManualData
): Promise<RegistroManualResponse> => {
  try {
    const response = await apiClient.post('/api/registros/manual', data);
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        'Ocurrió un error inesperado al crear el registro manual.'
      )
    );
  }
};

/**
 * Obtiene la lista de empleados para selección en el formulario
 * @returns Promise con la lista de empleados
 */
export const getEmpleadosParaRegistro = async (): Promise<EmpleadoBasico[]> => {
  try {
    const response = await apiClient.get('/api/empleados');
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        'Ocurrió un error inesperado al obtener la lista de empleados.'
      )
    );
  }
};
