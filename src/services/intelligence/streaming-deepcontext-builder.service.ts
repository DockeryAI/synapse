/**
 * Streaming DeepContext Builder - Netflix-Style Progressive Loading
 *
 * Architecture:
 * - All APIs fire simultaneously (no waves)
 * - Each API calls onProgress() independently when complete
 * - UI renders data within 2-3 seconds (cached data first)
 * - No API blocks another - failures isolated
 * - Context merges incrementally as data arrives
 *
 * Target: First data <5 seconds, full load <45 seconds
 */

import { supabase } from '@/lib/supabase';
import { YouTubeAPI } from './youtube-api';
import { OutScraperAPI } from './outscraper-api';
import { WeatherAPI } from './weather-api';
import { SerperAPI } from './serper-api';
import { SemrushAPI } from './semrush-api';
import { websiteAnalyzer } from './website-analyzer.service';
import { perplexityAPI } from '@/services/uvp-wizard/perplexity-api';
import { intelligenceCache } from './intelligence-cache.service';
import { embeddingService } from './embedding.service';
import { clusteringService } from './clustering.service';
import { IndustryBenchmarkDatabase } from '@/services/benchmarks/IndustryBenchmarkDatabase';
import { TwoWayConnectionFinder } from '@/services/synapse-v6/connections/TwoWayConnectionFinder';
import { ConnectionScorer } from '@/services/synapse-v6/connections/ConnectionScorer';
import { connectionDiscoveryService } from './connection-discovery.service';
import { recoverUVPFromSession } from '@/services/database/marba-uvp.service';
import { redditAPI } from './reddit-apify-api';
import { aiInsightSynthesizer } from './ai-insight-synthesizer.service';
import { generateTrendQueries, getQueriesForType, type GeneratedQuery } from '@/services/trends/uvp-query-generator.service';
// V3 FIX: Atomizer DISABLED - it creates fake title variations, not genuine insights
// import { insightAtomizer } from './insight-atomizer.service';
import { apifySocialScraper } from './apify-social-scraper.service';
import { competitorStreamingManager } from './competitor-streaming-manager';
import { contentSynthesisOrchestrator, type BusinessSegment as OrchestratorSegment, type EnrichedContext } from './content-synthesis-orchestrator.service';
import { generateSynapses, type SynapseInput } from '@/services/synapse-v6/SynapseGenerator';
import { frameworkLibrary, type FrameworkType } from '@/services/synapse-v6/generation/ContentFrameworkLibrary';
// V1 WIRING: Import outcome detection for customer-outcome-aware queries
import { outcomeDetectionService, type DetectedOutcome, type OutcomeDetectionResult } from '@/services/synapse-v6/outcome-detection.service';
import type { DeepContext, RawDataPoint, CorrelatedInsight, BreakthroughOpportunity } from '@/types/synapse/deepContext.types';
import type { DataPoint, DataSource, DataPointType, BusinessSegment, InsightDimensions, ContentPillar } from '@/types/connections.types';

export interface StreamingConfig {
  brandId: string;
  businessType?: 'local' | 'b2b-national' | 'b2b-global';
  cacheResults?: boolean;
  forceFresh?: boolean;
  clearCache?: boolean; // PHASE 15: Clear cache before starting
}

export interface StreamingProgress {
  context: DeepContext;
  completedApis: string[];
  pendingApis: string[];
  dataPointsCollected: number;
  buildTimeMs: number;
  isComplete: boolean;
}

export type StreamingCallback = (progress: StreamingProgress) => void;

// API names for tracking
const ALL_APIS = [
  'serper',
  'website',
  'outscraper',
  'youtube',
  'semrush',
  'news',
  'weather',
  'linkedin',
  'perplexity',
  'reddit',
  'quora',
  'g2',
  'trustpilot',
  'twitter',
  'yelp',
  'competitor-discovery'  // Task 6.7: Early competitor discovery in parallel
] as const;

type ApiName = typeof ALL_APIS[number];

export class StreamingDeepContextBuilder {
  private brandData: any = null;
  private uvpData: any = null; // UVP data with target customer info
  private productCatalog: any[] = []; // Product catalog from pm_products
  private industryBenchmarks: any = null; // Industry benchmarks for NAICS code
  private dataPoints: DataPoint[] = [];
  private completedApis: Set<string> = new Set();
  private startTime: number = 0;
  private onProgress: StreamingCallback | null = null;
  private currentContext: DeepContext | null = null;
  private benchmarkDb: IndustryBenchmarkDatabase = new IndustryBenchmarkDatabase();
  private connectionFinder: TwoWayConnectionFinder = new TwoWayConnectionFinder();
  private connectionScorer: ConnectionScorer = new ConnectionScorer();
  private uvpSeedEmbeddings: { painPoint: string; embedding: number[]; category: string }[] = []; // UVP pain point embeddings for matching
  private sourceValidationCounts: Map<string, Map<string, number>> = new Map(); // painPoint -> source -> count
  private competitorMentions: Map<string, { count: number; sentiment: 'positive' | 'negative' | 'neutral'; mentions: string[] }> = new Map();
  private timingContext: { season?: string; events?: string[]; weather?: string; urgencyReason?: string } = {};
  // PHASE 15: Business Purpose-Aware Queries
  private contextualQueries: GeneratedQuery[] = []; // Business purpose detection queries
  // V1 WIRING: Store detected customer outcomes for query building
  private detectedOutcomes: DetectedOutcome[] = [];

  // FREEZE FIX: Batch progress notifications to prevent 15+ context rebuilds
  // Problem: Each API completion was calling buildContextFromDataPoints (expensive ~500ms each)
  // Solution: Buffer API completions and rebuild context only every 500ms
  private progressBatchTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingProgressNotification: boolean = false;
  private readonly PROGRESS_BATCH_WINDOW_MS = 500; // Rebuild context max once per 500ms

  // FREEZE FIX: Also batch context rebuilds separately
  private contextRebuildTimeout: ReturnType<typeof setTimeout> | null = null;
  private contextRebuildPending: boolean = false;
  private readonly CONTEXT_REBUILD_BATCH_MS = 800; // Rebuild context max once per 800ms

  /**
   * Build DeepContext with true streaming - each API updates UI independently
   */
  async buildStreaming(
    config: StreamingConfig,
    onProgress: StreamingCallback
  ): Promise<DeepContext> {
    this.startTime = Date.now();
    this.onProgress = onProgress;
    this.dataPoints = [];
    this.completedApis = new Set();
    this.currentContext = null;
    this.uvpSeedEmbeddings = [];
    this.sourceValidationCounts = new Map();
    this.competitorMentions = new Map();
    this.timingContext = {};

    // 1. Load brand data first (required for all APIs)
    console.log('[Streaming] Loading brand data...');
    this.brandData = await this.loadBrandData(config.brandId);

    if (!this.brandData) {
      throw new Error(`Brand not found: ${config.brandId}`);
    }

    console.log('[Streaming] Brand loaded:', {
      name: this.brandData.name,
      industry: this.brandData.industry,
      naicsCode: this.brandData.naics_code,
      businessType: config.businessType || this.detectBusinessType()
    });

    // 1.1 FAST PARALLEL: Start testimonial/meta extraction immediately (no LLM, just scraping)
    // This runs in background - doesn't block any other operations
    let fastExtractPromise: Promise<void> | null = null;
    if (this.brandData.website) {
      console.log('[Streaming/FastExtract] Starting parallel testimonial/meta extraction...');
      fastExtractPromise = (async () => {
        try {
          const rawData = await websiteAnalyzer.extractRawTestimonialsAndMeta(this.brandData.website);

          // Store immediately in context for sidebar access
          if (!this.currentContext) {
            this.currentContext = this.buildEmptyContext();
          }
          if (!this.currentContext.business) {
            this.currentContext.business = {} as any;
          }
          if (!(this.currentContext.business as any).websiteAnalysis) {
            (this.currentContext.business as any).websiteAnalysis = {};
          }

          // Merge raw testimonials/meta - these arrive FAST before LLM analysis
          const existing = (this.currentContext.business as any).websiteAnalysis;
          existing.testimonials = [...(existing.testimonials || []), ...rawData.testimonials];
          existing.metaTags = { ...(existing.metaTags || {}), ...rawData.metaTags };
          existing.keywords = [...(existing.keywords || []), ...rawData.keywords];

          // Add as data points immediately
          rawData.testimonials.forEach((t: string, i: number) => {
            this.dataPoints.push({
              id: `fast-testimonial-${Date.now()}-${i}`,
              source: 'website' as DataSource,
              type: 'customer_trigger' as DataPointType,
              content: t,
              metadata: { type: 'testimonial', fast_extracted: true },
              createdAt: new Date()
            });
          });

          rawData.keywords.forEach((k: string, i: number) => {
            this.dataPoints.push({
              id: `fast-keyword-${Date.now()}-${i}`,
              source: 'website' as DataSource,
              type: 'trending_topic' as DataPointType,
              content: k,
              metadata: { type: 'meta_keyword', fast_extracted: true },
              createdAt: new Date()
            });
          });

          if (rawData.testimonials.length > 0 || rawData.keywords.length > 0) {
            console.log(`[Streaming/FastExtract] ✅ Got ${rawData.testimonials.length} testimonials, ${rawData.keywords.length} keywords (FAST)`);
            // Notify UI immediately with this new data
            this.notifyProgress(false);
          }
        } catch (err) {
          console.warn('[Streaming/FastExtract] Non-blocking error:', err);
          // Non-blocking - don't throw
        }
      })();
    }

    // If forceFresh, invalidate cache for this brand first
    if (config.forceFresh) {
      console.log('[Streaming] FORCE FRESH enabled - invalidating cache for brand:', config.brandId);
      await intelligenceCache.invalidateByBrand(config.brandId);
    }

    // Initialize empty context - PRESERVE any websiteAnalysis from fast extract
    const existingWebsiteAnalysis = this.currentContext?.business?.websiteAnalysis;
    this.currentContext = this.buildEmptyContext();
    if (existingWebsiteAnalysis) {
      if (!this.currentContext.business) {
        this.currentContext.business = {} as any;
      }
      (this.currentContext.business as any).websiteAnalysis = existingWebsiteAnalysis;
      console.log('[Streaming] Preserved websiteAnalysis from fast extract during context init');
    }

    // 1.5 Load UVP data as baseline (this gives us immediate data)
    // CRITICAL: UVP MUST be loaded BEFORE APIs fire so searches are targeted
    console.log(`[Streaming/uvp] ========== UVP LOADING START ==========`);
    console.log(`[Streaming/uvp] Brand ID: ${config.brandId}`);
    const uvpDataPoints = await this.loadUVPData();
    if (uvpDataPoints.length > 0) {
      console.log(`[Streaming] Loaded ${uvpDataPoints.length} UVP data points as baseline`);
      this.dataPoints.push(...uvpDataPoints);
      this.completedApis.add('uvp');
      this.currentContext = await this.buildContextFromDataPoints();
      this.notifyProgress(false); // Immediate first update with UVP data
    }

    // VERIFY UVP STATE - Log confirmation BEFORE APIs fire
    if (this.uvpData) {
      console.log(`[Streaming/uvp] ✅ UVP LOADED SUCCESSFULLY - APIs will use targeted searches`);
      console.log(`[Streaming/uvp] Target Customer: "${this.uvpData.target_customer?.substring(0, 80)}..."`);
      console.log(`[Streaming/uvp] Pain Points Available: ${this.uvpData.transformation ? 'YES' : 'NO'}`);

      // PHASE 15: Generate Business Purpose-Aware Queries
      try {
        // Convert legacy UVP format to CompleteUVP format for business purpose detection
        const completeUVP = this.convertLegacyUVPToComplete(this.uvpData);
        this.contextualQueries = generateTrendQueries(completeUVP);

        console.log(`[Streaming/uvp] ✅ GENERATED ${this.contextualQueries.length} BUSINESS PURPOSE-AWARE QUERIES`);
        console.log(`[Streaming/uvp] Sample queries:`,
          this.contextualQueries.slice(0, 3).map(q => q.query)
        );

        // V1 WIRING: Detect customer outcomes from UVP profiles
        const outcomeResult = outcomeDetectionService.detectOutcomes(completeUVP);
        this.detectedOutcomes = outcomeResult.outcomes;

        console.log(`[V1 WIRING] ✅ DETECTED ${this.detectedOutcomes.length} CUSTOMER OUTCOMES`);
        if (this.detectedOutcomes.length > 0) {
          console.log(`[V1 WIRING] Top 3 outcomes by impact:`);
          const topOutcomes = [...this.detectedOutcomes]
            .sort((a, b) => b.impactScore - a.impactScore)
            .slice(0, 3);
          topOutcomes.forEach((o, i) => {
            console.log(`  ${i + 1}. [${o.type}] ${o.statement.substring(0, 60)}... (impact: ${o.impactScore}, urgency: ${o.urgencyScore})`);
          });
        }
      } catch (err) {
        console.warn(`[Streaming/uvp] ⚠️ Business purpose query generation failed:`, err);
        this.contextualQueries = []; // Fall back to empty array
        this.detectedOutcomes = []; // V1 WIRING: Clear outcomes on error
      }
    } else {
      console.warn(`[Streaming/uvp] ⚠️ NO UVP DATA FOUND - Attempting recovery from session table...`);

      // Attempt to recover UVP from uvp_sessions table
      try {
        const recoveryResult = await recoverUVPFromSession(config.brandId);
        if (recoveryResult.recovered) {
          console.log(`[Streaming/uvp] ✅ RECOVERED UVP from session: ${recoveryResult.uvpId}`);
          // Reload UVP data now that it's in marba_uvps
          const recoveredDataPoints = await this.loadUVPData();
          if (recoveredDataPoints.length > 0) {
            this.dataPoints.push(...recoveredDataPoints);
            console.log(`[Streaming/uvp] ✅ UVP data now available for APIs`);
          }
        } else {
          console.warn(`[Streaming/uvp] ⚠️ NO UVP DATA - APIs will use GENERIC industry searches`);
          console.warn(`[Streaming/uvp] This results in irrelevant insights. Complete UVP onboarding first.`);
        }
      } catch (recoveryError) {
        console.error(`[Streaming/uvp] Recovery failed:`, recoveryError);
      }
    }
    console.log(`[Streaming/uvp] ========== UVP LOADING END ==========`)

    // V3 FIX: WARN if no UVP data - APIs will produce generic insights without it
    // Changed from throw to warn to prevent page crash on session restore
    if (!this.uvpData) {
      console.warn('[Streaming] ⚠️ No UVP data found - proceeding with generic industry insights only');
      // Continue without throwing - will use brand industry data as fallback
    }

    // 1.6 Load product catalog data (from pm_products table)
    const productDataPoints = await this.loadProductCatalogData();
    if (productDataPoints.length > 0) {
      console.log(`[Streaming] Loaded ${productDataPoints.length} product catalog data points`);
      this.dataPoints.push(...productDataPoints);
      this.completedApis.add('products');
      this.currentContext = await this.buildContextFromDataPoints();
      this.notifyProgress(false);
    }

    // 1.7 Load industry benchmarks for NAICS code
    const benchmarkDataPoints = await this.loadIndustryBenchmarks();
    if (benchmarkDataPoints.length > 0) {
      console.log(`[Streaming] Loaded ${benchmarkDataPoints.length} industry benchmark data points`);
      this.dataPoints.push(...benchmarkDataPoints);
      this.completedApis.add('benchmarks');
      this.currentContext = await this.buildContextFromDataPoints();
      this.notifyProgress(false);
    }

    // 2. Determine which APIs to use based on business type
    const businessType = config.businessType || this.detectBusinessType();
    const apisToRun = this.getApisForBusinessType(businessType);

    console.log(`[Streaming] Running ${apisToRun.length} APIs for ${businessType} business:`, apisToRun);

    // 3. Fire ALL APIs simultaneously - each reports independently
    const apiPromises = apisToRun.map(api => this.runApiWithCallback(api, config));

    // Wait for all to complete (but UI updates as each finishes)
    await Promise.allSettled(apiPromises);

    // 4. GENERATE UVP SEED EMBEDDINGS FIRST (before data point embeddings)
    // This is critical - UVP seeds will be used as cluster centers
    console.log(`[Streaming] Generating UVP seed embeddings as cluster centers...`);
    await this.generateUVPSeedEmbeddings();

    // 4.5. TAG DATA POINTS with psychology metadata
    console.log(`[Streaming] Tagging ${this.dataPoints.length} data points with psychology metadata...`);
    this.dataPoints = this.tagDataPointsWithPsychology(this.dataPoints);

    // 4.6. EXTRACT COMPETITOR MENTIONS from reviews and comments
    console.log(`[Streaming] Extracting competitor mentions...`);
    this.extractCompetitorMentions(this.dataPoints);

    // 4.7. EXTRACT TIMING CONTEXT from weather and news
    console.log(`[Streaming] Extracting timing context...`);
    this.extractTimingContext(this.dataPoints);

    // 5. EMBEDDINGS & CLUSTERING - Run after all data collected
    console.log(`[Streaming] Starting embeddings & clustering for ${this.dataPoints.length} data points...`);
    let enhancedClusters: any[] = [];
    try {
      // Generate embeddings for all data points
      const embeddedDataPoints = await embeddingService.embedDataPoints(this.dataPoints);
      this.dataPoints = embeddedDataPoints;

      // Semantic deduplication - remove VERY similar items (>0.98 similarity)
      // Lowered from 0.92 to 0.98 to preserve more unique insights
      const beforeDedup = this.dataPoints.length;
      this.dataPoints = this.deduplicateBySimilarity(this.dataPoints, 0.98);
      console.log(`[Streaming] Deduped: ${beforeDedup} → ${this.dataPoints.length} data points`);

      // 5.5. UVP-SEEDED CLUSTERING - Use UVP pain points as cluster centers
      // This is the key differentiator: clusters form AROUND customer's UVP
      console.log(`[Streaming] Running UVP-seeded clustering with ${this.uvpSeedEmbeddings.length} seed centers...`);
      const uvpSeededClusters = this.performUVPSeededClustering(this.dataPoints);

      // Also run standard k-means for discovery of new patterns
      const discoveryClusters = clusteringService.kMeansClustering(this.dataPoints, 8);

      // Merge and enhance all clusters
      const allClusters = [...uvpSeededClusters, ...discoveryClusters];
      enhancedClusters = await clusteringService.enhanceClusterThemes(allClusters);

      console.log(`[Streaming] Created ${enhancedClusters.length} semantic clusters (${uvpSeededClusters.length} UVP-seeded + ${discoveryClusters.length} discovery)`);
    } catch (embeddingError) {
      console.warn('[Streaming] Embeddings/clustering failed (non-fatal):', embeddingError);
    }

    // 5.6. COUNT PER-SOURCE VALIDATIONS for each UVP pain point
    console.log(`[Streaming] Counting per-source validations for UVP pain points...`);
    this.countPerSourceValidations(this.dataPoints);

    // 6. CORRELATION ENGINE - Full multi-way connection discovery
    console.log(`[Streaming] Running full correlation engine with 2/3/4/5-way connections...`);
    let correlatedInsights: CorrelatedInsight[] = [];
    let breakthroughs: BreakthroughOpportunity[] = [];
    try {
      // PERFORMANCE FIX: Limit dataPoints BEFORE O(n²) connection discovery
      // 100 points = 4,950 two-way iterations (manageable)
      // 186 points = 17,205 two-way iterations (too slow)
      const MAX_DATAPOINTS_FOR_CONNECTIONS = 100;
      const limitedDataPoints = this.dataPoints.length > MAX_DATAPOINTS_FOR_CONNECTIONS
        ? this.dataPoints
            .sort((a, b) => (b.confidence || 0.5) - (a.confidence || 0.5))
            .slice(0, MAX_DATAPOINTS_FOR_CONNECTIONS)
        : this.dataPoints;
      console.log(`[Streaming] PERFORMANCE: Using ${limitedDataPoints.length} of ${this.dataPoints.length} data points for connection discovery`);

      // Run the full connection discovery service (2-way through 5-way)
      const { twoWay, threeWay, fourWay, fiveWay, breakthroughs: rawBreakthroughs } =
        await connectionDiscoveryService.discoverConnections(limitedDataPoints, enhancedClusters);

      console.log(`[Streaming] Connections: ${twoWay.length} 2-way, ${threeWay.length} 3-way, ${fourWay.length} 4-way, ${fiveWay.length} 5-way`);

      // =========================================================================
      // V3 PARALLEL ARCHITECTURE: Run these operations concurrently
      // 1. Convert connections to correlated insights
      // 2. Generate breakthrough opportunities (includes SynapseGenerator)
      // 3. AI Insight Synthesizer
      // =========================================================================
      console.log(`[Streaming] V3 PARALLEL: Starting 3 concurrent operations...`);

      // Map business type to orchestrator segment (needed for enriched context)
      const segmentMap: Record<string, OrchestratorSegment> = {
        'local': 'smb_local',
        'b2b-national': 'b2b_national',
        'b2b-global': 'b2b_global'
      };
      const segment = segmentMap[this.brandData?.businessType || 'local'] || 'smb_local';

      // PERFORMANCE FIX: Limit total connections to prevent O(n) freeze on downstream processing
      // Connections are already sorted by score (highest first), so we take the best ones
      const MAX_TOTAL_CONNECTIONS = 500;
      const rawConnections = [...fiveWay, ...fourWay, ...threeWay, ...twoWay];
      const allConnections = rawConnections.slice(0, MAX_TOTAL_CONNECTIONS);
      console.log(`[Streaming] PERFORMANCE: Limited connections from ${rawConnections.length} to ${allConnections.length}`);

      // PARALLEL OPERATION 1: Convert connections to correlated insights
      // V3 FIX: No slice limits - pass ALL connections, Atomizer handles dedup
      const convertPromise = this.convertConnectionsToCorrelatedInsights(allConnections);

      // PARALLEL OPERATION 2: Generate breakthrough opportunities (with SynapseGenerator)
      const breakthroughPromise = this.generateBreakthroughOpportunities(rawBreakthroughs, enhancedClusters);

      // PARALLEL OPERATION 3: AI Insight Synthesizer (async)
      const synthesizerPromise = (async () => {
        try {
          // Build enriched context with EQ, Industry Profile, and Segment
          const enrichedContext = await contentSynthesisOrchestrator.buildEnrichedContext({
            brandName: this.brandData?.name || 'Unknown',
            industry: this.brandData?.industry || 'General',
            naicsCode: this.brandData?.naics_code,
            uvpData: {
              target_customer: this.uvpData?.target_customer,
              key_benefit: this.uvpData?.key_benefit,
              transformation: this.uvpData?.transformation,
              unique_mechanism: this.uvpData?.unique_mechanism,
              proof_points: this.uvpData?.proof_points
            },
            segment
          });

          console.log(`[Streaming] V3 PARALLEL: Enriched context built - EQ: ${enrichedContext.eqProfile.emotional_weight}%`);

          // V6: AI Insight Synthesizer now uses live signal detection internally
          // No static UVP parsing needed - signals extracted from API data points

          const synthesizedInsights = await aiInsightSynthesizer.synthesizeInsights({
            connections: allConnections,
            dataPoints: this.dataPoints,
            uvpData: this.uvpData,
            brandData: this.brandData,
            targetCount: 500,
            enrichedContext
            // V6: No static outcomes passed - synthesizer detects live signals from dataPoints
          });
          return synthesizedInsights;
        } catch (err) {
          console.warn('[Streaming] V3 PARALLEL: AI Synthesizer failed:', err);
          return [];
        }
      })();

      // Wait for ALL parallel operations to complete
      const [convertedInsights, generatedBreakthroughs, synthesizedInsights] = await Promise.all([
        convertPromise,
        breakthroughPromise,
        synthesizerPromise
      ]);

      correlatedInsights = convertedInsights;
      breakthroughs = generatedBreakthroughs;

      console.log(`[Streaming] V3 PARALLEL: All operations complete`);
      console.log(`[Streaming] Generated ${correlatedInsights.length} correlated insights, ${breakthroughs.length} breakthroughs, ${synthesizedInsights.length} AI-synthesized`);

      // Merge AI-synthesized insights with correlated insights (if any)
      if (synthesizedInsights.length > 0) {
        const aiCorrelatedInsights: CorrelatedInsight[] = synthesizedInsights.map((si: any) => ({
          id: si.id || `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'psychological_breakthrough' as const,
          title: si.title || 'Untitled Insight',
          description: si.hook || '',
          uvpMatch: Number(si.validation?.uvpMatch) || 0,
          sources: (si.sources || []).map((s: any) => ({
            source: (s?.platform || 'unknown') as DataSource,
            content: s?.quote || '',
            confidence: Number(si.scores?.breakthrough || 50) / 100
          })),
          psychology: {
            triggerCategory: si.psychology?.triggerType || 'unknown',
            emotion: si.psychology?.triggerType || 'unknown',
            urgency: (si.psychology?.urgency === 'critical' ? 'immediate' :
                     si.psychology?.urgency === 'high' ? 'urgent' : 'eventual') as 'immediate' | 'urgent' | 'eventual'
          },
          breakthroughScore: Number(si.scores?.breakthrough) || 50,
          actionableInsight: si.cta || '',
          timeSensitive: si.psychology?.urgency === 'high' || si.psychology?.urgency === 'critical'
        }));

        // V3 FIX: Prepend AI insights, no filtering or slicing
        correlatedInsights = [...aiCorrelatedInsights, ...correlatedInsights];
        console.log(`[Streaming] V3: Added ${aiCorrelatedInsights.length} AI insights, total before atomization: ${correlatedInsights.length}`);
      }

      // V3 FIX: DISABLED ATOMIZER - it creates fake variations, not genuine insights
      // Instead, we use AI-synthesized insights directly (from synthesizerPromise above)
      // The AI Insight Synthesizer uses ContentFrameworkLibrary for genuine unique content
      console.log(`[Streaming] V3: Atomizer DISABLED - using genuine AI-synthesized insights only`);

      // V3 FIX: MERGE breakthroughs into correlatedInsights as single pipeline
      // This eliminates duplicate patterns appearing in both arrays
      if (breakthroughs.length > 0) {
        const breakthroughsAsInsights: CorrelatedInsight[] = breakthroughs.map((b: BreakthroughOpportunity) => ({
          id: b.id || `bt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'psychological_breakthrough' as const,
          title: b.title,
          description: b.hook || '',
          uvpMatch: b.uvpValidation?.painPoint,
          sources: b.sources.map(s => ({
            source: s as DataSource,
            content: b.uvpValidation?.evidence?.[0] || '',
            confidence: (b.score || 50) / 100
          })),
          psychology: {
            triggerCategory: b.psychology?.triggerCategory || 'unknown',
            emotion: b.psychology?.emotion || 'unknown',
            urgency: (b.psychology?.urgency === 'critical' ? 'immediate' :
                     b.psychology?.urgency === 'high' ? 'urgent' : 'eventual') as 'immediate' | 'urgent' | 'eventual'
          },
          breakthroughScore: b.score || 50,
          actionableInsight: b.actionPlan || '',
          timeSensitive: b.timing?.isTimeSensitive || false
        }));
        correlatedInsights = [...correlatedInsights, ...breakthroughsAsInsights];
        console.log(`[Streaming] V3: Merged ${breakthroughsAsInsights.length} breakthroughs into correlatedInsights`);
      }

      console.log(`[Streaming] V3: Pre-dedup total insight count: ${correlatedInsights.length}`);

      // V3 FIX: Fast title-based deduplication (embedding dedup was too slow)
      // Uses normalized title comparison - fast and effective for exact/near duplicates
      correlatedInsights = this.deduplicateInsightsByTitle(correlatedInsights);
      console.log(`[Streaming] V3: Final unique insight count: ${correlatedInsights.length}`);

      // Clear breakthroughs array since they're now merged into correlatedInsights
      breakthroughs = [];
    } catch (correlationError) {
      console.warn('[Streaming] Correlation engine failed (non-fatal):', correlationError);
      // Fallback to basic correlation
      try {
        correlatedInsights = await this.findCorrelatedInsights(enhancedClusters);
      } catch (fallbackError) {
        console.warn('[Streaming] Fallback correlation also failed:', fallbackError);
      }
    }

    // 6.5. MAP CLUSTERS TO UVP PAIN POINTS
    const enhancedClustersWithUVP = this.mapClustersToUVP(enhancedClusters);

    // 7. Rebuild final context with ALL data
    this.currentContext = await this.buildContextFromDataPoints();

    // Add cluster themes to synthesis with UVP mapping
    if (this.currentContext) {
      this.currentContext.synthesis.hiddenPatterns = enhancedClustersWithUVP.map(c => ({
        type: 'correlation' as const,
        pattern: c.theme,
        significance: c.coherence,
        confidence: c.coherence,
        evidence: c.sources || [],
        implication: c.uvpMatch
          ? `Validates UVP: "${c.uvpMatch}" - ${c.crossSourceCount} sources confirm (${c.sources?.join(', ')})`
          : `Pattern discovered across ${c.size} data points from ${c.sources?.length || 0} sources`
      }));

      // Add breakthroughs to synthesis
      this.currentContext.synthesis.breakthroughs = breakthroughs;
    }

    // V3 FIX: Filter raw data points by quality before exposing to UI
    // Only expose data points with meaningful content and reasonable correlation
    if (this.currentContext) {
      const QUALITY_THRESHOLD = 0.3; // Minimum correlation score to display
      const MIN_CONTENT_LENGTH = 20; // Minimum characters for meaningful content

      const qualityFilteredDataPoints = this.dataPoints
        .map(dp => ({
          id: dp.id,
          source: dp.source,
          type: dp.type,
          content: dp.content,
          metadata: {
            ...dp.metadata,
            correlationScore: this.calculateDataPointCorrelationScore(dp)
          },
          createdAt: dp.createdAt,
          embedding: dp.embedding
        }))
        .filter(dp => {
          // Filter out low-quality data points
          const hasMinLength = (dp.content?.length || 0) >= MIN_CONTENT_LENGTH;
          const hasQualityScore = (dp.metadata.correlationScore || 0) >= QUALITY_THRESHOLD;
          // Always keep high-value types regardless of score
          const isHighValueType = ['customer_trigger', 'pain_point', 'competitor_mention', 'market_gap'].includes(dp.type);
          return hasMinLength && (hasQualityScore || isHighValueType);
        });

      console.log(`[Streaming] V3: Filtered ${this.dataPoints.length} → ${qualityFilteredDataPoints.length} quality data points (threshold: ${QUALITY_THRESHOLD})`);

      // CRITICAL FIX: Preserve ALL synthesis data BEFORE forceContextRebuild wipes them
      // forceContextRebuild() calls buildContextFromDataPoints() which creates a fresh context
      const preservedRawDataPoints = qualityFilteredDataPoints;
      const preservedCorrelatedInsights = correlatedInsights;
      const preservedBreakthroughs = this.currentContext.synthesis?.breakthroughs || [];
      const preservedHiddenPatterns = this.currentContext.synthesis?.hiddenPatterns || [];

      // FREEZE FIX: Force final context rebuild before notifying completion
      // This ensures any pending batched rebuilds are completed
      await this.forceContextRebuild();

      // NOW assign ALL preserved data AFTER the rebuild
      this.currentContext!.rawDataPoints = preservedRawDataPoints;
      this.currentContext!.correlatedInsights = preservedCorrelatedInsights;
      this.currentContext!.synthesis.breakthroughs = preservedBreakthroughs;
      this.currentContext!.synthesis.hiddenPatterns = preservedHiddenPatterns;

      console.log(`[Streaming] ✓ Preserved after rebuild: ${preservedRawDataPoints.length} rawDataPoints, ${preservedCorrelatedInsights.length} correlatedInsights, ${preservedBreakthroughs.length} breakthroughs, ${preservedHiddenPatterns.length} patterns`);

      // PHASE 15 FIX: Include UVP data for business purpose detection
      this.currentContext!.uvpData = this.uvpData;

      // V1 WIRING: Include detected outcomes for query targeting
      this.currentContext!.detectedOutcomes = this.detectedOutcomes;
    }

    // Final progress update
    this.notifyProgress(true);

    console.log(`[Streaming] Complete! ${this.dataPoints.length} data points, ${correlatedInsights.length} correlated insights in ${Date.now() - this.startTime}ms`);

    return this.currentContext!;
  }

  /**
   * Detect business type from brand data
   */
  private detectBusinessType(): 'local' | 'b2b-national' | 'b2b-global' {
    const industry = this.brandData?.industry?.toLowerCase() || '';
    const naicsCode = this.brandData?.naics_code || '';
    const hasLocation = !!(this.brandData?.city || this.brandData?.location);

    // B2B indicators
    const b2bNaicsCodes = ['511', '518', '541', '519']; // Software, Cloud, Professional Services, Data
    const b2bKeywords = ['software', 'saas', 'platform', 'enterprise', 'b2b', 'consulting', 'agency'];

    const isB2bNaics = b2bNaicsCodes.some(code => naicsCode.startsWith(code));
    const isB2bIndustry = b2bKeywords.some(kw => industry.includes(kw));

    if (isB2bNaics || isB2bIndustry) {
      return hasLocation ? 'b2b-national' : 'b2b-global';
    }

    return 'local';
  }

  /**
   * V2: Convert business type to BusinessSegment for dimension tagging
   */
  private getBusinessSegment(): BusinessSegment {
    const businessType = this.detectBusinessType();
    const industry = this.brandData?.industry?.toLowerCase() || '';
    const hasMultipleLocations = this.brandData?.locations?.length > 1;

    switch (businessType) {
      case 'b2b-global':
        return 'B2B_GLOBAL';
      case 'b2b-national':
        return 'B2B_NATIONAL';
      case 'local':
        // Distinguish between SMB_LOCAL and SMB_REGIONAL
        if (hasMultipleLocations || industry.includes('regional') || industry.includes('franchise')) {
          return 'SMB_REGIONAL';
        }
        return 'SMB_LOCAL';
      default:
        return 'SMB_LOCAL';
    }
  }

  /**
   * V3: Enhanced segment-aware API routing
   * Routes APIs based on business type for maximum relevance and efficiency
   */
  private getApisForBusinessType(businessType: string): ApiName[] {
    switch (businessType) {
      case 'local':
        // SMB Local: Emphasize local reviews, weather, Google Maps
        // Skip: G2 (B2B only), LinkedIn (low value for local)
        return [
          'serper',      // Fast - search insights
          'website',     // Fast - own website analysis
          'news',        // Fast - local news hooks
          'weather',     // Fast - weather triggers (SMB-critical)
          'competitor-discovery', // Task 6.7 - Early parallel discovery
          'outscraper',  // Medium - Google Maps reviews
          'youtube',     // Medium - local video content
          'semrush',     // Medium - local SEO keywords
          'reddit',      // Medium - local subreddit discussions
          'quora',       // Medium - local Q&A
          'trustpilot',  // Slow - reviews
          'twitter',     // Slow - local sentiment
          'yelp',        // Slow - SMB-critical reviews
          'perplexity'   // Slow - AI research
        ];

      case 'b2b-national':
        // B2B National: Balance local + enterprise APIs
        // Skip: Weather, Yelp (consumer-focused)
        return [
          'serper',      // Fast - search insights
          'website',     // Fast - own website analysis
          'news',        // Fast - industry news
          'competitor-discovery', // Task 6.7 - Early parallel discovery
          'linkedin',    // Medium - B2B decision makers
          'youtube',     // Medium - industry content
          'semrush',     // Medium - B2B keywords
          'reddit',      // Medium - industry discussions
          'quora',       // Medium - professional Q&A
          'g2',          // Slow - B2B software reviews
          'trustpilot',  // Slow - business reviews
          'twitter',     // Slow - industry sentiment
          'perplexity'   // Slow - AI research
        ];

      case 'b2b-global':
        // B2B Global: Maximize enterprise APIs
        // Skip: Weather, OutScraper, Yelp (all local-focused)
        return [
          'serper',      // Fast - global search insights
          'website',     // Fast - own website analysis
          'news',        // Fast - global industry news
          'competitor-discovery', // Task 6.7 - Early parallel discovery
          'linkedin',    // Medium - global B2B network (PRIORITY)
          'youtube',     // Medium - thought leadership content
          'semrush',     // Medium - global SEO competitive
          'reddit',      // Medium - industry subreddits
          'quora',       // Medium - professional Q&A
          'g2',          // Slow - B2B software reviews (PRIORITY)
          'trustpilot',  // Slow - global reviews
          'twitter',     // Slow - global sentiment
          'perplexity'   // Slow - AI research (PRIORITY for global insights)
        ];

      default:
        // Fallback to local for unknown types
        return ['serper', 'website', 'competitor-discovery', 'youtube', 'semrush', 'news', 'perplexity', 'reddit', 'quora', 'trustpilot', 'twitter'];
    }
  }

  /**
   * Run a single API and notify on completion
   */
  private async runApiWithCallback(api: ApiName, config: StreamingConfig): Promise<void> {
    try {
      console.log(`[Streaming/${api}] Starting...`);
      const startApiTime = Date.now();

      let apiDataPoints: DataPoint[] = [];

      switch (api) {
        case 'serper':
          apiDataPoints = await this.fetchSerperData();
          break;
        case 'website':
          apiDataPoints = await this.fetchWebsiteData();
          break;
        case 'outscraper':
          apiDataPoints = await this.fetchOutScraperData();
          break;
        case 'youtube':
          apiDataPoints = await this.fetchYouTubeData();
          break;
        case 'semrush':
          apiDataPoints = await this.fetchSemrushData();
          break;
        case 'news':
          apiDataPoints = await this.fetchNewsData();
          break;
        case 'weather':
          apiDataPoints = await this.fetchWeatherData();
          break;
        case 'linkedin':
          apiDataPoints = await this.fetchLinkedInData();
          break;
        case 'perplexity':
          apiDataPoints = await this.fetchPerplexityData();
          break;
        case 'reddit':
          apiDataPoints = await this.fetchRedditData();
          break;
        case 'quora':
          apiDataPoints = await this.fetchQuoraData();
          break;
        case 'g2':
          apiDataPoints = await this.fetchG2Data();
          break;
        case 'trustpilot':
          apiDataPoints = await this.fetchTrustPilotData();
          break;
        case 'twitter':
          apiDataPoints = await this.fetchTwitterData();
          break;
        case 'yelp':
          apiDataPoints = await this.fetchYelpData();
          break;
        case 'competitor-discovery':
          // Task 6.7: Early competitor discovery runs in parallel with other APIs
          // Uses the streaming manager to discover and save competitors
          apiDataPoints = await this.fetchCompetitorDiscoveryData(config);
          break;
      }

      // Add data points and mark complete
      this.dataPoints.push(...apiDataPoints);
      this.completedApis.add(api);

      console.log(`[Streaming/${api}] Complete: ${apiDataPoints.length} data points in ${Date.now() - startApiTime}ms`);

      // FREEZE FIX: Do NOT rebuild context for every API completion
      // Instead, schedule a batched context rebuild
      // Context will be rebuilt when notifyProgress actually flushes
      this.scheduleContextRebuild();
      this.notifyProgress(false);

    } catch (error) {
      console.error(`[Streaming/${api}] Error:`, error);
      this.completedApis.add(api); // Mark as complete even on failure
      this.notifyProgress(false);
    }
  }

  /**
   * Deduplicate data points by embedding similarity
   * Keeps the higher-quality version (more metadata, better source)
   */
  private deduplicateBySimilarity(dataPoints: DataPoint[], threshold: number = 0.92): DataPoint[] {
    const kept: DataPoint[] = [];
    const removed = new Set<string>();

    for (const dp of dataPoints) {
      if (removed.has(dp.id)) continue;
      if (!dp.embedding) {
        kept.push(dp);
        continue;
      }

      // Check against already-kept items
      let isDuplicate = false;
      for (const keptDp of kept) {
        if (!keptDp.embedding) continue;

        const similarity = embeddingService.cosineSimilarity(dp.embedding, keptDp.embedding);
        if (similarity >= threshold) {
          isDuplicate = true;
          // Keep the one with more metadata/better source
          const dpScore = this.scoreDataPointQuality(dp);
          const keptScore = this.scoreDataPointQuality(keptDp);
          if (dpScore > keptScore) {
            // Replace kept with this better one
            const idx = kept.indexOf(keptDp);
            kept[idx] = dp;
            removed.add(keptDp.id);
          }
          break;
        }
      }

      if (!isDuplicate) {
        kept.push(dp);
      } else {
        removed.add(dp.id);
      }
    }

    return kept;
  }

  /**
   * Score data point quality for dedup decisions
   */
  private scoreDataPointQuality(dp: DataPoint): number {
    let score = 0;
    if (dp.metadata && Object.keys(dp.metadata).length > 2) score += 2;
    if (dp.content.length > 100) score += 1;
    if (dp.metadata?.url) score += 1;
    if (dp.metadata?.confidence) score += dp.metadata.confidence;
    // Prefer certain sources
    if (['perplexity', 'semrush'].includes(dp.source)) score += 2;
    if (['youtube', 'news'].includes(dp.source)) score += 1;
    return score;
  }

  /**
   * Notify UI of progress - BATCHED to prevent freeze
   *
   * FREEZE FIX: Instead of notifying immediately for every API,
   * we batch notifications and only fire every 500ms.
   * This prevents 15+ context rebuilds that each take 500ms.
   */
  private notifyProgress(isComplete: boolean): void {
    if (!this.onProgress || !this.currentContext) return;

    // If this is the final notification, flush immediately
    if (isComplete) {
      if (this.progressBatchTimeout) {
        clearTimeout(this.progressBatchTimeout);
        this.progressBatchTimeout = null;
      }
      this.flushProgressNotification(true);
      return;
    }

    // Mark that we have a pending notification
    this.pendingProgressNotification = true;

    // If we already have a pending flush, let it handle it
    if (this.progressBatchTimeout) {
      return;
    }

    // Schedule a batched notification flush
    this.progressBatchTimeout = setTimeout(() => {
      this.progressBatchTimeout = null;
      if (this.pendingProgressNotification) {
        this.flushProgressNotification(false);
        this.pendingProgressNotification = false;
      }
    }, this.PROGRESS_BATCH_WINDOW_MS);
  }

  /**
   * Actually send the progress notification to UI
   */
  private flushProgressNotification(isComplete: boolean): void {
    if (!this.onProgress || !this.currentContext) return;

    const pendingApis = ALL_APIS.filter(api => !this.completedApis.has(api));

    console.log(`[Streaming] Flushing progress: ${this.completedApis.size} APIs complete, ${this.dataPoints.length} data points`);

    this.onProgress({
      context: this.currentContext,
      completedApis: Array.from(this.completedApis),
      pendingApis,
      dataPointsCollected: this.dataPoints.length,
      buildTimeMs: Date.now() - this.startTime,
      isComplete
    });
  }

  /**
   * FREEZE FIX: Schedule a batched context rebuild
   * Instead of rebuilding context for every API, batch them together
   */
  private scheduleContextRebuild(): void {
    this.contextRebuildPending = true;

    // If already scheduled, let the existing timeout handle it
    if (this.contextRebuildTimeout) {
      return;
    }

    // Schedule rebuild after batch window
    this.contextRebuildTimeout = setTimeout(async () => {
      this.contextRebuildTimeout = null;
      if (this.contextRebuildPending) {
        console.log(`[Streaming] Batched context rebuild with ${this.dataPoints.length} data points`);
        this.currentContext = await this.buildContextFromDataPoints();
        this.contextRebuildPending = false;
      }
    }, this.CONTEXT_REBUILD_BATCH_MS);
  }

  /**
   * Force immediate context rebuild (for final completion)
   */
  private async forceContextRebuild(): Promise<void> {
    if (this.contextRebuildTimeout) {
      clearTimeout(this.contextRebuildTimeout);
      this.contextRebuildTimeout = null;
    }
    this.currentContext = await this.buildContextFromDataPoints();
    this.contextRebuildPending = false;
  }

  /**
   * Load brand data from database
   */
  private async loadBrandData(brandId: string): Promise<any> {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single();

    if (error) throw new Error(`Failed to load brand: ${error.message}`);
    return data;
  }

  /**
   * Build empty context structure
   */
  private buildEmptyContext(): DeepContext {
    return {
      business: {
        profile: {
          id: this.brandData.id,
          name: this.brandData.name,
          industry: this.brandData.industry,
          naicsCode: this.brandData.naics_code,
          website: this.brandData.website || '',
          location: {
            city: this.brandData.city || '',
            state: this.brandData.state || '',
            country: this.brandData.country || 'US'
          },
          keywords: this.brandData.keywords || [this.brandData.industry],
          competitors: []
        },
        brandVoice: {
          tone: ['professional'],
          values: [],
          personality: [],
          avoidWords: [],
          signaturePhrases: []
        },
        uniqueAdvantages: [],
        goals: [],
        // UVP context - populated from uvp_data table
        uvp: this.uvpData ? {
          targetCustomer: this.uvpData.target_customer || '',
          customerProblem: this.uvpData.transformation?.split('→')[0]?.trim() || '',
          desiredOutcome: this.uvpData.transformation?.split('→')[1]?.trim() || '',
          uniqueSolution: this.uvpData.unique_solution || '',
          keyBenefit: this.uvpData.key_benefit || '',
          completeStatement: this.uvpData.complete_statement || '',
          emotionalDrivers: [], // TODO: Parse from UVP
          functionalDrivers: [] // TODO: Parse from UVP
        } : undefined
      },
      industry: {
        profile: null,
        trends: [],
        seasonality: [],
        competitiveLandscape: {
          topCompetitors: [],
          marketConcentration: 'moderate' as const,
          barrierToEntry: 'medium' as const
        },
        economicFactors: []
      },
      realTimeCultural: {
        trends: [],
        moments: [],
        signals: []
      },
      competitiveIntel: {
        blindSpots: [],
        mistakes: [],
        opportunities: [],
        contentGaps: [],
        positioningWeaknesses: []
      },
      customerPsychology: {
        unarticulated: [],
        emotional: [],
        behavioral: [],
        identityDesires: [],
        purchaseMotivations: [],
        objections: []
      },
      synthesis: {
        keyInsights: [],
        hiddenPatterns: [],
        opportunityScore: 0,
        recommendedAngles: [],
        confidenceLevel: 0,
        generatedAt: new Date()
      },
      metadata: {
        aggregatedAt: new Date(),
        dataSourcesUsed: [],
        processingTimeMs: 0,
        version: '2.0.0-streaming'
      }
    };
  }

  /**
   * Build context from accumulated data points
   * IMPORTANT: Preserves websiteAnalysis if already set
   */
  private async buildContextFromDataPoints(): Promise<DeepContext> {
    const context = this.buildEmptyContext();

    // PRESERVE websiteAnalysis from previous context (it's set separately by fetchWebsiteData)
    if (this.currentContext?.business?.websiteAnalysis) {
      if (!context.business) {
        context.business = {} as any;
      }
      (context.business as any).websiteAnalysis = this.currentContext.business.websiteAnalysis;
    }

    // Categorize data points
    const trendingTopics = this.dataPoints.filter(dp => dp.type === 'trending_topic');
    const customerTriggers = this.dataPoints.filter(dp => dp.type === 'customer_trigger');
    const competitiveGaps = this.dataPoints.filter(dp => dp.type === 'competitive_gap');
    const painPoints = this.dataPoints.filter(dp => dp.type === 'pain_point');
    const unarticulatedNeeds = this.dataPoints.filter(dp => dp.type === 'unarticulated_need');

    // Populate industry trends (increased from 10 to 50)
    context.industry.trends = trendingTopics.slice(0, 50).map(dp => ({
      trend: dp.content,
      direction: 'rising' as const,
      strength: 0.7,
      timeframe: 'current',
      impact: 'medium' as const,
      source: dp.source,
      timestamp: dp.createdAt?.toISOString()
    }));

    // Populate customer psychology (no limit on unarticulated needs)
    context.customerPsychology.unarticulated = unarticulatedNeeds.map(dp => ({
      need: dp.content,
      confidence: 0.7,
      evidence: [],
      marketingAngle: dp.metadata?.marketingAngle || 'Address this need in content',
      emotionalDriver: dp.metadata?.emotionalDriver
    }));

    // Populate behavioral triggers (increased from 10 to 50)
    context.customerPsychology.behavioral = customerTriggers.slice(0, 50).map(dp => ({
      behavior: dp.content,
      frequency: 'common' as const,
      insight: 'Customer trigger identified',
      contentAlignment: 'Create content addressing this trigger'
    }));

    // Populate competitive intel (increased from 10 to 50)
    context.competitiveIntel.opportunities = competitiveGaps.slice(0, 50).map(dp => ({
      gap: dp.content,
      positioning: dp.metadata?.positioning || 'Opportunity to differentiate',
      evidence: dp.metadata?.evidence || []
    }));

    // Update metadata
    context.metadata.dataSourcesUsed = Array.from(this.completedApis);
    context.metadata.processingTimeMs = Date.now() - this.startTime;
    context.metadata.aggregatedAt = new Date();

    return context;
  }

  // ============================================================================
  // HELPER: Extract searchable customer term from UVP target customer
  // ============================================================================

  /**
   * Extract a clean search term from UVP target customer description
   * e.g., "Enterprise businesses struggling to manage AI agents at scale" → "enterprise AI management"
   */
  private extractCustomerSearchTerm(targetCustomer: string): string {
    // Common patterns to extract customer type
    const customerTypes = [
      // B2B
      { pattern: /enterprise\s+(?:businesses?|companies?|organizations?)/i, term: 'enterprise' },
      { pattern: /(?:small|medium|smb)\s+(?:businesses?|companies?)/i, term: 'small business' },
      { pattern: /startups?/i, term: 'startup' },
      { pattern: /(?:saas|software)\s+(?:companies?|businesses?)/i, term: 'SaaS companies' },
      { pattern: /agencies?/i, term: 'agency' },
      // B2C
      { pattern: /homeowners?/i, term: 'homeowners' },
      { pattern: /(?:car|vehicle|auto)\s+(?:owners?|collectors?)/i, term: 'car owners' },
      { pattern: /parents?/i, term: 'parents' },
      { pattern: /professionals?/i, term: 'professionals' },
    ];

    // Try to match customer type
    for (const { pattern, term } of customerTypes) {
      if (pattern.test(targetCustomer)) {
        // Also try to extract the domain/context
        const contextMatch = targetCustomer.match(/(?:with|for|need|managing?|struggling|looking)\s+(?:to\s+)?([^,.]+)/i);
        if (contextMatch) {
          return `${term} ${contextMatch[1].trim().substring(0, 30)}`;
        }
        return term;
      }
    }

    // Fallback: Extract key nouns from the target customer
    const words = targetCustomer.split(/\s+/).slice(0, 5).join(' ');
    return words || 'business';
  }

  /**
   * PHASE 15: Convert legacy UVP format to CompleteUVP format for business purpose detection
   */
  private convertLegacyUVPToComplete(uvpData: any): any {
    return {
      // Core value proposition
      valuePropositionStatement: uvpData.complete_statement || '',

      // Target customer information
      targetCustomer: {
        statement: uvpData.target_customer || '',
        role: uvpData.target_customer || '',
        industry: this.brandData.industry || '',
        companySize: '', // Not available in legacy format
        emotionalDrivers: [],
        functionalDrivers: [],
        evidenceQuotes: [],
        marketGeography: {
          headquarters: '',
          primaryRegions: [],
          focusMarkets: []
        }
      },

      // Key benefit
      keyBenefit: {
        statement: uvpData.key_benefit || '',
        outcomeStatement: uvpData.transformation?.split('→')[1]?.trim() || ''
      },

      // Transformation goal
      transformationGoal: {
        statement: uvpData.transformation || '',
        who: uvpData.target_customer || '',
        before: uvpData.transformation?.split('→')[0]?.trim() || '',
        after: uvpData.transformation?.split('→')[1]?.trim() || '',
        how: uvpData.unique_solution || '',
        why: uvpData.key_benefit || '',
        emotionalDrivers: [],
        functionalDrivers: [],
        customerQuotes: []
      },

      // Unique solution
      uniqueSolution: {
        statement: uvpData.unique_solution || '',
        methodology: uvpData.unique_mechanism || '',
        proprietaryApproach: '',
        differentiators: uvpData.proof_points ? [
          {
            statement: uvpData.proof_points,
            evidence: '',
            category: 'proof'
          }
        ] : []
      },

      // Products/Services - construct from brand data
      productsServices: {
        categories: [
          {
            name: this.brandData.name || 'Product',
            description: uvpData.unique_solution || this.brandData.description || '',
            items: [
              {
                name: this.brandData.name || 'Primary Product',
                description: uvpData.key_benefit || '',
                category: this.brandData.industry || 'Business Solution'
              }
            ]
          }
        ]
      }
    };
  }

  // ============================================================================
  // API FETCH METHODS - Each runs independently
  // ============================================================================

  private async fetchSerperData(): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];

    // CRITICAL: Search for TARGET CUSTOMER needs, not industry trends
    // Use UVP target_customer to understand WHO we're creating content FOR
    const targetCustomer = this.uvpData?.target_customer || '';
    const customerProblem = this.uvpData?.transformation?.split('→')[0]?.trim() || ''; // "before" state
    const industry = this.brandData.industry;

    // Build customer-focused search queries
    const customerSearchTerm = targetCustomer
      ? this.extractCustomerSearchTerm(targetCustomer)
      : industry;

    // Log whether we're using UVP-targeted or generic fallback
    if (targetCustomer) {
      console.log('[Streaming/serper] ✅ Using UVP-TARGETED search:', customerSearchTerm);
    } else {
      console.warn('[Streaming/serper] ⚠️ FALLBACK to generic industry search:', industry);
    }

    console.log('[Streaming/serper] Searching for TARGET CUSTOMER insights:', {
      targetCustomer: targetCustomer.substring(0, 100),
      customerSearchTerm,
      customerProblem: customerProblem.substring(0, 100)
    });

    // PHASE 15: Use business purpose-aware queries for Serper search
    let searchTerms: string[];
    if (this.contextualQueries.length > 0) {
      // Use search and news contextual queries from business purpose detection
      const searchQueries = getQueriesForType(this.contextualQueries, 'search');
      const newsQueries = getQueriesForType(this.contextualQueries, 'news');
      searchTerms = [
        ...searchQueries.slice(0, 2).map(q => q.query),
        ...newsQueries.slice(0, 1).map(q => q.query)
      ];
      console.log(`[Streaming/serper] ✅ Using BUSINESS PURPOSE-AWARE search terms:`, searchTerms);
    } else {
      // Fallback to old method
      searchTerms = [`${customerSearchTerm} challenges problems`, customerSearchTerm, `${customerSearchTerm} how to`];
      console.log(`[Streaming/serper] ⚠️ Fallback to legacy search terms:`, searchTerms);
    }

    // Parallel Serper calls - searching for CUSTOMER pain points and needs
    const [newsResult, trendsResult, autocompleteResult] = await Promise.allSettled([
      SerperAPI.getNews(searchTerms[0] || `${customerSearchTerm} challenges problems`, undefined),
      SerperAPI.getTrends(searchTerms[1] || customerSearchTerm),
      SerperAPI.getAutocomplete(searchTerms[2] || `${customerSearchTerm} how to`)
    ]);

    if (newsResult.status === 'fulfilled') {
      // INCREASED from 30 to 50 - news articles are valuable data points
      newsResult.value.slice(0, 50).forEach((article: any, idx: number) => {
        dataPoints.push({
          id: `serper-news-${Date.now()}-${idx}`,
          source: 'serper' as DataSource,
          type: 'trending_topic' as DataPointType,
          content: `${article.title}: ${article.snippet}`,
          metadata: { url: article.link, source: article.source },
          createdAt: new Date()
        });
      });
    }

    if (autocompleteResult.status === 'fulfilled') {
      // INCREASED from 25 to 40 - autocomplete shows real user intent
      autocompleteResult.value.slice(0, 40).forEach((suggestion: string, idx: number) => {
        dataPoints.push({
          id: `serper-auto-${Date.now()}-${idx}`,
          source: 'serper' as DataSource,
          type: 'customer_trigger' as DataPointType,
          content: suggestion,
          metadata: { type: 'search_intent' },
          createdAt: new Date()
        });
      });
    }

    // ADDED: Also add trends as data points
    if (trendsResult.status === 'fulfilled' && trendsResult.value?.trendingSearches) {
      trendsResult.value.trendingSearches.slice(0, 30).forEach((trend: any, idx: number) => {
        const trendText = typeof trend === 'string' ? trend : trend.query || trend.title || '';
        if (trendText) {
          dataPoints.push({
            id: `serper-trend-${Date.now()}-${idx}`,
            source: 'serper' as DataSource,
            type: 'trending_topic' as DataPointType,
            content: trendText,
            metadata: { type: 'google_trend' },
            createdAt: new Date()
          });
        }
      });
    }

    return dataPoints;
  }

  private async fetchWebsiteData(): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];
    const websiteUrl = this.brandData.website;

    if (!websiteUrl) return dataPoints;

    try {
      const analysis = await websiteAnalyzer.analyzeWebsite(websiteUrl);

      // VALUE PROPOSITIONS - brand's stated benefits
      analysis.valuePropositions?.forEach((vp: string, idx: number) => {
        dataPoints.push({
          id: `website-vp-${Date.now()}-${idx}`,
          source: 'website' as DataSource,
          type: 'pain_point' as DataPointType,
          content: vp,
          metadata: { confidence: analysis.confidence, type: 'value_proposition' },
          createdAt: new Date()
        });
      });

      // TARGET AUDIENCE - who they serve
      analysis.targetAudience?.forEach((audience: string, idx: number) => {
        dataPoints.push({
          id: `website-audience-${Date.now()}-${idx}`,
          source: 'website' as DataSource,
          type: 'unarticulated_need' as DataPointType,
          content: audience,
          metadata: { confidence: analysis.confidence, type: 'target_audience' },
          createdAt: new Date()
        });
      });

      // CUSTOMER PROBLEMS - pain points they address
      analysis.customerProblems?.forEach((problem: string, idx: number) => {
        dataPoints.push({
          id: `website-problem-${Date.now()}-${idx}`,
          source: 'website' as DataSource,
          type: 'pain_point' as DataPointType,
          content: problem,
          metadata: { confidence: analysis.confidence, type: 'customer_problem' },
          createdAt: new Date()
        });
      });

      // SOLUTIONS - how they solve problems
      analysis.solutions?.forEach((solution: string, idx: number) => {
        dataPoints.push({
          id: `website-solution-${Date.now()}-${idx}`,
          source: 'website' as DataSource,
          type: 'competitive_gap' as DataPointType,
          content: solution,
          metadata: { confidence: analysis.confidence, type: 'solution' },
          createdAt: new Date()
        });
      });

      // PROOF POINTS - credentials, testimonials, stats
      analysis.proofPoints?.forEach((proof: string, idx: number) => {
        dataPoints.push({
          id: `website-proof-${Date.now()}-${idx}`,
          source: 'website' as DataSource,
          type: 'customer_trigger' as DataPointType,
          content: proof,
          metadata: { confidence: analysis.confidence, type: 'proof_point' },
          createdAt: new Date()
        });
      });

      // DIFFERENTIATORS - what makes them unique
      analysis.differentiators?.forEach((diff: string, idx: number) => {
        dataPoints.push({
          id: `website-diff-${Date.now()}-${idx}`,
          source: 'website' as DataSource,
          type: 'competitive_gap' as DataPointType,
          content: diff,
          metadata: { confidence: analysis.confidence, type: 'differentiator' },
          createdAt: new Date()
        });
      });

      // TESTIMONIALS - customer quotes from website
      analysis.testimonials?.forEach((testimonial: string, idx: number) => {
        dataPoints.push({
          id: `website-testimonial-${Date.now()}-${idx}`,
          source: 'website' as DataSource,
          type: 'customer_trigger' as DataPointType,
          content: testimonial,
          metadata: { confidence: analysis.confidence, type: 'testimonial' },
          createdAt: new Date()
        });
      });

      // KEYWORDS - meta tag keywords from website
      analysis.keywords?.forEach((keyword: string, idx: number) => {
        dataPoints.push({
          id: `website-keyword-${Date.now()}-${idx}`,
          source: 'website' as DataSource,
          type: 'trending_topic' as DataPointType,
          content: keyword,
          metadata: { confidence: analysis.confidence, type: 'meta_keyword' },
          createdAt: new Date()
        });
      });

      // Store full website analysis in context for sidebar access
      if (!this.currentContext) {
        this.currentContext = this.buildEmptyContext();
      }
      if (!this.currentContext.business) {
        this.currentContext.business = {} as any;
      }
      (this.currentContext.business as any).websiteAnalysis = {
        testimonials: analysis.testimonials || [],
        proofPoints: analysis.proofPoints || [],
        metaTags: analysis.metaTags || {},
        keywords: analysis.keywords || [],
        differentiators: analysis.differentiators || [],
        valuePropositions: analysis.valuePropositions || [],
        targetAudience: analysis.targetAudience || [],
        solutions: analysis.solutions || [],
        customerProblems: analysis.customerProblems || [],
        confidence: analysis.confidence
      };

      console.log('[Streaming/website] Stored websiteAnalysis in currentContext:', {
        testimonials: analysis.testimonials?.length || 0,
        proofPoints: analysis.proofPoints?.length || 0,
        metaTags: Object.keys(analysis.metaTags || {}).length,
        keywords: analysis.keywords?.length || 0,
        differentiators: analysis.differentiators?.length || 0,
        valuePropositions: analysis.valuePropositions?.length || 0,
        solutions: analysis.solutions?.length || 0,
        customerProblems: analysis.customerProblems?.length || 0
      });

      console.log(`[Streaming/website] Extracted ${dataPoints.length} data points from website`);
      if (analysis.testimonials?.length) {
        console.log(`[Streaming/website] Found ${analysis.testimonials.length} testimonials`);
      }
      if (analysis.keywords?.length) {
        console.log(`[Streaming/website] Found ${analysis.keywords.length} keywords from meta tags`);
      }
    } catch (error) {
      console.error('[Streaming/website] Analysis failed:', error);
    }

    return dataPoints;
  }

  private async fetchOutScraperData(): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];

    // Skip if no location (B2B companies)
    const location = this.brandData.location
      ? typeof this.brandData.location === 'string'
        ? this.brandData.location
        : `${this.brandData.location.city}, ${this.brandData.location.state}`
      : this.brandData.city;

    if (!location) {
      console.log('[Streaming/outscraper] No location, skipping');
      return dataPoints;
    }

    try {
      // Use UVP-derived industry for more relevant competitor discovery
      const uvpIndustry = this.getUVPIndustry();
      console.log(`[Streaming/outscraper] Using UVP industry: "${uvpIndustry}" for competitor discovery`);

      const competitors = await OutScraperAPI.discoverCompetitors({
        businessName: this.brandData.name,
        location,
        industry: uvpIndustry,
        radius: 10
      });

      // Scrape reviews in PARALLEL (not sequential)
      const reviewPromises = competitors.slice(0, 2).map(async (competitor: any) => {
        try {
          const reviews = await OutScraperAPI.scrapeGoogleReviews({
            place_id: competitor.place_id,
            business_name: competitor.name,
            location,
            industry: uvpIndustry,
            limit: 10,
            sort: 'newest'
          });

          // ITEM #12: Stratify reviews by rating tier
          // 1-2 stars: pain points/complaints
          // 3 stars: mixed sentiment
          // 4-5 stars: praise/testimonials
          return reviews.map((review: any, idx: number) => {
            const rating = review.rating || 3;
            const ratingTier = rating <= 2 ? 'low' : rating >= 4 ? 'high' : 'mid';

            return {
              id: `outscraper-review-${Date.now()}-${idx}`,
              source: 'outscraper' as DataSource,
              type: this.mapRatingToDataPointType(rating),
              content: review.text,
              metadata: {
                competitor: competitor.name,
                rating: rating,
                ratingTier: ratingTier,
                // Extract specific insights based on tier
                insightType: ratingTier === 'low' ? 'complaint' :
                            ratingTier === 'high' ? 'testimonial' : 'feedback'
              },
              createdAt: new Date(review.time)
            };
          });
        } catch (e) {
          return [];
        }
      });

      const reviewResults = await Promise.all(reviewPromises);
      reviewResults.forEach(reviews => dataPoints.push(...reviews));

      // ITEM #12: Log stratification results
      const lowRating = dataPoints.filter(dp => dp.metadata?.ratingTier === 'low').length;
      const midRating = dataPoints.filter(dp => dp.metadata?.ratingTier === 'mid').length;
      const highRating = dataPoints.filter(dp => dp.metadata?.ratingTier === 'high').length;
      console.log(`[Streaming/reviews] Stratified ${dataPoints.length} reviews: ${lowRating} low (pain points), ${midRating} mid (mixed), ${highRating} high (testimonials)`);

      // ITEM #20: Local Competitor Extraction from Reviews
      const competitorInsights = this.extractCompetitorMentionsFromReviews(dataPoints, competitors);
      competitorInsights.forEach((insight, idx) => {
        dataPoints.push({
          id: `competitor-insight-${Date.now()}-${idx}`,
          source: 'outscraper' as DataSource,
          type: 'competitor_mention' as DataPointType,
          content: insight.insight,
          metadata: {
            competitorName: insight.competitorName,
            mentionType: insight.mentionType,
            sentiment: insight.sentiment,
            platform: 'local_competitor'
          },
          createdAt: new Date()
        });
      });

      // ITEM #21: Regional Chain Comparison (if multiple competitors found)
      if (competitors.length > 1) {
        const chainComparisons = this.generateRegionalChainComparisons(competitors, dataPoints);
        chainComparisons.forEach((comparison, idx) => {
          dataPoints.push({
            id: `chain-compare-${Date.now()}-${idx}`,
            source: 'outscraper' as DataSource,
            type: 'competitive_gap' as DataPointType,
            content: comparison.contentIdea,
            metadata: {
              comparedCompetitors: comparison.competitors,
              comparisonType: comparison.type,
              advantageArea: comparison.advantageArea,
              platform: 'regional_chain_comparison'
            },
            createdAt: new Date()
          });
        });

        console.log(`[Streaming/outscraper] Generated ${competitorInsights.length} competitor insights, ${chainComparisons.length} chain comparisons`);
      }

    } catch (error) {
      console.error('[Streaming/outscraper] Error:', error);
    }

    return dataPoints;
  }

  /**
   * ITEM #20: Extract competitor mentions and insights from review data
   */
  private extractCompetitorMentionsFromReviews(
    reviewDataPoints: DataPoint[],
    competitors: any[]
  ): Array<{ competitorName: string; insight: string; mentionType: string; sentiment: string }> {
    const insights: Array<{ competitorName: string; insight: string; mentionType: string; sentiment: string }> = [];

    const competitorNames = competitors.map(c => c.name.toLowerCase());

    // Analyze low-rated reviews for competitor weaknesses
    const lowRatedReviews = reviewDataPoints.filter(dp => dp.metadata?.ratingTier === 'low');
    const highRatedReviews = reviewDataPoints.filter(dp => dp.metadata?.ratingTier === 'high');

    // Extract common complaints from low-rated reviews
    const complaintPatterns = [
      { pattern: /wait|slow|long time/i, type: 'speed', insight: 'Customers frustrated with wait times - opportunity to emphasize quick service' },
      { pattern: /rude|unfriendly|attitude/i, type: 'service', insight: 'Service quality complaints - highlight your friendly team' },
      { pattern: /expensive|overpriced|cost/i, type: 'price', insight: 'Price sensitivity - consider value messaging or transparent pricing' },
      { pattern: /dirty|unclean|messy/i, type: 'cleanliness', insight: 'Cleanliness concerns - emphasize your standards' },
      { pattern: /didn't fix|not resolved|still broken/i, type: 'quality', insight: 'Work quality issues - showcase your guarantee or warranty' }
    ];

    lowRatedReviews.forEach(review => {
      const competitorName = review.metadata?.competitor || 'Competitor';

      complaintPatterns.forEach(({ pattern, type, insight }) => {
        if (pattern.test(review.content)) {
          insights.push({
            competitorName: competitorName,
            insight: `${competitorName}: ${insight}`,
            mentionType: type,
            sentiment: 'negative'
          });
        }
      });
    });

    // Extract competitor strengths to learn from (high-rated reviews)
    highRatedReviews.slice(0, 5).forEach(review => {
      const competitorName = review.metadata?.competitor || 'Competitor';
      insights.push({
        competitorName: competitorName,
        insight: `What ${competitorName} does well: ${review.content.substring(0, 100)}...`,
        mentionType: 'strength',
        sentiment: 'positive'
      });
    });

    return insights.slice(0, 10);
  }

  /**
   * ITEM #21: Generate regional chain comparisons based on competitor data
   */
  private generateRegionalChainComparisons(
    competitors: any[],
    reviewDataPoints: DataPoint[]
  ): Array<{ contentIdea: string; competitors: string[]; type: string; advantageArea: string }> {
    const comparisons: Array<{ contentIdea: string; competitors: string[]; type: string; advantageArea: string }> = [];

    if (competitors.length < 2) return comparisons;

    const competitorNames = competitors.slice(0, 3).map(c => c.name);

    // Rating-based comparison
    const avgRatings = competitors.slice(0, 3).map(c => ({
      name: c.name,
      rating: c.rating || 4.0
    }));

    const highestRated = avgRatings.sort((a, b) => b.rating - a.rating)[0];

    comparisons.push({
      contentIdea: `Why customers prefer us over ${competitorNames.filter(n => n !== this.brandData.name).join(' and ')}`,
      competitors: competitorNames,
      type: 'differentiation',
      advantageArea: 'overall_value'
    });

    // Service comparison
    comparisons.push({
      contentIdea: `${this.brandData.name} vs local competitors: What makes us different`,
      competitors: competitorNames,
      type: 'head_to_head',
      advantageArea: 'service_quality'
    });

    // Local expertise angle
    comparisons.push({
      contentIdea: `Local expertise: How we serve [location] better than chain competitors`,
      competitors: competitorNames,
      type: 'local_advantage',
      advantageArea: 'community_knowledge'
    });

    return comparisons;
  }

  private async fetchYouTubeData(): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];

    // CRITICAL: Use UVP target customer and pain points for YouTube search
    const targetCustomer = this.uvpData?.target_customer || '';
    const transformation = this.uvpData?.transformation || '';
    const customerProblem = transformation.split('→')[0]?.trim() || '';

    // Build customer-focused keywords instead of generic industry
    const baseKeywords = this.brandData.keywords || [];
    const customerKeywords = targetCustomer
      ? [
          this.extractCustomerSearchTerm(targetCustomer),
          customerProblem.substring(0, 40),
          ...baseKeywords.slice(0, 3)
        ].filter(Boolean)
      : [this.brandData.industry];

    const searchContext = targetCustomer
      ? `${this.extractCustomerSearchTerm(targetCustomer)} challenges`
      : this.brandData.industry;

    // Log whether we're using UVP-targeted or generic fallback
    if (targetCustomer) {
      console.log('[Streaming/youtube] ✅ Using UVP-TARGETED search:', searchContext);
    } else {
      console.warn('[Streaming/youtube] ⚠️ FALLBACK to generic industry search:', this.brandData.industry);
    }

    console.log('[Streaming/youtube] Searching for TARGET CUSTOMER content:', {
      targetCustomer: targetCustomer.substring(0, 80),
      searchContext,
      keywords: customerKeywords.slice(0, 3)
    });

    try {
      const trends = await YouTubeAPI.analyzeVideoTrends(searchContext, customerKeywords);

      // INCREASED from 50 to 100 - YouTube titles are RICH data points
      trends.trending_topics.slice(0, 100).forEach((topic: string, idx: number) => {
        dataPoints.push({
          id: `youtube-topic-${Date.now()}-${idx}`,
          source: 'youtube' as DataSource,
          type: 'trending_topic' as DataPointType,
          content: topic,
          metadata: { platform: 'youtube' },
          createdAt: new Date()
        });
      });

      // Content angles (usually 5-10)
      trends.content_angles.forEach((angle: string, idx: number) => {
        dataPoints.push({
          id: `youtube-angle-${Date.now()}-${idx}`,
          source: 'youtube' as DataSource,
          type: 'customer_trigger' as DataPointType,
          content: angle,
          metadata: { type: 'content_angle' },
          createdAt: new Date()
        });
      });

      // ADDED: Also add popular formats as data points
      trends.popular_formats.forEach((format: string, idx: number) => {
        dataPoints.push({
          id: `youtube-format-${Date.now()}-${idx}`,
          source: 'youtube' as DataSource,
          type: 'competitive_gap' as DataPointType,
          content: `Popular video format: ${format}`,
          metadata: { type: 'popular_format' },
          createdAt: new Date()
        });
      });

      // SPEED: Skip YouTube comment mining - takes 30+ seconds and returns 0 results
      // The video trends and content angles are more valuable anyway
      console.log('[Streaming/youtube] Skipping comment mining for speed (video trends captured above)');

    } catch (error) {
      console.error('[Streaming/youtube] Error:', error);
    }

    return dataPoints;
  }

  /**
   * Map YouTube psychological pattern type to DataPointType
   */
  private mapYouTubePatternToDataPointType(patternType: string): DataPointType {
    const mapping: Record<string, DataPointType> = {
      'wish': 'unarticulated_need',
      'hate': 'pain_point',
      'fear': 'pain_point',
      'desire': 'unarticulated_need',
      'frustration': 'pain_point',
      'praise': 'customer_trigger'
    };
    return mapping[patternType] || 'customer_trigger';
  }

  /**
   * Categorize YouTube comment by content patterns
   */
  private categorizeYouTubeComment(text: string): DataPointType | null {
    const lowerText = text.toLowerCase();

    // Questions indicate information gaps
    if (/\?|how (do|can|to)|what (is|are)|why (do|does|is)/.test(lowerText)) {
      return 'question';
    }

    // Pain expressions
    if (/hate|frustrat|annoying|problem|issue|struggle|difficult|hard to/.test(lowerText)) {
      return 'pain_point';
    }

    // Wishes and desires
    if (/wish|want|need|hope|please (make|add)|would (be|love)/.test(lowerText)) {
      return 'unarticulated_need';
    }

    // Skip generic comments
    if (text.length < 30) return null;

    return 'customer_trigger';
  }

  private async fetchSemrushData(): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];
    const domain = this.brandData.website;

    if (!domain) return dataPoints;

    try {
      // Get SEMrush metrics for domain authority info
      const metrics = await SemrushAPI.getComprehensiveSEOMetrics(domain, this.brandData.name);

      // SKIP generic SEMrush keyword opportunities - they're what the brand ranks for, not what customers search
      // Instead, generate keyword opportunities based on what the TARGET CUSTOMER is searching for
      const customerKeywords = this.generateCustomerSearchKeywords();

      if (customerKeywords.length === 0) {
        console.warn(`[Streaming/semrush] ⚠️ No UVP data for customer keyword generation`);
        return dataPoints;
      }

      console.log(`[Streaming/semrush] ✅ Generated ${customerKeywords.length} customer-focused keyword opportunities`);

      // Add domain metrics as context
      if (metrics.domainOverview) {
        dataPoints.push({
          id: `semrush-domain-${Date.now()}`,
          source: 'semrush' as DataSource,
          type: 'competitive_gap' as DataPointType,
          content: `Domain Authority: ${metrics.domainOverview.domainAuthority || 'N/A'} | Organic Traffic: ${metrics.domainOverview.organicTraffic || 'N/A'}/mo`,
          metadata: {
            domainAuthority: metrics.domainOverview.domainAuthority,
            organicTraffic: metrics.domainOverview.organicTraffic
          },
          createdAt: new Date()
        });
      }

      // NOTE: Keywords are stored as metadata for content optimization, NOT as standalone insights
      // Keywords inform what topics to write about - they are NOT content insights themselves
      // The Intelligence Library should show actionable content insights, not SEO keyword suggestions

      // Store keywords as metadata context for content generation (not as visible insights)
      if (customerKeywords.length > 0) {
        dataPoints.push({
          id: `semrush-keywords-context-${Date.now()}`,
          source: 'semrush' as DataSource,
          type: 'metadata' as DataPointType,  // Not displayed as insight
          content: `Keyword research: ${customerKeywords.length} customer-focused keywords identified for content optimization`,
          metadata: {
            keywords: customerKeywords,
            forContentOptimization: true,
            notDisplayedAsInsight: true
          },
          createdAt: new Date()
        });
        console.log(`[Streaming/semrush] ✅ Stored ${customerKeywords.length} keywords as metadata for content optimization (not as insights)`);
      }

    } catch (error) {
      console.error('[Streaming/semrush] Error:', error);
    }

    return dataPoints;
  }

  /**
   * Generate keyword opportunities based on what TARGET CUSTOMERS would search for
   * Fully data-driven from UVP - works across ANY industry
   * Extracts functional drivers (what they DO) and emotional drivers (how they FEEL)
   */
  private generateCustomerSearchKeywords(): Array<{ keyword: string; intent: string; category: string; persona?: string }> {
    const keywords: Array<{ keyword: string; intent: string; category: string; persona?: string }> = [];

    if (!this.uvpData) return keywords;

    // Get industry context
    const industry = this.brandData.industry?.toLowerCase() || '';
    const industryShort = this.getIndustryKeyword(industry);

    // Parse all target customer profiles (separated by semicolons)
    const targetCustomerRaw = this.uvpData.target_customer || '';
    const keyBenefit = this.uvpData.key_benefit || '';
    const transformation = this.uvpData.transformation || '';
    const uniqueSolution = this.uvpData.unique_solution || '';

    // Split into individual personas
    const personas = targetCustomerRaw.split(';').map(p => p.trim()).filter(p => p.length > 10);

    console.log(`[Streaming/keywords] Generating keywords for ${personas.length} personas in "${industryShort}"`);

    // ========== PERSONA-LEVEL KEYWORDS ==========
    // Extract what each persona is trying to accomplish and what they'd search for
    personas.forEach((persona, idx) => {
      const personaLower = persona.toLowerCase();

      // Extract role/title from persona
      const role = this.extractRole(persona);

      // Extract the ACTION/GOAL from the persona description
      // Pattern: "[Role] seeking to [ACTION]" or "[Role] responsible for [ACTION]"
      const actionPatterns = [
        /seeking to\s+(.+?)(?:while|;|$)/i,
        /looking to\s+(.+?)(?:while|;|$)/i,
        /responsible for\s+(.+?)(?:while|;|$)/i,
        /struggling with\s+(.+?)(?:while|;|$)/i,
        /trying to\s+(.+?)(?:while|;|$)/i,
        /needing\s+(.+?)(?:while|;|$)/i,
        /handling\s+(.+?)(?:while|;|$)/i
      ];

      let primaryAction = '';
      for (const pattern of actionPatterns) {
        const match = persona.match(pattern);
        if (match) {
          primaryAction = match[1].trim();
          break;
        }
      }

      // Generate keywords from the action/goal
      if (primaryAction) {
        // Convert action to search query format
        const actionKeyword = this.actionToKeyword(primaryAction, industryShort);
        if (actionKeyword) {
          keywords.push({
            keyword: actionKeyword,
            intent: `${role} searching for solutions`,
            category: 'consideration',
            persona: role
          });
        }

        // Add "how to" variant for awareness stage
        const howToKeyword = `how to ${this.simplifyAction(primaryAction)}`;
        keywords.push({
          keyword: howToKeyword,
          intent: `${role} researching approaches`,
          category: 'awareness',
          persona: role
        });
      }

      // Extract FUNCTIONAL DRIVERS from persona text
      const functionalDrivers = this.extractFunctionalDrivers(personaLower);
      functionalDrivers.forEach(driver => {
        keywords.push({
          keyword: `${driver} ${industryShort}`.trim(),
          intent: `Functional need: ${driver}`,
          category: 'consideration',
          persona: role
        });
      });

      // Extract EMOTIONAL DRIVERS from persona text
      const emotionalDrivers = this.extractEmotionalDrivers(personaLower);
      emotionalDrivers.forEach(driver => {
        keywords.push({
          keyword: driver.keyword,
          intent: `Emotional driver: ${driver.emotion}`,
          category: 'awareness',
          persona: role
        });
      });
    });

    // ========== BENEFIT-LEVEL KEYWORDS ==========
    // What outcomes are they searching for?
    const benefits = keyBenefit.split(';').map(b => b.trim()).filter(b => b.length > 5);
    benefits.forEach(benefit => {
      const benefitKeyword = this.benefitToKeyword(benefit, industryShort);
      if (benefitKeyword) {
        keywords.push({
          keyword: benefitKeyword,
          intent: 'Searching for this outcome',
          category: 'consideration'
        });
      }
    });

    // ========== TRANSFORMATION-LEVEL KEYWORDS ==========
    // Before → After state searches
    if (transformation) {
      const parts = transformation.split('→').map(p => p.trim());
      if (parts.length >= 2) {
        const beforeState = parts[0];
        const problemKeyword = this.problemToKeyword(beforeState, industryShort);
        if (problemKeyword) {
          keywords.push({
            keyword: problemKeyword,
            intent: 'Experiencing this problem',
            category: 'awareness'
          });
        }
      }
    }

    // ========== SOLUTION-LEVEL KEYWORDS ==========
    // What makes the solution unique - competitors are searching
    if (uniqueSolution) {
      const solutionKeywords = this.solutionToKeywords(uniqueSolution, industryShort);
      solutionKeywords.forEach(kw => {
        keywords.push({
          keyword: kw,
          intent: 'Evaluating solution attributes',
          category: 'decision'
        });
      });
    }

    // ========== INDUSTRY-LEVEL KEYWORDS ==========
    // General industry searches
    keywords.push(
      { keyword: `${industryShort} software solutions`, intent: 'General industry research', category: 'awareness' },
      { keyword: `best ${industryShort} technology`, intent: 'Comparing options', category: 'consideration' },
      { keyword: `${industryShort} digital transformation`, intent: 'Modernization research', category: 'awareness' }
    );

    // Dedupe by keyword
    const seen = new Set<string>();
    const uniqueKeywords = keywords.filter(kw => {
      const key = kw.keyword.toLowerCase().trim();
      if (key.length < 5 || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`[Streaming/keywords] Generated ${uniqueKeywords.length} customer-focused keywords:`);
    uniqueKeywords.slice(0, 10).forEach(kw => {
      console.log(`  • "${kw.keyword}" (${kw.category}) - ${kw.intent}`);
    });

    return uniqueKeywords.slice(0, 25);
  }

  /**
   * Extract role/title from persona text
   */
  private extractRole(persona: string): string {
    const match = persona.match(/^([^,;]+?)(?:\s+(?:seeking|looking|responsible|struggling|trying|handling|needing|at\s+an?))/i);
    return match ? match[1].trim() : 'Target Customer';
  }

  /**
   * Get short industry keyword for search queries
   */
  private getIndustryKeyword(industry: string): string {
    const lower = industry.toLowerCase();
    // Extract meaningful industry term
    if (lower.includes('software')) return 'software';
    if (lower.includes('insurance')) return 'insurance';
    if (lower.includes('financial') || lower.includes('banking')) return 'financial services';
    if (lower.includes('healthcare') || lower.includes('medical')) return 'healthcare';
    if (lower.includes('retail')) return 'retail';
    if (lower.includes('restaurant') || lower.includes('food')) return 'restaurant';
    if (lower.includes('real estate')) return 'real estate';
    if (lower.includes('legal') || lower.includes('law')) return 'legal';
    if (lower.includes('manufacturing')) return 'manufacturing';
    if (lower.includes('construction')) return 'construction';
    if (lower.includes('education')) return 'education';
    if (lower.includes('travel') || lower.includes('hospitality')) return 'travel';
    // Return first two meaningful words
    const words = lower.split(/\s+/).filter(w => w.length > 3);
    return words.slice(0, 2).join(' ') || 'business';
  }

  /**
   * Extract industry from UVP target customer - more accurate than brand metadata
   * This ensures all API searches use the CUSTOMER'S industry, not generic brand industry
   */
  private getUVPIndustry(): string {
    if (!this.uvpData?.target_customer) {
      return this.brandData.industry || 'business';
    }

    const targetLower = this.uvpData.target_customer.toLowerCase();

    // Check for specific industries in target customer description
    if (targetLower.includes('insurance')) return 'insurance';
    if (targetLower.includes('financial') || targetLower.includes('banking')) return 'financial services';
    if (targetLower.includes('healthcare') || targetLower.includes('medical') || targetLower.includes('hospital')) return 'healthcare';
    if (targetLower.includes('retail') || targetLower.includes('ecommerce') || targetLower.includes('e-commerce')) return 'retail';
    if (targetLower.includes('restaurant') || targetLower.includes('food service')) return 'restaurant';
    if (targetLower.includes('real estate') || targetLower.includes('property')) return 'real estate';
    if (targetLower.includes('legal') || targetLower.includes('law firm') || targetLower.includes('attorney')) return 'legal';
    if (targetLower.includes('manufacturing') || targetLower.includes('factory')) return 'manufacturing';
    if (targetLower.includes('construction') || targetLower.includes('contractor')) return 'construction';
    if (targetLower.includes('education') || targetLower.includes('school') || targetLower.includes('university')) return 'education';
    if (targetLower.includes('travel') || targetLower.includes('hospitality') || targetLower.includes('hotel')) return 'travel';
    if (targetLower.includes('saas') || targetLower.includes('software')) return 'software';
    if (targetLower.includes('consulting')) return 'consulting';
    if (targetLower.includes('marketing') || targetLower.includes('agency')) return 'marketing';
    if (targetLower.includes('logistics') || targetLower.includes('shipping') || targetLower.includes('supply chain')) return 'logistics';
    if (targetLower.includes('automotive') || targetLower.includes('car dealer')) return 'automotive';

    // Fallback to brand industry
    return this.brandData.industry || 'business';
  }

  /**
   * Convert action phrase to search keyword
   */
  private actionToKeyword(action: string, industry: string): string {
    // Clean up the action phrase
    let keyword = action.toLowerCase()
      .replace(/\b(their|the|a|an|our|my|your)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Add industry context if not present
    if (!keyword.includes(industry) && industry !== 'business') {
      keyword = `${keyword} ${industry}`;
    }

    return keyword.length > 10 ? keyword : '';
  }

  /**
   * Simplify action for "how to" queries
   */
  private simplifyAction(action: string): string {
    return action.toLowerCase()
      .replace(/\b(their|the|a|an|our|my|your|while|and|or)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .slice(0, 6)
      .join(' ');
  }

  /**
   * Extract functional drivers from persona text
   */
  private extractFunctionalDrivers(text: string): string[] {
    const drivers: string[] = [];
    const patterns: Array<{ match: RegExp; driver: string }> = [
      { match: /improv\w*\s+(conversion|sales|revenue)/i, driver: 'improve conversion rates' },
      { match: /reduc\w*\s+(cost|expense|spending)/i, driver: 'reduce costs' },
      { match: /increas\w*\s+(revenue|sales|profit)/i, driver: 'increase revenue' },
      { match: /automat\w*/i, driver: 'automation solutions' },
      { match: /streamlin\w*/i, driver: 'streamline operations' },
      { match: /moderniz\w*/i, driver: 'modernization' },
      { match: /digital\s+transform/i, driver: 'digital transformation' },
      { match: /customer\s+(experience|satisfaction)/i, driver: 'improve customer experience' },
      { match: /complian\w*/i, driver: 'compliance solutions' },
      { match: /efficien\w*/i, driver: 'improve efficiency' },
      { match: /scal\w*\s+(up|growth|business)/i, driver: 'scale operations' },
      { match: /reduc\w*\s+(time|manual|workload)/i, driver: 'reduce manual work' },
      { match: /lead\s+(generation|capture|conversion)/i, driver: 'lead generation' },
      { match: /abandon\w*\s*(rate|cart|quote)?/i, driver: 'reduce abandonment' },
      { match: /retention|churn/i, driver: 'improve retention' },
      { match: /productiv\w*/i, driver: 'increase productivity' },
      { match: /support\s+(cost|ticket|volume)/i, driver: 'reduce support costs' }
    ];

    patterns.forEach(({ match, driver }) => {
      if (match.test(text) && !drivers.includes(driver)) {
        drivers.push(driver);
      }
    });

    return drivers;
  }

  /**
   * Extract emotional drivers from persona text
   */
  private extractEmotionalDrivers(text: string): Array<{ keyword: string; emotion: string }> {
    const drivers: Array<{ keyword: string; emotion: string }> = [];
    const patterns: Array<{ match: RegExp; keyword: string; emotion: string }> = [
      { match: /struggl\w*/i, keyword: 'common challenges with', emotion: 'frustration' },
      { match: /frustrat\w*/i, keyword: 'solving frustrating', emotion: 'frustration' },
      { match: /overwhelm\w*/i, keyword: 'managing overwhelming', emotion: 'stress' },
      { match: /anxiet\w*|worried|concern/i, keyword: 'reducing risk of', emotion: 'anxiety' },
      { match: /competi\w*/i, keyword: 'staying competitive in', emotion: 'fear of falling behind' },
      { match: /behind|catching up/i, keyword: 'catching up with', emotion: 'fear of falling behind' },
      { match: /losing|lost/i, keyword: 'stop losing', emotion: 'loss aversion' },
      { match: /pressure|demanding/i, keyword: 'handling pressure to', emotion: 'stress' },
      { match: /complex|complicated/i, keyword: 'simplifying', emotion: 'overwhelm' },
      { match: /uncertain|unsure/i, keyword: 'best practices for', emotion: 'uncertainty' }
    ];

    patterns.forEach(({ match, keyword, emotion }) => {
      if (match.test(text)) {
        drivers.push({ keyword, emotion });
      }
    });

    return drivers;
  }

  /**
   * Convert benefit statement to search keyword
   */
  private benefitToKeyword(benefit: string, industry: string): string {
    const lower = benefit.toLowerCase();

    // Extract the outcome/metric
    const percentMatch = lower.match(/(\d+%?)\s*(more|increase|improve|reduce|decrease)/i);
    if (percentMatch) {
      // Find what the percentage applies to
      const context = lower.replace(percentMatch[0], '').trim();
      const words = context.split(/\s+/).filter(w => w.length > 3).slice(0, 4);
      if (words.length > 0) {
        return `how to ${percentMatch[2]} ${words.join(' ')}`;
      }
    }

    // Extract action words
    const actionMatch = lower.match(/(reduce|increase|improve|grow|scale|convert|stop|recover)\s+(.+?)(?:\.|;|$)/i);
    if (actionMatch) {
      return `${actionMatch[1]} ${actionMatch[2].split(' ').slice(0, 4).join(' ')}`;
    }

    return '';
  }

  /**
   * Convert problem/before-state to search keyword
   */
  private problemToKeyword(problem: string, industry: string): string {
    const lower = problem.toLowerCase()
      .replace(/\b(help|their|the|a|an)\b/g, '')
      .trim();

    // Look for the pain point
    const painPatterns = [
      /struggling with\s+(.+)/i,
      /frustrated by\s+(.+)/i,
      /dealing with\s+(.+)/i,
      /facing\s+(.+)/i
    ];

    for (const pattern of painPatterns) {
      const match = lower.match(pattern);
      if (match) {
        return `solving ${match[1].split(' ').slice(0, 5).join(' ')}`;
      }
    }

    // Default: extract key nouns
    const words = lower.split(/\s+/).filter(w => w.length > 4).slice(0, 5);
    return words.length > 2 ? `${words.join(' ')} solutions` : '';
  }

  /**
   * Convert unique solution to search keywords
   */
  private solutionToKeywords(solution: string, industry: string): string[] {
    const keywords: string[] = [];
    const lower = solution.toLowerCase();

    // Extract differentiators
    const diffPatterns = [
      { match: /compliance/i, keyword: `${industry} compliance software` },
      { match: /regulated/i, keyword: `solutions for regulated ${industry}` },
      { match: /enterprise/i, keyword: `enterprise ${industry} platform` },
      { match: /ai|artificial intelligence/i, keyword: `ai for ${industry}` },
      { match: /automat\w*/i, keyword: `${industry} automation tools` },
      { match: /security|secure/i, keyword: `secure ${industry} solutions` },
      { match: /scalab\w*/i, keyword: `scalable ${industry} software` },
      { match: /integrat\w*/i, keyword: `${industry} integration platform` },
      { match: /real.?time/i, keyword: `real-time ${industry} analytics` },
      { match: /custom\w*/i, keyword: `customizable ${industry} solution` }
    ];

    diffPatterns.forEach(({ match, keyword }) => {
      if (match.test(lower)) {
        keywords.push(keyword);
      }
    });

    return keywords;
  }

  /**
   * Build list of keywords relevant to UVP for filtering SEMrush results
   * Extracts meaningful domain-specific terms, not generic words
   */
  private buildUVPRelevanceKeywords(): string[] {
    const keywords: string[] = [];

    if (!this.uvpData) return keywords;

    // Common stop words to filter out
    const stopWords = new Set([
      'the', 'and', 'for', 'with', 'from', 'that', 'this', 'have', 'they', 'their',
      'about', 'into', 'what', 'when', 'where', 'which', 'while', 'more', 'most',
      'some', 'such', 'than', 'them', 'then', 'these', 'those', 'through', 'very',
      'will', 'would', 'could', 'should', 'being', 'been', 'were', 'does', 'doing',
      'during', 'each', 'having', 'here', 'just', 'like', 'make', 'made', 'many',
      'much', 'need', 'needs', 'only', 'other', 'over', 'same', 'want', 'wants',
      'your', 'help', 'achieve', 'goals', 'looking', 'seeking', 'trying', 'responsible',
      'director', 'manager', 'executive', 'officer', 'head', 'chief', 'vice', 'president'
    ]);

    // High-value domain terms to prioritize (industry-specific keywords)
    const domainTerms: string[] = [];

    // Extract from unique_solution (most specific to the business)
    if (this.uvpData.unique_solution) {
      const solutionTerms = this.extractMeaningfulTerms(this.uvpData.unique_solution, stopWords);
      domainTerms.push(...solutionTerms);
    }

    // Extract from key_benefit (what they deliver)
    if (this.uvpData.key_benefit) {
      const benefitTerms = this.extractMeaningfulTerms(this.uvpData.key_benefit, stopWords);
      domainTerms.push(...benefitTerms);
    }

    // Extract from transformation (before → after state)
    if (this.uvpData.transformation) {
      // Get terms from "before" state (pain points)
      const beforeState = this.uvpData.transformation.split('→')[0]?.trim() || this.uvpData.transformation;
      const transformTerms = this.extractMeaningfulTerms(beforeState, stopWords);
      domainTerms.push(...transformTerms);
    }

    // Extract industry-specific terms from target_customer
    if (this.uvpData.target_customer) {
      // Look for industry/vertical mentions
      const industryPatterns = [
        /insurance/gi, /financial/gi, /healthcare/gi, /compliance/gi, /regulated/gi,
        /banking/gi, /pharma/gi, /legal/gi, /enterprise/gi, /saas/gi, /b2b/gi,
        /retail/gi, /manufacturing/gi, /logistics/gi, /hospitality/gi, /restaurant/gi,
        /real estate/gi, /construction/gi, /automotive/gi, /education/gi, /government/gi
      ];

      industryPatterns.forEach(pattern => {
        const matches = this.uvpData.target_customer.match(pattern);
        if (matches) {
          domainTerms.push(...matches.map((m: string) => m.toLowerCase()));
        }
      });
    }

    // Add brand name variations
    if (this.brandData.name) {
      const brandName = this.brandData.name.toLowerCase();
      domainTerms.push(brandName);
      // Also add without common suffixes
      domainTerms.push(brandName.replace(/\s*(ai|inc|llc|ltd|corp|co)\s*$/i, '').trim());
    }

    // Add industry as a keyword
    if (this.brandData.industry) {
      domainTerms.push(this.brandData.industry.toLowerCase());
      // Also add individual words from industry
      this.brandData.industry.toLowerCase().split(/\s+/).forEach(w => {
        if (w.length > 3 && !stopWords.has(w)) domainTerms.push(w);
      });
    }

    // Dedupe and clean
    const uniqueKeywords = [...new Set(domainTerms)]
      .filter(k => k.length > 2)
      .slice(0, 25); // Limit to top 25 terms

    console.log(`[Streaming/semrush] UVP relevance keywords (${uniqueKeywords.length}):`, uniqueKeywords);

    return uniqueKeywords;
  }

  /**
   * Extract meaningful domain terms from text, filtering out common words
   */
  private extractMeaningfulTerms(text: string, stopWords: Set<string>): string[] {
    const terms: string[] = [];

    // First, look for multi-word phrases (2-3 words) that are meaningful
    const phrases = text.match(/\b[a-z]+(?:\s+[a-z]+){1,2}\b/gi) || [];
    phrases.forEach(phrase => {
      const words = phrase.toLowerCase().split(/\s+/);
      // Only include phrases where most words are not stop words
      const meaningfulWords = words.filter(w => !stopWords.has(w) && w.length > 3);
      if (meaningfulWords.length >= words.length * 0.5) {
        terms.push(phrase.toLowerCase());
      }
    });

    // Then extract single meaningful words
    const words = text.toLowerCase().split(/[\s,;:.\-\/]+/);
    words.forEach(word => {
      // Clean the word
      const cleanWord = word.replace(/[^a-z0-9]/g, '');
      // Include if: not a stop word, length > 4, contains domain-relevant patterns
      if (cleanWord.length > 4 && !stopWords.has(cleanWord)) {
        // Prioritize words that look like domain terms
        if (/tion$|ment$|ance$|ence$|ity$|ive$|ing$|ical$/.test(cleanWord) ||
            /ai|ml|crm|erp|api|roi|coo|cfo|cto|cio|vp|saas|b2b|b2c/.test(cleanWord)) {
          terms.push(cleanWord);
        } else if (cleanWord.length > 5) {
          terms.push(cleanWord);
        }
      }
    });

    return terms;
  }

  private async fetchNewsData(): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];

    try {
      // Build UVP-targeted news search instead of generic industry search
      const newsSearchTerms = this.buildNewsSearchTerms();

      console.log(`[Streaming/news] Searching for UVP-relevant news: "${newsSearchTerms}"`);

      const articles = await SerperAPI.getNews(newsSearchTerms, undefined);

      // Filter articles to ensure relevance to target customer topics
      const relevantArticles = this.filterRelevantNews(articles);

      console.log(`[Streaming/news] Filtered ${relevantArticles.length}/${articles.length} relevant articles`);

      relevantArticles.slice(0, 40).forEach((article: any, idx: number) => {
        dataPoints.push({
          id: `news-${Date.now()}-${idx}`,
          source: 'news' as DataSource,
          type: 'trending_topic' as DataPointType,
          content: `${article.title}: ${article.snippet}`,
          metadata: { url: article.link, source: article.source, uvpRelevant: true },
          createdAt: new Date()
        });
      });

      // ITEM #18: Industry News Hooks for B2B
      const uvpIndustry = this.getUVPIndustry();
      const targetCustomer = this.uvpData?.target_customer || '';
      const industryNewsHooks = this.generateIndustryNewsHooks(relevantArticles, uvpIndustry, targetCustomer);

      industryNewsHooks.forEach((hook, idx) => {
        dataPoints.push({
          id: `news-hook-${Date.now()}-${idx}`,
          source: 'news' as DataSource,
          type: 'news_story' as DataPointType,
          content: hook.contentIdea,
          metadata: {
            newsTitle: hook.newsTitle,
            hookType: hook.hookType,
            relevanceScore: hook.relevanceScore,
            platform: 'industry_news_hook'
          },
          createdAt: new Date()
        });
      });

      // ITEM #19: Economic Indicator Triggers for B2B
      const economicTriggers = this.generateEconomicIndicatorTriggers(relevantArticles, uvpIndustry);

      economicTriggers.forEach((trigger, idx) => {
        dataPoints.push({
          id: `economic-${Date.now()}-${idx}`,
          source: 'news' as DataSource,
          type: 'market_trend' as DataPointType,
          content: trigger.contentIdea,
          metadata: {
            indicatorType: trigger.indicatorType,
            sentiment: trigger.sentiment,
            urgency: trigger.urgency,
            platform: 'economic_indicator'
          },
          createdAt: new Date()
        });
      });

      console.log(`[Streaming/news] Generated ${relevantArticles.length} articles, ${industryNewsHooks.length} industry hooks, ${economicTriggers.length} economic triggers`);

    } catch (error) {
      console.error('[Streaming/news] Error:', error);
    }

    return dataPoints;
  }

  /**
   * ITEM #18: Generate industry news hooks for B2B thought leadership
   */
  private generateIndustryNewsHooks(
    articles: any[],
    industry: string,
    targetCustomer: string
  ): Array<{ newsTitle: string; contentIdea: string; hookType: string; relevanceScore: number }> {
    const hooks: Array<{ newsTitle: string; contentIdea: string; hookType: string; relevanceScore: number }> = [];

    // News hook templates by category
    const hookTemplates = [
      { pattern: /new law|regulation|policy/i, hookType: 'regulatory', template: (title: string) => `What the latest ${industry} regulations mean for your business: ${title}` },
      { pattern: /study|research|report/i, hookType: 'research', template: (title: string) => `Key takeaways from new ${industry} research: ${title}` },
      { pattern: /trend|growth|rise/i, hookType: 'trend', template: (title: string) => `${industry} trends you need to know: ${title}` },
      { pattern: /challenge|problem|issue/i, hookType: 'challenge', template: (title: string) => `Industry challenge spotlight: How to address ${title}` },
      { pattern: /technology|AI|digital/i, hookType: 'technology', template: (title: string) => `Tech disruption in ${industry}: ${title}` },
      { pattern: /acquisit|merger|partnership/i, hookType: 'market_move', template: (title: string) => `Market shakeup: What ${title} means for your strategy` }
    ];

    articles.forEach(article => {
      const title = article.title || '';
      const snippet = article.snippet || '';
      const fullText = `${title} ${snippet}`;

      hookTemplates.forEach(({ pattern, hookType, template }) => {
        if (pattern.test(fullText)) {
          hooks.push({
            newsTitle: title,
            contentIdea: template(title.substring(0, 50)),
            hookType: hookType,
            relevanceScore: 0.8
          });
        }
      });
    });

    // Add generic thought leadership hooks
    if (articles.length > 0 && hooks.length < 3) {
      hooks.push({
        newsTitle: articles[0]?.title || 'Industry news',
        contentIdea: `Weekly ${industry} news roundup: What executives need to know`,
        hookType: 'roundup',
        relevanceScore: 0.7
      });
    }

    return hooks.slice(0, 5);
  }

  /**
   * ITEM #19: Generate economic indicator triggers for B2B content
   */
  private generateEconomicIndicatorTriggers(
    articles: any[],
    industry: string
  ): Array<{ indicatorType: string; contentIdea: string; sentiment: string; urgency: string }> {
    const triggers: Array<{ indicatorType: string; contentIdea: string; sentiment: string; urgency: string }> = [];

    // Economic indicator patterns
    const economicPatterns = [
      { pattern: /interest rate|fed|federal reserve/i, indicatorType: 'interest_rates', template: `How changing interest rates impact ${industry}: What to prepare for` },
      { pattern: /inflation|cpi|consumer price/i, indicatorType: 'inflation', template: `Inflation strategies for ${industry}: Protecting margins and value` },
      { pattern: /employment|job|hiring|layoff/i, indicatorType: 'employment', template: `${industry} employment trends: Talent strategy insights` },
      { pattern: /gdp|economic growth|recession/i, indicatorType: 'gdp', template: `Economic outlook for ${industry}: Planning for what's ahead` },
      { pattern: /supply chain|shipping|logistics/i, indicatorType: 'supply_chain', template: `Supply chain updates for ${industry}: Risk mitigation strategies` },
      { pattern: /budget|spending|investment/i, indicatorType: 'spending', template: `${industry} budget trends: Where smart money is going` }
    ];

    articles.forEach(article => {
      const fullText = `${article.title} ${article.snippet}`.toLowerCase();

      economicPatterns.forEach(({ pattern, indicatorType, template }) => {
        if (pattern.test(fullText)) {
          // Determine sentiment
          const sentiment = /decline|drop|fall|recession|layoff|cut/i.test(fullText) ? 'negative' :
                           /growth|rise|increase|surge|hire/i.test(fullText) ? 'positive' : 'neutral';

          triggers.push({
            indicatorType: indicatorType,
            contentIdea: template,
            sentiment: sentiment,
            urgency: sentiment === 'negative' ? 'high' : 'medium'
          });
        }
      });
    });

    // Add general economic content if few specific triggers found
    if (triggers.length < 2) {
      triggers.push({
        indicatorType: 'general',
        contentIdea: `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${industry} economic outlook: Key indicators to watch`,
        sentiment: 'neutral',
        urgency: 'low'
      });
    }

    return triggers.slice(0, 4);
  }

  /**
   * Build news search terms from UVP data - what would target customers read about?
   */
  private buildNewsSearchTerms(): string {
    if (!this.uvpData) {
      return this.brandData.industry || 'business technology';
    }

    const targetCustomer = this.uvpData.target_customer || '';
    const uniqueSolution = this.uvpData.unique_solution || '';
    const keyBenefit = this.uvpData.key_benefit || '';

    // Extract key industry/topic from target customer
    const industryTerms: string[] = [];

    // Look for specific industries mentioned in target customer
    const industryPatterns = [
      { pattern: /insurance/i, term: 'insurance' },
      { pattern: /financial|banking/i, term: 'financial services' },
      { pattern: /healthcare|medical/i, term: 'healthcare' },
      { pattern: /retail/i, term: 'retail' },
      { pattern: /manufacturing/i, term: 'manufacturing' },
      { pattern: /legal|law\s/i, term: 'legal' },
      { pattern: /real estate/i, term: 'real estate' },
      { pattern: /education/i, term: 'education' },
      { pattern: /travel|hospitality/i, term: 'travel' }
    ];

    industryPatterns.forEach(({ pattern, term }) => {
      if (pattern.test(targetCustomer)) {
        industryTerms.push(term);
      }
    });

    // Extract topics from unique solution
    const topicTerms: string[] = [];
    if (/compliance|regulated/i.test(uniqueSolution)) topicTerms.push('compliance');
    if (/digital\s+transform/i.test(targetCustomer)) topicTerms.push('digital transformation');
    if (/automation/i.test(uniqueSolution) || /automation/i.test(keyBenefit)) topicTerms.push('automation');
    if (/customer\s+(experience|satisfaction)/i.test(targetCustomer)) topicTerms.push('customer experience');
    if (/ai|artificial intelligence/i.test(uniqueSolution)) topicTerms.push('AI');
    if (/conversion|sales/i.test(keyBenefit)) topicTerms.push('sales technology');

    // Build search query
    const primaryIndustry = industryTerms[0] || '';
    const primaryTopic = topicTerms[0] || 'technology';

    // Combine for targeted search
    if (primaryIndustry && topicTerms.length > 0) {
      return `${primaryIndustry} ${topicTerms.slice(0, 2).join(' ')}`;
    } else if (primaryIndustry) {
      return `${primaryIndustry} technology trends`;
    } else if (topicTerms.length > 0) {
      return topicTerms.slice(0, 3).join(' ');
    }

    return this.brandData.industry || 'business technology';
  }

  /**
   * Filter news articles to only include UVP-relevant content
   */
  private filterRelevantNews(articles: any[]): any[] {
    if (!this.uvpData || !articles.length) return articles;

    // Build relevance terms from UVP
    const relevanceTerms: string[] = [];

    // Extract from target customer
    const targetLower = (this.uvpData.target_customer || '').toLowerCase();
    if (targetLower.includes('insurance')) relevanceTerms.push('insurance', 'policy', 'claims', 'underwriting');
    if (targetLower.includes('financial')) relevanceTerms.push('financial', 'banking', 'fintech');
    if (targetLower.includes('compliance')) relevanceTerms.push('compliance', 'regulatory', 'regulation');
    if (targetLower.includes('customer')) relevanceTerms.push('customer', 'experience', 'satisfaction');
    if (targetLower.includes('digital')) relevanceTerms.push('digital', 'transformation', 'modernization');
    if (targetLower.includes('automation')) relevanceTerms.push('automation', 'automate', 'efficiency');
    if (targetLower.includes('sales')) relevanceTerms.push('sales', 'conversion', 'revenue');

    // Extract from unique solution
    const solutionLower = (this.uvpData.unique_solution || '').toLowerCase();
    if (solutionLower.includes('regulated')) relevanceTerms.push('regulated', 'compliance');
    if (solutionLower.includes('ai')) relevanceTerms.push('ai', 'artificial intelligence', 'machine learning');

    // If no specific terms, return all
    if (relevanceTerms.length === 0) return articles;

    // Filter articles
    return articles.filter(article => {
      const text = `${article.title} ${article.snippet}`.toLowerCase();
      // Must match at least one relevance term
      return relevanceTerms.some(term => text.includes(term));
    });
  }

  private async fetchWeatherData(): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];

    // Only fetch weather for local businesses with location
    const location = this.brandData.city ||
      (this.brandData.location?.city);

    if (!location) return dataPoints;

    try {
      const opportunities = await WeatherAPI.detectWeatherOpportunities(
        location,
        this.brandData.industry
      );

      opportunities.slice(0, 3).forEach((opp: any, idx: number) => {
        dataPoints.push({
          id: `weather-${Date.now()}-${idx}`,
          source: 'weather' as DataSource,
          type: 'timing' as DataPointType,
          content: `${opp.title}: ${opp.description}`,
          metadata: {
            urgency: opp.urgency,
            impactScore: opp.impact_score
          },
          createdAt: new Date()
        });
      });

      // ITEM #15: Weather-to-Content Hooks for SMB Local
      const uvpIndustry = this.getUVPIndustry();
      const targetCustomer = this.uvpData?.target_customer || '';
      const weatherContentHooks = this.generateWeatherContentHooks(
        opportunities,
        uvpIndustry,
        this.extractCustomerSearchTerm(targetCustomer)
      );

      weatherContentHooks.forEach((hook, idx) => {
        dataPoints.push({
          id: `weather-hook-${Date.now()}-${idx}`,
          source: 'weather' as DataSource,
          type: 'customer_trigger' as DataPointType,
          content: hook.contentIdea,
          metadata: {
            weatherCondition: hook.condition,
            hookType: hook.hookType,
            urgencyLevel: hook.urgency,
            platform: 'weather_content'
          },
          createdAt: new Date()
        });
      });

      // ITEM #16: Seasonal Pattern Engine for SMB
      const seasonalPatterns = this.generateSeasonalPatterns(uvpIndustry, location);
      seasonalPatterns.forEach((pattern, idx) => {
        dataPoints.push({
          id: `seasonal-${Date.now()}-${idx}`,
          source: 'weather' as DataSource,
          type: 'timing' as DataPointType,
          content: pattern.contentIdea,
          metadata: {
            season: pattern.season,
            eventType: pattern.eventType,
            relevanceWindow: pattern.relevanceWindow,
            platform: 'seasonal_content'
          },
          createdAt: new Date()
        });
      });

      // ITEM #17: Local Event Triggers for SMB
      const localEventTriggers = await this.generateLocalEventTriggers(location, uvpIndustry);
      localEventTriggers.forEach((trigger, idx) => {
        dataPoints.push({
          id: `local-event-${Date.now()}-${idx}`,
          source: 'weather' as DataSource,
          type: 'local_event' as DataPointType,
          content: trigger.contentIdea,
          metadata: {
            eventName: trigger.eventName,
            eventType: trigger.eventType,
            timing: trigger.timing,
            platform: 'local_event_content'
          },
          createdAt: new Date()
        });
      });

      console.log(`[Streaming/weather] Generated ${opportunities.length} weather opps, ${weatherContentHooks.length} content hooks, ${seasonalPatterns.length} seasonal, ${localEventTriggers.length} local events`);

    } catch (error) {
      console.error('[Streaming/weather] Error:', error);
    }

    return dataPoints;
  }

  /**
   * ITEM #15: Generate weather-to-content hooks based on weather conditions and UVP
   */
  private generateWeatherContentHooks(
    opportunities: any[],
    industry: string,
    customerTerm: string
  ): Array<{ condition: string; contentIdea: string; hookType: string; urgency: string }> {
    const hooks: Array<{ condition: string; contentIdea: string; hookType: string; urgency: string }> = [];

    // Weather condition content templates
    const weatherTemplates: Record<string, Array<{ hookType: string; template: string }>> = {
      'hot': [
        { hookType: 'prevention', template: `Beat the heat: How ${customerTerm}s can prepare for high temperatures` },
        { hookType: 'urgency', template: `Summer surge: Why ${industry} demand spikes in hot weather` },
        { hookType: 'seasonal', template: `Hot weather essentials every ${customerTerm} needs to know` }
      ],
      'cold': [
        { hookType: 'prevention', template: `Freeze warning: ${industry} prep guide for ${customerTerm}s` },
        { hookType: 'urgency', template: `Don't wait until it's too late: Winter ${industry} checklist` },
        { hookType: 'seasonal', template: `Cold weather protection tips from ${industry} experts` }
      ],
      'rain': [
        { hookType: 'timely', template: `Rainy day problems ${customerTerm}s face (and how to solve them)` },
        { hookType: 'preparation', template: `Is your ${industry} ready for the rain? Quick checklist` }
      ],
      'storm': [
        { hookType: 'emergency', template: `Storm preparedness: What ${customerTerm}s need to do NOW` },
        { hookType: 'recovery', template: `After the storm: ${industry} recovery guide` }
      ]
    };

    opportunities.forEach(opp => {
      // Detect weather condition type
      const condition = this.detectWeatherCondition(opp.title + ' ' + opp.description);
      const templates = weatherTemplates[condition] || weatherTemplates['hot'];

      templates.forEach(({ hookType, template }) => {
        hooks.push({
          condition: condition,
          contentIdea: template,
          hookType: hookType,
          urgency: opp.urgency || 'medium'
        });
      });
    });

    return hooks.slice(0, 5); // Return top 5 hooks
  }

  /**
   * ITEM #16: Generate seasonal content patterns based on industry
   */
  private generateSeasonalPatterns(
    industry: string,
    location: string
  ): Array<{ season: string; eventType: string; contentIdea: string; relevanceWindow: string }> {
    const patterns: Array<{ season: string; eventType: string; contentIdea: string; relevanceWindow: string }> = [];

    // Get current month and determine season
    const month = new Date().getMonth();
    const currentSeason = month < 3 ? 'winter' : month < 6 ? 'spring' : month < 9 ? 'summer' : 'fall';

    // Seasonal content templates by industry type
    const seasonalTemplates: Record<string, Record<string, Array<{ eventType: string; template: string }>>> = {
      'general': {
        'spring': [
          { eventType: 'renewal', template: 'Spring cleaning tips for your business' },
          { eventType: 'tax_season', template: 'Tax season preparation guide' },
          { eventType: 'planning', template: 'Q2 planning: Set your business up for success' }
        ],
        'summer': [
          { eventType: 'vacation', template: 'Summer slowdown? How to keep business thriving' },
          { eventType: 'back_to_school', template: 'Back-to-school prep starts now' }
        ],
        'fall': [
          { eventType: 'q4_prep', template: 'Q4 is coming: Holiday season prep guide' },
          { eventType: 'budget', template: 'Year-end budget planning checklist' }
        ],
        'winter': [
          { eventType: 'holiday', template: 'Holiday season tips for busy businesses' },
          { eventType: 'year_end', template: 'Year-end review: What worked, what didn\'t' },
          { eventType: 'new_year', template: 'New year, new strategies: Planning for success' }
        ]
      }
    };

    const industryTemplates = seasonalTemplates['general'];
    const currentTemplates = industryTemplates[currentSeason] || [];

    currentTemplates.forEach(({ eventType, template }) => {
      patterns.push({
        season: currentSeason,
        eventType: eventType,
        contentIdea: template,
        relevanceWindow: `${currentSeason} 2025`
      });
    });

    // Also add upcoming season preview
    const nextSeason = currentSeason === 'winter' ? 'spring' :
                       currentSeason === 'spring' ? 'summer' :
                       currentSeason === 'summer' ? 'fall' : 'winter';
    const nextTemplates = industryTemplates[nextSeason] || [];

    if (nextTemplates.length > 0) {
      patterns.push({
        season: nextSeason,
        eventType: 'preview',
        contentIdea: `Get ready for ${nextSeason}: ${industry} prep guide`,
        relevanceWindow: `Late ${currentSeason} - Early ${nextSeason}`
      });
    }

    return patterns;
  }

  /**
   * ITEM #17: Generate local event triggers for SMB
   */
  private async generateLocalEventTriggers(
    location: string,
    industry: string
  ): Promise<Array<{ eventName: string; eventType: string; contentIdea: string; timing: string }>> {
    const triggers: Array<{ eventName: string; eventType: string; contentIdea: string; timing: string }> = [];

    // Common local event types that businesses can leverage
    const localEventTypes = [
      { eventType: 'sports', template: `Game day specials: Support your local ${location} team` },
      { eventType: 'festival', template: `Festival season in ${location}: How to prepare your business` },
      { eventType: 'market', template: `Farmers market season: Local business opportunities` },
      { eventType: 'school', template: `School events: Connect with ${location} families` },
      { eventType: 'community', template: `Community events: Why local businesses should participate` }
    ];

    // Generate triggers based on location
    localEventTypes.forEach(({ eventType, template }) => {
      triggers.push({
        eventName: `${location} ${eventType}`,
        eventType: eventType,
        contentIdea: template,
        timing: 'upcoming'
      });
    });

    return triggers.slice(0, 3); // Return top 3 local event triggers
  }

  /**
   * Helper: Detect weather condition from text
   */
  private detectWeatherCondition(text: string): string {
    const lowerText = text.toLowerCase();
    if (/hot|heat|warm|summer|heatwave/i.test(lowerText)) return 'hot';
    if (/cold|freeze|winter|snow|frost/i.test(lowerText)) return 'cold';
    if (/rain|wet|shower|flood/i.test(lowerText)) return 'rain';
    if (/storm|hurricane|tornado|severe/i.test(lowerText)) return 'storm';
    return 'hot'; // Default to hot
  }

  private async fetchLinkedInData(): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];

    // Use UVP target customer for B2B-focused LinkedIn searches
    const targetCustomer = this.uvpData?.target_customer || '';
    const customerProblem = this.uvpData?.transformation?.split('→')[0]?.trim() || '';
    const customerTerm = targetCustomer
      ? this.extractCustomerSearchTerm(targetCustomer)
      : this.brandData.industry;

    // Log whether we're using UVP-targeted or generic fallback
    if (targetCustomer) {
      console.log('[Streaming/linkedin] ✅ Using UVP-TARGETED B2B search:', customerTerm);
    } else {
      console.warn('[Streaming/linkedin] ⚠️ FALLBACK to generic industry search:', this.brandData.industry);
    }

    console.log('[Streaming/linkedin] B2B search context:', {
      targetCustomer: targetCustomer.substring(0, 80),
      customerTerm,
      customerProblem: customerProblem.substring(0, 50)
    });

    try {
      // ITEM #14: Enhanced LinkedIn Decision-Maker Mining
      const uvpIndustry = this.getUVPIndustry();
      const decisionMakerRoles = this.extractDecisionMakerRoles(targetCustomer);

      // Build comprehensive search queries for decision-maker mining
      const searchQueries = [
        // Decision-maker pain points
        `site:linkedin.com ${decisionMakerRoles[0] || customerTerm} challenges pain points`,
        `site:linkedin.com ${decisionMakerRoles[0] || customerTerm} struggling with`,
        // Industry trends from executives
        `site:linkedin.com ${uvpIndustry} digital transformation trends`,
        // Hiring signals (indicates growth areas)
        `site:linkedin.com "${uvpIndustry}" hiring "${decisionMakerRoles[0] || 'manager'}"`,
        // Executive discussions
        `site:linkedin.com ${customerTerm} best practices tips`,
      ];

      console.log(`[Streaming/linkedin] Mining decision-makers: ${decisionMakerRoles.join(', ')}`);

      // Run searches in parallel
      const searchResults = await Promise.allSettled(
        searchQueries.map(q => SerperAPI.searchGoogle(q))
      );

      // Collect all results with category tracking
      const categoryMap = ['pain_point', 'pain_point', 'trending_topic', 'behavior_pattern', 'trending_topic'];
      const allResults: Array<{ result: any; category: string }> = [];

      searchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          result.value.forEach((r: any) => {
            allResults.push({ result: r, category: categoryMap[idx] || 'trending_topic' });
          });
        }
      });

      // Deduplicate by URL
      const seenUrls = new Set<string>();
      const uniqueResults = allResults.filter(({ result }) => {
        if (seenUrls.has(result.link)) return false;
        seenUrls.add(result.link);
        return true;
      });

      // Track hiring signals
      let hiringSignalCount = 0;
      let painPointCount = 0;
      let trendCount = 0;

      uniqueResults.slice(0, 25).forEach(({ result, category }, idx) => {
        // Determine if this is a hiring signal
        const isHiringSignal = /hiring|job|career|position|looking for|seeking|we're hiring/i.test(result.title + result.snippet);
        const isPainPoint = /challenge|struggle|problem|issue|difficulty|frustrat/i.test(result.title + result.snippet);
        const isTrend = /trend|future|2024|2025|digital|transform|innovat/i.test(result.title + result.snippet);

        let dataPointType: DataPointType;
        if (isHiringSignal) {
          dataPointType = 'behavior_pattern';
          hiringSignalCount++;
        } else if (isPainPoint) {
          dataPointType = 'pain_point';
          painPointCount++;
        } else if (isTrend) {
          dataPointType = 'trending_topic';
          trendCount++;
        } else {
          dataPointType = category as DataPointType;
        }

        dataPoints.push({
          id: `linkedin-${Date.now()}-${idx}`,
          source: 'linkedin' as DataSource,
          type: dataPointType,
          content: `${result.title}${result.snippet ? ': ' + result.snippet.substring(0, 150) : ''}`,
          metadata: {
            url: result.link,
            isDecisionMaker: decisionMakerRoles.some(role => result.title.toLowerCase().includes(role.toLowerCase())),
            isHiringSignal: isHiringSignal,
            signalCategory: isHiringSignal ? 'hiring' : isPainPoint ? 'pain_point' : 'industry_discussion'
          },
          createdAt: new Date()
        });
      });

      console.log(`[Streaming/linkedin] Found ${dataPoints.length} executive posts: ${painPointCount} pain points, ${hiringSignalCount} hiring signals, ${trendCount} trends`);

    } catch (error) {
      console.error('[Streaming/linkedin] Error:', error);
    }

    return dataPoints;
  }

  /**
   * ITEM #14: Extract decision-maker roles from UVP target customer
   */
  private extractDecisionMakerRoles(targetCustomer: string): string[] {
    const roles: string[] = [];

    // Common decision-maker titles
    const rolePatterns = [
      { pattern: /CEO|chief executive/i, role: 'CEO' },
      { pattern: /CTO|chief technology/i, role: 'CTO' },
      { pattern: /CFO|chief financial/i, role: 'CFO' },
      { pattern: /CMO|chief marketing/i, role: 'CMO' },
      { pattern: /COO|chief operating/i, role: 'COO' },
      { pattern: /VP|vice president/i, role: 'VP' },
      { pattern: /director/i, role: 'Director' },
      { pattern: /manager/i, role: 'Manager' },
      { pattern: /head of/i, role: 'Head' },
      { pattern: /founder|owner/i, role: 'Founder' }
    ];

    // Extract from target customer
    rolePatterns.forEach(({ pattern, role }) => {
      if (pattern.test(targetCustomer)) {
        roles.push(role);
      }
    });

    // If no specific roles found, infer based on industry type
    if (roles.length === 0) {
      // Default B2B decision-maker roles
      if (/insurance|financial|banking/i.test(targetCustomer)) {
        roles.push('VP Operations', 'Chief Risk Officer', 'Compliance Director');
      } else if (/tech|software|saas/i.test(targetCustomer)) {
        roles.push('CTO', 'VP Engineering', 'Product Director');
      } else if (/marketing|brand/i.test(targetCustomer)) {
        roles.push('CMO', 'Marketing Director', 'Brand Manager');
      } else {
        // Generic B2B roles
        roles.push('Director', 'VP', 'Manager');
      }
    }

    return roles;
  }

  private async fetchPerplexityData(): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];

    try {
      const isAvailable = await perplexityAPI.isAvailable();
      if (!isAvailable) return dataPoints;

      // CRITICAL: Use TARGET CUSTOMER context with SPECIFIC questions
      const targetCustomer = this.uvpData?.target_customer || '';
      const transformation = this.uvpData?.transformation || '';
      const customerProblem = transformation.split('→')[0]?.trim() || '';
      const desiredOutcome = transformation.split('→')[1]?.trim() || '';
      const customerTerm = targetCustomer
        ? this.extractCustomerSearchTerm(targetCustomer)
        : this.brandData.industry;

      // Log whether we're using UVP-targeted or generic fallback
      if (targetCustomer) {
        console.log('[Streaming/perplexity] ✅ Using UVP-TARGETED queries for:', customerTerm);
      } else {
        console.warn('[Streaming/perplexity] ⚠️ FALLBACK to generic industry queries:', this.brandData.industry);
      }

      console.log('[Streaming/perplexity] Running SPECIFIC pain point queries for:', customerTerm);

      // Multiple SPECIFIC targeted questions focused on PSYCHOLOGICAL TRIGGERS
      // These prompts are designed to elicit customer fears, frustrations, and desires - NOT recommendations
      const specificQueries = [
        // Fears and anxieties (emotional triggers)
        `What are ${customerTerm}'s biggest FEARS and ANXIETIES about ${customerProblem || 'their current situation'}?
         Find real quotes from Reddit, forums, and reviews where people express worry, concern, or fear.
         Format each as: "Fear of [specific concern]" - keep the customer's emotional language.
         Examples: "Fear of vendor lock-in with proprietary platforms", "Anxiety about compliance violations"`,

        // Frustrations and pain points
        `What FRUSTRATES ${customerTerm} the most about current solutions for ${customerProblem || 'their challenges'}?
         Find real complaints from reviews (G2, Trustpilot, Reddit) where people express genuine frustration.
         Keep the customer's emotional words like "hate", "annoyed", "can't stand", "waste of time".
         Format as direct customer frustrations, not recommendations.`,

        // Desires and aspirations
        `What do ${customerTerm} desperately WANT but can't find in current solutions?
         Find unmet needs expressed in forums, reviews, and community discussions.
         Look for phrases like "I wish", "If only", "Why can't", "Looking for".
         Keep customer's voice - these should sound like customer quotes, not marketing copy.`,

        // Objections and hesitations
        `Why do ${customerTerm} HESITATE before buying solutions for ${customerProblem || 'their needs'}?
         Find real objections from decision-maker discussions, Reddit, and review comments.
         Look for trust concerns, price sensitivity, past bad experiences, implementation fears.
         Format as: "Concern about [specific objection]" or "Hesitation due to [reason]"`,

        // Buying triggers - what pushes them over the edge
        `What EVENTS or SITUATIONS finally push ${customerTerm} to buy a solution?
         Look for urgency triggers: regulatory deadlines, competitor pressure, customer complaints, failed audits.
         Find real examples from case studies, Reddit threads, and industry discussions.
         Format as: "When [trigger event happens]" - keep it specific to the industry.`,
      ];

      // Run queries in parallel
      const queryPromises = specificQueries.map(async (specificQuery, qIdx) => {
        try {
          const response = await perplexityAPI.getIndustryInsights({
            query: specificQuery,
            context: {
              industry: this.brandData.industry,
              brand_name: this.brandData.name,
              target_customer: targetCustomer,
              customer_problem: customerProblem,
              desired_outcome: desiredOutcome
            },
            max_results: 8
          });

          const queryType = ['emotional_fear', 'frustration', 'desire', 'objection', 'buying_trigger'][qIdx];

          return response.insights.map((insight: string, idx: number) => ({
            id: `perplexity-${queryType}-${Date.now()}-${idx}`,
            source: 'perplexity' as DataSource,
            type: this.categorizePerplexityInsight(insight, queryType) as DataPointType,
            content: insight,
            metadata: {
              confidence: response.confidence,
              queryType,
              targetCustomer: customerTerm,
              rawQuery: specificQuery.substring(0, 100)
            },
            createdAt: new Date()
          }));
        } catch (err) {
          console.warn(`[Streaming/perplexity] Query ${qIdx} failed:`, err);
          return [];
        }
      });

      const results = await Promise.allSettled(queryPromises);
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          dataPoints.push(...result.value);
        }
      });

      console.log(`[Streaming/perplexity] Collected ${dataPoints.length} insights from ${specificQueries.length} targeted queries`);
      return dataPoints;

    } catch (error) {
      console.error('[Streaming/perplexity] Error:', error);
    }

    return dataPoints;
  }

  /**
   * Categorize Perplexity insight by emotional/functional type
   */
  private categorizePerplexityInsight(insight: string, queryType: string): DataPointType {
    const emotionalKeywords = /fear|frustrat|anxious|worry|stress|overwhelm|confus|uncertain|risk|lose|fail|afraid|nervous|hesitat|concern|dread|panic/i;
    const desireKeywords = /want|wish|need|looking for|searching|hope|dream|aspire|desire|if only|why can't/i;
    const isEmotional = emotionalKeywords.test(insight);
    const isDesire = desireKeywords.test(insight);

    // Map query types to data point types
    if (queryType === 'emotional_fear') return 'pain_point';
    if (queryType === 'frustration') return 'pain_point';
    if (queryType === 'desire') return 'unarticulated_need';
    if (queryType === 'objection') return 'customer_trigger';
    if (queryType === 'buying_trigger') return 'timing';

    // Fallback based on content analysis
    if (isEmotional) return 'pain_point';
    if (isDesire) return 'unarticulated_need';
    return 'customer_trigger';
  }

  /**
   * Fetch Reddit data for customer pain points and discussions
   * Uses Apify Reddit scraper for reliable data without OAuth complexity
   */
  private async fetchRedditData(): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];

    try {
      // Build UVP-targeted Reddit search queries
      const targetCustomer = this.uvpData?.target_customer || '';
      const transformation = this.uvpData?.transformation || '';
      const uvpIndustry = this.getUVPIndustry();

      // Extract search terms from UVP
      const customerTerm = targetCustomer
        ? this.extractCustomerSearchTerm(targetCustomer)
        : this.brandData.industry;

      // Log whether using UVP or fallback
      if (targetCustomer) {
        console.log('[Streaming/reddit] ✅ Using UVP-TARGETED search for:', customerTerm);
      } else {
        console.warn('[Streaming/reddit] ⚠️ FALLBACK to generic industry search:', this.brandData.industry);
      }

      // Find relevant subreddits based on industry
      const relevantSubreddits = await this.getRelevantSubredditsForUVP(uvpIndustry);
      console.log(`[Streaming/reddit] Mining ${relevantSubreddits.length} subreddits for customer pain points:`, relevantSubreddits);

      // PHASE 15: Use business purpose-aware queries for Reddit search
      let searchQueries: string[];
      if (this.contextualQueries.length > 0) {
        // Use social/reddit contextual queries from business purpose detection
        const socialQueries = getQueriesForType(this.contextualQueries, 'social');
        searchQueries = socialQueries.map(q => q.query).slice(0, 3);
        console.log(`[Streaming/reddit] ✅ Using BUSINESS PURPOSE-AWARE queries:`, searchQueries);
      } else {
        // Fallback to old method
        searchQueries = this.buildRedditSearchQueries(customerTerm, transformation, uvpIndustry);
        console.log(`[Streaming/reddit] ⚠️ Fallback to legacy queries:`, searchQueries.slice(0, 3));
      }
      console.log(`[Streaming/reddit] Running ${Math.min(3, searchQueries.length)} targeted searches IN PARALLEL`);

      // CRITICAL FIX: Run all 3 Reddit queries in PARALLEL instead of sequential
      // This reduces 109s → ~15s by not waiting for each query to complete
      const redditPromises = searchQueries.slice(0, 3).map(query =>
        redditAPI.mineIntelligence(query, {
          subreddits: relevantSubreddits,
          limit: 50,
          commentsPerPost: 20,
          sortBy: 'relevance',
          timeFilter: 'year'
        }).catch(err => {
          console.warn(`[Streaming/reddit] Query "${query}" failed:`, err);
          return { triggers: [], insights: [] }; // Return empty on failure
        })
      );

      // Wait for all queries to complete in parallel
      const redditResults = await Promise.all(redditPromises);

      // Process all results
      redditResults.forEach((result, queryIdx) => {
        // Convert psychological triggers to data points
        result.triggers.forEach((trigger, idx) => {
          dataPoints.push({
            id: `reddit-trigger-${Date.now()}-${queryIdx}-${idx}`,
            source: 'reddit' as DataSource,
            type: this.mapTriggerToDataPointType(trigger.type),
            content: trigger.text,
            metadata: {
              triggerType: trigger.type,
              intensity: trigger.intensity,
              subreddit: trigger.subreddit,
              upvotes: trigger.upvotes,
              url: trigger.url,
              context: trigger.context?.substring(0, 200)
            },
            createdAt: new Date()
          });
        });

        // Convert customer insights (pain points & desires) to data points
        result.insights.forEach((insight, idx) => {
          const isPainPoint = !!insight.painPoint;
          dataPoints.push({
            id: `reddit-insight-${Date.now()}-${queryIdx}-${idx}`,
            source: 'reddit' as DataSource,
            type: isPainPoint ? 'pain_point' : 'unarticulated_need',
            content: insight.painPoint || insight.desire || insight.context,
            metadata: {
              subreddit: insight.subreddit,
              upvotes: insight.upvotes,
              url: insight.url,
              insightType: isPainPoint ? 'pain_point' : 'desire'
            },
            createdAt: new Date()
          });
        });
      });

      console.log(`[Streaming/reddit] Collected ${dataPoints.length} data points from Reddit`);
      return dataPoints;

    } catch (error) {
      console.error('[Streaming/reddit] Error:', error);
    }

    return dataPoints;
  }

  /**
   * Get relevant subreddits based on UVP industry
   */
  private async getRelevantSubredditsForUVP(industry: string): Promise<string[]> {
    // Industry-to-subreddit mapping - enhanced for UVP-driven discovery
    const industrySubreddits: Record<string, string[]> = {
      'insurance': ['Insurance', 'InsuranceProfessional', 'personalfinance', 'FinancialPlanning'],
      'financial services': ['FinancialPlanning', 'personalfinance', 'FinancialCareers', 'CFP'],
      'healthcare': ['healthcare', 'medicine', 'nursing', 'healthIT'],
      'software': ['SaaS', 'startups', 'Entrepreneur', 'webdev', 'programming'],
      'consulting': ['consulting', 'Entrepreneur', 'smallbusiness', 'marketing'],
      'marketing': ['marketing', 'digital_marketing', 'PPC', 'SEO', 'socialmedia'],
      'retail': ['retail', 'smallbusiness', 'ecommerce', 'Entrepreneur'],
      'restaurant': ['KitchenConfidential', 'restaurateur', 'smallbusiness', 'Cooking'],
      'real estate': ['RealEstate', 'realestateinvesting', 'FirstTimeHomeBuyer', 'Realtor'],
      'legal': ['LawFirm', 'lawyers', 'LegalAdvice', 'smallbusiness'],
      'construction': ['Construction', 'Contractor', 'smallbusiness'],
      'education': ['education', 'Teachers', 'edtech', 'HigherEducation'],
      'travel': ['TravelAgents', 'travel', 'Hospitality'],
      'logistics': ['logistics', 'supplychain', 'smallbusiness'],
      'automotive': ['AutoDealerships', 'askcarsales', 'cars']
    };

    // Get subreddits for industry, fallback to generic business
    const subreddits = industrySubreddits[industry.toLowerCase()] ||
                       industrySubreddits['software'] ||
                       ['smallbusiness', 'Entrepreneur', 'startups'];

    // Add general business subreddits
    return [...new Set([...subreddits, 'smallbusiness', 'Entrepreneur'])];
  }

  /**
   * Build Reddit search queries from UVP context
   */
  private buildRedditSearchQueries(customerTerm: string, transformation: string, industry: string): string[] {
    const queries: string[] = [];

    // Parse pain point from transformation
    const painPoint = transformation?.split('→')[0]?.trim() || '';

    // Query 1: Direct customer pain point search
    if (customerTerm) {
      queries.push(`${customerTerm} frustrated problems challenges`);
    }

    // Query 2: Industry + common pain expressions
    queries.push(`${industry} "I hate" OR "frustrating" OR "problem with"`);

    // Query 3: Pain point from transformation
    if (painPoint) {
      queries.push(`${painPoint.substring(0, 50)} solution help`);
    }

    // Query 4: Industry complaints
    queries.push(`${industry} complaints issues worst`);

    // Query 5: What customers wish existed
    queries.push(`${industry} "I wish" OR "if only" OR "need a"`);

    return queries;
  }

  /**
   * Map Reddit emotional trigger type to DataPointType
   */
  private mapTriggerToDataPointType(triggerType: string): DataPointType {
    const mapping: Record<string, DataPointType> = {
      'curiosity': 'trending_topic',
      'fear': 'pain_point',
      'desire': 'unarticulated_need',
      'belonging': 'customer_trigger',
      'achievement': 'customer_trigger',
      'trust': 'competitor_mention',
      'urgency': 'timing'
    };
    return mapping[triggerType] || 'unarticulated_need';
  }

  /**
   * Fetch Quora data for customer questions and desires
   * Uses Apify Quora scraper for deep question mining
   */
  private async fetchQuoraData(): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];

    try {
      // Build UVP-targeted Quora search queries
      const targetCustomer = this.uvpData?.target_customer || '';
      const transformation = this.uvpData?.transformation || '';
      const uvpIndustry = this.getUVPIndustry();

      // Extract search terms from UVP
      const customerTerm = targetCustomer
        ? this.extractCustomerSearchTerm(targetCustomer)
        : this.brandData.industry;

      // Log whether using UVP or fallback
      if (targetCustomer) {
        console.log('[Streaming/quora] ✅ Using UVP-TARGETED search for:', customerTerm);
      } else {
        console.warn('[Streaming/quora] ⚠️ FALLBACK to generic industry search:', this.brandData.industry);
      }

      // Build Quora search keywords from UVP
      const searchKeywords = this.buildQuoraSearchKeywords(customerTerm, transformation, uvpIndustry);
      console.log(`[Streaming/quora] Mining Quora for questions with ${searchKeywords.length} keywords:`, searchKeywords.slice(0, 3));

      // Scrape Quora for insights - increased limit for more data points
      const quoraInsights = await apifySocialScraper.scrapeQuoraInsights(searchKeywords, 50);

      // Convert questions to data points
      quoraInsights.questions.forEach((q, idx) => {
        dataPoints.push({
          id: `quora-question-${Date.now()}-${idx}`,
          source: 'quora' as DataSource,
          type: this.mapQuoraCategoryToDataPointType(q.psychological_category),
          content: q.question,
          metadata: {
            upvotes: q.upvotes,
            followers: q.followers,
            answers_count: q.answers_count,
            url: q.url,
            topics: q.topics,
            psychological_category: q.psychological_category
          },
          createdAt: new Date()
        });
      });

      // Convert top answers to data points (valuable for content angles)
      quoraInsights.top_answers.forEach((a, idx) => {
        dataPoints.push({
          id: `quora-answer-${Date.now()}-${idx}`,
          source: 'quora' as DataSource,
          type: 'customer_trigger' as DataPointType,
          content: a.answer.substring(0, 500), // Truncate long answers
          metadata: {
            upvotes: a.upvotes,
            author_credentials: a.author_credentials,
            question: a.question,
            key_insights: a.key_insights
          },
          createdAt: new Date()
        });
      });

      // Convert desires to data points
      quoraInsights.desires.forEach((d, idx) => {
        dataPoints.push({
          id: `quora-desire-${Date.now()}-${idx}`,
          source: 'quora' as DataSource,
          type: 'unarticulated_need' as DataPointType,
          content: d.text,
          metadata: {
            intensity: d.intensity,
            frequency: d.frequency,
            context: d.context
          },
          createdAt: new Date()
        });
      });

      // Convert fears to data points
      quoraInsights.fears.forEach((f, idx) => {
        dataPoints.push({
          id: `quora-fear-${Date.now()}-${idx}`,
          source: 'quora' as DataSource,
          type: 'pain_point' as DataPointType,
          content: f.text,
          metadata: {
            intensity: f.intensity,
            frequency: f.frequency,
            context: f.context
          },
          createdAt: new Date()
        });
      });

      console.log(`[Streaming/quora] Collected ${dataPoints.length} data points from Quora`);
      return dataPoints;

    } catch (error) {
      console.error('[Streaming/quora] Error:', error);
    }

    return dataPoints;
  }

  /**
   * Build Quora search keywords from UVP context
   */
  private buildQuoraSearchKeywords(customerTerm: string, transformation: string, industry: string): string[] {
    const keywords: string[] = [];

    // Parse pain point from transformation
    const painPoint = transformation?.split('→')[0]?.trim() || '';

    // Customer-focused queries
    if (customerTerm) {
      keywords.push(`${customerTerm} challenges`);
      keywords.push(`${customerTerm} problems`);
    }

    // Industry + question patterns
    keywords.push(`${industry} best practices`);
    keywords.push(`${industry} common mistakes`);
    keywords.push(`how to ${industry}`);

    // Pain point from transformation
    if (painPoint) {
      keywords.push(painPoint.substring(0, 40));
    }

    // Solution-seeking patterns
    keywords.push(`${industry} solutions`);
    keywords.push(`improve ${industry}`);

    return keywords.slice(0, 5); // Limit to 5 keywords
  }

  /**
   * Map Quora psychological category to DataPointType
   */
  private mapQuoraCategoryToDataPointType(category: string): DataPointType {
    const mapping: Record<string, DataPointType> = {
      'desire': 'unarticulated_need',
      'fear': 'pain_point',
      'uncertainty': 'question',
      'problem': 'pain_point'
    };
    return mapping[category] || 'question';
  }

  /**
   * Fetch G2 Reviews for B2B software insights
   * Only runs for B2B business types
   */
  private async fetchG2Data(): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];

    try {
      const targetCustomer = this.uvpData?.target_customer || '';
      const uvpIndustry = this.getUVPIndustry();

      // Log targeting info
      if (targetCustomer) {
        console.log('[Streaming/g2] ✅ Mining G2 reviews for B2B insights in:', uvpIndustry);
      } else {
        console.warn('[Streaming/g2] ⚠️ FALLBACK to generic product search');
      }

      // Search G2 using brand name or industry-specific category
      const productName = this.brandData.name;
      const category = uvpIndustry === 'software' ? 'Enterprise Software' : `${uvpIndustry} Software`;

      console.log(`[Streaming/g2] Scraping G2 for "${productName}" in category "${category}"`);

      const g2Reviews = await apifySocialScraper.scrapeG2Reviews(productName, category, 50);

      // Convert reviews to data points
      g2Reviews.reviews.forEach((review, idx) => {
        // Create data point from review text
        dataPoints.push({
          id: `g2-review-${Date.now()}-${idx}`,
          source: 'g2' as DataSource,
          type: 'customer_trigger' as DataPointType,
          content: review.text.substring(0, 500),
          metadata: {
            rating: review.rating,
            pros: review.pros,
            cons: review.cons,
            user_role: review.user_role,
            company_size: review.company_size,
            industry: review.industry
          },
          createdAt: new Date(review.date)
        });

        // Create separate data point for cons (pain points)
        if (review.cons && review.cons.length > 20) {
          dataPoints.push({
            id: `g2-cons-${Date.now()}-${idx}`,
            source: 'g2' as DataSource,
            type: 'pain_point' as DataPointType,
            content: review.cons,
            metadata: {
              rating: review.rating,
              user_role: review.user_role,
              company_size: review.company_size
            },
            createdAt: new Date(review.date)
          });
        }
      });

      // Convert buyer intent signals to data points
      g2Reviews.buyer_intent_signals.forEach((signal, idx) => {
        dataPoints.push({
          id: `g2-intent-${Date.now()}-${idx}`,
          source: 'g2' as DataSource,
          type: 'customer_trigger' as DataPointType,
          content: signal.signal,
          metadata: {
            intent_category: signal.category,
            strength: signal.strength
          },
          createdAt: new Date()
        });
      });

      // Convert competitive intelligence
      g2Reviews.competitive_intelligence.switching_reasons.forEach((reason, idx) => {
        dataPoints.push({
          id: `g2-switching-${Date.now()}-${idx}`,
          source: 'g2' as DataSource,
          type: 'competitor_mention' as DataPointType,
          content: reason,
          metadata: {
            type: 'switching_reason',
            alternatives: g2Reviews.competitive_intelligence.alternatives_mentioned
          },
          createdAt: new Date()
        });
      });

      // ITEM #22: Software Alternative Mining from G2/Reddit
      const alternativeMining = this.mineSoftwareAlternatives(g2Reviews, uvpIndustry);
      alternativeMining.forEach((alt, idx) => {
        dataPoints.push({
          id: `g2-alternative-${Date.now()}-${idx}`,
          source: 'g2' as DataSource,
          type: 'competitor_weakness' as DataPointType,
          content: alt.contentIdea,
          metadata: {
            alternativeTo: alt.alternativeTo,
            switchingReason: alt.switchingReason,
            targetAudience: alt.targetAudience,
            platform: 'software_alternative'
          },
          createdAt: new Date()
        });
      });

      // ITEM #23: Enterprise Vendor Comparison for B2B Global
      const vendorComparisons = this.generateEnterpriseVendorComparisons(g2Reviews, uvpIndustry);
      vendorComparisons.forEach((comparison, idx) => {
        dataPoints.push({
          id: `g2-vendor-${Date.now()}-${idx}`,
          source: 'g2' as DataSource,
          type: 'competitive_gap' as DataPointType,
          content: comparison.contentIdea,
          metadata: {
            comparisonType: comparison.type,
            vendorsMentioned: comparison.vendors,
            differentiator: comparison.differentiator,
            platform: 'enterprise_vendor_comparison'
          },
          createdAt: new Date()
        });
      });

      console.log(`[Streaming/g2] Collected ${dataPoints.length} data points from G2 reviews, ${alternativeMining.length} alternatives, ${vendorComparisons.length} vendor comparisons`);
      return dataPoints;

    } catch (error) {
      console.error('[Streaming/g2] Error:', error);
    }

    return dataPoints;
  }

  /**
   * ITEM #22: Mine software alternatives from G2 reviews
   */
  private mineSoftwareAlternatives(
    g2Reviews: any,
    industry: string
  ): Array<{ contentIdea: string; alternativeTo: string; switchingReason: string; targetAudience: string }> {
    const alternatives: Array<{ contentIdea: string; alternativeTo: string; switchingReason: string; targetAudience: string }> = [];

    const alternativesMentioned = g2Reviews.competitive_intelligence?.alternatives_mentioned || [];
    const switchingReasons = g2Reviews.competitive_intelligence?.switching_reasons || [];

    // Generate "Why switch from X" content angles
    alternativesMentioned.forEach((competitor: string) => {
      const reason = switchingReasons[0] || 'better features and value';

      alternatives.push({
        contentIdea: `${this.brandData.name} vs ${competitor}: Why ${industry} leaders are making the switch`,
        alternativeTo: competitor,
        switchingReason: reason,
        targetAudience: 'decision_makers'
      });

      alternatives.push({
        contentIdea: `Frustrated with ${competitor}? Here's what you're missing`,
        alternativeTo: competitor,
        switchingReason: reason,
        targetAudience: 'active_evaluators'
      });
    });

    // Add general "alternatives" content if no specific competitors found
    if (alternatives.length === 0) {
      alternatives.push({
        contentIdea: `Top ${industry} solutions compared: Finding the right fit for your business`,
        alternativeTo: 'market_alternatives',
        switchingReason: 'market_evaluation',
        targetAudience: 'researchers'
      });
    }

    return alternatives.slice(0, 5);
  }

  /**
   * ITEM #23: Generate enterprise vendor comparisons for B2B Global
   */
  private generateEnterpriseVendorComparisons(
    g2Reviews: any,
    industry: string
  ): Array<{ contentIdea: string; type: string; vendors: string[]; differentiator: string }> {
    const comparisons: Array<{ contentIdea: string; type: string; vendors: string[]; differentiator: string }> = [];

    const alternativesMentioned = g2Reviews.competitive_intelligence?.alternatives_mentioned || [];
    const featureRequests = g2Reviews.feature_requests || [];

    // Enterprise buyer-focused comparisons
    comparisons.push({
      contentIdea: `Enterprise ${industry} buyer's guide: Key criteria for vendor selection`,
      type: 'buyers_guide',
      vendors: alternativesMentioned.slice(0, 3),
      differentiator: 'comprehensive_evaluation'
    });

    comparisons.push({
      contentIdea: `How ${this.brandData.name} addresses enterprise ${industry} challenges that competitors miss`,
      type: 'differentiation',
      vendors: alternativesMentioned.slice(0, 3),
      differentiator: 'unique_capabilities'
    });

    // TCO and ROI comparisons
    comparisons.push({
      contentIdea: `Total cost of ownership: ${this.brandData.name} vs enterprise alternatives`,
      type: 'tco_analysis',
      vendors: alternativesMentioned.slice(0, 3),
      differentiator: 'cost_value'
    });

    // Feature gap comparisons
    if (featureRequests.length > 0) {
      comparisons.push({
        contentIdea: `Feature comparison: Where ${this.brandData.name} excels vs ${alternativesMentioned[0] || 'competitors'}`,
        type: 'feature_comparison',
        vendors: alternativesMentioned.slice(0, 3),
        differentiator: 'feature_superiority'
      });
    }

    // Enterprise security/compliance comparison
    comparisons.push({
      contentIdea: `Enterprise security and compliance: How ${this.brandData.name} meets ${industry} requirements`,
      type: 'compliance_comparison',
      vendors: alternativesMentioned.slice(0, 3),
      differentiator: 'security_compliance'
    });

    return comparisons;
  }

  /**
   * Fetch TrustPilot reviews for customer sentiment
   * Works for both SMB and B2B businesses
   */
  private async fetchTrustPilotData(): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];

    try {
      const targetCustomer = this.uvpData?.target_customer || '';
      const uvpIndustry = this.getUVPIndustry();

      // Log targeting info
      if (targetCustomer) {
        console.log('[Streaming/trustpilot] ✅ Mining TrustPilot reviews for:', this.brandData.name);
      } else {
        console.warn('[Streaming/trustpilot] ⚠️ FALLBACK to generic brand search');
      }

      // Get domain from brand data or construct from name
      const domain = this.brandData.website || `${this.brandData.name.toLowerCase().replace(/\s+/g, '')}.com`;
      console.log(`[Streaming/trustpilot] Scraping TrustPilot for domain: ${domain}`);

      const trustPilotReviews = await apifySocialScraper.scrapeTrustPilotReviews(domain, 50);

      // Convert reviews to data points (with safety checks)
      const reviews = Array.isArray(trustPilotReviews.reviews) ? trustPilotReviews.reviews : [];
      reviews.forEach((review, idx) => {
        if (!review?.text) return;
        dataPoints.push({
          id: `trustpilot-review-${Date.now()}-${idx}`,
          source: 'trustpilot' as DataSource,
          type: this.mapRatingToDataPointType(review.rating || 3),
          content: (review.text || '').substring(0, 500),
          metadata: {
            rating: review.rating,
            title: review.title,
            sentiment: review.sentiment,
            helpful_count: review.helpful_count
          },
          createdAt: new Date(review.date || Date.now())
        });
      });

      // Convert feature requests to data points (with safety checks)
      const featureRequests = Array.isArray(trustPilotReviews.feature_requests) ? trustPilotReviews.feature_requests : [];
      featureRequests.forEach((request, idx) => {
        if (!request?.feature) return;
        dataPoints.push({
          id: `trustpilot-feature-${Date.now()}-${idx}`,
          source: 'trustpilot' as DataSource,
          type: 'unarticulated_need' as DataPointType,
          content: request.feature,
          metadata: {
            requested_count: request.count,
            from_negative_reviews: request.from_negative_reviews
          },
          createdAt: new Date()
        });
      });

      // Convert satisfaction patterns to data points (with safety checks)
      // satisfaction_patterns might be an object or array, handle both
      const patterns = Array.isArray(trustPilotReviews.satisfaction_patterns)
        ? trustPilotReviews.satisfaction_patterns
        : [];
      patterns.forEach((pattern, idx) => {
        if (!pattern?.pattern) return;
        dataPoints.push({
          id: `trustpilot-pattern-${Date.now()}-${idx}`,
          source: 'trustpilot' as DataSource,
          type: pattern.category === 'complaint' ? 'pain_point' : 'customer_trigger',
          content: pattern.pattern,
          metadata: {
            category: pattern.category,
            frequency: pattern.frequency
          },
          createdAt: new Date()
        });
      });

      console.log(`[Streaming/trustpilot] Collected ${dataPoints.length} data points from TrustPilot`);
      return dataPoints;

    } catch (error) {
      console.error('[Streaming/trustpilot] Error:', error);
    }

    return dataPoints;
  }

  /**
   * Map TrustPilot rating to DataPointType
   */
  private mapRatingToDataPointType(rating: number): DataPointType {
    if (rating <= 2) return 'pain_point';
    if (rating >= 4) return 'customer_trigger';
    return 'sentiment';
  }

  /**
   * Fetch Twitter/X data for real-time sentiment
   * Works for both SMB and B2B businesses
   */
  private async fetchTwitterData(): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];

    try {
      const targetCustomer = this.uvpData?.target_customer || '';
      const uvpIndustry = this.getUVPIndustry();

      // Build search keywords from UVP
      const customerTerm = targetCustomer
        ? this.extractCustomerSearchTerm(targetCustomer)
        : this.brandData.industry;

      // Log targeting info
      if (targetCustomer) {
        console.log('[Streaming/twitter] ✅ Mining Twitter/X for:', customerTerm);
      } else {
        console.warn('[Streaming/twitter] ⚠️ FALLBACK to generic brand search');
      }

      // Build Twitter search keywords
      const searchKeywords = this.buildTwitterSearchKeywords(customerTerm, uvpIndustry);
      console.log(`[Streaming/twitter] Searching Twitter with ${searchKeywords.length} keywords`);

      const twitterSentiment = await apifySocialScraper.scrapeTwitterSentiment(searchKeywords, 75);

      // Convert tweets to data points
      twitterSentiment.tweets.forEach((tweet, idx) => {
        dataPoints.push({
          id: `twitter-tweet-${Date.now()}-${idx}`,
          source: 'twitter' as DataSource,
          type: this.mapSentimentToDataPointType(tweet.sentiment),
          content: tweet.text,
          metadata: {
            likes: tweet.likes,
            retweets: tweet.retweets,
            replies: tweet.replies,
            sentiment: tweet.sentiment,
            engagement_rate: tweet.engagement_rate,
            author: tweet.author
          },
          createdAt: new Date(tweet.timestamp)
        });
      });

      // Convert pain points extracted from tweets
      twitterSentiment.pain_points.forEach((painPoint, idx) => {
        dataPoints.push({
          id: `twitter-pain-${Date.now()}-${idx}`,
          source: 'twitter' as DataSource,
          type: 'pain_point' as DataPointType,
          content: painPoint.text,
          metadata: {
            intensity: painPoint.intensity,
            frequency: painPoint.frequency,
            context: painPoint.context
          },
          createdAt: new Date()
        });
      });

      // Convert viral discussions to data points
      twitterSentiment.viral_discussions.forEach((discussion, idx) => {
        dataPoints.push({
          id: `twitter-viral-${Date.now()}-${idx}`,
          source: 'twitter' as DataSource,
          type: 'trending_topic' as DataPointType,
          content: `${discussion.topic}: ${discussion.key_phrases.join(', ')}`,
          metadata: {
            topic: discussion.topic,
            volume: discussion.volume,
            sentiment: discussion.sentiment,
            key_phrases: discussion.key_phrases
          },
          createdAt: new Date()
        });
      });

      console.log(`[Streaming/twitter] Collected ${dataPoints.length} data points from Twitter`);
      return dataPoints;

    } catch (error) {
      console.error('[Streaming/twitter] Error:', error);
    }

    return dataPoints;
  }

  /**
   * Build Twitter search keywords from UVP context
   */
  private buildTwitterSearchKeywords(customerTerm: string, industry: string): string[] {
    const keywords: string[] = [];

    // Brand mention
    keywords.push(this.brandData.name);

    // Customer + pain expressions
    if (customerTerm) {
      keywords.push(`${customerTerm} frustrated`);
      keywords.push(`${customerTerm} problems`);
    }

    // Industry + sentiment
    keywords.push(`${industry} complaints`);
    keywords.push(`${industry} issues`);

    // Hashtag patterns
    keywords.push(`#${industry.replace(/\s+/g, '')}problems`);

    return keywords.slice(0, 5);
  }

  /**
   * Map Twitter sentiment to DataPointType
   */
  private mapSentimentToDataPointType(sentiment: string): DataPointType {
    const mapping: Record<string, DataPointType> = {
      'positive': 'customer_trigger',
      'negative': 'pain_point',
      'neutral': 'sentiment'
    };
    return mapping[sentiment] || 'sentiment';
  }

  /**
   * ITEM #13: Fetch Yelp data for SMB Local businesses
   * Extracts reviews, tips, popular items, and sentiment patterns
   */
  private async fetchYelpData(): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];

    // Get location for Yelp search
    const location = this.brandData.location
      ? typeof this.brandData.location === 'string'
        ? this.brandData.location
        : `${this.brandData.location.city}, ${this.brandData.location.state}`
      : this.brandData.city;

    if (!location) {
      console.log('[Streaming/yelp] No location, skipping (Yelp requires location for SMB)');
      return dataPoints;
    }

    try {
      console.log(`[Streaming/yelp] Mining Yelp reviews for: ${this.brandData.name} in ${location}`);

      const yelpData = await apifySocialScraper.scrapeYelpReviews(
        this.brandData.name,
        location,
        30
      );

      // Convert reviews to data points with rating stratification
      yelpData.reviews.forEach((review, idx) => {
        const ratingTier = review.rating <= 2 ? 'low' : review.rating >= 4 ? 'high' : 'mid';

        dataPoints.push({
          id: `yelp-review-${Date.now()}-${idx}`,
          source: 'outscraper' as DataSource, // Using outscraper as Yelp is a local source type
          type: this.mapRatingToDataPointType(review.rating),
          content: review.text,
          metadata: {
            rating: review.rating,
            ratingTier: ratingTier,
            userName: review.user_name,
            userLocation: review.user_location,
            isElite: review.is_elite,
            usefulCount: review.useful_count,
            platform: 'yelp',
            insightType: ratingTier === 'low' ? 'complaint' :
                        ratingTier === 'high' ? 'testimonial' : 'feedback'
          },
          createdAt: new Date(review.date)
        });
      });

      // Convert tips to data points (tips are generally positive recommendations)
      yelpData.tips.forEach((tip, idx) => {
        dataPoints.push({
          id: `yelp-tip-${Date.now()}-${idx}`,
          source: 'outscraper' as DataSource,
          type: 'customer_trigger' as DataPointType,
          content: tip.text,
          metadata: {
            likes: tip.likes,
            userName: tip.user_name,
            platform: 'yelp',
            insightType: 'tip'
          },
          createdAt: new Date()
        });
      });

      // Convert popular dishes/items to data points
      yelpData.popular_dishes.forEach((dish, idx) => {
        dataPoints.push({
          id: `yelp-dish-${Date.now()}-${idx}`,
          source: 'outscraper' as DataSource,
          type: 'customer_trigger' as DataPointType,
          content: `Popular item: ${dish}`,
          metadata: {
            platform: 'yelp',
            insightType: 'popular_item'
          },
          createdAt: new Date()
        });
      });

      // Convert satisfaction patterns
      yelpData.satisfaction_patterns.common_praises.forEach((praise, idx) => {
        dataPoints.push({
          id: `yelp-praise-${Date.now()}-${idx}`,
          source: 'outscraper' as DataSource,
          type: 'customer_trigger' as DataPointType,
          content: `Customer praise theme: ${praise}`,
          metadata: { platform: 'yelp', insightType: 'praise_theme' },
          createdAt: new Date()
        });
      });

      yelpData.satisfaction_patterns.common_complaints.forEach((complaint, idx) => {
        dataPoints.push({
          id: `yelp-complaint-${Date.now()}-${idx}`,
          source: 'outscraper' as DataSource,
          type: 'pain_point' as DataPointType,
          content: `Customer complaint theme: ${complaint}`,
          metadata: { platform: 'yelp', insightType: 'complaint_theme' },
          createdAt: new Date()
        });
      });

      // Log stratification results
      const lowRating = yelpData.reviews.filter(r => r.rating <= 2).length;
      const midRating = yelpData.reviews.filter(r => r.rating === 3).length;
      const highRating = yelpData.reviews.filter(r => r.rating >= 4).length;
      console.log(`[Streaming/yelp] Mined ${yelpData.reviews.length} Yelp reviews: ${lowRating} low, ${midRating} mid, ${highRating} high`);
      console.log(`[Streaming/yelp] Extracted ${yelpData.tips.length} tips, ${yelpData.popular_dishes.length} popular items`);

      return dataPoints;

    } catch (error) {
      console.error('[Streaming/yelp] Error:', error);
    }

    return dataPoints;
  }

  // ============================================================================
  // TASK 6.7: COMPETITOR DISCOVERY - Runs in parallel with other APIs
  // ============================================================================

  /**
   * Fetch competitor discovery data during UVP process
   * This runs in parallel with other APIs to pre-warm the Gap Tab
   *
   * Architecture:
   * - Triggers competitorStreamingManager.startEarlyDiscovery()
   * - Discovers competitors using Perplexity AI
   * - Emits events for real-time UI updates
   * - Returns discovered competitors as DataPoints for DeepContext
   */
  private async fetchCompetitorDiscoveryData(config: StreamingConfig): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];
    const brandId = config.brandId;

    try {
      console.log('[Streaming/competitor-discovery] Starting early competitor discovery for brand:', brandId);

      // Build minimal context from current state for discovery
      const minimalContext = this.currentContext || this.buildEmptyContext();

      // Trigger early discovery via the streaming manager
      const discovered = await competitorStreamingManager.startEarlyDiscovery(
        brandId,
        minimalContext
      );

      console.log(`[Streaming/competitor-discovery] Discovered ${discovered.length} competitors`);

      // Convert discovered competitors to DataPoints for DeepContext integration
      for (const competitor of discovered) {
        dataPoints.push({
          id: `competitor-${competitor.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          source: 'perplexity' as DataSource,
          type: 'competitor' as DataPointType,
          content: `Competitor: ${competitor.name}${competitor.website ? ` (${competitor.website})` : ''} - ${competitor.reason}`,
          metadata: {
            domain: 'competitive' as const,
            relevance: competitor.confidence,
            competitor_name: competitor.name,
            competitor_website: competitor.website,
            discovery_reason: competitor.reason,
            confidence: competitor.confidence,
            segment_type: competitor.segment_type,
            business_type: competitor.business_type,
            discovery_timestamp: Date.now()
          },
          createdAt: new Date()
        });
      }

      // Store discovered competitors in business profile for Gap Tab to use
      if (this.currentContext?.business?.profile) {
        this.currentContext.business.profile.competitors = discovered.map(c => ({
          name: c.name,
          website: c.website || '',
          overlap_score: c.confidence
        }));
      }

      console.log(`[Streaming/competitor-discovery] Added ${dataPoints.length} competitor data points to context`);

    } catch (error) {
      console.error('[Streaming/competitor-discovery] Error during discovery:', error);
      // Don't throw - this is a non-blocking enhancement
    }

    return dataPoints;
  }

  // LEGACY: Keep old single-query method for fallback
  private async fetchPerplexityDataLegacy(): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];
    const targetCustomer = this.uvpData?.target_customer || '';
    const transformation = this.uvpData?.transformation || '';
    const customerProblem = transformation.split('→')[0]?.trim() || '';
    const desiredOutcome = transformation.split('→')[1]?.trim() || '';

    try {
      const query = targetCustomer
        ? `What are the top pain points, challenges, and emotional frustrations that ${targetCustomer} experience?
           Focus on:
           1. Functional needs: What tasks are they trying to accomplish?
           2. Emotional drivers: What fears, anxieties, or frustrations do they have?
           3. Social drivers: How do they want to be perceived by others?
           4. Current workarounds: What solutions are they using that don't fully work?
           ${customerProblem ? `Their core problem is: "${customerProblem}"` : ''}
           ${desiredOutcome ? `Their desired outcome is: "${desiredOutcome}"` : ''}`
        : `What are the current pain points and needs for ${this.brandData.industry} customers?`;

      console.log('[Streaming/perplexity] Customer-focused query:', {
        targetCustomer: targetCustomer.substring(0, 80),
        customerProblem: customerProblem.substring(0, 80),
        desiredOutcome: desiredOutcome.substring(0, 80)
      });

      const response = await perplexityAPI.getIndustryInsights({
        query,
        context: {
          industry: this.brandData.industry,
          brand_name: this.brandData.name,
          target_customer: targetCustomer,
          customer_problem: customerProblem,
          desired_outcome: desiredOutcome
        },
        max_results: 20
      });

      // Categorize insights by driver type (functional vs emotional)
      response.insights.forEach((insight: string, idx: number) => {
        // Detect if insight is emotional or functional
        const emotionalKeywords = /fear|frustrat|anxious|worry|stress|overwhelm|confus|uncertain|risk|lose|fail/i;
        const isEmotional = emotionalKeywords.test(insight);

        dataPoints.push({
          id: `perplexity-${Date.now()}-${idx}`,
          source: 'perplexity' as DataSource,
          type: isEmotional ? 'pain_point' : 'customer_trigger' as DataPointType,
          content: insight,
          metadata: {
            confidence: response.confidence,
            driverType: isEmotional ? 'emotional' : 'functional',
            framework: 'jtbd',
            targetCustomer: targetCustomer.substring(0, 100)
          },
          createdAt: new Date()
        });
      });
    } catch (error) {
      console.error('[Streaming/perplexity] Error:', error);
    }

    return dataPoints;
  }

  /**
   * Load UVP data from database as baseline context
   * This provides immediate data before APIs complete
   */
  private async loadUVPData(): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];

    try {
      // Load UVP from marba_uvps table (correct table name!)
      const { data: uvpData, error } = await supabase
        .from('marba_uvps')
        .select('*')
        .eq('brand_id', this.brandData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[Streaming/uvp] Database error:', error);
        return dataPoints;
      }

      if (!uvpData) {
        console.log('[Streaming/uvp] No UVP data found in marba_uvps for brand:', this.brandData.id);

        // Fallback: Try localStorage for pending UVP data
        // Check multiple possible sources: pending flag, session ID, or any marba_uvp_ key
        let pendingUVP: any = null;

        // Method 1: Check pending flag + session ID
        const hasPending = localStorage.getItem('marba_uvp_pending') === 'true';
        const sessionId = localStorage.getItem('marba_session_id');

        if (hasPending && sessionId) {
          const localUvpData = localStorage.getItem(`marba_uvp_${sessionId}`);
          if (localUvpData) {
            try {
              pendingUVP = JSON.parse(localUvpData);
              console.log('[Streaming/uvp] Found pending UVP via session ID:', sessionId);
            } catch (err) {
              console.error('[Streaming/uvp] Failed to parse localStorage UVP:', err);
            }
          }
        }

        // Method 2: Scan localStorage for any marba_uvp_ entries
        if (!pendingUVP) {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('marba_uvp_') && key !== 'marba_uvp_pending') {
              try {
                const data = localStorage.getItem(key);
                if (data) {
                  const parsed = JSON.parse(data);
                  // Verify it looks like UVP data
                  if (parsed.targetCustomer || parsed.transformationGoal || parsed.valuePropositionStatement) {
                    pendingUVP = parsed;
                    console.log('[Streaming/uvp] Found UVP in localStorage key:', key);
                    break;
                  }
                }
              } catch (err) {
                // Skip invalid entries
              }
            }
          }
        }

        if (pendingUVP) {
          // Store normalized UVP data
          this.uvpData = {
            target_customer: pendingUVP.targetCustomer?.statement || '',
            transformation: pendingUVP.transformationGoal?.statement || '',
            unique_solution: pendingUVP.uniqueSolution?.statement || '',
            key_benefit: pendingUVP.keyBenefit?.statement || '',
            complete_statement: pendingUVP.valuePropositionStatement || '',
            created_at: pendingUVP.createdAt || new Date().toISOString(),
          };

          console.log('[Streaming/uvp] ====== LOCALSTORAGE UVP DATA ======');
          console.log('[Streaming/uvp] Target customer:', this.uvpData.target_customer);
          console.log('[Streaming/uvp] Key benefit:', this.uvpData.key_benefit);
          console.log('[Streaming/uvp] ===================================');

          // Convert to data points
          return this.convertUVPToDataPoints();
        }

        console.log('[Streaming/uvp] No UVP data found in localStorage either');
        return dataPoints;
      }

      // Extract target customer statement from JSONB field
      // target_customer is JSONB with structure: { statement: string, industry?: string, ... }
      const targetCustomerObj = uvpData.target_customer;
      const targetCustomer = typeof targetCustomerObj === 'string'
        ? targetCustomerObj
        : targetCustomerObj?.statement || '';

      // Extract transformation from JSONB
      const transformationObj = uvpData.transformation_goal;
      const transformation = typeof transformationObj === 'string'
        ? transformationObj
        : transformationObj?.statement || '';

      // Extract unique solution from JSONB
      const uniqueSolutionObj = uvpData.unique_solution;
      const uniqueSolution = typeof uniqueSolutionObj === 'string'
        ? uniqueSolutionObj
        : uniqueSolutionObj?.statement || '';

      // Extract key benefit from JSONB
      const keyBenefitObj = uvpData.key_benefit;
      const keyBenefit = typeof keyBenefitObj === 'string'
        ? keyBenefitObj
        : keyBenefitObj?.statement || '';

      // Store normalized UVP data for use by other API fetchers
      this.uvpData = {
        target_customer: targetCustomer,
        transformation: transformation,
        unique_solution: uniqueSolution,
        key_benefit: keyBenefit,
        complete_statement: uvpData.value_proposition_statement || '',
        created_at: uvpData.created_at,
      };

      console.log('[Streaming/uvp] ====== UVP DATA LOADED ======');
      console.log('[Streaming/uvp] Target customer:', this.uvpData.target_customer);
      console.log('[Streaming/uvp] Transformation:', this.uvpData.transformation);
      console.log('[Streaming/uvp] Unique solution:', this.uvpData.unique_solution);
      console.log('[Streaming/uvp] Key benefit:', this.uvpData.key_benefit);
      console.log('[Streaming/uvp] =============================');

      // Convert UVP statements to data points (using normalized this.uvpData)
      if (this.uvpData.target_customer) {
        dataPoints.push({
          id: `uvp-target-${Date.now()}`,
          source: 'website' as DataSource,
          type: 'unarticulated_need' as DataPointType,
          content: `Target Customer: ${this.uvpData.target_customer}`,
          metadata: { uvpType: 'target_customer', confidence: 1.0 },
          createdAt: new Date(this.uvpData.created_at)
        });
      }

      if (this.uvpData.transformation) {
        dataPoints.push({
          id: `uvp-transform-${Date.now()}`,
          source: 'website' as DataSource,
          type: 'pain_point' as DataPointType,
          content: `Transformation: ${this.uvpData.transformation}`,
          metadata: { uvpType: 'transformation', confidence: 1.0 },
          createdAt: new Date(this.uvpData.created_at)
        });
      }

      if (this.uvpData.unique_solution) {
        dataPoints.push({
          id: `uvp-solution-${Date.now()}`,
          source: 'website' as DataSource,
          type: 'competitive_gap' as DataPointType,
          content: `Unique Solution: ${this.uvpData.unique_solution}`,
          metadata: { uvpType: 'unique_solution', confidence: 1.0 },
          createdAt: new Date(this.uvpData.created_at)
        });
      }

      if (this.uvpData.key_benefit) {
        dataPoints.push({
          id: `uvp-benefit-${Date.now()}`,
          source: 'website' as DataSource,
          type: 'customer_trigger' as DataPointType,
          content: `Key Benefit: ${this.uvpData.key_benefit}`,
          metadata: { uvpType: 'key_benefit', confidence: 1.0 },
          createdAt: new Date(this.uvpData.created_at)
        });
      }

      // Also load complete statement if available
      if (this.uvpData.complete_statement) {
        dataPoints.push({
          id: `uvp-complete-${Date.now()}`,
          source: 'website' as DataSource,
          type: 'trending_topic' as DataPointType,
          content: this.uvpData.complete_statement,
          metadata: { uvpType: 'complete_uvp', confidence: 1.0 },
          createdAt: new Date(this.uvpData.created_at)
        });
      }

      console.log(`[Streaming/uvp] Loaded ${dataPoints.length} UVP data points`);
    } catch (error) {
      console.error('[Streaming/uvp] Error loading UVP:', error);
    }

    return dataPoints;
  }

  /**
   * Helper to convert this.uvpData to data points array
   */
  private convertUVPToDataPoints(): DataPoint[] {
    const dataPoints: DataPoint[] = [];

    if (!this.uvpData) return dataPoints;

    if (this.uvpData.target_customer) {
      dataPoints.push({
        id: `uvp-target-${Date.now()}`,
        source: 'website' as DataSource,
        type: 'unarticulated_need' as DataPointType,
        content: `Target Customer: ${this.uvpData.target_customer}`,
        metadata: { uvpType: 'target_customer', confidence: 1.0 },
        createdAt: new Date(this.uvpData.created_at)
      });
    }

    if (this.uvpData.transformation) {
      dataPoints.push({
        id: `uvp-transform-${Date.now()}`,
        source: 'website' as DataSource,
        type: 'pain_point' as DataPointType,
        content: `Transformation: ${this.uvpData.transformation}`,
        metadata: { uvpType: 'transformation', confidence: 1.0 },
        createdAt: new Date(this.uvpData.created_at)
      });
    }

    if (this.uvpData.unique_solution) {
      dataPoints.push({
        id: `uvp-solution-${Date.now()}`,
        source: 'website' as DataSource,
        type: 'competitive_gap' as DataPointType,
        content: `Unique Solution: ${this.uvpData.unique_solution}`,
        metadata: { uvpType: 'unique_solution', confidence: 1.0 },
        createdAt: new Date(this.uvpData.created_at)
      });
    }

    if (this.uvpData.key_benefit) {
      dataPoints.push({
        id: `uvp-benefit-${Date.now()}`,
        source: 'website' as DataSource,
        type: 'customer_trigger' as DataPointType,
        content: `Key Benefit: ${this.uvpData.key_benefit}`,
        metadata: { uvpType: 'key_benefit', confidence: 1.0 },
        createdAt: new Date(this.uvpData.created_at)
      });
    }

    if (this.uvpData.complete_statement) {
      dataPoints.push({
        id: `uvp-complete-${Date.now()}`,
        source: 'website' as DataSource,
        type: 'trending_topic' as DataPointType,
        content: this.uvpData.complete_statement,
        metadata: { uvpType: 'complete_uvp', confidence: 1.0 },
        createdAt: new Date(this.uvpData.created_at)
      });
    }

    return dataPoints;
  }

  /**
   * Load product catalog data from pm_products table
   * Products are used to generate product-specific content and match insights
   */
  private async loadProductCatalogData(): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];

    try {
      // Load products from pm_products table
      const { data: products, error } = await supabase
        .from('pm_products')
        .select('*')
        .eq('brand_id', this.brandData.id)
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .order('is_bestseller', { ascending: false })
        .limit(50);

      if (error) {
        console.log('[Streaming/products] Database error (table may not exist):', error.message);
        return dataPoints;
      }

      if (!products || products.length === 0) {
        console.log('[Streaming/products] No products found for brand:', this.brandData.id);
        return dataPoints;
      }

      console.log(`[Streaming/products] ====== PRODUCT CATALOG LOADED ======`);
      console.log(`[Streaming/products] Found ${products.length} active products`);

      // Store products for use by content synthesis
      this.productCatalog = products;

      // Convert products to data points for context
      for (const product of products) {
        // Product name and description as content
        const productContent = [
          `Product: ${product.name}`,
          product.description ? `Description: ${product.description}` : '',
          product.features?.length > 0 ? `Features: ${product.features.join(', ')}` : '',
          product.benefits?.length > 0 ? `Benefits: ${product.benefits.join(', ')}` : '',
          product.price ? `Price: ${product.price_display || product.price}` : '',
        ].filter(Boolean).join('\n');

        dataPoints.push({
          id: `product-${product.id}`,
          source: 'website' as DataSource,
          type: 'trending_topic' as DataPointType,
          content: productContent,
          metadata: {
            productId: product.id,
            productName: product.name,
            productType: product.is_service ? 'service' : 'product',
            isFeatured: product.is_featured,
            isBestseller: product.is_bestseller,
            isSeasonal: product.is_seasonal,
            category: product.category_id,
            tags: product.tags,
            confidence: 1.0,
          },
          createdAt: new Date(product.created_at)
        });

        // If product has specific features, add them as separate data points
        if (product.features && product.features.length > 0) {
          dataPoints.push({
            id: `product-features-${product.id}`,
            source: 'website' as DataSource,
            type: 'competitive_gap' as DataPointType,
            content: `${product.name} features: ${product.features.join(', ')}`,
            metadata: {
              productId: product.id,
              dataType: 'product_features',
              confidence: 1.0,
            },
            createdAt: new Date(product.created_at)
          });
        }

        // If product has benefits, add them for customer-focused content
        if (product.benefits && product.benefits.length > 0) {
          dataPoints.push({
            id: `product-benefits-${product.id}`,
            source: 'website' as DataSource,
            type: 'customer_trigger' as DataPointType,
            content: `${product.name} benefits: ${product.benefits.join(', ')}`,
            metadata: {
              productId: product.id,
              dataType: 'product_benefits',
              confidence: 1.0,
            },
            createdAt: new Date(product.created_at)
          });
        }
      }

      console.log(`[Streaming/products] Generated ${dataPoints.length} product data points`);
      console.log(`[Streaming/products] ===================================`);

    } catch (error) {
      console.error('[Streaming/products] Error loading products:', error);
    }

    return dataPoints;
  }

  /**
   * Tag data points with psychological metadata
   * Detects emotions, trigger categories, and urgency from content
   */
  private tagDataPointsWithPsychology(dataPoints: DataPoint[]): DataPoint[] {
    // Keyword patterns for psychological tagging
    const painKeywords = /frustrat|struggle|overwhelm|confus|stress|difficult|problem|issue|challeng|pain|headache|nightmare|hate|annoying|waste|fail|broken|expensive|slow|unreliable/i;
    const fearKeywords = /afraid|worry|risk|lose|miss|fail|danger|threat|concern|anxious|nervous|uncertain|scared/i;
    const aspirationKeywords = /want|desire|dream|goal|hope|wish|achieve|success|grow|improve|better|transform|ideal|perfect|amazing|best/i;
    const urgencyKeywords = /now|immediately|urgent|asap|today|quickly|fast|deadline|hurry|critical|emergency|limited time/i;
    const opportunityKeywords = /opportunity|chance|potential|possible|could|trending|rising|emerging|new|innovative/i;
    const socialProofKeywords = /everyone|people|others|recommend|trusted|proven|popular|leading|best-selling|rated/i;

    // Emotion detection patterns
    const emotionPatterns = {
      frustration: /frustrat|annoying|irritat|fed up|sick of|tired of/i,
      fear: /afraid|scared|worry|anxious|nervous|terrified/i,
      hope: /hope|optimistic|looking forward|excited about|can't wait/i,
      trust: /trust|reliable|depend|consistent|always/i,
      joy: /happy|delighted|thrilled|love|amazing|wonderful/i,
      anger: /angry|furious|outraged|unacceptable/i,
      sadness: /sad|disappointed|let down|upset/i,
      anticipation: /expect|anticipate|looking for|searching/i,
      relief: /finally|at last|relieved|solved/i,
      overwhelm: /overwhelm|too much|can't handle|drowning/i,
      confidence: /confident|certain|sure|know|clear/i,
    };

    return dataPoints.map(dp => {
      const content = dp.content.toLowerCase();
      const metadata = { ...dp.metadata };

      // Detect trigger category
      if (painKeywords.test(content)) {
        metadata.triggerCategory = 'pain_point';
      } else if (fearKeywords.test(content)) {
        metadata.triggerCategory = 'fear';
      } else if (aspirationKeywords.test(content)) {
        metadata.triggerCategory = 'aspiration';
      } else if (opportunityKeywords.test(content)) {
        metadata.triggerCategory = 'opportunity';
      } else if (socialProofKeywords.test(content)) {
        metadata.triggerCategory = 'social_proof';
      }

      // Detect urgency
      if (urgencyKeywords.test(content)) {
        metadata.urgency = 'immediate';
      } else if (/soon|this week|this month|planning|considering/i.test(content)) {
        metadata.urgency = 'soon';
      } else {
        metadata.urgency = 'eventual';
      }

      // Detect primary emotion
      for (const [emotion, pattern] of Object.entries(emotionPatterns)) {
        if (pattern.test(content)) {
          metadata.emotion = emotion;
          break;
        }
      }

      // Detect domain based on source and type
      if (dp.type === 'pain_point' || dp.type === 'unarticulated_need') {
        metadata.domain = 'psychology';
      } else if (dp.type === 'competitive_gap' || dp.source === 'semrush') {
        metadata.domain = 'competitive';
      } else if (dp.type === 'timing' || dp.source === 'weather' || dp.source === 'news') {
        metadata.domain = 'timing';
      } else if (dp.type === 'customer_trigger') {
        metadata.domain = 'search_intent';
      }

      // Match against UVP pain points if available
      if (this.uvpData?.transformation) {
        const uvpPain = this.uvpData.transformation.split('→')[0]?.trim().toLowerCase() || '';
        if (uvpPain && content.includes(uvpPain.substring(0, 20).toLowerCase())) {
          metadata.uvpMatch = 'transformation_pain';
        }
      }
      if (this.uvpData?.target_customer) {
        const targetTerms = this.uvpData.target_customer.toLowerCase().split(/\s+/).slice(0, 5);
        if (targetTerms.some((term: string) => term.length > 4 && content.includes(term))) {
          metadata.uvpMatch = metadata.uvpMatch ? `${metadata.uvpMatch},target_customer` : 'target_customer';
        }
      }

      return { ...dp, metadata };
    });
  }

  /**
   * Find correlated insights across data sources using TwoWayConnectionFinder
   * Returns high-value insights that are validated by multiple sources
   */
  private async findCorrelatedInsights(clusters: any[]): Promise<CorrelatedInsight[]> {
    const correlatedInsights: CorrelatedInsight[] = [];

    // Only process data points with embeddings
    const embeddedDataPoints = this.dataPoints.filter(dp => dp.embedding && dp.embedding.length > 0);

    if (embeddedDataPoints.length < 5) {
      console.log('[Streaming/correlation] Not enough embedded data points for correlation');
      return correlatedInsights;
    }

    console.log(`[Streaming/correlation] Finding connections among ${embeddedDataPoints.length} embedded data points...`);

    try {
      // Find two-way connections using the existing connection finder
      const candidates = this.connectionFinder.findConnections(embeddedDataPoints, {
        minSimilarity: 0.65, // Lower threshold to find more connections
        requireDifferentSources: true, // Must be from different APIs
        maxPerPair: 5 // Limit per source pair
      });

      console.log(`[Streaming/correlation] Found ${candidates.length} connection candidates`);

      // V3 FIX: Process ALL candidates - Atomizer handles dedup
      // Lowered score threshold from 60 to 40 to get more insights
      for (const candidate of candidates) {
        // Convert to Connection format and score it
        const connection = this.connectionFinder.toConnection(candidate, `conn-${Date.now()}-${Math.random().toString(36).substring(7)}`);
        const scoredConnection = this.connectionScorer.scoreConnection(connection, this.currentContext!);

        // V3 FIX: Lowered threshold from 60 to 40 - let Atomizer handle quality filtering
        if (scoredConnection.breakthroughPotential.score >= 40) {
          const insight = this.convertConnectionToCorrelatedInsight(scoredConnection, candidate);
          correlatedInsights.push(insight);
        }
      }

      // Also extract insights from clusters
      for (const cluster of clusters) {
        if (cluster.size >= 3 && cluster.coherence >= 0.7) {
          // This cluster represents a validated pattern
          const clusterInsight: CorrelatedInsight = {
            id: `cluster-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            type: 'hidden_pattern',
            title: cluster.theme || `Pattern: ${cluster.name}`,
            description: `${cluster.size} data points from ${cluster.sources?.length || 0} sources converge on this theme`,
            sources: (cluster.topItems || []).slice(0, 3).map((item: any) => ({
              source: item.source || 'unknown',
              content: item.content || item,
              confidence: cluster.coherence
            })),
            breakthroughScore: Math.round(cluster.coherence * 100),
            actionableInsight: `Create content around "${cluster.theme}" - validated by multiple sources`,
            timeSensitive: false
          };
          correlatedInsights.push(clusterInsight);
        }
      }

      // Sort by breakthrough score
      correlatedInsights.sort((a, b) => b.breakthroughScore - a.breakthroughScore);

      // V3 FIX: No slice limit - return ALL, Atomizer handles dedup
      console.log(`[Streaming/correlation] Generated ${correlatedInsights.length} correlated insights (no limit)`);
      return correlatedInsights;

    } catch (error) {
      console.error('[Streaming/correlation] Error finding correlations:', error);
      return correlatedInsights;
    }
  }

  /**
   * Convert a scored Connection to CorrelatedInsight format
   */
  private convertConnectionToCorrelatedInsight(
    connection: any,
    candidate: any
  ): CorrelatedInsight {
    const { primary, secondary } = connection.sources;
    const bp = connection.breakthroughPotential;

    // Determine insight type based on connection characteristics
    let type: CorrelatedInsight['type'] = 'hidden_pattern';
    if (primary.metadata?.domain === 'psychology' || secondary.metadata?.domain === 'psychology') {
      type = 'psychological_breakthrough';
    } else if (primary.metadata?.domain === 'competitive' || secondary.metadata?.domain === 'competitive') {
      type = 'competitive_gap';
    } else if (primary.metadata?.domain === 'timing' || secondary.metadata?.domain === 'timing') {
      type = 'timing_opportunity';
    } else if (primary.metadata?.uvpMatch || secondary.metadata?.uvpMatch) {
      type = 'validated_pain';
    }

    // Extract psychology metadata if available
    const psychology = primary.metadata?.triggerCategory || secondary.metadata?.triggerCategory
      ? {
          triggerCategory: primary.metadata?.triggerCategory || secondary.metadata?.triggerCategory || 'unknown',
          emotion: primary.metadata?.emotion || secondary.metadata?.emotion || 'neutral',
          urgency: primary.metadata?.urgency || secondary.metadata?.urgency || 'eventual'
        }
      : undefined;

    return {
      id: connection.id,
      type,
      title: bp.contentAngle || `${primary.source} + ${secondary.source} connection`,
      description: connection.relationship.explanation,
      uvpMatch: primary.metadata?.uvpMatch || secondary.metadata?.uvpMatch,
      sources: [
        {
          source: primary.source,
          content: primary.content.substring(0, 150),
          confidence: candidate.similarity
        },
        {
          source: secondary.source,
          content: secondary.content.substring(0, 150),
          confidence: candidate.similarity
        }
      ],
      psychology,
      breakthroughScore: bp.score,
      actionableInsight: bp.reasoning.join(' '),
      timeSensitive: bp.expectedImpact === 'high' || bp.expectedImpact === 'holy shit'
    };
  }

  /**
   * Generate UVP seed embeddings for pain point matching
   * These are used as CLUSTER CENTERS to attract similar data points
   * This is the key differentiator: UVP seeds the entire analysis
   */
  private async generateUVPSeedEmbeddings(): Promise<void> {
    console.log(`[Streaming/uvp-seeds] ========== GENERATING UVP SEED EMBEDDINGS ==========`);

    if (!this.uvpData) {
      console.warn(`[Streaming/uvp-seeds] ⚠️ NO UVP DATA - Cannot generate seed embeddings`);
      console.warn(`[Streaming/uvp-seeds] Clustering will use random centers instead of UVP pain points`);
      return;
    }

    console.log(`[Streaming/uvp-seeds] ✅ UVP data available:`, {
      target_customer: this.uvpData.target_customer ? 'YES' : 'NO',
      transformation: this.uvpData.transformation ? 'YES' : 'NO',
      unique_solution: this.uvpData.unique_solution ? 'YES' : 'NO',
      key_benefit: this.uvpData.key_benefit ? 'YES' : 'NO'
    });

    const painPointsWithCategories: { text: string; category: string }[] = [];

    // Extract pain points from UVP data with categories
    if (this.uvpData.transformation) {
      const beforeState = this.uvpData.transformation.split('→')[0]?.trim();
      if (beforeState) {
        painPointsWithCategories.push({ text: beforeState, category: 'transformation_pain' });
      }
      const afterState = this.uvpData.transformation.split('→')[1]?.trim();
      if (afterState) {
        painPointsWithCategories.push({ text: `Desire for ${afterState}`, category: 'transformation_goal' });
      }
    }
    if (this.uvpData.target_customer) {
      painPointsWithCategories.push({
        text: `Problems faced by ${this.uvpData.target_customer}`,
        category: 'target_customer'
      });
      // Also add the raw target customer for matching
      painPointsWithCategories.push({
        text: this.uvpData.target_customer,
        category: 'target_customer_raw'
      });
    }
    if (this.uvpData.unique_solution) {
      painPointsWithCategories.push({
        text: `Need for ${this.uvpData.unique_solution}`,
        category: 'unique_solution'
      });
    }
    if (this.uvpData.key_benefit) {
      painPointsWithCategories.push({
        text: `Desire for ${this.uvpData.key_benefit}`,
        category: 'key_benefit'
      });
    }

    // Generate embeddings for each pain point
    for (const { text, category } of painPointsWithCategories) {
      try {
        const embedding = await embeddingService.generateEmbedding(text);
        if (embedding && embedding.length > 0) {
          this.uvpSeedEmbeddings.push({ painPoint: text, embedding, category });
          // Initialize source validation counts for this pain point
          this.sourceValidationCounts.set(text, new Map());
        }
      } catch (error) {
        console.warn(`[Streaming] Failed to embed UVP pain point: ${text}`, error);
      }
    }

    if (this.uvpSeedEmbeddings.length > 0) {
      console.log(`[Streaming/uvp-seeds] ✅ Generated ${this.uvpSeedEmbeddings.length} UVP seed embeddings as cluster centers`);
      console.log(`[Streaming/uvp-seeds] Pain points that will seed clusters:`);
      this.uvpSeedEmbeddings.forEach((seed, i) => {
        console.log(`  ${i + 1}. [${seed.category}] ${seed.painPoint.substring(0, 60)}...`);
      });
    } else {
      console.warn(`[Streaming/uvp-seeds] ⚠️ No seed embeddings generated - check UVP data fields`);
    }
    console.log(`[Streaming/uvp-seeds] ========== UVP SEED EMBEDDINGS COMPLETE ==========`);
  }

  /**
   * Perform UVP-seeded clustering - clusters form AROUND UVP pain points
   * This is the core differentiator: data points are attracted to UVP seeds
   */
  private performUVPSeededClustering(dataPoints: DataPoint[]): any[] {
    const clusters: any[] = [];

    for (const seed of this.uvpSeedEmbeddings) {
      const clusterItems: DataPoint[] = [];
      const similarities: number[] = [];

      for (const dp of dataPoints) {
        if (!dp.embedding || dp.embedding.length === 0) continue;

        const similarity = embeddingService.cosineSimilarity(dp.embedding, seed.embedding);

        // Lower threshold (0.55) to capture more related content
        if (similarity >= 0.55) {
          clusterItems.push(dp);
          similarities.push(similarity);

          // Tag the data point with UVP match
          dp.metadata = {
            ...dp.metadata,
            uvpMatch: seed.painPoint,
            uvpMatchScore: similarity,
            uvpCategory: seed.category
          };
        }
      }

      if (clusterItems.length > 0) {
        // Calculate cluster coherence (average similarity)
        const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;

        // Get unique sources in this cluster
        const uniqueSources = new Set(clusterItems.map(item => item.source));

        clusters.push({
          id: `uvp-cluster-${seed.category}`,
          name: `UVP: ${seed.painPoint.substring(0, 50)}`,
          theme: seed.painPoint,
          uvpCategory: seed.category,
          isUVPSeeded: true,
          items: clusterItems,
          size: clusterItems.length,
          coherence: avgSimilarity,
          centroid: seed.embedding,
          sources: Array.from(uniqueSources),
          crossSourceCount: uniqueSources.size,
          topItems: clusterItems
            .map((item, idx) => ({ ...item, similarity: similarities[idx] }))
            .sort((a, b) => (b as any).similarity - (a as any).similarity)
            .slice(0, 10)
        });
      }
    }

    console.log(`[Streaming] UVP-seeded clustering: ${clusters.length} clusters with ${clusters.reduce((sum, c) => sum + c.size, 0)} total items`);
    return clusters;
  }

  /**
   * Count per-source validations for each UVP pain point
   * Output: "Google Reviews (12), YouTube (5), Perplexity (3)"
   */
  private countPerSourceValidations(dataPoints: DataPoint[]): void {
    for (const dp of dataPoints) {
      if (!dp.metadata?.uvpMatch) continue;

      const painPoint = dp.metadata.uvpMatch;
      const source = dp.source;

      if (!this.sourceValidationCounts.has(painPoint)) {
        this.sourceValidationCounts.set(painPoint, new Map());
      }

      const sourceCounts = this.sourceValidationCounts.get(painPoint)!;
      sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
    }

    // Log validation counts
    for (const [painPoint, sourceCounts] of this.sourceValidationCounts) {
      if (sourceCounts.size > 0) {
        const countStr = Array.from(sourceCounts.entries())
          .map(([src, count]) => `${src} (${count})`)
          .join(', ');
        console.log(`[Streaming] UVP "${painPoint.substring(0, 40)}..." validated by: ${countStr}`);
      }
    }
  }

  /**
   * Extract competitor mentions from reviews and comments
   * Tracks sentiment and mention count per competitor
   */
  private extractCompetitorMentions(dataPoints: DataPoint[]): void {
    // Get known competitors from brand data
    const knownCompetitors = this.brandData?.competitors || [];

    // Common competitor patterns (will detect competitor names in content)
    const competitorPatterns = [
      /(?:compared to|versus|vs\.?|better than|worse than|unlike|like)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/gi,
      /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+(?:is|was|has|had|doesn't|didn't|won't|can't)/gi,
      /(?:switched from|left|leaving|moved from|came from)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/gi,
    ];

    // Sentiment indicators
    const negativePatterns = /slow|expensive|terrible|awful|horrible|bad|worst|poor|frustrat|annoying|waste|never again|don't recommend|wouldn't recommend|overpriced|unreliable|unprofessional/i;
    const positivePatterns = /great|excellent|amazing|wonderful|best|love|recommend|professional|fast|quick|reliable|affordable|friendly/i;

    for (const dp of dataPoints) {
      // Only analyze reviews and comments
      if (!['outscraper', 'youtube', 'perplexity'].includes(dp.source)) continue;

      const content = dp.content;

      // Check known competitors
      for (const competitor of knownCompetitors) {
        if (content.toLowerCase().includes(competitor.toLowerCase())) {
          this.addCompetitorMention(competitor, content);
        }
      }

      // Extract mentioned competitors using patterns
      for (const pattern of competitorPatterns) {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          const competitorName = match[1]?.trim();
          if (competitorName && competitorName.length > 2 && competitorName.length < 30) {
            // Skip common false positives
            if (/^(I|We|They|The|This|That|My|Our|Your|It)$/i.test(competitorName)) continue;
            this.addCompetitorMention(competitorName, content);
          }
        }
      }
    }

    // Log competitor mentions
    for (const [competitor, data] of this.competitorMentions) {
      if (data.count >= 2) {
        console.log(`[Streaming] Competitor "${competitor}": ${data.count} mentions (${data.sentiment})`);
      }
    }
  }

  /**
   * Helper to add a competitor mention with sentiment analysis
   */
  private addCompetitorMention(competitor: string, content: string): void {
    const negativePatterns = /slow|expensive|terrible|awful|horrible|bad|worst|poor|frustrat|annoying|waste|never again|don't recommend|wouldn't recommend|overpriced|unreliable|unprofessional|problem|issue|complaint/i;
    const positivePatterns = /great|excellent|amazing|wonderful|best|love|recommend|professional|fast|quick|reliable|affordable|friendly|helpful/i;

    // Determine sentiment from surrounding context
    const contextWindow = 100;
    const competitorIndex = content.toLowerCase().indexOf(competitor.toLowerCase());
    const contextStart = Math.max(0, competitorIndex - contextWindow);
    const contextEnd = Math.min(content.length, competitorIndex + competitor.length + contextWindow);
    const context = content.substring(contextStart, contextEnd);

    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (negativePatterns.test(context)) {
      sentiment = 'negative';
    } else if (positivePatterns.test(context)) {
      sentiment = 'positive';
    }

    if (!this.competitorMentions.has(competitor)) {
      this.competitorMentions.set(competitor, { count: 0, sentiment, mentions: [] });
    }

    const data = this.competitorMentions.get(competitor)!;
    data.count++;
    data.mentions.push(context.substring(0, 150));

    // Update sentiment to most negative if any negative found
    if (sentiment === 'negative') {
      data.sentiment = 'negative';
    }
  }

  /**
   * Extract timing context from weather and news data points
   */
  private extractTimingContext(dataPoints: DataPoint[]): void {
    const events: string[] = [];
    let weatherContext = '';
    let seasonalContext = '';

    for (const dp of dataPoints) {
      // Weather data
      if (dp.source === 'weather') {
        weatherContext = dp.content;

        // Detect urgency from weather
        if (/hurricane|storm|flood|extreme|warning|alert/i.test(dp.content)) {
          this.timingContext.urgencyReason = 'Weather event creating urgency';
        }
      }

      // News data - extract events
      if (dp.source === 'news' || dp.source === 'serper') {
        const eventMatches = dp.content.match(/(?:upcoming|new|latest|breaking|announced)\s+([^.!?]+)/gi);
        if (eventMatches) {
          events.push(...eventMatches.map(e => e.trim().substring(0, 100)));
        }
      }

      // Detect seasonal context
      const seasonalKeywords = {
        'holiday season': /holiday|christmas|thanksgiving|new year|black friday|cyber monday/i,
        'summer season': /summer|vacation|travel|outdoor|beach/i,
        'back-to-school': /back.?to.?school|school|student|education|fall semester/i,
        'tax season': /tax|irs|filing|refund|april/i,
        'wedding season': /wedding|bride|groom|engaged|marriage/i,
        'home buying season': /spring market|home buying|real estate|moving/i,
      };

      for (const [season, pattern] of Object.entries(seasonalKeywords)) {
        if (pattern.test(dp.content)) {
          seasonalContext = season;
          break;
        }
      }
    }

    this.timingContext = {
      season: seasonalContext || this.detectCurrentSeason(),
      events: events.slice(0, 5),
      weather: weatherContext,
      urgencyReason: this.timingContext.urgencyReason
    };

    console.log(`[Streaming] Timing context: ${this.timingContext.season || 'general'}, ${events.length} events detected`);
  }

  /**
   * Helper to detect current season
   */
  private detectCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring season';
    if (month >= 5 && month <= 7) return 'summer season';
    if (month >= 8 && month <= 10) return 'fall season';
    return 'winter/holiday season';
  }

  /**
   * Find UVP match for a data point by comparing embeddings
   */
  private findUVPMatch(dp: DataPoint): { painPoint: string; score: number; category: string } | null {
    if (!dp.embedding || dp.embedding.length === 0 || this.uvpSeedEmbeddings.length === 0) {
      return null;
    }

    let bestMatch: { painPoint: string; score: number; category: string } | null = null;

    for (const seed of this.uvpSeedEmbeddings) {
      const similarity = embeddingService.cosineSimilarity(dp.embedding, seed.embedding);
      if (similarity >= 0.55 && (!bestMatch || similarity > bestMatch.score)) {
        bestMatch = { painPoint: seed.painPoint, score: similarity, category: seed.category };
      }
    }

    return bestMatch;
  }

  /**
   * Get formatted validation string for a UVP pain point
   * Format: "Google Reviews (12), YouTube (5), Perplexity (3)"
   */
  private getValidationString(painPoint: string): string {
    const sourceCounts = this.sourceValidationCounts.get(painPoint);
    if (!sourceCounts || sourceCounts.size === 0) return '';

    return Array.from(sourceCounts.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .map(([source, count]) => {
        // Format source names nicely
        const formattedSource = source === 'outscraper' ? 'Google Reviews' :
                               source === 'serper' ? 'Google Search' :
                               source === 'youtube' ? 'YouTube' :
                               source === 'semrush' ? 'SEMrush' :
                               source.charAt(0).toUpperCase() + source.slice(1);
        return `${formattedSource} (${count})`;
      })
      .join(', ');
  }

  /**
   * Get top competitor gaps for breakthrough narrative
   */
  private getCompetitorGaps(): { competitor: string; count: number; sentiment: string; sample: string }[] {
    const gaps: { competitor: string; count: number; sentiment: string; sample: string }[] = [];

    for (const [competitor, data] of this.competitorMentions) {
      if (data.count >= 2 && data.sentiment === 'negative') {
        gaps.push({
          competitor,
          count: data.count,
          sentiment: data.sentiment,
          sample: data.mentions[0] || ''
        });
      }
    }

    return gaps.sort((a, b) => b.count - a.count).slice(0, 3);
  }

  /**
   * Get search volume data for a topic from semrush data points
   */
  private getSearchVolumeForTopic(topic: string): { volume: number; trend: string } | null {
    const semrushData = this.dataPoints.filter(dp => dp.source === 'semrush');

    for (const dp of semrushData) {
      const content = dp.content.toLowerCase();
      const topicLower = topic.toLowerCase().substring(0, 30);

      if (content.includes(topicLower) || topicLower.split(' ').some(word => word.length > 4 && content.includes(word))) {
        // Extract search volume from content like "Keyword opportunity: "xyz" (1500 searches/mo)"
        const volumeMatch = dp.content.match(/(\d+(?:,\d+)?)\s*searches/i);
        if (volumeMatch) {
          const volume = parseInt(volumeMatch[1].replace(',', ''));
          return { volume, trend: volume > 1000 ? '+trending' : 'stable' };
        }
      }
    }

    return null;
  }

  /**
   * Convert connections from discovery service to CorrelatedInsights with UVP matching
   */
  private async convertConnectionsToCorrelatedInsights(connections: any[]): Promise<CorrelatedInsight[]> {
    const insights: CorrelatedInsight[] = [];

    // PERFORMANCE FIX: Limit to prevent freeze (connections already sorted by score from allConnections)
    const MAX_CONVERT = 300;
    const limitedConnections = connections.slice(0, MAX_CONVERT);
    console.log(`[Streaming] PERFORMANCE: Converting ${limitedConnections.length} of ${connections.length} connections to insights`);

    for (const conn of limitedConnections) {

      // Check for UVP matches across all data points in connection
      const uvpMatches: string[] = [];
      for (const dp of conn.dataPoints) {
        const match = this.findUVPMatch(dp);
        if (match) {
          uvpMatches.push(match.painPoint);
          dp.metadata = { ...dp.metadata, uvpMatch: match.painPoint };
        }
      }

      // Determine type based on connection characteristics
      let type: CorrelatedInsight['type'] = 'hidden_pattern';
      const hasPsychology = conn.dataPoints.some((dp: DataPoint) => dp.metadata?.domain === 'psychology');
      const hasCompetitive = conn.dataPoints.some((dp: DataPoint) => dp.metadata?.domain === 'competitive');
      const hasTiming = conn.dataPoints.some((dp: DataPoint) => dp.metadata?.domain === 'timing');

      if (uvpMatches.length > 0) {
        type = 'validated_pain';
      } else if (hasPsychology && (hasTiming || hasCompetitive)) {
        type = 'psychological_breakthrough';
      } else if (hasCompetitive) {
        type = 'competitive_gap';
      } else if (hasTiming) {
        type = 'timing_opportunity';
      }

      // Build psychology metadata
      const triggerCategories = conn.dataPoints.map((dp: DataPoint) => dp.metadata?.triggerCategory).filter(Boolean);
      const emotions = conn.dataPoints.map((dp: DataPoint) => dp.metadata?.emotion).filter(Boolean);
      const urgencies = conn.dataPoints.map((dp: DataPoint) => dp.metadata?.urgency).filter(Boolean);

      // Generate a meaningful title from actual content, not generic angle
      let title = conn.angle;
      if (!title || title.includes('meets') || title.includes('→')) {
        // Extract title from best data point content
        const bestContent = conn.dataPoints
          .map((dp: DataPoint) => dp.content)
          .filter((c: string) => c && c.length > 30)
          .sort((a: string, b: string) => b.length - a.length)[0];
        if (bestContent) {
          const words = bestContent.split(/\s+/);
          title = words.slice(0, 10).join(' ');
        } else {
          title = `${conn.connectionType} Insight`;
        }
      }

      // V3 FIX: NO TITLE DEDUP - Atomizer handles ALL deduplication

      insights.push({
        id: conn.id,
        type,
        title,
        description: conn.reasoning,
        uvpMatch: uvpMatches.length > 0 ? uvpMatches[0] : undefined,
        sources: conn.dataPoints.map((dp: DataPoint) => ({
          source: dp.source,
          content: dp.content.substring(0, 150),
          confidence: conn.breakthroughScore / 100
        })),
        psychology: triggerCategories.length > 0 ? {
          triggerCategory: triggerCategories[0],
          emotion: emotions[0] || 'neutral',
          urgency: urgencies[0] || 'eventual'
        } : undefined,
        breakthroughScore: conn.breakthroughScore,
        actionableInsight: `Create content around: "${title}"`,
        timeSensitive: conn.timingRelevance > 0.5
      });
    }

    console.log(`[Streaming] Converted ${connections.length} connections → ${insights.length} correlations (no dedup)`);
    // V3: Return all - Atomizer handles dedup
    return insights.sort((a, b) => b.breakthroughScore - a.breakthroughScore);
  }

  /**
   * Generate rich breakthrough opportunities with full narrative
   * This creates the "holy shit" moments per the plan:
   *
   * "BREAKTHROUGH Opportunity (Score: 87)
   * - Your UVP Match: 'Frustration-free quoting' directly addresses this
   * - Validated by: Google Search (+320%), Reddit (4 posts), Reviews (12 mentions)
   * - Timing: Hurricane season creates urgency for insurance decisions
   * - Psychology: Targets fear of paperwork + desire for instant gratification
   * - Competitor Gap: State Farm's 48-hour quote process mentioned negatively 3x
   * - Action: Create 'Get Quoted in 60 Seconds' campaign NOW"
   */
  private async generateBreakthroughOpportunities(
    rawBreakthroughs: any[],
    clusters: any[]
  ): Promise<BreakthroughOpportunity[]> {
    const opportunities: BreakthroughOpportunity[] = [];
    const competitorGaps = this.getCompetitorGaps();

    // V2: Get business segment for dimension tagging
    const segment = this.getBusinessSegment();
    console.log(`[Streaming] V2: Using segment '${segment}' for dimension tagging`);

    // V3: Batch generate AI titles for all connections BEFORE processing
    // This populates the cache so generateTitleWithHook returns AI titles
    // V3 FIX: No slice limit - process ALL connections
    const connections = rawBreakthroughs
      .map(bt => bt.connections?.[0])
      .filter(Boolean);

    // V3 PARALLEL: Start AI title generation in background - don't await yet
    let aiTitlePromise: Promise<void> | null = null;
    if (connections.length > 0) {
      console.log(`[Streaming] V3: Starting parallel AI title generation for ${connections.length} connections...`);
      const brandContext = {
        name: this.currentContext?.brandProfile?.name || 'the business',
        uvp: this.currentContext?.brandProfile?.uvpElements?.transformation || '',
        industry: this.currentContext?.brandProfile?.industry || 'their industry'
      };
      // Start but don't await - will complete in parallel with opportunity creation
      aiTitlePromise = connectionDiscoveryService.batchGenerateAITitles(connections, brandContext);
    }

    // V2: Track dimension distribution for variety enforcement (with pillar + persona)
    const dimensionCounts = {
      journeyStage: new Map<string, number>(),
      emotion: new Map<string, number>(),
      format: new Map<string, number>(),
      hookFormula: new Map<string, number>(),
      pillar: new Map<string, number>(),
      persona: new Map<string, number>()
    };
    const combinedHashes = new Set<string>();
    const dimensionSignatures = new Set<string>(); // Track unique dimension combos
    let lastHookFormulas: string[] = [];

    // V3 FIX: NO DIMENSION CAPS HERE - Atomizer handles all variety enforcement
    // This function just enriches breakthroughs with metadata, doesn't filter
    // Atomizer will create 8 formats × 4 stages and enforce its own caps

    // Process ALL raw breakthroughs - let Atomizer handle variety
    for (const bt of rawBreakthroughs) {
      const conn = bt.connections?.[0];
      if (!conn) continue;

      // V3 FIX: NO DEDUP - Atomizer handles ALL deduplication
      // Just tag dimensions for metadata enrichment
      let dimensions: InsightDimensions | undefined;
      try {
        dimensions = connectionDiscoveryService.tagDimensions(conn, segment);

        // Track dimension distribution for logging only
        dimensionCounts.journeyStage.set(dimensions.journeyStage, (dimensionCounts.journeyStage.get(dimensions.journeyStage) || 0) + 1);
        dimensionCounts.emotion.set(dimensions.emotion, (dimensionCounts.emotion.get(dimensions.emotion) || 0) + 1);
        dimensionCounts.format.set(dimensions.format, (dimensionCounts.format.get(dimensions.format) || 0) + 1);
        dimensionCounts.hookFormula.set(dimensions.hookFormula, (dimensionCounts.hookFormula.get(dimensions.hookFormula) || 0) + 1);
        if (dimensions.pillar) dimensionCounts.pillar.set(dimensions.pillar, (dimensionCounts.pillar.get(dimensions.pillar) || 0) + 1);
        if (dimensions.persona) dimensionCounts.persona.set(dimensions.persona, (dimensionCounts.persona.get(dimensions.persona) || 0) + 1);

        // Track unique dimension signatures for variety metrics
        const dimSignature = `${dimensions.journeyStage}-${dimensions.emotion}-${dimensions.format}-${dimensions.pillar}`;
        dimensionSignatures.add(dimSignature);
      } catch (e) {
        // Fallback if dimension tagging fails - still process the breakthrough
      }

      // V2: Generate title using rotated hook formula (ALWAYS use hook formula when dimensions are available)
      let title = '';
      if (dimensions) {
        try {
          title = connectionDiscoveryService.generateTitleWithHook(conn, dimensions.hookFormula);
        } catch (e) {
          console.warn('[Streaming] Hook title generation failed, using fallback');
        }
      }
      // Only use raw title/angle as last resort
      if (!title || title.length < 10) {
        title = bt.title || conn.angle || 'Strategic Opportunity';
      }

      // Find UVP validation with per-source counts
      let uvpValidation: BreakthroughOpportunity['uvpValidation'] | undefined;
      let bestUVPMatch: { painPoint: string; score: number; category: string } | null = null;

      for (const dp of conn.dataPoints || []) {
        const match = this.findUVPMatch(dp);
        if (match && (!bestUVPMatch || match.score > bestUVPMatch.score)) {
          bestUVPMatch = match;
        }
      }

      if (bestUVPMatch) {
        // Get per-source validation string: "Google Reviews (12), YouTube (5)"
        const validationStr = this.getValidationString(bestUVPMatch.painPoint);

        // Collect evidence from matching data points
        const matchingEvidence: string[] = [];
        for (const dp of conn.dataPoints || []) {
          if (dp.metadata?.uvpMatch === bestUVPMatch.painPoint) {
            matchingEvidence.push(`${dp.source}: "${dp.content.substring(0, 80)}..."`);
          }
        }

        uvpValidation = {
          painPoint: bestUVPMatch.painPoint,
          matchScore: Math.round(bestUVPMatch.score * 100),
          evidence: [
            validationStr ? `Validated by: ${validationStr}` : '',
            ...matchingEvidence.slice(0, 3)
          ].filter(Boolean)
        };
      }

      // Determine psychology with rich detail
      const triggerCategory = conn.dataPoints?.find((dp: DataPoint) => dp.metadata?.triggerCategory)?.metadata?.triggerCategory || 'opportunity';
      const emotion = conn.dataPoints?.find((dp: DataPoint) => dp.metadata?.emotion)?.metadata?.emotion || 'anticipation';

      // Map trigger categories to user-friendly labels
      const triggerLabels: Record<string, string> = {
        'pain_point': 'pain point',
        'fear': 'fear',
        'aspiration': 'aspiration',
        'opportunity': 'opportunity',
        'social_proof': 'social proof',
        'urgency': 'urgency'
      };

      // Calculate EQ score (emotional quotient)
      const emotionalCount = conn.dataPoints?.filter((dp: DataPoint) =>
        dp.metadata?.domain === 'psychology' ||
        dp.metadata?.triggerCategory === 'pain_point' ||
        dp.metadata?.triggerCategory === 'fear'
      ).length || 0;
      const eqScore = Math.min(100, 50 + (emotionalCount * 15) + (conn.emotionalIntensity || 0) * 30);

      // Confidence stars based on source count and score
      const uniqueSources = new Set(conn.dataPoints?.map((dp: DataPoint) => dp.source) || []);
      const sourceCount = uniqueSources.size;
      const confidenceStars = Math.min(5, Math.max(1, Math.ceil(sourceCount * (bt.score / 100) * 2.5))) as 1 | 2 | 3 | 4 | 5;

      // Build timing context
      let timingData: BreakthroughOpportunity['timing'] | undefined;
      const hasTimingData = conn.dataPoints?.some((dp: DataPoint) =>
        dp.metadata?.domain === 'timing' || dp.source === 'weather' || dp.source === 'news'
      );

      if (hasTimingData || this.timingContext.urgencyReason || this.timingContext.season) {
        timingData = {
          isTimeSensitive: true,
          reason: this.timingContext.urgencyReason ||
                  (this.timingContext.season ? `${this.timingContext.season} creates urgency` : undefined),
          deadline: this.timingContext.events?.[0]
        };
      }

      // Build competitor gap context
      let competitiveData: BreakthroughOpportunity['competitive'] | undefined;
      if (competitorGaps.length > 0) {
        const topGap = competitorGaps[0];
        competitiveData = {
          gap: `${topGap.competitor}'s weakness mentioned negatively ${topGap.count}x`,
          competitors: competitorGaps.map(g => g.competitor)
        };
      } else if (conn.dataPoints?.some((dp: DataPoint) => dp.metadata?.domain === 'competitive')) {
        competitiveData = {
          gap: 'Competitor blind spot detected in market data',
          competitors: []
        };
      }

      // Get search volume if available
      const searchVolume = this.getSearchVolumeForTopic(bt.title || conn.angle || '');

      // Generate RICH action plan narrative
      const actionParts: string[] = [];

      // UVP Match line
      if (uvpValidation) {
        actionParts.push(`✓ Your UVP '${uvpValidation.painPoint.substring(0, 50)}' directly addresses this (${uvpValidation.matchScore}% match)`);
      }

      // Validation line with source counts
      if (uvpValidation?.evidence?.[0]) {
        actionParts.push(uvpValidation.evidence[0]);
      } else {
        actionParts.push(`Validated by: ${Array.from(uniqueSources).join(', ')} (${sourceCount} independent sources)`);
      }

      // Search volume line
      if (searchVolume) {
        actionParts.push(`Search volume: ${searchVolume.volume.toLocaleString()} searches/mo (${searchVolume.trend})`);
      }

      // Timing line
      if (timingData?.reason) {
        actionParts.push(`⏰ Timing: ${timingData.reason}`);
      }

      // Psychology line
      const triggerLabel = triggerLabels[triggerCategory] || triggerCategory;
      actionParts.push(`Psychology: Targets ${triggerLabel} + ${emotion} emotional response`);

      // Competitor gap line
      if (competitiveData?.gap) {
        actionParts.push(`🎯 Competitor Gap: ${competitiveData.gap}`);
      }

      // Action line - use V2 title if available
      const urgencyWord = bt.urgency === 'critical' ? 'IMMEDIATELY' :
                          bt.urgency === 'high' ? 'NOW' :
                          'this week';
      actionParts.push(`→ Action: Create '${title}' campaign ${urgencyWord}`);

      // V2: Add dimension-based context to action plan
      if (dimensions) {
        actionParts.push(`📊 Insight Profile: ${dimensions.journeyStage} stage | ${dimensions.emotion} trigger | ${dimensions.format} format`);
        if (dimensions.cta) {
          const ctaLabels: Record<string, string> = {
            'CTA_CALL': 'Call Now',
            'CTA_BOOK': 'Book Appointment',
            'CTA_VISIT': 'Visit Location',
            'CTA_DEMO': 'Request Demo',
            'CTA_TRIAL': 'Start Free Trial',
            'CTA_CONSULT': 'Schedule Consultation',
            'CTA_DOWNLOAD': 'Download Guide',
            'CTA_PRICING': 'Get Pricing',
            'CTA_WEBINAR': 'Register for Webinar',
            'CTA_ASSESS': 'Get Assessment'
          };
          actionParts.push(`🎯 Recommended CTA: ${ctaLabels[dimensions.cta] || dimensions.cta}`);
        }
      }

      const actionPlan = actionParts.join('\n');

      opportunities.push({
        id: bt.id,
        title,  // V2: Use hook-formula generated title
        hook: bt.hook || `${sourceCount}-source breakthrough: ${conn.angle}`,
        score: bt.score,
        connectionType: conn.connectionType || '2-way',
        sources: Array.from(uniqueSources) as string[],
        uvpValidation,
        psychology: {
          triggerCategory: dimensions?.emotion?.toLowerCase() || triggerCategory,
          emotion: dimensions?.emotion?.toLowerCase() || emotion,
          urgency: bt.urgency || 'medium'
        },
        timing: timingData,
        competitive: competitiveData,
        actionPlan,
        eqScore: Math.round(eqScore),
        confidenceStars
      });
    }

    // Also generate breakthroughs from UVP-seeded clusters
    // V3 FIX: NO SLICE - process ALL UVP clusters, let downstream handle variety
    const uvpClusters = clusters.filter(c => c.isUVPSeeded && c.crossSourceCount >= 2);
    for (const cluster of uvpClusters) {
      // Skip if we already have a breakthrough for this UVP
      if (opportunities.some(o => o.uvpValidation?.painPoint === cluster.theme)) continue;

      const validationStr = this.getValidationString(cluster.theme);
      const searchVolume = this.getSearchVolumeForTopic(cluster.theme);

      const actionParts: string[] = [];
      actionParts.push(`✓ Your UVP '${cluster.theme.substring(0, 50)}' validated by ${cluster.crossSourceCount} sources`);
      if (validationStr) actionParts.push(`Validated by: ${validationStr}`);
      if (searchVolume) actionParts.push(`Search volume: ${searchVolume.volume.toLocaleString()} searches/mo`);
      if (this.timingContext.season) actionParts.push(`⏰ Timing: ${this.timingContext.season} relevance`);
      actionParts.push(`→ Action: Create content addressing '${cluster.theme.substring(0, 40)}'`);

      opportunities.push({
        id: `uvp-bt-${cluster.id}`,
        title: `UVP Validated: ${cluster.theme.substring(0, 60)}`,
        hook: `${cluster.crossSourceCount} independent sources confirm your UVP addresses a real market need`,
        score: Math.round(cluster.coherence * 100),
        connectionType: cluster.crossSourceCount >= 4 ? '4-way' : cluster.crossSourceCount >= 3 ? '3-way' : '2-way',
        sources: cluster.sources || [],
        uvpValidation: {
          painPoint: cluster.theme,
          matchScore: Math.round(cluster.coherence * 100),
          evidence: validationStr ? [`Validated by: ${validationStr}`] : []
        },
        psychology: {
          triggerCategory: 'pain_point',
          emotion: 'frustration',
          urgency: 'medium'
        },
        timing: this.timingContext.season ? {
          isTimeSensitive: false,
          reason: this.timingContext.season
        } : undefined,
        competitive: competitorGaps.length > 0 ? {
          gap: `${competitorGaps[0].competitor} weakness opportunity`,
          competitors: competitorGaps.map(g => g.competitor)
        } : undefined,
        actionPlan: actionParts.join('\n'),
        eqScore: Math.round(cluster.coherence * 80),
        confidenceStars: Math.min(5, cluster.crossSourceCount) as 1 | 2 | 3 | 4 | 5
      });
    }

    // V2: Log variety distribution
    console.log(`[Streaming] V2 Variety Distribution:`);
    console.log(`  Journey Stages: ${Array.from(dimensionCounts.journeyStage.entries()).map(([k, v]) => `${k}(${v})`).join(', ')}`);
    console.log(`  Emotions: ${Array.from(dimensionCounts.emotion.entries()).map(([k, v]) => `${k}(${v})`).join(', ')}`);
    console.log(`  Formats: ${Array.from(dimensionCounts.format.entries()).map(([k, v]) => `${k}(${v})`).join(', ')}`);
    console.log(`  Hook Formulas: ${Array.from(dimensionCounts.hookFormula.entries()).map(([k, v]) => `${k}(${v})`).join(', ')}`);
    console.log(`  Unique Combinations: ${dimensionSignatures.size}`);

    // =========================================================================
    // V3: FULL V1 PIPELINE INTEGRATION (PARALLEL)
    // SynapseGenerator + AI Titles run in parallel, then apply frameworks
    // =========================================================================

    // V3 PARALLEL: Wait for AI titles to complete (was running in parallel with loop above)
    if (aiTitlePromise) {
      console.log('[Streaming] V3: Waiting for parallel AI title generation to complete...');
      await aiTitlePromise;
      console.log('[Streaming] V3: AI title generation complete');
    }

    // V3.1: Run SynapseGenerator for AI-synthesized titles (top 30 connections)
    let synapseEnhanced = false;
    try {
      // Skip if currentContext not available
      if (!this.currentContext) {
        console.log('[Streaming] V3.1: Skipping SynapseGenerator - currentContext not available');
        throw new Error('currentContext not available');
      }

      const synapseInput: SynapseInput = {
        business: {
          name: this.currentContext?.brandProfile?.name || 'Business',
          industry: this.currentContext?.brandProfile?.industry || 'general',
          location: {
            city: this.currentContext?.brandProfile?.location?.city || '',
            state: this.currentContext?.brandProfile?.location?.state || ''
          }
        },
        intelligence: this.currentContext,
        detailedDataPoints: this.dataPoints.slice(0, 50) // Top 50 data points for provenance
      };

      console.log('[Streaming] V3.1: Running SynapseGenerator for AI synthesis...');
      const synapseResult = await generateSynapses(synapseInput);

      if (synapseResult.synapses.length > 0) {
        console.log(`[Streaming] V3.1: SynapseGenerator produced ${synapseResult.synapses.length} AI-synthesized insights`);

        // Enhance top opportunities with SynapseGenerator output
        for (let i = 0; i < Math.min(synapseResult.synapses.length, opportunities.length); i++) {
          const synapse = synapseResult.synapses[i];
          const opp = opportunities[i];

          // Replace with AI-synthesized content if available
          if (synapse.title && synapse.title.length > 10) {
            opp.title = synapse.title;
          }
          if (synapse.insight && synapse.insight.length > 10) {
            opp.hook = synapse.insight;
          }
          if (synapse.callToAction) {
            opp.actionPlan = opp.actionPlan + `\n🎯 AI Recommended CTA: ${synapse.callToAction}`;
          }
          // Add provenance from Synapse
          if (synapse.deepProvenance) {
            (opp as any).provenance = synapse.deepProvenance;
          }
        }
        synapseEnhanced = true;
      }
    } catch (error) {
      console.error('[Streaming] V3.1: SynapseGenerator error:', error);
      // Continue with template-based content - don't block pipeline
    }

    // V3.2: Apply ContentFrameworkLibrary for framework selection
    try {
      console.log('[Streaming] V3.2: Applying ContentFrameworkLibrary...');

      for (const opp of opportunities) {
        // Build a mock insight for framework selection
        const mockInsight = {
          type: opp.psychology?.triggerCategory === 'pain_point' ? 'counter_intuitive' :
                opp.psychology?.triggerCategory === 'aspiration' ? 'predictive_opportunity' : 'deep_psychology'
        } as any;

        // Select framework based on insight type and journey stage
        const journeyStage = (opp as any).dimensions?.journeyStage || 'awareness';
        const framework = frameworkLibrary.selectFramework(mockInsight, 'social', 'conversion');

        // Add framework to opportunity
        (opp as any).framework = {
          id: framework.id,
          name: framework.name,
          stages: framework.stages.map(s => s.name)
        };
      }
    } catch (error) {
      console.warn('[Streaming] V3.2: ContentFrameworkLibrary failed:', error);
    }

    // V3.3: Apply ContentSynthesisOrchestrator for EQ-weighted scoring
    try {
      console.log('[Streaming] V3.3: Applying ContentSynthesisOrchestrator...');

      const orchestratorSegment: OrchestratorSegment =
        segment === 'SMB_LOCAL' ? 'smb_local' :
        segment === 'SMB_REGIONAL' ? 'smb_regional' :
        segment === 'B2B_NATIONAL' ? 'b2b_national' : 'b2b_global';

      const enrichedContext = await contentSynthesisOrchestrator.buildEnrichedContext({
        brandName: this.currentContext?.brandProfile?.name || 'Business',
        industry: this.currentContext?.brandProfile?.industry || 'general',
        naicsCode: this.currentContext?.brandProfile?.naicsCode,
        uvpData: {
          target_customer: this.currentContext?.brandProfile?.uvpElements?.targetCustomer,
          key_benefit: this.currentContext?.brandProfile?.uvpElements?.keyBenefit,
          transformation: this.currentContext?.brandProfile?.uvpElements?.transformation
        },
        segment: orchestratorSegment
      });

      // Score and re-rank opportunities
      const scoredOpportunities = opportunities.map(opp => {
        const mockSynthesized = {
          id: opp.id,
          title: opp.title,
          hook: opp.hook,
          psychology: { triggerType: opp.psychology?.triggerCategory },
          dimensions: (opp as any).dimensions,
          scores: { breakthrough: opp.score }
        } as any;

        const eqAlignment = this.calculateEQAlignmentScore(mockSynthesized, enrichedContext);
        const industryRelevance = this.calculateIndustryRelevanceScore(mockSynthesized, enrichedContext);
        const segmentFit = this.calculateSegmentFitScore(mockSynthesized, enrichedContext);

        // Apply EQ weighting to final score
        const emotionalWeight = enrichedContext.eqProfile.emotional_weight / 100;
        const boostedScore = opp.score * (1 + (eqAlignment / 100) * emotionalWeight * 0.3);

        return {
          ...opp,
          score: Math.round(boostedScore),
          eqScore: Math.round((opp.eqScore || 50) * (1 + eqAlignment / 200)),
          orchestratorScores: { eqAlignment, industryRelevance, segmentFit }
        };
      });

      // Re-sort by boosted score
      scoredOpportunities.sort((a, b) => b.score - a.score);

      console.log(`[Streaming] V3.3: Orchestrator applied EQ/Industry/Segment scoring to ${scoredOpportunities.length} opportunities`);

      return scoredOpportunities;
    } catch (error) {
      console.warn('[Streaming] V3.3: ContentSynthesisOrchestrator failed:', error);
    }

    return opportunities.sort((a, b) => b.score - a.score);
  }

  // V3: EQ alignment scoring helper
  private calculateEQAlignmentScore(insight: any, context: EnrichedContext): number {
    const trigger = (insight.psychology?.triggerType || '').toLowerCase();
    const weights = context.eqWeights;

    if (trigger.includes('fear') || trigger.includes('pain') || trigger.includes('risk')) {
      return weights.fear;
    } else if (trigger.includes('aspiration') || trigger.includes('desire')) {
      return weights.aspiration;
    } else if (trigger.includes('trust') || trigger.includes('proof')) {
      return weights.trust;
    } else if (trigger.includes('urgent') || trigger.includes('now')) {
      return weights.urgency;
    } else if (trigger.includes('logic') || trigger.includes('roi')) {
      return weights.logic;
    }
    return 50;
  }

  // V3: Industry relevance scoring helper
  private calculateIndustryRelevanceScore(insight: any, context: EnrichedContext): number {
    if (!context.industryProfile) return 50;

    const content = ((insight.title || '') + ' ' + (insight.hook || '')).toLowerCase();
    let score = 50;

    const powerWords = context.industryProfile.power_words || [];
    const matches = powerWords.filter((w: string) => content.includes(w.toLowerCase())).length;
    score += Math.min(30, matches * 6);

    const avoidWords = context.industryProfile.avoid_words || [];
    const avoidMatches = avoidWords.filter((w: string) => content.includes(w.toLowerCase())).length;
    score -= avoidMatches * 10;

    return Math.max(0, Math.min(100, score));
  }

  // V3: Segment fit scoring helper
  private calculateSegmentFitScore(insight: any, context: EnrichedContext): number {
    const content = ((insight.title || '') + ' ' + (insight.hook || '')).toLowerCase();
    const guidelines = context.segmentGuidelines;
    let score = 50;

    const languageMatches = guidelines.language.filter((t: string) => content.includes(t.toLowerCase())).length;
    score += languageMatches * 8;

    const avoidMatches = guidelines.avoidAreas.filter((a: string) => content.includes(a.toLowerCase())).length;
    score -= avoidMatches * 15;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Map clusters to UVP pain points and count cross-source confirmations
   */
  private mapClustersToUVP(clusters: any[]): any[] {
    return clusters.map(cluster => {
      // Find UVP match for cluster theme
      let uvpMatch: string | undefined;
      let bestMatchScore = 0;

      if (this.uvpSeedEmbeddings.length > 0 && cluster.centroid) {
        for (const seed of this.uvpSeedEmbeddings) {
          const similarity = embeddingService.cosineSimilarity(cluster.centroid, seed.embedding);
          if (similarity > 0.6 && similarity > bestMatchScore) {
            uvpMatch = seed.painPoint;
            bestMatchScore = similarity;
          }
        }
      }

      // Count unique sources in cluster
      const uniqueSources = new Set(cluster.items?.map((item: any) => item.source) || []);
      const crossSourceCount = uniqueSources.size;

      return {
        ...cluster,
        uvpMatch,
        uvpMatchScore: bestMatchScore,
        crossSourceCount,
        sources: Array.from(uniqueSources)
      };
    });
  }

  /**
   * Calculate correlation score for a data point (how many sources confirm it)
   */
  private calculateDataPointCorrelationScore(dp: DataPoint): number {
    if (!dp.embedding || dp.embedding.length === 0) return 0;

    let matchCount = 0;
    for (const other of this.dataPoints) {
      if (other.id === dp.id || other.source === dp.source) continue;
      if (!other.embedding || other.embedding.length === 0) continue;

      const similarity = embeddingService.cosineSimilarity(dp.embedding, other.embedding);
      if (similarity >= 0.7) {
        matchCount++;
      }
    }

    return Math.min(5, matchCount); // Max 5 correlations
  }

  /**
   * Load industry benchmarks for NAICS code/industry
   * Provides context for performance expectations and competitive positioning
   */
  private async loadIndustryBenchmarks(): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];

    try {
      const industry = this.brandData?.industry || 'general';
      const benchmarkResult = this.benchmarkDb.getBenchmarks(industry);

      if (!benchmarkResult.success || !benchmarkResult.data) {
        console.log('[Streaming/benchmarks] No benchmarks found for industry:', industry);
        return dataPoints;
      }

      const benchmarks = benchmarkResult.data;
      this.industryBenchmarks = benchmarks;

      console.log(`[Streaming/benchmarks] ====== INDUSTRY BENCHMARKS LOADED ======`);
      console.log(`[Streaming/benchmarks] Industry: ${industry}, Platforms: ${benchmarks.platforms?.length || 0}`);

      // Platform performance benchmarks
      if (benchmarks.platforms && benchmarks.platforms.length > 0) {
        for (const platform of benchmarks.platforms) {
          const benchmarkContent = [
            `Platform: ${platform.platform}`,
            platform.engagementRate ? `Engagement Rate: ${platform.engagementRate.min}-${platform.engagementRate.max}% (avg: ${platform.engagementRate.average}%)` : '',
            platform.reachRate ? `Organic Reach: ${platform.reachRate.min}-${platform.reachRate.max}%` : '',
            platform.clickThroughRate ? `CTR: ${platform.clickThroughRate.min}-${platform.clickThroughRate.max}%` : '',
            `Best posting times: ${platform.optimalPostingTimes?.bestTimes?.join(', ') || 'varies'}`,
          ].filter(Boolean).join('\n');

          dataPoints.push({
            id: `benchmark-${platform.platform}-${Date.now()}`,
            source: 'website' as DataSource,
            type: 'market_signal' as DataPointType,
            content: benchmarkContent,
            metadata: {
              benchmarkType: 'platform_performance',
              platform: platform.platform,
              industry: industry,
              engagementRate: platform.engagementRate,
              confidence: 0.95,
            },
            createdAt: new Date()
          });
        }
      }

      // Content type benchmarks
      if (benchmarks.contentTypes && benchmarks.contentTypes.length > 0) {
        for (const contentType of benchmarks.contentTypes) {
          dataPoints.push({
            id: `benchmark-content-${contentType.type}-${Date.now()}`,
            source: 'website' as DataSource,
            type: 'opportunity' as DataPointType,
            content: `Content type "${contentType.type}": ${contentType.engagementMultiplier}x engagement vs standard. Best for: ${contentType.bestFor?.join(', ') || 'general'}`,
            metadata: {
              benchmarkType: 'content_type',
              contentType: contentType.type,
              engagementMultiplier: contentType.engagementMultiplier,
              confidence: 0.9,
            },
            createdAt: new Date()
          });
        }
      }

      // Conversion benchmarks
      if (benchmarks.conversions) {
        const conversionContent = Object.entries(benchmarks.conversions)
          .map(([key, value]: [string, any]) => {
            if (value && typeof value === 'object' && value.average) {
              return `${key}: ${value.average}% conversion rate`;
            }
            return null;
          })
          .filter(Boolean)
          .join('\n');

        if (conversionContent) {
          dataPoints.push({
            id: `benchmark-conversions-${Date.now()}`,
            source: 'website' as DataSource,
            type: 'market_signal' as DataPointType,
            content: `Industry conversion benchmarks for ${industry}:\n${conversionContent}`,
            metadata: {
              benchmarkType: 'conversion_rates',
              industry: industry,
              confidence: 0.85,
            },
            createdAt: new Date()
          });
        }
      }

      console.log(`[Streaming/benchmarks] Generated ${dataPoints.length} benchmark data points`);
      console.log(`[Streaming/benchmarks] ===================================`);

    } catch (error) {
      console.error('[Streaming/benchmarks] Error loading benchmarks:', error);
    }

    return dataPoints;
  }

  /**
   * V3 FAST: Title-based deduplication for final insights
   * Uses normalized title comparison - instant, no API calls
   * Keeps highest-scoring insight when duplicates found
   */
  private deduplicateInsightsByTitle(insights: CorrelatedInsight[]): CorrelatedInsight[] {
    if (insights.length === 0) return [];

    console.log(`[Streaming/Dedup] Starting title-based dedup on ${insights.length} insights...`);
    const startTime = Date.now();

    // Normalize title for comparison (lowercase, remove punctuation, collapse whitespace)
    const normalize = (title: string): string => {
      return (title || '')
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    // Group by normalized title, keep highest scoring
    const titleMap = new Map<string, CorrelatedInsight>();

    for (const insight of insights) {
      const normalizedTitle = normalize(insight.title);
      if (!normalizedTitle || normalizedTitle.length < 5) {
        // Keep insights with very short/empty titles as-is
        titleMap.set(`unique-${Date.now()}-${Math.random()}`, insight);
        continue;
      }

      const existing = titleMap.get(normalizedTitle);
      if (!existing) {
        titleMap.set(normalizedTitle, insight);
      } else {
        // Keep the one with higher breakthrough score
        const existingScore = existing.breakthroughScore || 0;
        const newScore = insight.breakthroughScore || 0;
        if (newScore > existingScore) {
          titleMap.set(normalizedTitle, insight);
        }
      }
    }

    const deduplicated = Array.from(titleMap.values());
    const removedCount = insights.length - deduplicated.length;
    const elapsed = Date.now() - startTime;

    console.log(`[Streaming/Dedup] Title dedup: ${insights.length} -> ${deduplicated.length} (removed ${removedCount}) in ${elapsed}ms`);

    return deduplicated;
  }

  /**
   * V3: Embedding-based deduplication for final insights (DISABLED - too slow)
   * Uses semantic similarity on full content (title + hook) to catch rephrased duplicates
   * Keeps highest-scoring insight when duplicates found
   */
  private async deduplicateInsightsByEmbedding(
    insights: CorrelatedInsight[],
    similarityThreshold: number = 0.85
  ): Promise<CorrelatedInsight[]> {
    if (insights.length === 0) return [];

    console.log(`[Streaming/Dedup] Starting embedding-based dedup on ${insights.length} insights...`);
    const startTime = Date.now();

    // Create content strings for embedding (title + description for semantic matching)
    const contentStrings = insights.map(insight =>
      `${insight.title}. ${insight.description || ''}`
    );

    // Generate embeddings in batches
    let embeddings: number[][];
    try {
      embeddings = await embeddingService.generateBatchEmbeddings(contentStrings);
    } catch (error) {
      console.error('[Streaming/Dedup] Failed to generate embeddings, skipping dedup:', error);
      return insights; // Return original if embedding fails
    }

    // Track which insights to keep (by index)
    const kept = new Set<number>();
    const duplicateOf = new Map<number, number>(); // maps duplicate index -> original index

    for (let i = 0; i < insights.length; i++) {
      if (duplicateOf.has(i)) continue; // Already marked as duplicate

      kept.add(i);

      // Compare against all remaining insights
      for (let j = i + 1; j < insights.length; j++) {
        if (duplicateOf.has(j)) continue;

        const similarity = embeddingService.cosineSimilarity(embeddings[i], embeddings[j]);

        if (similarity >= similarityThreshold) {
          // These are duplicates - keep the one with higher breakthrough score
          const scoreI = insights[i].breakthroughScore || 0;
          const scoreJ = insights[j].breakthroughScore || 0;

          if (scoreJ > scoreI) {
            // j is better, mark i as duplicate of j
            kept.delete(i);
            duplicateOf.set(i, j);
            kept.add(j);
          } else {
            // i is better (or equal), mark j as duplicate of i
            duplicateOf.set(j, i);
          }
        }
      }
    }

    // Build deduplicated array
    const deduplicated = Array.from(kept)
      .sort((a, b) => a - b) // Maintain original order
      .map(idx => insights[idx]);

    const removedCount = insights.length - deduplicated.length;
    const elapsed = Date.now() - startTime;

    console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
    console.log(`║         INSIGHT DEDUPLICATION SUMMARY                        ║`);
    console.log(`╠══════════════════════════════════════════════════════════════╣`);
    console.log(`║  Input insights:    ${insights.length.toString().padStart(5)}                                    ║`);
    console.log(`║  Duplicates found:  ${removedCount.toString().padStart(5)}                                    ║`);
    console.log(`║  Unique insights:   ${deduplicated.length.toString().padStart(5)}                                    ║`);
    console.log(`║  Similarity threshold: ${(similarityThreshold * 100).toFixed(0)}%                                 ║`);
    console.log(`║  Processing time:   ${elapsed.toString().padStart(5)}ms                                   ║`);
    console.log(`╚══════════════════════════════════════════════════════════════╝\n`);

    return deduplicated;
  }
}

// Export singleton
export const streamingDeepContextBuilder = new StreamingDeepContextBuilder();
