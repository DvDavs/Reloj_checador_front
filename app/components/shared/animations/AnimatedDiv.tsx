"use client";

import { motion, HTMLMotionProps } from "framer-motion";

interface AnimatedDivProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

export const AnimatedDiv = ({ children, ...props }: AnimatedDivProps) => {
  return <motion.div {...props}>{children}</motion.div>;
}; 