'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { EnhancedCard } from '@/app/components/shared/enhanced-card';
import { RequirePermission } from '@/app/components/auth/require-permission';
import { getUserById, updateUser } from '@/lib/api/users.api';
import { UserDto } from '@/lib/types/userTypes';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditarUsuarioPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<UserDto | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getUserById(Number(id))
      .then(setUser)
      .catch(() =>
        toast({
          title: 'Error',
          description: 'Usuario no encontrado.',
          variant: 'destructive',
        })
      )
      .finally(() => setIsLoading(false));
  }, [id]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (password && password.length < 6) e.password = 'Mínimo 6 caracteres';
    if (password && password !== confirmPassword)
      e.confirmPassword = 'Las contraseñas no coinciden';
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
    setIsSaving(true);
    try {
      await updateUser(Number(id), { password: password || undefined });
      toast({
        title: 'Usuario actualizado',
        description: 'La contraseña fue actualizada.',
      });
      router.push('/configuracion/usuarios');
    } catch (err: any) {
      const msg =
        err.response?.data?.message || 'No se pudo actualizar el usuario.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading)
    return <div className='p-8 text-muted-foreground'>Cargando...</div>;
  if (!user) return null;

  return (
    <RequirePermission permission='usuario:write'>
      <div className='p-6 md:p-8 max-w-lg mx-auto space-y-6'>
        <div className='flex items-center gap-3'>
          <Link href='/configuracion/usuarios'>
            <Button variant='ghost' size='icon'>
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <h1 className='text-2xl font-bold'>Editar usuario</h1>
        </div>

        <EnhancedCard variant='bordered' padding='lg'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-1'>
              <Label>Usuario</Label>
              <Input value={user.username} disabled className='bg-muted' />
              <p className='text-xs text-muted-foreground'>
                El nombre de usuario no puede cambiarse.
              </p>
            </div>

            <div className='space-y-1'>
              <Label htmlFor='password'>
                Nueva contraseña{' '}
                <span className='text-muted-foreground'>
                  (dejar vacío para no cambiar)
                </span>
              </Label>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='Nueva contraseña'
              />
              {errors.password && (
                <p className='text-sm text-destructive'>{errors.password}</p>
              )}
            </div>

            <div className='space-y-1'>
              <Label htmlFor='confirm'>Confirmar contraseña</Label>
              <Input
                id='confirm'
                type='password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder='Repetir contraseña'
              />
              {errors.confirmPassword && (
                <p className='text-sm text-destructive'>
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className='flex gap-3 pt-2'>
              <Link href='/configuracion/usuarios' className='flex-1'>
                <Button variant='outline' className='w-full'>
                  Cancelar
                </Button>
              </Link>
              <Button type='submit' disabled={isSaving} className='flex-1'>
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </EnhancedCard>
      </div>
    </RequirePermission>
  );
}
