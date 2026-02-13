/**
 * Hook para enrolamiento de huellas usando WebSDK.
 *
 * Gestiona el flujo completo:
 * 1. Detección de dispositivos locales
 * 2. Captura de N muestras (default 4)
 * 3. Envío de muestras al backend para creación de enrollment FMD
 *
 * Reemplaza la necesidad de reservar lector en el backend y la conexión STOMP
 * para preview de imágenes.
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
import { enrollFingerprint } from '../lib/fingerprint/frontendFingerprintApi';

export type EnrollmentPhase =
  | 'not_initialized'
  | 'initializing'
  | 'ready' // SDK cargado, dispositivos detectados
  | 'no_devices' // SDK cargado pero sin dispositivos
  | 'capturing' // En proceso de captura
  | 'capture_success' // Una muestra capturada OK
  | 'capture_failed' // Una muestra falló
  | 'enrollment_sending' // Enviando al backend
  | 'enrollment_success' // Enrollment completado
  | 'enrollment_failed' // Enrollment falló
  | 'error';

const SAMPLES_NEEDED = 4;

export interface UseWebSdkEnrollmentReturn {
  // Estado
  phase: EnrollmentPhase;
  devices: string[];
  selectedDevice: string | null;
  capturedSamples: number;
  samplesNeeded: number;
  feedbackMessage: string;
  errorMessage: string | null;
  savedHuellaId: number | null;

  // Acciones
  selectDevice: (deviceId: string) => void;
  startCapture: () => Promise<void>;
  stopCapture: () => Promise<void>;
  reset: () => void;

  /** Envía las muestras acumuladas al backend para enrollment */
  submitEnrollment: (
    empleadoId: number,
    nombreDedo: string
  ) => Promise<boolean>;
}

export function useWebSdkEnrollment(
  sampleFormat: 'intermediate' | 'png' = 'intermediate'
): UseWebSdkEnrollmentReturn {
  const [phase, setPhase] = useState<EnrollmentPhase>('not_initialized');
  const [devices, setDevices] = useState<string[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [capturedSamples, setCapturedSamples] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedHuellaId, setSavedHuellaId] = useState<number | null>(null);

  const apiRef = useRef<FingerprintWebApi | null>(null);
  const mountedRef = useRef(true);
  const samplesRef = useRef<string[]>([]);
  const isCapturingRef = useRef(false);

  // --- Inicialización ---
  useEffect(() => {
    mountedRef.current = true;
    setPhase('initializing');

    async function init() {
      try {
        await loadSdk();
        if (!mountedRef.current) return;

        const api = createWebApi();
        apiRef.current = api;

        // Event listeners
        api.on('DeviceConnected', (evt) => {
          const e = evt as DeviceEvent;
          if (mountedRef.current) {
            setDevices((prev) =>
              prev.includes(e.deviceUid) ? prev : [...prev, e.deviceUid]
            );
          }
        });

        api.on('DeviceDisconnected', (evt) => {
          const e = evt as DeviceEvent;
          if (mountedRef.current) {
            setDevices((prev) => prev.filter((d) => d !== e.deviceUid));
            setSelectedDevice((prev) => (prev === e.deviceUid ? null : prev));
          }
        });

        api.on('SamplesAcquired', (evt) => {
          const e = evt as unknown as SamplesAcquiredEvent;
          if (!mountedRef.current || !isCapturingRef.current) return;
          const base64 = extractSampleBase64(e.samples);
          if (base64) {
            samplesRef.current.push(base64);
            const count = samplesRef.current.length;
            setCapturedSamples(count);

            if (count >= SAMPLES_NEEDED) {
              // Tenemos suficientes muestras
              isCapturingRef.current = false;
              setPhase('enrollment_sending');
              setFeedbackMessage(
                `${SAMPLES_NEEDED} muestras capturadas. Enviando al servidor...`
              );
              // Detener adquisición
              api.stopAcquisition(selectedDevice ?? undefined).catch(() => {});
            } else {
              setPhase('capture_success');
              setFeedbackMessage(
                `Captura ${count}/${SAMPLES_NEEDED} OK. Retire y vuelva a colocar el dedo.`
              );
              // Después de un momento, volver a capturing
              setTimeout(() => {
                if (mountedRef.current && isCapturingRef.current) {
                  setPhase('capturing');
                  setFeedbackMessage(
                    `Coloque el dedo (${count + 1}/${SAMPLES_NEEDED})`
                  );
                }
              }, 1200);
            }
          }
        });

        api.on('ErrorOccurred', (evt) => {
          const e = evt as unknown as ErrorOccurredEvent;
          if (mountedRef.current && isCapturingRef.current) {
            const count = samplesRef.current.length;
            setPhase('capture_failed');
            setFeedbackMessage(
              `Error del lector (${e.error}). Reintente captura ${count + 1}/${SAMPLES_NEEDED}.`
            );
            setTimeout(() => {
              if (mountedRef.current && isCapturingRef.current) {
                setPhase('capturing');
                setFeedbackMessage(
                  `Coloque el dedo (${count + 1}/${SAMPLES_NEEDED})`
                );
              }
            }, 2000);
          }
        });

        api.on('CommunicationFailed', () => {
          if (mountedRef.current) {
            setPhase('error');
            setErrorMessage(
              'No se pudo conectar con el agente DigitalPersona.'
            );
          }
        });

        // Enumerar dispositivos
        try {
          const deviceIds = await api.enumerateDevices();
          if (!mountedRef.current) return;

          setDevices(deviceIds ?? []);
          if (deviceIds?.length > 0) {
            setSelectedDevice(deviceIds[0]);
            setPhase('ready');
            setFeedbackMessage('Lector detectado. Listo para capturar.');
          } else {
            setPhase('no_devices');
            setFeedbackMessage('No se detectó ningún lector conectado.');
          }
        } catch {
          if (mountedRef.current) {
            setPhase('error');
            setErrorMessage(
              'No se pudo conectar con el agente DigitalPersona.'
            );
          }
        }
      } catch (err) {
        if (mountedRef.current) {
          setPhase('error');
          setErrorMessage(
            err instanceof Error ? err.message : 'Error al inicializar WebSDK'
          );
        }
      }
    }

    init();

    return () => {
      mountedRef.current = false;
      isCapturingRef.current = false;
      if (apiRef.current) {
        apiRef.current.stopAcquisition().catch(() => {});
      }
    };
  }, []);

  // --- Acciones ---

  const selectDevice = useCallback((deviceId: string) => {
    setSelectedDevice(deviceId);
  }, []);

  const startCapture = useCallback(async () => {
    if (!apiRef.current || !selectedDevice) {
      setErrorMessage('No hay lector seleccionado');
      return;
    }

    // Reset muestras
    samplesRef.current = [];
    setCapturedSamples(0);
    setErrorMessage(null);
    setSavedHuellaId(null);
    isCapturingRef.current = true;

    const sdkFormat =
      sampleFormat === 'png'
        ? SampleFormat.PngImage
        : SampleFormat.Intermediate;

    try {
      await apiRef.current.startAcquisition(sdkFormat, selectedDevice);
      setPhase('capturing');
      setFeedbackMessage(`Coloque el dedo (1/${SAMPLES_NEEDED})`);
    } catch (err) {
      setPhase('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Error al iniciar captura'
      );
      isCapturingRef.current = false;
    }
  }, [selectedDevice, sampleFormat]);

  const stopCapture = useCallback(async () => {
    isCapturingRef.current = false;
    if (apiRef.current) {
      await apiRef.current
        .stopAcquisition(selectedDevice ?? undefined)
        .catch(() => {});
    }
    setPhase('ready');
    setFeedbackMessage('Captura detenida.');
  }, [selectedDevice]);

  const submitEnrollment = useCallback(
    async (empleadoId: number, nombreDedo: string): Promise<boolean> => {
      if (samplesRef.current.length < SAMPLES_NEEDED) {
        setErrorMessage(
          `Se necesitan ${SAMPLES_NEEDED} muestras. Solo hay ${samplesRef.current.length}.`
        );
        return false;
      }

      setPhase('enrollment_sending');
      setFeedbackMessage('Guardando huella en el servidor...');
      setErrorMessage(null);

      try {
        const response = await enrollFingerprint(
          samplesRef.current.slice(0, SAMPLES_NEEDED),
          sampleFormat,
          empleadoId,
          nombreDedo
        );

        if (response.success && response.huellaId) {
          setPhase('enrollment_success');
          setFeedbackMessage(`¡Huella de ${nombreDedo} registrada con éxito!`);
          setSavedHuellaId(response.huellaId);
          return true;
        } else {
          setPhase('enrollment_failed');
          setErrorMessage(
            response.error || 'Error desconocido al guardar huella.'
          );
          setFeedbackMessage('Error al guardar. Intente nuevamente.');
          return false;
        }
      } catch (err) {
        setPhase('enrollment_failed');
        const msg =
          err instanceof Error ? err.message : 'Error de red al guardar';
        setErrorMessage(msg);
        setFeedbackMessage('Error al guardar. Intente nuevamente.');
        return false;
      }
    },
    [sampleFormat]
  );

  const reset = useCallback(() => {
    samplesRef.current = [];
    setCapturedSamples(0);
    setPhase(devices.length > 0 ? 'ready' : 'no_devices');
    setFeedbackMessage(
      devices.length > 0
        ? 'Listo para capturar.'
        : 'No se detectó ningún lector.'
    );
    setErrorMessage(null);
    setSavedHuellaId(null);
    isCapturingRef.current = false;
  }, [devices.length]);

  return {
    phase,
    devices,
    selectedDevice,
    capturedSamples,
    samplesNeeded: SAMPLES_NEEDED,
    feedbackMessage,
    errorMessage,
    savedHuellaId,
    selectDevice,
    startCapture,
    stopCapture,
    reset,
    submitEnrollment,
  };
}
