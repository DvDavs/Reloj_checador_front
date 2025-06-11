"use client"

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import axios from 'axios';

// Interfaz para los datos que se cargan y se editan
interface EmpleadoEditData {
    rfc?: string | null;
    curp?: string | null;
    primerNombre?: string | null;
    segundoNombre?: string | null;
    primerApellido?: string | null;
    segundoApellido?: string | null;
    departamentoAcademicoId?: number | null;
    departamentoAdministrativoId?: number | null;
    tipoNombramientoPrincipal?: string | null; // Puede ser null
    tipoNombramientoSecundario?: string | null; // Puede ser null
}

// --- Constantes ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const NONE_VALUE_SELECT = "__NONE__"; // Valor especial para representar null en Select

export default function EditarEmpleadoPage() {
    const router = useRouter();
    const params = useParams();
    const employeeId = params?.id as string;

    const [formData, setFormData] = useState<EmpleadoEditData>({});
    const [originalData, setOriginalData] = useState<EmpleadoEditData>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Cargar datos del empleado (sin cambios en la lógica de fetch)
    const fetchEmpleadoData = useCallback(async () => {
        // ... (lógica de fetch sin cambios) ...
         if (!employeeId) {
             setFetchError("No se proporcionó ID de empleado.");
             setIsLoading(false);
             return;
        };
        setIsLoading(true);
        setFetchError(null);
        setError(null);
        try {
            console.log(`Fetching data for employee ID: ${employeeId}`);
            const response = await axios.get<EmpleadoEditData>(`${API_BASE_URL}/api/empleados/${employeeId}`);
            const initialData: EmpleadoEditData = {
                 rfc: response.data.rfc,
                 curp: response.data.curp,
                 primerNombre: response.data.primerNombre,
                 segundoNombre: response.data.segundoNombre,
                 primerApellido: response.data.primerApellido,
                 segundoApellido: response.data.segundoApellido,
                 departamentoAcademicoId: response.data.departamentoAcademicoId,
                 departamentoAdministrativoId: response.data.departamentoAdministrativoId,
                 tipoNombramientoPrincipal: response.data.tipoNombramientoPrincipal,
                 tipoNombramientoSecundario: response.data.tipoNombramientoSecundario,
            };
            setFormData(initialData);
            setOriginalData(initialData);
            console.log("Employee data loaded:", initialData);
        } catch (err: any) {
            console.error("Error fetching employee data:", err);
            const errorMsg = err.response?.data?.message || err.message || "Error desconocido";
            setFetchError(`No se pudo cargar la información del empleado (ID: ${employeeId}). ${errorMsg}`);
            setFormData({});
            setOriginalData({});
        } finally {
            setIsLoading(false);
        }
    }, [employeeId, API_BASE_URL]);

    useEffect(() => {
        fetchEmpleadoData();
    }, [fetchEmpleadoData]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const finalValue = (name === 'rfc' || name === 'curp') ? value.toUpperCase() : value;
        setFormData((prev) => ({ ...prev, [name]: finalValue }));
        setError(null);
    };

    // *** MODIFICADO: Handle para Selects ***
    const handleSelectChange = (name: keyof EmpleadoEditData, value: string) => {
         const isIdField = name.includes('Id');
         let finalValue: string | number | null;

         if (value === NONE_VALUE_SELECT) {
             // Si el usuario seleccionó "(Ninguno)", establece el valor a null
             finalValue = null;
         } else if (isIdField) {
             // Si es un campo ID y no es "Ninguno", conviértelo a número
             finalValue = value ? parseInt(value, 10) : null;
         } else {
             // Si es un campo de texto (como nombramiento) y no es "Ninguno", usa el valor string
             finalValue = value;
         }

         setFormData((prev) => ({
           ...prev,
           [name]: finalValue,
         }));
         setError(null); // Limpiar error al cambiar
    };

    // handleSubmit (la lógica de comparación y envío no necesita cambios aquí)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employeeId) return;

        setIsSubmitting(true);
        setError(null);

        const payload: Partial<EmpleadoEditData> = {};
        let hasChanges = false;

        const keysToCompare: (keyof EmpleadoEditData)[] = [
            'rfc', 'curp', 'primerNombre', 'segundoNombre', 'primerApellido',
            'segundoApellido', 'departamentoAcademicoId', 'departamentoAdministrativoId',
            'tipoNombramientoPrincipal', 'tipoNombramientoSecundario'
        ];

        keysToCompare.forEach(key => {
            const currentValue = formData[key] ?? ''; // Trata null/undefined como '' para comparación
            const originalValue = originalData[key] ?? ''; // Trata null/undefined como '' para comparación

            // Compara si son diferentes (null/undefined/'' son iguales entre sí)
            
            if (currentValue !== originalValue) {
                (payload as any)[key] = formData[key as keyof EmpleadoEditData];
                hasChanges = true;
            }
        });


        if (!hasChanges) {
             setError("No se detectaron cambios para guardar.");
             setIsSubmitting(false);
             return;
        }

        // Validación básica en frontend
        if (!formData.primerNombre || !formData.primerApellido || !formData.rfc || !formData.curp) {
            setError("Primer Nombre, Primer Apellido, RFC y CURP son obligatorios.");
            setIsSubmitting(false);
            return;
        }
        if (formData.rfc && formData.rfc.length < 10) {
             setError("RFC inválido (mínimo 10 caracteres)."); setIsSubmitting(false); return;
        }
         if (formData.curp && formData.curp.length !== 18) {
             setError("CURP inválido (debe tener 18 caracteres)."); setIsSubmitting(false); return;
        }

        try {
            console.log(`Sending PUT request for ID ${employeeId} with payload:`, payload);
            await axios.put(`${API_BASE_URL}/api/empleados/${employeeId}`, payload);
            console.log("Employee updated successfully");
            router.push("/empleados");
        } catch (err: any) {
            console.error("Error updating empleado:", err);
            const backendError = err.response?.data?.message || err.response?.data || err.message || "Error desconocido";
            let displayError = typeof backendError === 'string' ? backendError : JSON.stringify(backendError);
            if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
                 displayError = err.response.data.errors.map((e: any) => e.defaultMessage || JSON.stringify(e)).join('; ');
            }
            setError(`Error al actualizar: ${displayError}`);
            setIsSubmitting(false);
        }
    };

    // --- Renderizado ---
    if (isLoading) {
        return ( /* ... loading state ... */
             <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                <span className="ml-4 text-xl text-zinc-400">Cargando datos del empleado...</span>
            </div>
        );
    }

    if (fetchError) {
        return ( /* ... fetch error state ... */
             <div className="p-8">
                 <div className="flex items-center gap-2 mb-8">
                     <Link href="/empleados" aria-label="Volver a la lista de empleados">
                         <Button variant="outline" size="icon" className="h-8 w-8 rounded-full"> <ArrowLeft className="h-4 w-4" /> </Button>
                     </Link>
                     <h1 className="text-3xl font-bold text-red-500">Error al Cargar</h1>
                 </div>
                 <Card className="max-w-3xl mx-auto bg-red-900/20 border-red-700">
                     <CardHeader> <CardTitle>Error</CardTitle> </CardHeader>
                     <CardContent>
                         <p className="text-red-300">{fetchError}</p>
                     </CardContent>
                      <CardFooter>
                          <Link href="/empleados"><Button variant="outline">Volver a la lista</Button></Link>
                      </CardFooter>
                 </Card>
             </div>
        );
    }

    return (
        <div className="p-8">
             {/* ... Encabezado ... */}
             <div className="flex items-center gap-2 mb-8">
                <Link href="/empleados" aria-label="Volver a la lista de empleados">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">Editar Empleado</h1>
            </div>

            <Card className="max-w-3xl mx-auto bg-zinc-900 border-zinc-800">
                 {/* ... CardHeader ... */}
                 <CardHeader>
                    <CardTitle>Información del Empleado</CardTitle>
                    <CardDescription>Modifique los datos necesarios y guarde los cambios.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                         {/* ... Error de Submit ... */}
                         {error && (
                            <div className="p-3 bg-red-900/30 border border-red-500/50 text-red-400 rounded-lg flex items-center gap-2 text-sm">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" /> <p>{error}</p>
                            </div>
                        )}

                        {/* --- Inputs de Texto (sin cambios) --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="primerNombre">Primer Nombre <span className="text-red-500">*</span></Label>
                                <Input id="primerNombre" name="primerNombre" value={formData.primerNombre || ''} onChange={handleChange} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="segundoNombre">Segundo Nombre</Label>
                                <Input id="segundoNombre" name="segundoNombre" value={formData.segundoNombre || ''} onChange={handleChange} />
                            </div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="primerApellido">Primer Apellido <span className="text-red-500">*</span></Label>
                                <Input id="primerApellido" name="primerApellido" value={formData.primerApellido || ''} onChange={handleChange} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="segundoApellido">Segundo Apellido</Label>
                                <Input id="segundoApellido" name="segundoApellido" value={formData.segundoApellido || ''} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="rfc">RFC <span className="text-red-500">*</span></Label>
                            <Input id="rfc" name="rfc" placeholder="XXXX000000XXX" value={formData.rfc || ''} onChange={handleChange} maxLength={13} className="uppercase" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="curp">CURP <span className="text-red-500">*</span></Label>
                            <Input id="curp" name="curp" placeholder="XXXX000000XXXXXX00" value={formData.curp || ''} onChange={handleChange} maxLength={18} className="uppercase" required />
                          </div>
                        </div>

                        {/* --- Selects (MODIFICADOS) --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="tipoNombramientoPrincipal">Nombramiento Principal</Label>
                                {/*
                                   - El 'value' del Select debe ser el valor del estado o el valor especial si el estado es null/undefined
                                   - El 'onValueChange' llama a handleSelectChange que ahora maneja el valor especial
                                */}
                                <Select
                                    value={formData.tipoNombramientoPrincipal ?? NONE_VALUE_SELECT}
                                    onValueChange={(value) => handleSelectChange("tipoNombramientoPrincipal", value)}
                                >
                                    <SelectTrigger id="tipoNombramientoPrincipal">
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* Usa el valor especial para la opción "Ninguno" */}
                                        <SelectItem value={NONE_VALUE_SELECT}>(Ninguno)</SelectItem>
                                        <SelectItem value="DOCENTE">Docente</SelectItem>
                                        <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
                                        {/* Añade más si aplica */}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="tipoNombramientoSecundario">Nombramiento Secundario</Label>
                                <Select
                                    value={formData.tipoNombramientoSecundario ?? NONE_VALUE_SELECT}
                                    onValueChange={(value) => handleSelectChange("tipoNombramientoSecundario", value)}
                                >
                                     <SelectTrigger id="tipoNombramientoSecundario">
                                         <SelectValue placeholder="Seleccionar..." />
                                     </SelectTrigger>
                                     <SelectContent>
                                         {/* Usa el valor especial para la opción "Ninguno" */}
                                        <SelectItem value={NONE_VALUE_SELECT}>(Ninguno)</SelectItem>
                                        <SelectItem value="BASE">Base</SelectItem>
                                        <SelectItem value="HONORARIOS">Honorarios</SelectItem>
                                        <SelectItem value="CONFIANZA">Confianza</SelectItem>
                                        <SelectItem value="INTERINATO">Interinato</SelectItem>
                                        <SelectItem value="JEFE">Interinato</SelectItem>
                                         {/* Añade más si aplica */}
                                     </SelectContent>
                                 </Select>
                            </div>
                        </div>

                    </CardContent>
                    {/* ... CardFooter (sin cambios) ... */}
                     <CardFooter className="flex justify-between">
                        <Link href="/empleados">
                            <Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button>
                        </Link>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting || isLoading}>
                            {isSubmitting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Actualizando...</>
                            ) : (
                                <> <Save className="mr-2 h-4 w-4" /> Guardar Cambios </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}