'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface RequirePermissionProps {
  permission: string | string[];
  mode?: 'any' | 'all';
  redirectTo?: string;
  children: ReactNode;
}

export function RequirePermission({
  permission,
  mode = 'any',
  redirectTo = '/',
  children,
}: RequirePermissionProps) {
  const { hasAnyPermission, hasAllPermissions, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const perms = Array.isArray(permission) ? permission : [permission];
  const allowed = isLoading
    ? true
    : mode === 'all'
      ? hasAllPermissions(...perms)
      : hasAnyPermission(...perms);

  useEffect(() => {
    if (!isLoading && !allowed) {
      toast({
        title: 'Acceso denegado',
        description: 'No tenés los permisos necesarios para ver esta página.',
        variant: 'destructive',
      });
      router.replace(redirectTo);
    }
  }, [isLoading, allowed, redirectTo, router, toast]);

  if (isLoading) return null;
  if (!allowed) return null;

  return <>{children}</>;
}
