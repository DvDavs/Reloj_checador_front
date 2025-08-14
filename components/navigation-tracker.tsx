'use client';

import { useNavigationTracker } from '@/hooks/use-navigation-tracker';

export function NavigationTracker({ children }: { children: React.ReactNode }) {
  useNavigationTracker();
  return <>{children}</>;
}
