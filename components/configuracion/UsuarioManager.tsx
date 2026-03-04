'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';

export default function UsuarioManager() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Frontend validation
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/;
    if (!emailRegex.test(username)) {
      setError('El nombre de usuario debe ser un correo electrónico válido.');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/api/usuarios', {
        username,
        password,
      });

      setSuccess(true);
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      toast({
        title: 'Usuario creado',
        description: 'El nuevo usuario ha sido registrado exitosamente.',
      });
    } catch (err: any) {
      console.error('Error creating user:', err);
      const msg =
        err.response?.data?.error ||
        'Error al crear el usuario. Inténtalo de nuevo.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='max-w-md mx-auto'>
      <Card>
        <CardHeader>
          <CardTitle>Crear Nuevo Usuario</CardTitle>
          <CardDescription>
            Agrega un nuevo administrador o usuario al sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className='space-y-4'
            autoComplete='off'
          >
            <div className='space-y-2'>
              <Label htmlFor='username'>Correo Electrónico (Usuario)</Label>
              <Input
                id='username'
                type='email'
                placeholder='usuario@ejemplo.com'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                autoComplete='off'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password'>Contraseña</Label>
              <Input
                id='password'
                type='password'
                placeholder='••••••••'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete='new-password'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Confirmar Contraseña</Label>
              <Input
                id='confirmPassword'
                type='password'
                placeholder='••••••••'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete='new-password'
              />
            </div>

            {error && (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className='bg-green-50 text-green-700 border-green-200'>
                <CheckCircle className='h-4 w-4 text-green-600' />
                <AlertTitle>Éxito</AlertTitle>
                <AlertDescription>
                  Usuario creado correctamente.
                </AlertDescription>
              </Alert>
            )}

            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creando...
                </>
              ) : (
                <>
                  <UserPlus className='mr-2 h-4 w-4' />
                  Crear Usuario
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
