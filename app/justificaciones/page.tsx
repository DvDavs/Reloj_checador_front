'use client';

import React from 'react';
import { FileText, Users, User, Calendar } from 'lucide-react';
import { BreadcrumbNav } from '@/app/components/shared/breadcrumb-nav';
import { JustificacionForm } from '@/components/admin/JustificacionForm';

// Componentes mejorados
import { EnhancedCard } from '@/app/components/shared/enhanced-card';

export default function JustificacionesPage() {
  return (
    <div className='min-h-screen bg-background'>
      <div className='p-6 md:p-8'>
        <div className='max-w-7xl mx-auto space-y-6'>
          {/* Header mejorado */}
          <EnhancedCard variant='elevated' padding='lg'>
            <div className='space-y-1 mb-4'>
              <BreadcrumbNav items={[{ label: 'Justificaciones' }]} />
            </div>
            <div className='space-y-1'>
              <h1 className='text-2xl md:text-3xl font-bold text-foreground tracking-tight'>
                Gestión de Justificaciones
              </h1>
              <div className='h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full'></div>
              <p className='text-muted-foreground mt-2'>
                Cree justificaciones individuales, departamentales o masivas
                para empleados.
              </p>
            </div>
          </EnhancedCard>

          {/* Información de tipos de justificación */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <EnhancedCard variant='bordered' padding='md' hover>
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30'>
                  <User className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                </div>
                <div>
                  <h3 className='font-semibold text-foreground'>Individual</h3>
                  <p className='text-sm text-muted-foreground'>
                    Por empleado específico
                  </p>
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard variant='bordered' padding='md' hover>
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-green-100 rounded-lg dark:bg-green-900/30'>
                  <Users className='h-5 w-5 text-green-600 dark:text-green-400' />
                </div>
                <div>
                  <h3 className='font-semibold text-foreground'>
                    Departamental
                  </h3>
                  <p className='text-sm text-muted-foreground'>
                    Por departamento completo
                  </p>
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard variant='bordered' padding='md' hover>
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30'>
                  <Calendar className='h-5 w-5 text-purple-600 dark:text-purple-400' />
                </div>
                <div>
                  <h3 className='font-semibold text-foreground'>Masiva</h3>
                  <p className='text-sm text-muted-foreground'>
                    Para múltiples empleados
                  </p>
                </div>
              </div>
            </EnhancedCard>
          </div>

          {/* Formulario de justificación */}
          <EnhancedCard variant='elevated' padding='lg'>
            <div className='space-y-4'>
              <div className='flex items-center gap-2 mb-4'>
                <FileText className='h-5 w-5 text-primary' />
                <h2 className='text-lg font-semibold text-foreground'>
                  Crear Nueva Justificación
                </h2>
              </div>
              <p className='text-muted-foreground text-sm mb-6'>
                Complete el formulario para crear una justificación de
                asistencia.
              </p>
              <JustificacionForm />
            </div>
          </EnhancedCard>
        </div>
      </div>
    </div>
  );
}
