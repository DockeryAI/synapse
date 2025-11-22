/**
 * Campaign Storage Service
 * CRUD operations for campaigns using Supabase
 */

import { supabase } from '@/lib/supabase';
import type {
  Campaign,
  CampaignCreateInput,
  CampaignUpdateInput,
  CampaignPiece,
  CampaignPieceUpdateInput,
  CampaignStatus
} from '@/types/v2';

export class CampaignStorageService {
  /**
   * Create a new campaign
   */
  async createCampaign(input: CampaignCreateInput): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        brand_id: input.brandId,
        name: input.name,
        purpose: input.purpose,
        template_id: input.templateId,
        start_date: input.startDate,
        target_audience: input.targetAudience,
        status: 'draft'
      })
      .select()
      .single();

    if (error) {
      console.error('[CampaignStorage] Error creating campaign:', error);
      throw new Error(`Failed to create campaign: ${error.message}`);
    }

    return this.mapCampaignFromDb(data);
  }

  /**
   * Get a campaign by ID
   */
  async getCampaign(id: string): Promise<Campaign | null> {
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_pieces (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('[CampaignStorage] Error fetching campaign:', error);
      throw new Error(`Failed to fetch campaign: ${error.message}`);
    }

    return this.mapCampaignFromDb(data);
  }

  /**
   * Get all campaigns for a brand
   */
  async getCampaignsByBrand(brandId: string): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_pieces (*)
      `)
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[CampaignStorage] Error fetching campaigns:', error);
      throw new Error(`Failed to fetch campaigns: ${error.message}`);
    }

    return (data || []).map(this.mapCampaignFromDb);
  }

  /**
   * Update a campaign
   */
  async updateCampaign(id: string, input: CampaignUpdateInput): Promise<Campaign> {
    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.startDate !== undefined) updateData.start_date = input.startDate;
    if (input.endDate !== undefined) updateData.end_date = input.endDate;
    if (input.targetAudience !== undefined) updateData.target_audience = input.targetAudience;

    const { data, error } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[CampaignStorage] Error updating campaign:', error);
      throw new Error(`Failed to update campaign: ${error.message}`);
    }

    return this.mapCampaignFromDb(data);
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(id: string): Promise<void> {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[CampaignStorage] Error deleting campaign:', error);
      throw new Error(`Failed to delete campaign: ${error.message}`);
    }
  }

  /**
   * Update campaign status
   */
  async updateCampaignStatus(id: string, status: CampaignStatus): Promise<Campaign> {
    return this.updateCampaign(id, { status });
  }

  /**
   * Add pieces to a campaign
   */
  async addCampaignPieces(campaignId: string, pieces: Omit<CampaignPiece, 'id' | 'campaignId'>[]): Promise<CampaignPiece[]> {
    const pieceData = pieces.map((piece, index) => ({
      campaign_id: campaignId,
      phase_id: piece.phaseId,
      title: piece.title,
      content: piece.content,
      emotional_trigger: piece.emotionalTrigger,
      scheduled_date: piece.scheduledDate,
      status: piece.status || 'pending',
      channel: piece.channel,
      piece_order: piece.order ?? index,
      template_id: piece.templateId,
      performance_prediction: piece.performancePrediction
    }));

    const { data, error } = await supabase
      .from('campaign_pieces')
      .insert(pieceData)
      .select();

    if (error) {
      console.error('[CampaignStorage] Error adding campaign pieces:', error);
      throw new Error(`Failed to add campaign pieces: ${error.message}`);
    }

    return (data || []).map(this.mapPieceFromDb);
  }

  /**
   * Update a campaign piece
   */
  async updateCampaignPiece(pieceId: string, input: CampaignPieceUpdateInput): Promise<CampaignPiece> {
    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.scheduledDate !== undefined) updateData.scheduled_date = input.scheduledDate;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.channel !== undefined) updateData.channel = input.channel;

    const { data, error } = await supabase
      .from('campaign_pieces')
      .update(updateData)
      .eq('id', pieceId)
      .select()
      .single();

    if (error) {
      console.error('[CampaignStorage] Error updating campaign piece:', error);
      throw new Error(`Failed to update campaign piece: ${error.message}`);
    }

    return this.mapPieceFromDb(data);
  }

  /**
   * Delete a campaign piece
   */
  async deleteCampaignPiece(pieceId: string): Promise<void> {
    const { error } = await supabase
      .from('campaign_pieces')
      .delete()
      .eq('id', pieceId);

    if (error) {
      console.error('[CampaignStorage] Error deleting campaign piece:', error);
      throw new Error(`Failed to delete campaign piece: ${error.message}`);
    }
  }

  /**
   * Get campaigns by status
   */
  async getCampaignsByStatus(brandId: string, status: CampaignStatus): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_pieces (*)
      `)
      .eq('brand_id', brandId)
      .eq('status', status)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('[CampaignStorage] Error fetching campaigns by status:', error);
      throw new Error(`Failed to fetch campaigns: ${error.message}`);
    }

    return (data || []).map(this.mapCampaignFromDb);
  }

  /**
   * Map database row to Campaign type
   */
  private mapCampaignFromDb(row: Record<string, unknown>): Campaign {
    return {
      id: row.id as string,
      brandId: row.brand_id as string,
      name: row.name as string,
      purpose: row.purpose as Campaign['purpose'],
      status: row.status as CampaignStatus,
      templateId: row.template_id as string,
      arc: row.arc as Campaign['arc'],
      pieces: Array.isArray(row.campaign_pieces)
        ? (row.campaign_pieces as Record<string, unknown>[]).map(this.mapPieceFromDb)
        : [],
      startDate: row.start_date as string,
      endDate: row.end_date as string,
      targetAudience: row.target_audience as string | undefined,
      industryCustomization: row.industry_customization as Campaign['industryCustomization'],
      performancePrediction: row.performance_prediction as Campaign['performancePrediction'],
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string
    };
  }

  /**
   * Map database row to CampaignPiece type
   */
  private mapPieceFromDb(row: Record<string, unknown>): CampaignPiece {
    return {
      id: row.id as string,
      campaignId: row.campaign_id as string,
      phaseId: row.phase_id as string,
      title: row.title as string,
      content: row.content as string,
      emotionalTrigger: row.emotional_trigger as CampaignPiece['emotionalTrigger'],
      scheduledDate: row.scheduled_date as string,
      status: row.status as CampaignPiece['status'],
      channel: row.channel as string,
      order: row.piece_order as number,
      templateId: row.template_id as string | undefined,
      performancePrediction: row.performance_prediction as CampaignPiece['performancePrediction']
    };
  }
}

// Export singleton instance
export const campaignStorage = new CampaignStorageService();
