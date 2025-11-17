/**
 * Analytics Services
 *
 * Export all analytics-related services for tracking and insights.
 */

// Funnel Tracker
export {
  FunnelTracker,
  getFunnelTracker,
  resetFunnelTracker,
  formatDuration,
  getConversionRateColor,
} from './funnel-tracker.service';

export type {
  OnboardingStep,
  CampaignStep,
  PublishingStep,
  FunnelEventType,
  FunnelEvent,
  FunnelMetrics,
  StepMetrics,
  DropOffPoint,
  SessionSummary,
} from './funnel-tracker.service';
