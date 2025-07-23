"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

interface VisualOptionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

export const VisualOptionCard = ({
  icon,
  title,
  description,
  isSelected,
  onClick,
  className,
}: VisualOptionCardProps) => {
  const cardVariants = {
    unselected: { scale: 1, borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--card))" },
    selected: { scale: 1.03, borderColor: "hsl(var(--primary))", backgroundColor: "hsl(var(--secondary))" },
    hover: { scale: 1.05, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      variants={cardVariants}
      animate={isSelected ? "selected" : "unselected"}
      whileHover="hover"
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-lg border-2 p-4 text-center transition-all duration-300",
        "flex flex-col items-center justify-center space-y-2 h-full",
        className
      )}
    >
      {isSelected && (
        <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-primary" />
      )}
      <div className="text-primary">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
};