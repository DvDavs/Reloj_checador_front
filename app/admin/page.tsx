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
  Monitor,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { getBrowserSessionId } from '@/lib/sessionId';

// Componentes mejorados
import { EnhancedCard } from '@/app/components/shared/enhanced-card';
import { LoadingState } from '@/app/components/shared/loading-state';
import { ErrorState } from '@/app/components/shared/error-state';

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

  // --- Renderizado mejorado ---
  return (
    <div className='min-h-screen bg-background'>
      <div className='p-6 md:p-8'>
        <div className='max-w-7xl mx-auto space-y-6'>
          {/* Header mejorado */}
          <EnhancedCard variant='elevated' padding='lg'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
              <div className='space-y-1'>
                <h1 className='text-2xl md:text-3xl font-bold text-foreground tracking-tight'>
                  Reloj Checador - Panel de Control
                </h1>
                <div className='h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full'></div>
              </div>
              <div className='flex items-center gap-3'>
                <Button
                  variant='outline'
                  size='icon'
                  className='h-10 w-10 border-2 border-border hover:border-primary hover:bg-primary/5 transition-all duration-200 shadow-sm'
                  onClick={handleRefreshScanners}
                  disabled={isLoading || isLaunching}
                  aria-label='Refrescar lista de lectores'
                >
                  {isLoading ? (
                    <Loader2 className='h-4 w-4 animate-spin text-primary' />
                  ) : (
                    <RefreshCw className='h-4 w-4 text-muted-foreground' />
                  )}
                </Button>
              </div>
            </div>
          </EnhancedCard>

          {/* Mensaje de Error General */}
          {errorMessage && !isLoading && (
            <EnhancedCard
              variant='elevated'
              padding='lg'
              className='border-red-200/60 dark:border-red-800'
            >
              <ErrorState
                message={errorMessage}
                onRetry={handleRefreshScanners}
              />
            </EnhancedCard>
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
                className='bg-card border-2 border-border rounded-xl p-6 max-w-md w-full shadow-2xl'
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
              >
                <h3 className='text-xl font-bold mb-4 flex items-center gap-2 text-foreground'>
                  <Fingerprint className='h-6 w-6 text-primary' />
                  Confirmar Inicio
                </h3>
                <p className='text-muted-foreground mb-6'>
                  ¿Desea iniciar una nueva ventana de Reloj Checador con el
                  lector{' '}
                  <strong className='text-foreground font-semibold'>
                    {selectedScanner.name}
                  </strong>
                  ?
                </p>
                {errorMessage && (
                  <div className='mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm dark:bg-red-950/30 dark:border-red-800 dark:text-red-400'>
                    <AlertCircle className='h-4 w-4 inline mr-2' />
                    {errorMessage}
                  </div>
                )}
                <div className='flex gap-3 justify-end'>
                  <Button
                    variant='outline'
                    onClick={handleCancelSelection}
                    disabled={isLaunching}
                    className='border-2 border-border hover:border-primary hover:bg-primary/5'
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmSelection}
                    className='bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200'
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
          {isLoading ? (
            // Estado de carga mejorado
            <EnhancedCard variant='elevated' padding='xl'>
              <LoadingState message='Cargando lectores de huellas disponibles...' />
            </EnhancedCard>
          ) : scanners.length > 0 ? (
            // Lista de escáneres mejorada
            <EnhancedCard variant='elevated' padding='lg'>
              <div className='space-y-6'>
                <div>
                  <h2 className='text-lg font-semibold text-foreground'>
                    Lectores Disponibles
                  </h2>
                  <p className='text-muted-foreground text-sm'>
                    Seleccione un lector para iniciar una nueva sesión de reloj
                    checador
                  </p>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {scanners.map((scanner) => (
                    <motion.div
                      key={scanner.id}
                      className={`group relative ${
                        scanner.status === 'online'
                          ? 'cursor-pointer'
                          : 'opacity-60 cursor-not-allowed'
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      whileHover={
                        scanner.status === 'online'
                          ? { scale: 1.02, y: -4 }
                          : {}
                      }
                      onClick={() => handleSelectScanner(scanner)}
                      role='button'
                      aria-label={`Seleccionar lector ${scanner.name}`}
                      aria-disabled={scanner.status !== 'online'}
                    >
                      <EnhancedCard
                        variant='bordered'
                        padding='lg'
                        hover={scanner.status === 'online'}
                        className={`h-64 flex flex-col items-center justify-center transition-all duration-300 ${
                          scanner.status === 'online'
                            ? 'hover:border-primary hover:shadow-lg hover:shadow-primary/10'
                            : ''
                        }`}
                      >
                        {/* Indicador de estado */}
                        <div
                          className={`absolute top-4 right-4 w-3 h-3 rounded-full ${
                            scanner.status === 'online'
                              ? 'bg-green-500 shadow-sm shadow-green-500/50'
                              : 'bg-muted-foreground'
                          }`}
                        ></div>

                        <div
                          className={`p-4 rounded-full mb-4 transition-all duration-300 ${
                            scanner.status === 'online'
                              ? 'bg-primary/10 group-hover:bg-primary/20'
                              : 'bg-muted/30'
                          }`}
                        >
                          <Fingerprint
                            className={`h-16 w-16 transition-all duration-300 ${
                              scanner.status === 'online'
                                ? 'text-primary group-hover:scale-110'
                                : 'text-muted-foreground'
                            }`}
                          />
                        </div>

                        <h3
                          className={`text-lg font-semibold mb-4 text-center transition-colors ${
                            scanner.status === 'online'
                              ? 'text-foreground group-hover:text-primary'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {scanner.name}
                        </h3>

                        {scanner.status === 'online' ? (
                          <Button
                            variant='outline'
                            size='sm'
                            className='border-primary/50 text-primary hover:bg-primary/10 hover:border-primary pointer-events-none transition-all duration-200'
                          >
                            <Monitor className='mr-2 h-4 w-4' />
                            Seleccionar Lector
                          </Button>
                        ) : (
                          <span className='text-muted-foreground text-sm bg-muted px-3 py-1 rounded-full'>
                            No disponible
                          </span>
                        )}
                      </EnhancedCard>
                    </motion.div>
                  ))}
                </div>
              </div>
            </EnhancedCard>
          ) : !errorMessage ? (
            // Mensaje "No hay lectores" mejorado
            <EnhancedCard variant='elevated' padding='xl'>
              <div className='flex flex-col items-center justify-center text-center space-y-6'>
                <div className='bg-muted/30 rounded-full p-6'>
                  <AlertCircle className='h-16 w-16 text-muted-foreground' />
                </div>
                <div className='space-y-2'>
                  <h3 className='text-xl font-bold text-foreground'>
                    No hay lectores disponibles
                  </h3>
                  <p className='text-muted-foreground max-w-md'>
                    Asegúrese de que los lectores estén conectados y el servicio
                    de huellas esté funcionando correctamente en el servidor.
                  </p>
                </div>
                <Button
                  className='bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200'
                  onClick={handleRefreshScanners}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <RefreshCw className='h-4 w-4 mr-2' />
                  )}
                  Volver a intentar
                </Button>
              </div>
            </EnhancedCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}
