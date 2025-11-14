/**
 * Opportunity Detector Service
 * Detects and manages intelligence opportunities for content creation
 */

import { supabase, db, functions } from '@/lib/supabase';
import type { Opportunity, OpportunityType, UrgencyLevel } from '@/types/content-calendar.types';

export class OpportunityDetectorService {
  /**
   * Get active opportunities for a brand
   */
  static async getActiveOpportunities(brandId: string): Promise<Opportunity[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('intelligence_opportunities')
      .select('*')
      .eq('brand_id', brandId)
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gte.${now}`)
      .order('urgency', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as Opportunity[]) || [];
  }

  /**
   * Get opportunity by ID
   */
  static async getOpportunity(opportunityId: string): Promise<Opportunity | null> {
    return db.getById<Opportunity>('intelligence_opportunities', opportunityId);
  }

  /**
   * Dismiss an opportunity
   */
  static async dismissOpportunity(opportunityId: string): Promise<void> {
    await supabase
      .from('intelligence_opportunities')
      .update({
        status: 'dismissed',
        actioned_at: new Date().toISOString(),
      })
      .eq('id', opportunityId);
  }

  /**
   * Mark opportunity as used
   */
  static async markOpportunityUsed(opportunityId: string): Promise<void> {
    await supabase
      .from('intelligence_opportunities')
      .update({
        status: 'used',
        actioned_at: new Date().toISOString(),
      })
      .eq('id', opportunityId);
  }

  /**
   * Generate content from opportunity
   */
  static async generateFromOpportunity(
    opportunityId: string,
    platform: string,
    mode: 'marba' | 'synapse' = 'marba'
  ): Promise<any> {
    const opportunity = await this.getOpportunity(opportunityId);
    if (!opportunity) throw new Error('Opportunity not found');

    // Build context from opportunity
    const context = {
      opportunityType: opportunity.type,
      opportunityTitle: opportunity.title,
      opportunityDescription: opportunity.description,
      sourceData: opportunity.context,
      urgency: opportunity.urgency,
    };

    // Generate content using the opportunity context
    const result = await functions.generateContent(
      opportunity.brand_id,
      platform,
      opportunity.title,
      mode,
      {
        context,
        opportunityId,
      }
    );

    // Mark opportunity as used
    await this.markOpportunityUsed(opportunityId);

    return result;
  }

  /**
   * Create a new opportunity (for testing/demo)
   */
  static async createOpportunity(opportunity: Partial<Opportunity>): Promise<Opportunity> {
    const { data, error } = await supabase
      .from('intelligence_opportunities')
      .insert({
        ...opportunity,
        status: 'active',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as Opportunity;
  }

  /**
   * Calculate time until expiration
   */
  static getTimeUntilExpiration(opportunity: Opportunity): {
    hours: number;
    minutes: number;
    expired: boolean;
  } {
    if (!opportunity.expires_at) {
      return { hours: 999, minutes: 0, expired: false };
    }

    const now = new Date();
    const expiresAt = new Date(opportunity.expires_at);
    const diffMs = expiresAt.getTime() - now.getTime();

    if (diffMs <= 0) {
      return { hours: 0, minutes: 0, expired: true };
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes, expired: false };
  }

  /**
   * Get urgency color for UI
   */
  static getUrgencyColor(urgency: UrgencyLevel): string {
    const colors: Record<UrgencyLevel, string> = {
      low: 'bg-blue-100 text-blue-800 border-blue-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[urgency] || colors.medium;
  }

  /**
   * Get opportunity type icon
   */
  static getOpportunityIcon(type: OpportunityType): string {
    const icons: Record<OpportunityType, string> = {
      weather: '🌤️',
      trending: '📈',
      competitor: '🎯',
      seasonal: '📅',
      local_news: '📰',
    };
    return icons[type] || '💡';
  }

  /**
   * Get opportunity type label
   */
  static getOpportunityTypeLabel(type: OpportunityType): string {
    const labels: Record<OpportunityType, string> = {
      weather: 'Weather Alert',
      trending: 'Trending Topic',
      competitor: 'Competitor Activity',
      seasonal: 'Seasonal Event',
      local_news: 'Local News',
    };
    return labels[type] || 'Opportunity';
  }

  /**
   * Create sample opportunities for testing
   */
  static async createSampleOpportunities(brandId: string): Promise<Opportunity[]> {
    const samples: Partial<Opportunity>[] = [
      {
        brand_id: brandId,
        type: 'weather',
        title: 'Sunny Weekend Approaching',
        description: 'Perfect weather forecast for outdoor activities this weekend.',
        urgency: 'high',
        impact_score: 85,
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        context: {
          temperature: 75,
          conditions: 'sunny',
          forecast: 'Perfect weekend weather',
        },
        suggested_actions: [
          'Promote outdoor products',
          'Share weekend activity tips',
          'Create weather-related content',
        ],
      },
      {
        brand_id: brandId,
        type: 'trending',
        title: '#SmallBusinessSaturday Trending',
        description: 'Small Business Saturday is trending with 50K mentions in the last hour.',
        urgency: 'critical',
        impact_score: 95,
        expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        context: {
          hashtag: '#SmallBusinessSaturday',
          mentions: 50000,
          growth_rate: 'exponential',
        },
        suggested_actions: [
          'Post about your small business story',
          'Share customer testimonials',
          'Offer limited-time promotion',
        ],
      },
      {
        brand_id: brandId,
        type: 'seasonal',
        title: 'Holiday Shopping Season Beginning',
        description: 'Black Friday and Cyber Monday approaching - prime time for promotions.',
        urgency: 'medium',
        impact_score: 78,
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        context: {
          event: 'Black Friday',
          days_until: 14,
          shopping_intensity: 'high',
        },
        suggested_actions: [
          'Create holiday gift guides',
          'Announce special offers',
          'Share holiday shopping tips',
        ],
      },
      {
        brand_id: brandId,
        type: 'competitor',
        title: 'Competitor Launches New Feature',
        description:
          'Main competitor just announced a new product line. Opportunity to differentiate.',
        urgency: 'high',
        impact_score: 82,
        expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        context: {
          competitor: 'Main Competitor',
          action: 'product_launch',
          sentiment: 'mixed',
        },
        suggested_actions: [
          'Highlight your unique features',
          'Share customer success stories',
          'Create comparison content',
        ],
      },
      {
        brand_id: brandId,
        type: 'local_news',
        title: 'Local Community Event This Weekend',
        description: 'Annual community festival happening downtown - great engagement opportunity.',
        urgency: 'medium',
        impact_score: 70,
        expires_at: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
        context: {
          event: 'Community Festival',
          location: 'Downtown',
          attendance: 'high',
        },
        suggested_actions: [
          'Sponsor or participate in event',
          'Create local community content',
          'Share event information',
        ],
      },
    ];

    const created: Opportunity[] = [];
    for (const sample of samples) {
      try {
        const opportunity = await this.createOpportunity(sample);
        created.push(opportunity);
      } catch (error) {
        console.error('Failed to create sample opportunity:', error);
      }
    }

    return created;
  }
}
