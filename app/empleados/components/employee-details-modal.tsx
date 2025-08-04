'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Fingerprint,
  Info,
  Building,
  BookOpen,
  Tag,
  CreditCard,
  AlertCircle,
  Loader2,
  Trash2,
  Plus,
  ArrowRight,
  X,
  Briefcase,
} from 'lucide-react';
import { CompactHandSelector } from './compact-hand-selector';
import { apiClient } from '@/lib/apiClient';
import { EmpleadoDto } from '@/app/lib/types/timeClockTypes';
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
import { useToast } from '@/components/ui/use-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

// --- Interfaces y Constantes ---
interface Huella {
  id: number;
  nombreDedo: string;
}
interface EmployeeDetailsModalProps {
  employee: EmpleadoDto | null;
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
  'MEÑIQUE DERECHO': 5,
  'PULGAR IZQUIERDO': 6,
  'ÍNDICE IZQUIERDO': 7,
  'MEDIO IZQUIERDO': 8,
  'ANULAR IZQUIERDO': 9,
  'MEÑIQUE IZQUIERDO': 10,
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

// --- Componente Auxiliar de Diseño ---
const InfoItem = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  if (!value && typeof value !== 'number') return null;
  return (
    <div className='flex items-start gap-3'>
      {icon && <div className='mt-1 flex-shrink-0 text-zinc-400'>{icon}</div>}
      <div className='space-y-1'>
        <p className='text-sm font-medium text-zinc-400'>{label}</p>
        <div className='text-lg text-zinc-100'>{value}</div>
      </div>
    </div>
  );
};

// --- Componente Principal del Modal ---
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

  const getFullName = useCallback(
    (emp: EmpleadoDto | null): string =>
      emp?.nombreCompleto || 'Nombre no disponible',
    []
  );

  const fetchFingerprints = useCallback(async () => {
    if (!employee?.id) return;
    setIsLoadingFingerprints(true);
    setError(null);
    try {
      const response = await apiClient.get<Huella[]>(
        `${API_BASE_URL}/api/empleados/${employee.id}/huellas`
      );
      setHuellas(response.data || []);
    } catch (err) {
      setError('No se pudieron cargar las huellas.');
    } finally {
      setIsLoadingFingerprints(false);
    }
  }, [employee]);

  const handleDeleteFingerprint = async () => {
    if (!employee?.id || !fingerprintToDelete) return;
    setIsDeletingFingerprint(true);
    try {
      await apiClient.delete(
        `${API_BASE_URL}/api/empleados/${employee.id}/huellas/${fingerprintToDelete.id}`
      );
      setHuellas((prev) => prev.filter((h) => h.id !== fingerprintToDelete.id));
      toast({ title: 'Huella Eliminada' });
      onFingerprintDeleted?.();
    } catch (err) {
      toast({ title: 'Error al Eliminar', variant: 'destructive' });
    } finally {
      setIsDeletingFingerprint(false);
      setFingerprintToDelete(null);
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

    if (action === 'register') {
      window.location.href = `/empleados/asignar-huella?id=${employee.id}&nombre=${encodeURIComponent(getFullName(employee))}&finger=${selectedFingerIndex}`;
    } else if (action === 'delete' && huella) {
      setFingerprintToDelete(huella);
    }
    setShowFingerActions(false);
    setSelectedFingerIndex(null);
  };

  useEffect(() => {
    if (isOpen && employee) fetchFingerprints();
    else {
      setHuellas([]);
      setError(null);
    }
  }, [isOpen, employee, fetchFingerprints]);

  if (!employee) return null;

  const registeredFingerIndices = huellas
    .map((h) => FINGER_NAME_TO_INDEX[h.nombreDedo.toUpperCase()])
    .filter(Boolean);
  const getFingerName = (huella: Huella) =>
    INDEX_TO_FINGER_NAME[
      FINGER_NAME_TO_INDEX[huella.nombreDedo.toUpperCase()]
    ] || huella.nombreDedo;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800 text-white'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-bold flex items-center gap-2'>
              <User className='h-6 w-6' /> Detalles del Empleado
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-6 p-1'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4'>
              <InfoItem label='Nombre Completo' value={getFullName(employee)} />
              <InfoItem label='ID Empleado' value={employee.id.toString()} />
              <InfoItem label='RFC' value={employee.rfc} />
              <InfoItem label='CURP' value={employee.curp} />
              <InfoItem
                label='No. Tarjeta'
                value={employee.tarjeta ?? 'N/A'}
                icon={<CreditCard className='h-4 w-4' />}
              />
              <InfoItem
                label='Estado'
                value={
                  <Badge
                    variant={employee.estatusId === 1 ? 'default' : 'secondary'}
                    className={
                      employee.estatusId === 1
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                    }
                  >
                    {employee.estatusId === 1 ? 'Activo' : 'Inactivo'}
                  </Badge>
                }
              />
            </div>

            <Separator className='bg-zinc-700' />

            <div className='space-y-4'>
              <h3 className='text-xl font-semibold flex items-center gap-2'>
                <Info className='h-5 w-5 text-blue-400' />
                Información Laboral
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4'>
                <InfoItem
                  label='Nombramiento'
                  value={employee.nombramiento}
                  icon={<Briefcase className='h-4 w-4' />}
                />
                <InfoItem
                  label='Tipo Nombramiento Secundario'
                  value={employee.tipoNombramientoSecundario}
                  icon={<Tag className='h-4 w-4' />}
                />
                <InfoItem
                  label='Departamento'
                  value={employee.departamentoNombre || 'N/A'}
                  icon={<Building className='h-4 w-4' />}
                />
                <InfoItem
                  label='Academia'
                  value={employee.academiaNombre || 'N/A'}
                  icon={<BookOpen className='h-4 w-4' />}
                />
              </div>
            </div>

            <Separator className='bg-zinc-700' />

            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-xl font-semibold flex items-center gap-2'>
                  <Fingerprint className='h-6 w-6 text-purple-400' />
                  Huellas Digitales
                </h3>
                {isLoadingFingerprints && (
                  <Loader2 className='h-5 w-5 animate-spin text-purple-500' />
                )}
              </div>
              {error && (
                <div className='text-red-400 p-3 text-center rounded-md bg-red-900/20 border border-red-800'>
                  {error}
                </div>
              )}
              <div className='bg-zinc-800/50 p-4 rounded-lg'>
                <div className='flex items-center gap-2 text-sm text-zinc-400 mb-4 p-2 bg-zinc-900/50 rounded-md'>
                  <Info className='h-5 w-5' />
                  <span>
                    Haz clic en un dedo para registrarlo o eliminarlo.
                  </span>
                </div>
                <CompactHandSelector
                  registeredFingerIndices={registeredFingerIndices}
                  onFingerClick={handleFingerClick}
                />
              </div>
              <div className='space-y-2'>
                <h4 className='font-semibold text-zinc-300'>
                  Huellas Registradas{' '}
                  <Badge
                    variant='secondary'
                    className='bg-purple-500/20 text-purple-400 border-purple-500/30'
                  >
                    {huellas.length}
                  </Badge>
                </h4>
                <AnimatePresence>
                  {huellas.length > 0 ? (
                    <motion.div
                      key='list'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className='space-y-2'
                    >
                      {huellas.map((h) => (
                        <motion.div
                          key={h.id}
                          layout
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className='flex items-center justify-between bg-zinc-800 p-3 rounded-md'
                        >
                          <span className='font-medium capitalize'>
                            {getFingerName(h).toLowerCase()}
                          </span>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => setFingerprintToDelete(h)}
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
                        key='empty'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className='text-center py-6'
                      >
                        <p className='text-zinc-500'>
                          Este empleado no tiene huellas registradas.
                        </p>
                      </motion.div>
                    )
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogos de acción y confirmación */}
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
                const isRegistered =
                  registeredFingerIndices.includes(selectedFingerIndex);
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
              ¿Estás seguro de que quieres eliminar la huella del dedo{' '}
              <strong className='text-red-400'>
                {fingerprintToDelete
                  ? getFingerName(fingerprintToDelete).toLowerCase()
                  : 'seleccionado'}
              </strong>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingFingerprint}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFingerprint}
              disabled={isDeletingFingerprint}
              className='bg-red-600 hover:bg-red-700'
            >
              {isDeletingFingerprint ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : null}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
