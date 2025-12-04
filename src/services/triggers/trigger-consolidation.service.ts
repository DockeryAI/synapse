// PRD Feature: SYNAPSE-V6
// Trigger consolidation service - V6 simplified implementation

export interface ConsolidatedTrigger {
  id: string;
  text: string;
  category: TriggerCategory;
  strength: number; // 0-100
  evidence: EvidenceItem[];
  sources: string[];
  title?: string;           // V5 compatibility - trigger title
  executiveSummary?: string; // V5 compatibility - executive summary
}

export type TriggerCategory =
  | 'pain'
  | 'desire'
  | 'fear'
  | 'urgency'
  | 'trust'
  | 'authority'
  | 'social_proof'
  | 'scarcity'
  | 'curiosity'
  | 'convenience'
  | 'value'
  | 'status'
  | 'pain-point'   // V5 compatibility
  | 'objection'    // V5 compatibility
  | 'motivation';  // V5 compatibility

export interface EvidenceItem {
  id: string;
  text: string;
  source: string;
  confidence: number; // 0-1
  type: 'quote' | 'data' | 'observation';
  quote?: string;     // V5 compatibility - alternate quote text
  platform?: string;  // V5 compatibility - source platform
  url?: string;       // V5 compatibility - source URL
}

export interface ConsolidationResult {
  triggers: ConsolidatedTrigger[];
  totalEvidence: number;
  confidenceScore: number;
  consolidatedAt: string;
}

class TriggerConsolidationService {
  async consolidateTriggers(rawTriggers: any[]): Promise<ConsolidationResult> {
    // V6 simplified implementation - returns placeholder data
    const triggers: ConsolidatedTrigger[] = [
      {
        id: 'trigger-1',
        text: 'Need for reliable solutions',
        category: 'pain',
        strength: 85,
        evidence: [],
        sources: ['reddit', 'surveys']
      },
      {
        id: 'trigger-2',
        text: 'Trust in proven providers',
        category: 'trust',
        strength: 90,
        evidence: [],
        sources: ['reviews', 'testimonials']
      }
    ];

    return {
      triggers,
      totalEvidence: triggers.reduce((sum, t) => sum + t.evidence.length, 0),
      confidenceScore: 0.87,
      consolidatedAt: new Date().toISOString()
    };
  }

  async categorizeTrigger(trigger: string): Promise<TriggerCategory> {
    // V6 simplified categorization
    if (trigger.toLowerCase().includes('pain') || trigger.toLowerCase().includes('problem')) {
      return 'pain';
    }
    if (trigger.toLowerCase().includes('trust') || trigger.toLowerCase().includes('reliable')) {
      return 'trust';
    }
    return 'value'; // default
  }
}

export const triggerConsolidationService = new TriggerConsolidationService();
