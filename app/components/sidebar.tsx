"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { useSidebar } from "../../hooks/use-sidebar";
import { Tooltip, TooltipProvider } from "./tooltip";
import { CommandPalette } from "./command-palette";

// Estructura de datos dinámica para los elementos de navegación
interface NavItemData {
    id: string;
    href: string;
    icon: React.ReactNode;
    text: string;
    keywords: string[];
    submenu?: NavItemData[];
}

const navItems: NavItemData[] = [
    {
        id: "home",
        href: "/",
        icon: <Home size={20} />,
        text: "Inicio",
        keywords: ["inicio", "home", "principal"],
    },
    {
        id: "reloj",
        href: "/admin",
        icon: <Clock size={20} />,
        text: "Reloj Checador",
        keywords: ["reloj", "checador", "tiempo"],
        submenu: [
            {
                id: "admin",
                href: "/admin",
                icon: <ClipboardList size={18} />,
                text: "Selección de Lector",
                keywords: ["lector", "seleccion", "admin"],
            },
        ],
    },
    {
        id: "empleados",
        href: "/empleados",
        icon: <Users size={20} />,
        text: "Empleados",
        keywords: ["empleados", "trabajadores", "personal"],
        submenu: [
            {
                id: "empleados-lista",
                href: "/empleados",
                icon: <ClipboardList size={18} />,
                text: "Lista",
                keywords: ["lista", "ver", "todos"],
            },
            {
                id: "empleados-registrar",
                href: "/empleados/registrar",
                icon: <UserPlus size={18} />,
                text: "Registrar",
                keywords: ["registrar", "nuevo", "agregar"],
            },
            {
                id: "empleados-huella",
                href: "/empleados/asignar-huella",
                icon: <Fingerprint size={18} />,
                text: "Asignar Huella",
                keywords: ["huella", "biometrico", "dactilar"],
            },
        ],
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
            : item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

    // Verificar si este item padre tiene un subitem activo
    const hasActiveChild = hasSubmenu && item.submenu?.some(subItem => 
        pathname === subItem.href || (subItem.href !== "/" && pathname.startsWith(subItem.href + "/"))
    );

    const baseClasses = `
        w-full group relative flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200 
        focus:outline-none
        ${level > 0 ? "pl-10 pr-4" : "px-4"}
        ${
            isActiveFixed
                ? level > 0
                    ? "bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-active-foreground))] shadow-inner"
                    : "bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-active-foreground))] shadow-inner border-l-4 border-[hsl(var(--sidebar-accent))]"
                : hasActiveChild && level === 0
                    ? "text-[hsl(var(--sidebar-foreground))] border-b-2 border-[hsl(var(--sidebar-accent))] bg-[hsl(var(--sidebar-hover))/30]"
                    : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-white"
        }
        ${isCollapsed ? "justify-center" : ""}
    `;

    const content = (
        <>
            <div className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                {item.icon}
            </div>
            {!isCollapsed && (
                <>
                    <span className="flex-grow font-medium text-sm text-left whitespace-nowrap">
                        {item.text}
                    </span>
                    {hasSubmenu && (
                        <div
                            className={`transition-transform duration-150 ease-out ${
                                isSubmenuOpen ? "rotate-90" : "rotate-0"
                            }`}
                        >
                            <ChevronRight size={16} />
                        </div>
                    )}
                </>
            )}
        </>
    );

    // Si tiene submenú y no está colapsado, renderizar como botón
    if (hasSubmenu && !isCollapsed) {
        return (
            <Tooltip content={item.text} disabled={!isCollapsed || level > 0}>
                <button
                    type="button"
                    onClick={onSubmenuToggle}
                    className={baseClasses}
                >
                    {content}
                </button>
            </Tooltip>
        );
    }

    // En todos los demás casos, renderizar como Link
    return (
        <Tooltip content={item.text} disabled={!isCollapsed || level > 0}>
            <Link href={item.href} className={baseClasses}>
                {content}
            </Link>
        </Tooltip>
    );
};

export default function Sidebar() {
    const pathname = usePathname();
    const { isCollapsed, toggleCollapsed } = useSidebar();
    const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>(
        {}
    );
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

    // Actualizar submenús abiertos basado en la ruta actual
    useEffect(() => {
        const newOpenSubmenus: Record<string, boolean> = {};

        navItems.forEach((item) => {
            if (item.submenu) {
                const isSubmenuActive = item.submenu.some((subItem) => {
                    return (
                        pathname === subItem.href ||
                        (subItem.href !== "/" &&
                            pathname.startsWith(subItem.href + "/"))
                    );
                });
                // Solo abrir automáticamente si está activo, mantener estado manual si no
                newOpenSubmenus[item.id] = isSubmenuActive;
            }
        });

        setOpenSubmenus(newOpenSubmenus);
    }, [pathname]);

    // Manejar atajos de teclado
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setCommandPaletteOpen(true);
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "b") {
                e.preventDefault();
                toggleCollapsed();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
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
        if (item.href !== "/" && pathname.startsWith(item.href + "/"))
            return true;

        return false;
    };

    // Verificar si un item padre tiene un subitem activo (para mostrar solo borde inferior)
    const hasActiveSubmenu = (item: NavItemData): boolean => {
        if (!item.submenu) return false;
        return item.submenu.some(
            (subItem) =>
                pathname === subItem.href ||
                (subItem.href !== "/" && pathname.startsWith(subItem.href + "/"))
        );
    };

    const isSubItemActive = (subItem: NavItemData): boolean => {
        return (
            pathname === subItem.href ||
            (subItem.href !== "/" && pathname.startsWith(subItem.href + "/"))
        );
    };

    return (
        <TooltipProvider>
            <div className="relative flex">
                <motion.div
                    animate={{ width: isCollapsed ? 80 : 256 }}
                    transition={{
                        duration: 0.15,
                        ease: "easeInOut",
                    }}
                    className="h-screen bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))] flex flex-col shadow-lg"
                >
                    {/* Header con logo institucional */}
                    <div className="p-4 border-b border-[hsl(var(--sidebar-border))] bg-gradient-to-r from-[hsl(var(--sidebar-background))] to-[hsl(var(--sidebar-background))/95]">
                        {!isCollapsed ? (
                            <Link href="/" className="flex items-center gap-3 opacity-100 transition-opacity duration-200 hover:opacity-80 transition-all">
                                <div className="flex-shrink-0">
                                    <img
                                        src="/Logo_ITO.png"
                                        alt="Logo ITO"
                                        className="w-10 h-10 object-contain rounded-lg shadow-sm"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-lg font-bold text-[hsl(var(--sidebar-foreground))] leading-tight">
                                        Sistema de Control
                                    </h1>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))] leading-tight mt-0.5">
                                        TecNM Campus Oaxaca
                                    </p>
                                </div>
                            </Link>
                        ) : (
                            <div className="flex justify-center opacity-100 transition-opacity duration-200">
                                <Tooltip content="TecNM Campus Oaxaca - Sistema de Control">
                                    <Link href="/" className="group cursor-pointer">
                                        <img
                                            src="/Logo_ITO.png"
                                            alt="Logo ITO"
                                            className="w-8 h-8 object-contain rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-200"
                                        />
                                    </Link>
                                </Tooltip>
                            </div>
                        )}
                    </div>

                    {/* Command Palette Trigger */}
                    {!isCollapsed && (
                        <div className="p-4">
                            <button
                                onClick={() => setCommandPaletteOpen(true)}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[hsl(var(--muted-foreground))] bg-[hsl(var(--sidebar-hover))] rounded-lg hover:bg-[hsl(var(--sidebar-hover))] transition-colors"
                            >
                                <Search size={16} />
                                <span>Buscar...</span>
                                <div className="ml-auto flex gap-1">
                                    <kbd className="px-1.5 py-0.5 text-xs bg-[hsl(var(--muted))] rounded">
                                        Ctrl
                                    </kbd>
                                    <kbd className="px-1.5 py-0.5 text-xs bg-[hsl(var(--muted))] rounded">
                                        K
                                    </kbd>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {navItems.map((item) => (
                            <div key={item.id}>
                                <NavItem
                                    item={item}
                                    isActive={isItemActive(item)}
                                    isCollapsed={isCollapsed}
                                    onSubmenuToggle={() =>
                                        toggleSubmenu(item.id)
                                    }
                                    isSubmenuOpen={openSubmenus[item.id]}
                                />

                                {/* Submenu */}
                                {item.submenu && !isCollapsed && (
                                    <div
                                        className={`mt-1 space-y-1 overflow-hidden transition-all duration-200 ease-out ${
                                            openSubmenus[item.id]
                                                ? "max-h-96 opacity-100"
                                                : "max-h-0 opacity-0"
                                        }`}
                                    >
                                        {item.submenu.map((subItem) => (
                                            <NavItem
                                                key={subItem.id}
                                                item={subItem}
                                                isActive={isSubItemActive(
                                                    subItem
                                                )}
                                                isCollapsed={false}
                                                level={1}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>

                    {/* User Info */}
                    <div className="p-4 border-t border-[hsl(var(--sidebar-border))]">
                        {!isCollapsed ? (
                            <div className="flex items-center gap-3 transition-opacity duration-150">
                                <div className="w-8 h-8 rounded-full bg-[hsl(var(--sidebar-accent))] flex items-center justify-center">
                                    <Users
                                        size={16}
                                        className="text-[hsl(var(--sidebar-accent-foreground))]"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[hsl(var(--sidebar-foreground))] truncate">
                                        Administrador
                                    </p>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                                        admin@ito.mx
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <Tooltip content="Administrador">
                                <div className="flex justify-center transition-opacity duration-150">
                                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--sidebar-accent))] flex items-center justify-center">
                                        <Users
                                            size={16}
                                            className="text-[hsl(var(--sidebar-accent-foreground))]"
                                        />
                                    </div>
                                </div>
                            </Tooltip>
                        )}
                    </div>
                </motion.div>

                {/* Botón de colapsar en el lateral */}
                <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 z-10">
                    <Tooltip
                        content={
                            isCollapsed
                                ? "Expandir sidebar"
                                : "Colapsar sidebar"
                        }
                    >
                        <button
                            onClick={toggleCollapsed}
                            className="w-6 h-6 bg-[hsl(var(--sidebar-background))] border border-[hsl(var(--sidebar-border))] rounded-full flex items-center justify-center text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-hover))] transition-colors shadow-md active:scale-95"
                            aria-label={
                                isCollapsed
                                    ? "Expandir sidebar"
                                    : "Colapsar sidebar"
                            }
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
