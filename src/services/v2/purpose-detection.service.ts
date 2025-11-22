/**
 * Purpose Detection and Categorization Service
 *
 * Detects content purpose from signals and maps to optimal campaign templates.
 * Supports 6 strategic purposes that drive campaign selection.
 *
 * @module purpose-detection.service
 */

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

/**
 * Strategic content purposes that guide campaign selection
 */
export type ContentPurpose =
  | 'market_gap'      // Exploiting gaps competitors miss
  | 'timing_play'     // Leveraging time-sensitive opportunities
  | 'contrarian'      // Challenging conventional wisdom
  | 'validation'      // Proving claims with social proof
  | 'transformation'  // Showing before/after journeys
  | 'authority'       // Establishing expertise and thought leadership

/**
 * Signals that indicate content purpose
 */
export interface PurposeSignals {
  // Market Gap signals
  competitorWeakness?: boolean
  unaddressedNeed?: boolean
  marketOpportunity?: boolean

  // Timing signals
  seasonalRelevance?: boolean
  trendingTopic?: boolean
  deadlinePresent?: boolean
  eventBased?: boolean

  // Contrarian signals
  challengesNorm?: boolean
  controversialTake?: boolean
  industryMyth?: boolean

  // Validation signals
  hasTestimonials?: boolean
  hasMetrics?: boolean
  thirdPartyEndorsement?: boolean
  caseStudyAvailable?: boolean

  // Transformation signals
  beforeAfterExample?: boolean
  customerJourney?: boolean
  outcomeProof?: boolean

  // Authority signals
  expertiseDemo?: boolean
  dataResearch?: boolean
  thoughtLeadership?: boolean
  industryPrediction?: boolean
}

/**
 * Campaign template mapping for purposes
 */
export interface PurposeTemplateMapping {
  primary: string[]     // Best-fit templates
  secondary: string[]   // Good alternatives
  contentTypes: string[] // Individual content templates
}

/**
 * Breakthrough categorization result
 */
export interface BreakthroughCategory {
  purpose: ContentPurpose
  confidence: number        // 0-1 confidence score
  signals: string[]         // Detected signals
  templateMapping: PurposeTemplateMapping
  reasoning: string
}

/**
 * Content alignment result
 */
export interface ContentAlignment {
  purpose: ContentPurpose
  recommendedCampaigns: CampaignRecommendation[]
  contentTemplates: string[]
  emotionalTriggers: string[]
  targetMetrics: TargetMetrics
}

/**
 * Campaign recommendation with rationale
 */
export interface CampaignRecommendation {
  templateId: string
  templateName: string
  fitScore: number        // 0-100
  rationale: string
  expectedROI: number
}

/**
 * Target metrics for the purpose
 */
export interface TargetMetrics {
  primaryKPI: string
  secondaryKPIs: string[]
  benchmarks: Record<string, number>
}

/**
 * Breakthrough data structure
 */
export interface Breakthrough {
  id: string
  title: string
  description: string
  dataPoints: DataPoint[]
  score: number
  signals: PurposeSignals
}

/**
 * Data point in a breakthrough
 */
export interface DataPoint {
  type: string
  content: string
  source: string
  relevance: number
}

// =============================================================================
// PURPOSE TO TEMPLATE MAPPINGS
// =============================================================================

/**
 * Complete mapping of purposes to campaign templates
 */
export const PURPOSE_TEMPLATE_MAP: Record<ContentPurpose, PurposeTemplateMapping> = {
  market_gap: {
    primary: ['pas-series', 'comparison-campaign', 'value-stack'],
    secondary: ['authority-builder', 'education-first'],
    contentTypes: ['hidden-cost-revealer', 'comparison-post', 'contrarian-take']
  },
  timing_play: {
    primary: ['seasonal-urgency', 'scarcity-sequence', 'product-launch'],
    secondary: ['quick-win', 'race-journey'],
    contentTypes: ['trend-jacker', 'deadline-driver', 'seasonal-angle']
  },
  contrarian: {
    primary: ['authority-builder', 'comparison-campaign', 'education-first'],
    secondary: ['pas-series', 'heros-journey'],
    contentTypes: ['contrarian-take', 'myth-buster', 'pattern-interrupt']
  },
  validation: {
    primary: ['social-proof', 'trust-ladder', 'objection-crusher'],
    secondary: ['bab-campaign', 'value-stack'],
    contentTypes: ['data-revelation', 'case-study', 'transformation-story']
  },
  transformation: {
    primary: ['bab-campaign', 'heros-journey', 'social-proof'],
    secondary: ['trust-ladder', 'value-stack'],
    contentTypes: ['transformation-story', 'before-after', 'quick-win']
  },
  authority: {
    primary: ['authority-builder', 'education-first', 'trust-ladder'],
    secondary: ['comparison-campaign', 'heros-journey'],
    contentTypes: ['data-revelation', 'expert-roundup', 'ultimate-guide']
  }
}

/**
 * Emotional triggers associated with each purpose
 */
export const PURPOSE_EMOTIONAL_TRIGGERS: Record<ContentPurpose, string[]> = {
  market_gap: ['curiosity', 'fear', 'empowerment'],
  timing_play: ['urgency', 'fear', 'excitement'],
  contrarian: ['surprise', 'curiosity', 'validation'],
  validation: ['trust', 'validation', 'relief'],
  transformation: ['hope', 'empowerment', 'pride'],
  authority: ['trust', 'curiosity', 'empowerment']
}

/**
 * Target metrics for each purpose
 */
export const PURPOSE_METRICS: Record<ContentPurpose, TargetMetrics> = {
  market_gap: {
    primaryKPI: 'conversion_rate',
    secondaryKPIs: ['lead_quality', 'win_rate'],
    benchmarks: { conversion_rate: 5.5, lead_quality: 75, win_rate: 35 }
  },
  timing_play: {
    primaryKPI: 'revenue',
    secondaryKPIs: ['conversion_rate', 'time_to_purchase'],
    benchmarks: { revenue_lift: 45, conversion_rate: 8.5, time_to_purchase: 2.5 }
  },
  contrarian: {
    primaryKPI: 'engagement_rate',
    secondaryKPIs: ['share_rate', 'follower_growth'],
    benchmarks: { engagement_rate: 6.5, share_rate: 3.2, follower_growth: 15 }
  },
  validation: {
    primaryKPI: 'trust_score',
    secondaryKPIs: ['conversion_rate', 'sales_cycle'],
    benchmarks: { trust_lift: 40, conversion_rate: 4.8, sales_cycle_reduction: 25 }
  },
  transformation: {
    primaryKPI: 'story_engagement',
    secondaryKPIs: ['email_signups', 'consultation_bookings'],
    benchmarks: { story_engagement: 55, email_signups: 12, consultation_rate: 8 }
  },
  authority: {
    primaryKPI: 'thought_leadership_score',
    secondaryKPIs: ['speaking_invites', 'media_mentions'],
    benchmarks: { content_saves: 18, speaking_invites: 3, media_mentions: 5 }
  }
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

/**
 * Purpose Detection Service
 *
 * Analyzes content signals to detect strategic purpose and
 * map to optimal campaign templates.
 */
export class PurposeDetectionService {

  /**
   * Detect the primary purpose from content signals
   */
  static detectPurpose(signals: PurposeSignals): {
    purpose: ContentPurpose
    confidence: number
    allScores: Record<ContentPurpose, number>
  } {
    const scores = this.calculatePurposeScores(signals)

    // Find highest scoring purpose
    let maxPurpose: ContentPurpose = 'market_gap'
    let maxScore = 0

    for (const [purpose, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score
        maxPurpose = purpose as ContentPurpose
      }
    }

    // Calculate confidence (normalize to 0-1)
    const totalSignals = Object.values(signals).filter(v => v === true).length
    const confidence = totalSignals > 0 ? Math.min(maxScore / (totalSignals * 2), 1) : 0

    return {
      purpose: maxPurpose,
      confidence: Math.round(confidence * 100) / 100,
      allScores: scores
    }
  }

  /**
   * Calculate purpose scores based on signals
   */
  private static calculatePurposeScores(signals: PurposeSignals): Record<ContentPurpose, number> {
    const scores: Record<ContentPurpose, number> = {
      market_gap: 0,
      timing_play: 0,
      contrarian: 0,
      validation: 0,
      transformation: 0,
      authority: 0
    }

    // Market Gap scoring
    if (signals.competitorWeakness) scores.market_gap += 3
    if (signals.unaddressedNeed) scores.market_gap += 3
    if (signals.marketOpportunity) scores.market_gap += 2

    // Timing Play scoring
    if (signals.seasonalRelevance) scores.timing_play += 3
    if (signals.trendingTopic) scores.timing_play += 3
    if (signals.deadlinePresent) scores.timing_play += 2
    if (signals.eventBased) scores.timing_play += 2

    // Contrarian scoring
    if (signals.challengesNorm) scores.contrarian += 3
    if (signals.controversialTake) scores.contrarian += 3
    if (signals.industryMyth) scores.contrarian += 2

    // Validation scoring
    if (signals.hasTestimonials) scores.validation += 3
    if (signals.hasMetrics) scores.validation += 3
    if (signals.thirdPartyEndorsement) scores.validation += 2
    if (signals.caseStudyAvailable) scores.validation += 2

    // Transformation scoring
    if (signals.beforeAfterExample) scores.transformation += 3
    if (signals.customerJourney) scores.transformation += 3
    if (signals.outcomeProof) scores.transformation += 2

    // Authority scoring
    if (signals.expertiseDemo) scores.authority += 3
    if (signals.dataResearch) scores.authority += 3
    if (signals.thoughtLeadership) scores.authority += 2
    if (signals.industryPrediction) scores.authority += 2

    return scores
  }

  /**
   * Categorize a breakthrough by purpose
   */
  static categorizeBreakthrough(breakthrough: Breakthrough): BreakthroughCategory {
    const { purpose, confidence, allScores } = this.detectPurpose(breakthrough.signals)

    // Collect detected signal names
    const detectedSignals = Object.entries(breakthrough.signals)
      .filter(([_, value]) => value === true)
      .map(([key, _]) => key)

    // Get template mapping
    const templateMapping = PURPOSE_TEMPLATE_MAP[purpose]

    // Generate reasoning
    const reasoning = this.generateReasoning(purpose, detectedSignals, confidence)

    return {
      purpose,
      confidence,
      signals: detectedSignals,
      templateMapping,
      reasoning
    }
  }

  /**
   * Generate reasoning for the categorization
   */
  private static generateReasoning(
    purpose: ContentPurpose,
    signals: string[],
    confidence: number
  ): string {
    const purposeDescriptions: Record<ContentPurpose, string> = {
      market_gap: 'This content exploits gaps that competitors are missing',
      timing_play: 'This content leverages time-sensitive opportunities',
      contrarian: 'This content challenges conventional wisdom in the industry',
      validation: 'This content builds credibility through social proof',
      transformation: 'This content showcases transformation journeys',
      authority: 'This content establishes thought leadership and expertise'
    }

    const signalList = signals.slice(0, 3).join(', ')
    const confidenceLevel = confidence > 0.7 ? 'high' : confidence > 0.4 ? 'medium' : 'low'

    return `${purposeDescriptions[purpose]}. Detected signals: ${signalList}. Confidence: ${confidenceLevel} (${Math.round(confidence * 100)}%).`
  }

  /**
   * Align content to purpose with campaign recommendations
   */
  static alignContentToPurpose(
    purpose: ContentPurpose,
    signals: PurposeSignals
  ): ContentAlignment {
    const templateMapping = PURPOSE_TEMPLATE_MAP[purpose]
    const emotionalTriggers = PURPOSE_EMOTIONAL_TRIGGERS[purpose]
    const targetMetrics = PURPOSE_METRICS[purpose]

    // Generate campaign recommendations
    const recommendations = this.generateCampaignRecommendations(purpose, signals, templateMapping)

    return {
      purpose,
      recommendedCampaigns: recommendations,
      contentTemplates: templateMapping.contentTypes,
      emotionalTriggers,
      targetMetrics
    }
  }

  /**
   * Generate campaign recommendations with fit scores
   */
  private static generateCampaignRecommendations(
    purpose: ContentPurpose,
    signals: PurposeSignals,
    mapping: PurposeTemplateMapping
  ): CampaignRecommendation[] {
    const recommendations: CampaignRecommendation[] = []

    // Template metadata for generating recommendations
    const templateMeta: Record<string, { name: string; roi: number }> = {
      'race-journey': { name: 'RACE Journey Campaign', roi: 4.0 },
      'pas-series': { name: 'Problem-Agitate-Solve Series', roi: 3.8 },
      'bab-campaign': { name: 'Before-After-Bridge Campaign', roi: 3.9 },
      'trust-ladder': { name: 'Trust Ladder Campaign', roi: 4.5 },
      'heros-journey': { name: "Hero's Journey Campaign", roi: 5.0 },
      'product-launch': { name: 'Product Launch Sequence', roi: 4.5 },
      'seasonal-urgency': { name: 'Seasonal Urgency Campaign', roi: 5.2 },
      'authority-builder': { name: 'Authority Builder Series', roi: 4.0 },
      'comparison-campaign': { name: 'Comparison Campaign', roi: 4.0 },
      'education-first': { name: 'Education First Campaign', roi: 4.2 },
      'social-proof': { name: 'Social Proof Cascade', roi: 4.5 },
      'objection-crusher': { name: 'Objection Crusher Series', roi: 4.0 },
      'quick-win': { name: 'Quick Win Campaign', roi: 3.5 },
      'scarcity-sequence': { name: 'Scarcity Sequence', roi: 4.8 },
      'value-stack': { name: 'Value Stack Campaign', roi: 4.5 }
    }

    // Add primary recommendations (high fit score)
    mapping.primary.forEach((templateId, index) => {
      const meta = templateMeta[templateId]
      if (meta) {
        recommendations.push({
          templateId,
          templateName: meta.name,
          fitScore: 95 - (index * 5),
          rationale: this.generateRationale(templateId, purpose, signals),
          expectedROI: meta.roi
        })
      }
    })

    // Add secondary recommendations (medium fit score)
    mapping.secondary.forEach((templateId, index) => {
      const meta = templateMeta[templateId]
      if (meta) {
        recommendations.push({
          templateId,
          templateName: meta.name,
          fitScore: 75 - (index * 5),
          rationale: this.generateRationale(templateId, purpose, signals),
          expectedROI: meta.roi
        })
      }
    })

    return recommendations
  }

  /**
   * Generate rationale for template recommendation
   */
  private static generateRationale(
    templateId: string,
    purpose: ContentPurpose,
    signals: PurposeSignals
  ): string {
    const rationales: Record<string, Record<ContentPurpose, string>> = {
      'seasonal-urgency': {
        market_gap: 'Time-limited opportunity to capture unaddressed market need',
        timing_play: 'Perfect for leveraging seasonal relevance and urgency',
        contrarian: 'Use urgency to amplify contrarian message impact',
        validation: 'Time-bound proof creates immediate trust',
        transformation: 'Seasonal transformation stories drive action',
        authority: 'Establish authority through timely industry insights'
      },
      'scarcity-sequence': {
        market_gap: 'Limited availability highlights competitor gaps',
        timing_play: 'Scarcity amplifies time-sensitive opportunity',
        contrarian: 'Exclusive access to contrarian insights',
        validation: 'Limited spots validate demand and trust',
        transformation: 'Exclusive transformation journey access',
        authority: 'Scarcity reinforces expert value'
      },
      'pas-series': {
        market_gap: 'Problem focus highlights competitor blind spots',
        timing_play: 'Agitate urgency of time-sensitive problems',
        contrarian: 'Challenge assumptions about the problem',
        validation: 'Prove solution with validated results',
        transformation: 'Problem-to-solution transformation arc',
        authority: 'Expert problem diagnosis builds trust'
      }
    }

    return rationales[templateId]?.[purpose] ||
      `Strong alignment between ${purpose.replace('_', ' ')} content and ${templateId} structure`
  }

  /**
   * Get purpose description for display
   */
  static getPurposeDescription(purpose: ContentPurpose): string {
    const descriptions: Record<ContentPurpose, string> = {
      market_gap: 'Content that exploits gaps competitors are missing',
      timing_play: 'Content that leverages time-sensitive opportunities',
      contrarian: 'Content that challenges conventional industry wisdom',
      validation: 'Content that builds credibility through proof',
      transformation: 'Content that showcases transformation stories',
      authority: 'Content that establishes thought leadership'
    }

    return descriptions[purpose]
  }

  /**
   * Get all purposes with descriptions
   */
  static getAllPurposes(): Array<{ id: ContentPurpose; description: string }> {
    const purposes: ContentPurpose[] = [
      'market_gap',
      'timing_play',
      'contrarian',
      'validation',
      'transformation',
      'authority'
    ]

    return purposes.map(id => ({
      id,
      description: this.getPurposeDescription(id)
    }))
  }

  /**
   * Suggest purpose based on breakthrough score
   */
  static suggestPurposeByScore(score: number): ContentPurpose[] {
    if (score >= 85) {
      // High score: campaign-worthy
      return ['transformation', 'authority', 'validation']
    } else if (score >= 70) {
      // Medium-high: credibility building
      return ['validation', 'contrarian', 'market_gap']
    } else if (score >= 60) {
      // Medium: quick wins
      return ['timing_play', 'market_gap', 'contrarian']
    } else {
      // Lower scores: simple execution
      return ['timing_play', 'market_gap']
    }
  }

  /**
   * Calculate purpose compatibility between multiple breakthroughs
   */
  static calculatePurposeCompatibility(
    purposes: ContentPurpose[]
  ): { compatible: boolean; reason: string } {
    // Compatible purpose pairs
    const compatiblePairs: [ContentPurpose, ContentPurpose][] = [
      ['market_gap', 'contrarian'],
      ['validation', 'transformation'],
      ['authority', 'validation'],
      ['timing_play', 'transformation'],
      ['authority', 'contrarian']
    ]

    if (purposes.length < 2) {
      return { compatible: true, reason: 'Single purpose always compatible' }
    }

    const uniquePurposes = [...new Set(purposes)]

    if (uniquePurposes.length === 1) {
      return { compatible: true, reason: 'All content shares the same purpose' }
    }

    // Check for compatible pairs
    for (let i = 0; i < uniquePurposes.length - 1; i++) {
      for (let j = i + 1; j < uniquePurposes.length; j++) {
        const pair: [ContentPurpose, ContentPurpose] = [uniquePurposes[i], uniquePurposes[j]]
        const isCompatible = compatiblePairs.some(
          ([a, b]) => (pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a)
        )

        if (isCompatible) {
          return {
            compatible: true,
            reason: `${pair[0]} and ${pair[1]} complement each other well`
          }
        }
      }
    }

    return {
      compatible: false,
      reason: `Purposes ${uniquePurposes.join(', ')} may create conflicting messages`
    }
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Quick purpose detection from common indicators
 */
export function quickDetectPurpose(indicators: {
  hasTrend?: boolean
  hasDeadline?: boolean
  hasTestimonial?: boolean
  challengesNorm?: boolean
  showsTransformation?: boolean
  demonstratesExpertise?: boolean
}): ContentPurpose {
  if (indicators.hasTrend || indicators.hasDeadline) return 'timing_play'
  if (indicators.challengesNorm) return 'contrarian'
  if (indicators.hasTestimonial) return 'validation'
  if (indicators.showsTransformation) return 'transformation'
  if (indicators.demonstratesExpertise) return 'authority'
  return 'market_gap'
}

/**
 * Get purpose icon for UI display
 */
export function getPurposeIcon(purpose: ContentPurpose): string {
  const icons: Record<ContentPurpose, string> = {
    market_gap: 'target',
    timing_play: 'clock',
    contrarian: 'shuffle',
    validation: 'check-circle',
    transformation: 'trending-up',
    authority: 'award'
  }

  return icons[purpose]
}

/**
 * Get purpose color for UI display
 */
export function getPurposeColor(purpose: ContentPurpose): string {
  const colors: Record<ContentPurpose, string> = {
    market_gap: '#3b82f6',     // blue
    timing_play: '#f97316',    // orange
    contrarian: '#8b5cf6',     // purple
    validation: '#22c55e',     // green
    transformation: '#ec4899', // pink
    authority: '#eab308'       // yellow
  }

  return colors[purpose]
}

export default PurposeDetectionService
