import axios from "axios";
import { HorarioAsignadoDto } from "@/app/horarios/asignados/types";
import { HorarioTemplateDTO, TipoHorarioDTO, HorarioAsignadoCreateDto } from "@/app/horarios/asignados/registrar/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

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
    throw new Error("Failed to fetch schedule templates.");
  }
};

// Fetches all schedule types
export const getScheduleTypes = async (): Promise<TipoHorarioDTO[]> => {
  try {
    const response = await api.get("/api/tipos-horario");
    return response.data;
  } catch (error) {
    console.error("Error fetching schedule types:", error);
    throw new Error("Failed to fetch schedule types.");
  }
};

// Creates a new schedule template
export const createHorarioTemplate = async (templateData: Omit<HorarioTemplateDTO, 'id'>): Promise<HorarioTemplateDTO> => {
    try {
        const response = await api.post("/api/horarios", templateData);
        return response.data;
    } catch (error) {
        console.error("Error creating schedule template:", error);
        throw new Error("Failed to create schedule template.");
    }
};

// Checks for schedule overlaps
export const checkOverlap = async (params: {
    empleadoId: number;
    fechaInicio: string;
    fechaFin: string | null;
    horarioId: number;
    detalles?: any[]; // Keep this flexible for now
    asignacionIdExcluir?: number;
}): Promise<{ hasOverlap: boolean, message?: string }> => {
    try {
        const response = await api.get("/api/horarios-asignados/verificar-traslape", { params });
        return { hasOverlap: response.data.traslape };
    } catch (error: any) {
        console.error("Error checking for overlap:", error);
        const message = error.response?.data?.message || "Failed to check for schedule overlap.";
        return { hasOverlap: true, message }; // Assume overlap on error to be safe
    }
};

// Creates a new schedule assignment
export const createHorarioAsignado = async (assignmentData: HorarioAsignadoCreateDto): Promise<HorarioAsignadoDto> => {
    try {
        const response = await api.post("/api/horarios-asignados", assignmentData);
        return response.data;
    } catch (error) {
        console.error("Error creating schedule assignment:", error);
        throw new Error("Failed to create schedule assignment.");
    }
};

// Fetches a single schedule assignment by ID
export const getHorarioAsignadoById = async (id: number): Promise<HorarioAsignadoDto> => {
    try {
        const response = await api.get(`/api/horarios-asignados/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching schedule assignment with ID ${id}:`, error);
        throw new Error(`Failed to fetch schedule assignment with ID ${id}.`);
    }
};

// Updates an existing schedule assignment
export const updateHorarioAsignado = async (id: number, assignmentData: HorarioAsignadoCreateDto): Promise<HorarioAsignadoDto> => {
    try {
        const response = await api.put(`/api/horarios-asignados/${id}`, assignmentData);
        return response.data;
    } catch (error) {
        console.error(`Error updating schedule assignment with ID ${id}:`, error);
        throw new Error(`Failed to update schedule assignment with ID ${id}.`);
    }
}; 