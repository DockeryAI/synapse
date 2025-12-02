/**
 * NAICS CODE DETECTION SERVICE
 *
 * Uses Claude Opus 4.1 to detect NAICS codes from free-form industry input
 * Follows PATTERNS.md with retry logic and Zod validation
 *
 * Features:
 * - callAPIWithRetry for resilient API calls
 * - Zod validation for type safety
 * - Integration with Brandock NAICS database
 * - Fuzzy matching against existing codes
 */

import { callAPIWithRetry } from '@/lib/api-helpers';
import { COMPLETE_NAICS_CODES, type NAICSOption } from '@/data/complete-naics-codes';
import {
  type NAICSCandidate,
  validateNAICSCandidate
} from '@/types/industry-profile.types';

// ==========================================
// FUZZY MATCHING
// ==========================================

/**
 * Calculate similarity score between two strings (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // Exact match
  if (s1 === s2) return 1.0;

  // Contains match
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;

  // Levenshtein-like word overlap
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);

  const commonWords = words1.filter(w => words2.includes(w)).length;
  const totalWords = Math.max(words1.length, words2.length);

  return commonWords / totalWords;
}

/**
 * Fuzzy match user input against Brandock NAICS database
 */
function fuzzyMatchNAICS(userInput: string): NAICSOption[] {
  const input = userInput.toLowerCase().trim();

  const matches = COMPLETE_NAICS_CODES
    .map(naics => {
      // Check display name
      const nameScore = calculateSimilarity(input, naics.display_name);

      // Check keywords
      const keywordScore = Math.max(
        ...naics.keywords.map(kw => calculateSimilarity(input, kw))
      );

      // Best score
      const score = Math.max(nameScore, keywordScore);

      return { naics, score };
    })
    .filter(m => m.score > 0.3) // Minimum threshold
    .sort((a, b) => b.score - a.score)
    .slice(0, 5) // Top 5 matches
    .map(m => m.naics);

  return matches;
}

// ==========================================
// NAICS DETECTOR SERVICE
// ==========================================

export class NAICSDetectorService {
  /**
   * Detect NAICS code from free-form industry input
   *
   * Process:
   * 1. Try fuzzy matching against Brandock database
   * 2. If no good match, use Opus 4.1 for detection
   * 3. Validate result with Zod
   */
  static async detectNAICSCode(
    freeformIndustry: string
  ): Promise<NAICSCandidate> {
    console.log(`[NAICSDetector] Detecting NAICS for: "${freeformIndustry}"`);

    // Validate input
    if (!freeformIndustry || freeformIndustry.trim().length === 0) {
      throw new Error('Industry input is required');
    }

    if (freeformIndustry.length > 500) {
      throw new Error('Industry input too long (max 500 characters)');
    }

    // Try fuzzy matching first
    const fuzzyMatches = fuzzyMatchNAICS(freeformIndustry);

    if (fuzzyMatches.length > 0) {
      const bestMatch = fuzzyMatches[0];
      const matchScore = calculateSimilarity(
        freeformIndustry.toLowerCase(),
        bestMatch.display_name.toLowerCase()
      );

      // If we have a strong fuzzy match (>0.7), use it
      if (matchScore > 0.7) {
        console.log(`[NAICSDetector] Strong fuzzy match found: ${bestMatch.display_name} (${matchScore.toFixed(2)})`);

        return {
          naics_code: bestMatch.naics_code,
          display_name: bestMatch.display_name,
          category: bestMatch.category,
          keywords: bestMatch.keywords,
          confidence: matchScore,
          reasoning: `Fuzzy matched to existing NAICS database entry with ${(matchScore * 100).toFixed(0)}% confidence`
        };
      }
    }

    // Use Opus for detection
    console.log('[NAICSDetector] No strong fuzzy match, calling Opus 4.1...');

    const result = await this.detectWithOpus(freeformIndustry, fuzzyMatches);

    return result;
  }

  /**
   * Use Claude Opus 4.1 to detect NAICS code
   */
  private static async detectWithOpus(
    freeformIndustry: string,
    fuzzyMatches: NAICSOption[]
  ): Promise<NAICSCandidate> {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration not found');
    }

    const fuzzyContext = fuzzyMatches.length > 0
      ? `\n\nPossible matches from database:\n${fuzzyMatches.slice(0, 3).map(m =>
        `- ${m.display_name} (${m.naics_code}) - ${m.category}`
      ).join('\n')}`
      : '';

    const prompt = `You are an expert in NAICS (North American Industry Classification System) codes and SMB business classification.

A user entered this industry: "${freeformIndustry}"${fuzzyContext}

Your task:
1. Determine the most appropriate 6-digit NAICS code for this industry
2. Provide the standard industry name for this code
3. Categorize the industry (e.g., Healthcare, Professional Services, Retail, Technology, Construction, Food Service, Personal Services, etc.)
4. Generate 5-10 relevant keywords for matching
5. Assign a confidence score (0.0-1.0) based on how specific the input was
6. Explain your reasoning

Return ONLY valid JSON in this exact format:
{
  "naics_code": "621210",
  "display_name": "Dental Offices",
  "category": "Healthcare",
  "keywords": ["dentist", "dental", "teeth", "oral health", "orthodontist"],
  "confidence": 0.95,
  "reasoning": "The user input 'dentist' matches NAICS 621210 (Dental Offices), which covers establishments of dentists primarily engaged in practicing dentistry."
}

Important:
- Use the MOST SPECIFIC 6-digit code that matches
- Confidence should be 0.0 to 1.0 (use 0.5+ only if reasonably confident)
- Be precise - don't guess if truly ambiguous (confidence < 0.5)
- Keywords should be natural search terms people use
- If one of the possible matches from database is correct, use that exact code and name`;

    const rawResult = await callAPIWithRetry(
      async () => {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Synapse NAICS Detection'
          },
          body: JSON.stringify({
            provider: 'openrouter',
            model: 'anthropic/claude-sonnet-4-5-20250929',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3, // Lower temperature for more deterministic results
            max_tokens: 1000
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Opus API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('Invalid API response structure');
        }

        return data.choices[0].message.content;
      },
      {
        maxRetries: 2,
        onError: (error) => console.error('[NAICSDetector] API call error:', error)
      }
    );

    // Extract JSON from response
    const json = this.extractJSON(rawResult);

    if (!json) {
      throw new Error('Could not parse Opus response as JSON');
    }

    // Validate with Zod
    try {
      const validated = validateNAICSCandidate(json);
      console.log('[NAICSDetector] Opus detected:', validated);
      return validated;
    } catch (error) {
      console.error('[NAICSDetector] Validation failed:', error);
      throw new Error(`NAICS detection validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract JSON from Opus response
   */
  private static extractJSON(content: string): any | null {
    // Try 1: Extract from JSON code block
    const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      try {
        return JSON.parse(jsonBlockMatch[1]);
      } catch (e) {
        console.warn('[NAICSDetector] Failed to parse JSON block');
      }
    }

    // Try 2: Extract raw JSON object
    const jsonObjectMatch = content.match(/\{[\s\S]*?\}/);
    if (jsonObjectMatch) {
      try {
        return JSON.parse(jsonObjectMatch[0]);
      } catch (e) {
        console.warn('[NAICSDetector] Failed to parse raw JSON');
      }
    }

    return null;
  }

  /**
   * Validate NAICS code format
   */
  static isValidNAICSFormat(code: string): boolean {
    return /^\d{2,6}$/.test(code);
  }

  /**
   * Check if NAICS code exists in Brandock database
   */
  static existsInDatabase(naicsCode: string): boolean {
    return COMPLETE_NAICS_CODES.some(n => n.naics_code === naicsCode);
  }

  /**
   * Get NAICS info from Brandock database
   */
  static getFromDatabase(naicsCode: string): NAICSOption | undefined {
    return COMPLETE_NAICS_CODES.find(n => n.naics_code === naicsCode);
  }
}
