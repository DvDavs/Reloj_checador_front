"use client";

import { useState, useCallback, useMemo } from "react";

interface UseTableStateProps<T> {
  data: T[];
  itemsPerPage?: number;
  searchFields?: (keyof T)[];
  defaultSortField?: string;
}

export function useTableState<T extends Record<string, any>>({
  data,
  itemsPerPage = 10,
  searchFields = [],
  defaultSortField,
}: UseTableStateProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string | null>(defaultSortField || null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filtrar datos basado en el término de búsqueda
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return data.filter((item) => {
      return searchFields.some((field) => {
        const value = item[field];
        if (value == null) return false;
        return String(value).toLowerCase().includes(lowerSearchTerm);
      });
    });
  }, [data, searchTerm, searchFields]);

  // Ordenar datos
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (aStr < bStr) return sortDirection === "asc" ? -1 : 1;
      if (aStr > bStr) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortDirection]);

  // Calcular paginación
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  // Handlers
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }, [sortField, sortDirection]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Ajustar página actual si es necesario
  const adjustedCurrentPage = useMemo(() => {
    if (totalPages === 0) return 1;
    return Math.min(currentPage, totalPages);
  }, [currentPage, totalPages]);

  return {
    // Data
    filteredData,
    sortedData,
    paginatedData,
    
    // State
    searchTerm,
    currentPage: adjustedCurrentPage,
    sortField,
    sortDirection,
    totalPages,
    
    // Handlers
    handleSearch,
    handleSort,
    handlePageChange,
    setCurrentPage,
  };
}