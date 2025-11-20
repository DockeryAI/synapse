/**
 * Comprehensive Product Scanner Service
 *
 * Orchestrates multiple extraction strategies for maximum product/service coverage:
 * 1. Multi-page discovery (finds /services, /products, /pricing pages)
 * 2. DeepWebsiteScanner (structural extraction: navigation, patterns, pricing tables)
 * 3. Semantic extraction (Claude-based deep analysis)
 * 4. Result merging with intelligent deduplication
 *
 * Goal: Find 85%+ of all products/services mentioned on a website
 *
 * Created: 2025-11-19 (Phase 3 - Comprehensive Integration)
 */

import type { WebsiteData } from '@/services/scraping/websiteScraper';
import type { ProductServiceExtractionResult, ProductService } from '@/types/uvp-flow.types';
import type { DataSource } from '@/components/onboarding-v5/SourceCitation';
import { multiPageProductDiscoveryService, MultiPageProductDiscoveryService } from './multi-page-product-discovery.service';
import { deepWebsiteScannerService } from './deep-website-scanner.service';
import { extractProductsServices } from '@/services/uvp-extractors/product-service-extractor.service';
import { productValidationService } from './product-validation.service';

export interface ComprehensiveScanOptions {
  enableMultiPage?: boolean;
  maxAdditionalPages?: number;
  enableDeepScan?: boolean;
  enableSemanticScan?: boolean;
  deduplicationThreshold?: number;
}

export interface ComprehensiveScanResult extends ProductServiceExtractionResult {
  scanStrategies: {
    multiPage: { enabled: boolean; pagesScraped: number };
    deepScan: { enabled: boolean; productsFound: number };
    semanticScan: { enabled: boolean; productsFound: number };
  };
  mergeStats: {
    totalBeforeMerge: number;
    duplicatesRemoved: number;
    finalCount: number;
  };
}

export class ComprehensiveProductScannerService {
  /**
   * Perform comprehensive product/service extraction using all available strategies
   */
  async scanForProducts(
    websiteData: WebsiteData,
    businessName: string,
    options: ComprehensiveScanOptions = {}
  ): Promise<ComprehensiveScanResult> {
    console.log('[ComprehensiveScanner] Starting comprehensive scan for:', businessName);

    const {
      enableMultiPage = true,
      maxAdditionalPages = 5,
      enableDeepScan = true,
      enableSemanticScan = true,
      deduplicationThreshold = 0.85
    } = options;

    const startTime = Date.now();
    let allProducts: ProductService[] = [];
    const allSources: DataSource[] = [];
    const scanStrategies = {
      multiPage: { enabled: enableMultiPage, pagesScraped: 0 },
      deepScan: { enabled: enableDeepScan, productsFound: 0 },
      semanticScan: { enabled: enableSemanticScan, productsFound: 0 }
    };

    // STEP 1: Multi-page discovery (if enabled)
    let combinedData = websiteData;
    if (enableMultiPage) {
      console.log('[ComprehensiveScanner] Step 1: Multi-page discovery');
      try {
        const discovery = await multiPageProductDiscoveryService.discoverProductPages(
          websiteData,
          maxAdditionalPages
        );

        scanStrategies.multiPage.pagesScraped = discovery.scrapedCount;
        console.log('[ComprehensiveScanner] Discovered and scraped', discovery.scrapedCount, 'additional pages');

        // Combine all page data
        const allPages = [discovery.mainPage, ...discovery.additionalPages];
        combinedData = MultiPageProductDiscoveryService.combineWebsiteData(allPages);
      } catch (error) {
        console.warn('[ComprehensiveScanner] Multi-page discovery failed:', error);
        // Continue with main page only
      }
    }

    // STEP 2: Deep structural scan (if enabled)
    if (enableDeepScan) {
      console.log('[ComprehensiveScanner] Step 2: Deep structural scan');
      try {
        const deepScanResult = await deepWebsiteScannerService.scanWebsite(combinedData, {
          minConfidence: 0.5,
          extractPricing: true,
          deduplicate: false // We'll deduplicate at the end
        });

        // Convert DeepServiceData to ProductService format
        const deepProducts: ProductService[] = deepScanResult.services.map((service, index) => ({
          id: `deep-${Date.now()}-${index}`,
          name: service.name,
          description: service.description,
          category: service.category,
          confidence: Math.round(service.confidence * 100), // Convert 0-1 to 0-100
          source: 'website' as const,
          sourceUrl: combinedData.url,
          sourceExcerpt: service.sources[0]?.matchedText || '',
          confirmed: false
        }));

        allProducts.push(...deepProducts);
        scanStrategies.deepScan.productsFound = deepProducts.length;
        console.log('[ComprehensiveScanner] Deep scan found', deepProducts.length, 'products');
      } catch (error) {
        console.warn('[ComprehensiveScanner] Deep scan failed:', error);
      }
    }

    // STEP 3: Semantic extraction (if enabled)
    if (enableSemanticScan) {
      console.log('[ComprehensiveScanner] Step 3: Semantic extraction with Claude');
      try {
        const semanticResult = await extractProductsServices(
          combinedData,
          [],
          businessName
        );

        allProducts.push(...semanticResult.products);
        allSources.push(...semanticResult.sources);
        scanStrategies.semanticScan.productsFound = semanticResult.products.length;
        console.log('[ComprehensiveScanner] Semantic scan found', semanticResult.products.length, 'products');
      } catch (error) {
        console.warn('[ComprehensiveScanner] Semantic scan failed:', error);
      }
    }

    // STEP 4: Merge and deduplicate
    console.log('[ComprehensiveScanner] Step 4: Merging and deduplicating results');
    const totalBeforeMerge = allProducts.length;
    const mergedProducts = this.deduplicateProducts(allProducts, deduplicationThreshold);
    const duplicatesRemoved = totalBeforeMerge - mergedProducts.length;

    console.log('[ComprehensiveScanner] Merge complete:');
    console.log('  - Total before merge:', totalBeforeMerge);
    console.log('  - Duplicates removed:', duplicatesRemoved);
    console.log('  - Final count:', mergedProducts.length);

    // STEP 4.5: Validate products to remove garbage extractions
    console.log('[ComprehensiveScanner] Step 4.5: Validating product quality');
    const validatedProducts = productValidationService.validateProducts(mergedProducts, businessName);
    const invalidRemoved = mergedProducts.length - validatedProducts.length;

    console.log('[ComprehensiveScanner] Validation complete:');
    console.log('  - Invalid products removed:', invalidRemoved);
    console.log('  - Valid products:', validatedProducts.length);

    // STEP 5: Categorize and calculate confidence
    const categories = this.extractCategories(validatedProducts);
    const overallConfidence = this.calculateOverallConfidence(validatedProducts);

    const duration = Date.now() - startTime;
    console.log('[ComprehensiveScanner] Scan complete in', duration, 'ms');

    return {
      products: validatedProducts,
      categories,
      confidence: overallConfidence,
      sources: allSources,
      extractionTimestamp: new Date(),
      scanStrategies,
      mergeStats: {
        totalBeforeMerge,
        duplicatesRemoved: duplicatesRemoved + invalidRemoved,
        finalCount: validatedProducts.length
      }
    };
  }

  /**
   * Deduplicate products using similarity matching
   */
  private deduplicateProducts(
    products: ProductService[],
    threshold: number
  ): ProductService[] {
    if (products.length === 0) return [];

    const merged: ProductService[] = [];
    const usedIndices = new Set<number>();

    for (let i = 0; i < products.length; i++) {
      if (usedIndices.has(i)) continue;

      const current = products[i];
      const duplicates: ProductService[] = [];

      // Find all duplicates of current product
      for (let j = i + 1; j < products.length; j++) {
        if (usedIndices.has(j)) continue;

        const similarity = this.calculateSimilarity(current, products[j]);
        if (similarity >= threshold) {
          duplicates.push(products[j]);
          usedIndices.add(j);
        }
      }

      // Merge duplicates if found
      if (duplicates.length > 0) {
        merged.push(this.mergeProducts(current, duplicates));
      } else {
        merged.push(current);
      }

      usedIndices.add(i);
    }

    return merged;
  }

  /**
   * Calculate similarity between two products (0-1)
   */
  private calculateSimilarity(a: ProductService, b: ProductService): number {
    const nameA = a.name.toLowerCase().trim();
    const nameB = b.name.toLowerCase().trim();

    // Exact match
    if (nameA === nameB) return 1.0;

    // One contains the other
    if (nameA.includes(nameB) || nameB.includes(nameA)) {
      return 0.95;
    }

    // Word overlap (Jaccard similarity)
    const wordsA = new Set(nameA.split(/\s+/));
    const wordsB = new Set(nameB.split(/\s+/));
    const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
    const union = new Set([...wordsA, ...wordsB]);

    const jaccard = intersection.size / union.size;

    // Also check description similarity if available
    if (a.description && b.description) {
      const descA = a.description.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const descB = b.description.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const descSetA = new Set(descA);
      const descSetB = new Set(descB);
      const descIntersection = new Set([...descSetA].filter(w => descSetB.has(w)));
      const descSimilarity = descIntersection.size / Math.max(descSetA.size, descSetB.size, 1);

      // Weighted average: name 70%, description 30%
      return jaccard * 0.7 + descSimilarity * 0.3;
    }

    return jaccard;
  }

  /**
   * Merge multiple product entries into one
   */
  private mergeProducts(primary: ProductService, others: ProductService[]): ProductService {
    const all = [primary, ...others];

    // Use highest confidence entry as base
    const base = all.reduce((prev, curr) =>
      curr.confidence > prev.confidence ? curr : prev
    );

    // Boost confidence for items found by multiple strategies
    const confidenceBoost = Math.min(all.length * 5, 20); // Up to +20 for 4+ sources
    const mergedConfidence = Math.min(base.confidence + confidenceBoost, 100);

    // Combine descriptions (use longest/most detailed)
    const description = all
      .map(p => p.description)
      .filter(d => d && d.length > 0)
      .sort((a, b) => b.length - a.length)[0] || base.description;

    // Use most specific category
    const category = this.selectBestCategory(all.map(p => p.category));

    return {
      ...base,
      confidence: mergedConfidence,
      description,
      category,
      sourceExcerpt: base.sourceExcerpt || all.find(p => p.sourceExcerpt)?.sourceExcerpt || ''
    };
  }

  /**
   * Select the most specific category from a list
   */
  private selectBestCategory(categories: string[]): string {
    // Priority order (most specific first)
    const priority = ['Core Services', 'Products', 'Packages', 'Add-ons', 'Specializations'];

    for (const cat of priority) {
      if (categories.includes(cat)) return cat;
    }

    // Return first non-generic category
    const generic = ['Uncategorized', 'Other', 'Services'];
    const specific = categories.find(c => !generic.includes(c));
    return specific || categories[0] || 'Uncategorized';
  }

  /**
   * Extract unique categories from products
   */
  private extractCategories(products: ProductService[]): string[] {
    const categories = new Set(products.map(p => p.category));
    return Array.from(categories);
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(products: ProductService[]): any {
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
    const highConfidence = products.filter(p => p.confidence >= 80).length;
    const modelAgreement = Math.round((highConfidence / products.length) * 100);

    return {
      overall: Math.round(avgConfidence),
      dataQuality: Math.round(avgConfidence),
      sourceCount: new Set(products.map(p => p.sourceUrl)).size,
      modelAgreement,
      reasoning: `Found ${products.length} products with ${highConfidence} high-confidence items`
    };
  }
}

/**
 * Singleton instance
 */
export const comprehensiveProductScannerService = new ComprehensiveProductScannerService();
