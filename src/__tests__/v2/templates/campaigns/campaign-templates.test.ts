/**
 * Campaign Templates Test Suite
 *
 * Tests for all 15 campaign templates and the registry.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import {
  CampaignTemplateBaseService,
  CampaignTemplate,
  createPieceId,
  getEmotionalTriggerColor,
  calculateCampaignHealth
} from '../../../../services/v2/templates/campaign-template-base.service'
import {
  CampaignTemplateRegistry,
  CAMPAIGN_TEMPLATES,
  RACEJourneyTemplate,
  PASSeriesTemplate,
  BABCampaignTemplate,
  TrustLadderTemplate,
  HerosJourneyTemplate,
  ProductLaunchTemplate,
  SeasonalUrgencyTemplate,
  AuthorityBuilderTemplate,
  ComparisonCampaignTemplate,
  EducationFirstTemplate,
  SocialProofTemplate,
  ObjectionCrusherTemplate,
  QuickWinCampaignTemplate,
  ScarcitySequenceTemplate,
  ValueStackTemplate
} from '../../../../services/v2/templates/campaign-template-registry'

// =============================================================================
// BASE SERVICE TESTS
// =============================================================================

describe('CampaignTemplateBaseService', () => {
  describe('calculateTimeline', () => {
    it('should calculate correct dates for pieces', () => {
      const pieces = [
        { id: 'test_01', dayOffset: 0 },
        { id: 'test_02', dayOffset: 3 },
        { id: 'test_03', dayOffset: 7 }
      ] as any[]

      const startDate = new Date('2025-01-01')
      const timeline = CampaignTemplateBaseService.calculateTimeline(pieces, startDate)

      expect(timeline.get('test_01')?.toISOString().split('T')[0]).toBe('2025-01-01')
      expect(timeline.get('test_02')?.toISOString().split('T')[0]).toBe('2025-01-04')
      expect(timeline.get('test_03')?.toISOString().split('T')[0]).toBe('2025-01-08')
    })
  })

  describe('validateEmotionalProgression', () => {
    it('should pass for valid progression', () => {
      const triggers = ['curiosity', 'fear', 'hope', 'validation'] as any[]
      const result = CampaignTemplateBaseService.validateEmotionalProgression(triggers)
      expect(result.valid).toBe(true)
      expect(result.issues).toHaveLength(0)
    })

    it('should detect repetitive triggers', () => {
      const triggers = ['curiosity', 'curiosity', 'curiosity', 'hope'] as any[]
      const result = CampaignTemplateBaseService.validateEmotionalProgression(triggers)
      expect(result.valid).toBe(false)
      expect(result.issues.length).toBeGreaterThan(0)
    })
  })

  describe('calculateExpectedROI', () => {
    it('should calculate ROI based on pieces', () => {
      const pieces = [
        { emotionalTrigger: 'curiosity', contentType: 'awareness', raceStage: 'reach', estimatedEngagement: 1.4 },
        { emotionalTrigger: 'fear', contentType: 'education', raceStage: 'act', estimatedEngagement: 1.3 },
        { emotionalTrigger: 'hope', contentType: 'proof', raceStage: 'convert', estimatedEngagement: 1.6 },
        { emotionalTrigger: 'urgency', contentType: 'urgency', raceStage: 'engage', estimatedEngagement: 1.5 }
      ] as any[]

      const roi = CampaignTemplateBaseService.calculateExpectedROI(pieces)

      expect(roi.expectedMultiplier).toBeGreaterThan(1)
      expect(roi.engagementLift).toBeDefined()
      expect(roi.conversionLift).toBeDefined()
      expect(roi.factors.length).toBeGreaterThan(0)
    })
  })

  describe('validateTemplate', () => {
    it('should validate a properly structured template', () => {
      const result = CampaignTemplateBaseService.validateTemplate(RACEJourneyTemplate)
      expect(result.valid).toBe(true)
    })
  })

  describe('instantiate', () => {
    it('should create campaign instance from template', () => {
      const instance = CampaignTemplateBaseService.instantiate(
        RACEJourneyTemplate,
        'test-brand-123',
        new Date('2025-01-01')
      )

      expect(instance.templateId).toBe('race-journey')
      expect(instance.brandId).toBe('test-brand-123')
      expect(instance.pieces).toHaveLength(7)
      expect(instance.status).toBe('draft')
    })
  })
})

// =============================================================================
// UTILITY FUNCTION TESTS
// =============================================================================

describe('Utility Functions', () => {
  describe('createPieceId', () => {
    it('should create formatted piece IDs', () => {
      expect(createPieceId('test', 1)).toBe('test_piece_01')
      expect(createPieceId('test', 10)).toBe('test_piece_10')
    })
  })

  describe('getEmotionalTriggerColor', () => {
    it('should return colors for all triggers', () => {
      const triggers = [
        'curiosity', 'fear', 'hope', 'trust', 'urgency', 'validation',
        'empowerment', 'relief', 'excitement', 'anger', 'surprise', 'pride'
      ] as any[]

      triggers.forEach(trigger => {
        const color = getEmotionalTriggerColor(trigger)
        expect(color).toMatch(/^#[0-9a-f]{6}$/i)
      })
    })
  })

  describe('calculateCampaignHealth', () => {
    it('should calculate health score between 0 and 100', () => {
      const health = calculateCampaignHealth(RACEJourneyTemplate)
      expect(health).toBeGreaterThanOrEqual(0)
      expect(health).toBeLessThanOrEqual(100)
    })
  })
})

// =============================================================================
// TEMPLATE STRUCTURE TESTS
// =============================================================================

describe('Campaign Templates Structure', () => {
  const allTemplates = [
    { name: 'RACE Journey', template: RACEJourneyTemplate, expectedPieces: 7, expectedDays: 21 },
    { name: 'PAS Series', template: PASSeriesTemplate, expectedPieces: 5, expectedDays: 14 },
    { name: 'BAB Campaign', template: BABCampaignTemplate, expectedPieces: 6, expectedDays: 18 },
    { name: 'Trust Ladder', template: TrustLadderTemplate, expectedPieces: 7, expectedDays: 28 },
    { name: 'Hero\'s Journey', template: HerosJourneyTemplate, expectedPieces: 8, expectedDays: 30 },
    { name: 'Product Launch', template: ProductLaunchTemplate, expectedPieces: 7, expectedDays: 14 },
    { name: 'Seasonal Urgency', template: SeasonalUrgencyTemplate, expectedPieces: 5, expectedDays: 10 },
    { name: 'Authority Builder', template: AuthorityBuilderTemplate, expectedPieces: 6, expectedDays: 21 },
    { name: 'Comparison Campaign', template: ComparisonCampaignTemplate, expectedPieces: 5, expectedDays: 14 },
    { name: 'Education First', template: EducationFirstTemplate, expectedPieces: 7, expectedDays: 21 },
    { name: 'Social Proof', template: SocialProofTemplate, expectedPieces: 6, expectedDays: 18 },
    { name: 'Objection Crusher', template: ObjectionCrusherTemplate, expectedPieces: 5, expectedDays: 14 },
    { name: 'Quick Win', template: QuickWinCampaignTemplate, expectedPieces: 4, expectedDays: 7 },
    { name: 'Scarcity Sequence', template: ScarcitySequenceTemplate, expectedPieces: 5, expectedDays: 10 },
    { name: 'Value Stack', template: ValueStackTemplate, expectedPieces: 6, expectedDays: 14 }
  ]

  allTemplates.forEach(({ name, template, expectedPieces, expectedDays }) => {
    describe(name, () => {
      it('should have correct piece count', () => {
        expect(template.pieces).toHaveLength(expectedPieces)
        expect(template.metadata.pieceCount).toBe(expectedPieces)
      })

      it('should have correct duration', () => {
        expect(template.metadata.durationDays).toBe(expectedDays)
      })

      it('should have valid metadata', () => {
        expect(template.metadata.id).toBeDefined()
        expect(template.metadata.name).toBeDefined()
        expect(template.metadata.description).toBeDefined()
        expect(template.metadata.category).toMatch(/^(core-journey|launch|authority|conversion)$/)
        expect(template.metadata.complexity).toMatch(/^(simple|moderate|complex)$/)
        expect(template.metadata.bestFor.length).toBeGreaterThan(0)
        expect(template.metadata.prerequisites.length).toBeGreaterThan(0)
      })

      it('should have valid ROI estimates', () => {
        expect(template.roi.expectedMultiplier).toBeGreaterThanOrEqual(3)
        expect(template.roi.expectedMultiplier).toBeLessThanOrEqual(6)
        expect(template.roi.engagementLift).toBeGreaterThan(0)
        expect(template.roi.conversionLift).toBeGreaterThan(0)
        expect(template.roi.factors.length).toBeGreaterThan(0)
      })

      it('should have emotional progression matching piece count', () => {
        expect(template.emotionalProgression).toHaveLength(expectedPieces)
      })

      it('should have unique piece IDs', () => {
        const ids = template.pieces.map(p => p.id)
        const uniqueIds = new Set(ids)
        expect(ids.length).toBe(uniqueIds.size)
      })

      it('should have pieces within duration', () => {
        template.pieces.forEach(piece => {
          expect(piece.dayOffset).toBeLessThan(expectedDays)
        })
      })

      it('should have valid piece structure', () => {
        template.pieces.forEach(piece => {
          expect(piece.id).toBeDefined()
          expect(piece.title).toBeDefined()
          expect(piece.contentType).toBeDefined()
          expect(piece.emotionalTrigger).toBeDefined()
          expect(piece.objective).toBeDefined()
          expect(piece.raceStage).toBeDefined()
          expect(piece.keyMessage).toBeDefined()
          expect(piece.callToAction).toBeDefined()
          expect(piece.platforms.length).toBeGreaterThan(0)
          expect(piece.estimatedEngagement).toBeGreaterThan(0)
        })
      })
    })
  })
})

// =============================================================================
// REGISTRY TESTS
// =============================================================================

describe('CampaignTemplateRegistry', () => {
  describe('getAll', () => {
    it('should return all 15 templates', () => {
      const templates = CampaignTemplateRegistry.getAll()
      expect(templates).toHaveLength(15)
    })
  })

  describe('getById', () => {
    it('should find template by ID', () => {
      const template = CampaignTemplateRegistry.getById('race-journey')
      expect(template).toBeDefined()
      expect(template?.metadata.name).toBe('RACE Journey Campaign')
    })

    it('should return undefined for non-existent ID', () => {
      const template = CampaignTemplateRegistry.getById('non-existent')
      expect(template).toBeUndefined()
    })
  })

  describe('getByCategory', () => {
    it('should return 5 core-journey templates', () => {
      const templates = CampaignTemplateRegistry.getByCategory('core-journey')
      expect(templates).toHaveLength(5)
    })

    it('should return 2 launch templates', () => {
      const templates = CampaignTemplateRegistry.getByCategory('launch')
      expect(templates).toHaveLength(2)
    })

    it('should return 3 authority templates', () => {
      const templates = CampaignTemplateRegistry.getByCategory('authority')
      expect(templates).toHaveLength(3)
    })

    it('should return 5 conversion templates', () => {
      const templates = CampaignTemplateRegistry.getByCategory('conversion')
      expect(templates).toHaveLength(5)
    })
  })

  describe('getByComplexity', () => {
    it('should return templates by complexity', () => {
      const simple = CampaignTemplateRegistry.getByComplexity('simple')
      const moderate = CampaignTemplateRegistry.getByComplexity('moderate')
      const complex = CampaignTemplateRegistry.getByComplexity('complex')

      expect(simple.length).toBeGreaterThan(0)
      expect(moderate.length).toBeGreaterThan(0)
      expect(complex.length).toBeGreaterThan(0)
      expect(simple.length + moderate.length + complex.length).toBe(15)
    })
  })

  describe('getByDuration', () => {
    it('should filter by duration range', () => {
      const shortCampaigns = CampaignTemplateRegistry.getByDuration(0, 14)
      const longCampaigns = CampaignTemplateRegistry.getByDuration(20, 30)

      shortCampaigns.forEach(t => {
        expect(t.metadata.durationDays).toBeLessThanOrEqual(14)
      })

      longCampaigns.forEach(t => {
        expect(t.metadata.durationDays).toBeGreaterThanOrEqual(20)
      })
    })
  })

  describe('getByMinROI', () => {
    it('should filter by minimum ROI', () => {
      const highROI = CampaignTemplateRegistry.getByMinROI(4.5)

      highROI.forEach(t => {
        expect(t.roi.expectedMultiplier).toBeGreaterThanOrEqual(4.5)
      })
    })
  })

  describe('searchByUseCase', () => {
    it('should find templates by use case', () => {
      const results = CampaignTemplateRegistry.searchByUseCase('product launch')
      expect(results.length).toBeGreaterThan(0)
    })

    it('should find templates by description', () => {
      const results = CampaignTemplateRegistry.searchByUseCase('trust')
      expect(results.length).toBeGreaterThan(0)
    })
  })

  describe('getRecommendationsForGoal', () => {
    it('should return recommendations for build-awareness', () => {
      const recs = CampaignTemplateRegistry.getRecommendationsForGoal('build-awareness')
      expect(recs.length).toBeGreaterThan(0)
    })

    it('should return recommendations for drive-sales', () => {
      const recs = CampaignTemplateRegistry.getRecommendationsForGoal('drive-sales')
      expect(recs.length).toBeGreaterThan(0)
    })
  })

  describe('getQuickStartTemplates', () => {
    it('should return simple, short templates', () => {
      const templates = CampaignTemplateRegistry.getQuickStartTemplates()

      templates.forEach(t => {
        expect(t.metadata.complexity).toBe('simple')
        expect(t.metadata.durationDays).toBeLessThanOrEqual(14)
      })
    })
  })

  describe('validateAll', () => {
    it('should validate all templates successfully', () => {
      const result = CampaignTemplateRegistry.validateAll()
      expect(result.valid).toBe(true)
      expect(result.issues).toHaveLength(0)
    })
  })

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const stats = CampaignTemplateRegistry.getStats()

      expect(stats.totalTemplates).toBe(15)
      expect(stats.totalPieces).toBe(89) // Sum of all piece counts
      expect(stats.avgDuration).toBeGreaterThan(0)
      expect(stats.avgROI).toBeGreaterThan(3)
      expect(stats.categories['core-journey']).toBe(5)
      expect(stats.categories['launch']).toBe(2)
      expect(stats.categories['authority']).toBe(3)
      expect(stats.categories['conversion']).toBe(5)
    })
  })

  describe('getTemplateSummaries', () => {
    it('should return summaries for all templates', () => {
      const summaries = CampaignTemplateRegistry.getTemplateSummaries()

      expect(summaries).toHaveLength(15)
      summaries.forEach(summary => {
        expect(summary.id).toBeDefined()
        expect(summary.name).toBeDefined()
        expect(summary.category).toBeDefined()
        expect(summary.pieces).toBeGreaterThan(0)
        expect(summary.days).toBeGreaterThan(0)
        expect(summary.roi).toBeGreaterThan(0)
        expect(summary.complexity).toBeDefined()
      })
    })
  })
})

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Campaign Templates Integration', () => {
  it('should have consistent IDs between templates and registry', () => {
    CAMPAIGN_TEMPLATES.forEach(template => {
      const found = CampaignTemplateRegistry.getById(template.metadata.id)
      expect(found).toBeDefined()
      expect(found?.metadata.name).toBe(template.metadata.name)
    })
  })

  it('should have all categories covered', () => {
    const categories = new Set(CAMPAIGN_TEMPLATES.map(t => t.metadata.category))
    expect(categories.has('core-journey')).toBe(true)
    expect(categories.has('launch')).toBe(true)
    expect(categories.has('authority')).toBe(true)
    expect(categories.has('conversion')).toBe(true)
  })

  it('should have reasonable total piece count', () => {
    const totalPieces = CAMPAIGN_TEMPLATES.reduce((sum, t) => sum + t.metadata.pieceCount, 0)
    expect(totalPieces).toBe(89)
  })

  it('should cover full range of durations', () => {
    const durations = CAMPAIGN_TEMPLATES.map(t => t.metadata.durationDays).sort((a, b) => a - b)
    expect(Math.min(...durations)).toBe(7)  // Quick Win
    expect(Math.max(...durations)).toBe(30) // Hero's Journey
  })

  it('should have ROI estimates in reasonable range', () => {
    CAMPAIGN_TEMPLATES.forEach(template => {
      expect(template.roi.expectedMultiplier).toBeGreaterThanOrEqual(3)
      expect(template.roi.expectedMultiplier).toBeLessThanOrEqual(6)
    })
  })
})
