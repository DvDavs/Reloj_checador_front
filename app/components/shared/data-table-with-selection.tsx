'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Check, Minus } from 'lucide-react';
import { SortableHeader } from './sortable-header';
import { PaginationWrapper } from './pagination-wrapper';

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableWithSelectionProps<T> {
  data: T[];
  columns: Column<T>[];
  currentPage: number;
  totalPages: number;
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onPageChange: (page: number) => void;
  // Nuevas props para selección múltiple
  enableSelection?: boolean;
  selectedIds: number[];
  onSelectionChange: (selectedIds: number[]) => void;
  getItemId: (item: T) => number;
  // Props existentes
  emptyMessage?: string;
  className?: string;
}

export function DataTableWithSelection<T extends Record<string, any>>({
  data,
  columns,
  currentPage,
  totalPages,
  sortField,
  sortDirection,
  onSort,
  onPageChange,
  enableSelection = false,
  selectedIds,
  onSelectionChange,
  getItemId,
  emptyMessage = 'No se encontraron datos.',
  className = '',
}: DataTableWithSelectionProps<T>) {
  // ============================================================================
  // HANDLERS DE SELECCIÓN
  // ============================================================================

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = data.map((item) => getItemId(item));
      onSelectionChange(allIds);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectItem = (itemId: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, itemId]);
    } else {
      onSelectionChange(selectedIds.filter((id) => id !== itemId));
    }
  };

  // ============================================================================
  // ESTADO DE SELECCIÓN
  // ============================================================================

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;
  const isIndeterminate =
    selectedIds.length > 0 && selectedIds.length < data.length;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <div className={`overflow-x-auto rounded-lg border ${className}`}>
        <Table>
          <TableHeader>
            <TableRow>
              {/* Columna de checkbox para selección múltiple */}
              {enableSelection && (
                <TableHead className='w-12'>
                  {isIndeterminate ? (
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-4 w-4 p-0 border border-primary'
                      onClick={() => handleSelectAll(false)}
                      aria-label='Deseleccionar todos'
                    >
                      <Minus className='h-3 w-3' />
                    </Button>
                  ) : (
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label='Seleccionar todos'
                    />
                  )}
                </TableHead>
              )}

              {/* Columnas de datos */}
              {columns.map((column) =>
                column.sortable ? (
                  <SortableHeader
                    key={column.key}
                    field={column.key}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={onSort}
                  >
                    {column.label}
                  </SortableHeader>
                ) : (
                  <TableHead key={column.key} className={column.className}>
                    {column.label}
                  </TableHead>
                )
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((item, index) => {
                const itemId = getItemId(item);
                const isSelected = selectedIds.includes(itemId);

                return (
                  <TableRow
                    key={itemId || index}
                    className={isSelected ? 'bg-muted/50' : ''}
                  >
                    {/* Celda de checkbox */}
                    {enableSelection && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleSelectItem(itemId, checked as boolean)
                          }
                          aria-label={`Seleccionar fila ${index + 1}`}
                        />
                      </TableCell>
                    )}

                    {/* Celdas de datos */}
                    {columns.map((column) => (
                      <TableCell key={column.key} className={column.className}>
                        {column.render ? column.render(item) : item[column.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (enableSelection ? 1 : 0)}
                  className='text-center h-24'
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationWrapper
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </>
  );
}
