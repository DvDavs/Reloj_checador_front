'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Tipos de datos más flexibles para aceptar null o undefined
interface EmployeeFormData {
  primerNombre?: string | null;
  segundoNombre?: string | null;
  primerApellido?: string | null;
  segundoApellido?: string | null;
  rfc?: string | null;
  curp?: string | null;
  tarjeta?: number | null;
  nombramiento?: string | null;
  departamento?: number | null;
  academia?: number | null;
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
  // Opciones de ejemplo para Departamentos y Academias (deberían venir de una API)
  const departamentoOptions = [
    { id: 110100, name: 'DIRECCION' },
    { id: 110200, name: 'SUBDIRECCION ACADEMICA' },
    { id: 110300, name: 'SUBDIRECCION DE PLANEACION' },
    { id: 110400, name: 'DEPTO DE CIENCIAS DE LA TIERRA' },
  ];

  const academiaOptions = [
    { id: 110400, name: 'ACADEMIA DE SISTEMAS' },
    { id: 110500, name: 'ACADEMIA DE ELECTRICA' },
    { id: 111200, name: 'ACADEMIA DE ING. MECATRONICA' },
  ];

  return (
    <div className='space-y-6'>
      {/* Nombres */}
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

      {/* Apellidos */}
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

      {/* RFC, CURP y Tarjeta */}
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

      {/* Nombramientos */}
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

      {/* Departamentos / Academias */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='space-y-2'>
          <Label htmlFor='departamento'>Departamento</Label>
          <Select
            value={formData.departamento?.toString() || noneValue}
            onValueChange={(value) => onSelectChange('departamento', value)}
            disabled={isSubmitting}
          >
            <SelectTrigger id='departamento'>
              <SelectValue placeholder='Seleccionar departamento...' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={noneValue}>(Ninguno)</SelectItem>
              {departamentoOptions.map((option) => (
                <SelectItem key={option.id} value={option.id.toString()}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='academia'>Academia</Label>
          <Select
            value={formData.academia?.toString() || noneValue}
            onValueChange={(value) => onSelectChange('academia', value)}
            disabled={isSubmitting}
          >
            <SelectTrigger id='academia'>
              <SelectValue placeholder='Seleccionar academia...' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={noneValue}>(Ninguno)</SelectItem>
              {academiaOptions.map((option) => (
                <SelectItem key={option.id} value={option.id.toString()}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
