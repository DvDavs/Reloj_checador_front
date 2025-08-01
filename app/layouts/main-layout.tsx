// app/layouts/main-layout.tsx
'use client';

import type React from 'react';
import { usePathname } from 'next/navigation'; // Importa el hook
import Sidebar from '../components/sidebar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
