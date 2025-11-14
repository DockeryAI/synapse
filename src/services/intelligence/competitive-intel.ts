import {
  CompetitorActivity,
  CompetitivePositioningAnalysis,
  OpportunityInsight,
} from '@/types/intelligence.types'
import { supabase } from '@/lib/supabase'
import { SynapseAutoAnalyzer } from './synapse-auto-analyzer'

/**
 * Competitive Intelligence Service
 * Monitors competitor activity and identifies positioning opportunities
 * Integrates with Synapse for automatic positioning analysis
 */

interface CompetitiveConfig {
  brandId: string
  competitorIds: string[]
  monitoringPlatforms: string[]
  ourMessaging?: string
  industry: string
}

interface CompetitorProfile {
  id: string
  name: string
  website?: string
  social_handles: Record<string, string>
  industry: string
}

export class CompetitiveIntelService {
  private static readonly CACHE_TTL_HOURS = 6

  /**
   * Monitor all competitors and detect activity
   */
  static async monitorCompetitors(
    config: CompetitiveConfig
  ): Promise<OpportunityInsight[]> {
    const opportunities: OpportunityInsight[] = []

    try {
      // Get competitor profiles
      const competitors = await this.getCompetitorProfiles(config.competitorIds)

      // Monitor each competitor
      for (const competitor of competitors) {
        const activities = await this.detectCompetitorActivity(
          competitor,
          config.monitoringPlatforms
        )

        // Convert significant activities to opportunities
        for (const activity of activities) {
          if (this.isSignificantActivity(activity)) {
            const opportunity = this.convertActivityToOpportunity(
              activity,
              config.brandId
            )
            opportunities.push(opportunity)
            await this.saveActivity(activity)
          }
        }
      }

      return opportunities
    } catch (error) {
      console.error('Competitive monitoring failed:', error)
      return opportunities
    }
  }

  /**
   * Detect competitor activity across platforms
   */
  static async detectCompetitorActivity(
    competitor: CompetitorProfile,
    platforms: string[]
  ): Promise<CompetitorActivity[]> {
    const activities: CompetitorActivity[] = []

    try {
      // Check cache first
      const cached = await this.getCachedActivity(competitor.id)
      if (cached) return cached

      // Monitor social media platforms
      for (const platform of platforms) {
        const platformActivities = await this.monitorPlatform(
          competitor,
          platform
        )
        activities.push(...platformActivities)
      }

      // Monitor website/blog changes
      const websiteActivities = await this.monitorWebsite(competitor)
      activities.push(...websiteActivities)

      // Cache results
      await this.cacheActivity(competitor.id, activities)

      return activities
    } catch (error) {
      console.error(`Failed to detect activity for ${competitor.name}:`, error)
      return activities
    }
  }

  /**
   * Monitor platform for competitor activity
   */
  private static async monitorPlatform(
    competitor: CompetitorProfile,
    platform: string
  ): Promise<CompetitorActivity[]> {
    // In production, integrate with social media APIs
    // For now, return mock data
    return this.getMockPlatformActivity(competitor, platform)
  }

  /**
   * Monitor website for competitor changes
   */
  private static async monitorWebsite(
    competitor: CompetitorProfile
  ): Promise<CompetitorActivity[]> {
    // In production, scrape competitor website for changes
    // For now, return mock data
    return this.getMockWebsiteActivity(competitor)
  }

  /**
   * Analyze competitive positioning
   */
  static async analyzePositioning(
    brandId: string,
    competitorId: string,
    ourMessaging: string,
    theirMessaging: string
  ): Promise<CompetitivePositioningAnalysis> {
    try {
      // Use Synapse to analyze both messaging
      const [ourAnalysis, theirAnalysis] = await Promise.all([
        SynapseAutoAnalyzer.analyzeContent(ourMessaging, 'uvp'),
        SynapseAutoAnalyzer.analyzeContent(theirMessaging, 'uvp'),
      ])

      // Compare psychology scores
      const psychologyComparison = {
        our_score: ourAnalysis.psychology_score,
        their_score: theirAnalysis.psychology_score,
        gap_analysis: this.generateGapAnalysis(ourAnalysis, theirAnalysis),
      }

      // Identify positioning gaps
      const positioningGaps = this.identifyPositioningGaps(
        ourAnalysis,
        theirAnalysis
      )

      // Generate recommendations
      const recommendedPivots = this.generateRecommendedPivots(
        ourAnalysis,
        theirAnalysis,
        positioningGaps
      )

      const analysis: CompetitivePositioningAnalysis = {
        id: `positioning_${brandId}_${competitorId}_${Date.now()}`,
        brand_id: brandId,
        competitor_id: competitorId,
        our_messaging: ourMessaging,
        their_messaging: theirMessaging,
        psychology_comparison: psychologyComparison,
        positioning_gaps: positioningGaps,
        strengths: this.identifyStrengths(ourAnalysis, theirAnalysis),
        weaknesses: this.identifyWeaknesses(ourAnalysis, theirAnalysis),
        recommended_pivots: recommendedPivots,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Save analysis
      await this.savePositioningAnalysis(analysis)

      return analysis
    } catch (error) {
      console.error('Positioning analysis failed:', error)
      throw error
    }
  }

  /**
   * Generate gap analysis
   */
  private static generateGapAnalysis(ourAnalysis: any, theirAnalysis: any): string[] {
    const gaps: string[] = []

    // Score comparison
    const scoreDiff = theirAnalysis.psychology_score - ourAnalysis.psychology_score
    if (scoreDiff > 10) {
      gaps.push(
        `They have ${scoreDiff} points higher psychology score - their messaging resonates more`
      )
    } else if (scoreDiff < -10) {
      gaps.push('Our messaging has stronger psychological impact')
    }

    // Power words comparison
    if (theirAnalysis.power_words.length > ourAnalysis.power_words.length) {
      gaps.push(
        `They use ${theirAnalysis.power_words.length - ourAnalysis.power_words.length} more power words`
      )
    }

    // Emotional triggers
    if (theirAnalysis.emotional_triggers.length > ourAnalysis.emotional_triggers.length) {
      gaps.push('They trigger more emotional responses')
    }

    // Cognitive load
    if (ourAnalysis.cognitive_load > theirAnalysis.cognitive_load + 15) {
      gaps.push('Our messaging is more complex - may be harder to understand')
    }

    return gaps
  }

  /**
   * Identify positioning gaps
   */
  private static identifyPositioningGaps(
    ourAnalysis: any,
    theirAnalysis: any
  ): CompetitivePositioningAnalysis['positioning_gaps'] {
    const gaps: CompetitivePositioningAnalysis['positioning_gaps'] = []

    // Check for persuasion element gaps
    const ourPrinciples = new Set(
      ourAnalysis.persuasion_elements.map((p: any) => p.principle)
    )
    const theirPrinciples = new Set(
      theirAnalysis.persuasion_elements.map((p: any) => p.principle)
    )

    for (const principle of theirPrinciples) {
      if (!ourPrinciples.has(principle)) {
        gaps.push({
          gap: `Missing persuasion principle: ${principle}`,
          severity: 'medium',
          opportunity_description: `Competitor uses ${principle} effectively in their messaging`,
          suggested_adjustment: `Incorporate ${principle} elements into positioning`,
        })
      }
    }

    // Check emotional trigger gaps
    if (theirAnalysis.emotional_triggers.length > ourAnalysis.emotional_triggers.length) {
      gaps.push({
        gap: 'Fewer emotional triggers',
        severity: 'medium',
        opportunity_description:
          'Competitor messaging triggers more emotional responses',
        suggested_adjustment: 'Add emotional storytelling and aspirational language',
      })
    }

    // Check simplicity gap
    if (ourAnalysis.cognitive_load > theirAnalysis.cognitive_load + 20) {
      gaps.push({
        gap: 'High cognitive load',
        severity: 'high',
        opportunity_description: 'Our messaging is significantly more complex',
        suggested_adjustment: 'Simplify language and sentence structure',
      })
    }

    return gaps
  }

  /**
   * Identify strengths
   */
  private static identifyStrengths(ourAnalysis: any, theirAnalysis: any): string[] {
    const strengths: string[] = []

    if (ourAnalysis.psychology_score > theirAnalysis.psychology_score) {
      strengths.push('Higher psychological impact')
    }

    if (ourAnalysis.power_words.length > theirAnalysis.power_words.length) {
      strengths.push('More effective use of power words')
    }

    if (ourAnalysis.cognitive_load < theirAnalysis.cognitive_load) {
      strengths.push('Clearer, easier to understand messaging')
    }

    if (ourAnalysis.connections.length > theirAnalysis.connections.length) {
      strengths.push('Stronger conceptual connections')
    }

    return strengths
  }

  /**
   * Identify weaknesses
   */
  private static identifyWeaknesses(ourAnalysis: any, theirAnalysis: any): string[] {
    const weaknesses: string[] = []

    if (ourAnalysis.psychology_score < theirAnalysis.psychology_score - 15) {
      weaknesses.push('Significantly lower psychological resonance')
    }

    if (ourAnalysis.emotional_triggers.length < theirAnalysis.emotional_triggers.length) {
      weaknesses.push('Fewer emotional triggers')
    }

    if (ourAnalysis.cognitive_load > theirAnalysis.cognitive_load + 15) {
      weaknesses.push('More complex, harder to grasp quickly')
    }

    if (ourAnalysis.power_words.length < theirAnalysis.power_words.length - 3) {
      weaknesses.push('Limited use of impactful language')
    }

    return weaknesses
  }

  /**
   * Generate recommended pivots
   */
  private static generateRecommendedPivots(
    ourAnalysis: any,
    theirAnalysis: any,
    gaps: CompetitivePositioningAnalysis['positioning_gaps']
  ): CompetitivePositioningAnalysis['recommended_pivots'] {
    const pivots: CompetitivePositioningAnalysis['recommended_pivots'] = []

    // Simplification pivot
    if (ourAnalysis.cognitive_load > 70) {
      pivots.push({
        current_position: 'Complex, detailed messaging',
        suggested_position: 'Simple, clear value proposition',
        expected_impact: 75,
        implementation_difficulty: 'medium',
      })
    }

    // Emotional connection pivot
    if (ourAnalysis.emotional_triggers.length < 3) {
      pivots.push({
        current_position: 'Rational, feature-focused messaging',
        suggested_position: 'Emotionally resonant, benefit-focused messaging',
        expected_impact: 80,
        implementation_difficulty: 'medium',
      })
    }

    // Power words pivot
    if (ourAnalysis.power_words.length < 5) {
      pivots.push({
        current_position: 'Neutral, descriptive language',
        suggested_position: 'Impactful, action-oriented language',
        expected_impact: 65,
        implementation_difficulty: 'easy',
      })
    }

    return pivots
  }

  /**
   * Check if activity is significant
   */
  private static isSignificantActivity(activity: CompetitorActivity): boolean {
    // Significant if high threat/opportunity level or high engagement
    if (activity.threat_level === 'critical' || activity.threat_level === 'high') {
      return true
    }

    if (activity.opportunity_level === 'high') {
      return true
    }

    if (activity.engagement_metrics) {
      const totalEngagement =
        activity.engagement_metrics.likes +
        activity.engagement_metrics.comments +
        activity.engagement_metrics.shares
      if (totalEngagement > 500) {
        return true
      }
    }

    return false
  }

  /**
   * Convert activity to opportunity
   */
  private static convertActivityToOpportunity(
    activity: CompetitorActivity,
    brandId: string
  ): OpportunityInsight {
    const urgency = activity.threat_level === 'critical' ? 'critical' : 'high'
    const impactScore = this.calculateActivityImpact(activity)

    return {
      id: `opp_${activity.id}`,
      brand_id: brandId,
      type: 'competitor_move',
      title: `Competitor Move: ${activity.competitor_name} - ${activity.activity_type}`,
      description: activity.description,
      source: 'competitor_monitoring',
      source_data: {
        competitor: activity.competitor_name,
        activity_type: activity.activity_type,
        platform: activity.platform,
        engagement: activity.engagement_metrics,
        sentiment: activity.sentiment,
      },
      impact_score: impactScore,
      urgency,
      confidence: 0.9,
      status: 'new',
      suggested_actions: activity.recommended_response.map((response) => ({
        action_type: 'respond' as const,
        description: response,
        priority: urgency === 'critical' ? 'critical' : 'high',
        estimated_effort: 'medium',
        potential_impact: impactScore,
      })),
      created_at: new Date().toISOString(),
    }
  }

  /**
   * Calculate activity impact score
   */
  private static calculateActivityImpact(activity: CompetitorActivity): number {
    let impact = 50 // Base score

    // Threat level
    const threatScores = { low: 10, medium: 20, high: 30, critical: 40 }
    impact += threatScores[activity.threat_level]

    // Opportunity level
    const oppScores = { low: 5, medium: 10, high: 20 }
    impact += oppScores[activity.opportunity_level]

    // Engagement
    if (activity.engagement_metrics) {
      const totalEngagement =
        activity.engagement_metrics.likes +
        activity.engagement_metrics.comments +
        activity.engagement_metrics.shares
      impact += Math.min(totalEngagement / 100, 20)
    }

    return Math.min(Math.round(impact), 100)
  }

  /**
   * Mock data generators
   */
  private static getMockPlatformActivity(
    competitor: CompetitorProfile,
    platform: string
  ): CompetitorActivity[] {
    return [
      {
        id: `activity_${competitor.id}_${platform}_${Date.now()}`,
        competitor_id: competitor.id,
        competitor_name: competitor.name,
        activity_type: 'campaign',
        description: `Launched new ${platform} campaign promoting premium service tier`,
        platform,
        engagement_metrics: {
          likes: 1250,
          comments: 180,
          shares: 95,
          reach: 15000,
        },
        sentiment: 'positive',
        threat_level: 'medium',
        opportunity_level: 'high',
        recommended_response: [
          'Highlight your existing premium features',
          'Create comparison content',
          'Offer limited-time premium upgrade promotion',
        ],
        detected_at: new Date().toISOString(),
        source_url: `https://${platform}.com/${competitor.name}`,
      },
    ]
  }

  private static getMockWebsiteActivity(
    competitor: CompetitorProfile
  ): CompetitorActivity[] {
    return [
      {
        id: `activity_${competitor.id}_website_${Date.now()}`,
        competitor_id: competitor.id,
        competitor_name: competitor.name,
        activity_type: 'product_launch',
        description: 'Added new service offering to website - 24/7 support package',
        sentiment: 'neutral',
        threat_level: 'high',
        opportunity_level: 'medium',
        recommended_response: [
          'Emphasize your existing 24/7 support',
          'Create content about your support quality',
          'Offer free trial of support services',
        ],
        detected_at: new Date().toISOString(),
        source_url: competitor.website,
      },
    ]
  }

  /**
   * Database operations
   */
  private static async getCompetitorProfiles(
    ids: string[]
  ): Promise<CompetitorProfile[]> {
    try {
      const { data, error } = await supabase
        .from('competitors')
        .select('*')
        .in('id', ids)

      if (error) throw error
      return (data as CompetitorProfile[]) || []
    } catch (error) {
      console.error('Failed to get competitor profiles:', error)
      // Return mock data for development
      return ids.map((id) => ({
        id,
        name: `Competitor ${id.slice(0, 8)}`,
        industry: 'services',
        social_handles: {
          facebook: `competitor${id.slice(0, 4)}`,
          instagram: `competitor${id.slice(0, 4)}`,
        },
      }))
    }
  }

  private static async saveActivity(activity: CompetitorActivity): Promise<void> {
    try {
      await supabase.from('competitor_activities').insert(activity)
    } catch (error) {
      console.error('Failed to save activity:', error)
    }
  }

  private static async savePositioningAnalysis(
    analysis: CompetitivePositioningAnalysis
  ): Promise<void> {
    try {
      await supabase.from('competitive_positioning_analysis').insert(analysis)
    } catch (error) {
      console.error('Failed to save positioning analysis:', error)
    }
  }

  /**
   * Cache management
   */
  private static async getCachedActivity(
    competitorId: string
  ): Promise<CompetitorActivity[] | null> {
    try {
      const cacheKey = `competitor_activity_${competitorId}`
      const cached = localStorage.getItem(cacheKey)
      if (!cached) return null

      const data = JSON.parse(cached)
      const cacheTime = new Date(data.cached_at).getTime()
      const now = Date.now()
      const ttl = this.CACHE_TTL_HOURS * 60 * 60 * 1000

      if (now - cacheTime > ttl) {
        localStorage.removeItem(cacheKey)
        return null
      }

      return data.activities
    } catch {
      return null
    }
  }

  private static async cacheActivity(
    competitorId: string,
    activities: CompetitorActivity[]
  ): Promise<void> {
    try {
      const cacheKey = `competitor_activity_${competitorId}`
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          activities,
          cached_at: new Date().toISOString(),
        })
      )
    } catch (error) {
      console.error('Failed to cache activity:', error)
    }
  }
}
