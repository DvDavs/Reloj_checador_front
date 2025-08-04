'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { BreadcrumbNav } from '@/app/components/shared/breadcrumb-nav';
import { LoadingState } from '@/app/components/shared/loading-state';
import { ErrorState } from '@/app/components/shared/error-state';
import { EmployeeForm } from '@/app/components/shared/employee-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';

// Interfaz para los datos que vienen de la API
interface EmpleadoApiData {
  rfc?: string | null;
  curp?: string | null;
  tarjeta?: number | null;
  primerNombre?: string | null;
  segundoNombre?: string | null;
  primerApellido?: string | null;
  segundoApellido?: string | null;
  nombramiento?: string | null;
  departamento?: number | null; // Viene como número
  academia?: number | null; // Viene como número
  tipoNombramientoSecundario?: string | null;
}

// Interfaz para el estado del FORMULARIO
interface EmpleadoFormData {
  rfc?: string | null;
  curp?: string | null;
  tarjeta?: number | null;
  primerNombre?: string | null;
  segundoNombre?: string | null;
  primerApellido?: string | null;
  segundoApellido?: string | null;
  nombramiento?: string | null;
  departamento?: string | null; // Se guarda como string (clave)
  academia?: string | null; // Se guarda como string (clave)
  tipoNombramientoSecundario?: string | null;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const NONE_VALUE_SELECT = '__NONE__';

export default function EditarEmpleadoPage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params?.id as string;

  const [formData, setFormData] = useState<EmpleadoFormData>({});
  const [originalData, setOriginalData] = useState<EmpleadoFormData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchEmpleadoData = useCallback(async () => {
    if (!employeeId) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await apiClient.get<EmpleadoApiData>(
        `${API_BASE_URL}/api/empleados/${employeeId}`
      );
      const initialFormData: EmpleadoFormData = {
        ...response.data,
        departamento: response.data.departamento?.toString() ?? null,
        academia: response.data.academia?.toString() ?? null,
      };
      setFormData(initialFormData);
      setOriginalData(initialFormData);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || err.message || 'Error desconocido';
      setFetchError(
        `No se pudo cargar la información del empleado: ${errorMsg}`
      );
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchEmpleadoData();
  }, [fetchEmpleadoData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    let finalValue: string | number | null = value;
    if (type === 'number') {
      finalValue = value === '' ? null : Number(value);
    } else {
      finalValue =
        name === 'rfc' || name === 'curp' ? value.toUpperCase() : value;
    }
    setFormData((prev) => ({ ...prev, [name]: finalValue as any }));
    setError(null);
  };

  const handleSelectChange = (name: keyof EmpleadoFormData, value: string) => {
    const finalValue = value === NONE_VALUE_SELECT ? null : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;

    setIsSubmitting(true);
    setError(null);

    // --- CORRECCIÓN CRÍTICA: Enviar el estado completo del formulario (PUT) ---
    // En lugar de calcular solo los cambios, enviamos el objeto completo.
    // El backend se encargará de actualizar todos los campos con los valores actuales del formulario.
    const payload = {
      ...formData,
      departamento: formData.departamento
        ? parseInt(formData.departamento, 10)
        : null,
      academia: formData.academia ? parseInt(formData.academia, 10) : null,
    };

    // Validación simple en frontend
    if (
      !formData.primerNombre ||
      !formData.primerApellido ||
      !formData.rfc ||
      !formData.curp
    ) {
      setError('Los campos con * son obligatorios.');
      setIsSubmitting(false);
      return;
    }

    // Comparar con los datos originales para ver si hay cambios
    const hasChanges =
      JSON.stringify({
        ...payload,
        departamento: formData.departamento,
        academia: formData.academia,
      }) !== JSON.stringify(originalData);

    if (!hasChanges) {
      setError('No se detectaron cambios para guardar.');
      setIsSubmitting(false);
      return;
    }

    try {
      await apiClient.put(
        `${API_BASE_URL}/api/empleados/${employeeId}`,
        payload
      );
      router.push('/empleados');
      router.refresh();
    } catch (err: any) {
      const backendError =
        err.response?.data?.message || err.message || 'Error desconocido';
      setError(`Error al actualizar: ${backendError}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message='Cargando datos del empleado...' />;
  }
  if (fetchError) {
    return <ErrorState message={fetchError} onRetry={fetchEmpleadoData} />;
  }

  return (
    <div className='p-6 md:p-8'>
      <BreadcrumbNav
        items={[
          { label: 'Empleados', href: '/empleados' },
          { label: 'Editar Empleado' },
        ]}
        backHref='/empleados'
      />
      <h1 className='text-2xl md:text-3xl font-bold mb-8'>Editar Empleado</h1>
      <Card className='max-w-3xl mx-auto bg-zinc-900 border-zinc-800'>
        <CardHeader>
          <CardTitle>Información del Empleado</CardTitle>
          <CardDescription>
            Modifique los datos necesarios y guarde los cambios.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            {error && (
              <div className='mb-4'>
                <ErrorState message={error} />
              </div>
            )}
            <EmployeeForm
              formData={formData}
              onChange={handleChange}
              onSelectChange={handleSelectChange}
              isSubmitting={isSubmitting}
              noneValue={NONE_VALUE_SELECT}
            />
          </CardContent>
          <CardFooter className='flex justify-between'>
            <Link href='/empleados'>
              <Button type='button' variant='outline' disabled={isSubmitting}>
                Cancelar
              </Button>
            </Link>
            <Button
              type='submit'
              className='bg-blue-600 hover:bg-blue-700'
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Actualizando...
                </>
              ) : (
                <>
                  <Save className='mr-2 h-4 w-4' />
                  Guardar Cambios
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
