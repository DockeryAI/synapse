/**
 * Multi-Page Product Discovery Service
 *
 * Discovers and scrapes product/service pages from website navigation and links
 * to provide comprehensive product extraction across multiple pages.
 *
 * Features:
 * - URL extraction from navigation and links
 * - Page priority scoring (pricing > services > products > about)
 * - Smart page scraping (top 5 most relevant)
 * - Caching to avoid re-fetching
 *
 * Created: 2025-11-19 (Phase 2 - Multi-page discovery)
 */

import type { WebsiteData } from '@/services/scraping/websiteScraper';
import { scrapeWebsite } from '@/services/scraping/websiteScraper';

export interface ProductPageCandidate {
  url: string;
  source: 'navigation' | 'link' | 'footer';
  priority: number;
  reasoning: string;
}

export interface MultiPageDiscoveryResult {
  mainPage: WebsiteData;
  additionalPages: WebsiteData[];
  discoveredUrls: ProductPageCandidate[];
  scrapedCount: number;
  cacheHits: number;
}

/**
 * Simple in-memory cache for scraped pages
 */
const pageCache = new Map<string, { data: WebsiteData; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Keywords that indicate a page likely contains product/service information
 */
const PRODUCT_PAGE_KEYWORDS = [
  // High priority
  { keywords: ['pricing', 'plans', 'packages'], priority: 100 },
  { keywords: ['services', 'service'], priority: 90 },
  { keywords: ['products', 'product', 'shop', 'store'], priority: 90 },
  { keywords: ['solutions', 'offerings'], priority: 85 },

  // Medium priority
  { keywords: ['what-we-do', 'what-we-offer'], priority: 80 },
  { keywords: ['features', 'capabilities'], priority: 75 },
  { keywords: ['portfolio', 'work', 'projects'], priority: 70 },

  // Lower priority but still relevant
  { keywords: ['about', 'our-team', 'expertise'], priority: 50 },
  { keywords: ['industries', 'specialties'], priority: 65 },
];

/**
 * Exclude URLs that are unlikely to contain product info
 */
const EXCLUDED_PATTERNS = [
  'blog', 'news', 'article', 'post',
  'contact', 'careers', 'jobs',
  'privacy', 'terms', 'legal',
  'login', 'signup', 'account',
  'cart', 'checkout',
  '.pdf', '.jpg', '.png', '.gif',
  'mailto:', 'tel:',
  '#', 'javascript:',
  // Media and PR patterns
  '/news/', '/events/', '/event/', '/media/', '/press/',
  'resource-library', 'resources/ebooks', 'resources/whitepapers',
  'case-studies', 'case-study', 'whitepaper', 'ebook', 'webinar',
  'download', 'downloads', '/resources/', '/blog/'
];

export class MultiPageProductDiscoveryService {
  /**
   * Discover and scrape product/service pages from a website
   */
  async discoverProductPages(
    mainPageData: WebsiteData,
    maxPages: number = 5
  ): Promise<MultiPageDiscoveryResult> {
    console.log('[MultiPageDiscovery] Starting discovery for:', mainPageData.url);

    // Step 1: Extract potential product page URLs
    const candidates = this.extractProductPageUrls(mainPageData);
    console.log('[MultiPageDiscovery] Found', candidates.length, 'candidate URLs');

    // Step 2: Sort by priority and take top N
    const topCandidates = candidates
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxPages);

    console.log('[MultiPageDiscovery] Selected top', topCandidates.length, 'URLs to scrape');

    // Step 3: Scrape pages (with caching)
    const additionalPages: WebsiteData[] = [];
    let cacheHits = 0;

    for (const candidate of topCandidates) {
      try {
        // Check cache first
        const cached = this.getFromCache(candidate.url);
        if (cached) {
          console.log('[MultiPageDiscovery] Cache hit for:', candidate.url);
          additionalPages.push(cached);
          cacheHits++;
          continue;
        }

        // Scrape the page
        console.log('[MultiPageDiscovery] Scraping:', candidate.url, `(priority: ${candidate.priority})`);
        const pageData = await scrapeWebsite(candidate.url);

        // Cache the result
        this.addToCache(candidate.url, pageData);
        additionalPages.push(pageData);

        // Small delay to be polite
        await this.delay(500);
      } catch (error) {
        console.warn('[MultiPageDiscovery] Failed to scrape', candidate.url, error);
        // Continue with other pages even if one fails
      }
    }

    console.log('[MultiPageDiscovery] Successfully scraped', additionalPages.length, 'additional pages');
    console.log('[MultiPageDiscovery] Cache hits:', cacheHits);

    return {
      mainPage: mainPageData,
      additionalPages,
      discoveredUrls: candidates,
      scrapedCount: additionalPages.length,
      cacheHits,
    };
  }

  /**
   * Extract potential product page URLs from website data
   */
  private extractProductPageUrls(data: WebsiteData): ProductPageCandidate[] {
    const candidates: ProductPageCandidate[] = [];
    const baseUrl = new URL(data.url).origin;
    const seenUrls = new Set<string>();

    // Helper to normalize and validate URLs
    const normalizeUrl = (url: string): string | null => {
      try {
        // Handle relative URLs
        const fullUrl = url.startsWith('http') ? url : new URL(url, baseUrl).href;

        // Must be same domain
        const urlObj = new URL(fullUrl);
        if (urlObj.origin !== baseUrl) return null;

        // Exclude patterns
        const path = urlObj.pathname.toLowerCase();
        if (EXCLUDED_PATTERNS.some(pattern => path.includes(pattern))) return null;

        // Remove hash and query params for deduplication
        return `${urlObj.origin}${urlObj.pathname}`;
      } catch {
        return null;
      }
    };

    // Helper to calculate priority
    const calculatePriority = (url: string): { priority: number; reasoning: string } => {
      const lowerUrl = url.toLowerCase();

      for (const group of PRODUCT_PAGE_KEYWORDS) {
        for (const keyword of group.keywords) {
          if (lowerUrl.includes(keyword)) {
            return {
              priority: group.priority,
              reasoning: `Contains keyword: ${keyword}`
            };
          }
        }
      }

      return { priority: 30, reasoning: 'No specific keywords' };
    };

    // Extract from navigation menu
    data.structure.navigation.forEach(navItem => {
      const normalized = normalizeUrl(navItem);
      if (normalized && !seenUrls.has(normalized)) {
        seenUrls.add(normalized);
        const { priority, reasoning } = calculatePriority(normalized);
        candidates.push({
          url: normalized,
          source: 'navigation',
          priority,
          reasoning: `Navigation: ${reasoning}`
        });
      }
    });

    // Extract from content links
    data.content.links.forEach(link => {
      const normalized = normalizeUrl(link);
      if (normalized && !seenUrls.has(normalized)) {
        seenUrls.add(normalized);
        const { priority, reasoning } = calculatePriority(normalized);
        candidates.push({
          url: normalized,
          source: 'link',
          priority: priority - 5, // Links slightly lower priority than nav
          reasoning: `Link: ${reasoning}`
        });
      }
    });

    return candidates;
  }

  /**
   * Get page from cache if available and not expired
   */
  private getFromCache(url: string): WebsiteData | null {
    const cached = pageCache.get(url);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > CACHE_TTL) {
      // Expired - remove from cache
      pageCache.delete(url);
      return null;
    }

    return cached.data;
  }

  /**
   * Add page to cache
   */
  private addToCache(url: string, data: WebsiteData): void {
    pageCache.set(url, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear the cache (useful for testing)
   */
  clearCache(): void {
    pageCache.clear();
  }

  /**
   * Simple delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Combine multiple WebsiteData objects into a comprehensive dataset
   */
  static combineWebsiteData(pages: WebsiteData[]): WebsiteData {
    if (pages.length === 0) {
      throw new Error('Cannot combine empty pages array');
    }

    if (pages.length === 1) {
      return pages[0];
    }

    const main = pages[0];

    // Combine all content
    const allHeadings = pages.flatMap(p => p.content.headings);
    const allParagraphs = pages.flatMap(p => p.content.paragraphs);
    const allLinks = [...new Set(pages.flatMap(p => p.content.links))];
    const allImages = [...new Set(pages.flatMap(p => p.content.images))];

    // Combine navigation and sections (deduplicated)
    const allNavigation = [...new Set(pages.flatMap(p => p.structure.navigation))];
    const allSections = [...new Set(pages.flatMap(p => p.structure.sections))];

    // Use main page's metadata but enhance keywords
    const allKeywords = [...new Set(pages.flatMap(p => p.metadata.keywords))];

    return {
      url: main.url,
      html: main.html, // Keep main page HTML
      metadata: {
        ...main.metadata,
        keywords: allKeywords
      },
      content: {
        headings: allHeadings,
        paragraphs: allParagraphs,
        links: allLinks,
        images: allImages
      },
      design: main.design, // Keep main page design
      structure: {
        navigation: allNavigation,
        sections: allSections
      }
    };
  }
}

/**
 * Singleton instance
 */
export const multiPageProductDiscoveryService = new MultiPageProductDiscoveryService();
