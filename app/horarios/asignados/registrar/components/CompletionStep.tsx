"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompletionStepProps {
  title: string;
  message: string;
  primaryActionText: string;
  primaryActionLink: string;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const CompletionStep: React.FC<CompletionStepProps> = ({
  title,
  message,
  primaryActionText,
  primaryActionLink,
  secondaryActionText,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-4">
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
            {title}
        </motion.h2>
        <motion.p 
            className="mt-2 text-muted-foreground"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
        >
            {message}
        </motion.p>
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 flex flex-col sm:flex-row gap-4"
        >
            <Link href={primaryActionLink}>
                <Button>{primaryActionText}</Button>
            </Link>
            {onSecondaryAction && secondaryActionText && (
                 <Button variant="outline" onClick={onSecondaryAction}>
                    {secondaryActionText}
                </Button>
            )}
        </motion.div>
    </div>
  );
}; 