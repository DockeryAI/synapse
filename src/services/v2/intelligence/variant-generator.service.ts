/**
 * Variant Generator Service
 *
 * Generates A/B test variants for content optimization:
 * 1. Creates 2-3 meaningful variations of content
 * 2. Applies FOMO/scarcity tactics
 * 3. Tests different emotional triggers
 * 4. Ensures semantic distance between variants
 *
 * Created: 2025-11-23
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ContentVariant {
  id: string;
  originalId: string;
  variant: 'A' | 'B' | 'C';
  content: string;
  strategy: VariationStrategy;
  expectedPerformance: {
    engagement: number;
    conversion: number;
    confidence: number;
  };
  testHypothesis: string;
}

export type VariationStrategy =
  | 'fomo-scarcity'
  | 'social-proof'
  | 'authority'
  | 'urgency'
  | 'value-proposition'
  | 'emotional-appeal';

export interface ABTestSetup {
  contentId: string;
  variants: ContentVariant[];
  recommendedSplit: number[]; // e.g., [50, 50] or [33, 33, 34]
  testDuration: number; // days
  successMetric: 'engagement' | 'conversion' | 'ctr';
}

export interface BreakthroughForVariants {
  id: string;
  validation?: {
    totalDataPoints?: number;
  };
}

export interface ContentAngleForVariants {
  id: string;
  hook: string;
  breakthroughId: string;
}

export interface MultipliedContentForVariants {
  breakthroughId: string;
  angles: ContentAngleForVariants[];
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

class VariantGeneratorService {
  /**
   * Generates A/B test variants for a content piece
   */
  public generateVariants(
    originalContent: string,
    breakthrough: BreakthroughForVariants,
    variantCount: number = 2
  ): ContentVariant[] {
    const variants: ContentVariant[] = [];

    // Variant A: Original with FOMO/Scarcity
    variants.push(this.createFOMOVariant(originalContent, breakthrough));

    // Variant B: Social Proof emphasis
    const dataPoints = breakthrough.validation?.totalDataPoints ?? 0;
    if (variantCount >= 2 && dataPoints >= 5) {
      variants.push(this.createSocialProofVariant(originalContent, breakthrough));
    } else if (variantCount >= 2) {
      // Fallback if not enough data points
      variants.push(this.createUrgencyVariant(originalContent, breakthrough));
    }

    // Variant C: Authority/Expertise angle
    if (variantCount >= 3) {
      variants.push(this.createAuthorityVariant(originalContent, breakthrough));
    }

    return variants;
  }

  /**
   * Creates FOMO/Scarcity variant
   */
  private createFOMOVariant(content: string, bt: BreakthroughForVariants): ContentVariant {
    const dataPoints = bt.validation?.totalDataPoints ?? 0;
    const fomoTactics = [
      `Limited time: ${content}`,
      `Only available this week: ${content}`,
      `Don't miss out - ${content}`,
      `While supplies last: ${content}`,
      dataPoints > 0
        ? `Join the ${dataPoints}+ who discovered this before it's gone`
        : `Early access opportunity: ${content}`
    ];

    const selectedTactic = fomoTactics[Math.floor(Math.random() * fomoTactics.length)];
    const fomoContent = this.insertFOMO(content, selectedTactic);

    return {
      id: `${bt.id}-variant-fomo`,
      originalId: bt.id,
      variant: 'A',
      content: fomoContent,
      strategy: 'fomo-scarcity',
      expectedPerformance: {
        engagement: 85,
        conversion: 78,
        confidence: 0.75
      },
      testHypothesis: 'Scarcity messaging increases urgency and conversion'
    };
  }

  /**
   * Creates Social Proof variant
   */
  private createSocialProofVariant(content: string, bt: BreakthroughForVariants): ContentVariant {
    const dataPoints = bt.validation?.totalDataPoints ?? 0;
    const proofStatements = [
      `${dataPoints}+ customers confirm: ${content}`,
      `Validated by ${dataPoints} real experiences: ${content}`,
      `Join ${dataPoints}+ others: ${content}`,
      `Trusted by ${dataPoints}+ customers: ${content}`
    ];

    const selectedProof = proofStatements[Math.floor(Math.random() * proofStatements.length)];

    return {
      id: `${bt.id}-variant-social`,
      originalId: bt.id,
      variant: 'B',
      content: selectedProof,
      strategy: 'social-proof',
      expectedPerformance: {
        engagement: 80,
        conversion: 82,
        confidence: 0.8
      },
      testHypothesis: 'Social proof increases trust and conversion'
    };
  }

  /**
   * Creates Urgency variant (fallback for social proof)
   */
  private createUrgencyVariant(content: string, bt: BreakthroughForVariants): ContentVariant {
    const urgencyFrames = [
      `Act now: ${content}`,
      `Time-sensitive opportunity: ${content}`,
      `Don't wait: ${content}`,
      `Immediate action required: ${content}`
    ];

    const selectedFrame = urgencyFrames[Math.floor(Math.random() * urgencyFrames.length)];

    return {
      id: `${bt.id}-variant-urgency`,
      originalId: bt.id,
      variant: 'B',
      content: selectedFrame,
      strategy: 'urgency',
      expectedPerformance: {
        engagement: 78,
        conversion: 80,
        confidence: 0.72
      },
      testHypothesis: 'Urgency messaging drives immediate action'
    };
  }

  /**
   * Creates Authority variant
   */
  private createAuthorityVariant(content: string, bt: BreakthroughForVariants): ContentVariant {
    const authorityFrames = [
      `Expert insight: ${content}`,
      `Industry analysis shows: ${content}`,
      `Data-driven approach to ${content}`,
      `Professional analysis reveals: ${content}`
    ];

    const selectedFrame = authorityFrames[Math.floor(Math.random() * authorityFrames.length)];

    return {
      id: `${bt.id}-variant-authority`,
      originalId: bt.id,
      variant: 'C',
      content: selectedFrame,
      strategy: 'authority',
      expectedPerformance: {
        engagement: 75,
        conversion: 80,
        confidence: 0.7
      },
      testHypothesis: 'Authority positioning increases credibility'
    };
  }

  /**
   * Inserts FOMO elements into content
   */
  private insertFOMO(content: string, fomoPhrase: string): string {
    // Add FOMO at the beginning
    return `${fomoPhrase}\n\n${content}\n\nAct now before this opportunity passes`;
  }

  /**
   * Creates A/B test setup with recommendations
   */
  public createTestSetup(
    contentId: string,
    variants: ContentVariant[]
  ): ABTestSetup {
    const variantCount = variants.length;
    const split = variantCount === 2 ? [50, 50] : [33, 33, 34];

    return {
      contentId,
      variants,
      recommendedSplit: split,
      testDuration: 7, // 1 week
      successMetric: 'conversion'
    };
  }

  /**
   * Batch generate variants for multiple content pieces
   */
  public generateBatchVariants(
    multipliedContent: MultipliedContentForVariants[],
    breakthroughs: BreakthroughForVariants[]
  ): Record<string, ABTestSetup> {
    const testSetups: Record<string, ABTestSetup> = {};

    multipliedContent.forEach(mc => {
      const breakthrough = breakthroughs.find(bt => bt.id === mc.breakthroughId);
      if (!breakthrough) return;

      mc.angles.forEach(angle => {
        const variants = this.generateVariants(angle.hook, breakthrough, 2);
        const setup = this.createTestSetup(angle.id, variants);
        testSetups[angle.id] = setup;
      });
    });

    return testSetups;
  }
}

export const variantGeneratorService = new VariantGeneratorService();
