'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserPlus, Edit, Eye, Fingerprint, Calendar } from 'lucide-react';
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
import { DetailsDialog } from '@/app/horarios/asignados/components/details-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

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
  const [isScheduleDetailsOpen, setScheduleDetailsOpen] = useState(false);
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<any | null>(
    null
  );
  const [noScheduleOpen, setNoScheduleOpen] = useState(false);
  const [noScheduleRow, setNoScheduleRow] = useState<EmpleadoDto | null>(null);
  const [isResolvingSchedule, setIsResolvingSchedule] = useState(false);

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

  const resolveEmployeeActiveSchedule = useCallback(
    async (employee: EmpleadoDto) => {
      try {
        const response = await apiClient.get(
          `${API_BASE_URL}/api/horarios-asignados/empleado/${employee.id}`
        );
        const asignaciones: any[] = response.data || [];
        if (!Array.isArray(asignaciones) || asignaciones.length === 0) {
          return null;
        }
        const activa =
          asignaciones.find((a: any) => a?.activo === true) || null;
        if (!activa) return null;
        if (!activa.empleadoNombre) {
          activa.empleadoNombre = getFullName(employee);
        }
        if (activa.numTarjetaTrabajador == null) {
          (activa as any).numTarjetaTrabajador =
            (employee as any).tarjeta ?? null;
        }
        return activa;
      } catch (_) {
        return null;
      }
    },
    [getFullName]
  );

  const handleViewSchedule = async (employee: EmpleadoDto) => {
    setIsResolvingSchedule(true);
    const item = await resolveEmployeeActiveSchedule(employee);
    setIsResolvingSchedule(false);
    if (item) {
      setSelectedScheduleItem(item);
      setScheduleDetailsOpen(true);
    } else {
      setNoScheduleRow(employee);
      setNoScheduleOpen(true);
    }
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
        <div className='flex justify-end items-center gap-2'>
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
          <span className='mx-1 text-muted-foreground'>|</span>
          <Button
            variant='ghost'
            size='icon'
            title='Ver Horario'
            aria-label='Ver Horario'
            onClick={() => handleViewSchedule(row)}
            disabled={isResolvingSchedule}
          >
            <Calendar className='h-4 w-4' />
          </Button>
        </div>
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

      {/* Detalles del horario */}
      <DetailsDialog
        isOpen={isScheduleDetailsOpen}
        onClose={() => {
          setScheduleDetailsOpen(false);
          setSelectedScheduleItem(null);
        }}
        item={selectedScheduleItem}
      />

      {/* Diálogo Sin Horario Asignado */}
      <Dialog open={noScheduleOpen} onOpenChange={setNoScheduleOpen}>
        <DialogContent className='sm:max-w-[500px] bg-card border-border text-card-foreground'>
          <DialogHeader className='text-center space-y-2'>
            <div className='mx-auto w-14 h-14 bg-muted rounded-full flex items-center justify-center border border-border'>
              <Calendar className='w-7 h-7 text-muted-foreground' />
            </div>
            <DialogTitle className='text-xl font-bold text-foreground'>
              Sin Horario Asignado
            </DialogTitle>
            <DialogDescription className='text-muted-foreground'>
              {noScheduleRow
                ? `${getFullName(noScheduleRow)} no tiene un horario activo asignado.`
                : 'No hay un horario activo asignado para este empleado.'}
            </DialogDescription>
          </DialogHeader>
          <div className='pt-2 grid grid-cols-1 gap-3'>
            {noScheduleRow && (
              <Button
                onClick={() => {
                  if (!noScheduleRow) return;
                  const url = `/horarios/asignados/registrar?id=${noScheduleRow.id}&nombre=${encodeURIComponent(
                    getFullName(noScheduleRow)
                  )}`;
                  window.location.href = url;
                }}
                className='w-full justify-center'
              >
                Asignar Horario
              </Button>
            )}
            <Button
              variant='outline'
              onClick={() => setNoScheduleOpen(false)}
              className='w-full'
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
