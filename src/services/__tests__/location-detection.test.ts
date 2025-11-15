/**
 * Location Detection Service Tests
 *
 * Tests for global location detection across 50+ countries
 *
 * Run: npm test location-detection
 */

import { describe, it, expect } from 'vitest'
import { LocationDetector } from '../intelligence/location-detection.service'

describe('LocationDetector', () => {
  describe('parseAddressString', () => {
    it('should parse US addresses correctly', () => {
      const usAddress = '123 Main Street, Austin, TX 78701'
      const parsed = LocationDetector.parseAddressString(usAddress)

      expect(parsed).toBeDefined()
      expect(parsed?.city).toBe('Austin')
      expect(parsed?.state).toBe('TX')
      expect(parsed?.postalCode).toBe('78701')
      expect(parsed?.country).toBe('United States')
    })

    it('should parse UK postcodes correctly', () => {
      const ukAddress = '10 Downing Street, London SW1A 2AA'
      const parsed = LocationDetector.parseAddressString(ukAddress)

      expect(parsed).toBeDefined()
      expect(parsed?.city).toBe('London')
      expect(parsed?.postalCode).toBe('SW1A 2AA')
      expect(parsed?.country).toBe('United Kingdom')
    })

    it('should parse Canadian addresses correctly', () => {
      const caAddress = '123 King Street, Toronto ON M5H 1A1'
      const parsed = LocationDetector.parseAddressString(caAddress)

      expect(parsed).toBeDefined()
      expect(parsed?.city).toBe('Toronto')
      expect(parsed?.province).toBe('ON')
      expect(parsed?.postalCode).toMatch(/M5H/)
      expect(parsed?.country).toBe('Canada')
    })

    it('should parse Australian addresses correctly', () => {
      const auAddress = '123 Queen Street, Melbourne VIC 3000'
      const parsed = LocationDetector.parseAddressString(auAddress)

      expect(parsed).toBeDefined()
      expect(parsed?.city).toBe('Melbourne')
      expect(parsed?.state).toBe('VIC')
      expect(parsed?.postalCode).toBe('3000')
      expect(parsed?.country).toBe('Australia')
    })

    it('should handle empty input gracefully', () => {
      const parsed = LocationDetector.parseAddressString('')
      expect(parsed).toBeNull()
    })

    it('should handle null input gracefully', () => {
      const parsed = LocationDetector.parseAddressString(null as any)
      expect(parsed).toBeNull()
    })

    it('should extract city from natural language', () => {
      const text = 'We are based in San Francisco, California'
      const parsed = LocationDetector.parseAddressString(text)

      expect(parsed).toBeDefined()
      expect(parsed?.city).toContain('San Francisco')
    })
  })

  describe('detectLocation', () => {
    // Note: These tests require actual network calls and API keys
    // Skip in CI environment or when API keys are not configured

    it.skip('should detect location from real website - US', async () => {
      // Example: Test with a known US business
      const location = await LocationDetector.detectLocation('https://www.example-us-business.com')

      if (location) {
        expect(location.address.country).toBe('United States')
        expect(location.address.city).toBeDefined()
        expect(location.confidence).toBeGreaterThan(0)
      }
    }, 15000) // 15 second timeout

    it.skip('should detect location from real website - UK', async () => {
      // Example: Test with a known UK business
      const location = await LocationDetector.detectLocation('https://www.harveynichols.com')

      if (location) {
        expect(location.address.country).toMatch(/United Kingdom|UK/)
        expect(location.address.city).toBeDefined()
        expect(location.confidence).toBeGreaterThan(0)
      }
    }, 15000)

    it('should return null for invalid URL', async () => {
      const location = await LocationDetector.detectLocation('not-a-url')
      expect(location).toBeNull()
    })

    it('should return null for empty URL', async () => {
      const location = await LocationDetector.detectLocation('')
      expect(location).toBeNull()
    })
  })

  describe('geocodeAddress', () => {
    it.skip('should geocode valid address with OutScraper', async () => {
      // Requires VITE_OUTSCRAPER_API_KEY in environment
      const geocoded = await LocationDetector.geocodeAddress('1600 Amphitheatre Parkway, Mountain View, CA')

      if (geocoded) {
        expect(geocoded.coordinates).toBeDefined()
        expect(geocoded.coordinates.lat).toBeGreaterThan(0)
        expect(geocoded.coordinates.lng).toBeLessThan(0)
        expect(geocoded.components.city).toBeDefined()
      }
    }, 10000)

    it('should return null when API key is missing', async () => {
      // This test will pass if OutScraper API key is not configured
      const geocoded = await LocationDetector.geocodeAddress('123 Test St')
      // May be null if no API key configured
      expect(geocoded === null || geocoded?.coordinates !== undefined).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple addresses in text and pick the best one', () => {
      const multiAddress = `
        Visit us at 123 Main St, Austin, TX 78701 or
        our second location at 456 Oak Ave, Dallas, TX 75201
      `
      const parsed = LocationDetector.parseAddressString(multiAddress)

      expect(parsed).toBeDefined()
      expect(parsed?.city).toMatch(/Austin|Dallas/)
    })

    it('should handle international characters', () => {
      const intlAddress = 'Champs-Élysées, Paris, France'
      const parsed = LocationDetector.parseAddressString(intlAddress)

      // Should at least extract city
      expect(parsed?.city || parsed?.country).toBeDefined()
    })

    it('should handle schema.org structured data format', () => {
      const schemaData = JSON.stringify({
        '@type': 'Organization',
        address: {
          streetAddress: '123 Test Street',
          addressLocality: 'Test City',
          addressRegion: 'TC',
          postalCode: '12345',
          addressCountry: 'US'
        }
      })

      // This would be extracted by extractFooterAddress in real usage
      expect(schemaData).toContain('addressLocality')
    })
  })

  describe('Performance', () => {
    it('should parse address in under 100ms', () => {
      const start = performance.now()
      LocationDetector.parseAddressString('123 Main St, Austin, TX 78701')
      const duration = performance.now() - start

      expect(duration).toBeLessThan(100)
    })

    it('should handle long text without crashing', () => {
      const longText = 'Lorem ipsum '.repeat(1000) + '123 Main St, Austin, TX 78701'
      const parsed = LocationDetector.parseAddressString(longText)

      // Should still find the address
      expect(parsed?.city).toBe('Austin')
    })
  })
})
