import type React from 'react';
import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeNavigationBlocker } from '@/components/theme-navigation-blocker';
import { NavigationGuard } from '@/components/navigation-guard';
import { NavigationTracker } from '@/components/navigation-tracker';
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
        <ThemeProvider
          attribute='class'
          defaultTheme='light'
          enableSystem
          disableTransitionOnChange={false}
          storageKey='theme-preference'
        >
          <ThemeNavigationBlocker>
            <NavigationTracker>
              <NavigationGuard>
                <AuthProvider>
                  <MainLayout>{children}</MainLayout>
                  <Toaster />
                </AuthProvider>
              </NavigationGuard>
            </NavigationTracker>
          </ThemeNavigationBlocker>
        </ThemeProvider>
      </body>
    </html>
  );
}
