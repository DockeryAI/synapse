/**
 * Competitor Discovery Service
 * Automatically discovers competitors using SEMrush, Serper, and industry data
 */

import { SemrushAPI } from './semrush-api'
import { SerperAPI } from './serper-api'

export interface Competitor {
  domain: string
  name: string
  authority_score?: number
  organic_keywords?: number
  organic_traffic?: number
  overlap_keywords?: string[]
  source: 'semrush' | 'serper' | 'industry' | 'manual'
  confidence: number // 0-100
}

export interface CompetitorAnalysis {
  primary_competitors: Competitor[]
  emerging_competitors: Competitor[]
  market_leaders: Competitor[]
  total_found: number
}

class CompetitorDiscoveryService {
  /**
   * Discover competitors using multiple sources
   */
  async discoverCompetitors(
    domain: string,
    industry: string,
    brandName?: string
  ): Promise<CompetitorAnalysis> {
    console.log('[CompetitorDiscovery] Starting competitor discovery for:', domain)

    const competitors: Competitor[] = []

    // Method 1: SEMrush Organic Competitors
    try {
      const semrushCompetitors = await this.findSEMrushCompetitors(domain)
      competitors.push(...semrushCompetitors)
      console.log('[CompetitorDiscovery] Found', semrushCompetitors.length, 'from SEMrush')
    } catch (error) {
      console.error('[CompetitorDiscovery] SEMrush error:', error)
    }

    // Method 2: Google Search Competitors (via Serper)
    try {
      const serperCompetitors = await this.findSerperCompetitors(industry, brandName)
      competitors.push(...serperCompetitors)
      console.log('[CompetitorDiscovery] Found', serperCompetitors.length, 'from Serper')
    } catch (error) {
      console.error('[CompetitorDiscovery] Serper error:', error)
    }

    // Deduplicate competitors by domain
    const uniqueCompetitors = this.deduplicateCompetitors(competitors)

    // Categorize competitors
    const categorized = this.categorizeCompetitors(uniqueCompetitors)

    console.log('[CompetitorDiscovery] Total unique competitors:', uniqueCompetitors.length)

    return {
      ...categorized,
      total_found: uniqueCompetitors.length,
    }
  }

  /**
   * Find competitors using SEMrush organic competitor API via Edge Function
   */
  private async findSEMrushCompetitors(domain: string): Promise<Competitor[]> {
    try {
      const { supabase } = await import('@/lib/supabase')

      const { data, error } = await supabase.functions.invoke('fetch-seo-metrics', {
        body: {
          domain,
          type: 'competitors'
        }
      })

      if (error) {
        console.error('[CompetitorDiscovery] Edge function error:', error)
        throw new Error(`Failed to fetch competitors: ${error.message}`)
      }

      if (!data.success || !data.data) {
        throw new Error('No competitor data returned from SEMrush')
      }

      const competitors: Competitor[] = data.data
        .map((row: any) => {
          const competitorDomain = row.Dn || row.Domain || ''
          const commonKeywords = row.Cr || row['Common Keywords'] || '0'
          const relevance = row.Np || row.Relevance || '50'
          const rank = row.Or || row.Rank || '50'
          const traffic = row.Ot || row.Traffic || '0'
          const keywords = row.Oc || row.Keywords || '0'

          return {
            domain: competitorDomain,
            name: this.extractBrandName(competitorDomain),
            authority_score: Math.min(100, parseInt(rank) || 50),
            organic_keywords: parseInt(keywords) || 0,
            organic_traffic: parseInt(traffic) || 0,
            overlap_keywords: [],
            source: 'semrush' as const,
            confidence: Math.min(100, parseInt(relevance) || 50),
          }
        })
        .filter((c: Competitor) => c.domain && c.domain !== domain)

      return competitors
    } catch (error) {
      console.error('[CompetitorDiscovery] SEMrush fetch error:', error)
      throw error
    }
  }

  /**
   * Find competitors using Google search via Serper API
   */
  private async findSerperCompetitors(
    industry: string,
    brandName?: string
  ): Promise<Competitor[]> {
    const SERPER_API_KEY = import.meta.env.VITE_SERPER_API_KEY

    if (!SERPER_API_KEY) {
      console.error('[CompetitorDiscovery] Serper API key not configured')
      throw new Error('CompetitorDiscovery not configured. Configure VITE_SERPER_API_KEY or implement real service.')
    }

    try {
      // Search for top companies in the industry
      const searchQuery = `top ${industry} companies`

      const competitors = await SerperAPI.searchCompetitors(searchQuery, brandName)

      return competitors.map(c => ({
        domain: c,
        name: this.extractBrandName(c),
        source: 'serper' as const,
        confidence: 70,
      }))
    } catch (error) {
      console.error('[CompetitorDiscovery] Serper fetch error:', error)
      throw error
    }
  }

  /**
   * Deduplicate competitors by domain
   */
  private deduplicateCompetitors(competitors: Competitor[]): Competitor[] {
    const domainMap = new Map<string, Competitor>()

    for (const competitor of competitors) {
      const cleanDomain = competitor.domain.toLowerCase().replace(/^www\./, '')

      if (!domainMap.has(cleanDomain)) {
        domainMap.set(cleanDomain, competitor)
      } else {
        // Merge data from multiple sources
        const existing = domainMap.get(cleanDomain)!
        domainMap.set(cleanDomain, {
          ...existing,
          authority_score: existing.authority_score || competitor.authority_score,
          organic_keywords: existing.organic_keywords || competitor.organic_keywords,
          organic_traffic: existing.organic_traffic || competitor.organic_traffic,
          confidence: Math.max(existing.confidence, competitor.confidence),
        })
      }
    }

    return Array.from(domainMap.values())
  }

  /**
   * Categorize competitors into primary, emerging, and market leaders
   */
  private categorizeCompetitors(competitors: Competitor[]): Omit<CompetitorAnalysis, 'total_found'> {
    // Sort by confidence and authority
    const sorted = competitors.sort((a, b) => {
      const scoreA = (a.confidence || 50) + (a.authority_score || 50)
      const scoreB = (b.confidence || 50) + (b.authority_score || 50)
      return scoreB - scoreA
    })

    const market_leaders = sorted
      .filter(c => (c.authority_score || 0) >= 70)
      .slice(0, 5)

    const primary_competitors = sorted
      .filter(c => (c.authority_score || 0) >= 40 && (c.authority_score || 0) < 70)
      .slice(0, 10)

    const emerging_competitors = sorted
      .filter(c => (c.authority_score || 0) < 40)
      .slice(0, 5)

    return {
      primary_competitors,
      emerging_competitors,
      market_leaders,
    }
  }

  /**
   * Extract brand name from domain
   */
  private extractBrandName(domain: string): string {
    const cleaned = domain
      .toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .replace(/\.(com|net|org|io|co|ai).*$/, '')
      .split('.')
      .join(' ')

    // Capitalize first letter of each word
    return cleaned
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
}

export const CompetitorDiscovery = new CompetitorDiscoveryService()
