import { apiClient } from '@/lib/apiClient';
import { HorarioAsignadoDto } from '@/app/horarios/asignados/types';
import {
  HorarioTemplateDTO,
  TipoHorarioDTO,
  HorarioAsignadoCreateDto,
} from '@/app/horarios/asignados/registrar/types';
import { AxiosError } from 'axios';

export interface DepartamentoDto {
  clave: string;
  nombre: string;
}

export const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.request) {
      return 'Error de red: No se pudo conectar con el servidor.';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocurrió un error inesperado.';
};

export const getDepartamentos = async (): Promise<DepartamentoDto[]> => {
  try {
    const response = await apiClient.get('/api/departamentos');
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const getHorarioTemplates = async (): Promise<HorarioTemplateDTO[]> => {
  try {
    const response = await apiClient.get('/api/horarios');
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const getScheduleTypes = async (): Promise<TipoHorarioDTO[]> => {
  try {
    const response = await apiClient.get('/api/tipos-horario');
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const createHorarioTemplate = async (
  templateData: Omit<HorarioTemplateDTO, 'id'>
): Promise<HorarioTemplateDTO> => {
  try {
    const response = await apiClient.post('/api/horarios', templateData);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const createHorarioAsignado = async (
  assignmentData: HorarioAsignadoCreateDto
): Promise<HorarioAsignadoDto> => {
  try {
    const response = await apiClient.post(
      '/api/horarios-asignados',
      assignmentData
    );
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const getHorarioAsignadoById = async (
  id: number
): Promise<HorarioAsignadoDto> => {
  try {
    const response = await apiClient.get(`/api/horarios-asignados/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const updateHorarioAsignado = async (
  id: number,
  assignmentData: HorarioAsignadoCreateDto
): Promise<HorarioAsignadoDto> => {
  try {
    const response = await apiClient.put(
      `/api/horarios-asignados/${id}`,
      assignmentData
    );
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};
