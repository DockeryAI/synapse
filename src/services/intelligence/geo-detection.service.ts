/**
 * Geographic Detection Service
 *
 * Auto-detects geographic market focus from website data.
 * Runs in parallel with other intelligence gathering.
 *
 * Detection signals:
 * - Domain TLD (.co.uk, .de, .com.au)
 * - Contact page addresses
 * - Currency/language indicators
 * - Legal entity information
 * - Content references to regions
 *
 * Created: 2025-11-28
 */

import { EventEmitter } from 'events';
import type { MarketGeography } from '@/types/uvp-flow.types';

// ============================================================================
// TYPES
// ============================================================================

export interface GeoDetectionResult {
  geography: MarketGeography;
  signals: GeoSignal[];
  confidence: number;
}

export interface GeoSignal {
  type: 'domain' | 'address' | 'currency' | 'language' | 'content' | 'legal';
  value: string;
  region: string;
  confidence: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Domain TLD to region mapping
const TLD_REGION_MAP: Record<string, { region: string; scope: 'local' | 'regional' | 'national' | 'global' }> = {
  // UK
  '.co.uk': { region: 'UK', scope: 'national' },
  '.uk': { region: 'UK', scope: 'national' },
  '.org.uk': { region: 'UK', scope: 'national' },

  // Europe
  '.de': { region: 'Germany', scope: 'national' },
  '.fr': { region: 'France', scope: 'national' },
  '.nl': { region: 'Netherlands', scope: 'national' },
  '.es': { region: 'Spain', scope: 'national' },
  '.it': { region: 'Italy', scope: 'national' },
  '.eu': { region: 'Europe', scope: 'regional' },

  // APAC
  '.au': { region: 'Australia', scope: 'national' },
  '.com.au': { region: 'Australia', scope: 'national' },
  '.jp': { region: 'Japan', scope: 'national' },
  '.sg': { region: 'Singapore', scope: 'national' },
  '.cn': { region: 'China', scope: 'national' },
  '.in': { region: 'India', scope: 'national' },

  // Americas
  '.ca': { region: 'Canada', scope: 'national' },
  '.mx': { region: 'Mexico', scope: 'national' },
  '.br': { region: 'Brazil', scope: 'national' },

  // Global/US (default)
  '.com': { region: 'US/Global', scope: 'global' },
  '.io': { region: 'Tech/Global', scope: 'global' },
  '.ai': { region: 'Tech/Global', scope: 'global' },
  '.dev': { region: 'Tech/Global', scope: 'global' },
};

// Region keywords in content
const REGION_CONTENT_PATTERNS: Record<string, { keywords: string[]; scope: 'local' | 'regional' | 'national' | 'global' }> = {
  'UK': {
    keywords: ['united kingdom', 'uk', 'britain', 'british', 'england', 'london', 'manchester', 'birmingham', 'fca', 'nhs', 'pounds', 'gbp', '£'],
    scope: 'national'
  },
  'EMEA': {
    keywords: ['emea', 'europe', 'european', 'middle east', 'africa', 'eu', 'gdpr', 'european union'],
    scope: 'regional'
  },
  'US': {
    keywords: ['united states', 'usa', 'america', 'american', 'california', 'new york', 'texas', 'florida', 'hipaa', 'dollars', 'usd', '$'],
    scope: 'national'
  },
  'APAC': {
    keywords: ['apac', 'asia', 'pacific', 'australia', 'singapore', 'japan', 'china', 'asia-pacific'],
    scope: 'regional'
  },
  'Global': {
    keywords: ['global', 'worldwide', 'international', 'multinational', 'multi-region', 'around the world'],
    scope: 'global'
  }
};

// Currency patterns
const CURRENCY_PATTERNS: Record<string, string> = {
  '£': 'UK',
  'GBP': 'UK',
  '€': 'Europe',
  'EUR': 'Europe',
  '$': 'US',
  'USD': 'US',
  'AUD': 'Australia',
  'A$': 'Australia',
  'CAD': 'Canada',
  'C$': 'Canada',
  '¥': 'Japan/China',
  'JPY': 'Japan',
  'CNY': 'China',
  'SGD': 'Singapore',
  'S$': 'Singapore'
};

// Address patterns (simplified)
const ADDRESS_COUNTRY_PATTERNS: Record<string, string[]> = {
  'UK': ['united kingdom', 'uk', 'england', 'scotland', 'wales', 'northern ireland', 'london', 'manchester', 'birmingham'],
  'US': ['united states', 'usa', 'us', 'california', 'ca', 'new york', 'ny', 'texas', 'tx', 'florida', 'fl'],
  'Germany': ['germany', 'deutschland', 'berlin', 'munich', 'hamburg', 'frankfurt'],
  'France': ['france', 'paris', 'lyon', 'marseille'],
  'Netherlands': ['netherlands', 'holland', 'amsterdam', 'rotterdam'],
  'Australia': ['australia', 'sydney', 'melbourne', 'brisbane'],
  'Canada': ['canada', 'toronto', 'vancouver', 'montreal'],
  'Singapore': ['singapore']
};

// ============================================================================
// SERVICE
// ============================================================================

class GeoDetectionService extends EventEmitter {
  /**
   * Detect geographic focus from website URL and content
   */
  detectFromUrl(url: string): GeoDetectionResult {
    const signals: GeoSignal[] = [];

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      // Check TLD
      for (const [tld, info] of Object.entries(TLD_REGION_MAP)) {
        if (hostname.endsWith(tld)) {
          signals.push({
            type: 'domain',
            value: tld,
            region: info.region,
            confidence: 0.9
          });
          break;
        }
      }
    } catch (e) {
      // Invalid URL, continue without domain signal
    }

    return this.buildResult(signals);
  }

  /**
   * Detect geographic focus from website content
   */
  detectFromContent(content: string): GeoDetectionResult {
    const signals: GeoSignal[] = [];
    const contentLower = content.toLowerCase();

    // Check region patterns in content
    for (const [region, config] of Object.entries(REGION_CONTENT_PATTERNS)) {
      let matches = 0;
      for (const keyword of config.keywords) {
        if (contentLower.includes(keyword.toLowerCase())) {
          matches++;
        }
      }
      if (matches >= 2) {
        signals.push({
          type: 'content',
          value: `${matches} matches`,
          region,
          confidence: Math.min(0.9, 0.4 + matches * 0.1)
        });
      }
    }

    // Check currency patterns
    for (const [currency, region] of Object.entries(CURRENCY_PATTERNS)) {
      if (content.includes(currency)) {
        signals.push({
          type: 'currency',
          value: currency,
          region,
          confidence: 0.7
        });
      }
    }

    return this.buildResult(signals);
  }

  /**
   * Detect from address text
   */
  detectFromAddress(address: string): GeoDetectionResult {
    const signals: GeoSignal[] = [];
    const addressLower = address.toLowerCase();

    for (const [country, patterns] of Object.entries(ADDRESS_COUNTRY_PATTERNS)) {
      for (const pattern of patterns) {
        if (addressLower.includes(pattern)) {
          signals.push({
            type: 'address',
            value: pattern,
            region: country,
            confidence: 0.95
          });
          break;
        }
      }
    }

    return this.buildResult(signals);
  }

  /**
   * Combine multiple detection results
   */
  combineResults(...results: GeoDetectionResult[]): GeoDetectionResult {
    const allSignals: GeoSignal[] = [];
    for (const result of results) {
      allSignals.push(...result.signals);
    }
    return this.buildResult(allSignals);
  }

  /**
   * Detect from brand data object
   */
  detectFromBrandData(brandData: any): GeoDetectionResult {
    const signals: GeoSignal[] = [];

    // Check website URL
    if (brandData.website || brandData.url) {
      const urlResult = this.detectFromUrl(brandData.website || brandData.url);
      signals.push(...urlResult.signals);
    }

    // Check location field
    if (brandData.location) {
      const addressResult = this.detectFromAddress(brandData.location);
      signals.push(...addressResult.signals);
    }

    // Check headquarters field
    if (brandData.headquarters) {
      const hqResult = this.detectFromAddress(brandData.headquarters);
      signals.push(...hqResult.signals);
    }

    // Check description for region mentions
    if (brandData.description) {
      const contentResult = this.detectFromContent(brandData.description);
      signals.push(...contentResult.signals);
    }

    return this.buildResult(signals);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private buildResult(signals: GeoSignal[]): GeoDetectionResult {
    if (signals.length === 0) {
      return {
        geography: {
          scope: 'national',
          headquarters: 'US',
          primaryRegions: ['US'],
          detectedFrom: 'content',
          confidence: 0.3
        },
        signals: [],
        confidence: 0.3
      };
    }

    // Group signals by region
    const regionScores: Record<string, number> = {};
    for (const signal of signals) {
      const normalizedRegion = this.normalizeRegion(signal.region);
      regionScores[normalizedRegion] = (regionScores[normalizedRegion] || 0) + signal.confidence;
    }

    // Find top regions
    const sortedRegions = Object.entries(regionScores)
      .sort((a, b) => b[1] - a[1])
      .map(([region]) => region);

    const primaryRegion = sortedRegions[0] || 'US';
    const primaryRegions = sortedRegions.slice(0, 3);

    // Determine scope
    let scope: 'local' | 'regional' | 'national' | 'global' = 'national';
    if (primaryRegions.includes('Global') || primaryRegions.length >= 2) {
      scope = 'global';
    } else if (['EMEA', 'APAC', 'Europe'].includes(primaryRegion)) {
      scope = 'regional';
    }

    // Determine detection source
    const detectionTypes = new Set(signals.map(s => s.type));
    let detectedFrom: 'domain' | 'content' | 'address' | 'manual' = 'content';
    if (detectionTypes.has('domain')) detectedFrom = 'domain';
    else if (detectionTypes.has('address')) detectedFrom = 'address';

    // Calculate overall confidence
    const avgConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;
    const confidence = Math.min(0.95, avgConfidence + (signals.length * 0.05));

    const geography: MarketGeography = {
      scope,
      headquarters: this.getHeadquarters(primaryRegion),
      primaryRegions,
      focusMarkets: primaryRegions.map(r => this.getFullName(r)),
      detectedFrom,
      confidence
    };

    return {
      geography,
      signals,
      confidence
    };
  }

  private normalizeRegion(region: string): string {
    const normMap: Record<string, string> = {
      'UK': 'UK',
      'United Kingdom': 'UK',
      'Britain': 'UK',
      'England': 'UK',
      'US': 'US',
      'USA': 'US',
      'United States': 'US',
      'America': 'US',
      'US/Global': 'US',
      'Tech/Global': 'Global',
      'Europe': 'EMEA',
      'European': 'EMEA',
      'EMEA': 'EMEA',
      'Asia': 'APAC',
      'Asia-Pacific': 'APAC',
      'APAC': 'APAC',
      'Global': 'Global',
      'Worldwide': 'Global',
      'International': 'Global'
    };

    return normMap[region] || region;
  }

  private getHeadquarters(region: string): string {
    const hqMap: Record<string, string> = {
      'UK': 'United Kingdom',
      'US': 'United States',
      'EMEA': 'Europe',
      'APAC': 'Asia Pacific',
      'Global': 'Global',
      'Germany': 'Germany',
      'France': 'France',
      'Netherlands': 'Netherlands',
      'Australia': 'Australia',
      'Canada': 'Canada',
      'Singapore': 'Singapore'
    };

    return hqMap[region] || region;
  }

  private getFullName(region: string): string {
    const nameMap: Record<string, string> = {
      'UK': 'United Kingdom',
      'US': 'United States',
      'EMEA': 'Europe, Middle East & Africa',
      'APAC': 'Asia Pacific',
      'Global': 'Global'
    };

    return nameMap[region] || region;
  }
}

// Export singleton
export const geoDetectionService = new GeoDetectionService();
