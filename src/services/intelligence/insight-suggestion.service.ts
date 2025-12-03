/**
 * Insight Suggestion Service
 *
 * Uses Claude Opus 4.5 to analyze selected insights and suggest
 * complementary pairings for stronger marketing content.
 *
 * Created: 2025-11-30
 * Phase: Smart Insight Suggestions Feature
 */

// =============================================================================
// TYPES
// =============================================================================

export interface InsightCard {
  id: string;
  type: string;
  title: string;
  category: string;
  confidence: number;
  description?: string;
  evidence?: string[];
  sources?: Array<{ source: string; quote: string }>;
}

export interface SuggestionResult {
  id: string;
  reason: string;
}

export interface InsightSuggestionResponse {
  suggestions: SuggestionResult[];
}

// =============================================================================
// INSIGHT SUGGESTION SERVICE
// =============================================================================

class InsightSuggestionService {
  private cache: Map<string, SuggestionResult[]> = new Map();
  private apiKey: string;
  private endpoint: string;
  private model = 'anthropic/claude-opus-4.5'; // Claude Opus 4.5 for quality (OpenRouter format)

  constructor() {
    this.apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    this.endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`;
    console.log('[InsightSuggestionService] Initialized with Claude Opus 4.5 via ai-proxy');
  }

  /**
   * Get AI-powered suggestions for complementary insights
   */
  async getSuggestions(
    selectedInsight: InsightCard,
    allInsights: InsightCard[],
    alreadySelectedIds: string[]
  ): Promise<SuggestionResult[]> {
    // Check cache first
    const cacheKey = this.buildCacheKey(selectedInsight.id, alreadySelectedIds);
    if (this.cache.has(cacheKey)) {
      console.log('[InsightSuggestionService] Cache hit for:', selectedInsight.id);
      return this.cache.get(cacheKey)!;
    }

    // Filter available insights (exclude selected ones)
    const availableInsights = allInsights.filter(
      (insight) => !alreadySelectedIds.includes(insight.id) && insight.id !== selectedInsight.id
    );

    if (availableInsights.length === 0) {
      console.log('[InsightSuggestionService] No available insights to suggest');
      return [];
    }

    // Build prompt
    const prompt = this.buildPrompt(selectedInsight, availableInsights);

    try {
      console.log('[InsightSuggestionService] Calling AI for suggestions...');
      const response = await this.callAI(prompt);
      const suggestions = this.parseResponse(response, availableInsights);

      // Cache results
      this.cache.set(cacheKey, suggestions);
      console.log('[InsightSuggestionService] Got suggestions:', suggestions.length);

      return suggestions;
    } catch (error) {
      console.error('[InsightSuggestionService] Failed to get suggestions:', error);
      return [];
    }
  }

  /**
   * Clear cache (useful when insights change significantly)
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[InsightSuggestionService] Cache cleared');
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private buildCacheKey(selectedId: string, alreadySelected: string[]): string {
    return `${selectedId}:${alreadySelected.sort().join(',')}`;
  }

  private buildPrompt(
    selectedInsight: InsightCard,
    availableInsights: InsightCard[]
  ): string {
    // Simplify insights for the prompt to reduce tokens
    const simplifiedSelected = {
      id: selectedInsight.id,
      type: selectedInsight.type,
      title: selectedInsight.title,
      category: selectedInsight.category,
      description: selectedInsight.description?.substring(0, 200)
    };

    const simplifiedAvailable = availableInsights.slice(0, 20).map((i) => ({
      id: i.id,
      type: i.type,
      title: i.title,
      category: i.category,
      description: i.description?.substring(0, 150)
    }));

    return `You are an expert content strategist. Given a selected marketing insight and a pool of available insights, identify 2-3 insights that would pair exceptionally well together for creating compelling content.

SELECTED INSIGHT:
${JSON.stringify(simplifiedSelected, null, 2)}

AVAILABLE INSIGHTS (choose from these):
${JSON.stringify(simplifiedAvailable, null, 2)}

Consider these pairing principles:
- Proof + Claim: Pair evidence with assertions
- Emotion + Logic: Balance heart and mind appeals
- Problem + Solution: Connect pain points with differentiators
- Trend + Action: Link market timing with opportunity
- Customer + Product: Align audience with offering
- Testimonial + Feature: Combine social proof with capabilities

IMPORTANT: Return ONLY valid JSON (no markdown code blocks, no explanation text):
{
  "suggestions": [
    { "id": "exact-insight-id-from-available-list", "reason": "Brief 5-10 word explanation of why this pairs well" }
  ]
}

Return 2-3 suggestions maximum. Use the exact IDs from the AVAILABLE INSIGHTS list.`;
  }

  private async callAI(prompt: string): Promise<string> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.3, // Lower temperature for more consistent suggestions
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    // Handle different response formats
    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content;
    }
    if (data.content && data.content[0]?.text) {
      return data.content[0].text;
    }
    if (typeof data === 'string') {
      return data;
    }

    throw new Error('Unexpected AI response format');
  }

  private parseResponse(
    response: string,
    availableInsights: InsightCard[]
  ): SuggestionResult[] {
    try {
      // Clean the response (remove markdown code blocks if present)
      let cleaned = response.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
      }
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
      }
      cleaned = cleaned.trim();

      const parsed: InsightSuggestionResponse = JSON.parse(cleaned);

      if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
        console.warn('[InsightSuggestionService] Invalid response structure');
        return [];
      }

      // Validate that suggested IDs exist in available insights
      const validIds = new Set(availableInsights.map((i) => i.id));
      const validSuggestions = parsed.suggestions
        .filter((s) => validIds.has(s.id))
        .slice(0, 3); // Max 3 suggestions

      return validSuggestions;
    } catch (error) {
      console.error('[InsightSuggestionService] Failed to parse response:', error);
      console.error('[InsightSuggestionService] Raw response:', response);
      return [];
    }
  }
}

// Export singleton instance
export const insightSuggestionService = new InsightSuggestionService();
export default insightSuggestionService;
