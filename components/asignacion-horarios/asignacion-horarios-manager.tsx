"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AsignacionHorarioCard } from "@/components/asignacion-horarios/asignacion-horario-card"
import { v4 as uuidv4 } from "uuid"
import type { Horario } from "../horarios/horarios-manager"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, UserPlus, ArrowLeft, Trash, Loader2, XCircle, Clock, Calendar } from "lucide-react"
import { SeleccionEmpleadoDialog } from "@/components/asignacion-horarios/seleccion-empleado-dialog"
import { SelectorHorarioExistente } from "@/components/asignacion-horarios/selector-horario-existente"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import axios from "axios"
import type { HorarioDto, HorarioAsignadoDto, EmpleadoDto, EmpleadoUI } from "../types/backend-types"
import type {
  HorarioAsignadoCreateDto,
} from "../types/backend-types"


// Tipos
export type Empleado = {
  id: number
  nombre: string
  departamento?: string
  puesto?: string
}

export type BloqueHorario = {
  id: string
  inicio: string
  fin: string
}

export type HorarioAsignado = {
  id: string
  nombre: string
  descripcion: string
  inicioVigencia: Date
  finVigencia: Date
  bloques: {
    [dia: string]: BloqueHorario[]
  }
  reglaAsistencia?: string
  esOriginal: boolean // Indica si es un horario original de la sección "Horarios"
  horarioOriginalId?: string // ID del horario original si es una copia
  isEditing: boolean
  isNew: boolean
}

// Función para convertir EmpleadoDto a EmpleadoUI
const convertirEmpleadoDto = (empleadoDto: EmpleadoDto): EmpleadoUI => {
  return {
    id: empleadoDto.id,
    nombre: empleadoDto.nombreCompleto,
    departamento: empleadoDto.departamentoAcademicoId
      ? "Académico"
      : empleadoDto.departamentoAdministrativoId
        ? "Administrativo"
        : "Sin departamento",
    puesto: empleadoDto.tipoNombramientoPrincipal || "Sin puesto",
  }
}

export function AsignacionHorariosManager() {
  const [searchTerm, setSearchTerm] = useState("")
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<EmpleadoUI | null>(null)
  const [horarioAsignado, setHorarioAsignado] = useState<HorarioAsignadoDto | null>(null)
  const [horarioCompleto, setHorarioCompleto] = useState<HorarioDto | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mostrandoSelector, setMostrandoSelector] = useState(false)
  const [empleados, setEmpleados] = useState<EmpleadoUI[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingHorario, setLoadingHorario] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cambiandoHorario, setCambiandoHorario] = useState(false)

  // API Base URL para las peticiones
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

  // Cargar empleados al montar el componente
  useEffect(() => {
    fetchEmpleados()
  }, [])

  // Cargar horario asignado cuando se selecciona un empleado
  useEffect(() => {
    if (empleadoSeleccionado) {
      fetchHorarioAsignado(empleadoSeleccionado.id)
      setMostrandoSelector(false)
    } else {
      setHorarioAsignado(null)
      setHorarioCompleto(null)
    }
  }, [empleadoSeleccionado])

  // Cargar detalles del horario cuando se asigna uno
  useEffect(() => {
    if (horarioAsignado && horarioAsignado.horarioId) {
      fetchHorarioCompleto(horarioAsignado.horarioId)
    } else {
      setHorarioCompleto(null)
    }
  }, [horarioAsignado])

  const fetchEmpleados = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await axios.get<EmpleadoDto[]>(`${API_BASE_URL}/api/empleados`)

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("La respuesta del servidor no es válida")
      }

      const empleadosUI = response.data.map(convertirEmpleadoDto)
      setEmpleados(empleadosUI)
      console.log("Empleados cargados:", empleadosUI)
    } catch (error: any) {
      console.error("Error al cargar empleados:", error)
      setError(`Error al cargar empleados: ${error.response?.data?.mensaje || error.message}`)
      setEmpleados([])
    } finally {
      setLoading(false)
    }
  }

  const fetchHorarioAsignado = async (empleadoId: number) => {
    try {
      const response = await axios.get<HorarioAsignadoDto[]>(
        `${API_BASE_URL}/api/horarios-asignados/empleado/${empleadoId}`,
      )

      // Tomar el primer horario asignado activo (si existe)
      const horarioActivo = response.data.find((h) => !h.fechaFin || new Date(h.fechaFin) >= new Date())
      setHorarioAsignado(horarioActivo || null)

      console.log("Horario asignado cargado:", horarioActivo)
    } catch (error: any) {
      console.error("Error al cargar horario asignado:", error)
      setHorarioAsignado(null)
    }
  }

  const fetchHorarioCompleto = async (horarioId: number) => {
    try {
      setLoadingHorario(true)
      const response = await axios.get<HorarioDto>(`${API_BASE_URL}/api/horarios/${horarioId}`)
      setHorarioCompleto(response.data)
      console.log("Horario completo cargado:", response.data)
    } catch (error: any) {
      console.error("Error al cargar horario completo:", error)
      setHorarioCompleto(null)
    } finally {
      setLoadingHorario(false)
    }
  }

  // Filtrar empleados según el término de búsqueda
  const empleadosFiltrados = empleados.filter(
    (empleado) =>
      empleado.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empleado.departamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empleado.puesto.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Seleccionar un empleado
  const handleSeleccionarEmpleado = (empleado: EmpleadoUI) => {
    setEmpleadoSeleccionado(empleado)
    setDialogOpen(false)
  }

  // Mostrar selector de horarios
  const handleMostrarSelector = () => {
    setMostrandoSelector(true)
  }

  // Seleccionar un horario existente y asignarlo
  const handleSeleccionarHorarioExistente = (horario: HorarioDto, asignacion?: HorarioAsignadoDto) => {
    if (!empleadoSeleccionado) return

    if (asignacion) {
      // Si se realizó la asignación, actualizar el estado
      setHorarioAsignado(asignacion)
      setHorarioCompleto(horario)
      setMostrandoSelector(false)
      setCambiandoHorario(false) // Resetear el estado de cambio

      // Mostrar mensaje de éxito
      alert(`Horario "${horario.nombre}" asignado exitosamente a ${empleadoSeleccionado.nombre}`)
    } else {
      // Si solo se seleccionó sin asignar
      setMostrandoSelector(false)
      setCambiandoHorario(false)
    }
  }

  // Crear un nuevo horario personalizado
  const handleCrearNuevoHorario = () => {
    if (!empleadoSeleccionado) return

    // Aquí podrías redirigir a un formulario de creación de horario
    alert("Funcionalidad de crear nuevo horario personalizado - Por implementar")
    setMostrandoSelector(false)
    setCambiandoHorario(false)
  }

  // Eliminar horario asignado
  const handleEliminarHorario = async () => {
    if (!horarioAsignado || !empleadoSeleccionado) return

    if (confirm("¿Estás seguro de que deseas eliminar el horario asignado a este empleado?")) {
      try {
        await axios.delete(`${API_BASE_URL}/api/horarios-asignados/${horarioAsignado.id}`)
        setHorarioAsignado(null)
        setHorarioCompleto(null)
        alert("Horario desasignado exitosamente")
      } catch (error: any) {
        console.error("Error al eliminar horario:", error)
        alert(`Error al eliminar horario: ${error.response?.data?.mensaje || error.message}`)
      }
    }
  }

  // Cambiar horario (desactivar actual y mostrar selector)
  const handleCambiarHorario = async () => {
    if (!horarioAsignado || !empleadoSeleccionado) return

    if (confirm("¿Estás seguro de que deseas cambiar el horario? Se desactivará el horario actual.")) {
      try {
        setCambiandoHorario(true)
        setError(null)

        // Paso 1: Desactivar el horario actual usando PUT
        // Crear DTO con fechaFin = ayer para desactivarlo
        const ayer = new Date()
        ayer.setDate(ayer.getDate() - 1)

        const updateDto: HorarioAsignadoCreateDto = {
          empleadoId: horarioAsignado.empleadoId,
          horarioId: horarioAsignado.horarioId,
          tipoHorarioId: horarioAsignado.tipoHorarioId || 1, // Usar el tipo actual o default
          fechaInicio: horarioAsignado.fechaInicio,
          fechaFin: ayer.toISOString().split("T")[0], // Formato yyyy-MM-dd
        }

        console.log("Desactivando horario actual:", updateDto)

        await axios.delete(`${API_BASE_URL}/api/horarios-asignados/${horarioAsignado.id}`, updateDto)

        console.log("Horario actual desactivado exitosamente")

        // Paso 2: Limpiar estado y mostrar selector para nuevo horario
        setHorarioAsignado(null)
        setHorarioCompleto(null)
        setMostrandoSelector(true)

        // Mostrar mensaje informativo
        alert("Horario actual desactivado. Ahora selecciona el nuevo horario.")
      } catch (error: any) {
        console.error("Error al desactivar horario:", error)
        setError(`Error al desactivar horario: ${error.response?.data?.mensaje || error.message}`)
        setCambiandoHorario(false)
      }
    }
  }

  // Formatear fecha para mostrar
  const formatearFecha = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Calcular horas totales del horario
  const calcularHorasTotales = (horario: HorarioDto): number => {
    if (!horario || !horario.detalles || !Array.isArray(horario.detalles)) {
      return 0
    }

    let total = 0
    horario.detalles.forEach((detalle) => {
      if (!detalle || !detalle.horaEntrada || !detalle.horaSalida) {
        return
      }

      try {
        const [horaInicioH, horaInicioM] = detalle.horaEntrada.split(":").map(Number)
        const [horaFinH, horaFinM] = detalle.horaSalida.split(":").map(Number)

        const inicioMinutos = horaInicioH * 60 + horaInicioM
        const finMinutos = horaFinH * 60 + horaFinM

        total += (finMinutos - inicioMinutos) / 60
      } catch (error) {
        console.warn("Error calculando horas para detalle:", detalle, error)
      }
    })
    return total
  }

  // Obtener días activos del horario
  const obtenerDiasActivos = (horario: HorarioDto): number => {
    if (!horario || !horario.detalles || !Array.isArray(horario.detalles)) {
      return 0
    }

    const diasUnicos = new Set(
      horario.detalles
        .filter((detalle) => detalle && typeof detalle.diaSemana === "number")
        .map((detalle) => detalle.diaSemana),
    )
    return diasUnicos.size
  }

  // Obtener nombre del día
  const obtenerNombreDia = (diaSemana: number): string => {
    const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    return dias[diaSemana] || `Día ${diaSemana}`
  }

  // Formatear hora
  const formatearHora = (hora: string): string => {
    if (!hora || typeof hora !== "string") {
      return "00:00"
    }
    try {
      return hora.substring(0, 5) // "HH:mm:ss" -> "HH:mm"
    } catch (error) {
      return "00:00"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Asignación de Horarios</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar empleado..."
                  className="pl-8 w-full sm:w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setDialogOpen(true)}
                />
              </div>
              <Button variant="outline" onClick={() => setDialogOpen(true)} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                Seleccionar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mostrar error si existe */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Mostrar alerta cuando se está cambiando horario */}
          {cambiandoHorario && (
            <Alert className="mb-4 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
              <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                Procesando cambio de horario... El horario actual se está desactivando.
              </AlertDescription>
            </Alert>
          )}

          {empleadoSeleccionado ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-md bg-slate-50 dark:bg-slate-900">
                <div>
                  <h3 className="font-medium text-lg">{empleadoSeleccionado.nombre}</h3>
                  <p className="text-sm text-muted-foreground">
                    {empleadoSeleccionado.departamento} - {empleadoSeleccionado.puesto}
                  </p>
                </div>
                <Button variant="outline" onClick={() => setEmpleadoSeleccionado(null)} disabled={cambiandoHorario}>
                  Cambiar Empleado
                </Button>
              </div>

              {mostrandoSelector ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMostrandoSelector(false)
                        setCambiandoHorario(false)
                      }}
                      disabled={cambiandoHorario}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Volver
                    </Button>
                  </div>
                  <SelectorHorarioExistente
                    empleadoId={empleadoSeleccionado.id}
                    onSeleccionar={handleSeleccionarHorarioExistente}
                    onCrearNuevo={handleCrearNuevoHorario}
                    esCambioHorario={cambiandoHorario}
                  />
                </div>
              ) : horarioAsignado ? (
                <div className="space-y-4">
                  {/* Resumen del horario asignado */}
                  <Card className="border-green-200 dark:border-green-800">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {horarioAsignado.horarioNombre}
                            <Badge variant="outline" className="border-blue-500 text-blue-600">
                              Asignado
                            </Badge>
                            {horarioAsignado.tipoHorarioNombre && (
                              <Badge variant="outline" className="border-purple-500 text-purple-600">
                                {horarioAsignado.tipoHorarioNombre}
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">Empleado: {horarioAsignado.empleadoNombre}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCambiarHorario}
                            disabled={cambiandoHorario}
                          >
                            {cambiandoHorario ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Cambiando...
                              </>
                            ) : (
                              "Cambiar Horario"
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleEliminarHorario}
                            disabled={cambiandoHorario}
                          >
                            <Trash className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {formatearFecha(horarioAsignado.fechaInicio)}
                          </div>
                          <div className="text-xs text-muted-foreground">Fecha inicio</div>
                        </div>
                        {horarioAsignado.fechaFin && (
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-600 dark:text-red-400">
                              {formatearFecha(horarioAsignado.fechaFin)}
                            </div>
                            <div className="text-xs text-muted-foreground">Fecha fin</div>
                          </div>
                        )}
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">Activo</div>
                          <div className="text-xs text-muted-foreground">Estado</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Detalles del horario */}
                  {loadingHorario ? (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                          <span>Cargando detalles del horario...</span>
                        </div>
                      </CardContent>
                    </Card>
                  ) : horarioCompleto ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Detalles del Horario</CardTitle>
                        {horarioCompleto.descripcion && (
                          <p className="text-sm text-muted-foreground">{horarioCompleto.descripcion}</p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {calcularHorasTotales(horarioCompleto).toFixed(1)}
                            </div>
                            <div className="text-xs text-muted-foreground">Horas semanales</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {obtenerDiasActivos(horarioCompleto)}
                            </div>
                            <div className="text-xs text-muted-foreground">Días activos</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {horarioCompleto.detalles.length}
                            </div>
                            <div className="text-xs text-muted-foreground">Turnos totales</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                              {horarioCompleto.detalles.reduce((acc, d) => Math.max(acc, d.turno || 0), 0)}
                            </div>
                            <div className="text-xs text-muted-foreground">Turnos por día</div>
                          </div>
                        </div>

                        {/* Horarios por día */}
                        <div className="space-y-4">
                          <h4 className="font-medium">Horarios por día:</h4>
                          <div className="grid gap-3">
                            {horarioCompleto.detalles
                              .sort((a, b) => (a.diaSemana || 0) - (b.diaSemana || 0))
                              .map((detalle) => (
                                <div
                                  key={detalle.id}
                                  className="flex items-center justify-between p-3 border rounded-md bg-slate-50 dark:bg-slate-900"
                                >
                                  <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{obtenerNombreDia(detalle.diaSemana)}</span>
                                    {detalle.turno && (
                                      <Badge variant="outline" className="text-xs">
                                        Turno {detalle.turno}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                      {formatearHora(detalle.horaEntrada)} - {formatearHora(detalle.horaSalida)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <h4 className="font-medium mb-2">No se pudieron cargar los detalles</h4>
                        <p className="text-sm text-muted-foreground">
                          Hubo un problema al cargar los detalles del horario asignado.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium mb-2">Sin horario asignado</h3>
                  <p className="text-muted-foreground mb-4">
                    Este empleado no tiene un horario asignado. Selecciona un horario existente o crea uno
                    personalizado.
                  </p>
                  <Button onClick={handleMostrarSelector} disabled={cambiandoHorario}>
                    Asignar Horario
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">Ningún empleado seleccionado</h3>
              <p className="text-muted-foreground mb-4">Selecciona un empleado para asignar o gestionar su horario</p>
              <Button onClick={() => setDialogOpen(true)} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                Seleccionar Empleado
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <SeleccionEmpleadoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        empleados={empleadosFiltrados}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSelect={handleSeleccionarEmpleado}
      />
    </div>
  )
}