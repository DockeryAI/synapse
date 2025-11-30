/**
 * Multi-Source Competitor Validator
 *
 * Task 6.8: Validates discovered competitors against multiple sources
 * like G2, Capterra, and other software review platforms.
 *
 * Features:
 * - G2 competitor cross-reference via Perplexity
 * - Capterra validation queries
 * - Confidence boosting for multi-source matches
 * - Additional metadata extraction (ratings, categories)
 *
 * Created: 2025-11-28
 */

import { supabase } from '@/utils/supabase/client';
import type { DiscoveredCompetitor } from '@/types/competitor-intelligence.types';

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationSource {
  source: 'g2' | 'capterra' | 'trustpilot' | 'gartner';
  found: boolean;
  url?: string;
  rating?: number;
  review_count?: number;
  categories?: string[];
  market_position?: string;
}

export interface ValidatedCompetitor extends DiscoveredCompetitor {
  validation_sources: ValidationSource[];
  validation_confidence: number;
  is_validated: boolean;
  total_review_count?: number;
  average_rating?: number;
}

export interface MultiSourceValidationRequest {
  competitors: DiscoveredCompetitor[];
  brand_industry: string;
  brand_name: string;
}

export interface MultiSourceValidationResult {
  validated_competitors: ValidatedCompetitor[];
  validation_summary: {
    total_competitors: number;
    validated_count: number;
    sources_checked: string[];
    average_confidence_boost: number;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Confidence boost per validated source */
const SOURCE_CONFIDENCE_BOOST: Record<string, number> = {
  g2: 0.15,
  capterra: 0.12,
  trustpilot: 0.08,
  gartner: 0.15
};

/** Software review platform validation prompt */
const G2_CAPTERRA_VALIDATION_PROMPT = `You are a software market research analyst. Validate if these competitors exist on G2 and Capterra.

For each competitor, provide:
1. Whether they are listed on G2 (yes/no)
2. Whether they are listed on Capterra (yes/no)
3. Their approximate rating on each platform (1-5 scale)
4. Their software category on these platforms
5. Any market position indicators (Leader, High Performer, etc.)

Be factual - only confirm presence if you're confident they exist on these platforms.

Industry: {industry}
Brand being analyzed: {brand_name}

Competitors to validate:
{competitors_list}

Respond in JSON format:
{
  "validations": [
    {
      "name": "Competitor Name",
      "g2": {
        "found": true/false,
        "rating": 4.5,
        "categories": ["Category 1", "Category 2"],
        "market_position": "Leader" | "High Performer" | null
      },
      "capterra": {
        "found": true/false,
        "rating": 4.3,
        "categories": ["Category 1"]
      }
    }
  ]
}`;

// ============================================================================
// SERVICE CLASS
// ============================================================================

class MultiSourceValidatorService {
  /**
   * Validate competitors against G2 and Capterra
   */
  async validateCompetitors(
    request: MultiSourceValidationRequest
  ): Promise<MultiSourceValidationResult> {
    const startTime = performance.now();
    console.log('[MultiSourceValidator] Starting validation for', request.competitors.length, 'competitors');

    // Build the prompt with competitor list
    const competitorsList = request.competitors
      .map((c, i) => `${i + 1}. ${c.name}${c.website ? ` (${c.website})` : ''}`)
      .join('\n');

    const prompt = G2_CAPTERRA_VALIDATION_PROMPT
      .replace('{industry}', request.brand_industry)
      .replace('{brand_name}', request.brand_name)
      .replace('{competitors_list}', competitorsList);

    try {
      // Call Perplexity for validation
      const { data, error } = await supabase.functions.invoke('perplexity-proxy', {
        body: {
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a software market analyst with expertise in G2 and Capterra platforms. Validate competitor presence on these review platforms accurately.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 2000
        }
      });

      if (error) {
        console.error('[MultiSourceValidator] Perplexity error:', error);
        return this.createUnvalidatedResult(request.competitors);
      }

      // Parse the response
      const validations = this.parseValidationResponse(data?.choices?.[0]?.message?.content || '');

      // Match validations to competitors
      const validatedCompetitors = request.competitors.map(competitor => {
        const validation = validations.find(v =>
          v.name.toLowerCase() === competitor.name.toLowerCase() ||
          competitor.name.toLowerCase().includes(v.name.toLowerCase()) ||
          v.name.toLowerCase().includes(competitor.name.toLowerCase())
        );

        return this.applyValidation(competitor, validation);
      });

      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      const validatedCount = validatedCompetitors.filter(c => c.is_validated).length;

      console.log('[MultiSourceValidator] Validation complete in', duration, 's:', {
        total: request.competitors.length,
        validated: validatedCount
      });

      return {
        validated_competitors: validatedCompetitors,
        validation_summary: {
          total_competitors: request.competitors.length,
          validated_count: validatedCount,
          sources_checked: ['g2', 'capterra'],
          average_confidence_boost: validatedCompetitors.reduce((sum, c) =>
            sum + (c.validation_confidence - (c.confidence || 0.5)), 0) / validatedCompetitors.length
        }
      };

    } catch (err) {
      console.error('[MultiSourceValidator] Validation failed:', err);
      return this.createUnvalidatedResult(request.competitors);
    }
  }

  /**
   * Parse the validation response from Perplexity
   */
  private parseValidationResponse(content: string): Array<{
    name: string;
    g2?: { found: boolean; rating?: number; categories?: string[]; market_position?: string };
    capterra?: { found: boolean; rating?: number; categories?: string[] };
  }> {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('[MultiSourceValidator] No JSON found in response');
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.validations || [];
    } catch (err) {
      console.error('[MultiSourceValidator] Failed to parse response:', err);
      return [];
    }
  }

  /**
   * Apply validation data to a competitor
   */
  private applyValidation(
    competitor: DiscoveredCompetitor,
    validation?: {
      name: string;
      g2?: { found: boolean; rating?: number; categories?: string[]; market_position?: string };
      capterra?: { found: boolean; rating?: number; categories?: string[] };
    }
  ): ValidatedCompetitor {
    const validationSources: ValidationSource[] = [];
    let confidenceBoost = 0;
    let totalRating = 0;
    let ratingCount = 0;
    let totalReviewCount = 0;

    if (validation) {
      // G2 validation
      if (validation.g2) {
        validationSources.push({
          source: 'g2',
          found: validation.g2.found,
          rating: validation.g2.rating,
          categories: validation.g2.categories,
          market_position: validation.g2.market_position
        });

        if (validation.g2.found) {
          confidenceBoost += SOURCE_CONFIDENCE_BOOST.g2;
          if (validation.g2.rating) {
            totalRating += validation.g2.rating;
            ratingCount++;
          }
        }
      }

      // Capterra validation
      if (validation.capterra) {
        validationSources.push({
          source: 'capterra',
          found: validation.capterra.found,
          rating: validation.capterra.rating,
          categories: validation.capterra.categories
        });

        if (validation.capterra.found) {
          confidenceBoost += SOURCE_CONFIDENCE_BOOST.capterra;
          if (validation.capterra.rating) {
            totalRating += validation.capterra.rating;
            ratingCount++;
          }
        }
      }
    }

    const baseConfidence = competitor.confidence || 0.5;
    const validationConfidence = Math.min(baseConfidence + confidenceBoost, 1.0);
    const isValidated = validationSources.some(s => s.found);

    return {
      ...competitor,
      validation_sources: validationSources,
      validation_confidence: validationConfidence,
      is_validated: isValidated,
      average_rating: ratingCount > 0 ? totalRating / ratingCount : undefined,
      total_review_count: totalReviewCount > 0 ? totalReviewCount : undefined,
      // Update the base confidence with validation boost
      confidence: validationConfidence
    };
  }

  /**
   * Create unvalidated result when validation fails
   */
  private createUnvalidatedResult(competitors: DiscoveredCompetitor[]): MultiSourceValidationResult {
    const unvalidatedCompetitors: ValidatedCompetitor[] = competitors.map(c => ({
      ...c,
      validation_sources: [],
      validation_confidence: c.confidence || 0.5,
      is_validated: false
    }));

    return {
      validated_competitors: unvalidatedCompetitors,
      validation_summary: {
        total_competitors: competitors.length,
        validated_count: 0,
        sources_checked: [],
        average_confidence_boost: 0
      }
    };
  }

  /**
   * Quick validation check for a single competitor
   */
  async quickValidate(competitorName: string, industry: string): Promise<ValidationSource[]> {
    const result = await this.validateCompetitors({
      competitors: [{ name: competitorName } as DiscoveredCompetitor],
      brand_industry: industry,
      brand_name: ''
    });

    return result.validated_competitors[0]?.validation_sources || [];
  }
}

// Export singleton
export const multiSourceValidator = new MultiSourceValidatorService();
export default multiSourceValidator;
