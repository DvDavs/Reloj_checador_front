import { apiClient } from '@/lib/apiClient';
import { UserCreateDto, UserDto, UserUpdateDto } from '@/lib/types/userTypes';

export async function getUsers(): Promise<UserDto[]> {
  const { data } = await apiClient.get<UserDto[]>('/api/usuarios');
  return data;
}

export async function getUserById(id: number): Promise<UserDto> {
  const { data } = await apiClient.get<UserDto>(`/api/usuarios/${id}`);
  return data;
}

export async function createUser(dto: UserCreateDto): Promise<UserDto> {
  const { data } = await apiClient.post<UserDto>('/api/usuarios', dto);
  return data;
}

export async function updateUser(
  id: number,
  dto: UserUpdateDto
): Promise<UserDto> {
  const { data } = await apiClient.put<UserDto>(`/api/usuarios/${id}`, dto);
  return data;
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/api/usuarios/${id}`);
}
