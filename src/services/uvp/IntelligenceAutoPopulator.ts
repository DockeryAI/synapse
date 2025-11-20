/**
 * Intelligence Auto-Populator Service
 *
 * Maps DeepContext business intelligence to UVP wizard fields,
 * auto-populating the wizard with AI-discovered insights to reduce
 * manual entry time from 20 minutes to 5 minutes.
 *
 * Extraction Strategy:
 * - Target Customer: From customer psychology + demographics
 * - Customer Problem: From pain points + competitive gaps
 * - Unique Solution: From unique advantages + differentiators
 * - Key Benefit: From value propositions + outcomes
 * - Differentiation: From competitive analysis + blind spots
 *
 * Created: 2025-11-15
 */

import type { DeepContext } from '@/types/synapse/deepContext.types'
import type { UVP } from '@/types/uvp-wizard'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Auto-populated UVP data with confidence scores
 */
export interface UVPIntelligenceData {
  /** Populated UVP fields */
  uvp: Partial<UVP>

  /** Confidence scores per field (0-1) */
  confidence: {
    target_customer?: number
    customer_problem?: number
    unique_solution?: number
    key_benefit?: number
    differentiation?: number
  }

  /** Which fields were auto-populated */
  autoPopulated: {
    target_customer: boolean
    customer_problem: boolean
    unique_solution: boolean
    key_benefit: boolean
    differentiation: boolean
  }

  /** Supporting evidence for each field */
  evidence: {
    target_customer?: string[]
    customer_problem?: string[]
    unique_solution?: string[]
    key_benefit?: string[]
    differentiation?: string[]
  }

  /** Data sources used */
  sources: string[]

  /** Generation metadata */
  metadata: {
    generatedAt: Date
    contextQuality: 'high' | 'medium' | 'low'
    dataPoints: number
  }
}

// ============================================================================
// MAIN API
// ============================================================================

/**
 * Populate UVP fields from DeepContext intelligence
 *
 * @param context - Deep business intelligence context
 * @returns Auto-populated UVP data with confidence scores
 */
export async function populateFromIntelligence(
  context: DeepContext
): Promise<UVPIntelligenceData> {
  console.log('[IntelligenceAutoPopulator] Starting auto-population...')
  console.log('[IntelligenceAutoPopulator] Business:', context.business.profile.name)

  const result: UVPIntelligenceData = {
    uvp: {},
    confidence: {},
    autoPopulated: {
      target_customer: false,
      customer_problem: false,
      unique_solution: false,
      key_benefit: false,
      differentiation: false
    },
    evidence: {},
    sources: [],
    metadata: {
      generatedAt: new Date(),
      contextQuality: assessContextQuality(context),
      dataPoints: countDataPoints(context)
    }
  }

  // Extract each UVP component
  await extractTargetCustomer(context, result)
  await extractCustomerProblem(context, result)
  await extractUniqueSolution(context, result)
  await extractKeyBenefit(context, result)
  await extractDifferentiation(context, result)

  // Add industry
  result.uvp.industry = context.business.profile.industry

  // Track sources
  result.sources = extractDataSources(context)

  console.log('[IntelligenceAutoPopulator] Auto-population complete')
  console.log('[IntelligenceAutoPopulator] Populated fields:', Object.keys(result.uvp).filter(k => result.uvp[k as keyof UVP]))

  return result
}

// ============================================================================
// FIELD EXTRACTORS
// ============================================================================

/**
 * Extract target customer from customer psychology and demographics
 */
async function extractTargetCustomer(
  context: DeepContext,
  result: UVPIntelligenceData
): Promise<void> {
  const evidence: string[] = []
  const segments: string[] = []

  // Check for identity desires from customer psychology
  if (context.customerPsychology?.identityDesires) {
    const desires = context.customerPsychology.identityDesires.slice(0, 2)
    segments.push(...desires.map(d => d.desire))
    evidence.push(`Customer desires: ${desires.map(d => d.desire).join(', ')}`)
  }

  // Check for unarticulated needs
  if (context.customerPsychology?.unarticulated && context.customerPsychology.unarticulated.length > 0) {
    const topNeed = context.customerPsychology.unarticulated[0]
    if (topNeed) {
      evidence.push(`Unarticulated need: ${topNeed.need}`)
    }
  }

  // Check industry profile for typical customers
  if (context.industry?.profile?.customer_segments) {
    segments.push(...context.industry.profile.customer_segments.slice(0, 2))
    evidence.push(`Industry segments: ${context.industry.profile.customer_segments.slice(0, 2).join(', ')}`)
  }

  // Build target customer description
  if (segments.length > 0 || evidence.length > 0) {
    const targetCustomer = buildTargetCustomerDescription(segments, context)

    result.uvp.target_customer = targetCustomer
    result.confidence.target_customer = calculateConfidence(evidence.length, 3)
    result.autoPopulated.target_customer = true
    result.evidence.target_customer = evidence

    console.log('[IntelligenceAutoPopulator] Target Customer:', targetCustomer)
  }
}

/**
 * Build target customer description from segments
 */
function buildTargetCustomerDescription(segments: string[], context: DeepContext): string {
  const location = context.business.profile.location

  // Combine segments with location context
  if (segments.length === 0) {
    return `${context.business.profile.industry} customers in ${location.city}, ${location.state}`
  }

  const primarySegment = segments[0]

  // Format: "Segment in Location"
  return `${primarySegment} in ${location.city}, ${location.state}`
}

/**
 * Extract customer problem from pain points and competitive gaps
 */
async function extractCustomerProblem(
  context: DeepContext,
  result: UVPIntelligenceData
): Promise<void> {
  const evidence: string[] = []
  const problems: string[] = []

  // Primary source: unarticulated customer needs
  if (context.customerPsychology?.unarticulated && context.customerPsychology.unarticulated.length > 0) {
    const topNeed = context.customerPsychology.unarticulated[0]
    problems.push(topNeed.need)
    evidence.push(`Unarticulated need: ${topNeed.need}`)

    if (topNeed.confidence > 0.7) {
      evidence.push(`High confidence need (AI is confident about this)`)
    }
  }

  // Secondary source: competitive blind spots (problems competitors ignore)
  if (context.competitiveIntel?.blindSpots && context.competitiveIntel.blindSpots.length > 0) {
    const blindSpot = context.competitiveIntel.blindSpots[0]
    if (blindSpot.customerInterest > 0.6) {
      problems.push(blindSpot.topic)
      evidence.push(`Unmet need: ${blindSpot.topic}`)
    }
  }

  // Tertiary: industry common pain points
  if (context.industry?.profile?.common_pain_points) {
    const industryPain = context.industry.profile.common_pain_points[0]
    if (industryPain && problems.length === 0) {
      problems.push(industryPain)
      evidence.push(`Industry pain: ${industryPain}`)
    }
  }

  if (problems.length > 0) {
    result.uvp.customer_problem = problems[0]
    result.confidence.customer_problem = calculateConfidence(evidence.length, 3)
    result.autoPopulated.customer_problem = true
    result.evidence.customer_problem = evidence

    console.log('[IntelligenceAutoPopulator] Customer Problem:', problems[0])
  }
}

/**
 * Extract unique solution from business advantages and differentiators
 */
async function extractUniqueSolution(
  context: DeepContext,
  result: UVPIntelligenceData
): Promise<void> {
  const evidence: string[] = []
  const solutions: string[] = []

  // Primary: unique advantages
  if (context.business?.uniqueAdvantages && context.business.uniqueAdvantages.length > 0) {
    const topAdvantage = context.business.uniqueAdvantages[0]
    solutions.push(topAdvantage)
    evidence.push(`Unique advantage: ${topAdvantage}`)
  }

  // Secondary: competitive advantages from opportunities
  if (context.competitiveIntel?.opportunities && context.competitiveIntel.opportunities.length > 0) {
    const gap = context.competitiveIntel.opportunities[0]
    if (gap.gap && solutions.length === 0) {
      solutions.push(gap.gap)
      evidence.push(`Market gap opportunity: ${gap.gap}`)
    }
  }

  // Tertiary: from brand voice or specialty
  if (context.business?.brandVoice?.values && context.business.brandVoice.values.length > 0) {
    const value = context.business.brandVoice.values[0]
    if (solutions.length === 0) {
      solutions.push(`${context.business.profile.industry} services focused on ${value}`)
      evidence.push(`Brand value: ${value}`)
    }
  }

  if (solutions.length > 0) {
    result.uvp.unique_solution = solutions[0]
    result.confidence.unique_solution = calculateConfidence(evidence.length, 2)
    result.autoPopulated.unique_solution = true
    result.evidence.unique_solution = evidence

    console.log('[IntelligenceAutoPopulator] Unique Solution:', solutions[0])
  }
}

/**
 * Extract key benefit from customer desires and outcomes
 */
async function extractKeyBenefit(
  context: DeepContext,
  result: UVPIntelligenceData
): Promise<void> {
  const evidence: string[] = []
  const benefits: string[] = []

  // Primary: customer identity desires (what they want to become)
  if (context.customerPsychology?.identityDesires && context.customerPsychology.identityDesires.length > 0) {
    const topDesire = context.customerPsychology.identityDesires[0]
    benefits.push(topDesire.desire)
    evidence.push(`Customer desire: ${topDesire.desire}`)

    if (topDesire.strength > 0.7) {
      evidence.push(`Strong identity desire (${Math.round(topDesire.strength * 100)}% strength)`)
    }
  }

  // Secondary: from solving the pain point
  if (result.uvp.customer_problem) {
    const painSolution = `Relief from ${result.uvp.customer_problem.toLowerCase()}`
    if (benefits.length === 0) {
      benefits.push(painSolution)
      evidence.push(`Solves: ${result.uvp.customer_problem}`)
    }
  }

  // Tertiary: industry typical benefits
  if (context.industry?.profile?.key_benefits && context.industry.profile.key_benefits.length > 0) {
    const industryBenefit = context.industry.profile.key_benefits[0]
    if (benefits.length === 0) {
      benefits.push(industryBenefit)
      evidence.push(`Industry benefit: ${industryBenefit}`)
    }
  }

  if (benefits.length > 0) {
    result.uvp.key_benefit = benefits[0]
    result.confidence.key_benefit = calculateConfidence(evidence.length, 2)
    result.autoPopulated.key_benefit = true
    result.evidence.key_benefit = evidence

    console.log('[IntelligenceAutoPopulator] Key Benefit:', benefits[0])
  }
}

/**
 * Extract differentiation from competitive analysis
 */
async function extractDifferentiation(
  context: DeepContext,
  result: UVPIntelligenceData
): Promise<void> {
  const evidence: string[] = []
  const differentiators: string[] = []

  // Primary: competitor mistakes we don't make
  if (context.competitiveIntel?.mistakes && context.competitiveIntel.mistakes.length > 0) {
    const mistake = context.competitiveIntel.mistakes[0]
    differentiators.push(`Unlike competitors who ${mistake.mistake.toLowerCase()}, we ${mistake.opportunity.toLowerCase()}`)
    evidence.push(`Competitor mistake: ${mistake.mistake}`)
  }

  // Secondary: blind spots we address
  if (context.competitiveIntel?.blindSpots && context.competitiveIntel.blindSpots.length > 0) {
    const blindSpot = context.competitiveIntel.blindSpots[0]
    if (differentiators.length === 0) {
      differentiators.push(`We focus on ${blindSpot.topic.toLowerCase()}, which competitors overlook`)
      evidence.push(`Blind spot: ${blindSpot.topic}`)
    }
  }

  // Tertiary: unique advantages
  if (context.business?.uniqueAdvantages && context.business.uniqueAdvantages.length > 0) {
    const advantage = context.business.uniqueAdvantages[0]
    if (differentiators.length === 0) {
      differentiators.push(advantage)
      evidence.push(`Unique: ${advantage}`)
    }
  }

  if (differentiators.length > 0) {
    result.uvp.differentiation = differentiators[0]
    result.confidence.differentiation = calculateConfidence(evidence.length, 2)
    result.autoPopulated.differentiation = true
    result.evidence.differentiation = evidence

    console.log('[IntelligenceAutoPopulator] Differentiation:', differentiators[0])
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate confidence score based on evidence strength
 */
function calculateConfidence(evidenceCount: number, ideal: number): number {
  if (evidenceCount === 0) return 0
  if (evidenceCount >= ideal) return 0.9
  return Math.min(0.9, (evidenceCount / ideal) * 0.9)
}

/**
 * Assess overall context quality
 */
function assessContextQuality(context: DeepContext): 'high' | 'medium' | 'low' {
  const dataPoints = countDataPoints(context)

  if (dataPoints >= 8) return 'high'
  if (dataPoints >= 5) return 'medium'
  return 'low'
}

/**
 * Count available data points in context
 */
function countDataPoints(context: DeepContext): number {
  let count = 0

  if (context.business?.profile) count++
  if (context.business?.uniqueAdvantages?.length) count++
  if (context.business?.brandVoice) count++
  if (context.customerPsychology?.unarticulated?.length) count++
  if (context.customerPsychology?.identityDesires?.length) count++
  if (context.competitiveIntel?.blindSpots?.length) count++
  if (context.competitiveIntel?.opportunities?.length) count++
  if (context.competitiveIntel?.mistakes?.length) count++
  if (context.industry?.profile) count++
  if (context.industry?.trends?.length) count++

  return count
}

/**
 * Extract data sources used
 */
function extractDataSources(context: DeepContext): string[] {
  const sources: string[] = []

  if (context.customerPsychology?.unarticulated?.length) sources.push('Customer Psychology')
  if (context.customerPsychology?.identityDesires?.length) sources.push('Customer Identity')
  if (context.competitiveIntel?.blindSpots?.length) sources.push('Competitive Analysis')
  if (context.business?.uniqueAdvantages?.length) sources.push('Business Profile')
  if (context.industry?.profile) sources.push('Industry Data')

  return sources
}

/**
 * Get confidence level label
 */
export function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.7) return 'high'
  if (confidence >= 0.4) return 'medium'
  return 'low'
}

/**
 * Check if field should be shown as AI-suggested
 */
export function isFieldAutoPopulated(
  intelligenceData: UVPIntelligenceData | null,
  field: keyof UVP
): boolean {
  if (!intelligenceData) return false
  return intelligenceData.autoPopulated[field as keyof typeof intelligenceData.autoPopulated] || false
}

/**
 * Get confidence for a specific field
 */
export function getFieldConfidence(
  intelligenceData: UVPIntelligenceData | null,
  field: keyof UVP
): number {
  if (!intelligenceData) return 0
  return intelligenceData.confidence[field as keyof typeof intelligenceData.confidence] || 0
}

/**
 * Get evidence for a specific field
 */
export function getFieldEvidence(
  intelligenceData: UVPIntelligenceData | null,
  field: keyof UVP
): string[] {
  if (!intelligenceData) return []
  return intelligenceData.evidence[field as keyof typeof intelligenceData.evidence] || []
}
