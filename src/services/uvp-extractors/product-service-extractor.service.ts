/**
 * Product/Service Extractor Service
 *
 * Extracts products and services from website content using Claude API.
 * CRITICAL: Only extracts explicitly mentioned offerings - never suggests or infers.
 *
 * Features:
 * - Claude Sonnet 3.5 analysis via Supabase Edge Function
 * - Intelligent categorization (Core Services, Products, Add-ons, Packages)
 * - Evidence-based extraction with exact quotes
 * - Confidence scoring based on explicitness
 * - Source URL tracking
 * - Error handling with fallbacks
 *
 * Created: 2025-11-18 (Track C - Product/Service Extraction)
 */

import type {
  ProductServiceExtractionResult,
  ProductService,
  ConfidenceScore
} from '@/types/uvp-flow.types';
import type { DataSource } from '@/components/onboarding-v5/SourceCitation';
import type { WebsiteData } from '@/services/scraping/websiteScraper';
import { productValidationService } from '@/services/intelligence/product-validation.service';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Extract products and services from website content
 *
 * ENHANCED VERSION: Now accepts full WebsiteData for comprehensive extraction
 * including navigation menus, links, and page structure
 *
 * @param websiteDataOrContent - WebsiteData object OR array of content strings (backward compatible)
 * @param websiteUrls - Array of URLs corresponding to content (optional if WebsiteData provided)
 * @param businessName - Name of the business
 * @returns Structured extraction result with products, categories, confidence
 *
 * @example
 * // New way (recommended): Pass full WebsiteData
 * const result = await extractProductsServices(scrapedData, [], 'Acme Corp');
 *
 * // Old way (backward compatible): Pass content arrays
 * const result = await extractProductsServices(
 *   ['Homepage content...', 'Services page content...'],
 *   ['https://example.com', 'https://example.com/services'],
 *   'Acme Corp'
 * );
 */
export async function extractProductsServices(
  websiteDataOrContent: WebsiteData | string[],
  websiteUrls: string[],
  businessName: string
): Promise<ProductServiceExtractionResult> {
  console.log('[ProductServiceExtractor] Starting extraction...');
  console.log(`  Business: ${businessName}`);

  // Detect input type and prepare comprehensive content
  const isWebsiteData = !Array.isArray(websiteDataOrContent);
  let websiteContent: string[];
  let finalUrls: string[];

  if (isWebsiteData) {
    const data = websiteDataOrContent as WebsiteData;
    console.log('[ProductServiceExtractor] Using enhanced WebsiteData extraction');

    // Extract ALL available content sources
    websiteContent = [
      // Navigation menus (products/services often listed here)
      `NAVIGATION MENU:\n${data.structure.navigation.join('\n')}`,

      // Page sections
      `PAGE SECTIONS:\n${data.structure.sections.join('\n')}`,

      // Headings (service/product titles)
      `HEADINGS:\n${data.content.headings.join('\n')}`,

      // Main content
      `CONTENT:\n${data.content.paragraphs.join('\n\n')}`,

      // Links (often contain /services, /products, /pricing)
      `LINKS:\n${data.content.links.filter(link =>
        link.toLowerCase().includes('service') ||
        link.toLowerCase().includes('product') ||
        link.toLowerCase().includes('pricing') ||
        link.toLowerCase().includes('plan')
      ).join('\n')}`,

      // Metadata
      `METADATA:\nTitle: ${data.metadata.title}\nDescription: ${data.metadata.description}\nKeywords: ${data.metadata.keywords.join(', ')}`
    ].filter(section => section.length > 20); // Only include sections with content

    finalUrls = [data.url];
    console.log('[ProductServiceExtractor] Extracted from', websiteContent.length, 'content sources');
  } else {
    // Legacy mode: array of content strings
    console.log('[ProductServiceExtractor] Using legacy content array extraction');
    websiteContent = websiteDataOrContent as string[];
    finalUrls = websiteUrls;
  }

  console.log(`  Content sections: ${websiteContent.length}`);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[ProductServiceExtractor] No Supabase configuration - returning empty result');
    return createEmptyResult();
  }

  try {
    // Combine website content with source attribution
    // Ensure we include substantial content for analysis
    const combinedContent = websiteContent
      .map((content, index) => {
        const url = finalUrls[index] || finalUrls[0] || 'unknown';
        // Clean and normalize content
        const cleanContent = content
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/\n{3,}/g, '\n\n') // Reduce excessive newlines
          .trim();
        return `[SOURCE: ${url}]\n${cleanContent}\n`;
      })
      .join('\n---\n');

    // Log content size for debugging
    console.log(`[ProductServiceExtractor] Combined content length: ${combinedContent.length} chars`);

    // Truncate if too long (Claude context limit), but keep as much as possible
    const maxContentLength = 50000; // ~12k tokens
    const truncatedContent = combinedContent.length > maxContentLength
      ? combinedContent.substring(0, maxContentLength) + '\n\n[Content truncated for length]'
      : combinedContent;

    if (combinedContent.length > maxContentLength) {
      console.warn(`[ProductServiceExtractor] Content truncated from ${combinedContent.length} to ${maxContentLength} chars`);
    }

    const prompt = buildExtractionPrompt(businessName, truncatedContent);

    // Call Claude via Supabase Edge Function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'openrouter',
        model: 'anthropic/claude-3.5-sonnet',
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 8192, // Increased for comprehensive extraction
        temperature: 0.2 // Slightly higher for better coverage
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ProductServiceExtractor] AI proxy error:', errorText);
      return createEmptyResult();
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';
    const extractionData = parseClaudeResponse(responseText, finalUrls);

    console.log('[ProductServiceExtractor] Extracted', extractionData.products.length, 'products before validation');

    // Validate products to remove garbage
    const validatedProducts = productValidationService.validateProducts(extractionData.products, businessName);
    console.log('[ProductServiceExtractor] Validated', validatedProducts.length, 'products after filtering');

    // Calculate overall confidence
    const overallConfidence = calculateOverallConfidence(validatedProducts);

    // Create data sources
    const sources: DataSource[] = finalUrls.map((url, index) => ({
      id: `source-${index}`,
      type: determineSourceType(url),
      name: url.split('/').pop() || 'homepage',
      url,
      extractedAt: new Date(),
      reliability: 90, // High reliability for direct website content
      dataPoints: validatedProducts.filter((p) =>
        p.sourceUrl?.includes(url)
      ).length,
      excerpt: websiteContent[index]?.slice(0, 200),
    }));

    console.log('[ProductServiceExtractor] Extraction complete');
    console.log(`  Products/Services found: ${validatedProducts.length}`);
    console.log(`  Categories: ${extractionData.categories.length}`);
    console.log(`  Overall confidence: ${overallConfidence.overall}%`);

    return {
      products: validatedProducts,
      categories: extractionData.categories,
      confidence: overallConfidence,
      sources,
      extractionTimestamp: new Date(),
    };
  } catch (error) {
    console.error('[ProductServiceExtractor] Extraction failed:', error);

    // Return graceful failure with empty results
    return {
      products: [],
      categories: [],
      confidence: {
        overall: 0,
        dataQuality: 0,
        sourceCount: finalUrls.length,
        modelAgreement: 0,
        reasoning: `Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      sources: [],
      extractionTimestamp: new Date(),
    };
  }
}

/**
 * Build the extraction prompt for Claude
 * Instructs to extract ALL explicitly mentioned offerings comprehensively
 */
function buildExtractionPrompt(businessName: string, content: string): string {
  return `You are analyzing the website content for "${businessName}" to extract ALL their products and services.

**YOUR GOAL: Find EVERY product and service mentioned on this website.**

**EXTRACTION INSTRUCTIONS:**
1. Extract ALL products, services, packages, plans, add-ons, and offerings mentioned
2. Be THOROUGH - scan every section including navigation, headers, lists, pricing tables, service descriptions
3. Include variations and tiers (e.g., Basic Plan, Pro Plan, Enterprise)
4. Include add-ons, upgrades, and supplementary services
5. Include both standalone items AND items mentioned in packages
6. Look for offerings in: navigation menus, headings, bullet lists, pricing tables, service pages, case studies
7. Provide exact quotes as evidence for each finding

**WHERE TO LOOK (prioritize these sources):**
- NAVIGATION MENU: Services/products are often listed in main navigation
- PAGE SECTIONS: Dedicated service/product sections
- HEADINGS: Look for H1, H2, H3 that name specific offerings
- PRICING TABLES: Tiers, plans, packages with pricing
- LINKS: URLs containing /services, /products, /pricing, /plans
- TESTIMONIALS/CASE STUDIES: Services mentioned in customer stories
- FOOTER: Additional services often listed here
- METADATA: Title and description may summarize offerings

**DON'T MISS:**
- Hidden tiers mentioned only in pricing comparisons
- Add-ons mentioned in fine print
- Seasonal or limited-time products
- Industry-specific services (use technical terminology from the site)
- Bundled offerings (extract individual components)
- Consultation/custom services mentioned separately

**CONFIDENCE SCORING:**
- 100 = Clearly listed in navigation, pricing table, or dedicated section
- 80-90 = Mentioned multiple times with details
- 60-79 = Mentioned once with some detail
- 40-59 = Mentioned in passing

**CATEGORIZATION:**
Group offerings into logical categories such as:
- Core Services (main offerings)
- Products (physical or digital products)
- Packages/Plans (bundled offerings with tiers)
- Add-ons/Upgrades (supplementary services)
- Specializations (niche services)

**WEBSITE CONTENT:**
${content}

**OUTPUT FORMAT (JSON only, no markdown):**
{
  "products": [
    {
      "name": "Exact name of product/service",
      "description": "Brief description (from website)",
      "category": "Category name",
      "confidence": 85,
      "sourceExcerpt": "Exact quote from website showing this offering",
      "sourceUrl": "URL where this was found",
      "reasoning": "Why this confidence score"
    }
  ],
  "categories": ["Core Services", "Products", "Add-ons"],
  "totalFound": 5,
  "extractionQuality": "excellent | good | fair | poor",
  "warnings": []
}

BE COMPREHENSIVE. Extract ALL offerings you can find. It's better to include something borderline than to miss a real product/service.`;
}

/**
 * Parse Claude's JSON response
 */
function parseClaudeResponse(responseText: string, websiteUrls: string[]): {
  products: ProductService[];
  categories: string[];
} {
  try {
    // Extract JSON from response (handles markdown code blocks)
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
                      responseText.match(/(\{[\s\S]*\})/);

    if (!jsonMatch) {
      console.warn('[ProductServiceExtractor] No JSON found in response');
      return { products: [], categories: [] };
    }

    const parsedData = JSON.parse(jsonMatch[1]);

    // Transform to ProductService format
    const products: ProductService[] = (parsedData.products || []).map((item: any, index: number) => ({
      id: `product-${Date.now()}-${index}`,
      name: item.name || 'Unknown',
      description: item.description || '',
      category: item.category || 'Uncategorized',
      confidence: item.confidence || 50,
      source: 'website' as const,
      sourceUrl: item.sourceUrl || websiteUrls[0],
      sourceExcerpt: item.sourceExcerpt || '',
      confirmed: false, // User hasn't confirmed yet
    }));

    const categories = parsedData.categories || [];

    return { products, categories };
  } catch (error) {
    console.error('[ProductServiceExtractor] Failed to parse response:', error);
    console.error('Response text:', responseText);
    return { products: [], categories: [] };
  }
}

/**
 * Calculate overall confidence score
 */
function calculateOverallConfidence(products: ProductService[]): ConfidenceScore {
  if (products.length === 0) {
    return {
      overall: 0,
      dataQuality: 0,
      sourceCount: 0,
      modelAgreement: 0,
      reasoning: 'No products or services found',
    };
  }

  // Average product confidence
  const avgConfidence = products.reduce((sum, p) => sum + p.confidence, 0) / products.length;

  // Data quality based on number of products and detail
  const hasDescriptions = products.filter((p) => p.description.length > 20).length;
  const dataQuality = Math.round((hasDescriptions / products.length) * 100);

  // Source count (unique URLs)
  const uniqueSources = new Set(products.map((p) => p.sourceUrl).filter(Boolean)).size;

  // Model agreement (based on confidence distribution)
  const highConfidence = products.filter((p) => p.confidence >= 80).length;
  const modelAgreement = Math.round((highConfidence / products.length) * 100);

  return {
    overall: Math.round(avgConfidence),
    dataQuality,
    sourceCount: uniqueSources,
    modelAgreement,
    reasoning: `Found ${products.length} offerings with ${highConfidence} high-confidence items`,
  };
}

/**
 * Determine source type from URL
 */
function determineSourceType(url: string): DataSource['type'] {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('/services') || lowerUrl.includes('/service')) return 'services';
  if (lowerUrl.includes('/products') || lowerUrl.includes('/product')) return 'website';
  if (lowerUrl.includes('/pricing') || lowerUrl.includes('/plans')) return 'website';
  if (lowerUrl.includes('/about')) return 'about';
  if (lowerUrl.includes('/testimonial')) return 'testimonials';

  return 'website';
}

/**
 * Create an empty result for cases where extraction fails or config is missing
 */
function createEmptyResult(): ProductServiceExtractionResult {
  return {
    products: [],
    categories: [],
    confidence: {
      overall: 50,
      dataQuality: 0,
      sourceCount: 0,
      modelAgreement: 50
    },
    sources: [],
    extractionTimestamp: new Date()
  };
}

/**
 * Singleton instance for convenience
 */
class ProductServiceExtractorService {
  async extract(
    websiteContent: string[],
    websiteUrls: string[],
    businessName: string
  ): Promise<ProductServiceExtractionResult> {
    return extractProductsServices(websiteContent, websiteUrls, businessName);
  }
}

export const productServiceExtractorService = new ProductServiceExtractorService();
export default productServiceExtractorService;
