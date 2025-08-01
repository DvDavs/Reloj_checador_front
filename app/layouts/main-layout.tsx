"use client"

import type React from "react"
import { useState } from "react"
import { usePathname } from "next/navigation"
import Sidebar from "../components/sidebar"
import { Menu } from "lucide-react"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isSidebarOpen, setSidebarOpen] = useState(false) // For mobile overlay
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false) // For desktop collapse

  // No mostrar el sidebar SOLO en la página del reloj checador
  const isClockPage = pathname === "/reloj-checador"

  if (isClockPage) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-black">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />
      <div className="flex flex-1 flex-col">
        {/* Mobile-only header */}
        <header className="md:hidden bg-zinc-900 border-b border-zinc-800 p-4">
          <button onClick={() => setSidebarOpen(true)} className="text-white">
            <Menu size={24} />
          </button>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

