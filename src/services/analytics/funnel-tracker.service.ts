/**
 * Funnel Tracker Service
 *
 * Tracks user journey through onboarding, campaign generation, and publishing funnels.
 * Stores all events in Supabase analytics_events table for conversion analysis.
 *
 * Funnels Tracked:
 * 1. Onboarding: URL input → extraction → confirmation → insights → suggestions → generation
 * 2. Campaign Generation: Type selection → generation → editing → scheduling
 * 3. Publishing: Scheduling → publishing success/failure
 */

import { supabase } from '@/lib/supabase';

//=============================================================================
// Types & Interfaces
//=============================================================================

/**
 * Onboarding funnel steps
 */
export type OnboardingStep =
  | 'url_input'
  | 'extraction_started'
  | 'extraction_complete'
  | 'confirmation_viewed'
  | 'confirmation_confirmed'
  | 'insights_viewed'
  | 'suggestions_viewed'
  | 'campaign_selected'
  | 'post_selected'
  | 'generation_started'
  | 'generation_complete'
  | 'preview_viewed';

/**
 * Campaign generation funnel steps
 */
export type CampaignStep =
  | 'type_selector_viewed'
  | 'type_selected'
  | 'customization_viewed'
  | 'generation_started'
  | 'generation_complete'
  | 'preview_viewed'
  | 'editing_started'
  | 'post_edited'
  | 'schedule_started'
  | 'schedule_complete';

/**
 * Publishing funnel steps
 */
export type PublishingStep =
  | 'schedule_initiated'
  | 'schedule_success'
  | 'schedule_failed'
  | 'publish_started'
  | 'publish_success'
  | 'publish_failed'
  | 'retry_attempted';

/**
 * Combined event type
 */
export type FunnelEventType = 'onboarding' | 'campaign' | 'publishing';

/**
 * Funnel event interface
 */
export interface FunnelEvent {
  eventType: FunnelEventType;
  step: OnboardingStep | CampaignStep | PublishingStep;
  userId?: string;
  brandId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

/**
 * Conversion metrics for a funnel
 */
export interface FunnelMetrics {
  funnelType: FunnelEventType;
  totalSessions: number;
  stepMetrics: StepMetrics[];
  overallConversionRate: number;
  dropOffPoints: DropOffPoint[];
  averageTimeToComplete: number; // in seconds
}

/**
 * Metrics for a specific step
 */
export interface StepMetrics {
  step: string;
  entered: number;
  completed: number;
  conversionRate: number;
  averageTimeSpent: number; // seconds
  dropOffRate: number;
}

/**
 * Drop-off point analysis
 */
export interface DropOffPoint {
  fromStep: string;
  toStep: string;
  dropOffCount: number;
  dropOffRate: number;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Session summary
 */
export interface SessionSummary {
  sessionId: string;
  userId?: string;
  brandId?: string;
  startedAt: Date;
  completedAt?: Date;
  steps: string[];
  completed: boolean;
  funnelType: FunnelEventType;
}

//=============================================================================
// Funnel Tracker Service
//=============================================================================

export class FunnelTracker {
  private sessionId: string;
  private userId?: string;
  private brandId?: string;

  constructor(sessionId?: string, userId?: string, brandId?: string) {
    this.sessionId = sessionId || this.generateSessionId();
    this.userId = userId;
    this.brandId = brandId;
  }

  /**
   * Track onboarding event
   */
  async trackOnboardingStep(
    step: OnboardingStep,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'onboarding',
      step,
      metadata,
    });
  }

  /**
   * Track campaign generation event
   */
  async trackCampaignStep(
    step: CampaignStep,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'campaign',
      step,
      metadata,
    });
  }

  /**
   * Track publishing event
   */
  async trackPublishingStep(
    step: PublishingStep,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'publishing',
      step,
      metadata,
    });
  }

  /**
   * Core event tracking method
   */
  private async trackEvent(event: FunnelEvent): Promise<void> {
    try {
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          event_type: `funnel_${event.eventType}`,
          event_data: {
            step: event.step,
            sessionId: this.sessionId,
            userId: this.userId,
            brandId: this.brandId,
            metadata: event.metadata,
            timestamp: new Date().toISOString(),
          },
          brand_id: this.brandId,
        });

      if (error) {
        console.error('[FunnelTracker] Failed to track event:', error);
        // Don't throw - analytics failures shouldn't break the app
      } else {
        console.log(`[FunnelTracker] ${event.eventType}/${event.step} tracked`);
      }
    } catch (error) {
      console.error('[FunnelTracker] Track event error:', error);
    }
  }

  /**
   * Get session ID for current user
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Set brand ID for tracking
   */
  setBrandId(brandId: string): void {
    this.brandId = brandId;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  //===========================================================================
  // Static Analysis Methods
  //===========================================================================

  /**
   * Get funnel metrics for a specific funnel type
   */
  static async getFunnelMetrics(
    funnelType: FunnelEventType,
    brandId?: string,
    timeframe: '7d' | '30d' | '90d' = '30d'
  ): Promise<FunnelMetrics> {
    const daysAgo = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    try {
      let query = supabase
        .from('analytics_events')
        .select('event_data, created_at')
        .eq('event_type', `funnel_${funnelType}`)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: true });

      if (brandId) {
        query = query.eq('brand_id', brandId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[FunnelTracker] Failed to fetch metrics:', error);
        throw error;
      }

      // Group events by session
      const sessionMap = new Map<string, any[]>();
      data?.forEach((event) => {
        const sessionId = event.event_data?.sessionId;
        if (sessionId) {
          if (!sessionMap.has(sessionId)) {
            sessionMap.set(sessionId, []);
          }
          sessionMap.get(sessionId)!.push(event);
        }
      });

      const totalSessions = sessionMap.size;

      // Calculate step metrics
      const stepCounts = new Map<string, { entered: number; completed: number }>();
      const stepTimes = new Map<string, number[]>();

      sessionMap.forEach((events) => {
        events.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        events.forEach((event, index) => {
          const step = event.event_data?.step;
          if (!step) return;

          // Count entries
          if (!stepCounts.has(step)) {
            stepCounts.set(step, { entered: 0, completed: 0 });
          }
          stepCounts.get(step)!.entered++;

          // Calculate time spent
          if (index < events.length - 1) {
            const timeSpent =
              (new Date(events[index + 1].created_at).getTime() -
                new Date(event.created_at).getTime()) /
              1000;
            if (!stepTimes.has(step)) {
              stepTimes.set(step, []);
            }
            stepTimes.get(step)!.push(timeSpent);
          }
        });

        // Mark last step as completed
        if (events.length > 0) {
          const lastStep = events[events.length - 1].event_data?.step;
          if (lastStep && stepCounts.has(lastStep)) {
            stepCounts.get(lastStep)!.completed++;
          }
        }
      });

      // Build step metrics
      const stepMetrics: StepMetrics[] = Array.from(stepCounts.entries()).map(
        ([step, counts]) => {
          const times = stepTimes.get(step) || [];
          const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

          return {
            step,
            entered: counts.entered,
            completed: counts.completed,
            conversionRate: counts.entered > 0 ? (counts.completed / counts.entered) * 100 : 0,
            averageTimeSpent: avgTime,
            dropOffRate: counts.entered > 0 ? ((counts.entered - counts.completed) / counts.entered) * 100 : 0,
          };
        }
      );

      // Sort by order of steps
      stepMetrics.sort((a, b) => {
        const stepOrder = this.getStepOrder(funnelType);
        return stepOrder.indexOf(a.step) - stepOrder.indexOf(b.step);
      });

      // Calculate overall conversion rate
      const firstStep = stepMetrics[0];
      const lastStep = stepMetrics[stepMetrics.length - 1];
      const overallConversionRate =
        firstStep && lastStep && firstStep.entered > 0
          ? (lastStep.completed / firstStep.entered) * 100
          : 0;

      // Identify drop-off points
      const dropOffPoints = this.calculateDropOffPoints(stepMetrics);

      // Calculate average time to complete
      const completedSessions = Array.from(sessionMap.values()).filter(
        (events) => events.length > 1
      );
      const completionTimes = completedSessions.map((events) => {
        const first = new Date(events[0].created_at);
        const last = new Date(events[events.length - 1].created_at);
        return (last.getTime() - first.getTime()) / 1000;
      });
      const averageTimeToComplete =
        completionTimes.length > 0
          ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
          : 0;

      return {
        funnelType,
        totalSessions,
        stepMetrics,
        overallConversionRate,
        dropOffPoints,
        averageTimeToComplete,
      };
    } catch (error) {
      console.error('[FunnelTracker] Get funnel metrics error:', error);
      throw error;
    }
  }

  /**
   * Get sessions for a funnel type
   */
  static async getSessions(
    funnelType: FunnelEventType,
    brandId?: string,
    limit: number = 100
  ): Promise<SessionSummary[]> {
    try {
      let query = supabase
        .from('analytics_events')
        .select('event_data, created_at')
        .eq('event_type', `funnel_${funnelType}`)
        .order('created_at', { ascending: false })
        .limit(limit * 10); // Get more events to account for multiple events per session

      if (brandId) {
        query = query.eq('brand_id', brandId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[FunnelTracker] Failed to fetch sessions:', error);
        return [];
      }

      // Group by session
      const sessionMap = new Map<string, any[]>();
      data?.forEach((event) => {
        const sessionId = event.event_data?.sessionId;
        if (sessionId) {
          if (!sessionMap.has(sessionId)) {
            sessionMap.set(sessionId, []);
          }
          sessionMap.get(sessionId)!.push(event);
        }
      });

      // Build session summaries
      const sessions: SessionSummary[] = Array.from(sessionMap.entries())
        .map(([sessionId, events]) => {
          events.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

          const firstEvent = events[0];
          const lastEvent = events[events.length - 1];
          const steps = events.map((e) => e.event_data?.step).filter(Boolean);

          // Determine if session is completed (reached final step)
          const finalSteps = this.getFinalSteps(funnelType);
          const completed = steps.some((step) => finalSteps.includes(step));

          return {
            sessionId,
            userId: firstEvent.event_data?.userId,
            brandId: firstEvent.event_data?.brandId,
            startedAt: new Date(firstEvent.created_at),
            completedAt: completed ? new Date(lastEvent.created_at) : undefined,
            steps,
            completed,
            funnelType,
          };
        })
        .slice(0, limit);

      return sessions;
    } catch (error) {
      console.error('[FunnelTracker] Get sessions error:', error);
      return [];
    }
  }

  /**
   * Helper: Get step order for a funnel type
   */
  private static getStepOrder(funnelType: FunnelEventType): string[] {
    switch (funnelType) {
      case 'onboarding':
        return [
          'url_input',
          'extraction_started',
          'extraction_complete',
          'confirmation_viewed',
          'confirmation_confirmed',
          'insights_viewed',
          'suggestions_viewed',
          'campaign_selected',
          'post_selected',
          'generation_started',
          'generation_complete',
          'preview_viewed',
        ];
      case 'campaign':
        return [
          'type_selector_viewed',
          'type_selected',
          'customization_viewed',
          'generation_started',
          'generation_complete',
          'preview_viewed',
          'editing_started',
          'post_edited',
          'schedule_started',
          'schedule_complete',
        ];
      case 'publishing':
        return [
          'schedule_initiated',
          'schedule_success',
          'schedule_failed',
          'publish_started',
          'publish_success',
          'publish_failed',
          'retry_attempted',
        ];
      default:
        return [];
    }
  }

  /**
   * Helper: Get final steps for a funnel
   */
  private static getFinalSteps(funnelType: FunnelEventType): string[] {
    switch (funnelType) {
      case 'onboarding':
        return ['generation_complete', 'preview_viewed'];
      case 'campaign':
        return ['schedule_complete'];
      case 'publishing':
        return ['publish_success'];
      default:
        return [];
    }
  }

  /**
   * Helper: Calculate drop-off points
   */
  private static calculateDropOffPoints(stepMetrics: StepMetrics[]): DropOffPoint[] {
    const dropOffPoints: DropOffPoint[] = [];

    for (let i = 0; i < stepMetrics.length - 1; i++) {
      const currentStep = stepMetrics[i];
      const nextStep = stepMetrics[i + 1];

      const dropOffCount = currentStep.entered - nextStep.entered;
      const dropOffRate = currentStep.entered > 0 ? (dropOffCount / currentStep.entered) * 100 : 0;

      // Only include significant drop-offs (>10%)
      if (dropOffRate > 10) {
        dropOffPoints.push({
          fromStep: currentStep.step,
          toStep: nextStep.step,
          dropOffCount,
          dropOffRate,
          priority: dropOffRate > 40 ? 'high' : dropOffRate > 25 ? 'medium' : 'low',
        });
      }
    }

    // Sort by drop-off rate (highest first)
    dropOffPoints.sort((a, b) => b.dropOffRate - a.dropOffRate);

    return dropOffPoints;
  }
}

//=============================================================================
// Utility Functions
//=============================================================================

/**
 * Create singleton instance for global use
 */
let funnelTrackerInstance: FunnelTracker | null = null;

export function getFunnelTracker(userId?: string, brandId?: string): FunnelTracker {
  if (!funnelTrackerInstance) {
    funnelTrackerInstance = new FunnelTracker(undefined, userId, brandId);
  } else {
    if (userId) funnelTrackerInstance.setUserId(userId);
    if (brandId) funnelTrackerInstance.setBrandId(brandId);
  }
  return funnelTrackerInstance;
}

/**
 * Reset singleton instance (useful for testing)
 */
export function resetFunnelTracker(): void {
  funnelTrackerInstance = null;
}

/**
 * Format time duration
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
}

/**
 * Get conversion rate color
 */
export function getConversionRateColor(rate: number): string {
  if (rate >= 80) return 'green';
  if (rate >= 60) return 'yellow';
  if (rate >= 40) return 'orange';
  return 'red';
}
