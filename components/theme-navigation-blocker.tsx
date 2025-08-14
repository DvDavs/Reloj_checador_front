'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function ThemeNavigationBlocker({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const originalPush = useRef(router.push);
  const isBlocking = useRef(false);

  useEffect(() => {
    // Interceptor más agresivo que bloquea CUALQUIER navegación a home durante clicks de tema
    const interceptedPush = (url: string, options?: any) => {
      // Si estamos bloqueando y es navegación a home, bloquear
      if (isBlocking.current && (url === '/' || url === '/login')) {
        return Promise.resolve(true);
      }

      return originalPush.current(url, options);
    };

    // Interceptor de clicks en botones de tema
    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const themeButton = target.closest('button[aria-label="Toggle theme"]');

      if (themeButton) {
        isBlocking.current = true;

        setTimeout(() => {
          isBlocking.current = false;
        }, 3000); // 3 segundos de bloqueo total
      }
    };

    // Reemplazar router.push
    (router as any).push = interceptedPush;

    // Agregar listener de clicks
    document.addEventListener('click', handleClick, true);

    return () => {
      // Restaurar router.push original
      (router as any).push = originalPush.current;
      document.removeEventListener('click', handleClick, true);
    };
  }, [router]);

  return <>{children}</>;
}
