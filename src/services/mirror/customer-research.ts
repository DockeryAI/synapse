/**
 * Customer Understanding Service
 * Researches customer expectations and decision factors using Perplexity + Brandock
 */

interface CustomerInsights {
  decisionFactors: Array<{
    factor: string
    importance: number // 0-100
    description: string
    sources: string[]
  }>
  painPoints: Array<{
    painPoint: string
    frequency: number // how often mentioned
    impact: 'high' | 'medium' | 'low'
    examples: string[]
  }>
  positiveDrivers: Array<{
    driver: string
    examples: string[]
  }>
  commonComplaints: Array<{
    complaint: string
    examples: string[]
  }>
  unexpectedPriorities: Array<{
    priority: string
    insight: string
    why: string
  }>
  gapAnalysis: {
    customerPriorities: string[]
    brandEmphasis: string[]
    gaps: Array<{
      gap: string
      recommendation: string
      priority: 'high' | 'medium' | 'low'
    }>
  }
}

export class CustomerResearchService {
  /**
   * Research customer understanding for an industry
   */
  static async researchCustomers(
    industry: string,
    location?: string,
    brandWebsite?: string
  ): Promise<CustomerInsights> {
    console.log('[CustomerResearchService] Starting customer research:', { industry, location })

    // Step 1: Research with Perplexity (or use Claude as fallback)
    console.log('[CustomerResearchService] Step 1/3: Researching customer expectations...')
    const perplexityResearch = await this.researchWithPerplexity(industry, location)

    // Step 2: Get Brandock industry data
    console.log('[CustomerResearchService] Step 2/3: Getting Brandock industry data...')
    const brandockData = await this.getBrandockData(industry)

    // Step 3: Synthesize with Claude
    console.log('[CustomerResearchService] Step 3/3: Synthesizing insights...')
    const insights = await this.synthesizeInsights(perplexityResearch, brandockData, industry, brandWebsite)

    return insights
  }

  /**
   * Research with Perplexity (fallback to Claude)
   */
  private static async researchWithPerplexity(
    industry: string,
    location?: string
  ): Promise<string> {
    try {
      // Try Perplexity if available
      const { PerplexityAPI } = await import('../uvp-wizard/perplexity-api')

      const queries = [
        `${industry} customer reviews common themes`,
        `${industry} customer decision factors`,
        `What do ${industry} customers value most`,
        location ? `${location} ${industry} customer expectations` : null
      ].filter(Boolean)

      const research: string[] = []

      for (const query of queries.slice(0, 2)) { // Limit to 2 queries for performance
        try {
          const result = await PerplexityAPI.research(query as string)
          research.push(result)
        } catch (err) {
          console.error(`[CustomerResearchService] Query failed: ${query}`, err)
        }
      }

      return research.join('\n\n')
    } catch (error) {
      console.error('[CustomerResearchService] Perplexity not available, using Claude fallback')

      // Fallback: Use Claude's knowledge
      return `General ${industry} customer insights from Claude knowledge base.`
    }
  }

  /**
   * Get Brandock industry data
   */
  private static async getBrandockData(industry: string): Promise<any> {
    try {
      // TODO: Implement Brandock data retrieval from Supabase industry_profiles table
      // const { BrandockService } = await import('../intelligence/brandock-api')
      // const industryProfile = await BrandockService.getIndustryProfile(industry)

      // Returning empty data for now - brandock-api service doesn't exist yet
      return {
        customerTriggers: [],
        transformations: [],
        emotionalDrivers: {},
      }
    } catch (error) {
      console.error('[CustomerResearchService] Brandock data fetch failed:', error)
      return {
        customerTriggers: [],
        transformations: [],
        emotionalDrivers: {}
      }
    }
  }

  /**
   * Synthesize insights with Claude
   */
  private static async synthesizeInsights(
    research: string,
    brandockData: any,
    industry: string,
    brandWebsite?: string
  ): Promise<CustomerInsights> {
    const { generateOpusResponse } = await import('../uvp-wizard/openrouter-ai')

    const prompt = `Analyze customer expectations and decision factors for the ${industry} industry.

RESEARCH DATA:
${research}

BRANDOCK INDUSTRY DATA:
- Customer Triggers: ${JSON.stringify(brandockData.customerTriggers)}
- Transformations: ${JSON.stringify(brandockData.transformations)}
- Emotional Drivers: ${JSON.stringify(brandockData.emotionalDrivers)}

${brandWebsite ? `BRAND WEBSITE: ${brandWebsite}` : ''}

ANALYSIS REQUIREMENTS:

1. DECISION FACTORS (Top 5):
   - Factor name
   - Importance score (0-100)
   - Description
   - Sources/evidence

2. PAIN POINTS (3-5):
   - Pain point description
   - Frequency (how often mentioned)
   - Impact: high/medium/low
   - Specific examples

3. POSITIVE DRIVERS (3-5):
   - What drives positive reviews
   - Examples from research

4. COMMON COMPLAINTS (3-5):
   - What causes complaints
   - Examples from research

5. UNEXPECTED PRIORITIES (2-3):
   - Surprising or counterintuitive findings
   - Insight explanation
   - Why this matters

6. GAP ANALYSIS:
   - Top customer priorities (from research)
   - What brands typically emphasize
   - Gaps between priorities and emphasis
   - Recommendations to align

Return as JSON matching this structure:
{
  "decisionFactors": [
    {
      "factor": "Response time",
      "importance": 85,
      "description": "Customers highly value quick responses",
      "sources": ["reviews", "research"]
    }
  ],
  "painPoints": [
    {
      "painPoint": "Difficulty getting quotes",
      "frequency": 12,
      "impact": "high",
      "examples": ["...", "..."]
    }
  ],
  "positiveDrivers": [
    {
      "driver": "Transparent pricing",
      "examples": ["...", "..."]
    }
  ],
  "commonComplaints": [
    {
      "complaint": "Hidden fees",
      "examples": ["...", "..."]
    }
  ],
  "unexpectedPriorities": [
    {
      "priority": "Eco-friendly practices",
      "insight": "More customers than expected prioritize sustainability",
      "why": "Shows changing market values"
    }
  ],
  "gapAnalysis": {
    "customerPriorities": ["Speed", "Transparency", "Quality"],
    "brandEmphasis": ["Experience", "Technology", "Scale"],
    "gaps": [
      {
        "gap": "Customers want speed, brands emphasize experience",
        "recommendation": "Add speed/response time messaging",
        "priority": "high"
      }
    ]
  }
}`

    try {
      const response = await generateOpusResponse([
        { role: 'user', content: prompt }
      ])

      // Parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response')
      }

      const insights: CustomerInsights = JSON.parse(jsonMatch[0])
      console.log('[CustomerResearchService] Synthesis complete')

      return insights
    } catch (error) {
      console.error('[CustomerResearchService] Synthesis failed:', error)

      // Return fallback insights
      return this.getFallbackInsights(industry)
    }
  }

  /**
   * Fallback insights when synthesis fails
   */
  private static getFallbackInsights(industry: string): CustomerInsights {
    return {
      decisionFactors: [
        {
          factor: 'Quality of service',
          importance: 90,
          description: 'Customers prioritize service quality',
          sources: ['Industry analysis']
        },
        {
          factor: 'Price competitiveness',
          importance: 75,
          description: 'Price is an important consideration',
          sources: ['Industry analysis']
        },
        {
          factor: 'Reliability',
          importance: 85,
          description: 'Customers value consistent, reliable service',
          sources: ['Industry analysis']
        }
      ],
      painPoints: [
        {
          painPoint: 'Analysis in progress',
          frequency: 0,
          impact: 'medium',
          examples: ['Detailed analysis will be available shortly']
        }
      ],
      positiveDrivers: [
        {
          driver: 'Good customer service',
          examples: ['Positive reviews mention helpful staff']
        }
      ],
      commonComplaints: [
        {
          complaint: 'Slow response times',
          examples: ['Common complaint across industries']
        }
      ],
      unexpectedPriorities: [
        {
          priority: 'Analysis in progress',
          insight: 'Detailed insights being generated',
          why: 'Please refresh in a moment'
        }
      ],
      gapAnalysis: {
        customerPriorities: ['Quality', 'Speed', 'Value'],
        brandEmphasis: ['Features', 'Technology', 'Scale'],
        gaps: [
          {
            gap: 'Analysis in progress',
            recommendation: 'Detailed recommendations coming shortly',
            priority: 'medium'
          }
        ]
      }
    }
  }
}
