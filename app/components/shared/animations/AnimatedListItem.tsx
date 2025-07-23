"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { itemVariants } from "./motion-variants";

interface AnimatedListItemProps extends HTMLMotionProps<"li"> {
  children: React.ReactNode;
}

export const AnimatedListItem = ({
  children,
  ...props
}: AnimatedListItemProps) => {
  return (
    <motion.li variants={itemVariants} {...props}>
      {children}
    </motion.li>
  );
}; 