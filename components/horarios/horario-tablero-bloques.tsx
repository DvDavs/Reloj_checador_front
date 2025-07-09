"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Eye, Plus, X, Moon, Sun, Sunset, Sunrise, Merge } from "lucide-react"
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

  // Generar horas completas para los encabezados (24 horas: 00:00 a 23:00)
  const horasCompletas = Array.from({ length: 24 }, (_, i) => {
    return `${i.toString().padStart(2, "0")}:00`
  })

  // Generar intervalos de 30 minutos desde 00:00 hasta 23:30
  const intervalos = Array.from({ length: 48 }, (_, i) => {
    const hora = Math.floor(i / 2)
    const minutos = i % 2 === 0 ? "00" : "30"
    return `${hora.toString().padStart(2, "0")}:${minutos}`
  })

  // Función para obtener el período del día y su icono
  const obtenerPeriodoDelDia = (hora: number) => {
    if (hora >= 0 && hora < 6) {
      return { periodo: "Madrugada", icon: Moon, color: "text-indigo-600 dark:text-indigo-400" }
    } else if (hora >= 6 && hora < 12) {
      return { periodo: "Mañana", icon: Sunrise, color: "text-orange-600 dark:text-orange-400" }
    } else if (hora >= 12 && hora < 18) {
      return { periodo: "Tarde", icon: Sun, color: "text-yellow-600 dark:text-yellow-400" }
    } else {
      return { periodo: "Noche", icon: Sunset, color: "text-purple-600 dark:text-purple-400" }
    }
  }

  // Función para convertir hora a minutos para comparación
  const convertirHoraAMinutos = (hora: string): number => {
    const [h, m] = hora.split(":").map(Number)
    return h * 60 + m
  }

  // Función para ordenar bloques por hora de inicio
  const ordenarBloquesPorHora = (bloques: BloqueHorario[]): BloqueHorario[] => {
    return [...bloques].sort((a, b) => {
      const minutosA = convertirHoraAMinutos(a.inicio)
      const minutosB = convertirHoraAMinutos(b.inicio)
      return minutosA - minutosB
    })
  }

  // ✅ NUEVA FUNCIÓN: Fusionar bloques contiguos automáticamente
  const fusionarBloquesContiguos = (bloquesOriginales: BloqueHorario[]): BloqueHorario[] => {
    if (bloquesOriginales.length <= 1) return bloquesOriginales

    // Ordenar bloques por hora de inicio
    const bloquesOrdenados = ordenarBloquesPorHora(bloquesOriginales)
    const bloquesFusionados: BloqueHorario[] = []

    let bloqueActual = { ...bloquesOrdenados[0] }

    for (let i = 1; i < bloquesOrdenados.length; i++) {
      const siguienteBloque = bloquesOrdenados[i]

      // Verificar si el bloque actual termina exactamente donde empieza el siguiente
      if (bloqueActual.fin === siguienteBloque.inicio) {
        // Fusionar: extender el fin del bloque actual
        bloqueActual.fin = siguienteBloque.fin
        // Mantener el ID del primer bloque pero podríamos generar uno nuevo
        bloqueActual.id = `fusionado-${Date.now()}-${Math.random()}`
      } else {
        // No son contiguos, agregar el bloque actual y continuar con el siguiente
        bloquesFusionados.push(bloqueActual)
        bloqueActual = { ...siguienteBloque }
      }
    }

    // Agregar el último bloque
    bloquesFusionados.push(bloqueActual)

    return bloquesFusionados
  }

  // ✅ FUNCIÓN MEJORADA: Aplicar fusión después de agregar/modificar bloques
  const aplicarCambiosConFusion = (dia: string, nuevosBloque: BloqueHorario[]) => {
    const bloquesFusionados = fusionarBloquesContiguos(nuevosBloque)

    // Verificar si hubo fusión
    const huboFusion = nuevosBloque.length !== bloquesFusionados.length

    if (huboFusion) {
      const bloquesEliminados = nuevosBloque.length - bloquesFusionados.length
      toast({
        title: "Bloques fusionados automáticamente",
        description: `Se fusionaron ${bloquesEliminados + 1} bloques contiguos en ${bloquesFusionados.length} bloque${bloquesFusionados.length > 1 ? "s" : ""}.`,
        duration: 3000,
      })
    }

    onChange(dia, bloquesFusionados)
  }

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

  // Verificar sobreposición real (no adyacencia)
  const verificarSobreposicion = (inicio: string, fin: string) => {
    const bloquesDelDia = bloques[diaActual] || []

    const convertirAMinutos = (hora: string): number => {
      const [h, m] = hora.split(":").map(Number)
      return h * 60 + m
    }

    const nuevoInicio = convertirAMinutos(inicio)
    const nuevoFin = convertirAMinutos(fin)

    // Verificar si hay sobreposición REAL con algún bloque existente
    return bloquesDelDia.some((bloque) => {
      const bloqueInicio = convertirAMinutos(bloque.inicio)
      const bloqueFin = convertirAMinutos(bloque.fin)

      // Solo hay sobreposición si hay intersección real, no si son adyacentes
      const hayInterseccion = nuevoInicio < bloqueFin && nuevoFin > bloqueInicio
      const sonAdyacentes = nuevoInicio === bloqueFin || nuevoFin === bloqueInicio

      // Solo es sobreposición si hay intersección pero NO son adyacentes
      return hayInterseccion && !sonAdyacentes
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

  // ✅ FUNCIÓN MEJORADA: Agregar bloque con fusión automática
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
      const siguienteIntervalo = finMinutos + 30
      const siguienteHora = Math.floor(siguienteIntervalo / 60)
      const siguientesMinutos = siguienteIntervalo % 60

      if (siguienteHora >= 24) {
        bloqueFin = "23:59"
      } else {
        bloqueFin = `${siguienteHora.toString().padStart(2, "0")}:${siguientesMinutos.toString().padStart(2, "0")}`
      }
    } else {
      bloqueInicio = fin
      const siguienteIntervalo = inicioMinutos + 30
      const siguienteHora = Math.floor(siguienteIntervalo / 60)
      const siguientesMinutos = siguienteIntervalo % 60

      if (siguienteHora >= 24) {
        bloqueFin = "23:59"
      } else {
        bloqueFin = `${siguienteHora.toString().padStart(2, "0")}:${siguientesMinutos.toString().padStart(2, "0")}`
      }
    }

    // Verificar si el nuevo bloque se sobrepone REALMENTE con alguno existente
    if (verificarSobreposicion(bloqueInicio, bloqueFin)) {
      toast({
        title: "Error en el horario",
        description:
          "No se puede agregar este bloque porque se sobrepone con otro ya existente. Los bloques adyacentes están permitidos.",
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
    const bloquesConNuevo = [...bloquesActuales, nuevoBloque]

    // ✅ APLICAR FUSIÓN AUTOMÁTICA
    aplicarCambiosConFusion(diaActual, bloquesConNuevo)

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

  // ✅ FUNCIÓN MEJORADA: Eliminar bloque con verificación de fusión
  const eliminarBloque = (bloqueId: string) => {
    const bloquesActuales = bloques[diaActual] || []
    const nuevosBloque = bloquesActuales.filter((bloque) => bloque.id !== bloqueId)

    // Aplicar fusión por si eliminar un bloque permite fusionar otros
    aplicarCambiosConFusion(diaActual, nuevosBloque)
  }

  // Limpiar todos los bloques del día
  const limpiarBloques = () => {
    onChange(diaActual, [])
    cancelarSeleccion()
  }

  // ✅ NUEVA FUNCIÓN: Fusionar manualmente todos los bloques contiguos del día
  const fusionarManualmente = () => {
    const bloquesActuales = bloques[diaActual] || []
    if (bloquesActuales.length <= 1) {
      toast({
        title: "No hay bloques para fusionar",
        description: "Necesitas al menos 2 bloques para poder fusionar.",
        variant: "destructive",
      })
      return
    }

    const bloquesFusionados = fusionarBloquesContiguos(bloquesActuales)

    if (bloquesFusionados.length === bloquesActuales.length) {
      toast({
        title: "No hay bloques contiguos",
        description: "Los bloques actuales no son contiguos y no se pueden fusionar.",
        variant: "destructive",
      })
    } else {
      onChange(diaActual, bloquesFusionados)
      const bloquesEliminados = bloquesActuales.length - bloquesFusionados.length
      toast({
        title: "Fusión manual completada",
        description: `Se fusionaron ${bloquesEliminados + 1} bloques en ${bloquesFusionados.length} bloque${bloquesFusionados.length > 1 ? "s" : ""}.`,
      })
    }
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

    // Usar bloques ordenados para el cálculo
    ordenarBloquesPorHora(bloquesDelDia).forEach((bloque) => {
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

  // ✅ NUEVA FUNCIÓN: Detectar si hay bloques contiguos que se pueden fusionar
  const hayBloquesContiguos = (dia: string) => {
    const bloquesDelDia = bloques[dia] || []
    if (bloquesDelDia.length <= 1) return false

    const bloquesOrdenados = ordenarBloquesPorHora(bloquesDelDia)

    for (let i = 0; i < bloquesOrdenados.length - 1; i++) {
      if (bloquesOrdenados[i].fin === bloquesOrdenados[i + 1].inicio) {
        return true
      }
    }

    return false
  }

  // Agrupar horas por períodos para mejor visualización
  const periodos = [
    { nombre: "Madrugada", horas: horasCompletas.slice(0, 6), icon: Moon, color: "bg-indigo-50 dark:bg-indigo-950" },
    { nombre: "Mañana", horas: horasCompletas.slice(6, 12), icon: Sunrise, color: "bg-orange-50 dark:bg-orange-950" },
    { nombre: "Tarde", horas: horasCompletas.slice(12, 18), icon: Sun, color: "bg-yellow-50 dark:bg-yellow-950" },
    { nombre: "Noche", horas: horasCompletas.slice(18, 24), icon: Sunset, color: "bg-purple-50 dark:bg-purple-950" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Selector de Horarios por Bloques (24 Horas)</h3>
        <div className="flex gap-2">
          {/* ✅ NUEVO BOTÓN: Fusionar manualmente */}
          {hayBloquesContiguos(diaActual) && (
            <Button variant="outline" size="sm" onClick={fusionarManualmente}>
              <Merge className="h-4 w-4 mr-1" /> Fusionar Bloques
            </Button>
          )}
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
            {/* ✅ INDICADOR: Mostrar si hay bloques contiguos */}
            {hayBloquesContiguos(dia) && (
              <Badge variant="outline" className="ml-1 text-xs border-orange-400 text-orange-600">
                <Merge className="h-2 w-2" />
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Indicadores de períodos del día */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {periodos.map((periodo) => {
          const IconComponent = periodo.icon
          return (
            <div key={periodo.nombre} className={cn("p-2 rounded-lg border", periodo.color)}>
              <div className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                <span className="text-sm font-medium">{periodo.nombre}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {periodo.horas[0]} - {periodo.horas[periodo.horas.length - 1]}
              </div>
            </div>
          )
        })}
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
                    ? `${seleccionInicio} - ${seleccionFin} (se agregará hasta ${(() => {
                        const [h, m] = seleccionFin.split(":").map(Number)
                        const totalMinutos = h * 60 + m + 30
                        const nuevaHora = Math.floor(totalMinutos / 60)
                        const nuevosMinutos = totalMinutos % 60
                        return `${nuevaHora.toString().padStart(2, "0")}:${nuevosMinutos.toString().padStart(2, "0")}`
                      })()})`
                    : seleccionInicio
                      ? `Inicio: ${seleccionInicio} (haz clic en otra celda para finalizar)`
                      : "Selecciona el inicio del bloque"}
                </p>
                {/* ✅ INDICADOR: Aviso sobre fusión automática */}
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  💡 Los bloques contiguos se fusionarán automáticamente
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

      {/* Tabla de horarios con scroll horizontal */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: "1600px" }}>
            <thead>
              {/* Fila de períodos del día */}
              <tr>
                <th className="bg-slate-100 dark:bg-slate-800 p-2 border-b border-r text-center font-medium min-w-[80px]">
                  {diasSemanaDisplay[diasSemana.indexOf(diaActual)]}
                </th>
                {periodos.map((periodo) => {
                  const IconComponent = periodo.icon
                  return (
                    <th
                      key={periodo.nombre}
                      className={cn("p-2 border-b border-r text-center text-xs font-medium", periodo.color)}
                      colSpan={periodo.horas.length * 2}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <IconComponent className="h-3 w-3" />
                        {periodo.nombre}
                      </div>
                    </th>
                  )
                })}
              </tr>
              {/* Fila de horas */}
              <tr>
                <th className="bg-slate-100 dark:bg-slate-800 p-2 border-b border-r text-center font-medium">Hora</th>
                {horasCompletas.map((hora) => {
                  const horaNum = Number.parseInt(hora.split(":")[0])
                  const { color } = obtenerPeriodoDelDia(horaNum)
                  return (
                    <th
                      key={hora}
                      className="bg-slate-100 dark:bg-slate-800 p-1 border-b border-r text-center text-xs font-medium"
                      colSpan={2}
                    >
                      <span className={color}>{hora}</span>
                    </th>
                  )
                })}
              </tr>
              {/* Fila de intervalos */}
              <tr>
                <th className="bg-slate-50 dark:bg-slate-900 p-1 border-b border-r text-center text-xs">Intervalos</th>
                {horasCompletas.map((hora) => (
                  <React.Fragment key={`sub-${hora}`}>
                    <th className="bg-slate-50 dark:bg-slate-900 p-1 border-b border-r text-center text-xs min-w-[25px]">
                      :00
                    </th>
                    <th className="bg-slate-50 dark:bg-slate-900 p-1 border-b border-r text-center text-xs min-w-[25px]">
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
                  const horaNum = Number.parseInt(intervalo.split(":")[0])
                  const { color } = obtenerPeriodoDelDia(horaNum)

                  return (
                    <td
                      key={intervalo}
                      className={cn(
                        "border-r border-b cursor-pointer transition-colors text-center",
                        "h-10 w-6 min-w-[25px]",
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
                          <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full"></div>
                        </div>
                      )}
                      {isEnSeleccion && !isEnBloque && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                        </div>
                      )}
                      {isOcupado && !isEnBloque && (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-red-600 dark:text-red-400 text-xs font-bold">×</span>
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
            <CardTitle className="text-base flex items-center gap-2">
              Bloques configurados para {diasSemanaDisplay[diasSemana.indexOf(diaActual)]}
              {/* ✅ INDICADOR: Mostrar si hay bloques fusionados */}
              {hayBloquesContiguos(diaActual) && (
                <Badge variant="outline" className="border-orange-400 text-orange-600">
                  <Merge className="h-3 w-3 mr-1" />
                  Fusionables
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {ordenarBloquesPorHora(bloques[diaActual]).map((bloque, index) => {
                const horaInicio = Number.parseInt(bloque.inicio.split(":")[0])
                const { periodo, icon: IconComponent, color } = obtenerPeriodoDelDia(horaInicio)

                // ✅ CALCULAR DURACIÓN DEL BLOQUE
                const inicioMinutos = convertirHoraAMinutos(bloque.inicio)
                const finMinutos = convertirHoraAMinutos(bloque.fin)
                const duracionHoras = (finMinutos - inicioMinutos) / 60

                return (
                  <div
                    key={bloque.id}
                    className="flex items-center justify-between p-3 border rounded-md bg-green-50 dark:bg-green-950"
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className={cn("h-4 w-4", color)} />
                      <div>
                        <div className="font-medium">Bloque {index + 1}</div>
                        <div className="text-sm text-muted-foreground">
                          {bloque.inicio} - {bloque.fin}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {periodo} • {duracionHoras.toFixed(1)}h
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => eliminarBloque(bloque.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-200 dark:bg-green-900 border border-green-400 dark:border-green-600 rounded-sm flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full"></div>
          </div>
          <span>Bloque configurado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-200 dark:bg-blue-900 border border-blue-400 dark:border-blue-600 rounded-sm flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
          </div>
          <span>Selección actual</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-600 rounded-sm flex items-center justify-center">
            <span className="text-red-600 dark:text-red-400 text-xs font-bold">×</span>
          </div>
          <span>Horario ocupado (conflicto)</span>
        </div>
        {/* ✅ NUEVA LEYENDA: Fusión automática */}
        <div className="flex items-center gap-1">
          <Merge className="h-4 w-4 text-orange-600" />
          <span>Fusión automática de bloques contiguos</span>
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
                      <span className="flex items-center gap-1">
                        {diasSemanaDisplay[index]}
                        {hayBloquesContiguos(dia) && <Merge className="h-3 w-3 text-orange-500" />}
                      </span>
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
                <h4 className="font-medium mb-2">Bloques por día (ordenados cronológicamente)</h4>
                <div className="space-y-2">
                  {diasSemana.map((dia, index) => {
                    const bloquesOrdenados = ordenarBloquesPorHora(bloques[dia] || [])
                    return (
                      <div key={dia} className="border-b pb-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium flex items-center gap-1">
                            {diasSemanaDisplay[index]}
                            {hayBloquesContiguos(dia) && <Merge className="h-3 w-3 text-orange-500" />}
                          </span>
                          <span className="text-sm text-muted-foreground">{bloquesOrdenados.length} bloques</span>
                        </div>
                        {bloquesOrdenados.length > 0 && (
                          <div className="mt-1 space-y-1">
                            {bloquesOrdenados.map((bloque, bloqueIndex) => {
                              const duracion =
                                (convertirHoraAMinutos(bloque.fin) - convertirHoraAMinutos(bloque.inicio)) / 60
                              return (
                                <div key={bloque.id} className="text-xs text-muted-foreground ml-2">
                                  Bloque {bloqueIndex + 1}: {bloque.inicio} - {bloque.fin} ({duracion.toFixed(1)}h)
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
