/**
 * Profile Proof Extractor Service
 *
 * Extracts proof points optimized for each business profile type.
 * Different proof matters for different profiles.
 *
 * Created: 2025-11-29
 */

import type { DeepContext } from '@/types/synapse/deepContext.types';
import type { BusinessProfileType } from '@/services/triggers';

// ============================================================================
// TYPES
// ============================================================================

export interface ExtractedProof {
  type: 'rating' | 'testimonial' | 'metric' | 'certification' | 'social' | 'logo' | 'press' | 'award' | 'review' | 'years';
  title: string;
  value: string;
  source: string;
  sourceUrl?: string;
  rawData?: any;
}

export interface ProfileExtractionResult {
  proofs: ExtractedProof[];
  profileType: BusinessProfileType;
  extractionSources: string[];
}

// ============================================================================
// PROFILE-SPECIFIC EXTRACTION PATTERNS
// ============================================================================

const PROFILE_EXTRACTION_CONFIG: Record<BusinessProfileType, {
  priorityTypes: ExtractedProof['type'][];
  keywords: string[];
  patterns: RegExp[];
}> = {
  'local-service-b2b': {
    priorityTypes: ['certification', 'years', 'testimonial', 'metric'],
    keywords: [
      'licensed', 'certified', 'insured', 'bonded', 'years in business',
      'serving', 'commercial', 'industrial', 'response time', 'guarantee',
      'warranty', 'EPA certified', 'OSHA', 'contractor license'
    ],
    patterns: [
      /(\d+)\+?\s*years?\s*(in business|of experience|serving)/i,
      /licensed\s*(and)?\s*insured/i,
      /(\d+)\s*hour\s*response/i,
      /(\d+)%\s*(satisfaction|uptime|guarantee)/i,
      /serving\s*(\w+\s*){1,3}\s*since\s*(\d{4})/i
    ]
  },

  'local-service-b2c': {
    priorityTypes: ['rating', 'review', 'award', 'certification'],
    keywords: [
      'star rating', 'reviews', 'best of', 'top rated', 'award winning',
      'patient reviews', 'customer reviews', 'before and after',
      'certified', 'board certified', 'accredited'
    ],
    patterns: [
      /(\d\.?\d?)\s*star(s)?/i,
      /(\d+,?\d*)\+?\s*reviews?/i,
      /best\s*of\s*(\d{4}|\w+)/i,
      /top\s*rated/i,
      /(\d+)\s*happy\s*(customers|patients|clients)/i
    ]
  },

  'regional-b2b-agency': {
    priorityTypes: ['metric', 'logo', 'testimonial', 'award'],
    keywords: [
      'ROI', 'increase', 'growth', 'case study', 'results',
      'clients include', 'trusted by', 'partner', 'clutch',
      'agency of the year', 'certified partner'
    ],
    patterns: [
      /(\d+)%\s*(increase|growth|ROI|improvement)/i,
      /(\d+)x\s*(return|growth|increase)/i,
      /\$(\d+[KMB]?)\s*(saved|generated|revenue)/i,
      /clutch\s*(\d\.?\d?)\s*(star|rating)?/i,
      /(\d+)\+?\s*(clients|brands|companies)/i
    ]
  },

  'regional-retail-b2c': {
    priorityTypes: ['years', 'award', 'metric', 'social'],
    keywords: [
      'locations', 'stores', 'years', 'family owned', 'local',
      'community', 'best of', 'voted', 'franchise'
    ],
    patterns: [
      /(\d+)\+?\s*locations?/i,
      /since\s*(\d{4})/i,
      /(\d+)\s*years?\s*(serving|in business)/i,
      /family\s*owned/i,
      /voted\s*(#?\d+|best)/i
    ]
  },

  'national-saas-b2b': {
    priorityTypes: ['rating', 'certification', 'logo', 'metric'],
    keywords: [
      'G2', 'Capterra', 'TrustRadius', 'SOC 2', 'ISO 27001', 'GDPR',
      'enterprise', 'Fortune 500', 'uptime', 'SLA', 'integrations',
      'leader', 'highest rated', 'customers worldwide'
    ],
    patterns: [
      /G2\s*(\d\.?\d?)\s*(star|rating)?/i,
      /(\d+\.?\d?)%\s*uptime/i,
      /SOC\s*2\s*(Type\s*[12I])?/i,
      /ISO\s*27001/i,
      /(\d+)\+?\s*(integrations|customers|users)/i,
      /(\d+[KMB]?)\+?\s*(users|customers|companies)/i
    ]
  },

  'global-saas-b2b': {
    priorityTypes: ['rating', 'certification', 'logo', 'metric'],
    keywords: [
      'G2', 'Capterra', 'SOC 2', 'ISO', 'GDPR', 'global',
      'enterprise', 'Fortune 500', 'countries', 'worldwide'
    ],
    patterns: [
      /(\d+)\+?\s*countries/i,
      /global\s*(leader|platform)/i,
      /(\d+[KMB]?)\+?\s*(users|customers)\s*worldwide/i,
      /enterprise\s*grade/i
    ]
  },

  'national-product-b2c': {
    priorityTypes: ['review', 'rating', 'press', 'social'],
    keywords: [
      'reviews', 'rated', 'Amazon', 'best seller', 'featured in',
      'as seen on', 'press', 'influencer', 'followers', 'viral'
    ],
    patterns: [
      /(\d+,?\d*)\+?\s*reviews?/i,
      /(\d\.?\d?)\s*star(s)?\s*(on\s*Amazon)?/i,
      /#?\d+\s*best\s*seller/i,
      /featured\s*in\s*(\w+)/i,
      /as\s*seen\s*(on|in)\s*(\w+)/i,
      /(\d+[KMB]?)\+?\s*followers?/i
    ]
  }
};

// ============================================================================
// SERVICE
// ============================================================================

class ProfileProofExtractorService {
  /**
   * Extract proof points optimized for a specific profile type
   */
  extractProofForProfile(
    profileType: BusinessProfileType,
    deepContext: DeepContext | null
  ): ProfileExtractionResult {
    const config = PROFILE_EXTRACTION_CONFIG[profileType] || PROFILE_EXTRACTION_CONFIG['national-saas-b2b'];
    const proofs: ExtractedProof[] = [];
    const extractionSources: string[] = [];

    if (!deepContext) {
      return { proofs, profileType, extractionSources };
    }

    // Extract from website analysis
    if (deepContext.business?.websiteAnalysis) {
      extractionSources.push('website-analysis');
      const websiteProofs = this.extractFromWebsiteAnalysis(
        deepContext.business.websiteAnalysis,
        config
      );
      proofs.push(...websiteProofs);
    }

    // Extract from reviews
    if (deepContext.reviews) {
      extractionSources.push('reviews');
      const reviewProofs = this.extractFromReviews(deepContext.reviews, config);
      proofs.push(...reviewProofs);
    }

    // Extract from raw data points
    if (deepContext.rawDataPoints && deepContext.rawDataPoints.length > 0) {
      extractionSources.push('raw-data-points');
      const rawProofs = this.extractFromRawDataPoints(deepContext.rawDataPoints, config);
      proofs.push(...rawProofs);
    }

    // Extract from synthesis
    if (deepContext.synthesis) {
      extractionSources.push('synthesis');
      const synthProofs = this.extractFromSynthesis(deepContext.synthesis, config);
      proofs.push(...synthProofs);
    }

    // Sort by priority for this profile
    proofs.sort((a, b) => {
      const aIndex = config.priorityTypes.indexOf(a.type);
      const bIndex = config.priorityTypes.indexOf(b.type);
      const aPriority = aIndex === -1 ? 100 : aIndex;
      const bPriority = bIndex === -1 ? 100 : bIndex;
      return aPriority - bPriority;
    });

    return { proofs, profileType, extractionSources };
  }

  /**
   * Extract proof from website analysis data
   */
  private extractFromWebsiteAnalysis(
    analysis: any,
    config: typeof PROFILE_EXTRACTION_CONFIG[BusinessProfileType]
  ): ExtractedProof[] {
    const proofs: ExtractedProof[] = [];

    // Extract from proofPoints if available
    if (analysis.proofPoints && Array.isArray(analysis.proofPoints)) {
      for (const point of analysis.proofPoints) {
        const pointStr = typeof point === 'string' ? point : JSON.stringify(point);
        const matchedType = this.detectProofType(pointStr, config);
        proofs.push({
          type: matchedType,
          title: this.generateTitle(matchedType, pointStr),
          value: pointStr,
          source: 'website'
        });
      }
    }

    // Extract from testimonials
    if (analysis.testimonials && Array.isArray(analysis.testimonials)) {
      for (const testimonial of analysis.testimonials) {
        const text = typeof testimonial === 'string' ? testimonial : testimonial.text || testimonial.quote || '';
        if (text) {
          proofs.push({
            type: 'testimonial',
            title: 'Customer Testimonial',
            value: text,
            source: 'website',
            rawData: testimonial
          });
        }
      }
    }

    // Extract metrics from value propositions
    if (analysis.valuePropositions && Array.isArray(analysis.valuePropositions)) {
      for (const prop of analysis.valuePropositions) {
        const propStr = typeof prop === 'string' ? prop : JSON.stringify(prop);
        // Check if it contains metrics
        for (const pattern of config.patterns) {
          const match = propStr.match(pattern);
          if (match) {
            proofs.push({
              type: 'metric',
              title: 'Key Metric',
              value: propStr,
              source: 'website'
            });
            break;
          }
        }
      }
    }

    return proofs;
  }

  /**
   * Extract proof from reviews data
   */
  private extractFromReviews(
    reviews: any,
    config: typeof PROFILE_EXTRACTION_CONFIG[BusinessProfileType]
  ): ExtractedProof[] {
    const proofs: ExtractedProof[] = [];

    // Google reviews
    if (reviews.google) {
      if (reviews.google.averageRating) {
        proofs.push({
          type: 'rating',
          title: 'Google Rating',
          value: `${reviews.google.averageRating} stars`,
          source: 'google-reviews'
        });
      }
      if (reviews.google.totalReviews) {
        proofs.push({
          type: 'metric',
          title: 'Google Reviews',
          value: `${reviews.google.totalReviews} reviews`,
          source: 'google-reviews'
        });
      }
      // Individual reviews
      if (reviews.google.reviews && Array.isArray(reviews.google.reviews)) {
        for (const review of reviews.google.reviews.slice(0, 5)) {
          if (review.text && review.rating >= 4) {
            proofs.push({
              type: 'review',
              title: `${review.rating}-Star Review`,
              value: review.text,
              source: 'google-reviews',
              rawData: review
            });
          }
        }
      }
    }

    // G2 reviews (for SaaS)
    if (reviews.g2) {
      if (reviews.g2.rating) {
        proofs.push({
          type: 'rating',
          title: 'G2 Rating',
          value: `${reviews.g2.rating} stars on G2`,
          source: 'g2-reviews'
        });
      }
    }

    // Trustpilot reviews
    if (reviews.trustpilot) {
      if (reviews.trustpilot.rating) {
        proofs.push({
          type: 'rating',
          title: 'Trustpilot Rating',
          value: `${reviews.trustpilot.rating} stars on Trustpilot`,
          source: 'trustpilot'
        });
      }
    }

    return proofs;
  }

  /**
   * Extract proof from raw data points
   */
  private extractFromRawDataPoints(
    rawDataPoints: any[],
    config: typeof PROFILE_EXTRACTION_CONFIG[BusinessProfileType]
  ): ExtractedProof[] {
    const proofs: ExtractedProof[] = [];

    for (const dataPoint of rawDataPoints) {
      const text = dataPoint.text || dataPoint.content || dataPoint.value || '';
      if (!text || typeof text !== 'string') continue;

      // Check against patterns
      for (const pattern of config.patterns) {
        if (pattern.test(text)) {
          const matchedType = this.detectProofType(text, config);
          proofs.push({
            type: matchedType,
            title: this.generateTitle(matchedType, text),
            value: text,
            source: dataPoint.source || 'data-point',
            rawData: dataPoint
          });
          break;
        }
      }

      // Check against keywords
      const textLower = text.toLowerCase();
      for (const keyword of config.keywords) {
        if (textLower.includes(keyword.toLowerCase())) {
          const matchedType = this.detectProofType(text, config);
          // Avoid duplicates
          if (!proofs.some(p => p.value === text)) {
            proofs.push({
              type: matchedType,
              title: this.generateTitle(matchedType, text),
              value: text,
              source: dataPoint.source || 'data-point',
              rawData: dataPoint
            });
          }
          break;
        }
      }
    }

    return proofs;
  }

  /**
   * Extract proof from synthesis data
   */
  private extractFromSynthesis(
    synthesis: any,
    config: typeof PROFILE_EXTRACTION_CONFIG[BusinessProfileType]
  ): ExtractedProof[] {
    const proofs: ExtractedProof[] = [];

    // Extract from key insights
    if (synthesis.keyInsights && Array.isArray(synthesis.keyInsights)) {
      for (const insight of synthesis.keyInsights) {
        const text = typeof insight === 'string' ? insight : insight.text || '';
        if (text) {
          for (const pattern of config.patterns) {
            if (pattern.test(text)) {
              proofs.push({
                type: 'metric',
                title: 'Key Insight',
                value: text,
                source: 'synthesis'
              });
              break;
            }
          }
        }
      }
    }

    // Extract from credibility signals
    if (synthesis.credibilitySignals && Array.isArray(synthesis.credibilitySignals)) {
      for (const signal of synthesis.credibilitySignals) {
        const text = typeof signal === 'string' ? signal : signal.text || '';
        if (text) {
          proofs.push({
            type: 'certification',
            title: 'Credibility Signal',
            value: text,
            source: 'synthesis'
          });
        }
      }
    }

    return proofs;
  }

  /**
   * Detect proof type from text content
   */
  private detectProofType(
    text: string,
    config: typeof PROFILE_EXTRACTION_CONFIG[BusinessProfileType]
  ): ExtractedProof['type'] {
    const textLower = text.toLowerCase();

    // Check for ratings
    if (/\d\.?\d?\s*star|rating|rated/i.test(text)) {
      return 'rating';
    }

    // Check for reviews
    if (/reviews?|testimonial/i.test(text)) {
      return 'review';
    }

    // Check for certifications
    if (/certified|license|accredited|SOC|ISO|HIPAA|GDPR/i.test(text)) {
      return 'certification';
    }

    // Check for awards
    if (/award|winner|best of|top rated|#1/i.test(text)) {
      return 'award';
    }

    // Check for years/experience
    if (/years?\s*(in business|of experience|serving)|since\s*\d{4}/i.test(text)) {
      return 'years';
    }

    // Check for metrics
    if (/\d+%|\d+x|\$\d+|\d+\+?\s*(customers|users|clients)/i.test(text)) {
      return 'metric';
    }

    // Check for press
    if (/featured in|as seen|press|media/i.test(text)) {
      return 'press';
    }

    // Check for social proof
    if (/followers?|likes?|shares?|viral/i.test(text)) {
      return 'social';
    }

    // Default to first priority type for this profile
    return config.priorityTypes[0] || 'metric';
  }

  /**
   * Generate a title based on proof type
   */
  private generateTitle(type: ExtractedProof['type'], value: string): string {
    const titles: Record<ExtractedProof['type'], string> = {
      rating: 'Customer Rating',
      testimonial: 'Customer Testimonial',
      metric: 'Key Metric',
      certification: 'Certification',
      social: 'Social Proof',
      logo: 'Client Logo',
      press: 'Press Mention',
      award: 'Award',
      review: 'Customer Review',
      years: 'Experience'
    };

    return titles[type] || 'Proof Point';
  }
}

export const profileProofExtractorService = new ProfileProofExtractorService();
export default profileProofExtractorService;
