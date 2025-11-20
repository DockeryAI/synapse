/**
 * EQ Pattern Recognition Service
 *
 * Layer 2 of EQ Calculator v2.0
 * Detects emotional vs rational signals through pattern matching
 *
 * Analyzes:
 * - Passion signals (heritage, craft, collection)
 * - Community signals (forums, clubs, enthusiasts)
 * - Decision complexity (consultation vs instant)
 * - Price transparency (contact us vs transparent)
 * - Keyword density and proximity
 *
 * Created: 2025-11-19
 */

import type {
  DetectedSignals,
  EmotionalIndicator,
  RationalIndicator,
  DecisionComplexity,
  PriceTransparency,
  CommunitySignals,
  PassionSignals,
  PatternSignature,
  ContentAnalysis
} from '@/types/eq-calculator.types';

import {
  EMOTIONAL_KEYWORDS,
  RATIONAL_KEYWORDS,
  PASSION_KEYWORDS,
  COMMUNITY_KEYWORDS,
  DECISION_COMPLEXITY_KEYWORDS,
  PRICE_TRANSPARENCY_KEYWORDS
} from '@/types/eq-calculator.types';

/**
 * Pattern Recognition Service
 */
class PatternRecognitionService {
  /**
   * Analyze content and detect all signals
   */
  analyzeContent(
    content: string[],
    urls?: string[]
  ): DetectedSignals {
    // Combine all content
    const fullText = content.join('\n\n');

    console.log('[PatternRecognition] Analyzing content:', {
      contentPieces: content.length,
      totalLength: fullText.length
    });

    // Detect all signal types
    const emotionalIndicators = this.detectEmotionalIndicators(fullText, content, urls);
    const rationalIndicators = this.detectRationalIndicators(fullText, content, urls);
    const decisionComplexity = this.detectDecisionComplexity(fullText);
    const priceTransparency = this.detectPriceTransparency(fullText);
    const communitySignals = this.detectCommunitySignals(fullText);
    const passionSignals = this.detectPassionSignals(fullText);

    const signals: DetectedSignals = {
      emotional_indicators: emotionalIndicators,
      rational_indicators: rationalIndicators,
      decision_complexity: decisionComplexity,
      price_transparency: priceTransparency,
      community_signals: communitySignals,
      passion_signals: passionSignals
    };

    console.log('[PatternRecognition] Detection complete:', {
      emotional: emotionalIndicators.length,
      rational: rationalIndicators.length,
      community: communitySignals.has_community,
      passion: passionSignals.has_passion_indicators,
      complexity: decisionComplexity.complexity_level,
      priceTransparency: priceTransparency.transparency_level
    });

    return signals;
  }

  /**
   * Detect emotional indicators with context and proximity weighting
   */
  private detectEmotionalIndicators(
    fullText: string,
    contentPieces: string[],
    urls?: string[]
  ): EmotionalIndicator[] {
    const indicators: EmotionalIndicator[] = [];
    const productServiceKeywords = ['service', 'product', 'offer', 'solution', 'help', 'provide'];

    EMOTIONAL_KEYWORDS.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'gi');
      const matches = fullText.match(regex);

      if (matches) {
        matches.forEach(match => {
          // Get context (50 chars before/after)
          const index = fullText.toLowerCase().indexOf(match.toLowerCase());
          const start = Math.max(0, index - 50);
          const end = Math.min(fullText.length, index + match.length + 50);
          const context = fullText.slice(start, end);

          // Determine proximity to product/service mentions
          const proximityLevel = this.calculateProximity(context, productServiceKeywords);

          // Determine source type
          const source = this.determineSource(context, contentPieces, urls);

          // Calculate weight multiplier
          let weightMultiplier = 1.0;
          if (proximityLevel === 'high') weightMultiplier = 3.0;
          else if (proximityLevel === 'medium') weightMultiplier = 2.0;
          else weightMultiplier = 0.5;

          // Boost for testimonial sources
          if (source === 'testimonial') weightMultiplier *= 2;

          indicators.push({
            keyword: match,
            context,
            proximity_to_product: proximityLevel,
            weight_multiplier: weightMultiplier,
            source
          });
        });
      }
    });

    return indicators;
  }

  /**
   * Detect rational indicators
   */
  private detectRationalIndicators(
    fullText: string,
    contentPieces: string[],
    urls?: string[]
  ): RationalIndicator[] {
    const indicators: RationalIndicator[] = [];

    RATIONAL_KEYWORDS.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'gi');
      const matches = fullText.match(regex);

      if (matches) {
        matches.forEach(match => {
          // Get context
          const index = fullText.toLowerCase().indexOf(match.toLowerCase());
          const start = Math.max(0, index - 50);
          const end = Math.min(fullText.length, index + match.length + 50);
          const context = fullText.slice(start, end);

          // Determine emphasis (how prominently featured)
          const emphasis = this.determineEmphasis(context, fullText);

          // Determine source type
          const source = this.determineRationalSource(context, contentPieces, urls);

          // Calculate weight multiplier
          let weightMultiplier = 1.0;
          if (emphasis === 'strong') weightMultiplier = 2.0;
          else if (emphasis === 'moderate') weightMultiplier = 1.0;
          else weightMultiplier = 0.5;

          // Boost for pricing/ROI sources
          if (source === 'roi' || source === 'pricing') weightMultiplier *= 1.5;

          indicators.push({
            keyword: match,
            context,
            emphasis,
            weight_multiplier: weightMultiplier,
            source
          });
        });
      }
    });

    return indicators;
  }

  /**
   * Detect decision complexity
   */
  private detectDecisionComplexity(text: string): DecisionComplexity {
    const complexSignals: string[] = [];
    const simpleSignals: string[] = [];

    // Check for complex decision keywords
    DECISION_COMPLEXITY_KEYWORDS.COMPLEX.forEach(keyword => {
      if (new RegExp(`\\b${keyword}\\w*\\b`, 'i').test(text)) {
        complexSignals.push(keyword);
      }
    });

    // Check for simple decision keywords
    DECISION_COMPLEXITY_KEYWORDS.SIMPLE.forEach(keyword => {
      if (new RegExp(`\\b${keyword}\\w*\\b`, 'i').test(text)) {
        simpleSignals.push(keyword);
      }
    });

    // Determine complexity level
    let complexity_level: DecisionComplexity['complexity_level'];
    let eq_adjustment: number;

    if (complexSignals.length >= 3) {
      complexity_level = 'very-complex';
      eq_adjustment = 15;
    } else if (complexSignals.length >= 1) {
      complexity_level = 'complex';
      eq_adjustment = 10;
    } else if (simpleSignals.length >= 2) {
      complexity_level = 'simple';
      eq_adjustment = -10;
    } else {
      complexity_level = 'moderate';
      eq_adjustment = 0;
    }

    return {
      complexity_level,
      signals: [...complexSignals, ...simpleSignals],
      eq_adjustment
    };
  }

  /**
   * Detect price transparency
   */
  private detectPriceTransparency(text: string): PriceTransparency {
    const opaqueSignals: string[] = [];
    const transparentSignals: string[] = [];

    // Check for opaque pricing keywords
    PRICE_TRANSPARENCY_KEYWORDS.OPAQUE.forEach(keyword => {
      if (new RegExp(keyword, 'i').test(text)) {
        opaqueSignals.push(keyword);
      }
    });

    // Check for transparent pricing keywords
    PRICE_TRANSPARENCY_KEYWORDS.TRANSPARENT.forEach(keyword => {
      if (new RegExp(`\\b${keyword}\\w*\\b`, 'i').test(text)) {
        transparentSignals.push(keyword);
      }
    });

    // Determine transparency level
    let transparency_level: PriceTransparency['transparency_level'];
    let eq_adjustment: number;

    if (opaqueSignals.length >= 2) {
      transparency_level = 'contact-only';
      eq_adjustment = 15;
    } else if (opaqueSignals.length >= 1) {
      transparency_level = 'opaque';
      eq_adjustment = 10;
    } else if (transparentSignals.length >= 3) {
      transparency_level = 'fully-transparent';
      eq_adjustment = -10;
    } else if (transparentSignals.length >= 1) {
      transparency_level = 'partially-transparent';
      eq_adjustment = 0;
    } else {
      transparency_level = 'opaque';
      eq_adjustment = 5;
    }

    return {
      transparency_level,
      signals: [...opaqueSignals, ...transparentSignals],
      eq_adjustment
    };
  }

  /**
   * Detect community signals
   */
  private detectCommunitySignals(text: string): CommunitySignals {
    const signals: string[] = [];

    COMMUNITY_KEYWORDS.forEach(keyword => {
      if (new RegExp(`\\b${keyword}\\w*\\b`, 'i').test(text)) {
        signals.push(keyword);
      }
    });

    const has_community = signals.length > 0;
    let strength: CommunitySignals['strength'];
    let eq_boost: number;

    if (signals.length >= 5) {
      strength = 'strong';
      eq_boost = 20;
    } else if (signals.length >= 3) {
      strength = 'moderate';
      eq_boost = 15;
    } else if (signals.length >= 1) {
      strength = 'weak';
      eq_boost = 10;
    } else {
      strength = 'weak';
      eq_boost = 0;
    }

    return {
      has_community,
      signals,
      strength,
      eq_boost
    };
  }

  /**
   * Detect passion signals
   */
  private detectPassionSignals(text: string): PassionSignals {
    const signals: string[] = [];

    PASSION_KEYWORDS.forEach(keyword => {
      if (new RegExp(`\\b${keyword}\\w*\\b`, 'i').test(text)) {
        signals.push(keyword);
      }
    });

    const has_passion_indicators = signals.length > 0;
    let strength: PassionSignals['strength'];
    let eq_boost: number;

    if (signals.length >= 5) {
      strength = 'strong';
      eq_boost = 20;
    } else if (signals.length >= 3) {
      strength = 'moderate';
      eq_boost = 15;
    } else if (signals.length >= 1) {
      strength = 'weak';
      eq_boost = 10;
    } else {
      strength = 'weak';
      eq_boost = 0;
    }

    return {
      has_passion_indicators,
      signals,
      strength,
      eq_boost
    };
  }

  /**
   * Calculate keyword proximity to product/service mentions
   */
  private calculateProximity(
    context: string,
    productKeywords: string[]
  ): 'high' | 'medium' | 'low' {
    const contextLower = context.toLowerCase();
    const hasProduct = productKeywords.some(kw => contextLower.includes(kw));

    if (hasProduct) {
      // Check how close (within 20 chars = high, within context = medium)
      const minDistance = Math.min(
        ...productKeywords
          .filter(kw => contextLower.includes(kw))
          .map(kw => {
            const kwIndex = contextLower.indexOf(kw);
            return Math.abs(kwIndex - 50); // 50 is middle of context
          })
      );

      if (minDistance < 20) return 'high';
      return 'medium';
    }

    return 'low';
  }

  /**
   * Determine source type from context
   */
  private determineSource(
    context: string,
    contentPieces: string[],
    urls?: string[]
  ): EmotionalIndicator['source'] {
    const contextLower = context.toLowerCase();

    if (contextLower.includes('"') || contextLower.includes('testimonial') || contextLower.includes('review')) {
      return 'testimonial';
    }
    if (contextLower.includes('about') || contextLower.includes('our story')) {
      return 'about';
    }
    if (contextLower.includes('service') || contextLower.includes('offer')) {
      return 'service-page';
    }

    return 'content';
  }

  /**
   * Determine rational source type
   */
  private determineRationalSource(
    context: string,
    contentPieces: string[],
    urls?: string[]
  ): RationalIndicator['source'] {
    const contextLower = context.toLowerCase();

    if (contextLower.includes('price') || contextLower.includes('$') || contextLower.includes('cost')) {
      return 'pricing';
    }
    if (contextLower.includes('feature') || contextLower.includes('capability')) {
      return 'features';
    }
    if (contextLower.includes('vs') || contextLower.includes('compare') || contextLower.includes('comparison')) {
      return 'comparison';
    }
    if (contextLower.includes('roi') || contextLower.includes('return') || contextLower.includes('savings')) {
      return 'roi';
    }

    return 'other';
  }

  /**
   * Determine emphasis level for rational keywords
   */
  private determineEmphasis(
    context: string,
    fullText: string
  ): 'strong' | 'moderate' | 'weak' {
    const contextLower = context.toLowerCase();

    // Check for emphasis markers
    const hasHeading = /^#|<h[1-6]/.test(contextLower);
    const hasStrong = /<strong>|<b>|\*\*/.test(contextLower);
    const isEarly = fullText.indexOf(context) < fullText.length * 0.3;  // In first 30%

    if (hasHeading || (hasStrong && isEarly)) return 'strong';
    if (hasStrong || isEarly) return 'moderate';
    return 'weak';
  }

  /**
   * Calculate EQ from detected signals
   */
  calculateEQFromSignals(signals: DetectedSignals): number {
    // Start with baseline
    let eq = 50;

    // Calculate emotional vs rational keyword balance
    const emotionalCount = signals.emotional_indicators.length;
    const rationalCount = signals.rational_indicators.length;
    const totalKeywords = emotionalCount + rationalCount;

    if (totalKeywords > 0) {
      const emotionalRatio = emotionalCount / totalKeywords;
      // Shift EQ based on ratio (-25 to +25)
      eq += (emotionalRatio - 0.5) * 50;
    }

    // Apply signal adjustments
    eq += signals.decision_complexity.eq_adjustment;
    eq += signals.price_transparency.eq_adjustment;
    eq += signals.community_signals.eq_boost;
    eq += signals.passion_signals.eq_boost;

    // Apply weight multipliers
    const emotionalWeighted = signals.emotional_indicators.reduce(
      (sum, ind) => sum + ind.weight_multiplier,
      0
    );
    const rationalWeighted = signals.rational_indicators.reduce(
      (sum, ind) => sum + ind.weight_multiplier,
      0
    );
    const totalWeighted = emotionalWeighted + rationalWeighted;

    if (totalWeighted > 0) {
      const weightedEmotionalRatio = emotionalWeighted / totalWeighted;
      // Further adjust based on weighted ratio
      eq += (weightedEmotionalRatio - 0.5) * 20;
    }

    // Clamp to 0-100
    return Math.max(0, Math.min(100, Math.round(eq)));
  }

  /**
   * Generate pattern signature for learning
   */
  generatePatternSignature(
    content: string[],
    signals: DetectedSignals,
    calculatedEQ: number
  ): PatternSignature {
    const fullText = content.join('\n\n');
    const wordCount = fullText.split(/\s+/).length;

    // Calculate keyword density
    const emotionalDensity = (signals.emotional_indicators.length / wordCount) * 100;
    const rationalDensity = (signals.rational_indicators.length / wordCount) * 100;

    // Determine pattern type
    let pattern_type: PatternSignature['pattern_type'];
    if (signals.passion_signals.has_passion_indicators && signals.community_signals.has_community) {
      pattern_type = 'passion';
    } else if (emotionalDensity > rationalDensity * 1.5) {
      pattern_type = 'passion';
    } else if (rationalDensity > emotionalDensity * 1.5) {
      pattern_type = 'rational';
    } else if (signals.community_signals.has_community) {
      pattern_type = 'community';
    } else {
      pattern_type = 'hybrid';
    }

    // Detected keywords
    const detectedKeywords = [
      ...signals.emotional_indicators.map(ind => ind.keyword),
      ...signals.rational_indicators.map(ind => ind.keyword),
      ...signals.passion_signals.signals,
      ...signals.community_signals.signals
    ];

    // Confidence based on signal strength
    const signalStrength = [
      signals.emotional_indicators.length,
      signals.rational_indicators.length,
      signals.passion_signals.signals.length,
      signals.community_signals.signals.length
    ].reduce((sum, val) => sum + val, 0);

    const confidence = Math.min(100, 50 + signalStrength * 2);

    return {
      id: `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      pattern_type,
      detected_keywords: [...new Set(detectedKeywords)].slice(0, 20),
      keyword_density: {
        emotional: emotionalDensity,
        rational: rationalDensity
      },
      structural_signals: {
        has_testimonials: signals.emotional_indicators.some(ind => ind.source === 'testimonial'),
        has_forums: signals.community_signals.has_community,
        has_pricing_tables: signals.rational_indicators.some(ind => ind.source === 'pricing'),
        has_comparison_charts: signals.rational_indicators.some(ind => ind.source === 'comparison'),
        has_contact_only_pricing: signals.price_transparency.transparency_level === 'contact-only'
      },
      calculated_eq: calculatedEQ,
      confidence,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Perform content analysis for Layer 3
   */
  performContentAnalysis(content: string[]): ContentAnalysis {
    const fullText = content.join('\n\n');
    const words = fullText.split(/\s+/);
    const totalWords = words.length;

    // Count emotional keywords
    const emotionalKeywords: ContentAnalysis['emotional_keywords'] = [];
    EMOTIONAL_KEYWORDS.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'gi');
      const matches = fullText.match(regex);
      if (matches && matches.length > 0) {
        // Get contexts
        const contexts: string[] = [];
        matches.forEach(match => {
          const index = fullText.toLowerCase().indexOf(match.toLowerCase());
          const start = Math.max(0, index - 30);
          const end = Math.min(fullText.length, index + match.length + 30);
          contexts.push(fullText.slice(start, end));
        });

        emotionalKeywords.push({
          keyword,
          count: matches.length,
          contexts: contexts.slice(0, 3)  // Max 3 contexts
        });
      }
    });

    // Count rational keywords
    const rationalKeywords: ContentAnalysis['rational_keywords'] = [];
    RATIONAL_KEYWORDS.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'gi');
      const matches = fullText.match(regex);
      if (matches && matches.length > 0) {
        const contexts: string[] = [];
        matches.forEach(match => {
          const index = fullText.toLowerCase().indexOf(match.toLowerCase());
          const start = Math.max(0, index - 30);
          const end = Math.min(fullText.length, index + match.length + 30);
          contexts.push(fullText.slice(start, end));
        });

        rationalKeywords.push({
          keyword,
          count: matches.length,
          contexts: contexts.slice(0, 3)
        });
      }
    });

    // Calculate densities
    const emotionalDensity = (emotionalKeywords.reduce((sum, kw) => sum + kw.count, 0) / totalWords) * 100;
    const rationalDensity = (rationalKeywords.reduce((sum, kw) => sum + kw.count, 0) / totalWords) * 100;

    // Proximity-weighted score (simplified - would need more complex proximity calculation)
    const proximityWeightedScore = emotionalDensity > rationalDensity ? emotionalDensity * 1.2 : rationalDensity * 0.8;

    return {
      emotional_keywords: emotionalKeywords,
      rational_keywords: rationalKeywords,
      total_words: totalWords,
      emotional_density: emotionalDensity,
      rational_density: rationalDensity,
      proximity_weighted_score: proximityWeightedScore
    };
  }
}

// Export singleton instance
export const patternRecognitionService = new PatternRecognitionService();
export { PatternRecognitionService };
