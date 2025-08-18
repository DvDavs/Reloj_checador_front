'use client';

import type React from 'react';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  Clock,
  Users,
  ClipboardList,
  UserPlus,
  Fingerprint,
  ChevronRight,
  ChevronLeft,
  Search,
  Calendar,
  LogOut,
} from 'lucide-react';
import { useSidebar } from '../../hooks/use-sidebar';
import { useAuth } from '../context/AuthContext';
import { Tooltip, TooltipProvider } from './tooltip';
import { CommandPalette } from './command-palette';
import { Button } from '../../components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';

// Estructura de datos dinámica para los elementos de navegación
interface NavItemData {
  id: string;
  href: string;
  icon: React.ReactNode;
  text: string;
  keywords: string[];
  submenu?: NavItemData[];
  disabled?: boolean;
}
const navItems: NavItemData[] = [
  // 1. Dashboard Principal
  {
    id: 'home',
    href: '/',
    icon: <Home size={20} />,
    text: 'Inicio',
    keywords: ['inicio', 'home', 'dashboard', 'principal'],
  },

  // 2. Gestión de Reloj Checador (Acciones Clave)
  {
    id: 'reloj',
    href: '/admin',
    icon: <Clock size={20} />,
    text: 'Reloj Checador',
    keywords: ['reloj', 'checador', 'lanzar', 'sesion'],
  },

  // 3. Gestión de Personal
  {
    id: 'empleados',
    href: '/empleados',
    icon: <Users size={20} />,
    text: 'Empleados',
    keywords: ['empleados', 'personal', 'trabajadores'],
    submenu: [
      {
        id: 'empleados-lista',
        href: '/empleados',
        icon: <ClipboardList size={18} />,
        text: 'Lista de Empleados',
        keywords: ['lista', 'ver', 'todos'],
      },
      {
        id: 'empleados-registrar',
        href: '/empleados/registrar',
        icon: <UserPlus size={18} />,
        text: 'Registrar Empleado',
        keywords: ['registrar', 'nuevo', 'agregar'],
      },
      {
        id: 'empleados-huella',
        href: '/empleados/asignar-huella',
        icon: <Fingerprint size={18} />,
        text: 'Asignar Huella',
        keywords: ['huella', 'biometrico', 'dactilar'],
      },
    ],
  },

  // 4. Gestión de Horarios
  {
    id: 'horarios',
    href: '/horarios/asignados',
    icon: <Calendar size={20} />,
    text: 'Horarios',
    keywords: ['horarios', 'turnos', 'jornadas', 'calendario'],
  },

  // 7. Control de Asistencia (Nueva vista principal)
  {
    id: 'control-asistencia',
    href: '/asistencias',
    icon: <ClipboardList size={20} />,
    text: 'Control de Asistencia',
    keywords: ['control', 'asistencia', 'consolidacion', 'filtros', 'tabla'],
  },

  // 8. Justificaciones (Nueva vista)
  {
    id: 'justificaciones',
    href: '/justificaciones',
    icon: <ClipboardList size={20} />,
    text: 'Justificaciones',
    keywords: [
      'justificaciones',
      'falta',
      'permiso',
      'departamental',
      'masiva',
    ],
  },

  // 9. Chequeos (Estatus de registros)
  {
    id: 'chequeos',
    href: '/chequeos',
    icon: <Clock size={20} />,
    text: 'Chequeos',
    keywords: ['chequeos', 'registros', 'entradas', 'salidas', 'correccion'],
  },
];

// Navegación mínima para el lanzador
const launcherNavItems: NavItemData[] = [
  {
    id: 'login',
    href: '/login',
    icon: <Fingerprint size={20} />,
    text: 'Iniciar sesión',
    keywords: ['login', 'ingresar', 'acceder'],
  },
];

interface NavItemProps {
  item: NavItemData;
  isActive: boolean;
  isCollapsed: boolean;
  level?: number;
  onSubmenuToggle?: () => void;
  isSubmenuOpen?: boolean;
}

// --- COMPONENTE NavItem LIMPIO Y CON LÓGICA CORREGIDA ---
const NavItem = ({
  item,
  isActive,
  isCollapsed,
  level = 0,
  onSubmenuToggle,
  isSubmenuOpen,
}: NavItemProps) => {
  const pathname = usePathname();
  const hasSubmenu = !!item.submenu;

  // --- LÓGICA DE ACTIVIDAD PRECISA Y CORREGIDA ---
  // Un item padre está activo si la ruta COMIENZA con su href.
  // Un sub-item solo está activo si la ruta es EXACTAMENTE igual.
  const isActiveFixed =
    level > 0
      ? pathname === item.href
      : item.href === '/'
        ? pathname === '/'
        : pathname.startsWith(item.href);

  // Verificar si este item padre tiene un subitem activo
  const hasActiveChild =
    hasSubmenu &&
    item.submenu?.some(
      (subItem) =>
        pathname === subItem.href ||
        (subItem.href !== '/' && pathname.startsWith(subItem.href + '/'))
    );

  const baseClasses = `
        w-full group relative flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200 
        focus:outline-none focus:ring-2 focus:ring-[hsl(var(--sidebar-accent))]/20
        ${level > 0 ? 'pl-10 pr-4' : 'px-4'}
        ${
          item.disabled
            ? 'opacity-50 cursor-not-allowed'
            : isActiveFixed
              ? level > 0
                ? 'bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-active-foreground))] shadow-md border border-[hsl(var(--sidebar-active))]/20'
                : 'bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-active-foreground))] shadow-md border-l-4 border-[hsl(var(--sidebar-accent))] border border-[hsl(var(--sidebar-active))]/20'
              : hasActiveChild && level === 0
                ? 'text-[hsl(var(--sidebar-foreground))] border-b-2 border-[hsl(var(--sidebar-accent))] bg-[hsl(var(--sidebar-hover))]'
                : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-foreground))] hover:shadow-sm hover:border hover:border-[hsl(var(--border))]'
        }
        ${isCollapsed ? 'justify-center' : ''}
    `;

  const content = (
    <>
      <div
        className={`flex-shrink-0 transition-transform duration-200 ${item.disabled ? '' : 'group-hover:scale-110'}`}
      >
        {item.icon}
      </div>
      {!isCollapsed && (
        <>
          <span className='flex-grow font-medium text-sm text-left whitespace-nowrap'>
            {item.text}
          </span>
          {hasSubmenu && (
            <div
              className={`transition-transform duration-150 ease-out ${
                isSubmenuOpen ? 'rotate-90' : 'rotate-0'
              }`}
            >
              <ChevronRight size={16} />
            </div>
          )}
        </>
      )}
    </>
  );

  const tooltipContent = item.disabled ? 'Próximamente' : item.text;

  // Si está deshabilitado
  if (item.disabled) {
    return (
      <Tooltip
        content={tooltipContent}
        disabled={!isCollapsed && !item.disabled}
      >
        <div className={baseClasses}>{content}</div>
      </Tooltip>
    );
  }

  // Si tiene submenú y no está colapsado, renderizar como botón
  if (hasSubmenu && !isCollapsed) {
    return (
      <Tooltip content={tooltipContent} disabled={!isCollapsed || level > 0}>
        <button
          type='button'
          onClick={onSubmenuToggle}
          className={baseClasses}
          disabled={item.disabled}
        >
          {content}
        </button>
      </Tooltip>
    );
  }

  // En todos los demás casos, renderizar como Link
  return (
    <Tooltip content={tooltipContent} disabled={!isCollapsed || level > 0}>
      <Link href={item.href} className={baseClasses}>
        {content}
      </Link>
    </Tooltip>
  );
};

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const isLauncherRoute = pathname.startsWith('/lanzador');

  const effectiveNavItems: NavItemData[] = useMemo(
    () => (isLauncherRoute ? launcherNavItems : navItems),
    [isLauncherRoute]
  );

  // Actualizar submenús abiertos basado en la ruta actual
  useEffect(() => {
    const newOpenSubmenus: Record<string, boolean> = {};

    effectiveNavItems.forEach((item) => {
      if (item.submenu) {
        const isSubmenuActive = item.submenu.some((subItem) => {
          return (
            pathname === subItem.href ||
            (subItem.href !== '/' && pathname.startsWith(subItem.href + '/'))
          );
        });
        // Solo abrir automáticamente si está activo, mantener estado manual si no
        newOpenSubmenus[item.id] = isSubmenuActive;
      }
    });

    setOpenSubmenus((prev) => {
      const prevKeys = Object.keys(prev);
      const newKeys = Object.keys(newOpenSubmenus);
      if (prevKeys.length !== newKeys.length) return newOpenSubmenus;
      for (const key of newKeys) {
        if (prev[key] !== newOpenSubmenus[key]) return newOpenSubmenus;
      }
      return prev;
    });
  }, [pathname, effectiveNavItems]);

  // Manejar atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleCollapsed();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapsed]);

  const toggleSubmenu = (itemId: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Lógica de isActive simplificada y robusta
  const isItemActive = (item: NavItemData): boolean => {
    // Coincidencia exacta
    if (pathname === item.href) return true;

    // Si es una ruta padre (no raíz), verificar si la ruta actual es descendiente
    if (item.href !== '/' && pathname.startsWith(item.href + '/')) return true;

    return false;
  };

  // Verificar si un item padre tiene un subitem activo (para mostrar solo borde inferior)
  const hasActiveSubmenu = (item: NavItemData): boolean => {
    if (!item.submenu) return false;
    return item.submenu.some(
      (subItem) =>
        pathname === subItem.href ||
        (subItem.href !== '/' && pathname.startsWith(subItem.href + '/'))
    );
  };

  const isSubItemActive = (subItem: NavItemData): boolean => {
    return (
      pathname === subItem.href ||
      (subItem.href !== '/' && pathname.startsWith(subItem.href + '/'))
    );
  };

  return (
    <TooltipProvider>
      <div className='relative flex'>
        <motion.div
          animate={{ width: isCollapsed ? 80 : 256 }}
          transition={{
            duration: 0.15,
            ease: 'easeInOut',
          }}
          className='h-screen bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))] flex flex-col shadow-lg'
        >
          {/* Header con logo institucional */}
          <div className='p-4 border-b border-[hsl(var(--sidebar-border))] bg-gradient-to-br from-[hsl(var(--sidebar-background))] to-[hsl(var(--muted))/30]'>
            {!isCollapsed ? (
              <Link
                href='/'
                className='flex items-center gap-3 opacity-100 duration-200 hover:opacity-90 transition-all p-2 rounded-lg hover:bg-[hsl(var(--sidebar-hover))]'
              >
                <div className='flex-shrink-0'>
                  <img
                    src='/Logo_ITO.png'
                    alt='Logo ITO'
                    className='w-10 h-10 object-contain rounded-lg shadow-md border border-[hsl(var(--border))]'
                  />
                </div>
                <div className='flex-1 min-w-0'>
                  <h1 className='text-lg font-bold text-[hsl(var(--sidebar-foreground))] leading-tight'>
                    Sistema de Control
                  </h1>
                  <p className='text-xs text-[hsl(var(--muted-foreground))] leading-tight mt-0.5'>
                    TecNM Campus Oaxaca
                  </p>
                </div>
                <div className='ml-auto'>
                  <ThemeToggle />
                </div>
              </Link>
            ) : (
              <div className='flex justify-center opacity-100 duration-200'>
                <Tooltip content='TecNM Campus Oaxaca - Sistema de Asistencias'>
                  <Link
                    href='/'
                    className='group cursor-pointer p-2 rounded-lg hover:bg-[hsl(var(--sidebar-hover))] transition-colors'
                  >
                    <img
                      src='/Logo_ITO.png'
                      alt='Logo ITO'
                      className='w-8 h-8 object-contain rounded-lg shadow-md border border-[hsl(var(--border))] group-hover:scale-105 transition-transform duration-200'
                    />
                  </Link>
                </Tooltip>
              </div>
            )}
          </div>

          {/* Command Palette Trigger */}
          {!isCollapsed && !isLauncherRoute && (
            <div className='p-4'>
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className='w-full flex items-center gap-3 px-3 py-2 text-sm text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--sidebar-hover))] hover:border-[hsl(var(--sidebar-accent))]/30 hover:shadow-sm transition-all duration-200'
              >
                <Search size={16} />
                <span>Buscar...</span>
                <div className='ml-auto flex gap-1'>
                  <kbd className='px-1.5 py-0.5 text-xs bg-[hsl(var(--muted))] rounded'>
                    Ctrl
                  </kbd>
                  <kbd className='px-1.5 py-0.5 text-xs bg-[hsl(var(--muted))] rounded'>
                    K
                  </kbd>
                </div>
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className='flex-1 p-4 space-y-1 overflow-y-auto'>
            {effectiveNavItems.map((item) => (
              <div key={item.id}>
                <NavItem
                  item={item}
                  isActive={isItemActive(item)}
                  isCollapsed={isCollapsed}
                  onSubmenuToggle={() => toggleSubmenu(item.id)}
                  isSubmenuOpen={openSubmenus[item.id]}
                />

                {/* Submenu */}
                {item.submenu && !isCollapsed && (
                  <div
                    className={`mt-1 space-y-1 overflow-hidden transition-all duration-200 ease-out ${
                      openSubmenus[item.id]
                        ? 'max-h-96 opacity-100'
                        : 'max-h-0 opacity-0'
                    }`}
                  >
                    {item.submenu.map((subItem) => (
                      <NavItem
                        key={subItem.id}
                        item={subItem}
                        isActive={isSubItemActive(subItem)}
                        isCollapsed={false}
                        level={1}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* User Info & Logout Button */}
          {!isLauncherRoute && (
            <div className='p-4 border-t border-[hsl(var(--sidebar-border))] bg-gradient-to-br from-[hsl(var(--sidebar-background))] to-[hsl(var(--muted))/20]'>
              {isAuthenticated && !isCollapsed ? (
                <div className='flex items-center gap-3 transition-all duration-150 p-2 rounded-lg hover:bg-[hsl(var(--sidebar-hover))] border border-transparent hover:border-[hsl(var(--border))]'>
                  <div className='w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--sidebar-accent))] to-[hsl(var(--accent))] flex items-center justify-center shadow-sm'>
                    <Users
                      size={16}
                      className='text-[hsl(var(--sidebar-accent-foreground))]'
                    />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-[hsl(var(--sidebar-foreground))] truncate'>
                      {user?.username ?? 'Usuario autenticado'}
                    </p>
                    <p className='text-xs text-[hsl(var(--muted-foreground))] truncate'>
                      {user?.roles.has('ROLE_ADMIN')
                        ? 'Rol: Administrador'
                        : user?.roles.has('ROLE_DISPOSITIVO')
                          ? 'Rol: Dispositivo'
                          : 'Sesión activa'}
                    </p>
                  </div>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={logout}
                    title='Cerrar Sesión'
                    className='text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--destructive))]/10 hover:text-[hsl(var(--destructive))] transition-colors border border-transparent hover:border-[hsl(var(--destructive))]/20'
                  >
                    <LogOut size={16} />
                  </Button>
                </div>
              ) : isAuthenticated && isCollapsed ? (
                <Tooltip content='Cerrar Sesión'>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={logout}
                    className='w-full text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--destructive))]/10 hover:text-[hsl(var(--destructive))] transition-colors border border-transparent hover:border-[hsl(var(--destructive))]/20'
                  >
                    <LogOut size={16} />
                  </Button>
                </Tooltip>
              ) : (
                <div className='flex items-center gap-3 transition-all duration-150 p-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30'>
                  <div className='w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--muted-foreground))]/20 to-[hsl(var(--muted-foreground))]/10 flex items-center justify-center'>
                    <Users
                      size={16}
                      className='text-[hsl(var(--muted-foreground))]'
                    />
                  </div>
                  {!isCollapsed && (
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-[hsl(var(--muted-foreground))] truncate'>
                        No autenticado
                      </p>
                      <p className='text-xs text-[hsl(var(--muted-foreground))]/70 truncate'>
                        Inicia sesión
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Botón de colapsar en el lateral */}
        <div className='absolute -right-3 top-1/2 transform -translate-y-1/2 z-10'>
          <Tooltip
            content={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            <button
              onClick={toggleCollapsed}
              className='w-6 h-6 bg-[hsl(var(--sidebar-background))] border border-[hsl(var(--sidebar-border))] rounded-full flex items-center justify-center text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-hover))] transition-colors shadow-md active:scale-95'
              aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight size={14} />
              ) : (
                <ChevronLeft size={14} />
              )}
            </button>
          </Tooltip>
        </div>

        {/* Command Palette */}
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
        />
      </div>
    </TooltipProvider>
  );
}
