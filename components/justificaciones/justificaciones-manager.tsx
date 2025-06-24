"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, FileText, Calendar, AlertTriangle, Building } from "lucide-react"
import { JustificacionesList } from "./justificaciones-list"
import { NuevaJustificacionDialog } from "./nueva-justificacion-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Tipos basados EXACTAMENTE en las tablas de la base de datos
export type TipoJustificacion = {
  id: number
  created_at: Date
  deleted: number
  updated_at: Date
  usuario?: number
  uuid?: string
  version?: number
  descripcion?: string
  nombre: string
  requiere_oficio: boolean
}

export type Justificacion = {
  id: number
  created_at: Date
  deleted: number
  updated_at: Date
  usuario?: number
  uuid?: string
  version?: number
  departamento_id?: number
  es_masiva: boolean
  fecha_fin: Date
  fecha_inicio: Date
  motivo?: string
  num_oficio?: string
  rh_personal_id?: number
  tipo_justificacion_id: number
  // Datos unidos para la vista
  empleado?: Empleado
  tipo_justificacion: TipoJustificacion
}

export type RolEspecial = {
  id: number
  rh_personal_id: number
  exento_retardos: boolean
  exento_faltas: boolean
  requiere_registro: boolean
  fecha_inicio?: Date
  fecha_fin?: Date
  motivo?: string
  created_at: Date
  deleted: number
  updated_at: Date
  usuario?: number
  uuid?: string
  version?: number
}

export type EstatusAsistencia = {
  id: number
  clave: string
  nombre: string
  descripcion?: string
  es_falta: boolean
  es_retardo: boolean
  created_at: Date
  deleted: number
  updated_at: Date
  usuario?: number
  uuid?: string
  version?: number
}

export type RegistroAsistencia = {
  id: number
  rh_personal_id: number
  fecha: Date
  horario_asignado_id: number
  detalle_horario_id?: number
  hora_entrada_programada: string // TIME
  hora_salida_programada: string // TIME
  entrada_id?: number
  salida_id?: number
  hora_entrada_real?: Date
  hora_salida_real?: Date
  estatus_id?: number
  minutos_retardo?: number
  horas_trabajadas?: number
  justificacion_id?: number
  observaciones?: string
  created_at: Date
  deleted: number
  updated_at: Date
  usuario?: number
  uuid?: string
  version?: number
}

export type Empleado = {
  id: number
  nombre: string
  departamento: string
  puesto: string
}

export type Departamento = {
  id: number
  nombre: string
  descripcion?: string
}

// Datos de ejemplo basados en la estructura real de BD
const tiposJustificacionEjemplo: TipoJustificacion[] = [
  {
    id: 1,
    nombre: "Incapacidad Médica",
    descripcion: "Justificación por enfermedad o accidente con dictamen médico oficial",
    requiere_oficio: true,
    created_at: new Date("2025-01-01T08:00:00"),
    updated_at: new Date("2025-01-01T08:00:00"),
    deleted: 0,
    usuario: 1,
    uuid: "tipo-inc-001",
    version: 1,
  },
  {
    id: 2,
    nombre: "Permiso Personal",
    descripcion: "Permiso por asuntos personales urgentes e impostergables",
    requiere_oficio: false,
    created_at: new Date("2025-01-01T08:00:00"),
    updated_at: new Date("2025-01-01T08:00:00"),
    deleted: 0,
    usuario: 1,
    uuid: "tipo-per-002",
    version: 1,
  },
  {
    id: 3,
    nombre: "Comisión Oficial",
    descripcion: "Comisión de trabajo fuera de las instalaciones por actividades laborales",
    requiere_oficio: true,
    created_at: new Date("2025-01-01T08:00:00"),
    updated_at: new Date("2025-01-01T08:00:00"),
    deleted: 0,
    usuario: 1,
    uuid: "tipo-com-003",
    version: 1,
  },
  {
    id: 4,
    nombre: "Vacaciones",
    descripcion: "Período vacacional autorizado según calendario anual",
    requiere_oficio: false,
    created_at: new Date("2025-01-01T08:00:00"),
    updated_at: new Date("2025-01-01T08:00:00"),
    deleted: 0,
    usuario: 1,
    uuid: "tipo-vac-004",
    version: 1,
  },
  {
    id: 5,
    nombre: "Licencia de Maternidad",
    descripcion: "Licencia por maternidad según disposiciones legales vigentes",
    requiere_oficio: true,
    created_at: new Date("2025-01-01T08:00:00"),
    updated_at: new Date("2025-01-01T08:00:00"),
    deleted: 0,
    usuario: 1,
    uuid: "tipo-mat-005",
    version: 1,
  },
  {
    id: 6,
    nombre: "Capacitación",
    descripcion: "Asistencia a cursos, seminarios o capacitaciones autorizadas",
    requiere_oficio: true,
    created_at: new Date("2025-01-01T08:00:00"),
    updated_at: new Date("2025-01-01T08:00:00"),
    deleted: 0,
    usuario: 1,
    uuid: "tipo-cap-006",
    version: 1,
  },
]

const empleadosEjemplo: Empleado[] = [
  { id: 1, nombre: "Juan Pérez López", departamento: "Administración", puesto: "Gerente General" },
  { id: 2, nombre: "María Rodríguez Gómez", departamento: "Recursos Humanos", puesto: "Coordinador de RH" },
  { id: 3, nombre: "Carlos Sánchez Vega", departamento: "Contabilidad", puesto: "Contador Público" },
  { id: 4, nombre: "Ana Martínez Ruiz", departamento: "Administración", puesto: "Asistente Administrativo" },
  { id: 5, nombre: "Roberto González Torres", departamento: "Sistemas", puesto: "Desarrollador Senior" },
  { id: 6, nombre: "Laura Fernández Castro", departamento: "Ventas", puesto: "Ejecutivo de Ventas" },
  { id: 7, nombre: "Miguel Ángel Díaz", departamento: "Producción", puesto: "Supervisor de Producción" },
  { id: 8, nombre: "Patricia Navarro Ramos", departamento: "Recursos Humanos", puesto: "Analista de Nómina" },
  { id: 9, nombre: "Fernando López Herrera", departamento: "Mantenimiento", puesto: "Técnico en Mantenimiento" },
  { id: 10, nombre: "Sofía Morales Jiménez", departamento: "Calidad", puesto: "Inspector de Calidad" },
]

const departamentosEjemplo: Departamento[] = [
  { id: 1, nombre: "Administración", descripcion: "Departamento de administración general" },
  { id: 2, nombre: "Recursos Humanos", descripcion: "Gestión del capital humano" },
  { id: 3, nombre: "Contabilidad", descripcion: "Área contable y financiera" },
  { id: 4, nombre: "Sistemas", descripcion: "Tecnologías de la información" },
  { id: 5, nombre: "Ventas", descripcion: "Área comercial y ventas" },
  { id: 6, nombre: "Producción", descripcion: "Área de producción y manufactura" },
  { id: 7, nombre: "Mantenimiento", descripcion: "Mantenimiento de equipos e instalaciones" },
  { id: 8, nombre: "Calidad", descripcion: "Control y aseguramiento de calidad" },
]

const justificacionesEjemplo: Justificacion[] = [
  {
    id: 1,
    rh_personal_id: 1,
    tipo_justificacion_id: 1,
    fecha_inicio: new Date("2025-01-15"),
    fecha_fin: new Date("2025-01-17"),
    motivo: "Gripe estacional con reposo médico de 3 días según dictamen del IMSS",
    num_oficio: "INC-2025-001",
    es_masiva: false,
    departamento_id: undefined,
    created_at: new Date("2025-01-14T10:30:00"),
    updated_at: new Date("2025-01-14T10:30:00"),
    deleted: 0,
    usuario: 2,
    uuid: "just-inc-001",
    version: 1,
    empleado: empleadosEjemplo[0],
    tipo_justificacion: tiposJustificacionEjemplo[0],
  },
  {
    id: 2,
    rh_personal_id: 2,
    tipo_justificacion_id: 2,
    fecha_inicio: new Date("2025-01-20"),
    fecha_fin: new Date("2025-01-20"),
    motivo: "Trámites bancarios urgentes para crédito hipotecario",
    es_masiva: false,
    departamento_id: undefined,
    created_at: new Date("2025-01-19T14:15:00"),
    updated_at: new Date("2025-01-19T14:15:00"),
    deleted: 0,
    usuario: 2,
    uuid: "just-per-002",
    version: 1,
    empleado: empleadosEjemplo[1],
    tipo_justificacion: tiposJustificacionEjemplo[1],
  },
  {
    id: 3,
    rh_personal_id: 3,
    tipo_justificacion_id: 3,
    fecha_inicio: new Date("2025-01-22"),
    fecha_fin: new Date("2025-01-24"),
    motivo: "Capacitación en normatividad fiscal 2025 en Ciudad de México",
    num_oficio: "COM-2025-003",
    es_masiva: false,
    departamento_id: undefined,
    created_at: new Date("2025-01-20T09:00:00"),
    updated_at: new Date("2025-01-20T09:00:00"),
    deleted: 0,
    usuario: 1,
    uuid: "just-com-003",
    version: 1,
    empleado: empleadosEjemplo[2],
    tipo_justificacion: tiposJustificacionEjemplo[2],
  },
  {
    id: 4,
    rh_personal_id: undefined,
    tipo_justificacion_id: 4,
    fecha_inicio: new Date("2025-02-01"),
    fecha_fin: new Date("2025-02-07"),
    motivo: "Vacaciones colectivas de fin de año para todo el departamento de administración",
    es_masiva: true,
    departamento_id: 1,
    created_at: new Date("2025-01-25T16:00:00"),
    updated_at: new Date("2025-01-25T16:00:00"),
    deleted: 0,
    usuario: 1,
    uuid: "just-vac-004",
    version: 1,
    tipo_justificacion: tiposJustificacionEjemplo[3],
  },
  {
    id: 5,
    rh_personal_id: 6,
    tipo_justificacion_id: 6,
    fecha_inicio: new Date("2025-01-28"),
    fecha_fin: new Date("2025-01-30"),
    motivo: "Seminario de técnicas de ventas y atención al cliente",
    num_oficio: "CAP-2025-001",
    es_masiva: false,
    departamento_id: undefined,
    created_at: new Date("2025-01-26T11:20:00"),
    updated_at: new Date("2025-01-26T11:20:00"),
    deleted: 0,
    usuario: 2,
    uuid: "just-cap-005",
    version: 1,
    empleado: empleadosEjemplo[5],
    tipo_justificacion: tiposJustificacionEjemplo[5],
  },
]

export function JustificacionesManager() {
  const [searchTerm, setSearchTerm] = useState("")
  const [justificaciones, setJustificaciones] = useState<Justificacion[]>(justificacionesEjemplo)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Filtrar justificaciones según el término de búsqueda
  const justificacionesFiltradas = justificaciones.filter(
    (justificacion) =>
      justificacion.deleted === 0 &&
      (justificacion.empleado?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        justificacion.tipo_justificacion.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        justificacion.motivo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        justificacion.num_oficio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (justificacion.es_masiva && searchTerm.toLowerCase().includes("masiva")) ||
        (justificacion.departamento_id && searchTerm.toLowerCase().includes("departamento"))),
  )

  // Agregar nueva justificación
  const handleAgregarJustificacion = (nuevaJustificacion: Omit<Justificacion, "id" | "created_at" | "updated_at">) => {
    const justificacion: Justificacion = {
      ...nuevaJustificacion,
      id: Math.max(...justificaciones.map((j) => j.id)) + 1,
      created_at: new Date(),
      updated_at: new Date(),
    }
    setJustificaciones([...justificaciones, justificacion])
    setDialogOpen(false)
  }

  // Eliminar justificación (soft delete)
  const handleEliminarJustificacion = (id: number) => {
    setJustificaciones(
      justificaciones.map((j) =>
        j.id === id
          ? {
              ...j,
              deleted: 1,
              updated_at: new Date(),
            }
          : j,
      ),
    )
  }

  // Calcular estadísticas
  const totalJustificaciones = justificacionesFiltradas.length
  const justificacionesEsteMes = justificacionesFiltradas.filter(
    (j) =>
      j.fecha_inicio.getMonth() === new Date().getMonth() && j.fecha_inicio.getFullYear() === new Date().getFullYear(),
  ).length
  const justificacionesConOficio = justificacionesFiltradas.filter(
    (j) => j.num_oficio && j.num_oficio.trim() !== "",
  ).length
  const justificacionesMasivas = justificacionesFiltradas.filter((j) => j.es_masiva).length

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Justificaciones</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJustificaciones}</div>
            <p className="text-xs text-muted-foreground">Registradas en el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{justificacionesEsteMes}</div>
            <p className="text-xs text-muted-foreground">Justificaciones del mes actual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Oficio</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{justificacionesConOficio}</div>
            <p className="text-xs text-muted-foreground">Requieren documentación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Masivas</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{justificacionesMasivas}</div>
            <p className="text-xs text-muted-foreground">Aplicadas a departamentos</p>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar justificaciones..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Justificación
        </Button>
      </div>

      {/* Lista de justificaciones */}
      <JustificacionesList justificaciones={justificacionesFiltradas} onEliminar={handleEliminarJustificacion} />

      {/* Dialog para nueva justificación */}
      <NuevaJustificacionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onGuardar={handleAgregarJustificacion}
        empleados={empleadosEjemplo}
        tiposJustificacion={tiposJustificacionEjemplo}
        departamentos={departamentosEjemplo}
      />
    </div>
  )
}

// Exportar datos para uso en otros componentes
export { tiposJustificacionEjemplo, empleadosEjemplo, departamentosEjemplo }
