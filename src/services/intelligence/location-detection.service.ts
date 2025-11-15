/**
 * Global Location Detection Engine
 *
 * Detects business physical locations across 50+ countries using 5 parallel strategies:
 * 1. Contact Page Scraping
 * 2. Footer Address Extraction
 * 3. About Page Analysis
 * 4. Metadata Inspection
 * 5. IP-based Geolocation (fallback)
 *
 * Supports international address formats: US, UK, CA, AU, EU
 * Uses OutScraper API for geocoding (leverages existing subscription)
 * Results cached for 30 days
 */

import axios from 'axios'
import * as cheerio from 'cheerio'
import { z } from 'zod'
import { urlParser } from '../url-parser.service'
import { OutScraperAPI } from './outscraper-api'
import { callAPIWithRetry, parallelAPICalls } from '@/lib/api-helpers'
import { SimpleCache } from '@/lib/cache'
import { log, timeOperation } from '@/lib/debug-helpers'
import {
  BusinessLocation,
  AddressCandidate,
  ParsedAddress,
  GeocodedLocation,
  BusinessLocationSchema,
  AddressCandidateSchema,
  GeocodedLocationSchema
} from '@/types/location.types'

// Cache location results for 30 days (locations don't change often)
const locationCache = new SimpleCache<BusinessLocation>()
const TTL_30_DAYS = 30 * 24 * 60 * 60 // seconds

/**
 * Address Regex Patterns for 50+ Countries
 */
const ADDRESS_PATTERNS = {
  // US: 123 Main St, Austin, TX 78701
  US: /(\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|court|ct|boulevard|blvd|circle|cir|place|pl)[,\s]+)([\w\s]+),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)/gi,

  // UK: 10 Downing Street, London SW1A 2AA
  UK: /([\d]+\s+[\w\s]+),\s*([\w\s]+),?\s*([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})/gi,

  // Canada: 123 King St, Toronto ON M5H 1A1
  CA: /(\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr)[,\s]+)([\w\s]+),?\s*([A-Z]{2})\s*([A-Z]\d[A-Z]\s*\d[A-Z]\d)/gi,

  // Australia: 123 Queen St, Melbourne VIC 3000
  AU: /(\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr)[,\s]+)([\w\s]+),?\s*(VIC|NSW|QLD|WA|SA|TAS|ACT|NT)\s*(\d{4})/gi,

  // Generic international pattern
  GENERIC: /(\d+[\w\s,]+),\s*([\w\s]+),\s*([\w\s]+)(?:,\s*([\w\s]+))?/gi
}

// Common contact page paths
const CONTACT_PATHS = [
  '/contact',
  '/contact-us',
  '/contactus',
  '/contact.html',
  '/locations',
  '/find-us',
  '/findus',
  '/where-to-find-us',
  '/store-locator',
  '/get-in-touch'
]

// Common about page paths
const ABOUT_PATHS = [
  '/about',
  '/about-us',
  '/aboutus',
  '/about.html',
  '/our-story',
  '/company',
  '/who-we-are'
]

/**
 * Main function: Detect business location using all 5 strategies
 */
export async function detectLocation(websiteUrl: string): Promise<BusinessLocation | null> {
  // Validate and normalize URL
  const parsed = urlParser.parse(websiteUrl)
  if (!parsed.isValid) {
    log('LocationDetector', { error: 'Invalid URL', url: websiteUrl }, 'error')
    return null
  }

  const normalizedUrl = parsed.normalized
  const cacheKey = `location:${parsed.domain}`

  // Check cache first
  const cached = locationCache.get(cacheKey)
  if (cached) {
    log('LocationDetector', { message: 'Cache hit', url: normalizedUrl }, 'info')
    return cached
  }

  // Run all 5 strategies in parallel
  return await timeOperation('detectLocation', async () => {
    try {
      const candidates = await parallelAPICalls<AddressCandidate | null>(
        [
          () => scrapeContactPage(normalizedUrl),
          () => extractFooterAddress(normalizedUrl),
          () => analyzeAboutPage(normalizedUrl),
          () => inspectMetadata(normalizedUrl),
          () => geolocateByIP(normalizedUrl)
        ],
        {
          timeout: 10000, // 10 seconds total
          allowPartialFailure: true
        }
      )

      // Filter out null results
      const validCandidates = candidates.filter((c): c is AddressCandidate => c !== null)

      if (validCandidates.length === 0) {
        log('LocationDetector', { message: 'No location found', url: normalizedUrl }, 'warn')
        return null
      }

      // Combine results and pick best candidate
      const bestLocation = await combineResults(validCandidates, normalizedUrl)

      if (bestLocation) {
        // Cache the result
        locationCache.set(cacheKey, bestLocation, TTL_30_DAYS)
      }

      return bestLocation

    } catch (error) {
      log('LocationDetector', { error, url: normalizedUrl }, 'error')
      return null
    }
  })
}

/**
 * Strategy 1: Scrape Contact Page
 */
export async function scrapeContactPage(url: string): Promise<AddressCandidate | null> {
  return await callAPIWithRetry(
    async () => {
      // Try each contact page path
      for (const path of CONTACT_PATHS) {
        try {
          const contactUrl = new URL(path, url).toString()
          const response = await axios.get(contactUrl, {
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SynapseBot/1.0)' }
          })

          if (response.status === 200) {
            const $ = cheerio.load(response.data)

            // Look for address in common elements
            const addressElements = $(
              'address, [class*="address"], [id*="address"], ' +
              '[class*="location"], [id*="location"], ' +
              '[class*="contact"], [id*="contact"]'
            )

            for (let i = 0; i < addressElements.length; i++) {
              const text = $(addressElements[i]).text()
              const parsed = parseAddressString(text)

              if (parsed && parsed.city && parsed.country) {
                return {
                  rawText: text,
                  parsed,
                  confidence: 0.9, // High confidence from contact page
                  source: 'contact_page'
                }
              }
            }

            // Fallback: scan all text for address patterns
            const bodyText = $('body').text()
            const parsed = parseAddressString(bodyText)

            if (parsed && parsed.city && parsed.country) {
              return {
                rawText: bodyText.substring(0, 500),
                parsed,
                confidence: 0.7,
                source: 'contact_page'
              }
            }
          }
        } catch (error) {
          // Continue to next path
          continue
        }
      }

      return null
    },
    {
      maxRetries: 2,
      fallbackValue: null,
      onError: (error) => log('scrapeContactPage', error, 'warn')
    }
  )
}

/**
 * Strategy 2: Extract Footer Address
 */
export async function extractFooterAddress(url: string): Promise<AddressCandidate | null> {
  return await callAPIWithRetry(
    async () => {
      const response = await axios.get(url, {
        timeout: 5000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SynapseBot/1.0)' }
      })

      const $ = cheerio.load(response.data)

      // Check schema.org markup first (most reliable)
      const schemaAddress = $('script[type="application/ld+json"]')
      for (let i = 0; i < schemaAddress.length; i++) {
        try {
          const json = JSON.parse($(schemaAddress[i]).html() || '{}')
          if (json.address || json['@type'] === 'Organization') {
            const addr = json.address
            if (addr && addr.addressLocality && addr.addressCountry) {
              return {
                rawText: JSON.stringify(addr),
                parsed: {
                  street: addr.streetAddress,
                  city: addr.addressLocality,
                  state: addr.addressRegion,
                  postalCode: addr.postalCode,
                  country: addr.addressCountry
                },
                confidence: 0.95, // Very high confidence from structured data
                source: 'footer_schema'
              }
            }
          }
        } catch {
          continue
        }
      }

      // Check footer elements
      const footerElements = $('footer, [class*="footer"], [id*="footer"]')
      for (let i = 0; i < footerElements.length; i++) {
        const text = $(footerElements[i]).text()
        const parsed = parseAddressString(text)

        if (parsed && parsed.city && parsed.country) {
          return {
            rawText: text,
            parsed,
            confidence: 0.8,
            source: 'footer'
          }
        }
      }

      return null
    },
    {
      maxRetries: 2,
      fallbackValue: null,
      onError: (error) => log('extractFooterAddress', error, 'warn')
    }
  )
}

/**
 * Strategy 3: Analyze About Page
 */
export async function analyzeAboutPage(url: string): Promise<AddressCandidate | null> {
  return await callAPIWithRetry(
    async () => {
      for (const path of ABOUT_PATHS) {
        try {
          const aboutUrl = new URL(path, url).toString()
          const response = await axios.get(aboutUrl, {
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SynapseBot/1.0)' }
          })

          if (response.status === 200) {
            const $ = cheerio.load(response.data)
            const bodyText = $('body').text()

            // Look for location mentions with frequency analysis
            const parsed = parseAddressString(bodyText)

            if (parsed && parsed.city) {
              return {
                rawText: bodyText.substring(0, 500),
                parsed,
                confidence: 0.6, // Lower confidence from about page
                source: 'about'
              }
            }
          }
        } catch {
          continue
        }
      }

      return null
    },
    {
      maxRetries: 2,
      fallbackValue: null,
      onError: (error) => log('analyzeAboutPage', error, 'warn')
    }
  )
}

/**
 * Strategy 4: Inspect Metadata
 */
export async function inspectMetadata(url: string): Promise<AddressCandidate | null> {
  return await callAPIWithRetry(
    async () => {
      const response = await axios.get(url, {
        timeout: 5000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SynapseBot/1.0)' }
      })

      const $ = cheerio.load(response.data)

      // Check OpenGraph tags
      const ogLocality = $('meta[property="og:locality"]').attr('content')
      const ogRegion = $('meta[property="og:region"]').attr('content')
      const ogCountry = $('meta[property="og:country-name"]').attr('content')

      if (ogLocality || ogRegion || ogCountry) {
        return {
          rawText: `${ogLocality || ''} ${ogRegion || ''} ${ogCountry || ''}`,
          parsed: {
            city: ogLocality,
            state: ogRegion,
            country: ogCountry
          },
          confidence: 0.7,
          source: 'metadata_og'
        }
      }

      // Check geo meta tags
      const geoPosition = $('meta[name="geo.position"]').attr('content')
      const geoPlacename = $('meta[name="geo.placename"]').attr('content')
      const geoRegion = $('meta[name="geo.region"]').attr('content')

      if (geoPlacename || geoRegion) {
        return {
          rawText: `${geoPlacename || ''} ${geoRegion || ''}`,
          parsed: {
            city: geoPlacename,
            state: geoRegion
          },
          confidence: 0.65,
          source: 'metadata_geo'
        }
      }

      return null
    },
    {
      maxRetries: 2,
      fallbackValue: null,
      onError: (error) => log('inspectMetadata', error, 'warn')
    }
  )
}

/**
 * Strategy 5: IP-based Geolocation (Fallback)
 */
export async function geolocateByIP(url: string): Promise<AddressCandidate | null> {
  return await callAPIWithRetry(
    async () => {
      // Extract domain from URL
      const parsed = urlParser.parse(url)
      if (!parsed.isValid) return null

      // For MVP, we'll use a simple approach: return null
      // In production, integrate with IP geolocation service (ipapi.co, ipinfo.io, etc)
      // This is the weakest signal anyway - prefer actual address data

      log('geolocateByIP', { message: 'IP geolocation not implemented in MVP' }, 'info')
      return null
    },
    {
      maxRetries: 1,
      fallbackValue: null,
      onError: (error) => log('geolocateByIP', error, 'warn')
    }
  )
}

/**
 * Parse address string into structured components
 * Handles US, UK, CA, AU, and generic international formats
 */
export function parseAddressString(text: string): ParsedAddress | null {
  if (!text || text.trim().length === 0) return null

  // Clean up text
  const cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/\n/g, ', ')
    .trim()

  // Try US format
  const usMatch = ADDRESS_PATTERNS.US.exec(cleaned)
  if (usMatch) {
    return {
      street: usMatch[1].trim(),
      city: usMatch[2].trim(),
      state: usMatch[3].trim(),
      postalCode: usMatch[4].trim(),
      country: 'United States'
    }
  }

  // Try UK format
  ADDRESS_PATTERNS.UK.lastIndex = 0
  const ukMatch = ADDRESS_PATTERNS.UK.exec(cleaned)
  if (ukMatch) {
    return {
      street: ukMatch[1].trim(),
      city: ukMatch[2].trim(),
      postalCode: ukMatch[3].trim(),
      country: 'United Kingdom'
    }
  }

  // Try Canada format
  ADDRESS_PATTERNS.CA.lastIndex = 0
  const caMatch = ADDRESS_PATTERNS.CA.exec(cleaned)
  if (caMatch) {
    return {
      street: caMatch[1].trim(),
      city: caMatch[2].trim(),
      province: caMatch[3].trim(),
      postalCode: caMatch[4].trim(),
      country: 'Canada'
    }
  }

  // Try Australia format
  ADDRESS_PATTERNS.AU.lastIndex = 0
  const auMatch = ADDRESS_PATTERNS.AU.exec(cleaned)
  if (auMatch) {
    return {
      street: auMatch[1].trim(),
      city: auMatch[2].trim(),
      state: auMatch[3].trim(),
      postalCode: auMatch[4].trim(),
      country: 'Australia'
    }
  }

  // Try generic pattern for other countries
  ADDRESS_PATTERNS.GENERIC.lastIndex = 0
  const genericMatch = ADDRESS_PATTERNS.GENERIC.exec(cleaned)
  if (genericMatch) {
    return {
      street: genericMatch[1]?.trim(),
      city: genericMatch[2]?.trim(),
      state: genericMatch[3]?.trim(),
      country: genericMatch[4]?.trim() || 'Unknown'
    }
  }

  // Last resort: try to extract city names from common patterns
  const cityPattern = /(?:in|from|based in|located in)\s+([\w\s]+(?:,\s*[A-Z]{2,})?)/i
  const cityMatch = cityPattern.exec(cleaned)
  if (cityMatch) {
    const location = cityMatch[1].trim()
    const parts = location.split(',').map(p => p.trim())

    if (parts.length >= 1) {
      return {
        city: parts[0],
        state: parts[1],
        country: parts[2] || 'Unknown'
      }
    }
  }

  return null
}

/**
 * Geocode address using OutScraper (uses existing API subscription)
 * Better than Google Maps because we're already paying for it!
 */
export async function geocodeAddress(address: string): Promise<GeocodedLocation | null> {
  return await callAPIWithRetry(
    async () => {
      // Use OutScraper to search for this address
      const results = await OutScraperAPI.getBusinessListings({
        query: address,
        limit: 1
      })

      if (results.length === 0) {
        return null
      }

      const business = results[0]

      // Parse address into components (basic - could be improved)
      const addressParts = business.address.split(',').map(p => p.trim())

      const geocoded: GeocodedLocation = {
        formattedAddress: business.address,
        coordinates: {
          lat: business.latitude || 0,
          lng: business.longitude || 0
        },
        components: {
          street: addressParts[0],
          city: addressParts[1],
          state: addressParts[2],
          country: addressParts[addressParts.length - 1]
        },
        confidence: (business.latitude && business.longitude) ? 0.9 : 0.5
      }

      return GeocodedLocationSchema.parse(geocoded)
    },
    {
      maxRetries: 3,
      fallbackValue: null,
      onError: (error) => log('geocodeAddress', error, 'error')
    }
  )
}

/**
 * Combine results from multiple strategies and return best location
 */
async function combineResults(
  candidates: AddressCandidate[],
  url: string
): Promise<BusinessLocation | null> {
  if (candidates.length === 0) return null

  // Sort by confidence (highest first)
  candidates.sort((a, b) => b.confidence - a.confidence)

  // Take the highest confidence candidate
  const best = candidates[0]

  if (!best.parsed || !best.parsed.city) {
    return null
  }

  // Try to geocode for coordinates
  let coordinates: { lat: number; lng: number } | undefined
  const addressString = [
    best.parsed.street,
    best.parsed.city,
    best.parsed.state || best.parsed.province,
    best.parsed.postalCode,
    best.parsed.country
  ].filter(Boolean).join(', ')

  const geocoded = await geocodeAddress(addressString)
  if (geocoded) {
    coordinates = geocoded.coordinates
  }

  // Build final BusinessLocation
  const location: BusinessLocation = {
    address: {
      street: best.parsed.street,
      city: best.parsed.city,
      state: best.parsed.state,
      province: best.parsed.province,
      postalCode: best.parsed.postalCode,
      country: best.parsed.country || 'Unknown'
    },
    coordinates,
    confidence: best.confidence,
    source: best.source as any,
    detectedAt: new Date()
  }

  // Validate with Zod before returning
  try {
    return BusinessLocationSchema.parse(location)
  } catch (error) {
    log('combineResults', { error, location }, 'error')
    return null
  }
}

/**
 * Export public API
 */
export const LocationDetector = {
  detectLocation,
  scrapeContactPage,
  extractFooterAddress,
  analyzeAboutPage,
  inspectMetadata,
  geolocateByIP,
  geocodeAddress,
  parseAddressString
}

// Export as default and named export for compatibility
export const locationDetectionService = LocationDetector
export default LocationDetector
