'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface RequireRoleProps {
  role: string;
  redirectTo?: string;
  children: ReactNode;
}

export function RequireRole({
  role,
  redirectTo = '/',
  children,
}: RequireRoleProps) {
  const { hasRole, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const allowed = isLoading ? true : hasRole(role);

  useEffect(() => {
    if (!isLoading && !allowed) {
      toast({
        title: 'Acceso denegado',
        description: 'No tenés el rol necesario para ver esta página.',
        variant: 'destructive',
      });
      router.replace(redirectTo);
    }
  }, [isLoading, allowed, redirectTo, router, toast]);

  if (isLoading) return null;
  if (!allowed) return null;

  return <>{children}</>;
}
