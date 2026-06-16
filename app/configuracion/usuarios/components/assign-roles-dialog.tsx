'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { getRoles } from '@/lib/api/roles.api';
import { assignRoleToUser, removeRoleFromUser } from '@/lib/api/roles.api';
import { RoleDto } from '@/lib/types/roleTypes';
import { UserDto } from '@/lib/types/userTypes';

interface AssignRolesDialogProps {
  user: UserDto;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignRolesDialog({
  user,
  onClose,
  onSuccess,
}: AssignRolesDialogProps) {
  const { toast } = useToast();
  const [allRoles, setAllRoles] = useState<RoleDto[]>([]);
  const [selected, setSelected] = useState<Set<number>>(
    new Set(user.roles.map((r) => r.id))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getRoles()
      .then(setAllRoles)
      .finally(() => setIsLoading(false));
  }, []);

  const toggle = (roleId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(roleId) ? next.delete(roleId) : next.add(roleId);
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const initial = new Set(user.roles.map((r) => r.id));
    const toAdd = [...selected].filter((id) => !initial.has(id));
    const toRemove = [...initial].filter((id) => !selected.has(id));

    try {
      await Promise.all([
        ...toAdd.map((roleId) => assignRoleToUser(roleId, user.id)),
        ...toRemove.map((roleId) => removeRoleFromUser(roleId, user.id)),
      ]);
      toast({
        title: 'Roles actualizados',
        description: `Se actualizaron los roles de ${user.username}.`,
      });
      onSuccess();
      onClose();
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudieron actualizar los roles.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar roles a {user.username}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className='text-muted-foreground text-sm py-4'>
            Cargando roles...
          </p>
        ) : (
          <div className='space-y-2 py-2 max-h-72 overflow-y-auto'>
            {allRoles
              .filter((r) => r.activo)
              .map((role) => (
                <div
                  key={role.id}
                  className='flex items-center gap-3 p-2 rounded hover:bg-muted'
                >
                  <Checkbox
                    id={`role-${role.id}`}
                    checked={selected.has(role.id)}
                    onCheckedChange={() => toggle(role.id)}
                  />
                  <Label
                    htmlFor={`role-${role.id}`}
                    className='cursor-pointer flex-1'
                  >
                    <span className='font-medium'>{role.nombre}</span>
                    {role.descripcion && (
                      <p className='text-xs text-muted-foreground'>
                        {role.descripcion}
                      </p>
                    )}
                  </Label>
                </div>
              ))}
          </div>
        )}

        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
