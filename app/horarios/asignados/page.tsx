'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { HorarioAsignadoDto } from './types';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnhancedBadge } from '@/app/components/shared/enhanced-badge';
import { EnhancedCard } from '@/app/components/shared/enhanced-card';
import { Eye, Edit, Trash2, UserPlus } from 'lucide-react';
import { DetailsDialog } from './components/details-dialog';
import { DeleteConfirmationDialog } from './components/delete-confirmation-dialog';
import { useToast } from '@/components/ui/use-toast';
import UnifiedEditModal from './components/unified-edit-modal';

// Shared components
import { PageHeader } from '@/app/components/shared/page-header';
import { SearchInput } from '@/app/components/shared/search-input';
import { LoadingState } from '@/app/components/shared/loading-state';
import { ErrorState } from '@/app/components/shared/error-state';
import { SortableHeader } from '@/app/components/shared/sortable-header';
import { PaginationWrapper } from '@/app/components/shared/pagination-wrapper';
import { useTableState } from '@/app/hooks/use-table-state';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const ITEMS_PER_PAGE = 10;

export default function HorariosAsignadosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Data state
  const [allHorarios, setAllHorarios] = useState<HorarioAsignadoDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedItem, setSelectedItem] = useState<HorarioAsignadoDto | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

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
    data: allHorarios,
    itemsPerPage: ITEMS_PER_PAGE,
    searchFields: [
      'empleadoNombre',
      'horarioNombre',
      'tipoHorarioNombre',
      'numTarjetaTrabajador',
    ],
    defaultSortField: 'numTarjetaTrabajador',
  });

  const fetchHorariosAsignados = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<HorarioAsignadoDto[]>(
        `${API_BASE_URL}/api/horarios-asignados`
      );
      const baseList = response.data || [];
      // Enriquecer con número de tarjeta del trabajador
      try {
        const uniqueEmpleadoIds = Array.from(
          new Set(baseList.map((i) => i.empleadoId))
        );
        const cardEntries = await Promise.all(
          uniqueEmpleadoIds.map(async (empId) => {
            try {
              const empResp = await apiClient.get(
                `${API_BASE_URL}/api/empleados/${empId}`
              );
              const tarjeta = empResp.data?.tarjeta ?? null;
              return [empId, tarjeta] as const;
            } catch (_) {
              return [empId, null] as const;
            }
          })
        );
        const cardMap = new Map<number, string | number | null>(cardEntries);
        const enriched = baseList.map((item) => ({
          ...item,
          numTarjetaTrabajador: cardMap.get(item.empleadoId) ?? null,
        }));
        setAllHorarios(enriched);
      } catch (e) {
        // Si falla el enriquecimiento, mostrar la lista base
        setAllHorarios(baseList);
      }
    } catch (err: any) {
      console.error('Error fetching horarios asignados:', err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'No se pudo cargar la lista de horarios asignados.';
      setError(
        `Error al cargar horarios asignados: ${errorMsg}. Verifique la conexión con la API.`
      );
      setAllHorarios([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHorariosAsignados();
  }, [fetchHorariosAsignados]);

  // Handle highlight parameter to auto-open details modal
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId && allHorarios.length > 0 && !isLoading) {
      const targetItem = allHorarios.find(
        (item) => item.id.toString() === highlightId
      );
      if (targetItem) {
        handleViewDetails(targetItem);
        // Clean up the URL parameter after opening the modal
        const url = new URL(window.location.href);
        url.searchParams.delete('highlight');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams, allHorarios, isLoading]);

  const handleViewDetails = (item: HorarioAsignadoDto) => {
    setSelectedItem(item);
    setIsDetailsOpen(true);
  };

  const closeDetailsDialog = () => {
    setSelectedItem(null);
    setIsDetailsOpen(false);
  };

  const openDeleteDialog = (item: HorarioAsignadoDto) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(
        `${API_BASE_URL}/api/horarios-asignados/${selectedItem.id}`
      );

      // Refetch the data for the current page
      fetchHorariosAsignados();
      setIsDeleteDialogOpen(false);

      toast({
        title: 'Éxito',
        description: 'El horario ha sido desasignado correctamente.',
      });
    } catch (err: any) {
      console.error('Error deleting horario asignado:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo desasignar el horario. Inténtelo de nuevo.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (id: number) => {
    setEditId(id);
    setIsEditOpen(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      {/* Contenedor principal con mejor contraste y separación */}
      <div className='min-h-screen bg-background'>
        <div className='p-6 md:p-8'>
          {/* Header con card elevado */}
          <EnhancedCard variant='elevated' padding='lg' className='mb-6'>
            <PageHeader
              title='Horarios Asignados'
              isLoading={isLoading}
              onRefresh={fetchHorariosAsignados}
              actions={
                <Link href='/horarios/asignados/registrar'>
                  <Button className='h-10 px-6 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200'>
                    <UserPlus className='mr-2 h-4 w-4' />
                    Registrar
                  </Button>
                </Link>
              }
            />
          </EnhancedCard>

          {/* Barra de búsqueda con card */}
          <EnhancedCard variant='default' padding='md' className='mb-6'>
            <SearchInput
              value={searchTerm}
              onChange={handleSearch}
              placeholder='Buscar por empleado, horario, tipo...'
              className='mb-0'
            />
          </EnhancedCard>

          {isLoading && (
            <EnhancedCard variant='elevated' padding='xl'>
              <LoadingState message='Cargando horarios asignados...' />
            </EnhancedCard>
          )}

          {error && (
            <EnhancedCard
              variant='elevated'
              padding='lg'
              className='border-red-200/60'
            >
              <ErrorState message={error} />
            </EnhancedCard>
          )}

          {!isLoading && !error && (
            <>
              {/* Tabla con mejor contraste y elevación */}
              <div className='enhanced-table-container mb-6'>
                <div className='overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow className='enhanced-table-header hover:bg-muted/60'>
                        <SortableHeader
                          field='numTarjetaTrabajador'
                          sortField={sortField}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                        >
                          Tarjeta
                        </SortableHeader>
                        <SortableHeader
                          field='empleadoNombre'
                          sortField={sortField}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                        >
                          Empleado
                        </SortableHeader>
                        <SortableHeader
                          field='horarioNombre'
                          sortField={sortField}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                        >
                          Horario
                        </SortableHeader>
                        <SortableHeader
                          field='tipoHorarioNombre'
                          sortField={sortField}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                        >
                          Tipo Horario
                        </SortableHeader>
                        <SortableHeader
                          field='fechaInicio'
                          sortField={sortField}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                        >
                          Fecha Inicio
                        </SortableHeader>
                        <SortableHeader
                          field='fechaFin'
                          sortField={sortField}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                        >
                          Fecha Fin
                        </SortableHeader>
                        <TableHead className='font-semibold text-foreground'>
                          Estado
                        </TableHead>
                        <TableHead className='text-right font-semibold text-foreground'>
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.length > 0 ? (
                        paginatedData.map((item, index) => (
                          <TableRow
                            key={item.id}
                            className='enhanced-table-row'
                          >
                            <TableCell className='font-semibold text-foreground py-4'>
                              <span className='bg-muted px-3 py-1 rounded-full text-sm font-mono text-muted-foreground'>
                                {item.numTarjetaTrabajador ?? 'N/A'}
                              </span>
                            </TableCell>
                            <TableCell className='font-medium text-foreground py-4'>
                              {item.empleadoNombre}
                            </TableCell>
                            <TableCell className='text-muted-foreground py-4'>
                              {item.horarioNombre}
                            </TableCell>
                            <TableCell className='text-muted-foreground py-4'>
                              <EnhancedBadge variant='info' size='sm'>
                                {item.tipoHorarioNombre}
                              </EnhancedBadge>
                            </TableCell>
                            <TableCell className='text-muted-foreground py-4'>
                              {formatDate(item.fechaInicio)}
                            </TableCell>
                            <TableCell className='text-muted-foreground py-4'>
                              {formatDate(item.fechaFin)}
                            </TableCell>
                            <TableCell className='py-4'>
                              <EnhancedBadge
                                variant={item.activo ? 'success' : 'secondary'}
                                size='md'
                              >
                                {item.activo ? 'Activo' : 'Inactivo'}
                              </EnhancedBadge>
                            </TableCell>
                            <TableCell className='text-right py-4'>
                              <div className='flex justify-end items-center gap-2'>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  onClick={() => handleViewDetails(item)}
                                  title='Ver Detalles'
                                  className='action-button-view'
                                >
                                  <Eye className='h-4 w-4' />
                                </Button>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  onClick={() => handleEdit(item.id)}
                                  title='Editar Horario'
                                  className='action-button-edit'
                                >
                                  <Edit className='h-4 w-4' />
                                </Button>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  onClick={() => openDeleteDialog(item)}
                                  title='Desasignar Horario'
                                  className='action-button-delete'
                                >
                                  <Trash2 className='h-4 w-4' />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className='text-center h-32 text-muted-foreground'
                          >
                            <div className='flex flex-col items-center justify-center space-y-2'>
                              <div className='text-muted-foreground/60 text-lg'>
                                📋
                              </div>
                              <p className='font-medium text-foreground'>
                                No se encontraron horarios asignados
                              </p>
                              <p className='text-sm text-muted-foreground'>
                                Intenta ajustar los filtros de búsqueda
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Paginación con card */}
              <EnhancedCard variant='default' padding='md'>
                <PaginationWrapper
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </EnhancedCard>
            </>
          )}
        </div>
      </div>

      <DetailsDialog
        isOpen={isDetailsOpen}
        onClose={closeDetailsDialog}
        item={selectedItem}
      />

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      <UnifiedEditModal
        isOpen={isEditOpen}
        assignmentId={editId}
        onClose={() => setIsEditOpen(false)}
        onSaved={() => {
          fetchHorariosAsignados();
        }}
      />
    </>
  );
}
