/**
 * Market Position Service
 * Analyzes competitive market position using real-time data
 */

import {
  type BrandData,
  type MarketPositionAnalysis,
  type MarketPositionData,
  type Competitor,
  type CompetitiveGap,
  type BusinessModelDetection,
} from '@/types/mirror-diagnostics'
import { chat } from '@/lib/openrouter'
import { SemrushAPI } from '@/services/intelligence/semrush-api'
import { OutScraperAPI } from '@/services/intelligence/outscraper-api'
import { BusinessModelDetectorService } from './business-model-detector.service'

export class MarketPositionService {
  /**
   * Run full market position analysis
   */
  static async analyzeMarketPosition(
    brandId: string,
    brandData: BrandData
  ): Promise<MarketPositionAnalysis> {
    console.log('[MarketPositionService] Starting analysis for:', brandData.name)

    try {
      // Detect brand's business model
      const brandModel = await BusinessModelDetectorService.detectBusinessModel(brandData)
      console.log('[MarketPosition] Brand classified as:', brandModel.model)

      // Discover real competitors
      let competitors = await this.discoverCompetitors(
        brandData.industry,
        brandData.location || '',
        brandData.name
      )

      // If no competitors found, use AI to research market
      if (competitors.length === 0) {
        console.log('[MarketPosition] No competitors found via OutScraper, using AI research...')
        competitors = await this.researchCompetitorsWithAI(brandData)
      }

      // Classify each competitor's business model
      console.log('[MarketPosition] Classifying', competitors.length, 'competitors...')
      const classifiedCompetitors = await Promise.all(
        competitors.map(async (competitor) => {
          try {
            const competitorModel = await BusinessModelDetectorService.classifyCompetitor(
              competitor.name,
              brandData.industry
            )
            return {
              ...competitor,
              business_model: competitorModel.model,
              size_indicator: competitorModel.signals[0] || 'Unknown size',
            }
          } catch (error) {
            console.error('[MarketPosition] Failed to classify:', competitor.name)
            return competitor
          }
        })
      )

      // Filter to only relevant competitors (same size category)
      const relevantCompetitors = BusinessModelDetectorService.filterRelevantCompetitors(
        brandModel.model,
        classifiedCompetitors
      )

      console.log(
        '[MarketPosition] Filtered from',
        classifiedCompetitors.length,
        'to',
        relevantCompetitors.length,
        'relevant competitors'
      )

      // Get detailed keyword rankings from Semrush
      const keywordRankingsDetailed = await this.getDetailedKeywordRankings(
        brandData.name,
        brandData.website
      )

      // Create legacy format for backwards compatibility
      const keywordRankings: Record<string, number> = {}
      keywordRankingsDetailed.forEach((kw) => {
        keywordRankings[kw.keyword] = kw.position
      })

      // Find SMB-actionable competitive gaps
      const competitiveGaps = await this.findCompetitiveGaps(
        brandData,
        relevantCompetitors,
        brandModel.model
      )

      // Analyze pricing position
      const pricingPosition = await this.analyzePricingPosition(
        brandData,
        relevantCompetitors
      )

      // Build complete market position data
      const data: MarketPositionData = {
        current_rank: this.estimateRank(relevantCompetitors, brandData.name),
        total_competitors: relevantCompetitors.length + 1, // Include the brand in total count
        top_competitors: relevantCompetitors.slice(0, 3),
        keyword_rankings: keywordRankings,
        keyword_rankings_detailed: keywordRankingsDetailed,
        competitive_gaps: competitiveGaps,
        pricing_position: pricingPosition,
      }

      // Calculate score
      const score = this.calculatePositionScore(data)

      console.log('[MarketPositionService] Analysis complete. Score:', score)

      return { score, data }
    } catch (error) {
      console.error('[MarketPositionService] Analysis failed, using degraded data:', error)

      // Return degraded but valid analysis
      const data: MarketPositionData = {
        current_rank: 5, // Neutral middle position
        total_competitors: 10, // Estimated market size
        top_competitors: [],
        keyword_rankings: {},
        keyword_rankings_detailed: [],
        competitive_gaps: [{
          gap: 'Market analysis unavailable',
          impact: 'Unable to assess competitive position - API service temporarily unavailable',
          competitors_doing: [],
        }],
        pricing_position: {
          tier: 'mid-market' as const,
          vs_market: 'Unable to determine pricing position',
        },
      }

      return {
        score: 50, // Neutral score when degraded
        data
      }
    }
  }

  /**
   * Research competitors using AI when OutScraper returns no data
   */
  private static async researchCompetitorsWithAI(
    brandData: BrandData
  ): Promise<Competitor[]> {
    try {
      console.log('[MarketPosition] Researching typical competitors for:', brandData.industry)

      const prompt = `Research typical competitors in the ${brandData.industry} industry${brandData.location ? ` in ${brandData.location}` : ''}.

List 3-5 common types of competitors (not specific companies, but competitive categories).

Return ONLY valid JSON:
[
  {
    "name": "Type of competitor (e.g., 'National franchise chains')",
    "positioning": "How they position themselves",
    "strengths": ["Strength 1", "Strength 2", "Strength 3"]
  }
]`

      const response = await chat(
        [{ role: 'user', content: prompt }],
        {
          temperature: 0.3,
          maxTokens: 800,
        }
      )

      const parsed = JSON.parse(response)

      const competitors: Competitor[] = Array.isArray(parsed) ? parsed.map((comp: any) => ({
        name: comp.name,
        url: undefined,
        positioning: comp.positioning,
        strengths: comp.strengths || []
      })) : []

      console.log('[MarketPosition] ✅ AI research found', competitors.length, 'competitor types')
      return competitors

    } catch (error) {
      console.error('[MarketPosition] AI research failed:', error)
      // Return generic competitor categories as last resort
      return [
        {
          name: 'Established industry leaders',
          url: undefined,
          positioning: 'Market leaders with strong brand recognition',
          strengths: ['Brand recognition', 'Large customer base', 'Multiple locations']
        },
        {
          name: 'Local independent providers',
          url: undefined,
          positioning: 'Personal service and local expertise',
          strengths: ['Community relationships', 'Personalized service', 'Local knowledge']
        },
        {
          name: 'Online-first competitors',
          url: undefined,
          positioning: 'Digital convenience and modern approach',
          strengths: ['Easy booking', 'Digital tools', 'Fast response times']
        },
      ]
    }
  }

  /**
   * Discover competitors using OutScraper Google Maps API
   */
  private static async discoverCompetitors(
    industry: string,
    location: string,
    brandName: string
  ): Promise<Competitor[]> {
    try {
      console.log('[MarketPosition] Discovering competitors via OutScraper Google Maps...')

      // Use OutScraper to get real Google Maps business listings
      const query = `${industry} ${location}`
      const listings = await OutScraperAPI.getBusinessListings({
        query,
        location,
        limit: 20, // Get more than we need for filtering
      })

      if (listings.length === 0) {
        console.warn('[MarketPosition] No competitors found on Google Maps, using AI research')
        return [] // Return empty array - caller will handle
      }

      console.log('[MarketPosition] Found', listings.length, 'businesses from Google Maps')

      // Filter out the brand itself (case-insensitive partial match)
      const competitors = listings.filter(
        listing => !listing.name.toLowerCase().includes(brandName.toLowerCase())
      )

      if (competitors.length === 0) {
        console.warn('[MarketPosition] All competitors filtered out, using AI research')
        return [] // Return empty array - caller will handle
      }

      // Convert OutScraper business listings to Competitor format
      const competitorData: Competitor[] = competitors.map(listing => ({
        name: listing.name,
        url: listing.website,
        positioning: this.inferPositioning(listing),
        strengths: this.inferStrengths(listing),
      }))

      console.log('[MarketPosition] Filtered to', competitorData.length, 'relevant competitors')
      return competitorData.slice(0, 8) // Return top 8
    } catch (error) {
      console.error('[MarketPositionService] Competitor discovery failed:', error)
      throw new Error(`Failed to discover competitors: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Infer positioning from Google Maps business data
   */
  private static inferPositioning(listing: import('@/services/intelligence/outscraper-api').BusinessListing): string {
    const parts: string[] = []

    // Rating-based positioning
    if (listing.rating >= 4.7 && listing.reviews_count > 50) {
      parts.push('Highly rated with strong customer satisfaction')
    } else if (listing.rating >= 4.5) {
      parts.push('Well-reviewed by customers')
    } else if (listing.rating >= 4.0) {
      parts.push('Solid customer ratings')
    }

    // Verification status
    if (listing.verified) {
      parts.push('verified business')
    }

    // Review volume
    if (listing.reviews_count > 200) {
      parts.push('established presence with significant customer feedback')
    } else if (listing.reviews_count > 100) {
      parts.push('established with good review volume')
    }

    // Categories
    if (listing.category && listing.category.length > 0) {
      const primaryCategory = listing.category[0]
      parts.push(`specializing in ${primaryCategory}`)
    }

    return parts.length > 0
      ? parts.join(', ')
      : 'Local business in the area'
  }

  /**
   * Infer strengths from Google Maps business data
   */
  private static inferStrengths(listing: import('@/services/intelligence/outscraper-api').BusinessListing): string[] {
    const strengths: string[] = []

    // Rating strength
    if (listing.rating >= 4.7) {
      strengths.push('Excellent customer ratings')
    } else if (listing.rating >= 4.5) {
      strengths.push('High customer satisfaction')
    } else if (listing.rating >= 4.0) {
      strengths.push('Good customer reviews')
    }

    // Review volume strength
    if (listing.reviews_count > 200) {
      strengths.push('Large customer base')
    } else if (listing.reviews_count > 100) {
      strengths.push('Established reputation')
    } else if (listing.reviews_count > 50) {
      strengths.push('Growing customer feedback')
    }

    // Business verification
    if (listing.verified) {
      strengths.push('Google verified business')
    }

    // Claimed listing
    if (listing.claimed) {
      strengths.push('Active online presence')
    }

    // Has website
    if (listing.website) {
      strengths.push('Professional website')
    }

    // Has phone
    if (listing.phone) {
      strengths.push('Direct contact available')
    }

    // Multiple categories (versatile)
    if (listing.category && listing.category.length > 2) {
      strengths.push('Multiple service offerings')
    }

    // Ensure we always return at least 3 strengths
    if (strengths.length === 0) {
      strengths.push('Active in local market', 'Accessible location', 'Professional service')
    }

    return strengths.slice(0, 5) // Return max 5 strengths
  }

  /**
   * Get detailed keyword rankings with volume, difficulty, and trend
   */
  private static async getDetailedKeywordRankings(
    brandName: string,
    brandWebsite?: string
  ): Promise<import('@/types/mirror-diagnostics').KeywordRankingSimple[]> {
    if (!brandWebsite) {
      throw new Error('Website/domain is required to fetch keyword rankings from Semrush')
    }

    try {
      // Extract domain from URL
      const domain = brandWebsite.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]

      console.log('[MarketPosition] Fetching detailed keyword rankings for domain:', domain)

      // Get detailed rankings from Semrush (filters out branded keywords)
      const rankings = await SemrushAPI.getDetailedKeywordMetrics(domain, brandName, 20)

      if (rankings.length === 0) {
        throw new Error(`No keyword ranking data available for domain: ${domain}`)
      }

      // Convert to simple format for storage
      const simpleRankings = rankings.map((ranking) => ({
        keyword: ranking.keyword,
        position: ranking.position,
        searchVolume: ranking.searchVolume,
        difficulty: ranking.difficulty,
        traffic: ranking.traffic,
        trend: ranking.trend,
      }))

      console.log('[MarketPosition] Found', simpleRankings.length, 'detailed keyword rankings')
      return simpleRankings
    } catch (error) {
      console.error('[MarketPosition] Failed to fetch keyword rankings:', error)
      throw new Error(`Failed to fetch keyword rankings from Semrush: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get keyword rankings from Semrush API (legacy format)
   * @deprecated Use getDetailedKeywordRankings instead
   */
  private static async getKeywordRankings(
    brandName: string,
    brandWebsite?: string
  ): Promise<Record<string, number>> {
    if (!brandWebsite) {
      throw new Error('Website/domain is required to fetch keyword rankings from Semrush')
    }

    try {
      // Extract domain from URL
      const domain = brandWebsite.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]

      console.log('[MarketPosition] Fetching keyword rankings for domain:', domain)

      // Get rankings from Semrush (filters out branded keywords)
      const rankings = await SemrushAPI.getKeywordRankings(domain, brandName)

      if (rankings.length === 0) {
        throw new Error(`No keyword ranking data available for domain: ${domain}`)
      }

      // Convert to Record<keyword, position> format
      const keywordMap: Record<string, number> = {}
      rankings.slice(0, 20).forEach(ranking => {
        keywordMap[ranking.keyword] = ranking.position
      })

      console.log('[MarketPosition] Found', Object.keys(keywordMap).length, 'keyword rankings')
      return keywordMap
    } catch (error) {
      console.error('[MarketPosition] Failed to fetch keyword rankings:', error)
      throw new Error(`Failed to fetch keyword rankings from Semrush: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Find SMB-actionable competitive gaps
   */
  private static async findCompetitiveGaps(
    brandData: BrandData,
    competitors: Competitor[],
    businessModel: string
  ): Promise<CompetitiveGap[]> {
    if (competitors.length === 0) return []

    // Define SMB-actionable gap categories based on business model
    const smbFocusAreas = this.getSMBFocusAreas(businessModel)

    const prompt = `Analyze competitive gaps for "${brandData.name}", a ${businessModel} business in the ${brandData.industry} industry.

Competitors (similar size businesses):
${competitors.map((c) => `- ${c.name} (${c.size_indicator || 'similar size'}): ${c.strengths.join(', ')}`).join('\n')}

Focus on SMB-ACTIONABLE gaps that a ${businessModel} can realistically implement:
${smbFocusAreas.map(area => `- ${area}`).join('\n')}

Avoid suggesting things that require enterprise resources (massive budgets, large teams, complex software platforms).

Identify the top 3-5 actionable gaps that multiple similar-sized competitors are exploiting.

Return ONLY valid JSON array:
[{"gap":"Specific actionable thing missing","impact":"Business impact for SMB","competitors_doing":["Competitor 1","Competitor 2"]}]`

    try {
      const response = await chat(
        [{ role: 'user', content: prompt }],
        {
          temperature: 0.4,
          maxTokens: 1000,
        }
      )

      const parsed = JSON.parse(response)
      return Array.isArray(parsed) ? parsed.slice(0, 5) : []
    } catch (error) {
      console.error('[MarketPositionService] Failed to find gaps:', error)
      return []
    }
  }

  /**
   * Get SMB-focused areas based on business model
   */
  private static getSMBFocusAreas(businessModel: string): string[] {
    const commonAreas = [
      'Online booking/scheduling',
      'Weekend/evening hours',
      'Specialized services/niches',
      'Response time commitments',
      'Service guarantees',
      'Local community presence',
      'Review generation systems',
      'Referral programs',
      'Content marketing (blog, videos)',
      'Local SEO optimization',
    ]

    if (businessModel === 'solo-practitioner' || businessModel === 'small-local') {
      return [
        'Faster response times (same-day, 24hr)',
        'Niche specialization',
        'Flexible hours (evenings, weekends)',
        'Personal touch/white glove service',
        'Active social media presence',
        'Google My Business optimization',
        'Local partnerships',
        'Free consultations/assessments',
        ...commonAreas.slice(0, 5),
      ]
    }

    if (businessModel === 'multi-location' || businessModel === 'regional') {
      return [
        'Consistent service across locations',
        'Franchise/multi-location management',
        'Brand consistency',
        'Employee training programs',
        'Regional marketing campaigns',
        ...commonAreas,
      ]
    }

    return commonAreas
  }

  /**
   * Analyze pricing position
   */
  private static async analyzePricingPosition(
    brandData: BrandData,
    competitors: Competitor[]
  ): Promise<{ tier: 'budget' | 'mid-market' | 'premium' | 'luxury'; vs_market: string }> {
    // For now, return estimated tier
    // TODO: Scrape actual pricing from websites
    return {
      tier: 'mid-market' as const,
      vs_market: 'Positioned in middle tier - not cheapest, not premium',
    }
  }

  /**
   * Estimate brand's rank among competitors
   */
  private static estimateRank(competitors: Competitor[], brandName: string): number {
    if (competitors.length === 0) {
      // No competitors found = you're #1 in the market (or it's a very niche market)
      console.log('[MarketPosition] No competitors found, assigning rank #1')
      return 1
    }

    // Since we're excluding the brand from competitor search,
    // the total market size is competitors.length + 1 (including the brand)
    // Conservatively estimate brand is in the middle of the pack
    const totalMarketSize = competitors.length + 1
    return Math.ceil(totalMarketSize / 2)
  }

  /**
   * Calculate market position score (0-100)
   */
  private static calculatePositionScore(data: MarketPositionData): number {
    let score = 100

    // Penalty for low rankings
    const avgRank =
      Object.values(data.keyword_rankings).reduce((sum, rank) => sum + rank, 0) /
      Object.keys(data.keyword_rankings).length

    if (avgRank > 10) score -= 30
    else if (avgRank > 5) score -= 15

    // Penalty for many competitive gaps
    score -= data.competitive_gaps.length * 5

    // Penalty for low market position
    if (data.current_rank > 5) score -= 20
    else if (data.current_rank > 3) score -= 10

    return Math.max(0, Math.min(100, score))
  }

}
