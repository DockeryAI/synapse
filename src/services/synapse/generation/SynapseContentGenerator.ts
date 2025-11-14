/**
 * Breakthrough Content Generator
 *
 * Main orchestrator that coordinates all 4 format generators to transform
 * breakthrough insights into exceptional, psychologically-optimized content.
 *
 * Process:
 * 1. Takes breakthrough insights from Multi-Model Orchestra
 * 2. Selects optimal content format(s) for each insight
 * 3. Generates content using specialized format generators
 * 4. Ranks content by predicted impact
 * 5. Returns top content pieces with psychology explanations
 *
 * Created: 2025-11-10
 */

import type { BreakthroughInsight } from '@/types/breakthrough.types';
import type {
  BusinessProfile,
  SynapseContent,
  ContentFormat,
  GenerationOptions,
  GenerationResult,
  ABTestGroup,
  VariantStrategy,
  Platform,
  ContentSection,
  RegenerationResult,
  ContrarianDetectionResult
} from '@/types/synapseContent.types';
import { HookPostGenerator } from './formats/HookPostGenerator';
import { StoryPostGenerator } from './formats/StoryPostGenerator';
import { DataPostGenerator } from './formats/DataPostGenerator';
import { ControversialPostGenerator } from './formats/ControversialPostGenerator';
import { EmailGenerator } from './formats/EmailGenerator';
import { BlogGenerator } from './formats/BlogGenerator';
import { LandingPageGenerator } from './formats/LandingPageGenerator';
import { VariantGenerator } from './VariantGenerator';
import { CharacterValidator } from '../validation/CharacterValidator';
import { SectionRegenerator } from './SectionRegenerator';
import { ContrarianAngleDetector } from '../analysis/ContrarianAngleDetector';

export class SynapseContentGenerator {
  private hookGenerator: HookPostGenerator;
  private storyGenerator: StoryPostGenerator;
  private dataGenerator: DataPostGenerator;
  private controversialGenerator: ControversialPostGenerator;
  private emailGenerator: EmailGenerator;
  private blogGenerator: BlogGenerator;
  private landingPageGenerator: LandingPageGenerator;
  private variantGenerator: VariantGenerator;
  private characterValidator: CharacterValidator;
  private sectionRegenerator: SectionRegenerator;
  private contrarianDetector: ContrarianAngleDetector;

  constructor() {
    this.hookGenerator = new HookPostGenerator();
    this.storyGenerator = new StoryPostGenerator();
    this.dataGenerator = new DataPostGenerator();
    this.controversialGenerator = new ControversialPostGenerator();
    this.emailGenerator = new EmailGenerator();
    this.blogGenerator = new BlogGenerator();
    this.landingPageGenerator = new LandingPageGenerator();
    this.variantGenerator = new VariantGenerator();
    this.characterValidator = new CharacterValidator();
    this.sectionRegenerator = new SectionRegenerator();
    this.contrarianDetector = new ContrarianAngleDetector();
  }

  /**
   * Generate breakthrough content from insights
   */
  async generate(
    insights: BreakthroughInsight[],
    business: BusinessProfile,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const startTime = Date.now();

    // Apply defaults
    const opts: Required<GenerationOptions> = {
      maxContent: options.maxContent || 10,
      formats: options.formats || ['hook-post', 'story-post', 'data-post', 'controversial-post'],
      multiFormat: options.multiFormat !== undefined ? options.multiFormat : false,
      minImpactScore: options.minImpactScore || 0.7
    };

    console.log(`🎨 Generating breakthrough content for ${insights.length} insights...`);

    // Generate content for each insight
    const allContent: SynapseContent[] = [];
    const errors: string[] = [];

    for (const insight of insights) {
      try {
        if (opts.multiFormat) {
          // Generate multiple formats for this insight
          const formats = this.selectFormats(insight, opts.formats);
          for (const format of formats) {
            const content = await this.generateForFormat(insight, business, format);
            if (content) {
              allContent.push(content);
            }
          }
        } else {
          // Generate single best format
          const format = this.selectBestFormat(insight, opts.formats);
          const content = await this.generateForFormat(insight, business, format);
          if (content) {
            allContent.push(content);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error generating content for insight ${insight.id}:`, error);
        errors.push(`Insight ${insight.id}: ${errorMessage}`);
      }
    }

    // Filter by impact score
    const filtered = allContent.filter(
      content => (content.metadata.impactScore || 0) >= opts.minImpactScore
    );

    console.log(`✅ Generated ${filtered.length} content pieces (filtered from ${allContent.length})`);

    // Rank content by predicted performance
    const ranked = this.rankContent(filtered);

    // Take top N
    const topContent = ranked.slice(0, opts.maxContent);

    // Calculate statistics
    const stats = this.calculateStats(topContent, allContent.length);

    const processingTime = Date.now() - startTime;

    return {
      content: topContent,
      stats,
      metadata: {
        generatedAt: new Date(),
        processingTimeMs: processingTime,
        insightsProcessed: insights.length,
        contentGenerated: topContent.length,
        errors: errors.length > 0 ? errors : undefined
      }
    };
  }

  /**
   * Select best format for an insight
   */
  private selectBestFormat(
    insight: BreakthroughInsight,
    availableFormats: ContentFormat[]
  ): ContentFormat {
    // Map insight types to best formats
    const formatMap: Record<string, ContentFormat> = {
      'unexpected_connection': 'hook-post',
      'counter_intuitive': 'controversial-post',
      'predictive_opportunity': 'data-post',
      'deep_psychology': 'story-post',
      'cultural_moment': 'story-post',
      'hidden_pattern': 'data-post',
      'strategic_implication': 'data-post',
      'behavioral_contradiction': 'controversial-post'
    };

    const recommended = formatMap[insight.type] || 'hook-post';

    // Return recommended if available, otherwise first available
    return availableFormats.includes(recommended)
      ? recommended
      : availableFormats[0];
  }

  /**
   * Select multiple formats for an insight
   */
  private selectFormats(
    insight: BreakthroughInsight,
    availableFormats: ContentFormat[]
  ): ContentFormat[] {
    const best = this.selectBestFormat(insight, availableFormats);

    // Generate 2-3 formats: best + complementary
    const formats: ContentFormat[] = [best];

    // Add complementary formats based on insight type
    if (insight.type === 'counter_intuitive') {
      // Controversial insights also work as data posts and hook posts
      if (availableFormats.includes('data-post') && !formats.includes('data-post')) {
        formats.push('data-post');
      }
      if (availableFormats.includes('hook-post') && !formats.includes('hook-post')) {
        formats.push('hook-post');
      }
    } else if (insight.type === 'deep_psychology') {
      // Psychology insights also work as hook posts
      if (availableFormats.includes('hook-post') && !formats.includes('hook-post')) {
        formats.push('hook-post');
      }
    } else if (insight.type === 'unexpected_connection') {
      // Connections work as stories and controversial posts
      if (availableFormats.includes('story-post') && !formats.includes('story-post')) {
        formats.push('story-post');
      }
    }

    return formats.slice(0, 2); // Max 2 formats per insight (reduces repetition)
  }

  /**
   * Generate content for a specific format
   */
  private async generateForFormat(
    insight: BreakthroughInsight,
    business: BusinessProfile,
    format: ContentFormat
  ): Promise<SynapseContent | null> {
    try {
      switch (format) {
        // Social Media Formats
        case 'hook-post':
          return await this.hookGenerator.generate(insight, business);

        case 'story-post':
          return await this.storyGenerator.generate(insight, business);

        case 'data-post':
          return await this.dataGenerator.generate(insight, business);

        case 'controversial-post':
          return await this.controversialGenerator.generate(insight, business);

        // Email Formats
        case 'email-newsletter':
          return await this.emailGenerator.generate(insight, business, 'newsletter');

        case 'email-promo':
          return await this.emailGenerator.generate(insight, business, 'promo');

        case 'email-sequence':
          return await this.emailGenerator.generate(insight, business, 'sequence');

        // Blog Formats
        case 'blog-post':
        case 'blog-how-to':
          return await this.blogGenerator.generate(insight, business, 'how-to');

        case 'blog-listicle':
          return await this.blogGenerator.generate(insight, business, 'listicle');

        case 'blog-case-study':
          return await this.blogGenerator.generate(insight, business, 'case-study');

        // Landing Page Formats
        case 'landing-page':
        case 'landing-hero':
          return await this.landingPageGenerator.generate(insight, business, 'hero');

        case 'landing-sales':
          return await this.landingPageGenerator.generate(insight, business, 'sales');

        default:
          console.warn(`Unknown format: ${format}`);
          return null;
      }
    } catch (error) {
      console.error(`[ContentGen] Error generating ${format} for insight ${insight.id}:`, error);
      throw error; // Re-throw to see the actual error
    }
  }

  /**
   * Rank content by predicted impact
   */
  private rankContent(content: SynapseContent[]): SynapseContent[] {
    return content.sort((a, b) => {
      // Calculate composite score
      const scoreA = this.calculateCompositeScore(a);
      const scoreB = this.calculateCompositeScore(b);
      return scoreB - scoreA;
    });
  }

  /**
   * Calculate composite score for ranking
   */
  private calculateCompositeScore(content: SynapseContent): number {
    const weights = {
      engagement: 0.3,
      viral: 0.25,
      leadGen: 0.25,
      brand: 0.2
    };

    return (
      content.prediction.engagementScore * weights.engagement +
      content.prediction.viralPotential * weights.viral +
      content.prediction.leadGeneration * weights.leadGen +
      content.prediction.brandImpact * weights.brand
    );
  }

  /**
   * Calculate generation statistics
   */
  private calculateStats(
    topContent: SynapseContent[],
    totalGenerated: number
  ): GenerationResult['stats'] {
    if (topContent.length === 0) {
      return {
        totalGenerated: 0,
        byFormat: {},
        averageScores: {
          engagement: 0,
          viral: 0,
          leadGen: 0,
          brand: 0
        },
        topFormats: []
      };
    }

    // Count by format
    const byFormat: Record<ContentFormat, number> = {
      'hook-post': 0,
      'story-post': 0,
      'data-post': 0,
      'controversial-post': 0,
      'thread': 0,
      'carousel': 0
    };

    topContent.forEach(content => {
      byFormat[content.format] = (byFormat[content.format] || 0) + 1;
    });

    // Calculate average scores
    const avgEngagement = topContent.reduce((sum, c) => sum + c.prediction.engagementScore, 0) / topContent.length;
    const avgViral = topContent.reduce((sum, c) => sum + c.prediction.viralPotential, 0) / topContent.length;
    const avgLeadGen = topContent.reduce((sum, c) => sum + c.prediction.leadGeneration, 0) / topContent.length;
    const avgBrand = topContent.reduce((sum, c) => sum + c.prediction.brandImpact, 0) / topContent.length;

    // Get top formats
    const topFormats = Object.entries(byFormat)
      .filter(([_, count]) => count > 0)
      .sort(([_, a], [__, b]) => b - a)
      .map(([format]) => format as ContentFormat);

    return {
      totalGenerated,
      byFormat,
      averageScores: {
        engagement: avgEngagement,
        viral: avgViral,
        leadGen: avgLeadGen,
        brand: avgBrand
      },
      topFormats
    };
  }

  /**
   * Generate content for a single insight (convenience method)
   */
  async generateSingle(
    insight: BreakthroughInsight,
    business: BusinessProfile,
    format?: ContentFormat
  ): Promise<SynapseContent | null> {
    const selectedFormat = format || this.selectBestFormat(insight, [
      'hook-post',
      'story-post',
      'data-post',
      'controversial-post'
    ]);

    return await this.generateForFormat(insight, business, selectedFormat);
  }

  /**
   * Generate all possible formats for an insight
   */
  async generateAll(
    insight: BreakthroughInsight,
    business: BusinessProfile
  ): Promise<SynapseContent[]> {
    const allFormats: ContentFormat[] = ['hook-post', 'story-post', 'data-post', 'controversial-post'];
    const content: SynapseContent[] = [];

    for (const format of allFormats) {
      try {
        const generated = await this.generateForFormat(insight, business, format);
        if (generated) {
          content.push(generated);
        }
      } catch (error) {
        console.error(`Error generating ${format}:`, error);
        // Continue with other formats
      }
    }

    return content;
  }

  /**
   * Get format recommendation for an insight
   */
  getFormatRecommendation(insight: BreakthroughInsight): {
    primary: ContentFormat;
    alternatives: ContentFormat[];
    reason: string;
  } {
    const primary = this.selectBestFormat(insight, [
      'hook-post',
      'story-post',
      'data-post',
      'controversial-post'
    ]);

    const allFormats = this.selectFormats(insight, [
      'hook-post',
      'story-post',
      'data-post',
      'controversial-post'
    ]);

    const alternatives = allFormats.filter(f => f !== primary);

    const reasons: Record<ContentFormat, string> = {
      'hook-post': 'Creates curiosity gap that drives engagement',
      'story-post': 'Builds emotional connection through narrative',
      'data-post': 'Establishes authority with evidence',
      'controversial-post': 'Sparks debate and challenges assumptions',
      'thread': 'Deep-dive exploration',
      'carousel': 'Visual storytelling'
    };

    return {
      primary,
      alternatives,
      reason: reasons[primary]
    };
  }

  /**
   * Generate A/B test variants from content
   */
  async generateVariants(
    content: SynapseContent,
    business: BusinessProfile,
    strategies?: VariantStrategy[]
  ): Promise<ABTestGroup> {
    console.log('[ContentGenerator] Generating A/B variants for content:', content.id);
    return await this.variantGenerator.generateVariants(content, business, strategies);
  }

  /**
   * Validate content character counts
   */
  validateContent(
    content: SynapseContent,
    platforms?: Platform[]
  ) {
    return this.characterValidator.validateContent(content, platforms);
  }

  /**
   * Get character count summary
   */
  getCharacterSummary(content: SynapseContent) {
    return this.characterValidator.getCharacterSummary(content);
  }

  /**
   * Regenerate a specific section
   */
  async regenerateSection(
    content: SynapseContent,
    section: ContentSection,
    business: BusinessProfile,
    insight: BreakthroughInsight,
    improvementDirection?: string
  ): Promise<RegenerationResult> {
    return await this.sectionRegenerator.regenerateSection(
      content,
      section,
      business,
      insight,
      improvementDirection
    );
  }

  /**
   * Apply regeneration result to content
   */
  applyRegeneration(
    content: SynapseContent,
    result: RegenerationResult,
    selectedIndex: number
  ): SynapseContent {
    return this.sectionRegenerator.applyRegeneration(content, result, selectedIndex);
  }

  /**
   * Detect contrarian angles from insights
   */
  async detectContrarianAngles(
    insights: BreakthroughInsight[]
  ): Promise<ContrarianDetectionResult> {
    return await this.contrarianDetector.detectContrarianAngles(insights);
  }
}
