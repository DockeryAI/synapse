/**
 * Content Gap Analyzer
 * Analyzes competitor content coverage and identifies opportunities
 */

export interface ContentCategory {
  name: string
  coverage: number  // 0-100%
  importance: 'high' | 'medium' | 'low'
  search_volume: number
  competitor_coverage: number
  opportunity_score: number
}

export interface ContentGap {
  category: string
  gap_size: number  // 0-100% (how much better competitors are)
  search_volume: number
  competition_level: number  // 0-100
  conversion_rate: number
  estimated_monthly_visits: number
  estimated_monthly_leads: number
  estimated_monthly_revenue: number
  content_pieces_needed: number
  quick_win: boolean
}

export interface ContentGapAnalysis {
  your_categories: ContentCategory[]
  top_opportunity: ContentGap | null
  all_gaps: ContentGap[]
  total_opportunity_score: number
  quick_wins: ContentGap[]
  long_term: ContentGap[]
}

export class ContentGapAnalyzer {
  /**
   * Analyze content gaps against competitors
   */
  static async analyzeGaps(
    brandData: any,
    competitorAnalysis: any,
    industryData: any
  ): Promise<ContentGapAnalysis> {
    // Define standard content categories for analysis
    const categories = this.defineCategories(industryData)

    // Analyze your content coverage
    const yourCategories = this.analyzeYourContent(brandData, categories)

    // Analyze competitor content
    const competitorCategories = this.analyzeCompetitorContent(
      competitorAnalysis,
      categories
    )

    // Identify gaps
    const gaps = this.identifyGaps(
      yourCategories,
      competitorCategories,
      industryData
    )

    // Calculate revenue potential
    const gapsWithRevenue = this.calculateRevenuePotential(gaps, industryData)

    // Sort by opportunity score
    const sortedGaps = gapsWithRevenue.sort(
      (a, b) => b.opportunity_score - a.opportunity_score
    )

    // Identify quick wins (high volume, low competition, big gap)
    const quickWins = sortedGaps.filter(gap => gap.quick_win)
    const longTerm = sortedGaps.filter(gap => !gap.quick_win)

    return {
      your_categories: yourCategories,
      top_opportunity: sortedGaps[0] || null,
      all_gaps: sortedGaps,
      total_opportunity_score: this.calculateTotalOpportunity(sortedGaps),
      quick_wins: quickWins,
      long_term: longTerm
    }
  }

  /**
   * Define content categories based on industry
   */
  private static defineCategories(industryData: any): ContentCategory[] {
    const industryProfile = industryData?.full_profile_data

    if (!industryProfile) {
      // Generic categories as fallback
      return [
        {
          name: 'Emergency Services',
          coverage: 0,
          importance: 'high',
          search_volume: 2400,
          competitor_coverage: 0,
          opportunity_score: 0
        },
        {
          name: 'Seasonal Maintenance',
          coverage: 0,
          importance: 'high',
          search_volume: 1800,
          competitor_coverage: 0,
          opportunity_score: 0
        },
        {
          name: 'Pricing & Financing',
          coverage: 0,
          importance: 'high',
          search_volume: 1200,
          competitor_coverage: 0,
          opportunity_score: 0
        },
        {
          name: 'Educational Content',
          coverage: 0,
          importance: 'medium',
          search_volume: 800,
          competitor_coverage: 0,
          opportunity_score: 0
        }
      ]
    }

    // Extract categories from industry triggers and pain points
    const categories: ContentCategory[] = []

    // From customer triggers
    if (industryProfile.customer_triggers) {
      industryProfile.customer_triggers.slice(0, 5).forEach((trigger: any) => {
        categories.push({
          name: trigger.trigger || trigger,
          coverage: 0,
          importance: trigger.impact_level || 'medium',
          search_volume: this.estimateSearchVolume(trigger),
          competitor_coverage: 0,
          opportunity_score: 0
        })
      })
    }

    // From common pain points
    if (industryProfile.common_pain_points) {
      industryProfile.common_pain_points.slice(0, 3).forEach((pain: string) => {
        categories.push({
          name: pain,
          coverage: 0,
          importance: 'high',
          search_volume: this.estimateSearchVolume(pain),
          competitor_coverage: 0,
          opportunity_score: 0
        })
      })
    }

    return categories.slice(0, 8) // Top 8 categories
  }

  /**
   * Estimate search volume for a topic
   */
  private static estimateSearchVolume(topic: any): number {
    const topicStr = typeof topic === 'string' ? topic : topic.trigger || ''
    const lower = topicStr.toLowerCase()

    // Rough heuristics based on topic type
    if (lower.includes('emergency') || lower.includes('urgent')) return 2400
    if (lower.includes('cost') || lower.includes('price')) return 1200
    if (lower.includes('how to') || lower.includes('diy')) return 800
    if (lower.includes('seasonal') || lower.includes('maintenance')) return 1800
    if (lower.includes('installation') || lower.includes('repair')) return 1500

    return 600 // Default
  }

  /**
   * Analyze your content coverage
   */
  private static analyzeYourContent(
    brandData: any,
    categories: ContentCategory[]
  ): ContentCategory[] {
    // Extract your content signals from brand data
    const uvps = brandData?.uvps || []
    const competitiveAdvantages = brandData?.competitive_advantages || []
    const contentText = [
      brandData?.positioning_statement || '',
      ...uvps,
      ...competitiveAdvantages
    ].join(' ').toLowerCase()

    return categories.map(category => {
      // Simple keyword matching for coverage
      const categoryKeywords = category.name.toLowerCase().split(' ')
      const matches = categoryKeywords.filter(keyword =>
        contentText.includes(keyword)
      ).length

      const coverage = Math.min(
        (matches / Math.max(categoryKeywords.length, 1)) * 100,
        100
      )

      return {
        ...category,
        coverage
      }
    })
  }

  /**
   * Analyze competitor content
   */
  private static analyzeCompetitorContent(
    competitorAnalysis: any,
    categories: ContentCategory[]
  ): ContentCategory[] {
    if (!competitorAnalysis) return categories

    const allCompetitors = [
      ...(competitorAnalysis.market_leaders || []),
      ...(competitorAnalysis.primary_competitors || []),
      ...(competitorAnalysis.emerging_competitors || [])
    ]

    if (allCompetitors.length === 0) return categories

    return categories.map(category => {
      // Count how many competitors cover this category
      const categoryKeywords = category.name.toLowerCase().split(' ')
      let totalCoverage = 0

      allCompetitors.forEach(competitor => {
        const competitorText = [
          competitor.description || '',
          ...(competitor.strengths || [])
        ].join(' ').toLowerCase()

        const matches = categoryKeywords.filter(keyword =>
          competitorText.includes(keyword)
        ).length

        totalCoverage += (matches / Math.max(categoryKeywords.length, 1)) * 100
      })

      const avgCoverage = totalCoverage / allCompetitors.length

      return {
        ...category,
        competitor_coverage: Math.min(avgCoverage, 100)
      }
    })
  }

  /**
   * Identify content gaps
   */
  private static identifyGaps(
    yourCategories: ContentCategory[],
    competitorCategories: ContentCategory[],
    industryData: any
  ): ContentGap[] {
    return yourCategories.map((yourCategory, index) => {
      const competitorCategory = competitorCategories[index]
      const gapSize = Math.max(
        0,
        competitorCategory.competitor_coverage - yourCategory.coverage
      )

      // Calculate opportunity score (0-100)
      // High gap + high search volume + low competitor coverage = high opportunity
      const opportunityScore = this.calculateOpportunityScore(
        gapSize,
        yourCategory.search_volume,
        competitorCategory.competitor_coverage,
        yourCategory.importance
      )

      // Determine competition level
      const competitionLevel = competitorCategory.competitor_coverage

      // Quick win if: big gap, low competition, high volume
      const quickWin =
        gapSize > 30 &&
        competitionLevel < 60 &&
        yourCategory.search_volume > 800

      return {
        category: yourCategory.name,
        gap_size: gapSize,
        search_volume: yourCategory.search_volume,
        competition_level: competitionLevel,
        conversion_rate: this.estimateConversionRate(yourCategory.importance),
        estimated_monthly_visits: 0, // Calculated next
        estimated_monthly_leads: 0,
        estimated_monthly_revenue: 0,
        content_pieces_needed: this.estimateContentPieces(gapSize),
        quick_win: quickWin,
        opportunity_score: opportunityScore
      }
    })
  }

  /**
   * Calculate opportunity score
   */
  private static calculateOpportunityScore(
    gapSize: number,
    searchVolume: number,
    competitionLevel: number,
    importance: string
  ): number {
    // Normalize inputs to 0-1 scale
    const gapWeight = gapSize / 100
    const volumeWeight = Math.min(searchVolume / 2000, 1)
    const competitionWeight = (100 - competitionLevel) / 100
    const importanceWeight = importance === 'high' ? 1 : importance === 'medium' ? 0.7 : 0.4

    // Weighted score
    const score =
      gapWeight * 0.35 +
      volumeWeight * 0.25 +
      competitionWeight * 0.25 +
      importanceWeight * 0.15

    return Math.round(score * 100)
  }

  /**
   * Estimate conversion rate based on importance
   */
  private static estimateConversionRate(importance: string): number {
    if (importance === 'high') return 0.14 // 14%
    if (importance === 'medium') return 0.08 // 8%
    return 0.05 // 5%
  }

  /**
   * Estimate content pieces needed
   */
  private static estimateContentPieces(gapSize: number): number {
    if (gapSize > 70) return 5
    if (gapSize > 50) return 3
    if (gapSize > 30) return 2
    return 1
  }

  /**
   * Calculate revenue potential
   */
  private static calculateRevenuePotential(
    gaps: ContentGap[],
    industryData: any
  ): ContentGap[] {
    // Get average customer value from industry data
    const avgCustomerValue =
      industryData?.full_profile_data?.benchmark_metrics?.avg_customer_value || 500

    return gaps.map(gap => {
      // Estimate visits (search volume * CTR * ranking factor)
      const ctr = 0.05 // 5% CTR assumption
      const rankingFactor = 0.5 // Assume reach 50% of search volume
      const estimatedVisits = Math.round(
        gap.search_volume * ctr * rankingFactor
      )

      // Calculate leads
      const estimatedLeads = Math.round(estimatedVisits * gap.conversion_rate)

      // Calculate revenue (leads * avg customer value * close rate)
      const closeRate = 0.4 // 40% close rate
      const estimatedRevenue = Math.round(
        estimatedLeads * avgCustomerValue * closeRate
      )

      return {
        ...gap,
        estimated_monthly_visits: estimatedVisits,
        estimated_monthly_leads: estimatedLeads,
        estimated_monthly_revenue: estimatedRevenue
      }
    })
  }

  /**
   * Calculate total opportunity score
   */
  private static calculateTotalOpportunity(gaps: ContentGap[]): number {
    if (gaps.length === 0) return 0

    const totalScore = gaps.reduce((sum, gap) => sum + gap.opportunity_score, 0)
    return Math.round(totalScore / gaps.length)
  }
}
