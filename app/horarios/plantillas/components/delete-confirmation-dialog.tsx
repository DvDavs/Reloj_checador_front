'use client';

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
import { AlertCircle, Loader2 } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  itemName?: string;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  itemName,
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2'>
            <AlertCircle className='h-6 w-6 text-red-500' />
            Confirmar Desactivación
          </AlertDialogTitle>
          <AlertDialogDescription className='pt-2'>
            ¿Estás seguro de que quieres desactivar la plantilla de horario{' '}
            <strong className='text-red-400'>
              {itemName || 'seleccionado'}
            </strong>
            ?
            <br />
            <p className='mt-2 text-sm text-yellow-400'>
              <strong>Advertencia:</strong> Desactivar esta plantilla afecta a
              los empleados que la tengan asignada. Se recomienda verificar las
              asignaciones antes de proceder.
            </p>
            <p className='mt-2 text-sm'>Esta acción no es reversible.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className='bg-red-600 hover:bg-red-700'
          >
            {isDeleting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Desactivando...
              </>
            ) : (
              'Sí, desactivar'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
