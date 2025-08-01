'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  UserPlus,
  Edit,
  Eye,
  Fingerprint,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
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
import { EmployeeDetailsModal } from './components/employee-details-modal';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Badge } from '@/components/ui/badge';

// Shared components
import { PageHeader } from '@/app/components/shared/page-header';
import { SearchInput } from '@/app/components/shared/search-input';
import { LoadingState } from '@/app/components/shared/loading-state';
import { ErrorState } from '@/app/components/shared/error-state';
import { SortableHeader } from '@/app/components/shared/sortable-header';
import { PaginationWrapper } from '@/app/components/shared/pagination-wrapper';
import { useTableState } from '@/app/hooks/use-table-state';

// --- Tipos ---
interface EmpleadoBackend {
  id: number;
  rfc: string | null;
  curp: string | null;
  primerNombre: string | null;
  segundoNombre: string | null;
  primerApellido: string | null;
  segundoApellido: string | null;
  departamentoAcademicoId: number | null;
  departamentoAdministrativoId: number | null;
  tipoNombramientoPrincipal: string | null;
  tipoNombramientoSecundario: string | null;
  estatusId: number | null;
  estatusNombre: string | null;
  correoInstitucional: string | null;
  uuid: string | null;
}

interface EmployeeDisplayData {
  id: number;
  numeroTarjeta: string;
  nombre: string;
  rfc: string;
  curp: string;
  area: string;
  estado: string;
}

// --- Constantes ---
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const ITEMS_PER_PAGE = 10;

// --- Componente ---
export default function EmpleadosPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Data state
  const [allEmployees, setAllEmployees] = useState<EmpleadoBackend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] =
    useState<EmpleadoBackend | null>(null);
  const [isDeletingEmployee, setIsDeletingEmployee] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmpleadoBackend | null>(null);

  // Table state using custom hook
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
    data: allEmployees,
    itemsPerPage: ITEMS_PER_PAGE,
    searchFields: [
      'id',
      'primerNombre',
      'segundoNombre',
      'primerApellido',
      'segundoApellido',
      'rfc',
      'curp',
      'correoInstitucional',
      'estatusNombre',
    ],
    defaultSortField: 'id',
  });

  const getFullName = useCallback((emp: EmpleadoBackend | null): string => {
    if (!emp) return 'N/A';
    const nameParts = [
      emp.primerNombre,
      emp.segundoNombre,
      emp.primerApellido,
      emp.segundoApellido,
    ].filter(Boolean);
    return nameParts.join(' ') || 'Nombre no disponible';
  }, []);

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<EmpleadoBackend[]>(
        `${API_BASE_URL}/api/empleados`
      );
      setAllEmployees(response.data || []);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'No se pudo cargar la lista de empleados.';
      setError(
        `Error al cargar empleados: ${errorMsg}. Verifique la conexión con la API.`
      );
      setAllEmployees([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const mapEmployeeToDisplay = useCallback(
    (emp: EmpleadoBackend): EmployeeDisplayData => {
      let area = 'N/A';
      if (emp.departamentoAcademicoId) area = `Académico`;
      else if (emp.departamentoAdministrativoId) area = `Admin.`;

      const estadoNombre = emp.estatusNombre ?? 'Desconocido';

      return {
        id: emp.id,
        numeroTarjeta: `ID-${emp.id}`,
        nombre: getFullName(emp),
        rfc: emp.rfc ?? 'N/A',
        curp: emp.curp ?? 'N/A',
        area: area,
        estado: estadoNombre,
      };
    },
    [getFullName]
  );

  const handleEdit = (employeeId: number) => {
    router.push(`/empleados/editar/${employeeId}`);
  };

  const confirmDelete = (employee: EmpleadoBackend) => {
    setEmployeeToDelete(employee);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!employeeToDelete) return;
    setIsDeletingEmployee(true);
    try {
      await apiClient.delete(
        `${API_BASE_URL}/api/empleados/${employeeToDelete.id}`
      );
      toast({
        title: 'Empleado Eliminado',
        description: `El empleado ${getFullName(
          employeeToDelete
        )} ha sido eliminado.`,
      });
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: 'Error al Eliminar',
        description:
          'No se pudo eliminar el empleado. Es posible que tenga registros de asistencia asociados.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingEmployee(false);
      setShowDeleteConfirm(false);
      setEmployeeToDelete(null);
    }
  };

  const handleViewDetails = (employee: EmpleadoBackend) => {
    setSelectedEmployee(employee);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedEmployee(null);
  };

  const handleFingerprintDeleted = () => {
    // El modal ya muestra una notificación, así que no es necesario hacer nada aquí.
  };

  return (
    <>
      <div className='p-6 md:p-8'>
        <PageHeader
          title='Gestión de Empleados'
          isLoading={isLoading}
          onRefresh={fetchEmployees}
          actions={
            <Link href='/empleados/registrar'>
              <Button className='h-9'>
                <UserPlus className='mr-2 h-4 w-4' />
                Registrar
              </Button>
            </Link>
          }
        />

        <SearchInput
          value={searchTerm}
          onChange={handleSearch}
          placeholder='Buscar por ID, nombre, RFC, CURP...'
        />

        {isLoading && <LoadingState message='Cargando empleados...' />}

        {error && <ErrorState message={error} />}

        {!isLoading && !error && (
          <>
            <div className='overflow-x-auto rounded-lg border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader
                      field='id'
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    >
                      ID
                    </SortableHeader>
                    <SortableHeader
                      field='primerNombre'
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    >
                      Nombre Completo
                    </SortableHeader>
                    <SortableHeader
                      field='rfc'
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    >
                      RFC
                    </SortableHeader>
                    <SortableHeader
                      field='estatusNombre'
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    >
                      Estado
                    </SortableHeader>
                    <TableHead className='text-right'>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((employee) => {
                      const displayData = mapEmployeeToDisplay(employee);
                      return (
                        <TableRow key={employee.id}>
                          <TableCell className='font-medium'>
                            {displayData.id}
                          </TableCell>
                          <TableCell>{displayData.nombre}</TableCell>
                          <TableCell>{displayData.rfc}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                displayData.estado.toLowerCase() === 'activo'
                                  ? 'default'
                                  : 'secondary'
                              }
                              className={
                                displayData.estado.toLowerCase() === 'activo'
                                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                  : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                              }
                            >
                              {displayData.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className='text-right'>
                            <div className='flex justify-end items-center gap-1'>
                              <Button
                                variant='ghost'
                                size='icon'
                                onClick={() => handleViewDetails(employee)}
                                title='Ver Detalles'
                                className='text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
                              >
                                <Eye className='h-4 w-4' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='icon'
                                onClick={() => handleEdit(employee.id)}
                                title='Editar Empleado'
                                className='text-green-400 hover:text-green-300 hover:bg-green-500/10'
                              >
                                <Edit className='h-4 w-4' />
                              </Button>
                              <Link
                                href={`/empleados/asignar-huella?id=${employee.id}&nombre=${encodeURIComponent(displayData.nombre)}`}
                              >
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  title='Asignar Huella'
                                  className='text-purple-400 hover:text-purple-300 hover:bg-purple-500/10'
                                >
                                  <Fingerprint className='h-4 w-4' />
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center h-24'>
                        No se encontraron empleados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <PaginationWrapper
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      <AlertDialog onOpenChange={setShowDeleteConfirm} open={showDeleteConfirm}>
        <AlertDialogContent className='bg-zinc-900 border-zinc-800 text-white'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <AlertCircle className='h-6 w-6 text-red-500' />
              Confirmar Eliminación
            </AlertDialogTitle>
            <AlertDialogDescription className='text-zinc-400 pt-2'>
              ¿Estás seguro de que quieres eliminar al empleado{' '}
              <strong className='text-red-400'>
                {getFullName(employeeToDelete)}
              </strong>
              ?
              <br />
              Esta acción es permanente y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeletingEmployee}
              className='border-zinc-700 hover:bg-zinc-800'
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeletingEmployee}
              className='bg-red-600 hover:bg-red-700 text-white'
            >
              {isDeletingEmployee ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Eliminando...
                </>
              ) : (
                'Sí, eliminar empleado'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedEmployee && (
        <EmployeeDetailsModal
          employee={selectedEmployee}
          isOpen={showDetailsModal}
          onClose={handleCloseDetailsModal}
          onFingerprintDeleted={handleFingerprintDeleted}
        />
      )}
      <Toaster />
    </>
  );
}
