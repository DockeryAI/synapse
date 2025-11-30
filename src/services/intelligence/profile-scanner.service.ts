/**
 * Profile Scanner Service
 *
 * Background scanner that runs in parallel with other intelligence gathering.
 * Detects business profile type and market geography.
 * Uses EventEmitter pattern for non-blocking updates.
 *
 * Created: 2025-11-28
 */

import { EventEmitter } from 'events';
import { geoDetectionService } from './geo-detection.service';
import { profileDetectionService, type BusinessProfileType, type BusinessProfileAnalysis } from '../triggers/profile-detection.service';
import type { CompleteUVP, MarketGeography } from '@/types/uvp-flow.types';

// ============================================================================
// TYPES
// ============================================================================

export interface ProfileScanResult {
  profileType: BusinessProfileType;
  profileAnalysis: BusinessProfileAnalysis;
  geography: MarketGeography;
  signals: ProfileSignal[];
  confidence: number;
  timestamp: Date;
}

export interface ProfileSignal {
  source: 'domain' | 'content' | 'uvp' | 'brand' | 'geo';
  type: string;
  value: string;
  confidence: number;
}

export type ProfileScannerEvents = {
  'scan-started': { brandId: string };
  'geo-detected': { brandId: string; geography: MarketGeography };
  'profile-detected': { brandId: string; result: ProfileScanResult };
  'scan-complete': { brandId: string; result: ProfileScanResult };
  'scan-error': { brandId: string; error: Error };
};

// ============================================================================
// SERVICE
// ============================================================================

class ProfileScannerService extends EventEmitter {
  private scanCache: Map<string, ProfileScanResult> = new Map();
  private activeScan: Map<string, boolean> = new Map();

  /**
   * Start a background profile scan
   * Non-blocking, emits events as detection progresses
   */
  async scan(
    brandId: string,
    options: {
      url?: string;
      uvp?: CompleteUVP;
      brandData?: any;
      forceRefresh?: boolean;
    }
  ): Promise<ProfileScanResult> {
    // Check cache first
    if (!options.forceRefresh && this.scanCache.has(brandId)) {
      const cached = this.scanCache.get(brandId)!;
      // Cache valid for 1 hour
      if (Date.now() - cached.timestamp.getTime() < 60 * 60 * 1000) {
        return cached;
      }
    }

    // Prevent duplicate scans
    if (this.activeScan.get(brandId)) {
      console.log(`[ProfileScanner] Scan already in progress for ${brandId}`);
      // Wait for existing scan
      return new Promise((resolve) => {
        this.once('scan-complete', (data: ProfileScannerEvents['scan-complete']) => {
          if (data.brandId === brandId) {
            resolve(data.result);
          }
        });
      });
    }

    this.activeScan.set(brandId, true);
    this.emit('scan-started', { brandId });

    try {
      const signals: ProfileSignal[] = [];

      // Step 1: Geographic detection (fast)
      let geography: MarketGeography = {
        scope: 'national',
        headquarters: 'US',
        primaryRegions: ['US'],
        detectedFrom: 'content',
        confidence: 0.3
      };

      // Detect from URL
      if (options.url) {
        const urlGeo = geoDetectionService.detectFromUrl(options.url);
        if (urlGeo.confidence > geography.confidence!) {
          geography = urlGeo.geography;
          urlGeo.signals.forEach(s => signals.push({
            source: 'domain',
            type: s.type,
            value: s.value,
            confidence: s.confidence
          }));
        }
      }

      // Detect from brand data
      if (options.brandData) {
        const brandGeo = geoDetectionService.detectFromBrandData(options.brandData);
        if (brandGeo.confidence > geography.confidence!) {
          geography = brandGeo.geography;
        }
        brandGeo.signals.forEach(s => signals.push({
          source: 'brand',
          type: s.type,
          value: s.value,
          confidence: s.confidence
        }));
      }

      // Check UVP for geography
      if (options.uvp?.targetCustomer?.marketGeography) {
        const uvpGeo = options.uvp.targetCustomer.marketGeography;
        if (uvpGeo.confidence && uvpGeo.confidence > geography.confidence!) {
          geography = uvpGeo;
        }
        signals.push({
          source: 'uvp',
          type: 'marketGeography',
          value: JSON.stringify(uvpGeo.primaryRegions || []),
          confidence: uvpGeo.confidence || 0.8
        });
      }

      // Emit geo detection
      this.emit('geo-detected', { brandId, geography });

      // Step 2: Profile detection
      let profileAnalysis: BusinessProfileAnalysis;

      if (options.uvp) {
        // Inject geography into UVP for detection
        const uvpWithGeo = {
          ...options.uvp,
          targetCustomer: {
            ...options.uvp.targetCustomer,
            marketGeography: geography
          }
        };
        profileAnalysis = profileDetectionService.detectProfile(uvpWithGeo, options.brandData);
      } else {
        // Create minimal UVP for detection
        profileAnalysis = profileDetectionService.detectProfile(
          {
            id: 'temp',
            targetCustomer: {
              id: 'tc',
              statement: options.brandData?.description || '',
              industry: options.brandData?.industry || '',
              confidence: { level: 50, explanation: '' },
              sources: [],
              evidenceQuotes: [],
              isManualInput: false,
              marketGeography: geography
            },
            transformationGoal: {
              id: 'tg',
              statement: '',
              emotionalDrivers: [],
              functionalDrivers: [],
              eqScore: { emotional: 50, rational: 50, overall: 50 },
              confidence: { level: 50, explanation: '' },
              sources: [],
              customerQuotes: [],
              isManualInput: false
            },
            uniqueSolution: {
              id: 'us',
              statement: '',
              differentiators: [],
              confidence: { level: 50, explanation: '' },
              sources: [],
              isManualInput: false
            },
            keyBenefit: {
              id: 'kb',
              statement: '',
              outcomeType: 'mixed',
              eqFraming: 'balanced',
              confidence: { level: 50, explanation: '' },
              sources: [],
              isManualInput: false
            },
            valuePropositionStatement: '',
            whyStatement: '',
            whatStatement: '',
            howStatement: '',
            overallConfidence: { level: 50, explanation: '' },
            createdAt: new Date(),
            updatedAt: new Date()
          } as CompleteUVP,
          options.brandData
        );
      }

      // Add profile signals
      profileAnalysis.signals.forEach(signal => {
        signals.push({
          source: 'uvp',
          type: 'profile',
          value: signal,
          confidence: profileAnalysis.confidence
        });
      });

      // Build final result
      const result: ProfileScanResult = {
        profileType: profileAnalysis.profileType,
        profileAnalysis,
        geography,
        signals,
        confidence: (profileAnalysis.confidence + geography.confidence!) / 2,
        timestamp: new Date()
      };

      // Emit profile detected
      this.emit('profile-detected', { brandId, result });

      // Cache result
      this.scanCache.set(brandId, result);
      this.activeScan.set(brandId, false);

      // Emit complete
      this.emit('scan-complete', { brandId, result });

      console.log(`[ProfileScanner] Scan complete for ${brandId}:`, result.profileType, result.geography.scope);

      return result;
    } catch (error) {
      this.activeScan.set(brandId, false);
      this.emit('scan-error', { brandId, error: error as Error });
      throw error;
    }
  }

  /**
   * Get cached result if available
   */
  getCached(brandId: string): ProfileScanResult | null {
    return this.scanCache.get(brandId) || null;
  }

  /**
   * Clear cache for a brand
   */
  clearCache(brandId?: string): void {
    if (brandId) {
      this.scanCache.delete(brandId);
    } else {
      this.scanCache.clear();
    }
  }

  /**
   * Check if scan is in progress
   */
  isScanning(brandId: string): boolean {
    return this.activeScan.get(brandId) || false;
  }
}

// Export singleton
export const profileScannerService = new ProfileScannerService();
