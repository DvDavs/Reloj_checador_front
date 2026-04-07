'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { KRONET_BRANDING } from '@/lib/branding';

export type AdvertisingItem = {
  type: 'image' | 'video';
  src: string;
  alt?: string;
  durationMs?: number;
  /** Aspect ratio calculado (width/height). 9:16 ≈ 0.5625 */
  aspectRatio?: number;
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
  const [imageDimensions, setImageDimensions] = useState<
    Record<string, { width: number; height: number }>
  >({});

  // Precargar dimensiones de imágenes
  const preloadImageDimensions = useCallback(
    (itemsToLoad: AdvertisingItem[]) => {
      itemsToLoad.forEach((item) => {
        if (item.type === 'image' && !imageDimensions[item.src]) {
          const img = new Image();
          img.onload = () => {
            setImageDimensions((prev) => ({
              ...prev,
              [item.src]: {
                width: img.naturalWidth,
                height: img.naturalHeight,
              },
            }));
          };
          img.src = item.src;
        }
      });
    },
    [imageDimensions]
  );

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        // Fetch list of active filenames from backend
        const response = await apiClient.get<string[]>('/api/publicidad');

        if (
          isMounted &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
          const newItems: AdvertisingItem[] = response.data.map((filename) => ({
            type: 'image',
            src: `${apiClient.defaults.baseURL}/api/publicidad/files/${filename}`,
            alt: filename,
            durationMs: 12000,
          }));
          setRemoteItems(newItems);
          preloadImageDimensions(newItems);
        }
      } catch (_) {
        // Fallback silently
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [preloadImageDimensions]);

  const fallbackItems: AdvertisingItem[] = useMemo(
    () => [
      {
        type: 'image',
        src: KRONET_BRANDING.isotipo.src,
        alt: 'Logo KRONET',
        durationMs: 8000,
        aspectRatio:
          KRONET_BRANDING.isotipo.width / KRONET_BRANDING.isotipo.height,
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

  // Detectar si la imagen activa tiene aspect ratio ~9:16 (tolerancia del 5%)
  const activeDimensions = imageDimensions[active.src];
  const activeAspectRatio = activeDimensions
    ? activeDimensions.width / activeDimensions.height
    : null;
  const targetRatio = 9 / 16; // 0.5625
  const tolerance = 0.05;
  const is916 =
    activeAspectRatio !== null &&
    Math.abs(activeAspectRatio - targetRatio) < tolerance;

  // Para imágenes 9:16: object-cover sin padding (llena todo)
  // Para otras: object-contain con padding (ajusta con márgenes)
  const imageClasses = is916
    ? 'w-full h-full object-cover'
    : 'max-w-full max-h-full w-auto h-auto object-contain';
  const containerPadding = is916 ? '' : 'p-3';

  return (
    <div className='w-full h-full relative flex items-center justify-center bg-app-dark rounded-lg border-2 border-app-brand-muted/40 overflow-hidden'>
      {/* Fondo con blur - solo visible cuando NO es 9:16 */}
      {!is916 && (
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
      )}

      {/* Contenido principal */}
      <div
        className={`relative z-10 w-full h-full flex items-center justify-center ${containerPadding}`}
      >
        {active.type === 'image' ? (
          <img
            src={active.src}
            alt={active.alt ?? 'Publicidad'}
            className={imageClasses}
            draggable={false}
          />
        ) : (
          <video
            key={active.src}
            className={imageClasses}
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
                  ? 'bg-app-light scale-125'
                  : 'bg-app-brand/50 hover:bg-app-brand-secondary/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default AdvertisingPanel;
