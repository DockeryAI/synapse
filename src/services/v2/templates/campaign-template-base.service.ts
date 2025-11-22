/**
 * Campaign Template Base Service
 *
 * Foundation for multi-piece campaign generation with timeline management,
 * emotional progression tracking, and narrative continuity.
 *
 * @module campaign-template-base.service
 */

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

/**
 * Emotional triggers that drive content engagement
 * Based on Jonah Berger's research + RACE framework
 */
export type EmotionalTrigger =
  | 'curiosity'      // Gap between known and unknown
  | 'fear'           // Risk avoidance, FOMO
  | 'hope'           // Future improvement
  | 'trust'          // Safety and reliability
  | 'urgency'        // Time-sensitive action
  | 'validation'     // Social proof
  | 'empowerment'    // Control and capability
  | 'relief'         // Problem resolution
  | 'excitement'     // Positive anticipation
  | 'anger'          // Injustice, outrage
  | 'surprise'       // Pattern interrupts
  | 'pride'          // Achievement recognition

/**
 * Content type categories for campaign pieces
 */
export type ContentType =
  | 'awareness'      // Problem/opportunity revelation
  | 'education'      // Teaching and informing
  | 'story'          // Narrative and transformation
  | 'proof'          // Testimonials and evidence
  | 'comparison'     // Competitive positioning
  | 'offer'          // Direct sales pitch
  | 'engagement'     // Community interaction
  | 'urgency'        // Time-limited action

/**
 * Platform targeting for content pieces
 */
export type Platform =
  | 'linkedin'
  | 'facebook'
  | 'instagram'
  | 'twitter'
  | 'email'
  | 'blog'
  | 'youtube'
  | 'tiktok'

/**
 * RACE framework stages
 */
export type RACEStage = 'reach' | 'act' | 'convert' | 'engage'

/**
 * Individual campaign piece configuration
 */
export interface CampaignPiece {
  id: string
  dayOffset: number              // Days from campaign start
  title: string                  // Piece title/topic
  contentType: ContentType
  emotionalTrigger: EmotionalTrigger
  objective: string              // What this piece aims to achieve
  raceStage: RACEStage
  keyMessage: string             // Core message to convey
  callToAction: string           // Desired user action
  platforms: Platform[]          // Target platforms
  narrativeHook?: string         // Connection to previous/next pieces
  estimatedEngagement: number    // Expected engagement multiplier (1.0 = baseline)
}

/**
 * ROI estimation for campaign
 */
export interface CampaignROI {
  expectedMultiplier: number     // e.g., 3.5 = 3.5x baseline
  engagementLift: number         // Percentage increase
  conversionLift: number         // Percentage increase
  factors: string[]              // What drives the ROI
}

/**
 * Campaign template metadata
 */
export interface CampaignTemplateMetadata {
  id: string
  name: string
  description: string
  category: 'core-journey' | 'launch' | 'authority' | 'conversion'
  pieceCount: number
  durationDays: number
  complexity: 'simple' | 'moderate' | 'complex'
  bestFor: string[]              // Use cases
  prerequisites: string[]        // What's needed before starting
}

/**
 * Complete campaign template definition
 */
export interface CampaignTemplate {
  metadata: CampaignTemplateMetadata
  pieces: CampaignPiece[]
  roi: CampaignROI
  emotionalProgression: EmotionalTrigger[]  // Emotional arc
  narrativeArc: string                       // Story structure description
  successMetrics: string[]                   // How to measure success
}

/**
 * Campaign instance with business-specific data
 */
export interface CampaignInstance {
  id: string
  templateId: string
  brandId: string
  createdAt: Date
  scheduledStart: Date
  pieces: GeneratedCampaignPiece[]
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused'
  customizations: Record<string, unknown>
}

/**
 * Generated piece with actual content
 */
export interface GeneratedCampaignPiece extends CampaignPiece {
  generatedContent: string
  generatedAt: Date
  scheduledDate: Date
  publishedDate?: Date
  actualEngagement?: number
}

// =============================================================================
// BASE SERVICE CLASS
// =============================================================================

/**
 * Campaign Template Base Service
 *
 * Provides core functionality for campaign template management,
 * timeline generation, and narrative continuity tracking.
 */
export class CampaignTemplateBaseService {

  /**
   * Calculate campaign timeline from start date
   */
  static calculateTimeline(
    pieces: CampaignPiece[],
    startDate: Date
  ): Map<string, Date> {
    const timeline = new Map<string, Date>()

    pieces.forEach(piece => {
      const pieceDate = new Date(startDate)
      pieceDate.setDate(pieceDate.getDate() + piece.dayOffset)
      timeline.set(piece.id, pieceDate)
    })

    return timeline
  }

  /**
   * Validate emotional progression for psychological coherence
   */
  static validateEmotionalProgression(
    triggers: EmotionalTrigger[]
  ): { valid: boolean; issues: string[] } {
    const issues: string[] = []

    // Check for jarring transitions
    const jarringPairs: [EmotionalTrigger, EmotionalTrigger][] = [
      ['fear', 'excitement'],
      ['anger', 'trust'],
      ['urgency', 'relief']
    ]

    for (let i = 0; i < triggers.length - 1; i++) {
      const current = triggers[i]
      const next = triggers[i + 1]

      for (const [a, b] of jarringPairs) {
        if ((current === a && next === b) || (current === b && next === a)) {
          issues.push(`Jarring transition from ${current} to ${next} at position ${i + 1}`)
        }
      }
    }

    // Check for variety (no more than 2 consecutive same triggers)
    for (let i = 0; i < triggers.length - 2; i++) {
      if (triggers[i] === triggers[i + 1] && triggers[i + 1] === triggers[i + 2]) {
        issues.push(`Repetitive trigger ${triggers[i]} at positions ${i + 1}-${i + 3}`)
      }
    }

    return { valid: issues.length === 0, issues }
  }

  /**
   * Generate narrative continuity hooks between pieces
   */
  static generateNarrativeHooks(pieces: CampaignPiece[]): CampaignPiece[] {
    return pieces.map((piece, index) => {
      const hooks: string[] = []

      // Reference previous piece
      if (index > 0) {
        const prev = pieces[index - 1]
        hooks.push(`Following up on ${prev.title.toLowerCase()}`)
      }

      // Tease next piece
      if (index < pieces.length - 1) {
        const next = pieces[index + 1]
        hooks.push(`Next: ${next.title}`)
      }

      return {
        ...piece,
        narrativeHook: hooks.join(' | ') || undefined
      }
    })
  }

  /**
   * Calculate expected ROI based on piece configurations
   */
  static calculateExpectedROI(pieces: CampaignPiece[]): CampaignROI {
    // Base multiplier from piece count (more pieces = more touchpoints)
    let multiplier = 1.0 + (pieces.length * 0.2)

    // Bonus for emotional variety
    const uniqueTriggers = new Set(pieces.map(p => p.emotionalTrigger)).size
    multiplier += uniqueTriggers * 0.1

    // Bonus for RACE stage coverage
    const stages = new Set(pieces.map(p => p.raceStage))
    if (stages.has('reach') && stages.has('act') && stages.has('convert') && stages.has('engage')) {
      multiplier += 0.5
    }

    // Calculate engagement lift
    const avgEngagement = pieces.reduce((sum, p) => sum + p.estimatedEngagement, 0) / pieces.length
    const engagementLift = (avgEngagement - 1) * 100

    // Conversion lift based on urgency and proof content
    const urgencyCount = pieces.filter(p => p.contentType === 'urgency').length
    const proofCount = pieces.filter(p => p.contentType === 'proof').length
    const conversionLift = (urgencyCount * 8) + (proofCount * 5)

    const factors: string[] = []
    if (pieces.length >= 5) factors.push('Multi-touch exposure')
    if (uniqueTriggers >= 4) factors.push('Emotional variety')
    if (urgencyCount > 0) factors.push('Urgency elements')
    if (proofCount > 0) factors.push('Social proof')
    if (stages.size >= 3) factors.push('Full funnel coverage')

    return {
      expectedMultiplier: Math.round(multiplier * 10) / 10,
      engagementLift: Math.round(engagementLift),
      conversionLift: Math.round(conversionLift),
      factors
    }
  }

  /**
   * Optimize platform distribution for pieces
   */
  static optimizePlatformDistribution(
    pieces: CampaignPiece[],
    availablePlatforms: Platform[]
  ): CampaignPiece[] {
    return pieces.map(piece => {
      // Filter to only available platforms
      const optimizedPlatforms = piece.platforms.filter(p =>
        availablePlatforms.includes(p)
      )

      // Ensure at least one platform
      if (optimizedPlatforms.length === 0) {
        optimizedPlatforms.push(availablePlatforms[0] || 'email')
      }

      return {
        ...piece,
        platforms: optimizedPlatforms
      }
    })
  }

  /**
   * Get recommended spacing between pieces based on content type
   */
  static getRecommendedSpacing(contentType: ContentType): number {
    const spacingMap: Record<ContentType, number> = {
      awareness: 1,      // Can post frequently
      education: 2,      // Allow absorption time
      story: 3,          // Need narrative spacing
      proof: 2,          // Regular cadence
      comparison: 3,     // Allow consideration
      offer: 4,          // Don't overwhelm with sales
      engagement: 1,     // High frequency OK
      urgency: 2         // Strategic timing
    }

    return spacingMap[contentType]
  }

  /**
   * Validate campaign template structure
   */
  static validateTemplate(template: CampaignTemplate): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate piece count matches metadata
    if (template.pieces.length !== template.metadata.pieceCount) {
      errors.push(`Piece count mismatch: metadata says ${template.metadata.pieceCount}, but has ${template.pieces.length}`)
    }

    // Validate duration
    const maxDay = Math.max(...template.pieces.map(p => p.dayOffset))
    if (maxDay >= template.metadata.durationDays) {
      errors.push(`Duration exceeded: piece at day ${maxDay} but duration is ${template.metadata.durationDays}`)
    }

    // Validate emotional progression
    const emotionalValidation = this.validateEmotionalProgression(template.emotionalProgression)
    if (!emotionalValidation.valid) {
      errors.push(...emotionalValidation.issues)
    }

    // Validate ROI estimates are reasonable
    if (template.roi.expectedMultiplier < 1 || template.roi.expectedMultiplier > 10) {
      errors.push(`ROI multiplier ${template.roi.expectedMultiplier}x seems unrealistic`)
    }

    // Validate all pieces have unique IDs
    const ids = template.pieces.map(p => p.id)
    const uniqueIds = new Set(ids)
    if (ids.length !== uniqueIds.size) {
      errors.push('Duplicate piece IDs detected')
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Create a campaign instance from a template
   */
  static instantiate(
    template: CampaignTemplate,
    brandId: string,
    startDate: Date = new Date()
  ): CampaignInstance {
    const timeline = this.calculateTimeline(template.pieces, startDate)

    const generatedPieces: GeneratedCampaignPiece[] = template.pieces.map(piece => ({
      ...piece,
      generatedContent: '', // To be filled by content generator
      generatedAt: new Date(),
      scheduledDate: timeline.get(piece.id) || startDate
    }))

    return {
      id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId: template.metadata.id,
      brandId,
      createdAt: new Date(),
      scheduledStart: startDate,
      pieces: generatedPieces,
      status: 'draft',
      customizations: {}
    }
  }

  /**
   * Generate prompt context for content generation
   */
  static generatePromptContext(
    piece: CampaignPiece,
    templateMetadata: CampaignTemplateMetadata,
    narrativePosition: { current: number; total: number }
  ): string {
    return `
Campaign: ${templateMetadata.name}
Description: ${templateMetadata.description}

This is piece ${narrativePosition.current} of ${narrativePosition.total}.

Piece Details:
- Title: ${piece.title}
- Content Type: ${piece.contentType}
- Emotional Trigger: ${piece.emotionalTrigger}
- RACE Stage: ${piece.raceStage}
- Objective: ${piece.objective}
- Key Message: ${piece.keyMessage}
- Call to Action: ${piece.callToAction}
${piece.narrativeHook ? `- Narrative Context: ${piece.narrativeHook}` : ''}

Target Platforms: ${piece.platforms.join(', ')}

Generate content that:
1. Achieves the stated objective
2. Evokes the ${piece.emotionalTrigger} emotional trigger
3. Maintains narrative continuity with other pieces
4. Includes a clear call to action
5. Is optimized for the target platforms
`.trim()
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a standard piece ID from template and position
 */
export function createPieceId(templateId: string, position: number): string {
  return `${templateId}_piece_${position.toString().padStart(2, '0')}`
}

/**
 * Get emotional trigger color for UI display
 */
export function getEmotionalTriggerColor(trigger: EmotionalTrigger): string {
  const colors: Record<EmotionalTrigger, string> = {
    curiosity: '#6366f1',    // indigo
    fear: '#ef4444',         // red
    hope: '#22c55e',         // green
    trust: '#3b82f6',        // blue
    urgency: '#f97316',      // orange
    validation: '#a855f7',   // purple
    empowerment: '#eab308',  // yellow
    relief: '#14b8a6',       // teal
    excitement: '#ec4899',   // pink
    anger: '#dc2626',        // dark red
    surprise: '#8b5cf6',     // violet
    pride: '#f59e0b'         // amber
  }

  return colors[trigger]
}

/**
 * Get content type icon for UI display
 */
export function getContentTypeIcon(contentType: ContentType): string {
  const icons: Record<ContentType, string> = {
    awareness: 'eye',
    education: 'book',
    story: 'message-circle',
    proof: 'check-circle',
    comparison: 'git-compare',
    offer: 'tag',
    engagement: 'users',
    urgency: 'clock'
  }

  return icons[contentType]
}

/**
 * Calculate campaign health score (0-100)
 */
export function calculateCampaignHealth(template: CampaignTemplate): number {
  let score = 50 // Base score

  // Piece variety bonus (up to 15 points)
  const contentTypes = new Set(template.pieces.map(p => p.contentType))
  score += Math.min(contentTypes.size * 3, 15)

  // Emotional variety bonus (up to 15 points)
  const emotions = new Set(template.pieces.map(p => p.emotionalTrigger))
  score += Math.min(emotions.size * 3, 15)

  // RACE coverage bonus (up to 10 points)
  const stages = new Set(template.pieces.map(p => p.raceStage))
  score += stages.size * 2.5

  // Platform variety bonus (up to 10 points)
  const platforms = new Set(template.pieces.flatMap(p => p.platforms))
  score += Math.min(platforms.size * 2, 10)

  return Math.min(Math.round(score), 100)
}

export default CampaignTemplateBaseService
