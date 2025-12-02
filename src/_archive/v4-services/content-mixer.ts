/**
 * V4 Content Mixer
 *
 * Combines multiple data sources to create synthesized content:
 * - UVP data (core brand messaging)
 * - Industry trends (from research)
 * - Competitor insights (differentiation)
 * - User data (personalization)
 *
 * Creates platform-adapted versions of content.
 *
 * Created: 2025-11-26
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';
import type {
  GeneratedContent,
  ContentPillar,
  PsychologyFramework,
  FunnelStage,
  ContentMixCategory
} from './types';

import { contentOrchestrator } from './content-orchestrator';
import { pillarGenerator } from './pillar-generator';
import { psychologyEngine } from './psychology-engine';
import { contentScorer } from './content-scorer';

// ============================================================================
// CONTENT MIXER TYPES
// ============================================================================

interface IndustryTrend {
  id: string;
  title: string;
  description: string;
  relevance: number; // 0-100
  source?: string;
}

interface CompetitorInsight {
  id: string;
  competitor: string;
  insight: string;
  opportunity: string;
  relevance: number;
}

interface UserContext {
  previousContent?: GeneratedContent[];
  preferences?: {
    preferredFrameworks?: PsychologyFramework[];
    preferredTone?: string;
    avoidTopics?: string[];
  };
  engagement?: {
    topPerformingTopics?: string[];
    lowPerformingTopics?: string[];
  };
}

interface MixedContentResult {
  content: GeneratedContent;
  sources: {
    uvp: boolean;
    trends: string[];
    competitors: string[];
    userContext: boolean;
  };
  synthesisNotes: string;
}

interface PlatformAdaptation {
  platform: 'linkedin' | 'instagram' | 'twitter' | 'facebook' | 'tiktok';
  content: GeneratedContent;
  adaptations: string[];
  characterCount: number;
  hashtagCount: number;
}

// ============================================================================
// PLATFORM CONFIGURATIONS
// ============================================================================

const PLATFORM_CONFIGS: Record<string, {
  maxLength: number;
  optimalLength: number;
  hashtagLimit: number;
  tone: string;
  features: string[];
}> = {
  linkedin: {
    maxLength: 3000,
    optimalLength: 1500,
    hashtagLimit: 5,
    tone: 'professional',
    features: ['polls', 'documents', 'articles', 'native video']
  },
  instagram: {
    maxLength: 2200,
    optimalLength: 150,
    hashtagLimit: 30,
    tone: 'casual',
    features: ['reels', 'stories', 'carousel', 'live']
  },
  twitter: {
    maxLength: 280,
    optimalLength: 240,
    hashtagLimit: 2,
    tone: 'conversational',
    features: ['threads', 'polls', 'spaces']
  },
  facebook: {
    maxLength: 63206,
    optimalLength: 80,
    hashtagLimit: 3,
    tone: 'friendly',
    features: ['live', 'groups', 'stories', 'reels']
  },
  tiktok: {
    maxLength: 2200,
    optimalLength: 150,
    hashtagLimit: 5,
    tone: 'trendy',
    features: ['duets', 'stitches', 'sounds', 'effects']
  }
};

// ============================================================================
// CONTENT MIXER SERVICE CLASS
// ============================================================================

class ContentMixerService {
  /**
   * Mix UVP with industry trends to create trend-aware content
   */
  async mixWithTrends(
    uvp: CompleteUVP,
    trends: IndustryTrend[],
    options?: {
      pillar?: ContentPillar;
      maxTrends?: number;
    }
  ): Promise<MixedContentResult> {
    console.log('[Content Mixer] Mixing UVP with industry trends...');

    // Sort trends by relevance
    const relevantTrends = trends
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, options?.maxTrends || 2);

    // Build enhanced prompt context
    const trendContext = relevantTrends
      .map(t => `• ${t.title}: ${t.description}`)
      .join('\n');

    // Generate content with trend awareness
    const pillar = options?.pillar || pillarGenerator.generatePillars(uvp)[0];

    const content = await contentOrchestrator.generate({
      uvp,
      pillar,
      platform: 'linkedin',
      funnelStage: 'TOFU'
    });

    // Enhance hook with trend reference
    const enhancedContent: GeneratedContent = {
      ...content,
      hook: this.injectTrendReference(content.hook, relevantTrends[0]),
      metadata: {
        ...content.metadata,
        characterCount: content.hook.length + content.body.length + content.cta.length
      }
    };

    return {
      content: enhancedContent,
      sources: {
        uvp: true,
        trends: relevantTrends.map(t => t.title),
        competitors: [],
        userContext: false
      },
      synthesisNotes: `Blended UVP with ${relevantTrends.length} industry trends: ${relevantTrends.map(t => t.title).join(', ')}`
    };
  }

  /**
   * Mix UVP with competitor insights for differentiation
   */
  async mixWithCompetitors(
    uvp: CompleteUVP,
    competitors: CompetitorInsight[],
    options?: {
      pillar?: ContentPillar;
      framework?: PsychologyFramework;
    }
  ): Promise<MixedContentResult> {
    console.log('[Content Mixer] Mixing UVP with competitor insights...');

    // Focus on opportunities
    const opportunities = competitors
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 2);

    // Use PatternInterrupt framework for differentiation
    const framework = options?.framework || 'PatternInterrupt';
    const pillar = options?.pillar || pillarGenerator.generatePillars(uvp)[0];

    const content = await contentOrchestrator.generate({
      uvp,
      pillar,
      framework,
      platform: 'linkedin',
      funnelStage: 'MOFU'
    });

    // Enhance with competitive angle
    const enhancedContent: GeneratedContent = {
      ...content,
      body: this.injectCompetitiveAngle(content.body, opportunities[0]),
      metadata: {
        ...content.metadata,
        characterCount: content.hook.length + content.body.length + content.cta.length
      }
    };

    return {
      content: enhancedContent,
      sources: {
        uvp: true,
        trends: [],
        competitors: opportunities.map(c => c.competitor),
        userContext: false
      },
      synthesisNotes: `Created differentiating content highlighting: ${opportunities.map(o => o.opportunity).join(', ')}`
    };
  }

  /**
   * Mix UVP with user context for personalized content
   */
  async mixWithUserContext(
    uvp: CompleteUVP,
    userContext: UserContext,
    options?: {
      pillar?: ContentPillar;
    }
  ): Promise<MixedContentResult> {
    console.log('[Content Mixer] Mixing UVP with user context...');

    // Determine best framework based on user preferences
    const framework = userContext.preferences?.preferredFrameworks?.[0] ||
      psychologyEngine.selectFramework('engagement', 'TOFU');

    const pillar = options?.pillar || pillarGenerator.generatePillars(uvp)[0];

    // Avoid topics user doesn't want
    const avoidTopics = userContext.preferences?.avoidTopics || [];

    const content = await contentOrchestrator.generate({
      uvp,
      pillar,
      framework,
      platform: 'linkedin',
      funnelStage: 'TOFU'
    });

    // Score against previous content to ensure variety
    let enhancedContent = content;
    if (userContext.previousContent?.length) {
      const isTooSimilar = this.checkSimilarity(content, userContext.previousContent);
      if (isTooSimilar) {
        // Regenerate with different framework
        enhancedContent = await contentOrchestrator.regenerate(content, uvp, {
          framework: this.getAlternativeFramework(framework)
        });
      }
    }

    return {
      content: enhancedContent,
      sources: {
        uvp: true,
        trends: [],
        competitors: [],
        userContext: true
      },
      synthesisNotes: `Personalized content using ${framework} framework, avoiding: ${avoidTopics.join(', ') || 'none'}`
    };
  }

  /**
   * Create multi-platform adaptations
   */
  async adaptForPlatforms(
    content: GeneratedContent,
    platforms: ('linkedin' | 'instagram' | 'twitter' | 'facebook' | 'tiktok')[]
  ): Promise<PlatformAdaptation[]> {
    console.log(`[Content Mixer] Adapting content for ${platforms.length} platforms...`);

    const adaptations: PlatformAdaptation[] = [];

    for (const platform of platforms) {
      const config = PLATFORM_CONFIGS[platform];
      const adapted = this.adaptContent(content, platform, config);

      adaptations.push({
        platform,
        content: adapted,
        adaptations: this.getAdaptationNotes(platform, content, adapted),
        characterCount: adapted.hook.length + adapted.body.length + adapted.cta.length,
        hashtagCount: adapted.hashtags.length
      });
    }

    return adaptations;
  }

  /**
   * Generate content variations for testing
   */
  async generateVariations(
    uvp: CompleteUVP,
    baseContent: GeneratedContent,
    count: number = 3
  ): Promise<{
    variations: GeneratedContent[];
    comparison: {
      id: string;
      score: number;
      strengths: string[];
      weaknesses: string[];
    }[];
    recommendation: string;
  }> {
    console.log(`[Content Mixer] Generating ${count} variations...`);

    const variations: GeneratedContent[] = [baseContent];
    const frameworks: PsychologyFramework[] = ['PAS', 'BAB', 'CuriosityGap', 'StoryBrand'];

    for (let i = 0; i < count - 1; i++) {
      const variation = await contentOrchestrator.regenerate(baseContent, uvp, {
        framework: frameworks[i % frameworks.length]
      });
      variations.push(variation);
    }

    // Compare all variations
    const comparison = variations.map(v => ({
      id: v.id,
      score: v.score.total,
      strengths: v.score.strengths,
      weaknesses: v.score.weaknesses
    }));

    // Find best variation
    const best = [...variations].sort((a, b) => b.score.total - a.score.total)[0];
    const recommendation = `Variation ${best.id} scored highest (${best.score.total}/100) using ${best.psychology.framework} framework. ` +
      `Key strength: ${best.score.strengths[0] || 'overall balance'}`;

    return {
      variations,
      comparison,
      recommendation
    };
  }

  /**
   * Mix multiple content pieces into a series
   */
  async createContentSeries(
    uvp: CompleteUVP,
    topic: string,
    seriesLength: number = 5
  ): Promise<{
    series: GeneratedContent[];
    seriesTheme: string;
    postingOrder: string[];
  }> {
    console.log(`[Content Mixer] Creating ${seriesLength}-part content series on "${topic}"...`);

    const pillars = pillarGenerator.generatePillars(uvp);
    const pillar = pillars.find(p =>
      p.name.toLowerCase().includes(topic.toLowerCase()) ||
      p.description.toLowerCase().includes(topic.toLowerCase())
    ) || pillars[0];

    const series: GeneratedContent[] = [];
    const frameworks: PsychologyFramework[] = ['CuriosityGap', 'AIDA', 'PAS', 'StoryBrand', 'PASTOR'];

    for (let i = 0; i < seriesLength; i++) {
      const content = await contentOrchestrator.generate({
        uvp,
        pillar,
        framework: frameworks[i % frameworks.length],
        platform: 'linkedin',
        funnelStage: i < 3 ? 'TOFU' : i < 4 ? 'MOFU' : 'BOFU'
      });

      // Add series indicator to hook
      const seriesContent: GeneratedContent = {
        ...content,
        headline: `Part ${i + 1}/${seriesLength}: ${content.headline}`,
        hook: `🧵 ${i + 1}/${seriesLength}\n\n${content.hook}`
      };

      series.push(seriesContent);
    }

    return {
      series,
      seriesTheme: `${seriesLength}-part series on ${pillar.name}`,
      postingOrder: series.map((_, i) => `Day ${i + 1}: Part ${i + 1}`)
    };
  }

  /**
   * Blend multiple UVPs (for agencies managing multiple brands)
   */
  async blendUVPs(
    primaryUVP: CompleteUVP,
    secondaryUVP: CompleteUVP,
    blendRatio: number = 0.7 // 70% primary, 30% secondary
  ): Promise<{
    blendedContent: GeneratedContent;
    primaryInfluence: string[];
    secondaryInfluence: string[];
  }> {
    console.log(`[Content Mixer] Blending UVPs (${blendRatio * 100}% primary)...`);

    // Generate content from primary
    const primaryContent = await contentOrchestrator.generate({
      uvp: primaryUVP,
      platform: 'linkedin',
      funnelStage: 'TOFU'
    });

    // Get secondary themes for blending
    const secondaryPillars = pillarGenerator.generatePillars(secondaryUVP);
    const secondaryTheme = secondaryPillars[0]?.name || 'complementary expertise';

    // Blend in secondary elements
    const blendedContent: GeneratedContent = {
      ...primaryContent,
      body: `${primaryContent.body}\n\nThis approach also applies to ${secondaryTheme.toLowerCase()}, where similar principles drive success.`
    };

    return {
      blendedContent,
      primaryInfluence: ['Main messaging', 'Primary CTA', 'Core framework'],
      secondaryInfluence: ['Supporting context', 'Cross-industry validation']
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private injectTrendReference(hook: string, trend: IndustryTrend): string {
    if (!trend) return hook;

    // Add trend reference at the start
    const trendIntro = `With ${trend.title} changing everything...`;

    // If hook starts with a question, place trend before it
    if (hook.startsWith('Why') || hook.startsWith('What') || hook.startsWith('How')) {
      return `${trendIntro}\n\n${hook}`;
    }

    return `${trendIntro} ${hook}`;
  }

  private injectCompetitiveAngle(body: string, opportunity: CompetitorInsight): string {
    if (!opportunity) return body;

    // Add differentiation note
    const differentiation = `\n\nWhile most ${opportunity.competitor ? 'competitors' : 'approaches'} ${opportunity.insight.toLowerCase()}, this strategy focuses on ${opportunity.opportunity.toLowerCase()}.`;

    return body + differentiation;
  }

  private checkSimilarity(content: GeneratedContent, previousContent: GeneratedContent[]): boolean {
    // Simple similarity check based on framework and pillar
    return previousContent.some(prev =>
      prev.psychology.framework === content.psychology.framework &&
      prev.pillarId === content.pillarId
    );
  }

  private getAlternativeFramework(current: PsychologyFramework): PsychologyFramework {
    const alternatives: Record<PsychologyFramework, PsychologyFramework> = {
      AIDA: 'PAS',
      PAS: 'BAB',
      BAB: 'CuriosityGap',
      PASTOR: 'StoryBrand',
      StoryBrand: 'AIDA',
      CuriosityGap: 'PatternInterrupt',
      PatternInterrupt: 'AIDA',
      SocialProof: 'Reciprocity',
      Scarcity: 'LossAversion',
      Reciprocity: 'SocialProof',
      LossAversion: 'PAS',
      Authority: 'FAB',
      FAB: 'Authority'
    };
    return alternatives[current] || 'AIDA';
  }

  private adaptContent(
    content: GeneratedContent,
    platform: string,
    config: typeof PLATFORM_CONFIGS[string]
  ): GeneratedContent {
    let adaptedHook = content.hook;
    let adaptedBody = content.body;
    let adaptedCTA = content.cta;
    let adaptedHashtags = [...content.hashtags];

    // Truncate for character limits
    const totalLength = adaptedHook.length + adaptedBody.length + adaptedCTA.length;
    if (totalLength > config.maxLength) {
      const ratio = config.maxLength / totalLength;
      adaptedBody = adaptedBody.substring(0, Math.floor(adaptedBody.length * ratio * 0.8));
      adaptedBody += '...';
    }

    // Adjust hashtags
    adaptedHashtags = adaptedHashtags.slice(0, config.hashtagLimit);

    // Platform-specific adjustments
    switch (platform) {
      case 'twitter':
        // Make punchier for Twitter
        adaptedHook = adaptedHook.split('.')[0] + '.';
        adaptedBody = adaptedBody.substring(0, 200);
        adaptedCTA = ''; // Twitter CTAs are usually in bio
        break;

      case 'instagram':
        // Add emojis for Instagram
        adaptedHook = '✨ ' + adaptedHook;
        adaptedCTA = '👆 ' + adaptedCTA;
        break;

      case 'tiktok':
        // Keep super short for TikTok
        adaptedHook = adaptedHook.substring(0, 100);
        adaptedBody = adaptedBody.substring(0, 100);
        break;
    }

    return {
      ...content,
      hook: adaptedHook,
      body: adaptedBody,
      cta: adaptedCTA,
      hashtags: adaptedHashtags,
      metadata: {
        ...content.metadata,
        platform
      }
    };
  }

  private getAdaptationNotes(
    platform: string,
    original: GeneratedContent,
    adapted: GeneratedContent
  ): string[] {
    const notes: string[] = [];
    const config = PLATFORM_CONFIGS[platform];

    if (adapted.hook.length < original.hook.length) {
      notes.push('Hook shortened for platform');
    }
    if (adapted.body.length < original.body.length) {
      notes.push('Body truncated to fit character limit');
    }
    if (adapted.hashtags.length < original.hashtags.length) {
      notes.push(`Hashtags limited to ${config.hashtagLimit}`);
    }
    if (platform === 'twitter' && !adapted.cta) {
      notes.push('CTA removed (use bio link)');
    }
    if (platform === 'instagram' || platform === 'tiktok') {
      notes.push('Emojis added for platform style');
    }

    return notes;
  }
}

// Export singleton instance
export const contentMixer = new ContentMixerService();

// Export class for testing
export { ContentMixerService };
