/**
 * Edge Function: Generate Specialty Profile (Parallel 5x)
 *
 * PARALLEL PROFILE GENERATION using 4 OpenRouter API keys (key rotation)
 * Reduces generation time from ~60s to ~15-20s by splitting work into 5 workstreams.
 *
 * Workstream 1: Customer Psychology (customer_triggers, transformations, objections)
 * Workstream 2: Value Props & Journey (customer_journey, success_metrics, risk_reversal)
 * Workstream 3: Messaging & Hooks (power_words, hook_library, headline_templates)
 * Workstream 4: Market Intelligence (urgency_drivers, customer_language, viral_triggers)
 * Workstream 5: Social Media Content (content_templates, tiktok_hooks, video_scripts)
 *
 * Each workstream runs on a different API key in parallel (with rotation).
 * Results are merged into a complete EnhancedProfile with full social media support.
 *
 * @module generate-specialty-profile-parallel
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'anthropic/claude-sonnet-4'; // Fast + quality balance
const MAX_RETRIES = 2;
const TIMEOUT_MS = 60000; // 60 seconds per workstream (increased for social media content)

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
  specialtyProfileId?: string; // Optional - will create if not provided
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

interface WorkstreamResult {
  workstream: number;
  success: boolean;
  data: Partial<EnhancedProfile>;
  error?: string;
  durationMs: number;
}

interface ContentTemplate {
  hook: string;
  body?: string;
  script?: string;
  cta: string;
  framework: string;
}

interface PlatformTemplates {
  educational?: ContentTemplate;
  authority?: ContentTemplate;
  case_study?: ContentTemplate;
  engagement?: ContentTemplate;
  promotional?: ContentTemplate;
}

interface TikTokHook {
  hook: string;
  category: string;
  follow_up_content: string;
}

interface VideoScript {
  hook: string;
  body: string;
  cta: string;
  title: string;
  duration: string;
}

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
  content_templates: {
    linkedin?: PlatformTemplates;
    instagram?: PlatformTemplates;
    facebook?: PlatformTemplates;
    twitter?: PlatformTemplates;
    tiktok?: PlatformTemplates;
    email?: PlatformTemplates;
  };
  hook_library: {
    number_hooks: string[];
    question_hooks: string[];
    story_hooks: string[];
    fear_hooks: string[];
    howto_hooks: string[];
    curiosity_hooks?: string[];
    authority_hooks?: string[];
    pain_point_hooks?: string[];
  };
  tiktok_hooks: TikTokHook[];
  video_scripts: {
    educational: VideoScript[];
    promotional: VideoScript[];
    testimonial: VideoScript[];
  };
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

    // Get all 4 API keys
    const apiKeys = [
      Deno.env.get('OPENROUTER_API_KEY'),
      Deno.env.get('OPENROUTER_API_KEY_2'),
      Deno.env.get('OPENROUTER_API_KEY_3'),
      Deno.env.get('OPENROUTER_API_KEY_4'),
    ].filter(Boolean) as string[];

    if (apiKeys.length < 4) {
      console.warn(`[parallel-profile] Only ${apiKeys.length} API keys available (need 4 for full parallelism)`);
    }

    if (apiKeys.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No OpenRouter API keys configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json() as GenerateRequest;
    const {
      specialtyProfileId,
      specialtyName,
      specialtyDescription,
      baseNaicsCode,
      businessProfileType,
      uvpData
    } = body;

    if (!specialtyName || !businessProfileType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: specialtyName, businessProfileType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[parallel-profile] Starting 5-WORKSTREAM PARALLEL generation for: ${specialtyName}`);
    console.log(`[parallel-profile] Using ${apiKeys.length} API keys with rotation`);

    // If no specialtyProfileId provided, create the pending profile row ourselves
    let profileId = specialtyProfileId;
    if (!profileId) {
      console.log(`[parallel-profile] No profileId provided - creating pending profile row...`);
      const specialtyHash = `${baseNaicsCode || 'unknown'}-${Date.now()}`;

      const { data: newProfile, error: insertError } = await supabase
        .from('specialty_profiles')
        .insert({
          specialty_hash: specialtyHash,
          specialty_name: specialtyName,
          specialty_description: specialtyDescription,
          base_naics_code: baseNaicsCode,
          business_profile_type: businessProfileType,
          generation_status: 'generating',
          generation_started_at: new Date().toISOString(),
          generation_attempts: 1,
          enabled_tabs: ['triggers', 'content', 'ads']
        })
        .select('id')
        .single();

      if (insertError || !newProfile) {
        console.error(`[parallel-profile] Failed to create pending profile:`, insertError);
        return new Response(
          JSON.stringify({ error: `Failed to create profile: ${insertError?.message || 'Unknown error'}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      profileId = newProfile.id;
      console.log(`[parallel-profile] Created pending profile: ${profileId}`);
    } else {
      // Update existing profile status to 'generating'
      await supabase
        .from('specialty_profiles')
        .update({
          generation_status: 'generating',
          generation_started_at: new Date().toISOString(),
          generation_attempts: 1
        })
        .eq('id', profileId);
    }

    // Build context for all workstreams
    const context = {
      specialtyName,
      specialtyDescription,
      baseNaicsCode,
      businessProfileType,
      uvpData
    };

    // Run all 5 workstreams in parallel (with key rotation for WS5)
    const workstreamPromises = [
      runWorkstream1(context, apiKeys[0 % apiKeys.length]),
      runWorkstream2(context, apiKeys[1 % apiKeys.length]),
      runWorkstream3(context, apiKeys[2 % apiKeys.length]),
      runWorkstream4(context, apiKeys[3 % apiKeys.length]),
      runWorkstream5(context, apiKeys[0 % apiKeys.length]), // Rotates back to key 1
    ];

    console.log('[parallel-profile] Launching 5 parallel workstreams...');
    const results = await Promise.all(workstreamPromises);

    // Log timing
    results.forEach(r => {
      console.log(`[parallel-profile] Workstream ${r.workstream}: ${r.success ? 'SUCCESS' : 'FAILED'} (${r.durationMs}ms)`);
    });

    const totalDuration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;

    console.log(`[parallel-profile] Total duration: ${totalDuration}ms, Success: ${successCount}/5`);

    // Require at least 4 of 5 workstreams to succeed (allow social media to fail gracefully)
    if (successCount < 4) {
      const errors = results.filter(r => !r.success).map(r => `WS${r.workstream}: ${r.error}`).join('; ');

      await supabase
        .from('specialty_profiles')
        .update({
          generation_status: 'failed',
          generation_error: `Only ${successCount}/5 workstreams succeeded: ${errors}`,
          generation_completed_at: new Date().toISOString()
        })
        .eq('id', profileId);

      return new Response(
        JSON.stringify({
          success: false,
          error: `Parallel generation failed: ${errors}`,
          workstreamResults: results.map(r => ({
            workstream: r.workstream,
            success: r.success,
            durationMs: r.durationMs,
            error: r.error
          }))
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Merge all workstream results into final profile
    const profile = mergeWorkstreamResults(results, context);
    const enabledTabs = getEnabledTabsForProfileType(businessProfileType);
    const validationScore = calculateValidationScore(profile, successCount);

    // Save the profile
    await supabase
      .from('specialty_profiles')
      .update({
        generation_status: 'complete',
        generation_completed_at: new Date().toISOString(),
        profile_data: profile,
        customer_triggers: profile.customer_triggers,
        common_pain_points: profile.customer_language_dictionary.problem_words,
        common_buying_triggers: profile.urgency_drivers,
        urgency_drivers: profile.urgency_drivers,
        objection_handlers: profile.objection_handlers,
        enabled_tabs: enabledTabs,
        multipass_validation_score: validationScore,
        generation_error: null
      })
      .eq('id', profileId);

    console.log(`[parallel-profile] Complete in ${totalDuration}ms, score: ${validationScore}`);

    return new Response(
      JSON.stringify({
        success: true,
        specialtyProfileId: profileId,
        validationScore,
        responseTimeMs: totalDuration,
        workstreamResults: results.map(r => ({
          workstream: r.workstream,
          success: r.success,
          durationMs: r.durationMs
        })),
        parallelSpeedup: `5-workstream parallel generation completed in ${totalDuration}ms`,
        hasSocialMediaContent: results[4]?.success || false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[parallel-profile] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// WORKSTREAM 1: Customer Psychology
// ============================================================================

async function runWorkstream1(
  context: {
    specialtyName: string;
    specialtyDescription: string;
    baseNaicsCode: string | null;
    businessProfileType: BusinessProfileType;
    uvpData?: { targetCustomer?: string; productsServices?: string; businessDescription?: string };
  },
  apiKey: string
): Promise<WorkstreamResult> {
  const start = Date.now();

  const prompt = `You are an expert in customer psychology. Generate customer triggers, transformations, and objection handlers for this specialty business.

SPECIALTY BUSINESS:
- Name: ${context.specialtyName}
- Description: ${context.specialtyDescription}
- Business Type: ${context.businessProfileType}
${context.uvpData?.targetCustomer ? `- Target Customer: ${context.uvpData.targetCustomer}` : ''}
${context.uvpData?.productsServices ? `- Products/Services: ${context.uvpData.productsServices}` : ''}

Return ONLY valid JSON with this exact structure:

{
  "customer_triggers": [
    {"trigger": "Specific event that makes someone need ${context.specialtyName}", "urgency": 8, "frequency": "monthly"},
    {"trigger": "Another specific trigger event", "urgency": 7, "frequency": "quarterly"},
    {"trigger": "Third trigger", "urgency": 9, "frequency": "annually"},
    {"trigger": "Fourth trigger", "urgency": 6, "frequency": "weekly"},
    {"trigger": "Fifth trigger", "urgency": 8, "frequency": "monthly"},
    {"trigger": "Sixth trigger", "urgency": 7, "frequency": "quarterly"},
    {"trigger": "Seventh trigger", "urgency": 5, "frequency": "monthly"}
  ],
  "transformations": [
    {"from": "Current painful state", "to": "Desired outcome state", "emotional_value": "How they feel after transformation", "worth_premium": true},
    {"from": "Another pain point", "to": "Better situation", "emotional_value": "Emotional benefit", "worth_premium": true},
    {"from": "Third problem", "to": "Third solution", "emotional_value": "Relief feeling", "worth_premium": false}
  ],
  "objection_handlers": [
    {"objection": "Too expensive", "response": "Value-based response", "effectiveness": 8},
    {"objection": "Not the right time", "response": "Urgency-based response", "effectiveness": 7},
    {"objection": "Already have a solution", "response": "Differentiation response", "effectiveness": 8},
    {"objection": "Need to think about it", "response": "Next-step response", "effectiveness": 6},
    {"objection": "Not sure it will work for us", "response": "Proof-based response", "effectiveness": 9}
  ]
}

REQUIREMENTS:
- Generate exactly 7 customer_triggers with urgency 1-10
- Generate exactly 3 transformations
- Generate exactly 5 objection_handlers
- All content must be SPECIFIC to "${context.specialtyName}"
- Triggers should be SPECIFIC EVENTS, not vague needs`;

  try {
    const response = await callOpenRouterWithRetry(prompt, apiKey, 1);
    const data = parseJsonResponse(response);
    return {
      workstream: 1,
      success: true,
      data,
      durationMs: Date.now() - start
    };
  } catch (error) {
    return {
      workstream: 1,
      success: false,
      data: {},
      error: error.message,
      durationMs: Date.now() - start
    };
  }
}

// ============================================================================
// WORKSTREAM 2: Value Props & Journey
// ============================================================================

async function runWorkstream2(
  context: {
    specialtyName: string;
    specialtyDescription: string;
    baseNaicsCode: string | null;
    businessProfileType: BusinessProfileType;
    uvpData?: { targetCustomer?: string; productsServices?: string; businessDescription?: string };
  },
  apiKey: string
): Promise<WorkstreamResult> {
  const start = Date.now();

  const prompt = `You are an expert in customer journeys and value propositions. Generate the customer journey, success metrics, and risk reversal strategies for this specialty business.

SPECIALTY BUSINESS:
- Name: ${context.specialtyName}
- Description: ${context.specialtyDescription}
- Business Type: ${context.businessProfileType}
${context.uvpData?.targetCustomer ? `- Target Customer: ${context.uvpData.targetCustomer}` : ''}

Return ONLY valid JSON with this exact structure:

{
  "customer_journey": {
    "awareness": "How customers first become aware of their need for ${context.specialtyName}",
    "consideration": "What they research and compare when evaluating solutions",
    "decision": "How they make their final choice between options",
    "retention": "Why they stay as long-term customers",
    "advocacy": "Why they refer others and become advocates"
  },
  "success_metrics": [
    {"metric": "Primary measurable outcome", "timeframe": "30 days", "measurable": true},
    {"metric": "Secondary outcome", "timeframe": "90 days", "measurable": true},
    {"metric": "Long-term outcome", "timeframe": "12 months", "measurable": true},
    {"metric": "Qualitative outcome", "timeframe": "ongoing", "measurable": false}
  ],
  "risk_reversal": {
    "guarantees": ["Money-back guarantee type", "Performance guarantee", "Satisfaction guarantee"],
    "proof_points": ["Case study type", "Testimonial type", "Data/stats type", "Certification type"],
    "risk_mitigation": "How to reduce perceived risk of trying ${context.specialtyName}"
  }
}

REQUIREMENTS:
- Customer journey stages must be specific to ${context.businessProfileType} buyers
- Generate exactly 4 success_metrics
- Generate at least 3 guarantees and 4 proof points
- All content must be SPECIFIC to "${context.specialtyName}"`;

  try {
    const response = await callOpenRouterWithRetry(prompt, apiKey, 2);
    const data = parseJsonResponse(response);
    return {
      workstream: 2,
      success: true,
      data,
      durationMs: Date.now() - start
    };
  } catch (error) {
    return {
      workstream: 2,
      success: false,
      data: {},
      error: error.message,
      durationMs: Date.now() - start
    };
  }
}

// ============================================================================
// WORKSTREAM 3: Messaging & Hooks
// ============================================================================

async function runWorkstream3(
  context: {
    specialtyName: string;
    specialtyDescription: string;
    baseNaicsCode: string | null;
    businessProfileType: BusinessProfileType;
    uvpData?: { targetCustomer?: string; productsServices?: string; businessDescription?: string };
  },
  apiKey: string
): Promise<WorkstreamResult> {
  const start = Date.now();

  const prompt = `You are an expert copywriter and content strategist. Generate power words, hook library, and headline templates for this specialty business.

SPECIALTY BUSINESS:
- Name: ${context.specialtyName}
- Description: ${context.specialtyDescription}
- Business Type: ${context.businessProfileType}
${context.uvpData?.targetCustomer ? `- Target Customer: ${context.uvpData.targetCustomer}` : ''}

Return ONLY valid JSON with this exact structure:

{
  "power_words": ["word1", "word2", "word3", "word4", "word5", "word6", "word7", "word8", "word9", "word10", "word11", "word12", "word13", "word14", "word15"],
  "avoid_words": ["word1", "word2", "word3", "word4", "word5", "word6"],
  "headline_templates": [
    {"template": "How {company type} Achieved {result} with {product}", "expected_ctr": 3.5, "use_case": "ads"},
    {"template": "{Number} Ways to {benefit} Without {pain}", "expected_ctr": 4.2, "use_case": "content"},
    {"template": "The {adjective} Guide to {outcome}", "expected_ctr": 3.8, "use_case": "lead-gen"},
    {"template": "Why {target audience} Choose {product type}", "expected_ctr": 3.2, "use_case": "landing-page"},
    {"template": "Stop {pain point}. Start {benefit}.", "expected_ctr": 4.0, "use_case": "social"}
  ],
  "hook_library": {
    "number_hooks": ["7 ways to...", "3 secrets that...", "5 mistakes...", "The #1 reason...", "10 proven..."],
    "question_hooks": ["Are you struggling with...?", "What if you could...?", "Have you ever wondered...?", "Why do most...fail?", "Is your...costing you?"],
    "story_hooks": ["When [person] discovered...", "I used to think...", "The day everything changed...", "Nobody believed...", "After years of..."],
    "fear_hooks": ["Don't let [problem] cost you...", "The hidden danger of...", "Warning: [issue] may be...", "Most [people] don't realize...", "Before it's too late..."],
    "howto_hooks": ["How to [achieve] without [pain]", "The simple way to...", "A step-by-step guide to...", "The fastest way to...", "How [successful people] do..."],
    "curiosity_hooks": ["The surprising truth about...", "What [experts] don't tell you...", "The secret behind...", "You won't believe...", "The real reason..."],
    "authority_hooks": ["After [X years] in [industry]...", "Having worked with [N] clients...", "As a certified [credential]...", "Industry experts agree...", "Research shows..."],
    "pain_point_hooks": ["Tired of [problem]?", "Struggling with [issue]?", "Frustrated by [situation]?", "Still dealing with [pain]?", "Had enough of [problem]?"]
  }
}

REQUIREMENTS:
- Generate exactly 15 power_words specific to the industry
- Generate exactly 6 avoid_words
- Generate exactly 5 headline_templates with realistic CTR estimates
- Generate exactly 5 hooks per category in hook_library (8 categories)
- All content must be SPECIFIC to "${context.specialtyName}"`;

  try {
    const response = await callOpenRouterWithRetry(prompt, apiKey, 3);
    const data = parseJsonResponse(response);
    return {
      workstream: 3,
      success: true,
      data,
      durationMs: Date.now() - start
    };
  } catch (error) {
    return {
      workstream: 3,
      success: false,
      data: {},
      error: error.message,
      durationMs: Date.now() - start
    };
  }
}

// ============================================================================
// WORKSTREAM 4: Market Intelligence
// ============================================================================

async function runWorkstream4(
  context: {
    specialtyName: string;
    specialtyDescription: string;
    baseNaicsCode: string | null;
    businessProfileType: BusinessProfileType;
    uvpData?: { targetCustomer?: string; productsServices?: string; businessDescription?: string };
  },
  apiKey: string
): Promise<WorkstreamResult> {
  const start = Date.now();

  const prompt = `You are an expert in market research and customer language. Generate urgency drivers, customer language dictionary, UGC prompts, and viral content triggers for this specialty business.

SPECIALTY BUSINESS:
- Name: ${context.specialtyName}
- Description: ${context.specialtyDescription}
- Business Type: ${context.businessProfileType}
${context.uvpData?.targetCustomer ? `- Target Customer: ${context.uvpData.targetCustomer}` : ''}

Return ONLY valid JSON with this exact structure:

{
  "urgency_drivers": [
    "Time-sensitive factor that creates urgency",
    "Competitive pressure point",
    "Market timing factor",
    "Regulatory or compliance deadline",
    "Seasonal or cyclical urgency",
    "Risk of inaction consequence",
    "Opportunity cost driver"
  ],
  "customer_language_dictionary": {
    "problem_words": ["word1", "word2", "word3", "word4", "word5", "word6", "word7", "word8", "word9", "word10"],
    "solution_words": ["word1", "word2", "word3", "word4", "word5", "word6", "word7", "word8", "word9", "word10"],
    "avoid_jargon": ["jargon1", "jargon2", "jargon3", "jargon4", "jargon5", "jargon6", "jargon7"]
  },
  "ugc_prompts": [
    {"prompt": "Share your experience with ${context.specialtyName}", "hashtag": "#YourBrandTag"},
    {"prompt": "Show us your results", "hashtag": "#ResultsTag"},
    {"prompt": "What would you tell someone considering this?", "hashtag": "#AdviceTag"},
    {"prompt": "Before and after using our solution", "hashtag": "#TransformationTag"},
    {"prompt": "Your biggest win this month", "hashtag": "#WinTag"}
  ],
  "viral_triggers": [
    {"angle": "Controversial or surprising angle about the industry", "why": "Creates debate and sharing"},
    {"angle": "Emotional story angle", "why": "Triggers empathy and connection"},
    {"angle": "Data-driven shocking stat", "why": "Makes people want to share the insight"},
    {"angle": "Behind-the-scenes reveal", "why": "Satisfies curiosity about the process"},
    {"angle": "Myth-busting content", "why": "People love to share when proven right/wrong"}
  ]
}

REQUIREMENTS:
- Generate exactly 7 urgency_drivers specific to ${context.businessProfileType}
- Generate exactly 10 words in each customer_language category
- Generate exactly 5 ugc_prompts with relevant hashtags
- Generate exactly 5 viral_triggers with reasons why they work
- All content must be SPECIFIC to "${context.specialtyName}"`;

  try {
    const response = await callOpenRouterWithRetry(prompt, apiKey, 4);
    const data = parseJsonResponse(response);
    return {
      workstream: 4,
      success: true,
      data,
      durationMs: Date.now() - start
    };
  } catch (error) {
    return {
      workstream: 4,
      success: false,
      data: {},
      error: error.message,
      durationMs: Date.now() - start
    };
  }
}

// ============================================================================
// WORKSTREAM 5: Social Media Content Templates
// ============================================================================

async function runWorkstream5(
  context: {
    specialtyName: string;
    specialtyDescription: string;
    baseNaicsCode: string | null;
    businessProfileType: BusinessProfileType;
    uvpData?: { targetCustomer?: string; productsServices?: string; businessDescription?: string };
  },
  apiKey: string
): Promise<WorkstreamResult> {
  const start = Date.now();

  const prompt = `You are an expert social media strategist. Generate platform-specific content templates, TikTok hooks, and video scripts for this specialty business.

SPECIALTY BUSINESS:
- Name: ${context.specialtyName}
- Description: ${context.specialtyDescription}
- Business Type: ${context.businessProfileType}
${context.uvpData?.targetCustomer ? `- Target Customer: ${context.uvpData.targetCustomer}` : ''}

Return ONLY valid JSON with this exact structure:

{
  "content_templates": {
    "linkedin": {
      "educational": {"hook": "Opening line that stops scrolling", "body": "Value-packed content for LinkedIn professionals", "cta": "Call to action", "framework": "PAS"},
      "authority": {"hook": "Establish expertise hook", "body": "Thought leadership content", "cta": "Engagement CTA", "framework": "AIDA"},
      "case_study": {"hook": "Results-focused opener", "body": "Client success story format", "cta": "Learn more CTA", "framework": "STAR"}
    },
    "instagram": {
      "educational": {"hook": "Visual-first hook for carousel", "body": "Slide-by-slide breakdown", "cta": "Save this post", "framework": "BAB"},
      "engagement": {"hook": "Question or poll starter", "body": "Interactive content", "cta": "Comment below", "framework": "FAB"},
      "promotional": {"hook": "Benefit-led opener", "body": "Product/service showcase", "cta": "Link in bio", "framework": "AIDA"}
    },
    "twitter": {
      "educational": {"hook": "Thread opener that promises value", "body": "Thread format with numbered points", "cta": "Follow for more", "framework": "PAS"},
      "authority": {"hook": "Hot take or contrarian view", "body": "Supporting argument", "cta": "Agree or disagree?", "framework": "BAB"}
    },
    "facebook": {
      "engagement": {"hook": "Community-focused opener", "body": "Discussion starter content", "cta": "Share your thoughts", "framework": "FAB"},
      "promotional": {"hook": "Problem-agitation opener", "body": "Solution presentation", "cta": "Learn more link", "framework": "PAS"}
    }
  },
  "tiktok_hooks": [
    {"hook": "This ${context.specialtyName} mistake costs thousands...", "category": "controversy", "follow_up_content": "Reveal the mistake and show the better approach"},
    {"hook": "POV: You just discovered ${context.specialtyName}...", "category": "relatable", "follow_up_content": "Show the transformation journey"},
    {"hook": "Industry experts don't want you to know this...", "category": "curiosity", "follow_up_content": "Reveal insider knowledge"},
    {"hook": "Stop doing THIS with your ${context.specialtyName}...", "category": "controversy", "follow_up_content": "Show wrong vs right approach"},
    {"hook": "I spent $10K learning this lesson...", "category": "story", "follow_up_content": "Share the expensive mistake and solution"},
    {"hook": "The ${context.specialtyName} hack that changed everything...", "category": "transformation", "follow_up_content": "Demonstrate the technique"},
    {"hook": "Why nobody talks about this ${context.specialtyName} problem...", "category": "curiosity", "follow_up_content": "Address hidden industry issue"},
    {"hook": "My clients ask me this every day...", "category": "authority", "follow_up_content": "Answer common question with expertise"},
    {"hook": "Before vs after ${context.specialtyName}...", "category": "transformation", "follow_up_content": "Visual transformation showcase"},
    {"hook": "Red flags when choosing ${context.specialtyName}...", "category": "educational", "follow_up_content": "Warning signs to watch for"}
  ],
  "video_scripts": {
    "educational": [
      {"hook": "If you're struggling with [problem], here's what you need to know...", "body": "Step-by-step explanation of the solution with examples specific to ${context.specialtyName}", "cta": "Follow for more tips like this", "title": "Educational Video 1", "duration": "60 seconds"},
      {"hook": "The biggest mistake I see with ${context.specialtyName}...", "body": "Explain the mistake, why it happens, and how to fix it", "cta": "Save this for later", "title": "Educational Video 2", "duration": "45 seconds"},
      {"hook": "3 things I wish I knew before...", "body": "Share insider knowledge that helps the audience avoid common pitfalls", "cta": "Comment which one surprised you", "title": "Educational Video 3", "duration": "60 seconds"}
    ],
    "promotional": [
      {"hook": "Here's what happens when you finally invest in ${context.specialtyName}...", "body": "Walk through the transformation and benefits with social proof", "cta": "DM me 'START' to learn more", "title": "Promotional Video 1", "duration": "45 seconds"},
      {"hook": "This is exactly what working with us looks like...", "body": "Behind-the-scenes of the process and results", "cta": "Link in bio to get started", "title": "Promotional Video 2", "duration": "60 seconds"}
    ],
    "testimonial": [
      {"hook": "I was skeptical at first, but...", "body": "Customer shares their journey from doubt to success with specific results", "cta": "Ready for your transformation?", "title": "Testimonial Video 1", "duration": "60 seconds"},
      {"hook": "After trying everything else, I finally found...", "body": "Customer explains what made the difference and their results", "cta": "See more success stories", "title": "Testimonial Video 2", "duration": "45 seconds"}
    ]
  }
}

REQUIREMENTS:
- Generate content_templates for LinkedIn, Instagram, Twitter, and Facebook
- Generate exactly 10 tiktok_hooks with categories and follow-up content
- Generate exactly 3 educational, 2 promotional, and 2 testimonial video_scripts
- Each video_script needs hook, body, cta, title, and duration
- All content must be SPECIFIC to "${context.specialtyName}" and ${context.businessProfileType} audience`;

  try {
    const response = await callOpenRouterWithRetry(prompt, apiKey, 5);
    const data = parseJsonResponse(response);
    return {
      workstream: 5,
      success: true,
      data,
      durationMs: Date.now() - start
    };
  } catch (error) {
    return {
      workstream: 5,
      success: false,
      data: {},
      error: error.message,
      durationMs: Date.now() - start
    };
  }
}

// ============================================================================
// MERGE RESULTS
// ============================================================================

function mergeWorkstreamResults(
  results: WorkstreamResult[],
  context: {
    specialtyName: string;
    baseNaicsCode: string | null;
    businessProfileType: BusinessProfileType;
  }
): EnhancedProfile {
  // Start with base profile structure
  const profile: EnhancedProfile = {
    industry: context.specialtyName.toLowerCase().replace(/\s+/g, '-'),
    industry_name: context.specialtyName,
    naics_code: context.baseNaicsCode || '999999',
    category: context.businessProfileType.includes('b2b') ? 'B2B Services' : 'B2C Services',
    subcategory: context.specialtyName,
    customer_triggers: [],
    customer_journey: {
      awareness: 'Becomes aware of need through industry events or pain points',
      consideration: 'Researches options and compares solutions',
      decision: 'Makes decision based on trust and proven results',
      retention: 'Stays due to ongoing value delivery',
      advocacy: 'Refers due to exceptional outcomes'
    },
    transformations: [],
    success_metrics: [],
    urgency_drivers: [],
    objection_handlers: [],
    risk_reversal: {
      guarantees: [],
      proof_points: [],
      risk_mitigation: ''
    },
    customer_language_dictionary: {
      problem_words: [],
      solution_words: [],
      avoid_jargon: []
    },
    power_words: [],
    avoid_words: [],
    headline_templates: [],
    content_templates: {},
    hook_library: {
      number_hooks: [],
      question_hooks: [],
      story_hooks: [],
      fear_hooks: [],
      howto_hooks: []
    },
    tiktok_hooks: [],
    video_scripts: {
      educational: [],
      promotional: [],
      testimonial: []
    },
    ugc_prompts: [],
    viral_triggers: [],
    freshness_metadata: {
      profile_version: '2.0-parallel-social',
      last_full_refresh: new Date().toISOString(),
      staleness_score: 0
    },
    enabledTabs: getEnabledTabsForProfileType(context.businessProfileType)
  };

  // Merge each successful workstream
  for (const result of results) {
    if (!result.success) continue;

    // Workstream 1: Customer Psychology
    if (result.workstream === 1) {
      if (result.data.customer_triggers) profile.customer_triggers = result.data.customer_triggers;
      if (result.data.transformations) profile.transformations = result.data.transformations;
      if (result.data.objection_handlers) profile.objection_handlers = result.data.objection_handlers;
    }

    // Workstream 2: Value Props & Journey
    if (result.workstream === 2) {
      if (result.data.customer_journey) profile.customer_journey = result.data.customer_journey;
      if (result.data.success_metrics) profile.success_metrics = result.data.success_metrics;
      if (result.data.risk_reversal) profile.risk_reversal = result.data.risk_reversal;
    }

    // Workstream 3: Messaging & Hooks
    if (result.workstream === 3) {
      if (result.data.power_words) profile.power_words = result.data.power_words;
      if (result.data.avoid_words) profile.avoid_words = result.data.avoid_words;
      if (result.data.headline_templates) profile.headline_templates = result.data.headline_templates;
      if (result.data.hook_library) profile.hook_library = result.data.hook_library;
    }

    // Workstream 4: Market Intelligence
    if (result.workstream === 4) {
      if (result.data.urgency_drivers) profile.urgency_drivers = result.data.urgency_drivers;
      if (result.data.customer_language_dictionary) profile.customer_language_dictionary = result.data.customer_language_dictionary;
      if (result.data.ugc_prompts) profile.ugc_prompts = result.data.ugc_prompts;
      if (result.data.viral_triggers) profile.viral_triggers = result.data.viral_triggers;
    }

    // Workstream 5: Social Media Content
    if (result.workstream === 5) {
      if (result.data.content_templates) profile.content_templates = result.data.content_templates;
      if (result.data.tiktok_hooks) profile.tiktok_hooks = result.data.tiktok_hooks;
      if (result.data.video_scripts) profile.video_scripts = result.data.video_scripts;
    }
  }

  return profile;
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

function calculateValidationScore(profile: EnhancedProfile, successCount: number): number {
  let score = 0;

  // Workstream success bonus (max 50)
  score += successCount * 10;

  // Core content quality (max 30)
  if (profile.customer_triggers?.length >= 5) score += 6;
  if (profile.urgency_drivers?.length >= 5) score += 6;
  if (profile.objection_handlers?.length >= 4) score += 6;
  if (profile.power_words?.length >= 10) score += 6;
  if (profile.hook_library?.number_hooks?.length >= 4) score += 6;

  // Social media content bonus (max 20)
  if (profile.content_templates && Object.keys(profile.content_templates).length >= 3) score += 7;
  if (profile.tiktok_hooks?.length >= 8) score += 7;
  if (profile.video_scripts?.educational?.length >= 2) score += 6;

  return Math.min(100, score);
}

async function callOpenRouterWithRetry(prompt: string, apiKey: string, workstream: number): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://synapse.app',
          'X-Title': 'Synapse Parallel Profile Generator v2',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 6000,
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
      lastError = error;
      console.warn(`[WS${workstream}] Attempt ${attempt} failed: ${error.message}`);

      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  throw lastError || new Error('Unknown error');
}

function parseJsonResponse(response: string): Partial<EnhancedProfile> {
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
