"use client";

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import TimeClock from '@/app/components/time-clock-view'; // Ajusta la ruta si es necesario
import { Loader2 } from 'lucide-react';

// Componente interno que usa useSearchParams
function RelojChecadorContent() {
    const searchParams = useSearchParams();
    const reader = searchParams.get('reader');
    const sessionId = searchParams.get('sessionId');

    if (!reader || !sessionId) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black text-red-500">
                Error: Falta el nombre del lector o el ID de sesión en la URL.
            </div>
        );
    }

    return <TimeClock selectedReader={reader} sessionId={sessionId} />;
}

// Componente de página que usa Suspense
export default function RelojChecadorPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-black text-white">
                <Loader2 className="h-12 w-12 animate-spin mr-4" /> Cargando Reloj Checador...
            </div>
        }>
            <RelojChecadorContent />
        </Suspense>
    );
}