'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Edit,
  Users,
  AlertCircle,
  CheckCircle2,
  Search,
  X,
  Plus,
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
  getEstatusNombreMap,
  getTiposRegistro,
  updateRegistroDetalle,
} from '@/lib/api/registros-detalle.api';
import { EmpleadoSimpleDTO } from '@/app/horarios/asignados/registrar/types';
import { DepartamentoDto } from '@/lib/api/schedule-api';
import { EmployeeSearch } from '@/app/components/shared/employee-search';
import { DepartmentSearchableSelect } from '@/app/components/shared/department-searchable-select';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export function CorreccionRegistrosForm() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    empleado: null as EmpleadoSimpleDTO | null,
    departamento: null as DepartamentoDto | null,
    desde: null as Date | null,
    hasta: null as Date | null,
    tarjeta: '' as string,
    estatusClave: '' as string,
    tipoRegistroId: '' as string,
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
  const [estatusMap, setEstatusMap] = useState<Record<string, string>>({});
  const [tipos, setTipos] = useState<{ id: number; nombre: string }[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<RegistroDetalle | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editDate, setEditDate] = useState<Date | null>(null);
  const [editTime, setEditTime] = useState<string>('');
  const [sortField, setSortField] = useState<string>('fechaHora');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const mapSortFieldToBackend = useCallback((field: string): string => {
    switch (field) {
      case 'empleadoNombre':
        return 'empleado.primerApellido';
      case 'tarjeta':
        return 'empleado.tarjeta';
      case 'tipoEoS':
        return 'tipo';
      case 'tipoRegistroNombre':
        return 'tipoRegistro.nombre';
      default:
        return field;
    }
  }, []);

  const getEstatusColor = (clave: string) => {
    switch (clave) {
      case 'AN':
      case 'ANJ':
        return 'bg-green-500';
      case 'AR':
      case 'AT':
        return 'bg-orange-700';
      case 'ST':
        return 'bg-yellow-500';
      case 'FR':
        return 'bg-blue-500';
      case 'HI':
        return 'bg-amber-500';
      case 'FE':
      case 'FS':
      case 'FC':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

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
          tarjeta: filters.tarjeta ? Number(filters.tarjeta) : undefined,
          estatusClave: filters.estatusClave || undefined,
          tipoRegistroId: filters.tipoRegistroId
            ? Number(filters.tipoRegistroId)
            : undefined,
          sort: `${mapSortFieldToBackend(sortField)},${sortDirection}`,
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
    [filters, sortField, sortDirection, mapSortFieldToBackend]
  );

  const handleClearFilters = () => {
    setFilters({
      empleado: null,
      departamento: null,
      desde: null,
      hasta: null,
      tarjeta: '',
      estatusClave: '',
      tipoRegistroId: '',
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
        sortable: true,
        render: (item: RegistroDetalle) => (
          <div className='font-medium'>{item.empleadoNombre}</div>
        ),
      },
      {
        key: 'tarjeta',
        label: 'No. Tarjeta',
        sortable: true,
        render: (item: RegistroDetalle) => item.tarjeta ?? '-',
      },
      {
        key: 'fechaHora',
        label: 'Fecha y Hora',
        sortable: true,
        render: (item: RegistroDetalle) =>
          format(new Date(item.fechaHora), 'dd/MM/yyyy HH:mm:ss', {
            locale: es,
          }),
      },
      {
        key: 'tipoEoS',
        label: 'Tipo',
        sortable: true,
        render: (item: RegistroDetalle) => (
          <Badge variant={item.tipoEoS === 'E' ? 'default' : 'secondary'}>
            {item.tipoEoS === 'E' ? 'Entrada' : 'Salida'}
          </Badge>
        ),
      },
      {
        key: 'estatusCalculado',
        label: 'Estatus',
        sortable: true,
        render: (item: RegistroDetalle) => (
          <div className='flex items-center gap-2'>
            <span
              className={cn(
                'inline-block w-2.5 h-2.5 rounded-full',
                getEstatusColor(item.estatusCalculado)
              )}
            />
            <span>
              {estatusMap[item.estatusCalculado] || item.estatusCalculado}
            </span>
          </div>
        ),
      },

      {
        key: 'acciones',
        label: 'Acciones',
        render: (item: RegistroDetalle) => (
          <Button
            size='sm'
            variant='outline'
            onClick={() => {
              setEditing({
                ...item,
                observaciones: item.observaciones ?? '',
              });
              setEditOpen(true);
            }}
          >
            Corregir
          </Button>
        ),
      },
    ],
    [estatusMap]
  );

  useEffect(() => {
    (async () => {
      try {
        const [mapa, tiposReg] = await Promise.all([
          getEstatusNombreMap(),
          getTiposRegistro(),
        ]);
        setEstatusMap(mapa);
        setTipos(tiposReg);
      } catch (err) {
        toast({
          title: 'Error al cargar catálogos',
          description: getApiErrorMessage(err),
          variant: 'destructive',
        });
      }
    })();
  }, [toast]);

  // Inicializa controles de fecha y hora cuando se abre el modal de edición
  useEffect(() => {
    if (editOpen && editing) {
      const raw = (editing.fechaHora || '').trim();
      // Admite "yyyy-MM-dd HH:mm:ss" y "yyyy-MM-ddTHH:mm:ss"
      const normalized = raw.includes('T') ? raw.replace('T', ' ') : raw;
      let parsedDate = parse(normalized, 'yyyy-MM-dd HH:mm:ss', new Date());
      if (isNaN(parsedDate.getTime())) {
        const fallback = new Date(raw);
        parsedDate = isNaN(fallback.getTime()) ? new Date() : fallback;
      }
      setEditDate(parsedDate);
      setEditTime(format(parsedDate, 'HH:mm'));
    }
  }, [editOpen, editing]);

  return (
    <>
      <Card className='elevated-card mb-8'>
        <CardHeader className='bg-slate-50/50 border-b-2 border-border'>
          <CardTitle className='text-xl font-bold text-slate-900'>
            Filtros de Búsqueda Avanzada
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6 p-6'>
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
              <DepartmentSearchableSelect
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
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='space-y-2'>
              <Label>Número de Tarjeta</Label>
              <Input
                value={filters.tarjeta}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, tarjeta: e.target.value }))
                }
                placeholder='Ej. 6001'
              />
            </div>
            <div className='space-y-2'>
              <Label>Estatus Calculado</Label>
              <Select
                value={
                  filters.estatusClave === '' ? '__ALL__' : filters.estatusClave
                }
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    estatusClave: v === '__ALL__' ? '' : v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Todos' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='__ALL__'>Todos</SelectItem>
                  {Object.entries(estatusMap).map(([clave, nombre]) => (
                    <SelectItem key={clave} value={clave}>
                      {nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Fuente de Registro</Label>
              <Select
                value={
                  filters.tipoRegistroId === ''
                    ? '__ALL__'
                    : filters.tipoRegistroId
                }
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    tipoRegistroId: v === '__ALL__' ? '' : v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Todas' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='__ALL__'>Todas</SelectItem>
                  {tipos.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={(field) => {
              const newDirection =
                sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
              setSortField(field);
              setSortDirection(newDirection);
              handleSearch(0);
            }}
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

      {/* Modal de Edición */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Registro</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Fecha</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !editDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {editDate ? (
                          format(editDate, 'PPP', { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0'>
                      <Calendar
                        mode='single'
                        selected={editDate ?? undefined}
                        onSelect={(d) => {
                          setEditDate(d || null);
                          if (d && editing) {
                            const [h, m] = (editTime || '00:00')
                              .split(':')
                              .map((v) => parseInt(v, 10));
                            const combined = new Date(d);
                            combined.setHours(
                              isNaN(h) ? 0 : h,
                              isNaN(m) ? 0 : m,
                              0,
                              0
                            );
                            setEditing({
                              ...editing,
                              fechaHora: format(
                                combined,
                                'yyyy-MM-dd HH:mm:ss'
                              ),
                            });
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className='space-y-2'>
                  <Label>Hora</Label>
                  <Input
                    type='time'
                    value={editTime}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEditTime(value);
                      if (editing) {
                        const base = editDate ?? new Date();
                        const [h, m] = (value || '00:00')
                          .split(':')
                          .map((v) => parseInt(v, 10));
                        const combined = new Date(base);
                        combined.setHours(
                          isNaN(h) ? 0 : h,
                          isNaN(m) ? 0 : m,
                          0,
                          0
                        );
                        setEditing({
                          ...editing,
                          fechaHora: format(combined, 'yyyy-MM-dd HH:mm:ss'),
                        });
                      }
                    }}
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label>Estatus Calculado</Label>
                <Select
                  value={editing.estatusCalculado}
                  onValueChange={(v) =>
                    setEditing({ ...editing, estatusCalculado: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(estatusMap).map(([clave, nombre]) => (
                      <SelectItem key={clave} value={clave}>
                        {nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Tipo de Registro</Label>
                <Select
                  value={editing.tipoEoS}
                  onValueChange={(v) =>
                    setEditing({ ...editing, tipoEoS: v as 'E' | 'S' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='E'>Entrada</SelectItem>
                    <SelectItem value='S'>Salida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Observaciones (opcional)</Label>
                <Textarea
                  value={editing.observaciones ?? ''}
                  onChange={(e) =>
                    setEditing({ ...editing, observaciones: e.target.value })
                  }
                  rows={3}
                  placeholder='Observaciones opcionales...'
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!editing) return;

                try {
                  setEditSaving(true);
                  await updateRegistroDetalle(editing.id, {
                    fechaHora: editing.fechaHora,
                    estatusCalculado: editing.estatusCalculado,
                    observaciones: editing.observaciones?.trim() || null,
                    tipoEoS: editing.tipoEoS,
                  });
                  setEditOpen(false);
                  handleSearch(data.number);
                  toast({ title: 'Registro actualizado' });
                } catch (err) {
                  toast({
                    title: 'Error',
                    description: getApiErrorMessage(err),
                    variant: 'destructive',
                  });
                } finally {
                  setEditSaving(false);
                }
              }}
              disabled={editSaving}
            >
              {editSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
