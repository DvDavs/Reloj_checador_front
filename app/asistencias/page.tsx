'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format, parse, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, Plus, Filter } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { BreadcrumbNav } from '@/app/components/shared/breadcrumb-nav';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  AsistenciaRecord,
  AsistenciaFilters,
  buscarAsistenciasConsolidadas,
  getEstatusDisponibles,
  EstatusDisponible,
} from '@/lib/api/asistencia.api';
import { DepartmentSearch } from '@/components/admin/DepartmentSearch';
import { ConsolidacionManualForm } from '@/components/admin/ConsolidacionManualForm';
import { useTableState } from '@/app/hooks/use-table-state';
import { DataTable } from '@/app/components/shared/data-table';
import { useToast } from '@/components/ui/use-toast';
import { InlineJustificacionModal } from './components/InlineJustificacionModal';

export default function ControlAsistenciaPage() {
  const { toast } = useToast();
  // Estado de filtros
  const [fechaDesde, setFechaDesde] = useState<Date | undefined>(undefined);
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>(undefined);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [personaQuery, setPersonaQuery] = useState<string>(''); // nombre o tarjeta
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
  useEffect(() => {
    (async () => {
      try {
        const estatus = await getEstatusDisponibles();
        setEstatusDisponibles(estatus);
      } catch (e) {
        // noop
      }
    })();
  }, []);

  // Carga por defecto: registros de ayer
  useEffect(() => {
    const yesterday = subDays(new Date(), 1);
    setFechaDesde(yesterday);
    setFechaHasta(yesterday);
    setDateRange({ from: yesterday, to: yesterday });
  }, []);

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

      // Resolver filtro por persona (nombre o tarjeta)
      const q = personaQuery.trim();
      if (q) {
        const isNumeric = /^\d+$/.test(q);
        if (isNumeric) {
          filters.numeroTarjeta = q;
        } else if (q.length >= 3) {
          try {
            // Buscar empleado por nombre y, si hay coincidencia única, usar su ID
            const { searchEmployees } = await import('@/lib/api');
            const results = await searchEmployees(q);
            if (results.length === 1) {
              filters.empleadoId = results[0].id;
            }
          } catch (_) {
            // ignorar errores de búsqueda de empleado
          }
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
    personaQuery,
    handlePageChange,
  ]);

  // Ejecutar búsqueda inicial cuando se setean fechas por defecto
  useEffect(() => {
    if (fechaDesde && fechaHasta) {
      runSearch();
    }
  }, [fechaDesde, fechaHasta, runSearch]);

  // Columnas de la tabla según requerimientos
  const columns = useMemo(
    () => [
      {
        key: 'fecha',
        label: 'Fecha',
        sortable: true,
        render: (item: AsistenciaRecord) => (
          <div className='whitespace-nowrap'>
            <div>
              {format(
                parse(item.fecha, 'yyyy-MM-dd', new Date()),
                'dd/MM/yyyy',
                { locale: es }
              )}
            </div>
            <div className='text-xs text-muted-foreground'>
              Tarjeta: {item.empleadoTarjeta ?? 'N/A'}
            </div>
          </div>
        ),
      },
      {
        key: 'empleadoNombre',
        label: 'Empleado',
        sortable: true,
        render: (item: AsistenciaRecord) => (
          <div className='whitespace-nowrap'>{item.empleadoNombre}</div>
        ),
      },
      {
        key: 'horaEntradaReal',
        label: 'Hora Entrada',
        sortable: true,
        render: (item: AsistenciaRecord) => {
          const raw = item.horaEntradaReal || item.horaEntrada;
          if (!raw) return '--:--';
          const normalized = raw.replace(' ', 'T');
          try {
            return format(
              parse(normalized, "yyyy-MM-dd'T'HH:mm:ss", new Date()),
              'HH:mm'
            );
          } catch (_) {
            return '--:--';
          }
        },
      },
      {
        key: 'horaSalidaReal',
        label: 'Hora Salida',
        sortable: true,
        render: (item: AsistenciaRecord) => {
          const raw = item.horaSalidaReal || item.horaSalida;
          if (!raw) return '--:--';
          const normalized = raw.replace(' ', 'T');
          try {
            return format(
              parse(normalized, "yyyy-MM-dd'T'HH:mm:ss", new Date()),
              'HH:mm'
            );
          } catch (_) {
            return '--:--';
          }
        },
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
        key: 'justificacion',
        label: 'Justificación',
        render: () => 'N/A',
      },
      {
        key: 'observaciones',
        label: 'Observaciones',
        render: (item: AsistenciaRecord) => item.observaciones || '',
      },
      {
        key: 'acciones',
        label: 'Acciones',
        render: (item: AsistenciaRecord) => (
          <div className='flex gap-2'>
            <Button variant='ghost' size='icon' title='Ver Detalle'>
              <Eye className='h-4 w-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              title='Agregar Justificación'
              onClick={() => {
                setSelectedForJust(item);
                setJustModalOpen(true);
              }}
            >
              <Plus className='h-4 w-4' />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className='p-8'>
      <div className='max-w-7xl mx-auto space-y-8'>
        <header className='mb-2'>
          <BreadcrumbNav items={[{ label: 'Control de Asistencia' }]} />
          <h1 className='text-3xl font-bold'>Control de Asistencia</h1>
          <p className='text-muted-foreground'>
            Visualice resultados de asistencia procesados y ejecute
            consolidaciones.
          </p>
        </header>

        {/* Submenú: Acciones rápidas */}
        <section className='space-y-4'>
          <Tabs defaultValue='busqueda'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='busqueda'>
                Resultados de Asistencia
              </TabsTrigger>
              <TabsTrigger value='generacion'>
                Generación de Asistencias
              </TabsTrigger>
            </TabsList>

            <TabsContent value='busqueda' className='space-y-4'>
              {/* Filtros de Búsqueda */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Filter className='h-5 w-5' />
                    Filtros de Búsqueda
                  </CardTitle>
                  <CardDescription>
                    Filtre por rango de fechas, nombre o tarjeta, departamento y
                    estatus.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {error && (
                    <Alert variant='destructive'>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 items-end'>
                    {/* Rango de Fechas compacto */}
                    <div className='lg:col-span-3'>
                      <Label>Rango de Fechas</Label>
                      <div className='flex items-center gap-2'>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant='outline'
                              size='icon'
                              className='h-10 w-10'
                            >
                              <CalendarIcon className='h-4 w-4' />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className='w-auto p-0' align='start'>
                            <Calendar
                              mode='range'
                              selected={dateRange}
                              onSelect={(r) => {
                                setDateRange(r || undefined);
                                const from = r?.from;
                                const to = r?.to || r?.from;
                                setFechaDesde(from || undefined);
                                setFechaHasta(to || undefined);
                              }}
                              numberOfMonths={2}
                            />
                          </PopoverContent>
                        </Popover>
                        <div className='text-sm text-muted-foreground'>
                          {fechaDesde && fechaHasta
                            ? `${format(fechaDesde, 'dd/MM/yyyy')} - ${format(fechaHasta, 'dd/MM/yyyy')}`
                            : 'Seleccione rango'}
                        </div>
                      </div>
                    </div>

                    {/* Nombre o Tarjeta */}
                    <div className='lg:col-span-3'>
                      <Label>Nombre o No. Tarjeta</Label>
                      <Input
                        placeholder='Ej. Juan Pérez o 6001'
                        value={personaQuery}
                        onChange={(e) => setPersonaQuery(e.target.value)}
                      />
                    </div>

                    {/* Departamento */}
                    <div className='lg:col-span-3'>
                      <Label>Departamento</Label>
                      <DepartmentSearch
                        value={departamento}
                        onChange={setDepartamento as any}
                      />
                    </div>

                    {/* Estatus */}
                    <div className='lg:col-span-3'>
                      <Label>Estatus</Label>
                      <select
                        className='w-full border rounded-md h-10 px-3 bg-background'
                        value={estatusSeleccionado?.id?.toString() || 'ALL'}
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
                    <Button onClick={runSearch} disabled={loading}>
                      {loading ? 'Buscando...' : 'Buscar'}
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() => {
                        const yesterday = subDays(new Date(), 1);
                        setFechaDesde(yesterday);
                        setFechaHasta(yesterday);
                        setDateRange({ from: yesterday, to: yesterday });
                        setPersonaQuery('');
                        setDepartamento(null);
                        setEstatusSeleccionado(null);
                      }}
                      disabled={loading}
                    >
                      Limpiar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tabla de Resultados */}
              <Card>
                <CardHeader>
                  <CardTitle>Resultados de Asistencia</CardTitle>
                  <CardDescription>
                    Mostrando registros{' '}
                    {asistencias.length > 0
                      ? `${(currentPage - 1) * 50 + 1}-${Math.min(currentPage * 50, asistencias.length)}`
                      : '0-0'}{' '}
                    de {asistencias.length}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable
                    data={paginatedData}
                    columns={columns}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    onPageChange={handlePageChange}
                    emptyMessage='No hay asistencias para los filtros seleccionados.'
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='generacion'>
              <Card>
                <CardHeader>
                  <CardTitle>Generación de Asistencias</CardTitle>
                  <CardDescription>
                    Procese o reprocese las checadas de una fecha específica
                    para generar resultados de asistencia.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ConsolidacionManualForm
                    titleOverride='Generación de Asistencias por Fecha'
                    descriptionOverride='Seleccione una fecha para generar o regenerar asistencias diarias.'
                    actionLabelOverride='Generar Asistencias'
                    confirmTitleOverride='¿Confirmar Generación?'
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

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
