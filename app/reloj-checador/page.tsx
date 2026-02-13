'use client';

import { Suspense } from 'react';
import { TimeClock } from '@/app/components/timeclock';
import { Loader2 } from 'lucide-react';

/**
 * Página del Reloj Checador con WebSDK.
 *
 * Ya no requiere parámetros de URL (reader, sessionId) porque el WebSDK
 * detecta automáticamente los lectores conectados al equipo local.
 */
function RelojChecadorContent() {
  return <TimeClock sampleFormat='intermediate' />;
}

export default function RelojChecadorPage() {
  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center min-h-screen bg-black text-white'>
          <Loader2 className='h-12 w-12 animate-spin mr-4' /> Cargando Reloj
          Checador...
        </div>
      }
    >
      <RelojChecadorContent />
    </Suspense>
  );
}
