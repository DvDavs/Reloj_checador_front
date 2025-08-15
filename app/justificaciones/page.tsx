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
            <div className='space-y-1'>
              <h1 className='text-2xl md:text-3xl font-bold text-foreground tracking-tight'>
                Gestión de Justificaciones
              </h1>
              <div className='h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full'></div>
            </div>
          </EnhancedCard>

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
