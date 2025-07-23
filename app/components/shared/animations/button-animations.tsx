"use client";

import * as React from "react";
import { motion, MotionProps } from "framer-motion";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./loading-animations";

interface AnimatedButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  motionProps?: MotionProps;
}

export function AnimatedButton({
  children,
  isLoading = false,
  loadingText,
  disabled,
  className,
  motionProps,
  ...props
}: AnimatedButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...motionProps}
    >
      <Button
        disabled={disabled || isLoading}
        className={cn(
          "transition-all duration-200",
          isLoading && "cursor-not-allowed",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-2"
          >
            <LoadingSpinner size="sm" />
            <span>{loadingText || "Cargando..."}</span>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </Button>
    </motion.div>
  );
}

interface FloatingActionButtonProps extends ButtonProps {
  icon: React.ReactNode;
  label?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

export function FloatingActionButton({
  icon,
  label,
  position = "bottom-right",
  className,
  ...props
}: FloatingActionButtonProps) {
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  };

  return (
    <motion.div
      className={cn("fixed z-50", positionClasses[position])}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Button
        size="lg"
        className={cn(
          "rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300",
          "h-14 w-14",
          label && "w-auto px-4",
          className
        )}
        {...props}
      >
        <motion.div
          className="flex items-center space-x-2"
          whileHover={{ rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {icon}
          {label && <span className="font-medium">{label}</span>}
        </motion.div>
      </Button>
    </motion.div>
  );
}

interface PulseButtonProps extends ButtonProps {
  pulseColor?: string;
}

export function PulseButton({ 
  children, 
  pulseColor = "rgb(59, 130, 246)", 
  className,
  ...props 
}: PulseButtonProps) {
  return (
    <motion.div className="relative">
      <motion.div
        className="absolute inset-0 rounded-md"
        animate={{
          boxShadow: [
            `0 0 0 0 ${pulseColor}40`,
            `0 0 0 10px ${pulseColor}00`,
          ],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />
      <Button className={className} {...props}>
        {children}
      </Button>
    </motion.div>
  );
}

interface SuccessButtonProps extends ButtonProps {
  showSuccess?: boolean;
  successDuration?: number;
  onSuccessComplete?: () => void;
}

export function SuccessButton({
  children,
  showSuccess = false,
  successDuration = 2000,
  onSuccessComplete,
  className,
  ...props
}: SuccessButtonProps) {
  const [isSuccess, setIsSuccess] = React.useState(false);

  React.useEffect(() => {
    if (showSuccess) {
      setIsSuccess(true);
      const timer = setTimeout(() => {
        setIsSuccess(false);
        onSuccessComplete?.();
      }, successDuration);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, successDuration, onSuccessComplete]);

  return (
    <motion.div
      animate={isSuccess ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <Button
        className={cn(
          "transition-all duration-300",
          isSuccess && "bg-green-500 hover:bg-green-600",
          className
        )}
        {...props}
      >
        <motion.div
          animate={isSuccess ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5 }}
        >
          {isSuccess ? "✓ Éxito" : children}
        </motion.div>
      </Button>
    </motion.div>
  );
}