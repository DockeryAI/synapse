/**
 * Campaign Database Service
 *
 * Handles database persistence for campaigns using Supabase
 */

import { supabase } from '@/lib/supabase';
import type {
  CampaignRecord,
  ContentPieceRecord,
  GeneratedCampaignContent,
  CampaignType
} from '@/types/campaign-workflow.types';

export class CampaignDatabaseService {
  /**
   * Save a campaign draft
   */
  async saveDraft(params: {
    businessId: string;
    campaignName: string;
    campaignType: CampaignType;
    contentData?: GeneratedCampaignContent;
    goals?: Record<string, any>;
    targetAudience?: Record<string, any>;
  }): Promise<CampaignRecord> {
    console.log('[CampaignDB] Saving draft:', params.campaignName);

    const { data, error } = await supabase
      .from('marketing_campaigns')
      .insert({
        business_id: params.businessId,
        campaign_name: params.campaignName,
        campaign_type: params.campaignType,
        status: 'draft',
        goals: params.goals,
        target_audience: params.targetAudience,
        content_data: params.contentData
      })
      .select()
      .single();

    if (error) {
      console.error('[CampaignDB] Error saving draft:', error);
      throw new Error(`Failed to save campaign draft: ${error.message}`);
    }

    console.log('[CampaignDB] Draft saved successfully:', data.id);
    return data as CampaignRecord;
  }

  /**
   * Update an existing campaign
   */
  async updateCampaign(
    campaignId: string,
    updates: Partial<CampaignRecord>
  ): Promise<CampaignRecord> {
    console.log('[CampaignDB] Updating campaign:', campaignId);

    const { data, error } = await supabase
      .from('marketing_campaigns')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .select()
      .single();

    if (error) {
      console.error('[CampaignDB] Error updating campaign:', error);
      throw new Error(`Failed to update campaign: ${error.message}`);
    }

    return data as CampaignRecord;
  }

  /**
   * Mark campaign as approved
   */
  async approveCampaign(campaignId: string): Promise<CampaignRecord> {
    console.log('[CampaignDB] Approving campaign:', campaignId);

    return this.updateCampaign(campaignId, {
      status: 'active',
      start_date: new Date().toISOString().split('T')[0]
    });
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId: string): Promise<CampaignRecord | null> {
    console.log('[CampaignDB] Fetching campaign:', campaignId);

    const { data, error } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('[CampaignDB] Error fetching campaign:', error);
      throw new Error(`Failed to fetch campaign: ${error.message}`);
    }

    return data as CampaignRecord;
  }

  /**
   * List campaigns for a business
   */
  async listCampaigns(params: {
    businessId: string;
    status?: 'draft' | 'active' | 'paused' | 'completed';
    limit?: number;
    offset?: number;
  }): Promise<{ campaigns: CampaignRecord[]; total: number }> {
    console.log('[CampaignDB] Listing campaigns for business:', params.businessId);

    let query = supabase
      .from('marketing_campaigns')
      .select('*', { count: 'exact' })
      .eq('business_id', params.businessId)
      .order('created_at', { ascending: false });

    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[CampaignDB] Error listing campaigns:', error);
      throw new Error(`Failed to list campaigns: ${error.message}`);
    }

    return {
      campaigns: data as CampaignRecord[],
      total: count || 0
    };
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(campaignId: string): Promise<void> {
    console.log('[CampaignDB] Deleting campaign:', campaignId);

    const { error } = await supabase
      .from('marketing_campaigns')
      .delete()
      .eq('id', campaignId);

    if (error) {
      console.error('[CampaignDB] Error deleting campaign:', error);
      throw new Error(`Failed to delete campaign: ${error.message}`);
    }

    console.log('[CampaignDB] Campaign deleted successfully');
  }

  /**
   * Save individual content pieces from a campaign
   */
  async saveContentPieces(
    campaignId: string,
    businessId: string,
    content: GeneratedCampaignContent
  ): Promise<ContentPieceRecord[]> {
    console.log('[CampaignDB] Saving content pieces for campaign:', campaignId);

    const pieces = content.platforms.map(platformContent => ({
      business_id: businessId,
      campaign_id: campaignId,
      content_type: 'post',
      platform: platformContent.platform,
      title: platformContent.content.headline,
      content_text: `${platformContent.content.hook}\n\n${platformContent.content.body}\n\n${platformContent.content.cta}`,
      hashtags: platformContent.content.hashtags || [],
      media_urls: platformContent.mediaUrls || [],
      status: 'draft'
    }));

    const { data, error } = await supabase
      .from('content_pieces')
      .insert(pieces)
      .select();

    if (error) {
      console.error('[CampaignDB] Error saving content pieces:', error);
      throw new Error(`Failed to save content pieces: ${error.message}`);
    }

    console.log('[CampaignDB] Saved', data.length, 'content pieces');
    return data as ContentPieceRecord[];
  }

  /**
   * Get content pieces for a campaign
   */
  async getContentPieces(campaignId: string): Promise<ContentPieceRecord[]> {
    console.log('[CampaignDB] Fetching content pieces for campaign:', campaignId);

    const { data, error } = await supabase
      .from('content_pieces')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[CampaignDB] Error fetching content pieces:', error);
      throw new Error(`Failed to fetch content pieces: ${error.message}`);
    }

    return data as ContentPieceRecord[];
  }

  /**
   * Update content piece
   */
  async updateContentPiece(
    pieceId: string,
    updates: Partial<ContentPieceRecord>
  ): Promise<ContentPieceRecord> {
    console.log('[CampaignDB] Updating content piece:', pieceId);

    const { data, error } = await supabase
      .from('content_pieces')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', pieceId)
      .select()
      .single();

    if (error) {
      console.error('[CampaignDB] Error updating content piece:', error);
      throw new Error(`Failed to update content piece: ${error.message}`);
    }

    return data as ContentPieceRecord;
  }

  /**
   * Mark content piece as scheduled
   */
  async scheduleContentPiece(
    pieceId: string,
    scheduledFor: Date
  ): Promise<ContentPieceRecord> {
    return this.updateContentPiece(pieceId, {
      status: 'scheduled',
      scheduled_for: scheduledFor.toISOString()
    });
  }

  /**
   * Mark content piece as published
   */
  async publishContentPiece(pieceId: string): Promise<ContentPieceRecord> {
    return this.updateContentPiece(pieceId, {
      status: 'published',
      published_at: new Date().toISOString()
    });
  }
}

// Export singleton instance
export const campaignDB = new CampaignDatabaseService();
