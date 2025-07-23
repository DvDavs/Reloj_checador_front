"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const CompletionStep = () => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/horarios/asignados');
    }, 5000); // 5 segundos

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center text-center">
        <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
                delay: 0.2,
            }}
        >
            <CheckCircle2 className="w-24 h-24 text-green-500" />
        </motion.div>
        <motion.h2 
            className="mt-6 text-2xl font-bold"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
        >
            ¡Asignación Completada!
        </motion.h2>
        <motion.p 
            className="mt-2 text-muted-foreground"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
        >
            El horario ha sido asignado correctamente.
        </motion.p>
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8"
        >
            <Button onClick={() => router.push('/horarios/asignados')}>
                Ir a la Lista de Horarios
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
                Serás redirigido en unos segundos...
            </p>
        </motion.div>
    </div>
  );
}; 