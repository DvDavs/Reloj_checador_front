'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Monitor,
  RefreshCw,
  AlertCircle,
  Loader2,
  ZapOff,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// Tipos
interface ReservedReader {
  readerName: string;
  sessionId: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function SessionMonitoringPage() {
  const [reservedReaders, setReservedReaders] = useState<ReservedReader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [releasingSession, setReleasingSession] = useState<string | null>(null);
  const [showReleaseConfirm, setShowReleaseConfirm] =
    useState<ReservedReader | null>(null);

  const fetchReservedReaders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<ReservedReader[]>(
        `${API_BASE_URL}/api/v1/multi-fingerprint/readers/reserved`
      );
      setReservedReaders(response.data);
      if (response.data.length === 0) {
        // Opcional: mostrar un mensaje en lugar de una tabla vacía
      }
    } catch (err: any) {
      console.error('Error fetching reserved readers:', err);
      setError(
        `No se pudo cargar la lista de sesiones activas. Causa: ${err.response?.data?.message || err.message}`
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservedReaders();
    const interval = setInterval(fetchReservedReaders, 10000); // Actualiza cada 10 segundos
    return () => clearInterval(interval);
  }, [fetchReservedReaders]);

  const handleReleaseSession = async () => {
    if (!showReleaseConfirm) return;

    setReleasingSession(showReleaseConfirm.readerName);
    setError(null);

    try {
      await apiClient.post(
        `${API_BASE_URL}/api/v1/multi-fingerprint/readers/release`,
        null,
        {
          params: { readerName: showReleaseConfirm.readerName },
        }
      );
      setShowReleaseConfirm(null);
      await fetchReservedReaders(); // Refrescar la lista
    } catch (err: any) {
      console.error('Error releasing session:', err);
      setError(
        `Falló la liberación de la sesión para ${showReleaseConfirm.readerName}. Causa: ${err.response?.data?.message || err.message}`
      );
    } finally {
      setReleasingSession(null);
    }
  };

  const renderContent = () => {
    if (isLoading && reservedReaders.length === 0) {
      return (
        <div className='flex justify-center items-center h-64'>
          <Loader2 className='h-12 w-12 animate-spin text-blue-500' />
        </div>
      );
    }

    if (error && reservedReaders.length === 0) {
      return (
        <div className='bg-red-900/30 border border-red-500/50 text-red-300 rounded-lg p-6 text-center'>
          <AlertCircle className='h-12 w-12 mx-auto mb-4' />
          <h3 className='text-xl font-bold mb-2'>Error al Cargar Sesiones</h3>
          <p>{error}</p>
        </div>
      );
    }

    if (reservedReaders.length === 0) {
      return (
        <div className='text-center h-64 flex flex-col justify-center items-center bg-zinc-900/50 border border-dashed border-zinc-700 rounded-lg'>
          <ShieldCheck className='h-16 w-16 text-green-500 mb-4' />
          <h3 className='text-2xl font-bold text-zinc-300'>
            No hay sesiones activas
          </h3>
          <p className='text-zinc-500'>
            Todos los lectores están actualmente disponibles.
          </p>
        </div>
      );
    }

    return (
      <motion.div
        className='overflow-hidden border border-zinc-800 rounded-lg'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className='relative overflow-x-auto'>
          <table className='w-full text-sm text-left text-zinc-400'>
            <thead className='text-xs text-zinc-300 uppercase bg-zinc-900/80'>
              <tr>
                <th scope='col' className='px-6 py-4'>
                  Nombre del Lector
                </th>
                <th scope='col' className='px-6 py-4'>
                  ID de Sesión del Navegador
                </th>
                <th scope='col' className='px-6 py-4 text-center'>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {reservedReaders.map((reader) => (
                <motion.tr
                  key={reader.readerName}
                  className='bg-zinc-950 border-b border-zinc-800 hover:bg-zinc-900'
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <td className='px-6 py-4 font-medium text-zinc-100 whitespace-nowrap'>
                    {reader.readerName}
                  </td>
                  <td className='px-6 py-4 font-mono text-xs'>
                    {reader.sessionId}
                  </td>
                  <td className='px-6 py-4 text-center'>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => setShowReleaseConfirm(reader)}
                      disabled={releasingSession === reader.readerName}
                    >
                      {releasingSession === reader.readerName ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      ) : (
                        <ZapOff className='h-4 w-4' />
                      )}
                      <span className='ml-2 hidden sm:inline'>
                        Forzar Liberación
                      </span>
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    );
  };

  return (
    <div className='p-8'>
      <div className='max-w-7xl mx-auto'>
        <header className='mb-10 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Monitor className='h-8 w-8 text-blue-400' />
            <h1 className='text-3xl font-bold'>
              Monitoreo de Sesiones Activas
            </h1>
          </div>
          <Button
            variant='outline'
            size='icon'
            className='rounded-full'
            onClick={fetchReservedReaders}
            disabled={isLoading}
            aria-label='Refrescar lista de sesiones'
          >
            {isLoading ? (
              <Loader2 className='h-5 w-5 animate-spin' />
            ) : (
              <RefreshCw className='h-5 w-5' />
            )}
          </Button>
        </header>

        {renderContent()}
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={!!showReleaseConfirm}
        onOpenChange={(isOpen) => !isOpen && setShowReleaseConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <ShieldX className='h-6 w-6 text-red-500' />
              Confirmar Liberación de Sesión
            </DialogTitle>
            <DialogDescription className='pt-2'>
              Esta acción forzará el cierre de la sesión del reloj checador para
              el lector{' '}
              <strong className='text-red-400'>
                {showReleaseConfirm?.readerName}
              </strong>
              . La ventana del quiosco mostrará un error y dejará de funcionar.
              <br />
              <br />
              Úselo solo si una sesión se ha quedado bloqueada o no se puede
              cerrar desde su propia ventana.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className='text-red-400 text-sm p-3 bg-red-900/30 rounded-md'>
              {error}
            </div>
          )}
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowReleaseConfirm(null)}
              disabled={!!releasingSession}
            >
              Cancelar
            </Button>
            <Button
              variant='destructive'
              onClick={handleReleaseSession}
              disabled={!!releasingSession}
            >
              {releasingSession ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : null}
              Sí, forzar liberación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
