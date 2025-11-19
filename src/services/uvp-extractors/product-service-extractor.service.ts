/**
 * Product/Service Extractor Service
 *
 * Extracts products and services from website content using Claude API.
 * CRITICAL: Only extracts explicitly mentioned offerings - never suggests or infers.
 *
 * Features:
 * - Claude Sonnet 4.5 analysis
 * - Intelligent categorization (Core Services, Products, Add-ons, Packages)
 * - Evidence-based extraction with exact quotes
 * - Confidence scoring based on explicitness
 * - Source URL tracking
 * - Error handling with fallbacks
 *
 * Created: 2025-11-18 (Track C - Product/Service Extraction)
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  ProductServiceExtractionResult,
  ProductService,
} from '@/types/uvp-flow.types';
import type { ConfidenceScore } from '@/components/onboarding-v5/ConfidenceMeter';
import type { DataSource } from '@/components/onboarding-v5/SourceCitation';

/**
 * Extract products and services from website content
 *
 * @param websiteContent - Array of content strings from website pages
 * @param websiteUrls - Array of URLs corresponding to content
 * @param businessName - Name of the business
 * @returns Structured extraction result with products, categories, confidence
 *
 * @example
 * const result = await extractProductsServices(
 *   ['Homepage content...', 'Services page content...'],
 *   ['https://example.com', 'https://example.com/services'],
 *   'Acme Corp'
 * );
 */
export async function extractProductsServices(
  websiteContent: string[],
  websiteUrls: string[],
  businessName: string
): Promise<ProductServiceExtractionResult> {
  console.log('[ProductServiceExtractor] Starting extraction...');
  console.log(`  Business: ${businessName}`);
  console.log(`  Pages: ${websiteContent.length}`);

  // Get API key from environment
  const apiKey = import.meta?.env?.VITE_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Anthropic API key not found. Set VITE_ANTHROPIC_API_KEY or ANTHROPIC_API_KEY.');
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    // Combine website content with source attribution
    const combinedContent = websiteContent
      .map((content, index) => {
        const url = websiteUrls[index] || 'unknown';
        return `[SOURCE: ${url}]\n${content}\n`;
      })
      .join('\n---\n');

    // Call Claude to extract products/services
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      temperature: 0.1, // Low temperature for factual extraction
      messages: [
        {
          role: 'user',
          content: buildExtractionPrompt(businessName, combinedContent),
        },
      ],
    });

    // Parse Claude's response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const extractionData = parseClaudeResponse(responseText, websiteUrls);

    // Calculate overall confidence
    const overallConfidence = calculateOverallConfidence(extractionData.products);

    // Create data sources
    const sources: DataSource[] = websiteUrls.map((url, index) => ({
      id: `source-${index}`,
      type: determineSourceType(url),
      name: url.split('/').pop() || 'homepage',
      url,
      extractedAt: new Date(),
      reliability: 90, // High reliability for direct website content
      dataPoints: extractionData.products.filter((p) =>
        p.sourceUrl?.includes(url)
      ).length,
      excerpt: websiteContent[index]?.slice(0, 200),
    }));

    console.log('[ProductServiceExtractor] Extraction complete');
    console.log(`  Products/Services found: ${extractionData.products.length}`);
    console.log(`  Categories: ${extractionData.categories.length}`);
    console.log(`  Overall confidence: ${overallConfidence.overall}%`);

    return {
      products: extractionData.products,
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
        sourceCount: websiteUrls.length,
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
 * Instructs to ONLY extract explicitly mentioned offerings
 */
function buildExtractionPrompt(businessName: string, content: string): string {
  return `You are analyzing the website content for "${businessName}" to extract their products and services.

**CRITICAL INSTRUCTIONS:**
1. ONLY extract products/services that are EXPLICITLY mentioned
2. DO NOT suggest, infer, or hallucinate offerings not found
3. Provide exact quotes as evidence for each finding
4. Score confidence based on how explicitly each offering is stated:
   - 100 = Clearly listed in navigation, pricing table, or dedicated section
   - 80-90 = Mentioned multiple times with details
   - 60-79 = Mentioned once with some detail
   - 40-59 = Mentioned in passing or implied
   - 0-39 = Not confident / too vague
5. Categorize offerings into logical groups (e.g., Core Services, Products, Add-ons, Packages)
6. If you find NOTHING explicit, return an empty array - DO NOT MAKE UP OFFERINGS

**WEBSITE CONTENT:**
${content}

**OUTPUT FORMAT (JSON only, no markdown):**
{
  "products": [
    {
      "name": "Exact name of product/service",
      "description": "Brief description (from website)",
      "category": "Category name (Core Services, Products, Add-ons, etc.)",
      "confidence": 85,
      "sourceExcerpt": "Exact quote from website showing this offering",
      "sourceUrl": "URL where this was found (from [SOURCE: ...] tags)",
      "reasoning": "Why this confidence score (e.g., 'Listed in main navigation and pricing table')"
    }
  ],
  "categories": ["Core Services", "Products", "Add-ons"],
  "totalFound": 5,
  "extractionQuality": "excellent | good | fair | poor",
  "warnings": ["Any issues encountered, or empty array if none"]
}

Extract the products and services now. Remember: ONLY what you explicitly find.`;
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
