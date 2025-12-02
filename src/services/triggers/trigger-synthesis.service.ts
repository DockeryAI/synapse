/**
 * Trigger Synthesis Service - Triggers V5 Simplified
 *
 * CONSOLIDATES: llm-trigger-synthesizer, trigger-consolidation, source-quality, category-balancing
 *
 * V1-STYLE PROVENANCE:
 * - Single Claude call per pass
 * - Required 2+ sample IDs per trigger
 * - Verbatim quote required
 * - Reasoning required
 * - NO post-hoc source lookup (prevents hallucination)
 * - Source count as only "confidence" metric
 *
 * MULTI-PASS ARCHITECTURE:
 * Pass 1: Pain + Fear (6-10 triggers)
 * Pass 2: Desire + Motivation (6-10 triggers)
 * Pass 3: Objection + Trust (6-10 triggers)
 * Pass 4: Competitor mentions (4-8 triggers)
 *
 * Created: 2025-12-02
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { BusinessProfileType } from './profile-detection.service';
import type { ConsolidatedTrigger, TriggerCategory, EvidenceItem } from './trigger-consolidation.service';
import { sourcePreservationService } from './source-preservation.service';

// ============================================================================
// TYPES
// ============================================================================

export type PassType = 'pain-fear' | 'desire-motivation' | 'objection-trust' | 'competitor';

export interface RawDataSample {
  id: string;
  content: string;
  source: string;
  platform: string;
  url?: string;
  author?: string;
  sourceTitle?: string;
  competitorName?: string;
  timestamp?: string;
  engagement?: number;
}

export interface BrandProfile {
  uvp: CompleteUVP;
  profileType: BusinessProfileType;
  brandName?: string;
  industry?: string;
}

export interface PassResult {
  passType: PassType;
  triggers: ConsolidatedTrigger[];
  duration: number;
  sampleCount: number;
}

export interface MultiPassResult {
  triggers: ConsolidatedTrigger[];
  passSummary: PassResult[];
  totalDuration: number;
  deduplicatedCount: number;
}

/** V1-style LLM output - with required provenance fields */
interface V1TriggerOutput {
  title: string;
  category: TriggerCategory;
  sampleIds: number[];      // REQUIRED: 2+ sample indices
  verbatimQuote: string;    // REQUIRED: exact quote from sample
  reasoning: string;        // REQUIRED: why these samples support this
}

// ============================================================================
// PASS CONFIGURATION
// ============================================================================

interface PassConfig {
  categories: TriggerCategory[];
  filterKeywords: string[];
  promptFocus: string;
  targetCount: { min: number; max: number };
}

const PASS_CONFIGS: Record<PassType, PassConfig> = {
  'pain-fear': {
    categories: ['pain-point', 'fear'],
    filterKeywords: [
      'frustrated', 'hate', 'problem', 'issue', 'struggle', 'broken', 'failing',
      'afraid', 'worried', 'scared', 'anxious', 'terrified', 'risk', 'danger',
      'nightmare', 'disaster', 'losing', 'waste', 'difficult', 'stuck'
    ],
    promptFocus: 'Find pain points and fears - what frustrates them, what keeps them up at night',
    targetCount: { min: 6, max: 10 }
  },
  'desire-motivation': {
    categories: ['desire', 'motivation'],
    filterKeywords: [
      'want', 'wish', 'hope', 'need', 'looking for', 'dream', 'goal',
      'excited', 'ready', 'opportunity', 'grow', 'improve', 'better',
      'achieve', 'success', 'finally', 'transform', 'upgrade'
    ],
    promptFocus: 'Find desires and motivations - what they want, what drives them to act',
    targetCount: { min: 6, max: 10 }
  },
  'objection-trust': {
    categories: ['objection', 'trust'],
    filterKeywords: [
      'expensive', 'cost', 'price', 'budget', 'doubt', 'skeptic', 'not sure',
      'tried before', 'didnt work', 'trust', 'reliable', 'proven', 'guarantee',
      'reviews', 'reputation', 'safe', 'secure', 'too', 'complicated'
    ],
    promptFocus: 'Find objections and trust concerns - what makes them hesitate, what proof they need',
    targetCount: { min: 6, max: 10 }
  },
  'competitor': {
    categories: ['pain-point', 'desire', 'objection'],
    filterKeywords: [
      'competitor', 'alternative', 'switch', 'migrate', 'vs', 'versus',
      'compared to', 'better than', 'worse than', 'moved from', 'left'
    ],
    promptFocus: 'Find competitor mentions - why they switched, what they compare against',
    targetCount: { min: 4, max: 8 }
  }
};

// ============================================================================
// PROFILE-SPECIFIC SOURCE TIERS (simplified from source-quality.service.ts)
// ============================================================================

const PROFILE_SOURCE_TIERS: Record<BusinessProfileType, { tier1: string[]; tier2: string[] }> = {
  'local-service-b2b': {
    tier1: ['google reviews', 'linkedin', 'bbb'],
    tier2: ['reddit', 'yelp', 'facebook']
  },
  'local-service-b2c': {
    tier1: ['google reviews', 'yelp', 'facebook'],
    tier2: ['nextdoor', 'reddit', 'instagram']
  },
  'regional-b2b-agency': {
    tier1: ['linkedin', 'clutch', 'g2'],
    tier2: ['reddit', 'twitter', 'glassdoor']
  },
  'regional-retail-b2c': {
    tier1: ['google reviews', 'instagram', 'facebook'],
    tier2: ['reddit', 'tiktok', 'local news']
  },
  'national-saas-b2b': {
    tier1: ['g2', 'capterra', 'hackernews', 'gartner'],
    tier2: ['reddit', 'productHunt', 'twitter']
  },
  'national-product-b2c': {
    tier1: ['amazon reviews', 'reddit', 'youtube'],
    tier2: ['tiktok', 'trustpilot', 'instagram']
  },
  'global-saas-b2b': {
    tier1: ['gartner', 'forrester', 'g2'],
    tier2: ['linkedin', 'reddit', 'hackernews']
  }
};

// ============================================================================
// SERVICE
// ============================================================================

class TriggerSynthesisService {
  private endpoint: string;
  private apiKey: string;

  constructor() {
    this.endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`;
    this.apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  }

  /**
   * Run a single synthesis pass
   *
   * V1-STYLE: Single Claude call with hard provenance constraints
   */
  async generateTriggers(
    brandProfile: BrandProfile,
    rawSamples: RawDataSample[],
    passType: PassType
  ): Promise<PassResult> {
    const startTime = performance.now();
    const config = PASS_CONFIGS[passType];

    console.log(`[TriggerSynthesis] Starting ${passType} pass with ${rawSamples.length} samples`);

    // Pre-filter samples by pass keywords
    const filteredSamples = this.filterSamplesByPass(rawSamples, passType);
    console.log(`[TriggerSynthesis] Filtered to ${filteredSamples.length} relevant samples for ${passType}`);

    if (filteredSamples.length < 5) {
      console.warn(`[TriggerSynthesis] Not enough samples for ${passType} pass`);
      return {
        passType,
        triggers: [],
        duration: performance.now() - startTime,
        sampleCount: filteredSamples.length
      };
    }

    // Register samples with SourceRegistry
    sourcePreservationService.convertBatch(filteredSamples);

    // Build V1-style prompt with hard constraints
    const prompt = this.buildV1Prompt(filteredSamples, brandProfile, config);

    try {
      // Single Claude call
      const response = await this.callLLM(prompt);
      const rawTriggers = this.parseV1Response(response);

      // Validate and convert to ConsolidatedTrigger format
      const triggers = this.convertToConsolidatedTriggers(
        rawTriggers,
        filteredSamples,
        passType
      );

      const duration = performance.now() - startTime;
      console.log(`[TriggerSynthesis] ${passType} pass: ${triggers.length} triggers in ${duration.toFixed(0)}ms`);

      return {
        passType,
        triggers,
        duration,
        sampleCount: filteredSamples.length
      };
    } catch (error) {
      console.error(`[TriggerSynthesis] ${passType} pass failed:`, error);
      return {
        passType,
        triggers: [],
        duration: performance.now() - startTime,
        sampleCount: filteredSamples.length
      };
    }
  }

  /**
   * Run all 4 passes and combine results
   */
  async runMultiPass(
    brandProfile: BrandProfile,
    rawSamples: RawDataSample[],
    onPassComplete?: (result: PassResult) => void
  ): Promise<MultiPassResult> {
    const startTime = performance.now();
    const passSummary: PassResult[] = [];
    let allTriggers: ConsolidatedTrigger[] = [];

    const passes: PassType[] = ['pain-fear', 'desire-motivation', 'objection-trust', 'competitor'];

    for (const passType of passes) {
      const result = await this.generateTriggers(brandProfile, rawSamples, passType);
      passSummary.push(result);
      allTriggers = allTriggers.concat(result.triggers);

      // Callback for progressive UI loading
      if (onPassComplete) {
        onPassComplete(result);
      }
    }

    // Deduplicate across passes (>50% sample overlap = merge)
    const deduplicatedTriggers = this.deduplicateTriggers(allTriggers);

    return {
      triggers: deduplicatedTriggers,
      passSummary,
      totalDuration: performance.now() - startTime,
      deduplicatedCount: allTriggers.length - deduplicatedTriggers.length
    };
  }

  /**
   * Filter samples by pass-specific keywords
   */
  private filterSamplesByPass(samples: RawDataSample[], passType: PassType): RawDataSample[] {
    const config = PASS_CONFIGS[passType];
    const keywords = config.filterKeywords;

    return samples.filter(sample => {
      const content = sample.content.toLowerCase();
      return keywords.some(kw => content.includes(kw.toLowerCase()));
    });
  }

  /**
   * Build V1-style prompt with HARD provenance constraints
   */
  private buildV1Prompt(
    samples: RawDataSample[],
    brandProfile: BrandProfile,
    config: PassConfig
  ): string {
    const targetCustomer = brandProfile.uvp.targetCustomer?.statement || 'business decision makers';
    const productCategory = this.extractProductCategory(brandProfile.uvp);

    // Format samples with numbered IDs
    const sampleText = samples.map((s, idx) => {
      const urlPart = s.url ? ` | URL: ${s.url}` : '';
      return `[${idx + 1}] (${s.platform}${urlPart})\n"${s.content.substring(0, 400)}"`;
    }).join('\n\n');

    return `You are extracting buying triggers from real customer conversations.

## HARD CONSTRAINTS (violations = rejected output)

1. **sampleIds REQUIRED**: Each trigger MUST cite 2+ sample IDs from the input
2. **verbatimQuote REQUIRED**: Include an EXACT quote (8-20 words) from one of the cited samples
3. **reasoning REQUIRED**: Explain why these samples support this trigger (1-2 sentences)
4. You may ONLY reference sample IDs that exist in the input (1 to ${samples.length})

## Pass Focus
${config.promptFocus}

## Target Categories
${config.categories.join(', ')}

## Context
- Target Customer: ${targetCustomer}
- Product Category: ${productCategory || brandProfile.industry || 'this solution'}

## Raw Data Samples

${sampleText}

## Output Format (JSON array)

\`\`\`json
[
  {
    "title": "We've been fighting with their API for months",
    "category": "pain-point",
    "sampleIds": [3, 7],
    "verbatimQuote": "We've been fighting with their API for 6 months and it still doesn't work",
    "reasoning": "Developer frustration with integration complexity. Multiple sources mention API struggles."
  }
]
\`\`\`

## Rules
- Title should be a real customer phrase (not marketing speak)
- Extract ${config.targetCount.min}-${config.targetCount.max} triggers
- Reject samples that don't clearly express emotion (fear, frustration, desire, etc.)
- If a sample mentions a competitor by name, include it in the title

Output ONLY the JSON array, no other text.`;
  }

  /**
   * Extract product category from UVP
   */
  private extractProductCategory(uvp: CompleteUVP): string | undefined {
    if (uvp.uniqueSolution?.statement) {
      const match = uvp.uniqueSolution.statement.match(/(?:our|the|a)\s+([^,]+?)(?:\s+(?:that|which|helps|enables|provides))/i);
      if (match) return match[1].trim();
    }
    return uvp.keyBenefit?.statement?.split(' ').slice(0, 3).join(' ');
  }

  /**
   * Call Claude via ai-proxy
   */
  private async callLLM(prompt: string): Promise<string> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        provider: 'openrouter',
        model: 'anthropic/claude-sonnet-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM call failed: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Parse V1-style LLM response
   */
  private parseV1Response(response: string): V1TriggerOutput[] {
    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn('[TriggerSynthesis] No JSON array found in response');
      return [];
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed)) return [];

      // Validate each trigger has required fields
      return parsed.filter((t: any) => {
        if (!t.title || !t.category || !t.sampleIds || !t.verbatimQuote || !t.reasoning) {
          console.warn('[TriggerSynthesis] Rejected trigger missing required field:', t.title);
          return false;
        }
        if (!Array.isArray(t.sampleIds) || t.sampleIds.length < 2) {
          console.warn('[TriggerSynthesis] Rejected trigger with <2 sample IDs:', t.title);
          return false;
        }
        return true;
      });
    } catch (e) {
      console.error('[TriggerSynthesis] JSON parse error:', e);
      return [];
    }
  }

  /**
   * Convert V1 output to ConsolidatedTrigger format
   */
  private convertToConsolidatedTriggers(
    rawTriggers: V1TriggerOutput[],
    samples: RawDataSample[],
    passType: PassType
  ): ConsolidatedTrigger[] {
    return rawTriggers.map((raw, idx) => {
      // Build evidence from cited sample IDs
      const evidence: EvidenceItem[] = raw.sampleIds
        .filter(id => id >= 1 && id <= samples.length)
        .map(id => {
          const sample = samples[id - 1];
          return {
            id: sample.id,
            source: sample.source,
            platform: sample.platform,
            quote: sample.content.substring(0, 300),
            url: sample.url,
            author: sample.author,
            sentiment: 'neutral' as const,
            confidence: 1, // No confidence theater
            verifiedSourceId: sample.id
          };
        });

      return {
        id: `${passType}-${idx}-${Date.now()}`,
        category: raw.category,
        title: raw.title,
        executiveSummary: raw.reasoning,
        confidence: evidence.length / 10, // Simple: source count as confidence proxy
        evidenceCount: evidence.length,
        evidence,
        uvpAlignments: [], // Populated by UI if needed
        isTimeSensitive: false,
        profileRelevance: 1,
        rawSourceIds: raw.sampleIds.map(String),
        isLLMSynthesized: true,
        // V5 Simplified: No scoring middleware fields
        // sourceQualityMultiplier, categoryWeightMultiplier, triangulationMultiplier removed
      };
    });
  }

  /**
   * Deduplicate triggers by sample ID overlap
   * >50% same samples = merge (keep higher source count)
   */
  private deduplicateTriggers(triggers: ConsolidatedTrigger[]): ConsolidatedTrigger[] {
    const seen = new Map<string, ConsolidatedTrigger>();

    for (const trigger of triggers) {
      const sourceIds = new Set(trigger.rawSourceIds);
      let isDuplicate = false;

      for (const [_, existing] of seen.entries()) {
        const existingIds = new Set(existing.rawSourceIds);
        const overlap = [...sourceIds].filter(id => existingIds.has(id)).length;
        const overlapRatio = overlap / Math.min(sourceIds.size, existingIds.size);

        if (overlapRatio > 0.5) {
          // Keep the one with more sources
          if (trigger.evidenceCount > existing.evidenceCount) {
            seen.delete(existing.id);
            seen.set(trigger.id, trigger);
          }
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        seen.set(trigger.id, trigger);
      }
    }

    return Array.from(seen.values());
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const triggerSynthesisService = new TriggerSynthesisService();
export default triggerSynthesisService;
