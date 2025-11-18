/**
 * Insights Storage Service
 * Manages persisting and retrieving all intelligence gathered during onboarding
 */

import { supabase } from '@/lib/supabase';

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
}

export const insightsStorageService = new InsightsStorageService();
