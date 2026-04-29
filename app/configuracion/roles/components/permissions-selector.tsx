'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { getPermissionsGrouped } from '@/lib/api/permissions.api';
import { PermissionDto, PermissionsGrouped } from '@/lib/types/permissionTypes';

interface PermissionsSelectorProps {
  selected: Set<number>;
  onChange: (selected: Set<number>) => void;
}

export function PermissionsSelector({
  selected,
  onChange,
}: PermissionsSelectorProps) {
  const [grouped, setGrouped] = useState<PermissionsGrouped>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getPermissionsGrouped()
      .then(setGrouped)
      .finally(() => setIsLoading(false));
  }, []);

  const togglePermission = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange(next);
  };

  const toggleModule = (permissions: PermissionDto[]) => {
    const ids = permissions.map((p) => p.id);
    const allSelected = ids.every((id) => selected.has(id));
    const next = new Set(selected);
    if (allSelected) {
      ids.forEach((id) => next.delete(id));
    } else {
      ids.forEach((id) => next.add(id));
    }
    onChange(next);
  };

  const totalSelected = selected.size;
  const totalPerms = Object.values(grouped).flat().length;

  if (isLoading)
    return (
      <p className='text-sm text-muted-foreground'>Cargando permisos...</p>
    );

  return (
    <div className='space-y-4'>
      <p className='text-sm text-muted-foreground'>
        {totalSelected} de {totalPerms} permisos seleccionados
      </p>

      {Object.entries(grouped).map(([modulo, perms]) => {
        const allSelected = perms.every((p) => selected.has(p.id));
        const someSelected = perms.some((p) => selected.has(p.id));

        return (
          <div key={modulo} className='border rounded-lg overflow-hidden'>
            {/* CORRECCIÓN: Se eliminó el onClick del <div> para evitar el loop infinito de eventos. 
                Se aplicó "flex-1" al Label para mantener el área clickeable amplia. */}
            <div className='flex items-center gap-3 px-4 py-3 bg-muted'>
              <Checkbox
                id={`mod-${modulo}`}
                checked={
                  someSelected && !allSelected ? 'indeterminate' : allSelected
                }
                onCheckedChange={() => toggleModule(perms)}
              />
              <Label
                htmlFor={`mod-${modulo}`}
                className='font-semibold capitalize cursor-pointer flex-1'
              >
                {modulo}
                <span className='ml-2 text-xs text-muted-foreground font-normal'>
                  ({perms.filter((p) => selected.has(p.id)).length}/
                  {perms.length})
                </span>
              </Label>
            </div>

            <div className='divide-y'>
              {perms.map((perm) => (
                <div
                  key={perm.id}
                  className='flex items-start gap-3 px-6 py-2.5 hover:bg-muted/50'
                >
                  <Checkbox
                    id={`perm-${perm.id}`}
                    checked={selected.has(perm.id)}
                    onCheckedChange={() => togglePermission(perm.id)}
                    className='mt-0.5'
                  />
                  {/* CORRECCIÓN: Agregado "flex-1" para que toda la fila active el checkbox sin problemas */}
                  <Label
                    htmlFor={`perm-${perm.id}`}
                    className='cursor-pointer flex-1'
                  >
                    <span className='font-mono text-sm'>{perm.nombre}</span>
                    {perm.descripcion && (
                      <p className='text-xs text-muted-foreground'>
                        {perm.descripcion}
                      </p>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
