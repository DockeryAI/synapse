/**
 * Campaign Orchestrator
 *
 * Main coordination layer that integrates:
 * - Campaign Type Selector → Smart Picks/Content Mixer → Content Generation → Preview → Approval → Publishing
 *
 * This is the "glue" that connects all Week 1 components into a complete workflow
 */

import { campaignWorkflow } from './CampaignWorkflow';
import { campaignStateMachine } from './CampaignState';
import { ErrorHandlerService, logError } from '../errors/error-handler.service';
import type {
  CampaignSession,
  CampaignType,
  CampaignWorkflowEvent,
  CampaignEventHandler
} from '@/types/campaign-workflow.types';
import type { DeepContext } from '@/types/synapse/deepContext.types';
import type { BreakthroughInsight } from '@/types/synapse/breakthrough.types';

// ============================================================================
// ORCHESTRATOR INTERFACE
// ============================================================================

export interface CampaignOrchestratorConfig {
  onStateChange?: (session: CampaignSession) => void;
  onError?: (error: Error, session: CampaignSession) => void;
  onProgress?: (progress: number, session: CampaignSession) => void;
}

// ============================================================================
// CAMPAIGN ORCHESTRATOR
// ============================================================================

export class CampaignOrchestrator {
  private currentSessionId?: string;
  private config: CampaignOrchestratorConfig;
  private eventUnsubscribe?: () => void;

  constructor(config: CampaignOrchestratorConfig = {}) {
    this.config = config;
    this.log('CampaignOrchestrator initialized');
  }

  // ============================================================================
  // WORKFLOW METHODS
  // ============================================================================

  /**
   * Step 1: Initialize campaign with DeepContext
   */
  async initialize(params: {
    businessId: string;
    context: DeepContext;
  }): Promise<CampaignSession> {
    this.log('Initializing campaign for business:', params.businessId);

    try {
      // Start new campaign session
      const session = await campaignWorkflow.startCampaign(params);
      this.currentSessionId = session.id;

      // Subscribe to state changes
      this.subscribeToStateChanges();

      this.log('Campaign initialized:', session.id);
      this.notifyStateChange(session);

      return session;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Step 2: User selects campaign type (or AI recommends)
   */
  selectCampaignType(campaignType: CampaignType): CampaignSession {
    this.log('Selecting campaign type:', campaignType);

    try {
      const session = campaignWorkflow.selectCampaignType(
        this.requireSessionId(),
        campaignType
      );

      this.notifyStateChange(session);
      this.notifyProgress(session);

      return session;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Step 3a: User selects a Smart Pick (AI-recommended campaign)
   */
  selectSmartPick(params: {
    smartPickId: string;
    insights: BreakthroughInsight[];
  }): CampaignSession {
    this.log('Selecting Smart Pick:', params.smartPickId);

    try {
      const session = campaignWorkflow.selectSmartPick(
        this.requireSessionId(),
        params.smartPickId,
        params.insights
      );

      this.notifyStateChange(session);
      this.notifyProgress(session);

      return session;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Step 3b: User selects custom insights (Content Mixer)
   */
  selectCustomInsights(insights: BreakthroughInsight[]): CampaignSession {
    this.log('Selecting custom insights:', insights.length);

    try {
      const session = campaignWorkflow.selectCustomInsights(
        this.requireSessionId(),
        insights
      );

      this.notifyStateChange(session);
      this.notifyProgress(session);

      return session;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Step 4: Generate campaign content
   */
  async generateCampaign(): Promise<CampaignSession> {
    this.log('Generating campaign content');

    try {
      const session = await ErrorHandlerService.executeWithRetry(
        () => campaignWorkflow.generateCampaign(this.requireSessionId()),
        { maxAttempts: 3 }
      );

      this.notifyStateChange(session);
      this.notifyProgress(session);

      return session;
    } catch (error) {
      logError(error, { sessionId: this.currentSessionId, operation: 'generateCampaign' });
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Step 4b: Regenerate specific sections (called from Preview)
   *
   * NOTE: This will integrate with content generation services
   * Placeholder for now
   */
  async regenerateSection(params: {
    platform: string;
    section: 'headline' | 'hook' | 'body' | 'cta';
  }): Promise<CampaignSession> {
    this.log('Regenerating section:', params);

    try {
      // TODO: Integrate with actual content generators
      // For now, just return current session
      const session = campaignWorkflow.getSession(this.requireSessionId());

      this.log('Section regeneration not yet implemented');
      return session;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Step 5: Approve campaign
   */
  async approveCampaign(): Promise<CampaignSession> {
    this.log('Approving campaign');

    try {
      const session = await campaignWorkflow.approveCampaign(this.requireSessionId());

      this.notifyStateChange(session);
      this.notifyProgress(session);

      return session;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Step 6: Publish to platforms
   */
  async publishCampaign(platforms: string[]): Promise<CampaignSession> {
    this.log('Publishing campaign to platforms:', platforms);

    try {
      const session = await ErrorHandlerService.executeWithRetry(
        () => campaignWorkflow.publishCampaign(this.requireSessionId(), platforms),
        { maxAttempts: 2 }, // Fewer retries for publishing
      );

      this.notifyStateChange(session);
      this.notifyProgress(session);

      return session;
    } catch (error) {
      logError(error, { sessionId: this.currentSessionId, platforms, operation: 'publishCampaign' });
      this.handleError(error);
      throw error;
    }
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  /**
   * Get current session
   */
  getCurrentSession(): CampaignSession | null {
    if (!this.currentSessionId) {
      return null;
    }

    try {
      return campaignWorkflow.getSession(this.currentSessionId);
    } catch {
      return null;
    }
  }

  /**
   * Resume an existing session
   */
  resumeSession(sessionId: string): CampaignSession {
    this.log('Resuming session:', sessionId);

    const session = campaignWorkflow.getSession(sessionId);
    this.currentSessionId = sessionId;
    this.subscribeToStateChanges();

    return session;
  }

  /**
   * Reset current session to start over
   */
  resetSession(): CampaignSession {
    this.log('Resetting session');

    const session = campaignWorkflow.resetSession(this.requireSessionId());
    this.notifyStateChange(session);
    this.notifyProgress(session);

    return session;
  }

  /**
   * End current session
   */
  endSession(): void {
    this.log('Ending session');

    if (this.currentSessionId) {
      campaignWorkflow.deleteSession(this.currentSessionId);
      this.currentSessionId = undefined;
    }

    if (this.eventUnsubscribe) {
      this.eventUnsubscribe();
      this.eventUnsubscribe = undefined;
    }
  }

  // ============================================================================
  // ERROR HANDLING & RECOVERY
  // ============================================================================

  /**
   * Handle errors with recovery options
   */
  private handleError(error: unknown): void {
    const err = error instanceof Error ? error : new Error(String(error));
    this.log('Error occurred:', err.message);

    if (this.config.onError && this.currentSessionId) {
      try {
        const session = campaignWorkflow.getSession(this.currentSessionId);
        this.config.onError(err, session);
      } catch {
        this.config.onError(err, {} as CampaignSession);
      }
    }
  }

  /**
   * Recover from error state
   */
  recoverFromError(targetState: 'TYPE_SELECTED' | 'CONTENT_SELECTED' | 'GENERATING' | 'PREVIEW'): CampaignSession {
    this.log('Recovering from error to state:', targetState);

    const session = campaignWorkflow.getSession(this.requireSessionId());
    const recoveredSession = campaignStateMachine.recoverFromError(session, targetState);

    this.notifyStateChange(recoveredSession);
    return recoveredSession;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Subscribe to state changes (public method for components)
   */
  onStateChange(callback: (session: CampaignSession) => void): () => void {
    this.config.onStateChange = callback;
    return () => {
      this.config.onStateChange = undefined;
    };
  }

  /**
   * Subscribe to progress updates (public method for components)
   */
  onProgress(callback: (progress: number, session: CampaignSession) => void): () => void {
    this.config.onProgress = callback;
    return () => {
      this.config.onProgress = undefined;
    };
  }

  /**
   * Require session ID or throw
   */
  private requireSessionId(): string {
    if (!this.currentSessionId) {
      throw new Error('No active campaign session. Call initialize() first.');
    }
    return this.currentSessionId;
  }

  /**
   * Subscribe to state change events
   */
  private subscribeToStateChanges(): void {
    // Unsubscribe from previous
    if (this.eventUnsubscribe) {
      this.eventUnsubscribe();
    }

    // Subscribe to new events
    const handler: CampaignEventHandler = (event: CampaignWorkflowEvent) => {
      if (event.sessionId === this.currentSessionId) {
        this.log('Workflow event:', event.type);

        if (event.type === 'STATE_CHANGED' && this.config.onStateChange) {
          try {
            const session = campaignWorkflow.getSession(this.currentSessionId!);
            this.config.onStateChange(session);
          } catch (error) {
            this.log('Error in state change handler:', error);
          }
        }

        if (event.type === 'PROGRESS_UPDATED' && this.config.onProgress) {
          try {
            const session = campaignWorkflow.getSession(this.currentSessionId!);
            this.config.onProgress(session.progress, session);
          } catch (error) {
            this.log('Error in progress handler:', error);
          }
        }
      }
    };

    this.eventUnsubscribe = campaignStateMachine.on(handler);
  }

  /**
   * Notify state change
   */
  private notifyStateChange(session: CampaignSession): void {
    if (this.config.onStateChange) {
      this.config.onStateChange(session);
    }
  }

  /**
   * Notify progress update
   */
  private notifyProgress(session: CampaignSession): void {
    if (this.config.onProgress) {
      this.config.onProgress(session.progress, session);
    }
  }

  /**
   * Log messages
   */
  private log(...args: any[]): void {
    console.log('[CampaignOrchestrator]', ...args);
  }
}

// Export singleton instance
export const campaignOrchestrator = new CampaignOrchestrator();
