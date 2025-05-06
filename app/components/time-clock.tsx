"use client"

import { useState, useEffect, useRef, useCallback } from "react"
// Asegúrate de importar AnimatePresence aquí
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  Fingerprint, Clock, Calendar, CheckCircle2, XCircle, Volume2, VolumeX,
  History, Zap, PlayCircle, User, LogIn, LogOut, Maximize, Minimize, Loader2, WifiOff, AlertCircle // Asegúrate que AlertCircle esté importado
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import axios from 'axios';
import SockJS from 'sockjs-client'; // Importación principal
import { Client, IMessage } from '@stomp/stompjs';

// --- Tipos (Ajusta según necesites) ---
type SessionStatus = "entrada-ok" | "salida-ok" | "entrada-tarde" | "salida-incidente" | "salida-pendiente" | "ausente" | "pendiente";
type WorkSession = { id: number; entryTime: string | null; exitTime: string | null; scheduledEntry: string; scheduledExit: string; entryStatus: SessionStatus; exitStatus: SessionStatus; isCurrent: boolean; employeeId: string };
type ScanHistoryItem = { name: string; time: Date; success: boolean; action: "entrada" | "salida"; sessionId?: number; employeeId: string };
// Añadir 'error' al tipo ScanState
type ScanState = "idle" | "scanning" | "analyzing" | "success" | "failed" | "ready" | "error";
type EmployeeInfo = { id: string; name: string; totalHours?: string; weeklyHours?: string };
// --- Constantes ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// --- Props del Componente ---
interface TimeClockProps {
    selectedReader: string;
    sessionId: string;
}

export default function TimeClock({ selectedReader, sessionId }: TimeClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [showAttendance, setShowAttendance] = useState(false);
  const [scanResult, setScanResult] = useState<"success" | "failed" | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [quickMode, setQuickMode] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeInfo | null>(null);
  const [lastAction, setLastAction] = useState<"entrada" | "salida" | null>(null);
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [panelFlash, setPanelFlash] = useState<"success" | "failed" | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // *** Estados faltantes añadidos ***
  const [showOverlayMessage, setShowOverlayMessage] = useState(false);
  const [showInstructionMessage, setShowInstructionMessage] = useState(true); // Inicia visible

  const stompClient = useRef<Client | null>(null);
  const subscriptionChecador = useRef<any>(null);
  const resetTimeout = useRef<NodeJS.Timeout | null>(null);
  const audioSuccess = useRef<HTMLAudioElement | null>(null);
  const audioError = useRef<HTMLAudioElement | null>(null);
  const audioScan = useRef<HTMLAudioElement | null>(null);

  const readerName = decodeURIComponent(selectedReader);

  // Inicializar Sonidos
  useEffect(() => {
       if (typeof window !== "undefined" && window.AudioContext) {
            try {
                const audioCtx = new AudioContext()
                const createSound = (freq: number, duration: number = 0.1, vol: number = 0.05) => {
                    return () => {
                        if (!soundEnabled) return;
                        const oscillator = audioCtx.createOscillator();
                        const gainNode = audioCtx.createGain();
                        oscillator.type = "sine";
                        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
                        oscillator.connect(gainNode);
                        gainNode.connect(audioCtx.destination);
                        gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
                        oscillator.start();
                        oscillator.stop(audioCtx.currentTime + duration);
                    }
                };
                audioSuccess.current = { play: createSound(1200, 0.2) } as HTMLAudioElement;
                audioError.current = { play: createSound(300, 0.3) } as HTMLAudioElement;
                audioScan.current = { play: createSound(800, 0.05, 0.02) } as HTMLAudioElement;
            } catch (e) { console.log("Web Audio API no soportada"); }
        }
  }, [soundEnabled]);

  // Actualizar Hora
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Reservar lector para esta sesión
  const reserveReaderForSession = async () => {
    try {
      console.log(`Reservando lector ${readerName} para sesión ${sessionId}`);
      await axios.post(`${API_BASE_URL}/api/v1/multi-fingerprint/reserve/${selectedReader}?sessionId=${sessionId}`);
      console.log(`Lector ${readerName} reservado exitosamente`);
      return true;
    } catch (error: any) {
      console.error(`Error al reservar lector ${readerName}:`, error);
      setConnectionError(`Error al reservar lector: ${error.response?.data || error.message}`);
      setScanState("error");
      return false;
    }
  };

   // Conexión WebSocket y Lógica Principal
  useEffect(() => {
    if (!selectedReader || !sessionId) return;

    setConnectionError(null);

    // 1. Reservar e iniciar Modo Checador en Backend
    const initializeChecador = async () => {
      setScanState("idle"); 
      try {
        // Primero reservar el lector para esta sesión
        const reserved = await reserveReaderForSession();
        if (!reserved) return;
        
        // Luego iniciar modo checador, PASANDO EL SESSION ID
        console.log(`Iniciando checador para: ${readerName} con sesión ${sessionId}`);
        await axios.post(`${API_BASE_URL}/api/v1/multi-fingerprint/checador/start/${selectedReader}?sessionId=${sessionId}`);
        console.log(`Checador iniciado en backend para ${readerName}`);
      } catch (error: any) {
        console.error(`Error al iniciar checador para ${readerName}:`, error);
        // Usar mensaje de error del backend si está disponible, sino mensaje genérico
        const backendErrorMsg = error.response?.data?.message || error.response?.data || error.message;
        setConnectionError(`Error al iniciar lector: ${backendErrorMsg}`);
        setScanState("error");
      }
    };
    
    initializeChecador();

    // 2. Configurar Cliente STOMP
    stompClient.current = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws-fingerprint`),
      debug: (str) => { /* console.log('STOMP DEBUG:', str); */ },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.log('STOMP Conectado');
        setIsConnected(true);
        setConnectionError(null);
        setScanState("ready");

        const topic = `/topic/checador/${selectedReader}`;
        console.log(`Suscribiendo a: ${topic}`);
        subscriptionChecador.current = stompClient.current?.subscribe(topic, (message: IMessage) => {
          try {
            const eventData = JSON.parse(message.body);
            console.log("ChecadorEvent recibido:", eventData);
            handleChecadorEvent(eventData);
            audioSuccess.current?.play();
          } catch (e) {
            console.error("Error procesando mensaje de checador:", e);
            audioError.current?.play();
          }
        },
        { id: `sub-checador-${selectedReader}` });
      },

      onDisconnect: () => {
        console.log('STOMP Desconectado');
        setIsConnected(false);
         if (scanState !== "error") {
           setConnectionError("Conexión perdida. Intentando reconectar...");
           setScanState("idle");
         }
      },

      onStompError: (frame) => {
        console.error('STOMP Error:', frame.headers['message']);
        setConnectionError(`Error STOMP: ${frame.headers['message'] || 'Desconocido'}`);
        setIsConnected(false);
        setScanState("error");
      },

      onWebSocketError: (event) => {
          console.error("WebSocket Error:", event);
          setConnectionError("Error de WebSocket. Intentando reconectar...");
          setIsConnected(false);
          if (scanState !== 'error') setScanState('error');
      },

       onWebSocketClose: (event) => {
            console.log("WebSocket Closed:", event);
            setIsConnected(false);
            if (stompClient.current?.active) {
                 setConnectionError("Conexión cerrada inesperadamente. Intentando reconectar...");
                 if (scanState !== 'error') setScanState('idle');
            }
       }
    });

    // 3. Activar Cliente STOMP
    if (scanState !== "error") {
        console.log("Activando cliente STOMP...");
        stompClient.current.activate();
    }

    // 4. Función de Limpieza
    return () => {
      console.log(`Limpiando TimeClock para lector ${readerName}...`);
      if (subscriptionChecador.current) {
          try { 
            subscriptionChecador.current.unsubscribe(); 
            console.log("Desuscrito de checador"); 
          } catch (e) { 
            console.error("Error al desuscribir:", e); 
          }
      }
      
      stompClient.current?.deactivate()
        .then(() => console.log("STOMP desactivado."))
        .catch(err => console.error("Error al desactivar STOMP:", err));

      const stopAndRelease = async () => {
        if (selectedReader && sessionId) {
          try { 
            await axios.post(`${API_BASE_URL}/api/v1/multi-fingerprint/checador/stop/${selectedReader}`); 
            console.log(`Checador detenido en backend para ${readerName}`); 
          } catch (error) { 
            console.error(`Error deteniendo checador para ${readerName}:`, error); 
          }
          
          try { 
            await axios.post(`${API_BASE_URL}/api/v1/multi-fingerprint/release/${selectedReader}?sessionId=${sessionId}`); 
            console.log(`Lector ${readerName} liberado en backend para sesión ${sessionId}`); 
          } catch (error) { 
            console.error(`Error liberando lector ${readerName}:`, error); 
          }
        }
      };
      
      stopAndRelease();
      setIsConnected(false);
      if (scanState !== 'error') setScanState('idle');
    };
  }, [selectedReader, sessionId]);

  // Procesar evento de checador recibido por WebSocket
  const handleChecadorEvent = (eventData: { 
    readerName: string;
    identificado: boolean;
    empleadoId: number;
    nombreCompleto: string;
    rfc: string; 
  }) => {
      if (!eventData.identificado) {
        // Si no se identificó correctamente, mostrar error
        setScanState("failed");
        setPanelFlash("failed");
        setShowOverlayMessage(true);
        setShowInstructionMessage(false);
        audioError.current?.play();
        
        setTimeout(() => {
          setPanelFlash(null);
          setScanState("ready");
          setShowOverlayMessage(false);
          setShowInstructionMessage(true);
        }, 2000);
        
        return;
      }
      
      setScanState("success");
      setPanelFlash("success");
      setShowOverlayMessage(true);
      setShowInstructionMessage(false);

      const employeeIdStr = eventData.empleadoId.toString();
      const employeeName = eventData.nombreCompleto;

      // Determine si la acción es entrada o salida por el tiempo y última acción
      const now = new Date();
      const hour = now.getHours();
      const isEntry = hour < 15; // Simplemente usando hora del día como heurística (antes de las 3pm = entrada)
      const determinedAction = isEntry ? 'entrada' : 'salida';
      setLastAction(determinedAction);

      setCurrentEmployee({ id: employeeIdStr, name: employeeName });

      const newScan: ScanHistoryItem = {
        name: employeeName,
        time: now,
        success: true,
        action: determinedAction,
        employeeId: employeeIdStr,
      };
      
      setScanHistory(prev => [newScan, ...prev.slice(0, 4)]);
      setShowAttendance(true);

      setTimeout(() => setPanelFlash(null), 1500);

      if (resetTimeout.current) clearTimeout(resetTimeout.current);
      resetTimeout.current = setTimeout(() => {
          if (!quickMode) {
              setScanState("ready");
              setShowAttendance(false);
              setShowOverlayMessage(false);
              setShowInstructionMessage(true);
              setCurrentEmployee(null);
              setLastAction(null);
          } else {
             setScanState("ready");
             setShowOverlayMessage(false);
             setShowInstructionMessage(true);
          }
      }, quickMode ? 1500 : 5000);
  };

  // --- Lógica de UI (Fullscreen, etc.) ---
  const toggleFullscreen = useCallback(() => {
       if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => console.error(err));
       } else {
          document.exitFullscreen().catch(err => console.error(err));
       }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);


  // --- Renderizado ---
  const getResultMessage = () => {
    if (scanState === "success") return lastAction === "entrada" ? "Entrada Registrada" : "Salida Registrada";
    if (scanState === "failed") return "Huella No Reconocida";
    return "";
  };

  const getInstructionMessage = () => {
      if (scanState === "error") return connectionError || "Error de conexión";
      if (!isConnected) return "Conectando con el lector...";
      if (scanState === "ready" || scanState === "idle") return "Coloque su dedo en el escáner";
      if (scanState === "scanning" || scanState === "analyzing") return "Procesando...";
      if (scanState === "success") return `Bienvenido ${currentEmployee?.name || ''}`;
      if (scanState === "failed") return "Huella no reconocida. Intente nuevamente.";
      return "Esperando...";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
        <div className="flex flex-col gap-4 w-full max-w-7xl">
            {/* Reloj y Fecha */}
            <div className="flex justify-between items-center bg-zinc-900 rounded-lg p-4 border-2 border-zinc-800">
                <div className="flex items-center gap-3">
                    <Clock className="h-10 w-10 text-zinc-400" />
                    <span className="text-4xl font-bold text-white">{format(currentTime, "HH:mm:ss")}</span>
                </div>
                <div className="flex items-center gap-3">
                    <Calendar className="h-8 w-8 text-zinc-400" />
                    <span className="text-2xl font-medium text-white">
                    {format(currentTime, "EEEE, dd MMMM yyyy", { locale: es })}
                    </span>
                </div>
                {/* Indicador de Conexión */}
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${isConnected ? 'bg-green-500/20 text-green-400' : scanState === 'error' ? 'bg-red-700/30 text-red-400' : 'bg-yellow-500/20 text-yellow-400 animate-pulse'}`}>
                    {isConnected ? <CheckCircle2 className="h-4 w-4" /> : scanState === 'error' ? <AlertCircle className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                    <span>{isConnected ? `Lector: ${readerName}` : (scanState === 'error' ? 'Error' : 'Conectando...')}</span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                {/* Panel Izquierdo: Sesiones */}
                <div className="w-full md:w-80 bg-zinc-900 rounded-lg p-4 border-2 border-zinc-800">
                     <div className="flex items-center gap-2 mb-4">
                      <Calendar className="h-6 w-6 text-zinc-400" />
                      <h3 className="text-xl font-bold text-zinc-300">Sesiones de Hoy</h3>
                    </div>
                    <div className="space-y-3 text-center text-zinc-600 italic py-10">
                        (Visualización de sesiones pendiente)
                    </div>
                </div>

                {/* Panel Central: Escáner y Resultados */}
                <Card
                    className={`relative flex-1 overflow-hidden bg-zinc-900 p-4 text-white shadow-lg border-2 transition-colors duration-300 ${
                    panelFlash === "success" ? "border-green-500 bg-green-900/10"
                    : panelFlash === "failed" ? "border-red-500 bg-red-900/10"
                    : isConnected ? "border-blue-500/30" : "border-red-500/50"} `}
                >
                    {/* Mensaje Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <div
                            className={`text-5xl font-bold transition-opacity duration-300 ${
                                scanState === "success" ? "text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.8)]" 
                                : scanState === "failed" ? "text-red-400 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]" 
                                : "text-transparent"
                            }`}
                            style={{ opacity: showOverlayMessage ? 0.95 : 0 }}
                        >
                            {getResultMessage()}
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center h-full">
                        {/* Animación de Huella */}
                        <div className="relative mb-6 flex h-64 w-64 items-center justify-center">
                            <svg className="absolute h-56 w-56" viewBox="0 0 100 100">
                                <g className="fingerprint-base" stroke={ isConnected ? "rgba(59, 130, 246, 0.3)" : "rgba(239, 68, 68, 0.3)" } fill="none" strokeWidth="2">
                                    <path d="M50,15 C25,15 15,30 15,50 C15,70 25,85 50,85 C75,85 85,70 85,50 C85,30 75,15 50,15 Z" />
                                    <path d="M50,20 C30,20 20,35 20,50 C20,65 30,80 50,80 C70,80 80,65 80,50 C80,35 70,20 50,20 Z" />
                                     <path d="M50,25 C35,25 25,35 25,50 C25,65 35,75 50,75 C65,75 75,65 75,50 C75,35 65,25 50,25 Z" />
                                     <path d="M50,30 C37,30 30,40 30,50 C30,60 37,70 50,70 C63,70 70,60 70,50 C70,40 63,30 50,30 Z" />
                                     <path d="M50,35 C40,35 35,42 35,50 C35,58 40,65 50,65 C60,65 65,58 65,50 C65,42 60,35 50,35 Z" />
                                     <path d="M50,40 C42,40 40,45 40,50 C40,55 42,60 50,60 C58,60 60,55 60,50 C60,45 58,40 50,40 Z" />
                                     <path d="M50,45 C45,45 45,47 45,50 C45,53 45,55 50,55 C55,55 55,53 55,50 C55,47 55,45 50,45 Z" />
                                </g>
                             </svg>
                            {/* Indicador de estado */}
                            <motion.div
                                className="absolute" key={scanState}
                                initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
                            >
                                {scanState === 'error' && <AlertCircle className="h-36 w-36 text-red-500/80" />}
                                {!isConnected && scanState !== 'error' && <WifiOff className="h-36 w-36 text-yellow-500/80 animate-pulse" />}
                                {isConnected && (scanState === 'idle' || scanState === 'ready') && (
                                    <motion.div animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                        <Fingerprint className="h-36 w-36 text-blue-500/80" />
                                    </motion.div>
                                )}
                                {isConnected && (scanState === 'scanning' || scanState === 'analyzing') && <Loader2 className="h-36 w-36 text-blue-400 animate-spin" />}
                                {isConnected && scanState === 'success' && <CheckCircle2 className="h-36 w-36 text-green-500" />}
                                {isConnected && scanState === 'failed' && <XCircle className="h-36 w-36 text-red-500" />}
                            </motion.div>
                        </div>

                        {/* Mensaje de Instrucción */}
                        <div className="h-12 flex items-center justify-center text-center px-4">
                            <AnimatePresence>
                                {showInstructionMessage && (
                                    <motion.p
                                        className={`text-xl font-medium ${scanState === 'error' ? 'text-red-400' : scanState === 'failed' ? 'text-red-400' : 'text-zinc-300'}`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        {getInstructionMessage()}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Sección de Datos (si showAttendance es true) */}
                        <AnimatePresence>
                            {showAttendance && currentEmployee && (
                                <motion.div
                                    className="mt-4 w-full border-t-2 border-zinc-700 pt-6"
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}
                                >
                                    <div className="mb-4 flex items-center gap-4">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800"> <User className="h-8 w-8 text-zinc-400" /> </div>
                                        <div> <h2 className="text-2xl font-bold text-white">{currentEmployee.name}</h2> <p className="text-lg text-zinc-400">{currentEmployee.id}</p> </div>
                                    </div>
                                     <div className="grid grid-cols-2 gap-4">
                                        <div className={`rounded-lg p-4 border-2 ${lastAction === 'entrada' ? 'border-green-500 bg-green-900/20' : 'bg-zinc-800 border-zinc-700'}`}>
                                            <div className="flex items-center gap-2 mb-1"> <LogIn className={`h-5 w-5 ${lastAction === 'entrada' ? 'text-green-400' : 'text-zinc-500'}`} /> <p className="font-medium">Entrada</p> </div>
                                            <p className={`text-2xl font-bold ${lastAction === 'entrada' ? 'text-white' : 'text-zinc-600'}`}>{lastAction === 'entrada' ? format(currentTime, "HH:mm") : '—'}</p>
                                        </div>
                                         <div className={`rounded-lg p-4 border-2 ${lastAction === 'salida' ? 'border-blue-500 bg-blue-900/20' : 'bg-zinc-800 border-zinc-700'}`}>
                                             <div className="flex items-center gap-2 mb-1"> <LogOut className={`h-5 w-5 ${lastAction === 'salida' ? 'text-blue-400' : 'text-zinc-500'}`} /> <p className="font-medium">Salida</p> </div>
                                             <p className={`text-2xl font-bold ${lastAction === 'salida' ? 'text-white' : 'text-zinc-600'}`}>{lastAction === 'salida' ? format(currentTime, "HH:mm") : '—'}</p>
                                         </div>
                                     </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </Card>

                {/* Panel Derecho: Historial y Foto */}
                <div className="w-full md:w-80 bg-zinc-900 rounded-lg p-4 border-2 border-zinc-800">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3"> <History className="h-6 w-6 text-zinc-400" /> <h3 className="text-xl font-bold text-zinc-300">Últimos Registros</h3> </div>
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={toggleFullscreen}> {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />} </Button>
                    </div>
                     <div className="space-y-3">
                         {scanHistory.length === 0 && <p className="text-zinc-600 text-center py-4">No hay registros recientes.</p>}
                         {scanHistory.map((scan, index) => (
                          <motion.div key={`${scan.employeeId}-${scan.time.toISOString()}-${index}`} className="flex items-center gap-3 p-3 rounded-md bg-zinc-800/50" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${scan.success ? "bg-green-500/30" : "bg-red-500/30"}`}> {scan.success ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />} </div>
                            <div> <p className="text-base font-bold text-white">{scan.name}</p> <p className="text-sm text-zinc-400"> {format(scan.time, "HH:mm:ss")} • <span className={scan.action === "entrada" ? "text-green-400" : "text-blue-400"}> {scan.action === "entrada" ? "Entrada" : "Salida"} </span> </p> </div>
                          </motion.div>
                         ))}
                    </div>
                    <div className="mt-6 pt-6 border-t-2 border-zinc-800">
                         <h3 className="text-xl font-bold text-zinc-300 mb-4 flex items-center gap-2"> <User className="h-5 w-5 text-zinc-400" /> Foto </h3>
                         <div className="flex justify-center">
                             <div className="w-full aspect-square max-w-[200px] rounded-lg border-2 border-zinc-800 bg-zinc-900/50 flex items-center justify-center">
                                 {showAttendance && currentEmployee ? ( <div className="text-center"> <User className="h-20 w-20 text-zinc-700 mb-2" /> <p className="text-sm text-zinc-400">{currentEmployee.name}</p> </div> ) : ( <User className="h-20 w-20 text-zinc-800" /> )}
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}