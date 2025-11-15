/**
 * ContentValidator - Quality control for generated content
 *
 * MARBA'S BRAND VOICE ENFORCEMENT:
 * This validator is the last line of defense for maintaining MARBA's
 * opportunity-focused philosophy. Check #7 (opportunity tone) is the most
 * critical - it ensures we NEVER say "you're behind" and ALWAYS say
 * "opportunity to grow".
 *
 * Ensures content meets 7 quality standards:
 * 1. Has local references (not generic)
 * 2. Includes real data (business name, numbers, facts)
 * 3. Has clear CTAs (actionable)
 * 4. No placeholders ([business name], etc.)
 * 5. Right length (200-500 chars)
 * 6. Sounds natural (not robotic)
 * 7. Opportunity-focused tone (CRITICAL - brand voice)
 *
 * Content must pass 6/7 checks to be valid (score >= 0.85)
 */

import type {
  ContentPiece,
  BusinessIntelligence,
  ValidationResult,
} from './types';

import { FORBIDDEN_WORDS, OPPORTUNITY_WORDS } from './types';

/**
 * Validates generated content against quality standards
 */
export class ContentValidator {
  /**
   * Validate a single content piece
   * Returns validation result with score (0-1) and failures
   *
   * Valid if score >= 0.85 (need 6/7 checks to pass)
   */
  validate(content: ContentPiece, businessIntel: BusinessIntelligence): ValidationResult {
    const failures: string[] = [];
    let passedChecks = 0;

    // CHECK 1: Has Local Reference
    if (this.checkLocalReference(content, businessIntel)) {
      passedChecks++;
    } else {
      const city = businessIntel?.business?.location?.city;
      const state = businessIntel?.business?.location?.state;
      const location = city || state || 'location';
      failures.push(`Missing local reference (must mention ${location})`);
    }

    // CHECK 2: Has Real Data
    if (this.checkRealData(content, businessIntel)) {
      passedChecks++;
    } else {
      failures.push('Too generic - needs business name, location, or specific numbers');
    }

    // CHECK 3: Has Clear CTA
    if (this.checkClearCTA(content)) {
      passedChecks++;
    } else {
      failures.push('Missing clear call-to-action (add: call, schedule, visit, etc.)');
    }

    // CHECK 4: No Placeholders
    if (this.checkNoPlaceholders(content)) {
      passedChecks++;
    } else {
      failures.push('Contains placeholders or incomplete text');
    }

    // CHECK 5: Right Length
    if (this.checkRightLength(content)) {
      passedChecks++;
    } else {
      const length = content.content.postText.length;
      failures.push(`Wrong length (needs 200-500 characters, currently ${length})`);
    }

    // CHECK 6: Sounds Natural
    if (this.checkNatural(content)) {
      passedChecks++;
    } else {
      failures.push('Sounds robotic or AI-generated');
    }

    // CHECK 7: Opportunity-Focused Tone (MOST CRITICAL)
    if (this.checkOpportunityFocused(content)) {
      passedChecks++;
    } else {
      const text = content.content.postText.toLowerCase();
      const foundForbidden = FORBIDDEN_WORDS.filter((w) => text.includes(w.toLowerCase()));

      if (foundForbidden.length > 0) {
        failures.push(
          `Uses deficit language - must be opportunity-focused (found: ${foundForbidden.join(', ')})`
        );
      } else {
        failures.push('Missing opportunity-focused language (needs 2+ words like: opportunity, growth, discover, unlock, achieve)');
      }
    }

    // Calculate score and validity
    const score = passedChecks / 7;
    const isValid = score >= 0.85; // Need 6/7 checks (85%+)

    return {
      isValid,
      score,
      failures,
    };
  }

  /**
   * Validate multiple pieces, return Map<id, ValidationResult>
   * Performance: <50ms for 12 pieces
   */
  validateBatch(
    content: ContentPiece[],
    businessIntel: BusinessIntelligence
  ): Map<string, ValidationResult> {
    const results = new Map<string, ValidationResult>();

    for (const piece of content) {
      results.set(piece.id, this.validate(piece, businessIntel));
    }

    return results;
  }

  /**
   * Filter to only valid pieces
   * Useful for removing low-quality content before display
   */
  filterValid(content: ContentPiece[], businessIntel: BusinessIntelligence): ContentPiece[] {
    return content.filter((piece) => {
      const result = this.validate(piece, businessIntel);
      return result.isValid;
    });
  }

  // =========================================================================
  // PRIVATE VALIDATION CHECKS (7 CHECKS)
  // =========================================================================

  /**
   * CHECK 1: Has Local Reference
   * Must mention city OR state (case-insensitive)
   *
   * Why: Makes content personal and specific, not generic
   * Example: "Austin freeze warning" vs "Local weather alert"
   */
  private checkLocalReference(
    content: ContentPiece,
    businessIntel: BusinessIntelligence
  ): boolean {
    const text = content.content.postText.toLowerCase();
    const city = (businessIntel?.business?.location?.city ?? '').toLowerCase();
    const state = (businessIntel?.business?.location?.state ?? '').toLowerCase();

    // If no location data available, pass this check
    // (Can't enforce what doesn't exist)
    if (!city && !state) return true;

    // Check for city or state mention
    if (city && text.includes(city)) return true;
    if (state && text.includes(state)) return true;

    return false;
  }

  /**
   * CHECK 2: Has Real Data
   * Must have 2+ of: business name, local reference, numbers (stats/ratings)
   *
   * Why: Proves this is real content, not a template
   * Example: "ABC Plumbing protected 200+ Austin homes" (name + number + city = 3)
   */
  private checkRealData(content: ContentPiece, businessIntel: BusinessIntelligence): boolean {
    const text = content.content.postText;
    let dataPoints = 0;

    // Data point 1: Business name (case-insensitive)
    const businessName = businessIntel?.business?.name ?? '';
    if (businessName && text.toLowerCase().includes(businessName.toLowerCase())) {
      dataPoints++;
    }

    // Data point 2: Local reference (city or state)
    const city = (businessIntel?.business?.location?.city ?? '').toLowerCase();
    const state = (businessIntel?.business?.location?.state ?? '').toLowerCase();
    const textLower = text.toLowerCase();

    if ((city && textLower.includes(city)) || (state && textLower.includes(state))) {
      dataPoints++;
    }

    // Data point 3: Numbers (stats, ratings, dates, phone numbers)
    if (/\d+/.test(text)) {
      dataPoints++;
    }

    // Need at least 2 of 3 data points
    return dataPoints >= 2;
  }

  /**
   * CHECK 3: Has Clear CTA
   * Must include action words OR phone number
   *
   * Why: Users need to know what to do next
   * Example: "Call 512-555-0100 now" or "Schedule your free consultation"
   */
  private checkClearCTA(content: ContentPiece): boolean {
    const text = content.content.postText.toLowerCase();
    const originalText = content.content.postText; // For phone number check

    // CTA patterns (action words)
    const ctaWords = [
      'call',
      'text',
      'message',
      'contact',
      'reach out',
      'reach',
      'visit',
      'stop by',
      'come see',
      'come in',
      'schedule',
      'book',
      'reserve',
      'set up',
      'arrange',
      'learn more',
      'find out',
      'discover',
      'explore',
      'get',
      'request',
      'claim',
      'download',
      'dm',
      'tap',
      'click',
      'see',
      'check out',
      'ask',
    ];

    // Check for CTA words
    if (ctaWords.some((word) => text.includes(word))) {
      return true;
    }

    // Check for phone number patterns
    const phonePatterns = [
      /\d{3}[-.\s]\d{3}[-.\s]\d{4}/, // 512-555-0100, 512.555.0100, 512 555 0100
      /\(\d{3}\)\s?\d{3}[-.\s]\d{4}/, // (512) 555-0100
    ];

    return phonePatterns.some((pattern) => pattern.test(originalText));
  }

  /**
   * CHECK 4: No Placeholders
   * No brackets, no placeholder words
   *
   * Why: Incomplete content is unusable
   * Example: "[Your business name]" → FAIL
   */
  private checkNoPlaceholders(content: ContentPiece): boolean {
    const text = content.content.postText;
    const textLower = text.toLowerCase();

    // Check for brackets (placeholders)
    if (/\[.*?\]/.test(text)) {
      return false;
    }

    // Check for placeholder words
    const placeholders = [
      'your business',
      'your company',
      'your service',
      'your name',
      'click here',
      'insert',
      'add ',
      'enter ',
      'example',
      'sample',
      'placeholder',
      ' xx',
      ' yy',
      'xxx',
      'yyy',
      '...',
    ];

    return !placeholders.some((placeholder) => textLower.includes(placeholder));
  }

  /**
   * CHECK 5: Right Length
   * Post text must be 200-500 characters
   *
   * Why: Too short = low value, too long = users don't read
   */
  private checkRightLength(content: ContentPiece): boolean {
    const length = content.content.postText.length;
    return length >= 200 && length <= 500;
  }

  /**
   * CHECK 6: Sounds Natural
   * No AI phrases, no excessive punctuation, reasonable sentence length
   *
   * Why: Should sound like a human wrote it, not a robot
   * Example: "Moreover, it is important to note..." → FAIL
   */
  private checkNatural(content: ContentPiece): boolean {
    const text = content.content.postText;
    const textLower = text.toLowerCase();

    // AI phrase red flags (robotic language)
    const aiPhrases = [
      'as an ai',
      'language model',
      'i apologize',
      'it is important to note',
      'please note that',
      'furthermore',
      'moreover',
      'in conclusion',
      'to summarize',
      'in summary',
      'delve into',
      'dive deep',
      'unlock the power',
      'embark on',
      'transformative journey',
      'game-changer',
      'game changer',
      'revolutionize',
      'paradigm shift',
      'synergy',
      'at the end of the day',
      'think outside the box',
      'low-hanging fruit',
      'move the needle',
      'circle back',
      'touch base',
    ];

    // Check for AI clichés
    if (aiPhrases.some((phrase) => textLower.includes(phrase))) {
      return false;
    }

    // Check for excessive punctuation
    if (/!{3,}/.test(text)) return false; // !!!
    if (/\?{3,}/.test(text)) return false; // ???
    if (/\.{4,}/.test(text)) return false; // ....

    // Check average sentence length (should be 40-150 chars)
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (sentences.length === 0) return false;

    const avgSentenceLength = text.length / sentences.length;
    if (avgSentenceLength < 40 || avgSentenceLength > 150) {
      return false;
    }

    return true;
  }

  /**
   * CHECK 7: Opportunity-Focused Tone ⭐ MOST CRITICAL ⭐
   * No forbidden words + must include 2+ opportunity words
   *
   * WHY THIS IS MOST IMPORTANT:
   * This is MARBA's competitive advantage. Other tools say "you're behind",
   * MARBA says "opportunity to grow". This check enforces that philosophy.
   *
   * FORBIDDEN: missing, behind, weak, failed, must, need to, etc.
   * REQUIRED: opportunity, growth, discover, unlock, achieve, ready, etc.
   *
   * Example:
   * ✅ "Ready to capture 500+ searching customers" (ready, capture)
   * ❌ "You're missing out on 500 customers" (missing)
   */
  private checkOpportunityFocused(content: ContentPiece): boolean {
    const text = content.content.postText.toLowerCase();

    // Check for ANY forbidden words (deficit language)
    const hasForbiddenWords = FORBIDDEN_WORDS.some((word) => text.includes(word.toLowerCase()));

    if (hasForbiddenWords) {
      return false;
    }

    // Must include at least 2 opportunity words (positive language)
    const opportunityWordCount = OPPORTUNITY_WORDS.filter((word) =>
      text.includes(word.toLowerCase())
    ).length;

    return opportunityWordCount >= 2;
  }
}
