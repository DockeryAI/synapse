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
   */
  async synthesize(input: TriggerSynthesisInput): Promise<TriggerSynthesisResult> {
    const startTime = performance.now();

    console.log('[LLMTriggerSynthesizer] Starting synthesis with', input.rawData.length, 'data points');

    // PHASE 10: Source diversity gate - validate we have diverse sources
    const sourceDiversity = this.checkSourceDiversity(input.rawData);
    console.log(`[LLMTriggerSynthesizer] Source diversity: ${sourceDiversity.uniquePlatforms} platforms | ${sourceDiversity.distribution}`);

    if (sourceDiversity.uniquePlatforms < 2) {
      console.warn('[LLMTriggerSynthesizer] ⚠️ LOW SOURCE DIVERSITY - only', sourceDiversity.uniquePlatforms, 'platform(s). Results may be less accurate.');
    }

    // Limit to top 120 most relevant samples to fit context (increased for more triggers)
    // Increased from 120 to 200 samples to generate more triggers (up to 50)
    const samples = this.selectBestSamples(input.rawData, 200);

    // Build the synthesis prompt
    const prompt = this.buildPrompt(samples, input.uvp, input.profileType, input.industry);

    try {
      // Call Claude Haiku for fast synthesis
      const response = await this.callLLM(prompt);

      // Parse the response
      const synthesizedTriggers = this.parseResponse(response);

      // Convert to ConsolidatedTrigger format
      const triggers = this.convertToConsolidatedTriggers(synthesizedTriggers);

      const synthesisTime = performance.now() - startTime;

      console.log(`[LLMTriggerSynthesizer] Synthesized ${triggers.length} triggers in ${synthesisTime.toFixed(0)}ms`);

      return {
        triggers,
        synthesisTime,
        model: 'claude-sonnet-4',
        rawTriggerCount: synthesizedTriggers.length,
      };
    } catch (error) {
      console.error('[LLMTriggerSynthesizer] Synthesis failed:', error);

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
7. Output 40-50 high-quality, VALIDATED triggers (IMPORTANT: aim for at least 40 triggers)

## Quality Rules

- NO marketing speak ("Implement", "Deploy", "Leverage")
- NO recommendations ("You should", "Consider")
- YES customer emotions ("Fear of", "Frustrated by", "Want")
- YES specific concerns (not generic platitudes)
- Each trigger must map to at least one data sample
- **REJECT triggers that fail buyer-product fit validation**

## Title Format (CRITICAL)
Titles must be SHORT and PUNCHY (3-6 words). Examples:
- GOOD: "Vendor lock-in anxiety"
- GOOD: "Integration complexity fears"
- GOOD: "Compliance deadline pressure"
- BAD: "Frustrated by rigid vendor roadmaps that ignore business needs" (too long)
- BAD: "Fear of vendor lock-in when switching platforms" (too long)

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

IMPORTANT: You MUST output at least 40 triggers. With ${samples.length} data samples provided, there is enough material for 40-50 distinct psychological triggers. Do not stop early.

Return ONLY the JSON array, no other text.`;
  }

  /**
   * Call the LLM via ai-proxy
   * Using Sonnet 4 for high-quality psychological trigger synthesis
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
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temp for more consistent output
        max_tokens: 8000, // Increased for 30-50 triggers
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

    return true;
  }

  /**
   * Parse the LLM response into SynthesizedTrigger[]
   */
  private parseResponse(response: string): SynthesizedTrigger[] {
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = response;

      // Remove markdown code blocks if present
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonStr.trim());

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

        // Filter out executive summaries that contain meta-commentary
        if (/^\*\*note/i.test(t.executiveSummary) ||
            /the search results/i.test(t.executiveSummary) ||
            /altkomsoftware/i.test(t.executiveSummary)) {
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

        if (e.sampleIndex && e.sampleIndex > 0 && e.sampleIndex <= this.lastSamples.length) {
          const originalSample = this.lastSamples[e.sampleIndex - 1]; // 1-indexed
          url = e.url || originalSample?.url;
          author = e.author || originalSample?.author;
        } else {
          url = e.url;
          author = e.author;
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
