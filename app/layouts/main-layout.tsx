// app/layouts/main-layout.tsx
'use client';

import type React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import Sidebar from '../components/sidebar';
import { useMemo } from 'react';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isLoading } = useAuth();

  // Memoizar las rutas para evitar re-cálculos
  const noLayoutRoutes = useMemo(() => ['/login', '/reloj-checador'], []);

  const shouldShowLayout = useMemo(() => {
    return !noLayoutRoutes.includes(pathname);
  }, [pathname, noLayoutRoutes]);

  // Si la autenticación todavía está cargando, muestra un spinner global
  if (isLoading) {
    return (
      <div className='flex h-screen w-full items-center justify-center bg-background'>
        <div className='flex flex-col items-center space-y-4'>
          <Loader2 className='h-8 w-8 animate-spin text-[hsl(var(--accent))]' />
          <p className='text-sm text-muted-foreground'>Cargando...</p>
        </div>
      </div>
    );
  }

  // Páginas sin layout (login, reloj-checador)
  if (!shouldShowLayout) {
    return <>{children}</>;
  }

  // El layout normal para el resto de las páginas
  return (
    <div className='flex h-screen bg-background overflow-hidden'>
      <Sidebar />
      <main className='flex-1 main-content overflow-x-hidden'>
        <div className='min-h-full'>{children}</div>
      </main>
    </div>
  );
}
