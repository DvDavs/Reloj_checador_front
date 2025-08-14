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
  XCircle,
} from 'lucide-react'; // Añadir iconos
import { apiClient } from '@/lib/apiClient';
import { getBrowserSessionId } from '@/lib/sessionId';

// Tipos (Mantener simple aquí)
type ScannerStatus = 'online' | 'offline' | 'error' | 'reserved'; // 'reserved' es informativo aquí
interface FingerprintScanner {
  id: string;
  name: string;
  status: ScannerStatus;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function AdminDashboard() {
  const [scanners, setScanners] = useState<FingerprintScanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLaunching, setIsLaunching] = useState(false); // Cambiado de isReserving
  const [selectedScanner, setSelectedScanner] =
    useState<FingerprintScanner | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [browserSessionId, setBrowserSessionId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Obtener Session ID
  useEffect(() => {
    setBrowserSessionId(getBrowserSessionId());
  }, []);

  // Cargar lectores (cambiado fetchAvailableReaders)
  const fetchAvailableReaders = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setScanners([]);
    try {
      // GET /readers ya devuelve solo los disponibles (no reservados)
      const response = await apiClient.get<string[]>(
        `${API_BASE_URL}/api/v1/multi-fingerprint/readers`
      );
      const availableScanners = response.data.map((name) => ({
        id: name,
        name: name,
        status: 'online' as ScannerStatus, // Asume online si está en la lista
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
  }, [API_BASE_URL]); // Dependencia directa de la constante

  // Cargar al montar
  useEffect(() => {
    if (browserSessionId) {
      fetchAvailableReaders();
    }
  }, [browserSessionId, fetchAvailableReaders]);

  // Seleccionar scanner (sin cambios)
  const handleSelectScanner = (scanner: FingerprintScanner) => {
    if (scanner.status !== 'online') return;
    setSelectedScanner(scanner);
    setShowConfirmation(true);
    setErrorMessage(null);
  };

  // Lanzar Reloj Checador (Modificado: No reserva aquí)
  const handleConfirmSelection = async () => {
    if (!selectedScanner || !browserSessionId) return;

    setIsLaunching(true);
    setErrorMessage(null);

    const readerName = selectedScanner.name;
    const encodedReader = encodeURIComponent(readerName);
    const clockUrl = `/reloj-checador?reader=${encodedReader}&sessionId=${browserSessionId}`;

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

  // Cancelar selección (sin cambios)
  const handleCancelSelection = () => {
    setSelectedScanner(null);
    setShowConfirmation(false);
    setErrorMessage(null);
  };

  // Refrescar lista (sin cambios)
  const handleRefreshScanners = () => {
    fetchAvailableReaders();
  };

  // --- Renderizado (Ajustes menores en UI) ---
  return (
    <div className='p-8 bg-background min-h-screen'>
      <div className='max-w-7xl mx-auto'>
        <header className='mb-10 flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-foreground mb-2'>
              Iniciar Sesión de Reloj Checador
            </h1>
            <p className='text-muted-foreground'>
              Seleccione un lector de huellas disponible para iniciar una nueva
              sesión
            </p>
          </div>
          <Button
            variant='outline'
            size='icon'
            className='rounded-full border-border hover:bg-muted hover:border-accent/50 transition-all duration-200'
            onClick={handleRefreshScanners}
            disabled={isLoading || isLaunching}
            aria-label='Refrescar lista de lectores'
          >
            {isLoading ? (
              <Loader2 className='h-5 w-5 animate-spin text-accent' />
            ) : (
              <RefreshCw className='h-5 w-5' />
            )}
          </Button>
        </header>

        {/* Mensaje de Error General */}
        {errorMessage && !isLoading && (
          <div className='mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-3 shadow-sm'>
            <AlertCircle className='h-5 w-5 flex-shrink-0' />
            <p className='text-sm'>{errorMessage}</p>
          </div>
        )}

        {/* Diálogo de Confirmación */}
        {showConfirmation && selectedScanner && (
          <motion.div
            className='fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className='bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl'
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <h3 className='text-xl font-bold mb-4 flex items-center gap-2 text-card-foreground'>
                <Fingerprint className='h-6 w-6 text-accent' />
                Confirmar Inicio
              </h3>
              <p className='text-muted-foreground mb-6'>
                ¿Desea iniciar una nueva ventana de Reloj Checador con el lector{' '}
                <strong className='text-foreground font-semibold'>
                  {selectedScanner.name}
                </strong>
                ?
              </p>
              {errorMessage && (
                <div className='mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm'>
                  {errorMessage}
                </div>
              )}
              <div className='flex gap-3 justify-end'>
                <Button
                  variant='outline'
                  onClick={handleCancelSelection}
                  disabled={isLaunching}
                  className='border-border hover:bg-muted'
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmSelection}
                  className='bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm'
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

        {/* Contenido principal */}
        {
          isLoading ? (
            // Esqueletos de carga
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className='bg-card border border-border rounded-xl h-64 animate-pulse flex flex-col items-center justify-center p-6 shadow-sm'
                >
                  <div className='h-20 w-20 rounded-full bg-muted mb-4'></div>
                  <div className='h-6 w-3/4 rounded bg-muted mb-4'></div>
                  <div className='h-10 w-2/4 rounded bg-muted'></div>
                </div>
              ))}
            </div>
          ) : scanners.length > 0 ? (
            // Lista de escáneres
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {scanners.map((scanner) => (
                <motion.div
                  key={scanner.id}
                  className={`group relative bg-card border-2 ${
                    scanner.status === 'online'
                      ? 'border-border hover:border-accent cursor-pointer hover:shadow-lg hover:shadow-accent/10'
                      : 'border-border opacity-60 cursor-not-allowed'
                  }
                  rounded-xl overflow-hidden transition-all duration-300 h-64 flex flex-col items-center justify-center p-6 shadow-sm`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={
                    scanner.status === 'online' ? { scale: 1.02, y: -4 } : {}
                  }
                  onClick={() => handleSelectScanner(scanner)}
                  role='button'
                  aria-label={`Seleccionar lector ${scanner.name}`}
                  aria-disabled={scanner.status !== 'online'}
                >
                  {/* Indicador de estado */}
                  <div
                    className={`absolute top-4 right-4 w-3 h-3 rounded-full ${
                      scanner.status === 'online'
                        ? 'bg-primary'
                        : 'bg-muted-foreground'
                    }`}
                  ></div>

                  <Fingerprint
                    className={`h-24 w-24 mb-4 transition-all duration-300 ${
                      scanner.status === 'online'
                        ? 'text-accent group-hover:text-accent group-hover:scale-110'
                        : 'text-muted-foreground'
                    }`}
                  />
                  <h3
                    className={`text-lg font-semibold mb-4 text-center transition-colors ${
                      scanner.status === 'online'
                        ? 'text-card-foreground group-hover:text-accent'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {scanner.name}
                  </h3>
                  {scanner.status === 'online' && (
                    <Button
                      variant='outline'
                      className='border-accent/50 text-accent hover:bg-accent/10 hover:border-accent pointer-events-none transition-all duration-200'
                    >
                      Seleccionar Lector
                    </Button>
                  )}
                  {scanner.status !== 'online' && (
                    <span className='text-muted-foreground text-sm'>
                      No disponible
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          ) : !errorMessage ? (
            // Mensaje "No hay lectores"
            <div className='flex flex-col items-center justify-center h-96 text-center'>
              <div className='bg-muted/30 rounded-full p-6 mb-6'>
                <AlertCircle className='h-24 w-24 text-muted-foreground' />
              </div>
              <h3 className='text-2xl font-bold text-foreground mb-2'>
                No hay lectores disponibles
              </h3>
              <p className='text-muted-foreground mb-6 max-w-md'>
                Asegúrese de que los lectores estén conectados y el servicio de
                huellas esté funcionando correctamente en el servidor.
              </p>
              <Button
                className='bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm'
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
          ) : null /* Si hay errorMessage, ya se muestra arriba */
        }
      </div>
    </div>
  );
}
