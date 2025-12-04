'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Save,
  Loader2,
  UserPlus,
  ArrowLeft,
  User,
  Building,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { BreadcrumbNav } from '@/app/components/shared/breadcrumb-nav';
import { ErrorState } from '@/app/components/shared/error-state';
import { PostRegistrationDialog } from '../components/post-registration-dialog';
import { EmployeeForm } from '@/app/components/shared/employee-form';
import PhotoUpload from '@/app/components/shared/PhotoUpload';
import { uploadEmpleadoFoto } from '@/lib/api/empleados-foto.api';

// Componentes mejorados
import { FormLayout } from '@/app/components/shared/form-layout';

interface EmpleadoBackend {
  id: number;
  primerNombre: string | null;
  segundoNombre: string | null;
  primerApellido: string | null;
  segundoApellido: string | null;
}

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
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);

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
        `/api/empleados`,
        payload
      );
      setCreatedEmployee(response.data);
      // Intentar subir foto si fue seleccionada
      if (selectedPhoto) {
        try {
          await uploadEmpleadoFoto(response.data.id, selectedPhoto);
        } catch (err) {
          console.warn('No se pudo subir la foto en el registro:', err);
        }
      }
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
      <FormLayout
        title='Registrar Nuevo Empleado'
        description='Complete la información básica del empleado. La asignación de huella se realizará después.'
        breadcrumbs={[
          { label: 'Empleados', href: '/empleados' },
          { label: 'Registrar Nuevo Empleado' },
        ]}
        backHref='/empleados'
        formIcon={<UserPlus className='h-5 w-5 text-primary' />}
        formTitle='Información del Empleado'
        formDescription='Complete todos los campos requeridos para registrar el nuevo empleado.'
        error={error}
        isSubmitting={isSubmitting}
        footerNote='Los campos marcados con * son obligatorios'
        actions={
          <>
            <Link href='/empleados'>
              <Button
                type='button'
                variant='outline'
                disabled={isSubmitting}
                className='border-2 border-border hover:border-primary hover:bg-primary/5'
              >
                Cancelar
              </Button>
            </Link>
            <Button
              type='submit'
              form='employee-form'
              className='bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200'
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className='mr-2 h-4 w-4' />
                  Guardar Empleado
                </>
              )}
            </Button>
          </>
        }
      >
        <form id='employee-form' onSubmit={handleSubmit}>
          <EmployeeForm
            formData={formData}
            onChange={handleChange}
            onSelectChange={handleSelectChange}
            onSwitchChange={handleSwitchChange}
            isSubmitting={isSubmitting}
            noneValue={NONE_VALUE_SELECT}
          />
          <div className='mt-6'>
            <PhotoUpload
              onFileSelected={setSelectedPhoto}
              disabled={isSubmitting}
            />
          </div>
        </form>
      </FormLayout>

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
