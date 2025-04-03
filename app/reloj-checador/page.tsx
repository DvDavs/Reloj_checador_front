"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import TimeClock from "../components/time-clock"
import { Loader2 } from "lucide-react"

// Componente interno para usar useSearchParams
function RelojChecadorContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reader = searchParams.get('reader');
    const sessionId = searchParams.get('sessionId');

    useEffect(() => {
        // Si la ventana actual es la ventana principal (no fue abierta por otra ventana)
        // O si faltan los parámetros requeridos, redirigir.
        if (!window.opener || !reader || !sessionId) {
            console.warn("Redirigiendo: No es ventana hija o faltan parámetros reader/sessionId.");
            router.replace("/admin"); // Usa replace para no guardar en historial
        }
    }, [reader, sessionId, router]);

    // No renderizar TimeClock hasta tener los parámetros
    if (!reader || !sessionId) {
        return (
             <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                <p className="text-xl text-zinc-400">Cargando configuración del lector...</p>
                <p className="text-sm text-zinc-600 mt-2">Si esto persiste, cierre esta ventana y seleccione un lector nuevamente.</p>
            </div>
        );
    }

    // Pasar parámetros a TimeClock
    return <TimeClock selectedReader={reader} sessionId={sessionId} />;
}


export default function RelojChecadorPage() {
  return (
    // Suspense es necesario porque usamos useSearchParams
    <Suspense fallback={
         <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
            <p>Cargando...</p>
        </div>
    }>
      <RelojChecadorContent />
    </Suspense>
  );
}
