/**
 * Deep Testimonial Scraper Service
 *
 * Fetches dedicated testimonial/case-study pages and extracts rich quotes.
 * Goes beyond homepage to find detailed customer stories.
 *
 * Created: 2025-11-29 (Phase 7.2)
 */

import { SerperAPI } from '@/services/intelligence/serper-api';

// ============================================================================
// TYPES
// ============================================================================

export interface CaseStudyStructure {
  customerName: string;             // Customer/company name
  industry?: string;                // Customer's industry
  execSummary?: string;             // Executive summary
  challenge?: string;               // The challenge they faced
  solution?: string;                // How the solution helped
  outcome?: string;                 // The results/outcome
  metrics?: string[];               // Key stats ("40% increase", "$500K saved")
  testimonialQuote?: string;        // Pull quote from the case study
}

export interface ExtractedTestimonial {
  quote: string;                    // Full quote text
  authorName?: string;              // Customer name
  authorCompany?: string;           // Company name
  authorRole?: string;              // Role/title
  authorPhoto?: string;             // Photo URL
  companyLogo?: string;             // Company logo URL
  sourceUrl: string;                // Page URL
  sourceType: 'testimonial' | 'case-study' | 'review' | 'success-story';
  metrics?: string[];               // Extracted metrics ("40% increase", "$500K saved")
  industry?: string;                // Customer's industry
  date?: string;                    // Date if available

  // Case study specific fields
  caseStudy?: CaseStudyStructure;   // Structured case study data
}

export interface DeepTestimonialResult {
  brandName: string;
  websiteUrl: string;
  testimonials: ExtractedTestimonial[];
  caseStudies: ExtractedTestimonial[];
  totalFound: number;
  pagesScraped: string[];
  fetchedAt: Date;
}

// ============================================================================
// PAGE PATTERNS
// ============================================================================

const TESTIMONIAL_PAGE_PATTERNS = [
  '/testimonials',
  '/reviews',
  '/customer-reviews',
  '/customer-stories',
  '/success-stories',
  '/case-studies',
  '/case-study',
  '/customers',
  '/our-customers',
  '/client-stories',
  '/results',
  '/why-us',
  '/about-us'
];

const METRIC_PATTERNS = [
  /(\d+)%\s*(increase|decrease|growth|reduction|improvement|faster|more|less)/gi,
  /(\d+)x\s*(faster|more|better|improvement)/gi,
  /\$[\d,]+(?:\.\d+)?[KMB]?\s*(saved|revenue|growth|increase)/gi,
  /(\d+)\s*(hours?|days?|weeks?|months?)\s*saved/gi,
  /ROI\s*(?:of\s*)?(\d+)%/gi,
  /(\d+)\s*(?:new\s*)?(customers?|clients?|users?|leads?)/gi
];

// ============================================================================
// SERVICE
// ============================================================================

class DeepTestimonialScraperService {
  private serperApi = SerperAPI;

  /**
   * Main entry point - scrape testimonials from website
   */
  async scrapeTestimonials(brandName: string, websiteUrl?: string): Promise<DeepTestimonialResult> {
    console.log('[DeepTestimonialScraper] Starting for:', brandName);

    const result: DeepTestimonialResult = {
      brandName,
      websiteUrl: websiteUrl || '',
      testimonials: [],
      caseStudies: [],
      totalFound: 0,
      pagesScraped: [],
      fetchedAt: new Date()
    };

    try {
      // Search for testimonial pages via Serper
      const [testimonialPages, caseStudyPages] = await Promise.all([
        this.findTestimonialPages(brandName, websiteUrl),
        this.findCaseStudyPages(brandName, websiteUrl)
      ]);

      // Extract testimonials from search results
      for (const page of testimonialPages) {
        const testimonials = this.extractTestimonialsFromSearchResult(page, 'testimonial');
        result.testimonials.push(...testimonials);
        result.pagesScraped.push(page.link);
      }

      // Extract case studies from search results
      for (const page of caseStudyPages) {
        const caseStudies = this.extractTestimonialsFromSearchResult(page, 'case-study');
        result.caseStudies.push(...caseStudies);
        result.pagesScraped.push(page.link);
      }

      // Deduplicate by quote content
      result.testimonials = this.deduplicateTestimonials(result.testimonials);
      result.caseStudies = this.deduplicateTestimonials(result.caseStudies);

      result.totalFound = result.testimonials.length + result.caseStudies.length;

      console.log('[DeepTestimonialScraper] Found:', {
        testimonials: result.testimonials.length,
        caseStudies: result.caseStudies.length,
        pagesScraped: result.pagesScraped.length
      });

    } catch (error) {
      console.warn('[DeepTestimonialScraper] Error:', error);
    }

    return result;
  }

  /**
   * Find testimonial pages via search
   */
  private async findTestimonialPages(brandName: string, websiteUrl?: string): Promise<{ title: string; snippet: string; link: string }[]> {
    const results: { title: string; snippet: string; link: string }[] = [];

    try {
      // Search for testimonial pages on the site
      const siteQuery = websiteUrl ? `site:${new URL(websiteUrl).hostname}` : `"${brandName}"`;
      const queries = [
        `${siteQuery} testimonials`,
        `${siteQuery} customer reviews`,
        `${siteQuery} "what our customers say"`,
        `"${brandName}" customer testimonial`
      ];

      for (const query of queries.slice(0, 2)) { // Limit API calls
        const searchResults = await this.serperApi.searchGoogle(query);
        results.push(...searchResults.slice(0, 5));
      }
    } catch (error) {
      console.warn('[DeepTestimonialScraper] Testimonial search error:', error);
    }

    return results;
  }

  /**
   * Find case study pages via search
   */
  private async findCaseStudyPages(brandName: string, websiteUrl?: string): Promise<{ title: string; snippet: string; link: string }[]> {
    const results: { title: string; snippet: string; link: string }[] = [];

    try {
      const siteQuery = websiteUrl ? `site:${new URL(websiteUrl).hostname}` : `"${brandName}"`;
      const queries = [
        `${siteQuery} case study`,
        `${siteQuery} success story`,
        `${siteQuery} customer story results`
      ];

      for (const query of queries.slice(0, 2)) {
        const searchResults = await this.serperApi.searchGoogle(query);
        results.push(...searchResults.slice(0, 5));
      }
    } catch (error) {
      console.warn('[DeepTestimonialScraper] Case study search error:', error);
    }

    return results;
  }

  /**
   * Extract testimonial data from a search result
   */
  private extractTestimonialsFromSearchResult(
    result: { title: string; snippet: string; link: string },
    sourceType: 'testimonial' | 'case-study'
  ): ExtractedTestimonial[] {
    const testimonials: ExtractedTestimonial[] = [];

    if (!result.snippet) return testimonials;

    // Extract metrics from snippet
    const metrics = this.extractMetrics(result.snippet);

    // Extract author info from snippet (patterns like "- John Smith, CEO at Company")
    const authorInfo = this.extractAuthorInfo(result.snippet);

    // Extract customer name from title for case studies (pass URL for content type detection)
    const customerName = this.extractCustomerName(result.title, result.snippet, result.link);
    const industry = this.detectIndustry(result.title + ' ' + result.snippet);

    // For case studies, extract structured data
    let caseStudy: CaseStudyStructure | undefined;
    if (sourceType === 'case-study') {
      caseStudy = this.extractCaseStudyStructure(result.title, result.snippet, customerName, industry, metrics);
    }

    // Create testimonial entry
    testimonials.push({
      quote: result.snippet,
      authorName: authorInfo.name,
      authorCompany: authorInfo.company || customerName,
      authorRole: authorInfo.role,
      sourceUrl: result.link,
      sourceType,
      metrics: metrics.length > 0 ? metrics : undefined,
      industry,
      caseStudy
    });

    return testimonials;
  }

  /**
   * Detect content type from URL and title
   * Returns a descriptive label for non-standard case studies
   */
  private detectContentType(url: string, title: string): string | null {
    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();

    // Check for ebooks
    if (urlLower.includes('/ebook') || urlLower.includes('ebook') ||
        titleLower.includes('ebook') || titleLower.includes('e-book')) {
      if (titleLower.includes('case stud')) {
        return 'Case Studies Ebook';
      }
      return 'Ebook Resource';
    }

    // Check for resource downloads
    if (urlLower.includes('/download') || urlLower.includes('/resource') ||
        urlLower.includes('/whitepaper') || urlLower.includes('/guide')) {
      if (titleLower.includes('case stud')) {
        return 'Case Studies Collection';
      }
      return 'Resource Download';
    }

    // Check for case studies collection/listing pages (multiple case studies)
    if ((urlLower.includes('/case-studies') || urlLower.includes('/case_studies') ||
         urlLower.includes('/casestudies')) &&
        !urlLower.match(/\/case-stud(y|ies)\/[a-z0-9-]+/)) {
      // URL suggests a listing page, not an individual case study
      if (titleLower.includes('example') || titleLower.includes('collection')) {
        return 'Case Studies Collection';
      }
    }

    // Check for "examples of" titles which are usually collections
    if (titleLower.match(/^examples?\s+of/i) || titleLower.match(/^\d+\s+examples?\s+of/i)) {
      return 'Examples & Case Studies';
    }

    return null; // Regular case study, extract customer name
  }

  /**
   * Extract customer/company name from case study title
   */
  private extractCustomerName(title: string, snippet: string, sourceUrl: string = ''): string {
    // First check if this is an ebook, resource, or collection
    const contentType = this.detectContentType(sourceUrl, title);
    if (contentType) {
      return contentType;
    }

    // Common patterns for case study titles
    const patterns = [
      // "Case Study - Brand enables Customer Name to..."
      /Case Study\s*[-–—:]\s*\w+\s+enables?\s+([A-Z][A-Za-z0-9\s&]+?)\s+to/i,
      // "Case Study: Customer Name" or "Case Study - Customer Name"
      /Case Study\s*[-–—:]\s*([A-Z][A-Za-z0-9\s&]+?)(?:\s*[-–—|]|$)/i,
      // "Customer Name Case Study" or "Customer Name Success Story"
      /^([A-Z][A-Za-z0-9\s&]+?)(?:\s+Case Study|\s+Success Story)/i,
      // "How Customer Name Achieved/Used/etc"
      /^How\s+([A-Z][A-Za-z0-9\s&]+?)\s+(?:Achieved|Improved|Increased|Reduced|Saved|Used|Transformed|Automate)/i,
      // "Customer: Name" pattern
      /(?:Customer|Client):\s*([A-Z][A-Za-z0-9\s&]+)/i,
      // "Name - Some description"
      /^([A-Z][A-Za-z0-9\s&]{2,30})\s*[-–—]/,
      // "enables Customer Name to" in snippet
      /enables?\s+([A-Z][A-Za-z0-9\s&]+?)\s+to/i
    ];

    // Try title first
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        // Filter out generic words and the brand name
        const genericWords = ['Case Study', 'Success Story', 'Customer Story', 'How', 'OpenDialog', 'The'];
        if (!genericWords.some(w => name.toLowerCase() === w.toLowerCase())) {
          return name;
        }
      }
    }

    // Try snippet for "enables X to" pattern
    const enablesMatch = snippet.match(/enables?\s+([A-Z][A-Za-z0-9\s&]+?)\s+to/i);
    if (enablesMatch && enablesMatch[1]) {
      const name = enablesMatch[1].trim();
      if (name.toLowerCase() !== 'opendialog' && name.length > 2) {
        return name;
      }
    }

    // Fallback: Look for company names in snippet
    const companyMatch = snippet.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:is a|was looking|needed|wanted|faced)/);
    if (companyMatch) {
      return companyMatch[1];
    }

    // Last resort: Use title as-is if it's short enough
    if (title.length < 50 && !title.toLowerCase().includes('case study')) {
      return title;
    }

    return 'Customer';
  }

  /**
   * Extract structured case study data from title and snippet
   */
  private extractCaseStudyStructure(
    title: string,
    snippet: string,
    customerName: string,
    industry: string | undefined,
    metrics: string[]
  ): CaseStudyStructure {
    const fullText = `${title} ${snippet}`;

    // Extract challenge - look for problem statements
    let challenge = this.extractSection(fullText, [
      /challenge[s]?[:\s]+([^.]+\.)/i,
      /problem[s]?[:\s]+([^.]+\.)/i,
      /(?:was|were)\s+(?:facing|struggling with|dealing with)\s+([^.]+\.)/i,
      /needed\s+(?:to|a way to)\s+([^.]+\.)/i,
      /(?:wanted|looking)\s+to\s+([^.]+\.)/i
    ]);

    // Extract solution - how they used the product
    let solution = this.extractSection(fullText, [
      /solution[:\s]+([^.]+\.)/i,
      /(?:implemented|deployed|used|adopted|chose)\s+([^.]+\.)/i,
      /(?:with|using)\s+(?:our|the)\s+([^.]+(?:platform|solution|tool|product|AI)[^.]*\.)/i,
      /enables?\s+[^.]+\s+to\s+([^.]+\.)/i
    ]);

    // Extract outcome/results
    let outcome = this.extractSection(fullText, [
      /(?:result[s]?|outcome)[:\s]+([^.]+\.)/i,
      /(?:achieved|saw|experienced|realized|now)\s+([^.]+\.)/i,
      /(?:led to|resulted in|enabling)\s+([^.]+\.)/i,
      /(?:\d+%?\s*(?:increase|decrease|improvement|reduction|faster|more)[^.]*\.)/i
    ]);

    // If no explicit sections found, try to infer from the snippet structure
    if (!challenge && !solution && !outcome) {
      // Parse "enables X to do Y" pattern - common in case studies
      const enablesMatch = fullText.match(/enables?\s+[^.]+\s+to\s+(.+?)(?:\.|$)/i);
      if (enablesMatch) {
        solution = `Uses the platform to ${enablesMatch[1].trim()}`;
      }

      // Look for "automate X and Y" pattern
      const automateMatch = fullText.match(/(?:automate|streamline|optimize)\s+(?:the\s+)?(.+?)(?:\.|and\s+|$)/i);
      if (automateMatch) {
        outcome = `Automated ${automateMatch[1].trim()}`;
      }
    }

    // Extract testimonial quote (look for quoted text)
    const quoteMatch = fullText.match(/"([^"]{20,200})"/);
    const testimonialQuote = quoteMatch ? quoteMatch[1] : undefined;

    return {
      customerName,
      industry,
      execSummary: snippet.slice(0, 250) + (snippet.length > 250 ? '...' : ''),
      challenge: challenge || undefined,
      solution: solution || undefined,
      outcome: outcome || undefined,
      metrics: metrics.length > 0 ? metrics : undefined,
      testimonialQuote
    };
  }

  /**
   * Extract a section from text using multiple patterns
   */
  private extractSection(text: string, patterns: RegExp[]): string | null {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  /**
   * Extract metrics from text
   */
  private extractMetrics(text: string): string[] {
    const metrics: string[] = [];

    for (const pattern of METRIC_PATTERNS) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        metrics.push(match[0]);
      }
    }

    return [...new Set(metrics)]; // Dedupe
  }

  /**
   * Extract author information from text
   */
  private extractAuthorInfo(text: string): { name?: string; company?: string; role?: string } {
    const result: { name?: string; company?: string; role?: string } = {};

    // Pattern: "- Name, Title at Company" or "Name, Title, Company"
    const authorPatterns = [
      /[-–—]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s*([^,]+?)(?:\s+at\s+|\s*,\s*)([A-Z][A-Za-z\s&]+)/,
      /"([^"]+)"\s*[-–—]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*(CEO|CTO|VP|Director|Manager|Head|President|Founder|Owner)[^,]*,?\s*([A-Z][A-Za-z\s&]+)?/i
    ];

    for (const pattern of authorPatterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[1]) result.name = match[1].trim();
        if (match[2]) result.role = match[2].trim();
        if (match[3]) result.company = match[3].trim();
        break;
      }
    }

    return result;
  }

  /**
   * Detect industry from text
   */
  private detectIndustry(text: string): string | undefined {
    const lowerText = text.toLowerCase();

    const industries: { pattern: RegExp; name: string }[] = [
      { pattern: /healthcare|medical|hospital|clinic|health/i, name: 'Healthcare' },
      { pattern: /fintech|financial|banking|insurance|finance/i, name: 'Finance' },
      { pattern: /retail|ecommerce|e-commerce|shopping|store/i, name: 'Retail' },
      { pattern: /saas|software|tech|technology|startup/i, name: 'Technology' },
      { pattern: /manufacturing|industrial|factory|production/i, name: 'Manufacturing' },
      { pattern: /education|school|university|learning|edtech/i, name: 'Education' },
      { pattern: /real estate|property|housing|construction/i, name: 'Real Estate' },
      { pattern: /marketing|advertising|agency|media/i, name: 'Marketing' },
      { pattern: /legal|law firm|attorney|lawyer/i, name: 'Legal' },
      { pattern: /hospitality|hotel|restaurant|travel/i, name: 'Hospitality' }
    ];

    for (const { pattern, name } of industries) {
      if (pattern.test(lowerText)) {
        return name;
      }
    }

    return undefined;
  }

  /**
   * Deduplicate testimonials by quote similarity
   */
  private deduplicateTestimonials(testimonials: ExtractedTestimonial[]): ExtractedTestimonial[] {
    const seen = new Map<string, ExtractedTestimonial>();

    for (const testimonial of testimonials) {
      const fingerprint = testimonial.quote.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 100);

      if (!seen.has(fingerprint)) {
        seen.set(fingerprint, testimonial);
      }
    }

    return Array.from(seen.values());
  }
}

export const deepTestimonialScraperService = new DeepTestimonialScraperService();
export default deepTestimonialScraperService;
