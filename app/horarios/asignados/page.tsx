"use client"

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { HorarioAsignadoDto } from "./types";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2, UserPlus } from "lucide-react";
import { DetailsDialog } from "./components/details-dialog";
import { DeleteConfirmationDialog } from "./components/delete-confirmation-dialog";
import { useToast } from "@/components/ui/use-toast";

// Shared components
import { PageHeader } from "@/app/components/shared/page-header";
import { SearchInput } from "@/app/components/shared/search-input";
import { LoadingState } from "@/app/components/shared/loading-state";
import { ErrorState } from "@/app/components/shared/error-state";
import { SortableHeader } from "@/app/components/shared/sortable-header";
import { PaginationWrapper } from "@/app/components/shared/pagination-wrapper";
import { useDebounce } from "@/app/hooks/use-debounce";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const ITEMS_PER_PAGE = 10;

export default function HorariosAsignadosPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Data state
  const [data, setData] = useState<{ content: HorarioAsignadoDto[], totalPages: number }>({ content: [], totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Table state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Modal state
  const [selectedItem, setSelectedItem] = useState<HorarioAsignadoDto | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchHorariosAsignados = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: ITEMS_PER_PAGE.toString(),
        sort: `${sortField},${sortDirection}`,
        search: debouncedSearchTerm,
      });

      const response = await axios.get(`${API_BASE_URL}/api/horarios-asignados/paginado?${params.toString()}`);
      setData(response.data);
    } catch (err: any) {
      console.error("Error fetching horarios asignados:", err);
      const errorMsg = err.response?.data?.message || err.message || "No se pudo cargar la lista de horarios asignados.";
      setError(`Error al cargar horarios asignados: ${errorMsg}. Verifique la conexión con la API.`);
      setData({ content: [], totalPages: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, sortField, sortDirection, debouncedSearchTerm]);

  useEffect(() => {
    fetchHorariosAsignados();
  }, [fetchHorariosAsignados]);

  const handleSort = (field: string) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0); // Reset to first page on new search
  };

  const handleViewDetails = (item: HorarioAsignadoDto) => {
    setSelectedItem(item);
    setIsDetailsOpen(true);
  };

  const closeDetailsDialog = () => {
    setSelectedItem(null);
    setIsDetailsOpen(false);
  };

  const openDeleteDialog = (item: HorarioAsignadoDto) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    setIsDeleting(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/horarios-asignados/${selectedItem.id}`);
      
      // Refetch the data for the current page
      fetchHorariosAsignados();
      setIsDeleteDialogOpen(false);
      
      toast({
        title: "Éxito",
        description: "El horario ha sido desasignado correctamente.",
      });
    } catch (err: any) {
      console.error("Error deleting horario asignado:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo desasignar el horario. Inténtelo de nuevo.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/horarios/asignados/editar/${id}`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <div className="p-6 md:p-8">
        <PageHeader
          title="Horarios Asignados"
          isLoading={isLoading}
          onRefresh={fetchHorariosAsignados}
          actions={
            <Link href="/horarios/asignados/registrar">
              <Button className="h-9">
                <UserPlus className="mr-2 h-4 w-4" />
                Registrar
              </Button>
            </Link>
          }
        />

        <SearchInput
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Buscar por empleado, horario, tipo..."
        />

        {isLoading && (
          <LoadingState message="Cargando horarios asignados..." />
        )}

        {error && (
          <ErrorState message={error} />
        )}

        {!isLoading && !error && (
          <>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader
                      field="id"
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    >
                      ID
                    </SortableHeader>
                    <SortableHeader
                      field="empleado.nombreCompleto" // Adjust field for backend sorting
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    >
                      Empleado
                    </SortableHeader>
                    <SortableHeader
                      field="horario.nombre" // Adjust field for backend sorting
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    >
                      Horario
                    </SortableHeader>
                    <SortableHeader
                      field="tipoHorario.nombre" // Adjust field for backend sorting
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    >
                      Tipo Horario
                    </SortableHeader>
                    <SortableHeader
                      field="fechaInicio"
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    >
                        Fecha Inicio
                    </SortableHeader>
                     <SortableHeader
                      field="fechaFin"
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    >
                        Fecha Fin
                    </SortableHeader>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.content.length > 0 ? (
                    data.content.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>{item.empleadoNombre}</TableCell>
                        <TableCell>{item.horarioNombre}</TableCell>
                        <TableCell>{item.tipoHorarioNombre}</TableCell>
                        <TableCell>{formatDate(item.fechaInicio)}</TableCell>
                        <TableCell>{formatDate(item.fechaFin)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={item.activo ? "default" : "secondary"}
                            className={
                              item.activo
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                            }
                          >
                            {item.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetails(item)}
                              title="Ver Detalles"
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(item.id)}
                              title="Editar Horario"
                              className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(item)}
                              title="Desasignar Horario"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center h-24">
                        No se encontraron horarios asignados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <PaginationWrapper
              currentPage={currentPage}
              totalPages={data.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      <DetailsDialog
        isOpen={isDetailsOpen}
        onClose={closeDetailsDialog}
        item={selectedItem}
      />
      
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
      
    </>
  );
} 