import {
  OpportunityInsight,
  OpportunityType,
  OpportunitySource,
  SuggestedAction,
} from '@/types/intelligence.types'
import { supabase } from '@/lib/supabase'
import { WeatherAlertsService } from './weather-alerts'
import { TrendAnalyzerService } from './trend-analyzer'
import { NewsAPI } from './news-api'

/**
 * Opportunity Detector Service
 * Detects marketing opportunities from various signals:
 * - Weather conditions
 * - Trending topics
 * - Competitor activity
 * - Seasonal triggers
 * - Local news/events
 */

interface DetectionConfig {
  brandId: string
  industry?: string
  location?: string
  keywords?: string[]
}

export class OpportunityDetector {
  /**
   * Detect all opportunities for a brand
   */
  static async detectOpportunities(
    config: DetectionConfig
  ): Promise<OpportunityInsight[]> {
    const opportunities: OpportunityInsight[] = []

    // Run all detectors in parallel
    const [
      weatherOpps,
      trendingOpps,
      competitorOpps,
      seasonalOpps,
      newsOpps,
    ] = await Promise.all([
      this.detectWeatherOpportunities(config),
      this.detectTrendingTopics(config),
      this.detectCompetitorActivity(config),
      this.detectSeasonalTriggers(config),
      this.detectLocalNews(config),
    ])

    opportunities.push(
      ...weatherOpps,
      ...trendingOpps,
      ...competitorOpps,
      ...seasonalOpps,
      ...newsOpps
    )

    // Sort by impact score and urgency
    return opportunities.sort((a, b) => {
      const urgencyWeight = { critical: 4, high: 3, medium: 2, low: 1 }
      const aScore = a.impact_score + urgencyWeight[a.urgency] * 10
      const bScore = b.impact_score + urgencyWeight[b.urgency] * 10
      return bScore - aScore
    })
  }

  /**
   * Detect weather-based opportunities
   */
  static async detectWeatherOpportunities(
    config: DetectionConfig
  ): Promise<OpportunityInsight[]> {
    try {
      console.log('[OpportunityDetector] Detecting weather opportunities...')

      const opportunities = await WeatherAlertsService.detectWeatherOpportunities({
        brandId: config.brandId,
        location: config.location || 'Dallas, TX',
        industry: config.industry || '',
        zipCode: undefined,
        latitude: undefined,
        longitude: undefined
      })

      console.log(`[OpportunityDetector] Found ${opportunities.length} weather opportunities`)
      return opportunities
    } catch (error) {
      console.error('[OpportunityDetector] Weather detection failed:', error)
      throw new Error(
        `Weather-based opportunity detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Detect trending topics
   */
  static async detectTrendingTopics(
    config: DetectionConfig
  ): Promise<OpportunityInsight[]> {
    try {
      console.log('[OpportunityDetector] Detecting trending topics...')

      // If no keywords provided, skip trending detection
      if (!config.keywords || config.keywords.length === 0) {
        console.log('[OpportunityDetector] No keywords provided for trend analysis')
        return []
      }

      const opportunities = await TrendAnalyzerService.detectTrendingTopics({
        brandId: config.brandId,
        industry: config.industry || '',
        keywords: config.keywords,
        location: config.location,
        language: 'en'
      })

      console.log(`[OpportunityDetector] Found ${opportunities.length} trending opportunities`)
      return opportunities
    } catch (error) {
      console.error('[OpportunityDetector] Trend detection failed:', error)
      throw new Error(
        `Trending topic detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Detect competitor activity
   */
  static async detectCompetitorActivity(
    config: DetectionConfig
  ): Promise<OpportunityInsight[]> {
    console.log('[OpportunityDetector] Competitor monitoring not yet implemented, returning empty results')
    return [] // Return empty array instead of throwing
  }

  /**
   * Detect seasonal triggers
   */
  static async detectSeasonalTriggers(
    config: DetectionConfig
  ): Promise<OpportunityInsight[]> {
    console.log('[OpportunityDetector] Seasonal triggers not yet implemented, returning empty results')
    return [] // Return empty array instead of throwing
  }

  /**
   * Detect local news opportunities
   */
  static async detectLocalNews(
    config: DetectionConfig
  ): Promise<OpportunityInsight[]> {
    try {
      console.log('[OpportunityDetector] Detecting local news opportunities...')

      // Fetch industry news
      const industryNews = await NewsAPI.getIndustryNews(
        config.industry || '',
        config.keywords || []
      )

      // Fetch local news if location provided
      const localNews = config.location
        ? await NewsAPI.getLocalNews(config.location)
        : []

      // Convert news articles to opportunities
      const opportunities: OpportunityInsight[] = []

      // Process top industry news
      for (const article of industryNews.slice(0, 5)) {
        if (article.relevanceScore >= 70) {
          opportunities.push({
            id: `news_industry_${Date.now()}_${Math.random()}`,
            brand_id: config.brandId,
            type: 'local_news',
            title: `Industry News: ${article.title}`,
            description: article.description,
            source: 'news_api',
            source_data: {
              url: article.url,
              published_at: article.publishedAt,
              source: article.source,
              relevance: article.relevanceScore
            },
            impact_score: article.relevanceScore,
            urgency: 'medium',
            confidence: 0.75,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'new',
            suggested_actions: [
              {
                action_type: 'create_content',
                description: 'Create commentary or response content',
                priority: 'medium',
                estimated_effort: 'medium',
                potential_impact: article.relevanceScore
              }
            ],
            created_at: new Date().toISOString()
          })
        }
      }

      // Process local news
      for (const article of localNews.slice(0, 3)) {
        opportunities.push({
          id: `news_local_${Date.now()}_${Math.random()}`,
          brand_id: config.brandId,
          type: 'local_news',
          title: `Local News: ${article.title}`,
          description: article.description,
          source: 'news_api',
          source_data: {
            url: article.url,
            published_at: article.publishedAt,
            source: article.source,
            location: config.location
          },
          impact_score: 65,
          urgency: 'low',
          confidence: 0.7,
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'new',
          suggested_actions: [
            {
              action_type: 'create_content',
              description: 'Leverage local event for engagement',
              priority: 'low',
              estimated_effort: 'low',
              potential_impact: 65
            }
          ],
          created_at: new Date().toISOString()
        })
      }

      console.log(`[OpportunityDetector] Found ${opportunities.length} news opportunities`)
      return opportunities
    } catch (error) {
      console.error('[OpportunityDetector] News detection failed:', error)
      throw new Error(
        `Local news detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Calculate impact score for an opportunity
   */
  static calculateImpactScore(
    reach: number,
    relevance: number,
    timeliness: number,
    confidence: number
  ): number {
    // Weighted scoring: Relevance (40%), Reach (30%), Timeliness (20%), Confidence (10%)
    return Math.round(
      relevance * 0.4 + reach * 0.3 + timeliness * 0.2 + confidence * 0.1
    )
  }

  /**
   * Calculate urgency level based on expiration
   */
  static calculateUrgency(expiresAt?: string): 'critical' | 'high' | 'medium' | 'low' {
    if (!expiresAt) return 'low'

    const hoursUntilExpiration =
      (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)

    if (hoursUntilExpiration < 24) return 'critical'
    if (hoursUntilExpiration < 72) return 'high'
    if (hoursUntilExpiration < 168) return 'medium'
    return 'low'
  }

  /**
   * Get active opportunities from database
   */
  static async getActiveOpportunities(
    brandId: string
  ): Promise<OpportunityInsight[]> {
    try {
      const { data, error } = await supabase
        .from('intelligence_opportunities')
        .select('*')
        .eq('brand_id', brandId)
        .in('status', ['new', 'reviewed'])
        .order('impact_score', { ascending: false })
        .limit(20)

      if (error) throw error

      return data as OpportunityInsight[]
    } catch (error) {
      console.error('Failed to get active opportunities:', error)
      return []
    }
  }

  /**
   * Save opportunity to database
   */
  static async saveOpportunity(
    opportunity: OpportunityInsight
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('intelligence_opportunities')
        .insert(opportunity)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to save opportunity:', error)
      return false
    }
  }

  /**
   * Dismiss opportunity
   */
  static async dismissOpportunity(opportunityId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('intelligence_opportunities')
        .update({ status: 'dismissed' })
        .eq('id', opportunityId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to dismiss opportunity:', error)
      return false
    }
  }

  /**
   * Mark opportunity as actioned
   */
  static async markAsActioned(opportunityId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('intelligence_opportunities')
        .update({
          status: 'actioned',
          actioned_at: new Date().toISOString(),
        })
        .eq('id', opportunityId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to mark opportunity as actioned:', error)
      return false
    }
  }
}
