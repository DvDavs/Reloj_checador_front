"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Clock,
  Calendar,
  CheckCircle,
  Plus,
  AlertTriangle,
  Loader2,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import axios from "axios"
import type { HorarioDto, TipoHorarioDto, HorarioAsignadoCreateDto, HorarioAsignadoDto } from "../types/backend-types"

interface SelectorHorarioExistenteProps {
  empleadoId?: number // ID del empleado al que se asignará el horario
  onSeleccionar: (horario: HorarioDto, asignacion?: HorarioAsignadoDto) => void
  onCrearNuevo: () => void
  esCambioHorario?: boolean // Indica si es un cambio de horario
}

export function SelectorHorarioExistente({
  empleadoId,
  onSeleccionar,
  onCrearNuevo,
  esCambioHorario = false,
}: SelectorHorarioExistenteProps) {
  const [horarioSeleccionado, setHorarioSeleccionado] = useState<number | null>(null)
  const [horariosDisponibles, setHorariosDisponibles] = useState<HorarioDto[]>([])
  const [tiposHorario, setTiposHorario] = useState<TipoHorarioDto[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTipos, setLoadingTipos] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [asignando, setAsignando] = useState(false)
  const [fechaInicio, setFechaInicio] = useState<string>(new Date().toISOString().split("T")[0])
  const [fechaFin, setFechaFin] = useState<string>("")
  const [tipoHorarioSeleccionado, setTipoHorarioSeleccionado] = useState<number | null>(null)

  // Estados para búsqueda y paginación
  const [terminoBusqueda, setTerminoBusqueda] = useState<string>("")
  const [paginaActual, setPaginaActual] = useState<number>(1)
  const elementosPorPagina = 3

  // API Base URL para las peticiones
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

  // Cargar horarios disponibles al montar el componente
  useEffect(() => {
    fetchHorariosDisponibles()
  }, [])

  // Cargar tipos de horario cuando se selecciona un horario y hay empleadoId
  useEffect(() => {
    if (horarioSeleccionado && empleadoId) {
      fetchTiposHorario()
    }
  }, [horarioSeleccionado, empleadoId])

  // Resetear página cuando cambia el término de búsqueda
  useEffect(() => {
    setPaginaActual(1)
  }, [terminoBusqueda])

  const fetchHorariosDisponibles = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await axios.get<HorarioDto[]>(`${API_BASE_URL}/api/horarios`)

      // Validar que la respuesta sea un array
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("La respuesta del servidor no es válida")
      }

      setHorariosDisponibles(response.data)
      console.log("Horarios cargados:", response.data)
    } catch (error: any) {
      console.error("Error al cargar horarios:", error)
      setError(`Error al cargar horarios: ${error.response?.data?.mensaje || error.message}`)
      setHorariosDisponibles([]) // Asegurar que siempre sea un array
    } finally {
      setLoading(false)
    }
  }

  const fetchTiposHorario = async () => {
    try {
      setLoadingTipos(true)

      // Asumiendo que existe un endpoint para tipos de horario
      const response = await axios.get<TipoHorarioDto[]>(`${API_BASE_URL}/api/tipos-horario`)
      setTiposHorario(response.data)

      // Si solo hay un tipo, seleccionarlo automáticamente
      if (response.data.length === 1) {
        setTipoHorarioSeleccionado(response.data[0].id)
      }

      console.log("Tipos de horario cargados:", response.data)
    } catch (error: any) {
      console.error("Error al cargar tipos de horario:", error)
      // Si no existe el endpoint, crear tipos por defecto
      const tiposDefault: TipoHorarioDto[] = [
        {
          id: 1,
          nombre: "Mixto",
          descripcion: "Horario mixto de trabajo",
          color: "#3b82f6",
        },
        {
          id: 2,
          nombre: "Base",
          descripcion: "Horario base de trabajo",
          color: "#10b981",
        },
        {
          id: 3,
          nombre: "Honorarios",
          descripcion: "Horario para honorarios de trabajo",
          color: "#8b5cf6",
        },
        {
          id: 4,
          nombre: "Interinato",
          descripcion: "Horario para interinatos de trabajo",
          color: "#8c5cg6",
        },
      ]
      setTiposHorario(tiposDefault)
      setTipoHorarioSeleccionado(1) // Seleccionar el primero por defecto
    } finally {
      setLoadingTipos(false)
    }
  }

  // Filtrar horarios por término de búsqueda
  const horariosFiltrados = useMemo(() => {
    if (!Array.isArray(horariosDisponibles)) return []

    return horariosDisponibles
      .filter((horario) => horario && horario.id && horario.nombre) // Filtrar horarios válidos
      .filter((horario) => {
        if (!terminoBusqueda.trim()) return true

        const termino = terminoBusqueda.toLowerCase().trim()
        const nombre = horario.nombre?.toLowerCase() || ""
        const descripcion = horario.descripcion?.toLowerCase() || ""

        return nombre.includes(termino) || descripcion.includes(termino)
      })
  }, [horariosDisponibles, terminoBusqueda])

  // Calcular paginación
  const totalPaginas = Math.ceil(horariosFiltrados.length / elementosPorPagina)
  const indiceInicio = (paginaActual - 1) * elementosPorPagina
  const indiceFin = indiceInicio + elementosPorPagina
  const horariosPaginados = horariosFiltrados.slice(indiceInicio, indiceFin)

  const handleSeleccionar = (horario: HorarioDto) => {
    setHorarioSeleccionado(horario.id)
    // Resetear tipo de horario seleccionado cuando se cambia de horario
    setTipoHorarioSeleccionado(null)
  }

  const handleConfirmarSeleccion = async () => {
    const horario = horariosFiltrados.find((h) => h.id === horarioSeleccionado)
    if (!horario) return

    // Si no hay empleadoId, solo devolver el horario seleccionado
    if (!empleadoId) {
      onSeleccionar(horario)
      return
    }

    // Validar que se haya seleccionado un tipo de horario
    if (!tipoHorarioSeleccionado) {
      setError("Debe seleccionar un tipo de horario")
      return
    }

    try {
      setAsignando(true)
      setError(null)

      // Crear el DTO para asignar el horario
      const asignacionDto: HorarioAsignadoCreateDto = {
        empleadoId: empleadoId,
        horarioId: horario.id,
        tipoHorarioId: tipoHorarioSeleccionado,
        fechaInicio: fechaInicio,
        fechaFin: fechaFin || null,
      }

      console.log("Enviando asignación:", asignacionDto)

      // Asignar el horario al empleado usando POST
      const response = await axios.post<HorarioAsignadoDto>(`${API_BASE_URL}/api/horarios-asignados`, asignacionDto)

      console.log("Horario asignado exitosamente:", response.data)

      // Llamar al callback con el horario y la asignación
      onSeleccionar(horario, response.data)
    } catch (error: any) {
      console.error("Error al asignar horario:", error)
      const errorMessage =
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        error.message ||
        "Error desconocido al asignar horario"
      setError(`Error al asignar horario: ${errorMessage}`)
    } finally {
      setAsignando(false)
    }
  }

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

  const obtenerNombreDia = (diaSemana: number): string => {
    const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    return dias[diaSemana] || `Día ${diaSemana}`
  }

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

  const handlePaginaAnterior = () => {
    setPaginaActual((prev) => Math.max(1, prev - 1))
  }

  const handlePaginaSiguiente = () => {
    setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))
  }

  const limpiarBusqueda = () => {
    setTerminoBusqueda("")
    setPaginaActual(1)
  }

  // Verificar si se puede confirmar la selección
  const puedeConfirmar = horarioSeleccionado && (!empleadoId || tipoHorarioSeleccionado)

  // Mostrar loading
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {esCambioHorario ? "Seleccionar Nuevo Horario" : "Seleccionar Horario"}
          </h3>
        </div>

        <div className="flex items-center justify-center p-8">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-lg">Cargando horarios disponibles...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!Array.isArray(horariosDisponibles)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {esCambioHorario ? "Seleccionar Nuevo Horario" : "Seleccionar Horario"}
          </h3>
        </div>
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>Error al cargar los datos. Por favor, recarga la página.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{esCambioHorario ? "Seleccionar Nuevo Horario" : "Seleccionar Horario"}</h3>
        <Button onClick={fetchHorariosDisponibles} variant="outline" size="sm">
          Actualizar
        </Button>
      </div>

      {/* Alerta específica para cambio de horario */}
      {esCambioHorario ? (
        <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>Cambio de horario:</strong> El horario anterior ha sido desactivado. Selecciona el nuevo horario que
            se asignará al empleado.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Al seleccionar un horario existente, se asignará al empleado. Si necesitas modificarlo, se creará una
            versión personalizada sin afectar el horario original.
          </AlertDescription>
        </Alert>
      )}

      {/* Mostrar error si existe */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {horariosDisponibles.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <h4 className="font-medium mb-2">No hay horarios disponibles</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Crea tu primer horario para poder asignarlo al personal
            </p>
            <Button onClick={onCrearNuevo}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Horario
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Buscador */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar horarios por nombre o descripción..."
                value={terminoBusqueda}
                onChange={(e) => setTerminoBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
            {terminoBusqueda && (
              <Button variant="outline" onClick={limpiarBusqueda}>
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Información de resultados */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {horariosFiltrados.length === 0
                ? "No se encontraron horarios"
                : `${horariosFiltrados.length} horario${horariosFiltrados.length !== 1 ? "s" : ""} encontrado${horariosFiltrados.length !== 1 ? "s" : ""}`}
              {terminoBusqueda && ` para "${terminoBusqueda}"`}
            </span>
            {totalPaginas > 1 && (
              <span>
                Página {paginaActual} de {totalPaginas}
              </span>
            )}
          </div>

          {horariosFiltrados.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <h4 className="font-medium mb-2">No se encontraron horarios</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {terminoBusqueda
                    ? `No hay horarios que coincidan con "${terminoBusqueda}"`
                    : "No hay horarios disponibles"}
                </p>
                <div className="flex gap-2 justify-center">
                  {terminoBusqueda && (
                    <Button variant="outline" onClick={limpiarBusqueda}>
                      Limpiar búsqueda
                    </Button>
                  )}
                  <Button onClick={onCrearNuevo}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Nuevo Horario
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Grid de horarios paginados */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {horariosPaginados.map((horario) => {
                  const estaSeleccionado = horarioSeleccionado === horario.id
                  const horasTotales = calcularHorasTotales(horario)
                  const diasActivos = obtenerDiasActivos(horario)

                  return (
                    <Card
                      key={horario.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-md",
                        estaSeleccionado && "ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900",
                      )}
                      onClick={() => handleSeleccionar(horario)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{horario.nombre}</CardTitle>
                          {estaSeleccionado && <CheckCircle className="h-5 w-5 text-blue-500" />}
                        </div>
                        {horario.descripcion && <p className="text-sm text-muted-foreground">{horario.descripcion}</p>}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{horasTotales.toFixed(1)} horas semanales</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{diasActivos} días activos</span>
                          </div>

                          {/* Mostrar detalles de horarios */}
                          <div className="space-y-1">
                            {(horario.detalles || [])
                              .filter((detalle) => detalle && detalle.horaEntrada && detalle.horaSalida) // Filtrar detalles válidos
                              .sort((a, b) => (a.diaSemana || 0) - (b.diaSemana || 0))
                              .slice(0, 3) // Mostrar solo los primeros 3
                              .map((detalle) => (
                                <div
                                  key={detalle.id || Math.random()}
                                  className="text-xs text-muted-foreground flex justify-between"
                                >
                                  <span>{obtenerNombreDia(detalle.diaSemana)}</span>
                                  <span>
                                    {formatearHora(detalle.horaEntrada)} - {formatearHora(detalle.horaSalida)}
                                    {detalle.turno && ` (T${detalle.turno})`}
                                  </span>
                                </div>
                              ))}
                            {(horario.detalles || []).length > 3 && (
                              <div className="text-xs text-muted-foreground text-center">
                                +{horario.detalles.length - 3} más...
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">
                              Original
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {horario.detalles.length} turnos
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Controles de paginación */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={handlePaginaAnterior} disabled={paginaActual === 1}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                      <Button
                        key={pagina}
                        variant={pagina === paginaActual ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPaginaActual(pagina)}
                        className="w-8 h-8 p-0"
                      >
                        {pagina}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePaginaSiguiente}
                    disabled={paginaActual === totalPaginas}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Formulario de configuración si hay empleadoId */}
          {horarioSeleccionado && empleadoId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {esCambioHorario ? "Configurar Nuevo Horario" : "Configurar Asignación"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selector de tipo de horario */}
                <div>
                  <label htmlFor="tipoHorario" className="block text-sm font-medium mb-1">
                    Tipo de Horario *
                  </label>
                  {loadingTipos ? (
                    <div className="flex items-center gap-2 p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Cargando tipos...</span>
                    </div>
                  ) : (
                    <Select
                      value={tipoHorarioSeleccionado?.toString() || ""}
                      onValueChange={(value) => setTipoHorarioSeleccionado(Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo de horario" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposHorario.map((tipo) => (
                          <SelectItem key={tipo.id} value={tipo.id.toString()}>
                            <div className="flex items-center gap-2">
                              {tipo.color && (
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tipo.color }} />
                              )}
                              <span>{tipo.nombre}</span>
                              {tipo.descripcion && (
                                <span className="text-xs text-muted-foreground">- {tipo.descripcion}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Fechas */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fechaInicio" className="block text-sm font-medium mb-1">
                      Fecha de Inicio *
                    </label>
                    <input
                      type="date"
                      id="fechaInicio"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="fechaFin" className="block text-sm font-medium mb-1">
                      Fecha de Fin (Opcional)
                    </label>
                    <input
                      type="date"
                      id="fechaFin"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      min={fechaInicio}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {horarioSeleccionado && (
            <div className="flex justify-center pt-4">
              <Button onClick={handleConfirmarSeleccion} size="lg" disabled={asignando || !puedeConfirmar}>
                {asignando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {empleadoId ? "Asignando..." : "Seleccionando..."}
                  </>
                ) : empleadoId ? (
                  esCambioHorario ? (
                    "Asignar Nuevo Horario"
                  ) : (
                    "Asignar Horario Seleccionado"
                  )
                ) : (
                  "Seleccionar Horario"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
