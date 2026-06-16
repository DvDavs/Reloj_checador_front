'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { EnhancedCard } from '@/app/components/shared/enhanced-card';
import { RequirePermission } from '@/app/components/auth/require-permission';
import { createUser } from '@/lib/api/users.api';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RegistrarUsuarioPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (username.trim().length < 3) e.username = 'Mínimo 3 caracteres';
    if (password.length < 6) e.password = 'Mínimo 6 caracteres';
    if (password !== confirmPassword)
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
    setIsLoading(true);
    try {
      await createUser({ username: username.trim(), password });
      toast({
        title: 'Usuario creado',
        description: `${username} fue creado exitosamente.`,
      });
      router.push('/configuracion/usuarios');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'No se pudo crear el usuario.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RequirePermission permission='usuario:write'>
      <div className='p-6 md:p-8 max-w-lg mx-auto space-y-6'>
        <div className='flex items-center gap-3'>
          <Link href='/configuracion/usuarios'>
            <Button variant='ghost' size='icon'>
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <h1 className='text-2xl font-bold'>Nuevo usuario</h1>
        </div>

        <EnhancedCard variant='bordered' padding='lg'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-1'>
              <Label htmlFor='username'>Usuario</Label>
              <Input
                id='username'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder='ej. jsmith'
                autoComplete='off'
              />
              {errors.username && (
                <p className='text-sm text-destructive'>{errors.username}</p>
              )}
            </div>

            <div className='space-y-1'>
              <Label htmlFor='password'>Contraseña</Label>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='Mínimo 6 caracteres'
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
              <Button type='submit' disabled={isLoading} className='flex-1'>
                {isLoading ? 'Creando...' : 'Crear usuario'}
              </Button>
            </div>
          </form>
        </EnhancedCard>
      </div>
    </RequirePermission>
  );
}
