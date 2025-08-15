'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EnhancedBadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default' | 'secondary';
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  success:
    'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 dark:hover:bg-emerald-900/50',
  warning:
    'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-900/50',
  error:
    'bg-red-100 text-red-800 border-red-300 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700 dark:hover:bg-red-900/50',
  info: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900/50',
  default: 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
  secondary:
    'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80',
};

const sizeStyles = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base',
};

export function EnhancedBadge({
  variant = 'default',
  children,
  className,
  size = 'md',
}: EnhancedBadgeProps) {
  return (
    <Badge
      className={cn(
        'font-semibold shadow-sm border-2 transition-all duration-200',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </Badge>
  );
}
