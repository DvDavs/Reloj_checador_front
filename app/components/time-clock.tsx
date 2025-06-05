"use client"

import { useState, useEffect, useRef } from "react"
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
  PlayCircle,
  User,
  LogIn,
  LogOut,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import axios from 'axios'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

// Actualizar los tipos para soportar múltiples sesiones y patrones de asistencia

// Añadir nuevos tipos para el estado de la sesión y patrones de asistencia
type SessionStatus =
  | "entrada-ok"
  | "salida-ok"
  | "entrada-tarde"
  | "salida-incidente"
  | "salida-pendiente"
  | "ausente"
  | "pendiente"

// Definir un tipo para la sesión de trabajo
type WorkSession = {
  id: number
  entryTime: string | null
  exitTime: string | null
  scheduledEntry: string
  scheduledExit: string
  entryStatus: SessionStatus
  exitStatus: SessionStatus
  isCurrent: boolean
  employeeId: string
}

// Definición del DTO que esperamos del nuevo endpoint
type JornadaEstadoDto = {
  detalleHorarioId: number;
  horarioAsignadoId: number;
  horarioNombre: string;
  turno: number;
  horaEntradaProgramada: string; // Formato "HH:mm:ss"
  horaSalidaProgramada: string; // Formato "HH:mm:ss"
  horaEntradaReal: string | null; // Formato "yyyy-MM-dd HH:mm:ss"
  horaSalidaReal: string | null; // Formato "yyyy-MM-dd HH:mm:ss"
  estatusJornada: string; // "PENDIENTE", "EN_CURSO", "COMPLETADA", "RETARDO", "AUSENTE_ENTRADA", etc.
  minutosRetardoPreliminar: number | null;
};

// Corregir los tipos de DTOs para que coincidan con el backend
type EmpleadoDto = {
  id: number
  rfc: string
  curp: string
  primerNombre: string
  segundoNombre: string | null
  primerApellido: string
  segundoApellido: string | null
  departamentoAcademicoId: number | null
  departamentoAdministrativoId: number | null
  tipoNombramientoPrincipal: string | null
  tipoNombramientoSecundario: string | null
  estatusId: number | null
  nombreCompleto: string
  // Campos adicionales calculados para UI
  totalHoras?: string
  horasSemana?: string
}

type HorarioDto = {
  id: number
  nombre: string
  descripcion: string | null
  activo: boolean
  detalles: DetalleHorarioDto[]
}

type DetalleHorarioDto = {
  id: number
  diaSemana: number
  horaEntrada: string
  horaSalida: string
  toleranciaEntrada: number
  toleranciaSalida: number
}

type HorarioAsignadoDto = {
  id: number
  empleadoId: number
  empleadoNombre: string | null
  horarioId: number
  horarioNombre: string
  tipoHorarioId: number | null
  tipoHorarioNombre: string | null
  fechaInicio: string
  fechaFin: string | null
  // Campos adicionales para la UI
  entryTime?: string | null
  exitTime?: string | null
  horaEntrada?: string
  horaSalida?: string
  estadoEntrada?: SessionStatus
  estadoSalida?: SessionStatus
  actual?: boolean
}

// Definir tipo para eventos del checador recibidos por WebSocket según el backend
type BackendChecadorEvent = {
  readerName: string
  identificado: boolean
  empleadoId?: number
  nombreCompleto?: string
  rfc?: string
  errorMessage?: string
  accion?: 'entrada' | 'salida'
}

// Actualizar el tipo ScanHistoryItem para incluir información de la sesión
type ScanHistoryItem = {
  name: string
  time: Date
  success: boolean
  action: "entrada" | "salida"
  sessionId?: number
  employeeId: string
}

// Definir todos los posibles estados de escaneo
type ScanState =
  | "idle"
  | "scanning"
  | "analyzing"
  | "success"
  | "failed"
  | "ready"
  | "background-scanning"
  | "background-analyzing"
  | "background-success"
  | "background-failed"

// Añadir datos de prueba más variados para las sesiones de trabajo
const mockWorkSessions: WorkSession[] = [
  // Empleado 1: Alejandro Jiménez - Jornada completa con entrada tarde
  {
    id: 1,
    entryTime: "08:05",
    exitTime: "15:00",
    scheduledEntry: "08:00",
    scheduledExit: "15:00",
    entryStatus: "entrada-tarde",
    exitStatus: "salida-ok",
    isCurrent: false,
    employeeId: "EMP-2023-0042",
  },
  // Empleado 2: María García - Jornada actual sin salida
  {
    id: 2,
    entryTime: "08:00",
    exitTime: null,
    scheduledEntry: "08:00",
    scheduledExit: "15:00",
    entryStatus: "entrada-ok",
    exitStatus: "pendiente",
    isCurrent: true,
    employeeId: "EMP-2023-0078",
  },
  // Empleado 3: David Chávez - Jornada pendiente
  {
    id: 3,
    entryTime: null,
    exitTime: null,
    scheduledEntry: "16:00",
    scheduledExit: "20:00",
    entryStatus: "pendiente",
    exitStatus: "pendiente",
    isCurrent: false,
    employeeId: "EMP-2023-0103",
  },
  // Empleado 4: Laura Martínez - Jornada con salida temprana
  {
    id: 4,
    entryTime: "09:00",
    exitTime: "13:45",
    scheduledEntry: "09:00",
    scheduledExit: "14:00",
    entryStatus: "entrada-ok",
    exitStatus: "salida-incidente",
    isCurrent: false,
    employeeId: "EMP-2023-0115",
  },
  // Empleado 5: Carlos Rodríguez - Jornada completa
  {
    id: 5,
    entryTime: "07:00",
    exitTime: "15:00",
    scheduledEntry: "07:00",
    scheduledExit: "15:00",
    entryStatus: "entrada-ok",
    exitStatus: "salida-ok",
    isCurrent: false,
    employeeId: "EMP-2023-0127",
  },
  // Empleado 1: Alejandro Jiménez - Jornada anterior
  {
    id: 6,
    entryTime: "08:00",
    exitTime: "15:00",
    scheduledEntry: "08:00",
    scheduledExit: "15:00",
    entryStatus: "entrada-ok",
    exitStatus: "salida-ok",
    isCurrent: false,
    employeeId: "EMP-2023-0042",
  },
  // Empleado 1: Alejandro Jiménez - Jornada con ausencia
  {
    id: 7,
    entryTime: null,
    exitTime: null,
    scheduledEntry: "08:00",
    scheduledExit: "15:00",
    entryStatus: "ausente",
    exitStatus: "ausente",
    isCurrent: false,
    employeeId: "EMP-2023-0042",
  },
]

// Datos de empleados de prueba
const mockEmployees = [
  {
    id: "EMP-2023-0042",
    name: "Alejandro Jiménez",
    totalHours: "8h 45m",
    weeklyHours: "34h 15m",
  },
  {
    id: "EMP-2023-0078",
    name: "María García",
    totalHours: "6h 30m",
    weeklyHours: "28h 45m",
  },
  {
    id: "EMP-2023-0103",
    name: "David Chávez",
    totalHours: "7h 15m",
    weeklyHours: "32h 20m",
  },
  {
    id: "EMP-2023-0115",
    name: "Laura Martínez",
    totalHours: "5h 45m",
    weeklyHours: "29h 30m",
  },
  {
    id: "EMP-2023-0127",
    name: "Carlos Rodríguez",
    totalHours: "9h 15m",
    weeklyHours: "38h 45m",
  },
]

// Historial de escaneos inicial
const initialScanHistory: ScanHistoryItem[] = [
  {
    name: "Carlos Rodríguez",
    time: new Date(new Date().setHours(7, 0, 0)),
    success: true,
    action: "entrada",
    sessionId: 5,
    employeeId: "EMP-2023-0127",
  },
  {
    name: "Laura Martínez",
    time: new Date(new Date().setHours(9, 0, 0)),
    success: true,
    action: "entrada",
    sessionId: 4,
    employeeId: "EMP-2023-0115",
  },
  {
    name: "Desconocido",
    time: new Date(new Date().setHours(8, 30, 0)),
    success: false,
    action: "entrada",
    employeeId: "",
  },
]

// Actualizar el componente para incluir las nuevas variables de estado y funciones
export default function TimeClock({ selectedReader, sessionId }: { selectedReader: string, sessionId: string }) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [scanState, setScanState] = useState<ScanState>("idle")
  const [showAttendance, setShowAttendance] = useState(false)
  const [minutiaePoints, setMinutiaePoints] = useState<{ x: number; y: number }[]>([])
  const [minutiaeLines, setMinutiaeLines] = useState<{ start: number; end: number }[]>([])
  const [scanProgress, setScanProgress] = useState(0)
  const [scanResult, setScanResult] = useState<"success" | "failed" | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [demoMode, setDemoMode] = useState(false)
  const [quickMode, setQuickMode] = useState(false)
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([])
  const [preparingNextScan, setPreparingNextScan] = useState(false)
  const [lastAction, setLastAction] = useState<"entrada" | "salida" | null>(null)
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null)
  const [panelFlash, setPanelFlash] = useState<"success" | "failed" | null>(null)
  const [inactiveTime, setInactiveTime] = useState(0)
  const [showOverlayMessage, setShowOverlayMessage] = useState(false)
  const [windowHeight, setWindowHeight] = useState(0)
  const [showInstructionMessage, setShowInstructionMessage] = useState(true)
  
  // Nuevas variables de estado para integración con backend
  const [stompClient, setStompClient] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [readerName, setReaderName] = useState(selectedReader)
  const [browserSessionId, setBrowserSessionId] = useState(sessionId)
  const [currentEmployeeData, setCurrentEmployeeData] = useState<EmpleadoDto | null>(null)
  const [currentWorkSessions, setCurrentWorkSessions] = useState<HorarioAsignadoDto[]>([])
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([])
  const [jornadasDelDia, setJornadasDelDia] = useState<JornadaEstadoDto[]>([])
  const [currentEmployee, setCurrentEmployee] = useState<{id: string, name: string, totalHours?: string, weeklyHours?: string}>({
    id: "",
    name: "",
  })

  const scanTimeout = useRef<NodeJS.Timeout | null>(null)
  const resetTimeout = useRef<NodeJS.Timeout | null>(null)
  const demoTimeout = useRef<NodeJS.Timeout | null>(null)
  const inactiveTimeout = useRef<NodeJS.Timeout | null>(null)
  const audioSuccess = useRef<HTMLAudioElement | null>(null)
  const audioError = useRef<HTMLAudioElement | null>(null)
  const audioScan = useRef<HTMLAudioElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // API Base URL para las peticiones
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  
  // Referencia para el cliente STOMP
  const stompClientRef = useRef<Client | null>(null);

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
      if (demoTimeout.current) clearTimeout(demoTimeout.current)
      if (inactiveTimeout.current) clearTimeout(inactiveTimeout.current)
    }
  }, [])

  // Inicializar conexión WebSocket
  useEffect(() => {
    // Almacenar los valores de props en estado local
    setReaderName(selectedReader);
    setBrowserSessionId(sessionId);
    
    // Conectar al WebSocket primero
    connectWebSocket();

    // Cleanup: desconectar al desmontar componente
    return () => {
      stopChecadorAndReleaseReader();
    };
  }, [selectedReader, sessionId]);

  // Función para conectar al WebSocket
  const connectWebSocket = () => {
    try {
      // Crear nueva instancia del cliente STOMP
      const client = new Client({
        webSocketFactory: () => {
          return new SockJS(`${API_BASE_URL}/ws-fingerprint`);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log("Conectado a WebSocket vía SockJS");
          setIsConnected(true);
          
          // Suscribirse al topic específico para este lector
          const topic = `/topic/checador/${encodeURIComponent(readerName)}`;
          console.log(`Suscribiéndose a: ${topic}`);
          client.subscribe(topic, (message) => {
            handleChecadorEvent(JSON.parse(message.body));
          });
          
          // Ahora que estamos conectados, iniciamos el proceso de checador
          initiateChecadorProcess();
        },
        onDisconnect: () => {
          console.log("Desconectado de WebSocket");
          setIsConnected(false);
        },
        onStompError: (frame) => {
          console.error("Error STOMP:", frame);
          setApiError(`Error en la conexión WebSocket: ${frame.headers.message}`);
          setIsConnected(false);
        }
      });

      client.activate();
      stompClientRef.current = client;
      setStompClient(client);
    } catch (error) {
      console.error("Error al inicializar WebSocket:", error);
      setApiError(`Error al inicializar WebSocket: ${error}`);
    }
  };

  // Desconectar WebSocket
  const disconnectWebSocket = () => {
    if (stompClientRef.current) {
      try {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
        setStompClient(null);
        setIsConnected(false);
      } catch (error) {
        console.error("Error al desconectar WebSocket:", error);
      }
    }
  };

  // Iniciar el proceso de checador: reservar lector e iniciar escaneo
  const initiateChecadorProcess = async () => {
    try {
      setApiError(null);
      setScanState("idle");
      
      // 1. Reservar el lector
      await axios.post(
        `${API_BASE_URL}/api/v1/multi-fingerprint/reserve/${encodeURIComponent(readerName)}`, 
        null, 
        { params: { sessionId: browserSessionId } }
      );
      
      console.log(`Lector ${readerName} reservado correctamente`);
      
      // 2. Iniciar el proceso de checador - CORREGIR URL
      await axios.post(
        `${API_BASE_URL}/api/v1/multi-fingerprint/checador/start/${encodeURIComponent(readerName)}`,
        null,
        { params: { sessionId: browserSessionId } }
      );
      
      console.log("Proceso de checador iniciado");
      setScanState("ready");
    } catch (error: any) {
      console.error("Error al iniciar proceso de checador:", error);
      setApiError(`Error: ${error.response?.data?.mensaje || error.message}`);
      setScanState("failed");
    }
  };

  // Detener checador y liberar lector
  const stopChecadorAndReleaseReader = async () => {
    try {
      if (readerName && browserSessionId) {
        // 1. Intentar detener el checador - CORREGIR URL
        try {
          await axios.post(
            `${API_BASE_URL}/api/v1/multi-fingerprint/checador/stop/${encodeURIComponent(readerName)}`,
            null,
            { params: { sessionId: browserSessionId } }
          );
          console.log("Proceso checador detenido correctamente");
        } catch (error) {
          console.error("Error al detener el checador:", error);
          // Continuar para intentar liberar el lector de todos modos
        }
        
        // 2. Liberar el lector
        await axios.post(
          `${API_BASE_URL}/api/v1/multi-fingerprint/release/${encodeURIComponent(readerName)}`,
          null,
          { params: { sessionId: browserSessionId } }
        );
        console.log("Lector liberado correctamente");
      }
      
      // Finalmente, desconectar WebSocket
      disconnectWebSocket();
    } catch (error) {
      console.error("Error en el proceso de limpieza:", error);
    }
  };

  // Manejar eventos recibidos por WebSocket desde el backend
  const handleChecadorEvent = (event: BackendChecadorEvent) => {
    try {
      console.log("Evento de checador recibido:", event);
      
      if (event.identificado) {
        // Escaneo exitoso - empleado identificado
        setScanState("success");
        setScanResult("success");
        setPanelFlash("success");
        setShowOverlayMessage(true);
        setShowInstructionMessage(false);
        
        if (event.empleadoId !== undefined && event.nombreCompleto) {
          // Actualizar información del empleado actual
          setCurrentEmployee({
            id: event.empleadoId.toString(),
            name: event.nombreCompleto,
          });
          
          // Cargar detalles completos del empleado
          fetchEmployeeDetails(event.empleadoId);
          
          // Vuelve a cargar el estado de las jornadas para reflejar la nueva checada
          fetchEstadoJornadas(event.empleadoId);
          
          // Determinar si fue entrada o salida (esto debería venir del backend idealmente)
          const action = event.accion || determineNextAction();
          setLastAction(action);
          
          // Añadir al historial local
          const newScan: ScanHistoryItem = {
            name: event.nombreCompleto,
            time: new Date(),
            success: true,
            action: action,
            employeeId: event.empleadoId.toString(),
          };
          setScanHistory(prev => [newScan, ...prev.slice(0, 2)]);
          
          // Mostrar la información de asistencia
          setShowAttendance(true);
          
          // Preparar para el siguiente escaneo
          setPreparingNextScan(true);
          setTimeout(() => {
            setScanState("ready");
            setPreparingNextScan(false);
          }, 3000);
        }
      } else {
        // Escaneo fallido - empleado no identificado
        setScanState("failed");
        setScanResult("failed");
        setPanelFlash("failed");
        setShowOverlayMessage(true);
        setShowInstructionMessage(false);
        
        // Añadir al historial local
        const failedScan: ScanHistoryItem = {
          name: "Desconocido",
          time: new Date(),
          success: false,
          action: "entrada", // Por defecto
          employeeId: "",
        };
        setScanHistory(prev => [failedScan, ...prev.slice(0, 2)]);
        
        // Después del fracaso, resetear al estado ready
        setTimeout(() => {
          setScanState("ready");
        }, 3500);
      }
    } catch (error) {
      console.error("Error al procesar evento de checador:", error);
    }
  };

  // Cargar detalles completos del empleado
  const fetchEmployeeDetails = async (employeeId: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/empleados/${employeeId}`);
      setCurrentEmployeeData(response.data);
      
      // Cargar estado de jornadas del día
      fetchEstadoJornadas(employeeId);
    } catch (error) {
      console.error("Error al cargar detalles del empleado:", error);
    }
  };

  // Cargar estado de jornadas del empleado para el día actual
  const fetchEstadoJornadas = async (employeeId: number) => {
    try {
      // Incluir la fecha actual en formato ISO (YYYY-MM-DD)
      const today = new Date().toISOString().split('T')[0];
      
      // Llamar al NUEVO endpoint
      const response = await axios.get<JornadaEstadoDto[]>(
        `${API_BASE_URL}/api/asistencias/estado-diario/${employeeId}/${today}`
      );
      
      setJornadasDelDia(response.data); // Actualizar el nuevo estado
      
      // También actualizar el estado workSessions para mantener compatibilidad con la UI actual
      // Este mapeo puede eliminarse más adelante cuando se actualice la UI para usar jornadasDelDia directamente
      const mappedSessions: WorkSession[] = response.data.map((jornada: JornadaEstadoDto) => {
        // Extraer solo la parte de hora de horaEntradaReal y horaSalidaReal (si existen)
        const entryTime = jornada.horaEntradaReal ? 
          jornada.horaEntradaReal.split(' ')[1].substring(0, 5) : null;  // Obtener "HH:mm" de "yyyy-MM-dd HH:mm:ss"
        const exitTime = jornada.horaSalidaReal ? 
          jornada.horaSalidaReal.split(' ')[1].substring(0, 5) : null;   // Obtener "HH:mm" de "yyyy-MM-dd HH:mm:ss"
        
        // Extraer solo la parte de hora de horaEntradaProgramada y horaSalidaProgramada
        const scheduledEntry = jornada.horaEntradaProgramada.substring(0, 5); // Obtener "HH:mm" de "HH:mm:ss"
        const scheduledExit = jornada.horaSalidaProgramada.substring(0, 5);   // Obtener "HH:mm" de "HH:mm:ss"
        
        // Determinar estados basados en el estatusJornada
        let entryStatus: SessionStatus = "pendiente";
        let exitStatus: SessionStatus = "pendiente";
        
        switch (jornada.estatusJornada) {
          case "PENDIENTE":
            entryStatus = "pendiente";
            exitStatus = "pendiente";
            break;
          case "EN_CURSO":
            entryStatus = "entrada-ok";
            exitStatus = "pendiente";
            break;
          case "COMPLETADA":
            entryStatus = "entrada-ok";
            exitStatus = "salida-ok";
            break;
          case "RETARDO":
            entryStatus = "entrada-tarde";
            exitStatus = "pendiente";
            break;
          case "AUSENTE_ENTRADA":
            entryStatus = "ausente";
            exitStatus = "ausente";
            break;
          // Agregar más casos según sea necesario
          default:
            entryStatus = "pendiente";
            exitStatus = "pendiente";
        }
        
        // Determinar si es el horario actual
        const isCurrent = jornada.estatusJornada === "EN_CURSO" || jornada.estatusJornada === "RETARDO";
        
        return {
          id: jornada.horarioAsignadoId,
          entryTime,
          exitTime,
          scheduledEntry,
          scheduledExit,
          entryStatus,
          exitStatus,
          isCurrent,
          employeeId: employeeId.toString()
        };
      });
      
      setWorkSessions(mappedSessions);
    } catch (error: any) {
      console.error("Error al cargar estado de jornadas:", error);
      setApiError(`Error cargando jornadas: ${error.message || "Error desconocido"}`);
      setJornadasDelDia([]);
      setWorkSessions([]);
    }
  };

  // Iniciar escaneo manualmente (modificado para funcionar mejor con modo real)
  const startScan = (): void => {
    if (demoMode) {
      // En modo demo, simular eventos del backend
      setScanState("scanning");
      setScanProgress(0);
      setShowInstructionMessage(true);
      setShowOverlayMessage(false);
      setScanResult(null);
      
      // Simular progreso
      const progressInterval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setScanState("analyzing");
            
            // Simular análisis
            setTimeout(() => {
              const isSuccess = Math.random() > 0.2; // 80% tasa de éxito
              
              // Simular un evento del backend
              const mockEvent: BackendChecadorEvent = {
                readerName,
                identificado: isSuccess,
                ...(isSuccess ? {
                  empleadoId: 123,
                  nombreCompleto: "Empleado Simulado",
                  rfc: "SIMU800101XXX",
                  accion: Math.random() > 0.5 ? "entrada" : "salida"
                } : {})
              };
              
              handleChecadorEvent(mockEvent);
            }, 800);
            
            return 100;
          }
          return prev + 5;
        });
      }, 50);
    } else if (stompClientRef.current && isConnected) {
      // En modo real, no necesitamos hacer nada especial aquí
      // El proceso de escaneo es continuo después de initiateChecadorProcess
      
      // Podemos reiniciar el proceso checador si es necesario
      initiateChecadorProcess();
    }
  };

  // Modificar determineNextAction para usar datos reales
  const determineNextAction = (): "entrada" | "salida" => {
    // Si no hay jornadas o empleado, no podemos determinar la acción
    if (jornadasDelDia.length === 0 || !currentEmployee.id) {
      setActiveSessionId(null);
      return "entrada"; // Por defecto, entrada
    }

    // Verificar si hay una jornada en curso (EN_CURSO o RETARDO)
    const jornadaEnCurso = jornadasDelDia.find(
      (jornada) => jornada.estatusJornada === "EN_CURSO" || jornada.estatusJornada === "RETARDO"
    );

    if (jornadaEnCurso) {
      // Si hay una jornada en curso, la próxima acción es una salida
      setActiveSessionId(jornadaEnCurso.detalleHorarioId);
      return "salida";
    }

    // No hay jornada en curso, buscar la próxima jornada pendiente
    // Obtener la hora actual en formato HH:mm:ss para comparar con horaEntradaProgramada
    const now = new Date();
    const currentTimeString = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    
    // Ordenar jornadas pendientes por hora de entrada (más cercana primero)
    const jornadasPendientes = jornadasDelDia
      .filter(jornada => jornada.estatusJornada === "PENDIENTE")
      .sort((a, b) => a.horaEntradaProgramada.localeCompare(b.horaEntradaProgramada));
    
    if (jornadasPendientes.length > 0) {
      // Encontrar la primera jornada pendiente que aún no ha comenzado o ha pasado por poco tiempo
      const proximaJornada = jornadasPendientes[0];
      setActiveSessionId(proximaJornada.detalleHorarioId);
      return "entrada";
    }

    // Si no hay jornadas en curso ni pendientes, buscar jornadas ausentes
    const jornadaAusente = jornadasDelDia.find(
      (jornada) => jornada.estatusJornada === "AUSENTE_ENTRADA" || jornada.estatusJornada === "AUSENTE"
    );

    if (jornadaAusente) {
      // Si hay una jornada marcada como ausente, permitir entrada tardía
      setActiveSessionId(jornadaAusente.detalleHorarioId);
      return "entrada";
    }

    // Por defecto, si no hay ninguna condición, asumir entrada
    setActiveSessionId(null);
    return "entrada";
  };

  // Función auxiliar para obtener icono y color de estado
  const getStatusIndicator = (status: SessionStatus | string) => {
    if (typeof status === 'string') {
      // Nuevos estados del backend
      switch (status) {
        case "COMPLETADA":
          return {
            icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
            color: "border-zinc-700",
            textColor: "text-white",
            bgColor: "bg-green-500/20",
          };
        case "EN_CURSO":
          return {
            icon: <Zap className="h-5 w-5 text-blue-500 animate-pulse" />,
            color: "border-blue-500",
            textColor: "text-white",
            bgColor: "bg-blue-500/20",
          };
        case "RETARDO":
          return {
            icon: <Clock className="h-5 w-5 text-yellow-500" />,
            color: "border-zinc-700",
            textColor: "text-white",
            bgColor: "bg-yellow-500/20",
          };
        case "AUSENTE_ENTRADA":
        case "AUSENTE_SALIDA":
        case "AUSENTE":
          return {
            icon: <XCircle className="h-5 w-5 text-red-500" />,
            color: "border-zinc-700",
            textColor: "text-white",
            bgColor: "bg-red-500/20",
          };
        case "PENDIENTE":
        default:
          return {
            icon: <Clock className="h-5 w-5 text-zinc-500" />,
            color: "border-zinc-700",
            textColor: "text-zinc-500",
            bgColor: "bg-zinc-700/20",
          };
      }
    } else {
      // Estados antiguos para compatibilidad
      switch (status) {
        case "entrada-ok":
          return {
            icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
            color: "border-zinc-700",
            textColor: "text-white",
            bgColor: "bg-green-500/20",
          }
        case "salida-ok":
          return {
            icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
            color: "border-zinc-700",
            textColor: "text-white",
            bgColor: "bg-green-500/20",
          }
        case "entrada-tarde":
          return {
            icon: <Clock className="h-5 w-5 text-yellow-500" />,
            color: "border-zinc-700",
            textColor: "text-white",
            bgColor: "bg-yellow-500/20",
          }
        case "salida-incidente":
          return {
            icon: <Clock className="h-5 w-5 text-yellow-500" />,
            color: "border-zinc-700",
            textColor: "text-white",
            bgColor: "bg-yellow-500/20",
          }
        case "salida-pendiente":
          return {
            icon: <XCircle className="h-5 w-5 text-red-500" />,
            color: "border-zinc-700",
            textColor: "text-white",
            bgColor: "bg-red-500/20",
          }
        case "ausente":
          return {
            icon: <XCircle className="h-5 w-5 text-red-500" />,
            color: "border-zinc-700",
            textColor: "text-white",
            bgColor: "bg-red-500/20",
          }
        case "pendiente":
          return {
            icon: <Clock className="h-5 w-5 text-zinc-500" />,
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
    // Si se proporciona una acción específica, usar colores específicos
    if (action === "entrada") {
      return "bg-green-500/30 text-green-300 border-green-500"
    }
    if (action === "salida") {
      return "bg-blue-500/30 text-blue-300 border-blue-500"
    }

    if (typeof status === 'string') {
      // Nuevos estados del backend
      switch (status) {
        case "COMPLETADA":
          return action === 'entrada' 
            ? "bg-green-500/30 text-green-300 border-green-500"
            : "bg-blue-500/30 text-blue-300 border-blue-500";
        case "EN_CURSO":
          return action === 'entrada'
            ? "bg-green-500/30 text-green-300 border-green-500 animate-pulse"
            : "bg-zinc-800 text-zinc-400 border-zinc-700";
        case "RETARDO":
          return action === 'entrada'
            ? "bg-yellow-500/30 text-yellow-300 border-yellow-500"
            : "bg-zinc-800 text-zinc-400 border-zinc-700";
        case "PENDIENTE":
        case "AUSENTE_ENTRADA":
        case "AUSENTE_SALIDA":
        case "AUSENTE":
        default:
          return "bg-zinc-800 text-zinc-400 border-zinc-700";
      }
    } else {
      // Estados antiguos para compatibilidad
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
        case "salida-pendiente":
        case "ausente":
        default:
          return "bg-zinc-800 text-zinc-400 border-zinc-700"
      }
    }
  }

  // Obtener mensaje de resultado según el estado
  const getResultMessage = () => {
    if (scanState === "success" || scanState === "background-success") {
      return lastAction === "entrada" ? "Entrada Registrada" : "Salida Registrada"
    }
    if (scanState === "failed" || scanState === "background-failed") {
      return "Huella No Identificada"
    }
    return ""
  }

  // Filtrar sesiones de trabajo para el empleado actual
  const filteredWorkSessions = workSessions
    .filter((session) => session.employeeId === currentEmployee.id)
    .sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1
      if (!a.isCurrent && b.isCurrent) return 1
      return a.scheduledEntry.localeCompare(b.scheduledEntry)
    })
    .slice(0, getMaxSessionsToShow())

  // Determinar si mostrar las sesiones de trabajo
  const shouldShowWorkSessions = true // Siempre mostrar el panel

  // Modo demo de escaneo automático
  useEffect(() => {
    if (demoMode) {
      const startDemoScan = () => {
        if (
          scanState === "idle" ||
          scanState === "ready" ||
          scanState === "failed" ||
          scanState === "background-failed"
        ) {
          startScan()
        }
      }

      // Iniciar primer escaneo después de un retraso
      demoTimeout.current = setTimeout(startDemoScan, 1500)

      // Programar siguiente escaneo si está en estado de fondo
      if (scanState === "background-success" || scanState === "background-failed") {
        demoTimeout.current = setTimeout(startDemoScan, 2000)
      }
    }

    return () => {
      if (demoTimeout.current) clearTimeout(demoTimeout.current)
    }
  }, [demoMode, scanState])

  // Auto-reset después de mostrar asistencia si no hay nuevo escaneo
  useEffect(() => {
    if (showAttendance && !quickMode) {
      resetTimeout.current = setTimeout(() => {
        // No resetear completamente, solo ir al estado ready
        setScanState("ready")
        setShowAttendance(false)
        setScanProgress(0)
        setMinutiaePoints([])
        setMinutiaeLines([])
        setScanResult(null)
        setPreparingNextScan(false)
        setPanelFlash(null)
        setShowOverlayMessage(false)
        setShowInstructionMessage(true)
      }, 9000) // Mostrar asistencia durante 9 segundos antes de resetear (más rápido)
    }
    return () => {
      if (resetTimeout.current) clearTimeout(resetTimeout.current)
    }
  }, [showAttendance, quickMode])

  // Generar puntos de minucia aleatorios y líneas de conexión
  useEffect(() => {
    if (scanState === "analyzing" || scanState === "background-analyzing") {
      // Generar puntos de minucia en toda la huella con mejor distribución
      const points = []
      // Generar puntos en diferentes áreas de la huella para mejor cobertura
      for (let i = 0; i < 20; i++) {
        // Aumentar número de puntos
        // Usar diferentes radios para cubrir toda la huella
        const angle = Math.random() * Math.PI * 2
        // Distribuir puntos en diferentes radios para cubrir toda la huella
        const radius = 5 + Math.random() * 40 // Desde cerca del centro hasta el borde
        points.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        })
      }
      setMinutiaePoints(points)

      // Generar más líneas de conexión entre puntos para mejor efecto visual
      const lines = []
      for (let i = 0; i < points.length; i++) {
        // Conectar cada punto con 2-3 puntos aleatorios
        const numConnections = 2 + Math.floor(Math.random() * 2)
        for (let j = 0; j < numConnections; j++) {
          const endIndex = Math.floor(Math.random() * points.length)
          if (endIndex !== i) {
            lines.push({
              start: i,
              end: endIndex,
            })
          }
        }
      }
      setMinutiaeLines(lines)
    }
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

  // Obtener color basado en el estado de escaneo
  const getScanColor = (state: ScanState) => {
    if (state === "success" || state === "background-success") return "green"
    if (state === "failed" || state === "background-failed") return "red"
    return "blue" // Color neutro
  }

  // Verificar si el estado es un estado de fondo
  const isBackgroundState = (state: ScanState) => {
    return state.startsWith("background-")
  }

  // Obtener estado base sin prefijo de fondo
  const getBaseState = (state: ScanState) => {
    return state.replace("background-", "") as ScanState
  }

  // Función auxiliar para formatear hora HH:mm:ss a HH:mm
  const formatTime = (timeString: string | null): string => {
    if (!timeString) return "—";
    try {
      // Si es formato "yyyy-MM-dd HH:mm:ss", extraer la parte de hora
      if (timeString.includes(' ')) {
        return timeString.split(' ')[1].substring(0, 5); // "HH:mm"
      }
      // Si ya es formato "HH:mm:ss", solo tomar "HH:mm"
      return timeString.substring(0, 5); // "HH:mm"
    } catch (e) {
      return "—";
    }
  };

  // Función para obtener la próxima jornada y sus horarios
  const getNextScheduledTime = (): { entryTime: string, exitTime: string, detalleHorarioId: number | null } => {
    // Si no hay jornadas o no hay empleado actual, retornar valores por defecto
    if (jornadasDelDia.length === 0 || !currentEmployee.id) {
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

            {/* Solo mostrar modo demo si no estamos conectados a un lector real */}
            {!isConnected && (
              <>
                <div className="flex items-center space-x-2 bg-zinc-800 p-2 rounded-lg">
                  <Switch id="demo-toggle" checked={demoMode} onCheckedChange={setDemoMode} />
                  <label htmlFor="demo-toggle" className="text-sm text-zinc-400 flex items-center gap-1">
                    <PlayCircle className="h-4 w-4" />
                    Demo
                  </label>
                </div>

                <div className="flex items-center space-x-2 bg-zinc-800 p-2 rounded-lg">
                  <Switch id="quick-toggle" checked={quickMode} onCheckedChange={setQuickMode} />
                  <label htmlFor="quick-toggle" className="text-sm text-zinc-400 flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    Rápido
                  </label>
                </div>
              </>
            )}
            
            {/* Si estamos conectados, mostrar el nombre del lector */}
            {isConnected && (
              <div className="flex items-center space-x-2 bg-blue-900/30 p-2 rounded-lg border border-blue-800">
                <Fingerprint className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-blue-300">{readerName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Mostrar mensaje de error si existe */}
        {apiError && (
          <div className="w-full bg-red-900/30 border border-red-700 text-red-400 p-4 rounded-lg mb-2 flex items-center gap-3">
            <XCircle className="h-5 w-5 flex-shrink-0" />
            <p>{apiError}</p>
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
                    const { icon, color, textColor, bgColor } = getStatusIndicator(jornada.estatusJornada);
                    
                    // Determinar si esta jornada es la "actual" (En Curso)
                    const isCurrent = jornada.estatusJornada === "EN_CURSO" || jornada.estatusJornada === "RETARDO";
                    
                    // Formatear horas reales (solo hora y minuto)
                    const formatHoraReal = (dateTimeString: string | null): string => {
                        if (!dateTimeString) return "—";
                        try {
                            // Extraer solo hora y minuto de "yyyy-MM-dd HH:mm:ss"
                            return dateTimeString.split(' ')[1].substring(0, 5);
                        } catch (e) {
                            return "—";
                        }
                    };
                    
                    // Formatear horas programadas (solo hora y minuto)
                    const formatHoraProgramada = (timeString: string): string => {
                        try {
                            // Extraer solo hora y minuto de "HH:mm:ss"
                            return timeString.substring(0, 5);
                        } catch (e) {
                            return timeString;
                        }
                    };

                    return (
                      <div
                        key={jornada.detalleHorarioId}
                        className={`p-4 rounded-md border-2 ${color} ${textColor} ${
                          isCurrent ? "border-blue-500 shadow-blue-500/30 shadow-lg" : ""
                        }`}
                        style={{
                          opacity: isCurrent ? 1 : jornada.horaEntradaReal ? 0.9 : 0.7,
                        }}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <p className={`text-xl font-bold ${isCurrent ? "text-white" : textColor}`}>
                            {formatHoraProgramada(jornada.horaEntradaProgramada)} - {formatHoraProgramada(jornada.horaSalidaProgramada)}
                            <span className="text-sm font-normal text-zinc-400 ml-2">(T{jornada.turno})</span>
                          </p>
                          <div className={`flex items-center gap-2 p-2 rounded-full ${bgColor}`}>{icon}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div className={`rounded-lg p-3 border ${getTimeBoxColor(jornada.estatusJornada, "entrada")}`}>
                            <p className="text-base font-medium mb-1">Entrada</p>
                            <p className="text-2xl font-bold">{formatHoraReal(jornada.horaEntradaReal)}</p>
                          </div>
                          <div className={`rounded-lg p-3 border ${getTimeBoxColor(jornada.estatusJornada, "salida")}`}>
                            <p className="text-base font-medium mb-1">Salida</p>
                            <p className="text-2xl font-bold">{formatHoraReal(jornada.horaSalidaReal)}</p>
                          </div>
                        </div>
                        {jornada.minutosRetardoPreliminar !== null && jornada.minutosRetardoPreliminar > 0 && (
                          <p className="text-xs text-yellow-400 mt-2 text-center">
                            Retardo: {jornada.minutosRetardoPreliminar} min
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
                          <p className="text-base font-medium mb-1">Entrada</p>
                          <p className="text-2xl font-bold">—</p>
                        </div>
                        <div className="rounded-lg p-3 border bg-zinc-800 text-zinc-600 border-zinc-700">
                          <p className="text-base font-medium mb-1">Salida</p>
                          <p className="text-2xl font-bold">—</p>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </div>

          {/* Reloj principal - centrado */}
          <Card
            className={`relative flex-1 overflow-hidden bg-zinc-900 p-4 text-white shadow-lg border-2 border-zinc-800 transition-colors duration-300 ${
              panelFlash === "success"
                ? "bg-green-900/50 border-green-500"
                : panelFlash === "failed"
                  ? "bg-red-900/50 border-red-500"
                  : "bg-zinc-900"
            }`}
            ref={containerRef}
          >
            {/* Mensaje de resultado como overlay - posición fija */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div
                className={`text-5xl font-bold transition-opacity duration-300 ${
                  scanState === "success" || scanState === "background-success"
                    ? "text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.8)]"
                    : scanState === "failed" || scanState === "background-failed"
                      ? "text-red-400 drop-shadow-[0_0_20px_rgba(248,113,113,0.8)]"
                      : "text-transparent"
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
                    </>
                  )}

                  {(scanState === "analyzing" || scanState === "background-analyzing") && (
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
                    </>
                  )}

                  {/* Estado de éxito - animación de marca de verificación verde */}
                  {(scanState === "success" || scanState === "background-success") && (
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
                      <CheckCircle2 className="h-32 w-32 text-green-500" />
                    </motion.div>
                  )}

                  {/* Estado de fallo - animación de X roja */}
                  {(scanState === "failed" || scanState === "background-failed") && (
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
                </div>

                {/* Mensaje de instrucción - SIEMPRE VISIBLE CON ALTURA FIJA */}
                <div className="h-12 flex items-center justify-center">
                  {showInstructionMessage && (
                    <p className="text-center text-xl font-medium text-zinc-300">
                      {(scanState === "idle" || scanState === "ready") && "Coloque su dedo en el escáner"}
                      {(scanState === "scanning" || scanState === "background-scanning") && "Escaneando huella..."}
                      {(scanState === "analyzing" || scanState === "background-analyzing") &&
                        "Identificando puntos de minucia..."}
                      {(scanState === "success" || scanState === "background-success") && "Verificación exitosa"}
                      {(scanState === "failed" || scanState === "background-failed") && "Huella no reconocida"}
                    </p>
                  )}
                </div>
              </div>

              {/* Sección de datos de asistencia - SIEMPRE VISIBLE CON PLACEHOLDERS */}
              <div className="mt-4 w-full border-t-2 border-zinc-700 pt-6">
                {/* Información del usuario - siempre visible con placeholders */}
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
                    <User className="h-8 w-8 text-zinc-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {showAttendance ? currentEmployee.name : "Usuario"}
                    </h2>
                    <p className="text-lg text-zinc-400">{showAttendance ? currentEmployee.id : "ID-0000-0000"}</p>
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
                      <LogIn className="h-6 w-6" />
                      <p className="text-lg font-medium">Entrada</p>
                    </div>
                    <p
                      className={`text-2xl font-bold ${
                        showAttendance && lastAction === "entrada" ? "text-white" : "text-zinc-600"
                      }`}
                    >
                      {showAttendance && lastAction === "entrada" && activeSessionId !== null
                        ? jornadasDelDia.find((j) => j.detalleHorarioId === activeSessionId)?.horaEntradaReal 
                          ? formatTime(jornadasDelDia.find((j) => j.detalleHorarioId === activeSessionId)?.horaEntradaReal || null)
                          : getNextScheduledTime().entryTime
                        : "00:00"}
                    </p>
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
                      <LogOut className="h-6 w-6" />
                      <p className="text-lg font-medium">Salida</p>
                    </div>
                    <p
                      className={`text-2xl font-bold ${
                        showAttendance && lastAction === "salida" ? "text-white" : "text-zinc-600"
                      }`}
                    >
                      {showAttendance && lastAction === "salida" && activeSessionId !== null
                        ? jornadasDelDia.find((j) => j.detalleHorarioId === activeSessionId)?.horaSalidaReal
                          ? formatTime(jornadasDelDia.find((j) => j.detalleHorarioId === activeSessionId)?.horaSalidaReal || null)
                          : getNextScheduledTime().exitTime
                        : "00:00"}
                    </p>
                  </div>
                </div>

                {/* Estadísticas eliminadas para ahorrar espacio */}
              </div>
            </div>
          </Card>

          {/* Panel derecho: Historial de escaneos - limitado a 3 elementos */}
          <div className="w-full md:w-80 bg-zinc-900 rounded-lg p-4 border-2 border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <History className="h-6 w-6 text-zinc-400" />
              <h3 className="text-xl font-bold text-zinc-300">Últimos Registros</h3>
            </div>

            <div className="space-y-4">
              {scanHistory.length === 0
                ? // Placeholders cuando no hay historial
                  Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={`history-placeholder-${index}`}
                      className="flex items-center gap-3 p-3 rounded-md bg-zinc-800/30"
                    >
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
                    .slice(0, 3)
                    .map((scan, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-md bg-zinc-800/50"
                        style={{
                          opacity: index === 0 ? 1 : Math.max(0.5, 1 - inactiveTime * 0.01 * index),
                          transition: "opacity 1s ease",
                        }}
                      >
                        <div
                          className={`h-12 w-12 rounded-full flex items-center justify-center ${
                            scan.success ? "bg-green-500/30" : "bg-red-500/30"
                          }`}
                        >
                          {scan.success ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                          ) : (
                            <XCircle className="h-6 w-6 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-lg font-bold text-white">{scan.name}</p>
                          <p className="text-base text-zinc-400">
                            {format(scan.time, "HH:mm:ss")} •{" "}
                            <span className={scan.action === "entrada" ? "text-green-400" : "text-blue-400"}>
                              {scan.action === "entrada" ? "Entrada" : "Salida"}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

