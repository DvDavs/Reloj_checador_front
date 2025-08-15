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
    <div className='flex items-start gap-3 p-3 bg-card rounded-lg border border-border'>
      {icon && (
        <div className='mt-1 flex-shrink-0 p-1.5 bg-slate-100 rounded-md'>
          {icon}
        </div>
      )}
      <div className='space-y-2 flex-1'>
        <p className='text-sm font-semibold text-slate-600 uppercase tracking-wide'>
          {label}
        </p>
        <div className='text-lg font-medium text-foreground'>{value}</div>
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
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto elevated-card border-2 border-border shadow-2xl'>
          <DialogHeader className='pb-4 border-b-2 border-border bg-muted/30 -mx-6 -mt-6 px-6 pt-6 mb-6'>
            <DialogTitle className='text-2xl font-bold flex items-center gap-3 text-foreground'>
              <div className='p-2 bg-accent/10 rounded-lg'>
                <User className='h-6 w-6 text-accent' />
              </div>
              Detalles del Empleado
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-8 p-1'>
            <div className='bg-muted/30 p-6 rounded-lg border border-border'>
              <h3 className='text-lg font-semibold text-foreground mb-4'>
                Información Personal
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6'>
                <InfoItem
                  label='Nombre Completo'
                  value={getFullName(employee)}
                />
                <InfoItem label='ID Empleado' value={employee.id.toString()} />
                <InfoItem label='RFC' value={employee.rfc} />
                <InfoItem label='CURP' value={employee.curp} />
                <InfoItem
                  label='No. Tarjeta'
                  value={employee.tarjeta ?? 'N/A'}
                  icon={<CreditCard className='h-4 w-4 text-slate-600' />}
                />
                <InfoItem
                  label='Estado'
                  value={
                    <Badge
                      variant={
                        employee.estatusId === 1 ? 'default' : 'secondary'
                      }
                      className={
                        employee.estatusId === 1
                          ? 'badge-success shadow-sm'
                          : 'badge-warning shadow-sm'
                      }
                    >
                      {employee.estatusId === 1 ? 'Activo' : 'Inactivo'}
                    </Badge>
                  }
                />
              </div>
            </div>

            <div className='bg-green-50/50 p-6 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800'>
              <h3 className='text-lg font-semibold text-foreground mb-4'>
                Información Laboral
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6'>
                <InfoItem
                  label='Nombramiento'
                  value={employee.nombramiento}
                  icon={<Briefcase className='h-4 w-4 text-slate-600' />}
                />
                <InfoItem
                  label='Tipo Nombramiento Secundario'
                  value={employee.tipoNombramientoSecundario}
                  icon={<Tag className='h-4 w-4 text-slate-600' />}
                />
                <InfoItem
                  label='Departamento'
                  value={employee.departamentoNombre || 'N/A'}
                  icon={<Building className='h-4 w-4 text-slate-600' />}
                />
                <InfoItem
                  label='Academia'
                  value={employee.academiaNombre || 'N/A'}
                  icon={<BookOpen className='h-4 w-4 text-slate-600' />}
                />
              </div>
            </div>

            <div className='bg-orange-50/50 p-6 rounded-lg border border-orange-200'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-foreground'>
                  Huellas Digitales
                </h3>
                {isLoadingFingerprints && (
                  <Loader2 className='h-5 w-5 animate-spin text-orange-600' />
                )}
              </div>
              {error && (
                <div className='text-red-700 p-4 text-center rounded-lg bg-red-100 border-2 border-red-200 mb-4'>
                  <div className='flex items-center justify-center gap-2'>
                    <AlertCircle className='h-5 w-5' />
                    {error}
                  </div>
                </div>
              )}
              <div className='bg-card p-6 rounded-lg border-2 border-orange-200 shadow-sm dark:border-orange-800'>
                <div className='flex items-center gap-3 text-sm text-slate-600 mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200'>
                  <Info className='h-5 w-5 text-blue-600' />
                  <span className='font-medium'>
                    Haz clic en un dedo para registrarlo o eliminarlo.
                  </span>
                </div>
                <CompactHandSelector
                  registeredFingerIndices={registeredFingerIndices}
                  onFingerClick={handleFingerClick}
                />
              </div>
              <div className='space-y-4 mt-6'>
                <h4 className='font-semibold text-foreground flex items-center gap-2'>
                  Huellas Registradas
                  <Badge className='badge-info shadow-sm'>
                    {huellas.length}
                  </Badge>
                </h4>
                <AnimatePresence>
                  {huellas.length > 0 ? (
                    <motion.div
                      key='list'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className='space-y-3'
                    >
                      {huellas.map((h) => (
                        <motion.div
                          key={h.id}
                          layout
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className='flex items-center justify-between bg-card p-4 rounded-lg border-2 border-border shadow-sm hover:shadow-md transition-all duration-200'
                        >
                          <span className='font-medium capitalize text-foreground'>
                            {getFingerName(h).toLowerCase()}
                          </span>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => setFingerprintToDelete(h)}
                            className='text-red-600 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200 transition-all duration-200'
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
                        className='text-center py-8 bg-muted/30 rounded-lg border-2 border-dashed border-border'
                      >
                        <div className='flex flex-col items-center gap-3'>
                          <div className='w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center'>
                            <Fingerprint className='h-8 w-8 text-slate-400' />
                          </div>
                          <p className='text-slate-600 font-medium'>
                            Este empleado no tiene huellas registradas
                          </p>
                          <p className='text-slate-400 text-sm'>
                            Usa el selector de manos para registrar huellas
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

      <AlertDialog open={showFingerActions} onOpenChange={setShowFingerActions}>
        <AlertDialogContent className='elevated-card border-2 border-border shadow-2xl'>
          <AlertDialogHeader className='pb-4 border-b border-slate-200'>
            <AlertDialogTitle className='flex items-center gap-3 text-foreground'>
              <div className='p-2 bg-orange-100 rounded-lg'>
                <Fingerprint className='h-6 w-6 text-orange-600' />
              </div>
              {selectedFingerIndex != null &&
                INDEX_TO_FINGER_NAME[selectedFingerIndex]}
            </AlertDialogTitle>
            <AlertDialogDescription className='text-slate-600 font-medium'>
              Selecciona una acción para este dedo:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='space-y-3 py-6'>
            {selectedFingerIndex != null &&
              (() => {
                const idx = selectedFingerIndex as number;
                const isRegistered = registeredFingerIndices.includes(idx);
                return (
                  <>
                    {!isRegistered && (
                      <Button
                        onClick={() => handleFingerAction('register')}
                        className='w-full justify-start bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200'
                      >
                        <Plus className='h-5 w-5 mr-3' />
                        Registrar Huella
                      </Button>
                    )}
                    {isRegistered && (
                      <Button
                        onClick={() => handleFingerAction('delete')}
                        className='w-full justify-start bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200'
                      >
                        <Trash2 className='h-5 w-5 mr-3' />
                        Eliminar Huella
                      </Button>
                    )}
                  </>
                );
              })()}
          </div>
          <AlertDialogFooter className='border-t border-slate-200 pt-4'>
            <AlertDialogCancel
              onClick={() => {
                setShowFingerActions(false);
                setSelectedFingerIndex(null);
              }}
              className='border-slate-300 hover:bg-slate-100 text-slate-700 font-medium'
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
        <AlertDialogContent className='bg-card border-border text-card-foreground'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2 text-foreground'>
              <AlertCircle className='h-6 w-6 text-destructive' />
              Confirmar Eliminación
            </AlertDialogTitle>
            <AlertDialogDescription className='text-muted-foreground pt-2'>
              ¿Estás seguro de que quieres eliminar la huella del dedo{' '}
              <strong className='text-destructive'>
                {fingerprintToDelete
                  ? getFingerName(fingerprintToDelete as Huella).toLowerCase()
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
              className='bg-destructive hover:bg-destructive/90 text-destructive-foreground'
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
