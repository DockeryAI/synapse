/**
 * INDUSTRY CODE DETECTION SERVICE
 *
 * Uses Perplexity (web search) to find the CORRECT NAICS code
 * for free-form industry input that doesn't match our database.
 *
 * Why Perplexity? Because it does LIVE WEB SEARCH to find the actual
 * NAICS code instead of guessing from training data.
 */

export interface CodeDetectionResult {
  naics_code: string;
  display_name: string;
  category: string;
  keywords: string[];
  confidence: number;
  reasoning: string;
}

export class IndustryCodeDetectionService {
  /**
   * Use Perplexity (web search) to find the correct NAICS code
   */
  static async detectCode(
    freeformIndustry: string
  ): Promise<CodeDetectionResult> {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration not found');
    }

    // Use Perplexity with web search to find the ACTUAL NAICS code
    const prompt = `Search the web to find the correct NAICS code for: "${freeformIndustry}"

Search for "${freeformIndustry} NAICS code" and find the official 6-digit NAICS classification.

After searching, return ONLY valid JSON in this exact format:
{
  "naics_code": "541611",
  "display_name": "Fractional CFO Services",
  "category": "Professional Services",
  "keywords": ["fractional cfo", "outsourced cfo", "part-time cfo", "virtual cfo", "cfo services"],
  "confidence": 0.95,
  "reasoning": "Based on web search results, fractional CFO services are classified under NAICS 541611 (Administrative Management and General Management Consulting Services) because they provide strategic financial management consulting rather than traditional accounting services."
}

Important:
- SEARCH THE WEB to find the correct code - do NOT guess
- Use the MOST SPECIFIC 6-digit code from your search results
- Confidence should reflect how certain the web sources are
- Include the source of your information in the reasoning`;

    try {
      console.log('[IndustryCodeDetection] Using Perplexity web search for:', freeformIndustry);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'BranDock Industry Code Detection'
        },
        body: JSON.stringify({
          provider: 'perplexity',
          model: 'sonar-pro',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Parse JSON from response
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ||
                       content.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('Could not parse Perplexity response as JSON');
      }

      const result: CodeDetectionResult = JSON.parse(
        jsonMatch[1] || jsonMatch[0]
      );

      console.log('[IndustryCodeDetection] Perplexity found:', result);

      return result;
    } catch (error) {
      console.error('[IndustryCodeDetection] Detection failed:', error);
      throw new Error(`Failed to detect industry code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate a NAICS code format
   */
  static isValidNAICSFormat(code: string): boolean {
    // NAICS codes are 2-6 digits
    return /^\d{2,6}$/.test(code);
  }
}
