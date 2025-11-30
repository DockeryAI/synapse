/**
 * SEMrush Collector for Competitor Intelligence
 *
 * Extracts SEO metrics (traffic, keywords, backlinks, authority) for competitors.
 *
 * Created: 2025-11-29
 */

import { SemrushAPI } from '../semrush-api';
import type { SEMrushCollectorResult } from './types';
import type { SEOMetrics } from '@/types/competitor-intelligence.types';

class SEMrushCollector {
  /**
   * Collect SEO metrics for a competitor's website
   */
  async collect(
    domain: string,
    brandName?: string
  ): Promise<SEMrushCollectorResult> {
    console.log(`[SEMrushCollector] Collecting data for ${domain}`);

    try {
      // Clean the domain
      const cleanDomain = this.cleanDomain(domain);
      if (!cleanDomain) {
        throw new Error('Invalid domain');
      }

      // Get comprehensive SEO metrics
      const seoData = await SemrushAPI.getComprehensiveSEOMetrics(cleanDomain, brandName);

      // Map to our SEOMetrics type
      const seoMetrics: SEOMetrics = {
        organic_traffic: seoData.overview.organic_traffic,
        keywords: seoData.overview.organic_keywords,
        backlinks: seoData.overview.backlinks,
        authority_score: seoData.overview.authority_score
      };

      // Get top keywords
      const topKeywords = seoData.rankings.slice(0, 20).map(r => ({
        keyword: r.keyword,
        position: r.position,
        volume: r.searchVolume,
        traffic: r.traffic
      }));

      // Identify keyword gaps (opportunities)
      const keywordGaps = seoData.opportunities.slice(0, 10).map(o => ({
        keyword: o.keyword,
        competitor_position: o.currentPosition || 0,
        our_position: null, // Would need brand's rankings to compare
        opportunity: o.reasoning
      }));

      return {
        success: true,
        source: 'semrush',
        timestamp: new Date().toISOString(),
        data: {
          seo_metrics: seoMetrics,
          top_keywords: topKeywords,
          keyword_gaps: keywordGaps
        }
      };
    } catch (error) {
      console.error('[SEMrushCollector] Error:', error);
      return {
        success: false,
        source: 'semrush',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          seo_metrics: {
            organic_traffic: 0,
            keywords: 0,
            backlinks: 0,
            authority_score: 0
          },
          top_keywords: [],
          keyword_gaps: []
        }
      };
    }
  }

  /**
   * Clean domain for SEMrush API
   */
  private cleanDomain(input: string): string | null {
    try {
      // Handle URLs
      if (input.includes('://')) {
        const url = new URL(input);
        return url.hostname.replace(/^www\./, '');
      }

      // Handle plain domains
      const cleaned = input.replace(/^www\./, '').replace(/\/.*$/, '');
      if (cleaned.includes('.')) {
        return cleaned;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Compare SEO metrics between competitors and brand
   */
  async compareWithBrand(
    competitorDomains: string[],
    brandDomain: string
  ): Promise<{
    brand: SEOMetrics;
    competitors: Array<{ domain: string; metrics: SEOMetrics }>;
    gaps: string[];
  }> {
    console.log(`[SEMrushCollector] Comparing ${competitorDomains.length} competitors with brand`);

    try {
      // Fetch brand metrics
      const brandResult = await this.collect(brandDomain);
      const brandMetrics = brandResult.data.seo_metrics;

      // Fetch competitor metrics in parallel
      const competitorResults = await Promise.all(
        competitorDomains.map(async domain => {
          const result = await this.collect(domain);
          return {
            domain,
            metrics: result.data.seo_metrics
          };
        })
      );

      // Identify gaps
      const gaps: string[] = [];
      for (const comp of competitorResults) {
        if (comp.metrics.organic_traffic > brandMetrics.organic_traffic * 2) {
          gaps.push(`${comp.domain} has ${Math.round(comp.metrics.organic_traffic / brandMetrics.organic_traffic)}x more organic traffic`);
        }
        if (comp.metrics.authority_score > brandMetrics.authority_score + 20) {
          gaps.push(`${comp.domain} has significantly higher domain authority (${comp.metrics.authority_score} vs ${brandMetrics.authority_score})`);
        }
        if (comp.metrics.backlinks > brandMetrics.backlinks * 3) {
          gaps.push(`${comp.domain} has ${Math.round(comp.metrics.backlinks / brandMetrics.backlinks)}x more backlinks`);
        }
      }

      return {
        brand: brandMetrics,
        competitors: competitorResults,
        gaps
      };
    } catch (error) {
      console.error('[SEMrushCollector] Comparison error:', error);
      return {
        brand: { organic_traffic: 0, keywords: 0, backlinks: 0, authority_score: 0 },
        competitors: [],
        gaps: []
      };
    }
  }
}

export const semrushCollector = new SEMrushCollector();
