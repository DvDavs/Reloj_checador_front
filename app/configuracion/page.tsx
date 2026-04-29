'use client';

import Link from 'next/link';
import { Megaphone, Users, Shield, Key } from 'lucide-react';
import PublicidadManager from '@/components/configuracion/PublicidadManager';
import { EnhancedCard } from '@/app/components/shared/enhanced-card';
import { Can } from '@/app/components/auth/can';
import { useState } from 'react';

type ConfigSection = 'publicidad' | 'usuarios';

const adminCards = [
  {
    href: '/configuracion/usuarios',
    permission: 'usuario:read' as const,
    icon: Users,
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
    title: 'Usuarios',
    description: 'Crear, editar y asignar roles a usuarios del sistema',
  },
  {
    href: '/configuracion/roles',
    permission: 'rol:read' as const,
    icon: Shield,
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    title: 'Roles',
    description: 'Crear y configurar roles con permisos granulares',
  },
  {
    href: '/configuracion/permisos',
    permission: 'rol:read' as const,
    icon: Key,
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
    title: 'Permisos',
    description: 'Ver el catálogo completo de permisos del sistema',
  },
];

export default function ConfiguracionPage() {
  const [activeSection, setActiveSection] =
    useState<ConfigSection>('publicidad');

  return (
    <div className='min-h-screen bg-background'>
      <div className='p-6 md:p-8'>
        <div className='max-w-7xl mx-auto space-y-6'>
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

          {/* Tarjeta de publicidad (inline, sección existente) */}
          <EnhancedCard
            variant='bordered'
            padding='md'
            hover
            role='button'
            tabIndex={0}
            onClick={() => setActiveSection('publicidad')}
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

          {activeSection === 'publicidad' && (
            <div className='animate-in fade-in slide-in-from-bottom-4 duration-500'>
              <EnhancedCard variant='default' padding='md'>
                <div className='flex items-center gap-2 mb-8 border-b pb-4'>
                  <Megaphone className='h-6 w-6 text-primary' />
                  <h2 className='text-xl font-bold text-foreground'>
                    Gestión de Publicidad
                  </h2>
                </div>
                <PublicidadManager />
              </EnhancedCard>
            </div>
          )}

          {/* Sección de administración del sistema (links a subpáginas) */}
          <div>
            <h2 className='text-lg font-semibold text-foreground mb-3'>
              Administración del sistema
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {adminCards.map((card) => (
                <Can
                  key={card.href}
                  permission={card.permission}
                  fallback={null}
                >
                  <Link href={card.href}>
                    <EnhancedCard
                      variant='bordered'
                      padding='md'
                      hover
                      className='cursor-pointer h-full'
                    >
                      <div className='flex items-center space-x-3'>
                        <div className={`p-2 rounded-lg ${card.iconBg}`}>
                          <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                        </div>
                        <div>
                          <h3 className='font-semibold text-foreground'>
                            {card.title}
                          </h3>
                          <p className='text-sm text-muted-foreground'>
                            {card.description}
                          </p>
                        </div>
                      </div>
                    </EnhancedCard>
                  </Link>
                </Can>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
