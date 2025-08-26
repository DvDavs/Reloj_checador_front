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
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { DetailsDialog } from '@/app/horarios/asignados/components/details-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

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
  // Opcional: habilitar botón de calendario por fila
  showScheduleButton?: boolean;
  // Debe devolver el item esperado por DetailsDialog o null si no hay horario activo
  resolveScheduleItem?: (row: any) => Promise<any> | any;
  // URL para redirigir a asignar horario cuando no haya horario activo
  getAssignScheduleUrl?: (row: any) => string;
  // Nombre a mostrar del empleado en el diálogo vacío
  getEmployeeName?: (row: any) => string;
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
  showScheduleButton = false,
  resolveScheduleItem,
  getAssignScheduleUrl,
  getEmployeeName,
}: EnhancedTableProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<any | null>(
    null
  );
  const [noScheduleOpen, setNoScheduleOpen] = useState(false);
  const [noScheduleRow, setNoScheduleRow] = useState<any | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const getRowClassName = (row: any, index: number) => {
    if (typeof rowClassName === 'function') {
      return rowClassName(row, index);
    }
    return rowClassName || 'enhanced-table-row';
  };

  const handleViewSchedule = async (row: any) => {
    if (!resolveScheduleItem) return;
    try {
      setIsResolving(true);
      const item = await resolveScheduleItem(row);
      if (item) {
        setSelectedScheduleItem(item);
        setIsDetailsOpen(true);
      } else {
        setNoScheduleRow(row);
        setNoScheduleOpen(true);
      }
    } finally {
      setIsResolving(false);
    }
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
              {showScheduleButton && (
                <TableHead className='font-semibold text-foreground py-4 text-right'>
                  Horario
                </TableHead>
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
                  {showScheduleButton && (
                    <TableCell className='py-4 text-right'>
                      <Button
                        variant='ghost'
                        size='icon'
                        title='Ver horario'
                        onClick={() => handleViewSchedule(row)}
                        disabled={isResolving || !resolveScheduleItem}
                      >
                        <Calendar className='h-4 w-4' />
                      </Button>
                    </TableCell>
                  )}
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
      {/* Details dialog para horario activo */}
      <DetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedScheduleItem(null);
        }}
        item={selectedScheduleItem}
      />
      {/* Diálogo cuando no hay horario asignado */}
      <Dialog open={noScheduleOpen} onOpenChange={setNoScheduleOpen}>
        <DialogContent className='sm:max-w-[500px] bg-card border-border text-card-foreground'>
          <DialogHeader className='text-center space-y-2'>
            <div className='mx-auto w-14 h-14 bg-muted rounded-full flex items-center justify-center border border-border'>
              <Calendar className='w-7 h-7 text-muted-foreground' />
            </div>
            <DialogTitle className='text-xl font-bold text-foreground'>
              Sin Horario Asignado
            </DialogTitle>
            <DialogDescription className='text-muted-foreground'>
              {getEmployeeName && noScheduleRow
                ? `${getEmployeeName(noScheduleRow)} no tiene un horario activo asignado.`
                : 'No hay un horario activo asignado para este registro.'}
            </DialogDescription>
          </DialogHeader>
          <div className='pt-2 grid grid-cols-1 gap-3'>
            {getAssignScheduleUrl && noScheduleRow && (
              <Button
                onClick={() => {
                  const url = getAssignScheduleUrl(noScheduleRow);
                  if (url) window.location.href = url;
                }}
                className='w-full justify-center'
              >
                Asignar Horario
              </Button>
            )}
            <Button
              variant='outline'
              onClick={() => setNoScheduleOpen(false)}
              className='w-full'
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </EnhancedCard>
  );
}
