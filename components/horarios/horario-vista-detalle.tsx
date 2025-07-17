"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, AlertTriangle, Clock, Crown, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"
import { cn } from "@/lib/utils"

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

// Tipos basados en los DTOs del backend
type DetalleHorarioDto = {
  id: number
  diaSemana: number // 1=Domingo, 2=Lunes, ..., 7=Sábado
  turno: number
  horaEntrada: string // "HH:mm:ss"
  horaSalida: string // "HH:mm:ss"
}

type HorarioDto = {
  id: number
  nombre: string
  descripcion?: string
  esHorarioJefe?: boolean
  detalles: DetalleHorarioDto[]
}

// Estructura para representar un bloque en la cuadrícula
type BloqueHorario = {
  activo: boolean
  turno?: number
  horaInicio?: string
  horaFin?: string
  detalleId?: number
}

interface HorarioVistaDetalleProps {
  horarioId: string
}

export function HorarioVistaDetalle({ horarioId }: HorarioVistaDetalleProps) {
  const [horario, setHorario] = useState<HorarioDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [diaSeleccionado, setDiaSeleccionado] = useState<number>(2) // Por defecto Lunes
  const { toast } = useToast()

  // Configuración de la cuadrícula - 24 horas con intervalos de 30 minutos como filas
  const intervalosDelDia = Array.from({ length: 48 }, (_, i) => {
    const hora = Math.floor(i / 2)
    const minutos = i % 2 === 0 ? "00" : "30"
    return `${hora.toString().padStart(2, "0")}:${minutos}`
  })

  // Días de la semana (ajustado al formato del backend: 1=Domingo, 2=Lunes, etc.)
  const diasSemana = [
    { nombre: "Lunes", indice: 2 },
    { nombre: "Martes", indice: 3 },
    { nombre: "Miércoles", indice: 4 },
    { nombre: "Jueves", indice: 5 },
    { nombre: "Viernes", indice: 6 },
    { nombre: "Sábado", indice: 7 },
    { nombre: "Domingo", indice: 1 },
  ]

  // Cargar datos del horario
  useEffect(() => {
    fetchHorario()
  }, [horarioId])

  const fetchHorario = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.get<HorarioDto>(`${API_BASE_URL}/api/horarios/${horarioId}`)
      setHorario(response.data)
    } catch (error: any) {
      console.error("Error al cargar horario:", error)
      const errorMessage = error.response?.data?.mensaje || error.message || "Error desconocido"
      setError(`Error al cargar el horario: ${errorMessage}`)
      toast({
        title: "Error al cargar datos",
        description: `No se pudo cargar la información del horario. ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Función para convertir hora "HH:mm:ss" a minutos desde medianoche
  const convertirHoraAMinutos = (hora: string): number => {
    const [h, m] = hora.split(":").map(Number)
    return h * 60 + m
  }

  // Función para verificar si un intervalo específico está dentro de un bloque
  const estaEnBloque = (intervalo: string, detalle: DetalleHorarioDto): boolean => {
    const intervaloMinutos = convertirHoraAMinutos(intervalo)
    const horaEntradaMinutos = convertirHoraAMinutos(detalle.horaEntrada)
    const horaSalidaMinutos = convertirHoraAMinutos(detalle.horaSalida)

    // Incluir el intervalo si está dentro del rango, incluyendo intervalos que empiecen antes de la hora de salida
    // Para un turno de 07:00-10:30, debe incluir 07:00, 07:30, 08:00, 08:30, 09:00, 09:30, 10:00
    // El intervalo 10:30 no se incluye porque es cuando termina el turno
    return intervaloMinutos >= horaEntradaMinutos && intervaloMinutos < horaSalidaMinutos
  }

  // Función para ordenar turnos correctamente, considerando que las horas de madrugada van primero
  const ordenarTurnosPorHora = (turnos: DetalleHorarioDto[]): DetalleHorarioDto[] => {
    return [...turnos].sort((a, b) => {
      const horaA = convertirHoraAMinutos(a.horaEntrada)
      const horaB = convertirHoraAMinutos(b.horaEntrada)

      // Las horas de madrugada (00:00-05:59) van primero, luego el resto del día
      const esHoraMadrugadaA = horaA < 360 // Menos de 6:00 AM
      const esHoraMadrugadaB = horaB < 360

      if (esHoraMadrugadaA && !esHoraMadrugadaB) {
        return -1 // A va primero (madrugada antes que día)
      }
      if (!esHoraMadrugadaA && esHoraMadrugadaB) {
        return 1 // B va primero (madrugada antes que día)
      }

      // Si ambos son de madrugada o ambos son de día, ordenar normalmente
      return horaA - horaB
    })
  }

  // Función para obtener el bloque activo en una celda específica
  const obtenerBloqueEnCelda = (intervalo: string, diaIndice: number): BloqueHorario => {
    if (!horario) return { activo: false }

    // Buscar detalles que correspondan al día y que incluyan este intervalo, ordenados correctamente
    const detallesDelDia = ordenarTurnosPorHora(horario.detalles.filter((detalle) => detalle.diaSemana === diaIndice))

    for (const detalle of detallesDelDia) {
      if (estaEnBloque(intervalo, detalle)) {
        return {
          activo: true,
          turno: detalle.turno,
          horaInicio: detalle.horaEntrada,
          horaFin: detalle.horaSalida,
          detalleId: detalle.id,
        }
      }
    }

    return { activo: false }
  }

  // Función para obtener el color del bloque según el turno
  const obtenerColorBloque = (turno: number): string => {
    const colores = [
      "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700", // Turno 1
      "bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700", // Turno 2
      "bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-700", // Turno 3
      "bg-orange-100 dark:bg-orange-900 border-orange-300 dark:border-orange-700", // Turno 4
      "bg-pink-100 dark:bg-pink-900 border-pink-300 dark:border-pink-700", // Turno 5
      "bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700", // Turno 6
      "bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700", // Turno 7
      "bg-indigo-100 dark:bg-indigo-900 border-indigo-300 dark:border-indigo-700", // Turno 8
    ]
    return colores[(turno - 1) % colores.length] || colores[0]
  }

  // Calcular estadísticas del horario
  const calcularEstadisticas = () => {
    if (!horario) return { totalHoras: 0, diasActivos: 0, totalTurnos: 0 }

    let totalMinutos = 0
    const diasConHorario = new Set<number>()
    let totalTurnos = 0

    horario.detalles.forEach((detalle) => {
      const inicioMinutos = convertirHoraAMinutos(detalle.horaEntrada)
      const finMinutos = convertirHoraAMinutos(detalle.horaSalida)
      totalMinutos += finMinutos - inicioMinutos
      diasConHorario.add(detalle.diaSemana)
      totalTurnos++
    })

    return {
      totalHoras: totalMinutos / 60,
      diasActivos: diasConHorario.size,
      totalTurnos,
    }
  }

  // Obtener turnos del día seleccionado
  const obtenerTurnosDelDia = (diaIndice: number) => {
    if (!horario) return []
    return horario.detalles.filter((detalle) => detalle.diaSemana === diaIndice)
  }

  // Obtener nombre del día por índice
  const obtenerNombreDia = (indice: number) => {
    const dia = diasSemana.find((d) => d.indice === indice)
    return dia?.nombre || `Día ${indice}`
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Cargando detalles del horario...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!horario) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No se encontró información del horario.</p>
        </CardContent>
      </Card>
    )
  }

  const estadisticas = calcularEstadisticas()
  const turnosDelDiaSeleccionado = obtenerTurnosDelDia(diaSeleccionado)

  return (
    <div className="space-y-6">
      {/* Información del horario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {horario.esHorarioJefe && <Crown className="h-5 w-5 text-yellow-500" />}
            {horario.nombre}
            {horario.esHorarioJefe && (
              <Badge variant="outline" className="border-yellow-400 text-yellow-600">
                Horario de Jefe
              </Badge>
            )}
          </CardTitle>
          {horario.descripcion && <p className="text-muted-foreground">{horario.descripcion}</p>}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>{estadisticas.totalHoras.toFixed(1)} horas</strong> semanales
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>{estadisticas.diasActivos}</strong> días activos
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-fit">
                {estadisticas.totalTurnos} turnos configurados
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cuadrícula del horario */}
      <Card>
        <CardHeader>
          <CardTitle>Vista Cuadriculada del Horario (24 Horas)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Horarios completos de 00:00 a 23:30 • Intervalos de 30 minutos • Los colores representan diferentes turnos
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 dark:border-slate-700">
              <thead>
                <tr>
                  <th className="border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2 text-center font-medium min-w-[80px]">
                    Hora
                  </th>
                  {diasSemana.map((dia) => (
                    <th
                      key={dia.indice}
                      className="border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2 text-center font-medium min-w-[100px]"
                    >
                      {dia.nombre}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {intervalosDelDia.map((intervalo) => (
                  <tr key={intervalo}>
                    <td className="border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2 text-center font-medium">
                      {intervalo}
                    </td>
                    {diasSemana.map((dia) => {
                      const bloque = obtenerBloqueEnCelda(intervalo, dia.indice)
                      return (
                        <td
                          key={`${intervalo}-${dia.indice}`}
                          className={cn(
                            "border border-slate-300 dark:border-slate-700 p-1 text-center h-8",
                            bloque.activo
                              ? obtenerColorBloque(bloque.turno!)
                              : "bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900",
                          )}
                          title={
                            bloque.activo
                              ? `Turno ${bloque.turno}: ${bloque.horaInicio} - ${bloque.horaFin}`
                              : `${intervalo} - ${dia.nombre}: Sin horario`
                          }
                        >
                          {bloque.activo && <div className="text-xs font-medium">T{bloque.turno}</div>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Leyenda de turnos con selector de día - SIN CAMBIOS */}
      {horario.detalles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Leyenda de Turnos por Día
              <div className="flex items-center gap-2">
                <span className="text-sm font-normal text-muted-foreground">Seleccionar día:</span>
                <Select
                  value={diaSeleccionado.toString()}
                  onValueChange={(value) => setDiaSeleccionado(Number.parseInt(value))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {diasSemana.map((dia) => (
                      <SelectItem key={dia.indice} value={dia.indice.toString()}>
                        {dia.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h4 className="font-medium text-lg">{obtenerNombreDia(diaSeleccionado)}</h4>
              <p className="text-sm text-muted-foreground">
                {turnosDelDiaSeleccionado.length > 0
                  ? `${turnosDelDiaSeleccionado.length} turno(s) configurado(s)`
                  : "Sin turnos configurados para este día"}
              </p>
            </div>

            {turnosDelDiaSeleccionado.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {turnosDelDiaSeleccionado.map((detalle) => {
                  const duracionMinutos =
                    convertirHoraAMinutos(detalle.horaSalida) - convertirHoraAMinutos(detalle.horaEntrada)
                  const duracionHoras = duracionMinutos / 60

                  return (
                    <div key={detalle.id} className={cn("p-4 rounded-lg border-2", obtenerColorBloque(detalle.turno))}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-lg">Turno {detalle.turno}</div>
                        <Badge variant="outline" className="text-xs">
                          {duracionHoras.toFixed(1)}h
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="font-medium">Entrada:</span> {detalle.horaEntrada.substring(0, 5)}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Salida:</span> {detalle.horaSalida.substring(0, 5)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Duración: {Math.floor(duracionHoras)}h {duracionMinutos % 60}min
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay turnos configurados para {obtenerNombreDia(diaSeleccionado)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resumen por día */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {diasSemana.map((dia) => {
              const detallesDelDia = horario.detalles.filter((d) => d.diaSemana === dia.indice)
              const horasDelDia = detallesDelDia.reduce((total, detalle) => {
                const inicio = convertirHoraAMinutos(detalle.horaEntrada)
                const fin = convertirHoraAMinutos(detalle.horaSalida)
                return total + (fin - inicio) / 60
              }, 0)

              return (
                <div
                  key={dia.indice}
                  className={cn(
                    "border rounded-lg p-3 cursor-pointer transition-colors",
                    diaSeleccionado === dia.indice
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900",
                  )}
                  onClick={() => setDiaSeleccionado(dia.indice)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{dia.nombre}</span>
                    <span className="text-sm text-muted-foreground">{horasDelDia.toFixed(1)}h</span>
                  </div>
                  {detallesDelDia.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {detallesDelDia.map((detalle) => (
                        <div key={detalle.id} className="text-xs text-muted-foreground">
                          Turno {detalle.turno}: {detalle.horaEntrada.substring(0, 5)} -{" "}
                          {detalle.horaSalida.substring(0, 5)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground mt-1">Sin horario</div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
