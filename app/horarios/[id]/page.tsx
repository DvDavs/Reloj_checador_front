import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, Users, Edit, Calendar } from "lucide-react"
import Link from "next/link"
import { DetalleHorario } from "@/components/horarios/detalle-horario"
import { PersonalAsignado } from "@/components/horarios/personal-asignado"

export default function HorarioDetalle({ params }: { params: { id: string } }) {
  // En un caso real, aquí se obtendría la información del horario desde la API
  const horario = {
    id: Number.parseInt(params.id),
    nombre: "Horario Administrativo",
    descripcion: "Horario para personal administrativo",
    toleranciaRetardo: 15,
    toleranciaFalta: 30,
    aperturaEntrada: 30,
    aperturaSalida: 30,
    activo: true,
    tipo: "Normal",
    personalAsignado: 120,
    fechaCreacion: "01/01/2025",
    ultimaModificacion: "10/05/2025",
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/horarios">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">{horario.nombre}</h1>
            <Badge
              variant={horario.activo ? "default" : "secondary"}
              className={horario.activo ? "bg-green-500 hover:bg-green-600" : ""}
            >
              {horario.activo ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <p className="text-muted-foreground">{horario.descripcion}</p>
        </div>
        <Link href={`/horarios/${horario.id}/editar`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Editar Horario
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tolerancia Retardo</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{horario.toleranciaRetardo} min</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tolerancia Falta</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{horario.toleranciaFalta} min</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personal Asignado</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{horario.personalAsignado}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="detalle" className="space-y-4">
        <TabsList>
          <TabsTrigger value="detalle">Detalle del Horario</TabsTrigger>
          <TabsTrigger value="personal">Personal Asignado</TabsTrigger>
        </TabsList>

        <TabsContent value="detalle" className="space-y-4">
          <DetalleHorario />
        </TabsContent>

        <TabsContent value="personal" className="space-y-4">
          <PersonalAsignado />
        </TabsContent>
      </Tabs>
    </div>
  )
}
