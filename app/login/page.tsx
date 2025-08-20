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
import { Loader2, AlertCircle, Fingerprint, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className='flex items-center justify-center min-h-screen bg-gray-50 p-4'>
      <Card className='w-full max-w-sm bg-white border-gray-200 text-gray-900 shadow-lg'>
        <CardHeader className='text-center space-y-4'>
          <Image
            src='/Logo_ITO.png'
            alt='Logo ITO'
            width={80}
            height={80}
            className='mx-auto rounded-full'
          />
          <CardTitle className='text-2xl'>Control de Asistencia</CardTitle>
          <CardDescription className='text-gray-500'>
            Acceso al panel de administración
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='username' className='text-gray-700'>
                Nombre de usuario
              </Label>
              <Input
                id='username'
                type='text'
                placeholder='Administrador'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isSubmitting}
                className='bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password' className='text-gray-700'>
                Contraseña
              </Label>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='••••••••'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className='bg-white border-gray-300 text-gray-900 placeholder-gray-500 pr-10'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword((v) => !v)}
                  className='absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700'
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                  title={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>
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
            <Button
              variant='ghost'
              className='text-gray-600 hover:text-gray-900'
            >
              <Fingerprint className='mr-2 h-4 w-4' />
              Lanzar Reloj Checador
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
