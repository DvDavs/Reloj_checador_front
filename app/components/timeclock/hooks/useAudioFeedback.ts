import { useEffect, useRef, useCallback } from 'react';
import type { ScanState } from '../../../lib/types/timeClockTypes';

export interface UseAudioFeedbackProps {
  soundEnabled: boolean;
  scanState: ScanState;
}

export function useAudioFeedback({
  soundEnabled,
  scanState,
}: UseAudioFeedbackProps) {
  const audioSuccess = useRef<HTMLAudioElement | null>(null);
  const audioError = useRef<HTMLAudioElement | null>(null);
  const audioScan = useRef<HTMLAudioElement | null>(null);

  // Inicializar elementos de audio con Web Audio API
  useEffect(() => {
    audioSuccess.current = new Audio(
      'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=='
    );
    audioError.current = new Audio(
      'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=='
    );
    audioScan.current = new Audio(
      'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=='
    );

    // Simular sonidos con oscilador
    if (typeof window !== 'undefined' && window.AudioContext) {
      try {
        const audioCtx = new AudioContext();

        // Sonido de éxito (beep agudo)
        const createSuccessSound = () => {
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();

          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(1800, audioCtx.currentTime);

          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioCtx.currentTime + 0.3
          );
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.3);
        };

        // Sonido de error (beep grave)
        const createErrorSound = () => {
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();

          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);

          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioCtx.currentTime + 0.3
          );
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.3);
        };

        // Sonido de escaneo (clic)
        const createScanSound = () => {
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();

          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);

          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          gainNode.gain.setValueAtTime(0.03, audioCtx.currentTime);

          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioCtx.currentTime + 0.1
          );
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.1);
        };

        // Crear funciones de reproducción personalizadas
        const customSuccessPlay = () => {
          try {
            createSuccessSound();
            return Promise.resolve();
          } catch (e) {
            console.warn('Error playing success sound:', e);
            return Promise.reject(e);
          }
        };

        const customErrorPlay = () => {
          try {
            createErrorSound();
            return Promise.resolve();
          } catch (e) {
            console.warn('Error playing error sound:', e);
            return Promise.reject(e);
          }
        };

        const customScanPlay = () => {
          try {
            createScanSound();
            return Promise.resolve();
          } catch (e) {
            console.warn('Error playing scan sound:', e);
            return Promise.reject(e);
          }
        };

        // Sobreescribir métodos de reproducción con nuestros sonidos personalizados
        if (audioSuccess.current) {
          audioSuccess.current.play = customSuccessPlay;
        }
        if (audioError.current) {
          audioError.current.play = customErrorPlay;
        }
        if (audioScan.current) {
          audioScan.current.play = customScanPlay;
        }
      } catch (e) {
        console.warn('AudioContext not supported or failed to initialize:', e);
      }
    }
  }, []);

  // Reproducir sonidos basados en el estado de escaneo
  useEffect(() => {
    if (!soundEnabled) return;

    // Solo reproducir sonidos si están habilitados
    if (scanState === 'scanning') {
      audioScan.current?.play().catch(() => {
        // Silently handle audio play failures
      });
    } else if (scanState === 'success') {
      audioSuccess.current?.play().catch(() => {
        // Silently handle audio play failures
      });
    } else if (scanState === 'failed') {
      audioError.current?.play().catch(() => {
        // Silently handle audio play failures
      });
    }
  }, [scanState, soundEnabled]);

  // Función para reproducir sonidos manualmente si es necesario
  const playSound = useCallback(
    (type: 'success' | 'error' | 'scan') => {
      if (!soundEnabled) return;

      switch (type) {
        case 'success':
          audioSuccess.current?.play().catch(() => {});
          break;
        case 'error':
          audioError.current?.play().catch(() => {});
          break;
        case 'scan':
          audioScan.current?.play().catch(() => {});
          break;
      }
    },
    [soundEnabled]
  );

  return { playSound };
}
