"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { HorarioCard } from "@/components/horarios/horario-card"
import { Plus } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import type { BloqueHorario } from "./horario-tablero-bloques"

// Tipo para un horario
export type Horario = {
  id: string
  nombre: string
  descripcion: string
  inicioVigencia: Date
  finVigencia: Date
  bloques: {
    [dia: string]: BloqueHorario[]
  }
  reglaAsistencia?: string
  isEditing: boolean
  isNew: boolean
}

// Datos de ejemplo para horarios existentes
const horariosEjemplo: Horario[] = [
  {
    id: "1",
    nombre: "Turno Matutino",
    descripcion: "Horario estándar para personal administrativo",
    inicioVigencia: new Date("2025-01-01"),
    finVigencia: new Date("2025-12-31"),
    bloques: {
      lunes: [
        { id: "1-1", inicio: "08:00", fin: "13:00" },
        { id: "1-2", inicio: "14:00", fin: "17:00" },
      ],
      martes: [
        { id: "2-1", inicio: "08:00", fin: "13:00" },
        { id: "2-2", inicio: "14:00", fin: "17:00" },
      ],
      miercoles: [
        { id: "3-1", inicio: "08:00", fin: "13:00" },
        { id: "3-2", inicio: "14:00", fin: "17:00" },
      ],
      jueves: [
        { id: "4-1", inicio: "08:00", fin: "13:00" },
        { id: "4-2", inicio: "14:00", fin: "17:00" },
      ],
      viernes: [
        { id: "5-1", inicio: "08:00", fin: "13:00" },
        { id: "5-2", inicio: "14:00", fin: "17:00" },
      ],
      sabado: [],
      domingo: [],
    },
    reglaAsistencia: "administrativo",
    isEditing: false,
    isNew: false,
  },
  {
    id: "2",
    nombre: "Turno Vespertino",
    descripcion: "Horario para personal de atención al cliente",
    inicioVigencia: new Date("2025-01-01"),
    finVigencia: new Date("2025-12-31"),
    bloques: {
      lunes: [{ id: "6-1", inicio: "14:00", fin: "22:00" }],
      martes: [{ id: "7-1", inicio: "14:00", fin: "22:00" }],
      miercoles: [{ id: "8-1", inicio: "14:00", fin: "22:00" }],
      jueves: [{ id: "9-1", inicio: "14:00", fin: "22:00" }],
      viernes: [{ id: "10-1", inicio: "14:00", fin: "22:00" }],
      sabado: [],
      domingo: [],
    },
    reglaAsistencia: "operativo",
    isEditing: false,
    isNew: false,
  },
]

export function HorariosManager() {
  const [horarios, setHorarios] = useState<Horario[]>(horariosEjemplo)
  const [showAddButton, setShowAddButton] = useState(true)

  // Crear un nuevo horario
  const handleAddHorario = () => {
    const nuevoHorario: Horario = {
      id: uuidv4(),
      nombre: "",
      descripcion: "",
      inicioVigencia: new Date(),
      finVigencia: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      bloques: {
        lunes: [],
        martes: [],
        miercoles: [],
        jueves: [],
        viernes: [],
        sabado: [],
        domingo: [],
      },
      reglaAsistencia: "administrativo",
      isEditing: true,
      isNew: true,
    }

    setHorarios([...horarios, nuevoHorario])
    setShowAddButton(false)
  }

  // Guardar un horario
  const handleSaveHorario = (horarioActualizado: Horario) => {
    setHorarios(
      horarios.map((h) =>
        h.id === horarioActualizado.id
          ? {
              ...horarioActualizado,
              isEditing: false,
              isNew: false,
            }
          : h,
      ),
    )
    setShowAddButton(true)
  }

  // Cancelar la edición de un horario
  const handleCancelHorario = (id: string) => {
    // Si es un horario nuevo, lo eliminamos
    if (horarios.find((h) => h.id === id)?.isNew) {
      setHorarios(horarios.filter((h) => h.id !== id))
    } else {
      // Si es un horario existente, cancelamos la edición
      setHorarios(
        horarios.map((h) =>
          h.id === id
            ? {
                ...h,
                isEditing: false,
              }
            : h,
        ),
      )
    }
    setShowAddButton(true)
  }

  // Editar un horario existente
  const handleEditHorario = (id: string) => {
    setHorarios(
      horarios.map((h) =>
        h.id === id
          ? {
              ...h,
              isEditing: true,
            }
          : h,
      ),
    )
    setShowAddButton(false)
  }

  // Eliminar un horario
  const handleDeleteHorario = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este horario?")) {
      setHorarios(horarios.filter((h) => h.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Gestión de Horarios</h2>
        {showAddButton && (
          <Button onClick={handleAddHorario}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Horario
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {horarios.map((horario) => (
          <HorarioCard
            key={horario.id}
            horario={horario}
            onSave={handleSaveHorario}
            onCancel={() => handleCancelHorario(horario.id)}
            onEdit={() => handleEditHorario(horario.id)}
            onDelete={() => handleDeleteHorario(horario.id)}
          />
        ))}
      </div>
    </div>
  )
}

// Exportar los horarios para uso en otros componentes
export const getHorariosDisponibles = () => {
  // En una aplicación real, esto vendría de una API o estado global
  return horariosEjemplo.filter((h) => !h.isEditing && !h.isNew)
}
