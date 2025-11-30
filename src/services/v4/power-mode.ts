/**
 * V4 Power Mode
 *
 * Full control content generation for advanced users.
 * Allows manual selection of:
 * - Content pillars
 * - Psychology frameworks
 * - Content mix rules
 * - Funnel stages
 * - Custom tones
 *
 * Perfect for: Marketing professionals, agencies, power users
 *
 * Created: 2025-11-26
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';
import type {
  ContentPillar,
  GeneratedContent,
  PsychologyFramework,
  ContentMixRule,
  ContentMixCategory,
  FunnelStage,
  PowerModeConfig,
  CampaignTemplateType,
  SelectedInsight
} from './types';

import { pillarGenerator } from './pillar-generator';
import { contentMixEngine } from './content-mix-engine';
import { funnelTagger } from './funnel-tagger';
import { campaignTemplates } from './campaign-templates';
import { contentOrchestrator } from './content-orchestrator';
import { psychologyEngine } from './psychology-engine';
import { promptLibrary } from './prompt-library';
import { contentScorer } from './content-scorer';

// ============================================================================
// POWER MODE RESULT TYPES
// ============================================================================

interface PowerModeResult {
  success: boolean;
  content: GeneratedContent[];
  appliedSettings: PowerModeConfig;
  analytics: ContentAnalytics;
}

interface ContentAnalytics {
  averageScore: number;
  scoreDistribution: { range: string; count: number }[];
  funnelBreakdown: Record<FunnelStage, number>;
  mixBreakdown: Record<ContentMixCategory, number>;
  frameworkUsage: Record<PsychologyFramework, number>;
  topPerformers: GeneratedContent[];
  improvementSuggestions: string[];
}

interface BatchGenerationOptions {
  count: number;
  pillars?: ContentPillar[];
  frameworks?: PsychologyFramework[];
  funnelStages?: FunnelStage[];
  mixCategories?: ContentMixCategory[];
  platform?: 'linkedin' | 'instagram' | 'twitter' | 'facebook' | 'tiktok';
  tone?: string;
  minScore?: number; // Regenerate if below this score
}

// ============================================================================
// POWER MODE SERVICE CLASS
// ============================================================================

class PowerModeService {
  private config: PowerModeConfig;

  constructor() {
    this.config = {
      selectedPillars: [],
      selectedFramework: 'AIDA',
      selectedMixRule: '70-20-10',
      selectedFunnelStages: ['TOFU', 'MOFU', 'BOFU'],
      customTone: ''
    };
  }

  /**
   * Generate content with full control
   */
  async generateWithControl(
    uvp: CompleteUVP,
    options: {
      pillar?: ContentPillar;
      framework?: PsychologyFramework;
      funnelStage?: FunnelStage;
      mixCategory?: ContentMixCategory;
      platform?: 'linkedin' | 'instagram' | 'twitter' | 'facebook' | 'tiktok';
      tone?: 'professional' | 'casual' | 'authoritative' | 'friendly';
      /** Selected insights from user to incorporate into content */
      selectedInsights?: SelectedInsight[];
      /** Industry Profile 2.0 - Enhanced industry data for content generation */
      enhancedIndustryProfile?: {
        industry_name: string;
        hook_library: {
          number_hooks?: string[];
          question_hooks?: string[];
          story_hooks?: string[];
          fear_hooks?: string[];
          howto_hooks?: string[];
        };
        power_words: string[];
        avoid_words: string[];
        headline_templates: { template: string; context: string }[];
        customer_triggers: { trigger: string; urgency: number }[];
        transformations: { from: string; to: string; emotional_value: string }[];
        content_templates?: {
          linkedin?: {
            educational?: { hook: string; body: string; cta: string };
            authority?: { hook: string; body: string; cta: string };
            case_study?: { hook: string; body: string; cta: string };
          };
        };
      };
    }
  ): Promise<GeneratedContent> {
    console.log('[Power Mode] Generating content with custom settings...');
    if (options.enhancedIndustryProfile) {
      console.log(`[Power Mode] Using Enhanced Industry Profile 2.0: ${options.enhancedIndustryProfile.industry_name}`);
    }

    const content = await contentOrchestrator.generate({
      uvp,
      pillar: options.pillar,
      framework: options.framework,
      platform: options.platform || 'linkedin',
      funnelStage: options.funnelStage || 'TOFU',
      contentMixCategory: options.mixCategory || 'value',
      tone: options.tone,
      selectedInsights: options.selectedInsights,
      enhancedIndustryProfile: options.enhancedIndustryProfile
    });

    return content;
  }

  /**
   * Generate batch with specific requirements
   */
  async generateBatch(
    uvp: CompleteUVP,
    options: BatchGenerationOptions
  ): Promise<PowerModeResult> {
    console.log(`[Power Mode] Generating batch of ${options.count} pieces...`);

    const content: GeneratedContent[] = [];
    const config: PowerModeConfig = {
      selectedPillars: options.pillars?.map(p => p.id) || [],
      selectedFramework: options.frameworks?.[0] || 'AIDA',
      selectedMixRule: this.config.selectedMixRule,
      selectedFunnelStages: options.funnelStages || ['TOFU', 'MOFU', 'BOFU'],
      customTone: options.tone || ''
    };

    // Generate pillars if not provided
    const pillars = options.pillars || pillarGenerator.generatePillars(uvp);

    // Generate content
    for (let i = 0; i < options.count; i++) {
      const pillar = pillars[i % pillars.length];
      const framework = options.frameworks
        ? options.frameworks[i % options.frameworks.length]
        : this.selectFrameworkForIndex(i);
      const funnelStage = options.funnelStages
        ? options.funnelStages[i % options.funnelStages.length]
        : this.selectFunnelStageForIndex(i, options.count);
      const mixCategory = options.mixCategories
        ? options.mixCategories[i % options.mixCategories.length]
        : undefined;

      let generated = await contentOrchestrator.generate({
        uvp,
        pillar,
        framework,
        platform: options.platform || 'linkedin',
        funnelStage,
        contentMixCategory: mixCategory
      });

      // Regenerate if below minimum score
      if (options.minScore && generated.score.total < options.minScore) {
        console.log(`[Power Mode] Score ${generated.score.total} below minimum ${options.minScore}, regenerating...`);
        generated = await contentOrchestrator.regenerate(generated, uvp, {
          framework: this.getNextFramework(framework)
        });
      }

      content.push(generated);
    }

    // Build analytics
    const analytics = this.buildAnalytics(content);

    return {
      success: true,
      content,
      appliedSettings: config,
      analytics
    };
  }

  /**
   * A/B test content variations
   */
  async generateABVariations(
    uvp: CompleteUVP,
    options: {
      pillar?: ContentPillar;
      frameworks?: PsychologyFramework[];
      count?: number;
    }
  ): Promise<{
    variations: GeneratedContent[];
    recommendation: GeneratedContent;
    reasoning: string;
  }> {
    console.log('[Power Mode] Generating A/B variations...');

    const frameworks = options.frameworks || ['AIDA', 'PAS', 'BAB', 'CuriosityGap'] as PsychologyFramework[];
    const count = Math.min(options.count || 4, frameworks.length);

    const variations: GeneratedContent[] = [];

    for (let i = 0; i < count; i++) {
      const content = await contentOrchestrator.generate({
        uvp,
        pillar: options.pillar,
        framework: frameworks[i],
        platform: 'linkedin',
        funnelStage: 'TOFU'
      });
      variations.push(content);
    }

    // Find best performer
    const sorted = [...variations].sort((a, b) => b.score.total - a.score.total);
    const recommendation = sorted[0];

    const frameworkExplanation = psychologyEngine.explainFramework(recommendation.psychology.framework);

    return {
      variations,
      recommendation,
      reasoning: `Recommended variation uses ${frameworkExplanation.name} framework ` +
        `(${frameworkExplanation.description}) with a score of ${recommendation.score.total}/100. ` +
        `${frameworkExplanation.whyItWorks}`
    };
  }

  /**
   * Generate content calendar
   */
  async generateCalendar(
    uvp: CompleteUVP,
    options: {
      weeks: number;
      postsPerWeek: number;
      template?: CampaignTemplateType;
      mixRule?: ContentMixRule;
      platforms?: string[];
    }
  ): Promise<{
    calendar: {
      week: number;
      theme: string;
      posts: {
        day: number;
        content: GeneratedContent;
        platform: string;
      }[];
    }[];
    summary: {
      totalPosts: number;
      funnelDistribution: Record<FunnelStage, number>;
      mixDistribution: Record<ContentMixCategory, number>;
    };
  }> {
    console.log(`[Power Mode] Generating ${options.weeks}-week calendar...`);

    const template = campaignTemplates.get(options.template || 'evergreen');
    const mixRule = options.mixRule || template.contentMixRule;
    const platforms = options.platforms || ['linkedin'];

    contentMixEngine.setRule(mixRule);

    const calendar: {
      week: number;
      theme: string;
      posts: { day: number; content: GeneratedContent; platform: string }[];
    }[] = [];

    const pillars = pillarGenerator.generatePillars(uvp);
    const allContent: GeneratedContent[] = [];

    for (let weekNum = 0; weekNum < options.weeks; weekNum++) {
      const weekStructure = template.weeklyStructure[weekNum % template.weeklyStructure.length];
      const weekPosts: { day: number; content: GeneratedContent; platform: string }[] = [];

      for (let day = 0; day < options.postsPerWeek; day++) {
        const pillar = pillars[(weekNum + day) % pillars.length];
        const platform = platforms[day % platforms.length];
        const mixCategory = contentMixEngine.planNextContent(allContent, 1).nextPost;

        const content = await contentOrchestrator.generate({
          uvp,
          pillar,
          platform: platform as any,
          funnelStage: weekStructure.funnelStage,
          contentMixCategory: mixCategory
        });

        allContent.push(content);
        weekPosts.push({
          day: day + 1,
          content,
          platform
        });
      }

      calendar.push({
        week: weekNum + 1,
        theme: weekStructure.theme,
        posts: weekPosts
      });
    }

    // Calculate summary
    const funnelDistribution: Record<FunnelStage, number> = { TOFU: 0, MOFU: 0, BOFU: 0 };
    const mixDistribution: Record<ContentMixCategory, number> = {
      value: 0, curated: 0, promo: 0, personal: 0, soft_sell: 0, hard_sell: 0
    };

    allContent.forEach(c => {
      funnelDistribution[c.funnelStage]++;
      mixDistribution[c.mixCategory]++;
    });

    return {
      calendar,
      summary: {
        totalPosts: allContent.length,
        funnelDistribution,
        mixDistribution
      }
    };
  }

  /**
   * Analyze and score existing content
   */
  analyzeContent(content: {
    headline?: string;
    hook?: string;
    body: string;
    cta?: string;
  }[]): {
    scores: { content: typeof content[0]; score: ReturnType<typeof contentScorer.score> }[];
    averageScore: number;
    recommendations: string[];
  } {
    const scores = content.map(c => ({
      content: c,
      score: contentScorer.score(c)
    }));

    const averageScore = scores.reduce((sum, s) => sum + s.score.total, 0) / scores.length;

    const recommendations: string[] = [];

    // Find common weaknesses
    const weaknessCount: Record<string, number> = {};
    scores.forEach(s => {
      s.score.weaknesses.forEach(w => {
        weaknessCount[w] = (weaknessCount[w] || 0) + 1;
      });
    });

    Object.entries(weaknessCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([weakness, count]) => {
        recommendations.push(`${count}/${scores.length} pieces: ${weakness}`);
      });

    return {
      scores,
      averageScore,
      recommendations
    };
  }

  /**
   * Get all available frameworks with explanations
   */
  getFrameworkOptions(): {
    framework: PsychologyFramework;
    name: string;
    description: string;
    bestFor: string;
    conversionLift: string;
  }[] {
    return psychologyEngine.getAllFrameworks().map(f => ({
      framework: f.framework,
      name: f.definition.name,
      description: f.definition.description,
      bestFor: f.definition.bestFor.join(', '),
      conversionLift: f.definition.conversionLift
    }));
  }

  /**
   * Get all available prompt templates
   */
  getTemplateOptions(): {
    id: string;
    name: string;
    category: string;
    framework: PsychologyFramework;
  }[] {
    return promptLibrary.getAll().map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      framework: t.framework
    }));
  }

  /**
   * Update power mode configuration
   */
  updateConfig(config: Partial<PowerModeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): PowerModeConfig {
    return { ...this.config };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private buildAnalytics(content: GeneratedContent[]): ContentAnalytics {
    // Average score
    const averageScore = Math.round(
      content.reduce((sum, c) => sum + c.score.total, 0) / content.length
    );

    // Score distribution
    const scoreDistribution = [
      { range: '0-50 (Meh)', count: 0 },
      { range: '51-70 (Good)', count: 0 },
      { range: '71-85 (Great)', count: 0 },
      { range: '86-100 (Holy Shit)', count: 0 }
    ];
    content.forEach(c => {
      if (c.score.total <= 50) scoreDistribution[0].count++;
      else if (c.score.total <= 70) scoreDistribution[1].count++;
      else if (c.score.total <= 85) scoreDistribution[2].count++;
      else scoreDistribution[3].count++;
    });

    // Funnel breakdown
    const funnelBreakdown: Record<FunnelStage, number> = { TOFU: 0, MOFU: 0, BOFU: 0 };
    content.forEach(c => funnelBreakdown[c.funnelStage]++);

    // Mix breakdown
    const mixBreakdown: Record<ContentMixCategory, number> = {
      value: 0, curated: 0, promo: 0, personal: 0, soft_sell: 0, hard_sell: 0
    };
    content.forEach(c => mixBreakdown[c.mixCategory]++);

    // Framework usage
    const frameworkUsage: Record<string, number> = {};
    content.forEach(c => {
      const fw = c.psychology.framework;
      frameworkUsage[fw] = (frameworkUsage[fw] || 0) + 1;
    });

    // Top performers
    const topPerformers = [...content]
      .sort((a, b) => b.score.total - a.score.total)
      .slice(0, 3);

    // Improvement suggestions
    const improvementSuggestions: string[] = [];
    if (averageScore < 70) {
      improvementSuggestions.push('Consider using more contrarian angles to boost unexpectedness');
    }
    if (funnelBreakdown.BOFU > content.length * 0.2) {
      improvementSuggestions.push('Heavy on BOFU content - consider more awareness content to grow audience');
    }
    if (Object.keys(frameworkUsage).length < 3) {
      improvementSuggestions.push('Try varying psychology frameworks for more diverse content');
    }

    return {
      averageScore,
      scoreDistribution,
      funnelBreakdown,
      mixBreakdown,
      frameworkUsage: frameworkUsage as Record<PsychologyFramework, number>,
      topPerformers,
      improvementSuggestions
    };
  }

  private selectFrameworkForIndex(index: number): PsychologyFramework {
    const frameworks: PsychologyFramework[] = ['AIDA', 'PAS', 'BAB', 'CuriosityGap', 'StoryBrand', 'PatternInterrupt'];
    return frameworks[index % frameworks.length];
  }

  private selectFunnelStageForIndex(index: number, total: number): FunnelStage {
    // 60% TOFU, 30% MOFU, 10% BOFU
    const tofuCount = Math.round(total * 0.6);
    const mofuCount = Math.round(total * 0.3);

    if (index < tofuCount) return 'TOFU';
    if (index < tofuCount + mofuCount) return 'MOFU';
    return 'BOFU';
  }

  private getNextFramework(current: PsychologyFramework): PsychologyFramework {
    const order: PsychologyFramework[] = ['AIDA', 'PAS', 'BAB', 'PASTOR', 'StoryBrand', 'CuriosityGap', 'PatternInterrupt'];
    const currentIndex = order.indexOf(current);
    return order[(currentIndex + 1) % order.length];
  }
}

// Export singleton instance
export const powerMode = new PowerModeService();

// Export class for testing
export { PowerModeService };
