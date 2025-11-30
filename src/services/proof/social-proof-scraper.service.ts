/**
 * Social Proof Scraper Service
 *
 * Extracts social media follower counts and engagement metrics.
 * Quick credibility signals for brand authority.
 *
 * Created: 2025-11-29 (Phase 7.5)
 */

import { SerperAPI } from '@/services/intelligence/serper-api';

// ============================================================================
// TYPES
// ============================================================================

export interface SocialMetric {
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'youtube' | 'tiktok';
  metricType: 'followers' | 'subscribers' | 'connections' | 'likes';
  count?: number;
  displayCount?: string;            // "50K", "1.2M"
  profileUrl?: string;
  verified?: boolean;
  lastUpdated?: string;
}

export interface SocialProofResult {
  brandName: string;
  metrics: SocialMetric[];
  totalFollowers: number;
  primaryPlatform?: string;
  hasVerifiedAccounts: boolean;
  fetchedAt: Date;
}

// ============================================================================
// PATTERNS
// ============================================================================

const FOLLOWER_PATTERNS = [
  /(\d+(?:\.\d+)?)\s*[KMB]?\s*followers?/gi,
  /(\d+(?:,\d+)*)\s*followers?/gi,
  /(\d+(?:\.\d+)?)\s*[KMB]?\s*subscribers?/gi,
  /(\d+(?:,\d+)*)\s*subscribers?/gi,
  /(\d+(?:\.\d+)?)\s*[KMB]?\s*connections?/gi,
  /(\d+(?:,\d+)*)\s*likes?/gi
];

// ============================================================================
// SERVICE
// ============================================================================

class SocialProofScraperService {
  private serperApi = SerperAPI;

  /**
   * Main entry point - get social proof metrics
   */
  async scrapeSocialProof(brandName: string): Promise<SocialProofResult> {
    console.log('[SocialProofScraper] Starting for:', brandName);

    const result: SocialProofResult = {
      brandName,
      metrics: [],
      totalFollowers: 0,
      hasVerifiedAccounts: false,
      fetchedAt: new Date()
    };

    try {
      // Search for social profiles in parallel
      const [linkedinResult, twitterResult, youtubeResult] = await Promise.allSettled([
        this.searchLinkedIn(brandName),
        this.searchTwitter(brandName),
        this.searchYouTube(brandName)
      ]);

      // Process LinkedIn
      if (linkedinResult.status === 'fulfilled' && linkedinResult.value) {
        result.metrics.push(linkedinResult.value);
      }

      // Process Twitter
      if (twitterResult.status === 'fulfilled' && twitterResult.value) {
        result.metrics.push(twitterResult.value);
      }

      // Process YouTube
      if (youtubeResult.status === 'fulfilled' && youtubeResult.value) {
        result.metrics.push(youtubeResult.value);
      }

      // Calculate totals
      result.totalFollowers = result.metrics.reduce((sum, m) => sum + (m.count || 0), 0);
      result.hasVerifiedAccounts = result.metrics.some(m => m.verified);

      // Find primary platform (highest followers)
      if (result.metrics.length > 0) {
        const sorted = [...result.metrics].sort((a, b) => (b.count || 0) - (a.count || 0));
        result.primaryPlatform = sorted[0].platform;
      }

      console.log('[SocialProofScraper] Found:', {
        platforms: result.metrics.length,
        totalFollowers: result.totalFollowers
      });

    } catch (error) {
      console.warn('[SocialProofScraper] Error:', error);
    }

    return result;
  }

  /**
   * Search for LinkedIn company page
   */
  private async searchLinkedIn(brandName: string): Promise<SocialMetric | null> {
    try {
      const query = `"${brandName}" site:linkedin.com/company`;
      const results = await this.serperApi.searchGoogle(query);

      const linkedinResult = results.find(r => r.link.includes('linkedin.com/company'));
      if (!linkedinResult) return null;

      const metric: SocialMetric = {
        platform: 'linkedin',
        metricType: 'followers',
        profileUrl: linkedinResult.link
      };

      // Try to extract follower count from snippet
      const followerMatch = this.extractFollowerCount(linkedinResult.snippet + ' ' + linkedinResult.title);
      if (followerMatch) {
        metric.count = followerMatch.count;
        metric.displayCount = followerMatch.display;
      }

      return metric;
    } catch (error) {
      console.warn('[SocialProofScraper] LinkedIn search error:', error);
      return null;
    }
  }

  /**
   * Search for Twitter/X profile
   */
  private async searchTwitter(brandName: string): Promise<SocialMetric | null> {
    try {
      const query = `"${brandName}" site:twitter.com OR site:x.com`;
      const results = await this.serperApi.searchGoogle(query);

      const twitterResult = results.find(r =>
        r.link.includes('twitter.com') || r.link.includes('x.com')
      );
      if (!twitterResult) return null;

      const metric: SocialMetric = {
        platform: 'twitter',
        metricType: 'followers',
        profileUrl: twitterResult.link
      };

      // Try to extract follower count from snippet
      const followerMatch = this.extractFollowerCount(twitterResult.snippet + ' ' + twitterResult.title);
      if (followerMatch) {
        metric.count = followerMatch.count;
        metric.displayCount = followerMatch.display;
      }

      // Check for verified badge in snippet
      if (/verified|✓|✔/i.test(twitterResult.snippet)) {
        metric.verified = true;
      }

      return metric;
    } catch (error) {
      console.warn('[SocialProofScraper] Twitter search error:', error);
      return null;
    }
  }

  /**
   * Search for YouTube channel
   */
  private async searchYouTube(brandName: string): Promise<SocialMetric | null> {
    try {
      const query = `"${brandName}" site:youtube.com channel`;
      const results = await this.serperApi.searchGoogle(query);

      const ytResult = results.find(r =>
        r.link.includes('youtube.com') && (r.link.includes('/channel/') || r.link.includes('/@'))
      );
      if (!ytResult) return null;

      const metric: SocialMetric = {
        platform: 'youtube',
        metricType: 'subscribers',
        profileUrl: ytResult.link
      };

      // Try to extract subscriber count from snippet
      const subMatch = this.extractFollowerCount(ytResult.snippet + ' ' + ytResult.title);
      if (subMatch) {
        metric.count = subMatch.count;
        metric.displayCount = subMatch.display;
      }

      return metric;
    } catch (error) {
      console.warn('[SocialProofScraper] YouTube search error:', error);
      return null;
    }
  }

  /**
   * Extract follower/subscriber count from text
   */
  private extractFollowerCount(text: string): { count: number; display: string } | null {
    for (const pattern of FOLLOWER_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const display = match[0];
        const numStr = match[1];

        // Parse the number
        let count = 0;
        if (numStr.includes(',')) {
          count = parseInt(numStr.replace(/,/g, ''), 10);
        } else if (/\d+\.\d+[KMB]/i.test(display)) {
          const num = parseFloat(numStr);
          if (/K/i.test(display)) count = num * 1000;
          else if (/M/i.test(display)) count = num * 1000000;
          else if (/B/i.test(display)) count = num * 1000000000;
        } else if (/\d+[KMB]/i.test(display)) {
          const num = parseInt(numStr, 10);
          if (/K/i.test(display)) count = num * 1000;
          else if (/M/i.test(display)) count = num * 1000000;
          else if (/B/i.test(display)) count = num * 1000000000;
        } else {
          count = parseInt(numStr, 10);
        }

        if (count > 0) {
          return { count, display };
        }
      }
    }

    return null;
  }

  /**
   * Format large number for display
   */
  formatCount(count: number): string {
    if (count >= 1000000000) {
      return (count / 1000000000).toFixed(1) + 'B';
    }
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }
}

export const socialProofScraperService = new SocialProofScraperService();
export default socialProofScraperService;
