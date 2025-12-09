'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, Filter, X, Calendar as CalendarIcon } from 'lucide-react';
import { EnhancedCard } from '@/app/components/shared/enhanced-card';
import { DataTable } from '@/app/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  listJustificacionesPaginated,
  listTiposJustificacion,
  type JustificacionItem,
  type TipoJustificacion,
} from '@/lib/api/justificaciones.api';

export function JustificacionManagement() {
  // Estado de datos
  const [rows, setRows] = useState<JustificacionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tiposJustificacion, setTiposJustificacion] = useState<
    TipoJustificacion[]
  >([]);

  // Estado de paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Estado de filtros
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(undefined);
  const [fechaFin, setFechaFin] = useState<Date | undefined>(undefined);
  const [tipoAlcance, setTipoAlcance] = useState<string>('TODOS');
  const [tipoJustificacionId, setTipoJustificacionId] =
    useState<string>('TODOS');

  // Estado de ordenamiento
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Cargar tipos de justificación al montar
  useEffect(() => {
    const loadTipos = async () => {
      try {
        const data = await listTiposJustificacion();
        setTiposJustificacion(data);
      } catch (e) {
        console.error('Error al cargar tipos:', e);
      }
    };
    loadTipos();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: any = {
        page: page - 1, // API usa 0-based index
        size: pageSize,
      };

      if (fechaInicio) filters.fechaInicio = format(fechaInicio, 'yyyy-MM-dd');
      if (fechaFin) filters.fechaFin = format(fechaFin, 'yyyy-MM-dd');
      if (tipoAlcance !== 'TODOS') filters.tipo = tipoAlcance;
      if (tipoJustificacionId !== 'TODOS')
        filters.tipoJustificacionId = Number(tipoJustificacionId);

      const response = await listJustificacionesPaginated(filters);

      setRows(response.data);
      setTotalPages(response.totalPages);
      setTotalRecords(response.total);
    } catch (e: any) {
      setError(e.message || 'Error al cargar justificaciones');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, fechaInicio, fechaFin, tipoAlcance, tipoJustificacionId]);

  // Cargar datos cuando cambian filtros o página
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    setPage(1); // Resetear a primera página al buscar
  };

  const handleClearFilters = () => {
    setFechaInicio(undefined);
    setFechaFin(undefined);
    setTipoAlcance('TODOS');
    setTipoJustificacionId('TODOS');
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedRows = useMemo(() => {
    if (!sortField) return rows;
    const copy = [...rows];
    copy.sort((a: any, b: any) => {
      const va = a[sortField];
      const vb = b[sortField];
      if (va == null && vb == null) return 0;
      if (va == null) return sortDirection === 'asc' ? -1 : 1;
      if (vb == null) return sortDirection === 'asc' ? 1 : -1;
      if (va < vb) return sortDirection === 'asc' ? -1 : 1;
      if (va > vb) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [rows, sortField, sortDirection]);

  const columns = useMemo(
    () => [
      {
        key: 'empleadoNombre',
        label: 'Empleado',
        sortable: true,
        render: (j: JustificacionItem) =>
          j.empleadoNombre || (j.esMasiva ? 'Todos (Masiva)' : '—'),
      },
      {
        key: 'tipoJustificacionNombre',
        label: 'Concepto',
        sortable: true,
        render: (j: JustificacionItem) =>
          j.tipoJustificacionNombre || 'Administrativa',
      },
      {
        key: 'fechaInicio',
        label: 'Inicio',
        sortable: true,
        render: (j: JustificacionItem) => j.fechaInicio || '—',
      },
      {
        key: 'fechaFin',
        label: 'Fin',
        sortable: true,
        render: (j: JustificacionItem) => j.fechaFin || '—',
      },
      {
        key: 'esMasiva',
        label: 'Alcance',
        render: (j: JustificacionItem) => (
          <Badge variant={j.esMasiva ? 'default' : 'secondary'}>
            {j.esMasiva
              ? 'Masiva'
              : j.departamentoId
                ? `Depto ${j.departamentoId}`
                : 'Individual'}
          </Badge>
        ),
      },
      {
        key: 'motivo',
        label: 'Motivo',
        render: (j: JustificacionItem) => j.motivo || '—',
        className: 'max-w-[200px] truncate',
      },
      {
        key: 'numOficio',
        label: 'Oficio',
        render: (j: JustificacionItem) => j.numOficio || '—',
      },
    ],
    []
  );

  return (
    <div className='space-y-6'>
      {/* Filtros */}
      <EnhancedCard variant='bordered' padding='md'>
        <div className='space-y-4'>
          <div className='flex items-center gap-2 mb-2'>
            <Filter className='h-4 w-4 text-primary' />
            <h3 className='font-medium'>Filtros de Búsqueda</h3>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='space-y-2'>
              <Label>Fecha Inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !fechaInicio && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {fechaInicio ? (
                      format(fechaInicio, 'PPP', { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                  <Calendar
                    mode='single'
                    selected={fechaInicio}
                    onSelect={setFechaInicio}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className='space-y-2'>
              <Label>Fecha Fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !fechaFin && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {fechaFin ? (
                      format(fechaFin, 'PPP', { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                  <Calendar
                    mode='single'
                    selected={fechaFin}
                    onSelect={setFechaFin}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className='space-y-2'>
              <Label>Alcance</Label>
              <Select value={tipoAlcance} onValueChange={setTipoAlcance}>
                <SelectTrigger>
                  <SelectValue placeholder='Seleccione alcance' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='TODOS'>Todos</SelectItem>
                  <SelectItem value='INDIVIDUAL'>Individual</SelectItem>
                  <SelectItem value='DEPARTAMENTO'>Departamental</SelectItem>
                  <SelectItem value='MASIVA'>Masiva</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>Concepto</Label>
              <Select
                value={tipoJustificacionId}
                onValueChange={setTipoJustificacionId}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Seleccione concepto' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='TODOS'>Todos</SelectItem>
                  {tiposJustificacion.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id.toString()}>
                      {tipo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='flex justify-end gap-2 pt-2'>
            <Button variant='outline' onClick={handleClearFilters} size='sm'>
              <X className='h-4 w-4 mr-2' />
              Limpiar
            </Button>
            <Button onClick={handleSearch} size='sm'>
              <Search className='h-4 w-4 mr-2' />
              Buscar
            </Button>
          </div>
        </div>
      </EnhancedCard>

      {/* Tabla */}
      <EnhancedCard variant='elevated' padding='lg'>
        <div className='space-y-4'>
          <div className='flex justify-between items-center'>
            <h2 className='text-lg font-semibold text-foreground'>
              Resultados ({totalRecords})
            </h2>
          </div>

          {error && (
            <div className='p-4 bg-red-50 text-red-600 rounded-md text-sm'>
              {error}
            </div>
          )}

          <DataTable
            data={sortedRows}
            columns={columns}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            emptyMessage={
              loading
                ? 'Cargando...'
                : 'No se encontraron justificaciones con los filtros seleccionados.'
            }
          />
        </div>
      </EnhancedCard>
    </div>
  );
}
