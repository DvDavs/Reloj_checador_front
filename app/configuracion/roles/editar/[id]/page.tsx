'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { EnhancedCard } from '@/app/components/shared/enhanced-card';
import { RequirePermission } from '@/app/components/auth/require-permission';
import { PermissionsSelector } from '../../components/permissions-selector';
import { getRoleById, updateRole } from '@/lib/api/roles.api';
import { RoleDto } from '@/lib/types/roleTypes';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditarRolPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [role, setRole] = useState<RoleDto | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [selectedPermisos, setSelectedPermisos] = useState<Set<number>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getRoleById(Number(id))
      .then((r) => {
        setRole(r);
        setDescripcion(r.descripcion || '');
        setSelectedPermisos(new Set(r.permisos.map((p) => p.id)));
      })
      .catch(() =>
        toast({
          title: 'Error',
          description: 'Rol no encontrado.',
          variant: 'destructive',
        })
      )
      .finally(() => setIsLoading(false));
  }, [id, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPermisos.size === 0) {
      toast({
        title: 'Error',
        description: 'Seleccioná al menos un permiso.',
        variant: 'destructive',
      });
      return;
    }
    setIsSaving(true);
    try {
      await updateRole(Number(id), {
        descripcion: descripcion.trim() || undefined,
        permisoIds: [...selectedPermisos],
        activo: role?.activo,
      });
      toast({
        title: 'Rol actualizado',
        description: `${role?.nombre} fue actualizado.`,
      });
      router.push('/configuracion/roles');
    } catch (err: any) {
      const msg =
        err.response?.data?.message || 'No se pudo actualizar el rol.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading)
    return <div className='p-8 text-muted-foreground'>Cargando...</div>;
  if (!role) return null;

  return (
    <RequirePermission permission='rol:write'>
      <div className='p-6 md:p-8 max-w-2xl mx-auto space-y-6'>
        <div className='flex items-center gap-3'>
          <Link href='/configuracion/roles'>
            <Button variant='ghost' size='icon'>
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <h1 className='text-2xl font-bold'>Editar rol</h1>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <EnhancedCard variant='bordered' padding='lg'>
            <div className='space-y-4'>
              <div className='space-y-1'>
                <Label>Nombre del rol</Label>
                <Input value={role.nombre} disabled className='bg-muted' />
                <p className='text-xs text-muted-foreground'>
                  El nombre del rol no puede cambiarse.
                </p>
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
            <Button type='submit' disabled={isSaving} className='flex-1'>
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </div>
    </RequirePermission>
  );
}
