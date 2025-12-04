// PRD Feature: SYNAPSE-V6
/**
 * V6 Content Pipeline Service
 *
 * Orchestrates V1 content generation from V6 connection discoveries.
 * Takes breakthrough connections and generates optimized content.
 *
 * Pipeline stages:
 * 1. Connection → Content Brief
 * 2. Brief → Raw Content (via ContentGenerator)
 * 3. Raw → Optimized (via PowerWordOptimizer, HumorOptimizer)
 * 4. Optimized → Psychology Explained (via ContentPsychologyEngine)
 * 5. Final → Variants (via VariantGenerator)
 */

// V6 Content Pipeline - Simplified implementation
// Full generation helpers available in ./generation/ and ./helpers/ when needed
import type { BreakthroughConnection, V6ConnectionResult } from './v6-connection-service';
import type { BrandProfile, InsightTab } from './brand-profile.service';
import type { CompleteUVP } from '@/types/uvp-flow.types';

// Content output types
export interface V6ContentPiece {
  id: string;
  connectionId: string;
  type: ContentType;
  title: string;
  body: string;
  hook: string;
  cta: string;
  psychology: {
    principle: string;
    trigger: string;
    technique: string;
    explanation: string;
  };
  optimization: {
    powerWords: string[];
    humorLevel: 'none' | 'subtle' | 'moderate';
    readingLevel: number;
  };
  metadata: {
    sources: InsightTab[];
    urgency: 'immediate' | 'soon' | 'planned';
    connectionScore: number;
    unexpectedness: number;
  };
  variants?: V6ContentVariant[];
}

export interface V6ContentVariant {
  id: string;
  platform: 'linkedin' | 'twitter' | 'email' | 'blog' | 'ad';
  content: string;
  characterCount: number;
  optimizedFor: string;
}

export type ContentType =
  | 'social-post'
  | 'email-hook'
  | 'blog-intro'
  | 'ad-copy'
  | 'thought-leadership'
  | 'customer-story';

// Content generation options
export interface ContentGenerationOptions {
  maxPieces: number;
  includeVariants: boolean;
  contentTypes: ContentType[];
  humorLevel: 'none' | 'subtle' | 'moderate';
  includeExplanations: boolean;
}

const DEFAULT_OPTIONS: ContentGenerationOptions = {
  maxPieces: 5,
  includeVariants: true,
  contentTypes: ['social-post', 'email-hook', 'thought-leadership'],
  humorLevel: 'subtle',
  includeExplanations: true,
};

/**
 * V6 Content Pipeline Class
 * Simplified implementation - generates content from breakthrough connections
 */
export class V6ContentPipeline {
  constructor() {
    // Simplified - no external dependencies needed for basic content generation
  }

  /**
   * Generate content from connections
   */
  async generateFromConnections(
    connections: V6ConnectionResult,
    profile: BrandProfile,
    options: Partial<ContentGenerationOptions> = {}
  ): Promise<V6ContentPiece[]> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const uvp = profile.uvp_data;

    console.log(`[V6ContentPipeline] Generating content from ${connections.topBreakthroughs.length} breakthroughs`);

    const contentPieces: V6ContentPiece[] = [];

    // Process top breakthroughs
    for (const breakthrough of connections.topBreakthroughs.slice(0, opts.maxPieces)) {
      try {
        const piece = await this.generateFromBreakthrough(breakthrough, uvp, opts);
        if (piece) {
          contentPieces.push(piece);
        }
      } catch (error) {
        console.error(`[V6ContentPipeline] Error generating from breakthrough:`, error);
      }
    }

    console.log(`[V6ContentPipeline] Generated ${contentPieces.length} content pieces`);

    return contentPieces;
  }

  /**
   * Generate content from a single breakthrough
   */
  private async generateFromBreakthrough(
    breakthrough: BreakthroughConnection,
    uvp: CompleteUVP,
    options: ContentGenerationOptions
  ): Promise<V6ContentPiece | null> {
    // 1. Generate content brief from connection
    const brief = this.createContentBrief(breakthrough, uvp);

    // 2. Select optimal format based on connection characteristics (V1 connection-aware logic)
    const selectedFormat = this.selectOptimalFormat(breakthrough, brief, options.contentTypes);

    // 3. Generate raw content (simplified - actual implementation would use LLM)
    const rawContent = this.generateRawContent(brief, uvp, selectedFormat);

    // 3. Generate psychology explanation
    const psychology = options.includeExplanations
      ? this.generatePsychologyExplanation(breakthrough, brief)
      : null;

    // 4. Generate variants
    const variants = options.includeVariants
      ? this.generateVariants(rawContent, brief)
      : [];

    return {
      id: `content-${breakthrough.id}`,
      connectionId: breakthrough.id,
      type: selectedFormat,
      title: brief.headline,
      body: rawContent.body,
      hook: rawContent.hook,
      cta: rawContent.cta,
      psychology: psychology || {
        principle: 'Pattern Interruption',
        trigger: 'Curiosity',
        technique: 'Open Loop',
        explanation: 'This content works by connecting unexpected elements.',
      },
      optimization: {
        powerWords: rawContent.powerWords || [],
        humorLevel: options.humorLevel,
        readingLevel: this.calculateReadingLevel(rawContent.body),
      },
      metadata: {
        sources: breakthrough.sources,
        urgency: breakthrough.urgency,
        connectionScore: breakthrough.score,
        unexpectedness: breakthrough.unexpectedness,
      },
      variants,
    };
  }

  /**
   * Select optimal content format based on connection characteristics
   * V1 connection-aware format selection logic
   */
  private selectOptimalFormat(
    breakthrough: BreakthroughConnection,
    brief: ContentBrief,
    availableTypes: ContentType[]
  ): ContentType {
    // Connection-aware format selection based on V1 principles

    // 1. Urgency-based selection
    if (breakthrough.urgency === 'immediate') {
      // Immediate urgency favors social posts for rapid engagement
      if (availableTypes.includes('social-post')) return 'social-post';
      if (availableTypes.includes('email-hook')) return 'email-hook';
    }

    // 2. Source-based selection (based on data sources contributing to connection)
    const sources = breakthrough.sources;

    // VoC (customer voice) + Community → Customer stories work best
    if (sources.includes('voc') && sources.includes('community')) {
      if (availableTypes.includes('customer-story')) return 'customer-story';
    }

    // Competitive + Trends → Thought leadership for authority
    if (sources.includes('competitive') && sources.includes('trends')) {
      if (availableTypes.includes('thought-leadership')) return 'thought-leadership';
    }

    // Search intent → Ad copy for conversion
    if (sources.includes('search')) {
      if (availableTypes.includes('ad-copy')) return 'ad-copy';
    }

    // 3. Three-way connections are complex → Longer formats
    if (breakthrough.type === 'three-way') {
      // Three-way insights need explanation space
      if (availableTypes.includes('blog-intro')) return 'blog-intro';
      if (availableTypes.includes('thought-leadership')) return 'thought-leadership';
    }

    // 4. High unexpectedness → Social posts for viral potential
    if (breakthrough.unexpectedness > 75) {
      if (availableTypes.includes('social-post')) return 'social-post';
    }

    // 5. Low unexpectedness but high score → Email for nurturing
    if (breakthrough.unexpectedness <= 50 && breakthrough.score > 80) {
      if (availableTypes.includes('email-hook')) return 'email-hook';
    }

    // 6. Default fallback: prioritize by format effectiveness
    const priorityOrder: ContentType[] = [
      'thought-leadership', // Best for authority
      'social-post',       // Best for engagement
      'email-hook',        // Best for conversion
      'customer-story',    // Best for trust
      'ad-copy',          // Best for acquisition
      'blog-intro'        // Best for education
    ];

    for (const preferredType of priorityOrder) {
      if (availableTypes.includes(preferredType)) {
        return preferredType;
      }
    }

    // Final fallback
    return availableTypes[0];
  }

  /**
   * Create content brief from breakthrough connection
   */
  private createContentBrief(
    breakthrough: BreakthroughConnection,
    uvp: CompleteUVP
  ): ContentBrief {
    const isThreeWay = breakthrough.type === 'three-way';

    return {
      headline: breakthrough.title,
      angle: breakthrough.contentAngle,
      insight: breakthrough.insight,
      targetAudience: uvp.targetCustomer?.statement || 'professionals',
      problem: uvp.transformationGoal?.before || '',
      solution: uvp.uniqueSolution?.statement || '',
      benefit: uvp.keyBenefit?.statement || '',
      connectionType: isThreeWay ? 'triple-insight' : 'dual-insight',
      unexpectedness: breakthrough.unexpectedness,
      urgency: breakthrough.urgency,
      sources: breakthrough.sources,
    };
  }

  /**
   * Generate raw content from brief (simplified)
   */
  private generateRawContent(
    brief: ContentBrief,
    uvp: CompleteUVP,
    type: ContentType
  ): RawContent {
    // In production, this would call an LLM
    // For now, generate template-based content

    const hook = this.generateHook(brief, type);
    const body = this.generateBody(brief, uvp, type);
    const cta = this.generateCTA(brief, uvp, type);

    return { hook, body, cta, powerWords: [] };
  }

  /**
   * Generate hook based on content type
   */
  private generateHook(brief: ContentBrief, type: ContentType): string {
    const hooks: Record<ContentType, () => string> = {
      'social-post': () => `🔍 Unexpected insight: ${brief.headline}`,
      'email-hook': () => `You won't believe what connects ${brief.sources.join(' and ')}...`,
      'blog-intro': () => `What if ${brief.insight} meant more than you thought?`,
      'ad-copy': () => `${brief.headline} (here's why it matters to ${brief.targetAudience})`,
      'thought-leadership': () => `I discovered something surprising about ${brief.angle}`,
      'customer-story': () => `"${brief.problem}" → "${brief.benefit}"`,
    };

    return hooks[type]();
  }

  /**
   * Generate body based on content type
   */
  private generateBody(brief: ContentBrief, uvp: CompleteUVP, type: ContentType): string {
    const connectionExplanation = brief.connectionType === 'triple-insight'
      ? `This three-way connection reveals: ${brief.insight}`
      : `This unexpected link shows: ${brief.insight}`;

    const relevance = `For ${brief.targetAudience} dealing with ${brief.problem}, this means ${brief.benefit}.`;

    return `${connectionExplanation}\n\n${relevance}\n\n${brief.angle}`;
  }

  /**
   * Generate CTA based on content type
   */
  private generateCTA(brief: ContentBrief, uvp: CompleteUVP, type: ContentType): string {
    const urgencyCTAs: Record<string, string> = {
      'immediate': 'Act now before this window closes.',
      'soon': 'Start this week to see results.',
      'planned': 'Add this to your strategy.',
    };

    return urgencyCTAs[brief.urgency] || 'Learn more →';
  }

  /**
   * Generate psychology explanation
   */
  private generatePsychologyExplanation(
    breakthrough: BreakthroughConnection,
    brief: ContentBrief
  ): V6ContentPiece['psychology'] {
    // Map connection type to psychology principle
    const principles: Record<string, string> = {
      'voc': 'Social Proof',
      'community': 'Bandwagon Effect',
      'competitive': 'Contrast Principle',
      'trends': 'Recency Bias',
      'search': 'Information Gap',
      'local_timing': 'Scarcity/Urgency',
    };

    const primarySource = breakthrough.sources[0];
    const principle = principles[primarySource] || 'Pattern Interruption';

    const techniques: Record<string, string> = {
      'two-way': 'Unexpected Association',
      'three-way': 'Triangulation Effect',
    };

    return {
      principle,
      trigger: brief.unexpectedness > 70 ? 'Surprise' : 'Curiosity',
      technique: techniques[breakthrough.type],
      explanation: `This content works because it connects ${breakthrough.sources.length} unexpected data sources, creating a ${breakthrough.unexpectedness}% unexpectedness score that breaks pattern expectations.`,
    };
  }

  /**
   * Generate platform variants
   */
  private generateVariants(content: RawContent, brief: ContentBrief): V6ContentVariant[] {
    const platforms: Array<'linkedin' | 'twitter' | 'email'> = ['linkedin', 'twitter', 'email'];

    return platforms.map((platform) => {
      const adapted = this.adaptForPlatform(content, platform);
      return {
        id: `variant-${platform}-${Date.now()}`,
        platform,
        content: adapted,
        characterCount: adapted.length,
        optimizedFor: this.getOptimizationTarget(platform),
      };
    });
  }

  /**
   * Adapt content for specific platform
   */
  private adaptForPlatform(content: RawContent, platform: string): string {
    switch (platform) {
      case 'twitter':
        return `${content.hook}\n\n${content.body.substring(0, 200)}...\n\n${content.cta}`.substring(0, 280);
      case 'linkedin':
        return `${content.hook}\n\n${content.body}\n\n${content.cta}`;
      case 'email':
        return `Subject: ${content.hook}\n\n${content.body}\n\n${content.cta}`;
      default:
        return `${content.hook}\n${content.body}\n${content.cta}`;
    }
  }

  /**
   * Get optimization target for platform
   */
  private getOptimizationTarget(platform: string): string {
    const targets: Record<string, string> = {
      twitter: 'Engagement & Shares',
      linkedin: 'Professional Credibility',
      email: 'Open Rate & Click-Through',
    };
    return targets[platform] || 'General Engagement';
  }

  /**
   * Calculate reading level (Flesch-Kincaid approximation)
   */
  private calculateReadingLevel(text: string): number {
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const syllables = text.split(/[aeiou]/i).length;

    if (sentences === 0 || words === 0) return 8;

    const level = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
    return Math.max(5, Math.min(12, Math.round(level)));
  }
}

// Internal types
interface ContentBrief {
  headline: string;
  angle: string;
  insight: string;
  targetAudience: string;
  problem: string;
  solution: string;
  benefit: string;
  connectionType: 'dual-insight' | 'triple-insight';
  unexpectedness: number;
  urgency: 'immediate' | 'soon' | 'planned';
  sources: InsightTab[];
}

interface RawContent {
  hook: string;
  body: string;
  cta: string;
  powerWords: string[];
}

// Export singleton
export const v6ContentPipeline = new V6ContentPipeline();
