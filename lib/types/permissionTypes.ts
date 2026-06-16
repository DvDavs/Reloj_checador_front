export interface PermissionDto {
  id: number;
  nombre: string;
  descripcion: string;
  modulo: string;
  accion: string;
  createdAt?: string;
}

export type PermissionsGrouped = Record<string, PermissionDto[]>;
