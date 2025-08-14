'use client';

import React from 'react';
import { BreadcrumbNav } from '@/app/components/shared/breadcrumb-nav';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { CorreccionRegistrosForm } from '@/components/admin/CorreccionRegistrosForm';
import { RegistroManualForm } from '@/components/admin/RegistroManualForm';

export default function ChequeosPage() {
  return (
    <div className='p-8'>
      <div className='max-w-7xl mx-auto space-y-8'>
        <header className='mb-2'>
          <BreadcrumbNav items={[{ label: 'Chequeos' }]} />
          <h1 className='text-3xl font-bold'>Chequeos</h1>
          <p className='text-muted-foreground'>
            Búsqueda y corrección de registros de entrada/salida.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Gestión de Chequeos</CardTitle>
            <CardDescription>
              Filtre, revise y corrija registros.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CorreccionRegistrosForm />
          </CardContent>
        </Card>

        {/* Sección de registro manual complementaria */}
        <Card id='registro-manual'>
          <CardHeader>
            <CardTitle>Nuevo Registro Manual</CardTitle>
            <CardDescription>
              Agregue una entrada o salida cuando haya omisiones o correcciones
              necesarias.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegistroManualForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
