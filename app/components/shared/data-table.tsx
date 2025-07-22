"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableHeader } from "./sortable-header";
import { PaginationWrapper } from "./pagination-wrapper";

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  currentPage: number;
  totalPages: number;
  sortField: string | null;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
  onPageChange: (page: number) => void;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  currentPage,
  totalPages,
  sortField,
  sortDirection,
  onSort,
  onPageChange,
  emptyMessage = "No se encontraron datos.",
  className = "",
}: DataTableProps<T>) {
  return (
    <>
      <div className={`overflow-x-auto rounded-lg border ${className}`}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
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
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((item, index) => (
                <TableRow key={item.id || index}>
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.render ? column.render(item) : item[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center h-24">
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