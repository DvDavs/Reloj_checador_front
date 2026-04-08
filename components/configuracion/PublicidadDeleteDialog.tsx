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

interface PublicidadDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  filename?: string;
}

export function PublicidadDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  filename,
}: PublicidadDeleteDialogProps) {
  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent className='shadow-2xl'>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2 text-xl font-bold'>
            <AlertCircle className='h-6 w-6 text-destructive' />
            Confirmar Eliminación
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className='pt-2 text-sm leading-relaxed'>
              ¿Estás seguro de que quieres eliminar esta imagen publicitaria?
              {filename && (
                <span className='block mt-1 font-mono text-[10px] text-muted-foreground italic'>
                  Referencia: {filename}
                </span>
              )}
              <div className='mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg'>
                <p className='text-destructive font-medium'>
                  Esta acción no se puede deshacer y la imagen dejará de
                  mostrarse en todos los dispositivos.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className='mt-6'>
          <AlertDialogCancel
            onClick={onClose}
            disabled={isDeleting}
            className='transition-colors'
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className='bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold h-10 px-6 transition-all'
          >
            {isDeleting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Eliminando...
              </>
            ) : (
              'Sí, eliminar imagen'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
