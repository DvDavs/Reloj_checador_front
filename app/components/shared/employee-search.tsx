"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useDebounce } from "use-debounce";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EmpleadoSimpleDTO } from "@/app/horarios/asignados/registrar/types";
import { searchEmployees } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface EmployeeSearchProps {
  value: EmpleadoSimpleDTO | null;
  onChange: (employee: EmpleadoSimpleDTO | null) => void;
  placeholder?: string;
  disabled?: boolean;
  showAllOnOpen?: boolean;
}

export function EmployeeSearch({
  value,
  onChange,
  placeholder = "Buscar por nombre, RFC o CURP...", // <-- Placeholder actualizado
  disabled = false,
  showAllOnOpen = false,
}: EmployeeSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const [employees, setEmployees] = React.useState<EmpleadoSimpleDTO[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchEmployees = async () => {
      if (!debouncedSearchTerm && !showAllOnOpen) {
        setEmployees([]);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const data = debouncedSearchTerm
          ? await searchEmployees(debouncedSearchTerm)
          : showAllOnOpen
            ? await searchEmployees("")
            : [];
        setEmployees(data || []);
      } catch (err: any) {
        setError(err.message || "Error al cargar empleados");
        setEmployees([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchEmployees();
    }
  }, [debouncedSearchTerm, open, showAllOnOpen]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value
            ? value.nombreCompleto // Mantenemos solo el nombre en el botón para que no sea muy largo
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder={placeholder} // Usar el placeholder actualizado
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {isLoading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {error && (
                <div className="p-2">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error de Búsqueda</AlertTitle>
                        <AlertDescription>
                            {error}
                        </AlertDescription>
                    </Alert>
                </div>
            )}
            {!isLoading && !error && (
              <>
                <CommandEmpty>No se encontraron empleados.</CommandEmpty>
                <motion.div
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CommandGroup>
                    {employees.map((employee) => (
                      <CommandItem
                        key={employee.id}
                        value={`${employee.nombreCompleto} ${employee.rfc || ''} ${employee.curp || ''}`}
                        onSelect={() => {
                          onChange(employee);
                          setOpen(false);
                        }}
                        className="flex items-center space-x-4 p-2 cursor-pointer hover:bg-accent"
                      >
                        <Avatar>
                          <AvatarImage src={undefined} alt={employee.nombreCompleto} />
                          <AvatarFallback>{getInitials(employee.nombreCompleto)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-semibold">{employee.nombreCompleto}</span>
                          {(employee.rfc || employee.curp) && (
                            <span className="text-xs text-zinc-500">
                              {employee.rfc && <span>RFC: {employee.rfc}</span>}
                              {employee.rfc && employee.curp && <span className="mx-1">•</span>}
                              {employee.curp && <span>CURP: {employee.curp}</span>}
                            </span>
                          )}
                        </div>
                        <Check
                          className={cn(
                            "ml-auto h-5 w-5",
                            value?.id === employee.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </motion.div>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 