'use client';

import { useState, useEffect } from 'react';
import { EnhancedCard } from '@/app/components/shared/enhanced-card';
import { EnhancedBadge } from '@/app/components/shared/enhanced-badge';
import { RequirePermission } from '@/app/components/auth/require-permission';
import { getPermissionsGrouped } from '@/lib/api/permissions.api';
import { PermissionsGrouped } from '@/lib/types/permissionTypes';

export default function PermisosPage() {
  const [grouped, setGrouped] = useState<PermissionsGrouped>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPermissionsGrouped()
      .then(setGrouped)
      .catch(() => setError('No se pudieron cargar los permisos.'))
      .finally(() => setIsLoading(false));
  }, []);

  const total = Object.values(grouped).flat().length;

  return (
    <RequirePermission permission='rol:read'>
      <div className='p-6 md:p-8 max-w-4xl mx-auto space-y-6'>
        <div className='space-y-1'>
          <h1 className='text-2xl md:text-3xl font-bold text-foreground tracking-tight'>
            Permisos del sistema
          </h1>
          <div className='h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full'></div>
          <p className='text-muted-foreground pt-2'>
            Catálogo de {total} permisos disponibles, organizados por módulo.
          </p>
        </div>

        {isLoading && (
          <p className='text-muted-foreground'>Cargando permisos...</p>
        )}
        {error && <p className='text-destructive'>{error}</p>}

        {Object.entries(grouped).map(([modulo, perms]) => (
          <EnhancedCard key={modulo} variant='bordered' padding='md'>
            <div className='flex items-center gap-3 mb-4'>
              <h2 className='text-lg font-semibold capitalize'>{modulo}</h2>
              <EnhancedBadge variant='default'>{perms.length}</EnhancedBadge>
            </div>

            <div className='space-y-2'>
              {perms.map((p) => (
                <div
                  key={p.id}
                  className='flex items-start gap-3 p-2 rounded hover:bg-muted/50'
                >
                  <code className='text-sm font-mono bg-muted px-2 py-0.5 rounded text-primary whitespace-nowrap'>
                    {p.nombre}
                  </code>
                  <p className='text-sm text-muted-foreground'>
                    {p.descripcion}
                  </p>
                </div>
              ))}
            </div>
          </EnhancedCard>
        ))}
      </div>
    </RequirePermission>
  );
}
