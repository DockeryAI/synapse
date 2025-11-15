/**
 * Brand Perception Gap Analyzer Service
 * Analyzes gap between brand's self-presentation and customer perception
 */

import { websiteAnalyzer } from '../uvp-wizard/website-analyzer'

interface BrandPerceptionAnalysis {
  howTheyDescribeThemselves: {
    valueProp: string
    tagline: string
    heroText: string
    keyMessages: string[]
  }
  contentEmphasis: {
    mainThemes: string[]
    featureVsBenefitRatio: number // 0-100, higher = more benefits
    emotionalVsRational: number // 0-100, higher = more emotional
  }
  clarity: {
    score: number // 1-100
    issues: string[]
    suggestions: string[]
  }
  jargon: {
    density: number // 0-100, higher = more jargon
    examples: string[]
    plainAlternatives: Record<string, string>
  }
  insights: Array<{
    type: 'gap' | 'strength' | 'opportunity' | 'warning'
    title: string
    description: string
    impact: 'high' | 'medium' | 'low'
    actionable: string
  }>
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low'
    action: string
    reasoning: string
    estimatedImpact: string
  }>
}

export class BrandPerceptionService {
  /**
   * Analyze brand perception gap
   */
  static async analyzeBrand(
    brandId: string,
    websiteUrl: string,
    industry: string
  ): Promise<BrandPerceptionAnalysis> {
    console.log('[BrandPerceptionService] Starting analysis for:', websiteUrl, industry)

    // Step 1: Scan website with Website Analyzer
    console.log('[BrandPerceptionService] Step 1/2: Scanning website...')
    const websiteData = await websiteAnalyzer.analyzeWebsite(websiteUrl, brandId)

    if (!websiteData) {
      throw new Error('Failed to analyze website')
    }

    console.log('[BrandPerceptionService] Website data received:', {
      hasContent: !!websiteData.content,
      hasMetadata: !!websiteData.metadata,
      hasStructure: !!websiteData.structure
    })

    // Step 2: Use Claude to analyze perception gap
    console.log('[BrandPerceptionService] Step 2/2: Analyzing with Claude Opus...')
    const analysis = await this.analyzeWithClaude(websiteData, industry)

    return analysis
  }

  /**
   * Analyze website data with Claude Opus
   */
  private static async analyzeWithClaude(
    websiteData: any,
    industry: string
  ): Promise<BrandPerceptionAnalysis> {
    const { generateOpusResponse } = await import('../uvp-wizard/openrouter-ai')

    const prompt = `Analyze this website for a ${industry} business.

WEBSITE DATA:
- Homepage Content: ${websiteData.content?.homepage || 'Not available'}
- About Page: ${websiteData.content?.about || 'Not available'}
- Key Pages: ${JSON.stringify(websiteData.structure?.pages || [])}
- Metadata: ${JSON.stringify(websiteData.metadata || {})}

ANALYSIS REQUIREMENTS:

1. HOW THEY DESCRIBE THEMSELVES:
   Extract:
   - Main value proposition (what they say they offer)
   - Tagline or mission statement
   - Hero text (main headline/subheadline)
   - 3-5 key messages across the site

2. CONTENT EMPHASIS:
   - What themes/topics dominate their content
   - Feature vs Benefit ratio (0-100, where 100 = all benefits, 0 = all features)
   - Emotional vs Rational appeal (0-100, where 100 = all emotional, 0 = all rational)

3. CLARITY ANALYSIS:
   - Clarity score (1-100, where 100 = crystal clear, 1 = very confusing)
   - Specific clarity issues (vague language, mixed messages, etc.)
   - Suggestions to improve clarity

4. JARGON ANALYSIS:
   - Jargon density (0-100, where 100 = heavy jargon, 0 = plain language)
   - Examples of jargon used
   - Plain language alternatives for each jargon term

5. INSIGHTS (Generate 3-5):
   Each insight should:
   - Type: 'gap' (what's missing), 'strength' (what works), 'opportunity' (untapped potential), 'warning' (risks)
   - Title: Short, punchy headline
   - Description: 1-2 sentences explaining the insight
   - Impact: high/medium/low
   - Actionable: Specific action to take

6. RECOMMENDATIONS (3-5 prioritized actions):
   - Priority: high/medium/low
   - Action: What to do
   - Reasoning: Why this matters
   - Estimated Impact: What will improve

IMPORTANT:
- Be specific and actionable
- Use actual examples from the website
- Focus on gaps between what they say and how they say it
- Consider the ${industry} industry context

Return your analysis as JSON matching this structure:
{
  "howTheyDescribeThemselves": {
    "valueProp": "...",
    "tagline": "...",
    "heroText": "...",
    "keyMessages": ["...", "..."]
  },
  "contentEmphasis": {
    "mainThemes": ["...", "..."],
    "featureVsBenefitRatio": 65,
    "emotionalVsRational": 40
  },
  "clarity": {
    "score": 72,
    "issues": ["...", "..."],
    "suggestions": ["...", "..."]
  },
  "jargon": {
    "density": 45,
    "examples": ["...", "..."],
    "plainAlternatives": {
      "synergy": "working together",
      "leverage": "use"
    }
  },
  "insights": [
    {
      "type": "gap",
      "title": "...",
      "description": "...",
      "impact": "high",
      "actionable": "..."
    }
  ],
  "recommendations": [
    {
      "priority": "high",
      "action": "...",
      "reasoning": "...",
      "estimatedImpact": "..."
    }
  ]
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

      const analysis: BrandPerceptionAnalysis = JSON.parse(jsonMatch[0])
      console.log('[BrandPerceptionService] Analysis complete:', {
        clarityScore: analysis.clarity.score,
        jargonDensity: analysis.jargon.density,
        insightsCount: analysis.insights.length,
        recommendationsCount: analysis.recommendations.length
      })

      return analysis
    } catch (error) {
      console.error('[BrandPerceptionService] Analysis error:', error)

      // Return fallback analysis
      return this.getFallbackAnalysis(industry)
    }
  }

  /**
   * Fallback analysis when Claude fails
   */
  private static getFallbackAnalysis(industry: string): BrandPerceptionAnalysis {
    return {
      howTheyDescribeThemselves: {
        valueProp: 'Value proposition analysis in progress',
        tagline: 'Analyzing brand messaging...',
        heroText: 'Website content being processed',
        keyMessages: [
          'Key message extraction in progress',
          'Please refresh in a moment'
        ]
      },
      contentEmphasis: {
        mainThemes: ['Analysis in progress'],
        featureVsBenefitRatio: 50,
        emotionalVsRational: 50
      },
      clarity: {
        score: 50,
        issues: ['Analysis in progress'],
        suggestions: ['Detailed analysis will be available shortly']
      },
      jargon: {
        density: 50,
        examples: ['Analysis in progress'],
        plainAlternatives: {}
      },
      insights: [
        {
          type: 'gap',
          title: 'Analysis in Progress',
          description: 'Brand perception analysis is being generated. Please refresh in a moment.',
          impact: 'medium',
          actionable: 'Wait for analysis to complete'
        }
      ],
      recommendations: [
        {
          priority: 'medium',
          action: 'Complete brand perception analysis',
          reasoning: 'Analysis is currently processing',
          estimatedImpact: 'Full insights will be available shortly'
        }
      ]
    }
  }
}
