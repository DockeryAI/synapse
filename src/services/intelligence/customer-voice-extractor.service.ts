/**
 * Customer Voice Extractor Service
 *
 * Extracts voice-of-customer insights from competitor reviews and discussions.
 * Results are brand-specific - framed as opportunities relative to the user's UVP.
 *
 * Created: 2025-11-29 (Phase 13)
 */

import { supabase } from '@/utils/supabase/client';
import type { CustomerVoice, SourceQuote } from '@/types/competitor-intelligence.types';

// ============================================================================
// TYPES
// ============================================================================

export interface CustomerVoiceExtractionRequest {
  brand_id: string;
  competitor_id: string;
  competitor_name: string;

  // Brand context for framing opportunities
  brand_name: string;
  unique_solution: string;
  key_benefit: string;
  target_customer: string;

  // Competitor data to analyze
  review_data: string;
  reddit_data?: string;
  g2_data?: string;
}

export interface CustomerVoiceResult {
  competitor_id: string;
  pain_points: string[];
  desires: string[];
  objections: string[];
  switching_triggers: string[];
  source_quotes: SourceQuote[];
}

// ============================================================================
// PROMPT
// ============================================================================

const CUSTOMER_VOICE_EXTRACTION_PROMPT = `
You are analyzing customer feedback about {competitor_name} to extract voice-of-customer insights for {brand_name}.

BRAND CONTEXT (use to frame opportunities):
- Brand: {brand_name}
- UVP: {unique_solution}
- Key Benefit: {key_benefit}
- Target Customer: {target_customer}

COMPETITOR REVIEWS AND DISCUSSIONS:
{review_data}

{reddit_section}

{g2_section}

Extract the following from the customer feedback. Frame pain_points and switching_triggers as opportunities for {brand_name}:

{
  "pain_points": [
    "Specific pain point expressed by customers - include context (e.g., 'Integration with existing CRM takes weeks of developer time')"
  ],
  "desires": [
    "What customers wish the product did better (e.g., 'Wish it had a visual workflow builder')"
  ],
  "objections": [
    "Why customers hesitate to buy or continue using (e.g., 'Pricing is confusing - unclear what's included')"
  ],
  "switching_triggers": [
    "What makes customers leave for alternatives (e.g., 'Support response times exceeding 48 hours')"
  ],
  "source_quotes": [
    {
      "quote": "EXACT quote from the reviews - copy verbatim, do not paraphrase",
      "source": "G2|Reddit|Capterra|Google Reviews|etc",
      "sentiment": "positive|negative|neutral",
      "url": "https://... if available",
      "relevance": 0.0-1.0
    }
  ]
}

CRITICAL REQUIREMENTS:
1. Include 5-10 source_quotes with EXACT text - do not summarize or paraphrase
2. source_quotes should be the most impactful quotes that reveal pain points or desires
3. Frame pain_points as opportunities where {brand_name}'s {key_benefit} can win
4. switching_triggers are gold - these reveal why customers leave competitors
5. Include the URL in source_quotes when available in the source data

Respond with valid JSON only.
`;

// ============================================================================
// SERVICE CLASS
// ============================================================================

class CustomerVoiceExtractorService {
  /**
   * Extract customer voice insights for a competitor
   */
  async extractCustomerVoice(request: CustomerVoiceExtractionRequest): Promise<CustomerVoiceResult> {
    console.log('[CustomerVoice] Extracting voice for', request.competitor_name);

    let reviewData = request.review_data || '';

    // FALLBACK: If no review data from collectors, use Perplexity to research
    if (!reviewData && !request.reddit_data && !request.g2_data) {
      console.log('[CustomerVoice] No review data from collectors, using Perplexity fallback for', request.competitor_name);
      try {
        const perplexityResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              provider: 'perplexity',
              model: 'sonar-pro',
              messages: [
                {
                  role: 'system',
                  content: 'You are researching real customer feedback. Find actual quotes from review sites, Reddit, forums, etc.'
                },
                {
                  role: 'user',
                  content: `Find 5-10 REAL customer reviews and complaints about ${request.competitor_name} from G2, Capterra, TrustPilot, Reddit, or other sources.

For each, provide:
1. The exact quote (in quotation marks)
2. The source platform
3. What pain point or desire it reveals

Focus on:
- What frustrates customers
- What they wish was different
- Why they switched away
- What they love (competitor strengths to acknowledge)`
                }
              ],
              temperature: 0.2,
              max_tokens: 2000
            })
          }
        );

        if (perplexityResponse.ok) {
          const data = await perplexityResponse.json();
          reviewData = data.choices?.[0]?.message?.content || '';
          console.log('[CustomerVoice] Perplexity fallback returned', reviewData.length, 'chars');
        }
      } catch (err) {
        console.warn('[CustomerVoice] Perplexity fallback failed:', err);
      }
    }

    const redditSection = request.reddit_data
      ? `REDDIT DISCUSSIONS:\n${request.reddit_data}`
      : '';

    const g2Section = request.g2_data
      ? `G2 REVIEWS:\n${request.g2_data}`
      : '';

    const prompt = CUSTOMER_VOICE_EXTRACTION_PROMPT
      .replace(/{competitor_name}/g, request.competitor_name)
      .replace(/{brand_name}/g, request.brand_name)
      .replace('{unique_solution}', request.unique_solution)
      .replace(/{key_benefit}/g, request.key_benefit)
      .replace('{target_customer}', request.target_customer)
      .replace('{review_data}', reviewData || 'No direct review data available')
      .replace('{reddit_section}', redditSection)
      .replace('{g2_section}', g2Section);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            provider: 'openrouter',
            model: 'anthropic/claude-sonnet-4',
            messages: [
              {
                role: 'system',
                content: 'You are a customer research analyst extracting voice-of-customer insights. Respond only with valid JSON.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 2500
          })
        }
      );

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '{}';

      // Parse response
      let result: CustomerVoiceResult;
      try {
        // Try to extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
        const parsed = JSON.parse(jsonStr);

        result = {
          competitor_id: request.competitor_id,
          pain_points: parsed.pain_points || [],
          desires: parsed.desires || [],
          objections: parsed.objections || [],
          switching_triggers: parsed.switching_triggers || [],
          source_quotes: (parsed.source_quotes || []).map((sq: any) => ({
            quote: sq.quote || '',
            source: sq.source || 'Unknown',
            url: sq.url || '',
            sentiment: sq.sentiment || 'neutral',
            relevance: sq.relevance || 0.5
          }))
        };
      } catch (parseError) {
        console.error('[CustomerVoice] Failed to parse response:', parseError);
        result = {
          competitor_id: request.competitor_id,
          pain_points: [],
          desires: [],
          objections: [],
          switching_triggers: [],
          source_quotes: []
        };
      }

      console.log('[CustomerVoice] Extracted:', {
        pain_points: result.pain_points.length,
        desires: result.desires.length,
        objections: result.objections.length,
        switching_triggers: result.switching_triggers.length,
        source_quotes: result.source_quotes.length
      });

      return result;

    } catch (error) {
      console.error('[CustomerVoice] Extraction failed:', error);
      return {
        competitor_id: request.competitor_id,
        pain_points: [],
        desires: [],
        objections: [],
        switching_triggers: [],
        source_quotes: []
      };
    }
  }

  /**
   * Save customer voice to brand-specific table
   */
  async saveCustomerVoice(
    brand_id: string,
    competitor_id: string,
    voice: CustomerVoiceResult
  ): Promise<void> {
    const { error } = await supabase
      .from('brand_competitor_voice')
      .upsert({
        brand_id,
        competitor_id,
        pain_points: voice.pain_points,
        desires: voice.desires,
        objections: voice.objections,
        switching_triggers: voice.switching_triggers,
        source_quotes: voice.source_quotes,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'brand_id,competitor_id'
      });

    if (error) {
      console.error('[CustomerVoice] Failed to save:', error);
      throw error;
    }

    console.log('[CustomerVoice] Saved for brand', brand_id, 'competitor', competitor_id);
  }

  /**
   * Load customer voice from brand-specific table
   */
  async loadCustomerVoice(
    brand_id: string,
    competitor_id: string
  ): Promise<CustomerVoice | null> {
    const { data, error } = await supabase
      .from('brand_competitor_voice')
      .select('*')
      .eq('brand_id', brand_id)
      .eq('competitor_id', competitor_id)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      competitor_id: data.competitor_id,
      pain_points: data.pain_points || [],
      desires: data.desires || [],
      objections: data.objections || [],
      switching_triggers: data.switching_triggers || [],
      source_quotes: data.source_quotes || []
    };
  }

  /**
   * Load all customer voices for a brand
   */
  async loadAllCustomerVoices(brand_id: string): Promise<Map<string, CustomerVoice>> {
    const { data, error } = await supabase
      .from('brand_competitor_voice')
      .select('*')
      .eq('brand_id', brand_id);

    const map = new Map<string, CustomerVoice>();

    if (error || !data) {
      return map;
    }

    for (const row of data) {
      map.set(row.competitor_id, {
        competitor_id: row.competitor_id,
        pain_points: row.pain_points || [],
        desires: row.desires || [],
        objections: row.objections || [],
        switching_triggers: row.switching_triggers || [],
        source_quotes: row.source_quotes || []
      });
    }

    return map;
  }
}

// Export singleton instance
export const customerVoiceExtractor = new CustomerVoiceExtractorService();
