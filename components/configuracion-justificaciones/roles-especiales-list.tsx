"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Shield, Clock, AlertTriangle, User } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { RolEspecial } from "../justificaciones/justificaciones-manager"

interface RolesEspecialesListProps {
  roles: RolEspecial[]
}

export function RolesEspecialesList({ roles }: RolesEspecialesListProps) {
  const rolesActivos = roles.filter((r) => r.deleted === 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Roles Especiales</h3>
        <p className="text-sm text-muted-foreground">Empleados con configuraciones especiales de asistencia</p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empleado</TableHead>
              <TableHead>Exenciones</TableHead>
              <TableHead>Requiere Registro</TableHead>
              <TableHead>Vigencia</TableHead>
              <TableHead>Motivo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rolesActivos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No hay roles especiales configurados.
                </TableCell>
              </TableRow>
            ) : (
              rolesActivos.map((rol) => (
                <TableRow key={rol.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">ID: {rol.rh_personal_id}</div>
                        <div className="text-xs text-muted-foreground">Rol ID: {rol.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {rol.exento_retardos && (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                          <Clock className="h-3 w-3 mr-1" />
                          Sin retardos
                        </Badge>
                      )}
                      {rol.exento_faltas && (
                        <Badge variant="outline" className="border-red-500 text-red-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Sin faltas
                        </Badge>
                      )}
                      {!rol.exento_retardos && !rol.exento_faltas && <Badge variant="secondary">Sin exenciones</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {rol.requiere_registro ? (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        <Shield className="h-3 w-3 mr-1" />
                        Sí requiere
                      </Badge>
                    ) : (
                      <Badge variant="secondary">No requiere</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {rol.fecha_inicio && rol.fecha_fin ? (
                        <>
                          <div>{format(rol.fecha_inicio, "dd/MM/yyyy", { locale: es })}</div>
                          <div className="text-muted-foreground">
                            hasta {format(rol.fecha_fin, "dd/MM/yyyy", { locale: es })}
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Sin fechas definidas</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate text-sm" title={rol.motivo}>
                      {rol.motivo || "Sin motivo especificado"}
                    </div>
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
