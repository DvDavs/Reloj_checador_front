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
  onChecadorEvent,
  onConnectionError,
  onReadyStateChange,
  apiBaseUrl,
}: UseStompTimeClockProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!initialReaderName || !initialSessionId) {
      onConnectionError('Falta el nombre del lector o el ID de sesión.');
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(`${apiBaseUrl}/ws-fingerprint`),
      connectHeaders: {
        'X-Browser-Session-ID': initialSessionId,
      },
      reconnectDelay: 5000,
      onConnect: async () => {
        console.log('Conectado a WebSocket.');
        setIsConnected(true);
        onConnectionError(null);

        try {
          // Reservar e iniciar el checador después de conectar
          await apiClient.post(
            `${apiBaseUrl}/api/v1/multi-fingerprint/reserve/${encodeURIComponent(initialReaderName)}`,
            null,
            { params: { sessionId: initialSessionId } }
          );
          console.log(`Lector ${initialReaderName} reservado.`);

          await apiClient.post(
            `${apiBaseUrl}/api/v1/multi-fingerprint/checador/start/${encodeURIComponent(initialReaderName)}`,
            null,
            { params: { sessionId: initialSessionId } }
          );
          console.log(`Checador iniciado para ${initialReaderName}.`);

          onReadyStateChange(true);

          const topic = `/topic/checador/${encodeURIComponent(initialReaderName)}`;
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
        const errorMsg = `Error de conexión STOMP: ${frame.headers['message'] || 'Desconocido'}`;
        console.error(errorMsg, frame);
        onConnectionError(errorMsg);
        setIsConnected(false);
        onReadyStateChange(false);
      },
    });

    client.activate();
    stompClientRef.current = client;

    const releaseOnUnload = () => {
      const url = `${apiBaseUrl}/api/v1/multi-fingerprint/release/${encodeURIComponent(initialReaderName)}?sessionId=${initialSessionId}`;
      navigator.sendBeacon(url);
      console.log(`Beacon enviado para liberar lector: ${initialReaderName}`);
    };

    window.addEventListener('beforeunload', releaseOnUnload);

    return () => {
      console.log('useStompTimeClock: Limpiando hook...');
      window.removeEventListener('beforeunload', releaseOnUnload);

      const stopAndReleaseReader = async () => {
        try {
          await apiClient.post(
            `${apiBaseUrl}/api/v1/multi-fingerprint/release/${encodeURIComponent(initialReaderName)}`,
            null,
            { params: { sessionId: initialSessionId } }
          );
          console.log(`Lector ${initialReaderName} liberado explícitamente.`);
        } catch (error) {
          console.warn(
            'Advertencia al liberar el lector durante la limpieza:',
            error
          );
        }
      };

      stopAndReleaseReader().finally(() => {
        if (stompClientRef.current?.active) {
          stompClientRef.current.deactivate();
          console.log('Cliente STOMP desactivado.');
        }
      });
    };
  }, [
    initialReaderName,
    initialSessionId,
    apiBaseUrl,
    onChecadorEvent,
    onConnectionError,
    onReadyStateChange,
  ]);

  return { isConnected };
};

export default useStompTimeClock;
