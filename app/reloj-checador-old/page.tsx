'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import LegacyTimeClock from '@/app/components/time-clock-view';

function OldClockContent() {
  const searchParams = useSearchParams();
  const reader = searchParams.get('reader');
  const sessionId = searchParams.get('sessionId');
  const instanceId = useMemo(() => uuidv4(), []);

  if (!reader || !sessionId) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-black text-red-500'>
        Error: Falta el nombre del lector o el ID de sesión en la URL.
      </div>
    );
  }

  return (
    <LegacyTimeClock
      selectedReader={reader}
      sessionId={sessionId}
      instanceId={instanceId}
    />
  );
}

export default function OldClockPage() {
  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center min-h-screen bg-black text-white'>
          <Loader2 className='h-12 w-12 animate-spin mr-4' /> Cargando Reloj
          Checador (Viejo)...
        </div>
      }
    >
      <OldClockContent />
    </Suspense>
  );
}
