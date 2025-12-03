/**
 * V5 Insight Persistence Service
 *
 * Handles saving and loading V5 insights to/from the database.
 * Supports:
 * - Saving insights by brand
 * - Loading cached insights
 * - Checking if data needs refresh
 * - Clearing data for refresh
 *
 * Created: 2025-12-01
 */

import { supabase } from '@/utils/supabase/client';
import type { Insight, InsightType } from '@/components/v5/InsightCards';

// ============================================================================
// TYPES
// ============================================================================

export interface V5InsightRow {
  id: string;
  brand_id: string;
  insight_type: string;
  text: string;
  source: string | null;
  category: string | null;
  confidence: number | null;
  relevance_score: number | null;
  quality_score: number | null;
  urgency: number | null;
  metadata: Record<string, any>;
  api_source: string | null;
  fetched_at: string;
  is_stale: boolean;
  created_at: string;
  updated_at: string;
}

export interface RefreshLogRow {
  id: string;
  brand_id: string;
  insight_type: string | null;
  last_refresh_at: string;
  refresh_count: number;
  status: string;
  error_message: string | null;
  insights_loaded: number;
  api_calls_made: number;
}

export interface RefreshStatus {
  lastRefresh: Date | null;
  isStale: boolean;
  insightCount: number;
  byType: Record<string, { count: number; lastRefresh: Date | null }>;
}

// Default staleness threshold: 24 hours
const STALENESS_HOURS = 24;

// ============================================================================
// SAVE INSIGHTS
// ============================================================================

/**
 * Save insights to the database for a brand
 * Falls back to localStorage if database table doesn't exist
 */
export async function saveInsights(
  brandId: string,
  insights: Insight[],
  apiSource?: string
): Promise<{ success: boolean; savedCount: number; error?: string }> {
  try {
    if (!insights || insights.length === 0) {
      console.log('[V5 Persistence] No insights to save');
      return { success: true, savedCount: 0 };
    }

    console.log(`[V5 Persistence] Saving ${insights.length} insights for brand ${brandId}`);

    // ALWAYS save to localStorage first (fast, reliable, works without database)
    saveToLocalStorage(brandId, insights);

    // Transform insights to database rows
    // Note: confidence/relevance/quality scores must be integers in the DB
    const rows = insights.map(insight => ({
      brand_id: brandId,
      insight_type: insight.type,
      text: insight.text,
      source: insight.source || null,
      category: insight.category || null,
      confidence: insight.confidence != null ? Math.round(insight.confidence * 100) : null, // Convert 0-1 to 0-100
      relevance_score: (insight as any).relevanceScore != null ? Math.round((insight as any).relevanceScore * 100) : null,
      quality_score: (insight as any).qualityScore != null ? Math.round((insight as any).qualityScore * 100) : null,
      urgency: insight.urgency || null,
      metadata: extractMetadata(insight),
      api_source: apiSource || null,
      fetched_at: new Date().toISOString(),
      is_stale: false,
    }));

    // Upsert insights (delete old ones of same type first)
    const insightTypes = [...new Set(insights.map(i => i.type))];

    for (const type of insightTypes) {
      // Delete existing insights of this type for this brand
      const { error: deleteError } = await supabase
        .from('v5_insights')
        .delete()
        .eq('brand_id', brandId)
        .eq('insight_type', type);

      // If table doesn't exist, just skip database operations
      if (deleteError && (deleteError.code === '42P01' || deleteError.message?.includes('does not exist') || deleteError.code === 'PGRST116')) {
        console.warn('[V5 Persistence] v5_insights table not deployed - using localStorage only');
        return { success: true, savedCount: insights.length };
      }
    }

    // Insert new insights
    const { error } = await supabase
      .from('v5_insights')
      .insert(rows);

    if (error) {
      // If table doesn't exist, localStorage save was successful
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.code === 'PGRST116') {
        console.warn('[V5 Persistence] v5_insights table not deployed - saved to localStorage only');
        return { success: true, savedCount: insights.length };
      }
      console.error('[V5 Persistence] Save error:', error);
      return { success: true, savedCount: insights.length }; // localStorage succeeded
    }

    // Update refresh log (ignore errors - localStorage is our primary cache now)
    await updateRefreshLog(brandId, null, insights.length, 'success').catch(() => {});

    console.log(`[V5 Persistence] Saved ${insights.length} insights to database + localStorage`);
    return { success: true, savedCount: insights.length };
  } catch (error) {
    console.error('[V5 Persistence] Save error:', error);
    // localStorage was already saved above, so this is still a partial success
    return { success: true, savedCount: insights.length };
  }
}

/**
 * Save insights to localStorage
 */
function saveToLocalStorage(brandId: string, insights: Insight[]): void {
  try {
    const key = `v5_insights_${brandId}`;
    localStorage.setItem(key, JSON.stringify({
      insights,
      timestamp: Date.now(),
    }));
    console.log(`[V5 Persistence] Saved ${insights.length} insights to localStorage`);
  } catch (e) {
    console.warn('[V5 Persistence] localStorage save error:', e);
  }
}

/**
 * Save insights for a specific type only
 */
export async function saveInsightsByType(
  brandId: string,
  insightType: InsightType,
  insights: Insight[],
  apiSource?: string
): Promise<{ success: boolean; savedCount: number; error?: string }> {
  try {
    const filteredInsights = insights.filter(i => i.type === insightType);

    if (filteredInsights.length === 0) {
      console.log(`[V5 Persistence] No ${insightType} insights to save`);
      return { success: true, savedCount: 0 };
    }

    console.log(`[V5 Persistence] Saving ${filteredInsights.length} ${insightType} insights`);

    // Delete existing insights of this type
    await supabase
      .from('v5_insights')
      .delete()
      .eq('brand_id', brandId)
      .eq('insight_type', insightType);

    // Transform and insert
    const rows = filteredInsights.map(insight => ({
      brand_id: brandId,
      insight_type: insight.type,
      text: insight.text,
      source: insight.source || null,
      category: insight.category || null,
      confidence: insight.confidence || null,
      relevance_score: (insight as any).relevanceScore || null,
      quality_score: (insight as any).qualityScore || null,
      urgency: insight.urgency || null,
      metadata: extractMetadata(insight),
      api_source: apiSource || null,
      fetched_at: new Date().toISOString(),
      is_stale: false,
    }));

    const { error } = await supabase
      .from('v5_insights')
      .insert(rows);

    if (error) {
      console.error(`[V5 Persistence] Save ${insightType} error:`, error);
      return { success: false, savedCount: 0, error: error.message };
    }

    // Update type-specific refresh log
    await updateRefreshLog(brandId, insightType, filteredInsights.length, 'success');

    return { success: true, savedCount: filteredInsights.length };
  } catch (error) {
    console.error(`[V5 Persistence] Save ${insightType} error:`, error);
    return {
      success: false,
      savedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// LOAD INSIGHTS
// ============================================================================

/**
 * Load all insights for a brand from the database
 * Falls back to localStorage if database table doesn't exist
 */
export async function loadInsights(brandId: string): Promise<Insight[]> {
  try {
    console.log(`[V5 Persistence] Loading insights for brand ${brandId}`);

    const { data, error } = await supabase
      .from('v5_insights')
      .select('*')
      .eq('brand_id', brandId)
      .eq('is_stale', false)
      .order('fetched_at', { ascending: false });

    if (error) {
      // Check if error is due to table not existing (404/relation does not exist)
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.code === 'PGRST116') {
        console.warn('[V5 Persistence] v5_insights table not deployed yet - using localStorage fallback');
        return loadFromLocalStorage(brandId);
      }
      console.error('[V5 Persistence] Load error:', error);
      return loadFromLocalStorage(brandId);
    }

    if (!data || data.length === 0) {
      console.log('[V5 Persistence] No cached insights in database, checking localStorage...');
      return loadFromLocalStorage(brandId);
    }

    // Transform database rows to Insight objects
    const insights = data.map(transformRowToInsight);
    console.log(`[V5 Persistence] Loaded ${insights.length} cached insights from database`);
    return insights;
  } catch (error) {
    console.error('[V5 Persistence] Load error:', error);
    return loadFromLocalStorage(brandId);
  }
}

/**
 * Load insights from localStorage as fallback
 */
function loadFromLocalStorage(brandId: string): Insight[] {
  try {
    const key = `v5_insights_${brandId}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.insights && parsed.insights.length > 0) {
        // Check if cache is less than 24 hours old
        const cacheAge = Date.now() - (parsed.timestamp || 0);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        if (cacheAge < maxAge) {
          console.log(`[V5 Persistence] Loaded ${parsed.insights.length} insights from localStorage (fallback)`);
          return parsed.insights;
        } else {
          console.log('[V5 Persistence] localStorage cache is stale (>24h)');
        }
      }
    }
  } catch (e) {
    console.warn('[V5 Persistence] localStorage read error:', e);
  }
  console.log('[V5 Persistence] No cached insights found');
  return [];
}

/**
 * Load insights of a specific type
 */
export async function loadInsightsByType(
  brandId: string,
  insightType: InsightType
): Promise<Insight[]> {
  try {
    const { data, error } = await supabase
      .from('v5_insights')
      .select('*')
      .eq('brand_id', brandId)
      .eq('insight_type', insightType)
      .eq('is_stale', false)
      .order('fetched_at', { ascending: false });

    if (error) {
      console.error(`[V5 Persistence] Load ${insightType} error:`, error);
      return [];
    }

    return (data || []).map(transformRowToInsight);
  } catch (error) {
    console.error(`[V5 Persistence] Load ${insightType} error:`, error);
    return [];
  }
}

// ============================================================================
// REFRESH STATUS
// ============================================================================

/**
 * Check if insights exist and when they were last refreshed
 */
export async function getRefreshStatus(brandId: string): Promise<RefreshStatus> {
  try {
    // Get insight counts by type
    const { data: insights, error: insightError } = await supabase
      .from('v5_insights')
      .select('insight_type, fetched_at')
      .eq('brand_id', brandId)
      .eq('is_stale', false);

    if (insightError) {
      console.error('[V5 Persistence] Refresh status error:', insightError);
      return { lastRefresh: null, isStale: true, insightCount: 0, byType: {} };
    }

    const insightCount = insights?.length || 0;

    if (insightCount === 0) {
      return { lastRefresh: null, isStale: true, insightCount: 0, byType: {} };
    }

    // Group by type
    const byType: Record<string, { count: number; lastRefresh: Date | null }> = {};
    let overallLastRefresh: Date | null = null;

    for (const insight of insights || []) {
      const type = insight.insight_type;
      const fetchedAt = new Date(insight.fetched_at);

      if (!byType[type]) {
        byType[type] = { count: 0, lastRefresh: null };
      }
      byType[type].count++;

      if (!byType[type].lastRefresh || fetchedAt > byType[type].lastRefresh) {
        byType[type].lastRefresh = fetchedAt;
      }

      if (!overallLastRefresh || fetchedAt > overallLastRefresh) {
        overallLastRefresh = fetchedAt;
      }
    }

    // Check if stale (older than threshold)
    const isStale = overallLastRefresh
      ? (Date.now() - overallLastRefresh.getTime()) > STALENESS_HOURS * 60 * 60 * 1000
      : true;

    return {
      lastRefresh: overallLastRefresh,
      isStale,
      insightCount,
      byType,
    };
  } catch (error) {
    console.error('[V5 Persistence] Refresh status error:', error);
    return { lastRefresh: null, isStale: true, insightCount: 0, byType: {} };
  }
}

/**
 * Check if brand needs initial data load (no insights exist)
 */
export async function needsInitialLoad(brandId: string): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('v5_insights')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId);

    if (error) {
      console.error('[V5 Persistence] Initial load check error:', error);
      return true;
    }

    return (count || 0) === 0;
  } catch (error) {
    console.error('[V5 Persistence] Initial load check error:', error);
    return true;
  }
}

// ============================================================================
// CLEAR / REFRESH
// ============================================================================

/**
 * Clear all insights for a brand (before refresh)
 */
export async function clearInsights(brandId: string): Promise<boolean> {
  try {
    console.log(`[V5 Persistence] Clearing insights for brand ${brandId}`);

    const { error } = await supabase
      .from('v5_insights')
      .delete()
      .eq('brand_id', brandId);

    if (error) {
      console.error('[V5 Persistence] Clear error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[V5 Persistence] Clear error:', error);
    return false;
  }
}

/**
 * Clear insights of a specific type
 */
export async function clearInsightsByType(
  brandId: string,
  insightType: InsightType
): Promise<boolean> {
  try {
    console.log(`[V5 Persistence] Clearing ${insightType} insights for brand ${brandId}`);

    const { error } = await supabase
      .from('v5_insights')
      .delete()
      .eq('brand_id', brandId)
      .eq('insight_type', insightType);

    if (error) {
      console.error(`[V5 Persistence] Clear ${insightType} error:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[V5 Persistence] Clear ${insightType} error:`, error);
    return false;
  }
}

/**
 * Mark all insights as stale (soft delete before refresh)
 */
export async function markInsightsStale(brandId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('v5_insights')
      .update({ is_stale: true })
      .eq('brand_id', brandId);

    if (error) {
      console.error('[V5 Persistence] Mark stale error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[V5 Persistence] Mark stale error:', error);
    return false;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extract type-specific metadata from insight
 */
function extractMetadata(insight: Insight): Record<string, any> {
  const metadata: Record<string, any> = {};

  // Type-specific fields
  if ('verifiedCustomer' in insight) metadata.verifiedCustomer = insight.verifiedCustomer;
  if ('recencyDays' in insight) metadata.recencyDays = insight.recencyDays;
  if ('velocity' in insight) metadata.velocity = insight.velocity;
  if ('strengthScore' in insight) metadata.strengthScore = insight.strengthScore;
  if ('localRelevance' in insight) metadata.localRelevance = insight.localRelevance;
  if ('eventDate' in insight) metadata.eventDate = insight.eventDate;
  if ('forecast' in insight) metadata.forecast = insight.forecast;
  if ('temp' in insight) metadata.temp = insight.temp;

  return metadata;
}

/**
 * Transform database row to Insight object
 */
function transformRowToInsight(row: V5InsightRow): Insight {
  const insight: Insight = {
    id: row.id,
    type: row.insight_type as InsightType,
    text: row.text,
    source: row.source || undefined,
    category: row.category || undefined,
    confidence: row.confidence || undefined,
    urgency: row.urgency || undefined,
  };

  // Add type-specific fields from metadata
  if (row.relevance_score) (insight as any).relevanceScore = row.relevance_score;
  if (row.quality_score) (insight as any).qualityScore = row.quality_score;

  if (row.metadata) {
    if (row.metadata.verifiedCustomer !== undefined) (insight as any).verifiedCustomer = row.metadata.verifiedCustomer;
    if (row.metadata.recencyDays !== undefined) (insight as any).recencyDays = row.metadata.recencyDays;
    if (row.metadata.velocity !== undefined) (insight as any).velocity = row.metadata.velocity;
    if (row.metadata.strengthScore !== undefined) (insight as any).strengthScore = row.metadata.strengthScore;
    if (row.metadata.localRelevance !== undefined) (insight as any).localRelevance = row.metadata.localRelevance;
    if (row.metadata.eventDate !== undefined) (insight as any).eventDate = row.metadata.eventDate;
    if (row.metadata.forecast !== undefined) (insight as any).forecast = row.metadata.forecast;
    if (row.metadata.temp !== undefined) (insight as any).temp = row.metadata.temp;
  }

  return insight;
}

/**
 * Update refresh log
 */
async function updateRefreshLog(
  brandId: string,
  insightType: string | null,
  insightsLoaded: number,
  status: 'success' | 'partial' | 'failed',
  errorMessage?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('v5_insight_refresh_log')
      .upsert({
        brand_id: brandId,
        insight_type: insightType,
        last_refresh_at: new Date().toISOString(),
        status,
        error_message: errorMessage || null,
        insights_loaded: insightsLoaded,
      }, {
        onConflict: 'brand_id,insight_type',
      });

    if (error) {
      console.warn('[V5 Persistence] Refresh log update error:', error);
    }
  } catch (error) {
    console.warn('[V5 Persistence] Refresh log update error:', error);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const insightPersistenceService = {
  saveInsights,
  saveInsightsByType,
  loadInsights,
  loadInsightsByType,
  getRefreshStatus,
  needsInitialLoad,
  clearInsights,
  clearInsightsByType,
  markInsightsStale,
};

export default insightPersistenceService;
