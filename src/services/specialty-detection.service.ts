/**
 * Specialty Detection Engine (Enhanced for V5 Triggers)
 * Following PATTERNS.md and IMPLEMENTATION_STANDARDS.md
 *
 * Identifies business niche vs generic industry using AI analysis combined
 * with the industry database (380 NAICS codes + 147 profiles).
 *
 * Enhanced in Phase 2 to support:
 * - Specialty hash generation for deduplication
 * - Supabase lookup for existing specialty profiles
 * - Business profile type classification (7 types)
 * - needsGeneration flag for multipass generation pipeline
 *
 * Examples:
 * - "wedding bakery" not just "bakery"
 * - "pediatric dentist" not just "dentist"
 * - "vegan restaurant" not just "restaurant"
 * - "CAI platform for insurance" - specialty with no NAICS match
 */

import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { log, timeOperation } from '../lib/debug-helpers'
import { sanitizeUserInput } from '../lib/security'
import type { IntelligenceResult } from './parallel-intelligence.service'
import type {
  SpecialtyDetectionInput,
  SpecialtyDetectionResult,
  SpecialtyProfileRow,
  BusinessProfileType
} from '@/types/specialty-profile.types'
import { generateSpecialtyHash, getEnabledTabsForProfileType } from '@/types/specialty-profile.types'

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

  // ============================================================================
  // ENHANCED SPECIALTY DETECTION (Phase 2)
  // ============================================================================

  /**
   * Enhanced specialty detection with DB lookup and generation flag
   *
   * This is the main entry point for V5 Triggers specialty detection.
   * It checks for existing specialty profiles and returns generation flags.
   *
   * @param input - Specialty detection input (from onboarding)
   * @returns Full detection result with existing profile or generation flag
   */
  async detectSpecialtyEnhanced(input: SpecialtyDetectionInput): Promise<SpecialtyDetectionResult> {
    return await timeOperation('Enhanced Specialty Detection', async () => {
      try {
        log('detectSpecialtyEnhanced', `Starting enhanced detection for: ${input.businessName}`, 'info')

        // 1. Determine if this is a specialty business (doesn't match NAICS well)
        const isSpecialty = await this.determineIfSpecialty(input)

        // 2. Build specialty name from available data
        const specialtyName = this.buildSpecialtyName(input)

        // 3. Classify business profile type (1 of 7)
        const businessProfileType = await this.classifyBusinessProfileType(input)

        // 4. Generate hash for deduplication
        const specialtyHash = generateSpecialtyHash({
          specialtyName,
          businessProfileType
        })

        log('detectSpecialtyEnhanced', `Specialty: ${specialtyName}, Type: ${businessProfileType}, Hash: ${specialtyHash}`, 'info')

        // 5. Check if specialty profile already exists in DB
        const existingProfile = await this.lookupSpecialtyProfile(specialtyHash)

        if (existingProfile) {
          log('detectSpecialtyEnhanced', `Found existing profile: ${existingProfile.id}`, 'info')
          return {
            isSpecialty,
            specialtyName,
            specialtyHash,
            specialtyDescription: existingProfile.specialty_description || '',
            baseNaicsCode: existingProfile.base_naics_code,
            businessProfileType,
            confidence: existingProfile.multipass_validation_score || 80,
            reasoning: `Found existing specialty profile (ID: ${existingProfile.id})`,
            existingProfile,
            needsGeneration: false
          }
        }

        // 6. No existing profile - PHASE 17: Always generate specialty profile
        // Removed the detection gate - every brand benefits from a specialty profile
        const confidence = this.calculateSpecialtyConfidence(input, isSpecialty, businessProfileType)
        const needsGeneration = true // ALWAYS generate - don't gate on isSpecialty or confidence

        // 7. Try to find nearest NAICS code
        const baseNaicsCode = await this.findNearestNAICS(input)

        // 8. Build description from UVP data
        const specialtyDescription = this.buildSpecialtyDescription(input)

        const result: SpecialtyDetectionResult = {
          isSpecialty,
          specialtyName,
          specialtyHash,
          specialtyDescription,
          baseNaicsCode,
          businessProfileType,
          confidence,
          reasoning: this.buildDetectionReasoning(isSpecialty, confidence, businessProfileType),
          existingProfile: null,
          needsGeneration
        }

        log('detectSpecialtyEnhanced', `Result: isSpecialty=${isSpecialty}, needsGeneration=${needsGeneration}, confidence=${confidence}`, 'info')

        return result
      } catch (error) {
        log('detectSpecialtyEnhanced', error, 'error')
        // Return safe fallback - flag for human intervention
        return {
          isSpecialty: true,
          specialtyName: input.businessName,
          specialtyHash: generateSpecialtyHash({
            specialtyName: input.businessName,
            businessProfileType: 'national-saas-b2b'
          }),
          specialtyDescription: input.uvpDescription || '',
          baseNaicsCode: null,
          businessProfileType: 'national-saas-b2b',
          confidence: 0,
          reasoning: `Error during specialty detection: ${error instanceof Error ? error.message : 'Unknown error'}`,
          existingProfile: null,
          needsGeneration: true // Flag for generation/human intervention
        }
      }
    })
  }

  /**
   * Determine if business is a specialty (doesn't match NAICS codes well)
   */
  private async determineIfSpecialty(input: SpecialtyDetectionInput): Promise<boolean> {
    // Keywords that indicate specialty/niche businesses
    const specialtyIndicators = [
      // Tech specialties
      'ai', 'ml', 'machine learning', 'artificial intelligence', 'saas', 'platform',
      'automation', 'blockchain', 'crypto', 'fintech', 'healthtech', 'edtech',
      'insurtech', 'proptech', 'martech', 'regtech', 'legaltech', 'agtech',
      // Vertical-specific
      'conversational', 'cai', 'chatbot', 'voice', 'nlp', 'computer vision',
      // B2B specialties
      'enterprise', 'api', 'sdk', 'developer', 'integration', 'analytics',
      // Niche consumer
      'luxury', 'premium', 'boutique', 'artisan', 'craft', 'bespoke',
      // Healthcare niches
      'telemedicine', 'telehealth', 'remote patient', 'digital health',
      // Finance niches
      'neobank', 'payment', 'lending', 'wealth management', 'robo-advisor'
    ]

    const searchText = [
      input.businessName,
      input.industry,
      input.uvpDescription,
      input.productsServices,
      input.targetCustomer
    ].filter(Boolean).join(' ').toLowerCase()

    // Check for specialty indicators
    const hasSpecialtyIndicators = specialtyIndicators.some(indicator =>
      searchText.includes(indicator)
    )

    // Check if NAICS code is generic or missing
    const hasGenericNAICS = !input.naicsCode ||
      input.naicsCode === 'generic' ||
      input.naicsCode === '999999' ||
      input.naicsCode.endsWith('00')

    // Specialty if has indicators OR has generic NAICS with specific description
    return hasSpecialtyIndicators || (hasGenericNAICS && (input.uvpDescription?.length || 0) > 50)
  }

  /**
   * Build specialty name from input data
   */
  private buildSpecialtyName(input: SpecialtyDetectionInput): string {
    // Priority: industry > uvpDescription extraction > businessName
    if (input.industry && input.industry !== 'Unknown') {
      return input.industry
    }

    // Extract from UVP if available
    if (input.uvpDescription) {
      // Look for pattern like "X for Y" or "X platform"
      const forMatch = input.uvpDescription.match(/([a-z\s]+)\s+for\s+([a-z\s]+)/i)
      if (forMatch) {
        return `${forMatch[1].trim()} for ${forMatch[2].trim()}`
      }

      const platformMatch = input.uvpDescription.match(/([a-z\s]+)\s+platform/i)
      if (platformMatch) {
        return `${platformMatch[1].trim()} Platform`
      }
    }

    return input.businessName
  }

  /**
   * Classify into one of 7 business profile types
   *
   * PRIORITY: Use structured UVP fields first (accurate), fall back to keyword matching (unreliable)
   */
  private async classifyBusinessProfileType(input: SpecialtyDetectionInput): Promise<BusinessProfileType> {
    // PHASE 18: Use UVP structured fields if available (accurate)
    if (input.uvp) {
      const { customerType, geographicScope, isSaaS, isService } = input.uvp

      // Determine B2B vs B2C from UVP
      const isB2B = customerType === 'b2b' || customerType === 'b2b2c'

      // Use geographic scope from UVP - should already be properly detected
      const scope = geographicScope // Trust the caller's detection

      log('classifyBusinessProfileType', `UVP-based: customerType=${customerType}, scope=${scope}, isSaaS=${isSaaS}, isService=${isService}`, 'info')

      // If scope is provided, use it directly with business type
      if (scope) {
        if (scope === 'global' && isB2B) return 'global-saas-b2b'
        if (scope === 'national' && isSaaS && isB2B) return 'national-saas-b2b'
        if (scope === 'national' && !isB2B) return 'national-product-b2c'
        if (scope === 'regional' && isService && isB2B) return 'regional-b2b-agency'
        if (scope === 'regional' && !isB2B) return 'regional-retail-b2c'
        if (scope === 'local' && isB2B) return 'local-service-b2b'
        if (scope === 'local') return 'local-service-b2c'

        // Handle global B2C edge case
        if (scope === 'global' && !isB2B) return 'national-product-b2c' // Global B2C rare, treat as national
        if (scope === 'national' && isB2B) return 'national-saas-b2b'
        if (scope === 'regional' && isB2B) return 'regional-b2b-agency'
      }

      // No scope provided - infer from business type (last resort)
      // B2B SaaS without geographic data = assume global (SaaS scales globally)
      if (isB2B && isSaaS) return 'global-saas-b2b'
      if (isB2B && isService) return 'regional-b2b-agency'
      if (isB2B) return 'national-saas-b2b'

      return 'national-product-b2c'
    }

    // FALLBACK: Keyword matching (less reliable) - kept for backwards compatibility
    const searchText = [
      input.businessName,
      input.industry,
      input.uvpDescription,
      input.productsServices,
      input.targetCustomer
    ].filter(Boolean).join(' ').toLowerCase()

    // B2B vs B2C detection
    const b2bIndicators = ['business', 'enterprise', 'company', 'companies', 'organization', 'team', 'professional', 'b2b', 'saas', 'platform', 'api', 'integration', 'insurer', 'insurance', 'financial', 'bank', 'healthcare']
    const b2cIndicators = ['consumer', 'customer', 'individual', 'personal', 'family', 'home', 'b2c', 'retail', 'shop']

    const b2bScore = b2bIndicators.filter(ind => searchText.includes(ind)).length
    const b2cScore = b2cIndicators.filter(ind => searchText.includes(ind)).length
    const isB2B = b2bScore > b2cScore || b2bScore >= 2 // Bias towards B2B if signals found

    // SaaS detection - expanded indicators
    const isSaaS = ['saas', 'software', 'platform', 'cloud', 'subscription', 'api', 'ai', 'machine learning', 'automation', 'conversational', 'chatbot', 'agent'].some(ind =>
      searchText.includes(ind)
    )

    // Service vs Product
    const isService = ['service', 'consulting', 'agency', 'support', 'maintenance'].some(ind =>
      searchText.includes(ind)
    )

    // Local vs Regional vs National vs Global
    const localIndicators = ['local', 'neighborhood', 'city', 'town', 'nearby', 'community']
    const regionalIndicators = ['regional', 'state', 'multi-location', 'franchise']
    const nationalIndicators = ['national', 'nationwide', 'usa', 'country-wide']
    const globalIndicators = ['global', 'international', 'worldwide', 'enterprise']

    const localScore = localIndicators.filter(ind => searchText.includes(ind)).length
    const regionalScore = regionalIndicators.filter(ind => searchText.includes(ind)).length
    const nationalScore = nationalIndicators.filter(ind => searchText.includes(ind)).length
    const globalScore = globalIndicators.filter(ind => searchText.includes(ind)).length

    log('classifyBusinessProfileType', `Keyword-based: b2bScore=${b2bScore}, b2cScore=${b2cScore}, isSaaS=${isSaaS}`, 'info')

    // Classify based on signals
    if (globalScore > 0 && isSaaS && isB2B) return 'global-saas-b2b'
    if (isSaaS && isB2B) return 'national-saas-b2b'
    if (nationalScore > 0 && !isB2B) return 'national-product-b2c'
    if (regionalScore > 0 && isService && isB2B) return 'regional-b2b-agency'
    if (regionalScore > 0 && !isB2B) return 'regional-retail-b2c'
    if (localScore > 0 && isService && isB2B) return 'local-service-b2b'
    if (localScore > 0 && isService) return 'local-service-b2c'

    // Default based on B2B/B2C - default to GLOBAL for SaaS
    if (isB2B && isSaaS) return 'global-saas-b2b'
    if (isB2B && isService) return 'regional-b2b-agency'
    if (isB2B) return 'global-saas-b2b'

    // Default B2C to national
    return 'national-product-b2c'
  }

  /**
   * Look up existing specialty profile by hash
   */
  private async lookupSpecialtyProfile(specialtyHash: string): Promise<SpecialtyProfileRow | null> {
    try {
      const { data, error } = await supabase
        .from('specialty_profiles')
        .select('*')
        .eq('specialty_hash', specialtyHash)
        .eq('generation_status', 'complete')
        .single()

      if (error) {
        if (error.code !== 'PGRST116') { // Not "no rows found"
          log('lookupSpecialtyProfile', `DB error: ${error.message}`, 'warn')
        }
        return null
      }

      return data as SpecialtyProfileRow
    } catch (error) {
      log('lookupSpecialtyProfile', error, 'error')
      return null
    }
  }

  /**
   * Calculate confidence score for specialty detection
   */
  private calculateSpecialtyConfidence(
    input: SpecialtyDetectionInput,
    isSpecialty: boolean,
    profileType: BusinessProfileType
  ): number {
    let confidence = 50

    // Has NAICS code
    if (input.naicsCode && input.naicsCode !== 'generic') confidence += 15

    // Has industry
    if (input.industry && input.industry !== 'Unknown') confidence += 10

    // Has UVP description
    if (input.uvpDescription && input.uvpDescription.length > 50) confidence += 10

    // Has target customer
    if (input.targetCustomer && input.targetCustomer.length > 20) confidence += 10

    // Has products/services
    if (input.productsServices && input.productsServices.length > 30) confidence += 5

    // Penalty for specialty (needs more validation)
    if (isSpecialty) confidence -= 10

    return Math.max(0, Math.min(100, confidence))
  }

  /**
   * Find nearest NAICS code for specialty
   */
  private async findNearestNAICS(input: SpecialtyDetectionInput): Promise<string | null> {
    // If we already have a NAICS code, return it
    if (input.naicsCode && input.naicsCode !== 'generic' && input.naicsCode !== '999999') {
      return input.naicsCode
    }

    // Build keywords for matching
    const keywords = [
      input.businessName,
      input.industry,
      input.productsServices
    ].filter(Boolean).join(' ').toLowerCase().split(/\s+/).filter(w => w.length > 3)

    try {
      const naicsMatch = await this.matchNAICSCode(keywords)
      return naicsMatch?.code || null
    } catch (error) {
      return null
    }
  }

  /**
   * Build specialty description from input
   */
  private buildSpecialtyDescription(input: SpecialtyDetectionInput): string {
    const parts: string[] = []

    if (input.uvpDescription) {
      parts.push(input.uvpDescription)
    }

    if (input.productsServices) {
      parts.push(`Products/Services: ${input.productsServices}`)
    }

    if (input.targetCustomer) {
      parts.push(`Target Customer: ${input.targetCustomer}`)
    }

    return parts.join('. ') || input.businessName
  }

  /**
   * Build reasoning for detection result
   */
  private buildDetectionReasoning(
    isSpecialty: boolean,
    confidence: number,
    profileType: BusinessProfileType
  ): string {
    if (!isSpecialty) {
      return `Standard industry match with ${confidence}% confidence. Profile type: ${profileType}`
    }

    if (confidence >= 70) {
      return `Specialty business detected with high confidence (${confidence}%). Profile type: ${profileType}. Existing industry profiles may apply.`
    }

    return `Specialty business detected with ${confidence}% confidence. Profile type: ${profileType}. Multipass profile generation recommended.`
  }

  /**
   * Create a new specialty profile placeholder (pending generation)
   * Now accepts optional brandId to set the brand_id FK at creation time
   */
  async createPendingSpecialtyProfile(
    input: SpecialtyDetectionInput,
    detectionResult: SpecialtyDetectionResult,
    brandId?: string
  ): Promise<string | null> {
    try {
      const insertData: Record<string, unknown> = {
        specialty_hash: detectionResult.specialtyHash,
        specialty_name: detectionResult.specialtyName,
        specialty_description: detectionResult.specialtyDescription,
        base_naics_code: detectionResult.baseNaicsCode,
        business_profile_type: detectionResult.businessProfileType,
        generation_status: 'pending',
        generation_attempts: 0,
        enabled_tabs: getEnabledTabsForProfileType(detectionResult.businessProfileType)
      }

      // Set brand_id if provided (enables LLM synthesizer lookup)
      if (brandId) {
        insertData.brand_id = brandId
        log('createPendingSpecialtyProfile', `Setting brand_id: ${brandId}`, 'info')
      }

      const { data, error } = await supabase
        .from('specialty_profiles')
        .insert(insertData)
        .select('id')
        .single()

      if (error) {
        log('createPendingSpecialtyProfile', `Insert error: ${error.message}`, 'error')
        return null
      }

      log('createPendingSpecialtyProfile', `Created pending profile: ${data.id}`, 'info')
      return data.id
    } catch (error) {
      log('createPendingSpecialtyProfile', error, 'error')
      return null
    }
  }

  /**
   * Link specialty profile to brand
   */
  async linkProfileToBrand(brandId: string, specialtyProfileId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('brands')
        .update({ specialty_profile_id: specialtyProfileId })
        .eq('id', brandId)

      if (error) {
        log('linkProfileToBrand', `Update error: ${error.message}`, 'error')
        return false
      }

      return true
    } catch (error) {
      log('linkProfileToBrand', error, 'error')
      return false
    }
  }

  // ============================================================================
  // ASYNC GENERATION PIPELINE (Phase 4)
  // ============================================================================

  /**
   * Trigger specialty profile generation via Edge Function
   *
   * Fire-and-forget call - use pollGenerationStatus to check completion.
   *
   * @param specialtyProfileId - ID of the pending specialty_profiles row
   * @param input - Specialty detection input data
   * @param detectionResult - Result from detectSpecialtyEnhanced
   * @returns Promise with trigger result (success/error)
   */
  async triggerSpecialtyGeneration(
    specialtyProfileId: string,
    input: SpecialtyDetectionInput,
    detectionResult: SpecialtyDetectionResult
  ): Promise<{ success: boolean; error?: string }> {
    try {
      log('triggerSpecialtyGeneration', `Triggering PARALLEL generation for profile: ${specialtyProfileId}`, 'info')

      // Use parallel 4x Edge Function for faster generation (~20s vs ~60s)
      const { data, error } = await supabase.functions.invoke('generate-specialty-profile-parallel', {
        body: {
          specialtyProfileId,
          specialtyName: detectionResult.specialtyName,
          specialtyDescription: detectionResult.specialtyDescription,
          baseNaicsCode: detectionResult.baseNaicsCode,
          businessProfileType: detectionResult.businessProfileType,
          uvpData: {
            targetCustomer: input.targetCustomer,
            productsServices: input.productsServices,
            businessDescription: input.uvpDescription
          }
        }
      })

      if (error) {
        log('triggerSpecialtyGeneration', `Edge function error: ${error.message}`, 'error')
        return { success: false, error: error.message }
      }

      log('triggerSpecialtyGeneration', `Generation triggered successfully`, 'info')
      return { success: true }
    } catch (error) {
      log('triggerSpecialtyGeneration', error, 'error')
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Poll for specialty profile generation status
   *
   * @param specialtyProfileId - ID of the specialty profile to check
   * @returns Current status and profile data if complete
   */
  async pollGenerationStatus(specialtyProfileId: string): Promise<{
    status: 'pending' | 'generating' | 'complete' | 'failed' | 'needs_human';
    profile: SpecialtyProfileRow | null;
    validationScore: number | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('specialty_profiles')
        .select('*')
        .eq('id', specialtyProfileId)
        .single()

      if (error) {
        log('pollGenerationStatus', `Query error: ${error.message}`, 'error')
        return { status: 'failed', profile: null, validationScore: null, error: error.message }
      }

      const profile = data as SpecialtyProfileRow

      return {
        status: profile.generation_status,
        profile: profile.generation_status === 'complete' ? profile : null,
        validationScore: profile.multipass_validation_score,
        error: profile.generation_error
      }
    } catch (error) {
      log('pollGenerationStatus', error, 'error')
      return {
        status: 'failed',
        profile: null,
        validationScore: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Wait for specialty profile generation to complete
   *
   * Polls every 3 seconds for up to 30 seconds (10 attempts).
   *
   * @param specialtyProfileId - ID of the specialty profile
   * @param onProgress - Optional callback for progress updates
   * @returns Completed profile or error
   */
  async waitForGeneration(
    specialtyProfileId: string,
    onProgress?: (status: string, attempt: number, maxAttempts: number) => void
  ): Promise<{
    success: boolean;
    profile: SpecialtyProfileRow | null;
    validationScore: number | null;
    error?: string;
  }> {
    const maxAttempts = 10
    const pollInterval = 3000 // 3 seconds

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      log('waitForGeneration', `Poll attempt ${attempt}/${maxAttempts}`, 'info')

      if (onProgress) {
        onProgress('polling', attempt, maxAttempts)
      }

      const result = await this.pollGenerationStatus(specialtyProfileId)

      if (result.status === 'complete') {
        log('waitForGeneration', `Generation complete with score: ${result.validationScore}`, 'info')
        return {
          success: true,
          profile: result.profile,
          validationScore: result.validationScore
        }
      }

      if (result.status === 'failed' || result.status === 'needs_human') {
        log('waitForGeneration', `Generation ended with status: ${result.status}`, 'warn')
        return {
          success: false,
          profile: null,
          validationScore: null,
          error: result.error || `Generation ${result.status}`
        }
      }

      // Still generating - wait before next poll
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, pollInterval))
      }
    }

    // Timed out
    log('waitForGeneration', 'Generation timed out after 30 seconds', 'warn')
    return {
      success: false,
      profile: null,
      validationScore: null,
      error: 'Generation timed out - profile may still be generating in background'
    }
  }

  /**
   * Full async specialty generation flow
   *
   * 1. Create pending profile
   * 2. Trigger Edge Function
   * 3. Wait for completion
   * 4. Link to brand (if brandId provided)
   *
   * @param input - Specialty detection input
   * @param detectionResult - Result from detectSpecialtyEnhanced
   * @param brandId - Optional brand ID to link profile to
   * @param onProgress - Optional progress callback
   * @returns Complete profile or error
   */
  async generateSpecialtyProfileAsync(
    input: SpecialtyDetectionInput,
    detectionResult: SpecialtyDetectionResult,
    brandId?: string,
    onProgress?: (stage: string, progress: number, message: string) => void
  ): Promise<{
    success: boolean;
    profile: SpecialtyProfileRow | null;
    error?: string;
  }> {
    try {
      // 1. Create pending profile (pass brandId to set FK at creation time)
      if (onProgress) onProgress('creating', 10, 'Creating specialty profile...')

      const profileId = await this.createPendingSpecialtyProfile(input, detectionResult, brandId)
      if (!profileId) {
        return { success: false, profile: null, error: 'Failed to create pending profile' }
      }

      // 2. Trigger generation
      if (onProgress) onProgress('triggering', 20, 'Starting profile generation...')

      const triggerResult = await this.triggerSpecialtyGeneration(profileId, input, detectionResult)
      if (!triggerResult.success) {
        return { success: false, profile: null, error: triggerResult.error }
      }

      // 3. Wait for completion
      if (onProgress) onProgress('generating', 30, 'Generating profile (this may take 15-30 seconds)...')

      const waitResult = await this.waitForGeneration(profileId, (status, attempt, max) => {
        if (onProgress) {
          const progress = 30 + (attempt / max) * 50 // 30-80%
          onProgress('generating', progress, `Generating... (${attempt}/${max})`)
        }
      })

      if (!waitResult.success) {
        return { success: false, profile: null, error: waitResult.error }
      }

      // 4. Link to brand if provided
      if (brandId && waitResult.profile) {
        if (onProgress) onProgress('linking', 90, 'Linking profile to brand...')
        await this.linkProfileToBrand(brandId, profileId)
      }

      if (onProgress) onProgress('complete', 100, 'Profile generation complete!')

      return {
        success: true,
        profile: waitResult.profile
      }
    } catch (error) {
      log('generateSpecialtyProfileAsync', error, 'error')
      return {
        success: false,
        profile: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export singleton
export const specialtyDetector = new SpecialtyDetectionService()
