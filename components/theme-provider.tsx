'use client';

import * as React from 'react';
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      {...props}
      // Configuraciones adicionales para estabilidad
      enableColorScheme={false} // Evitar cambios automáticos del navegador
      forcedTheme={undefined} // No forzar tema específico
    >
      {children}
    </NextThemesProvider>
  );
}
