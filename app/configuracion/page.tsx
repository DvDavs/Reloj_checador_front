'use client';

import Link from 'next/link';
import { Users, Shield, Key } from 'lucide-react';
import { EnhancedCard } from '@/app/components/shared/enhanced-card';
import { Can } from '@/app/components/auth/can';

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

          {/* Administración del sistema */}
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
