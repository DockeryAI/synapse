/**
 * SynapseDataProvider - Stub Service
 *
 * Placeholder data provider for V4 content generation.
 * Stores triggers and context data for content generation.
 */

import type { ConsolidatedTrigger } from '../triggers/trigger-consolidation.service';

class SynapseDataProvider {
  private triggers: ConsolidatedTrigger[] = [];

  setTriggers(triggers: ConsolidatedTrigger[]) {
    this.triggers = triggers;
    console.log(`[SynapseDataProvider] Set ${triggers.length} triggers`);
  }

  getTriggers(): ConsolidatedTrigger[] {
    return this.triggers;
  }

  clear() {
    this.triggers = [];
  }
}

export const synapseDataProvider = new SynapseDataProvider();
