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
            <div
              className='flex items-center gap-3 px-4 py-3 bg-muted cursor-pointer'
              onClick={() => toggleModule(perms)}
            >
              <Checkbox
                id={`mod-${modulo}`}
                checked={allSelected}
                data-state={
                  someSelected && !allSelected
                    ? 'indeterminate'
                    : allSelected
                      ? 'checked'
                      : 'unchecked'
                }
                onCheckedChange={() => toggleModule(perms)}
                onClick={(e) => e.stopPropagation()}
              />
              <Label
                htmlFor={`mod-${modulo}`}
                className='font-semibold capitalize cursor-pointer'
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
                  <Label htmlFor={`perm-${perm.id}`} className='cursor-pointer'>
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
