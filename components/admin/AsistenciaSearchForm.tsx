'use client';

import React, { useState, useEffect } from 'react';
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
import { DepartmentSearch } from './DepartmentSearch';
import { EmpleadoSimpleDTO } from '@/app/horarios/asignados/registrar/types';
import { DepartamentoDto } from '@/lib/api/schedule-api';
import { AsistenciaFilters, EstatusDisponible } from '@/lib/api/asistencia.api';

// ============================================================================
// INTERFACES
// ============================================================================

interface AsistenciaSearchFormProps {
  filters: AsistenciaFilters;
  estatusDisponibles: EstatusDisponible[];
  loading: boolean;
  onSearch: (filters: AsistenciaFilters) => void;
  onClearFilters: () => void;
  // Si es true, se oculta el rango y se exige una fecha única (modo corrección)
  singleDate?: boolean;
}

interface FormData {
  empleado: EmpleadoSimpleDTO | null;
  departamento: DepartamentoDto | null;
  fechaInicio: Date | undefined;
  fechaFin: Date | undefined;
  estatus: EstatusDisponible | null;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function AsistenciaSearchForm({
  filters,
  estatusDisponibles,
  loading,
  onSearch,
  onClearFilters,
  singleDate = false,
}: AsistenciaSearchFormProps) {
  const [formData, setFormData] = useState<FormData>({
    empleado: null,
    departamento: null,
    fechaInicio: undefined,
    fechaFin: undefined,
    estatus: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Memoizar handlers para evitar re-renders innecesarios
  const handleEstatusChange = React.useCallback(
    (value: string) => {
      const selectedEstatus = estatusDisponibles.find(
        (e) => e.id.toString() === value
      );
      setFormData((prev) => ({ ...prev, estatus: selectedEstatus || null }));
    },
    [estatusDisponibles]
  );

  const handleEmpleadoChange = React.useCallback(
    (empleado: EmpleadoSimpleDTO | null) => {
      setFormData((prev) => ({ ...prev, empleado }));
    },
    []
  );

  const handleDepartamentoChange = React.useCallback(
    (departamento: DepartamentoDto | null) => {
      setFormData((prev) => ({ ...prev, departamento }));
    },
    []
  );

  const handleFechaInicioChange = React.useCallback(
    (date: Date | undefined) => {
      setFormData((prev) => ({ ...prev, fechaInicio: date }));
    },
    []
  );

  const handleFechaFinChange = React.useCallback((date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, fechaFin: date }));
  }, []);

  // ============================================================================
  // VALIDACIÓN
  // ============================================================================

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Según la guía técnica, AMBOS parámetros son requeridos para el endpoint de búsqueda
    const hasDate = Boolean(formData.fechaInicio);
    const hasStatus = Boolean(formData.estatus);

    if (!hasDate) {
      newErrors.fecha = 'Debe seleccionar una fecha para realizar la búsqueda.';
    }

    if (!hasStatus) {
      newErrors.estatus =
        'Debe seleccionar un estatus para realizar la búsqueda.';
    }

    if (!hasDate || !hasStatus) {
      newErrors.general =
        'Debe seleccionar tanto una fecha como un estatus para realizar la búsqueda.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSearch = () => {
    if (!validateForm()) return;

    // Según la guía técnica, solo necesitamos estatusId y fecha
    const searchFilters: AsistenciaFilters = {
      estatusId: formData.estatus!.id,
      fecha: format(formData.fechaInicio!, 'yyyy-MM-dd'),
    };

    onSearch(searchFilters);
  };

  const handleClearFilters = () => {
    setFormData({
      empleado: null,
      departamento: null,
      fechaInicio: undefined,
      fechaFin: undefined,
      estatus: null,
    });
    setErrors({});
    onClearFilters();
  };

  const hasActiveFilters =
    formData.empleado ||
    formData.departamento ||
    formData.fechaInicio ||
    formData.fechaFin ||
    formData.estatus;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Filter className='h-5 w-5' />
          Filtros de Búsqueda
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Error general */}
        {errors.general && (
          <div className='p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md'>
            {errors.general}
          </div>
        )}

        {/* Fila 1: Empleado y Departamento */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='empleado'>Empleado</Label>
            <EmployeeSearch
              value={formData.empleado}
              onChange={handleEmpleadoChange}
              placeholder='Buscar empleado...'
              disabled={loading}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='departamento'>Departamento</Label>
            <DepartmentSearch
              value={formData.departamento}
              onChange={handleDepartamentoChange}
              placeholder='Buscar departamento...'
              disabled={loading}
            />
          </div>
        </div>

        {/* Fechas */}
        <div
          className={`grid grid-cols-1 ${singleDate ? '' : 'md:grid-cols-2'} gap-4`}
        >
          <div className='space-y-2'>
            <Label>{singleDate ? 'Fecha' : 'Fecha Inicio'}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !formData.fechaInicio && 'text-muted-foreground'
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {formData.fechaInicio
                    ? format(formData.fechaInicio, 'PPP', { locale: es })
                    : singleDate
                      ? 'Seleccionar fecha'
                      : 'Seleccionar fecha inicio'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='single'
                  selected={formData.fechaInicio}
                  onSelect={handleFechaInicioChange}
                  disabled={{ after: new Date() }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          {!singleDate && (
            <div className='space-y-2'>
              <Label>Fecha Fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.fechaFin && 'text-muted-foreground'
                    )}
                    disabled={loading}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {formData.fechaFin
                      ? format(formData.fechaFin, 'PPP', { locale: es })
                      : 'Seleccionar fecha fin'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={formData.fechaFin}
                    onSelect={handleFechaFinChange}
                    disabled={{
                      after: new Date(),
                      before: formData.fechaInicio,
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.fechaFin && (
                <p className='text-sm text-red-600'>{errors.fechaFin}</p>
              )}
            </div>
          )}
        </div>

        {/* Fila 3: Estatus */}
        <div className='space-y-2'>
          <Label htmlFor='estatus'>Estatus Actual</Label>
          <Select
            value={formData.estatus?.id.toString() || ''}
            onValueChange={handleEstatusChange}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder='Seleccionar estatus...' />
            </SelectTrigger>
            <SelectContent>
              {estatusDisponibles.map((estatus) => (
                <SelectItem key={estatus.id} value={estatus.id.toString()}>
                  <div className='flex items-center gap-2'>
                    {estatus.color && (
                      <div
                        className='w-3 h-3 rounded-full'
                        style={{ backgroundColor: estatus.color }}
                      />
                    )}
                    <span>{estatus.nombre}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Botones de acción */}
        <div className='flex flex-col sm:flex-row gap-3 pt-4'>
          <Button onClick={handleSearch} disabled={loading} className='flex-1'>
            <Search className='mr-2 h-4 w-4' />
            {loading ? 'Buscando...' : 'Buscar Asistencias'}
          </Button>

          {hasActiveFilters && (
            <Button
              variant='outline'
              onClick={handleClearFilters}
              disabled={loading}
              className='flex-1 sm:flex-none'
            >
              <X className='mr-2 h-4 w-4' />
              Limpiar Filtros
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
