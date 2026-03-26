'use client';

import React, { useEffect, useMemo, useState } from 'react';

export type AdvertisingItem = {
  type: 'image' | 'video';
  src: string;
  alt?: string;
  durationMs?: number;
};

export interface AdvertisingPanelProps {
  items?: AdvertisingItem[];
  rotate?: boolean;
  defaultDurationMs?: number;
  showIndicators?: boolean;
}

export function AdvertisingPanel({
  items,
  rotate = true,
  defaultDurationMs = 12000,
  showIndicators = true,
}: AdvertisingPanelProps) {
  const [remoteItems, setRemoteItems] = useState<AdvertisingItem[]>([]);
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const r = await fetch('/api/ads', { cache: 'no-store' });
        if (!r.ok) return;
        const json = await r.json();
        if (isMounted && Array.isArray(json?.items)) {
          setRemoteItems(json.items as AdvertisingItem[]);
        }
      } catch (_) {
        // Ignorar errores: usaremos fallback
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const fallbackItems: AdvertisingItem[] = useMemo(
    () => [
      {
        type: 'image',
        src: '/Logo_ITO.png',
        alt: 'Logo ITO',
        durationMs: 8000,
      },
      { type: 'image', src: '/placeholder-logo.png', alt: 'Publicidad 1' },
      { type: 'image', src: '/placeholder-logo.svg', alt: 'Publicidad 2' },
    ],
    []
  );

  const dynamicItems: AdvertisingItem[] = remoteItems ?? [];
  const slides: AdvertisingItem[] =
    items && items.length > 0
      ? items
      : dynamicItems.length > 0
        ? dynamicItems
        : fallbackItems;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!rotate || slides.length <= 1) return;
    const current = slides[currentIndex];
    const timeout = current.durationMs ?? defaultDurationMs;
    const t = setTimeout(
      () => {
        setCurrentIndex((i) => (i + 1) % slides.length);
      },
      Math.max(2000, timeout)
    );
    return () => clearTimeout(t);
  }, [currentIndex, rotate, slides, defaultDurationMs]);

  const goTo = (index: number) => setCurrentIndex(index % slides.length);

  const active = slides[currentIndex];

  return (
    <div className='w-full h-full relative flex items-center justify-center bg-zinc-900 rounded-lg border-2 border-orange-800/40 overflow-hidden'>
      {/* Fondo con blur de la imagen para rellenar el contenedor */}
      <div className='absolute inset-0 overflow-hidden'>
        {active.type === 'image' ? (
          <img
            src={active.src}
            alt=''
            className='w-full h-full object-cover scale-110 blur-2xl opacity-60'
            draggable={false}
            aria-hidden='true'
          />
        ) : (
          <video
            key={`bg-${active.src}`}
            className='w-full h-full object-cover scale-110 blur-2xl opacity-60'
            src={active.src}
            autoPlay
            muted
            loop={!rotate}
            controls={false}
            playsInline
            aria-hidden='true'
          />
        )}
      </div>

      {/* Contenido principal - object-contain preserva proporción */}
      <div className='relative z-10 w-full h-full flex items-center justify-center p-3'>
        {active.type === 'image' ? (
          <img
            src={active.src}
            alt={active.alt ?? 'Publicidad'}
            className='max-w-full max-h-full w-auto h-auto object-contain'
            draggable={false}
          />
        ) : (
          <video
            key={active.src}
            className='max-w-full max-h-full w-auto h-auto object-contain'
            src={active.src}
            autoPlay
            muted
            loop={!rotate}
            controls={false}
            playsInline
          />
        )}
      </div>

      {/* Fade overlay */}
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20 z-20' />

      {/* Indicadores de slide */}
      {showIndicators && slides.length > 1 && (
        <div className='absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 z-30'>
          {slides.map((_, i) => (
            <button
              key={`dot-${i}`}
              aria-label={`Mostrar anuncio ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${
                i === currentIndex
                  ? 'bg-zinc-200 scale-125'
                  : 'bg-zinc-600 hover:bg-zinc-500'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default AdvertisingPanel;
