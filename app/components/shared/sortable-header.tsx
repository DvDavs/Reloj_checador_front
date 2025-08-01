"use client";

import { TableHead } from "@/components/ui/table";
import { ChevronUp, ChevronDown } from "lucide-react";

interface SortableHeaderProps {
  field: string;
  children: React.ReactNode;
  sortField: string | null;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
}

export function SortableHeader({
  field,
  children,
  sortField,
  sortDirection,
  onSort,
}: SortableHeaderProps) {
  return (
    <TableHead
      className="cursor-pointer hover:bg-zinc-800/50 select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-2">
        {children}
        <div className="flex flex-col">
          <ChevronUp
            className={`h-3 w-3 ${
              sortField === field && sortDirection === "asc"
                ? "text-blue-400"
                : "text-zinc-600"
            }`}
          />
          <ChevronDown
            className={`h-3 w-3 -mt-1 ${
              sortField === field && sortDirection === "desc"
                ? "text-blue-400"
                : "text-zinc-600"
            }`}
          />
        </div>
      </div>
    </TableHead>
  );
}