"use client";

import React, {
    useState,
    useEffect,
    useCallback,
    useRef,
    Suspense,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Link from "next/link";
import axios from "axios";
import SockJS from "sockjs-client";
import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";

// Imports UI Shadcn
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

// Iconos
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
} from "lucide-react";

// Animaciones
import { motion, AnimatePresence } from "framer-motion";

// Librería local (ejemplo) para obtener sessionId de navegador
import { getBrowserSessionId } from "@/lib/sessionId";

// Import the new HandSelector component
import { HandSelector, fingerIndexToName } from "./components/hand-selector";

//
// --------------------- Tipos y Constantes ---------------------
//

// Tipos para lectores
type ScannerStatus =
    | "online"
    | "offline"
    | "error"
    | "reserved_other"
    | "reserved_this";

interface FingerprintScanner {
    id: string;
    name: string;
    status: ScannerStatus;
}

// Tipo empleado simplificado
interface EmployeeSimple {
    id: string;
    nombre: string;
}

// Respuesta de enrolamiento
interface EnrollmentResponse {
    complete: boolean;
    remaining?: number;
    template?: string;
}

// Info de huella ya registrada en el backend
interface HuellaInfo {
    id: number;
    nombreDedo: string | null;
    uuid?: string;
}

// Estado de la captura (proceso)
type CaptureStepState =
    | "idle"
    | "initializing"
    | "awaiting_reserve"
    | "reserving"
    | "starting_enroll"
    | "ready_to_capture"
    | "capturing"
    | "capture_success"
    | "capture_failed"
    | "enroll_complete"
    | "saving"
    | "save_success"
    | "save_failed"
    | "error";

// Para la búsqueda de empleados (ejemplo)
interface EmployeeSearchItem {
    id: string;
    nombre: string;
    numeroTarjeta?: string;
    area?: string;
}

//
// Constantes
//
const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

// A cuántas "capturas" se deben realizar para registrar la huella
const ENROLLMENT_STEPS_NEEDED = 4;

// Mapeos dedo <-> índice
const fingerNameToIndex: Record<string, number> = {
    "PULGAR DERECHO": 1,
    "ÍNDICE DERECHO": 2,
    "MEDIO DERECHO": 3,
    "ANULAR DERECHO": 4,
    "MEÑIQUE DERECHO": 5,
    "PULGAR IZQUIERDO": 6,
    "ÍNDICE IZQUIERDO": 7,
    "MEDIO IZQUIERDO": 8,
    "ANULAR IZQUIERDO": 9,
    "MEÑIQUE IZQUIERDO": 10,
};

//
// --------------------- Componente Principal ---------------------
//

function AsignarHuellaContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    //
    // -------- Estados generales y Stepper --------
    //
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [browserSessionId, setBrowserSessionId] = useState("");

    //
    // -------- Empleado --------
    //
    const [selectedEmployee, setSelectedEmployee] =
        useState<EmployeeSimple | null>(null);

    // Para el combobox de empleados:
    const [employeeSearchValue, setEmployeeSearchValue] = useState("");
    const [employeesFound, setEmployeesFound] = useState<EmployeeSearchItem[]>(
        []
    );
    const [isSearching, setIsSearching] = useState(false);
    const [openEmployeePopover, setOpenEmployeePopover] = useState(false);

    //
    // -------- Lectores de huella --------
    //
    const [availableReaders, setAvailableReaders] = useState<
        FingerprintScanner[]
    >([]);
    const [selectedScanner, setSelectedScanner] = useState<string | null>(null);

    //
    // -------- Dedo seleccionado y huellas existentes --------
    //
    const [selectedFinger, setSelectedFinger] = useState<number | null>(null);
    const [existingHuellas, setExistingHuellas] = useState<HuellaInfo[]>([]);
    const [registeredThisSessionIndices, setRegisteredThisSessionIndices] =
        useState<number[]>([]);

    //
    // -------- Proceso de captura / enrolamiento --------
    //
    const [captureState, setCaptureState] = useState<CaptureStepState>("idle");
    const [captureProgress, setCaptureProgress] = useState(0);
    const [captureFeedbackMsg, setCaptureFeedbackMsg] = useState<string>("");
    const [captureError, setCaptureError] = useState<string | null>(null);

    const [enrollmentSessionId, setEnrollmentSessionId] = useState<
        string | null
    >(null);
    const [finalTemplateBase64, setFinalTemplateBase64] = useState<
        string | null
    >(null);

    // Para mostrar la imagen en vivo de la huella
    const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(
        null
    );

    // Para STOMP/WebSocket
    const stompClient = useRef<Client | null>(null);
    const imageSubscription = useRef<StompSubscription | null>(null);
    const isUnmounting = useRef(false);
    const currentEnrollmentAttemptId = useRef<string | null>(null);

    //
    // --------------------- Funciones de API ---------------------
    //

    // Buscar empleados por texto
    const searchEmployees = useCallback(async (query: string) => {
        if (query.trim().length < 2 && query.trim().length !== 0) {
            // No buscar si es muy corto, pero sí si está vacío
            setEmployeesFound([]);
            return;
        }

        setIsSearching(true);
        setGeneralError(null);

        try {
            const endpoint = query.trim()
                ? `${API_BASE_URL}/api/empleados?search=${encodeURIComponent(
                      query
                  )}`
                : `${API_BASE_URL}/api/empleados`; // Endpoint para obtener todos

            const response = await axios.get(endpoint);

            const data = response.data.map((emp: any) => ({
                id: emp.id.toString(),
                nombre: `${emp.primerNombre || ""} ${emp.segundoNombre || ""} ${
                    emp.primerApellido || ""
                } ${emp.segundoApellido || ""}`.trim(),
                numeroTarjeta: emp.id,
                area:
                    emp.departamentoAcademico?.nombre ||
                    emp.departamentoAdministrativo?.nombre ||
                    "N/A",
            }));

            setEmployeesFound(data);
        } catch (error) {
            console.error("Error buscando empleados:", error);
            setGeneralError("No se pudieron buscar los empleados.");
            setEmployeesFound([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const fetchInitialEmployees = useCallback(async () => {
        setIsSearching(true);
        setGeneralError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/empleados`);
            const data = response.data.map((emp: any) => ({
                id: emp.id.toString(),
                nombre: `${emp.primerNombre || ""} ${emp.segundoNombre || ""} ${
                    emp.primerApellido || ""
                } ${emp.segundoApellido || ""}`.trim(),
                numeroTarjeta: emp.id,
                area:
                    emp.departamentoAcademico?.nombre ||
                    emp.departamentoAdministrativo?.nombre ||
                    "N/A",
            }));
            setEmployeesFound(data);
        } catch (error) {
            console.error("Error cargando empleados iniciales:", error);
            setGeneralError("No se pudieron cargar los empleados.");
        } finally {
            setIsSearching(false);
        }
    }, []);

    //
    // --------------------- UseEffects ---------------------
    //

    // 1) Al montar, obtener sessionID e intentar ver si tenemos "id" y "nombre" por searchParams
    useEffect(() => {
        isUnmounting.current = false;
        const sid = getBrowserSessionId();
        setBrowserSessionId(sid);

        const empIdStr = searchParams.get("id");
        const empName = searchParams.get("nombre");
        let validId = false;
        if (empIdStr && /^\d+$/.test(empIdStr)) {
            validId = true;
        }

        if (empIdStr && empName && validId) {
            // Ya viene un empleado por URL
            setSelectedEmployee({ id: empIdStr, nombre: empName });
            setCurrentStep(2);
            // Cargar huellas existentes
            fetchExistingHuellas(Number.parseInt(empIdStr, 10));
        } else {
            // Mostramos Step 1 (buscar/seleccionar) si no hay data en URL
            fetchInitialEmployees();
            setCurrentStep(1);
        }

        return () => {
            isUnmounting.current = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 2) Si (ya) tenemos un empleado seleccionado, cargar sus huellas
    //    Se hace al montar cuando viene ID en URL, o al elegir en combobox
    useEffect(() => {
        if (selectedEmployee && selectedEmployee.id !== "nuevo") {
            const numericId = Number.parseInt(selectedEmployee.id, 10);
            if (!isNaN(numericId)) {
                fetchExistingHuellas(numericId);
            }
        }
    }, [selectedEmployee]);

    // 3) Cargar lectores cuando estemos en Step >= 2
    useEffect(() => {
        if (currentStep >= 2 && browserSessionId) {
            fetchAvailableReaders();
        }
    }, [currentStep, browserSessionId]);

    // 4) Conectar WebSocket para imágenes cuando tengamos un lector
    useEffect(() => {
        if (selectedScanner && browserSessionId) {
            connectWebSocketForImages();
        } else {
            disconnectWebSocketForImages();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedScanner, browserSessionId]);

    // 5) Iniciar el proceso de enrolamiento al llegar a Step 4
    useEffect(() => {
        console.log("[DEBUG] Enrollment useEffect triggered:", {
            currentStep,
            selectedScanner,
            selectedFinger,
            captureState,
            timestamp: new Date().toISOString()
        });

        if (
            currentStep === 4 &&
            selectedScanner &&
            selectedFinger !== null &&
            captureState === "idle"
        ) {
            console.log("[DEBUG] Enrollment conditions met, checking finger registration");
            
            const alreadyReg = existingHuellas.map((h) => {
                const i = fingerNameToIndex[h.nombreDedo?.toUpperCase() || ""];
                return i || -1;
            });

            console.log("[DEBUG] Finger registration check:", {
                selectedFinger,
                alreadyRegistered: alreadyReg,
                registeredThisSession: registeredThisSessionIndices,
                isAlreadyRegistered: alreadyReg.includes(selectedFinger) || registeredThisSessionIndices.includes(selectedFinger)
            });

            if (
                alreadyReg.includes(selectedFinger) ||
                registeredThisSessionIndices.includes(selectedFinger)
            ) {
                console.log("[DEBUG] Finger already registered, setting error state");
                setCaptureState("error");
                setCaptureError("Este dedo ya está registrado.");
                setCaptureFeedbackMsg("Seleccione otro dedo.");
            } else {
                console.log("[DEBUG] Initiating enrollment process for finger:", selectedFinger);
                initiateEnrollmentProcess();
            }
        } else {
            console.log("[DEBUG] Enrollment conditions not met:", {
                stepIs4: currentStep === 4,
                hasScanner: !!selectedScanner,
                hasFingerSelected: selectedFinger !== null,
                captureStateIsIdle: captureState === "idle"
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep, selectedScanner, selectedFinger, captureState]);

    //
    // --------------------- Funciones ---------------------
    //

    // Carga huellas existentes
    const fetchExistingHuellas = useCallback(async (empId: number) => {
        setIsLoading(true);
        try {
            const response = await axios.get<HuellaInfo[]>(
                `${API_BASE_URL}/api/empleados/${empId}/huellas`
            );
            setExistingHuellas(response.data);
        } catch (err) {
            console.error("Error cargando huellas existentes:", err);
            setGeneralError("No se pudieron cargar las huellas existentes.");
            setExistingHuellas([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Carga lista de lectores (y su estado)
    const fetchAvailableReaders = useCallback(async () => {
        if (!browserSessionId) return;
        setIsLoading(true);
        setGeneralError(null);
        try {
            // Llamada que obtiene TODOS los lectores (incluyendo reservados)
            const allReadersResponse = await axios.get<string[]>(
                `${API_BASE_URL}/api/v1/multi-fingerprint/auto-select`
            );
            const allReaderNames = allReadersResponse.data || [];

            // Llamada que obtiene solamente los disponibles
            const availableResponse = await axios.get<string[]>(
                `${API_BASE_URL}/api/v1/multi-fingerprint/readers`
            );
            const availableReaderNames = new Set(availableResponse.data || []);

            const currentSelected = selectedScanner;
            const readersWithStatus = allReaderNames.map((name) => {
                let status: ScannerStatus;
                if (name === currentSelected) {
                    status = "reserved_this";
                } else if (availableReaderNames.has(name)) {
                    status = "online";
                } else {
                    status = "reserved_other";
                }
                return { id: name, name: name, status };
            });

            setAvailableReaders(readersWithStatus);

            // Validar lector actual si cambió el estado
            const stillValid = readersWithStatus.some(
                (r) =>
                    r.name === currentSelected &&
                    (r.status === "online" || r.status === "reserved_this")
            );
            if (currentSelected && !stillValid) {
                console.warn(`El lector ${currentSelected} ya no está válido.`);
                setSelectedScanner(null);
                resetCaptureProcess();
            }
        } catch (err: any) {
            console.error("Error fetching readers:", err);
            setGeneralError(
                err.response?.data ||
                    err.message ||
                    "Error al obtener lectores de huella."
            );
            setAvailableReaders([]);
            setSelectedScanner(null);
        } finally {
            setIsLoading(false);
        }
    }, [browserSessionId, selectedScanner]);

    // Reservar un lector
    const reserveReaderApiCall = useCallback(
        async (readerName: string, sessionId: string): Promise<boolean> => {
            try {
                await axios.post(
                    `${API_BASE_URL}/api/v1/multi-fingerprint/reserve/${encodeURIComponent(
                        readerName
                    )}?sessionId=${sessionId}`
                );
                setAvailableReaders((prev) =>
                    prev.map((r) =>
                        r.name === readerName
                            ? { ...r, status: "reserved_this" }
                            : r
                    )
                );
                return true;
            } catch (error: any) {
                console.error(`Error reservando lector ${readerName}:`, error);
                const backendError =
                    error.response?.data ||
                    error.message ||
                    "Error desconocido al reservar lector.";
                setCaptureError(`Error al reservar lector: ${backendError}`);
                setCaptureState("error");
                fetchAvailableReaders();
                return false;
            }
        },
        [fetchAvailableReaders]
    );

    // Liberar un lector
    const releaseReaderApiCall = useCallback(
        async (readerName: string, sessionId: string) => {
            try {
                const url = `${API_BASE_URL}/api/v1/multi-fingerprint/release/${encodeURIComponent(
                    readerName
                )}?sessionId=${sessionId}`;
                if (navigator.sendBeacon && isUnmounting.current) {
                    navigator.sendBeacon(url);
                } else {
                    await axios.post(url);
                }
                setAvailableReaders((prev) =>
                    prev.map((r) =>
                        r.name === readerName ? { ...r, status: "online" } : r
                    )
                );
                if (readerName === selectedScanner) {
                    setSelectedScanner(null);
                }
            } catch (error) {
                console.warn(`No se pudo liberar lector ${readerName}:`, error);
                // Forzamos a asumirlo liberado
                setAvailableReaders((prev) =>
                    prev.map((r) =>
                        r.name === readerName ? { ...r, status: "online" } : r
                    )
                );
                if (readerName === selectedScanner) {
                    setSelectedScanner(null);
                }
            }
        },
        [selectedScanner]
    );

    // Al cambiar el lector en el Select
    const handleSelectReaderChange = (newReaderName: string) => {
        if (isLoading || newReaderName === selectedScanner) return;
        const prev = selectedScanner;
        const newScannerData = availableReaders.find(
            (r) => r.name === newReaderName
        );
        if (newScannerData?.status === "reserved_other") {
            setGeneralError(`El lector ${newReaderName} está ocupado.`);
            return;
        }
        setSelectedScanner(newReaderName);
        resetCaptureProcess();
        // Liberamos el anterior
        if (prev && browserSessionId) {
            releaseReaderApiCall(prev, browserSessionId);
        }
    };

    // Seleccionar dedo (resetear proceso de captura anterior)
    const handleFingerSelectChange = useCallback(
        (fingerIndex: number | null) => {
            console.log("[DEBUG] handleFingerSelectChange called:", {
                previousFinger: selectedFinger,
                newFinger: fingerIndex,
                currentCaptureState: captureState,
                timestamp: new Date().toISOString()
            });

            // Always reset capture state when finger selection changes
            // This ensures proper cleanup of any previous capture attempts
            resetCaptureProcess();
            setSelectedFinger(fingerIndex);
            setCaptureError(null);

            if (fingerIndex !== null) {
                const existingIndices = existingHuellas.map(
                    (h) =>
                        fingerNameToIndex[h.nombreDedo?.toUpperCase() ?? ""] ??
                        -1
                );
                
                console.log("[DEBUG] Finger validation:", {
                    selectedFinger: fingerIndex,
                    existingIndices,
                    registeredThisSession: registeredThisSessionIndices,
                    isAlreadyRegistered: existingIndices.includes(fingerIndex) || registeredThisSessionIndices.includes(fingerIndex)
                });

                if (
                    existingIndices.includes(fingerIndex) ||
                    registeredThisSessionIndices.includes(fingerIndex)
                ) {
                    console.log("[DEBUG] Finger already registered, showing error");
                    setCaptureError("Dedo ya registrado.");
                    setCaptureFeedbackMsg("Seleccione otro dedo.");
                } else {
                    console.log("[DEBUG] Finger available for registration");
                    setCaptureFeedbackMsg(
                        `Listo para registrar: ${fingerIndexToName[fingerIndex]}`
                    );
                }
            } else {
                console.log("[DEBUG] No finger selected, clearing feedback");
                setCaptureFeedbackMsg("");
            }
        },
        [existingHuellas, registeredThisSessionIndices, selectedFinger, captureState]
    );

    //
    // --------------------- Lógica de enrolamiento/captura ---------------------
    //

    // Iniciar el proceso
    const initiateEnrollmentProcess = useCallback(async () => {
        if (
            !selectedScanner ||
            selectedFinger === null ||
            !browserSessionId ||
            captureState !== "idle"
        ) {
            return;
        }
        const attemptId = `enroll-${selectedFinger}-${Date.now()}`;
        currentEnrollmentAttemptId.current = attemptId;

        setCaptureState("reserving");
        setCaptureError(null);
        setCaptureFeedbackMsg("Reservando lector...");
        setIsLoading(true);

        const ok = await reserveReaderApiCall(
            selectedScanner,
            browserSessionId
        );
        if (currentEnrollmentAttemptId.current !== attemptId || !ok) {
            // Cancelado u obsoleto
            setIsLoading(false);
            if (captureState === ("reserving" as CaptureStepState))
                setCaptureState("idle");
            return;
        }

        setCaptureState("starting_enroll");
        setCaptureFeedbackMsg("Iniciando enrolamiento...");
        try {
            const resp = await axios.post<{ sessionId: string }>(
                `${API_BASE_URL}/api/v1/multi-fingerprint/enroll/start/${encodeURIComponent(
                    selectedScanner
                )}?sessionId=${browserSessionId}`
            );
            const enrollId = resp.data.sessionId;
            if (!enrollId) throw new Error("El backend no devolvió sessionId.");
            if (currentEnrollmentAttemptId.current !== attemptId) {
                // obsoleto
                releaseReaderApiCall(selectedScanner, browserSessionId);
                setIsLoading(false);
                setCaptureState("idle");
                return;
            }
            setEnrollmentSessionId(enrollId);
            setCaptureProgress(0);
            setCaptureState("ready_to_capture");
            setCaptureFeedbackMsg(
                `Coloque ${fingerIndexToName[selectedFinger]} (1/${ENROLLMENT_STEPS_NEEDED})`
            );
        } catch (err: any) {
            console.error("Error iniciando enrolamiento:", err);
            const backendError = err.response?.data || err.message || "Error.";
            setCaptureError(`Error: ${backendError}`);
            setCaptureState("error");
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

    // Guardar huella en backend
    const saveFingerprint = useCallback(
        async (templateBase64: string) => {
            if (!selectedEmployee || selectedFinger === null) return;
            const empIdNum = Number.parseInt(selectedEmployee.id, 10);
            if (isNaN(empIdNum)) {
                setCaptureError("ID de empleado inválido.");
                setCaptureState("error");
                return;
            }
            setCaptureState("saving");
            setCaptureFeedbackMsg("Guardando huella en servidor...");
            setIsLoading(true);
            setCaptureError(null);

            const dedoNombre = fingerIndexToName[selectedFinger].toUpperCase();
            try {
                const resp = await axios.post(
                    `${API_BASE_URL}/api/empleados/${empIdNum}/huellas`,
                    {
                        nombreDedo: dedoNombre,
                        templateBase64: templateBase64,
                    }
                );
                if (resp.status === 201) {
                    setCaptureState("save_success");
                    setCaptureFeedbackMsg(
                        `¡Huella de ${dedoNombre} registrada con éxito!`
                    );
                    if (
                        !registeredThisSessionIndices.includes(selectedFinger)
                    ) {
                        setRegisteredThisSessionIndices((prev) =>
                            [...prev, selectedFinger].sort((a, b) => a - b)
                        );
                    }
                    setFinalTemplateBase64(null);
                    setEnrollmentSessionId(null);
                    currentEnrollmentAttemptId.current = null;
                    // Pasamos al step 5 después de un breve delay
                    setTimeout(() => {
                        if (captureState === "save_success") {
                            setCurrentStep(5);
                        }
                    }, 1500);
                } else {
                    throw new Error(`Respuesta inesperada: ${resp.status}`);
                }
            } catch (err: any) {
                console.error("Error guardando huella:", err);
                const backendErr =
                    err.response?.data?.message ||
                    err.response?.data ||
                    err.message ||
                    "Error desconocido.";
                setCaptureError(`Error al guardar: ${backendErr}`);
                setCaptureState("save_failed");
                setCaptureFeedbackMsg("Fallo al guardar. Reintente o cancele.");
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

    // Capturar un paso
    const handleCapture = useCallback(async () => {
        if (
            captureState !== "ready_to_capture" ||
            !selectedScanner ||
            !enrollmentSessionId ||
            !selectedFinger
        ) {
            return;
        }
        const attemptId = `capture-${enrollmentSessionId}-${captureProgress}`;
        currentEnrollmentAttemptId.current = attemptId;

        setCaptureState("capturing");
        setCaptureError(null);
        setCaptureFeedbackMsg(
            `Capturando (${captureProgress + 1}/${ENROLLMENT_STEPS_NEEDED})...`
        );
        setIsLoading(true);
        setLastCapturedImage(null);

        try {
            const response = await axios.post<EnrollmentResponse>(
                `${API_BASE_URL}/api/v1/multi-fingerprint/enroll/capture/${encodeURIComponent(
                    selectedScanner
                )}/${encodeURIComponent(enrollmentSessionId)}`
            );
            const data = response.data;
            if (currentEnrollmentAttemptId.current !== attemptId) {
                // obsoleto
                setIsLoading(false);
                return;
            }
            const nextProgress = captureProgress + 1;
            setCaptureProgress(nextProgress);

            if (data.complete && data.template) {
                // completado
                setCaptureState("enroll_complete");
                setCaptureFeedbackMsg("¡Captura completa! Guardando huella...");
                setFinalTemplateBase64(data.template);
                await saveFingerprint(data.template);
            } else if (!data.complete) {
                setCaptureState("capture_success");
                setCaptureFeedbackMsg(
                    `Captura ${nextProgress}/${ENROLLMENT_STEPS_NEEDED} OK. Retire y vuelva a colocar.`
                );
                setTimeout(() => {
                    if (currentEnrollmentAttemptId.current === attemptId) {
                        setCaptureState("ready_to_capture");
                        setCaptureFeedbackMsg(
                            `Coloque ${fingerIndexToName[selectedFinger]} (${
                                nextProgress + 1
                            }/${ENROLLMENT_STEPS_NEEDED})`
                        );
                    }
                }, 1500);
            } else {
                throw new Error("Respuesta de enrolamiento incompleta.");
            }
        } catch (err: any) {
            console.error("Error en captura:", err);
            if (currentEnrollmentAttemptId.current !== attemptId) {
                setIsLoading(false);
                return;
            }
            let specificError = "Error durante la captura.";
            const errorData = err.response?.data;
            if (typeof errorData === "string") {
                specificError = errorData;
            } else if (errorData?.message) {
                specificError = errorData.message;
            } else if (err.message) {
                specificError = err.message;
            }
            if (
                specificError.includes("TIMEOUT") ||
                specificError.includes("NO_DATA")
            ) {
                specificError = "Tiempo agotado / dedo no detectado.";
            } else if (specificError.includes("QUALITY")) {
                specificError = "Calidad insuficiente.";
            } else if (specificError.includes("FAKE")) {
                specificError = "Dedo falso detectado.";
            } else if (specificError.includes("DEVICE_BUSY")) {
                specificError = "Lector ocupado.";
            }
            setCaptureError(specificError);
            setCaptureState("capture_failed");
            setCaptureFeedbackMsg("Captura fallida. Intente nuevamente.");
            setCaptureProgress((prev) => Math.max(0, prev - 1));

            setTimeout(() => {
                if (currentEnrollmentAttemptId.current === attemptId) {
                    setCaptureState("ready_to_capture");
                    setCaptureFeedbackMsg(
                        `Reintente (${
                            captureProgress + 1
                        }/${ENROLLMENT_STEPS_NEEDED}).`
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

    // Reintentar guardado
    const handleRetrySave = () => {
        if (captureState === "save_failed" && finalTemplateBase64) {
            saveFingerprint(finalTemplateBase64);
        }
    };

    // Resetea el proceso de captura (pero no cambia de lector ni libera)
    const resetCaptureProcess = (preserveFingerSelection = false) => {
        console.log("[DEBUG] resetCaptureProcess called:", {
            preserveFingerSelection,
            currentState: {
                captureState,
                selectedFinger,
                enrollmentSessionId,
                captureProgress,
                captureError,
                isLoading
            },
            timestamp: new Date().toISOString()
        });

        // Validate current state before reset
        if (captureState !== "idle" && captureState !== "error") {
            console.log("[DEBUG] State validation: Resetting non-idle capture state:", captureState);
        }

        if (enrollmentSessionId) {
            console.log("[DEBUG] State validation: Clearing active enrollment session:", enrollmentSessionId);
        }

        setCaptureState("idle");
        setEnrollmentSessionId(null);
        currentEnrollmentAttemptId.current = null;
        setCaptureProgress(0);
        setCaptureFeedbackMsg("");
        setCaptureError(null);
        setFinalTemplateBase64(null);
        setLastCapturedImage(null);
        setIsLoading(false);
        
        if (!preserveFingerSelection) {
            console.log("[DEBUG] Clearing finger selection");
            setSelectedFinger(null);
        } else {
            console.log("[DEBUG] Preserving finger selection:", selectedFinger);
        }

        console.log("[DEBUG] resetCaptureProcess completed - new state:", {
            captureState: "idle",
            selectedFinger: preserveFingerSelection ? selectedFinger : null,
            enrollmentSessionId: null,
            captureProgress: 0
        });
    };

    //
    // --------------------- WebSocket para Imágenes en Vivo ---------------------
    //
    const connectWebSocketForImages = useCallback(() => {
        if (
            !selectedScanner ||
            !browserSessionId ||
            stompClient.current?.active
        ) {
            return;
        }
        const stompInstance = new Client({
            webSocketFactory: () =>
                new SockJS(`${API_BASE_URL}/ws-fingerprint`),
            debug: () => {},
            reconnectDelay: 5000,
            connectHeaders: { login: "guest", passcode: "guest" },
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
                                        "ready_to_capture",
                                        "capturing",
                                        "capture_failed",
                                        "capture_success",
                                    ].includes(captureState)
                                ) {
                                    setLastCapturedImage(
                                        `data:image/png;base64,${eventData.base64Image}`
                                    );
                                }
                            } catch (e) {
                                console.error(
                                    "Error parseando mensaje WS de imagen:",
                                    e
                                );
                            }
                        },
                        {
                            id: `sub-image-${selectedScanner}-${browserSessionId}`,
                        }
                    );
                } catch (subErr) {
                    console.error("Error suscribiendo a imágenes:", subErr);
                    setGeneralError(
                        "Error al suscribirse al visualizador de huella."
                    );
                }
            },
            onStompError: (frame) => {
                console.error("STOMP error:", frame.headers["message"]);
            },
            onWebSocketError: (evt) => {
                console.error("WebSocket error:", evt);
            },
            onWebSocketClose: (evt) => {
                console.log("WS cerrado (code:", evt.code, ")");
            },
        });
        stompClient.current = stompInstance;
        stompInstance.activate();
    }, [selectedScanner, browserSessionId, captureState]);

    const disconnectWebSocketForImages = useCallback(() => {
        if (stompClient.current?.active) {
            stompClient.current.deactivate().catch((err) => {
                console.error("Error al desactivar stomp:", err);
            });
        }
        imageSubscription.current = null;
        stompClient.current = null;
        setLastCapturedImage(null);
    }, []);

    //
    // --------------------- Navegación de Pasos ---------------------
    //

    const goToNextStep = () => {
        console.log("[DEBUG] goToNextStep called:", {
            currentStep,
            selectedEmployee: selectedEmployee?.id,
            selectedScanner,
            selectedFinger,
            captureState,
            timestamp: new Date().toISOString()
        });

        setGeneralError(null);

        // Validaciones
        if (currentStep === 1) {
            if (!selectedEmployee) {
                console.log("[DEBUG] Step 1 validation failed: No employee selected");
                setGeneralError("Seleccione un empleado.");
                return;
            }
            console.log("[DEBUG] Step 1 → 2: Employee selected, proceeding");
            setCurrentStep(2);
            return;
        }

        if (currentStep === 2) {
            if (!selectedScanner) {
                console.log("[DEBUG] Step 2 validation failed: No scanner selected");
                setGeneralError("Seleccione un lector de huella.");
                return;
            }
            console.log("[DEBUG] Step 2 → 3: Scanner selected, proceeding");
            setCurrentStep(3);
            return;
        }

        if (currentStep === 3) {
            if (selectedFinger === null) {
                console.log("[DEBUG] Step 3 validation failed: No finger selected");
                setGeneralError("Seleccione un dedo.");
                return;
            }
            console.log("[DEBUG] Step 3 → 4: Finger selected, proceeding to capture");
            setCurrentStep(4);
            return;
        }

        if (currentStep === 4) {
            // Debemos tener "save_success" o que completó
            if (
                captureState !== "save_success" &&
                captureState !== "enroll_complete" &&
                captureState !== "save_failed"
            ) {
                // No terminó
                console.log("[DEBUG] Step 4 validation failed: Capture not complete", {
                    captureState,
                    requiredStates: ["save_success", "enroll_complete", "save_failed"]
                });
                setCaptureError(
                    `Complete las ${ENROLLMENT_STEPS_NEEDED} capturas antes de continuar.`
                );
                return;
            }
            // Si fue "save_success" -> ok
            // Si fue "save_failed" -> quizás permitir forzar?
            console.log("[DEBUG] Step 4 → 5: Capture complete, proceeding to success");
            setCurrentStep(5);
            return;
        }

        console.log("[DEBUG] goToNextStep: Unknown step", currentStep);
    };

    const goToPreviousStep = () => {
        console.log("[DEBUG] goToPreviousStep called:", {
            currentStep,
            selectedEmployee: selectedEmployee?.id,
            selectedScanner,
            selectedFinger,
            captureState,
            timestamp: new Date().toISOString()
        });

        setGeneralError(null);
        if (currentStep <= 1) {
            console.log("[DEBUG] Already at step 1, cannot go back further");
            return;
        }

        const newStep = currentStep - 1;
        
        if (currentStep === 2) {
            // Volver a Step1 no libera lector porque no hay lector en step1
            console.log("[DEBUG] Step 2 → 1: Going back to employee selection");
        }
        
        if (currentStep === 3) {
            // Quitar dedo
            console.log(
                "[DEBUG] Step 3 → 2: Clearing finger selection and resetting capture"
            );
            setSelectedFinger(null);
            resetCaptureProcess();
        }

        if (currentStep === 4) {
            // Cancelar la captura y resetear completamente.
            // Volver al paso 2 (selección de lector).
            console.log(
                "[DEBUG] Step 4 → 2: Releasing scanner and going back to reader selection"
            );

            resetCaptureProcess(false); // false = no preservar seleccion de dedo
            setCaptureError(null);
            setCaptureFeedbackMsg("");
            setSelectedFinger(null); // Limpiar dedo seleccionado

            if (selectedScanner && browserSessionId) {
                console.log("[DEBUG] Releasing scanner:", selectedScanner);
                releaseReaderApiCall(selectedScanner, browserSessionId);
            }

            // Establecer el paso directamente a 2 y salir
            setCurrentStep(2);
            return; // Salir para evitar que se ejecute la lógica de abajo
        }

        if (currentStep === 5) {
            // Ir a step 2 para registrar otro dedo o cambiar lector
            console.log(
                "[DEBUG] Step 5 → 2: Going back to reader selection for another registration"
            );
            setCurrentStep(2);
            resetCaptureProcess();
            setSelectedFinger(null);
            return; // Return early para no ejecutar setCurrentStep(newStep)
        }

        console.log("[DEBUG] Setting step from", currentStep, "to", newStep);
        setCurrentStep(newStep);
    };

    const handleFinish = () => {
        // Liberar lector (si está en "reserved_this")
        if (selectedScanner && browserSessionId) {
            releaseReaderApiCall(selectedScanner, browserSessionId);
        }
        router.push("/empleados");
    };

    const handleRegisterAnotherFinger = () => {
        setCurrentStep(3);
        resetCaptureProcess();
        setSelectedFinger(null);
    };

    //
    // --------------------- Render UI por Paso (Diseño V2) ---------------------
    //

    const renderStepContent = () => {
        //
        // ---- Paso 1: Selección de Empleado (combobox) ----
        //
        if (currentStep === 1) {
            return (
                <Card className="max-w-3xl mx-auto bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle>Paso 1: Selección de Empleado</CardTitle>
                        <CardDescription>
                            Seleccione o busque el empleado al que desea asignar
                            la huella.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-zinc-400">
                                    Buscar empleado
                                </Label>
                                <Popover
                                    open={openEmployeePopover}
                                    onOpenChange={setOpenEmployeePopover}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openEmployeePopover}
                                            className="w-full justify-between"
                                        >
                                            {selectedEmployee
                                                ? selectedEmployee.nombre
                                                : "Seleccionar empleado..."}
                                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput
                                                placeholder="Buscar empleado..."
                                                className="h-9"
                                                value={employeeSearchValue}
                                                onValueChange={(val) => {
                                                    setEmployeeSearchValue(val);
                                                    searchEmployees(val);
                                                }}
                                            />
                                            <CommandList>
                                                {isSearching ? (
                                                    <div className="p-4 text-center text-sm text-zinc-400">
                                                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                                        Buscando...
                                                    </div>
                                                ) : (
                                                    <>
                                                        <CommandEmpty>
                                                            No se encontraron
                                                            empleados.
                                                        </CommandEmpty>
                                                        <CommandGroup className="max-h-[300px] overflow-auto">
                                                            {employeesFound.map(
                                                                (emp) => (
                                                                    <CommandItem
                                                                        key={
                                                                            emp.id
                                                                        }
                                                                        value={
                                                                            emp.nombre
                                                                        }
                                                                        onSelect={() => {
                                                                            setSelectedEmployee(
                                                                                {
                                                                                    id: emp.id,
                                                                                    nombre: emp.nombre,
                                                                                }
                                                                            );
                                                                            setOpenEmployeePopover(
                                                                                false
                                                                            );
                                                                        }}
                                                                    >
                                                                        <div className="flex flex-col">
                                                                            <span>
                                                                                {
                                                                                    emp.nombre
                                                                                }
                                                                            </span>
                                                                            {emp.numeroTarjeta &&
                                                                                emp.area && (
                                                                                    <span className="text-xs text-zinc-500">
                                                                                        {
                                                                                            emp.numeroTarjeta
                                                                                        }{" "}
                                                                                        -{" "}
                                                                                        {
                                                                                            emp.area
                                                                                        }
                                                                                    </span>
                                                                                )}
                                                                        </div>
                                                                        <CheckCircle
                                                                            className={`ml-auto h-4 w-4 ${
                                                                                selectedEmployee?.id ===
                                                                                emp.id
                                                                                    ? "opacity-100"
                                                                                    : "opacity-0"
                                                                            }`}
                                                                        />
                                                                    </CommandItem>
                                                                )
                                                            )}
                                                        </CommandGroup>
                                                    </>
                                                )}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {selectedEmployee && (
                                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 bg-zinc-800 rounded-full flex items-center justify-center">
                                            <Users className="h-8 w-8 text-blue-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">
                                                {selectedEmployee.nombre}
                                            </h2>
                                            <p className="text-zinc-400">
                                                ID interno:{" "}
                                                {selectedEmployee.id}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Link href="/empleados">
                            <Button variant="outline">Cancelar</Button>
                        </Link>
                        <Button
                            onClick={goToNextStep}
                            disabled={!selectedEmployee}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Continuar
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            );
        }

        //
        // ---- Paso 2: Selección de Lector ----
        //
        if (currentStep === 2) {
            return (
                <Card className="max-w-3xl mx-auto bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle>Paso 2: Selección de Lector</CardTitle>
                        <CardDescription>
                            Elija el lector de huellas a utilizar.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-16 w-16 bg-zinc-800 rounded-full flex items-center justify-center">
                                    <Users className="h-8 w-8 text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">
                                        {selectedEmployee?.nombre}
                                    </h2>
                                    <p className="text-zinc-400">
                                        ID interno: {selectedEmployee?.id}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-zinc-400">
                                    Lector de Huellas
                                </Label>
                                <div className="flex gap-2">
                                    <Select
                                        value={selectedScanner ?? ""}
                                        onValueChange={handleSelectReaderChange}
                                    >
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Seleccionar lector..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableReaders.map((scanner) => (
                                                <SelectItem
                                                    key={scanner.id}
                                                    value={scanner.id}
                                                    disabled={
                                                        scanner.status ===
                                                            "reserved_other" ||
                                                        scanner.status ===
                                                            "offline" ||
                                                        scanner.status ===
                                                            "error"
                                                    }
                                                >
                                                    {scanner.name}{" "}
                                                    {scanner.status ===
                                                        "reserved_other" &&
                                                        " (Ocupado)"}
                                                    {scanner.status ===
                                                        "offline" &&
                                                        " (Offline)"}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={fetchAvailableReaders}
                                        disabled={isLoading}
                                        aria-label="Refrescar lista de lectores"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCcw className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                {selectedScanner && (
                                    <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5" />
                                        Lector seleccionado: {selectedScanner}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" onClick={goToPreviousStep}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Button>
                        <Button
                            onClick={goToNextStep}
                            disabled={!selectedScanner}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Continuar
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            );
        }

        //
        // ---- Paso 3: Selección de Dedo ----
        //
        if (currentStep === 3) {
            return (
                <Card className="max-w-4xl mx-auto bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle>Paso 3: Selección de Dedo</CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                            <span className="inline-flex items-center">
                                <span className="inline-block w-3 h-3 rounded-full bg-green-800 border border-green-600 mr-1"></span>
                                Ya registrado
                            </span>
                            <span className="inline-flex items-center">
                                <span className="inline-block w-3 h-3 rounded-full bg-blue-600 border border-blue-400 mr-1"></span>
                                Registrado en esta sesión
                            </span>
                            <span className="inline-flex items-center">
                                <span className="inline-block w-3 h-3 rounded-full bg-purple-600 border border-purple-400 mr-1"></span>
                                Seleccionado
                            </span>
                            <span className="inline-flex items-center">
                                <span className="inline-block w-3 h-3 rounded-full bg-zinc-700 border border-zinc-600 mr-1"></span>
                                Disponible
                            </span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 mb-2 bg-zinc-800/50 p-2 rounded-md">
                                <div className="h-12 w-12 bg-zinc-800 rounded-full flex items-center justify-center">
                                    <Users className="h-6 w-6 text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">
                                        {selectedEmployee?.nombre}
                                    </h2>
                                    <p className="text-xs text-zinc-400">
                                        Lector: {selectedScanner}
                                    </p>
                                </div>
                            </div>

                            <HandSelector
                                selectedFinger={selectedFinger}
                                setSelectedFinger={handleFingerSelectChange}
                                existingFingerIndices={existingHuellas
                                    .map(
                                        (h) =>
                                            fingerNameToIndex[
                                                h.nombreDedo?.toUpperCase() ??
                                                    ""
                                            ]
                                    )
                                    .filter((i) => i > 0)}
                                registeredThisSessionIndices={
                                    registeredThisSessionIndices
                                }
                            />

                            {captureError && (
                                <div className="p-2 bg-red-900/30 border border-red-500/30 rounded-lg text-sm text-red-400 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />{" "}
                                    {captureError}
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-3">
                        <Button variant="outline" onClick={goToPreviousStep}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Button>
                        <Button
                            onClick={goToNextStep}
                            disabled={selectedFinger === null}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Continuar
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            );
        }

        //
        // ---- Paso 4: Captura de Huella ----
        //
        if (currentStep === 4) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle>Paso 4: Captura de Huella</CardTitle>
                            <CardDescription>
                                Completa {ENROLLMENT_STEPS_NEEDED} capturas para
                                registrar la huella de{" "}
                                {selectedFinger
                                    ? fingerIndexToName[selectedFinger]
                                    : "???"}
                                .
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 bg-zinc-800 rounded-full flex items-center justify-center">
                                        <Users className="h-8 w-8 text-blue-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">
                                            {selectedEmployee?.nombre}
                                        </h2>
                                        <p className="text-zinc-400">
                                            Dedo:{" "}
                                            {selectedFinger
                                                ? fingerIndexToName[
                                                      selectedFinger
                                                  ]
                                                : ""}
                                        </p>
                                    </div>
                                </div>

                                {/* Progreso de las capturas */}
                                <div>
                                    <h3 className="text-lg font-medium mb-3">
                                        Progreso
                                    </h3>
                                    <div className="flex justify-between items-center gap-2">
                                        {Array.from({
                                            length: ENROLLMENT_STEPS_NEEDED,
                                        }).map((_, index) => {
                                            const stepDone =
                                                captureProgress > index;
                                            const stepActive =
                                                captureState === "capturing" &&
                                                captureProgress === index;
                                            return (
                                                <motion.div
                                                    key={index}
                                                    className={`h-3 flex-1 rounded-full ${
                                                        stepDone
                                                            ? "bg-green-500"
                                                            : stepActive
                                                            ? "bg-purple-500 animate-pulse"
                                                            : "bg-zinc-700"
                                                    }`}
                                                    initial={{ scaleX: 0 }}
                                                    animate={{ scaleX: 1 }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Mensajes de feedback - Más prominente */}
                                <div className="min-h-[4rem] p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-2 border-blue-500/30 rounded-lg text-center flex items-center justify-center">
                                    {captureError ? (
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-5 w-5 text-red-400" />
                                            <p className="text-red-400 font-medium">
                                                {captureError}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            {(captureState === "saving" ||
                                                captureState === "capturing" ||
                                                captureState === "reserving" ||
                                                captureState ===
                                                    "starting_enroll") && (
                                                <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                                            )}
                                            {captureState === "ready_to_capture" && (
                                                <Fingerprint className="h-5 w-5 text-purple-400 animate-pulse" />
                                            )}
                                            {(captureState === "save_success" || captureState === "enroll_complete") && (
                                                <CheckCircle className="h-5 w-5 text-green-400" />
                                            )}
                                            <p className="text-base font-medium text-zinc-200">
                                                {captureFeedbackMsg || "Preparando..."}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button
                                variant="outline"
                                onClick={goToPreviousStep}
                                disabled={
                                    isLoading || 
                                    captureState === "saving" ||
                                    captureState === "save_success" ||
                                    captureState === "enroll_complete"
                                }
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver
                            </Button>

                            {captureState === "save_failed" ? (
                                <Button
                                    onClick={handleRetrySave}
                                    disabled={isLoading}
                                    className="bg-yellow-600 hover:bg-yellow-700"
                                >
                                    <RefreshCcw className="mr-2 h-4 w-4" />
                                    Reintentar
                                </Button>
                            ) : (
                                <Button
                                    onClick={goToNextStep}
                                    disabled={
                                        captureState !== "save_success" &&
                                        captureState !== "enroll_complete" &&
                                        captureState !==
                                            ("save_failed" as CaptureStepState)
                                    }
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    Continuar
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </CardFooter>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle>Escáner de Huella</CardTitle>
                            <CardDescription>
                                Lector: {selectedScanner}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            {/* Visualización de la huella */}
                            <div className="relative mb-6 flex h-64 w-64 items-center justify-center">
                                {/* Base de huella - siempre visible */}
                                <svg
                                    className="absolute h-56 w-56"
                                    viewBox="0 0 100 100"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <g
                                        className="fingerprint-base"
                                        stroke={
                                            captureState ===
                                                "capture_success" ||
                                            captureState === "save_success" ||
                                            captureState === "enroll_complete"
                                                ? "rgba(34, 197, 94, 0.3)"
                                                : captureState ===
                                                      "capture_failed" ||
                                                  captureState ===
                                                      "save_failed" ||
                                                  captureState === "error"
                                                ? "rgba(239, 68, 68, 0.3)"
                                                : "rgba(168, 85, 247, 0.3)"
                                        }
                                        fill="none"
                                        strokeWidth="2"
                                    >
                                        <path d="M50,15 C25,15 15,30 15,50 C15,70 25,85 50,85 C75,85 85,70 85,50 C85,30 75,15 50,15 Z" />
                                        <path d="M50,20 C30,20 20,35 20,50 C20,65 30,80 50,80 C70,80 80,65 80,50 C80,35 70,20 50,20 Z" />
                                        <path d="M50,25 C35,25 25,35 25,50 C25,65 35,75 50,75 C65,75 75,65 75,50 C75,35 65,25 50,25 Z" />
                                        <path d="M50,30 C37,30 30,40 30,50 C30,60 37,70 50,70 C63,70 70,60 70,50 C70,40 63,30 50,30 Z" />
                                        <path d="M50,35 C40,35 35,42 35,50 C35,58 40,65 50,65 C60,65 65,58 65,50 C65,42 60,35 50,35 Z" />
                                        <path d="M50,40 C42,40 40,45 40,50 C40,55 42,60 50,60 C58,60 60,55 60,50 C60,45 58,40 50,40 Z" />
                                        <path d="M50,45 C45,45 45,47 45,50 C45,53 45,55 50,55 C55,55 55,53 55,50 C55,47 55,45 50,45 Z" />
                                    </g>
                                </svg>

                                {/* Estado Idle - círculo pulsante */}
                                {(captureState === "idle" ||
                                    captureState === "ready_to_capture") && (
                                    <>
                                        <motion.div
                                            className="absolute h-56 w-56 rounded-full bg-purple-500/10"
                                            animate={{
                                                scale: [1, 1.1, 1],
                                                opacity: [0.7, 0.5, 0.7],
                                            }}
                                            transition={{
                                                duration: 1.2,
                                                repeat: Number.POSITIVE_INFINITY,
                                                ease: "easeInOut",
                                            }}
                                        />
                                        <motion.div
                                            className="absolute"
                                            animate={{
                                                opacity: [0.7, 1, 0.7],
                                            }}
                                            transition={{
                                                duration: 1,
                                                repeat: Number.POSITIVE_INFINITY,
                                                ease: "easeInOut",
                                            }}
                                        >
                                            <Fingerprint className="h-36 w-36 text-purple-500/80" />
                                        </motion.div>
                                    </>
                                )}

                                {/* Estado de escaneo */}
                                {captureState === "capturing" && (
                                    <>
                                        <motion.div
                                            className="absolute h-1.5 rounded-full bg-purple-500/70"
                                            style={{ width: "80%" }}
                                            initial={{ y: 50, opacity: 0 }}
                                            animate={{
                                                y: [-40, 40],
                                                opacity: [0.2, 0.8, 0.2],
                                            }}
                                            transition={{
                                                duration: 0.8,
                                                repeat: Number.POSITIVE_INFINITY,
                                                repeatType: "reverse",
                                            }}
                                        />

                                        <motion.div
                                            className="absolute h-56 w-56 rounded-full bg-purple-500/5"
                                            animate={{
                                                scale: [1, 1.05, 1],
                                                opacity: [0.2, 0.4, 0.2],
                                            }}
                                            transition={{
                                                duration: 1.5,
                                                repeat: Number.POSITIVE_INFINITY,
                                                repeatType: "reverse",
                                            }}
                                        />
                                    </>
                                )}

                                {/* Estado de éxito */}
                                {(captureState === "capture_success" ||
                                    captureState === "save_success" ||
                                    captureState === "enroll_complete") && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 15,
                                            duration: 0.2,
                                        }}
                                    >
                                        <CheckCircle className="h-32 w-32 text-green-500" />
                                    </motion.div>
                                )}

                                {/* Estado de fallo */}
                                {(captureState === "capture_failed" ||
                                    captureState === "save_failed" ||
                                    captureState === "error") && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 15,
                                            duration: 0.2,
                                        }}
                                    >
                                        <XCircle className="h-32 w-32 text-red-500" />
                                    </motion.div>
                                )}

                                {/* Mostrar imagen capturada si está disponible */}
                                {lastCapturedImage && (
                                    <motion.div
                                        className="absolute inset-0 flex items-center justify-center"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.7 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <img
                                            src={
                                                lastCapturedImage ||
                                                "/placeholder.svg"
                                            }
                                            alt="Huella capturada"
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    </motion.div>
                                )}
                            </div>

                            <div className="text-center mb-6">
                                <p className="text-xl font-medium text-zinc-300">
                                    {captureState === "idle" &&
                                        "Listo para iniciar captura"}
                                    {captureState === "ready_to_capture" &&
                                        "Coloque el dedo en el lector"}
                                    {captureState === "capturing" &&
                                        "Escaneando huella..."}
                                    {captureState === "capture_success" &&
                                        "Huella capturada correctamente"}
                                    {captureState === "capture_failed" &&
                                        "Error al capturar la huella"}
                                    {captureState === "enroll_complete" &&
                                        "¡Enrolamiento completado!"}
                                    {captureState === "save_success" &&
                                        "¡Huella guardada con éxito!"}
                                    {captureState === "save_failed" &&
                                        "Error al guardar la huella"}
                                    {captureState === "error" &&
                                        "Error en el proceso"}
                                </p>
                            </div>

                            {/* Botones según el estado */}
                            {captureState === "save_success" || captureState === "enroll_complete" ? (
                                <div className="flex flex-col gap-3 items-center">
                                    <Button
                                        className="bg-green-600 hover:bg-green-700 w-48"
                                        onClick={goToNextStep}
                                    >
                                        <CheckCircle className="mr-2 h-5 w-5" />
                                        ¡Continuar!
                                    </Button>
                                    <p className="text-sm text-green-400 text-center">
                                        Huella registrada exitosamente
                                    </p>
                                </div>
                            ) : captureState === "save_failed" ? (
                                <div className="flex flex-col gap-3 items-center">
                                    <Button
                                        className="bg-yellow-600 hover:bg-yellow-700 w-48"
                                        onClick={handleRetrySave}
                                        disabled={isLoading}
                                    >
                                        <RefreshCcw className="mr-2 h-5 w-5" />
                                        Reintentar Guardado
                                    </Button>
                                    <p className="text-sm text-yellow-400 text-center">
                                        Error al guardar, intente nuevamente
                                    </p>
                                </div>
                            ) : (
                                <Button
                                    className="bg-purple-600 hover:bg-purple-700 w-48"
                                    onClick={handleCapture}
                                    disabled={
                                        captureState !== "ready_to_capture" ||
                                        isLoading
                                    }
                                >
                                    {isLoading && captureState === "capturing" ? (
                                        <Loader2 className="animate-spin mr-2" />
                                    ) : (
                                        <Fingerprint className="mr-2 h-5 w-5" />
                                    )}
                                    {isLoading && captureState === "capturing"
                                        ? "Capturando..."
                                        : captureProgress === 0
                                        ? "Iniciar Captura"
                                        : "Capturar Nuevamente"}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            );
        }

        //
        // ---- Paso 5: Confirmación / Éxito ----
        //
        if (currentStep === 5) {
            return (
                <Card className="max-w-3xl mx-auto bg-zinc-900 border-zinc-800">
                    <CardHeader className="text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", duration: 0.4 }}
                            className="mx-auto mb-2"
                        >
                            <CheckCircle className="h-12 w-12 text-green-500" />
                        </motion.div>
                        <CardTitle>¡Éxito!</CardTitle>
                        <CardDescription>
                            Huella registrada correctamente.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-4">
                            <h2 className="text-xl font-bold mb-2">
                                Empleado: {selectedEmployee?.nombre}
                            </h2>
                            <p className="text-zinc-400 mb-6">
                                Se registró el dedo:{" "}
                                {selectedFinger
                                    ? fingerIndexToName[selectedFinger]
                                    : "???"}
                            </p>

                            <div className="bg-zinc-800 rounded-lg p-6 w-full max-w-md mb-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-16 w-16 bg-zinc-700 rounded-full flex items-center justify-center">
                                        <Fingerprint className="h-8 w-8 text-purple-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">
                                            {selectedEmployee?.nombre}
                                        </h3>
                                        <p className="text-zinc-400">
                                            ID interno: {selectedEmployee?.id}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-zinc-400">
                                    <p>
                                        <span className="font-medium text-white">
                                            Lector utilizado:
                                        </span>{" "}
                                        {selectedScanner}
                                    </p>
                                    <p>
                                        <span className="font-medium text-white">
                                            Dedos registrados en esta sesión:
                                        </span>{" "}
                                        {registeredThisSessionIndices.length}
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {registeredThisSessionIndices.map(
                                            (finger) => (
                                                <span
                                                    key={finger}
                                                    className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs"
                                                >
                                                    {fingerIndexToName[finger]}
                                                </span>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-center gap-3">
                        <Button
                            variant="outline"
                            onClick={handleRegisterAnotherFinger}
                        >
                            Registrar Otro Dedo
                        </Button>
                        <Button variant="outline" onClick={handleFinish}>
                            Finalizar
                        </Button>
                        <Link href="/">
                            <Button variant="ghost">Inicio</Button>
                        </Link>
                    </CardFooter>
                </Card>
            );
        }

        return <p className="text-center">Paso desconocido.</p>;
    };

    //
    // --------------------- Render Principal ---------------------
    //

    return (
        <div className="p-6 md:p-8">
            {/* Encabezado */}
            <div className="flex items-center gap-2 mb-6">
                <Link href="/empleados" aria-label="Volver">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full flex-shrink-0"
                    >
                        <ArrowLeft />
                    </Button>
                </Link>
                <h1 className="text-2xl md:text-3xl font-bold truncate">
                    Asignar Huella Digital
                </h1>
            </div>

            {/* Stepper (diseño V2) */}
            <div className="mb-8 max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                    {[
                        "Empleado",
                        "Lector",
                        "Dedo",
                        "Captura",
                        "Finalizado",
                    ].map((label, index) => (
                        <React.Fragment key={index}>
                            <div className="flex flex-col items-center text-center w-1/10 px-1">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-1 ${
                                        currentStep > index + 1
                                            ? "bg-blue-600 border-blue-600"
                                            : currentStep === index + 1
                                            ? "border-blue-500 bg-blue-900/50"
                                            : "border-zinc-600 bg-zinc-800"
                                    } transition-colors`}
                                >
                                    {currentStep > index + 1 ? (
                                        <CheckCircle size={16} />
                                    ) : (
                                        <span>{index + 1}</span>
                                    )}
                                </div>
                                <span
                                    className={`text-xs leading-tight ${
                                        currentStep >= index + 1
                                            ? "text-zinc-200"
                                            : "text-zinc-500"
                                    }`}
                                >
                                    {label}
                                </span>
                            </div>
                            {index < 4 && (
                                <div
                                    className={`flex-1 h-0.5 mt-4 ${
                                        currentStep > index + 1
                                            ? "bg-blue-600"
                                            : "bg-zinc-700"
                                    }`}
                                ></div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Mensaje de error general */}
            {generalError && currentStep !== 4 && (
                <div className="mb-4 max-w-4xl mx-auto p-3 bg-red-900/30 border border-red-500/30 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle className="text-red-400" />{" "}
                    <span>{generalError}</span>
                    <button
                        className="ml-auto"
                        onClick={() => setGeneralError(null)}
                        title="Cerrar"
                    >
                        <XCircle className="h-5 w-5" />
                    </button>
                </div>
            )}

            {/* Mensaje cuando no hay lectores disponibles */}
            {currentStep === 2 &&
                availableReaders.length === 0 &&
                !isLoading &&
                !generalError && (
                    <div className="mb-4 max-w-4xl mx-auto p-3 bg-yellow-900/30 border border-yellow-500/30 rounded-lg flex items-center gap-2 text-sm">
                        <AlertCircle className="text-yellow-400" />
                        <span>
                            No se encontraron lectores disponibles. Conecte un
                            lector y presione el botón de refrescar.
                        </span>
                    </div>
                )}

            {/* Transición de paso */}
            <AnimatePresence mode="wait">
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
    );
}

//
// Export principal con Suspense
//
export default function AsignarHuellaPage() {
    return (
        <Suspense
            fallback={
                <div className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-400" />{" "}
                    Cargando...
                </div>
            }
        >
            <AsignarHuellaContent />
        </Suspense>
    );
}
