
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Fingerprint, User, CheckCircle, ArrowRight } from "lucide-react";

interface PostRegistrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignFingerprint: () => void;
  onContinueToDetails: () => void;
  employeeName: string;
}

export function PostRegistrationDialog({
  isOpen,
  onClose,
  onAssignFingerprint,
  onContinueToDetails,
  employeeName,
}: PostRegistrationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <DialogTitle className="text-xl font-semibold text-green-400">
            ¡Empleado Registrado con Éxito!
          </DialogTitle>
          <DialogDescription className="text-zinc-300 text-base">
            El empleado <span className="font-semibold text-white">{employeeName}</span> ha sido creado correctamente en el sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-6 pb-2">
          <h3 className="text-lg font-medium text-center mb-6 text-zinc-200">¿Qué deseas hacer a continuación?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Asignar Huella */}
            <div
              onClick={onAssignFingerprint}
              className="group relative p-6 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:border-blue-500 hover:bg-zinc-800 cursor-pointer transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 bg-blue-600/20 rounded-full p-4 flex items-center justify-center ring-4 ring-blue-600/10">
                  <Fingerprint className="w-8 h-8 text-blue-400" />
                </div>
                <p className="font-semibold text-lg text-white mb-2">Asignar Huella Ahora</p>
                <p className="text-sm text-zinc-400">
                  Configura la autenticación biométrica del empleado.
                </p>
              </div>
              <div className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full text-white transform scale-0 group-hover:scale-100 transition-transform duration-300">
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>

            {/* Card 2: Ver Lista */}
            <div
              onClick={onContinueToDetails}
              className="group relative p-6 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 cursor-pointer transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 bg-zinc-600/20 rounded-full p-4 flex items-center justify-center ring-4 ring-zinc-600/10">
                  <User className="w-8 h-8 text-zinc-400" />
                </div>
                <p className="font-semibold text-lg text-white mb-2">Ver Lista de Empleados</p>
                <p className="text-sm text-zinc-400">
                  Vuelve al listado y asigna la huella después.
                </p>
              </div>
               <div className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 bg-zinc-600 rounded-full text-white transform scale-0 group-hover:scale-100 transition-transform duration-300">
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 