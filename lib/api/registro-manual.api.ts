import { apiClient } from '@/lib/apiClient';
import { getApiErrorMessage } from './api-helpers';

// ============================================================================
// INTERFACES Y TIPOS CO-UBICADOS
// ============================================================================

export interface RegistroManualData {
  empleadoId: number;
  fechaHora: string; // Formato: "2025-08-07 08:01:00"
  motivo: string; // Ej: "Falla de luz en el área de trabajo"
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
 * @param data - Datos del registro manual (empleadoId, fechaHora, motivo)
 * @returns Promise con la respuesta del servidor
 * @note El backend determina automáticamente si es ENTRADA o SALIDA basándose en la hora y horario del empleado
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
