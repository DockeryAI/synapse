/**
 * Value Delivery Analysis Service
 * Compares UVP promises to actual website content delivery
 * Calculates alignment scores and identifies gaps
 */

interface UVPComponent {
  component: string
  uvpPromise: string
  websiteDelivery: string
  alignmentScore: number // 0-100
  gap: string
  examples: string[]
  recommendation: string
}

interface ValueDeliveryAudit {
  overallScore: number // 0-100
  scoreBreakdown: {
    targetCustomer: number
    problemSolved: number
    uniqueSolution: number
    keyBenefit: number
    differentiation: number
  }
  componentAnalysis: UVPComponent[]
  quickWins: Array<{
    win: string
    currentState: string
    desiredState: string
    effort: 'low' | 'medium' | 'high'
    impact: 'low' | 'medium' | 'high'
    estimatedScoreGain: number
    specificActions: string[]
  }>
  scoreProjection: {
    withQuickWins: number
    with3MonthPlan: number
    with6MonthPlan: number
  }
  beforeAfterPreview: {
    component: string
    before: string
    after: string
    improvement: string
  }[]
}

export class ValueAnalysisService {
  /**
   * Analyze value delivery alignment between UVP and website
   */
  static async analyzeValueDelivery(
    websiteUrl: string,
    uvp: any,
    brandId: string
  ): Promise<ValueDeliveryAudit> {
    console.log('[ValueAnalysisService] Starting value delivery analysis:', {
      websiteUrl,
      brandId,
      hasUVP: !!uvp
    })

    try {
      // Step 1: Scan website content
      console.log('[ValueAnalysisService] Step 1/3: Scanning website...')
      const websiteData = await this.scanWebsite(websiteUrl, brandId)

      // Step 2: Analyze alignment with Claude
      console.log('[ValueAnalysisService] Step 2/3: Analyzing UVP-content alignment...')
      const alignment = await this.analyzeAlignment(uvp, websiteData)

      // Step 3: Generate quick wins and projections
      console.log('[ValueAnalysisService] Step 3/3: Generating quick wins...')
      const quickWins = await this.generateQuickWins(alignment, uvp, websiteData)

      // Calculate overall score
      const scores = alignment.map((c: any) => c.alignmentScore)
      const overallScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)

      // Calculate score breakdown
      const scoreBreakdown = {
        targetCustomer: alignment.find((c: any) => c.component === 'Target Customer')?.alignmentScore || 0,
        problemSolved: alignment.find((c: any) => c.component === 'Problem Solved')?.alignmentScore || 0,
        uniqueSolution: alignment.find((c: any) => c.component === 'Unique Solution')?.alignmentScore || 0,
        keyBenefit: alignment.find((c: any) => c.component === 'Key Benefit')?.alignmentScore || 0,
        differentiation: alignment.find((c: any) => c.component === 'Differentiation')?.alignmentScore || 0,
      }

      // Calculate score projections
      const quickWinGains = quickWins.slice(0, 3).reduce((sum: number, qw: any) => sum + qw.estimatedScoreGain, 0)
      const scoreProjection = {
        withQuickWins: Math.min(100, overallScore + quickWinGains),
        with3MonthPlan: Math.min(100, overallScore + quickWinGains + 15),
        with6MonthPlan: Math.min(100, overallScore + quickWinGains + 25)
      }

      // Generate before/after previews
      const beforeAfterPreview = quickWins.slice(0, 3).map((qw: any) => ({
        component: qw.win,
        before: qw.currentState,
        after: qw.desiredState,
        improvement: `+${qw.estimatedScoreGain} points`
      }))

      return {
        overallScore,
        scoreBreakdown,
        componentAnalysis: alignment,
        quickWins,
        scoreProjection,
        beforeAfterPreview
      }
    } catch (error) {
      console.error('[ValueAnalysisService] Analysis failed:', error)
      return this.getFallbackAudit(uvp)
    }
  }

  /**
   * Scan website content
   */
  private static async scanWebsite(websiteUrl: string, brandId: string): Promise<any> {
    try {
      const { websiteAnalyzer } = await import('../uvp-wizard/website-analyzer')
      const analysisResult = await websiteAnalyzer.analyzeWebsite(websiteUrl, brandId)

      return {
        homepage: analysisResult.pages?.find((p: any) => p.type === 'homepage')?.content || '',
        about: analysisResult.pages?.find((p: any) => p.type === 'about')?.content || '',
        services: analysisResult.pages?.find((p: any) => p.type === 'services')?.content || '',
        allContent: analysisResult.fullText || '',
        metadata: {
          title: analysisResult.metadata?.title || '',
          description: analysisResult.metadata?.description || ''
        }
      }
    } catch (error) {
      console.error('[ValueAnalysisService] Website scan failed:', error)
      return {
        homepage: '',
        about: '',
        services: '',
        allContent: 'Website scan failed',
        metadata: { title: '', description: '' }
      }
    }
  }

  /**
   * Analyze alignment between UVP and website content
   */
  private static async analyzeAlignment(uvp: any, websiteData: any): Promise<UVPComponent[]> {
    const { generateOpusResponse } = await import('../uvp-wizard/openrouter-ai')

    const prompt = `Analyze the alignment between this Value Proposition and the website content.

VALUE PROPOSITION:
- Target Customer: ${uvp.targetCustomer || 'Not specified'}
- Problem Solved: ${uvp.problemSolved || 'Not specified'}
- Unique Solution: ${uvp.uniqueSolution || 'Not specified'}
- Key Benefit: ${uvp.keyBenefit || 'Not specified'}
- Differentiation: ${uvp.differentiation || 'Not specified'}

WEBSITE CONTENT:
Homepage: ${websiteData.homepage?.substring(0, 1000)}
About: ${websiteData.about?.substring(0, 500)}
Services: ${websiteData.services?.substring(0, 500)}
Meta Title: ${websiteData.metadata?.title}
Meta Description: ${websiteData.metadata?.description}

ALIGNMENT ANALYSIS REQUIREMENTS:

For each UVP component, analyze:

1. ALIGNMENT SCORE (0-100):
   - 90-100: Perfectly aligned, clearly communicated
   - 70-89: Well represented, minor improvements needed
   - 50-69: Partially present, needs strengthening
   - 30-49: Weakly present, major gaps
   - 0-29: Missing or contradictory

2. WEBSITE DELIVERY:
   - How is this UVP component currently communicated on the website?
   - Quote specific examples from the website content

3. GAP IDENTIFICATION:
   - What's the gap between UVP promise and website delivery?
   - Why does this gap exist?

4. RECOMMENDATION:
   - Specific, actionable recommendation to close the gap
   - Where on the website to implement

Return as JSON array:
[
  {
    "component": "Target Customer",
    "uvpPromise": "[what UVP promises]",
    "websiteDelivery": "[how website delivers - quote specific text]",
    "alignmentScore": 75,
    "gap": "[specific gap description]",
    "examples": ["Homepage hero text mentions X", "About page focuses on Y"],
    "recommendation": "[specific action to improve alignment]"
  }
]

Analyze all 5 components: Target Customer, Problem Solved, Unique Solution, Key Benefit, Differentiation.`

    try {
      const response = await generateOpusResponse([
        { role: 'user', content: prompt }
      ])

      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('No JSON array in response')

      const alignment = JSON.parse(jsonMatch[0])
      console.log('[ValueAnalysisService] Alignment analysis complete')

      return alignment
    } catch (error) {
      console.error('[ValueAnalysisService] Alignment analysis failed:', error)
      return this.getMockAlignment(uvp)
    }
  }

  /**
   * Generate quick win recommendations
   */
  private static async generateQuickWins(
    alignment: UVPComponent[],
    uvp: any,
    websiteData: any
  ): Promise<any[]> {
    const { generateOpusResponse } = await import('../uvp-wizard/openrouter-ai')

    const prompt = `Based on this UVP-to-website alignment analysis, generate 5-7 "quick win" improvements that will rapidly increase the alignment score.

ALIGNMENT ANALYSIS:
${JSON.stringify(alignment, null, 2)}

VALUE PROPOSITION:
${JSON.stringify(uvp, null, 2)}

QUICK WIN REQUIREMENTS:

For each quick win:

1. DESCRIPTION: What needs to change
2. CURRENT STATE: What the website says now (be specific)
3. DESIRED STATE: What it should say (write the improved copy)
4. EFFORT: low/medium/high (time & resources needed)
5. IMPACT: low/medium/high (score improvement potential)
6. ESTIMATED SCORE GAIN: How many points this will add (realistic estimate)
7. SPECIFIC ACTIONS: Step-by-step implementation checklist

Prioritize by:
- Highest impact with lowest effort first
- Changes that can be made in hours/days, not weeks
- Changes to high-visibility pages (homepage, about, key landing pages)

Return as JSON array:
[
  {
    "win": "Update homepage hero to address target customer directly",
    "currentState": "[current homepage hero text]",
    "desiredState": "[improved hero text that aligns with UVP]",
    "effort": "low",
    "impact": "high",
    "estimatedScoreGain": 12,
    "specificActions": [
      "Replace current hero headline with: [specific text]",
      "Update subheadline to emphasize [key benefit]",
      "Add CTA that speaks to [target customer]"
    ]
  }
]`

    try {
      const response = await generateOpusResponse([
        { role: 'user', content: prompt }
      ])

      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('No JSON array in response')

      const quickWins = JSON.parse(jsonMatch[0])
      console.log('[ValueAnalysisService] Quick wins generated')

      return quickWins
    } catch (error) {
      console.error('[ValueAnalysisService] Quick wins generation failed:', error)
      return this.getMockQuickWins()
    }
  }

  /**
   * Fallback audit when analysis fails
   */
  private static getFallbackAudit(uvp: any): ValueDeliveryAudit {
    return {
      overallScore: 0,
      scoreBreakdown: {
        targetCustomer: 0,
        problemSolved: 0,
        uniqueSolution: 0,
        keyBenefit: 0,
        differentiation: 0
      },
      componentAnalysis: this.getMockAlignment(uvp),
      quickWins: this.getMockQuickWins(),
      scoreProjection: {
        withQuickWins: 0,
        with3MonthPlan: 0,
        with6MonthPlan: 0
      },
      beforeAfterPreview: []
    }
  }

  /**
   * Mock alignment data
   */
  private static getMockAlignment(uvp: any): UVPComponent[] {
    return [
      {
        component: 'Target Customer',
        uvpPromise: uvp.targetCustomer || 'Target customer not specified in UVP',
        websiteDelivery: 'Analysis in progress - website content being evaluated',
        alignmentScore: 0,
        gap: 'Analysis pending',
        examples: ['Detailed analysis will appear here'],
        recommendation: 'Complete website analysis to see specific recommendations'
      },
      {
        component: 'Problem Solved',
        uvpPromise: uvp.problemSolved || 'Problem not specified in UVP',
        websiteDelivery: 'Analysis in progress',
        alignmentScore: 0,
        gap: 'Analysis pending',
        examples: [],
        recommendation: 'Complete website analysis to see recommendations'
      },
      {
        component: 'Unique Solution',
        uvpPromise: uvp.uniqueSolution || 'Solution not specified in UVP',
        websiteDelivery: 'Analysis in progress',
        alignmentScore: 0,
        gap: 'Analysis pending',
        examples: [],
        recommendation: 'Complete website analysis to see recommendations'
      },
      {
        component: 'Key Benefit',
        uvpPromise: uvp.keyBenefit || 'Benefit not specified in UVP',
        websiteDelivery: 'Analysis in progress',
        alignmentScore: 0,
        gap: 'Analysis pending',
        examples: [],
        recommendation: 'Complete website analysis to see recommendations'
      },
      {
        component: 'Differentiation',
        uvpPromise: uvp.differentiation || 'Differentiation not specified in UVP',
        websiteDelivery: 'Analysis in progress',
        alignmentScore: 0,
        gap: 'Analysis pending',
        examples: [],
        recommendation: 'Complete website analysis to see recommendations'
      }
    ]
  }

  /**
   * Mock quick wins
   */
  private static getMockQuickWins(): any[] {
    return [
      {
        win: 'Analysis in progress',
        currentState: 'Website analysis pending',
        desiredState: 'Detailed recommendations will appear after analysis',
        effort: 'low',
        impact: 'medium',
        estimatedScoreGain: 0,
        specificActions: ['Complete website analysis to see specific action items']
      }
    ]
  }
}
