'use client';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface PaginationWrapperProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Helper para Paginación
const getPaginationRange = (
  currentPage: number,
  totalPages: number,
  siblingCount = 1
): (number | '...')[] => {
  const totalPageNumbers = siblingCount + 5;

  if (totalPages <= totalPageNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

  const firstPageIndex = 1;
  const lastPageIndex = totalPages;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    let leftItemCount = 3 + 2 * siblingCount;
    let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, '...', totalPages];
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    let rightItemCount = 3 + 2 * siblingCount;
    let rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1
    );
    return [firstPageIndex, '...', ...rightRange];
  }

  if (shouldShowLeftDots && shouldShowRightDots) {
    let middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    );
    return [firstPageIndex, '...', ...middleRange, '...', lastPageIndex];
  }

  return Array.from({ length: totalPages }, (_, i) => i + 1);
};

export function PaginationWrapper({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationWrapperProps) {
  if (totalPages <= 1) return null;

  return (
    <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
      {/* Información de página */}
      <div className='text-sm text-muted-foreground font-medium'>
        Página <span className='font-bold text-foreground'>{currentPage}</span>{' '}
        de <span className='font-bold text-foreground'>{totalPages}</span>
      </div>

      {/* Controles de paginación */}
      <Pagination>
        <PaginationContent className='gap-1'>
          <PaginationItem>
            <PaginationPrevious
              href='#'
              onClick={(e) => {
                e.preventDefault();
                onPageChange(Math.max(1, currentPage - 1));
              }}
              className={`
                h-10 px-4 border-2 transition-all duration-200
                ${
                  currentPage === 1
                    ? 'pointer-events-none opacity-50 border-border text-muted-foreground'
                    : 'border-border hover:border-primary hover:bg-primary/5 hover:text-primary'
                }
              `}
            />
          </PaginationItem>

          {getPaginationRange(currentPage, totalPages).map((page, index) => (
            <PaginationItem key={index}>
              {page === '...' ? (
                <span className='px-4 py-2 text-muted-foreground font-medium'>
                  ...
                </span>
              ) : (
                <PaginationLink
                  href='#'
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(page as number);
                  }}
                  isActive={currentPage === page}
                  className={`
                    h-10 w-10 border-2 transition-all duration-200 font-semibold
                    ${
                      currentPage === page
                        ? 'border-primary bg-primary text-primary-foreground shadow-md hover:bg-primary/90'
                        : 'border-border hover:border-primary hover:bg-primary/5 hover:text-primary'
                    }
                  `}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              href='#'
              onClick={(e) => {
                e.preventDefault();
                onPageChange(Math.min(totalPages, currentPage + 1));
              }}
              className={`
                h-10 px-4 border-2 transition-all duration-200
                ${
                  currentPage === totalPages
                    ? 'pointer-events-none opacity-50 border-border text-muted-foreground'
                    : 'border-border hover:border-primary hover:bg-primary/5 hover:text-primary'
                }
              `}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
