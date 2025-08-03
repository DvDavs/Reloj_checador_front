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

interface EmpleadoEditData {
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
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const NONE_VALUE_SELECT = '__NONE__';

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

  const fetchEmpleadoData = useCallback(async () => {
    if (!employeeId) {
      setFetchError('No se proporcionó ID de empleado.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setFetchError(null);
    setError(null);
    try {
      const response = await apiClient.get<EmpleadoEditData>(
        `${API_BASE_URL}/api/empleados/${employeeId}`
      );
      const initialData: EmpleadoEditData = {
        rfc: response.data.rfc,
        curp: response.data.curp,
        tarjeta: response.data.tarjeta,
        primerNombre: response.data.primerNombre,
        segundoNombre: response.data.segundoNombre,
        primerApellido: response.data.primerApellido,
        segundoApellido: response.data.segundoApellido,
        nombramiento: response.data.nombramiento,
        departamento: response.data.departamento,
        academia: response.data.academia,
        tipoNombramientoSecundario: response.data.tipoNombramientoSecundario,
      };
      setFormData(initialData);
      setOriginalData(initialData);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || err.message || 'Error desconocido';
      setFetchError(
        `No se pudo cargar la información del empleado (ID: ${employeeId}). ${errorMsg}`
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
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    setError(null);
  };

  const handleSelectChange = (name: keyof EmpleadoEditData, value: string) => {
    const isIdField = name === 'departamento' || name === 'academia';
    let finalValue: string | number | null;

    if (value === NONE_VALUE_SELECT) {
      finalValue = null;
    } else if (isIdField) {
      finalValue = value ? parseInt(value, 10) : null;
    } else {
      finalValue = value;
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;

    setIsSubmitting(true);
    setError(null);

    const payload: Partial<EmpleadoEditData> = {};
    let hasChanges = false;

    const keysToCompare: (keyof EmpleadoEditData)[] = [
      'rfc',
      'curp',
      'tarjeta',
      'primerNombre',
      'segundoNombre',
      'primerApellido',
      'segundoApellido',
      'nombramiento',
      'departamento',
      'academia',
      'tipoNombramientoSecundario',
    ];

    keysToCompare.forEach((key) => {
      const currentValue = formData[key] ?? null;
      const originalValue = originalData[key] ?? null;

      if (currentValue !== originalValue) {
        (payload as any)[key] = formData[key as keyof EmpleadoEditData];
        hasChanges = true;
      }
    });

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
      setError('Primer Nombre, Primer Apellido, RFC y CURP son obligatorios.');
      setIsSubmitting(false);
      return;
    }

    try {
      await apiClient.put(
        `${API_BASE_URL}/api/empleados/${employeeId}`,
        payload
      );
      router.push('/empleados');
    } catch (err: any) {
      const backendError =
        err.response?.data?.message || err.message || 'Error desconocido';
      setError(`Error al actualizar: ${backendError}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className='p-6 md:p-8'>
        <BreadcrumbNav
          items={[
            { label: 'Empleados', href: '/empleados' },
            { label: 'Editar Empleado' },
          ]}
          backHref='/empleados'
        />
        <LoadingState message='Cargando datos del empleado...' />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className='p-6 md:p-8'>
        <BreadcrumbNav
          items={[
            { label: 'Empleados', href: '/empleados' },
            { label: 'Error al Cargar' },
          ]}
          backHref='/empleados'
        />
        <ErrorState message={fetchError} />
      </div>
    );
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
          <CardContent className='space-y-6'>
            {error && <ErrorState message={error} />}
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
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />{' '}
                  Actualizando...
                </>
              ) : (
                <>
                  <Save className='mr-2 h-4 w-4' /> Guardar Cambios
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
