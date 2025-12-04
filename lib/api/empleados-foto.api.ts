import { apiClient } from '../apiClient';

export async function uploadEmpleadoFoto(empleadoId: number, file: File) {
  const formData = new FormData();
  formData.append('foto', file);

  const response = await apiClient.post(
    `/api/empleados/${empleadoId}/foto`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return response.data as {
    success: boolean;
    message: string;
    fotoUrl?: string;
    errorCode?: string;
  };
}

export async function deleteEmpleadoFoto(empleadoId: number) {
  await apiClient.delete(`/api/empleados/${empleadoId}/foto`);
}

export async function fetchEmpleadoFotoBlob(
  empleadoId: number
): Promise<Blob | null> {
  try {
    const response = await apiClient.get(`/api/empleados/${empleadoId}/foto`, {
      responseType: 'blob',
    });
    if (response.status === 204) return null;
    return response.data as Blob;
  } catch (err: any) {
    if (err?.response?.status === 204 || err?.response?.status === 404)
      return null;
    throw err;
  }
}
