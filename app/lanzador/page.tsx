'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Fingerprint,
  RefreshCw,
  AlertCircle,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { getBrowserSessionId } from '@/lib/sessionId';
import Link from 'next/link';

type ScannerStatus = 'online' | 'offline' | 'error' | 'reserved';
interface FingerprintScanner {
  id: string;
  name: string;
  status: ScannerStatus;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
type ChecadorMode = 'new' | 'old';

function LanzadorChecadorContent() {
  const [scanners, setScanners] = useState<FingerprintScanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLaunching, setIsLaunching] = useState(false);
  const [selectedScanner, setSelectedScanner] =
    useState<FingerprintScanner | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [browserSessionId, setBrowserSessionId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<ChecadorMode>('new');

  useEffect(() => {
    setBrowserSessionId(getBrowserSessionId());
  }, []);

  const fetchAvailableReaders = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setScanners([]);
    try {
      const response = await apiClient.get<string[]>(
        `${API_BASE_URL}/api/v1/multi-fingerprint/readers`
      );
      const availableScanners = response.data.map((name) => ({
        id: name,
        name: name,
        status: 'online' as ScannerStatus,
      }));
      setScanners(availableScanners);
      if (response.data.length === 0) {
        setErrorMessage(
          'No se encontraron lectores disponibles o compatibles en este momento.'
        );
      }
    } catch (error: any) {
      console.error('Error fetching readers:', error);
      const backendError =
        error.response?.data || error.message || 'Error desconocido';
      setErrorMessage(
        `Error al cargar lectores: ${backendError}. Asegúrese que el servicio backend esté corriendo.`
      );
      setScanners([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (browserSessionId) {
      fetchAvailableReaders();
    }
  }, [browserSessionId, fetchAvailableReaders]);

  const handleSelectScanner = (scanner: FingerprintScanner) => {
    if (scanner.status !== 'online') return;
    setSelectedScanner(scanner);
    setShowConfirmation(true);
    setErrorMessage(null);
  };

  const handleConfirmSelection = async () => {
    if (!selectedScanner || !browserSessionId) return;

    setIsLaunching(true);
    setErrorMessage(null);

    const readerName = selectedScanner.name;
    const encodedReader = encodeURIComponent(readerName);
    const basePath = mode === 'old' ? '/reloj-checador-old' : '/reloj-checador';
    const clockUrl = `${basePath}?reader=${encodedReader}&sessionId=${browserSessionId}`;

    window.open(
      clockUrl,
      `_blank_clock_${readerName.replace(/\s+/g, '_')}`,
      'width=1280,height=800,resizable=yes,scrollbars=yes,status=yes'
    );

    setShowConfirmation(false);
    setSelectedScanner(null);
    setIsLaunching(false);

    setTimeout(() => {
      fetchAvailableReaders();
    }, 2000);
  };

  const handleCancelSelection = () => {
    setSelectedScanner(null);
    setShowConfirmation(false);
    setErrorMessage(null);
  };

  const handleRefreshScanners = () => {
    fetchAvailableReaders();
  };

  return (
    <div className='p-8 bg-black min-h-screen text-white'>
      <div className='max-w-7xl mx-auto'>
        <header className='mb-10 flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Link href='/login'>
              <img src='/Logo_ITO.png' alt='Logo' className='h-12 w-auto' />
            </Link>
            <h1 className='text-3xl font-bold'>Lanzador de Reloj Checador</h1>
          </div>
          <Button
            variant='outline'
            size='icon'
            className='rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            onClick={handleRefreshScanners}
            disabled={isLoading || isLaunching}
            aria-label='Refrescar lista de lectores'
          >
            {isLoading ? (
              <Loader2 className='h-5 w-5 animate-spin' />
            ) : (
              <RefreshCw className='h-5 w-5' />
            )}
          </Button>
          {/* Selector de modo: Nuevo / Viejo */}
          <div className='flex items-center gap-2 ml-4'>
            <Button
              variant={mode === 'new' ? 'default' : 'outline'}
              className={
                mode === 'new'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-zinc-800 border-zinc-700'
              }
              onClick={() => setMode('new')}
              aria-pressed={mode === 'new'}
            >
              Nuevo
            </Button>
            <Button
              variant={mode === 'old' ? 'default' : 'outline'}
              className={
                mode === 'old'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-zinc-800 border-zinc-700'
              }
              onClick={() => setMode('old')}
              aria-pressed={mode === 'old'}
            >
              Viejo
            </Button>
          </div>
        </header>

        {errorMessage && !isLoading && (
          <div className='mb-6 p-4 bg-red-900/30 border border-red-500/50 text-red-400 rounded-lg flex items-center gap-3'>
            <AlertCircle className='h-5 w-5' />
            <p>{errorMessage}</p>
          </div>
        )}

        {showConfirmation && selectedScanner && (
          <motion.div
            className='fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className='bg-zinc-900 border border-blue-500/50 rounded-lg p-6 max-w-md w-full shadow-xl'
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <h3 className='text-xl font-bold mb-4 flex items-center gap-2'>
                <Fingerprint className='h-6 w-6 text-blue-400' />
                Confirmar Inicio
              </h3>
              <p className='text-zinc-300 mb-6'>
                ¿Desea iniciar una nueva ventana de Reloj Checador con el lector{' '}
                <strong className='text-blue-300'>
                  {selectedScanner.name}
                </strong>
                ?
              </p>
              {errorMessage && (
                <p className='text-red-400 text-sm mb-4'>{errorMessage}</p>
              )}
              <div className='flex gap-3 justify-end'>
                <Button
                  variant='outline'
                  onClick={handleCancelSelection}
                  disabled={isLaunching}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmSelection}
                  className='bg-blue-600 hover:bg-blue-700'
                  disabled={isLaunching}
                >
                  {isLaunching ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <CheckCircle className='mr-2 h-4 w-4' />
                  )}
                  {isLaunching ? 'Lanzando...' : 'Confirmar e Iniciar'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isLoading ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className='bg-zinc-900/50 border border-zinc-800 rounded-lg h-64 animate-pulse flex flex-col items-center justify-center p-6'
              >
                <div className='h-20 w-20 rounded-full bg-zinc-800 mb-4'></div>
                <div className='h-6 w-3/4 rounded bg-zinc-800 mb-4'></div>
                <div className='h-10 w-2/4 rounded bg-zinc-800'></div>
              </div>
            ))}
          </div>
        ) : scanners.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {scanners.map((scanner) => (
              <motion.div
                key={scanner.id}
                className={`relative bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 ${
                  scanner.status === 'online'
                    ? 'border-zinc-700 hover:border-blue-500 cursor-pointer'
                    : 'border-zinc-800 opacity-60 cursor-not-allowed'
                }
                rounded-xl overflow-hidden transition-all duration-300 h-64 flex flex-col items-center justify-center p-6 shadow-md hover:shadow-blue-500/20`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={
                  scanner.status === 'online' ? { scale: 1.02, y: -2 } : {}
                }
                onClick={() => handleSelectScanner(scanner)}
                role='button'
                aria-label={`Seleccionar lector ${scanner.name}`}
                aria-disabled={scanner.status !== 'online'}
              >
                <Fingerprint
                  className={`h-24 w-24 mb-4 transition-colors ${
                    scanner.status === 'online'
                      ? 'text-blue-400 group-hover:text-blue-300'
                      : 'text-zinc-600'
                  }`}
                />
                <h3 className='text-lg font-semibold mb-4 text-center text-zinc-100'>
                  {scanner.name}
                </h3>
                {scanner.status === 'online' && (
                  <Button
                    variant='outline'
                    className='border-blue-600 text-blue-400 hover:bg-blue-900/30 hover:text-blue-300 pointer-events-none'
                  >
                    Seleccionar Lector
                  </Button>
                )}
                {scanner.status !== 'online' && (
                  <span className='text-zinc-500 text-sm'>No disponible</span>
                )}
              </motion.div>
            ))}
          </div>
        ) : !errorMessage ? (
          <div className='flex flex-col items-center justify-center h-96 text-center'>
            <AlertCircle className='h-24 w-24 text-zinc-700 mb-6' />
            <h3 className='text-2xl font-bold text-zinc-400 mb-2'>
              No hay lectores disponibles
            </h3>
            <p className='text-zinc-500 mb-6 max-w-md'>
              Asegúrese de que los lectores estén conectados y el servicio de
              huellas esté funcionando correctamente en el servidor.
            </p>
            <Button
              className='bg-blue-600 hover:bg-blue-700'
              onClick={handleRefreshScanners}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <RefreshCw className='h-5 w-5 mr-2' />
              )}
              Volver a intentar
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function LanzadorChecadorPage() {
  return <LanzadorChecadorContent />;
}
