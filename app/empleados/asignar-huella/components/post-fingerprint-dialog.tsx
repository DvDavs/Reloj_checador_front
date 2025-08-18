import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CheckCircle, CalendarDays, Users, ArrowRight } from 'lucide-react';

interface PostFingerprintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSchedule: () => void;
  onGoToEmployees: () => void;
  employeeName: string;
}

export function PostFingerprintDialog({
  isOpen,
  onClose,
  onCreateSchedule,
  onGoToEmployees,
  employeeName,
}: PostFingerprintDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[500px] bg-card border-border text-card-foreground'>
        <DialogHeader className='text-center space-y-4'>
          <div className='mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20'>
            <CheckCircle className='w-8 h-8 text-primary' />
          </div>
          <DialogTitle className='text-2xl font-bold text-foreground text-center'>
            ¡Huella Registrada con Éxito!
          </DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm text-center leading-relaxed'>
            El empleado{' '}
            <span className='font-bold text-foreground text-base'>
              {employeeName}
            </span>{' '}
            ya cuenta con una huella registrada.
          </DialogDescription>
        </DialogHeader>

        <div className='pt-6 pb-2'>
          <h3 className='text-xl font-semibold text-center mb-6 text-foreground'>
            ¿Qué deseas hacer a continuación?
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div
              onClick={onCreateSchedule}
              className='group relative p-6 bg-muted/30 rounded-lg border border-border hover:border-accent hover:bg-muted/50 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg'
            >
              <div className='flex flex-col items-center text-center'>
                <div className='mb-4 bg-accent/10 rounded-full p-4 flex items-center justify-center ring-4 ring-accent/5 border border-accent/20'>
                  <CalendarDays className='w-8 h-8 text-accent' />
                </div>
                <p className='font-bold text-xl text-foreground mb-2'>
                  Crear Horario Ahora
                </p>
                <p className='text-xs text-muted-foreground leading-relaxed'>
                  Configura un nuevo horario personalizado para el empleado.
                </p>
              </div>
              <div className='absolute top-3 right-3 flex items-center justify-center w-8 h-8 bg-accent rounded-full text-accent-foreground transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-sm'>
                <ArrowRight className='h-5 w-5' />
              </div>
            </div>

            <div
              onClick={onGoToEmployees}
              className='group relative p-6 bg-muted/30 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg'
            >
              <div className='flex flex-col items-center text-center'>
                <div className='mb-4 bg-primary/10 rounded-full p-4 flex items-center justify-center ring-4 ring-primary/5 border border-primary/20'>
                  <Users className='w-8 h-8 text-primary' />
                </div>
                <p className='font-bold text-xl text-foreground mb-2'>
                  Ver Empleados
                </p>
                <p className='text-xs text-muted-foreground leading-relaxed'>
                  Vuelve al listado general de empleados.
                </p>
              </div>
              <div className='absolute top-3 right-3 flex items-center justify-center w-8 h-8 bg-primary rounded-full text-primary-foreground transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-sm'>
                <ArrowRight className='h-5 w-5' />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
