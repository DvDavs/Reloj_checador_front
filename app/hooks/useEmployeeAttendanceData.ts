import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  EmpleadoDto,
  JornadaEstadoDto,
  WorkSession,
  SessionStatus,
  FullAttendanceStateEvent
} from '../lib/types/timeClockTypes';

interface UseEmployeeAttendanceDataProps {
  employeeIdToFetch: number | null;
  apiBaseUrl?: string;
}

interface UseEmployeeAttendanceDataReturn {
  currentEmployee: { id: string; name: string; totalHours?: string; weeklyHours?: string } | null;
  currentEmployeeData: EmpleadoDto | null;
  jornadasDelDia: JornadaEstadoDto[];
  workSessions: WorkSession[];
  activeSessionId: number | null;
  nextRecommendedAction: "entrada" | "salida";
  isLoading: boolean;
  errorLoadingData: string | null;
  updateFromFullAttendanceEvent: (event: FullAttendanceStateEvent) => void;
}

const useEmployeeAttendanceData = ({
  employeeIdToFetch,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
}: UseEmployeeAttendanceDataProps): UseEmployeeAttendanceDataReturn => {
  const [currentEmployee, setCurrentEmployee] = useState<{ id: string; name: string; totalHours?: string; weeklyHours?: string } | null>(null);
  const [currentEmployeeData, setCurrentEmployeeData] = useState<EmpleadoDto | null>(null);
  const [jornadasDelDia, setJornadasDelDia] = useState<JornadaEstadoDto[]>([]);
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [nextRecommendedAction, setNextRecommendedAction] = useState<"entrada" | "salida">("entrada");
  const [isLoading, setIsLoading] = useState(false);
  const [errorLoadingData, setErrorLoadingData] = useState<string | null>(null);
  // Flag para rastrear si los datos vienen de un evento FullAttendanceStateEvent
  const [updatedFromStompEvent, setUpdatedFromStompEvent] = useState(false);

  const mapJornadasToWorkSessions = useCallback((jornadas: JornadaEstadoDto[], employeeId: number): WorkSession[] => {
    console.log(`useEAData: Mapeando ${jornadas.length} jornadas a WorkSessions`);
    
    // NOTA: Esta función de mapeo podría eliminarse en una refactorización futura.
    // Si los componentes de UI se actualizan para usar directamente JornadaEstadoDto
    // en lugar de WorkSession, esta capa de transformación sería innecesaria.
    return jornadas.map((jornada: JornadaEstadoDto) => {
      const entryTime = jornada.horaEntradaReal ? 
        jornada.horaEntradaReal.split(' ')[1].substring(0, 5) : null;
      const exitTime = jornada.horaSalidaReal ? 
        jornada.horaSalidaReal.split(' ')[1].substring(0, 5) : null;
      const scheduledEntry = jornada.horaEntradaProgramada.substring(0, 5);
      const scheduledExit = jornada.horaSalidaProgramada.substring(0, 5);
      let entryStatus: SessionStatus = "pendiente";
      let exitStatus: SessionStatus = "pendiente";
      
      switch (jornada.estatusJornada) {
        case "PENDIENTE": entryStatus = "pendiente"; exitStatus = "pendiente"; break;
        case "EN_CURSO": entryStatus = "entrada-ok"; exitStatus = "pendiente"; break;
        case "COMPLETADA": entryStatus = "entrada-ok"; exitStatus = "salida-ok"; break;
        case "RETARDO": entryStatus = "entrada-tarde"; exitStatus = "pendiente"; break;
        case "AUSENTE_ENTRADA": entryStatus = "ausente"; exitStatus = "ausente"; break;
        case "AUSENTE_SALIDA": entryStatus = "entrada-ok"; exitStatus = "ausente"; break;
        case "AUSENTE": entryStatus = "ausente"; exitStatus = "ausente"; break;
        default: entryStatus = "pendiente"; exitStatus = "pendiente";
      }
      
      const isCurrent = jornada.estatusJornada === "EN_CURSO" || jornada.estatusJornada === "RETARDO";
      return {
        id: jornada.detalleHorarioId,
        entryTime,
        exitTime,
        scheduledEntry,
        scheduledExit,
        entryStatus,
        exitStatus,
        isCurrent,
        employeeId: employeeId.toString()
      };
    });
  }, []);

  const fetchEstadoJornadas = useCallback(async (employeeId: number) => {
    console.log(`useEAData: fetchEstadoJornadas para employeeId: ${employeeId}`);

    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get<JornadaEstadoDto[]>(
        `${apiBaseUrl}/api/asistencias/estado-diario/${employeeId}/${today}`
        
      );
      console.log(`useEAData: Respuesta de estado-diario:`, response.data);

      setJornadasDelDia(response.data);
      
      const mappedSessions = mapJornadasToWorkSessions(response.data, employeeId);
      setWorkSessions(mappedSessions);
      setErrorLoadingData(null);
    } catch (error: any) {
      console.error("useEAData: Error al cargar estado de jornadas:", error);
      setErrorLoadingData(`Error cargando jornadas: ${error.message || "Error desconocido"}`);
      setJornadasDelDia([]);
      setWorkSessions([]);
    }
  }, [apiBaseUrl, mapJornadasToWorkSessions]);

  const fetchEmployeeDetails = useCallback(async (employeeId: number) => {
    try {
      setIsLoading(true);
      setErrorLoadingData(null); // Limpiar errores previos
      const response = await axios.get<EmpleadoDto>(`${apiBaseUrl}/api/empleados/${employeeId}`);
      const employeeData = response.data;
      setCurrentEmployeeData(employeeData);

      // Actualizar currentEmployee con los datos básicos del empleado cargado
      if (employeeData) {
        setCurrentEmployee({
          id: employeeData.id.toString(),
          name: employeeData.nombreCompleto,
          // Puedes calcular totalHours o weeklyHours aquí si lo necesitas
        });
        console.log(`useEmployeeAttendanceData: currentEmployee set to:`, { id: employeeData.id.toString(), name: employeeData.nombreCompleto });
      } else {
        setCurrentEmployee(null); // Si no hay datos, limpiar
      }

      await fetchEstadoJornadas(employeeId);
      setErrorLoadingData(null);
    } catch (error: any) {
      console.error("Error al cargar detalles del empleado:", error);
      setErrorLoadingData(`Error cargando empleado: ${error.message || "Error desconocido"}`);
      setCurrentEmployeeData(null); // Limpiar en caso de error
      setCurrentEmployee(null);   // Limpiar en caso de error
      setJornadasDelDia([]);      // Limpiar jornadas en caso de error
      setWorkSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, fetchEstadoJornadas]);

  const updateFromFullAttendanceEvent = useCallback((event: FullAttendanceStateEvent) => {
    console.log("useEAData: Actualizando desde evento FullAttendanceStateUpdate", {
      employeeId: event.employeeData.id,
      name: event.employeeData.nombreCompleto,
      nextAction: event.nextRecommendedActionBackend,
      activeSession: event.activeSessionIdBackend
    });
    
    // Actualizar la información del empleado
    setCurrentEmployeeData(event.employeeData);
    setCurrentEmployee({
      id: event.employeeData.id.toString(),
      name: event.employeeData.nombreCompleto
    });
    
    // Actualizar las jornadas del día
    setJornadasDelDia(event.dailyWorkSessions);
    
    // Convertir jornadas a formato WorkSession
    const mappedSessions = mapJornadasToWorkSessions(
      event.dailyWorkSessions, 
      event.employeeData.id
    );
    setWorkSessions(mappedSessions);
    
    // IMPORTANTE: Los valores del backend tienen MÁXIMA PRECEDENCIA
    
    // Actualizar la acción recomendada desde el backend
    if (event.nextRecommendedActionBackend) {
      if (event.nextRecommendedActionBackend === "entrada" || event.nextRecommendedActionBackend === "salida") {
        setNextRecommendedAction(event.nextRecommendedActionBackend);
        console.log(`useEAData: nextRecommendedAction establecido explícitamente desde el backend a: ${event.nextRecommendedActionBackend}`);
      } else if (event.nextRecommendedActionBackend === "ALL_COMPLETE" || event.nextRecommendedActionBackend === "NO_ACTION") {
        // Para "ALL_COMPLETE" o "NO_ACTION", configurar entrada como valor predeterminado 
        // (por contingencia o para tener un valor válido en la UI)
        setNextRecommendedAction("entrada");
        console.log(`useEAData: nextRecommendedAction establecido a entrada (default) porque el backend indicó: ${event.nextRecommendedActionBackend}`);
      }
    }
    
    // Actualizar el ID de sesión activa desde el backend
    setActiveSessionId(event.activeSessionIdBackend);
    console.log(`useEAData: activeSessionId establecido explícitamente desde el backend a: ${event.activeSessionIdBackend}`);
    
    setErrorLoadingData(null);
    // Marcar que los datos se actualizaron desde un evento STOMP
    setUpdatedFromStompEvent(true);
    
    console.log("useEAData: Actualización desde evento completada");
  }, [mapJornadasToWorkSessions]);

  // SIMPLIFICADO: Este useEffect ahora solo calcula valores iniciales cuando no hay datos de backend
  useEffect(() => {
    // No calcular nada si:
    // 1. No hay jornadas o no hay empleado (nada que calcular)
    // 2. Los datos ya fueron actualizados por un evento STOMP (el backend ya proporcionó los valores)
    if (jornadasDelDia.length === 0 || !currentEmployee?.id || updatedFromStompEvent) {
      // Si no hay jornadas o empleado, asegurar valores por defecto
      if (jornadasDelDia.length === 0 || !currentEmployee?.id) {
        if (activeSessionId !== null) {
          console.log(`useEAData: Sesión activa reseteada a null (no hay jornadas o empleado)`);
          setActiveSessionId(null);
        }
        if (nextRecommendedAction !== "entrada") {
          console.log(`useEAData: Acción recomendada reseteada a entrada (no hay jornadas o empleado)`);
          setNextRecommendedAction("entrada");
        }
      }
      return;
    }
    
    // Cálculo local solo para inicialización cuando no hay datos del backend
    console.log(`useEAData: Calculando valores iniciales localmente (sin datos de backend)`);
    
    let newAction: "entrada" | "salida" = "entrada";
    let newActiveSessionId: number | null = null;
    
    const jornadaEnCurso = jornadasDelDia.find(
      (jornada) => jornada.estatusJornada === "EN_CURSO" || jornada.estatusJornada === "RETARDO"
    );

    if (jornadaEnCurso) {
      newActiveSessionId = jornadaEnCurso.detalleHorarioId;
      newAction = "salida";
    } else {
      const jornadasPendientes = jornadasDelDia
        .filter(jornada => jornada.estatusJornada === "PENDIENTE")
        .sort((a, b) => a.horaEntradaProgramada.localeCompare(b.horaEntradaProgramada));

      if (jornadasPendientes.length > 0) {
        newActiveSessionId = jornadasPendientes[0].detalleHorarioId;
        newAction = "entrada";
      } else {
        const jornadaAusente = jornadasDelDia.find(
          (jornada) => jornada.estatusJornada === "AUSENTE_ENTRADA" || jornada.estatusJornada === "AUSENTE"
        );

        if (jornadaAusente) {
          newActiveSessionId = jornadaAusente.detalleHorarioId;
          newAction = "entrada";
        } else {
          // Verificar si todas están completadas
          const todasCompletas = jornadasDelDia.every(j => j.estatusJornada === "COMPLETADA");
          if (todasCompletas) {
            // Si todas las jornadas están completadas, no hay sesión activa
            newActiveSessionId = null;
            // Mantener entrada como fallback, aunque ALL_COMPLETE sería lo ideal
            newAction = "entrada";
          } else {
            // Caso por defecto
            newActiveSessionId = null;
            newAction = "entrada";
          }
        }
      }
    }
    
    // Solo actualizar los valores si son diferentes a los actuales
    if (activeSessionId !== newActiveSessionId) {
      console.log(`useEAData: Sesión activa inicializada localmente a: ${newActiveSessionId}`);
      setActiveSessionId(newActiveSessionId);
    }
    
    if (nextRecommendedAction !== newAction) {
      console.log(`useEAData: Acción recomendada inicializada localmente a: ${newAction}`);
      setNextRecommendedAction(newAction);
    }
  }, [jornadasDelDia, currentEmployee, updatedFromStompEvent]); // Añadimos updatedFromStompEvent como dependencia

  useEffect(() => {
    // Solo cargar datos si hay un ID y no se han actualizado ya desde un evento STOMP
    // o si el ID cambió (nuevo empleado)
    if (employeeIdToFetch && 
        ((!currentEmployeeData || currentEmployeeData.id !== employeeIdToFetch) && 
         !updatedFromStompEvent)) {
      console.log(`useEAData: Cargando datos iniciales para empleado ${employeeIdToFetch}`);
      fetchEmployeeDetails(employeeIdToFetch);
    } else if (!employeeIdToFetch) {
      // Reset states when no employee is selected
      setCurrentEmployee(null);
      setCurrentEmployeeData(null);
      setJornadasDelDia([]);
      setWorkSessions([]);
      setActiveSessionId(null);
      setNextRecommendedAction("entrada");
      setErrorLoadingData(null);
      setUpdatedFromStompEvent(false);
    }
  }, [employeeIdToFetch, fetchEmployeeDetails, currentEmployeeData, updatedFromStompEvent]);

  return {
    currentEmployee,
    currentEmployeeData,
    jornadasDelDia,
    workSessions,
    activeSessionId,
    nextRecommendedAction,
    isLoading,
    errorLoadingData,
    updateFromFullAttendanceEvent
  };
};

export default useEmployeeAttendanceData; 