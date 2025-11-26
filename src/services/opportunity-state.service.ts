/**
 * Opportunity State Service
 * Manages dismissed and snoozed opportunities in localStorage
 */

interface SnoozedOpportunity {
  id: string;
  snoozedUntil: number; // Timestamp
}

interface OpportunityState {
  dismissed: string[]; // Array of dismissed opportunity IDs
  snoozed: SnoozedOpportunity[];
}

const STATE_KEY = 'synapse_opportunity_state';

class OpportunityStateService {
  private state: OpportunityState = {
    dismissed: [],
    snoozed: [],
  };
  private initialized = false;

  /**
   * Initialize state from localStorage
   */
  private init(): void {
    if (this.initialized) return;

    try {
      const stored = localStorage.getItem(STATE_KEY);
      if (stored) {
        this.state = JSON.parse(stored);
        // Clean expired snoozes
        this.cleanExpiredSnoozes();
      }
      this.initialized = true;
    } catch (error) {
      console.warn('[OpportunityState] Failed to initialize:', error);
      this.state = { dismissed: [], snoozed: [] };
      this.initialized = true;
    }
  }

  /**
   * Persist state to localStorage
   */
  private persist(): void {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.warn('[OpportunityState] Failed to persist:', error);
    }
  }

  /**
   * Clean expired snoozes
   */
  private cleanExpiredSnoozes(): void {
    const now = Date.now();
    this.state.snoozed = this.state.snoozed.filter(s => s.snoozedUntil > now);
  }

  /**
   * Dismiss an opportunity permanently
   */
  dismiss(opportunityId: string): void {
    this.init();

    // Remove from snoozed if exists
    this.state.snoozed = this.state.snoozed.filter(s => s.id !== opportunityId);

    // Add to dismissed
    if (!this.state.dismissed.includes(opportunityId)) {
      this.state.dismissed.push(opportunityId);
    }

    this.persist();
  }

  /**
   * Snooze an opportunity for a duration
   * @param opportunityId - ID of opportunity to snooze
   * @param durationMs - Duration in milliseconds (default 24 hours)
   */
  snooze(opportunityId: string, durationMs: number = 24 * 60 * 60 * 1000): void {
    this.init();

    // Remove from dismissed if exists
    this.state.dismissed = this.state.dismissed.filter(id => id !== opportunityId);

    // Remove existing snooze if any
    this.state.snoozed = this.state.snoozed.filter(s => s.id !== opportunityId);

    // Add new snooze
    this.state.snoozed.push({
      id: opportunityId,
      snoozedUntil: Date.now() + durationMs,
    });

    this.persist();
  }

  /**
   * Restore a dismissed or snoozed opportunity
   */
  restore(opportunityId: string): void {
    this.init();

    this.state.dismissed = this.state.dismissed.filter(id => id !== opportunityId);
    this.state.snoozed = this.state.snoozed.filter(s => s.id !== opportunityId);

    this.persist();
  }

  /**
   * Check if opportunity is dismissed
   */
  isDismissed(opportunityId: string): boolean {
    this.init();
    return this.state.dismissed.includes(opportunityId);
  }

  /**
   * Check if opportunity is snoozed
   */
  isSnoozed(opportunityId: string): boolean {
    this.init();
    this.cleanExpiredSnoozes();

    return this.state.snoozed.some(s => s.id === opportunityId);
  }

  /**
   * Check if opportunity should be hidden (dismissed or snoozed)
   */
  isHidden(opportunityId: string): boolean {
    return this.isDismissed(opportunityId) || this.isSnoozed(opportunityId);
  }

  /**
   * Get snooze expiry time for an opportunity
   */
  getSnoozeExpiry(opportunityId: string): Date | null {
    this.init();
    const snoozed = this.state.snoozed.find(s => s.id === opportunityId);
    return snoozed ? new Date(snoozed.snoozedUntil) : null;
  }

  /**
   * Get all hidden opportunity IDs
   */
  getHiddenIds(): string[] {
    this.init();
    this.cleanExpiredSnoozes();

    return [
      ...this.state.dismissed,
      ...this.state.snoozed.map(s => s.id),
    ];
  }

  /**
   * Clear all dismissed and snoozed items
   */
  clearAll(): void {
    this.state = { dismissed: [], snoozed: [] };
    this.persist();
  }

  /**
   * Get state statistics
   */
  getStats(): { dismissedCount: number; snoozedCount: number } {
    this.init();
    this.cleanExpiredSnoozes();

    return {
      dismissedCount: this.state.dismissed.length,
      snoozedCount: this.state.snoozed.length,
    };
  }
}

export const opportunityStateService = new OpportunityStateService();
