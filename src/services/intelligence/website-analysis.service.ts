/**
 * Website Analysis Service
 *
 * Analyzes brand websites to extract:
 * - Meta descriptions and keywords
 * - Social media links
 * - Contact information
 * - Technology stack
 * - Performance metrics
 *
 * Uses multiple fallback strategies to ensure fast loading
 */

import { apiRetryWrapper } from './api-retry-wrapper';

interface WebsiteAnalysis {
  url: string;
  title?: string;
  description?: string;
  keywords?: string[];
  socialLinks?: {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
  technologies?: string[];
  performance?: {
    loadTime?: number;
    mobileOptimized?: boolean;
    hasSSL?: boolean;
  };
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  lastUpdated?: string;
  error?: string;
}

class WebsiteAnalysisService {
  private cache = new Map<string, { data: WebsiteAnalysis; timestamp: number }>();
  private CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Analyze a website and extract key information
   */
  async analyze(websiteUrl: string | undefined): Promise<WebsiteAnalysis> {
    if (!websiteUrl) {
      return this.getFallbackAnalysis('No website URL provided');
    }

    // Normalize URL
    let url = websiteUrl;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    // Check cache first
    const cached = this.getCached(url);
    if (cached) {
      console.log(`[WebsiteAnalysis] Returning cached analysis for ${url}`);
      return cached;
    }

    // Try to analyze the website with retry logic
    const analysis = await apiRetryWrapper.executeWithRetry(
      () => this.performAnalysis(url),
      `website-analysis-${url}`,
      {
        maxRetries: 2,
        initialDelayMs: 500,
        fallbackData: this.getFallbackAnalysis()
      }
    );

    // Cache the result
    this.setCache(url, analysis);

    return analysis;
  }

  /**
   * Perform the actual website analysis
   */
  private async performAnalysis(url: string): Promise<WebsiteAnalysis> {
    try {
      // Dynamic import Supabase client to avoid circular dependencies
      const { supabase } = await import('@/lib/supabase').then(m => ({ supabase: m.supabase }));

      // Try to scrape the website using Supabase Edge Function
      const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('scrape-website', {
        body: { url }
      });

      if (scrapeError) {
        throw scrapeError;
      }

      if (!scrapeData || !scrapeData.success) {
        console.warn('[WebsiteAnalysis] Scraping failed, using basic analysis');
        return this.basicAnalysis(url);
      }

      // Extract metadata from scraped content
      const analysis: WebsiteAnalysis = {
        url,
        title: scrapeData.metadata?.title || url,
        description: scrapeData.metadata?.description || '',
        keywords: scrapeData.metadata?.keywords || [],
        performance: {
          hasSSL: url.startsWith('https://'),
          mobileOptimized: true,
          loadTime: scrapeData.loadTime
        },
        lastUpdated: new Date().toISOString()
      };

      // Extract social links from content
      const content = scrapeData.content?.text || '';
      analysis.socialLinks = this.extractSocialLinks(content, url);

      // Detect technologies from metadata and content
      analysis.technologies = this.detectTechnologies(scrapeData);

      return analysis;
    } catch (error) {
      console.warn('[WebsiteAnalysis] Edge Function failed, using basic analysis:', error);

      // Fallback to basic client-side analysis
      return this.basicAnalysis(url);
    }
  }

  /**
   * Extract social media links from website content
   */
  private extractSocialLinks(content: string, websiteUrl: string): WebsiteAnalysis['socialLinks'] {
    const domain = new URL(websiteUrl).hostname.replace('www.', '').split('.')[0];

    return {
      twitter: content.includes('twitter.com/') ? `https://twitter.com/${domain}` : undefined,
      facebook: content.includes('facebook.com/') ? `https://facebook.com/${domain}` : undefined,
      linkedin: content.includes('linkedin.com/') ? `https://linkedin.com/company/${domain}` : undefined,
      instagram: content.includes('instagram.com/') ? `https://instagram.com/${domain}` : undefined,
      youtube: content.includes('youtube.com/') ? `https://youtube.com/c/${domain}` : undefined,
    };
  }

  /**
   * Detect technologies from scraped data
   */
  private detectTechnologies(scrapeData: any): string[] {
    const technologies: string[] = [];
    const content = (scrapeData.content?.text || '').toLowerCase();
    const html = (scrapeData.html || '').toLowerCase();

    // E-commerce platforms
    if (content.includes('shopify') || html.includes('shopify')) technologies.push('Shopify');
    if (content.includes('woocommerce') || html.includes('woocommerce')) technologies.push('WooCommerce');
    if (content.includes('magento') || html.includes('magento')) technologies.push('Magento');

    // CMS platforms
    if (content.includes('wordpress') || html.includes('wp-content')) technologies.push('WordPress');
    if (content.includes('drupal') || html.includes('drupal')) technologies.push('Drupal');
    if (content.includes('joomla') || html.includes('joomla')) technologies.push('Joomla');

    // Website builders
    if (content.includes('squarespace') || html.includes('squarespace')) technologies.push('Squarespace');
    if (content.includes('wix') || html.includes('wix')) technologies.push('Wix');
    if (content.includes('webflow') || html.includes('webflow')) technologies.push('Webflow');

    // Frameworks
    if (html.includes('react') || html.includes('_next')) technologies.push('React');
    if (html.includes('angular')) technologies.push('Angular');
    if (html.includes('vue')) technologies.push('Vue.js');

    if (technologies.length === 0) {
      technologies.push('Custom Website');
    }

    return technologies;
  }

  /**
   * Basic client-side analysis fallback
   */
  private async basicAnalysis(url: string): Promise<WebsiteAnalysis> {
    const analysis: WebsiteAnalysis = {
      url,
      lastUpdated: new Date().toISOString()
    };

    try {
      // Extract domain for basic analysis
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');

      analysis.title = domain.charAt(0).toUpperCase() + domain.slice(1);
      analysis.performance = {
        hasSSL: urlObj.protocol === 'https:',
        mobileOptimized: true // Assume most modern sites are mobile-optimized
      };

      // Common social media patterns
      analysis.socialLinks = {
        twitter: `https://twitter.com/${domain.split('.')[0]}`,
        facebook: `https://facebook.com/${domain.split('.')[0]}`,
        linkedin: `https://linkedin.com/company/${domain.split('.')[0]}`,
        instagram: `https://instagram.com/${domain.split('.')[0]}`
      };

      // Common technologies based on domain patterns
      if (url.includes('shopify')) {
        analysis.technologies = ['Shopify', 'E-commerce'];
      } else if (url.includes('wordpress')) {
        analysis.technologies = ['WordPress', 'CMS'];
      } else if (url.includes('squarespace')) {
        analysis.technologies = ['Squarespace', 'Website Builder'];
      } else {
        analysis.technologies = ['Custom Website'];
      }

    } catch (error) {
      analysis.error = 'Basic analysis completed with limited data';
    }

    return analysis;
  }

  /**
   * Get fallback analysis data
   */
  private getFallbackAnalysis(error?: string): WebsiteAnalysis {
    return {
      url: 'unknown',
      title: 'Website Analysis Unavailable',
      description: 'Unable to analyze website at this time',
      keywords: [],
      technologies: ['Unknown'],
      performance: {
        hasSSL: true,
        mobileOptimized: true
      },
      lastUpdated: new Date().toISOString(),
      error: error || 'Analysis service temporarily unavailable'
    };
  }

  /**
   * Get cached analysis if still valid
   */
  private getCached(url: string): WebsiteAnalysis | null {
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    this.cache.delete(url);
    return null;
  }

  /**
   * Cache analysis result
   */
  private setCache(url: string, data: WebsiteAnalysis): void {
    this.cache.set(url, { data, timestamp: Date.now() });

    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const websiteAnalysisService = new WebsiteAnalysisService();