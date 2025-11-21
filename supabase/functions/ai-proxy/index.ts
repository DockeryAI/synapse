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
 */
function getProviderApiKey(provider: Provider): string | null {
  const keyMap = {
    openrouter: Deno.env.get('OPENROUTER_API_KEY'),
    perplexity: Deno.env.get('PERPLEXITY_API_KEY'),
    openai: Deno.env.get('OPENAI_API_KEY'),
  };

  return keyMap[provider] || null;
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
 * Make request to AI provider
 */
async function callProvider(req: AIProxyRequest): Promise<AIProxyResponse> {
  const apiKey = getProviderApiKey(req.provider);

  if (!apiKey) {
    return {
      success: false,
      error: `API key not configured for provider: ${req.provider}`,
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

  // Build request body based on endpoint
  let body: string;
  if (req.endpoint === 'embeddings') {
    body = JSON.stringify({
      model: req.model,
      input: req.input,
    });
  } else {
    body = JSON.stringify({
      model: req.model,
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
