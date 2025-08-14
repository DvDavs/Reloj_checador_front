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
import { Eye, Edit, Trash2, UserPlus } from 'lucide-react';
import { DetailsDialog } from './components/details-dialog';
import { DeleteConfirmationDialog } from './components/delete-confirmation-dialog';
import { useToast } from '@/components/ui/use-toast';

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
      'id',
    ],
    defaultSortField: 'id',
  });

  const fetchHorariosAsignados = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<HorarioAsignadoDto[]>(
        `${API_BASE_URL}/api/horarios-asignados`
      );
      setAllHorarios(response.data || []);
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
    router.push(`/horarios/asignados/editar/${id}`);
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
      <div className='p-6 md:p-8'>
        <PageHeader
          title='Horarios Asignados'
          isLoading={isLoading}
          onRefresh={fetchHorariosAsignados}
          actions={
            <Link href='/horarios/asignados/registrar'>
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
          placeholder='Buscar por empleado, horario, tipo...'
        />

        {isLoading && <LoadingState message='Cargando horarios asignados...' />}

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
                    <TableHead>Estado</TableHead>
                    <TableHead className='text-right'>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className='font-medium'>{item.id}</TableCell>
                        <TableCell>{item.empleadoNombre}</TableCell>
                        <TableCell>{item.horarioNombre}</TableCell>
                        <TableCell>{item.tipoHorarioNombre}</TableCell>
                        <TableCell>{formatDate(item.fechaInicio)}</TableCell>
                        <TableCell>{formatDate(item.fechaFin)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={item.activo ? 'default' : 'secondary'}
                            className={
                              item.activo
                                ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                                : 'bg-muted text-muted-foreground border-border'
                            }
                          >
                            {item.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex justify-end items-center gap-1'>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => handleViewDetails(item)}
                              title='Ver Detalles'
                              className='text-primary hover:text-primary/80 hover:bg-primary/10'
                            >
                              <Eye className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => handleEdit(item.id)}
                              title='Editar Horario'
                              className='text-accent hover:text-accent/80 hover:bg-accent/10'
                            >
                              <Edit className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => openDeleteDialog(item)}
                              title='Desasignar Horario'
                              className='text-destructive hover:text-destructive/80 hover:bg-destructive/10'
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className='text-center h-24'>
                        No se encontraron horarios asignados.
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
    </>
  );
}
