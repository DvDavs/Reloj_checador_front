"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import Sidebar from "../components/sidebar"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // No mostrar el sidebar SOLO en la página del reloj checador
  const isClockPage = pathname === "/reloj-checador"

  if (isClockPage) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-black">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

