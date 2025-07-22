# Guía de Desarrollo de Vistas

Esta guía proporciona estándares y patrones para crear vistas consistentes en la aplicación.

## 🚀 Inicio Rápido

### 1. Importaciones Estándar

```tsx
// React y Next.js
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Shared Components
import {
  PageHeader,
  SearchInput,
  LoadingState,
  ErrorState,
  BreadcrumbNav,
  DataTable
} from "@/app/components/shared";

// Hooks
import { useTableState } from "@/app/hooks/use-table-state";
import { useToast } from "@/components/ui/use-toast";
```

### 2. Estructura Base de Vista de Listado

```tsx
export default function EntityListPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Data state
  const [data, setData] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [selectedItem, setSelectedItem] = useState<Entity | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Table state
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
    data,
    itemsPerPage: 10,
    searchFields: ['name', 'description', 'status'],
    defaultSortField: 'id',
  });

  // Fetch data function
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/entities`);
      setData(response.data || []);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      const errorMsg = err.response?.data?.message || err.message || "Error al cargar datos.";
      setError(`Error al cargar entidades: ${errorMsg}. Verifique la conexión con la API.`);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      <div className="p-6 md:p-8">
        <PageHeader
          title="Gestión de Entidades"
          isLoading={isLoading}
          onRefresh={fetchData}
          actions={
            <Link href="/entities/create">
              <Button className="h-9">
                <Plus className="mr-2 h-4 w-4" />
                Crear
              </Button>
            </Link>
          }
        />

        <SearchInput
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Buscar entidades..."
        />

        {isLoading && <LoadingState message="Cargando entidades..." />}
        {error && <ErrorState message={error} />}

        {!isLoading && !error && (
          <DataTable
            data={paginatedData}
            columns={columns}
            currentPage={currentPage}
            totalPages={totalPages}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onPageChange={handlePageChange}
            emptyMessage="No se encontraron entidades."
          />
        )}
      </div>
      
      <Toaster />
    </>
  );
}
```

### 3. Estructura Base de Vista de Formulario

```tsx
export default function EntityFormPage() {
  const router = useRouter();
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      await axios.post(`${API_BASE_URL}/api/entities`, formData);
      router.push('/entities');
    } catch (err: any) {
      console.error("Error creating entity:", err);
      const backendError = err.response?.data?.message || err.message || "Error desconocido";
      setError(`Error al crear entidad: ${backendError}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <BreadcrumbNav
        items={[
          { label: "Entidades", href: "/entities" },
          { label: "Crear Nueva Entidad" }
        ]}
        backHref="/entities"
      />
      
      <h1 className="text-2xl md:text-3xl font-bold mb-8">
        Crear Nueva Entidad
      </h1>

      <Card className="max-w-3xl mx-auto bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Información de la Entidad</CardTitle>
          <CardDescription>
            Complete los campos requeridos para crear la entidad.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && <ErrorState message={error} />}
            
            {/* Form fields here */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>
              {/* More fields... */}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href="/entities">
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
```

## 📋 Componentes Disponibles

### PageHeader
Encabezado estándar para vistas de listado.

```tsx
<PageHeader
  title="Título de la Vista"
  isLoading={isLoading}
  onRefresh={fetchData}
  actions={<Button>Acción</Button>}
/>
```

### SearchInput
Input de búsqueda con icono.

```tsx
<SearchInput
  value={searchTerm}
  onChange={handleSearch}
  placeholder="Buscar..."
/>
```

### LoadingState & ErrorState
Estados de carga y error consistentes.

```tsx
<LoadingState message="Cargando datos..." />
<ErrorState message="Error al cargar datos" />
```

### BreadcrumbNav
Navegación con breadcrumbs.

```tsx
<BreadcrumbNav
  items={[
    { label: "Inicio", href: "/" },
    { label: "Entidades", href: "/entities" },
    { label: "Crear" }
  ]}
  backHref="/entities"
/>
```

### DataTable
Tabla genérica con funcionalidades estándar.

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
        <Button variant="ghost" size="icon">
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
/>
```

## 🎨 Guía de Estilos

### Colores para Acciones

```tsx
// Ver detalles (Azul)
<Button className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
  <Eye className="h-4 w-4" />
</Button>

// Editar (Verde)
<Button className="text-green-400 hover:text-green-300 hover:bg-green-500/10">
  <Edit className="h-4 w-4" />
</Button>

// Eliminar (Rojo)
<Button className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
  <Trash2 className="h-4 w-4" />
</Button>

// Acción especial (Púrpura)
<Button className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10">
  <Fingerprint className="h-4 w-4" />
</Button>
```

### Estados de Badge

```tsx
// Activo
<Badge
  variant="default"
  className="bg-green-500/20 text-green-400 border-green-500/30"
>
  Activo
</Badge>

// Inactivo
<Badge
  variant="secondary"
  className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
>
  Inactivo
</Badge>
```

### Layout y Espaciado

```tsx
// Contenedor de página
<div className="p-6 md:p-8">

// Título de página
<h1 className="text-2xl md:text-3xl font-bold mb-8">

// Grid responsive
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

// Grupo de acciones
<div className="flex justify-end items-center gap-1">
```

## 🔧 Hook useTableState

Hook personalizado para manejo de estado de tablas.

```tsx
const {
  paginatedData,      // Datos paginados actuales
  searchTerm,         // Término de búsqueda actual
  currentPage,        // Página actual
  sortField,          // Campo de ordenamiento
  sortDirection,      // Dirección de ordenamiento
  totalPages,         // Total de páginas
  handleSearch,       // Función para manejar búsqueda
  handleSort,         // Función para manejar ordenamiento
  handlePageChange,   // Función para cambiar página
} = useTableState({
  data: allData,                    // Todos los datos
  itemsPerPage: 10,                // Items por página
  searchFields: ['name', 'email'], // Campos para búsqueda
  defaultSortField: 'id',          // Campo de ordenamiento por defecto
});
```

## 🎯 Patrones de Manejo de Errores

### Errores de Carga
```tsx
try {
  const response = await axios.get('/api/data');
  setData(response.data || []);
} catch (err: any) {
  console.error("Error fetching data:", err);
  const errorMsg = err.response?.data?.message || err.message || "Error al cargar datos.";
  setError(`Error al cargar entidades: ${errorMsg}. Verifique la conexión con la API.`);
  setData([]);
}
```

### Errores de Formulario
```tsx
try {
  await axios.post('/api/entities', formData);
  router.push('/entities');
} catch (err: any) {
  const backendError = err.response?.data?.message || err.message || "Error desconocido";
  setError(`Error al crear entidad: ${backendError}`);
}
```

### Toast Notifications
```tsx
// Éxito
toast({
  title: "Éxito",
  description: "Operación completada correctamente.",
});

// Error
toast({
  variant: "destructive",
  title: "Error",
  description: "No se pudo completar la operación.",
});
```

## 📱 Responsive Design

### Breakpoints Estándar
- `sm:` - 640px y superior
- `md:` - 768px y superior
- `lg:` - 1024px y superior
- `xl:` - 1280px y superior

### Patrones Comunes
```tsx
// Padding responsive
className="p-6 md:p-8"

// Títulos responsive
className="text-2xl md:text-3xl"

// Layout responsive
className="flex flex-col sm:flex-row"

// Grid responsive
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

## ✅ Checklist de Nueva Vista

- [ ] ✅ Usa componentes compartidos apropiados
- [ ] ✅ Sigue patrones de importación estándar
- [ ] ✅ Implementa manejo de errores consistente
- [ ] ✅ Incluye estados de carga apropiados
- [ ] ✅ Usa colores estándar para acciones
- [ ] ✅ Implementa navegación y breadcrumbs
- [ ] ✅ Es responsive en diferentes pantallas
- [ ] ✅ Incluye accesibilidad básica (aria-labels, titles)
- [ ] ✅ Usa toast notifications para feedback
- [ ] ✅ Maneja casos de datos vacíos

## 📚 Ejemplos de Referencia

- **Vista de Listado:** `app/empleados/page.tsx`
- **Vista de Formulario:** `app/empleados/registrar/page.tsx`
- **Vista de Edición:** `app/empleados/editar/[id]/page.tsx`
- **Componentes Compartidos:** `app/components/shared/`
- **Hooks Personalizados:** `app/hooks/`

---

Para más detalles técnicos, consulta la especificación completa en `.kiro/specs/view-development-guide/`.