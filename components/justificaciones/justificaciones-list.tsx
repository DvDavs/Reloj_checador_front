"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, FileText, Download, Trash2, Calendar, User, Users, Building } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Justificacion } from "./justificaciones-manager"

interface JustificacionesListProps {
  justificaciones: Justificacion[]
  onEliminar: (id: number) => void
}

export function JustificacionesList({ justificaciones, onEliminar }: JustificacionesListProps) {
  const handleEliminar = (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta justificación?")) {
      onEliminar(id)
    }
  }

  const calcularDias = (fechaInicio: Date, fechaFin: Date) => {
    const diffTime = Math.abs(fechaFin.getTime() - fechaInicio.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empleado/Departamento</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Días</TableHead>
            <TableHead>Oficio</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {justificaciones.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No se encontraron justificaciones.
              </TableCell>
            </TableRow>
          ) : (
            justificaciones.map((justificacion) => (
              <TableRow key={justificacion.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {justificacion.es_masiva ? (
                      <>
                        <Building className="h-4 w-4 text-blue-500" />
                        <div>
                          <div className="font-medium text-blue-600">Justificación Masiva</div>
                          <div className="text-sm text-muted-foreground">
                            Departamento: {justificacion.departamento?.nombre || "Sin departamento"}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{justificacion.empleado?.nombre || "Sin asignar"}</div>
                          <div className="text-sm text-muted-foreground">
                            {justificacion.empleado?.departamento || "Sin departamento"}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline" className="w-fit">
                      {justificacion.tipo_justificacion.nombre}
                    </Badge>
                    {justificacion.es_masiva && (
                      <Badge variant="default" className="w-fit text-xs bg-blue-500 hover:bg-blue-600">
                        <Users className="h-3 w-3 mr-1" />
                        Masiva
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>
                      {format(justificacion.fecha_inicio, "dd/MM/yyyy", { locale: es })} -{" "}
                      {format(justificacion.fecha_fin, "dd/MM/yyyy", { locale: es })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {calcularDias(justificacion.fecha_inicio, justificacion.fecha_fin)} días
                  </Badge>
                </TableCell>
                <TableCell>
                  {justificacion.tipo_justificacion.requiere_oficio ? (
                    justificacion.num_oficio ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                          <FileText className="h-3 w-3 mr-1" />
                          {justificacion.num_oficio}
                        </Badge>
                      </div>
                    ) : (
                      <Badge variant="destructive">
                        <FileText className="h-3 w-3 mr-1" />
                        Pendiente
                      </Badge>
                    )
                  ) : (
                    <Badge variant="secondary">No requerido</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate text-sm" title={justificacion.motivo}>
                    {justificacion.motivo || "Sin motivo especificado"}
                  </div>
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
                      {justificacion.num_oficio && (
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          <span>Descargar archivo</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Ver detalles</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => handleEliminar(justificacion.id)}>
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
    </div>
  )
}
