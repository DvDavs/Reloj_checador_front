import { PermissionDto } from './permissionTypes';

export interface RoleDto {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  permisos: PermissionDto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RoleCreateDto {
  nombre: string;
  descripcion?: string;
  permisoIds: number[];
}

export interface RoleUpdateDto {
  descripcion?: string;
  activo?: boolean;
  permisoIds?: number[];
}
