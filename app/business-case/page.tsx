import type { Metadata } from 'next';
import Image from 'next/image';
import { KRONET_BRANDING } from '@/lib/branding';
import {
  Activity,
  Banknote,
  BarChart3,
  Building2,
  Clock,
  Cloud,
  FileCheck2,
  Fingerprint,
  Gauge,
  Layers,
  LogIn,
  LogOut,
  MapPin,
  MonitorPlay,
  Network,
  Radar,
  Scale,
  ShieldCheck,
  Timer,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'KRONET — Resumen ejecutivo para su organización',
  description:
    'Propuesta de valor: control operativo, optimización de nómina y enfoque antifraude.',
};

const recoveryRows = [
  {
    volume: 'Hasta 100 empleados',
    payroll: '$958,200.00',
    leak1: '$9,582.00',
    leak3: '$28,746.00',
    leak5: '$47,910.00',
  },
  {
    volume: 'Hasta 200 empleados',
    payroll: '$1,916,400.00',
    leak1: '$19,164.00',
    leak3: '$57,492.00',
    leak5: '$95,820.00',
  },
  {
    volume: 'Hasta 300 empleados',
    payroll: '$2,874,600.00',
    leak1: '$28,746.00',
    leak3: '$86,238.00',
    leak5: '$143,730.00',
  },
  {
    volume: 'Hasta 400 empleados',
    payroll: '$3,832,800.00',
    leak1: '$38,328.00',
    leak3: '$114,984.00',
    leak5: '$191,640.00',
  },
  {
    volume: 'Hasta 500 empleados',
    payroll: '$4,791,000.00',
    leak1: '$47,910.00',
    leak3: '$143,730.00',
    leak5: '$239,550.00',
  },
] as const;

const investmentRows = [
  {
    level: 'Nivel 1',
    capacity: 'De 0 a 100 empleados',
    monthly: '$5,000.00 MXN',
    potential: '$47,910.00 MXN',
  },
  {
    level: 'Nivel 2',
    capacity: 'De 101 a 200 empleados',
    monthly: '$10,000.00 MXN',
    potential: '$95,820.00 MXN',
  },
  {
    level: 'Nivel 3',
    capacity: 'De 201 a 300 empleados',
    monthly: '$15,000.00 MXN',
    potential: '$143,730.00 MXN',
  },
  {
    level: 'Nivel 4',
    capacity: 'De 301 a 400 empleados',
    monthly: '$20,000.00 MXN',
    potential: '$191,640.00 MXN',
  },
  {
    level: 'Nivel 5',
    capacity: 'De 401 a 500 empleados',
    monthly: '$25,000.00 MXN',
    potential: '$239,550.00 MXN',
  },
] as const;

/** hero = fila completa panorámica; full = fila completa destacada (alta vertical); standard = mitad de fila; compact = mitad de fila, tarjeta reducida. */
const VISTA_SHOTS = [
  {
    src: '/branding/kronet/vista/kiosco.png',
    title: 'Reloj checador y kiosco',
    caption:
      'Interfaz orientada al personal: registro ágil y experiencia clara en el punto de checado.',
    layout: 'hero' as const,
  },
  {
    src: '/branding/kronet/vista/asistencias.png',
    title: 'Asistencias',
    caption:
      'Vista consolidada del comportamiento de asistencia para seguimiento y toma de decisiones.',
    layout: 'standard' as const,
  },
  {
    src: '/branding/kronet/vista/chequeos.png',
    title: 'Chequeos',
    caption:
      'Supervisión operativa de registros y estados con enfoque en el día a día.',
    layout: 'standard' as const,
  },
  {
    src: '/branding/kronet/vista/reporte-pdf.png',
    title: 'Reportes en PDF',
    caption:
      'Salida lista para archivo, auditoría o compartir: el sistema genera reportes de asistencia y operación en formato PDF.',
    layout: 'hero' as const,
  },
  {
    src: '/branding/kronet/vista/huella-paso-3.png',
    title: 'Alta de huella — flujo guiado',
    caption:
      'Asistente paso a paso para registrar la huella del colaborador de forma ordenada.',
    layout: 'full' as const,
  },
  {
    src: '/branding/kronet/vista/huella-ok.png',
    title: 'Registro biométrico',
    caption:
      'Confirmación de captura exitosa en el flujo de enrolamiento de huella.',
    layout: 'compact' as const,
  },
  {
    src: '/branding/kronet/vista/huella-paso-4.png',
    title: 'Procesamiento de lectura',
    caption:
      'Estado de sincronización y validación tras la captura en el terminal.',
    layout: 'compact' as const,
  },
] as const;

type VistaShot = (typeof VISTA_SHOTS)[number];

type VistaRow =
  | { kind: 'full'; shot: VistaShot }
  | { kind: 'pair'; shots: [VistaShot, VistaShot] }
  | { kind: 'single'; shot: VistaShot };

function isFullWidthLayout(layout: VistaShot['layout']) {
  return layout === 'hero' || layout === 'full';
}

/** Agrupa capturas en filas sin huecos: hero/full solos; standard y compact de 2 en 2; la última suelta centrada. */
function partitionVistaRows(shots: readonly VistaShot[]): VistaRow[] {
  const rows: VistaRow[] = [];
  const pending: VistaShot[] = [];

  const flushPair = () => {
    if (pending.length === 2) {
      rows.push({ kind: 'pair', shots: [pending[0], pending[1]] });
      pending.length = 0;
    }
  };

  for (const shot of shots) {
    if (isFullWidthLayout(shot.layout)) {
      if (pending.length === 1) {
        rows.push({ kind: 'single', shot: pending[0] });
        pending.length = 0;
      } else {
        flushPair();
      }
      rows.push({ kind: 'full', shot });
    } else {
      pending.push(shot);
      flushPair();
    }
  }
  if (pending.length === 1) {
    rows.push({ kind: 'single', shot: pending[0] });
  } else if (pending.length === 2) {
    rows.push({ kind: 'pair', shots: [pending[0], pending[1]] });
  }

  return rows;
}

function ScreenshotPreview({
  src,
  alt,
  title,
  caption,
  layout,
  rowSpan,
}: {
  src: string;
  alt: string;
  title: string;
  caption: string;
  layout: VistaShot['layout'];
  /** Fila completa en grid (hero/full), o ítem suelto centrado (standard). */
  rowSpan?: 'full';
}) {
  const isCompact = layout === 'compact';
  const isHero = layout === 'hero';
  const isFull = layout === 'full';
  const orphanStandard = rowSpan === 'full' && layout === 'standard';

  const aspectClass = isHero
    ? 'aspect-[21/9] sm:aspect-[2.2/1]'
    : isFull
      ? 'aspect-[16/9] min-h-[220px] sm:min-h-[min(420px,50vh)] md:aspect-[2/1] md:min-h-[380px]'
      : isCompact
        ? 'aspect-[5/4] max-h-[200px] sm:max-h-[230px]'
        : 'aspect-[16/10]';

  const sizes =
    isHero || isFull
      ? '(max-width: 768px) 100vw, 1100px'
      : isCompact
        ? '(max-width: 768px) 100vw, 280px'
        : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 520px';

  return (
    <figure
      className={`group m-0 print:break-inside-avoid ${
        rowSpan === 'full' ? 'col-span-full w-full' : ''
      } ${orphanStandard ? 'max-w-3xl justify-self-center' : ''} ${
        isCompact
          ? 'w-full max-w-[18.5rem] justify-self-center sm:max-w-[19.5rem]'
          : ''
      }`}
    >
      <div className='relative w-full overflow-hidden rounded-2xl p-[1px] shadow-[0_24px_48px_-14px_rgba(6,37,52,0.42)] ring-1 ring-[#167999]/25 [background:linear-gradient(145deg,rgba(22,121,153,0.35)_0%,rgba(6,37,52,0.95)_45%,rgba(6,15,24,1)_100%)]'>
        <div
          className={`rounded-2xl bg-gradient-to-b from-[#0e3043]/95 via-[#08202f] to-[#060f18] ${
            isCompact
              ? 'p-2 sm:p-2.5'
              : isFull
                ? 'p-4 sm:p-5 md:p-6'
                : 'p-3 sm:p-4'
          }`}
        >
          <div
            className='pointer-events-none absolute inset-0 opacity-[0.07]'
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
            aria-hidden
          />
          <div
            className={`relative flex items-center gap-2 border-b border-white/10 ${
              isCompact ? 'mb-2 pb-2' : 'mb-3 pb-3'
            }`}
          >
            <div className='flex gap-1.5' aria-hidden>
              <span
                className={`rounded-full bg-[#ff5f57]/95 shadow-sm ${isCompact ? 'h-2 w-2' : 'h-2.5 w-2.5'}`}
              />
              <span
                className={`rounded-full bg-[#febc2e]/95 shadow-sm ${isCompact ? 'h-2 w-2' : 'h-2.5 w-2.5'}`}
              />
              <span
                className={`rounded-full bg-[#28c840]/95 shadow-sm ${isCompact ? 'h-2 w-2' : 'h-2.5 w-2.5'}`}
              />
            </div>
            <span
              className={`truncate font-mono font-medium text-[#8ab4c2]/75 ${isCompact ? 'text-[9px]' : 'text-[10px] sm:text-[11px]'}`}
            >
              KRONET · Vista previa
            </span>
          </div>
          <div className='relative overflow-hidden rounded-xl border border-[#167999]/15 bg-[#020810] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'>
            <div className={`relative w-full overflow-hidden ${aspectClass}`}>
              <Image
                src={src}
                alt={alt}
                fill
                className='object-cover object-top transition duration-700 ease-out group-hover:scale-[1.015]'
                sizes={sizes}
              />
            </div>
          </div>
        </div>
      </div>
      <figcaption className={`space-y-1 px-0.5 ${isCompact ? 'mt-2' : 'mt-3'}`}>
        <span
          className={`block font-bold text-[#062534] ${isCompact ? 'text-xs' : 'text-sm'}`}
        >
          {title}
        </span>
        <span
          className={`block leading-relaxed text-[#1b4a66] ${isCompact ? 'text-[11px] leading-snug' : 'text-xs'}`}
        >
          {caption}
        </span>
      </figcaption>
    </figure>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <summary className='group flex cursor-pointer list-none items-center gap-3 border-b border-[#167999]/35 pb-2 text-[0.72rem] font-bold tracking-[0.2em] text-[#062534]'>
      <span className='select-none text-[#167999] transition group-open:rotate-180'>
        ▼
      </span>
      {title}
    </summary>
  );
}

function ArchitectureDiagram() {
  return (
    <figure className='my-8 overflow-hidden rounded-2xl bg-gradient-to-b from-[#062534] to-[#0a384c] p-1 shadow-xl print:break-inside-avoid'>
      <div
        className='rounded-xl bg-[#062534] p-6 sm:p-8'
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22 viewBox=%220 0 400 400%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.06%22/%3E%3C/svg%3E")',
        }}
      >
        <div className='mb-8 text-center'>
          <h4 className='text-lg font-bold tracking-tight text-white sm:text-xl'>
            Arquitectura Multi-Sucursal KRONET
          </h4>
          <p className='mt-1 text-xs font-medium text-[#8ab4c2] sm:text-sm'>
            Sincronización centralizada en la nube con tolerancia a fallos
          </p>
        </div>

        <div className='relative flex flex-col items-center gap-10 md:flex-row md:justify-between md:px-4'>
          {/* Nube Central */}
          <div className='relative z-10 flex w-full flex-col items-center md:w-1/3'>
            <div className='flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#28a2b9]/30 bg-[#167999] shadow-[0_0_40px_rgba(22,121,153,0.6)]'>
              <Cloud className='h-10 w-10 text-white' aria-hidden />
            </div>
            <div className='mt-4 text-center'>
              <span className='block text-sm font-bold text-white'>
                KRONET Cloud
              </span>
              <span className='block text-[11px] text-[#8ab4c2]'>
                Procesamiento Central
              </span>
            </div>
          </div>

          {/* Conectores */}
          <div className='absolute left-[38%] top-1/2 hidden h-[2px] w-[20%] -translate-y-1/2 bg-gradient-to-r from-[#167999] to-[#28a2b9]/20 md:block' />

          {/* Sucursales */}
          <div className='relative z-10 flex w-full flex-col gap-3 md:w-2/3'>
            {/* Sucursal 1 */}
            <div className='flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm transition hover:bg-white/10'>
              <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#28a2b9]/20 text-[#28a2b9]'>
                <Building2 className='h-5 w-5' aria-hidden />
              </div>
              <div className='flex-1'>
                <span className='block text-sm font-bold text-white'>
                  Planta Matriz
                </span>
                <span className='flex items-center gap-1.5 text-[11px] text-[#8ab4c2]'>
                  <Fingerprint className='h-3 w-3' /> Múltiples Relojes
                  Biométricos
                </span>
              </div>
              <div className='flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-[#28c840]'>
                <Activity className='h-3.5 w-3.5' /> EN LÍNEA
              </div>
            </div>

            {/* Sucursal 2 */}
            <div className='flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm transition hover:bg-white/10'>
              <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#28a2b9]/20 text-[#28a2b9]'>
                <MapPin className='h-5 w-5' aria-hidden />
              </div>
              <div className='flex-1'>
                <span className='block text-sm font-bold text-white'>
                  Sucursal Regional
                </span>
                <span className='flex items-center gap-1.5 text-[11px] text-[#8ab4c2]'>
                  <MonitorPlay className='h-3 w-3' /> Kiosco de Asistencia iPad
                </span>
              </div>
              <div className='flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-[#28c840]'>
                <Activity className='h-3.5 w-3.5' /> EN LÍNEA
              </div>
            </div>

            {/* Sucursal 3 (Offline simulado) */}
            <div className='flex items-center gap-4 rounded-xl border border-[#febc2e]/30 bg-[#febc2e]/10 p-3.5 backdrop-blur-sm transition hover:bg-[#febc2e]/20'>
              <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#febc2e]/20 text-[#febc2e]'>
                <Building2 className='h-5 w-5' aria-hidden />
              </div>
              <div className='flex-1'>
                <span className='block text-sm font-bold text-white'>
                  Bodega / Almacén
                </span>
                <span className='flex items-center gap-1.5 text-[11px] text-[#8ab4c2]'>
                  <Fingerprint className='h-3 w-3' /> Reloj Checador Standalone
                </span>
              </div>
              <div className='flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-[#febc2e]'>
                <Network className='h-3.5 w-3.5' /> RESPALDO LOCAL
              </div>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}

export default function BusinessCasePage() {
  return (
    <div
      className='business-case-print-root h-[100dvh] min-h-0 overflow-x-hidden overflow-y-auto overscroll-y-contain bg-[#e8eef2] text-[#062534] antialiased [scrollbar-gutter:stable] print:!h-auto print:!max-h-none print:!min-h-0 print:!overflow-visible print:bg-white print:p-0'
      data-theme='light'
    >
      <article className='mx-auto max-w-[1180px] px-4 py-8 print:max-w-none print:!overflow-visible print:px-6 print:py-4 sm:px-6'>
        <div className='business-case-print-doc overflow-hidden rounded-sm bg-white shadow-[0_20px_60px_-15px_rgba(6,37,52,0.25)] print:!max-h-none print:!overflow-visible print:shadow-none'>
          {/* Hero */}
          <header className='relative isolate overflow-hidden bg-[#062534] px-6 py-10 print:!overflow-visible sm:px-10 sm:py-12'>
            <div
              className='pointer-events-none absolute inset-0 opacity-40'
              style={{
                backgroundImage:
                  "linear-gradient(105deg, #062534 0%, #0e3043 35%, #167999 100%), url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E\")",
                backgroundBlendMode: 'normal, overlay',
              }}
            />
            <div className='absolute inset-0 bg-gradient-to-br from-[#167999]/25 via-transparent to-transparent' />
            <div className='relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between'>
              <div className='max-w-2xl space-y-3'>
                <p className='text-sm font-medium tracking-wide text-[#8ab4c2]'>
                  {new Intl.DateTimeFormat('es-MX', {
                    month: 'long',
                    year: 'numeric',
                  }).format(new Date())}
                </p>
                <h1 className='flex flex-wrap items-center gap-3 sm:gap-4'>
                  <span className='inline-flex rounded-md bg-white px-3 py-2 shadow-sm sm:px-4 sm:py-2.5'>
                    <Image
                      src={KRONET_BRANDING.logoCompleto.src}
                      alt='KRONET'
                      width={KRONET_BRANDING.logoCompleto.width}
                      height={KRONET_BRANDING.logoCompleto.height}
                      className='h-9 w-auto max-w-[240px] object-contain object-left sm:h-11 sm:max-w-[280px]'
                      priority
                    />
                  </span>
                  <span className='text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl'>
                    — Resumen ejecutivo
                  </span>
                </h1>
                <p className='text-lg font-medium text-[#eef5f8]/95 sm:text-xl'>
                  Plataforma de control operativo, optimización de nómina y
                  prevención de fraude en asistencia
                </p>
              </div>
            </div>
          </header>

          <div className='business-case-print-grid grid gap-0 lg:grid-cols-12'>
            {/* Columna izquierda — resumen ejecutivo */}
            <aside className='border-b border-[#c8d9df] bg-[#f7fafb] px-6 py-8 sm:px-8 lg:col-span-4 lg:border-b-0 lg:border-r print:border-b print:border-r-0 print:bg-white'>
              <p className='text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#167999]'>
                A primera vista
              </p>
              <p className='mt-3 text-sm font-semibold italic leading-relaxed text-[#062534]'>
                &ldquo;Sin certeza sobre quién trabajó en realidad, su
                organización paga de más.&rdquo;
              </p>

              <div className='mt-8 rounded-lg bg-[#062534] px-4 py-6 text-[#f0f5f7] shadow-inner'>
                <p className='text-center text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#8ab4c2]'>
                  Indicadores clave
                </p>
                <ul className='mt-5 grid grid-cols-2 gap-x-3 gap-y-5 text-center'>
                  <li className='flex flex-col items-center gap-1.5'>
                    <Banknote className='h-5 w-5 text-[#28a2b9]' aria-hidden />
                    <span className='text-lg font-bold leading-none'>5%</span>
                    <span className='text-[0.65rem] leading-tight text-[#8ab4c2]'>
                      Potencial de recuperación sobre nómina
                    </span>
                  </li>
                  <li className='flex flex-col items-center gap-1.5'>
                    <Gauge className='h-5 w-5 text-[#28a2b9]' aria-hidden />
                    <span className='text-lg font-bold leading-none'>90%</span>
                    <span className='text-[0.65rem] leading-tight text-[#8ab4c2]'>
                      Menos tiempo en cierre de nómina
                    </span>
                  </li>
                  <li className='flex flex-col items-center gap-1.5'>
                    <ShieldCheck
                      className='h-5 w-5 text-[#28a2b9]'
                      aria-hidden
                    />
                    <span className='text-sm font-bold leading-none'>
                      Compliance
                    </span>
                    <span className='text-[0.65rem] leading-tight text-[#8ab4c2]'>
                      Trazabilidad inalterable
                    </span>
                  </li>
                  <li className='flex flex-col items-center gap-1.5'>
                    <Layers className='h-5 w-5 text-[#28a2b9]' aria-hidden />
                    <span className='text-sm font-bold leading-none'>
                      Vanguardismo
                    </span>
                    <span className='text-[0.65rem] leading-tight text-[#8ab4c2]'>
                      Reglas operativas avanzadas
                    </span>
                  </li>
                  <li className='flex flex-col items-center gap-1.5'>
                    <Radar className='h-5 w-5 text-[#28a2b9]' aria-hidden />
                    <span className='text-sm font-bold leading-none'>
                      Escalable
                    </span>
                    <span className='text-[0.65rem] leading-tight text-[#8ab4c2]'>
                      De una planta a muchas sucursales
                    </span>
                  </li>
                  <li className='flex flex-col items-center gap-1.5'>
                    <Scale className='h-5 w-5 text-[#28a2b9]' aria-hidden />
                    <span className='text-sm font-bold leading-none'>
                      Visibilidad
                    </span>
                    <span className='text-[0.65rem] leading-tight text-[#8ab4c2]'>
                      Un solo panorama de su operación
                    </span>
                  </li>
                  <li className='col-span-2 flex flex-col items-center gap-1.5'>
                    <Clock className='h-5 w-5 text-[#28a2b9]' aria-hidden />
                    <span className='text-sm font-bold leading-none'>24/7</span>
                    <span className='text-[0.65rem] leading-tight text-[#8ab4c2]'>
                      Funcionamiento del sistema
                    </span>
                  </li>
                </ul>
              </div>

              <div className='mt-10'>
                <p className='flex items-center gap-2 border-b border-[#167999]/30 pb-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#062534]'>
                  <span className='text-[#167999]'>▼</span>
                  Contenido de este documento
                </p>
                <ul className='mt-4 space-y-2 text-sm text-[#1b4a66]'>
                  <li>
                    <span className='font-semibold text-[#062534]'>
                      Contexto:
                    </span>{' '}
                    retos financieros y operativos en operaciones con gran
                    personal o varias ubicaciones.
                  </li>
                  <li>
                    <span className='font-semibold text-[#062534]'>Valor:</span>{' '}
                    cómo KRONET reduce fugas, acelera el cierre de nómina y
                    fortalece el cumplimiento.
                  </li>
                  <li>
                    <span className='font-semibold text-[#062534]'>
                      Capacidades:
                    </span>{' '}
                    justificaciones, reportes, publicidad en terminales,
                    seguimiento en tiempo real y análisis de asistencia
                    (retardos, faltas de entrada o salida, etc.).
                  </li>
                  <li>
                    <span className='font-semibold text-[#062534]'>
                      Vista previa:
                    </span>{' '}
                    capturas del sistema con presentación tipo demo (kiosco,
                    asistencias, chequeos, reportes en PDF, flujo de huella).
                  </li>
                  <li>
                    <span className='font-semibold text-[#062534]'>
                      Referencias económicas:
                    </span>{' '}
                    estimaciones de recuperación, inversión mensual y requisitos
                    de puesta en marcha.
                  </li>
                </ul>
              </div>
            </aside>

            {/* Columna derecha — cuerpo */}
            <div className='business-case-print-main space-y-10 px-6 py-8 sm:px-10 lg:col-span-8 lg:py-10'>
              <details open className='group'>
                <SectionHeader title='CONTEXTO: RETO FINANCIERO Y OPERATIVO' />
                <div className='mt-4 text-sm leading-relaxed text-[#1b4a66]'>
                  <p>
                    Las organizaciones con operaciones de gran escala o varias
                    ubicaciones enfrentan con frecuencia fugas de capital poco
                    visibles: fraude en asistencia, falta de trazabilidad en
                    sucursales y errores manuales en horas extra o turnos
                    rotativos, con impacto directo en resultados. Un checador
                    aislado o un módulo genérico de recursos humanos suele ser
                    insuficiente; se requiere una plataforma alineada con la
                    operación real y con la nómina.
                  </p>
                </div>
              </details>

              <details open className='group'>
                <SectionHeader title='QUÉ OFRECE KRONET A SU ORGANIZACIÓN' />
                <div className='mt-4 space-y-4 text-sm leading-relaxed text-[#1b4a66]'>
                  <ul className='space-y-4'>
                    <li className='flex gap-3'>
                      <span className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#167999] text-white'>
                        <Banknote className='h-3.5 w-3.5' aria-hidden />
                      </span>
                      <div>
                        <p className='font-bold text-[#062534]'>
                          Ahorro e impacto financiero
                        </p>
                        <p>
                          Contribuye a reducir fugas de capital y fraude en
                          asistencia, con un potencial de recuperación de hasta
                          el 5% sobre su nómina actual. La inversión puede
                          compensarse al corregir pérdidas operativas
                          recurrentes.
                        </p>
                      </div>
                    </li>
                    <li className='flex gap-3'>
                      <span className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#167999] text-white'>
                        <Gauge className='h-3.5 w-3.5' aria-hidden />
                      </span>
                      <div>
                        <p className='font-bold text-[#062534]'>
                          Velocidad de Procesamiento
                        </p>
                        <p>
                          Automatiza el flujo de información y puede reducir de
                          forma significativa (hasta en un 90%) el tiempo
                          dedicado al cálculo y la consolidación previa a la
                          nómina.
                        </p>
                      </div>
                    </li>
                    <li className='flex gap-3'>
                      <span className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#167999] text-white'>
                        <ShieldCheck className='h-3.5 w-3.5' aria-hidden />
                      </span>
                      <div>
                        <p className='font-bold text-[#062534]'>
                          Seguridad y Compliance
                        </p>
                        <p>
                          Ofrece trazabilidad laboral consistente y respaldo
                          documental ante auditorías, revisiones internas o
                          situaciones laborales.
                        </p>
                      </div>
                    </li>
                    <li className='flex gap-3'>
                      <span className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#167999] text-white'>
                        <Layers className='h-3.5 w-3.5' aria-hidden />
                      </span>
                      <div>
                        <p className='font-bold text-[#062534]'>Vanguardismo</p>
                        <p>
                          Incorpora reglas y lógica de negocio orientadas a
                          escenarios operativos complejos que muchas soluciones
                          estándar no cubren.
                        </p>
                      </div>
                    </li>
                    <li className='flex gap-3'>
                      <span className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#167999] text-white'>
                        <Radar className='h-3.5 w-3.5' aria-hidden />
                      </span>
                      <div>
                        <p className='font-bold text-[#062534]'>
                          Escalabilidad Estructural
                        </p>
                        <p>
                          Arquitectura pensada para crecer con usted: desde una
                          planta con alta concentración de personal hasta el
                          gobierno centralizado de numerosas sucursales.
                        </p>
                      </div>
                    </li>
                    <li className='flex gap-3'>
                      <span className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#167999] text-white'>
                        <Scale className='h-3.5 w-3.5' aria-hidden />
                      </span>
                      <div>
                        <p className='font-bold text-[#062534]'>
                          Accesibilidad Total
                        </p>
                        <p>
                          Consolida la visibilidad de la operación y reduce
                          puntos ciegos entre sedes, turnos y equipos.
                        </p>
                      </div>
                    </li>
                    <li className='flex gap-3'>
                      <span className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#167999] text-white'>
                        <Clock className='h-3.5 w-3.5' aria-hidden />
                      </span>
                      <div>
                        <p className='font-bold text-[#062534]'>
                          Funcionamiento del sistema 24/7
                        </p>
                        <p>
                          La plataforma permanece operativa de forma continua
                          para el registro y la consolidación de información,
                          acorde con turnos extendidos y operaciones que no se
                          interrumpen.
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
              </details>

              <details open className='group'>
                <SectionHeader title='MÓDULOS DE LA SOLUCIÓN' />
                <div className='mt-4 text-sm leading-relaxed text-[#1b4a66]'>
                  <p className='mb-4'>
                    KRONET integra los siguientes módulos, configurables según
                    el tamaño y la complejidad de su operación:
                  </p>
                  <ArchitectureDiagram />
                  <ol className='list-none space-y-4'>
                    <li className='flex gap-3'>
                      <span className='flex h-6 w-6 shrink-0 items-center justify-center bg-[#eab308] text-xs font-bold text-[#062534]'>
                        1
                      </span>
                      <div>
                        <p className='font-bold text-[#062534]'>
                          Módulo de Centralización Cloud y Resiliencia
                          (Multi-Locación)
                        </p>
                        <p>
                          Centraliza la información de sus ubicaciones en una
                          base en la nube. Incluye respaldo local temporal para
                          que, si una sucursal pierde conectividad, los
                          registros continúen y se sincronicen al restablecerse
                          el servicio.
                        </p>
                      </div>
                    </li>
                    <li className='flex gap-3'>
                      <span className='flex h-6 w-6 shrink-0 items-center justify-center bg-[#eab308] text-xs font-bold text-[#062534]'>
                        2
                      </span>
                      <div>
                        <p className='font-bold text-[#062534]'>
                          Módulo de Motor de Turnos Complejos
                        </p>
                        <p>
                          Orquesta horarios rotativos, turnos nocturnos cruzados
                          y esquemas flexibles, consolidando las horas conforme
                          a las políticas definidas por su empresa.
                        </p>
                      </div>
                    </li>
                    <li className='flex gap-3'>
                      <span className='flex h-6 w-6 shrink-0 items-center justify-center bg-[#167999] text-xs font-bold text-white'>
                        3
                      </span>
                      <div>
                        <p className='font-bold text-[#062534]'>
                          Dashboard de Control Operativo
                        </p>
                        <p>
                          Ofrece una vista unificada del estado de los registros
                          y permite exportar la información procesada para
                          alimentar el flujo de nómina con mayor agilidad y
                          control.
                        </p>
                      </div>
                    </li>
                  </ol>
                </div>
              </details>

              <details open className='group'>
                <SectionHeader title='¿QUÉ PUEDE HACER CON EL SISTEMA?' />
                <div className='mt-4 space-y-4 text-sm leading-relaxed text-[#1b4a66]'>
                  <p>
                    Más allá del registro de entrada y salida, KRONET concentra
                    herramientas para gobernar la asistencia, comunicar en los
                    puntos de contacto con el personal y alimentar el análisis y
                    la nómina con información clasificada y trazable.
                  </p>
                  <ul className='space-y-4'>
                    <li className='flex gap-3'>
                      <span className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#167999] text-white'>
                        <FileCheck2 className='h-3.5 w-3.5' aria-hidden />
                      </span>
                      <div>
                        <p className='font-bold text-[#062534]'>
                          Justificaciones
                        </p>
                        <p>
                          Registrar y dar seguimiento a incidencias con sustento
                          documental, alineado a sus políticas y útil ante
                          revisiones internas, auditorías o el cierre de nómina.
                        </p>
                      </div>
                    </li>
                    <li className='flex gap-3'>
                      <span className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#167999] text-white'>
                        <BarChart3 className='h-3.5 w-3.5' aria-hidden />
                      </span>
                      <div>
                        <p className='font-bold text-[#062534]'>Reportes</p>
                        <p>
                          Generar y exportar informes de asistencia y operación:
                          vistas consolidadas o detalladas por período, sede,
                          equipo u otros criterios que defina su organización.
                        </p>
                      </div>
                    </li>
                    <li className='flex gap-3'>
                      <span className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#167999] text-white'>
                        <MonitorPlay className='h-3.5 w-3.5' aria-hidden />
                      </span>
                      <div>
                        <p className='font-bold text-[#062534]'>
                          Publicidad en los puntos de registro
                        </p>
                        <p>
                          Mostrar mensajes, avisos o campañas en las pantallas
                          de los terminales y del reloj checador, para
                          comunicación interna efectiva con quienes registran
                          asistencia.
                        </p>
                      </div>
                    </li>
                    <li className='flex gap-3'>
                      <span className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#167999] text-white'>
                        <Activity className='h-3.5 w-3.5' aria-hidden />
                      </span>
                      <div>
                        <p className='font-bold text-[#062534]'>
                          Chequeos en tiempo real
                        </p>
                        <p>
                          Supervisar el estado de los registros y la actividad
                          conforme se producen, con visibilidad acorde a sus
                          roles y necesidades operativas.
                        </p>
                      </div>
                    </li>
                    <li className='flex gap-3'>
                      <span className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#167999] text-white'>
                        <Timer className='h-3.5 w-3.5' aria-hidden />
                      </span>
                      <div>
                        <p className='font-bold text-[#062534]'>
                          Asistencia segmentada y analítica
                        </p>
                        <p>
                          Identificar y trabajar con cortes claros del
                          comportamiento de asistencia, entre otros:{' '}
                          <span className='font-semibold text-[#062534]'>
                            retardos
                          </span>
                          ,{' '}
                          <span className='font-semibold text-[#062534]'>
                            falta de entrada
                          </span>
                          ,{' '}
                          <span className='font-semibold text-[#062534]'>
                            falta de salida
                          </span>{' '}
                          y patrones anómalos, para priorizar correcciones,
                          justificaciones o acciones de RH antes del cierre de
                          período.
                        </p>
                        <ul className='mt-2 list-none space-y-1.5 border-l-2 border-[#167999]/35 pl-3 text-[0.8125rem] text-[#1b4a66]'>
                          <li className='flex items-center gap-2'>
                            <Timer
                              className='h-3.5 w-3.5 shrink-0 text-[#167999]'
                              aria-hidden
                            />
                            Retardos respecto al horario o turno programado
                          </li>
                          <li className='flex items-center gap-2'>
                            <LogIn
                              className='h-3.5 w-3.5 shrink-0 text-[#167999]'
                              aria-hidden
                            />
                            Ausencia de registro de entrada
                          </li>
                          <li className='flex items-center gap-2'>
                            <LogOut
                              className='h-3.5 w-3.5 shrink-0 text-[#167999]'
                              aria-hidden
                            />
                            Ausencia de registro de salida
                          </li>
                        </ul>
                      </div>
                    </li>
                  </ul>
                </div>
              </details>

              <details open className='group'>
                <SectionHeader title='VISTA PREVIA DEL SISTEMA' />
                <div className='mt-4 space-y-6 text-sm leading-relaxed text-[#1b4a66]'>
                  <p>
                    Capturas reales del entorno KRONET, presentadas con el mismo
                    cuidado visual que usaría su equipo en una demo o comité de
                    decisión: interfaz, flujos de asistencia, chequeos, reportes
                    en PDF y enrolamiento biométrico.
                  </p>
                  <div className='rounded-xl border border-[#c8d9df]/80 bg-gradient-to-br from-[#f0f7fa] via-white to-[#e8f0f4] p-4 sm:p-6'>
                    <p className='mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#167999]'>
                      Galería de interfaz
                    </p>
                    <div className='grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-6 md:items-stretch'>
                      {partitionVistaRows(VISTA_SHOTS).map((row) => {
                        if (row.kind === 'full') {
                          return (
                            <ScreenshotPreview
                              key={row.shot.src}
                              src={row.shot.src}
                              alt={row.shot.title}
                              title={row.shot.title}
                              caption={row.shot.caption}
                              layout={row.shot.layout}
                              rowSpan='full'
                            />
                          );
                        }
                        if (row.kind === 'pair') {
                          return (
                            <div
                              key={`${row.shots[0].src}-${row.shots[1].src}`}
                              className='contents'
                            >
                              <ScreenshotPreview
                                src={row.shots[0].src}
                                alt={row.shots[0].title}
                                title={row.shots[0].title}
                                caption={row.shots[0].caption}
                                layout={row.shots[0].layout}
                              />
                              <ScreenshotPreview
                                src={row.shots[1].src}
                                alt={row.shots[1].title}
                                title={row.shots[1].title}
                                caption={row.shots[1].caption}
                                layout={row.shots[1].layout}
                              />
                            </div>
                          );
                        }
                        return (
                          <ScreenshotPreview
                            key={row.shot.src}
                            src={row.shot.src}
                            alt={row.shot.title}
                            title={row.shot.title}
                            caption={row.shot.caption}
                            layout={row.shot.layout}
                            rowSpan='full'
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </details>

              <details open className='group'>
                <SectionHeader title='REFERENCIAS ECONÓMICAS Y PUESTA EN MARCHA' />
                <div className='mt-6 space-y-10 text-sm leading-relaxed text-[#1b4a66]'>
                  {/* 1. Tabla recuperación */}
                  <section>
                    <div className='mb-3 flex items-start gap-3'>
                      <span className='flex h-8 w-8 shrink-0 items-center justify-center bg-[#eab308] text-sm font-bold text-[#062534]'>
                        1
                      </span>
                      <div>
                        <h3 className='text-base font-bold text-[#062534]'>
                          Estimación de capital recuperable por ineficiencias
                          operativas
                        </h3>
                        <p className='mt-1'>
                          Ilustración del orden de magnitud del impacto
                          económico asociado a fugas en asistencia y errores en
                          el cierre de nómina. Se utiliza una nómina mensual de
                          referencia por volumen (aprox. $9,582 por cada 100
                          empleados en el esquema mostrado). Las cifras son
                          orientativas y deben ajustarse al contexto de su
                          organización.
                        </p>
                      </div>
                    </div>
                    <p className='mb-3 text-xs font-semibold uppercase tracking-wide text-[#167999]'>
                      Proyección de capital recuperable (referencia de ROI)
                    </p>
                    <div className='overflow-x-auto rounded border border-[#c8d9df] print:!overflow-visible'>
                      <table className='w-full min-w-[640px] border-collapse text-left text-xs sm:text-sm'>
                        <thead>
                          <tr className='bg-[#e7eff2] text-[#062534]'>
                            <th className='border-b border-[#c8d9df] px-3 py-2 font-bold'>
                              Volumen de Operación
                            </th>
                            <th className='border-b border-[#c8d9df] px-3 py-2 font-bold'>
                              Nómina Mensual Estimada
                            </th>
                            <th className='border-b border-[#c8d9df] px-3 py-2 font-bold'>
                              Escenario leve (1%)
                            </th>
                            <th className='border-b border-[#c8d9df] px-3 py-2 font-bold'>
                              Escenario moderado (3%)
                            </th>
                            <th className='border-b border-[#c8d9df] px-3 py-2 font-bold'>
                              Escenario severo (5%)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {recoveryRows.map((row) => (
                            <tr
                              key={row.volume}
                              className='odd:bg-white even:bg-[#f7fafb]'
                            >
                              <td className='border-b border-[#e5eaec] px-3 py-2 font-medium'>
                                {row.volume}
                              </td>
                              <td className='border-b border-[#e5eaec] px-3 py-2 tabular-nums'>
                                {row.payroll}
                              </td>
                              <td className='border-b border-[#e5eaec] px-3 py-2 tabular-nums'>
                                {row.leak1}
                              </td>
                              <td className='border-b border-[#e5eaec] px-3 py-2 tabular-nums'>
                                {row.leak3}
                              </td>
                              <td className='border-b border-[#e5eaec] px-3 py-2 tabular-nums font-semibold text-[#062534]'>
                                {row.leak5}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className='mt-3 text-xs text-[#1b4a66]'>
                      <span className='font-semibold not-italic text-[#062534]'>
                        Referencia KRONET:
                      </span>{' '}
                      la plataforma está orientada a acercar a su organización
                      al escenario equivalente a la columna del 5%, mediante el
                      control del fraude en asistencia y la reducción de errores
                      manuales en el proceso.
                    </p>
                  </section>

                  {/* 2. Tabla inversión */}
                  <section>
                    <div className='mb-3 flex items-start gap-3'>
                      <span className='flex h-8 w-8 shrink-0 items-center justify-center bg-[#eab308] text-sm font-bold text-[#062534]'>
                        2
                      </span>
                      <div>
                        <h3 className='text-base font-bold text-[#062534]'>
                          Inversión mensual por licenciamiento (por volumen)
                        </h3>
                        <p className='mt-1'>
                          Los planes se definen por nivel de operación. La
                          columna de retorno potencial relaciona cada nivel con
                          el escenario del 5% de la tabla anterior, como marco
                          de comparación; no constituye una garantía de
                          resultado.
                        </p>
                      </div>
                    </div>
                    <p className='mb-3 text-xs font-semibold uppercase tracking-wide text-[#167999]'>
                      Licenciamiento mensual de la plataforma KRONET
                    </p>
                    <div className='overflow-x-auto rounded border border-[#c8d9df] print:!overflow-visible'>
                      <table className='w-full min-w-[560px] border-collapse text-left text-xs sm:text-sm'>
                        <thead>
                          <tr className='bg-[#062534] text-white'>
                            <th className='px-3 py-2 font-bold'>
                              Nivel de Operación
                            </th>
                            <th className='px-3 py-2 font-bold'>
                              Capacidad de Plataforma
                            </th>
                            <th className='px-3 py-2 font-bold'>
                              Inversión Mensual
                            </th>
                            <th className='px-3 py-2 font-bold'>
                              Referencia de retorno (5%)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {investmentRows.map((row) => (
                            <tr
                              key={row.level}
                              className='odd:bg-white even:bg-[#f7fafb]'
                            >
                              <td className='border-b border-[#e5eaec] px-3 py-2 font-semibold text-[#062534]'>
                                {row.level}
                              </td>
                              <td className='border-b border-[#e5eaec] px-3 py-2'>
                                {row.capacity}
                              </td>
                              <td className='border-b border-[#e5eaec] px-3 py-2 tabular-nums font-medium'>
                                {row.monthly}
                              </td>
                              <td className='border-b border-[#e5eaec] px-3 py-2 tabular-nums font-semibold text-[#167999]'>
                                {row.potential}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* 3. Setup */}
                  <section>
                    <div className='mb-3 flex items-start gap-3'>
                      <span className='flex h-8 w-8 shrink-0 items-center justify-center bg-[#167999] text-sm font-bold text-white'>
                        3
                      </span>
                      <div>
                        <h3 className='text-base font-bold text-[#062534]'>
                          Puesta en marcha e infraestructura en sitio
                        </h3>
                        <p className='mt-1'>
                          El modelo combina la plataforma en la nube con
                          dispositivos de captura en sus instalaciones, para
                          asegurar trazabilidad, control de asistencia y
                          arranque operativo acorde a sus políticas de
                          seguridad.
                        </p>
                      </div>
                    </div>
                    <div className='space-y-4 border-l-2 border-[#167999]/40 pl-4'>
                      <div>
                        <p className='font-bold text-[#062534]'>
                          Requisitos de arranque
                        </p>
                        <p>
                          Para un control robusto de asistencia, el esquema
                          incluye lectores o terminales biométricas ubicados en
                          sus instalaciones, adquiridos por su organización y
                          acordados en el dimensionamiento del proyecto.
                        </p>
                      </div>
                      <div>
                        <p className='font-bold text-[#062534]'>Equipamiento</p>
                        <p>
                          Inversión única correspondiente al paquete de lectores
                          o terminales definido para sus sedes y reglas de
                          registro.
                        </p>
                      </div>
                      <div>
                        <p className='font-bold text-[#062534]'>
                          Activación del servicio
                        </p>
                        <p>
                          Incluye el primer periodo de licenciamiento de la
                          plataforma, de acuerdo con el nivel de operación
                          contratado.
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              </details>
            </div>
          </div>

          <footer className='border-t border-[#c8d9df] bg-[#f7fafb] px-6 py-4 text-center text-[0.65rem] text-[#1b4a66] sm:px-10 print:bg-white'>
            KRONET · Control operativo y optimización de nómina · Documento
            confidencial para uso del destinatario
          </footer>
        </div>
      </article>
    </div>
  );
}
