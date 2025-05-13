"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  Fingerprint,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Volume2,
  VolumeX,
  History,
  Zap,
  User,
  LogIn,
  LogOut,
  AlertTriangle,
  Ban,
  AlertCircle,
  Timer,
  CheckCircle,
  ClockIcon,
  UserX,
  CalendarCheck,
  CalendarX,
  ShieldAlert,
  ShieldCheck,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import axios from 'axios'
import { formatTime, getUserFriendlyMessage, getStyleClassesForCode } from "../lib/timeClockUtils"
import useStompTimeClock from "../hooks/useStompTimeClock"; // Corrected import path
import useEmployeeAttendanceData from "../hooks/useEmployeeAttendanceData";

// Importar los tipos desde timeClockTypes.ts
import {
  SessionStatus,
  WorkSession,
  JornadaEstadoDto,
  EmpleadoDto,
  BackendChecadorEvent,
  ScanHistoryItem,
  ScanState
} from "../lib/types/timeClockTypes";

// Actualizar el componente para incluir las nuevas variables de estado y funciones
export default function TimeClock({ selectedReader, sessionId }: { selectedReader: string, sessionId: string }) {
  // ==== HOOKS / STATE ====
  // Estado relacionado con estado y resultado de escaneo
  const [scanState, setScanState] = useState<ScanState>("idle")
  const [scanProgress, setScanProgress] = useState<number>(0)
  const [scanResult, setScanResult] = useState<"success" | "failed" | null>(null)
  const [lastAction, setLastAction] = useState<"entrada" | "salida">("entrada")
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Nuevos estados para manejo de códigos de estado y mensajes personalizados
  const [statusCode, setStatusCode] = useState<string | undefined>(undefined)
  const [statusData, setStatusData] = useState<Record<string, any> | undefined>(undefined)
  const [customMessage, setCustomMessage] = useState<string>("")
  
  // Estado relacionado con UI y visualización
  const [showAttendance, setShowAttendance] = useState(false)
  const [minutiaePoints, setMinutiaePoints] = useState<{ x: number; y: number }[]>([])
  const [minutiaeLines, setMinutiaeLines] = useState<{ start: number; end: number }[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [scanHistory, setScanHistory] = useState<(ScanHistoryItem & { statusCode?: string })[]>([])
  const [preparingNextScan, setPreparingNextScan] = useState(false)
  const [panelFlash, setPanelFlash] = useState<"success" | "failed" | null>(null)
  const [inactiveTime, setInactiveTime] = useState(0)
  const [showOverlayMessage, setShowOverlayMessage] = useState(false)
  const [windowHeight, setWindowHeight] = useState(0)
  const [showInstructionMessage, setShowInstructionMessage] = useState(true)
  
  // Nuevas variables de estado para integración con backend
  const [stompApiError, setStompApiError] = useState<string | null>(null);
  const [componentApiError, setComponentApiError] = useState<string | null>(null);
  const [isReaderReady, setIsReaderReady] = useState(false);
  const [employeeIdForHook, setEmployeeIdForHook] = useState<number | null>(null);

  // API Base URL para las peticiones
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

  // Use the new hook for employee attendance data
  const {
    currentEmployee,
    currentEmployeeData,
    jornadasDelDia,
    workSessions,
    activeSessionId,
    nextRecommendedAction,
    isLoading,
    errorLoadingData
  } = useEmployeeAttendanceData({
    employeeIdToFetch: employeeIdForHook,
    apiBaseUrl: API_BASE_URL
  });

  // Store nextRecommendedAction in a ref to avoid dependency changes
  const nextRecommendedActionRef = useRef<"entrada" | "salida">("entrada");

  // Update the ref when nextRecommendedAction changes
  useEffect(() => {
    nextRecommendedActionRef.current = nextRecommendedAction;
  }, [nextRecommendedAction]);

  const scanTimeout = useRef<NodeJS.Timeout | null>(null)
  const resetTimeout = useRef<NodeJS.Timeout | null>(null)
  const inactiveTimeout = useRef<NodeJS.Timeout | null>(null)
  const audioSuccess = useRef<HTMLAudioElement | null>(null)
  const audioError = useRef<HTMLAudioElement | null>(null)
  const audioScan = useRef<HTMLAudioElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  
  // ==== HELPER FUNCTIONS WRAPPED IN useCallback FOR STABILITY ====

  // ==== STOMP HOOK INTEGRATION ====
  const handleChecadorEventCallback = useCallback((event: BackendChecadorEvent) => {
    try {
      console.log("Evento de checador recibido:", event);
      
      const statusCode = event.statusCode;
      const statusType = event.statusType || (event.identificado ? "OK" : "ERROR");
      const statusData = event.data;
      
      setStatusCode(statusCode);
      setStatusData(statusData);
      
      if (statusCode) {
        const message = getUserFriendlyMessage(statusCode, statusData, event.nombreCompleto);
        setCustomMessage(message);
      }
      
      if (event.empleadoId !== undefined && event.nombreCompleto) {
        setEmployeeIdForHook(event.empleadoId);
        setShowAttendance(true);
      }
      
      if (event.identificado || (statusType === "OK" || statusType === "INFO")) {
        setScanState("success");
        setScanResult("success");
        setPanelFlash("success");
        setShowOverlayMessage(true);
        setShowInstructionMessage(false);
        
        if (event.empleadoId !== undefined && event.nombreCompleto) {
          // Use the ref value instead of the state directly
          const action = event.accion || nextRecommendedActionRef.current;
          setLastAction(action);
          
          // Only add to scan history if status code starts with 2 (success)
          if (statusCode?.startsWith("2")) {
            const newScan: ScanHistoryItem = {
              name: event.nombreCompleto,
              time: new Date(),
              success: true,
              action: action,
              employeeId: event.empleadoId.toString(),
              statusCode: statusCode // Store the status code for coloring
            };
            setScanHistory(prev => [newScan, ...prev.slice(0, 5)]); // Keep 6 items max
          }
          
          setPreparingNextScan(true);
          setTimeout(() => {
            setScanState("ready");
            setPreparingNextScan(false);
          }, 3000);
        }
      } else {
        setScanState("failed");
        setScanResult("failed");
        setPanelFlash("failed");
        setShowOverlayMessage(true);
        setShowInstructionMessage(false);
        
        // Don't add failed scans to history anymore
        
        setTimeout(() => {
          setScanState("ready");
        }, 3500);
      }
    } catch (error) {
      console.error("Error al procesar evento de checador:", error);
    }
  }, [
    // Only include state setters which have stable references
    setStatusCode,
    setStatusData,
    setCustomMessage,
    setScanState,
    setScanResult,
    setPanelFlash,
    setShowOverlayMessage,
    setShowInstructionMessage,
    setLastAction,
    setScanHistory,
    setPreparingNextScan,
    setShowAttendance,
    setEmployeeIdForHook
    // nextRecommendedActionRef is accessed via .current, so it's not a dependency
  ]);

  const { isConnected } = useStompTimeClock({
    initialReaderName: selectedReader,
    initialSessionId: sessionId,
    onChecadorEvent: handleChecadorEventCallback,
    onConnectionError: setStompApiError,
    onReadyStateChange: setIsReaderReady,
    apiBaseUrl: API_BASE_URL,
  });

  // Actualizar el estado general del scanState basado en isReaderReady y isConnected
  useEffect(() => {
    if (isConnected && isReaderReady) {
      setScanState("ready"); // El lector está conectado y el checador iniciado
      setComponentApiError(null); // Limpiar errores del componente si el lector está listo
    } else if (isConnected && !isReaderReady && !stompApiError) {
      setScanState("idle"); // Conectado pero esperando que el checador inicie (o en proceso)
    } else if (!isConnected || stompApiError) {
      setScanState("failed"); // No conectado o error
    }
  }, [isConnected, isReaderReady, stompApiError]);

  // useEffect to update local state based on props (readerName, browserSessionId)
  useEffect(() => {
    setEmployeeIdForHook(null);
    setShowAttendance(false);
    setScanState("idle");
    setScanResult(null);
    setScanProgress(0);
    setMinutiaePoints([]);
    setMinutiaeLines([]);
    setPreparingNextScan(false);
    setPanelFlash(null);
    setCustomMessage("");
    setStatusCode(undefined);
    setStatusData(undefined);
    setScanHistory([]);
  }, [selectedReader, sessionId]);

  // Obtener altura de la ventana para calcular cuántos elementos mostrar
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => {
        setWindowHeight(window.innerHeight)
      }

      handleResize()
      window.addEventListener("resize", handleResize)

      return () => {
        window.removeEventListener("resize", handleResize)
      }
    }
  }, [])

  // Calcular cuántas sesiones mostrar basado en el tamaño de la pantalla
  const getMaxSessionsToShow = () => {
    if (windowHeight < 600) return 1
    if (windowHeight < 800) return 2
    return 3
  }

  // Inicializar elementos de audio
  useEffect(() => {
    audioSuccess.current = new Audio(
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==",
    )
    audioError.current = new Audio(
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==",
    )
    audioError.current = new Audio(
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==",
    )
    audioScan.current = new Audio(
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==",
    )

    // Simular sonidos con oscilador
    if (typeof window !== "undefined" && window.AudioContext) {
      try {
        const audioCtx = new AudioContext()

        // Sonido de éxito (beep agudo)
        const createSuccessSound = () => {
          const oscillator = audioCtx.createOscillator()
          const gainNode = audioCtx.createGain()
          oscillator.type = "sine"
          oscillator.frequency.setValueAtTime(1800, audioCtx.currentTime)
          oscillator.connect(gainNode)
          gainNode.connect(audioCtx.destination)
          gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3)
          oscillator.start()
          oscillator.stop(audioCtx.currentTime + 0.3)
        }

        // Sonido de error (beep grave)
        const createErrorSound = () => {
          const oscillator = audioCtx.createOscillator()
          const gainNode = audioCtx.createGain()
          oscillator.type = "sine"
          oscillator.frequency.setValueAtTime(300, audioCtx.currentTime)
          oscillator.connect(gainNode)
          gainNode.connect(audioCtx.destination)
          gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3)
          oscillator.start()
          oscillator.stop(audioCtx.currentTime + 0.3)
        }

        // Sonido de escaneo (clic)
        const createScanSound = () => {
          const oscillator = audioCtx.createOscillator()
          const gainNode = audioCtx.createGain()
          oscillator.type = "sine"
          oscillator.frequency.setValueAtTime(800, audioCtx.currentTime)
          oscillator.connect(gainNode)
          gainNode.connect(audioCtx.destination)
          gainNode.gain.setValueAtTime(0.03, audioCtx.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1)
          oscillator.start()
          oscillator.stop(audioCtx.currentTime + 0.1)
        }

        // Crear funciones de reproducción personalizadas
        const customSuccessPlay = () => {
          try {
            createSuccessSound();
            return Promise.resolve();
          } catch (e) {
            return Promise.resolve(); // Silenciar errores
          }
        };

        const customErrorPlay = () => {
          try {
            createErrorSound();
            return Promise.resolve();
          } catch (e) {
            return Promise.resolve(); // Silenciar errores
          }
        };

        const customScanPlay = () => {
          try {
            createScanSound();
            return Promise.resolve();
          } catch (e) {
            return Promise.resolve(); // Silenciar errores
          }
        };

        // Sobreescribir métodos de reproducción con nuestros sonidos personalizados
        if (audioSuccess.current) {
          audioSuccess.current.play = customSuccessPlay;
        }
        if (audioError.current) {
          audioError.current.play = customErrorPlay;
        }
        if (audioScan.current) {
          audioScan.current.play = customScanPlay;
        }
      } catch (e) {
        console.log("Web Audio API no soportada")
      }
    }
  }, [])

  // Actualizar la hora cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (scanTimeout.current) clearTimeout(scanTimeout.current)
      if (resetTimeout.current) clearTimeout(resetTimeout.current)
      if (inactiveTimeout.current) clearTimeout(inactiveTimeout.current)
    }
  }, [])

  // Iniciar el proceso de checador: reservar lector e iniciar escaneo
  const initiateChecadorProcess = async () => {
    try {
      setComponentApiError(null); 
      setScanState("idle");
      
      // 1. Reservar el lector
      await axios.post(
        `${API_BASE_URL}/api/v1/multi-fingerprint/reserve/${encodeURIComponent(selectedReader)}`, 
        null, 
        { params: { sessionId: sessionId } }
      );
      
      console.log(`Lector ${selectedReader} reservado correctamente`);
      
      // 2. Iniciar el proceso de checador - CORREGIR URL
      await axios.post(
        `${API_BASE_URL}/api/v1/multi-fingerprint/checador/start/${encodeURIComponent(selectedReader)}`,
        null,
        { params: { sessionId: sessionId } }
      );
      
      console.log("Proceso de checador iniciado");
      setScanState("ready");
    } catch (error: any) {
      console.error("Error al iniciar proceso de checador:", error);
      setComponentApiError(`Error: ${error.response?.data?.mensaje || error.message}`); // Use component specific error state
      setScanState("failed");
    }
  };

  // Detener checador y liberar lector
  const stopChecadorAndReleaseReader = async () => {
    try {
      if (selectedReader && sessionId) {
        // 1. Intentar detener el checador - CORREGIR URL
        try {
          await axios.post(
            `${API_BASE_URL}/api/v1/multi-fingerprint/checador/stop/${encodeURIComponent(selectedReader)}`,
            null,
            { params: { sessionId: sessionId } }
          );
          console.log("Proceso checador detenido correctamente");
        } catch (error) {
          console.error("Error al detener el checador:", error);
          // Continuar para intentar liberar el lector de todos modos
        }
        
        // 2. Liberar el lector
        await axios.post(
          `${API_BASE_URL}/api/v1/multi-fingerprint/release/${encodeURIComponent(selectedReader)}`,
          null,
          { params: { sessionId: sessionId } }
        );
        console.log("Lector liberado correctamente");
      }
      
      // WebSocket disconnection is now handled by the hook's cleanup
      // disconnectWebSocket(); // REMOVED
    } catch (error) {
      console.error("Error en el proceso de limpieza:", error);
      // Set componentApiError if needed for cleanup errors
    }
  };

  // Función auxiliar para obtener icono y color de estado
  const getStatusIndicator = (status: SessionStatus | string) => {
    // Si hay un código de estado, usar el mapeo de estilos basado en código
    if (statusCode) {
      const styles = getStyleClassesForCode(statusCode)
  
      return {
        icon: statusCode.startsWith("2") ? (
          <CheckCircle className={`h-5 w-5 ${styles.icon}`} />
        ) : statusCode.startsWith("3") ? (
          <AlertCircle className={`h-5 w-5 ${styles.icon}`} />
        ) : (
          <XCircle className={`h-5 w-5 ${styles.icon}`} />
        ),
        color: "border-zinc-700",
        textColor: styles.text,
        bgColor: styles.bgColor,
      }
    }
  
    if (typeof status === "string") {
      // Nuevos estados del backend con iconos mejorados
      switch (status) {
        case "COMPLETADA":
          return {
            icon: <CalendarCheck className="h-5 w-5 text-green-500" />,
            color: "border-zinc-700",
            textColor: "text-white",
            bgColor: "bg-green-500/20",
          }
        case "EN_CURSO":
          return {
            icon: <Zap className="h-5 w-5 text-blue-500 animate-pulse" />,
            color: "border-blue-500",
            textColor: "text-white",
            bgColor: "bg-blue-500/20",
          }
        case "RETARDO":
          return {
            icon: <Timer className="h-5 w-5 text-yellow-500" />,
            color: "border-zinc-700",
            textColor: "text-white",
            bgColor: "bg-yellow-500/20",
          }
        case "AUSENTE_ENTRADA":
          return {
            icon: <UserX className="h-5 w-5 text-red-500" />,
            color: "border-zinc-700",
            textColor: "text-white",
            bgColor: "bg-red-500/20",
          }
        case "AUSENTE_SALIDA":
          return {
            icon: <CalendarX className="h-5 w-5 text-red-500" />,
            color: "border-zinc-700",
            textColor: "text-white",
            bgColor: "bg-red-500/20",
          }
        case "AUSENTE":
          return {
            icon: <Ban className="h-5 w-5 text-red-500" />,
            color: "border-zinc-700",
            textColor: "text-white",
            bgColor: "bg-red-500/20",
          }
        case "PENDIENTE":
        default:
          return {
            icon: <Clock className="h-5 w-5 text-zinc-500" />,
            color: "border-zinc-700",
            textColor: "text-zinc-500",
            bgColor: "bg-zinc-700/20",
          }
      }
    } else {
      // Estados antiguos para compatibilidad con iconos mejorados
      switch (status) {
        case "entrada-ok":
          return {
            icon: <ShieldCheck className="h-5 w-5 text-green-500" />,
            color: "border-zinc-700",
            textColor: "text-white",
            bgColor: "bg-green-500/20",
          }
        case "salida-ok":
          return {
            icon: <CheckCircle className="h-5 w-5 text-green-500" />,
            color: "border-zinc-700",
            textColor: "text-white",
            bgColor: "bg-green-500/20",
          }
        case "entrada-tarde":
          return {
            icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
            color: "border-zinc-700",
            textColor: "text-white",
            bgColor: "bg-yellow-500/20",
          }
        case "salida-incidente":
          return {
            icon: <ShieldAlert className="h-5 w-5 text-yellow-500" />,
            color: "border-zinc-700",
            textColor: "text-white",
            bgColor: "bg-yellow-500/20",
          }
        case "salida-pendiente":
          return {
            icon: <AlertCircle className="h-5 w-5 text-red-500" />,
            color: "border-zinc-700",
            textColor: "text-white",
            bgColor: "bg-red-500/20",
          }
        case "ausente":
          return {
            icon: <Ban className="h-5 w-5 text-red-500" />,
            color: "border-zinc-700",
            textColor: "text-white",
            bgColor: "bg-red-500/20",
          }
        case "pendiente":
          return {
            icon: <ClockIcon className="h-5 w-5 text-zinc-500" />,
            color: "border-zinc-700",
            textColor: "text-zinc-500",
            bgColor: "bg-zinc-700/20",
          }
        default:
          return {
            icon: <Clock className="h-5 w-5 text-blue-500" />,
            color: "border-zinc-700",
            textColor: "text-white",
            bgColor: "bg-blue-500/20",
          }
      }
    }
  }

  // Obtener color de caja de hora de entrada/salida
  const getTimeBoxColor = (status: SessionStatus | string, action: "entrada" | "salida" | null = null) => {
    // Si hay un código de estado específico, usar el mapeo de estilos basado en código
    if (statusCode) {
      const styles = getStyleClassesForCode(statusCode)
  
      // Si se registró una entrada o salida específica, usar color específico
      if (action === "entrada" && lastAction === "entrada") {
        return styles.timeBox
      }
      if (action === "salida" && lastAction === "salida") {
        return styles.timeBox
      }
    }
  
    // Si se proporciona una acción específica, usar colores específicos
    if (action === "entrada") {
      return "bg-green-500/30 text-green-300 border-green-500"
    }
    if (action === "salida") {
      return "bg-blue-500/30 text-blue-300 border-blue-500"
    }
  
    if (typeof status === "string") {
      // Nuevos estados del backend con colores mejorados
      switch (status) {
        case "COMPLETADA":
          return action === "entrada"
            ? "bg-green-500/30 text-green-300 border-green-500"
            : "bg-blue-500/30 text-blue-300 border-blue-500"
        case "EN_CURSO":
          return action === "entrada"
            ? "bg-green-500/30 text-green-300 border-green-500 animate-pulse"
            : "bg-zinc-800 text-zinc-400 border-zinc-700"
        case "RETARDO":
          return action === "entrada"
            ? "bg-yellow-500/30 text-yellow-300 border-yellow-500"
            : "bg-zinc-800 text-zinc-400 border-zinc-700"
        case "PENDIENTE":
          return "bg-zinc-800 text-zinc-400 border-zinc-700"
        case "AUSENTE_ENTRADA":
        case "AUSENTE_SALIDA":
        case "AUSENTE":
        default:
          return "bg-zinc-700 text-zinc-400 border-zinc-600" // Más gris para errores
      }
    } else {
      // Estados antiguos para compatibilidad con colores mejorados
      switch (status) {
        case "entrada-tarde":
          return "bg-yellow-500/30 text-yellow-300 border-yellow-500"
        case "entrada-ok":
          return "bg-green-500/30 text-green-300 border-green-500"
        case "salida-incidente":
          return "bg-yellow-500/30 text-yellow-300 border-yellow-500"
        case "salida-ok":
          return "bg-blue-500/30 text-blue-300 border-blue-500"
        case "pendiente":
          return "bg-zinc-800 text-zinc-400 border-zinc-700"
        case "salida-pendiente":
          return "bg-zinc-800 text-zinc-400 border-zinc-700"
        case "ausente":
          return "bg-zinc-700 text-zinc-400 border-zinc-600" // Más gris para errores
        default:
          return "bg-zinc-800 text-zinc-400 border-zinc-700"
      }
    }
  }

  // Obtener mensaje de resultado según el estado
  const getResultMessage = () => {
    // Si hay un mensaje personalizado basado en código de estado, usarlo
    if (customMessage) {
      return customMessage;
    }
    
    // Si no hay mensaje personalizado, usar los mensajes genéricos
    if (scanState === "success" || scanState === "background-success") {
      return lastAction === "entrada" ? "Entrada Registrada" : "Salida Registrada"
    }
    if (scanState === "failed" || scanState === "background-failed") {
      return "Huella No Identificada"
    }
    return ""
  }

  // Función para obtener el color del texto del mensaje de resultado basado en el código de estado
  const getResultMessageColor = () => {
    if (statusCode) {
      const styles = getStyleClassesForCode(statusCode);
      return styles.text;
    }
    
    // Si no hay código de estado, usar los colores basados en el estado del escaneo
    if (scanState === "success" || scanState === "background-success") {
      return "text-green-400";
    }
    if (scanState === "failed" || scanState === "background-failed") {
      return "text-red-400";
    }
    return "text-transparent";
  }
  
  // Función para obtener el color del panel basado en el código de estado
  const getPanelColor = () => {
    if (statusCode) {
      const styles = getStyleClassesForCode(statusCode);
      return styles.panel;
    }
    
    // Si no hay código de estado, usar los colores basados en el estado de panelFlash
    if (panelFlash === "success") {
      return "bg-green-900/50 border-green-500";
    }
    if (panelFlash === "failed") {
      return "bg-red-900/50 border-red-500";
    }
    return "bg-zinc-900 border-zinc-800";
  }

  // Filtrar sesiones de trabajo para el empleado actual
  const filteredWorkSessions = workSessions
    .filter((session) => session.employeeId === currentEmployee?.id)
    .sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1
      if (!a.isCurrent && b.isCurrent) return 1
      return a.scheduledEntry.localeCompare(b.scheduledEntry)
    })
    .slice(0, getMaxSessionsToShow())

  // Determinar si mostrar las sesiones de trabajo
  const shouldShowWorkSessions = true // Siempre mostrar el panel

  // Auto-reset después de mostrar asistencia si no hay nuevo escaneo
  useEffect(() => {
    if (showAttendance) {
      resetTimeout.current = setTimeout(() => {
        // Solo ocultar el mensaje de overlay, no resetear todo si aún hay empleado
        setShowOverlayMessage(false);
        setShowInstructionMessage(true);
        
        // Si no hay empleado activo, sí podemos resetear más cosas
        if (!currentEmployee) {
          setScanState("ready")
          setShowAttendance(false)
          setScanProgress(0)
          setMinutiaePoints([])
          setMinutiaeLines([])
          setScanResult(null)
          setPreparingNextScan(false)
          setPanelFlash(null)
          setCustomMessage("")
          setStatusCode(undefined)
          setStatusData(undefined)
        } else {
          // Si hay empleado, solo preparamos para el siguiente escaneo
          setScanState("ready");
          setPanelFlash(null); // Quitar flash
        }
      }, 9000) // Mostrar asistencia/estado durante 9 segundos antes de resetear
    }
    return () => {
      if (resetTimeout.current) clearTimeout(resetTimeout.current)
    }
  }, [showAttendance, currentEmployee])

  // Este efecto ahora es solo un placeholder para posible implementación futura de visualización
  // de puntos de minucia reales que vengan del backend
  useEffect(() => {
    // Este efecto ya no utiliza generación aleatoria
    // El backend maneja la captura y análisis de huellas
    // Este código es solo para visualización con la API real si se implementara
  }, [scanState])

  // Reproducir sonidos basados en el estado de escaneo
  useEffect(() => {
    // Solo reproducir sonidos si están habilitados
    if (scanState === "scanning" || scanState === "background-scanning") {
      if (soundEnabled) audioScan.current?.play()
    } else if (scanState === "success" || scanState === "background-success") {
      if (soundEnabled) audioSuccess.current?.play()
    } else if (scanState === "failed" || scanState === "background-failed") {
      if (soundEnabled) audioError.current?.play()
    }
  }, [scanState, soundEnabled])

  // Añadir un nuevo useEffect para manejar las animaciones visuales independientemente del sonido
  useEffect(() => {
    // Manejar animaciones visuales (siempre activas independientemente del sonido)
    if (scanState === "success" || scanState === "background-success") {
      setPanelFlash("success")
      setShowOverlayMessage(true)
      setShowInstructionMessage(false)

      // Quitar el flash después de un tiempo
      setTimeout(() => {
        setPanelFlash(null)
      }, 2800)
    } else if (scanState === "failed" || scanState === "background-failed") {
      setPanelFlash("failed")
      setShowOverlayMessage(true)
      setShowInstructionMessage(false)

      // Quitar el flash después de un tiempo
      setTimeout(() => {
        setPanelFlash(null)
      }, 2800)
    }
  }, [scanState])

  // Controlar tiempo de inactividad para opacar los registros
  useEffect(() => {
    // Resetear el contador de inactividad cuando hay actividad
    if (scanState !== "idle" && scanState !== "ready") {
      setInactiveTime(0)
      return
    }

    // Incrementar el contador de inactividad cada segundo
    const interval = setInterval(() => {
      setInactiveTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [scanState])


  // Función para obtener la próxima jornada y sus horarios
  const getNextScheduledTime = (): { entryTime: string, exitTime: string, detalleHorarioId: number | null } => {
    // Si no hay jornadas o no hay empleado actual, retornar valores por defecto
    if (jornadasDelDia.length === 0 || !currentEmployee?.id) {
      return { entryTime: "—", exitTime: "—", detalleHorarioId: null };
    }

    // Si lastAction es salida, buscar la próxima jornada pendiente
    if (lastAction === "salida") {
      const jornadasPendientes = jornadasDelDia
        .filter(jornada => jornada.estatusJornada === "PENDIENTE")
        .sort((a, b) => a.horaEntradaProgramada.localeCompare(b.horaEntradaProgramada));
      
      if (jornadasPendientes.length > 0) {
        const proxima = jornadasPendientes[0];
        return {
          entryTime: formatTime(proxima.horaEntradaProgramada),
          exitTime: formatTime(proxima.horaSalidaProgramada),
          detalleHorarioId: proxima.detalleHorarioId
        };
      }
    }

    // Si hay una jornada en curso, mostrar sus horarios
    const jornadaEnCurso = jornadasDelDia.find(
      jornada => jornada.estatusJornada === "EN_CURSO" || jornada.estatusJornada === "RETARDO"
    );

    if (jornadaEnCurso) {
      return {
        entryTime: jornadaEnCurso.horaEntradaReal 
          ? formatTime(jornadaEnCurso.horaEntradaReal) 
          : formatTime(jornadaEnCurso.horaEntradaProgramada),
        exitTime: formatTime(jornadaEnCurso.horaSalidaProgramada),
        detalleHorarioId: jornadaEnCurso.detalleHorarioId
      };
    }

    // Si hay una jornada activa por activeSessionId, mostrar sus horarios
    if (activeSessionId !== null) {
      const jornadaActiva = jornadasDelDia.find(
        jornada => jornada.detalleHorarioId === activeSessionId
      );
      
      if (jornadaActiva) {
        return {
          entryTime: jornadaActiva.horaEntradaReal 
            ? formatTime(jornadaActiva.horaEntradaReal) 
            : formatTime(jornadaActiva.horaEntradaProgramada),
          exitTime: formatTime(jornadaActiva.horaSalidaProgramada),
          detalleHorarioId: jornadaActiva.detalleHorarioId
        };
      }
    }

    // Si no hay condiciones específicas, mostrar la primera jornada
    if (jornadasDelDia.length > 0) {
      const primera = jornadasDelDia[0];
      return {
        entryTime: formatTime(primera.horaEntradaProgramada),
        exitTime: formatTime(primera.horaSalidaProgramada),
        detalleHorarioId: primera.detalleHorarioId
      };
    }

    // Si no hay jornadas, retornar valores por defecto
    return { entryTime: "—", exitTime: "—", detalleHorarioId: null };
  };

  // Actualizar la estructura del diseño para cumplir con los nuevos requisitos
  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="flex flex-col gap-4 w-full max-w-7xl">
        {/* Reloj principal en la parte superior */}
        <div className="flex justify-between items-center bg-zinc-900 rounded-lg p-4 border-2 border-zinc-800">
          <div className="flex items-center gap-3">
            <Clock className="h-10 w-10 text-zinc-400" />
            <span className="text-4xl font-bold text-white">{format(currentTime, "HH:mm:ss")}</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-zinc-400" />
            <span className="text-2xl font-medium text-white">
              {format(currentTime, "EEE, dd MMM yyyy", { locale: es })}
            </span>
          </div>

          {/* Controles de configuración - deshabilitar en modo real */}
          <div className="flex gap-3">
            <div className="flex items-center space-x-2 bg-zinc-800 p-2 rounded-lg">
              <Switch id="sound-toggle" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
              <label htmlFor="sound-toggle" className="text-sm text-zinc-400 flex items-center gap-1">
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                Sonido
              </label>
            </div>
            
            {/* Si estamos conectados, mostrar el nombre del lector */}
            {isConnected && (
              <div className="flex items-center space-x-2 bg-blue-900/30 p-2 rounded-lg border border-blue-800">
                <Fingerprint className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-blue-300">{selectedReader}</span>
              </div>
            )}
          </div>
        </div>

        {/* Mostrar mensaje de error si existe (prioritize STOMP hook error, then component API error) */}
        {(stompApiError || componentApiError || errorLoadingData) && (
          <div className="w-full bg-red-900/30 border border-red-700 text-red-400 p-4 rounded-lg mb-2 flex items-center gap-3">
            <XCircle className="h-5 w-5 flex-shrink-0" />
            <p>{stompApiError || componentApiError || errorLoadingData}</p>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4">
          {/* Panel izquierdo: Sesiones de trabajo - solo visible cuando hay un empleado activo */}
          <div className="w-full md:w-80 bg-zinc-900 rounded-lg p-4 border-2 border-zinc-800">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-6 w-6 text-zinc-400" />
              <h3 className="text-xl font-bold text-zinc-300">Sesiones de Trabajo</h3>
            </div>

            <div className="space-y-4">
              {jornadasDelDia.length > 0 && showAttendance
                ? jornadasDelDia.slice(0, getMaxSessionsToShow()).map((jornada) => {
                    const { icon, color, textColor, bgColor } = getStatusIndicator(jornada.estatusJornada)

                    // Determinar si esta jornada es la "actual" (En Curso)
                    const isCurrent = jornada.estatusJornada === "EN_CURSO" || jornada.estatusJornada === "RETARDO"

                    // Formatear horas reales (solo hora y minuto)
                    const formatHoraReal = (dateTimeString: string | null): string => {
                      if (!dateTimeString) return "—"
                      try {
                        // Extraer solo hora y minuto de "yyyy-MM-dd HH:mm:ss"
                        return dateTimeString.split(" ")[1].substring(0, 5)
                      } catch (e) {
                        return "—"
                      }
                    }

                    // Formatear horas programadas (solo hora y minuto)
                    const formatHoraProgramada = (timeString: string): string => {
                      try {
                        // Extraer solo hora y minuto de "HH:mm:ss"
                        return timeString.substring(0, 5)
                      } catch (e) {
                        return timeString
                      }
                    }

                    // Determinar si hay retardo para mostrar un indicador visual
                    const hasDelay = jornada.minutosRetardoPreliminar !== null && jornada.minutosRetardoPreliminar > 0

                    return (
                      <div
                        key={jornada.detalleHorarioId}
                        className={`p-4 rounded-md border-2 ${color} ${textColor} ${
                          isCurrent
                            ? "border-blue-500 shadow-blue-500/30 shadow-lg"
                            : jornada.estatusJornada === "AUSENTE" ||
                                jornada.estatusJornada === "AUSENTE_ENTRADA" ||
                                jornada.estatusJornada === "AUSENTE_SALIDA"
                              ? "border-red-500/50"
                              : ""
                        }`}
                        style={{
                          opacity: isCurrent ? 1 : jornada.horaEntradaReal ? 0.9 : 0.7,
                          background:
                            jornada.estatusJornada === "AUSENTE" ||
                            jornada.estatusJornada === "AUSENTE_ENTRADA" ||
                            jornada.estatusJornada === "AUSENTE_SALIDA"
                              ? "linear-gradient(to right, rgba(239, 68, 68, 0.1), transparent)"
                              : jornada.estatusJornada === "RETARDO"
                                ? "linear-gradient(to right, rgba(234, 179, 8, 0.1), transparent)"
                                : isCurrent
                                  ? "linear-gradient(to right, rgba(59, 130, 246, 0.1), transparent)"
                                  : "",
                        }}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center">
                            <p className={`text-xl font-bold ${isCurrent ? "text-white" : textColor}`}>
                              {formatHoraProgramada(jornada.horaEntradaProgramada)} -{" "}
                              {formatHoraProgramada(jornada.horaSalidaProgramada)}
                            </p>
                            <span className="text-sm font-normal text-zinc-400 ml-2">(T{jornada.turno})</span>
                            {hasDelay && (
                              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-300 rounded-full">
                                {jornada.minutosRetardoPreliminar} min
                              </span>
                            )}
                          </div>
                          <div className={`flex items-center gap-2 p-2 rounded-full ${bgColor}`}>{icon}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div className={`rounded-lg p-3 border ${getTimeBoxColor(jornada.estatusJornada, "entrada")}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <LogIn className="h-4 w-4 text-zinc-400" />
                              <p className="text-base font-medium">Entrada</p>
                            </div>
                            <p className="text-2xl font-bold">{formatHoraReal(jornada.horaEntradaReal)}</p>
                          </div>
                          <div className={`rounded-lg p-3 border ${getTimeBoxColor(jornada.estatusJornada, "salida")}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <LogOut className="h-4 w-4 text-zinc-400" />
                              <p className="text-base font-medium">Salida</p>
                            </div>
                            <p className="text-2xl font-bold">{formatHoraReal(jornada.horaSalidaReal)}</p>
                          </div>
                        </div>
                        {jornada.minutosRetardoPreliminar !== null && jornada.minutosRetardoPreliminar > 0 && (
                          <p className="text-xs text-yellow-400 mt-2 text-center flex items-center justify-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Retardo: {jornada.minutosRetardoPreliminar} min
                          </p>
                        )}
                      </div>
                    )
                  })
                : Array.from({ length: getMaxSessionsToShow() }).map((_, index) => (
                    <div
                      key={`jornada-placeholder-${index}`}
                      className="p-4 rounded-md border-2 border-zinc-700 bg-zinc-800/50"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-xl font-bold text-zinc-600">00:00 - 00:00</p>
                        <div className="flex items-center gap-2 p-2 rounded-full bg-zinc-700/20">
                          <Clock className="h-5 w-5 text-zinc-600" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="rounded-lg p-3 border bg-zinc-800 text-zinc-600 border-zinc-700">
                          <div className="flex items-center gap-2 mb-1">
                            <LogIn className="h-4 w-4 text-zinc-600" />
                            <p className="text-base font-medium">Entrada</p>
                          </div>
                          <p className="text-2xl font-bold">—</p>
                        </div>
                        <div className="rounded-lg p-3 border bg-zinc-800 text-zinc-600 border-zinc-700">
                          <div className="flex items-center gap-2 mb-1">
                            <LogOut className="h-4 w-4 text-zinc-600" />
                            <p className="text-base font-medium">Salida</p>
                          </div>
                          <p className="text-2xl font-bold">—</p>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </div>

          {/* Reloj principal - centrado */}

          < Card
          className={`relative flex-1 overflow-hidden p-4 text-white shadow-lg border-2 transition-colors duration-300 ${getPanelColor()}`}
            ref={containerRef}
          >
            {/* Mensaje de resultado como overlay - posición fija */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div
                className={`text-5xl font-bold transition-opacity duration-300 ${getResultMessageColor()} ${
                  scanState === "success" || scanState === "background-success"
                    ? "drop-shadow-[0_0_20px_rgba(74,222,128,0.8)]"
                    : scanState === "failed" || scanState === "background-failed"
                      ? "drop-shadow-[0_0_20px_rgba(248,113,113,0.8)]"
                      : ""
                }`}
                style={{ opacity: showOverlayMessage ? 0.95 : 0 }}
              >
                {getResultMessage()}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center h-full">
              {/* Sección de escáner de huellas - siempre en la misma posición */}
              <div className="flex flex-col items-center justify-center">
                {/* Contenedor de animación de huella - más grande */}
                <div className="relative mb-6 flex h-64 w-64 items-center justify-center">
                  {/* Base de huella - siempre visible con color dinámico */}
                  <svg className="absolute h-56 w-56" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <g
                      className="fingerprint-base"
                      stroke={
                        scanState === "success" || scanState === "background-success"
                          ? "rgba(34, 197, 94, 0.3)"
                          : scanState === "failed" || scanState === "background-failed"
                            ? "rgba(239, 68, 68, 0.3)"
                            : "rgba(59, 130, 246, 0.3)"
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

                  {/* Estado Idle o Ready - círculo pulsante con color neutro */}
                  {(scanState === "idle" || scanState === "ready") && (
                    
                    <>
                    
                      <motion.div
                        className="absolute h-56 w-56 rounded-full bg-blue-500/10"
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
                        <Fingerprint className="h-36 w-36 text-blue-500/80" />
                      </motion.div>
                      
                    </>
                  )}

                  {/* Animación de preparación para el siguiente escaneo */}
                  {preparingNextScan && (
                    <>
                      <motion.div
                        className="absolute h-68 w-68 rounded-full border-2 border-blue-500/50"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{
                          scale: [0.8, 1.2, 1],
                          opacity: [0, 0.8, 0],
                        }}
                        transition={{
                          duration: 1.2,
                          times: [0, 0.5, 1],
                          ease: "easeInOut",
                        }}
                      />
                      <div className="absolute -bottom-10 text-center">
                        <p className="text-blue-400 text-sm">Preparando siguiente escaneo...</p>
                      </div>
                    </>
                  )}

                  {(scanState === "scanning" || scanState === "background-scanning") && (
                    <>
                      {/* Crestas de huella siendo llenadas */}
                      <svg className="absolute h-56 w-56" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <g className="fingerprint-scan" stroke="rgba(59, 130, 246, 0.8)" fill="none" strokeWidth="2.5">
                          <motion.path
                            d="M50,15 C25,15 15,30 15,50 C15,70 25,85 50,85 C75,85 85,70 85,50 C85,30 75,15 50,15 Z"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: scanProgress >= 15 ? 1 : scanProgress / 15 }}
                            transition={{ duration: 0.2 }}
                          />
                          <motion.path
                            d="M50,20 C30,20 20,35 20,50 C20,65 30,80 50,80 C70,80 80,65 80,50 C80,35 70,20 50,20 Z"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: scanProgress >= 30 ? 1 : (scanProgress - 15) / 15 }}
                            transition={{ duration: 0.2 }}
                          />
                          <motion.path
                            d="M50,25 C35,25 25,35 25,50 C25,65 35,75 50,75 C65,75 75,65 75,50 C75,35 65,25 50,25 Z"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: scanProgress >= 45 ? 1 : (scanProgress - 30) / 15 }}
                            transition={{ duration: 0.2 }}
                          />
                          <motion.path
                            d="M50,30 C37,30 30,40 30,50 C30,60 37,70 50,70 C63,70 70,60 70,50 C70,40 63,30 50,30 Z"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: scanProgress >= 60 ? 1 : (scanProgress - 45) / 15 }}
                            transition={{ duration: 0.2 }}
                          />
                          <motion.path
                            d="M50,35 C40,35 35,42 35,50 C35,58 40,65 50,65 C60,65 65,58 65,50 C65,42 60,35 50,35 Z"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: scanProgress >= 75 ? 1 : (scanProgress - 60) / 15 }}
                            transition={{ duration: 0.2 }}
                          />
                          <motion.path
                            d="M50,40 C42,40 40,45 40,50 C40,55 42,60 50,60 C58,60 60,55 60,50 C60,45 58,40 50,40 Z"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: scanProgress >= 90 ? 1 : (scanProgress - 75) / 15 }}
                            transition={{ duration: 0.2 }}
                          />
                          <motion.path
                            d="M50,45 C45,45 45,47 45,50 C45,53 45,55 50,55 C55,55 55,53 55,50 C55,47 55,45 50,45 Z"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: scanProgress >= 100 ? 1 : (scanProgress - 90) / 10 }}
                            transition={{ duration: 0.2 }}
                          />
                        </g>
                      </svg>

                      {/* Efecto de barrido mejorado */}
                      <motion.div
                        className="absolute h-1.5 rounded-full bg-blue-500/70"
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

                      {/* Efecto de brillo adicional */}
                      <motion.div
                        className="absolute h-56 w-56 rounded-full bg-blue-500/5"
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

                      {/* Indicador de progreso */}
                      <div className="absolute -bottom-6 h-2 w-48 overflow-hidden rounded-full bg-zinc-800">
                        <motion.div
                          className="h-full bg-blue-500"
                          initial={{ width: "0%" }}
                          animate={{ width: `${scanProgress}%` }}
                        />
                      </div>
                      <div className="absolute -bottom-12 text-center">
                        <p className="text-blue-400 text-sm">Escaneando huella digital...</p>
                      </div>
                    </>
                  )}

          {
            (scanState === "analyzing" || scanState === "background-analyzing") && (
              <>
                <svg className="absolute h-56 w-56" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <g className="fingerprint-scan" stroke="rgba(59, 130, 246, 0.8)" fill="none" strokeWidth="2.5">
                    <path d="M50,15 C25,15 15,30 15,50 C15,70 25,85 50,85 C75,85 85,70 85,50 C85,30 75,15 50,15 Z" />
                    <path d="M50,20 C30,20 20,35 20,50 C20,65 30,80 50,80 C70,80 80,65 80,50 C80,35 70,20 50,20 Z" />
                    <path d="M50,25 C35,25 25,35 25,50 C25,65 35,75 50,75 C65,75 75,65 75,50 C75,35 65,25 50,25 Z" />
                    <path d="M50,30 C37,30 30,40 30,50 C30,60 37,70 50,70 C63,70 70,60 70,50 C70,40 63,30 50,30 Z" />
                    <path d="M50,35 C40,35 35,42 35,50 C35,58 40,65 50,65 C60,65 65,58 65,50 C65,42 60,35 50,35 Z" />
                    <path d="M50,40 C42,40 40,45 40,50 C40,55 42,60 50,60 C58,60 60,55 60,50 C60,45 58,40 50,40 Z" />
                    <path d="M50,45 C45,45 45,47 45,50 C45,53 45,55 50,55 C55,55 55,53 55,50 C55,47 55,45 50,45 Z" />
                  </g>
                </svg>

                {/* Líneas de conexión entre puntos de minucia */}
                <svg className="absolute h-56 w-56" viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg">
                  <g stroke="rgba(59, 130, 246, 0.7)" strokeWidth="1.5">
                    {minutiaeLines.map((line, index) => {
                      if (minutiaePoints[line.start] && minutiaePoints[line.end]) {
                        return (
                          <motion.line
                            key={index}
                            x1={minutiaePoints[line.start].x}
                            y1={minutiaePoints[line.start].y}
                            x2={minutiaePoints[line.end].x}
                            y2={minutiaePoints[line.end].y}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.8 }}
                            transition={{ duration: 0.3, delay: index * 0.03 }}
                          />
                        )
                      }
                      return null
                    })}
                  </g>
                </svg>

                {/* Puntos de minucia */}
                <div className="absolute h-56 w-56">
                  {minutiaePoints.map((point, index) => (
                    <motion.div
                      key={index}
                      className="absolute h-3 w-3 rounded-full bg-blue-500"
                      style={{
                        left: `calc(50% + ${point.x}px)`,
                        top: `calc(50% + ${point.y}px)`,
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: [0, 1.5, 1],
                        opacity: [0, 1, 0.8],
                      }}
                      transition={{
                        delay: index * 0.03,
                        duration: 0.3,
                      }}
                    />
                  ))}
                </div>

                <motion.div
                  className="absolute h-68 w-68 rounded-full border border-blue-500/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
                <div className="absolute -bottom-12 text-center">
                  <p className="text-blue-400 text-sm">Analizando puntos de minucia...</p>
                </div>
              </>
            )
          }

          {
            /* Estado de éxito - animación de marca de verificación verde */
          }
          {
            (scanState === "success" || scanState === "background-success") && (
              <>
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
                  <CheckCircle
                    className={`h-32 w-32 ${statusCode ? getStyleClassesForCode(statusCode).icon : "text-green-500"}`}
                  />
                </motion.div>
                <motion.div
                  className="absolute h-68 w-68 rounded-full"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: [0.8, 1.2],
                    opacity: [0, 0.5],
                  }}
                  transition={{
                    duration: 0.5,
                    ease: "easeOut",
                  }}
                  style={{
                    background: `radial-gradient(circle, ${statusCode && statusCode.startsWith("2") ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.2)"} 0%, transparent 70%)`,
                  }}
                />
              </>
            )
          }

          {
            /* Estado de fallo - animación de X roja */
          }
          {
            (scanState === "failed" || scanState === "background-failed") && (
              <>
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
                  <XCircle className={`h-32 w-32 ${statusCode ? getStyleClassesForCode(statusCode).icon : "text-red-500"}`} />
                </motion.div>
                <motion.div
                  className="absolute h-68 w-68 rounded-full"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: [0.8, 1.2],
                    opacity: [0, 0.5],
                  }}
                  transition={{
                    duration: 0.5,
                    ease: "easeOut",
                  }}
                  style={{
                    background: `radial-gradient(circle, ${statusCode && statusCode.startsWith("4") ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.2)"} 0%, transparent 70%)`,
                  }}
                />
              </>
            )
          }
          </div>

          {
            /* Mensaje de instrucción - SIEMPRE VISIBLE CON ALTURA FIJA */
          }
          <div className="h-12 flex items-center justify-center">
            {showInstructionMessage && (
              <p className="text-center text-xl font-medium text-zinc-300 flex items-center gap-2">
                {(scanState === "idle" || scanState === "ready") && (
                  <>
                    <Fingerprint className="h-5 w-5 text-blue-400 animate-pulse" />
                    Coloque su dedo en el escáner
                  </>
                )}
                {(scanState === "scanning" || scanState === "background-scanning") && (
                  <>
                    <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                    Escaneando huella...
                  </>
                )}
                {(scanState === "analyzing" || scanState === "background-analyzing") && (
                  <>
                    <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                    Identificando puntos de minucia...
                  </>
                )}
                {(scanState === "success" || scanState === "background-success") && (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Verificación exitosa
                  </>
                )}
                {(scanState === "failed" || scanState === "background-failed") && (
                  <>
                    <XCircle className="h-5 w-5 text-red-400" />
                    Huella no reconocida
                  </>
                )}
              </p>
            )}
          </div>
          </div>

          {
            /* Sección de datos de asistencia - SIEMPRE VISIBLE CON PLACEHOLDERS */
          }
          <div className="mt-4 w-full border-t-2 border-zinc-700 pt-6">
            {/* Información del usuario - siempre visible con placeholders */}
            <div className="mb-6 flex items-center gap-4">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full ${showAttendance && currentEmployee ? "bg-blue-500/30 border-2 border-blue-500" : "bg-zinc-800"}`}
              >
                <User className={`h-8 w-8 ${showAttendance && currentEmployee ? "text-blue-300" : "text-zinc-400"}`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {showAttendance && currentEmployee ? currentEmployee.name : "Usuario"}
                </h2>
                <p className="text-lg text-zinc-400">{showAttendance && currentEmployee ? currentEmployee.id : "ID-0000-0000"}</p>
              </div>
            </div>

            {/* Recuadros de Entrada/Salida - siempre visibles */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div
                className={`rounded-lg p-4 border-2 ${
                  showAttendance && lastAction === "entrada"
                    ? getTimeBoxColor(
                        jornadasDelDia.find((j) => j.detalleHorarioId === activeSessionId)?.estatusJornada || "PENDIENTE",
                        "entrada",
                      )
                    : "bg-zinc-800 border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <LogIn
                    className={`h-6 w-6 ${showAttendance && lastAction === "entrada" && statusCode ? getStyleClassesForCode(statusCode).icon : "text-zinc-400"}`}
                  />
                  <p className="text-lg font-medium">Entrada</p>
                </div>
                <p
                  className={`text-2xl font-bold ${
                    showAttendance && lastAction === "entrada"
                      ? statusCode
                        ? getStyleClassesForCode(statusCode).text
                        : "text-white"
                      : "text-zinc-600"
                  }`}
                >
                  {showAttendance && lastAction === "entrada" && activeSessionId !== null
                    ? jornadasDelDia.find((j) => j.detalleHorarioId === activeSessionId)?.horaEntradaReal
                      ? formatTime(jornadasDelDia.find((j) => j.detalleHorarioId === activeSessionId)?.horaEntradaReal || null)
                      : getNextScheduledTime().entryTime
                    : "00:00"}
                </p>
                {showAttendance && lastAction === "entrada" && statusCode && statusCode === "202" && (
                  <div className="mt-2 text-xs text-yellow-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Entrada con retardo
                  </div>
                )}
              </div>

              <div
                className={`rounded-lg p-4 border-2 ${
                  showAttendance && lastAction === "salida"
                    ? getTimeBoxColor(
                        jornadasDelDia.find((j) => j.detalleHorarioId === activeSessionId)?.estatusJornada || "PENDIENTE",
                        "salida",
                      )
                    : "bg-zinc-800 border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <LogOut
                    className={`h-6 w-6 ${showAttendance && lastAction === "salida" && statusCode ? getStyleClassesForCode(statusCode).icon : "text-zinc-400"}`}
                  />
                  <p className="text-lg font-medium">Salida</p>
                </div>
                <p
                  className={`text-2xl font-bold ${
                    showAttendance && lastAction === "salida"
                      ? statusCode
                        ? getStyleClassesForCode(statusCode).text
                        : "text-white"
                      : "text-zinc-600"
                  }`}
                >
                  {showAttendance && lastAction === "salida" && activeSessionId !== null
                    ? jornadasDelDia.find((j) => j.detalleHorarioId === activeSessionId)?.horaSalidaReal
                      ? formatTime(jornadasDelDia.find((j) => j.detalleHorarioId === activeSessionId)?.horaSalidaReal || null)
                      : getNextScheduledTime().exitTime
                    : "00:00"}
                </p>
                {showAttendance && lastAction === "salida" && statusCode && statusCode.startsWith("3") && (
                  <div className="mt-2 text-xs text-blue-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {getUserFriendlyMessage(statusCode, statusData)}
                  </div>
                )}
              </div>
            </div>

            {/* Estadísticas eliminadas para ahorrar espacio */}
          </div>
          </div>
          </Card>

                    {/* Panel derecho: Historial de escaneos - limitado a 6 elementos */}
                    <div className="w-full md:w-80 bg-zinc-900 rounded-lg p-4 border-2 border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <History className="h-6 w-6 text-zinc-400" />
              <h3 className="text-xl font-bold text-zinc-300">Últimos Registros</h3>
            </div>

            <div className="space-y-4">
          {
            scanHistory.length === 0
              ? // Placeholders cuando no hay historial
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={`history-placeholder-${index}`} className="flex items-center gap-3 p-3 rounded-md bg-zinc-800/30">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center bg-zinc-800">
                      <Clock className="h-5 w-5 text-zinc-600" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-zinc-600">Sin registro</p>
                      <p className="text-base text-zinc-700">00:00:00 • —</p>
                    </div>
                  </div>
                ))
              : // Historial real con opacidad basada en tiempo de inactividad
                scanHistory
                  .slice(0, 6)
                  .map((scan, index) => {
                    // Get background color based on status code
                    const bgColorClass =
                      scan.statusCode && scan.statusCode.startsWith("200")
                        ? "bg-green-500/30"
                        : scan.statusCode && scan.statusCode.startsWith("201")
                          ? "bg-blue-500/30"
                          : scan.statusCode && scan.statusCode.startsWith("202")
                            ? "bg-yellow-500/30"
                            : "bg-zinc-500/30"

                    // Determinar el icono basado en el código de estado y la acción
                    let ActionIcon = scan.action === "entrada" ? LogIn : LogOut
                    let iconColorClass = "text-green-500" // Default color
                    
                    if (scan.statusCode) {
                      if (scan.statusCode.startsWith("2")) {
                        // Siempre usar el icono correcto basado en la acción, no en el código de estado
                        ActionIcon = scan.action === "entrada" ? LogIn : LogOut
                        // Set color based on status code
                        if (scan.statusCode.startsWith("200")) {
                          iconColorClass = "text-green-500"
                        } else if (scan.statusCode.startsWith("201")) {
                          iconColorClass = "text-blue-500"
                        } else if (scan.statusCode.startsWith("202")) {
                          iconColorClass = "text-orange-500"
                        }
                      } else if (scan.statusCode.startsWith("3")) {
                        ActionIcon = AlertCircle
                        iconColorClass = "text-blue-500"
                      } else if (scan.statusCode.startsWith("4")) {
                        ActionIcon = XCircle
                        iconColorClass = "text-red-500"
                      } else if (scan.statusCode.startsWith("5")) {
                        ActionIcon = ShieldAlert
                        iconColorClass = "text-red-500"
                      }
                    }

                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-md ${
                          scan.statusCode && scan.statusCode.startsWith("2")
                            ? "bg-green-900/20 border border-green-800/30"
                            : scan.statusCode && scan.statusCode.startsWith("3")
                              ? "bg-blue-900/20 border border-blue-800/30"
                              : scan.statusCode && scan.statusCode.startsWith("4")
                                ? "bg-red-900/20 border border-red-800/30"
                                : "bg-zinc-800/50"
                        }`}
                        style={{
                          opacity: index === 0 ? 1 : Math.max(0.5, 1 - inactiveTime * 0.01 * index),
                          transition: "opacity 1s ease",
                        }}
                      >
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${bgColorClass}`}>
                          <ActionIcon className={`h-6 w-6 ${iconColorClass}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-lg font-bold text-white">{scan.name}</p>
                          <div className="flex justify-between items-center">
                            <p className="text-base text-zinc-400">{format(scan.time, "HH:mm:ss")}</p>
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                scan.action === "entrada" ? "bg-green-500/20 text-green-300" : "bg-blue-500/20 text-blue-300"
                              }`}
                            >
                              {scan.action === "entrada" ? "Entrada" : "Salida"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })
          }
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

