'use client';

import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStableTheme } from '@/hooks/use-stable-theme';

export function ThemeToggle() {
  const { theme, toggleTheme, mounted, isChanging } = useStableTheme();

  if (!mounted) {
    return (
      <Button
        variant='ghost'
        size='icon'
        disabled
        className='text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-hover))]'
        aria-label='Loading theme toggle'
      >
        <div className='h-4 w-4' />
      </Button>
    );
  }

  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={toggleTheme}
      disabled={isChanging}
      title={theme === 'dark' ? 'Cambiar a claro' : 'Cambiar a oscuro'}
      className='text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-hover))] transition-opacity'
      aria-label='Toggle theme'
      style={{ opacity: isChanging ? 0.7 : 1 }}
    >
      {theme === 'dark' ? (
        <Sun className='h-4 w-4' />
      ) : (
        <Moon className='h-4 w-4' />
      )}
    </Button>
  );
}
