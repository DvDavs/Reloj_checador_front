import axios from 'axios';
import { EditTemplateForm } from '@/app/horarios/plantillas/components/edit-form';
import { HorarioDto } from '../../types';
import { ErrorState } from '@/app/components/shared/error-state';

type PageProps = {
  params: {
    id: string;
  };
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

async function getHorario(id: string): Promise<HorarioDto | null> {
  try {
    const response = await axios.get<HorarioDto>(
      `${API_BASE_URL}/api/horarios/${id}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching schedule template:', error);
    return null;
  }
}

export default async function EditarPlantillaPage({ params }: PageProps) {
  const initialData = await getHorario(params.id);

  if (!initialData) {
    return (
      <ErrorState message='No se pudo cargar la plantilla de horario. Verifique que la URL es correcta.' />
    );
  }

  return <EditTemplateForm initialData={initialData} templateId={params.id} />;
}
