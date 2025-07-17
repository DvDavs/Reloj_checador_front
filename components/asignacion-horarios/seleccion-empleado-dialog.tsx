"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2, AlertTriangle } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import axios from 'axios'
import { useToast } from "@/hooks/use-toast"

// API Base URL para las peticiones (igual que en los otros componentes)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// Tipo para el DTO de empleado que viene del backend
export type EmpleadoDto = {
  id: number
  rfc: string
  curp: string
  primerNombre: string
  segundoNombre?: string
  primerApellido: string
  segundoApellido?: string
  departamentoAcademicoId?: number
  departamentoAdministrativoId?: number
  tipoNombramientoPrincipal?: string
  tipoNombramientoSecundario?: string
  estatusId?: number
  nombreCompleto: string
}

// Tipo para el empleado con información adicional para la UI
export type Empleado = {
  id: number
  nombre: string
  departamento?: string
  puesto?: string
  rfc: string
  curp: string
  // Campos originales del DTO para mantener toda la información
  original: EmpleadoDto
}

interface SeleccionEmpleadoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (empleado: Empleado) => void
}

export function SeleccionEmpleadoDialog({
  open,
  onOpenChange,
  onSelect,
}: SeleccionEmpleadoDialogProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [allEmpleados, setAllEmpleados] = useState<Empleado[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Cargar empleados cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      fetchEmpleados()
    }
  }, [open])

  // Función para cargar los empleados desde el backend
  const fetchEmpleados = async () => {
    if (allEmpleados.length > 0) {
      // Si ya tenemos empleados cargados, no volvemos a cargarlos
      filterEmpleados(searchTerm)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.get<EmpleadoDto[]>(`${API_BASE_URL}/api/empleados`)

      // Transformar los DTOs a nuestro formato de UI
      const empleadosTransformados = response.data.map(dto => ({
        id: dto.id,
        nombre: dto.nombreCompleto,
        departamento: getDepartamentoNombre(dto),
        puesto: getPuestoNombre(dto),
        rfc: dto.rfc,
        curp: dto.curp,
        original: dto
      }))

      setAllEmpleados(empleadosTransformados)
      filterEmpleados(searchTerm, empleadosTransformados)
    } catch (error: any) {
      console.error("Error al cargar empleados:", error)
      setError(`Error al cargar empleados: ${error.response?.data?.mensaje || error.message}`)
      toast({
        title: "Error al cargar datos",
        description: `No se pudieron cargar los empleados. ${error.response?.data?.mensaje || error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Función para obtener el nombre del departamento
  const getDepartamentoNombre = (empleado: EmpleadoDto): string => {
    if (empleado.departamentoAcademicoId) {
      return `Académico ${empleado.departamentoAcademicoId}`
    } else if (empleado.departamentoAdministrativoId) {
      return `Administrativo ${empleado.departamentoAdministrativoId}`
    }
    return "Sin departamento"
  }

  // Función para obtener el nombre del puesto
  const getPuestoNombre = (empleado: EmpleadoDto): string => {
    if (empleado.tipoNombramientoPrincipal) {
      return empleado.tipoNombramientoPrincipal
    } else if (empleado.tipoNombramientoSecundario) {
      return empleado.tipoNombramientoSecundario
    }
    return "Sin puesto asignado"
  }

  // Función para filtrar empleados basado en el término de búsqueda
  const filterEmpleados = (term: string, source: Empleado[] = allEmpleados) => {
    if (!term.trim()) {
      setEmpleados(source)
      return
    }

    const termLower = term.toLowerCase()
    const filtered = source.filter(empleado =>
      empleado.nombre.toLowerCase().includes(termLower) ||
      (empleado.departamento && empleado.departamento.toLowerCase().includes(termLower)) ||
      (empleado.puesto && empleado.puesto.toLowerCase().includes(termLower)) ||
      empleado.rfc.toLowerCase().includes(termLower) ||
      empleado.curp.toLowerCase().includes(termLower)
    )

    setEmpleados(filtered)
  }

  // Manejar cambios en el término de búsqueda
  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    filterEmpleados(term)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Seleccionar Empleado</DialogTitle>
          <DialogDescription>Busca y selecciona un empleado para asignar horarios</DialogDescription>
        </DialogHeader>

        {/* Mostrar mensaje de error si existe */}
        {error && (
          <div className="w-full bg-red-900/30 border border-red-700 text-red-400 p-4 rounded-lg mb-2 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nombre, departamento o puesto..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              autoFocus
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Cargando empleados...</span>
            </div>
          ) : (
            <ScrollArea className="h-[300px] border rounded-md">
              {empleados.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {searchTerm ? "No se encontraron resultados" : "No hay empleados disponibles"}
                </div>
              ) : (
                <div className="p-1">
                  {empleados.map((empleado) => (
                    <div
                      key={empleado.id}
                      className={cn(
                        "flex flex-col p-3 rounded-md cursor-pointer",
                        hoveredId === empleado.id || "hover:bg-slate-100 dark:hover:bg-slate-800",
                        hoveredId === empleado.id && "bg-slate-100 dark:bg-slate-800",
                      )}
                      onClick={() => onSelect(empleado)}
                      onMouseEnter={() => setHoveredId(empleado.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <div className="font-medium">{empleado.nombre}</div>
                      <div className="text-sm text-muted-foreground">
                        {empleado.departamento} - {empleado.puesto}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        RFC: {empleado.rfc}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}