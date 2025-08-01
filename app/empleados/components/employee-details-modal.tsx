'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Trash2,
  Loader2,
  AlertCircle,
  User,
  Fingerprint,
  Info,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { CompactHandSelector } from './compact-hand-selector';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface EmpleadoBackend {
  id: number;
  rfc: string | null;
  curp: string | null;
  primerNombre: string | null;
  segundoNombre: string | null;
  primerApellido: string | null;
  segundoApellido: string | null;
  departamentoAcademicoId: number | null;
  departamentoAdministrativoId: number | null;
  tipoNombramientoPrincipal: string | null;
  tipoNombramientoSecundario: string | null;
  estatusId: number | null;
  estatusNombre: string | null;
  correoInstitucional: string | null;
  uuid: string | null;
}

interface Huella {
  id: number;
  nombreDedo: string; // Cambiado de fingerIndex a nombreDedo para coincidir con el DTO
  empleadoId: number;
  fechaRegistro: string;
}

interface EmployeeDetailsModalProps {
  employee: EmpleadoBackend | null;
  isOpen: boolean;
  onClose: () => void;
  onFingerprintDeleted?: () => void;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

const FINGER_NAME_TO_INDEX: { [key: string]: number } = {
  'PULGAR DERECHO': 1,
  'ÍNDICE DERECHO': 2,
  'MEDIO DERECHO': 3,
  'ANULAR DERECHO': 4,
  'MENIQUE DERECHO': 5,
  'PULGAR IZQUIERDO': 6,
  'ÍNDICE IZQUIERDO': 7,
  'MEDIO IZQUIERDO': 8,
  'ANULAR IZQUIERDO': 9,
  'MENIQUE IZQUIERDO': 10,
};

const INDEX_TO_FINGER_NAME: { [key: number]: string } = {
  1: 'Pulgar Derecho',
  2: 'Índice Derecho',
  3: 'Medio Derecho',
  4: 'Anular Derecho',
  5: 'Meñique Derecho',
  6: 'Pulgar Izquierdo',
  7: 'Índice Izquierdo',
  8: 'Medio Izquierdo',
  9: 'Anular Izquierdo',
  10: 'Meñique Izquierdo',
};

export function EmployeeDetailsModal({
  employee,
  isOpen,
  onClose,
  onFingerprintDeleted,
}: EmployeeDetailsModalProps) {
  const [huellas, setHuellas] = useState<Huella[]>([]);
  const [isLoadingFingerprints, setIsLoadingFingerprints] = useState(false);
  const [isDeletingFingerprint, setIsDeletingFingerprint] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fingerprintToDelete, setFingerprintToDelete] = useState<Huella | null>(
    null
  );
  const [selectedFingerIndex, setSelectedFingerIndex] = useState<number | null>(
    null
  );
  const [showFingerActions, setShowFingerActions] = useState(false);
  const { toast } = useToast();

  const getFullName = useCallback((emp: EmpleadoBackend | null): string => {
    if (!emp) return 'N/A';
    const nameParts = [
      emp.primerNombre,
      emp.segundoNombre,
      emp.primerApellido,
      emp.segundoApellido,
    ].filter(Boolean);
    return nameParts.join(' ') || 'Nombre no disponible';
  }, []);

  const fetchFingerprints = useCallback(async () => {
    if (!employee?.id) return;

    setIsLoadingFingerprints(true);
    setError(null);

    try {
      const response = await apiClient.get<Huella[]>(
        `${API_BASE_URL}/api/empleados/${employee.id}/huellas`
      );
      setHuellas(response.data || []);
    } catch (err: any) {
      console.error('Error fetching fingerprints:', err);
      setError('No se pudieron cargar las huellas.');
      setHuellas([]); // Limpiar huellas en caso de error
    } finally {
      setIsLoadingFingerprints(false);
    }
  }, [employee]);

  const handleDeleteFingerprint = async () => {
    if (!employee?.id || !fingerprintToDelete) return;

    setIsDeletingFingerprint(true);
    setError(null);

    try {
      await apiClient.delete(
        `${API_BASE_URL}/api/empleados/${employee.id}/huellas/${fingerprintToDelete.id}`
      );

      setHuellas((prev) => prev.filter((h) => h.id !== fingerprintToDelete.id));

      toast({
        title: 'Huella Eliminada',
        description: `La huella del ${fingerprintToDelete.nombreDedo.toLowerCase()} ha sido eliminada.`,
        variant: 'default',
      });

      onFingerprintDeleted?.();
    } catch (err: any) {
      console.error('Error deleting fingerprint:', err);
      setError('Error al eliminar la huella. Inténtelo de nuevo.');
      toast({
        title: 'Error al Eliminar',
        description:
          'No se pudo eliminar la huella. Por favor, inténtelo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingFingerprint(false);
      setFingerprintToDelete(null); // Cierra el diálogo de confirmación
    }
  };

  const handleFingerClick = (fingerIndex: number) => {
    setSelectedFingerIndex(fingerIndex);
    setShowFingerActions(true);
  };

  const handleFingerAction = (action: 'register' | 'delete') => {
    if (!selectedFingerIndex || !employee) return;

    const fingerName = INDEX_TO_FINGER_NAME[selectedFingerIndex]?.toUpperCase();
    if (!fingerName) return;

    const huella = huellas.find(
      (h) => h.nombreDedo.toUpperCase() === fingerName
    );

    switch (action) {
      case 'register':
        // Navegar a registrar huella para este dedo específico
        window.location.href = `/empleados/asignar-huella?id=${employee.id}&nombre=${encodeURIComponent(getFullName(employee))}&finger=${selectedFingerIndex}`;
        break;
      case 'delete':
        if (huella) {
          setFingerprintToDelete(huella);
        }
        break;
    }

    setShowFingerActions(false);
    setSelectedFingerIndex(null);
  };

  useEffect(() => {
    if (isOpen && employee) {
      fetchFingerprints();
    } else {
      // Reset state when closing
      setHuellas([]);
      setError(null);
      setIsLoadingFingerprints(false);
      setIsDeletingFingerprint(false);
      setFingerprintToDelete(null);
    }
  }, [isOpen, employee, fetchFingerprints]);

  if (!employee) return null;

  const registeredFingerIndices = huellas
    .map((h) => FINGER_NAME_TO_INDEX[h.nombreDedo.toUpperCase()])
    .filter(Boolean);

  const getFingerName = (huella: Huella) => {
    const index = FINGER_NAME_TO_INDEX[huella.nombreDedo.toUpperCase()];
    return INDEX_TO_FINGER_NAME[index] || huella.nombreDedo;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden bg-zinc-900 border-zinc-800 text-white'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-bold flex items-center gap-2'>
              <User className='h-6 w-6' />
              Detalles del Empleado
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-6 p-1'>
            {/* Información Personal */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4'>
              <div className='space-y-1'>
                <p className='text-sm font-medium text-zinc-400'>
                  Nombre Completo
                </p>
                <p className='text-lg'>{getFullName(employee)}</p>
              </div>
              <div className='space-y-1'>
                <p className='text-sm font-medium text-zinc-400'>ID Empleado</p>
                <p className='text-lg'>{employee.id}</p>
              </div>
              <div className='space-y-1'>
                <p className='text-sm font-medium text-zinc-400'>RFC</p>
                <p>{employee.rfc || 'N/A'}</p>
              </div>
              <div className='space-y-1'>
                <p className='text-sm font-medium text-zinc-400'>CURP</p>
                <p>{employee.curp || 'N/A'}</p>
              </div>
              <div className='space-y-1'>
                <p className='text-sm font-medium text-zinc-400'>
                  Correo Institucional
                </p>
                <p>{employee.correoInstitucional || 'N/A'}</p>
              </div>
              <div className='space-y-1'>
                <p className='text-sm font-medium text-zinc-400'>Estado</p>
                <Badge
                  variant={
                    employee.estatusNombre?.toLowerCase() === 'activo'
                      ? 'default'
                      : 'secondary'
                  }
                  className={
                    employee.estatusNombre?.toLowerCase() === 'activo'
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                  }
                >
                  {employee.estatusNombre || 'Desconocido'}
                </Badge>
              </div>
            </div>

            <Separator className='bg-zinc-700' />

            {/* Sección de Huellas */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-xl font-semibold flex items-center gap-2'>
                  <Fingerprint className='h-6 w-6 text-blue-400' />
                  Huellas Digitales
                </h3>
                {isLoadingFingerprints && (
                  <Loader2 className='h-5 w-5 animate-spin text-blue-500' />
                )}
              </div>

              {error && (
                <div className='flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-md'>
                  <AlertCircle className='h-5 w-5' />
                  <p>{error}</p>
                </div>
              )}

              {/* Solo mostrar las manos si hay huellas registradas */}
              {huellas.length > 0 && (
                <div className='bg-zinc-800/50 p-4 rounded-lg'>
                  <div className='flex items-center gap-2 text-sm text-zinc-400 mb-4 p-2 bg-zinc-900/50 rounded-md'>
                    <Info className='h-5 w-5' />
                    <span>
                      Haz clic en cualquier dedo para ver opciones disponibles.
                    </span>
                  </div>
                  <CompactHandSelector
                    registeredFingerIndices={registeredFingerIndices}
                    onFingerClick={handleFingerClick}
                  />
                </div>
              )}

              {/* Lista de Huellas */}
              <div className='space-y-4'>
                <h4 className='font-semibold text-zinc-300 flex items-center gap-2'>
                  Huellas Registradas
                  <Badge
                    variant='secondary'
                    className='bg-blue-500/20 text-blue-400 border-blue-500/30'
                  >
                    {huellas.length}
                  </Badge>
                </h4>

                <AnimatePresence mode='wait'>
                  {huellas.length > 0 ? (
                    <motion.div
                      key='fingerprints-list'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className='space-y-2'
                    >
                      {huellas.map((huella) => (
                        <motion.div
                          key={huella.id}
                          layout
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{
                            opacity: 0,
                            x: -20,
                            transition: { duration: 0.2 },
                          }}
                          className='flex items-center justify-between bg-zinc-800 p-3 rounded-md hover:bg-zinc-700/50 transition-colors'
                        >
                          <div className='flex items-center gap-3'>
                            <div className='w-2 h-2 rounded-full bg-green-500 flex-shrink-0'></div>
                            <span className='font-medium capitalize'>
                              {getFingerName(huella).toLowerCase()}
                            </span>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => setFingerprintToDelete(huella)}
                            className='text-red-400 hover:bg-red-500/10 hover:text-red-300'
                          >
                            <Trash2 className='h-4 w-4 mr-2' />
                            Eliminar
                          </Button>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    !isLoadingFingerprints && (
                      <motion.div
                        key='no-fingerprints'
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className='text-center py-12 space-y-6'
                      >
                        {/* Icono animado */}
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          className='flex justify-center'
                        >
                          <div className='relative'>
                            <Fingerprint className='h-16 w-16 text-zinc-600' />
                            <motion.div
                              animate={{ opacity: [0.3, 0.8, 0.3] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className='absolute inset-0 rounded-full bg-blue-500/20 blur-xl'
                            />
                          </div>
                        </motion.div>

                        {/* Mensaje principal */}
                        <div className='space-y-2'>
                          <h3 className='text-xl font-semibold text-zinc-300'>
                            Sin Huellas Registradas
                          </h3>
                          <p className='text-zinc-500 max-w-md mx-auto'>
                            Este empleado aún no tiene huellas dactilares
                            registradas en el sistema.
                          </p>
                        </div>

                        {/* Botón de acción */}
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            onClick={() => {
                              // Navegar a la página de asignar huella
                              window.location.href = `/empleados/asignar-huella?id=${employee.id}&nombre=${encodeURIComponent(getFullName(employee))}`;
                            }}
                            className='bg-zinc-700 hover:bg-zinc-600 text-white font-medium px-6 py-2 rounded-lg border border-zinc-600 hover:border-zinc-500 transition-all duration-200'
                          >
                            <Plus className='h-4 w-4 mr-2' />
                            Registrar Primera Huella
                            <ArrowRight className='h-4 w-4 ml-2' />
                          </Button>
                        </motion.div>

                        {/* Instrucciones adicionales */}
                        <div className='text-xs text-zinc-600 max-w-sm mx-auto'>
                          <p>
                            💡 <strong>Tip:</strong> Se recomienda registrar al
                            menos 2 dedos diferentes para mayor seguridad
                          </p>
                        </div>
                      </motion.div>
                    )
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- Finger Actions Dialog --- */}
      <AlertDialog open={showFingerActions} onOpenChange={setShowFingerActions}>
        <AlertDialogContent className='bg-zinc-900 border-zinc-800 text-white'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <Fingerprint className='h-6 w-6 text-blue-400' />
              {selectedFingerIndex && INDEX_TO_FINGER_NAME[selectedFingerIndex]}
            </AlertDialogTitle>
            <AlertDialogDescription className='text-zinc-400'>
              Selecciona una acción para este dedo:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='space-y-2 py-4'>
            {selectedFingerIndex &&
              (() => {
                const fingerName =
                  INDEX_TO_FINGER_NAME[selectedFingerIndex]?.toUpperCase();
                const isRegistered =
                  fingerName &&
                  huellas.some(
                    (h) => h.nombreDedo.toUpperCase() === fingerName
                  );

                return (
                  <>
                    {!isRegistered && (
                      <Button
                        onClick={() => handleFingerAction('register')}
                        className='w-full justify-start bg-green-600 hover:bg-green-700 text-white'
                      >
                        <Plus className='h-4 w-4 mr-2' />
                        Registrar Huella
                      </Button>
                    )}

                    {isRegistered && (
                      <Button
                        onClick={() => handleFingerAction('delete')}
                        className='w-full justify-start bg-red-600 hover:bg-red-700 text-white'
                      >
                        <Trash2 className='h-4 w-4 mr-2' />
                        Eliminar Huella
                      </Button>
                    )}
                  </>
                );
              })()}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowFingerActions(false);
                setSelectedFingerIndex(null);
              }}
              className='border-zinc-700 hover:bg-zinc-800'
            >
              Cancelar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- Confirmation Dialog --- */}
      <AlertDialog
        open={!!fingerprintToDelete}
        onOpenChange={(open) => !open && setFingerprintToDelete(null)}
      >
        <AlertDialogContent className='bg-zinc-900 border-zinc-800 text-white'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <AlertCircle className='h-6 w-6 text-red-500' />
              Confirmar Eliminación
            </AlertDialogTitle>
            <AlertDialogDescription className='text-zinc-400 pt-2'>
              ¿Estás seguro de que quieres eliminar la huella del dedo
              <strong className='text-red-400'>
                {' '}
                {fingerprintToDelete
                  ? getFingerName(fingerprintToDelete).toLowerCase()
                  : 'seleccionado'}
              </strong>
              ?
              <br />
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setFingerprintToDelete(null)}
              className='border-zinc-700 hover:bg-zinc-800'
              disabled={isDeletingFingerprint}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFingerprint}
              className='bg-red-600 hover:bg-red-700 text-white'
              disabled={isDeletingFingerprint}
            >
              {isDeletingFingerprint ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Eliminando...
                </>
              ) : (
                'Confirmar Eliminación'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
