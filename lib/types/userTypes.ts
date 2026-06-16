import { RoleDto } from './roleTypes';

export interface UserDto {
  id: number;
  username: string;
  roles: RoleDto[];
  fechaCreacion?: string;
}

export interface UserCreateDto {
  username: string;
  password: string;
  roleIds?: number[];
}

export interface UserUpdateDto {
  password?: string;
  roleIds?: number[];
}
