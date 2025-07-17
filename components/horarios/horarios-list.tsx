"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  MoreHorizontal,
  Search,
  Edit,
  Trash2,
  Copy,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const horarios = [
  {
    id: 1,
    nombre: "Horario Administrativo",
    codigo: "ADMIN",
    descripcion: "Lunes a Viernes 8:00 - 17:00",
    toleranciaRetardo: 15,
    toleranciaFalta: 30,
    activo: true,
    tipo: "Normal",
    personalAsignado: 120,
    inicioVigencia: "01/01/2025",
    finVigencia: "31/12/2025",
  },
  {
    id: 2,
    nombre: "Horario Operativo",
    codigo: "OPER",
    descripcion: "Lunes a Sábado 7:00 - 16:00",
    toleranciaRetardo: 10,
    toleranciaFalta: 20,
    activo: true,
    tipo: "Normal",
    personalAsignado: 85,
    inicioVigencia: "01/01/2025",
    finVigencia: "31/12/2025",
  },
  {
    id: 3,
    nombre: "Horario Ejecutivo",
    codigo: "EJEC",
    descripcion: "Lunes a Viernes 9:00 - 18:00",
    toleranciaRetardo: 20,
    toleranciaFalta: 40,
    activo: true,
    tipo: "Flexible",
    personalAsignado: 15,
    inicioVigencia: "01/01/2025",
    finVigencia: "31/12/2025",
  },
  {
    id: 4,
    nombre: "Horario Nocturno",
    codigo: "NOCT",
    descripcion: "Lunes a Viernes 22:00 - 6:00",
    toleranciaRetardo: 10,
    toleranciaFalta: 20,
    activo: true,
    tipo: "Especial",
    personalAsignado: 25,
    inicioVigencia: "01/01/2025",
    finVigencia: "31/12/2025",
  },
  {
    id: 5,
    nombre: "Horario Fin de Semana",
    codigo: "FINDE",
    descripcion: "Sábado y Domingo 8:00 - 20:00",
    toleranciaRetardo: 15,
    toleranciaFalta: 30,
    activo: false,
    tipo: "Especial",
    personalAsignado: 0,
    inicioVigencia: "01/01/2025",
    finVigencia: "31/12/2025",
  },
]

export function HorariosList() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredHorarios = horarios.filter(
    (horario) =>
      horario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      horario.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      horario.descripcion.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Listado de Horarios</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nombre o código..."
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
                <TableHead className="hidden md:table-cell">Código</TableHead>
                <TableHead className="hidden md:table-cell">Descripción</TableHead>
                <TableHead className="hidden md:table-cell">Tolerancia Retardo</TableHead>
                <TableHead className="hidden md:table-cell">Tolerancia Falta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHorarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No se encontraron resultados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredHorarios.map((horario) => (
                  <TableRow key={horario.id}>
                    <TableCell className="font-medium">{horario.nombre}</TableCell>
                    <TableCell className="hidden md:table-cell">{horario.codigo}</TableCell>
                    <TableCell className="hidden md:table-cell">{horario.descripcion}</TableCell>
                    <TableCell className="hidden md:table-cell">{horario.toleranciaRetardo} min</TableCell>
                    <TableCell className="hidden md:table-cell">{horario.toleranciaFalta} min</TableCell>
                    <TableCell>
                      <Badge
                        variant={horario.activo ? "default" : "secondary"}
                        className={horario.activo ? "bg-green-500 hover:bg-green-600" : ""}
                      >
                        {horario.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Abrir menú</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Link href={`/horarios/${horario.id}`} className="flex items-center">
                              <Eye className="mr-2 h-4 w-4" />
                              <span>Ver detalles</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link href={`/horarios/${horario.id}/editar`} className="flex items-center">
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Editar horario</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link href={`/horarios/${horario.id}/detalle`} className="flex items-center">
                              <Clock className="mr-2 h-4 w-4" />
                              <span>Editar detalle</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link href={`/horarios/${horario.id}/asignar`} className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4" />
                              <span>Asignar a personal</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            <span>Duplicar</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Eliminar</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
