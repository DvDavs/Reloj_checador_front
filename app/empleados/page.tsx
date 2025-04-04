"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination"
import { UserPlus, Search, Edit, Trash2, Fingerprint, Loader2, AlertCircle, UserMinus, RefreshCw } from "lucide-react"
import axios from 'axios';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// --- Tipos ---
interface EmpleadoBackend {
    id: number;
    rfc: string | null;
    curp: string | null;
    primerNombre: string | null;
    segundoNombre: string | null;
    primerApellido: string | null;
    segundoApellido: string | null;
    departamentoAcademicoId: number | null;
    departamentoAdministrativoId: number | null;
    tipoNombramientoPrincipal: string | null;
    tipoNombramientoSecundario: string | null;
    estatusId: number | null; // ID numérico (puede ser null)
    estatusNombre: string | null; // *** CAMPO PARA EL NOMBRE DEL ESTATUS ***
    correoInstitucional: string | null;
    uuid: string | null;
    // Añade más campos si tu backend los devuelve y los necesitas mostrar
}

interface EmployeeDisplayData {
    id: number;
    numeroTarjeta: string;
    nombre: string;
    rfc: string;
    curp: string;
    area: string;
    estado: string; // Usaremos estatusNombre aquí
}

// --- Constantes ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const ITEMS_PER_PAGE = 10;

// --- Helper para Paginación ---
const getPaginationRange = (currentPage: number, totalPages: number, siblingCount = 1): (number | '...')[] => {
    const totalPageNumbers = siblingCount + 5;

    if (totalPages <= totalPageNumbers) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!shouldShowLeftDots && shouldShowRightDots) {
        let leftItemCount = 3 + 2 * siblingCount;
        let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
        return [...leftRange, '...', totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
        let rightItemCount = 3 + 2 * siblingCount;
        let rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1);
        return [firstPageIndex, '...', ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
        let middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i);
        return [firstPageIndex, '...', ...middleRange, '...', lastPageIndex];
    }

    // Fallback (no debería ocurrir con la lógica anterior)
    return Array.from({ length: totalPages }, (_, i) => i + 1);
};


// --- Componente ---
export default function EmpleadosPage() {
  const [allEmployees, setAllEmployees] = useState<EmpleadoBackend[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmpleadoBackend[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<EmpleadoBackend | null>(null);

  // --- Helper para construir nombre completo ---
  const getFullName = useCallback((emp: EmpleadoBackend | null): string => {
    if (!emp) return 'N/A';
    const nameParts = [emp.primerNombre, emp.segundoNombre, emp.primerApellido, emp.segundoApellido]
                        .filter(Boolean); // Filtra null, undefined, ""
    return nameParts.join(" ") || 'Nombre no disponible';
  }, []);

  // --- Cargar empleados ---
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log(`Workspaceing employees from: ${API_BASE_URL}/api/empleados`);
      const response = await axios.get<EmpleadoBackend[]>(`${API_BASE_URL}/api/empleados`);
      const data = response.data || [];
      console.log(`Raw data received (${data.length} employees):`, data.slice(0, 5)); // Log primeros 5
      setAllEmployees(data);
      setFilteredEmployees(data); // Inicializar filtrados
      setCurrentPage(1);
    } catch (err: any) {
      console.error("Error fetching employees:", err);
      const errorMsg = err.response?.data?.message || err.message || "No se pudo cargar la lista de empleados.";
      setError(`Error al cargar empleados: ${errorMsg}. Verifique la conexión con la API (${API_BASE_URL}).`);
      setAllEmployees([]);
      setFilteredEmployees([]);
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL]);

  // Cargar empleados iniciales
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Aplicar filtros
  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = allEmployees.filter((employee) => {
      const fullName = getFullName(employee).toLowerCase();
      const matchesSearch =
        employee.id.toString().includes(lowerSearchTerm) ||
        fullName.includes(lowerSearchTerm) ||
        (employee.rfc && employee.rfc.toLowerCase().includes(lowerSearchTerm)) ||
        (employee.curp && employee.curp.toLowerCase().includes(lowerSearchTerm)) ||
        (employee.correoInstitucional && employee.correoInstitucional.toLowerCase().includes(lowerSearchTerm)) ||
        (employee.estatusNombre && employee.estatusNombre.toLowerCase().includes(lowerSearchTerm)); // Buscar por nombre de estatus

      // Añadir más filtros aquí si es necesario
      return matchesSearch;
    });

    setFilteredEmployees(filtered);

    const newTotalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(1);
    } else if (filtered.length === 0) {
      setCurrentPage(1);
    }
  }, [searchTerm, allEmployees, currentPage, getFullName]);

  // Calcular paginación sobre los empleados *filtrados*
  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // --- Mapeo para Visualización (con estatusNombre) ---
  const mapEmployeeToDisplay = useCallback((emp: EmpleadoBackend): EmployeeDisplayData => {
    let area = 'N/A';
    if (emp.departamentoAcademicoId) area = `Académico ${emp.departamentoAcademicoId}`; // Idealmente buscar nombre
    else if (emp.departamentoAdministrativoId) area = `Admin. ${emp.departamentoAdministrativoId}`; // Idealmente buscar nombre

    // *** USA EL CAMPO estatusNombre DIRECTAMENTE ***
    const estadoNombre = emp.estatusNombre ?? 'Desconocido';

    return {
      id: emp.id,
      numeroTarjeta: `ID-${emp.id}`,
      nombre: getFullName(emp),
      rfc: emp.rfc ?? 'N/A',
      curp: emp.curp ?? 'N/A',
      area: area,
      estado: estadoNombre, // Asigna el nombre directo
    };
  }, [getFullName]);

  // --- Funciones de Acciones (Editar, Borrar) ---
  const handleEdit = (employeeId: number) => {
    alert(`Funcionalidad EDITAR para empleado ID: ${employeeId} pendiente.`);
    // router.push(`/empleados/editar/${employeeId}`);
  };

  const confirmDelete = (employee: EmpleadoBackend) => {
    setEmployeeToDelete(employee);
    // setShowDeleteConfirm(true); // Esto se maneja por el trigger del AlertDialog ahora
  };

  const handleDelete = async () => {
    if (!employeeToDelete) return;
    setIsLoading(true);
    setError(null);
    try {
      console.log(`Attempting to delete employee ID: ${employeeToDelete.id}`);
      alert(`Simulación: Empleado ID ${employeeToDelete.id} eliminado (ENDPOINT DELETE PENDIENTE). Recargando lista...`);
      // await axios.delete(`${API_BASE_URL}/api/empleados/${employeeToDelete.id}`); // Descomentar cuando esté la API
      await fetchEmployees(); // Recargar lista
    } catch (err: any) {
      console.error("Error deleting employee:", err);
      const errorMsg = err.response?.data?.message || err.message || "Error desconocido";
      setError(`Error al eliminar empleado "${getFullName(employeeToDelete)}": ${errorMsg}`);
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false); // Cierra el diálogo (si onOpenChange no lo hace)
      setEmployeeToDelete(null);
    }
  };

  // --- Renderizado ---
  return (
    <AlertDialog onOpenChange={setShowDeleteConfirm} open={showDeleteConfirm}> {/* Mover AlertDialog aquí */}
      <div className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Gestión de Empleados</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchEmployees} disabled={isLoading} title="Refrescar lista">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            {/* Link para registrar (deshabilitado temporalmente) */}
            <Link href="/empleados/registrar" legacyBehavior>
               <Button className="bg-green-600 hover:bg-green-700" disabled={false}> {/* Habilitar cuando POST funcione */}
                   <UserPlus className="mr-2 h-4 w-4" /> Registrar Nuevo
               </Button>
            </Link>
          </div>
        </div>

        {/* Mensaje de Error Global */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 text-red-400 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-300 hover:text-white">&times;</button>
          </div>
        )}

        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 md:p-6 mb-6">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative md:col-span-2 lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Buscar por Nombre, ID, RFC, CURP, Correo, Estado..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
              />
            </div>
             {/* Filtros adicionales deshabilitados por ahora */}
            <div>
              <Select disabled={true}>
                <SelectTrigger><SelectValue placeholder="Filtrar por área..." /></SelectTrigger>
                <SelectContent><SelectItem value="todos">Todas las áreas</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Select disabled={true} >
                <SelectTrigger><SelectValue placeholder="Filtrar por estado..." /></SelectTrigger>
                <SelectContent><SelectItem value="todos">Todos los estados</SelectItem></SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabla */}
          <div className="rounded-md border border-zinc-700 overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-800">
                <TableRow>
                  <TableHead className="text-white">ID</TableHead>
                  <TableHead className="text-white min-w-[200px]">Nombre</TableHead>
                  <TableHead className="text-white">RFC</TableHead>
                  <TableHead className="text-white">CURP</TableHead>
                  <TableHead className="text-white">Área</TableHead>
                  <TableHead className="text-white">Estado</TableHead>
                  <TableHead className="text-white text-right min-w-[150px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <div className="flex justify-center items-center gap-2 text-zinc-500">
                        <Loader2 className="h-6 w-6 animate-spin" /><span>Cargando empleados...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedEmployees.length > 0 ? (
                  paginatedEmployees.map((employee) => {
                    const displayData = mapEmployeeToDisplay(employee);
                    const fullName = displayData.nombre; // Usar nombre completo calculado
                    return (
                      <TableRow key={employee.id} className="hover:bg-zinc-800/50">
                        <TableCell className="font-medium">{displayData.id}</TableCell>
                        <TableCell>{fullName}</TableCell>
                        <TableCell>{displayData.rfc}</TableCell>
                        <TableCell>{displayData.curp}</TableCell>
                        <TableCell>{displayData.area}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                               displayData.estado.toLowerCase() === 'activo'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : displayData.estado.toLowerCase().includes('baja') || displayData.estado.toLowerCase().includes('inactivo')
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
                            }`}
                          >
                            {displayData.estado}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex space-x-1 justify-end">
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
                              onClick={() => handleEdit(employee.id)}
                              title="Editar empleado (pendiente)"
                              disabled // Habilitar cuando API PUT esté lista
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {/* Trigger para el AlertDialog */}
                            <AlertDialogTrigger asChild>
                               <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-900/30"
                                onClick={() => confirmDelete(employee)} // Prepara el empleado a borrar
                                title="Eliminar empleado (pendiente de API)"
                                disabled // Habilitar cuando API DELETE esté lista
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            {/* Link para Asignar Huella */}
                             <Link href={`/empleados/asignar-huella?id=${employee.id}&nombre=${encodeURIComponent(fullName)}`}>
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-8 w-8 text-purple-500 hover:text-purple-400 hover:bg-purple-900/30"
                                  title="Asignar/Ver huella"
                                >
                                  <Fingerprint className="h-4 w-4" />
                                </Button>
                             </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-zinc-500">
                      {!isLoading && error ? "Error al cargar datos." : "No se encontraron empleados con los filtros aplicados."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación (CORREGIDA) */}
          {totalPages > 1 && !isLoading && (
          <div className="mt-6 flex justify-center">
              <Pagination>
                  <PaginationContent>
                      <PaginationItem>
                      <PaginationPrevious
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          href="#" // Previene navegación real
                          aria-disabled={currentPage === 1}
                      />
                      </PaginationItem>

                      {/* *** USA LA FUNCIÓN HELPER *** */}
                      {getPaginationRange(currentPage, totalPages).map((pageNumber, index) => {
                      if (pageNumber === '...') {
                          // Asegúrate de tener una key única para los puntos
                          return <PaginationItem key={`dots-${index}`}><span className="px-4 py-2 text-sm text-zinc-500">...</span></PaginationItem>;
                      }
                      return (
                          <PaginationItem key={pageNumber}>
                              <PaginationLink
                                  isActive={currentPage === pageNumber}
                                  onClick={(e) => {
                                      e.preventDefault(); // Previene comportamiento default del link
                                      setCurrentPage(pageNumber as number)
                                  }}
                                  href="#" // Previene navegación real
                                  className="cursor-pointer"
                                  aria-current={currentPage === pageNumber ? 'page' : undefined}
                              >
                                  {pageNumber}
                              </PaginationLink>
                          </PaginationItem>
                      );
                      })}

                      <PaginationItem>
                      <PaginationNext
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          href="#" // Previene navegación real
                          aria-disabled={currentPage === totalPages}
                      />
                      </PaginationItem>
                  </PaginationContent>
              </Pagination>
          </div>
          )}
        </div>

        {/* Contenido del AlertDialog para Confirmar Eliminación */}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea eliminar al empleado <strong className="text-white">{getFullName(employeeToDelete)}</strong> (ID: {employeeToDelete?.id})?
              Esta acción no se puede deshacer (funcionalidad de borrado pendiente en API).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEmployeeToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </div>
    </AlertDialog> // Mover AlertDialog para envolver todo
  )
}