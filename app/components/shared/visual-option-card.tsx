'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

interface VisualOptionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

export const VisualOptionCard = ({
  icon,
  title,
  description,
  isSelected,
  onClick,
  className,
  disabled = false,
}: VisualOptionCardProps) => {
  const cardVariants = {
    unselected: {
      scale: 1,
      borderColor: 'hsl(var(--border))',
      backgroundColor: 'hsl(var(--card))',
    },
    selected: {
      scale: 1.03,
      borderColor: 'hsl(var(--primary))',
      backgroundColor: 'hsl(var(--secondary))',
    },
    hover: { scale: disabled ? 1 : 1.05, transition: { duration: 0.2 } },
    disabled: {
      scale: 1,
      borderColor: 'hsl(var(--muted))',
      backgroundColor: 'hsl(var(--muted))',
    },
  };

  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      animate={disabled ? 'disabled' : isSelected ? 'selected' : 'unselected'}
      whileHover={disabled ? undefined : 'hover'}
      onClick={handleClick}
      className={cn(
        'relative rounded-lg border-2 p-4 text-center transition-all duration-300',
        'flex flex-col items-center justify-center space-y-2 h-full',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className
      )}
    >
      {isSelected && !disabled && (
        <CheckCircle className='absolute top-2 right-2 h-5 w-5 text-primary' />
      )}
      <div className={cn('text-primary', disabled && 'text-muted-foreground')}>
        {icon}
      </div>
      <h3 className={cn('font-semibold', disabled && 'text-muted-foreground')}>
        {title}
      </h3>
      <p className='text-sm text-muted-foreground'>{description}</p>
    </motion.div>
  );
};
