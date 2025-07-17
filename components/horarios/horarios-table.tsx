"use client"

import { useState, useEffect } from "react"
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
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Edit, Trash2, Eye, Clock, Calendar, Crown, AlertTriangle, Loader2 } from 'lucide-react'
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import axios from 'axios'
import { useToast } from "@/hooks/use-toast"

// API Base URL para las peticiones (igual que en los otros componentes)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// Tipo para el DTO de horario que viene del backend
export type HorarioDto = {
  id: number
  nombre: string
  descripcion?: string
  detalles?: DetalleHorarioDto[]
  activo?: boolean
  es_horario_jefe?: boolean
  created_at?: string
}

// Tipo para el DTO de detalle de horario
export type DetalleHorarioDto = {
  id: number
  diaSemana: number
  turno?: number
  horaEntrada: string
  horaSalida: string
}

interface HorariosTableProps {
  searchTerm?: string
}

export function HorariosTable({ searchTerm = "" }: HorariosTableProps) {
  const [horarios, setHorarios] = useState<HorarioDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const { toast } = useToast()

  // Cargar horarios al montar el componente
  useEffect(() => {
    fetchHorarios()
  }, [])

  // Función para cargar los horarios desde el backend
  const fetchHorarios = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.get<HorarioDto[]>(`${API_BASE_URL}/api/horarios`)
      setHorarios(response.data)
    } catch (error: any) {
      console.error("Error al cargar horarios:", error)
      setError(`Error al cargar horarios: ${error.response?.data?.mensaje || error.message}`)
      toast({
        title: "Error al cargar datos",
        description: `No se pudieron cargar los horarios. ${error.response?.data?.mensaje || error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar horarios basado en el término de búsqueda
  const filteredHorarios = horarios.filter((horario) => {
    if (!searchTerm) return true // Mostrar todos si no hay término de búsqueda

    const searchLower = searchTerm.toLowerCase()
    return (
      horario.nombre.toLowerCase().includes(searchLower) ||
      (horario.descripcion && horario.descripcion.toLowerCase().includes(searchLower))
    )
  })

  // Función para desactivar un horario
  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar este horario?")) {
      setIsDeleting(id)

      try {
        await axios.delete(`${API_BASE_URL}/api/horarios/${id}`)

        toast({
          title: "Horario eliminado",
          description: "El horario ha sido desactivado correctamente.",
        })

        // Actualizar la lista de horarios
        fetchHorarios()
      } catch (error: any) {
        console.error("Error al eliminar horario:", error)
        toast({
          title: "Error al eliminar",
          description: `No se pudo eliminar el horario. ${error.response?.data?.mensaje || error.message}`,
          variant: "destructive",
        })
      } finally {
        setIsDeleting(null)
      }
    }
  }

  // Formatear fecha de creación
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString()
    } catch (e) {
      return "Fecha inválida"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Listado de Horarios</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mostrar mensaje de error si existe */}
        {error && (
          <div className="w-full bg-red-900/30 border border-red-700 text-red-400 p-4 rounded-lg mb-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Cargando horarios...</span>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Descripción</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Tipo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHorarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {searchTerm
                        ? "No se encontraron horarios que coincidan con la búsqueda."
                        : "No hay horarios disponibles."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHorarios.map((horario) => (
                    <TableRow key={horario.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {horario.es_horario_jefe && <Crown className="h-4 w-4 text-yellow-500" />}
                          {horario.nombre}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs">
                        <div className="truncate" title={horario.descripcion}>
                          {horario.descripcion || "Sin descripción"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={horario.activo !== false ? "default" : "secondary"}
                          className={horario.activo !== false ? "bg-green-500 hover:bg-green-600" : ""}
                        >
                          {horario.activo !== false ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={horario.es_horario_jefe ? "default" : "outline"}
                          className={horario.es_horario_jefe ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                        >
                          {horario.es_horario_jefe ? "Jefe" : "Normal"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isDeleting === horario.id}>
                              {isDeleting === horario.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                              <span className="sr-only">Abrir menú</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Link href={`/horarios/${horario.id}`} className="flex items-center">
                                <Eye className="mr-2 h-4 w-4" />
                                <span>Ver detalles</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link href={`/horarios/${horario.id}/editar`} className="flex items-center">
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Editar horario</span>
                              </Link>
                            </DropdownMenuItem>
                            {/*<DropdownMenuItem>
                              <Link href={`/horarios/${horario.id}/detalle`} className="flex items-center">
                                <Clock className="mr-2 h-4 w-4" />
                                <span>Editar detalle</span>
                              </Link>
                            </DropdownMenuItem>*/}
                            <DropdownMenuItem>
                              <Link href={`/horarios/${horario.id}/asignar`} className="flex items-center">
                                <Calendar className="mr-2 h-4 w-4" />
                                <span>Asignar a personal</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(horario.id)}
                              disabled={isDeleting === horario.id}
                            >
                              {isDeleting === horario.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                              )}
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
        )}
      </CardContent>
    </Card>
  )
}