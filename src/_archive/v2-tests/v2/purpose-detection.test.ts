/**
 * Purpose Detection Service Tests
 */

import { describe, it, expect } from 'vitest'
import {
  PurposeDetectionService,
  ContentPurpose,
  PurposeSignals,
  PURPOSE_TEMPLATE_MAP,
  PURPOSE_EMOTIONAL_TRIGGERS,
  PURPOSE_METRICS,
  quickDetectPurpose,
  getPurposeIcon,
  getPurposeColor
} from '../../services/v2/purpose-detection.service'

// =============================================================================
// DETECT PURPOSE TESTS
// =============================================================================

describe('PurposeDetectionService.detectPurpose', () => {
  it('should detect timing_play from timing signals', () => {
    const signals: PurposeSignals = {
      seasonalRelevance: true,
      trendingTopic: true,
      deadlinePresent: true
    }

    const result = PurposeDetectionService.detectPurpose(signals)

    expect(result.purpose).toBe('timing_play')
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.allScores.timing_play).toBeGreaterThan(result.allScores.market_gap)
  })

  it('should detect market_gap from competitor signals', () => {
    const signals: PurposeSignals = {
      competitorWeakness: true,
      unaddressedNeed: true,
      marketOpportunity: true
    }

    const result = PurposeDetectionService.detectPurpose(signals)

    expect(result.purpose).toBe('market_gap')
    expect(result.confidence).toBeGreaterThan(0)
  })

  it('should detect contrarian from challenge signals', () => {
    const signals: PurposeSignals = {
      challengesNorm: true,
      controversialTake: true,
      industryMyth: true
    }

    const result = PurposeDetectionService.detectPurpose(signals)

    expect(result.purpose).toBe('contrarian')
  })

  it('should detect validation from proof signals', () => {
    const signals: PurposeSignals = {
      hasTestimonials: true,
      hasMetrics: true,
      caseStudyAvailable: true
    }

    const result = PurposeDetectionService.detectPurpose(signals)

    expect(result.purpose).toBe('validation')
  })

  it('should detect transformation from journey signals', () => {
    const signals: PurposeSignals = {
      beforeAfterExample: true,
      customerJourney: true,
      outcomeProof: true
    }

    const result = PurposeDetectionService.detectPurpose(signals)

    expect(result.purpose).toBe('transformation')
  })

  it('should detect authority from expertise signals', () => {
    const signals: PurposeSignals = {
      expertiseDemo: true,
      dataResearch: true,
      thoughtLeadership: true
    }

    const result = PurposeDetectionService.detectPurpose(signals)

    expect(result.purpose).toBe('authority')
  })

  it('should handle empty signals gracefully', () => {
    const signals: PurposeSignals = {}

    const result = PurposeDetectionService.detectPurpose(signals)

    expect(result.purpose).toBeDefined()
    expect(result.confidence).toBe(0)
  })

  it('should return all scores', () => {
    const signals: PurposeSignals = {
      seasonalRelevance: true
    }

    const result = PurposeDetectionService.detectPurpose(signals)

    expect(result.allScores).toBeDefined()
    expect(Object.keys(result.allScores)).toHaveLength(6)
  })

  it('should handle mixed signals', () => {
    const signals: PurposeSignals = {
      seasonalRelevance: true,
      hasTestimonials: true,
      expertiseDemo: true
    }

    const result = PurposeDetectionService.detectPurpose(signals)

    // Should pick highest scoring purpose
    expect(['timing_play', 'validation', 'authority']).toContain(result.purpose)
  })
})

// =============================================================================
// CATEGORIZE BREAKTHROUGH TESTS
// =============================================================================

describe('PurposeDetectionService.categorizeBreakthrough', () => {
  it('should categorize breakthrough with full details', () => {
    const breakthrough = {
      id: 'test-breakthrough',
      title: 'Test Breakthrough',
      description: 'A test breakthrough',
      dataPoints: [],
      score: 85,
      signals: {
        seasonalRelevance: true,
        trendingTopic: true
      }
    }

    const result = PurposeDetectionService.categorizeBreakthrough(breakthrough)

    expect(result.purpose).toBe('timing_play')
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.signals).toContain('seasonalRelevance')
    expect(result.signals).toContain('trendingTopic')
    expect(result.templateMapping).toBeDefined()
    expect(result.templateMapping.primary).toContain('seasonal-urgency')
    expect(result.reasoning).toBeDefined()
    expect(result.reasoning.length).toBeGreaterThan(0)
  })

  it('should include correct template mappings', () => {
    const breakthrough = {
      id: 'validation-test',
      title: 'Validation Test',
      description: 'Testing validation',
      dataPoints: [],
      score: 75,
      signals: {
        hasTestimonials: true,
        hasMetrics: true
      }
    }

    const result = PurposeDetectionService.categorizeBreakthrough(breakthrough)

    expect(result.purpose).toBe('validation')
    expect(result.templateMapping.primary).toContain('social-proof')
    expect(result.templateMapping.primary).toContain('trust-ladder')
  })

  it('should generate meaningful reasoning', () => {
    const breakthrough = {
      id: 'contrarian-test',
      title: 'Contrarian Test',
      description: 'Testing contrarian',
      dataPoints: [],
      score: 80,
      signals: {
        challengesNorm: true,
        controversialTake: true
      }
    }

    const result = PurposeDetectionService.categorizeBreakthrough(breakthrough)

    expect(result.reasoning).toContain('challenges conventional wisdom')
    expect(result.reasoning).toContain('Confidence')
  })
})

// =============================================================================
// ALIGN CONTENT TO PURPOSE TESTS
// =============================================================================

describe('PurposeDetectionService.alignContentToPurpose', () => {
  it('should align timing_play content correctly', () => {
    const signals: PurposeSignals = {
      seasonalRelevance: true,
      trendingTopic: true
    }

    const result = PurposeDetectionService.alignContentToPurpose('timing_play', signals)

    expect(result.purpose).toBe('timing_play')
    expect(result.recommendedCampaigns.length).toBeGreaterThan(0)
    expect(result.recommendedCampaigns[0].templateId).toBe('seasonal-urgency')
    expect(result.emotionalTriggers).toContain('urgency')
    expect(result.targetMetrics.primaryKPI).toBe('revenue')
  })

  it('should align market_gap content correctly', () => {
    const signals: PurposeSignals = {
      competitorWeakness: true
    }

    const result = PurposeDetectionService.alignContentToPurpose('market_gap', signals)

    expect(result.recommendedCampaigns[0].templateId).toBe('pas-series')
    expect(result.emotionalTriggers).toContain('curiosity')
  })

  it('should include fit scores in recommendations', () => {
    const signals: PurposeSignals = {}

    const result = PurposeDetectionService.alignContentToPurpose('validation', signals)

    const fitScores = result.recommendedCampaigns.map(r => r.fitScore)

    // Primary should have higher scores than secondary
    expect(fitScores[0]).toBeGreaterThan(80)
    expect(fitScores[fitScores.length - 1]).toBeLessThan(80)
  })

  it('should include ROI estimates', () => {
    const signals: PurposeSignals = {}

    const result = PurposeDetectionService.alignContentToPurpose('transformation', signals)

    result.recommendedCampaigns.forEach(rec => {
      expect(rec.expectedROI).toBeGreaterThan(3)
      expect(rec.expectedROI).toBeLessThan(6)
    })
  })

  it('should include content templates', () => {
    const signals: PurposeSignals = {}

    const result = PurposeDetectionService.alignContentToPurpose('authority', signals)

    expect(result.contentTemplates).toBeDefined()
    expect(result.contentTemplates.length).toBeGreaterThan(0)
  })
})

// =============================================================================
// UTILITY METHOD TESTS
// =============================================================================

describe('PurposeDetectionService utility methods', () => {
  describe('getPurposeDescription', () => {
    it('should return description for all purposes', () => {
      const purposes: ContentPurpose[] = [
        'market_gap', 'timing_play', 'contrarian',
        'validation', 'transformation', 'authority'
      ]

      purposes.forEach(purpose => {
        const description = PurposeDetectionService.getPurposeDescription(purpose)
        expect(description).toBeDefined()
        expect(description.length).toBeGreaterThan(10)
      })
    })
  })

  describe('getAllPurposes', () => {
    it('should return all 6 purposes', () => {
      const purposes = PurposeDetectionService.getAllPurposes()

      expect(purposes).toHaveLength(6)
      expect(purposes.map(p => p.id)).toContain('market_gap')
      expect(purposes.map(p => p.id)).toContain('timing_play')
      expect(purposes.map(p => p.id)).toContain('contrarian')
      expect(purposes.map(p => p.id)).toContain('validation')
      expect(purposes.map(p => p.id)).toContain('transformation')
      expect(purposes.map(p => p.id)).toContain('authority')
    })

    it('should include descriptions', () => {
      const purposes = PurposeDetectionService.getAllPurposes()

      purposes.forEach(purpose => {
        expect(purpose.description).toBeDefined()
        expect(purpose.description.length).toBeGreaterThan(0)
      })
    })
  })

  describe('suggestPurposeByScore', () => {
    it('should suggest campaign-worthy purposes for high scores', () => {
      const suggestions = PurposeDetectionService.suggestPurposeByScore(90)

      expect(suggestions).toContain('transformation')
      expect(suggestions).toContain('authority')
    })

    it('should suggest different purposes for medium scores', () => {
      const suggestions = PurposeDetectionService.suggestPurposeByScore(65)

      expect(suggestions).toContain('timing_play')
      expect(suggestions).toContain('market_gap')
    })

    it('should suggest simple purposes for lower scores', () => {
      const suggestions = PurposeDetectionService.suggestPurposeByScore(50)

      expect(suggestions).toContain('timing_play')
      expect(suggestions).toContain('market_gap')
    })
  })

  describe('calculatePurposeCompatibility', () => {
    it('should confirm single purpose is compatible', () => {
      const result = PurposeDetectionService.calculatePurposeCompatibility(['market_gap'])

      expect(result.compatible).toBe(true)
    })

    it('should confirm same purposes are compatible', () => {
      const result = PurposeDetectionService.calculatePurposeCompatibility([
        'authority', 'authority', 'authority'
      ])

      expect(result.compatible).toBe(true)
    })

    it('should recognize compatible pairs', () => {
      const result = PurposeDetectionService.calculatePurposeCompatibility([
        'validation', 'transformation'
      ])

      expect(result.compatible).toBe(true)
    })

    it('should flag potentially incompatible purposes', () => {
      const result = PurposeDetectionService.calculatePurposeCompatibility([
        'timing_play', 'authority', 'validation'
      ])

      // This may or may not be compatible based on the pairs defined
      expect(result.reason).toBeDefined()
    })
  })
})

// =============================================================================
// MAPPING TESTS
// =============================================================================

describe('Purpose Template Mappings', () => {
  it('should have mappings for all purposes', () => {
    const purposes: ContentPurpose[] = [
      'market_gap', 'timing_play', 'contrarian',
      'validation', 'transformation', 'authority'
    ]

    purposes.forEach(purpose => {
      const mapping = PURPOSE_TEMPLATE_MAP[purpose]
      expect(mapping).toBeDefined()
      expect(mapping.primary.length).toBeGreaterThan(0)
      expect(mapping.secondary.length).toBeGreaterThan(0)
      expect(mapping.contentTypes.length).toBeGreaterThan(0)
    })
  })

  it('should have emotional triggers for all purposes', () => {
    const purposes: ContentPurpose[] = [
      'market_gap', 'timing_play', 'contrarian',
      'validation', 'transformation', 'authority'
    ]

    purposes.forEach(purpose => {
      const triggers = PURPOSE_EMOTIONAL_TRIGGERS[purpose]
      expect(triggers).toBeDefined()
      expect(triggers.length).toBeGreaterThanOrEqual(3)
    })
  })

  it('should have metrics for all purposes', () => {
    const purposes: ContentPurpose[] = [
      'market_gap', 'timing_play', 'contrarian',
      'validation', 'transformation', 'authority'
    ]

    purposes.forEach(purpose => {
      const metrics = PURPOSE_METRICS[purpose]
      expect(metrics).toBeDefined()
      expect(metrics.primaryKPI).toBeDefined()
      expect(metrics.secondaryKPIs.length).toBeGreaterThan(0)
      expect(Object.keys(metrics.benchmarks).length).toBeGreaterThan(0)
    })
  })

  it('should map timing_play to urgency templates', () => {
    const mapping = PURPOSE_TEMPLATE_MAP.timing_play
    expect(mapping.primary).toContain('seasonal-urgency')
    expect(mapping.primary).toContain('scarcity-sequence')
  })

  it('should map validation to social proof templates', () => {
    const mapping = PURPOSE_TEMPLATE_MAP.validation
    expect(mapping.primary).toContain('social-proof')
    expect(mapping.primary).toContain('trust-ladder')
  })
})

// =============================================================================
// UTILITY FUNCTION TESTS
// =============================================================================

describe('Utility functions', () => {
  describe('quickDetectPurpose', () => {
    it('should detect timing_play from trend', () => {
      const result = quickDetectPurpose({ hasTrend: true })
      expect(result).toBe('timing_play')
    })

    it('should detect timing_play from deadline', () => {
      const result = quickDetectPurpose({ hasDeadline: true })
      expect(result).toBe('timing_play')
    })

    it('should detect contrarian from norm challenge', () => {
      const result = quickDetectPurpose({ challengesNorm: true })
      expect(result).toBe('contrarian')
    })

    it('should detect validation from testimonial', () => {
      const result = quickDetectPurpose({ hasTestimonial: true })
      expect(result).toBe('validation')
    })

    it('should detect transformation from transformation indicator', () => {
      const result = quickDetectPurpose({ showsTransformation: true })
      expect(result).toBe('transformation')
    })

    it('should detect authority from expertise', () => {
      const result = quickDetectPurpose({ demonstratesExpertise: true })
      expect(result).toBe('authority')
    })

    it('should default to market_gap', () => {
      const result = quickDetectPurpose({})
      expect(result).toBe('market_gap')
    })
  })

  describe('getPurposeIcon', () => {
    it('should return icons for all purposes', () => {
      const purposes: ContentPurpose[] = [
        'market_gap', 'timing_play', 'contrarian',
        'validation', 'transformation', 'authority'
      ]

      purposes.forEach(purpose => {
        const icon = getPurposeIcon(purpose)
        expect(icon).toBeDefined()
        expect(icon.length).toBeGreaterThan(0)
      })
    })

    it('should return expected icons', () => {
      expect(getPurposeIcon('timing_play')).toBe('clock')
      expect(getPurposeIcon('validation')).toBe('check-circle')
      expect(getPurposeIcon('authority')).toBe('award')
    })
  })

  describe('getPurposeColor', () => {
    it('should return colors for all purposes', () => {
      const purposes: ContentPurpose[] = [
        'market_gap', 'timing_play', 'contrarian',
        'validation', 'transformation', 'authority'
      ]

      purposes.forEach(purpose => {
        const color = getPurposeColor(purpose)
        expect(color).toMatch(/^#[0-9a-f]{6}$/i)
      })
    })

    it('should return expected colors', () => {
      expect(getPurposeColor('timing_play')).toBe('#f97316')
      expect(getPurposeColor('validation')).toBe('#22c55e')
    })
  })
})

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Purpose Detection Integration', () => {
  it('should work end-to-end for timing play', () => {
    const signals: PurposeSignals = {
      seasonalRelevance: true,
      trendingTopic: true,
      deadlinePresent: true
    }

    // Detect purpose
    const detection = PurposeDetectionService.detectPurpose(signals)
    expect(detection.purpose).toBe('timing_play')

    // Align content
    const alignment = PurposeDetectionService.alignContentToPurpose(detection.purpose, signals)

    // Should recommend urgency-based templates
    const templateIds = alignment.recommendedCampaigns.map(r => r.templateId)
    expect(templateIds).toContain('seasonal-urgency')
    expect(templateIds).toContain('scarcity-sequence')

    // Should have urgency trigger
    expect(alignment.emotionalTriggers).toContain('urgency')

    // Should target revenue
    expect(alignment.targetMetrics.primaryKPI).toBe('revenue')
  })

  it('should work end-to-end for authority building', () => {
    const signals: PurposeSignals = {
      expertiseDemo: true,
      dataResearch: true,
      thoughtLeadership: true,
      industryPrediction: true
    }

    // Detect purpose
    const detection = PurposeDetectionService.detectPurpose(signals)
    expect(detection.purpose).toBe('authority')

    // Align content
    const alignment = PurposeDetectionService.alignContentToPurpose(detection.purpose, signals)

    // Should recommend authority templates
    const templateIds = alignment.recommendedCampaigns.map(r => r.templateId)
    expect(templateIds).toContain('authority-builder')
    expect(templateIds).toContain('education-first')

    // Should have trust trigger
    expect(alignment.emotionalTriggers).toContain('trust')
  })

  it('should handle breakthrough categorization pipeline', () => {
    const breakthrough = {
      id: 'pipeline-test',
      title: 'Market Gap Discovery',
      description: 'Found competitor weakness',
      dataPoints: [],
      score: 78,
      signals: {
        competitorWeakness: true,
        unaddressedNeed: true
      }
    }

    // Categorize
    const category = PurposeDetectionService.categorizeBreakthrough(breakthrough)

    // Align
    const alignment = PurposeDetectionService.alignContentToPurpose(
      category.purpose,
      breakthrough.signals
    )

    // Verify coherent output
    expect(category.purpose).toBe('market_gap')
    expect(alignment.recommendedCampaigns[0].templateId).toBe('pas-series')
    expect(category.templateMapping.primary).toContain('pas-series')
  })
})
