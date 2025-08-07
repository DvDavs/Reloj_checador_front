'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface PinInputProps {
  isVisible: boolean;
  onSubmit: (pin: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  maxLength?: number;
  initialValue?: string;
}

export default function PinInput({
  isVisible,
  onSubmit,
  onCancel,
  isLoading = false,
  maxLength = 8,
  initialValue = '',
}: PinInputProps) {
  const [pin, setPin] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cursor blinking effect
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 800);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Handle inactivity timeout
  useEffect(() => {
    if (!isVisible) return;

    const resetInactivityTimer = () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }

      inactivityTimeoutRef.current = setTimeout(() => {
        onCancel();
      }, 10000); // 10 seconds of inactivity
    };

    resetInactivityTimer();

    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, [pin, isVisible, onCancel]);

  // Handle keyboard input
  useEffect(() => {
    if (!isVisible || isLoading) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();

      if (event.key === 'Enter') {
        if (pin.length > 0) {
          onSubmit(pin);
        }
        return;
      }

      if (event.key === 'Escape') {
        onCancel();
        return;
      }

      if (event.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
        return;
      }

      // Only allow numeric input
      if (/^\d$/.test(event.key) && pin.length < maxLength) {
        setPin((prev) => prev + event.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, pin, maxLength, onSubmit, onCancel, isLoading]);

  // Reset pin when component becomes visible
  useEffect(() => {
    if (isVisible) {
      setPin(initialValue);
    }
  }, [isVisible, initialValue]);

  if (!isVisible) return null;

  const displayText = `>${pin}${showCursor && !isLoading ? '_' : ''}`;

  return (
    <div className='flex flex-col items-center justify-center h-full'>
      {/* PIN Input Display - replacing the fingerprint scanner area */}
      <div className='relative mb-6 flex h-64 w-64 items-center justify-center'>
        {/* Background glow effect */}
        <motion.div
          className='absolute h-56 w-56 rounded-full bg-cyan-500/10'
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          }}
        />

        {/* Main PIN display */}
        <motion.div
          className='relative z-10 flex items-center justify-center'
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className='bg-zinc-900/80 backdrop-blur-sm border-2 border-cyan-500/50 rounded-2xl px-8 py-6 min-w-[280px]'>
            <div className='text-center'>
              <div
                className='text-4xl font-mono tracking-wider text-cyan-400 min-h-[3rem] flex items-center justify-center'
                style={{ fontFamily: 'monospace' }}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                    className='text-cyan-400'
                  >
                    Procesando...
                  </motion.div>
                ) : (
                  displayText
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Neon glow effect around the input */}
        <motion.div
          className='absolute h-72 w-72 rounded-full border border-cyan-500/20'
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Instructions - matching the existing instruction message area */}
      <div className='h-12 flex items-center justify-center'>
        <div className='text-center text-xl font-medium text-zinc-300 flex items-center gap-2'>
          {isLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'linear',
                }}
                className='h-5 w-5 border-2 border-cyan-400 border-t-transparent rounded-full'
              />
              Verificando número...
            </>
          ) : (
            <>
              <span className='text-cyan-400'>⌨</span>
              Ingrese su número de tarjeta
            </>
          )}
        </div>
      </div>
    </div>
  );
}
