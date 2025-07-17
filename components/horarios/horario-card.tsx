"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon, ChevronDown, ChevronUp, Edit, Save, Trash, X } from "lucide-react"
import type { Horario } from "./horarios-manager"
import { HorarioTableroBloques } from "./horario-tablero-bloques"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ReglasAsistenciaSelector } from "../asignacion-horarios/reglas-asistencia-selector"

interface HorarioCardProps {
  horario: Horario
  onSave: (horario: Horario) => void
  onCancel: () => void
  onEdit: () => void
  onDelete: () => void
}

export function HorarioCard({ horario, onSave, onCancel, onEdit, onDelete }: HorarioCardProps) {
  const [editedHorario, setEditedHorario] = useState<Horario>({ ...horario })
  const [expanded, setExpanded] = useState(horario.isEditing || horario.isNew)
  const [horasTotales, setHorasTotales] = useState<{ [key: string]: number }>({})

  // Actualizar el estado local cuando cambia el horario
  useEffect(() => {
    setEditedHorario({ ...horario })
    setExpanded(horario.isEditing || horario.isNew)
  }, [horario])

  // Calcular horas totales por día y total semanal
  useEffect(() => {
    const horas: { [key: string]: number } = {
      lunes: 0,
      martes: 0,
      miercoles: 0,
      jueves: 0,
      viernes: 0,
      sabado: 0,
      domingo: 0,
      total: 0,
    }

    Object.entries(editedHorario.bloques).forEach(([dia, bloques]) => {
      let horasDia = 0
      bloques.forEach((bloque) => {
        const inicio = bloque.inicio.split(":")
        const fin = bloque.fin.split(":")
        const inicioMinutos = Number.parseInt(inicio[0]) * 60 + Number.parseInt(inicio[1])
        const finMinutos = Number.parseInt(fin[0]) * 60 + Number.parseInt(fin[1])
        horasDia += (finMinutos - inicioMinutos) / 60
      })
      horas[dia] = horasDia
      horas.total += horasDia
    })

    setHorasTotales(horas)
  }, [editedHorario.bloques])

  const handleInputChange = (field: keyof Horario, value: any) => {
    setEditedHorario({
      ...editedHorario,
      [field]: value,
    })
  }

  const handleBloquesChange = (dia: string, bloques: any[]) => {
    setEditedHorario({
      ...editedHorario,
      bloques: {
        ...editedHorario.bloques,
        [dia]: bloques,
      },
    })
  }

  const handleSave = () => {
    // Validar que tenga nombre
    if (!editedHorario.nombre.trim()) {
      alert("El nombre del horario es obligatorio")
      return
    }

    // Validar que tenga al menos un bloque
    const tieneAlgunBloque = Object.values(editedHorario.bloques).some((bloques) => bloques.length > 0)
    if (!tieneAlgunBloque) {
      alert("Debe definir al menos un bloque de horario")
      return
    }

    onSave(editedHorario)
  }

  const toggleExpanded = () => {
    if (horario.isEditing) return // No permitir contraer si está en edición
    setExpanded(!expanded)
  }

  // Formatear días para mostrar
  const diasSemanaDisplay = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
  const diasSemana = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]

  // Obtener el rango de horas para mostrar en el resumen
  const obtenerRangoHorario = (dia: string) => {
    const bloques = editedHorario.bloques[dia]
    if (!bloques || bloques.length === 0) return "No definido"

    // Encontrar la hora más temprana y la más tardía
    let horaInicio = "23:59"
    let horaFin = "00:00"

    bloques.forEach((bloque) => {
      if (bloque.inicio < horaInicio) horaInicio = bloque.inicio
      if (bloque.fin > horaFin) horaFin = bloque.fin
    })

    return `${horaInicio} - ${horaFin}`
  }

  return (
    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {horario.isEditing ? (
              <Input
                value={editedHorario.nombre}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
                placeholder="Nombre del horario"
                className="font-bold text-lg"
              />
            ) : (
              <CardTitle>{horario.nombre || "Nuevo Horario"}</CardTitle>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!horario.isEditing && !horario.isNew && (
              <>
                <Button variant="ghost" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onDelete}>
                  <Trash className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={toggleExpanded}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-4">
          {horario.isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción</label>
                <Textarea
                  value={editedHorario.descripcion}
                  onChange={(e) => handleInputChange("descripcion", e.target.value)}
                  placeholder="Descripción del horario"
                  className="resize-none"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Inicio de Vigencia</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editedHorario.inicioVigencia && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editedHorario.inicioVigencia
                          ? format(editedHorario.inicioVigencia, "PPP", { locale: es })
                          : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editedHorario.inicioVigencia}
                        onSelect={(date) => handleInputChange("inicioVigencia", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Fin de Vigencia</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editedHorario.finVigencia && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editedHorario.finVigencia
                          ? format(editedHorario.finVigencia, "PPP", { locale: es })
                          : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editedHorario.finVigencia}
                        onSelect={(date) => handleInputChange("finVigencia", date)}
                        disabled={(date) =>
                          date < editedHorario.inicioVigencia || date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h4 className="font-medium">Reglas de Asistencia</h4>
                <ReglasAsistenciaSelector
                  reglaSeleccionada={editedHorario.reglaAsistencia}
                  onReglaChange={(regla) => handleInputChange("reglaAsistencia", regla)}
                />
              </div>

              <div className="pt-4">
                <h3 className="text-lg font-medium mb-4">Configuración de Horarios por Día</h3>
                <HorarioTableroBloques bloques={editedHorario.bloques} onChange={handleBloquesChange} />
              </div>

              <div className="pt-4">
                <h3 className="text-lg font-medium mb-2">Resumen de Horas</h3>
                <div className="grid grid-cols-4 gap-2">
                  {diasSemana.map((dia, index) => (
                    <div key={dia} className="border rounded-md p-2">
                      <div className="font-medium">{diasSemanaDisplay[index]}</div>
                      <div className="text-sm text-muted-foreground">{horasTotales[dia] || 0} horas</div>
                    </div>
                  ))}
                  <div className="border rounded-md p-2 bg-slate-50 dark:bg-slate-800">
                    <div className="font-medium">Total Semanal</div>
                    <div className="text-sm font-bold">{horasTotales.total || 0} horas</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{editedHorario.descripcion}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  Vigencia: {format(editedHorario.inicioVigencia, "dd/MM/yyyy")} -{" "}
                  {format(editedHorario.finVigencia, "dd/MM/yyyy")}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  Total: {horasTotales.total || 0} horas semanales
                </Badge>
                {editedHorario.reglaAsistencia && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Regla:{" "}
                    {editedHorario.reglaAsistencia.charAt(0).toUpperCase() + editedHorario.reglaAsistencia.slice(1)}
                  </Badge>
                )}
              </div>

              <div className="pt-2">
                <h3 className="text-sm font-medium mb-2">Horarios por Día</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {diasSemana.map((dia, index) => {
                    const tieneHorario = editedHorario.bloques[dia] && editedHorario.bloques[dia].length > 0
                    return (
                      <div
                        key={dia}
                        className={cn(
                          "border rounded-md p-2",
                          tieneHorario ? "border-green-200 dark:border-green-800" : "",
                        )}
                      >
                        <div className="font-medium">{diasSemanaDisplay[index]}</div>
                        <div className="text-sm text-muted-foreground">
                          {tieneHorario ? obtenerRangoHorario(dia) : "No definido"}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}

      {horario.isEditing && (
        <CardFooter className="flex justify-end gap-2 pt-0">
          <Button variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Guardar Horario
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
