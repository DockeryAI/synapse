/**
 * Universal AI Proxy Edge Function
 *
 * Securely proxies AI requests to multiple providers:
 * - OpenRouter (Claude, GPT-4, 200+ models)
 * - Perplexity (research and topic exploration)
 * - OpenAI (GPT models, used as fallback)
 *
 * Security: API keys are stored server-side in Supabase Edge Function secrets,
 * never exposed to client-side JavaScript.
 *
 * @module ai-proxy
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, http-referer, x-title',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Provider API endpoints
const PROVIDER_URLS = {
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  perplexity: 'https://api.perplexity.ai/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
};

// Supported providers
type Provider = 'openrouter' | 'perplexity' | 'openai';

// Request interface
interface AIProxyRequest {
  provider: Provider;
  model: string;
  endpoint?: 'chat' | 'embeddings'; // Default: chat
  messages?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  input?: string; // For embeddings
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  /** Key index for parallel processing (0-3). Uses OPENROUTER_API_KEY_{N+1} */
  keyIndex?: number;
}

// Response interface
interface AIProxyResponse {
  success: boolean;
  data?: any;
  error?: string;
  provider?: Provider;
  model?: string;
}

/**
 * Get API key for the specified provider
 * ENHANCED: Multiple OpenRouter keys for parallel processing (4x speedup)
 *
 * For OpenRouter, supports 4 keys: OPENROUTER_API_KEY_1, _2, _3, _4
 * Use keyIndex parameter to select specific key for parallel batch processing
 */
function getProviderApiKey(provider: Provider, keyIndex?: number): string | null {
  // For OpenRouter with keyIndex, use specific numbered key for parallel processing
  if (provider === 'openrouter' && keyIndex !== undefined && keyIndex >= 0 && keyIndex <= 3) {
    const numberedKeyName = `OPENROUTER_API_KEY_${keyIndex + 1}`;
    const numberedKey = Deno.env.get(numberedKeyName);
    if (numberedKey && numberedKey.length > 10) {
      console.log(`[AI-Proxy] OpenRouter key ${keyIndex + 1} selected for parallel processing`);
      return numberedKey;
    }
    // Fall through to default key if numbered key not found
    console.log(`[AI-Proxy] OpenRouter key ${keyIndex + 1} not found, falling back to default`);
  }

  // Try multiple key naming conventions for each provider
  const keyVariants = {
    openrouter: ['OPENROUTER_API_KEY', 'OPENROUTER_API_KEY_1', 'OPEN_ROUTER_API_KEY', 'OPENROUTER_KEY'],
    perplexity: ['PERPLEXITY_API_KEY', 'PERPLEXITY_KEY'],
    openai: ['OPENAI_API_KEY', 'OPENAI_KEY'],
  };

  const variants = keyVariants[provider] || [];

  for (const keyName of variants) {
    const key = Deno.env.get(keyName);
    if (key && key.length > 10) {
      console.log(`[AI-Proxy] ${provider} API key found via ${keyName} (length: ${key.length})`);
      return key;
    }
  }

  // Log all available env vars for debugging (keys only, not values)
  const envKeys = Object.keys(Deno.env.toObject()).filter(k =>
    k.includes('API') || k.includes('KEY') || k.includes('SECRET')
  );
  console.error(`[AI-Proxy] ${provider} API key NOT FOUND. Available env vars: ${envKeys.join(', ')}`);

  return null;
}

/**
 * Validate request parameters
 */
function validateRequest(req: AIProxyRequest): string | null {
  if (!req.provider) {
    return 'Missing required field: provider';
  }

  if (!['openrouter', 'perplexity', 'openai'].includes(req.provider)) {
    return `Invalid provider: ${req.provider}. Must be one of: openrouter, perplexity, openai`;
  }

  if (!req.model) {
    return 'Missing required field: model';
  }

  // For embeddings endpoint
  if (req.endpoint === 'embeddings') {
    if (!req.input) {
      return 'Missing required field for embeddings: input';
    }
    return null;
  }

  // For chat endpoint (default)
  if (!req.messages || !Array.isArray(req.messages) || req.messages.length === 0) {
    return 'Missing or invalid field: messages (must be non-empty array)';
  }

  return null;
}

/**
 * Map model names to correct OpenRouter format
 * Some code uses incorrect model IDs - fix them here
 */
function normalizeModelName(model: string, provider: Provider): string {
  // Fix common model name issues for OpenRouter
  // OpenRouter uses shorthand names without dates
  if (provider === 'openrouter') {
    const modelMappings: Record<string, string> = {
      // Haiku variants - OpenRouter uses anthropic/claude-3.5-haiku (no date)
      'anthropic/claude-3-haiku': 'anthropic/claude-3.5-haiku',
      'anthropic/claude-3-haiku-20240307': 'anthropic/claude-3.5-haiku',
      'anthropic/claude-3.5-haiku': 'anthropic/claude-3.5-haiku',
      'anthropic/claude-3-5-haiku': 'anthropic/claude-3.5-haiku',
      'anthropic/claude-3-5-haiku-20241022': 'anthropic/claude-3.5-haiku',
      'anthropic/claude-haiku': 'anthropic/claude-3.5-haiku',
      // Sonnet 4 (standard)
      'anthropic/claude-3.5-sonnet': 'anthropic/claude-sonnet-4',
      'anthropic/claude-3-5-sonnet': 'anthropic/claude-sonnet-4',
      'anthropic/claude-3-5-sonnet-20241022': 'anthropic/claude-sonnet-4',
      'anthropic/claude-sonnet-4': 'anthropic/claude-sonnet-4',
      // Sonnet 4.5
      'anthropic/claude-sonnet-4.5': 'anthropic/claude-sonnet-4.5',
      'anthropic/claude-sonnet-4-5': 'anthropic/claude-sonnet-4.5',
      'anthropic/claude-sonnet-4-5-20250514': 'anthropic/claude-sonnet-4.5',
      'anthropic/claude-sonnet-4-5-20250929': 'anthropic/claude-sonnet-4.5',
      // Opus 4.5 - HIGHEST QUALITY
      'anthropic/claude-opus-4.5': 'anthropic/claude-opus-4.5',
      // Opus 4 variants (heavyweight)
      'anthropic/claude-opus-4': 'anthropic/claude-opus-4',
      'anthropic/claude-opus-4-5-20250514': 'anthropic/claude-opus-4',
      'anthropic/claude-opus-4.1': 'anthropic/claude-opus-4', // Legacy variant
      'anthropic/claude-3-opus': 'anthropic/claude-3-opus',
      'anthropic/claude-3-opus-20240229': 'anthropic/claude-3-opus',
    };

    const normalized = modelMappings[model] || model;
    if (normalized !== model) {
      console.log(`[AI-Proxy] Model normalized: ${model} → ${normalized}`);
    }
    return normalized;
  }
  return model;
}

/**
 * Make request to AI provider
 * ENHANCED: Auto-fallback to OpenAI if OpenRouter fails
 * Supports parallel processing with keyIndex for 4x speedup
 */
async function callProvider(req: AIProxyRequest): Promise<AIProxyResponse> {
  const apiKey = getProviderApiKey(req.provider, req.keyIndex);

  if (!apiKey) {
    // Try fallback to OpenAI if OpenRouter key is missing
    if (req.provider === 'openrouter') {
      console.log('[AI-Proxy] OpenRouter key missing, trying OpenAI fallback...');
      const openaiKey = getProviderApiKey('openai');
      if (openaiKey) {
        // Convert the request to OpenAI format
        const openaiReq: AIProxyRequest = {
          ...req,
          provider: 'openai',
          model: 'gpt-4o-mini', // Fast and cheap fallback
        };
        return callProvider(openaiReq);
      }
    }

    return {
      success: false,
      error: `API key not configured for provider: ${req.provider}. Check Supabase Edge Function secrets.`,
      provider: req.provider,
    };
  }

  // Determine URL based on endpoint
  let url = PROVIDER_URLS[req.provider];
  if (req.endpoint === 'embeddings' && req.provider === 'openai') {
    url = 'https://api.openai.com/v1/embeddings';
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  // OpenRouter-specific headers
  if (req.provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://synapse-smb.com';
    headers['X-Title'] = 'Synapse SMB Platform';
  }

  // Normalize model name for the provider
  const normalizedModel = normalizeModelName(req.model, req.provider);
  console.log(`[AI-Proxy] Model: ${req.model} → ${normalizedModel}`);

  // Build request body based on endpoint
  let body: string;
  if (req.endpoint === 'embeddings') {
    body = JSON.stringify({
      model: normalizedModel,
      input: req.input,
    });
  } else {
    body = JSON.stringify({
      model: normalizedModel,
      messages: req.messages,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.max_tokens,
      stream: req.stream ?? false,
    });
  }

  try {
    console.log(`[AI-Proxy] Calling ${req.provider} ${req.endpoint || 'chat'} with model ${req.model}`);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI-Proxy] Provider error: ${response.status} - ${errorText}`);

      return {
        success: false,
        error: `Provider returned error: ${response.status} - ${errorText}`,
        provider: req.provider,
      };
    }

    const data = await response.json();
    console.log(`[AI-Proxy] Success: ${req.provider} responded`);

    return {
      success: true,
      data,
      provider: req.provider,
      model: req.model,
    };

  } catch (error) {
    console.error(`[AI-Proxy] Exception calling ${req.provider}:`, error);

    return {
      success: false,
      error: `Failed to call provider: ${error.message}`,
      provider: req.provider,
    };
  }
}

/**
 * Main request handler
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const startTime = Date.now();

  try {
    // Parse request body
    const requestBody = await req.json() as AIProxyRequest;

    // Validate request
    const validationError = validateRequest(requestBody);
    if (validationError) {
      console.error(`[AI-Proxy] Validation error: ${validationError}`);
      return new Response(
        JSON.stringify({ error: validationError }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Call provider
    const result = await callProvider(requestBody);

    const responseTime = Date.now() - startTime;
    console.log(`[AI-Proxy] Request completed in ${responseTime}ms`);

    // Return response
    if (result.success) {
      return new Response(
        JSON.stringify(result.data),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          error: result.error,
          provider: result.provider
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('[AI-Proxy] Unexpected error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

console.log('[AI-Proxy] Edge Function ready and listening...');
