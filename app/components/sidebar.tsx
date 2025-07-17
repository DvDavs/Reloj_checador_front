// app/components/sidebar.tsx
"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Home, Clock, Users, ClipboardList, UserPlus, Fingerprint, ChevronDown, ChevronRight, Calendar} from "lucide-react"

// ... (Interfaz NavItemProps sin cambios) ...
interface NavItemProps {
  href: string
  icon: React.ReactNode
  text: string
  isActive: boolean
  hasSubmenu?: boolean
  isSubmenuOpen?: boolean
  onClick?: () => void
}

const NavItem = ({ href, icon, text, isActive, hasSubmenu, isSubmenuOpen, onClick }: NavItemProps) => (
  <Link
    href={href}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
    }`}
    onClick={onClick}
  >
    <div className="flex-shrink-0">{icon}</div>
    <span className="flex-grow">{text}</span>
    {hasSubmenu && (isSubmenuOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />)}
  </Link>
)


export default function Sidebar() {
  const pathname = usePathname()
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    empleados: pathname.startsWith("/empleados"),
    // reloj: pathname.startsWith("/admin"), // Comentado o eliminado
  })

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <div className="w-64 h-screen bg-zinc-900 border-r border-zinc-800 flex flex-col">
      {/* ... (Encabezado sin cambios) ... */}
       <div className="p-4 border-b border-zinc-800">
         <h1 className="text-xl font-bold text-white">Sistema de Control</h1>
         <p className="text-sm text-zinc-400">Instituto Tecnológico de Oaxaca</p>
       </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavItem href="/" icon={<Home size={20} />} text="Inicio" isActive={pathname === "/"} />

        {/* --- SECCIÓN RELOJ CHECADOR - COMENTADA ---
        <div>
          <NavItem
            href="#"
            icon={<Clock size={20} />}
            text="Reloj Checador"
            isActive={pathname.startsWith("/admin")}
            hasSubmenu={true}
            isSubmenuOpen={openSubmenus.reloj}
            onClick={() => toggleSubmenu("reloj")}
          />
          {openSubmenus.reloj && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="ml-6 mt-1 space-y-1"
            >
              <NavItem
                href="/admin"
                icon={<ClipboardList size={18} />}
                text="Selección de Lector"
                isActive={pathname === "/admin"}
              />
            </motion.div>
          )}
        </div>
        */}

        {/* --- SECCIÓN EMPLEADOS (Sin cambios) --- */}
        <div>
          <NavItem
            href="#"
            icon={<Users size={20} />}
            text="Empleados"
            isActive={pathname.startsWith("/empleados")}
            hasSubmenu={true}
            isSubmenuOpen={openSubmenus.empleados}
            onClick={() => toggleSubmenu("empleados")}
          />
          {openSubmenus.empleados && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="ml-6 mt-1 space-y-1"
            >
              <NavItem
                href="/empleados"
                icon={<ClipboardList size={18} />}
                text="Lista"
                isActive={pathname === "/empleados"}
              />
              {/* <NavItem
                href="/empleados/registrar" // Mantener o quitar según decisión sobre creación
                icon={<UserPlus size={18} />}
                text="Registrar"
                isActive={pathname === "/empleados/registrar"}
              /> 
              <NavItem
                href="/empleados/asignar-huella" // Quizás quitar este link directo y acceder solo desde la tabla
                icon={<Fingerprint size={18} />}
                text="Asignar Huella"
                isActive={pathname === "/empleados/asignar-huella"}
              />*/}
              
            </motion.div>
          )}
          <NavItem
            href="/horarios"
            icon={<Clock size={20} />}
            text="Horarios"
            isActive={pathname === "/horarios"}
          />
          <NavItem
            href="/asignacion-horarios"
            icon={<Calendar size={20} />}
            text="Asignación de Horarios"
            isActive={pathname === "/asignacion-horarios"}
          />
          
        </div>
      </nav>

      {/* ... (Pie de página sin cambios) ... */}
       <div className="p-4 border-t border-zinc-800">
         <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
             <Users size={16} className="text-zinc-400" />
           </div>
           <div>
             <p className="text-sm font-medium text-white">Administrador</p>
             <p className="text-xs text-zinc-400">admin@ito.mx</p>
           </div>
         </div>
       </div>
    </div>
  )
}