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
import { MoreHorizontal, Search, Edit, Trash2, Eye, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const personal = [
  {
    id: 1,
    nombre: "Juan Pérez López",
    rfc: "PELJ850512ABC",
    curp: "PELJ850512HDFRZN01",
    departamento: "Administración",
    puesto: "Gerente",
    fechaIngreso: "01/01/2020",
    activo: true,
  },
  {
    id: 2,
    nombre: "María Rodríguez Gómez",
    rfc: "ROGM780623DEF",
    curp: "ROGM780623MDFDRR05",
    departamento: "Recursos Humanos",
    puesto: "Coordinador",
    fechaIngreso: "15/03/2019",
    activo: true,
  },
  {
    id: 3,
    nombre: "Carlos Sánchez Vega",
    rfc: "SAVC900214GHI",
    curp: "SAVC900214HDFNGR09",
    departamento: "Contabilidad",
    puesto: "Contador",
    fechaIngreso: "10/05/2021",
    activo: true,
  },
  {
    id: 4,
    nombre: "Ana Martínez Ruiz",
    rfc: "MARA881107JKL",
    curp: "MARA881107MDFRZN03",
    departamento: "Administración",
    puesto: "Asistente",
    fechaIngreso: "20/02/2022",
    activo: true,
  },
  {
    id: 5,
    nombre: "Roberto González Torres",
    rfc: "GOTR750830MNO",
    curp: "GOTR750830HDFNRB07",
    departamento: "Sistemas",
    puesto: "Desarrollador",
    fechaIngreso: "05/09/2018",
    activo: false,
  },
]

export function PersonalList() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredPersonal = personal.filter(
    (persona) =>
      persona.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      persona.rfc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      persona.curp.toLowerCase().includes(searchTerm.toLowerCase()) ||
      persona.departamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      persona.puesto.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Listado de Personal</CardTitle>
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
                <TableHead className="hidden md:table-cell">RFC</TableHead>
                <TableHead className="hidden lg:table-cell">CURP</TableHead>
                <TableHead className="hidden md:table-cell">Departamento</TableHead>
                <TableHead className="hidden lg:table-cell">Puesto</TableHead>
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
                    <TableCell className="hidden md:table-cell">{persona.rfc}</TableCell>
                    <TableCell className="hidden lg:table-cell">{persona.curp}</TableCell>
                    <TableCell className="hidden md:table-cell">{persona.departamento}</TableCell>
                    <TableCell className="hidden lg:table-cell">{persona.puesto}</TableCell>
                    <TableCell>
                      <Badge
                        variant={persona.activo ? "default" : "secondary"}
                        className={persona.activo ? "bg-green-500 hover:bg-green-600" : ""}
                      >
                        {persona.activo ? "Activo" : "Inactivo"}
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
                            <Link href={`/personal/${persona.id}`} className="flex items-center">
                              <Eye className="mr-2 h-4 w-4" />
                              <span>Ver detalles</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link href={`/personal/${persona.id}/editar`} className="flex items-center">
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Editar</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link
                              href={`/asignacion-horarios/nuevo?personal=${persona.id}`}
                              className="flex items-center"
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              <span>Asignar Horario</span>
                            </Link>
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
