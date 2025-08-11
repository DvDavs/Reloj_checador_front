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
  code: string; // "200" o "202" si fue retardo
  type: string; // "OK"
  data: {
    id: number;
    empleadoId: number;
    fechaHora: string;
    tipoEoS: string; // "E" o "S"
    // Otros campos del RegistroDto según el backend
  };
  message: string; // "Registro manual creado exitosamente"
  detalles?: string[]; // Mensajes específicos del backend
  warnings?: string[]; // Advertencias del backend
  success?: boolean;
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
    console.log('API: Enviando registro manual:', data); // Debug log
    const response = await apiClient.post('/api/registros/manual', data);
    console.log('API: Respuesta registro manual:', response.data); // Debug log

    // Según la guía técnica, este endpoint devuelve una estructura diferente
    // No usa la envoltura estándar { success, message, data }
    const result = {
      ...response.data,
      detalles: response.data.detalles || response.data.details || [],
      warnings: response.data.warnings || response.data.advertencias || [],
      success: response.data.success !== false,
    };

    return result;
  } catch (error) {
    // Extraer mensaje específico del backend si está disponible
    let backendMessage =
      'Ocurrió un error inesperado al crear el registro manual.';

    if (error && typeof error === 'object') {
      const errorObj = error as any;
      backendMessage =
        errorObj.response?.data?.message ||
        errorObj.response?.data?.mensaje ||
        errorObj.response?.data?.error ||
        errorObj.message ||
        backendMessage;
    }

    console.error('API: Error en registro manual:', backendMessage); // Debug log
    throw new Error(backendMessage);
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
