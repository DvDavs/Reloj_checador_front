'use client';

import { useState } from 'react';
import { Megaphone, Users } from 'lucide-react';
import PublicidadManager from '@/components/configuracion/PublicidadManager';
import { EnhancedCard } from '@/app/components/shared/enhanced-card';

type ConfigSection = 'publicidad' | 'usuarios';

export default function ConfiguracionPage() {
  const [activeSection, setActiveSection] = useState<ConfigSection | null>(
    'publicidad'
  );

  return (
    <div className='min-h-screen bg-background'>
      <div className='p-6 md:p-8'>
        <div className='max-w-7xl mx-auto space-y-6'>
          {/* Header consistente con Chequeos */}
          <EnhancedCard variant='elevated' padding='lg'>
            <div className='space-y-1'>
              <h1 className='text-2xl md:text-3xl font-bold text-foreground tracking-tight'>
                Configuración
              </h1>
              <div className='h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full'></div>
              <p className='text-muted-foreground pt-2'>
                Administre la configuración general del sistema.
              </p>
            </div>
          </EnhancedCard>

          {/* Tarjetas de Selección */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <EnhancedCard
              variant='bordered'
              padding='md'
              hover
              role='button'
              tabIndex={0}
              onClick={() => setActiveSection('publicidad')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveSection('publicidad');
                }
              }}
              className={`cursor-pointer ${activeSection === 'publicidad' ? 'ring-2 ring-primary/60 border-primary/60 bg-primary/5' : ''}`}
            >
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30'>
                  <Megaphone className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                </div>
                <div>
                  <h3 className='font-semibold text-foreground'>Publicidad</h3>
                  <p className='text-sm text-muted-foreground'>
                    Configuración de anuncios en el carrusel
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
              onClick={() => setActiveSection('usuarios')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveSection('usuarios');
                }
              }}
              className={`cursor-pointer ${activeSection === 'usuarios' ? 'ring-2 ring-primary/60 border-primary/60 bg-primary/5' : ''}`}
            >
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-green-100 rounded-lg dark:bg-green-900/30'>
                  <Users className='h-5 w-5 text-green-600 dark:text-green-400' />
                </div>
                <div>
                  <h3 className='font-semibold text-foreground'>
                    Creación de Usuarios
                  </h3>
                  <p className='text-sm text-muted-foreground'>
                    Administración de usuarios y permisos
                  </p>
                </div>
              </div>
            </EnhancedCard>
          </div>

          {/* Contenido Principal */}
          {activeSection && (
            <div className='animate-in fade-in slide-in-from-bottom-4 duration-500'>
              <EnhancedCard variant='default' padding='md'>
                {activeSection === 'publicidad' ? (
                  <div className='mt-6'>
                    <div className='space-y-4'>
                      <div className='flex items-center gap-2 mb-4'>
                        <Megaphone className='h-5 w-5 text-primary' />
                        <h2 className='text-lg font-semibold text-foreground'>
                          Gestión de Publicidad
                        </h2>
                      </div>
                      <p className='text-muted-foreground text-sm mb-6'>
                        Administre los anuncios y el contenido que se muestra en
                        el carrusel del reloj checador.
                      </p>
                      <PublicidadManager />
                    </div>
                  </div>
                ) : (
                  <div className='mt-6'>
                    <div className='space-y-4'>
                      <div className='flex items-center gap-2 mb-4'>
                        <Users className='h-5 w-5 text-primary' />
                        <h2 className='text-lg font-semibold text-foreground'>
                          Gestión de Usuarios
                        </h2>
                      </div>
                      <p className='text-muted-foreground text-sm mb-6'>
                        Cree y administre las cuentas de acceso al sistema y sus
                        permisos correspondientes.
                      </p>
                      <div className='flex flex-col items-center justify-center py-20 text-center space-y-4'>
                        <div className='p-4 bg-muted rounded-full'>
                          <Users className='h-12 w-12 text-muted-foreground' />
                        </div>
                        <div className='space-y-2'>
                          <h3 className='text-xl font-semibold'>
                            En desarrollo
                          </h3>
                          <p className='text-muted-foreground max-w-xs'>
                            Esta sección estará disponible próximamente para la
                            administración de usuarios y permisos.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </EnhancedCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
