/**
 * INDUSTRY CODE DETECTION SERVICE
 *
 * Uses Claude Opus 4.1 to detect the correct NAICS code
 * for free-form industry input that doesn't match our database
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
   * Use Opus 4.1 to detect NAICS code for unknown industry
   */
  static async detectCode(
    freeformIndustry: string
  ): Promise<CodeDetectionResult> {
    const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

    const prompt = `You are an expert in NAICS (North American Industry Classification System) codes and SMB business classification.

A user entered this industry: "${freeformIndustry}"

Your task:
1. Determine the most appropriate 6-digit NAICS code for this industry
2. Provide the standard industry name for this code
3. Categorize the industry (e.g., Healthcare, Professional Services, Retail, etc.)
4. Generate 5-10 relevant keywords for matching
5. Explain your reasoning

Return ONLY valid JSON in this exact format:
{
  "naics_code": "621111",
  "display_name": "Pediatric Medicine",
  "category": "Healthcare",
  "keywords": ["pediatrician", "children", "kids", "child health", "family doctor"],
  "confidence": 0.95,
  "reasoning": "The user input 'kids doctor' most closely matches Pediatric Medicine (NAICS 621111), which specifically covers physicians who treat children and adolescents."
}

Important:
- Use the MOST SPECIFIC 6-digit code that matches
- Confidence should be 0.0 to 1.0 (use 0.5+ only if reasonably confident)
- Be precise - don't guess if truly ambiguous (confidence < 0.5)
- Keywords should be natural search terms people use`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'BranDock Industry Code Detection'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-opus-4.1',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`Opus API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Parse JSON from response
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ||
                       content.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('Could not parse Opus response as JSON');
      }

      const result: CodeDetectionResult = JSON.parse(
        jsonMatch[1] || jsonMatch[0]
      );

      console.log('[IndustryCodeDetection] Opus detected:', result);

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
