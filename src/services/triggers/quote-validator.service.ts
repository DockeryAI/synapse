/**
 * Quote Validator Service
 *
 * Validates whether text is a real customer quote vs meta-commentary/garbage.
 * Uses pattern matching for obvious cases and Haiku for borderline cases.
 *
 * Phase L.2 implementation.
 *
 * Created: 2025-11-30
 */

export interface QuoteValidationResult {
  isReal: boolean;
  reason: 'first-person-narrative' | 'meta-commentary' | 'prompt-leakage' | 'no-data-response' | 'too-short' | 'haiku-validated' | 'haiku-rejected' | 'obvious-quote';
  confidence: number;
}

/**
 * Patterns that DEFINITELY indicate a real customer quote
 * If matched, we can skip LLM validation (fast path)
 */
const REAL_QUOTE_PATTERNS = [
  // First-person switching/migration statements
  /^["']?(We|I|Our team|My company|My team) (switched|moved|migrated|left|cancelled|dropped)/i,
  /^["']?(We|I|Our team) (were|was|are|am) (frustrated|disappointed|surprised|shocked)/i,
  /^["']?(After|Since|When we|Once we) (using|implementing|buying|adopting|deploying)/i,

  // First-person frustration
  /^["']?(I'm|We're|I am|We are) (so )?(frustrated|tired|fed up|done|sick)/i,
  /^["']?(I|We) (hate|hated|can't stand|couldn't stand)/i,
  /^["']?(I|We) (wasted|spent|lost) (\d+|several|many|too many)/i,

  // First-person evaluation
  /^["']?(We're|I'm|We are|I am) (evaluating|comparing|looking at|considering)/i,
  /^["']?(Has anyone|Does anyone) (switched|migrated|moved|tried)/i,
  /^["']?(What's|What is) the best alternative to/i,

  // Specific outcome statements
  /^["']?(After \d+ (months?|weeks?|years?))/i,
  /^["']?(It took us|We spent) \d+/i,
  /^["']?The (hidden costs|implementation|onboarding|support)/i,

  // Direct experience markers
  /^["']?In my experience/i,
  /^["']?From my (perspective|experience|point of view)/i,
  /^["']?As (a|an) (user|customer|admin|developer|manager)/i,
];

/**
 * Patterns that DEFINITELY indicate NOT a real quote (garbage)
 * If matched, we reject immediately (fast path)
 */
const NOT_QUOTE_PATTERNS = [
  // Meta-descriptions about sources
  /^(G2|Capterra|Reddit|LinkedIn|TrustRadius|Trustpilot|Yelp|Glassdoor) (reviews?|discussions?|posts?|threads?|users?|feedback)/i,
  /^(Reviews?|Discussions?|Posts?|Comments?|Feedback) (on|from|at|in) (G2|Capterra|Reddit)/i,

  // No-data responses
  /^No (customer|significant|direct|relevant|specific|first-person) (quotes?|feedback|data|voices?|narratives?|experiences?)/i,
  /^(Limited|Insufficient|Minimal) (customer|user)? ?(feedback|data|quotes?|responses?)/i,
  /narratives? were (not )?(found|discovered|available)/i,
  /quotes? (are )?(not |un)available/i,
  /could not (find|locate|identify)/i,

  // Generic statements about customers
  /^(Users?|Customers?|Companies?|Businesses?|Organizations?) (often|typically|generally|commonly|frequently)/i,
  /^(Many|Most|Some) (users?|customers?|companies?|businesses?)/i,
  /^(Technology|Enterprise|Business) professionals? (seek|want|need)/i,

  // Prompt leakage
  /^Generate (a )?JSON/i,
  /^I cannot fulfill/i,
  /^I can't (help|assist|provide)/i,
  /^Would you like me to/i,
  /^Here's why:/i,
  /^Unfortunately,? I/i,
  /^As an AI/i,
  /^Based on (the|my) (search|analysis)/i,

  // Marketing speak (not customer voice)
  /^(Innovative|Revolutionary|Cutting-edge|Industry-leading)/i,
  /^(This|Our|The) (platform|solution|product) (provides|offers|delivers)/i,
  /reveals? competitive advantages/i,
  /provides? (detailed|comprehensive|in-depth) (information|analysis)/i,

  // Analysis statements
  /^(Comparative|Market|Industry) (analysis|research|data)/i,
  /^(Research|Data|Analysis) (shows|indicates|suggests)/i,
  /^According to (industry|market|recent)/i,

  // Instructions/meta-commentary
  /^(Search|Find|Look for|Identify) (customer|user)?/i,
  /^Return (EXACTLY|ONLY|the following)/i,
  /^(CRITICAL|IMPORTANT|NOTE):/i,
];

/**
 * Patterns that indicate a quote has specific, verifiable details
 * (higher confidence)
 */
const SPECIFIC_DETAIL_PATTERNS = [
  /\d+\s*(hours?|days?|weeks?|months?|years?)/i,  // Time references
  /\d+\s*%/,                                       // Percentages
  /\$\d+/,                                        // Money amounts
  /\d+\s*(users?|employees?|team members?|people)/i, // People counts
  /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, // Days
  /(january|february|march|april|may|june|july|august|september|october|november|december)/i, // Months
  /v\d+(\.\d+)?/i,                                // Version numbers
  /(CEO|CTO|VP|Director|Manager|Engineer|Developer|Admin)/i, // Job titles
];

class QuoteValidatorService {
  private haikuEndpoint: string;
  private haikuApiKey: string;

  constructor() {
    this.haikuEndpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`;
    this.haikuApiKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  }

  /**
   * Validate whether text is a real customer quote
   * Uses fast pattern matching first, then Haiku for edge cases
   */
  async validateQuote(text: string): Promise<QuoteValidationResult> {
    // Trim and normalize
    const normalized = text.trim();

    // 1. Too short = not a real quote
    if (normalized.length < 20) {
      return {
        isReal: false,
        reason: 'too-short',
        confidence: 1.0
      };
    }

    // 2. Check for obvious NOT-quote patterns (fast reject)
    if (this.isObviouslyNotQuote(normalized)) {
      return {
        isReal: false,
        reason: this.categorizeRejection(normalized),
        confidence: 0.95
      };
    }

    // 3. Check for obvious REAL quote patterns (fast accept)
    if (this.isObviouslyRealQuote(normalized)) {
      return {
        isReal: true,
        reason: 'first-person-narrative',
        confidence: this.hasSpecificDetails(normalized) ? 0.95 : 0.85
      };
    }

    // 4. Borderline case: use Haiku for validation
    // For now, implement a heuristic-based fallback
    // TODO: Wire up actual Haiku call when API is available
    return this.heuristicValidation(normalized);
  }

  /**
   * Batch validate multiple quotes efficiently
   */
  async validateQuotes(quotes: string[]): Promise<Map<string, QuoteValidationResult>> {
    const results = new Map<string, QuoteValidationResult>();

    // Process in parallel
    await Promise.all(
      quotes.map(async (quote) => {
        const result = await this.validateQuote(quote);
        results.set(quote, result);
      })
    );

    return results;
  }

  /**
   * Fast check for obviously real quotes
   */
  private isObviouslyRealQuote(text: string): boolean {
    return REAL_QUOTE_PATTERNS.some(p => p.test(text));
  }

  /**
   * Fast check for obviously NOT quotes
   */
  private isObviouslyNotQuote(text: string): boolean {
    return NOT_QUOTE_PATTERNS.some(p => p.test(text));
  }

  /**
   * Check if quote has specific verifiable details
   */
  private hasSpecificDetails(text: string): boolean {
    return SPECIFIC_DETAIL_PATTERNS.some(p => p.test(text));
  }

  /**
   * Categorize why a quote was rejected
   */
  private categorizeRejection(text: string): QuoteValidationResult['reason'] {
    const lowerText = text.toLowerCase();

    if (/generate|json|fulfill|as an ai/i.test(text)) {
      return 'prompt-leakage';
    }
    if (/no (customer|significant|direct|quotes?|data)|not (found|available)|could not find/i.test(text)) {
      return 'no-data-response';
    }
    return 'meta-commentary';
  }

  /**
   * Heuristic validation for borderline cases
   * Used when pattern matching is inconclusive
   */
  private heuristicValidation(text: string): QuoteValidationResult {
    let score = 0.5; // Start neutral

    // Positive signals
    if (/["']/.test(text.charAt(0))) score += 0.1; // Starts with quote mark
    if (/\b(I|we|our|my)\b/i.test(text)) score += 0.15; // First-person pronouns
    if (this.hasSpecificDetails(text)) score += 0.15; // Has specific details
    if (/[!?]$/.test(text)) score += 0.05; // Ends with emotion
    if (/\b(switched|migrated|frustrated|hate|love|wasted|spent)\b/i.test(text)) score += 0.1; // Action/emotion words

    // Negative signals
    if (/\b(users?|customers?|companies?)\s+(often|typically|generally)/i.test(text)) score -= 0.3;
    if (/\b(platform|solution|product)\s+(provides|offers)/i.test(text)) score -= 0.25;
    if (/\b(innovative|revolutionary|cutting-edge|industry-leading)\b/i.test(text)) score -= 0.3;
    if (/\b(according to|research shows|data indicates)\b/i.test(text)) score -= 0.2;

    // Clamp to 0-1
    score = Math.max(0, Math.min(1, score));

    return {
      isReal: score >= 0.6,
      reason: score >= 0.6 ? 'obvious-quote' : 'meta-commentary',
      confidence: Math.abs(score - 0.5) * 2 // Higher confidence when further from 0.5
    };
  }

  /**
   * Call Haiku for validation (future implementation)
   * Currently a placeholder that falls back to heuristics
   */
  private async callHaiku(text: string): Promise<QuoteValidationResult> {
    try {
      const response = await fetch(this.haikuEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.haikuApiKey}`,
        },
        body: JSON.stringify({
          provider: 'anthropic',
          model: 'claude-3-haiku-20240307',
          messages: [
            {
              role: 'user',
              content: `Is this a real customer quote (something a person actually said/wrote about their experience)?

Text: "${text}"

Answer ONLY: YES or NO (one word)`
            }
          ],
          max_tokens: 5,
          temperature: 0,
        }),
      });

      if (!response.ok) {
        console.warn('[QuoteValidator] Haiku call failed, using heuristics');
        return this.heuristicValidation(text);
      }

      const data = await response.json();
      const answer = data.content?.[0]?.text?.trim().toUpperCase() || '';
      const isReal = answer.startsWith('YES');

      return {
        isReal,
        reason: isReal ? 'haiku-validated' : 'haiku-rejected',
        confidence: 0.9
      };
    } catch (error) {
      console.warn('[QuoteValidator] Haiku call error, using heuristics:', error);
      return this.heuristicValidation(text);
    }
  }
}

// Export singleton instance
export const quoteValidatorService = new QuoteValidatorService();
