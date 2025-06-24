"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowDownCircle, ArrowUpCircle, ChevronLeft, ChevronRight } from "lucide-react"

const registros = [
  {
    id: 1,
    empleado: "Juan Pérez",
    tipo: "entrada",
    hora: "08:02",
    fecha: "14/05/2025",
    estatus: "a tiempo",
  },
  {
    id: 2,
    empleado: "María López",
    tipo: "entrada",
    hora: "08:15",
    fecha: "14/05/2025",
    estatus: "retardo",
  },
  {
    id: 3,
    empleado: "Carlos Rodríguez",
    tipo: "entrada",
    hora: "08:00",
    fecha: "14/05/2025",
    estatus: "a tiempo",
  },
  {
    id: 4,
    empleado: "Ana Martínez",
    tipo: "salida",
    hora: "17:00",
    fecha: "13/05/2025",
    estatus: "a tiempo",
  },
  {
    id: 5,
    empleado: "Roberto Sánchez",
    tipo: "salida",
    hora: "16:45",
    fecha: "13/05/2025",
    estatus: "anticipada",
  },
]

export function RegistrosList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Registros Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead className="hidden md:table-cell">Fecha</TableHead>
                <TableHead>Estatus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registros.map((registro) => (
                <TableRow key={registro.id}>
                  <TableCell className="font-medium">{registro.empleado}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {registro.tipo === "entrada" ? (
                        <>
                          <ArrowDownCircle className="h-4 w-4 text-green-500" />
                          <span className="hidden md:inline">Entrada</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpCircle className="h-4 w-4 text-blue-500" />
                          <span className="hidden md:inline">Salida</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{registro.hora}</TableCell>
                  <TableCell className="hidden md:table-cell">{registro.fecha}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        registro.estatus === "a tiempo"
                          ? "border-green-500 text-green-500"
                          : registro.estatus === "retardo"
                            ? "border-yellow-500 text-yellow-500"
                            : "border-blue-500 text-blue-500"
                      }
                    >
                      {registro.estatus}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-end space-x-2 py-4 px-4 border-t">
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button variant="outline" size="sm">
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
