"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Upload, AlertTriangle, User, Building } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Justificacion, TipoJustificacion, Empleado, Departamento } from "./justificaciones-manager"

interface NuevaJustificacionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGuardar: (justificacion: Omit<Justificacion, "id" | "created_at" | "updated_at">) => void
  empleados: Empleado[]
  tiposJustificacion: TipoJustificacion[]
  departamentos: Departamento[]
}

export function NuevaJustificacionDialog({
  open,
  onOpenChange,
  onGuardar,
  empleados,
  tiposJustificacion,
  departamentos,
}: NuevaJustificacionDialogProps) {
  const [formData, setFormData] = useState({
    rh_personal_id: undefined as number | undefined,
    tipo_justificacion_id: 0,
    fecha_inicio: undefined as Date | undefined,
    fecha_fin: undefined as Date | undefined,
    motivo: "",
    num_oficio: "",
    es_masiva: false,
    departamento_id: undefined as number | undefined,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Obtener el tipo de justificación seleccionado
  const tipoSeleccionado = tiposJustificacion.find((t) => t.id === formData.tipo_justificacion_id && t.deleted === 0)

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validar empleado solo si no es masiva
    if (!formData.es_masiva && !formData.rh_personal_id) {
      newErrors.rh_personal_id = "Debe seleccionar un empleado"
    }

    // Validar departamento solo si es masiva
    if (formData.es_masiva && !formData.departamento_id) {
      newErrors.departamento_id = "Debe seleccionar un departamento para justificaciones masivas"
    }

    if (!formData.tipo_justificacion_id) {
      newErrors.tipo_justificacion_id = "Debe seleccionar un tipo de justificación"
    }

    if (!formData.fecha_inicio) {
      newErrors.fecha_inicio = "La fecha de inicio es obligatoria"
    }

    if (!formData.fecha_fin) {
      newErrors.fecha_fin = "La fecha de fin es obligatoria"
    }

    if (formData.fecha_inicio && formData.fecha_fin && formData.fecha_inicio > formData.fecha_fin) {
      newErrors.fecha_fin = "La fecha de fin debe ser posterior o igual a la fecha de inicio"
    }

    if (tipoSeleccionado?.requiere_oficio && !formData.num_oficio.trim()) {
      newErrors.num_oficio = "El número de oficio es obligatorio para este tipo de justificación"
    }

    if (!formData.motivo.trim()) {
      newErrors.motivo = "El motivo es obligatorio"
    }

    // Validar longitud de campos según BD
    if (formData.num_oficio && formData.num_oficio.length > 50) {
      newErrors.num_oficio = "El número de oficio no puede exceder 50 caracteres"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleGuardar = () => {
    if (!validateForm()) return

    const empleadoSeleccionado = formData.rh_personal_id
      ? empleados.find((e) => e.id === formData.rh_personal_id)
      : undefined
    const tipoJustificacionSeleccionado = tiposJustificacion.find((t) => t.id === formData.tipo_justificacion_id)!

    const nuevaJustificacion: Omit<Justificacion, "id" | "created_at" | "updated_at"> = {
      rh_personal_id: formData.es_masiva ? undefined : formData.rh_personal_id,
      tipo_justificacion_id: formData.tipo_justificacion_id,
      fecha_inicio: formData.fecha_inicio!,
      fecha_fin: formData.fecha_fin!,
      motivo: formData.motivo.trim(),
      num_oficio: formData.num_oficio.trim() || undefined,
      es_masiva: formData.es_masiva,
      departamento_id: formData.es_masiva ? formData.departamento_id : undefined,
      deleted: 0,
      usuario: 1, // Usuario actual del sistema
      uuid: `just-${Date.now()}`,
      version: 1,
      empleado: empleadoSeleccionado,
      tipo_justificacion: tipoJustificacionSeleccionado,
    }

    onGuardar(nuevaJustificacion)
    handleReset()
  }

  const handleReset = () => {
    setFormData({
      rh_personal_id: undefined,
      tipo_justificacion_id: 0,
      fecha_inicio: undefined,
      fecha_fin: undefined,
      motivo: "",
      num_oficio: "",
      es_masiva: false,
      departamento_id: undefined,
    })
    setErrors({})
  }

  const handleCancel = () => {
    handleReset()
    onOpenChange(false)
  }

  // Filtrar tipos de justificación activos
  const tiposActivos = tiposJustificacion.filter((t) => t.deleted === 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Justificación</DialogTitle>
          <DialogDescription>Registra una nueva justificación de asistencia para el personal</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Checkbox es masiva */}
          <div className="flex items-center space-x-2 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
            <Checkbox
              id="es_masiva"
              checked={formData.es_masiva}
              onCheckedChange={(checked) => {
                handleInputChange("es_masiva", checked)
                // Limpiar campos relacionados al cambiar el tipo
                if (checked) {
                  handleInputChange("rh_personal_id", undefined)
                } else {
                  handleInputChange("departamento_id", undefined)
                }
              }}
            />
            <div className="flex items-center gap-2">
              {formData.es_masiva ? <Building className="h-4 w-4 text-blue-500" /> : <User className="h-4 w-4" />}
              <Label
                htmlFor="es_masiva"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Justificación masiva (aplica a todo un departamento)
              </Label>
            </div>
          </div>

          {/* Selección de empleado o departamento */}
          {formData.es_masiva ? (
            <div className="space-y-2">
              <Label htmlFor="departamento">
                Departamento <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.departamento_id?.toString() || ""}
                onValueChange={(value) => handleInputChange("departamento_id", Number.parseInt(value))}
              >
                <SelectTrigger className={errors.departamento_id ? "border-red-500" : ""}>
                  <SelectValue placeholder="Seleccionar departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departamentos.map((departamento) => (
                    <SelectItem key={departamento.id} value={departamento.id.toString()}>
                      <div className="flex flex-col">
                        <span>{departamento.nombre}</span>
                        {departamento.descripcion && (
                          <span className="text-xs text-muted-foreground">{departamento.descripcion}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.departamento_id && <p className="text-sm text-red-500">{errors.departamento_id}</p>}
              <p className="text-xs text-muted-foreground">
                La justificación se aplicará a todos los empleados del departamento seleccionado
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="empleado">
                Empleado <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.rh_personal_id?.toString() || ""}
                onValueChange={(value) => handleInputChange("rh_personal_id", Number.parseInt(value))}
              >
                <SelectTrigger className={errors.rh_personal_id ? "border-red-500" : ""}>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {empleados.map((empleado) => (
                    <SelectItem key={empleado.id} value={empleado.id.toString()}>
                      <div className="flex flex-col">
                        <span>{empleado.nombre}</span>
                        <span className="text-xs text-muted-foreground">
                          {empleado.departamento} - {empleado.puesto}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.rh_personal_id && <p className="text-sm text-red-500">{errors.rh_personal_id}</p>}
            </div>
          )}

          {/* Tipo de justificación */}
          <div className="space-y-2">
            <Label htmlFor="tipo">
              Tipo de Justificación <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.tipo_justificacion_id.toString()}
              onValueChange={(value) => handleInputChange("tipo_justificacion_id", Number.parseInt(value))}
            >
              <SelectTrigger className={errors.tipo_justificacion_id ? "border-red-500" : ""}>
                <SelectValue placeholder="Seleccionar tipo de justificación" />
              </SelectTrigger>
              <SelectContent>
                {tiposActivos.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id.toString()}>
                    <div className="flex flex-col">
                      <span>{tipo.nombre}</span>
                      {tipo.descripcion && <span className="text-xs text-muted-foreground">{tipo.descripcion}</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tipo_justificacion_id && <p className="text-sm text-red-500">{errors.tipo_justificacion_id}</p>}
          </div>

          {/* Alerta si requiere oficio */}
          {tipoSeleccionado?.requiere_oficio && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Este tipo de justificación requiere número de oficio. Asegúrate de proporcionarlo.
              </AlertDescription>
            </Alert>
          )}

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Fecha de Inicio <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.fecha_inicio && "text-muted-foreground",
                      errors.fecha_inicio && "border-red-500",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.fecha_inicio ? (
                      format(formData.fecha_inicio, "PPP", { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.fecha_inicio}
                    onSelect={(date) => handleInputChange("fecha_inicio", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.fecha_inicio && <p className="text-sm text-red-500">{errors.fecha_inicio}</p>}
            </div>

            <div className="space-y-2">
              <Label>
                Fecha de Fin <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.fecha_fin && "text-muted-foreground",
                      errors.fecha_fin && "border-red-500",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.fecha_fin ? (
                      format(formData.fecha_fin, "PPP", { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.fecha_fin}
                    onSelect={(date) => handleInputChange("fecha_fin", date)}
                    disabled={(date) => (formData.fecha_inicio ? date < formData.fecha_inicio : false)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.fecha_fin && <p className="text-sm text-red-500">{errors.fecha_fin}</p>}
            </div>
          </div>

          {/* Número de oficio */}
          {tipoSeleccionado?.requiere_oficio && (
            <div className="space-y-2">
              <Label htmlFor="num_oficio">
                Número de Oficio <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="num_oficio"
                  value={formData.num_oficio}
                  onChange={(e) => handleInputChange("num_oficio", e.target.value)}
                  placeholder="Ej: INC-2025-001"
                  className={errors.num_oficio ? "border-red-500" : ""}
                  maxLength={50}
                />
                <Button variant="outline" size="icon" title="Subir archivo">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              {errors.num_oficio && <p className="text-sm text-red-500">{errors.num_oficio}</p>}
              <p className="text-xs text-muted-foreground">{formData.num_oficio.length}/50 caracteres</p>
            </div>
          )}

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="motivo">
              Motivo <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="motivo"
              value={formData.motivo}
              onChange={(e) => handleInputChange("motivo", e.target.value)}
              placeholder="Describe el motivo de la justificación..."
              className={errors.motivo ? "border-red-500" : ""}
              rows={3}
            />
            {errors.motivo && <p className="text-sm text-red-500">{errors.motivo}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleGuardar}>Guardar Justificación</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
