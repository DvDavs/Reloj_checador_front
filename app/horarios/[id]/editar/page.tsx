import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormularioHorario } from "@/components/horarios/formulario-horario"

interface Props {
  params: { id: string }
}

export default async function Page({ params }: Props) {
  const horarioId = params.id

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar Configuración del Horario</CardTitle>
        <CardDescription>Modifica la información básica, bloques de horarios y reglas de asistencia</CardDescription>
      </CardHeader>
      <CardContent>
        <FormularioHorario horarioId={horarioId} />
      </CardContent>
    </Card>
  )
}
