'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Save, Loader2, Edit, User, Building, FileText } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { LoadingState } from '@/app/components/shared/loading-state';
import { ErrorState } from '@/app/components/shared/error-state';
import { EmployeeForm } from '@/app/components/shared/employee-form';
import { FormLayout } from '@/app/components/shared/form-layout';
import PhotoUpload from '@/app/components/shared/PhotoUpload';
import {
  uploadEmpleadoFoto,
  deleteEmpleadoFoto,
} from '@/lib/api/empleados-foto.api';

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
type FotoState = {
  pendingFile: File | null;
  hasPhoto: boolean;
  initialHasPhoto: boolean;
  fotoUrl?: string | null;
};

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
  const [fotoState, setFotoState] = useState<FotoState>({
    pendingFile: null,
    hasPhoto: false,
    initialHasPhoto: false,
    fotoUrl: null,
  });

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
      // Foto
      const anyData: any = response.data as any;
      const hasPhoto = !!anyData.tieneFoto;
      const fotoUrl = anyData.fotoUrl
        ? `${API_BASE_URL}${anyData.fotoUrl}`
        : null;
      console.log(
        'Foto URL construida:',
        fotoUrl,
        'API_BASE_URL:',
        API_BASE_URL,
        'fotoUrl original:',
        anyData.fotoUrl
      );
      setFotoState({
        pendingFile: null,
        hasPhoto,
        initialHasPhoto: hasPhoto,
        fotoUrl,
      });
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

    // Verificar cambios en datos del formulario
    const hasFormChanges =
      JSON.stringify(payload) !== JSON.stringify(originalPayloadComparable);

    // Verificar cambios en la foto
    const hasPhotoChanges =
      fotoState.pendingFile !== null || // Nueva foto seleccionada
      (!fotoState.hasPhoto && fotoState.initialHasPhoto); // Foto eliminada

    const hasChanges = hasFormChanges || hasPhotoChanges;

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
      // Subir o eliminar foto según corresponda
      try {
        if (fotoState.pendingFile) {
          await uploadEmpleadoFoto(
            parseInt(employeeId, 10),
            fotoState.pendingFile
          );
        } else if (!fotoState.hasPhoto && fotoState.initialHasPhoto) {
          await deleteEmpleadoFoto(parseInt(employeeId, 10));
        }
      } catch (err: any) {
        console.error('Error subiendo foto:', err);
      }
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
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <LoadingState message='Cargando datos del empleado...' />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <ErrorState message={fetchError} onRetry={fetchEmpleadoData} />
      </div>
    );
  }

  return (
    <FormLayout
      title='Editar Empleado'
      description='Modifique los datos necesarios y guarde los cambios.'
      breadcrumbs={[
        { label: 'Empleados', href: '/empleados' },
        { label: 'Editar Empleado' },
      ]}
      backHref='/empleados'
      formIcon={<Edit className='h-5 w-5 text-primary' />}
      formTitle='Información del Empleado'
      formDescription='Actualice los campos que necesite modificar.'
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
            form='employee-edit-form'
            className='bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200'
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
        </>
      }
    >
      <form id='employee-edit-form' onSubmit={handleSubmit}>
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
            onFileSelected={(f) => {
              if (f) {
                // Nueva foto seleccionada
                setFotoState((s) => ({ ...s, pendingFile: f, hasPhoto: true }));
              } else {
                // Foto eliminada
                setFotoState((s) => ({
                  ...s,
                  pendingFile: null,
                  hasPhoto: false,
                }));
              }
            }}
            initialPreviewUrl={fotoState.fotoUrl || null}
            disabled={isSubmitting}
          />
        </div>
      </form>
    </FormLayout>
  );
}
