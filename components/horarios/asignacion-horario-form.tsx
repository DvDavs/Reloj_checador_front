"use client"

import { useState } from "react"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon, Search, X } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

const formSchema = z.object({
  tipoAsignacion: z.string({
    required_error: "Selecciona un tipo de asignación",
  }),
  fechaInicio: z.date({
    required_error: "La fecha de inicio es requerida",
  }),
  fechaFin: z.date({
    required_error: "La fecha de fin es requerida",
  }),
})

// Datos de ejemplo para el personal
const personalEjemplo = [
  { id: 1, nombre: "Juan Pérez López", departamento: "Administración" },
  { id: 2, nombre: "María Rodríguez Gómez", departamento: "Recursos Humanos" },
  { id: 3, nombre: "Carlos Sánchez Vega", departamento: "Contabilidad" },
  { id: 4, nombre: "Ana Martínez Ruiz", departamento: "Administración" },
  { id: 5, nombre: "Roberto González Torres", departamento: "Sistemas" },
  { id: 6, nombre: "Laura Fernández Castro", departamento: "Ventas" },
  { id: 7, nombre: "Miguel Ángel Díaz Ortiz", departamento: "Producción" },
  { id: 8, nombre: "Patricia Navarro Ramos", departamento: "Recursos Humanos" },
  { id: 9, nombre: "José Luis Morales Vargas", departamento: "Contabilidad" },
  { id: 10, nombre: "Sofía Gutiérrez Mendoza", departamento: "Contabilidad" },
  { id: 11, nombre: "Sofía Gutiérrez Mendoza", departamento: "Administración" },
]

export function AsignacionHorarioForm({ horarioId }: { horarioId: string }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPersonal, setSelectedPersonal] = useState<number[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipoAsignacion: "principal",
      fechaInicio: new Date(),
      fechaFin: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values, selectedPersonal)
    // Aquí iría la lógica para guardar la asignación
  }

  const filteredPersonal = personalEjemplo.filter(
    (persona) =>
      persona.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      persona.departamento.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSelectPersonal = (id: number) => {
    if (selectedPersonal.includes(id)) {
      setSelectedPersonal(selectedPersonal.filter((personaId) => personaId !== id))
    } else {
      setSelectedPersonal([...selectedPersonal, id])
    }
  }

  const getPersonalById = (id: number) => {
    return personalEjemplo.find((persona) => persona.id === id)
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="tipoAsignacion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Asignación</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="principal">Principal</SelectItem>
                    <SelectItem value="secundario">Secundario</SelectItem>
                    <SelectItem value="temporal">Temporal</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Define el tipo de asignación para este horario</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="fechaInicio"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Inicio</FormLabel>
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
              name="fechaFin"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Fin</FormLabel>
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
                        disabled={(date) => date < form.getValues("fechaInicio")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Seleccionar Personal</label>
          <div className="relative mt-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nombre o departamento..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="border rounded-md">
          <ScrollArea className="h-60">
            <div className="p-2 space-y-1">
              {filteredPersonal.length === 0 ? (
                <div className="p-2 text-center text-sm text-muted-foreground">No se encontraron resultados</div>
              ) : (
                filteredPersonal.map((persona) => (
                  <div
                    key={persona.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
                      selectedPersonal.includes(persona.id) && "bg-slate-100 dark:bg-slate-800",
                    )}
                    onClick={() => handleSelectPersonal(persona.id)}
                  >
                    <div>
                      <div className="font-medium">{persona.nombre}</div>
                      <div className="text-sm text-muted-foreground">{persona.departamento}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn("h-8 w-8 p-0", !selectedPersonal.includes(persona.id) && "opacity-0")}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectPersonal(persona.id)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div>
          <label className="text-sm font-medium">Personal Seleccionado ({selectedPersonal.length})</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedPersonal.length === 0 ? (
              <div className="text-sm text-muted-foreground">Ningún personal seleccionado</div>
            ) : (
              selectedPersonal.map((id) => {
                const persona = getPersonalById(id)
                if (!persona) return null
                return (
                  <Badge key={id} variant="secondary" className="flex items-center gap-1">
                    {persona.nombre}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => handleSelectPersonal(id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
