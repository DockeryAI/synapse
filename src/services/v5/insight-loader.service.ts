/**
 * V5 Insight Loader Service
 *
 * Loads insights from real data sources via edge functions.
 * NO MOCK DATA - connects to streaming-api-manager for real-time data.
 *
 * Sources:
 * - Triggers: from trigger-consolidation service (uses ai-proxy edge function)
 * - Proof: from proof-consolidation service (uses outscraper, apify edge functions)
 * - Trends: from trend-analyzer (uses perplexity-proxy, fetch-news edge functions)
 * - Competitors: from competitive-intelligence (uses semrush, serper edge functions)
 * - Weather: from fetch-weather edge function
 * - Local: from fetch-news edge function with location filter
 *
 * Created: 2025-12-01
 */

import { streamingApiManager, type ApiUpdate, type ApiEventType } from '@/services/intelligence/streaming-api-manager';
import type { ConsolidatedTrigger } from '@/services/triggers/trigger-consolidation.service';
import { proofConsolidationService, type ConsolidatedProof } from '@/services/proof/proof-consolidation.service';
import { proofStreamingManager } from '@/services/proof/proof-streaming-manager';
import { insightPersistenceService } from './insight-persistence.service';
import type { Insight, InsightType } from '@/components/v5/InsightCards';
import type { CompleteUVP } from '@/types/uvp-flow.types';
import type { Brand } from '@/contexts/BrandContext';
import type { SpecialtyProfileRow } from '@/types/specialty-profile.types';
import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface InsightLoaderConfig {
  brandId: string;
  brand: Brand;
  uvp: CompleteUVP;
  enabledTabs?: {
    triggers: boolean;
    proof: boolean;
    trends: boolean;
    competitors: boolean;
    local: boolean;
    weather: boolean;
  };
}

export interface LoadedInsights {
  insights: Insight[];
  loading: boolean;
  sources: {
    triggers: { count: number; loading: boolean; error?: string };
    proof: { count: number; loading: boolean; error?: string };
    trends: { count: number; loading: boolean; error?: string };
    competitors: { count: number; loading: boolean; error?: string };
    local: { count: number; loading: boolean; error?: string };
    weather: { count: number; loading: boolean; error?: string };
  };
  // Persistence info
  lastRefresh?: Date | null;
  isFromCache?: boolean;
}

// ============================================================================
// INSIGHT TRANSFORMERS
// Transform service data into V5 Insight format
// ============================================================================

/**
 * TRIGGERS 4.0: Clean up source display strings from cached insights
 * Detects and removes hallucinated author names from cached data
 */
function cleanInsightSource(insight: Insight): Insight {
  if (insight.type !== 'trigger') return insight;

  const source = insight.source;
  if (!source) return insight;

  // Detect hallucinated source patterns
  // Pattern: "@SomeName on Platform" where SomeName looks like a hallucinated handle
  const hallucinatedPatterns = [
    // Full names (FirstName LastName) - platforms use handles, not real names
    /@[A-Z][a-z]+[A-Z][a-z]+\s+on\s+/,  // @FirstLast on Platform
    /@[A-Z][a-z]+_[A-Z][a-z]+\s+on\s+/, // @First_Last on Platform
    // Random-looking handles that don't match platform conventions
    /@[a-z]{10,}\s+on\s+/,              // Very long random handles
    // Specific known hallucinated names from this session
    /@swathyragupathy\s+on\s+/i,
    /@techsavvymarketer\s+on\s+/i,
    /@aiinnovator\s+on\s+/i,
    /@businesspro\s+on\s+/i,
  ];

  for (const pattern of hallucinatedPatterns) {
    if (pattern.test(source)) {
      // Extract platform name from source
      const platformMatch = source.match(/on\s+(Reddit|X|HackerNews|G2|Trustpilot|Capterra|LinkedIn|Quora|YouTube|Twitter)/i);
      const platform = platformMatch ? platformMatch[1] : 'Source';
      console.log(`[InsightLoader] Cleaned hallucinated source: "${source}" -> "${platform}"`);
      return { ...insight, source: platform };
    }
  }

  // Additional check: if it looks like "@handle on Platform" but there's no sourceUrl, it's likely hallucinated
  if (source.match(/^@\w+\s+on\s+/) && !insight.sourceUrl) {
    const platformMatch = source.match(/on\s+(\w+)$/);
    const platform = platformMatch ? platformMatch[1] : 'Source';
    console.log(`[InsightLoader] Cleaned unverified source (no URL): "${source}" -> "${platform}"`);
    return { ...insight, source: platform };
  }

  return insight;
}

function transformTriggerToInsight(trigger: ConsolidatedTrigger, index: number): Insight {
  // Map TriggerCategory to emotional category display
  const categoryDisplayMap: Record<string, string> = {
    'fear': 'Fear',
    'desire': 'Desire',
    'pain-point': 'Pain Point',
    'objection': 'Objection',
    'motivation': 'Motivation',
    'trust': 'Trust',
    'urgency': 'Urgency',
  };

  // Get the first valid evidence URL (verified sources have URLs starting with http)
  const firstEvidence = trigger.evidence?.[0];
  const sourceUrl = firstEvidence?.url && firstEvidence.url.startsWith('http')
    ? firstEvidence.url
    : undefined;

  // TRIGGERS 4.0: Build source display from verified evidence data
  // Format: "@author on Platform" or "Anonymous on Platform" or platform name
  const platformDisplayMap: Record<string, string> = {
    'reddit': 'Reddit',
    'twitter': 'X',
    'x': 'X',
    'hackernews': 'HackerNews',
    'g2': 'G2',
    'trustpilot': 'Trustpilot',
    'capterra': 'Capterra',
    'linkedin': 'LinkedIn',
    'quora': 'Quora',
    'youtube': 'YouTube',
  };

  // TRIGGERS 4.0: Detect hallucinated authors
  // Real authors from Reddit/Twitter have specific patterns (u/username, @handle)
  // Hallucinated authors often have: full names like "John Smith", generic handles, etc.
  const isLikelyHallucinatedAuthor = (author: string | undefined, platform: string): boolean => {
    if (!author) return false;

    // Full names with space (likely hallucinated - platforms use handles, not real names)
    if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(author)) return true;

    // Generic/test patterns
    if (/^(user|test|example|anonymous|unknown)/i.test(author)) return true;

    // For Twitter/X, author should be a handle or start with @
    if ((platform === 'twitter' || platform === 'x') && !author.startsWith('@') && !author.match(/^[a-zA-Z0-9_]+$/)) {
      return true;
    }

    // For Reddit, author should be u/ format or just username
    if (platform === 'reddit' && !author.match(/^(u\/)?[a-zA-Z0-9_-]+$/)) {
      return true;
    }

    return false;
  };

  const platform = firstEvidence?.platform?.toLowerCase() || '';
  const platformDisplay = platformDisplayMap[platform] || firstEvidence?.platform || 'Source';
  const author = firstEvidence?.author;

  // Only show author if it's verified (has matching URL) and not likely hallucinated
  const isVerifiedAuthor = author &&
    author !== 'Anonymous' &&
    sourceUrl && // Must have a real URL to display author
    !isLikelyHallucinatedAuthor(author, platform);

  const sourceDisplay = isVerifiedAuthor
    ? `@${author.replace(/^@/, '')} on ${platformDisplay}`
    : platformDisplay; // Just show platform name for unverified/hallucinated authors

  return {
    id: `trigger-${trigger.id || index}`,
    type: 'trigger' as InsightType,
    text: trigger.executiveSummary || trigger.title,
    source: sourceDisplay,
    sourceUrl, // Pass the verified source URL for clickable links
    confidence: trigger.confidence,
    urgency: trigger.isTimeSensitive ? 9 : (trigger.profileRelevance || 0) * 10,
    category: categoryDisplayMap[trigger.category] || trigger.category,
  };
}

function transformProofToInsight(proof: ConsolidatedProof, index: number): Insight {
  return {
    id: `proof-${proof.id || index}`,
    type: 'proof' as InsightType,
    text: proof.quote || proof.summary,
    source: proof.source || proof.platform,
    qualityScore: proof.qualityScore,
    recencyDays: proof.recencyDays,
    verifiedCustomer: proof.verifiedCustomer,
    category: proof.category,
  };
}

interface TrendData {
  id?: string;
  topic?: string;
  title?: string;
  keyword?: string;
  relevance_score?: number;
  velocity?: number;
  source?: string;
  recency_days?: number;
}

function transformTrendToInsight(trend: TrendData, index: number): Insight {
  return {
    id: `trend-${trend.id || index}`,
    type: 'trend' as InsightType,
    text: trend.topic || trend.title || trend.keyword || '',
    source: trend.source || 'Industry Analysis',
    relevanceScore: trend.relevance_score,
    velocity: trend.velocity,
    recencyDays: trend.recency_days,
  };
}

interface CompetitorGapData {
  id?: string;
  gap?: string;
  opportunity?: string;
  competitor?: string;
  strength?: number;
  source?: string;
}

function transformCompetitorGapToInsight(gap: CompetitorGapData, index: number): Insight {
  return {
    id: `competitor-${gap.id || index}`,
    type: 'competitor' as InsightType,
    text: gap.gap || gap.opportunity || '',
    source: gap.competitor || gap.source || 'Competitive Analysis',
    strengthScore: gap.strength,
  };
}

interface LocalEventData {
  id?: string;
  title?: string;
  description?: string;
  location?: string;
  date?: string;
  source?: string;
  relevance?: number;
}

function transformLocalEventToInsight(event: LocalEventData, index: number): Insight {
  return {
    id: `local-${event.id || index}`,
    type: 'local' as InsightType,
    text: event.title || event.description || '',
    source: event.source || event.location || 'Local News',
    localRelevance: event.relevance,
    eventDate: event.date,
  };
}

interface WeatherData {
  id?: string;
  condition?: string;
  opportunity?: string;
  forecast?: string;
  location?: string;
  temp?: number;
  confidence?: number;
}

function transformWeatherToInsight(weather: WeatherData, index: number): Insight {
  return {
    id: `weather-${weather.id || index}`,
    type: 'weather' as InsightType,
    text: weather.opportunity || `${weather.condition} conditions expected`,
    source: weather.location || 'Weather Service',
    confidence: weather.confidence,
    forecast: weather.forecast,
    temp: weather.temp,
  };
}

// ============================================================================
// MAIN LOADER CLASS
// ============================================================================

class InsightLoaderService {
  private currentConfig: InsightLoaderConfig | null = null;
  private insights: Insight[] = [];
  private loadingStates = new Map<InsightType, boolean>();
  private listeners: Set<(data: LoadedInsights) => void> = new Set();
  private lastRefresh: Date | null = null;
  private isFromCache = false;

  /**
   * Initialize loader with brand and UVP context
   * DOES NOT clear existing insights - they persist across page navigation
   */
  async initialize(config: InsightLoaderConfig): Promise<void> {
    console.log('[V5 InsightLoader] Initializing with brand:', config.brandId);

    // Check if we're switching brands - only clear if brand changed
    const brandChanged = this.currentConfig?.brandId !== config.brandId;

    this.currentConfig = config;

    // Only clear insights if brand changed
    if (brandChanged) {
      console.log('[V5 InsightLoader] Brand changed, clearing old insights');
      this.insights = [];
      // CRITICAL: Set all loading states to TRUE at the start
      // This ensures BorderBeam animation shows while data loads (even from cache)
      // They will be set to false when cache is found or when loading completes
      ['trigger', 'proof', 'trend', 'competitor', 'local', 'weather'].forEach(type => {
        this.loadingStates.set(type as InsightType, true);
      });
    } else {
      console.log(`[V5 InsightLoader] Same brand, keeping ${this.insights.length} existing insights`);
    }

    // Set up streaming API manager event listeners
    this.setupEventListeners();
  }

  /**
   * Subscribe to insight updates
   */
  subscribe(callback: (data: LoadedInsights) => void): () => void {
    this.listeners.add(callback);
    // Immediately send current state
    callback(this.getState());
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Get current state
   */
  getState(): LoadedInsights {
    const loading = Array.from(this.loadingStates.values()).some(v => v);

    return {
      insights: this.insights,
      loading,
      sources: {
        triggers: {
          count: this.insights.filter(i => i.type === 'trigger').length,
          loading: this.loadingStates.get('trigger') || false,
        },
        proof: {
          count: this.insights.filter(i => i.type === 'proof').length,
          loading: this.loadingStates.get('proof') || false,
        },
        trends: {
          count: this.insights.filter(i => i.type === 'trend').length,
          loading: this.loadingStates.get('trend') || false,
        },
        competitors: {
          count: this.insights.filter(i => i.type === 'competitor').length,
          loading: this.loadingStates.get('competitor') || false,
        },
        local: {
          count: this.insights.filter(i => i.type === 'local').length,
          loading: this.loadingStates.get('local') || false,
        },
        weather: {
          count: this.insights.filter(i => i.type === 'weather').length,
          loading: this.loadingStates.get('weather') || false,
        },
      },
      lastRefresh: this.lastRefresh,
      isFromCache: this.isFromCache,
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(callback => callback(state));
  }

  /**
   * Set up event listeners for streaming API updates
   */
  private setupEventListeners(): void {
    streamingApiManager.removeAllListeners('api-update');
    streamingApiManager.removeAllListeners('trigger-synthesis');
    streamingApiManager.removeAllListeners('trigger-batch');

    streamingApiManager.on('api-update', (update: ApiUpdate) => {
      this.handleApiUpdate(update);
    });

    // PROGRESSIVE LOADING: Listen for batch updates as they complete
    streamingApiManager.on('trigger-batch', (batch: {
      triggers: any[];
      batchIndex: number;
      totalBatches: number;
      isComplete: boolean;
    }) => {
      this.handleTriggerBatch(batch);
    });

    // Listen for final synthesized triggers from LLM trigger synthesizer
    streamingApiManager.on('trigger-synthesis', (result: { triggers: any[]; synthesisTime: number }) => {
      this.handleTriggerSynthesis(result);
    });
  }

  /**
   * PROGRESSIVE LOADING: Handle individual batch of triggers as they complete
   * This enables triggers to appear progressively as each of the 4 parallel batches finishes
   */
  private handleTriggerBatch(batch: {
    triggers: any[];
    batchIndex: number;
    totalBatches: number;
    isComplete: boolean;
  }): void {
    if (!batch.triggers || batch.triggers.length === 0) {
      console.log(`[V5 InsightLoader] 🔄 Batch ${batch.batchIndex + 1}/${batch.totalBatches}: No triggers`);
      return;
    }

    console.log(`[V5 InsightLoader] 🔄 Progressive batch ${batch.batchIndex + 1}/${batch.totalBatches}: ${batch.triggers.length} triggers`);

    // Transform this batch of triggers to insights
    // Use a unique offset based on batch index to avoid ID collisions
    const batchOffset = batch.batchIndex * 100;
    const batchInsights = batch.triggers.map((trigger, i) =>
      transformTriggerToInsight(trigger, batchOffset + i)
    );

    // PROGRESSIVE MERGE: Append to existing triggers instead of replacing
    // Get existing trigger insights
    const existingTriggers = this.insights.filter(i => i.type === 'trigger');
    const otherInsights = this.insights.filter(i => i.type !== 'trigger');

    // Combine existing + new batch triggers
    const allTriggers = [...existingTriggers, ...batchInsights];

    // Update insights array
    this.insights = [...otherInsights, ...allTriggers];

    console.log(`[V5 InsightLoader] 🔄 Progressive: Now showing ${allTriggers.length} total triggers`);

    // Notify listeners immediately so UI updates progressively
    this.notifyListeners();
  }

  /**
   * Handle synthesized triggers from LLM trigger synthesizer
   */
  private handleTriggerSynthesis(result: { triggers: any[]; synthesisTime: number }): void {
    if (!result.triggers || result.triggers.length === 0) {
      console.log('[V5 InsightLoader] No synthesized triggers received');
      return;
    }

    console.log(`[V5 InsightLoader] Received ${result.triggers.length} synthesized triggers (${result.synthesisTime}ms) - FINAL`);

    // Transform ConsolidatedTrigger[] to Insight[]
    // NOTE: Removed hardcoded limit - show all triggers from LLM synthesis (target: 50+)
    const insights = result.triggers.map((trigger, i) => transformTriggerToInsight(trigger, i));

    console.log(`[V5 InsightLoader] Transformed ${insights.length} triggers to insights (replacing progressive batch data)`);

    // Replace all triggers with the final deduplicated set
    this.mergeInsights(insights, 'trigger');

    // Mark loading as complete
    this.loadingStates.set('trigger', false);
    this.notifyListeners();

    // Immediately save after receiving synthesized triggers
    this.saveToDatabase();
  }

  /**
   * Handle incoming API update from streaming manager
   */
  private handleApiUpdate(update: ApiUpdate): void {
    if (!update.data || update.error) {
      console.warn(`[V5 InsightLoader] API ${update.type} returned error:`, update.error);
      return;
    }

    console.log(`[V5 InsightLoader] Received ${update.type} data`);

    // Map API types to insight types
    switch (update.type) {
      case 'serper-news':
      case 'news-breaking':
      case 'news-trending':
        this.processTrendData(update.data);
        break;

      case 'outscraper-reviews':
      case 'apify-reviews':
      case 'apify-g2-reviews':
      case 'apify-trustpilot-reviews':
        this.processProofData(update.data);
        break;

      case 'weather-conditions':
        this.processWeatherData(update.data);
        break;

      case 'semrush-competitors':
      case 'competitor-voice':
        this.processCompetitorData(update.data);
        break;

      case 'perplexity-research':
      case 'buzzsumo-performance':
        this.processTrendData(update.data);
        break;
    }
  }

  /**
   * Process trend data from API
   */
  private processTrendData(data: any): void {
    if (!data) return;

    const trends = Array.isArray(data) ? data : data.trends || data.articles || [data];
    const newInsights = trends
      .filter((t: any) => t.topic || t.title || t.keyword)
      .slice(0, 10)
      .map((t: TrendData, i: number) => transformTrendToInsight(t, i));

    // Merge with existing, avoiding duplicates
    this.mergeInsights(newInsights, 'trend');
    this.loadingStates.set('trend', false);
    this.notifyListeners();
  }

  /**
   * Process proof data from API
   */
  private processProofData(data: any): void {
    if (!data) return;

    const proofs = Array.isArray(data) ? data : data.reviews || data.testimonials || [data];
    const newInsights = proofs
      .filter((p: any) => p.quote || p.summary || p.text)
      .slice(0, 10)
      .map((p: any, i: number) => transformProofToInsight({
        id: p.id,
        quote: p.quote || p.text || p.review_text,
        summary: p.summary,
        source: p.source || p.reviewer_name,
        platform: p.platform || 'Review',
        qualityScore: p.quality_score || p.rating * 20,
        recencyDays: p.recency_days,
        verifiedCustomer: p.verified,
        category: p.category,
      }, i));

    this.mergeInsights(newInsights, 'proof');
    this.loadingStates.set('proof', false);
    this.notifyListeners();
  }

  /**
   * Process competitor data from API
   */
  private processCompetitorData(data: any): void {
    if (!data) return;

    const gaps = Array.isArray(data) ? data : data.gaps || data.opportunities || [data];
    const newInsights = gaps
      .filter((g: any) => g.gap || g.opportunity)
      .slice(0, 10)
      .map((g: CompetitorGapData, i: number) => transformCompetitorGapToInsight(g, i));

    this.mergeInsights(newInsights, 'competitor');
    this.loadingStates.set('competitor', false);
    this.notifyListeners();
  }

  /**
   * Process weather data from API
   */
  private processWeatherData(data: any): void {
    if (!data) return;

    // Weather data is usually a single object
    const weatherData = {
      id: 'current',
      condition: data.condition || data.weather || data.main?.description,
      opportunity: data.opportunity || this.generateWeatherOpportunity(data),
      forecast: data.forecast,
      location: data.location || data.city,
      temp: data.temp || data.temperature,
      confidence: data.confidence || 85,
    };

    const insight = transformWeatherToInsight(weatherData, 0);
    this.mergeInsights([insight], 'weather');
    this.loadingStates.set('weather', false);
    this.notifyListeners();
  }

  /**
   * Generate weather opportunity text from conditions
   */
  private generateWeatherOpportunity(data: any): string {
    const condition = (data.condition || data.weather || '').toLowerCase();

    if (condition.includes('rain') || condition.includes('storm')) {
      return 'Perfect weather to promote indoor services and delivery';
    }
    if (condition.includes('snow') || condition.includes('cold')) {
      return 'Cold weather drives demand for warming products and services';
    }
    if (condition.includes('hot') || condition.includes('heat')) {
      return 'Heat wave creates opportunities for cooling solutions';
    }
    if (condition.includes('sunny') || condition.includes('clear')) {
      return 'Great weather for outdoor activities and events';
    }

    return `Current conditions: ${data.condition || 'Variable'}`;
  }

  /**
   * Merge new insights with existing, avoiding duplicates
   */
  private mergeInsights(newInsights: Insight[], type: InsightType): void {
    // Remove existing insights of this type
    this.insights = this.insights.filter(i => i.type !== type);
    // Add new insights
    this.insights = [...this.insights, ...newInsights];
  }

  /**
   * Start loading all insights from APIs
   * PRIORITY ORDER:
   * 1. Memory (singleton persists across page navigation)
   * 2. localStorage (fast, survives HMR and page refresh)
   * 3. Database (slower but persistent)
   * 4. APIs (only if button pressed OR no cache anywhere)
   */
  async loadAllInsights(): Promise<void> {
    if (!this.currentConfig) {
      console.error('[V5 InsightLoader] Not initialized - call initialize() first');
      return;
    }

    const { brandId, brand, uvp } = this.currentConfig;
    const localCacheKey = `v5_insights_${brandId}`;

    console.log('[V5 InsightLoader] Starting insight load for brand:', brandId);

    // ========== PRIORITY 1: MEMORY ==========
    if (this.insights.length > 0) {
      console.log(`[V5 InsightLoader] CACHE HIT: ${this.insights.length} insights in memory`);
      this.notifyListeners();
      return;
    }

    // ========== PRIORITY 2: LOCALSTORAGE (fastest persistent cache) ==========
    try {
      const localCache = localStorage.getItem(localCacheKey);
      if (localCache) {
        const parsed = JSON.parse(localCache);
        if (parsed.insights && parsed.insights.length > 0) {
          // Check if cache is less than 24 hours old
          const cacheAge = Date.now() - (parsed.timestamp || 0);
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours

          if (cacheAge < maxAge) {
            console.log(`[V5 InsightLoader] CACHE HIT: ${parsed.insights.length} insights from localStorage`);
            // TRIGGERS 4.0: Clean hallucinated sources from cached data
            this.insights = parsed.insights.map(cleanInsightSource);
            this.isFromCache = true;
            this.lastRefresh = parsed.timestamp ? new Date(parsed.timestamp) : null;

            // NOTE: Loading states already set to TRUE in initialize()
            // First notify with loading=true so UI shows skeletons briefly
            this.notifyListeners();

            // Then clear loading states after a visible delay so users see the BorderBeam animation
            setTimeout(() => {
              this.loadingStates.clear();
              this.notifyListeners();
            }, 1500); // 1.5s delay so BorderBeam animation is visible before loading completes
            return; // DO NOT CALL APIs
          } else {
            console.log('[V5 InsightLoader] localStorage cache is stale (>24h) - will check database');
          }
        }
      }
    } catch (e) {
      console.warn('[V5 InsightLoader] localStorage read error:', e);
    }

    // ========== PRIORITY 3: DATABASE ==========
    try {
      console.log('[V5 InsightLoader] Checking database cache...');
      const cachedInsights = await insightPersistenceService.loadInsights(brandId);

      if (cachedInsights.length > 0) {
        console.log(`[V5 InsightLoader] CACHE HIT: ${cachedInsights.length} insights from database`);
        // TRIGGERS 4.0: Clean hallucinated sources from cached data
        this.insights = cachedInsights.map(cleanInsightSource);
        this.isFromCache = true;

        // Get refresh status
        const status = await insightPersistenceService.getRefreshStatus(brandId);
        this.lastRefresh = status.lastRefresh;

        // NOTE: Loading states already set to TRUE in initialize()
        // First notify with loading=true so UI shows skeletons briefly
        // This ensures the BorderBeam animation is visible during cache hydration
        this.notifyListeners();

        // Then clear loading states and notify again to complete the loading sequence
        // Use setTimeout to ensure UI has time to render loading state with BorderBeam animation
        setTimeout(() => {
          this.loadingStates.clear();
          this.notifyListeners();
        }, 1500); // 1.5s delay so BorderBeam animation is visible before loading completes

        // Also save to localStorage for faster access next time
        this.saveToLocalStorage();
        return; // DO NOT CALL APIs
      }
    } catch (e) {
      console.warn('[V5 InsightLoader] Database cache load error:', e);
    }

    // ========== NO CACHE ANYWHERE - NEED TO CALL APIs ==========
    console.log('[V5 InsightLoader] NO CACHE FOUND - calling APIs (this should only happen once per brand)');
    this.isFromCache = false;

    // Set all as loading
    ['trigger', 'proof', 'trend', 'competitor', 'local', 'weather'].forEach(type => {
      this.loadingStates.set(type as InsightType, true);
    });
    this.notifyListeners();

    // Load triggers from consolidation service
    this.loadTriggers(brandId, uvp);

    // Load proof from consolidation service
    this.loadProof(brandId);

    // Trigger streaming API manager to load all APIs
    // Note: loadAllApis takes options object { profileType?, uvp?, forceFresh? }
    streamingApiManager.loadAllApis(brandId, brand, { uvp }).catch(err => {
      console.warn('[V5 InsightLoader] Streaming API load error:', err);
    });

    // Set up auto-save when all loading completes
    this.setupAutoSave();
  }

  /**
   * Set up auto-save to database - saves every minute for 10 minutes
   */
  private setupAutoSave(): void {
    // Save every minute for 10 minutes to catch all streaming data
    const checkSave = (attempt: number) => {
      if (this.insights.length > 0 && !this.isFromCache) {
        console.log(`[V5 InsightLoader] Auto-save attempt ${attempt}: saving ${this.insights.length} insights to database...`);
        this.saveToDatabase();
      } else {
        console.log(`[V5 InsightLoader] Auto-save attempt ${attempt}: no insights to save (count=${this.insights.length}, isFromCache=${this.isFromCache})`);
      }
    };

    // Save every minute for 10 minutes
    for (let i = 1; i <= 10; i++) {
      setTimeout(() => checkSave(i), i * 60 * 1000);  // 1, 2, 3... 10 minutes
    }

    // Also do an early save at 30 seconds
    setTimeout(() => checkSave(0), 30000);
  }

  /**
   * Load triggers using the trigger consolidation service (Triggers 3.0)
   * Uses the streaming API manager which emits 'trigger-synthesis' when LLM synthesizes triggers
   */
  private async loadTriggers(brandId: string, uvp: CompleteUVP): Promise<void> {
    try {
      this.loadingStates.set('trigger', true);
      this.notifyListeners();

      // Get brand context
      const brand = this.currentConfig?.brand;
      if (!brand) {
        console.warn('[V5 InsightLoader] No brand context for trigger loading');
        return;
      }

      console.log('[V5 InsightLoader] Refreshing triggers via streaming API manager with forceFresh...');

      // Clear cache for this brand before fresh load
      streamingApiManager.clearCache(brandId);

      // Track if we've received and processed triggers
      let triggersProcessed = false;

      // Listen for the 'trigger-synthesis' event emitted by streaming API manager
      // This is emitted when LLM synthesis completes after all APIs are loaded
      const handleTriggerSynthesis = (synthesisResult: { triggers: any[]; profileType?: string }) => {
        if (triggersProcessed) return; // Only process once per refresh

        if (synthesisResult && synthesisResult.triggers && synthesisResult.triggers.length > 0) {
          triggersProcessed = true;
          // NOTE: Removed hardcoded limit - show all triggers from LLM synthesis (target: 50+)
          const insights = synthesisResult.triggers
            .map((t, i) => transformTriggerToInsight(t, i));

          console.log(`[V5 InsightLoader] Loaded ${insights.length} fresh LLM-synthesized triggers`);
          this.mergeInsights(insights, 'trigger');
          this.loadingStates.set('trigger', false);
          this.notifyListeners();
          this.saveToLocalStorage();

          // Remove listener after processing
          streamingApiManager.removeListener('trigger-synthesis', handleTriggerSynthesis);
        }
      };

      // Subscribe to trigger synthesis events
      streamingApiManager.on('trigger-synthesis', handleTriggerSynthesis);

      // Start fresh API load - this will automatically run LLM synthesis when APIs complete
      streamingApiManager.loadAllApis(brandId, brand, { uvp, forceFresh: true }).catch(err => {
        console.error('[V5 InsightLoader] Trigger API load error:', err);
      });

      // Cleanup listener after timeout
      setTimeout(() => {
        streamingApiManager.removeListener('trigger-synthesis', handleTriggerSynthesis);
        if (!triggersProcessed) {
          console.warn('[V5 InsightLoader] Trigger refresh timed out - no triggers synthesized');
          this.loadingStates.set('trigger', false);
          this.notifyListeners();
        }
      }, 180000); // 180s timeout (API load ~120s + LLM synthesis ~50s)

    } catch (error) {
      console.error('[V5 InsightLoader] Trigger load error:', error);
      this.loadingStates.set('trigger', false);
      this.notifyListeners();
    }
  }

  /**
   * Load proof using the proof streaming manager
   * Listens for consolidation events and transforms to insights
   */
  private async loadProof(brandId: string): Promise<void> {
    try {
      this.loadingStates.set('proof', true);
      this.notifyListeners();

      const brand = this.currentConfig?.brand;
      const uvp = this.currentConfig?.uvp;

      if (!brand) {
        console.warn('[V5 InsightLoader] No brand context for proof loading');
        return;
      }

      // Set up listener for proof consolidation events
      const proofHandler = (update: any) => {
        if (update.source === 'consolidation' && update.data?.proofs) {
          const proofs = update.data.proofs as ConsolidatedProof[];
          if (proofs.length > 0) {
            const insights = proofs
              .slice(0, 15)
              .map((p: ConsolidatedProof, i: number) => transformProofToInsight(p, i));

            console.log(`[V5 InsightLoader] Received ${insights.length} proof insights from streaming manager`);
            this.mergeInsights(insights, 'proof');
            this.loadingStates.set('proof', false);
            this.notifyListeners();

            // Save after receiving proof
            this.saveToLocalStorage();
          }
        }
      };

      // Listen for proof updates
      proofStreamingManager.on('proof-update', proofHandler);

      // Start proof loading via streaming manager
      await proofStreamingManager.loadAllProof(
        brandId,
        brand.name || brand.brand_name || '',
        uvp || null,
        null, // deepContext - we don't have it here
        'national-saas-b2b' // Default profile type
      );

      // Remove listener after a timeout to prevent memory leaks
      setTimeout(() => {
        proofStreamingManager.removeListener('proof-update', proofHandler);
      }, 60000); // 1 minute timeout

    } catch (error) {
      console.error('[V5 InsightLoader] Proof load error:', error);
    } finally {
      // Don't set loading to false here - the handler will do it when data arrives
      // But set a timeout fallback in case no data comes
      setTimeout(() => {
        if (this.loadingStates.get('proof')) {
          this.loadingStates.set('proof', false);
          this.notifyListeners();
        }
      }, 30000); // 30 second fallback
    }
  }

  /**
   * Clear all loaded insights
   */
  clear(): void {
    this.insights = [];
    this.loadingStates.clear();
    this.currentConfig = null;
    this.lastRefresh = null;
    this.isFromCache = false;
    this.notifyListeners();
  }

  // ============================================================================
  // PERSISTENCE METHODS
  // ============================================================================

  /**
   * Save current insights to database and localStorage
   */
  async saveToDatabase(): Promise<{ success: boolean; savedCount: number }> {
    if (!this.currentConfig?.brandId || this.insights.length === 0) {
      console.log('[V5 InsightLoader] No insights to save or no brand configured');
      return { success: false, savedCount: 0 };
    }

    console.log(`[V5 InsightLoader] Saving ${this.insights.length} insights`);

    // Always save to localStorage first (fast, reliable)
    this.saveToLocalStorage();

    // Then try to save to database
    const result = await insightPersistenceService.saveInsights(
      this.currentConfig.brandId,
      this.insights
    );

    if (result.success) {
      this.lastRefresh = new Date();
      this.notifyListeners();
    }

    return result;
  }

  /**
   * Load insights from database cache (with localStorage fallback)
   * Returns true if cached data was found and loaded
   */
  async loadFromCache(): Promise<boolean> {
    if (!this.currentConfig?.brandId) {
      console.log('[V5 InsightLoader] No brand configured for cache load');
      return false;
    }

    const brandId = this.currentConfig.brandId;
    console.log('[V5 InsightLoader] Checking cache for brand:', brandId);

    // First try localStorage (fast, always available)
    const localStorageKey = `v5_insights_${brandId}`;
    try {
      const localCache = localStorage.getItem(localStorageKey);
      if (localCache) {
        const parsed = JSON.parse(localCache);
        if (parsed.insights && parsed.insights.length > 0) {
          // Check if cache is less than 24 hours old
          const cacheAge = Date.now() - (parsed.timestamp || 0);
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours

          if (cacheAge < maxAge) {
            console.log(`[V5 InsightLoader] Loaded ${parsed.insights.length} insights from localStorage cache`);
            // TRIGGERS 4.0: Clean hallucinated sources from cached data
            this.insights = parsed.insights.map(cleanInsightSource);
            this.isFromCache = true;
            this.lastRefresh = new Date(parsed.timestamp);
            this.loadingStates.clear();
            this.notifyListeners();
            return true;
          } else {
            console.log('[V5 InsightLoader] localStorage cache is stale (>24h)');
          }
        }
      }
    } catch (e) {
      console.warn('[V5 InsightLoader] localStorage read error:', e);
    }

    // Then try database
    try {
      console.log('[V5 InsightLoader] Checking database cache...');
      const cachedInsights = await insightPersistenceService.loadInsights(brandId);

      if (cachedInsights.length > 0) {
        console.log(`[V5 InsightLoader] Loaded ${cachedInsights.length} insights from database`);
        // TRIGGERS 4.0: Clean hallucinated sources from cached data
        this.insights = cachedInsights.map(cleanInsightSource);
        this.isFromCache = true;

        // Get refresh status
        const status = await insightPersistenceService.getRefreshStatus(brandId);
        this.lastRefresh = status.lastRefresh;

        // Clear loading states
        this.loadingStates.clear();
        this.notifyListeners();

        // Also save to localStorage for faster access next time
        this.saveToLocalStorage();
        return true;
      }
    } catch (e) {
      console.warn('[V5 InsightLoader] Database cache load error:', e);
    }

    console.log('[V5 InsightLoader] No cached insights found');
    return false;
  }

  /**
   * Save current insights to localStorage for fast cache access
   */
  private saveToLocalStorage(): void {
    if (!this.currentConfig?.brandId || this.insights.length === 0) return;

    const localStorageKey = `v5_insights_${this.currentConfig.brandId}`;
    try {
      localStorage.setItem(localStorageKey, JSON.stringify({
        insights: this.insights,
        timestamp: Date.now(),
      }));
      console.log(`[V5 InsightLoader] Saved ${this.insights.length} insights to localStorage`);
    } catch (e) {
      console.warn('[V5 InsightLoader] localStorage save error:', e);
    }
  }

  /**
   * Check if this is the first load for this brand (no cached data exists)
   */
  async needsInitialLoad(): Promise<boolean> {
    if (!this.currentConfig?.brandId) return true;
    return await insightPersistenceService.needsInitialLoad(this.currentConfig.brandId);
  }

  /**
   * Refresh all insights (clear cache and reload from APIs)
   */
  async refreshAllInsights(): Promise<void> {
    if (!this.currentConfig?.brandId) {
      console.error('[V5 InsightLoader] No brand configured for refresh');
      return;
    }

    console.log('[V5 InsightLoader] Refreshing all insights...');

    // Clear localStorage cache and API flag
    const localStorageKey = `v5_insights_${this.currentConfig.brandId}`;
    const apiCallFlagKey = `v5_api_called_${this.currentConfig.brandId}`;
    try {
      localStorage.removeItem(localStorageKey);
      localStorage.removeItem(apiCallFlagKey);
      console.log('[V5 InsightLoader] Cleared localStorage cache and API flag');
    } catch (e) {
      console.warn('[V5 InsightLoader] localStorage clear error:', e);
    }

    // Clear database cache
    await insightPersistenceService.clearInsights(this.currentConfig.brandId);

    // Clear local state
    this.insights = [];
    this.isFromCache = false;
    this.lastRefresh = null;
    this.notifyListeners();

    // Reload from APIs with force fresh
    const { brandId, brand, uvp } = this.currentConfig;

    // Set all as loading
    ['trigger', 'proof', 'trend', 'competitor', 'local', 'weather'].forEach(type => {
      this.loadingStates.set(type as InsightType, true);
    });
    this.notifyListeners();

    // Load triggers and proof
    this.loadTriggers(brandId, uvp);
    this.loadProof(brandId);

    // Trigger streaming API manager with force fresh
    streamingApiManager.loadAllApis(brandId, brand, { uvp, forceFresh: true }).catch(err => {
      console.warn('[V5 InsightLoader] Streaming API refresh error:', err);
    });
  }

  /**
   * Refresh insights of a specific type
   */
  async refreshInsightType(type: InsightType): Promise<void> {
    if (!this.currentConfig?.brandId) {
      console.error('[V5 InsightLoader] No brand configured for type refresh');
      return;
    }

    console.log(`[V5 InsightLoader] Refreshing ${type} insights...`);

    // Remove this type from localStorage cache (update the cache without this type)
    const localStorageKey = `v5_insights_${this.currentConfig.brandId}`;
    try {
      const localCache = localStorage.getItem(localStorageKey);
      if (localCache) {
        const parsed = JSON.parse(localCache);
        if (parsed.insights && Array.isArray(parsed.insights)) {
          // Filter out the type being refreshed
          parsed.insights = parsed.insights.filter((i: any) => i.type !== type);
          localStorage.setItem(localStorageKey, JSON.stringify(parsed));
          console.log(`[V5 InsightLoader] Removed ${type} from localStorage cache`);
        }
      }
    } catch (e) {
      console.warn('[V5 InsightLoader] localStorage update error:', e);
    }

    // Clear this type from database
    await insightPersistenceService.clearInsightsByType(this.currentConfig.brandId, type);

    // Remove this type from local state
    this.insights = this.insights.filter(i => i.type !== type);
    this.loadingStates.set(type, true);
    this.notifyListeners();

    const { brandId, uvp } = this.currentConfig;

    // Reload based on type
    switch (type) {
      case 'trigger':
        this.loadTriggers(brandId, uvp);
        break;
      case 'proof':
        this.loadProof(brandId);
        break;
      case 'trend':
        this.loadTrends();
        break;
      case 'competitor':
        this.loadCompetitors();
        break;
      case 'local':
        this.loadLocalNews();
        break;
      case 'weather':
        this.loadWeather();
        break;
    }
  }

  /**
   * Load trends by triggering streaming API manager
   * Listens for trend-related API updates
   * Phase 11: Check specialty profile first for V1-quality trends
   */
  private async loadTrends(): Promise<void> {
    const brand = this.currentConfig?.brand;
    const uvp = this.currentConfig?.uvp;
    const brandId = this.currentConfig?.brandId;

    if (!brand || !brandId) {
      console.warn('[V5 InsightLoader] No brand for trend refresh');
      this.loadingStates.set('trend', false);
      this.notifyListeners();
      return;
    }

    console.log('[V5 InsightLoader] Refreshing trends via streaming API manager...');

    // Phase 11: Check specialty profile first for V1-quality trends
    const specialtyProfile = await this.lookupSpecialtyProfile(brandId);
    if (specialtyProfile) {
      const specialtyTrends = this.convertSpecialtyProfileToTrends(specialtyProfile);
      if (specialtyTrends.length > 0) {
        console.log('[V5 InsightLoader] 🎯 Using specialty profile trends:', specialtyTrends.length);
        this.mergeInsights(specialtyTrends, 'trend');
        this.loadingStates.set('trend', false);
        this.notifyListeners();
        return; // Skip API calls if we have specialty profile trends
      }
    }

    // The streaming API manager already emits 'api-update' events which we handle in handleApiUpdate()
    // Just trigger a fresh load for news/trends
    streamingApiManager.loadAllApis(brandId, brand, { uvp, forceFresh: true }).catch(err => {
      console.warn('[V5 InsightLoader] Trend refresh error:', err);
      this.loadingStates.set('trend', false);
      this.notifyListeners();
    });

    // Set timeout fallback
    setTimeout(() => {
      if (this.loadingStates.get('trend')) {
        this.loadingStates.set('trend', false);
        this.notifyListeners();
      }
    }, 30000);
  }

  /**
   * Load competitors by triggering streaming API manager
   * Phase 12: Check specialty profile first for V1-quality competitor insights
   */
  private async loadCompetitors(): Promise<void> {
    const brand = this.currentConfig?.brand;
    const uvp = this.currentConfig?.uvp;
    const brandId = this.currentConfig?.brandId;

    if (!brand || !brandId) {
      console.warn('[V5 InsightLoader] No brand for competitor refresh');
      this.loadingStates.set('competitor', false);
      this.notifyListeners();
      return;
    }

    console.log('[V5 InsightLoader] Refreshing competitors via streaming API manager...');

    // Phase 12: Check specialty profile first for V1-quality competitor insights
    const specialtyProfile = await this.lookupSpecialtyProfile(brandId);
    if (specialtyProfile) {
      const specialtyCompetitors = this.convertSpecialtyProfileToCompetitors(specialtyProfile);
      if (specialtyCompetitors.length > 0) {
        console.log('[V5 InsightLoader] 🎯 Using specialty profile competitors:', specialtyCompetitors.length);
        this.mergeInsights(specialtyCompetitors, 'competitor');
        this.loadingStates.set('competitor', false);
        this.notifyListeners();
        return; // Skip API calls if we have specialty profile competitor insights
      }
    }

    // Trigger fresh load - competitor data comes via 'semrush-competitors' and 'competitor-voice' events
    streamingApiManager.loadAllApis(brandId, brand, { uvp, forceFresh: true }).catch(err => {
      console.warn('[V5 InsightLoader] Competitor refresh error:', err);
      this.loadingStates.set('competitor', false);
      this.notifyListeners();
    });

    // Set timeout fallback
    setTimeout(() => {
      if (this.loadingStates.get('competitor')) {
        this.loadingStates.set('competitor', false);
        this.notifyListeners();
      }
    }, 30000);
  }

  /**
   * Load local news by triggering streaming API manager
   * Phase 13: Uses geographic_variations from specialty profile as supplemental context
   */
  private async loadLocalNews(): Promise<void> {
    const brand = this.currentConfig?.brand;
    const uvp = this.currentConfig?.uvp;
    const brandId = this.currentConfig?.brandId;

    if (!brand || !brandId) {
      console.warn('[V5 InsightLoader] No brand for local news refresh');
      this.loadingStates.set('local', false);
      this.notifyListeners();
      return;
    }

    console.log('[V5 InsightLoader] Refreshing local news via streaming API manager...');

    // Phase 13: Add specialty profile geographic variations as supplemental insights
    const specialtyProfile = await this.lookupSpecialtyProfile(brandId);
    if (specialtyProfile) {
      const localInsights = this.convertSpecialtyProfileToLocal(specialtyProfile);
      if (localInsights.length > 0) {
        console.log('[V5 InsightLoader] 🎯 Adding specialty profile local context:', localInsights.length);
        // Merge with existing - don't return early, still fetch real-time local news
        this.mergeInsights(localInsights, 'local');
      }
    }

    // Local news comes via 'serper-news' events filtered by location
    streamingApiManager.loadAllApis(brandId, brand, { uvp, forceFresh: true }).catch(err => {
      console.warn('[V5 InsightLoader] Local news refresh error:', err);
      this.loadingStates.set('local', false);
      this.notifyListeners();
    });

    // Set timeout fallback
    setTimeout(() => {
      if (this.loadingStates.get('local')) {
        this.loadingStates.set('local', false);
        this.notifyListeners();
      }
    }, 30000);
  }

  /**
   * Load weather by triggering streaming API manager
   * Phase 13: Uses seasonal_patterns from specialty profile as supplemental context
   */
  private async loadWeather(): Promise<void> {
    const brand = this.currentConfig?.brand;
    const uvp = this.currentConfig?.uvp;
    const brandId = this.currentConfig?.brandId;

    if (!brand || !brandId) {
      console.warn('[V5 InsightLoader] No brand for weather refresh');
      this.loadingStates.set('weather', false);
      this.notifyListeners();
      return;
    }

    console.log('[V5 InsightLoader] Refreshing weather via streaming API manager...');

    // Phase 13: Add specialty profile seasonal patterns as weather-related insights
    const specialtyProfile = await this.lookupSpecialtyProfile(brandId);
    if (specialtyProfile) {
      const weatherInsights = this.convertSpecialtyProfileToWeather(specialtyProfile);
      if (weatherInsights.length > 0) {
        console.log('[V5 InsightLoader] 🎯 Adding specialty profile weather context:', weatherInsights.length);
        // Merge with existing - don't return early, still fetch real-time weather
        this.mergeInsights(weatherInsights, 'weather');
      }
    }

    // Weather comes via 'weather-conditions' events
    streamingApiManager.loadAllApis(brandId, brand, { uvp, forceFresh: true }).catch(err => {
      console.warn('[V5 InsightLoader] Weather refresh error:', err);
      this.loadingStates.set('weather', false);
      this.notifyListeners();
    });

    // Set timeout fallback
    setTimeout(() => {
      if (this.loadingStates.get('weather')) {
        this.loadingStates.set('weather', false);
        this.notifyListeners();
      }
    }, 30000);
  }

  /**
   * Get refresh status for the current brand
   */
  async getRefreshStatus() {
    if (!this.currentConfig?.brandId) return null;
    return await insightPersistenceService.getRefreshStatus(this.currentConfig.brandId);
  }

  // ==========================================================================
  // PHASE 11/12: SPECIALTY PROFILE INTEGRATION
  // ==========================================================================

  /**
   * Look up specialty profile by brand_id
   */
  private async lookupSpecialtyProfile(brandId: string): Promise<SpecialtyProfileRow | null> {
    try {
      console.log(`[V5 InsightLoader] Looking up specialty profile for brand: ${brandId}`);

      const { data, error } = await supabase
        .from('specialty_profiles')
        .select('*')
        .eq('brand_id', brandId)
        .eq('generation_status', 'complete')
        .maybeSingle();

      if (error) {
        console.error('[V5 InsightLoader] Error looking up specialty profile:', error);
        return null;
      }

      if (!data) {
        console.log('[V5 InsightLoader] No specialty profile found for brand');
        return null;
      }

      console.log(`[V5 InsightLoader] ✅ Found specialty profile: ${data.specialty_name}`);
      return data as SpecialtyProfileRow;
    } catch (err) {
      console.error('[V5 InsightLoader] Failed to lookup specialty profile:', err);
      return null;
    }
  }

  /**
   * Convert specialty profile data to trend insights
   * Uses: market_trends, seasonal_patterns, innovation_opportunities
   */
  private convertSpecialtyProfileToTrends(profile: SpecialtyProfileRow): Insight[] {
    const insights: Insight[] = [];
    const profileData = profile.profile_data as Record<string, unknown> | null;

    console.log('[V5 InsightLoader] Converting specialty profile to trends');

    // Convert market_trends
    const marketTrends = profileData?.market_trends as string[] | undefined;
    if (marketTrends && Array.isArray(marketTrends)) {
      marketTrends.forEach((trend, idx) => {
        insights.push({
          id: `specialty-trend-${idx}`,
          type: 'trend' as InsightType,
          text: trend,
          source: 'Industry Analysis',
          relevanceScore: 85,
          velocity: 'rising' as const,
          recencyDays: 7,
        });
      });
      console.log(`  - market_trends: ${marketTrends.length} insights`);
    }

    // Convert seasonal_patterns
    const seasonalPatterns = profileData?.seasonal_patterns as Array<{ season: string; pattern: string; impact: string }> | undefined;
    if (seasonalPatterns && Array.isArray(seasonalPatterns)) {
      seasonalPatterns.forEach((pattern, idx) => {
        insights.push({
          id: `specialty-seasonal-${idx}`,
          type: 'trend' as InsightType,
          text: `${pattern.season}: ${pattern.pattern}`,
          source: 'Seasonal Analysis',
          relevanceScore: pattern.impact === 'high' ? 90 : pattern.impact === 'medium' ? 75 : 60,
          velocity: 'stable' as const,
          recencyDays: 30,
        });
      });
      console.log(`  - seasonal_patterns: ${seasonalPatterns.length} insights`);
    }

    // Convert innovation_opportunities
    const innovationOpps = profileData?.innovation_opportunities as string[] | undefined;
    if (innovationOpps && Array.isArray(innovationOpps)) {
      innovationOpps.forEach((opp, idx) => {
        insights.push({
          id: `specialty-innovation-${idx}`,
          type: 'trend' as InsightType,
          text: opp,
          source: 'Innovation Opportunity',
          relevanceScore: 80,
          velocity: 'emerging' as const,
          recencyDays: 14,
        });
      });
      console.log(`  - innovation_opportunities: ${innovationOpps.length} insights`);
    }

    console.log(`[V5 InsightLoader] Converted ${insights.length} total trend insights from specialty profile`);
    return insights;
  }

  /**
   * Convert specialty profile data to competitor insights
   * Uses: competitive_advantages, differentiators, objection_handlers
   */
  private convertSpecialtyProfileToCompetitors(profile: SpecialtyProfileRow): Insight[] {
    const insights: Insight[] = [];
    const profileData = profile.profile_data as Record<string, unknown> | null;

    console.log('[V5 InsightLoader] Converting specialty profile to competitor insights');

    // Convert competitive_advantages to competitor differentiation insights
    const advantages = profileData?.competitive_advantages as string[] | undefined;
    if (advantages && Array.isArray(advantages)) {
      advantages.forEach((adv, idx) => {
        insights.push({
          id: `specialty-advantage-${idx}`,
          type: 'competitor' as InsightType,
          text: `Your Advantage: ${adv}`,
          source: 'Competitive Analysis',
          relevanceScore: 85,
        });
      });
      console.log(`  - competitive_advantages: ${advantages.length} insights`);
    }

    // Convert objection_handlers to competitor positioning insights
    if (profile.objection_handlers && Array.isArray(profile.objection_handlers)) {
      profile.objection_handlers.slice(0, 5).forEach((handler, idx) => {
        insights.push({
          id: `specialty-objection-competitor-${idx}`,
          type: 'competitor' as InsightType,
          text: `Counter: "${handler.objection}" → ${handler.response}`,
          source: 'Competitive Positioning',
          relevanceScore: handler.effectiveness,
        });
      });
      console.log(`  - objection_handlers: ${Math.min(profile.objection_handlers.length, 5)} insights`);
    }

    console.log(`[V5 InsightLoader] Converted ${insights.length} total competitor insights from specialty profile`);
    return insights;
  }

  /**
   * Convert specialty profile data to local insights
   * Uses: geographic_variations from profile_data
   */
  private convertSpecialtyProfileToLocal(profile: SpecialtyProfileRow): Insight[] {
    const insights: Insight[] = [];
    const profileData = profile.profile_data as Record<string, unknown> | null;

    console.log('[V5 InsightLoader] Converting specialty profile to local insights');

    // Convert geographic_variations
    const geoVariations = profileData?.geographic_variations as string[] | undefined;
    if (geoVariations && Array.isArray(geoVariations)) {
      geoVariations.forEach((variation, idx) => {
        insights.push({
          id: `specialty-local-${idx}`,
          type: 'local' as InsightType,
          text: variation,
          source: 'Regional Analysis',
          relevanceScore: 80,
        });
      });
      console.log(`  - geographic_variations: ${geoVariations.length} insights`);
    }

    console.log(`[V5 InsightLoader] Converted ${insights.length} total local insights from specialty profile`);
    return insights;
  }

  /**
   * Convert specialty profile data to weather insights
   * Uses: seasonal_patterns from profile_data (reframed as weather-related timing)
   */
  private convertSpecialtyProfileToWeather(profile: SpecialtyProfileRow): Insight[] {
    const insights: Insight[] = [];
    const profileData = profile.profile_data as Record<string, unknown> | null;

    console.log('[V5 InsightLoader] Converting specialty profile to weather insights');

    // Convert seasonal_patterns to weather-related insights
    const seasonalPatterns = profileData?.seasonal_patterns as Array<{ season: string; pattern: string; impact: string }> | undefined;
    if (seasonalPatterns && Array.isArray(seasonalPatterns)) {
      seasonalPatterns.forEach((pattern, idx) => {
        insights.push({
          id: `specialty-weather-${idx}`,
          type: 'weather' as InsightType,
          text: `${pattern.season} Impact: ${pattern.pattern}`,
          source: 'Seasonal Pattern',
          relevanceScore: pattern.impact === 'high' ? 90 : pattern.impact === 'medium' ? 75 : 60,
        });
      });
      console.log(`  - seasonal_patterns: ${seasonalPatterns.length} insights`);
    }

    console.log(`[V5 InsightLoader] Converted ${insights.length} total weather insights from specialty profile`);
    return insights;
  }
}

// Export singleton instance
export const insightLoaderService = new InsightLoaderService();

// Expose to window for debugging/manual save
if (typeof window !== 'undefined') {
  (window as any).insightLoaderService = insightLoaderService;
  (window as any).forceSaveInsights = () => {
    console.log('[V5 InsightLoader] Manual save triggered from console');
    return insightLoaderService.saveToDatabase();
  };
}

// Export types for use in components
export type { Insight, InsightType };
