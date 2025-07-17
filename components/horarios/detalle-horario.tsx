"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

const detalleHorario = [
  {
    dia: "Lunes",
    entrada: "08:00",
    salida: "17:00",
    comidaInicio: "13:00",
    comidaFin: "14:00",
    horasTrabajo: 8,
  },
  {
    dia: "Martes",
    entrada: "08:00",
    salida: "17:00",
    comidaInicio: "13:00",
    comidaFin: "14:00",
    horasTrabajo: 8,
  },
  {
    dia: "Miércoles",
    entrada: "08:00",
    salida: "17:00",
    comidaInicio: "13:00",
    comidaFin: "14:00",
    horasTrabajo: 8,
  },
  {
    dia: "Jueves",
    entrada: "08:00",
    salida: "17:00",
    comidaInicio: "13:00",
    comidaFin: "14:00",
    horasTrabajo: 8,
  },
  {
    dia: "Viernes",
    entrada: "08:00",
    salida: "17:00",
    comidaInicio: "13:00",
    comidaFin: "14:00",
    horasTrabajo: 8,
  },
  {
    dia: "Sábado",
    entrada: "N/A",
    salida: "N/A",
    comidaInicio: "N/A",
    comidaFin: "N/A",
    horasTrabajo: 0,
  },
  {
    dia: "Domingo",
    entrada: "N/A",
    salida: "N/A",
    comidaInicio: "N/A",
    comidaFin: "N/A",
    horasTrabajo: 0,
  },
]

export function DetalleHorario() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalle por Día</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Día</TableHead>
              <TableHead>Entrada</TableHead>
              <TableHead>Salida</TableHead>
              <TableHead className="hidden md:table-cell">Comida Inicio</TableHead>
              <TableHead className="hidden md:table-cell">Comida Fin</TableHead>
              <TableHead>Horas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detalleHorario.map((detalle) => (
              <TableRow key={detalle.dia} className={detalle.horasTrabajo === 0 ? "text-muted-foreground" : ""}>
                <TableCell className="font-medium">{detalle.dia}</TableCell>
                <TableCell>{detalle.entrada}</TableCell>
                <TableCell>{detalle.salida}</TableCell>
                <TableCell className="hidden md:table-cell">{detalle.comidaInicio}</TableCell>
                <TableCell className="hidden md:table-cell">{detalle.comidaFin}</TableCell>
                <TableCell>{detalle.horasTrabajo}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-medium">
              <TableCell>Total Semanal</TableCell>
              <TableCell colSpan={4}></TableCell>
              <TableCell>40</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
