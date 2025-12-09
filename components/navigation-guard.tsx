'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';

export function NavigationGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const isThemeChanging = useRef(false);
  const currentPath = useRef(pathname);
  const originalPush = useRef(router.push);
  const themeChangeTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    currentPath.current = pathname;
  }, [pathname]);

  useEffect(() => {
    // Interceptar clicks en botones de tema
    const handleThemeButtonClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const button = target.closest('button[aria-label="Toggle theme"]');

      if (button) {
        isThemeChanging.current = true;

        // Limpiar timer anterior si existe
        if (themeChangeTimer.current) {
          clearTimeout(themeChangeTimer.current);
        }

        themeChangeTimer.current = setTimeout(() => {
          isThemeChanging.current = false;
        }, 2000); // 2 segundos de bloqueo
      }
    };

    // Agregar listener para clicks
    document.addEventListener('click', handleThemeButtonClick, true);

    return () => {
      document.removeEventListener('click', handleThemeButtonClick, true);
      if (themeChangeTimer.current) {
        clearTimeout(themeChangeTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    // También detectar cambios de tema por el hook
    if (themeChangeTimer.current) {
      clearTimeout(themeChangeTimer.current);
    }

    isThemeChanging.current = true;

    themeChangeTimer.current = setTimeout(() => {
      isThemeChanging.current = false;
    }, 1000);

    return () => {
      if (themeChangeTimer.current) {
        clearTimeout(themeChangeTimer.current);
      }
    };
  }, [theme]);

  useEffect(() => {
    // Interceptar router.push durante cambios de tema
    const interceptedPush = (url: string, options?: any) => {
      if (isThemeChanging.current) {
        return Promise.resolve(true);
      }

      return originalPush.current(url, options);
    };

    // Reemplazar temporalmente router.push
    (router as any).push = interceptedPush;

    const originalPushValue = originalPush.current;

    return () => {
      // Restaurar router.push original
      (router as any).push = originalPushValue;
    };
  }, [router]);

  return <>{children}</>;
}
