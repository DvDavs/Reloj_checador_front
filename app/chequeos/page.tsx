'use client';

import React, { useState } from 'react';
import { Search, Edit, Plus } from 'lucide-react';
import { BreadcrumbNav } from '@/app/components/shared/breadcrumb-nav';
import { CorreccionRegistrosForm } from '@/components/admin/CorreccionRegistrosForm';
import { RegistroManualForm } from '@/components/admin/RegistroManualForm';

// Componentes mejorados
import { EnhancedCard } from '@/app/components/shared/enhanced-card';

export default function ChequeosPage() {
  const [activeView, setActiveView] = useState<'gestion' | 'manual'>('gestion');

  return (
    <div className='min-h-screen bg-background'>
      <div className='p-6 md:p-8'>
        <div className='max-w-7xl mx-auto space-y-6'>
          {/* Header mejorado */}
          <EnhancedCard variant='elevated' padding='lg'>
            <div className='space-y-1'>
              <h1 className='text-2xl md:text-3xl font-bold text-foreground tracking-tight'>
                Gestión de Chequeos
              </h1>
              <div className='h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full'></div>
            </div>
          </EnhancedCard>

          {/* Información de funcionalidades (actúa como botones) */}
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
                    Gestión de Chequeos
                  </h3>
                  <p className='text-sm text-muted-foreground'>
                    Filtre, revise y corrija registros existentes
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
              onClick={() => setActiveView('manual')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveView('manual');
                }
              }}
              className={`cursor-pointer ${activeView === 'manual' ? 'ring-2 ring-primary/60 border-primary/60 bg-primary/5' : ''}`}
            >
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-green-100 rounded-lg dark:bg-green-900/30'>
                  <Plus className='h-5 w-5 text-green-600 dark:text-green-400' />
                </div>
                <div>
                  <h3 className='font-semibold text-foreground'>
                    Registro Manual
                  </h3>
                  <p className='text-sm text-muted-foreground'>
                    Agregue entradas o salidas manualmente
                  </p>
                </div>
              </div>
            </EnhancedCard>
          </div>

          {/* Contenido principal según selección */}
          <EnhancedCard variant='default' padding='md'>
            {activeView === 'gestion' ? (
              <div className='mt-6'>
                <div className='space-y-4'>
                  <div className='flex items-center gap-2 mb-4'>
                    <Edit className='h-5 w-5 text-primary' />
                    <h2 className='text-lg font-semibold text-foreground'>
                      Gestión de Chequeos
                    </h2>
                  </div>
                  <p className='text-muted-foreground text-sm mb-6'>
                    Utilice los filtros para encontrar y corregir registros de
                    entrada y salida.
                  </p>
                  <CorreccionRegistrosForm />
                </div>
              </div>
            ) : (
              <div className='mt-6'>
                <div className='space-y-4'>
                  <div className='flex items-center gap-2 mb-4'>
                    <Plus className='h-5 w-5 text-primary' />
                    <h2 className='text-lg font-semibold text-foreground'>
                      Nuevo Registro Manual
                    </h2>
                  </div>
                  <p className='text-muted-foreground text-sm mb-6'>
                    Agregue una entrada o salida cuando haya omisiones o
                    correcciones necesarias.
                  </p>
                  <RegistroManualForm />
                </div>
              </div>
            )}
          </EnhancedCard>
        </div>
      </div>
    </div>
  );
}
