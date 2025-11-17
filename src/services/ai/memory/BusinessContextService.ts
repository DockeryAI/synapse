/**
 * Business Context Service
 *
 * Stores and retrieves business context that AI remembers about each SMB.
 * Includes business profile, brand voice, campaign preferences.
 */

import { supabase } from '../../../lib/supabase';
import type {
  BusinessContext,
  BrandVoiceSample,
  CampaignPreferences,
  AIBusinessContextRow,
} from '../../../types/ai-memory.types';

export class BusinessContextService {
  /**
   * Get business context for a user
   */
  static async getContext(userId: string): Promise<BusinessContext | null> {
    const { data, error } = await supabase
      .from('ai_business_context')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - this is ok, user hasn't set up context yet
        return null;
      }
      console.error('Error fetching business context:', error);
      throw error;
    }

    return this.mapRowToContext(data as AIBusinessContextRow);
  }

  /**
   * Create or update business context
   */
  static async upsertContext(
    userId: string,
    context: Partial<Omit<BusinessContext, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<BusinessContext> {
    const existing = await this.getContext(userId);

    const payload: any = {
      user_id: userId,
      business_name: context.business_name,
      industry: context.industry,
      business_type: context.business_type,
      location_city: context.location?.city,
      location_state: context.location?.state,
      location_country: context.location?.country,
      target_audience: context.target_audience,
      unique_selling_proposition: context.unique_selling_proposition,
      brand_personality: context.brand_personality,
      brand_voice_samples: context.brand_voice_samples || [],
      campaign_preferences: context.campaign_preferences || {},
      updated_at: new Date().toISOString(),
    };

    if (!existing) {
      payload.created_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('ai_business_context')
      .upsert(payload, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting business context:', error);
      throw error;
    }

    return this.mapRowToContext(data as AIBusinessContextRow);
  }

  /**
   * Update business name
   */
  static async updateBusinessName(userId: string, businessName: string): Promise<void> {
    const { error } = await supabase
      .from('ai_business_context')
      .update({
        business_name: businessName,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating business name:', error);
      throw error;
    }
  }

  /**
   * Update industry and business type
   */
  static async updateBusinessInfo(
    userId: string,
    industry: string,
    businessType: BusinessContext['business_type']
  ): Promise<void> {
    const { error } = await supabase
      .from('ai_business_context')
      .update({
        industry,
        business_type: businessType,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating business info:', error);
      throw error;
    }
  }

  /**
   * Add brand voice sample
   */
  static async addBrandVoiceSample(
    userId: string,
    sample: Omit<BrandVoiceSample, 'id' | 'created_at'>
  ): Promise<void> {
    const context = await this.getContext(userId);
    if (!context) {
      throw new Error('Business context not found. Create context first.');
    }

    const newSample: BrandVoiceSample = {
      id: crypto.randomUUID(),
      ...sample,
      created_at: new Date(),
    };

    const updatedSamples = [...(context.brand_voice_samples || []), newSample];

    const { error } = await supabase
      .from('ai_business_context')
      .update({
        brand_voice_samples: updatedSamples,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error adding brand voice sample:', error);
      throw error;
    }
  }

  /**
   * Remove brand voice sample
   */
  static async removeBrandVoiceSample(userId: string, sampleId: string): Promise<void> {
    const context = await this.getContext(userId);
    if (!context) {
      throw new Error('Business context not found.');
    }

    const updatedSamples = (context.brand_voice_samples || []).filter(
      (sample) => sample.id !== sampleId
    );

    const { error } = await supabase
      .from('ai_business_context')
      .update({
        brand_voice_samples: updatedSamples,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing brand voice sample:', error);
      throw error;
    }
  }

  /**
   * Update campaign preferences
   */
  static async updateCampaignPreferences(
    userId: string,
    preferences: Partial<CampaignPreferences>
  ): Promise<void> {
    const context = await this.getContext(userId);
    const existingPreferences = context?.campaign_preferences || {};

    const updatedPreferences: CampaignPreferences = {
      preferred_campaign_types:
        preferences.preferred_campaign_types || existingPreferences.preferred_campaign_types || [],
      preferred_platforms:
        preferences.preferred_platforms || existingPreferences.preferred_platforms || [],
      preferred_content_types:
        preferences.preferred_content_types || existingPreferences.preferred_content_types || [],
      preferred_durations:
        preferences.preferred_durations || existingPreferences.preferred_durations || [],
      avoid_topics: preferences.avoid_topics || existingPreferences.avoid_topics,
      must_include_topics: preferences.must_include_topics || existingPreferences.must_include_topics,
    };

    const { error } = await supabase
      .from('ai_business_context')
      .update({
        campaign_preferences: updatedPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating campaign preferences:', error);
      throw error;
    }
  }

  /**
   * Learn from successful campaign
   * Updates preferences based on campaign performance
   */
  static async learnFromCampaign(
    userId: string,
    campaignType: string,
    platforms: string[],
    contentTypes: string[],
    duration: number,
    wasSuccessful: boolean
  ): Promise<void> {
    if (!wasSuccessful) {
      return; // Only learn from successes
    }

    const context = await this.getContext(userId);
    const prefs = context?.campaign_preferences || {
      preferred_campaign_types: [],
      preferred_platforms: [],
      preferred_content_types: [],
      preferred_durations: [],
    };

    // Add to preferences if not already there
    const updatedPrefs: CampaignPreferences = {
      preferred_campaign_types: this.addUnique(prefs.preferred_campaign_types, campaignType),
      preferred_platforms: this.addUniqueArray(prefs.preferred_platforms, platforms),
      preferred_content_types: this.addUniqueArray(prefs.preferred_content_types, contentTypes),
      preferred_durations: this.addUnique(prefs.preferred_durations, duration),
      avoid_topics: prefs.avoid_topics,
      must_include_topics: prefs.must_include_topics,
    };

    await this.updateCampaignPreferences(userId, updatedPrefs);
  }

  /**
   * Get context summary for display
   */
  static async getContextSummary(userId: string): Promise<{
    hasContext: boolean;
    businessName?: string;
    industry?: string;
    voiceSampleCount: number;
    hasPreferences: boolean;
  }> {
    const context = await this.getContext(userId);

    if (!context) {
      return {
        hasContext: false,
        voiceSampleCount: 0,
        hasPreferences: false,
      };
    }

    return {
      hasContext: true,
      businessName: context.business_name,
      industry: context.industry,
      voiceSampleCount: context.brand_voice_samples?.length || 0,
      hasPreferences: !!(
        context.campaign_preferences &&
        (context.campaign_preferences.preferred_campaign_types?.length ||
          context.campaign_preferences.preferred_platforms?.length)
      ),
    };
  }

  /**
   * Extract context for AI injection
   */
  static async getContextForAI(userId: string): Promise<{
    name: string;
    industry: string;
    type: string;
    location?: string;
    target_audience?: string;
    usp?: string;
    brand_personality?: string;
    voice_samples?: string[];
  } | null> {
    const context = await this.getContext(userId);
    if (!context) {
      return null;
    }

    return {
      name: context.business_name,
      industry: context.industry,
      type: context.business_type,
      location: context.location
        ? [context.location.city, context.location.state, context.location.country]
            .filter(Boolean)
            .join(', ')
        : undefined,
      target_audience: context.target_audience,
      usp: context.unique_selling_proposition,
      brand_personality: context.brand_personality,
      voice_samples: context.brand_voice_samples?.map((sample) => sample.text),
    };
  }

  /**
   * Helper: Map database row to BusinessContext
   */
  private static mapRowToContext(row: AIBusinessContextRow): BusinessContext {
    return {
      id: row.id,
      user_id: row.user_id,
      business_name: row.business_name,
      industry: row.industry,
      business_type: row.business_type as BusinessContext['business_type'],
      location: row.location_city || row.location_state || row.location_country
        ? {
            city: row.location_city,
            state: row.location_state,
            country: row.location_country,
          }
        : undefined,
      target_audience: row.target_audience,
      unique_selling_proposition: row.unique_selling_proposition,
      brand_personality: row.brand_personality,
      brand_voice_samples: row.brand_voice_samples || [],
      campaign_preferences: row.campaign_preferences || {
        preferred_campaign_types: [],
        preferred_platforms: [],
        preferred_content_types: [],
        preferred_durations: [],
      },
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }

  /**
   * Helper: Add unique item to array
   */
  private static addUnique<T>(arr: T[], item: T): T[] {
    if (arr.includes(item)) {
      return arr;
    }
    return [...arr, item];
  }

  /**
   * Helper: Add unique items from array
   */
  private static addUniqueArray<T>(arr: T[], items: T[]): T[] {
    const result = [...arr];
    for (const item of items) {
      if (!result.includes(item)) {
        result.push(item);
      }
    }
    return result;
  }
}
