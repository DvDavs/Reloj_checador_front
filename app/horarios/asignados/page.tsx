'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { RequirePermission } from '@/app/components/auth/require-permission';
import { Can } from '@/app/components/auth/can';

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
      const msg =
        err.response?.data?.message || err.message || 'Error desconocido';
      setError(`Error al cargar horarios asignados: ${msg}`);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    fetchPage(1, '');
  }, [fetchPage]);

  // Abrir detalle desde URL highlight
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId && rows.length > 0 && !isLoading) {
      const target = rows.find((item) => item.id.toString() === highlightId);
      if (target) {
        setSelectedItem(target);
        setIsDetailsOpen(true);
        const url = new URL(window.location.href);
        url.searchParams.delete('highlight');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams, rows, isLoading]);

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
    <RequirePermission permission='horario:read'>
      <>
        <div className='min-h-screen bg-background'>
          <div className='p-6 md:p-8'>
            <EnhancedCard variant='elevated' padding='lg' className='mb-6'>
              <PageHeader
                title='Horarios Asignados'
                isLoading={isLoading}
                onRefresh={() => fetchPage(page, searchTerm)}
                actions={
                  <Can permission='horario:assign'>
                    <Link href='/horarios/asignados/registrar'>
                      <Button className='h-10 px-6 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200'>
                        <UserPlus className='mr-2 h-4 w-4' />
                        Registrar
                      </Button>
                    </Link>
                  </Can>
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
                          <TableHead className='font-semibold text-foreground'>
                            Tarjeta
                          </TableHead>
                          <TableHead className='font-semibold text-foreground'>
                            Empleado
                          </TableHead>
                          <TableHead className='font-semibold text-foreground'>
                            Horario
                          </TableHead>
                          <TableHead className='font-semibold text-foreground'>
                            Tipo Horario
                          </TableHead>
                          <TableHead className='font-semibold text-foreground'>
                            Fecha Inicio
                          </TableHead>
                          <TableHead className='font-semibold text-foreground'>
                            Fecha Fin
                          </TableHead>
                          <TableHead className='font-semibold text-foreground'>
                            Estado
                          </TableHead>
                          <TableHead className='text-right font-semibold text-foreground'>
                            Acciones
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.length > 0 ? (
                          rows.map((item) => (
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
                                  variant={
                                    item.activo ? 'success' : 'secondary'
                                  }
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
                                  <Can permission='horario:write'>
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
                                  </Can>
                                  <Can permission='horario:assign'>
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
                                  </Can>
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
    </RequirePermission>
  );
}
