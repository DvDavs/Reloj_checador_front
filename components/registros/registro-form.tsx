"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowDownCircle, ArrowUpCircle, Search } from "lucide-react"

export function RegistroForm() {
  const [empleado, setEmpleado] = useState("")
  const [tipoRegistro, setTipoRegistro] = useState("entrada")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí iría la lógica para registrar la entrada o salida
    console.log({ empleado, tipoRegistro })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Asistencia</CardTitle>
        <CardDescription>Registra manualmente la entrada o salida de un empleado</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Empleado</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nombre, RFC o CURP"
                className="pl-8"
                value={empleado}
                onChange={(e) => setEmpleado(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Registro</label>
            <Select value={tipoRegistro} onValueChange={setTipoRegistro}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de registro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">
                  <div className="flex items-center">
                    <ArrowDownCircle className="mr-2 h-4 w-4 text-green-500" />
                    <span>Entrada</span>
                  </div>
                </SelectItem>
                <SelectItem value="salida">
                  <div className="flex items-center">
                    <ArrowUpCircle className="mr-2 h-4 w-4 text-blue-500" />
                    <span>Salida</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha y Hora</label>
            <Input
              type="datetime-local"
              value={fechaHora}
              onChange={(e) => setFechaHora(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Observaciones</label>
            <Input type="text" placeholder="Observaciones (opcional)" />
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} className="w-full">
          {tipoRegistro === "entrada" ? (
            <>
              <ArrowDownCircle className="mr-2 h-4 w-4" />
              Registrar Entrada
            </>
          ) : (
            <>
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              Registrar Salida
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
