'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

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

interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  emptyMessage?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  disabled = false,
  allowClear = true,
  emptyMessage = 'No se encontraron opciones.',
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredOptions = React.useMemo(() => {
    if (!searchTerm) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const selectedOption = options.find((option) => option.value === value);

  // Limpiar búsqueda cuando se cierra
  React.useEffect(() => {
    if (!open) {
      setSearchTerm('');
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-full justify-between text-left font-normal focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0'
          disabled={disabled}
        >
          <span className='truncate text-sm'>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-[--radix-popover-trigger-width] min-w-[400px] p-0'
        align='start'
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder='Buscar...'
            value={searchTerm}
            onValueChange={setSearchTerm}
            className='h-9 focus:outline-none focus:ring-0 border-0'
          />
          <CommandList className='max-h-[300px]'>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {allowClear && (
                <CommandItem
                  value='__clear__'
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                  className='cursor-pointer focus:outline-none focus:ring-0'
                >
                  <span className='text-muted-foreground italic text-sm'>
                    (Ninguno)
                  </span>
                  <Check
                    className={cn(
                      'ml-auto h-4 w-4',
                      !value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              )}
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className='cursor-pointer focus:outline-none focus:ring-0'
                >
                  <div className='flex flex-col flex-1 min-w-0'>
                    <span
                      className='text-sm font-medium truncate'
                      title={option.label}
                    >
                      {option.label}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      'ml-auto h-4 w-4',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
