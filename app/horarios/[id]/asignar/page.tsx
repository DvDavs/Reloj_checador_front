import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { AsignacionHorarioForm } from "@/components/horarios/asignacion-horario-form"

export default function AsignarHorarioPage({ params }: { params: { id: string } }) {
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
          <h1 className="text-3xl font-bold tracking-tight">Asignar Horario</h1>
          <p className="text-muted-foreground">{horarioNombre}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asignación de Horario</CardTitle>
            <CardDescription>Asigna este horario a personal específico</CardDescription>
          </CardHeader>
          <CardContent>
            <AsignacionHorarioForm horarioId={horarioId} />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Link href="/horarios">
              <Button variant="outline">Cancelar</Button>
            </Link>
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Guardar Asignación
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asignaciones Actuales</CardTitle>
            <CardDescription>Personal con este horario asignado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50 dark:bg-slate-800">
                      <th className="p-2 text-left font-medium">Empleado</th>
                      <th className="p-2 text-left font-medium">Fecha Inicio</th>
                      <th className="p-2 text-left font-medium">Fecha Fin</th>
                      <th className="p-2 text-left font-medium">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2">Juan Pérez López</td>
                      <td className="p-2">01/01/2025</td>
                      <td className="p-2">31/12/2025</td>
                      <td className="p-2">Principal</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">María Rodríguez Gómez</td>
                      <td className="p-2">01/01/2025</td>
                      <td className="p-2">31/12/2025</td>
                      <td className="p-2">Principal</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Carlos Sánchez Vega</td>
                      <td className="p-2">01/01/2025</td>
                      <td className="p-2">31/12/2025</td>
                      <td className="p-2">Principal</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
