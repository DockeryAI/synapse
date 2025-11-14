/**
 * SerpAPI Service for UVP Wizard
 *
 * Wrapper around Serper (Google Search) API for competitor research and market intelligence.
 * Extends the base SerperAPI service with UVP-specific functionality.
 *
 * This service provides:
 * - Competitor discovery and research
 * - Market positioning insights
 * - Competitor value proposition analysis
 * - Industry leader identification
 */

import { SerperAPI, SearchResult } from '@/services/intelligence/serper-api'
import { SerpAPIRequest, SerpAPIResponse, DraggableSuggestion } from '@/types/uvp-wizard'

/**
 * SerpAPI configuration
 */
interface SerpAPIConfig {
  apiKey: string
  maxResults: number
  location: string
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: SerpAPIConfig = {
  apiKey: import.meta.env.VITE_SERPER_API_KEY || '',
  maxResults: 10,
  location: 'United States',
}

/**
 * Competitor information
 */
interface CompetitorInfo {
  name: string
  domain: string
  description: string
  rank: number
  uvp_hints: string[]
}

/**
 * SerpAPI service class for UVP wizard
 */
export class SerpAPI {
  private config: SerpAPIConfig

  constructor(config?: Partial<SerpAPIConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }

    if (!this.config.apiKey) {
      console.warn('[SerpAPI] No API key provided. Set VITE_SERPER_API_KEY.')
    }
  }

  /**
   * Check if API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey
  }

  /**
   * Discover competitors for a brand in an industry
   */
  async discoverCompetitors(request: SerpAPIRequest): Promise<SerpAPIResponse> {
    console.log('[SerpAPI] Discovering competitors:', request.query)

    try {
      // Search for competitors
      const query = request.query
      const results = await SerperAPI.searchGoogle(query)

      // Extract competitor information
      const competitors = await this.parseCompetitorResults(
        results,
        request.num_results || this.config.maxResults
      )

      // Get related searches for market context
      const relatedSearches = this.extractRelatedSearches(results)

      return {
        competitors,
        related_searches: relatedSearches,
      }
    } catch (error) {
      console.error('[SerpAPI] Failed to discover competitors:', error)
      throw error
    }
  }

  /**
   * Research a specific competitor
   */
  async researchCompetitor(
    competitorName: string,
    industry: string
  ): Promise<CompetitorInfo> {
    console.log('[SerpAPI] Researching competitor:', competitorName)

    try {
      const query = `${competitorName} ${industry} value proposition`
      const results = await SerperAPI.searchGoogle(query)

      // Parse competitor information
      const competitor = await this.parseCompetitorInfo(competitorName, results)

      return competitor
    } catch (error) {
      console.error('[SerpAPI] Failed to research competitor:', error)
      throw error
    }
  }

  /**
   * Get competitor suggestions as draggable items
   */
  async getCompetitorSuggestions(
    industry: string,
    brandName?: string
  ): Promise<DraggableSuggestion[]> {
    const query = brandName
      ? `top competitors ${brandName} ${industry}`
      : `top companies ${industry}`

    const response = await this.discoverCompetitors({
      query,
      num_results: 10,
    })

    return response.competitors.map((competitor, index) => ({
      id: `competitor-${Date.now()}-${index}`,
      content: competitor.name,
      type: 'competitor',
      source: 'ai-generated',
      confidence: 1 - index * 0.1, // Decreasing confidence by rank
      tags: [competitor.domain],
      is_selected: false,
      is_customizable: false,
    }))
  }

  /**
   * Analyze competitor value propositions
   */
  async analyzeCompetitorUVPs(
    competitors: string[],
    industry: string
  ): Promise<Array<{ competitor: string; uvp_insights: string[] }>> {
    console.log('[SerpAPI] Analyzing competitor UVPs')

    const analyses = await Promise.all(
      competitors.map(async (competitor) => {
        try {
          const info = await this.researchCompetitor(competitor, industry)
          return {
            competitor,
            uvp_insights: info.uvp_hints,
          }
        } catch (error) {
          console.warn(`[SerpAPI] Failed to analyze ${competitor}:`, error)
          return {
            competitor,
            uvp_insights: [],
          }
        }
      })
    )

    return analyses
  }

  /**
   * Get differentiation opportunities based on competitor analysis
   */
  async getDifferentiationOpportunities(
    industry: string,
    competitors: string[]
  ): Promise<string[]> {
    console.log('[SerpAPI] Finding differentiation opportunities')

    // Search for gaps and opportunities
    const gapQueries = [
      `${industry} unmet customer needs`,
      `${industry} customer complaints`,
      `${industry} innovation opportunities`,
      `alternatives to ${competitors[0] || industry}`,
    ]

    const opportunities: Set<string> = new Set()

    for (const query of gapQueries) {
      try {
        const results = await SerperAPI.searchGoogle(query)
        const insights = this.extractInsights(results)
        insights.forEach((insight) => opportunities.add(insight))
      } catch (error) {
        console.warn(`[SerpAPI] Failed to search "${query}":`, error)
      }
    }

    return Array.from(opportunities).slice(0, 10)
  }

  /**
   * Parse competitor results into structured data
   */
  private async parseCompetitorResults(
    results: SearchResult[],
    maxResults: number
  ): Promise<CompetitorInfo[]> {
    const competitors: CompetitorInfo[] = []

    for (let i = 0; i < Math.min(results.length, maxResults); i++) {
      const result = results[i]

      try {
        const url = new URL(result.link)
        const domain = url.hostname.replace(/^www\./, '')

        // Extract company name from title or domain
        const name = this.extractCompanyName(result.title, domain)

        // Extract UVP hints from snippet
        const uvpHints = this.extractUVPHints(result.snippet)

        competitors.push({
          name,
          domain,
          description: result.snippet,
          rank: result.position,
          uvp_hints: uvpHints,
        })
      } catch (error) {
        console.warn('[SerpAPI] Failed to parse result:', error)
      }
    }

    return competitors
  }

  /**
   * Parse detailed competitor information
   */
  private async parseCompetitorInfo(
    competitorName: string,
    results: SearchResult[]
  ): Promise<CompetitorInfo> {
    if (results.length === 0) {
      throw new Error(`No results found for ${competitorName}`)
    }

    const firstResult = results[0]
    let domain = ''

    try {
      const url = new URL(firstResult.link)
      domain = url.hostname.replace(/^www\./, '')
    } catch {
      domain = competitorName.toLowerCase().replace(/\s+/g, '') + '.com'
    }

    // Aggregate UVP hints from multiple results
    const uvpHints: string[] = []
    results.slice(0, 5).forEach((result) => {
      const hints = this.extractUVPHints(result.snippet)
      uvpHints.push(...hints)
    })

    return {
      name: competitorName,
      domain,
      description: firstResult.snippet,
      rank: firstResult.position,
      uvp_hints: Array.from(new Set(uvpHints)), // Remove duplicates
    }
  }

  /**
   * Extract company name from title and domain
   */
  private extractCompanyName(title: string, domain: string): string {
    // Try to extract from title first
    const titleParts = title.split(/[-–|:]/)[0].trim()

    if (titleParts.length > 0 && titleParts.length < 50) {
      return titleParts
    }

    // Fall back to domain
    const domainName = domain.split('.')[0]
    return domainName.charAt(0).toUpperCase() + domainName.slice(1)
  }

  /**
   * Extract UVP hints from snippet text
   */
  private extractUVPHints(snippet: string): string[] {
    const hints: string[] = []

    // Look for common UVP patterns
    const patterns = [
      /(?:helps?|enables?|allows?)\s+(?:you\s+)?(?:to\s+)?([^.!?]+)/gi,
      /(?:best|leading|top)\s+([^.!?]+)/gi,
      /(?:unique|only|exclusive)\s+([^.!?]+)/gi,
      /(?:provides?|offers?|delivers?)\s+([^.!?]+)/gi,
    ]

    patterns.forEach((pattern) => {
      const matches = snippet.matchAll(pattern)
      for (const match of matches) {
        if (match[1] && match[1].length > 10 && match[1].length < 100) {
          hints.push(match[1].trim())
        }
      }
    })

    return hints.slice(0, 3) // Limit to top 3 hints
  }

  /**
   * Extract related searches (placeholder)
   */
  private extractRelatedSearches(results: SearchResult[]): string[] {
    // Serper API doesn't provide related searches in the current implementation
    // This would need to be enhanced with actual related search data
    return []
  }

  /**
   * Extract insights from search results
   */
  private extractInsights(results: SearchResult[]): string[] {
    return results.map((result) => result.snippet).filter((snippet) => snippet.length > 20)
  }
}

/**
 * Singleton instance
 */
export const serpAPI = new SerpAPI()
