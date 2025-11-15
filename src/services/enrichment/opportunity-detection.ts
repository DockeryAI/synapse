/**
 * Opportunity Detection Service - Real-time signal detection for marketing opportunities
 * Phase 15: Background Jobs and Enrichment Engine
 */

import { supabase } from '@/lib/supabase';
import type {
  Opportunity,
  OpportunityType,
  OpportunityUrgency,
  WeatherOpportunity,
  TrendingOpportunity,
  CompetitorOpportunity,
  SeasonalOpportunity,
} from '@/types/enrichment.types';

export class OpportunityDetection {
  /**
   * Get all opportunities for a brand, aggregated and scored
   */
  static async getAllOpportunities(
    brandId: string
  ): Promise<Opportunity[]> {
    const opportunities: Opportunity[] = [];

    // Run all detection methods in parallel
    const [weather, trending, competitor, seasonal, localNews] =
      await Promise.allSettled([
        this.detectWeatherOpportunities(brandId),
        this.detectTrendingOpportunities(brandId),
        this.detectCompetitorOpportunities(brandId),
        this.detectSeasonalOpportunities(brandId),
        this.detectLocalNewsOpportunities(brandId),
      ]);

    // Collect successful results
    if (weather.status === 'fulfilled') {
      opportunities.push(...weather.value);
    }
    if (trending.status === 'fulfilled') {
      opportunities.push(...trending.value);
    }
    if (competitor.status === 'fulfilled') {
      opportunities.push(...competitor.value);
    }
    if (seasonal.status === 'fulfilled') {
      opportunities.push(...seasonal.value);
    }
    if (localNews.status === 'fulfilled') {
      opportunities.push(...localNews.value);
    }

    // Sort by urgency and confidence
    return opportunities.sort((a, b) => {
      const urgencyScore = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      };
      const urgencyDiff =
        urgencyScore[b.urgency] - urgencyScore[a.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.confidence_score - a.confidence_score;
    });
  }

  /**
   * Detect weather-based opportunities
   */
  static async detectWeatherOpportunities(
    brandId: string
  ): Promise<Opportunity[]> {
    const opportunities: Opportunity[] = [];

    try {
      // Get brand location
      const { data: brand } = await supabase
        .from('brands')
        .select('location, industry')
        .eq('id', brandId)
        .single();

      if (!brand?.location) {
        return opportunities;
      }

      // Simulate weather API call (replace with real API later)
      const weatherData = await this.getWeatherData(brand.location);

      // Analyze weather for marketing opportunities
      const weatherOpps = this.analyzeWeatherConditions(
        weatherData,
        brand.industry
      );

      for (const opp of weatherOpps) {
        opportunities.push({
          id: crypto.randomUUID(),
          brand_id: brandId,
          type: 'weather',
          title: `Weather Opportunity: ${opp.condition}`,
          description: opp.marketing_angle,
          urgency: this.calculateWeatherUrgency(opp),
          expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
          action_items: [
            `Create content highlighting ${opp.suggested_products?.join(', ') || 'relevant products'}`,
            'Post on social media with weather-related messaging',
            'Consider urgent promotions for immediate impact',
          ],
          context: opp,
          confidence_score: 0.8,
          detected_at: new Date().toISOString(),
          source: 'weather_api',
        });
      }
    } catch (error) {
      console.error('Error detecting weather opportunities:', error);
    }

    return opportunities;
  }

  /**
   * Detect trending topics opportunities
   */
  static async detectTrendingOpportunities(
    brandId: string
  ): Promise<Opportunity[]> {
    const opportunities: Opportunity[] = [];

    try {
      // Get brand industry and keywords
      const { data: brand } = await supabase
        .from('brands')
        .select('industry, business_name')
        .eq('id', brandId)
        .single();

      if (!brand) {
        return opportunities;
      }

      // Simulate trending topics API (replace with Google Trends, Twitter API later)
      const trends = await this.getTrendingTopics(brand.industry);

      for (const trend of trends) {
        const relevanceScore = this.calculateRelevance(
          trend.topic,
          brand.industry
        );

        if (relevanceScore > 0.6) {
          opportunities.push({
            id: crypto.randomUUID(),
            brand_id: brandId,
            type: 'trending',
            title: `Trending: ${trend.topic}`,
            description: trend.suggested_content,
            urgency: this.calculateTrendUrgency(trend),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            action_items: [
              `Create content about ${trend.topic}`,
              `Use trending hashtags on ${trend.platform}`,
              'Post within next 6 hours for maximum visibility',
            ],
            context: trend,
            confidence_score: relevanceScore,
            detected_at: new Date().toISOString(),
            source: trend.platform,
          });
        }
      }
    } catch (error) {
      console.error('Error detecting trending opportunities:', error);
    }

    return opportunities;
  }

  /**
   * Detect competitor-based opportunities
   */
  static async detectCompetitorOpportunities(
    brandId: string
  ): Promise<Opportunity[]> {
    const opportunities: Opportunity[] = [];

    try {
      // Get recent competitor snapshots
      const { data: snapshots } = await supabase
        .from('competitive_intelligence_snapshots')
        .select('*')
        .eq('brand_id', brandId)
        .gte(
          'created_at',
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        )
        .order('created_at', { ascending: false });

      if (!snapshots || snapshots.length === 0) {
        return opportunities;
      }

      // Analyze competitor activity
      for (const snapshot of snapshots) {
        if (snapshot.changes_detected && snapshot.changes_detected.length > 0) {
          const competitorOpp: CompetitorOpportunity = {
            competitor_name: snapshot.competitor_name,
            activity_type: snapshot.snapshot_type,
            detected_change: snapshot.changes_detected.join(', '),
            differentiation_angle: 'Differentiate by highlighting our unique value',
            recommended_response: 'Create counter-messaging campaign',
          };

          opportunities.push({
            id: crypto.randomUUID(),
            brand_id: brandId,
            type: 'competitor',
            title: `Competitor Activity: ${snapshot.competitor_name}`,
            description: `${snapshot.competitor_name} made changes: ${snapshot.changes_detected[0]}`,
            urgency: 'medium',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            action_items: [
              'Review competitor changes in detail',
              'Identify differentiation opportunities',
              'Update messaging to highlight our advantages',
            ],
            context: competitorOpp,
            confidence_score: 0.75,
            detected_at: new Date().toISOString(),
            source: 'competitive_monitoring',
          });
        }
      }
    } catch (error) {
      console.error('Error detecting competitor opportunities:', error);
    }

    return opportunities;
  }

  /**
   * Detect seasonal/holiday opportunities
   */
  static async detectSeasonalOpportunities(
    brandId: string
  ): Promise<Opportunity[]> {
    const opportunities: Opportunity[] = [];

    try {
      // Get brand industry
      const { data: brand } = await supabase
        .from('brands')
        .select('industry')
        .eq('id', brandId)
        .single();

      if (!brand) {
        return opportunities;
      }

      // Get upcoming seasonal events (next 30 days)
      const upcomingEvents = this.getUpcomingSeasonalEvents(brand.industry);

      for (const event of upcomingEvents) {
        opportunities.push({
          id: crypto.randomUUID(),
          brand_id: brandId,
          type: 'seasonal',
          title: `Upcoming: ${event.event}`,
          description: `Prepare for ${event.event} - ${event.preparation_days} days to prepare`,
          urgency: this.calculateSeasonalUrgency(event.preparation_days),
          expires_at: event.start_date,
          action_items: event.suggested_campaigns.map((campaign) => campaign),
          context: event,
          confidence_score: 0.9,
          detected_at: new Date().toISOString(),
          source: 'seasonal_calendar',
        });
      }
    } catch (error) {
      console.error('Error detecting seasonal opportunities:', error);
    }

    return opportunities;
  }

  /**
   * Detect local news opportunities
   */
  static async detectLocalNewsOpportunities(
    brandId: string
  ): Promise<Opportunity[]> {
    const opportunities: Opportunity[] = [];

    try {
      // Get brand location
      const { data: brand } = await supabase
        .from('brands')
        .select('location, industry')
        .eq('id', brandId)
        .single();

      if (!brand?.location) {
        return opportunities;
      }

      // Simulate local news API (replace with real news API later)
      const localNews = await this.getLocalNews(brand.location, brand.industry);

      for (const news of localNews) {
        opportunities.push({
          id: crypto.randomUUID(),
          brand_id: brandId,
          type: 'local_news',
          title: `Local Event: ${news.title}`,
          description: news.marketing_angle,
          urgency: 'medium',
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          action_items: [
            'Create content tying brand to local event',
            'Engage with community on social media',
            'Consider event sponsorship or participation',
          ],
          context: news,
          confidence_score: 0.7,
          detected_at: new Date().toISOString(),
          source: 'local_news_api',
        });
      }
    } catch (error) {
      console.error('Error detecting local news opportunities:', error);
    }

    return opportunities;
  }

  /**
   * Store opportunities in database
   */
  static async storeOpportunities(
    brandId: string,
    opportunities: Opportunity[]
  ): Promise<void> {
    try {
      if (opportunities.length === 0) return;

      await supabase.from('intelligence_opportunities').insert(
        opportunities.map((opp) => ({
          id: opp.id,
          brand_id: opp.brand_id,
          type: opp.type,
          title: opp.title,
          description: opp.description,
          urgency: opp.urgency,
          expires_at: opp.expires_at,
          action_items: opp.action_items,
          context: opp.context,
          confidence_score: opp.confidence_score,
          detected_at: opp.detected_at,
          source: opp.source,
        }))
      );
    } catch (error) {
      console.error('Error storing opportunities:', error);
      throw error;
    }
  }

  /**
   * Clean up expired opportunities
   */
  static async cleanupExpiredOpportunities(brandId: string): Promise<void> {
    try {
      await supabase
        .from('intelligence_opportunities')
        .delete()
        .eq('brand_id', brandId)
        .lt('expires_at', new Date().toISOString());
    } catch (error) {
      console.error('Error cleaning up expired opportunities:', error);
    }
  }

  // Helper methods

  private static async getWeatherData(
    location: string
  ): Promise<WeatherOpportunity> {
    // Simulate weather API - replace with real API
    return {
      location,
      condition: 'rain',
      temperature: 55,
      forecast: 'Heavy rain expected for next 4 hours',
      marketing_angle: 'Promote delivery service - customers avoid going out',
      suggested_products: ['delivery', 'indoor products'],
    };
  }

  private static analyzeWeatherConditions(
    weather: WeatherOpportunity,
    industry: string
  ): WeatherOpportunity[] {
    // Analyze weather and return marketing opportunities
    // This is simplified - real implementation would be more sophisticated
    return [weather];
  }

  private static calculateWeatherUrgency(
    weather: WeatherOpportunity
  ): OpportunityUrgency {
    if (weather.condition === 'storm' || weather.condition === 'snow') {
      return 'critical';
    }
    if (weather.condition === 'rain' || weather.temperature > 90) {
      return 'high';
    }
    return 'medium';
  }

  private static async getTrendingTopics(
    industry: string
  ): Promise<TrendingOpportunity[]> {
    // Simulate trending topics API - replace with Google Trends, Twitter API
    return [
      {
        topic: 'AI automation',
        platform: 'google_trends',
        search_volume: 50000,
        velocity: 'rising',
        relevance_score: 0.8,
        suggested_content: 'Create content about how AI is transforming your industry',
      },
    ];
  }

  private static calculateRelevance(topic: string, industry: string): number {
    // Simplified relevance calculation
    // Real implementation would use embeddings or NLP
    return 0.7;
  }

  private static calculateTrendUrgency(
    trend: TrendingOpportunity
  ): OpportunityUrgency {
    if (trend.velocity === 'rising' && trend.search_volume > 100000) {
      return 'critical';
    }
    if (trend.velocity === 'rising') {
      return 'high';
    }
    return 'medium';
  }

  private static getUpcomingSeasonalEvents(
    industry: string
  ): SeasonalOpportunity[] {
    // Simplified seasonal calendar
    const now = new Date();
    const events: SeasonalOpportunity[] = [];

    // Example: Back to school (August)
    if (now.getMonth() === 6) {
      // July
      events.push({
        event: 'Back to School',
        start_date: new Date(now.getFullYear(), 7, 15).toISOString(),
        end_date: new Date(now.getFullYear(), 8, 15).toISOString(),
        preparation_days: 30,
        suggested_campaigns: [
          'Create back-to-school product bundles',
          'Run student discount promotion',
          'Share educational content',
        ],
      });
    }

    return events;
  }

  private static calculateSeasonalUrgency(
    preparationDays: number
  ): OpportunityUrgency {
    if (preparationDays <= 7) return 'critical';
    if (preparationDays <= 14) return 'high';
    if (preparationDays <= 21) return 'medium';
    return 'low';
  }

  private static async getLocalNews(
    location: string,
    industry: string
  ): Promise<any[]> {
    // Simulate local news API - replace with real API
    return [
      {
        title: 'Local Festival Next Weekend',
        marketing_angle: 'Tie your brand to community celebration',
        url: 'https://example.com/news',
      },
    ];
  }
}
