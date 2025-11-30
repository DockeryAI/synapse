/**
 * Reddit Collector for Competitor Intelligence
 *
 * Extracts customer voice data (pain points, desires, objections, switching triggers)
 * from Reddit discussions about competitors.
 *
 * Created: 2025-11-29
 */

import { redditAPI } from '../reddit-apify-api';
import type { RedditCollectorResult } from './types';
import type { CustomerVoice } from '@/types/competitor-intelligence.types';

class RedditCollector {
  /**
   * Collect customer voice data for a competitor
   */
  async collect(
    competitorName: string,
    industry: string,
    options?: {
      limit?: number;
      timeFilter?: 'week' | 'month' | 'year';
    }
  ): Promise<RedditCollectorResult> {
    const startTime = Date.now();
    console.log(`[RedditCollector] Collecting data for ${competitorName} in ${industry}`);

    try {
      // Find relevant subreddits for the industry
      const subreddits = await redditAPI.findRelevantSubreddits(industry);

      // Search for competitor mentions
      const searchQuery = `${competitorName} OR "${competitorName}" ${industry}`;
      const result = await redditAPI.mineIntelligence(searchQuery, {
        subreddits: subreddits.slice(0, 3),
        limit: options?.limit || 20,
        timeFilter: options?.timeFilter || 'month',
        sortBy: 'relevance'
      });

      // Extract customer voice from insights
      const customerVoice = this.extractCustomerVoice(result.insights, competitorName);

      // Process raw posts
      const rawPosts = result.insights.map(insight => ({
        title: insight.painPoint || insight.desire || '',
        body: insight.context,
        subreddit: insight.subreddit,
        upvotes: insight.upvotes,
        url: insight.url,
        sentiment: this.detectSentiment(insight.context) as 'positive' | 'negative' | 'neutral'
      }));

      // Calculate competitor mentions
      const competitorMentions = this.calculateMentions(result.insights, competitorName);

      return {
        success: true,
        source: 'reddit',
        timestamp: new Date().toISOString(),
        data: {
          customer_voice: customerVoice,
          raw_posts: rawPosts,
          competitor_mentions: competitorMentions
        }
      };
    } catch (error) {
      console.error('[RedditCollector] Error:', error);
      return {
        success: false,
        source: 'reddit',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          customer_voice: this.emptyCustomerVoice(),
          raw_posts: [],
          competitor_mentions: []
        }
      };
    }
  }

  /**
   * Extract structured customer voice from Reddit insights
   */
  private extractCustomerVoice(
    insights: Array<{ painPoint?: string; desire?: string; context: string; subreddit: string; upvotes: number; url: string }>,
    competitorName: string
  ): CustomerVoice {
    const painPoints: string[] = [];
    const desires: string[] = [];
    const objections: string[] = [];
    const switchingTriggers: string[] = [];
    const commonPhrases: string[] = [];
    const sourceQuotes: CustomerVoice['source_quotes'] = [];

    // Pain point patterns
    const painPatterns = [
      /(?:hate|can't stand|frustrat|annoy|problem with|issue with|terrible|awful|worst)/i,
      /(?:doesn't work|broken|buggy|slow|expensive|overpriced)/i,
      /(?:support is|customer service|no response|ignored)/i
    ];

    // Desire patterns
    const desirePatterns = [
      /(?:wish|hope|want|need|looking for|would love)/i,
      /(?:if only|should have|missing|lacks)/i
    ];

    // Objection patterns
    const objectionPatterns = [
      /(?:too expensive|not worth|overrated|overhyped)/i,
      /(?:better alternatives|switched to|moved to)/i,
      /(?:doesn't do|can't do|won't do|doesn't support)/i
    ];

    // Switching trigger patterns
    const switchPatterns = [
      /(?:switched from|left|moving away|cancell|quit|dropped)/i,
      /(?:final straw|last straw|had enough|done with)/i,
      /(?:found better|found alternative|discovered)/i
    ];

    for (const insight of insights) {
      const text = insight.context.toLowerCase();
      const mentionsCompetitor = text.includes(competitorName.toLowerCase());

      // Only process if it mentions the competitor
      if (!mentionsCompetitor && !insight.painPoint?.toLowerCase().includes(competitorName.toLowerCase())) {
        continue;
      }

      // Check for pain points
      if (painPatterns.some(p => p.test(text))) {
        const painPoint = insight.painPoint || this.extractPhrase(insight.context, painPatterns);
        if (painPoint && !painPoints.includes(painPoint)) {
          painPoints.push(painPoint);
          sourceQuotes.push({
            quote: insight.context.substring(0, 200),
            source: `r/${insight.subreddit}`,
            sentiment: 'negative',
            relevance: Math.min(1, insight.upvotes / 100)
          });
        }
      }

      // Check for desires
      if (desirePatterns.some(p => p.test(text))) {
        const desire = insight.desire || this.extractPhrase(insight.context, desirePatterns);
        if (desire && !desires.includes(desire)) {
          desires.push(desire);
        }
      }

      // Check for objections
      if (objectionPatterns.some(p => p.test(text))) {
        const objection = this.extractPhrase(insight.context, objectionPatterns);
        if (objection && !objections.includes(objection)) {
          objections.push(objection);
        }
      }

      // Check for switching triggers
      if (switchPatterns.some(p => p.test(text))) {
        const trigger = this.extractPhrase(insight.context, switchPatterns);
        if (trigger && !switchingTriggers.includes(trigger)) {
          switchingTriggers.push(trigger);
          sourceQuotes.push({
            quote: insight.context.substring(0, 200),
            source: `r/${insight.subreddit}`,
            sentiment: 'negative',
            relevance: Math.min(1, insight.upvotes / 100)
          });
        }
      }

      // Extract common phrases (words that appear frequently)
      const words = text.match(/\b[a-z]{4,}\b/g) || [];
      for (const word of words) {
        if (!commonPhrases.includes(word) && commonPhrases.length < 10) {
          commonPhrases.push(word);
        }
      }
    }

    return {
      pain_points: painPoints.slice(0, 10),
      desires: desires.slice(0, 10),
      objections: objections.slice(0, 10),
      switching_triggers: switchingTriggers.slice(0, 10),
      common_phrases: commonPhrases.slice(0, 10),
      source_quotes: sourceQuotes.slice(0, 10)
    };
  }

  /**
   * Extract a phrase around a pattern match
   */
  private extractPhrase(text: string, patterns: RegExp[]): string {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const index = match.index || 0;
        const start = Math.max(0, index - 20);
        const end = Math.min(text.length, index + match[0].length + 80);
        return text.substring(start, end).trim();
      }
    }
    return '';
  }

  /**
   * Simple sentiment detection
   */
  private detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const lower = text.toLowerCase();
    const negativeWords = ['hate', 'terrible', 'awful', 'worst', 'bad', 'problem', 'issue', 'frustrat', 'annoy', 'expensive'];
    const positiveWords = ['love', 'great', 'amazing', 'best', 'awesome', 'helpful', 'recommend', 'perfect'];

    const negCount = negativeWords.filter(w => lower.includes(w)).length;
    const posCount = positiveWords.filter(w => lower.includes(w)).length;

    if (negCount > posCount) return 'negative';
    if (posCount > negCount) return 'positive';
    return 'neutral';
  }

  /**
   * Calculate competitor mention statistics
   */
  private calculateMentions(
    insights: Array<{ painPoint?: string; desire?: string; context: string; subreddit: string; upvotes: number; url: string }>,
    competitorName: string
  ): Array<{ competitor_name: string; mention_count: number; sentiment_avg: number; sample_quotes: string[] }> {
    const mentions = insights.filter(i =>
      i.context.toLowerCase().includes(competitorName.toLowerCase()) ||
      (i.painPoint && i.painPoint.toLowerCase().includes(competitorName.toLowerCase()))
    );

    const sentiments = mentions.map(m => {
      const s = this.detectSentiment(m.context);
      return s === 'positive' ? 1 : s === 'negative' ? -1 : 0;
    });

    const sentimentAvg = sentiments.length > 0
      ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length
      : 0;

    return [{
      competitor_name: competitorName,
      mention_count: mentions.length,
      sentiment_avg: sentimentAvg,
      sample_quotes: mentions.slice(0, 5).map(m => m.context.substring(0, 150))
    }];
  }

  /**
   * Return empty customer voice structure
   */
  private emptyCustomerVoice(): CustomerVoice {
    return {
      pain_points: [],
      desires: [],
      objections: [],
      switching_triggers: [],
      common_phrases: [],
      source_quotes: []
    };
  }
}

export const redditCollector = new RedditCollector();
