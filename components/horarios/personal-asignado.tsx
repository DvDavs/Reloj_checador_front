"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, ChevronLeft, ChevronRight, Calendar, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

const personal = [
  {
    id: 1,
    nombre: "Juan Pérez López",
    departamento: "Administración",
    puesto: "Gerente",
    fechaInicio: "01/01/2025",
    fechaFin: "31/12/2025",
    activo: true,
  },
  {
    id: 2,
    nombre: "María Rodríguez Gómez",
    departamento: "Recursos Humanos",
    puesto: "Coordinador",
    fechaInicio: "01/01/2025",
    fechaFin: "31/12/2025",
    activo: true,
  },
  {
    id: 3,
    nombre: "Carlos Sánchez Vega",
    departamento: "Contabilidad",
    puesto: "Contador",
    fechaInicio: "01/01/2025",
    fechaFin: "31/12/2025",
    activo: true,
  },
  {
    id: 4,
    nombre: "Ana Martínez Ruiz",
    departamento: "Administración",
    puesto: "Asistente",
    fechaInicio: "01/01/2025",
    fechaFin: "31/12/2025",
    activo: true,
  },
  {
    id: 5,
    nombre: "Roberto González Torres",
    departamento: "Sistemas",
    puesto: "Desarrollador",
    fechaInicio: "01/01/2025",
    fechaFin: "31/12/2025",
    activo: true,
  },
]

export function PersonalAsignado() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredPersonal = personal.filter(
    (persona) =>
      persona.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      persona.departamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      persona.puesto.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Personal con este Horario</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar personal..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Departamento</TableHead>
                <TableHead className="hidden md:table-cell">Puesto</TableHead>
                <TableHead className="hidden lg:table-cell">Fecha Inicio</TableHead>
                <TableHead className="hidden lg:table-cell">Fecha Fin</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPersonal.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No se encontraron resultados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPersonal.map((persona) => (
                  <TableRow key={persona.id}>
                    <TableCell className="font-medium">{persona.nombre}</TableCell>
                    <TableCell className="hidden md:table-cell">{persona.departamento}</TableCell>
                    <TableCell className="hidden md:table-cell">{persona.puesto}</TableCell>
                    <TableCell className="hidden lg:table-cell">{persona.fechaInicio}</TableCell>
                    <TableCell className="hidden lg:table-cell">{persona.fechaFin}</TableCell>
                    <TableCell>
                      <Badge
                        variant={persona.activo ? "default" : "secondary"}
                        className={persona.activo ? "bg-green-500 hover:bg-green-600" : ""}
                      >
                        {persona.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/personal/${persona.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Ver detalles</span>
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon">
                          <Calendar className="h-4 w-4" />
                          <span className="sr-only">Ver asignaciones</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
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
