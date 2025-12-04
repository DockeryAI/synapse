/**
 * Lazy Loading Configuration for Dashboard Components
 * Improves initial load time by code-splitting heavy components
 */

import { lazy } from 'react';

// Dashboard Intelligence Components (Heavy - loaded on demand)
export const LazyOpportunityRadar = lazy(() =>
  import('@/components/dashboard/OpportunityRadar').then(module => ({
    default: module.OpportunityRadar,
  }))
);

export const LazyBreakthroughScoreCard = lazy(() =>
  import('@/components/dashboard/BreakthroughScoreCard').then(module => ({
    default: module.BreakthroughScoreCard,
  }))
);

// Calendar & Content Components
export const LazyContentCalendar = lazy(() =>
  import('@/components/content-calendar/ContentCalendarHub').then(module => ({
    default: module.ContentCalendarHub,
  }))
);

// Loading fallback component
export const ComponentLoader = () => (
  <div className="flex items-center justify-center p-8">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

// Skeleton loader for dashboard cards
export const DashboardCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 animate-pulse">
    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-3" />
    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mb-2" />
    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-5/6" />
  </div>
);

// Intelligence grid skeleton
export const IntelligenceGridSkeleton = () => (
  <div className="grid grid-cols-3 gap-3">
    {Array.from({ length: 12 }).map((_, i) => (
      <div
        key={i}
        className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-3 animate-pulse"
      >
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
        <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
      </div>
    ))}
  </div>
);
