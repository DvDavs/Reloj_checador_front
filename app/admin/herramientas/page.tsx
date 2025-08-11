'use client';

import React, { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BreadcrumbNav } from '@/app/components/shared/breadcrumb-nav';
import {
  FileText,
  Clock,
  Edit3,
  Settings,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { JustificacionForm } from '@/components/admin/JustificacionForm';
import { RegistroManualForm } from '@/components/admin/RegistroManualForm';
import { CorreccionEstatusForm } from '@/components/admin/CorreccionEstatusForm';

// Componente de carga para las herramientas
const LoadingComponent = ({ title }: { title: string }) => (
  <div className='flex items-center justify-center py-12'>
    <div className='text-center space-y-4'>
      <Loader2 className='h-8 w-8 animate-spin mx-auto text-primary' />
      <div className='text-sm text-muted-foreground'>Cargando {title}...</div>
    </div>
  </div>
);

// Componente de error para las herramientas
const ErrorComponent = ({ title, error }: { title: string; error: Error }) => (
  <Alert variant='destructive'>
    <AlertCircle className='h-4 w-4' />
    <AlertDescription>
      <div className='space-y-2'>
        <div className='font-medium'>Error al cargar {title}</div>
        <div className='text-sm'>{error.message}</div>
        <div className='text-xs text-muted-foreground'>
          Intente recargar la página. Si el problema persiste, contacte al
          administrador del sistema.
        </div>
      </div>
    </AlertDescription>
  </Alert>
);

export default function HerramientasAdminPage() {
  return (
    <div className='p-8'>
      <div className='max-w-7xl mx-auto'>
        {/* Header with breadcrumbs */}
        <header className='mb-8'>
          <BreadcrumbNav
            items={[
              { label: 'Admin', href: '/admin' },
              { label: 'Herramientas' },
            ]}
          />
          <div className='flex items-center gap-3'>
            <Settings className='h-8 w-8 text-primary' />
            <div>
              <h1 className='text-3xl font-bold text-foreground'>
                Herramientas Administrativas
              </h1>
              <p className='text-muted-foreground mt-1'>
                Gestión de justificaciones, registros manuales y corrección de
                estatus
              </p>
            </div>
          </div>
        </header>

        {/* Tabs Container */}
        <Tabs defaultValue='justificaciones' className='w-full'>
          <TabsList className='grid w-full grid-cols-3 mb-8'>
            <TabsTrigger
              value='justificaciones'
              className='flex items-center gap-2'
            >
              <FileText className='h-4 w-4' />
              Justificaciones
            </TabsTrigger>
            <TabsTrigger
              value='registro-manual'
              className='flex items-center gap-2'
            >
              <Clock className='h-4 w-4' />
              Registro Manual
            </TabsTrigger>
            <TabsTrigger
              value='correccion-estatus'
              className='flex items-center gap-2'
            >
              <Edit3 className='h-4 w-4' />
              Corrección de Estatus
            </TabsTrigger>
          </TabsList>

          {/* Justificaciones Tab */}
          <TabsContent value='justificaciones' className='space-y-6'>
            <div className='bg-card border rounded-lg p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <FileText className='h-6 w-6 text-primary' />
                <div>
                  <h2 className='text-xl font-semibold'>
                    Herramienta de Justificaciones
                  </h2>
                  <p className='text-muted-foreground'>
                    Justificar faltas de empleados de manera individual,
                    departamental o masiva para prevenir generación automática
                    de faltas
                  </p>
                </div>
              </div>

              {/* JustificacionForm Component with Error Boundary */}
              <Suspense
                fallback={
                  <LoadingComponent title='Herramienta de Justificaciones' />
                }
              >
                <JustificacionForm />
              </Suspense>
            </div>
          </TabsContent>

          {/* Registro Manual Tab */}
          <TabsContent value='registro-manual' className='space-y-6'>
            <div className='bg-card border rounded-lg p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <Clock className='h-6 w-6 text-primary' />
                <div>
                  <h2 className='text-xl font-semibold'>Registro Manual</h2>
                  <p className='text-muted-foreground'>
                    Crear registros de checada retroactivos para corregir
                    omisiones de empleados
                  </p>
                </div>
              </div>

              {/* RegistroManualForm Component with Error Boundary */}
              <Suspense fallback={<LoadingComponent title='Registro Manual' />}>
                <RegistroManualForm />
              </Suspense>
            </div>
          </TabsContent>

          {/* Corrección de Estatus Tab */}
          <TabsContent value='correccion-estatus' className='space-y-6'>
            <div className='bg-card border rounded-lg p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <Edit3 className='h-6 w-6 text-primary' />
                <div>
                  <h2 className='text-xl font-semibold'>
                    Corrección de Estatus
                  </h2>
                  <p className='text-muted-foreground'>
                    Corregir el estatus de asistencias ya generadas cuando hay
                    errores o situaciones injustas
                  </p>
                </div>
              </div>

              {/* CorreccionEstatusForm Component with Error Boundary */}
              <Suspense
                fallback={<LoadingComponent title='Corrección de Estatus' />}
              >
                <CorreccionEstatusForm />
              </Suspense>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
