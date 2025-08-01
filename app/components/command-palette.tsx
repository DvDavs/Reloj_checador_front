// app/components/command-palette.tsx
'use client';

import { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Home,
  Clock,
  Users,
  ClipboardList,
  UserPlus,
  Fingerprint,
  Monitor,
  BarChart2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ... (las interfaces y los datos de commandItems no cambian) ...
interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  href: string;
  keywords: string[];
}

const commandItems: CommandItem[] = [
  {
    id: 'home',
    title: 'Inicio',
    subtitle: 'Página principal',
    icon: <Home size={16} />,
    href: '/',
    keywords: ['inicio', 'home', 'principal', 'dashboard'],
  },
  {
    id: 'lanzar-sesion',
    title: 'Lanzar Sesión de Reloj',
    subtitle: 'Reloj Checador',
    icon: <Clock size={16} />,
    href: '/admin',
    keywords: ['reloj', 'checador', 'lanzar', 'iniciar', 'sesion', 'lector'],
  },
  {
    id: 'monitoreo-sesiones',
    title: 'Monitorear Sesiones',
    subtitle: 'Reloj Checador',
    icon: <Monitor size={16} />,
    href: '/admin/monitoreo',
    keywords: ['monitorear', 'sesiones', 'activas', 'lectores'],
  },
  {
    id: 'empleados',
    title: 'Lista de Empleados',
    subtitle: 'Ver todos los empleados',
    icon: <ClipboardList size={16} />,
    href: '/empleados',
    keywords: ['empleados', 'lista', 'trabajadores', 'personal'],
  },
  {
    id: 'registrar',
    title: 'Registrar Empleado',
    subtitle: 'Agregar nuevo empleado',
    icon: <UserPlus size={16} />,
    href: '/empleados/registrar',
    keywords: ['registrar', 'nuevo', 'empleado', 'agregar'],
  },
  {
    id: 'huella',
    title: 'Asignar Huella',
    subtitle: 'Configurar huella dactilar',
    icon: <Fingerprint size={16} />,
    href: '/empleados/asignar-huella',
    keywords: ['huella', 'dactilar', 'biometrico', 'asignar'],
  },
  {
    id: 'horarios-plantillas',
    title: 'Plantillas de Horarios',
    subtitle: 'Gestionar plantillas',
    icon: <ClipboardList size={16} />,
    href: '/horarios/plantillas',
    keywords: ['horarios', 'plantillas', 'templates', 'turnos'],
  },
  {
    id: 'horarios-asignados',
    title: 'Horarios Asignados',
    subtitle: 'Ver horarios del personal',
    icon: <ClipboardList size={16} />,
    href: '/horarios/asignados',
    keywords: ['horarios', 'asignados', 'calendario', 'personal'],
  },
  {
    id: 'reportes',
    title: 'Reportes de Asistencia',
    subtitle: 'Ver informes de asistencia',
    icon: <BarChart2 size={16} />,
    href: '/reportes',
    keywords: ['reportes', 'asistencia', 'informes', 'estadisticas'],
  },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
    setSearch('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/50 z-[9998]' // Un z-index ligeramente menor para el fondo
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className='fixed top-1/4 left-1/2 transform -translate-x-1/2 w-full max-w-lg z-[9999]'
          >
            <Command className='bg-white dark:bg-zinc-900 rounded-lg shadow-2xl border border-zinc-200 dark:border-zinc-800'>
              <div className='flex items-center border-b border-zinc-200 dark:border-zinc-800 px-3'>
                <Search className='mr-2 h-4 w-4 shrink-0 text-zinc-500' />
                <Command.Input
                  placeholder='Buscar páginas y comandos...'
                  value={search}
                  onValueChange={setSearch}
                  className='flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500'
                />
              </div>
              <Command.List className='max-h-[300px] overflow-y-auto p-1'>
                <Command.Empty className='py-6 text-center text-sm text-zinc-500'>
                  No se encontraron resultados.
                </Command.Empty>
                <Command.Group heading='Navegación'>
                  {commandItems.map((item) => (
                    <Command.Item
                      key={item.id}
                      value={`${item.title} ${item.subtitle} ${item.keywords.join(' ')}`}
                      // La prop onSelect sigue siendo buena para la accesibilidad por teclado (Enter)
                      onSelect={() => handleSelect(item.href)}
                      // *** LA SOLUCIÓN ***: Usar onPointerDown para el clic del ratón
                      onPointerDown={(e) => {
                        e.preventDefault(); // Previene efectos secundarios no deseados
                        handleSelect(item.href);
                      }}
                      className='relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 aria-selected:bg-zinc-100 aria-selected:text-zinc-900 dark:aria-selected:bg-zinc-800 dark:aria-selected:text-zinc-50 transition-colors'
                    >
                      <div className='mr-2 flex h-4 w-4 items-center justify-center'>
                        {item.icon}
                      </div>
                      <div className='flex flex-col'>
                        <span>{item.title}</span>
                        {item.subtitle && (
                          <span className='text-xs text-zinc-500 dark:text-zinc-400'>
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
