'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SortableHeader } from './sortable-header';
import { EnhancedCard } from './enhanced-card';
import { cn } from '@/lib/utils';

interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface EnhancedTableProps {
  columns: TableColumn[];
  data: any[];
  sortField?: string | null;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  emptyState?: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
  };
  className?: string;
  rowClassName?: string | ((row: any, index: number) => string);
}

export function EnhancedTable({
  columns,
  data,
  sortField,
  sortDirection = 'asc',
  onSort,
  emptyState,
  className,
  rowClassName,
}: EnhancedTableProps) {
  const getRowClassName = (row: any, index: number) => {
    if (typeof rowClassName === 'function') {
      return rowClassName(row, index);
    }
    return rowClassName || 'enhanced-table-row';
  };

  return (
    <EnhancedCard
      variant='elevated'
      padding='none'
      className={cn('overflow-hidden', className)}
    >
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow className='enhanced-table-header hover:bg-muted/60'>
              {columns.map((column) =>
                column.sortable && onSort ? (
                  <SortableHeader
                    key={column.key}
                    field={column.key}
                    sortField={sortField || null}
                    sortDirection={sortDirection}
                    onSort={onSort}
                  >
                    {column.label}
                  </SortableHeader>
                ) : (
                  <TableHead
                    key={column.key}
                    className={cn(
                      'font-semibold text-foreground py-4',
                      column.className
                    )}
                  >
                    {column.label}
                  </TableHead>
                )
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((row, index) => (
                <TableRow
                  key={row.id || index}
                  className={getRowClassName(row, index)}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn('py-4', column.className)}
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='text-center h-32 text-muted-foreground'
                >
                  <div className='flex flex-col items-center justify-center space-y-3'>
                    {emptyState?.icon && (
                      <div className='text-muted-foreground/60 text-2xl'>
                        {emptyState.icon}
                      </div>
                    )}
                    <div className='space-y-1'>
                      <p className='font-medium text-foreground'>
                        {emptyState?.title || 'No hay datos disponibles'}
                      </p>
                      {emptyState?.description && (
                        <p className='text-sm text-muted-foreground'>
                          {emptyState.description}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </EnhancedCard>
  );
}
