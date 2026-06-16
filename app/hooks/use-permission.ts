'use client';

import { useAuth } from '@/app/context/AuthContext';

export function usePermission(permission: string | string[]): boolean {
  const { user } = useAuth();
  if (!user) return false;
  const perms = Array.isArray(permission) ? permission : [permission];
  return perms.some((p) => user.permissions.has(p));
}

export function useAllPermissions(...permissions: string[]): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return permissions.every((p) => user.permissions.has(p));
}

export function useRole(role: string): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return user.roles.has(role);
}
