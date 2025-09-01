'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { fetchEmpleadoFotoBlob } from '@/lib/api/empleados-foto.api';
import { User } from 'lucide-react';

type Size = 'sm' | 'md' | 'lg' | number;

export function EmployeeAvatar({
  empleadoId,
  nombre,
  fotoUrl,
  tieneFoto,
  size = 'md',
  className,
}: {
  empleadoId: number | null | undefined;
  nombre?: string | null;
  fotoUrl?: string | null;
  tieneFoto?: boolean | null;
  size?: Size;
  className?: string;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const dimension = useMemo(() => {
    if (typeof size === 'number') return size;
    return size === 'sm' ? 32 : size === 'lg' ? 80 : 48;
  }, [size]);

  // Cuando no hay foto, mostramos el icono por defecto (User) en lugar de iniciales

  useEffect(() => {
    let revokedUrl: string | null = null;
    const load = async () => {
      if (!empleadoId || !tieneFoto) {
        setObjectUrl(null);
        return;
      }
      try {
        const blob = await fetchEmpleadoFotoBlob(empleadoId);
        if (!blob) {
          setObjectUrl(null);
          return;
        }
        const url = URL.createObjectURL(blob);
        revokedUrl = url;
        setObjectUrl(url);
      } catch {
        setObjectUrl(null);
      }
    };
    load();
    return () => {
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [empleadoId, tieneFoto]);

  const imgSrc = objectUrl || (tieneFoto && fotoUrl ? fotoUrl : undefined);

  return (
    <Avatar
      className={className}
      style={{ width: dimension, height: dimension }}
    >
      {imgSrc ? (
        <AvatarImage src={imgSrc} alt={nombre || 'Employee'} />
      ) : (
        <AvatarFallback>
          <User className='h-1/2 w-1/2 text-zinc-500' />
        </AvatarFallback>
      )}
    </Avatar>
  );
}
