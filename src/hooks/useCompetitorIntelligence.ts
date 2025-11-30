/**
 * useCompetitorIntelligence Hook
 *
 * React hook for the Gap Tab 2.0 competitor intelligence system.
 * Provides access to competitors, gaps, and scanning functionality
 * with streaming progress updates.
 *
 * Usage:
 * ```tsx
 * const {
 *   competitors,
 *   gaps,
 *   isLoading,
 *   selectedCompetitors,
 *   toggleCompetitor,
 *   addCompetitor,
 *   removeCompetitor,
 *   runDiscovery,
 *   rescanCompetitor
 * } = useCompetitorIntelligence(brandId, deepContext);
 * ```
 *
 * Created: 2025-11-28
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { competitorIntelligence } from '@/services/intelligence/competitor-intelligence.service';
import { competitorStreamingManager } from '@/services/intelligence/competitor-streaming-manager';
import { customerVoiceExtractor } from '@/services/intelligence/customer-voice-extractor.service';
import { battlecardGenerator } from '@/services/intelligence/battlecard-generator.service';
import type { CompetitorStreamEvent } from '@/services/intelligence/competitor-streaming-manager';
import {
  CACHE_ONLY_MODE,
  AUTO_DISCOVER_IF_EMPTY,
  shouldBlockApiCalls,
  MAX_CONCURRENT_SCANS
} from '@/config/gap-tab-cache.config';
import type {
  CompetitorProfile,
  CompetitorGap,
  CompetitorChipState,
  GapCardState,
  ScanStatus,
  CompetitorScanEvent,
  SegmentType,
  BusinessType,
  DiscoveredCompetitor,
  ScanPhase,
  EnhancedCompetitorInsights,
  CustomerVoice
} from '@/types/competitor-intelligence.types';
import type { DeepContext } from '@/types/synapse/deepContext.types';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Normalize competitor name for fuzzy matching
 * Handles variations like "Rasa" vs "Rasa.ai" vs "Rasa AI"
 */
function normalizeCompetitorName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.(ai|io|com|co|app)$/i, '')  // Remove common suffixes like .ai, .io
    .replace(/\s+(ai|inc|llc|ltd|corp)$/i, '') // Remove company suffixes
    .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric
    .trim();
}

// ============================================================================
// TYPES
// ============================================================================

interface UseCompetitorIntelligenceOptions {
  autoLoad?: boolean;
  autoDiscover?: boolean;
  /** Pre-discovered competitors from early discovery hook */
  preDiscoveredCompetitors?: CompetitorProfile[];
  /** Skip discovery if pre-discovered competitors exist */
  skipDiscoveryIfPreDiscovered?: boolean;
}

interface UseCompetitorIntelligenceResult {
  // Data
  competitors: CompetitorChipState[];
  gaps: GapCardState[];
  scanStatuses: ScanStatus[];

  // Enhanced Intelligence Data
  enhancedInsights: Map<string, Partial<EnhancedCompetitorInsights>>;
  customerVoiceByCompetitor: Map<string, CustomerVoice>;

  // State
  isLoading: boolean;
  isDiscovering: boolean;
  isScanning: boolean;
  isAnalyzing: boolean;
  error: string | null;

  // Phase tracking for progress UI
  scanPhase: ScanPhase;
  phaseLabel: string;
  overallProgress: number;
  competitorStatuses: Map<string, { name: string; status: string; progress: number }>;
  elapsedSeconds: number;

  // Selection
  selectedCompetitorIds: Set<string>;
  toggleCompetitor: (competitorId: string) => void;
  selectAllCompetitors: () => void;
  deselectAllCompetitors: () => void;

  // Actions
  runDiscovery: (forceBypassCache?: boolean) => Promise<void>;
  identifyCompetitor: (name: string, website?: string) => Promise<{
    found: boolean;
    competitor: DiscoveredCompetitor | null;
    alternatives?: DiscoveredCompetitor[];
    error?: string;
  }>;
  addCompetitor: (competitor: DiscoveredCompetitor, onProgress?: (stage: string, progress: number) => void) => Promise<void>;
  removeCompetitor: (competitorId: string) => Promise<void>;
  rescanCompetitor: (competitorId: string) => Promise<{ success: boolean; blocked?: '24h' | 'cache' }>;
  rescanAll: (forceBypassCache?: boolean) => Promise<void>;

  // Gap Actions
  dismissGap: (gapId: string) => Promise<void>;
  toggleGapStar: (gapId: string) => Promise<void>;
  expandGap: (gapId: string) => void;
  collapseGap: (gapId: string) => void;

  // Filtering
  filteredGaps: GapCardState[];

  // Refresh
  refresh: () => Promise<void>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useCompetitorIntelligence(
  brandId: string | null,
  deepContext: DeepContext | null,
  options: UseCompetitorIntelligenceOptions = {}
): UseCompetitorIntelligenceResult {
  const {
    autoLoad = true,
    autoDiscover = false,
    preDiscoveredCompetitors,
    skipDiscoveryIfPreDiscovered = true
  } = options;

  // Core state
  const [competitors, setCompetitors] = useState<CompetitorProfile[]>([]);
  const [gaps, setGaps] = useState<CompetitorGap[]>([]);
  const [scanStatuses, setScanStatuses] = useState<ScanStatus[]>([]);

  // Enhanced intelligence state
  const [enhancedInsights, setEnhancedInsights] = useState<Map<string, Partial<EnhancedCompetitorInsights>>>(new Map());
  const [customerVoiceByCompetitor, setCustomerVoiceByCompetitor] = useState<Map<string, CustomerVoice>>(new Map());

  // UI state
  const [selectedCompetitorIds, setSelectedCompetitorIds] = useState<Set<string>>(new Set());
  const [expandedGapIds, setExpandedGapIds] = useState<Set<string>>(new Set());
  const [generatingContentGapIds, setGeneratingContentGapIds] = useState<Set<string>>(new Set());

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phase tracking state for progress UI
  const [scanPhase, setScanPhase] = useState<ScanPhase>('idle');
  const [phaseLabel, setPhaseLabel] = useState('');
  const [overallProgress, setOverallProgress] = useState(0);
  const [competitorStatuses, setCompetitorStatuses] = useState<Map<string, { name: string; status: string; progress: number }>>(new Map());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  // Track initialization
  const initializedRef = useRef(false);
  const loadingRef = useRef(false);
  const discoveryCompletedRef = useRef(false); // Prevent re-discovery loop

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  useEffect(() => {
    const handleScanEvent = (event: CompetitorScanEvent) => {
      if (event.competitor_id) {
        setScanStatuses(prev => {
          const existing = prev.find(
            s => s.competitor_id === event.competitor_id &&
                 s.scan_type === event.type.replace('competitor-scan-', '')
          );

          if (existing) {
            return prev.map(s =>
              s.competitor_id === event.competitor_id
                ? {
                    ...s,
                    status: event.status === 'completed' ? 'success' :
                            event.status === 'error' ? 'error' :
                            event.status === 'started' ? 'loading' : 'pending',
                    progress: event.progress,
                    error_message: event.error
                  }
                : s
            );
          }

          return [
            ...prev,
            {
              competitor_id: event.competitor_id,
              competitor_name: event.competitor_name || '',
              scan_type: event.type.replace('competitor-scan-', '') as any,
              status: event.status === 'completed' ? 'success' :
                      event.status === 'error' ? 'error' :
                      event.status === 'started' ? 'loading' : 'pending',
              progress: event.progress,
              error_message: event.error,
              started_at: event.status === 'started' ? new Date().toISOString() : undefined,
              completed_at: event.status === 'completed' ? new Date().toISOString() : undefined
            }
          ];
        });
      }
    };

    competitorIntelligence.on('scan-event', handleScanEvent);

    return () => {
      competitorIntelligence.off('scan-event', handleScanEvent);
    };
  }, []);

  // Listen to streaming manager events for real-time UI updates
  useEffect(() => {
    const handleStreamEvent = (event: CompetitorStreamEvent) => {
      switch (event.type) {
        // Phase tracking events
        case 'phase-changed':
          if (event.phase) {
            setScanPhase(event.phase);
            setPhaseLabel(event.phase_label || '');
            setOverallProgress(event.overall_progress || 0);

            // Start timer on first non-idle phase
            if (event.phase !== 'idle' && event.phase !== 'complete' && !startTimeRef.current) {
              startTimeRef.current = Date.now();
            }

            // Reset timer on complete
            if (event.phase === 'complete' || event.phase === 'idle') {
              startTimeRef.current = null;
            }
          }
          break;

        case 'discovery-started':
          setIsDiscovering(true);
          setIsScanning(true);
          startTimeRef.current = Date.now();
          break;

        case 'analysis-started':
          setIsAnalyzing(true);
          break;

        case 'analysis-completed':
          setIsAnalyzing(false);
          break;

        case 'gap-saved':
          // Add gap to state as it arrives (real-time streaming)
          if (event.data) {
            setGaps(prev => [...prev, event.data as CompetitorGap]);
          }
          break;

        case 'scan-started':
          if (event.competitor_id) {
            setScanStatuses(prev => [
              ...prev.filter(s => s.competitor_id !== event.competitor_id),
              {
                competitor_id: event.competitor_id,
                competitor_name: event.competitor_name || '',
                scan_type: 'full' as any,
                status: 'loading',
                progress: 0,
                started_at: new Date().toISOString()
              }
            ]);
            // Update competitor statuses for UI
            setCompetitorStatuses(prev => {
              const newMap = new Map(prev);
              newMap.set(event.competitor_id!, {
                name: event.competitor_name || '',
                status: 'scanning',
                progress: 0
              });
              return newMap;
            });
          }
          break;

        case 'scan-progress':
          if (event.competitor_id) {
            setScanStatuses(prev => prev.map(s =>
              s.competitor_id === event.competitor_id
                ? { ...s, progress: event.progress }
                : s
            ));
            // Update competitor statuses for UI
            setCompetitorStatuses(prev => {
              const newMap = new Map(prev);
              const existing = newMap.get(event.competitor_id!);
              if (existing) {
                newMap.set(event.competitor_id!, { ...existing, progress: event.progress || 0 });
              }
              return newMap;
            });
          }
          break;

        case 'scan-completed':
          if (event.competitor_id) {
            setScanStatuses(prev => prev.map(s =>
              s.competitor_id === event.competitor_id
                ? { ...s, status: 'success', progress: 100, completed_at: new Date().toISOString() }
                : s
            ));
            // Update competitor statuses for UI
            setCompetitorStatuses(prev => {
              const newMap = new Map(prev);
              const existing = newMap.get(event.competitor_id!);
              if (existing) {
                newMap.set(event.competitor_id!, { ...existing, status: 'complete', progress: 100 });
              }
              return newMap;
            });
          }
          break;

        case 'customer-voice-ready':
          // Store customer voice data by competitor (from Reddit collector)
          if (event.competitor_id && event.data) {
            setCustomerVoiceByCompetitor(prev => {
              const newMap = new Map(prev);
              newMap.set(event.competitor_id!, event.data as CustomerVoice);
              return newMap;
            });
          }
          break;

        case 'competitor-voice-battlecard-ready':
          // Phase 13: Voice + Battlecard extraction complete
          // Sync enhanced insights which now contain voice and battlecard
          if (event.competitor_id) {
            const updatedInsights = competitorStreamingManager.getAllEnhancedInsights();
            setEnhancedInsights(new Map(updatedInsights));

            // Also sync customer voice from the enhanced insights
            const competitorInsight = updatedInsights.get(event.competitor_id);
            if (competitorInsight?.customer_voice) {
              setCustomerVoiceByCompetitor(prev => {
                const newMap = new Map(prev);
                newMap.set(event.competitor_id!, competitorInsight.customer_voice!);
                return newMap;
              });
            }
          }
          break;

        case 'enhanced-insights-ready':
          // Pull all enhanced insights from streaming manager
          const allInsights = competitorStreamingManager.getAllEnhancedInsights();
          setEnhancedInsights(new Map(allInsights));
          break;

        case 'all-scans-completed':
          setIsScanning(false);
          setIsDiscovering(false);
          setIsAnalyzing(false);
          startTimeRef.current = null;
          // Final sync of enhanced insights
          const finalInsights = competitorStreamingManager.getAllEnhancedInsights();
          setEnhancedInsights(new Map(finalInsights));
          break;

        case 'error':
          if (event.error) {
            setError(event.error);
            setScanPhase('error');
          }
          break;
      }
    };

    competitorStreamingManager.on('stream-event', handleStreamEvent);

    return () => {
      competitorStreamingManager.off('stream-event', handleStreamEvent);
    };
  }, []);

  // Timer effect for elapsed seconds
  useEffect(() => {
    if (!startTimeRef.current) return;

    const interval = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedSeconds((Date.now() - startTimeRef.current) / 1000);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isScanning, isDiscovering]);

  // ==========================================================================
  // DATA LOADING
  // ==========================================================================

  const loadData = useCallback(async () => {
    if (!brandId || loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Load competitors, gaps, customer voices, and battlecards in parallel
      const [loadedCompetitors, loadedGaps, loadedVoices, loadedBattlecards] = await Promise.all([
        competitorIntelligence.getCompetitors(brandId),
        competitorIntelligence.getGaps(brandId),
        customerVoiceExtractor.loadAllCustomerVoices(brandId).catch(() => new Map()),
        battlecardGenerator.loadAllBattlecards(brandId).catch(() => new Map())
      ]);

      // DEDUPE competitors using fuzzy name matching to handle "Rasa" vs "Rasa.ai" etc
      const seenNormalizedNames = new Set<string>();
      const dedupedCompetitors = loadedCompetitors.filter(c => {
        const normalizedName = normalizeCompetitorName(c.name);
        if (seenNormalizedNames.has(normalizedName)) {
          console.warn('[useCompetitorIntelligence] Filtering duplicate competitor:', c.name, '-> normalized:', normalizedName);
          return false;
        }
        seenNormalizedNames.add(normalizedName);
        return true;
      });

      setCompetitors(dedupedCompetitors);
      setGaps(loadedGaps);

      // Load customer voice data
      if (loadedVoices.size > 0) {
        setCustomerVoiceByCompetitor(loadedVoices);
        console.log('[useCompetitorIntelligence] Loaded customer voices for', loadedVoices.size, 'competitors');
      }

      // Load battlecard data into enhanced insights
      if (loadedBattlecards.size > 0) {
        setEnhancedInsights(prev => {
          const newMap = new Map(prev);
          loadedBattlecards.forEach((battlecard, competitorId) => {
            const existing = newMap.get(competitorId) || {};
            newMap.set(competitorId, { ...existing, battlecard });
          });
          return newMap;
        });
        console.log('[useCompetitorIntelligence] Loaded battlecards for', loadedBattlecards.size, 'competitors');
      }

      // Select all competitors by default
      setSelectedCompetitorIds(new Set(dedupedCompetitors.map(c => c.id)));

      console.log('[useCompetitorIntelligence] Loaded:', {
        competitors: dedupedCompetitors.length,
        gaps: loadedGaps.length,
        customerVoices: loadedVoices.size,
        battlecards: loadedBattlecards.size,
        duplicatesFiltered: loadedCompetitors.length - dedupedCompetitors.length
      });

    } catch (err) {
      console.error('[useCompetitorIntelligence] Load failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [brandId]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && brandId && !initializedRef.current) {
      initializedRef.current = true;
      loadData();
    }
  }, [autoLoad, brandId, loadData]);

  // Use pre-discovered competitors from early discovery hook (Task 6.7)
  useEffect(() => {
    if (preDiscoveredCompetitors && preDiscoveredCompetitors.length > 0 && competitors.length === 0) {
      console.log('[useCompetitorIntelligence] Using pre-discovered competitors:', preDiscoveredCompetitors.length);
      setCompetitors(preDiscoveredCompetitors);
      setSelectedCompetitorIds(new Set(preDiscoveredCompetitors.map(c => c.id)));
    }
  }, [preDiscoveredCompetitors, competitors.length]);

  // ==========================================================================
  // DISCOVERY
  // ==========================================================================

  const runDiscovery = useCallback(async (forceBypassCache = false) => {
    if (!brandId || !deepContext) return;

    // Block API calls if in cache-only mode (unless force bypass is set)
    if (!forceBypassCache && shouldBlockApiCalls()) {
      console.log('[useCompetitorIntelligence] API calls blocked - CACHE_ONLY_MODE is enabled');
      console.log('[useCompetitorIntelligence] Use Force Refresh button to bypass cache mode');
      return;
    }

    console.log('[useCompetitorIntelligence] Running discovery with forceBypassCache:', forceBypassCache);

    setIsDiscovering(true);
    setError(null);

    try {
      // STEP 1: Load cached competitors FIRST - show them immediately
      console.log('[useCompetitorIntelligence] Loading cached competitors from DB...');
      let existingCompetitors = await competitorIntelligence.getCompetitors(brandId);

      // Dedupe using fuzzy name matching (handles "Rasa" vs "Rasa.ai")
      const seenNormalized = new Set<string>();
      existingCompetitors = existingCompetitors.filter(c => {
        const normalized = normalizeCompetitorName(c.name);
        if (seenNormalized.has(normalized)) {
          console.log('[useCompetitorIntelligence] Filtering duplicate in runDiscovery:', c.name, '-> normalized:', normalized);
          return false;
        }
        seenNormalized.add(normalized);
        return true;
      });

      // Show cached competitors IMMEDIATELY in UI
      if (existingCompetitors.length > 0) {
        console.log('[useCompetitorIntelligence] Showing', existingCompetitors.length, 'CACHED competitors immediately');
        setCompetitors(existingCompetitors);
        setSelectedCompetitorIds(new Set(existingCompetitors.map(c => c.id)));
      }

      // STEP 2: Clean up DB (dedupe + clear old gaps)
      console.log('[useCompetitorIntelligence] Cleaning up duplicate competitors in DB...');
      const deduped = await competitorIntelligence.dedupeCompetitorsForBrand(brandId);
      if (deduped > 0) {
        console.log('[useCompetitorIntelligence] Removed', deduped, 'duplicate competitors from DB');
      }

      // Clear old gaps (they'll be re-extracted)
      console.log('[useCompetitorIntelligence] Clearing old GAPS only (keeping cached competitor scans)...');
      const deletedGaps = await competitorIntelligence.deleteGapsForBrand(brandId);
      console.log('[useCompetitorIntelligence] Cleared gaps:', { deletedGaps });

      // Clear gaps from UI (they'll stream in as extracted)
      setGaps([]);

      // Use STREAMING MANAGER for progressive gap rendering
      // This emits 'gap-saved' events that update UI immediately as each gap is extracted
      console.log('[useCompetitorIntelligence] Starting STREAMING analysis for progressive gap rendering...');
      console.log('[useCompetitorIntelligence] forceBypassCache:', forceBypassCache, '- will', forceBypassCache ? 'RUN FRESH DISCOVERY' : 'use existing competitors');

      const result = await competitorStreamingManager.runStreamingAnalysis(
        brandId,
        deepContext,
        {
          forceRefresh: forceBypassCache, // When force bypass, also force refresh scans
          // When forceBypassCache is true, DON'T pass existing competitors - run fresh multi-source discovery
          existingCompetitors: forceBypassCache ? undefined : (existingCompetitors.length > 0 ? existingCompetitors as CompetitorProfile[] : undefined)
        }
      );

      // Final state update (gaps already streamed in via events)
      // Only update competitors if we found some - preserve existing if discovery returned empty
      if (result.competitors.length > 0) {
        setCompetitors(result.competitors);
        setSelectedCompetitorIds(new Set(result.competitors.map(c => c.id)));
      } else if (existingCompetitors.length > 0) {
        console.log('[useCompetitorIntelligence] Discovery returned 0 competitors - preserving', existingCompetitors.length, 'existing');
        // Keep existing competitors in state (already set at line 513)
      }

      // Mark discovery as completed to prevent re-runs
      discoveryCompletedRef.current = true;

      console.log('[useCompetitorIntelligence] Streaming analysis complete:', {
        competitors: result.competitors.length,
        gaps: result.gaps.length,
        preservedExisting: result.competitors.length === 0 && existingCompetitors.length > 0
      });

    } catch (err) {
      console.error('[useCompetitorIntelligence] Discovery failed:', err);
      // Don't set error state - just log it, prevents page crash
      console.error('[useCompetitorIntelligence] Error details:', err instanceof Error ? err.stack : err);
    } finally {
      setIsDiscovering(false);
    }
  }, [brandId, deepContext]);

  // DISABLED: Auto-discover was causing infinite loops and page resets
  // Discovery should ONLY happen when user clicks Force Refresh button
  // The useEffect dependency on runDiscovery (which depends on deepContext) was causing re-renders
  /*
  useEffect(() => {
    // Skip if discovery already completed this session (prevents infinite loop)
    if (discoveryCompletedRef.current) {
      return;
    }

    // Skip if pre-discovered competitors are being used
    const hasPreDiscovered = preDiscoveredCompetitors && preDiscoveredCompetitors.length > 0;
    if (skipDiscoveryIfPreDiscovered && hasPreDiscovered) {
      console.log('[useCompetitorIntelligence] Skipping auto-discover - using pre-discovered competitors');
      discoveryCompletedRef.current = true; // Mark as done
      return;
    }

    if (
      autoDiscover &&
      AUTO_DISCOVER_IF_EMPTY &&
      !shouldBlockApiCalls() &&
      brandId &&
      deepContext &&
      !isLoading &&
      !isDiscovering &&
      competitors.length === 0 &&
      initializedRef.current
    ) {
      console.log('[useCompetitorIntelligence] Auto-discovering competitors for brand:', brandId);
      runDiscovery();
    }
  }, [autoDiscover, brandId, deepContext, isLoading, isDiscovering, competitors.length, runDiscovery, preDiscoveredCompetitors, skipDiscoveryIfPreDiscovered]);
  */

  // DISABLED: Auto-scan was also causing render loops due to competitors/gaps.length in deps
  // Scanning should ONLY happen when user clicks Force Refresh button
  /*
  const scanExistingRef = useRef(false);
  useEffect(() => {
    // ... auto-scan logic disabled
  }, [autoDiscover, brandId, deepContext, isLoading, isDiscovering, isScanning, competitors, gaps.length]);
  */

  // ==========================================================================
  // COMPETITOR ACTIONS
  // ==========================================================================

  /**
   * Identify a competitor by name/website using AI
   * Enhanced: Passes full brand context for more accurate identification
   * Returns enriched competitor info for user confirmation
   */
  const identifyCompetitor = useCallback(async (name: string, website?: string) => {
    if (!brandId || !deepContext) {
      return { found: false, competitor: null, error: 'No brand context' };
    }

    const brandProfile = deepContext.business?.profile;
    if (!brandProfile) {
      return { found: false, competitor: null, error: 'No brand profile' };
    }

    // Extract UVP data for enhanced identification
    const uvpData = deepContext.business?.uvp;
    const uniqueSolution = uvpData?.uniqueSolution?.statement || '';
    const keyBenefit = uvpData?.keyBenefit?.statement || '';
    const targetCustomer = (uvpData as any)?.targetCustomer || brandProfile.targetCustomer || '';

    // Get existing competitor names for caliber reference
    const existingCompetitorNames = competitors.map(c => c.name);

    // Detect segment from industry
    const segmentType: SegmentType = (brandProfile as any).segmentType || 'national';
    const businessType: BusinessType = (brandProfile as any).businessType || 'b2b';

    console.log('[useCompetitorIntelligence] Identifying with enhanced context:', {
      name,
      hasUVP: !!uniqueSolution,
      existingCompetitors: existingCompetitorNames.length,
      segmentType,
      businessType
    });

    return competitorIntelligence.identifyCompetitor({
      name,
      website,
      brand_name: brandProfile.name || '',
      brand_industry: brandProfile.industry || '',
      segment_type: segmentType,
      business_type: businessType,
      unique_solution: uniqueSolution,
      key_benefit: keyBenefit,
      target_customer: targetCustomer,
      existing_competitor_names: existingCompetitorNames
    });
  }, [brandId, deepContext, competitors]);

  /**
   * Add a confirmed competitor, scan it, and render insights
   * This is the new 3-step flow: identify -> confirm -> add & scan
   * Now includes Customer Voice + Battlecard extraction
   */
  const addCompetitor = useCallback(async (
    competitor: DiscoveredCompetitor,
    onProgress?: (stage: string, progress: number) => void
  ) => {
    if (!brandId || !deepContext) return;

    try {
      // Use the new addAndScanCompetitor method that handles everything
      const result = await competitorIntelligence.addAndScanCompetitor(
        brandId,
        competitor,
        deepContext,
        (stage, progress) => {
          // Scale progress to 0-70% for initial scan
          onProgress?.(stage, progress * 0.7);
        }
      );

      // Add the new competitor to state
      setCompetitors(prev => [...prev, result.profile]);
      setSelectedCompetitorIds(prev => new Set([...prev, result.profile.id]));

      // Add the new gaps to state
      setGaps(prev => [...prev, ...result.gaps]);

      console.log('[useCompetitorIntelligence] Added competitor with', result.gaps.length, 'gaps');

      // Now extract Customer Voice + Battlecard (Phase 13)
      onProgress?.('Extracting customer voice...', 75);

      const brandInfo = deepContext.business?.brand;
      const uvp = deepContext.business?.uvp;

      try {
        // Extract Customer Voice
        const voiceResult = await customerVoiceExtractor.extractCustomerVoice({
          brand_id: brandId,
          competitor_id: result.profile.id,
          competitor_name: result.profile.name,
          brand_name: brandInfo?.name || 'Our Brand',
          unique_solution: uvp?.uniqueSolution || '',
          key_benefit: uvp?.keyBenefit || '',
          target_customer: uvp?.targetCustomer || '',
          review_data: '' // Will trigger Perplexity fallback for customer complaints
        });

        if (voiceResult.success && voiceResult.data) {
          setCustomerVoiceByCompetitor(prev => {
            const newMap = new Map(prev);
            newMap.set(result.profile.id, voiceResult.data!);
            return newMap;
          });
          console.log('[useCompetitorIntelligence] Customer voice extracted for', result.profile.name);
        }

        // Generate Battlecard
        onProgress?.('Generating battlecard...', 85);

        const battlecardResult = await battlecardGenerator.generateBattlecard({
          brand_id: brandId,
          competitor_id: result.profile.id,
          competitor_name: result.profile.name,
          brand_name: brandInfo?.name || 'Our Brand',
          unique_solution: uvp?.uniqueSolution || '',
          key_benefit: uvp?.keyBenefit || '',
          target_customer: uvp?.targetCustomer || '',
          products: brandInfo?.products || [],
          competitor_positioning: result.profile.positioning_summary || undefined,
          gaps: result.gaps
        });

        if (battlecardResult.success && battlecardResult.data) {
          setEnhancedInsights(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(result.profile.id) || {};
            newMap.set(result.profile.id, { ...existing, battlecard: battlecardResult.data });
            return newMap;
          });
          console.log('[useCompetitorIntelligence] Battlecard generated for', result.profile.name);
        }

        onProgress?.('Complete!', 100);
      } catch (voiceErr) {
        console.warn('[useCompetitorIntelligence] Voice/Battlecard extraction failed (non-fatal):', voiceErr);
        onProgress?.('Complete!', 100);
      }
    } catch (err) {
      console.error('[useCompetitorIntelligence] Add failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to add competitor');
      throw err; // Re-throw so the dialog can handle it
    }
  }, [brandId, deepContext]);

  const removeCompetitor = useCallback(async (competitorId: string) => {
    const success = await competitorIntelligence.removeCompetitor(competitorId);

    if (success) {
      setCompetitors(prev => prev.filter(c => c.id !== competitorId));
      setSelectedCompetitorIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(competitorId);
        return newSet;
      });
      // Remove associated gaps
      setGaps(prev => prev.filter(g => !g.competitor_ids.includes(competitorId)));
    }
  }, []);

  /**
   * Rescan a single competitor - complete scan including Voice + Battlecard
   * Returns { success: boolean, blocked?: '24h' | 'cache' } to indicate status
   */
  const rescanCompetitor = useCallback(async (competitorId: string): Promise<{ success: boolean; blocked?: '24h' | 'cache' }> => {
    // Block API calls if in cache-only mode
    if (shouldBlockApiCalls()) {
      console.log('[useCompetitorIntelligence] Rescan blocked - CACHE_ONLY_MODE is enabled');
      return { success: false, blocked: 'cache' };
    }

    const competitor = competitors.find(c => c.id === competitorId);
    if (!competitor) return { success: false };

    // Check 24-hour limit - use updated_at as last scan time
    const lastScanTime = new Date(competitor.updated_at).getTime();
    const now = Date.now();
    const hoursSinceLastScan = (now - lastScanTime) / (1000 * 60 * 60);

    if (hoursSinceLastScan < 24) {
      const hoursRemaining = Math.ceil(24 - hoursSinceLastScan);
      console.log(`[useCompetitorIntelligence] Rescan blocked - ${hoursRemaining}h until next scan allowed for ${competitor.name}`);
      return { success: false, blocked: '24h' };
    }

    setIsScanning(true);

    try {
      const scans = await competitorIntelligence.scanCompetitor(competitor, true);

      // Re-extract gaps
      const extractedGaps = await competitorIntelligence.extractGaps({
        brand_id: competitor.brand_id,
        competitor_id: competitor.id,
        competitor_name: competitor.name,
        scan_data: {
          website: scans.find(s => s.scan_type === 'website'),
          reviews: scans.filter(s => s.scan_type.startsWith('reviews-')),
          perplexity: scans.find(s => s.scan_type === 'perplexity-research'),
          llm_analysis: scans.find(s => s.scan_type === 'llm-analysis')
        }
      });

      // Save and update gaps
      const savedGaps = await competitorIntelligence.saveGaps(
        competitor.brand_id,
        competitor.id,
        competitor.name,
        extractedGaps,
        scans.map(s => s.id)
      );

      // Merge new gaps with existing (replace old gaps for this competitor)
      setGaps(prev => {
        const otherGaps = prev.filter(g => !g.competitor_ids.includes(competitorId));
        return [...otherGaps, ...savedGaps];
      });

      // Extract Customer Voice + Battlecard (Phase 13)
      if (deepContext) {
        const brandInfo = deepContext.business?.brand;
        const uvp = deepContext.business?.uvp;

        try {
          // Extract Customer Voice
          console.log('[useCompetitorIntelligence] Extracting customer voice for', competitor.name);
          const voiceResult = await customerVoiceExtractor.extractCustomerVoice({
            brand_id: competitor.brand_id,
            competitor_id: competitor.id,
            competitor_name: competitor.name,
            brand_name: brandInfo?.name || 'Our Brand',
            unique_solution: uvp?.uniqueSolution || '',
            key_benefit: uvp?.keyBenefit || '',
            target_customer: uvp?.targetCustomer || '',
            review_data: '' // Will trigger Perplexity fallback
          });

          if (voiceResult.success && voiceResult.data) {
            setCustomerVoiceByCompetitor(prev => {
              const newMap = new Map(prev);
              newMap.set(competitor.id, voiceResult.data!);
              return newMap;
            });
            console.log('[useCompetitorIntelligence] Customer voice extracted for', competitor.name);
          }

          // Generate Battlecard
          console.log('[useCompetitorIntelligence] Generating battlecard for', competitor.name);
          const battlecardResult = await battlecardGenerator.generateBattlecard({
            brand_id: competitor.brand_id,
            competitor_id: competitor.id,
            competitor_name: competitor.name,
            brand_name: brandInfo?.name || 'Our Brand',
            unique_solution: uvp?.uniqueSolution || '',
            key_benefit: uvp?.keyBenefit || '',
            target_customer: uvp?.targetCustomer || '',
            products: brandInfo?.products || [],
            competitor_positioning: competitor.positioning_summary || undefined,
            gaps: savedGaps
          });

          if (battlecardResult.success && battlecardResult.data) {
            setEnhancedInsights(prev => {
              const newMap = new Map(prev);
              const existing = newMap.get(competitor.id) || {};
              newMap.set(competitor.id, { ...existing, battlecard: battlecardResult.data });
              return newMap;
            });
            console.log('[useCompetitorIntelligence] Battlecard generated for', competitor.name);
          }
        } catch (voiceErr) {
          console.warn('[useCompetitorIntelligence] Voice/Battlecard extraction failed (non-fatal):', voiceErr);
        }
      }

      // Update the competitor's updated_at in local state to reflect the new scan time
      setCompetitors(prev => prev.map(c =>
        c.id === competitorId
          ? { ...c, updated_at: new Date().toISOString() }
          : c
      ));

      return { success: true };
    } catch (err) {
      console.error('[useCompetitorIntelligence] Rescan failed:', err);
      setError(err instanceof Error ? err.message : 'Rescan failed');
      return { success: false };
    } finally {
      setIsScanning(false);
    }
  }, [competitors, deepContext]);

  const rescanAll = useCallback(async (forceBypassCache = false) => {
    // Block API calls if in cache-only mode (unless force bypass is set)
    if (!forceBypassCache && shouldBlockApiCalls()) {
      console.log('[useCompetitorIntelligence] Rescan all blocked - CACHE_ONLY_MODE is enabled');
      console.log('[useCompetitorIntelligence] Use Force Refresh button to bypass cache mode');
      return;
    }

    if (!brandId || !deepContext || competitors.length === 0) {
      console.log('[useCompetitorIntelligence] Cannot rescan - missing brandId, deepContext, or competitors');
      return;
    }

    console.log('[useCompetitorIntelligence] Starting rescan with forceBypassCache:', forceBypassCache);

    setIsScanning(true);
    setError(null);

    // Clear existing gaps from UI state
    setGaps([]);

    console.log('[useCompetitorIntelligence] Starting PARALLEL rescan via streaming manager for', competitors.length, 'competitors');

    try {
      // DELETE OLD DATA FROM DATABASE before rescanning (critical for fresh data)
      console.log('[useCompetitorIntelligence] Deleting old gaps and scans from database...');
      const [deletedGaps, deletedScans] = await Promise.all([
        competitorIntelligence.deleteGapsForBrand(brandId),
        competitorIntelligence.deleteScansForBrand(brandId)
      ]);
      console.log('[useCompetitorIntelligence] Cleared database:', { deletedGaps, deletedScans });

      // Use the streaming manager for parallel scanning with real-time updates
      // The streaming manager events (gap-saved, scan-progress, etc.) will update state automatically
      const result = await competitorStreamingManager.runStreamingAnalysis(
        brandId,
        deepContext,
        {
          forceRefresh: true,
          existingCompetitors: competitors as CompetitorProfile[]
        }
      );

      // Update competitors and gaps with final results
      setCompetitors(result.competitors);
      // Note: gaps are already streamed in via 'gap-saved' events, but we ensure final state is correct
      setGaps(result.gaps);

      console.log('[useCompetitorIntelligence] Parallel rescan complete:', {
        competitors: result.competitors.length,
        gaps: result.gaps.length
      });
    } catch (err) {
      console.error('[useCompetitorIntelligence] Parallel rescan failed:', err);
      setError(err instanceof Error ? err.message : 'Rescan failed');
    } finally {
      setIsScanning(false);
    }
  }, [brandId, deepContext, competitors]);

  // ==========================================================================
  // SELECTION
  // ==========================================================================

  const toggleCompetitor = useCallback((competitorId: string) => {
    setSelectedCompetitorIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(competitorId)) {
        newSet.delete(competitorId);
      } else {
        newSet.add(competitorId);
      }
      return newSet;
    });
  }, []);

  const selectAllCompetitors = useCallback(() => {
    setSelectedCompetitorIds(new Set(competitors.map(c => c.id)));
  }, [competitors]);

  const deselectAllCompetitors = useCallback(() => {
    setSelectedCompetitorIds(new Set());
  }, []);

  // ==========================================================================
  // GAP ACTIONS
  // ==========================================================================

  const dismissGap = useCallback(async (gapId: string) => {
    const success = await competitorIntelligence.dismissGap(gapId);
    if (success) {
      setGaps(prev => prev.filter(g => g.id !== gapId));
    }
  }, []);

  const toggleGapStar = useCallback(async (gapId: string) => {
    const gap = gaps.find(g => g.id === gapId);
    if (!gap) return;

    const newStarred = !gap.is_starred;
    const success = await competitorIntelligence.toggleGapStar(gapId, newStarred);

    if (success) {
      setGaps(prev => prev.map(g =>
        g.id === gapId ? { ...g, is_starred: newStarred } : g
      ));
    }
  }, [gaps]);

  const expandGap = useCallback((gapId: string) => {
    setExpandedGapIds(prev => new Set([...prev, gapId]));
  }, []);

  const collapseGap = useCallback((gapId: string) => {
    setExpandedGapIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(gapId);
      return newSet;
    });
  }, []);

  // ==========================================================================
  // DERIVED STATE
  // ==========================================================================

  // Convert competitors to chip states
  const competitorChips: CompetitorChipState[] = competitors.map(c => ({
    id: c.id,
    name: c.name,
    logo_url: c.logo_url,
    is_selected: selectedCompetitorIds.has(c.id),
    is_scanning: scanStatuses.some(
      s => s.competitor_id === c.id && s.status === 'loading'
    ),
    scan_progress: scanStatuses
      .filter(s => s.competitor_id === c.id)
      .reduce((acc, s) => acc + (s.progress || 0), 0) / Math.max(
        scanStatuses.filter(s => s.competitor_id === c.id).length,
        1
      ),
    last_scanned: c.updated_at,
    gap_count: gaps.filter(g => g.competitor_ids.includes(c.id)).length
  }));

  // Convert gaps to card states
  const gapCards: GapCardState[] = gaps.map(g => ({
    ...g,
    is_expanded: expandedGapIds.has(g.id),
    is_generating_content: generatingContentGapIds.has(g.id)
  }));

  // Filter gaps by selected competitors
  const filteredGaps = selectedCompetitorIds.size === 0
    ? gapCards
    : gapCards.filter(g =>
        g.competitor_ids.some(id => selectedCompetitorIds.has(id))
      );

  // ==========================================================================
  // REFRESH
  // ==========================================================================

  const refresh = useCallback(async () => {
    initializedRef.current = false;
    await loadData();
  }, [loadData]);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // Data
    competitors: competitorChips,
    gaps: gapCards,
    scanStatuses,

    // Enhanced Intelligence Data
    enhancedInsights,
    customerVoiceByCompetitor,

    // State
    isLoading,
    isDiscovering,
    isScanning,
    isAnalyzing,
    error,

    // Phase tracking for progress UI
    scanPhase,
    phaseLabel,
    overallProgress,
    competitorStatuses,
    elapsedSeconds,

    // Selection
    selectedCompetitorIds,
    toggleCompetitor,
    selectAllCompetitors,
    deselectAllCompetitors,

    // Actions
    runDiscovery,
    identifyCompetitor,
    addCompetitor,
    removeCompetitor,
    rescanCompetitor,
    rescanAll,

    // Gap Actions
    dismissGap,
    toggleGapStar,
    expandGap,
    collapseGap,

    // Filtering
    filteredGaps,

    // Refresh
    refresh
  };
}

export default useCompetitorIntelligence;
