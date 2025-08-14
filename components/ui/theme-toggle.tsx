'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const current = theme === 'system' ? systemTheme : theme;

  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={() => setTheme(current === 'dark' ? 'light' : 'dark')}
      title={current === 'dark' ? 'Cambiar a claro' : 'Cambiar a oscuro'}
      className='text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-hover))]'
      aria-label='Toggle theme'
    >
      {current === 'dark' ? (
        <Sun className='h-4 w-4' />
      ) : (
        <Moon className='h-4 w-4' />
      )}
    </Button>
  );
}
