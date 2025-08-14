import Image from 'next/image';
import Link from 'next/link';
import { Clock, Users, Fingerprint } from 'lucide-react';

export default function Home() {
  return (
    <div className='min-h-screen bg-background text-foreground p-8'>
      <div className='max-w-5xl mx-auto'>
        <header className='text-center mb-16'>
          <h1 className='text-4xl font-bold mb-4 text-foreground'>
            Instituto Tecnológico de Oaxaca
          </h1>
          <p className='text-xl text-muted-foreground'>
            Sistema de Control de Asistencia
          </p>
        </header>

        <div className='flex justify-center mb-16'>
          <div className='relative w-64 h-64'>
            <div className='absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-xl'></div>
            <div className='relative flex items-center justify-center h-full'>
              <div className='bg-card border border-border rounded-full p-8 shadow-lg'>
                <Image
                  src='/Logo_ITO.png?height=200&width=200'
                  alt='Logo ITO'
                  width={200}
                  height={200}
                  className='rounded-full'
                />
              </div>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-16'>
          <Link href='/admin' className='block group'>
            <div className='bg-card border border-border rounded-xl p-6 h-full hover:border-primary hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02]'>
              <div className='flex justify-center mb-4'>
                <div className='w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors'>
                  <Clock className='h-8 w-8 text-primary' />
                </div>
              </div>
              <h2 className='text-xl font-bold text-center mb-2 text-card-foreground'>
                Reloj Checador
              </h2>
              <p className='text-muted-foreground text-center'>
                Gestione la asistencia del personal con el sistema biométrico.
              </p>
            </div>
          </Link>

          <Link href='/empleados' className='block group'>
            <div className='bg-card border border-border rounded-xl p-6 h-full hover:border-primary hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02]'>
              <div className='flex justify-center mb-4'>
                <div className='w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors'>
                  <Users className='h-8 w-8 text-primary' />
                </div>
              </div>
              <h2 className='text-xl font-bold text-center mb-2 text-card-foreground'>
                Empleados
              </h2>
              <p className='text-muted-foreground text-center'>
                Administre la información del personal y sus registros.
              </p>
            </div>
          </Link>

          <Link href='/empleados/asignar-huella' className='block group'>
            <div className='bg-card border border-border rounded-xl p-6 h-full hover:border-accent hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02]'>
              <div className='flex justify-center mb-4'>
                <div className='w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center group-hover:bg-accent/20 transition-colors'>
                  <Fingerprint className='h-8 w-8 text-accent' />
                </div>
              </div>
              <h2 className='text-xl font-bold text-center mb-2 text-card-foreground'>
                Huellas Digitales
              </h2>
              <p className='text-muted-foreground text-center'>
                Registre y gestione las huellas digitales del personal.
              </p>
            </div>
          </Link>
        </div>

        <div className='text-center'>
          <p className='text-muted-foreground mb-4'>
            © 2023 Instituto Tecnológico de Oaxaca
          </p>
          <p className='text-muted-foreground/80 text-sm'>
            Sistema desarrollado por el Departamento de Sistemas
          </p>
        </div>
      </div>
    </div>
  );
}
