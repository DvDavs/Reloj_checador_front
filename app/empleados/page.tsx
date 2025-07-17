"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    UserPlus,
    Search,
    Edit,
    Loader2,
    AlertCircle,
    RefreshCw,
    Eye,
    Fingerprint,
    ChevronUp,
    ChevronDown,
} from "lucide-react";
import axios from "axios";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmployeeDetailsModal } from "./components/employee-details-modal";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Badge } from "@/components/ui/badge";

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
    estatusId: number | null;
    estatusNombre: string | null;
    correoInstitucional: string | null;
    uuid: string | null;
}

interface EmployeeDisplayData {
    id: number;
    numeroTarjeta: string;
    nombre: string;
    rfc: string;
    curp: string;
    area: string;
    estado: string;
}

// --- Constantes ---
const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const ITEMS_PER_PAGE = 10;

// --- Helper para Paginación ---
const getPaginationRange = (
    currentPage: number,
    totalPages: number,
    siblingCount = 1
): (number | "...")[] => {
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
        return [...leftRange, "...", totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
        let rightItemCount = 3 + 2 * siblingCount;
        let rightRange = Array.from(
            { length: rightItemCount },
            (_, i) => totalPages - rightItemCount + i + 1
        );
        return [firstPageIndex, "...", ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
        let middleRange = Array.from(
            { length: rightSiblingIndex - leftSiblingIndex + 1 },
            (_, i) => leftSiblingIndex + i
        );
        return [firstPageIndex, "...", ...middleRange, "...", lastPageIndex];
    }

    return Array.from({ length: totalPages }, (_, i) => i + 1);
};

// --- Componente ---
export default function EmpleadosPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [allEmployees, setAllEmployees] = useState<EmpleadoBackend[]>([]);
    const [filteredEmployees, setFilteredEmployees] = useState<
        EmpleadoBackend[]
    >([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] =
        useState<EmpleadoBackend | null>(null);
    const [isDeletingEmployee, setIsDeletingEmployee] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] =
        useState<EmpleadoBackend | null>(null);
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    const getFullName = useCallback((emp: EmpleadoBackend | null): string => {
        if (!emp) return "N/A";
        const nameParts = [
            emp.primerNombre,
            emp.segundoNombre,
            emp.primerApellido,
            emp.segundoApellido,
        ].filter(Boolean);
        return nameParts.join(" ") || "Nombre no disponible";
    }, []);

    const fetchEmployees = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get<EmpleadoBackend[]>(
                `${API_BASE_URL}/api/empleados`
            );
            setAllEmployees(response.data || []);
            setFilteredEmployees(response.data || []);
        } catch (err: any) {
            console.error("Error fetching employees:", err);
            const errorMsg =
                err.response?.data?.message ||
                err.message ||
                "No se pudo cargar la lista de empleados.";
            setError(
                `Error al cargar empleados: ${errorMsg}. Verifique la conexión con la API.`
            );
            setAllEmployees([]);
            setFilteredEmployees([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    useEffect(() => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const filtered = allEmployees.filter((employee) => {
            const fullName = getFullName(employee).toLowerCase();
            const matchesSearch =
                employee.id.toString().includes(lowerSearchTerm) ||
                fullName.includes(lowerSearchTerm) ||
                (employee.rfc &&
                    employee.rfc.toLowerCase().includes(lowerSearchTerm)) ||
                (employee.curp &&
                    employee.curp.toLowerCase().includes(lowerSearchTerm)) ||
                (employee.correoInstitucional &&
                    employee.correoInstitucional
                        .toLowerCase()
                        .includes(lowerSearchTerm)) ||
                (employee.estatusNombre &&
                    employee.estatusNombre
                        .toLowerCase()
                        .includes(lowerSearchTerm));

            return matchesSearch;
        });

        setFilteredEmployees(filtered);
        const newTotalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
        if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(1);
        } else if (newTotalPages === 0) {
            setCurrentPage(1);
        }
    }, [searchTerm, allEmployees, currentPage, getFullName]);

    const mapEmployeeToDisplay = useCallback(
        (emp: EmpleadoBackend): EmployeeDisplayData => {
            let area = "N/A";
            if (emp.departamentoAcademicoId) area = `Académico`;
            else if (emp.departamentoAdministrativoId) area = `Admin.`;

            const estadoNombre = emp.estatusNombre ?? "Desconocido";

            return {
                id: emp.id,
                numeroTarjeta: `ID-${emp.id}`,
                nombre: getFullName(emp),
                rfc: emp.rfc ?? "N/A",
                curp: emp.curp ?? "N/A",
                area: area,
                estado: estadoNombre,
            };
        },
        [getFullName]
    );

    const handleEdit = (employeeId: number) => {
        router.push(`/empleados/editar/${employeeId}`);
    };

    const confirmDelete = (employee: EmpleadoBackend) => {
        setEmployeeToDelete(employee);
        setShowDeleteConfirm(true);
    };

    const handleDelete = async () => {
        if (!employeeToDelete) return;
        setIsDeletingEmployee(true);
        try {
            await axios.delete(
                `${API_BASE_URL}/api/empleados/${employeeToDelete.id}`
            );
            toast({
                title: "Empleado Eliminado",
                description: `El empleado ${getFullName(
                    employeeToDelete
                )} ha sido eliminado.`,
            });
            fetchEmployees();
        } catch (error) {
            console.error("Error deleting employee:", error);
            toast({
                title: "Error al Eliminar",
                description:
                    "No se pudo eliminar el empleado. Es posible que tenga registros de asistencia asociados.",
                variant: "destructive",
            });
        } finally {
            setIsDeletingEmployee(false);
            setShowDeleteConfirm(false);
            setEmployeeToDelete(null);
        }
    };

    const handleViewDetails = (employee: EmpleadoBackend) => {
        setSelectedEmployee(employee);
        setShowDetailsModal(true);
    };

    const handleCloseDetailsModal = () => {
        setShowDetailsModal(false);
        setSelectedEmployee(null);
    };

    const handleFingerprintDeleted = () => {
        // El modal ya muestra una notificación, así que no es necesario hacer nada aquí.
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const getSortedEmployees = useCallback(() => {
        if (!sortField) return filteredEmployees;

        return [...filteredEmployees].sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortField) {
                case "id":
                    aValue = a.id;
                    bValue = b.id;
                    break;
                case "nombre":
                    aValue = getFullName(a).toLowerCase();
                    bValue = getFullName(b).toLowerCase();
                    break;
                case "rfc":
                    aValue = (a.rfc || "").toLowerCase();
                    bValue = (b.rfc || "").toLowerCase();
                    break;
                case "estado":
                    aValue = (a.estatusNombre || "").toLowerCase();
                    bValue = (b.estatusNombre || "").toLowerCase();
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
            if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }, [filteredEmployees, sortField, sortDirection, getFullName]);

    const sortedEmployees = getSortedEmployees();

    const totalPages = Math.ceil(sortedEmployees.length / ITEMS_PER_PAGE);
    const paginatedEmployees = sortedEmployees.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const SortableHeader = ({
        field,
        children,
    }: {
        field: string;
        children: React.ReactNode;
    }) => (
        <TableHead
            className="cursor-pointer hover:bg-zinc-800/50 select-none"
            onClick={() => handleSort(field)}
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

    return (
        <>
            <div className="p-6 md:p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h1 className="text-2xl md:text-3xl font-bold">
                        Gestión de Empleados
                    </h1>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => fetchEmployees()}
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${
                                    isLoading ? "animate-spin" : ""
                                }`}
                            />
                            <span className="sr-only">Refrescar</span>
                        </Button>
                        <Link href="/empleados/registrar">
                            <Button className="h-9">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Registrar
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                    <Input
                        type="search"
                        placeholder="Buscar por ID, nombre, RFC, CURP..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-10 w-full"
                    />
                </div>

                {isLoading && (
                    <div className="flex justify-center items-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <p className="ml-4 text-lg">Cargando empleados...</p>
                    </div>
                )}
                {error && (
                    <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-4 rounded-md">
                        <AlertCircle className="h-6 w-6" />
                        <p>{error}</p>
                    </div>
                )}

                {!isLoading && !error && (
                    <>
                        <div className="overflow-x-auto rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <SortableHeader field="id">
                                            ID
                                        </SortableHeader>
                                        <SortableHeader field="nombre">
                                            Nombre Completo
                                        </SortableHeader>
                                        <SortableHeader field="rfc">
                                            RFC
                                        </SortableHeader>
                                        <SortableHeader field="estado">
                                            Estado
                                        </SortableHeader>
                                        <TableHead className="text-right">
                                            Acciones
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedEmployees.length > 0 ? (
                                        paginatedEmployees.map((employee) => {
                                            const displayData =
                                                mapEmployeeToDisplay(employee);
                                            return (
                                                <TableRow key={employee.id}>
                                                    <TableCell className="font-medium">
                                                        {displayData.id}
                                                    </TableCell>
                                                    <TableCell>
                                                        {displayData.nombre}
                                                    </TableCell>
                                                    <TableCell>
                                                        {displayData.rfc}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                displayData.estado.toLowerCase() ===
                                                                "activo"
                                                                    ? "default"
                                                                    : "secondary"
                                                            }
                                                            className={
                                                                displayData.estado.toLowerCase() ===
                                                                "activo"
                                                                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                                                                    : "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                                                            }
                                                        >
                                                            {displayData.estado}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end items-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() =>
                                                                    handleViewDetails(
                                                                        employee
                                                                    )
                                                                }
                                                                title="Ver Detalles"
                                                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() =>
                                                                    handleEdit(
                                                                        employee.id
                                                                    )
                                                                }
                                                                title="Editar Empleado"
                                                                className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Link
                                                                href={`/empleados/asignar-huella?id=${
                                                                    employee.id
                                                                }&nombre=${encodeURIComponent(
                                                                    displayData.nombre
                                                                )}`}
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    title="Asignar Huella"
                                                                    className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
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
                                            <TableCell
                                                colSpan={5}
                                                className="text-center h-24"
                                            >
                                                No se encontraron empleados.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-6">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setCurrentPage((p) =>
                                                        Math.max(1, p - 1)
                                                    );
                                                }}
                                                className={
                                                    currentPage === 1
                                                        ? "pointer-events-none opacity-50"
                                                        : ""
                                                }
                                            />
                                        </PaginationItem>

                                        {getPaginationRange(
                                            currentPage,
                                            totalPages
                                        ).map((page, index) => (
                                            <PaginationItem key={index}>
                                                {page === "..." ? (
                                                    <span className="px-4 py-2">
                                                        ...
                                                    </span>
                                                ) : (
                                                    <PaginationLink
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setCurrentPage(
                                                                page as number
                                                            );
                                                        }}
                                                        isActive={
                                                            currentPage === page
                                                        }
                                                    >
                                                        {page}
                                                    </PaginationLink>
                                                )}
                                            </PaginationItem>
                                        ))}

                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setCurrentPage((p) =>
                                                        Math.min(
                                                            totalPages,
                                                            p + 1
                                                        )
                                                    );
                                                }}
                                                className={
                                                    currentPage === totalPages
                                                        ? "pointer-events-none opacity-50"
                                                        : ""
                                                }
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </>
                )}
            </div>

            <AlertDialog
                onOpenChange={setShowDeleteConfirm}
                open={showDeleteConfirm}
            >
                <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                            Confirmar Eliminación
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400 pt-2">
                            ¿Estás seguro de que quieres eliminar al empleado{" "}
                            <strong className="text-red-400">
                                {getFullName(employeeToDelete)}
                            </strong>
                            ?
                            <br />
                            Esta acción es permanente y no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            disabled={isDeletingEmployee}
                            className="border-zinc-700 hover:bg-zinc-800"
                        >
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeletingEmployee}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeletingEmployee ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Eliminando...
                                </>
                            ) : (
                                "Sí, eliminar empleado"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {selectedEmployee && (
                <EmployeeDetailsModal
                    employee={selectedEmployee}
                    isOpen={showDetailsModal}
                    onClose={handleCloseDetailsModal}
                    onFingerprintDeleted={handleFingerprintDeleted}
                />
            )}
            <Toaster />
        </>
    );
}
