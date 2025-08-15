'use client';

import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

interface EnhancedCardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'className'> {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'bordered' | 'subtle';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  id?: string;
}

const variantStyles = {
  default: 'bg-card border-2 border-border shadow-sm',
  elevated: 'bg-card border-2 border-border shadow-lg',
  bordered: 'bg-card border-2 border-border shadow-none',
  subtle: 'bg-muted/30 border border-border/40 shadow-none',
};

const paddingStyles = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

const hoverStyles =
  'hover:shadow-xl hover:border-border/80 transition-all duration-200';

export function EnhancedCard({
  children,
  className,
  variant = 'default',
  padding = 'md',
  hover = false,
  ...rest
}: EnhancedCardProps) {
  return (
    <div
      {...rest}
      className={cn(
        'rounded-xl',
        variantStyles[variant],
        paddingStyles[padding],
        hover && hoverStyles,
        className
      )}
    >
      {children}
    </div>
  );
}
