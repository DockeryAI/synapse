/**
 * Power Word Optimizer
 *
 * Enhances content by identifying opportunities to use power words
 * and optimizing for psychological impact.
 *
 * Created: 2025-11-10
 */

import type {
  ContentDraft,
  PowerWord,
  PowerWordCategory,
  PowerWordSuggestion,
  OptimizationOpportunity,
  BusinessProfile
} from '@/types/breakthroughContent.types';

// Import power words database
import powerWordsData from '@/data/powerWords.json';

export class PowerWordOptimizer {
  private powerWords: Map<PowerWordCategory, PowerWord[]>;
  private phrases: typeof powerWordsData.phrases;
  private industryWords: typeof powerWordsData.industry_specific;

  constructor() {
    this.powerWords = this.loadPowerWords();
    this.phrases = powerWordsData.phrases;
    this.industryWords = powerWordsData.industry_specific;
  }

  /**
   * Load power words from database
   */
  private loadPowerWords(): Map<PowerWordCategory, PowerWord[]> {
    const map = new Map<PowerWordCategory, PowerWord[]>();

    Object.entries(powerWordsData.categories).forEach(([category, data]) => {
      const words = data.words.map(w => ({
        word: w.word,
        category: category as PowerWordCategory,
        impact: w.impact,
        context: w.context,
        alternatives: w.alternatives
      }));

      map.set(category as PowerWordCategory, words);
    });

    return map;
  }

  /**
   * Optimize content draft
   */
  async optimize(
    content: ContentDraft,
    business?: BusinessProfile
  ): Promise<ContentDraft> {
    console.log('[PowerWordOptimizer] Optimizing content...');

    // Find optimization opportunities
    const opportunities = this.findOpportunities(content, business);

    console.log(`[PowerWordOptimizer] Found ${opportunities.length} optimization opportunities`);

    // Sort by impact (highest first)
    const sortedOpportunities = opportunities
      .sort((a, b) => b.suggestion.impact - a.suggestion.impact);

    // Apply top 5-7 suggestions (don't over-optimize)
    const toApply = sortedOpportunities
      .filter(opp => opp.suggestion.impact > 0.3)
      .slice(0, 7);

    console.log(`[PowerWordOptimizer] Applying ${toApply.length} optimizations`);

    let optimized = { ...content };

    // Apply suggestions
    toApply.forEach(opp => {
      if (opp.location === 'headline') {
        optimized.headline = this.applySuggestion(optimized.headline, opp.suggestion);
      } else if (opp.location === 'hook') {
        optimized.hook = this.applySuggestion(optimized.hook, opp.suggestion);
      } else if (opp.location === 'body') {
        optimized.body = this.applySuggestion(optimized.body, opp.suggestion);
      } else if (opp.location === 'cta') {
        optimized.cta = this.applySuggestion(optimized.cta, opp.suggestion);
      }
    });

    // Add industry-specific power words if available
    if (business?.industry) {
      optimized = this.addIndustryWords(optimized, business);
    }

    return optimized;
  }

  /**
   * Find optimization opportunities
   */
  private findOpportunities(
    content: ContentDraft,
    business?: BusinessProfile
  ): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];

    // Check each content section
    opportunities.push(...this.analyzeSection(content.headline, 'headline', business));
    opportunities.push(...this.analyzeSection(content.hook, 'hook', business));
    opportunities.push(...this.analyzeSection(content.body, 'body', business));
    opportunities.push(...this.analyzeSection(content.cta, 'cta', business));

    return opportunities;
  }

  /**
   * Analyze content section for opportunities
   */
  private analyzeSection(
    text: string,
    location: string,
    business?: BusinessProfile
  ): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];
    const words = text.toLowerCase().split(/\s+/);

    // Check for weak words that can be replaced
    const weakWords = [
      'very', 'really', 'quite', 'pretty', 'somewhat', 'fairly',
      'good', 'bad', 'nice', 'great', 'thing', 'stuff'
    ];

    words.forEach((word, index) => {
      if (weakWords.includes(word)) {
        const context = words.slice(Math.max(0, index - 2), index + 3).join(' ');
        const suggestion = this.suggestPowerWord(word, context, location);

        if (suggestion) {
          opportunities.push({
            location,
            phrase: word,
            context,
            suggestion,
            priority: suggestion.impact > 0.6 ? 'high' : suggestion.impact > 0.4 ? 'medium' : 'low'
          });
        }
      }
    });

    // Check for missing power words in key positions
    if (location === 'headline' || location === 'hook') {
      const hasPowerWord = this.containsPowerWord(text);
      if (!hasPowerWord) {
        const suggestion = this.suggestPowerWordForPosition(location, text);
        if (suggestion) {
          opportunities.push({
            location,
            phrase: text.substring(0, 30),
            context: text,
            suggestion,
            priority: 'high'
          });
        }
      }
    }

    return opportunities;
  }

  /**
   * Suggest power word replacement
   */
  private suggestPowerWord(
    originalWord: string,
    context: string,
    location: string
  ): PowerWordSuggestion | null {
    // Determine appropriate category based on location
    let targetCategory: PowerWordCategory;

    if (location === 'headline' || location === 'hook') {
      targetCategory = 'curiosity';
    } else if (location === 'cta') {
      targetCategory = 'urgency';
    } else {
      targetCategory = 'transformation';
    }

    const categoryWords = this.powerWords.get(targetCategory) || [];

    // Find appropriate replacement
    const candidates = categoryWords.filter(pw =>
      pw.context.some(c => context.toLowerCase().includes(c.toLowerCase()))
    );

    if (candidates.length === 0) {
      // Fallback to any power word in category
      const fallback = categoryWords[0];
      if (fallback) {
        return {
          original: originalWord,
          suggestion: fallback.word,
          category: targetCategory,
          impact: fallback.impact * 0.5, // Lower impact for generic replacement
          reason: `Replace weak word "${originalWord}" with power word "${fallback.word}"`
        };
      }
      return null;
    }

    // Use highest impact candidate
    const best = candidates.sort((a, b) => b.impact - a.impact)[0];

    return {
      original: originalWord,
      suggestion: best.word,
      category: targetCategory,
      impact: best.impact,
      reason: `"${best.word}" (${targetCategory}) is ${(best.impact * 100).toFixed(0)}% more impactful than "${originalWord}"`
    };
  }

  /**
   * Suggest power word for specific position
   */
  private suggestPowerWordForPosition(
    location: string,
    text: string
  ): PowerWordSuggestion | null {
    if (location === 'headline') {
      // Suggest curiosity or transformation words
      const curiosityWords = this.powerWords.get('curiosity') || [];
      const best = curiosityWords[0];

      if (best) {
        return {
          original: '',
          suggestion: `Start with "${best.word}"`,
          category: 'curiosity',
          impact: best.impact,
          reason: `Headlines with curiosity words get ${(best.impact * 100).toFixed(0)}% more engagement`
        };
      }
    }

    return null;
  }

  /**
   * Check if text contains power word
   */
  private containsPowerWord(text: string): boolean {
    const lowerText = text.toLowerCase();

    for (const words of this.powerWords.values()) {
      for (const pw of words) {
        if (lowerText.includes(pw.word.toLowerCase())) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Apply suggestion to text
   */
  private applySuggestion(text: string, suggestion: PowerWordSuggestion): string {
    if (!suggestion.original) {
      // Adding new power word
      return `${suggestion.suggestion} ${text}`;
    }

    // Replace original with suggestion
    const regex = new RegExp(`\\b${suggestion.original}\\b`, 'gi');
    return text.replace(regex, suggestion.suggestion);
  }

  /**
   * Add industry-specific power words
   */
  private addIndustryWords(
    content: ContentDraft,
    business: BusinessProfile
  ): ContentDraft {
    const industryKey = this.getIndustryKey(business.industry);
    const industryData = this.industryWords[industryKey as keyof typeof this.industryWords];

    if (!industryData) {
      return content;
    }

    // Try to incorporate industry power words naturally
    const industryPowerWords = industryData.power_words || [];

    // Check if body already contains industry words
    const bodyLower = content.body.toLowerCase();
    const missingWords = industryPowerWords.filter(
      word => !bodyLower.includes(word.toLowerCase())
    );

    // Add 1-2 missing industry words if appropriate
    if (missingWords.length > 0 && content.body.length < 500) {
      const wordsToAdd = missingWords.slice(0, 2);
      // Simple addition (in real implementation, use NLP to find natural insertion points)
      console.log(`[PowerWordOptimizer] Consider adding industry words: ${wordsToAdd.join(', ')}`);
    }

    return content;
  }

  /**
   * Get industry key from business industry
   */
  private getIndustryKey(industry: string): string {
    const lowerIndustry = industry.toLowerCase();

    if (lowerIndustry.includes('roof')) return 'roofing';
    if (lowerIndustry.includes('legal') || lowerIndustry.includes('law')) return 'legal';
    if (lowerIndustry.includes('health') || lowerIndustry.includes('medical')) return 'healthcare';
    if (lowerIndustry.includes('real estate') || lowerIndustry.includes('property')) return 'real_estate';

    return 'general_business';
  }

  /**
   * Extract all power words from content
   */
  extractPowerWords(text: string): string[] {
    const found: string[] = [];
    const lowerText = text.toLowerCase();

    for (const words of this.powerWords.values()) {
      for (const pw of words) {
        if (lowerText.includes(pw.word.toLowerCase())) {
          found.push(pw.word);
        }
      }
    }

    return found;
  }

  /**
   * Get power words by category
   */
  getPowerWordsByCategory(category: PowerWordCategory): PowerWord[] {
    return this.powerWords.get(category) || [];
  }

  /**
   * Get curiosity gap phrases
   */
  getCuriosityGapPhrases(): string[] {
    return this.phrases.curiosity_gaps;
  }

  /**
   * Get urgency trigger phrases
   */
  getUrgencyTriggerPhrases(): string[] {
    return this.phrases.urgency_triggers;
  }

  /**
   * Get social proof phrases
   */
  getSocialProofPhrases(): string[] {
    return this.phrases.social_proof;
  }

  /**
   * Get transformation promise phrases
   */
  getTransformationPhrases(): string[] {
    return this.phrases.transformation_promises;
  }

  /**
   * Get CTAs for specific goal
   */
  getCTAsForGoal(goal: 'engagement' | 'lead_generation' | 'viral'): string[] {
    const ctas = powerWordsData.cta_formulas;
    return ctas[goal] || ctas.engagement;
  }

  /**
   * Predict impact of content
   */
  predictImpact(content: ContentDraft): number {
    const powerWords = this.extractPowerWords(
      `${content.headline} ${content.hook} ${content.body} ${content.cta}`
    );

    // Base score
    let impact = 0.5;

    // Add points for power words (max 0.3)
    impact += Math.min(powerWords.length * 0.05, 0.3);

    // Add points for headline power word
    if (this.containsPowerWord(content.headline)) {
      impact += 0.1;
    }

    // Add points for hook power word
    if (this.containsPowerWord(content.hook)) {
      impact += 0.1;
    }

    return Math.min(impact, 1.0);
  }
}
