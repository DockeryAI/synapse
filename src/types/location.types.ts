/**
 * Location Detection Type Definitions
 *
 * Supports 50+ countries with standardized address formats
 */

import { z } from 'zod'

/**
 * Business Location - Final result with confidence score
 */
export const BusinessLocationSchema = z.object({
  address: z.object({
    street: z.string().optional(),
    city: z.string(),
    state: z.string().optional(),
    province: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string()
  }),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  confidence: z.number().min(0).max(1),
  source: z.enum(['contact_page', 'footer', 'about', 'metadata', 'ip']),
  detectedAt: z.date()
})

export type BusinessLocation = z.infer<typeof BusinessLocationSchema>

/**
 * Address Candidate - Intermediate result from each strategy
 */
export const AddressCandidateSchema = z.object({
  rawText: z.string(),
  parsed: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  confidence: z.number().min(0).max(1),
  source: z.string()
})

export type AddressCandidate = z.infer<typeof AddressCandidateSchema>

/**
 * Parsed Address - Structured address components
 */
export const ParsedAddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional()
})

export type ParsedAddress = z.infer<typeof ParsedAddressSchema>

/**
 * Geocoded Location - Result from Google Maps API
 */
export const GeocodedLocationSchema = z.object({
  formattedAddress: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  components: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional()
  }),
  confidence: z.number().min(0).max(1)
})

export type GeocodedLocation = z.infer<typeof GeocodedLocationSchema>
