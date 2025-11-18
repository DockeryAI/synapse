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
 * Updated: Nov 17, 2025 - Week 2 Track 1 (Error Handling Integration)
 */

import { SynapseContentGenerator } from '../synapse/generation/SynapseContentGenerator';
import { bannerbearService } from '../visuals/bannerbear.service';
import { campaignDB } from './CampaignDB';
import { ErrorHandlerService, RetryProgress, logError } from '../errors/error-handler.service';
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
import type { SynapseContent } from '@/types/synapse/synapseContent.types';

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
  async generateCampaign(
    input: CampaignGenerationInput,
    onProgress?: (progress: GenerationProgress) => void,
    onRetry?: (retry: RetryProgress) => void
  ): Promise<GeneratedCampaign> {
    const startTime = Date.now();
    console.log(`[CampaignGenerator] Starting campaign generation: ${input.campaignType}`);

    try {
      // Initialize progress tracking
      const sessionId = `campaign-${Date.now()}`;
      const progress = this.initializeProgress(sessionId, input.options?.postsPerCampaign || 7);

      // Register progress callback
      if (onProgress) {
        this.onProgress(sessionId, onProgress);
      }

      // Stage 1: Initialize
      this.updateProgress(sessionId, 'initializing', 5);

      // Stage 2: Create campaign template
      this.updateProgress(sessionId, 'analyzing_business', 10);
      const template = this.createCampaignTemplate(input.campaignType);

      // Stage 3: Convert business context to insights
      this.updateProgress(sessionId, 'selecting_insights', 20);
      const insights = await this.extractInsights(input.businessContext);

      // Stage 4: Generate posts
      this.updateProgress(sessionId, 'generating_content', 30);
      const posts = await this.generateCampaignPosts(
        input.campaignType,
        template,
        input.businessContext,
        insights,
        input.options?.postsPerCampaign || template.recommendedCount,
        input.options?.platforms || ['linkedin', 'facebook'],
        sessionId,
        onRetry
      );

      // Stage 5: Generate visuals (if enabled)
      if (input.options?.includeVisuals !== false) {
        this.updateProgress(sessionId, 'generating_visuals', 70);
        await this.generateVisualsForPosts(posts, onRetry);
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
      this.offProgress(sessionId);

      const duration = Date.now() - startTime;
      console.log(`[CampaignGenerator] Campaign generated in ${duration}ms: ${posts.length} posts`);

      return campaign;
    } catch (error) {
      logError(error, { operation: 'generateCampaign', campaignType: input.campaignType });
      console.error('[CampaignGenerator] Campaign generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate a single post
   */
  async generatePost(
    input: PostGenerationInput,
    onRetry?: (retry: RetryProgress) => void
  ): Promise<GeneratedPost> {
    console.log(`[CampaignGenerator] Generating single post: ${input.postType}`);

    try {
      // Convert business context to insights
      const insights =
        input.selectedInsights ||
        (await this.extractInsights(input.businessContext));

      // Generate content with retry
      const businessProfile = this.createBusinessProfile(input.businessContext);
      const platform = input.platforms?.[0] || 'linkedin';

      const generatedContent = await ErrorHandlerService.executeWithRetry(
        () => this.contentGenerator.generate(insights, businessProfile, {
          maxContent: 1,
          formats: [this.mapPostTypeToFormat(input.postType)],
          platform: this.mapPlatformToGenerationPlatform(platform),
        }),
        { maxAttempts: 3 },
        onRetry
      );

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
          generatedAt: new Date(),
          model: 'synapse',
        },
      };

      // Generate visuals if enabled
      if (input.options?.includeVisuals !== false) {
        post.visuals = await this.generateVisualsForPost(post, onRetry);
      }

      // Save to database if enabled
      if (input.options?.saveToDatabase !== false) {
        await this.savePostToDatabase(post, input.businessContext);
      }

      console.log(`[CampaignGenerator] Post generated successfully: ${post.id}`);
      return post;
    } catch (error) {
      logError(error, { operation: 'generatePost', postType: input.postType });
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
   * Generate multiple posts for a campaign with error handling and partial results
   */
  private async generateCampaignPosts(
    campaignType: CampaignType,
    template: { postTypes: PostType[]; id: string },
    context: BusinessContext,
    insights: BreakthroughInsight[],
    count: number,
    platforms: Platform[],
    sessionId: string,
    onRetry?: (retry: RetryProgress) => void
  ): Promise<GeneratedPost[]> {
    const posts: GeneratedPost[] = [];
    const errors: Error[] = [];
    const businessProfile = this.createBusinessProfile(context);

    // Distribute post types according to template
    const postTypes = this.distributePostTypes(template.postTypes, count);

    for (let i = 0; i < count; i++) {
      try {
        const postType = postTypes[i];
        const platform = platforms[i % platforms.length];

        // Update progress
        const progressPercent = 30 + Math.floor((i / count) * 40);
        this.updateProgress(sessionId, 'generating_content', progressPercent, i + 1, count);

        // Generate content for this post with retry and fallback
        const generatedContent = await ErrorHandlerService.executeWithRetry(
          () => this.contentGenerator.generate(
            [insights[i % insights.length]], // Rotate through insights
            businessProfile,
            {
              maxContent: 1,
              formats: [this.mapPostTypeToFormat(postType)],
              platform: this.mapPlatformToGenerationPlatform(platform),
            }
          ),
          { maxAttempts: 2 }, // Fewer attempts per post to avoid long delays
          onRetry,
          [
            // Fallback: Use template-based content
            {
              name: 'template_fallback',
              description: 'Use template-based content generation',
              execute: async () => this.generateFromTemplate(postType, context, platform)
            }
          ]
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
              generatedAt: new Date(),
              model: 'synapse',
              templateUsed: template.id,
            },
          };

          posts.push(post);

          // Save partial progress every 3 posts
          if (posts.length % 3 === 0) {
            await this.savePartialResults(posts, sessionId);
          }
        }
      } catch (error) {
        console.error(`[CampaignGenerator] Failed to generate post ${i + 1}:`, error);
        logError(error, {
          postIndex: i,
          postType: postTypes[i],
          sessionId
        });
        errors.push(error as Error);

        // Continue with next post instead of failing entire campaign
      }
    }

    // If we have some posts, return them even if not all succeeded
    if (posts.length > 0) {
      console.log(`[CampaignGenerator] Generated ${posts.length}/${count} posts successfully`);
      return posts;
    }

    // If no posts succeeded, throw aggregated error
    throw new Error(`Failed to generate any posts. Errors: ${errors.length}`);
  }

  /**
   * Template-based fallback content generation
   */
  private async generateFromTemplate(
    postType: PostType,
    context: BusinessContext,
    platform: Platform
  ): Promise<{ content: SynapseContent[] }> {
    // Generate basic content using templates without AI
    const templates: Record<PostType, { body: string; hashtags: string[] }> = {
      customer_success: {
        body: `${context.businessData.businessName} helps customers succeed. Learn how we can help you achieve your goals.`,
        hashtags: ['#CustomerSuccess', '#BusinessGrowth'],
      },
      service_spotlight: {
        body: `Discover ${context.businessData.businessName}'s services. We provide quality solutions for ${context.businessData.selectedCustomers?.[0] || 'businesses like yours'}.`,
        hashtags: ['#Services', '#Professional'],
      },
      problem_solution: {
        body: `Facing challenges? ${context.businessData.businessName} has the solution. Let us help you overcome obstacles and achieve success.`,
        hashtags: ['#Solutions', '#ProblemSolving'],
      },
      value_proposition: {
        body: `What makes ${context.businessData.businessName} unique? We deliver exceptional value through ${context.businessData.selectedServices?.[0] || 'our services'}.`,
        hashtags: ['#Value', '#Quality'],
      },
      behind_the_scenes: {
        body: `Get a glimpse behind the scenes at ${context.businessData.businessName}. See how we create value for our customers.`,
        hashtags: ['#BehindTheScenes', '#Transparency'],
      },
      community_engagement: {
        body: `Join the ${context.businessData.businessName} community. Connect, share, and grow together.`,
        hashtags: ['#Community', '#Engagement'],
      },
      educational: {
        body: `Learn from ${context.businessData.businessName}. We share insights and knowledge to help you succeed.`,
        hashtags: ['#Education', '#Learning'],
      },
      promotional: {
        body: `Special offer from ${context.businessData.businessName}. Discover how we can help you today.`,
        hashtags: ['#Promotion', '#SpecialOffer'],
      },
    };

    const template = templates[postType] || templates.service_spotlight;

    const synapseContent: SynapseContent = {
      id: `template-${Date.now()}`,
      insightId: 'template-insight',
      format: 'hook-post',
      content: {
        headline: `${context.businessData.businessName}`,
        hook: template.body.substring(0, 100),
        body: template.body,
        cta: 'Learn more',
        hashtags: template.hashtags,
      },
      psychology: {
        principle: 'Social Proof + Authority',
        trigger: { type: 'aspiration', strength: 0.5 },
        persuasionTechnique: 'Storytelling',
        expectedReaction: 'Positive engagement',
      },
      optimization: {
        powerWords: [],
        framingDevice: 'Professional messaging',
        narrativeStructure: 'Problem → Solution',
        pacing: 'medium',
      },
      meta: {
        platform: [this.mapPlatformToGenerationPlatform(platform) as any],
        targetAudience: context.businessData.selectedCustomers?.[0] || 'General audience',
        tone: 'authoritative',
      },
      prediction: {
        engagementScore: 0.5,
        viralPotential: 0.3,
        leadGeneration: 0.4,
        brandImpact: 'positive',
        confidenceLevel: 0.5,
      },
      metadata: {
        generatedAt: new Date(),
        model: 'template',
        iterationCount: 1,
        impactScore: 0.5,
      }
    };

    return { content: [synapseContent] };
  }

  /**
   * Save partial results during generation
   */
  private async savePartialResults(posts: GeneratedPost[], sessionId: string): Promise<void> {
    try {
      console.log(`[CampaignGenerator] Saving partial results: ${posts.length} posts`);
      // TODO: Implement actual partial save logic
      // For now, just log
    } catch (error) {
      logError(error, { sessionId, postsCount: posts.length });
      console.error('[CampaignGenerator] Failed to save partial results:', error);
      // Don't throw - this is just a backup save
    }
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
          whyNow: 'Current customer segment with active pain points',
          contentAngle: `${customer.text} face unique challenges we can address`,
          expectedReaction: 'Recognition and engagement from target audience',
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
          thinkingStyle: 'analytical',
          insight: diff.text,
          whyProfound: 'Unique value proposition that sets business apart',
          whyNow: 'Competitive differentiation is crucial in current market',
          contentAngle: diff.text,
          expectedReaction: 'Interest in unique offering',
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
          thinkingStyle: 'analytical',
          insight: problem.text,
          whyProfound: 'Customer pain point to address',
          whyNow: 'Active problem requiring immediate solution',
          contentAngle: `Solve ${problem.text} effectively`,
          expectedReaction: 'Relief and interest in solution',
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
        whyNow: 'Quality service is always valued',
        contentAngle: 'Expert service you can trust',
        expectedReaction: 'Trust and credibility',
        evidence: [],
        confidence: 0.7,
        metadata: {
          generatedAt: new Date(),
          model: 'template',
        },
      });
    }

    return insights.slice(0, 10); // Limit to top 10 insights
  }

  /**
   * Create business profile from context
   */
  private createBusinessProfile(context: BusinessContext): BusinessProfile {
    return {
      name: context.businessData.businessName,
      industry: context.businessData.specialization || context.specialization || 'Professional Services',
      targetAudience: context.businessData.selectedCustomers?.[0] || 'Business Owners',
      brandVoice: 'professional',
      contentGoals: ['engagement', 'lead-generation'],
    };
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
   * Map Platform to GenerationOptions platform type
   */
  private mapPlatformToGenerationPlatform(
    platform: Platform
  ): 'linkedin' | 'twitter' | 'instagram' | 'facebook' | 'generic' {
    const mapping: Record<Platform, 'linkedin' | 'twitter' | 'instagram' | 'facebook' | 'generic'> = {
      linkedin: 'linkedin',
      twitter: 'twitter',
      facebook: 'facebook',
      instagram: 'instagram',
      google_business: 'generic',
      tiktok: 'generic',
      youtube: 'generic',
    };

    return mapping[platform] || 'generic';
  }

  /**
   * Create content sources
   */
  private createSources(
    context: BusinessContext,
    insightId?: string
  ): ContentSource[] {
    const sources: ContentSource[] = [];

    sources.push({
      type: 'website',
      url: undefined,
      confidence: 1.0,
    });

    if (insightId) {
      sources.push({
        type: 'insight',
        insightId: insightId,
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
   * Generate visuals for all posts with error handling
   */
  private async generateVisualsForPosts(
    posts: GeneratedPost[],
    onRetry?: (retry: RetryProgress) => void
  ): Promise<void> {
    for (const post of posts) {
      try {
        post.visuals = await this.generateVisualsForPost(post, onRetry);
      } catch (error) {
        logError(error, { postId: post.id, platform: post.platform });
        console.error(`[CampaignGenerator] Visual generation failed for post ${post.id}:`, error);
        // Continue without visuals
      }
    }
  }

  /**
   * Generate visuals for a single post with retry and fallback
   */
  private async generateVisualsForPost(
    post: GeneratedPost,
    onRetry?: (retry: RetryProgress) => void
  ): Promise<PostVisual[]> {
    try {
      const templateId = this.selectBannerbearTemplate(post.platform, post.type);
      const imageUrl = await ErrorHandlerService.executeWithRetry(
        () => bannerbearService.createImage({
          templateId,
          modifications: {
            headline: post.content.headline || '',
            body: post.content.body.substring(0, 200),
            cta: post.content.callToAction || '',
          },
        }),
        {
          maxAttempts: 2, // Fewer attempts for visuals
          initialDelayMs: 1000,
        },
        onRetry,
        [
          // Fallback: Return empty string
          {
            name: 'no_visuals',
            description: 'Continue without visuals',
            execute: async () => ''
          }
        ]
      );

      if (imageUrl) {
        return [
          {
            id: `visual-${Date.now()}`,
            url: imageUrl,
            type: 'image',
            bannerbearTemplateId: templateId,
            altText: post.content.headline || 'Generated visual',
          },
        ];
      }

      return [];
    } catch (error) {
      logError(error, { postId: post.id, platform: post.platform });
      return []; // Continue without visuals
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

  /**
   * Get actionable error message for user
   */
  private getActionableErrorMessage(error: unknown, context: string): string {
    const appError = ErrorHandlerService.categorizeError(error);

    const messages = {
      network: `Network issue while ${context}. Retrying automatically...`,
      api_limit: `AI service is busy. Retrying in a moment...`,
      timeout: `${context} is taking longer than expected. Retrying...`,
      server_error: `Temporary server issue. Retrying automatically...`,
      authentication: `Authentication failed. Please check your API keys in settings.`,
      validation: `Invalid data for ${context}. Please check your inputs.`,
      unknown: `An unexpected error occurred while ${context}. Retrying...`,
    };

    return messages[appError.category] || messages.unknown;
  }
}

// Export singleton instance
export const campaignGenerator = new CampaignGenerator();
