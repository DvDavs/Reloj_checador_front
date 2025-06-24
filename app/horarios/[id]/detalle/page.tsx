import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { DetalleHorarioEditor } from "@/components/horarios/detalle-horario-editor"

export default function DetalleHorarioPage({ params }: { params: { id: string } }) {
  // En un caso real, aquí se obtendría la información del horario desde la API
  const horarioId = params.id
  const horarioNombre = "Horario Administrativo" // Esto vendría de la API

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/horarios">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Detalle del Horario</h1>
          <p className="text-muted-foreground">{horarioNombre}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración de Horarios por Día</CardTitle>
          <CardDescription>Define los intervalos de tiempo para cada día de la semana</CardDescription>
        </CardHeader>
        <CardContent>
          <DetalleHorarioEditor horarioId={horarioId} />
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Link href="/horarios">
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Guardar Cambios jsjsjsj
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
