'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { EnhancedCard } from '@/app/components/shared/enhanced-card';
import { RequirePermission } from '@/app/components/auth/require-permission';
import { PermissionsSelector } from '../components/permissions-selector';
import { createRole } from '@/lib/api/roles.api';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RegistrarRolPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [selectedPermisos, setSelectedPermisos] = useState<Set<number>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (nombre.trim().length < 2) e.nombre = 'Mínimo 2 caracteres';
    if (selectedPermisos.size === 0)
      e.permisos = 'Seleccioná al menos un permiso';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      await createRole({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        permisoIds: [...selectedPermisos],
      });
      toast({
        title: 'Rol creado',
        description: `${nombre} fue creado exitosamente.`,
      });
      router.push('/configuracion/roles');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'No se pudo crear el rol.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RequirePermission permission='rol:write'>
      <div className='p-6 md:p-8 max-w-2xl mx-auto space-y-6'>
        <div className='flex items-center gap-3'>
          <Link href='/configuracion/roles'>
            <Button variant='ghost' size='icon'>
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <h1 className='text-2xl font-bold'>Nuevo rol</h1>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <EnhancedCard variant='bordered' padding='lg'>
            <div className='space-y-4'>
              <div className='space-y-1'>
                <Label htmlFor='nombre'>Nombre del rol</Label>
                <Input
                  id='nombre'
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder='ej. Supervisor RH'
                  maxLength={100}
                />
                {errors.nombre && (
                  <p className='text-sm text-destructive'>{errors.nombre}</p>
                )}
              </div>

              <div className='space-y-1'>
                <Label htmlFor='descripcion'>
                  Descripción{' '}
                  <span className='text-muted-foreground'>(opcional)</span>
                </Label>
                <Textarea
                  id='descripcion'
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder='Describe el propósito del rol...'
                  maxLength={500}
                  rows={2}
                />
              </div>
            </div>
          </EnhancedCard>

          <EnhancedCard variant='bordered' padding='lg'>
            <h2 className='text-base font-semibold mb-4'>Permisos</h2>
            {errors.permisos && (
              <p className='text-sm text-destructive mb-3'>{errors.permisos}</p>
            )}
            <PermissionsSelector
              selected={selectedPermisos}
              onChange={setSelectedPermisos}
            />
          </EnhancedCard>

          <div className='flex gap-3'>
            <Link href='/configuracion/roles' className='flex-1'>
              <Button variant='outline' className='w-full'>
                Cancelar
              </Button>
            </Link>
            <Button type='submit' disabled={isLoading} className='flex-1'>
              {isLoading ? 'Creando...' : 'Crear rol'}
            </Button>
          </div>
        </form>
      </div>
    </RequirePermission>
  );
}
