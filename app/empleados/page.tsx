'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserPlus, Edit, Eye, Fingerprint } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { EmployeeDetailsModal } from './components/employee-details-modal';
import { useToast } from '@/components/ui/use-toast';
import { PageLayout } from '@/app/components/shared/page-layout';
import { EnhancedTable } from '@/app/components/shared/enhanced-table';
import { EnhancedBadge } from '@/app/components/shared/enhanced-badge';
import { ActionButtons } from '@/app/components/shared/action-buttons';
import { useTableState } from '@/app/hooks/use-table-state';
import type { EmpleadoDto } from '@/app/lib/types/timeClockTypes';
import { EmployeeAvatar } from '@/app/components/shared/EmployeeAvatar';

interface EmployeeDisplayData {
  id: number;
  tarjeta: number | string;
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
      'tarjeta',
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
    defaultSortField: 'tarjeta',
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
        tarjeta: emp.tarjeta ?? 'N/A',
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

  // Definir las columnas de la tabla
  const columns = [
    {
      key: 'avatar',
      label: '',
      className: 'w-0',
      render: (value: any, row: EmpleadoDto) => (
        <EmployeeAvatar
          empleadoId={row.id}
          nombre={getFullName(row)}
          fotoUrl={(row as any).fotoUrl}
          tieneFoto={(row as any).tieneFoto}
          size={36}
        />
      ),
    },
    {
      key: 'tarjeta',
      label: 'No. Tarjeta',
      sortable: true,
      className: 'font-semibold text-foreground',
      render: (value: any) => (
        <span className='bg-muted px-3 py-1 rounded-full text-sm font-mono text-muted-foreground'>
          {value ?? 'N/A'}
        </span>
      ),
    },
    {
      key: 'nombreCompleto',
      label: 'Nombre Completo',
      sortable: true,
      className: 'font-medium text-foreground',
      render: (value: any, row: EmpleadoDto) => getFullName(row),
    },
    {
      key: 'rfc',
      label: 'RFC',
      sortable: true,
      className: 'text-muted-foreground font-mono text-sm',
      render: (value: any) => value ?? 'N/A',
    },
    {
      key: 'departamentoNombre',
      label: 'Departamento',
      sortable: true,
      className: 'text-muted-foreground',
      render: (value: any, row: EmpleadoDto) => (
        <EnhancedBadge variant='info' size='sm'>
          {value || 'N/A'}
        </EnhancedBadge>
      ),
    },
    {
      key: 'estatusId',
      label: 'Estado',
      sortable: true,
      render: (value: any) => (
        <EnhancedBadge
          variant={value === 1 ? 'success' : 'secondary'}
          size='md'
        >
          {value === 1 ? 'Activo' : 'Inactivo'}
        </EnhancedBadge>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'text-right',
      render: (value: any, row: EmpleadoDto) => (
        <ActionButtons
          buttons={[
            {
              icon: <Eye className='h-4 w-4' />,
              onClick: () => handleViewDetails(row),
              variant: 'view',
              title: 'Ver Detalles',
            },
            {
              icon: <Edit className='h-4 w-4' />,
              onClick: () => handleEdit(row.id),
              variant: 'edit',
              title: 'Editar Empleado',
            },
            {
              icon: <Fingerprint className='h-4 w-4' />,
              onClick: () =>
                router.push(
                  `/empleados/asignar-huella?id=${row.id}&nombre=${encodeURIComponent(getFullName(row))}`
                ),
              variant: 'custom',
              title: 'Asignar Huella',
              className: 'action-button-fingerprint',
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <PageLayout
        title='Gestión de Empleados'
        isLoading={isLoading}
        error={error}
        onRefresh={fetchEmployees}
        searchValue={searchTerm}
        onSearchChange={handleSearch}
        searchPlaceholder='Buscar por No. Tarjeta, nombre, RFC, departamento...'
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        actions={
          <Link href='/empleados/registrar'>
            <Button className='h-10 px-6 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200'>
              <UserPlus className='mr-2 h-4 w-4' />
              Registrar
            </Button>
          </Link>
        }
      >
        <EnhancedTable
          columns={columns}
          data={paginatedData}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          emptyState={{
            icon: <UserPlus className='h-8 w-8' />,
            title: 'No se encontraron empleados',
            description:
              'Intenta ajustar los filtros de búsqueda o registra un nuevo empleado',
          }}
          className='mb-6'
        />
      </PageLayout>

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
