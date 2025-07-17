"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

// Datos de ejemplo para los detalles del horario
const detalleHorarioEjemplo = {
  lunes: {
    activo: true,
    entrada: "08:00",
    salida: "17:00",
    descansoInicio: "13:00",
    descansoFin: "14:00",
    descansoPagado: false,
    bloques: [
      { inicio: "08:00", fin: "13:00" },
      { inicio: "14:00", fin: "17:00" },
    ],
  },
  martes: {
    activo: true,
    entrada: "08:00",
    salida: "17:00",
    descansoInicio: "13:00",
    descansoFin: "14:00",
    descansoPagado: false,
    bloques: [
      { inicio: "08:00", fin: "13:00" },
      { inicio: "14:00", fin: "17:00" },
    ],
  },
  miercoles: {
    activo: true,
    entrada: "08:00",
    salida: "17:00",
    descansoInicio: "13:00",
    descansoFin: "14:00",
    descansoPagado: false,
    bloques: [
      { inicio: "08:00", fin: "13:00" },
      { inicio: "14:00", fin: "17:00" },
    ],
  },
  jueves: {
    activo: true,
    entrada: "08:00",
    salida: "17:00",
    descansoInicio: "13:00",
    descansoFin: "14:00",
    descansoPagado: false,
    bloques: [
      { inicio: "08:00", fin: "13:00" },
      { inicio: "14:00", fin: "17:00" },
    ],
  },
  viernes: {
    activo: true,
    entrada: "08:00",
    salida: "17:00",
    descansoInicio: "13:00",
    descansoFin: "14:00",
    descansoPagado: false,
    bloques: [
      { inicio: "08:00", fin: "13:00" },
      { inicio: "14:00", fin: "17:00" },
    ],
  },
  sabado: {
    activo: false,
    entrada: "",
    salida: "",
    descansoInicio: "",
    descansoFin: "",
    descansoPagado: false,
    bloques: [],
  },
  domingo: {
    activo: false,
    entrada: "",
    salida: "",
    descansoInicio: "",
    descansoFin: "",
    descansoPagado: false,
    bloques: [],
  },
}

// Generar horas del día para la cuadrícula
const horasDia = Array.from({ length: 25 }, (_, i) => {
  const hora = i.toString().padStart(2, "0") + ":00"
  return hora
})

// Generar intervalos de 30 minutos para la cuadrícula
const intervalos = Array.from({ length: 48 }, (_, i) => {
  const hora = Math.floor(i / 2)
    .toString()
    .padStart(2, "0")
  const minutos = i % 2 === 0 ? "00" : "30"
  return `${hora}:${minutos}`
})

type DiaDetalle = {
  activo: boolean
  entrada: string
  salida: string
  descansoInicio: string
  descansoFin: string
  descansoPagado: boolean
  bloques: { inicio: string; fin: string }[]
}

type DetalleHorario = {
  [key: string]: DiaDetalle
}

export function DetalleHorarioEditor({ horarioId }: { horarioId: string }) {
  const [activeTab, setActiveTab] = useState("cuadricula")
  const [detalleHorario, setDetalleHorario] = useState<DetalleHorario>(detalleHorarioEjemplo)
  const [diaActual, setDiaActual] = useState("lunes")
  const [seleccionInicio, setSeleccionInicio] = useState<string | null>(null)
  const [seleccionFin, setSeleccionFin] = useState<string | null>(null)
  const [seleccionActiva, setSeleccionActiva] = useState(false)
  const [horasTotales, setHorasTotales] = useState(0)

  const diasSemana = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]
  const diasSemanaDisplay = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

  useEffect(() => {
    // En un caso real, aquí se cargarían los datos del horario desde la API
    // Por ahora, usamos datos de ejemplo
    console.log("Cargando detalles del horario:", horarioId)
  }, [horarioId])

  useEffect(() => {
    // Calcular horas totales
    let total = 0
    Object.values(detalleHorario).forEach((dia) => {
      if (dia.activo) {
        dia.bloques.forEach((bloque) => {
          const inicio = bloque.inicio.split(":")
          const fin = bloque.fin.split(":")
          const inicioMinutos = Number.parseInt(inicio[0]) * 60 + Number.parseInt(inicio[1])
          const finMinutos = Number.parseInt(fin[0]) * 60 + Number.parseInt(fin[1])
          total += (finMinutos - inicioMinutos) / 60
        })
      }
    })
    setHorasTotales(total)
  }, [detalleHorario])

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
    const dia = detalleHorario[diaActual]
    if (!dia.activo) return false

    const intervaloMinutos = convertirAMinutos(intervalo)
    return dia.bloques.some((bloque) => {
      const inicioMinutos = convertirAMinutos(bloque.inicio)
      const finMinutos = convertirAMinutos(bloque.fin)
      return intervaloMinutos >= inicioMinutos && intervaloMinutos < finMinutos
    })
  }

  const esDescanso = (intervalo: string) => {
    const dia = detalleHorario[diaActual]
    if (!dia.activo || !dia.descansoInicio || !dia.descansoFin) return false

    const intervaloMinutos = convertirAMinutos(intervalo)
    const inicioMinutos = convertirAMinutos(dia.descansoInicio)
    const finMinutos = convertirAMinutos(dia.descansoFin)

    return intervaloMinutos >= inicioMinutos && intervaloMinutos < finMinutos
  }

  const agregarBloque = () => {
    if (!seleccionInicio) return

    const fin = seleccionFin || seleccionInicio
    const nuevoBloque = {
      inicio: seleccionInicio,
      fin: fin,
    }

    setDetalleHorario((prev) => ({
      ...prev,
      [diaActual]: {
        ...prev[diaActual],
        bloques: [...prev[diaActual].bloques, nuevoBloque],
        entrada: prev[diaActual].entrada || seleccionInicio,
        salida: prev[diaActual].salida || fin,
      },
    }))

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
    setDetalleHorario((prev) => ({
      ...prev,
      [diaActual]: {
        ...prev[diaActual],
        bloques: [],
      },
    }))
  }

  const handleDiaChange = (dia: string) => {
    limpiarSeleccion()
    setDiaActual(dia)
  }

  const handleActivoDiaChange = (activo: boolean) => {
    setDetalleHorario((prev) => ({
      ...prev,
      [diaActual]: {
        ...prev[diaActual],
        activo,
      },
    }))
  }

  const handleDescansoChange = (campo: string, valor: string) => {
    setDetalleHorario((prev) => ({
      ...prev,
      [diaActual]: {
        ...prev[diaActual],
        [campo]: valor,
      },
    }))
  }

  const handleDescansoPagadoChange = (pagado: boolean) => {
    setDetalleHorario((prev) => ({
      ...prev,
      [diaActual]: {
        ...prev[diaActual],
        descansoPagado: pagado,
      },
    }))
  }

  const calcularHorasDia = (dia: string) => {
    const diaData = detalleHorario[dia]
    if (!diaData.activo) return 0

    let total = 0
    diaData.bloques.forEach((bloque) => {
      const inicio = bloque.inicio.split(":")
      const fin = bloque.fin.split(":")
      const inicioMinutos = Number.parseInt(inicio[0]) * 60 + Number.parseInt(inicio[1])
      const finMinutos = Number.parseInt(fin[0]) * 60 + Number.parseInt(fin[1])
      total += (finMinutos - inicioMinutos) / 60
    })
    return total
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cuadricula">Cuadrícula de Horarios</TabsTrigger>
          <TabsTrigger value="resumen">Resumen por Día</TabsTrigger>
        </TabsList>

        <TabsContent value="cuadricula" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-64 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Días de la Semana</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {diasSemana.map((dia, index) => (
                      <Button
                        key={dia}
                        variant={diaActual === dia ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => handleDiaChange(dia)}
                      >
                        {diasSemanaDisplay[index]}
                        {detalleHorario[dia].activo ? (
                          <Badge className="ml-auto bg-green-500">Activo</Badge>
                        ) : (
                          <Badge className="ml-auto" variant="outline">
                            Inactivo
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Configuración del Día</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`activo-${diaActual}`}>Día Activo</Label>
                      <Switch
                        id={`activo-${diaActual}`}
                        checked={detalleHorario[diaActual].activo}
                        onCheckedChange={handleActivoDiaChange}
                      />
                    </div>

                    {detalleHorario[diaActual].activo && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor={`descanso-inicio-${diaActual}`}>Inicio de Descanso</Label>
                          <Input
                            id={`descanso-inicio-${diaActual}`}
                            type="time"
                            value={detalleHorario[diaActual].descansoInicio}
                            onChange={(e) => handleDescansoChange("descansoInicio", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`descanso-fin-${diaActual}`}>Fin de Descanso</Label>
                          <Input
                            id={`descanso-fin-${diaActual}`}
                            type="time"
                            value={detalleHorario[diaActual].descansoFin}
                            onChange={(e) => handleDescansoChange("descansoFin", e.target.value)}
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`descanso-pagado-${diaActual}`}
                            checked={detalleHorario[diaActual].descansoPagado}
                            onCheckedChange={handleDescansoPagadoChange}
                          />
                          <label
                            htmlFor={`descanso-pagado-${diaActual}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Descanso Pagado
                          </label>
                        </div>

                        <div className="pt-2">
                          <p className="text-sm font-medium">Horas del Día: {calcularHorasDia(diaActual)}</p>
                        </div>

                        {seleccionInicio && (
                          <div className="space-y-2 pt-2 border-t">
                            <p className="text-sm font-medium">Selección Actual:</p>
                            <p className="text-sm">
                              {seleccionInicio} - {seleccionFin || seleccionInicio}
                            </p>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={agregarBloque}>
                                Agregar Bloque
                              </Button>
                              <Button size="sm" variant="outline" onClick={limpiarSeleccion}>
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        )}

                        {detalleHorario[diaActual].bloques.length > 0 && (
                          <div className="space-y-2 pt-2 border-t">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">Bloques Configurados:</p>
                              <Button size="sm" variant="destructive" onClick={limpiarBloques}>
                                Limpiar
                              </Button>
                            </div>
                            <div className="space-y-1">
                              {detalleHorario[diaActual].bloques.map((bloque, index) => (
                                <div key={index} className="text-sm">
                                  {bloque.inicio} - {bloque.fin}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex-1 overflow-x-auto">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    Cuadrícula de Horarios - {diasSemanaDisplay[diasSemana.indexOf(diaActual)]}
                  </CardTitle>
                  <CardDescription>Selecciona las celdas para definir los bloques de tiempo laborales</CardDescription>
                </CardHeader>
                <CardContent>
                  {detalleHorario[diaActual].activo ? (
                    <div className="border rounded-md overflow-x-auto">
                      <div className="grid grid-cols-[auto_repeat(24,minmax(40px,1fr))] gap-0">
                        {/* Encabezados de horas */}
                        <div className="bg-slate-100 dark:bg-slate-800 p-2 border-b border-r text-center font-medium">
                          Hora
                        </div>
                        {horasDia.slice(0, 24).map((hora) => (
                          <div
                            key={hora}
                            className="bg-slate-100 dark:bg-slate-800 p-2 border-b border-r text-center font-medium"
                          >
                            {hora}
                          </div>
                        ))}

                        {/* Celdas de intervalos */}
                        {intervalos.map((intervalo) => {
                          const hora = intervalo.split(":")[0]
                          const minutos = intervalo.split(":")[1]
                          const esHoraCompleta = minutos === "00"

                          return (
                            <React.Fragment key={intervalo}>
                              {esHoraCompleta && (
                                <div className="bg-slate-50 dark:bg-slate-900 p-2 border-b border-r text-center">
                                  {intervalo}
                                </div>
                              )}
                              <div
                                className={cn(
                                  "h-8 border-r border-b cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
                                  esIntervaloSeleccionado(intervalo) && "bg-blue-100 dark:bg-blue-900",
                                  esBloqueExistente(intervalo) && "bg-green-100 dark:bg-green-900",
                                  esDescanso(intervalo) && "bg-yellow-100 dark:bg-yellow-900",
                                )}
                                onClick={() => handleCeldaClick(intervalo)}
                              ></div>
                            </React.Fragment>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Este día está configurado como inactivo. Actívalo para definir horarios.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="resumen" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Horarios por Día</CardTitle>
              <CardDescription>Vista general de los horarios configurados para cada día</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-8 gap-2 font-medium border-b pb-2">
                  <div>Día</div>
                  <div>Estado</div>
                  <div>Entrada</div>
                  <div>Salida</div>
                  <div>Descanso Inicio</div>
                  <div>Descanso Fin</div>
                  <div>Descanso Pagado</div>
                  <div className="text-right">Horas</div>
                </div>

                {diasSemana.map((dia, index) => (
                  <div key={dia} className="grid grid-cols-8 gap-2 py-2 border-b">
                    <div className="font-medium">{diasSemanaDisplay[index]}</div>
                    <div>
                      {detalleHorario[dia].activo ? (
                        <Badge className="bg-green-500">Activo</Badge>
                      ) : (
                        <Badge variant="outline">Inactivo</Badge>
                      )}
                    </div>
                    <div>{detalleHorario[dia].entrada || "N/A"}</div>
                    <div>{detalleHorario[dia].salida || "N/A"}</div>
                    <div>{detalleHorario[dia].descansoInicio || "N/A"}</div>
                    <div>{detalleHorario[dia].descansoFin || "N/A"}</div>
                    <div>
                      {detalleHorario[dia].descansoPagado ? (
                        <Badge variant="outline" className="border-green-500 text-green-500">
                          Sí
                        </Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </div>
                    <div className="text-right font-medium">{calcularHorasDia(dia)}</div>
                  </div>
                ))}

                <div className="grid grid-cols-8 gap-2 pt-2">
                  <div className="col-span-7 font-medium">Total Horas Semanales</div>
                  <div className="text-right font-bold">{horasTotales}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
