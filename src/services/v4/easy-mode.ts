/**
 * V4 Easy Mode
 *
 * One-click content generation for non-technical users.
 * Automatically handles all the complexity:
 * - Auto-generates pillars from UVP
 * - Auto-selects campaign template
 * - Auto-applies content mix rules
 * - Generates full campaign automatically
 *
 * Perfect for: Busy entrepreneurs, first-time users, quick wins
 *
 * Created: 2025-11-26
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';
import type {
  ContentPillar,
  GeneratedContent,
  CampaignTemplateType,
  ContentMixRule,
  FunnelStage,
  EasyModeConfig
} from './types';

import { pillarGenerator } from './pillar-generator';
import { contentMixEngine } from './content-mix-engine';
import { funnelTagger } from './funnel-tagger';
import { campaignTemplates } from './campaign-templates';
import { contentOrchestrator } from './content-orchestrator';

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_EASY_MODE_CONFIG: EasyModeConfig = {
  autoSelectPillars: true,
  autoSelectFramework: true,
  autoApplyMixRules: true,
  defaultCampaignTemplate: 'evergreen'
};

// ============================================================================
// EASY MODE RESULT TYPES
// ============================================================================

interface EasyModeResult {
  success: boolean;
  pillars: ContentPillar[];
  content: GeneratedContent[];
  campaign: {
    template: CampaignTemplateType;
    mixRule: ContentMixRule;
    weekCount: number;
  };
  summary: string;
  recommendations: string[];
}

interface QuickPostResult {
  success: boolean;
  content: GeneratedContent;
  alternatives?: GeneratedContent[];
}

interface WeeklyPlanResult {
  success: boolean;
  posts: GeneratedContent[];
  schedule: {
    day: string;
    content: GeneratedContent;
  }[];
  mixBalance: {
    current: Record<string, number>;
    target: Record<string, number>;
    isBalanced: boolean;
  };
}

// ============================================================================
// EASY MODE SERVICE CLASS
// ============================================================================

class EasyModeService {
  private config: EasyModeConfig;

  constructor(config?: Partial<EasyModeConfig>) {
    this.config = { ...DEFAULT_EASY_MODE_CONFIG, ...config };
  }

  /**
   * One-click full campaign generation
   *
   * Takes UVP and generates complete content strategy:
   * 1. Generates pillars
   * 2. Selects best campaign template
   * 3. Applies content mix rules
   * 4. Generates all content
   */
  async generateFullCampaign(
    uvp: CompleteUVP,
    options?: {
      weeks?: number;
      postsPerWeek?: number;
      platform?: 'linkedin' | 'instagram' | 'twitter' | 'facebook' | 'tiktok';
    }
  ): Promise<EasyModeResult> {
    console.log('[Easy Mode] Starting full campaign generation...');

    try {
      // 1. Auto-generate pillars
      const pillars = pillarGenerator.generatePillars(uvp);
      console.log(`[Easy Mode] Generated ${pillars.length} content pillars`);

      // 2. Auto-select campaign template based on UVP analysis
      const templateType = this.selectBestTemplate(uvp);
      const template = campaignTemplates.get(templateType);
      console.log(`[Easy Mode] Selected ${template.name} template`);

      // 3. Set content mix rule
      contentMixEngine.setRule(template.contentMixRule);

      // 4. Generate campaign plan
      const weeks = options?.weeks || template.durationWeeks;
      const postsPerWeek = options?.postsPerWeek || 5;
      const platform = options?.platform || 'linkedin';

      // 5. Generate content for each week
      const allContent: GeneratedContent[] = [];
      const funnelDistribution = this.getFunnelDistribution(weeks);

      for (let weekNum = 0; weekNum < weeks; weekNum++) {
        const weekTheme = template.weeklyStructure[weekNum % template.weeklyStructure.length];
        const pillar = pillars[weekNum % pillars.length];

        // Generate posts for this week
        for (let postNum = 0; postNum < postsPerWeek; postNum++) {
          const funnelStage = funnelDistribution[allContent.length % funnelDistribution.length];
          const mixCategory = contentMixEngine.planNextContent(allContent, 1).nextPost;

          const content = await contentOrchestrator.generate({
            uvp,
            pillar,
            platform: platform as any,
            funnelStage,
            contentMixCategory: mixCategory
          });

          allContent.push(content);
        }
      }

      console.log(`[Easy Mode] Generated ${allContent.length} content pieces`);

      // 6. Generate recommendations
      const recommendations = this.generateRecommendations(uvp, allContent, pillars);

      // 7. Build summary
      const summary = this.buildCampaignSummary(uvp, pillars, template, allContent.length);

      return {
        success: true,
        pillars,
        content: allContent,
        campaign: {
          template: templateType,
          mixRule: template.contentMixRule,
          weekCount: weeks
        },
        summary,
        recommendations
      };

    } catch (error) {
      console.error('[Easy Mode] Campaign generation failed:', error);
      return {
        success: false,
        pillars: [],
        content: [],
        campaign: {
          template: 'evergreen',
          mixRule: '70-20-10',
          weekCount: 0
        },
        summary: 'Campaign generation failed. Please try again.',
        recommendations: ['Check your UVP is complete', 'Ensure you have a valid internet connection']
      };
    }
  }

  /**
   * Quick single post generation
   *
   * For when you just need one post quickly
   */
  async generateQuickPost(
    uvp: CompleteUVP,
    options?: {
      platform?: 'linkedin' | 'instagram' | 'twitter' | 'facebook' | 'tiktok';
      generateAlternatives?: boolean;
    }
  ): Promise<QuickPostResult> {
    console.log('[Easy Mode] Generating quick post...');

    try {
      const platform = options?.platform || 'linkedin';

      // Auto-select best pillar
      const pillars = pillarGenerator.generatePillars(uvp);
      const pillar = pillars[0]; // Best pillar first

      // Generate primary post
      const content = await contentOrchestrator.generate({
        uvp,
        pillar,
        platform: platform as any,
        funnelStage: 'TOFU', // Default to awareness
        contentMixCategory: 'value' // Default to value content
      });

      // Generate alternatives if requested
      let alternatives: GeneratedContent[] | undefined;
      if (options?.generateAlternatives) {
        alternatives = await Promise.all([
          contentOrchestrator.regenerate(content, uvp, { framework: 'PAS' }),
          contentOrchestrator.regenerate(content, uvp, { framework: 'StoryBrand' })
        ]);
      }

      return {
        success: true,
        content,
        alternatives
      };

    } catch (error) {
      console.error('[Easy Mode] Quick post generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate weekly content plan
   *
   * Perfect for weekly content planning
   */
  async generateWeeklyPlan(
    uvp: CompleteUVP,
    options?: {
      platform?: 'linkedin' | 'instagram' | 'twitter' | 'facebook' | 'tiktok';
      postsPerWeek?: number;
      startDay?: 'monday' | 'sunday';
    }
  ): Promise<WeeklyPlanResult> {
    console.log('[Easy Mode] Generating weekly plan...');

    try {
      const platform = options?.platform || 'linkedin';
      const postsPerWeek = options?.postsPerWeek || 5;
      const startDay = options?.startDay || 'monday';

      // Generate pillars
      const pillars = pillarGenerator.generatePillars(uvp);

      // Set up mix engine
      contentMixEngine.setRule('70-20-10');

      // Generate posts
      const posts: GeneratedContent[] = [];
      const mixPlan = contentMixEngine.planNextContent([], postsPerWeek);

      for (let i = 0; i < postsPerWeek; i++) {
        const pillar = pillars[i % pillars.length];
        const mixCategory = mixPlan.upcomingPosts[i];

        // Determine funnel stage (mostly TOFU for weekly)
        const funnelStage: FunnelStage = i < 3 ? 'TOFU' : i < 4 ? 'MOFU' : 'BOFU';

        const content = await contentOrchestrator.generate({
          uvp,
          pillar,
          platform: platform as any,
          funnelStage,
          contentMixCategory: mixCategory
        });

        posts.push(content);
      }

      // Create schedule
      const schedule = this.createWeeklySchedule(posts, startDay);

      // Check mix balance
      const mixAnalysis = contentMixEngine.analyzeMix(posts);

      return {
        success: true,
        posts,
        schedule,
        mixBalance: {
          current: mixAnalysis.currentRatios as Record<string, number>,
          target: mixAnalysis.targetRatios as Record<string, number>,
          isBalanced: mixAnalysis.isBalanced
        }
      };

    } catch (error) {
      console.error('[Easy Mode] Weekly plan generation failed:', error);
      throw error;
    }
  }

  /**
   * Get AI recommendations for content strategy
   */
  getContentRecommendations(uvp: CompleteUVP): {
    recommendedTemplate: CampaignTemplateType;
    recommendedMixRule: ContentMixRule;
    recommendedPlatform: string;
    reasons: string[];
  } {
    const templateType = this.selectBestTemplate(uvp);
    const template = campaignTemplates.get(templateType);

    const reasons: string[] = [];

    // Analyze UVP to provide specific reasons
    if (uvp.keyBenefit?.metrics?.length) {
      reasons.push('Your UVP has strong metrics - perfect for data-driven content');
    }
    if (uvp.transformationGoal?.emotionalDrivers?.length) {
      reasons.push('Strong emotional drivers detected - story-based content will resonate');
    }
    if (uvp.uniqueSolution?.differentiators?.length) {
      reasons.push('Clear differentiators - great for authority-building content');
    }

    // Default recommendations
    if (reasons.length === 0) {
      reasons.push('Starting with evergreen content builds a strong foundation');
      reasons.push('70-20-10 mix ensures you provide value while building visibility');
    }

    return {
      recommendedTemplate: templateType,
      recommendedMixRule: template.contentMixRule,
      recommendedPlatform: 'linkedin', // Default recommendation
      reasons
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<EasyModeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): EasyModeConfig {
    return { ...this.config };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private selectBestTemplate(uvp: CompleteUVP): CampaignTemplateType {
    // Analyze UVP to determine best template

    // Check for new product/service indicators
    const hasNewProduct = uvp.uniqueSolution?.statement?.toLowerCase().includes('new') ||
      uvp.uniqueSolution?.statement?.toLowerCase().includes('launch');

    if (hasNewProduct) {
      return 'product_launch';
    }

    // Check for authority indicators
    const hasStrongDifferentiators = (uvp.uniqueSolution?.differentiators?.length || 0) >= 3;
    const hasMethodology = !!uvp.uniqueSolution?.methodology;

    if (hasStrongDifferentiators || hasMethodology) {
      return 'authority_builder';
    }

    // Check for engagement focus
    const hasEmotionalFocus = (uvp.transformationGoal?.emotionalDrivers?.length || 0) >= 2;

    if (hasEmotionalFocus) {
      return 'engagement_drive';
    }

    // Default to evergreen for sustainable growth
    return this.config.defaultCampaignTemplate;
  }

  private getFunnelDistribution(weeks: number): FunnelStage[] {
    // 60% TOFU, 30% MOFU, 10% BOFU
    const distribution: FunnelStage[] = [];
    const totalPosts = weeks * 5; // Assume 5 posts per week

    const tofuCount = Math.round(totalPosts * 0.6);
    const mofuCount = Math.round(totalPosts * 0.3);
    const bofuCount = totalPosts - tofuCount - mofuCount;

    for (let i = 0; i < tofuCount; i++) distribution.push('TOFU');
    for (let i = 0; i < mofuCount; i++) distribution.push('MOFU');
    for (let i = 0; i < bofuCount; i++) distribution.push('BOFU');

    // Shuffle
    return distribution.sort(() => Math.random() - 0.5);
  }

  private generateRecommendations(
    uvp: CompleteUVP,
    content: GeneratedContent[],
    pillars: ContentPillar[]
  ): string[] {
    const recommendations: string[] = [];

    // Check content scores
    const avgScore = content.reduce((sum, c) => sum + c.score.total, 0) / content.length;
    if (avgScore < 70) {
      recommendations.push('Consider adding more specific data and examples to boost content quality');
    }

    // Check pillar coverage
    const pillarIds = new Set(content.map(c => c.pillarId).filter(Boolean));
    if (pillarIds.size < pillars.length) {
      recommendations.push('Some content pillars are underutilized - consider creating content for all pillars');
    }

    // Check funnel balance
    const funnelAnalysis = funnelTagger.analyzeFunnelDistribution(content);
    if (!funnelAnalysis.isBalanced) {
      recommendations.push(...funnelAnalysis.recommendations);
    }

    // Check mix balance
    const mixAnalysis = contentMixEngine.analyzeMix(content);
    if (!mixAnalysis.isBalanced) {
      recommendations.push(...mixAnalysis.suggestions);
    }

    // Add encouragement if everything looks good
    if (recommendations.length === 0) {
      recommendations.push('Your content strategy looks well-balanced!');
      recommendations.push('Consider A/B testing different hooks to optimize engagement');
    }

    return recommendations;
  }

  private buildCampaignSummary(
    uvp: CompleteUVP,
    pillars: ContentPillar[],
    template: any,
    contentCount: number
  ): string {
    const customer = uvp.targetCustomer?.statement || 'your target audience';
    const benefit = uvp.keyBenefit?.statement || 'achieve their goals';

    return `Generated ${contentCount} content pieces across ${pillars.length} pillars ` +
      `using the ${template.name}. This campaign will help ${customer} ${benefit}. ` +
      `Following the ${template.contentMixRule} content mix for optimal balance.`;
  }

  private createWeeklySchedule(
    posts: GeneratedContent[],
    startDay: 'monday' | 'sunday'
  ): { day: string; content: GeneratedContent }[] {
    const days = startDay === 'monday'
      ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

    return posts.map((content, index) => ({
      day: days[index % days.length],
      content
    }));
  }
}

// Export singleton instance
export const easyMode = new EasyModeService();

// Export class for testing
export { EasyModeService };
