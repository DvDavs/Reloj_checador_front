
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
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>¡Empleado Registrado con Éxito!</DialogTitle>
          <DialogDescription>
            El empleado <strong>{employeeName}</strong> ha sido creado. ¿Deseas
            asignar su huella dactilar ahora?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={onContinueToDetails}
            className="border-zinc-700 hover:bg-zinc-800 hover:text-white"
          >
            <User className="mr-2 h-4 w-4" />
            Ver Detalles (Después)
          </Button>
          <Button
            onClick={onAssignFingerprint}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Fingerprint className="mr-2 h-4 w-4" />
            Asignar Huella Ahora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 