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
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className='bg-zinc-900 border-zinc-800 text-white shadow-2xl'>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2 text-xl font-bold'>
            <AlertCircle className='h-6 w-6 text-red-500' />
            Confirmar Eliminación
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className='text-zinc-400 pt-2 text-sm leading-relaxed'>
              ¿Estás seguro de que quieres eliminar esta imagen publicitaria?
              {filename && (
                <span className='block mt-1 font-mono text-[10px] text-zinc-500 italic'>
                  Referencia: {filename}
                </span>
              )}
              <div className='mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg'>
                <p className='text-red-400 font-medium'>
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
            className='border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors'
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className='bg-red-600 hover:bg-red-700 text-white font-bold h-10 px-6 transition-all'
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
