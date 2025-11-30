/**
 * Competitor Streaming Manager
 *
 * EventEmitter-based service for streaming competitor intelligence updates.
 * Follows the Streaming Architecture guide - each update emits independently.
 *
 * Features:
 * - Real-time gap card updates as they're extracted
 * - Competitor discovery streaming
 * - Scan progress tracking per competitor
 * - Non-blocking UVP integration
 *
 * Created: 2025-11-28
 */

import { EventEmitter } from 'events';
import { competitorIntelligence } from './competitor-intelligence.service';
import { multiSourceValidator } from './multi-source-validator.service';
import {
  MAX_CONCURRENT_SCANS,
  GAP_CONFIDENCE_THRESHOLD
} from '@/config/gap-tab-cache.config';
import type {
  CompetitorProfile,
  CompetitorGap,
  ExtractedGap,
  DiscoveredCompetitor,
  ScanPhase,
  EnhancedCompetitorInsights,
  CustomerVoice,
  SEOMetrics
} from '@/types/competitor-intelligence.types';
import type { DeepContext } from '@/types/synapse/deepContext.types';

// Import collectors for enhanced intelligence
import { redditCollector } from './collectors/reddit-collector';
import { semrushCollector } from './collectors/semrush-collector';
import { youtubeCollector } from './collectors/youtube-collector';
import { serperCollector } from './collectors/serper-collector';
import { integrationGapCollector } from './collectors/integration-gap-collector';
import { talentSignalCollector } from './collectors/talent-signal-collector';
import type { EnhancedCollectorResults } from './collectors/types';

// Import multi-source merger and collector selector
import { multiSourceMerger } from './multi-source-merger.service';
import { collectorSelector } from './collector-selector.service';

// Import Customer Voice and Battlecard services (Phase 13)
import { customerVoiceExtractor } from './customer-voice-extractor.service';
import { battlecardGenerator } from './battlecard-generator.service';

// ============================================================================
// EVENT TYPES
// ============================================================================

export type CompetitorStreamEventType =
  | 'phase-changed'        // Phase transition event
  | 'discovery-started'
  | 'competitor-found'
  | 'discovery-completed'
  | 'validation-started'
  | 'competitor-validated'
  | 'validation-completed'
  | 'scan-started'
  | 'scan-progress'
  | 'scan-completed'
  | 'extraction-started'   // Gap extraction phase
  | 'gap-extracted'
  | 'gap-saved'
  | 'collector-started'    // Enhanced collector started
  | 'collector-completed'  // Enhanced collector completed
  | 'customer-voice-ready' // Customer voice data available
  | 'seo-metrics-ready'    // SEO metrics available
  | 'competitor-voice-battlecard-ready' // Phase 13: Voice + Battlecard for competitor
  | 'analysis-started'     // Strategic analysis phase
  | 'analysis-progress'    // Analysis progress
  | 'analysis-completed'   // Analysis complete
  | 'enhanced-insights-ready' // All enhanced insights available
  | 'all-scans-completed'
  | 'error';

export interface CompetitorStreamEvent {
  type: CompetitorStreamEventType;
  phase?: ScanPhase;       // NEW: Current phase
  phase_label?: string;    // NEW: Human-readable phase label
  competitor_id?: string;
  competitor_name?: string;
  data?: unknown;
  progress?: number;
  overall_progress?: number; // NEW: Overall progress 0-100
  error?: string;
  timestamp: number;
}

export interface StreamingManagerStatus {
  phase: ScanPhase;
  isDiscovering: boolean;
  isScanning: boolean;
  isAnalyzing: boolean;
  competitorsFound: number;
  competitorsScanned: number;
  totalCompetitors: number;
  gapsExtracted: number;
  insightsGenerated: number;
  startTime: number | null;
  scanProgress: Map<string, number>;
  competitorStatuses: Map<string, { name: string; status: string; progress: number }>;
  // Enhanced collector results per competitor
  enhancedInsights: Map<string, Partial<EnhancedCompetitorInsights>>;
}

// ============================================================================
// STREAMING MANAGER CLASS
// ============================================================================

class CompetitorStreamingManager extends EventEmitter {
  private status: StreamingManagerStatus = {
    phase: 'idle',
    isDiscovering: false,
    isScanning: false,
    isAnalyzing: false,
    competitorsFound: 0,
    competitorsScanned: 0,
    totalCompetitors: 0,
    gapsExtracted: 0,
    insightsGenerated: 0,
    startTime: null,
    scanProgress: new Map(),
    competitorStatuses: new Map(),
    enhancedInsights: new Map()
  };

  private abortController: AbortController | null = null;

  constructor() {
    super();
    this.setMaxListeners(50);
  }

  // ==========================================================================
  // EVENT EMISSION HELPERS
  // ==========================================================================

  private emitEvent(event: Omit<CompetitorStreamEvent, 'timestamp'>): void {
    const fullEvent: CompetitorStreamEvent = {
      ...event,
      phase: this.status.phase,
      timestamp: Date.now()
    };
    this.emit('stream-event', fullEvent);
    this.emit(event.type, fullEvent);
    console.log('[CompetitorStreaming]', event.type, event.phase || '', event.competitor_name || '', event.data ? '(data attached)' : '');
  }

  /**
   * Emit a phase change event with proper labels
   */
  private emitPhaseChange(phase: ScanPhase, label: string, overallProgress: number): void {
    this.status.phase = phase;
    this.emitEvent({
      type: 'phase-changed',
      phase,
      phase_label: label,
      overall_progress: overallProgress
    });
    console.log(`[CompetitorStreaming] ========== PHASE: ${phase.toUpperCase()} (${overallProgress}%) ==========`);
  }

  /**
   * Update competitor status for UI display
   */
  private updateCompetitorStatus(id: string, name: string, status: string, progress: number): void {
    this.status.competitorStatuses.set(id, { name, status, progress });
  }

  /**
   * Calculate elapsed time in seconds
   */
  private getElapsedSeconds(): number {
    if (!this.status.startTime) return 0;
    return (Date.now() - this.status.startTime) / 1000;
  }

  // ==========================================================================
  // ENHANCED COLLECTORS
  // ==========================================================================

  /**
   * Run enhanced collectors for a competitor
   * Uses collector selector to determine which collectors to run based on business category
   * All selected collectors run in parallel for maximum speed
   */
  private async runEnhancedCollectors(
    competitor: CompetitorProfile,
    industry: string,
    options: { category?: string } = {}
  ): Promise<EnhancedCollectorResults> {
    const startTime = Date.now();
    console.log(`[CompetitorStreaming] Running enhanced collectors for ${competitor.name}`);

    // Detect business category for smart collector selection
    const businessCategory = options.category
      ? options.category as any
      : collectorSelector.detectCategory(competitor);

    // Get optimized collector selection based on category
    const selection = collectorSelector.select({
      category: businessCategory,
      max_credits: 10,
      prioritize_speed: false
    });

    console.log(`[CompetitorStreaming] Category: ${businessCategory}, Selected: ${selection.selected_collectors.join(', ')}`);

    this.emitEvent({
      type: 'collector-started',
      competitor_id: competitor.id,
      competitor_name: competitor.name,
      data: {
        collectors: selection.selected_collectors,
        category: businessCategory,
        rationale: selection.selection_rationale
      }
    });

    // Build collector promises based on selection
    const collectorPromises: Promise<any>[] = [];
    const collectorNames: string[] = [];

    if (selection.selected_collectors.includes('reddit')) {
      collectorPromises.push(
        redditCollector.collect(competitor.name, industry, { limit: 15, timeFilter: 'month' })
      );
      collectorNames.push('reddit');
    }

    if (selection.selected_collectors.includes('semrush')) {
      collectorPromises.push(
        competitor.website_url
          ? semrushCollector.collect(competitor.website_url)
          : Promise.resolve({ success: false, source: 'semrush', timestamp: new Date().toISOString(), data: { seo_metrics: { organic_traffic: 0, keywords: 0, backlinks: 0, authority_score: 0 }, top_keywords: [], keyword_gaps: [] }, error: 'No website URL' })
      );
      collectorNames.push('semrush');
    }

    if (selection.selected_collectors.includes('youtube')) {
      collectorPromises.push(
        youtubeCollector.collect(competitor.name, { maxVideos: 15 })
      );
      collectorNames.push('youtube');
    }

    if (selection.selected_collectors.includes('serper')) {
      collectorPromises.push(
        serperCollector.collect(competitor.name, competitor.website_url, { includeNews: true, includeAds: true })
      );
      collectorNames.push('serper');
    }

    if (selection.selected_collectors.includes('integrationGap')) {
      collectorPromises.push(
        integrationGapCollector.collect(competitor.name, industry)
      );
      collectorNames.push('integrationGap');
    }

    if (selection.selected_collectors.includes('talentSignal')) {
      collectorPromises.push(
        talentSignalCollector.collect(competitor.name)
      );
      collectorNames.push('talentSignal');
    }

    // Run ALL selected collectors in parallel
    const collectorResults = await Promise.allSettled(collectorPromises);

    const results: EnhancedCollectorResults = {
      collected_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime
    };

    // Process results by mapping to collector names
    collectorResults.forEach((result, index) => {
      const name = collectorNames[index];
      if (result.status === 'fulfilled' && result.value.success) {
        if (name === 'reddit') {
          results.reddit = result.value;
          this.emitEvent({
            type: 'customer-voice-ready',
            competitor_id: competitor.id,
            competitor_name: competitor.name,
            data: result.value.data.customer_voice
          });
        } else if (name === 'semrush') {
          results.semrush = result.value;
          this.emitEvent({
            type: 'seo-metrics-ready',
            competitor_id: competitor.id,
            competitor_name: competitor.name,
            data: result.value.data.seo_metrics
          });
        } else if (name === 'youtube') {
          results.youtube = result.value;
        } else if (name === 'serper') {
          results.serper = result.value;
        } else if (name === 'integrationGap') {
          results.integrationGap = result.value;
        } else if (name === 'talentSignal') {
          results.talentSignal = result.value;
        }
      }
    });

    this.emitEvent({
      type: 'collector-completed',
      competitor_id: competitor.id,
      competitor_name: competitor.name,
      data: {
        duration_ms: results.duration_ms,
        reddit_success: results.reddit?.success || false,
        semrush_success: results.semrush?.success || false,
        youtube_success: results.youtube?.success || false,
        serper_success: results.serper?.success || false,
        integrationGap_success: results.integrationGap?.success || false,
        talentSignal_success: results.talentSignal?.success || false,
        selected_collectors: selection.selected_collectors,
        skipped_collectors: selection.skipped_collectors
      }
    });

    console.log(`[CompetitorStreaming] Enhanced collectors completed for ${competitor.name} in ${results.duration_ms}ms`);
    return results;
  }

  /**
   * Build enhanced insights from collector results
   */
  private buildEnhancedInsights(
    competitor: CompetitorProfile,
    collectorResults: EnhancedCollectorResults,
    gaps: CompetitorGap[]
  ): Partial<EnhancedCompetitorInsights> {
    const insights: Partial<EnhancedCompetitorInsights> = {
      profile: competitor,
      gaps
    };

    // Add customer voice from Reddit
    if (collectorResults.reddit?.success) {
      insights.customer_voice = collectorResults.reddit.data.customer_voice;
    }

    // Add SEO metrics from SEMrush
    if (collectorResults.semrush?.success) {
      insights.seo_metrics = collectorResults.semrush.data.seo_metrics;
    }

    // Add feature velocity from YouTube
    if (collectorResults.youtube?.success && collectorResults.youtube.data.feature_velocity_signals) {
      insights.feature_velocity = {
        cadence: collectorResults.youtube.data.feature_velocity_signals.cadence || 'quarterly',
        momentum: collectorResults.youtube.data.feature_velocity_signals.momentum || 'steady',
        recent_releases: collectorResults.youtube.data.feature_velocity_signals.recent_releases || [],
        innovation_gaps: collectorResults.youtube.data.feature_velocity_signals.innovation_gaps || []
      };
    }

    // Add integration gap data
    if (collectorResults.integrationGap?.success) {
      (insights as any).integration_gaps = {
        issues: collectorResults.integrationGap.data.integration_issues,
        workflow_frictions: collectorResults.integrationGap.data.workflow_frictions,
        missing_integrations: collectorResults.integrationGap.data.missing_integrations,
        health_score: collectorResults.integrationGap.data.health_score,
        ecosystem_gaps: collectorResults.integrationGap.data.ecosystem_gaps
      };
    }

    // Add talent signal data
    if (collectorResults.talentSignal?.success) {
      (insights as any).talent_signals = {
        hiring_trends: collectorResults.talentSignal.data.hiring_trends,
        technology_signals: collectorResults.talentSignal.data.technology_signals,
        expansion_signals: collectorResults.talentSignal.data.expansion_signals,
        hiring_velocity: collectorResults.talentSignal.data.hiring_velocity,
        strategic_insights: collectorResults.talentSignal.data.strategic_insights
      };
    }

    // Add news and SERP data from Serper
    if (collectorResults.serper?.success) {
      (insights as any).news_intel = {
        news_mentions: collectorResults.serper.data.news_mentions,
        serp_features: collectorResults.serper.data.serp_features,
        competitor_ads: collectorResults.serper.data.competitor_ads
      };
    }

    // Store in status for UI access
    this.status.enhancedInsights.set(competitor.id, insights);

    return insights;
  }

  /**
   * Detect market-wide gaps that appear across multiple competitors
   * Uses fuzzy matching on gap titles to find similar gaps
   * Updates competitor_ids and competitor_names arrays on matching gaps
   */
  private detectMarketWideGaps(gaps: CompetitorGap[]): void {
    if (gaps.length < 2) return;

    console.log('[CompetitorStreaming] Detecting market-wide gaps from', gaps.length, 'total gaps');

    // Group gaps by similarity
    const gapGroups: Map<string, CompetitorGap[]> = new Map();

    for (const gap of gaps) {
      // Normalize title for comparison
      const normalizedTitle = this.normalizeGapTitle(gap.title);

      // Try to find an existing group with similar title
      let foundGroup = false;
      for (const [groupKey, groupGaps] of gapGroups) {
        if (this.areGapsSimilar(normalizedTitle, groupKey)) {
          groupGaps.push(gap);
          foundGroup = true;
          break;
        }
      }

      if (!foundGroup) {
        gapGroups.set(normalizedTitle, [gap]);
      }
    }

    // For groups with 2+ gaps, merge competitor_ids
    let marketWideCount = 0;
    for (const [_, groupGaps] of gapGroups) {
      if (groupGaps.length >= 2) {
        // Collect all competitor IDs and names from the group
        const allCompetitorIds = new Set<string>();
        const allCompetitorNames = new Set<string>();

        for (const gap of groupGaps) {
          gap.competitor_ids.forEach(id => allCompetitorIds.add(id));
          gap.competitor_names.forEach(name => allCompetitorNames.add(name));
        }

        // Update each gap in the group with merged IDs/names
        for (const gap of groupGaps) {
          gap.competitor_ids = Array.from(allCompetitorIds);
          gap.competitor_names = Array.from(allCompetitorNames);
        }

        marketWideCount++;
      }
    }

    console.log('[CompetitorStreaming] Found', marketWideCount, 'market-wide gap groups (2+ competitors)');
  }

  /**
   * Normalize gap title for comparison
   */
  private normalizeGapTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ')        // Normalize whitespace
      .trim();
  }

  /**
   * Check if two normalized gap titles are similar enough to be the same gap
   * Uses simple keyword overlap
   */
  private areGapsSimilar(title1: string, title2: string): boolean {
    const words1 = new Set(title1.split(' ').filter(w => w.length > 3));
    const words2 = new Set(title2.split(' ').filter(w => w.length > 3));

    if (words1.size === 0 || words2.size === 0) return false;

    // Count overlap
    let overlap = 0;
    for (const word of words1) {
      if (words2.has(word)) overlap++;
    }

    // Require at least 50% keyword overlap
    const threshold = Math.min(words1.size, words2.size) * 0.5;
    return overlap >= threshold;
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Get current streaming status
   */
  getStatus(): StreamingManagerStatus {
    return { ...this.status };
  }

  /**
   * Get enhanced insights for a specific competitor
   */
  getEnhancedInsights(competitorId: string): Partial<EnhancedCompetitorInsights> | undefined {
    return this.status.enhancedInsights.get(competitorId);
  }

  /**
   * Get all enhanced insights
   */
  getAllEnhancedInsights(): Map<string, Partial<EnhancedCompetitorInsights>> {
    return new Map(this.status.enhancedInsights);
  }

  /**
   * Abort any running operations
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.status.isDiscovering = false;
    this.status.isScanning = false;
  }

  /**
   * Run full competitor intelligence pipeline with streaming updates
   * Can be triggered during UVP process (non-blocking)
   */
  async runStreamingAnalysis(
    brandId: string,
    deepContext: DeepContext,
    options: {
      forceRefresh?: boolean;
      existingCompetitors?: CompetitorProfile[];
    } = {}
  ): Promise<{
    competitors: CompetitorProfile[];
    gaps: CompetitorGap[];
  }> {
    this.abortController = new AbortController();
    const startTime = performance.now();

    this.status = {
      phase: 'idle',
      isDiscovering: true,
      isScanning: false,
      isAnalyzing: false,
      competitorsFound: 0,
      competitorsScanned: 0,
      totalCompetitors: 0,
      gapsExtracted: 0,
      insightsGenerated: 0,
      startTime: Date.now(),
      scanProgress: new Map(),
      competitorStatuses: new Map(),
      enhancedInsights: new Map()
    };

    const allGaps: CompetitorGap[] = [];
    let competitors: CompetitorProfile[] = options.existingCompetitors || [];

    try {
      // PHASE 1: DISCOVER COMPETITORS (if needed)
      if (competitors.length === 0) {
        this.emitPhaseChange('discovering', 'Finding competitors in your market', 5);
        this.emitEvent({ type: 'discovery-started' });

        const brandProfile = deepContext.business?.profile;
        if (!brandProfile) {
          throw new Error('Brand profile not available in deepContext');
        }

        // Extract UVP data for enhanced discovery
        const uvpData = deepContext.business?.uvp;
        const uniqueSolution = uvpData?.uniqueSolution?.statement || '';
        const keyBenefit = uvpData?.keyBenefit?.statement || '';
        const targetCustomer = (uvpData as any)?.targetCustomer || (brandProfile as any)?.targetCustomer || '';

        console.log('[CompetitorStreaming] Using enhanced discovery with UVP context:', {
          hasUVP: !!uniqueSolution,
          hasKeyBenefit: !!keyBenefit,
          hasTargetCustomer: !!targetCustomer
        });

        // Log what we're actually sending to discovery
        console.log('[CompetitorStreaming] Discovery params:', {
          brand_name: brandProfile.name,
          industry: brandProfile.industry,
          website: brandProfile.website,
          unique_solution: uniqueSolution?.substring(0, 50) + '...',
          key_benefit: keyBenefit?.substring(0, 50) + '...'
        });

        // Run multi-source discovery in parallel for better coverage
        const [perplexityResults, serperResults, redditResults] = await Promise.allSettled([
          // Primary: Perplexity discovery
          competitorIntelligence.discoverCompetitors({
            brand_id: brandId,
            brand_name: brandProfile.name || '',
            industry: brandProfile.industry || '',
            website_url: brandProfile.website || '',
            location: brandProfile.location?.city
              ? `${brandProfile.location.city}, ${brandProfile.location.state}`
              : undefined,
            unique_solution: uniqueSolution,
            key_benefit: keyBenefit,
            brand_description: (brandProfile as any)?.description || '',
            brand_website: brandProfile.website || '',
            target_customer: targetCustomer,
            existing_competitor_names: []
          }),
          // Secondary: Serper "alternatives" search
          serperCollector.collect(brandProfile.name || '', brandProfile.website).then(result => {
            if (result.success && result.data.related_searches) {
              // Extract competitor names from related searches
              return result.data.related_searches
                .filter(s => s.toLowerCase().includes('vs') || s.toLowerCase().includes('alternative'))
                .map(s => {
                  const match = s.match(/(\w+)\s+vs\s+(\w+)/i);
                  return match ? { name: match[2], domain: undefined } : null;
                })
                .filter(Boolean);
            }
            return [];
          }).catch(() => []),
          // Tertiary: Reddit competitor mentions
          redditCollector.collect(brandProfile.name || '', brandProfile.industry || '', { limit: 20 }).then(result => {
            if (result.success) {
              // Look for competitor mentions in Reddit discussions
              const mentions: { name: string; domain?: string }[] = [];
              // Extract from switching triggers which often mention competitors
              result.data.customer_voice?.switching_triggers?.forEach(trigger => {
                const competitorPattern = /switched?\s+(?:to|from)\s+(\w+)/gi;
                const matches = trigger.matchAll(competitorPattern);
                for (const match of matches) {
                  if (match[1] && match[1].length > 2) {
                    mentions.push({ name: match[1] });
                  }
                }
              });
              return mentions;
            }
            return [];
          }).catch(() => [])
        ]);

        // Merge results from all sources
        const discoverySourcesData = [];

        // Add Perplexity results (primary)
        if (perplexityResults.status === 'fulfilled') {
          discoverySourcesData.push({
            name: 'perplexity' as const,
            competitors: perplexityResults.value.map(c => ({
              name: c.name,
              domain: c.website_url,
              description: c.description,
              category: c.positioning?.tier
            })),
            timestamp: new Date().toISOString()
          });
        }

        // Add Serper results (secondary)
        if (serperResults.status === 'fulfilled' && Array.isArray(serperResults.value)) {
          discoverySourcesData.push({
            name: 'serper' as const,
            competitors: serperResults.value.filter((c): c is { name: string; domain?: string } => c !== null),
            timestamp: new Date().toISOString()
          });
        }

        // Add Reddit results (tertiary)
        if (redditResults.status === 'fulfilled' && Array.isArray(redditResults.value)) {
          discoverySourcesData.push({
            name: 'reddit' as const,
            competitors: redditResults.value,
            timestamp: new Date().toISOString()
          });
        }

        // Merge and deduplicate using multi-source merger
        let discovered: DiscoveredCompetitor[];
        if (discoverySourcesData.length > 1) {
          console.log('[CompetitorStreaming] Merging from', discoverySourcesData.length, 'sources');
          const mergeResult = multiSourceMerger.merge(discoverySourcesData);
          console.log('[CompetitorStreaming] Merge stats:', mergeResult.merge_stats);

          // Convert merged results back to DiscoveredCompetitor format
          // Lower threshold to 0.2 since single-source discoveries start at ~0.3
          discovered = mergeResult.competitors
            .filter(c => c.confidence_score >= 0.2) // Accept low confidence since single source = ~0.3
            .slice(0, 10) // Max 10 competitors
            .map(c => ({
              name: c.name,
              website_url: c.domain,
              description: c.description,
              confidence: c.confidence_score,
              discovery_source: c.sources.join(', '),
              positioning: c.category ? { tier: c.category } : undefined
            } as DiscoveredCompetitor));

          // Fallback to Perplexity results if merge filters everything out
          if (discovered.length === 0 && perplexityResults.status === 'fulfilled') {
            console.log('[CompetitorStreaming] Merge filtered all - falling back to Perplexity results');
            discovered = perplexityResults.value.slice(0, 10);
          }
        } else if (perplexityResults.status === 'fulfilled') {
          // Fallback to just Perplexity if other sources failed
          discovered = perplexityResults.value;
        } else {
          discovered = [];
        }

        // Stream each discovered competitor
        for (const competitor of discovered) {
          this.status.competitorsFound++;
          this.emitEvent({
            type: 'competitor-found',
            competitor_name: competitor.name,
            data: competitor
          });
        }

        this.emitEvent({
          type: 'discovery-completed',
          data: {
            count: discovered.length,
            sources: discoverySourcesData.map(s => s.name)
          }
        });

        // PHASE 1.5: MULTI-SOURCE VALIDATION (Task 6.8)
        // Validate discovered competitors against G2/Capterra
        this.emitPhaseChange('validating', 'Cross-referencing multiple sources', 20);
        this.emitEvent({ type: 'validation-started' });

        try {
          const validationResult = await multiSourceValidator.validateCompetitors({
            competitors: discovered,
            brand_industry: brandProfile.industry || '',
            brand_name: brandProfile.name || ''
          });

          // Emit validation results for each competitor
          for (const validated of validationResult.validated_competitors) {
            this.emitEvent({
              type: 'competitor-validated',
              competitor_name: validated.name,
              data: {
                is_validated: validated.is_validated,
                validation_sources: validated.validation_sources,
                validation_confidence: validated.validation_confidence,
                average_rating: validated.average_rating
              }
            });
          }

          // Update discovered competitors with validation data before saving
          const validatedDiscovered = discovered.map(d => {
            const validated = validationResult.validated_competitors.find(v =>
              v.name.toLowerCase() === d.name.toLowerCase()
            );
            return validated || d;
          });

          this.emitEvent({
            type: 'validation-completed',
            data: validationResult.validation_summary
          });

          // Save validated competitors
          competitors = await competitorIntelligence.saveCompetitors(brandId, validatedDiscovered);
        } catch (validationError) {
          console.warn('[CompetitorStreaming] Validation failed, continuing with unvalidated:', validationError);
          // Continue without validation - save original discovered competitors
          competitors = await competitorIntelligence.saveCompetitors(brandId, discovered);
        }

        this.status.totalCompetitors = competitors.length;
      } else {
        this.status.totalCompetitors = competitors.length;
        this.status.competitorsFound = competitors.length;
      }

      // PHASE 2: TRUE PARALLEL SCANNING - Fire ALL Claude calls simultaneously
      // No batching, no waiting - every competitor scans in parallel
      this.emitPhaseChange('scanning', 'Gathering competitor intelligence', 35);
      this.status.isDiscovering = false;
      this.status.isScanning = true;

      // Initialize competitor statuses
      for (const c of competitors) {
        this.updateCompetitorStatus(c.id, c.name, 'pending', 0);
      }

      // Get UVP data for gap extraction
      const uvpData = deepContext.business?.uvp ? {
        unique_solution: deepContext.business.uvp.uniqueSolution || '',
        key_benefit: deepContext.business.uvp.keyBenefit || '',
        differentiation: deepContext.business.uvp.uniqueSolution || ''
      } : undefined;

      // Scan function for single competitor (streams updates)
      const scanAndExtract = async (competitor: CompetitorProfile): Promise<CompetitorGap[]> => {
        if (this.abortController?.signal.aborted) {
          return [];
        }

        this.status.scanProgress.set(competitor.id, 0);
        this.updateCompetitorStatus(competitor.id, competitor.name, 'scanning', 0);
        this.emitEvent({
          type: 'scan-started',
          competitor_id: competitor.id,
          competitor_name: competitor.name
        });

        try {
          // First check for CACHED scans in DB
          let scans = await competitorIntelligence.getScans(competitor.id);

          if (scans.length > 0 && !options.forceRefresh) {
            console.log(`[CompetitorStreaming] Using ${scans.length} CACHED scans for ${competitor.name}`);
            this.status.scanProgress.set(competitor.id, 100);
            this.emitEvent({
              type: 'scan-progress',
              competitor_id: competitor.id,
              competitor_name: competitor.name,
              progress: 100
            });
          } else {
            // No cache or force refresh - fetch fresh scans
            console.log(`[CompetitorStreaming] Fetching fresh scans for ${competitor.name}`);
            scans = await competitorIntelligence.scanCompetitor(
              competitor,
              options.forceRefresh || false,
              (progress) => {
                this.status.scanProgress.set(competitor.id, progress);
                this.emitEvent({
                  type: 'scan-progress',
                  competitor_id: competitor.id,
                  competitor_name: competitor.name,
                  progress
                });
              }
            );
          }

          if (scans.length === 0) {
            this.status.competitorsScanned++;
            this.emitEvent({
              type: 'scan-completed',
              competitor_id: competitor.id,
              competitor_name: competitor.name,
              data: { scans: 0, gaps: 0 }
            });
            return [];
          }

          // Extract gaps via Claude
          const extractedGaps = await competitorIntelligence.extractGaps({
            brand_id: competitor.brand_id,
            competitor_id: competitor.id,
            competitor_name: competitor.name,
            scan_data: {
              website: scans.find(s => s.scan_type === 'website'),
              reviews: scans.filter(s => s.scan_type.startsWith('reviews-')),
              perplexity: scans.find(s => s.scan_type === 'perplexity-research'),
              llm_analysis: scans.find(s => s.scan_type === 'llm-analysis')
            },
            uvp_data: uvpData
          });

          // Stream each gap as it's extracted - UI updates immediately
          for (const gap of extractedGaps) {
            this.emitEvent({
              type: 'gap-extracted',
              competitor_id: competitor.id,
              competitor_name: competitor.name,
              data: gap
            });
          }

          // Save gaps and stream saved versions
          if (extractedGaps.length > 0) {
            const savedGaps = await competitorIntelligence.saveGaps(
              competitor.brand_id,
              competitor.id,
              competitor.name,
              extractedGaps,
              scans.map(s => s.id)
            );

            this.status.gapsExtracted += savedGaps.length;

            for (const gap of savedGaps) {
              this.emitEvent({
                type: 'gap-saved',
                competitor_id: competitor.id,
                competitor_name: competitor.name,
                data: gap
              });
            }

            this.status.competitorsScanned++;
            this.emitEvent({
              type: 'scan-completed',
              competitor_id: competitor.id,
              competitor_name: competitor.name,
              data: { scans: scans.length, gaps: savedGaps.length }
            });

            return savedGaps;
          }

          this.status.competitorsScanned++;
          this.emitEvent({
            type: 'scan-completed',
            competitor_id: competitor.id,
            competitor_name: competitor.name,
            data: { scans: scans.length, gaps: 0 }
          });

          return [];
        } catch (err) {
          console.error('[CompetitorStreaming] Scan failed:', competitor.name, err);
          this.emitEvent({
            type: 'error',
            competitor_id: competitor.id,
            competitor_name: competitor.name,
            error: err instanceof Error ? err.message : 'Scan failed'
          });
          return [];
        }
      };

      // TRUE PARALLEL: Fire ALL competitor scans simultaneously
      // No batching - every competitor processes in parallel
      // Results stream to UI as each completes (no waiting for all)
      console.log(`[CompetitorStreaming] Firing ${competitors.length} competitor scans in TRUE PARALLEL`);

      const allResults = await Promise.allSettled(
        competitors.map(competitor => scanAndExtract(competitor))
      );

      allResults.forEach(result => {
        if (result.status === 'fulfilled') {
          allGaps.push(...result.value);
        }
      });

      // MARKET-WIDE GAP DETECTION (Phase 13)
      // Find similar gaps across competitors and merge competitor_ids
      // This enables the "Market-Wide Gaps" section in the UI
      this.detectMarketWideGaps(allGaps);

      // Update competitor statuses to complete
      for (const c of competitors) {
        this.updateCompetitorStatus(c.id, c.name, 'complete', 100);
      }

      // PHASE 4: EXTRACTING - Gap extraction is complete at this point
      this.emitPhaseChange('extracting', 'Finding gaps & opportunities', 75);
      this.emitEvent({ type: 'extraction-started' });

      // Run enhanced collectors in parallel for all competitors
      // This fetches Reddit, SEMrush, YouTube, Serper data
      const brandProfile = deepContext.business?.profile;
      const industry = brandProfile?.industry || '';

      console.log(`[CompetitorStreaming] ========================================`);
      console.log(`[CompetitorStreaming] PHASE: ENHANCED COLLECTORS`);
      console.log(`[CompetitorStreaming] Running enhanced collectors for ${competitors.length} competitors`);
      console.log(`[CompetitorStreaming] Industry: ${industry}`);
      const collectorResults = await Promise.allSettled(
        competitors.map(c => this.runEnhancedCollectors(c, industry))
      );

      // Build enhanced insights for each competitor
      collectorResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const competitor = competitors[index];
          const competitorGaps = allGaps.filter(g => g.competitor_ids.includes(competitor.id));
          this.buildEnhancedInsights(competitor, result.value, competitorGaps);
        }
      });

      // Emit that enhanced insights are ready
      this.emitEvent({
        type: 'enhanced-insights-ready',
        data: {
          competitor_count: competitors.length,
          insights_count: this.status.enhancedInsights.size
        }
      });

      // PHASE 4.5: CUSTOMER VOICE + BATTLECARD EXTRACTION (Phase 13)
      // Generate UVP-contextualized Customer Voice and Battlecards per competitor
      const uvpFull = deepContext.business?.uvp;

      if (brandProfile && uvpFull) {
        console.log('[CompetitorStreaming] ========================================');
        console.log('[CompetitorStreaming] PHASE: CUSTOMER VOICE + BATTLECARD');
        console.log('[CompetitorStreaming] Extracting for', competitors.length, 'competitors');

        // Get products and segments from UVP
        const products = (uvpFull as any)?.products?.map((p: any) => p.name || p) || [];
        const segments = (uvpFull as any)?.segments?.map((s: any) => s.name || s) || [];

        // Run Customer Voice + Battlecard extraction in parallel for all competitors
        const voiceBattlecardPromises = competitors.map(async (competitor) => {
          const competitorGaps = allGaps.filter(g => g.competitor_ids.includes(competitor.id));

          // Get collected review data for this competitor
          const collectorResult = collectorResults.find((r, i) =>
            r.status === 'fulfilled' && competitors[i].id === competitor.id
          );
          const reviewData = collectorResult?.status === 'fulfilled'
            ? (collectorResult.value as any)?.reddit?.customer_voice || ''
            : '';

          try {
            // Extract Customer Voice
            const voiceResult = await customerVoiceExtractor.extractCustomerVoice({
              brand_id: brandId,
              competitor_id: competitor.id,
              competitor_name: competitor.name,
              brand_name: brandProfile.name || '',
              unique_solution: uvpFull.uniqueSolution?.statement || '',
              key_benefit: uvpFull.keyBenefit?.statement || '',
              target_customer: (uvpFull as any)?.targetCustomer || '',
              review_data: reviewData,
              reddit_data: (collectorResult?.status === 'fulfilled' ? (collectorResult.value as any)?.reddit?.raw_discussions : '') || ''
            });

            // Save Customer Voice to brand-specific table
            if (voiceResult.source_quotes.length > 0 || voiceResult.pain_points.length > 0) {
              await customerVoiceExtractor.saveCustomerVoice(brandId, competitor.id, voiceResult);

              // Update enhanced insights with customer voice
              const existingInsights = this.status.enhancedInsights.get(competitor.id) || {};
              this.status.enhancedInsights.set(competitor.id, {
                ...existingInsights,
                customer_voice: voiceResult
              });
            }

            // Generate Battlecard
            const battlecardResult = await battlecardGenerator.generateBattlecard({
              brand_id: brandId,
              competitor_id: competitor.id,
              competitor_name: competitor.name,
              brand_name: brandProfile.name || '',
              unique_solution: uvpFull.uniqueSolution?.statement || '',
              key_benefit: uvpFull.keyBenefit?.statement || '',
              target_customer: (uvpFull as any)?.targetCustomer || '',
              products,
              competitor_positioning: competitor.positioning_summary || '',
              competitor_weaknesses: competitorGaps.map(g => g.the_void),
              gaps: competitorGaps,
              customer_complaints: voiceResult.pain_points
            });

            // Save Battlecard to brand-specific table
            console.log('[CompetitorStreaming] Battlecard result for', competitor.name, ':', {
              our_advantages: battlecardResult.our_advantages.length,
              their_advantages: battlecardResult.their_advantages.length,
              objection_handlers: battlecardResult.key_objection_handlers.length,
              win_themes: battlecardResult.win_themes.length
            });

            // ALWAYS save battlecard, even if sparse - this ensures we have something to show
            // An empty battlecard indicates extraction failed, which is useful to know
            const hasBattlecardContent = battlecardResult.our_advantages.length > 0 ||
                                          battlecardResult.key_objection_handlers.length > 0 ||
                                          battlecardResult.win_themes.length > 0;

            if (!hasBattlecardContent) {
              console.warn('[CompetitorStreaming] Battlecard for', competitor.name, 'is EMPTY - API may have failed');
            }

            // Save regardless - even empty battlecard marks that we tried
            await battlecardGenerator.saveBattlecard(brandId, competitor.id, battlecardResult);

            // Update enhanced insights with battlecard
            const existingInsights = this.status.enhancedInsights.get(competitor.id) || {};
            this.status.enhancedInsights.set(competitor.id, {
              ...existingInsights,
              battlecard: battlecardResult
            });

            this.emitEvent({
              type: 'competitor-voice-battlecard-ready',
              competitor_id: competitor.id,
              competitor_name: competitor.name,
              data: {
                voice_quotes: voiceResult.source_quotes.length,
                pain_points: voiceResult.pain_points.length,
                battlecard_advantages: battlecardResult.our_advantages.length
              }
            });

            return { competitor_id: competitor.id, voice: voiceResult, battlecard: battlecardResult };
          } catch (err) {
            console.warn('[CompetitorStreaming] Voice/Battlecard failed for', competitor.name, err);
            return null;
          }
        });

        // Wait for all Voice + Battlecard extractions
        const voiceBattlecardResults = await Promise.allSettled(voiceBattlecardPromises);
        const successCount = voiceBattlecardResults.filter(r => r.status === 'fulfilled' && r.value).length;
        console.log('[CompetitorStreaming] Voice/Battlecard complete:', successCount, '/', competitors.length);
      }

      // PHASE 5: ANALYZING - Strategic analysis
      this.emitPhaseChange('analyzing', 'Strategic intelligence synthesis', 90);
      this.status.isAnalyzing = true;
      this.emitEvent({ type: 'analysis-started' });

      // Run strategic analysis if we have gaps
      if (allGaps.length > 0) {
        try {
          // Import strategic analyzer dynamically to avoid circular deps
          const { strategicAnalyzer } = await import('./strategic-analyzer.service');

          if (brandProfile) {
            const competitorData = competitors.map(c => ({
              profile: c,
              gaps: allGaps.filter(g => g.competitor_ids.includes(c.id))
            }));

            const analysisContext = {
              brand_name: brandProfile.name || '',
              brand_industry: brandProfile.industry || '',
              brand_uvp: deepContext.business?.uvp ? {
                unique_solution: deepContext.business.uvp.uniqueSolution?.statement,
                key_benefit: deepContext.business.uvp.keyBenefit?.statement
              } : undefined
            };

            // Run cross-competitor analyses in parallel
            const [narrativeDissonance, featureVelocity] = await Promise.all([
              strategicAnalyzer.analyzeNarrativeDissonance(competitorData, analysisContext),
              strategicAnalyzer.analyzeFeatureVelocity(competitorData, analysisContext)
            ]);

            this.status.insightsGenerated = 2;

            // Emit analysis progress
            this.emitEvent({
              type: 'analysis-progress',
              data: { narrativeDissonance, featureVelocity },
              progress: 95
            });
          }
        } catch (analysisErr) {
          console.warn('[CompetitorStreaming] Strategic analysis failed:', analysisErr);
          // Don't fail the whole pipeline for analysis errors
        }
      }

      this.status.isAnalyzing = false;
      this.emitEvent({ type: 'analysis-completed' });

      // PHASE 6: COMPLETE
      this.emitPhaseChange('complete', 'Analysis Complete', 100);
      const totalDuration = ((performance.now() - startTime) / 1000).toFixed(1);
      console.log('[CompetitorStreaming] ALL COMPLETE in', totalDuration, 's');

      this.emitEvent({
        type: 'all-scans-completed',
        data: {
          totalCompetitors: competitors.length,
          totalGaps: allGaps.length,
          durationSeconds: parseFloat(totalDuration)
        }
      });

      return { competitors, gaps: allGaps };

    } catch (err) {
      console.error('[CompetitorStreaming] Analysis failed:', err);
      this.emitEvent({
        type: 'error',
        error: err instanceof Error ? err.message : 'Analysis failed'
      });
      // Don't re-throw - return partial results instead of crashing
      return { competitors, gaps: allGaps };
    } finally {
      this.status.isDiscovering = false;
      this.status.isScanning = false;
      this.abortController = null;
    }
  }

  /**
   * Start discovery only (can be called during UVP at 30% progress)
   * Enhanced: Uses full brand context for more accurate discovery
   */
  async startEarlyDiscovery(
    brandId: string,
    deepContext: DeepContext
  ): Promise<DiscoveredCompetitor[]> {
    this.status.isDiscovering = true;
    this.emitEvent({ type: 'discovery-started' });

    try {
      const brandProfile = deepContext.business?.profile;
      if (!brandProfile) {
        throw new Error('Brand profile not available');
      }

      // Extract UVP data for enhanced discovery
      const uvpData = deepContext.business?.uvp;
      const uniqueSolution = uvpData?.uniqueSolution?.statement || '';
      const keyBenefit = uvpData?.keyBenefit?.statement || '';
      const targetCustomer = (uvpData as any)?.targetCustomer || (brandProfile as any)?.targetCustomer || '';

      console.log('[CompetitorStreaming] Early discovery with UVP context:', {
        hasUVP: !!uniqueSolution,
        hasKeyBenefit: !!keyBenefit
      });

      const discovered = await competitorIntelligence.discoverCompetitors({
        brand_id: brandId,
        brand_name: brandProfile.name || '',
        industry: brandProfile.industry || '',
        website_url: brandProfile.website || '',
        location: brandProfile.location?.city
          ? `${brandProfile.location.city}, ${brandProfile.location.state}`
          : undefined,
        // Enhanced context for more accurate discovery
        unique_solution: uniqueSolution,
        key_benefit: keyBenefit,
        brand_description: (brandProfile as any)?.description || '',
        brand_website: brandProfile.website || '',
        target_customer: targetCustomer,
        existing_competitor_names: []
      });

      for (const competitor of discovered) {
        this.status.competitorsFound++;
        this.emitEvent({
          type: 'competitor-found',
          competitor_name: competitor.name,
          data: competitor
        });
      }

      this.emitEvent({
        type: 'discovery-completed',
        data: { count: discovered.length }
      });

      return discovered;
    } finally {
      this.status.isDiscovering = false;
    }
  }
}

// Export singleton
export const competitorStreamingManager = new CompetitorStreamingManager();
export default competitorStreamingManager;
