import axios from "axios";
import { HorarioAsignadoDto } from "@/app/horarios/asignados/types";
import { HorarioTemplateDTO, TipoHorarioDTO, HorarioAsignadoCreateDto } from "@/app/horarios/asignados/registrar/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

/**
 * Extracts a meaningful error message from an API error object.
 * @param error The error object, expected to be an AxiosError or standard Error.
 * @returns A user-friendly error message string.
 */
export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    // Error with a response from the server
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    // Error without a server response (e.g., network error)
    if (error.request) {
      return "Error de red: No se pudo conectar con el servidor.";
    }
  }
  // Standard JavaScript error
  if (error instanceof Error) {
    return error.message;
  }
  // Fallback for unknown errors
  return "Ocurrió un error inesperado.";
};

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Fetches all schedule templates
export const getHorarioTemplates = async (): Promise<HorarioTemplateDTO[]> => {
  try {
    const response = await api.get("/api/horarios");
    return response.data;
  } catch (error) {
    console.error("Error fetching schedule templates:", error);
    throw new Error(getApiErrorMessage(error));
  }
};

// Fetches all schedule types
export const getScheduleTypes = async (): Promise<TipoHorarioDTO[]> => {
  try {
    const response = await api.get("/api/tipos-horario");
    return response.data;
  } catch (error) {
    console.error("Error fetching schedule types:", error);
    throw new Error(getApiErrorMessage(error));
  }
};

// Creates a new schedule template
export const createHorarioTemplate = async (templateData: Omit<HorarioTemplateDTO, 'id'>): Promise<HorarioTemplateDTO> => {
    try {
        const response = await api.post("/api/horarios", templateData);
        return response.data;
    } catch (error) {
        console.error("Error creating schedule template:", error);
        throw new Error(getApiErrorMessage(error));
    }
};

// Creates a new schedule assignment
export const createHorarioAsignado = async (assignmentData: HorarioAsignadoCreateDto): Promise<HorarioAsignadoDto> => {
    try {
        const response = await api.post("/api/horarios-asignados", assignmentData);
        return response.data;
    } catch (error) {
        console.error("Error creating schedule assignment:", error);
        throw new Error(getApiErrorMessage(error));
    }
};

// Fetches a single schedule assignment by ID
export const getHorarioAsignadoById = async (id: number): Promise<HorarioAsignadoDto> => {
    try {
        const response = await api.get(`/api/horarios-asignados/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching schedule assignment with ID ${id}:`, error);
        throw new Error(getApiErrorMessage(error));
    }
};

// Updates an existing schedule assignment
export const updateHorarioAsignado = async (id: number, assignmentData: HorarioAsignadoCreateDto): Promise<HorarioAsignadoDto> => {
    try {
        const response = await api.put(`/api/horarios-asignados/${id}`, assignmentData);
        return response.data;
    } catch (error) {
        console.error(`Error updating schedule assignment with ID ${id}:`, error);
        throw new Error(getApiErrorMessage(error));
    }
}; 