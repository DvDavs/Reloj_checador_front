'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useDebounce } from 'use-debounce';

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
import { EmpleadoSimpleDTO } from '@/app/horarios/asignados/registrar/types';
import { searchEmployees } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface EmployeeSearchProps {
  value: EmpleadoSimpleDTO | null;
  onChange: (employee: EmpleadoSimpleDTO | null) => void;
  placeholder?: string;
  disabled?: boolean;
  showAllOnOpen?: boolean;
}

export function EmployeeSearch({
  value,
  onChange,
  placeholder = 'Buscar por nombre, RFC, CURP o Tarjeta...',
  disabled = false,
  showAllOnOpen = false,
}: EmployeeSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const [employees, setEmployees] = React.useState<EmpleadoSimpleDTO[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchEmployees = async () => {
      const term = (debouncedSearchTerm || '').trim();

      if (!term && !showAllOnOpen) {
        setEmployees([]);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        // Si el término es numérico, buscar por número de tarjeta directamente
        if (term && /^\d+$/.test(term)) {
          try {
            const resp = await apiClient.get(
              `/api/empleados/tarjeta/${encodeURIComponent(term)}`
            );
            const emp = resp.data || null;
            const mapped = emp
              ? [
                  {
                    id: emp.id,
                    nombreCompleto:
                      emp.nombreCompleto ||
                      [
                        emp.primerNombre,
                        emp.segundoNombre,
                        emp.primerApellido,
                        emp.segundoApellido,
                      ]
                        .filter(Boolean)
                        .join(' '),
                    rfc: emp.rfc,
                    curp: emp.curp,
                    numTarjetaTrabajador:
                      emp.tarjeta !== null && emp.tarjeta !== undefined
                        ? String(emp.tarjeta)
                        : undefined,
                  },
                ]
              : [];
            setEmployees(mapped);
          } catch (e: any) {
            // Si no existe, mostrar simplemente sin resultados; otros errores, propagar
            if (e?.response?.status === 404) {
              setEmployees([]);
            } else {
              throw e;
            }
          }
        } else {
          // Búsqueda tradicional (nombre, RFC, CURP) con fallback para múltiples tokens.
          // Si el backend no soporta múltiples palabras ("David G"), intentamos con tokens individuales
          // y dejamos que el filtro del componente haga el refinamiento en cliente.
          let data: EmpleadoSimpleDTO[] = [];
          if (term) {
            data = await searchEmployees(term);
            if ((!data || data.length === 0) && term.includes(' ')) {
              const tokens = term.split(/\s+/).filter(Boolean);
              const candidates = [tokens[tokens.length - 1], tokens[0]]; // probar apellido/nombre
              for (const t of candidates) {
                if (!t) continue;
                try {
                  const partial = await searchEmployees(t);
                  if (Array.isArray(partial) && partial.length > 0) {
                    data = partial as EmpleadoSimpleDTO[];
                    break;
                  }
                } catch (_) {
                  // Ignorado a propósito: continuar con el siguiente candidato
                  continue;
                }
              }
              // Como último recurso, si se permite, traer todos para filtrar en cliente
              if ((!data || data.length === 0) && showAllOnOpen) {
                try {
                  data = await searchEmployees('');
                } catch (_) {
                  // En caso de fallo, no hay datos que mostrar
                  data = [];
                }
              }
            }
          } else if (showAllOnOpen) {
            data = await searchEmployees('');
          }
          const mapped = (data || []).map((emp: any) => ({
            ...emp,
            numTarjetaTrabajador:
              emp?.numTarjetaTrabajador ??
              (emp?.tarjeta !== undefined && emp?.tarjeta !== null
                ? String(emp.tarjeta)
                : undefined),
          }));
          setEmployees(mapped);
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar empleados');
        setEmployees([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchEmployees();
    }
  }, [debouncedSearchTerm, open, showAllOnOpen]);

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
          {value
            ? value.nombreCompleto // Mantenemos solo el nombre en el botón para que no sea muy largo
            : placeholder}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[--radix-popover-trigger-width] p-0'>
        <Command
          // Filtro personalizado: busca por múltiples términos (nombre y apellidos en cualquier orden) y sin acentos
          filter={(value, search) => {
            const normalize = (s: string) =>
              (s || '')
                .toLocaleLowerCase('es')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');

            const normalizedValue = normalize(value);
            const normalizedSearch = normalize(search);
            if (!normalizedSearch) return 1; // sin término, no filtrar

            const tokens = normalizedSearch.split(/\s+/).filter(Boolean);
            const matches = tokens.every((t) => normalizedValue.includes(t));
            return matches ? 1 : -1; // -1 excluye el item en cmdk
          }}
        >
          <CommandInput
            placeholder={placeholder} // Usar el placeholder actualizado
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
                <CommandEmpty>No se encontraron empleados.</CommandEmpty>
                <motion.div
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CommandGroup>
                    {employees.map((employee) => (
                      <CommandItem
                        key={employee.id}
                        value={`${employee.nombreCompleto} ${employee.rfc || ''} ${employee.curp || ''} ${employee.numTarjetaTrabajador || ''}`}
                        onSelect={() => {
                          onChange(employee);
                          setOpen(false);
                        }}
                        className='flex items-center space-x-4 p-3 cursor-pointer hover:bg-accent/50 data-[selected=true]:bg-primary/10'
                      >
                        <Avatar>
                          <AvatarImage
                            src={undefined}
                            alt={employee.nombreCompleto}
                          />
                          <AvatarFallback>
                            {getInitials(employee.nombreCompleto)}
                          </AvatarFallback>
                        </Avatar>
                        <div className='flex flex-col flex-1'>
                          <span className='font-semibold text-foreground text-base'>
                            {employee.nombreCompleto}
                          </span>
                          {(employee.rfc ||
                            employee.curp ||
                            employee.numTarjetaTrabajador) && (
                            <span className='text-sm text-muted-foreground font-medium'>
                              {employee.numTarjetaTrabajador && (
                                <span>
                                  Tarjeta: {employee.numTarjetaTrabajador}
                                </span>
                              )}
                              {employee.rfc &&
                                (employee.curp ||
                                  employee.numTarjetaTrabajador) && (
                                  <span className='mx-1'>•</span>
                                )}
                              {employee.rfc && <span>RFC: {employee.rfc}</span>}
                              {employee.rfc && employee.curp && (
                                <span className='mx-1'>•</span>
                              )}
                              {employee.curp && (
                                <span>CURP: {employee.curp}</span>
                              )}
                            </span>
                          )}
                        </div>
                        <Check
                          className={cn(
                            'ml-auto h-5 w-5',
                            value?.id === employee.id
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
