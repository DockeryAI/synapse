/**
 * Smart UVP Extractor with Source Verification
 *
 * CORE PRINCIPLE: ALL extracted data MUST include source URL attribution.
 * NO fabricated data allowed. Every piece of information must be traceable to its source.
 *
 * Extends existing website analyzer with source tracking and verification.
 */

import { scrapeWebsite } from '@/services/scraping/websiteScraper';
import { ErrorHandlerService, RetryProgress } from '../errors/error-handler.service';
import type {
  ExtractedUVPData,
  UVPExtractionOptions,
  CustomerType,
  ServiceProduct,
  ProblemSolved,
  Testimonial,
  Differentiator,
  SourceAttribution,
  UVPExtractionError,
  createEmptyUVPData,
} from '@/types/smart-uvp.types';

export class SmartUVPExtractor {
  private apiKey: string;
  private endpoint: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    this.endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`;
  }

  /**
   * Extract UVP components from website with full source verification
   */
  async extractUVP(
    options: UVPExtractionOptions,
    onProgress?: (progress: RetryProgress) => void
  ): Promise<ExtractedUVPData> {
    console.log('[SmartUVPExtractor] Starting extraction for:', options.websiteUrl);

    const {
      websiteUrl,
      maxPagesToAnalyze = 10,
      minConfidence = 0.6,
      requireSources = true,
      includeTestimonials = true,
    } = options;

    try {
      // Step 1: Scrape the website
      const scrapedData = await ErrorHandlerService.executeWithRetry(
        () => scrapeWebsite(websiteUrl),
        { maxAttempts: 3 },
        onProgress
      );
      if (!scrapedData) {
        throw new Error('Failed to scrape website');
      }

      console.log('[SmartUVPExtractor] Website scraped:', {
        title: scrapedData.metadata.title,
        headings: scrapedData.content.headings.length,
        paragraphs: scrapedData.content.paragraphs.length,
      });

      // Step 2: Extract UVP components with AI + source tracking
      const uvpData = await ErrorHandlerService.executeWithRetry(
        () => this.extractWithSources(websiteUrl, scrapedData),
        { maxAttempts: 3 },
        onProgress
      );

      // Step 3: Filter by minimum confidence
      uvpData.customerTypes = uvpData.customerTypes.filter((c) => c.confidence >= minConfidence);
      uvpData.services = uvpData.services.filter((s) => s.confidence >= minConfidence);
      uvpData.problemsSolved = uvpData.problemsSolved.filter((p) => p.confidence >= minConfidence);
      uvpData.testimonials = uvpData.testimonials.filter((t) => t.confidence >= minConfidence);
      uvpData.differentiators = uvpData.differentiators.filter((d) => d.confidence >= minConfidence);

      // Step 4: Verify all sources (if required)
      if (requireSources) {
        uvpData.customerTypes = uvpData.customerTypes.filter((c) => this.hasValidSource(c));
        uvpData.services = uvpData.services.filter((s) => this.hasValidSource(s));
        uvpData.problemsSolved = uvpData.problemsSolved.filter((p) => this.hasValidSource(p));
        uvpData.testimonials = uvpData.testimonials.filter((t) => this.hasValidSource(t));
        uvpData.differentiators = uvpData.differentiators.filter((d) => this.hasValidSource(d));
      }

      // Step 5: Calculate overall metrics
      uvpData.overallConfidence = this.calculateOverallConfidence(uvpData);
      uvpData.verificationRate = this.calculateVerificationRate(uvpData);
      uvpData.completeness = this.calculateCompleteness(uvpData);
      uvpData.sourceQuality = this.assessSourceQuality(uvpData);

      // Step 6: Add warnings if needed
      if (uvpData.verificationRate < 0.8) {
        uvpData.warnings.push(
          `Only ${(uvpData.verificationRate * 100).toFixed(0)}% of extracted data has verified sources`
        );
      }

      if (uvpData.customerTypes.length === 0) {
        uvpData.warnings.push('No customer types found - UVP will be less effective');
      }

      if (uvpData.differentiators.length === 0) {
        uvpData.warnings.push('No differentiators found - consider adding manually');
      }

      console.log('[SmartUVPExtractor] Extraction complete:', {
        customers: uvpData.customerTypes.length,
        services: uvpData.services.length,
        problems: uvpData.problemsSolved.length,
        testimonials: uvpData.testimonials.length,
        differentiators: uvpData.differentiators.length,
        confidence: uvpData.overallConfidence,
        verification: uvpData.verificationRate,
      });

      return uvpData;
    } catch (error) {
      console.error('[SmartUVPExtractor] Extraction failed:', error);
      ErrorHandlerService.logError(error, { websiteUrl });
      throw this.createError('unknown', error);
    }
  }

  /**
   * Extract UVP with cache fallback
   */
  async extractUVPWithCache(
    options: UVPExtractionOptions,
    onProgress?: (progress: RetryProgress) => void
  ): Promise<ExtractedUVPData> {
    const cacheKey = `uvp-${options.websiteUrl}`;

    try {
      return await ErrorHandlerService.executeWithRetry(
        () => this.extractUVP(options, onProgress),
        { maxAttempts: 3 },
        onProgress,
        [
          ErrorHandlerService.createCacheFallback(
            cacheKey,
            async (key) => {
              // Try to get from localStorage or intelligence cache
              const cached = localStorage.getItem(key);
              return cached ? JSON.parse(cached) : null;
            }
          )
        ]
      );
    } catch (error) {
      // If all retries and cache fail, return minimal data
      console.error('[SmartUVPExtractor] All extraction attempts failed, using minimal data');
      return this.createMinimalUVPData(options.websiteUrl);
    }
  }

  private createMinimalUVPData(websiteUrl: string): ExtractedUVPData {
    return {
      websiteUrl,
      extractedAt: new Date(),
      customerTypes: [],
      services: [],
      problemsSolved: [],
      testimonials: [],
      differentiators: [],
      overallConfidence: 0,
      verificationRate: 0,
      completeness: 0,
      sourcesAnalyzed: [websiteUrl],
      sourceQuality: 'low',
      warnings: ['Extraction failed. Using minimal data. Please add details manually.'],
    };
  }

  /**
   * Extract UVP components with source attribution using AI
   */
  private async extractWithSources(websiteUrl: string, scrapedData: any): Promise<ExtractedUVPData> {
    const prompt = this.buildExtractionPrompt(websiteUrl, scrapedData);

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        provider: 'openrouter',
        model: 'anthropic/claude-sonnet-4-5-20250929',
        messages: [
          {
            role: 'system',
            content: `You are a UVP extraction specialist. Your job is to extract UVP components from website content.

CRITICAL RULES:
1. EVERY extracted item MUST include the source URL and context where it was found
2. NEVER fabricate data - only extract what is ACTUALLY on the website
3. Include confidence scores (0-1) based on how clearly the information is stated
4. If source cannot be determined, DO NOT include the item
5. Be specific - extract exact text, not paraphrased versions

Return JSON only, no markdown.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Low temperature for accuracy
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = JSON.parse(data.choices[0].message.content);

    // Parse AI response into structured data
    return this.parseAIResponse(websiteUrl, aiResponse);
  }

  /**
   * Build comprehensive extraction prompt
   */
  private buildExtractionPrompt(websiteUrl: string, scrapedData: any): string {
    const headings = scrapedData.content.headings.slice(0, 30).join('\n');
    const paragraphs = scrapedData.content.paragraphs.slice(0, 50).join('\n');
    const navigation = scrapedData.structure.navigation.join(', ');

    return `Analyze this website and extract UVP components with SOURCE ATTRIBUTION:

WEBSITE: ${websiteUrl}
TITLE: ${scrapedData.metadata.title}
DESCRIPTION: ${scrapedData.metadata.description}

HEADINGS:
${headings}

CONTENT PARAGRAPHS:
${paragraphs}

NAVIGATION:
${navigation}

Extract the following with MANDATORY source attribution:

Return JSON with this exact structure:
{
  "customerTypes": [
    {
      "text": "exact text from website",
      "confidence": 0.85,
      "category": "demographic|industry|role|business-size|other",
      "sourceUrl": "${websiteUrl}",
      "sourceContext": "Found in 'About Us' section under 'Who We Serve' heading",
      "pageTitle": "About Us | Company Name",
      "sectionHeading": "Who We Serve"
    }
  ],
  "services": [
    {
      "text": "exact service name",
      "confidence": 0.9,
      "type": "service|product|package",
      "category": "Emergency Services",
      "sourceUrl": "${websiteUrl}/services",
      "sourceContext": "Listed in main services navigation",
      "pageTitle": "Services | Company Name",
      "sectionHeading": "Our Services"
    }
  ],
  "problemsSolved": [
    {
      "text": "specific problem they solve",
      "confidence": 0.8,
      "severity": "high|medium|low",
      "sourceUrl": "${websiteUrl}",
      "sourceContext": "Mentioned in hero section",
      "pageTitle": "Home | Company Name",
      "sectionHeading": "The Problem"
    }
  ],
  "testimonials": [
    {
      "text": "full testimonial text",
      "confidence": 0.95,
      "customerName": "John Doe",
      "customerRole": "CEO",
      "customerCompany": "Acme Corp",
      "hasMetrics": true,
      "metrics": [{"text": "increased revenue 40%", "value": 40, "unit": "%"}],
      "sourceUrl": "${websiteUrl}/testimonials",
      "sourceContext": "Featured testimonial on testimonials page",
      "pageTitle": "Testimonials | Company Name",
      "sectionHeading": "What Our Clients Say"
    }
  ],
  "differentiators": [
    {
      "text": "what makes them unique",
      "confidence": 0.85,
      "category": "speed|quality|price|expertise|service|technology|other",
      "isQuantifiable": true,
      "quantification": "24/7 service",
      "sourceUrl": "${websiteUrl}/about",
      "sourceContext": "Listed in 'Why Choose Us' section",
      "pageTitle": "About | Company Name",
      "sectionHeading": "Why Choose Us"
    }
  ]
}

CRITICAL REQUIREMENTS:
- Every item MUST have sourceUrl and sourceContext
- Use actual URLs from the navigation/links where possible
- Extract EXACT text, don't paraphrase
- Confidence based on clarity (explicit statement = 0.9+, implied = 0.6-0.8)
- If you can't determine the source, DON'T include the item
- Maximum 10 items per category`;
  }

  /**
   * Parse AI response into ExtractedUVPData
   */
  private parseAIResponse(websiteUrl: string, aiResponse: any): ExtractedUVPData {
    const now = new Date();

    const customerTypes: CustomerType[] = (aiResponse.customerTypes || []).map((item: any) => ({
      text: item.text,
      confidence: item.confidence,
      category: item.category || 'other',
      source: {
        sourceUrl: item.sourceUrl || websiteUrl,
        sourceContext: item.sourceContext || 'Unknown source',
        extractedAt: now,
        pageTitle: item.pageTitle,
        sectionHeading: item.sectionHeading,
      },
      isVerified: true,
      isUserConfirmed: false,
    }));

    const services: ServiceProduct[] = (aiResponse.services || []).map((item: any) => ({
      text: item.text,
      confidence: item.confidence,
      type: item.type || 'service',
      category: item.category,
      source: {
        sourceUrl: item.sourceUrl || websiteUrl,
        sourceContext: item.sourceContext || 'Unknown source',
        extractedAt: now,
        pageTitle: item.pageTitle,
        sectionHeading: item.sectionHeading,
      },
      isVerified: true,
      isUserConfirmed: false,
    }));

    const problemsSolved: ProblemSolved[] = (aiResponse.problemsSolved || []).map((item: any) => ({
      text: item.text,
      confidence: item.confidence,
      severity: item.severity || 'medium',
      source: {
        sourceUrl: item.sourceUrl || websiteUrl,
        sourceContext: item.sourceContext || 'Unknown source',
        extractedAt: now,
        pageTitle: item.pageTitle,
        sectionHeading: item.sectionHeading,
      },
      isVerified: true,
      isUserConfirmed: false,
    }));

    const testimonials: Testimonial[] = (aiResponse.testimonials || []).map((item: any) => ({
      text: item.text,
      confidence: item.confidence,
      customerName: item.customerName,
      customerRole: item.customerRole,
      customerCompany: item.customerCompany,
      hasMetrics: item.hasMetrics || false,
      metrics: item.metrics,
      rating: item.rating,
      source: {
        sourceUrl: item.sourceUrl || websiteUrl,
        sourceContext: item.sourceContext || 'Unknown source',
        extractedAt: now,
        pageTitle: item.pageTitle,
        sectionHeading: item.sectionHeading,
      },
      isVerified: true,
      isUserConfirmed: false,
    }));

    const differentiators: Differentiator[] = (aiResponse.differentiators || []).map((item: any) => ({
      text: item.text,
      confidence: item.confidence,
      category: item.category || 'other',
      isQuantifiable: item.isQuantifiable || false,
      quantification: item.quantification,
      source: {
        sourceUrl: item.sourceUrl || websiteUrl,
        sourceContext: item.sourceContext || 'Unknown source',
        extractedAt: now,
        pageTitle: item.pageTitle,
        sectionHeading: item.sectionHeading,
      },
      isVerified: true,
      isUserConfirmed: false,
    }));

    return {
      websiteUrl,
      extractedAt: now,
      customerTypes,
      services,
      problemsSolved,
      testimonials,
      differentiators,
      overallConfidence: 0,
      verificationRate: 0,
      completeness: 0,
      sourcesAnalyzed: [websiteUrl],
      sourceQuality: 'medium',
      warnings: [],
    };
  }

  /**
   * Check if item has valid source
   */
  private hasValidSource(item: any): boolean {
    return !!(
      item.source &&
      item.source.sourceUrl &&
      item.source.sourceUrl.startsWith('http') &&
      item.source.sourceContext &&
      item.source.sourceContext !== 'Unknown source'
    );
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(data: ExtractedUVPData): number {
    const allItems = [
      ...data.customerTypes,
      ...data.services,
      ...data.problemsSolved,
      ...data.testimonials,
      ...data.differentiators,
    ];

    if (allItems.length === 0) return 0;

    const totalConfidence = allItems.reduce((sum, item) => sum + item.confidence, 0);
    return totalConfidence / allItems.length;
  }

  /**
   * Calculate verification rate (% with valid sources)
   */
  private calculateVerificationRate(data: ExtractedUVPData): number {
    const allItems = [
      ...data.customerTypes,
      ...data.services,
      ...data.problemsSolved,
      ...data.testimonials,
      ...data.differentiators,
    ];

    if (allItems.length === 0) return 0;

    const verified = allItems.filter((item) => this.hasValidSource(item)).length;
    return verified / allItems.length;
  }

  /**
   * Calculate completeness (% of expected components found)
   */
  private calculateCompleteness(data: ExtractedUVPData): number {
    let found = 0;
    let expected = 5;

    if (data.customerTypes.length > 0) found++;
    if (data.services.length > 0) found++;
    if (data.problemsSolved.length > 0) found++;
    if (data.testimonials.length > 0) found++;
    if (data.differentiators.length > 0) found++;

    return found / expected;
  }

  /**
   * Assess overall source quality
   */
  private assessSourceQuality(data: ExtractedUVPData): 'high' | 'medium' | 'low' {
    const verificationRate = data.verificationRate;
    const confidence = data.overallConfidence;

    if (verificationRate >= 0.9 && confidence >= 0.8) return 'high';
    if (verificationRate >= 0.7 && confidence >= 0.6) return 'medium';
    return 'low';
  }

  /**
   * Create structured error
   */
  private createError(type: 'network' | 'parsing' | 'verification' | 'ai' | 'unknown', error: any): UVPExtractionError {
    return {
      type,
      message: error.message || 'Unknown error',
      details: error,
    };
  }
}

export const smartUVPExtractor = new SmartUVPExtractor();
