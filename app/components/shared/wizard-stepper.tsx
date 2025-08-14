'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardStepperProps {
  steps: { label: string }[];
  currentStep: number; // 1-based index
  className?: string;
}

export function WizardStepper({
  steps,
  currentStep,
  className,
}: WizardStepperProps) {
  return (
    <div className={cn('max-w-4xl mx-auto', className)}>
      <div className='flex items-center justify-between'>
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isActive = currentStep === stepNumber;

          return (
            <React.Fragment key={step.label}>
              <div className='flex flex-col items-center text-center w-auto px-1'>
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center border-2 mb-1 transition-colors',
                    {
                      'bg-primary border-primary text-primary-foreground':
                        isCompleted,
                      'border-primary bg-primary/10 text-primary': isActive,
                      'border-muted-foreground/30 bg-muted text-muted-foreground':
                        !isCompleted && !isActive,
                    }
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle size={16} />
                  ) : (
                    <span className='font-bold'>{stepNumber}</span>
                  )}
                </div>
                <span
                  className={cn('text-xs leading-tight', {
                    'text-foreground font-medium': currentStep >= stepNumber,
                    'text-muted-foreground': currentStep < stepNumber,
                  })}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 -translate-y-[calc(1rem-theme(space.1)/2-1px)]',
                    {
                      'bg-primary': isCompleted,
                      'bg-border': !isCompleted,
                    }
                  )}
                ></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
