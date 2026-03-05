import { apiClient } from '@/lib/apiClient';
import { getApiErrorMessage } from './api-helpers';

export interface AuditEventDto {
  id: number;
  timestamp: string;
  actorId: string;
  actorType: string;
  actorName: string;
  sourceIp: string;
  sourceDevice: string;
  module: string;
  action: string;
  targetEntityType: string;
  targetEntityId: string;
  eventType: string;
  outcome: string;
  errorMessage: string;
  details: any;
}

export interface AuditFilters {
  from?: string;
  to?: string;
  actorId?: string;
  module?: string;
  targetEntityType?: string;
}

export interface AuditEventsResponse {
  content: AuditEventDto[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/**
 * Obtiene los eventos de auditoría con filtros y paginación
 * @param filters - Filtros de búsqueda (fechas en formato ISO)
 * @param pagina - Número de página (0-indexed para el backend)
 * @param limite - Tamaño de página
 * @returns Promise con la respuesta paginada de auditoría
 */
export const getAuditEvents = async (
  filters: AuditFilters,
  pagina: number = 0,
  limite: number = 20
): Promise<AuditEventsResponse> => {
  try {
    const params = new URLSearchParams();

    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.actorId) params.append('actorId', filters.actorId);
    if (filters.module) params.append('module', filters.module);
    if (filters.targetEntityType)
      params.append('targetEntityType', filters.targetEntityType);

    params.append('page', pagina.toString());
    params.append('size', limite.toString());
    params.append('sort', 'timestamp,desc');

    const response = await apiClient.get(
      `/api/audit/events?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        'Ocurrió un error inesperado al obtener los logs de auditoría.'
      )
    );
  }
};

/**
 * Obtiene un evento de auditoría por su ID
 * @param id - ID del evento
 * @returns Promise con el detalle del evento
 */
export const getAuditEventById = async (id: number): Promise<AuditEventDto> => {
  try {
    const response = await apiClient.get(`/api/audit/events/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        `Ocurrió un error al obtener el detalle del log con ID ${id}.`
      )
    );
  }
};

/**
 * Obtiene la lista de IDs de actores únicos que han generado eventos de auditoría.
 */
export const getAuditActors = async (): Promise<string[]> => {
  try {
    const response = await apiClient.get<string[]>('/api/audit/actors');
    return response.data;
  } catch (error) {
    console.error('Error al obtener actores de auditoría:', error);
    return [];
  }
};
