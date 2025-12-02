/**
 * Campaign Template Registry
 *
 * Central registry for all 15 campaign templates.
 * Provides lookup, filtering, and recommendation capabilities.
 *
 * @module campaign-template-registry
 */

import { CampaignTemplate, CampaignTemplateMetadata } from './campaign-template-base.service'

// Core Journey Templates
import { RACEJourneyTemplate } from './campaigns/RACEJourneyTemplate'
import { PASSeriesTemplate } from './campaigns/PASSeriesTemplate'
import { BABCampaignTemplate } from './campaigns/BABCampaignTemplate'
import { TrustLadderTemplate } from './campaigns/TrustLadderTemplate'
import { HerosJourneyTemplate } from './campaigns/HerosJourneyTemplate'

// Launch Templates
import { ProductLaunchTemplate } from './campaigns/ProductLaunchTemplate'
import { SeasonalUrgencyTemplate } from './campaigns/SeasonalUrgencyTemplate'

// Authority Templates
import { AuthorityBuilderTemplate } from './campaigns/AuthorityBuilderTemplate'
import { ComparisonCampaignTemplate } from './campaigns/ComparisonCampaignTemplate'
import { EducationFirstTemplate } from './campaigns/EducationFirstTemplate'

// Conversion Templates
import { SocialProofTemplate } from './campaigns/SocialProofTemplate'
import { ObjectionCrusherTemplate } from './campaigns/ObjectionCrusherTemplate'
import { QuickWinCampaignTemplate } from './campaigns/QuickWinCampaignTemplate'
import { ScarcitySequenceTemplate } from './campaigns/ScarcitySequenceTemplate'
import { ValueStackTemplate } from './campaigns/ValueStackTemplate'

// =============================================================================
// REGISTRY
// =============================================================================

/**
 * All registered campaign templates
 */
export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  // Core Journey (5)
  RACEJourneyTemplate,
  PASSeriesTemplate,
  BABCampaignTemplate,
  TrustLadderTemplate,
  HerosJourneyTemplate,

  // Launch (2)
  ProductLaunchTemplate,
  SeasonalUrgencyTemplate,

  // Authority (3)
  AuthorityBuilderTemplate,
  ComparisonCampaignTemplate,
  EducationFirstTemplate,

  // Conversion (5)
  SocialProofTemplate,
  ObjectionCrusherTemplate,
  QuickWinCampaignTemplate,
  ScarcitySequenceTemplate,
  ValueStackTemplate
]

/**
 * Template registry with lookup and filtering capabilities
 */
export class CampaignTemplateRegistry {
  private static templates: Map<string, CampaignTemplate> = new Map(
    CAMPAIGN_TEMPLATES.map(t => [t.metadata.id, t])
  )

  /**
   * Get all registered templates
   */
  static getAll(): CampaignTemplate[] {
    return [...this.templates.values()]
  }

  /**
   * Get template by ID
   */
  static getById(id: string): CampaignTemplate | undefined {
    return this.templates.get(id)
  }

  /**
   * Get templates by category
   */
  static getByCategory(category: CampaignTemplateMetadata['category']): CampaignTemplate[] {
    return this.getAll().filter(t => t.metadata.category === category)
  }

  /**
   * Get templates by complexity
   */
  static getByComplexity(complexity: CampaignTemplateMetadata['complexity']): CampaignTemplate[] {
    return this.getAll().filter(t => t.metadata.complexity === complexity)
  }

  /**
   * Get templates within duration range
   */
  static getByDuration(minDays: number, maxDays: number): CampaignTemplate[] {
    return this.getAll().filter(t =>
      t.metadata.durationDays >= minDays && t.metadata.durationDays <= maxDays
    )
  }

  /**
   * Get templates with ROI above threshold
   */
  static getByMinROI(minMultiplier: number): CampaignTemplate[] {
    return this.getAll().filter(t => t.roi.expectedMultiplier >= minMultiplier)
  }

  /**
   * Search templates by use case
   */
  static searchByUseCase(useCase: string): CampaignTemplate[] {
    const searchTerm = useCase.toLowerCase()
    return this.getAll().filter(t =>
      t.metadata.bestFor.some(bf => bf.toLowerCase().includes(searchTerm)) ||
      t.metadata.description.toLowerCase().includes(searchTerm) ||
      t.metadata.name.toLowerCase().includes(searchTerm)
    )
  }

  /**
   * Get template count by category
   */
  static getCategoryCounts(): Record<string, number> {
    const counts: Record<string, number> = {
      'core-journey': 0,
      launch: 0,
      authority: 0,
      conversion: 0
    }

    this.getAll().forEach(t => {
      counts[t.metadata.category]++
    })

    return counts
  }

  /**
   * Get recommended templates for a business goal
   */
  static getRecommendationsForGoal(goal: string): CampaignTemplate[] {
    const goalMappings: Record<string, string[]> = {
      'build-awareness': ['race-journey', 'heros-journey', 'authority-builder'],
      'generate-leads': ['pas-series', 'education-first', 'value-stack'],
      'build-trust': ['trust-ladder', 'social-proof', 'bab-campaign'],
      'launch-product': ['product-launch', 'scarcity-sequence', 'value-stack'],
      'drive-sales': ['scarcity-sequence', 'objection-crusher', 'quick-win'],
      'establish-authority': ['authority-builder', 'comparison-campaign', 'education-first'],
      'seasonal-promotion': ['seasonal-urgency', 'scarcity-sequence', 'quick-win']
    }

    const templateIds = goalMappings[goal] || []
    return templateIds
      .map(id => this.getById(id))
      .filter((t): t is CampaignTemplate => t !== undefined)
  }

  /**
   * Get quick-start templates (simple complexity, shorter duration)
   */
  static getQuickStartTemplates(): CampaignTemplate[] {
    return this.getAll().filter(t =>
      t.metadata.complexity === 'simple' && t.metadata.durationDays <= 14
    )
  }

  /**
   * Get premium templates (high ROI, complex)
   */
  static getPremiumTemplates(): CampaignTemplate[] {
    return this.getAll().filter(t =>
      t.roi.expectedMultiplier >= 4.5 || t.metadata.complexity === 'complex'
    )
  }

  /**
   * Get template summary for display
   */
  static getTemplateSummaries(): Array<{
    id: string
    name: string
    category: string
    pieces: number
    days: number
    roi: number
    complexity: string
  }> {
    return this.getAll().map(t => ({
      id: t.metadata.id,
      name: t.metadata.name,
      category: t.metadata.category,
      pieces: t.metadata.pieceCount,
      days: t.metadata.durationDays,
      roi: t.roi.expectedMultiplier,
      complexity: t.metadata.complexity
    }))
  }

  /**
   * Validate all templates in registry
   */
  static validateAll(): { valid: boolean; issues: Array<{ templateId: string; errors: string[] }> } {
    const issues: Array<{ templateId: string; errors: string[] }> = []

    this.getAll().forEach(template => {
      const errors: string[] = []

      // Validate piece count
      if (template.pieces.length !== template.metadata.pieceCount) {
        errors.push(`Piece count mismatch: ${template.pieces.length} vs ${template.metadata.pieceCount}`)
      }

      // Validate duration
      const maxDay = Math.max(...template.pieces.map(p => p.dayOffset))
      if (maxDay >= template.metadata.durationDays) {
        errors.push(`Duration exceeded: piece at day ${maxDay}, duration ${template.metadata.durationDays}`)
      }

      // Validate emotional progression length
      if (template.emotionalProgression.length !== template.pieces.length) {
        errors.push(`Emotional progression length mismatch`)
      }

      // Validate ROI
      if (template.roi.expectedMultiplier < 2 || template.roi.expectedMultiplier > 7) {
        errors.push(`ROI ${template.roi.expectedMultiplier}x seems outside typical range`)
      }

      if (errors.length > 0) {
        issues.push({ templateId: template.metadata.id, errors })
      }
    })

    return { valid: issues.length === 0, issues }
  }

  /**
   * Get registry statistics
   */
  static getStats(): {
    totalTemplates: number
    totalPieces: number
    avgDuration: number
    avgROI: number
    categories: Record<string, number>
  } {
    const templates = this.getAll()
    const totalPieces = templates.reduce((sum, t) => sum + t.metadata.pieceCount, 0)
    const avgDuration = templates.reduce((sum, t) => sum + t.metadata.durationDays, 0) / templates.length
    const avgROI = templates.reduce((sum, t) => sum + t.roi.expectedMultiplier, 0) / templates.length

    return {
      totalTemplates: templates.length,
      totalPieces,
      avgDuration: Math.round(avgDuration * 10) / 10,
      avgROI: Math.round(avgROI * 10) / 10,
      categories: this.getCategoryCounts()
    }
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Core Journey
  RACEJourneyTemplate,
  PASSeriesTemplate,
  BABCampaignTemplate,
  TrustLadderTemplate,
  HerosJourneyTemplate,

  // Launch
  ProductLaunchTemplate,
  SeasonalUrgencyTemplate,

  // Authority
  AuthorityBuilderTemplate,
  ComparisonCampaignTemplate,
  EducationFirstTemplate,

  // Conversion
  SocialProofTemplate,
  ObjectionCrusherTemplate,
  QuickWinCampaignTemplate,
  ScarcitySequenceTemplate,
  ValueStackTemplate
}

export default CampaignTemplateRegistry
