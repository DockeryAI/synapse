/**
 * Analytics Service
 * Track content generation events for product metrics
 */

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private isProduction = import.meta.env.PROD;

  /**
   * Track an event
   */
  track(event: string, properties?: Record<string, any>): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: new Date(),
    };

    this.events.push(analyticsEvent);

    // Log in development
    if (!this.isProduction) {
      console.log('[Analytics]', event, properties);
    }

    // In production, send to analytics service
    // TODO: Integrate with Mixpanel, Amplitude, or PostHog
    if (this.isProduction) {
      this.sendToAnalytics(analyticsEvent);
    }
  }

  /**
   * Track content generation
   */
  trackContentGeneration(params: {
    count: number;
    industry: string;
    duration: number;
    avgScore: number;
    successCount: number;
  }): void {
    this.track('content_generated', {
      count: params.count,
      industry: params.industry,
      duration_ms: params.duration,
      avg_score: params.avgScore,
      success_count: params.successCount,
      success_rate: (params.successCount / params.count) * 100,
    });
  }

  /**
   * Track regeneration
   */
  trackRegeneration(params: { platform: string; reason?: string }): void {
    this.track('content_regenerated', {
      platform: params.platform,
      reason: params.reason || 'user_request',
    });
  }

  /**
   * Track content publishing
   */
  trackPublish(params: { platform: string; scheduledDate?: string }): void {
    this.track('content_published', {
      platform: params.platform,
      scheduled: !!params.scheduledDate,
      scheduled_date: params.scheduledDate,
    });
  }

  /**
   * Track industry selection
   */
  trackIndustrySelected(industry: string): void {
    this.track('industry_selected', { industry });
  }

  /**
   * Track errors
   */
  trackError(error: {
    type: string;
    message: string;
    context?: Record<string, any>;
  }): void {
    this.track('error_occurred', {
      error_type: error.type,
      error_message: error.message,
      ...error.context,
    });
  }

  // ============================================
  // V3.2 Synthesis Analytics
  // ============================================

  /**
   * Track synthesis context loaded
   */
  trackSynthesisContextLoaded(params: {
    segment: string;
    industry: string;
    eqWeight: number;
    fromCache: boolean;
    loadTimeMs?: number;
  }): void {
    this.track('synthesis_context_loaded', {
      segment: params.segment,
      industry: params.industry,
      eq_weight: params.eqWeight,
      from_cache: params.fromCache,
      load_time_ms: params.loadTimeMs,
    });
  }

  /**
   * Track EQ score distribution for insights
   */
  trackEQScoreDistribution(params: {
    insightCount: number;
    avgEQScore: number;
    minEQScore: number;
    maxEQScore: number;
    segment: string;
  }): void {
    this.track('eq_score_distribution', {
      insight_count: params.insightCount,
      avg_eq_score: params.avgEQScore,
      min_eq_score: params.minEQScore,
      max_eq_score: params.maxEQScore,
      segment: params.segment,
    });
  }

  /**
   * Track when user toggles EQ sort
   */
  trackEQSortToggle(params: {
    enabled: boolean;
    component: string;
    insightCount: number;
  }): void {
    this.track('eq_sort_toggled', {
      enabled: params.enabled,
      component: params.component,
      insight_count: params.insightCount,
    });
  }

  /**
   * Track journey stage change (triggers re-synthesis)
   */
  trackJourneyStageChange(params: {
    fromStage: string;
    toStage: string;
    insightCount: number;
    component: string;
  }): void {
    this.track('journey_stage_changed', {
      from_stage: params.fromStage,
      to_stage: params.toStage,
      insight_count: params.insightCount,
      component: params.component,
    });
  }

  /**
   * Track re-synthesis completion
   */
  trackReSynthesis(params: {
    journeyStage: string;
    insightCount: number;
    durationMs: number;
    success: boolean;
  }): void {
    this.track('resynthesis_completed', {
      journey_stage: params.journeyStage,
      insight_count: params.insightCount,
      duration_ms: params.durationMs,
      success: params.success,
    });
  }

  /**
   * Track synthesis error
   */
  trackSynthesisError(params: {
    errorType: 'context_load' | 'resynthesis' | 'scoring';
    errorMessage: string;
    segment?: string;
    retryAttempt?: number;
  }): void {
    this.track('synthesis_error', {
      error_type: params.errorType,
      error_message: params.errorMessage,
      segment: params.segment,
      retry_attempt: params.retryAttempt,
    });
  }

  /**
   * Track UVP CTA generation
   */
  trackUVPCTAGenerated(params: {
    insightId: string;
    journeyStage: string;
    ctaLength: number;
  }): void {
    this.track('uvp_cta_generated', {
      insight_id: params.insightId,
      journey_stage: params.journeyStage,
      cta_length: params.ctaLength,
    });
  }

  /**
   * Get all events (for debugging)
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Clear events
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * Send to analytics service (production)
   */
  private sendToAnalytics(event: AnalyticsEvent): void {
    try {
      // Send to Google Analytics if available
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', event.event, {
          event_category: event.properties.category || 'general',
          ...event.properties
        });
      }

      // Log structured analytics for potential future integration
      console.log('[Analytics] Event:', {
        event: event.event,
        timestamp: new Date().toISOString(),
        userId: event.userId,
        properties: event.properties
      });

      // Future integrations can be added here:
      // mixpanel.track(event.event, event.properties);
      // posthog.capture(event.event, event.properties);
      // amplitude.track(event.event, event.properties);
    } catch (error) {
      console.error('[Analytics] Failed to send event:', error);
    }
    console.log('[Analytics - Production]', event.event, event.properties);
  }
}

export const analyticsService = new AnalyticsService();
