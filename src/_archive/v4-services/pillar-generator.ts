/**
 * V4 Pillar Generator
 *
 * Generates content pillars from UVP data.
 * Pillars are the thematic foundations for content strategy.
 *
 * Each UVP generates 3-5 pillars based on:
 * - Target Customer (who they are, their pain points)
 * - Transformation Goal (before/after states)
 * - Unique Solution (differentiators)
 * - Key Benefit (outcomes)
 *
 * Created: 2025-11-26
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { ContentPillar, PillarSource } from './types';

// ============================================================================
// PILLAR GENERATION STRATEGIES
// ============================================================================

interface PillarStrategy {
  source: PillarSource;
  nameTemplate: (uvp: CompleteUVP) => string;
  descriptionTemplate: (uvp: CompleteUVP) => string;
  contentTypes: string[];
  suggestedFrequency: 'daily' | 'weekly' | 'bi-weekly';
  topicGenerator: (uvp: CompleteUVP) => string[];
}

const PILLAR_STRATEGIES: PillarStrategy[] = [
  // PILLAR 1: Customer Pain Points
  {
    source: 'target_customer',
    nameTemplate: (uvp) => {
      const tc = uvp.targetCustomer;
      if (tc?.emotionalDrivers?.[0]) {
        return `Overcoming ${extractKeyword(tc.emotionalDrivers[0])}`;
      }
      return 'Industry Challenges';
    },
    descriptionTemplate: (uvp) => {
      const tc = uvp.targetCustomer;
      return `Content addressing the core challenges faced by ${tc?.statement || 'your target audience'}`;
    },
    contentTypes: ['problem-aware', 'educational', 'empathy'],
    suggestedFrequency: 'weekly',
    topicGenerator: (uvp) => {
      const topics: string[] = [];
      const tc = uvp.targetCustomer;
      const tg = uvp.transformationGoal;

      if (tc?.emotionalDrivers) {
        tc.emotionalDrivers.slice(0, 3).forEach(driver => {
          topics.push(`Why ${extractKeyword(driver)} is holding you back`);
          topics.push(`The hidden cost of ${extractKeyword(driver)}`);
        });
      }

      if (tc?.functionalDrivers) {
        tc.functionalDrivers.slice(0, 2).forEach(driver => {
          topics.push(`How to solve ${extractKeyword(driver)}`);
        });
      }

      if (tg?.before) {
        topics.push(`Are you stuck in "${tg.before}"?`);
      }

      return topics.slice(0, 5);
    }
  },

  // PILLAR 2: Transformation Journey
  {
    source: 'transformation_goal',
    nameTemplate: (uvp) => {
      const tg = uvp.transformationGoal;
      if (tg?.after) {
        return `Path to ${extractKeyword(tg.after)}`;
      }
      return 'Transformation Stories';
    },
    descriptionTemplate: (uvp) => {
      const tg = uvp.transformationGoal;
      return `Content showing the journey from "${tg?.before || 'current state'}" to "${tg?.after || 'desired outcome'}"`;
    },
    contentTypes: ['story', 'case-study', 'transformation'],
    suggestedFrequency: 'weekly',
    topicGenerator: (uvp) => {
      const topics: string[] = [];
      const tg = uvp.transformationGoal;

      if (tg?.before && tg?.after) {
        topics.push(`From ${tg.before} to ${tg.after}: A real story`);
        topics.push(`What it really takes to go from ${extractKeyword(tg.before)} to ${extractKeyword(tg.after)}`);
      }

      if (tg?.emotionalDrivers) {
        tg.emotionalDrivers.slice(0, 2).forEach(driver => {
          topics.push(`How ${extractKeyword(driver)} changed everything`);
        });
      }

      if (tg?.statement) {
        topics.push(`The moment I realized: ${tg.statement.substring(0, 50)}...`);
      }

      return topics.slice(0, 5);
    }
  },

  // PILLAR 3: Unique Methodology
  {
    source: 'unique_solution',
    nameTemplate: (uvp) => {
      const us = uvp.uniqueSolution;
      if (us?.methodology) {
        return `The ${extractKeyword(us.methodology)} Method`;
      }
      if (us?.differentiators?.[0]) {
        return extractKeyword(us.differentiators[0].statement);
      }
      return 'Our Unique Approach';
    },
    descriptionTemplate: (uvp) => {
      const us = uvp.uniqueSolution;
      return `Content explaining how ${us?.statement || 'our unique approach'} delivers results differently`;
    },
    contentTypes: ['how-to', 'methodology', 'behind-the-scenes'],
    suggestedFrequency: 'bi-weekly',
    topicGenerator: (uvp) => {
      const topics: string[] = [];
      const us = uvp.uniqueSolution;

      if (us?.differentiators) {
        us.differentiators.slice(0, 3).forEach(diff => {
          topics.push(`Why ${extractKeyword(diff.statement)} matters`);
          topics.push(`The science behind ${extractKeyword(diff.statement)}`);
        });
      }

      if (us?.methodology) {
        topics.push(`Inside the ${us.methodology}`);
        topics.push(`Step-by-step: How ${us.methodology} works`);
      }

      if (us?.proprietaryApproach) {
        topics.push(`What makes ${extractKeyword(us.proprietaryApproach)} different`);
      }

      return topics.slice(0, 5);
    }
  },

  // PILLAR 4: Results & Proof
  {
    source: 'key_benefit',
    nameTemplate: (uvp) => {
      const kb = uvp.keyBenefit;
      if (kb?.metrics?.[0]) {
        return `Achieving ${kb.metrics[0].metric}`;
      }
      return 'Results That Matter';
    },
    descriptionTemplate: (uvp) => {
      const kb = uvp.keyBenefit;
      return `Content showcasing ${kb?.outcomeType || 'quantifiable'} results and proof of value`;
    },
    contentTypes: ['data', 'testimonial', 'case-study', 'proof'],
    suggestedFrequency: 'weekly',
    topicGenerator: (uvp) => {
      const topics: string[] = [];
      const kb = uvp.keyBenefit;

      if (kb?.metrics) {
        kb.metrics.slice(0, 3).forEach(metric => {
          topics.push(`How we achieved ${metric.value} ${metric.metric}`);
          topics.push(`${metric.metric}: The numbers don't lie`);
        });
      }

      if (kb?.statement) {
        topics.push(`The real impact: ${kb.statement.substring(0, 50)}...`);
      }

      if (kb?.industryComparison) {
        topics.push(`How we compare to industry average: ${kb.industryComparison.yourResult} vs ${kb.industryComparison.averageResult}`);
      }

      return topics.slice(0, 5);
    }
  },

  // PILLAR 5: Thought Leadership
  {
    source: 'value_proposition',
    nameTemplate: (uvp) => {
      if (uvp.whyStatement) {
        return extractKeyword(uvp.whyStatement);
      }
      return 'Industry Insights';
    },
    descriptionTemplate: (uvp) => {
      return `Content establishing authority through ${uvp.whyStatement || 'unique perspectives and insights'}`;
    },
    contentTypes: ['opinion', 'trend-analysis', 'contrarian', 'prediction'],
    suggestedFrequency: 'bi-weekly',
    topicGenerator: (uvp) => {
      const topics: string[] = [];

      if (uvp.whyStatement) {
        topics.push(`Why I believe: ${uvp.whyStatement.substring(0, 50)}...`);
        topics.push(`The unpopular truth about ${extractKeyword(uvp.whyStatement)}`);
      }

      if (uvp.valuePropositionStatement) {
        topics.push(`What everyone gets wrong about ${extractKeyword(uvp.valuePropositionStatement)}`);
      }

      // Generic thought leadership topics
      topics.push('The future of our industry');
      topics.push('3 trends that will reshape everything');
      topics.push('What I wish I knew when I started');

      return topics.slice(0, 5);
    }
  }
];

// ============================================================================
// PILLAR GENERATOR CLASS
// ============================================================================

class PillarGenerator {
  /**
   * Generate content pillars from UVP
   * Returns 3-5 pillars based on UVP completeness
   */
  generatePillars(uvp: CompleteUVP): ContentPillar[] {
    const pillars: ContentPillar[] = [];

    for (const strategy of PILLAR_STRATEGIES) {
      // Check if UVP has data for this pillar source
      if (!this.hasDataForSource(uvp, strategy.source)) {
        continue;
      }

      const pillar: ContentPillar = {
        id: `pillar-${strategy.source}-${Date.now()}`,
        name: strategy.nameTemplate(uvp),
        description: strategy.descriptionTemplate(uvp),
        source: strategy.source,
        contentTypes: strategy.contentTypes,
        suggestedFrequency: strategy.suggestedFrequency,
        exampleTopics: strategy.topicGenerator(uvp)
      };

      pillars.push(pillar);
    }

    // Ensure at least 3 pillars
    if (pillars.length < 3) {
      pillars.push(...this.getDefaultPillars(uvp, 3 - pillars.length));
    }

    // Cap at 5 pillars
    return pillars.slice(0, 5);
  }

  /**
   * Generate a single pillar for a specific source
   */
  generatePillarForSource(uvp: CompleteUVP, source: PillarSource): ContentPillar | null {
    const strategy = PILLAR_STRATEGIES.find(s => s.source === source);
    if (!strategy) return null;

    return {
      id: `pillar-${source}-${Date.now()}`,
      name: strategy.nameTemplate(uvp),
      description: strategy.descriptionTemplate(uvp),
      source: strategy.source,
      contentTypes: strategy.contentTypes,
      suggestedFrequency: strategy.suggestedFrequency,
      exampleTopics: strategy.topicGenerator(uvp)
    };
  }

  /**
   * Get content suggestions for a specific pillar
   */
  getContentSuggestions(pillar: ContentPillar, count: number = 5): string[] {
    // Return more topics if available, or cycle through existing
    const suggestions = [...pillar.exampleTopics];

    while (suggestions.length < count) {
      // Add variations
      suggestions.push(`${pillar.name}: A deeper look`);
      suggestions.push(`Quick tip: ${pillar.name}`);
      suggestions.push(`The mistake most make with ${pillar.name}`);
    }

    return suggestions.slice(0, count);
  }

  /**
   * Validate pillar coverage
   * Returns sources that don't have pillars yet
   */
  getMissingPillarSources(uvp: CompleteUVP, existingPillars: ContentPillar[]): PillarSource[] {
    const existingSources = new Set(existingPillars.map(p => p.source));
    const allSources: PillarSource[] = [
      'target_customer',
      'transformation_goal',
      'unique_solution',
      'key_benefit',
      'value_proposition'
    ];

    return allSources.filter(source =>
      !existingSources.has(source) && this.hasDataForSource(uvp, source)
    );
  }

  /**
   * Score pillar quality based on completeness
   */
  scorePillar(pillar: ContentPillar): number {
    let score = 0;

    // Has meaningful name (not generic)
    if (!pillar.name.includes('Industry') && pillar.name.length > 10) score += 25;

    // Has description
    if (pillar.description.length > 30) score += 25;

    // Has multiple content types
    if (pillar.contentTypes.length >= 3) score += 25;

    // Has example topics
    if (pillar.exampleTopics.length >= 3) score += 25;

    return score;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private hasDataForSource(uvp: CompleteUVP, source: PillarSource): boolean {
    switch (source) {
      case 'target_customer':
        return !!(uvp.targetCustomer?.statement || uvp.targetCustomer?.emotionalDrivers?.length);
      case 'transformation_goal':
        return !!(uvp.transformationGoal?.before || uvp.transformationGoal?.after);
      case 'unique_solution':
        return !!(uvp.uniqueSolution?.statement || uvp.uniqueSolution?.differentiators?.length);
      case 'key_benefit':
        return !!(uvp.keyBenefit?.statement || uvp.keyBenefit?.metrics?.length);
      case 'value_proposition':
        return !!(uvp.valuePropositionStatement || uvp.whyStatement);
      default:
        return false;
    }
  }

  private getDefaultPillars(uvp: CompleteUVP, count: number): ContentPillar[] {
    const defaults: ContentPillar[] = [
      {
        id: `pillar-default-educational-${Date.now()}`,
        name: 'Educational Tips',
        description: 'Quick wins and actionable advice for your audience',
        source: 'value_proposition',
        contentTypes: ['tip', 'how-to', 'listicle'],
        suggestedFrequency: 'daily',
        exampleTopics: [
          '5 quick wins you can implement today',
          'The simple hack that changes everything',
          'What I learned this week'
        ]
      },
      {
        id: `pillar-default-engagement-${Date.now()}`,
        name: 'Community Engagement',
        description: 'Content that drives conversation and connection',
        source: 'target_customer',
        contentTypes: ['question', 'poll', 'discussion'],
        suggestedFrequency: 'weekly',
        exampleTopics: [
          'What\'s your biggest challenge right now?',
          'Agree or disagree?',
          'This or that?'
        ]
      },
      {
        id: `pillar-default-personal-${Date.now()}`,
        name: 'Behind the Scenes',
        description: 'Authentic content showing the human side',
        source: 'unique_solution',
        contentTypes: ['personal', 'story', 'day-in-life'],
        suggestedFrequency: 'bi-weekly',
        exampleTopics: [
          'What my typical day looks like',
          'The tools I can\'t live without',
          'A mistake I made (and what I learned)'
        ]
      }
    ];

    return defaults.slice(0, count);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract key phrase from a longer statement
 */
function extractKeyword(text: string): string {
  if (!text) return '';

  // Remove common filler words and get essence
  const cleaned = text
    .replace(/^(the|a|an|to|of|for|in|on|with|by|from|as|at)\s+/gi, '')
    .replace(/\s+(the|a|an|to|of|for|in|on|with|by|from|as|at)\s+/gi, ' ');

  // Capitalize first letter
  const words = cleaned.split(' ').slice(0, 4); // Max 4 words
  const result = words.join(' ');

  return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
}

// Export singleton instance
export const pillarGenerator = new PillarGenerator();

// Export class for testing
export { PillarGenerator };
