'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { getPermissionsGrouped } from '@/lib/api/permissions.api';
import { PermissionDto, PermissionsGrouped } from '@/lib/types/permissionTypes';
import { Badge } from '@/components/ui/badge';

interface PermissionsSelectorProps {
  selected: Set<number>;
  onChange: (selected: Set<number>) => void;
}

/**
 * Mapa de dependencias entre permisos.
 * Clave = permiso "hijo" (el que requiere dependencias).
 * Valor = lista de permisos que se auto-activan al seleccionar la clave.
 *
 * Ejemplo: si activo "empleado:write", automáticamente se activa "empleado:read".
 */
const PERMISSION_DEPENDENCIES: Record<string, string[]> = {
  // Empleados
  'empleado:write': ['empleado:read'],
  'empleado:manage-fingerprints': ['empleado:read', 'empleado:write'],
  'empleado:manage-photos': ['empleado:read', 'empleado:write'],

  // Asistencias
  'asistencia:write': ['asistencia:read-all'],
  'asistencia:correct': ['asistencia:read-all'],
  'asistencia:generate': ['asistencia:read-all'],

  // Chequeos
  'chequeo:write': ['chequeo:read'],

  // Horarios
  'horario:write': ['horario:read'],
  'horario:assign': ['horario:read'],

  // Justificaciones
  'justificacion:write': ['justificacion:read'],
  'justificacion:write-bulk': ['justificacion:read', 'justificacion:write'],

  // Reportes
  'reporte:download': ['reporte:generate'],

  // Configuración
  'usuario:write': ['usuario:read'],
  'rol:write': ['rol:read'],

  // Publicidad
  'publicidad:write': ['publicidad:read'],
};

/**
 * Mapa inverso: dado un permiso "padre", lista los permisos que dependen de él.
 * Esto se usa para desactivar automáticamente dependientes al quitar un padre.
 */
function buildDependentsMap(): Record<string, string[]> {
  const dependents: Record<string, string[]> = {};
  for (const [child, parents] of Object.entries(PERMISSION_DEPENDENCIES)) {
    for (const parent of parents) {
      if (!dependents[parent]) dependents[parent] = [];
      dependents[parent].push(child);
    }
  }
  return dependents;
}

const PERMISSION_DEPENDENTS = buildDependentsMap();

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

  // Mapa nombre -> id para resolver dependencias
  const nameToId = useMemo(() => {
    const map = new Map<string, number>();
    for (const perms of Object.values(grouped)) {
      for (const p of perms) {
        map.set(p.nombre, p.id);
      }
    }
    return map;
  }, [grouped]);

  // Mapa id -> nombre para resolver dependientes
  const idToName = useMemo(() => {
    const map = new Map<number, string>();
    for (const perms of Object.values(grouped)) {
      for (const p of perms) {
        map.set(p.id, p.nombre);
      }
    }
    return map;
  }, [grouped]);

  // Resolver IDs de dependencias de un permiso dado
  const resolveDependencyIds = useCallback(
    (permName: string): number[] => {
      const deps = PERMISSION_DEPENDENCIES[permName];
      if (!deps) return [];
      return deps
        .map((dep) => nameToId.get(dep))
        .filter((id): id is number => id !== undefined);
    },
    [nameToId]
  );

  // Resolver IDs de dependientes (hijos) de un permiso dado
  const resolveDependentIds = useCallback(
    (permName: string): number[] => {
      const dependents = PERMISSION_DEPENDENTS[permName];
      if (!dependents) return [];
      return dependents
        .map((dep) => nameToId.get(dep))
        .filter((id): id is number => id !== undefined);
    },
    [nameToId]
  );

  // Chequear si un permiso es requerido por otro permiso activo
  const isRequiredByOther = useCallback(
    (permId: number): boolean => {
      const permName = idToName.get(permId);
      if (!permName) return false;
      const dependentIds = resolveDependentIds(permName);
      return dependentIds.some((depId) => selected.has(depId));
    },
    [idToName, resolveDependentIds, selected]
  );

  const togglePermission = useCallback(
    (id: number) => {
      const next = new Set(selected);
      const permName = idToName.get(id);

      if (next.has(id)) {
        // Desactivar: solo si no es requerido por otro
        if (permName && isRequiredByOther(id)) {
          return; // No permitir desactivar
        }
        next.delete(id);
        // Desactivar dependientes que ya no tienen sus dependencias
        if (permName) {
          const dependentIds = resolveDependentIds(permName);
          for (const depId of dependentIds) {
            const depName = idToName.get(depId);
            if (!depName) continue;
            const depDeps = PERMISSION_DEPENDENCIES[depName];
            if (depDeps) {
              const allSatisfied = depDeps.every((d) => {
                const dId = nameToId.get(d);
                return dId !== undefined && next.has(dId);
              });
              if (!allSatisfied) {
                next.delete(depId);
              }
            }
          }
        }
      } else {
        // Activar: también activar dependencias
        next.add(id);
        if (permName) {
          const depIds = resolveDependencyIds(permName);
          for (const depId of depIds) {
            next.add(depId);
          }
        }
      }

      onChange(next);
    },
    [
      selected,
      idToName,
      nameToId,
      isRequiredByOther,
      resolveDependencyIds,
      resolveDependentIds,
      onChange,
    ]
  );

  const toggleModule = (permissions: PermissionDto[]) => {
    const ids = permissions.map((p) => p.id);
    const allSelected = ids.every((id) => selected.has(id));
    const next = new Set(selected);

    if (allSelected) {
      // Desactivar módulo completo (solo los que no son requeridos externamente)
      for (const id of ids) {
        if (!isRequiredByOther(id)) {
          next.delete(id);
        }
      }
    } else {
      // Activar módulo completo (con todas sus dependencias)
      for (const perm of permissions) {
        next.add(perm.id);
        const depIds = resolveDependencyIds(perm.nombre);
        for (const depId of depIds) {
          next.add(depId);
        }
      }
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
              {perms.map((perm) => {
                const isLocked = isRequiredByOther(perm.id);
                const hasDeps = !!PERMISSION_DEPENDENCIES[perm.nombre];
                const depNames = PERMISSION_DEPENDENCIES[perm.nombre] || [];

                return (
                  <div
                    key={perm.id}
                    className={`flex items-start gap-3 px-6 py-2.5 hover:bg-muted/50 ${
                      isLocked && selected.has(perm.id) ? 'bg-primary/5' : ''
                    }`}
                  >
                    <Checkbox
                      id={`perm-${perm.id}`}
                      checked={selected.has(perm.id)}
                      onCheckedChange={() => togglePermission(perm.id)}
                      className='mt-0.5'
                      disabled={isLocked && selected.has(perm.id)}
                    />
                    {/* CORRECCIÓN: Agregado "flex-1" para que toda la fila active el checkbox sin problemas */}
                    <Label
                      htmlFor={`perm-${perm.id}`}
                      className='cursor-pointer flex-1'
                    >
                      <div className='flex items-center gap-2 flex-wrap'>
                        <span className='font-mono text-sm'>{perm.nombre}</span>
                        {isLocked && selected.has(perm.id) && (
                          <Badge
                            variant='outline'
                            className='text-[10px] px-1.5 py-0 h-4 border-primary/40 text-primary'
                          >
                            requerido
                          </Badge>
                        )}
                        {hasDeps && (
                          <Badge
                            variant='secondary'
                            className='text-[10px] px-1.5 py-0 h-4'
                          >
                            activa: {depNames.join(', ')}
                          </Badge>
                        )}
                      </div>
                      {perm.descripcion && (
                        <p className='text-xs text-muted-foreground'>
                          {perm.descripcion}
                        </p>
                      )}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
