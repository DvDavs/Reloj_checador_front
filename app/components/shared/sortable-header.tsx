'use client';

import { TableHead } from '@/components/ui/table';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface SortableHeaderProps {
  field: string;
  children: React.ReactNode;
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
}

export function SortableHeader({
  field,
  children,
  sortField,
  sortDirection,
  onSort,
}: SortableHeaderProps) {
  const isActive = sortField === field;

  return (
    <TableHead
      className='cursor-pointer hover:bg-muted/60 select-none transition-colors duration-150 font-semibold text-foreground py-4'
      onClick={() => onSort(field)}
    >
      <div className='flex items-center gap-2 group'>
        <span
          className={`${isActive ? 'text-primary font-bold' : 'group-hover:text-primary text-foreground'} transition-colors duration-150`}
        >
          {children}
        </span>
        <div className='flex flex-col opacity-60 group-hover:opacity-100 transition-opacity duration-150'>
          <ChevronUp
            className={`h-3 w-3 transition-colors duration-150 ${
              isActive && sortDirection === 'asc'
                ? 'text-primary'
                : 'text-muted-foreground'
            }`}
          />
          <ChevronDown
            className={`h-3 w-3 -mt-1 transition-colors duration-150 ${
              isActive && sortDirection === 'desc'
                ? 'text-primary'
                : 'text-muted-foreground'
            }`}
          />
        </div>
      </div>
    </TableHead>
  );
}
