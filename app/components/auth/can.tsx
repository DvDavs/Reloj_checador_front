'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/app/context/AuthContext';

interface CanProps {
  permission?: string | string[];
  role?: string;
  mode?: 'any' | 'all';
  fallback?: ReactNode;
  children: ReactNode;
}

export function Can({
  permission,
  role,
  mode = 'any',
  fallback = null,
  children,
}: CanProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole } =
    useAuth();

  let allowed = true;

  if (role) {
    allowed = hasRole(role);
  }

  if (permission && allowed) {
    const perms = Array.isArray(permission) ? permission : [permission];
    allowed =
      mode === 'all' ? hasAllPermissions(...perms) : hasAnyPermission(...perms);
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
}
