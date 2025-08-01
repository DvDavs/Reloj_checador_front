import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import MainLayout from "./layouts/main-layout"
import { Toaster } from "@/components/ui/toaster" // <-- Importa el Toaster

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <title>Sistema de Control de Asistencia - Instituto Tecnológico de Oaxaca</title>
        <meta name="description" content="Sistema de control de asistencia con escáner de huellas dactilares" />
      </head>
      <body className={`${inter.className} dark`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <MainLayout>{children}</MainLayout>
          <Toaster /> {/* <-- Añade el Toaster aquí */}
        </ThemeProvider>
      </body>
    </html>
  )
}