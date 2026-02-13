/**
 * Hook que reemplaza useStompTimeClock usando WebSDK para captura local.
 *
 * Mantiene la misma interfaz de callbacks que useStompTimeClock:
 * - onChecadorEvent: recibe BackendChecadorEvent o FullAttendanceStateEvent
 * - onConnectionError: recibe mensajes de error o null
 * - onReadyStateChange: indica si el sistema está listo
 *
 * La diferencia clave es que:
 * - No requiere STOMP/WebSocket
 * - No requiere reservar lector en el backend
 * - Captura huellas localmente vía WebSDK
 * - Envía muestras al backend vía HTTP POST
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  loadSdk,
  createWebApi,
  SampleFormat,
  extractSampleBase64,
  type FingerprintWebApi,
  type SamplesAcquiredEvent,
  type ErrorOccurredEvent,
  type DeviceEvent,
} from '../lib/fingerprint/fingerprintService';
import { identifyFingerprint } from '../lib/fingerprint/frontendFingerprintApi';

import type {
  BackendChecadorEvent,
  FullAttendanceStateEvent,
} from '../lib/types/timeClockTypes';

interface UseWebSdkTimeClockProps {
  /** Nombre del dispositivo (se obtiene automáticamente del WebSDK) */
  deviceName?: string;
  /** Formato de muestra a usar. Por defecto: Intermediate */
  sampleFormat?: 'intermediate' | 'png';
  /** Callback al recibir resultado de identificación */
  onChecadorEvent: (
    event: BackendChecadorEvent | FullAttendanceStateEvent
  ) => void;
  /** Callback para errores de conexión */
  onConnectionError: (error: string | null) => void;
  /** Callback cuando el sistema está listo para escanear */
  onReadyStateChange: (isReady: boolean) => void;
}

const useWebSdkTimeClock = ({
  deviceName: deviceNameProp,
  sampleFormat = 'intermediate',
  onChecadorEvent,
  onConnectionError,
  onReadyStateChange,
}: UseWebSdkTimeClockProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [devices, setDevices] = useState<string[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  const apiRef = useRef<FingerprintWebApi | null>(null);
  const mountedRef = useRef(true);
  const processingRef = useRef(false);
  const deviceNameRef = useRef(deviceNameProp || 'WebSDK');

  // Refs para callbacks (evitar re-suscripciones innecesarias)
  const onChecadorEventRef = useRef(onChecadorEvent);
  const onConnectionErrorRef = useRef(onConnectionError);
  const onReadyStateChangeRef = useRef(onReadyStateChange);

  useEffect(() => {
    onChecadorEventRef.current = onChecadorEvent;
  }, [onChecadorEvent]);
  useEffect(() => {
    onConnectionErrorRef.current = onConnectionError;
  }, [onConnectionError]);
  useEffect(() => {
    onReadyStateChangeRef.current = onReadyStateChange;
  }, [onReadyStateChange]);

  // --- Procesar muestra capturada ---
  const processSample = useCallback(
    async (sampleBase64: string) => {
      if (processingRef.current) {
        console.log('[WebSDK] Ignorando muestra: ya procesando otra.');
        return;
      }

      processingRef.current = true;

      try {
        console.log(
          '[WebSDK] Enviando muestra al backend (%d chars, formato: %s)',
          sampleBase64.length,
          sampleFormat
        );

        const response = await identifyFingerprint(
          sampleBase64,
          sampleFormat,
          deviceNameRef.current
        );

        if (!mountedRef.current) return;

        console.log('[WebSDK] Respuesta del backend:', {
          identificado: response.identificado,
          statusCode: response.statusCode,
          nombre: response.nombreCompleto,
        });

        // 1) Enviar ChecadorEvent (feedback inmediato)
        const checadorEvent: BackendChecadorEvent = {
          readerName: deviceNameRef.current,
          identificado: response.identificado,
          empleadoId: response.empleadoId,
          nombreCompleto: response.nombreCompleto,
          rfc: response.rfc,
          accion: response.accion as
            | 'entrada'
            | 'salida'
            | 'E'
            | 'S'
            | undefined,
          statusCode: response.statusCode,
          statusType: response.statusType,
          data: response.data as Record<string, any> | undefined,
        };

        onChecadorEventRef.current(checadorEvent);

        // 2) Si hay attendanceState, enviar como FullAttendanceStateEvent
        if (response.attendanceState) {
          const fullState =
            response.attendanceState as unknown as FullAttendanceStateEvent;
          // Asegurar que tenga el type correcto
          if (!fullState.type) {
            (fullState as any).type = 'FULL_ATTENDANCE_STATE_UPDATE';
          }
          onChecadorEventRef.current(fullState);
        }
      } catch (error) {
        if (!mountedRef.current) return;
        const message =
          error instanceof Error ? error.message : 'Error al identificar';
        console.error('[WebSDK] Error en identificación:', message);

        // Enviar como evento de error
        const errorEvent: BackendChecadorEvent = {
          readerName: deviceNameRef.current,
          identificado: false,
          statusCode: '501',
          statusType: 'ERROR',
          errorMessage: message,
          data: { errorMessage: message },
        };
        onChecadorEventRef.current(errorEvent);
      } finally {
        processingRef.current = false;
      }
    },
    [sampleFormat]
  );

  // --- Inicialización del WebSDK ---
  useEffect(() => {
    mountedRef.current = true;

    async function init() {
      try {
        console.log('[WebSDK] Cargando SDK...');
        await loadSdk();
        if (!mountedRef.current) return;

        const api = createWebApi();
        apiRef.current = api;

        // Event listeners
        api.on('DeviceConnected', (evt) => {
          const e = evt as DeviceEvent;
          if (mountedRef.current) {
            console.log('[WebSDK] Dispositivo conectado:', e.deviceUid);
            setDevices((prev) =>
              prev.includes(e.deviceUid) ? prev : [...prev, e.deviceUid]
            );
          }
        });

        api.on('DeviceDisconnected', (evt) => {
          const e = evt as DeviceEvent;
          if (mountedRef.current) {
            console.log('[WebSDK] Dispositivo desconectado:', e.deviceUid);
            setDevices((prev) => prev.filter((d) => d !== e.deviceUid));
            setSelectedDevice((prev) => (prev === e.deviceUid ? null : prev));
          }
        });

        api.on('SamplesAcquired', (evt) => {
          const e = evt as unknown as SamplesAcquiredEvent;
          if (mountedRef.current) {
            const base64 = extractSampleBase64(e.samples);
            if (base64) {
              processSample(base64);
            }
          }
        });

        api.on('ErrorOccurred', (evt) => {
          const e = evt as unknown as ErrorOccurredEvent;
          if (mountedRef.current) {
            console.warn('[WebSDK] Error del lector:', e.error);
          }
        });

        api.on('CommunicationFailed', () => {
          if (mountedRef.current) {
            setIsConnected(false);
            onConnectionErrorRef.current(
              'No se pudo conectar con el agente DigitalPersona. Verifica que esté instalado y en ejecución.'
            );
            onReadyStateChangeRef.current(false);
          }
        });

        // Enumerar dispositivos
        try {
          const deviceIds = await api.enumerateDevices();
          if (!mountedRef.current) return;

          setDevices(deviceIds ?? []);
          setIsConnected(true);
          onConnectionErrorRef.current(null);

          if (deviceIds?.length > 0) {
            const device = deviceIds[0];
            setSelectedDevice(device);
            deviceNameRef.current = deviceNameProp || device.substring(0, 30);

            // Iniciar captura automáticamente
            const sdkFormat =
              sampleFormat === 'png'
                ? SampleFormat.PngImage
                : SampleFormat.Intermediate;

            console.log(
              '[WebSDK] Iniciando adquisición con formato:',
              sampleFormat,
              '(SDK:',
              sdkFormat,
              ') en dispositivo:',
              device
            );

            await api.startAcquisition(sdkFormat, device);
            console.log('[WebSDK] Adquisición iniciada exitosamente.');
            onReadyStateChangeRef.current(true);
          } else {
            onConnectionErrorRef.current(
              'No se detectó ningún lector de huellas conectado.'
            );
            onReadyStateChangeRef.current(false);
          }
        } catch (err) {
          if (mountedRef.current) {
            const msg =
              err instanceof Error ? err.message : 'Error al conectar';
            setIsConnected(false);
            onConnectionErrorRef.current(
              `No se pudo conectar con el agente DigitalPersona: ${msg}`
            );
            onReadyStateChangeRef.current(false);
          }
        }
      } catch (err) {
        if (mountedRef.current) {
          const msg =
            err instanceof Error ? err.message : 'Error al inicializar WebSDK';
          setIsConnected(false);
          onConnectionErrorRef.current(msg);
          onReadyStateChangeRef.current(false);
        }
      }
    }

    init();

    return () => {
      mountedRef.current = false;
      if (apiRef.current) {
        apiRef.current.stopAcquisition().catch(() => {});
      }
    };
    // Solo re-ejecutar si cambia el formato (no en cada render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sampleFormat]);

  return { isConnected, devices, selectedDevice };
};

export default useWebSdkTimeClock;
