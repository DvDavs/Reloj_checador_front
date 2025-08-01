"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  noneValue?: string;
}

export function EmployeeForm({ 
  formData, 
  onChange, 
  onSelectChange, 
  isSubmitting = false,
  noneValue = "__NONE__"
}: EmployeeFormProps) {
  return (
    <div className="space-y-6">
      {/* Nombres */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="primerNombre">
            Primer Nombre <span className="text-red-500">*</span>
          </Label>
          <Input
            id="primerNombre"
            name="primerNombre"
            value={formData.primerNombre}
            onChange={onChange}
            disabled={isSubmitting}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="segundoNombre">Segundo Nombre</Label>
          <Input
            id="segundoNombre"
            name="segundoNombre"
            value={formData.segundoNombre}
            onChange={onChange}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Apellidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="primerApellido">
            Primer Apellido <span className="text-red-500">*</span>
          </Label>
          <Input
            id="primerApellido"
            name="primerApellido"
            value={formData.primerApellido}
            onChange={onChange}
            disabled={isSubmitting}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="segundoApellido">Segundo Apellido</Label>
          <Input
            id="segundoApellido"
            name="segundoApellido"
            value={formData.segundoApellido}
            onChange={onChange}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* RFC y CURP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="rfc">
            RFC <span className="text-red-500">*</span>
          </Label>
          <Input
            id="rfc"
            name="rfc"
            placeholder="XXXX000000XXX"
            value={formData.rfc}
            onChange={onChange}
            maxLength={13}
            className="uppercase"
            disabled={isSubmitting}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="curp">
            CURP <span className="text-red-500">*</span>
          </Label>
          <Input
            id="curp"
            name="curp"
            placeholder="XXXX000000XXXXXX00"
            value={formData.curp}
            onChange={onChange}
            maxLength={18}
            className="uppercase"
            disabled={isSubmitting}
            required
          />
        </div>
      </div>

      {/* Nombramientos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="tipoNombramientoPrincipal">Nombramiento Principal</Label>
          <Select
            value={formData.tipoNombramientoPrincipal || noneValue}
            onValueChange={(value) => onSelectChange("tipoNombramientoPrincipal", value)}
            disabled={isSubmitting}
          >
            <SelectTrigger id="tipoNombramientoPrincipal">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={noneValue}>(Ninguno)</SelectItem>
              <SelectItem value="DOCENTE">Docente</SelectItem>
              <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipoNombramientoSecundario">Nombramiento Secundario</Label>
          <Select
            value={formData.tipoNombramientoSecundario || noneValue}
            onValueChange={(value) => onSelectChange("tipoNombramientoSecundario", value)}
            disabled={isSubmitting}
          >
            <SelectTrigger id="tipoNombramientoSecundario">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={noneValue}>(Ninguno)</SelectItem>
              <SelectItem value="BASE">Base</SelectItem>
              <SelectItem value="HONORARIOS">Honorarios</SelectItem>
              <SelectItem value="CONFIANZA">Confianza</SelectItem>
              <SelectItem value="INTERINATO">Interinato</SelectItem>
              <SelectItem value="JEFE">Jefe</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}