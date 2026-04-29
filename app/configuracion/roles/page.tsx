'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, PowerOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { PageLayout } from '@/app/components/shared/page-layout';
import { EnhancedTable } from '@/app/components/shared/enhanced-table';
import { EnhancedBadge } from '@/app/components/shared/enhanced-badge';
import { useTableState } from '@/app/hooks/use-table-state';
import { RequirePermission } from '@/app/components/auth/require-permission';
import { Can } from '@/app/components/auth/can';
import { getRoles, deleteRole, deactivateRole } from '@/lib/api/roles.api';
import { RoleDto } from '@/lib/types/roleTypes';
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

const ITEMS_PER_PAGE = 10;

export default function RolesPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleDto | null>(null);

  const {
    paginatedData,
    searchTerm,
    currentPage,
    sortField,
    sortDirection,
    totalPages,
    handleSearch,
    handleSort,
    handlePageChange,
  } = useTableState({
    data: roles,
    itemsPerPage: ITEMS_PER_PAGE,
    searchFields: ['nombre', 'descripcion'],
    defaultSortField: 'nombre',
  });

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setRoles(await getRoles());
    } catch {
      setError('No se pudieron cargar los roles.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleDeactivate = async (role: RoleDto) => {
    try {
      await deactivateRole(role.id);
      toast({
        title: 'Rol desactivado',
        description: `${role.nombre} fue desactivado.`,
      });
      fetchRoles();
    } catch (err: any) {
      const msg =
        err.response?.data?.message || 'No se pudo desactivar el rol.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRole(deleteTarget.id);
      toast({
        title: 'Rol eliminado',
        description: `${deleteTarget.nombre} fue eliminado.`,
      });
      fetchRoles();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'No se pudo eliminar el rol.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setDeleteTarget(null);
    }
  };

  const columns = [
    { key: 'nombre', label: 'Nombre', sortable: true },
    {
      key: 'descripcion',
      label: 'Descripción',
      render: (v: string) =>
        v || <span className='text-muted-foreground'>—</span>,
    },
    {
      key: 'permisos',
      label: 'Permisos',
      render: (_: any, row: RoleDto) => (
        <EnhancedBadge variant='default'>
          {row.permisos.length} permisos
        </EnhancedBadge>
      ),
    },
    {
      key: 'activo',
      label: 'Estado',
      render: (v: boolean) => (
        <EnhancedBadge variant={v ? 'success' : 'error'}>
          {v ? 'Activo' : 'Inactivo'}
        </EnhancedBadge>
      ),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_: any, row: RoleDto) => (
        <Can permission='rol:write'>
          <div className='flex gap-2'>
            <Link href={`/configuracion/roles/editar/${row.id}`}>
              <Button variant='ghost' size='icon' title='Editar'>
                <Edit size={16} />
              </Button>
            </Link>
            {row.activo && (
              <Button
                variant='ghost'
                size='icon'
                onClick={() => handleDeactivate(row)}
                title='Desactivar'
                className='text-orange-500 hover:text-orange-600'
              >
                <PowerOff size={16} />
              </Button>
            )}
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setDeleteTarget(row)}
              title='Eliminar'
              className='text-destructive hover:text-destructive'
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </Can>
      ),
    },
  ];

  return (
    <RequirePermission permission='rol:read'>
      <PageLayout
        title='Roles'
        isLoading={isLoading}
        error={error}
        onRefresh={fetchRoles}
        searchValue={searchTerm}
        onSearchChange={handleSearch}
        searchPlaceholder='Buscar rol...'
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        actions={
          <Can permission='rol:write'>
            <Link href='/configuracion/roles/registrar'>
              <Button>
                <Plus size={16} className='mr-2' />
                Nuevo rol
              </Button>
            </Link>
          </Can>
        }
      >
        <EnhancedTable
          columns={columns}
          data={paginatedData}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          emptyState={{
            title: 'No hay roles',
            description: 'Creá el primer rol del sistema.',
          }}
        />
      </PageLayout>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar rol?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto eliminará permanentemente el rol{' '}
              <strong>{deleteTarget?.nombre}</strong> y lo quitará de todos los
              usuarios que lo tengan asignado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RequirePermission>
  );
}
