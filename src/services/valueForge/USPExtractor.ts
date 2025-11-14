/**
 * USP Extractor Service
 *
 * Extracts Unique Selling Proposition (USP) from Business Value Proposition (BVP)
 * and generates alternative formulations
 */

import type { BVPFormula } from '@/components/valueForge/BVPBuilder';
import type { ValueForgeContext } from '@/types/valueForge';

export interface USPOption {
  id: string;
  text: string;
  format: 'statement' | 'tagline' | 'promise' | 'challenge';
  differentiationScore: number; // 0-100
  memorabilityScore: number; // 0-100
  confidence: number;
  rationale: string;
}

export class USPExtractorService {
  /**
   * Extract USP from BVP and generate alternatives
   */
  extractUSP(bvp: BVPFormula, context: ValueForgeContext): USPOption[] {
    const usps: USPOption[] = [];

    // Generate different USP formats
    usps.push(this.generateStatementUSP(bvp));
    usps.push(this.generateTaglineUSP(bvp, context));
    usps.push(this.generatePromiseUSP(bvp));
    usps.push(this.generateChallengeUSP(bvp, context));

    // Score each USP
    return usps.map(usp => ({
      ...usp,
      differentiationScore: this.calculateDifferentiationScore(usp.text, bvp, context),
      memorabilityScore: this.calculateMemorabilityScore(usp.text)
    }));
  }

  /**
   * Generate Statement Format USP
   * Format: "We are the [unique] for [who]"
   */
  private generateStatementUSP(bvp: BVPFormula): USPOption {
    const text = `We are the ${bvp.unique} for ${bvp.who}`;

    return {
      id: 'usp-statement',
      text,
      format: 'statement',
      differentiationScore: 0,
      memorabilityScore: 0,
      confidence: 80,
      rationale: 'Clear, direct statement of your unique position'
    };
  }

  /**
   * Generate Tagline Format USP
   * Format: Short, punchy phrase emphasizing uniqueness
   */
  private generateTaglineUSP(bvp: BVPFormula, context: ValueForgeContext): USPOption {
    // Extract key differentiator words
    const uniqueWords = bvp.unique.split(' ').filter(word => word.length > 4);
    const keyWord = uniqueWords[0] || 'excellence';

    // Use industry power words if available
    let powerWord = keyWord;
    if (context.industryProfile?.powerWords && context.industryProfile.powerWords.length > 0) {
      powerWord = context.industryProfile.powerWords[0];
    }

    // Generate tagline variations
    const templates = [
      `${this.capitalize(keyWord)}. Delivered.`,
      `Where ${powerWord} Meets ${this.extractBenefit(bvp.what)}`,
      `${this.capitalize(keyWord)}, Guaranteed`,
      `Your ${powerWord} Partner`
    ];

    const text = templates[0];

    return {
      id: 'usp-tagline',
      text,
      format: 'tagline',
      differentiationScore: 0,
      memorabilityScore: 0,
      confidence: 75,
      rationale: 'Short, memorable tagline for marketing materials'
    };
  }

  /**
   * Generate Promise Format USP
   * Format: "We promise [transformation] through [unique approach]"
   */
  private generatePromiseUSP(bvp: BVPFormula): USPOption {
    const transformation = this.extractTransformation(bvp.what);
    const text = `We promise ${transformation} through ${bvp.unique}`;

    return {
      id: 'usp-promise',
      text,
      format: 'promise',
      differentiationScore: 0,
      memorabilityScore: 0,
      confidence: 85,
      rationale: 'Promise-based USP that builds trust and sets expectations'
    };
  }

  /**
   * Generate Challenge Format USP
   * Format: "Unlike [competitors], we [unique approach]"
   */
  private generateChallengeUSP(bvp: BVPFormula, context: ValueForgeContext): USPOption {
    const competitorApproach = this.getCompetitorApproach(context);
    const text = `Unlike ${competitorApproach}, we ${bvp.unique}`;

    return {
      id: 'usp-challenge',
      text,
      format: 'challenge',
      differentiationScore: 0,
      memorabilityScore: 0,
      confidence: 70,
      rationale: 'Directly challenges competitor approaches to highlight your difference'
    };
  }

  /**
   * Calculate differentiation score
   */
  private calculateDifferentiationScore(usp: string, bvp: BVPFormula, context: ValueForgeContext): number {
    let score = 50; // Base score

    // Check for specific differentiation keywords
    const diffKeywords = ['only', 'first', 'exclusive', 'proprietary', 'unique', 'unlike', 'different'];
    const hasDiff = diffKeywords.some(keyword => usp.toLowerCase().includes(keyword));
    if (hasDiff) score += 20;

    // Check if it mentions the unique differentiator from BVP
    if (usp.includes(bvp.unique)) score += 15;

    // Check against industry differentiators
    if (context.businessIntel?.website_analysis?.differentiators) {
      const alignsWithActual = context.businessIntel.website_analysis.differentiators.some(
        (diff: string) => usp.toLowerCase().includes(diff.toLowerCase())
      );
      if (alignsWithActual) score += 15;
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate memorability score
   */
  private calculateMemorabilityScore(usp: string): number {
    let score = 50; // Base score

    // Shorter is more memorable (up to a point)
    const wordCount = usp.split(' ').length;
    if (wordCount <= 5) score += 20;
    else if (wordCount <= 8) score += 10;
    else if (wordCount > 15) score -= 10;

    // Punchy words increase memorability
    const punchyWords = ['guarantee', 'promise', 'only', 'never', 'always', 'delivered'];
    const hasPunchy = punchyWords.some(word => usp.toLowerCase().includes(word));
    if (hasPunchy) score += 15;

    // Alliteration or rhyme (simple check)
    const words = usp.toLowerCase().split(' ');
    let hasAlliteration = false;
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i][0] === words[i + 1][0]) {
        hasAlliteration = true;
        break;
      }
    }
    if (hasAlliteration) score += 15;

    return Math.min(score, 100);
  }

  /**
   * Helper: Extract benefit from "what" field
   */
  private extractBenefit(what: string): string {
    // Simple extraction - look for benefit keywords
    const benefitKeywords = ['results', 'outcomes', 'success', 'growth', 'performance', 'excellence'];
    const lowerWhat = what.toLowerCase();

    for (const keyword of benefitKeywords) {
      if (lowerWhat.includes(keyword)) {
        return this.capitalize(keyword);
      }
    }

    // Default to last significant word
    const words = what.split(' ').filter(w => w.length > 4);
    return words[words.length - 1] || 'Results';
  }

  /**
   * Helper: Extract transformation from "what" field
   */
  private extractTransformation(what: string): string {
    // Look for action verbs or transformation indicators
    const transformationPatterns = [
      'achieve', 'transform', 'improve', 'grow', 'succeed', 'excel', 'deliver'
    ];

    const lowerWhat = what.toLowerCase();
    for (const pattern of transformationPatterns) {
      if (lowerWhat.includes(pattern)) {
        return `${pattern} your goals`;
      }
    }

    return `exceptional ${what}`;
  }

  /**
   * Helper: Get competitor approach from context
   */
  private getCompetitorApproach(context: ValueForgeContext): string {
    const competitive = context.businessIntel?.competitive;

    if (competitive?.commonApproaches && competitive.commonApproaches.length > 0) {
      return competitive.commonApproaches[0];
    }

    if (competitive?.weaknesses && competitive.weaknesses.length > 0) {
      return `competitors who ${competitive.weaknesses[0]}`;
    }

    // Generic fallback
    return 'typical providers';
  }

  /**
   * Helper: Capitalize first letter
   */
  private capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Get recommended USP based on scores
   */
  getRecommendedUSP(usps: USPOption[]): USPOption {
    // Sort by combined score (differentiation + memorability + confidence)
    const sorted = [...usps].sort((a, b) => {
      const scoreA = a.differentiationScore + a.memorabilityScore + a.confidence;
      const scoreB = b.differentiationScore + b.memorabilityScore + b.confidence;
      return scoreB - scoreA;
    });

    return sorted[0];
  }
}

export const uspExtractor = new USPExtractorService();
