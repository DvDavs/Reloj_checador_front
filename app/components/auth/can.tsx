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

  if (process.env.NODE_ENV === 'development' && !role && !permission) {
    console.warn(
      '[Can] No permission or role provided — renders children unconditionally. Add `permission` or `role` prop to gate access.'
    );
  }

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
