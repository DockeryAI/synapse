/**
 * Deep Website Scanner Service
 *
 * Comprehensively extracts services/products from websites with:
 * - Navigation menu parsing
 * - Service/product page detection
 * - Pricing table extraction
 * - Pattern matching for service language
 * - Confidence scoring
 * - Semantic deduplication
 *
 * Goal: Find 90%+ of services mentioned on website
 */

import type { WebsiteData } from '../scraping/websiteScraper';
import type {
  DeepServiceData,
  DeepScanResult,
  DeepScanOptions,
  ServiceSource,
  ServiceCategory,
  PricingInfo,
  NavigationLink,
  PricingTable,
  ServicePattern,
  SimilarityMatch,
} from '@/types/deep-service.types';

/**
 * Service language patterns to detect services
 */
const SERVICE_PATTERNS: ServicePattern[] = [
  { pattern: /we (help|assist|provide|offer|deliver)/gi, confidenceBoost: 0.3, categoryHint: 'primary' },
  { pattern: /our services (include|are|offer)/gi, confidenceBoost: 0.4, categoryHint: 'primary' },
  { pattern: /what we (do|offer|provide)/gi, confidenceBoost: 0.3, categoryHint: 'primary' },
  { pattern: /specializing in/gi, confidenceBoost: 0.35, categoryHint: 'primary' },
  { pattern: /services?:?\s+/gi, confidenceBoost: 0.25 },
  { pattern: /packages?:?\s+/gi, confidenceBoost: 0.3, categoryHint: 'package' },
  { pattern: /pricing plans?/gi, confidenceBoost: 0.35, categoryHint: 'tier' },
  { pattern: /add-?ons?/gi, confidenceBoost: 0.2, categoryHint: 'addon' },
];

/**
 * Service keywords for link detection
 */
const SERVICE_KEYWORDS = [
  'service', 'services', 'product', 'products', 'offering', 'offerings',
  'solution', 'solutions', 'package', 'packages', 'plan', 'plans',
  'pricing', 'what we do', 'how we help', 'capabilities'
];

/**
 * Deep Website Scanner Service Class
 */
export class DeepWebsiteScannerService {
  /**
   * Perform comprehensive service extraction from website
   */
  async scanWebsite(
    websiteData: WebsiteData,
    options: DeepScanOptions = {}
  ): Promise<DeepScanResult> {
    console.log('[DeepScanner] Starting comprehensive scan for:', websiteData.url);

    const {
      minConfidence = 0.5,
      extractPricing = true,
      deduplicate = true,
      deduplicationThreshold = 0.8,
    } = options;

    const startTime = Date.now();
    const allServices: DeepServiceData[] = [];
    const warnings: string[] = [];

    try {
      // Step 1: Extract from navigation menu
      console.log('[DeepScanner] Step 1: Analyzing navigation menu');
      const navServices = await this.extractFromNavigation(websiteData);
      allServices.push(...navServices);
      console.log('[DeepScanner] Found', navServices.length, 'services from navigation');

      // Step 2: Extract from page content patterns
      console.log('[DeepScanner] Step 2: Scanning content patterns');
      const patternServices = await this.extractFromPatterns(websiteData);
      allServices.push(...patternServices);
      console.log('[DeepScanner] Found', patternServices.length, 'services from patterns');

      // Step 3: Extract pricing information
      if (extractPricing) {
        console.log('[DeepScanner] Step 3: Extracting pricing tables');
        const pricingServices = await this.extractFromPricing(websiteData);
        allServices.push(...pricingServices);
        console.log('[DeepScanner] Found', pricingServices.length, 'services from pricing');
      }

      // Step 4: Extract from headings and structured content
      console.log('[DeepScanner] Step 4: Analyzing headings and structure');
      const structureServices = await this.extractFromStructure(websiteData);
      allServices.push(...structureServices);
      console.log('[DeepScanner] Found', structureServices.length, 'services from structure');

      // Step 5: Deduplicate similar services
      let finalServices = allServices;
      if (deduplicate && allServices.length > 0) {
        console.log('[DeepScanner] Step 5: Deduplicating similar services');
        finalServices = await this.deduplicateServices(allServices, deduplicationThreshold);
        console.log('[DeepScanner] Deduplicated from', allServices.length, 'to', finalServices.length);
      }

      // Step 6: Filter by minimum confidence
      finalServices = finalServices.filter(s => s.confidence >= minConfidence);
      console.log('[DeepScanner] After confidence filter:', finalServices.length, 'services');

      // Step 7: Identify primary services
      const primaryServices = this.identifyPrimaryServices(finalServices);

      // Step 8: Detect service packages
      const packages = this.detectPackages(finalServices);

      // Calculate statistics
      const stats = this.calculateStats(finalServices);

      // Add warnings
      if (finalServices.length === 0) {
        warnings.push('No services found - website may not have clear service information');
      }
      if (stats.servicesWithPricing === 0 && extractPricing) {
        warnings.push('No pricing information found');
      }
      if (stats.averageConfidence < 0.6) {
        warnings.push('Low average confidence - results may need manual review');
      }

      const scanTime = Date.now() - startTime;
      console.log('[DeepScanner] Scan complete in', scanTime, 'ms');
      console.log('[DeepScanner] Final results:', {
        totalServices: finalServices.length,
        primaryServices: primaryServices.length,
        packages: packages.length,
        averageConfidence: (stats.averageConfidence * 100).toFixed(0) + '%',
      });

      return {
        services: finalServices,
        primaryServices,
        packages,
        overallConfidence: stats.averageConfidence,
        stats,
        warnings,
        scannedAt: new Date(),
      };
    } catch (error) {
      console.error('[DeepScanner] Scan failed:', error);
      throw new Error(`Deep scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract services from navigation menu
   */
  private async extractFromNavigation(websiteData: WebsiteData): Promise<DeepServiceData[]> {
    const services: DeepServiceData[] = [];
    const { navigation, sections } = websiteData.structure;
    const navLinks = [...navigation, ...sections];

    // Analyze each navigation link
    const analyzedLinks = navLinks.map(link => this.analyzeNavigationLink(link));

    // Filter to likely service links
    const serviceLinks = analyzedLinks.filter(link => link.isServiceLink && link.confidence > 0.5);

    // Create service entries from navigation
    serviceLinks.forEach((link, index) => {
      const service: DeepServiceData = {
        id: `nav-${Date.now()}-${index}`,
        name: this.cleanServiceName(link.text),
        description: `Service found in navigation: ${link.text}`,
        category: 'secondary',
        pricing: undefined,
        features: [],
        sources: [{
          url: websiteData.url,
          type: 'navigation',
          matchedText: link.text,
          context: 'Main navigation menu',
          confidence: link.confidence,
        }],
        confidence: link.confidence,
        isProduct: false,
        relatedServices: [],
        tags: link.keywords,
        extractedAt: new Date(),
      };
      services.push(service);
    });

    return services;
  }

  /**
   * Extract services using content patterns
   */
  private async extractFromPatterns(websiteData: WebsiteData): Promise<DeepServiceData[]> {
    const services: DeepServiceData[] = [];
    const { headings, paragraphs } = websiteData.content;
    const allText = [...headings, ...paragraphs].join('\n');

    // Match each service pattern
    for (const pattern of SERVICE_PATTERNS) {
      const matches = allText.matchAll(pattern.pattern);

      for (const match of matches) {
        const matchedText = match[0];
        const context = this.extractContext(allText, match.index || 0);
        const serviceName = this.extractServiceNameFromContext(context);

        if (serviceName) {
          const service: DeepServiceData = {
            id: `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: serviceName,
            description: context.substring(0, 200),
            category: pattern.categoryHint || 'secondary',
            pricing: undefined,
            features: this.extractFeaturesFromContext(context),
            sources: [{
              url: websiteData.url,
              type: 'content-pattern',
              matchedText,
              context: context.substring(0, 100),
              confidence: 0.6 + pattern.confidenceBoost,
            }],
            confidence: 0.6 + pattern.confidenceBoost,
            isProduct: this.isProductPattern(context),
            relatedServices: [],
            tags: this.extractTags(context),
            extractedAt: new Date(),
          };
          services.push(service);
        }
      }
    }

    return services;
  }

  /**
   * Extract services from pricing tables
   */
  private async extractFromPricing(websiteData: WebsiteData): Promise<DeepServiceData[]> {
    const services: DeepServiceData[] = [];
    const pricingTables = this.extractPricingTables(websiteData);

    pricingTables.forEach((table, tableIndex) => {
      table.tiers.forEach((tier, tierIndex) => {
        const service: DeepServiceData = {
          id: `pricing-${Date.now()}-${tableIndex}-${tierIndex}`,
          name: tier.name,
          description: `Pricing tier: ${tier.name}`,
          category: 'tier',
          pricing: tier.price,
          features: tier.features,
          sources: [{
            url: websiteData.url,
            type: 'pricing-table',
            matchedText: tier.name,
            context: 'Pricing table',
            confidence: table.confidence,
          }],
          confidence: table.confidence,
          isProduct: false,
          relatedServices: [],
          tags: ['pricing', 'tier'],
          extractedAt: new Date(),
        };
        services.push(service);
      });
    });

    return services;
  }

  /**
   * Extract services from page structure (headings, sections)
   */
  private async extractFromStructure(websiteData: WebsiteData): Promise<DeepServiceData[]> {
    const services: DeepServiceData[] = [];
    const { headings, paragraphs } = websiteData.content;

    // Look for service-related headings
    headings.forEach((heading, index) => {
      const isServiceHeading = SERVICE_KEYWORDS.some(keyword =>
        heading.toLowerCase().includes(keyword)
      );

      if (isServiceHeading) {
        // Extract services from the paragraph following this heading
        const followingText = paragraphs[index] || '';
        const extractedServices = this.extractServicesFromText(followingText);

        extractedServices.forEach((serviceName, serviceIndex) => {
          const service: DeepServiceData = {
            id: `structure-${Date.now()}-${index}-${serviceIndex}`,
            name: serviceName,
            description: followingText.substring(0, 200),
            category: 'secondary',
            pricing: this.extractPricingFromText(followingText),
            features: this.extractFeaturesFromContext(followingText),
            sources: [{
              url: websiteData.url,
              type: 'service-page',
              matchedText: serviceName,
              context: heading,
              confidence: 0.7,
            }],
            confidence: 0.7,
            isProduct: this.isProductPattern(followingText),
            relatedServices: [],
            tags: this.extractTags(followingText),
            extractedAt: new Date(),
          };
          services.push(service);
        });
      }
    });

    return services;
  }

  /**
   * Deduplicate similar services using semantic matching
   */
  private async deduplicateServices(
    services: DeepServiceData[],
    threshold: number
  ): Promise<DeepServiceData[]> {
    if (services.length === 0) return [];

    const similarities: SimilarityMatch[] = [];

    // Compare all pairs of services
    for (let i = 0; i < services.length; i++) {
      for (let j = i + 1; j < services.length; j++) {
        const similarity = this.calculateSimilarity(services[i], services[j]);
        if (similarity >= threshold) {
          similarities.push({
            serviceA: services[i].id,
            serviceB: services[j].id,
            similarity,
            shouldMerge: true,
          });
        }
      }
    }

    // Merge similar services
    const mergedIds = new Set<string>();
    const deduplicatedServices: DeepServiceData[] = [];

    services.forEach(service => {
      if (mergedIds.has(service.id)) return;

      // Find all services that should be merged with this one
      const toMerge = similarities
        .filter(s => s.serviceA === service.id || s.serviceB === service.id)
        .map(s => s.serviceA === service.id ? s.serviceB : s.serviceA);

      if (toMerge.length > 0) {
        // Merge services
        const mergedService = this.mergeServices(
          service,
          services.filter(s => toMerge.includes(s.id))
        );
        deduplicatedServices.push(mergedService);
        mergedIds.add(service.id);
        toMerge.forEach(id => mergedIds.add(id));
      } else {
        deduplicatedServices.push(service);
      }
    });

    return deduplicatedServices;
  }

  /**
   * Analyze a navigation link to determine if it's a service link
   */
  private analyzeNavigationLink(linkText: string): NavigationLink {
    const lowerText = linkText.toLowerCase();
    const keywords: string[] = [];
    let confidence = 0;

    // Check for service keywords
    SERVICE_KEYWORDS.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        keywords.push(keyword);
        confidence += 0.2;
      }
    });

    // Boost confidence for specific patterns
    if (lowerText.match(/^(our\s+)?(services?|products?|offerings?)$/)) {
      confidence += 0.3;
    }

    const isServiceLink = confidence > 0.2;
    confidence = Math.min(confidence, 0.95);

    return {
      text: linkText,
      href: '', // We don't have href in this context
      isServiceLink,
      confidence,
      keywords,
    };
  }

  /**
   * Extract pricing tables from website data
   */
  private extractPricingTables(websiteData: WebsiteData): PricingTable[] {
    const tables: PricingTable[] = [];
    const { headings, paragraphs } = websiteData.content;

    // Look for pricing-related headings
    headings.forEach((heading, index) => {
      const isPricingHeading = /pricing|plans?|packages?|tiers?/i.test(heading);

      if (isPricingHeading) {
        // Try to extract tiers from following content
        const content = paragraphs.slice(index, index + 5).join('\n');
        const tiers = this.extractTiersFromContent(content);

        if (tiers.length > 0) {
          tables.push({
            id: `table-${Date.now()}-${index}`,
            tiers,
            confidence: 0.8,
          });
        }
      }
    });

    return tables;
  }

  /**
   * Extract tier information from content
   */
  private extractTiersFromContent(content: string): PricingTable['tiers'] {
    const tiers: PricingTable['tiers'] = [];
    const tierKeywords = ['basic', 'starter', 'standard', 'professional', 'pro', 'premium', 'enterprise', 'business'];

    tierKeywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword}[^\\n.]{0,100})`, 'gi');
      const matches = content.match(regex);

      if (matches) {
        matches.forEach(match => {
          const pricing = this.extractPricingFromText(match);
          const features = this.extractFeaturesFromContext(match);

          tiers.push({
            name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
            price: pricing,
            features,
            isPopular: match.toLowerCase().includes('popular') || match.toLowerCase().includes('recommended'),
          });
        });
      }
    });

    return tiers;
  }

  /**
   * Calculate similarity between two services
   */
  private calculateSimilarity(serviceA: DeepServiceData, serviceB: DeepServiceData): number {
    // Simple similarity based on name and description overlap
    const nameA = serviceA.name.toLowerCase();
    const nameB = serviceB.name.toLowerCase();
    const descA = serviceA.description.toLowerCase();
    const descB = serviceB.description.toLowerCase();

    // Exact name match
    if (nameA === nameB) return 1.0;

    // Name contains the other
    if (nameA.includes(nameB) || nameB.includes(nameA)) return 0.9;

    // Word overlap in names
    const wordsA = new Set(nameA.split(/\s+/));
    const wordsB = new Set(nameB.split(/\s+/));
    const intersection = new Set([...wordsA].filter(word => wordsB.has(word)));
    const union = new Set([...wordsA, ...wordsB]);
    const jaccardSimilarity = intersection.size / union.size;

    // Description similarity
    const descWordsA = new Set(descA.split(/\s+/).filter(w => w.length > 3));
    const descWordsB = new Set(descB.split(/\s+/).filter(w => w.length > 3));
    const descIntersection = new Set([...descWordsA].filter(word => descWordsB.has(word)));
    const descSimilarity = descIntersection.size / Math.max(descWordsA.size, descWordsB.size);

    // Weighted average
    return (jaccardSimilarity * 0.7) + (descSimilarity * 0.3);
  }

  /**
   * Merge multiple services into one
   */
  private mergeServices(primary: DeepServiceData, others: DeepServiceData[]): DeepServiceData {
    const allServices = [primary, ...others];

    // Use the service with highest confidence as base
    const base = allServices.reduce((prev, curr) =>
      curr.confidence > prev.confidence ? curr : prev
    );

    // Merge sources
    const allSources = allServices.flatMap(s => s.sources);

    // Merge features (deduplicated)
    const allFeatures = [...new Set(allServices.flatMap(s => s.features))];

    // Merge tags
    const allTags = [...new Set(allServices.flatMap(s => s.tags))];

    // Use best pricing if available
    const pricing = allServices.find(s => s.pricing)?.pricing;

    // Calculate merged confidence (average of top 3)
    const topConfidences = allServices
      .map(s => s.confidence)
      .sort((a, b) => b - a)
      .slice(0, 3);
    const mergedConfidence = topConfidences.reduce((sum, c) => sum + c, 0) / topConfidences.length;

    return {
      ...base,
      features: allFeatures,
      sources: allSources,
      pricing: pricing || base.pricing,
      confidence: mergedConfidence,
      tags: allTags,
    };
  }

  /**
   * Identify primary services from the list
   */
  private identifyPrimaryServices(services: DeepServiceData[]): string[] {
    // Services marked as primary category
    const primaryByCategory = services
      .filter(s => s.category === 'primary')
      .map(s => s.name);

    // Services with highest confidence
    const sortedByConfidence = [...services]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
      .map(s => s.name);

    // Services mentioned most frequently (multiple sources)
    const multiSourceServices = services
      .filter(s => s.sources.length > 2)
      .sort((a, b) => b.sources.length - a.sources.length)
      .slice(0, 3)
      .map(s => s.name);

    // Combine and deduplicate
    return [...new Set([...primaryByCategory, ...sortedByConfidence, ...multiSourceServices])];
  }

  /**
   * Detect service packages/bundles
   */
  private detectPackages(services: DeepServiceData[]): DeepScanResult['packages'] {
    const packages: DeepScanResult['packages'] = [];

    // Group services by category 'package'
    const packageServices = services.filter(s => s.category === 'package');

    packageServices.forEach(pkg => {
      packages.push({
        name: pkg.name,
        includedServices: pkg.features, // Features often list included services
        pricing: pkg.pricing,
      });
    });

    return packages;
  }

  /**
   * Calculate scan statistics
   */
  private calculateStats(services: DeepServiceData[]): DeepScanResult['stats'] {
    const servicesWithPricing = services.filter(s => s.pricing !== undefined).length;
    const servicesFromNavigation = services.filter(s =>
      s.sources.some(source => source.type === 'navigation')
    ).length;
    const servicesFromPages = services.filter(s =>
      s.sources.some(source => source.type === 'service-page')
    ).length;
    const servicesFromPatterns = services.filter(s =>
      s.sources.some(source => source.type === 'content-pattern')
    ).length;

    const averageConfidence = services.length > 0
      ? services.reduce((sum, s) => sum + s.confidence, 0) / services.length
      : 0;

    return {
      totalServicesFound: services.length,
      servicesWithPricing,
      servicesFromNavigation,
      servicesFromPages,
      servicesFromPatterns,
      averageConfidence,
    };
  }

  /**
   * Helper: Clean service name
   */
  private cleanServiceName(name: string): string {
    return name
      .replace(/^(our\s+)?/i, '')
      .replace(/\s+(services?|products?)$/i, '')
      .trim();
  }

  /**
   * Helper: Extract context around a match
   */
  private extractContext(text: string, index: number, radius: number = 150): string {
    const start = Math.max(0, index - radius);
    const end = Math.min(text.length, index + radius);
    return text.substring(start, end);
  }

  /**
   * Helper: Extract service name from context
   */
  private extractServiceNameFromContext(context: string): string | null {
    // Look for capitalized words or phrases after service indicators
    const patterns = [
      /(?:we offer|we provide|our services include)\s+([A-Z][a-zA-Z\s&-]+?)(?:\.|,|$)/,
      /(?:specializing in)\s+([a-z][a-zA-Z\s&-]+?)(?:\.|,|$)/i,
    ];

    for (const pattern of patterns) {
      const match = context.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Fallback: First capitalized phrase
    const fallbackMatch = context.match(/([A-Z][a-zA-Z\s&-]{3,30})/);
    return fallbackMatch ? fallbackMatch[1].trim() : null;
  }

  /**
   * Helper: Extract features from context
   */
  private extractFeaturesFromContext(context: string): string[] {
    const features: string[] = [];

    // Look for bullet points or lists
    const bulletMatches = context.match(/[•\-*]\s*([^\n•\-*]{10,100})/g);
    if (bulletMatches) {
      features.push(...bulletMatches.map(m => m.replace(/^[•\-*]\s*/, '').trim()));
    }

    // Look for "includes:" or "features:" patterns
    const includesMatch = context.match(/(?:includes?|features?):\s*([^\n]{20,200})/i);
    if (includesMatch) {
      const items = includesMatch[1].split(/,|and/).map(i => i.trim()).filter(i => i.length > 5);
      features.push(...items);
    }

    return features.slice(0, 10); // Limit to 10 features
  }

  /**
   * Helper: Extract pricing from text
   */
  private extractPricingFromText(text: string): PricingInfo | undefined {
    // Look for price patterns
    const pricePattern = /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:\/\s*(month|year|hr|hour|mo|yr))?/i;
    const match = text.match(pricePattern);

    if (match) {
      const amount = parseFloat(match[1].replace(',', ''));
      const period = match[2]?.toLowerCase();

      let model: PricingInfo['model'] = 'one-time';
      if (period) {
        if (period.includes('month') || period === 'mo') model = 'monthly';
        else if (period.includes('year') || period === 'yr') model = 'annual';
        else if (period.includes('hour') || period === 'hr') model = 'hourly';
      }

      return {
        raw: match[0],
        min: amount,
        max: amount,
        model,
        currency: 'USD',
        confidence: 0.8,
      };
    }

    // Look for range patterns
    const rangePattern = /\$\s*(\d+(?:,\d{3})*)\s*-\s*\$?\s*(\d+(?:,\d{3})*)/;
    const rangeMatch = text.match(rangePattern);

    if (rangeMatch) {
      return {
        raw: rangeMatch[0],
        min: parseFloat(rangeMatch[1].replace(',', '')),
        max: parseFloat(rangeMatch[2].replace(',', '')),
        model: 'custom',
        currency: 'USD',
        confidence: 0.7,
      };
    }

    return undefined;
  }

  /**
   * Helper: Determine if context describes a product vs service
   */
  private isProductPattern(context: string): boolean {
    const productKeywords = ['product', 'item', 'physical', 'tangible', 'ship', 'delivery'];
    const lowerContext = context.toLowerCase();
    return productKeywords.some(keyword => lowerContext.includes(keyword));
  }

  /**
   * Helper: Extract tags from context
   */
  private extractTags(context: string): string[] {
    const tags: string[] = [];
    const lowerContext = context.toLowerCase();

    // Common service tags
    const tagKeywords = ['consulting', 'training', 'support', 'maintenance', 'design', 'development', 'marketing', 'analysis'];

    tagKeywords.forEach(tag => {
      if (lowerContext.includes(tag)) {
        tags.push(tag);
      }
    });

    return tags;
  }

  /**
   * Helper: Extract services from a text block
   */
  private extractServicesFromText(text: string): string[] {
    const services: string[] = [];

    // Split by common delimiters
    const parts = text.split(/[,;]|\band\b/i);

    parts.forEach(part => {
      const trimmed = part.trim();
      // Only include parts that look like service names (reasonable length, starts with letter/capital)
      if (trimmed.length > 5 && trimmed.length < 60 && /^[A-Za-z]/.test(trimmed)) {
        services.push(trimmed);
      }
    });

    return services.slice(0, 5); // Limit to 5 services per text block
  }
}

/**
 * Export singleton instance
 */
export const deepWebsiteScannerService = new DeepWebsiteScannerService();
