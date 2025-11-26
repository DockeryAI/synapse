/**
 * Skeleton Loaders for Progressive Dashboard Loading
 *
 * Shows animated placeholders while data loads
 * Each API gets its own skeleton that disappears when data arrives
 */

import React from 'react';
import { cn } from '../../lib/utils';

// Base skeleton animation
const skeletonBase = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800";

// Generic skeleton box
export const SkeletonBox: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn(skeletonBase, "rounded-lg", className)} />
);

// Text line skeleton
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 1,
  className
}) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={cn(
          skeletonBase,
          "h-4 rounded",
          i === lines - 1 && lines > 1 && "w-3/4"
        )}
      />
    ))}
  </div>
);

// Card skeleton wrapper
export const SkeletonCard: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <div className={cn(
    "bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800",
    className
  )}>
    {children}
  </div>
);

// YouTube Trending Skeleton
export const YouTubeTrendingSkeleton = () => (
  <SkeletonCard>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-6 w-32" />
        <SkeletonBox className="h-5 w-20" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <SkeletonBox className="h-16 w-28 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonText lines={2} />
              <SkeletonBox className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </SkeletonCard>
);

// SEMrush Domain Overview Skeleton
export const SEMrushDomainSkeleton = () => (
  <SkeletonCard>
    <div className="space-y-4">
      <SkeletonBox className="h-6 w-40" />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <SkeletonBox className="h-4 w-20" />
          <SkeletonBox className="h-8 w-24" />
        </div>
        <div className="space-y-2">
          <SkeletonBox className="h-4 w-20" />
          <SkeletonBox className="h-8 w-24" />
        </div>
      </div>
      <SkeletonBox className="h-24 w-full" />
    </div>
  </SkeletonCard>
);

// News Breaking Skeleton
export const NewsBreakingSkeleton = () => (
  <SkeletonCard>
    <div className="space-y-4">
      <SkeletonBox className="h-6 w-36" />
      {[1, 2].map(i => (
        <div key={i} className="space-y-2">
          <SkeletonText lines={2} />
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-3 w-16" />
            <SkeletonBox className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  </SkeletonCard>
);

// Google Maps Reviews Skeleton
export const GoogleMapsSkeleton = () => (
  <SkeletonCard>
    <div className="space-y-4">
      <SkeletonBox className="h-6 w-44" />
      <div className="flex items-center gap-4">
        <SkeletonBox className="h-10 w-16" />
        <div className="space-y-1">
          <SkeletonBox className="h-4 w-24" />
          <SkeletonBox className="h-3 w-32" />
        </div>
      </div>
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="space-y-2">
            <div className="flex items-center gap-2">
              <SkeletonBox className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <SkeletonBox className="h-4 w-24" />
              </div>
              <SkeletonBox className="h-4 w-16" />
            </div>
            <SkeletonText lines={2} />
          </div>
        ))}
      </div>
    </div>
  </SkeletonCard>
);

// Serper/Quora Q&A Skeleton
export const QuoraSkeleton = () => (
  <SkeletonCard>
    <div className="space-y-4">
      <SkeletonBox className="h-6 w-32" />
      {[1, 2].map(i => (
        <div key={i} className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <SkeletonText />
          <SkeletonText lines={2} className="text-sm" />
        </div>
      ))}
    </div>
  </SkeletonCard>
);

// Weather Conditions Skeleton
export const WeatherSkeleton = () => (
  <SkeletonCard className="p-4">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <SkeletonBox className="h-6 w-24" />
        <SkeletonBox className="h-10 w-20" />
      </div>
      <SkeletonBox className="h-16 w-16 rounded-full" />
    </div>
  </SkeletonCard>
);

// LinkedIn Company Skeleton
export const LinkedInSkeleton = () => (
  <SkeletonCard>
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SkeletonBox className="h-12 w-12 rounded" />
        <div className="flex-1 space-y-2">
          <SkeletonBox className="h-5 w-32" />
          <SkeletonBox className="h-4 w-48" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div className="flex gap-4">
        <SkeletonBox className="h-8 w-24" />
        <SkeletonBox className="h-8 w-24" />
      </div>
    </div>
  </SkeletonCard>
);

// Perplexity Research Skeleton
export const PerplexitySkeleton = () => (
  <SkeletonCard>
    <div className="space-y-4">
      <SkeletonBox className="h-6 w-36" />
      <SkeletonText lines={4} />
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-start gap-2">
            <SkeletonBox className="h-2 w-2 rounded-full mt-2" />
            <SkeletonText className="flex-1" />
          </div>
        ))}
      </div>
    </div>
  </SkeletonCard>
);

// Website Analysis Skeleton
export const WebsiteAnalysisSkeleton = () => (
  <SkeletonCard>
    <div className="space-y-4">
      <SkeletonBox className="h-6 w-40" />
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="text-center space-y-2">
            <SkeletonBox className="h-12 w-full" />
            <SkeletonBox className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  </SkeletonCard>
);

// Instagram Profile Skeleton
export const InstagramSkeleton = () => (
  <SkeletonCard>
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <SkeletonBox className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBox className="h-5 w-32" />
          <div className="flex gap-4">
            <SkeletonBox className="h-4 w-20" />
            <SkeletonBox className="h-4 w-20" />
            <SkeletonBox className="h-4 w-20" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <SkeletonBox key={i} className="aspect-square" />
        ))}
      </div>
    </div>
  </SkeletonCard>
);

// Progress Bar Component
export const ApiProgressBar: React.FC<{
  loaded: number;
  total: number;
  failed: number;
}> = ({ loaded, total, failed }) => {
  const successPercent = (loaded / total) * 100;
  const failedPercent = (failed / total) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-600 dark:text-gray-400">
          Loading APIs: {loaded}/{total}
        </span>
        {failed > 0 && (
          <span className="text-red-600 dark:text-red-400">
            {failed} failed
          </span>
        )}
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full flex">
          <div
            className="bg-green-500 transition-all duration-300"
            style={{ width: `${successPercent}%` }}
          />
          <div
            className="bg-red-500 transition-all duration-300"
            style={{ width: `${failedPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// API Status Indicator
export const ApiStatusIndicator: React.FC<{
  name: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  duration?: number;
}> = ({ name, status, duration }) => {
  const statusColors = {
    idle: 'bg-gray-400',
    loading: 'bg-yellow-500 animate-pulse',
    success: 'bg-green-500',
    error: 'bg-red-500'
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={cn("h-2 w-2 rounded-full", statusColors[status])} />
      <span className="text-gray-600 dark:text-gray-400">{name}</span>
      {duration && status === 'success' && (
        <span className="text-xs text-gray-500">({(duration / 1000).toFixed(1)}s)</span>
      )}
    </div>
  );
};

// Master skeleton grid for dashboard
export const DashboardSkeletonGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
    <YouTubeTrendingSkeleton />
    <SEMrushDomainSkeleton />
    <NewsBreakingSkeleton />
    <GoogleMapsSkeleton />
    <QuoraSkeleton />
    <LinkedInSkeleton />
    <PerplexitySkeleton />
    <WebsiteAnalysisSkeleton />
    <InstagramSkeleton />
  </div>
);