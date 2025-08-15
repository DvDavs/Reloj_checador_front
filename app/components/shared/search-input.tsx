'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
  className = '',
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground' />
      <Input
        type='search'
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='pl-12 pr-4 h-12 w-full border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-muted-foreground rounded-lg shadow-sm transition-all duration-200'
      />
      {value && (
        <div className='absolute right-3 top-1/2 -translate-y-1/2'>
          <span className='text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full'>
            {value.length > 0 ? `${value.length} caracteres` : ''}
          </span>
        </div>
      )}
    </div>
  );
}
