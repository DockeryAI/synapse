/**
 * LLM Trigger Synthesizer Service
 *
 * Synthesizes raw API data into properly formatted psychological triggers
 * using Claude Haiku for fast, structured output.
 *
 * This replaces the regex-based title extraction with LLM understanding,
 * ensuring triggers are:
 * - Properly categorized (fear, desire, pain-point, etc.)
 * - Written in customer voice (not marketing speak)
 * - Formatted consistently ("Fear of X", "Frustrated by Y")
 * - Linked to source evidence
 *
 * Created: 2025-11-29
 */

import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { BusinessProfileType } from './profile-detection.service';
import type { ConsolidatedTrigger, TriggerCategory, EvidenceItem } from './trigger-consolidation.service';

// ============================================================================
// TYPES
// ============================================================================

export interface RawDataSample {
  id: string;
  content: string;
  source: string;
  platform: string;
  url?: string;
  author?: string;
  /** Original source title (e.g., article name, forum thread title) */
  sourceTitle?: string;
  /** Competitor name if this sample is about a specific competitor */
  competitorName?: string;
  /** Source type for multi-signal triangulation (2+ types = higher confidence) */
  sourceType?: 'voc' | 'community' | 'event' | 'executive' | 'news';
  /** Timestamp of when this data was collected/published */
  timestamp?: string;
  /** Engagement score (upvotes, likes, shares, etc.) */
  engagement?: number;
}

export type BuyerJourneyStage = 'unaware' | 'problem-aware' | 'solution-aware' | 'product-aware';

export interface SynthesizedTrigger {
  category: TriggerCategory;
  title: string;
  executiveSummary: string;
  evidence: {
    quote: string;
    source: string;
    platform: string;
    url?: string;
    author?: string;
    /** Index reference to raw data sample (1-indexed from prompt) */
    sampleIndex?: number;
  }[];
  confidence: number;
  isTimeSensitive: boolean;
  /** Buyer journey stage from LLM validation */
  buyerJourneyStage?: BuyerJourneyStage;
  /** Buyer-product fit score from LLM validation (0-1) */
  buyerProductFit?: number;
  /** Reasoning for why this trigger matches the target buyer and product category */
  buyerProductFitReasoning?: string;
}

export interface TriggerSynthesisInput {
  rawData: RawDataSample[];
  uvp: CompleteUVP;
  profileType: BusinessProfileType;
  brandName?: string;
  industry?: string;
}

export interface TriggerSynthesisResult {
  triggers: ConsolidatedTrigger[];
  synthesisTime: number;
  model: string;
  rawTriggerCount: number;
}

// ============================================================================
// CATEGORY DEFINITIONS FOR PROMPT
// ============================================================================

const CATEGORY_DEFINITIONS = `
## Trigger Categories

1. **fear** - Anxieties, worries, risks the customer fears
   - Format: "Fear of [specific concern]"
   - Examples: "Fear of vendor lock-in", "Fear of implementation failure"

2. **desire** - What customers desperately want but struggle to find
   - Format: "Want [specific outcome]" or "Looking for [specific thing]"
   - Examples: "Want seamless integration", "Looking for transparent pricing"

3. **pain-point** - Current frustrations and problems
   - Format: "Frustrated by [specific issue]" or "[Problem] causing [impact]"
   - Examples: "Frustrated by slow response times", "Manual processes wasting hours"

4. **objection** - Reasons customers hesitate to buy
   - Format: "Concerned about [objection]" or "Hesitant due to [reason]"
   - Examples: "Concerned about total cost of ownership", "Hesitant due to past failures"

5. **motivation** - Positive drivers pushing customers toward solutions
   - Format: "Motivated by [driver]" or "Excited about [opportunity]"
   - Examples: "Motivated by competitive pressure", "Excited about automation potential"

6. **trust** - Credibility factors that build or break trust
   - Format: "Need proof of [trust factor]" or "Trust requires [evidence]"
   - Examples: "Need proof of ROI claims", "Trust requires customer references"

7. **urgency** - Time-sensitive pressures forcing action
   - Format: "Urgent: [time pressure]" or "Deadline: [constraint]"
   - Examples: "Urgent: Q4 budget deadline", "Falling behind competitors"
`;

const PROFILE_CONTEXT: Record<BusinessProfileType, string> = {
  'local-service-b2b': 'Local B2B service provider (HVAC, IT services). Focus on reliability, response time, local reputation.',
  'local-service-b2c': 'Local B2C service (dental, salon, restaurant). Focus on convenience, reviews, personal experience.',
  'regional-b2b-agency': 'Regional B2B agency (marketing, consulting). Focus on ROI, expertise, communication.',
  'regional-retail-b2c': 'Regional retail (multi-location). Focus on availability, returns, price matching.',
  'national-saas-b2b': 'National SaaS B2B. Focus on integration, scalability, support, security.',
  'national-product-b2c': 'National consumer product. Focus on quality, durability, value, reviews.',
  'global-saas-b2b': 'Global enterprise SaaS. Focus on compliance, enterprise features, global support, vendor stability.',
};

// ============================================================================
// BANNED GENERIC TERMS - These should NEVER appear in trigger output
// These are NAICS-style generic terms that don't help customers identify
// with the content. Use specific product/service categories instead.
// ============================================================================
const BANNED_GENERIC_TERMS = [
  // NAICS-style generic terms (never use these)
  'software publishers',
  'software publishing',
  'data processing',
  'information services',
  'computer systems design',
  'custom programming',
  'professional services',
  'business services',
  'management consulting',
  'technical services',
  'administrative services',

  // Replace with specific product categories:
  // "software publishers" → "conversational AI platforms", "chatbot solutions", etc.
  // "professional services" → "marketing agencies", "consulting firms", etc.
  // "data processing" → "analytics platforms", "data warehouses", etc.
];

// Buyer-Product Fit validation criteria per profile
const PROFILE_VALIDATION_CRITERIA: Record<BusinessProfileType, {
  validTriggerTypes: string[];
  invalidTriggerTypes: string[];
  validBuyerTerms: string[];
  requiredContext: string[];
}> = {
  'local-service-b2b': {
    validTriggerTypes: ['equipment failure', 'emergency repair', 'vendor reliability', 'compliance', 'contract timing'],
    invalidTriggerTypes: ['consumer', 'personal', 'saas', 'software subscription', 'retail shopping'],
    validBuyerTerms: ['business owner', 'facilities manager', 'operations', 'commercial'],
    requiredContext: ['local', 'service', 'contractor', 'vendor', 'repair', 'maintenance']
  },
  'local-service-b2c': {
    validTriggerTypes: ['appointment', 'wait time', 'service quality', 'reviews', 'convenience', 'life event'],
    invalidTriggerTypes: ['enterprise', 'b2b', 'vendor contract', 'procurement', 'integration'],
    validBuyerTerms: ['patient', 'customer', 'client', 'member', 'consumer'],
    requiredContext: ['appointment', 'booking', 'visit', 'experience', 'service']
  },
  'regional-b2b-agency': {
    validTriggerTypes: ['roi concerns', 'agency evaluation', 'leadership change', 'rfp', 'expertise'],
    invalidTriggerTypes: ['consumer', 'personal', 'retail', 'local service'],
    validBuyerTerms: ['cmo', 'marketing director', 'ceo', 'founder', 'executive'],
    requiredContext: ['agency', 'firm', 'consulting', 'partnership', 'results']
  },
  'regional-retail-b2c': {
    validTriggerTypes: ['expansion', 'location', 'inventory', 'seasonal', 'competition'],
    invalidTriggerTypes: ['saas', 'software', 'enterprise platform', 'b2b service'],
    validBuyerTerms: ['shopper', 'customer', 'consumer', 'buyer'],
    requiredContext: ['store', 'location', 'retail', 'franchise', 'shopping']
  },
  'national-saas-b2b': {
    validTriggerTypes: ['integration', 'implementation', 'vendor lock-in', 'scalability', 'security', 'funding', 'tech stack'],
    invalidTriggerTypes: ['consumer', 'personal', 'local service', 'retail store'],
    validBuyerTerms: ['enterprise', 'company', 'organization', 'team', 'it', 'cto', 'vp'],
    requiredContext: ['software', 'platform', 'tool', 'integration', 'automation']
  },
  'national-product-b2c': {
    validTriggerTypes: ['quality', 'price', 'durability', 'reviews', 'distribution', 'retail partnership'],
    invalidTriggerTypes: ['saas', 'software', 'b2b service', 'enterprise'],
    validBuyerTerms: ['consumer', 'customer', 'buyer', 'shopper'],
    requiredContext: ['product', 'brand', 'purchase', 'quality', 'retail']
  },
  'global-saas-b2b': {
    validTriggerTypes: ['compliance', 'gdpr', 'data residency', 'enterprise governance', 'multi-region', 'vendor stability'],
    invalidTriggerTypes: ['consumer', 'personal', 'local service', 'small business only'],
    validBuyerTerms: ['enterprise', 'global', 'multinational', 'cto', 'security', 'compliance'],
    requiredContext: ['enterprise', 'global', 'compliance', 'security', 'governance']
  }
};

// ============================================================================
// SERVICE
// ============================================================================

// OpenRouter keys for parallel LLM synthesis (loaded from environment)
const OPENROUTER_KEYS = [
  import.meta.env.VITE_OPENROUTER_KEY_1 || '',
  import.meta.env.VITE_OPENROUTER_KEY_2 || '',
  import.meta.env.VITE_OPENROUTER_KEY_3 || '',
  import.meta.env.VITE_OPENROUTER_KEY_4 || '',
].filter(k => k !== '');

class LLMTriggerSynthesizerService {
  private endpoint: string;
  private apiKey: string;
  /** Store last samples for URL lookup after LLM response */
  private lastSamples: RawDataSample[] = [];

  constructor() {
    this.endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`;
    this.apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  }

  /**
   * Synthesize raw data into formatted psychological triggers
   * PARALLEL BATCHING: Splits samples across 4 OpenRouter keys for 4x speed
   */
  async synthesize(input: TriggerSynthesisInput): Promise<TriggerSynthesisResult> {
    const startTime = performance.now();

    console.log('[LLMTriggerSynthesizer] Starting PARALLEL synthesis with', input.rawData.length, 'data points');

    // PHASE 10: Source diversity gate - validate we have diverse sources
    const sourceDiversity = this.checkSourceDiversity(input.rawData);
    console.log(`[LLMTriggerSynthesizer] Source diversity: ${sourceDiversity.uniquePlatforms} platforms | ${sourceDiversity.distribution}`);

    if (sourceDiversity.uniquePlatforms < 2) {
      console.warn('[LLMTriggerSynthesizer] ⚠️ LOW SOURCE DIVERSITY - only', sourceDiversity.uniquePlatforms, 'platform(s). Results may be less accurate.');
    }

    // PARALLEL BATCHING: Select 200 samples (50 per batch × 4 batches)
    const allSamples = this.selectBestSamples(input.rawData, 200);
    console.log(`[LLMTriggerSynthesizer] Selected ${allSamples.length} samples for parallel processing`);

    // Store all samples for URL lookup
    this.lastSamples = allSamples;

    // Split into 4 batches for parallel processing
    const batchSize = Math.ceil(allSamples.length / 4);
    const batches: RawDataSample[][] = [];
    for (let i = 0; i < 4; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, allSamples.length);
      if (start < allSamples.length) {
        batches.push(allSamples.slice(start, end));
      }
    }

    console.log(`[LLMTriggerSynthesizer] Split into ${batches.length} batches: ${batches.map(b => b.length).join(', ')} samples each`);

    try {
      // Run 4 LLM calls in PARALLEL using different OpenRouter keys
      const batchPromises = batches.map((batch, idx) =>
        this.synthesizeBatch(batch, input.uvp, input.profileType, input.industry, idx)
      );

      const batchResults = await Promise.allSettled(batchPromises);

      // Collect all triggers from successful batches
      let allTriggers: SynthesizedTrigger[] = [];
      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          console.log(`[LLMTriggerSynthesizer] Batch ${idx + 1}: ${result.value.length} triggers`);
          allTriggers = allTriggers.concat(result.value);
        } else {
          console.error(`[LLMTriggerSynthesizer] Batch ${idx + 1} FAILED:`, result.reason);
        }
      });

      console.log(`[LLMTriggerSynthesizer] Total before dedupe: ${allTriggers.length} triggers`);

      // Deduplicate by title similarity
      const dedupedTriggers = this.deduplicateTriggers(allTriggers);
      console.log(`[LLMTriggerSynthesizer] After dedupe: ${dedupedTriggers.length} unique triggers`);

      // Convert to ConsolidatedTrigger format
      const triggers = this.convertToConsolidatedTriggers(dedupedTriggers);

      const synthesisTime = performance.now() - startTime;

      console.log(`[LLMTriggerSynthesizer] ✅ Synthesized ${triggers.length} triggers in ${synthesisTime.toFixed(0)}ms (PARALLEL)`);

      return {
        triggers,
        synthesisTime,
        model: 'claude-sonnet-4-parallel',
        rawTriggerCount: allTriggers.length,
      };
    } catch (error) {
      console.error('[LLMTriggerSynthesizer] Parallel synthesis failed:', error);

      // Return empty result - let fallback to regex consolidation
      return {
        triggers: [],
        synthesisTime: performance.now() - startTime,
        model: 'failed',
        rawTriggerCount: 0,
      };
    }
  }

  /**
   * Synthesize a single batch of samples using a specific OpenRouter key
   */
  private async synthesizeBatch(
    samples: RawDataSample[],
    uvp: CompleteUVP,
    profileType: BusinessProfileType,
    industry: string | undefined,
    batchIndex: number
  ): Promise<SynthesizedTrigger[]> {
    const apiKey = OPENROUTER_KEYS[batchIndex % OPENROUTER_KEYS.length];

    console.log(`[LLMTriggerSynthesizer] Batch ${batchIndex + 1}: Processing ${samples.length} samples with key ${batchIndex + 1}`);

    // Build prompt for this batch
    const prompt = this.buildPrompt(samples, uvp, profileType, industry);

    // Call LLM with specific key
    const response = await this.callLLMDirect(prompt, apiKey);

    // Parse response
    return this.parseResponse(response);
  }

  /**
   * Deduplicate triggers by title similarity (fuzzy match ~80%)
   */
  private deduplicateTriggers(triggers: SynthesizedTrigger[]): SynthesizedTrigger[] {
    const seen = new Map<string, SynthesizedTrigger>();

    for (const trigger of triggers) {
      // Normalize title for comparison
      const normalizedTitle = trigger.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      const words = normalizedTitle.split(/\s+/);

      // Check if we've seen a similar title
      let isDuplicate = false;
      for (const [existingNorm, existingTrigger] of seen.entries()) {
        const existingWords = existingNorm.split(/\s+/);

        // Count common words
        const commonWords = words.filter(w => existingWords.includes(w)).length;
        const similarity = commonWords / Math.max(words.length, existingWords.length);

        if (similarity > 0.7) {
          // Keep the one with higher confidence
          if (trigger.confidence > existingTrigger.confidence) {
            seen.delete(existingNorm);
            seen.set(normalizedTitle, trigger);
          }
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        seen.set(normalizedTitle, trigger);
      }
    }

    // Sort by confidence descending, return top 50
    return Array.from(seen.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 50);
  }

  /**
   * Select the most relevant data samples for synthesis
   */
  private selectBestSamples(data: RawDataSample[], limit: number): RawDataSample[] {
    // Prioritize samples with psychological language
    const psychKeywords = [
      'afraid', 'worried', 'frustrated', 'want', 'need', 'hate',
      'love', 'struggle', 'difficult', 'expensive', 'slow', 'broken',
      'wish', 'hope', 'fear', 'concern', 'problem', 'issue'
    ];

    const scored = data.map(sample => {
      const lowerContent = sample.content.toLowerCase();
      const score = psychKeywords.filter(kw => lowerContent.includes(kw)).length;
      return { sample, score };
    });

    // Sort by score descending, take top N
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.sample);
  }

  /**
   * PHASE 10: Check source diversity in raw data
   * Validates we have diverse trusted sources before synthesis
   */
  private checkSourceDiversity(data: RawDataSample[]): {
    uniquePlatforms: number;
    platformCounts: Map<string, number>;
    distribution: string;
    hasMinimumDiversity: boolean;
  } {
    const platformCounts = new Map<string, number>();

    data.forEach(sample => {
      const platform = (sample.platform || 'unknown').toLowerCase();
      platformCounts.set(platform, (platformCounts.get(platform) || 0) + 1);
    });

    const uniquePlatforms = platformCounts.size;

    // Build distribution string for logging
    const distribution = Array.from(platformCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([platform, count]) => `${platform}: ${count}`)
      .join(', ');

    // Minimum diversity: at least 2 different platforms
    const hasMinimumDiversity = uniquePlatforms >= 2;

    return {
      uniquePlatforms,
      platformCounts,
      distribution,
      hasMinimumDiversity
    };
  }

  /**
   * Build the synthesis prompt
   */
  private buildPrompt(
    samples: RawDataSample[],
    uvp: CompleteUVP,
    profileType: BusinessProfileType,
    industry?: string
  ): string {
    const targetCustomer = uvp.targetCustomer?.statement || 'business decision makers';
    const painPoints = uvp.targetCustomer?.emotionalDrivers?.slice(0, 3) || [];
    const transformation = uvp.transformationGoal?.after || '';
    const profileContext = PROFILE_CONTEXT[profileType] || PROFILE_CONTEXT['national-saas-b2b'];

    // Extract PRODUCT CATEGORY from UVP - this is CRITICAL for buyer-product fit
    // We need to know what we're selling (e.g., "conversational AI", "chatbots", "customer service automation")
    const productCategory = this.extractProductCategory(uvp);
    const uniqueSolution = uvp.uniqueSolution?.statement || '';
    const keyBenefit = uvp.keyBenefit?.statement || '';

    // Format samples for the prompt - include URLs for source tracking
    const sampleText = samples
      .map((s, i) => {
        const urlPart = s.url ? ` | URL: ${s.url}` : '';
        const authorPart = s.author ? ` | Author: ${s.author}` : '';
        return `[${i + 1}] (${s.platform}${authorPart}${urlPart})\n"${s.content.substring(0, 400)}"`;
      })
      .join('\n\n');

    // Store samples for URL lookup later
    this.lastSamples = samples;

    // Get profile-specific validation criteria
    const validationCriteria = PROFILE_VALIDATION_CRITERIA[profileType] || PROFILE_VALIDATION_CRITERIA['national-saas-b2b'];

    return `You are a customer psychology analyst specializing in buyer-product fit validation. Analyze these raw data samples and synthesize them into psychological buying triggers that would ACTUALLY lead buyers to THIS specific product category.

## Context

**Target Customer**: ${targetCustomer}
**SPECIFIC INDUSTRY/PRODUCT (USE THIS EXACT TERM)**: ${productCategory || industry || 'this solution'}
**Unique Solution**: ${uniqueSolution}
**Key Benefit**: ${keyBenefit}
**Business Profile**: ${profileContext}
**Known Pain Points**: ${painPoints.join(', ') || 'not specified'}
**Desired Transformation**: ${transformation || 'not specified'}

## CRITICAL: BANNED GENERIC TERMS (Never use these)
The following NAICS-style generic terms MUST NEVER appear in your output. They are meaningless to customers:
- "software publishers" → use "${productCategory}" instead
- "software publishing" → use specific product type
- "data processing" → use specific service type
- "information services" → use specific service type
- "professional services" → use specific service type
- "business services" → use specific service type
- "management consulting" → use specific service type

**ALWAYS use the SPECIFIC INDUSTRY/PRODUCT term provided above: "${productCategory || industry || 'this solution'}"**

## CRITICAL: Buyer-Product Fit Validation

This is the most important section. You must validate that each trigger would lead someone to buy THIS specific product category, not just any product.

**Valid Trigger Types for this profile**: ${validationCriteria.validTriggerTypes.join(', ')}
**REJECT triggers about**: ${validationCriteria.invalidTriggerTypes.join(', ')}
**Valid Buyer Terms**: ${validationCriteria.validBuyerTerms.join(', ')}
**Required Context**: ${validationCriteria.requiredContext.join(', ')}

### The Key Question
For EACH trigger, ask: "If someone has this problem, would searching for a solution lead them to buy **${productCategory}**?"

CRITICAL EXAMPLE for conversational AI/chatbot company:
- VALID: "Frustrated by slow customer service response times" → Would search for chatbot/AI solutions ✓
- VALID: "Fear of losing customers to competitors with 24/7 support" → Would search for automation ✓
- INVALID: "Anxiety about legacy system integration failures" → Generic IT pain, would search for systems integrators, NOT chatbots ✗
- INVALID: "Concerned about data security breaches" → Would search for security software, NOT chatbots ✗

### Examples of VALID vs INVALID triggers:

VALID for ${profileType}:
- Trigger that describes pain our target customer has
- Trigger that would lead them to search for our product category
- Trigger specific to our industry/use case

INVALID (reject these):
- Generic pain that could lead to ANY product category
- Pain about a COMPETITOR in a DIFFERENT category
- Marketing copy or thought leadership (not buyer voice)
- Pain that doesn't match our target buyer profile

${CATEGORY_DEFINITIONS}

## Buyer Journey Stage

For each trigger, determine the buyer's awareness stage:
- **unaware**: General industry interest, not yet aware of the problem
- **problem-aware**: Knows they have a problem, not yet researching solutions
- **solution-aware**: Actively researching solutions, comparing options
- **product-aware**: Ready to buy, evaluating specific products

**Prioritize solution-aware and product-aware triggers** - these convert to revenue.

## Raw Data Samples

${sampleText}

## Instructions

1. Analyze the raw data for psychological patterns
2. **VALIDATE each potential trigger against buyer-product fit criteria**
3. **REJECT triggers that don't pass the validation question**
4. Group similar sentiments into distinct triggers
5. Write each trigger title as a CONCISE phrase (3-6 words max)
6. Include 1-3 evidence quotes per trigger (use actual quotes from the data)
7. Output 15-25 high-quality, VALIDATED triggers

## Quality Rules

- NO marketing speak ("Implement", "Deploy", "Leverage")
- NO recommendations ("You should", "Consider")
- YES customer emotions ("Fear of", "Frustrated by", "Want")
- YES specific concerns (not generic platitudes)
- Each trigger must map to at least one data sample
- **REJECT triggers that fail buyer-product fit validation**

## Title Format (CRITICAL)
Titles must be COMPLETE, CLEAR statements (5-12 words). Write in plain English as a complete thought. Examples:
- GOOD: "Buyers fear getting locked into inflexible vendor contracts"
- GOOD: "Teams struggle with complex integrations that break easily"
- GOOD: "Compliance deadlines create pressure to find faster solutions"
- GOOD: "Customers want simpler pricing without hidden fees"
- BAD: "Vendor lock-in anxiety" (too vague, not a complete thought)
- BAD: "Integration complexity fears" (not a sentence)
- BAD: "Platform complexity and pricing that doesn't align with" (cut off mid-sentence)

## Output Format

Return a JSON array of triggers:
\`\`\`json
[
  {
    "category": "fear",
    "title": "Vendor lock-in anxiety",
    "executiveSummary": "Enterprise IT leaders fear getting trapped with vendors who make data migration difficult, especially after significant investment. This aligns with the 'open architecture' differentiator in your Unique Solution and the 'data portability' feature in Products & Services. Opportunity: Lead sales conversations with 'Your data stays yours' messaging to win deals from locked-in competitors.",
    "evidence": [
      {"quote": "What if we invest millions and can't migrate out?", "source": "Reddit r/SaaS discussion", "platform": "Reddit", "sampleIndex": 3},
      {"quote": "Our last vendor made it impossible to export data", "source": "G2 Review by IT Director", "platform": "G2", "sampleIndex": 7}
    ],
    "confidence": 0.85,
    "isTimeSensitive": false,
    "buyerJourneyStage": "solution-aware",
    "buyerProductFit": 0.85,
    "buyerProductFitReasoning": "Matches target buyer (enterprise IT decision makers) experiencing vendor lock-in pain. This trigger leads directly to searching for platforms with open architecture and data portability - exactly this product category."
  }
]
\`\`\`

## Executive Summary Guidelines (CRITICAL)
Write the executive summary as 3 complete sentences in this structure:
1. **WHO + WHAT**: Describe who experiences this trigger and what the pain/desire is. ALWAYS use the SPECIFIC INDUSTRY TERM "${productCategory || industry || 'this solution'}" - NEVER use generic terms like "software publishers", "professional services", etc.
   - GOOD: "Marketing leaders struggle when conversational AI platforms emphasize 'safety and transparency'..."
   - BAD: "Marketing leaders struggle when software publishers emphasize 'safety and transparency'..." (NEVER use "software publishers")
2. **UVP ALIGNMENT**: EXPLICITLY name the UVP component that addresses this. Use format: "This aligns with [specific UVP element: Target Customer/Unique Solution/Transformation/Products & Services]." For example: "This aligns with the 'open architecture' differentiator in your Unique Solution."
3. **OPPORTUNITY**: Provide a specific, actionable opportunity (e.g., "Opportunity: Lead sales conversations with 'Your data stays yours' messaging.")

## Evidence Rules
- Use EXACT quotes from the data samples (verbatim, in quotes)
- sampleIndex = the [N] number from the raw data above
- source = descriptive label (e.g., "G2 Review by Enterprise User", "Reddit r/chatbots thread")
- platform = clean platform name (Reddit, G2, Trustpilot, LinkedIn, Quora, YouTube, etc.)

## CRITICAL: NO META-COMMENTARY
NEVER include notes, comments, or explanations in your output. No "**Note:**", "The search results...", "Unfortunately...", etc.
- DO NOT comment on data quality
- DO NOT explain what you found or didn't find
- DO NOT apologize for limited data
- ONLY output the JSON array of triggers
- If data is limited, output fewer triggers - do NOT explain why

## New Fields
- buyerJourneyStage = one of: "unaware", "problem-aware", "solution-aware", "product-aware"
- buyerProductFit = 0-1 score indicating how likely this trigger leads to THIS product category
- buyerProductFitReasoning = 1-2 sentence explanation of WHY this trigger fits: who the buyer is, what pain they have, and why solving it would lead them to THIS product category (not just any product)

Output 20-30 distinct psychological triggers based on the data provided. Keep responses concise.

Return ONLY the JSON array, no other text.`;
  }

  /**
   * Call the LLM via ai-proxy (fallback method)
   */
  private async callLLM(prompt: string): Promise<string> {
    console.log('[LLMTriggerSynthesizer] Calling Sonnet 4 via ai-proxy...');

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        provider: 'openrouter',
        model: 'anthropic/claude-sonnet-4',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM call failed: ${response.status} ${error}`);
    }

    const data = await response.json();
    console.log('[LLMTriggerSynthesizer] Sonnet 4 response received');
    return data.choices[0].message.content;
  }

  /**
   * Call OpenRouter directly with a specific API key
   * Used for parallel batch processing
   */
  private async callLLMDirect(prompt: string, apiKey: string): Promise<string> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://synapse.app',
        'X-Title': 'Synapse Trigger Synthesizer',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 6000, // Smaller per batch since we're splitting
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter call failed: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Patterns that indicate garbage/meta-commentary in trigger titles
   * These should NEVER appear in valid trigger titles
   */
  private readonly INVALID_TITLE_PATTERNS = [
    /^\*\*note:?\*\*/i,           // **Note:**
    /^\*\*important:?\*\*/i,       // **Important:**
    /^note:/i,                     // Note:
    /^important:/i,                // Important:
    /^warning:/i,                  // Warning:
    /^the search results/i,        // The search results...
    /^based on the/i,              // Based on the...
    /^after analyzing/i,           // After analyzing...
    /^i found/i,                   // I found...
    /^here are/i,                  // Here are...
    /^unfortunately/i,             // Unfortunately...
    /^however/i,                   // However...
    /^this (data|analysis)/i,      // This data/analysis...
    /^the raw data/i,              // The raw data...
    /software publishers/i,        // Random garbage
    /altkomsoftware/i,             // Specific garbage source
    /focus on business benefits/i, // Meta-commentary
    /\[competitor\]/i,             // Unprocessed [competitor] placeholder
    /\[company\]/i,                // Unprocessed [company] placeholder
    /that doesn't align with$/i,   // Cut-off mid-sentence
    /and pricing that$/i,          // Cut-off mid-sentence
    /doesn't align$/i,             // Cut-off incomplete

    // META-DESCRIPTIONS about data sources (NOT actual insights)
    /^reddit discussions/i,        // "Reddit discussions from r/SaaS..."
    /^linkedin posts/i,            // "LinkedIn posts about..."
    /^discussion threads/i,        // "Discussion threads from..."
    /^real customer quotes/i,      // "Real customer quotes discussing..."
    /^customer satisfaction scores/i, // "Customer satisfaction scores for..."
    /^comparative pricing/i,       // "Comparative pricing across..."
    /capterra shines/i,            // "Capterra shines in product content..."
    /^g2 reviews/i,                // "G2 reviews about..."
    /^trustpilot reviews/i,        // "Trustpilot reviews mentioning..."
    /mentioning the product$/i,    // "...mentioning the product"
    /about these tools$/i,         // "...about these tools"
    /about this ai$/i,             // "...about this AI"
    /provides detailed information/i, // "...provides detailed information..."
    /^youtube videos/i,            // "YouTube videos discussing..."
    /^quora questions/i,           // "Quora questions about..."
    /^forum posts/i,               // "Forum posts from..."
    /startup founders explore/i,   // Generic startup exploration
    /reveals competitive advantages/i, // Meta-analysis language
    /innovative software solutions/i, // Marketing fluff
    /for operational challenges$/i, // Generic endings

    // PHASE K.2: "NO DATA FOUND" responses being displayed as triggers
    /^no (first-person|significant|direct|relevant|specific)/i, // "No first-person quotes...", "No significant narratives..."
    /^no customer (quotes|voices|experiences|narratives)/i, // "No customer quotes found..."
    /^no problem\/surprise narratives/i, // "**No problem/surprise narratives**"
    /narratives were discovered$/i, // "...narratives were discovered"
    /were not found$/i,            // "...were not found"
    /were found in the/i,          // "...were found in the provided search results"
    /^direct quotes from customers who/i, // Meta-description of quote type, not actual quote
    /^quotes? (from|about|describing|expressing)/i, // Description of quotes, not quotes themselves
    /^customer (experience|success)? narratives/i, // Meta-description
    /in the provided search results/i, // Meta-commentary about search
    /the search did not/i,         // Meta-commentary
    /no quotes describing/i,       // "No quotes describing..."
    /concerns about vendor/i,      // Too generic without context

    // PHASE K.2: Generic capability statements (not triggers)
    /^(robotic process|rpa|automation) (transforms|improves|streamlines)/i, // Solution statements, not customer voice
    /transforms workforce efficiency/i, // Marketing speak
    /leverage ai to streamline/i,  // Marketing speak
    /seek transparent solutions/i, // Generic observation
    /addressing their core operational/i, // Generic
    /vendor switching reveals/i,   // Meta-observation
    /reveals critical gaps/i,      // Meta-analysis
  ];

  /**
   * Generic observation patterns that describe behavior without emotional insight
   * These look like triggers but don't reveal actual pain/fear/desire
   */
  private readonly GENERIC_OBSERVATION_PATTERNS = [
    // Behavior observations (not triggers)
    /professionals seek/i,
    /founders (constantly )?(compare|evaluate|explore)/i,
    /companies seek/i,
    /teams (need|want|require|look for)/i,
    /users (often|frequently|typically|commonly)/i,
    /organizations (seek|need|want)/i,
    /businesses (explore|evaluate|compare)/i,
    /buyers (research|compare|evaluate)/i,

    // Generic quality/capability statements
    /provide(s)? (deeper|better|comprehensive|detailed)/i,
    /reveal(s)? competitive advantages/i,
    /offer(s)? (comprehensive|innovative|robust)/i,
    /deliver(s)? (value|results|insights)/i,

    // Meta-commentary about tools/solutions
    /across (startup|saas|software|tech) communities/i,
    /competing solutions/i,
    /software solutions for/i,
    /to make strategic decisions/i,
    /to enhance operational/i,
    /for operational challenges/i,

    // Industry/market observations
    /industry (trends|insights|analysis)/i,
    /market (analysis|comparison|research)/i,
    /platform comparisons/i,
  ];

  /**
   * Valid trigger patterns - must contain emotional/psychological language
   * A real trigger has: WHO + PROBLEM/PAIN + EMOTIONAL IMPACT
   * EXPANDED: Now includes technical pain points (hallucinate, errors, slow, etc.)
   */
  private readonly VALID_TRIGGER_INDICATORS = [
    // Fear indicators
    /fear(s|ed|ful)?|afraid|worried|anxious|nervous|scared|concern(ed)?/i,

    // Frustration indicators
    /frustrat(ed|ing|ion)|annoyed|irritat(ed|ing)|hate(s)?|sick of|tired of/i,

    // Pain indicators - FIXED: Added "ing" variants (struggling, challenging, etc.)
    /struggl(e|es|ed|ing)?|difficult(y)?|challeng(e|es|ed|ing)?|pain(ful)?|problem(s)?|issue(s)?/i,

    // Desire indicators
    /want(s|ed)?|need(s|ed)?|wish(es)?|hope(s)?|looking for|searching for/i,

    // Urgency indicators
    /urgent|deadline|pressure|forced to|have to|must|immediately/i,

    // Consequence indicators
    /fail(s|ed|ure)?|lose|lost|miss(ed)?|cost(s|ly)?|waste(d)?|broke(n)?/i,

    // Trust indicators
    /trust|doubt(s)?|skeptic(al)?|suspicious|uncertain|risky/i,

    // Technical pain indicators (NEW - captures AI/tech frustrations)
    /hallucinate(s|d)?|wrong|error(s)?|bug(s|gy)?|slow|crash(es|ed)?|freeze(s)?/i,
    /resist(s|ance)?|reject(s|ed)?|confus(ed|ing|ion)|give(s)? up|won't|doesn't work/i,
    /unreliable|inconsistent|unpredictable|inaccurate|incorrect/i,

    // Adoption/change indicators (NEW - captures resistance to change)
    /adopt(ion)?|implement(ation)?|switch(ing)?|migrat(e|ion)|transition/i,
    /replace|upgrade|integrate|onboard/i,

    // Opportunity indicators (NEW - captures positive triggers too)
    /opportunity|potential|emerging|growing|trend(ing)?|shift(ing)?/i,
    /automat(e|ion|ing)|streamline|simplif(y|ied)|transform(ation)?/i,

    // Positive emotion indicators (NEW - captures aspirational triggers)
    /excit(ed|ing|ement)?|motivat(ed|ing|ion)?|eager|enthusias(tic|m)/i,
    /inspir(ed|ing)|optimis(tic|m)|confident|ready to|looking forward/i,
  ];

  /**
   * Check if a title is valid (not garbage/meta-commentary)
   */
  private isValidTitle(title: string): boolean {
    if (!title || title.length < 5 || title.length > 100) return false;

    // Check against invalid patterns
    for (const pattern of this.INVALID_TITLE_PATTERNS) {
      if (pattern.test(title)) {
        console.log(`[LLMTriggerSynthesizer] Rejected garbage title: "${title.substring(0, 60)}..."`);
        return false;
      }
    }

    // Check for generic observations (behavior without emotion)
    for (const pattern of this.GENERIC_OBSERVATION_PATTERNS) {
      if (pattern.test(title)) {
        console.log(`[LLMTriggerSynthesizer] Rejected generic observation: "${title.substring(0, 60)}..."`);
        return false;
      }
    }

    // REQUIRE emotional/psychological language for valid triggers
    const hasEmotionalContent = this.VALID_TRIGGER_INDICATORS.some(pattern => pattern.test(title));
    if (!hasEmotionalContent) {
      console.log(`[LLMTriggerSynthesizer] Rejected non-emotional title: "${title.substring(0, 60)}..."`);
      return false;
    }

    return true;
  }

  /**
   * Recover complete JSON objects from a truncated JSON array
   * When max_tokens is hit, the response may be cut mid-object
   * This extracts all complete objects that were successfully output
   */
  private recoverTruncatedJsonArray(jsonStr: string): any[] {
    const results: any[] = [];

    // Remove leading [ if present
    let str = jsonStr.trim();
    if (str.startsWith('[')) {
      str = str.substring(1);
    }

    // Find complete objects by matching balanced braces
    let depth = 0;
    let objectStart = -1;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === '{') {
        if (depth === 0) {
          objectStart = i;
        }
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0 && objectStart !== -1) {
          // Found a complete object
          const objStr = str.substring(objectStart, i + 1);
          try {
            const obj = JSON.parse(objStr);
            results.push(obj);
          } catch {
            // Invalid object, skip
          }
          objectStart = -1;
        }
      }
    }

    return results;
  }

  /**
   * Parse the LLM response into SynthesizedTrigger[]
   */
  private parseResponse(response: string): SynthesizedTrigger[] {
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = response;

      // ROBUST FIX: Handle multiple markdown fence formats
      // 1. ```json\n...\n``` (standard)
      // 2. ```\n...\n``` (no language specifier)
      // 3. Leading/trailing text outside fences
      // 4. Multiple possible code blocks (take first one)

      // First try: Look for ```json or ``` code block
      const jsonMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonStr = jsonMatch[1].trim();
      } else {
        // Second try: Strip leading/trailing non-JSON content
        // Find the first [ or { and last ] or }
        const firstBracket = response.search(/[\[{]/);
        const lastBracket = Math.max(response.lastIndexOf(']'), response.lastIndexOf('}'));

        if (firstBracket !== -1 && lastBracket > firstBracket) {
          jsonStr = response.substring(firstBracket, lastBracket + 1);
        }
      }

      // Final cleanup: remove any stray backticks that might have slipped through
      jsonStr = jsonStr.replace(/^`+|`+$/g, '').trim();

      let parsed: any[];
      try {
        parsed = JSON.parse(jsonStr);
      } catch (parseError) {
        // Try to recover from truncated JSON array
        // Find all complete JSON objects in the array
        console.log('[LLMTriggerSynthesizer] JSON parse failed, attempting truncation recovery...');
        const recovered = this.recoverTruncatedJsonArray(jsonStr);
        if (recovered.length > 0) {
          console.log(`[LLMTriggerSynthesizer] Recovered ${recovered.length} complete triggers from truncated response`);
          parsed = recovered;
        } else {
          throw parseError; // Re-throw if recovery failed
        }
      }

      if (!Array.isArray(parsed)) {
        console.warn('[LLMTriggerSynthesizer] Response is not an array');
        return [];
      }

      // Validate each trigger AND filter out garbage titles
      const valid = parsed.filter(t => {
        // Basic validation
        if (!t.category || !t.title || !t.executiveSummary || !Array.isArray(t.evidence)) {
          return false;
        }

        // Filter out garbage/meta-commentary titles
        if (!this.isValidTitle(t.title)) {
          return false;
        }

        // Filter out executive summaries that contain meta-commentary, placeholders, or prompt leakage
        const summaryGarbagePatterns = [
          /^\*\*note/i,
          /the search results/i,
          /altkomsoftware/i,
          /\[competitor\]/i,
          /\[company\]/i,
          // PHASE K.2: Prompt leakage patterns
          /show the before\/after transformation/i,  // Prompt instruction leaking
          /use testimonials that speak/i,            // Prompt instruction leaking
          /demo how you solve/i,                     // Prompt instruction leaking
          /address this fear head-on/i,              // Prompt instruction leaking
          /use case studies and guarantees/i,        // Prompt instruction leaking
          /there are no quotes/i,                    // "No data" response
          /no quotes describing/i,                   // "No data" response
          /no first-person/i,                        // "No data" response
          /were not found/i,                         // "No data" response
          /in the provided search/i,                 // Meta-commentary
          /Source: (Roots|Saifr|Convin)\./i,         // Raw source names being exposed
        ];

        if (summaryGarbagePatterns.some(p => p.test(t.executiveSummary))) {
          console.log(`[LLMTriggerSynthesizer] Rejected garbage summary for: "${t.title}"`);
          return false;
        }

        // Filter out triggers containing BANNED GENERIC TERMS (NAICS-style)
        const combinedText = `${t.title} ${t.executiveSummary}`.toLowerCase();
        for (const bannedTerm of BANNED_GENERIC_TERMS) {
          if (combinedText.includes(bannedTerm.toLowerCase())) {
            console.log(`[LLMTriggerSynthesizer] Rejected trigger with banned term "${bannedTerm}": "${t.title}"`);
            return false;
          }
        }

        return true;
      });

      console.log(`[LLMTriggerSynthesizer] Parsed ${valid.length} valid triggers (rejected ${parsed.length - valid.length} garbage)`);
      return valid;
    } catch (error) {
      console.error('[LLMTriggerSynthesizer] Failed to parse response:', error);
      console.log('[LLMTriggerSynthesizer] Raw response:', response.substring(0, 500));
      return [];
    }
  }

  /**
   * Convert SynthesizedTrigger[] to ConsolidatedTrigger[]
   * Uses sampleIndex to look up original URLs from raw data
   */
  private convertToConsolidatedTriggers(synthesized: SynthesizedTrigger[]): ConsolidatedTrigger[] {
    return synthesized.map((st, idx) => {
      const evidence: EvidenceItem[] = st.evidence.map((e, eIdx) => {
        // Look up original sample by sampleIndex to get URL
        let url: string | undefined;
        let author: string | undefined;

        let competitorName: string | undefined;

        if (e.sampleIndex && e.sampleIndex > 0 && e.sampleIndex <= this.lastSamples.length) {
          const originalSample = this.lastSamples[e.sampleIndex - 1]; // 1-indexed
          url = e.url || originalSample?.url;
          author = e.author || originalSample?.author;
          competitorName = originalSample?.competitorName;
        } else {
          url = e.url;
          author = e.author;
        }

        // Try to extract competitor name from source if not provided
        if (!competitorName && e.source) {
          // Check for "X reviews" or "X Review" pattern (e.g., "HubSpot reviews")
          const reviewMatch = e.source.match(/^([A-Z][a-zA-Z0-9]+)\s+reviews?$/i);
          if (reviewMatch) {
            competitorName = reviewMatch[1];
          }
        }

        return {
          id: `llm-ev-${idx}-${eIdx}`,
          source: e.source,
          platform: e.platform,
          quote: e.quote,
          url,
          author,
          sentiment: this.detectSentiment(e.quote),
          confidence: st.confidence,
          competitorName,
        };
      });

      return {
        id: `llm-trigger-${idx}`,
        category: st.category,
        title: st.title,
        executiveSummary: st.executiveSummary,
        confidence: st.confidence,
        evidenceCount: evidence.length,
        evidence,
        uvpAlignments: [], // Will be filled by consolidation service
        isTimeSensitive: st.isTimeSensitive,
        profileRelevance: 1.0, // Will be adjusted by consolidation service
        rawSourceIds: evidence.map(e => e.id),
        isLLMSynthesized: true, // Flag to skip regex processing
        buyerJourneyStage: st.buyerJourneyStage || 'problem-aware',
        buyerProductFit: st.buyerProductFit || st.confidence,
        buyerProductFitReasoning: st.buyerProductFitReasoning,
      } as ConsolidatedTrigger & { isLLMSynthesized: boolean; buyerJourneyStage: BuyerJourneyStage; buyerProductFit: number; buyerProductFitReasoning?: string };
    });
  }

  /**
   * Simple sentiment detection
   */
  private detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const lower = text.toLowerCase();
    const negativeWords = ['hate', 'frustrated', 'angry', 'terrible', 'awful', 'worst', 'fail', 'broken'];
    const positiveWords = ['love', 'great', 'amazing', 'excellent', 'best', 'wonderful', 'perfect'];

    const negScore = negativeWords.filter(w => lower.includes(w)).length;
    const posScore = positiveWords.filter(w => lower.includes(w)).length;

    if (negScore > posScore) return 'negative';
    if (posScore > negScore) return 'positive';
    return 'neutral';
  }

  /**
   * Extract product category from UVP
   * This is CRITICAL for buyer-product fit validation
   *
   * Works across all 6 profile types by using actual UVP text, not hardcoded keywords
   */
  private extractProductCategory(uvp: CompleteUVP): string {
    // Priority order: Unique Solution > Key Benefit > Transformation
    // These fields describe WHAT the product/service actually is

    const uniqueSolution = uvp.uniqueSolution?.statement?.trim() || '';
    const keyBenefit = uvp.keyBenefit?.statement?.trim() || '';
    const transformation = uvp.transformationGoal?.statement?.trim() || uvp.transformationGoal?.after?.trim() || '';

    // Use Unique Solution if available (most specific description of product)
    if (uniqueSolution && uniqueSolution.length > 10) {
      // Extract a concise version (first sentence or first 100 chars)
      const firstSentence = uniqueSolution.split(/[.!?]/)[0];
      if (firstSentence && firstSentence.length > 10 && firstSentence.length < 150) {
        return firstSentence.trim();
      }
      // Fallback to truncated version
      return uniqueSolution.substring(0, 100).trim();
    }

    // Use Key Benefit if no unique solution
    if (keyBenefit && keyBenefit.length > 10) {
      const firstSentence = keyBenefit.split(/[.!?]/)[0];
      if (firstSentence && firstSentence.length > 10 && firstSentence.length < 150) {
        return firstSentence.trim();
      }
      return keyBenefit.substring(0, 100).trim();
    }

    // Use Transformation goal
    if (transformation && transformation.length > 10) {
      return transformation.substring(0, 100).trim();
    }

    // Last resort fallback
    return 'this product/service';
  }
}

// Export singleton
export const llmTriggerSynthesizer = new LLMTriggerSynthesizerService();
