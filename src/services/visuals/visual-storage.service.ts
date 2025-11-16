/**
 * VISUAL STORAGE SERVICE
 *
 * Handles persistence of generated campaign visuals to Supabase
 * Manages visual metadata, campaign associations, and retrieval
 *
 * Philosophy: "Cache locally, persist globally"
 */

import { supabase } from '../../lib/supabase';
import type { GeneratedVisual } from '../../types/campaign-visual.types';
import type { CampaignTypeId } from '../../types/campaign.types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Database row for generated visuals
 */
export interface GeneratedVisualRow {
  id: string;
  brand_id: string;
  campaign_id?: string | null;
  campaign_type: CampaignTypeId;
  platform: string;
  format: string;
  image_url: string;
  bannerbear_uid: string;
  template_id: string;
  content_snapshot: Record<string, any>; // Snapshot of content used
  dimensions: { width: number; height: number };
  aspect_ratio: string;
  generation_time_ms: number;
  status: 'pending' | 'completed' | 'failed';
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaveVisualParams {
  visual: GeneratedVisual;
  brandId: string;
  campaignId?: string;
  contentSnapshot?: Record<string, any>;
}

export interface QueryVisualsParams {
  brandId: string;
  campaignId?: string;
  campaignType?: CampaignTypeId;
  platform?: string;
  limit?: number;
}

// ============================================================================
// VISUAL STORAGE SERVICE
// ============================================================================

class VisualStorageService {
  private readonly TABLE_NAME = 'generated_visuals';

  /**
   * Save a generated visual to database
   */
  async saveVisual(params: SaveVisualParams): Promise<GeneratedVisualRow | null> {
    const { visual, brandId, campaignId, contentSnapshot } = params;

    try {
      const row: Partial<GeneratedVisualRow> = {
        id: visual.id,
        brand_id: brandId,
        campaign_id: campaignId || null,
        campaign_type: visual.campaignType,
        platform: visual.platform,
        format: visual.format,
        image_url: visual.imageUrl,
        bannerbear_uid: visual.bannerbearUid,
        template_id: visual.templateId,
        content_snapshot: contentSnapshot || {},
        dimensions: visual.metadata.dimensions,
        aspect_ratio: visual.metadata.aspectRatio,
        generation_time_ms: visual.metadata.generationTime,
        status: visual.status,
        error_message: visual.error || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert(row)
        .select()
        .single();

      if (error) {
        console.error('[VisualStorage] Failed to save visual:', error);
        return null;
      }

      console.log(`[VisualStorage] ✓ Saved visual ${visual.id} for ${visual.platform}`);
      return data as GeneratedVisualRow;

    } catch (error) {
      console.error('[VisualStorage] Error saving visual:', error);
      return null;
    }
  }

  /**
   * Save multiple visuals (batch)
   */
  async saveVisuals(visuals: SaveVisualParams[]): Promise<GeneratedVisualRow[]> {
    const results: GeneratedVisualRow[] = [];

    for (const params of visuals) {
      const result = await this.saveVisual(params);
      if (result) {
        results.push(result);
      }
    }

    console.log(`[VisualStorage] Saved ${results.length}/${visuals.length} visuals`);
    return results;
  }

  /**
   * Get visuals by query parameters
   */
  async queryVisuals(params: QueryVisualsParams): Promise<GeneratedVisualRow[]> {
    const { brandId, campaignId, campaignType, platform, limit = 100 } = params;

    try {
      let query = supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      if (campaignType) {
        query = query.eq('campaign_type', campaignType);
      }

      if (platform) {
        query = query.eq('platform', platform);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[VisualStorage] Query failed:', error);
        return [];
      }

      return (data || []) as GeneratedVisualRow[];

    } catch (error) {
      console.error('[VisualStorage] Query error:', error);
      return [];
    }
  }

  /**
   * Get visuals for a specific campaign
   */
  async getCampaignVisuals(campaignId: string): Promise<GeneratedVisualRow[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('campaign_id', campaignId)
        .order('platform', { ascending: true });

      if (error) {
        console.error('[VisualStorage] Failed to get campaign visuals:', error);
        return [];
      }

      return (data || []) as GeneratedVisualRow[];

    } catch (error) {
      console.error('[VisualStorage] Error getting campaign visuals:', error);
      return [];
    }
  }

  /**
   * Get latest visuals for each platform
   */
  async getLatestVisualsByPlatform(
    brandId: string,
    campaignType?: CampaignTypeId
  ): Promise<Record<string, GeneratedVisualRow>> {
    const params: QueryVisualsParams = { brandId, limit: 1000 };
    if (campaignType) {
      params.campaignType = campaignType;
    }

    const visuals = await this.queryVisuals(params);

    // Group by platform and take latest
    const byPlatform: Record<string, GeneratedVisualRow> = {};
    for (const visual of visuals) {
      if (!byPlatform[visual.platform] ||
          new Date(visual.created_at) > new Date(byPlatform[visual.platform].created_at)) {
        byPlatform[visual.platform] = visual;
      }
    }

    return byPlatform;
  }

  /**
   * Delete a visual by ID
   */
  async deleteVisual(visualId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', visualId);

      if (error) {
        console.error('[VisualStorage] Failed to delete visual:', error);
        return false;
      }

      console.log(`[VisualStorage] ✓ Deleted visual ${visualId}`);
      return true;

    } catch (error) {
      console.error('[VisualStorage] Delete error:', error);
      return false;
    }
  }

  /**
   * Delete all visuals for a campaign
   */
  async deleteCampaignVisuals(campaignId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('campaign_id', campaignId)
        .select();

      if (error) {
        console.error('[VisualStorage] Failed to delete campaign visuals:', error);
        return 0;
      }

      const count = data?.length || 0;
      console.log(`[VisualStorage] ✓ Deleted ${count} visuals for campaign ${campaignId}`);
      return count;

    } catch (error) {
      console.error('[VisualStorage] Delete campaign visuals error:', error);
      return 0;
    }
  }

  /**
   * Update visual status (e.g., mark as failed)
   */
  async updateVisualStatus(
    visualId: string,
    status: 'pending' | 'completed' | 'failed',
    errorMessage?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .update({
          status,
          error_message: errorMessage || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', visualId);

      if (error) {
        console.error('[VisualStorage] Failed to update visual status:', error);
        return false;
      }

      console.log(`[VisualStorage] ✓ Updated visual ${visualId} to ${status}`);
      return true;

    } catch (error) {
      console.error('[VisualStorage] Update status error:', error);
      return false;
    }
  }

  /**
   * Get statistics for brand visuals
   */
  async getVisualStats(brandId: string): Promise<{
    total: number;
    byType: Record<CampaignTypeId, number>;
    byPlatform: Record<string, number>;
    successful: number;
    failed: number;
  }> {
    const visuals = await this.queryVisuals({ brandId, limit: 10000 });

    const stats = {
      total: visuals.length,
      byType: {} as Record<CampaignTypeId, number>,
      byPlatform: {} as Record<string, number>,
      successful: visuals.filter(v => v.status === 'completed').length,
      failed: visuals.filter(v => v.status === 'failed').length,
    };

    // Count by type
    for (const visual of visuals) {
      stats.byType[visual.campaign_type] = (stats.byType[visual.campaign_type] || 0) + 1;
      stats.byPlatform[visual.platform] = (stats.byPlatform[visual.platform] || 0) + 1;
    }

    return stats;
  }

  /**
   * Convert database row to GeneratedVisual
   */
  rowToVisual(row: GeneratedVisualRow): GeneratedVisual {
    return {
      id: row.id,
      campaignType: row.campaign_type,
      platform: row.platform,
      format: row.format,
      imageUrl: row.image_url,
      bannerbearUid: row.bannerbear_uid,
      templateId: row.template_id,
      metadata: {
        generatedAt: new Date(row.created_at),
        generationTime: row.generation_time_ms,
        dimensions: row.dimensions,
        aspectRatio: row.aspect_ratio,
      },
      status: row.status,
      error: row.error_message || undefined,
    };
  }

  /**
   * Convert array of rows to visuals
   */
  rowsToVisuals(rows: GeneratedVisualRow[]): GeneratedVisual[] {
    return rows.map(row => this.rowToVisual(row));
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const visualStorageService = new VisualStorageService();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Save visual with automatic error handling
 */
export async function saveVisualToDatabase(
  visual: GeneratedVisual,
  brandId: string,
  campaignId?: string,
  contentSnapshot?: Record<string, any>
): Promise<boolean> {
  const result = await visualStorageService.saveVisual({
    visual,
    brandId,
    campaignId,
    contentSnapshot,
  });

  return result !== null;
}

/**
 * Get all visuals for a brand
 */
export async function getBrandVisuals(brandId: string): Promise<GeneratedVisual[]> {
  const rows = await visualStorageService.queryVisuals({ brandId });
  return visualStorageService.rowsToVisuals(rows);
}

/**
 * Get visuals for campaign
 */
export async function getCampaignVisualsTyped(campaignId: string): Promise<GeneratedVisual[]> {
  const rows = await visualStorageService.getCampaignVisuals(campaignId);
  return visualStorageService.rowsToVisuals(rows);
}
