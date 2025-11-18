/**
 * Buyer Intelligence Extractor Service
 * Analyzes website content to extract WHO buys and WHY
 * Uses Claude AI to identify buyer personas from testimonials, case studies, and customer language
 */

import type {
  BuyerPersona,
  BuyerIntelligenceResult,
  PainPoint,
  DesiredOutcome,
  UrgencySignal,
  BuyerRole,
  IndustryContext,
  BuyingBehavior,
  SuccessMetrics,
  EvidenceSource,
  CompanyType,
  CompanySize
} from '@/types/buyer-persona.types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Website data input (same structure as Track A website analyzer)
 */
export interface WebsiteData {
  url: string
  content: string              // Full website text content
  testimonials?: string[]      // Pre-extracted testimonials (if available)
  case_studies?: string[]      // Pre-extracted case studies
  about_page?: string          // About page content
  services?: string[]          // Service descriptions
}

/**
 * Raw extraction from Claude (intermediate format)
 */
interface RawPersonaExtraction {
  personas: {
    persona_name: string
    role_title: string
    role_seniority: string
    company_type: string
    company_size: string
    industry: string
    sub_industry?: string
    pain_points: {
      description: string
      category: string
      intensity: string
      quote: string
    }[]
    desired_outcomes: {
      description: string
      metric?: string
      emotional_benefit?: string
      quote: string
    }[]
    urgency_signals: {
      trigger: string
      signal_type: string
      severity: string
      quote: string
    }[]
    buying_behavior: {
      decision_speed: string
      research_intensity: string
      price_sensitivity: string
      relationship_vs_transactional: string
    }
    success_metrics: {
      metric: string
      baseline?: string
      achieved?: string
      improvement?: string
      category: string
    }[]
    sample_quotes: string[]
  }[]
  common_pain_points: string[]
  common_outcomes: string[]
  industry_patterns: string[]
  data_quality: string
}

class BuyerIntelligenceExtractorService {
  /**
   * Extract buyer personas from website content
   * Main entry point for the service
   */
  async extractBuyerPersonas(websiteData: WebsiteData): Promise<BuyerIntelligenceResult> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('[BuyerIntelligence] No Supabase configuration - returning empty result')
      return this.createEmptyResult()
    }

    try {
      console.log('[BuyerIntelligence] Starting persona extraction for:', websiteData.url)

      // Prepare content for analysis
      const analysisContent = this.prepareContentForAnalysis(websiteData)

      // Call Claude AI to extract personas
      const rawExtraction = await this.analyzeWithClaude(analysisContent, websiteData.url)

      // Transform raw extraction into typed personas
      const personas = this.transformRawPersonas(rawExtraction, websiteData.url)

      // Build final result
      const result: BuyerIntelligenceResult = {
        personas,
        total_evidence_points: this.countEvidencePoints(personas),
        extraction_quality: this.assessQuality(personas, rawExtraction.data_quality),
        extraction_timestamp: new Date().toISOString(),
        common_pain_points: this.extractCommonPainPoints(personas),
        common_outcomes: this.extractCommonOutcomes(personas),
        industry_patterns: rawExtraction.industry_patterns || [],
        data_gaps: this.identifyDataGaps(websiteData, personas),
        assumptions_made: this.identifyAssumptions(personas)
      }

      console.log('[BuyerIntelligence] Extraction complete:')
      console.log(`  - Personas identified: ${personas.length}`)
      console.log(`  - Evidence points: ${result.total_evidence_points}`)
      console.log(`  - Quality: ${result.extraction_quality}`)

      return result

    } catch (error) {
      console.error('[BuyerIntelligence] Extraction failed:', error)
      return this.createEmptyResult()
    }
  }

  /**
   * Prepare website content for Claude analysis
   */
  private prepareContentForAnalysis(data: WebsiteData): string {
    const sections: string[] = []

    // Main content
    if (data.content) {
      sections.push(`=== WEBSITE CONTENT ===\n${data.content.slice(0, 15000)}`)
    }

    // Testimonials (high value for persona extraction)
    if (data.testimonials && data.testimonials.length > 0) {
      sections.push(`\n=== TESTIMONIALS ===\n${data.testimonials.join('\n\n')}`)
    }

    // Case studies (high value)
    if (data.case_studies && data.case_studies.length > 0) {
      sections.push(`\n=== CASE STUDIES ===\n${data.case_studies.join('\n\n')}`)
    }

    // About page
    if (data.about_page) {
      sections.push(`\n=== ABOUT PAGE ===\n${data.about_page.slice(0, 3000)}`)
    }

    // Services
    if (data.services && data.services.length > 0) {
      sections.push(`\n=== SERVICES ===\n${data.services.join('\n')}`)
    }

    return sections.join('\n\n')
  }

  /**
   * Analyze content with Claude AI to extract buyer personas
   */
  private async analyzeWithClaude(content: string, url: string): Promise<RawPersonaExtraction> {
    const prompt = `You are an expert market researcher analyzing website content to identify REAL buyer personas.

Your task: Extract WHO is buying and WHY from this website content.

CRITICAL INSTRUCTIONS:
- Look for EVIDENCE in testimonials, case studies, customer quotes, and case examples
- Identify 5-7 DISTINCT buyer personas (not generic templates)
- Use ACTUAL customer language - extract exact phrases they use
- Focus on PATTERNS - if multiple customers say similar things, that's a persona
- Identify job roles, company types, pain points, and desired outcomes
- Look for URGENCY SIGNALS - what drives them to buy NOW vs later

WEBSITE: ${url}
CONTENT:
${content}

ANALYSIS FRAMEWORK:

1. TESTIMONIAL/CASE STUDY MINING:
   - What job titles/roles appear? (CEO, Marketing Director, homeowner, etc.)
   - What company types? (startup, enterprise, nonprofit, individual, etc.)
   - What company sizes? (solo, small team, 50+ employees, etc.)
   - What industries? (healthcare, tech, retail, home services, etc.)

2. PAIN POINT EXTRACTION:
   Look for language patterns:
   - "struggling with...", "tired of...", "frustrated by..."
   - "wasting time on...", "losing money to..."
   - "worried about...", "afraid of...", "concerned that..."
   - "need to...", "have to...", "must..."

   Classify pain points by category:
   - time (too slow, takes too long)
   - cost (too expensive, budget concerns)
   - complexity (too complicated, confusing)
   - quality (unreliable, poor results)
   - trust (worried about scams, skeptical)
   - expertise (don't know how, need help)
   - scale (can't grow, hit a ceiling)
   - risk (too risky, afraid of failure)

3. DESIRED OUTCOMES:
   - What results do they mention achieving?
   - What metrics improved? (saved 20 hours/week, increased revenue 30%, etc.)
   - What emotional benefits? ("feel confident", "peace of mind", "stress-free")

4. URGENCY SIGNALS:
   What triggers immediate action?
   - Deadlines (tax season, compliance, project deadline)
   - Crisis (emergency, breakdown, failure)
   - Opportunity (growth, new market, competitive advantage)
   - Compliance (regulations, requirements, mandates)

5. BUYING BEHAVIOR:
   - Decision speed (impulse, fast, slow, very slow)
   - Research intensity (minimal, moderate, heavy)
   - Price sensitivity (low, medium, high)
   - Relationship vs transactional

6. SUCCESS METRICS:
   What do they measure?
   - Revenue growth, cost savings, time saved
   - Quality improvements, customer satisfaction
   - Risk reduction, compliance achievement

GROUP SIMILAR BUYERS:
If you see 3-5 testimonials from "marketing directors at tech startups worried about scaling",
that's ONE persona. Don't create separate personas for each testimonial.

Return ONLY valid JSON (no markdown, no explanations):
{
  "personas": [
    {
      "persona_name": "Time-Starved Marketing Directors",
      "role_title": "Marketing Director",
      "role_seniority": "director",
      "company_type": "startup",
      "company_size": "small",
      "industry": "Technology",
      "sub_industry": "SaaS",
      "pain_points": [
        {
          "description": "Wasting 15+ hours per week on manual reporting",
          "category": "time",
          "intensity": "high",
          "quote": "I was spending 3 hours every day just pulling data from different tools"
        }
      ],
      "desired_outcomes": [
        {
          "description": "Automate reporting to save time for strategy",
          "metric": "Save 15 hours per week",
          "emotional_benefit": "Feel like a strategic leader instead of data monkey",
          "quote": "Now I actually have time to think strategically instead of drowning in spreadsheets"
        }
      ],
      "urgency_signals": [
        {
          "trigger": "Rapid company growth creating data chaos",
          "signal_type": "growth",
          "severity": "high",
          "quote": "We doubled in size and our manual processes completely broke"
        }
      ],
      "buying_behavior": {
        "decision_speed": "moderate",
        "research_intensity": "heavy",
        "price_sensitivity": "medium",
        "relationship_vs_transactional": "relationship"
      },
      "success_metrics": [
        {
          "metric": "Time spent on reporting",
          "baseline": "15 hours/week",
          "achieved": "2 hours/week",
          "improvement": "87% reduction",
          "category": "time"
        }
      ],
      "sample_quotes": [
        "I was drowning in data before finding them",
        "Cut my reporting time from 15 hours to 2 hours per week",
        "Finally have time to be strategic instead of just tactical"
      ]
    }
  ],
  "common_pain_points": [
    "Time wasted on manual processes",
    "Difficulty scaling operations",
    "Lack of strategic time due to tactical firefighting"
  ],
  "common_outcomes": [
    "Significant time savings (10-20 hours/week common)",
    "Better strategic decision making",
    "Reduced stress and increased confidence"
  ],
  "industry_patterns": [
    "Tech/SaaS companies focus heavily on automation and efficiency",
    "Marketing roles are time-starved and need to prove ROI",
    "Growing companies hit scaling pain points between 10-50 employees"
  ],
  "data_quality": "excellent | good | fair | poor"
}`

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
          temperature: 0.3
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[BuyerIntelligence] Claude API error:', response.status, errorText)
        throw new Error(`Claude API error: ${response.status}`)
      }

      const data = await response.json()
      const analysisText = data.choices[0].message.content

      console.log('[BuyerIntelligence] Raw Claude response:', analysisText.substring(0, 500) + '...')

      // Parse JSON response
      const extraction: RawPersonaExtraction = JSON.parse(analysisText)
      return extraction

    } catch (error) {
      console.error('[BuyerIntelligence] Claude analysis failed:', error)
      throw error
    }
  }

  /**
   * Transform raw Claude extraction into typed BuyerPersona objects
   */
  private transformRawPersonas(raw: RawPersonaExtraction, sourceUrl: string): BuyerPersona[] {
    return raw.personas.map((rawPersona, index) => {
      const personaId = `persona-${Date.now()}-${index}`

      // Transform role
      const role: BuyerRole = {
        title: rawPersona.role_title,
        seniority: this.normalizeSeniority(rawPersona.role_seniority),
        department: this.extractDepartment(rawPersona.role_title),
        is_decision_maker: this.isDecisionMaker(rawPersona.role_seniority),
        influence_level: this.determineInfluenceLevel(rawPersona.role_seniority)
      }

      // Transform industry
      const industry: IndustryContext = {
        primary_industry: rawPersona.industry,
        sub_industry: rawPersona.sub_industry,
        industry_keywords: this.extractIndustryKeywords(rawPersona.industry, rawPersona.sub_industry),
        vertical_specificity: rawPersona.sub_industry ? 75 : 40
      }

      // Transform pain points
      const pain_points: PainPoint[] = rawPersona.pain_points.map(pp => ({
        description: pp.description,
        category: pp.category as any, // Type assertion - Claude should return valid categories
        intensity: pp.intensity as any,
        frequency: 50, // Default - would need more data to calculate actual frequency
        evidence: [pp.quote]
      }))

      // Transform desired outcomes
      const desired_outcomes: DesiredOutcome[] = rawPersona.desired_outcomes.map(outcome => ({
        description: outcome.description,
        metric: outcome.metric,
        emotional_benefit: outcome.emotional_benefit,
        evidence: [outcome.quote]
      }))

      // Transform urgency signals
      const urgency_signals: UrgencySignal[] = rawPersona.urgency_signals.map(signal => ({
        trigger: signal.trigger,
        signal_type: signal.signal_type as any,
        severity: signal.severity as any,
        evidence: [signal.quote]
      }))

      // Transform buying behavior
      const buying_behavior: BuyingBehavior = {
        decision_speed: rawPersona.buying_behavior.decision_speed as any,
        research_intensity: rawPersona.buying_behavior.research_intensity as any,
        price_sensitivity: rawPersona.buying_behavior.price_sensitivity as any,
        relationship_vs_transactional: rawPersona.buying_behavior.relationship_vs_transactional as any,
        evidence: rawPersona.sample_quotes
      }

      // Transform success metrics
      const success_metrics: SuccessMetrics[] = rawPersona.success_metrics.map(metric => ({
        metric: metric.metric,
        baseline: metric.baseline,
        achieved: metric.achieved,
        improvement: metric.improvement,
        category: metric.category as any
      }))

      // Calculate confidence score based on evidence richness
      const confidence_score = this.calculateConfidenceScore({
        pain_points: pain_points.length,
        outcomes: desired_outcomes.length,
        urgency: urgency_signals.length,
        quotes: rawPersona.sample_quotes.length,
        metrics: success_metrics.length
      })

      // Build evidence sources
      const evidence_sources: EvidenceSource[] = [
        ...pain_points.map(pp => ({
          type: 'testimonial' as const,
          location: sourceUrl,
          snippet: pp.evidence[0],
          relevance_score: 85
        })),
        ...desired_outcomes.map(outcome => ({
          type: 'case-study' as const,
          location: sourceUrl,
          snippet: outcome.evidence[0],
          relevance_score: 90
        }))
      ]

      const persona: BuyerPersona = {
        id: personaId,
        persona_name: rawPersona.persona_name,
        role,
        company_type: this.normalizeCompanyType(rawPersona.company_type),
        company_size: this.normalizeCompanySize(rawPersona.company_size),
        industry,
        pain_points,
        desired_outcomes,
        urgency_signals,
        buying_behavior,
        success_metrics,
        confidence_score,
        sample_size: rawPersona.sample_quotes.length,
        evidence_sources,
        representative_quotes: rawPersona.sample_quotes.slice(0, 3)
      }

      return persona
    })
  }

  /**
   * Helper: Normalize seniority levels
   */
  private normalizeSeniority(seniority: string): BuyerRole['seniority'] {
    const normalized = seniority.toLowerCase()
    if (['ceo', 'cto', 'cfo', 'cmo', 'president', 'vp', 'executive'].some(term => normalized.includes(term))) {
      return 'executive'
    }
    if (normalized.includes('director') || normalized.includes('head')) {
      return 'director'
    }
    if (normalized.includes('manager') || normalized.includes('lead')) {
      return 'manager'
    }
    if (normalized.includes('owner') || normalized.includes('founder')) {
      return 'owner'
    }
    return 'individual-contributor'
  }

  /**
   * Helper: Extract department from role title
   */
  private extractDepartment(title: string): string | undefined {
    const lower = title.toLowerCase()
    if (lower.includes('marketing')) return 'Marketing'
    if (lower.includes('sales')) return 'Sales'
    if (lower.includes('engineering') || lower.includes('tech')) return 'Engineering'
    if (lower.includes('finance')) return 'Finance'
    if (lower.includes('operations') || lower.includes('ops')) return 'Operations'
    if (lower.includes('hr') || lower.includes('people')) return 'Human Resources'
    if (lower.includes('product')) return 'Product'
    return undefined
  }

  /**
   * Helper: Determine if role is a decision maker
   */
  private isDecisionMaker(seniority: string): boolean {
    const lower = seniority.toLowerCase()
    return ['executive', 'director', 'owner'].some(level => lower.includes(level))
  }

  /**
   * Helper: Determine influence level
   */
  private determineInfluenceLevel(seniority: string): 'high' | 'medium' | 'low' {
    const normalized = this.normalizeSeniority(seniority)
    if (normalized === 'executive' || normalized === 'owner') return 'high'
    if (normalized === 'director' || normalized === 'manager') return 'medium'
    return 'low'
  }

  /**
   * Helper: Extract industry keywords
   */
  private extractIndustryKeywords(primary: string, sub?: string): string[] {
    const keywords = [primary.toLowerCase()]
    if (sub) {
      keywords.push(sub.toLowerCase())
    }
    return keywords
  }

  /**
   * Helper: Normalize company type
   */
  private normalizeCompanyType(type: string): CompanyType {
    const lower = type.toLowerCase()
    if (lower.includes('startup')) return 'startup'
    if (lower.includes('enterprise') || lower.includes('large corp')) return 'enterprise'
    if (lower.includes('nonprofit') || lower.includes('non-profit')) return 'nonprofit'
    if (lower.includes('government') || lower.includes('public sector')) return 'government'
    if (lower.includes('individual') || lower.includes('consumer') || lower.includes('b2c')) return 'individual'
    return 'established-business'
  }

  /**
   * Helper: Normalize company size
   */
  private normalizeCompanySize(size: string): CompanySize {
    const lower = size.toLowerCase()
    if (lower.includes('solo') || lower.includes('freelance') || lower.includes('1 person')) return 'solopreneur'
    if (lower.includes('micro') || lower.includes('2-9')) return 'micro'
    if (lower.includes('small') || lower.includes('10-49')) return 'small'
    if (lower.includes('medium') || lower.includes('50-249') || lower.includes('mid-size')) return 'medium'
    if (lower.includes('large') || lower.includes('250-999')) return 'large'
    if (lower.includes('enterprise') || lower.includes('1000+')) return 'enterprise'
    return 'unknown'
  }

  /**
   * Helper: Calculate confidence score
   */
  private calculateConfidenceScore(evidence: {
    pain_points: number
    outcomes: number
    urgency: number
    quotes: number
    metrics: number
  }): number {
    const weights = {
      pain_points: 20,
      outcomes: 20,
      urgency: 15,
      quotes: 25,
      metrics: 20
    }

    let score = 0
    score += Math.min(evidence.pain_points * 7, weights.pain_points)
    score += Math.min(evidence.outcomes * 7, weights.outcomes)
    score += Math.min(evidence.urgency * 5, weights.urgency)
    score += Math.min(evidence.quotes * 8, weights.quotes)
    score += Math.min(evidence.metrics * 10, weights.metrics)

    return Math.min(score, 100)
  }

  /**
   * Helper: Count total evidence points
   */
  private countEvidencePoints(personas: BuyerPersona[]): number {
    return personas.reduce((total, persona) => {
      return total +
        persona.pain_points.length +
        persona.desired_outcomes.length +
        persona.urgency_signals.length +
        persona.success_metrics.length +
        persona.representative_quotes.length
    }, 0)
  }

  /**
   * Helper: Assess extraction quality
   */
  private assessQuality(
    personas: BuyerPersona[],
    claudeQuality: string
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    // Start with Claude's assessment
    if (claudeQuality === 'poor' || personas.length < 3) return 'poor'
    if (claudeQuality === 'fair' || personas.length < 5) return 'fair'

    // Check average confidence score
    const avgConfidence = personas.reduce((sum, p) => sum + p.confidence_score, 0) / personas.length
    if (avgConfidence >= 80) return 'excellent'
    if (avgConfidence >= 60) return 'good'
    if (avgConfidence >= 40) return 'fair'
    return 'poor'
  }

  /**
   * Helper: Extract common pain points across personas
   */
  private extractCommonPainPoints(personas: BuyerPersona[]): PainPoint[] {
    const painMap = new Map<string, PainPoint>()

    personas.forEach(persona => {
      persona.pain_points.forEach(pain => {
        const key = `${pain.category}-${pain.description.substring(0, 30)}`
        if (!painMap.has(key)) {
          painMap.set(key, { ...pain, frequency: 1 })
        } else {
          const existing = painMap.get(key)!
          existing.frequency += 1
        }
      })
    })

    // Return pain points that appear in 2+ personas
    return Array.from(painMap.values())
      .filter(pain => pain.frequency >= 2)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)
  }

  /**
   * Helper: Extract common desired outcomes
   */
  private extractCommonOutcomes(personas: BuyerPersona[]): DesiredOutcome[] {
    const outcomeMap = new Map<string, DesiredOutcome & { count: number }>()

    personas.forEach(persona => {
      persona.desired_outcomes.forEach(outcome => {
        const key = outcome.description.substring(0, 50)
        if (!outcomeMap.has(key)) {
          outcomeMap.set(key, { ...outcome, count: 1 })
        } else {
          const existing = outcomeMap.get(key)!
          existing.count += 1
        }
      })
    })

    return Array.from(outcomeMap.values())
      .filter(outcome => outcome.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  /**
   * Helper: Identify data gaps
   */
  private identifyDataGaps(websiteData: WebsiteData, personas: BuyerPersona[]): string[] {
    const gaps: string[] = []

    if (!websiteData.testimonials || websiteData.testimonials.length === 0) {
      gaps.push('No testimonials found - persona confidence may be lower')
    }

    if (!websiteData.case_studies || websiteData.case_studies.length === 0) {
      gaps.push('No case studies found - success metrics may be incomplete')
    }

    if (personas.length < 5) {
      gaps.push('Fewer than 5 personas identified - may indicate limited customer diversity or sparse evidence')
    }

    const avgConfidence = personas.reduce((sum, p) => sum + p.confidence_score, 0) / personas.length
    if (avgConfidence < 60) {
      gaps.push('Low average confidence score - limited customer evidence on website')
    }

    return gaps
  }

  /**
   * Helper: Identify assumptions made
   */
  private identifyAssumptions(personas: BuyerPersona[]): string[] {
    const assumptions: string[] = []

    personas.forEach(persona => {
      if (persona.company_size === 'unknown') {
        assumptions.push(`Company size unknown for "${persona.persona_name}" - inferred from context`)
      }
      if (persona.buying_behavior.evidence.length < 2) {
        assumptions.push(`Limited buying behavior evidence for "${persona.persona_name}" - inferred from industry patterns`)
      }
    })

    return assumptions
  }

  /**
   * Helper: Create empty result (fallback)
   */
  private createEmptyResult(): BuyerIntelligenceResult {
    return {
      personas: [],
      total_evidence_points: 0,
      extraction_quality: 'poor',
      extraction_timestamp: new Date().toISOString(),
      common_pain_points: [],
      common_outcomes: [],
      industry_patterns: [],
      data_gaps: ['No Supabase configuration or analysis failed'],
      assumptions_made: []
    }
  }
}

// Export singleton instance
export const buyerIntelligenceExtractor = new BuyerIntelligenceExtractorService()
export { BuyerIntelligenceExtractorService }
