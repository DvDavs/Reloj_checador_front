import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FormularioHorario } from "@/components/horarios/formulario-horario"

export default function NuevoHorario() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/horarios">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Horario</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración Completa del Horario</CardTitle>
          <CardDescription>Configura la información básica, bloques de horarios y reglas de asistencia</CardDescription>
        </CardHeader>
        <CardContent>
          <FormularioHorario />
        </CardContent>
      </Card>
    </div>
  )
}
