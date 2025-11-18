/**
 * Insights Storage Service
 * Manages persisting and retrieving all intelligence gathered during onboarding
 *
 * Extended with Deep Insights:
 * - Value Propositions (4-layer with EQ scoring)
 * - Psychological Triggers (pain/desire mapping)
 * - JTBD Profiles (jobs-to-be-done framework)
 */

import { supabase } from '@/lib/supabase';
import type { ValueProposition } from '@/types/value-proposition.types';
import type { PsychologicalTrigger, TriggerCluster } from '@/types/psychological-trigger.types';
import type { JTBDProfile } from '@/types/jtbd.types';

export interface WebsiteAnalysis {
  uvps: string[];
  brandVoice: string;
  services: string[];
  keyMessages: string[];
  contentThemes: string[];
}

export interface LocationData {
  address: string;
  city: string;
  state: string;
  country: string;
  serviceArea: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ServiceProduct {
  name: string;
  description?: string;
  category?: string;
}

export interface CustomerTrigger {
  trigger: string;
  painPoint: string;
  desire: string;
  source: string; // 'reddit', 'website', 'industry_profile'
}

export interface MarketTrend {
  trend: string;
  description: string;
  relevance: string;
  source: string;
}

export interface CompetitorData {
  name: string;
  website?: string;
  strengths: string[];
  differentiators: string[];
}

export interface BrandVoice {
  tone: string[];
  personality: string;
  archetype: string;
  writingStyle: string;
}

export interface BusinessInsights {
  websiteAnalysis?: WebsiteAnalysis;
  locationData?: LocationData;
  servicesProducts?: ServiceProduct[];
  customerTriggers?: CustomerTrigger[];
  marketTrends?: MarketTrend[];
  competitorData?: CompetitorData[];
  brandVoice?: BrandVoice;
}

class InsightsStorageService {
  /**
   * Save all insights from onboarding to the brand record
   */
  async saveInsights(brandId: string, insights: BusinessInsights): Promise<void> {
    const { error } = await supabase
      .from('brands')
      .update({
        website_analysis: insights.websiteAnalysis || {},
        location_data: insights.locationData || {},
        services_products: insights.servicesProducts || [],
        customer_triggers: insights.customerTriggers || [],
        market_trends: insights.marketTrends || [],
        competitor_data: insights.competitorData || [],
        brand_voice: insights.brandVoice || {},
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', brandId);

    if (error) {
      console.error('[InsightsStorage] Failed to save insights:', error);
      throw error;
    }

    console.log('[InsightsStorage] Successfully saved insights for brand:', brandId);
  }

  /**
   * Get all insights for a brand
   */
  async getInsights(brandId: string): Promise<BusinessInsights | null> {
    const { data, error } = await supabase
      .from('brands')
      .select(`
        website_analysis,
        location_data,
        services_products,
        customer_triggers,
        market_trends,
        competitor_data,
        brand_voice
      `)
      .eq('id', brandId)
      .single();

    if (error) {
      console.error('[InsightsStorage] Failed to get insights:', error);
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      websiteAnalysis: data.website_analysis as WebsiteAnalysis,
      locationData: data.location_data as LocationData,
      servicesProducts: data.services_products as ServiceProduct[],
      customerTriggers: data.customer_triggers as CustomerTrigger[],
      marketTrends: data.market_trends as MarketTrend[],
      competitorData: data.competitor_data as CompetitorData[],
      brandVoice: data.brand_voice as BrandVoice,
    };
  }

  /**
   * Update specific insights
   */
  async updateInsights(brandId: string, partialInsights: Partial<BusinessInsights>): Promise<void> {
    const updates: any = {};

    if (partialInsights.websiteAnalysis) {
      updates.website_analysis = partialInsights.websiteAnalysis;
    }
    if (partialInsights.locationData) {
      updates.location_data = partialInsights.locationData;
    }
    if (partialInsights.servicesProducts) {
      updates.services_products = partialInsights.servicesProducts;
    }
    if (partialInsights.customerTriggers) {
      updates.customer_triggers = partialInsights.customerTriggers;
    }
    if (partialInsights.marketTrends) {
      updates.market_trends = partialInsights.marketTrends;
    }
    if (partialInsights.competitorData) {
      updates.competitor_data = partialInsights.competitorData;
    }
    if (partialInsights.brandVoice) {
      updates.brand_voice = partialInsights.brandVoice;
    }

    const { error } = await supabase
      .from('brands')
      .update(updates)
      .eq('id', brandId);

    if (error) {
      console.error('[InsightsStorage] Failed to update insights:', error);
      throw error;
    }

    console.log('[InsightsStorage] Successfully updated insights for brand:', brandId);
  }

  /**
   * Check if brand has completed onboarding
   */
  async hasCompletedOnboarding(brandId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('brands')
      .select('onboarding_completed_at')
      .eq('id', brandId)
      .single();

    if (error) {
      console.error('[InsightsStorage] Failed to check onboarding status:', error);
      return false;
    }

    return !!data?.onboarding_completed_at;
  }

  /**
   * Clear all insights for a brand (useful for re-onboarding)
   */
  async clearInsights(brandId: string): Promise<void> {
    const { error } = await supabase
      .from('brands')
      .update({
        website_analysis: {},
        location_data: {},
        services_products: [],
        customer_triggers: [],
        market_trends: [],
        competitor_data: [],
        brand_voice: {},
        onboarding_completed_at: null,
      })
      .eq('id', brandId);

    if (error) {
      console.error('[InsightsStorage] Failed to clear insights:', error);
      throw error;
    }

    console.log('[InsightsStorage] Successfully cleared insights for brand:', brandId);
  }

  // =====================================================
  // VALUE PROPOSITION METHODS
  // =====================================================

  /**
   * Create a new value proposition
   */
  async createValueProposition(vp: Omit<ValueProposition, 'id' | 'created_at' | 'updated_at'>): Promise<ValueProposition> {
    const { data, error } = await supabase
      .from('value_propositions')
      .insert({
        brand_id: vp.brand_id,
        surface: vp.surface,
        functional: vp.functional,
        emotional: vp.emotional,
        identity: vp.identity,
        eq_score: vp.eq_score,
        eq_breakdown: vp.eq_breakdown,
        target_persona: vp.target_persona,
        context: vp.context,
        evidence: vp.evidence || [],
      })
      .select()
      .single();

    if (error) {
      console.error('[InsightsStorage] Failed to create value proposition:', error);
      throw error;
    }

    console.log('[InsightsStorage] Created value proposition:', data.id);
    return data as ValueProposition;
  }

  /**
   * Get all value propositions for a brand
   */
  async getValuePropositions(brandId: string): Promise<ValueProposition[]> {
    const { data, error } = await supabase
      .from('value_propositions')
      .select('*')
      .eq('brand_id', brandId)
      .order('eq_score', { ascending: false });

    if (error) {
      console.error('[InsightsStorage] Failed to get value propositions:', error);
      throw error;
    }

    return (data || []) as ValueProposition[];
  }

  /**
   * Get a single value proposition by ID
   */
  async getValueProposition(id: string): Promise<ValueProposition | null> {
    const { data, error } = await supabase
      .from('value_propositions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('[InsightsStorage] Failed to get value proposition:', error);
      throw error;
    }

    return data as ValueProposition;
  }

  /**
   * Update a value proposition
   */
  async updateValueProposition(id: string, updates: Partial<ValueProposition>): Promise<ValueProposition> {
    const { data, error } = await supabase
      .from('value_propositions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[InsightsStorage] Failed to update value proposition:', error);
      throw error;
    }

    console.log('[InsightsStorage] Updated value proposition:', id);
    return data as ValueProposition;
  }

  /**
   * Delete a value proposition
   */
  async deleteValueProposition(id: string): Promise<void> {
    const { error } = await supabase
      .from('value_propositions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[InsightsStorage] Failed to delete value proposition:', error);
      throw error;
    }

    console.log('[InsightsStorage] Deleted value proposition:', id);
  }

  /**
   * Get top-performing value propositions (EQ score >= 80)
   */
  async getTopValuePropositions(brandId?: string): Promise<ValueProposition[]> {
    let query = supabase
      .from('value_propositions')
      .select('*')
      .gte('eq_score', 80)
      .order('eq_score', { ascending: false });

    if (brandId) {
      query = query.eq('brand_id', brandId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[InsightsStorage] Failed to get top value propositions:', error);
      throw error;
    }

    return (data || []) as ValueProposition[];
  }

  // =====================================================
  // PSYCHOLOGICAL TRIGGER METHODS
  // =====================================================

  /**
   * Create a new psychological trigger
   */
  async createPsychologicalTrigger(
    trigger: Omit<PsychologicalTrigger, 'id' | 'created_at' | 'updated_at'>
  ): Promise<PsychologicalTrigger> {
    const { data, error } = await supabase
      .from('psychological_triggers')
      .insert({
        brand_id: trigger.brand_id,
        industry: trigger.industry,
        trigger: trigger.trigger,
        pain_point: trigger.pain_point,
        desire: trigger.desire,
        source: trigger.source,
        category: trigger.category,
        impact_level: trigger.impact_level,
        urgency: trigger.urgency,
        frequency: trigger.frequency,
        evidence: trigger.evidence,
        persona: trigger.persona,
        timing: trigger.timing,
        priority_score: trigger.priority_score,
      })
      .select()
      .single();

    if (error) {
      console.error('[InsightsStorage] Failed to create psychological trigger:', error);
      throw error;
    }

    console.log('[InsightsStorage] Created psychological trigger:', data.id);
    return data as PsychologicalTrigger;
  }

  /**
   * Get psychological triggers for a brand or industry
   */
  async getPsychologicalTriggers(options?: {
    brandId?: string;
    industry?: string;
    minPriority?: number;
    source?: string;
  }): Promise<PsychologicalTrigger[]> {
    let query = supabase.from('psychological_triggers').select('*');

    if (options?.brandId) {
      query = query.eq('brand_id', options.brandId);
    }

    if (options?.industry) {
      query = query.eq('industry', options.industry);
    }

    if (options?.minPriority) {
      query = query.gte('priority_score', options.minPriority);
    }

    if (options?.source) {
      query = query.eq('source', options.source);
    }

    query = query.order('priority_score', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('[InsightsStorage] Failed to get psychological triggers:', error);
      throw error;
    }

    return (data || []) as PsychologicalTrigger[];
  }

  /**
   * Get a single psychological trigger by ID
   */
  async getPsychologicalTrigger(id: string): Promise<PsychologicalTrigger | null> {
    const { data, error } = await supabase
      .from('psychological_triggers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('[InsightsStorage] Failed to get psychological trigger:', error);
      throw error;
    }

    return data as PsychologicalTrigger;
  }

  /**
   * Update a psychological trigger
   */
  async updatePsychologicalTrigger(
    id: string,
    updates: Partial<PsychologicalTrigger>
  ): Promise<PsychologicalTrigger> {
    const { data, error } = await supabase
      .from('psychological_triggers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[InsightsStorage] Failed to update psychological trigger:', error);
      throw error;
    }

    console.log('[InsightsStorage] Updated psychological trigger:', id);
    return data as PsychologicalTrigger;
  }

  /**
   * Delete a psychological trigger
   */
  async deletePsychologicalTrigger(id: string): Promise<void> {
    const { error } = await supabase
      .from('psychological_triggers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[InsightsStorage] Failed to delete psychological trigger:', error);
      throw error;
    }

    console.log('[InsightsStorage] Deleted psychological trigger:', id);
  }

  /**
   * Search psychological triggers by text
   */
  async searchPsychologicalTriggers(searchTerm: string, brandId?: string): Promise<PsychologicalTrigger[]> {
    let query = supabase
      .from('psychological_triggers')
      .select('*')
      .or(`trigger.ilike.%${searchTerm}%,pain_point.ilike.%${searchTerm}%,desire.ilike.%${searchTerm}%`);

    if (brandId) {
      query = query.eq('brand_id', brandId);
    }

    query = query.order('priority_score', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('[InsightsStorage] Failed to search psychological triggers:', error);
      throw error;
    }

    return (data || []) as PsychologicalTrigger[];
  }

  /**
   * Get high-priority triggers (priority >= 65 or impact critical/high)
   */
  async getHighPriorityTriggers(brandId?: string): Promise<PsychologicalTrigger[]> {
    let query = supabase
      .from('psychological_triggers')
      .select('*')
      .or('priority_score.gte.65,impact_level.in.(critical,high)');

    if (brandId) {
      query = query.eq('brand_id', brandId);
    }

    query = query.order('priority_score', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('[InsightsStorage] Failed to get high-priority triggers:', error);
      throw error;
    }

    return (data || []) as PsychologicalTrigger[];
  }

  // =====================================================
  // JTBD PROFILE METHODS
  // =====================================================

  /**
   * Create a new JTBD profile
   */
  async createJTBDProfile(profile: Omit<JTBDProfile, 'id' | 'created_at' | 'updated_at'>): Promise<JTBDProfile> {
    const { data, error } = await supabase
      .from('jtbd_profiles')
      .insert({
        brand_id: profile.brand_id,
        product_id: profile.product_id,
        job_statement: profile.job_statement,
        functional_job: profile.functional_job,
        emotional_job: profile.emotional_job,
        social_job: profile.social_job,
        context: profile.context,
        success_criteria: profile.success_criteria || [],
        current_solutions: profile.current_solutions || [],
        obstacles: profile.obstacles || [],
        importance_score: profile.importance_score,
        satisfaction_score: profile.satisfaction_score,
        // opportunity_score is auto-calculated by trigger
      })
      .select()
      .single();

    if (error) {
      console.error('[InsightsStorage] Failed to create JTBD profile:', error);
      throw error;
    }

    console.log('[InsightsStorage] Created JTBD profile:', data.id);
    return data as JTBDProfile;
  }

  /**
   * Get JTBD profiles for a brand
   */
  async getJTBDProfiles(brandId: string): Promise<JTBDProfile[]> {
    const { data, error } = await supabase
      .from('jtbd_profiles')
      .select('*')
      .eq('brand_id', brandId)
      .order('opportunity_score', { ascending: false });

    if (error) {
      console.error('[InsightsStorage] Failed to get JTBD profiles:', error);
      throw error;
    }

    return (data || []) as JTBDProfile[];
  }

  /**
   * Get a single JTBD profile by ID
   */
  async getJTBDProfile(id: string): Promise<JTBDProfile | null> {
    const { data, error } = await supabase
      .from('jtbd_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('[InsightsStorage] Failed to get JTBD profile:', error);
      throw error;
    }

    return data as JTBDProfile;
  }

  /**
   * Update a JTBD profile
   */
  async updateJTBDProfile(id: string, updates: Partial<JTBDProfile>): Promise<JTBDProfile> {
    const { data, error } = await supabase
      .from('jtbd_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[InsightsStorage] Failed to update JTBD profile:', error);
      throw error;
    }

    console.log('[InsightsStorage] Updated JTBD profile:', id);
    return data as JTBDProfile;
  }

  /**
   * Delete a JTBD profile
   */
  async deleteJTBDProfile(id: string): Promise<void> {
    const { error } = await supabase
      .from('jtbd_profiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[InsightsStorage] Failed to delete JTBD profile:', error);
      throw error;
    }

    console.log('[InsightsStorage] Deleted JTBD profile:', id);
  }

  /**
   * Get JTBD opportunities (opportunity_score >= 100)
   */
  async getJTBDOpportunities(brandId?: string): Promise<JTBDProfile[]> {
    let query = supabase
      .from('jtbd_profiles')
      .select('*')
      .gte('opportunity_score', 100)
      .order('opportunity_score', { ascending: false });

    if (brandId) {
      query = query.eq('brand_id', brandId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[InsightsStorage] Failed to get JTBD opportunities:', error);
      throw error;
    }

    return (data || []) as JTBDProfile[];
  }

  // =====================================================
  // TRIGGER CLUSTER METHODS
  // =====================================================

  /**
   * Create a trigger cluster
   */
  async createTriggerCluster(
    cluster: Omit<TriggerCluster, 'id' | 'created_at' | 'updated_at'>
  ): Promise<TriggerCluster> {
    const { data, error } = await supabase
      .from('trigger_clusters')
      .insert({
        brand_id: cluster.brand_id,
        name: cluster.name,
        description: cluster.description,
        trigger_ids: cluster.triggers.map((t) => t.id).filter(Boolean),
        common_pains: cluster.common_pains,
        common_desires: cluster.common_desires,
        messaging_themes: cluster.messaging_themes,
        affected_personas: cluster.affected_personas,
        size: cluster.size,
        importance_score: cluster.importance_score,
      })
      .select()
      .single();

    if (error) {
      console.error('[InsightsStorage] Failed to create trigger cluster:', error);
      throw error;
    }

    console.log('[InsightsStorage] Created trigger cluster:', data.id);
    return data as TriggerCluster;
  }

  /**
   * Get trigger clusters for a brand
   */
  async getTriggerClusters(brandId: string): Promise<TriggerCluster[]> {
    const { data, error } = await supabase
      .from('trigger_clusters')
      .select('*')
      .eq('brand_id', brandId)
      .order('importance_score', { ascending: false });

    if (error) {
      console.error('[InsightsStorage] Failed to get trigger clusters:', error);
      throw error;
    }

    return (data || []) as TriggerCluster[];
  }

  /**
   * Update a trigger cluster
   */
  async updateTriggerCluster(id: string, updates: Partial<TriggerCluster>): Promise<TriggerCluster> {
    const updateData: any = { ...updates };

    // Convert triggers array to trigger_ids if present
    if (updates.triggers) {
      updateData.trigger_ids = updates.triggers.map((t) => t.id).filter(Boolean);
      delete updateData.triggers;
    }

    const { data, error } = await supabase
      .from('trigger_clusters')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[InsightsStorage] Failed to update trigger cluster:', error);
      throw error;
    }

    console.log('[InsightsStorage] Updated trigger cluster:', id);
    return data as TriggerCluster;
  }

  /**
   * Delete a trigger cluster
   */
  async deleteTriggerCluster(id: string): Promise<void> {
    const { error } = await supabase
      .from('trigger_clusters')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[InsightsStorage] Failed to delete trigger cluster:', error);
      throw error;
    }

    console.log('[InsightsStorage] Deleted trigger cluster:', id);
  }
}

export const insightsStorageService = new InsightsStorageService();
