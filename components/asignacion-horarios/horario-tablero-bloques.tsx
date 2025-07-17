"use client"

import React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BloqueHorario } from "./asignacion-horarios-manager"

interface HorarioTableroBloqueProps {
  bloques: {
    [dia: string]: BloqueHorario[]
  }
  bloquesOcupados: {
    [dia: string]: BloqueHorario[]
  }
  onChange: (dia: string, bloques: BloqueHorario[]) => void
}

export function HorarioTableroBloques({ bloques, bloquesOcupados, onChange }: HorarioTableroBloqueProps) {
  const diasSemana = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]
  const diasSemanaDisplay = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
  const [diaActual, setDiaActual] = useState("lunes")
  const [modoSeleccion, setModoSeleccion] = useState<boolean | null>(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false)

  // Referencias para evitar bucles infinitos
  const inicializandoRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const ultimosBloques = useRef<string>("")

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

  // Estado para las celdas seleccionadas
  const [celdasSeleccionadas, setCeldasSeleccionadas] = useState<Record<string, boolean>>({})

  // Función para convertir bloques a celdas seleccionadas
  const bloquesACeldas = (bloquesData: { [dia: string]: BloqueHorario[] }) => {
    const seleccion: Record<string, boolean> = {}

    Object.entries(bloquesData).forEach(([dia, bloquesDelDia]) => {
      bloquesDelDia.forEach((bloque) => {
        const inicioHora = Number(bloque.inicio.split(":")[0])
        const inicioMinutos = Number(bloque.inicio.split(":")[1])
        const finHora = Number(bloque.fin.split(":")[0])
        const finMinutos = Number(bloque.fin.split(":")[1])

        // Convertir a índices de intervalos (ajustado para empezar en 6:00)
        const inicioIndice = (inicioHora - 6) * 2 + (inicioMinutos === 30 ? 1 : 0)
        const finIndice = (finHora - 6) * 2 + (finMinutos === 30 ? 1 : 0)

        // Marcar todas las celdas en el rango
        for (let i = inicioIndice; i < finIndice && i < intervalos.length; i++) {
          if (i >= 0) {
            const intervalo = intervalos[i]
            seleccion[`${dia}-${intervalo}`] = true
          }
        }
      })
    })

    return seleccion
  }

  // Función para convertir celdas seleccionadas a bloques
  const celdasABloques = (celdasData: Record<string, boolean>, dia: string) => {
    // Obtener todas las celdas seleccionadas para el día específico
    const celdasDelDia = Object.entries(celdasData)
      .filter(([key, selected]) => selected && key.startsWith(`${dia}-`))
      .map(([key]) => {
        const [d, intervalo] = key.split("-")
        return intervalo
      })
      .sort()

    // Convertir intervalos a bloques continuos
    const bloquesContinuos: BloqueHorario[] = []
    let bloqueActual: BloqueHorario | null = null

    celdasDelDia.forEach((intervalo, index) => {
      const [hora, minutos] = intervalo.split(":").map(Number)
      const intervaloActual = hora * 60 + minutos

      // Calcular el siguiente intervalo (30 minutos después)
      const siguienteIntervalo = intervaloActual + 30

      // Si es el primer intervalo o no es continuo con el anterior
      if (index === 0 || !bloqueActual) {
        bloqueActual = {
          id: `${Date.now()}-${Math.random()}`,
          inicio: intervalo,
          fin: `${Math.floor(siguienteIntervalo / 60)
            .toString()
            .padStart(2, "0")}:${siguienteIntervalo % 60 === 0 ? "00" : "30"}`,
        }
        bloquesContinuos.push(bloqueActual)
      } else {
        // Verificar si es continuo con el anterior
        const finAnterior = bloqueActual.fin
        const [horaFin, minutosFin] = finAnterior.split(":").map(Number)
        const finAnteriorMinutos = horaFin * 60 + minutosFin

        if (intervaloActual === finAnteriorMinutos) {
          // Es continuo, actualizar fin del bloque actual
          bloqueActual.fin = `${Math.floor(siguienteIntervalo / 60)
            .toString()
            .padStart(2, "0")}:${siguienteIntervalo % 60 === 0 ? "00" : "30"}`
        } else {
          // No es continuo, crear nuevo bloque
          bloqueActual = {
            id: `${Date.now()}-${Math.random()}`,
            inicio: intervalo,
            fin: `${Math.floor(siguienteIntervalo / 60)
              .toString()
              .padStart(2, "0")}:${siguienteIntervalo % 60 === 0 ? "00" : "30"}`,
          }
          bloquesContinuos.push(bloqueActual)
        }
      }
    })

    return bloquesContinuos
  }

  // Inicializar celdasSeleccionadas basado en bloques existentes
  useEffect(() => {
    const bloquesString = JSON.stringify(bloques)

    // Solo actualizar si los bloques realmente cambiaron
    if (bloquesString !== ultimosBloques.current) {
      inicializandoRef.current = true
      ultimosBloques.current = bloquesString

      const nuevaSeleccion = bloquesACeldas(bloques)
      setCeldasSeleccionadas(nuevaSeleccion)

      // Permitir guardado automático después de un breve delay
      setTimeout(() => {
        inicializandoRef.current = false
      }, 200)
    }
  }, [bloques])

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

  // Función para guardar cambios con debounce
  const guardarCambios = useCallback(() => {
    if (inicializandoRef.current) return

    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Establecer nuevo timeout
    timeoutRef.current = setTimeout(() => {
      const bloquesContinuos = celdasABloques(celdasSeleccionadas, diaActual)
      onChange(diaActual, bloquesContinuos)
    }, 500) // Debounce más largo para evitar llamadas excesivas
  }, [diaActual]) // Solo depende de diaActual

  // Manejar clic en una celda
  const handleCeldaClick = (intervalo: string) => {
    // Si la celda está ocupada por otro horario, no permitir selección
    if (esCeldaOcupada(diaActual, intervalo)) return

    const key = `${diaActual}-${intervalo}`
    const estaSeleccionada = celdasSeleccionadas[key]

    // Determinar el modo de selección al inicio del arrastre
    setModoSeleccion(!estaSeleccionada)
    setArrastrando(true)

    setCeldasSeleccionadas((prev) => {
      const nuevaSeleccion = { ...prev, [key]: !estaSeleccionada }

      // Guardar cambios después de actualizar el estado
      setTimeout(() => {
        if (!inicializandoRef.current) {
          const bloquesContinuos = celdasABloques(nuevaSeleccion, diaActual)
          onChange(diaActual, bloquesContinuos)
        }
      }, 100)

      return nuevaSeleccion
    })
  }

  // Manejar movimiento sobre una celda (para selección por arrastre)
  const handleCeldaMouseEnter = (intervalo: string) => {
    if (!arrastrando || modoSeleccion === null) return

    // Si la celda está ocupada por otro horario, no permitir selección
    if (esCeldaOcupada(diaActual, intervalo)) return

    const key = `${diaActual}-${intervalo}`

    // Aplicar el mismo modo de selección que se inició con el clic
    setCeldasSeleccionadas((prev) => ({ ...prev, [key]: modoSeleccion }))
  }

  // Finalizar el arrastre y guardar cambios
  const handleMouseUp = () => {
    if (arrastrando) {
      setArrastrando(false)
      setModoSeleccion(null)

      // Guardar cambios al finalizar el arrastre
      setTimeout(() => {
        if (!inicializandoRef.current) {
          const bloquesContinuos = celdasABloques(celdasSeleccionadas, diaActual)
          onChange(diaActual, bloquesContinuos)
        }
      }, 100)
    }
  }

  // Cambiar el día actual
  const handleDiaChange = (dia: string) => {
    setDiaActual(dia)
  }

  // Limpiar todas las selecciones del día actual
  const limpiarSelecciones = () => {
    setCeldasSeleccionadas((prev) => {
      const nuevaSeleccion = { ...prev }

      // Eliminar solo las selecciones del día actual
      Object.keys(nuevaSeleccion).forEach((key) => {
        if (key.startsWith(`${diaActual}-`)) {
          delete nuevaSeleccion[key]
        }
      })

      // Guardar cambios inmediatamente
      setTimeout(() => {
        if (!inicializandoRef.current) {
          onChange(diaActual, [])
        }
      }, 100)

      return nuevaSeleccion
    })
  }

  // Calcular horas por día
  const calcularHorasPorDia = (dia: string) => {
    const celdasDelDia = Object.entries(celdasSeleccionadas).filter(
      ([key, selected]) => selected && key.startsWith(`${dia}-`),
    ).length

    return celdasDelDia * 0.5 // Cada celda representa 30 minutos
  }

  // Calcular total de horas semanales
  const calcularTotalHoras = () => {
    const totalCeldas = Object.values(celdasSeleccionadas).filter(Boolean).length
    return totalCeldas * 0.5 // Cada celda representa 30 minutos
  }

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="space-y-6" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Selector de Horarios Semanales</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={limpiarSelecciones}>
            <Trash2 className="h-4 w-4 mr-1" /> Borrar Día
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
          </Button>
        ))}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr>
                {/* Celda vacía para la esquina */}
                <th className="bg-slate-100 dark:bg-slate-800 p-2 border-b border-r text-center font-medium min-w-[80px]">
                  {diasSemanaDisplay[diasSemana.indexOf(diaActual)]}
                </th>
                {/* Encabezados de horas */}
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
                {/* Celda vacía para la esquina */}
                <th className="bg-slate-50 dark:bg-slate-900 p-1 border-b border-r text-center text-xs">Intervalos</th>
                {/* Sub-encabezados para :00 y :30 */}
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
                {/* Etiqueta del día */}
                <td className="bg-slate-50 dark:bg-slate-900 p-2 border-b border-r text-center font-medium">Horario</td>
                {/* Celdas de intervalos */}
                {intervalos.map((intervalo) => {
                  const key = `${diaActual}-${intervalo}`
                  const isSelected = celdasSeleccionadas[key]
                  const isOcupado = esCeldaOcupada(diaActual, intervalo)

                  return (
                    <td
                      key={key}
                      className={cn(
                        "border-r border-b cursor-pointer transition-colors text-center",
                        "h-12 w-8 min-w-[30px]",
                        isSelected
                          ? "bg-green-200 dark:bg-green-900 hover:bg-green-300 dark:hover:bg-green-800"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800",
                        isOcupado && "bg-red-100 dark:bg-red-900/30 cursor-not-allowed",
                      )}
                      onMouseDown={() => handleCeldaClick(intervalo)}
                      onMouseEnter={() => handleCeldaMouseEnter(intervalo)}
                      title={`${intervalo} - ${diasSemanaDisplay[diasSemana.indexOf(diaActual)]}`}
                    >
                      {isSelected && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
                        </div>
                      )}
                      {isOcupado && !isSelected && (
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

      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-200 dark:bg-green-900 border border-green-400 dark:border-green-600 rounded-sm flex items-center justify-center">
            <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
          </div>
          <span>Horario seleccionado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-600 rounded-sm flex items-center justify-center">
            <span className="text-red-600 dark:text-red-400 text-xs font-bold">X</span>
          </div>
          <span>Horario ocupado (conflicto)</span>
        </div>
        <div className="ml-auto text-sm text-muted-foreground">
          Horas seleccionadas: <span className="font-medium">{calcularHorasPorDia(diaActual).toFixed(1)}</span>
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
