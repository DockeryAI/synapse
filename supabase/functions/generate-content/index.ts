/**
 * Deno Edge Function: Content Generation
 *
 * Provides two modes of content generation:
 * 1. MARBA Mode: Fast, direct content generation using Claude Sonnet 3.5
 * 2. Synapse Mode: Enhanced generation with psychology scoring, connections, and power words
 *
 * @module generate-content
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'anthropic/claude-3.5-sonnet';

interface GenerateRequest {
  brandId: string;
  platform: string;
  topic: string;
  pillarId?: string;
  mode?: 'marba' | 'synapse';
}

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface BillingEvent {
  brand_id: string;
  provider: string;
  api_name: string;
  feature_name: string;
  use_case: string;
  request_type: string;
  model_used: string;
  tokens_input?: number;
  tokens_output?: number;
  tokens_total?: number;
  cost_total: number;
  response_time_ms: number;
  status: string;
  error_message?: string;
}

/**
 * Main request handler
 */
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

    const {
      brandId,
      platform,
      topic,
      pillarId,
      mode = 'marba',
    } = await req.json() as GenerateRequest;

    if (!brandId || !platform || !topic) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: brandId, platform, topic' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let content;
    let generationMetadata = {};
    let billingEvent: Partial<BillingEvent> = {
      brand_id: brandId,
      provider: 'openrouter',
      api_name: 'openrouter',
      feature_name: mode === 'marba' ? 'marba_content_generation' : 'synapse_content_generation',
      use_case: `${platform} content for topic: ${topic}`,
      request_type: 'completion',
      model_used: MODEL,
    };

    if (mode === 'marba') {
      content = await generateWithMarba({ platform, topic, pillarId }, supabase, billingEvent);
      generationMetadata = {
        mode: 'marba',
        model: MODEL,
        enhanced: false,
      };
    } else if (mode === 'synapse') {
      content = await generateWithSynapse({ platform, topic, pillarId, brandId }, supabase, billingEvent);
      generationMetadata = {
        mode: 'synapse',
        model: MODEL,
        enhanced: true,
        psychologyScore: content.psychologyScore,
        connectionsFound: content.connections?.length || 0,
      };
    }

    // Record billing event
    const responseTime = Date.now() - startTime;
    await recordBillingEvent(supabase, {
      ...billingEvent,
      response_time_ms: responseTime,
      status: 'success',
    } as BillingEvent);

    return new Response(
      JSON.stringify({
        content: content.text,
        variations: content.variations || [],
        metadata: {
          ...generationMetadata,
          responseTimeMs: responseTime,
        },
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Content generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * MARBA Mode: Fast content generation with 3 variations
 */
async function generateWithMarba(
  params: { platform: string; topic: string; pillarId?: string },
  supabase: any,
  billingEvent: Partial<BillingEvent>
) {
  const { platform, topic } = params;

  const systemPrompt = `You are a professional content creator specializing in ${platform} content.
Generate engaging, platform-optimized content that resonates with the target audience.
Focus on clarity, engagement, and actionable value.`;

  const userPrompt = `Create ${platform} content about: ${topic}

Requirements:
1. Generate ONE primary version of the content
2. Then create 3 distinct variations with different angles:
   - Variation 1: Educational/Informative angle
   - Variation 2: Inspirational/Motivational angle
   - Variation 3: Conversational/Story-based angle

Format your response as JSON:
{
  "primary": "main content here",
  "variations": ["variation 1", "variation 2", "variation 3"]
}`;

  const response = await callOpenRouter([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], billingEvent);

  // Parse JSON response
  try {
    const parsed = JSON.parse(response.content);
    return {
      text: parsed.primary,
      variations: parsed.variations || [],
    };
  } catch {
    // Fallback if not valid JSON
    return {
      text: response.content,
      variations: [],
    };
  }
}

/**
 * Synapse Mode: Enhanced generation with psychology and connections
 */
async function generateWithSynapse(
  params: { platform: string; topic: string; pillarId?: string; brandId: string },
  supabase: any,
  billingEvent: Partial<BillingEvent>
) {
  const { platform, topic, brandId } = params;

  // Fetch brand context for better personalization
  const { data: brand } = await supabase
    .from('brands')
    .select('name, industry, target_audience')
    .eq('id', brandId)
    .single();

  const systemPrompt = `You are Synapse, an advanced AI content strategist with expertise in psychology, persuasion, and audience connection.

Your task is to create highly optimized ${platform} content that:
1. Leverages psychological triggers (curiosity, urgency, social proof, authority)
2. Uses power words strategically
3. Creates emotional connections
4. Discovers non-obvious connections between concepts
5. Maximizes engagement potential

Brand Context:
- Name: ${brand?.name || 'Unknown'}
- Industry: ${brand?.industry || 'Unknown'}
- Target Audience: ${brand?.target_audience || 'General'}`;

  const userPrompt = `Create psychologically optimized ${platform} content about: ${topic}

Generate content with enhanced psychology and provide a detailed analysis.

Return your response as JSON with this structure:
{
  "primary": "main optimized content",
  "variations": [
    "variation focusing on curiosity and intrigue",
    "variation using social proof and authority",
    "variation with emotional storytelling"
  ],
  "analysis": {
    "psychologyScore": 8.5,
    "connections": [
      {"from": "concept A", "to": "concept B", "strength": 0.9, "insight": "why this connection matters"}
    ],
    "powerWords": ["list", "of", "power", "words", "used"],
    "psychologyTriggers": ["curiosity", "urgency", "social_proof"],
    "emotionalTone": "inspiring|informative|urgent",
    "suggestions": ["improvement suggestion 1", "improvement suggestion 2"]
  }
}`;

  const response = await callOpenRouter([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], billingEvent);

  try {
    const parsed = JSON.parse(response.content);
    return {
      text: parsed.primary,
      variations: parsed.variations || [],
      psychologyScore: parsed.analysis?.psychologyScore || 7.0,
      connections: parsed.analysis?.connections || [],
      powerWords: parsed.analysis?.powerWords || [],
      psychologyTriggers: parsed.analysis?.psychologyTriggers || [],
      suggestions: parsed.analysis?.suggestions || [],
    };
  } catch (e) {
    console.error('Failed to parse Synapse response:', e);
    return {
      text: response.content,
      variations: [],
      psychologyScore: 7.0,
      connections: [],
      powerWords: [],
      suggestions: [],
    };
  }
}

/**
 * Call OpenRouter API with Claude Sonnet 3.5
 */
async function callOpenRouter(
  messages: OpenRouterMessage[],
  billingEvent: Partial<BillingEvent>
): Promise<{ content: string; usage: any }> {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://marba.app',
      'X-Title': 'MARBA Platform',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  // Update billing event with usage data
  if (data.usage) {
    billingEvent.tokens_input = data.usage.prompt_tokens;
    billingEvent.tokens_output = data.usage.completion_tokens;
    billingEvent.tokens_total = data.usage.total_tokens;

    // Estimate cost (approximate rates for Claude Sonnet 3.5)
    const inputCost = (data.usage.prompt_tokens / 1000000) * 3.0; // $3 per 1M input tokens
    const outputCost = (data.usage.completion_tokens / 1000000) * 15.0; // $15 per 1M output tokens
    billingEvent.cost_total = inputCost + outputCost;
  }

  return {
    content: data.choices[0].message.content,
    usage: data.usage,
  };
}

/**
 * Record billing event in database
 */
async function recordBillingEvent(supabase: any, event: BillingEvent) {
  try {
    const { error } = await supabase
      .from('api_billing_events')
      .insert(event);

    if (error) {
      console.error('Failed to record billing event:', error);
    }
  } catch (e) {
    console.error('Error recording billing event:', e);
  }
}
