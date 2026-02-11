'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, Filter, X, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  listJustificacionesPaginated,
  listTiposJustificacion,
  type JustificacionItem,
  type TipoJustificacion,
  type JustificacionFilters,
} from '@/lib/api/justificaciones.api';
import { DepartmentSearchableSelect } from '@/app/components/shared/department-searchable-select';
import { EmployeeSearch } from '@/app/components/shared/employee-search';

type JustificacionValidationErrors = {
  fechaInicio?: boolean;
  fechaFin?: boolean;
  empleado?: boolean;
  departamento?: boolean;
};

export function JustificacionManagement() {
  const { toast } = useToast();
  // Estado de datos
  const [rows, setRows] = useState<JustificacionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] =
    useState<JustificacionValidationErrors>({});
  const [tiposJustificacion, setTiposJustificacion] = useState<
    TipoJustificacion[]
  >([]);

  // Estado de paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);

  // Estado de filtros
  // 'tipoAlcance' es ahora el DRIVER principal del UI (F1)
  const [tipoAlcance, setTipoAlcance] = useState<string>('TODOS');

  // Estados para los inputs dinamicos (F2)
  const [departamento, setDepartamento] = useState<{
    clave: string;
    nombre: string;
  } | null>(null);
  const [empleado, setEmpleado] = useState<{
    id: number;
    nombreCompleto: string;
  } | null>(null);

  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(undefined);
  const [fechaFin, setFechaFin] = useState<Date | undefined>(undefined);
  const [tipoJustificacionId, setTipoJustificacionId] =
    useState<string>('TODOS');

  // Estado de ordenamiento
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Control para saber si se ha realizado una busqueda
  const [hasSearched, setHasSearched] = useState(false);

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
    if (!hasSearched) return;
    setValidationErrors({});

    // Validaciones
    // 1. Que no pueda filtrarse si no se coloca desde
    if (!fechaInicio) {
      setValidationErrors({ fechaInicio: true });
      setError(
        "Debe seleccionar una fecha de inicio ('Desde') para realizar la búsqueda."
      );
      return;
    }

    // 2. que hasta siempre sea una fecha superiro, nunca menor a desde
    if (fechaFin && fechaInicio && fechaFin < fechaInicio) {
      setValidationErrors({ fechaInicio: true, fechaFin: true });
      setError('La fecha final no puede ser menor a la fecha de inicio.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const filters: JustificacionFilters = {
        page: page - 1, // API usa 0-based index
        size: pageSize,
      };

      if (fechaInicio) filters.fechaInicio = format(fechaInicio, 'yyyy-MM-dd');

      // Si no hay fecha fin, usar fecha inicio
      if (fechaFin) {
        filters.fechaFin = format(fechaFin, 'yyyy-MM-dd');
      } else if (fechaInicio) {
        filters.fechaFin = format(fechaInicio, 'yyyy-MM-dd');
      }

      if (tipoJustificacionId !== 'TODOS')
        filters.tipoJustificacionId = Number(tipoJustificacionId);

      // Logica basada en Alcance (F1)
      if (tipoAlcance === 'TODOS') {
        // No enviamos tipo
      } else if (tipoAlcance === 'MASIVA') {
        filters.tipo = 'MASIVA';
      } else if (tipoAlcance === 'INDIVIDUAL') {
        filters.tipo = 'INDIVIDUAL'; // Forzar filtro por tipo de alcance
        if (empleado?.id) {
          filters.empleadoId = empleado.id;
        }
      } else if (tipoAlcance === 'DEPARTAMENTAL') {
        filters.tipo = 'DEPARTAMENTO'; // Mapear a valor esperado por backend
        if (departamento?.clave) {
          filters.departamentoClave = departamento.clave;
        }
      }

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
  }, [
    page,
    pageSize,
    fechaInicio,
    fechaFin,
    tipoAlcance,
    tipoJustificacionId,
    departamento,
    empleado,
    hasSearched,
  ]);

  // ELIMINADO: useEffect que cargaba datos automáticamente al cambiar página
  // Ahora la carga se controla exclusivamente por triggerSearch
  /*
  useEffect(() => {
    if (hasSearched) {
      fetchData();
    }
  }, [page, fetchData]);
  */

  const onSearchClick = () => {
    setPage(1);
    setHasSearched(true);
    // Disparar useEffect si ya estaba searched pero cambiaron filtros
    // (fetchData tiene dependencias, asi que se actualiza, pero necesitamos dispararlo)
    // Como fetchData es dependencia del useEffect, y sus dependencias cambiaron, el useEffect se dispararia?
    // SI, si fetchData cambia.
    // ESTRATEGIA: Llamar directamente a una funcion interna o usar un trigger.
    // Usamos el triggerSearch pattern
    setTriggerSearch((prev) => prev + 1);
  };

  const [triggerSearch, setTriggerSearch] = useState(0);
  useEffect(() => {
    if (triggerSearch > 0) {
      fetchData();
    }
  }, [triggerSearch]);

  const handleClearFilters = () => {
    setFechaInicio(undefined);
    setFechaFin(undefined);
    setTipoAlcance('TODOS');
    setTipoJustificacionId('TODOS');
    setDepartamento(null);
    setEmpleado(null);
    setPage(1);
    setHasSearched(false);
    setRows([]);
    setTotalRecords(0);
    setTotalPages(1);
    setError(null);
    setValidationErrors({});
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
        label: 'Desde',
        sortable: true,
        render: (j: JustificacionItem) => j.fechaInicio || '—',
      },
      {
        key: 'fechaFin',
        label: 'Hasta',
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

          {/* Fila 1 */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* F1: Alcance */}
            <div className='space-y-2'>
              <Label>Alcance</Label>
              <Select
                value={tipoAlcance}
                onValueChange={(val) => {
                  setTipoAlcance(val);
                  // Resetear inputs dinamicos al cambiar alcance
                  setEmpleado(null);
                  setDepartamento(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Seleccione alcance' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='TODOS'>Todos</SelectItem>
                  <SelectItem value='INDIVIDUAL'>Individual</SelectItem>
                  <SelectItem value='DEPARTAMENTAL'>Departamental</SelectItem>
                  <SelectItem value='MASIVA'>Masiva</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* F2: Filtro Dinamico */}
            <div
              className={cn(
                'space-y-2',
                (tipoAlcance === 'TODOS' || tipoAlcance === 'MASIVA') &&
                  'opacity-50 pointer-events-none grayscale'
              )}
            >
              <Label
                className={
                  (tipoAlcance === 'INDIVIDUAL' && validationErrors.empleado) ||
                  (tipoAlcance === 'DEPARTAMENTAL' &&
                    validationErrors.departamento)
                    ? 'text-destructive'
                    : ''
                }
              >
                {tipoAlcance === 'INDIVIDUAL'
                  ? 'Empleado'
                  : tipoAlcance === 'DEPARTAMENTAL'
                    ? 'Departamento'
                    : 'Filtro Específico'}
              </Label>

              {tipoAlcance === 'INDIVIDUAL' ? (
                // @ts-ignore
                <div
                  className={cn(
                    validationErrors.empleado &&
                      'rounded-md ring-2 ring-destructive'
                  )}
                >
                  <EmployeeSearch
                    value={empleado}
                    onChange={setEmpleado}
                    placeholder='Buscar empleado...'
                  />
                </div>
              ) : tipoAlcance === 'DEPARTAMENTAL' ? (
                // @ts-ignore
                <div
                  className={cn(
                    validationErrors.departamento &&
                      'rounded-md ring-2 ring-destructive'
                  )}
                >
                  <DepartmentSearchableSelect
                    value={departamento}
                    onChange={setDepartamento}
                    placeholder='Selecciona departamento'
                  />
                </div>
              ) : (
                // Placeholder disabled input
                <div className='h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-muted/50'>
                  {tipoAlcance === 'MASIVA'
                    ? 'Alcance Masivo Seleccionado'
                    : 'Seleccione alcance específico'}
                </div>
              )}
            </div>
          </div>

          {/* Fila 2 */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='space-y-2'>
              <Label
                className={
                  validationErrors.fechaInicio ? 'text-destructive' : ''
                }
              >
                Desde
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !fechaInicio && 'text-muted-foreground',
                      validationErrors.fechaInicio &&
                        'border-destructive ring-destructive'
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
              <Label>
                <span
                  className={
                    validationErrors.fechaFin ? 'text-destructive' : ''
                  }
                >
                  Hasta{' '}
                </span>
                <span className='text-xs text-muted-foreground'>
                  (Opcional)
                </span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !fechaFin && 'text-muted-foreground',
                      validationErrors.fechaFin &&
                        'border-destructive ring-destructive'
                    )}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {fechaFin ? (
                      format(fechaFin, 'PPP', { locale: es })
                    ) : (
                      <span>Igual a fecha inicio</span>
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

          <div className='flex justify-start gap-2 pt-2'>
            <Button onClick={onSearchClick} size='sm'>
              <Search className='h-4 w-4 mr-2' />
              Buscar
            </Button>
            <Button variant='outline' onClick={handleClearFilters} size='sm'>
              <X className='h-4 w-4 mr-2' />
              Limpiar
            </Button>
          </div>

          {error && (
            <Alert variant='destructive' className='mt-4'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
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

          {/* error display moved to filter card */}

          <DataTable
            data={sortedRows}
            columns={columns}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => {
              setPage(p);
              setTriggerSearch((prev) => prev + 1);
            }}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            emptyMessage={
              !hasSearched
                ? 'Utilice los filtros para buscar.'
                : loading
                  ? 'Cargando...'
                  : 'No se encontraron justificaciones con los filtros seleccionados.'
            }
          />
        </div>
      </EnhancedCard>
    </div>
  );
}
