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

interface EmpleadoApiData {
  rfc?: string | null;
  curp?: string | null;
  tarjeta?: number | null;
  primerNombre?: string | null;
  segundoNombre?: string | null;
  primerApellido?: string | null;
  segundoApellido?: string | null;
  nombramiento?: string | null;
  departamento?: number | null;
  academia?: number | null;
  tipoNombramientoSecundario?: string | null;
  permiteChecarConPin?: boolean;
}

interface EmpleadoFormData {
  rfc?: string | null;
  curp?: string | null;
  tarjeta?: number | null;
  primerNombre?: string | null;
  segundoNombre?: string | null;
  primerApellido?: string | null;
  segundoApellido?: string | null;
  nombramiento?: string | null;
  departamento?: string | null;
  academia?: string | null;
  tipoNombramientoSecundario?: string | null;
  permiteChecarConPin?: boolean;
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
    const isNombramientoField =
      name === 'nombramiento' || name === 'tipoNombramientoSecundario';
    let finalValue: string | null = value;

    if (value === NONE_VALUE_SELECT) {
      finalValue = isNombramientoField ? '' : null;
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    setError(null);
  };

  const handleSwitchChange = (name: keyof EmpleadoFormData, value: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;

    setIsSubmitting(true);
    setError(null);

    const payload = {
      ...formData,
      departamento: formData.departamento
        ? parseInt(formData.departamento, 10)
        : null,
      academia: formData.academia ? parseInt(formData.academia, 10) : null,
      permiteChecarConPin: formData.permiteChecarConPin || false,
    };

    const originalPayloadComparable = {
      ...originalData,
      departamento: originalData.departamento
        ? parseInt(originalData.departamento, 10)
        : null,
      academia: originalData.academia
        ? parseInt(originalData.academia, 10)
        : null,
      permiteChecarConPin: originalData.permiteChecarConPin || false,
    };

    const hasChanges =
      JSON.stringify(payload) !== JSON.stringify(originalPayloadComparable);

    if (!hasChanges) {
      setError('No se detectaron cambios para guardar.');
      setIsSubmitting(false);
      return;
    }

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
    <div className='p-6 md:p-8 pb-12'>
      <BreadcrumbNav
        items={[
          { label: 'Empleados', href: '/empleados' },
          { label: 'Editar Empleado' },
        ]}
        backHref='/empleados'
      />
      <h1 className='text-2xl md:text-3xl font-bold mb-8'>Editar Empleado</h1>
      <Card className='max-w-3xl mx-auto bg-card border-border shadow-sm'>
        <CardHeader>
          <CardTitle className='text-foreground'>
            Información del Empleado
          </CardTitle>
          <CardDescription className='text-muted-foreground'>
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
              onSwitchChange={handleSwitchChange}
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
              className='bg-primary hover:bg-primary/90 text-primary-foreground'
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
