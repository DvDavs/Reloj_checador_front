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
import { CalendarIcon, Crown, Shield, Clock, AlertTriangle, Save, Loader2 } from "lucide-react"
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
import axios from "axios"
import type { BloqueHorario } from "./horario-tablero-bloques"

// API Base URL para las peticiones
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

// Definir tipos para los DTOs según los archivos Java proporcionados
type DetalleHorarioDto = {
  id?: number
  diaSemana: number
  turno: number
  horaEntrada: string // "HH:mm:ss"
  horaSalida: string // "HH:mm:ss"
}

type DetalleHorarioCreateDto = {
  diaSemana: number
  turno: number
  horaEntrada: string // "HH:mm:ss"
  horaSalida: string // "HH:mm:ss"
}

type HorarioDto = {
  id?: number
  nombre: string
  descripcion?: string
  esHorarioJefe?: boolean // ← AGREGAR ESTE CAMPO
  detalles: DetalleHorarioDto[]
}

type HorarioCreateDto = {
  nombre: string
  descripcion?: string
  esHorarioJefe?: boolean // ← AGREGAR ESTE CAMPO
}

type HorarioUpdateDto = {
  nombre: string
  descripcion?: string
  activo: boolean
  esHorarioJefe?: boolean // ← AGREGAR ESTE CAMPO
}

const formSchema = z.object({
  nombre: z.string().min(3, {
    message: "El nombre debe tener al menos 3 caracteres.",
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
      loadHorarioData(Number.parseInt(horarioId))
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
        descripcion: horarioData.descripcion || "",
        tipoHorario: "normal", // Asumimos un valor por defecto ya que no viene en el DTO
        inicioVigencia: new Date(), // Estos campos no vienen en el DTO, mantenemos los valores por defecto
        finVigencia: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        activo: true,
        esHorarioJefe: horarioData.esHorarioJefe || false, // ← CARGAR EL VALOR DEL BACKEND
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

    detalles.forEach((detalle) => {
      // Ajustar el índice del día (backend: 1-7, frontend: 0-6)
      const diaIndex = detalle.diaSemana - 1
      if (diaIndex >= 0 && diaIndex < 7) {
        const diaNombre = diasSemana[diaIndex]

        // Convertir formato de hora "HH:mm:ss" a "HH:mm"
        const horaEntrada = detalle.horaEntrada.substring(0, 5)
        const horaSalida = detalle.horaSalida.substring(0, 5)

        bloques[diaNombre].push({
          id: detalle.id?.toString() || `new-${Date.now()}-${Math.random()}`,
          inicio: horaEntrada,
          fin: horaSalida,
        })
      }
    })

    return bloques
  }

  // Función para convertir bloques del componente a detalles para el backend
  const convertBloquesADetalles = (): DetalleHorarioCreateDto[] => {
    const diasSemana = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]
    const detalles: DetalleHorarioCreateDto[] = []

    Object.entries(bloquesHorarios).forEach(([dia, bloquesDia]) => {
      // Obtener el índice del día (frontend: nombre, backend: 1-7)
      const diaIndex = diasSemana.indexOf(dia)
      if (diaIndex === -1) {
        console.warn(`Día no reconocido: ${dia}`)
        return
      }

      const diaSemana = diaIndex + 1 // Convertir a 1-7 para el backend

      if (diaSemana < 1 || diaSemana > 7) {
        console.warn(`Día inválido: ${dia} -> ${diaSemana}`)
        return
      }

      bloquesDia.forEach((bloque, index) => {
        // Validar y formatear horas
        const formatearHora = (hora: string): string => {
          // Limpiar la hora y validar formato básico HH:mm
          const horaLimpia = hora.trim()
          const regex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/

          if (!regex.test(horaLimpia)) {
            console.warn(`Formato de hora inválido: ${hora}`)
            return ""
          }

          return `${horaLimpia}:00`
        }

        const horaEntrada = formatearHora(bloque.inicio)
        const horaSalida = formatearHora(bloque.fin)

        // Validar que las horas sean válidas
        if (!horaEntrada || !horaSalida) {
          console.warn(`Horas inválidas para ${dia}: ${bloque.inicio} - ${bloque.fin}`)
          return // Saltar este bloque
        }

        // Validar que la hora de salida sea posterior a la de entrada
        if (horaEntrada >= horaSalida) {
          console.warn(`Horario inválido para ${dia}: ${horaEntrada} - ${horaSalida}`)
          return // Saltar este bloque
        }

        const nuevoDetalle: DetalleHorarioCreateDto = {
          diaSemana,
          turno: index + 1,
          horaEntrada,
          horaSalida,
        }

        console.log(`Agregando detalle: Día ${diaSemana} (${dia}), Turno ${index + 1}, ${horaEntrada} - ${horaSalida}`)
        detalles.push(nuevoDetalle)
      })
    })

    console.log("Detalles convertidos:", detalles)
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

      if (detalles.length === 0) {
        toast({
          title: "Error en el horario",
          description: "No se pudieron procesar los bloques de horario. Verifique que las horas sean válidas.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      console.log("Detalles a enviar:", detalles)

      let response

      if (isEditing && horarioId) {
        // Actualizar horario existente
        const updateData: HorarioUpdateDto = {
          nombre: values.nombre,
          descripcion: values.descripcion,
          activo: values.activo,
          esHorarioJefe: values.esHorarioJefe, // ← ENVIAR EL VALOR AL BACKEND
        }

        console.log("Actualizando horario con datos:", updateData)

        // Primero actualizamos los datos básicos del horario
        response = await axios.put<HorarioDto>(`${API_BASE_URL}/api/horarios/${horarioId}`, updateData)
        console.log("Horario básico actualizado:", response.data)

        // Estrategia mejorada para actualizar detalles
        try {
          // Obtener detalles actuales
          const horarioActual = await axios.get<HorarioDto>(`${API_BASE_URL}/api/horarios/${horarioId}`)
          console.log("Detalles actuales:", horarioActual.data.detalles)

          // Eliminar detalles existentes de forma más robusta
          if (horarioActual.data.detalles && horarioActual.data.detalles.length > 0) {
            console.log(`Eliminando ${horarioActual.data.detalles.length} detalles existentes...`)

            const deletePromises = horarioActual.data.detalles.map(async (detalle) => {
              if (detalle.id) {
                try {
                  await axios.delete(`${API_BASE_URL}/api/horarios/${horarioId}/detalles/${detalle.id}`)
                  console.log(`Detalle ${detalle.id} eliminado exitosamente`)
                  return { success: true, id: detalle.id }
                } catch (deleteError: any) {
                  console.warn(
                    `Error al eliminar detalle ${detalle.id}:`,
                    deleteError.response?.status,
                    deleteError.response?.data,
                  )
                  // No lanzar error, solo registrar el problema
                  return { success: false, id: detalle.id, error: deleteError.response?.status }
                }
              }
              return { success: true, id: "no-id" }
            })

            const deleteResults = await Promise.all(deletePromises)
            const failedDeletes = deleteResults.filter((result) => !result.success)

            if (failedDeletes.length > 0) {
              console.warn(`${failedDeletes.length} detalles no se pudieron eliminar:`, failedDeletes)
            }
          }

          // Esperar un poco antes de crear los nuevos detalles
          await new Promise((resolve) => setTimeout(resolve, 500))

          // Crear los nuevos detalles uno por uno con mejor manejo de errores
          console.log(`Creando ${detalles.length} nuevos detalles...`)
          const createResults = []

          for (let i = 0; i < detalles.length; i++) {
            const detalle = detalles[i]
            try {
              console.log(`Creando detalle ${i + 1}/${detalles.length}:`, detalle)
              const createResponse = await axios.post(`${API_BASE_URL}/api/horarios/${horarioId}/detalles`, detalle)
              console.log(`Detalle ${i + 1} creado exitosamente:`, createResponse.data)
              createResults.push({ success: true, detalle, response: createResponse.data })
            } catch (createError: any) {
              console.error(`Error al crear detalle ${i + 1}:`, createError.response?.data)
              createResults.push({
                success: false,
                detalle,
                error: createError.response?.data || createError.message,
              })

              // Si es un error crítico, detener el proceso
              if (createError.response?.status === 500) {
                throw new Error(
                  `Error crítico al crear detalle: ${createError.response?.data?.mensaje || createError.message}`,
                )
              }
            }
          }

          const failedCreates = createResults.filter((result) => !result.success)

          if (failedCreates.length > 0) {
            console.error(`${failedCreates.length} detalles no se pudieron crear:`, failedCreates)
            throw new Error(
              `No se pudieron crear ${failedCreates.length} de ${detalles.length} detalles. Revise los datos y vuelva a intentar.`,
            )
          }

          console.log("Todos los detalles fueron actualizados exitosamente")
        } catch (detailError: any) {
          console.error("Error al actualizar detalles:", detailError)
          throw new Error(`Error al actualizar detalles: ${detailError.message}`)
        }
      } else {
        // Crear nuevo horario
        const createData: HorarioCreateDto = {
          nombre: values.nombre,
          descripcion: values.descripcion,
          esHorarioJefe: values.esHorarioJefe, // ← ENVIAR EL VALOR AL BACKEND
        }

        console.log("Creando nuevo horario con datos:", createData)

        // Primero creamos el horario básico
        response = await axios.post<HorarioDto>(`${API_BASE_URL}/api/horarios`, createData)
        console.log("Horario creado:", response.data)

        // Luego añadimos los detalles uno por uno
        const nuevoHorarioId = response.data.id
        if (nuevoHorarioId && detalles.length > 0) {
          console.log(`Añadiendo ${detalles.length} detalles al horario ${nuevoHorarioId}...`)

          for (let i = 0; i < detalles.length; i++) {
            const detalle = detalles[i]
            try {
              console.log(`Creando detalle ${i + 1}/${detalles.length}:`, detalle)
              const createResponse = await axios.post(
                `${API_BASE_URL}/api/horarios/${nuevoHorarioId}/detalles`,
                detalle,
              )
              console.log(`Detalle ${i + 1} creado exitosamente:`, createResponse.data)
            } catch (createError: any) {
              console.error(`Error al crear detalle ${i + 1}:`, createError.response?.data)
              throw new Error(
                `Error al crear detalle ${i + 1}: ${createError.response?.data?.mensaje || createError.message}`,
              )
            }
          }
        }

        console.log("Horario creado y detalles añadidos exitosamente")
      }

      toast({
        title: "Horario guardado",
        description: `El horario "${values.nombre}" ha sido guardado correctamente.`,
      })

      setFormModified(false)

      // Llamar callback personalizado si existe, sino redirigir
      if (onSave) {
        onSave(response?.data)
      } else {
        // Redirigir a la lista de horarios
        setTimeout(() => {
          router.push("/horarios")
        }, 1000)
      }
    } catch (error: any) {
      console.error("Error al guardar el horario:", error)

      // Mejorar el manejo de errores
      let errorMessage = "Error desconocido"

      if (error.response?.data?.mensaje) {
        errorMessage = error.response.data.mensaje
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.data) {
        // Si la respuesta es un objeto, intentar extraer información útil
        if (typeof error.response.data === "object") {
          errorMessage = JSON.stringify(error.response.data)
        } else {
          errorMessage = error.response.data.toString()
        }
      } else if (error.message) {
        errorMessage = error.message
      }

      setApiError(`Error al guardar: ${errorMessage}`)
      toast({
        title: "Error al guardar",
        description: `Ocurrió un error al guardar el horario. ${errorMessage}`,
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
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej. Jornada estándar para personal administrativo de Lunes a Viernes. Incluye 1 hora de comida no pagada"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>






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
