'use client';

import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { ScannerPanelProps } from './interfaces';
import PinInput from '../PinInput';
import { getStyleClassesForCode } from '../../lib/timeClockUtils';
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

  // Memoize resolved icon state calculation
  const resolvedIconState: 'success' | 'failed' | null = useMemo(() => {
    if (statusCode) {
      if (statusCode === 'FR') return 'failed';
      if (/^[45]/.test(statusCode)) return 'failed';
      if (/^[23]/.test(statusCode)) return 'success';
    }
    if (panelFlash === 'success' || scanState === 'success') return 'success';
    if (panelFlash === 'failed' || scanState === 'failed') return 'failed';
    return null;
  }, [panelFlash, scanState, statusCode]);

  // Memoize PIN input start handler to prevent unnecessary re-renders
  const handleStartPinInput = useCallback(() => {
    onStartPinInput();
  }, [onStartPinInput]);

  return (
    <div
      className={`relative flex flex-col items-center rounded-lg p-6 border-2 transition-colors duration-300 ${getPanelColor}`}
    >
      {/* Contenedor para el escáner */}
      <div className='flex flex-col items-center justify-center flex-1'>
        {/* Overlay de mensaje grande en la parte superior, como en la vista original */}
        <div
          className='absolute top-0 left-0 right-0 flex items-center justify-center z-10 pointer-events-none'
          style={{ height: '320px' }}
          aria-live='polite'
        >
          <div
            className={`text-5xl md:text-6xl font-bold transition-opacity duration-300 text-center px-4 max-w-4xl ${overlayTextClass} ${
              resolvedIconState === 'success'
                ? 'drop-shadow-[0_0_30px_rgba(74,222,128,0.9)]'
                : resolvedIconState === 'failed'
                  ? 'drop-shadow-[0_0_30px_rgba(248,113,113,0.9)]'
                  : ''
            }`}
            style={{
              opacity: showOverlayMessage ? 0.98 : 0,
              lineHeight: '1.1',
            }}
          >
            {overlayMessage}
          </div>
        </div>

        {/* Scanner area or PIN input */}
        <div
          className={`relative mb-8 flex h-64 w-64 items-center justify-center flex-shrink-0 ${scanState === 'scanning' ? 'scanning' : ''}`}
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
              {/* SVG de huella base con múltiples crestas */}
              <svg
                className='absolute h-56 w-56'
                viewBox='0 0 100 100'
                xmlns='http://www.w3.org/2000/svg'
              >
                <g
                  className='fingerprint-base'
                  stroke={
                    scanState === 'success'
                      ? 'rgba(34, 197, 94, 0.3)'
                      : scanState === 'failed'
                        ? 'rgba(239, 68, 68, 0.3)'
                        : 'rgba(59, 130, 246, 0.3)'
                  }
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

              {/* Estado Idle o Ready - círculo pulsante con icono de huella */}
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
                    className='absolute'
                    animate={{
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: 'easeInOut',
                    }}
                  >
                    <Fingerprint className='h-36 w-36 text-blue-500/80' />
                  </motion.div>
                </>
              )}

              {/* Animación de preparación para el siguiente escaneo */}
              {preparingNextScan && (
                <>
                  <motion.div
                    className='absolute h-68 w-68 rounded-full border-2 border-blue-500/50'
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                      scale: [0.8, 1.2, 1],
                      opacity: [0, 0.8, 0],
                    }}
                    transition={{
                      duration: 1.2,
                      times: [0, 0.5, 1],
                      ease: 'easeInOut',
                    }}
                  />
                </>
              )}

              {scanState === 'scanning' && (
                <>
                  {/* Crestas de huella siendo llenadas */}
                  <svg
                    className='absolute h-56 w-56'
                    viewBox='0 0 100 100'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <g
                      className='fingerprint-scan'
                      stroke='rgba(59, 130, 246, 0.8)'
                      fill='none'
                      strokeWidth='2.5'
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

                  {/* Efecto de barrido mejorado */}
                  <motion.div
                    className='absolute h-1.5 rounded-full bg-blue-500/70'
                    style={{ width: '80%' }}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{
                      y: [-40, 40],
                      opacity: [0.2, 0.8, 0.2],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: 'reverse',
                    }}
                  />

                  {/* Efecto de brillo adicional */}
                  <motion.div
                    className='absolute h-56 w-56 rounded-full bg-blue-500/5'
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: 'reverse',
                    }}
                  />

                  <div className='absolute -bottom-12 text-center'>
                    <p className='text-blue-400 text-sm'>
                      Escaneando huella digital...
                    </p>
                  </div>
                </>
              )}

              {/* Estado de éxito - animación de marca de verificación verde */}
              {resolvedIconState === 'success' && (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 15,
                      duration: 0.2,
                    }}
                  >
                    <CheckCircle
                      className={`h-32 w-32 ${statusCode ? getStyleClassesForCode(statusCode).icon : 'text-green-500'}`}
                    />
                  </motion.div>
                  <motion.div
                    className='absolute h-68 w-68 rounded-full'
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                      scale: [0.8, 1.2],
                      opacity: [0, 0.5],
                    }}
                    transition={{
                      duration: 0.5,
                      ease: 'easeOut',
                    }}
                    style={{
                      background: `radial-gradient(circle, ${statusCode && statusCode.startsWith('2') ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.2)'} 0%, transparent 70%)`,
                    }}
                  />
                </>
              )}

              {/* Estado de fallo - animación de X roja */}
              {resolvedIconState === 'failed' && (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 15,
                      duration: 0.2,
                    }}
                  >
                    <XCircle
                      className={`h-32 w-32 ${statusCode ? getStyleClassesForCode(statusCode).icon : 'text-red-500'}`}
                    />
                  </motion.div>
                  <motion.div
                    className='absolute h-68 w-68 rounded-full'
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                      scale: [0.8, 1.2],
                      opacity: [0, 0.5],
                    }}
                    transition={{
                      duration: 0.5,
                      ease: 'easeOut',
                    }}
                    style={{
                      background: `radial-gradient(circle, ${statusCode && statusCode.startsWith('4') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.2)'} 0%, transparent 70%)`,
                    }}
                  />
                </>
              )}
            </>
          )}
        </div>

        {/* Mensaje de instrucción - SIEMPRE VISIBLE CON ALTURA FIJA */}
        <div className='h-12 flex items-center justify-center'>
          {showInstructionMessage && (
            <p className='text-center text-lg font-medium text-zinc-300 flex items-center gap-2'>
              {(scanState === 'idle' || scanState === 'ready') && (
                <>
                  <Fingerprint className='h-5 w-5 text-blue-400 animate-pulse' />
                  Coloque su dedo en el escáner
                </>
              )}
              {scanState === 'scanning' && (
                <>
                  <Loader2 className='h-5 w-5 text-blue-400 animate-spin' />
                  Escaneando huella...
                </>
              )}
              {scanState === 'success' && (
                <>
                  <CheckCircle className='h-5 w-5 text-green-400' />
                  Verificación exitosa
                </>
              )}
              {scanState === 'failed' && (
                <>
                  <XCircle className='h-5 w-5 text-red-400' />
                  Huella no reconocida
                </>
              )}
            </p>
          )}
        </div>

        {/* Optional: start PIN entry helper button when not in PIN mode */}
        {!pinInputMode && (
          <button
            type='button'
            onClick={handleStartPinInput}
            className='mt-2 text-xs text-zinc-400 hover:text-zinc-200 underline'
            aria-label='Usar PIN'
          >
            Usar PIN
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
