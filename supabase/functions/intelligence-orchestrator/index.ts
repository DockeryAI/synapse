/**
 * Intelligence Orchestrator Edge Function
 *
 * Server-side parallel AI extraction - BYPASSES browser connection limits!
 *
 * Architecture (Netflix/Uber API Gateway Pattern):
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                         BROWSER (1 TCP connection)                          │
 * │                                    │                                        │
 * │                                    ▼                                        │
 * │  ┌─────────────────────────────────────────────────────────────────────┐   │
 * │  │              EDGE FUNCTION (no connection limits)                    │   │
 * │  │                                                                      │   │
 * │  │   Promise.all([                                                      │   │
 * │  │     extractProducts(),      // AI Call 1                             │   │
 * │  │     extractCustomers(),     // AI Call 2                             │   │
 * │  │     extractDifferentiators(),// AI Call 3                            │   │
 * │  │     extractBuyerIntel(),    // AI Call 4                             │   │
 * │  │     extractTransformations() // AI Call 5                            │   │
 * │  │   ])                                                                 │   │
 * │  └─────────────────────────────────────────────────────────────────────┘   │
 * │                                    │                                        │
 * │                                    ▼                                        │
 * │                         ALL RESULTS (~30-40 seconds)                        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * Created: 2025-11-25
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// API endpoints - DUAL PROVIDER for true parallelism
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

// Model IDs per provider
// Phase 1 uses FAST model (Sonnet) for quick products page load (~5s vs ~18s)
// Phase 2 uses QUALITY model (Opus) for deep insights in background
const OPENROUTER_MODEL_FAST = 'anthropic/claude-sonnet-4'; // Fast for Phase 1
const OPENROUTER_MODEL_QUALITY = 'anthropic/claude-opus-4.5'; // Quality for Phase 2
const ANTHROPIC_MODEL = 'claude-opus-4-5-20251101'; // Anthropic direct API format for Opus 4.5

// Provider type
type Provider = 'openrouter' | 'anthropic';

interface OrchestratorRequest {
  websiteContent: string;
  businessName: string;
  industry: string;
  testimonials?: string[];
  /** Optional phase for progressive loading: 1 = Products/Customers/Differentiators, 2 = BuyerPersonas/Transformations/Benefits, undefined = all */
  phase?: 1 | 2;
}

interface ExtractionResult {
  products: any[];
  customers: any[];
  differentiators: any[];
  buyerPersonas: any[];
  transformations: any[];
  benefits: any[];
  extractionTime: number;
  parallelCalls: number;
}

/**
 * Get API key by index for 4-key rotation (parallel processing)
 * Keys: OPENROUTER_API_KEY_1, _2, _3, _4 (falls back to OPENROUTER_API_KEY)
 */
function getApiKey(keyIndex: number): string {
  // Try numbered key first
  const numberedKey = Deno.env.get(`OPENROUTER_API_KEY_${keyIndex + 1}`);
  if (numberedKey && numberedKey.length > 10) {
    return numberedKey;
  }

  // Fall back to default key
  const defaultKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!defaultKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }
  return defaultKey;
}

// Global timing tracker for debugging
const timingLog: { name: string; provider: string; startedAt: number; completedAt: number; duration: number }[] = [];
let globalStartTime = 0;

/**
 * Get Anthropic API key
 */
function getAnthropicKey(): string {
  const key = Deno.env.get('ANTHROPIC_API_KEY');
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }
  return key;
}

/**
 * Make AI call to specified provider
 * DUAL PROVIDER: OpenRouter OR Anthropic Direct for true parallelism
 * useFastModel: true = Sonnet (fast, ~5s), false = Opus (quality, ~18s)
 * keyIndex: Which API key to use (0-3) for parallel distribution across rate limits
 */
async function callAI(prompt: string, maxTokens: number = 4000, provider: Provider = 'openrouter', callName: string = 'unknown', useFastModel: boolean = false, keyIndex: number = 0): Promise<string> {
  const startedAt = Date.now() - globalStartTime;
  const model = useFastModel ? 'FAST (Sonnet)' : 'QUALITY (Opus)';

  console.log(`[TIMING] ${callName} STARTED at +${startedAt}ms (${provider}, ${model}, key${keyIndex + 1})`);

  let response: Response;
  let content: string;

  if (provider === 'anthropic') {
    // Anthropic Direct API
    const apiKey = getAnthropicKey();
    response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      const completedAt = Date.now() - globalStartTime;
      console.log(`[TIMING] ${callName} FAILED at +${completedAt}ms (${provider}): ${error}`);
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    content = data.content?.[0]?.text || '';

  } else {
    // OpenRouter API - use keyIndex for parallel distribution across rate limits
    const apiKey = getApiKey(keyIndex);
    // Select model based on speed requirement: Sonnet (~5s) vs Opus (~18s)
    const modelId = useFastModel ? OPENROUTER_MODEL_FAST : OPENROUTER_MODEL_QUALITY;
    response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://synapse-smb.com',
        'X-Title': 'Synapse Intelligence Orchestrator',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      const completedAt = Date.now() - globalStartTime;
      console.log(`[TIMING] ${callName} FAILED at +${completedAt}ms (${provider}): ${error}`);
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    content = data.choices?.[0]?.message?.content || '';
  }

  const completedAt = Date.now() - globalStartTime;
  const duration = completedAt - startedAt;

  console.log(`[TIMING] ${callName} COMPLETED at +${completedAt}ms (duration: ${duration}ms, ${provider})`);

  // Record timing for response
  timingLog.push({ name: callName, provider, startedAt, completedAt, duration });

  return content;
}

/**
 * Parse JSON from AI response, handling markdown code blocks
 */
function parseJSON(text: string): any {
  let jsonText = text.trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.slice(7);
  }
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.slice(3);
  }
  if (jsonText.endsWith('```')) {
    jsonText = jsonText.slice(0, -3);
  }
  return JSON.parse(jsonText.trim());
}

/**
 * Extract products/services with FAB (Feature → Advantage → Benefit) cascade
 * @param provider - Which API provider to use
 */
async function extractProducts(content: string, businessName: string, provider: Provider = 'openrouter', useFastModel: boolean = false, keyIndex: number = 0): Promise<any[]> {
  const prompt = `You are extracting ALL products, services, features, and offerings from ${businessName}'s website using the FAB Framework.

WEBSITE CONTENT:
${content.slice(0, 12000)}

═══════════════════════════════════════════════════════════════════════════
FAB FRAMEWORK - Apply "So What?" to EVERY item you extract
═══════════════════════════════════════════════════════════════════════════

For each product/service/feature, think through:
FEATURE (What it is) → "So what?" → ADVANTAGE (What it does) → "So what?" → BENEFIT (Why they care)

WEAK EXTRACTION (stops at feature):
❌ "AI Policy Expert"
❌ "24/7 Support"
❌ "Automated Workflows"

STRONG EXTRACTION (follows FAB):
✅ "AI Policy Expert that handles complex queries so customers get expert answers instantly without waiting"
✅ "24/7 Support that ensures you never miss an opportunity while you sleep"
✅ "Automated Workflows that eliminate repetitive tasks so you reclaim hours of your week"

═══════════════════════════════════════════════════════════════════════════

EXTRACT EVERYTHING - be EXHAUSTIVE. Look for:
- Named products/services
- Features mentioned (then apply FAB!)
- Solutions offered
- Packages/tiers
- Integrations
- Capabilities
- Tools/modules

Return ONLY valid JSON array (no markdown):
[
  {
    "name": "Product/Service Name",
    "description": "What it does AND the benefit (apply FAB cascade - not just a feature!)",
    "category": "Core Service|Product|Add-on|Package|Solution|Feature|Integration",
    "confidence": 0-100,
    "sourceExcerpt": "exact quote from content"
  }
]

IMPORTANT:
- Extract AT LEAST 15-20 items if the content supports it
- EVERY description must include the BENEFIT, not just the feature
- Apply "So what?" test: If description only says what it IS, push to what it DOES for the customer
- Higher confidence (80+) for items with direct quotes and clear benefits`;

  try {
    const response = await callAI(prompt, 6000, provider, 'Products', useFastModel, keyIndex);
    console.log('[Products] Raw response length:', response.length);
    const parsed = parseJSON(response);
    console.log('[Products] Parsed items:', parsed?.length || 0);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('[Products] Extraction failed:', e);
    console.error('[Products] Will return empty array');
    return [];
  }
}

/**
 * Extract target customers with JTBD emotional/functional drivers
 * Using Jobs-to-be-Done and Golden Circle frameworks
 *
 * CRITICAL: Emotional drivers must be TRUE identity/feeling transformations,
 * NOT business metrics wrapped in emotional language.
 * @param keyIndex - API key index (0-3) for parallel distribution
 */
async function extractCustomers(content: string, businessName: string, industry: string, provider: Provider = 'openrouter', useFastModel: boolean = false, keyIndex: number = 0): Promise<any[]> {
  const prompt = `You are a JTBD (Jobs-to-be-Done) expert extracting customer profiles from ${businessName}'s website (${industry}).

WEBSITE CONTENT:
${content.slice(0, 12000)}

IDENTIFY ALL CUSTOMER TYPES by looking for:
- "Who we serve" / "For whom" sections
- Testimonials and case studies (extract the customer type)
- Industry mentions
- Use case descriptions
- Job titles/roles mentioned
- Company size indicators

Return ONLY valid JSON array (no markdown):
[
  {
    "statement": "Clear description of this customer type",
    "industry": "Their industry/vertical",
    "companySize": "small|medium|large|enterprise",
    "role": "Job title/role",
    "emotionalDrivers": ["TRUE emotional JTBD - who they want to BECOME"],
    "functionalDrivers": ["The practical progress they want to make"],
    "evidenceQuotes": ["Direct quote if found"],
    "confidence": 0-100
  }
]

═══════════════════════════════════════════════════════════════════════════
CRITICAL: EMOTIONAL DRIVERS VALIDATION
═══════════════════════════════════════════════════════════════════════════

emotionalDrivers must answer: "Who do they want to BECOME?" or "How do they want to FEEL about THEMSELVES?"

These are BUSINESS METRICS (WRONG - DO NOT USE):
❌ "Fear of losing revenue"
❌ "Anxiety about conversion rates"
❌ "Frustration with low efficiency"
❌ "Desire for better ROI"
❌ "Worry about missing opportunities"
❌ "Fear of falling behind competitors"

These are TRUE EMOTIONAL/IDENTITY DRIVERS (CORRECT - USE THESE):
✅ "Want to feel proud when presenting work to leadership"
✅ "Want to become the go-to expert their team relies on"
✅ "Want to stop feeling like an imposter in meetings"
✅ "Want to feel confident walking into board presentations"
✅ "Want to be seen as innovative, not stuck in the past"
✅ "Want to feel in control instead of constantly firefighting"
✅ "Want to stop dreading Monday mornings"
✅ "Want to feel they're building something meaningful"
✅ "Want to be the person who finally solved the problem"

THE TEST: Would they share this with a therapist, not just a boss?
If it's about business metrics (revenue, efficiency, conversion), it's WRONG.
If it's about identity, self-worth, or emotional state, it's RIGHT.

TRANSFORM ANY BUSINESS METRICS YOU FIND:
"Fear of losing revenue" → "Want to feel confident they won't be blindsided"
"Desire for efficiency" → "Want to feel in control of their time"
"Frustration with manual work" → "Want to feel like they're working smart, not just hard"

═══════════════════════════════════════════════════════════════════════════

IMPORTANT:
- Extract AT LEAST 8-10 distinct customer profiles
- Each MUST have 2-3 TRUE emotionalDrivers (identity/feeling transformation)
- Each MUST have 2-3 functionalDrivers (the practical progress they want)
- Create profiles for different industries, roles, and company sizes`;

  try {
    const response = await callAI(prompt, 6000, provider, 'Customers', useFastModel, keyIndex);
    return parseJSON(response);
  } catch (e) {
    console.error('[Customers] Extraction failed:', e);
    return [];
  }
}

/**
 * Extract differentiators
 * @param keyIndex - API key index (0-3) for parallel distribution
 */
async function extractDifferentiators(content: string, businessName: string, provider: Provider = 'openrouter', useFastModel: boolean = false, keyIndex: number = 0): Promise<any[]> {
  const prompt = `Extract what makes ${businessName} different from competitors.

CONTENT:
${content.slice(0, 8000)}

Return ONLY valid JSON array (no markdown):
[
  {
    "statement": "What makes them different",
    "evidence": "Exact quote from website",
    "category": "methodology|process|proprietary|unique_feature|guarantee|expertise",
    "strengthScore": 0-100
  }
]

Rules:
- Extract UP TO 8 differentiators
- Look for: unique processes, guarantees, certifications, proprietary methods
- Higher score for unique, defensible advantages`;

  try {
    const response = await callAI(prompt, 4000, provider, 'Differentiators', useFastModel, keyIndex);
    return parseJSON(response);
  } catch (e) {
    console.error('[Differentiators] Extraction failed:', e);
    return [];
  }
}

/**
 * Extract buyer personas
 * @param keyIndex - API key index (0-3) for parallel distribution
 * @param useFastModel - Use Sonnet (fast) vs Opus (quality)
 */
async function extractBuyerPersonas(content: string, businessName: string, industry: string, provider: Provider = 'openrouter', keyIndex: number = 0, useFastModel: boolean = false): Promise<any[]> {
  const prompt = `Create detailed buyer personas from ${businessName}'s website (${industry}).

CONTENT:
${content.slice(0, 8000)}

Return ONLY valid JSON array (no markdown):
[
  {
    "name": "Descriptive persona name (e.g., 'The Growth-Focused CEO')",
    "title": "Job title",
    "industry": "Industry they work in",
    "painPoints": ["What problems they have"],
    "desiredOutcomes": ["What they want to achieve"],
    "buyingBehavior": "How they make purchasing decisions",
    "triggers": ["What events would trigger them to seek this solution"],
    "objections": ["Common objections they might have"],
    "confidence": 0-100
  }
]

Rules:
- Create UP TO 5 personas
- Base on testimonials, case studies, target audience mentions
- Include specific triggers and objections`;

  try {
    const response = await callAI(prompt, 4000, provider, 'BuyerPersonas', useFastModel, keyIndex);
    return parseJSON(response);
  } catch (e) {
    console.error('[BuyerPersonas] Extraction failed:', e);
    return [];
  }
}

/**
 * Extract customer transformations (before → after)
 * @param keyIndex - API key index (0-3) for parallel distribution
 * @param useFastModel - Use Sonnet (fast) vs Opus (quality)
 */
async function extractTransformations(content: string, businessName: string, provider: Provider = 'openrouter', keyIndex: number = 0, useFastModel: boolean = false): Promise<any[]> {
  const prompt = `Extract customer transformation stories from ${businessName}'s website.

CONTENT:
${content.slice(0, 8000)}

Return ONLY valid JSON array (no markdown):
[
  {
    "fromState": "Customer's problem/pain state BEFORE",
    "toState": "Customer's desired outcome state AFTER",
    "mechanism": "HOW ${businessName} enables this transformation",
    "timeline": "How long the transformation takes (if mentioned)",
    "metrics": "Measurable results (if mentioned)",
    "confidence": 0-100
  }
]

Rules:
- Extract UP TO 8 transformations
- Look for: case studies, testimonials, results mentioned
- Focus on outcome-focused language`;

  try {
    const response = await callAI(prompt, 4000, provider, 'Transformations', useFastModel, keyIndex);
    return parseJSON(response);
  } catch (e) {
    console.error('[Transformations] Extraction failed:', e);
    return [];
  }
}

/**
 * Extract benefits using FAB Framework (Features → Advantages → Benefits)
 * Apply the "So What?" test until reaching identity/emotional transformation
 * @param keyIndex - API key index (0-3) for parallel distribution
 * @param useFastModel - Use Sonnet (fast) vs Opus (quality)
 */
async function extractBenefits(content: string, businessName: string, provider: Provider = 'openrouter', keyIndex: number = 0, useFastModel: boolean = false): Promise<any[]> {
  const prompt = `You are a marketing expert using the FAB Framework to transform ${businessName}'s features into compelling customer benefits.

CONTENT:
${content.slice(0, 8000)}

═══════════════════════════════════════════════════════════════════════════
FAB FRAMEWORK - THE "SO WHAT?" CASCADE
═══════════════════════════════════════════════════════════════════════════

For EACH feature, apply the cascade until you reach identity/emotional level:

FEATURE (What it is)
    ↓ "So what?"
ADVANTAGE (What it does for them)
    ↓ "So what?"
BENEFIT (What outcome they get)
    ↓ "So what?"
TRANSFORMATION (Who they BECOME / How they FEEL about themselves)

═══════════════════════════════════════════════════════════════════════════

WEAK EXAMPLE (stops too early):
❌ "We help businesses with Jamie: AI Policy Expert that handles complex policy queries"

STRONG EXAMPLE (follows FAB cascade):
✅ Feature: "Jamie AI Policy Expert"
✅ Advantage: "Handles complex policy queries instantly, 24/7"
✅ Benefit: "Your customers get expert answers immediately without waiting"
✅ Transformation: "You become known as the company that actually cares about customer time—not just another faceless corporation"

MORE EXAMPLES:
Feature: "24/7 AI support"
→ Advantage: "Instant responses at any hour"
→ Benefit: "Never miss an opportunity while you sleep"
→ Transformation: "Feel confident you're always there for customers, even when you're not"

Feature: "Automated workflows"
→ Advantage: "Eliminates repetitive manual tasks"
→ Benefit: "Reclaim hours of your week"
→ Transformation: "Finally make it to your kid's soccer games without work guilt"

Return ONLY valid JSON array (no markdown):
[
  {
    "feature": "The specific feature or capability",
    "advantage": "What it does / how it helps",
    "benefit": "The outcome or result for the customer",
    "transformation": "Who they BECOME or how they FEEL about themselves (identity level)",
    "category": "time|money|risk|quality|convenience|status|identity",
    "confidence": 0-100
  }
]

Rules:
- Extract 8-12 feature-benefit chains
- EVERY benefit must go through the full FAB cascade to transformation
- transformation must be about IDENTITY or EMOTIONAL STATE, not business metrics
- Think: "What story can they tell about themselves now?"`;

  try {
    const response = await callAI(prompt, 5000, provider, 'Benefits', useFastModel, keyIndex);
    return parseJSON(response);
  } catch (e) {
    console.error('[Benefits] Extraction failed:', e);
    return [];
  }
}

/**
 * Main handler - orchestrates ALL extractions in parallel
 */
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const startTime = Date.now();

  try {
    const body: OrchestratorRequest = await req.json();

    if (!body.websiteContent || !body.businessName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: websiteContent, businessName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Orchestrator] Starting parallel extraction for: ${body.businessName}`);
    console.log(`[Orchestrator] Content length: ${body.websiteContent.length} chars`);
    console.log(`[Orchestrator] RAW body.phase value: "${body.phase}" (type: ${typeof body.phase})`);

    // =========================================================================
    // RUN ALL 6 EXTRACTIONS IN PARALLEL WITH 4-KEY ROTATION
    // Distributes load across 4 API keys for maximum throughput
    // =========================================================================
    globalStartTime = Date.now();
    timingLog.length = 0; // Clear previous timing data

    // PROGRESSIVE LOADING: Support phased extraction
    // Phase 0: Products ONLY (fastest path to first UI)
    // Phase 1: Customers ONLY (parallel with Phase 0)
    // Phase 2: Differentiators ONLY (after Products + Customers complete)
    // Phase 3: Benefits ONLY (after Differentiators complete)
    // No phase: All 6 extractions (legacy behavior)
    // IMPORTANT: Use !== undefined to handle phase=0 (0 is falsy in JS!)
    const phase = body.phase !== undefined ? Number(body.phase) : undefined;

    console.log(`[TIMING] ========== V2: PROMISE.ALL INITIATED (Phase: ${phase !== undefined ? phase : 'all'}, type: ${typeof phase}, raw: ${body.phase}) ==========`);

    let products: any[] = [];
    let customers: any[] = [];
    let differentiators: any[] = [];
    let buyerPersonas: any[] = [];
    let transformations: any[] = [];
    let benefits: any[] = [];
    let parallelCalls = 0;

    if (phase === 0) {
      // PHASE 0: Products ONLY - OpenRouter Opus 4.5
      console.log(`[TIMING] PHASE 0: Products ONLY (OpenRouter Opus 4.5)`);
      products = await extractProducts(body.websiteContent, body.businessName, 'openrouter', false, 0);
      parallelCalls = 1;
    } else if (phase === 1) {
      // PHASE 1: Customers ONLY - OpenRouter Opus 4.5
      console.log(`[TIMING] PHASE 1: Customers ONLY (OpenRouter Opus 4.5)`);
      customers = await extractCustomers(body.websiteContent, body.businessName, body.industry || 'general', 'openrouter', false, 0);
      parallelCalls = 1;
    } else if (phase === 2) {
      // PHASE 2: Differentiators ONLY - OpenRouter Opus 4.5
      console.log(`[TIMING] PHASE 2: Differentiators ONLY (OpenRouter Opus 4.5)`);
      differentiators = await extractDifferentiators(body.websiteContent, body.businessName, 'openrouter', false, 0);
      parallelCalls = 1;
    } else if (phase === 3) {
      // PHASE 3: Benefits ONLY - OpenRouter Opus 4.5
      console.log(`[TIMING] PHASE 3: Benefits ONLY (OpenRouter Opus 4.5)`);
      benefits = await extractBenefits(body.websiteContent, body.businessName, 'openrouter', 0, false);
      parallelCalls = 1;
    } else {
      // ALL PHASES: Full extraction (legacy behavior)
      // Uses 6 OpenRouter keys for maximum parallelism (Anthropic direct has no credits)
      console.log(`[TIMING] ALL PHASES: Full 6-call extraction (OpenRouter with key rotation)`);
      [products, customers, differentiators, buyerPersonas, transformations, benefits] = await Promise.all([
        extractProducts(body.websiteContent, body.businessName, 'openrouter', false, 0),      // OpenRouter Key 1
        extractCustomers(body.websiteContent, body.businessName, body.industry || 'general', 'openrouter', false, 1),  // OpenRouter Key 2
        extractDifferentiators(body.websiteContent, body.businessName, 'openrouter', false, 2), // OpenRouter Key 3
        extractBuyerPersonas(body.websiteContent, body.businessName, body.industry || 'general', 'openrouter', 3, false), // OpenRouter Key 4
        extractTransformations(body.websiteContent, body.businessName, 'openrouter', 0, false), // OpenRouter Key 1 (rotate)
        extractBenefits(body.websiteContent, body.businessName, 'openrouter', 1, false),       // OpenRouter Key 2 (rotate)
      ]);
      parallelCalls = 6;
    }

    const totalParallelTime = Date.now() - globalStartTime;
    console.log(`[TIMING] ========== PROMISE.ALL COMPLETED in ${totalParallelTime}ms ==========`);

    // Log timing analysis
    console.log(`[TIMING] === CALL TIMING ANALYSIS ===`);
    timingLog.forEach(t => {
      console.log(`[TIMING] ${t.name}: started +${t.startedAt}ms, completed +${t.completedAt}ms (${t.duration}ms) [${t.provider}]`);
    });
    const sumDurations = timingLog.reduce((sum, t) => sum + t.duration, 0);
    console.log(`[TIMING] Total time: ${totalParallelTime}ms | Sum of durations: ${sumDurations}ms | Parallel efficiency: ${((sumDurations / totalParallelTime) * 100).toFixed(0)}%`);

    const extractionTime = Date.now() - startTime;

    console.log(`[Orchestrator] ========================================`);
    console.log(`[Orchestrator] EXTRACTION COMPLETE (Phase: ${phase || 'all'})`);
    console.log(`[Orchestrator] Time: ${extractionTime}ms (${(extractionTime / 1000).toFixed(1)}s)`);
    console.log(`[Orchestrator] Results:`);
    if (phase !== 2) {
      console.log(`  - Products: ${products.length}`);
      console.log(`  - Customers: ${customers.length}`);
      console.log(`  - Differentiators: ${differentiators.length}`);
    }
    if (phase !== 1) {
      console.log(`  - Buyer Personas: ${buyerPersonas.length}`);
      console.log(`  - Transformations: ${transformations.length}`);
      console.log(`  - Benefits: ${benefits.length}`);
    }
    console.log(`[Orchestrator] ========================================`);

    const result = {
      products,
      customers,
      differentiators,
      buyerPersonas,
      transformations,
      benefits,
      extractionTime,
      parallelCalls,
      phase: phase !== undefined ? phase : 'all',
      // Include timing data for debugging
      _timing: {
        calls: timingLog,
        totalTime: totalParallelTime,
        sumDurations,
        parallelEfficiency: `${((sumDurations / totalParallelTime) * 100).toFixed(0)}%`,
        isParallel: totalParallelTime < sumDurations * 0.6,
      },
    };

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[Orchestrator] Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Orchestration failed',
        message: error.message,
        extractionTime: Date.now() - startTime
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

console.log('[Intelligence-Orchestrator] Edge Function ready...');
