'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserPlus, Edit, Trash2, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { PageLayout } from '@/app/components/shared/page-layout';
import { EnhancedTable } from '@/app/components/shared/enhanced-table';
import { EnhancedBadge } from '@/app/components/shared/enhanced-badge';
import { useTableState } from '@/app/hooks/use-table-state';
import { RequirePermission } from '@/app/components/auth/require-permission';
import { Can } from '@/app/components/auth/can';
import { getUsers, deleteUser } from '@/lib/api/users.api';
import { UserDto } from '@/lib/types/userTypes';
import { AssignRolesDialog } from './components/assign-roles-dialog';
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

export default function UsuariosPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserDto | null>(null);
  const [assignTarget, setAssignTarget] = useState<UserDto | null>(null);

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
    data: users,
    itemsPerPage: ITEMS_PER_PAGE,
    searchFields: ['username'],
    defaultSortField: 'username',
  });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setUsers(await getUsers());
    } catch {
      setError('No se pudieron cargar los usuarios.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget.id);
      toast({
        title: 'Usuario eliminado',
        description: `${deleteTarget.username} fue eliminado.`,
      });
      fetchUsers();
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el usuario.',
        variant: 'destructive',
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const columns = [
    { key: 'username', label: 'Usuario', sortable: true },
    {
      key: 'roles',
      label: 'Roles',
      render: (_: any, row: UserDto) => (
        <div className='flex flex-wrap gap-1'>
          {row.roles.length === 0 ? (
            <span className='text-muted-foreground text-sm'>Sin roles</span>
          ) : (
            row.roles.map((r) => (
              <EnhancedBadge key={r.id} variant='default'>
                {r.nombre}
              </EnhancedBadge>
            ))
          )}
        </div>
      ),
    },
    {
      key: 'fechaCreacion',
      label: 'Creado',
      render: (v: string) =>
        v ? new Date(v).toLocaleDateString('es-MX') : '—',
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_: any, row: UserDto) => (
        <div className='flex gap-2'>
          <Can permission='usuario:write'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setAssignTarget(row)}
              title='Asignar roles'
            >
              <Shield size={16} />
            </Button>
            <Link href={`/configuracion/usuarios/editar/${row.id}`}>
              <Button variant='ghost' size='icon' title='Editar'>
                <Edit size={16} />
              </Button>
            </Link>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setDeleteTarget(row)}
              title='Eliminar'
              className='text-destructive hover:text-destructive'
            >
              <Trash2 size={16} />
            </Button>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <RequirePermission permission='usuario:read'>
      <PageLayout
        title='Usuarios'
        isLoading={isLoading}
        error={error}
        onRefresh={fetchUsers}
        searchValue={searchTerm}
        onSearchChange={handleSearch}
        searchPlaceholder='Buscar usuario...'
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        actions={
          <Can permission='usuario:write'>
            <Link href='/configuracion/usuarios/registrar'>
              <Button>
                <UserPlus size={16} className='mr-2' />
                Nuevo usuario
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
            title: 'No hay usuarios',
            description: 'Creá el primer usuario del sistema.',
          }}
        />
      </PageLayout>

      {assignTarget && (
        <AssignRolesDialog
          user={assignTarget}
          onClose={() => setAssignTarget(null)}
          onSuccess={fetchUsers}
        />
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto eliminará permanentemente a{' '}
              <strong>{deleteTarget?.username}</strong>. Esta acción no se puede
              deshacer.
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
