'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PinInput from './PinInput';

interface PinPadOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (cardNumber: string) => Promise<void>;
  isLoading: boolean;
  error?: string;
  initialDigit?: string;
}

export default function PinPadOverlay({
  isVisible,
  onClose,
  onSubmit,
  isLoading,
  error,
  initialDigit = '',
}: PinPadOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Handle escape key press
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose]);

  // Handle click outside to close
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === overlayRef.current) {
      onClose();
    }
  };

  // Handle PIN submission
  const handlePinSubmit = async (pin: string) => {
    try {
      await onSubmit(pin);
    } catch (error) {
      console.error('PIN submission error:', error);
      // Error handling is managed by the parent component
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={overlayRef}
          className='fixed inset-0 z-50 flex items-center justify-center'
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          onClick={handleOverlayClick}
        >
          {/* Main overlay content */}
          <motion.div
            className='relative max-w-md w-full mx-4'
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Neon glow background */}
            <motion.div
              className='absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 blur-xl'
              animate={{
                scale: [1, 1.02, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              }}
            />

            {/* Main content container */}
            <div
              className='relative bg-zinc-900/95 backdrop-blur-sm border-2 border-cyan-500/50 rounded-2xl p-8 shadow-2xl'
              style={{
                boxShadow: '0 0 40px rgba(34, 211, 238, 0.3)',
              }}
            >
              {/* Header */}
              <div className='text-center mb-6'>
                <motion.h2
                  className='text-2xl font-bold text-cyan-400 mb-2'
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  Acceso con Tarjeta
                </motion.h2>
                <motion.p
                  className='text-lg text-zinc-300'
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  {isLoading
                    ? 'Verificando...'
                    : 'Presiona Enter para confirmar'}
                </motion.p>
              </div>

              {/* PIN Input Component */}
              <div className='mb-6'>
                <PinInput
                  isVisible={isVisible}
                  onSubmit={handlePinSubmit}
                  onCancel={onClose}
                  isLoading={isLoading}
                  maxLength={8}
                  initialValue={initialDigit}
                />
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    className='mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg'
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className='text-red-400 text-sm text-center font-medium'>
                      {error}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Instructions */}
              <motion.div
                className='text-center text-sm text-zinc-400'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <p className='mb-1'>
                  <span className='text-cyan-400'>Enter</span> para confirmar •{' '}
                  <span className='text-cyan-400'>Esc</span> para cancelar
                </p>
                <p className='text-xs'>Haz clic fuera del cuadro para cerrar</p>
              </motion.div>
            </div>

            {/* Outer glow ring */}
            <motion.div
              className='absolute inset-0 rounded-2xl border border-cyan-500/20 pointer-events-none'
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
