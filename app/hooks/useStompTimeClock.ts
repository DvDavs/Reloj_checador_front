import { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { apiClient } from '@/lib/apiClient';

// Importar los tipos
import type {
  BackendChecadorEvent,
  FullAttendanceStateEvent,
} from '../lib/types/timeClockTypes';

interface UseStompTimeClockProps {
  initialReaderName: string;
  initialSessionId: string;
  instanceId: string;
  onChecadorEvent: (
    event: BackendChecadorEvent | FullAttendanceStateEvent
  ) => void;
  onConnectionError: (error: string | null) => void;
  onReadyStateChange: (isReady: boolean) => void;
  apiBaseUrl: string;
}

const useStompTimeClock = ({
  initialReaderName,
  initialSessionId,
  instanceId,
  onChecadorEvent,
  onConnectionError,
  onReadyStateChange,
  apiBaseUrl,
}: UseStompTimeClockProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const stompClientRef = useRef<Client | null>(null);
  const shuttingDownRef = useRef(false);

  useEffect(() => {
    if (!initialReaderName || !initialSessionId || !instanceId) {
      onConnectionError(
        'Falta el nombre del lector, el ID de sesión o el instanceId.'
      );
      return;
    }

    // Asegurar que no estamos en proceso de apagado para esta nueva activación
    shuttingDownRef.current = false;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${apiBaseUrl}/ws-fingerprint`),
      connectHeaders: {
        'X-Browser-Session-ID': initialSessionId,
      },
      heartbeatIncoming: 10000, // Espera un ping del servidor cada 10s
      heartbeatOutgoing: 10000, // Envía un ping al servidor cada 10s
      reconnectDelay: 5000,
      onConnect: async () => {
        console.log('Conectado a WebSocket.');
        setIsConnected(true);
        onConnectionError(null);

        try {
          // Reservar e iniciar el checador después de conectar usando instanceId
          await apiClient.post(
            `${apiBaseUrl}/api/v1/multi-fingerprint/reserve`,
            {
              readerId: initialReaderName,
              instanceId: instanceId,
            }
          );
          console.log(
            `Lector ${initialReaderName} reservado para instanceId ${instanceId}.`
          );

          await apiClient.post(
            `${apiBaseUrl}/api/v1/multi-fingerprint/start-clock-mode`,
            {
              readerId: initialReaderName,
              instanceId: instanceId,
            }
          );
          console.log(
            `Checador iniciado para ${initialReaderName} con instanceId ${instanceId}.`
          );

          onReadyStateChange(true);

          // Suscripción a tópico dinámico basado en instanceId
          const topic = `/topic/fingerprint-events/${instanceId}`;
          client.subscribe(topic, (message) => {
            try {
              onChecadorEvent(JSON.parse(message.body));
            } catch (e) {
              console.error('Error al parsear mensaje de WebSocket', e);
            }
          });
          console.log(`Suscrito a ${topic}`);
        } catch (error: any) {
          const errMsg =
            error.response?.data?.mensaje ||
            error.message ||
            'Error al iniciar checador';
          onConnectionError(`Error en la inicialización: ${errMsg}`);
          onReadyStateChange(false);
        }
      },
      onDisconnect: () => {
        console.log('Desconectado de WebSocket.');
        setIsConnected(false);
        onReadyStateChange(false);
      },
      onStompError: (frame) => {
        const message = (frame.headers['message'] as string) || '';
        const isSessionClosed = /session closed/i.test(message);

        // Si estamos cerrando de forma intencional o es un cierre normal de sesión, no tratarlo como error ruidoso
        if (shuttingDownRef.current || isSessionClosed) {
          console.info('STOMP session closed.', frame);
          setIsConnected(false);
          onReadyStateChange(false);
          return;
        }

        const errorMsg = `Error de conexión STOMP: ${message || 'Desconocido'}`;
        console.warn(errorMsg, frame);
        onConnectionError(errorMsg);
        setIsConnected(false);
        onReadyStateChange(false);
      },
      // Manejar cierre de WebSocket subyacente para debug/reconexión silenciosa
      onWebSocketClose: (evt) => {
        const code = (evt as CloseEvent)?.code;
        const reason = (evt as CloseEvent)?.reason;
        if (shuttingDownRef.current || code === 1000) {
          console.info('WebSocket cerrado limpiamente.', { code, reason });
        } else {
          console.warn('WebSocket cerrado inesperadamente.', { code, reason });
        }
        setIsConnected(false);
        onReadyStateChange(false);
      },
      onWebSocketError: (evt) => {
        if (!shuttingDownRef.current) {
          console.warn('WebSocket error detectado.', evt);
        }
      },
    });

    client.activate();
    stompClientRef.current = client;

    const releaseOnUnload = () => {
      const url = `${apiBaseUrl}/api/v1/multi-fingerprint/release`;
      // Usar un Blob para asegurar que el Content-Type sea application/json
      const data = new Blob([JSON.stringify({ instanceId: instanceId })], {
        type: 'application/json',
      });
      navigator.sendBeacon(url, data);
      console.log(`Beacon enviado para liberar instanceId: ${instanceId}`);
    };

    window.addEventListener('beforeunload', releaseOnUnload);

    return () => {
      console.log('useStompTimeClock: Limpiando hook...');
      window.removeEventListener('beforeunload', releaseOnUnload);

      if (stompClientRef.current) {
        const client = stompClientRef.current;
        stompClientRef.current = null; // Evitar múltiples llamadas
        shuttingDownRef.current = true; // Ignorar errores durante el apagado intencional

        const stopAndReleaseReader = async () => {
          try {
            await apiClient.post(
              `${apiBaseUrl}/api/v1/multi-fingerprint/release`,
              { instanceId: instanceId }
            );
            console.log(`InstanceId ${instanceId} liberado explícitamente.`);
          } catch (error) {
            console.warn(
              'Advertencia al liberar el instanceId durante la limpieza:',
              error
            );
          }
        };

        stopAndReleaseReader().finally(() => {
          if (client.active) {
            client.deactivate();
            console.log('Cliente STOMP desactivado.');
          }
        });
      }
    };
  }, [
    initialReaderName,
    initialSessionId,
    instanceId,
    apiBaseUrl,
    onChecadorEvent,
    onConnectionError,
    onReadyStateChange,
  ]);

  return { isConnected };
};

export default useStompTimeClock;
