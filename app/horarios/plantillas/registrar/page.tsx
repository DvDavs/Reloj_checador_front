// Archivo: app/horarios/plantillas/registrar/page.tsx

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import WeeklyScheduleGrid, { WeeklySchedule } from '@/app/components/shared/WeeklyScheduleGrid';
import { getApiErrorMessage } from '@/lib/api/schedule-api';
import { weeklyScheduleToDetalles } from '../types';
import { PageHeader } from '@/app/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/app/components/shared/error-state'; // <-- 1. Importa el componente de error

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const createEmptySchedule = (): WeeklySchedule => ({
  LUNES: [], MARTES: [], MIERCOLES: [], JUEVES: [], VIERNES: [], SABADO: [], DOMINGO: [],
});

export default function RegistrarPlantillaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [nombre, setNombre] = useState('');
  const [schedule, setSchedule] = useState<WeeklySchedule>(createEmptySchedule());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null); // <-- 2. Añade el estado para el error

  const handleSave = async () => {
    // Validación de nombre
    if (!nombre.trim()) {
      setError('El nombre de la plantilla es obligatorio.'); // Usa el estado de error
      return;
    }
    
    // Validación de detalles
    const detalles = weeklyScheduleToDetalles(schedule);
    if (detalles.length === 0) {
      setError('La plantilla debe tener al menos un intervalo de tiempo definido.'); // Usa el estado de error
      return;
    }

    setIsSaving(true);
    setError(null); // <-- Limpia errores anteriores al empezar a guardar

    const payload = {
      nombre,
      detalles: detalles,
    };

    try {
      await axios.post(`${API_BASE_URL}/api/horarios`, payload);
      toast({
        title: 'Éxito',
        description: 'La nueva plantilla de horario ha sido creada.',
      });
      router.push('/horarios/plantillas');
    } catch (error: any) {
      console.error("Error creating schedule template:", error);
      const errorMsg = getApiErrorMessage(error);
      setError(errorMsg); // <-- 3. Actualiza el estado con el error del backend
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        title="Crear Nueva Plantilla de Horario"
        isLoading={isSaving}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()} disabled={isSaving}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar Plantilla
            </Button>
          </div>
        }
      />

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Detalles de la Plantilla</CardTitle>
          <CardDescription>Complete los siguientes campos para crear una nueva plantilla.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 4. Muestra el componente de error si existe un mensaje */}
          {error && (
            <div className="mb-4">
              <ErrorState message={error} />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="template-name" className="block text-sm font-medium text-gray-300 mb-2">
                Nombre de la Plantilla
              </label>
              <Input
                id="template-name"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  if (error) setError(null); // Limpia el error al escribir
                }}
                placeholder="Ej: Horario de Verano, Matutino, etc."
                disabled={isSaving}
                className="max-w-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Editor de Horario Semanal</h2>
        <div className="p-0 border rounded-lg bg-background/50 md:p-4">
          <WeeklyScheduleGrid
            schedule={schedule}
            onScheduleChange={(newSchedule) => {
              setSchedule(newSchedule);
              if (error) setError(null); // Limpia el error al cambiar el horario
            }}
            editable={!isSaving}
          />
        </div>
      </div>
    </div>
  );
}