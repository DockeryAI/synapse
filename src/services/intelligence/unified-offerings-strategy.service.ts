/**
 * Unified Offerings & Strategy Service
 *
 * CONSOLIDATION: Merges product-service-extractor + differentiator-extractor into ONE AI call
 *
 * This service extracts ALL offerings and strategy data in a single prompt:
 * - Products and services with categories, descriptions, pricing
 * - Differentiators with philosophy, beliefs, contrarian approaches
 * - Methodology and proprietary approaches
 * - Source evidence and confidence levels
 *
 * Performance target: ~15-20 seconds (vs 40-60 seconds for 2 separate calls)
 *
 * Created: 2025-11-25
 */

import type {
  ProductServiceExtractionResult,
  ProductService,
  DifferentiatorExtractionResult,
  Differentiator,
  ConfidenceScore,
  DataSource
} from '@/types/uvp-flow.types';
import type { WebsiteData } from '@/services/scraping/websiteScraper';
import { productValidationService } from '@/services/intelligence/product-validation.service';
import { outcomeMapper } from '@/services/intelligence/outcome-mapper.service';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Combined result from unified extraction
 */
export interface UnifiedOfferingsResult {
  // Products and services
  products: ProductServiceExtractionResult;

  // Differentiators and strategy
  differentiators: DifferentiatorExtractionResult;
}

/**
 * Raw unified extraction from Claude
 */
interface RawUnifiedOfferingsExtraction {
  // Products and services
  products: {
    name: string;
    description: string;
    category: string;
    confidence: number;
    sourceExcerpt: string;
    sourceUrl?: string;
    features?: string[];
    pricing?: {
      amount?: string;
      frequency?: string;
      tier?: string;
    };
  }[];
  categories: string[];

  // Differentiators
  differentiators: {
    statement: string;
    evidence: string;
    source_url?: string;
    strength_score: number;
    category: 'philosophy' | 'methodology' | 'proprietary_approach' | 'unique_feature' | 'contrarian' | 'other';
  }[];
  methodology?: {
    description: string;
    evidence: string;
    source_url?: string;
  };
  proprietary_approach?: {
    description: string;
    evidence: string;
    source_url?: string;
  };

  // Quality indicators
  extraction_quality: 'excellent' | 'good' | 'fair' | 'poor';
  products_confidence: 'high' | 'medium' | 'low';
  differentiators_confidence: 'high' | 'medium' | 'low';
  warnings: string[];
}

class UnifiedOfferingsStrategyService {
  /**
   * Extract all offerings and strategy data in ONE AI call
   * Replaces: extractProductsServices + extractDifferentiators
   */
  async extractUnifiedOfferings(
    websiteData: WebsiteData | string[],
    websiteUrls: string[],
    businessName: string,
    industry?: string
  ): Promise<UnifiedOfferingsResult> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('[UnifiedOfferings] No Supabase configuration - returning empty result');
      return this.createEmptyResult(websiteUrls);
    }

    const startTime = Date.now();

    try {
      console.log('[UnifiedOfferings] Starting unified offerings extraction for:', businessName);

      // Prepare comprehensive content
      const { content, finalUrls } = this.prepareContentForAnalysis(websiteData, websiteUrls);

      // Single AI call for all offerings data
      const rawExtraction = await this.analyzeWithClaude(content, businessName, industry, finalUrls);

      // Transform and validate products
      let products = this.transformToProducts(rawExtraction, finalUrls);
      products = productValidationService.validateProducts(products, businessName);

      // Apply JTBD outcome transformation to products
      const enhancedProducts = outcomeMapper.transformServices(products);
      products = enhancedProducts.map(product => ({
        ...product,
        description: product.outcomes?.confidence > 70
          ? product.outcomes.valueStatement
          : product.description
      }));

      // If no products found, use industry fallback
      if (products.length === 0 && industry) {
        console.log('[UnifiedOfferings] Using industry fallback services');
        products = this.getIndustryFallbackServices(industry, businessName);
      }

      // Transform differentiators
      const differentiators = this.transformToDifferentiators(rawExtraction, finalUrls, businessName, industry);

      // Calculate confidences
      const productsConfidence = this.calculateProductsConfidence(products);
      const differentiatorsConfidence = this.calculateDifferentiatorsConfidence(
        rawExtraction,
        differentiators.differentiators
      );

      // Build sources
      const productSources = this.buildProductSources(finalUrls, products);

      const duration = Date.now() - startTime;
      console.log(`[UnifiedOfferings] Extraction complete in ${duration}ms:`);
      console.log(`  - Products found: ${products.length}`);
      console.log(`  - Differentiators found: ${differentiators.differentiators.length}`);
      console.log(`  - Methodology: ${differentiators.methodology ? 'Yes' : 'No'}`);

      return {
        products: {
          products,
          categories: rawExtraction.categories || [],
          confidence: productsConfidence,
          sources: productSources,
          extractionTimestamp: new Date()
        },
        differentiators: {
          ...differentiators,
          confidence: differentiatorsConfidence
        }
      };

    } catch (error) {
      console.error('[UnifiedOfferings] Extraction failed:', error);
      return this.createEmptyResult(websiteUrls);
    }
  }

  /**
   * Prepare content for analysis (handles both WebsiteData and string[] inputs)
   */
  private prepareContentForAnalysis(
    websiteDataOrContent: WebsiteData | string[],
    websiteUrls: string[]
  ): { content: string; finalUrls: string[] } {
    const isWebsiteData = !Array.isArray(websiteDataOrContent);
    let contentParts: string[] = [];
    let finalUrls: string[] = [];

    if (isWebsiteData) {
      const data = websiteDataOrContent as WebsiteData;
      contentParts = [
        `NAVIGATION MENU:\n${data.structure.navigation.join('\n')}`,
        `PAGE SECTIONS:\n${data.structure.sections.join('\n')}`,
        `HEADINGS:\n${data.content.headings.join('\n')}`,
        `CONTENT:\n${data.content.paragraphs.join('\n\n')}`,
        `LINKS:\n${data.content.links.filter(link =>
          link.toLowerCase().includes('service') ||
          link.toLowerCase().includes('product') ||
          link.toLowerCase().includes('pricing') ||
          link.toLowerCase().includes('plan')
        ).join('\n')}`,
        `METADATA:\nTitle: ${data.metadata.title}\nDescription: ${data.metadata.description}\nKeywords: ${data.metadata.keywords.join(', ')}`
      ].filter(section => section.length > 20);
      finalUrls = [data.url];
    } else {
      contentParts = websiteDataOrContent as string[];
      finalUrls = websiteUrls;
    }

    // Combine with source attribution
    const content = contentParts
      .map((contentPart, index) => {
        const url = finalUrls[index] || finalUrls[0] || 'unknown';
        const clean = contentPart.replace(/\s+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
        return `[SOURCE: ${url}]\n${clean}\n`;
      })
      .join('\n---\n');

    // Truncate if needed
    const maxLength = 25000;
    const truncated = content.length > maxLength
      ? content.substring(0, maxLength) + '\n[Content truncated]'
      : content;

    return { content: truncated, finalUrls };
  }

  /**
   * Single AI call to extract all offerings and strategy data
   */
  private async analyzeWithClaude(
    content: string,
    businessName: string,
    industry?: string,
    urls?: string[]
  ): Promise<RawUnifiedOfferingsExtraction> {
    const industryContext = industry ? `\nINDUSTRY: ${industry}` : '';
    const isBakery = industry?.toLowerCase().includes('bakery') ||
                     industry?.toLowerCase().includes('food') ||
                     industry?.toLowerCase().includes('cafe');

    const prompt = `You are an expert business analyst extracting COMPREHENSIVE product/service offerings AND strategic differentiators from website content.

BUSINESS: ${businessName}${industryContext}
URL: ${urls?.[0] || 'unknown'}

YOUR TASK: Extract ALL products/services AND differentiators in ONE comprehensive analysis.

=== PART 1: PRODUCTS & SERVICES ===

Extract ALL offerings mentioned:
- Products, services, packages, plans, add-ons, tiers
- Look in: navigation menus, headings, bullet lists, pricing tables, service pages
- Include pricing info if available
- Be thorough - include everything mentioned

CONFIDENCE SCORING FOR PRODUCTS:
- 100: Clearly in navigation/pricing/dedicated section
- 80-90: Mentioned multiple times with details
- 60-79: Mentioned once with some detail
- 40-59: Mentioned in passing

CATEGORIZE INTO:
- Core Services (main offerings)
- Products (physical or digital)
- Packages/Plans (bundled with tiers)
- Add-ons/Upgrades (supplementary)
- Specializations (niche services)

=== PART 2: DIFFERENTIATORS ===

Extract BELIEFS, PHILOSOPHY, and UNIQUE APPROACHES:

PRIORITY ORDER:
1. BELIEFS & PHILOSOPHY (90-100 score):
   - "We believe [customers] deserve..."
   - "Our philosophy is..."
   - Statements about what customers deserve

2. CUSTOMER TRANSFORMATIONS (80-89 score):
   - Life changes customers experience
   - "So you can..." statements
   - Emotional outcomes: peace of mind, confidence

3. CONTRARIAN APPROACHES (70-79 score):
   - "Unlike traditional [industry]..."
   - "Instead of [norm], we [different]"

4. SPECIFIC OUTCOMES (60-69 score):
   - Measurable life/business changes

IGNORE (score 40 or below):
- Just tools/software mentioned
- Just credentials/certifications
- Just years of experience
- Generic claims ("comprehensive", "proven")

=== CONTENT TO ANALYZE ===
${content}

=== OUTPUT FORMAT (JSON only, no markdown) ===
{
  "products": [
    {
      "name": "Product/Service Name",
      "description": "Brief description from website",
      "category": "Core Services",
      "confidence": 85,
      "sourceExcerpt": "Exact quote from website",
      "sourceUrl": "https://...",
      "features": ["Feature 1", "Feature 2"],
      "pricing": {
        "amount": "$99",
        "frequency": "monthly",
        "tier": "Professional"
      }
    }
  ],
  "categories": ["Core Services", "Add-ons", "Packages"],
  "differentiators": [
    {
      "statement": "We believe first-generation wealth creators shouldn't sacrifice their health for success",
      "evidence": "EXACT quote from website: [copy quote]",
      "source_url": "https://...",
      "strength_score": 95,
      "category": "philosophy"
    }
  ],
  "methodology": {
    "description": "Named methodology if mentioned",
    "evidence": "Exact quote naming it",
    "source_url": "https://..."
  },
  "proprietary_approach": {
    "description": "Proprietary process/framework if mentioned",
    "evidence": "Exact quote",
    "source_url": "https://..."
  },
  "extraction_quality": "excellent",
  "products_confidence": "high",
  "differentiators_confidence": "high",
  "warnings": []
}

${isBakery ? `
BAKERY-SPECIFIC GUIDANCE:
- Products: breads, pastries, cakes, catering packages, custom orders
- Differentiators: artisan methods, local ingredients, family recipes, freshness commitment
- Look for beliefs about quality, community, tradition
` : ''}

REMEMBER:
- Extract EVERY product/service mentioned
- Prioritize PHILOSOPHY and BELIEFS for differentiators
- Use EXACT quotes as evidence
- Score differentiators based on philosophy vs just features`;

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: 'openrouter',
          model: 'anthropic/claude-sonnet-4.5',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 8000,
          temperature: 0.2
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[UnifiedOfferings] Claude API error:', response.status, errorText);
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.choices?.[0]?.message?.content || '';

      // Parse JSON
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
                        responseText.match(/(\{[\s\S]*\})/);

      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      return JSON.parse(jsonMatch[1]);

    } catch (error) {
      console.error('[UnifiedOfferings] Claude analysis failed:', error);
      throw error;
    }
  }

  /**
   * Transform raw products to ProductService format
   */
  private transformToProducts(raw: RawUnifiedOfferingsExtraction, urls: string[]): ProductService[] {
    return (raw.products || []).map((item, index) => ({
      id: `product-${Date.now()}-${index}`,
      name: item.name || 'Unknown',
      description: item.description || '',
      category: item.category || 'Uncategorized',
      confidence: item.confidence || 50,
      source: 'website' as const,
      sourceUrl: item.sourceUrl || urls[0],
      sourceExcerpt: item.sourceExcerpt || '',
      confirmed: false
    }));
  }

  /**
   * Transform raw differentiators to DifferentiatorExtractionResult format
   */
  private transformToDifferentiators(
    raw: RawUnifiedOfferingsExtraction,
    urls: string[],
    businessName?: string,
    industry?: string
  ): Omit<DifferentiatorExtractionResult, 'confidence'> {
    let differentiators: Differentiator[] = (raw.differentiators || []).map((diff, index) => {
      const source: DataSource = {
        id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'website',
        name: 'Website Content',
        url: diff.source_url || urls[0] || '',
        extractedAt: new Date(),
        reliability: diff.strength_score,
        dataPoints: 1
      };

      return {
        id: `diff-${Date.now()}-${index}`,
        statement: diff.statement,
        evidence: diff.evidence,
        source,
        strengthScore: diff.strength_score
      };
    });

    // Check quality and generate fallback if needed
    const hasQualityDifferentiators = differentiators.some(d => d.strengthScore >= 70);
    if (!hasQualityDifferentiators || differentiators.length === 0) {
      console.log('[UnifiedOfferings] Generating industry-aware fallback differentiator');
      differentiators = [this.generateFallbackDifferentiator(businessName, industry, urls)];
    }

    // Build sources
    const sources = differentiators.map(d => d.source);

    // Add methodology/proprietary sources
    if (raw.methodology) {
      sources.push({
        id: `source-${Date.now()}-methodology`,
        type: 'website',
        name: 'Methodology',
        url: raw.methodology.source_url || urls[0] || '',
        extractedAt: new Date(),
        reliability: 80,
        dataPoints: 1
      });
    }

    return {
      differentiators,
      methodology: raw.methodology?.description,
      proprietaryApproach: raw.proprietary_approach?.description,
      sources
    };
  }

  /**
   * Generate fallback differentiator based on industry
   */
  private generateFallbackDifferentiator(
    businessName?: string,
    industry?: string,
    urls?: string[]
  ): Differentiator {
    const isBakery = industry?.toLowerCase().includes('bakery') ||
                     industry?.toLowerCase().includes('food') ||
                     industry?.toLowerCase().includes('cafe');

    const isFinancial = industry?.toLowerCase().includes('financial') ||
                        industry?.toLowerCase().includes('advisor') ||
                        industry?.toLowerCase().includes('wealth');

    let statement: string;
    if (isBakery) {
      statement = 'We believe every customer deserves freshly made, quality baked goods crafted with care';
    } else if (isFinancial) {
      statement = 'We believe clients deserve transparent, fiduciary advice that starts with their dreams';
    } else {
      statement = `${businessName} delivers exceptional ${industry || 'services'} with a customer-first philosophy`;
    }

    return {
      id: `diff-fallback-${Date.now()}`,
      statement,
      evidence: `Generated industry-aware fallback for ${industry || 'business'}`,
      source: {
        id: `source-fallback-${Date.now()}`,
        type: 'website',
        name: 'Generated Philosophy',
        url: urls?.[0] || '',
        extractedAt: new Date(),
        reliability: 50,
        dataPoints: 1
      },
      strengthScore: 50
    };
  }

  /**
   * Calculate products confidence
   */
  private calculateProductsConfidence(products: ProductService[]): ConfidenceScore {
    if (products.length === 0) {
      return {
        overall: 0,
        dataQuality: 0,
        sourceCount: 0,
        modelAgreement: 0,
        reasoning: 'No products found'
      };
    }

    const avgConfidence = products.reduce((sum, p) => sum + p.confidence, 0) / products.length;
    const hasDescriptions = products.filter(p => p.description.length > 20).length;
    const dataQuality = Math.round((hasDescriptions / products.length) * 100);
    const uniqueSources = new Set(products.map(p => p.sourceUrl).filter(Boolean)).size;
    const highConfidence = products.filter(p => p.confidence >= 80).length;
    const modelAgreement = Math.round((highConfidence / products.length) * 100);

    return {
      overall: Math.round(avgConfidence),
      dataQuality,
      sourceCount: uniqueSources,
      modelAgreement,
      reasoning: `Found ${products.length} offerings with ${highConfidence} high-confidence items`
    };
  }

  /**
   * Calculate differentiators confidence
   */
  private calculateDifferentiatorsConfidence(
    raw: RawUnifiedOfferingsExtraction,
    differentiators: Differentiator[]
  ): ConfidenceScore {
    let overall = 0;
    switch (raw.differentiators_confidence) {
      case 'high': overall = 85; break;
      case 'medium': overall = 65; break;
      case 'low': overall = 40; break;
      default: overall = 50;
    }

    const hasPhilosophy = differentiators.some(d =>
      d.statement.toLowerCase().includes('believe') ||
      d.statement.toLowerCase().includes('unlike') ||
      d.strengthScore >= 80
    );

    if (hasPhilosophy) overall = Math.max(overall, 75);

    const avgStrength = differentiators.length > 0
      ? differentiators.reduce((sum, d) => sum + d.strengthScore, 0) / differentiators.length
      : 0;

    overall = Math.round(overall * 0.5 + avgStrength * 0.5);

    return {
      overall: Math.max(0, Math.min(100, overall)),
      dataQuality: Math.round(avgStrength),
      sourceCount: differentiators.length,
      modelAgreement: overall,
      reasoning: hasPhilosophy
        ? 'Found philosophy/belief-driven differentiators'
        : 'Extracted differentiators from website content'
    };
  }

  /**
   * Build product sources
   */
  private buildProductSources(urls: string[], products: ProductService[]): DataSource[] {
    return urls.map((url, index) => ({
      id: `source-${index}`,
      type: this.determineSourceType(url),
      name: url.split('/').pop() || 'homepage',
      url,
      extractedAt: new Date(),
      reliability: 90,
      dataPoints: products.filter(p => p.sourceUrl?.includes(url)).length
    }));
  }

  /**
   * Determine source type from URL
   */
  private determineSourceType(url: string): DataSource['type'] {
    const lower = url.toLowerCase();
    if (lower.includes('/services') || lower.includes('/service')) return 'services';
    if (lower.includes('/about')) return 'about';
    if (lower.includes('/testimonial')) return 'testimonials';
    return 'website';
  }

  /**
   * Get industry fallback services
   */
  private getIndustryFallbackServices(industry: string, businessName: string): ProductService[] {
    const lowerIndustry = industry.toLowerCase();

    const industryServices: Record<string, string[]> = {
      'real estate': ['Buyer Representation', 'Seller Services', 'Property Valuation', 'Market Analysis'],
      'it managed services': ['Network Management', 'Cloud Services', 'Cybersecurity', 'Help Desk Support'],
      'financial advisory': ['Wealth Management', 'Retirement Planning', 'Investment Advisory', 'Tax Planning'],
      'bakery': ['Custom Cakes', 'Artisan Breads', 'Pastries and Desserts', 'Catering Services'],
      'dental': ['General Dentistry', 'Cosmetic Dentistry', 'Teeth Whitening', 'Dental Implants']
    };

    let services: string[] = [];
    for (const [key, value] of Object.entries(industryServices)) {
      if (lowerIndustry.includes(key)) {
        services = value;
        break;
      }
    }

    if (services.length === 0) {
      services = ['Consultation Services', 'Professional Services', 'Custom Solutions', 'Support Services'];
    }

    return services.map((name, index) => ({
      id: `fallback-${index}`,
      name,
      description: `Standard ${name.toLowerCase()} offered in the ${industry} industry`,
      category: 'Professional Services',
      confidence: 60,
      source: 'manual' as const,
      sourceUrl: '',
      confirmed: false
    }));
  }

  /**
   * Create empty result
   */
  private createEmptyResult(urls: string[]): UnifiedOfferingsResult {
    return {
      products: {
        products: [],
        categories: [],
        confidence: { overall: 0, dataQuality: 0, sourceCount: 0, modelAgreement: 0, reasoning: 'Extraction failed' },
        sources: [],
        extractionTimestamp: new Date()
      },
      differentiators: {
        differentiators: [],
        methodology: undefined,
        proprietaryApproach: undefined,
        confidence: { overall: 0, dataQuality: 0, sourceCount: 0, modelAgreement: 0, reasoning: 'Extraction failed' },
        sources: []
      }
    };
  }
}

// Export singleton
export const unifiedOfferingsStrategy = new UnifiedOfferingsStrategyService();
export { UnifiedOfferingsStrategyService };
