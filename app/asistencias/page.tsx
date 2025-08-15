'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { format, parse, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Eye,
  Plus,
  Filter,
  Search,
  Calendar as CalendarIcon,
  DatabaseZap,
} from 'lucide-react';

import { BreadcrumbNav } from '@/app/components/shared/breadcrumb-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { cn } from '@/lib/utils';

// Componentes mejorados
import { PageLayout } from '@/app/components/shared/page-layout';
import { EnhancedCard } from '@/app/components/shared/enhanced-card';
import { EnhancedTable } from '@/app/components/shared/enhanced-table';
import { EnhancedBadge } from '@/app/components/shared/enhanced-badge';
import { ActionButtons } from '@/app/components/shared/action-buttons';

import {
  AsistenciaRecord,
  AsistenciaFilters,
  buscarAsistenciasConsolidadas,
  getEstatusDisponibles,
  EstatusDisponible,
} from '@/lib/api/asistencia.api';
import { DepartmentSearchableSelect } from '@/app/components/shared/department-searchable-select';
import { ConsolidacionManualForm } from '@/components/admin/ConsolidacionManualForm';
import { useTableState } from '@/app/hooks/use-table-state';
import { DataTable } from '@/app/components/shared/data-table';
import { InlineJustificacionModal } from './components/InlineJustificacionModal';
import { EmployeeSearch } from '@/app/components/shared/employee-search';
import type { EmpleadoSimpleDTO } from '@/app/horarios/asignados/registrar/types';

export default function ControlAsistenciaPage() {
  // Estado de filtros
  const [fechaDesde, setFechaDesde] = useState<Date | undefined>(undefined);
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>(undefined);
  const [empleado, setEmpleado] = useState<EmpleadoSimpleDTO | null>(null);
  const [tarjeta, setTarjeta] = useState<string>('');
  const [departamento, setDepartamento] = useState<{
    clave: string;
    nombre: string;
  } | null>(null);
  const [estatusDisponibles, setEstatusDisponibles] = useState<
    EstatusDisponible[]
  >([]);
  const [estatusSeleccionado, setEstatusSeleccionado] =
    useState<EstatusDisponible | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asistencias, setAsistencias] = useState<AsistenciaRecord[]>([]);
  const [justModalOpen, setJustModalOpen] = useState(false);
  const [selectedForJust, setSelectedForJust] =
    useState<AsistenciaRecord | null>(null);
  const [activeView, setActiveView] = useState<'gestion' | 'consolidacion'>(
    'gestion'
  );

  // Tabla: paginación 50 por defecto
  const {
    paginatedData,
    currentPage,
    totalPages,
    sortField,
    sortDirection,
    handleSort,
    handlePageChange,
  } = useTableState<AsistenciaRecord>({
    data: asistencias,
    itemsPerPage: 50,
    defaultSortField: 'fecha',
  });

  // Carga estatus disponibles una vez
  const loadEstatusDisponibles = useCallback(async () => {
    if (estatusDisponibles.length > 0) return;
    try {
      const estatus = await getEstatusDisponibles();
      setEstatusDisponibles(estatus);
    } catch (e) {
      // noop
    }
  }, [estatusDisponibles.length]);

  // No cargar por defecto: esperar a que el usuario presione Buscar

  const runSearch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: AsistenciaFilters = {
        fechaInicio: fechaDesde ? format(fechaDesde, 'yyyy-MM-dd') : undefined,
        fechaFin: fechaHasta ? format(fechaHasta, 'yyyy-MM-dd') : undefined,
        departamentoClave: departamento?.clave,
        estatusClave: estatusSeleccionado?.clave,
      };

      // Resolver filtros de Empleado y Tarjeta separados
      if (empleado?.id) {
        filters.empleadoId = empleado.id;
      } else if (tarjeta.trim()) {
        const isNumeric = /^\d+$/.test(tarjeta.trim());
        if (isNumeric) {
          filters.numeroTarjeta = tarjeta.trim();
        }
      }
      const result = await buscarAsistenciasConsolidadas(filters);
      setAsistencias(result);
      handlePageChange(1);
    } catch (e: any) {
      setError(e?.message || 'Error al buscar asistencias');
      setAsistencias([]);
    } finally {
      setLoading(false);
    }
  }, [
    fechaDesde,
    fechaHasta,
    departamento,
    estatusSeleccionado,
    empleado,
    tarjeta,
    handlePageChange,
  ]);

  // No ejecutar búsqueda inicial automática

  // Columnas de la tabla mejoradas
  const columns = useMemo(
    () => [
      {
        key: 'fecha',
        label: 'Fecha',
        sortable: true,
        className: 'font-medium text-foreground',
        render: (value: any, item: AsistenciaRecord) => (
          <div className='space-y-1'>
            <div className='font-semibold'>
              {format(
                parse(item.fecha, 'yyyy-MM-dd', new Date()),
                'dd/MM/yyyy',
                { locale: es }
              )}
            </div>
            <div className='text-xs'>
              <span className='bg-muted px-2 py-1 rounded-full text-muted-foreground font-mono'>
                #{item.empleadoTarjeta ?? 'N/A'}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: 'empleadoNombre',
        label: 'Empleado',
        sortable: true,
        className: 'font-medium text-foreground',
        render: (value: any) => <div className='font-medium'>{value}</div>,
      },
      {
        key: 'horaEntradaReal',
        label: 'Hora Entrada',
        sortable: true,
        className: 'text-center',
        render: (value: any, item: AsistenciaRecord) => {
          const raw = item.horaEntradaReal || item.horaEntrada;
          if (!raw) return <span className='text-muted-foreground'>--:--</span>;
          const normalized = raw.replace(' ', 'T');
          try {
            const time = format(
              parse(normalized, "yyyy-MM-dd'T'HH:mm:ss", new Date()),
              'HH:mm'
            );
            return (
              <span className='font-mono font-semibold text-green-600 dark:text-green-400'>
                {time}
              </span>
            );
          } catch (_) {
            return <span className='text-muted-foreground'>--:--</span>;
          }
        },
      },
      {
        key: 'horaSalidaReal',
        label: 'Hora Salida',
        sortable: true,
        className: 'text-center',
        render: (value: any, item: AsistenciaRecord) => {
          const raw = item.horaSalidaReal || item.horaSalida;
          if (!raw) return <span className='text-muted-foreground'>--:--</span>;
          const normalized = raw.replace(' ', 'T');
          try {
            const time = format(
              parse(normalized, "yyyy-MM-dd'T'HH:mm:ss", new Date()),
              'HH:mm'
            );
            return (
              <span className='font-mono font-semibold text-red-600 dark:text-red-400'>
                {time}
              </span>
            );
          } catch (_) {
            return <span className='text-muted-foreground'>--:--</span>;
          }
        },
      },
      {
        key: 'estatusAsistenciaNombre',
        label: 'Estatus',
        sortable: true,
        render: (value: any) => (
          <EnhancedBadge
            variant={
              value?.toLowerCase().includes('justificada')
                ? 'info'
                : value?.toLowerCase().includes('presente')
                  ? 'success'
                  : value?.toLowerCase().includes('falta')
                    ? 'error'
                    : value?.toLowerCase().includes('retardo')
                      ? 'warning'
                      : 'info'
            }
            size='sm'
          >
            {value}
          </EnhancedBadge>
        ),
      },
      {
        key: 'justificacion',
        label: 'Justificación',
        className: 'text-muted-foreground',
        render: () => <span className='text-muted-foreground'>N/A</span>,
      },
      {
        key: 'observaciones',
        label: 'Observaciones',
        className: 'text-muted-foreground max-w-32 truncate',
        render: (value: any) => (
          <span className='text-muted-foreground' title={value || ''}>
            {value || '--'}
          </span>
        ),
      },
      {
        key: 'acciones',
        label: 'Acciones',
        className: 'text-right',
        render: (value: any, item: AsistenciaRecord) => (
          <ActionButtons
            buttons={[
              {
                icon: <Eye className='h-4 w-4' />,
                onClick: () => {}, // TODO: Implementar ver detalle
                variant: 'view',
                title: 'Ver Detalle',
              },
              {
                icon: <Plus className='h-4 w-4' />,
                onClick: () => {
                  setSelectedForJust(item);
                  setJustModalOpen(true);
                },
                variant: 'edit',
                title: 'Agregar Justificación',
              },
            ]}
          />
        ),
      },
    ],
    [setSelectedForJust, setJustModalOpen]
  );

  return (
    <div className='p-6 md:p-8'>
      <div className='max-w-7xl mx-auto space-y-6'>
        {/* Header mejorado */}
        <EnhancedCard variant='elevated' padding='lg'>
          <div className='space-y-1'>
            <h1 className='text-2xl md:text-3xl font-bold text-foreground tracking-tight'>
              Control de Asistencia
            </h1>
            <div className='h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full'></div>
          </div>
        </EnhancedCard>

        {/* Información de funcionalidades (actúa como botones) */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <EnhancedCard
            variant='bordered'
            padding='md'
            hover
            role='button'
            tabIndex={0}
            onClick={() => setActiveView('gestion')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveView('gestion');
              }
            }}
            className={`cursor-pointer ${activeView === 'gestion' ? 'ring-2 ring-primary/60 border-primary/60 bg-primary/5' : ''}`}
          >
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30'>
                <Search className='h-5 w-5 text-blue-600 dark:text-blue-400' />
              </div>
              <div>
                <h3 className='font-semibold text-foreground'>
                  Gestión de Asistencias
                </h3>
                <p className='text-sm text-muted-foreground'>
                  Filtre, revise y corrija registros existentes
                </p>
              </div>
            </div>
          </EnhancedCard>

          <EnhancedCard
            variant='bordered'
            padding='md'
            hover
            role='button'
            tabIndex={0}
            onClick={() => setActiveView('consolidacion')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveView('consolidacion');
              }
            }}
            className={`cursor-pointer ${activeView === 'consolidacion' ? 'ring-2 ring-primary/60 border-primary/60 bg-primary/5' : ''}`}
          >
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-green-100 rounded-lg dark:bg-green-900/30'>
                <DatabaseZap className='h-5 w-5 text-green-600 dark:text-green-400' />
              </div>
              <div>
                <h3 className='font-semibold text-foreground'>
                  Consolidación de Asistencia
                </h3>
                <p className='text-sm text-muted-foreground'>
                  Ejecute la consolidación diaria por fecha
                </p>
              </div>
            </div>
          </EnhancedCard>
        </div>

        {activeView === 'gestion' ? (
          <div className='space-y-6 mt-6'>
            {/* Filtros de Búsqueda */}
            <EnhancedCard variant='bordered' padding='lg'>
              <div className='space-y-4'>
                <div className='flex items-center gap-2 mb-4'>
                  <Filter className='h-5 w-5 text-primary' />
                  <h3 className='text-lg font-semibold text-foreground'>
                    Filtros de Búsqueda
                  </h3>
                </div>
                <p className='text-muted-foreground text-sm mb-6'>
                  Filtre por fechas, empleado o tarjeta, departamento y estatus.
                </p>
                {error && (
                  <Alert variant='destructive'>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Fila 1: Empleado / Departamento */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Empleado</Label>
                    <EmployeeSearch value={empleado} onChange={setEmpleado} />
                  </div>
                  <div className='space-y-2'>
                    <Label>Departamento</Label>
                    <DepartmentSearchableSelect
                      value={departamento}
                      onChange={setDepartamento as any}
                    />
                  </div>
                </div>

                {/* Fila 2: Fecha Inicio / Fecha Fin */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Fecha Inicio</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !fechaDesde && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className='mr-2 h-4 w-4' />
                          {fechaDesde ? (
                            format(fechaDesde, 'PPP', { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0'>
                        <Calendar
                          mode='single'
                          selected={fechaDesde}
                          onSelect={(d) => setFechaDesde(d || undefined)}
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
                            !fechaHasta && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className='mr-2 h-4 w-4' />
                          {fechaHasta ? (
                            format(fechaHasta, 'PPP', { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0'>
                        <Calendar
                          mode='single'
                          selected={fechaHasta}
                          onSelect={(d) => setFechaHasta(d || undefined)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Fila 3: Tarjeta / Estatus */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Número de Tarjeta</Label>
                    <Input
                      placeholder='Ej. 6001'
                      inputMode='numeric'
                      pattern='[0-9]*'
                      value={tarjeta}
                      onChange={(e) => setTarjeta(e.target.value)}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Estatus</Label>
                    <select
                      className='w-full border rounded-md h-10 px-3 bg-background'
                      value={estatusSeleccionado?.id?.toString() || 'ALL'}
                      onFocus={loadEstatusDisponibles}
                      onChange={(e) => {
                        if (e.target.value === 'ALL')
                          setEstatusSeleccionado(null);
                        else {
                          const found =
                            estatusDisponibles.find(
                              (x) => x.id.toString() === e.target.value
                            ) || null;
                          setEstatusSeleccionado(found);
                        }
                      }}
                    >
                      <option value='ALL'>Todos</option>
                      {estatusDisponibles.map((e) => (
                        <option key={e.id} value={e.id.toString()}>
                          {e.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className='flex gap-3'>
                  <Button
                    onClick={runSearch}
                    disabled={loading}
                    className='bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200'
                  >
                    <Search className='mr-2 h-4 w-4' />
                    {loading ? 'Buscando...' : 'Buscar'}
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setFechaDesde(undefined);
                      setFechaHasta(undefined);
                      setEmpleado(null);
                      setTarjeta('');
                      setDepartamento(null);
                      setEstatusSeleccionado(null);
                    }}
                    disabled={loading}
                    className='border-2 border-border hover:border-primary hover:bg-primary/5'
                  >
                    Limpiar
                  </Button>
                </div>
              </div>
            </EnhancedCard>

            {/* Tabla de Resultados */}
            <EnhancedCard variant='elevated' padding='lg'>
              <div className='space-y-4'>
                <div>
                  <h3 className='text-lg font-semibold text-foreground'>
                    Resultados de Asistencia
                  </h3>
                  <p className='text-muted-foreground text-sm'>
                    Mostrando registros{' '}
                    {asistencias.length > 0
                      ? `${(currentPage - 1) * 50 + 1}-${Math.min(currentPage * 50, asistencias.length)}`
                      : '0-0'}{' '}
                    de {asistencias.length}
                  </p>
                </div>

                <EnhancedTable
                  columns={columns}
                  data={paginatedData}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  emptyState={{
                    icon: <Search className='h-8 w-8' />,
                    title: 'No hay asistencias para mostrar',
                    description:
                      'Utiliza los filtros de búsqueda para encontrar registros de asistencia',
                  }}
                />

                {totalPages > 1 && (
                  <div className='mt-6 flex justify-center'>
                    <div className='flex items-center space-x-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <span className='text-sm text-muted-foreground'>
                        Página {currentPage} de {totalPages}
                      </span>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </EnhancedCard>
          </div>
        ) : (
          <div className='mt-6'>
            <ConsolidacionManualForm />
          </div>
        )}

        <InlineJustificacionModal
          open={justModalOpen}
          onOpenChange={setJustModalOpen}
          asistencia={selectedForJust}
          onSuccess={() => {
            // volver a cargar los datos del rango actual
            runSearch();
          }}
        />
      </div>
    </div>
  );
}
