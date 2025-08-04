'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getDepartamentos, DepartamentoDto } from '@/lib/api/schedule-api'; // Asumimos que esto existe
import { Loader2 } from 'lucide-react';

// La interfaz ahora usa `string | null` para depto y academia, ya que la clave se manejará como string en el estado.
interface EmployeeFormData {
  primerNombre?: string | null;
  segundoNombre?: string | null;
  primerApellido?: string | null;
  segundoApellido?: string | null;
  rfc?: string | null;
  curp?: string | null;
  tarjeta?: number | null;
  nombramiento?: string | null;
  departamento?: string | null; // La clave se manejará como string en el estado del form
  academia?: string | null; // La clave se manejará como string en el estado del form
  tipoNombramientoSecundario?: string | null;
}

interface EmployeeFormProps {
  formData: EmployeeFormData;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onSelectChange: (name: keyof EmployeeFormData, value: string) => void;
  isSubmitting?: boolean;
  noneValue?: string;
}

export function EmployeeForm({
  formData,
  onChange,
  onSelectChange,
  isSubmitting = false,
  noneValue = '__NONE__',
}: EmployeeFormProps) {
  const [departamentoOptions, setDepartamentoOptions] = useState<
    DepartamentoDto[]
  >([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setIsLoadingCatalog(true);
        setCatalogError(null);
        const data = await getDepartamentos(); // Llama a la API para obtener el catálogo
        setDepartamentoOptions(data);
      } catch (error) {
        console.error('Error al cargar el catálogo de departamentos:', error);
        setCatalogError('No se pudo cargar el catálogo.');
      } finally {
        setIsLoadingCatalog(false);
      }
    };

    loadCatalog();
  }, []);

  return (
    <div className='space-y-6'>
      {/* Nombres y Apellidos (sin cambios) */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='space-y-2'>
          <Label htmlFor='primerNombre'>
            Primer Nombre <span className='text-red-500'>*</span>
          </Label>
          <Input
            id='primerNombre'
            name='primerNombre'
            value={formData.primerNombre || ''}
            onChange={onChange}
            disabled={isSubmitting}
            required
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='segundoNombre'>Segundo Nombre</Label>
          <Input
            id='segundoNombre'
            name='segundoNombre'
            value={formData.segundoNombre || ''}
            onChange={onChange}
            disabled={isSubmitting}
          />
        </div>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='space-y-2'>
          <Label htmlFor='primerApellido'>
            Primer Apellido <span className='text-red-500'>*</span>
          </Label>
          <Input
            id='primerApellido'
            name='primerApellido'
            value={formData.primerApellido || ''}
            onChange={onChange}
            disabled={isSubmitting}
            required
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='segundoApellido'>Segundo Apellido</Label>
          <Input
            id='segundoApellido'
            name='segundoApellido'
            value={formData.segundoApellido || ''}
            onChange={onChange}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* RFC, CURP y Tarjeta (sin cambios) */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='space-y-2'>
          <Label htmlFor='rfc'>
            RFC <span className='text-red-500'>*</span>
          </Label>
          <Input
            id='rfc'
            name='rfc'
            placeholder='XXXX000000XXX'
            value={formData.rfc || ''}
            onChange={onChange}
            maxLength={13}
            className='uppercase'
            disabled={isSubmitting}
            required
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='curp'>
            CURP <span className='text-red-500'>*</span>
          </Label>
          <Input
            id='curp'
            name='curp'
            placeholder='XXXX000000XXXXXX00'
            value={formData.curp || ''}
            onChange={onChange}
            maxLength={18}
            className='uppercase'
            disabled={isSubmitting}
            required
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='tarjeta'>Número de Tarjeta</Label>
          <Input
            id='tarjeta'
            name='tarjeta'
            type='number'
            placeholder='Ej: 12345'
            value={formData.tarjeta ?? ''}
            onChange={onChange}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Nombramientos (sin cambios) */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='space-y-2'>
          <Label htmlFor='nombramiento'>Nombramiento</Label>
          <Select
            value={formData.nombramiento || noneValue}
            onValueChange={(value) => onSelectChange('nombramiento', value)}
            disabled={isSubmitting}
          >
            <SelectTrigger id='nombramiento'>
              <SelectValue placeholder='Seleccionar...' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={noneValue}>(Ninguno)</SelectItem>
              <SelectItem value='DOCENTE'>Docente</SelectItem>
              <SelectItem value='ADMINISTRATIVO'>Administrativo</SelectItem>
              <SelectItem value='MANDO MEDIO'>Mando Medio</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='tipoNombramientoSecundario'>
            Tipo Nombramiento Secundario
          </Label>
          <Select
            value={formData.tipoNombramientoSecundario || noneValue}
            onValueChange={(value) =>
              onSelectChange('tipoNombramientoSecundario', value)
            }
            disabled={isSubmitting}
          >
            <SelectTrigger id='tipoNombramientoSecundario'>
              <SelectValue placeholder='Seleccionar...' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={noneValue}>(Ninguno)</SelectItem>
              <SelectItem value='BASE'>Base</SelectItem>
              <SelectItem value='HONORARIOS'>Honorarios</SelectItem>
              <SelectItem value='CONFIANZA'>Confianza</SelectItem>
              <SelectItem value='INTERINATO'>Interinato</SelectItem>
              <SelectItem value='JEFE'>Jefe</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Departamentos / Academias (CORREGIDO) */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='space-y-2'>
          <Label htmlFor='departamento'>Departamento</Label>
          {isLoadingCatalog ? (
            <div className='flex items-center justify-center h-10 border rounded-md bg-muted'>
              <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
            </div>
          ) : catalogError ? (
            <div className='text-destructive text-sm'>{catalogError}</div>
          ) : (
            <Select
              value={formData.departamento || noneValue}
              onValueChange={(value) => onSelectChange('departamento', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id='departamento'>
                <SelectValue placeholder='Seleccionar departamento...' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={noneValue}>(Ninguno)</SelectItem>
                {departamentoOptions.map((option) => (
                  <SelectItem key={option.clave} value={option.clave}>
                    {option.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className='space-y-2'>
          <Label htmlFor='academia'>Academia</Label>
          {isLoadingCatalog ? (
            <div className='flex items-center justify-center h-10 border rounded-md bg-muted'>
              <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
            </div>
          ) : catalogError ? (
            <div className='text-destructive text-sm'>{catalogError}</div>
          ) : (
            <Select
              value={formData.academia || noneValue}
              onValueChange={(value) => onSelectChange('academia', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id='academia'>
                <SelectValue placeholder='Seleccionar academia...' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={noneValue}>(Ninguno)</SelectItem>
                {departamentoOptions.map((option) => (
                  <SelectItem key={option.clave} value={option.clave}>
                    {option.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  );
}
