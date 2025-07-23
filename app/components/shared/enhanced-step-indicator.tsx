"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, 
  User, 
  Calendar, 
  Clock, 
  ClipboardList,
  AlertCircle,
  LucideIcon,
  Loader2
} from "lucide-react";

export interface EnhancedStepInfo {
  number: number;
  title: string;
  description?: string;
  isCompleted: boolean;
  isCurrent: boolean;
  icon?: LucideIcon;
  validationStatus?: 'valid' | 'invalid' | 'pending';
  isClickable?: boolean;
}

interface EnhancedStepIndicatorProps {
  steps: EnhancedStepInfo[];
  className?: string;
  onStepClick?: (stepNumber: number) => void;
}

export function EnhancedStepIndicator({ 
  steps, 
  className,
  onStepClick 
}: EnhancedStepIndicatorProps) {
  // Iconos predeterminados para cada paso si no se proporciona uno específico
  const defaultIcons: Record<number, LucideIcon> = {
    1: User,
    2: Clock,
    3: Calendar,
    4: ClipboardList
  };

  const getStatusColors = (step: EnhancedStepInfo) => {
    if (step.validationStatus === 'invalid') {
      return {
        border: "border-destructive",
        text: "text-destructive",
        bg: "bg-destructive/10"
      };
    }
    if (step.validationStatus === 'pending') {
      return {
        border: "border-amber-500",
        text: "text-amber-500", 
        bg: "bg-amber-500/10"
      };
    }
    if (step.isCompleted || step.isCurrent) {
      return {
        border: "border-primary",
        text: "text-primary",
        bg: "bg-primary/10"
      };
    }
    return {
      border: "border-gray-300",
      text: "text-gray-400",
      bg: "bg-transparent"
    };
  };

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-y-4 px-4", className)}>
      {steps.map((step, index) => {
        const StepIcon = step.icon || defaultIcons[step.number] || CheckCircle;
        const isClickable = (step.isClickable || step.isCompleted) && onStepClick && !step.isCurrent;
        const colors = getStatusColors(step);
        
        return (
          <React.Fragment key={step.number}>
            <motion.div 
              className={cn(
                "flex flex-col items-center relative group",
                isClickable && "cursor-pointer"
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.15,
                type: "spring",
                stiffness: 100
              }}
              onClick={isClickable ? () => onStepClick(step.number) : undefined}
            >
              {/* Glow effect for current step */}
              {step.isCurrent && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/20 blur-lg"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
              
              <motion.div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full border-2 relative transition-all duration-300",
                  colors.border,
                  colors.text,
                  step.isCurrent && colors.bg,
                  "shadow-lg",
                  isClickable && "hover:shadow-xl hover:scale-105"
                )}
                whileHover={isClickable ? { 
                  scale: 1.1,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
                } : {}}
                whileTap={isClickable ? { scale: 0.95 } : {}}
              >
                <AnimatePresence mode="wait">
                  {step.validationStatus === 'pending' ? (
                    <motion.div
                      key="pending"
                      initial={{ opacity: 0, rotate: -180 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </motion.div>
                  ) : step.isCompleted ? (
                    <motion.div
                      key="completed"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 300, 
                        damping: 20,
                        duration: 0.6
                      }}
                    >
                      <CheckCircle className="h-7 w-7" />
                    </motion.div>
                  ) : step.validationStatus === 'invalid' ? (
                    <motion.div
                      key="invalid"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <AlertCircle className="h-6 w-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="default"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 300, 
                        damping: 20 
                      }}
                    >
                      <StepIcon className="h-6 w-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Número del paso (pequeño, en la esquina) */}
                <motion.div 
                  className="absolute -top-1 -right-1 bg-background border-2 border-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-primary shadow-sm"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.15 + 0.3, type: "spring" }}
                >
                  {step.number}
                </motion.div>

                {/* Pulse animation for current step */}
                {step.isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [0.8, 0, 0.8]
                    }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
              </motion.div>
              
              <motion.div 
                className="mt-3 text-center max-w-[140px]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.15 + 0.2 }}
              >
                <p
                  className={cn(
                    "text-sm font-semibold transition-colors duration-300",
                    step.isCompleted || step.isCurrent
                      ? "text-foreground"
                      : "text-muted-foreground",
                    step.isCurrent && "text-primary"
                  )}
                >
                  {step.title}
                </p>
                {step.description && (
                  <motion.p 
                    className="text-xs text-muted-foreground mt-1 leading-tight"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.15 + 0.4 }}
                  >
                    {step.description}
                  </motion.p>
                )}
                
                {/* Validation status indicator */}
                {step.validationStatus && (
                  <motion.div
                    className={cn(
                      "mt-1 text-xs font-medium",
                      step.validationStatus === 'valid' && "text-green-500",
                      step.validationStatus === 'invalid' && "text-destructive",
                      step.validationStatus === 'pending' && "text-amber-500"
                    )}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.15 + 0.5 }}
                  >
                    {step.validationStatus === 'valid' && "✓ Completo"}
                    {step.validationStatus === 'invalid' && "⚠ Revisar"}
                    {step.validationStatus === 'pending' && "⏳ Validando"}
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
            
            {index < steps.length - 1 && (
              <motion.div
                className={cn(
                  "mx-3 h-1 flex-1 rounded-full min-w-[3rem] relative overflow-hidden",
                  "bg-gray-200 dark:bg-gray-700"
                )}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.15 + 0.3 }}
                style={{ originX: 0 }}
              >
                {/* Progress fill */}
                <motion.div
                  className="absolute inset-0 bg-primary rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ 
                    scaleX: step.isCompleted ? 1 : 0
                  }}
                  transition={{ 
                    duration: 0.8, 
                    delay: step.isCompleted ? index * 0.15 + 0.5 : 0,
                    type: "spring",
                    stiffness: 100
                  }}
                  style={{ originX: 0 }}
                />
                
                {/* Animated gradient for current step */}
                {step.isCurrent && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary rounded-full"
                    animate={{ 
                      x: ["-100%", "100%"]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
              </motion.div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}