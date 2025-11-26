/**
 * Loading Skeletons for Dashboard Components
 * Provides granular loading states for better perceived performance
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

// Base skeleton component
interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div
    className={cn(
      'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 bg-[length:200%_100%] rounded-lg',
      className
    )}
    style={{
      animation: 'shimmer 2s ease-in-out infinite',
    }}
  />
);

// AI Picks Panel Skeleton
export const AiPicksSkeleton: React.FC = () => (
  <div className="h-full bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4 space-y-4">
    {/* Header */}
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-8 w-20" />
    </div>

    {/* Breakthrough Score Card */}
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 space-y-3">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-12 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>

    {/* Campaign Picks */}
    {[1, 2, 3].map((i) => (
      <div key={`campaign-${i}`} className="bg-white dark:bg-slate-800 rounded-lg p-4 space-y-2">
        <div className="flex items-start justify-between">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    ))}
  </div>
);

// Opportunity Radar Skeleton
export const OpportunityRadarSkeleton: React.FC = () => (
  <div className="h-full bg-white dark:bg-slate-900 p-6 space-y-4">
    {/* Header */}
    <div className="flex items-center justify-between mb-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>

    {/* Filter Buttons */}
    <div className="flex gap-2 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={`filter-${i}`} className="h-9 w-20" />
      ))}
    </div>

    {/* Opportunity Cards */}
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={`opportunity-${i}`}
        className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 space-y-3"
      >
        {/* Title and Badge */}
        <div className="flex items-start justify-between">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        {/* Description */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />

        {/* Metrics */}
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    ))}
  </div>
);

// Intelligence Library Skeleton
export const IntelligenceLibrarySkeleton: React.FC = () => (
  <div className="h-full bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 p-6 space-y-6">
    {/* Header with Tabs */}
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={`stat-${i}`} className="bg-white dark:bg-slate-800 rounded-lg p-4 space-y-2">
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>

    {/* Cluster Cards */}
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={`cluster-${i}`}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 space-y-4"
        >
          {/* Cluster Header */}
          <div className="flex items-start justify-between">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          {/* Framework Badge */}
          <Skeleton className="h-5 w-32" />

          {/* Metrics Row */}
          <div className="flex gap-6">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-24" />
          </div>

          {/* Description */}
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Full Dashboard Skeleton (all three columns)
export const DashboardSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
    {/* Header */}
    <div className="border-b bg-white dark:bg-slate-900 p-4">
      <div className="max-w-[1800px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </div>

    {/* Mode Selector */}
    <div className="border-b bg-white dark:bg-slate-900 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex gap-2 bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>

    {/* Three-Column Grid */}
    <div className="flex-1 grid grid-cols-[minmax(300px,350px)_minmax(400px,1fr)_minmax(500px,2fr)] gap-4 p-4 overflow-hidden">
      {/* Left Column: AI Picks */}
      <div className="rounded-xl shadow-lg overflow-hidden">
        <AiPicksSkeleton />
      </div>

      {/* Center Column: Opportunity Radar */}
      <div className="rounded-xl shadow-lg overflow-hidden">
        <OpportunityRadarSkeleton />
      </div>

      {/* Right Column: Intelligence Library */}
      <div className="rounded-xl shadow-lg overflow-hidden">
        <IntelligenceLibrarySkeleton />
      </div>
    </div>
  </div>
);

// Add shimmer animation to global styles
const shimmerKeyframes = `
  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

// Inject keyframes (this is a simple way, ideally add to global CSS)
if (typeof document !== 'undefined') {
  const styleId = 'shimmer-animation';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = shimmerKeyframes;
    document.head.appendChild(style);
  }
}
