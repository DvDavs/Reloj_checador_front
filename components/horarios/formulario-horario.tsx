"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon, Crown, Shield, Clock, AlertTriangle, Save, Loader2 } from 'lucide-react'
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { HorarioTableroBloques } from "./horario-tablero-bloques"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import axios from 'axios'
import type { BloqueHorario } from "./horario-tablero-bloques"

// API Base URL para las peticiones (igual que en time-clock)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// Definir tipos para los DTOs según los archivos Java proporcionados
type DetalleHorarioDto = {
  id?: number;
  diaSemana: number;
  turno: number;
  horaEntrada: string; // "HH:mm:ss"
  horaSalida: string; // "HH:mm:ss"
};

type HorarioDto = {
  id?: number;
  nombre: string;
  descripcion?: string;
  detalles: DetalleHorarioDto[];
};

type HorarioCreateDto = {
  nombre: string;
  descripcion?: string;
};

type HorarioUpdateDto = {
  nombre: string;
  descripcion?: string;
  activo: boolean;
};

const formSchema = z.object({
  nombre: z.string().min(3, {
    message: "El nombre debe tener al menos 3 caracteres.",
  }),
  codigo: z.string().min(1, {
    message: "El código es requerido.",
  }),
  descripcion: z.string().optional(),
  tipoHorario: z.string(),
  inicioVigencia: z.date({
    required_error: "La fecha de inicio de vigencia es requerida.",
  }),
  finVigencia: z.date({
    required_error: "La fecha de fin de vigencia es requerida.",
  }),
  activo: z.boolean().default(true),
  esHorarioJefe: z.boolean().default(false),
})

// Reglas de asistencia predefinidas (solo lectura)
const reglasAsistencia = [
  {
    id: "administrativo",
    nombre: "Administrativo",
    descripcion: "Reglas estándar para personal administrativo",
    toleranciaRetardo: 15,
    toleranciaFalta: 30,
    aperturaEntrada: 30,
    aperturaSalida: 30,
    icon: Shield,
    color: "blue",
  },
  {
    id: "operativo",
    nombre: "Operativo",
    descripcion: "Reglas para personal operativo con mayor flexibilidad",
    toleranciaRetardo: 10,
    toleranciaFalta: 20,
    aperturaEntrada: 15,
    aperturaSalida: 15,
    icon: Clock,
    color: "green",
  },
  {
    id: "directivo",
    nombre: "Directivo",
    descripcion: "Reglas especiales para personal directivo",
    toleranciaRetardo: 30,
    toleranciaFalta: 60,
    aperturaEntrada: 60,
    aperturaSalida: 60,
    icon: Crown,
    color: "yellow",
  },
  {
    id: "critico",
    nombre: "Crítico",
    descripcion: "Reglas estrictas para áreas críticas",
    toleranciaRetardo: 5,
    toleranciaFalta: 10,
    aperturaEntrada: 10,
    aperturaSalida: 10,
    icon: AlertTriangle,
    color: "red",
  },
]

interface FormularioHorarioProps {
  horarioId?: string
  onSave?: (data: any) => void
  onCancel?: () => void
}

export function FormularioHorario({ horarioId, onSave, onCancel }: FormularioHorarioProps) {
  const isEditing = !!horarioId
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formModified, setFormModified] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const [bloquesHorarios, setBloquesHorarios] = useState<{ [dia: string]: BloqueHorario[] }>({
    lunes: [],
    martes: [],
    miercoles: [],
    jueves: [],
    viernes: [],
    sabado: [],
    domingo: [],
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      codigo: "",
      descripcion: "",
      tipoHorario: "normal",
      inicioVigencia: new Date(),
      finVigencia: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      activo: true,
      esHorarioJefe: false,
    },
  })

  // Detectar cambios en el formulario
  useEffect(() => {
    const subscription = form.watch(() => {
      setFormModified(true)
    })
    return () => subscription.unsubscribe()
  }, [form])

  // Cargar datos del horario si estamos en modo edición
  useEffect(() => {
    if (isEditing && horarioId) {
      loadHorarioData(parseInt(horarioId))
    }
  }, [isEditing, horarioId])

  // Función para cargar los datos del horario desde el backend
  const loadHorarioData = async (id: number) => {
    setIsLoading(true)
    setApiError(null)

    try {
      const response = await axios.get<HorarioDto>(`${API_BASE_URL}/api/horarios/${id}`)
      const horarioData = response.data

      // Actualizar el formulario con los datos recibidos
      form.reset({
        nombre: horarioData.nombre,
        codigo: horarioData.id?.toString() || "",
        descripcion: horarioData.descripcion || "",
        tipoHorario: "normal", // Asumimos un valor por defecto ya que no viene en el DTO
        inicioVigencia: new Date(), // Estos campos no vienen en el DTO, mantenemos los valores por defecto
        finVigencia: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        activo: true,
        esHorarioJefe: false,
      })

      // Convertir los detalles del horario al formato de bloques
      const bloques = convertDetallesABloques(horarioData.detalles || [])
      setBloquesHorarios(bloques)

      setFormModified(false)
    } catch (error: any) {
      console.error("Error al cargar datos del horario:", error)
      setApiError(`Error al cargar el horario: ${error.response?.data?.mensaje || error.message}`)
      toast({
        title: "Error al cargar datos",
        description: `No se pudo cargar la información del horario. ${error.response?.data?.mensaje || error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Función para convertir detalles del backend a bloques para el componente
  const convertDetallesABloques = (detalles: DetalleHorarioDto[]): { [dia: string]: BloqueHorario[] } => {
    const diasSemana = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]
    const bloques: { [dia: string]: BloqueHorario[] } = {
      lunes: [],
      martes: [],
      miercoles: [],
      jueves: [],
      viernes: [],
      sabado: [],
      domingo: [],
    }

    detalles.forEach(detalle => {
      // Ajustar el índice del día (backend: 1-7, frontend: 0-6)
      const diaIndex = detalle.diaSemana - 1
      if (diaIndex >= 0 && diaIndex < 7) {
        const diaNombre = diasSemana[diaIndex]

        // Convertir formato de hora "HH:mm:ss" a "HH:mm"
        const horaEntrada = detalle.horaEntrada.substring(0, 5)
        const horaSalida = detalle.horaSalida.substring(0, 5)

        bloques[diaNombre].push({
          id: detalle.id?.toString() || `temp-${Date.now()}-${Math.random()}`,
          inicio: horaEntrada,
          fin: horaSalida,
          //turno: detalle.turno,
        })
      }
    })

    return bloques
  }

  // Función para convertir bloques del componente a detalles para el backend
  const convertBloquesADetalles = (): DetalleHorarioDto[] => {
    const diasSemana = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]
    const detalles: DetalleHorarioDto[] = []

    Object.entries(bloquesHorarios).forEach(([dia, bloquesDia]) => {
      // Obtener el índice del día (frontend: nombre, backend: 1-7)
      const diaSemana = diasSemana.indexOf(dia) + 1

      bloquesDia.forEach((bloque, index) => {
        // Convertir formato de hora "HH:mm" a "HH:mm:ss"
        const horaEntrada = `${bloque.inicio}:00`
        const horaSalida = `${bloque.fin}:00`

        detalles.push({
          diaSemana,
          turno: index + 1,
          horaEntrada,
          horaSalida,
          // Si el bloque tiene un ID numérico, lo incluimos
          ...(bloque.id && !isNaN(parseInt(bloque.id)) ? { id: parseInt(bloque.id) } : {})
        })
      })
    })

    return detalles
  }

  // Manejador para cambios en bloques
  const handleBloqueChange = (dia: string, nuevosBloque: BloqueHorario[]) => {
    setBloquesHorarios((prev) => ({
      ...prev,
      [dia]: nuevosBloque,
    }))
    setFormModified(true)
  }

  // Función para guardar el horario
  const handleSave = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    setApiError(null)

    // Verificar que haya al menos un bloque de horario
    const totalBloques = Object.values(bloquesHorarios).reduce((total, bloquesDia) => total + bloquesDia.length, 0)

    if (totalBloques === 0) {
      toast({
        title: "Error en el horario",
        description: "Debe configurar al menos un bloque de horario.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      // Convertir los bloques a detalles para el backend
      const detalles = convertBloquesADetalles()

      // Crear el objeto para enviar al backend
      const horarioData: HorarioDto = {
        nombre: values.nombre,
        descripcion: values.descripcion,
        detalles: detalles
      }

      let response

      if (isEditing && horarioId) {
        // Actualizar horario existente
        const updateData: HorarioUpdateDto = {
          nombre: values.nombre,
          descripcion: values.descripcion,
          activo: values.activo
        }

        // Primero actualizamos los datos básicos del horario
        response = await axios.put<HorarioDto>(
          `${API_BASE_URL}/api/horarios/${horarioId}`,
          updateData
        )

        // Luego actualizamos los detalles uno por uno
        // Esto es una simplificación - en un caso real habría que manejar
        // la creación, actualización y eliminación de detalles de forma más sofisticada
        for (const detalle of detalles) {
          if (detalle.id) {
            // Actualizar detalle existente
            await axios.put(
              `${API_BASE_URL}/api/horarios/${horarioId}/detalles/${detalle.id}`,
              detalle
            )
          } else {
            // Crear nuevo detalle
            await axios.post(
              `${API_BASE_URL}/api/horarios/${horarioId}/detalles`,
              detalle
            )
          }
        }
      } else {
        // Crear nuevo horario
        const createData: HorarioCreateDto = {
          nombre: values.nombre,
          descripcion: values.descripcion
        }

        // Primero creamos el horario básico
        response = await axios.post<HorarioDto>(
          `${API_BASE_URL}/api/horarios`,
          createData
        )

        // Luego añadimos los detalles uno por uno
        const nuevoHorarioId = response.data.id
        if (nuevoHorarioId) {
          for (const detalle of detalles) {
            await axios.post(
              `${API_BASE_URL}/api/horarios/${nuevoHorarioId}/detalles`,
              detalle
            )
          }
        }
      }

      toast({
        title: "Horario guardado",
        description: `El horario "${values.nombre}" ha sido guardado correctamente.`,
      })

      setFormModified(false)

      // Llamar callback personalizado si existe, sino redirigir
      if (onSave) {
        onSave(response?.data || horarioData)
      } else {
        // Redirigir a la lista de horarios
        setTimeout(() => {
          router.push("/horarios")
        }, 1000)
      }
    } catch (error: any) {
      console.error("Error al guardar el horario:", error)
      setApiError(`Error al guardar: ${error.response?.data?.mensaje || error.message}`)
      toast({
        title: "Error al guardar",
        description: `Ocurrió un error al guardar el horario. ${error.response?.data?.mensaje || error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para manejar la cancelación
  const handleCancel = () => {
    if (formModified) {
      if (window.confirm("¿Estás seguro de que deseas cancelar? Los cambios no guardados se perderán.")) {
        if (onCancel) {
          onCancel()
        } else {
          router.push("/horarios")
        }
      }
    } else {
      if (onCancel) {
        onCancel()
      } else {
        router.push("/horarios")
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Mostrar mensaje de error si existe */}
      {apiError && (
        <div className="w-full bg-red-900/30 border border-red-700 text-red-400 p-4 rounded-lg mb-2 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>{apiError}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Cargando datos del horario...</span>
        </div>
      ) : (
        <Form {...form}>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Horario</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Turno Oficina Central Matutino" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. OFIMAT" {...field} disabled={isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej. Jornada estándar para personal administrativo de Lunes a Viernes. Incluye 1 hora de comida no pagada"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="inicioVigencia"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Inicio de Vigencia</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="finVigencia"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fin de Vigencia</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < form.getValues("inicioVigencia")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tipoHorario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Horario</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                      <SelectItem value="especial">Especial</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="activo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Estado del Horario</FormLabel>
                    <FormDescription>Activa o desactiva este horario</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="esHorarioJefe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      Horario de Jefe
                    </FormLabel>
                    <FormDescription>Marca si este es un horario especial para personal directivo</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Configuración de Bloques de Horarios</h3>
                <HorarioTableroBloques bloques={bloquesHorarios} onChange={handleBloqueChange} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Reglas de Asistencia Disponibles</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Las reglas de asistencia se asignarán automáticamente según la configuración de la base de datos.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  {reglasAsistencia.map((regla) => {
                    const IconComponent = regla.icon
                    return (
                      <Card key={regla.id} className="relative">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <IconComponent className={`h-4 w-4 text-${regla.color}-500`} />
                            {regla.nombre}
                            <Badge variant="outline" className={`text-${regla.color}-600 border-${regla.color}-200`}>
                              Solo lectura
                            </Badge>
                          </CardTitle>
                          <CardDescription>{regla.descripcion}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium">Retardo:</span> {regla.toleranciaRetardo}min
                            </div>
                            <div>
                              <span className="font-medium">Falta:</span> {regla.toleranciaFalta}min
                            </div>
                            <div>
                              <span className="font-medium">Entrada:</span> {regla.aperturaEntrada}min
                            </div>
                            <div>
                              <span className="font-medium">Salida:</span> {regla.aperturaSalida}min
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={form.handleSubmit(handleSave)}
                disabled={isSubmitting}
                className="relative"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Horario
                  </>
                )}
              </Button>
            </div>
          </div>
        </Form>
      )}
    </div>
  )
}