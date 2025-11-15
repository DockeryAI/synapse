/**
 * Signal Detection Service - Detects and aggregates all types of signals
 * Phase 15: Background Jobs and Enrichment Engine
 */

import { supabase } from '@/lib/supabase';
import type { Signal } from '@/types/enrichment.types';
import { OpportunityDetection } from './opportunity-detection';
import { CompetitiveMonitoring } from './competitive-monitoring';

export class SignalDetection {
  /**
   * Detect all signals for a brand - opportunities, threats, trends, anomalies
   */
  static async detectAllSignals(brandId: string): Promise<Signal[]> {
    const signals: Signal[] = [];

    try {
      // Run all detection methods in parallel
      const [opportunities, competitiveShifts, performanceAnomalies, trends] =
        await Promise.allSettled([
          this.detectOpportunitySignals(brandId),
          this.detectCompetitiveSignals(brandId),
          this.detectPerformanceAnomalies(brandId),
          this.detectTrendSignals(brandId),
        ]);

      // Collect all successful results
      if (opportunities.status === 'fulfilled') {
        signals.push(...opportunities.value);
      }
      if (competitiveShifts.status === 'fulfilled') {
        signals.push(...competitiveShifts.value);
      }
      if (performanceAnomalies.status === 'fulfilled') {
        signals.push(...performanceAnomalies.value);
      }
      if (trends.status === 'fulfilled') {
        signals.push(...trends.value);
      }

      // Sort by severity and requires_action
      signals.sort((a, b) => {
        if (a.requires_action !== b.requires_action) {
          return a.requires_action ? -1 : 1;
        }

        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });

      // Store signals
      await this.storeSignals(brandId, signals);
    } catch (error) {
      console.error('Error detecting signals:', error);
    }

    return signals;
  }

  /**
   * Convert opportunities to signals
   */
  private static async detectOpportunitySignals(
    brandId: string
  ): Promise<Signal[]> {
    const signals: Signal[] = [];

    try {
      const opportunities = await OpportunityDetection.getAllOpportunities(
        brandId
      );

      for (const opp of opportunities) {
        signals.push({
          id: crypto.randomUUID(),
          brand_id: brandId,
          signal_type: 'opportunity',
          title: opp.title,
          description: opp.description,
          severity: this.mapUrgencyToSeverity(opp.urgency),
          source: opp.source,
          detected_at: opp.detected_at,
          requires_action: opp.urgency === 'critical' || opp.urgency === 'high',
          suggested_actions: opp.action_items,
          metadata: {
            opportunity_type: opp.type,
            expires_at: opp.expires_at,
            confidence_score: opp.confidence_score,
            ...opp.context,
          },
        });
      }
    } catch (error) {
      console.error('Error detecting opportunity signals:', error);
    }

    return signals;
  }

  /**
   * Detect competitive threat signals
   */
  private static async detectCompetitiveSignals(
    brandId: string
  ): Promise<Signal[]> {
    const signals: Signal[] = [];

    try {
      const messagingShifts =
        await CompetitiveMonitoring.detectMessagingShifts(brandId);

      for (const shift of messagingShifts) {
        signals.push({
          id: crypto.randomUUID(),
          brand_id: brandId,
          signal_type: 'threat',
          title: `Competitor Messaging Shift: ${shift.competitor}`,
          description: shift.impact_assessment,
          severity: 'medium',
          source: 'competitive_monitoring',
          detected_at: new Date().toISOString(),
          requires_action: true,
          suggested_actions: [
            shift.recommended_action,
            'Review our positioning',
            'Update competitive response plan',
          ],
          metadata: {
            competitor: shift.competitor,
            shift_type: shift.shift_type,
            previous_messaging: shift.previous_messaging,
            new_messaging: shift.new_messaging,
          },
        });
      }
    } catch (error) {
      console.error('Error detecting competitive signals:', error);
    }

    return signals;
  }

  /**
   * Detect performance anomalies (unusual spikes or drops)
   */
  private static async detectPerformanceAnomalies(
    brandId: string
  ): Promise<Signal[]> {
    const signals: Signal[] = [];

    try {
      // Get recent analytics data
      const { data: recentMetrics } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('brand_id', brandId)
        .gte(
          'created_at',
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        )
        .order('created_at', { ascending: false });

      if (!recentMetrics || recentMetrics.length === 0) {
        return signals;
      }

      // Analyze for anomalies
      const anomalies = this.analyzeForAnomalies(recentMetrics);

      for (const anomaly of anomalies) {
        signals.push({
          id: crypto.randomUUID(),
          brand_id: brandId,
          signal_type: 'anomaly',
          title: anomaly.title,
          description: anomaly.description,
          severity: anomaly.severity,
          source: 'analytics_monitoring',
          detected_at: new Date().toISOString(),
          requires_action: anomaly.severity === 'critical' || anomaly.severity === 'high',
          suggested_actions: anomaly.suggested_actions,
          metadata: anomaly.metadata,
        });
      }
    } catch (error) {
      console.error('Error detecting performance anomalies:', error);
    }

    return signals;
  }

  /**
   * Detect trend signals
   */
  private static async detectTrendSignals(brandId: string): Promise<Signal[]> {
    const signals: Signal[] = [];

    try {
      // Get learning patterns to identify trends
      const { data: patterns } = await supabase
        .from('learning_patterns')
        .select('*')
        .eq('brand_id', brandId)
        .gte('confidence_score', 0.7)
        .gte(
          'updated_at',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        );

      if (!patterns || patterns.length === 0) {
        return signals;
      }

      // Convert high-confidence patterns to trend signals
      for (const pattern of patterns) {
        signals.push({
          id: crypto.randomUUID(),
          brand_id: brandId,
          signal_type: 'trend',
          title: `Trend Detected: ${pattern.category}`,
          description: pattern.insight,
          severity: 'low',
          source: 'learning_engine',
          detected_at: new Date().toISOString(),
          requires_action: false,
          suggested_actions: [pattern.actionable_recommendation],
          metadata: {
            pattern_type: pattern.pattern_type,
            confidence_score: pattern.confidence_score,
            data_points: pattern.data_points,
          },
        });
      }
    } catch (error) {
      console.error('Error detecting trend signals:', error);
    }

    return signals;
  }

  /**
   * Store signals in database
   */
  private static async storeSignals(
    brandId: string,
    signals: Signal[]
  ): Promise<void> {
    try {
      if (signals.length === 0) return;

      await supabase.from('intelligence_signals').insert(
        signals.map((signal) => ({
          id: signal.id,
          brand_id: signal.brand_id,
          signal_type: signal.signal_type,
          title: signal.title,
          description: signal.description,
          severity: signal.severity,
          source: signal.source,
          detected_at: signal.detected_at,
          requires_action: signal.requires_action,
          suggested_actions: signal.suggested_actions,
          metadata: signal.metadata,
        }))
      );
    } catch (error) {
      console.error('Error storing signals:', error);
    }
  }

  /**
   * Get active signals for a brand
   */
  static async getActiveSignals(brandId: string): Promise<Signal[]> {
    try {
      const { data } = await supabase
        .from('intelligence_signals')
        .select('*')
        .eq('brand_id', brandId)
        .eq('is_dismissed', false)
        .gte(
          'detected_at',
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        )
        .order('detected_at', { ascending: false });

      return (data as Signal[]) || [];
    } catch (error) {
      console.error('Error getting active signals:', error);
      return [];
    }
  }

  /**
   * Dismiss a signal
   */
  static async dismissSignal(signalId: string): Promise<void> {
    try {
      await supabase
        .from('intelligence_signals')
        .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
        .eq('id', signalId);
    } catch (error) {
      console.error('Error dismissing signal:', error);
      throw error;
    }
  }

  // Helper methods

  private static mapUrgencyToSeverity(
    urgency: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    const map: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      low: 'low',
      medium: 'medium',
      high: 'high',
      critical: 'critical',
    };
    return map[urgency] || 'medium';
  }

  private static analyzeForAnomalies(metrics: any[]): Array<{
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    suggested_actions: string[];
    metadata: Record<string, any>;
  }> {
    const anomalies: Array<{
      title: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      suggested_actions: string[];
      metadata: Record<string, any>;
    }> = [];

    // Calculate baseline metrics
    const baseline = {
      avg_engagement: 0,
      avg_impressions: 0,
      avg_clicks: 0,
    };

    if (metrics.length < 10) return anomalies; // Need enough data

    // Calculate averages
    baseline.avg_engagement =
      metrics.reduce((sum, m) => sum + (m.engagement_rate || 0), 0) /
      metrics.length;
    baseline.avg_impressions =
      metrics.reduce((sum, m) => sum + (m.impressions || 0), 0) / metrics.length;
    baseline.avg_clicks =
      metrics.reduce((sum, m) => sum + (m.clicks || 0), 0) / metrics.length;

    // Check recent metrics for anomalies
    const recentMetrics = metrics.slice(0, 5);

    for (const metric of recentMetrics) {
      const engagementRate = metric.engagement_rate || 0;

      // Significant drop in engagement (>50% below baseline)
      if (
        engagementRate < baseline.avg_engagement * 0.5 &&
        baseline.avg_engagement > 0
      ) {
        anomalies.push({
          title: 'Engagement Drop Detected',
          description: `Engagement rate dropped to ${engagementRate.toFixed(2)}% (baseline: ${baseline.avg_engagement.toFixed(2)}%)`,
          severity: 'high',
          suggested_actions: [
            'Review recent content changes',
            'Check posting times',
            'Analyze audience feedback',
          ],
          metadata: {
            current_rate: engagementRate,
            baseline_rate: baseline.avg_engagement,
            drop_percentage: ((1 - engagementRate / baseline.avg_engagement) * 100).toFixed(1),
          },
        });
      }

      // Significant spike in engagement (>200% above baseline)
      if (
        engagementRate > baseline.avg_engagement * 2 &&
        baseline.avg_engagement > 0
      ) {
        anomalies.push({
          title: 'Engagement Spike Detected',
          description: `Engagement rate spiked to ${engagementRate.toFixed(2)}% (baseline: ${baseline.avg_engagement.toFixed(2)}%)`,
          severity: 'medium',
          suggested_actions: [
            'Identify what drove the spike',
            'Replicate successful elements',
            'Capture momentum with follow-up content',
          ],
          metadata: {
            current_rate: engagementRate,
            baseline_rate: baseline.avg_engagement,
            spike_percentage: ((engagementRate / baseline.avg_engagement - 1) * 100).toFixed(1),
          },
        });
      }
    }

    return anomalies;
  }
}
