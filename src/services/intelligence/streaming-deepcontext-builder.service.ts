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
import type { DeepContext } from '@/types/synapse/deepContext.types';
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
  private dataPoints: DataPoint[] = [];
  private completedApis: Set<string> = new Set();
  private startTime: number = 0;
  private onProgress: StreamingCallback | null = null;
  private currentContext: DeepContext | null = null;

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
    const uvpDataPoints = await this.loadUVPData();
    if (uvpDataPoints.length > 0) {
      console.log(`[Streaming] Loaded ${uvpDataPoints.length} UVP data points as baseline`);
      this.dataPoints.push(...uvpDataPoints);
      this.completedApis.add('uvp');
      this.currentContext = await this.buildContextFromDataPoints();
      this.notifyProgress(false); // Immediate first update with UVP data
    }

    // 2. Determine which APIs to use based on business type
    const businessType = config.businessType || this.detectBusinessType();
    const apisToRun = this.getApisForBusinessType(businessType);

    console.log(`[Streaming] Running ${apisToRun.length} APIs for ${businessType} business:`, apisToRun);

    // 3. Fire ALL APIs simultaneously - each reports independently
    const apiPromises = apisToRun.map(api => this.runApiWithCallback(api, config));

    // Wait for all to complete (but UI updates as each finishes)
    await Promise.allSettled(apiPromises);

    // Final progress update
    this.notifyProgress(true);

    console.log(`[Streaming] Complete! ${this.dataPoints.length} data points in ${Date.now() - this.startTime}ms`);

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
      newsResult.value.slice(0, 5).forEach((article: any, idx: number) => {
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
      autocompleteResult.value.slice(0, 5).forEach((suggestion: string, idx: number) => {
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
    const keywords = this.brandData.keywords || [this.brandData.industry];

    try {
      const trends = await YouTubeAPI.analyzeVideoTrends(this.brandData.industry, keywords);

      trends.trending_topics.slice(0, 5).forEach((topic: string, idx: number) => {
        dataPoints.push({
          id: `youtube-topic-${Date.now()}-${idx}`,
          source: 'youtube' as DataSource,
          type: 'trending_topic' as DataPointType,
          content: topic,
          metadata: { platform: 'youtube' },
          createdAt: new Date()
        });
      });

      trends.content_angles.slice(0, 5).forEach((angle: string, idx: number) => {
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

      metrics.opportunities.slice(0, 5).forEach((opp: any, idx: number) => {
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

      articles.slice(0, 5).forEach((article: any, idx: number) => {
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

    try {
      // Use Serper to search for LinkedIn content about the industry
      const query = `site:linkedin.com ${this.brandData.industry} insights tips`;
      const results = await SerperAPI.searchGoogle(query);

      results.slice(0, 5).forEach((result: any, idx: number) => {
        dataPoints.push({
          id: `linkedin-${Date.now()}-${idx}`,
          source: 'linkedin' as DataSource,
          type: 'trending_topic' as DataPointType,
          content: result.title,
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

      // CRITICAL: Use TARGET CUSTOMER context, not industry
      // Apply JTBD (Jobs to be Done), Golden Circle, and Value Proposition frameworks
      const targetCustomer = this.uvpData?.target_customer || '';
      const transformation = this.uvpData?.transformation || '';
      const customerProblem = transformation.split('→')[0]?.trim() || '';
      const desiredOutcome = transformation.split('→')[1]?.trim() || '';
      const uniqueSolution = this.uvpData?.unique_solution || '';
      const keyBenefit = this.uvpData?.key_benefit || '';

      // Build customer-focused query using JTBD framework
      // JTBD: "When [situation], I want to [motivation], so I can [expected outcome]"
      const customerContext = targetCustomer || this.brandData.industry;
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
        max_results: 5
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
        const hasPending = localStorage.getItem('marba_uvp_pending') === 'true';
        if (hasPending) {
          const sessionId = localStorage.getItem('marba_session_id');
          if (sessionId) {
            const localUvpData = localStorage.getItem(`marba_uvp_${sessionId}`);
            if (localUvpData) {
              try {
                const pendingUVP = JSON.parse(localUvpData);
                console.log('[Streaming/uvp] Found pending UVP in localStorage, using that');

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
              } catch (err) {
                console.error('[Streaming/uvp] Failed to parse localStorage UVP:', err);
              }
            }
          }
        }

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
}

// Export singleton
export const streamingDeepContextBuilder = new StreamingDeepContextBuilder();
