import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
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
  nextRecommendedAction: 'entrada' | 'salida';
  isLoading: boolean;
  errorLoadingData: string | null;
  updateFromFullAttendanceEvent: (event: FullAttendanceStateEvent) => void;
}

const useEmployeeAttendanceData = ({
  employeeIdToFetch,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
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
  const [nextRecommendedAction, setNextRecommendedAction] = useState<
    'entrada' | 'salida'
  >('entrada');
  const [isLoading, setIsLoading] = useState(false);
  const [errorLoadingData, setErrorLoadingData] = useState<string | null>(null);
  // Flag para rastrear si los datos vienen de un evento FullAttendanceStateEvent
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

        // Actualizar el estado con las jornadas recibidas
        setJornadasDelDia(response.data);

        // Nota: El cálculo de activeSessionId y nextRecommendedAction ahora lo hace el useEffect,
        // para mantener una sola fuente de verdad para esta lógica.

        setErrorLoadingData(null);
      } catch (error: any) {
        console.error('useEAData: Error al cargar estado de jornadas:', error);

        // Mejorar el mensaje de error con detalles específicos
        let errorMessage = 'Error cargando jornadas: ';
        if (error.response) {
          // Error de respuesta del servidor
          errorMessage += `Error ${error.response.status}: ${error.response.data?.mensaje || error.message}`;
        } else if (error.request) {
          // Error de red (no se recibió respuesta)
          errorMessage += 'No se pudo conectar con el servidor';
        } else {
          // Error en la configuración de la petición
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
        setErrorLoadingData(null); // Limpiar errores previos

        // PASO 1: Cargar datos del empleado
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

        // Actualizar currentEmployee con los datos básicos del empleado cargado
        setCurrentEmployee({
          id: employeeData.id.toString(),
          name: employeeData.nombreCompleto,
          // weeklyHours y totalHours podrían calcularse si recibimos estos datos
        });

        // PASO 2: Cargar jornadas del día para este empleado
        await fetchEstadoJornadas(employeeId);
        console.log(
          `useEAData: Carga inicial completa para empleado ID: ${employeeId}`
        );

        // Limpiar errores si todo fue exitoso
        setErrorLoadingData(null);
      } catch (error: any) {
        console.error('Error al cargar detalles del empleado:', error);

        // Mejorar el mensaje de error con detalles específicos
        let errorMessage = 'Error cargando empleado: ';
        if (error.response) {
          // Error de respuesta del servidor
          errorMessage += `Error ${error.response.status}: ${error.response.data?.mensaje || error.message}`;
        } else if (error.request) {
          // Error de red (no se recibió respuesta)
          errorMessage += 'No se pudo conectar con el servidor';
        } else {
          // Error en la configuración de la petición
          errorMessage += error.message || 'Error desconocido';
        }

        setErrorLoadingData(errorMessage);

        // Limpiar todos los estados relacionados con el empleado en caso de error
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

      // PASO 1: Actualizar la información del empleado
      setCurrentEmployeeData(event.employeeData);
      setCurrentEmployee({
        id: event.employeeData.id.toString(),
        name: event.employeeData.nombreCompleto,
      });

      // PASO 2: Actualizar las jornadas del día
      setJornadasDelDia(event.dailyWorkSessions);

      // PASO 3: VALORES AUTORITATIVOS DEL BACKEND - MÁXIMA PRIORIDAD

      // Actualizar la acción recomendada desde el backend
      if (event.nextRecommendedActionBackend) {
        if (
          event.nextRecommendedActionBackend === 'entrada' ||
          event.nextRecommendedActionBackend === 'salida'
        ) {
          setNextRecommendedAction(event.nextRecommendedActionBackend);
          console.log(
            `useEAData: nextRecommendedAction establecido explícitamente desde el backend a: ${event.nextRecommendedActionBackend}`
          );
        } else if (
          event.nextRecommendedActionBackend === 'ALL_COMPLETE' ||
          event.nextRecommendedActionBackend === 'NO_ACTION'
        ) {
          // Para "ALL_COMPLETE" o "NO_ACTION", configurar entrada como valor predeterminado
          // (por contingencia o para tener un valor válido en la UI)
          setNextRecommendedAction('entrada');
          console.log(
            `useEAData: nextRecommendedAction establecido a entrada (default) porque el backend indicó: ${event.nextRecommendedActionBackend}`
          );
        }
      }

      // Actualizar el ID de sesión activa desde el backend
      setActiveSessionId(event.activeSessionIdBackend);
      console.log(
        `useEAData: activeSessionId establecido explícitamente desde el backend a: ${event.activeSessionIdBackend}`
      );

      // PASO 4: Limpiar errores y marcar actualización desde STOMP
      setErrorLoadingData(null);

      // Esta bandera evita que el useEffect local recalcule estos valores,
      // ya que fueron explícitamente proporcionados por el backend (fuente autoritativa)
      setUpdatedFromStompEvent(true);

      console.log('useEAData: Actualización desde evento completada con éxito');
    },
    []
  );

  // SIMPLIFICADO: Este useEffect ahora solo calcula valores iniciales cuando no hay datos de backend
  useEffect(() => {
    // Si los datos acaban de ser actualizados por un evento STOMP,
    // los valores de activeSessionId y nextRecommendedAction del backend ya fueron establecidos.
    // No necesitamos recalcularlos localmente.
    // Reseteamos el flag para la próxima vez que cambien las jornadas por otra razón (ej. API REST inicial).
    if (updatedFromStompEvent) {
      setUpdatedFromStompEvent(false); // Resetear el flag después de procesar el evento STOMP
      return;
    }

    // Si no hay jornadas o no hay empleado, establecer valores por defecto y salir.
    if (jornadasDelDia.length === 0 || !currentEmployee?.id) {
      if (activeSessionId !== null) {
        console.log(
          `useEAData: Sesión activa reseteada a null (no hay jornadas o empleado)`
        );
        setActiveSessionId(null);
      }
      if (nextRecommendedAction !== 'entrada') {
        console.log(
          `useEAData: Acción recomendada reseteada a entrada (no hay jornadas o empleado)`
        );
        setNextRecommendedAction('entrada');
      }
      return;
    }

    // En este punto, no venimos de un evento STOMP y hay jornadas/empleado.
    // Esta lógica es para la carga inicial vía API REST o si el STOMP no proveyera estos datos.
    // (Pero el plan es que FullAttendanceStateEvent sí los provea)
    console.log(
      'useEAData: Calculando activeSession/nextAction localmente (no STOMP o carga inicial)'
    );

    let newAction: 'entrada' | 'salida' = 'entrada'; // Default
    let newActiveSessionId: number | null = null; // Default

    const jornadaEnCurso = jornadasDelDia.find(
      (jornada) =>
        jornada.estatusJornada === 'EN_CURSO' ||
        jornada.estatusJornada === 'RETARDO'
    );

    if (jornadaEnCurso) {
      newActiveSessionId = jornadaEnCurso.detalleHorarioId;
      newAction = 'salida';
    } else {
      const jornadasPendientes = jornadasDelDia
        .filter(
          (jornada) =>
            jornada.estatusJornada === 'PENDIENTE' &&
            jornada.horaEntradaReal === null
        ) // Más explícito
        .sort((a, b) =>
          a.horaEntradaProgramada.localeCompare(b.horaEntradaProgramada)
        );

      if (jornadasPendientes.length > 0) {
        newActiveSessionId = jornadasPendientes[0].detalleHorarioId;
        newAction = 'entrada';
      } else {
        // Si no hay pendientes ni en curso, verificar si todas están completas
        const todasCompletas = jornadasDelDia.every(
          (j) => j.estatusJornada === 'COMPLETADA'
        );
        if (todasCompletas) {
          newActiveSessionId = null; // No hay sesión activa
          // Podrías tener un tipo "ALL_COMPLETE" para nextRecommendedAction
          // newAction = "ALL_COMPLETE"; // Si tuvieras este tipo
          newAction = 'entrada'; // O un default
        } else {
          // Podría haber jornadas AUSENTE_ENTRADA aquí, el backend decidirá mejor.
          // Como fallback, intentamos la primera jornada que no esté COMPLETA.
          const primeraNoCompletada = jornadasDelDia.find(
            (j) => j.estatusJornada !== 'COMPLETADA'
          );
          if (primeraNoCompletada) {
            newActiveSessionId = primeraNoCompletada.detalleHorarioId;
            newAction =
              primeraNoCompletada.horaEntradaReal === null
                ? 'entrada'
                : 'salida';
          } else {
            newActiveSessionId = null;
            newAction = 'entrada'; // Fallback final
          }
        }
      }
    }

    // Solo actualizar los valores si son diferentes a los actuales
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
    // Solo cargar datos si hay un ID y no se han actualizado ya desde un evento STOMP
    // o si el ID cambió (nuevo empleado)
    if (
      employeeIdToFetch &&
      (!currentEmployeeData || currentEmployeeData.id !== employeeIdToFetch) &&
      !updatedFromStompEvent
    ) {
      console.log(
        `useEAData: Cargando datos iniciales para empleado ${employeeIdToFetch}`
      );

      // Usar un timeout como forma simple de debounce para evitar múltiples llamadas API
      const debounceTimer = setTimeout(() => {
        // Verificar nuevamente las condiciones en caso de que hayan cambiado durante el debounce
        if (employeeIdToFetch && !updatedFromStompEvent) {
          fetchEmployeeDetails(employeeIdToFetch);
        }
      }, 300);

      return () => {
        clearTimeout(debounceTimer);
      };
    } else if (!employeeIdToFetch) {
      // Reset states when no employee is selected
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

  // Exportamos todos los datos y funciones necesarias
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
