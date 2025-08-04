'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { HorarioTemplate as HorarioPaginadoDto } from './types';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/app/components/shared/status-badge';
import { Eye, Edit, Trash2, PlusCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

import { PageHeader } from '@/app/components/shared/page-header';
import { SearchInput } from '@/app/components/shared/search-input';
import { LoadingState } from '@/app/components/shared/loading-state';
import { ErrorState } from '@/app/components/shared/error-state';
import { SortableHeader } from '@/app/components/shared/sortable-header';
import { PaginationWrapper } from '@/app/components/shared/pagination-wrapper';
import { useDebounce } from '@/app/hooks/use-debounce';
import { DeleteConfirmationDialog } from './components/delete-confirmation-dialog';
import { DetailsDialog } from './components/details-dialog';
import { EmpleadosAsignadosCell } from './components/empleados-asignados-cell';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const ITEMS_PER_PAGE = 10;

export default function HorariosPlantillasPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [data, setData] = useState<{
    content: HorarioPaginadoDto[];
    totalPages: number;
  }>({ content: [], totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HorarioPaginadoDto | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchHorarios = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: ITEMS_PER_PAGE.toString(),
        sort: `${sortField},${sortDirection}`,
        filtro: debouncedSearchTerm,
      });

      const response = await apiClient.get(
        `${API_BASE_URL}/api/horarios/paginado?${params.toString()}`
      );
      setData(response.data);
    } catch (err: any) {
      console.error('Error fetching horarios:', err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'No se pudo cargar la lista de horarios.';
      setError(
        `Error al cargar horarios: ${errorMsg}. Verifique la conexión con la API.`
      );
      setData({ content: [], totalPages: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, sortField, sortDirection, debouncedSearchTerm]);

  useEffect(() => {
    fetchHorarios();
  }, [fetchHorarios]);

  const handleSort = (field: string) => {
    const newDirection =
      sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0);
  };

  const handleViewDetails = (id: number) => {
    setSelectedTemplateId(id);
    setIsDetailsOpen(true);
  };

  const closeDetailsDialog = () => {
    setIsDetailsOpen(false);
    setSelectedTemplateId(null);
  };

  const openDeleteDialog = (item: HorarioPaginadoDto) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(`${API_BASE_URL}/api/horarios/${itemToDelete.id}`);

      fetchHorarios();
      setIsDeleteDialogOpen(false);

      toast({
        title: 'Éxito',
        description: `El horario "${itemToDelete.nombre}" ha sido desactivado.`,
      });
    } catch (err: any) {
      console.error('Error deleting horario:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo desactivar el horario. Inténtelo de nuevo.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/horarios/plantillas/editar/${id}`);
  };

  return (
    <>
      <div className='p-6 md:p-8'>
        <PageHeader
          title='Plantillas de Horarios'
          isLoading={isLoading}
          onRefresh={fetchHorarios}
          actions={
            <Link href='/horarios/plantillas/registrar'>
              <Button className='h-9'>
                <PlusCircle className='mr-2 h-4 w-4' />
                Crear Plantilla
              </Button>
            </Link>
          }
        />

        <SearchInput
          value={searchTerm}
          onChange={handleSearch}
          placeholder='Buscar por nombre o descripción...'
          className='mb-4'
        />

        {isLoading && <LoadingState message='Cargando plantillas...' />}

        {error && <ErrorState message={error} />}

        {!isLoading && !error && (
          <>
            <div className='overflow-x-auto rounded-lg border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader
                      field='nombre'
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    >
                      Nombre
                    </SortableHeader>
                    <SortableHeader
                      field='descripcion'
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    >
                      Descripción
                    </SortableHeader>
                    <TableHead>Estado</TableHead>
                    <SortableHeader
                      field='esHorarioJefe'
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    >
                      Tipo Horario
                    </SortableHeader>
                    <TableHead>Empleados Asignados</TableHead>
                    <TableHead className='text-right'>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.content.length > 0 ? (
                    data.content.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.nombre}</TableCell>
                        <TableCell className='max-w-[250px] truncate'>
                          {item.descripcion || '-'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge isActive={item.activo} />
                        </TableCell>
                        <TableCell>
                          {item.esHorarioJefe ? (
                            <Badge variant='outline'>Jefe</Badge>
                          ) : (
                            <Badge variant='secondary'>Regular</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <EmpleadosAsignadosCell horarioId={item.id} />
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex justify-end items-center gap-1'>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => handleViewDetails(item.id)}
                              title='Ver Detalles'
                              className='text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
                            >
                              <Eye className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => handleEdit(item.id)}
                              title='Editar Horario'
                              className='text-green-400 hover:text-green-300 hover:bg-green-500/10'
                            >
                              <Edit className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => openDeleteDialog(item)}
                              title='Desactivar Horario'
                              className='text-red-400 hover:text-red-300 hover:bg-red-500/10'
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className='text-center h-24'>
                        No se encontraron plantillas de horarios.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <PaginationWrapper
              currentPage={currentPage}
              totalPages={data.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      <DetailsDialog
        isOpen={isDetailsOpen}
        onClose={closeDetailsDialog}
        templateId={selectedTemplateId}
      />

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        itemName={itemToDelete?.nombre}
      />
    </>
  );
}
