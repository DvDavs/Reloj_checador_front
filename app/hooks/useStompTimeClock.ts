import { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';
import { BackendChecadorEvent, FullAttendanceStateEvent, StompEventMessage } from '../lib/types/timeClockTypes';

interface UseStompTimeClockProps {
  initialReaderName: string;
  initialSessionId: string;
  onChecadorEvent: (event: BackendChecadorEvent | FullAttendanceStateEvent) => void;
  onConnectionError: (error: string | null) => void;
  onReadyStateChange: (isReady: boolean) => void;
  apiBaseUrl?: string;
}

interface UseStompTimeClockReturn {
  isConnected: boolean;
}

const useStompTimeClock = ({
  initialReaderName,
  initialSessionId,
  onChecadorEvent,
  onConnectionError,
  onReadyStateChange,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
}: UseStompTimeClockProps): UseStompTimeClockReturn => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const stompClientRef = useRef<Client | null>(null);
  const readerNameRef = useRef(initialReaderName);
  const sessionIdRef = useRef(initialSessionId);
  
  // Store the callback functions in refs to avoid dependency changes
  const onChecadorEventRef = useRef(onChecadorEvent);
  const onConnectionErrorRef = useRef(onConnectionError);
  const onReadyStateChangeRef = useRef(onReadyStateChange);
  const apiBaseUrlRef = useRef(apiBaseUrl);

  // Update refs when props change
  useEffect(() => {
    readerNameRef.current = initialReaderName;
    sessionIdRef.current = initialSessionId;
    onChecadorEventRef.current = onChecadorEvent;
    onConnectionErrorRef.current = onConnectionError;
    onReadyStateChangeRef.current = onReadyStateChange;
    apiBaseUrlRef.current = apiBaseUrl;
  }, [initialReaderName, initialSessionId, onChecadorEvent, onConnectionError, onReadyStateChange, apiBaseUrl]);

  const initiateReaderAndChecador = useCallback(async () => {
    if (!readerNameRef.current || !sessionIdRef.current) {
      console.warn("STOMP Hook: Reader o Session ID no disponibles para iniciar.");
      onConnectionErrorRef.current("Reader o Session ID no disponibles.");
      onReadyStateChangeRef.current(false);
      return;
    }
    console.log(`STOMP Hook: Iniciando proceso para lector ${readerNameRef.current} y sesión ${sessionIdRef.current}`);
    onReadyStateChangeRef.current(false);
    try {
      onConnectionErrorRef.current(null);
      await axios.post(
        `${apiBaseUrlRef.current}/api/v1/multi-fingerprint/reserve/${encodeURIComponent(readerNameRef.current)}`,
        null,
        { params: { sessionId: sessionIdRef.current } }
      );
      console.log(`STOMP Hook: Lector ${readerNameRef.current} reservado.`);

      await axios.post(
        `${apiBaseUrlRef.current}/api/v1/multi-fingerprint/checador/start/${encodeURIComponent(readerNameRef.current)}`,
        null,
        { params: { sessionId: sessionIdRef.current } }
      );
      console.log(`STOMP Hook: Checador iniciado para ${readerNameRef.current}.`);
      onReadyStateChangeRef.current(true);
    } catch (error: any) {
      console.error("STOMP Hook: Error al iniciar proceso de checador:", error);
      const errMsg = error.response?.data?.mensaje || error.message || "Error desconocido al iniciar checador";
      onConnectionErrorRef.current(`Error iniciando checador: ${errMsg}`);
      onReadyStateChangeRef.current(false);
      if (error.config.url.includes('/checador/start')) {
        console.warn("STOMP Hook: Intentando liberar lector debido a fallo en inicio de checador...");
        await stopAndReleaseReader();
      }
    }
  }, []);

  const stopAndReleaseReader = useCallback(async () => {
    if (!readerNameRef.current || !sessionIdRef.current) {
      console.warn("STOMP Hook: Reader o Session ID no disponibles para detener.");
      return;
    }
    console.log(`STOMP Hook: Deteniendo y liberando lector ${readerNameRef.current}`);
    onReadyStateChangeRef.current(false);
    try {
      await axios.post(
        `${apiBaseUrlRef.current}/api/v1/multi-fingerprint/checador/stop/${encodeURIComponent(readerNameRef.current)}`,
        null,
        { params: { sessionId: sessionIdRef.current } }
      );
      console.log(`STOMP Hook: Checador detenido para ${readerNameRef.current}.`);
    } catch (error) {
      console.warn("STOMP Hook: Advertencia al detener checador:", error);
    }
    try {
      await axios.post(
        `${apiBaseUrlRef.current}/api/v1/multi-fingerprint/release/${encodeURIComponent(readerNameRef.current)}`,
        null,
        { params: { sessionId: sessionIdRef.current } }
      );
      console.log(`STOMP Hook: Lector ${readerNameRef.current} liberado.`);
    } catch (error) {
      console.warn("STOMP Hook: Advertencia al liberar lector:", error);
    }
  }, []);

  useEffect(() => {
    console.log("STOMP Hook: useEffect EXECUTING. Deps changed or initial mount.", { 
      initialReaderName, 
      initialSessionId,
      isConnected: stompClientRef.current?.active
    });

    const currentReader = readerNameRef.current;
    const currentSession = sessionIdRef.current;

    if (!currentReader || !currentSession) {
      console.log("STOMP Hook: Reader o Session ID no disponibles, conexión WebSocket no iniciada.");
      if (stompClientRef.current?.active) {
        stompClientRef.current.deactivate();
      }
      setIsConnected(false);
      onReadyStateChangeRef.current(false);
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(`${apiBaseUrlRef.current}/ws-fingerprint`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: async () => {
        console.log(`STOMP Hook: Conectado a WebSocket para lector ${currentReader}`);
        setIsConnected(true);
        onConnectionErrorRef.current(null);

        await initiateReaderAndChecador();

        const topic = `/topic/checador/${encodeURIComponent(currentReader)}`;
        console.log(`STOMP Hook: Suscribiéndose a: ${topic}`);
        client.subscribe(topic, (message) => {
          try {
            const data = JSON.parse(message.body);
            
            // Función para verificar si el mensaje es un FullAttendanceStateEvent
            const isFullAttendanceEvent = (event: any): event is FullAttendanceStateEvent => 
              'type' in event && event.type === 'FULL_ATTENDANCE_STATE_UPDATE';
            
            if (isFullAttendanceEvent(data)) {
              // Es un FullAttendanceStateEvent
              console.log("STOMP Hook: Recibido evento FULL_ATTENDANCE_STATE_UPDATE:", {
                employeeId: data.employeeData?.id,
                name: data.employeeData?.nombreCompleto,
                nextAction: data.nextRecommendedActionBackend,
                activeSession: data.activeSessionIdBackend,
                sessionsCount: data.dailyWorkSessions?.length || 0
              });
            } else {
              // Es un BackendChecadorEvent
              const checadorEvent = data as BackendChecadorEvent;
              console.log("STOMP Hook: Recibido evento checador:", {
                empleadoId: checadorEvent.empleadoId,
                identificado: checadorEvent.identificado,
                accion: checadorEvent.accion,
                statusCode: checadorEvent.statusCode,
                statusType: checadorEvent.statusType
              });
            }
            
            // Pasar el evento a la función de manejo
            onChecadorEventRef.current(data);
          } catch (error) {
            console.error("STOMP Hook: Error al parsear mensaje JSON:", error);
            console.error("STOMP Hook: Mensaje original:", message.body);
            onConnectionErrorRef.current("Error al procesar mensaje del servidor.");
          }
        });
      },
      onDisconnect: () => {
        console.log("STOMP Hook: Desconectado de WebSocket");
        setIsConnected(false);
        onReadyStateChangeRef.current(false);
      },
      onStompError: (frame) => {
        console.error("STOMP Hook: Error STOMP:", frame.headers?.message, frame);
        onConnectionErrorRef.current(`Error STOMP: ${frame.headers?.message || 'Error desconocido'}`);
        setIsConnected(false);
        onReadyStateChangeRef.current(false);
      },
      onWebSocketError: (errorEvent) => {
        console.error("STOMP Hook: Error de WebSocket:", errorEvent);
        const errorMsg = (errorEvent instanceof Event && errorEvent.type === 'error')
          ? `No se pudo conectar a ${apiBaseUrlRef.current}/ws-fingerprint`
          : (errorEvent as any).message || 'Error de conexión WebSocket';
        onConnectionErrorRef.current(errorMsg);
        setIsConnected(false);
        onReadyStateChangeRef.current(false);
      }
    });

    console.log(`STOMP Hook: Activando cliente para ${currentReader}`);
    client.activate();
    stompClientRef.current = client;

    return () => {
      console.log(`STOMP Hook: useEffect CLEANUP. Deps changing or unmount.`, {
        initialReaderName,
        initialSessionId
      });
      
      stopAndReleaseReader().finally(() => {
        if (stompClientRef.current?.active) {
          stompClientRef.current.deactivate();
        }
        stompClientRef.current = null;
        setIsConnected(false);
        onReadyStateChangeRef.current(false);
      });
    };
  }, [initialReaderName, initialSessionId]); // Only depend on these two props

  return { isConnected };
};

export default useStompTimeClock;
