'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Shield,
  Key,
  Megaphone,
  UserPlus,
  Edit,
  Trash2,
  PowerOff,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { EnhancedCard } from '@/app/components/shared/enhanced-card';
import { EnhancedTable } from '@/app/components/shared/enhanced-table';
import { EnhancedBadge } from '@/app/components/shared/enhanced-badge';
import { useTableState } from '@/app/hooks/use-table-state';
import { Can } from '@/app/components/auth/can';
import { getUsers, deleteUser } from '@/lib/api/users.api';
import { UserDto } from '@/lib/types/userTypes';
import { getRoles, deleteRole, deactivateRole } from '@/lib/api/roles.api';
import { RoleDto } from '@/lib/types/roleTypes';
import { getPermissionsGrouped } from '@/lib/api/permissions.api';
import { PermissionsGrouped } from '@/lib/types/permissionTypes';
import PublicidadManager from '@/components/configuracion/PublicidadManager';
import { AssignRolesDialog } from './usuarios/components/assign-roles-dialog';
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

type ConfigSection = 'usuarios' | 'roles' | 'permisos' | 'publicidad';

const sectionCards = [
  {
    id: 'usuarios' as ConfigSection,
    permission: 'usuario:read',
    icon: Users,
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
    title: 'Usuarios',
    description: 'Crear, editar y asignar roles a usuarios del sistema',
  },
  {
    id: 'roles' as ConfigSection,
    permission: 'rol:read',
    icon: Shield,
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    title: 'Roles',
    description: 'Crear y configurar roles con permisos granulares',
  },
  {
    id: 'permisos' as ConfigSection,
    permission: 'rol:read',
    icon: Key,
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
    title: 'Permisos',
    description: 'Ver el catálogo completo de permisos del sistema',
  },
  {
    id: 'publicidad' as ConfigSection,
    permission: 'publicidad:read',
    icon: Megaphone,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    title: 'Publicidad',
    description: 'Configuración de anuncios en el carrusel',
  },
];

// ─── Usuarios Section ───────────────────────────────────────
function UsuariosSection() {
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
    itemsPerPage: 10,
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
    <>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-xl font-bold text-foreground'>
          Gestión de Usuarios
        </h2>
        <Can permission='usuario:write'>
          <Link href='/configuracion/usuarios/registrar'>
            <Button>
              <UserPlus size={16} className='mr-2' />
              Nuevo usuario
            </Button>
          </Link>
        </Can>
      </div>

      {error && <p className='text-destructive mb-4'>{error}</p>}

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
    </>
  );
}

// ─── Roles Section ──────────────────────────────────────────
function RolesSection() {
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
    itemsPerPage: 10,
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
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo desactivar el rol.',
        variant: 'destructive',
      });
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
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el rol.',
        variant: 'destructive',
      });
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
    <>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-xl font-bold text-foreground'>Gestión de Roles</h2>
        <Can permission='rol:write'>
          <Link href='/configuracion/roles/registrar'>
            <Button>
              <Plus size={16} className='mr-2' />
              Nuevo rol
            </Button>
          </Link>
        </Can>
      </div>

      {error && <p className='text-destructive mb-4'>{error}</p>}

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
    </>
  );
}

// ─── Permisos Section ───────────────────────────────────────
function PermisosSection() {
  const [grouped, setGrouped] = useState<PermissionsGrouped>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPermissionsGrouped()
      .then(setGrouped)
      .catch(() => setError('No se pudieron cargar los permisos.'))
      .finally(() => setIsLoading(false));
  }, []);

  const total = Object.values(grouped).flat().length;

  return (
    <div className='space-y-6'>
      <div className='space-y-1'>
        <h2 className='text-xl font-bold text-foreground'>
          Permisos del sistema
        </h2>
        <p className='text-muted-foreground text-sm'>
          Catálogo de {total} permisos disponibles, organizados por módulo.
        </p>
      </div>

      {isLoading && (
        <p className='text-muted-foreground'>Cargando permisos...</p>
      )}
      {error && <p className='text-destructive'>{error}</p>}

      {Object.entries(grouped).map(([modulo, perms]) => (
        <EnhancedCard key={modulo} variant='bordered' padding='md'>
          <div className='flex items-center gap-3 mb-4'>
            <h3 className='text-lg font-semibold capitalize'>{modulo}</h3>
            <EnhancedBadge variant='default'>{perms.length}</EnhancedBadge>
          </div>

          <div className='space-y-2'>
            {perms.map((p) => (
              <div
                key={p.id}
                className='flex items-start gap-3 p-2 rounded hover:bg-muted/50'
              >
                <code className='text-sm font-mono bg-muted px-2 py-0.5 rounded text-primary whitespace-nowrap'>
                  {p.nombre}
                </code>
                <p className='text-sm text-muted-foreground'>{p.descripcion}</p>
              </div>
            ))}
          </div>
        </EnhancedCard>
      ))}
    </div>
  );
}

// ─── Publicidad Section ─────────────────────────────────────
function PublicidadSection() {
  return (
    <div>
      <div className='flex items-center gap-2 mb-6'>
        <Megaphone className='h-6 w-6 text-primary' />
        <h2 className='text-xl font-bold text-foreground'>
          Gestión de Publicidad
        </h2>
      </div>
      <PublicidadManager />
    </div>
  );
}

// ─── Content Router ─────────────────────────────────────────
function SectionContent({ section }: { section: ConfigSection }) {
  switch (section) {
    case 'usuarios':
      return <UsuariosSection />;
    case 'roles':
      return <RolesSection />;
    case 'permisos':
      return <PermisosSection />;
    case 'publicidad':
      return <PublicidadSection />;
    default:
      return null;
  }
}

// ─── Main Page ──────────────────────────────────────────────
function ConfiguracionContent() {
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get('section') as ConfigSection | null;

  const [activeSection, setActiveSection] = useState<ConfigSection>(
    sectionParam &&
      ['usuarios', 'roles', 'permisos', 'publicidad'].includes(sectionParam)
      ? sectionParam
      : 'usuarios'
  );

  // Sincronizar cuando cambia el query param (navegación desde sidebar)
  useEffect(() => {
    if (
      sectionParam &&
      ['usuarios', 'roles', 'permisos', 'publicidad'].includes(sectionParam)
    ) {
      setActiveSection(sectionParam);
    }
  }, [sectionParam]);

  return (
    <div className='min-h-screen bg-background'>
      <div className='p-6 md:p-8'>
        <div className='max-w-7xl mx-auto space-y-6'>
          {/* Header */}
          <EnhancedCard variant='elevated' padding='lg'>
            <div className='space-y-1'>
              <h1 className='text-2xl md:text-3xl font-bold text-foreground tracking-tight'>
                Configuración
              </h1>
              <div className='h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full'></div>
              <p className='text-muted-foreground pt-2'>
                Administre la configuración general del sistema.
              </p>
            </div>
          </EnhancedCard>

          {/* Section Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {sectionCards.map((card) => (
              <Can key={card.id} permission={card.permission} fallback={null}>
                <EnhancedCard
                  variant='bordered'
                  padding='md'
                  hover
                  role='button'
                  tabIndex={0}
                  onClick={() => setActiveSection(card.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveSection(card.id);
                    }
                  }}
                  className={`cursor-pointer transition-all duration-200 ${
                    activeSection === card.id
                      ? 'ring-2 ring-primary/60 border-primary/60 bg-primary/5'
                      : ''
                  }`}
                >
                  <div className='flex items-center space-x-3'>
                    <div className={`p-2 rounded-lg ${card.iconBg}`}>
                      <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                    <div>
                      <h3 className='font-semibold text-foreground'>
                        {card.title}
                      </h3>
                      <p className='text-sm text-muted-foreground'>
                        {card.description}
                      </p>
                    </div>
                  </div>
                </EnhancedCard>
              </Can>
            ))}
          </div>

          {/* Active Section Content */}
          <div className='animate-in fade-in slide-in-from-bottom-4 duration-500'>
            <EnhancedCard variant='default' padding='lg'>
              <SectionContent section={activeSection} />
            </EnhancedCard>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfiguracionPage() {
  return (
    <Suspense fallback={null}>
      <ConfiguracionContent />
    </Suspense>
  );
}
