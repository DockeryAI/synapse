// OpenRouter API client for AI content generation
//
// PARALLEL ARCHITECTURE (2025-12-01):
// - Supports keyIndex parameter for 4-key rotation via ai-proxy
// - parallelChat() enables concurrent requests with automatic key distribution
// - 4x effective rate limit capacity when using all keys

import type { OpenRouterRequest, OpenRouterResponse, OpenRouterMessage } from '@/types';
import { OPENROUTER_MODELS, DEFAULT_MODEL } from './constants';

// AI Proxy configuration - secure server-side API calls
const AI_PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[OpenRouter] Using AI Proxy:', AI_PROXY_URL ? 'configured' : 'NOT SET');

if (!SUPABASE_ANON_KEY) {
  console.warn('VITE_SUPABASE_ANON_KEY is not set. Content generation will not work.');
}

interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  /** Key index (0-3) for parallel processing - routes to different OpenRouter keys */
  keyIndex?: number;
}

/**
 * Send a chat completion request to OpenRouter
 * Supports keyIndex for parallel processing across 4 API keys
 */
export async function chat(
  messages: OpenRouterMessage[],
  options: ChatOptions = {}
): Promise<string> {
  if (!SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration is missing');
  }

  const {
    model = DEFAULT_MODEL, // Opus 4.5 for speed + quality
    temperature = 0.7,
    maxTokens = 2000,
    topP = 1,
    stream = false,
    keyIndex,
  } = options;

  const requestBody: Record<string, any> = {
    provider: 'openrouter',  // Route through ai-proxy to OpenRouter
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    top_p: topP,
    stream,
  };

  // Add keyIndex for parallel processing (0-3 routes to different OpenRouter keys)
  if (keyIndex !== undefined) {
    requestBody.keyIndex = keyIndex;
  }

  console.log('[OpenRouter] Making API request via ai-proxy:', {
    model,
    messageCount: messages.length,
    provider: 'openrouter',
    keyIndex: keyIndex ?? 'auto',
  });

  try {
    const response = await fetch(AI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[OpenRouter] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[OpenRouter] Error response:', errorData);
      throw new Error(
        `AI Proxy error: ${response.status} - ${errorData.error || response.statusText}`
      );
    }

    const data: OpenRouterResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from AI Proxy');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('AI Proxy error:', error);
    throw error;
  }
}

/**
 * Execute multiple chat requests in parallel using different API keys
 * Distributes requests across 4 keys for 4x throughput
 *
 * @param requests Array of {messages, options} to process in parallel
 * @returns Array of responses in same order as requests
 */
export async function parallelChat(
  requests: Array<{ messages: OpenRouterMessage[]; options?: ChatOptions }>
): Promise<string[]> {
  console.log(`[OpenRouter] Starting parallel chat with ${requests.length} requests`);

  // Distribute requests across 4 keys using round-robin
  const promises = requests.map((req, index) => {
    const keyIndex = index % 4; // Distribute across 4 keys
    return chat(req.messages, { ...req.options, keyIndex });
  });

  // Execute all in parallel
  const results = await Promise.allSettled(promises);

  // Extract results, throwing if any failed
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error(`[OpenRouter] Parallel request ${index} failed:`, result.reason);
      throw result.reason;
    }
  });
}

/**
 * Execute multiple chat requests in parallel, returning partial results on failure
 * Use this when you want to continue even if some requests fail
 */
export async function parallelChatWithPartialResults(
  requests: Array<{ messages: OpenRouterMessage[]; options?: ChatOptions }>
): Promise<Array<{ success: boolean; content: string; error?: string }>> {
  console.log(`[OpenRouter] Starting parallel chat with partial results for ${requests.length} requests`);

  const promises = requests.map((req, index) => {
    const keyIndex = index % 4;
    return chat(req.messages, { ...req.options, keyIndex });
  });

  const results = await Promise.allSettled(promises);

  return results.map((result) => {
    if (result.status === 'fulfilled') {
      return { success: true, content: result.value };
    } else {
      return {
        success: false,
        content: '',
        error: result.reason?.message || 'Unknown error',
      };
    }
  });
}

/**
 * Generate content with MARBA mode (fast, straightforward)
 */
export async function generateWithMARBA(params: {
  platform: string;
  topic: string;
  tone?: string;
  length?: 'short' | 'medium' | 'long';
  includeHashtags?: boolean;
  includeCTA?: boolean;
}): Promise<{ text: string; variations: string[] }> {
  const { platform, topic, tone = 'professional', length = 'medium', includeHashtags = true, includeCTA = true } = params;

  const systemMessage: OpenRouterMessage = {
    role: 'system',
    content: `You are a professional social media content writer. Create engaging, platform-optimized content that drives results. Keep it authentic and conversational.`,
  };

  const userMessage: OpenRouterMessage = {
    role: 'user',
    content: `Create ${length} ${platform} content about: ${topic}

Tone: ${tone}
${includeHashtags ? 'Include relevant hashtags.' : ''}
${includeCTA ? 'Include a clear call-to-action.' : ''}

Provide:
1. Main version
2. Three variations (slightly different angles/hooks)

Format as JSON:
{
  "main": "content here",
  "variations": ["variation 1", "variation 2", "variation 3"]
}`,
  };

  try {
    const response = await chat([systemMessage, userMessage], {
      model: OPENROUTER_MODELS.claude35Sonnet,
      temperature: 0.8,
      maxTokens: 1500,
    });

    const parsed = JSON.parse(response);
    return {
      text: parsed.main,
      variations: parsed.variations,
    };
  } catch (error) {
    console.error('MARBA generation error:', error);
    // Fallback if JSON parsing fails
    return {
      text: 'Content generation failed. Please try again.',
      variations: [],
    };
  }
}

/**
 * Generate content with Synapse mode (enhanced with psychology)
 */
export async function generateWithSynapse(params: {
  platform: string;
  topic: string;
  tone?: string;
  length?: 'short' | 'medium' | 'long';
  industryContext?: string;
  audienceInsights?: string[];
  edginess?: number;
}): Promise<{
  text: string;
  variations: string[];
  psychologyScore: number;
  connections: Array<{ from: string; to: string; strength: number }>;
  powerWords: string[];
  provenance?: any;
}> {
  const {
    platform,
    topic,
    tone = 'professional',
    length = 'medium',
    industryContext = '',
    audienceInsights = [],
    edginess = 50,
  } = params;

  const systemMessage: OpenRouterMessage = {
    role: 'system',
    content: `You are an expert in persuasive communication and behavioral psychology. You create content that:
- Leverages psychological triggers (curiosity, urgency, social proof, etc.)
- Uses power words and emotional language strategically
- Creates strong mental connections between concepts
- Optimizes for engagement and action

You analyze content through the lens of:
- Cialdini's 6 principles of persuasion
- Cognitive psychology and mental models
- Emotional resonance and storytelling
- Behavioral economics`,
  };

  const contextInfo = industryContext ? `\nIndustry context: ${industryContext}` : '';
  const audienceInfo = audienceInsights.length > 0 ? `\nAudience insights: ${audienceInsights.join(', ')}` : '';

  // Get edginess description
  const edginessDescription =
    edginess <= 25
      ? 'Professional and polished tone, corporate-safe'
      : edginess <= 50
      ? 'Approachable and warm tone, relatable and friendly'
      : edginess <= 75
      ? 'Casual and conversational tone, witty and personable'
      : 'Edgy and bold tone, attention-grabbing and playful';

  const userMessage: OpenRouterMessage = {
    role: 'user',
    content: `Create highly persuasive ${length} ${platform} content about: ${topic}${contextInfo}${audienceInfo}

Tone: ${tone}
Edginess Level: ${edginess}/100 (${edginessDescription})

Requirements:
- Use psychology-backed persuasion techniques
- Include power words strategically
- Create strong conceptual connections
- Optimize for emotional impact
- Match the specified edginess level (${edginess}/100)
- Include relevant hashtags
- Include a compelling call-to-action

Provide:
1. Main version (optimized for psychology)
2. Three variations (different psychological angles)
3. Psychology score (0-10)
4. Key conceptual connections used
5. Power words included

Format as JSON:
{
  "main": "content here",
  "variations": ["variation 1", "variation 2", "variation 3"],
  "psychologyScore": 8.5,
  "connections": [
    {"from": "concept1", "to": "concept2", "strength": 0.9}
  ],
  "powerWords": ["exclusive", "guaranteed", "breakthrough"]
}`,
  };

  try {
    const response = await chat([systemMessage, userMessage], {
      model: OPENROUTER_MODELS.claude35Sonnet,
      temperature: 0.7,
      maxTokens: 2000,
    });

    const parsed = JSON.parse(response);
    return {
      text: parsed.main,
      variations: parsed.variations || [],
      psychologyScore: parsed.psychologyScore || 7.0,
      connections: parsed.connections || [],
      powerWords: parsed.powerWords || [],
    };
  } catch (error) {
    console.error('Synapse generation error:', error);
    // Fallback if JSON parsing fails
    return {
      text: 'Content generation failed. Please try again.',
      variations: [],
      psychologyScore: 0,
      connections: [],
      powerWords: [],
    };
  }
}

/**
 * Ask Marbs assistant a question
 */
export async function askMarbs(
  message: string,
  context: {
    section?: string;
    pageData?: Record<string, any>;
    conversationHistory?: OpenRouterMessage[];
  }
): Promise<string> {
  const systemMessage: OpenRouterMessage = {
    role: 'system',
    content: `You are Marbs, an expert AI marketing assistant for MARBA (a marketing intelligence platform). You help users:
- Understand their marketing data and insights
- Create effective content strategies
- Optimize campaigns based on data
- Navigate the MARBA platform
- Make data-driven marketing decisions

You are contextually aware, proactive, and always focused on delivering value. Keep responses concise and actionable.`,
  };

  const contextInfo = context.section ? `\nCurrent section: ${context.section}` : '';
  const dataInfo = context.pageData ? `\nPage data: ${JSON.stringify(context.pageData).slice(0, 500)}` : '';

  const userMessage: OpenRouterMessage = {
    role: 'user',
    content: `${message}${contextInfo}${dataInfo}`,
  };

  const messages = [systemMessage];

  // Include conversation history if available
  if (context.conversationHistory && context.conversationHistory.length > 0) {
    messages.push(...context.conversationHistory.slice(-6)); // Last 6 messages for context
  }

  messages.push(userMessage);

  return await chat(messages, {
    model: OPENROUTER_MODELS.claude35Sonnet,
    temperature: 0.7,
    maxTokens: 1000,
  });
}

/**
 * Calculate MARBA score for content
 */
export async function calculateMARBAScore(
  content: string,
  context?: {
    platform?: string;
    targetAudience?: string[];
    industry?: string;
  }
): Promise<any> {
  const systemMessage: OpenRouterMessage = {
    role: 'system',
    content: `You are an expert content analyst. You evaluate content using the MARBA framework:

M - Messaging (20 points): Clarity, value proposition, differentiation, consistency
A - Authenticity (20 points): Brand voice, transparency, human connection, social proof
R - Relevance (20 points): Audience alignment, timeliness, context awareness, personalization
B - Brand Alignment (20 points): Visual consistency, tone match, values alignment, positioning
A - Action (20 points): Clear CTA, urgency, friction reduction, conversion optimization

Provide detailed scoring and actionable recommendations.`,
  };

  const contextInfo = context
    ? `\nPlatform: ${context.platform || 'general'}
Audience: ${context.targetAudience?.join(', ') || 'general'}
Industry: ${context.industry || 'general'}`
    : '';

  const userMessage: OpenRouterMessage = {
    role: 'user',
    content: `Score this content using the MARBA framework:${contextInfo}

Content:
"${content}"

Provide detailed JSON:
{
  "overall": 85,
  "breakdown": {
    "messaging": {"score": 17, "details": "..."},
    "authenticity": {"score": 16, "details": "..."},
    "relevance": {"score": 18, "details": "..."},
    "brand_alignment": {"score": 16, "details": "..."},
    "action": {"score": 18, "details": "..."}
  },
  "insights": [
    {"category": "strength", "title": "...", "description": "..."}
  ],
  "recommendations": ["...", "..."]
}`,
  };

  try {
    const response = await chat([systemMessage, userMessage], {
      model: OPENROUTER_MODELS.claude35Sonnet,
      temperature: 0.3,
      maxTokens: 2000,
    });

    return JSON.parse(response);
  } catch (error) {
    console.error('MARBA scoring error:', error);
    throw error;
  }
}

export default {
  chat,
  parallelChat,
  parallelChatWithPartialResults,
  generateWithMARBA,
  generateWithSynapse,
  askMarbs,
  calculateMARBAScore,
};
