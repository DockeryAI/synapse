/**
 * Competitive Intelligence Service
 * Discovers competitors, profiles them, finds gaps, and scores opportunities
 * Combines data from Serper, SEMrush, Apify, and Website Analyzer
 */

import { SerperAPI } from './serper-api'
import { SemrushAPI } from './semrush-api'
import { ApifyAPI } from './apify-api'
import { websiteAnalyzer } from './website-analyzer.service'
import { intelligenceCache } from './intelligence-cache.service'

export interface Competitor {
  domain: string
  name: string
  url: string
  source: 'serper' | 'semrush' | 'manual'
}

export interface CompetitorProfile {
  domain: string
  name: string
  url: string

  // Website Analysis (Claude AI)
  messaging?: {
    valuePropositions: string[]
    targetAudience: string[]
    problems: string[]
    solutions: string[]
    differentiators: string[]
    confidence: number
  }

  // SEO Data (SEMrush)
  seo?: {
    organicTraffic: number
    paidTraffic: number
    backlinks: number
    keywords: number
    authorityScore: number
  }

  // Reviews (Apify Google Maps)
  reviews?: {
    rating: number
    count: number
    recentReviews: Array<{
      text: string
      stars: number
      date: string
    }>
  }

  // Content Analysis (Serper)
  content?: {
    topRankingKeywords: string[]
    recentNews: string[]
    videoContent: string[]
  }

  lastUpdated: string
}

export interface ContentGap {
  keyword: string
  searchVolume: number
  difficulty: number
  currentRank?: number
  competitorRank: number
  competitor: string
  opportunity: 'easy_win' | 'medium' | 'hard'
  estimatedTraffic: number
}

export interface MessagingGap {
  category: 'value_prop' | 'target_audience' | 'problem' | 'solution' | 'differentiator'
  competitorClaim: string
  competitor: string
  ourClaim?: string
  opportunity: string
  confidence: number
}

export interface PerformanceGap {
  metric: 'rating' | 'review_count' | 'response_time' | 'authority'
  ourValue: number
  competitorValue: number
  competitor: string
  gap: number
  opportunityType: 'underperforming' | 'parity' | 'advantage'
}

export interface ScoredOpportunity {
  type: 'content' | 'messaging' | 'performance'
  title: string
  description: string
  roiScore: number // 0-100
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedImpact: {
    traffic?: number
    conversions?: number
    authority?: number
  }
  actionable: string // What to do about it
  data: ContentGap | MessagingGap | PerformanceGap
}

class CompetitiveIntelligenceService {
  /**
   * Discover competitors using Serper search + SEMrush data
   */
  async discoverCompetitors(options: {
    industry: string
    location?: string
    ourDomain?: string
    limit?: number
  }): Promise<Competitor[]> {
    try {
      console.log('[CompetitiveIntel] Discovering competitors for:', options.industry)

      const competitors: Competitor[] = []
      const uniqueDomains = new Set<string>()

      // 1. Find competitors via Serper search
      try {
        const searchQuery = `top ${options.industry} companies ${options.location || ''}`
        const searchResults = await SerperAPI.searchGoogle(searchQuery)

        searchResults.slice(0, 10).forEach(result => {
          try {
            const url = new URL(result.link)
            const domain = url.hostname.replace('www.', '')

            if (!uniqueDomains.has(domain) && domain !== options.ourDomain) {
              uniqueDomains.add(domain)
              competitors.push({
                domain,
                name: result.title.split(' - ')[0].split(' | ')[0].trim(),
                url: result.link,
                source: 'serper'
              })
            }
          } catch (err) {
            // Invalid URL, skip
          }
        })
      } catch (err) {
        console.warn('[CompetitiveIntel] Serper search failed:', err)
      }

      // 2. Find competitors via Serper Places (if location provided)
      if (options.location) {
        try {
          const places = await SerperAPI.getPlaces(options.industry, options.location)

          places.slice(0, 10).forEach(place => {
            if (place.website) {
              try {
                const url = new URL(place.website)
                const domain = url.hostname.replace('www.', '')

                if (!uniqueDomains.has(domain) && domain !== options.ourDomain) {
                  uniqueDomains.add(domain)
                  competitors.push({
                    domain,
                    name: place.name,
                    url: place.website,
                    source: 'serper'
                  })
                }
              } catch (err) {
                // Invalid URL, skip
              }
            }
          })
        } catch (err) {
          console.warn('[CompetitiveIntel] Serper Places failed:', err)
        }
      }

      // 3. Find competitors via SEMrush (if our domain provided)
      // Note: SEMrush doesn't have direct competitor discovery, so we use keyword overlap
      // This is a lightweight approach - we skip this in favor of Serper-based discovery
      if (options.ourDomain && false) { // Disabled for now - Serper provides better results
        try {
          const keywords = await SemrushAPI.getCompetitorKeywords(options.ourDomain)
          // Would need additional API calls to find who else ranks for these keywords
          console.log('[CompetitiveIntel] SEMrush competitor discovery skipped - using Serper')
        } catch (err) {
          console.warn('[CompetitiveIntel] SEMrush lookup failed:', err)
        }
      }

      const limit = options.limit || 10
      const result = competitors.slice(0, limit)

      console.log(`[CompetitiveIntel] Discovered ${result.length} competitors`)
      return result

    } catch (error) {
      console.error('[CompetitiveIntel] Competitor discovery failed:', error)
      throw error
    }
  }

  /**
   * Profile a competitor using all available intelligence sources
   */
  async profileCompetitor(competitor: Competitor): Promise<CompetitorProfile> {
    try {
      console.log('[CompetitiveIntel] Profiling competitor:', competitor.domain)

      const profile: CompetitorProfile = {
        domain: competitor.domain,
        name: competitor.name,
        url: competitor.url,
        lastUpdated: new Date().toISOString()
      }

      // Check cache first
      const cacheKey = intelligenceCache.cacheKeyCompetitorProfile(competitor.domain)
      const cached = await intelligenceCache.get<CompetitorProfile>(cacheKey)

      if (cached) {
        console.log('[CompetitiveIntel] Returning cached profile')
        return cached
      }

      // Gather all data in parallel with graceful fallbacks
      const [messaging, seo, reviews, content] = await Promise.allSettled([
        this.fetchCompetitorMessaging(competitor.url),
        this.fetchCompetitorSEO(competitor.domain),
        this.fetchCompetitorReviews(competitor.name),
        this.fetchCompetitorContent(competitor.domain)
      ])

      if (messaging.status === 'fulfilled') profile.messaging = messaging.value
      if (seo.status === 'fulfilled') profile.seo = seo.value
      if (reviews.status === 'fulfilled') profile.reviews = reviews.value
      if (content.status === 'fulfilled') profile.content = content.value

      // Cache profile for 7 days
      await intelligenceCache.set(cacheKey, profile, {
        dataType: 'competitor_profile',
        sourceApi: 'aggregated'
      })

      console.log('[CompetitiveIntel] Profile complete:', {
        hasMessaging: !!profile.messaging,
        hasSEO: !!profile.seo,
        hasReviews: !!profile.reviews,
        hasContent: !!profile.content
      })

      return profile

    } catch (error) {
      console.error('[CompetitiveIntel] Competitor profiling failed:', error)
      throw error
    }
  }

  /**
   * Fetch competitor messaging via Website Analyzer
   */
  private async fetchCompetitorMessaging(url: string): Promise<CompetitorProfile['messaging']> {
    const analysis = await websiteAnalyzer.analyzeWebsite(url)

    return {
      valuePropositions: analysis.valuePropositions,
      targetAudience: analysis.targetAudience,
      problems: analysis.customerProblems,
      solutions: analysis.solutions,
      differentiators: analysis.differentiators,
      confidence: analysis.confidence
    }
  }

  /**
   * Fetch competitor SEO data via SEMrush
   */
  private async fetchCompetitorSEO(domain: string): Promise<CompetitorProfile['seo']> {
    const overview = await SemrushAPI.getDomainOverview(domain)

    return {
      organicTraffic: overview.organic_traffic,
      paidTraffic: overview.paid_keywords, // Using paid keywords as proxy
      backlinks: overview.backlinks,
      keywords: overview.organic_keywords,
      authorityScore: overview.authority_score
    }
  }

  /**
   * Fetch competitor reviews via Apify Google Maps
   */
  private async fetchCompetitorReviews(name: string): Promise<CompetitorProfile['reviews']> {
    const places = await ApifyAPI.scrapeGoogleMapsReviews({
      searchQuery: name,
      maxReviews: 20
    })

    if (places.length === 0) {
      return undefined
    }

    const place = places[0]

    return {
      rating: place.rating,
      count: place.reviewsCount,
      recentReviews: (place.reviews || []).slice(0, 10).map(review => ({
        text: review.text,
        stars: review.stars,
        date: review.publishedAtDate
      }))
    }
  }

  /**
   * Fetch competitor content data via Serper
   */
  private async fetchCompetitorContent(domain: string): Promise<CompetitorProfile['content']> {
    const [keywords, news, videos] = await Promise.allSettled([
      SemrushAPI.getKeywordRankings(domain).then(rankings => rankings.slice(0, 10)),
      SerperAPI.getNews(`${domain} news`),
      SerperAPI.getVideos(domain)
    ])

    return {
      topRankingKeywords: keywords.status === 'fulfilled' ? keywords.value.map(k => k.keyword) : [],
      recentNews: news.status === 'fulfilled' ? news.value.slice(0, 5).map(n => n.title) : [],
      videoContent: videos.status === 'fulfilled' ? videos.value.slice(0, 5).map(v => v.title) : []
    }
  }

  /**
   * Find content gaps (keywords competitors rank for that we don't)
   */
  async findContentGaps(options: {
    ourDomain: string
    competitors: string[]
    limit?: number
  }): Promise<ContentGap[]> {
    try {
      console.log('[CompetitiveIntel] Finding content gaps...')

      const gaps: ContentGap[] = []

      // Get our top keywords
      const ourKeywords = await SemrushAPI.getKeywordRankings(options.ourDomain)
      const ourKeywordSet = new Set(ourKeywords.map(k => k.keyword.toLowerCase()))

      // Check each competitor
      for (const competitorDomain of options.competitors) {
        try {
          const compKeywords = await SemrushAPI.getKeywordRankings(competitorDomain)

          compKeywords.slice(0, 50).forEach(kw => {
            const keyword = kw.keyword.toLowerCase()

            // If they rank for it and we don't, it's a gap
            if (!ourKeywordSet.has(keyword)) {
              const opportunity =
                kw.difficulty < 30 ? 'easy_win' :
                kw.difficulty < 60 ? 'medium' : 'hard'

              gaps.push({
                keyword: kw.keyword,
                searchVolume: kw.searchVolume,
                difficulty: kw.difficulty,
                competitorRank: kw.position,
                competitor: competitorDomain,
                opportunity,
                estimatedTraffic: Math.round(kw.searchVolume * (kw.position <= 3 ? 0.3 : kw.position <= 10 ? 0.1 : 0.05))
              })
            }
          })
        } catch (err) {
          console.warn(`[CompetitiveIntel] Failed to get keywords for ${competitorDomain}`)
        }
      }

      // Sort by estimated traffic potential
      const sorted = gaps.sort((a, b) => b.estimatedTraffic - a.estimatedTraffic)

      const limit = options.limit || 20
      return sorted.slice(0, limit)

    } catch (error) {
      console.error('[CompetitiveIntel] Content gap analysis failed:', error)
      throw error
    }
  }

  /**
   * Find messaging gaps (claims/positioning competitors use that we don't)
   */
  async findMessagingGaps(options: {
    ourProfile: CompetitorProfile
    competitorProfiles: CompetitorProfile[]
  }): Promise<MessagingGap[]> {
    const gaps: MessagingGap[] = []

    const ourMessaging = options.ourProfile.messaging
    if (!ourMessaging) {
      console.warn('[CompetitiveIntel] No messaging data for our profile')
      return gaps
    }

    // Track what we claim
    const ourClaims = new Set([
      ...ourMessaging.valuePropositions.map(v => v.toLowerCase()),
      ...ourMessaging.differentiators.map(d => d.toLowerCase())
    ])

    // Check each competitor
    options.competitorProfiles.forEach(comp => {
      if (!comp.messaging) return

      // Value proposition gaps
      comp.messaging.valuePropositions.forEach(vp => {
        if (!ourClaims.has(vp.toLowerCase())) {
          gaps.push({
            category: 'value_prop',
            competitorClaim: vp,
            competitor: comp.domain,
            opportunity: `Consider offering: "${vp}"`,
            confidence: comp.messaging!.confidence
          })
        }
      })

      // Differentiator gaps
      comp.messaging.differentiators.forEach(diff => {
        if (!ourClaims.has(diff.toLowerCase())) {
          gaps.push({
            category: 'differentiator',
            competitorClaim: diff,
            competitor: comp.domain,
            opportunity: `Potential differentiator: "${diff}"`,
            confidence: comp.messaging!.confidence
          })
        }
      })
    })

    // Sort by confidence
    return gaps.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Find performance gaps (metrics where competitors outperform us)
   */
  async findPerformanceGaps(options: {
    ourProfile: CompetitorProfile
    competitorProfiles: CompetitorProfile[]
  }): Promise<PerformanceGap[]> {
    const gaps: PerformanceGap[] = []

    // Rating gaps
    if (options.ourProfile.reviews) {
      const ourRating = options.ourProfile.reviews.rating

      options.competitorProfiles.forEach(comp => {
        if (comp.reviews) {
          const gap = comp.reviews.rating - ourRating

          if (gap > 0.2) {
            gaps.push({
              metric: 'rating',
              ourValue: ourRating,
              competitorValue: comp.reviews.rating,
              competitor: comp.domain,
              gap,
              opportunityType: 'underperforming'
            })
          }
        }
      })
    }

    // Authority gaps
    if (options.ourProfile.seo) {
      const ourAuthority = options.ourProfile.seo.authorityScore

      options.competitorProfiles.forEach(comp => {
        if (comp.seo) {
          const gap = comp.seo.authorityScore - ourAuthority

          if (gap > 10) {
            gaps.push({
              metric: 'authority',
              ourValue: ourAuthority,
              competitorValue: comp.seo.authorityScore,
              competitor: comp.domain,
              gap,
              opportunityType: 'underperforming'
            })
          }
        }
      })
    }

    return gaps.sort((a, b) => b.gap - a.gap)
  }

  /**
   * Score all opportunities by ROI potential
   */
  async scoreOpportunities(options: {
    contentGaps: ContentGap[]
    messagingGaps: MessagingGap[]
    performanceGaps: PerformanceGap[]
  }): Promise<ScoredOpportunity[]> {
    const scored: ScoredOpportunity[] = []

    // Score content gaps
    options.contentGaps.forEach(gap => {
      const roiScore = this.calculateROI({
        trafficPotential: gap.estimatedTraffic,
        difficulty: gap.difficulty,
        competitiveGap: gap.competitorRank
      })

      scored.push({
        type: 'content',
        title: `Rank for "${gap.keyword}"`,
        description: `${gap.competitor} ranks #${gap.competitorRank} for this ${gap.searchVolume.toLocaleString()}/mo keyword`,
        roiScore,
        difficulty: gap.opportunity === 'easy_win' ? 'easy' : gap.opportunity === 'medium' ? 'medium' : 'hard',
        estimatedImpact: {
          traffic: gap.estimatedTraffic
        },
        actionable: `Create content targeting "${gap.keyword}" - ${gap.opportunity} opportunity`,
        data: gap
      })
    })

    // Score messaging gaps
    options.messagingGaps.forEach(gap => {
      const roiScore = this.calculateROI({
        trafficPotential: 0,
        difficulty: 50,
        competitiveGap: gap.confidence
      })

      scored.push({
        type: 'messaging',
        title: gap.opportunity,
        description: `${gap.competitor} claims: "${gap.competitorClaim}"`,
        roiScore,
        difficulty: 'medium',
        estimatedImpact: {
          conversions: 5 // Arbitrary, hard to estimate
        },
        actionable: `Test messaging: "${gap.competitorClaim}"`,
        data: gap
      })
    })

    // Score performance gaps
    options.performanceGaps.forEach(gap => {
      const roiScore = this.calculateROI({
        trafficPotential: 100,
        difficulty: 70,
        competitiveGap: gap.gap
      })

      scored.push({
        type: 'performance',
        title: `Improve ${gap.metric}`,
        description: `${gap.competitor} has ${gap.competitorValue} vs our ${gap.ourValue}`,
        roiScore,
        difficulty: 'hard',
        estimatedImpact: {
          authority: gap.metric === 'authority' ? gap.gap : undefined
        },
        actionable: `Focus on improving ${gap.metric} to match ${gap.competitor}`,
        data: gap
      })
    })

    // Sort by ROI score
    return scored.sort((a, b) => b.roiScore - a.roiScore)
  }

  /**
   * Calculate ROI score (0-100) for an opportunity
   */
  calculateROI(factors: {
    trafficPotential: number
    difficulty: number
    competitiveGap: number
  }): number {
    // Normalize inputs to 0-1 scale
    const trafficScore = Math.min(factors.trafficPotential / 1000, 1) // Cap at 1000/mo
    const difficultyPenalty = 1 - (factors.difficulty / 100)
    const gapBonus = Math.min(factors.competitiveGap / 100, 1)

    // Weighted formula: Traffic (50%), Ease (30%), Gap (20%)
    const score = (
      trafficScore * 0.5 +
      difficultyPenalty * 0.3 +
      gapBonus * 0.2
    ) * 100

    return Math.round(Math.max(0, Math.min(100, score)))
  }
}

export const competitiveIntelligence = new CompetitiveIntelligenceService()
export { CompetitiveIntelligenceService }
