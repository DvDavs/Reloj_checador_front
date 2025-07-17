import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, Calendar } from "lucide-react"
import Link from "next/link"
import { HorarioVistaDetalle } from "@/components/horarios/horario-vista-detalle"

export default function HorarioDetalle({ params }: { params: { id: string } }) {
  const horarioId = params.id

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Link href="/horarios">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Detalle del Horario</h1>
            <p className="text-muted-foreground">Vista cuadriculada del horario semanal</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/horarios/${horarioId}/editar`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar Horario
            </Button>
          </Link>
          <Link href={`/horarios/${horarioId}/asignar`}>
            <Button>
              <Calendar className="mr-2 h-4 w-4" />
              Asignar Personal
            </Button>
          </Link>
        </div>
      </div>

      {/* Vista cuadriculada del horario */}
      <HorarioVistaDetalle horarioId={horarioId} />
    </div>
  )
}
