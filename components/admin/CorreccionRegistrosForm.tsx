'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Edit,
  Users,
  AlertCircle,
  CheckCircle2,
  Search,
  X,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { DataTableWithSelection } from '@/app/components/shared/data-table-with-selection';
import {
  buscarRegistrosDetalle,
  RegistroDetalle,
  RegistrosDetalleResponse,
} from '@/lib/api/registros-detalle.api';
import { EmpleadoSimpleDTO } from '@/app/horarios/asignados/registrar/types';
import { DepartamentoDto } from '@/lib/api/schedule-api';
import { EmployeeSearch } from '@/app/components/shared/employee-search';
import { DepartmentSearch } from './DepartmentSearch';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CorreccionRegistrosModal } from './CorreccionRegistrosModal';

export function CorreccionRegistrosForm() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    empleado: null as EmpleadoSimpleDTO | null,
    departamento: null as DepartamentoDto | null,
    desde: null as Date | null,
    hasta: null as Date | null,
  });
  const [data, setData] = useState<RegistrosDetalleResponse>({
    content: [],
    totalPages: 0,
    totalElements: 0,
    number: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSearch = useCallback(
    async (page = 0) => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          page,
          size: 10,
          empleadoId: filters.empleado?.id,
          departamentoClave: filters.departamento?.clave,
          desde: filters.desde
            ? format(filters.desde, 'yyyy-MM-dd')
            : undefined,
          hasta: filters.hasta
            ? format(filters.hasta, 'yyyy-MM-dd')
            : undefined,
        };
        const response = await buscarRegistrosDetalle(params);
        setData(response);
        setSelectedIds([]); // Limpiar selección en nueva búsqueda
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const handleClearFilters = () => {
    setFilters({
      empleado: null,
      departamento: null,
      desde: null,
      hasta: null,
    });
    setData({ content: [], totalPages: 0, totalElements: 0, number: 0 });
    setError(null);
    setSelectedIds([]);
  };

  const handleModalSuccess = () => {
    toast({
      title: 'Éxito',
      description: 'Los registros han sido actualizados.',
    });
    handleSearch(data.number); // Recargar la página actual
  };

  const columns = useMemo(
    () => [
      { key: 'id', label: 'ID', sortable: false },
      {
        key: 'empleadoNombre',
        label: 'Empleado',
        render: (item: RegistroDetalle) => (
          <div className='font-medium'>{item.empleadoNombre}</div>
        ),
      },
      {
        key: 'fechaHora',
        label: 'Fecha y Hora',
        render: (item: RegistroDetalle) =>
          format(new Date(item.fechaHora), 'dd/MM/yyyy HH:mm:ss', {
            locale: es,
          }),
      },
      {
        key: 'tipoEoS',
        label: 'Tipo',
        render: (item: RegistroDetalle) => (
          <Badge variant={item.tipoEoS === 'E' ? 'default' : 'secondary'}>
            {item.tipoEoS === 'E' ? 'Entrada' : 'Salida'}
          </Badge>
        ),
      },
      {
        key: 'estatusCalculado',
        label: 'Estatus',
        render: (item: RegistroDetalle) => (
          <Badge variant='outline'>{item.estatusCalculado}</Badge>
        ),
      },
      { key: 'tipoRegistroNombre', label: 'Fuente' },
      {
        key: 'observaciones',
        label: 'Observaciones',
        className: 'max-w-xs truncate',
      },
    ],
    []
  );

  return (
    <>
      <Card className='mb-6'>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Empleado</Label>
              <EmployeeSearch
                value={filters.empleado}
                onChange={(emp) => setFilters((f) => ({ ...f, empleado: emp }))}
              />
            </div>
            <div className='space-y-2'>
              <Label>Departamento</Label>
              <DepartmentSearch
                value={filters.departamento}
                onChange={(dep) =>
                  setFilters((f) => ({ ...f, departamento: dep }))
                }
              />
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Desde</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !filters.desde && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {filters.desde ? (
                      format(filters.desde, 'PPP', { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                  <Calendar
                    mode='single'
                    selected={filters.desde ?? undefined}
                    onSelect={(d) =>
                      setFilters((f) => ({ ...f, desde: d || null }))
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className='space-y-2'>
              <Label>Hasta</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !filters.hasta && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {filters.hasta ? (
                      format(filters.hasta, 'PPP', { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                  <Calendar
                    mode='single'
                    selected={filters.hasta ?? undefined}
                    onSelect={(d) =>
                      setFilters((f) => ({ ...f, hasta: d || null }))
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className='flex gap-2'>
            <Button onClick={() => handleSearch(0)} disabled={loading}>
              <Search className='mr-2 h-4 w-4' />{' '}
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
            <Button variant='outline' onClick={handleClearFilters}>
              <X className='mr-2 h-4 w-4' /> Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant='destructive' className='mb-4'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className='flex justify-between items-center'>
            <CardTitle className='flex items-center gap-2'>
              <Users /> Registros Encontrados
            </CardTitle>
            <Button
              onClick={() => setIsModalOpen(true)}
              disabled={selectedIds.length === 0 || loading}
            >
              <Edit className='mr-2 h-4 w-4' /> Corregir Estatus (
              {selectedIds.length})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTableWithSelection
            data={data.content}
            columns={columns}
            currentPage={data.number + 1}
            totalPages={data.totalPages}
            onPageChange={(page) => handleSearch(page - 1)}
            sortField={null}
            sortDirection='asc'
            onSort={() => {}}
            enableSelection
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            getItemId={(item) => item.id}
            emptyMessage='No se encontraron registros con los filtros aplicados.'
          />
        </CardContent>
      </Card>

      <CorreccionRegistrosModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        selectedIds={selectedIds}
      />
    </>
  );
}

const getApiErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as any).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocurrió un error inesperado.';
};
