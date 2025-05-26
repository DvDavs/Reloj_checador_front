"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  Fingerprint,
  Clock,
  Calendar,
  XCircle,
  Volume2,
  VolumeX,
  History,
  User,
  LogIn,
  LogOut,
  AlertTriangle,
  Ban,
  AlertCircle,
  Timer,
  CheckCircle,
  UserX,
  CalendarX,
  ShieldAlert,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { formatTime, getUserFriendlyMessage, getStyleClassesForCode } from "../lib/timeClockUtils"
import useStompTimeClock from "../hooks/useStompTimeClock"
import useEmployeeAttendanceData from "../hooks/useEmployeeAttendanceData"

// Importar los tipos desde timeClockTypes.ts
import type {
  BackendChecadorEvent,
  ScanHistoryItem,
  ScanState,
  FullAttendanceStateEvent,
  JornadaEstadoDto,
  EstatusJornada,
} from "../lib/types/timeClockTypes"

// Componente para mostrar un turno individual
const TurnoItem = ({ jornada, isActive = false, isExpanded = false, onClick = () => {} }: { 
  jornada: JornadaEstadoDto;
  isActive?: boolean;
  isExpanded?: boolean;
  onClick?: () => void;
}) => {
  const { icon, textColor, bgColor } = getStatusIndicator(jornada.estatusJornada)
  const isCompleted = jornada.estatusJornada === "COMPLETADA"
  const isPending = jornada.estatusJornada === "PENDIENTE"
  const isAbsent = jornada.estatusJornada.includes("AUSENTE")
  const hasDelay = jornada.minutosRetardoPreliminar !== null && jornada.minutosRetardoPreliminar > 0

  // Función para obtener el estado del turno en texto legible
  const getEstadoTexto = (estado: EstatusJornada): string => {
    switch (estado) {
      case "COMPLETADA":
        return "Completado"
      case "EN_CURSO":
        return "En curso"
      case "RETARDO":
        return "Retardo"
      case "PENDIENTE":
        return "Pendiente"
      case "AUSENTE_ENTRADA":
        return "Ausente"
      case "AUSENTE_SALIDA":
        return "Ausente"
      case "AUSENTE":
        return "Ausente"
      default:
        return estado
    }
  }

  return (
    <div
      className={`p-3 mb-2 rounded-md border transition-all duration-300 cursor-pointer
        ${isExpanded ? "scale-100" : "scale-98 hover:scale-100"}
        ${
          isActive
            ? "border-blue-600 shadow-blue-500/40 shadow-lg"
            : isCompleted
              ? "border-green-600/50 bg-green-900/20"
              : isPending
                ? "border-gray-600 bg-gray-700/80" // Mejorado para mayor claridad
                : isAbsent
                  ? "border-red-600/50 bg-red-900/20"
                  : "border-zinc-700 bg-zinc-800/50" // Default para otros estados no activos
        }`}
      style={{
        opacity: isCompleted ? 0.9 : isPending ? 0.95 : 1, // Menos desvanecido para mejor visibilidad
        background: isActive
          ? "linear-gradient(to right, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.05))"
          : jornada.estatusJornada === "RETARDO"
            ? "linear-gradient(to right, rgba(234, 179, 8, 0.2), rgba(234, 179, 8, 0.05))"
            : isAbsent
              ? "linear-gradient(to right, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))"
              : isPending 
                ? "linear-gradient(to right, rgba(75, 85, 99, 0.2), rgba(75, 85, 99, 0.1))" // Gradiente gris mejorado
                : "",
      }}
      onClick={onClick}
    >
      {isExpanded ? (
        // Vista expandida del turno
        <>
          {/* Horario programado en la parte superior estilo Google Calendar */}
          <div className="flex justify-between items-center mb-3 bg-zinc-800/70 -mx-3 -mt-3 px-3 py-2 rounded-t-md">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${bgColor}`}>{icon}</div>
              <p className={`text-base font-medium ${isActive ? "text-white" : textColor}`}>
                {formatTime(jornada.horaEntradaProgramada)} - {formatTime(jornada.horaSalidaProgramada)}
              </p>
            </div>
            <div
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                isCompleted
                  ? isActive 
                    ? "bg-green-600/40 text-green-300 animate-pulse" // Resaltar sesiones completadas activas
                    : "bg-green-600/40 text-green-300"
                  : isPending
                    ? "bg-gray-700/80 text-gray-300"
                    : isAbsent
                      ? "bg-red-600/40 text-red-300"
                      : jornada.estatusJornada === "RETARDO"
                        ? "bg-yellow-600/40 text-yellow-300"
                        : "bg-blue-600/40 text-blue-300"
              }`}
            >
              {getEstadoTexto(jornada.estatusJornada)}
              {isActive && isCompleted && " ✓"}
            </div>
          </div>

          {/* Indicador de turno recién completado */}
          {isActive && isCompleted && (
            <div className="mb-3 px-2 py-1 text-xs bg-green-600/40 text-green-300 border border-green-600/50 rounded-md flex items-center gap-1 animate-pulse">
              <CheckCircle className="h-3 w-3" />
              <span>Turno recién completado</span>
            </div>
          )}

          {hasDelay && (
            <div className="mb-2 px-2 py-1 text-xs font-medium bg-yellow-600/40 text-yellow-300 rounded-md inline-flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Retardo: {jornada.minutosRetardoPreliminar} min
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-lg p-3 border ${getTimeBoxColor(jornada.estatusJornada, "entrada")}`}>
              <div className="flex items-center gap-2 mb-1">
                <LogIn className="h-4 w-4 text-zinc-400" />
                <p className="text-base font-medium">Entrada</p>
              </div>
              {jornada.horaEntradaReal ? (
                <p className="text-2xl font-bold">{formatTime(jornada.horaEntradaReal)}</p>
              ) : isAbsent ? (
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-red-400">Ausente</p>
                  <Ban className="h-5 w-5 text-red-400" />
                </div>
              ) : (
                <p className="text-2xl font-bold text-zinc-500">{formatTime(jornada.horaEntradaProgramada)}</p>
              )}
            </div>
            <div className={`rounded-lg p-3 border ${getTimeBoxColor(jornada.estatusJornada, "salida")}`}>
              <div className="flex items-center gap-2 mb-1">
                <LogOut className="h-4 w-4 text-zinc-400" />
                <p className="text-base font-medium">Salida</p>
              </div>
              {jornada.horaSalidaReal ? (
                <p className="text-2xl font-bold">{formatTime(jornada.horaSalidaReal)}</p>
              ) : jornada.estatusJornada === "AUSENTE_SALIDA" ? (
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-red-400">Ausente</p>
                  <Ban className="h-5 w-5 text-red-400" />
                </div>
              ) : (
                <p className="text-2xl font-bold text-zinc-500">{formatTime(jornada.horaSalidaProgramada)}</p>
              )}
            </div>
          </div>
        </>
      ) : (
        // Vista compacta del turno
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isActive && isCompleted ? "bg-green-500/30" : bgColor}`}>{icon}</div>
            <div>
              <p className={`text-sm font-bold ${textColor}`}>
                {formatTime(jornada.horaEntradaProgramada)} - {formatTime(jornada.horaSalidaProgramada)}
              </p>

              <div className="flex items-center gap-2 text-xs mt-0.5">
                {jornada.horaEntradaReal ? (
                  <span className="flex items-center gap-1 text-green-300 bg-green-600/40 px-1.5 py-0.5 rounded">
                    <LogIn className="h-3 w-3" />
                    {formatTime(jornada.horaEntradaReal)}
                  </span>
                ) : isAbsent ? (
                  <span className="flex items-center gap-1 text-red-300 bg-red-600/40 px-1.5 py-0.5 rounded">
                    <Ban className="h-3 w-3" />
                    Ausente
                  </span>
                ) : null}

                {jornada.horaSalidaReal ? (
                  <span className={`flex items-center gap-1 ${isActive && isCompleted ? "text-green-300 bg-green-600/40" : "text-blue-300 bg-blue-600/40"} px-1.5 py-0.5 rounded`}>
                    <LogOut className="h-3 w-3" />
                    {formatTime(jornada.horaSalidaReal)}
                  </span>
                ) : jornada.estatusJornada === "AUSENTE_SALIDA" ? (
                  <span className="flex items-center gap-1 text-red-300 bg-red-600/40 px-1.5 py-0.5 rounded">
                    <Ban className="h-3 w-3" />
                    Ausente
                  </span>
                ) : null}

                {jornada.minutosRetardoPreliminar ? (
                  <span className="flex items-center gap-1 text-yellow-300 bg-yellow-600/40 px-1.5 py-0.5 rounded">
                    <AlertTriangle className="h-3 w-3" />
                    {jornada.minutosRetardoPreliminar} min
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Indicador de estado compacto */}
          <div
            className={`text-xs px-2 py-0.5 rounded-full ${
              isCompleted
                ? "bg-green-900/30 text-green-400"
                : isPending
                  ? "bg-gray-600/60 text-gray-200" // Adjusted for clearer "pending" look
                  : isAbsent
                    ? "bg-red-900/30 text-red-400"
                    : jornada.estatusJornada === "RETARDO"
                      ? "bg-yellow-900/30 text-yellow-400"
                      : "bg-blue-900/30 text-blue-400"
            }`}
          >
            {getEstadoTexto(jornada.estatusJornada)}
          </div>
        </div>
      )}
    </div>
  )
}

// Función auxiliar para obtener icono y color de estado
const getStatusIndicator = (status: string) => {
  // Nuevos estados del backend con iconos mejorados y colores más intuitivos
  switch (status) {
    case "COMPLETADA":
      return {
        icon: <CheckCircle className="h-5 w-5 text-green-400" />,
        color: "border-green-600",
        textColor: "text-green-300",
        bgColor: "bg-green-600/30",
      }
    case "EN_CURSO":
      return {
        icon: <Clock className="h-5 w-5 text-blue-400 animate-pulse" />,
        color: "border-blue-600",
        textColor: "text-blue-300",
        bgColor: "bg-blue-600/30",
      }
    case "RETARDO":
      return {
        icon: <Timer className="h-5 w-5 text-yellow-400" />,
        color: "border-yellow-600",
        textColor: "text-yellow-300",
        bgColor: "bg-yellow-600/30",
      }
    case "AUSENTE_ENTRADA":
      return {
        icon: <UserX className="h-5 w-5 text-red-400" />,
        color: "border-red-600",
        textColor: "text-red-300",
        bgColor: "bg-red-600/30",
      }
    case "AUSENTE_SALIDA":
      return {
        icon: <CalendarX className="h-5 w-5 text-red-400" />,
        color: "border-red-600",
        textColor: "text-red-300",
        bgColor: "bg-red-600/30",
      }
    case "AUSENTE":
      return {
        icon: <Ban className="h-5 w-5 text-red-400" />,
        color: "border-red-600",
        textColor: "text-red-300",
        bgColor: "bg-red-600/30",
      }
    case "PENDIENTE":
    default:
      return {
        icon: <Clock className="h-5 w-5 text-gray-300" />, // Brighter icon for pending
        color: "border-gray-600", // Lighter border
        textColor: "text-gray-200", // Brighter text for pending
        bgColor: "bg-gray-700/50", // Lighter icon background for pending
      }
  }
}

// Obtener color de caja de hora de entrada/salida
const getTimeBoxColor = (status: EstatusJornada, action: "entrada" | "salida" | null = null): string => {
  // 1. Handle PENDING status first: Its boxes should always be gray.
  if (status === "PENDIENTE") {
    return "bg-gray-700/70 text-gray-200 border-gray-600"; // Mejorado para mayor claridad
  }

  // 2. Handle AUSENTE statuses for the relevant box
  if (status === "AUSENTE_ENTRADA" && action === "entrada") {
    return "bg-red-600/40 text-red-300 border-red-600"; // Mayor contraste
  }
  // If general AUSENTE or specifically AUSENTE_SALIDA, and it's the salida action, salida box is red
  if ((status === "AUSENTE_SALIDA" || status === "AUSENTE") && action === "salida") {
    return "bg-red-600/40 text-red-300 border-red-600"; // Mayor contraste
  }
  // If status is AUSENTE or AUSENTE_ENTRADA and action is 'salida', the salida box is like pending (gray)
  // because entry was missed, so exit is not active.
  if ((status === "AUSENTE" || status === "AUSENTE_ENTRADA") && action === "salida") {
      return "bg-gray-700/80 text-gray-300 border-gray-600"; // Más visible
  }
  // If status is AUSENTE_SALIDA and action is 'entrada', the entrada box was presumably completed.
  if (status === "AUSENTE_SALIDA" && action === "entrada") {
    return "bg-green-600/40 text-green-300 border-green-600"; // Consistente con otros verdes
  }


  // 3. Handle specific actions for other statuses (COMPLETADA, EN_CURSO, RETARDO)
  if (action === "entrada") {
    if (status === "RETARDO") {
      return "bg-yellow-600/40 text-yellow-300 border-yellow-600"; // Consistente con amarillos
    }
    // For COMPLETADA, EN_CURSO, the entrada box is green
    if (status === "COMPLETADA" || status === "EN_CURSO") {
      return "bg-green-600/40 text-green-300 border-green-600"; // Consistente con otros verdes
    }
  }

  if (action === "salida") {
    if (status === "COMPLETADA") {
      return "bg-blue-600/40 text-blue-300 border-blue-600"; // Consistente con azules
    }
    // For EN_CURSO or RETARDO, the 'salida' box is effectively pending (gray)
    if (status === "EN_CURSO" || status === "RETARDO") {
      return "bg-gray-700/80 text-gray-300 border-gray-600"; // Más visible
    }
  }

  // Fallback: This part primarily covers if action is null, or a combination not yet specified.
  switch (status) {
    case "COMPLETADA":
      return "bg-blue-600/40 text-blue-300 border-blue-600"; // Consistente con azules
    case "EN_CURSO": // Salida is pending
    case "RETARDO":  // Salida is pending
      return "bg-gray-700/80 text-gray-300 border-gray-600"; // Más visible
    case "AUSENTE_ENTRADA": // If no specific action, implies the whole item is affected
    case "AUSENTE_SALIDA":
    case "AUSENTE":
      return "bg-red-600/40 text-red-300 border-red-600"; // Estilo consistente para ausencias
    default: // Includes PENDIENTE if it somehow slipped through, but shouldn't.
      return "bg-gray-700/70 text-gray-200 border-gray-600"; // Estilo neutral consistente
  }
};

// Componente principal
export default function TimeClock({ selectedReader, sessionId }: { selectedReader: string; sessionId: string }) {
  // ==== HOOKS / STATE ====
  // Estado relacionado con estado y resultado de escaneo
  const [scanState, setScanState] = useState<ScanState>("idle")
  const [scanResult, setScanResult] = useState<"success" | "failed" | null>(null)
  const [lastAction, setLastAction] = useState<"entrada" | "salida">("entrada")
  const [clientDisplayTime, setClientDisplayTime] = useState<Date | null>(null) // MODIFIED: Initialize to null

  // Nuevos estados para manejo de códigos de estado y mensajes personalizados
  const [statusCode, setStatusCode] = useState<string | undefined>(undefined)
  const [statusData, setStatusData] = useState<Record<string, any> | undefined>(undefined)
  const [customMessage, setCustomMessage] = useState<string>("")

  // Estado relacionado con UI y visualización
  const [showAttendance, setShowAttendance] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [scanHistory, setScanHistory] = useState<(ScanHistoryItem & { statusCode?: string })[]>([])
  const [preparingNextScan, setPreparingNextScan] = useState(false)
  const [panelFlash, setPanelFlash] = useState<"success" | "failed" | null>(null)
  const [inactiveTime, setInactiveTime] = useState(0)
  const [showOverlayMessage, setShowOverlayMessage] = useState(false)
  const [windowHeight, setWindowHeight] = useState(0)
  const [showInstructionMessage, setShowInstructionMessage] = useState(true)

  // Nuevas variables de estado para integración con backend
  const [stompApiError, setStompApiError] = useState<string | null>(null)
  const [componentApiError, setComponentApiError] = useState<string | null>(null)
  const [isReaderReady, setIsReaderReady] = useState(false)
  const [employeeIdForHook, setEmployeeIdForHook] = useState<number | null>(null)

  // Nuevo estado para retener temporalmente la visualización de una jornada después de registrar salida
  const [retainedSessionId, setRetainedSessionId] = useState<number | null>(null)
  const [retainSessionTimeout, setRetainSessionTimeout] = useState<NodeJS.Timeout | null>(null)

  // Nuevo estado para controlar qué turno está expandido
  const [expandedTurnoId, setExpandedTurnoId] = useState<number | null>(null)

  // API Base URL para las peticiones
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

  // Use the new hook for employee attendance data
  const {
    currentEmployee,
    currentEmployeeData,
    jornadasDelDia,
    activeSessionId,
    nextRecommendedAction,
    isLoading,
    errorLoadingData,
    updateFromFullAttendanceEvent,
  } = useEmployeeAttendanceData({
    employeeIdToFetch: employeeIdForHook,
    apiBaseUrl: API_BASE_URL,
  })

  // Store nextRecommendedAction in a ref to avoid dependency changes
  const nextRecommendedActionRef = useRef<"entrada" | "salida">("entrada")

  // Update the ref when nextRecommendedAction changes
  useEffect(() => {
    nextRecommendedActionRef.current = nextRecommendedAction
  }, [nextRecommendedAction])

  const resetTimeout = useRef<NodeJS.Timeout | null>(null)
  const audioSuccess = useRef<HTMLAudioElement | null>(null)
  const audioError = useRef<HTMLAudioElement | null>(null)
  const audioScan = useRef<HTMLAudioElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ==== STOMP HOOK INTEGRATION ====
  const handleChecadorEventCallback = useCallback(
    (event: BackendChecadorEvent | FullAttendanceStateEvent): void => {
      try {
        // Función para verificar si el mensaje es un FullAttendanceStateEvent
        const isFullAttendanceEvent = (evt: any): evt is FullAttendanceStateEvent =>
          "type" in evt && evt.type === "FULL_ATTENDANCE_STATE_UPDATE"

        if (isFullAttendanceEvent(event)) {
          // MANEJO DEL ESTADO COMPLETO
          console.log("Evento FullAttendanceStateEvent recibido:", {
            employeeId: event.employeeData?.id,
            name: event.employeeData?.nombreCompleto,
            nextAction: event.nextRecommendedActionBackend,
            sessionsCount: event.dailyWorkSessions?.length || 0,
          })

          // Actualizar los datos del empleado y jornadas usando el hook
          updateFromFullAttendanceEvent(event)

          // Si tenemos datos de empleado, mostrar el panel de asistencia
          if (event.employeeData) {
            setEmployeeIdForHook(event.employeeData.id)
            setShowAttendance(true)

            // Si el backend indica que un turno fue recién completado, retenerlo
            if (event.justCompletedSessionIdBackend) {
              // Mantener ese turno en foco durante unos segundos
              setRetainedSessionId(event.justCompletedSessionIdBackend)

              // Limpiar cualquier temporizador anterior si existe
              if (retainSessionTimeout) {
                clearTimeout(retainSessionTimeout)
              }

              // Configurar un nuevo temporizador que limpiará esta retención después de 8 segundos
              const timeout = setTimeout(() => {
                setRetainedSessionId(null)
              }, 8000) // 8 segundos para mantener la jornada visible

              setRetainSessionTimeout(timeout)
            }

            // Manejar caso específico donde todas las jornadas están completas
            if (event.nextRecommendedActionBackend === "ALL_COMPLETE") {
              setCustomMessage("Todas las jornadas del día completadas")
              // Asignar un código de tipo "información" para que el estilo sea adecuado
              setStatusCode("299") // Código personalizado para estado "ALL_COMPLETE"
            }
          }

          // No modificamos scanState ni scanResult para este tipo de evento,
          // ya que solo actualiza datos, no indica un resultado de escaneo
          return
        }

        // MANEJO DEL FEEDBACK INMEDIATO - Evento BackendChecadorEvent
        const checadorEvent = event as BackendChecadorEvent // Aseguramos el tipo correcto

        console.log("Evento BackendChecadorEvent recibido:", {
          identificado: checadorEvent.identificado,
          empleadoId: checadorEvent.empleadoId,
          accion: checadorEvent.accion,
          statusCode: checadorEvent.statusCode,
          statusType: checadorEvent.statusType,
        })

        const eventStatusCode = checadorEvent.statusCode
        const statusType = checadorEvent.statusType || (checadorEvent.identificado ? "OK" : "ERROR")
        const eventStatusData = checadorEvent.data

        setStatusCode(eventStatusCode)
        setStatusData(eventStatusData)

        if (eventStatusCode) {
          // Prioritize the direct message from the backend event if available, 
          // especially for specific info codes where the backend provides more context.
          let messageToDisplay = checadorEvent.errorMessage;

          if (!messageToDisplay || (eventStatusCode !== "301" && eventStatusCode !== "302")) {
            // Fallback to generic friendly message if no specific error message from backend 
            // or if the code is not one of the targeted ones for override.
            messageToDisplay = getUserFriendlyMessage(eventStatusCode, eventStatusData, checadorEvent.nombreCompleto);
          }
          setCustomMessage(messageToDisplay);
        }

        if (checadorEvent.empleadoId !== undefined && checadorEvent.nombreCompleto) {
          setEmployeeIdForHook(checadorEvent.empleadoId)
          setShowAttendance(true)
        }

        if (checadorEvent.identificado || statusType === "OK" || statusType === "INFO") {
          setScanState("success")
          setScanResult("success")
          setPanelFlash("success")
          setShowOverlayMessage(true)
          setShowInstructionMessage(false)

          if (checadorEvent.empleadoId !== undefined && checadorEvent.nombreCompleto) {
            // Usar valor del evento si está disponible, sino del hook via nextRecommendedActionRef
            const action = checadorEvent.accion || nextRecommendedActionRef.current
            setLastAction(action)

            // Retener el ID de la jornada actual cuando registramos una salida
            if (action === "salida" && activeSessionId !== null) {
              setRetainedSessionId(activeSessionId)

              // Limpiar cualquier temporizador anterior si existe
              if (retainSessionTimeout) {
                clearTimeout(retainSessionTimeout)
              }

              // Configurar un nuevo temporizador que limpiará esta retención después de 8 segundos
              const timeout = setTimeout(() => {
                setRetainedSessionId(null)
              }, 8000) // 8 segundos para mantener la jornada visible

              setRetainSessionTimeout(timeout)
            }

            // Solo añadir al historial si es un código de éxito real
            if (eventStatusCode?.startsWith("2")) {
              const newScan: ScanHistoryItem = {
                name: checadorEvent.nombreCompleto,
                time: new Date(),
                success: true,
                action: action,
                employeeId: checadorEvent.empleadoId.toString(),
                statusCode: eventStatusCode,
              }
              setScanHistory((prev) => [newScan, ...prev.slice(0, 5)]) // Mantener máximo 6 registros
            }

            setPreparingNextScan(true)
            setTimeout(() => {
              setScanState("ready")
              setPreparingNextScan(false)
            }, 3000)
          }
        } else {
          setScanState("failed")
          setScanResult("failed")
          setPanelFlash("failed")
          setShowOverlayMessage(true)
          setShowInstructionMessage(false)

          setTimeout(() => {
            setScanState("ready")
          }, 3500)
        }
      } catch (error) {
        console.error("Error al procesar evento de checador:", error)
      }
    },
    [updateFromFullAttendanceEvent, activeSessionId, retainSessionTimeout],
  )

  // Initialize STOMP hook
  const { isConnected } = useStompTimeClock({
    initialReaderName: selectedReader,
    initialSessionId: sessionId,
    onChecadorEvent: handleChecadorEventCallback,
    onConnectionError: (error) => {
      setStompApiError(error)
      if (error) {
        console.error("Error de conexión STOMP:", error)
      }
    },
    onReadyStateChange: (isReady) => {
      setIsReaderReady(isReady)
      console.log("Estado de lector actualizado:", isReady ? "Listo" : "No listo")
    },
    apiBaseUrl: API_BASE_URL,
  })

  // Actualizar el estado general del scanState basado en isReaderReady y isConnected
  useEffect(() => {
    if (isConnected && isReaderReady) {
      setScanState("ready") // El lector está conectado y el checador iniciado
      setComponentApiError(null) // Limpiar errores del componente si el lector está listo
    } else if (isConnected && !isReaderReady && !stompApiError) {
      setScanState("idle") // Conectado pero esperando que el checador inicie (o en proceso)
    } else if (!isConnected || stompApiError) {
      setScanState("failed") // No conectado o error
    }
  }, [isConnected, isReaderReady, stompApiError])

  // useEffect to update local state based on props (readerName, browserSessionId)
  useEffect(() => {
    setEmployeeIdForHook(null)
    setShowAttendance(false)
    setScanState("idle")
    setScanResult(null)
    setPreparingNextScan(false)
    setPanelFlash(null)
    setCustomMessage("")
    setStatusCode(undefined)
    setStatusData(undefined)
    setScanHistory([])
    setExpandedTurnoId(null)
  }, [selectedReader, sessionId])

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
            createSuccessSound()
            return Promise.resolve()
          } catch (e) {
            return Promise.resolve() // Silenciar errores
          }
        }

        const customErrorPlay = () => {
          try {
            createErrorSound()
            return Promise.resolve()
          } catch (e) {
            return Promise.resolve() // Silenciar errores
          }
        }

        const customScanPlay = () => {
          try {
            createScanSound()
            return Promise.resolve()
          } catch (e) {
            return Promise.resolve() // Silenciar errores
          }
        }

        // Sobreescribir métodos de reproducción con nuestros sonidos personalizados
        if (audioSuccess.current) {
          audioSuccess.current.play = customSuccessPlay
        }
        if (audioError.current) {
          audioError.current.play = customErrorPlay
        }
        if (audioScan.current) {
          audioScan.current.play = customScanPlay
        }
      } catch (e) {
        console.log("Web Audio API no soportada")
      }
    }
  }, [])

  // Actualizar la hora cada segundo
  useEffect(() => {
    // Set initial time on client-side
    setClientDisplayTime(new Date());

    const interval = setInterval(() => {
      setClientDisplayTime(new Date());
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (resetTimeout.current) clearTimeout(resetTimeout.current)
      if (retainSessionTimeout) clearTimeout(retainSessionTimeout)
    }
  }, [retainSessionTimeout])

  // Obtener mensaje de resultado según el estado
  const getResultMessage = () => {
    // Si hay un mensaje personalizado basado en código de estado, usarlo
    if (customMessage) {
      return customMessage
    }

    // Si no hay mensaje personalizado, usar los mensajes genéricos
    if (scanState === "success") {
      return lastAction === "entrada" ? "Entrada Registrada" : "Salida Registrada"
    }
    if (scanState === "failed") {
      return "Huella No Identificada"
    }
    return ""
  }

  // Función para obtener el color del texto del mensaje de resultado basado en el código de estado
  const getResultMessageColor = () => {
    if (statusCode) {
      const styles = getStyleClassesForCode(statusCode)
      return styles.text
    }

    // Si no hay código de estado, usar los colores basados en el estado del escaneo
    if (scanState === "success") {
      return "text-green-400"
    }
    if (scanState === "failed") {
      return "text-red-400"
    }
    return "text-transparent"
  }

  // Función para obtener el color del panel basado en el código de estado
  const getPanelColor = () => {
    if (statusCode) {
      const styles = getStyleClassesForCode(statusCode)
      return styles.panel
    }

    // Si no hay código de estado, usar los colores basados en el estado de panelFlash
    if (panelFlash === "success") {
      return "bg-green-900/50 border-green-500"
    }
    if (panelFlash === "failed") {
      return "bg-red-900/50 border-red-500"
    }
    return "bg-zinc-900 border-zinc-800"
  }

  // Auto-reset después de mostrar asistencia si no hay nuevo escaneo
  useEffect(() => {
    if (showAttendance) {
      resetTimeout.current = setTimeout(() => {
        // Limpiar elementos temporales
        setShowOverlayMessage(false)
        setShowInstructionMessage(true)
        setPanelFlash(null)

        // Si hay empleado activo, solo preparar para siguiente escaneo
        if (currentEmployeeData) {
          setScanState("ready")
          // NO limpiar el customMessage si está relacionado con un estado global como ALL_COMPLETE
          if (!statusCode || !statusCode.startsWith("3")) {
            // Los códigos 3xx pueden ser estados persistentes
            setCustomMessage("")
          }
        } else {
          // Si no hay empleado activo, resetear completamente
          setScanState("ready")
          setShowAttendance(false)
          setScanResult(null)
          setPreparingNextScan(false)
          setPanelFlash(null)
          setCustomMessage("")
          setStatusCode(undefined)
          setStatusData(undefined)
          setEmployeeIdForHook(null)
        }
      }, 9000) // Mostrar asistencia/estado durante 9 segundos
    }
    return () => {
      if (resetTimeout.current) clearTimeout(resetTimeout.current)
    }
  }, [showAttendance, currentEmployeeData, statusCode]) // Añadir statusCode como dependencia

  // Reproducir sonidos basados en el estado de escaneo
  useEffect(() => {
    // Solo reproducir sonidos si están habilitados
    if (scanState === "scanning") {
      if (soundEnabled) audioScan.current?.play()
    } else if (scanState === "success") {
      if (soundEnabled) audioSuccess.current?.play()
    } else if (scanState === "failed") {
      if (soundEnabled) audioError.current?.play()
    }
  }, [scanState, soundEnabled])

  // Añadir un nuevo useEffect para manejar las animaciones visuales independientemente del sonido
  useEffect(() => {
    // Manejar animaciones visuales (siempre activas independientemente del sonido)
    if (scanState === "success") {
      setPanelFlash("success")
      setShowOverlayMessage(true)
      setShowInstructionMessage(false)

      // Quitar el flash después de un tiempo
      setTimeout(() => {
        setPanelFlash(null)
      }, 2800)
    } else if (scanState === "failed") {
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

  // Efecto para establecer el turno expandido cuando cambia activeSessionId o retainedSessionId
  useEffect(() => {
    // Si hay un ID de sesión retenido (después de registrar salida), mostrar ese turno expandido
    if (retainedSessionId !== null) {
      setExpandedTurnoId(retainedSessionId)
    }
    // Si hay un ID de sesión activa, mostrar ese turno expandido
    else if (activeSessionId !== null) {
      setExpandedTurnoId(activeSessionId)
    }
    // Si no hay sesión activa ni retenida, pero hay jornadas, mostrar la primera pendiente
    else if (jornadasDelDia.length > 0) {
      const jornadasPendientes = jornadasDelDia
        .filter((jornada) => jornada.estatusJornada === "PENDIENTE")
        .sort((a, b) => a.horaEntradaProgramada.localeCompare(b.horaEntradaProgramada))

      if (jornadasPendientes.length > 0) {
        setExpandedTurnoId(jornadasPendientes[0].detalleHorarioId)
      } else {
        // Si no hay pendientes, mostrar la primera jornada
        setExpandedTurnoId(jornadasDelDia[0].detalleHorarioId)
      }
    } else {
      // Si no hay jornadas, no expandir ningún turno
      setExpandedTurnoId(null)
    }
  }, [activeSessionId, retainedSessionId, jornadasDelDia])

  // Función para obtener la próxima jornada y sus horarios
  const getNextScheduledTime = (): { entryTime: string; exitTime: string; detalleHorarioId: number | null } => {
    // Si no hay jornadas o no hay empleado, retornar valores por defecto
    if (jornadasDelDia.length === 0 || !currentEmployee?.id) {
      return { entryTime: "—", exitTime: "—", detalleHorarioId: null }
    }

    // Si hay una jornada retenida (después de registrar salida), mostrar esa
    if (retainedSessionId !== null) {
      const jornadaRetenida = jornadasDelDia.find((jornada) => jornada.detalleHorarioId === retainedSessionId)

      if (jornadaRetenida) {
        return {
          entryTime: jornadaRetenida.horaEntradaReal
            ? formatTime(jornadaRetenida.horaEntradaReal)
            : formatTime(jornadaRetenida.horaEntradaProgramada),
          exitTime: jornadaRetenida.horaSalidaReal
            ? formatTime(jornadaRetenida.horaSalidaReal)
            : formatTime(jornadaRetenida.horaSalidaProgramada),
          detalleHorarioId: jornadaRetenida.detalleHorarioId,
        }
      }
    }

    // Si hay un ID de sesión activa (del backend vía hook), mostrar esa jornada
    if (activeSessionId !== null) {
      const jornadaActiva = jornadasDelDia.find((jornada) => jornada.detalleHorarioId === activeSessionId)

      if (jornadaActiva) {
        return {
          entryTime: jornadaActiva.horaEntradaReal
            ? formatTime(jornadaActiva.horaEntradaReal)
            : formatTime(jornadaActiva.horaEntradaProgramada),
          exitTime: formatTime(jornadaActiva.horaSalidaProgramada),
          detalleHorarioId: jornadaActiva.detalleHorarioId,
        }
      }
    }

    // Si lastAction es salida y no hay una jornada retenida, buscar la próxima jornada pendiente
    if (lastAction === "salida" && retainedSessionId === null) {
      const jornadasPendientes = jornadasDelDia
        .filter((jornada) => jornada.estatusJornada === "PENDIENTE")
        .sort((a, b) => a.horaEntradaProgramada.localeCompare(b.horaEntradaProgramada))

      if (jornadasPendientes.length > 0) {
        const proxima = jornadasPendientes[0]
        return {
          entryTime: formatTime(proxima.horaEntradaProgramada),
          exitTime: formatTime(proxima.horaSalidaProgramada),
          detalleHorarioId: proxima.detalleHorarioId,
        }
      }
    }

    // Si hay una jornada en curso, mostrar sus horarios
    const jornadaEnCurso = jornadasDelDia.find(
      (jornada) => jornada.estatusJornada === "EN_CURSO" || jornada.estatusJornada === "RETARDO",
    )

    if (jornadaEnCurso) {
      return {
        entryTime: jornadaEnCurso.horaEntradaReal
          ? formatTime(jornadaEnCurso.horaEntradaReal)
          : formatTime(jornadaEnCurso.horaEntradaProgramada),
        exitTime: formatTime(jornadaEnCurso.horaSalidaProgramada),
        detalleHorarioId: jornadaEnCurso.detalleHorarioId,
      }
    }

    // Si no hay condiciones específicas, mostrar la primera jornada
    if (jornadasDelDia.length > 0) {
      const primera = jornadasDelDia[0]
      return {
        entryTime: formatTime(primera.horaEntradaProgramada),
        exitTime: formatTime(primera.horaSalidaProgramada),
        detalleHorarioId: primera.detalleHorarioId,
      }
    }

    // Si no hay jornadas, retornar valores por defecto
    return { entryTime: "—", exitTime: "—", detalleHorarioId: null }
  }

  // Actualizar la estructura del diseño para cumplir con los nuevos requisitos
  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="flex flex-col gap-4 w-full max-w-7xl">
        {/* Reloj principal en la parte superior */}
        <div className="flex justify-between items-center bg-zinc-900 rounded-lg p-4 border-2 border-zinc-800">
          <div className="flex items-center gap-3">
            <Clock className="h-10 w-10 text-zinc-400" />
            <span className="text-4xl font-bold text-white">
              {clientDisplayTime ? format(clientDisplayTime, "HH:mm:ss") : "00:00:00"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-zinc-400" />
            <span className="text-2xl font-medium text-white">
              {clientDisplayTime ? format(clientDisplayTime, "EEE, dd MMM yyyy", { locale: es }) : "---, -- --- ----"}
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
          {/* Panel izquierdo: Lista de turnos */}
          <div className="w-full md:w-80 bg-zinc-900 rounded-lg p-4 border-2 border-zinc-800">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-6 w-6 text-zinc-400" />
              <h3 className="text-xl font-bold text-zinc-300">Turnos del Día</h3>
            </div>

            {/* Resumen de jornadas - siempre visible */}
            {jornadasDelDia.length > 0 && showAttendance ? (
              <div className="mb-3 flex items-center justify-between bg-zinc-800/50 p-2 rounded-md">
                <div className="flex items-center gap-2">
                  <div className="bg-zinc-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium text-white">
                    {jornadasDelDia.length}
                  </div>
                  <span className="text-zinc-300 text-sm">{jornadasDelDia.length === 1 ? "Turno" : "Turnos"} hoy</span>
                </div>
                <div className="flex gap-1">
                  <div className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-green-900/30 text-green-300">
                    <CheckCircle className="h-3 w-3" />
                    <span>{jornadasDelDia.filter((j) => j.estatusJornada === "COMPLETADA").length}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-300">
                    <Clock className="h-3 w-3 animate-pulse" />
                    <span>
                      {
                        jornadasDelDia.filter((j) => j.estatusJornada === "EN_CURSO" || j.estatusJornada === "RETARDO")
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-zinc-700/50 text-zinc-300">
                    <Clock className="h-3 w-3" />
                    <span>{jornadasDelDia.filter((j) => j.estatusJornada === "PENDIENTE").length}</span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              {jornadasDelDia.length > 0 && showAttendance ? (
                <div className="space-y-3">
                  {/* Lista de todos los turnos, ordenados por hora */}
                  {jornadasDelDia
                    .sort((a, b) => {
                      // Ordenar primero por hora de entrada programada
                      return a.horaEntradaProgramada.localeCompare(b.horaEntradaProgramada)
                    })
                    .map((jornada) => {
                      // Determinar si este turno está activo
                      const isActive =
                        (activeSessionId !== null && jornada.detalleHorarioId === activeSessionId) ||
                        (retainedSessionId !== null && jornada.detalleHorarioId === retainedSessionId)

                      // Determinar si este turno está expandido - ahora el turno activo siempre se expande
                      const isExpanded = isActive || jornada.detalleHorarioId === expandedTurnoId

                      return (
                        <TurnoItem
                          key={jornada.detalleHorarioId}
                          jornada={jornada}
                          isActive={isActive}
                          isExpanded={isExpanded}
                          onClick={() =>
                            setExpandedTurnoId(
                              expandedTurnoId === jornada.detalleHorarioId ? null : jornada.detalleHorarioId,
                            )
                          }
                        />
                      )
                    })}

                  {/* Si no hay jornadas */}
                  {jornadasDelDia.length === 0 && (
                    <div className="text-center py-2 text-sm text-zinc-500">No hay turnos programados hoy</div>
                  )}
                </div>
              ) : (
                // Placeholders cuando no hay datos
                <>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="p-3 mb-2 rounded-md border border-zinc-800 bg-zinc-800/30 animate-pulse"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-zinc-700 rounded-full"></div>
                          <div>
                            <div className="h-4 w-24 bg-zinc-700 rounded mb-1"></div>
                            <div className="h-3 w-16 bg-zinc-700 rounded"></div>
                          </div>
                        </div>
                        <div className="h-4 w-16 bg-zinc-700 rounded"></div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Panel central: Reloj principal */}
          <Card
            className={`relative flex-1 overflow-hidden p-4 text-white shadow-lg border-2 transition-colors duration-300 ${getPanelColor()}`}
            ref={containerRef}
          >
            {/* Mensaje de resultado como overlay - posición fija */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div
                className={`text-5xl font-bold transition-opacity duration-300 ${getResultMessageColor()} ${
                  scanState === "success"
                    ? "drop-shadow-[0_0_20px_rgba(74,222,128,0.8)]"
                    : scanState === "failed"
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
                        scanState === "success"
                          ? "rgba(34, 197, 94, 0.3)"
                          : scanState === "failed"
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
                    </>
                  )}

                  {scanState === "scanning" && (
                    <>
                      {/* Crestas de huella siendo llenadas */}
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

                      <div className="absolute -bottom-12 text-center">
                        <p className="text-blue-400 text-sm">Escaneando huella digital...</p>
                      </div>
                    </>
                  )}

                  {/* Estado de éxito - animación de marca de verificación verde */}
                  {scanState === "success" && (
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
                  )}

                  {/* Estado de fallo - animación de X roja */}
                  {scanState === "failed" && (
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
                        <XCircle
                          className={`h-32 w-32 ${statusCode ? getStyleClassesForCode(statusCode).icon : "text-red-500"}`}
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
                          background: `radial-gradient(circle, ${statusCode && statusCode.startsWith("4") ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.2)"} 0%, transparent 70%)`,
                        }}
                      />
                    </>
                  )}
                </div>

                {/* Mensaje de instrucción - SIEMPRE VISIBLE CON ALTURA FIJA */}
                <div className="h-12 flex items-center justify-center">
                  {showInstructionMessage && (
                    <p className="text-center text-xl font-medium text-zinc-300 flex items-center gap-2">
                      {(scanState === "idle" || scanState === "ready") && (
                        <>
                          <Fingerprint className="h-5 w-5 text-blue-400 animate-pulse" />
                          Coloque su dedo en el escáner
                        </>
                      )}
                      {scanState === "scanning" && (
                        <>
                          <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                          Escaneando huella...
                        </>
                      )}
                      {scanState === "success" && (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-400" />
                          Verificación exitosa
                        </>
                      )}
                      {scanState === "failed" && (
                        <>
                          <XCircle className="h-5 w-5 text-red-400" />
                          Huella no reconocida
                        </>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Sección de datos de asistencia - SIEMPRE VISIBLE CON PLACEHOLDERS */}
              <div className="mt-4 w-full border-t-2 border-zinc-700 pt-6">
                {/* Información del usuario - siempre visible con placeholders */}
                <div className="mb-6 flex items-center gap-4">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-full ${showAttendance && currentEmployee ? "bg-blue-500/30 border-2 border-blue-500" : "bg-zinc-800"}`}
                  >
                    <User
                      className={`h-8 w-8 ${showAttendance && currentEmployee ? "text-blue-300" : "text-zinc-400"}`}
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {showAttendance && currentEmployee?.name ? currentEmployee.name : "Usuario"}
                    </h2>
                    <p className="text-lg text-zinc-400">
                      {showAttendance && currentEmployee?.id ? currentEmployee.id : "ID-0000-0000"}
                    </p>
                  </div>
                </div>

                {/* Recuadros de Entrada/Salida - siempre visibles */}
                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div
                    className={`rounded-lg p-4 border-2 ${
                      showAttendance && lastAction === "entrada"
                        ? getTimeBoxColor(
                            jornadasDelDia.find((j) => j.detalleHorarioId === activeSessionId)?.estatusJornada ||
                              "PENDIENTE",
                            "entrada",
                          )
                        : showAttendance && lastAction === "salida" && retainedSessionId
                        ? getTimeBoxColor(
                            jornadasDelDia.find((j) => j.detalleHorarioId === retainedSessionId)?.estatusJornada ||
                              "COMPLETADA",
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
                          : showAttendance && lastAction === "salida" && retainedSessionId
                          ? "text-green-300"
                          : "text-zinc-600"
                      }`}
                    >
                      {showAttendance && lastAction === "entrada" && activeSessionId !== null
                        ? jornadasDelDia.find((j) => j.detalleHorarioId === activeSessionId)?.horaEntradaReal
                          ? formatTime(
                              jornadasDelDia.find((j) => j.detalleHorarioId === activeSessionId)?.horaEntradaReal ||
                                null,
                            )
                          : getNextScheduledTime().entryTime
                        : showAttendance && lastAction === "salida" && retainedSessionId !== null
                        ? jornadasDelDia.find((j) => j.detalleHorarioId === retainedSessionId)?.horaEntradaReal
                          ? formatTime(
                              jornadasDelDia.find((j) => j.detalleHorarioId === retainedSessionId)?.horaEntradaReal ||
                                null,
                            )
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
                            jornadasDelDia.find((j) => j.detalleHorarioId === (retainedSessionId || activeSessionId))?.estatusJornada ||
                              "PENDIENTE",
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

                      {/* Indicador visual de sesión completada recientemente */}
                      {statusCode && !statusCode.startsWith('4') && lastAction === "salida" && (
                        <span className="ml-auto text-xs bg-green-600/40 text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Turno Completado
                        </span>
                      )}
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
                      {(() => {
                        if (showAttendance) {
                          // Si tenemos una sesión retenida (recién completada), mostrar su hora de salida real
                          if (lastAction === "salida" && retainedSessionId !== null) {
                            const jornadaRetenida = jornadasDelDia.find((j) => j.detalleHorarioId === retainedSessionId)
                            if (jornadaRetenida?.horaSalidaReal) {
                              return formatTime(jornadaRetenida.horaSalidaReal)
                            }
                          }

                          // ALL_COMPLETE: Show the latest actual exit time from completed jornadas
                          else if (statusCode === "299") {
                            const completedJornadasConSalidaReal = jornadasDelDia
                              .filter((j) => j.estatusJornada === "COMPLETADA" && j.horaSalidaReal)
                              .sort((a, b) =>
                                (b.horaSalidaProgramada || "").localeCompare(a.horaSalidaProgramada || ""),
                              ) // Sort to find the "last" one

                            if (
                              completedJornadasConSalidaReal.length > 0 &&
                              completedJornadasConSalidaReal[0].horaSalidaReal
                            ) {
                              return formatTime(completedJornadasConSalidaReal[0].horaSalidaReal)
                            }
                            return "--:--" // Fallback if no real exit time found
                          }

                          // Regular "salida" action with an active session
                          else if (lastAction === "salida" && activeSessionId !== null) {
                            const activeJornada = jornadasDelDia.find((j) => j.detalleHorarioId === activeSessionId)
                            if (activeJornada?.horaSalidaReal) {
                              return formatTime(activeJornada.horaSalidaReal)
                            }
                            // If active session but no real exit time yet (e.g., showing programmed exit for current shift)
                            if (activeJornada) {
                              return formatTime(activeJornada.horaSalidaProgramada)
                            }
                            // Fallback if activeJornada somehow not found
                            return getNextScheduledTime().exitTime
                          }
                          // Fallback display for "salida" if other specific conditions aren't met
                          // This ensures that if lastAction is "salida", we try to show something meaningful.
                          else if (lastAction === "salida") {
                            // Attempt to find the most recently completed session's exit time as a general fallback for "salida"
                            const anyCompletedWithExit = jornadasDelDia
                              .filter((j) => j.estatusJornada === "COMPLETADA" && j.horaSalidaReal)
                              .sort((a, b) =>
                                (b.horaSalidaProgramada || "").localeCompare(a.horaSalidaProgramada || ""),
                              )
                            if (anyCompletedWithExit.length > 0 && anyCompletedWithExit[0].horaSalidaReal) {
                              return formatTime(anyCompletedWithExit[0].horaSalidaReal)
                            }
                            // Otherwise, show next scheduled exit time from the helper
                            return getNextScheduledTime().exitTime
                          }
                        }
                        return "00:00" // Default placeholder
                      })()}
                    </p>
                    {showAttendance &&
                      lastAction === "salida" &&
                      statusCode !== undefined &&
                      statusCode.startsWith("3") && (
                        <div className="mt-2 text-xs text-blue-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {getUserFriendlyMessage(statusCode, statusData)}
                        </div>
                      )}
                  </div>
                </div>
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
              {scanHistory.length === 0
                ? // Placeholders cuando no hay historial
                  Array.from({ length: 6 }).map((_, index) => (
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
                                  scan.action === "entrada"
                                    ? "bg-green-500/20 text-green-300"
                                    : "bg-blue-500/20 text-blue-300"
                                }`}
                              >
                                {scan.action === "entrada" ? "Entrada" : "Salida"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
