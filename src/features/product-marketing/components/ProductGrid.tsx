/**
 * ProductGrid Component
 *
 * Displays products in a responsive grid layout.
 * Supports selection mode, filtering, and loading states.
 */

import React from 'react';
import type { Product } from '../types';
import { ProductCard } from './ProductCard';

// ============================================================================
// TYPES
// ============================================================================

export interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  emptyMessage?: string;
  selectedIds?: Set<string>;
  selectionMode?: boolean;
  showActions?: boolean;
  columns?: 1 | 2 | 3 | 4;
  onProductSelect?: (product: Product) => void;
  onProductEdit?: (product: Product) => void;
  onProductDelete?: (product: Product) => void;
  onStatusChange?: (product: Product, status: Product['status']) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  className?: string;
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

const ProductSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm animate-pulse">
    <div className="aspect-video bg-gray-200 rounded-t-lg" />
    <div className="p-4">
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-full mb-1" />
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
      <div className="flex gap-1 mb-3">
        <div className="h-5 bg-gray-200 rounded w-16" />
        <div className="h-5 bg-gray-200 rounded w-16" />
      </div>
      <div className="pt-3 border-t border-gray-100">
        <div className="h-6 bg-gray-200 rounded w-20" />
      </div>
    </div>
  </div>
);

// ============================================================================
// EMPTY STATE
// ============================================================================

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
    </div>
    <p className="text-gray-500">{message}</p>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  emptyMessage = 'No products found',
  selectedIds = new Set(),
  selectionMode = false,
  showActions = true,
  columns = 3,
  onProductSelect,
  onProductEdit,
  onProductDelete,
  onStatusChange,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  className = '',
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  // Loading state
  if (isLoading && products.length === 0) {
    return (
      <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>
        {Array.from({ length: 6 }).map((_, idx) => (
          <ProductSkeleton key={idx} />
        ))}
      </div>
    );
  }

  // Empty state
  if (!isLoading && products.length === 0) {
    return (
      <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>
        <EmptyState message={emptyMessage} />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Grid */}
      <div className={`grid ${gridCols[columns]} gap-4`}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isSelected={selectionMode && selectedIds.has(product.id)}
            showActions={showActions && !selectionMode}
            onSelect={onProductSelect}
            onEdit={!selectionMode ? onProductEdit : undefined}
            onDelete={!selectionMode ? onProductDelete : undefined}
            onStatusChange={!selectionMode ? onStatusChange : undefined}
          />
        ))}
      </div>

      {/* Load more */}
      {hasMore && onLoadMore && (
        <div className="mt-6 text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingMore ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading...
              </span>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}

      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className={`grid ${gridCols[columns]} gap-4 mt-4`}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <ProductSkeleton key={`loading-${idx}`} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
