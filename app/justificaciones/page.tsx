'use client';

import React, { useState } from 'react';
import { Search, Plus, FileText } from 'lucide-react';
import { EnhancedCard } from '@/app/components/shared/enhanced-card';
import { JustificacionForm } from '@/components/admin/JustificacionForm';
import { JustificacionManagement } from '@/components/admin/JustificacionManagement';

export default function JustificacionesPage() {
  const [activeView, setActiveView] = useState<'gestion' | 'crear'>('gestion');

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

          {/* Tabs de navegación (estilo botones) */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <EnhancedCard
              variant='bordered'
              padding='md'
              hover
              role='button'
              tabIndex={0}
              onClick={() => setActiveView('gestion')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveView('gestion');
                }
              }}
              className={`cursor-pointer ${activeView === 'gestion' ? 'ring-2 ring-primary/60 border-primary/60 bg-primary/5' : ''}`}
            >
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30'>
                  <Search className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                </div>
                <div>
                  <h3 className='font-semibold text-foreground'>
                    Gestión de Justificaciones
                  </h3>
                  <p className='text-sm text-muted-foreground'>
                    Consulte y filtre el historial de justificaciones
                    registradas
                  </p>
                </div>
              </div>
            </EnhancedCard>

            <EnhancedCard
              variant='bordered'
              padding='md'
              hover
              role='button'
              tabIndex={0}
              onClick={() => setActiveView('crear')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveView('crear');
                }
              }}
              className={`cursor-pointer ${activeView === 'crear' ? 'ring-2 ring-primary/60 border-primary/60 bg-primary/5' : ''}`}
            >
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-green-100 rounded-lg dark:bg-green-900/30'>
                  <Plus className='h-5 w-5 text-green-600 dark:text-green-400' />
                </div>
                <div>
                  <h3 className='font-semibold text-foreground'>
                    Crear Nueva Justificación
                  </h3>
                  <p className='text-sm text-muted-foreground'>
                    Registre nuevas justificaciones individuales,
                    departamentales o masivas
                  </p>
                </div>
              </div>
            </EnhancedCard>
          </div>

          {/* Contenido principal */}
          <EnhancedCard variant='default' padding='md'>
            {activeView === 'gestion' ? (
              <div className='mt-2'>
                <div className='space-y-4'>
                  <div className='flex items-center gap-2 mb-4'>
                    <FileText className='h-5 w-5 text-primary' />
                    <h2 className='text-lg font-semibold text-foreground'>
                      Historial de Justificaciones
                    </h2>
                  </div>
                  <JustificacionManagement />
                </div>
              </div>
            ) : (
              <div className='mt-2'>
                <div className='space-y-4'>
                  <div className='flex items-center gap-2 mb-4'>
                    <Plus className='h-5 w-5 text-primary' />
                    <h2 className='text-lg font-semibold text-foreground'>
                      Nueva Justificación
                    </h2>
                  </div>
                  <JustificacionForm />
                </div>
              </div>
            )}
          </EnhancedCard>
        </div>
      </div>
    </div>
  );
}
