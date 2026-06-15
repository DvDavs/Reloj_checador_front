'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { EnhancedBadge } from '@/app/components/shared/enhanced-badge';
import { EnhancedCard } from '@/app/components/shared/enhanced-card';
import { Eye, Edit, Trash2, UserPlus } from 'lucide-react';
import { DetailsDialog } from './components/details-dialog';
import { DeleteConfirmationDialog } from './components/delete-confirmation-dialog';
import { useToast } from '@/components/ui/use-toast';
import UnifiedEditModal from './components/unified-edit-modal';

import { PageHeader } from '@/app/components/shared/page-header';
import { SearchInput } from '@/app/components/shared/search-input';
import { LoadingState } from '@/app/components/shared/loading-state';
import { ErrorState } from '@/app/components/shared/error-state';
import { SortableHeader } from '@/app/components/shared/sortable-header';
import { PaginationWrapper } from '@/app/components/shared/pagination-wrapper';

const PAGE_SIZE = 10;

export default function HorariosAsignadosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Data state
  const [rows, setRows] = useState<HorarioAsignadoDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Server-side pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Client-side sort over current page (#3)
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal state
  const [selectedItem, setSelectedItem] = useState<HorarioAsignadoDto | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const fetchPage = useCallback(async (pageNum: number, filtro: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', String(pageNum - 1)); // backend es 0-based
      params.append('size', String(PAGE_SIZE));
      if (filtro.trim()) params.append('filtro', filtro.trim());

      const response = await apiClient.get<{
        content: HorarioAsignadoDto[];
        totalPages: number;
      }>(`/api/horarios-asignados?${params.toString()}`);

      const content: HorarioAsignadoDto[] = response.data?.content ?? [];
      setTotalPages(response.data?.totalPages ?? 1);

      // Enriquecer solo los empleados de esta página (máximo PAGE_SIZE llamadas)
      try {
        const uniqueIds = Array.from(new Set(content.map((i) => i.empleadoId)));
        const cardEntries = await Promise.all(
          uniqueIds.map(async (empId) => {
            try {
              const r = await apiClient.get(`/api/empleados/${empId}`);
              return [empId, r.data?.tarjeta ?? null] as const;
            } catch {
              return [empId, null] as const;
            }
          })
        );
        const cardMap = new Map<number, string | number | null>(cardEntries);
        setRows(
          content.map((item) => ({
            ...item,
            numTarjetaTrabajador: cardMap.get(item.empleadoId) ?? null,
          }))
        );
      } catch {
        setRows(content);
      }
    } catch (err: any) {
      // #5: solo exponer mensaje del backend; evitar exponer err.message de red
      const msg =
        err.response?.data?.message ?? 'Error al comunicarse con el servidor';
      setError(`Error al cargar horarios asignados: ${msg}`);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // #2: cleanup debounce al desmontar para evitar llamadas sobre componente desmontado
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Carga inicial
  useEffect(() => {
    fetchPage(1, '');
  }, [fetchPage]);

  // #6 + #7: Abrir detalle desde URL highlight — valida ID numérico y hace fetch si no está en página
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (!highlightId || !/^\d+$/.test(highlightId) || isLoading) return;

    const numericId = parseInt(highlightId, 10);

    const openAndClean = (item: HorarioAsignadoDto) => {
      setSelectedItem(item);
      setIsDetailsOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('highlight');
      window.history.replaceState({}, '', url.toString());
    };

    const inPage = rows.find((item) => item.id === numericId);
    if (inPage) {
      openAndClean(inPage);
      return;
    }

    // #7: item no está en la página actual — fetch directo por ID
    if (rows.length > 0) {
      apiClient
        .get<HorarioAsignadoDto>(`/api/horarios-asignados/${numericId}`)
        .then((r) => {
          if (r.data) openAndClean(r.data);
        })
        .catch(() => {});
    }
  }, [searchParams, rows, isLoading]);

  // #3: sort client-side sobre la página actual
  const handleSort = useCallback((field: string) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDirection('asc');
      return field;
    });
  }, []);

  const sortedRows = useMemo(() => {
    if (!sortField) return rows;
    return [...rows].sort((a, b) => {
      const aVal = (a as any)[sortField] ?? '';
      const bVal = (b as any)[sortField] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal), 'es-MX');
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [rows, sortField, sortDirection]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchPage(1, value);
    }, 400);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchPage(newPage, searchTerm);
  };

  // #8: useCallback con dependencias explícitas para evitar closure stale
  const onRefresh = useCallback(
    () => fetchPage(page, searchTerm),
    [fetchPage, page, searchTerm]
  );

  const handleDelete = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/horarios-asignados/${selectedItem.id}`);
      setIsDeleteDialogOpen(false);
      toast({
        title: 'Éxito',
        description: 'El horario ha sido desasignado correctamente.',
      });
      fetchPage(page, searchTerm);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo desasignar el horario.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const onlyDate = dateString.substring(0, 10);
    const [yStr, mStr, dStr] = onlyDate.split('-');
    const year = parseInt(yStr || '', 10);
    const month = parseInt(mStr || '', 10);
    const day = parseInt(dStr || '', 10);
    if (!year || !month || !day) {
      return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return new Date(year, month - 1, day).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      <div className='min-h-screen bg-background'>
        <div className='p-6 md:p-8'>
          <EnhancedCard variant='elevated' padding='lg' className='mb-6'>
            <PageHeader
              title='Horarios Asignados'
              isLoading={isLoading}
              onRefresh={onRefresh}
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
                      {sortedRows.length > 0 ? (
                        sortedRows.map((item) => (
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
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setIsDetailsOpen(true);
                                  }}
                                  title='Ver Detalles'
                                  className='action-button-view'
                                >
                                  <Eye className='h-4 w-4' />
                                </Button>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  onClick={() => {
                                    setEditId(item.id);
                                    setIsEditOpen(true);
                                  }}
                                  title='Editar Horario'
                                  className='action-button-edit'
                                >
                                  <Edit className='h-4 w-4' />
                                </Button>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setIsDeleteDialogOpen(true);
                                  }}
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

              <EnhancedCard variant='default' padding='md'>
                <PaginationWrapper
                  currentPage={page}
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
        onClose={() => {
          setSelectedItem(null);
          setIsDetailsOpen(false);
        }}
        item={selectedItem}
      />

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      <UnifiedEditModal
        isOpen={isEditOpen}
        assignmentId={editId}
        onClose={() => setIsEditOpen(false)}
        onSaved={() => fetchPage(page, searchTerm)}
      />
    </>
  );
}
