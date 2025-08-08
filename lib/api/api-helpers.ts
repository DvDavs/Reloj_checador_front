import { AxiosError } from 'axios';

/**
 * Extrae un mensaje de error legible desde diferentes tipos de errores de API
 * @param error - El error capturado (puede ser AxiosError, Error, o unknown)
 * @param defaultMessage - Mensaje por defecto si no se puede extraer uno específico
 * @returns Mensaje de error legible para mostrar al usuario
 */
export const getApiErrorMessage = (
  error: unknown,
  defaultMessage: string = 'Ocurrió un error inesperado.'
): string => {
  if (error instanceof AxiosError) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.request) {
      return 'Error de red: No se pudo conectar con el servidor.';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
};
