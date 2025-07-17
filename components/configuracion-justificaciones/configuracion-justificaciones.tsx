"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Settings, FileText, Shield, Users } from "lucide-react"
import { TiposJustificacionList } from "./tipos-justificacion-list"
import { NuevoTipoJustificacionDialog } from "./nuevo-tipo-justificacion-dialog"
import { RolesEspecialesList } from "./roles-especiales-list"
import { EstatusAsistenciaList } from "./estatus-asistencia-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { TipoJustificacion, RolEspecial, EstatusAsistencia } from "../justificaciones/justificaciones-manager"
import { tiposJustificacionEjemplo } from "../justificaciones/justificaciones-manager"

// Datos de ejemplo para roles especiales
const rolesEspecialesEjemplo: RolEspecial[] = [
  {
    id: 1,
    rh_personal_id: 1,
    exento_retardos: true,
    exento_faltas: false,
    requiere_registro: true,
    fecha_inicio: new Date("2025-01-01"),
    fecha_fin: new Date("2025-12-31"),
    motivo: "Gerente con horario flexible",
    created_at: new Date(),
    deleted: 0,
    updated_at: new Date(),
    usuario: 1,
    uuid: "rol-001",
    version: 1,
  },
  {
    id: 2,
    rh_personal_id: 5,
    exento_retardos: true,
    exento_faltas: true,
    requiere_registro: false,
    fecha_inicio: new Date("2025-01-01"),
    fecha_fin: new Date("2025-12-31"),
    motivo: "Desarrollador con trabajo remoto",
    created_at: new Date(),
    deleted: 0,
    updated_at: new Date(),
    usuario: 1,
    uuid: "rol-002",
    version: 1,
  },
]

// Datos de ejemplo para estatus de asistencia
const estatusAsistenciaEjemplo: EstatusAsistencia[] = [
  {
    id: 1,
    clave: "AST",
    nombre: "Asistencia",
    descripcion: "Asistencia normal",
    es_falta: false,
    es_retardo: false,
    created_at: new Date(),
    deleted: 0,
    updated_at: new Date(),
    usuario: 1,
    uuid: "est-001",
    version: 1,
  },
  {
    id: 2,
    clave: "RET",
    nombre: "Retardo",
    descripcion: "Llegada tardía",
    es_falta: false,
    es_retardo: true,
    created_at: new Date(),
    deleted: 0,
    updated_at: new Date(),
    usuario: 1,
    uuid: "est-002",
    version: 1,
  },
  {
    id: 3,
    clave: "FLT",
    nombre: "Falta",
    descripcion: "Ausencia sin justificación",
    es_falta: true,
    es_retardo: false,
    created_at: new Date(),
    deleted: 0,
    updated_at: new Date(),
    usuario: 1,
    uuid: "est-003",
    version: 1,
  },
  {
    id: 4,
    clave: "JUS",
    nombre: "Justificada",
    descripcion: "Ausencia justificada",
    es_falta: false,
    es_retardo: false,
    created_at: new Date(),
    deleted: 0,
    updated_at: new Date(),
    usuario: 1,
    uuid: "est-004",
    version: 1,
  },
]

export function ConfiguracionJustificaciones() {
  const [searchTerm, setSearchTerm] = useState("")
  const [tiposJustificacion, setTiposJustificacion] = useState<TipoJustificacion[]>(tiposJustificacionEjemplo)
  const [rolesEspeciales, setRolesEspeciales] = useState<RolEspecial[]>(rolesEspecialesEjemplo)
  const [estatusAsistencia, setEstatusAsistencia] = useState<EstatusAsistencia[]>(estatusAsistenciaEjemplo)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTipo, setEditingTipo] = useState<TipoJustificacion | null>(null)

  // Filtrar tipos según el término de búsqueda
  const tiposFiltrados = tiposJustificacion.filter(
    (tipo) =>
      tipo.deleted === 0 &&
      (tipo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tipo.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Agregar nuevo tipo
  const handleAgregarTipo = (nuevoTipo: Omit<TipoJustificacion, "id" | "created_at" | "updated_at">) => {
    const tipo: TipoJustificacion = {
      ...nuevoTipo,
      id: Math.max(...tiposJustificacion.map((t) => t.id)) + 1,
      created_at: new Date(),
      updated_at: new Date(),
    }
    setTiposJustificacion([...tiposJustificacion, tipo])
    setDialogOpen(false)
    setEditingTipo(null)
  }

  // Editar tipo existente
  const handleEditarTipo = (tipoActualizado: TipoJustificacion) => {
    setTiposJustificacion(
      tiposJustificacion.map((t) =>
        t.id === tipoActualizado.id
          ? {
              ...tipoActualizado,
              updated_at: new Date(),
            }
          : t,
      ),
    )
    setDialogOpen(false)
    setEditingTipo(null)
  }

  // Eliminar tipo (soft delete)
  const handleEliminarTipo = (id: number) => {
    setTiposJustificacion(
      tiposJustificacion.map((t) =>
        t.id === id
          ? {
              ...t,
              deleted: 1,
              updated_at: new Date(),
            }
          : t,
      ),
    )
  }

  // Abrir dialog para editar
  const handleAbrirEdicion = (tipo: TipoJustificacion) => {
    setEditingTipo(tipo)
    setDialogOpen(true)
  }

  // Abrir dialog para nuevo
  const handleAbrirNuevo = () => {
    setEditingTipo(null)
    setDialogOpen(true)
  }

  // Calcular estadísticas
  const tiposActivos = tiposFiltrados.filter((t) => t.deleted === 0)
  const totalTipos = tiposActivos.length
  const tiposConOficio = tiposActivos.filter((t) => t.requiere_oficio).length
  const tiposSinOficio = tiposActivos.filter((t) => !t.requiere_oficio).length
  const rolesActivos = rolesEspeciales.filter((r) => r.deleted === 0).length

  return (
    <div className="space-y-6">
      {/* Estadísticas generales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipos de Justificación</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTipos}</div>
            <p className="text-xs text-muted-foreground">Configurados en el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requieren Oficio</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tiposConOficio}</div>
            <p className="text-xs text-muted-foreground">Con documentación obligatoria</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Oficio</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tiposSinOficio}</div>
            <p className="text-xs text-muted-foreground">Sin documentación requerida</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles Especiales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rolesActivos}</div>
            <p className="text-xs text-muted-foreground">Empleados con roles especiales</p>
          </CardContent>
        </Card>
      </div>

      {/* Pestañas de configuración */}
      <Tabs defaultValue="tipos-justificacion" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tipos-justificacion">
            <FileText className="h-4 w-4 mr-1" />
            Tipos de Justificación
          </TabsTrigger>
          <TabsTrigger value="roles-especiales">
            <Shield className="h-4 w-4 mr-1" />
            Roles Especiales
          </TabsTrigger>
          <TabsTrigger value="estatus-asistencia">
            <Settings className="h-4 w-4 mr-1" />
            Estatus de Asistencia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tipos-justificacion" className="space-y-4">
          {/* Controles para tipos de justificación */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar tipos de justificación..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={handleAbrirNuevo}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Tipo de Justificación
            </Button>
          </div>

          {/* Lista de tipos */}
          <TiposJustificacionList
            tipos={tiposFiltrados}
            onEditar={handleAbrirEdicion}
            onEliminar={handleEliminarTipo}
          />
        </TabsContent>

        <TabsContent value="roles-especiales" className="space-y-4">
          <RolesEspecialesList roles={rolesEspeciales} />
        </TabsContent>

        <TabsContent value="estatus-asistencia" className="space-y-4">
          <EstatusAsistenciaList estatus={estatusAsistencia} />
        </TabsContent>
      </Tabs>

      {/* Dialog para nuevo/editar tipo */}
      <NuevoTipoJustificacionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onGuardar={editingTipo ? handleEditarTipo : handleAgregarTipo}
        tipoInicial={editingTipo}
      />
    </div>
  )
}
