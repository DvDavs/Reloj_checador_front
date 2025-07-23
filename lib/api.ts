import { EmpleadoSimpleDTO, HorarioTemplateDTO, TipoHorarioDTO, NewScheduleData } from '@/app/horarios/asignados/registrar/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `Error en la solicitud: ${response.status}`);
    }
    // Si el body está vacío, devolvemos un objeto vacío para evitar errores en el parseo
    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  } catch (error: any) {
    throw new Error(error.message || 'Error de conexión con el servidor.');
  }
}

// Empleados
export const searchEmployees = async (query: string): Promise<EmpleadoSimpleDTO[]> => {
  if (!query) return [];
  const employees = await apiFetch<any[]>(`/empleados/search?query=${encodeURIComponent(query)}`);
  
  // Mapeamos explícitamente para asegurar que los campos existan en el objeto del frontend
  return employees.map(emp => ({
    id: emp.id,
    nombreCompleto: emp.nombreCompleto,
    rfc: emp.rfc,
    curp: emp.curp,
  }));
};

// Plantillas de Horario
export const getHorarioTemplates = (): Promise<HorarioTemplateDTO[]> => {
  return apiFetch('/horarios');
};

export const createHorarioTemplate = (data: NewScheduleData): Promise<HorarioTemplateDTO> => {
    // El backend espera el formato correcto, transformamos los detalles
    const transformedDetails = data.detalles.map(d => ({
        ...d,
        // El backend podría esperar un formato específico de hora, ej: "13:00:00"
        horaEntrada: `${d.horaEntrada}:00`,
        horaSalida: `${d.horaSalida}:00`,
    }));

    return apiFetch('/horarios', {
        method: 'POST',
        body: JSON.stringify({ ...data, detalles: transformedDetails }),
    });
};


// Tipos de Horario
export const getScheduleTypes = (): Promise<TipoHorarioDTO[]> => {
  return apiFetch('/tipos-horario');
};

// Asignaciones de Horario
interface HorarioAsignadoCreateDto {
  empleadoId: number;
  horarioId: number;
  tipoHorarioId: number;
  fechaInicio: string; // "yyyy-MM-dd"
  fechaFin: string | null; // "yyyy-MM-dd" o null
}

export const createHorarioAsignado = (data: HorarioAsignadoCreateDto): Promise<any> => {
  return apiFetch('/horarios-asignados', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

interface OverlapCheckParams {
    empleadoId: number;
    fechaInicio: string;
    fechaFin: string | null;
    horarioId?: number; // Para plantillas existentes
    detalles?: any[]; // Para nuevas plantillas
}

export const checkOverlap = (params: OverlapCheckParams): Promise<{ hasOverlap: boolean; message?: string }> => {
    const queryParams = new URLSearchParams({
        empleadoId: params.empleadoId.toString(),
        fechaInicio: params.fechaInicio,
    });
    if(params.fechaFin) queryParams.append('fechaFin', params.fechaFin);
    if(params.horarioId) queryParams.append('horarioId', params.horarioId.toString());

    const endpoint = `/horarios-asignados/verificar-traslape?${queryParams.toString()}`;

    if (params.detalles) {
         return apiFetch(endpoint, {
            method: 'POST', // Usamos POST si enviamos los detalles en el body
            body: JSON.stringify(params.detalles),
        });
    } else {
        return apiFetch(endpoint);
    }
}; 