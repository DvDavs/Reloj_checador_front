"use client";

import { motion, AnimatePresence } from "framer-motion";
import { slideInFromRight, slideInFromLeft } from "./motion-variants";

interface StepWrapperProps {
  children: React.ReactNode;
  currentStep: number;
  stepIndex: number;
}

export const StepWrapper = ({
  children,
  currentStep,
  stepIndex,
}: StepWrapperProps) => {
  const direction = currentStep > stepIndex ? -1 : 1;

  const variants = direction === 1 ? slideInFromRight : slideInFromLeft;

  return (
    <AnimatePresence initial={false}>
      {currentStep === stepIndex && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={variants}
          className="w-full"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 