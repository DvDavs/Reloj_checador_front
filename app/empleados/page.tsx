"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination"
import { UserPlus, Search, Edit, Trash2, Fingerprint, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react"
import axios from 'axios';

// --- Tipos ---
interface BackendUser {
    id: number;
    name: string;
    email: string | null;
    fingerprintTemplate: string | null; // Asume que viene null o como algo (no necesitamos el contenido aquí)
}

interface EmployeeDisplayData {
    id: number;
    numeroTarjeta: string; // Placeholder o del backend si se añade
    nombre: string;
    rfc: string; // Placeholder o del backend
    curp: string; // Placeholder o del backend
    area: string; // Placeholder o del backend
    estado: string; // Placeholder o del backend
    huellaAsignada: boolean;
}

// --- Constantes ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const ITEMS_PER_PAGE = 7; // Ajusta según necesites

export default function EmpleadosPage() {
  const [allEmployees, setAllEmployees] = useState<EmployeeDisplayData[]>([]); // Todos los empleados cargados
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeDisplayData[]>([]); // Empleados después de filtrar
  const [searchTerm, setSearchTerm] = useState("");
  const [areaFilter, setAreaFilter] = useState("todos");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [huellaFilter, setHuellaFilter] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar empleados iniciales
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Aplicar filtros cuando cambien los criterios o la lista base
  useEffect(() => {
    filterAndPaginateEmployees();
  }, [searchTerm, areaFilter, estadoFilter, huellaFilter, allEmployees, currentPage]); // Depender también de currentPage

  // Función para cargar empleados del backend
  const fetchEmployees = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get<BackendUser[]>(`${API_BASE_URL}/api/users`);
      const backendUsers = response.data;

      // *** Adaptación de Datos ***
      const displayData = backendUsers.map(user => ({
        id: user.id,
        nombre: user.name,
        huellaAsignada: user.fingerprintTemplate !== null && user.fingerprintTemplate !== "", // Verifica que no sea null o vacío
        // --- Campos Placeholder (necesitan datos reales del backend eventualmente) ---
        numeroTarjeta: `EMP-${user.id.toString().padStart(4, '0')}`,
        rfc: 'PENDIENTE',
        curp: 'PENDIENTE',
        area: 'Sistemas', // Asignar un área por defecto o PENDIENTE
        estado: 'Activo', // Asumir Activo o PENDIENTE
      }));

      setAllEmployees(displayData); // Guardar todos los empleados
      // El useEffect de filtros se encargará de actualizar filteredEmployees

    } catch (err) {
      console.error("Error fetching employees:", err);
      setError("No se pudo cargar la lista de empleados. Verifique la conexión con el backend.");
      setAllEmployees([]); // Limpiar en caso de error
      setFilteredEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para filtrar y paginar (se ejecuta en el cliente)
  const filterAndPaginateEmployees = () => {
      const filtered = allEmployees.filter((employee) => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const matchesSearch =
          employee.nombre.toLowerCase().includes(lowerSearchTerm) ||
          employee.numeroTarjeta.toLowerCase().includes(lowerSearchTerm);
          // Añadir más campos a la búsqueda si se obtienen del backend
          // || employee.rfc.toLowerCase().includes(lowerSearchTerm)
          // || employee.curp.toLowerCase().includes(lowerSearchTerm)

        const matchesArea = areaFilter === "todos" || employee.area === areaFilter; // Funcionará mejor cuando area venga del backend
        const matchesEstado = estadoFilter === "todos" || employee.estado === estadoFilter; // Funcionará mejor cuando estado venga del backend
        const matchesHuella =
          huellaFilter === "todos" ||
          (huellaFilter === "asignada" && employee.huellaAsignada) ||
          (huellaFilter === "no-asignada" && !employee.huellaAsignada);

        return matchesSearch && matchesArea && matchesEstado && matchesHuella;
      });
      setFilteredEmployees(filtered);
       // Resetear a página 1 si los filtros cambian y la página actual queda fuera de rango
       const newTotalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
       if (currentPage > newTotalPages && newTotalPages > 0) {
           setCurrentPage(1);
       } else if (filtered.length === 0) {
            setCurrentPage(1); // Resetear si no hay resultados
       }
  };

  // Calcular paginación sobre los empleados *filtrados*
  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Obtener áreas únicas de los empleados cargados para el filtro
  const uniqueAreas = Array.from(new Set(allEmployees.map((emp) => emp.area)));

  // Manejar eliminación
  const handleDelete = async (employeeId: number, employeeName: string) => {
      if (window.confirm(`¿Está seguro de eliminar al empleado "${employeeName}" (ID: ${employeeId})? Esta acción no se puede deshacer.`)) {
          // Podrías mostrar un loader específico para la fila
          try {
              await axios.delete(`${API_BASE_URL}/api/users/${employeeId}`);
              // Eliminar de la lista local para respuesta instantánea y luego refrescar
              setAllEmployees(prev => prev.filter(emp => emp.id !== employeeId));
              // O simplemente volver a cargar todo:
              // fetchEmployees();
          } catch (err) {
              console.error("Error deleting employee:", err);
              alert(`Error al eliminar el empleado "${employeeName}".`);
              // Podrías mostrar un mensaje de error más específico
          }
      }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Empleados</h1>
        <Link href="/empleados/registrar">
          <Button className="bg-green-600 hover:bg-green-700">
            <UserPlus className="mr-2 h-4 w-4" />
            Registrar Nuevo
          </Button>
        </Link>
      </div>

      {/* Mensaje de Error */}
      {error && (
         <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 text-red-400 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
         </div>
      )}

      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6 mb-8">
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Buscar por Nombre o Tarjeta..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} // Reset page on search change
            />
          </div>

          <div>
            <Select value={areaFilter} onValueChange={(value) => { setAreaFilter(value); setCurrentPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las áreas</SelectItem>
                {uniqueAreas.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={estadoFilter} onValueChange={(value) => { setEstadoFilter(value); setCurrentPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={huellaFilter} onValueChange={(value) => { setHuellaFilter(value); setCurrentPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por huella" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="asignada">Con huella</SelectItem>
                <SelectItem value="no-asignada">Sin huella</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabla */}
        <div className="rounded-md border border-zinc-700 overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-800">
              <TableRow>
                <TableHead className="text-white">Nº Tarjeta</TableHead>
                <TableHead className="text-white">Nombre</TableHead>
                {/* <TableHead className="hidden md:table-cell text-white">RFC</TableHead> */}
                {/* <TableHead className="hidden lg:table-cell text-white">CURP</TableHead> */}
                <TableHead className="text-white">Área</TableHead>
                <TableHead className="text-white">Estado</TableHead>
                <TableHead className="text-white">Huella</TableHead>
                <TableHead className="text-white text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <div className="flex justify-center items-center gap-2 text-zinc-500">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Cargando empleados...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-zinc-800/50">
                    <TableCell className="font-medium">{employee.numeroTarjeta}</TableCell>
                    <TableCell>{employee.nombre}</TableCell>
                    {/* <TableCell className="hidden md:table-cell">{employee.rfc}</TableCell> */}
                    {/* <TableCell className="hidden lg:table-cell">{employee.curp}</TableCell> */}
                    <TableCell>{employee.area}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          employee.estado === "Activo" ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {employee.estado}
                      </span>
                    </TableCell>
                    <TableCell>
                      {employee.huellaAsignada ? (
                        <CheckCircle className="h-5 w-5 text-green-500" aria-label="Huella asignada" />
                      ) : (
                        <XCircle className="h-5 w-5 text-zinc-500" aria-label="Huella no asignada" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex space-x-1 justify-end">
                        {/* Botón Editar (funcionalidad pendiente) */}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-700" disabled title="Editar (pendiente)">
                          <Edit className="h-4 w-4" />
                        </Button>
                         {/* Botón Eliminar */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-900/30"
                          onClick={() => handleDelete(employee.id, employee.nombre)}
                          title="Eliminar empleado"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                         {/* Botón Asignar Huella */}
                        {/* Siempre mostrarlo, o solo si !huellaAsignada? Por ahora siempre */}
                        <Link href={`/empleados/asignar-huella?id=${employee.id}&nombre=${encodeURIComponent(employee.nombre)}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-purple-500 hover:text-purple-400 hover:bg-purple-900/30"
                              title={employee.huellaAsignada ? "Ver/Reasignar huella" : "Asignar huella"}
                            >
                              <Fingerprint className="h-4 w-4" />
                            </Button>
                          </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-zinc-500">
                    No se encontraron empleados con los filtros seleccionados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && !isLoading && (
          <div className="mt-6 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => {
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {/* Renderizar números de página (simplificado para pocas páginas) */}
                 {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink isActive={currentPage === i + 1} onClick={() => setCurrentPage(i + 1)}>
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                 ))}
                 {/* Considerar lógica de paginación más avanzada para muchas páginas (...) */}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => {
                      if (currentPage !== totalPages) {
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                      }
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  )
}
