'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState, useCallback } from 'react';
import { markThemeChangeStart } from '@/lib/apiClient';

export function useStableTheme() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    if (isChanging) return; // Prevenir múltiples cambios rápidos

    // MARCAR INMEDIATAMENTE el inicio del cambio de tema ANTES de hacer cualquier cosa
    markThemeChangeStart();
    setIsChanging(true);

    const current = theme === 'system' ? systemTheme : theme;
    const newTheme = current === 'dark' ? 'light' : 'dark';

    // Agregar clase temporal al documento para transiciones suaves
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme-changing', 'true');
    }

    // Usar requestAnimationFrame para suavizar el cambio
    requestAnimationFrame(() => {
      setTheme(newTheme);

      // Resetear el flag y remover la clase después de la transición
      setTimeout(() => {
        setIsChanging(false);
        if (typeof document !== 'undefined') {
          document.documentElement.removeAttribute('data-theme-changing');
        }
      }, 200);
    });
  }, [theme, systemTheme, setTheme, isChanging]);

  const currentTheme = mounted
    ? theme === 'system'
      ? systemTheme
      : theme
    : 'light';

  return {
    theme: currentTheme,
    toggleTheme,
    mounted,
    isChanging,
  };
}
