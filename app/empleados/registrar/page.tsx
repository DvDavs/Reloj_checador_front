'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface EmpleadoBackend {
  id: number;
  primerNombre: string | null;
  segundoNombre: string | null;
  primerApellido: string | null;
  segundoApellido: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function RegistrarEmpleadoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    primerNombre: '',
    segundoNombre: '',
    primerApellido: '',
    segundoApellido: '',
    rfc: '',
    curp: '',
    departamentoAcademicoId: null as number | null,
    departamentoAdministrativoId: null as number | null,
    tipoNombramientoPrincipal: '',
    tipoNombramientoSecundario: '',
    estatusId: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [createdEmployee, setCreatedEmployee] =
    useState<EmpleadoBackend | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const finalValue =
      name === 'rfc' || name === 'curp' ? value.toUpperCase() : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleSelectChange = (name: keyof typeof formData, value: string) => {
    const isIdField = name.includes('Id');
    setFormData((prev) => ({
      ...prev,
      [name]: isIdField ? (value ? parseInt(value, 10) : null) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

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
      router.push(`/empleados`); // TODO: Cambiar a la página de detalles cuando exista
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

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <Label htmlFor='primerNombre'>
                    Primer Nombre <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='primerNombre'
                    name='primerNombre'
                    value={formData.primerNombre}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='segundoNombre'>Segundo Nombre</Label>
                  <Input
                    id='segundoNombre'
                    name='segundoNombre'
                    value={formData.segundoNombre}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <Label htmlFor='primerApellido'>
                    Primer Apellido <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='primerApellido'
                    name='primerApellido'
                    value={formData.primerApellido}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='segundoApellido'>Segundo Apellido</Label>
                  <Input
                    id='segundoApellido'
                    name='segundoApellido'
                    value={formData.segundoApellido}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <Label htmlFor='rfc'>
                    RFC <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='rfc'
                    name='rfc'
                    placeholder='XXXX000000XXX'
                    value={formData.rfc}
                    onChange={handleChange}
                    maxLength={13}
                    className='uppercase'
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='curp'>
                    CURP <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='curp'
                    name='curp'
                    placeholder='XXXX000000XXXXXX00'
                    value={formData.curp}
                    onChange={handleChange}
                    maxLength={18}
                    className='uppercase'
                    required
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='tipoNombramientoPrincipal'>
                  Nombramiento Principal
                </Label>
                <Select
                  value={formData.tipoNombramientoPrincipal}
                  onValueChange={(value) =>
                    handleSelectChange('tipoNombramientoPrincipal', value)
                  }
                >
                  <SelectTrigger id='tipoNombramientoPrincipal'>
                    <SelectValue placeholder='Seleccionar...' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='DOCENTE'>Docente</SelectItem>
                    <SelectItem value='ADMINISTRATIVO'>
                      Administrativo
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
