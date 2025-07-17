"use client"

import { Progress } from "@/components/ui/progress"

const departamentos = [
  {
    nombre: "Administración",
    asistencia: 95,
    retardos: 3,
    faltas: 2,
  },
  {
    nombre: "Recursos Humanos",
    asistencia: 98,
    retardos: 2,
    faltas: 0,
  },
  {
    nombre: "Contabilidad",
    asistencia: 92,
    retardos: 5,
    faltas: 3,
  },
  {
    nombre: "Sistemas",
    asistencia: 90,
    retardos: 7,
    faltas: 3,
  },
  {
    nombre: "Operaciones",
    asistencia: 88,
    retardos: 8,
    faltas: 4,
  },
]

export function ResumenAsistencia() {
  return (
    <div className="space-y-4">
      {departamentos.map((depto) => (
        <div key={depto.nombre} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{depto.nombre}</span>
            <span className="text-sm text-muted-foreground">{depto.asistencia}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={depto.asistencia} className="h-2" />
            <div className="flex gap-2 text-xs">
              <span className="text-yellow-500">{depto.retardos} R</span>
              <span className="text-red-500">{depto.faltas} F</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
