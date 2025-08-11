'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import { useTableState } from '@/app/hooks/use-table-state';
import {
  buscarAsistenciasConsolidadas,
  getEstatusDisponibles,
  AsistenciaRecord,
  AsistenciaFilters,
  EstatusDisponible,
} from '@/lib/api/asistencia.api';

export function CorreccionEstatusForm() {
  const { toast } = useToast();
  // Estado principal del componente
  const [loading, setLoading] = useState({ estatus: true, search: false });
  const [error, setError] = useState<string | null>(null);
  const [estatusDisponibles, setEstatusDisponibles] = useState<
    EstatusDisponible[]
  >([]);
  const [allAsistencias, setAllAsistencias] = useState<AsistenciaRecord[]>([]); // Almacena todos los resultados
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Hook para manejar la paginación y ordenamiento del lado del cliente
  const {
    paginatedData,
    currentPage,
    totalPages,
    handlePageChange,
    handleSort,
    sortField,
    sortDirection,
  } = useTableState({
    data: allAsistencias,
    itemsPerPage: 10,
    defaultSortField: 'fecha',
  });

  const fetchEstatus = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, estatus: true }));
      const estatus = await getEstatusDisponibles();
      setEstatusDisponibles(estatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estatus');
    } finally {
      setLoading((prev) => ({ ...prev, estatus: false }));
    }
  }, []);

  useEffect(() => {
    fetchEstatus();
  }, [fetchEstatus]);

  const handleSearch = useCallback(
    async (filters: AsistenciaFilters) => {
      setLoading((prev) => ({ ...prev, search: true }));
      setError(null);
      try {
        const results = await buscarAsistenciasConsolidadas(filters);
        setAllAsistencias(results);
        // Resetear la página a 1 en cada nueva búsqueda
        handlePageChange(1);
        setSelectedIds([]); // Limpiar selección en nueva búsqueda
        toast({
          title: 'Búsqueda completada',
          description: `Se encontraron ${results.length} registros.`,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al buscar');
        setAllAsistencias([]);
      } finally {
        setLoading((prev) => ({ ...prev, search: false }));
      }
    },
    [toast, handlePageChange]
  );

  const handleClear = useCallback(() => {
    setAllAsistencias([]);
    setSelectedIds([]);
    setError(null);
  }, []);

  const handleModalSuccess = useCallback(() => {
    toast({
      title: 'Éxito',
      description: 'Los registros han sido actualizados.',
    });
    // Limpiar los resultados para forzar una nueva búsqueda del usuario
    handleClear();
  }, [handleClear, toast]);

  const columns = useMemo(
    () => [
      {
        key: 'empleadoNombre',
        label: 'Empleado',
        sortable: true,
        render: (item: AsistenciaRecord) => (
          <div>
            <div className='font-medium'>{item.empleadoNombre}</div>
            <div className='text-xs text-muted-foreground'>
              ID: {item.empleadoId}
            </div>
          </div>
        ),
      },
      {
        key: 'fecha',
        label: 'Fecha',
        sortable: true,
        render: (item: AsistenciaRecord) =>
          format(new Date(item.fecha), 'dd/MM/yyyy', { locale: es }),
      },
      {
        key: 'estatusAsistenciaNombre',
        label: 'Estatus',
        sortable: true,
        render: (item: AsistenciaRecord) => (
          <Badge variant='outline'>{item.estatusAsistenciaNombre}</Badge>
        ),
      },
      {
        key: 'horaEntradaReal',
        label: 'Entrada Real',
        sortable: true,
        render: (item: AsistenciaRecord) =>
          item.horaEntradaReal
            ? format(new Date(item.horaEntradaReal), 'HH:mm:ss')
            : '-',
      },
      {
        key: 'horaSalidaReal',
        label: 'Salida Real',
        sortable: true,
        render: (item: AsistenciaRecord) =>
          item.horaSalidaReal
            ? format(new Date(item.horaSalidaReal), 'HH:mm:ss')
            : '-',
      },
      {
        key: 'observaciones',
        label: 'Observaciones',
        className: 'max-w-xs truncate',
      },
    ],
    []
  );

  return (
    <div className='space-y-6'>
      <AsistenciaSearchForm
        estatusDisponibles={estatusDisponibles}
        loading={loading.search || loading.estatus}
        onSearch={handleSearch}
        onClearFilters={handleClear}
        showDateRange={true}
        requireDate={true}
        requireStatus={false}
      />

      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {allAsistencias.length > 0 && (
        <Card>
          <CardHeader>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                Resultados ({allAsistencias.length})
              </CardTitle>
              <Button
                onClick={() => setIsModalOpen(true)}
                disabled={selectedIds.length === 0}
              >
                <Edit3 className='mr-2 h-4 w-4' /> Corregir Estatus (
                {selectedIds.length})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DataTableWithSelection
              data={paginatedData}
              columns={columns}
              currentPage={currentPage}
              totalPages={totalPages}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              onPageChange={handlePageChange}
              enableSelection
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              getItemId={(item) => item.id}
            />
          </CardContent>
        </Card>
      )}

      <EstatusCorrecionModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        asistenciasSeleccionadas={allAsistencias.filter((a) =>
          selectedIds.includes(a.id)
        )}
        estatusDisponibles={estatusDisponibles}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
