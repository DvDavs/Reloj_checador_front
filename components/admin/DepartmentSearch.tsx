'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DepartamentoDto, getDepartamentos } from '@/lib/api/schedule-api';
import { motion } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface DepartmentSearchProps {
  value: DepartamentoDto | null;
  onChange: (department: DepartamentoDto | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DepartmentSearch({
  value,
  onChange,
  placeholder = 'Buscar departamento...',
  disabled = false,
}: DepartmentSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [departments, setDepartments] = React.useState<DepartamentoDto[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
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

    if (open) {
      fetchDepartments();
    }
  }, [open]);

  const filteredDepartments = React.useMemo(() => {
    if (!searchTerm) return departments;
    return departments.filter(
      (dept) =>
        dept.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.clave.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [departments, searchTerm]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-full justify-between'
          disabled={disabled}
        >
          <span className='truncate'>
            {value ? `${value.clave} - ${value.nombre}` : placeholder}
          </span>
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[--radix-popover-trigger-width] min-w-[400px] p-0'>
        <Command>
          <CommandInput
            placeholder='Buscar por nombre o clave...'
            value={searchTerm}
            onValueChange={setSearchTerm}
            className='border-0 focus:ring-0 focus:outline-none'
          />
          <CommandList>
            {isLoading && (
              <div className='flex items-center justify-center p-4'>
                <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
              </div>
            )}
            {error && (
              <div className='p-2'>
                <Alert variant='destructive'>
                  <AlertCircle className='h-4 w-4' />
                  <AlertTitle>Error de Búsqueda</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}
            {!isLoading && !error && (
              <>
                <CommandEmpty>No se encontraron departamentos.</CommandEmpty>
                <motion.div
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CommandGroup>
                    {filteredDepartments.map((department) => (
                      <CommandItem
                        key={department.clave}
                        value={`${department.nombre} ${department.clave}`}
                        onSelect={() => {
                          onChange(department);
                          setOpen(false);
                        }}
                        className='flex items-center space-x-3 p-3 cursor-pointer hover:bg-accent/50 data-[selected=true]:bg-primary/10'
                      >
                        <div className='flex flex-col flex-1 min-w-0'>
                          <span className='font-semibold text-foreground text-base truncate'>
                            {department.nombre}
                          </span>
                          <span className='text-sm text-muted-foreground font-medium'>
                            Clave: {department.clave}
                          </span>
                        </div>
                        <Check
                          className={cn(
                            'ml-auto h-5 w-5',
                            value?.clave === department.clave
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </motion.div>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
