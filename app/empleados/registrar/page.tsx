'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { BreadcrumbNav } from '@/app/components/shared/breadcrumb-nav';
import { ErrorState } from '@/app/components/shared/error-state';
import { PostRegistrationDialog } from '../components/post-registration-dialog';
import { EmployeeForm } from '@/app/components/shared/employee-form';

interface EmpleadoBackend {
  id: number;
  primerNombre: string | null;
  segundoNombre: string | null;
  primerApellido: string | null;
  segundoApellido: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const NONE_VALUE_SELECT = '__NONE__';

export default function RegistrarEmpleadoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    primerNombre: '',
    segundoNombre: '',
    primerApellido: '',
    segundoApellido: '',
    rfc: '',
    curp: '',
    tarjeta: null as number | null,
    nombramiento: '',
    departamento: null as string | null,
    academia: null as string | null,
    tipoNombramientoSecundario: '',
    estatusId: 1,
    permiteChecarConPin: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [createdEmployee, setCreatedEmployee] =
    useState<EmpleadoBackend | null>(null);

  const getFullName = useCallback((emp: EmpleadoBackend | null): string => {
    if (!emp) return '';
    return [
      emp.primerNombre,
      emp.segundoNombre,
      emp.primerApellido,
      emp.segundoApellido,
    ]
      .filter(Boolean)
      .join(' ');
  }, []);

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

  const handleSelectChange = (name: keyof typeof formData, value: string) => {
    const finalValue = value === NONE_VALUE_SELECT ? '' : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    setError(null);
  };

  const handleSwitchChange = (name: keyof typeof formData, value: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const payload = {
      ...formData,
      departamento: formData.departamento
        ? parseInt(formData.departamento, 10)
        : null,
      academia: formData.academia ? parseInt(formData.academia, 10) : null,
      nombramiento: formData.nombramiento || null,
      tipoNombramientoSecundario: formData.tipoNombramientoSecundario || null,
      permiteChecarConPin: formData.permiteChecarConPin || false,
    };
    if (
      !payload.primerNombre ||
      !payload.primerApellido ||
      !payload.rfc ||
      !payload.curp
    ) {
      setError('Primer Nombre, Primer Apellido, RFC y CURP son obligatorios.');
      setIsSubmitting(false);
      return;
    }
    try {
      const response = await apiClient.post<EmpleadoBackend>(
        `${API_BASE_URL}/api/empleados`,
        payload
      );
      setCreatedEmployee(response.data);
      setIsDialogOpen(true);
    } catch (err: any) {
      const backendError =
        err.response?.data?.message || err.message || 'Error desconocido';
      setError(`Error al crear el empleado: ${backendError}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignFingerprint = () => {
    if (createdEmployee) {
      router.push(
        `/empleados/asignar-huella?id=${createdEmployee.id}&nombre=${encodeURIComponent(getFullName(createdEmployee))}`
      );
    }
  };

  const handleContinueToDetails = () => {
    if (createdEmployee) {
      router.push(`/empleados`);
    }
  };

  return (
    <>
      <div className='p-6 md:p-8 pb-12'>
        <BreadcrumbNav
          items={[
            { label: 'Empleados', href: '/empleados' },
            { label: 'Registrar Nuevo Empleado' },
          ]}
          backHref='/empleados'
        />
        <h1 className='text-2xl md:text-3xl font-bold mb-8'>
          Registrar Nuevo Empleado
        </h1>
        <Card className='max-w-3xl mx-auto bg-zinc-900 border-zinc-800'>
          <CardHeader>
            <CardTitle>Información del Empleado</CardTitle>
            <CardDescription>
              Ingrese los datos básicos. La asignación de huella se realizará en
              el siguiente paso.
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
                className='bg-green-600 hover:bg-green-700'
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />{' '}
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className='mr-2 h-4 w-4' />
                    Guardar Empleado
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
      {createdEmployee && (
        <PostRegistrationDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onAssignFingerprint={handleAssignFingerprint}
          onContinueToDetails={handleContinueToDetails}
          employeeName={getFullName(createdEmployee)}
        />
      )}
    </>
  );
}
