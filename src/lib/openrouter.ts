// OpenRouter API client for AI content generation

import type { OpenRouterRequest, OpenRouterResponse, OpenRouterMessage } from '@/types';
import { OPENROUTER_MODELS } from './constants';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

console.log('[OpenRouter] API Key loaded:', OPENROUTER_API_KEY ? `${OPENROUTER_API_KEY.substring(0, 20)}...` : 'NOT SET');

if (!OPENROUTER_API_KEY) {
  console.warn('VITE_OPENROUTER_API_KEY is not set. Content generation will not work.');
}

interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

/**
 * Send a chat completion request to OpenRouter
 */
export async function chat(
  messages: OpenRouterMessage[],
  options: ChatOptions = {}
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key is not configured');
  }

  const {
    model = OPENROUTER_MODELS.claude35Sonnet,
    temperature = 0.7,
    maxTokens = 2000,
    topP = 1,
    stream = false,
  } = options;

  const requestBody: OpenRouterRequest = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    top_p: topP,
    stream,
  };

  console.log('[OpenRouter] Making API request:', {
    model,
    messageCount: messages.length,
    hasApiKey: !!OPENROUTER_API_KEY,
    apiKeyPrefix: OPENROUTER_API_KEY?.substring(0, 20)
  });

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'MARBA',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[OpenRouter] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[OpenRouter] Error response:', errorData);
      throw new Error(
        `OpenRouter API error: ${response.status} - ${errorData.error?.message || response.statusText}`
      );
    }

    const data: OpenRouterResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenRouter API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter API error:', error);
    throw error;
  }
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
  generateWithMARBA,
  generateWithSynapse,
  askMarbs,
  calculateMARBAScore,
};
