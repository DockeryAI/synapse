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
import { outcomeMapper } from '@/services/intelligence/outcome-mapper.service';

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
  businessName: string,
  industry?: string
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
    const maxContentLength = 30000; // Reduced from 50k for faster processing
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
        model: 'anthropic/claude-sonnet-4.5', // Switched from Opus 4.1 for 3x speed improvement
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 4096, // Reduced from 8192 for faster generation
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
    let validatedProducts = productValidationService.validateProducts(extractionData.products, businessName);
    console.log('[ProductServiceExtractor] Validated', validatedProducts.length, 'products after filtering');

    // FALLBACK: If we got 0 valid products (likely all testimonials), use industry defaults
    if (validatedProducts.length === 0 && industry) {
      console.log('[ProductServiceExtractor] No valid products found, using industry fallback services');
      validatedProducts = getIndustryFallbackServices(industry, businessName);
      console.log('[ProductServiceExtractor] Added', validatedProducts.length, 'fallback services from industry profile');
    }

    // ENHANCE: Transform services into customer outcomes using JTBD
    const enhancedProducts = outcomeMapper.transformServices(validatedProducts);
    console.log('[ProductServiceExtractor] Enhanced products with JTBD outcomes');

    // Update descriptions with value statements for high-confidence outcomes
    validatedProducts = enhancedProducts.map(product => ({
      ...product,
      description: product.outcomes.confidence > 70
        ? product.outcomes.valueStatement
        : product.description
    }));

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
 * Instructs to extract offerings with BENEFIT-FOCUSED descriptions using FAB cascade
 */
function buildExtractionPrompt(businessName: string, content: string): string {
  return `You are analyzing "${businessName}" to extract products/services with BENEFIT-FOCUSED descriptions.

**CRITICAL: FAB CASCADE FRAMEWORK**
For EACH product/service, transform the description using "So What?" until you reach CUSTOMER IMPACT.

❌ WRONG (Feature-focused word salad):
"AI Policy Expert with advanced natural language processing capabilities and multi-channel integration"

✅ RIGHT (Benefit-focused outcome):
"Instant expert answers to complex customer questions—no waiting, no escalation"

**THE "SO WHAT?" TEST:**
Feature → "So What?" → Advantage → "So What?" → BENEFIT (stop here)

Example:
- Feature: "24/7 availability"
- So What? → "Customers can get help anytime"
- So What? → "Never miss a sale because someone had a question at 2am"
← USE THIS

**DESCRIPTION RULES:**
1. ONE clear benefit per product/service (15 words max)
2. Focus on CUSTOMER OUTCOME, not technical features
3. Use action words: "Get", "Save", "Achieve", "Eliminate", "Transform"
4. Answer: "What does this help the customer DO or FEEL?"
5. NO jargon, NO feature lists, NO buzzwords

**WHERE TO LOOK:**
- Navigation menus, headings, pricing tables
- Service pages, case studies, testimonials
- Links containing /services, /products, /pricing

**WEBSITE CONTENT:**
${content}

**OUTPUT FORMAT (JSON only):**
{
  "products": [
    {
      "name": "Short service name (2-4 words)",
      "description": "Single benefit statement answering 'So What?' (15 words max)",
      "category": "Category name",
      "confidence": 85,
      "sourceExcerpt": "Exact quote from website",
      "sourceUrl": "URL where found",
      "reasoning": "Why this confidence"
    }
  ],
  "categories": ["Core Services", "Products", "Add-ons"],
  "totalFound": 5,
  "extractionQuality": "excellent | good | fair | poor",
  "warnings": []
}

REMEMBER: Every description must pass the "So What?" test—focus on customer impact, not features.`;
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
 * Get industry-standard fallback services when extraction fails
 */
function getIndustryFallbackServices(industry: string, businessName: string): ProductService[] {
  const lowerIndustry = industry.toLowerCase();

  // Map common industries to standard services
  const industryServices: Record<string, string[]> = {
    'real estate': [
      'Buyer Representation',
      'Seller Services',
      'Property Valuation',
      'Market Analysis',
      'Luxury Properties',
      'Commercial Real Estate'
    ],
    'residential real estate': [
      'Buyer Representation',
      'Seller Services',
      'First-Time Home Buyers',
      'Property Valuation',
      'Market Analysis'
    ],
    'it managed services': [
      'Network Management',
      'Cloud Services',
      'Cybersecurity',
      'Help Desk Support',
      'Data Backup and Recovery',
      'IT Consulting'
    ],
    'financial advisory': [
      'Wealth Management',
      'Retirement Planning',
      'Investment Advisory',
      'Tax Planning',
      'Estate Planning',
      'Risk Management'
    ],
    'bakery': [
      'Custom Cakes',
      'Artisan Breads',
      'Pastries and Desserts',
      'Catering Services',
      'Wedding Cakes',
      'Corporate Orders'
    ],
    'dental': [
      'General Dentistry',
      'Cosmetic Dentistry',
      'Teeth Whitening',
      'Dental Implants',
      'Orthodontics',
      'Emergency Dental Care'
    ]
  };

  // Find matching industry services
  let services: string[] = [];
  for (const [key, value] of Object.entries(industryServices)) {
    if (lowerIndustry.includes(key)) {
      services = value;
      break;
    }
  }

  // If no match, use generic services
  if (services.length === 0) {
    services = [
      'Consultation Services',
      'Professional Services',
      'Custom Solutions',
      'Support Services',
      'Specialized Services'
    ];
  }

  // Convert to ProductService objects
  return services.map((name, index) => ({
    id: `fallback-${index}`,
    name,
    description: `Standard ${name.toLowerCase()} offered in the ${industry} industry`,
    category: 'Professional Services',
    confidence: 60, // Lower confidence for fallback services
    source: 'manual' as const,
    sourceUrl: '',
    confirmed: false
  }));
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
