/**
 * Angle Discovery Service
 *
 * Surfaces "I didn't think of that" insights using 5 discovery methods.
 * Uses PARALLEL execution across 4 OpenRouter keys for 4x speed.
 *
 * Discovery Methods:
 * 1. Contrarian Flip - Challenge consensus opinions
 * 2. Adjacent Industry Transplant - Borrow from related industries
 * 3. Semantic Gap Analysis - Find unaddressed customer needs
 * 4. Hidden Data Correlation - Connect non-obvious signals
 * 5. Predictive Trend Detection - Spot emerging opportunities
 */

import { parallelLLMManager, type LLMRequest } from './parallel-llm-manager.service';
import type { CorrelatedInsight, RawSignal, DataSource } from '@/types/intelligence.types';

// ============================================================================
// Types
// ============================================================================

export type AngleType =
  | 'contrarian'
  | 'adjacent-industry'
  | 'semantic-gap'
  | 'hidden-correlation'
  | 'predictive-trend'
  // Synapse 2.0 additions
  | 'executive-voice'  // From SEC filings - executive priorities & risk factors
  | 'performance-pattern';  // From BuzzSumo - proven content formats

export interface DiscoveredAngle {
  id: string;
  type: AngleType;
  title: string;
  description: string;
  reasoning: string;
  dataBacking: string;
  supportingSignals: RawSignal[];
  noveltyScore: number; // 0-100
  confidence: number; // 0-1
  suggestedHeadlines: string[];
  relatedInsights: string[]; // IDs of correlated insights
  createdAt: Date;
}

export interface AngleDiscoveryConfig {
  minNoveltyScore: number;
  maxAnglesPerMethod: number;
  enabledMethods: AngleType[];
  industryContext?: string;
  adjacentIndustries?: string[];
}

export interface AngleDiscoveryResult {
  angles: DiscoveredAngle[];
  stats: {
    methodsRun: AngleType[];
    anglesDiscovered: number;
    totalTimeMs: number;
    avgNoveltyScore: number;
  };
}

export interface IndustryContext {
  industry: string;
  adjacentIndustries: string[];
  competitorTopics: string[];
  customerPainPoints: string[];
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: AngleDiscoveryConfig = {
  minNoveltyScore: 60,
  maxAnglesPerMethod: 3,
  enabledMethods: [
    'contrarian',
    'adjacent-industry',
    'semantic-gap',
    'hidden-correlation',
    'predictive-trend',
    // Synapse 2.0 additions
    'executive-voice',
    'performance-pattern',
  ],
};

// Adjacent industry mappings
const ADJACENT_INDUSTRIES: Record<string, string[]> = {
  'consulting': ['saas', 'coaching', 'professional-services', 'training'],
  'accounting': ['legal', 'financial-planning', 'bookkeeping', 'consulting'],
  'marketing-agency': ['design-agency', 'saas', 'consulting', 'pr'],
  'restaurant': ['hospitality', 'catering', 'food-delivery', 'events'],
  'fitness': ['wellness', 'nutrition', 'physical-therapy', 'sports'],
  'saas': ['consulting', 'it-services', 'training', 'platform'],
  'ecommerce': ['retail', 'dtc', 'logistics', 'marketplace'],
  'real-estate': ['mortgage', 'insurance', 'legal', 'home-services'],
  'healthcare': ['wellness', 'insurance', 'pharmacy', 'telehealth'],
  'legal': ['accounting', 'consulting', 'compliance', 'hr'],
};

// ============================================================================
// Angle Discovery Service
// ============================================================================

class AngleDiscoveryService {
  private config: AngleDiscoveryConfig;

  constructor(config: Partial<AngleDiscoveryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Discover unique angles from correlated insights
   * Uses PARALLEL execution across all 5 methods (4 keys)
   */
  async discoverAngles(
    insights: CorrelatedInsight[],
    context: IndustryContext,
    config?: Partial<AngleDiscoveryConfig>
  ): Promise<AngleDiscoveryResult> {
    const startTime = Date.now();
    const mergedConfig = { ...this.config, ...config };

    console.log(`[AngleDiscovery] Starting parallel discovery with ${insights.length} insights...`);

    // Build all discovery requests in parallel
    const requests: Array<{
      method: AngleType;
      request: LLMRequest;
    }> = [];

    if (mergedConfig.enabledMethods.includes('contrarian')) {
      requests.push({
        method: 'contrarian',
        request: this.buildContrarianRequest(insights),
      });
    }

    if (mergedConfig.enabledMethods.includes('adjacent-industry')) {
      requests.push({
        method: 'adjacent-industry',
        request: this.buildAdjacentIndustryRequest(insights, context),
      });
    }

    if (mergedConfig.enabledMethods.includes('semantic-gap')) {
      requests.push({
        method: 'semantic-gap',
        request: this.buildSemanticGapRequest(insights, context),
      });
    }

    if (mergedConfig.enabledMethods.includes('hidden-correlation')) {
      requests.push({
        method: 'hidden-correlation',
        request: this.buildHiddenCorrelationRequest(insights),
      });
    }

    if (mergedConfig.enabledMethods.includes('predictive-trend')) {
      requests.push({
        method: 'predictive-trend',
        request: this.buildPredictiveTrendRequest(insights),
      });
    }

    // Synapse 2.0: Executive Voice (from SEC filings)
    if (mergedConfig.enabledMethods.includes('executive-voice')) {
      requests.push({
        method: 'executive-voice',
        request: this.buildExecutiveVoiceRequest(insights, context),
      });
    }

    // Synapse 2.0: Performance Pattern (from content performance data)
    if (mergedConfig.enabledMethods.includes('performance-pattern')) {
      requests.push({
        method: 'performance-pattern',
        request: this.buildPerformancePatternRequest(insights),
      });
    }

    // Execute ALL discovery methods in parallel across 4 keys
    const llmRequests = requests.map(r => r.request);
    const batchResult = await parallelLLMManager.executeParallel<{
      angles: Array<{
        title: string;
        description: string;
        reasoning: string;
        dataBacking: string;
        noveltyScore: number;
        suggestedHeadlines: string[];
      }>;
    }>(llmRequests);

    // Process results
    const allAngles: DiscoveredAngle[] = [];

    for (let i = 0; i < requests.length; i++) {
      const { method } = requests[i];
      const response = batchResult.results[i];

      if (response.success && response.data?.angles) {
        const methodAngles = response.data.angles
          .slice(0, mergedConfig.maxAnglesPerMethod)
          .filter(a => a.noveltyScore >= mergedConfig.minNoveltyScore)
          .map((a, idx) => this.createDiscoveredAngle(a, method, insights, idx));

        allAngles.push(...methodAngles);
      }
    }

    // Sort by novelty score
    allAngles.sort((a, b) => b.noveltyScore - a.noveltyScore);

    const totalTimeMs = Date.now() - startTime;
    const avgNoveltyScore = allAngles.length > 0
      ? allAngles.reduce((sum, a) => sum + a.noveltyScore, 0) / allAngles.length
      : 0;

    console.log(`[AngleDiscovery] ✅ Discovered ${allAngles.length} angles in ${(totalTimeMs / 1000).toFixed(1)}s`);

    return {
      angles: allAngles,
      stats: {
        methodsRun: requests.map(r => r.method),
        anglesDiscovered: allAngles.length,
        totalTimeMs,
        avgNoveltyScore,
      },
    };
  }

  // ============================================================================
  // Discovery Method Builders
  // ============================================================================

  /**
   * Method 1: Contrarian Flip
   * Find consensus opinions and generate supported opposing viewpoints
   */
  private buildContrarianRequest(insights: CorrelatedInsight[]): LLMRequest {
    const insightSummaries = insights
      .slice(0, 10)
      .map(i => `- ${i.title}: ${i.description}`)
      .join('\n');

    return {
      prompt: `Analyze these content insights and find CONTRARIAN angles - viewpoints that challenge the consensus but can be supported with data.

INSIGHTS:
${insightSummaries}

For each contrarian angle, find:
1. What's the consensus/common advice?
2. What's a valid opposing viewpoint?
3. What data could support the contrarian take?

Return JSON:
{
  "angles": [
    {
      "title": "Contrarian angle title (provocative but defensible)",
      "description": "2-3 sentences explaining the contrarian take",
      "reasoning": "Why this challenges the consensus",
      "dataBacking": "What evidence supports this contrarian view",
      "noveltyScore": 60-100 based on how unexpected this is,
      "suggestedHeadlines": ["headline1", "headline2", "headline3"]
    }
  ]
}

Find 2-3 contrarian angles. Be bold but defensible.`,
      systemPrompt: this.getSystemPrompt(),
      responseFormat: 'json',
      temperature: 0.7, // Higher for creativity
    };
  }

  /**
   * Method 2: Adjacent Industry Transplant
   * Find successful patterns from related industries
   */
  private buildAdjacentIndustryRequest(
    insights: CorrelatedInsight[],
    context: IndustryContext
  ): LLMRequest {
    const adjacentList = context.adjacentIndustries?.length
      ? context.adjacentIndustries.join(', ')
      : ADJACENT_INDUSTRIES[context.industry]?.join(', ') || 'saas, consulting, retail';

    const insightTopics = insights
      .slice(0, 8)
      .map(i => i.title)
      .join(', ');

    return {
      prompt: `Find content angle transplants from adjacent industries that could work for ${context.industry}.

TARGET INDUSTRY: ${context.industry}
ADJACENT INDUSTRIES TO BORROW FROM: ${adjacentList}
CURRENT TOPICS IN INSIGHTS: ${insightTopics}

For each transplant angle:
1. What works well in the adjacent industry?
2. How would it translate to ${context.industry}?
3. Why hasn't anyone done this yet?

Return JSON:
{
  "angles": [
    {
      "title": "Transplant angle title",
      "description": "How this industry pattern applies to ${context.industry}",
      "reasoning": "Why this works in [adjacent industry] and why it would work here",
      "dataBacking": "Evidence from the source industry",
      "noveltyScore": 60-100 based on how fresh this crossover is,
      "suggestedHeadlines": ["headline1", "headline2", "headline3"]
    }
  ]
}

Find 2-3 transplant angles. Focus on proven patterns that haven't crossed over yet.`,
      systemPrompt: this.getSystemPrompt(),
      responseFormat: 'json',
      temperature: 0.6,
    };
  }

  /**
   * Method 3: Semantic Gap Analysis
   * Find themes customers discuss that no one addresses
   */
  private buildSemanticGapRequest(
    insights: CorrelatedInsight[],
    context: IndustryContext
  ): LLMRequest {
    const customerVoice = insights
      .filter(i => i.sources.includes('reddit' as DataSource) || i.sources.includes('youtube' as DataSource))
      .slice(0, 10)
      .map(i => `- ${i.title}: ${i.description}`)
      .join('\n');

    const competitorTopics = context.competitorTopics?.length
      ? context.competitorTopics.join(', ')
      : 'general industry topics';

    return {
      prompt: `Identify SEMANTIC GAPS - topics customers talk about that competitors don't address.

CUSTOMER VOICE (from reviews, Reddit, YouTube):
${customerVoice || 'Various customer discussions and complaints'}

COMPETITOR CONTENT TOPICS: ${competitorTopics}

For each gap:
1. What are customers asking about/complaining about?
2. Is any competitor addressing this?
3. Why is this a content opportunity?

Return JSON:
{
  "angles": [
    {
      "title": "Gap angle title",
      "description": "What customers need that no one provides",
      "reasoning": "Why this gap exists and why it matters",
      "dataBacking": "Customer voice evidence showing the demand",
      "noveltyScore": 60-100 based on gap size and opportunity,
      "suggestedHeadlines": ["headline1", "headline2", "headline3"]
    }
  ]
}

Find 2-3 semantic gap angles. Focus on unmet needs with clear demand signals.`,
      systemPrompt: this.getSystemPrompt(),
      responseFormat: 'json',
      temperature: 0.5,
    };
  }

  /**
   * Method 4: Hidden Data Correlation
   * Combine signals that don't obviously connect
   */
  private buildHiddenCorrelationRequest(insights: CorrelatedInsight[]): LLMRequest {
    // Get diverse signal sources
    const signalsBySource: Record<string, string[]> = {};
    for (const insight of insights) {
      for (const signal of insight.signals || []) {
        if (!signalsBySource[signal.source]) {
          signalsBySource[signal.source] = [];
        }
        signalsBySource[signal.source].push(signal.content.substring(0, 100));
      }
    }

    const signalSummary = Object.entries(signalsBySource)
      .map(([source, signals]) => `${source}: ${signals.slice(0, 3).join(' | ')}`)
      .join('\n');

    return {
      prompt: `Find HIDDEN CORRELATIONS between seemingly unrelated data signals.

SIGNALS BY SOURCE:
${signalSummary}

Look for non-obvious connections:
- Weather + engagement patterns
- Timing + sentiment
- News events + pain points
- Geographic + behavioral

For each correlation:
1. What two things connect that don't seem related?
2. What's the underlying mechanism?
3. How can content exploit this?

Return JSON:
{
  "angles": [
    {
      "title": "Hidden correlation angle",
      "description": "The unexpected connection and its implications",
      "reasoning": "Why these things are actually connected",
      "dataBacking": "The data that reveals this correlation",
      "noveltyScore": 60-100 based on how unexpected the connection is,
      "suggestedHeadlines": ["headline1", "headline2", "headline3"]
    }
  ]
}

Find 2-3 hidden correlation angles. The weirder the connection, the better (if valid).`,
      systemPrompt: this.getSystemPrompt(),
      responseFormat: 'json',
      temperature: 0.7,
    };
  }

  /**
   * Method 5: Predictive Trend Detection
   * Identify signals with rising velocity (not yet mainstream)
   */
  private buildPredictiveTrendRequest(insights: CorrelatedInsight[]): LLMRequest {
    const trendSignals = insights
      .filter(i =>
        i.sources.includes('google-trends' as DataSource) ||
        i.sources.includes('news' as DataSource) ||
        i.title.toLowerCase().includes('trend')
      )
      .slice(0, 8)
      .map(i => `- ${i.title} (score: ${i.opportunityScore}, sources: ${i.sources.join(', ')})`)
      .join('\n');

    const allTopics = insights.map(i => i.title).join(', ');

    return {
      prompt: `Identify PREDICTIVE TRENDS - topics rising in velocity but not yet mainstream.

TREND-RELATED INSIGHTS:
${trendSignals || 'Various emerging signals'}

ALL CURRENT TOPICS: ${allTopics}

For each predictive trend:
1. What signals show early momentum?
2. What's the 2-4 week outlook?
3. How to position content before it peaks?

Return JSON:
{
  "angles": [
    {
      "title": "Emerging trend angle",
      "description": "What's rising and why it matters now",
      "reasoning": "Early signals that indicate this is emerging",
      "dataBacking": "Velocity/growth metrics supporting the prediction",
      "noveltyScore": 60-100 based on how early/actionable this is,
      "suggestedHeadlines": ["headline1", "headline2", "headline3"]
    }
  ]
}

Find 2-3 predictive trend angles. Focus on 2-4 week lead time opportunities.`,
      systemPrompt: this.getSystemPrompt(),
      responseFormat: 'json',
      temperature: 0.6,
    };
  }

  /**
   * Method 6: Executive Voice Mining (Synapse 2.0)
   * Extract content angles from SEC filings - risk factors, strategic priorities
   */
  private buildExecutiveVoiceRequest(
    insights: CorrelatedInsight[],
    context: IndustryContext
  ): LLMRequest {
    // Look for SEC-related insights or business signals
    const businessSignals = insights
      .filter(i =>
        i.sources.some((s: DataSource) => s === 'sec-edgar' as DataSource || s === 'linkedin' as DataSource || s === 'news' as DataSource) ||
        i.title.toLowerCase().includes('risk') ||
        i.title.toLowerCase().includes('strategic') ||
        i.title.toLowerCase().includes('priority')
      )
      .slice(0, 8)
      .map(i => `- ${i.title}: ${i.description}`)
      .join('\n');

    return {
      prompt: `Mine EXECUTIVE VOICE for content angles - what executives/leaders are prioritizing and worried about.

INDUSTRY: ${context.industry}
CUSTOMER PAIN POINTS: ${context.customerPainPoints?.slice(0, 5).join(', ') || 'various challenges'}

BUSINESS/EXECUTIVE SIGNALS:
${businessSignals || 'Various strategic and risk-related signals'}

Find content angles based on:
1. What executives publicly worry about (risk factors)
2. What companies are investing in (strategic priorities)
3. What leadership teams are hiring for (capability gaps)

For each executive voice angle:
1. What's the executive-level concern or priority?
2. How does this translate to a customer benefit?
3. Why does having this insider perspective give content credibility?

Return JSON:
{
  "angles": [
    {
      "title": "Executive voice angle title",
      "description": "How to turn executive priorities into customer-focused content",
      "reasoning": "Why this executive concern matters to customers",
      "dataBacking": "Evidence from filings, news, or industry signals",
      "noveltyScore": 60-100 based on how unique this executive perspective is,
      "suggestedHeadlines": ["headline1", "headline2", "headline3"]
    }
  ]
}

Find 2-3 executive voice angles. Focus on credibility through insider perspective.`,
      systemPrompt: this.getSystemPrompt(),
      responseFormat: 'json',
      temperature: 0.6,
    };
  }

  /**
   * Method 7: Performance Pattern Mining (Synapse 2.0)
   * Extract content angles from proven high-performing content patterns
   */
  private buildPerformancePatternRequest(insights: CorrelatedInsight[]): LLMRequest {
    // Look for engagement/performance signals
    const performanceSignals = insights
      .filter(i =>
        i.sources.some((s: DataSource) => s === 'buzzsumo' as DataSource || s === 'youtube' as DataSource) ||
        i.opportunityScore > 70 ||
        i.title.toLowerCase().includes('engagement') ||
        i.title.toLowerCase().includes('viral') ||
        i.title.toLowerCase().includes('shares')
      )
      .slice(0, 8)
      .map(i => `- ${i.title} (score: ${i.opportunityScore})`)
      .join('\n');

    const allTitles = insights.slice(0, 15).map(i => i.title).join(', ');

    return {
      prompt: `Identify PERFORMANCE PATTERNS from high-engagement content for replicable angle templates.

HIGH-PERFORMING SIGNALS:
${performanceSignals || 'Various high-engagement content signals'}

ALL INSIGHT TOPICS: ${allTitles}

Analyze patterns in content that performs well:
1. Headline structures that get clicks
2. Topic framings that drive shares
3. Angle types that generate engagement

For each performance pattern angle:
1. What's the pattern that works?
2. How can we apply it to our topics?
3. What makes this pattern replicable?

Return JSON:
{
  "angles": [
    {
      "title": "Performance pattern angle title",
      "description": "A proven content pattern applied to our industry",
      "reasoning": "Why this pattern works and is replicable",
      "dataBacking": "Performance data supporting this pattern",
      "noveltyScore": 60-100 based on how actionable this pattern is,
      "suggestedHeadlines": ["headline1", "headline2", "headline3"]
    }
  ]
}

Find 2-3 performance pattern angles. Focus on proven, replicable patterns.`,
      systemPrompt: this.getSystemPrompt(),
      responseFormat: 'json',
      temperature: 0.5,
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getSystemPrompt(): string {
    return `You are an expert content strategist specializing in discovering unique angles that competitors miss.

Your job is to find "I didn't think of that" moments - angles that are:
1. Non-obvious but valid
2. Supported by data
3. Actionable for content creation
4. High novelty (unexpected)

Be creative but always grounded in evidence. Return valid JSON only.`;
  }

  private createDiscoveredAngle(
    raw: {
      title: string;
      description: string;
      reasoning: string;
      dataBacking: string;
      noveltyScore: number;
      suggestedHeadlines: string[];
    },
    method: AngleType,
    insights: CorrelatedInsight[],
    index: number
  ): DiscoveredAngle {
    return {
      id: `angle_${method}_${Date.now()}_${index}`,
      type: method,
      title: raw.title,
      description: raw.description,
      reasoning: raw.reasoning,
      dataBacking: raw.dataBacking,
      supportingSignals: [], // Will be populated if we trace back
      noveltyScore: Math.min(100, Math.max(0, raw.noveltyScore)),
      confidence: raw.noveltyScore / 100 * 0.85, // Scale to confidence
      suggestedHeadlines: raw.suggestedHeadlines || [],
      relatedInsights: insights.slice(0, 3).map(i => i.id),
      createdAt: new Date(),
    };
  }

  /**
   * Get adjacent industries for a given industry
   */
  getAdjacentIndustries(industry: string): string[] {
    return ADJACENT_INDUSTRIES[industry.toLowerCase()] || [];
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AngleDiscoveryConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
export const angleDiscovery = new AngleDiscoveryService();

// Export class for testing
export { AngleDiscoveryService };
