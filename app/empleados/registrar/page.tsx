'use client';

import React, { useState } from 'react';
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
    departamento: null as number | null,
    academia: null as number | null,
    tipoNombramientoSecundario: '',
    estatusId: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [createdEmployee, setCreatedEmployee] =
    useState<EmpleadoBackend | null>(null);

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

  const handleSelectChange = (name: keyof typeof formData, value: string) => {
    const isIdField = name === 'departamento' || name === 'academia';
    let finalValue: string | number | null;

    if (value === NONE_VALUE_SELECT) {
      finalValue = null;
    } else if (isIdField) {
      finalValue = value ? parseInt(value, 10) : null;
    } else {
      finalValue = value;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload = {
      rfc: formData.rfc || null,
      curp: formData.curp || null,
      tarjeta: formData.tarjeta,
      primerNombre: formData.primerNombre || null,
      segundoNombre: formData.segundoNombre || null,
      primerApellido: formData.primerApellido || null,
      segundoApellido: formData.segundoApellido || null,
      nombramiento: formData.nombramiento || null,
      departamento: formData.departamento,
      academia: formData.academia,
      tipoNombramientoSecundario: formData.tipoNombramientoSecundario || null,
      estatusId: formData.estatusId,
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
    if (payload.rfc && payload.rfc.length < 10) {
      setError('RFC inválido.');
      setIsSubmitting(false);
      return;
    }
    if (payload.curp && payload.curp.length !== 18) {
      setError('CURP inválido.');
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
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data ||
        err.message ||
        'Error desconocido';
      let displayError =
        typeof backendError === 'string'
          ? backendError
          : JSON.stringify(backendError);
      setError(`Error al crear el empleado: ${displayError}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignFingerprint = () => {
    if (createdEmployee) {
      const fullName = [
        createdEmployee.primerNombre,
        createdEmployee.segundoNombre,
        createdEmployee.primerApellido,
        createdEmployee.segundoApellido,
      ]
        .filter(Boolean)
        .join(' ');
      router.push(
        `/empleados/asignar-huella?id=${
          createdEmployee.id
        }&nombre=${encodeURIComponent(fullName)}`
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
      <div className='p-6 md:p-8'>
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
            <CardContent className='space-y-6'>
              {error && (
                <ErrorState
                  message={error}
                  className='p-3 bg-red-900/30 border border-red-500/50 text-red-400 rounded-lg flex items-center gap-2 text-sm'
                />
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
          employeeName={[
            createdEmployee.primerNombre,
            createdEmployee.segundoNombre,
            createdEmployee.primerApellido,
            createdEmployee.segundoApellido,
          ]
            .filter(Boolean)
            .join(' ')}
        />
      )}
    </>
  );
}
