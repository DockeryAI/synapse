/**
 * Semrush API Integration
 * SEO and competitor analysis with keyword rankings and opportunities
 * Now proxied through Supabase Edge Function to avoid CORS issues
 */

import { supabase } from '@/lib/supabase'

export interface DomainOverview {
  domain: string
  organic_keywords: number
  organic_traffic: number
  paid_keywords: number
  backlinks: number
  authority_score: number
}

export interface KeywordRanking {
  keyword: string
  position: number
  searchVolume: number
  difficulty: number
  traffic: number
  url: string
  isBranded: boolean // New: flag for brand name keywords
  trend?: 'rising' | 'stable' | 'declining' // Trend indicator
  trendData?: {
    direction: 'up' | 'down' | 'stable'
    changePercent?: number
  }
}

export interface KeywordOpportunity {
  keyword: string
  searchVolume: number
  difficulty: number
  currentPosition?: number
  estimatedTraffic: number
  opportunity: 'quick-win' | 'high-value' | 'long-term'
  reasoning: string
}

export interface SEOMetrics {
  domain: string
  overview: DomainOverview
  rankings: KeywordRanking[]
  opportunities: KeywordOpportunity[]
  competitors: string[]
  healthScore: number
}

class SemrushAPIService {
  /**
   * Get comprehensive domain overview via Edge Function
   */
  async getDomainOverview(domain: string): Promise<DomainOverview> {
    console.log('[Semrush] Fetching domain overview for:', domain)

    try {
      const { data, error } = await supabase.functions.invoke('fetch-seo-metrics', {
        body: {
          domain,
          type: 'overview'
        }
      })

      if (error) {
        console.error('[Semrush] Edge function error:', error)
        throw new Error(`Failed to fetch SEO metrics: ${error.message}`)
      }

      if (!data.success || !data.data || data.data.length === 0) {
        throw new Error('No data returned from SEMrush')
      }

      // Parse the CSV data
      const row = data.data[0]
      const traffic = parseInt(row['Organic Traffic'] || row.Ot || '0')
      const keywords = parseInt(row['Organic Keywords'] || row.Or || '0')
      const ads = parseInt(row['Adwords Keywords'] || row.Ad || '0')
      const backlinks = parseInt(row['Adwords Traffic'] || row.At || '0')

      return {
        domain,
        organic_keywords: keywords,
        organic_traffic: traffic,
        paid_keywords: ads,
        backlinks: backlinks,
        authority_score: Math.min(100, Math.round(backlinks / 100))
      }
    } catch (error) {
      console.error('[Semrush API] Error:', error)
      throw new Error(`Failed to fetch SEMrush data: ${error.message}`)
    }
  }

  /**
   * Get keyword rankings (excluding brand name keywords) via Edge Function
   */
  async getKeywordRankings(domain: string, brandName?: string): Promise<KeywordRanking[]> {
    console.log('[Semrush] Fetching keyword rankings for:', domain)

    try {
      const { data, error } = await supabase.functions.invoke('fetch-seo-metrics', {
        body: {
          domain,
          type: 'keywords'
        }
      })

      if (error) {
        console.error('[Semrush] Edge function error:', error)
        throw new Error(`Failed to fetch keyword rankings: ${error.message}`)
      }

      if (!data.success || !data.data) {
        throw new Error('No data returned from SEMrush')
      }

      const rankings: KeywordRanking[] = data.data
        .filter((row: any) => row.Ph || row.Keyword)
        .map((row: any) => {
          const keyword = row.Ph || row.Keyword || ''
          const isBranded = brandName
            ? keyword.toLowerCase().includes(brandName.toLowerCase())
            : false

          const position = parseInt(row.Po || row.Position || '0')
          const searchVolume = parseInt(row.Nq || row['Search Volume'] || '0')
          const difficulty = this.estimateDifficulty(searchVolume)
          const traffic = parseInt(row.Tr || row.Traffic || '0')

          // Estimate trend based on position performance
          const trend = this.estimateTrend(position, searchVolume, difficulty)

          return {
            keyword,
            position,
            searchVolume,
            difficulty,
            traffic,
            url: row.Ur || row.URL || '',
            isBranded,
            trend: trend.indicator,
            trendData: trend.data,
          }
        })
        .filter((r: KeywordRanking) => r.keyword && !r.isBranded) // Exclude brand name keywords

      console.log('[Semrush] Found', rankings.length, 'non-branded keyword rankings')
      return rankings
    } catch (error) {
      console.error('[Semrush] Error fetching rankings:', error)
      throw new Error(`Failed to fetch keyword rankings: ${error.message}`)
    }
  }

  /**
   * Get detailed keyword metrics for UI display
   * Returns enriched data with volume, difficulty, trend, and context
   */
  async getDetailedKeywordMetrics(
    domain: string,
    brandName?: string,
    limit: number = 20
  ): Promise<KeywordRanking[]> {
    console.log('[Semrush] Fetching detailed keyword metrics for:', domain)

    const rankings = await this.getKeywordRankings(domain, brandName)

    // Sort by a combination of position and traffic potential
    const enrichedRankings = rankings
      .map(ranking => ({
        ...ranking,
        score: this.calculateKeywordImportance(ranking),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    return enrichedRankings
  }

  /**
   * Identify keyword opportunities based on rankings
   */
  async getKeywordOpportunities(
    domain: string,
    brandName?: string
  ): Promise<KeywordOpportunity[]> {
    console.log('[Semrush] Finding keyword opportunities for:', domain)

    const rankings = await this.getKeywordRankings(domain, brandName)
    const opportunities: KeywordOpportunity[] = []

    for (const ranking of rankings) {
      // Quick wins: position 11-20, decent volume
      if (ranking.position >= 11 && ranking.position <= 20 && ranking.searchVolume >= 100) {
        opportunities.push({
          keyword: ranking.keyword,
          searchVolume: ranking.searchVolume,
          difficulty: ranking.difficulty,
          currentPosition: ranking.position,
          estimatedTraffic: Math.round(ranking.searchVolume * 0.15), // Estimated traffic if we rank #1
          opportunity: 'quick-win',
          reasoning: `Currently ranked #${ranking.position} - just outside page 1. With optimization, could reach top 10.`,
        })
      }

      // High value: high volume, not ranked yet or ranked low
      if (ranking.searchVolume >= 1000 && (!ranking.position || ranking.position > 50)) {
        opportunities.push({
          keyword: ranking.keyword,
          searchVolume: ranking.searchVolume,
          difficulty: ranking.difficulty,
          currentPosition: ranking.position || undefined,
          estimatedTraffic: Math.round(ranking.searchVolume * 0.20),
          opportunity: 'high-value',
          reasoning: `High search volume (${ranking.searchVolume}/mo) with room for improvement.`,
        })
      }

      // Long-term: position 21-50, high difficulty
      if (ranking.position >= 21 && ranking.position <= 50 && ranking.difficulty >= 60) {
        opportunities.push({
          keyword: ranking.keyword,
          searchVolume: ranking.searchVolume,
          difficulty: ranking.difficulty,
          currentPosition: ranking.position,
          estimatedTraffic: Math.round(ranking.searchVolume * 0.10),
          opportunity: 'long-term',
          reasoning: `Competitive keyword but you already have some authority. Build content consistently.`,
        })
      }
    }

    // Sort by estimated traffic potential
    opportunities.sort((a, b) => b.estimatedTraffic - a.estimatedTraffic)

    console.log('[Semrush] Found', opportunities.length, 'keyword opportunities')
    return opportunities.slice(0, 20) // Top 20 opportunities
  }

  /**
   * Get comprehensive SEO metrics
   */
  async getComprehensiveSEOMetrics(
    domain: string,
    brandName?: string
  ): Promise<SEOMetrics> {
    console.log('[Semrush] Fetching comprehensive SEO metrics for:', domain)

    const [overview, rankings, opportunities] = await Promise.all([
      this.getDomainOverview(domain),
      this.getKeywordRankings(domain, brandName),
      this.getKeywordOpportunities(domain, brandName),
    ])

    // Calculate SEO health score
    const healthScore = this.calculateSEOHealth(overview, rankings)

    return {
      domain,
      overview,
      rankings: rankings.slice(0, 50), // Top 50 rankings
      opportunities,
      competitors: [], // Will be populated by competitor discovery service
      healthScore,
    }
  }

  /**
   * Legacy method for compatibility
   */
  async getCompetitorKeywords(domain: string): Promise<string[]> {
    const rankings = await this.getKeywordRankings(domain)
    return rankings.slice(0, 10).map(r => r.keyword)
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private estimateDifficulty(searchVolume: number): number {
    if (searchVolume < 100) return 20
    if (searchVolume < 500) return 35
    if (searchVolume < 1000) return 50
    if (searchVolume < 5000) return 65
    if (searchVolume < 10000) return 75
    return 85
  }

  /**
   * Estimate keyword trend based on position vs. expected performance
   * This is a heuristic until we have historical data
   */
  private estimateTrend(
    position: number,
    searchVolume: number,
    difficulty: number
  ): {
    indicator: 'rising' | 'stable' | 'declining'
    data: { direction: 'up' | 'down' | 'stable'; changePercent?: number }
  } {
    // High volume, top position = stable/rising
    if (position <= 3 && searchVolume > 1000) {
      return {
        indicator: 'stable',
        data: { direction: 'stable' },
      }
    }

    // Good position relative to difficulty = rising
    if (position <= 10 && difficulty > 60) {
      return {
        indicator: 'rising',
        data: { direction: 'up' },
      }
    }

    // Poor position for easy keyword = declining
    if (position > 20 && difficulty < 40) {
      return {
        indicator: 'declining',
        data: { direction: 'down' },
      }
    }

    // Default to stable
    return {
      indicator: 'stable',
      data: { direction: 'stable' },
    }
  }

  /**
   * Calculate keyword importance score for ranking
   * Combines position, volume, and traffic to prioritize display
   */
  private calculateKeywordImportance(ranking: KeywordRanking): number {
    let score = 0

    // Position score (max 40 points) - better positions get more points
    if (ranking.position <= 3) score += 40
    else if (ranking.position <= 10) score += 30
    else if (ranking.position <= 20) score += 20
    else score += 10

    // Volume score (max 30 points)
    if (ranking.searchVolume >= 10000) score += 30
    else if (ranking.searchVolume >= 5000) score += 25
    else if (ranking.searchVolume >= 1000) score += 20
    else if (ranking.searchVolume >= 500) score += 15
    else if (ranking.searchVolume >= 100) score += 10
    else score += 5

    // Traffic score (max 30 points)
    if (ranking.traffic >= 1000) score += 30
    else if (ranking.traffic >= 500) score += 25
    else if (ranking.traffic >= 100) score += 20
    else if (ranking.traffic >= 50) score += 15
    else if (ranking.traffic >= 10) score += 10
    else score += 5

    return score
  }

  private calculateSEOHealth(overview: DomainOverview, rankings: KeywordRanking[]): number {
    let score = 0

    // Authority score (40 points)
    score += Math.min(40, overview.authority_score * 0.4)

    // Keyword rankings (30 points)
    const top10Rankings = rankings.filter(r => r.position <= 10).length
    score += Math.min(30, top10Rankings * 2)

    // Backlinks (20 points)
    if (overview.backlinks > 10000) score += 20
    else if (overview.backlinks > 5000) score += 15
    else if (overview.backlinks > 1000) score += 10
    else if (overview.backlinks > 100) score += 5

    // Traffic (10 points)
    if (overview.organic_traffic > 100000) score += 10
    else if (overview.organic_traffic > 50000) score += 7
    else if (overview.organic_traffic > 10000) score += 5
    else if (overview.organic_traffic > 1000) score += 2

    return Math.round(score)
  }

}

export const SemrushAPI = new SemrushAPIService()
