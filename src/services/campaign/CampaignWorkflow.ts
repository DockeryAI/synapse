/**
 * Campaign Workflow Service
 *
 * Manages the campaign generation workflow with methods for each step
 */

import { v4 as uuidv4 } from 'uuid';
import { campaignStateMachine } from './CampaignState';
import { campaignDB } from './CampaignDB';
import { PremiumContentWriter } from '../synapse/generation/formats/PremiumContentWriter';
import { campaignGenerator } from './CampaignGenerator';
import type {
  CampaignSession,
  CampaignType,
  GeneratedCampaignContent,
  PlatformContent,
  WorkflowConfig
} from '@/types/campaign-workflow.types';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import type { BreakthroughInsight } from '@/types/synapse/breakthrough.types';
import type { SynapseInsight } from '@/types/synapse/synapse.types';
import type { BusinessProfile } from '@/types/synapseContent.types';
import type { CampaignGenerationInput } from '@/types/campaign-generation.types';

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: WorkflowConfig = {
  autoSave: true,
  autoSaveInterval: 30000, // 30 seconds
  retryAttempts: 3,
  timeoutMs: 120000, // 2 minutes
  enableLogging: true
};

// ============================================================================
// WORKFLOW SERVICE
// ============================================================================

export class CampaignWorkflowService {
  private sessions: Map<string, CampaignSession> = new Map();
  private config: WorkflowConfig;
  private autoSaveIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: Partial<WorkflowConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.log('CampaignWorkflow initialized');
  }

  /**
   * Start a new campaign session
   */
  async startCampaign(params: {
    businessId: string;
    context: DeepContext;
  }): Promise<CampaignSession> {
    this.log('Starting new campaign for business:', params.businessId);

    const session: CampaignSession = {
      id: uuidv4(),
      businessId: params.businessId,
      state: 'IDLE',
      progress: 0,
      context: params.context,
      history: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.sessions.set(session.id, session);

    // Start auto-save if enabled
    if (this.config.autoSave) {
      this.startAutoSave(session.id);
    }

    this.log('Campaign session created:', session.id);
    return session;
  }

  /**
   * Select campaign type
   */
  selectCampaignType(
    sessionId: string,
    campaignType: CampaignType
  ): CampaignSession {
    this.log('Selecting campaign type:', campaignType);

    const session = this.getSession(sessionId);

    // Transition to TYPE_SELECTED state
    const updatedSession = campaignStateMachine.transition(
      session,
      'TYPE_SELECTED',
      { campaignType }
    );

    // Update session data
    updatedSession.selectedType = campaignType;

    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  /**
   * Select a Smart Pick
   */
  selectSmartPick(
    sessionId: string,
    smartPickId: string,
    insights: BreakthroughInsight[]
  ): CampaignSession {
    this.log('Selecting Smart Pick:', smartPickId);

    const session = this.getSession(sessionId);

    // Must have type selected first
    if (!session.selectedType) {
      throw new Error('Campaign type must be selected before choosing content');
    }

    // Transition to CONTENT_SELECTED state
    const updatedSession = campaignStateMachine.transition(
      session,
      'CONTENT_SELECTED',
      { smartPickId, insightCount: insights.length }
    );

    // Update session data
    updatedSession.selectedSmartPickId = smartPickId;
    updatedSession.selectedInsights = insights;

    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  /**
   * Select custom insights (Content Mixer)
   */
  selectCustomInsights(
    sessionId: string,
    insights: BreakthroughInsight[]
  ): CampaignSession {
    this.log('Selecting custom insights:', insights.length);

    const session = this.getSession(sessionId);

    // Must have type selected first
    if (!session.selectedType) {
      throw new Error('Campaign type must be selected before choosing content');
    }

    // Transition to CONTENT_SELECTED state
    const updatedSession = campaignStateMachine.transition(
      session,
      'CONTENT_SELECTED',
      { insightCount: insights.length, custom: true }
    );

    // Update session data
    updatedSession.selectedInsights = insights;

    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  /**
   * Generate campaign content
   *
   * NOTE: Actual content generation will be implemented by the content generator services
   * This is a placeholder that returns mock data for testing the workflow
   */
  async generateCampaign(sessionId: string): Promise<CampaignSession> {
    this.log('Generating campaign content');

    const session = this.getSession(sessionId);

    // Must have content selected
    if (!session.selectedInsights || session.selectedInsights.length === 0) {
      throw new Error('Insights must be selected before generating campaign');
    }

    try {
      // Transition to GENERATING state
      let updatedSession = campaignStateMachine.transition(session, 'GENERATING');
      this.sessions.set(sessionId, updatedSession);

      // Generate real content using CampaignGenerator
      const input: CampaignGenerationInput = {
        campaignId: sessionId,
        campaignType: session.selectedType! as any, // Campaign types differ between workflow and generation
        businessContext: {
          businessData: session.context.business?.profile as any, // Access from business context
          uvpData: session.context.synthesis as any, // Use synthesis data as UVP
          websiteAnalysis: null,
          specialization: session.context.business?.profile?.industry,
        },
        options: {
          postsPerCampaign: 7,
          platforms: ['linkedin', 'facebook'],
          includeVisuals: true,
          saveToDatabase: true,
        },
      };

      const generatedCampaign = await campaignGenerator.generateCampaign(input);

      // Convert GeneratedCampaign to GeneratedCampaignContent for session
      const generatedContent: GeneratedCampaignContent = {
        campaignName: generatedCampaign.name,
        posts: generatedCampaign.posts.map((post) => ({
          id: post.id,
          platform: post.platform,
          content: {
            headline: post.content.headline || '',
            body: post.content.body,
            hashtags: post.content.hashtags,
            cta: post.content.callToAction || '',
          },
          visuals: post.visuals,
          scheduledDate: post.scheduledFor ? new Date(post.scheduledFor) : undefined,
          status: post.status,
        })),
        metadata: {
          totalPosts: generatedCampaign.totalPosts,
          generatedAt: generatedCampaign.createdAt.toISOString(),
          confidence: generatedCampaign.metadata.confidence,
        },
      };

      // Transition to PREVIEW state
      updatedSession = campaignStateMachine.transition(
        updatedSession,
        'PREVIEW',
        { contentGenerated: true }
      );

      // Update session with generated content
      updatedSession.generatedContent = generatedContent;

      this.sessions.set(sessionId, updatedSession);

      // Save to database
      if (this.config.autoSave) {
        await this.saveCampaignToDB(updatedSession);
      }

      this.log('Campaign content generated successfully');
      return updatedSession;
    } catch (error) {
      this.log('Error generating campaign:', error);

      const errorSession = campaignStateMachine.handleError(session, {
        code: 'CONTENT_GENERATION_FAILED',
        message: error instanceof Error ? error.message : 'Content generation failed',
        recoverable: true
      });

      this.sessions.set(sessionId, errorSession);
      throw error;
    }
  }

  /**
   * Approve campaign
   */
  async approveCampaign(sessionId: string): Promise<CampaignSession> {
    this.log('Approving campaign');

    const session = this.getSession(sessionId);

    if (!session.generatedContent) {
      throw new Error('Campaign must be generated before approval');
    }

    try {
      // Transition to APPROVED state
      const updatedSession = campaignStateMachine.transition(session, 'APPROVED');

      this.sessions.set(sessionId, updatedSession);

      // Save to database and mark as approved
      const campaignRecord = await this.saveCampaignToDB(updatedSession);
      if (campaignRecord) {
        await campaignDB.approveCampaign(campaignRecord.id);
      }

      this.log('Campaign approved successfully');
      return updatedSession;
    } catch (error) {
      this.log('Error approving campaign:', error);

      const errorSession = campaignStateMachine.handleError(session, {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to approve campaign',
        recoverable: true
      });

      this.sessions.set(sessionId, errorSession);
      throw error;
    }
  }

  /**
   * Publish campaign to platforms
   *
   * NOTE: Actual publishing will integrate with SocialPilot or other platforms
   * This is a placeholder for the workflow
   */
  async publishCampaign(
    sessionId: string,
    platforms: string[]
  ): Promise<CampaignSession> {
    this.log('Publishing campaign to platforms:', platforms);

    const session = this.getSession(sessionId);

    if (session.state !== 'APPROVED') {
      throw new Error('Campaign must be approved before publishing');
    }

    try {
      // TODO: Integrate with actual publishing service (SocialPilot, etc.)
      this.log('Publishing not yet implemented - placeholder only');

      // Transition to PUBLISHED state
      const updatedSession = campaignStateMachine.transition(session, 'PUBLISHED', {
        platforms,
        publishedAt: new Date()
      });

      this.sessions.set(sessionId, updatedSession);

      // Stop auto-save
      this.stopAutoSave(sessionId);

      this.log('Campaign published successfully');
      return updatedSession;
    } catch (error) {
      this.log('Error publishing campaign:', error);

      const errorSession = campaignStateMachine.handleError(session, {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to publish campaign',
        recoverable: true
      });

      this.sessions.set(sessionId, errorSession);
      throw error;
    }
  }

  /**
   * Get current session
   */
  getSession(sessionId: string): CampaignSession {
    const session = this.sessions.get(sessionId);

    if (!session) {
      // Try to load from localStorage
      const storedSession = campaignStateMachine.loadSessionFromStorage(sessionId);
      if (storedSession) {
        this.sessions.set(sessionId, storedSession);
        return storedSession;
      }

      throw new Error(`Campaign session not found: ${sessionId}`);
    }

    return session;
  }

  /**
   * Reset session to start over
   */
  resetSession(sessionId: string): CampaignSession {
    this.log('Resetting session:', sessionId);

    const session = this.getSession(sessionId);
    const resetSession = campaignStateMachine.reset(session);

    this.sessions.set(sessionId, resetSession);
    return resetSession;
  }

  /**
   * Delete session
   */
  deleteSession(sessionId: string): void {
    this.log('Deleting session:', sessionId);

    this.stopAutoSave(sessionId);
    this.sessions.delete(sessionId);
    campaignStateMachine.clearSessionStorage(sessionId);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Generate mock content for testing
   * TODO: Replace with actual content generation service calls
   */
  private async generateMockContent(
    campaignType: CampaignType,
    insights: BreakthroughInsight[],
    context?: DeepContext
  ): Promise<GeneratedCampaignContent> {
    // Use real content generation with PremiumContentWriter
    const contentWriter = new PremiumContentWriter();

    // Extract business profile from context
    const businessProfile: BusinessProfile = context ? {
      name: context.business.profile.name,
      industry: context.business.profile.industry,
      targetAudience: 'General public',
      brandVoice: 'professional',
      contentGoals: ['engagement', 'brand-awareness']
    } : {
      name: 'Demo Business',
      industry: 'Professional Services',
      targetAudience: 'General public',
      brandVoice: 'professional',
      contentGoals: ['engagement', 'brand-awareness']
    };

    // Select primary insight (first one or highest confidence)
    const primaryInsight = insights.length > 0 ?
      insights.reduce((prev, current) =>
        (current.confidence > prev.confidence) ? current : prev
      ) : {
        id: 'fallback-insight',
        type: 'differentiator',
        thinkingStyle: 'analytical',
        insight: 'Industry expertise and thought leadership',
        whyProfound: 'Deep industry knowledge sets apart from competitors',
        whyNow: 'Timeliness: Immediate demonstration of expertise',
        contentAngle: 'Position as thought leader in your industry',
        expectedReaction: 'Build trust and credibility',
        evidence: ['Industry leadership', 'Proven track record'],
        confidence: 0.7,
        metadata: {
          generatedAt: new Date(),
          model: 'fallback',
        }
      } as SynapseInsight;

    // Define platforms to generate content for
    const platformsToGenerate: Array<'linkedin' | 'facebook' | 'instagram' | 'twitter'> = [
      'linkedin',
      'facebook',
      'instagram',
      'twitter'
    ];

    // Generate content for each platform in parallel
    const platformContentPromises = platformsToGenerate.map(async (platform) => {
      try {
        const content = await contentWriter.generatePremiumContent(
          primaryInsight,
          businessProfile,
          platform
        );

        const fullText = `${content.headline}\n\n${content.hook}\n\n${content.body}\n\n${content.cta}`;
        const characterCount = fullText.length;

        return {
          platform,
          content,
          characterCount
        };
      } catch (error) {
        this.log(`Error generating content for ${platform}:`, error);
        // Fallback to basic content if generation fails
        return {
          platform,
          content: {
            headline: `${campaignType} Campaign - ${platform}`,
            hook: primaryInsight.insight,
            body: 'Generated body content based on your business insights and industry expertise.',
            cta: 'Learn more',
            hashtags: ['business', 'growth']
          },
          characterCount: 200
        };
      }
    });

    const platforms = await Promise.all(platformContentPromises);

    return {
      campaignId: uuidv4(),
      campaignType,
      platforms: platforms as PlatformContent[],
      metadata: {
        insightsUsed: insights.map(i => i.id),
        generatedAt: new Date(),
        model: 'claude-sonnet-4.5',
        confidence: primaryInsight.confidence
      }
    };
  }

  /**
   * Save campaign to database
   */
  private async saveCampaignToDB(session: CampaignSession) {
    if (!session.generatedContent) return null;

    try {
      const campaign = await campaignDB.saveDraft({
        businessId: session.businessId,
        campaignName: `${session.selectedType} Campaign - ${new Date().toLocaleDateString()}`,
        campaignType: session.selectedType!,
        contentData: session.generatedContent,
        goals: {
          type: session.selectedType,
          insightCount: session.selectedInsights?.length || 0
        }
      });

      // Save individual content pieces
      await campaignDB.saveContentPieces(
        campaign.id,
        session.businessId,
        session.generatedContent
      );

      return campaign;
    } catch (error) {
      this.log('Error saving to database:', error);
      return null;
    }
  }

  /**
   * Start auto-save interval
   */
  private startAutoSave(sessionId: string): void {
    const interval = setInterval(() => {
      const session = this.sessions.get(sessionId);
      if (session) {
        this.saveCampaignToDB(session).catch(err =>
          this.log('Auto-save error:', err)
        );
      }
    }, this.config.autoSaveInterval);

    this.autoSaveIntervals.set(sessionId, interval);
  }

  /**
   * Stop auto-save interval
   */
  private stopAutoSave(sessionId: string): void {
    const interval = this.autoSaveIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.autoSaveIntervals.delete(sessionId);
    }
  }

  /**
   * Log if logging is enabled
   */
  private log(...args: any[]): void {
    if (this.config.enableLogging) {
      console.log('[CampaignWorkflow]', ...args);
    }
  }
}

// Export singleton instance
export const campaignWorkflow = new CampaignWorkflowService();
