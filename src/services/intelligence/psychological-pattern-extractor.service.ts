/**
 * Psychological Pattern Extractor
 *
 * Replaces Reddit API with multi-source psychological trigger mining:
 * - YouTube comments → "I wish/hate when" patterns
 * - Google Reviews → Pain points (1-2 star) + Desires (5 star)
 * - Testimonials → Transformation stories
 * - NAICS profiles → Industry-specific triggers
 *
 * Extracts the 7 core psychological triggers:
 * 1. Curiosity - Questions, mysteries, unknown
 * 2. Fear - Loss, gaps, risks, mistakes
 * 3. Desire - Wants, wishes, aspirations
 * 4. Belonging - Community, tribe, identity
 * 5. Achievement - Success, progress, mastery
 * 6. Trust - Proof, credibility, authority
 * 7. Urgency - Now, limited, deadline
 *
 * Created: November 20, 2025
 */

import type { DataPoint } from '@/types/connections.types';

export interface PsychologicalTrigger {
  type: 'curiosity' | 'fear' | 'desire' | 'belonging' | 'achievement' | 'trust' | 'urgency';
  text: string;
  source: string; // YouTube, Google Reviews, Testimonial, NAICS
  confidence: number; // 0-1
  evidence: string[]; // Supporting quotes
  timestamp?: string;
}

export interface PainPoint {
  pain: string;
  frequency: number; // How many sources mention this
  sources: string[]; // Which sources
  quotes: string[]; // Actual customer quotes
  emotionalIntensity: number; // 0-1
}

export interface CustomerDesire {
  desire: string;
  frequency: number;
  sources: string[];
  quotes: string[];
  achievementLevel: number; // 0-1 (how aspirational)
}

export interface PsychologicalProfile {
  triggers: PsychologicalTrigger[];
  painPoints: PainPoint[];
  desires: CustomerDesire[];
  customerLanguage: string[]; // Authentic phrases customers use
  emotionalDrivers: {
    primary: string; // Most dominant emotion
    secondary: string[];
  };
}

class PsychologicalPatternExtractorService {

  /**
   * Trigger detection patterns
   */
  private readonly TRIGGER_PATTERNS = {
    curiosity: [
      /how (do|can|does|did)/i,
      /what (is|are|does|happens)/i,
      /why (do|does|is|are)/i,
      /wondering (if|how|what|why)/i,
      /never (knew|understood|realized)/i,
      /finally (understand|get|know)/i,
    ],
    fear: [
      /worried (about|that)/i,
      /afraid (of|that)/i,
      /scared (of|that)/i,
      /hate (when|that|how)/i,
      /frustrated (with|by)/i,
      /nightmare/i,
      /terrible|awful|horrible/i,
      /lost (money|time)/i,
      /scam|ripped off/i,
    ],
    desire: [
      /wish (I|we) (could|had)/i,
      /would (love|like) to/i,
      /hope (to|for|that)/i,
      /dream (of|about)/i,
      /if only/i,
      /finally (found|got)/i,
      /exactly what I (wanted|needed)/i,
    ],
    belonging: [
      /community|tribe|family/i,
      /people like (me|us)/i,
      /finally found (my|our)/i,
      /understand (me|us)/i,
      /gets (it|me|us)/i,
      /not alone/i,
    ],
    achievement: [
      /proud (of|to)/i,
      /accomplished|achieved/i,
      /success|successful/i,
      /milestone|goal/i,
      /mastered|expert/i,
      /leveled up/i,
      /transformed|transformation/i,
    ],
    trust: [
      /trust(ed|worthy)/i,
      /reliable|dependable/i,
      /honest|transparency/i,
      /proven|verified/i,
      /recommend|recommended/i,
      /satisfied|satisfaction/i,
    ],
    urgency: [
      /now|today|immediately/i,
      /hurry|rush/i,
      /deadline|expires/i,
      /limited (time|offer)/i,
      /act (now|fast|quickly)/i,
      /don't (wait|delay)/i,
    ],
  };

  /**
   * Pain point patterns
   */
  private readonly PAIN_PATTERNS = [
    /I hate (when|that|how)/i,
    /frustrated (with|by)/i,
    /disappointed (with|by|in)/i,
    /terrible|awful|horrible/i,
    /waste (of|my) (time|money)/i,
    /never (again|going back)/i,
    /worst (experience|service|product)/i,
  ];

  /**
   * Desire patterns
   */
  private readonly DESIRE_PATTERNS = [
    /I wish (I|we) (could|had)/i,
    /would (love|like) to/i,
    /if only (they|it) (could|would)/i,
    /dream (of|about)/i,
    /perfect (would|solution)/i,
    /ideal (would|scenario)/i,
  ];

  /**
   * Extract psychological triggers from YouTube comments
   */
  extractFromYouTubeComments(comments: any[]): PsychologicalTrigger[] {
    const triggers: PsychologicalTrigger[] = [];

    for (const comment of comments) {
      const text = typeof comment === 'string' ? comment : comment.text || comment.comment;
      if (!text) continue;

      // Check each trigger type
      for (const [type, patterns] of Object.entries(this.TRIGGER_PATTERNS)) {
        for (const pattern of patterns) {
          if (pattern.test(text)) {
            triggers.push({
              type: type as PsychologicalTrigger['type'],
              text: this.extractTriggerPhrase(text, pattern),
              source: 'YouTube',
              confidence: this.calculateConfidence(comment),
              evidence: [text],
              timestamp: comment.timestamp || comment.publishedAt,
            });
            break; // Only one trigger per comment
          }
        }
      }
    }

    return triggers;
  }

  /**
   * Extract triggers from Google Reviews
   */
  extractFromReviews(reviews: any[]): PsychologicalTrigger[] {
    const triggers: PsychologicalTrigger[] = [];

    for (const review of reviews) {
      const text = review.text || review.review || review.content;
      const rating = review.rating || review.stars;
      if (!text) continue;

      // Low ratings (1-2 stars) = Fear/Frustration triggers
      if (rating <= 2) {
        for (const pattern of this.TRIGGER_PATTERNS.fear) {
          if (pattern.test(text)) {
            triggers.push({
              type: 'fear',
              text: this.extractTriggerPhrase(text, pattern),
              source: 'Google Reviews',
              confidence: 0.9, // High confidence - verified customer
              evidence: [text],
              timestamp: review.timestamp || review.date,
            });
            break;
          }
        }
      }

      // High ratings (5 stars) = Achievement/Desire fulfilled
      if (rating >= 5) {
        for (const pattern of this.TRIGGER_PATTERNS.achievement) {
          if (pattern.test(text)) {
            triggers.push({
              type: 'achievement',
              text: this.extractTriggerPhrase(text, pattern),
              source: 'Google Reviews',
              confidence: 0.9,
              evidence: [text],
              timestamp: review.timestamp || review.date,
            });
            break;
          }
        }
      }

      // All ratings - check for other triggers
      for (const [type, patterns] of Object.entries(this.TRIGGER_PATTERNS)) {
        if (type === 'fear' || type === 'achievement') continue; // Already checked

        for (const pattern of patterns) {
          if (pattern.test(text)) {
            triggers.push({
              type: type as PsychologicalTrigger['type'],
              text: this.extractTriggerPhrase(text, pattern),
              source: 'Google Reviews',
              confidence: 0.85,
              evidence: [text],
              timestamp: review.timestamp || review.date,
            });
            break;
          }
        }
      }
    }

    return triggers;
  }

  /**
   * Extract pain points from reviews
   */
  extractPainPoints(reviews: any[]): PainPoint[] {
    const painMap = new Map<string, PainPoint>();

    for (const review of reviews) {
      const text = review.text || review.review || review.content;
      const rating = review.rating || review.stars;

      // Focus on negative reviews (1-3 stars)
      if (rating > 3 || !text) continue;

      for (const pattern of this.PAIN_PATTERNS) {
        if (pattern.test(text)) {
          const pain = this.extractPainPhrase(text);

          if (painMap.has(pain)) {
            const existing = painMap.get(pain)!;
            existing.frequency++;
            existing.sources.push('Google Reviews');
            existing.quotes.push(text);
          } else {
            painMap.set(pain, {
              pain,
              frequency: 1,
              sources: ['Google Reviews'],
              quotes: [text],
              emotionalIntensity: rating === 1 ? 1.0 : 0.7,
            });
          }
          break;
        }
      }
    }

    return Array.from(painMap.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10); // Top 10 pain points
  }

  /**
   * Extract desires from reviews
   */
  extractDesires(reviews: any[]): CustomerDesire[] {
    const desireMap = new Map<string, CustomerDesire>();

    for (const review of reviews) {
      const text = review.text || review.review || review.content;
      const rating = review.rating || review.stars;
      if (!text) continue;

      // Look for desires in both positive (what they got) and negative (what they wanted)
      for (const pattern of this.DESIRE_PATTERNS) {
        if (pattern.test(text)) {
          const desire = this.extractDesirePhrase(text);

          if (desireMap.has(desire)) {
            const existing = desireMap.get(desire)!;
            existing.frequency++;
            existing.sources.push('Google Reviews');
            existing.quotes.push(text);
          } else {
            desireMap.set(desire, {
              desire,
              frequency: 1,
              sources: ['Google Reviews'],
              quotes: [text],
              achievementLevel: rating >= 5 ? 1.0 : 0.5,
            });
          }
          break;
        }
      }
    }

    return Array.from(desireMap.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10); // Top 10 desires
  }

  /**
   * Build complete psychological profile
   */
  buildProfile(data: {
    youtubeComments?: any[];
    reviews?: any[];
    testimonials?: string[];
    naicsProfile?: any;
  }): PsychologicalProfile {
    const triggers: PsychologicalTrigger[] = [];

    // Extract from YouTube
    if (data.youtubeComments) {
      triggers.push(...this.extractFromYouTubeComments(data.youtubeComments));
    }

    // Extract from Reviews
    if (data.reviews) {
      triggers.push(...this.extractFromReviews(data.reviews));
    }

    // Extract from testimonials
    if (data.testimonials) {
      for (const testimonial of data.testimonials) {
        // Testimonials are usually positive - achievement triggers
        triggers.push({
          type: 'achievement',
          text: this.extractTriggerPhrase(testimonial, /./),
          source: 'Testimonial',
          confidence: 0.95, // Very high - curated by business
          evidence: [testimonial],
        });
      }
    }

    // Get pain points and desires
    const painPoints = data.reviews ? this.extractPainPoints(data.reviews) : [];
    const desires = data.reviews ? this.extractDesires(data.reviews) : [];

    // Extract customer language (frequent phrases)
    const customerLanguage = this.extractCustomerLanguage([
      ...(data.youtubeComments || []),
      ...(data.reviews || []),
      ...(data.testimonials || []),
    ]);

    // Determine emotional drivers
    const emotionalDrivers = this.identifyEmotionalDrivers(triggers, painPoints, desires);

    return {
      triggers,
      painPoints,
      desires,
      customerLanguage,
      emotionalDrivers,
    };
  }

  /**
   * Helper: Extract trigger phrase from text
   */
  private extractTriggerPhrase(text: string, pattern: RegExp): string {
    const sentences = text.split(/[.!?]/);
    for (const sentence of sentences) {
      if (pattern.test(sentence)) {
        return sentence.trim();
      }
    }
    return text.substring(0, 100); // Fallback
  }

  /**
   * Helper: Extract pain phrase
   */
  private extractPainPhrase(text: string): string {
    // Extract the core pain (simplified for now)
    const sentences = text.split(/[.!?]/);
    return sentences[0].trim();
  }

  /**
   * Helper: Extract desire phrase
   */
  private extractDesirePhrase(text: string): string {
    const sentences = text.split(/[.!?]/);
    return sentences[0].trim();
  }

  /**
   * Helper: Calculate confidence based on engagement
   */
  private calculateConfidence(comment: any): number {
    const likes = comment.likes || comment.likeCount || 0;
    const replies = comment.replies || comment.replyCount || 0;

    // More engagement = more validated
    if (likes > 50) return 0.95;
    if (likes > 20) return 0.85;
    if (likes > 5) return 0.75;
    return 0.65;
  }

  /**
   * Helper: Extract customer language patterns
   */
  private extractCustomerLanguage(allData: any[]): string[] {
    const phrases = new Map<string, number>();

    for (const item of allData) {
      const text = typeof item === 'string' ? item : (item.text || item.review || item.comment || '');

      // Extract 2-3 word phrases
      const words = text.toLowerCase().split(/\s+/);
      for (let i = 0; i < words.length - 2; i++) {
        const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
        if (phrase.length < 50 && phrase.length > 10) {
          phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
        }
      }
    }

    return Array.from(phrases.entries())
      .filter(([_, count]) => count >= 2) // Mentioned at least twice
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([phrase]) => phrase);
  }

  /**
   * Helper: Identify dominant emotional drivers
   */
  private identifyEmotionalDrivers(
    triggers: PsychologicalTrigger[],
    painPoints: PainPoint[],
    desires: CustomerDesire[]
  ): { primary: string; secondary: string[] } {
    // Count trigger types
    const typeCounts = new Map<string, number>();

    for (const trigger of triggers) {
      typeCounts.set(trigger.type, (typeCounts.get(trigger.type) || 0) + 1);
    }

    // Factor in pain points (fear) and desires (desire/achievement)
    typeCounts.set('fear', (typeCounts.get('fear') || 0) + painPoints.length * 2);
    typeCounts.set('desire', (typeCounts.get('desire') || 0) + desires.length * 2);

    const sorted = Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1]);

    return {
      primary: sorted[0]?.[0] || 'trust',
      secondary: sorted.slice(1, 4).map(([type]) => type),
    };
  }
}

export const psychologicalExtractor = new PsychologicalPatternExtractorService();
