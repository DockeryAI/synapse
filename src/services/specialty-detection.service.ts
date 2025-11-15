/**
 * Specialty Detection Engine
 * Following PATTERNS.md and IMPLEMENTATION_STANDARDS.md
 *
 * Identifies business niche vs generic industry using AI analysis combined
 * with the industry database (380 NAICS codes + 147 profiles).
 *
 * Examples:
 * - "wedding bakery" not just "bakery"
 * - "pediatric dentist" not just "dentist"
 * - "vegan restaurant" not just "restaurant"
 */

import { z } from 'zod'
import axios from 'axios'
import { supabase } from '@/lib/supabase'
import { callAPIWithRetry } from '../lib/api-helpers'
import { log, timeOperation } from '../lib/debug-helpers'
import { sanitizeUserInput } from '../lib/security'
import type { IntelligenceResult } from './parallel-intelligence.service'

// Zod Schemas for validation

const NAICSCodeSchema = z.object({
  code: z.string(),
  title: z.string(),
  category: z.string(),
  keywords: z.array(z.string()),
  has_full_profile: z.boolean(),
  popularity: z.number(),
  level: z.number()
})

const IndustryProfileSchema = z.object({
  id: z.string(),
  naics_code: z.string(),
  industry: z.string(),
  industry_name: z.string(),
  category: z.string(),
  power_words: z.array(z.string()).optional(),
  customer_segments: z.any().optional()
})

const SpecialtyDetectionSchema = z.object({
  industry: z.string(),
  naicsCode: z.string(),
  industryProfileId: z.string().optional(),
  specialty: z.string(),
  nicheKeywords: z.array(z.string()),
  targetMarket: z.string(),
  confidence: z.number().min(0).max(100),
  reasoning: z.string(),
  hasSpecialty: z.boolean()
})

/**
 * Detected specialty information
 */
export interface SpecialtyDetection {
  /** Generic industry category */
  industry: string;
  /** NAICS code (from 383 codes) */
  naicsCode: string;
  /** Industry profile ID (from 147 profiles) */
  industryProfileId?: string;
  /** Specific specialty/niche */
  specialty: string;
  /** Keywords that define the niche */
  nicheKeywords: string[];
  /** Target market */
  targetMarket: string;
  /** Confidence score 0-100 */
  confidence: number;
  /** Why this specialty was detected */
  reasoning: string;
  /** Whether specialty is more specific than industry */
  hasSpecialty: boolean;
}

/**
 * NAICS Code from database
 */
interface NAICSCode {
  code: string;
  title: string;
  category: string;
  keywords: string[];
  has_full_profile: boolean;
  popularity: number;
  level: number;
}

/**
 * Industry Profile from database
 */
interface IndustryProfile {
  id: string;
  naics_code: string;
  industry: string;
  industry_name: string;
  category: string;
  power_words?: string[];
  customer_segments?: any;
}

/**
 * Specialty Detection Service
 *
 * Uses intelligence data + industry database to identify business specialty
 */
export class SpecialtyDetectionService {
  /**
   * Detect business specialty from intelligence data
   *
   * @param intelligenceData - Results from parallel intelligence gathering
   * @param businessName - Name of the business
   * @param websiteUrl - Business website URL
   * @returns Detected specialty with confidence and reasoning
   */
  async detectSpecialty(
    intelligenceData: IntelligenceResult[],
    businessName: string,
    websiteUrl?: string
  ): Promise<SpecialtyDetection> {
    return await timeOperation('Specialty Detection', async () => {
      try {
        // 1. Validate inputs
        if (!businessName || businessName.trim().length === 0) {
          throw new Error('Business name is required')
        }

        if (!intelligenceData || intelligenceData.length === 0) {
          log('detectSpecialty', 'No intelligence data provided', 'warn')
        }

        // 2. Sanitize business name
        const sanitizedName = sanitizeUserInput(businessName)
        log('detectSpecialty', `Detecting specialty for ${sanitizedName}`, 'info')

        // 3. Extract keywords from all intelligence sources
        const keywords = this.extractKeywords(intelligenceData, sanitizedName)
        log('detectSpecialty', `Extracted ${keywords.length} keywords`, 'info')

        // 4. Match to NAICS code using keyword search
        const naicsMatch = await this.matchNAICSCode(keywords)
        log('detectSpecialty', `Matched to NAICS: ${naicsMatch?.code} - ${naicsMatch?.title}`, 'info')

        // 5. Try to fetch industry profile
        let industryProfile: IndustryProfile | null = null
        if (naicsMatch?.has_full_profile) {
          industryProfile = await this.getIndustryProfile(naicsMatch.code)
          if (industryProfile) {
            log('detectSpecialty', `Found industry profile: ${industryProfile.industry_name}`, 'info')
          }
        }

        // 6. Detect specialty within the industry
        const specialtyInfo = await this.detectNiche(
          intelligenceData,
          keywords,
          naicsMatch,
          industryProfile
        )

        // 7. Determine target market
        const targetMarket = this.extractTargetMarket(intelligenceData, specialtyInfo.specialty)

        // 8. Calculate confidence
        const confidence = this.calculateConfidence(
          naicsMatch,
          industryProfile,
          specialtyInfo,
          intelligenceData
        )

        // 9. Build and validate result
        const result: SpecialtyDetection = {
          industry: naicsMatch?.category || 'Unknown',
          naicsCode: naicsMatch?.code || 'generic',
          industryProfileId: industryProfile?.id,
          specialty: specialtyInfo.specialty,
          nicheKeywords: specialtyInfo.keywords,
          targetMarket,
          confidence,
          reasoning: specialtyInfo.reasoning,
          hasSpecialty: specialtyInfo.isSpecific
        }

        // 10. Validate with Zod
        const validated = SpecialtyDetectionSchema.parse(result)

        log('detectSpecialty', `Detected: ${validated.specialty} (${validated.confidence}% confidence)`, 'info')

        return validated

      } catch (error) {
        log('detectSpecialty', error, 'error')
        // Return fallback result
        return {
          industry: 'Unknown',
          naicsCode: 'generic',
          specialty: businessName,
          nicheKeywords: [],
          targetMarket: 'General market',
          confidence: 0,
          reasoning: 'Error during specialty detection',
          hasSpecialty: false
        }
      }
    })
  }

  /**
   * Extract relevant keywords from intelligence data
   */
  private extractKeywords(
    intelligenceData: IntelligenceResult[],
    businessName: string
  ): string[] {
    const keywords = new Set<string>()

    // Add business name words
    businessName.toLowerCase().split(/\s+/).forEach(word => {
      if (word.length > 2) keywords.add(word)
    })

    // Extract from successful intelligence sources
    for (const result of intelligenceData) {
      if (!result.success || !result.data) continue

      // Extract from different data sources
      if (result.source === 'Apify' && result.data.text) {
        this.extractWordsFromText(result.data.text, keywords, 20)
      }

      if (result.source === 'OutScraper-Business' && result.data.description) {
        this.extractWordsFromText(result.data.description, keywords, 10)
      }

      if (result.source === 'Serper-Search' && result.data.organic) {
        result.data.organic.slice(0, 3).forEach((item: any) => {
          if (item.snippet) {
            this.extractWordsFromText(item.snippet, keywords, 5)
          }
        })
      }
    }

    return Array.from(keywords)
  }

  /**
   * Extract important words from text
   */
  private extractWordsFromText(text: string, keywords: Set<string>, limit: number): void {
    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isCommonWord(word))

    words.slice(0, limit).forEach(word => keywords.add(word))
  }

  /**
   * Check if word is too common to be useful
   */
  private isCommonWord(word: string): boolean {
    const common = ['with', 'from', 'this', 'that', 'have', 'more', 'than', 'been', 'were', 'their', 'about', 'would', 'these', 'could', 'other']
    return common.includes(word)
  }

  /**
   * Match keywords to NAICS code from database
   */
  private async matchNAICSCode(keywords: string[]): Promise<NAICSCode | null> {
    try {
      // Search for NAICS codes that contain any of our keywords
      // Prefer higher level (more specific) codes
      const { data, error } = await supabase
        .from('naics_codes')
        .select('*')
        .order('popularity', { ascending: false })
        .order('level', { ascending: false })
        .limit(50)

      if (error) {
        console.warn('   ⚠️  NAICS query error:', error.message)
        return this.getFallbackNAICS()
      }

      if (!data || data.length === 0) {
        console.warn('   ⚠️  No NAICS codes found in database')
        return this.getFallbackNAICS()
      }

      // Score each NAICS code by keyword matches
      const scored = data.map((naics: NAICSCode) => {
        const naicsKeywords = naics.keywords || []
        let matchScore = 0

        // Count keyword matches
        keywords.forEach(keyword => {
          if (naicsKeywords.some(nk => nk.includes(keyword) || keyword.includes(nk))) {
            matchScore += 1
          }
          if (naics.title.toLowerCase().includes(keyword)) {
            matchScore += 2
          }
        })

        // Bonus for having full profile
        if (naics.has_full_profile) {
          matchScore += 5
        }

        return { naics, score: matchScore }
      })

      // Get best match
      scored.sort((a, b) => b.score - a.score)
      const best = scored[0]

      if (best.score > 0) {
        return best.naics
      }

      // Return most popular if no keyword matches
      return data[0]
    } catch (error) {
      console.error('   ❌ NAICS matching error:', error)
      return this.getFallbackNAICS()
    }
  }

  /**
   * Get fallback NAICS for generic business
   */
  private getFallbackNAICS(): NAICSCode {
    return {
      code: '999999',
      title: 'General Business',
      category: 'General',
      keywords: [],
      has_full_profile: false,
      popularity: 0,
      level: 6
    }
  }

  /**
   * Get industry profile from database
   */
  private async getIndustryProfile(naicsCode: string): Promise<IndustryProfile | null> {
    try {
      const { data, error } = await supabase
        .from('industry_profiles')
        .select('id, naics_code, industry, industry_name, category, power_words, customer_segments')
        .eq('naics_code', naicsCode)
        .single()

      if (error) {
        console.warn('   ⚠️  Industry profile query error:', error.message)
        return null
      }

      return data
    } catch (error) {
      console.error('   ❌ Industry profile error:', error)
      return null
    }
  }

  /**
   * Detect specific niche within the industry
   */
  private async detectNiche(
    intelligenceData: IntelligenceResult[],
    keywords: string[],
    naicsMatch: NAICSCode | null,
    industryProfile: IndustryProfile | null
  ): Promise<{
    specialty: string;
    keywords: string[];
    reasoning: string;
    isSpecific: boolean;
  }> {
    // Look for specialty indicators
    const specialtyKeywords: string[] = []
    const indicators = [
      'wedding', 'luxury', 'premium', 'boutique', 'artisan', 'organic', 'vegan',
      'pediatric', 'cosmetic', 'emergency', 'mobile', 'online', 'virtual',
      'custom', 'handmade', 'bespoke', 'exclusive', 'specialized'
    ]

    keywords.forEach(kw => {
      if (indicators.some(ind => kw.includes(ind) || ind.includes(kw))) {
        specialtyKeywords.push(kw)
      }
    })

    // Check if we found specialty indicators
    if (specialtyKeywords.length > 0) {
      const specialty = specialtyKeywords.slice(0, 3).join(' ')
      return {
        specialty: `${specialty} ${naicsMatch?.title || 'business'}`.toLowerCase(),
        keywords: specialtyKeywords,
        reasoning: `Detected specialty indicators: ${specialtyKeywords.join(', ')}`,
        isSpecific: true
      }
    }

    // No specialty detected - use industry name
    return {
      specialty: naicsMatch?.title || 'General Business',
      keywords: [],
      reasoning: 'No specific specialty detected, using industry category',
      isSpecific: false
    }
  }

  /**
   * Extract target market from intelligence
   */
  private extractTargetMarket(
    intelligenceData: IntelligenceResult[],
    specialty: string
  ): string {
    // Common target markets based on specialty keywords
    const marketMap: Record<string, string> = {
      'wedding': 'Engaged couples planning weddings',
      'pediatric': 'Parents with children',
      'luxury': 'High-income individuals',
      'vegan': 'Health-conscious consumers',
      'organic': 'Environmentally conscious consumers',
      'mobile': 'On-the-go professionals',
      'online': 'Digital-first consumers'
    }

    for (const [keyword, market] of Object.entries(marketMap)) {
      if (specialty.toLowerCase().includes(keyword)) {
        return market
      }
    }

    return 'General consumers'
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    naicsMatch: NAICSCode | null,
    industryProfile: IndustryProfile | null,
    specialtyInfo: any,
    intelligenceData: IntelligenceResult[]
  ): number {
    let confidence = 50 // Base confidence

    // Bonus for NAICS match
    if (naicsMatch && naicsMatch.code !== 'generic') confidence += 20

    // Bonus for industry profile
    if (industryProfile) confidence += 15

    // Bonus for specialty detected
    if (specialtyInfo.isSpecific) confidence += 10

    // Bonus for successful intelligence sources
    const successfulSources = intelligenceData.filter(r => r.success).length
    confidence += Math.min(successfulSources, 5)

    return Math.min(confidence, 100)
  }
}

// Export singleton
export const specialtyDetector = new SpecialtyDetectionService()
