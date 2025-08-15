'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { SearchableSelect } from './searchable-select';
import { getDepartamentos, DepartamentoDto } from '@/lib/api/schedule-api';

interface DepartmentSearchableSelectProps {
  value: DepartamentoDto | null;
  onChange: (department: DepartamentoDto | null) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
}

export function DepartmentSearchableSelect({
  value,
  onChange,
  placeholder = 'Buscar departamento...',
  disabled = false,
  allowClear = true,
}: DepartmentSearchableSelectProps) {
  const [departments, setDepartments] = useState<DepartamentoDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getDepartamentos();
        setDepartments(data || []);
      } catch (err: any) {
        setError(err.message || 'Error al cargar departamentos');
        setDepartments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const options = React.useMemo(() => {
    return departments.map((dept) => ({
      value: dept.clave,
      label: `${dept.clave} - ${dept.nombre}`,
    }));
  }, [departments]);

  const handleChange = (selectedValue: string | null) => {
    if (!selectedValue) {
      onChange(null);
      return;
    }

    const selectedDepartment = departments.find(
      (dept) => dept.clave === selectedValue
    );
    onChange(selectedDepartment || null);
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-10 border rounded-md bg-muted focus:outline-none'>
        <span className='text-sm text-muted-foreground'>Cargando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center h-10 border rounded-md bg-destructive/10 focus:outline-none'>
        <span className='text-sm text-destructive'>Error: {error}</span>
      </div>
    );
  }

  return (
    <SearchableSelect
      value={value?.clave || null}
      onChange={handleChange}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      allowClear={allowClear}
      emptyMessage='No se encontraron departamentos.'
    />
  );
}
