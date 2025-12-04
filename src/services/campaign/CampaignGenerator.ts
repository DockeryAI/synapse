/**
 * Campaign Generator Service
 *
 * Core service that transforms business insights into complete campaigns
 * with real AI-generated content and visuals.
 *
 * Process:
 * 1. Takes campaign type + business context
 * 2. Generates 7-10 posts using SynapseContentGenerator
 * 3. Creates visuals via Bannerbear
 * 4. Saves to database
 * 5. Returns complete campaign
 *
 * Created: Nov 17, 2025 - Week 1 Workstream A
 */

import { SynapseContentGenerator } from '../synapse-v6/generation/SynapseContentGenerator';
import { bannerbearService } from '../visuals/bannerbear.service';
import { campaignDB } from './CampaignDB';
import type {
  CampaignGenerationInput,
  PostGenerationInput,
  GeneratedCampaign,
  GeneratedPost,
  PostContent,
  PostVisual,
  ContentSource,
  PostMetadata,
  CampaignType,
  PostType,
  Platform,
  BusinessContext,
  GenerationProgress,
  GenerationStage,
} from '@/types/campaign-generation.types';
import type { BreakthroughInsight } from '@/types/breakthrough.types';
import type { BusinessProfile } from '@/types/synapseContent.types';

export class CampaignGenerator {
  private contentGenerator: SynapseContentGenerator;
  private progressCallbacks: Map<string, (progress: GenerationProgress) => void>;

  constructor() {
    this.contentGenerator = new SynapseContentGenerator();
    this.progressCallbacks = new Map();
  }

  // ============================================================================
  // CAMPAIGN GENERATION
  // ============================================================================

  /**
   * Generate a complete campaign with 7-10 posts
   */
  async generateCampaign(input: CampaignGenerationInput): Promise<GeneratedCampaign> {
    const startTime = Date.now();
    console.log(`[CampaignGenerator] Starting campaign generation: ${input.campaignType}`);

    try {
      // Initialize progress tracking
      const sessionId = `campaign-${Date.now()}`;
      const progress = this.initializeProgress(sessionId, input.options?.postsPerCampaign || 7);

      // Stage 1: Initialize
      this.updateProgress(sessionId, 'initializing', 5);

      // Stage 2: Create campaign template
      this.updateProgress(sessionId, 'analyzing_business', 10);
      const template = this.createCampaignTemplate(input.campaignType);

      // Stage 3: Convert business context to insights
      this.updateProgress(sessionId, 'selecting_insights', 20);
      const insights = await this.extractInsights(input.businessContext);

      // Stage 4: Generate posts (✨ EQ v2.0: With emotional intelligence)
      this.updateProgress(sessionId, 'generating_content', 30);
      const posts = await this.generateCampaignPosts(
        input.campaignType,
        template,
        input.businessContext,
        insights,
        input.options?.postsPerCampaign || template.recommendedCount,
        input.options?.platforms || ['linkedin', 'facebook'],
        sessionId,
        input.brandId
      );

      // Stage 5: Generate visuals (if enabled)
      if (input.options?.includeVisuals !== false) {
        this.updateProgress(sessionId, 'generating_visuals', 70);
        await this.generateVisualsForPosts(posts);
      }

      // Stage 6: Save to database (if enabled)
      if (input.options?.saveToDatabase !== false) {
        this.updateProgress(sessionId, 'saving_to_database', 90);
        await this.saveCampaignToDatabase(input, posts);
      }

      // Create campaign object
      const campaign: GeneratedCampaign = {
        id: input.campaignId,
        campaignType: input.campaignType,
        name: template.name,
        description: template.description,
        posts,
        totalPosts: posts.length,
        estimatedDuration: template.duration,
        createdAt: new Date(),
        businessId: input.businessContext.businessData.businessName,
        metadata: {
          generatedBy: 'ai',
          sourceInsights: insights.map((i) => i.id),
          confidence: this.calculateCampaignConfidence(posts),
        },
      };

      this.updateProgress(sessionId, 'complete', 100);

      const duration = Date.now() - startTime;
      console.log(`[CampaignGenerator] Campaign generated in ${duration}ms: ${posts.length} posts`);

      return campaign;
    } catch (error) {
      console.error('[CampaignGenerator] Campaign generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate a single post
   */
  async generatePost(input: PostGenerationInput): Promise<GeneratedPost> {
    console.log(`[CampaignGenerator] Generating single post: ${input.postType}`);

    try {
      // Convert business context to insights
      const insights =
        input.selectedInsights ||
        (await this.extractInsights(input.businessContext));

      // Generate content (✨ EQ v2.0: Enriched with emotional intelligence)
      const businessProfile = await this.createBusinessProfile(input.businessContext, input.brandId);
      const platform = input.platforms?.[0] || 'linkedin';

      const generatedContent = await this.contentGenerator.generate(insights, businessProfile, {
        maxContent: 1,
        formats: [this.mapPostTypeToFormat(input.postType)],
        platform: (input.platforms?.[0] || platform) as 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'generic',
      });

      if (!generatedContent.content || generatedContent.content.length === 0) {
        throw new Error('Content generation failed - no content generated');
      }

      const synapseContent = generatedContent.content[0];

      // Convert to GeneratedPost format
      const post: GeneratedPost = {
        id: `post-${Date.now()}`,
        type: input.postType,
        platform,
        content: {
          headline: synapseContent.content.headline,
          hook: synapseContent.content.hook,
          body: synapseContent.content.body || '',
          hashtags: synapseContent.content.hashtags || [],
          callToAction: synapseContent.content.cta,
        },
        visuals: [],
        status: 'draft',
        sources: this.createSources(input.businessContext, synapseContent.insightId),
        metadata: {
          impactScore: synapseContent.metadata.impactScore,
          psychologyTriggers: undefined, // Not available in SynapseContent
          tone: undefined, // Not available in SynapseContent
          generatedAt: new Date(),
          model: 'synapse',
        },
      };

      // Generate visuals if enabled
      if (input.options?.includeVisuals !== false) {
        post.visuals = await this.generateVisualsForPost(post);
      }

      // Save to database if enabled
      if (input.options?.saveToDatabase !== false) {
        await this.savePostToDatabase(post, input.businessContext);
      }

      console.log(`[CampaignGenerator] Post generated successfully: ${post.id}`);
      return post;
    } catch (error) {
      console.error('[CampaignGenerator] Post generation failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Create a simple campaign template
   * TODO: Integrate with actual campaign templates from config
   */
  private createCampaignTemplate(campaignType: CampaignType): {
    id: string;
    name: string;
    description: string;
    postTypes: PostType[];
    recommendedCount: number;
    duration: number;
  } {
    const templates = {
      trust_builder: {
        id: 'trust-builder',
        name: 'Trust Builder Campaign',
        description: 'Build trust through customer success stories and testimonials',
        postTypes: ['customer_success', 'value_proposition', 'behind_the_scenes'] as PostType[],
        recommendedCount: 7,
        duration: 14,
      },
      authority_builder: {
        id: 'authority-builder',
        name: 'Authority Builder Campaign',
        description: 'Establish expertise through educational content',
        postTypes: ['educational', 'service_spotlight', 'problem_solution'] as PostType[],
        recommendedCount: 7,
        duration: 14,
      },
      problem_solver: {
        id: 'problem-solver',
        name: 'Problem Solver Campaign',
        description: 'Address customer pain points with solutions',
        postTypes: ['problem_solution', 'customer_success', 'service_spotlight'] as PostType[],
        recommendedCount: 7,
        duration: 14,
      },
      differentiator: {
        id: 'differentiator',
        name: 'Value Differentiator Campaign',
        description: 'Highlight what makes you unique',
        postTypes: ['value_proposition', 'behind_the_scenes', 'service_spotlight'] as PostType[],
        recommendedCount: 7,
        duration: 14,
      },
      engagement_driver: {
        id: 'engagement-driver',
        name: 'Community Engagement Campaign',
        description: 'Drive community interaction and loyalty',
        postTypes: ['community_engagement', 'behind_the_scenes', 'customer_success'] as PostType[],
        recommendedCount: 7,
        duration: 14,
      },
    };

    return templates[campaignType] || templates.authority_builder;
  }

  /**
   * Generate multiple posts for a campaign
   * ✨ EQ v2.0: Enriches profile with emotional intelligence when brandId provided
   */
  private async generateCampaignPosts(
    campaignType: CampaignType,
    template: { postTypes: PostType[]; id: string },
    context: BusinessContext,
    insights: BreakthroughInsight[],
    count: number,
    platforms: Platform[],
    sessionId: string,
    brandId?: string
  ): Promise<GeneratedPost[]> {
    const posts: GeneratedPost[] = [];
    const businessProfile = await this.createBusinessProfile(context, brandId);

    // Distribute post types according to template
    const postTypes = this.distributePostTypes(template.postTypes, count);

    for (let i = 0; i < count; i++) {
      try {
        const postType = postTypes[i];
        const platform = platforms[i % platforms.length];

        // Update progress
        const progressPercent = 30 + Math.floor((i / count) * 40);
        this.updateProgress(sessionId, 'generating_content', progressPercent, i + 1, count);

        // Generate content for this post
        const generatedContent = await this.contentGenerator.generate(
          [insights[i % insights.length]], // Rotate through insights
          businessProfile,
          {
            maxContent: 1,
            formats: [this.mapPostTypeToFormat(postType)],
            platform: platform as 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'generic',
          }
        );

        if (generatedContent.content && generatedContent.content.length > 0) {
          const synapseContent = generatedContent.content[0];

          const post: GeneratedPost = {
            id: `post-${Date.now()}-${i}`,
            type: postType,
            platform,
            content: {
              headline: synapseContent.content.headline,
              hook: synapseContent.content.hook,
              body: synapseContent.content.body || '',
              hashtags: synapseContent.content.hashtags || [],
              callToAction: synapseContent.content.cta,
            },
            visuals: [],
            status: 'draft',
            sources: this.createSources(context, synapseContent.insightId),
            metadata: {
              impactScore: synapseContent.metadata.impactScore,
              psychologyTriggers: undefined, // Not available in SynapseContent
              tone: undefined, // Not available in SynapseContent
              generatedAt: new Date(),
              model: 'synapse',
              templateUsed: template.id,
            },
          };

          posts.push(post);
        }
      } catch (error) {
        console.error(`[CampaignGenerator] Failed to generate post ${i + 1}:`, error);
        // Continue with next post
      }
    }

    return posts;
  }

  /**
   * Extract breakthrough insights from business context
   */
  private async extractInsights(context: BusinessContext): Promise<BreakthroughInsight[]> {
    const insights: BreakthroughInsight[] = [];

    // Extract from UVP data
    if (context.uvpData) {
      // Customer types insights
      context.uvpData.customerTypes.forEach((customer, index) => {
        insights.push({
          id: `customer-${index}`,
          type: 'audience',
          thinkingStyle: 'analytical',
          insight: customer.text,
          whyProfound: `Target messaging for ${customer.text}`,
          whyNow: 'Current market demands personalization',
          contentAngle: `${customer.text} face unique challenges we can address`,
          expectedReaction: 'Recognition and engagement',
          evidence: [customer.source.sourceUrl],
          confidence: customer.confidence,
          metadata: {
            generatedAt: new Date(),
            model: 'uvp-extraction',
          },
        });
      });

      // Differentiators insights
      context.uvpData.differentiators.forEach((diff, index) => {
        insights.push({
          id: `differentiator-${index}`,
          type: 'differentiator',
          thinkingStyle: 'creative',
          insight: diff.text,
          whyProfound: 'Unique value proposition',
          whyNow: 'Market differentiation is critical',
          contentAngle: diff.text,
          expectedReaction: 'Interest and curiosity',
          evidence: [diff.source.sourceUrl],
          confidence: diff.confidence,
          metadata: {
            generatedAt: new Date(),
            model: 'uvp-extraction',
          },
        });
      });

      // Problems solved insights
      context.uvpData.problemsSolved.forEach((problem, index) => {
        insights.push({
          id: `problem-${index}`,
          type: 'problem',
          thinkingStyle: 'lateral',
          insight: problem.text,
          whyProfound: 'Customer pain point to address',
          whyNow: 'Problems need immediate solutions',
          contentAngle: `Solve ${problem.text} effectively`,
          expectedReaction: 'Relief and trust',
          evidence: [problem.source.sourceUrl],
          confidence: problem.confidence,
          metadata: {
            generatedAt: new Date(),
            model: 'uvp-extraction',
          },
        });
      });
    }

    // Ensure we have at least a few insights
    if (insights.length === 0) {
      // Create generic insights from business data
      insights.push({
        id: 'generic-1',
        type: 'service',
        thinkingStyle: 'analytical',
        insight: `${context.businessData.businessName} provides quality services`,
        whyProfound: 'Build trust with service quality messaging',
        whyNow: 'Quality matters in competitive markets',
        contentAngle: 'Expert service you can trust',
        expectedReaction: 'Trust and confidence',
        evidence: [],
        confidence: 0.7,
        metadata: {
          generatedAt: new Date(),
          model: 'generic-fallback',
        },
      });
    }

    return insights.slice(0, 10); // Limit to top 10 insights
  }

  /**
   * Create business profile from context
   * ✨ EQ v2.0: Enriches with emotional intelligence when brandId is provided
   */
  private async createBusinessProfile(
    context: BusinessContext,
    brandId?: string
  ): Promise<BusinessProfile> {
    const baseProfile: BusinessProfile = {
      name: context.businessData.businessName || 'Business',
      industry: context.businessData.specialization || 'General',
      targetAudience: context.businessData.selectedCustomers?.[0] || 'Business Owners',
      brandVoice: 'professional',
      contentGoals: ['engagement', 'brand-awareness'],
    };

    // ✨ EQ v2.0: Enrich with emotional intelligence if brandId available
    if (brandId) {
      try {
        const { eqCampaignIntegration } = await import('@/services/eq-v2/eq-campaign-integration.service');

        // Prepare website content from context
        const websiteContent: string[] = [];
        if (context.websiteAnalysis?.valuePropositions) {
          websiteContent.push(...context.websiteAnalysis.valuePropositions);
        }
        if (context.uvpData?.differentiators) {
          context.uvpData.differentiators.forEach((diff) => websiteContent.push(diff.text));
        }

        const enrichedProfile = await eqCampaignIntegration.enrichBusinessProfile(
          baseProfile,
          brandId,
          {
            websiteContent: websiteContent.length > 0 ? websiteContent : undefined,
            specialty: context.specialization || context.businessData.specialization,
          }
        );

        console.log('[CampaignGenerator] Profile enriched with EQ:', enrichedProfile.eqContext?.overall_eq);
        return enrichedProfile;
      } catch (error) {
        console.error('[CampaignGenerator] Failed to enrich profile with EQ:', error);
        // Fall back to base profile without EQ
        return baseProfile;
      }
    }

    return baseProfile;
  }

  /**
   * Distribute post types evenly across count
   */
  private distributePostTypes(templateTypes: PostType[], count: number): PostType[] {
    const distributed: PostType[] = [];
    for (let i = 0; i < count; i++) {
      distributed.push(templateTypes[i % templateTypes.length]);
    }
    return distributed;
  }

  /**
   * Map post type to content format
   */
  private mapPostTypeToFormat(
    postType: PostType
  ): 'hook-post' | 'story-post' | 'data-post' | 'controversial-post' {
    const mapping: Record<PostType, any> = {
      customer_success: 'story-post',
      service_spotlight: 'hook-post',
      problem_solution: 'hook-post',
      value_proposition: 'data-post',
      behind_the_scenes: 'story-post',
      community_engagement: 'hook-post',
      educational: 'data-post',
      promotional: 'controversial-post',
    };

    return mapping[postType] || 'hook-post';
  }

  /**
   * Create content sources
   */
  private createSources(
    context: BusinessContext,
    insightId?: string
  ): ContentSource[] {
    const sources: ContentSource[] = [];

    // Website URL not available in RefinedBusinessData
    // sources.push({
    //   type: 'website',
    //   url: 'unknown',
    //   confidence: 1.0,
    // });

    if (insightId) {
      sources.push({
        type: 'insight',
        insightId: insightId,
        excerpt: '', // Excerpt not available from insightId alone
        confidence: 0.8,
      });
    }

    return sources;
  }

  /**
   * Calculate overall campaign confidence
   */
  private calculateCampaignConfidence(posts: GeneratedPost[]): number {
    if (posts.length === 0) return 0;

    const avgImpact =
      posts.reduce((sum, post) => sum + (post.metadata.impactScore || 0), 0) / posts.length;

    return avgImpact;
  }

  // ============================================================================
  // VISUAL GENERATION
  // ============================================================================

  /**
   * Generate visuals for all posts
   */
  private async generateVisualsForPosts(posts: GeneratedPost[]): Promise<void> {
    for (const post of posts) {
      try {
        post.visuals = await this.generateVisualsForPost(post);
      } catch (error) {
        console.error(`[CampaignGenerator] Visual generation failed for post ${post.id}:`, error);
        // Continue without visuals
      }
    }
  }

  /**
   * Generate visuals for a single post
   */
  private async generateVisualsForPost(post: GeneratedPost): Promise<PostVisual[]> {
    try {
      // Use Bannerbear to generate visual
      const imageUrl = await bannerbearService.createImage({
        templateId: this.selectBannerbearTemplate(post.platform, post.type),
        modifications: {
          headline: post.content.headline || '',
          body: post.content.body.substring(0, 200), // First 200 chars
          cta: post.content.callToAction || '',
        },
      });

      if (imageUrl) {
        return [
          {
            id: `visual-${Date.now()}`,
            url: imageUrl,
            type: 'image',
            bannerbearTemplateId: this.selectBannerbearTemplate(post.platform, post.type),
            bannerbearImageId: `image-${Date.now()}`,
            altText: post.content.headline || 'Generated visual',
          },
        ];
      }

      return [];
    } catch (error) {
      console.error('[CampaignGenerator] Bannerbear generation failed:', error);
      return [];
    }
  }

  /**
   * Select appropriate Bannerbear template
   */
  private selectBannerbearTemplate(platform: Platform, postType: PostType): string {
    // Template selection logic based on platform and post type
    // This would map to actual Bannerbear template IDs
    const templates: Record<string, string> = {
      'linkedin-customer_success': 'template-linkedin-story',
      'linkedin-service_spotlight': 'template-linkedin-service',
      'facebook-customer_success': 'template-facebook-story',
      'instagram-customer_success': 'template-instagram-story',
    };

    const key = `${platform}-${postType}`;
    return templates[key] || 'template-default';
  }

  // ============================================================================
  // DATABASE OPERATIONS
  // ============================================================================

  /**
   * Save campaign and posts to database
   */
  private async saveCampaignToDatabase(
    input: CampaignGenerationInput,
    posts: GeneratedPost[]
  ): Promise<void> {
    // TODO: Implement database persistence
    // The existing campaignDB service uses different types (CampaignWorkflow)
    // Need to either:
    // 1. Create adapter to convert GeneratedCampaign -> CampaignWorkflow types
    // 2. Add new methods to campaignDB for GeneratedCampaign types
    // 3. Create separate database service for campaign generation

    console.log(`[CampaignGenerator] Database save not yet implemented for ${input.campaignId}`);
    console.log(`[CampaignGenerator] Would save campaign with ${posts.length} posts`);

    // For now, just log success
    // try {
    //   await campaignDB.saveDraft({
    //     businessId: input.businessContext.businessData.businessName,
    //     campaignName: `${input.campaignType} Campaign`,
    //     campaignType: input.campaignType,
    //   });
    // } catch (error) {
    //   console.error('[CampaignGenerator] Database save failed:', error);
    // }
  }

  /**
   * Save single post to database
   */
  private async savePostToDatabase(
    post: GeneratedPost,
    context: BusinessContext,
    campaignId?: string
  ): Promise<void> {
    // TODO: Implement database persistence for single posts
    // Same issue as saveCampaignToDatabase - need type adapters

    console.log(`[CampaignGenerator] Database save not yet implemented for post ${post.id}`);

    // For now, just log success
    // try {
    //   await campaignDB.saveContentPieces(...);
    // } catch (error) {
    //   console.error(`[CampaignGenerator] Failed to save post ${post.id}:`, error);
    // }
  }

  // ============================================================================
  // PROGRESS TRACKING
  // ============================================================================

  /**
   * Initialize progress tracking
   */
  private initializeProgress(sessionId: string, totalPosts: number): GenerationProgress {
    return {
      sessionId,
      stage: 'initializing',
      progress: 0,
      currentPost: 0,
      totalPosts,
      errors: [],
    };
  }

  /**
   * Update progress
   */
  private updateProgress(
    sessionId: string,
    stage: GenerationStage,
    progress: number,
    currentPost?: number,
    totalPosts?: number
  ): void {
    const callback = this.progressCallbacks.get(sessionId);
    if (callback) {
      callback({
        sessionId,
        stage,
        progress,
        currentPost,
        totalPosts: totalPosts || 0,
        errors: [],
      });
    }
  }

  /**
   * Subscribe to progress updates
   */
  onProgress(sessionId: string, callback: (progress: GenerationProgress) => void): void {
    this.progressCallbacks.set(sessionId, callback);
  }

  /**
   * Unsubscribe from progress updates
   */
  offProgress(sessionId: string): void {
    this.progressCallbacks.delete(sessionId);
  }
}

// Export singleton instance
export const campaignGenerator = new CampaignGenerator();
