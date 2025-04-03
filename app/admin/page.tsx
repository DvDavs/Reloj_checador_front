"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Fingerprint, RefreshCw, AlertCircle, Loader2 } from "lucide-react"
import axios from 'axios';
import { getBrowserSessionId } from '@/lib/sessionId'; // Importa el helper

// Tipos (asegúrate que coincidan con tus definiciones)
type ScannerStatus = "online" | "offline" | "error" | "reserved"; // Añadido 'reserved'

interface FingerprintScanner {
  id: string // Usaremos el nombre del lector como ID
  name: string
  status: ScannerStatus
  isSelected: boolean // Para la UI local
}

// --- Constantes ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function AdminDashboard() {
  const [scanners, setScanners] = useState<FingerprintScanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReserving, setIsReserving] = useState(false); // Estado para la reserva
  const [selectedScanner, setSelectedScanner] = useState<FingerprintScanner | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [browserSessionId, setBrowserSessionId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Obtener Session ID al montar
  useEffect(() => {
    setBrowserSessionId(getBrowserSessionId());
  }, []);

  // Cargar lectores al montar (y cuando cambie browserSessionId, aunque no debería)
  useEffect(() => {
    if (browserSessionId) {
        fetchAvailableReaders();
    }
  }, [browserSessionId]);

  // Función para obtener lectores disponibles del backend
  const fetchAvailableReaders = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setScanners([]); // Limpiar antes de cargar
    try {
      // Opcional: Llamar a auto-select primero si es necesario para que el backend refresque
      // try {
      //   await axios.get(`${API_BASE_URL}/api/v1/multi-fingerprint/auto-select`);
      // } catch (selectError) {
      //   console.warn("Auto-select falló (puede ser normal si no hay lectores nuevos):", selectError);
      // }

      const response = await axios.get<string[]>(`${API_BASE_URL}/api/v1/multi-fingerprint/readers`);
      const availableScanners = response.data.map(name => ({
          id: name,
          name: name,
          status: 'online' as ScannerStatus, // Asume online si está aquí
          isSelected: false
      }));
      setScanners(availableScanners);
      if (response.data.length === 0) {
        setErrorMessage("No se encontraron lectores disponibles o compatibles.");
      }
    } catch (error) {
      console.error("Error fetching readers:", error);
      setErrorMessage("Error al cargar la lista de lectores. Asegúrese que el servicio backend esté corriendo.");
      setScanners([]); // Asegurarse que esté vacío en caso de error
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar selección de un scanner (mostrar confirmación)
  const handleSelectScanner = (scanner: FingerprintScanner) => {
    if (scanner.status !== 'online') { // Solo seleccionar si está online
        return;
    }
    setSelectedScanner(scanner);
    setShowConfirmation(true);
    setErrorMessage(null); // Limpiar errores previos
  };

  // Confirmar selección y reservar
  const handleConfirmSelection = async () => {
    if (!selectedScanner || !browserSessionId) return;

    setIsReserving(true);
    setErrorMessage(null);
    const readerName = selectedScanner.name;
    const encodedReader = encodeURIComponent(readerName);

    try {
      // Intentar reservar el lector
      await axios.post(`${API_BASE_URL}/api/v1/multi-fingerprint/reserve/${encodedReader}?sessionId=${browserSessionId}`);

      console.log(`Lector ${readerName} reservado para sesión ${browserSessionId}`);

      // Abrir la nueva ventana pasando los datos necesarios
      const clockUrl = `/reloj-checador?reader=${encodedReader}&sessionId=${browserSessionId}`;
      window.open(clockUrl, "_blank", "width=1200,height=800");

      // Marcar localmente como reservado y refrescar lista para reflejar cambios
      setScanners(prev => prev.map(s => s.id === readerName ? { ...s, status: 'reserved' } : s));
      setShowConfirmation(false);
      setSelectedScanner(null); // Limpiar selección actual
      // Opcionalmente, refrescar la lista completa después de un delay
      // setTimeout(fetchAvailableReaders, 3000);

    } catch (error: any) {
      console.error("Error reserving reader:", error);
      const backendError = error.response?.data || "Error desconocido.";
      setErrorMessage(`No se pudo reservar el lector "${readerName}". Puede que ya esté en uso por otra sesión. (${backendError})`);
      setShowConfirmation(false); // Cerrar diálogo de confirmación en error
    } finally {
      setIsReserving(false);
    }
  };

  // Cancelar la selección
  const handleCancelSelection = () => {
    setSelectedScanner(null);
    setShowConfirmation(false);
    setErrorMessage(null);
  };

  // Refrescar lista
  const handleRefreshScanners = () => {
    fetchAvailableReaders();
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Lectores Disponibles para Reloj Checador</h1>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={handleRefreshScanners}
            disabled={isLoading || isReserving}
            aria-label="Refrescar lista de lectores"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
          </Button>
        </header>

        {/* Mensaje de Error General */}
        {errorMessage && !isLoading && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 text-red-400 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Diálogo de Confirmación */}
        {showConfirmation && selectedScanner && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-zinc-900 border-2 border-blue-500 rounded-lg p-6 max-w-md w-full"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Fingerprint className="h-6 w-6 text-blue-500" />
                Confirmar Selección
              </h3>
              <p className="text-zinc-300 mb-6">
                ¿Desea iniciar el Reloj Checador con el lector <strong className="text-white">{selectedScanner.name}</strong>? Este lector quedará reservado para esta sesión.
              </p>
              {/* Mensaje de Error Específico de Reserva */}
              {errorMessage && (
                 <p className="text-red-400 text-sm mb-4">{errorMessage}</p>
              )}
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={handleCancelSelection} disabled={isReserving}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmSelection} className="bg-blue-600 hover:bg-blue-700" disabled={isReserving}>
                  {isReserving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isReserving ? 'Reservando...' : 'Confirmar e Iniciar'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Contenido principal - Lista/Grid de escáneres */}
        {isLoading ? (
          // Esqueletos de carga
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="bg-zinc-900/50 border border-zinc-800 rounded-lg h-64 animate-pulse flex flex-col items-center justify-center p-6"
              >
                <div className="h-20 w-20 rounded-full bg-zinc-800 mb-4"></div>
                <div className="h-6 w-3/4 rounded bg-zinc-800 mb-4"></div>
                <div className="h-10 w-2/4 rounded bg-zinc-800"></div>
              </div>
            ))}
          </div>
        ) : scanners.length > 0 ? (
          // Lista de escáneres
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scanners.map((scanner) => (
              <motion.div
                key={scanner.id}
                className={`bg-zinc-900 border-2 ${
                    scanner.status === 'online' ? 'border-zinc-700 hover:border-blue-500 cursor-pointer'
                  : scanner.status === 'reserved' ? 'border-yellow-500/50 opacity-60 cursor-not-allowed'
                  : 'border-zinc-800 opacity-50 cursor-not-allowed'}
                  rounded-lg overflow-hidden transition-all duration-300 h-64 flex flex-col items-center justify-center p-6`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={scanner.status === 'online' ? { scale: 1.02 } : {}}
                onClick={() => handleSelectScanner(scanner)}
                role="button"
                aria-label={`Seleccionar lector ${scanner.name}`}
                aria-disabled={scanner.status !== 'online'}
              >
                <Fingerprint
                  className={`h-24 w-24 mb-4 ${
                      scanner.status === 'online' ? 'text-blue-500'
                    : scanner.status === 'reserved' ? 'text-yellow-600'
                    : 'text-zinc-600'}`}
                />
                <h3 className="text-xl font-bold mb-4 text-center">{scanner.name}</h3>
                {scanner.status === 'online' && (
                  <Button variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-900/30 pointer-events-none">Seleccionar</Button>
                )}
                {scanner.status === 'reserved' && (
                  <span className="text-yellow-500 text-sm font-medium">Reservado</span>
                )}
                 {scanner.status === 'offline' && (
                    <span className="text-zinc-500 text-sm">No disponible</span>
                )}
                {scanner.status === 'error' && (
                    <span className="text-red-500 text-sm">Error</span>
                )}
              </motion.div>
            ))}
          </div>
        ) : !errorMessage ? (
             // Si no está cargando y no hay scanners, pero tampoco hubo error de carga
             // (puede pasar si fetchAvailableReaders devuelve vacío correctamente)
            <div className="flex flex-col items-center justify-center h-96 text-center">
                <AlertCircle className="h-24 w-24 text-zinc-700 mb-6" />
                <h3 className="text-2xl font-bold text-zinc-400 mb-2">No hay lectores disponibles</h3>
                <p className="text-zinc-500 mb-6 max-w-md">
                    Asegúrese de que los lectores estén conectados y el servicio de huellas esté funcionando correctamente en el servidor.
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleRefreshScanners} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="h-5 w-5 mr-2" />}
                    Volver a intentar
                </Button>
            </div>
        ) : null /* Si hay errorMessage, ya se muestra arriba */ }
      </div>
    </div>
  )
}