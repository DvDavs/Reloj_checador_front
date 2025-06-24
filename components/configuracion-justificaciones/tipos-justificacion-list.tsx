"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Edit, Trash2, FileText, FileX } from "lucide-react"
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
import type { TipoJustificacion } from "../justificaciones/justificaciones-manager"

interface TiposJustificacionListProps {
  tipos: TipoJustificacion[]
  onEditar: (tipo: TipoJustificacion) => void
  onEliminar: (id: number) => void
}

export function TiposJustificacionList({ tipos, onEditar, onEliminar }: TiposJustificacionListProps) {
  const handleEliminar = (id: number, nombre: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el tipo "${nombre}"?`)) {
      onEliminar(id)
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Requiere Oficio</TableHead>
            <TableHead>Fecha Creación</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tipos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No se encontraron tipos de justificación.
              </TableCell>
            </TableRow>
          ) : (
            tipos.map((tipo) => (
              <TableRow key={tipo.id}>
                <TableCell>
                  <div className="font-medium">{tipo.nombre}</div>
                  <div className="text-xs text-muted-foreground">ID: {tipo.id}</div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[300px] truncate text-sm text-muted-foreground" title={tipo.descripcion}>
                    {tipo.descripcion || "Sin descripción"}
                  </div>
                </TableCell>
                <TableCell>
                  {tipo.requiere_oficio ? (
                    <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
                      <FileText className="h-3 w-3 mr-1" />
                      Sí requiere
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <FileX className="h-3 w-3 mr-1" />
                      No requiere
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {format(tipo.created_at, "dd/MM/yyyy HH:mm", { locale: es })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">Usuario: {tipo.usuario || "N/A"}</div>
                  <div className="text-xs text-muted-foreground">v{tipo.version || 1}</div>
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
                      <DropdownMenuItem onClick={() => onEditar(tipo)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => handleEliminar(tipo.id, tipo.nombre)}>
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
