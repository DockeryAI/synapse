/**
 * Loading Skeleton Component
 * Provides accessible skeleton screens for loading states
 * Respects prefers-reduced-motion
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rectangle' | 'card';
  lines?: number;
  height?: string;
  width?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  variant = 'text',
  lines = 1,
  height,
  width,
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700 animate-pulse';

  if (variant === 'text') {
    return (
      <div className={cn('space-y-2', className)} role="status" aria-label="Loading content">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              'rounded h-4',
              i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full'
            )}
            style={{ height: height || undefined, width: width || undefined }}
          />
        ))}
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (variant === 'circle') {
    return (
      <div
        className={cn(baseClasses, 'rounded-full', className)}
        style={{
          height: height || '3rem',
          width: width || '3rem',
        }}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (variant === 'rectangle') {
    return (
      <div
        className={cn(baseClasses, 'rounded', className)}
        style={{
          height: height || '8rem',
          width: width || '100%',
        }}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={cn('border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4', className)}
        role="status"
        aria-label="Loading card"
      >
        <div className="flex items-center space-x-4">
          <div className={cn(baseClasses, 'rounded-full h-12 w-12')} />
          <div className="flex-1 space-y-2">
            <div className={cn(baseClasses, 'rounded h-4 w-3/4')} />
            <div className={cn(baseClasses, 'rounded h-3 w-1/2')} />
          </div>
        </div>
        <div className="space-y-2">
          <div className={cn(baseClasses, 'rounded h-4 w-full')} />
          <div className={cn(baseClasses, 'rounded h-4 w-full')} />
          <div className={cn(baseClasses, 'rounded h-4 w-2/3')} />
        </div>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return null;
};

/**
 * Campaign Card Loading Skeleton
 */
export const CampaignCardSkeleton: React.FC = () => {
  return (
    <div
      className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4 animate-fade-in"
      role="status"
      aria-label="Loading campaign"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded h-6 w-48" />
          <div className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded h-4 w-32" />
        </div>
        <div className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full h-10 w-10" />
      </div>

      {/* Content */}
      <div className="space-y-3">
        <div className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded h-4 w-full" />
        <div className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded h-4 w-full" />
        <div className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded h-4 w-3/4" />
      </div>

      {/* Footer */}
      <div className="flex gap-2 pt-4">
        <div className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded h-10 flex-1" />
        <div className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded h-10 w-24" />
      </div>

      <span className="sr-only">Loading campaign details...</span>
    </div>
  );
};

/**
 * Content Piece Loading Skeleton
 */
export const ContentPieceSkeleton: React.FC = () => {
  return (
    <div
      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden animate-fade-in"
      role="status"
      aria-label="Loading content"
    >
      {/* Platform Header */}
      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center gap-2">
        <div className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full h-6 w-6" />
        <div className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded h-5 w-24" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded h-4 w-full" />
        <div className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded h-4 w-full" />
        <div className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded h-4 w-2/3" />
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <div className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded h-8 w-16" />
        <div className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded h-8 w-16" />
      </div>

      <span className="sr-only">Loading content piece...</span>
    </div>
  );
};

/**
 * List Loading Skeleton
 */
export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 3 }) => {
  return (
    <div className="space-y-3 animate-fade-in" role="status" aria-label="Loading list">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full h-10 w-10 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded h-4 w-3/4" />
            <div className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded h-3 w-1/2" />
          </div>
          <div className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded h-8 w-20 flex-shrink-0" />
        </div>
      ))}
      <span className="sr-only">Loading items...</span>
    </div>
  );
};

/**
 * Table Loading Skeleton
 */
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden animate-fade-in" role="status" aria-label="Loading table">
      {/* Header */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded h-4" />
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded h-4" />
              ))}
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">Loading table data...</span>
    </div>
  );
};
