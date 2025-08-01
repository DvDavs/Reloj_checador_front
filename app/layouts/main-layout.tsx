// app/layouts/main-layout.tsx
'use client';

import type React from 'react';
import { usePathname } from 'next/navigation'; // Importa el hook
import { useAuth } from '../context/AuthContext'; // Importa useAuth
import { Loader2 } from 'lucide-react'; // Importa el ícono de carga
import Sidebar from '../components/sidebar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isLoading } = useAuth(); // Usa el hook para obtener el estado de carga

  // Si la autenticación todavía está cargando, muestra un spinner global
  if (isLoading) {
    return (
      <div className='flex h-screen w-full items-center justify-center bg-black'>
        <Loader2 className='h-8 w-8 animate-spin text-blue-500' />
      </div>
    );
  }

  // Define las rutas que NO deben tener el layout principal (sidebar, etc.)
  const noLayoutRoutes = ['/login', '/reloj-checador'];

  if (noLayoutRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  // El layout normal para el resto de las páginas
  return (
    <div className='flex h-screen bg-black'>
      <Sidebar />
      <main className='flex-1 overflow-auto'>{children}</main>
    </div>
  );
}
