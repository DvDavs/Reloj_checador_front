# Referencia de Componentes Compartidos

Esta documentación describe todos los componentes compartidos disponibles para el desarrollo de vistas consistentes.

## 📦 Componentes Disponibles

### PageHeader

Encabezado estándar para vistas de listado con título, botón de refresh y acciones personalizadas.

**Props:**
```typescript
interface PageHeaderProps {
  title: string;           // Título de la página
  isLoading?: boolean;     // Estado de carga para el botón refresh
  onRefresh?: () => void;  // Función para refrescar datos
  actions?: React.ReactNode; // Botones de acción personalizados
}
```

**Ejemplo:**
```tsx
<PageHeader
  title="Gestión de Empleados"
  isLoading={isLoading}
  onRefresh={fetchEmployees}
  actions={
    <Link href="/empleados/registrar">
      <Button className="h-9">
        <UserPlus className="mr-2 h-4 w-4" />
        Registrar
      </Button>
    </Link>
  }
/>
```

---

### SearchInput

Input de búsqueda con icono de lupa integrado.

**Props:**
```typescript
interface SearchInputProps {
  value: string;           // Valor actual del input
  onChange: (value: string) => void; // Callback para cambios
  placeholder?: string;    // Texto placeholder
  className?: string;      // Clases CSS adicionales
}
```

**Ejemplo:**
```tsx
<SearchInput
  value={searchTerm}
  onChange={handleSearch}
  placeholder="Buscar por ID, nombre, RFC, CURP..."
/>
```

---

### LoadingState

Componente para mostrar estados de carga consistentes.

**Props:**
```typescript
interface LoadingStateProps {
  message?: string;        // Mensaje de carga personalizado
  className?: string;      // Clases CSS para el contenedor
}
```

**Ejemplo:**
```tsx
<LoadingState message="Cargando empleados..." />
```

---

### ErrorState

Componente para mostrar estados de error consistentes.

**Props:**
```typescript
interface ErrorStateProps {
  message: string;         // Mensaje de error
  className?: string;      // Clases CSS personalizadas
}
```

**Ejemplo:**
```tsx
<ErrorState message="Error al cargar datos. Verifique la conexión." />
```

---

### SortableHeader

Encabezado de tabla con funcionalidad de ordenamiento.

**Props:**
```typescript
interface SortableHeaderProps {
  field: string;           // Campo para ordenamiento
  children: React.ReactNode; // Contenido del header
  sortField: string | null;  // Campo actualmente ordenado
  sortDirection: "asc" | "desc"; // Dirección de ordenamiento
  onSort: (field: string) => void; // Callback para ordenamiento
}
```

**Ejemplo:**
```tsx
<SortableHeader
  field="name"
  sortField={sortField}
  sortDirection={sortDirection}
  onSort={handleSort}
>
  Nombre
</SortableHeader>
```

---

### PaginationWrapper

Componente de paginación reutilizable con navegación inteligente.

**Props:**
```typescript
interface PaginationWrapperProps {
  currentPage: number;     // Página actual
  totalPages: number;      // Total de páginas
  onPageChange: (page: number) => void; // Callback para cambio de página
}
```

**Ejemplo:**
```tsx
<PaginationWrapper
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={handlePageChange}
/>
```

---

### BreadcrumbNav

Navegación con breadcrumbs y botón de retroceso opcional.

**Props:**
```typescript
interface BreadcrumbItem {
  label: string;           // Texto del breadcrumb
  href?: string;           // URL (opcional para el último item)
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[]; // Array de breadcrumbs
  backHref?: string;       // URL para botón de retroceso
  className?: string;      // Clases CSS adicionales
}
```

**Ejemplo:**
```tsx
<BreadcrumbNav
  items={[
    { label: "Empleados", href: "/empleados" },
    { label: "Editar Empleado" }
  ]}
  backHref="/empleados"
/>
```

---

### EmployeeForm

Formulario reutilizable para datos de empleado.

**Props:**
```typescript
interface EmployeeFormData {
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  rfc: string;
  curp: string;
  tipoNombramientoPrincipal: string;
  tipoNombramientoSecundario: string;
}

interface EmployeeFormProps {
  formData: EmployeeFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: keyof EmployeeFormData, value: string) => void;
  isSubmitting?: boolean;
  noneValue?: string;      // Valor para "ninguno" en selects
}
```

**Ejemplo:**
```tsx
<EmployeeForm
  formData={formData}
  onChange={handleChange}
  onSelectChange={handleSelectChange}
  isSubmitting={isSubmitting}
/>
```

---

### DataTable

Tabla genérica con funcionalidades completas de ordenamiento y paginación.

**Props:**
```typescript
interface Column<T> {
  key: string;             // Clave del campo
  label: string;           // Etiqueta de la columna
  sortable?: boolean;      // Si es ordenable
  render?: (item: T) => React.ReactNode; // Renderizado personalizado
  className?: string;      // Clases CSS para la columna
}

interface DataTableProps<T> {
  data: T[];               // Datos a mostrar
  columns: Column<T>[];    // Configuración de columnas
  currentPage: number;     // Página actual
  totalPages: number;      // Total de páginas
  sortField: string | null; // Campo de ordenamiento
  sortDirection: "asc" | "desc"; // Dirección de ordenamiento
  onSort: (field: string) => void; // Callback de ordenamiento
  onPageChange: (page: number) => void; // Callback de paginación
  emptyMessage?: string;   // Mensaje cuando no hay datos
  className?: string;      // Clases CSS adicionales
}
```

**Ejemplo:**
```tsx
const columns = [
  {
    key: 'id',
    label: 'ID',
    sortable: true,
    className: 'font-medium'
  },
  {
    key: 'name',
    label: 'Nombre',
    sortable: true
  },
  {
    key: 'actions',
    label: 'Acciones',
    className: 'text-right',
    render: (item) => (
      <div className="flex justify-end items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleView(item)}
          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    )
  }
];

<DataTable
  data={paginatedData}
  columns={columns}
  currentPage={currentPage}
  totalPages={totalPages}
  sortField={sortField}
  sortDirection={sortDirection}
  onSort={handleSort}
  onPageChange={handlePageChange}
  emptyMessage="No se encontraron registros."
/>
```

## 🎣 Hook useTableState

Hook personalizado para manejo completo del estado de tablas.

**Parámetros:**
```typescript
interface UseTableStateProps<T> {
  data: T[];               // Datos completos
  itemsPerPage?: number;   // Items por página (default: 10)
  searchFields?: (keyof T)[]; // Campos para búsqueda
  defaultSortField?: string;  // Campo de ordenamiento inicial
}
```

**Retorna:**
```typescript
{
  // Datos procesados
  filteredData: T[];       // Datos filtrados por búsqueda
  sortedData: T[];         // Datos ordenados
  paginatedData: T[];      // Datos de la página actual
  
  // Estado actual
  searchTerm: string;      // Término de búsqueda
  currentPage: number;     // Página actual
  sortField: string | null; // Campo de ordenamiento
  sortDirection: "asc" | "desc"; // Dirección de ordenamiento
  totalPages: number;      // Total de páginas
  
  // Handlers
  handleSearch: (value: string) => void;
  handleSort: (field: string) => void;
  handlePageChange: (page: number) => void;
  setCurrentPage: (page: number) => void;
}
```

**Ejemplo:**
```tsx
const {
  paginatedData,
  searchTerm,
  currentPage,
  sortField,
  sortDirection,
  totalPages,
  handleSearch,
  handleSort,
  handlePageChange,
} = useTableState({
  data: employees,
  itemsPerPage: 10,
  searchFields: ['name', 'email', 'department'],
  defaultSortField: 'id',
});
```

## 🎨 Patrones de Estilo

### Colores para Acciones

```tsx
// Ver detalles - Azul
className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"

// Editar - Verde
className="text-green-400 hover:text-green-300 hover:bg-green-500/10"

// Eliminar - Rojo
className="text-red-400 hover:text-red-300 hover:bg-red-500/10"

// Acción especial - Púrpura
className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
```

### Estados de Badge

```tsx
// Estado activo
<Badge
  variant="default"
  className="bg-green-500/20 text-green-400 border-green-500/30"
>
  Activo
</Badge>

// Estado inactivo
<Badge
  variant="secondary"
  className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
>
  Inactivo
</Badge>
```

### Layout Responsive

```tsx
// Contenedor de página
className="p-6 md:p-8"

// Título responsive
className="text-2xl md:text-3xl font-bold mb-8"

// Grid responsive
className="grid grid-cols-1 md:grid-cols-2 gap-6"

// Flex responsive
className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
```

## 📋 Importación de Componentes

### Importación Individual
```tsx
import { PageHeader } from "@/app/components/shared/page-header";
import { SearchInput } from "@/app/components/shared/search-input";
```

### Importación Múltiple (Recomendado)
```tsx
import {
  PageHeader,
  SearchInput,
  LoadingState,
  ErrorState,
  SortableHeader,
  PaginationWrapper,
  BreadcrumbNav,
  DataTable
} from "@/app/components/shared";
```

## 🔧 Personalización

### Extender Componentes

Si necesitas personalizar un componente, puedes extenderlo:

```tsx
// Crear un componente personalizado
export function CustomPageHeader({ title, subtitle, ...props }: CustomProps) {
  return (
    <div>
      <PageHeader title={title} {...props} />
      {subtitle && <p className="text-zinc-400 mt-2">{subtitle}</p>}
    </div>
  );
}
```

### Temas Personalizados

Los componentes respetan las variables CSS del tema:

```css
:root {
  --primary: 220 14.3% 95.9%;
  --primary-foreground: 220.9 39.3% 11%;
  --secondary: 220 14.3% 95.9%;
  --secondary-foreground: 220.9 39.3% 11%;
  /* ... más variables */
}
```

## 🧪 Testing

### Testing de Componentes

```tsx
import { render, screen } from '@testing-library/react';
import { PageHeader } from '@/app/components/shared';

test('renders page header with title', () => {
  render(<PageHeader title="Test Title" />);
  expect(screen.getByText('Test Title')).toBeInTheDocument();
});
```

### Testing de Hooks

```tsx
import { renderHook, act } from '@testing-library/react';
import { useTableState } from '@/app/hooks/use-table-state';

test('filters data correctly', () => {
  const { result } = renderHook(() => useTableState({
    data: mockData,
    searchFields: ['name']
  }));

  act(() => {
    result.current.handleSearch('test');
  });

  expect(result.current.filteredData).toHaveLength(1);
});
```

---

Para ejemplos completos de implementación, consulta:
- `app/empleados/page.tsx` - Vista de listado completa
- `app/horarios/asignados/page.tsx` - Implementación con DataTable
- `app/empleados/registrar/page.tsx` - Formulario con validación