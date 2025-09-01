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
    <div className='w-full h-full flex flex-col bg-zinc-900 rounded-lg border-2 border-orange-800/40 p-3 sm:p-4'>
      <div className='relative flex-1 flex items-center justify-center'>
        {/* Contenedor con relación 9:16 que se adapta al alto disponible */}
        <div
          className='relative h-full max-h-full w-auto max-w-full overflow-hidden rounded-md bg-black'
          style={{ aspectRatio: '9 / 16' }}
        >
          {active.type === 'image' ? (
            <img
              src={active.src}
              alt={active.alt ?? 'Publicidad'}
              className='h-full w-full object-cover'
              draggable={false}
            />
          ) : (
            <video
              key={active.src}
              className='h-full w-full object-cover'
              src={active.src}
              autoPlay
              muted
              loop={!rotate}
              controls={false}
              playsInline
            />
          )}

          {/* Fade overlay + Indicators overlay */}
          <div className='pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20' />

          {showIndicators && slides.length > 1 && (
            <div className='absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1'>
              {slides.map((_, i) => (
                <button
                  key={`dot-${i}`}
                  aria-label={`Mostrar anuncio ${i + 1}`}
                  onClick={() => goTo(i)}
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${
                    i === currentIndex ? 'bg-zinc-200' : 'bg-zinc-600'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdvertisingPanel;
