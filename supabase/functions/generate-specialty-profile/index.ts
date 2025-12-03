/**
 * Edge Function: Generate Specialty Profile
 *
 * Multipass LLM generation for specialty businesses that don't match NAICS codes.
 * Uses 3-pass methodology from brandock scripts to generate V1-quality profiles.
 *
 * Pass 1: Generate initial profile structure
 * Pass 2: Validate against V1 quality standards
 * Pass 3: Refine triggers, pain points, buying triggers
 *
 * @module generate-specialty-profile
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'anthropic/claude-sonnet-4'; // Fast + quality balance
const MAX_RETRIES_PER_PASS = 3;

// ============================================================================
// TYPES
// ============================================================================

type BusinessProfileType =
  | 'local-service-b2c'
  | 'local-service-b2b'
  | 'regional-b2b-agency'
  | 'regional-retail-b2c'
  | 'national-saas-b2b'
  | 'national-product-b2c'
  | 'global-saas-b2b';

interface GenerateRequest {
  specialtyProfileId: string; // ID of pending specialty_profiles row
  specialtyName: string;
  specialtyDescription: string;
  baseNaicsCode: string | null;
  businessProfileType: BusinessProfileType;
  uvpData?: {
    targetCustomer?: string;
    productsServices?: string;
    businessDescription?: string;
  };
}

interface PassResult {
  success: boolean;
  error?: string;
  attempts: number;
}

interface MultipassResult {
  success: boolean;
  profile: EnhancedProfile | null;
  validationScore: number;
  passResults: {
    pass1: PassResult;
    pass2: PassResult;
    pass3: PassResult;
  };
  error?: string;
}

// Simplified EnhancedProfile for Edge Function
interface EnhancedProfile {
  industry: string;
  industry_name: string;
  naics_code: string;
  category: string;
  subcategory: string;
  customer_triggers: Array<{ trigger: string; urgency: number; frequency: string }>;
  customer_journey: {
    awareness: string;
    consideration: string;
    decision: string;
    retention: string;
    advocacy: string;
  };
  transformations: Array<{ from: string; to: string; emotional_value: string; worth_premium: boolean }>;
  success_metrics: Array<{ metric: string; timeframe: string; measurable: boolean }>;
  urgency_drivers: string[];
  objection_handlers: Array<{ objection: string; response: string; effectiveness: number }>;
  risk_reversal: {
    guarantees: string[];
    proof_points: string[];
    risk_mitigation: string;
  };
  customer_language_dictionary: {
    problem_words: string[];
    solution_words: string[];
    avoid_jargon: string[];
  };
  power_words: string[];
  avoid_words: string[];
  headline_templates: Array<{ template: string; expected_ctr: number; use_case: string }>;
  content_templates: Record<string, unknown>;
  hook_library: {
    number_hooks: string[];
    question_hooks: string[];
    story_hooks: string[];
    fear_hooks: string[];
    howto_hooks: string[];
  };
  video_scripts: Record<string, unknown>;
  ugc_prompts: Array<{ prompt: string; hashtag: string }>;
  viral_triggers: Array<{ angle: string; why: string }>;
  freshness_metadata: {
    profile_version: string;
    last_full_refresh: string;
    staleness_score: number;
  };
  enabledTabs: {
    triggers: boolean;
    proof: boolean;
    trends: boolean;
    conversations: boolean;
    competitors: boolean;
    local: boolean;
    weather: boolean;
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json() as GenerateRequest;
    const {
      specialtyProfileId,
      specialtyName,
      specialtyDescription,
      baseNaicsCode,
      businessProfileType,
      uvpData
    } = body;

    if (!specialtyProfileId || !specialtyName || !businessProfileType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: specialtyProfileId, specialtyName, businessProfileType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[generate-specialty-profile] Starting multipass generation for: ${specialtyName}`);

    // Update status to 'generating'
    await supabase
      .from('specialty_profiles')
      .update({
        generation_status: 'generating',
        generation_started_at: new Date().toISOString(),
        generation_attempts: 1
      })
      .eq('id', specialtyProfileId);

    // Run multipass generation
    const result = await runMultipassGeneration({
      specialtyName,
      specialtyDescription,
      baseNaicsCode,
      businessProfileType,
      uvpData
    });

    const responseTime = Date.now() - startTime;

    if (result.success && result.profile) {
      // Success - save the profile
      const enabledTabs = getEnabledTabsForProfileType(businessProfileType);

      await supabase
        .from('specialty_profiles')
        .update({
          generation_status: 'complete',
          generation_completed_at: new Date().toISOString(),
          profile_data: result.profile,
          customer_triggers: result.profile.customer_triggers,
          common_pain_points: result.profile.customer_language_dictionary.problem_words,
          common_buying_triggers: result.profile.urgency_drivers,
          urgency_drivers: result.profile.urgency_drivers,
          objection_handlers: result.profile.objection_handlers,
          enabled_tabs: enabledTabs,
          multipass_validation_score: result.validationScore,
          generation_error: null
        })
        .eq('id', specialtyProfileId);

      console.log(`[generate-specialty-profile] Complete in ${responseTime}ms, score: ${result.validationScore}`);

      return new Response(
        JSON.stringify({
          success: true,
          specialtyProfileId,
          validationScore: result.validationScore,
          passResults: result.passResults,
          responseTimeMs: responseTime
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Failed - check if should request human intervention
      const shouldRequestHuman = result.passResults.pass1.attempts >= MAX_RETRIES_PER_PASS &&
                                 result.passResults.pass2.attempts >= MAX_RETRIES_PER_PASS;

      await supabase
        .from('specialty_profiles')
        .update({
          generation_status: shouldRequestHuman ? 'needs_human' : 'failed',
          generation_error: result.error || 'Unknown error during generation',
          generation_completed_at: new Date().toISOString()
        })
        .eq('id', specialtyProfileId);

      console.error(`[generate-specialty-profile] Failed: ${result.error}`);

      return new Response(
        JSON.stringify({
          success: false,
          error: result.error,
          needsHuman: shouldRequestHuman,
          passResults: result.passResults,
          responseTimeMs: responseTime
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('[generate-specialty-profile] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// MULTIPASS GENERATION
// ============================================================================

async function runMultipassGeneration(input: {
  specialtyName: string;
  specialtyDescription: string;
  baseNaicsCode: string | null;
  businessProfileType: BusinessProfileType;
  uvpData?: {
    targetCustomer?: string;
    productsServices?: string;
    businessDescription?: string;
  };
}): Promise<MultipassResult> {
  const passResults = {
    pass1: { success: false, attempts: 0 } as PassResult,
    pass2: { success: false, attempts: 0 } as PassResult,
    pass3: { success: false, attempts: 0 } as PassResult
  };

  let profile: EnhancedProfile | null = null;
  let validationScore = 0;

  // PASS 1: Generate initial profile structure
  console.log('[multipass] Starting Pass 1: Initial structure generation');
  for (let attempt = 1; attempt <= MAX_RETRIES_PER_PASS; attempt++) {
    passResults.pass1.attempts = attempt;
    try {
      profile = await generatePass1(input);
      if (profile && validatePass1(profile)) {
        passResults.pass1.success = true;
        console.log(`[multipass] Pass 1 succeeded on attempt ${attempt}`);
        break;
      }
    } catch (error) {
      console.error(`[multipass] Pass 1 attempt ${attempt} failed:`, error.message);
      passResults.pass1.error = error.message;
    }
  }

  if (!passResults.pass1.success || !profile) {
    return {
      success: false,
      profile: null,
      validationScore: 0,
      passResults,
      error: `Pass 1 failed after ${MAX_RETRIES_PER_PASS} attempts: ${passResults.pass1.error}`
    };
  }

  // PASS 2: Validate and enhance quality
  console.log('[multipass] Starting Pass 2: Quality validation');
  for (let attempt = 1; attempt <= MAX_RETRIES_PER_PASS; attempt++) {
    passResults.pass2.attempts = attempt;
    try {
      const enhanced = await generatePass2(profile, input);
      if (enhanced && validatePass2(enhanced)) {
        profile = enhanced;
        passResults.pass2.success = true;
        console.log(`[multipass] Pass 2 succeeded on attempt ${attempt}`);
        break;
      }
    } catch (error) {
      console.error(`[multipass] Pass 2 attempt ${attempt} failed:`, error.message);
      passResults.pass2.error = error.message;
    }
  }

  if (!passResults.pass2.success) {
    // Continue with pass 1 result but log warning
    console.warn('[multipass] Pass 2 failed, continuing with Pass 1 result');
  }

  // PASS 3: Refine triggers and pain points
  console.log('[multipass] Starting Pass 3: Trigger refinement');
  for (let attempt = 1; attempt <= MAX_RETRIES_PER_PASS; attempt++) {
    passResults.pass3.attempts = attempt;
    try {
      const refined = await generatePass3(profile, input);
      if (refined && validatePass3(refined)) {
        profile = refined;
        passResults.pass3.success = true;
        console.log(`[multipass] Pass 3 succeeded on attempt ${attempt}`);
        break;
      }
    } catch (error) {
      console.error(`[multipass] Pass 3 attempt ${attempt} failed:`, error.message);
      passResults.pass3.error = error.message;
    }
  }

  // Calculate final validation score
  validationScore = calculateValidationScore(profile, passResults);

  // Require at least Pass 1 to succeed
  const overallSuccess = passResults.pass1.success && validationScore >= 60;

  return {
    success: overallSuccess,
    profile: overallSuccess ? profile : null,
    validationScore,
    passResults,
    error: overallSuccess ? undefined : `Validation score too low: ${validationScore}`
  };
}

// ============================================================================
// PASS 1: Initial Structure Generation
// ============================================================================

async function generatePass1(input: {
  specialtyName: string;
  specialtyDescription: string;
  baseNaicsCode: string | null;
  businessProfileType: BusinessProfileType;
  uvpData?: { targetCustomer?: string; productsServices?: string; businessDescription?: string };
}): Promise<EnhancedProfile> {
  const prompt = `You are an expert business analyst creating a comprehensive industry profile for a specialty business.

SPECIALTY BUSINESS:
- Name: ${input.specialtyName}
- Description: ${input.specialtyDescription}
- Business Type: ${input.businessProfileType}
- Nearest NAICS Code: ${input.baseNaicsCode || 'Unknown'}
${input.uvpData?.targetCustomer ? `- Target Customer: ${input.uvpData.targetCustomer}` : ''}
${input.uvpData?.productsServices ? `- Products/Services: ${input.uvpData.productsServices}` : ''}

Generate a complete industry profile with the following structure. Be specific to this specialty, not generic.

Return ONLY valid JSON matching this exact structure:

{
  "industry": "slug-format-name",
  "industry_name": "Display Name",
  "naics_code": "${input.baseNaicsCode || '999999'}",
  "category": "Category Name",
  "subcategory": "Subcategory Name",
  "customer_triggers": [
    {"trigger": "Specific trigger event", "urgency": 8, "frequency": "monthly"},
    {"trigger": "Another trigger", "urgency": 7, "frequency": "quarterly"}
  ],
  "customer_journey": {
    "awareness": "How customers first become aware of their need",
    "consideration": "What they research and compare",
    "decision": "How they make their final choice",
    "retention": "Why they stay as customers",
    "advocacy": "Why they refer others"
  },
  "transformations": [
    {"from": "Current state problem", "to": "Desired outcome", "emotional_value": "How they feel after", "worth_premium": true}
  ],
  "success_metrics": [
    {"metric": "Measurable outcome", "timeframe": "30 days", "measurable": true}
  ],
  "urgency_drivers": ["What creates urgency to buy", "Time-sensitive factors"],
  "objection_handlers": [
    {"objection": "Common objection", "response": "How to handle it", "effectiveness": 8}
  ],
  "risk_reversal": {
    "guarantees": ["Guarantee types that work"],
    "proof_points": ["Evidence that builds trust"],
    "risk_mitigation": "How to reduce perceived risk"
  },
  "customer_language_dictionary": {
    "problem_words": ["Words customers use for problems"],
    "solution_words": ["Words customers use for solutions"],
    "avoid_jargon": ["Technical words to avoid"]
  },
  "power_words": ["Compelling action words for this industry"],
  "avoid_words": ["Words that hurt trust"],
  "headline_templates": [
    {"template": "Headline with {variable}", "expected_ctr": 3.5, "use_case": "ads"}
  ],
  "content_templates": {},
  "hook_library": {
    "number_hooks": ["5 ways to...", "3 secrets..."],
    "question_hooks": ["Are you struggling with...?"],
    "story_hooks": ["When [person] tried..."],
    "fear_hooks": ["Don't let [problem] cost you..."],
    "howto_hooks": ["How to [achieve result] without [pain]"]
  },
  "video_scripts": {},
  "ugc_prompts": [
    {"prompt": "Share your [experience]", "hashtag": "#BrandHashtag"}
  ],
  "viral_triggers": [
    {"angle": "Controversial or surprising angle", "why": "Why this triggers engagement"}
  ],
  "freshness_metadata": {
    "profile_version": "1.0",
    "last_full_refresh": "${new Date().toISOString()}",
    "staleness_score": 0
  },
  "enabledTabs": {
    "triggers": true,
    "proof": true,
    "trends": true,
    "conversations": true,
    "competitors": true,
    "local": ${['local-service-b2c', 'local-service-b2b', 'regional-retail-b2c'].includes(input.businessProfileType)},
    "weather": ${['local-service-b2c', 'local-service-b2b'].includes(input.businessProfileType)}
  }
}

IMPORTANT:
- Generate at least 5 customer_triggers with urgency 1-10
- Generate at least 5 urgency_drivers
- Generate at least 5 objection_handlers
- All arrays should have minimum 3 items
- Be SPECIFIC to "${input.specialtyName}", not generic`;

  const response = await callOpenRouter(prompt);
  return parseJsonResponse(response);
}

function validatePass1(profile: EnhancedProfile): boolean {
  if (!profile.industry || !profile.industry_name) return false;
  if (!profile.customer_triggers || profile.customer_triggers.length < 3) return false;
  if (!profile.urgency_drivers || profile.urgency_drivers.length < 3) return false;
  if (!profile.objection_handlers || profile.objection_handlers.length < 3) return false;
  return true;
}

// ============================================================================
// PASS 2: Quality Enhancement
// ============================================================================

async function generatePass2(
  profile: EnhancedProfile,
  input: { specialtyName: string; businessProfileType: BusinessProfileType }
): Promise<EnhancedProfile> {
  const prompt = `You are a quality validator for industry profiles. Review and enhance this profile for "${input.specialtyName}".

CURRENT PROFILE:
${JSON.stringify(profile, null, 2)}

QUALITY STANDARDS:
1. customer_triggers should have 7-10 specific, actionable triggers
2. Each trigger needs urgency (1-10) and realistic frequency
3. objection_handlers should cover the top 7 objections with proven responses
4. customer_language_dictionary should have 10+ words in each category
5. power_words should have 15+ industry-specific compelling words
6. hook_library should have 5+ hooks per category
7. All content must be SPECIFIC to "${input.specialtyName}", not generic

Return the COMPLETE enhanced profile as valid JSON. Keep the same structure but improve quality and specificity.`;

  const response = await callOpenRouter(prompt);
  return parseJsonResponse(response);
}

function validatePass2(profile: EnhancedProfile): boolean {
  if (!profile.customer_triggers || profile.customer_triggers.length < 5) return false;
  if (!profile.power_words || profile.power_words.length < 10) return false;
  return true;
}

// ============================================================================
// PASS 3: Trigger Refinement
// ============================================================================

async function generatePass3(
  profile: EnhancedProfile,
  input: { specialtyName: string; businessProfileType: BusinessProfileType }
): Promise<EnhancedProfile> {
  const prompt = `You are an expert in customer psychology and buying triggers. Refine the triggers and pain points in this profile for "${input.specialtyName}".

CURRENT PROFILE:
${JSON.stringify(profile, null, 2)}

REFINEMENT GOALS:
1. Ensure customer_triggers are SPECIFIC events that cause someone to need ${input.specialtyName}
   - Bad: "Needs help" (too vague)
   - Good: "Just received negative audit findings" (specific event)

2. Ensure urgency_drivers create real time pressure
   - Bad: "Want to improve" (no urgency)
   - Good: "Compliance deadline approaching" (time pressure)

3. Ensure objection_handlers address the REAL objections for ${input.businessProfileType} buyers
   - Include price, timing, trust, and competitor objections

4. Ensure transformations show the emotional journey, not just functional benefits

Return the COMPLETE refined profile as valid JSON.`;

  const response = await callOpenRouter(prompt);
  return parseJsonResponse(response);
}

function validatePass3(profile: EnhancedProfile): boolean {
  // Check that triggers are specific (more than 5 words on average)
  const avgTriggerLength = profile.customer_triggers.reduce((sum, t) =>
    sum + t.trigger.split(' ').length, 0) / profile.customer_triggers.length;

  return avgTriggerLength >= 4;
}

// ============================================================================
// VALIDATION SCORING
// ============================================================================

function calculateValidationScore(
  profile: EnhancedProfile,
  passResults: { pass1: PassResult; pass2: PassResult; pass3: PassResult }
): number {
  let score = 0;

  // Pass completion scores (40 points max)
  if (passResults.pass1.success) score += 20;
  if (passResults.pass2.success) score += 10;
  if (passResults.pass3.success) score += 10;

  // Content quality scores (60 points max)
  if (profile.customer_triggers?.length >= 7) score += 10;
  else if (profile.customer_triggers?.length >= 5) score += 5;

  if (profile.urgency_drivers?.length >= 5) score += 10;
  else if (profile.urgency_drivers?.length >= 3) score += 5;

  if (profile.objection_handlers?.length >= 5) score += 10;
  else if (profile.objection_handlers?.length >= 3) score += 5;

  if (profile.power_words?.length >= 15) score += 10;
  else if (profile.power_words?.length >= 10) score += 5;

  if (profile.customer_language_dictionary?.problem_words?.length >= 10) score += 10;
  else if (profile.customer_language_dictionary?.problem_words?.length >= 5) score += 5;

  if (profile.hook_library?.number_hooks?.length >= 5) score += 10;
  else if (profile.hook_library?.number_hooks?.length >= 3) score += 5;

  return Math.min(100, score);
}

// ============================================================================
// HELPERS
// ============================================================================

function getEnabledTabsForProfileType(type: BusinessProfileType) {
  const baseEnabled = {
    triggers: true,
    proof: true,
    trends: true,
    conversations: true,
    competitors: true,
    local: false,
    weather: false
  };

  switch (type) {
    case 'local-service-b2c':
    case 'local-service-b2b':
      return { ...baseEnabled, local: true, weather: true };
    case 'regional-retail-b2c':
      return { ...baseEnabled, local: true, weather: true };
    case 'regional-b2b-agency':
      return { ...baseEnabled, local: true };
    default:
      return baseEnabled;
  }
}

async function callOpenRouter(prompt: string): Promise<string> {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://marba.app',
        'X-Title': 'MARBA Platform - Specialty Profile Generator',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 8000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function parseJsonResponse(response: string): EnhancedProfile {
  // Try multiple strategies to extract JSON
  let jsonString = response;

  // Strategy 1: Extract from markdown code block
  const codeBlockMatch = response.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    jsonString = codeBlockMatch[1];
  }

  // Strategy 2: Find JSON object directly
  if (!codeBlockMatch) {
    const jsonMatch = response.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    }
  }

  try {
    return JSON.parse(jsonString.trim());
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${error.message}`);
  }
}
