import { apiClient } from '@/lib/apiClient';
import { PermissionDto, PermissionsGrouped } from '@/lib/types/permissionTypes';

export async function getPermissions(): Promise<PermissionDto[]> {
  const { data } = await apiClient.get<PermissionDto[]>('/api/permissions');
  return data;
}

export async function getPermissionsGrouped(): Promise<PermissionsGrouped> {
  const { data } = await apiClient.get<PermissionsGrouped>(
    '/api/permissions/grouped'
  );
  return data;
}

export async function getPermissionsByUser(
  userId: number
): Promise<PermissionDto[]> {
  const { data } = await apiClient.get<PermissionDto[]>(
    `/api/permissions/users/${userId}`
  );
  return data;
}

export async function checkUserPermission(
  userId: number,
  permission: string
): Promise<boolean> {
  const { data } = await apiClient.get<{ hasPermission: boolean }>(
    `/api/permissions/users/${userId}/check`,
    { params: { permission } }
  );
  return data.hasPermission;
}
