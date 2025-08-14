'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BreadcrumbNav } from '@/app/components/shared/breadcrumb-nav';
import {
  FileText,
  Clock,
  Edit3,
  Settings,
  ClipboardList,
  DatabaseZap,
} from 'lucide-react';
import { Suspense } from 'react'; // Suspense debe importarse desde React
import { Loader2, AlertCircle } from 'lucide-react'; // Mover íconos a su propia importación
import { Alert, AlertDescription } from '@/components/ui/alert';

// Importar todos los formularios de herramientas
import { JustificacionForm } from '@/components/admin/JustificacionForm';
import { RegistroManualForm } from '@/components/admin/RegistroManualForm';
import { CorreccionEstatusForm } from '@/components/admin/CorreccionEstatusForm';
import { CorreccionRegistrosForm } from '@/components/admin/CorreccionRegistrosForm';
import { ConsolidacionManualForm } from '@/components/admin/ConsolidacionManualForm';

// Componente de carga (sin cambios)
const LoadingComponent = ({ title }: { title: string }) => (
  <div className='flex items-center justify-center py-12'>
    <div className='text-center space-y-4'>
      <Loader2 className='h-8 w-8 animate-spin mx-auto text-primary' />
      <div className='text-sm text-muted-foreground'>Cargando {title}...</div>
    </div>
  </div>
);

export default function HerramientasAdminPage() {
  return (
    <div className='p-8'>
      <div className='max-w-7xl mx-auto'>
        {/* Header (sin cambios) */}
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
                Gestión de justificaciones, registros, asistencias y procesos
                del sistema.
              </p>
            </div>
          </div>
        </header>

        {/* Contenedor de Pestañas Reestructurado */}
        <Tabs defaultValue='justificaciones' className='w-full'>
          {/* AHORA SOLO 3 PESTAÑAS PRINCIPALES */}
          <TabsList className='grid w-full grid-cols-3 mb-8'>
            <TabsTrigger
              value='justificaciones'
              className='flex items-center gap-2'
            >
              <FileText className='h-4 w-4' />
              Justificaciones
            </TabsTrigger>
            <TabsTrigger
              value='registros-checadas'
              className='flex items-center gap-2'
            >
              <Clock className='h-4 w-4' />
              Registros y Checadas
            </TabsTrigger>
            <TabsTrigger
              value='asistencias-procesos'
              className='flex items-center gap-2'
            >
              <DatabaseZap className='h-4 w-4' />
              Asistencias y Procesos
            </TabsTrigger>
          </TabsList>

          {/* Pestaña 1: Justificaciones (sin cambios internos) */}
          <TabsContent value='justificaciones'>
            <div className='bg-card border rounded-lg p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <FileText className='h-6 w-6 text-primary' />
                <div>
                  <h2 className='text-xl font-semibold'>
                    Herramienta de Justificaciones
                  </h2>
                  <p className='text-muted-foreground'>
                    Justificar faltas para prevenir la generación automática de
                    incidencias.
                  </p>
                </div>
              </div>
              <Suspense fallback={<LoadingComponent title='Justificaciones' />}>
                <JustificacionForm />
              </Suspense>
            </div>
          </TabsContent>

          {/* Pestaña 2: Herramientas Agrupadas para Registros y Checadas */}
          <TabsContent value='registros-checadas'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Herramienta de Registro Manual */}
              <div
                id='registro-manual'
                className='bg-card border rounded-lg p-6 flex flex-col'
              >
                <div className='flex items-center gap-3 mb-4'>
                  <Clock className='h-6 w-6 text-primary' />
                  <div>
                    <h2 className='text-xl font-semibold'>
                      Registro Manual de Checadas
                    </h2>
                    <p className='text-muted-foreground'>
                      Crear registros retroactivos para corregir omisiones.
                    </p>
                  </div>
                </div>
                <div className='flex-grow'>
                  <Suspense
                    fallback={<LoadingComponent title='Registro Manual' />}
                  >
                    <RegistroManualForm />
                  </Suspense>
                </div>
              </div>

              {/* Herramienta de Corrección de Registros (Detalle) */}
              <div className='bg-card border rounded-lg p-6 flex flex-col'>
                <div className='flex items-center gap-3 mb-4'>
                  <ClipboardList className='h-6 w-6 text-primary' />
                  <div>
                    <h2 className='text-xl font-semibold'>
                      Auditoría de Registros de Checada
                    </h2>
                    <p className='text-muted-foreground'>
                      Vista cruda de checadas con filtros avanzados y edición
                      puntual.
                    </p>
                  </div>
                </div>
                <div className='flex-grow'>
                  <Suspense
                    fallback={
                      <LoadingComponent title='Corrección de Registros' />
                    }
                  >
                    <CorreccionRegistrosForm />
                  </Suspense>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Pestaña 3: Herramientas Agrupadas para Asistencias y Procesos */}
          <TabsContent value='asistencias-procesos'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Herramienta de Corrección de Asistencia (Consolidado) */}
              <div className='bg-card border rounded-lg p-6 flex flex-col'>
                <div className='flex items-center gap-3 mb-4'>
                  <Edit3 className='h-6 w-6 text-primary' />
                  <div>
                    <h2 className='text-xl font-semibold'>
                      Corrección de Asistencia Diaria
                    </h2>
                    <p className='text-muted-foreground'>
                      Corregir el resultado consolidado de un día.
                    </p>
                  </div>
                </div>
                <div className='flex-grow'>
                  <Suspense
                    fallback={
                      <LoadingComponent title='Corrección de Asistencia' />
                    }
                  >
                    <CorreccionEstatusForm />
                  </Suspense>
                </div>
              </div>

              {/* Herramienta de Consolidación Manual */}
              <div className='bg-card border rounded-lg p-6 flex flex-col'>
                <div className='flex items-center gap-3 mb-4'>
                  <DatabaseZap className='h-6 w-6 text-primary' />
                  <div>
                    <h2 className='text-xl font-semibold'>
                      Proceso de Consolidación
                    </h2>
                    <p className='text-muted-foreground'>
                      Ejecutar manualmente el cálculo de asistencias diarias.
                    </p>
                  </div>
                </div>
                <div className='flex-grow'>
                  <Suspense
                    fallback={<LoadingComponent title='Consolidación Manual' />}
                  >
                    <ConsolidacionManualForm />
                  </Suspense>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
