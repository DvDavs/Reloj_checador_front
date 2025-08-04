'use client';

import { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, Fingerprint } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ username, password });
      // La redirección ocurre dentro de la función login en AuthContext
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        'Credenciales incorrectas o error en el servidor.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='flex items-center justify-center min-h-screen bg-zinc-950 p-4'>
      <Card className='w-full max-w-sm bg-zinc-900 border-zinc-800 text-white shadow-lg shadow-blue-500/10'>
        <CardHeader className='text-center space-y-4'>
          <Image
            src='/Logo_ITO.png'
            alt='Logo ITO'
            width={80}
            height={80}
            className='mx-auto rounded-full'
          />
          <CardTitle className='text-2xl'>Control de Asistencia</CardTitle>
          <CardDescription className='text-zinc-400'>
            Acceso al panel de administración
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='username'>Correo Institucional</Label>
              <Input
                id='username'
                type='email'
                placeholder='ejemplo@itoaxaca.edu.mx'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </div>
            {error && (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertTitle>Error de Autenticación</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              type='submit'
              className='w-full bg-blue-600 hover:bg-blue-700'
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className='flex justify-center'>
          <Link href='/lanzador'>
            <Button variant='ghost' className='text-zinc-400 hover:text-white'>
              <Fingerprint className='mr-2 h-4 w-4' />
              Lanzar Reloj Checador
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
