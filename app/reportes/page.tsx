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
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

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

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState<'completa' | 'jornadas'>('completa');
  const [modoFiltro, setModoFiltro] = useState<'departamento' | 'usuario'>('departamento');

  const [departamento, setDepartamento] = useState<Departamento>(null);
  const [empleado, setEmpleado] = useState<EmpleadoSimpleDTO>(null); // Changed state type

  const [fechaDesde, setFechaDesde] = useState<Date | undefined>(undefined);
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>(undefined);
  const [formato, setFormato] = useState('xlsx');

  // Filtros adicionales
  const [estatusClave, setEstatusClave] = useState<string>(''); // opcional para asistencias
  const [tipoRegistroId, setTipoRegistroId] = useState<number | ''>(''); // fuente para jornadas
  const [esJefe, setEsJefe] = useState(false);
  const [tipoEoS, setTipoEoS] = useState<'E' | 'S' | ''>(''); // 'E' o 'S'

  // Para selects simples
  const [tipoFuentes, setTipoFuentes] = useState<TipoRegistro[]>([
    { id: 1, name: 'Huella' },
    { id: 2, name: 'PIN' },
    { id: 3, name: 'Manual' },
  ]);
  const [estatusOptions, setEstatusOptions] = useState<EstatusDisponible[]>([]);
  const [loadingEstatus, setLoadingEstatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar estatus disponibles desde backend
  useEffect(() => {
    const loadEstatus = async () => {
      if (loadingEstatus || estatusOptions.length > 0) return;
      setLoadingEstatus(true);
      setError(null);
      try {
        const response = await apiClient.get('/api/asistencias/estatus/disponibles');
        const data = response?.data?.data || response?.data || [];
        const opts = Array.isArray(data)
          ? data.map((x: any) => ({
              clave: x.clave ?? x.key ?? '',
              nombre: x.nombre ?? x.name ?? '',
            }))
          : [];
        setEstatusOptions(opts);
      } catch (err: any) {
        console.error('Error fetching estatus:', err);
        setError('Error al cargar los estatus disponibles.');
      } finally {
        setLoadingEstatus(false);
      }
    };
    loadEstatus();
  }, [estatusOptions.length, loadingEstatus]);

  const downloadReport = useCallback(async () => {
    if (!fechaDesde || !fechaHasta) {
      alert('Por favor, selecciona un rango de fechas.');
      return;
    }
    try {
      const params = new URLSearchParams();
      params.append('desde', format(fechaDesde, 'yyyy-MM-dd'));
      params.append('hasta', format(fechaHasta, 'yyyy-MM-dd'));
      params.append('formato', formato);

      // Filtro por modo
      if (modoFiltro === 'departamento') {
        if (departamento?.clave) params.append('departamentoClave', departamento.clave);
      } else {
        if (empleado?.id) params.append('empleadoId', String(empleado.id));
      }

      let url = '/api/reportes/asistencias';

      if (activeTab === 'completa') {
        if (estatusClave) params.append('estatusClave', estatusClave);
        if (tipoRegistroId) params.append('tipoRegistroId', String(tipoRegistroId));
        url = '/api/reportes/asistencias';
      } else { // jornadas
        if (tipoRegistroId) params.append('tipoRegistroId', String(tipoRegistroId));
        if (esJefe) params.append('esJefe', 'true');
        if (tipoEoS) params.append('tipo', tipoEoS);
        url = '/api/reportes/registros';
      }

      const res = await apiClient.get(`${url}?${params.toString()}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
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
    estatusClave,
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
    setEstatusClave('');
    setTipoRegistroId('');
    setEsJefe(false);
    setTipoEoS('');
    setActiveTab('completa');
    setModoFiltro('departamento');
    setError(null);
  };

  return (
    <div className="p-6 md:p-8"> {/* Replaced PageLayout with a div for consistent styling */}
      <EnhancedCard variant='elevated' padding='lg'>
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Reportes
          </h1>
          <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full"></div>
        </div>
      </EnhancedCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <EnhancedCard
          variant='bordered'
          padding='md'
          hover
          role='button'
          tabIndex={0}
          onClick={() => setActiveTab('completa')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveTab('completa');
            }
          }}
          className={`cursor-pointer ${activeTab === 'completa' ? 'ring-2 ring-primary/60 border-primary/60 bg-primary/5' : ''}`}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Reporte de Asistencias Completas
              </h3>
              <p className="text-sm text-muted-foreground">
                Detalle de entradas, salidas y estatus por empleado.
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
          onClick={() => setActiveTab('jornadas')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveTab('jornadas');
            }
          }}
          className={`cursor-pointer ${activeTab === 'jornadas' ? 'ring-2 ring-primary/60 border-primary/60 bg-primary/5' : ''}`}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30">
              <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Reporte de Jornadas
              </h3>
              <p className="text-sm text-muted-foreground">
                Detalle de horas trabajadas y registros por fuente.
              </p>
            </div>
          </div>
        </EnhancedCard>
      </div>

      <EnhancedCard variant='bordered' padding='lg' className='mt-6'>
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Filtros de Búsqueda
            </h3>
          </div>
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Filtrar por</Label>
              <Select value={modoFiltro} onValueChange={(val) => setModoFiltro(val as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona cómo filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="departamento">Departamento</SelectItem>
                  <SelectItem value="usuario">Usuario</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              {modoFiltro === 'departamento' ? (
                <>
                  <Label>Departamento</Label>
                  <DepartmentSearchableSelect
                    value={departamento}
                    onChange={setDepartamento}
                    placeholder="Selecciona departamento"
                  />
                </>
              ) : (
                <>
                  <Label>Empleado</Label>
                  <EmployeeSearch
                    value={empleado}
                    onChange={setEmpleado}
                    placeholder="Buscar empleado..."
                  />
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
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
            <div className="space-y-2">
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

          {activeTab === 'completa' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estatus (Opcional)</Label>
                <Select value={estatusClave === '' ? undefined : estatusClave} onValueChange={(val) => setEstatusClave(val === 'ALL' ? '' : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estatus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    {estatusOptions.map((s) => (
                      <SelectItem key={s.clave} value={s.clave}>
                        {s.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fuente de Registro (Opcional)</Label>
                <Select value={tipoRegistroId === '' ? undefined : String(tipoRegistroId)} onValueChange={(val) => setTipoRegistroId(val === 'ALL' ? '' : (val === '' ? '' : Number(val)))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las fuentes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas</SelectItem>
                    {tipoFuentes.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {activeTab === 'jornadas' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Fuente de Registro</Label>
                <Select value={tipoRegistroId === '' ? undefined : String(tipoRegistroId)} onValueChange={(val) => setTipoRegistroId(val === 'ALL' ? '' : (val === '' ? '' : Number(val)))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las fuentes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas</SelectItem>
                    {tipoFuentes.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex items-center pt-6">
                <input
                  id="esJefeCheckbox"
                  type="checkbox"
                  checked={esJefe}
                  onChange={(e) => setEsJefe(e.target.checked)}
                  className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-primary"
                />
                <Label htmlFor="esJefeCheckbox">Es Jefe (ANJ)</Label>
              </div>
              <div className="space-y-2">
                <Label>Tipo (Entrada/Salida)</Label>
                <Select value={tipoEoS === '' ? undefined : tipoEoS} onValueChange={(val) => setTipoEoS(val === 'ALL' ? '' : val as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ambos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Ambos</SelectItem>
                    <SelectItem value="E">Entrada</SelectItem>
                    <SelectItem value="S">Salida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4">
            <div className="space-y-2 w-full sm:w-auto">
              <Label>Formato de Descarga</Label>
              <Select value={formato} onValueChange={setFormato}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                  <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                  <SelectItem value="docx">Word (.docx)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-4 mt-4 sm:mt-0 w-full sm:w-auto">
              <Button onClick={downloadReport} className="shadow-md hover:shadow-lg transition-all duration-200 w-full sm:w-auto">
                <Download className='mr-2 h-4 w-4' />
                Generar y Descargar
              </Button>
              <Button
                variant='outline'
                onClick={handleClearFilters}
                className='border-2 border-border hover:border-primary hover:bg-primary/5 w-full sm:w-auto'
              >
                Limpiar
              </Button>
            </div>
          </div>
        </div>
      </EnhancedCard>
    </div>
  );
}
