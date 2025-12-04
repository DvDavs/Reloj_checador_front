import { useState, useEffect, useCallback } from 'react';
import { apiClient, getBaseUrl } from '@/lib/apiClient';
import {
  EmpleadoDto,
  JornadaEstadoDto,
  FullAttendanceStateEvent,
} from '../lib/types/timeClockTypes';

interface UseEmployeeAttendanceDataProps {
  employeeIdToFetch: number | null;
  apiBaseUrl?: string;
}

interface UseEmployeeAttendanceDataReturn {
  currentEmployee: {
    id: string;
    name: string;
    totalHours?: string;
    weeklyHours?: string;
  } | null;
  currentEmployeeData: EmpleadoDto | null;
  jornadasDelDia: JornadaEstadoDto[];
  activeSessionId: number | null;
  nextRecommendedAction: FullAttendanceStateEvent['nextRecommendedActionBackend'];
  isLoading: boolean;
  errorLoadingData: string | null;
  updateFromFullAttendanceEvent: (event: FullAttendanceStateEvent) => void;
}

const useEmployeeAttendanceData = ({
  employeeIdToFetch,
  apiBaseUrl = getBaseUrl(),
}: UseEmployeeAttendanceDataProps): UseEmployeeAttendanceDataReturn => {
  const [currentEmployee, setCurrentEmployee] = useState<{
    id: string;
    name: string;
    totalHours?: string;
    weeklyHours?: string;
  } | null>(null);
  const [currentEmployeeData, setCurrentEmployeeData] =
    useState<EmpleadoDto | null>(null);
  const [jornadasDelDia, setJornadasDelDia] = useState<JornadaEstadoDto[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [nextRecommendedAction, setNextRecommendedAction] =
    useState<FullAttendanceStateEvent['nextRecommendedActionBackend']>(
      'entrada'
    );
  const [isLoading, setIsLoading] = useState(false);
  const [errorLoadingData, setErrorLoadingData] = useState<string | null>(null);

  const [updatedFromStompEvent, setUpdatedFromStompEvent] = useState(false);

  const fetchEstadoJornadas = useCallback(
    async (employeeId: number) => {
      console.log(
        `useEAData: fetchEstadoJornadas para employeeId: ${employeeId}`
      );

      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await apiClient.get<JornadaEstadoDto[]>(
          `${apiBaseUrl}/api/asistencias/estado-diario/${employeeId}/${today}`
        );
        console.log(`useEAData: Respuesta de estado-diario:`, {
          count: response.data.length,
          primera:
            response.data.length > 0
              ? {
                  turno: response.data[0].turno,
                  estatus: response.data[0].estatusJornada,
                  entrada: response.data[0].horaEntradaProgramada,
                }
              : 'N/A',
        });

        setJornadasDelDia(response.data);

        setErrorLoadingData(null);
      } catch (error: any) {
        console.error('useEAData: Error al cargar estado de jornadas:', error);

        let errorMessage = 'Error cargando jornadas: ';
        if (error.response) {
          errorMessage += `Error ${error.response.status}: ${error.response.data?.mensaje || error.message}`;
        } else if (error.request) {
          errorMessage += 'No se pudo conectar con el servidor';
        } else {
          errorMessage += error.message || 'Error desconocido';
        }

        setErrorLoadingData(errorMessage);
        setJornadasDelDia([]);
      }
    },
    [apiBaseUrl]
  );

  const fetchEmployeeDetails = useCallback(
    async (employeeId: number) => {
      console.log(
        `useEAData: Iniciando carga de detalles para empleado ID: ${employeeId}`
      );
      try {
        setIsLoading(true);
        setErrorLoadingData(null);

        const response = await apiClient.get<EmpleadoDto>(
          `${apiBaseUrl}/api/empleados/${employeeId}`
        );
        const employeeData = response.data;

        if (!employeeData || !employeeData.id) {
          throw new Error('El servidor no devolvió datos válidos del empleado');
        }

        setCurrentEmployeeData(employeeData);
        console.log(`useEAData: Datos del empleado obtenidos correctamente`, {
          id: employeeData.id,
          nombre: employeeData.nombreCompleto,
          rfc: employeeData.rfc,
        });

        setCurrentEmployee({
          id: employeeData.id.toString(),
          name: employeeData.nombreCompleto,
        });

        await fetchEstadoJornadas(employeeId);
        console.log(
          `useEAData: Carga inicial completa para empleado ID: ${employeeId}`
        );

        setErrorLoadingData(null);
      } catch (error: any) {
        console.error('Error al cargar detalles del empleado:', error);

        let errorMessage = 'Error cargando empleado: ';
        if (error.response) {
          errorMessage += `Error ${error.response.status}: ${error.response.data?.mensaje || error.message}`;
        } else if (error.request) {
          errorMessage += 'No se pudo conectar con el servidor';
        } else {
          errorMessage += error.message || 'Error desconocido';
        }

        setErrorLoadingData(errorMessage);

        setCurrentEmployeeData(null);
        setCurrentEmployee(null);
        setJornadasDelDia([]);
        setActiveSessionId(null);
        setNextRecommendedAction('entrada');
      } finally {
        setIsLoading(false);
      }
    },
    [apiBaseUrl, fetchEstadoJornadas]
  );

  const updateFromFullAttendanceEvent = useCallback(
    (event: FullAttendanceStateEvent) => {
      console.log(
        'useEAData: Actualizando desde evento FullAttendanceStateUpdate',
        {
          employeeId: event.employeeData.id,
          name: event.employeeData.nombreCompleto,
          nextAction: event.nextRecommendedActionBackend,
          activeSession: event.activeSessionIdBackend,
          jornadas: event.dailyWorkSessions.length,
        }
      );

      setCurrentEmployeeData(event.employeeData);
      setCurrentEmployee({
        id: event.employeeData.id.toString(),
        name: event.employeeData.nombreCompleto,
      });

      setJornadasDelDia(event.dailyWorkSessions);

      if (event.nextRecommendedActionBackend) {
        setNextRecommendedAction(event.nextRecommendedActionBackend);
        console.log(
          `useEAData: nextRecommendedAction establecido desde backend a: ${event.nextRecommendedActionBackend}`
        );
      }

      setActiveSessionId(event.activeSessionIdBackend);
      console.log(
        `useEAData: activeSessionId establecido explícitamente desde el backend a: ${event.activeSessionIdBackend}`
      );

      setErrorLoadingData(null);

      setUpdatedFromStompEvent(true);

      console.log('useEAData: Actualización desde evento completada con éxito');
    },
    []
  );

  useEffect(() => {
    if (updatedFromStompEvent) {
      setUpdatedFromStompEvent(false);
      return;
    }

    if (jornadasDelDia.length === 0 || !currentEmployee?.id) {
      if (activeSessionId !== null) {
        console.log(
          `useEAData: Sesión activa reseteada a null (no hay jornadas o empleado)`
        );
        setActiveSessionId(null);
      }
      if (nextRecommendedAction !== 'NO_ACTION') {
        console.log(
          `useEAData: Acción recomendada reseteada a NO_ACTION (no hay jornadas o empleado)`
        );
        setNextRecommendedAction('NO_ACTION');
      }
      return;
    }

    console.log(
      'useEAData: Calculando activeSession/nextAction localmente (no STOMP o carga inicial)'
    );

    let newAction: FullAttendanceStateEvent['nextRecommendedActionBackend'] =
      'entrada';
    let newActiveSessionId: number | null = null;

    // ========== PRIORITY 1: RECENTLY COMPLETED SESSION ==========
    // Look for sessions completed very recently (last 5 minutes)
    // This helps to show the session that the user just completed
    // instead of immediately jumping to the next pending one
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const jornadaRecienCompletada = jornadasDelDia.find((jornada) => {
      if (jornada.estatusJornada !== 'COMPLETADA') return false;
      if (!jornada.horaSalidaReal) return false;

      try {
        // Parsear horaSalidaReal asumiendo formato "HH:mm" y fecha de hoy
        const [hours, minutes] = jornada.horaSalidaReal.split(':').map(Number);
        const salidaDateTime = new Date();
        salidaDateTime.setHours(hours, minutes, 0, 0);

        // Verificar si la salida fue registrada en los últimos 5 minutos
        return salidaDateTime >= fiveMinutesAgo;
      } catch (error) {
        console.warn(
          'Error parseando horaSalidaReal:',
          jornada.horaSalidaReal,
          error
        );
        return false;
      }
    });

    if (jornadaRecienCompletada) {
      newActiveSessionId = jornadaRecienCompletada.detalleHorarioId;
      newAction = 'ALL_COMPLETE'; // Show that the session was completed
    } else {
      // ========== PRIORITY 2: SESSION IN PROGRESS ==========
      const jornadaEnCurso = jornadasDelDia.find(
        (jornada) =>
          jornada.estatusJornada === 'EN_CURSO' ||
          jornada.estatusJornada === 'RETARDO'
      );

      if (jornadaEnCurso) {
        newActiveSessionId = jornadaEnCurso.detalleHorarioId;
        newAction = 'salida';
      } else {
        // ========== PRIORITY 3: CHRONOLOGICALLY CLOSEST SESSION ==========
        const jornadasPendientes = jornadasDelDia
          .filter(
            (jornada) =>
              jornada.estatusJornada === 'PENDIENTE' &&
              jornada.horaEntradaReal === null
          )
          .sort((a, b) =>
            a.horaEntradaProgramada.localeCompare(b.horaEntradaProgramada)
          );

        if (jornadasPendientes.length > 0) {
          newActiveSessionId = jornadasPendientes[0].detalleHorarioId;
          newAction = 'entrada';
        } else {
          const todasCompletas = jornadasDelDia.every(
            (j) => j.estatusJornada === 'COMPLETADA'
          );
          if (todasCompletas) {
            console.log('useEAData: Todas las jornadas completadas');
            newActiveSessionId = null;
            newAction = 'ALL_COMPLETE';
          } else {
            const primeraNoCompletada = jornadasDelDia.find(
              (j) => j.estatusJornada !== 'COMPLETADA'
            );
            if (primeraNoCompletada) {
              console.log(
                `useEAData: Fallback - Primera jornada no completada: ID ${primeraNoCompletada.detalleHorarioId}`
              );
              newActiveSessionId = primeraNoCompletada.detalleHorarioId;
              newAction =
                primeraNoCompletada.horaEntradaReal === null
                  ? 'entrada'
                  : 'salida';
            } else {
              console.log('useEAData: No hay jornadas válidas disponibles');
              newActiveSessionId = null;
              newAction = 'NO_ACTION';
            }
          }
        }
      }
    }

    if (activeSessionId !== newActiveSessionId) {
      console.log(
        `useEAData: Sesión activa inicializada localmente a: ${newActiveSessionId}`
      );
      setActiveSessionId(newActiveSessionId);
    }

    if (nextRecommendedAction !== newAction) {
      console.log(
        `useEAData: Acción recomendada inicializada localmente a: ${newAction}`
      );
      setNextRecommendedAction(newAction);
    }
  }, [
    jornadasDelDia,
    currentEmployee,
    updatedFromStompEvent,
    activeSessionId,
    nextRecommendedAction,
  ]);

  useEffect(() => {
    if (
      employeeIdToFetch &&
      (!currentEmployeeData || currentEmployeeData.id !== employeeIdToFetch) &&
      !updatedFromStompEvent
    ) {
      console.log(
        `useEAData: Cargando datos iniciales para empleado ${employeeIdToFetch}`
      );

      const debounceTimer = setTimeout(() => {
        if (employeeIdToFetch && !updatedFromStompEvent) {
          fetchEmployeeDetails(employeeIdToFetch);
        }
      }, 300);

      return () => {
        clearTimeout(debounceTimer);
      };
    } else if (!employeeIdToFetch) {
      setCurrentEmployee(null);
      setCurrentEmployeeData(null);
      setJornadasDelDia([]);
      setActiveSessionId(null);
      setNextRecommendedAction('entrada');
      setErrorLoadingData(null);
      setUpdatedFromStompEvent(false);
    }
  }, [
    employeeIdToFetch,
    fetchEmployeeDetails,
    currentEmployeeData,
    updatedFromStompEvent,
  ]);

  return {
    currentEmployee,
    currentEmployeeData,
    jornadasDelDia,
    activeSessionId,
    nextRecommendedAction,
    isLoading,
    errorLoadingData,
    updateFromFullAttendanceEvent,
  };
};

export default useEmployeeAttendanceData;
