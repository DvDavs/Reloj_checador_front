'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Clock,
  User,
  Layout,
  AlertCircle,
  FileJson,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  ArrowUpDown,
  Monitor,
  Calendar as CalendarIcon,
  Check,
  ChevronsUpDown,
  X,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import {
  getAuditEvents,
  getAuditEventById,
  getAuditActors,
  AuditEventDto,
  AuditFilters,
} from '@/lib/api/audit.api';
import { EnhancedCard } from '@/app/components/shared/enhanced-card';
import { LoadingState } from '@/app/components/shared/loading-state';
import { ErrorState } from '@/app/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AuditoriaPage() {
  const [events, setEvents] = useState<AuditEventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<AuditFilters>({});
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<AuditEventDto | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchActor, setSearchActor] = useState('');
  const [actors, setActors] = useState<string[]>([]);
  const [isLoadingActors, setIsLoadingActors] = useState(false);
  const [actorPopoverOpen, setActorPopoverOpen] = useState(false);

  const fetchActors = useCallback(async () => {
    setIsLoadingActors(true);
    try {
      const data = await getAuditActors();
      setActors(data);
    } catch (err) {
      console.error('Error fetching actors:', err);
    } finally {
      setIsLoadingActors(false);
    }
  }, []);

  useEffect(() => {
    fetchActors();
  }, [fetchActors]);

  const fetchEvents = useCallback(
    async (currentFilters: AuditFilters = appliedFilters) => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAuditEvents(currentFilters, page, pageSize);
        setEvents(response.content);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
      } catch (err: any) {
        setError(err.message || 'Error al cargar los logs de auditoría');
      } finally {
        setLoading(false);
      }
    },
    [appliedFilters, page, pageSize]
  );

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleFilterChange = (key: keyof AuditFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const handleSearch = () => {
    setPage(0);
    setAppliedFilters(filters);
  };

  const handleClear = () => {
    setFilters({});
    setAppliedFilters({});
    setPage(0);
  };

  const handleOpenDetails = (event: AuditEventDto) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  const getOutcomeBadge = (outcome: string | null | undefined) => {
    if (!outcome) return <Badge variant='outline'>N/A</Badge>;
    switch (outcome.toUpperCase()) {
      case 'SUCCESS':
        return (
          <Badge className='bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'>
            Éxito
          </Badge>
        );
      case 'FAILURE':
        return (
          <Badge
            variant='destructive'
            className='bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
          >
            Fallo
          </Badge>
        );
      default:
        return <Badge variant='outline'>{outcome}</Badge>;
    }
  };

  const getEventTypeBadge = (type: string | null | undefined) => {
    if (!type) return <Badge variant='outline'>N/A</Badge>;
    switch (type.toUpperCase()) {
      case 'WRITE':
        return (
          <Badge className='bg-amber-500/10 text-amber-500 border-amber-500/20'>
            Escritura
          </Badge>
        );
      case 'READ':
        return (
          <Badge className='bg-blue-500/10 text-blue-500 border-blue-500/20'>
            Lectura
          </Badge>
        );
      case 'CREATE':
        return (
          <Badge className='bg-blue-500/10 text-blue-500 border-blue-500/20'>
            Crear
          </Badge>
        );
      case 'UPDATE':
        return (
          <Badge className='bg-amber-500/10 text-amber-500 border-amber-500/20'>
            Editar
          </Badge>
        );
      case 'DELETE':
        return (
          <Badge className='bg-rose-500/10 text-rose-500 border-rose-500/20'>
            Eliminar
          </Badge>
        );
      case 'LOGIN':
        return (
          <Badge className='bg-indigo-500/10 text-indigo-500 border-indigo-500/20'>
            Login
          </Badge>
        );
      default:
        return <Badge variant='outline'>{type}</Badge>;
    }
  };

  return (
    <div className='p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto'>
      {/* Header con estética premium */}
      <EnhancedCard variant='elevated' padding='lg'>
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <HistoryIcon size={24} className='text-primary' />
              <h1 className='text-2xl font-bold tracking-tight'>
                Registro de Auditoría
              </h1>
            </div>
            <p className='text-muted-foreground text-sm'>
              Visualiza y rastrea todos los eventos y cambios realizados en el
              sistema.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => fetchEvents()}
              disabled={loading}
              className='h-9'
            >
              {loading ? (
                <RefreshCw size={16} className='mr-2 animate-spin' />
              ) : (
                <RefreshCw size={16} className='mr-2' />
              )}
              Actualizar
            </Button>
          </div>
        </div>
      </EnhancedCard>

      {/* Filtros */}
      <EnhancedCard variant='bordered' padding='md'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <div className='space-y-2'>
            <label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Actor (ID/Nombre)
            </label>
            <Popover open={actorPopoverOpen} onOpenChange={setActorPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  role='combobox'
                  aria-expanded={actorPopoverOpen}
                  className='w-full justify-between font-normal h-10'
                >
                  <div className='flex items-center gap-2 truncate'>
                    <User
                      size={14}
                      className='text-muted-foreground shrink-0'
                    />
                    <span className='truncate'>
                      {filters.actorId || 'Todos los actores'}
                    </span>
                  </div>
                  <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className='w-[--radix-popover-trigger-width] p-0'
                align='start'
              >
                <Command>
                  <CommandInput placeholder='Buscar actor...' />
                  <CommandList>
                    <CommandEmpty>No se encontraron actores.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value='all'
                        onSelect={() => {
                          handleFilterChange('actorId', '');
                          setActorPopoverOpen(false);
                        }}
                        className='cursor-pointer'
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            !filters.actorId ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        Todos los actores
                      </CommandItem>
                      {actors.map((actor) => (
                        <CommandItem
                          key={actor}
                          value={actor}
                          onSelect={(currentValue) => {
                            handleFilterChange(
                              'actorId',
                              currentValue === filters.actorId
                                ? ''
                                : currentValue
                            );
                            setActorPopoverOpen(false);
                          }}
                          className='cursor-pointer font-medium'
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              filters.actorId === actor
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          {actor}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className='space-y-2'>
            <label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Módulo
            </label>
            <select
              className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              value={filters.module || ''}
              onChange={(e) => handleFilterChange('module', e.target.value)}
            >
              <option value=''>Todos los módulos</option>
              <option value='AUTH'>Autenticación</option>
              <option value='EMPLEADOS'>Empleados</option>
              <option value='ASISTENCIAS'>Asistencias</option>
              <option value='HORARIOS'>Horarios</option>
              <option value='JUSTIFICACIONES'>Justificaciones</option>
              <option value='REPORTES'>Reportes</option>
            </select>
          </div>

          <div className='space-y-2'>
            <label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Desde
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-full justify-start text-left font-normal h-10',
                    !filters.from && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {filters.from ? (
                    format(parseISO(filters.from), 'dd/MM/yyyy HH:mm', {
                      locale: es,
                    })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='single'
                  selected={filters.from ? parseISO(filters.from) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      handleFilterChange('from', date.toISOString());
                    } else {
                      handleFilterChange('from', '');
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className='space-y-2'>
            <label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Hasta
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-full justify-start text-left font-normal h-10',
                    !filters.to && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {filters.to ? (
                    format(parseISO(filters.to), 'dd/MM/yyyy HH:mm', {
                      locale: es,
                    })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='single'
                  selected={filters.to ? parseISO(filters.to) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      const endOfDay = new Date(date);
                      endOfDay.setHours(23, 59, 59, 999);
                      handleFilterChange('to', endOfDay.toISOString());
                    } else {
                      handleFilterChange('to', '');
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className='flex gap-2 justify-start mt-6 pt-4 border-t border-border/40'>
          <Button
            onClick={handleSearch}
            disabled={loading}
            className='bg-green-600 hover:bg-green-700 text-white font-semibold transition-all shadow-sm h-10 px-6'
          >
            <Search size={16} className='mr-2' />
            Buscar
          </Button>
          <Button
            variant='outline'
            onClick={handleClear}
            disabled={loading}
            className='border-2 hover:bg-muted/50 font-medium h-10 px-6'
          >
            <X size={16} className='mr-2 text-muted-foreground' />
            Limpiar
          </Button>
        </div>
      </EnhancedCard>

      {/* Tabla de Resultados */}
      <EnhancedCard
        variant='bordered'
        padding='none'
        className='overflow-hidden'
      >
        {loading && events.length === 0 ? (
          <div className='p-20'>
            <LoadingState message='Cargando registros de auditoría...' />
          </div>
        ) : error ? (
          <div className='p-12'>
            <ErrorState message={error} onRetry={fetchEvents} />
          </div>
        ) : (
          <>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader className='bg-muted/50'>
                  <TableRow>
                    <TableHead className='w-[180px] font-bold'>
                      Fecha y Hora
                    </TableHead>
                    <TableHead className='font-bold'>Actor</TableHead>
                    <TableHead className='font-bold'>Módulo</TableHead>
                    <TableHead className='font-bold'>Acción</TableHead>
                    <TableHead className='font-bold'>Tipo</TableHead>
                    <TableHead className='font-bold text-center'>
                      Resultado
                    </TableHead>
                    <TableHead className='text-right font-bold'>
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className='h-32 text-center text-muted-foreground'
                      >
                        No se encontraron registros de auditoría que coincidan
                        con los filtros.
                      </TableCell>
                    </TableRow>
                  ) : (
                    events.map((event) => (
                      <TableRow
                        key={event.id}
                        className='hover:bg-muted/30 transition-colors'
                      >
                        <TableCell className='font-medium'>
                          <div className='flex flex-col'>
                            <span className='text-sm'>
                              {format(
                                new Date(event.timestamp),
                                "dd 'de' MMM, yyyy",
                                { locale: es }
                              )}
                            </span>
                            <span className='text-xs text-muted-foreground'>
                              {format(
                                new Date(event.timestamp),
                                'HH:mm:ss.SSS'
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <div className='h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary'>
                              <User size={14} />
                            </div>
                            <div className='flex flex-col'>
                              <span className='text-sm font-medium'>
                                {event.actorName || 'Sistema'}
                              </span>
                              <span className='text-[10px] text-muted-foreground uppercase tracking-tighter'>
                                {event.actorType} | IP: {event.sourceIp}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant='outline'
                            className='font-normal border-border bg-background'
                          >
                            {event.module}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className='text-sm font-medium'>
                            {event.action}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getEventTypeBadge(event.eventType)}
                        </TableCell>
                        <TableCell className='text-center'>
                          {getOutcomeBadge(event.outcome)}
                        </TableCell>
                        <TableCell className='text-right'>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => handleOpenDetails(event)}
                            className='hover:bg-primary/10 hover:text-primary transition-colors'
                          >
                            <Eye size={18} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginación */}
            <div className='p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20'>
              <div className='text-sm text-muted-foreground'>
                Mostrando{' '}
                <span className='font-medium text-foreground'>
                  {events.length}
                </span>{' '}
                de{' '}
                <span className='font-medium text-foreground'>
                  {totalElements}
                </span>{' '}
                resultados
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || loading}
                >
                  <ChevronLeft size={16} className='mr-1' /> Anterior
                </Button>
                <div className='flex items-center gap-1 mx-2'>
                  <span className='text-sm font-medium'>Página {page + 1}</span>
                  <span className='text-sm text-muted-foreground'>
                    de {totalPages}
                  </span>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1 || loading}
                >
                  Siguiente <ChevronRight size={16} className='ml-1' />
                </Button>
              </div>
            </div>
          </>
        )}
      </EnhancedCard>

      {/* Modal de Detalles Estilo Moderno */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border-2'>
          <DialogHeader className='border-b pb-4'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-primary/10 rounded-lg text-primary'>
                <FileJson size={20} />
              </div>
              <div>
                <DialogTitle>Detalles del Evento</DialogTitle>
                <DialogDescription>
                  Información técnica y JSON de cambios registrados.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className='flex-1 p-1'>
            {selectedEvent && (
              <div className='space-y-6 py-4'>
                <div className='grid grid-cols-2 gap-x-8 gap-y-4 text-sm'>
                  <div className='space-y-1'>
                    <span className='text-xs text-muted-foreground font-semibold uppercase'>
                      ID de Evento
                    </span>
                    <p className='font-mono'>#{selectedEvent.id}</p>
                  </div>
                  <div className='space-y-1'>
                    <span className='text-xs text-muted-foreground font-semibold uppercase'>
                      Fecha y Hora
                    </span>
                    <p className='flex items-center gap-1.5'>
                      <Clock size={14} className='text-muted-foreground' />
                      {format(
                        new Date(selectedEvent.timestamp),
                        "PPP 'a las' HH:mm:ss",
                        { locale: es }
                      )}
                    </p>
                  </div>
                  <div className='space-y-1'>
                    <span className='text-xs text-muted-foreground font-semibold uppercase'>
                      Origen
                    </span>
                    <p className='flex items-center gap-1.5'>
                      <Monitor size={14} className='text-muted-foreground' />
                      {selectedEvent.sourceIp} (
                      {selectedEvent.sourceDevice || 'N/A'})
                    </p>
                  </div>
                  <div className='space-y-1'>
                    <span className='text-xs text-muted-foreground font-semibold uppercase'>
                      Entidad Objetivo
                    </span>
                    <p className='font-medium'>
                      {selectedEvent.targetEntityType || 'N/A'}
                      {selectedEvent.targetEntityId && (
                        <span className='text-muted-foreground ml-1'>
                          (ID: {selectedEvent.targetEntityId})
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {selectedEvent.errorMessage && (
                  <div className='p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg'>
                    <div className='flex items-center gap-2 text-red-600 dark:text-red-400 mb-1'>
                      <AlertCircle size={16} />
                      <span className='text-xs font-bold uppercase'>
                        Error Registrado
                      </span>
                    </div>
                    <p className='text-sm font-mono break-all'>
                      {selectedEvent.errorMessage}
                    </p>
                  </div>
                )}

                <div className='space-y-2'>
                  <span className='text-xs text-muted-foreground font-semibold uppercase'>
                    Detalles extendidos (JSON)
                  </span>
                  <div className='relative group'>
                    <pre className='bg-muted p-4 rounded-lg overflow-auto text-xs font-mono max-h-[300px] border border-border shadow-inner'>
                      {typeof selectedEvent.details === 'string'
                        ? selectedEvent.details
                        : JSON.stringify(selectedEvent.details, null, 2)}
                    </pre>
                    <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                      <Button
                        variant='secondary'
                        size='sm'
                        className='h-8 text-[10px]'
                        onClick={() => {
                          const content =
                            typeof selectedEvent.details === 'string'
                              ? selectedEvent.details
                              : JSON.stringify(selectedEvent.details, null, 2);
                          navigator.clipboard.writeText(content);
                        }}
                      >
                        Copiar JSON
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          <div className='border-t pt-4 flex justify-end'>
            <Button onClick={() => setIsDetailsOpen(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HistoryIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' />
      <path d='M3 3v5h5' />
      <path d='M12 7v5l4 2' />
    </svg>
  );
}
