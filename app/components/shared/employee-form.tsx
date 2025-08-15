'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getDepartamentos, DepartamentoDto } from '@/lib/api/schedule-api';
import { DepartmentSearchableSelect } from './department-searchable-select';
import { SearchableSelect } from '@/app/components/shared/searchable-select';
import { Loader2 } from 'lucide-react';

interface EmployeeFormData {
  primerNombre?: string | null;
  segundoNombre?: string | null;
  primerApellido?: string | null;
  segundoApellido?: string | null;
  rfc?: string | null;
  curp?: string | null;
  tarjeta?: number | null;
  nombramiento?: string | null;
  departamento?: string | null;
  academia?: string | null;
  tipoNombramientoSecundario?: string | null;
  permiteChecarConPin?: boolean;
}

interface EmployeeFormProps {
  formData: EmployeeFormData;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onSelectChange: (name: keyof EmployeeFormData, value: string) => void;
  onSwitchChange?: (name: keyof EmployeeFormData, value: boolean) => void;
  onDepartmentChange?: (
    name: keyof EmployeeFormData,
    department: DepartamentoDto | null
  ) => void;
  isSubmitting?: boolean;
  noneValue?: string;
}

export function EmployeeForm({
  formData,
  onChange,
  onSelectChange,
  onSwitchChange,
  onDepartmentChange,
  isSubmitting = false,
  noneValue = '__NONE__',
}: EmployeeFormProps) {
  const [departamentoOptions, setDepartamentoOptions] = useState<
    DepartamentoDto[]
  >([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Opciones para nombramiento
  const nombramientoOptions = [
    { value: 'DOCENTE', label: 'Docente' },
    { value: 'ADMINISTRATIVO', label: 'Administrativo' },
    { value: 'MANDO MEDIO', label: 'Mando Medio' },
  ];

  // Opciones para tipo nombramiento secundario
  const tipoNombramientoSecundarioOptions = [
    { value: 'BASE', label: 'Base' },
    { value: 'HONORARIOS', label: 'Honorarios' },
    { value: 'CONFIANZA', label: 'Confianza' },
    { value: 'INTERINATO', label: 'Interinato' },
    { value: 'JEFE', label: 'Jefe' },
  ];

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setIsLoadingCatalog(true);
        setCatalogError(null);
        const data = await getDepartamentos();
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

      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <div className='space-y-0.5'>
            <Label htmlFor='permiteChecarConPin'>
              Permitir Check-in con PIN
            </Label>
            <p className='text-sm text-muted-foreground'>
              Permite al empleado usar su número de tarjeta para registrar
              entrada/salida
            </p>
          </div>
          <Switch
            id='permiteChecarConPin'
            checked={formData.permiteChecarConPin || false}
            onCheckedChange={(checked) =>
              onSwitchChange?.('permiteChecarConPin', checked)
            }
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='space-y-2'>
          <Label htmlFor='nombramiento'>Nombramiento</Label>
          <SearchableSelect
            value={
              formData.nombramiento === noneValue
                ? null
                : formData.nombramiento || null
            }
            onChange={(value: string | null) =>
              onSelectChange('nombramiento', value || noneValue)
            }
            options={nombramientoOptions}
            placeholder='Seleccionar nombramiento...'
            disabled={isSubmitting}
            allowClear={true}
            emptyMessage='No se encontraron nombramientos.'
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='tipoNombramientoSecundario'>
            Tipo Nombramiento Secundario
          </Label>
          <SearchableSelect
            value={
              formData.tipoNombramientoSecundario === noneValue
                ? null
                : formData.tipoNombramientoSecundario || null
            }
            onChange={(value: string | null) =>
              onSelectChange('tipoNombramientoSecundario', value || noneValue)
            }
            options={tipoNombramientoSecundarioOptions}
            placeholder='Seleccionar tipo nombramiento...'
            disabled={isSubmitting}
            allowClear={true}
            emptyMessage='No se encontraron tipos de nombramiento.'
          />
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='space-y-2'>
          <Label htmlFor='departamento'>Departamento</Label>
          <DepartmentSearchableSelect
            value={
              departamentoOptions.find(
                (d) => d.clave === formData.departamento
              ) || null
            }
            onChange={(dept: DepartamentoDto | null) => {
              if (onDepartmentChange) {
                onDepartmentChange('departamento', dept);
              } else {
                onSelectChange('departamento', dept?.clave || noneValue);
              }
            }}
            placeholder='Buscar departamento...'
            disabled={isSubmitting}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='academia'>Academia</Label>
          <DepartmentSearchableSelect
            value={
              departamentoOptions.find((d) => d.clave === formData.academia) ||
              null
            }
            onChange={(dept: DepartamentoDto | null) => {
              if (onDepartmentChange) {
                onDepartmentChange('academia', dept);
              } else {
                onSelectChange('academia', dept?.clave || noneValue);
              }
            }}
            placeholder='Buscar academia...'
            disabled={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
