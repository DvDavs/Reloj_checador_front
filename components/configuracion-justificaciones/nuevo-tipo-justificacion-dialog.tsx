"use client"

import { useState, useEffect } from "react"
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
import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { TipoJustificacion } from "../justificaciones/justificaciones-manager"

interface NuevoTipoJustificacionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGuardar: (tipo: any) => void
  tipoInicial?: TipoJustificacion | null
}

export function NuevoTipoJustificacionDialog({
  open,
  onOpenChange,
  onGuardar,
  tipoInicial,
}: NuevoTipoJustificacionDialogProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    requiere_oficio: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Cargar datos iniciales si estamos editando
  useEffect(() => {
    if (tipoInicial) {
      setFormData({
        nombre: tipoInicial.nombre,
        descripcion: tipoInicial.descripcion || "",
        requiere_oficio: tipoInicial.requiere_oficio,
      })
    } else {
      setFormData({
        nombre: "",
        descripcion: "",
        requiere_oficio: false,
      })
    }
    setErrors({})
  }, [tipoInicial, open])

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio"
    }

    if (formData.nombre.trim().length < 3) {
      newErrors.nombre = "El nombre debe tener al menos 3 caracteres"
    }

    if (formData.nombre.trim().length > 100) {
      newErrors.nombre = "El nombre no puede exceder 100 caracteres"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleGuardar = () => {
    if (!validateForm()) return

    if (tipoInicial) {
      // Editando tipo existente
      const tipoActualizado: TipoJustificacion = {
        ...tipoInicial,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || undefined,
        requiere_oficio: formData.requiere_oficio,
        version: (tipoInicial.version || 1) + 1,
      }
      onGuardar(tipoActualizado)
    } else {
      // Creando nuevo tipo
      const nuevoTipo = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || undefined,
        requiere_oficio: formData.requiere_oficio,
        deleted: 0,
        usuario: 1, // Usuario actual del sistema
        uuid: `tipo-${Date.now()}`,
        version: 1,
      }
      onGuardar(nuevoTipo)
    }

    handleReset()
  }

  const handleReset = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      requiere_oficio: false,
    })
    setErrors({})
  }

  const handleCancel = () => {
    handleReset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{tipoInicial ? "Editar Tipo de Justificación" : "Nuevo Tipo de Justificación"}</DialogTitle>
          <DialogDescription>
            {tipoInicial
              ? "Modifica los datos del tipo de justificación"
              : "Crea un nuevo tipo de justificación para el sistema"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => handleInputChange("nombre", e.target.value)}
              placeholder="Ej: Incapacidad Médica"
              className={errors.nombre ? "border-red-500" : ""}
              maxLength={100}
            />
            {errors.nombre && <p className="text-sm text-red-500">{errors.nombre}</p>}
            <p className="text-xs text-muted-foreground">{formData.nombre.length}/100 caracteres</p>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleInputChange("descripcion", e.target.value)}
              placeholder="Descripción opcional del tipo de justificación..."
              rows={3}
            />
          </div>

          {/* Requiere oficio */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiere_oficio"
                checked={formData.requiere_oficio}
                onCheckedChange={(checked) => handleInputChange("requiere_oficio", checked)}
              />
              <Label
                htmlFor="requiere_oficio"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Requiere número de oficio
              </Label>
            </div>

            {formData.requiere_oficio && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Al activar esta opción, será obligatorio proporcionar un número de oficio al crear justificaciones de
                  este tipo.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleGuardar}>{tipoInicial ? "Guardar Cambios" : "Crear Tipo"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
