/**
 * Trigger Title Generator Service
 *
 * Generates semantic, source-aware titles for triggers.
 * Replaces generic "growth opportunity" titles with specific,
 * actionable titles that preserve sentiment.
 *
 * Key principles (from TRIGGER_RESEARCH.md Part 9.5):
 * - Complaints are NOT desires: "frustrated by X" not "want X"
 * - Preserve semantic meaning from original quote
 * - Include competitor name when known
 * - No truncated sentences
 *
 * Created: 2025-12-01
 * Phase: Triggers 3.0 - Phase 1 (Foundation Layer)
 */

import type { TriggerCategory, EvidenceItem } from '../trigger-consolidation.service';
import { competitorAttributionService } from '../competitor-attribution.service';

// ============================================================================
// TYPES
// ============================================================================

export type TriggerSentiment = 'complaint' | 'desire' | 'comparison' | 'neutral' | 'fear' | 'urgency';

export interface TitleGenerationContext {
  /** The raw quote or evidence text */
  rawText: string;
  /** Category of the trigger */
  category: TriggerCategory;
  /** Detected or known competitor name */
  competitorName?: string;
  /** Source platform (affects title style) */
  source?: string;
  /** Target audience/persona */
  targetAudience?: string;
  /** Industry context */
  industry?: string;
}

export interface GeneratedTitle {
  /** The generated title (max 80 chars) */
  title: string;
  /** Detected sentiment of the original text */
  sentiment: TriggerSentiment;
  /** Confidence in the title accuracy (0-1) */
  confidence: number;
  /** Explanation of why this title was generated */
  reasoning: string;
  /** Whether a competitor was attributed */
  hasCompetitorAttribution: boolean;
  /** Suggested subtitle/summary (optional) */
  subtitle?: string;
}

export interface TitleTemplate {
  pattern: RegExp;
  template: string;
  sentiment: TriggerSentiment;
  priority: number;
}

// ============================================================================
// SENTIMENT DETECTION
// ============================================================================

/**
 * Patterns for detecting sentiment in text
 * Ordered by specificity (more specific patterns first)
 */
const SENTIMENT_PATTERNS: Array<{ patterns: RegExp[]; sentiment: TriggerSentiment; weight: number }> = [
  // High-intent comparison patterns (switching intent)
  {
    patterns: [
      /evaluating|comparing|vs|versus|alternative|migrating from|switching from/i,
      /contract is up|looking at|considering|what('s| is) better/i,
      /moved away from|ditched|dropped|cancelled/i,
    ],
    sentiment: 'comparison',
    weight: 1.0,
  },
  // Complaint patterns (negative sentiment about current state)
  {
    patterns: [
      /frustrated|annoyed|hate|hating|struggling|difficult|problem|issue|broken/i,
      /doesn't work|failed|waste|inefficient|tedious|stuck|limited/i,
      /too complex|too expensive|too slow|takes too long|not working/i,
      /can't|won't|doesn't|isn't|aren't|wasn't|terrible|horrible|awful/i,
      /disappointed|upset|angry|furious|fed up/i,
    ],
    sentiment: 'complaint',
    weight: 0.9,
  },
  // Fear patterns
  {
    patterns: [
      /afraid|scared|worried|anxious|nervous|terrified/i,
      /fear of|risk of|danger|threat|losing|might fail/i,
      /concerned|apprehensive|uncertain/i,
    ],
    sentiment: 'fear',
    weight: 0.85,
  },
  // Urgency patterns
  {
    patterns: [
      /immediately|urgent|asap|now|deadline|expiring/i,
      /running out|last chance|time-sensitive|act fast/i,
      /falling behind|competitors are|catching up/i,
    ],
    sentiment: 'urgency',
    weight: 0.8,
  },
  // Desire patterns (positive seeking)
  {
    patterns: [
      /want|wish|hope|looking for|searching for|need/i,
      /would love|would like|desire|interested in/i,
      /excited about|motivated by|goal|ambition/i,
    ],
    sentiment: 'desire',
    weight: 0.7,
  },
];

/**
 * Verb mappings for each sentiment type
 * These verbs accurately represent the emotional state
 */
const SENTIMENT_VERBS: Record<TriggerSentiment, string[]> = {
  complaint: ['frustrated by', 'struggling with', 'fed up with', 'disappointed by'],
  desire: ['seeking', 'looking for', 'want', 'need'],
  comparison: ['evaluating alternatives to', 'comparing options after', 'switching from'],
  neutral: ['discussing', 'mentioning', 'noting'],
  fear: ['worried about', 'concerned about', 'anxious about'],
  urgency: ['urgently need', 'racing to find', 'need immediately'],
};

/**
 * Subject templates based on context
 */
const SUBJECT_TEMPLATES: Record<string, string> = {
  'g2': 'Software buyers',
  'reddit': 'Community members',
  'linkedin': 'Professionals',
  'trustpilot': 'Customers',
  'google-reviews': 'Local customers',
  'yelp': 'Consumers',
  'hackernews': 'Tech professionals',
  'twitter': 'Users',
  'default': 'Buyers',
};

// ============================================================================
// TITLE TEMPLATES BY CATEGORY
// ============================================================================

const CATEGORY_TITLE_TEMPLATES: Record<TriggerCategory, TitleTemplate[]> = {
  'fear': [
    {
      pattern: /worried about (.+)/i,
      template: '{subject} worried about {match}',
      sentiment: 'fear',
      priority: 1,
    },
    {
      pattern: /fear of (.+)/i,
      template: '{subject} fear {match}',
      sentiment: 'fear',
      priority: 1,
    },
    {
      pattern: /risk|danger|threat/i,
      template: '{subject} concerned about {topic} risks',
      sentiment: 'fear',
      priority: 2,
    },
  ],
  'desire': [
    {
      pattern: /looking for (.+)/i,
      template: '{subject} seeking {match}',
      sentiment: 'desire',
      priority: 1,
    },
    {
      pattern: /need (.+)/i,
      template: '{subject} need {match}',
      sentiment: 'desire',
      priority: 1,
    },
    {
      pattern: /want (.+)/i,
      template: '{subject} want {match}',
      sentiment: 'desire',
      priority: 2,
    },
  ],
  'pain-point': [
    {
      pattern: /frustrated (with|by) (.+)/i,
      template: '{subject} frustrated by {match}',
      sentiment: 'complaint',
      priority: 1,
    },
    {
      pattern: /struggling (with|to) (.+)/i,
      template: '{subject} struggling with {match}',
      sentiment: 'complaint',
      priority: 1,
    },
    {
      pattern: /can't (.+)/i,
      template: '{subject} unable to {match}',
      sentiment: 'complaint',
      priority: 2,
    },
  ],
  'objection': [
    {
      pattern: /too expensive|cost|price/i,
      template: '{subject} facing pricing concerns',
      sentiment: 'complaint',
      priority: 1,
    },
    {
      pattern: /complicated|difficult|hard/i,
      template: '{subject} find {topic} too complex',
      sentiment: 'complaint',
      priority: 2,
    },
  ],
  'motivation': [
    {
      pattern: /excited about (.+)/i,
      template: '{subject} excited about {match}',
      sentiment: 'desire',
      priority: 1,
    },
    {
      pattern: /opportunity/i,
      template: '{subject} see opportunity in {topic}',
      sentiment: 'desire',
      priority: 2,
    },
  ],
  'trust': [
    {
      pattern: /reliable|dependable|trustworthy/i,
      template: '{subject} seeking reliable {topic}',
      sentiment: 'desire',
      priority: 1,
    },
    {
      pattern: /proven|verified|certified/i,
      template: '{subject} want proven {topic}',
      sentiment: 'desire',
      priority: 2,
    },
  ],
  'urgency': [
    {
      pattern: /immediately|urgent|asap/i,
      template: '{subject} urgently need {topic}',
      sentiment: 'urgency',
      priority: 1,
    },
    {
      pattern: /deadline|expir/i,
      template: '{subject} facing {topic} deadline',
      sentiment: 'urgency',
      priority: 2,
    },
  ],
};

// ============================================================================
// SERVICE
// ============================================================================

class TriggerTitleGeneratorService {
  private maxTitleLength = 80;

  /**
   * Generate a semantic, source-aware title for a trigger
   */
  generateTitle(context: TitleGenerationContext): GeneratedTitle {
    const { rawText, category, competitorName, source } = context;

    // Step 1: Detect sentiment
    const sentiment = this.detectSentiment(rawText);

    // Step 2: Extract or resolve competitor name
    const resolvedCompetitor = competitorName || this.extractCompetitor(rawText);

    // Step 3: Determine subject based on source
    const subject = this.getSubject(source, resolvedCompetitor);

    // Step 4: Generate title using templates or fallback
    const title = this.buildTitle(rawText, category, sentiment, subject, resolvedCompetitor);

    // Step 5: Validate and finalize
    const finalTitle = this.validateAndTruncate(title);

    return {
      title: finalTitle,
      sentiment,
      confidence: this.calculateTitleConfidence(rawText, finalTitle, sentiment),
      reasoning: this.generateReasoning(sentiment, resolvedCompetitor, source),
      hasCompetitorAttribution: !!resolvedCompetitor,
      subtitle: this.generateSubtitle(rawText, sentiment),
    };
  }

  /**
   * Generate titles for multiple evidence items
   */
  generateTitleFromEvidence(evidence: EvidenceItem[], category: TriggerCategory): GeneratedTitle {
    // Use the first evidence item as primary
    const primaryEvidence = evidence[0];
    if (!primaryEvidence) {
      return {
        title: 'Market signal detected',
        sentiment: 'neutral',
        confidence: 0.3,
        reasoning: 'No evidence available',
        hasCompetitorAttribution: false,
      };
    }

    return this.generateTitle({
      rawText: primaryEvidence.quote,
      category,
      competitorName: primaryEvidence.competitorName,
      source: primaryEvidence.platform,
    });
  }

  /**
   * Detect sentiment from text
   */
  detectSentiment(text: string): TriggerSentiment {
    const textLower = text.toLowerCase();
    let bestMatch: { sentiment: TriggerSentiment; weight: number } = { sentiment: 'neutral', weight: 0 };

    for (const { patterns, sentiment, weight } of SENTIMENT_PATTERNS) {
      for (const pattern of patterns) {
        if (pattern.test(textLower)) {
          if (weight > bestMatch.weight) {
            bestMatch = { sentiment, weight };
          }
          break; // Move to next sentiment type
        }
      }
    }

    return bestMatch.sentiment;
  }

  /**
   * Validate a title for quality
   */
  validateTitle(title: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check length
    if (title.length > this.maxTitleLength) {
      errors.push(`Title exceeds ${this.maxTitleLength} characters`);
    }

    if (title.length < 15) {
      errors.push('Title is too short');
    }

    // Check for semantic inversion (the critical bug)
    if (this.hasSemantlcInversion(title)) {
      errors.push('Title has semantic inversion (complaint phrased as desire)');
    }

    // Check for truncated sentence
    if (this.isTruncated(title)) {
      errors.push('Title appears truncated');
    }

    // Check for missing subject
    if (!this.hasSubject(title)) {
      errors.push('Title missing subject');
    }

    // Check capitalization
    if (title[0] !== title[0].toUpperCase()) {
      errors.push('Title should start with capital letter');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Rewrite a bad title to fix common issues
   */
  rewriteTitle(badTitle: string, category: TriggerCategory, rawText?: string): GeneratedTitle {
    // If we have raw text, regenerate from scratch
    if (rawText) {
      return this.generateTitle({ rawText, category });
    }

    // Otherwise, attempt to fix the existing title
    let fixed = badTitle;

    // Fix semantic inversion
    if (this.hasSemantlcInversion(fixed)) {
      fixed = this.fixSemanticInversion(fixed);
    }

    // Fix missing subject
    if (!this.hasSubject(fixed)) {
      fixed = `Buyers ${fixed.toLowerCase()}`;
    }

    // Fix capitalization
    fixed = fixed.charAt(0).toUpperCase() + fixed.slice(1);

    // Truncate properly if needed
    fixed = this.validateAndTruncate(fixed);

    return {
      title: fixed,
      sentiment: this.detectSentiment(fixed),
      confidence: 0.6, // Lower confidence for rewrites
      reasoning: 'Title rewritten to fix issues',
      hasCompetitorAttribution: false,
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Extract competitor from text using attribution service
   */
  private extractCompetitor(text: string): string | undefined {
    const result = competitorAttributionService.extractCompetitorMentions(text);
    return result.primaryCompetitor;
  }

  /**
   * Get subject based on source platform
   */
  private getSubject(source?: string, competitor?: string): string {
    if (competitor) {
      return `${competitor} users`;
    }

    const normalizedSource = source?.toLowerCase() || 'default';
    return SUBJECT_TEMPLATES[normalizedSource] || SUBJECT_TEMPLATES['default'];
  }

  /**
   * Build the title using templates and sentiment
   */
  private buildTitle(
    rawText: string,
    category: TriggerCategory,
    sentiment: TriggerSentiment,
    subject: string,
    competitor?: string
  ): string {
    // Try category-specific templates first
    const templates = CATEGORY_TITLE_TEMPLATES[category] || [];
    for (const template of templates.sort((a, b) => a.priority - b.priority)) {
      const match = rawText.match(template.pattern);
      if (match) {
        let title = template.template
          .replace('{subject}', subject)
          .replace('{match}', match[1] || match[2] || '')
          .replace('{topic}', this.extractTopic(rawText));

        return this.cleanTitle(title);
      }
    }

    // Fallback: Generate based on sentiment
    return this.generateFallbackTitle(rawText, sentiment, subject, competitor);
  }

  /**
   * Generate fallback title when no template matches
   */
  private generateFallbackTitle(
    rawText: string,
    sentiment: TriggerSentiment,
    subject: string,
    competitor?: string
  ): string {
    const verbs = SENTIMENT_VERBS[sentiment];
    const verb = verbs[0]; // Use primary verb

    // Extract the core issue from the text
    const issue = this.extractCoreIssue(rawText);

    if (competitor) {
      return `${subject} ${verb} ${competitor}'s ${issue}`;
    }

    return `${subject} ${verb} ${issue}`;
  }

  /**
   * Extract the core issue/topic from text
   */
  private extractCoreIssue(text: string): string {
    // Remove common filler words
    let cleaned = text
      .replace(/^(i |we |our |my |the |a |an )/gi, '')
      .replace(/\b(really|very|so|just|actually|basically|literally)\b/gi, '')
      .trim();

    // Take first meaningful phrase (up to 5-6 words)
    const words = cleaned.split(/\s+/);
    if (words.length > 6) {
      cleaned = words.slice(0, 6).join(' ');
    }

    return cleaned.toLowerCase();
  }

  /**
   * Extract topic for templates
   */
  private extractTopic(text: string): string {
    // Look for nouns after common prepositions
    const match = text.match(/(?:with|about|for|of|on)\s+(\w+(?:\s+\w+)?)/i);
    if (match) {
      return match[1].toLowerCase();
    }

    // Fallback to core issue extraction
    return this.extractCoreIssue(text);
  }

  /**
   * Clean and normalize a title
   */
  private cleanTitle(title: string): string {
    return title
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\s+([.,!?])/g, '$1') // Fix punctuation spacing
      .replace(/([.,!?])+/g, '$1') // Remove duplicate punctuation
      .trim();
  }

  /**
   * Validate and truncate title to max length
   */
  private validateAndTruncate(title: string): string {
    // Capitalize first letter
    let result = title.charAt(0).toUpperCase() + title.slice(1);

    // Truncate at word boundary if needed
    if (result.length > this.maxTitleLength) {
      const words = result.split(' ');
      result = '';

      for (const word of words) {
        if ((result + ' ' + word).trim().length <= this.maxTitleLength - 3) {
          result = (result + ' ' + word).trim();
        } else {
          break;
        }
      }

      // Don't add ellipsis if we captured most of the title
      if (result.length < this.maxTitleLength - 10) {
        result += '...';
      }
    }

    return result;
  }

  /**
   * Check if title has semantic inversion
   * (e.g., "Buyers want complexity" when they're complaining about complexity)
   */
  private hasSemantlcInversion(title: string): boolean {
    const titleLower = title.toLowerCase();

    // Patterns that indicate semantic inversion
    const inversionPatterns = [
      /want.*(complex|difficult|slow|expensive|broken|fail|problem|issue)/i,
      /desire.*(frustrat|annoy|hate|struggle)/i,
      /seeking.*(inefficien|tedious|limit)/i,
      /need.*(too much|overpriced|complicated)/i,
    ];

    return inversionPatterns.some((p) => p.test(titleLower));
  }

  /**
   * Fix semantic inversion in a title
   */
  private fixSemanticInversion(title: string): string {
    // Replace "want" with "frustrated by" for negative attributes
    let fixed = title
      .replace(/want(s?)\s+(.*complex)/gi, 'frustrated$1 by $2')
      .replace(/want(s?)\s+(.*difficult)/gi, 'struggling$1 with $2')
      .replace(/want(s?)\s+(.*slow)/gi, 'frustrated$1 by $2')
      .replace(/want(s?)\s+(.*expensive)/gi, 'concerned$1 about $2')
      .replace(/desire(s?)\s+(.*frustrat)/gi, '$2');

    return fixed;
  }

  /**
   * Check if title appears truncated
   */
  private isTruncated(title: string): boolean {
    // Ends with incomplete word or random character
    return /\s\w$/.test(title) || /[^.!?)\]"']$/.test(title.trim());
  }

  /**
   * Check if title has a subject
   */
  private hasSubject(title: string): boolean {
    const subjectPattern = /^(buyers|customers|users|teams|companies|businesses|professionals|they|we|\w+ users)/i;
    return subjectPattern.test(title.trim());
  }

  /**
   * Calculate confidence in the generated title
   */
  private calculateTitleConfidence(
    rawText: string,
    generatedTitle: string,
    sentiment: TriggerSentiment
  ): number {
    let confidence = 0.5; // Base confidence

    // Boost if sentiment clearly detected
    if (sentiment !== 'neutral') {
      confidence += 0.2;
    }

    // Boost if title validation passes
    const validation = this.validateTitle(generatedTitle);
    if (validation.isValid) {
      confidence += 0.2;
    }

    // Boost if key words from raw text appear in title
    const rawWords = new Set(rawText.toLowerCase().split(/\s+/));
    const titleWords = generatedTitle.toLowerCase().split(/\s+/);
    const overlap = titleWords.filter((w) => rawWords.has(w)).length;
    confidence += Math.min(0.1, overlap * 0.02);

    return Math.min(1, confidence);
  }

  /**
   * Generate reasoning for the title
   */
  private generateReasoning(
    sentiment: TriggerSentiment,
    competitor?: string,
    source?: string
  ): string {
    const parts: string[] = [];

    parts.push(`Detected ${sentiment} sentiment`);

    if (competitor) {
      parts.push(`attributed to ${competitor}`);
    }

    if (source) {
      parts.push(`from ${source}`);
    }

    return parts.join('; ');
  }

  /**
   * Generate optional subtitle
   */
  private generateSubtitle(rawText: string, sentiment: TriggerSentiment): string | undefined {
    if (rawText.length <= this.maxTitleLength) {
      return undefined;
    }

    // Extract first sentence or meaningful chunk
    const firstSentence = rawText.split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length <= 150) {
      return firstSentence.trim();
    }

    return undefined;
  }
}

// Export singleton
export const triggerTitleGeneratorService = new TriggerTitleGeneratorService();

// Export class for testing
export { TriggerTitleGeneratorService };
