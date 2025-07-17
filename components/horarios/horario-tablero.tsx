"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface HorarioTableroProps {
  bloques: {
    [dia: string]: Array<{
      inicio: string
      fin: string
    }>
  }
  onChange: (dia: string, bloques: Array<{ inicio: string; fin: string }>) => void
}

export function HorarioTablero({ bloques, onChange }: HorarioTableroProps) {
  const [diaActual, setDiaActual] = useState("lunes")
  const [seleccionInicio, setSeleccionInicio] = useState<string | null>(null)
  const [seleccionFin, setSeleccionFin] = useState<string | null>(null)
  const [seleccionActiva, setSeleccionActiva] = useState(false)

  const diasSemana = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]
  const diasSemanaDisplay = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

  // Generar intervalos de 30 minutos para la cuadrícula (de 7:00 a 22:00)
  const intervalos: string[] = []
  for (let hora = 7; hora <= 22; hora++) {
    for (let minuto = 0; minuto < 60; minuto += 30) {
      const horaStr = hora.toString().padStart(2, "0")
      const minutoStr = minuto.toString().padStart(2, "0")
      intervalos.push(`${horaStr}:${minutoStr}`)
    }
  }

  const handleCeldaClick = (intervalo: string) => {
    if (!seleccionActiva) {
      setSeleccionInicio(intervalo)
      setSeleccionActiva(true)
    } else if (seleccionInicio) {
      // Asegurarse de que el fin es después del inicio
      const inicioMinutos = convertirAMinutos(seleccionInicio)
      const finMinutos = convertirAMinutos(intervalo)

      if (finMinutos <= inicioMinutos) {
        // Si el fin es antes o igual al inicio, intercambiar
        setSeleccionFin(seleccionInicio)
        setSeleccionInicio(intervalo)
      } else {
        setSeleccionFin(intervalo)
      }

      // Finalizar selección
      setSeleccionActiva(false)
    }
  }

  const convertirAMinutos = (hora: string) => {
    const [h, m] = hora.split(":").map(Number)
    return h * 60 + m
  }

  const esIntervaloSeleccionado = (intervalo: string) => {
    if (!seleccionInicio || seleccionActiva) return false

    const fin = seleccionFin || seleccionInicio
    const inicioMinutos = convertirAMinutos(seleccionInicio)
    const finMinutos = convertirAMinutos(fin)
    const intervaloMinutos = convertirAMinutos(intervalo)

    return intervaloMinutos >= inicioMinutos && intervaloMinutos <= finMinutos
  }

  const esBloqueExistente = (intervalo: string) => {
    const bloquesDelDia = bloques[diaActual] || []
    const intervaloMinutos = convertirAMinutos(intervalo)

    return bloquesDelDia.some((bloque) => {
      const inicioMinutos = convertirAMinutos(bloque.inicio)
      const finMinutos = convertirAMinutos(bloque.fin)
      return intervaloMinutos >= inicioMinutos && intervaloMinutos < finMinutos
    })
  }

  const agregarBloque = () => {
    if (!seleccionInicio) return

    const fin = seleccionFin || seleccionInicio
    const nuevoBloque = {
      inicio: seleccionInicio,
      fin: fin,
    }

    const bloquesActuales = [...(bloques[diaActual] || [])]
    onChange(diaActual, [...bloquesActuales, nuevoBloque])

    // Limpiar selección
    setSeleccionInicio(null)
    setSeleccionFin(null)
  }

  const limpiarSeleccion = () => {
    setSeleccionInicio(null)
    setSeleccionFin(null)
    setSeleccionActiva(false)
  }

  const limpiarBloques = () => {
    onChange(diaActual, [])
  }

  const handleDiaChange = (dia: string) => {
    limpiarSeleccion()
    setDiaActual(dia)
  }

  return (
    <div className="space-y-4">
      <Tabs value={diaActual} onValueChange={handleDiaChange}>
        <TabsList className="w-full grid grid-cols-7">
          {diasSemana.map((dia, index) => (
            <TabsTrigger key={dia} value={dia} className="text-xs sm:text-sm">
              {diasSemanaDisplay[index]}
            </TabsTrigger>
          ))}
        </TabsList>

        {diasSemana.map((dia) => (
          <TabsContent key={dia} value={dia} className="space-y-4">
            <div className="border rounded-md overflow-x-auto">
              <div className="grid grid-cols-[auto_repeat(31,minmax(40px,1fr))] gap-0">
                {/* Encabezados de horas */}
                <div className="bg-slate-100 dark:bg-slate-800 p-2 border-b border-r text-center font-medium">Hora</div>
                {intervalos.map((intervalo) => {
                  const minutos = intervalo.split(":")[1]
                  return minutos === "00" ? (
                    <div
                      key={intervalo}
                      className="bg-slate-100 dark:bg-slate-800 p-2 border-b border-r text-center font-medium text-xs"
                    >
                      {intervalo}
                    </div>
                  ) : (
                    <div
                      key={intervalo}
                      className="bg-slate-100 dark:bg-slate-800 p-2 border-b border-r text-center font-medium text-xs"
                    ></div>
                  )
                })}

                {/* Celdas de intervalos */}
                <div className="bg-slate-50 dark:bg-slate-900 p-2 border-b border-r text-center text-xs">
                  {diasSemanaDisplay[diasSemana.indexOf(dia)]}
                </div>
                {intervalos.map((intervalo) => (
                  <div
                    key={intervalo}
                    className={cn(
                      "h-8 border-r border-b cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
                      esIntervaloSeleccionado(intervalo) && "bg-blue-100 dark:bg-blue-900",
                      esBloqueExistente(intervalo) && "bg-green-100 dark:bg-green-900",
                    )}
                    onClick={() => handleCeldaClick(intervalo)}
                  ></div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {seleccionInicio && (
                <div className="flex items-center gap-2 border rounded-md p-2 bg-slate-50 dark:bg-slate-800">
                  <span className="text-sm">
                    Selección: {seleccionInicio} - {seleccionFin || seleccionInicio}
                  </span>
                  <Button size="sm" onClick={agregarBloque}>
                    Agregar Bloque
                  </Button>
                  <Button size="sm" variant="outline" onClick={limpiarSeleccion}>
                    Cancelar
                  </Button>
                </div>
              )}

              {bloques[dia] && bloques[dia].length > 0 && (
                <div className="flex items-center gap-2 border rounded-md p-2">
                  <span className="text-sm">Bloques configurados: {bloques[dia].length}</span>
                  <Button size="sm" variant="destructive" onClick={limpiarBloques}>
                    Limpiar
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Bloques configurados:</h4>
              {bloques[dia] && bloques[dia].length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {bloques[dia].map((bloque, index) => (
                    <div key={index} className="border rounded-md p-2 bg-green-50 dark:bg-green-950">
                      <span className="text-sm">
                        {bloque.inicio} - {bloque.fin}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No hay bloques configurados para este día.</div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
