/**
 * usePositioningMap Hook
 *
 * Phase 3 - Gap Tab 2.0
 * React hook for the competitor positioning map.
 * Handles data loading, positioning extraction, and map generation.
 *
 * Created: 2025-11-28
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { positioningExtractor } from '@/services/intelligence/positioning-extractor.service';
import { competitorIntelligence } from '@/services/intelligence/competitor-intelligence.service';
import type {
  CompetitorProfile,
  CompetitorScan,
  CompetitorGap,
  PositioningMapData,
  PositioningDataPoint,
  SegmentType,
  BusinessType
} from '@/types/competitor-intelligence.types';
import type { DeepContext } from '@/types/synapse/deepContext.types';

// ============================================================================
// TYPES
// ============================================================================

interface UsePositioningMapOptions {
  autoGenerate?: boolean;
  useAIExtraction?: boolean;
}

interface UsePositioningMapResult {
  // Data
  mapData: PositioningMapData | null;
  suggestedPosition: { xValue: number; yValue: number; reasoning: string } | null;

  // State
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;

  // Actions
  generateMap: () => Promise<void>;
  updateYourBrandPosition: (xValue: number, yValue: number) => void;
  refreshCompetitorPosition: (competitorId: string) => Promise<void>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function usePositioningMap(
  brandId: string | null,
  competitors: CompetitorProfile[],
  gaps: CompetitorGap[],
  deepContext: DeepContext | null,
  options: UsePositioningMapOptions = {}
): UsePositioningMapResult {
  const { autoGenerate = false, useAIExtraction = true } = options;

  // State
  const [mapData, setMapData] = useState<PositioningMapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derive segment and business type from competitors or deepContext
  const { segmentType, businessType } = useMemo(() => {
    // First try to get from competitors
    const competitorSegment = competitors.find(c => c.segment_type)?.segment_type as SegmentType | undefined;
    const competitorBizType = competitors.find(c => c.business_type)?.business_type as BusinessType | undefined;

    // Fallback to deepContext signals
    let segment: SegmentType = competitorSegment || 'national';
    let bizType: BusinessType = competitorBizType || 'mixed';

    if (deepContext?.business?.profile) {
      const profile = deepContext.business.profile;

      // Detect segment from location/reach
      const location = profile.location as Record<string, unknown> | undefined;
      if (location?.city && !(location as Record<string, unknown>)?.isNational) {
        segment = 'local';
      } else if (location?.state && !(location as Record<string, unknown>)?.isNational) {
        segment = 'regional';
      }

      // Detect business type from industry/customer signals
      const industry = (profile.industry || '').toLowerCase();
      if (industry.includes('software') || industry.includes('saas') || industry.includes('enterprise')) {
        bizType = 'b2b';
      } else if (industry.includes('retail') || industry.includes('consumer') || industry.includes('ecommerce')) {
        bizType = 'dtc';
      } else if (industry.includes('service') || industry.includes('restaurant') || industry.includes('healthcare')) {
        bizType = 'b2c';
      }
    }

    return { segmentType: segment, businessType: bizType };
  }, [competitors, deepContext]);

  // Gap counts per competitor
  const gapCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const gap of gaps) {
      for (const competitorId of gap.competitor_ids) {
        counts.set(competitorId, (counts.get(competitorId) || 0) + 1);
      }
    }
    return counts;
  }, [gaps]);

  // Your brand positioning from deepContext
  const yourBrandData = useMemo(() => {
    if (!deepContext?.business?.profile) return undefined;

    const profile = deepContext.business.profile;
    const uvp = deepContext.business.uvp;

    return {
      name: profile.name || 'Your Brand',
      // Default to middle-right, upper quadrant (premium, easy to use)
      xValue: 65,
      yValue: 70,
      positioningSummary: uvp?.uniqueSolution || uvp?.keyBenefit,
      keyDifferentiators: uvp ? [
        uvp.uniqueSolution,
        uvp.keyBenefit
      ].filter(Boolean) as string[] : undefined
    };
  }, [deepContext]);

  // Generate the positioning map
  const generateMap = useCallback(async () => {
    if (!brandId || competitors.length === 0) {
      setError('No brand ID or competitors available');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Fetch scans for all competitors
      const competitorScans = new Map<string, CompetitorScan[]>();

      // Load scans in parallel
      await Promise.all(
        competitors.map(async (competitor) => {
          try {
            const scans = await competitorIntelligence.getScans(competitor.id);
            competitorScans.set(competitor.id, scans);
          } catch {
            console.warn(`[usePositioningMap] Failed to load scans for ${competitor.name}`);
            competitorScans.set(competitor.id, []);
          }
        })
      );

      // Generate the map
      const data = await positioningExtractor.generatePositioningMap(
        brandId,
        competitors,
        competitorScans,
        gapCounts,
        segmentType,
        businessType,
        yourBrandData
      );

      setMapData(data);

      console.log('[usePositioningMap] Map generated:', {
        competitors: data.dataPoints.length,
        hasYourBrand: !!data.yourBrand
      });

    } catch (err) {
      console.error('[usePositioningMap] Generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate positioning map');
    } finally {
      setIsGenerating(false);
    }
  }, [brandId, competitors, gapCounts, segmentType, businessType, yourBrandData]);

  // Auto-generate on load if enabled
  useEffect(() => {
    if (autoGenerate && brandId && competitors.length > 0 && !mapData && !isGenerating) {
      generateMap();
    }
  }, [autoGenerate, brandId, competitors.length, mapData, isGenerating, generateMap]);

  // Update your brand position manually
  const updateYourBrandPosition = useCallback((xValue: number, yValue: number) => {
    setMapData(prev => {
      if (!prev) return null;

      return {
        ...prev,
        yourBrand: prev.yourBrand ? {
          ...prev.yourBrand,
          xValue,
          yValue,
          priceTier: xValue >= 60 ? 'premium' : xValue >= 30 ? 'mid-market' : 'budget',
          complexityLevel: yValue >= 60 ? 'simple' : yValue >= 30 ? 'moderate' : 'complex'
        } : undefined
      };
    });
  }, []);

  // Refresh a single competitor's position
  const refreshCompetitorPosition = useCallback(async (competitorId: string) => {
    const competitor = competitors.find(c => c.id === competitorId);
    if (!competitor) return;

    try {
      const scans = await competitorIntelligence.getScans(competitorId);
      const newPosition = await positioningExtractor.extractPositioning(
        competitor,
        scans,
        useAIExtraction
      );

      newPosition.gapCount = gapCounts.get(competitorId) || 0;

      setMapData(prev => {
        if (!prev) return null;

        return {
          ...prev,
          dataPoints: prev.dataPoints.map(p =>
            p.id === competitorId ? newPosition : p
          )
        };
      });

    } catch (err) {
      console.error('[usePositioningMap] Refresh failed:', err);
    }
  }, [competitors, gapCounts, useAIExtraction]);

  // Suggested optimal position
  const suggestedPosition = useMemo(() => {
    if (!mapData || mapData.dataPoints.length === 0) return null;

    return positioningExtractor.suggestOptimalPositioning(
      mapData.dataPoints,
      gapCounts
    );
  }, [mapData, gapCounts]);

  return {
    // Data
    mapData,
    suggestedPosition,

    // State
    isLoading,
    isGenerating,
    error,

    // Actions
    generateMap,
    updateYourBrandPosition,
    refreshCompetitorPosition
  };
}

export default usePositioningMap;
