
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

        <div className="py-6">
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
            <h3 className="text-sm font-medium text-zinc-300 mb-3">¿Qué deseas hacer a continuación?</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Fingerprint className="w-3 h-3 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Asignar Huella Dactilar</p>
                  <p className="text-xs text-zinc-400">Configura la autenticación biométrica para el empleado</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-zinc-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-3 h-3 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Ver Lista de Empleados</p>
                  <p className="text-xs text-zinc-400">Regresar a la lista principal (puedes asignar la huella después)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={onContinueToDetails}
            className="border-zinc-700 hover:bg-zinc-800 hover:text-white flex-1 order-2 sm:order-1"
          >
            <User className="mr-2 h-4 w-4" />
            Ver Lista de Empleados
          </Button>
          <Button
            onClick={onAssignFingerprint}
            className="bg-blue-600 hover:bg-blue-700 text-white flex-1 order-1 sm:order-2"
          >
            <Fingerprint className="mr-2 h-4 w-4" />
            Asignar Huella Ahora
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 