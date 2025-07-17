import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AsignacionHorariosManager } from "@/components/asignacion-horarios/asignacion-horarios-manager"

export default function AsignacionHorariosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asignación de Horarios</h1>
          <p className="text-muted-foreground">Asigna múltiples horarios al personal</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Asignaciones</CardTitle>
            <CardDescription>Horarios asignados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">156</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Personal con Horario</CardTitle>
            <CardDescription>Empleados con horario asignado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">245</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Horarios Activos</CardTitle>
            <CardDescription>Horarios en uso actualmente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12</div>
          </CardContent>
        </Card>
      </div>

      <AsignacionHorariosManager />
    </div>
  )
}
