"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Eye, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

export interface BloqueHorario {
  id: string
  inicio: string
  fin: string
}

interface HorarioTableroBloqueProps {
  bloques: {
    [dia: string]: BloqueHorario[]
  }
  bloquesOcupados?: {
    [dia: string]: BloqueHorario[]
  }
  onChange: (dia: string, bloques: BloqueHorario[]) => void
}

export function HorarioTableroBloques({ bloques, bloquesOcupados = {}, onChange }: HorarioTableroBloqueProps) {
  const diasSemana = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]
  const diasSemanaDisplay = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
  const [diaActual, setDiaActual] = useState("lunes")
  const [seleccionInicio, setSeleccionInicio] = useState<string | null>(null)
  const [seleccionFin, setSeleccionFin] = useState<string | null>(null)
  const [seleccionando, setSeleccionando] = useState(false)
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false)
  const { toast } = useToast()

  // Generar horas completas para los encabezados (de 6:00 a 22:00)
  const horasCompletas = Array.from({ length: 17 }, (_, i) => {
    const hora = i + 6
    return `${hora.toString().padStart(2, "0")}:00`
  })

  // Generar intervalos de 30 minutos desde 06:00 hasta 22:30
  const intervalos = Array.from({ length: 34 }, (_, i) => {
    const hora = Math.floor(i / 2) + 6
    const minutos = i % 2 === 0 ? "00" : "30"
    return `${hora.toString().padStart(2, "0")}:${minutos}`
  })

  // Verificar si una celda está ocupada por otro horario
  const esCeldaOcupada = (dia: string, intervalo: string) => {
    const bloquesOcupadosDelDia = bloquesOcupados[dia] || []
    const [hora, minutos] = intervalo.split(":").map(Number)
    const intervaloMinutos = hora * 60 + minutos

    return bloquesOcupadosDelDia.some((bloque) => {
      const inicioHora = Number(bloque.inicio.split(":")[0])
      const inicioMinutos = Number(bloque.inicio.split(":")[1])
      const finHora = Number(bloque.fin.split(":")[0])
      const finMinutos = Number(bloque.fin.split(":")[1])

      const inicioBloque = inicioHora * 60 + inicioMinutos
      const finBloque = finHora * 60 + finMinutos

      return intervaloMinutos >= inicioBloque && intervaloMinutos < finBloque
    })
  }

  // Verificar si una celda está dentro de un bloque existente
  const esCeldaEnBloque = (dia: string, intervalo: string) => {
    const bloquesDelDia = bloques[dia] || []
    const [hora, minutos] = intervalo.split(":").map(Number)
    const intervaloMinutos = hora * 60 + minutos

    return bloquesDelDia.find((bloque) => {
      const inicioHora = Number(bloque.inicio.split(":")[0])
      const inicioMinutos = Number(bloque.inicio.split(":")[1])
      const finHora = Number(bloque.fin.split(":")[0])
      const finMinutos = Number(bloque.fin.split(":")[1])

      const inicioBloque = inicioHora * 60 + inicioMinutos
      const finBloque = finHora * 60 + finMinutos

      return intervaloMinutos >= inicioBloque && intervaloMinutos < finBloque
    })
  }

  // Verificar si una celda está en la selección actual
  const esCeldaEnSeleccion = (intervalo: string) => {
    if (!seleccionInicio) return false

    const inicio = seleccionInicio
    const fin = seleccionFin || seleccionInicio

    const [horaInicio, minutosInicio] = inicio.split(":").map(Number)
    const [horaFin, minutosFin] = fin.split(":").map(Number)
    const [horaIntervalo, minutosIntervalo] = intervalo.split(":").map(Number)

    const inicioMinutos = horaInicio * 60 + minutosInicio
    const finMinutos = horaFin * 60 + minutosFin
    const intervaloMinutos = horaIntervalo * 60 + minutosIntervalo

    const minInicio = Math.min(inicioMinutos, finMinutos)
    const maxFin = Math.max(inicioMinutos, finMinutos)

    return intervaloMinutos >= minInicio && intervaloMinutos <= maxFin
  }

  // Verificar si un nuevo bloque se sobrepone con bloques existentes
  const verificarSobreposicion = (inicio: string, fin: string) => {
    const bloquesDelDia = bloques[diaActual] || []

    // Convertir horas a minutos para facilitar la comparación
    const convertirAMinutos = (hora: string): number => {
      const [h, m] = hora.split(":").map(Number)
      return h * 60 + m
    }

    const nuevoInicio = convertirAMinutos(inicio)
    const nuevoFin = convertirAMinutos(fin) + 30 // Añadir 30 minutos porque fin es el inicio del último intervalo

    // Verificar si hay sobreposición con algún bloque existente
    return bloquesDelDia.some((bloque) => {
      const bloqueInicio = convertirAMinutos(bloque.inicio)
      const bloqueFin = convertirAMinutos(bloque.fin)

      // Hay sobreposición si:
      // (nuevoInicio está entre bloqueInicio y bloqueFin) O
      // (nuevoFin está entre bloqueInicio y bloqueFin) O
      // (nuevoInicio <= bloqueInicio Y nuevoFin >= bloqueFin)
      return (
        (nuevoInicio >= bloqueInicio && nuevoInicio < bloqueFin) ||
        (nuevoFin > bloqueInicio && nuevoFin <= bloqueFin) ||
        (nuevoInicio <= bloqueInicio && nuevoFin >= bloqueFin)
      )
    })
  }

  // Manejar clic en una celda
  const handleCeldaClick = (intervalo: string) => {
    // Si la celda está ocupada por otro horario, no permitir selección
    if (esCeldaOcupada(diaActual, intervalo)) return

    if (!seleccionando) {
      // Iniciar nueva selección
      setSeleccionInicio(intervalo)
      setSeleccionFin(null)
      setSeleccionando(true)
    } else {
      // Finalizar selección
      setSeleccionFin(intervalo)
      setSeleccionando(false)
    }
  }

  // Agregar el bloque seleccionado
  const agregarBloque = () => {
    if (!seleccionInicio) return

    const inicio = seleccionInicio
    const fin = seleccionFin || seleccionInicio

    // Asegurar que inicio sea menor que fin
    const [horaInicio, minutosInicio] = inicio.split(":").map(Number)
    const [horaFin, minutosFin] = fin.split(":").map(Number)

    const inicioMinutos = horaInicio * 60 + minutosInicio
    const finMinutos = horaFin * 60 + minutosFin

    let bloqueInicio, bloqueFin

    if (inicioMinutos <= finMinutos) {
      bloqueInicio = inicio
      // Agregar 30 minutos al fin para que sea el final del intervalo
      const finAjustado = finMinutos + 30
      bloqueFin = `${Math.floor(finAjustado / 60)
        .toString()
        .padStart(2, "0")}:${finAjustado % 60 === 0 ? "00" : "30"}`
    } else {
      bloqueInicio = fin
      // Agregar 30 minutos al inicio para que sea el final del intervalo
      const finAjustado = inicioMinutos + 30
      bloqueFin = `${Math.floor(finAjustado / 60)
        .toString()
        .padStart(2, "0")}:${finAjustado % 60 === 0 ? "00" : "30"}`
    }

    // Verificar si el nuevo bloque se sobrepone con alguno existente
    if (verificarSobreposicion(bloqueInicio, bloqueFin)) {
      toast({
        title: "Error en el horario",
        description: "No se puede agregar este bloque porque se sobrepone con otro ya existente.",
        variant: "destructive",
      })
      cancelarSeleccion()
      return
    }

    const nuevoBloque: BloqueHorario = {
      id: `${Date.now()}-${Math.random()}`,
      inicio: bloqueInicio,
      fin: bloqueFin,
    }

    const bloquesActuales = bloques[diaActual] || []
    onChange(diaActual, [...bloquesActuales, nuevoBloque])

    // Limpiar selección
    setSeleccionInicio(null)
    setSeleccionFin(null)
    setSeleccionando(false)
  }

  // Cancelar selección
  const cancelarSeleccion = () => {
    setSeleccionInicio(null)
    setSeleccionFin(null)
    setSeleccionando(false)
  }

  // Eliminar un bloque específico
  const eliminarBloque = (bloqueId: string) => {
    const bloquesActuales = bloques[diaActual] || []
    const nuevosBloque = bloquesActuales.filter((bloque) => bloque.id !== bloqueId)
    onChange(diaActual, nuevosBloque)
  }

  // Limpiar todos los bloques del día
  const limpiarBloques = () => {
    onChange(diaActual, [])
    cancelarSeleccion()
  }

  // Cambiar el día actual
  const handleDiaChange = (dia: string) => {
    setDiaActual(dia)
    cancelarSeleccion()
  }

  // Calcular horas por día
  const calcularHorasPorDia = (dia: string) => {
    const bloquesDelDia = bloques[dia] || []
    let totalMinutos = 0

    bloquesDelDia.forEach((bloque) => {
      const [horaInicio, minutosInicio] = bloque.inicio.split(":").map(Number)
      const [horaFin, minutosFin] = bloque.fin.split(":").map(Number)

      const inicioMinutos = horaInicio * 60 + minutosInicio
      const finMinutos = horaFin * 60 + minutosFin

      totalMinutos += finMinutos - inicioMinutos
    })

    return totalMinutos / 60
  }

  // Calcular total de horas semanales
  const calcularTotalHoras = () => {
    return diasSemana.reduce((total, dia) => total + calcularHorasPorDia(dia), 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Selector de Horarios por Bloques</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={limpiarBloques}>
            <Trash2 className="h-4 w-4 mr-1" /> Limpiar Día
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMostrarVistaPrevia(!mostrarVistaPrevia)}>
            <Eye className="h-4 w-4 mr-1" /> {mostrarVistaPrevia ? "Ocultar Vista Previa" : "Vista Previa"}
          </Button>
        </div>
      </div>

      {/* Selector de días */}
      <div className="flex flex-wrap gap-2 mb-4">
        {diasSemana.map((dia, index) => (
          <Button
            key={dia}
            variant={diaActual === dia ? "default" : "outline"}
            size="sm"
            onClick={() => handleDiaChange(dia)}
          >
            {diasSemanaDisplay[index]}
            {bloques[dia] && bloques[dia].length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {bloques[dia].length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Controles de selección */}
      {(seleccionInicio || seleccionando) && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Seleccionando bloque</h4>
                <p className="text-sm text-muted-foreground">
                  {seleccionInicio && seleccionFin
                    ? `${seleccionInicio} - ${seleccionFin}`
                    : seleccionInicio
                      ? `Inicio: ${seleccionInicio} (haz clic en otra celda para finalizar)`
                      : "Selecciona el inicio del bloque"}
                </p>
              </div>
              <div className="flex gap-2">
                {seleccionInicio && seleccionFin && (
                  <Button size="sm" onClick={agregarBloque}>
                    <Plus className="h-4 w-4 mr-1" /> Agregar Bloque
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={cancelarSeleccion}>
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr>
                <th className="bg-slate-100 dark:bg-slate-800 p-2 border-b border-r text-center font-medium min-w-[80px]">
                  {diasSemanaDisplay[diasSemana.indexOf(diaActual)]}
                </th>
                {horasCompletas.map((hora) => (
                  <th
                    key={hora}
                    className="bg-slate-100 dark:bg-slate-800 p-2 border-b border-r text-center text-xs font-medium min-w-[60px]"
                    colSpan={2}
                  >
                    {hora}
                  </th>
                ))}
              </tr>
              <tr>
                <th className="bg-slate-50 dark:bg-slate-900 p-1 border-b border-r text-center text-xs">Intervalos</th>
                {horasCompletas.map((hora) => (
                  <React.Fragment key={`sub-${hora}`}>
                    <th className="bg-slate-50 dark:bg-slate-900 p-1 border-b border-r text-center text-xs min-w-[30px]">
                      :00
                    </th>
                    <th className="bg-slate-50 dark:bg-slate-900 p-1 border-b border-r text-center text-xs min-w-[30px]">
                      :30
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="bg-slate-50 dark:bg-slate-900 p-2 border-b border-r text-center font-medium">Horario</td>
                {intervalos.map((intervalo) => {
                  const isEnBloque = esCeldaEnBloque(diaActual, intervalo)
                  const isOcupado = esCeldaOcupada(diaActual, intervalo)
                  const isEnSeleccion = esCeldaEnSeleccion(intervalo)

                  return (
                    <td
                      key={intervalo}
                      className={cn(
                        "border-r border-b cursor-pointer transition-colors text-center",
                        "h-12 w-8 min-w-[30px]",
                        isEnBloque
                          ? "bg-green-200 dark:bg-green-900"
                          : isEnSeleccion
                            ? "bg-blue-200 dark:bg-blue-900"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800",
                        isOcupado && "bg-red-100 dark:bg-red-900/30 cursor-not-allowed",
                      )}
                      onClick={() => handleCeldaClick(intervalo)}
                      title={`${intervalo} - ${diasSemanaDisplay[diasSemana.indexOf(diaActual)]}`}
                    >
                      {isEnBloque && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
                        </div>
                      )}
                      {isEnSeleccion && !isEnBloque && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                        </div>
                      )}
                      {isOcupado && !isEnBloque && (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-red-600 dark:text-red-400 text-xs font-bold">X</span>
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bloques del día actual */}
      {bloques[diaActual] && bloques[diaActual].length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Bloques configurados para {diasSemanaDisplay[diasSemana.indexOf(diaActual)]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {bloques[diaActual].map((bloque, index) => (
                <div
                  key={bloque.id}
                  className="flex items-center justify-between p-3 border rounded-md bg-green-50 dark:bg-green-950"
                >
                  <div>
                    <div className="font-medium">Bloque {index + 1}</div>
                    <div className="text-sm text-muted-foreground">
                      {bloque.inicio} - {bloque.fin}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => eliminarBloque(bloque.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-200 dark:bg-green-900 border border-green-400 dark:border-green-600 rounded-sm flex items-center justify-center">
            <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
          </div>
          <span>Bloque configurado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-200 dark:bg-blue-900 border border-blue-400 dark:border-blue-600 rounded-sm flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
          </div>
          <span>Selección actual</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-600 rounded-sm flex items-center justify-center">
            <span className="text-red-600 dark:text-red-400 text-xs font-bold">X</span>
          </div>
          <span>Horario ocupado (conflicto)</span>
        </div>
        <div className="ml-auto text-sm text-muted-foreground">
          Horas del día: <span className="font-medium">{calcularHorasPorDia(diaActual).toFixed(1)}</span>
        </div>
      </div>

      {mostrarVistaPrevia && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Horarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Horas por día</h4>
                <div className="space-y-2">
                  {diasSemana.map((dia, index) => (
                    <div key={dia} className="flex justify-between items-center border-b pb-1">
                      <span>{diasSemanaDisplay[index]}</span>
                      <span className="font-medium">{calcularHorasPorDia(dia).toFixed(1)} horas</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-1 font-bold">
                    <span>Total Semanal</span>
                    <span>{calcularTotalHoras().toFixed(1)} horas</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Bloques por día</h4>
                <div className="space-y-2">
                  {diasSemana.map((dia, index) => (
                    <div key={dia} className="flex justify-between items-center border-b pb-1">
                      <span>{diasSemanaDisplay[index]}</span>
                      <span className="font-medium">{bloques[dia]?.length || 0} bloques</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
