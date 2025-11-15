/**
 * Competitive Positioning Canvas Service
 * Creates 2x2 positioning maps based on UVP and competitive analysis
 * Identifies strategic white space and positioning opportunities
 */

interface PositionedCompetitor {
  name: string
  website: string
  xValue: number // 0-100 position on X axis
  yValue: number // 0-100 position on Y axis
  size: number // Relative size (for bubble chart)
  color: string
  description: string
}

interface PositioningAxis {
  dimension: string
  lowLabel: string
  highLabel: string
  description: string
  rationale: string
}

interface WhiteSpaceOpportunity {
  zone: string
  xRange: string
  yRange: string
  description: string
  opportunity: string
  risk: string
  competitors: string[]
}

interface PositioningCanvas {
  axes: {
    x: PositioningAxis
    y: PositioningAxis
  }
  brandPosition: PositionedCompetitor
  competitors: PositionedCompetitor[]
  whiteSpace: WhiteSpaceOpportunity[]
  strategicInsights: {
    currentPosition: string
    uvpAlignment: string
    competitiveAdvantage: string
    repositioningNeeded: boolean
    recommendations: string[]
  }
  alternativeAxes?: {
    x: { dimension: string; rationale: string }[]
    y: { dimension: string; rationale: string }[]
  }
}

export class PositioningAnalysisService {
  /**
   * Generate competitive positioning canvas based on UVP
   */
  static async generatePositioningCanvas(
    uvp: any,
    industry: string,
    brandName: string,
    brandWebsite?: string
  ): Promise<PositioningCanvas> {
    console.log('[PositioningAnalysisService] Starting positioning analysis:', {
      industry,
      brandName,
      hasUVP: !!uvp
    })

    try {
      // Step 1: Get competitive intelligence
      console.log('[PositioningAnalysisService] Step 1/3: Gathering competitive data...')
      const competitiveData = await this.getCompetitiveData(industry, brandWebsite)

      // Step 2: Determine positioning axes from UVP
      console.log('[PositioningAnalysisService] Step 2/3: Determining positioning axes...')
      const axes = await this.determineAxes(uvp, competitiveData, industry)

      // Step 3: Map positions and identify white space
      console.log('[PositioningAnalysisService] Step 3/3: Mapping positions...')
      const positioning = await this.mapPositions(
        axes,
        uvp,
        competitiveData,
        brandName,
        brandWebsite
      )

      return positioning
    } catch (error) {
      console.error('[PositioningAnalysisService] Analysis failed:', error)
      return this.getFallbackCanvas(uvp, industry, brandName)
    }
  }

  /**
   * Get competitive intelligence data
   */
  private static async getCompetitiveData(
    industry: string,
    brandWebsite?: string
  ): Promise<any> {
    try {
      // Reuse competitive analysis service
      const { CompetitiveAnalysisService } = await import('./competitive-analysis')
      const analysis = await CompetitiveAnalysisService.analyzeCompetitors(industry, brandWebsite)

      return {
        competitors: analysis.discoveredCompetitors || [],
        themes: analysis.commonThemes || [],
        uniquePositions: analysis.uniquePositions || []
      }
    } catch (error) {
      console.error('[PositioningAnalysisService] Failed to get competitive data:', error)
      return { competitors: [], themes: [], uniquePositions: [] }
    }
  }

  /**
   * Determine positioning axes from UVP
   */
  private static async determineAxes(
    uvp: any,
    competitiveData: any,
    industry: string
  ): Promise<{ x: PositioningAxis; y: PositioningAxis }> {
    const { generateOpusResponse } = await import('../uvp-wizard/openrouter-ai')

    const prompt = `Determine the two most strategic positioning axes for a 2x2 competitive positioning map.

VALUE PROPOSITION:
- Target Customer: ${uvp.targetCustomer || 'Not specified'}
- Problem Solved: ${uvp.problemSolved || 'Not specified'}
- Unique Solution: ${uvp.uniqueSolution || 'Not specified'}
- Key Benefit: ${uvp.keyBenefit || 'Not specified'}
- Differentiation: ${uvp.differentiation || 'Not specified'}

INDUSTRY: ${industry}

COMPETITIVE THEMES:
${competitiveData.themes?.map((t: any) => `- ${t.theme}: ${t.count} competitors`).join('\n') || 'No themes available'}

UNIQUE POSITIONS:
${competitiveData.uniquePositions?.map((p: any) => `- ${p.competitor}: ${p.uniquePosition}`).join('\n') || 'No unique positions available'}

AXIS SELECTION REQUIREMENTS:

Choose two axes that:
1. Reflect the UVP's key differentiation
2. Reveal competitive white space
3. Are measurable/observable
4. Matter to customers
5. Create strategic insight

Common axis examples:
- Price: Value/Affordable ↔ Premium/Luxury
- Service: Self-Service ↔ Full-Service/Concierge
- Specialization: Generalist ↔ Specialist/Niche
- Scale: Local/Boutique ↔ National/Enterprise
- Approach: Traditional ↔ Innovative
- Speed: Standard ↔ Express/Instant
- Customization: Standardized ↔ Fully Custom

For each axis provide:
1. DIMENSION: The strategic dimension
2. LOW LABEL: Label for low end (0)
3. HIGH LABEL: Label for high end (100)
4. DESCRIPTION: What this axis represents
5. RATIONALE: Why this axis is strategically important for this UVP

Return as JSON:
{
  "x": {
    "dimension": "Price Positioning",
    "lowLabel": "Value-Focused",
    "highLabel": "Premium",
    "description": "How the brand positions on price and perceived value",
    "rationale": "UVP emphasizes [specific benefit] which suggests premium positioning opportunity"
  },
  "y": {
    "dimension": "Service Level",
    "lowLabel": "Self-Service",
    "highLabel": "Full-Service",
    "description": "Degree of service and support provided",
    "rationale": "UVP's differentiation on [unique solution] maps well to service level"
  }
}`

    try {
      const response = await generateOpusResponse([
        { role: 'user', content: prompt }
      ])

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON in response')

      const axes = JSON.parse(jsonMatch[0])
      console.log('[PositioningAnalysisService] Axes determined:', axes)

      return axes
    } catch (error) {
      console.error('[PositioningAnalysisService] Axis determination failed:', error)
      return this.getDefaultAxes(industry)
    }
  }

  /**
   * Map brand and competitor positions on the canvas
   */
  private static async mapPositions(
    axes: any,
    uvp: any,
    competitiveData: any,
    brandName: string,
    brandWebsite?: string
  ): Promise<PositioningCanvas> {
    const { generateOpusResponse } = await import('../uvp-wizard/openrouter-ai')

    const competitorsList = competitiveData.competitors
      ?.slice(0, 10)
      .map((c: any) => `- ${c.name || c.website}: ${c.valueProposition || 'No VP available'}`)
      .join('\n') || 'No competitors available'

    const prompt = `Map the brand and competitors on this 2x2 positioning canvas.

POSITIONING AXES:
X-Axis: ${axes.x.dimension} (${axes.x.lowLabel} → ${axes.x.highLabel})
Y-Axis: ${axes.y.dimension} (${axes.y.lowLabel} → ${axes.y.highLabel})

BRAND VALUE PROPOSITION:
${JSON.stringify(uvp, null, 2)}

COMPETITORS:
${competitorsList}

POSITIONING REQUIREMENTS:

1. BRAND POSITION:
   - X value (0-100): Where brand sits on X axis based on UVP
   - Y value (0-100): Where brand sits on Y axis based on UVP
   - Size: Relative market presence (20-80)
   - Description: Brief positioning statement

2. COMPETITOR POSITIONS:
   For each competitor:
   - X value (0-100): Based on their messaging/offering
   - Y value (0-100): Based on their positioning
   - Size: Estimated market presence (10-60)
   - Description: Brief positioning statement

3. WHITE SPACE ZONES:
   Identify 2-4 zones with few/no competitors:
   - Zone description (e.g., "Premium + Full-Service")
   - X range (e.g., "70-100")
   - Y range (e.g., "70-100")
   - Opportunity description
   - Risk/challenge
   - Who's closest (competitors in adjacent zones)

4. STRATEGIC INSIGHTS:
   - Current position summary
   - UVP alignment assessment
   - Competitive advantage
   - Whether repositioning is needed
   - 3-5 strategic recommendations

Return as JSON:
{
  "brandPosition": {
    "name": "${brandName}",
    "website": "${brandWebsite || ''}",
    "xValue": 75,
    "yValue": 60,
    "size": 40,
    "color": "primary",
    "description": "Brief positioning description"
  },
  "competitors": [
    {
      "name": "Competitor A",
      "website": "competitor-a.com",
      "xValue": 30,
      "yValue": 40,
      "size": 35,
      "color": "gray",
      "description": "Brief positioning"
    }
  ],
  "whiteSpace": [
    {
      "zone": "Premium + Specialist",
      "xRange": "70-100",
      "yRange": "70-100",
      "description": "High-end specialized offerings",
      "opportunity": "Underserved segment with high willingness to pay",
      "risk": "Higher customer acquisition cost",
      "competitors": ["None in zone", "Competitor B in adjacent zone"]
    }
  ],
  "strategicInsights": {
    "currentPosition": "Brand positioned in [zone description]",
    "uvpAlignment": "UVP strongly/partially/weakly aligns with current position",
    "competitiveAdvantage": "Differentiated on [specific dimension]",
    "repositioningNeeded": false,
    "recommendations": [
      "Strengthen messaging around [dimension]",
      "Consider moving toward [direction] to capture [opportunity]"
    ]
  }
}`

    try {
      const response = await generateOpusResponse([
        { role: 'user', content: prompt }
      ])

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON in response')

      const positioning = JSON.parse(jsonMatch[0])
      console.log('[PositioningAnalysisService] Positioning mapped')

      return {
        axes,
        ...positioning,
        alternativeAxes: this.suggestAlternativeAxes(uvp, axes)
      }
    } catch (error) {
      console.error('[PositioningAnalysisService] Position mapping failed:', error)
      return this.getMockCanvas(axes, brandName, brandWebsite)
    }
  }

  /**
   * Suggest alternative axis combinations
   */
  private static suggestAlternativeAxes(uvp: any, currentAxes: any): any {
    const commonAxes = [
      { dimension: 'Price Positioning', rationale: 'Value vs Premium positioning' },
      { dimension: 'Service Level', rationale: 'Self-service vs Full-service' },
      { dimension: 'Specialization', rationale: 'Generalist vs Niche specialist' },
      { dimension: 'Speed/Delivery', rationale: 'Standard vs Express delivery' },
      { dimension: 'Innovation', rationale: 'Traditional vs Innovative approach' },
      { dimension: 'Scale', rationale: 'Local/Boutique vs National/Enterprise' },
    ]

    // Filter out current axes
    const alternatives = commonAxes.filter(
      (axis) =>
        axis.dimension !== currentAxes.x.dimension &&
        axis.dimension !== currentAxes.y.dimension
    )

    return {
      x: alternatives.slice(0, 3),
      y: alternatives.slice(3, 6)
    }
  }

  /**
   * Get default axes when determination fails
   */
  private static getDefaultAxes(industry: string): {
    x: PositioningAxis
    y: PositioningAxis
  } {
    return {
      x: {
        dimension: 'Price Positioning',
        lowLabel: 'Value-Focused',
        highLabel: 'Premium',
        description: 'How the brand positions on price and perceived value',
        rationale: 'Price is a fundamental positioning dimension in most markets'
      },
      y: {
        dimension: 'Service Level',
        lowLabel: 'Self-Service',
        highLabel: 'Full-Service',
        description: 'Degree of service and support provided to customers',
        rationale: 'Service level differentiates competitors across most industries'
      }
    }
  }

  /**
   * Fallback canvas when analysis fails
   */
  private static getFallbackCanvas(
    uvp: any,
    industry: string,
    brandName: string
  ): PositioningCanvas {
    const axes = this.getDefaultAxes(industry)
    return this.getMockCanvas(axes, brandName, '')
  }

  /**
   * Mock canvas data
   */
  private static getMockCanvas(
    axes: any,
    brandName: string,
    brandWebsite?: string
  ): PositioningCanvas {
    return {
      axes,
      brandPosition: {
        name: brandName,
        website: brandWebsite || '',
        xValue: 50,
        yValue: 50,
        size: 40,
        color: 'primary',
        description: 'Analysis in progress - position will be determined based on UVP'
      },
      competitors: [
        {
          name: 'Competitor A',
          website: 'competitor-a.com',
          xValue: 30,
          yValue: 30,
          size: 35,
          color: 'gray',
          description: 'Value-focused, limited service'
        },
        {
          name: 'Competitor B',
          website: 'competitor-b.com',
          xValue: 70,
          yValue: 40,
          size: 30,
          color: 'gray',
          description: 'Premium pricing, moderate service'
        },
        {
          name: 'Competitor C',
          website: 'competitor-c.com',
          xValue: 40,
          yValue: 70,
          size: 25,
          color: 'gray',
          description: 'Mid-range pricing, high service'
        }
      ],
      whiteSpace: [
        {
          zone: 'Analysis in Progress',
          xRange: '0-100',
          yRange: '0-100',
          description: 'White space opportunities will be identified after analysis',
          opportunity: 'Complete analysis to see opportunities',
          risk: 'Analysis pending',
          competitors: []
        }
      ],
      strategicInsights: {
        currentPosition: 'Analysis in progress',
        uvpAlignment: 'Will be assessed after positioning analysis',
        competitiveAdvantage: 'Will be identified during analysis',
        repositioningNeeded: false,
        recommendations: [
          'Complete positioning analysis to see strategic recommendations'
        ]
      },
      alternativeAxes: this.suggestAlternativeAxes({}, axes)
    }
  }
}
