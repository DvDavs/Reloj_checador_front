'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint } from 'lucide-react';
import type { ScannerPanelProps } from './interfaces';
import PinInput from '../PinInput';

function getStatusBorderClasses(statusCode?: string | null): string {
  if (!statusCode) return 'border-zinc-800';
  if (statusCode.startsWith('2')) return 'border-emerald-500';
  if (statusCode.startsWith('3')) return 'border-sky-500';
  if (statusCode.startsWith('4')) return 'border-red-500';
  return 'border-zinc-800';
}

function getInstructionText(
  scanState: ScannerPanelProps['scanState'],
  pinMode: boolean,
  customMessage?: string | null
): string {
  if (pinMode) return 'Ingrese su número de tarjeta';
  if (customMessage) return customMessage;
  switch (scanState) {
    case 'ready':
      return 'Coloque su dedo en el lector';
    case 'scanning':
      return 'Escaneando...';
    case 'success':
      return 'Autenticación exitosa';
    case 'failed':
      return 'Huella no identificada';
    case 'idle':
    default:
      return 'Inicializando lector...';
  }
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
  onStartPinInput,
  onSubmitPin,
  onCancelPin,
}: ScannerPanelProps) {
  const borderClasses = useMemo(() => {
    if (panelFlash === 'success') return 'border-emerald-500';
    if (panelFlash === 'failed') return 'border-red-500';
    return getStatusBorderClasses(statusCode);
  }, [panelFlash, statusCode]);

  const ringColor = useMemo(() => {
    if (panelFlash === 'success') return 'bg-emerald-500/20';
    if (panelFlash === 'failed') return 'bg-red-500/20';
    if (scanState === 'scanning') return 'bg-cyan-500/25';
    if (scanState === 'ready') return 'bg-cyan-500/15';
    if (scanState === 'failed') return 'bg-red-500/15';
    if (scanState === 'success') return 'bg-emerald-500/15';
    return 'bg-zinc-700/20';
  }, [panelFlash, scanState]);

  const instruction = useMemo(
    () => getInstructionText(scanState, pinInputMode, customMessage),
    [scanState, pinInputMode, customMessage]
  );

  return (
    <div
      className={`flex flex-col items-center justify-center bg-zinc-900 rounded-lg p-6 border-2 ${borderClasses}`}
    >
      {/* Scanner area or PIN input */}
      <div className='relative mb-6 flex h-64 w-64 items-center justify-center'>
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
            <motion.div
              className={`absolute h-56 w-56 rounded-full ${ringColor}`}
              animate={{
                scale: scanState === 'scanning' ? [1, 1.08, 1] : [1, 1.03, 1],
                opacity: [0.35, 0.55, 0.35],
              }}
              transition={{
                duration: scanState === 'scanning' ? 1.2 : 2.2,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className='relative z-10 flex items-center justify-center rounded-full border border-zinc-700/50 bg-zinc-800/50 h-40 w-40'
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
            >
              <Fingerprint
                className={
                  'h-16 w-16 ' +
                  (scanState === 'failed'
                    ? 'text-red-400'
                    : scanState === 'success'
                      ? 'text-emerald-400'
                      : 'text-cyan-400')
                }
              />
            </motion.div>
            <motion.div
              className='absolute h-72 w-72 rounded-full border border-cyan-500/15'
              animate={{ scale: [1, 1.06, 1], opacity: [0.18, 0.33, 0.18] }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              }}
            />
          </>
        )}
      </div>

      {/* Instruction / status message */}
      {showInstructionMessage && (
        <div className='h-12 flex items-center justify-center'>
          <div
            className={
              'text-center text-xl font-medium flex items-center gap-2 ' +
              (panelFlash === 'success'
                ? 'text-emerald-300'
                : panelFlash === 'failed'
                  ? 'text-red-300'
                  : statusCode?.startsWith('2')
                    ? 'text-emerald-300'
                    : statusCode?.startsWith('3')
                      ? 'text-sky-300'
                      : statusCode?.startsWith('4')
                        ? 'text-red-300'
                        : scanState === 'ready' || scanState === 'scanning'
                          ? 'text-zinc-300'
                          : 'text-zinc-400')
            }
          >
            {instruction}
          </div>
        </div>
      )}

      {/* Optional: start PIN entry helper button when not in PIN mode */}
      {!pinInputMode && (
        <button
          type='button'
          onClick={() => onStartPinInput()}
          className='mt-2 text-xs text-zinc-400 hover:text-zinc-200 underline'
          aria-label='Usar PIN'
        >
          Usar PIN
        </button>
      )}
    </div>
  );
}

export const ScannerPanel = React.memo(ScannerPanelComponent);
