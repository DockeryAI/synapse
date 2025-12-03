/**
 * Battlecard Generator Service
 *
 * Generates UVP-aware competitive battlecards for each competitor.
 * All advantages and objection handlers are written relative to the brand's positioning.
 *
 * Created: 2025-11-29 (Phase 13)
 */

import { supabase } from '@/utils/supabase/client';
import type { CompetitorBattlecard, CompetitorGap } from '@/types/competitor-intelligence.types';

// ============================================================================
// TYPES
// ============================================================================

export interface BattlecardGenerationRequest {
  brand_id: string;
  competitor_id: string;
  competitor_name: string;

  // Brand context
  brand_name: string;
  unique_solution: string;
  key_benefit: string;
  target_customer: string;
  products: string[];

  // Competitor intelligence
  competitor_positioning?: string;
  competitor_weaknesses?: string[];
  gaps?: CompetitorGap[];
  customer_complaints?: string[];
}

export interface BattlecardResult {
  competitor_id: string;
  our_advantages: string[];
  their_advantages: string[];
  key_objection_handlers: Array<{
    objection: string;
    response: string;
  }>;
  win_themes: string[];
  loss_reasons: string[];
  ideal_icp_overlap: string;
}

// ============================================================================
// PROMPT
// ============================================================================

const BATTLECARD_GENERATION_PROMPT = `
You are a competitive strategist generating a battlecard for {brand_name} vs {competitor_name}.

BRAND CONTEXT:
- Brand Name: {brand_name}
- UVP: {unique_solution}
- Key Benefit: {key_benefit}
- Target Customer: {target_customer}
- Products/Services: {products_list}

COMPETITOR INTELLIGENCE:
- Competitor: {competitor_name}
- Their Positioning: {competitor_positioning}
- Their Weaknesses: {competitor_weaknesses}
- Gaps We Can Exploit: {gaps_summary}
- Customer Complaints About Them: {customer_complaints}

Generate a competitive battlecard in JSON format:

{
  "our_advantages": [
    "Specific advantage of {brand_name} over {competitor_name} - reference the UVP",
    "Another advantage - be specific, not generic"
  ],
  "their_advantages": [
    "Where {competitor_name} genuinely beats {brand_name} - be honest",
    "Another area where they're strong"
  ],
  "key_objection_handlers": [
    {
      "objection": "But {competitor_name} has more enterprise customers",
      "response": "True, but {brand_name}'s {key_benefit} means faster time-to-value. Ask them how long implementation took at those enterprises."
    },
    {
      "objection": "Their pricing is lower",
      "response": "Compare total cost of ownership. Factor in implementation time, support costs, and the developer resources needed."
    }
  ],
  "win_themes": [
    "Main talking point to use when competing against {competitor_name}",
    "Second key message that resonates with {target_customer}"
  ],
  "loss_reasons": [
    "Scenario where we'd likely lose to {competitor_name}",
    "Another situation where they're the better fit"
  ],
  "ideal_icp_overlap": "Description of the customer profile most likely to switch from {competitor_name} to {brand_name}"
}

CRITICAL REQUIREMENTS:
1. our_advantages MUST reference {brand_name}'s specific UVP and {key_benefit} - not generic statements
2. their_advantages should be honest - acknowledging competitor strengths builds credibility
3. key_objection_handlers should provide specific, tactical responses sales can use
4. win_themes should be memorable 1-sentence talking points
5. ideal_icp_overlap describes WHO is most likely to switch - be specific about company type/size/situation

Generate 3-5 items for each array. Respond with valid JSON only.
`;

// ============================================================================
// SERVICE CLASS
// ============================================================================

class BattlecardGeneratorService {
  /**
   * Generate a competitive battlecard
   */
  async generateBattlecard(request: BattlecardGenerationRequest): Promise<BattlecardResult> {
    console.log('[Battlecard] Generating for', request.competitor_name);

    const gapsSummary = request.gaps?.length
      ? request.gaps.slice(0, 5).map(g => `- ${g.title}: ${g.the_void}`).join('\n')
      : 'No specific gaps identified yet';

    const productsList = request.products?.length
      ? request.products.join(', ')
      : 'Not specified';

    const prompt = BATTLECARD_GENERATION_PROMPT
      .replace(/{brand_name}/g, request.brand_name)
      .replace(/{competitor_name}/g, request.competitor_name)
      .replace('{unique_solution}', request.unique_solution)
      .replace(/{key_benefit}/g, request.key_benefit)
      .replace(/{target_customer}/g, request.target_customer)
      .replace('{products_list}', productsList)
      .replace('{competitor_positioning}', request.competitor_positioning || 'Unknown')
      .replace('{competitor_weaknesses}', request.competitor_weaknesses?.join(', ') || 'Not yet analyzed')
      .replace('{gaps_summary}', gapsSummary)
      .replace('{customer_complaints}', request.customer_complaints?.slice(0, 5).join('\n- ') || 'No complaints collected');

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
            model: 'anthropic/claude-opus-4.5',
            messages: [
              {
                role: 'system',
                content: 'You are a competitive strategy expert creating sales battlecards. Respond only with valid JSON.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.4,
            max_tokens: 2000
          })
        }
      );

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '{}';

      // Parse response
      let result: BattlecardResult;
      try {
        // Try to extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
        const parsed = JSON.parse(jsonStr);

        result = {
          competitor_id: request.competitor_id,
          our_advantages: parsed.our_advantages || [],
          their_advantages: parsed.their_advantages || [],
          key_objection_handlers: (parsed.key_objection_handlers || []).map((oh: any) => ({
            objection: oh.objection || '',
            response: oh.response || ''
          })),
          win_themes: parsed.win_themes || [],
          loss_reasons: parsed.loss_reasons || [],
          ideal_icp_overlap: parsed.ideal_icp_overlap || ''
        };
      } catch (parseError) {
        console.error('[Battlecard] Failed to parse response:', parseError);
        result = {
          competitor_id: request.competitor_id,
          our_advantages: [],
          their_advantages: [],
          key_objection_handlers: [],
          win_themes: [],
          loss_reasons: [],
          ideal_icp_overlap: ''
        };
      }

      console.log('[Battlecard] Generated:', {
        our_advantages: result.our_advantages.length,
        their_advantages: result.their_advantages.length,
        objection_handlers: result.key_objection_handlers.length,
        win_themes: result.win_themes.length
      });

      return result;

    } catch (error) {
      console.error('[Battlecard] Generation failed:', error);
      return {
        competitor_id: request.competitor_id,
        our_advantages: [],
        their_advantages: [],
        key_objection_handlers: [],
        win_themes: [],
        loss_reasons: [],
        ideal_icp_overlap: ''
      };
    }
  }

  /**
   * Save battlecard to brand-specific table
   */
  async saveBattlecard(
    brand_id: string,
    competitor_id: string,
    battlecard: BattlecardResult
  ): Promise<void> {
    const { error } = await supabase
      .from('brand_competitor_battlecards')
      .upsert({
        brand_id,
        competitor_id,
        our_advantages: battlecard.our_advantages,
        their_advantages: battlecard.their_advantages,
        key_objection_handlers: battlecard.key_objection_handlers,
        win_themes: battlecard.win_themes,
        loss_reasons: battlecard.loss_reasons,
        ideal_icp_overlap: battlecard.ideal_icp_overlap,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'brand_id,competitor_id'
      });

    if (error) {
      console.error('[Battlecard] Failed to save:', error);
      throw error;
    }

    console.log('[Battlecard] Saved for brand', brand_id, 'competitor', competitor_id);
  }

  /**
   * Load battlecard from brand-specific table
   */
  async loadBattlecard(
    brand_id: string,
    competitor_id: string
  ): Promise<CompetitorBattlecard | null> {
    const { data, error } = await supabase
      .from('brand_competitor_battlecards')
      .select('*')
      .eq('brand_id', brand_id)
      .eq('competitor_id', competitor_id)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      competitor_id: data.competitor_id,
      our_advantages: data.our_advantages || [],
      their_advantages: data.their_advantages || [],
      key_objection_handlers: data.key_objection_handlers || [],
      win_themes: data.win_themes || [],
      loss_reasons: data.loss_reasons || [],
      ideal_icp_overlap: data.ideal_icp_overlap || ''
    };
  }

  /**
   * Load all battlecards for a brand
   */
  async loadAllBattlecards(brand_id: string): Promise<Map<string, CompetitorBattlecard>> {
    const { data, error } = await supabase
      .from('brand_competitor_battlecards')
      .select('*')
      .eq('brand_id', brand_id);

    const map = new Map<string, CompetitorBattlecard>();

    if (error || !data) {
      return map;
    }

    for (const row of data) {
      map.set(row.competitor_id, {
        competitor_id: row.competitor_id,
        our_advantages: row.our_advantages || [],
        their_advantages: row.their_advantages || [],
        key_objection_handlers: row.key_objection_handlers || [],
        win_themes: row.win_themes || [],
        loss_reasons: row.loss_reasons || [],
        ideal_icp_overlap: row.ideal_icp_overlap || ''
      });
    }

    return map;
  }
}

// Export singleton instance
export const battlecardGenerator = new BattlecardGeneratorService();
