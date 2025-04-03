"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import axios from 'axios';

// --- Tipo del Backend User ---
interface BackendUser {
    id: number;
    name: string;
    email: string | null;
    fingerprintTemplate: string | null;
}

// --- Constantes ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function RegistrarEmpleadoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    numeroTarjeta: "",
    nombre: "",
    rfc: "",
    curp: "",
    area: "",
    // Añadir email si quieres pedirlo explícitamente
    // email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() })); // Convertir a mayúsculas
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // *** Adaptar datos al payload esperado por POST /api/users ***
    const payload = {
      name: formData.nombre.trim(), // Asegurar que no haya espacios extra
      // Email: Derivado o de un campo de formulario. Asegúrate que sea único si el backend lo requiere.
      // Ejemplo: usando el RFC si existe, si no, uno temporal (¡OJO! esto puede no ser ideal)
      email: formData.rfc ? `${formData.rfc}@itoaxaca.edu.mx` : `sinemail_${Date.now()}@itoaxaca.edu.mx`,
      // fingerprintTemplate será null al crear el usuario base
    };

    // Validación simple (añade más si es necesario)
    if (!payload.name) {
        setError("El nombre completo es obligatorio.");
        setIsSubmitting(false);
        return;
    }

    try {
      console.log("Enviando payload:", payload);
      const response = await axios.post<BackendUser>( // Espera BackendUser como respuesta
        `${API_BASE_URL}/api/users`,
        payload
      );

      const createdUser = response.data;
      console.log("Usuario creado:", createdUser);
      const userId = createdUser.id;
      const userName = createdUser.name;

      // Redirigir a la página de asignación de huella con los datos del usuario creado
      router.push(`/empleados/asignar-huella?id=${userId}&nombre=${encodeURIComponent(userName)}`);
      // La redirección ocurre, no necesitamos setIsSubmitting(false) aquí

    } catch (err: any) {
      console.error("Error creating user:", err);
      const backendError = err.response?.data?.message || err.response?.data || err.message || "Error desconocido";
      setError(`Error al crear el usuario: ${backendError}`);
      setIsSubmitting(false); // Permitir reintentar
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 mb-8">
        <Link href="/empleados" aria-label="Volver a la lista de empleados">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Registrar Nuevo Empleado</h1>
      </div>

      <Card className="max-w-3xl mx-auto bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Información del Empleado</CardTitle>
          <CardDescription>
            Ingrese los datos básicos. La asignación de huella se realizará en el siguiente paso.
             <br/><strong className="text-yellow-400">Nota:</strong> Los campos RFC, CURP, Tarjeta y Área son informativos por ahora y no se guardan en el backend actual.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
             {/* Mensaje de Error */}
            {error && (
                <div className="p-3 bg-red-900/30 border border-red-500/50 text-red-400 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <p>{error}</p>
                </div>
            )}

            {/* Campos del Formulario */}
             <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo <span className="text-red-500">*</span></Label>
              <Input
                id="nombre"
                name="nombre"
                placeholder="Nombre(s) Apellido Paterno Apellido Materno"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="uppercase"
              />
            </div>

             {/* Campos informativos (no se guardan en backend actual) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                <Label htmlFor="numeroTarjeta">Número de Tarjeta (Informativo)</Label>
                <Input
                  id="numeroTarjeta"
                  name="numeroTarjeta"
                  placeholder="EMP-2024-XXXX"
                  value={formData.numeroTarjeta}
                  onChange={handleChange}
                  className="uppercase"
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="area">Área (Informativo)</Label>
                <Select value={formData.area} onValueChange={(value) => handleSelectChange("area", value)}>
                  <SelectTrigger id="area">
                    <SelectValue placeholder="Seleccionar área" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Llena con tus áreas */}
                    <SelectItem value="Sistemas">Sistemas</SelectItem>
                    <SelectItem value="Administración">Administración</SelectItem>
                    <SelectItem value="Docencia">Docencia</SelectItem>
                    <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                    <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="Biblioteca">Biblioteca</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                <Label htmlFor="rfc">RFC (Informativo, usado para email temporal)</Label>
                <Input
                  id="rfc"
                  name="rfc"
                  placeholder="XXXX000000XXX"
                  value={formData.rfc}
                  onChange={handleChange}
                  maxLength={13}
                  className="uppercase"
                />
              </div>

               <div className="space-y-2">
                <Label htmlFor="curp">CURP (Informativo)</Label>
                <Input
                  id="curp"
                  name="curp"
                  placeholder="XXXX000000XXXXXX00"
                  value={formData.curp}
                  onChange={handleChange}
                   maxLength={18}
                  className="uppercase"
                />
              </div>
            </div>
              {/* Podrías añadir un campo de Email aquí si prefieres pedirlo */}
               {/* <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                <Input id="email" name="email" type="email" placeholder="correo@ejemplo.com" value={formData.email} onChange={handleChange} required />
               </div> */}

          </CardContent>

          <CardFooter className="flex justify-between">
            <Link href="/empleados">
              <Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button>
            </Link>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar y Asignar Huella
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}