/**
 * Type definitions for Specialty Detection
 * With Zod validation following PATTERNS.md standards
 */

import { z } from 'zod'

// Zod Schemas

export const SpecialtyResultSchema = z.object({
  specialty: z.string(),
  genericIndustry: z.string(),
  keywords: z.array(z.string()),
  nicheLevel: z.enum(['generic', 'specialized', 'hyper-niche']),
  targetMarket: z.string(),
  confidence: z.number().min(0).max(1)
})

export const OpusResponseSchema = z.object({
  specialty: z.string(),
  keywords: z.array(z.string()),
  nicheLevel: z.enum(['generic', 'specialized', 'hyper-niche']),
  targetMarket: z.string()
})

// Type Inference

export type SpecialtyResult = z.infer<typeof SpecialtyResultSchema>
export type OpusResponse = z.infer<typeof OpusResponseSchema>

// WebsiteData interface (from Intelligence Gatherer)
export interface WebsiteData {
  pages: Array<{
    url: string
    title: string
    content: string
  }>
  totalPages: number
  keyContent: string[]
  images: string[]
  links: string[]
}
