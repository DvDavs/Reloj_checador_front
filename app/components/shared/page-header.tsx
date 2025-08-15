'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  isLoading,
  onRefresh,
  actions,
}: PageHeaderProps) {
  return (
    <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
      <div className='space-y-1'>
        <h1 className='text-2xl md:text-3xl font-bold text-foreground tracking-tight'>
          {title}
        </h1>
        <div className='h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full'></div>
      </div>
      <div className='flex items-center gap-3'>
        {onRefresh && (
          <Button
            onClick={onRefresh}
            variant='outline'
            size='icon'
            className='h-10 w-10 border-2 border-border hover:border-primary hover:bg-primary/5 transition-all duration-200 shadow-sm'
          >
            <RefreshCw
              className={`h-4 w-4 text-muted-foreground ${isLoading ? 'animate-spin text-primary' : ''}`}
            />
            <span className='sr-only'>Refrescar</span>
          </Button>
        )}
        {actions}
      </div>
    </div>
  );
}
