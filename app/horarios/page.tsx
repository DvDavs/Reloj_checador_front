"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { HorariosTable } from "@/components/horarios/horarios-table"
import { Header } from "@/components/header"
import Link from "next/link"

export default function HorariosPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  return (
    <div className="space-y-6">
      {/* Header con buscador funcional */}
      <Header onSearch={handleSearch} searchPlaceholder="Buscar horarios por nombre o descripción..." />

      <div className="px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Horarios</h1>
            <p className="text-muted-foreground">Administra los horarios del personal</p>
          </div>
          <Link href="/horarios/nuevo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Crear Horario
            </Button>
          </Link>
        </div>

        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Total Horarios</CardTitle>
              <CardDescription>Horarios configurados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">6</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Horarios Activos</CardTitle>
              <CardDescription>En uso actualmente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">5</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Personal Asignado</CardTitle>
              <CardDescription>Con horario asignado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">245</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de horarios */}
        <HorariosTable searchTerm={searchTerm} />
      </div>
    </div>
  )
}
