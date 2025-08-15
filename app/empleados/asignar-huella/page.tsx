'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import SockJS from 'sockjs-client';
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

import {
  ArrowLeft,
  ArrowRight,
  Fingerprint,
  CheckCircle,
  XCircle,
  Users,
  Loader2,
  AlertCircle,
  RefreshCcw,
  Search,
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

import { getBrowserSessionId } from '@/lib/sessionId';

import { HandSelector, fingerIndexToName } from './components/hand-selector';
import { WizardStepper } from '@/app/components/shared/wizard-stepper';
import { EmployeeSearch } from '@/app/components/shared/employee-search';
import { EmpleadoSimpleDTO } from '@/app/horarios/asignados/registrar/types';

// Componentes mejorados
import { EnhancedCard } from '@/app/components/shared/enhanced-card';
import { BreadcrumbNav } from '@/app/components/shared/breadcrumb-nav';

type ScannerStatus =
  | 'online'
  | 'offline'
  | 'error'
  | 'reserved_other'
  | 'reserved_this';

interface FingerprintScanner {
  id: string;
  name: string;
  status: ScannerStatus;
}

interface EnrollmentResponse {
  complete: boolean;
  remaining?: number;
  template?: string;
}

interface HuellaInfo {
  id: number;
  nombreDedo: string | null;
  uuid?: string;
}

type CaptureStepState =
  | 'idle'
  | 'initializing'
  | 'awaiting_reserve'
  | 'reserving'
  | 'starting_enroll'
  | 'ready_to_capture'
  | 'capturing'
  | 'capture_success'
  | 'capture_failed'
  | 'enroll_complete'
  | 'saving'
  | 'save_success'
  | 'save_failed'
  | 'error';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

const ENROLLMENT_STEPS_NEEDED = 4;

const fingerNameToIndex: Record<string, number> = {
  'PULGAR DERECHO': 1,
  'ÍNDICE DERECHO': 2,
  'MEDIO DERECHO': 3,
  'ANULAR DERECHO': 4,
  'MEÑIQUE DERECHO': 5,
  'PULGAR IZQUIERDO': 6,
  'ÍNDICE IZQUIERDO': 7,
  'MEDIO IZQUIERDO': 8,
  'ANULAR IZQUIERDO': 9,
  'MEÑIQUE IZQUIERDO': 10,
};

//
// --------------------- Componente Principal ---------------------
//

function AsignarHuellaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [browserSessionId, setBrowserSessionId] = useState('');

  const [selectedEmployee, setSelectedEmployee] =
    useState<EmpleadoSimpleDTO | null>(null);

  const [employeeSearchValue, setEmployeeSearchValue] = useState('');
  const [employeesFound, setEmployeesFound] = useState<EmpleadoSimpleDTO[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [openEmployeePopover, setOpenEmployeePopover] = useState(false);

  const [availableReaders, setAvailableReaders] = useState<
    FingerprintScanner[]
  >([]);
  const [selectedScanner, setSelectedScanner] = useState<string | null>(null);

  const [selectedFinger, setSelectedFinger] = useState<number | null>(null);
  const [existingHuellas, setExistingHuellas] = useState<HuellaInfo[]>([]);
  const [registeredThisSessionIndices, setRegisteredThisSessionIndices] =
    useState<number[]>([]);

  const [captureState, setCaptureState] = useState<CaptureStepState>('idle');
  const [captureProgress, setCaptureProgress] = useState(0);
  const [captureFeedbackMsg, setCaptureFeedbackMsg] = useState<string>('');
  const [captureError, setCaptureError] = useState<string | null>(null);

  const [enrollmentSessionId, setEnrollmentSessionId] = useState<string | null>(
    null
  );
  const [finalTemplateBase64, setFinalTemplateBase64] = useState<string | null>(
    null
  );

  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(
    null
  );

  const stompClient = useRef<Client | null>(null);
  const imageSubscription = useRef<StompSubscription | null>(null);
  const isUnmounting = useRef(false);
  const currentEnrollmentAttemptId = useRef<string | null>(null);

  const searchEmployees = useCallback(async (query: string) => {
    if (query.trim().length < 2 && query.trim().length !== 0) {
      setEmployeesFound([]);
      return;
    }

    setIsSearching(true);
    setGeneralError(null);

    try {
      const endpoint = query.trim()
        ? `${API_BASE_URL}/api/empleados?search=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/api/empleados`;

      const response = await apiClient.get(endpoint);

      const data = response.data.map((emp: any) => ({
        id: emp.id.toString(),
        nombre: `${emp.primerNombre || ''} ${emp.segundoNombre || ''} ${
          emp.primerApellido || ''
        } ${emp.segundoApellido || ''}`.trim(),
        numeroTarjeta: emp.id,
        area:
          emp.departamentoAcademico?.nombre ||
          emp.departamentoAdministrativo?.nombre ||
          'N/A',
      }));

      setEmployeesFound(data);
    } catch (error) {
      console.error('Error buscando empleados:', error);
      setGeneralError('No se pudieron buscar los empleados.');
      setEmployeesFound([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const fetchInitialEmployees = useCallback(async () => {
    setIsSearching(true);
    setGeneralError(null);
    try {
      const response = await apiClient.get(`${API_BASE_URL}/api/empleados`);
      const data = response.data.map((emp: any) => ({
        id: emp.id.toString(),
        nombre: `${emp.primerNombre || ''} ${emp.segundoNombre || ''} ${
          emp.primerApellido || ''
        } ${emp.segundoApellido || ''}`.trim(),
        numeroTarjeta: emp.id,
        area:
          emp.departamentoAcademico?.nombre ||
          emp.departamentoAdministrativo?.nombre ||
          'N/A',
      }));
      setEmployeesFound(data);
    } catch (error) {
      console.error('Error cargando empleados iniciales:', error);
      setGeneralError('No se pudieron cargar los empleados.');
    } finally {
      setIsSearching(false);
    }
  }, []);

  const fetchExistingHuellas = useCallback(async (empId: number) => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<HuellaInfo[]>(
        `${API_BASE_URL}/api/empleados/${empId}/huellas`
      );
      setExistingHuellas(response.data);
    } catch (err) {
      console.error('Error cargando huellas existentes:', err);
      setGeneralError('No se pudieron cargar las huellas existentes.');
      setExistingHuellas([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetCaptureProcess = useCallback(
    (preserveFingerSelection = false) => {
      console.log('[DEBUG] resetCaptureProcess called:', {
        preserveFingerSelection,
        currentState: {
          captureState,
          selectedFinger,
          enrollmentSessionId,
          captureProgress,
          captureError,
          isLoading,
        },
        timestamp: new Date().toISOString(),
      });

      if (captureState !== 'idle' && captureState !== 'error') {
        console.log(
          '[DEBUG] State validation: Resetting non-idle capture state:',
          captureState
        );
      }

      if (enrollmentSessionId) {
        console.log(
          '[DEBUG] State validation: Clearing active enrollment session:',
          enrollmentSessionId
        );
      }

      setCaptureState('idle');
      setEnrollmentSessionId(null);
      currentEnrollmentAttemptId.current = null;
      setCaptureProgress(0);
      setCaptureFeedbackMsg('');
      setCaptureError(null);
      setFinalTemplateBase64(null);
      setLastCapturedImage(null);
      setIsLoading(false);

      if (!preserveFingerSelection) {
        console.log('[DEBUG] Clearing finger selection');
        setSelectedFinger(null);
      } else {
        console.log('[DEBUG] Preserving finger selection:', selectedFinger);
      }

      console.log('[DEBUG] resetCaptureProcess completed - new state:', {
        captureState: 'idle',
        selectedFinger: preserveFingerSelection ? selectedFinger : null,
        enrollmentSessionId: null,
        captureProgress: 0,
      });
    },
    [
      captureState,
      selectedFinger,
      enrollmentSessionId,
      captureProgress,
      captureError,
      isLoading,
    ]
  );

  const fetchAvailableReaders = useCallback(async () => {
    if (!browserSessionId) return;
    setIsLoading(true);
    setGeneralError(null);
    try {
      const allReadersResponse = await apiClient.get<string[]>(
        `${API_BASE_URL}/api/v1/multi-fingerprint/auto-select`
      );
      const allReaderNames = allReadersResponse.data || [];

      const availableResponse = await apiClient.get<string[]>(
        `${API_BASE_URL}/api/v1/multi-fingerprint/readers`
      );
      const availableReaderNames = new Set(availableResponse.data || []);

      const currentSelected = selectedScanner;
      const readersWithStatus = allReaderNames.map((name) => {
        let status: ScannerStatus;
        if (name === currentSelected) {
          status = 'reserved_this';
        } else if (availableReaderNames.has(name)) {
          status = 'online';
        } else {
          status = 'reserved_other';
        }
        return { id: name, name: name, status };
      });

      setAvailableReaders(readersWithStatus);

      const stillValid = readersWithStatus.some(
        (r) =>
          r.name === currentSelected &&
          (r.status === 'online' || r.status === 'reserved_this')
      );
      if (currentSelected && !stillValid) {
        console.warn(`El lector ${currentSelected} ya no está válido.`);
        setSelectedScanner(null);
        resetCaptureProcess();
      }
    } catch (err: any) {
      console.error('Error fetching readers:', err);
      setGeneralError(
        err.response?.data ||
          err.message ||
          'Error al obtener lectores de huella.'
      );
      setAvailableReaders([]);
      setSelectedScanner(null);
    } finally {
      setIsLoading(false);
    }
  }, [browserSessionId, selectedScanner]);

  const reserveReaderApiCall = useCallback(
    async (readerName: string, sessionId: string): Promise<boolean> => {
      try {
        await apiClient.post(
          `${API_BASE_URL}/api/v1/multi-fingerprint/reserve/${encodeURIComponent(
            readerName
          )}?sessionId=${sessionId}`
        );
        setAvailableReaders((prev) =>
          prev.map((r) =>
            r.name === readerName ? { ...r, status: 'reserved_this' } : r
          )
        );
        return true;
      } catch (error: any) {
        console.error(`Error reservando lector ${readerName}:`, error);
        const backendError =
          error.response?.data ||
          error.message ||
          'Error desconocido al reservar lector.';
        setCaptureError(`Error al reservar lector: ${backendError}`);
        setCaptureState('error');
        fetchAvailableReaders();
        return false;
      }
    },
    [fetchAvailableReaders]
  );

  const releaseReaderApiCall = useCallback(
    async (readerName: string, sessionId: string) => {
      try {
        const url = `${API_BASE_URL}/api/v1/multi-fingerprint/release/${encodeURIComponent(
          readerName
        )}?sessionId=${sessionId}`;
        if (navigator.sendBeacon && isUnmounting.current) {
          navigator.sendBeacon(url);
        } else {
          await apiClient.post(url);
        }
        setAvailableReaders((prev) =>
          prev.map((r) =>
            r.name === readerName ? { ...r, status: 'online' } : r
          )
        );
        if (readerName === selectedScanner) {
          setSelectedScanner(null);
        }
      } catch (error) {
        console.warn(`No se pudo liberar lector ${readerName}:`, error);
        setAvailableReaders((prev) =>
          prev.map((r) =>
            r.name === readerName ? { ...r, status: 'online' } : r
          )
        );
        if (readerName === selectedScanner) {
          setSelectedScanner(null);
        }
      }
    },
    [selectedScanner]
  );

  const handleSelectReaderChange = (newReaderName: string) => {
    if (isLoading || newReaderName === selectedScanner) return;
    const prev = selectedScanner;
    const newScannerData = availableReaders.find(
      (r) => r.name === newReaderName
    );
    if (newScannerData?.status === 'reserved_other') {
      setGeneralError(`El lector ${newReaderName} está ocupado.`);
      return;
    }
    setSelectedScanner(newReaderName);
    resetCaptureProcess();
    if (prev && browserSessionId) {
      releaseReaderApiCall(prev, browserSessionId);
    }
  };

  const handleFingerSelectChange = useCallback(
    (fingerIndex: number | null) => {
      console.log('[DEBUG] handleFingerSelectChange called:', {
        previousFinger: selectedFinger,
        newFinger: fingerIndex,
        currentCaptureState: captureState,
        timestamp: new Date().toISOString(),
      });

      resetCaptureProcess();
      setSelectedFinger(fingerIndex);
      setCaptureError(null);

      if (fingerIndex !== null) {
        const existingIndices = existingHuellas.map(
          (h) => fingerNameToIndex[h.nombreDedo?.toUpperCase() ?? ''] ?? -1
        );

        console.log('[DEBUG] Finger validation:', {
          selectedFinger: fingerIndex,
          existingIndices,
          registeredThisSession: registeredThisSessionIndices,
          isAlreadyRegistered:
            existingIndices.includes(fingerIndex) ||
            registeredThisSessionIndices.includes(fingerIndex),
        });

        if (
          existingIndices.includes(fingerIndex) ||
          registeredThisSessionIndices.includes(fingerIndex)
        ) {
          console.log('[DEBUG] Finger already registered, showing error');
          setCaptureError('Dedo ya registrado.');
          setCaptureFeedbackMsg('Seleccione otro dedo.');
        } else {
          console.log('[DEBUG] Finger available for registration');
          setCaptureFeedbackMsg(
            `Listo para registrar: ${fingerIndexToName[fingerIndex]}`
          );
        }
      } else {
        console.log('[DEBUG] No finger selected, clearing feedback');
        setCaptureFeedbackMsg('');
      }
    },
    [
      existingHuellas,
      registeredThisSessionIndices,
      selectedFinger,
      captureState,
    ]
  );

  const initiateEnrollmentProcess = useCallback(async () => {
    if (
      !selectedScanner ||
      selectedFinger === null ||
      !browserSessionId ||
      captureState !== 'idle'
    ) {
      return;
    }
    const attemptId = `enroll-${selectedFinger}-${Date.now()}`;
    currentEnrollmentAttemptId.current = attemptId;

    setCaptureState('reserving');
    setCaptureError(null);
    setCaptureFeedbackMsg('Reservando lector...');
    setIsLoading(true);

    const ok = await reserveReaderApiCall(selectedScanner, browserSessionId);
    if (currentEnrollmentAttemptId.current !== attemptId || !ok) {
      setIsLoading(false);
      if (captureState === ('reserving' as CaptureStepState))
        setCaptureState('idle');
      return;
    }

    setCaptureState('starting_enroll');
    setCaptureFeedbackMsg('Iniciando enrolamiento...');
    try {
      const resp = await apiClient.post<{ sessionId: string }>(
        `${API_BASE_URL}/api/v1/multi-fingerprint/enroll/start/${encodeURIComponent(
          selectedScanner
        )}?sessionId=${browserSessionId}`
      );
      const enrollId = resp.data.sessionId;
      if (!enrollId) throw new Error('El backend no devolvió sessionId.');
      if (currentEnrollmentAttemptId.current !== attemptId) {
        releaseReaderApiCall(selectedScanner, browserSessionId);
        setIsLoading(false);
        setCaptureState('idle');
        return;
      }
      setEnrollmentSessionId(enrollId);
      setCaptureProgress(0);
      setCaptureState('ready_to_capture');
      setCaptureFeedbackMsg(
        `Coloque ${fingerIndexToName[selectedFinger]} (1/${ENROLLMENT_STEPS_NEEDED})`
      );
    } catch (err: any) {
      console.error('Error iniciando enrolamiento:', err);
      const backendError = err.response?.data || err.message || 'Error.';
      setCaptureError(`Error: ${backendError}`);
      setCaptureState('error');
      releaseReaderApiCall(selectedScanner, browserSessionId);
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedScanner,
    selectedFinger,
    browserSessionId,
    captureState,
    reserveReaderApiCall,
    releaseReaderApiCall,
  ]);

  const saveFingerprint = useCallback(
    async (templateBase64: string) => {
      if (!selectedEmployee || selectedFinger === null) return;
      const empIdNum = selectedEmployee.id;
      if (isNaN(empIdNum)) {
        setCaptureError('ID de empleado inválido.');
        setCaptureState('error');
        return;
      }
      setCaptureState('saving');
      setCaptureFeedbackMsg('Guardando huella en servidor...');
      setIsLoading(true);
      setCaptureError(null);

      const dedoNombre = fingerIndexToName[selectedFinger].toUpperCase();
      try {
        const resp = await apiClient.post(
          `${API_BASE_URL}/api/empleados/${empIdNum}/huellas`,
          {
            nombreDedo: dedoNombre,
            templateBase64: templateBase64,
          }
        );
        if (resp.status === 201) {
          setCaptureState('save_success');
          setCaptureFeedbackMsg(
            `¡Huella de ${dedoNombre} registrada con éxito!`
          );
          if (!registeredThisSessionIndices.includes(selectedFinger)) {
            setRegisteredThisSessionIndices((prev) =>
              [...prev, selectedFinger].sort((a, b) => a - b)
            );
          }
          setFinalTemplateBase64(null);
          setEnrollmentSessionId(null);
          currentEnrollmentAttemptId.current = null;
          setTimeout(() => {
            if (captureState === 'save_success') {
              setCurrentStep(5);
            }
          }, 1500);
        } else {
          throw new Error(`Respuesta inesperada: ${resp.status}`);
        }
      } catch (err: any) {
        console.error('Error guardando huella:', err);
        const backendErr =
          err.response?.data?.message ||
          err.response?.data ||
          err.message ||
          'Error desconocido.';
        setCaptureError(`Error al guardar: ${backendErr}`);
        setCaptureState('save_failed');
        setCaptureFeedbackMsg('Fallo al guardar. Reintente o cancele.');
      } finally {
        setIsLoading(false);
      }
    },
    [
      selectedEmployee,
      selectedFinger,
      captureState,
      registeredThisSessionIndices,
    ]
  );

  const handleCapture = useCallback(async () => {
    if (
      captureState !== 'ready_to_capture' ||
      !selectedScanner ||
      !enrollmentSessionId ||
      !selectedFinger
    ) {
      return;
    }
    const attemptId = `capture-${enrollmentSessionId}-${captureProgress}`;
    currentEnrollmentAttemptId.current = attemptId;

    setCaptureState('capturing');
    setCaptureError(null);
    setCaptureFeedbackMsg(
      `Capturando (${captureProgress + 1}/${ENROLLMENT_STEPS_NEEDED})...`
    );
    setIsLoading(true);
    setLastCapturedImage(null);

    try {
      const response = await apiClient.post<EnrollmentResponse>(
        `${API_BASE_URL}/api/v1/multi-fingerprint/enroll/capture/${encodeURIComponent(
          selectedScanner
        )}/${encodeURIComponent(enrollmentSessionId)}`
      );
      const data = response.data;
      if (currentEnrollmentAttemptId.current !== attemptId) {
        setIsLoading(false);
        return;
      }
      const nextProgress = captureProgress + 1;
      setCaptureProgress(nextProgress);

      if (data.complete && data.template) {
        setCaptureState('enroll_complete');
        setCaptureFeedbackMsg('¡Captura completa! Guardando huella...');
        setFinalTemplateBase64(data.template);
        await saveFingerprint(data.template);
      } else if (!data.complete) {
        setCaptureState('capture_success');
        setCaptureFeedbackMsg(
          `Captura ${nextProgress}/${ENROLLMENT_STEPS_NEEDED} OK. Retire y vuelva a colocar.`
        );
        setTimeout(() => {
          if (currentEnrollmentAttemptId.current === attemptId) {
            setCaptureState('ready_to_capture');
            setCaptureFeedbackMsg(
              `Coloque ${fingerIndexToName[selectedFinger]} (${
                nextProgress + 1
              }/${ENROLLMENT_STEPS_NEEDED})`
            );
          }
        }, 1500);
      } else {
        throw new Error('Respuesta de enrolamiento incompleta.');
      }
    } catch (err: any) {
      console.error('Error en captura:', err);
      if (currentEnrollmentAttemptId.current !== attemptId) {
        setIsLoading(false);
        return;
      }
      let specificError = 'Error durante la captura.';
      const errorData = err.response?.data;
      if (typeof errorData === 'string') {
        specificError = errorData;
      } else if (errorData?.message) {
        specificError = errorData.message;
      } else if (err.message) {
        specificError = err.message;
      }
      if (
        specificError.includes('TIMEOUT') ||
        specificError.includes('NO_DATA')
      ) {
        specificError = 'Tiempo agotado / dedo no detectado.';
      } else if (specificError.includes('QUALITY')) {
        specificError = 'Calidad insuficiente.';
      } else if (specificError.includes('FAKE')) {
        specificError = 'Dedo falso detectado.';
      } else if (specificError.includes('DEVICE_BUSY')) {
        specificError = 'Lector ocupado.';
      }
      setCaptureError(specificError);
      setCaptureState('capture_failed');
      setCaptureFeedbackMsg('Captura fallida. Intente nuevamente.');
      setCaptureProgress((prev) => Math.max(0, prev - 1));

      setTimeout(() => {
        if (currentEnrollmentAttemptId.current === attemptId) {
          setCaptureState('ready_to_capture');
          setCaptureFeedbackMsg(
            `Reintente (${captureProgress + 1}/${ENROLLMENT_STEPS_NEEDED}).`
          );
          setCaptureError(null);
        }
      }, 2500);
    } finally {
      if (currentEnrollmentAttemptId.current === attemptId) {
        setIsLoading(false);
      }
    }
  }, [
    captureProgress,
    captureState,
    enrollmentSessionId,
    selectedFinger,
    selectedScanner,
    saveFingerprint,
  ]);

  const handleRetrySave = () => {
    if (captureState === 'save_failed' && finalTemplateBase64) {
      saveFingerprint(finalTemplateBase64);
    }
  };

  const connectWebSocketForImages = useCallback(() => {
    if (!selectedScanner || !browserSessionId || stompClient.current?.active) {
      return;
    }
    const stompInstance = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws-fingerprint`),
      debug: () => {},
      reconnectDelay: 5000,
      connectHeaders: { login: 'guest', passcode: 'guest' },
      onConnect: () => {
        if (isUnmounting.current) {
          stompInstance.deactivate();
          return;
        }
        const topic = `/topic/fingerprints/${browserSessionId}/${encodeURIComponent(
          selectedScanner
        )}`;
        try {
          imageSubscription.current = stompInstance.subscribe(
            topic,
            (message: IMessage) => {
              if (isUnmounting.current) return;
              try {
                const eventData = JSON.parse(message.body);
                if (
                  eventData.base64Image &&
                  [
                    'ready_to_capture',
                    'capturing',
                    'capture_failed',
                    'capture_success',
                  ].includes(captureState)
                ) {
                  setLastCapturedImage(
                    `data:image/png;base64,${eventData.base64Image}`
                  );
                }
              } catch (e) {
                console.error('Error parseando mensaje WS de imagen:', e);
              }
            },
            {
              id: `sub-image-${selectedScanner}-${browserSessionId}`,
            }
          );
        } catch (subErr) {
          console.error('Error suscribiendo a imágenes:', subErr);
          setGeneralError('Error al suscribirse al visualizador de huella.');
        }
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message']);
      },
      onWebSocketError: (evt) => {
        console.error('WebSocket error:', evt);
      },
      onWebSocketClose: (evt) => {
        console.log('WS cerrado (code:', evt.code, ')');
      },
    });
    stompClient.current = stompInstance;
    stompInstance.activate();
  }, [selectedScanner, browserSessionId, captureState]);

  const disconnectWebSocketForImages = useCallback(() => {
    if (stompClient.current?.active) {
      stompClient.current.deactivate().catch((err) => {
        console.error('Error al desactivar stomp:', err);
      });
    }
    imageSubscription.current = null;
    stompClient.current = null;
    setLastCapturedImage(null);
  }, []);

  useEffect(() => {
    isUnmounting.current = false;
    const sid = getBrowserSessionId();
    setBrowserSessionId(sid);

    const empIdStr = searchParams.get('id');
    const empName = searchParams.get('nombre');
    let validId = false;
    if (empIdStr && /^\d+$/.test(empIdStr)) {
      validId = true;
    }

    if (empIdStr && empName && validId) {
      setSelectedEmployee({
        id: Number.parseInt(empIdStr, 10),
        nombreCompleto: empName,
      });
      setCurrentStep(2);
      fetchExistingHuellas(Number.parseInt(empIdStr, 10));
    } else {
      fetchInitialEmployees();
      setCurrentStep(1);
    }

    return () => {
      isUnmounting.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      const numericId = selectedEmployee.id;
      fetchExistingHuellas(numericId);
    }
  }, [selectedEmployee, fetchExistingHuellas]);

  useEffect(() => {
    if (currentStep >= 2 && browserSessionId) {
      fetchAvailableReaders();
    }
  }, [currentStep, browserSessionId, fetchAvailableReaders]);

  useEffect(() => {
    if (selectedScanner && browserSessionId) {
      connectWebSocketForImages();
    } else {
      disconnectWebSocketForImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedScanner, browserSessionId]);

  useEffect(() => {
    console.log('[DEBUG] Enrollment useEffect triggered:', {
      currentStep,
      selectedScanner,
      selectedFinger,
      captureState,
      timestamp: new Date().toISOString(),
    });

    if (
      currentStep === 4 &&
      selectedScanner &&
      selectedFinger !== null &&
      captureState === 'idle'
    ) {
      console.log(
        '[DEBUG] Enrollment conditions met, checking finger registration'
      );

      const alreadyReg = existingHuellas.map((h) => {
        const i = fingerNameToIndex[h.nombreDedo?.toUpperCase() || ''];
        return i || -1;
      });

      console.log('[DEBUG] Finger registration check:', {
        selectedFinger,
        alreadyRegistered: alreadyReg,
        registeredThisSession: registeredThisSessionIndices,
        isAlreadyRegistered:
          alreadyReg.includes(selectedFinger) ||
          registeredThisSessionIndices.includes(selectedFinger),
      });

      if (
        alreadyReg.includes(selectedFinger) ||
        registeredThisSessionIndices.includes(selectedFinger)
      ) {
        console.log('[DEBUG] Finger already registered, setting error state');
        setCaptureState('error');
        setCaptureError('Este dedo ya está registrado.');
        setCaptureFeedbackMsg('Seleccione otro dedo.');
      } else {
        console.log(
          '[DEBUG] Initiating enrollment process for finger:',
          selectedFinger
        );
        initiateEnrollmentProcess();
      }
    } else {
      console.log('[DEBUG] Enrollment conditions not met:', {
        stepIs4: currentStep === 4,
        hasScanner: !!selectedScanner,
        hasFingerSelected: selectedFinger !== null,
        captureStateIsIdle: captureState === 'idle',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, selectedScanner, selectedFinger, captureState]);

  const goToNextStep = () => {
    console.log('[DEBUG] goToNextStep called:', {
      currentStep,
      selectedEmployee: selectedEmployee?.id,
      selectedScanner,
      selectedFinger,
      captureState,
      timestamp: new Date().toISOString(),
    });

    setGeneralError(null);

    if (currentStep === 1) {
      if (!selectedEmployee) {
        console.log('[DEBUG] Step 1 validation failed: No employee selected');
        setGeneralError('Seleccione un empleado.');
        return;
      }
      console.log('[DEBUG] Step 1 → 2: Employee selected, proceeding');
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!selectedScanner) {
        console.log('[DEBUG] Step 2 validation failed: No scanner selected');
        setGeneralError('Seleccione un lector de huella.');
        return;
      }
      console.log('[DEBUG] Step 2 → 3: Scanner selected, proceeding');
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      if (selectedFinger === null) {
        console.log('[DEBUG] Step 3 validation failed: No finger selected');
        setGeneralError('Seleccione un dedo.');
        return;
      }
      console.log('[DEBUG] Step 3 → 4: Finger selected, proceeding to capture');
      setCurrentStep(4);
      return;
    }

    if (currentStep === 4) {
      // Debemos tener "save_success" o que completó
      if (
        captureState !== 'save_success' &&
        captureState !== 'enroll_complete' &&
        captureState !== 'save_failed'
      ) {
        console.log('[DEBUG] Step 4 validation failed: Capture not complete', {
          captureState,
          requiredStates: ['save_success', 'enroll_complete', 'save_failed'],
        });
        setCaptureError(
          `Complete las ${ENROLLMENT_STEPS_NEEDED} capturas antes de continuar.`
        );
        return;
      }
      console.log(
        '[DEBUG] Step 4 → 5: Capture complete, proceeding to success'
      );
      setCurrentStep(5);
      return;
    }

    console.log('[DEBUG] goToNextStep: Unknown step', currentStep);
  };

  const goToPreviousStep = () => {
    console.log('[DEBUG] goToPreviousStep called:', {
      currentStep,
      selectedEmployee: selectedEmployee?.id,
      selectedScanner,
      selectedFinger,
      captureState,
      timestamp: new Date().toISOString(),
    });

    setGeneralError(null);
    if (currentStep <= 1) {
      console.log('[DEBUG] Already at step 1, cannot go back further');
      return;
    }

    const newStep = currentStep - 1;

    if (currentStep === 2) {
      console.log('[DEBUG] Step 2 → 1: Going back to employee selection');
    }

    if (currentStep === 3) {
      console.log(
        '[DEBUG] Step 3 → 2: Clearing finger selection and resetting capture'
      );
      setSelectedFinger(null);
      resetCaptureProcess();
    }

    if (currentStep === 4) {
      console.log(
        '[DEBUG] Step 4 → 2: Releasing scanner and going back to reader selection'
      );

      resetCaptureProcess(false);
      setCaptureError(null);
      setCaptureFeedbackMsg('');
      setSelectedFinger(null); // Limpiar dedo seleccionado

      if (selectedScanner && browserSessionId) {
        console.log('[DEBUG] Releasing scanner:', selectedScanner);
        releaseReaderApiCall(selectedScanner, browserSessionId);
      }

      setCurrentStep(2);
      return;
    }

    if (currentStep === 5) {
      console.log(
        '[DEBUG] Step 5 → 2: Going back to reader selection for another registration'
      );
      setCurrentStep(2);
      resetCaptureProcess();
      setSelectedFinger(null);
      return;
    }

    console.log('[DEBUG] Setting step from', currentStep, 'to', newStep);
    setCurrentStep(newStep);
  };

  const handleFinish = () => {
    if (selectedScanner && browserSessionId) {
      releaseReaderApiCall(selectedScanner, browserSessionId);
    }
    router.push('/empleados');
  };

  const handleRegisterAnotherFinger = () => {
    setCurrentStep(3);
    resetCaptureProcess();
    setSelectedFinger(null);
  };

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <EnhancedCard
          variant='elevated'
          padding='none'
          className='max-w-4xl mx-auto'
        >
          <div className='p-6 md:p-8'>
            <div className='flex items-center gap-2 mb-6'>
              <Users className='h-6 w-6 text-primary' />
              <div>
                <h2 className='text-xl font-semibold text-foreground'>
                  Paso 1: Selección de Empleado
                </h2>
                <p className='text-muted-foreground text-sm'>
                  Seleccione o busque el empleado al que desea asignar la
                  huella.
                </p>
              </div>
            </div>

            <div className='space-y-6'>
              <div className='space-y-3'>
                <Label className='text-sm font-medium text-foreground'>
                  Buscar empleado
                </Label>
                <EmployeeSearch
                  value={selectedEmployee}
                  onChange={(emp) => setSelectedEmployee(emp)}
                  showAllOnOpen={true}
                />
              </div>

              {selectedEmployee && (
                <EnhancedCard
                  variant='bordered'
                  padding='md'
                  className='bg-primary/5 border-primary/20'
                >
                  <div className='flex items-center gap-4'>
                    <div className='h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20'>
                      <Users className='h-8 w-8 text-primary' />
                    </div>
                    <div className='flex-1'>
                      <h3 className='text-xl font-bold text-foreground'>
                        {selectedEmployee.nombreCompleto}
                      </h3>
                      <p className='text-muted-foreground'>
                        ID interno: {selectedEmployee.id}
                      </p>
                      <div className='mt-2'>
                        <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'>
                          ✓ Empleado seleccionado
                        </span>
                      </div>
                    </div>
                  </div>
                </EnhancedCard>
              )}
            </div>
          </div>

          <div className='border-t border-border bg-muted/30 px-6 md:px-8 py-4'>
            <div className='flex justify-between items-center'>
              <Link href='/empleados'>
                <Button
                  variant='outline'
                  className='border-2 border-border hover:border-primary hover:bg-primary/5'
                >
                  Cancelar
                </Button>
              </Link>
              <Button
                onClick={goToNextStep}
                disabled={!selectedEmployee}
                className='bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200'
              >
                Continuar
                <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            </div>
          </div>
        </EnhancedCard>
      );
    }

    if (currentStep === 2) {
      return (
        <Card className='max-w-3xl mx-auto'>
          <CardHeader>
            <CardTitle>Paso 2: Selección de Lector</CardTitle>
            <CardDescription>
              Elija el lector de huellas a utilizar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-6'>
              <div className='flex items-center gap-4 mb-6'>
                <div className='h-16 w-16 bg-muted rounded-full flex items-center justify-center'>
                  <Users className='h-8 w-8 text-primary' />
                </div>
                <div>
                  <h2 className='text-xl font-bold text-foreground'>
                    {selectedEmployee?.nombreCompleto}
                  </h2>
                  <p className='text-muted-foreground'>
                    ID interno: {selectedEmployee?.id}
                  </p>
                </div>
              </div>

              <div className='space-y-2'>
                <Label className='text-sm font-medium text-muted-foreground'>
                  Lector de Huellas
                </Label>
                <div className='flex gap-2'>
                  <Select
                    value={selectedScanner ?? ''}
                    onValueChange={handleSelectReaderChange}
                  >
                    <SelectTrigger className='flex-1'>
                      <SelectValue placeholder='Seleccionar lector...' />
                    </SelectTrigger>
                    <SelectContent>
                      {availableReaders.map((scanner) => (
                        <SelectItem
                          key={scanner.id}
                          value={scanner.id}
                          disabled={
                            scanner.status === 'reserved_other' ||
                            scanner.status === 'offline' ||
                            scanner.status === 'error'
                          }
                        >
                          {scanner.name}{' '}
                          {scanner.status === 'reserved_other' && ' (Ocupado)'}
                          {scanner.status === 'offline' && ' (Offline)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={fetchAvailableReaders}
                    disabled={isLoading}
                    aria-label='Refrescar lista de lectores'
                  >
                    {isLoading ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <RefreshCcw className='h-4 w-4' />
                    )}
                  </Button>
                </div>
                {selectedScanner && (
                  <div className='p-2 bg-primary/10 border border-primary/20 rounded-lg text-primary flex items-center gap-2'>
                    <CheckCircle className='h-5 w-5' />
                    Lector seleccionado: {selectedScanner}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className='flex justify-between'>
            <Button variant='outline' onClick={goToPreviousStep}>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Volver
            </Button>
            <Button onClick={goToNextStep} disabled={!selectedScanner}>
              Continuar
              <ArrowRight className='ml-2 h-4 w-4' />
            </Button>
          </CardFooter>
        </Card>
      );
    }

    if (currentStep === 3) {
      return (
        <Card className='max-w-4xl mx-auto'>
          <CardHeader className='pb-2'>
            <CardTitle>Paso 3: Selección de Dedo</CardTitle>
            <CardDescription className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
              <span className='inline-flex items-center'>
                <span className='inline-block w-3 h-3 rounded-full bg-green-600 border border-green-500 mr-1'></span>
                Ya registrado
              </span>
              <span className='inline-flex items-center'>
                <span className='inline-block w-3 h-3 rounded-full bg-accent border border-accent mr-1'></span>
                Registrado en esta sesión
              </span>
              <span className='inline-flex items-center'>
                <span className='inline-block w-3 h-3 rounded-full bg-primary border border-primary mr-1'></span>
                Seleccionado
              </span>
              <span className='inline-flex items-center'>
                <span className='inline-block w-3 h-3 rounded-full bg-muted-foreground border border-muted-foreground mr-1'></span>
                Disponible
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className='pt-2'>
            <div className='space-y-3'>
              <div className='flex items-center gap-3 mb-2 bg-muted/50 p-2 rounded-md'>
                <div className='h-12 w-12 bg-muted rounded-full flex items-center justify-center'>
                  <Users className='h-6 w-6 text-primary' />
                </div>
                <div>
                  <h2 className='text-lg font-bold text-foreground'>
                    {selectedEmployee?.nombreCompleto}
                  </h2>
                  <p className='text-xs text-muted-foreground'>
                    Lector: {selectedScanner}
                  </p>
                </div>
              </div>

              <HandSelector
                selectedFinger={selectedFinger}
                setSelectedFinger={handleFingerSelectChange}
                existingFingerIndices={existingHuellas
                  .map(
                    (h) => fingerNameToIndex[h.nombreDedo?.toUpperCase() ?? '']
                  )
                  .filter((i) => i > 0)}
                registeredThisSessionIndices={registeredThisSessionIndices}
              />

              {captureError && (
                <div className='p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-center gap-2'>
                  <AlertCircle className='h-4 w-4' /> {captureError}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className='flex justify-between pt-3'>
            <Button variant='outline' onClick={goToPreviousStep}>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Volver
            </Button>
            <Button onClick={goToNextStep} disabled={selectedFinger === null}>
              Continuar
              <ArrowRight className='ml-2 h-4 w-4' />
            </Button>
          </CardFooter>
        </Card>
      );
    }

    if (currentStep === 4) {
      return (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          <Card>
            <CardHeader>
              <CardTitle>Paso 4: Captura de Huella</CardTitle>
              <CardDescription>
                Completa {ENROLLMENT_STEPS_NEEDED} capturas para registrar la
                huella de{' '}
                {selectedFinger ? fingerIndexToName[selectedFinger] : '???'}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                <div className='flex items-center gap-4'>
                  <div className='h-16 w-16 bg-muted rounded-full flex items-center justify-center'>
                    <Users className='h-8 w-8 text-primary' />
                  </div>
                  <div>
                    <h2 className='text-xl font-bold text-foreground'>
                      {selectedEmployee?.nombreCompleto}
                    </h2>
                    <p className='text-muted-foreground'>
                      Dedo:{' '}
                      {selectedFinger ? fingerIndexToName[selectedFinger] : ''}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className='text-lg font-medium mb-3'>Progreso</h3>
                  <div className='flex justify-between items-center gap-2'>
                    {Array.from({
                      length: ENROLLMENT_STEPS_NEEDED,
                    }).map((_, index) => {
                      const stepDone = captureProgress > index;
                      const stepActive =
                        captureState === 'capturing' &&
                        captureProgress === index;
                      return (
                        <motion.div
                          key={index}
                          className={`h-3 flex-1 rounded-full ${
                            stepDone
                              ? 'bg-green-500'
                              : stepActive
                                ? 'bg-primary animate-pulse'
                                : 'bg-muted'
                          }`}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className='min-h-[4rem] p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/30 rounded-lg text-center flex items-center justify-center'>
                  {captureError ? (
                    <div className='flex items-center gap-2'>
                      <AlertCircle className='h-5 w-5 text-destructive' />
                      <p className='text-destructive font-medium'>
                        {captureError}
                      </p>
                    </div>
                  ) : (
                    <div className='flex items-center gap-2'>
                      {(captureState === 'saving' ||
                        captureState === 'capturing' ||
                        captureState === 'reserving' ||
                        captureState === 'starting_enroll') && (
                        <Loader2 className='h-5 w-5 animate-spin text-primary' />
                      )}
                      {captureState === 'ready_to_capture' && (
                        <Fingerprint className='h-5 w-5 text-primary animate-pulse' />
                      )}
                      {(captureState === 'save_success' ||
                        captureState === 'enroll_complete') && (
                        <CheckCircle className='h-5 w-5 text-green-600' />
                      )}
                      <p className='text-base font-medium text-foreground'>
                        {captureFeedbackMsg || 'Preparando...'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className='flex justify-between'>
              <Button
                variant='outline'
                onClick={goToPreviousStep}
                disabled={
                  isLoading ||
                  captureState === 'saving' ||
                  captureState === 'save_success' ||
                  captureState === 'enroll_complete'
                }
              >
                <ArrowLeft className='mr-2 h-4 w-4' />
                Volver
              </Button>

              {captureState === 'save_failed' ? (
                <Button
                  onClick={handleRetrySave}
                  disabled={isLoading}
                  variant='secondary'
                >
                  <RefreshCcw className='mr-2 h-4 w-4' />
                  Reintentar
                </Button>
              ) : (
                <Button
                  onClick={goToNextStep}
                  disabled={
                    captureState !== 'save_success' &&
                    captureState !== 'enroll_complete' &&
                    captureState !== ('save_failed' as CaptureStepState)
                  }
                >
                  Continuar
                  <ArrowRight className='ml-2 h-4 w-4' />
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Escáner de Huella</CardTitle>
              <CardDescription>Lector: {selectedScanner}</CardDescription>
            </CardHeader>
            <CardContent className='flex flex-col items-center justify-center py-8'>
              <div className='relative mb-6 flex h-64 w-64 items-center justify-center'>
                <svg
                  className='absolute h-56 w-56'
                  viewBox='0 0 100 100'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <g
                    className='fingerprint-base'
                    stroke={
                      captureState === 'capture_success' ||
                      captureState === 'save_success' ||
                      captureState === 'enroll_complete'
                        ? 'hsl(142 76% 36% / 0.3)'
                        : captureState === 'capture_failed' ||
                            captureState === 'save_failed' ||
                            captureState === 'error'
                          ? 'hsl(var(--destructive) / 0.3)'
                          : 'hsl(var(--primary) / 0.3)'
                    }
                    fill='none'
                    strokeWidth='2'
                  >
                    <path d='M50,15 C25,15 15,30 15,50 C15,70 25,85 50,85 C75,85 85,70 85,50 C85,30 75,15 50,15 Z' />
                    <path d='M50,20 C30,20 20,35 20,50 C20,65 30,80 50,80 C70,80 80,65 80,50 C80,35 70,20 50,20 Z' />
                    <path d='M50,25 C35,25 25,35 25,50 C25,65 35,75 50,75 C65,75 75,65 75,50 C75,35 65,25 50,25 Z' />
                    <path d='M50,30 C37,30 30,40 30,50 C30,60 37,70 50,70 C63,70 70,60 70,50 C70,40 63,30 50,30 Z' />
                    <path d='M50,35 C40,35 35,42 35,50 C35,58 40,65 50,65 C60,65 65,58 65,50 C65,42 60,35 50,35 Z' />
                    <path d='M50,40 C42,40 40,45 40,50 C40,55 42,60 50,60 C58,60 60,55 60,50 C60,45 58,40 50,40 Z' />
                    <path d='M50,45 C45,45 45,47 45,50 C45,53 45,55 50,55 C55,55 55,53 55,50 C55,47 55,45 50,45 Z' />
                  </g>
                </svg>

                {(captureState === 'idle' ||
                  captureState === 'ready_to_capture') && (
                  <>
                    <motion.div
                      className='absolute h-56 w-56 rounded-full bg-primary/10'
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.7, 0.5, 0.7],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: 'easeInOut',
                      }}
                    />
                    <motion.div
                      className='absolute'
                      animate={{
                        opacity: [0.7, 1, 0.7],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: 'easeInOut',
                      }}
                    >
                      <Fingerprint className='h-36 w-36 text-primary/80' />
                    </motion.div>
                  </>
                )}

                {captureState === 'capturing' && (
                  <>
                    <motion.div
                      className='absolute h-1.5 rounded-full bg-primary/70'
                      style={{ width: '80%' }}
                      initial={{ y: 50, opacity: 0 }}
                      animate={{
                        y: [-40, 40],
                        opacity: [0.2, 0.8, 0.2],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: 'reverse',
                      }}
                    />

                    <motion.div
                      className='absolute h-56 w-56 rounded-full bg-primary/5'
                      animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.2, 0.4, 0.2],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: 'reverse',
                      }}
                    />
                  </>
                )}

                {(captureState === 'capture_success' ||
                  captureState === 'save_success' ||
                  captureState === 'enroll_complete') && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 15,
                      duration: 0.2,
                    }}
                  >
                    <CheckCircle className='h-32 w-32 text-green-500' />
                  </motion.div>
                )}

                {(captureState === 'capture_failed' ||
                  captureState === 'save_failed' ||
                  captureState === 'error') && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 15,
                      duration: 0.2,
                    }}
                  >
                    <XCircle className='h-32 w-32 text-red-500' />
                  </motion.div>
                )}

                {lastCapturedImage && (
                  <motion.div
                    className='absolute inset-0 flex items-center justify-center'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={lastCapturedImage || '/placeholder.svg'}
                      alt='Huella capturada'
                      className='max-h-full max-w-full object-contain'
                    />
                  </motion.div>
                )}
              </div>

              <div className='text-center mb-6'>
                <p className='text-xl font-medium text-foreground'>
                  {captureState === 'idle' && 'Listo para iniciar captura'}
                  {captureState === 'ready_to_capture' &&
                    'Coloque el dedo en el lector'}
                  {captureState === 'capturing' && 'Escaneando huella...'}
                  {captureState === 'capture_success' &&
                    'Huella capturada correctamente'}
                  {captureState === 'capture_failed' &&
                    'Error al capturar la huella'}
                  {captureState === 'enroll_complete' &&
                    '¡Enrolamiento completado!'}
                  {captureState === 'save_success' &&
                    '¡Huella guardada con éxito!'}
                  {captureState === 'save_failed' &&
                    'Error al guardar la huella'}
                  {captureState === 'error' && 'Error en el proceso'}
                </p>
              </div>

              {captureState === 'save_success' ||
              captureState === 'enroll_complete' ? (
                <div className='flex flex-col gap-3 items-center'>
                  <Button
                    className='bg-green-600 hover:bg-green-700 text-white w-48'
                    onClick={goToNextStep}
                  >
                    <CheckCircle className='mr-2 h-5 w-5' />
                    ¡Continuar!
                  </Button>
                  <p className='text-sm text-green-600 text-center'>
                    Huella registrada exitosamente
                  </p>
                </div>
              ) : captureState === 'save_failed' ? (
                <div className='flex flex-col gap-3 items-center'>
                  <Button
                    variant='secondary'
                    className='w-48'
                    onClick={handleRetrySave}
                    disabled={isLoading}
                  >
                    <RefreshCcw className='mr-2 h-5 w-5' />
                    Reintentar Guardado
                  </Button>
                  <p className='text-sm text-muted-foreground text-center'>
                    Error al guardar, intente nuevamente
                  </p>
                </div>
              ) : (
                <Button
                  className='w-48'
                  onClick={handleCapture}
                  disabled={captureState !== 'ready_to_capture' || isLoading}
                >
                  {isLoading && captureState === 'capturing' ? (
                    <Loader2 className='animate-spin mr-2' />
                  ) : (
                    <Fingerprint className='mr-2 h-5 w-5' />
                  )}
                  {isLoading && captureState === 'capturing'
                    ? 'Capturando...'
                    : captureProgress === 0
                      ? 'Iniciar Captura'
                      : 'Capturar Nuevamente'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    if (currentStep === 5) {
      return (
        <Card className='max-w-3xl mx-auto'>
          <CardHeader className='text-center'>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className='mx-auto mb-2'
            >
              <CheckCircle className='h-12 w-12 text-green-600' />
            </motion.div>
            <CardTitle>¡Éxito!</CardTitle>
            <CardDescription>Huella registrada correctamente.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col items-center justify-center py-4'>
              <h2 className='text-xl font-bold mb-2 text-foreground'>
                Empleado: {selectedEmployee?.nombreCompleto}
              </h2>
              <p className='text-muted-foreground mb-6'>
                Se registró el dedo:{' '}
                {selectedFinger ? fingerIndexToName[selectedFinger] : '???'}
              </p>

              <div className='bg-muted/50 rounded-lg p-6 w-full max-w-md mb-6'>
                <div className='flex items-center gap-4 mb-4'>
                  <div className='h-16 w-16 bg-muted rounded-full flex items-center justify-center'>
                    <Fingerprint className='h-8 w-8 text-primary' />
                  </div>
                  <div>
                    <h3 className='text-xl font-bold text-foreground'>
                      {selectedEmployee?.nombreCompleto}
                    </h3>
                    <p className='text-muted-foreground'>
                      ID interno: {selectedEmployee?.id}
                    </p>
                  </div>
                </div>

                <div className='space-y-2 text-sm text-muted-foreground'>
                  <p>
                    <span className='font-medium text-foreground'>
                      Lector utilizado:
                    </span>{' '}
                    {selectedScanner}
                  </p>
                  <p>
                    <span className='font-medium text-foreground'>
                      Dedos registrados en esta sesión:
                    </span>{' '}
                    {registeredThisSessionIndices.length}
                  </p>
                  <div className='flex flex-wrap gap-1 mt-2'>
                    {registeredThisSessionIndices.map((finger) => (
                      <span
                        key={finger}
                        className='px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs'
                      >
                        {fingerIndexToName[finger]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className='flex justify-center gap-3'>
            <Button variant='outline' onClick={handleRegisterAnotherFinger}>
              Registrar Otro Dedo
            </Button>
            <Button variant='outline' onClick={handleFinish}>
              Finalizar
            </Button>
            <Link href='/'>
              <Button variant='ghost'>Inicio</Button>
            </Link>
          </CardFooter>
        </Card>
      );
    }

    return <p className='text-center'>Paso desconocido.</p>;
  };

  //
  // --------------------- Render Principal ---------------------
  //

  const STEPS = [
    { label: 'Empleado' },
    { label: 'Lector' },
    { label: 'Dedo' },
    { label: 'Captura' },
    { label: 'Finalizado' },
  ];

  return (
    <div className='min-h-screen bg-background'>
      <div className='p-6 md:p-8'>
        <div className='max-w-6xl mx-auto space-y-6'>
          {/* Header mejorado */}
          <EnhancedCard variant='elevated' padding='lg'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
              <div className='space-y-1'>
                <h1 className='text-2xl md:text-3xl font-bold text-foreground tracking-tight'>
                  Asignar Huella Digital
                </h1>
                <div className='h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full'></div>
              </div>
            </div>
          </EnhancedCard>

          {/* Stepper (diseño V2) */}
          <WizardStepper
            steps={STEPS}
            currentStep={currentStep}
            className='mb-8'
          />

          {/* Mensaje de error general */}
          {generalError && currentStep !== 4 && (
            <EnhancedCard
              variant='elevated'
              padding='md'
              className='border-red-200/60 dark:border-red-800'
            >
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-red-100 rounded-lg dark:bg-red-900/30'>
                  <AlertCircle className='h-5 w-5 text-red-600 dark:text-red-400' />
                </div>
                <div className='flex-1'>
                  <p className='text-red-800 dark:text-red-300 font-medium'>
                    Error
                  </p>
                  <p className='text-red-700 dark:text-red-400 text-sm'>
                    {generalError}
                  </p>
                </div>
                <button
                  className='text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors'
                  onClick={() => setGeneralError(null)}
                  title='Cerrar'
                >
                  <XCircle className='h-5 w-5' />
                </button>
              </div>
            </EnhancedCard>
          )}

          {/* Mensaje cuando no hay lectores disponibles */}
          {currentStep === 2 &&
            availableReaders.length === 0 &&
            !isLoading &&
            !generalError && (
              <EnhancedCard
                variant='elevated'
                padding='md'
                className='border-yellow-200/60 dark:border-yellow-800'
              >
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-yellow-100 rounded-lg dark:bg-yellow-900/30'>
                    <AlertCircle className='h-5 w-5 text-yellow-600 dark:text-yellow-400' />
                  </div>
                  <div>
                    <p className='text-yellow-800 dark:text-yellow-300 font-medium'>
                      Sin lectores disponibles
                    </p>
                    <p className='text-yellow-700 dark:text-yellow-400 text-sm'>
                      Conecte un lector y presione el botón de refrescar.
                    </p>
                  </div>
                </div>
              </EnhancedCard>
            )}

          {/* Transición de paso */}
          <AnimatePresence mode='wait'>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

//
// Export principal con Suspense
//
export default function AsignarHuellaPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-background flex items-center justify-center'>
          <EnhancedCard variant='elevated' padding='xl'>
            <div className='flex flex-col items-center space-y-4'>
              <div className='relative'>
                <div className='absolute inset-0 rounded-full bg-primary/30 animate-ping'></div>
                <Loader2 className='relative h-10 w-10 animate-spin text-primary' />
              </div>
              <div className='text-center space-y-1'>
                <p className='text-lg font-medium text-foreground'>
                  Cargando sistema de huellas...
                </p>
                <p className='text-sm text-muted-foreground'>
                  Preparando el entorno de captura
                </p>
              </div>
            </div>
          </EnhancedCard>
        </div>
      }
    >
      <AsignarHuellaContent />
    </Suspense>
  );
}
