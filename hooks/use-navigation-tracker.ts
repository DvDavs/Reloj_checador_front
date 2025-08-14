'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function useNavigationTracker() {
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  const navigationHistory = useRef<
    Array<{
      from: string;
      to: string;
      timestamp: string;
      reason?: string;
    }>
  >([]);

  useEffect(() => {
    if (previousPath.current !== pathname) {
      const navigationEvent = {
        from: previousPath.current,
        to: pathname,
        timestamp: new Date().toISOString(),
      };

      navigationHistory.current.push(navigationEvent);

      // Mantener solo los últimos 10 eventos
      if (navigationHistory.current.length > 10) {
        navigationHistory.current.shift();
      }

      // Detectar navegación no deseada al inicio (solo en desarrollo)
      if (
        process.env.NODE_ENV === 'development' &&
        pathname === '/' &&
        previousPath.current !== '/' &&
        previousPath.current !== '/login'
      ) {
        console.warn('⚠️ Unexpected navigation to home page detected!', {
          from: previousPath.current,
          to: pathname,
          timestamp: new Date().toISOString(),
          history: navigationHistory.current.slice(-3), // Últimos 3 eventos
        });
      }

      previousPath.current = pathname;
    }
  }, [pathname]);

  return {
    currentPath: pathname,
    previousPath: previousPath.current,
    navigationHistory: navigationHistory.current,
  };
}
