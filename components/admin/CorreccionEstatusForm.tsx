'use client';

import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit3, Users, AlertCircle, CheckCircle2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

import { AsistenciaSearchForm } from './AsistenciaSearchForm';
import { EstatusCorrecionModal } from './EstatusCorrecionModal';
import { DataTableWithSelection } from '@/app/components/shared/data-table-with-selection';
import { useCorreccionEstatusReducer } from '@/lib/hooks/useCorreccionEstatusReducer';
import {
  buscarAsistencias,
  getEstatusDisponibles,
  AsistenciaRecord,
  AsistenciaFilters,
} from '@/lib/api/asistencia.api';

// ============================================================================
// INTERFACES
// ============================================================================

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: AsistenciaRecord) => React.ReactNode;
  className?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function CorreccionEstatusForm() {
  const { state, actions } = useCorreccionEstatusReducer();
  const { toast } = useToast();

  // ============================================================================
  // EFECTOS
  // ============================================================================

  // Cargar estatus disponibles al montar el componente
  useEffect(() => {
    const loadEstatusDisponibles = async () => {
      actions.setLoading('loadingEstatus', true);
      actions.setError('estatus', undefined);

      try {
        const estatus = await getEstatusDisponibles();
        actions.setEstatusDisponibles(estatus);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Error al cargar estatus disponibles';
        actions.setError('estatus', errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        actions.setLoading('loadingEstatus', false);
      }
    };

    // Solo cargar si no hay estatus disponibles y no está cargando
    if (
      (!state.estatusDisponibles || state.estatusDisponibles.length === 0) &&
      !state.loading.loadingEstatus
    ) {
      loadEstatusDisponibles();
    }
  }, [
    actions,
    toast,
    state.estatusDisponibles?.length,
    state.loading.loadingEstatus,
  ]);

  // ============================================================================
  // HANDLERS MEMOIZADOS
  // ============================================================================

  const handleSearch = React.useCallback(
    async (filters: AsistenciaFilters) => {
      actions.setLoading('searching', true);
      actions.setError('search', undefined);
      actions.clearSelection();

      try {
        const results = await buscarAsistencias(filters, 1, 50);
        actions.setSearchResults(results);
        actions.setFilters(filters);

        toast({
          title: 'Búsqueda completada',
          description: `Se encontraron ${results.total} registros.`,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Error al buscar asistencias';
        actions.setError('search', errorMessage);
        toast({
          title: 'Error en la búsqueda',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        actions.setLoading('searching', false);
      }
    },
    [actions, toast]
  );

  const handleClearFilters = React.useCallback(() => {
    actions.setFilters({});
    actions.setSearchResults({
      asistencias: [],
      total: 0,
      pagina: 1,
      totalPaginas: 0,
    });
    actions.clearSelection();
    actions.clearErrors();
  }, [actions]);

  const handlePageChange = React.useCallback(
    async (page: number) => {
      if (Object.keys(state.filters).length === 0) return;

      actions.setLoading('searching', true);

      try {
        const results = await buscarAsistencias(
          state.filters as AsistenciaFilters,
          page,
          50
        );
        actions.setSearchResults(results);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error al cambiar página';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        actions.setLoading('searching', false);
      }
    },
    [actions, state.filters, toast]
  );

  const handleSort = React.useCallback((field: string) => {
    // TODO: Implementar ordenamiento si el backend lo soporta
    console.log('Sort by:', field);
  }, []);

  const handleModalSuccess = React.useCallback(async () => {
    // Refrescar los resultados de búsqueda después de una corrección exitosa
    if (Object.keys(state.filters).length > 0) {
      actions.setLoading('searching', true);

      try {
        const results = await buscarAsistencias(
          state.filters as AsistenciaFilters,
          state.pagination?.currentPage || 1,
          50
        );
        actions.setSearchResults(results);
        actions.clearSelection(); // Limpiar selección después de la corrección

        toast({
          title: 'Datos actualizados',
          description: 'La tabla se ha actualizado con los cambios realizados.',
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Error al actualizar los datos';
        toast({
          title: 'Error al actualizar',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        actions.setLoading('searching', false);
      }
    }
  }, [actions, state.filters, state.pagination?.currentPage, toast]);

  const handleOpenCorrectionModal = React.useCallback(() => {
    if (!state.selectedIds || state.selectedIds.length === 0) {
      toast({
        title: 'Selección requerida',
        description: 'Debe seleccionar al menos una asistencia para corregir.',
        variant: 'destructive',
      });
      return;
    }

    actions.openModal();
  }, [state.selectedIds?.length, toast, actions]);

  // ============================================================================
  // CONFIGURACIÓN DE COLUMNAS MEMOIZADA
  // ============================================================================

  const columns: Column[] = React.useMemo(
    () => [
      {
        key: 'empleadoNombre',
        label: 'Empleado',
        sortable: true,
        render: (item: AsistenciaRecord) => (
          <div className='space-y-1'>
            <div className='font-medium'>{item.empleadoNombre ?? '-'}</div>
            <div className='text-sm text-muted-foreground'>
              ID: {item.empleadoId ?? '-'}
            </div>
          </div>
        ),
      },
      // Nota: El DTO actual no incluye departamento. Si se necesita, agregarlo al DTO del backend.
      {
        key: 'fecha',
        label: 'Fecha',
        sortable: true,
        render: (item: AsistenciaRecord) => (
          <div className='font-mono'>
            {item.fecha
              ? format(new Date(item.fecha), 'dd/MM/yyyy', { locale: es })
              : '-'}
          </div>
        ),
      },
      {
        key: 'estatusAsistenciaNombre',
        label: 'Estatus Actual',
        render: (item: AsistenciaRecord) => (
          <Badge variant='outline'>{item.estatusAsistenciaNombre ?? '-'}</Badge>
        ),
      },
      {
        key: 'horarios',
        label: 'Horarios',
        render: (item: AsistenciaRecord) => (
          <div className='space-y-1 text-sm'>
            {item.horaEntradaReal && (
              <div>
                Entrada Real:{' '}
                <span className='font-mono'>
                  {item.horaEntradaReal.split(' ')[1] ?? item.horaEntradaReal}
                </span>
              </div>
            )}
            {item.horaSalidaReal && (
              <div>
                Salida Real:{' '}
                <span className='font-mono'>
                  {item.horaSalidaReal.split(' ')[1] ?? item.horaSalidaReal}
                </span>
              </div>
            )}
            {!item.horaEntradaReal && !item.horaSalidaReal && (
              <div>
                Programado:{' '}
                <span className='font-mono'>
                  {item.horaEntradaProgramada ?? '-'}
                  {item.horaEntradaProgramada || item.horaSalidaProgramada
                    ? ' - '
                    : ''}
                  {item.horaSalidaProgramada ?? '-'}
                </span>
              </div>
            )}
            {item.minutosRetardo && item.minutosRetardo > 0 && (
              <div className='text-orange-600'>
                Retardo: {item.minutosRetardo} min
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'observaciones',
        label: 'Observaciones',
        render: (item: AsistenciaRecord) => (
          <div
            className='max-w-xs truncate text-sm text-muted-foreground'
            title={item.observaciones || undefined}
          >
            {item.observaciones || '-'}
          </div>
        ),
      },
    ],
    []
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className='space-y-6'>
      {/* Formulario de búsqueda */}
      <AsistenciaSearchForm
        filters={state.filters}
        estatusDisponibles={state.estatusDisponibles || []}
        loading={state.loading.searching || state.loading.loadingEstatus}
        onSearch={handleSearch}
        onClearFilters={handleClearFilters}
        singleDate
      />

      {/* Error de carga de estatus */}
      {state.errors.estatus && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{state.errors.estatus}</AlertDescription>
        </Alert>
      )}

      {/* Error de búsqueda */}
      {state.errors.search && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{state.errors.search}</AlertDescription>
        </Alert>
      )}

      {/* Resultados de búsqueda */}
      {state.searchResults && state.searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                Resultados de Búsqueda
                <Badge variant='secondary'>
                  {state.pagination?.total || 0} registros
                </Badge>
              </CardTitle>

              {/* Información de selección y botón de corrección */}
              <div className='flex items-center gap-3'>
                {state.selectedIds && state.selectedIds.length > 0 && (
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <CheckCircle2 className='h-4 w-4' />
                    {state.selectedIds.length} seleccionados
                  </div>
                )}

                <Button
                  onClick={handleOpenCorrectionModal}
                  disabled={
                    !state.selectedIds ||
                    state.selectedIds.length === 0 ||
                    state.loading.correcting
                  }
                  size='sm'
                >
                  {state.loading.correcting ? (
                    <>
                      <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Edit3 className='mr-2 h-4 w-4' />
                      Corregir Estatus
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTableWithSelection
              data={state.searchResults || []}
              columns={columns}
              currentPage={state.pagination?.currentPage || 1}
              totalPages={state.pagination?.totalPages || 0}
              sortField={null}
              sortDirection='asc'
              onSort={handleSort}
              onPageChange={handlePageChange}
              enableSelection={true}
              selectedIds={state.selectedIds || []}
              onSelectionChange={actions.setSelection}
              getItemId={(item) => item.id}
              emptyMessage='No se encontraron asistencias con los filtros aplicados.'
            />
          </CardContent>
        </Card>
      )}

      {/* Mensaje cuando no hay búsqueda activa */}
      {(!state.searchResults || state.searchResults.length === 0) &&
        Object.keys(state.filters || {}).length === 0 &&
        !state.loading.searching && (
          <Card>
            <CardContent className='text-center py-12'>
              <Users className='mx-auto h-12 w-12 text-muted-foreground mb-4' />
              <h3 className='text-lg font-medium mb-2'>Buscar Asistencias</h3>
              <p className='text-muted-foreground mb-4'>
                Use los filtros de búsqueda para encontrar las asistencias que
                desea corregir.
              </p>
              <p className='text-sm text-muted-foreground'>
                Puede buscar por empleado, departamento, rango de fechas o
                estatus actual.
              </p>
            </CardContent>
          </Card>
        )}

      {/* Modal de corrección de estatus */}
      <EstatusCorrecionModal
        open={state.modalOpen}
        onClose={actions.closeModal}
        asistenciasSeleccionadas={
          state.searchResults?.filter((asistencia) =>
            state.selectedIds.includes(asistencia.id)
          ) || []
        }
        estatusDisponibles={state.estatusDisponibles || []}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
