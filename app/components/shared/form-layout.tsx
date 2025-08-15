'use client';

import { EnhancedCard } from './enhanced-card';
import { BreadcrumbNav } from './breadcrumb-nav';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface FormLayoutProps {
  title: string;
  description?: string;
  breadcrumbs: BreadcrumbItem[];
  backHref?: string;
  steps?: Array<{
    icon: React.ReactNode;
    title: string;
    description: string;
    color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  }>;
  children: React.ReactNode;
  actions?: React.ReactNode;
  isSubmitting?: boolean;
  error?: string | null;
  formIcon?: React.ReactNode;
  formTitle?: string;
  formDescription?: string;
  footerNote?: string;
}

const colorClasses = {
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  purple:
    'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  orange:
    'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
};

export function FormLayout({
  title,
  description,
  breadcrumbs,
  backHref,
  steps,
  children,
  actions,
  isSubmitting = false,
  error,
  formIcon,
  formTitle,
  formDescription,
  footerNote,
}: FormLayoutProps) {
  return (
    <div className='min-h-screen bg-background'>
      <div className='p-6 md:p-8'>
        <div className='max-w-4xl mx-auto space-y-6'>
          {/* Header */}
          <EnhancedCard variant='elevated' padding='lg'>
            <div className='space-y-1 mb-4'>
              <BreadcrumbNav items={breadcrumbs} backHref={backHref} />
            </div>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
              <div className='space-y-1'>
                <h1 className='text-2xl md:text-3xl font-bold text-foreground tracking-tight'>
                  {title}
                </h1>
                <div className='h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full'></div>
                {description && (
                  <p className='text-muted-foreground mt-2'>{description}</p>
                )}
              </div>
              {backHref && (
                <Link href={backHref}>
                  <Button
                    variant='outline'
                    disabled={isSubmitting}
                    className='border-2 border-border hover:border-primary hover:bg-primary/5'
                  >
                    <ArrowLeft className='mr-2 h-4 w-4' />
                    Volver
                  </Button>
                </Link>
              )}
            </div>
          </EnhancedCard>

          {/* Steps */}
          {steps && steps.length > 0 && (
            <div
              className={`grid grid-cols-1 md:grid-cols-${Math.min(steps.length, 4)} gap-4`}
            >
              {steps.map((step, index) => (
                <EnhancedCard key={index} variant='bordered' padding='md'>
                  <div className='flex items-center space-x-3'>
                    <div
                      className={`p-2 rounded-lg ${colorClasses[step.color]}`}
                    >
                      {step.icon}
                    </div>
                    <div>
                      <h3 className='font-semibold text-foreground'>
                        {step.title}
                      </h3>
                      <p className='text-sm text-muted-foreground'>
                        {step.description}
                      </p>
                    </div>
                  </div>
                </EnhancedCard>
              ))}
            </div>
          )}

          {/* Form Content */}
          <EnhancedCard variant='elevated' padding='none'>
            <div className='p-6'>
              {(formIcon || formTitle) && (
                <div className='flex items-center gap-2 mb-6'>
                  {formIcon}
                  {formTitle && (
                    <h2 className='text-lg font-semibold text-foreground'>
                      {formTitle}
                    </h2>
                  )}
                </div>
              )}

              {formDescription && (
                <p className='text-muted-foreground text-sm mb-6'>
                  {formDescription}
                </p>
              )}

              {error && (
                <div className='mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg dark:bg-red-950/30 dark:border-red-800 dark:text-red-400'>
                  {error}
                </div>
              )}

              {children}
            </div>

            {/* Footer */}
            {(actions || footerNote) && (
              <div className='border-t border-border bg-muted/30 px-6 py-4'>
                <div className='flex flex-col sm:flex-row justify-between items-center gap-4'>
                  {footerNote && (
                    <div className='text-sm text-muted-foreground'>
                      {footerNote}
                    </div>
                  )}
                  {actions && <div className='flex gap-3'>{actions}</div>}
                </div>
              </div>
            )}
          </EnhancedCard>
        </div>
      </div>
    </div>
  );
}
