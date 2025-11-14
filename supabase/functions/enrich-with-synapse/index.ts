/**
 * Deno Edge Function: Synapse Content Enrichment
 *
 * Analyzes content for psychological appeal and provides enhancements:
 * - Psychology scoring (emotional appeal, persuasion effectiveness)
 * - Connection discovery (finding relationships between concepts)
 * - Power word identification and optimization
 * - Psychological trigger analysis
 * - Enhancement suggestions
 *
 * @module enrich-with-synapse
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'anthropic/claude-3.5-sonnet';

type EnrichmentType = 'full' | 'psychology' | 'connections' | 'powerwords' | 'quick';

interface EnrichRequest {
  content: string;
  enrichmentType?: EnrichmentType;
  brandId?: string;
  context?: {
    platform?: string;
    contentType?: string;
    targetAudience?: string;
  };
}

interface BillingEvent {
  brand_id?: string;
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
      content,
      enrichmentType = 'full',
      brandId,
      context,
    } = await req.json() as EnrichRequest;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check cache first (if content hash exists in synapse_analysis_cache)
    const contentHash = await generateHash(content);
    const { data: cachedAnalysis } = await supabase
      .from('synapse_analysis_cache')
      .select('analysis_result, created_at')
      .eq('content_hash', contentHash)
      .eq('analysis_type', enrichmentType)
      .single();

    // Use cache if less than 7 days old
    if (cachedAnalysis) {
      const cacheAge = Date.now() - new Date(cachedAnalysis.created_at).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      if (cacheAge < sevenDays) {
        return new Response(
          JSON.stringify({
            ...cachedAnalysis.analysis_result,
            cached: true,
            cacheAge: Math.floor(cacheAge / 1000 / 60), // minutes
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Perform Synapse analysis
    const billingEvent: Partial<BillingEvent> = {
      brand_id: brandId,
      provider: 'openrouter',
      api_name: 'openrouter',
      feature_name: 'synapse_enrichment',
      use_case: `${enrichmentType} enrichment analysis`,
      request_type: 'completion',
      model_used: MODEL,
    };

    const analysis = await performSynapseAnalysis(
      content,
      enrichmentType,
      context,
      billingEvent
    );

    // Cache the analysis
    await supabase
      .from('synapse_analysis_cache')
      .upsert({
        content_hash: contentHash,
        original_content: content.substring(0, 1000), // Store first 1000 chars
        analysis_type: enrichmentType,
        analysis_result: analysis,
        brand_id: brandId,
      });

    // Record billing event
    const responseTime = Date.now() - startTime;
    await recordBillingEvent(supabase, {
      ...billingEvent,
      response_time_ms: responseTime,
      status: 'success',
    } as BillingEvent);

    return new Response(
      JSON.stringify({
        ...analysis,
        cached: false,
        metadata: {
          responseTimeMs: responseTime,
          model: MODEL,
          enrichmentType,
        },
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Synapse enrichment error:', error);
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
 * Perform Synapse analysis using AI
 */
async function performSynapseAnalysis(
  content: string,
  enrichmentType: EnrichmentType,
  context: any,
  billingEvent: Partial<BillingEvent>
) {
  const systemPrompt = `You are Synapse, an advanced AI system specializing in content psychology and persuasion analysis.

Your expertise includes:
- Psychological triggers (curiosity, urgency, social proof, authority, scarcity, reciprocity)
- Emotional appeal analysis
- Power word identification
- Conceptual connection discovery
- Persuasion effectiveness scoring
- Cognitive biases and heuristics
- Audience resonance optimization

${context?.platform ? `Platform: ${context.platform}` : ''}
${context?.contentType ? `Content Type: ${context.contentType}` : ''}
${context?.targetAudience ? `Target Audience: ${context.targetAudience}` : ''}`;

  let userPrompt = '';

  if (enrichmentType === 'full') {
    userPrompt = `Analyze this content comprehensively:

"${content}"

Provide a complete analysis in JSON format:
{
  "psychologyScore": 7.5,
  "psychologyBreakdown": {
    "emotionalAppeal": 8.0,
    "persuasiveness": 7.0,
    "clarity": 8.5,
    "engagement": 7.5,
    "credibility": 7.0
  },
  "connections": [
    {
      "from": "concept A",
      "to": "concept B",
      "type": "causal|contrast|analogy|support",
      "strength": 0.9,
      "insight": "Why this connection is powerful"
    }
  ],
  "powerWords": [
    {
      "word": "proven",
      "category": "authority",
      "impact": "high",
      "position": 12
    }
  ],
  "psychologyTriggers": [
    {
      "trigger": "social_proof",
      "strength": "high|medium|low",
      "evidence": "What text triggers this"
    }
  ],
  "emotionalTone": {
    "primary": "inspiring|informative|urgent|professional",
    "secondary": ["curious", "confident"],
    "sentiment": 0.7
  },
  "suggestions": [
    {
      "type": "enhance|fix|consider",
      "priority": "high|medium|low",
      "suggestion": "Specific improvement",
      "rationale": "Why this helps",
      "example": "Example of improvement"
    }
  ],
  "enhancedVersion": "An improved version of the content"
}`;
  } else if (enrichmentType === 'psychology') {
    userPrompt = `Score the psychological effectiveness of this content:

"${content}"

Return JSON:
{
  "psychologyScore": 7.5,
  "psychologyBreakdown": {
    "emotionalAppeal": 8.0,
    "persuasiveness": 7.0,
    "clarity": 8.5,
    "engagement": 7.5,
    "credibility": 7.0
  },
  "psychologyTriggers": [],
  "emotionalTone": {}
}`;
  } else if (enrichmentType === 'connections') {
    userPrompt = `Discover conceptual connections in this content:

"${content}"

Return JSON:
{
  "connections": [
    {
      "from": "concept A",
      "to": "concept B",
      "type": "causal|contrast|analogy|support",
      "strength": 0.9,
      "insight": "Why this matters"
    }
  ]
}`;
  } else if (enrichmentType === 'powerwords') {
    userPrompt = `Identify power words and their impact:

"${content}"

Return JSON:
{
  "powerWords": [
    {
      "word": "proven",
      "category": "authority|emotion|urgency|exclusivity",
      "impact": "high|medium|low",
      "position": 12
    }
  ],
  "suggestions": ["Additional power words that could be added"]
}`;
  } else {
    // quick analysis
    userPrompt = `Quick analysis of this content:

"${content}"

Return JSON with basic scores and top 3 suggestions:
{
  "psychologyScore": 7.5,
  "topTriggers": ["curiosity", "authority"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}`;
  }

  const response = await callOpenRouter([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], billingEvent);

  try {
    const parsed = JSON.parse(response.content);
    return {
      original: content,
      ...parsed,
    };
  } catch (e) {
    console.error('Failed to parse Synapse analysis:', e);
    return {
      original: content,
      psychologyScore: 5.0,
      connections: [],
      powerWords: [],
      suggestions: ['Analysis generated but parsing failed'],
      rawResponse: response.content,
    };
  }
}

/**
 * Generate hash for content (simple implementation)
 */
async function generateHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Call OpenRouter API
 */
async function callOpenRouter(
  messages: Array<{ role: string; content: string }>,
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
      temperature: 0.6,
      max_tokens: 3000,
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

    const inputCost = (data.usage.prompt_tokens / 1000000) * 3.0;
    const outputCost = (data.usage.completion_tokens / 1000000) * 15.0;
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
