'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Filter,
  Calendar as CalendarIcon,
  Download,
  FileText,
  Clock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';

import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/apiClient';

// Componentes mejorados
// Removed PageLayout as it was causing TS errors and is not used in the reference page (app/asistencias/page.tsx)
import { EnhancedCard } from '@/app/components/shared/enhanced-card';
import { DepartmentSearchableSelect } from '@/app/components/shared/department-searchable-select';
import { EmployeeSearch } from '@/app/components/shared/employee-search';

// Tipos y DTOs (asumiendo que existen o se definen aquí)
// Aligned with app/asistencias/page.tsx types
type Departamento = { clave: string; nombre: string } | null;
type EmpleadoSimpleDTO = { id: number; nombreCompleto: string } | null; // Changed to match EmployeeSearch expectation
type EstatusDisponible = { clave: string; nombre: string };
type TipoRegistro = { id: number; name: string };

const FALTAS_KEYS = ['FC', 'FE', 'FS'];
const EXCLUDED_KEYS = ['FR', 'ST']; // Fuera de rango, Salida temprana. "Horas incompletas" might be derived or another key.

export default function ReportesPage() {
  // const { toast } = useToast(); // Removed unused toast hook if we use setError
  const [activeTab, setActiveTab] = useState<'completa' | 'jornadas'>(
    'completa'
  );
  const [modoFiltro, setModoFiltro] = useState<
    'departamento' | 'usuario' | 'global'
  >('departamento');

  const [departamento, setDepartamento] = useState<Departamento>(null);
  const [empleado, setEmpleado] = useState<EmpleadoSimpleDTO>(null);

  const [fechaDesde, setFechaDesde] = useState<Date | undefined>(undefined);
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>(undefined);
  const [formato, setFormato] = useState('xlsx');

  // Filtros adicionales
  // Refactored Status State
  const [categoriaEstatus, setCategoriaEstatus] = useState<
    'TODOS' | 'ASISTENCIA' | 'FALTA'
  >('TODOS');
  const [tiposAsistenciaSeleccionados, setTiposAsistenciaSeleccionados] =
    useState<string[]>([]);

  const [tipoRegistroId, setTipoRegistroId] = useState<number | ''>('');
  const [esJefe, setEsJefe] = useState(false);
  const [tipoEoS, setTipoEoS] = useState<'E' | 'S' | ''>('');

  // Para selects simples
  const [tipoFuentes, setTipoFuentes] = useState<TipoRegistro[]>([
    { id: 1, name: 'Huella' },
    { id: 2, name: 'PIN' },
    { id: 3, name: 'Manual' },
  ]);
  const [estatusOptions, setEstatusOptions] = useState<EstatusDisponible[]>([]);
  const [loadingEstatus, setLoadingEstatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Constants for status grouping
  // Moved outside component to avoid dependency issues or useMemo

  // Cargar estatus disponibles desde backend
  useEffect(() => {
    const loadEstatus = async () => {
      if (loadingEstatus || estatusOptions.length > 0) return;
      setLoadingEstatus(true);
      setError(null);
      try {
        const response = await apiClient.get(
          '/api/asistencias/estatus/disponibles'
        );
        const data = response?.data?.data || response?.data || [];
        let opts = Array.isArray(data)
          ? data.map((x: any) => ({
              clave: x.clave ?? x.key ?? '',
              nombre: x.nombre ?? x.name ?? '',
            }))
          : [];

        // Filter and Rename
        opts = opts.filter(
          (o: EstatusDisponible) => !EXCLUDED_KEYS.includes(o.clave)
        );
        opts = opts.map((o: EstatusDisponible) => ({
          ...o,
          nombre:
            o.nombre === 'Falta justificada'
              ? 'Asistencia justificada'
              : o.nombre,
        }));

        setEstatusOptions(opts);

        // Initialize selected assistance types (all non-falta types)
        const asistenciaKeys = opts
          .filter((o: EstatusDisponible) => !FALTAS_KEYS.includes(o.clave))
          .map((o: EstatusDisponible) => o.clave);
        setTiposAsistenciaSeleccionados(asistenciaKeys);
      } catch (err: any) {
        console.error('Error fetching estatus:', err);
        setError('Error al cargar los estatus disponibles.');
      } finally {
        setLoadingEstatus(false);
      }
    };
    loadEstatus();
  }, [loadingEstatus, estatusOptions.length]);

  const downloadReport = useCallback(async () => {
    setError(null);
    if (!fechaDesde || !fechaHasta) {
      setError('Por favor, selecciona un rango de fechas.');
      return;
    }
    if (fechaDesde > fechaHasta) {
      setError('La fecha de inicio no puede ser mayor a la fecha de fin.');
      return;
    }
    try {
      const params = new URLSearchParams();
      params.append('desde', format(fechaDesde, 'yyyy-MM-dd'));
      params.append('hasta', format(fechaHasta, 'yyyy-MM-dd'));
      params.append('formato', formato);

      // Filtro por modo
      if (modoFiltro === 'departamento') {
        if (!departamento?.clave) {
          setError('Es necesario seleccionar un departamento.');
          return;
        }
        params.append('departamentoClave', departamento.clave);
      } else if (modoFiltro === 'usuario') {
        if (!empleado?.id) {
          setError('Es necesario seleccionar un empleado.');
          return;
        }
        params.append('empleadoId', String(empleado.id));
      }
      // If global, we don't send department or employee

      let url = '/api/reportes/asistencias';

      if (activeTab === 'completa') {
        // Status Logic
        if (categoriaEstatus === 'FALTA' || categoriaEstatus === 'ASISTENCIA') {
          tiposAsistenciaSeleccionados.forEach((k) =>
            params.append('estatusClave', k)
          );
        }
        // If TODOS, we send nothing (implies all)

        if (tipoRegistroId)
          params.append('tipoRegistroId', String(tipoRegistroId));
      } else {
        // jornadas
        if (tipoRegistroId)
          params.append('tipoRegistroId', String(tipoRegistroId));
        if (esJefe) params.append('esJefe', 'true');
        if (tipoEoS) params.append('tipo', tipoEoS);
        url = '/api/reportes/registros';
      }

      const res = await apiClient.get(`${url}?${params.toString()}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], {
        type: res.headers['content-type'] || 'application/octet-stream',
      });
      const link = document.createElement('a');
      const contentDisposition = res.headers['content-disposition'];
      let filename = '';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) {
          filename = match[1];
        }
      }
      if (!filename) {
        filename = `${activeTab}_${format(fechaDesde, 'yyyyMMdd')}_${format(fechaHasta, 'yyyyMMdd')}.${formato}`;
      }
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(link.href);
    } catch (err: any) {
      console.error(err);
      setError('Error generando el reporte: ' + (err.message || ''));
      alert('Error generando el reporte: ' + (err.message || ''));
    }
  }, [
    fechaDesde,
    fechaHasta,
    formato,
    modoFiltro,
    departamento,
    empleado,
    activeTab,
    categoriaEstatus,
    tiposAsistenciaSeleccionados,
    tipoRegistroId,
    esJefe,
    tipoEoS,
  ]);

  const handleClearFilters = () => {
    setDepartamento(null);
    setEmpleado(null);
    setFechaDesde(undefined);
    setFechaHasta(undefined);
    setFormato('xlsx');
    setCategoriaEstatus('TODOS');
    setTiposAsistenciaSeleccionados([]);

    setTipoRegistroId('');
    setEsJefe(false);
    setTipoEoS('');
    setActiveTab('completa');
    setModoFiltro('departamento');
    setError(null);
  };

  return (
    <div className='min-h-screen bg-background'>
      <div className='p-6 md:p-8'>
        <div className='max-w-7xl mx-auto space-y-6'>
          {/* Replaced PageLayout with a div for consistent styling */}
          <EnhancedCard variant='elevated' padding='lg'>
            <div className='space-y-1'>
              <h1 className='text-2xl md:text-3xl font-bold text-foreground tracking-tight'>
                Reportes
              </h1>
              <div className='h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full'></div>
            </div>
          </EnhancedCard>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-6'>
            {/* Tab selection removed as per request */}
          </div>
          <EnhancedCard variant='bordered' padding='lg' className='mt-6'>
            <div className='space-y-4'>
              <div className='flex items-center gap-2 mb-4'>
                <Filter className='h-5 w-5 text-primary' />
                <h3 className='text-lg font-semibold text-foreground'>
                  Filtros de Búsqueda
                </h3>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Filtrar por</Label>
                  <Select
                    value={modoFiltro}
                    onValueChange={(val) => setModoFiltro(val as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Selecciona cómo filtrar' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='departamento'>Departamento</SelectItem>
                      <SelectItem value='usuario'>Usuario</SelectItem>
                      <SelectItem value='global'>Global</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div
                  className={cn(
                    'space-y-2',
                    modoFiltro === 'global' &&
                      'opacity-50 pointer-events-none grayscale'
                  )}
                >
                  {modoFiltro === 'usuario' ? (
                    <>
                      <Label
                        className={error && !empleado ? 'text-destructive' : ''}
                      >
                        Empleado
                      </Label>
                      <div
                        className={cn(
                          error &&
                            !empleado &&
                            'rounded-md ring-2 ring-destructive'
                        )}
                      >
                        <EmployeeSearch
                          value={empleado}
                          onChange={setEmpleado}
                          placeholder='Buscar empleado...'
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <Label
                        className={
                          error && !departamento ? 'text-destructive' : ''
                        }
                      >
                        Departamento
                      </Label>
                      <div
                        className={cn(
                          error &&
                            !departamento &&
                            'rounded-md ring-2 ring-destructive'
                        )}
                      >
                        <DepartmentSearchableSelect
                          value={departamento}
                          onChange={setDepartamento}
                          placeholder='Selecciona departamento'
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label
                    className={error && !fechaDesde ? 'text-destructive' : ''}
                  >
                    Fecha Inicio
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !fechaDesde && 'text-muted-foreground',
                          error &&
                            !fechaDesde &&
                            'border-destructive ring-destructive'
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
                  <Label
                    className={error && !fechaHasta ? 'text-destructive' : ''}
                  >
                    Fecha Fin
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !fechaHasta && 'text-muted-foreground',
                          error &&
                            !fechaHasta &&
                            'border-destructive ring-destructive'
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

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-4 col-span-1 md:col-span-2'>
                  <Label>Estatus</Label>
                  <div className='flex flex-wrap gap-4'>
                    <div className='flex items-center space-x-2'>
                      <input
                        type='radio'
                        id='cat_todos'
                        name='categoriaEstatus'
                        checked={categoriaEstatus === 'TODOS'}
                        onChange={() => {
                          setCategoriaEstatus('TODOS');
                          setTiposAsistenciaSeleccionados([]);
                        }}
                        className='h-4 w-4 border-gray-300 text-primary focus:ring-primary'
                      />
                      <Label
                        htmlFor='cat_todos'
                        className='font-normal cursor-pointer'
                      >
                        Todos
                      </Label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <input
                        type='radio'
                        id='cat_asistencia'
                        name='categoriaEstatus'
                        checked={categoriaEstatus === 'ASISTENCIA'}
                        onChange={() => {
                          setCategoriaEstatus('ASISTENCIA');
                          const asistenciaKeys = estatusOptions
                            .filter((o) => !FALTAS_KEYS.includes(o.clave))
                            .map((o) => o.clave);
                          setTiposAsistenciaSeleccionados(asistenciaKeys);
                        }}
                        className='h-4 w-4 border-gray-300 text-primary focus:ring-primary'
                      />
                      <Label
                        htmlFor='cat_asistencia'
                        className='font-normal cursor-pointer'
                      >
                        Asistencia
                      </Label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <input
                        type='radio'
                        id='cat_falta'
                        name='categoriaEstatus'
                        checked={categoriaEstatus === 'FALTA'}
                        onChange={() => {
                          setCategoriaEstatus('FALTA');
                          setTiposAsistenciaSeleccionados(FALTAS_KEYS);
                        }}
                        className='h-4 w-4 border-gray-300 text-primary focus:ring-primary'
                      />
                      <Label
                        htmlFor='cat_falta'
                        className='font-normal cursor-pointer'
                      >
                        Falta
                      </Label>
                    </div>
                  </div>

                  {categoriaEstatus === 'ASISTENCIA' && (
                    <div className='mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border rounded-md bg-muted/20'>
                      {estatusOptions
                        .filter((o) => !FALTAS_KEYS.includes(o.clave))
                        .map((opt) => (
                          <div
                            key={opt.clave}
                            className='flex items-center space-x-2'
                          >
                            <input
                              type='checkbox'
                              id={`sub_${opt.clave}`}
                              checked={tiposAsistenciaSeleccionados.includes(
                                opt.clave
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTiposAsistenciaSeleccionados([
                                    ...tiposAsistenciaSeleccionados,
                                    opt.clave,
                                  ]);
                                } else {
                                  setTiposAsistenciaSeleccionados(
                                    tiposAsistenciaSeleccionados.filter(
                                      (k) => k !== opt.clave
                                    )
                                  );
                                }
                              }}
                              className='h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary'
                            />
                            <Label
                              htmlFor={`sub_${opt.clave}`}
                              className='text-sm font-normal cursor-pointer'
                            >
                              {opt.nombre}
                            </Label>
                          </div>
                        ))}
                    </div>
                  )}

                  {categoriaEstatus === 'FALTA' && (
                    <div className='mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border rounded-md bg-muted/20'>
                      {[
                        { clave: 'FC', nombre: 'Falta Completa' },
                        { clave: 'FE', nombre: 'Falta Entrada' },
                        { clave: 'FS', nombre: 'Falta Salida' },
                      ].map((opt) => (
                        <div
                          key={opt.clave}
                          className='flex items-center space-x-2'
                        >
                          <input
                            type='checkbox'
                            id={`sub_${opt.clave}`}
                            checked={tiposAsistenciaSeleccionados.includes(
                              opt.clave
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTiposAsistenciaSeleccionados([
                                  ...tiposAsistenciaSeleccionados,
                                  opt.clave,
                                ]);
                              } else {
                                setTiposAsistenciaSeleccionados(
                                  tiposAsistenciaSeleccionados.filter(
                                    (k) => k !== opt.clave
                                  )
                                );
                              }
                            }}
                            className='h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary'
                          />
                          <Label
                            htmlFor={`sub_${opt.clave}`}
                            className='text-sm font-normal cursor-pointer'
                          >
                            {opt.nombre}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className='flex flex-col sm:flex-row sm:items-end gap-4 mt-6 pt-4 border-t'>
                <div className='space-y-2 w-full sm:w-48'>
                  <Label>Formato de Descarga</Label>
                  <Select value={formato} onValueChange={setFormato}>
                    <SelectTrigger>
                      <SelectValue placeholder='Selecciona formato' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='xlsx'>Excel (.xlsx)</SelectItem>
                      <SelectItem value='pdf'>PDF (.pdf)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='flex gap-4 w-full sm:w-auto flex-1 justify-start'>
                  <Button
                    variant='outline'
                    onClick={handleClearFilters}
                    className='border-2 border-border hover:border-primary hover:bg-primary/5 w-full sm:w-auto'
                  >
                    Limpiar
                  </Button>
                  <Button
                    onClick={downloadReport}
                    className='w-full sm:w-auto'
                    aria-label='Generar y descargar reporte'
                  >
                    <Download className='mr-2 h-5 w-5' />
                    Exportar Reporte
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant='destructive' className='mt-4'>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </EnhancedCard>
        </div>
      </div>
    </div>
  );
}
