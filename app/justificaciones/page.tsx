'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { BreadcrumbNav } from '@/app/components/shared/breadcrumb-nav';
import { JustificacionForm } from '@/components/admin/JustificacionForm';

export default function JustificacionesPage() {
  return (
    <div className='p-8'>
      <div className='max-w-7xl mx-auto space-y-8'>
        <header className='mb-2'>
          <BreadcrumbNav items={[{ label: 'Justificaciones' }]} />
          <h1 className='text-3xl font-bold'>Justificaciones</h1>
          <p className='text-muted-foreground'>
            Cree justificaciones individuales, departamentales o masivas.
          </p>
        </header>

        <Tabs defaultValue='crear'>
          <TabsList>
            <TabsTrigger value='crear'>Crear Justificación</TabsTrigger>
          </TabsList>

          <TabsContent value='crear'>
            <Card>
              <CardHeader>
                <CardTitle>Crear Justificación del día</CardTitle>
                <CardDescription>
                  Seleccione empleado/departamento y rango de fechas. Agregue
                  motivo y (opcional) número de oficio. Confirme antes de
                  aplicar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JustificacionForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
