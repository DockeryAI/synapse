/**
 * Specialty Detection Service Tests
 * Following PATTERNS.md testing standards
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SpecialtyDetectionService } from '../specialty-detection.service'
import type { IntelligenceResult } from '../parallel-intelligence.service'

describe('SpecialtyDetectionService', () => {
  let service: SpecialtyDetectionService

  beforeEach(() => {
    service = new SpecialtyDetectionService()
  })

  // Success case
  it('detects wedding bakery specialty', async () => {
    const mockData: IntelligenceResult[] = [
      {
        source: 'Apify',
        success: true,
        data: {
          text: 'wedding cakes custom vegan bakery specializing in wedding events celebrations'
        }
      },
      {
        source: 'OutScraper-Business',
        success: true,
        data: {
          description: 'We create beautiful wedding cakes for your special day'
        }
      }
    ]

    const result = await service.detectSpecialty(mockData, 'Sweet Wedding Cakes')

    expect(result).toBeDefined()
    expect(result.specialty).toContain('wedding' || 'bakery')
    expect(result.hasSpecialty).toBe(true)
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.nicheKeywords.length).toBeGreaterThan(0)
  })

  // Generic business test
  it('classifies generic businesses correctly', async () => {
    const mockData: IntelligenceResult[] = [
      {
        source: 'Apify',
        success: true,
        data: {
          text: 'general business services consulting'
        }
      }
    ]

    const result = await service.detectSpecialty(mockData, 'Business Services Inc')

    expect(result).toBeDefined()
    expect(result.confidence).toBeGreaterThanOrEqual(0)
  })

  // Error case - empty business name
  it('handles empty business name', async () => {
    const mockData: IntelligenceResult[] = []

    const result = await service.detectSpecialty(mockData, '')

    expect(result).toBeDefined()
    expect(result.confidence).toBe(0)
    expect(result.hasSpecialty).toBe(false)
  })

  // Error case - no intelligence data
  it('handles missing intelligence data', async () => {
    const result = await service.detectSpecialty([], 'Test Business')

    expect(result).toBeDefined()
    expect(result.specialty).toBe('Test Business')
  })

  // Keyword extraction test
  it('extracts specialty keywords correctly', async () => {
    const mockData: IntelligenceResult[] = [
      {
        source: 'Apify',
        success: true,
        data: {
          text: 'luxury premium boutique handmade artisan custom luxury premium boutique'
        }
      }
    ]

    const result = await service.detectSpecialty(mockData, 'Luxury Boutique')

    expect(result.nicheKeywords.length).toBeGreaterThan(0)
    expect(result.nicheKeywords.some(k => ['luxury', 'premium', 'boutique'].includes(k))).toBe(true)
  })

  // Target market detection
  it('identifies target market from specialty', async () => {
    const mockData: IntelligenceResult[] = [
      {
        source: 'Apify',
        success: true,
        data: {
          text: 'pediatric dental care for children and families'
        }
      }
    ]

    const result = await service.detectSpecialty(mockData, 'Pediatric Dental')

    expect(result.targetMarket).toBeDefined()
    expect(result.targetMarket.length).toBeGreaterThan(0)
  })

  // Confidence scoring test
  it('calculates confidence score correctly', async () => {
    const mockData: IntelligenceResult[] = [
      {
        source: 'Apify',
        success: true,
        data: { text: 'vegan organic wedding cakes' }
      },
      {
        source: 'OutScraper-Business',
        success: true,
        data: { description: 'specializing in vegan wedding cakes' }
      },
      {
        source: 'Serper-Search',
        success: true,
        data: {
          organic: [
            { snippet: 'vegan wedding cake specialist' }
          ]
        }
      }
    ]

    const result = await service.detectSpecialty(mockData, 'Vegan Wedding Cakes')

    expect(result.confidence).toBeGreaterThan(50)
    expect(result.confidence).toBeLessThanOrEqual(100)
  })

  // Performance test
  it('completes in reasonable time', async () => {
    const mockData: IntelligenceResult[] = [
      {
        source: 'Apify',
        success: true,
        data: { text: 'bakery cakes bread pastries' }
      }
    ]

    const start = Date.now()
    await service.detectSpecialty(mockData, 'Local Bakery')
    const duration = Date.now() - start

    expect(duration).toBeLessThan(5000) // 5 seconds
  })
})
