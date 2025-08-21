import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (limit: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  total,
  limit,
  hasNext,
  hasPrev,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, total);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-2 py-4 bg-gray-900 border-t border-gray-800">
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-400">
          Showing {startItem} to {endItem} of {total} tweets
        </div>
        
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Show:</span>
            <select
              value={limit}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded px-2 py-1"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={() => onPageChange(1)}
          disabled={!hasPrev}
          variant="outline"
          size="sm"
          className="bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 disabled:opacity-50"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrev}
          variant="outline"
          size="sm"
          className="bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <div key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-gray-400">...</span>
              ) : (
                <Button
                  onClick={() => onPageChange(page as number)}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className={
                    currentPage === page
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
                  }
                >
                  {page}
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext}
          variant="outline"
          size="sm"
          className="bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNext}
          variant="outline"
          size="sm"
          className="bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 disabled:opacity-50"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
