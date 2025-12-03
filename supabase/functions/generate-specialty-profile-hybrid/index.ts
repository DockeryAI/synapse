/**
 * Edge Function: Generate Specialty Profile (Hybrid)
 *
 * HYBRID APPROACH: Accepts UVP-derived data and only generates missing fields.
 * Much faster than full multipass (~5-10 seconds vs 15-45 seconds).
 *
 * Input:
 * - UVP-derived fields (pain points, triggers, etc.) - used directly
 * - Missing fields list - generated via single LLM pass
 *
 * @module generate-specialty-profile-hybrid
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'anthropic/claude-sonnet-4';

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

interface UVPDerivedData {
  common_pain_points: string[];
  common_buying_triggers: string[];
  customer_triggers: Array<{ trigger: string; urgency: number; frequency: string }>;
  urgency_drivers: string[];
  competitive_advantages: string[];
  trust_builders: string[];
  risk_mitigation: string;
  transformations: Array<{ from: string; to: string; emotional_value: string; worth_premium: boolean }>;
  success_metrics: Array<{ metric: string; timeframe: string; measurable: boolean }>;
  objection_handlers: Array<{ objection: string; response: string; effectiveness: number }>;

  // FULL UVP DATA - for injection into LLM prompts
  full_uvp?: {
    // Target customer
    target_customer_statement: string;
    target_customer_industry?: string;
    target_customer_role?: string;
    target_customer_company_size?: string;
    emotional_drivers: string[];
    functional_drivers: string[];

    // Products/services
    products_services: string[];
    product_categories: string[];

    // Transformation
    transformation_statement: string;
    transformation_before: string;
    transformation_after: string;
    transformation_why: string;

    // Unique solution
    unique_solution_statement: string;
    differentiators: string[];
    methodology?: string;
    proprietary_approach?: string;

    // Key benefit
    key_benefit_statement: string;
    benefit_metrics: Array<{ metric: string; value: string; timeframe?: string }>;
    outcome_type: string;

    // Synthesized UVP
    value_proposition_statement: string;
    why_statement: string;
    what_statement: string;
    how_statement: string;
  };
}

interface MissingFields {
  market_trends: boolean;
  seasonal_patterns: boolean;
  geographic_variations: boolean;
  headline_templates: boolean;
  hook_library: boolean;
  power_words: boolean;
  avoid_words: boolean;
  innovation_opportunities: boolean;
}

interface HybridGenerateRequest {
  specialtyProfileId?: string; // Optional - will be created if not provided
  brandId?: string; // Required if specialtyProfileId not provided
  specialtyHash?: string; // Required if creating new profile
  specialtyName: string;
  specialtyDescription: string;
  baseNaicsCode: string | null;
  businessProfileType: BusinessProfileType;
  // NEW: UVP-derived data (no LLM needed for these)
  uvpDerived: UVPDerivedData;
  // NEW: Flags for what still needs generation
  missingFields: MissingFields;
  // Additional context
  industry: string;
  targetCustomer?: string;
  // Profile data for creation
  profileData?: Record<string, unknown>;
}

interface GeneratedFields {
  market_trends: string[];
  seasonal_patterns: Array<{ season: string; pattern: string; impact: string }>;
  geographic_variations: string[];
  headline_templates: Array<{ template: string; expected_ctr: number; use_case: string }>;
  hook_library: {
    number_hooks: string[];
    question_hooks: string[];
    story_hooks: string[];
    fear_hooks: string[];
    howto_hooks: string[];
  };
  power_words: string[];
  avoid_words: string[];
  innovation_opportunities: string[];
  customer_journey: {
    awareness: string;
    consideration: string;
    decision: string;
    retention: string;
    advocacy: string;
  };
  customer_language_dictionary: {
    problem_words: string[];
    solution_words: string[];
    avoid_jargon: string[];
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

    const body = await req.json() as HybridGenerateRequest;
    const {
      specialtyProfileId: inputProfileId,
      brandId,
      specialtyHash,
      specialtyName,
      specialtyDescription,
      baseNaicsCode,
      businessProfileType,
      uvpDerived,
      missingFields,
      industry,
      targetCustomer,
      profileData,
    } = body;

    if (!specialtyName || !uvpDerived) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: specialtyName, uvpDerived' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[generate-specialty-profile-hybrid] Starting for: ${specialtyName}`);
    console.log(`[generate-specialty-profile-hybrid] UVP-derived fields:`, {
      painPoints: uvpDerived.common_pain_points?.length || 0,
      buyingTriggers: uvpDerived.common_buying_triggers?.length || 0,
      customerTriggers: uvpDerived.customer_triggers?.length || 0,
    });

    let specialtyProfileId = inputProfileId;

    // If no profile ID provided, CREATE the profile first
    if (!specialtyProfileId) {
      const hashToUse = specialtyHash || `${brandId}-${Date.now()}`;
      console.log(`[generate-specialty-profile-hybrid] Creating new profile with hash: ${hashToUse}`);

      const { data: newProfile, error: createError } = await supabase
        .from('specialty_profiles')
        .upsert({
          brand_id: brandId || null,
          specialty_hash: hashToUse,
          specialty_name: specialtyName,
          specialty_description: specialtyDescription,
          base_naics_code: baseNaicsCode,
          business_profile_type: businessProfileType,
          profile_data: profileData || {},
          generation_status: 'generating',
          generation_started_at: new Date().toISOString(),
        }, {
          onConflict: 'specialty_hash',
        })
        .select()
        .single();

      if (createError) {
        console.error('[generate-specialty-profile-hybrid] Failed to create profile:', createError);
        return new Response(
          JSON.stringify({ error: `Failed to create profile: ${createError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      specialtyProfileId = newProfile.id;
      console.log(`[generate-specialty-profile-hybrid] Created profile: ${specialtyProfileId}`);
    } else {
      // Update existing profile status to 'generating'
      await supabase
        .from('specialty_profiles')
        .update({
          generation_status: 'generating',
          generation_started_at: new Date().toISOString(),
        })
        .eq('id', specialtyProfileId);
    }

    // Single-pass LLM generation for ONLY missing fields
    const generatedFields = await generateMissingFields({
      specialtyName,
      specialtyDescription,
      businessProfileType,
      industry,
      targetCustomer,
      uvpDerived,
      missingFields,
    });

    // Merge UVP-derived + LLM-generated into complete profile
    const completeProfile = mergeProfile(
      specialtyName,
      specialtyDescription,
      baseNaicsCode,
      businessProfileType,
      uvpDerived,
      generatedFields
    );

    const enabledTabs = getEnabledTabsForProfileType(businessProfileType);

    // Calculate validation score
    const validationScore = calculateValidationScore(completeProfile, uvpDerived);

    // Save to database
    await supabase
      .from('specialty_profiles')
      .update({
        generation_status: 'complete',
        generation_completed_at: new Date().toISOString(),
        profile_data: completeProfile,
        customer_triggers: uvpDerived.customer_triggers,
        common_pain_points: uvpDerived.common_pain_points,
        common_buying_triggers: uvpDerived.common_buying_triggers,
        urgency_drivers: uvpDerived.urgency_drivers,
        objection_handlers: uvpDerived.objection_handlers,
        enabled_tabs: enabledTabs,
        multipass_validation_score: validationScore,
        generation_error: null,
      })
      .eq('id', specialtyProfileId);

    const responseTime = Date.now() - startTime;
    console.log(`[generate-specialty-profile-hybrid] Complete in ${responseTime}ms, score: ${validationScore}`);

    return new Response(
      JSON.stringify({
        success: true,
        specialtyProfileId,
        validationScore,
        responseTimeMs: responseTime,
        mode: 'hybrid',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[generate-specialty-profile-hybrid] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// SINGLE-PASS LLM GENERATION
// ============================================================================

async function generateMissingFields(input: {
  specialtyName: string;
  specialtyDescription: string;
  businessProfileType: BusinessProfileType;
  industry: string;
  targetCustomer?: string;
  uvpDerived: UVPDerivedData;
  missingFields: MissingFields;
}): Promise<GeneratedFields> {
  const { specialtyName, specialtyDescription, businessProfileType, industry, targetCustomer, uvpDerived, missingFields } = input;

  // Build context from UVP-derived data
  const painPointsContext = uvpDerived.common_pain_points.slice(0, 5).join(', ');
  const triggersContext = uvpDerived.common_buying_triggers.slice(0, 5).join(', ');
  const advantagesContext = uvpDerived.competitive_advantages.slice(0, 3).join(', ');

  const prompt = `You are generating ONLY the missing fields for a specialty business profile.

BUSINESS CONTEXT:
- Specialty: ${specialtyName}
- Description: ${specialtyDescription}
- Industry: ${industry}
- Business Type: ${businessProfileType}
- Target Customer: ${targetCustomer || 'Business professionals'}

ALREADY HAVE (from UVP extraction):
- Pain Points: ${painPointsContext}
- Buying Triggers: ${triggersContext}
- Competitive Advantages: ${advantagesContext}

GENERATE ONLY these missing fields as JSON:

{
  "market_trends": ["5 current industry trends affecting ${specialtyName} buyers"],
  "seasonal_patterns": [
    {"season": "Q1", "pattern": "Description", "impact": "high/medium/low"}
  ],
  "geographic_variations": ${missingFields.geographic_variations ? '["Regional factors affecting buying behavior"]' : '[]'},
  "headline_templates": [
    {"template": "Headline with {variable}", "expected_ctr": 3.5, "use_case": "ads/social/email"}
  ],
  "hook_library": {
    "number_hooks": ["5 ways to...", "3 secrets..."],
    "question_hooks": ["Are you struggling with...?"],
    "story_hooks": ["When [person] tried..."],
    "fear_hooks": ["Don't let [problem] cost you..."],
    "howto_hooks": ["How to [achieve result] without [pain]"]
  },
  "power_words": ["20 compelling words for ${industry}"],
  "avoid_words": ["10 words that hurt trust in ${industry}"],
  "innovation_opportunities": ["3 emerging opportunities in ${specialtyName}"],
  "customer_journey": {
    "awareness": "How they first realize they need ${specialtyName}",
    "consideration": "What they research and compare",
    "decision": "How they make their final choice",
    "retention": "Why they stay as customers",
    "advocacy": "Why they refer others"
  },
  "customer_language_dictionary": {
    "problem_words": ["Words customers use to describe problems"],
    "solution_words": ["Words customers use for solutions"],
    "avoid_jargon": ["Technical words to avoid"]
  }
}

REQUIREMENTS:
- Generate at least 5 market_trends
- Generate at least 4 seasonal_patterns
- Generate at least 10 headline_templates
- Generate at least 5 hooks per category
- Generate at least 20 power_words
- Generate at least 10 avoid_words
- All content must be SPECIFIC to ${specialtyName}, not generic

Return ONLY valid JSON, no markdown.`;

  const response = await callOpenRouter(prompt);
  return parseJsonResponse(response);
}

// ============================================================================
// MERGE PROFILE
// ============================================================================

function mergeProfile(
  specialtyName: string,
  specialtyDescription: string,
  baseNaicsCode: string | null,
  businessProfileType: BusinessProfileType,
  uvpDerived: UVPDerivedData,
  generated: GeneratedFields
): Record<string, unknown> {
  return {
    // Identity
    industry: specialtyName.toLowerCase().replace(/\s+/g, '-'),
    industry_name: specialtyName,
    naics_code: baseNaicsCode || '999999',
    category: specialtyDescription?.split(' ').slice(0, 3).join(' ') || specialtyName,
    subcategory: businessProfileType,

    // UVP-derived fields (60-70% of profile)
    customer_triggers: uvpDerived.customer_triggers,
    transformations: uvpDerived.transformations,
    success_metrics: uvpDerived.success_metrics,
    urgency_drivers: uvpDerived.urgency_drivers,
    objection_handlers: uvpDerived.objection_handlers,
    risk_reversal: {
      guarantees: uvpDerived.trust_builders.slice(0, 3),
      proof_points: uvpDerived.trust_builders.slice(3, 6),
      risk_mitigation: uvpDerived.risk_mitigation,
    },
    competitive_advantages: uvpDerived.competitive_advantages,
    value_propositions: uvpDerived.competitive_advantages,
    differentiators: uvpDerived.competitive_advantages,
    common_pain_points: uvpDerived.common_pain_points,
    common_buying_triggers: uvpDerived.common_buying_triggers,

    // FULL UVP DATA - critical for V1-quality trigger synthesis
    full_uvp: uvpDerived.full_uvp || null,

    // LLM-generated fields (30-40% of profile)
    customer_journey: generated.customer_journey,
    customer_language_dictionary: generated.customer_language_dictionary,
    power_words: generated.power_words,
    avoid_words: generated.avoid_words,
    headline_templates: generated.headline_templates,
    hook_library: generated.hook_library,
    market_trends: generated.market_trends,
    seasonal_patterns: generated.seasonal_patterns,
    geographic_variations: generated.geographic_variations,
    innovation_opportunities: generated.innovation_opportunities,

    // Metadata
    freshness_metadata: {
      profile_version: '2.0-hybrid-fulluvp',
      last_full_refresh: new Date().toISOString(),
      staleness_score: 0,
    },
    enabledTabs: getEnabledTabsForProfileType(businessProfileType),
  };
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
    weather: false,
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

function calculateValidationScore(profile: Record<string, unknown>, uvpDerived: UVPDerivedData): number {
  let score = 0;

  // UVP-derived fields are high quality (50 points)
  if (uvpDerived.customer_triggers?.length >= 5) score += 15;
  if (uvpDerived.common_pain_points?.length >= 3) score += 10;
  if (uvpDerived.common_buying_triggers?.length >= 3) score += 10;
  if (uvpDerived.competitive_advantages?.length >= 3) score += 10;
  if (uvpDerived.objection_handlers?.length >= 3) score += 5;

  // Generated fields (50 points)
  const p = profile as Record<string, unknown>;
  if (Array.isArray(p.market_trends) && p.market_trends.length >= 5) score += 10;
  if (Array.isArray(p.power_words) && p.power_words.length >= 15) score += 10;
  if (Array.isArray(p.headline_templates) && p.headline_templates.length >= 8) score += 10;
  if (p.hook_library && typeof p.hook_library === 'object') score += 10;
  if (p.customer_journey && typeof p.customer_journey === 'object') score += 10;

  return Math.min(100, score);
}

async function callOpenRouter(prompt: string): Promise<string> {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://marba.app',
        'X-Title': 'MARBA Platform - Specialty Profile Generator (Hybrid)',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4000,
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

function parseJsonResponse(response: string): GeneratedFields {
  let jsonString = response;

  // Extract from markdown code block
  const codeBlockMatch = response.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    jsonString = codeBlockMatch[1];
  }

  // Find JSON object directly
  if (!codeBlockMatch) {
    const jsonMatch = response.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    }
  }

  try {
    return JSON.parse(jsonString.trim());
  } catch (error) {
    console.error('[generate-specialty-profile-hybrid] JSON parse error:', error);
    // Return minimal defaults
    return {
      market_trends: [],
      seasonal_patterns: [],
      geographic_variations: [],
      headline_templates: [],
      hook_library: {
        number_hooks: [],
        question_hooks: [],
        story_hooks: [],
        fear_hooks: [],
        howto_hooks: [],
      },
      power_words: [],
      avoid_words: [],
      innovation_opportunities: [],
      customer_journey: {
        awareness: 'Discovers need through industry challenges',
        consideration: 'Researches solutions and compares options',
        decision: 'Chooses based on fit and value',
        retention: 'Stays for consistent results',
        advocacy: 'Refers due to positive outcomes',
      },
      customer_language_dictionary: {
        problem_words: [],
        solution_words: [],
        avoid_jargon: [],
      },
    };
  }
}
