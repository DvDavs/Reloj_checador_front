"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Users, Shield, Star, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// Definición de las reglas de asistencia
export const reglasAsistencia = {
  ejecutivo: {
    id: "ejecutivo",
    nombre: "Ejecutivo",
    descripcion: "Para directivos y gerentes con mayor flexibilidad",
    icono: Star,
    color: "bg-purple-100 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
    colorTexto: "text-purple-700 dark:text-purple-300",
    toleranciaRetardo: 30,
    toleranciaFalta: 60,
    aperturaEntrada: 60,
    aperturaSalida: 60,
  },
  administrativo: {
    id: "administrativo",
    nombre: "Administrativo",
    descripcion: "Para personal de oficina y administrativo",
    icono: Users,
    color: "bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    colorTexto: "text-blue-700 dark:text-blue-300",
    toleranciaRetardo: 15,
    toleranciaFalta: 30,
    aperturaEntrada: 30,
    aperturaSalida: 30,
  },
  operativo: {
    id: "operativo",
    nombre: "Operativo",
    descripcion: "Para personal operativo y de producción",
    icono: Clock,
    color: "bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    colorTexto: "text-green-700 dark:text-green-300",
    toleranciaRetardo: 10,
    toleranciaFalta: 20,
    aperturaEntrada: 15,
    aperturaSalida: 15,
  },
  estricto: {
    id: "estricto",
    nombre: "Estricto",
    descripcion: "Para áreas críticas con horarios estrictos",
    icono: Shield,
    color: "bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    colorTexto: "text-red-700 dark:text-red-300",
    toleranciaRetardo: 5,
    toleranciaFalta: 10,
    aperturaEntrada: 10,
    aperturaSalida: 5,
  },
}

interface ReglasAsistenciaSelectorProps {
  reglaSeleccionada?: string
  onReglaChange: (reglaId: string) => void
}

export function ReglasAsistenciaSelector({ reglaSeleccionada, onReglaChange }: ReglasAsistenciaSelectorProps) {
  const [mostrarDetalles, setMostrarDetalles] = useState(false)

  const reglaActual = reglaSeleccionada ? reglasAsistencia[reglaSeleccionada as keyof typeof reglasAsistencia] : null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.values(reglasAsistencia).map((regla) => {
          const IconoRegla = regla.icono
          const estaSeleccionada = reglaSeleccionada === regla.id

          return (
            <Card
              key={regla.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                regla.color,
                estaSeleccionada && "ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900",
              )}
              onClick={() => onReglaChange(regla.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <IconoRegla className={cn("h-5 w-5", regla.colorTexto)} />
                  {estaSeleccionada && <CheckCircle className="h-4 w-4 text-blue-500" />}
                </div>
                <h3 className={cn("font-medium text-sm", regla.colorTexto)}>{regla.nombre}</h3>
                <p className="text-xs text-muted-foreground mt-1">{regla.descripcion}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {reglaActual && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <reglaActual.icono className={cn("h-5 w-5", reglaActual.colorTexto)} />
                Regla Seleccionada: {reglaActual.nombre}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setMostrarDetalles(!mostrarDetalles)}>
                {mostrarDetalles ? "Ocultar" : "Ver"} Detalles
              </Button>
            </div>
            <CardDescription>{reglaActual.descripcion}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {reglaActual.toleranciaRetardo}
                </div>
                <div className="text-xs text-muted-foreground">Tolerancia Retardo (min)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{reglaActual.toleranciaFalta}</div>
                <div className="text-xs text-muted-foreground">Tolerancia Falta (min)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {reglaActual.aperturaEntrada}
                </div>
                <div className="text-xs text-muted-foreground">Apertura Entrada (min)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{reglaActual.aperturaSalida}</div>
                <div className="text-xs text-muted-foreground">Apertura Salida (min)</div>
              </div>
            </div>

            {mostrarDetalles && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-3">Descripción de los Parámetros</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                        Tolerancia Retardo
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      Minutos de tolerancia antes de marcar como retardo después de la hora de entrada.
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="border-red-500 text-red-600">
                        Tolerancia Falta
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      Minutos de tolerancia antes de marcar como falta si no se registra entrada.
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="border-green-500 text-green-600">
                        Apertura Entrada
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      Minutos antes de la hora oficial para permitir el registro de entrada.
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="border-blue-500 text-blue-600">
                        Apertura Salida
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      Minutos antes de la hora oficial para permitir el registro de salida.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
