import Image from 'next/image';
import Link from 'next/link';
import {
  Clock,
  Users,
  Fingerprint,
  ChevronRight,
  Calendar,
  ClipboardList,
  BarChart3,
  Settings,
} from 'lucide-react';

const quickLinks = [
  {
    href: '/admin',
    icon: Clock,
    label: 'Reloj Checador',
    description:
      'Gestione la asistencia del personal con el sistema biométrico.',
    color: 'primary',
  },
  {
    href: '/empleados',
    icon: Users,
    label: 'Empleados',
    description: 'Administre la información del personal y sus registros.',
    color: 'primary',
  },
  {
    href: '/empleados/asignar-huella',
    icon: Fingerprint,
    label: 'Huellas Digitales',
    description: 'Registre y gestione las huellas digitales del personal.',
    color: 'accent',
  },
  {
    href: '/horarios/asignados',
    icon: Calendar,
    label: 'Horarios',
    description: 'Asigne y administre los horarios del personal.',
    color: 'primary',
  },
  {
    href: '/asistencias',
    icon: ClipboardList,
    label: 'Asistencias',
    description: 'Consulte el control consolidado de asistencia.',
    color: 'primary',
  },
  {
    href: '/reportes',
    icon: BarChart3,
    label: 'Reportes',
    description: 'Genere reportes y exportaciones del sistema.',
    color: 'accent',
  },
];

export default function Home() {
  return (
    <div className='min-h-screen bg-background text-foreground'>
      {/* Hero */}
      <div className='relative overflow-hidden border-b border-border bg-gradient-to-br from-card via-card to-muted/30'>
        <div className='absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none' />
        <div className='max-w-6xl mx-auto px-6 md:px-10 py-12 md:py-16'>
          <div className='flex flex-col sm:flex-row items-center gap-8'>
            {/* Logo */}
            <div className='relative shrink-0'>
              <div className='absolute inset-0 bg-gradient-to-br from-primary/25 to-accent/20 rounded-2xl blur-xl scale-110' />
              <div className='relative w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 border-border shadow-xl bg-card flex items-center justify-center'>
                <Image
                  src='/Logo-Kronet.png'
                  alt='Logo KRONET'
                  width={112}
                  height={112}
                  className='object-contain p-2'
                  priority
                />
              </div>
            </div>

            {/* Texto */}
            <div className='text-center sm:text-left'>
              <p className='text-sm font-semibold text-primary uppercase tracking-widest mb-1'>
                Bienvenido al sistema
              </p>
              <h1 className='text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight'>
                KRONET
              </h1>
              <div className='h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full mt-2 mb-3 mx-auto sm:mx-0' />
              <p className='text-muted-foreground text-base md:text-lg max-w-md'>
                Sistema de control de asistencia con verificación biométrica.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick access grid */}
      <div className='max-w-6xl mx-auto px-6 md:px-10 py-10'>
        <div className='mb-6'>
          <h2 className='text-lg font-semibold text-foreground'>
            Acceso rápido
          </h2>
          <p className='text-sm text-muted-foreground mt-0.5'>
            Seleccione una sección para comenzar
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {quickLinks.map(({ href, icon: Icon, label, description, color }) => (
            <Link key={href} href={href} className='block group'>
              <div className='h-full bg-card border border-border rounded-xl p-5 flex items-start gap-4 hover:border-primary/50 hover:shadow-md transition-all duration-200 group-hover:bg-muted/20'>
                {/* Icon badge */}
                <div
                  className={`shrink-0 w-11 h-11 rounded-lg flex items-center justify-center transition-colors duration-200
                    ${
                      color === 'accent'
                        ? 'bg-accent/10 group-hover:bg-accent/20'
                        : 'bg-primary/10 group-hover:bg-primary/20'
                    }`}
                >
                  <Icon
                    className={`h-5 w-5 ${color === 'accent' ? 'text-accent' : 'text-primary'}`}
                  />
                </div>

                {/* Text */}
                <div className='flex-1 min-w-0'>
                  <h3 className='font-semibold text-card-foreground text-sm leading-tight'>
                    {label}
                  </h3>
                  <p className='text-xs text-muted-foreground mt-1 leading-snug'>
                    {description}
                  </p>
                </div>

                {/* Arrow */}
                <ChevronRight className='shrink-0 h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 mt-0.5' />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className='max-w-6xl mx-auto px-6 md:px-10 pb-10'>
        <div className='border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground'>
          <span>© 2026 KRONET — SISTEMA DE CONTROL DE ASISTENCIAS</span>
          <Link
            href='/configuracion'
            className='flex items-center gap-1.5 hover:text-foreground transition-colors'
          >
            <Settings className='h-3.5 w-3.5' />
            Configuración
          </Link>
        </div>
      </div>
    </div>
  );
}
