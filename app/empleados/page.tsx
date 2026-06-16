'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useDebounce } from '@/app/hooks/use-debounce';
import type { EmpleadoDto } from '@/app/lib/types/timeClockTypes';
import { EmployeeAvatar } from '@/app/components/shared/EmployeeAvatar';
import { DetailsDialog } from '@/app/horarios/asignados/components/details-dialog';
import { RequirePermission } from '@/app/components/auth/require-permission';
import { Can } from '@/app/components/auth/can';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const PAGE_SIZE = 20;

interface EmpleadosPaginadosResponse {
  content: EmpleadoDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export default function EmpleadosPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [empleados, setEmpleados] = useState<EmpleadoDto[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 350);

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

  const fetchEmployees = useCallback(async (page: number, search: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        size: String(PAGE_SIZE),
      });
      if (search.trim()) params.set('search', search.trim());

      const response = await apiClient.get<EmpleadosPaginadosResponse>(
        `/api/empleados?${params}`
      );
      const data = response.data;
      setEmpleados(data.content || []);
      setTotalElements(data.totalElements ?? 0);
      setTotalPages(data.totalPages ?? 0);
      setCurrentPage(data.number ?? page);
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

  // Reset to page 0 when search changes
  useEffect(() => {
    setCurrentPage(0);
    fetchEmployees(0, debouncedSearch);
  }, [debouncedSearch, fetchEmployees]);

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      fetchEmployees(page, debouncedSearch);
    },
    [debouncedSearch, fetchEmployees]
  );

  const getFullName = useCallback(
    (emp: EmpleadoDto | null): string =>
      emp?.nombreCompleto || 'Nombre no disponible',
    []
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
          `/api/horarios-asignados/empleado/${employee.id}`
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

  const columns = useMemo(
    () => [
      {
        key: 'avatar',
        label: '',
        className: 'w-0',
        render: (_value: any, row: EmpleadoDto) => (
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
        render: (_value: any, row: EmpleadoDto) => getFullName(row),
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
        render: (value: any) => (
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
        render: (_value: any, row: EmpleadoDto) => (
          <div className='flex justify-end items-center gap-2'>
            <ActionButtons
              buttons={[
                {
                  icon: <Eye className='h-4 w-4' />,
                  onClick: () => handleViewDetails(row),
                  variant: 'view',
                  title: 'Ver Detalles',
                },
              ]}
            />
            <Can permission='empleado:write'>
              <ActionButtons
                buttons={[
                  {
                    icon: <Edit className='h-4 w-4' />,
                    onClick: () => handleEdit(row.id),
                    variant: 'edit',
                    title: 'Editar Empleado',
                  },
                ]}
              />
            </Can>
            <Can permission='empleado:manage-fingerprints'>
              <ActionButtons
                buttons={[
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
            </Can>
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
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getFullName, isResolvingSchedule]
  );

  return (
    <RequirePermission permission='empleado:read'>
      <>
      <PageLayout
        title='Gestión de Empleados'
        isLoading={isLoading}
        error={error}
        onRefresh={() => fetchEmployees(currentPage, debouncedSearch)}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder='Buscar por No. Tarjeta, nombre, RFC, departamento...'
        currentPage={currentPage + 1}
        totalPages={totalPages}
        onPageChange={(p) => handlePageChange(p - 1)}
        actions={
          <Can permission='empleado:write'>
            <Link href='/empleados/registrar'>
              <Button className='h-10 px-6 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200'>
                <UserPlus className='mr-2 h-4 w-4' />
                Registrar
              </Button>
            </Link>
          </Can>
        }
      >
        <EnhancedTable
          columns={columns}
          data={empleados}
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

      <DetailsDialog
        isOpen={isScheduleDetailsOpen}
        onClose={() => {
          setScheduleDetailsOpen(false);
          setSelectedScheduleItem(null);
        }}
        item={selectedScheduleItem}
      />

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
    </RequirePermission>
  );
}
