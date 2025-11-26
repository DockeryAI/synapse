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
import { TwoWayConnectionFinder } from '@/services/synapse/connections/TwoWayConnectionFinder';
import { ConnectionScorer } from '@/services/synapse/connections/ConnectionScorer';
import { connectionDiscoveryService } from './connection-discovery.service';
import { recoverUVPFromSession } from '@/services/database/marba-uvp.service';
import type { DeepContext, RawDataPoint, CorrelatedInsight, BreakthroughOpportunity } from '@/types/synapse/deepContext.types';
import type { DataPoint, DataSource, DataPointType } from '@/types/connections.types';

export interface StreamingConfig {
  brandId: string;
  businessType?: 'local' | 'b2b-national' | 'b2b-global';
  cacheResults?: boolean;
  forceFresh?: boolean;
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
  'perplexity'
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

    // If forceFresh, invalidate cache for this brand first
    if (config.forceFresh) {
      console.log('[Streaming] FORCE FRESH enabled - invalidating cache for brand:', config.brandId);
      await intelligenceCache.invalidateByBrand(config.brandId);
    }

    // Initialize empty context
    this.currentContext = this.buildEmptyContext();

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

      // Semantic deduplication - remove similar items (>0.92 similarity)
      const beforeDedup = this.dataPoints.length;
      this.dataPoints = this.deduplicateBySimilarity(this.dataPoints, 0.92);
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
      // Run the full connection discovery service (2-way through 5-way)
      const { twoWay, threeWay, fourWay, fiveWay, breakthroughs: rawBreakthroughs } =
        await connectionDiscoveryService.discoverConnections(this.dataPoints, enhancedClusters);

      console.log(`[Streaming] Connections: ${twoWay.length} 2-way, ${threeWay.length} 3-way, ${fourWay.length} 4-way, ${fiveWay.length} 5-way`);

      // Convert to CorrelatedInsights with UVP matching
      correlatedInsights = await this.convertConnectionsToCorrelatedInsights(
        [...fiveWay.slice(0, 3), ...fourWay.slice(0, 5), ...threeWay.slice(0, 10), ...twoWay.slice(0, 15)]
      );

      // Generate rich breakthrough narratives with UVP validation
      breakthroughs = await this.generateBreakthroughOpportunities(rawBreakthroughs, enhancedClusters);

      console.log(`[Streaming] Generated ${correlatedInsights.length} correlated insights, ${breakthroughs.length} breakthroughs`);
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

    // Add ALL raw data points for direct display (bypasses categorization limits)
    if (this.currentContext) {
      this.currentContext.rawDataPoints = this.dataPoints.map(dp => ({
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
      }));
      this.currentContext.correlatedInsights = correlatedInsights;
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
   * Get APIs to run based on business type
   */
  private getApisForBusinessType(businessType: string): ApiName[] {
    if (businessType === 'local') {
      // Local businesses: Use all APIs including OutScraper for Google Maps
      return ['serper', 'website', 'outscraper', 'youtube', 'semrush', 'news', 'weather', 'perplexity'];
    } else {
      // B2B/Global: Skip OutScraper (Google Maps), skip Weather, use different sources
      return ['serper', 'website', 'youtube', 'semrush', 'news', 'linkedin', 'perplexity'];
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
      }

      // Add data points and mark complete
      this.dataPoints.push(...apiDataPoints);
      this.completedApis.add(api);

      console.log(`[Streaming/${api}] Complete: ${apiDataPoints.length} data points in ${Date.now() - startApiTime}ms`);

      // Rebuild context and notify UI immediately
      this.currentContext = await this.buildContextFromDataPoints();
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
   * Notify UI of progress
   */
  private notifyProgress(isComplete: boolean): void {
    if (!this.onProgress || !this.currentContext) return;

    const pendingApis = ALL_APIS.filter(api => !this.completedApis.has(api));

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
   */
  private async buildContextFromDataPoints(): Promise<DeepContext> {
    const context = this.buildEmptyContext();

    // Categorize data points
    const trendingTopics = this.dataPoints.filter(dp => dp.type === 'trending_topic');
    const customerTriggers = this.dataPoints.filter(dp => dp.type === 'customer_trigger');
    const competitiveGaps = this.dataPoints.filter(dp => dp.type === 'competitive_gap');
    const painPoints = this.dataPoints.filter(dp => dp.type === 'pain_point');
    const unarticulatedNeeds = this.dataPoints.filter(dp => dp.type === 'unarticulated_need');

    // Populate industry trends
    context.industry.trends = trendingTopics.slice(0, 10).map(dp => ({
      trend: dp.content,
      direction: 'rising' as const,
      strength: 0.7,
      timeframe: 'current',
      impact: 'medium' as const,
      source: dp.source,
      timestamp: dp.createdAt?.toISOString()
    }));

    // Populate customer psychology
    context.customerPsychology.unarticulated = unarticulatedNeeds.map(dp => ({
      need: dp.content,
      confidence: 0.7,
      evidence: [],
      marketingAngle: dp.metadata?.marketingAngle || 'Address this need in content',
      emotionalDriver: dp.metadata?.emotionalDriver
    }));

    context.customerPsychology.behavioral = customerTriggers.slice(0, 10).map(dp => ({
      behavior: dp.content,
      frequency: 'common' as const,
      insight: 'Customer trigger identified',
      contentAlignment: 'Create content addressing this trigger'
    }));

    // Populate competitive intel
    context.competitiveIntel.opportunities = competitiveGaps.slice(0, 10).map(dp => ({
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

    // Parallel Serper calls - searching for CUSTOMER pain points and needs
    const [newsResult, trendsResult, autocompleteResult] = await Promise.allSettled([
      SerperAPI.getNews(`${customerSearchTerm} challenges problems`, undefined),
      SerperAPI.getTrends(customerSearchTerm),
      SerperAPI.getAutocomplete(`${customerSearchTerm} how to`)
    ]);

    if (newsResult.status === 'fulfilled') {
      newsResult.value.slice(0, 20).forEach((article: any, idx: number) => {
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
      autocompleteResult.value.slice(0, 15).forEach((suggestion: string, idx: number) => {
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

    return dataPoints;
  }

  private async fetchWebsiteData(): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];
    const websiteUrl = this.brandData.website;

    if (!websiteUrl) return dataPoints;

    try {
      const analysis = await websiteAnalyzer.analyzeWebsite(websiteUrl);

      analysis.valuePropositions?.forEach((vp: string, idx: number) => {
        dataPoints.push({
          id: `website-vp-${Date.now()}-${idx}`,
          source: 'website' as DataSource,
          type: 'pain_point' as DataPointType,
          content: vp,
          metadata: { confidence: analysis.confidence },
          createdAt: new Date()
        });
      });

      analysis.targetAudience?.forEach((audience: string, idx: number) => {
        dataPoints.push({
          id: `website-audience-${Date.now()}-${idx}`,
          source: 'website' as DataSource,
          type: 'unarticulated_need' as DataPointType,
          content: audience,
          metadata: { confidence: analysis.confidence },
          createdAt: new Date()
        });
      });
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
      const competitors = await OutScraperAPI.discoverCompetitors({
        businessName: this.brandData.name,
        location,
        industry: this.brandData.industry,
        radius: 10
      });

      // Scrape reviews in PARALLEL (not sequential)
      const reviewPromises = competitors.slice(0, 2).map(async (competitor: any) => {
        try {
          const reviews = await OutScraperAPI.scrapeGoogleReviews({
            place_id: competitor.place_id,
            business_name: competitor.name,
            location,
            industry: this.brandData.industry,
            limit: 10,
            sort: 'newest'
          });

          return reviews.map((review: any, idx: number) => ({
            id: `outscraper-review-${Date.now()}-${idx}`,
            source: 'outscraper' as DataSource,
            type: 'customer_trigger' as DataPointType,
            content: review.text,
            metadata: {
              competitor: competitor.name,
              rating: review.rating
            },
            createdAt: new Date(review.time)
          }));
        } catch (e) {
          return [];
        }
      });

      const reviewResults = await Promise.all(reviewPromises);
      reviewResults.forEach(reviews => dataPoints.push(...reviews));

    } catch (error) {
      console.error('[Streaming/outscraper] Error:', error);
    }

    return dataPoints;
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

      trends.trending_topics.slice(0, 15).forEach((topic: string, idx: number) => {
        dataPoints.push({
          id: `youtube-topic-${Date.now()}-${idx}`,
          source: 'youtube' as DataSource,
          type: 'trending_topic' as DataPointType,
          content: topic,
          metadata: { platform: 'youtube' },
          createdAt: new Date()
        });
      });

      trends.content_angles.slice(0, 15).forEach((angle: string, idx: number) => {
        dataPoints.push({
          id: `youtube-angle-${Date.now()}-${idx}`,
          source: 'youtube' as DataSource,
          type: 'customer_trigger' as DataPointType,
          content: angle,
          metadata: { type: 'content_angle' },
          createdAt: new Date()
        });
      });
    } catch (error) {
      console.error('[Streaming/youtube] Error:', error);
    }

    return dataPoints;
  }

  private async fetchSemrushData(): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];
    const domain = this.brandData.website;

    if (!domain) return dataPoints;

    try {
      const metrics = await SemrushAPI.getComprehensiveSEOMetrics(domain, this.brandData.name);

      metrics.opportunities.slice(0, 15).forEach((opp: any, idx: number) => {
        dataPoints.push({
          id: `semrush-opp-${Date.now()}-${idx}`,
          source: 'semrush' as DataSource,
          type: 'competitive_gap' as DataPointType,
          content: `Keyword opportunity: "${opp.keyword}" (${opp.searchVolume} searches/mo)`,
          metadata: {
            keyword: opp.keyword,
            searchVolume: opp.searchVolume,
            difficulty: opp.difficulty
          },
          createdAt: new Date()
        });
      });
    } catch (error) {
      console.error('[Streaming/semrush] Error:', error);
    }

    return dataPoints;
  }

  private async fetchNewsData(): Promise<DataPoint[]> {
    const dataPoints: DataPoint[] = [];

    try {
      const articles = await SerperAPI.getNews(this.brandData.industry, undefined);

      articles.slice(0, 20).forEach((article: any, idx: number) => {
        dataPoints.push({
          id: `news-${Date.now()}-${idx}`,
          source: 'news' as DataSource,
          type: 'trending_topic' as DataPointType,
          content: `${article.title}: ${article.snippet}`,
          metadata: { url: article.link, source: article.source },
          createdAt: new Date()
        });
      });
    } catch (error) {
      console.error('[Streaming/news] Error:', error);
    }

    return dataPoints;
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
    } catch (error) {
      console.error('[Streaming/weather] Error:', error);
    }

    return dataPoints;
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
      // Multiple LinkedIn searches for richer B2B data
      const searchQueries = [
        `site:linkedin.com ${customerTerm} challenges pain points`,
        `site:linkedin.com ${customerTerm} best practices tips`,
        `site:linkedin.com "${this.brandData.industry}" thought leadership`,
      ];

      // Run searches in parallel
      const searchResults = await Promise.allSettled(
        searchQueries.map(q => SerperAPI.searchGoogle(q))
      );

      // Collect all results
      const allResults: any[] = [];
      searchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          allResults.push(...result.value);
        }
      });

      // Deduplicate by URL
      const seenUrls = new Set<string>();
      const uniqueResults = allResults.filter(r => {
        if (seenUrls.has(r.link)) return false;
        seenUrls.add(r.link);
        return true;
      });

      uniqueResults.slice(0, 20).forEach((result: any, idx: number) => {
        dataPoints.push({
          id: `linkedin-${Date.now()}-${idx}`,
          source: 'linkedin' as DataSource,
          type: 'trending_topic' as DataPointType,
          content: `${result.title}${result.snippet ? ': ' + result.snippet.substring(0, 150) : ''}`,
          metadata: { url: result.link },
          createdAt: new Date()
        });
      });
    } catch (error) {
      console.error('[Streaming/linkedin] Error:', error);
    }

    return dataPoints;
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

      // Multiple SPECIFIC targeted questions (not one blob)
      const specificQueries = [
        // Functional pain points
        `What specific daily tasks frustrate ${customerTerm} the most? List the top 5 time-wasting activities.`,
        // Emotional drivers
        `What keeps ${customerTerm} up at night? What are their biggest fears and anxieties about ${customerProblem || 'their work'}?`,
        // Buying triggers
        `What events or situations trigger ${customerTerm} to finally seek a solution for ${customerProblem || 'their challenges'}?`,
        // Objections
        `What are the top 5 objections ${customerTerm} have when considering solutions? What makes them hesitate?`,
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

          const queryType = ['functional_pain', 'emotional_fear', 'buying_trigger', 'objection'][qIdx];

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
    const emotionalKeywords = /fear|frustrat|anxious|worry|stress|overwhelm|confus|uncertain|risk|lose|fail|afraid|nervous|hesitat/i;
    const isEmotional = emotionalKeywords.test(insight);

    if (queryType === 'emotional_fear') return 'pain_point';
    if (queryType === 'objection') return 'customer_trigger';
    if (queryType === 'buying_trigger') return 'timing';
    if (isEmotional) return 'pain_point';
    return 'unarticulated_need';
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

      // Score and filter the best connections
      for (const candidate of candidates.slice(0, 50)) { // Process top 50
        // Convert to Connection format and score it
        const connection = this.connectionFinder.toConnection(candidate, `conn-${Date.now()}-${Math.random().toString(36).substring(7)}`);
        const scoredConnection = this.connectionScorer.scoreConnection(connection, this.currentContext!);

        // Only include high-value connections (score >= 60)
        if (scoredConnection.breakthroughPotential.score >= 60) {
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

      console.log(`[Streaming/correlation] Generated ${correlatedInsights.length} correlated insights`);
      return correlatedInsights.slice(0, 30); // Return top 30

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
    if (!this.uvpData) return;

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
        const embedding = await embeddingService.embedText(text);
        if (embedding && embedding.length > 0) {
          this.uvpSeedEmbeddings.push({ painPoint: text, embedding, category });
          // Initialize source validation counts for this pain point
          this.sourceValidationCounts.set(text, new Map());
        }
      } catch (error) {
        console.warn(`[Streaming] Failed to embed UVP pain point: ${text}`, error);
      }
    }

    console.log(`[Streaming] Generated ${this.uvpSeedEmbeddings.length} UVP seed embeddings as cluster centers`);
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

    for (const conn of connections) {
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

      insights.push({
        id: conn.id,
        type,
        title: conn.angle || `${conn.connectionType} Connection`,
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
        actionableInsight: `Create content around: "${conn.angle}"`,
        timeSensitive: conn.timingRelevance > 0.5
      });
    }

    return insights.sort((a, b) => b.breakthroughScore - a.breakthroughScore).slice(0, 30);
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

    for (const bt of rawBreakthroughs.slice(0, 15)) {
      const conn = bt.connections?.[0];
      if (!conn) continue;

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

      // Action line
      const urgencyWord = bt.urgency === 'critical' ? 'IMMEDIATELY' :
                          bt.urgency === 'high' ? 'NOW' :
                          'this week';
      actionParts.push(`→ Action: Create '${bt.title || conn.angle}' campaign ${urgencyWord}`);

      const actionPlan = actionParts.join('\n');

      opportunities.push({
        id: bt.id,
        title: bt.title || conn.angle,
        hook: bt.hook || `${sourceCount}-source breakthrough: ${conn.angle}`,
        score: bt.score,
        connectionType: conn.connectionType || '2-way',
        sources: Array.from(uniqueSources),
        uvpValidation,
        psychology: {
          triggerCategory,
          emotion,
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
    const uvpClusters = clusters.filter(c => c.isUVPSeeded && c.crossSourceCount >= 2);
    for (const cluster of uvpClusters.slice(0, 5)) {
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

    return opportunities.sort((a, b) => b.score - a.score);
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
}

// Export singleton
export const streamingDeepContextBuilder = new StreamingDeepContextBuilder();
