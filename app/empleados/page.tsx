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
import { UserPlus, Edit, Eye, Fingerprint } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { EmployeeDetailsModal } from './components/employee-details-modal';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/app/components/shared/page-header';
import { SearchInput } from '@/app/components/shared/search-input';
import { LoadingState } from '@/app/components/shared/loading-state';
import { ErrorState } from '@/app/components/shared/error-state';
import { SortableHeader } from '@/app/components/shared/sortable-header';
import { PaginationWrapper } from '@/app/components/shared/pagination-wrapper';
import { useTableState } from '@/app/hooks/use-table-state';
import type { EmpleadoDto } from '@/app/lib/types/timeClockTypes';

interface EmployeeDisplayData {
  id: number;
  nombre: string;
  rfc: string;
  curp: string;
  departamento: string;
  estado: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const ITEMS_PER_PAGE = 10;

export default function EmpleadosPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [allEmployees, setAllEmployees] = useState<EmpleadoDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmpleadoDto | null>(
    null
  );

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
      'nombramiento',
      'departamentoNombre',
      'academiaNombre',
    ],
    defaultSortField: 'id',
  });

  const getFullName = useCallback(
    (emp: EmpleadoDto | null): string =>
      emp?.nombreCompleto || 'Nombre no disponible',
    []
  );

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<EmpleadoDto[]>(
        `${API_BASE_URL}/api/empleados`
      );
      setAllEmployees(response.data || []);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'No se pudo cargar la lista de empleados.';
      setError(`Error al cargar empleados: ${errorMsg}.`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const mapEmployeeToDisplay = useCallback(
    (emp: EmpleadoDto): EmployeeDisplayData => {
      const departamentoDisplay = emp.departamentoNombre || 'N/A';

      const estado = emp.estatusId === 1 ? 'Activo' : 'Inactivo';

      return {
        id: emp.id,
        nombre: getFullName(emp),
        rfc: emp.rfc ?? 'N/A',
        curp: emp.curp ?? 'N/A',
        departamento: departamentoDisplay,
        estado: estado,
      };
    },
    [getFullName]
  );

  const handleEdit = (employeeId: number) => {
    router.push(`/empleados/editar/${employeeId}`);
  };

  const handleViewDetails = (employee: EmpleadoDto) => {
    setSelectedEmployee(employee);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedEmployee(null);
  };

  return (
    <>
      <div className='p-6 md:p-8 pb-12'>
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
          placeholder='Buscar por ID, nombre, RFC, departamento...'
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
                      field='departamentoNombre'
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    >
                      Departamento
                    </SortableHeader>
                    <SortableHeader
                      field='estatusId'
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
                          <TableCell>{displayData.departamento}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                displayData.estado === 'Activo'
                                  ? 'default'
                                  : 'secondary'
                              }
                              className={
                                displayData.estado === 'Activo'
                                  ? 'bg-primary/10 text-primary border-primary/20'
                                  : 'bg-muted text-muted-foreground border-border'
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
                                className='text-muted-foreground hover:text-foreground hover:bg-muted'
                              >
                                <Eye className='h-4 w-4' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='icon'
                                onClick={() => handleEdit(employee.id)}
                                title='Editar Empleado'
                                className='text-primary hover:text-primary/80 hover:bg-primary/10'
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
                                  className='text-accent hover:text-accent/80 hover:bg-accent/10'
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
                      <TableCell colSpan={6} className='text-center h-24'>
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
      {selectedEmployee && (
        <EmployeeDetailsModal
          employee={selectedEmployee}
          isOpen={showDetailsModal}
          onClose={handleCloseDetailsModal}
        />
      )}
    </>
  );
}
