'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const [isVisible, setIsVisible] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  const dimension = useMemo(() => {
    if (typeof size === 'number') return size;
    return size === 'sm' ? 32 : size === 'lg' ? 80 : 48;
  }, [size]);

  // Only observe when there's actually a photo to load
  useEffect(() => {
    if (!empleadoId || !tieneFoto) return;

    const el = rootRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [empleadoId, tieneFoto]);

  useEffect(() => {
    if (!isVisible || !empleadoId || !tieneFoto) return;

    let revokedUrl: string | null = null;
    const load = async () => {
      try {
        const blob = await fetchEmpleadoFotoBlob(empleadoId);
        if (!blob) return;
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
  }, [isVisible, empleadoId, tieneFoto]);

  const imgSrc = objectUrl || (tieneFoto && fotoUrl ? fotoUrl : undefined);

  return (
    <span ref={rootRef} style={{ display: 'inline-flex' }}>
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
    </span>
  );
}
