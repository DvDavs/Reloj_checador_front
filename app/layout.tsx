import type React from 'react';
import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import MainLayout from './layouts/main-layout';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/app/context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='es' suppressHydrationWarning>
      <head>
        <title>
          Sistema de Control de Asistencia - Instituto Tecnológico de Oaxaca
        </title>
        <meta
          name='description'
          content='Sistema de control de asistencia con escáner de huellas dactilares'
        />
      </head>
      <body className={`${inter.className}`}>
        <ThemeProvider attribute='class' defaultTheme='light' enableSystem>
          <AuthProvider>
            <MainLayout>{children}</MainLayout>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
