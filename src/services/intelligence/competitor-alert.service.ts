/**
 * Competitor Alert Service
 *
 * Phase 5 - Gap Tab 2.0
 * Handles change detection, alert creation, and notification management.
 * Detects:
 * - New complaints in reviews
 * - New ad campaigns
 * - Positioning changes
 * - New gap opportunities
 *
 * Created: 2025-11-28
 */

import { supabase } from '@/utils/supabase/client';
import type {
  CompetitorAlert,
  CompetitorScan,
  CompetitorGap,
  CompetitorProfile,
  AlertType,
  AlertSeverity,
  AlertEvidence,
  SourceQuote
} from '@/types/competitor-intelligence.types';

// ============================================================================
// TYPES
// ============================================================================

export interface ChangeDetectionResult {
  hasChanges: boolean;
  alerts: NewAlertData[];
  summary: string;
}

export interface NewAlertData {
  alert_type: AlertType;
  title: string;
  description: string;
  severity: AlertSeverity;
  evidence: AlertEvidence;
  competitor_id?: string;
  related_gap_id?: string;
}

export interface ScanComparison {
  competitor_id: string;
  scan_type: string;
  previous_scan?: CompetitorScan;
  current_scan: CompetitorScan;
}

export interface AlertStats {
  total: number;
  unread: number;
  byType: Record<AlertType, number>;
  bySeverity: Record<AlertSeverity, number>;
}

// ============================================================================
// CHANGE DETECTION FUNCTIONS
// ============================================================================

/**
 * Detect new complaints from review scans
 */
function detectNewComplaints(
  previous: CompetitorScan | undefined,
  current: CompetitorScan
): NewAlertData[] {
  const alerts: NewAlertData[] = [];

  const prevWeaknesses = new Set(previous?.extracted_weaknesses || []);
  const newWeaknesses = (current.extracted_weaknesses || []).filter(
    w => !prevWeaknesses.has(w)
  );

  if (newWeaknesses.length > 0) {
    const sentiment = current.sentiment_summary || {};
    const severity: AlertSeverity = newWeaknesses.length >= 3 ? 'high' : newWeaknesses.length >= 2 ? 'medium' : 'low';

    alerts.push({
      alert_type: 'new-complaint',
      title: `${newWeaknesses.length} new complaint theme${newWeaknesses.length > 1 ? 's' : ''} detected`,
      description: `New customer complaints identified: ${newWeaknesses.slice(0, 3).join(', ')}${newWeaknesses.length > 3 ? '...' : ''}`,
      severity,
      evidence: {
        quotes: newWeaknesses.map(w => ({
          quote: w,
          source: current.scan_type.replace('reviews-', ''),
        })),
        previous_value: previous?.extracted_weaknesses?.length || 0,
        new_value: current.extracted_weaknesses?.length || 0,
        comparison_data: {
          negative_count: sentiment.negative_count,
          average_rating: sentiment.average_rating,
          top_negative_themes: sentiment.top_negative_themes
        }
      },
      competitor_id: current.competitor_id
    });
  }

  return alerts;
}

/**
 * Detect new ad campaigns from ad scans
 */
function detectNewAdCampaigns(
  previous: CompetitorScan | undefined,
  current: CompetitorScan
): NewAlertData[] {
  const alerts: NewAlertData[] = [];

  const scanData = current.scan_data as Record<string, unknown>;
  const prevScanData = (previous?.scan_data || {}) as Record<string, unknown>;

  // Check for new ad themes
  const currentThemes = (scanData.messaging_themes || []) as string[];
  const previousThemes = (prevScanData.messaging_themes || []) as string[];
  const newThemes = currentThemes.filter(t => !previousThemes.includes(t));

  // Check for ad count changes
  const currentAdCount = (scanData.ad_count || 0) as number;
  const previousAdCount = (prevScanData.ad_count || 0) as number;
  const adIncrease = currentAdCount - previousAdCount;

  if (newThemes.length > 0 || adIncrease >= 3) {
    const severity: AlertSeverity = adIncrease >= 5 || newThemes.length >= 2 ? 'high' : 'medium';

    alerts.push({
      alert_type: 'new-ad-campaign',
      title: `Competitor ramping up ads${newThemes.length > 0 ? ' with new messaging' : ''}`,
      description: newThemes.length > 0
        ? `New messaging themes detected: ${newThemes.slice(0, 3).join(', ')}`
        : `${adIncrease} new ads detected since last scan`,
      severity,
      evidence: {
        previous_value: { ad_count: previousAdCount, themes: previousThemes },
        new_value: { ad_count: currentAdCount, themes: currentThemes },
        comparison_data: {
          new_themes: newThemes,
          ad_increase: adIncrease,
          platforms: scanData.platforms
        }
      },
      competitor_id: current.competitor_id
    });
  }

  return alerts;
}

/**
 * Detect positioning changes from website scans
 */
function detectPositioningChanges(
  previous: CompetitorScan | undefined,
  current: CompetitorScan
): NewAlertData[] {
  const alerts: NewAlertData[] = [];

  if (!previous) return alerts;

  // Check for claim changes
  const prevClaims = new Set(previous.extracted_claims || []);
  const currClaims = new Set(current.extracted_claims || []);

  const newClaims = (current.extracted_claims || []).filter(c => !prevClaims.has(c));
  const removedClaims = (previous.extracted_claims || []).filter(c => !currClaims.has(c));

  // Check for positioning summary changes
  const positioningChanged = previous.extracted_positioning !== current.extracted_positioning &&
    current.extracted_positioning &&
    previous.extracted_positioning;

  if (newClaims.length > 0 || removedClaims.length > 0 || positioningChanged) {
    const severity: AlertSeverity = positioningChanged ? 'high' : newClaims.length >= 2 ? 'medium' : 'low';

    alerts.push({
      alert_type: 'positioning-change',
      title: 'Competitor updated their positioning',
      description: positioningChanged
        ? 'Significant changes to competitor messaging and positioning detected'
        : newClaims.length > 0
        ? `New claims: ${newClaims.slice(0, 2).join(', ')}`
        : `Removed claims: ${removedClaims.slice(0, 2).join(', ')}`,
      severity,
      evidence: {
        previous_value: {
          positioning: previous.extracted_positioning,
          claims: previous.extracted_claims
        },
        new_value: {
          positioning: current.extracted_positioning,
          claims: current.extracted_claims
        },
        comparison_data: {
          new_claims: newClaims,
          removed_claims: removedClaims,
          positioning_changed: positioningChanged
        }
      },
      competitor_id: current.competitor_id
    });
  }

  return alerts;
}

/**
 * Detect gap opportunities from new gaps
 */
function detectGapOpportunities(
  newGaps: CompetitorGap[],
  competitorId?: string
): NewAlertData[] {
  const alerts: NewAlertData[] = [];

  // High confidence gaps (>= 0.7) become alerts
  const highConfidenceGaps = newGaps.filter(g => g.confidence_score >= 0.7);

  for (const gap of highConfidenceGaps) {
    alerts.push({
      alert_type: 'gap-opportunity',
      title: gap.title,
      description: `New competitive gap: ${gap.the_void}`,
      severity: gap.confidence_score >= 0.85 ? 'high' : 'medium',
      evidence: {
        quotes: gap.source_quotes,
        comparison_data: {
          gap_type: gap.gap_type,
          the_demand: gap.the_demand,
          your_angle: gap.your_angle,
          confidence: gap.confidence_score
        }
      },
      competitor_id: competitorId || gap.competitor_ids[0],
      related_gap_id: gap.id
    });
  }

  return alerts;
}

// ============================================================================
// COMPETITOR ALERT SERVICE CLASS
// ============================================================================

class CompetitorAlertService {

  /**
   * Run change detection comparing new scan to previous scan
   */
  async detectChanges(comparison: ScanComparison): Promise<ChangeDetectionResult> {
    const alerts: NewAlertData[] = [];
    const { previous_scan, current_scan, scan_type } = comparison;

    // Route to appropriate detector based on scan type
    if (scan_type.startsWith('reviews-')) {
      alerts.push(...detectNewComplaints(previous_scan, current_scan));
    } else if (scan_type.startsWith('ads-')) {
      alerts.push(...detectNewAdCampaigns(previous_scan, current_scan));
    } else if (scan_type === 'website') {
      alerts.push(...detectPositioningChanges(previous_scan, current_scan));
    }

    return {
      hasChanges: alerts.length > 0,
      alerts,
      summary: alerts.length > 0
        ? `${alerts.length} change${alerts.length > 1 ? 's' : ''} detected`
        : 'No significant changes detected'
    };
  }

  /**
   * Detect gap opportunities from newly extracted gaps
   */
  detectGapOpportunities(newGaps: CompetitorGap[], competitorId?: string): ChangeDetectionResult {
    const alerts = detectGapOpportunities(newGaps, competitorId);

    return {
      hasChanges: alerts.length > 0,
      alerts,
      summary: alerts.length > 0
        ? `${alerts.length} new gap opportunit${alerts.length > 1 ? 'ies' : 'y'} detected`
        : 'No new gap opportunities'
    };
  }

  /**
   * Create alerts in the database
   */
  async createAlerts(brandId: string, alerts: NewAlertData[]): Promise<CompetitorAlert[]> {
    if (alerts.length === 0) return [];

    const alertRecords = alerts.map(alert => ({
      brand_id: brandId,
      competitor_id: alert.competitor_id || null,
      alert_type: alert.alert_type,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      evidence: alert.evidence,
      related_gap_id: alert.related_gap_id || null,
      is_read: false,
      is_dismissed: false,
      is_actioned: false,
      detected_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('competitor_alerts')
      .insert(alertRecords)
      .select();

    if (error) {
      console.error('[CompetitorAlertService] Failed to create alerts:', error);
      throw error;
    }

    console.log('[CompetitorAlertService] Created alerts:', data?.length);
    return (data || []) as CompetitorAlert[];
  }

  /**
   * Get alerts for a brand
   */
  async getAlerts(
    brandId: string,
    options: {
      unreadOnly?: boolean;
      limit?: number;
      competitorId?: string;
      alertTypes?: AlertType[];
    } = {}
  ): Promise<CompetitorAlert[]> {
    let query = supabase
      .from('competitor_alerts')
      .select('*')
      .eq('brand_id', brandId)
      .eq('is_dismissed', false)
      .order('detected_at', { ascending: false });

    if (options.unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (options.competitorId) {
      query = query.eq('competitor_id', options.competitorId);
    }

    if (options.alertTypes && options.alertTypes.length > 0) {
      query = query.in('alert_type', options.alertTypes);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[CompetitorAlertService] Failed to get alerts:', error);
      throw error;
    }

    return (data || []) as CompetitorAlert[];
  }

  /**
   * Get alert statistics for a brand
   */
  async getAlertStats(brandId: string): Promise<AlertStats> {
    const { data: alerts, error } = await supabase
      .from('competitor_alerts')
      .select('id, alert_type, severity, is_read, is_dismissed')
      .eq('brand_id', brandId)
      .eq('is_dismissed', false);

    if (error) {
      console.error('[CompetitorAlertService] Failed to get alert stats:', error);
      throw error;
    }

    const alertList = alerts || [];
    const stats: AlertStats = {
      total: alertList.length,
      unread: alertList.filter(a => !a.is_read).length,
      byType: {
        'new-complaint': 0,
        'new-ad-campaign': 0,
        'positioning-change': 0,
        'new-feature': 0,
        'news-mention': 0,
        'gap-opportunity': 0
      },
      bySeverity: {
        'low': 0,
        'medium': 0,
        'high': 0
      }
    };

    for (const alert of alertList) {
      if (alert.alert_type in stats.byType) {
        stats.byType[alert.alert_type as AlertType]++;
      }
      if (alert.severity in stats.bySeverity) {
        stats.bySeverity[alert.severity as AlertSeverity]++;
      }
    }

    return stats;
  }

  /**
   * Mark alert as read
   */
  async markAsRead(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('competitor_alerts')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', alertId);

    if (error) {
      console.error('[CompetitorAlertService] Failed to mark alert as read:', error);
      throw error;
    }
  }

  /**
   * Mark all alerts as read for a brand
   */
  async markAllAsRead(brandId: string): Promise<void> {
    const { error } = await supabase
      .from('competitor_alerts')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('brand_id', brandId)
      .eq('is_read', false);

    if (error) {
      console.error('[CompetitorAlertService] Failed to mark all alerts as read:', error);
      throw error;
    }
  }

  /**
   * Dismiss an alert
   */
  async dismissAlert(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('competitor_alerts')
      .update({ is_dismissed: true, updated_at: new Date().toISOString() })
      .eq('id', alertId);

    if (error) {
      console.error('[CompetitorAlertService] Failed to dismiss alert:', error);
      throw error;
    }
  }

  /**
   * Mark alert as actioned (user took action on it)
   */
  async markAsActioned(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('competitor_alerts')
      .update({
        is_actioned: true,
        is_read: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) {
      console.error('[CompetitorAlertService] Failed to mark alert as actioned:', error);
      throw error;
    }
  }

  /**
   * Get the previous scan for comparison
   */
  async getPreviousScan(
    competitorId: string,
    scanType: string
  ): Promise<CompetitorScan | null> {
    const { data, error } = await supabase
      .from('competitor_scans')
      .select('*')
      .eq('competitor_id', competitorId)
      .eq('scan_type', scanType)
      .order('scanned_at', { ascending: false })
      .limit(2);

    if (error) {
      console.error('[CompetitorAlertService] Failed to get previous scan:', error);
      return null;
    }

    // Return the second most recent scan (first is current)
    return (data && data.length > 1 ? data[1] : null) as CompetitorScan | null;
  }

  /**
   * Run full change detection for a competitor after a scan
   */
  async runChangeDetectionAfterScan(
    brandId: string,
    competitorId: string,
    currentScan: CompetitorScan
  ): Promise<ChangeDetectionResult> {
    const previousScan = await this.getPreviousScan(competitorId, currentScan.scan_type);

    const result = await this.detectChanges({
      competitor_id: competitorId,
      scan_type: currentScan.scan_type,
      previous_scan: previousScan || undefined,
      current_scan: currentScan
    });

    // Create alerts if changes detected
    if (result.hasChanges) {
      await this.createAlerts(brandId, result.alerts);
    }

    return result;
  }

  /**
   * Clean up old alerts (older than 30 days and read)
   */
  async cleanupOldAlerts(brandId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('competitor_alerts')
      .delete()
      .eq('brand_id', brandId)
      .eq('is_read', true)
      .lt('detected_at', thirtyDaysAgo.toISOString())
      .select('id');

    if (error) {
      console.error('[CompetitorAlertService] Failed to cleanup old alerts:', error);
      return 0;
    }

    return data?.length || 0;
  }
}

// Singleton export
export const competitorAlertService = new CompetitorAlertService();

export default competitorAlertService;
