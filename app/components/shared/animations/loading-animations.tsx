"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8",
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
      className={cn("inline-block", className)}
    >
      <Loader2 className={sizeClasses[size]} />
    </motion.div>
  );
}

interface PulsingDotsProps {
  className?: string;
}

export function PulsingDots({ className }: PulsingDotsProps) {
  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-2 h-2 bg-primary rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function AnimatedSkeleton({ className, lines = 1 }: SkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <motion.div
          key={index}
          className="h-4 bg-muted rounded"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  className?: string;
}

export function LoadingOverlay({ 
  isVisible, 
  message = "Cargando...", 
  className 
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50",
        className
      )}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="flex flex-col items-center space-y-4 p-6 bg-card rounded-lg shadow-lg border"
      >
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </motion.div>
    </motion.div>
  );
}

interface ProgressBarProps {
  progress: number;
  className?: string;
  animated?: boolean;
}

export function AnimatedProgressBar({ 
  progress, 
  className, 
  animated = true 
}: ProgressBarProps) {
  return (
    <div className={cn("w-full bg-muted rounded-full h-2", className)}>
      <motion.div
        className="bg-primary h-2 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        transition={{
          duration: animated ? 0.5 : 0,
          ease: "easeOut",
        }}
      />
    </div>
  );
}