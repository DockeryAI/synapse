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

// OpenRouter API endpoint
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Fast model for extraction
const MODEL = 'anthropic/claude-opus-4.5'; // Opus 4.5 for quality testing

interface OrchestratorRequest {
  websiteContent: string;
  businessName: string;
  industry: string;
  testimonials?: string[];
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
 * Make AI call to OpenRouter
 */
async function callAI(prompt: string, maxTokens: number = 4000): Promise<string> {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://synapse-smb.com',
      'X-Title': 'Synapse Intelligence Orchestrator',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
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
 */
async function extractProducts(content: string, businessName: string): Promise<any[]> {
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
    const response = await callAI(prompt, 6000);
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
 */
async function extractCustomers(content: string, businessName: string, industry: string): Promise<any[]> {
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
    const response = await callAI(prompt, 6000);
    return parseJSON(response);
  } catch (e) {
    console.error('[Customers] Extraction failed:', e);
    return [];
  }
}

/**
 * Extract differentiators
 */
async function extractDifferentiators(content: string, businessName: string): Promise<any[]> {
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
    const response = await callAI(prompt);
    return parseJSON(response);
  } catch (e) {
    console.error('[Differentiators] Extraction failed:', e);
    return [];
  }
}

/**
 * Extract buyer personas
 */
async function extractBuyerPersonas(content: string, businessName: string, industry: string): Promise<any[]> {
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
    const response = await callAI(prompt);
    return parseJSON(response);
  } catch (e) {
    console.error('[BuyerPersonas] Extraction failed:', e);
    return [];
  }
}

/**
 * Extract customer transformations (before → after)
 */
async function extractTransformations(content: string, businessName: string): Promise<any[]> {
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
    const response = await callAI(prompt);
    return parseJSON(response);
  } catch (e) {
    console.error('[Transformations] Extraction failed:', e);
    return [];
  }
}

/**
 * Extract benefits using FAB Framework (Features → Advantages → Benefits)
 * Apply the "So What?" test until reaching identity/emotional transformation
 */
async function extractBenefits(content: string, businessName: string): Promise<any[]> {
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
    const response = await callAI(prompt, 5000);
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

    // =========================================================================
    // RUN ALL 6 EXTRACTIONS IN PARALLEL - NO BROWSER CONNECTION LIMITS!
    // =========================================================================
    const [
      products,
      customers,
      differentiators,
      buyerPersonas,
      transformations,
      benefits
    ] = await Promise.all([
      extractProducts(body.websiteContent, body.businessName),
      extractCustomers(body.websiteContent, body.businessName, body.industry || 'general'),
      extractDifferentiators(body.websiteContent, body.businessName),
      extractBuyerPersonas(body.websiteContent, body.businessName, body.industry || 'general'),
      extractTransformations(body.websiteContent, body.businessName),
      extractBenefits(body.websiteContent, body.businessName),
    ]);

    const extractionTime = Date.now() - startTime;

    console.log(`[Orchestrator] ========================================`);
    console.log(`[Orchestrator] PARALLEL EXTRACTION COMPLETE`);
    console.log(`[Orchestrator] Time: ${extractionTime}ms (${(extractionTime / 1000).toFixed(1)}s)`);
    console.log(`[Orchestrator] Results:`);
    console.log(`  - Products: ${products.length}`);
    console.log(`  - Customers: ${customers.length}`);
    console.log(`  - Differentiators: ${differentiators.length}`);
    console.log(`  - Buyer Personas: ${buyerPersonas.length}`);
    console.log(`  - Transformations: ${transformations.length}`);
    console.log(`  - Benefits: ${benefits.length}`);
    console.log(`[Orchestrator] ========================================`);

    const result: ExtractionResult = {
      products,
      customers,
      differentiators,
      buyerPersonas,
      transformations,
      benefits,
      extractionTime,
      parallelCalls: 6,
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
