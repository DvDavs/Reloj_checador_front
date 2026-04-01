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
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className='bg-card border-border text-card-foreground shadow-xl'>
        <AlertDialogHeader>
          {/* Icono de advertencia con fondo destructive */}
          <div className='flex justify-center mb-2'>
            <div className='w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center'>
              <AlertTriangle className='h-6 w-6 text-destructive' />
            </div>
          </div>

          <AlertDialogTitle className='text-center text-foreground font-semibold text-lg'>
            Confirmar Desasignación
          </AlertDialogTitle>

          <AlertDialogDescription className='text-center text-muted-foreground pt-1 leading-relaxed'>
            ¿Estás seguro de que quieres desasignar este horario?
            <br />
            <span className='text-foreground/70 font-medium text-xs'>
              Esta acción no se puede deshacer y el empleado perderá la
              asignación de horario.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className='mt-2 gap-2 sm:gap-2'>
          <AlertDialogCancel
            onClick={onClose}
            disabled={isDeleting}
            className='flex-1 border-border bg-muted/40 text-foreground hover:bg-muted hover:border-border/80 transition-colors'
          >
            Cancelar
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className='flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium transition-colors'
          >
            {isDeleting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Desasignando...
              </>
            ) : (
              'Sí, desasignar'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
