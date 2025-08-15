'use client';

import { PageHeader } from './page-header';
import { SearchInput } from './search-input';
import { LoadingState } from './loading-state';
import { ErrorState } from './error-state';
import { PaginationWrapper } from './pagination-wrapper';
import { EnhancedCard } from './enhanced-card';

interface PageLayoutProps {
  title: string;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  actions?: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  children: React.ReactNode;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  showSearch?: boolean;
  showPagination?: boolean;
}

export function PageLayout({
  title,
  isLoading = false,
  error = null,
  onRefresh,
  actions,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  children,
  currentPage,
  totalPages,
  onPageChange,
  showSearch = true,
  showPagination = true,
}: PageLayoutProps) {
  return (
    <div className='min-h-screen bg-background'>
      <div className='p-6 md:p-8'>
        {/* Header */}
        <EnhancedCard variant='elevated' padding='lg' className='mb-6'>
          <PageHeader
            title={title}
            isLoading={isLoading}
            onRefresh={onRefresh}
            actions={actions}
          />
        </EnhancedCard>

        {/* Search */}
        {showSearch && onSearchChange && (
          <EnhancedCard variant='default' padding='md' className='mb-6'>
            <SearchInput
              value={searchValue}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
              className='mb-0'
            />
          </EnhancedCard>
        )}

        {/* Loading State */}
        {isLoading && (
          <EnhancedCard variant='elevated' padding='xl'>
            <LoadingState message={`Cargando ${title.toLowerCase()}...`} />
          </EnhancedCard>
        )}

        {/* Error State */}
        {error && (
          <EnhancedCard
            variant='elevated'
            padding='lg'
            className='border-red-200/60 dark:border-red-800'
          >
            <ErrorState message={error} onRetry={onRefresh} />
          </EnhancedCard>
        )}

        {/* Content */}
        {!isLoading && !error && (
          <>
            {children}

            {/* Pagination */}
            {showPagination &&
              currentPage &&
              totalPages &&
              onPageChange &&
              totalPages > 1 && (
                <EnhancedCard variant='default' padding='md' className='mt-6'>
                  <PaginationWrapper
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                  />
                </EnhancedCard>
              )}
          </>
        )}
      </div>
    </div>
  );
}
