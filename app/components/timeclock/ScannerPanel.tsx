'use client';

import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, CheckCircle, XCircle } from 'lucide-react';
import type { ScannerPanelProps } from './interfaces';
import PinInput from '../PinInput';
import { getStyleClassesForCode, getScanColor } from '../../lib/timeClockUtils';
import { scannerPanelPropsAreEqual } from './utils/memoComparisons';

function getResultMessage(
  scanState: ScannerPanelProps['scanState'],
  customMessage?: string | null
): string {
  if (customMessage) return customMessage;
  switch (scanState) {
    case 'success':
      return 'Verificación exitosa';
    case 'failed':
      return 'Huella no reconocida';
    default:
      return '';
  }
}

function getResultMessageColor(
  scanState: ScannerPanelProps['scanState'],
  statusCode?: string | null
): string {
  if (statusCode) {
    try {
      return getStyleClassesForCode(statusCode).text;
    } catch {
      // fallback
    }
  }
  if (scanState === 'success') return 'text-green-400';
  if (scanState === 'failed') return 'text-red-400';
  return 'text-transparent';
}

function ScannerPanelComponent({
  scanState,
  statusCode,
  customMessage,
  panelFlash,
  showInstructionMessage = true,
  pinInputMode,
  pinInputLoading,
  initialPinDigit,
  preparingNextScan,
  onStartPinInput,
  onSubmitPin,
  onCancelPin,
}: ScannerPanelProps) {
  // Memoize panel color calculation to avoid recalculation on every render
  const getPanelColor = useMemo(() => {
    if (statusCode) {
      try {
        const styles = getStyleClassesForCode(statusCode);
        return styles.panel;
      } catch {
        // fallback
      }
    }

    // Si no hay código de estado, usar los colores basados en el estado de panelFlash
    if (panelFlash === 'success') {
      return 'bg-green-900/50 border-green-500';
    }
    if (panelFlash === 'failed') {
      return 'bg-red-900/50 border-red-500';
    }
    return 'bg-zinc-900 border-zinc-800';
  }, [panelFlash, statusCode]);

  // Mensaje grande tipo overlay (como en la vista original)
  const overlayMessage = useMemo(() => {
    if (pinInputMode) return '';
    return getResultMessage(scanState, customMessage);
  }, [pinInputMode, customMessage, scanState]);

  // Mostrar overlay message cuando hay éxito o fallo
  const showOverlayMessage = useMemo(() => {
    return !pinInputMode && (scanState === 'success' || scanState === 'failed');
  }, [pinInputMode, scanState]);

  // Memoize text class calculation
  const overlayTextClass = useMemo(() => {
    return getResultMessageColor(scanState, statusCode);
  }, [scanState, statusCode]);

  // Memoize resolved icon state calculation - Basado en scanState que ya viene correcto del TimeClock
  const resolvedIconState: 'success' | 'failed' | null = useMemo(() => {
    // El scanState ya viene correctamente determinado desde TimeClock
    // Solo necesitamos mapear scanState a resolvedIconState
    if (scanState === 'success') return 'success';
    if (scanState === 'failed') return 'failed';

    // Para panelFlash (efectos visuales temporales)
    if (panelFlash === 'success') return 'success';
    if (panelFlash === 'failed') return 'failed';

    return null;
  }, [panelFlash, scanState]);

  // Color base (green/red/blue/yellow) según código/estado
  const baseColor = useMemo(() => {
    return getScanColor(scanState, statusCode ?? undefined);
  }, [scanState, statusCode]);

  // Resplandor del ícono (check/X) según el color base
  const iconGlowClass = useMemo(() => {
    switch (baseColor) {
      case 'green':
        return 'drop-shadow-[0_0_40px_rgba(34,197,94,0.85)]';
      case 'red':
        return 'drop-shadow-[0_0_40px_rgba(248,113,113,0.85)]';
      case 'yellow':
        return 'drop-shadow-[0_0_40px_rgba(234,179,8,0.85)]';
      default:
        return 'drop-shadow-[0_0_40px_rgba(59,130,246,0.85)]'; // blue
    }
  }, [baseColor]);

  // Variantes de halo por color (clases fijas para evitar purge de Tailwind)
  const haloVariant = useMemo(() => {
    const variants = {
      green: {
        ring: 'ring-green-500/25',
        bg: 'bg-green-500/10',
        border: 'border-green-500/30',
        shadow: '0 0 60px rgba(34,197,94,0.35)',
      },
      blue: {
        ring: 'ring-blue-500/25',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        shadow: '0 0 60px rgba(59,130,246,0.35)',
      },
      red: {
        ring: 'ring-red-500/25',
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        shadow: '0 0 60px rgba(248,113,113,0.35)',
      },
      yellow: {
        ring: 'ring-yellow-500/25',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        shadow: '0 0 60px rgba(234,179,8,0.35)',
      },
    } as const;
    return variants[baseColor as keyof typeof variants] || variants.blue;
  }, [baseColor]);

  // Mensaje corto, genérico y descriptivo debajo del ícono
  const genericDescriptionMessage = useMemo(() => {
    if (resolvedIconState === 'success') return 'Registro guardado';
    if (resolvedIconState === 'failed') return 'Intente nuevamente';
    return '';
  }, [resolvedIconState]);

  // Memoize PIN input start handler to prevent unnecessary re-renders
  const handleStartPinInput = useCallback(() => {
    onStartPinInput();
  }, [onStartPinInput]);

  return (
    <div
      className={`relative rounded-lg border-2 transition-colors duration-300 h-full flex flex-col ${getPanelColor}`}
    >
      {/* NORTH - Mensaje principal - Aumentar tamaño */}
      <div className='h-28 flex items-center justify-center px-4'>
        {showOverlayMessage && (
          <div
            className={`text-2xl md:text-3xl lg:text-4xl font-bold text-center ${overlayTextClass} ${
              resolvedIconState === 'success'
                ? 'drop-shadow-[0_0_30px_rgba(74,222,128,0.9)]'
                : resolvedIconState === 'failed'
                  ? 'drop-shadow-[0_0_30px_rgba(248,113,113,0.9)]'
                  : ''
            }`}
            style={{ lineHeight: '1.1' }}
          >
            {overlayMessage}
          </div>
        )}
      </div>

      {/* CENTER - Scanner (área principal) - Reducido ligeramente */}
      <div className='flex-[0.8] flex items-center justify-center p-4'>
        <div
          className='relative flex h-56 w-56 items-center justify-center'
          data-testid='scanner-area'
        >
          {pinInputMode ? (
            <PinInput
              isVisible={true}
              onSubmit={onSubmitPin}
              onCancel={onCancelPin}
              isLoading={!!pinInputLoading}
              initialValue={initialPinDigit || ''}
            />
          ) : (
            <>
              {/* SVG de huella base */}
              {!resolvedIconState && (
                <svg
                  className='absolute h-56 w-56'
                  viewBox='0 0 100 100'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <g
                    className='fingerprint-base'
                    stroke='rgba(59, 130, 246, 0.3)'
                    fill='none'
                    strokeWidth='2'
                  >
                    <path d='M50,15 C25,15 15,30 15,50 C15,70 25,85 50,85 C75,85 85,70 85,50 C85,30 75,15 50,15 Z' />
                    <path d='M50,20 C30,20 20,35 20,50 C20,65 30,80 50,80 C70,80 80,65 80,50 C80,35 70,20 50,20 Z' />
                    <path d='M50,25 C35,25 25,35 25,50 C25,65 35,75 50,75 C65,75 75,65 75,50 C75,35 65,25 50,25 Z' />
                    <path d='M50,30 C37,30 30,40 30,50 C30,60 37,70 50,70 C63,70 70,60 70,50 C70,40 63,30 50,30 Z' />
                    <path d='M50,35 C40,35 35,42 35,50 C35,58 40,65 50,65 C60,65 65,58 65,50 C65,42 60,35 50,35 Z' />
                    <path d='M50,40 C42,40 40,45 40,50 C40,55 42,60 50,60 C58,60 60,55 60,50 C60,45 58,40 50,40 Z' />
                    <path d='M50,45 C45,45 45,47 45,50 C45,53 45,55 50,55 C55,55 55,53 55,50 C55,47 55,45 50,45 Z' />
                  </g>
                </svg>
              )}

              {/* Estado Idle o Ready */}
              {(scanState === 'idle' || scanState === 'ready') && (
                <>
                  <motion.div
                    className='absolute h-56 w-56 rounded-full bg-blue-500/10'
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.7, 0.5, 0.7],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: 'easeInOut',
                    }}
                  />
                  <motion.div
                    className='absolute inset-0 flex items-center justify-center'
                    animate={{
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: 'easeInOut',
                    }}
                  >
                    <Fingerprint className='h-32 w-32 text-blue-500/80' />
                  </motion.div>
                </>
              )}

              {/* Estado de éxito */}
              {resolvedIconState === 'success' && (
                <motion.div
                  className='absolute inset-0 flex flex-col items-center justify-center'
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 15,
                    duration: 0.2,
                  }}
                >
                  {/* Halo circular centrado */}
                  <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                    <div className='relative h-56 w-56'>
                      <div
                        className={`absolute inset-0 rounded-full ring-8 ${haloVariant.ring} ${haloVariant.bg} ${haloVariant.border}`}
                      />
                      <motion.div
                        className='absolute inset-0 rounded-full'
                        animate={{
                          scale: [1, 1.06, 1],
                          opacity: [0.6, 0.25, 0.6],
                        }}
                        transition={{
                          duration: 1.4,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: 'easeInOut',
                        }}
                        style={{ boxShadow: haloVariant.shadow }}
                      />
                      <div
                        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full border-2 ${haloVariant.border}`}
                      />
                    </div>
                  </div>
                  <CheckCircle
                    className={`z-10 h-32 w-32 ${statusCode ? getStyleClassesForCode(statusCode).icon : 'text-green-500'} ${iconGlowClass}`}
                  />
                </motion.div>
              )}

              {/* Estado de fallo */}
              {resolvedIconState === 'failed' && (
                <motion.div
                  className='absolute inset-0 flex flex-col items-center justify-center'
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 15,
                    duration: 0.2,
                  }}
                >
                  {/* Halo circular centrado */}
                  <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                    <div className='relative h-56 w-56'>
                      <div
                        className={`absolute inset-0 rounded-full ring-8 ${haloVariant.ring} ${haloVariant.bg} ${haloVariant.border}`}
                      />
                      <motion.div
                        className='absolute inset-0 rounded-full'
                        animate={{
                          scale: [1, 1.06, 1],
                          opacity: [0.6, 0.25, 0.6],
                        }}
                        transition={{
                          duration: 1.4,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: 'easeInOut',
                        }}
                        style={{ boxShadow: haloVariant.shadow }}
                      />
                      <div
                        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full border-2 ${haloVariant.border}`}
                      />
                    </div>
                  </div>
                  <XCircle
                    className={`z-10 h-32 w-32 ${statusCode ? getStyleClassesForCode(statusCode).icon : 'text-red-500'} ${iconGlowClass}`}
                  />
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>

      {/* SOUTH - Instrucciones y botones - Aumentar tamaño */}
      <div className='h-32 flex flex-col items-center justify-center gap-2 px-4'>
        {/* Mensaje de instrucción - Solo cuando no hay resultado */}
        {showInstructionMessage && !showOverlayMessage && (
          <p className='text-center text-xl font-semibold text-zinc-200 flex items-center gap-3'>
            {(scanState === 'idle' || scanState === 'ready') && (
              <>
                <Fingerprint className='h-6 w-6 text-blue-400 animate-pulse' />
                Coloque su dedo en el escáner
              </>
            )}
          </p>
        )}

        {/* Mensaje descriptivo (resultado) en el cuadrante inferior */}
        {genericDescriptionMessage && (
          <p
            className={`text-center text-xl md:text-2xl leading-snug font-semibold ${overlayTextClass}`}
          >
            {genericDescriptionMessage}
          </p>
        )}

        {/* Botón "Usar No. Tarjeta" */}
        {!pinInputMode &&
          (scanState === 'idle' ||
            scanState === 'ready' ||
            (scanState === 'failed' && !customMessage)) && (
            <button
              type='button'
              onClick={handleStartPinInput}
              className='px-6 py-3 text-base text-zinc-300 hover:text-white  border-zinc-700 hover:border-zinc-600 transition-colors font-medium'
              aria-label='Usar No. Tarjeta'
            >
              Usar No. Tarjeta
            </button>
          )}
      </div>
    </div>
  );
}

// Attendance details helpers removed; now handled in AttendanceDetails component

export const ScannerPanel = React.memo(
  ScannerPanelComponent,
  scannerPanelPropsAreEqual
);
