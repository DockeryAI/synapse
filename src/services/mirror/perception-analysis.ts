/**
 * Brand Perception Mirror Service
 * Compares current customer perception vs desired UVP perception
 * Generates transformation plan to close the perception gap
 */

interface PerceptionProfile {
  keywords: string[] // Top 10 perception keywords
  themes: Array<{
    theme: string
    frequency: number
    sentiment: 'positive' | 'neutral' | 'negative'
    examples: string[]
  }>
  customerVoice: string[] // Direct quotes/examples
  positioning: string // How customers currently describe the brand
  emotionalTone: string // Overall emotional perception
}

interface PerceptionGap {
  dimension: string
  current: string
  desired: string
  gapSize: 'small' | 'medium' | 'large'
  difficulty: 'easy' | 'moderate' | 'hard'
  priority: 'low' | 'medium' | 'high'
  rootCause: string
  impactIfUnchanged: string
}

interface TransformationPhase {
  phase: number
  name: string
  duration: string
  startWeek: number
  objectives: string[]
  keyActions: Array<{
    action: string
    owner: string
    effort: string
    impact: string
  }>
  expectedProgress: string
  successMetrics: string[]
}

interface BrandPerceptionMirror {
  currentPerception: PerceptionProfile
  desiredPerception: PerceptionProfile
  perceptionGaps: PerceptionGap[]
  transformationPlan: {
    phases: TransformationPhase[]
    quickWins: Array<{
      action: string
      impact: string
      timeframe: string
    }>
    longTermShifts: Array<{
      shift: string
      rationale: string
      timeline: string
    }>
  }
  progressTracking: {
    metricsToTrack: Array<{
      metric: string
      currentValue: string
      targetValue: string
      howToMeasure: string
    }>
    checkInSchedule: string[]
  }
  visualComparison: {
    beforeKeywords: string[]
    afterKeywords: string[]
    beforeThemes: string[]
    afterThemes: string[]
  }
}

export class PerceptionAnalysisService {
  /**
   * Analyze brand perception gap and create transformation plan
   */
  static async analyzeBrandPerceptionGap(
    brandName: string,
    websiteUrl: string,
    uvp: any,
    industry: string
  ): Promise<BrandPerceptionMirror> {
    console.log('[PerceptionAnalysisService] Starting perception analysis:', {
      brandName,
      websiteUrl,
      industry,
      hasUVP: !!uvp
    })

    try {
      // Step 1: Research current customer perception
      console.log('[PerceptionAnalysisService] Step 1/4: Researching current perception...')
      const currentPerception = await this.researchCurrentPerception(brandName, websiteUrl, industry)

      // Step 2: Map desired perception from UVP
      console.log('[PerceptionAnalysisService] Step 2/4: Mapping desired perception from UVP...')
      const desiredPerception = await this.mapDesiredPerception(uvp, industry)

      // Step 3: Identify perception gaps
      console.log('[PerceptionAnalysisService] Step 3/4: Analyzing perception gaps...')
      const gaps = await this.identifyGaps(currentPerception, desiredPerception, uvp)

      // Step 4: Generate 90-day transformation plan
      console.log('[PerceptionAnalysisService] Step 4/4: Creating transformation plan...')
      const transformationPlan = await this.generateTransformationPlan(gaps, currentPerception, desiredPerception)

      return {
        currentPerception,
        desiredPerception,
        perceptionGaps: gaps,
        transformationPlan,
        progressTracking: this.generateProgressTracking(gaps, desiredPerception),
        visualComparison: {
          beforeKeywords: currentPerception.keywords,
          afterKeywords: desiredPerception.keywords,
          beforeThemes: currentPerception.themes.map(t => t.theme),
          afterThemes: desiredPerception.themes.map(t => t.theme)
        }
      }
    } catch (error) {
      console.error('[PerceptionAnalysisService] Analysis failed:', error)
      return this.getFallbackMirror(brandName, uvp, industry)
    }
  }

  /**
   * Research current customer perception
   */
  private static async researchCurrentPerception(
    brandName: string,
    websiteUrl: string,
    industry: string
  ): Promise<PerceptionProfile> {
    try {
      // Try Perplexity for review research
      const { PerplexityAPI } = await import('../uvp-wizard/perplexity-api')

      const queries = [
        `${brandName} customer reviews`,
        `${brandName} ${industry} reputation`,
        `What do customers say about ${brandName}`
      ]

      const research: string[] = []
      for (const query of queries.slice(0, 2)) {
        try {
          const result = await PerplexityAPI.research(query)
          research.push(result)
        } catch (err) {
          console.error(`[PerceptionAnalysisService] Query failed: ${query}`, err)
        }
      }

      // Also get brand perception from website analysis
      const { BrandPerceptionService } = await import('./brand-perception')
      const brandAnalysis = await BrandPerceptionService.analyzeBrand('', websiteUrl, industry)

      // Use Claude to synthesize perception profile
      const { generateOpusResponse } = await import('../uvp-wizard/openrouter-ai')

      const prompt = `Analyze this research to create a current brand perception profile.

BRAND: ${brandName}
INDUSTRY: ${industry}

RESEARCH DATA:
${research.join('\n\n')}

WEBSITE ANALYSIS:
- Clarity Score: ${brandAnalysis.clarityScore}
- Messaging: ${JSON.stringify(brandAnalysis.insights)}

CREATE PERCEPTION PROFILE:

1. KEYWORDS (10 words customers use to describe brand)
2. THEMES (3-5 recurring themes in customer feedback)
   - Theme name
   - Frequency (how often mentioned)
   - Sentiment (positive/neutral/negative)
   - Examples (specific quotes or paraphrases)
3. CUSTOMER VOICE (5 example quotes that capture perception)
4. POSITIONING (One sentence: How customers currently describe the brand)
5. EMOTIONAL TONE (Overall emotional perception: e.g., "trusted and reliable", "innovative and exciting", "confused and unclear")

Return as JSON:
{
  "keywords": ["reliable", "professional", "expensive", "quality", "traditional", "local", "established", "trustworthy", "expert", "thorough"],
  "themes": [
    {
      "theme": "Quality service",
      "frequency": 45,
      "sentiment": "positive",
      "examples": ["Great attention to detail", "Always delivers on promises"]
    }
  ],
  "customerVoice": [
    "They really know what they're doing",
    "Pricey but worth it for the quality"
  ],
  "positioning": "A premium, established provider known for reliable, high-quality service",
  "emotionalTone": "Trusted and professional, but seen as traditional and expensive"
}`

      const response = await generateOpusResponse([
        { role: 'user', content: prompt }
      ])

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON in response')

      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('[PerceptionAnalysisService] Current perception research failed:', error)
      return this.getMockCurrentPerception(industry)
    }
  }

  /**
   * Map desired perception from UVP
   */
  private static async mapDesiredPerception(
    uvp: any,
    industry: string
  ): Promise<PerceptionProfile> {
    const { generateOpusResponse } = await import('../uvp-wizard/openrouter-ai')

    const prompt = `Based on this Value Proposition, map the DESIRED brand perception.

VALUE PROPOSITION:
- Target Customer: ${uvp.targetCustomer || 'Not specified'}
- Problem Solved: ${uvp.problemSolved || 'Not specified'}
- Unique Solution: ${uvp.uniqueSolution || 'Not specified'}
- Key Benefit: ${uvp.keyBenefit || 'Not specified'}
- Differentiation: ${uvp.differentiation || 'Not specified'}

INDUSTRY: ${industry}

CREATE DESIRED PERCEPTION PROFILE:

1. KEYWORDS (10 words you WANT customers to use when describing the brand)
2. THEMES (3-5 themes you want to be known for)
   - Theme name
   - Target frequency (how important)
   - Sentiment (should always be positive for desired state)
   - Examples (what you want customers to say)
3. CUSTOMER VOICE (5 example quotes representing ideal customer testimonials)
4. POSITIONING (One sentence: How you WANT customers to describe the brand)
5. EMOTIONAL TONE (Target emotional perception aligned with UVP)

Return as JSON matching the same structure as current perception.`

    try {
      const response = await generateOpusResponse([
        { role: 'user', content: prompt }
      ])

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON in response')

      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('[PerceptionAnalysisService] Desired perception mapping failed:', error)
      return this.getMockDesiredPerception(uvp)
    }
  }

  /**
   * Identify perception gaps
   */
  private static async identifyGaps(
    current: PerceptionProfile,
    desired: PerceptionProfile,
    uvp: any
  ): Promise<PerceptionGap[]> {
    const { generateOpusResponse } = await import('../uvp-wizard/openrouter-ai')

    const prompt = `Identify the perception gaps between current and desired brand perception.

CURRENT PERCEPTION:
${JSON.stringify(current, null, 2)}

DESIRED PERCEPTION:
${JSON.stringify(desired, null, 2)}

IDENTIFY GAPS:

For 5-7 key dimensions, analyze:
1. DIMENSION: What aspect of perception (e.g., "Price perception", "Expertise level", "Innovation")
2. CURRENT: How it's perceived now
3. DESIRED: How you want it perceived
4. GAP SIZE: small/medium/large
5. DIFFICULTY: easy/moderate/hard to change
6. PRIORITY: low/medium/high
7. ROOT CAUSE: Why this gap exists
8. IMPACT IF UNCHANGED: What happens if gap persists

Return as JSON array:
[
  {
    "dimension": "Price Perception",
    "current": "Seen as expensive and premium",
    "desired": "Seen as best value for the quality delivered",
    "gapSize": "medium",
    "difficulty": "moderate",
    "priority": "high",
    "rootCause": "No visible pricing or value justification on website",
    "impactIfUnchanged": "Will lose price-sensitive customers to competitors"
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
      console.error('[PerceptionAnalysisService] Gap identification failed:', error)
      return this.getMockGaps()
    }
  }

  /**
   * Generate 90-day transformation plan
   */
  private static async generateTransformationPlan(
    gaps: PerceptionGap[],
    current: PerceptionProfile,
    desired: PerceptionProfile
  ): Promise<any> {
    const { generateOpusResponse } = await import('../uvp-wizard/openrouter-ai')

    const prompt = `Create a 90-day transformation plan to close these perception gaps.

PERCEPTION GAPS:
${JSON.stringify(gaps, null, 2)}

PLAN REQUIREMENTS:

1. QUICK WINS (Week 1-2):
   - 3-5 immediate actions
   - High impact, low effort
   - Build momentum

2. THREE PHASES (30 days each):
   Phase format:
   - Phase number & name
   - Duration
   - Start week
   - 3-5 objectives
   - 5-8 key actions with owner, effort, impact
   - Expected progress
   - Success metrics

3. LONG-TERM SHIFTS:
   - 3-4 fundamental shifts needed
   - Rationale for each
   - Timeline beyond 90 days

Return as JSON:
{
  "quickWins": [
    {
      "action": "Update homepage hero to emphasize [desired perception]",
      "impact": "Immediate alignment of first impression",
      "timeframe": "Week 1"
    }
  ],
  "phases": [
    {
      "phase": 1,
      "name": "Foundation & Messaging",
      "duration": "30 days",
      "startWeek": 1,
      "objectives": [
        "Align all website messaging with desired perception",
        "Launch customer testimonial campaign"
      ],
      "keyActions": [
        {
          "action": "Rewrite homepage, about, and services pages",
          "owner": "Marketing",
          "effort": "medium",
          "impact": "high"
        }
      ],
      "expectedProgress": "20-30% shift in key perception metrics",
      "successMetrics": [
        "3 updated pages live",
        "5 new testimonials captured"
      ]
    }
  ],
  "longTermShifts": [
    {
      "shift": "From 'expensive' to 'best value'",
      "rationale": "Requires sustained value communication and proof",
      "timeline": "6-12 months"
    }
  ]
}`

    try {
      const response = await generateOpusResponse([
        { role: 'user', content: prompt }
      ])

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON in response')

      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('[PerceptionAnalysisService] Transformation plan generation failed:', error)
      return this.getMockTransformationPlan()
    }
  }

  /**
   * Generate progress tracking framework
   */
  private static generateProgressTracking(
    gaps: PerceptionGap[],
    desired: PerceptionProfile
  ): any {
    return {
      metricsToTrack: [
        {
          metric: 'Website visitor perception survey',
          currentValue: 'Baseline TBD',
          targetValue: 'Align with desired keywords',
          howToMeasure: 'Monthly survey asking "What 3 words describe us?"'
        },
        {
          metric: 'Brand keyword mentions',
          currentValue: 'Current keywords',
          targetValue: 'Desired keywords',
          howToMeasure: 'Track social media and review mentions'
        },
        {
          metric: 'Value perception score',
          currentValue: 'TBD',
          targetValue: '8/10 or higher',
          howToMeasure: 'Survey: "Rate value for price on 1-10 scale"'
        },
        ...gaps.filter(g => g.priority === 'high').map(g => ({
          metric: `${g.dimension} shift`,
          currentValue: g.current,
          targetValue: g.desired,
          howToMeasure: `Track mentions and sentiment for "${g.dimension}"`
        }))
      ],
      checkInSchedule: [
        'Week 2: Quick wins review',
        'Week 4: Phase 1 completion',
        'Week 8: Phase 2 completion',
        'Week 12: Phase 3 completion & full assessment'
      ]
    }
  }

  /**
   * Fallback mirror when analysis fails
   */
  private static getFallbackMirror(
    brandName: string,
    uvp: any,
    industry: string
  ): BrandPerceptionMirror {
    return {
      currentPerception: this.getMockCurrentPerception(industry),
      desiredPerception: this.getMockDesiredPerception(uvp),
      perceptionGaps: this.getMockGaps(),
      transformationPlan: this.getMockTransformationPlan(),
      progressTracking: {
        metricsToTrack: [],
        checkInSchedule: []
      },
      visualComparison: {
        beforeKeywords: [],
        afterKeywords: [],
        beforeThemes: [],
        afterThemes: []
      }
    }
  }

  /**
   * Mock current perception
   */
  private static getMockCurrentPerception(industry: string): PerceptionProfile {
    return {
      keywords: ['professional', 'traditional', 'reliable', 'expensive', 'established'],
      themes: [
        {
          theme: 'Analysis in progress',
          frequency: 0,
          sentiment: 'neutral',
          examples: ['Current perception analysis pending']
        }
      ],
      customerVoice: ['Analysis pending - customer feedback will appear here'],
      positioning: 'Current positioning analysis in progress',
      emotionalTone: 'Emotional perception analysis pending'
    }
  }

  /**
   * Mock desired perception
   */
  private static getMockDesiredPerception(uvp: any): PerceptionProfile {
    return {
      keywords: ['innovative', 'value', 'expert', 'results-focused', 'customer-centric'],
      themes: [
        {
          theme: 'Desired perception mapping in progress',
          frequency: 100,
          sentiment: 'positive',
          examples: ['Perception goals will be mapped from UVP']
        }
      ],
      customerVoice: ['Desired testimonials will be defined based on UVP'],
      positioning: 'Desired positioning based on UVP',
      emotionalTone: 'Target emotional tone from UVP analysis'
    }
  }

  /**
   * Mock gaps
   */
  private static getMockGaps(): PerceptionGap[] {
    return [
      {
        dimension: 'Analysis in progress',
        current: 'Current perception being researched',
        desired: 'Desired perception being mapped',
        gapSize: 'medium',
        difficulty: 'moderate',
        priority: 'medium',
        rootCause: 'Analysis pending',
        impactIfUnchanged: 'Full analysis will reveal impact'
      }
    ]
  }

  /**
   * Mock transformation plan
   */
  private static getMockTransformationPlan(): any {
    return {
      quickWins: [
        {
          action: 'Analysis in progress',
          impact: 'Quick wins will be identified after perception analysis',
          timeframe: 'Pending'
        }
      ],
      phases: [
        {
          phase: 1,
          name: 'Analysis Phase',
          duration: '30 days',
          startWeek: 1,
          objectives: ['Complete perception analysis'],
          keyActions: [
            {
              action: 'Gather customer perception data',
              owner: 'Research',
              effort: 'medium',
              impact: 'high'
            }
          ],
          expectedProgress: 'Baseline established',
          successMetrics: ['Analysis complete']
        }
      ],
      longTermShifts: [
        {
          shift: 'Analysis in progress',
          rationale: 'Long-term shifts will be identified after analysis',
          timeline: 'TBD'
        }
      ]
    }
  }
}
