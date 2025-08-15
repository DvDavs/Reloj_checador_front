'use client';

import React, { useState } from 'react';
import { Search, Calendar as CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

import { EmployeeSearch } from '@/app/components/shared/employee-search';
import { DepartmentSearchableSelect } from '@/app/components/shared/department-searchable-select';
import { EmpleadoSimpleDTO } from '@/app/horarios/asignados/registrar/types';
import { DepartamentoDto } from '@/lib/api/schedule-api';
import { AsistenciaFilters, EstatusDisponible } from '@/lib/api/asistencia.api';

interface AsistenciaSearchFormProps {
  initialFilters?: AsistenciaFilters;
  estatusDisponibles: EstatusDisponible[];
  loading: boolean;
  onSearch: (filters: AsistenciaFilters) => void;
  onClearFilters: () => void;
  showDateRange?: boolean;
  requireDate?: boolean;
  requireStatus?: boolean;
}

export function AsistenciaSearchForm({
  initialFilters = {},
  estatusDisponibles,
  loading,
  onSearch,
  onClearFilters,
  showDateRange = false,
  requireDate = false,
  requireStatus = false,
}: AsistenciaSearchFormProps) {
  const [empleado, setEmpleado] = useState<EmpleadoSimpleDTO | null>(null);
  const [departamento, setDepartamento] = useState<DepartamentoDto | null>(
    null
  );
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(undefined);
  const [fechaFin, setFechaFin] = useState<Date | undefined>(undefined);
  const [estatus, setEstatus] = useState<EstatusDisponible | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = () => {
    setError(null);
    if (requireDate) {
      if (!fechaInicio) {
        setError(
          showDateRange
            ? 'La fecha de inicio es obligatoria.'
            : 'La fecha es obligatoria.'
        );
        return;
      }
      if (showDateRange && !fechaFin) {
        setFechaFin(fechaInicio);
      }
    }
    if (requireStatus && !estatus) {
      setError('Debe seleccionar un estatus.');
      return;
    }
    onSearch({
      empleadoId: empleado?.id,
      departamentoClave: departamento?.clave,
      fechaInicio: fechaInicio ? format(fechaInicio, 'yyyy-MM-dd') : undefined,
      fechaFin: fechaFin
        ? format(fechaFin, 'yyyy-MM-dd')
        : showDateRange && fechaInicio
          ? format(fechaInicio, 'yyyy-MM-dd')
          : undefined,
      estatusClave: estatus?.clave,
    });
  };

  const handleClear = () => {
    setEmpleado(null);
    setDepartamento(null);
    setFechaInicio(undefined);
    setFechaFin(undefined);
    setEstatus(null);
    setError(null);
    onClearFilters();
  };

  const hasActiveFilters =
    empleado || departamento || fechaInicio || fechaFin || estatus;

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Filter className='h-5 w-5' />
          Filtros de Búsqueda
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {error && (
          <div className='p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md'>
            {error}
          </div>
        )}

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label>Empleado (Opcional)</Label>
            <EmployeeSearch
              value={empleado}
              onChange={setEmpleado}
              disabled={loading}
            />
          </div>
          <div className='space-y-2'>
            <Label>Departamento (Opcional)</Label>
            <DepartmentSearchableSelect
              value={departamento}
              onChange={setDepartamento}
              disabled={loading}
            />
          </div>
        </div>

        <div
          className={`grid grid-cols-1 ${showDateRange ? 'md:grid-cols-2' : ''} gap-4`}
        >
          <div className='space-y-2'>
            <Label>
              {showDateRange ? 'Fecha Inicio' : 'Fecha'}{' '}
              {requireDate && <span className='text-destructive'>*</span>}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !fechaInicio && 'text-muted-foreground'
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {fechaInicio
                    ? format(fechaInicio, 'PPP', { locale: es })
                    : 'Seleccionar fecha'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0'>
                <Calendar
                  mode='single'
                  selected={fechaInicio}
                  onSelect={(d) => setFechaInicio(d || undefined)}
                />
              </PopoverContent>
            </Popover>
          </div>
          {showDateRange && (
            <div className='space-y-2'>
              <Label>
                Fecha Fin{' '}
                {requireDate && <span className='text-destructive'>*</span>}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !fechaFin && 'text-muted-foreground'
                    )}
                    disabled={loading}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {fechaFin
                      ? format(fechaFin, 'PPP', { locale: es })
                      : 'Seleccionar fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                  <Calendar
                    mode='single'
                    selected={fechaFin}
                    onSelect={(d) => setFechaFin(d || undefined)}
                    disabled={fechaInicio ? { before: fechaInicio } : undefined}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        <div className='space-y-2'>
          <Label>Estatus (Opcional)</Label>
          <Select
            value={estatus?.id.toString() || 'ALL'}
            onValueChange={(value) => {
              if (value === 'ALL') {
                setEstatus(null);
              } else {
                setEstatus(
                  estatusDisponibles.find((e) => e.id.toString() === value) ||
                    null
                );
              }
            }}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder='Todos los estatus...' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>Todos</SelectItem>
              {estatusDisponibles.map((e) => (
                <SelectItem key={e.id} value={e.id.toString()}>
                  {e.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex flex-col sm:flex-row gap-3 pt-4'>
          <Button onClick={handleSearch} disabled={loading} className='flex-1'>
            <Search className='mr-2 h-4 w-4' />
            {loading ? 'Buscando...' : 'Buscar Asistencias'}
          </Button>
          {hasActiveFilters && (
            <Button
              variant='outline'
              onClick={handleClear}
              disabled={loading}
              className='flex-1 sm:flex-none'
            >
              <X className='mr-2 h-4 w-4' /> Limpiar Filtros
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
