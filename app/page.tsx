import Image from "next/image"
import Link from "next/link"
import { Clock, Users, Fingerprint } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Instituto Tecnológico de Oaxaca</h1>
          <p className="text-xl text-zinc-400">Sistema de Control de Asistencia</p>
        </header>

        <div className="flex justify-center mb-16">
          <div className="relative w-64 h-64">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-green-500 rounded-full opacity-20 blur-xl"></div>
            <div className="relative flex items-center justify-center h-full">
              <Image
                src="/Logo_ITO.png?height=200&width=200"
                alt="Logo ITO"
                width={200}
                height={200}
                className="rounded-full"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/*}
          <Link href="/admin" className="block">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-full hover:border-blue-500 transition-colors">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-center mb-2">Reloj Checador</h2>
              <p className="text-zinc-400 text-center">
                Gestione la asistencia del personal con el sistema biométrico.
              </p>
            </div>
          </Link>*/}

          <Link href="/empleados" className="block">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-full hover:border-green-500 transition-colors">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-center mb-2">Empleados</h2>
              <p className="text-zinc-400 text-center">Administre la información del personal y sus registros.</p>
            </div>
          </Link>
{/*
          <Link href="/empleados/asignar-huella" className="block">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-full hover:border-purple-500 transition-colors">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Fingerprint className="h-8 w-8 text-purple-500" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-center mb-2">Huellas Digitales</h2>
              <p className="text-zinc-400 text-center">Registre y gestione las huellas digitales del personal.</p>
            </div>
          </Link>
          */ }
        </div>

        <div className="text-center">
          <p className="text-zinc-500 mb-4">© 2023 Instituto Tecnológico de Oaxaca</p>
          <p className="text-zinc-600 text-sm">Sistema desarrollado por el Departamento de Sistemas</p>
        </div>
      </div>
    </div>
  )
}

