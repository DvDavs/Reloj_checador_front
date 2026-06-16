import { apiClient } from '@/lib/apiClient';
import { RoleCreateDto, RoleDto, RoleUpdateDto } from '@/lib/types/roleTypes';

export async function getRoles(): Promise<RoleDto[]> {
  const { data } = await apiClient.get<RoleDto[]>('/api/roles');
  return data;
}

export async function getRoleById(id: number): Promise<RoleDto> {
  const { data } = await apiClient.get<RoleDto>(`/api/roles/${id}`);
  return data;
}

export async function createRole(dto: RoleCreateDto): Promise<RoleDto> {
  const { data } = await apiClient.post<RoleDto>('/api/roles', dto);
  return data;
}

export async function updateRole(
  id: number,
  dto: RoleUpdateDto
): Promise<RoleDto> {
  const { data } = await apiClient.put<RoleDto>(`/api/roles/${id}`, dto);
  return data;
}

export async function deleteRole(id: number): Promise<void> {
  await apiClient.delete(`/api/roles/${id}`);
}

export async function deactivateRole(id: number): Promise<void> {
  await apiClient.patch(`/api/roles/${id}/deactivate`);
}

export async function assignRoleToUser(
  roleId: number,
  userId: number
): Promise<void> {
  await apiClient.post(`/api/roles/${roleId}/users/${userId}`);
}

export async function removeRoleFromUser(
  roleId: number,
  userId: number
): Promise<void> {
  await apiClient.delete(`/api/roles/${roleId}/users/${userId}`);
}
