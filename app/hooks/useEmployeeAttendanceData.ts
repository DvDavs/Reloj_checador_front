import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  EmpleadoDto,
  JornadaEstadoDto,
  WorkSession,
  SessionStatus
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

  const fetchEstadoJornadas = useCallback(async (employeeId: number) => {
    console.log(`useEAData: fetchEstadoJornadas para employeeId: ${employeeId}`);

    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get<JornadaEstadoDto[]>(
        `${apiBaseUrl}/api/asistencias/estado-diario/${employeeId}/${today}`
        
      );
      console.log(`useEAData: Respuesta de estado-diario:`, response.data); // <-- MUY IMPORTANTE

      setJornadasDelDia(response.data);
      
      const mappedSessions: WorkSession[] = response.data.map((jornada: JornadaEstadoDto) => {
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
          default: entryStatus = "pendiente"; exitStatus = "pendiente";
        }
        
        const isCurrent = jornada.estatusJornada === "EN_CURSO" || jornada.estatusJornada === "RETARDO";
        return {
          id: jornada.horarioAsignadoId,
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
      
      setWorkSessions(mappedSessions);
      setErrorLoadingData(null);
    } catch (error: any) {
      console.error("useEAData: Error al cargar estado de jornadas:", error); // <-- VERIFICA ESTO
      setErrorLoadingData(`Error cargando jornadas: ${error.message || "Error desconocido"}`);
      setJornadasDelDia([]);
      setWorkSessions([]);
    }
  }, [apiBaseUrl]);

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

  useEffect(() => {
    let newAction: "entrada" | "salida" = "entrada";
    let newActiveSessionId: number | null = null;

    if (jornadasDelDia.length === 0 || !currentEmployee?.id) {
      newActiveSessionId = null;
      newAction = "entrada";
    } else {
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
            newActiveSessionId = null;
            newAction = "entrada";
          }
        }
      }
    }
    
    setActiveSessionId(newActiveSessionId);
    setNextRecommendedAction(newAction);
  }, [jornadasDelDia, currentEmployee]);

  useEffect(() => {
    if (employeeIdToFetch) {
      fetchEmployeeDetails(employeeIdToFetch);
    } else {
      // Reset states when no employee is selected
      setCurrentEmployee(null);
      setCurrentEmployeeData(null);
      setJornadasDelDia([]);
      setWorkSessions([]);
      setActiveSessionId(null);
      setNextRecommendedAction("entrada");
      setErrorLoadingData(null);
    }
  }, [employeeIdToFetch, fetchEmployeeDetails]);

  return {
    currentEmployee,
    currentEmployeeData,
    jornadasDelDia,
    workSessions,
    activeSessionId,
    nextRecommendedAction,
    isLoading,
    errorLoadingData
  };
};

export default useEmployeeAttendanceData; 