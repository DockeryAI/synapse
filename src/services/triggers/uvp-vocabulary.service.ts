/**
 * UVP Vocabulary Extractor Service
 *
 * Extracts keywords from UVP components to build a weighted term dictionary
 * for trigger relevance scoring. Ensures triggers are relevant to the user's
 * actual product, customers, and market.
 *
 * Created: 2025-11-28
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';

// ============================================================================
// TYPES
// ============================================================================

export interface BrandVocabulary {
  /** High weight terms from UVP statements */
  primaryTerms: string[];
  /** Medium weight terms from evidence/quotes */
  secondaryTerms: string[];
  /** Industry-specific keywords */
  industryTerms: string[];
  /** Geographic relevance terms */
  regionTerms: string[];
  /** Term weights for scoring */
  weights: Map<string, number>;
  /** All unique terms flattened */
  allTerms: string[];
  /** Brand name and variations */
  brandTerms: string[];
}

export interface VocabularyExtractionResult {
  vocabulary: BrandVocabulary;
  termCount: number;
  extractedFrom: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Stop words to filter out
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have',
  'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
  'might', 'must', 'shall', 'can', 'need', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'whom',
  'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
  'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there', 'then',
  'once', 'if', 'any', 'our', 'your', 'their', 'its', 'my', 'his', 'her'
]);

// Industry keyword patterns
const INDUSTRY_PATTERNS: Record<string, string[]> = {
  'saas': ['software', 'platform', 'api', 'integration', 'dashboard', 'cloud', 'subscription', 'saas', 'app', 'tool'],
  'ai': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'automation', 'bot', 'chatbot', 'conversational', 'nlp', 'llm'],
  'enterprise': ['enterprise', 'business', 'corporate', 'organization', 'company', 'b2b', 'professional'],
  'healthcare': ['health', 'medical', 'patient', 'clinical', 'healthcare', 'hospital', 'doctor', 'care'],
  'finance': ['finance', 'financial', 'banking', 'investment', 'insurance', 'fintech', 'payment'],
  'retail': ['retail', 'store', 'shop', 'ecommerce', 'product', 'customer', 'shopping'],
  'marketing': ['marketing', 'advertising', 'campaign', 'brand', 'content', 'social media', 'digital'],
  'consulting': ['consulting', 'advisory', 'strategy', 'management', 'professional services'],
};

// Region keyword patterns
const REGION_PATTERNS: Record<string, string[]> = {
  'uk': ['uk', 'united kingdom', 'britain', 'british', 'england', 'london', 'fca', 'nhs'],
  'emea': ['emea', 'europe', 'european', 'eu', 'gdpr', 'middle east', 'africa'],
  'us': ['us', 'usa', 'united states', 'american', 'hipaa', 'sox', 'california'],
  'apac': ['apac', 'asia', 'pacific', 'australia', 'singapore', 'japan', 'china'],
  'global': ['global', 'international', 'worldwide', 'multi-region', 'multinational'],
};

// ============================================================================
// SERVICE
// ============================================================================

class UVPVocabularyService {
  /**
   * Extract vocabulary from complete UVP
   */
  extractVocabulary(uvp: CompleteUVP, brandData?: any): VocabularyExtractionResult {
    const extractedFrom: string[] = [];
    const weights = new Map<string, number>();

    // Extract from each UVP component
    const primaryTerms = this.extractPrimaryTerms(uvp, extractedFrom);
    const secondaryTerms = this.extractSecondaryTerms(uvp, extractedFrom);
    const industryTerms = this.extractIndustryTerms(uvp, brandData, extractedFrom);
    const regionTerms = this.extractRegionTerms(uvp, brandData, extractedFrom);
    const brandTerms = this.extractBrandTerms(brandData, extractedFrom);

    // Assign weights
    primaryTerms.forEach(term => weights.set(term.toLowerCase(), 1.0));
    secondaryTerms.forEach(term => {
      if (!weights.has(term.toLowerCase())) {
        weights.set(term.toLowerCase(), 0.7);
      }
    });
    industryTerms.forEach(term => {
      if (!weights.has(term.toLowerCase())) {
        weights.set(term.toLowerCase(), 0.8);
      }
    });
    regionTerms.forEach(term => {
      if (!weights.has(term.toLowerCase())) {
        weights.set(term.toLowerCase(), 0.6);
      }
    });
    brandTerms.forEach(term => {
      weights.set(term.toLowerCase(), 1.0); // Brand terms always high weight
    });

    // Combine all unique terms
    const allTerms = [...new Set([
      ...primaryTerms,
      ...secondaryTerms,
      ...industryTerms,
      ...regionTerms,
      ...brandTerms
    ])].map(t => t.toLowerCase());

    const vocabulary: BrandVocabulary = {
      primaryTerms,
      secondaryTerms,
      industryTerms,
      regionTerms,
      brandTerms,
      weights,
      allTerms
    };

    return {
      vocabulary,
      termCount: allTerms.length,
      extractedFrom
    };
  }

  /**
   * Calculate overlap score between text and vocabulary
   */
  calculateOverlapScore(text: string, vocabulary: BrandVocabulary): number {
    const textTerms = this.tokenize(text);
    if (textTerms.length === 0) return 0;

    let totalScore = 0;
    let matchCount = 0;

    for (const term of textTerms) {
      const weight = vocabulary.weights.get(term);
      if (weight) {
        totalScore += weight;
        matchCount++;
      }
    }

    // Normalize by text length and vocabulary coverage
    const coverageRatio = matchCount / textTerms.length;
    const weightedScore = matchCount > 0 ? totalScore / matchCount : 0;

    // Combined score: coverage matters more than just having matches
    return Math.min(1, coverageRatio * 0.6 + weightedScore * 0.4);
  }

  /**
   * Check if text contains key terms from vocabulary
   */
  containsKeyTerms(text: string, vocabulary: BrandVocabulary, minMatches: number = 2): boolean {
    const textLower = text.toLowerCase();
    let matches = 0;

    for (const term of vocabulary.primaryTerms) {
      if (textLower.includes(term.toLowerCase())) {
        matches++;
        if (matches >= minMatches) return true;
      }
    }

    return false;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private extractPrimaryTerms(uvp: CompleteUVP, extractedFrom: string[]): string[] {
    const terms: string[] = [];

    // Target customer statement
    if (uvp.targetCustomer?.statement) {
      terms.push(...this.extractKeyPhrases(uvp.targetCustomer.statement));
      extractedFrom.push('targetCustomer.statement');
    }

    // Target customer industry
    if (uvp.targetCustomer?.industry) {
      terms.push(...this.tokenize(uvp.targetCustomer.industry));
      extractedFrom.push('targetCustomer.industry');
    }

    // Key benefit statement
    if (uvp.keyBenefit?.statement) {
      terms.push(...this.extractKeyPhrases(uvp.keyBenefit.statement));
      extractedFrom.push('keyBenefit.statement');
    }

    // Unique solution statement
    if (uvp.uniqueSolution?.statement) {
      terms.push(...this.extractKeyPhrases(uvp.uniqueSolution.statement));
      extractedFrom.push('uniqueSolution.statement');
    }

    // Transformation statement
    if (uvp.transformationGoal?.statement) {
      terms.push(...this.extractKeyPhrases(uvp.transformationGoal.statement));
      extractedFrom.push('transformationGoal.statement');
    }

    // Value proposition
    if (uvp.valuePropositionStatement) {
      terms.push(...this.extractKeyPhrases(uvp.valuePropositionStatement));
      extractedFrom.push('valuePropositionStatement');
    }

    return [...new Set(terms)];
  }

  private extractSecondaryTerms(uvp: CompleteUVP, extractedFrom: string[]): string[] {
    const terms: string[] = [];

    // Evidence quotes
    if (uvp.targetCustomer?.evidenceQuotes) {
      uvp.targetCustomer.evidenceQuotes.forEach(quote => {
        terms.push(...this.extractKeyPhrases(quote));
      });
      extractedFrom.push('targetCustomer.evidenceQuotes');
    }

    // Emotional drivers
    if (uvp.targetCustomer?.emotionalDrivers) {
      uvp.targetCustomer.emotionalDrivers.forEach(driver => {
        terms.push(...this.tokenize(driver));
      });
      extractedFrom.push('targetCustomer.emotionalDrivers');
    }

    // Functional drivers
    if (uvp.targetCustomer?.functionalDrivers) {
      uvp.targetCustomer.functionalDrivers.forEach(driver => {
        terms.push(...this.tokenize(driver));
      });
      extractedFrom.push('targetCustomer.functionalDrivers');
    }

    // Differentiators
    if (uvp.uniqueSolution?.differentiators) {
      uvp.uniqueSolution.differentiators.forEach(diff => {
        terms.push(...this.extractKeyPhrases(diff.statement));
      });
      extractedFrom.push('uniqueSolution.differentiators');
    }

    // Metrics
    if (uvp.keyBenefit?.metrics) {
      uvp.keyBenefit.metrics.forEach(metric => {
        terms.push(...this.tokenize(metric.metric));
      });
      extractedFrom.push('keyBenefit.metrics');
    }

    // Transformation before/after
    if (uvp.transformationGoal?.before) {
      terms.push(...this.extractKeyPhrases(uvp.transformationGoal.before));
      extractedFrom.push('transformationGoal.before');
    }
    if (uvp.transformationGoal?.after) {
      terms.push(...this.extractKeyPhrases(uvp.transformationGoal.after));
      extractedFrom.push('transformationGoal.after');
    }

    return [...new Set(terms)];
  }

  private extractIndustryTerms(uvp: CompleteUVP, brandData: any, extractedFrom: string[]): string[] {
    const terms: string[] = [];
    const textToAnalyze: string[] = [];

    // Gather text to analyze
    if (uvp.targetCustomer?.industry) textToAnalyze.push(uvp.targetCustomer.industry);
    if (uvp.targetCustomer?.statement) textToAnalyze.push(uvp.targetCustomer.statement);
    if (uvp.uniqueSolution?.statement) textToAnalyze.push(uvp.uniqueSolution.statement);
    if (brandData?.industry) textToAnalyze.push(brandData.industry);
    if (brandData?.description) textToAnalyze.push(brandData.description);

    const combinedText = textToAnalyze.join(' ').toLowerCase();

    // Match against industry patterns
    for (const [industry, patterns] of Object.entries(INDUSTRY_PATTERNS)) {
      for (const pattern of patterns) {
        if (combinedText.includes(pattern)) {
          terms.push(...patterns); // Add all related terms
          extractedFrom.push(`industry:${industry}`);
          break;
        }
      }
    }

    return [...new Set(terms)];
  }

  private extractRegionTerms(uvp: CompleteUVP, brandData: any, extractedFrom: string[]): string[] {
    const terms: string[] = [];
    const textToAnalyze: string[] = [];

    // Gather text to analyze
    if (uvp.targetCustomer?.statement) textToAnalyze.push(uvp.targetCustomer.statement);
    if (brandData?.location) textToAnalyze.push(brandData.location);
    if (brandData?.headquarters) textToAnalyze.push(brandData.headquarters);
    if (brandData?.description) textToAnalyze.push(brandData.description);

    // Check for market geography in UVP
    const marketGeo = (uvp.targetCustomer as any)?.marketGeography;
    if (marketGeo?.primaryRegions) {
      textToAnalyze.push(...marketGeo.primaryRegions);
    }

    const combinedText = textToAnalyze.join(' ').toLowerCase();

    // Match against region patterns
    for (const [region, patterns] of Object.entries(REGION_PATTERNS)) {
      for (const pattern of patterns) {
        if (combinedText.includes(pattern)) {
          terms.push(...patterns); // Add all related terms
          extractedFrom.push(`region:${region}`);
          break;
        }
      }
    }

    return [...new Set(terms)];
  }

  private extractBrandTerms(brandData: any, extractedFrom: string[]): string[] {
    const terms: string[] = [];

    if (brandData?.name) {
      // Add brand name and variations
      const name = brandData.name;
      terms.push(name.toLowerCase());

      // Add individual words from brand name
      terms.push(...this.tokenize(name));

      // Add common variations (without spaces, camelCase split)
      terms.push(name.replace(/\s+/g, '').toLowerCase());

      extractedFrom.push('brandData.name');
    }

    return [...new Set(terms)];
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !STOP_WORDS.has(word));
  }

  private extractKeyPhrases(text: string): string[] {
    const phrases: string[] = [];

    // Single words
    phrases.push(...this.tokenize(text));

    // Two-word phrases (bigrams)
    const words = text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(w => w.length > 0);
    for (let i = 0; i < words.length - 1; i++) {
      if (!STOP_WORDS.has(words[i]) && !STOP_WORDS.has(words[i + 1])) {
        phrases.push(`${words[i]} ${words[i + 1]}`);
      }
    }

    return phrases;
  }
}

// Export singleton
export const uvpVocabularyService = new UVPVocabularyService();
