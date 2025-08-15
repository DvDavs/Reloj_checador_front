'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ActionButton {
  icon: React.ReactNode;
  label?: string;
  onClick: () => void;
  variant?: 'view' | 'edit' | 'delete' | 'custom';
  title?: string;
  className?: string;
  disabled?: boolean;
}

interface ActionButtonsProps {
  buttons: ActionButton[];
  size?: 'sm' | 'icon';
  className?: string;
}

const variantStyles = {
  view: 'action-button-view',
  edit: 'action-button-edit',
  delete: 'action-button-delete',
  custom: '',
};

export function ActionButtons({
  buttons,
  size = 'icon',
  className,
}: ActionButtonsProps) {
  return (
    <div className={cn('flex justify-end items-center gap-2', className)}>
      {buttons.map((button, index) => (
        <Button
          key={index}
          variant='ghost'
          size={size}
          onClick={button.onClick}
          title={button.title}
          disabled={button.disabled}
          className={cn(
            variantStyles[button.variant || 'custom'],
            button.className
          )}
        >
          {button.icon}
          {button.label && size !== 'icon' && (
            <span className='ml-1'>{button.label}</span>
          )}
        </Button>
      ))}
    </div>
  );
}
