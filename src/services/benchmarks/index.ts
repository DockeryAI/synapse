/**
 * Performance Benchmarks - Service Exports
 * Industry benchmarks, Day 3 pivots, and scheduling optimization
 */

export { IndustryBenchmarkDatabase, industryBenchmarkDatabase } from './IndustryBenchmarkDatabase';
export { Day3PivotService, day3PivotService } from './Day3PivotService';
export { SchedulingOptimizationService, schedulingOptimizationService } from './SchedulingOptimizationService';

// Re-export types for convenience
export type {
  IndustryBenchmark,
  PlatformBenchmark,
  ContentTypeBenchmark,
  ConversionBenchmark,
  AdCostBenchmark,
  OptimalPostingTimes,
  BenchmarkRange,
  PerformanceMetrics,
  BenchmarkComparison,
  PerformanceReport,
  PivotTrigger,
  PivotRecommendation,
  PivotStrategy,
  PivotAction,
  PivotReason,
  AutoPivotConfig,
  SchedulingRecommendation,
  TimeSlot,
  AudienceActivityPattern,
  PostSchedule,
  BenchmarkDashboardData,
  VisualIndicator,
  BusinessContext,
  SocialPlatform,
  ContentType,
  ServiceResponse,
} from '../../types/benchmarks.types';
