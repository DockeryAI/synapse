/**
 * Dynamic SWOT Generator Service
 * Generates comprehensive SWOT analysis using all gathered intelligence
 * Provides specific, actionable items prioritized by impact
 */

interface SWOTItem {
  id: string
  category: 'strength' | 'weakness' | 'opportunity' | 'threat'
  title: string
  description: string
  evidence: string[]
  source: string // Which analysis this came from
  impact: 'low' | 'medium' | 'high'
  effort?: 'low' | 'medium' | 'high' // For weaknesses
  urgency?: 'low' | 'medium' | 'high' // For threats
  actionItems: string[]
  priority: number // 1-10
}

interface SWOTAnalysis {
  generatedAt: Date
  dataFreshness: {
    brandPerception?: Date
    competitive?: Date
    customerUnderstanding?: Date
    searchVisibility?: Date
    uvp?: Date
  }
  strengths: SWOTItem[]
  weaknesses: SWOTItem[]
  opportunities: SWOTItem[]
  threats: SWOTItem[]
  summary: {
    topStrengths: string[]
    criticalWeaknesses: string[]
    biggestOpportunities: string[]
    urgentThreats: string[]
  }
  strategicRecommendations: Array<{
    recommendation: string
    rationale: string
    relatedItems: string[] // IDs of SWOT items
    priority: 'high' | 'medium' | 'low'
    timeframe: string
  }>
}

export class SWOTGeneratorService {
  /**
   * Generate comprehensive SWOT analysis
   */
  static async generateSWOT(
    brandId: string,
    websiteUrl: string,
    industry: string,
    uvp?: any
  ): Promise<SWOTAnalysis> {
    console.log('[SWOTGeneratorService] Starting SWOT generation:', {
      brandId,
      websiteUrl,
      industry,
      hasUVP: !!uvp
    })

    try {
      // Step 1: Gather all available intelligence
      console.log('[SWOTGeneratorService] Step 1/3: Gathering intelligence data...')
      const intelligence = await this.gatherIntelligence(brandId, websiteUrl, industry, uvp)

      // Step 2: Generate SWOT with Claude
      console.log('[SWOTGeneratorService] Step 2/3: Generating SWOT analysis...')
      const swot = await this.generateWithClaude(intelligence, industry, uvp)

      // Step 3: Generate strategic recommendations
      console.log('[SWOTGeneratorService] Step 3/3: Creating strategic recommendations...')
      const recommendations = await this.generateRecommendations(swot, intelligence)

      return {
        generatedAt: new Date(),
        dataFreshness: intelligence.freshness,
        strengths: swot.strengths,
        weaknesses: swot.weaknesses,
        opportunities: swot.opportunities,
        threats: swot.threats,
        summary: this.generateSummary(swot),
        strategicRecommendations: recommendations
      }
    } catch (error) {
      console.error('[SWOTGeneratorService] SWOT generation failed:', error)
      return this.getFallbackSWOT(industry)
    }
  }

  /**
   * Gather all available intelligence data
   */
  private static async gatherIntelligence(
    brandId: string,
    websiteUrl: string,
    industry: string,
    uvp?: any
  ): Promise<any> {
    const intelligence: any = {
      brandPerception: null,
      competitive: null,
      customerUnderstanding: null,
      searchVisibility: null,
      uvp: uvp || null,
      freshness: {}
    }

    // Try to gather brand perception data
    try {
      const { BrandPerceptionService } = await import('./brand-perception')
      intelligence.brandPerception = await BrandPerceptionService.analyzeBrand(
        brandId,
        websiteUrl,
        industry
      )
      intelligence.freshness.brandPerception = new Date()
      console.log('[SWOTGeneratorService] Brand perception data gathered')
    } catch (error) {
      console.log('[SWOTGeneratorService] Brand perception not available')
    }

    // Try to gather competitive intelligence
    try {
      const { CompetitiveAnalysisService } = await import('./competitive-analysis')
      intelligence.competitive = await CompetitiveAnalysisService.analyzeCompetitors(
        industry,
        websiteUrl
      )
      intelligence.freshness.competitive = new Date()
      console.log('[SWOTGeneratorService] Competitive data gathered')
    } catch (error) {
      console.log('[SWOTGeneratorService] Competitive data not available')
    }

    // Try to gather customer understanding
    try {
      const { CustomerResearchService } = await import('./customer-research')
      intelligence.customerUnderstanding = await CustomerResearchService.researchCustomers(
        industry,
        undefined,
        websiteUrl
      )
      intelligence.freshness.customerUnderstanding = new Date()
      console.log('[SWOTGeneratorService] Customer data gathered')
    } catch (error) {
      console.log('[SWOTGeneratorService] Customer data not available')
    }

    // Try to gather search visibility
    try {
      const { SearchAnalysisService } = await import('./search-analysis')
      intelligence.searchVisibility = await SearchAnalysisService.analyzeSearchVisibility(
        websiteUrl,
        industry,
        'Brand'
      )
      intelligence.freshness.searchVisibility = new Date()
      console.log('[SWOTGeneratorService] Search data gathered')
    } catch (error) {
      console.log('[SWOTGeneratorService] Search data not available')
    }

    if (uvp) {
      intelligence.freshness.uvp = new Date()
    }

    return intelligence
  }

  /**
   * Generate SWOT with Claude using all intelligence
   */
  private static async generateWithClaude(
    intelligence: any,
    industry: string,
    uvp?: any
  ): Promise<any> {
    const { generateOpusResponse } = await import('../uvp-wizard/openrouter-ai')

    // Build context from available intelligence
    let context = `INDUSTRY: ${industry}\n\n`

    if (intelligence.brandPerception) {
      context += `BRAND PERCEPTION:\n- Clarity Score: ${intelligence.brandPerception.clarityScore || 'N/A'}\n- Jargon Density: ${intelligence.brandPerception.jargonDensity || 'N/A'}\n- Key Insights: ${intelligence.brandPerception.insights?.map((i: any) => i.insight).join(', ') || 'None'}\n\n`
    }

    if (intelligence.competitive) {
      context += `COMPETITIVE LANDSCAPE:\n- Competitors Found: ${intelligence.competitive.discoveredCompetitors?.length || 0}\n- Common Themes: ${intelligence.competitive.commonThemes?.map((t: any) => t.theme).join(', ') || 'None'}\n- Gaps: ${intelligence.competitive.gaps?.map((g: any) => g.gap).join(', ') || 'None'}\n\n`
    }

    if (intelligence.customerUnderstanding) {
      context += `CUSTOMER INSIGHTS:\n- Top Decision Factors: ${intelligence.customerUnderstanding.decisionFactors?.map((f: any) => f.factor).join(', ') || 'None'}\n- Pain Points: ${intelligence.customerUnderstanding.painPoints?.map((p: any) => p.painPoint).join(', ') || 'None'}\n\n`
    }

    if (intelligence.searchVisibility) {
      context += `SEARCH VISIBILITY:\n- Owned Keywords: ${intelligence.searchVisibility.ownedKeywords?.length || 0}\n- Opportunity Keywords: ${intelligence.searchVisibility.opportunityKeywords?.length || 0}\n\n`
    }

    if (uvp) {
      context += `VALUE PROPOSITION:\n${JSON.stringify(uvp, null, 2)}\n\n`
    }

    const prompt = `Generate a comprehensive, actionable SWOT analysis based on this business intelligence data.

${context}

SWOT REQUIREMENTS:

Each item must include:
1. Unique ID (e.g., "S1", "W1", "O1", "T1")
2. Category (strength/weakness/opportunity/threat)
3. Title (concise, specific)
4. Description (detailed explanation)
5. Evidence (specific data points supporting this item)
6. Source (which analysis: "Brand Perception", "Competitive Analysis", "Customer Research", "Search Visibility", "UVP", or "Industry Trends")
7. Impact (low/medium/high)
8. For weaknesses: Effort to fix (low/medium/high)
9. For threats: Urgency (low/medium/high)
10. Action Items (3-5 specific, actionable steps)
11. Priority (1-10, where 10 is highest)

STRENGTHS (5-8 items):
- Internal capabilities that give competitive advantage
- Must be backed by specific evidence
- Focus on verified strengths, not assumptions

WEAKNESSES (5-8 items):
- Internal limitations that need addressing
- Prioritize by impact and fixability
- Include specific improvement actions

OPPORTUNITIES (5-8 items):
- External market opportunities to pursue
- Must be actionable within 6-12 months
- Consider customer needs, competitive gaps, market trends

THREATS (4-6 items):
- External risks that could harm the business
- Include mitigation strategies
- Prioritize by likelihood and impact

Return as JSON:
{
  "strengths": [
    {
      "id": "S1",
      "category": "strength",
      "title": "Clear value communication",
      "description": "Website effectively communicates core value proposition with 85% clarity score",
      "evidence": ["Clarity score: 85/100", "Low jargon density: 15%", "Strong benefit focus"],
      "source": "Brand Perception",
      "impact": "high",
      "actionItems": [
        "Leverage this clarity in advertising",
        "Use as template for sales materials",
        "Train team on consistent messaging"
      ],
      "priority": 8
    }
  ],
  "weaknesses": [
    {
      "id": "W1",
      "category": "weakness",
      "title": "Limited SEO visibility",
      "description": "Only 3 keywords ranking in top 10, missing major opportunity keywords",
      "evidence": ["3 owned keywords", "20+ opportunity keywords identified", "Competitors dominate 15 key terms"],
      "source": "Search Visibility",
      "impact": "high",
      "effort": "medium",
      "actionItems": [
        "Create content targeting opportunity keywords",
        "Optimize existing pages for target terms",
        "Build backlinks to key pages"
      ],
      "priority": 9
    }
  ],
  "opportunities": [...],
  "threats": [...]
}`

    try {
      const response = await generateOpusResponse([
        { role: 'user', content: prompt }
      ])

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON in response')

      const swot = JSON.parse(jsonMatch[0])
      console.log('[SWOTGeneratorService] SWOT generated successfully')

      return swot
    } catch (error) {
      console.error('[SWOTGeneratorService] Claude analysis failed:', error)
      return this.getMockSWOT(industry)
    }
  }

  /**
   * Generate strategic recommendations based on SWOT
   */
  private static async generateRecommendations(
    swot: any,
    intelligence: any
  ): Promise<any[]> {
    const { generateOpusResponse } = await import('../uvp-wizard/openrouter-ai')

    const prompt = `Based on this SWOT analysis, generate 5-7 strategic recommendations that leverage strengths, address weaknesses, capture opportunities, and mitigate threats.

SWOT SUMMARY:
Strengths: ${swot.strengths?.map((s: any) => s.title).join(', ')}
Weaknesses: ${swot.weaknesses?.map((w: any) => w.title).join(', ')}
Opportunities: ${swot.opportunities?.map((o: any) => o.title).join(', ')}
Threats: ${swot.threats?.map((t: any) => t.title).join(', ')}

RECOMMENDATION REQUIREMENTS:

Each recommendation should:
1. Be specific and actionable
2. Reference specific SWOT items by ID
3. Explain the rationale (why this matters)
4. Include realistic timeframe
5. Be prioritized (high/medium/low)

Return as JSON array:
[
  {
    "recommendation": "Launch content marketing program targeting opportunity keywords",
    "rationale": "Addresses weakness W1 (limited SEO) while capitalizing on opportunity O2 (underserved keywords). Competitors haven't dominated these terms yet.",
    "relatedItems": ["W1", "O2", "S1"],
    "priority": "high",
    "timeframe": "Implement in next 90 days"
  }
]`

    try {
      const response = await generateOpusResponse([
        { role: 'user', content: prompt }
      ])

      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('No JSON array in response')

      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('[SWOTGeneratorService] Recommendations generation failed:', error)
      return this.getMockRecommendations()
    }
  }

  /**
   * Generate executive summary of SWOT
   */
  private static generateSummary(swot: any): any {
    // Sort by priority
    const sortedStrengths = [...(swot.strengths || [])].sort((a, b) => b.priority - a.priority)
    const sortedWeaknesses = [...(swot.weaknesses || [])].sort((a, b) => b.priority - a.priority)
    const sortedOpportunities = [...(swot.opportunities || [])].sort((a, b) => b.priority - a.priority)
    const sortedThreats = [...(swot.threats || [])].sort((a, b) => (b.urgency === 'high' ? 1 : 0) - (a.urgency === 'high' ? 1 : 0))

    return {
      topStrengths: sortedStrengths.slice(0, 3).map((s: any) => s.title),
      criticalWeaknesses: sortedWeaknesses.slice(0, 3).map((w: any) => w.title),
      biggestOpportunities: sortedOpportunities.slice(0, 3).map((o: any) => o.title),
      urgentThreats: sortedThreats.slice(0, 2).map((t: any) => t.title)
    }
  }

  /**
   * Fallback SWOT when generation fails
   */
  private static getFallbackSWOT(industry: string): SWOTAnalysis {
    return {
      generatedAt: new Date(),
      dataFreshness: {},
      ...this.getMockSWOT(industry),
      summary: {
        topStrengths: [],
        criticalWeaknesses: [],
        biggestOpportunities: [],
        urgentThreats: []
      },
      strategicRecommendations: this.getMockRecommendations()
    }
  }

  /**
   * Mock SWOT data
   */
  private static getMockSWOT(industry: string): any {
    return {
      strengths: [
        {
          id: 'S1',
          category: 'strength',
          title: 'Analysis in progress',
          description: 'SWOT analysis is being generated based on available intelligence',
          evidence: ['Intelligence gathering in progress'],
          source: 'System',
          impact: 'medium',
          actionItems: ['Complete intelligence gathering to see detailed strengths'],
          priority: 5
        }
      ],
      weaknesses: [
        {
          id: 'W1',
          category: 'weakness',
          title: 'Analysis in progress',
          description: 'Weaknesses will be identified after intelligence analysis',
          evidence: ['Pending analysis'],
          source: 'System',
          impact: 'medium',
          effort: 'low',
          actionItems: ['Complete analysis to see specific weaknesses'],
          priority: 5
        }
      ],
      opportunities: [
        {
          id: 'O1',
          category: 'opportunity',
          title: 'Analysis in progress',
          description: 'Opportunities will be identified from market and competitive analysis',
          evidence: ['Pending analysis'],
          source: 'System',
          impact: 'medium',
          actionItems: ['Complete analysis to see specific opportunities'],
          priority: 5
        }
      ],
      threats: [
        {
          id: 'T1',
          category: 'threat',
          title: 'Analysis in progress',
          description: 'Threats will be identified from competitive and market trends',
          evidence: ['Pending analysis'],
          source: 'System',
          impact: 'low',
          urgency: 'low',
          actionItems: ['Complete analysis to see specific threats'],
          priority: 3
        }
      ]
    }
  }

  /**
   * Mock recommendations
   */
  private static getMockRecommendations(): any[] {
    return [
      {
        recommendation: 'Complete intelligence gathering to generate strategic recommendations',
        rationale: 'Strategic recommendations require comprehensive SWOT analysis',
        relatedItems: [],
        priority: 'medium',
        timeframe: 'Available after analysis completion'
      }
    ]
  }
}
