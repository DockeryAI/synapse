/**
 * V4 Content Mix Engine
 *
 * Implements content mix rules for balanced content strategy:
 * - 70-20-10: 70% value, 20% curated, 10% promotional
 * - 4-1-1: 4 value, 1 soft sell, 1 hard sell per 6 posts
 * - 5-3-2: 5 curated, 3 original, 2 personal per 10 posts
 *
 * Ensures healthy balance between value and promotion.
 *
 * Created: 2025-11-26
 */

import type {
  ContentMixRule,
  ContentMixCategory,
  ContentMixConfig,
  GeneratedContent
} from './types';
import { CONTENT_MIX_CONFIGS } from './types';

// ============================================================================
// CONTENT MIX ANALYSIS TYPES
// ============================================================================

interface MixAnalysis {
  rule: ContentMixRule;
  currentRatios: Record<ContentMixCategory, number>;
  targetRatios: Record<ContentMixCategory, number>;
  isBalanced: boolean;
  imbalances: MixImbalance[];
  suggestions: string[];
}

interface MixImbalance {
  category: ContentMixCategory;
  current: number;
  target: number;
  difference: number;
  severity: 'low' | 'medium' | 'high';
}

interface ContentPlan {
  nextPost: ContentMixCategory;
  upcomingPosts: ContentMixCategory[];
  reason: string;
}

// ============================================================================
// CONTENT MIX ENGINE CLASS
// ============================================================================

class ContentMixEngine {
  private currentRule: ContentMixRule = '70-20-10';

  /**
   * Set the active content mix rule
   */
  setRule(rule: ContentMixRule): void {
    this.currentRule = rule;
  }

  /**
   * Get current rule configuration
   */
  getConfig(): ContentMixConfig {
    return CONTENT_MIX_CONFIGS[this.currentRule];
  }

  /**
   * Analyze existing content against the mix rule
   */
  analyzeMix(content: GeneratedContent[]): MixAnalysis {
    const config = this.getConfig();

    // Count current distribution
    const counts: Record<ContentMixCategory, number> = {
      value: 0,
      curated: 0,
      promo: 0,
      personal: 0,
      soft_sell: 0,
      hard_sell: 0
    };

    content.forEach(c => {
      if (c.mixCategory in counts) {
        counts[c.mixCategory]++;
      }
    });

    const total = content.length || 1;

    // Calculate current percentages
    const currentRatios: Record<ContentMixCategory, number> = {
      value: Math.round((counts.value / total) * 100),
      curated: Math.round((counts.curated / total) * 100),
      promo: Math.round((counts.promo / total) * 100),
      personal: Math.round((counts.personal / total) * 100),
      soft_sell: Math.round((counts.soft_sell / total) * 100),
      hard_sell: Math.round((counts.hard_sell / total) * 100)
    };

    // Find imbalances
    const imbalances: MixImbalance[] = [];
    const activeCategories = this.getActiveCategories(config);

    for (const category of activeCategories) {
      const target = config.ratios[category];
      const current = currentRatios[category];
      const difference = current - target;

      if (Math.abs(difference) > 5) { // 5% tolerance
        imbalances.push({
          category,
          current,
          target,
          difference,
          severity: Math.abs(difference) > 20 ? 'high' : Math.abs(difference) > 10 ? 'medium' : 'low'
        });
      }
    }

    // Generate suggestions
    const suggestions = this.generateSuggestions(imbalances, config);

    return {
      rule: this.currentRule,
      currentRatios,
      targetRatios: config.ratios,
      isBalanced: imbalances.length === 0,
      imbalances,
      suggestions
    };
  }

  /**
   * Get next post type to maintain balance
   */
  planNextContent(existingContent: GeneratedContent[], count: number = 5): ContentPlan {
    const analysis = this.analyzeMix(existingContent);
    const config = this.getConfig();

    // Determine what types are needed
    const needed: ContentMixCategory[] = [];

    // Sort imbalances by severity (high first) and under-represented (negative difference)
    const underRepresented = analysis.imbalances
      .filter(i => i.difference < 0)
      .sort((a, b) => b.severity.localeCompare(a.severity) || a.difference - b.difference);

    if (underRepresented.length > 0) {
      // Fill with under-represented categories
      underRepresented.forEach(imbalance => {
        const deficit = Math.abs(Math.round(imbalance.difference / 100 * existingContent.length));
        for (let i = 0; i < Math.max(1, deficit); i++) {
          needed.push(imbalance.category);
        }
      });
    }

    // If no imbalances, follow the standard pattern
    if (needed.length === 0) {
      needed.push(...this.getPatternSequence(config, count));
    }

    // Cap at requested count
    const upcomingPosts = needed.slice(0, count);

    return {
      nextPost: upcomingPosts[0] || 'value',
      upcomingPosts,
      reason: underRepresented.length > 0
        ? `Rebalancing: ${underRepresented[0].category} is ${Math.abs(underRepresented[0].difference)}% below target`
        : `Following ${this.currentRule} pattern`
    };
  }

  /**
   * Tag content with appropriate mix category
   */
  categorizeContent(content: {
    headline?: string;
    body: string;
    cta?: string;
  }): ContentMixCategory {
    const text = `${content.headline || ''} ${content.body} ${content.cta || ''}`.toLowerCase();

    // Check for promotional indicators
    const promoWords = ['buy', 'purchase', 'order', 'sign up', 'subscribe', 'get started', 'try now', 'limited time', 'discount', 'sale'];
    const softSellWords = ['learn more', 'discover', 'explore', 'see how', 'find out'];
    const personalWords = ['i ', 'my ', 'we ', 'our ', 'behind the scenes', 'story', 'journey', 'personal'];
    const curatedWords = ['according to', 'study shows', 'research', 'shared by', 'via @', 'interesting read'];

    // Count indicators
    const promoCount = promoWords.filter(w => text.includes(w)).length;
    const softSellCount = softSellWords.filter(w => text.includes(w)).length;
    const personalCount = personalWords.filter(w => text.includes(w)).length;
    const curatedCount = curatedWords.filter(w => text.includes(w)).length;

    // Determine category
    if (promoCount >= 2) return 'hard_sell';
    if (promoCount >= 1 || softSellCount >= 2) return 'soft_sell';
    if (promoCount >= 1) return 'promo';
    if (curatedCount >= 2) return 'curated';
    if (personalCount >= 2) return 'personal';

    return 'value'; // Default
  }

  /**
   * Get distribution for a batch of content
   */
  getDistribution(count: number): Record<ContentMixCategory, number> {
    const config = this.getConfig();
    const distribution: Record<ContentMixCategory, number> = {
      value: 0,
      curated: 0,
      promo: 0,
      personal: 0,
      soft_sell: 0,
      hard_sell: 0
    };

    const activeCategories = this.getActiveCategories(config);

    // Calculate counts based on ratios
    let remaining = count;
    const sortedCategories = activeCategories.sort((a, b) => config.ratios[b] - config.ratios[a]);

    for (const category of sortedCategories) {
      const ratio = config.ratios[category] / 100;
      const allocated = Math.round(count * ratio);
      distribution[category] = Math.min(allocated, remaining);
      remaining -= distribution[category];
    }

    // Distribute any remainder to highest ratio category
    if (remaining > 0) {
      distribution[sortedCategories[0]] += remaining;
    }

    return distribution;
  }

  /**
   * Validate a proposed content plan against rules
   */
  validatePlan(proposedContent: ContentMixCategory[]): {
    isValid: boolean;
    violations: string[];
    score: number;
  } {
    const config = this.getConfig();
    const violations: string[] = [];

    // Count proposed distribution
    const counts: Record<ContentMixCategory, number> = {
      value: 0,
      curated: 0,
      promo: 0,
      personal: 0,
      soft_sell: 0,
      hard_sell: 0
    };

    proposedContent.forEach(cat => counts[cat]++);
    const total = proposedContent.length || 1;

    // Check each category
    const activeCategories = this.getActiveCategories(config);
    let deviationSum = 0;

    for (const category of activeCategories) {
      const actual = (counts[category] / total) * 100;
      const target = config.ratios[category];
      const deviation = Math.abs(actual - target);

      deviationSum += deviation;

      if (deviation > 15) { // 15% tolerance for validation
        violations.push(`${category}: ${actual.toFixed(0)}% (target: ${target}%)`);
      }
    }

    // Check for too much promotional content
    const totalPromo = counts.promo + counts.soft_sell + counts.hard_sell;
    if (totalPromo / total > 0.3) { // More than 30% promotional
      violations.push('Too much promotional content (>30%)');
    }

    // Calculate score (100 = perfect match)
    const avgDeviation = deviationSum / activeCategories.length;
    const score = Math.max(0, 100 - avgDeviation * 2);

    return {
      isValid: violations.length === 0,
      violations,
      score: Math.round(score)
    };
  }

  /**
   * Get rule description for UI
   */
  getRuleDescription(rule?: ContentMixRule): {
    name: string;
    description: string;
    breakdown: string;
    bestFor: string;
  } {
    const r = rule || this.currentRule;

    const descriptions: Record<ContentMixRule, { name: string; description: string; breakdown: string; bestFor: string }> = {
      '70-20-10': {
        name: '70-20-10 Rule',
        description: 'The classic content marketing mix focusing on value-first approach',
        breakdown: '70% valuable/educational, 20% curated/shared, 10% promotional',
        bestFor: 'Building authority and trust, long-term brand building'
      },
      '4-1-1': {
        name: '4-1-1 Rule',
        description: 'Balanced approach with strategic promotion windows',
        breakdown: '4 value posts, 1 soft sell, 1 hard sell (per 6 posts)',
        bestFor: 'Product launches, sales cycles, B2B marketing'
      },
      '5-3-2': {
        name: '5-3-2 Rule',
        description: 'Mix of curated and original content with personal touch',
        breakdown: '5 curated, 3 original value, 2 personal/human content',
        bestFor: 'Thought leadership, community building, personal brands'
      }
    };

    return descriptions[r];
  }

  /**
   * Get all available rules
   */
  getAvailableRules(): ContentMixRule[] {
    return ['70-20-10', '4-1-1', '5-3-2'];
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private getActiveCategories(config: ContentMixConfig): ContentMixCategory[] {
    return (Object.keys(config.ratios) as ContentMixCategory[])
      .filter(cat => config.ratios[cat] > 0);
  }

  private generateSuggestions(imbalances: MixImbalance[], config: ContentMixConfig): string[] {
    const suggestions: string[] = [];

    for (const imbalance of imbalances) {
      if (imbalance.difference < 0) {
        // Under-represented
        suggestions.push(`Create more ${imbalance.category} content (+${Math.abs(imbalance.difference)}% needed)`);
      } else {
        // Over-represented
        suggestions.push(`Reduce ${imbalance.category} content (-${imbalance.difference}% over target)`);
      }
    }

    if (suggestions.length === 0) {
      suggestions.push('Your content mix is well-balanced!');
    }

    return suggestions;
  }

  private getPatternSequence(config: ContentMixConfig, count: number): ContentMixCategory[] {
    const sequence: ContentMixCategory[] = [];
    const rule = config.rule;

    switch (rule) {
      case '70-20-10':
        // Pattern: V V V V V V V C C P (70-20-10)
        for (let i = 0; i < count; i++) {
          const pos = i % 10;
          if (pos < 7) sequence.push('value');
          else if (pos < 9) sequence.push('curated');
          else sequence.push('promo');
        }
        break;

      case '4-1-1':
        // Pattern: V V V V S H (4-1-1)
        for (let i = 0; i < count; i++) {
          const pos = i % 6;
          if (pos < 4) sequence.push('value');
          else if (pos === 4) sequence.push('soft_sell');
          else sequence.push('hard_sell');
        }
        break;

      case '5-3-2':
        // Pattern: C C C C C V V V P P (5-3-2)
        for (let i = 0; i < count; i++) {
          const pos = i % 10;
          if (pos < 5) sequence.push('curated');
          else if (pos < 8) sequence.push('value');
          else sequence.push('personal');
        }
        break;
    }

    return sequence;
  }
}

// Export singleton instance
export const contentMixEngine = new ContentMixEngine();

// Export class for testing
export { ContentMixEngine };
