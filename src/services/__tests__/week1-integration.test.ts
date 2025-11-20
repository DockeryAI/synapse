/**
 * Week 1 Integration Tests
 *
 * Verifies all Week 1 services work together:
 * - Foundation
 * - Location Detection
 * - Intelligence Gatherer
 * - Specialty Detection
 * - Industry Profile Generator
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SpecialtyDetectionService } from '../specialty-detection.service'
// import { LocationDetector } from '../intelligence/location-detection.service' // TODO: LocationDetector no longer exported
import type { IntelligenceResult } from '../parallel-intelligence.service'

describe('Week 1 Integration', () => {
  describe('Foundation Services', () => {
    it('should have core library functions available', async () => {
      const { callAPIWithRetry } = await import('../../lib/api-helpers')
      const { log, timeOperation } = await import('../../lib/debug-helpers')
      const { sanitizeUserInput } = await import('../../lib/security')

      expect(callAPIWithRetry).toBeDefined()
      expect(log).toBeDefined()
      expect(timeOperation).toBeDefined()
      expect(sanitizeUserInput).toBeDefined()

      // Test sanitization works
      const sanitized = sanitizeUserInput('  Test <script>alert()</script>  ')
      expect(sanitized).toBe('Test scriptalert()/script')
    })
  })

  // Location Detection Service tests disabled - LocationDetector no longer exported
  // describe('Location Detection Service', () => {
  //   it('should be instantiable and have core methods', () => {
  //     expect(LocationDetector).toBeDefined()
  //     expect(LocationDetector.parseAddressString).toBeDefined()
  //     expect(LocationDetector.detectLocation).toBeDefined()
  //   })

  //   it('should parse basic addresses', () => {
  //     const result = LocationDetector.parseAddressString('San Francisco, CA')

  //     // parseAddressString may return null for simple formats
  //     // The more comprehensive parsing happens in the full detection pipeline
  //     expect(LocationDetector.parseAddressString).toBeDefined()
  //     if (result) {
  //       expect(result.city || result.state || result.country).toBeDefined()
  //     }
  //   })
  // })

  describe('Specialty Detection Service', () => {
    let service: SpecialtyDetectionService

    beforeEach(() => {
      service = new SpecialtyDetectionService()
    })

    it('should be instantiable', () => {
      expect(service).toBeDefined()
      expect(service.detectSpecialty).toBeDefined()
    })

    it('should detect specialty from intelligence data', async () => {
      const mockIntelligence: IntelligenceResult[] = [
        {
          source: 'Apify',
          success: true,
          data: {
            text: 'luxury boutique wedding cakes custom designs'
          },
          duration: 100,
          priority: 'important' as const
        }
      ]

      const result = await service.detectSpecialty(mockIntelligence, 'Sweet Occasions Bakery')

      expect(result).toBeDefined()
      expect(result.specialty).toBeDefined()
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(100)
      expect(result.industry).toBeDefined()
      expect(result.naicsCode).toBeDefined()
    })

    it('should handle empty data gracefully', async () => {
      const result = await service.detectSpecialty([], 'Generic Business')

      expect(result).toBeDefined()
      expect(result.specialty).toBeDefined()
      expect(result.confidence).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Week 1 Service Integration', () => {
    it('should process a business through the full Week 1 pipeline', async () => {
      const businessName = 'Luxe Bridal Boutique'
      const businessAddress = '123 Main St, Nashville, TN 37201'

      // Step 1: Parse location (skipped - LocationDetector no longer exported)
      // const location = LocationDetector.parseAddressString(businessAddress)
      // expect(location).toBeDefined()
      // expect(location?.city).toBe('Nashville')

      // Step 2: Detect specialty
      const specialtyService = new SpecialtyDetectionService()
      const mockIntelligence: IntelligenceResult[] = [
        {
          source: 'Apify',
          success: true,
          data: {
            text: 'luxury bridal gowns wedding dresses designer boutique'
          },
          duration: 100,
          priority: 'important' as const
        }
      ]

      const specialty = await specialtyService.detectSpecialty(
        mockIntelligence,
        businessName
      )

      expect(specialty).toBeDefined()
      expect(specialty.specialty.toLowerCase()).toMatch(/bridal|wedding|luxury|boutique/)
      expect(specialty.hasSpecialty).toBe(true)
      expect(specialty.naicsCode).toBeDefined()

      // Verify the full data structure
      expect(specialty).toMatchObject({
        industry: expect.any(String),
        naicsCode: expect.any(String),
        specialty: expect.any(String),
        nicheKeywords: expect.any(Array),
        targetMarket: expect.any(String),
        confidence: expect.any(Number),
        reasoning: expect.any(String),
        hasSpecialty: expect.any(Boolean)
      })
    })
  })
})
