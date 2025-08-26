import { apiClient } from '../apiClient';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export async function uploadEmpleadoFoto(empleadoId: number, file: File) {
  const formData = new FormData();
  formData.append('foto', file);

  const url = `${API_BASE_URL}/api/empleados/${empleadoId}/foto`;
  const response = await apiClient.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data as {
    success: boolean;
    message: string;
    fotoUrl?: string;
    errorCode?: string;
  };
}

export async function deleteEmpleadoFoto(empleadoId: number) {
  const url = `${API_BASE_URL}/api/empleados/${empleadoId}/foto`;
  await apiClient.delete(url);
}

export async function fetchEmpleadoFotoBlob(
  empleadoId: number
): Promise<Blob | null> {
  const url = `${API_BASE_URL}/api/empleados/${empleadoId}/foto`;
  try {
    const response = await apiClient.get(url, { responseType: 'blob' });
    if (response.status === 204) return null;
    return response.data as Blob;
  } catch (err: any) {
    if (err?.response?.status === 204 || err?.response?.status === 404)
      return null;
    throw err;
  }
}
