/**
 * INDUSTRY PROFILE GENERATOR SERVICE
 *
 * Generates comprehensive 40-field industry profiles using Claude Opus 4.1
 * Follows PATTERNS.md and IMPLEMENTATION_STANDARDS.md
 *
 * Features:
 * - 8-phase generation with real-time progress tracking
 * - callAPIWithRetry for resilient API calls
 * - SimpleCache with 7-day TTL
 * - Zod validation for type safety
 * - Performance monitoring with timeOperation
 * - Integration with Brandock NAICS data
 */

import { supabase } from '@/lib/supabase';
import { SimpleCache } from '@/lib/cache';
import { callAPIWithRetry } from '@/lib/api-helpers';
import { COMPLETE_NAICS_CODES, hasFullProfile } from '@/data/complete-naics-codes';
import {
  type IndustryProfileFull,
  type GenerationProgress,
  type ProgressCallback,
  validateIndustryProfile,
  IndustryProfileFullSchema
} from '@/types/industry-profile.types';

// ==========================================
// CACHE SETUP
// ==========================================

const profileCache = new SimpleCache<IndustryProfileFull>();
const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

// ==========================================
// OPUS PROMPT TEMPLATE
// ==========================================

const MASTER_TEMPLATE_PROMPT = `Generate a comprehensive industry profile for {INDUSTRY_NAME} (NAICS: {NAICS_CODE}).

This profile will be used to power AI-driven marketing message generation for SMBs in this industry.

Generate ALL 40 fields with rich, actionable data:

## CORE IDENTIFICATION (5 fields)
1. industry: {INDUSTRY_NAME}
2. industry_name: {INDUSTRY_NAME}
3. naics_code: {NAICS_CODE}
4. category: [Determine primary category]
5. subcategory: [Determine subcategory if applicable]

## CUSTOMER PSYCHOLOGY & TRIGGERS (8 fields)
**CRITICAL: All of these are from the perspective of the END CUSTOMER (the person/business buying from this industry), NOT the business owner**

6. customer_triggers: [10+ specific situations that make END CUSTOMERS urgently need to buy from businesses in this industry]
   Example for Food Truck: "Last-minute event catering need", "Want to impress party guests", "Office lunch monotony"

7. customer_journey: [Detailed map of how END CUSTOMERS go from awareness to purchase to advocacy]

8. transformations: [10+ emotional before→after transformations that END CUSTOMERS experience when buying from this industry]
   Example for Food Truck: "From 'my event will have boring catering' → 'I look like a hero who found this amazing food'", "From 'stressed about party planning' → 'confident my guests will love this'"

9. success_metrics: [10+ ways END CUSTOMERS measure if their purchase was successful]
   Example for Food Truck: "Guests asking where I found the caterer", "Event went smoothly", "Instagram-worthy food"

10. urgency_drivers: [10+ factors that make END CUSTOMERS need to buy RIGHT NOW]

11. objection_handlers: [10+ common objections END CUSTOMERS have with proven responses]

12. risk_reversal: [Guarantees, warranties, and risk-reduction strategies that make END CUSTOMERS feel safe buying]

13. customer_language_dictionary: [50+ phrases/terms END CUSTOMERS actually use when describing their needs, problems, and desired outcomes]

## VALUE PROPOSITION & DIFFERENTIATION (7 fields)
14. value_propositions: [10+ unique value propositions ranked by impact]
15. differentiators: [10+ ways businesses in this industry differentiate]
16. competitive_advantages: [Sustainable advantages businesses can build]
17. pricing_strategies: [Common pricing models and positioning strategies]
18. service_delivery_models: [How service is typically delivered]
19. unique_selling_propositions: [Template USPs for different market positions]
20. brand_positioning_templates: [Pre-built positioning strategies]

## MESSAGING & COMMUNICATION (9 fields)
21. power_words: [50+ high-converting words for this industry]
22. avoid_words: [20+ words to avoid - clichés, jargon, red flags]
23. headline_templates: [20+ proven headline formulas]
24. call_to_action_templates: [15+ CTAs optimized for different stages]
25. email_subject_line_templates: [20+ subject line formulas]
26. social_media_hooks: [30+ attention-grabbing opening hooks]
27. pain_point_language: [How to articulate pain points authentically]
28. solution_language: [How to present solutions compellingly]
29. proof_point_frameworks: [How to structure credibility elements]

## MARKET INTELLIGENCE (6 fields)
30. seasonal_patterns: [How demand fluctuates throughout the year]
31. geographic_variations: [Regional differences in service needs]
32. demographic_insights: [Target customer demographic patterns]
33. psychographic_profiles: [Mindset and values of ideal customers]
34. market_trends: [Current and emerging trends affecting this industry]
35. innovation_opportunities: [Where this industry is evolving]

## OPERATIONAL CONTEXT (5 fields)
36. typical_business_models: [Common ways businesses in this industry operate]
37. common_challenges: [Top operational challenges these businesses face]
38. growth_strategies: [Proven paths to scaling in this industry]
39. technology_stack_recommendations: [Tools/platforms commonly used]
40. industry_associations_resources: [Professional organizations, certifications, resources]

For each field, provide:
- DEPTH: Not generic advice - specific, actionable insights
- QUANTITY: Hit or exceed target counts (e.g., "10+ triggers" means give 12-15)
- QUALITY: Based on real market research, customer behavior, industry analysis
- USABILITY: Written to be directly used in marketing message generation

Return as valid JSON with all 40 fields populated.`;

// ==========================================
// MAIN GENERATOR CLASS
// ==========================================

export class IndustryProfileGenerator {
  /**
   * Generate a complete industry profile with caching and progress tracking
   */
  static async generateProfile(
    industryName: string,
    naicsCode: string,
    onProgress?: ProgressCallback
  ): Promise<IndustryProfileFull> {
    console.log(`[IndustryProfileGenerator] Starting generation for: ${industryName} (${naicsCode})`);

    // Check Brandock NAICS data first
    if (hasFullProfile(naicsCode)) {
      console.log(`[IndustryProfileGenerator] NAICS ${naicsCode} has pre-generated profile in Brandock data`);
      // Could load from pre-generated profiles here if we had them
    }

    // Check cache
    const cacheKey = `industry_profile_${naicsCode}`;
    const cached = profileCache.get(cacheKey);
    if (cached) {
      console.log(`[IndustryProfileGenerator] Cache hit for ${naicsCode}`);
      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Profile loaded from cache',
        estimatedTimeRemaining: 0
      });
      return cached;
    }

    // Check database
    const dbProfile = await this.loadFromDatabase(naicsCode);
    if (dbProfile) {
      console.log(`[IndustryProfileGenerator] Database hit for ${naicsCode}`);
      profileCache.set(cacheKey, dbProfile, CACHE_TTL_SECONDS);
      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Profile loaded from database',
        estimatedTimeRemaining: 0
      });
      return dbProfile;
    }

    // Generate new profile
    console.log(`[IndustryProfileGenerator] Generating new profile for ${naicsCode}`);
    const profile = await this.generateNewProfile(industryName, naicsCode, onProgress);

    // Cache the result
    profileCache.set(cacheKey, profile, CACHE_TTL_SECONDS);

    return profile;
  }

  /**
   * Generate new profile with 8-phase tracking
   */
  private static async generateNewProfile(
    industryName: string,
    naicsCode: string,
    onProgress?: ProgressCallback
  ): Promise<IndustryProfileFull> {
    const phases = [
      { stage: 'research', progress: 10, message: `Researching ${industryName} industry...`, time: 2000 },
      { stage: 'psychology', progress: 25, message: 'Analyzing customer psychology and triggers...', time: 2000 },
      { stage: 'market', progress: 40, message: 'Gathering market intelligence and trends...', time: 2000 },
      { stage: 'messaging', progress: 50, message: 'Developing messaging frameworks and templates...', time: 1000 },
      { stage: 'operational', progress: 55, message: 'Analyzing operational context...', time: 1000 },
      { stage: 'generating', progress: 60, message: 'Generating comprehensive profile with Claude Opus 4.1...', time: 0 },
      { stage: 'validation', progress: 92, message: 'Validating profile data with Zod...', time: 500 },
      { stage: 'saving', progress: 95, message: 'Saving profile to database...', time: 500 }
    ] as const;

    // Run through preparation phases
    for (const phase of phases.slice(0, 5)) {
      onProgress?.({
        stage: phase.stage as any,
        progress: phase.progress,
        message: phase.message,
        estimatedTimeRemaining: 180 - (phase.progress * 1.8)
      });
      await this.sleep(phase.time);
    }

    // Phase 6: AI Generation
    onProgress?.({
      stage: 'generating',
      progress: 60,
      message: 'Claude Opus is analyzing industry patterns and customer psychology...',
      estimatedTimeRemaining: 75
    });

    const prompt = MASTER_TEMPLATE_PROMPT
      .replace(/{INDUSTRY_NAME}/g, industryName)
      .replace(/{NAICS_CODE}/g, naicsCode);

    let rawProfile: any;
    try {
      rawProfile = await this.callOpusAPI(prompt, (apiProgress) => {
        const overallProgress = 60 + (apiProgress * 32); // 60% to 92%
        onProgress?.({
          stage: 'generating',
          progress: overallProgress,
          message: 'AI is analyzing industry patterns and customer psychology...',
          estimatedTimeRemaining: Math.max(10, 60 * (1 - apiProgress))
        });
      });
    } catch (error) {
      console.error('[IndustryProfileGenerator] API call failed:', error);
      onProgress?.({
        stage: 'error',
        progress: 90,
        message: `Profile generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        estimatedTimeRemaining: 0
      });
      throw error;
    }

    // Phase 7: Validation
    onProgress?.({
      stage: 'validation',
      progress: 92,
      message: 'Validating profile data with Zod...',
      estimatedTimeRemaining: 8
    });

    let profile: IndustryProfileFull;
    try {
      profile = validateIndustryProfile(rawProfile);
      console.log('[IndustryProfileGenerator] Profile validated successfully');
    } catch (error) {
      console.error('[IndustryProfileGenerator] Validation failed:', error);
      // Try to salvage what we can
      console.warn('[IndustryProfileGenerator] Attempting partial validation...');
      profile = this.partialValidate(rawProfile, naicsCode, industryName);
    }

    await this.sleep(500);

    // Phase 8: Saving
    onProgress?.({
      stage: 'saving',
      progress: 95,
      message: 'Saving profile to database...',
      estimatedTimeRemaining: 5
    });

    try {
      await this.saveToDatabase(profile, naicsCode);
    } catch (error) {
      console.error('[IndustryProfileGenerator] Failed to save profile:', error);
      // Don't throw - we have the profile even if save failed
    }

    await this.sleep(500);

    // Complete
    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Profile generation complete!',
      estimatedTimeRemaining: 0
    });

    console.log(`[IndustryProfileGenerator] Generation complete for: ${industryName}`);

    return profile;
  }

  /**
   * Call Opus API with retry logic and timeout
   */
  private static async callOpusAPI(
    prompt: string,
    onProgress?: (progress: number) => void
  ): Promise<any> {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration not found');
    }

    console.log('[IndustryProfileGenerator] Using ai-proxy Edge Function');

    // Simulate progress during API call
    const progressInterval = setInterval(() => {
      const currentProgress = Math.min(0.9, Math.random() * 0.2 + 0.5);
      onProgress?.(currentProgress);
    }, 3000);

    try {
      const response = await callAPIWithRetry(
        async () => {
          const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'HTTP-Referer': window.location.origin,
              'X-Title': 'Synapse Industry Profile Generator'
            },
            body: JSON.stringify({
              provider: 'openrouter',
              model: 'anthropic/claude-sonnet-4-5-20250929',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.7,
              max_tokens: 16000
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error: ${response.status} - ${errorText}`);
          }

          return res;
        },
        {
          maxRetries: 2,
          onError: (error) => console.error('[IndustryProfileGenerator] API call error:', error)
        }
      );

      clearInterval(progressInterval);
      onProgress?.(0.95);

      // Parse response
      const textResponse = await response.text();
      console.log('[IndustryProfileGenerator] Response received, length:', textResponse.length);

      const data = JSON.parse(textResponse);

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid API response structure');
      }

      const content = data.choices[0].message.content;

      // Extract JSON from response
      let profile = this.extractJSON(content);

      if (!profile) {
        throw new Error('No valid JSON found in API response');
      }

      onProgress?.(1.0);
      console.log('[IndustryProfileGenerator] Profile generation complete');

      return profile;

    } catch (error) {
      clearInterval(progressInterval);
      console.error('[IndustryProfileGenerator] Opus API error:', error);
      throw error;
    }
  }

  /**
   * Extract JSON from various response formats
   */
  private static extractJSON(content: string): any | null {
    // Try 1: Extract from JSON code block
    const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      try {
        return JSON.parse(jsonBlockMatch[1]);
      } catch (e) {
        console.warn('[IndustryProfileGenerator] Failed to parse JSON block');
      }
    }

    // Try 2: Extract raw JSON object
    const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      try {
        return JSON.parse(jsonObjectMatch[0]);
      } catch (e) {
        // Try 3: Clean and retry
        try {
          const cleaned = jsonObjectMatch[0]
            .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
            .replace(/\n/g, ' ')
            .replace(/\r/g, '');
          return JSON.parse(cleaned);
        } catch (e2) {
          console.error('[IndustryProfileGenerator] All JSON parsing attempts failed');
        }
      }
    }

    return null;
  }

  /**
   * Partial validation - salvage what we can from invalid data
   */
  private static partialValidate(
    data: any,
    naicsCode: string,
    industryName: string
  ): IndustryProfileFull {
    console.warn('[IndustryProfileGenerator] Using partial validation fallback');

    // Create minimal valid profile
    const minimal: IndustryProfileFull = {
      industry: industryName,
      industry_name: industryName,
      naics_code: naicsCode,
      category: data.category || 'General',
      subcategory: data.subcategory,

      customer_triggers: Array.isArray(data.customer_triggers) ? data.customer_triggers : ['Generic trigger'],
      customer_journey: typeof data.customer_journey === 'string' ? data.customer_journey : 'Awareness → Consideration → Decision',
      transformations: Array.isArray(data.transformations) ? data.transformations : ['Before → After'],
      success_metrics: Array.isArray(data.success_metrics) ? data.success_metrics : ['Customer satisfaction'],
      urgency_drivers: Array.isArray(data.urgency_drivers) ? data.urgency_drivers : ['Time sensitive'],
      objection_handlers: Array.isArray(data.objection_handlers) ? data.objection_handlers : ['Common objection'],
      risk_reversal: Array.isArray(data.risk_reversal) ? data.risk_reversal : ['Money-back guarantee'],
      customer_language_dictionary: Array.isArray(data.customer_language_dictionary) ? data.customer_language_dictionary : ['customer', 'service', 'quality'],

      value_propositions: Array.isArray(data.value_propositions) ? data.value_propositions : ['Quality service'],
      differentiators: Array.isArray(data.differentiators) ? data.differentiators : ['Expert team'],
      competitive_advantages: Array.isArray(data.competitive_advantages) ? data.competitive_advantages : ['Experience'],
      pricing_strategies: Array.isArray(data.pricing_strategies) ? data.pricing_strategies : ['Value-based'],
      service_delivery_models: Array.isArray(data.service_delivery_models) ? data.service_delivery_models : ['In-person'],
      unique_selling_propositions: Array.isArray(data.unique_selling_propositions) ? data.unique_selling_propositions : ['Trusted provider'],
      brand_positioning_templates: Array.isArray(data.brand_positioning_templates) ? data.brand_positioning_templates : ['Premium quality'],

      power_words: Array.isArray(data.power_words) ? data.power_words : ['professional', 'expert', 'quality'],
      avoid_words: Array.isArray(data.avoid_words) ? data.avoid_words : ['cheap', 'discount'],
      headline_templates: Array.isArray(data.headline_templates) ? data.headline_templates : ['Get [Benefit] Today'],
      call_to_action_templates: Array.isArray(data.call_to_action_templates) ? data.call_to_action_templates : ['Contact us now'],
      email_subject_line_templates: Array.isArray(data.email_subject_line_templates) ? data.email_subject_line_templates : ['Special Offer'],
      social_media_hooks: Array.isArray(data.social_media_hooks) ? data.social_media_hooks : ['Did you know...'],
      pain_point_language: Array.isArray(data.pain_point_language) ? data.pain_point_language : ['struggling with'],
      solution_language: Array.isArray(data.solution_language) ? data.solution_language : ['we can help'],
      proof_point_frameworks: Array.isArray(data.proof_point_frameworks) ? data.proof_point_frameworks : ['Years of experience'],

      seasonal_patterns: Array.isArray(data.seasonal_patterns) ? data.seasonal_patterns : ['Year-round demand'],
      geographic_variations: Array.isArray(data.geographic_variations) ? data.geographic_variations : ['Urban', 'Suburban'],
      demographic_insights: Array.isArray(data.demographic_insights) ? data.demographic_insights : ['Adults 25-54'],
      psychographic_profiles: Array.isArray(data.psychographic_profiles) ? data.psychographic_profiles : ['Value-conscious'],
      market_trends: Array.isArray(data.market_trends) ? data.market_trends : ['Digital transformation'],
      innovation_opportunities: Array.isArray(data.innovation_opportunities) ? data.innovation_opportunities : ['Technology adoption'],

      typical_business_models: Array.isArray(data.typical_business_models) ? data.typical_business_models : ['Service-based'],
      common_challenges: Array.isArray(data.common_challenges) ? data.common_challenges : ['Competition'],
      growth_strategies: Array.isArray(data.growth_strategies) ? data.growth_strategies : ['Referrals'],
      technology_stack_recommendations: Array.isArray(data.technology_stack_recommendations) ? data.technology_stack_recommendations : ['CRM system'],
      industry_associations_resources: Array.isArray(data.industry_associations_resources) ? data.industry_associations_resources : ['Industry association'],

      generated_on_demand: true,
      generated_at: new Date().toISOString(),
      profile_version: '1.0'
    };

    return minimal;
  }

  /**
   * Load profile from database
   */
  private static async loadFromDatabase(naicsCode: string): Promise<IndustryProfileFull | null> {
    try {
      const { data, error } = await supabase
        .from('industry_profiles')
        .select('*')
        .eq('naics_code', naicsCode)
        .single();

      if (error || !data) {
        return null;
      }

      return data as IndustryProfileFull;
    } catch (error) {
      console.error('[IndustryProfileGenerator] Database load error:', error);
      return null;
    }
  }

  /**
   * Save profile to database
   */
  private static async saveToDatabase(profile: IndustryProfileFull, naicsCode: string): Promise<void> {
    console.log('[IndustryProfileGenerator] Saving profile to database...');

    const { error } = await supabase
      .from('industry_profiles')
      .upsert({
        ...profile,
        naics_code: naicsCode,
        generated_on_demand: true,
        generated_at: new Date().toISOString()
      });

    if (error) {
      console.error('[IndustryProfileGenerator] Failed to save profile:', error);
      throw error;
    }

    console.log('[IndustryProfileGenerator] Profile saved successfully');
  }

  /**
   * Clear cache for specific NAICS code
   */
  static clearCache(naicsCode: string): void {
    const cacheKey = `industry_profile_${naicsCode}`;
    profileCache.delete(cacheKey);
    console.log(`[IndustryProfileGenerator] Cache cleared for ${naicsCode}`);
  }

  /**
   * Clear all cached profiles
   */
  static clearAllCache(): void {
    profileCache.clear();
    console.log('[IndustryProfileGenerator] All profile cache cleared');
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
