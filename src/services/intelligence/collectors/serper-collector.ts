/**
 * Serper Collector for Competitor Intelligence
 *
 * Collects news mentions, SERP features, and search intelligence about competitors.
 *
 * Created: 2025-11-29
 */

import { SerperAPI } from '../serper-api';
import type { SerperCollectorResult } from './types';

class SerperCollector {
  /**
   * Collect search intelligence for a competitor
   */
  async collect(
    competitorName: string,
    competitorDomain?: string,
    options?: {
      includeNews?: boolean;
      includeAds?: boolean;
    }
  ): Promise<SerperCollectorResult> {
    console.log(`[SerperCollector] Collecting data for ${competitorName}`);

    try {
      // Run searches in parallel
      const [newsResults, searchResults, alternativesResults] = await Promise.all([
        options?.includeNews !== false
          ? this.searchNews(competitorName)
          : Promise.resolve([]),
        this.searchGoogle(`${competitorName} reviews`),
        this.searchGoogle(`${competitorName} alternatives`)
      ]);

      // Extract SERP features
      const serpFeatures = this.analyzeSERPFeatures(searchResults, competitorDomain);

      // Extract related searches
      const relatedSearches = this.extractRelatedSearches(alternativesResults);

      // Extract competitor ads from search results
      const competitorAds = options?.includeAds !== false
        ? await this.searchAds(competitorName)
        : [];

      return {
        success: true,
        source: 'serper',
        timestamp: new Date().toISOString(),
        data: {
          news_mentions: newsResults.map(n => ({
            title: n.title,
            snippet: n.snippet,
            url: n.link,
            date: n.date || new Date().toISOString(),
            source: n.source || 'Unknown'
          })),
          serp_features: serpFeatures,
          related_searches: relatedSearches,
          competitor_ads: competitorAds
        }
      };
    } catch (error) {
      console.error('[SerperCollector] Error:', error);
      return {
        success: false,
        source: 'serper',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          news_mentions: [],
          serp_features: {
            has_featured_snippet: false,
            has_knowledge_panel: false,
            has_local_pack: false,
            organic_position: null
          },
          related_searches: [],
          competitor_ads: []
        }
      };
    }
  }

  /**
   * Search news for competitor mentions
   */
  private async searchNews(query: string): Promise<Array<{
    title: string;
    snippet: string;
    link: string;
    date?: string;
    source?: string;
  }>> {
    try {
      // Use getNews which is the correct method on SerperAPI
      const results = await SerperAPI.getNews(query);
      return results.slice(0, 10).map(r => ({
        title: r.title,
        snippet: r.snippet,
        link: r.link,
        date: r.date,
        source: r.source
      }));
    } catch (error) {
      console.error('[SerperCollector] News search error:', error);
      return [];
    }
  }

  /**
   * Search Google for general results
   */
  private async searchGoogle(query: string): Promise<Array<{
    title: string;
    snippet: string;
    link: string;
    position: number;
  }>> {
    try {
      return await SerperAPI.searchGoogle(query);
    } catch (error) {
      console.error('[SerperCollector] Search error:', error);
      return [];
    }
  }

  /**
   * Search for competitor ads
   */
  private async searchAds(query: string): Promise<Array<{
    title: string;
    description: string;
    url: string;
  }>> {
    try {
      // Search for competitor brand + typical ad triggers
      const results = await SerperAPI.searchGoogle(`${query} pricing plans free trial`);

      // Filter for ad-like results (typically have pricing/CTA language)
      const adIndicators = ['pricing', 'free', 'trial', 'start', 'sign up', 'get started', 'demo', 'buy'];

      return results
        .filter(r => adIndicators.some(indicator =>
          r.title.toLowerCase().includes(indicator) ||
          r.snippet.toLowerCase().includes(indicator)
        ))
        .slice(0, 5)
        .map(r => ({
          title: r.title,
          description: r.snippet,
          url: r.link
        }));
    } catch (error) {
      console.error('[SerperCollector] Ads search error:', error);
      return [];
    }
  }

  /**
   * Analyze SERP features from search results
   */
  private analyzeSERPFeatures(
    results: Array<{ title: string; snippet: string; link: string; position: number }>,
    competitorDomain?: string
  ): SerperCollectorResult['data']['serp_features'] {
    // Check for featured snippet (usually position 0 or very detailed snippet)
    const hasFeaturedSnippet = results.some(r =>
      r.snippet.length > 300 || r.position === 0
    );

    // Check for knowledge panel indicators
    const hasKnowledgePanel = results.some(r =>
      r.snippet.includes('Founded') ||
      r.snippet.includes('Headquarters') ||
      r.snippet.includes('CEO')
    );

    // Check for local pack
    const hasLocalPack = results.some(r =>
      r.snippet.includes('reviews') && r.snippet.includes('rating')
    );

    // Find organic position for competitor domain
    let organicPosition: number | null = null;
    if (competitorDomain) {
      const cleanDomain = competitorDomain.replace(/^https?:\/\//, '').replace(/^www\./, '');
      const matchingResult = results.find(r => r.link.includes(cleanDomain));
      if (matchingResult) {
        organicPosition = matchingResult.position;
      }
    }

    return {
      has_featured_snippet: hasFeaturedSnippet,
      has_knowledge_panel: hasKnowledgePanel,
      has_local_pack: hasLocalPack,
      organic_position: organicPosition
    };
  }

  /**
   * Extract related searches from alternative results
   */
  private extractRelatedSearches(
    results: Array<{ title: string; snippet: string }>
  ): string[] {
    const related: string[] = [];

    // Extract competitor names and terms from "alternatives" search
    for (const result of results) {
      const text = `${result.title} ${result.snippet}`.toLowerCase();

      // Look for "vs" comparisons
      const vsMatch = text.match(/(\w+)\s+vs\s+(\w+)/gi);
      if (vsMatch) {
        related.push(...vsMatch);
      }

      // Look for "alternative to" patterns
      const altMatch = text.match(/alternative[s]?\s+to\s+(\w+)/gi);
      if (altMatch) {
        related.push(...altMatch);
      }

      // Look for "like" patterns
      const likeMatch = text.match(/like\s+(\w+)/gi);
      if (likeMatch) {
        related.push(...likeMatch.slice(0, 3));
      }
    }

    // Deduplicate and clean
    return [...new Set(related)].slice(0, 10);
  }

  /**
   * Get feature velocity signals from news
   */
  async getFeatureVelocityFromNews(competitorName: string): Promise<{
    recent_announcements: string[];
    press_coverage_count: number;
    last_announcement_date?: string;
  }> {
    try {
      const news = await this.searchNews(`${competitorName} announces OR launches OR releases`);

      const announcements = news
        .filter(n =>
          n.title.toLowerCase().includes('announc') ||
          n.title.toLowerCase().includes('launch') ||
          n.title.toLowerCase().includes('releas') ||
          n.title.toLowerCase().includes('new feature') ||
          n.title.toLowerCase().includes('introduces')
        )
        .map(n => n.title);

      return {
        recent_announcements: announcements.slice(0, 10),
        press_coverage_count: news.length,
        last_announcement_date: news[0]?.date
      };
    } catch (error) {
      console.error('[SerperCollector] Feature velocity error:', error);
      return {
        recent_announcements: [],
        press_coverage_count: 0
      };
    }
  }
}

export const serperCollector = new SerperCollector();
