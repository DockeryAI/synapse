/**
 * Transformation Language Analyzer Service
 *
 * Analyzes real customer quotes (reviews, testimonials, case studies) to:
 * - Identify before/after transformation language
 * - Extract emotional vs functional drivers
 * - Calculate EQ scores based on actual customer language
 * - Generate transformation goal suggestions ONLY from quote evidence
 *
 * CRITICAL: Never fabricate transformation goals without customer quote evidence
 *
 * Created: 2025-11-18
 */

import type {
  TransformationExtractionResult,
  TransformationGoal,
  CustomerQuote,
  ConfidenceScore,
  DataSource
} from '@/types/uvp-flow.types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Customer quote input with source metadata
 */
export interface CustomerQuoteInput {
  text: string
  source: string // 'google_review' | 'testimonial' | 'case_study' | 'youtube_comment' | etc
  sourceUrl?: string
  rating?: number // If from review platform
  date?: string
}

/**
 * Raw Claude analysis output (intermediate format)
 */
interface RawTransformationAnalysis {
  transformation_goals: {
    statement: string
    before_state: string // What customer's life/business was like before
    after_state: string // What it's like after
    emotional_drivers: string[]
    functional_drivers: string[]
    supporting_quotes: {
      quote: string
      emotional_weight: number // 0-100
      relevance: number // 0-100
    }[]
    eq_breakdown: {
      emotional_score: number // 0-100
      rational_score: number // 0-100
      primary_driver: 'fear' | 'aspiration' | 'urgency' | 'logic' | 'trust'
    }
  }[]

  analyzed_quotes: {
    text: string
    emotional_weight: number // 0-100 (how emotional vs rational)
    transformation_indicators: string[] // Words/phrases indicating transformation
    before_after_detected: boolean
    emotional_language: string[] // Specific emotional words found
    functional_language: string[] // Specific functional/rational words
  }[]

  overall_eq: {
    emotional: number // 0-100
    rational: number // 0-100
    overall: number // 0-100
    dominant_emotions: string[] // fear, hope, relief, confidence, etc
    dominant_functionals: string[] // save time, reduce cost, increase revenue, etc
  }

  confidence_assessment: {
    score: number // 0-100
    reasoning: string
    quote_quality: 'excellent' | 'good' | 'fair' | 'poor'
    sample_size_adequate: boolean
  }
}

/**
 * Main transformation analyzer service
 */
class TransformationAnalyzerService {
  /**
   * Analyze customer quotes for transformation language
   * Main entry point
   */
  async analyzeTransformationLanguage(
    customerQuotes: CustomerQuoteInput[],
    businessName: string
  ): Promise<TransformationExtractionResult> {
    // Guard: Return empty result if no quotes
    if (!customerQuotes || customerQuotes.length === 0) {
      console.warn('[TransformationAnalyzer] No customer quotes provided - returning empty result')
      return this.createEmptyResult()
    }

    // Guard: Check Supabase config
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('[TransformationAnalyzer] No Supabase configuration - returning empty result')
      return this.createEmptyResult()
    }

    try {
      console.log(`[TransformationAnalyzer] Analyzing ${customerQuotes.length} quotes for ${businessName}`)

      // Call Claude to analyze transformation language
      const rawAnalysis = await this.analyzeWithClaude(customerQuotes, businessName)

      // Transform raw analysis into typed result
      const result = this.transformAnalysisToResult(rawAnalysis, customerQuotes, businessName)

      console.log('[TransformationAnalyzer] Analysis complete:')
      console.log(`  - Transformation goals identified: ${result.goals.length}`)
      console.log(`  - Emotional drivers: ${result.emotionalDrivers.length}`)
      console.log(`  - Functional drivers: ${result.functionalDrivers.length}`)
      console.log(`  - Overall EQ: ${result.goals[0]?.eqScore?.overall || 0}%`)

      return result

    } catch (error) {
      console.error('[TransformationAnalyzer] Analysis failed:', error)
      return this.createEmptyResult()
    }
  }

  /**
   * Analyze quotes with Claude AI
   */
  private async analyzeWithClaude(
    quotes: CustomerQuoteInput[],
    businessName: string
  ): Promise<RawTransformationAnalysis> {
    const quotesText = quotes.map((q, i) =>
      `[${i + 1}] ${q.text}\n   Source: ${q.source}${q.rating ? ` (${q.rating} stars)` : ''}`
    ).join('\n\n')

    const prompt = `You are an expert in Jobs-to-be-Done theory and customer psychology, analyzing REAL customer quotes to identify transformation language.

BUSINESS: ${businessName}

YOUR TASK:
Analyze these ${quotes.length} customer quotes to identify:
1. What transformation customers are REALLY buying (before → after state)
2. Emotional vs functional drivers behind the transformation
3. Jobs-to-be-Done language patterns
4. Emotional Quotient (EQ) of the messaging

CUSTOMER QUOTES:
${quotesText}

CRITICAL RULES:
- ONLY use actual customer language from the quotes provided
- NEVER invent transformation goals without quote evidence
- If quotes don't contain transformation language, say so
- Look for before/after language: "used to struggle with... now I..." or "went from... to..."
- Identify emotional words: frustrated, worried, confident, relieved, peace of mind, stress, anxiety, etc
- Identify functional words: save time, reduce cost, increase revenue, improve efficiency, automate, etc

ANALYSIS FRAMEWORK:

1. TRANSFORMATION DETECTION:
   Look for language patterns indicating change:
   - Before/After: "used to X, now Y" | "went from X to Y" | "was struggling with X, achieved Y"
   - Problem → Solution: "had problem X, they solved it with Y"
   - Results: "saved 20 hours/week" | "increased revenue 30%" | "no longer stressed"

2. EMOTIONAL vs FUNCTIONAL DRIVERS:

   EMOTIONAL INDICATORS:
   - Fear: worried, anxious, afraid, stressed, concerned, overwhelmed, frustrated, desperate
   - Aspiration: dream, want, hope, wish, desire, finally, achieve, become
   - Relief: peace of mind, no longer, don't have to, freed from, finally, relieved
   - Confidence: trust, believe, confident, sure, certain, know
   - Social: impress, reputation, status, image, what others think

   FUNCTIONAL INDICATORS:
   - Time: save time, faster, quicker, automate, streamline, efficient
   - Money: save money, reduce cost, ROI, cheaper, affordable, profitable, revenue
   - Quality: better results, improved, higher quality, more accurate, reliable
   - Scale: grow, expand, handle more, increase capacity
   - Ease: simple, easy, straightforward, user-friendly, no hassle

3. JOBS-TO-BE-DONE EXTRACTION:
   What "job" are customers really hiring this business to do?
   - Functional job: The practical task (e.g., "file my taxes accurately")
   - Emotional job: How they want to feel (e.g., "feel confident I won't get audited")
   - Social job: How they want to be perceived (e.g., "be seen as financially responsible")

4. EMOTIONAL QUOTIENT (EQ) SCORING:
   For EACH quote, score 0-100:
   - Emotional weight: How emotional vs rational is the language?
   - 0-20 = Purely rational (metrics, features, specs only)
   - 21-40 = Mostly rational with some emotional hints
   - 41-60 = Balanced emotional and rational
   - 61-80 = Mostly emotional with some rational
   - 81-100 = Purely emotional (feelings, relief, transformation)

   Overall EQ:
   - Emotional score: % of emotional language across all quotes
   - Rational score: % of functional/logical language
   - Overall: Weighted average based on quote relevance

5. TRANSFORMATION GOAL FORMULATION:
   Create transformation goal statements ONLY if you find supporting quotes:
   - Statement: "From [before state] to [after state]"
   - Must be grounded in actual customer language
   - Include specific emotional AND functional drivers found
   - Cite exact quotes as evidence

RETURN VALID JSON (no markdown, no code blocks):
{
  "transformation_goals": [
    {
      "statement": "Help overwhelmed small business owners go from drowning in manual tasks to confidently running automated operations",
      "before_state": "Overwhelmed by manual processes, working 70+ hour weeks, stressed about making mistakes",
      "after_state": "Confident in automated systems, reclaimed 20+ hours per week, peace of mind",
      "emotional_drivers": [
        "Fear of business failure due to being overwhelmed",
        "Desire for work-life balance and personal freedom",
        "Relief from constant stress and anxiety"
      ],
      "functional_drivers": [
        "Need to automate repetitive manual tasks",
        "Goal to save 20+ hours per week",
        "Requirement to reduce human error"
      ],
      "supporting_quotes": [
        {
          "quote": "I was drowning in manual processes before. Now I have my life back and actually sleep at night.",
          "emotional_weight": 85,
          "relevance": 95
        }
      ],
      "eq_breakdown": {
        "emotional_score": 70,
        "rational_score": 30,
        "primary_driver": "aspiration"
      }
    }
  ],

  "analyzed_quotes": [
    {
      "text": "I was drowning in manual processes before. Now I have my life back and actually sleep at night.",
      "emotional_weight": 85,
      "transformation_indicators": ["drowning", "before", "now", "have my life back", "actually sleep"],
      "before_after_detected": true,
      "emotional_language": ["drowning", "life back", "sleep at night"],
      "functional_language": ["manual processes"]
    }
  ],

  "overall_eq": {
    "emotional": 65,
    "rational": 35,
    "overall": 65,
    "dominant_emotions": ["relief", "peace of mind", "confidence"],
    "dominant_functionals": ["save time", "reduce cost", "automate"]
  },

  "confidence_assessment": {
    "score": 85,
    "reasoning": "Strong before/after language in 8 out of 12 quotes. Clear emotional transformation patterns. Multiple quotes mention specific outcomes.",
    "quote_quality": "excellent",
    "sample_size_adequate": true
  }
}

IMPORTANT:
- If quotes lack transformation language, return EMPTY transformation_goals array
- Don't force transformation goals if the evidence isn't there
- Sample size of 5+ quotes is adequate, 10+ is excellent, <3 is poor
- Be honest about confidence - low evidence = low confidence score`

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: 'openrouter',
          model: 'anthropic/claude-3.5-sonnet',
          messages: [{
            role: 'user',
            content: prompt
          }],
          max_tokens: 8192,
          temperature: 0.3 // Lower temperature for more accurate extraction
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[TransformationAnalyzer] Claude API error:', response.status, errorText)
        throw new Error(`Claude API error: ${response.status}`)
      }

      const data = await response.json()
      const analysisText = data.choices[0].message.content

      console.log('[TransformationAnalyzer] Raw Claude response length:', analysisText.length)

      // Parse JSON response
      const analysis: RawTransformationAnalysis = JSON.parse(analysisText)

      // Validate we didn't hallucinate goals
      if (analysis.transformation_goals.length > 0) {
        analysis.transformation_goals = analysis.transformation_goals.filter(goal =>
          goal.supporting_quotes && goal.supporting_quotes.length > 0
        )
      }

      return analysis

    } catch (error) {
      console.error('[TransformationAnalyzer] Claude analysis failed:', error)
      throw error
    }
  }

  /**
   * Transform raw Claude analysis into TransformationExtractionResult
   */
  private transformAnalysisToResult(
    raw: RawTransformationAnalysis,
    originalQuotes: CustomerQuoteInput[],
    businessName: string
  ): TransformationExtractionResult {
    // Transform goals
    const goals: Partial<TransformationGoal>[] = raw.transformation_goals.map((goal, idx) => ({
      id: `transformation-${Date.now()}-${idx}`,
      statement: goal.statement,
      emotionalDrivers: goal.emotional_drivers,
      functionalDrivers: goal.functional_drivers,
      eqScore: {
        emotional: goal.eq_breakdown.emotional_score,
        rational: goal.eq_breakdown.rational_score,
        overall: Math.round((goal.eq_breakdown.emotional_score + goal.eq_breakdown.rational_score) / 2)
      },
      customerQuotes: goal.supporting_quotes.map((sq, qIdx) => ({
        id: `quote-${idx}-${qIdx}`,
        text: sq.quote,
        source: this.findQuoteSource(sq.quote, originalQuotes),
        emotionalWeight: sq.emotional_weight,
        relevanceScore: sq.relevance
      })),
      confidence: this.calculateConfidenceScore(
        goal.supporting_quotes.length,
        goal.eq_breakdown.emotional_score + goal.eq_breakdown.rational_score,
        raw.confidence_assessment.score
      ),
      sources: this.buildDataSources(originalQuotes),
      isManualInput: false
    }))

    // Transform customer quotes
    const customerQuotes: CustomerQuote[] = raw.analyzed_quotes.map((aq, idx) => ({
      id: `analyzed-quote-${idx}`,
      text: aq.text,
      source: this.findQuoteSource(aq.text, originalQuotes),
      emotionalWeight: aq.emotional_weight,
      relevanceScore: aq.before_after_detected ? 90 : 60
    }))

    // Extract all emotional drivers
    const emotionalDrivers = Array.from(new Set(
      raw.transformation_goals.flatMap(g => g.emotional_drivers)
    ))

    // Extract all functional drivers
    const functionalDrivers = Array.from(new Set(
      raw.transformation_goals.flatMap(g => g.functional_drivers)
    ))

    // Build confidence score
    const confidence = this.calculateOverallConfidence(
      raw.confidence_assessment.score,
      originalQuotes.length,
      raw.transformation_goals.length
    )

    return {
      goals,
      customerQuotes,
      emotionalDrivers,
      functionalDrivers,
      confidence,
      sources: this.buildDataSources(originalQuotes)
    }
  }

  /**
   * Find the original source for a quote
   */
  private findQuoteSource(quoteText: string, originalQuotes: CustomerQuoteInput[]): DataSource {
    const found = originalQuotes.find(q =>
      q.text.includes(quoteText.substring(0, 50)) ||
      quoteText.includes(q.text.substring(0, 50))
    )

    if (found) {
      return {
        id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: this.mapSourceType(found.source),
        name: found.source,
        url: found.sourceUrl,
        extractedAt: new Date(),
        reliability: 85,
        dataPoints: 1
      }
    }

    return {
      id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'website',
      name: 'Website Content',
      extractedAt: new Date(),
      reliability: 70,
      dataPoints: 1
    }
  }

  /**
   * Map source string to DataSource type
   */
  private mapSourceType(source: string): DataSource['type'] {
    const lower = source.toLowerCase()
    if (lower.includes('review')) return 'reviews'
    if (lower.includes('testimonial')) return 'testimonials'
    if (lower.includes('case')) return 'website'
    if (lower.includes('youtube')) return 'youtube'
    if (lower.includes('social')) return 'social'
    return 'website'
  }

  /**
   * Build data sources from quote inputs
   */
  private buildDataSources(quotes: CustomerQuoteInput[]): DataSource[] {
    const uniqueSources = new Map<string, DataSource>()

    quotes.forEach(q => {
      const key = `${q.source}-${q.sourceUrl || 'unknown'}`
      if (!uniqueSources.has(key)) {
        uniqueSources.set(key, {
          id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: this.mapSourceType(q.source),
          name: q.source,
          url: q.sourceUrl,
          extractedAt: new Date(),
          reliability: 85,
          dataPoints: 1
        })
      }
    })

    return Array.from(uniqueSources.values())
  }

  /**
   * Calculate confidence score for individual transformation goal
   */
  private calculateConfidenceScore(
    quoteCount: number,
    eqTotal: number,
    claudeConfidence: number
  ): ConfidenceScore {
    // More quotes = higher confidence
    const quoteScore = Math.min(quoteCount * 20, 40) // Max 40 points from quotes

    // Balanced EQ (not too lopsided) = higher confidence
    const eqScore = Math.min(eqTotal / 3, 30) // Max 30 points from EQ

    // Claude's assessment
    const claudeScore = (claudeConfidence / 100) * 30 // Max 30 points from Claude

    const score = Math.round(quoteScore + eqScore + claudeScore)

    return {
      overall: score,
      dataQuality: Math.min(eqTotal, 100),
      sourceCount: quoteCount,
      modelAgreement: claudeConfidence,
      reasoning: `Based on ${quoteCount} supporting quotes with ${Math.round(eqTotal / 2)}% average EQ`
    }
  }

  /**
   * Calculate overall extraction confidence
   */
  private calculateOverallConfidence(
    claudeScore: number,
    quoteCount: number,
    goalCount: number
  ): ConfidenceScore {
    let score = claudeScore

    // Penalize if too few quotes
    if (quoteCount < 5) {
      score = Math.max(score - 20, 0)
    }

    // Penalize if no goals found (might be low quality quotes)
    if (goalCount === 0) {
      score = Math.max(score - 30, 0)
    }

    // Boost if lots of high-quality data
    if (quoteCount >= 10 && goalCount >= 2) {
      score = Math.min(score + 10, 100)
    }

    return {
      overall: Math.round(score),
      dataQuality: quoteCount >= 10 ? 90 : quoteCount >= 5 ? 70 : 50,
      sourceCount: quoteCount,
      modelAgreement: claudeScore,
      reasoning: `Analysis of ${quoteCount} customer quotes identifying ${goalCount} transformation patterns`
    }
  }

  /**
   * Create empty result when no quotes available or analysis fails
   */
  private createEmptyResult(): TransformationExtractionResult {
    return {
      goals: [],
      customerQuotes: [],
      emotionalDrivers: [],
      functionalDrivers: [],
      confidence: {
        overall: 0,
        dataQuality: 0,
        sourceCount: 0,
        modelAgreement: 0,
        reasoning: 'No customer quotes available for analysis'
      },
      sources: []
    }
  }
}

// Export singleton instance
export const transformationAnalyzer = new TransformationAnalyzerService()

// Export main function for easy import
export async function analyzeTransformationLanguage(
  customerQuotes: Array<{ text: string; source: string }>,
  businessName: string
): Promise<TransformationExtractionResult> {
  return transformationAnalyzer.analyzeTransformationLanguage(customerQuotes, businessName)
}

// Export service class for testing/advanced use
export { TransformationAnalyzerService }
