import { EmpleadoSimpleDTO } from '@/app/horarios/asignados/registrar/types';
import { apiClient } from './apiClient';
import { getApiErrorMessage } from './api/schedule-api';

export const searchEmployees = async (
  query: string
): Promise<EmpleadoSimpleDTO[]> => {
  try {
    const response = await apiClient.get<EmpleadoSimpleDTO[]>(
      `/api/empleados/search?query=${encodeURIComponent(query)}`
    );
    return response.data;
  } catch (error) {
    console.error('Error buscando empleados:', error);
    throw new Error(getApiErrorMessage(error));
  }
};
