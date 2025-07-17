"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, XCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { EstatusAsistencia } from "../justificaciones/justificaciones-manager"

interface EstatusAsistenciaListProps {
  estatus: EstatusAsistencia[]
}

export function EstatusAsistenciaList({ estatus }: EstatusAsistenciaListProps) {
  const estatusActivos = estatus.filter((e) => e.deleted === 0)

  const getIconForEstatus = (estatus: EstatusAsistencia) => {
    if (estatus.es_falta) return <XCircle className="h-4 w-4 text-red-500" />
    if (estatus.es_retardo) return <Clock className="h-4 w-4 text-yellow-500" />
    return <CheckCircle className="h-4 w-4 text-green-500" />
  }

  const getBadgeVariant = (estatus: EstatusAsistencia) => {
    if (estatus.es_falta) return "destructive"
    if (estatus.es_retardo) return "outline"
    return "default"
  }

  const getBadgeColor = (estatus: EstatusAsistencia) => {
    if (estatus.es_falta) return ""
    if (estatus.es_retardo) return "border-yellow-500 text-yellow-600"
    return "bg-green-500 hover:bg-green-600"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Estatus de Asistencia</h3>
        <p className="text-sm text-muted-foreground">Estados disponibles para los registros de asistencia</p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clave</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fecha Creación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estatusActivos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No hay estatus de asistencia configurados.
                </TableCell>
              </TableRow>
            ) : (
              estatusActivos.map((est) => (
                <TableRow key={est.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getIconForEstatus(est)}
                      <span className="font-mono font-medium">{est.clave}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{est.nombre}</div>
                    <div className="text-xs text-muted-foreground">ID: {est.id}</div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px] truncate text-sm text-muted-foreground" title={est.descripcion}>
                      {est.descripcion || "Sin descripción"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={getBadgeVariant(est)} className={getBadgeColor(est)}>
                        {est.es_falta ? "Falta" : est.es_retardo ? "Retardo" : "Normal"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {format(est.created_at, "dd/MM/yyyy", { locale: es })}
                    </div>
                    <div className="text-xs text-muted-foreground">v{est.version || 1}</div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
