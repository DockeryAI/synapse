/**
 * Campaign State Machine
 *
 * Manages campaign workflow state transitions with validation and persistence
 */

import type {
  CampaignState,
  CampaignStateTransition,
  CampaignSession,
  CampaignError,
  CampaignWorkflowEvent,
  CampaignEventHandler
} from '@/types/campaign-workflow.types';

// ============================================================================
// STATE TRANSITION RULES
// ============================================================================

const VALID_TRANSITIONS: Record<CampaignState, CampaignState[]> = {
  IDLE: ['TYPE_SELECTED', 'ERROR'],
  TYPE_SELECTED: ['CONTENT_SELECTED', 'ERROR'],
  CONTENT_SELECTED: ['GENERATING', 'TYPE_SELECTED', 'ERROR'], // Can go back to type selection
  GENERATING: ['PREVIEW', 'ERROR'],
  PREVIEW: ['APPROVED', 'CONTENT_SELECTED', 'GENERATING', 'ERROR'], // Can regenerate or re-select
  APPROVED: ['PUBLISHED', 'PREVIEW', 'ERROR'], // Can go back to preview
  PUBLISHED: ['IDLE'], // Reset to start new campaign
  ERROR: ['IDLE', 'TYPE_SELECTED', 'CONTENT_SELECTED', 'GENERATING', 'PREVIEW'] // Can recover from error
};

// ============================================================================
// STATE MACHINE CLASS
// ============================================================================

export class CampaignStateMachine {
  private eventHandlers: CampaignEventHandler[] = [];

  /**
   * Check if a state transition is valid
   */
  canTransition(from: CampaignState, to: CampaignState): boolean {
    const validTargets = VALID_TRANSITIONS[from];
    return validTargets.includes(to);
  }

  /**
   * Transition to a new state with validation
   */
  transition(
    session: CampaignSession,
    toState: CampaignState,
    metadata?: Record<string, any>
  ): CampaignSession {
    const fromState = session.state;

    // Validate transition
    if (!this.canTransition(fromState, toState)) {
      throw new Error(
        `Invalid state transition: ${fromState} → ${toState}. ` +
        `Valid transitions from ${fromState}: ${VALID_TRANSITIONS[fromState].join(', ')}`
      );
    }

    // Create transition record
    const transition: CampaignStateTransition = {
      from: fromState,
      to: toState,
      timestamp: new Date(),
      metadata
    };

    // Update session
    const updatedSession: CampaignSession = {
      ...session,
      state: toState,
      progress: this.calculateProgress(toState),
      history: [...session.history, transition],
      updatedAt: new Date(),
      ...(toState === 'ERROR' && metadata?.error && { error: metadata.error })
    };

    // Emit event
    this.emitEvent({
      type: 'STATE_CHANGED',
      sessionId: session.id,
      timestamp: new Date(),
      data: { fromState, toState, metadata }
    });

    // Save to localStorage for recovery
    this.saveSessionToStorage(updatedSession);

    console.log(`[CampaignState] ${fromState} → ${toState}`, metadata);

    return updatedSession;
  }

  /**
   * Calculate progress percentage based on state
   */
  private calculateProgress(state: CampaignState): number {
    const progressMap: Record<CampaignState, number> = {
      IDLE: 0,
      TYPE_SELECTED: 20,
      CONTENT_SELECTED: 40,
      GENERATING: 60,
      PREVIEW: 80,
      APPROVED: 90,
      PUBLISHED: 100,
      ERROR: -1 // Keep current progress on error
    };

    return progressMap[state];
  }

  /**
   * Handle errors and transition to ERROR state
   */
  handleError(
    session: CampaignSession,
    error: Partial<CampaignError>
  ): CampaignSession {
    const campaignError: CampaignError = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      timestamp: new Date(),
      recoverable: error.recoverable ?? true,
      retryCount: error.retryCount ?? 0,
      stack: error.stack
    };

    return this.transition(session, 'ERROR', { error: campaignError });
  }

  /**
   * Recover from error state
   */
  recoverFromError(
    session: CampaignSession,
    toState: CampaignState
  ): CampaignSession {
    if (session.state !== 'ERROR') {
      throw new Error('Can only recover from ERROR state');
    }

    if (!this.canTransition('ERROR', toState)) {
      throw new Error(`Cannot recover to state: ${toState}`);
    }

    return this.transition(session, toState, { recovered: true });
  }

  /**
   * Reset state machine to IDLE
   */
  reset(session: CampaignSession): CampaignSession {
    return {
      ...session,
      state: 'IDLE',
      progress: 0,
      selectedType: undefined,
      selectedInsights: undefined,
      selectedSmartPickId: undefined,
      generatedContent: undefined,
      error: undefined,
      history: [
        ...session.history,
        {
          from: session.state,
          to: 'IDLE',
          timestamp: new Date(),
          metadata: { reset: true }
        }
      ],
      updatedAt: new Date()
    };
  }

  /**
   * Get state history
   */
  getHistory(session: CampaignSession): CampaignStateTransition[] {
    return session.history;
  }

  /**
   * Get current state name with human-readable format
   */
  getStateName(state: CampaignState): string {
    const names: Record<CampaignState, string> = {
      IDLE: 'Ready to Start',
      TYPE_SELECTED: 'Campaign Type Selected',
      CONTENT_SELECTED: 'Content Selected',
      GENERATING: 'Generating Campaign',
      PREVIEW: 'Previewing Campaign',
      APPROVED: 'Campaign Approved',
      PUBLISHED: 'Campaign Published',
      ERROR: 'Error Occurred'
    };

    return names[state];
  }

  /**
   * Subscribe to state change events
   */
  on(handler: CampaignEventHandler): () => void {
    this.eventHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers = this.eventHandlers.filter(h => h !== handler);
    };
  }

  /**
   * Emit event to all subscribers
   */
  private emitEvent(event: CampaignWorkflowEvent): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('[CampaignState] Event handler error:', error);
      }
    });
  }

  /**
   * Save session to localStorage for recovery
   */
  private saveSessionToStorage(session: CampaignSession): void {
    try {
      const key = `campaign_session_${session.id}`;
      localStorage.setItem(key, JSON.stringify({
        ...session,
        // Don't save large context object
        context: undefined
      }));
    } catch (error) {
      console.warn('[CampaignState] Failed to save to localStorage:', error);
    }
  }

  /**
   * Load session from localStorage
   */
  loadSessionFromStorage(sessionId: string): CampaignSession | null {
    try {
      const key = `campaign_session_${sessionId}`;
      const data = localStorage.getItem(key);
      if (!data) return null;

      const session = JSON.parse(data);
      // Convert date strings back to Date objects
      session.createdAt = new Date(session.createdAt);
      session.updatedAt = new Date(session.updatedAt);
      session.history = session.history.map((t: any) => ({
        ...t,
        timestamp: new Date(t.timestamp)
      }));

      return session;
    } catch (error) {
      console.error('[CampaignState] Failed to load from localStorage:', error);
      return null;
    }
  }

  /**
   * Clear session from localStorage
   */
  clearSessionStorage(sessionId: string): void {
    try {
      const key = `campaign_session_${sessionId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('[CampaignState] Failed to clear localStorage:', error);
    }
  }
}

// Export singleton instance
export const campaignStateMachine = new CampaignStateMachine();
