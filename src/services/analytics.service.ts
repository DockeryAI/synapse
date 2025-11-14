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
    // TODO: Implement actual analytics integration
    // Example: Mixpanel
    // mixpanel.track(event.event, event.properties);

    // Example: PostHog
    // posthog.capture(event.event, event.properties);

    // Example: Amplitude
    // amplitude.track(event.event, event.properties);

    // For now, just log in production
    console.log('[Analytics - Production]', event.event, event.properties);
  }
}

export const analyticsService = new AnalyticsService();
