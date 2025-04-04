"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Loader2, AlertCircle, Info } from "lucide-react"
import Link from "next/link"
import axios from 'axios';

// Interfaz Empleado Backend (simplificada)
interface EmpleadoBackend {
  id: number;
  primerNombre: string | null;
  segundoNombre: string | null;
  primerApellido: string | null;
  segundoApellido: string | null;
  // ...otros campos si los necesitas después de crear
}

// --- Constantes ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function RegistrarEmpleadoPage() {
  const router = useRouter();
  // Ajustar estado inicial para reflejar mejor los campos necesarios
  const [formData, setFormData] = useState({
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    rfc: "",
    curp: "",
    // Añade aquí IDs/valores para departamento, nombramiento, estatus si los pides en el form
    departamentoAcademicoId: null as number | null,
    departamentoAdministrativoId: null as number | null,
    tipoNombramientoPrincipal: "",
    tipoNombramientoSecundario: "",
    estatusId: 1, // Default a activo
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Convertir a mayúsculas solo para RFC y CURP
    const finalValue = (name === 'rfc' || name === 'curp') ? value.toUpperCase() : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  // Handler genérico para Selects (si usas IDs numéricos para depto/estatus)
  const handleSelectChange = (name: keyof typeof formData, value: string) => {
    // Convertir a número si es un ID, o mantener como string
    const isIdField = name.includes('Id');
    setFormData((prev) => ({
      ...prev,
      [name]: isIdField ? (value ? parseInt(value, 10) : null) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // *** LÓGICA HABILITADA ***
    setIsSubmitting(true);
    setError(null);

    // *** Payload ajustado a EmpleadoCreateDto ***
    const payload = {
        rfc: formData.rfc || null,
        curp: formData.curp || null,
        primerNombre: formData.primerNombre || null,
        segundoNombre: formData.segundoNombre || null,
        primerApellido: formData.primerApellido || null,
        segundoApellido: formData.segundoApellido || null,
        departamentoAcademicoId: formData.departamentoAcademicoId,
        departamentoAdministrativoId: formData.departamentoAdministrativoId,
        tipoNombramientoPrincipal: formData.tipoNombramientoPrincipal || null,
        tipoNombramientoSecundario: formData.tipoNombramientoSecundario || null,
        estatusId: formData.estatusId,
    };

    // Validación básica en frontend
    if (!payload.primerNombre || !payload.primerApellido || !payload.rfc || !payload.curp) {
        setError("Primer Nombre, Primer Apellido, RFC y CURP son obligatorios.");
        setIsSubmitting(false);
        return;
    }
    if (payload.rfc && payload.rfc.length < 10) { // Ejemplo validación longitud
         setError("RFC inválido."); setIsSubmitting(false); return;
    }
     if (payload.curp && payload.curp.length !== 18) {
         setError("CURP inválido."); setIsSubmitting(false); return;
    }


    try {
        console.log("Enviando payload a POST /api/empleados:", payload);
        // *** LLAMAR AL NUEVO ENDPOINT ***
        const response = await axios.post<EmpleadoBackend>( // Espera EmpleadoBackend
           `${API_BASE_URL}/api/empleados`,
           payload
        );

        const createdEmpleado = response.data;
        console.log("Empleado creado:", createdEmpleado);

        // Usar helper para nombre completo
        const fullName = [createdEmpleado.primerNombre, createdEmpleado.segundoNombre, createdEmpleado.primerApellido, createdEmpleado.segundoApellido].filter(Boolean).join(" ");

        // Redirigir a la asignación de huella
        router.push(`/empleados/asignar-huella?id=${createdEmpleado.id}&nombre=${encodeURIComponent(fullName)}`);

        // La redirección debería ocurrir, no necesitamos setIsSubmitting(false) aquí normalmente

    } catch (err: any) {
        console.error("Error creating empleado:", err);
        const backendError = err.response?.data?.message // Captura mensaje de ApiException si existe
                          || err.response?.data?.error // Captura error genérico
                          || err.response?.data // A veces el error viene directo en data
                          || err.message
                          || "Error desconocido";
         let displayError = typeof backendError === 'string' ? backendError : JSON.stringify(backendError);
        setError(`Error al crear el empleado: ${displayError}`);
        setIsSubmitting(false); // Permitir reintento
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
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          {/* *** QUITAR opacity-50 pointer-events-none *** */}
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-500/50 text-red-400 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" /> <p>{error}</p>
              </div>
            )}

            {/* Campos del Formulario - AJUSTAR NOMBRES Y AÑADIR LOS NECESARIOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="primerNombre">Primer Nombre <span className="text-red-500">*</span></Label>
                    <Input id="primerNombre" name="primerNombre" value={formData.primerNombre} onChange={handleChange} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="segundoNombre">Segundo Nombre</Label>
                    <Input id="segundoNombre" name="segundoNombre" value={formData.segundoNombre} onChange={handleChange} />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label htmlFor="primerApellido">Primer Apellido <span className="text-red-500">*</span></Label>
                    <Input id="primerApellido" name="primerApellido" value={formData.primerApellido} onChange={handleChange} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="segundoApellido">Segundo Apellido</Label>
                    <Input id="segundoApellido" name="segundoApellido" value={formData.segundoApellido} onChange={handleChange} />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="rfc">RFC <span className="text-red-500">*</span></Label>
                <Input id="rfc" name="rfc" placeholder="XXXX000000XXX" value={formData.rfc} onChange={handleChange} maxLength={13} className="uppercase" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="curp">CURP <span className="text-red-500">*</span></Label>
                <Input id="curp" name="curp" placeholder="XXXX000000XXXXXX00" value={formData.curp} onChange={handleChange} maxLength={18} className="uppercase" required />
              </div>
            </div>
             {/* Añade Selects para departamento, nombramiento, estatus si los necesitas */}
             {/* Ejemplo para Nombramiento Principal */}
             <div className="space-y-2">
                 <Label htmlFor="tipoNombramientoPrincipal">Nombramiento Principal</Label>
                 <Select value={formData.tipoNombramientoPrincipal} onValueChange={(value) => handleSelectChange("tipoNombramientoPrincipal", value)}>
                     <SelectTrigger id="tipoNombramientoPrincipal"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                     <SelectContent>
                         <SelectItem value="DOCENTE">Docente</SelectItem>
                         <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
                         {/* Añade más si aplica */}
                     </SelectContent>
                 </Select>
             </div>
             {/* ... Añade más selects o inputs para otros campos del DTO ... */}

          </CardContent>

          <CardFooter className="flex justify-between">
            <Link href="/empleados">
              {/* *** HABILITAR BOTÓN CANCELAR *** */}
              <Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button>
            </Link>
            {/* *** HABILITAR BOTÓN GUARDAR *** */}
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