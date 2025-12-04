/**
 * Trigger Title Rewriter Service
 *
 * Uses LLM to rewrite raw trigger titles into clean, grammatically correct,
 * concise card titles. This runs AFTER data collection, BEFORE display.
 */

interface TriggerToRewrite {
  id: string;
  rawTitle: string;
  rawQuote?: string;
  category?: string;
}

interface RewrittenTrigger {
  id: string;
  title: string;
  subtitle?: string;
}

class TriggerTitleRewriterService {
  private endpoint: string;
  private apiKey: string;

  constructor() {
    this.endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`;
    this.apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  }

  /**
   * Rewrite a batch of trigger titles using LLM
   * Batches for efficiency - sends up to 20 titles at once
   */
  async rewriteTitles(triggers: TriggerToRewrite[]): Promise<Map<string, RewrittenTrigger>> {
    const results = new Map<string, RewrittenTrigger>();

    if (triggers.length === 0) return results;

    // Process in batches of 15 for efficiency
    const batchSize = 15;
    const batches: TriggerToRewrite[][] = [];

    for (let i = 0; i < triggers.length; i += batchSize) {
      batches.push(triggers.slice(i, i + batchSize));
    }

    console.log(`[TitleRewriter] Rewriting ${triggers.length} titles in ${batches.length} batches`);

    // Process batches in parallel (max 3 concurrent)
    const batchPromises = batches.map((batch, idx) =>
      this.rewriteBatch(batch, idx)
    );

    const batchResults = await Promise.allSettled(batchPromises);

    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        result.value.forEach((rewritten, id) => {
          results.set(id, rewritten);
        });
      }
    });

    console.log(`[TitleRewriter] Successfully rewrote ${results.size} of ${triggers.length} titles`);
    return results;
  }

  /**
   * Rewrite a single batch of titles
   */
  private async rewriteBatch(
    triggers: TriggerToRewrite[],
    batchIndex: number
  ): Promise<Map<string, RewrittenTrigger>> {
    const results = new Map<string, RewrittenTrigger>();

    try {
      // Build the prompt with all titles
      const titlesForPrompt = triggers.map((t, i) =>
        `${i + 1}. "${t.rawTitle}"`
      ).join('\n');

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          provider: 'openrouter',
          model: 'anthropic/claude-opus-4.5',
          messages: [
            {
              role: 'user',
              content: `Rewrite these trigger card titles into COMPLETE, STANDALONE SENTENCES that a reader can understand immediately.

CRITICAL RULES:
1. MUST be a COMPLETE SENTENCE - grammatically correct, makes sense on its own
2. MUST describe a specific pain point, fear, desire, or insight
3. 8-15 words - not too short, not too long
4. Remove ALL source prefixes (Reddit, G2, Capterra, etc.)
5. Remove ALL meta-descriptions ("Discussion threads about...", "LinkedIn posts discussing...")
6. NO fragments or incomplete thoughts
7. Focus on the HUMAN INSIGHT, not the data source

BAD (incomplete/meta) → GOOD (complete insight):
- "Reddit discussions in r/SaaS mentioning the product" → "Enterprise teams need better real-time collaboration tools"
- "LinkedIn posts or discussions about this AI" → "AI-powered automation reduces manual data entry by 60%"
- "Real customer quotes discussing regulated industry compliance," → "Healthcare teams struggle to maintain HIPAA compliance during audits"
- "Insurance professionals migrated to new platforms after" → "Legacy platform limitations force costly migration decisions"
- "Customer satisfaction scores for" → "Low customer satisfaction drives churn in competitive markets"
- "Discussion threads from Reddit (r/SaaS, r/startups)" → "Startup founders seek affordable alternatives to enterprise pricing"
- "Integration with legacy insurance policy administration systems" → "Legacy system integration delays implementation by months"

INPUT TITLES:
${titlesForPrompt}

OUTPUT: JSON array ONLY - [{"index": 1, "title": "Complete sentence insight"}, ...]`
            }
          ],
          temperature: 0.3,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        console.warn(`[TitleRewriter] Batch ${batchIndex} failed: ${response.status}`);
        // Return original titles as fallback
        triggers.forEach(t => {
          results.set(t.id, { id: t.id, title: this.cleanTitle(t.rawTitle) });
        });
        return results;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || data.content?.[0]?.text || '';

      // Parse the JSON response
      try {
        // Extract JSON array from response (handle markdown code blocks)
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as Array<{ index: number; title: string }>;

          parsed.forEach((item) => {
            const trigger = triggers[item.index - 1];
            if (trigger) {
              results.set(trigger.id, {
                id: trigger.id,
                title: item.title || this.cleanTitle(trigger.rawTitle)
              });
            }
          });
        }
      } catch (parseError) {
        console.warn(`[TitleRewriter] Failed to parse batch ${batchIndex}:`, parseError);
      }

      // Ensure all triggers have a result (use cleaned original as fallback)
      triggers.forEach(t => {
        if (!results.has(t.id)) {
          results.set(t.id, { id: t.id, title: this.cleanTitle(t.rawTitle) });
        }
      });

    } catch (error) {
      console.error(`[TitleRewriter] Batch ${batchIndex} error:`, error);
      // Fallback to cleaned originals
      triggers.forEach(t => {
        results.set(t.id, { id: t.id, title: this.cleanTitle(t.rawTitle) });
      });
    }

    return results;
  }

  /**
   * Quick local cleanup as fallback (no LLM)
   */
  private cleanTitle(title: string): string {
    let cleaned = title
      // Remove source prefixes like "Reddit r/saas:", "G2:", "Capterra:", etc.
      .replace(/^(reddit\s+)?r\/\w+:\s*/gi, '')
      .replace(/^g2(\s+reviews)?:\s*/gi, '')
      .replace(/^capterra:\s*/gi, '')
      .replace(/^trustpilot:\s*/gi, '')
      .replace(/^trustradius:\s*/gi, '')
      .replace(/^forum(\s+discussion)?:\s*/gi, '')
      // Remove "Buyers X about" prefixes
      .replace(/^buyers\s+(evaluating alternatives to|concerned about|considering|weighing)\s*/gi, '')
      // Remove doubled sentiment patterns
      .replace(/buyers\s+(frustrated by|concerned about|worried about)\s+(frustrated|concerned|worried)\s+(that|about|by)/gi, '$2 $3')
      .replace(/frustrated by frustrated/gi, 'frustrated')
      .replace(/worried about worried/gi, 'worried')
      .replace(/concerned about concerned/gi, 'concerned')
      .replace(/evaluating alternatives to worried/gi, 'worried')
      .replace(/evaluating alternatives to concerned/gi, 'concerned')
      // Remove leading quotes
      .replace(/^["']|["']$/g, '')
      // Remove trailing incomplete words/phrases
      .replace(/\s+(with|to|for|the|a|an|\(e\.|\.{2,})$/gi, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();

    // Capitalize first letter
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    // Truncate if too long, but at word boundary
    if (cleaned.length > 70) {
      const words = cleaned.split(' ');
      let result = '';
      for (const word of words) {
        if ((result + ' ' + word).length > 65) break;
        result = result ? result + ' ' + word : word;
      }
      cleaned = result;
    }

    return cleaned;
  }

  /**
   * Rewrite a single title (for real-time use)
   */
  async rewriteSingleTitle(rawTitle: string, rawQuote?: string): Promise<string> {
    // First try local cleanup
    const cleaned = this.cleanTitle(rawTitle);

    // If it looks clean enough, return it
    if (this.looksClean(cleaned)) {
      return cleaned;
    }

    // Otherwise, use LLM
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          provider: 'openrouter',
          model: 'anthropic/claude-opus-4.5',
          messages: [
            {
              role: 'user',
              content: `Rewrite this trigger title to be clear and concise (5-12 words max):

"${rawTitle}"

${rawQuote ? `Original quote: "${rawQuote}"` : ''}

Return ONLY the rewritten title, nothing else.`
            }
          ],
          temperature: 0.3,
          max_tokens: 100,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || data.content?.[0]?.text || '';
        const rewritten = content.replace(/^["']|["']$/g, '').trim();
        if (rewritten.length > 5 && rewritten.length < 100) {
          return rewritten;
        }
      }
    } catch (error) {
      console.warn('[TitleRewriter] Single rewrite failed:', error);
    }

    return cleaned;
  }

  /**
   * Check if a title looks grammatically clean and is a complete sentence
   */
  private looksClean(title: string): boolean {
    const badPatterns = [
      // Doubled words
      /frustrated by frustrated/i,
      /worried about worried/i,
      /concerned about concerned/i,
      /evaluating alternatives to (worried|concerned|frustrated)/i,
      /by by/i,
      /about about/i,
      /that that/i,
      // Meta-descriptions (not actual insights)
      /^reddit discussions/i,
      /^linkedin posts/i,
      /^discussion threads/i,
      /^real customer quotes/i,
      /^customer satisfaction scores/i,
      /mentioning the product$/i,
      /about this ai$/i,
      /about these tools$/i,
      /^comparative pricing/i,
      /capterra shines/i,
      /provides detailed information/i,
      /^g2 reviews/i,
      /^trustpilot reviews/i,
      /^youtube videos/i,
      /^quora questions/i,
      /^forum posts/i,
      /startup founders explore/i,
      /reveals competitive advantages/i,
      /innovative software solutions/i,
      /for operational challenges$/i,
      // Incomplete sentences (ending with prepositions or commas)
      /\s(for|to|with|about|after|before|from|in|on|at|by),?$/i,
      /,$/,  // Trailing comma
    ];

    // Also check minimum sentence structure (subject + verb pattern)
    const hasVerb = /\b(is|are|was|were|have|has|had|need|needs|want|wants|struggle|struggles|drive|drives|force|forces|cause|causes|lead|leads|delay|delays|reduce|reduces|increase|increases|improve|improves|prevent|prevents|enable|enables|allow|allows|require|requires|seek|seeks|report|reports|mention|mentions|show|shows|find|finds)\b/i.test(title);

    return !badPatterns.some(p => p.test(title)) && hasVerb;
  }
}

export const triggerTitleRewriterService = new TriggerTitleRewriterService();
