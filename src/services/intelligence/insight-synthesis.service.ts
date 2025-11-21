/**
 * Insight Synthesis Service
 *
 * Uses Claude AI to extract specific, actionable insights from raw data points
 * with proper provenance and real evidence.
 *
 * Uses ai-proxy Edge Function for secure API calls (no exposed keys)
 */

import type { DataPoint } from '@/types/connections.types';
import type {
  DeepContext,
  IndustryTrend,
  UnarticuatedNeed,
  CompetitorBlindSpot,
  MarketGap
} from '@/types/synapse/deepContext.types';

interface SynthesisPromptContext {
  brandName: string;
  industry: string;
  dataPointCount: number;
  dataPointSample: string;
}

class InsightSynthesisService {
  private readonly SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  private readonly SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  constructor() {
    if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
      console.error('[InsightSynthesis] Supabase configuration missing');
    }
  }

  /**
   * Call AI via Supabase Edge Function (secure proxy)
   * Extracts JSON from response, handling code blocks if present
   */
  private async callAI(prompt: string): Promise<string> {
    const response = await fetch(`${this.SUPABASE_URL}/functions/v1/ai-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Synapse Insight Synthesis'
      },
      body: JSON.stringify({
        provider: 'openrouter',
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI Proxy error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;

    // Extract JSON from code blocks if present
    const jsonBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      content = jsonBlockMatch[1];
    }

    // Or extract raw JSON object
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }

    return content.trim();
  }

  /**
   * Synthesize industry trends from raw data points
   */
  async synthesizeIndustryTrends(
    dataPoints: DataPoint[],
    context: SynthesisPromptContext
  ): Promise<IndustryTrend[]> {
    // Filter relevant data points
    const relevantPoints = dataPoints.filter(dp =>
      dp.type === 'trending_topic' ||
      dp.source === 'news' ||
      dp.source === 'serper'
    );

    if (relevantPoints.length === 0) return [];

    // Group by source for provenance
    const pointsBySource = this.groupBySource(relevantPoints);
    const sampleData = relevantPoints.slice(0, 20).map(dp => {
      // Safely convert date to ISO string, handling invalid dates
      let timestamp = '';
      if (dp.createdAt) {
        try {
          const date = dp.createdAt instanceof Date ? dp.createdAt : new Date(dp.createdAt);
          if (!isNaN(date.getTime())) {
            timestamp = date.toISOString();
          }
        } catch {
          // Keep empty timestamp if conversion fails
        }
      }
      return {
        content: dp.content,
        source: dp.source,
        timestamp,
        metadata: dp.metadata
      };
    });

    const prompt = `You are analyzing market data for ${context.brandName} in the ${context.industry} industry.

CRITICAL REQUIREMENTS:
1. Extract SPECIFIC, NON-OBVIOUS trends (not generic statements)
2. Include QUANTIFIABLE patterns when possible ("mentioned 3x more" not "more popular")
3. Cite REAL SOURCE PLATFORMS (Google Reviews, YouTube, News Article, etc.)
4. Include sample size and timeframe
5. NO generic business advice - only data-driven insights

DATA POINTS (${relevantPoints.length} total):
${JSON.stringify(sampleData, null, 2)}

Extract 3-5 specific industry trends. For each trend:
- trend: The specific, actionable finding (not obvious, not generic)
- direction: rising/declining/stable
- strength: 0.0-1.0 based on data frequency
- source: The actual platform name (e.g., "Google Reviews", "YouTube Comments", "Industry News")
- evidence: Array of actual quotes or data points
- sampleSize: How many data points support this
- timestamp: Most recent observation

Return as JSON array of trends. Be specific and cite real sources.`;

    try {
      console.log('[InsightSynthesis] Calling AI for industry trends analysis...');
      const content = await this.callAI(prompt);
      const parsed = JSON.parse(content);
      // Handle both array and object responses
      const trends = Array.isArray(parsed) ? parsed : (parsed.trends || parsed.data || []);

      // Validate and enhance with metadata
      return trends.map((trend: any) => ({
        trend: trend.trend,
        direction: trend.direction || 'stable',
        strength: trend.strength || 0.75,
        timeframe: '30 days',
        impact: trend.strength > 0.8 ? 'high' : trend.strength > 0.5 ? 'medium' : 'low',
        source: trend.source,
        evidence: Array.isArray(trend.evidence) ? trend.evidence : [trend.evidence],
        timestamp: trend.timestamp,
        sampleSize: trend.sampleSize || relevantPoints.length
      }));

    } catch (error) {
      console.error('[InsightSynthesis] Error synthesizing trends:', error instanceof Error ? error.message : error);
      return [];
    }
  }

  /**
   * Synthesize customer psychology insights from reviews and comments
   */
  async synthesizeCustomerNeeds(
    dataPoints: DataPoint[],
    context: SynthesisPromptContext
  ): Promise<UnarticuatedNeed[]> {
    // Filter customer-related data points
    const relevantPoints = dataPoints.filter(dp =>
      dp.type === 'customer_trigger' ||
      dp.source === 'outscraper' ||
      dp.source === 'reddit' ||
      dp.metadata?.sentiment
    );

    if (relevantPoints.length === 0) return [];

    const sampleData = relevantPoints.slice(0, 30).map(dp => ({
      content: dp.content,
      source: dp.source,
      metadata: dp.metadata,
      timestamp: dp.createdAt instanceof Date ? dp.createdAt.toISOString() : ''
    }));

    const prompt = `You are analyzing customer feedback for ${context.brandName} in the ${context.industry} industry.

CRITICAL REQUIREMENTS:
1. Find SPECIFIC, ACTIONABLE customer needs (not "customers want good service")
2. Extract the CONTRARIAN or SURPRISING insight (e.g., "don't want to feel sold to" not "want trust")
3. Cite the ACTUAL PLATFORM (Google Reviews, YouTube, Reddit, etc.)
4. Include REAL QUOTES from customers as evidence
5. Focus on unspoken frustrations and desires

CUSTOMER DATA (${relevantPoints.length} reviews/comments):
${JSON.stringify(sampleData, null, 2)}

Extract 3-5 unarticulated customer needs. For each:
- need: The specific insight (the surprising part, not the obvious)
- confidence: 0.0-1.0 based on frequency
- evidence: Array of actual customer quotes
- source: Platform name (e.g., "Google Reviews", "YouTube", "Reddit")
- marketingAngle: How to address this in marketing
- emotionalDriver: The real emotion behind this
- sampleSize: Number of customers expressing this
- timestamp: Most recent mention

Return as JSON array. Focus on specific, actionable insights with real quotes.`;

    try {
      console.log('[InsightSynthesis] Calling AI for customer needs analysis...');
      const content = await this.callAI(prompt);
      console.log('[InsightSynthesis] Raw customer needs response:', content.substring(0, 500));
      const parsed = JSON.parse(content);
      console.log('[InsightSynthesis] Parsed response keys:', Object.keys(parsed));
      // Handle both array and object responses - AI may return various keys
      let needs = [];
      if (Array.isArray(parsed)) {
        needs = parsed;
      } else if (typeof parsed === 'object') {
        needs = parsed.needs || parsed.unarticulated || parsed.unarticulated_needs || parsed.customer_needs || parsed.insights || parsed.data || [];
      }
      if (!Array.isArray(needs)) needs = [];
      console.log('[InsightSynthesis] Extracted needs count:', needs.length);

      return needs.map((need: any) => ({
        need: need.need,
        confidence: need.confidence || 0.75,
        evidence: Array.isArray(need.evidence) ? need.evidence : [need.evidence],
        marketingAngle: need.marketingAngle,
        emotionalDriver: need.emotionalDriver,
        source: need.source,
        timestamp: need.timestamp,
        sampleSize: need.sampleSize
      }));

    } catch (error) {
      console.error('[InsightSynthesis] Error synthesizing customer needs:', error instanceof Error ? error.message : error);
      return [];
    }
  }

  /**
   * Synthesize competitive blindspots from market data
   */
  async synthesizeCompetitiveInsights(
    dataPoints: DataPoint[],
    context: SynthesisPromptContext
  ): Promise<{ blindSpots: CompetitorBlindSpot[], gaps: MarketGap[] }> {
    const competitivePoints = dataPoints.filter(dp =>
      dp.type === 'competitive_gap' ||
      dp.source === 'linkedin' ||
      dp.metadata?.competitor
    );

    if (competitivePoints.length === 0) {
      return { blindSpots: [], gaps: [] };
    }

    const sampleData = competitivePoints.slice(0, 20).map(dp => ({
      content: dp.content,
      source: dp.source,
      metadata: dp.metadata,
      timestamp: dp.createdAt instanceof Date ? dp.createdAt.toISOString() : ''
    }));

    const prompt = `You are analyzing competitive intelligence for ${context.brandName} in the ${context.industry} industry.

CRITICAL REQUIREMENTS:
1. Find SPECIFIC topics competitors are ignoring (not generic opportunities)
2. Identify REAL market gaps with evidence
3. Cite actual sources and data
4. Focus on actionable competitive advantages

COMPETITIVE DATA (${competitivePoints.length} points):
${JSON.stringify(sampleData, null, 2)}

Extract competitive insights:

BLINDSPOTS (topics competitors ignore but customers care about):
- topic: Specific topic being ignored
- reasoning: Why this is a blindspot
- evidence: Real data supporting this
- actionableInsight: What to do about it
- source: Platform name
- timestamp: When observed
- sampleSize: Data points supporting this

MARKET GAPS (unserved customer needs):
- gap: Specific unmet need
- positioning: How to fill this gap
- evidence: Customer quotes/data
- confidence: 0.0-1.0
- source: Platform name
- sampleSize: Supporting data points

Return as JSON: { "blindSpots": [...], "gaps": [...] }`;

    try {
      console.log('[InsightSynthesis] Calling AI for competitive intelligence analysis...');
      const content = await this.callAI(prompt);

      // Try to fix common JSON issues from AI
      let cleanedContent = content;
      try {
        JSON.parse(content);
      } catch {
        // Try to fix trailing commas and other common issues
        cleanedContent = content
          .replace(/,\s*]/g, ']')
          .replace(/,\s*}/g, '}')
          .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
      }

      const result = JSON.parse(cleanedContent);

      return {
        blindSpots: (result.blindSpots || []).map((bs: any) => ({
          topic: bs.topic,
          reasoning: bs.reasoning,
          evidence: Array.isArray(bs.evidence) ? bs.evidence : [bs.evidence],
          actionableInsight: bs.actionableInsight,
          source: bs.source,
          timestamp: bs.timestamp,
          sampleSize: bs.sampleSize,
          opportunityScore: Math.round((bs.confidence || 0.75) * 100)
        })),
        gaps: (result.gaps || []).map((gap: any) => ({
          gap: gap.gap,
          positioning: gap.positioning,
          evidence: Array.isArray(gap.evidence) ? gap.evidence : [gap.evidence],
          confidence: gap.confidence || 0.75,
          source: gap.source,
          timestamp: gap.timestamp,
          sampleSize: gap.sampleSize
        }))
      };

    } catch (error) {
      console.error('[InsightSynthesis] Error synthesizing competitive insights:', error instanceof Error ? error.message : error);
      return { blindSpots: [], gaps: [] };
    }
  }

  /**
   * Group data points by source for provenance tracking
   */
  private groupBySource(dataPoints: DataPoint[]): Map<string, DataPoint[]> {
    const grouped = new Map<string, DataPoint[]>();

    dataPoints.forEach(dp => {
      const source = dp.source || 'unknown';
      if (!grouped.has(source)) {
        grouped.set(source, []);
      }
      grouped.get(source)!.push(dp);
    });

    return grouped;
  }

  /**
   * Main synthesis entry point
   */
  async synthesizeAllInsights(
    deepContext: DeepContext,
    dataPoints: DataPoint[]
  ): Promise<void> {
    const context: SynthesisPromptContext = {
      brandName: deepContext.business.profile.name,
      industry: deepContext.business.profile.industry,
      dataPointCount: dataPoints.length,
      dataPointSample: dataPoints.slice(0, 5).map(dp => dp.content).join('; ')
    };

    console.log('[InsightSynthesis] Starting AI-powered synthesis...');
    console.log(`[InsightSynthesis] Analyzing ${dataPoints.length} data points`);

    // Run all syntheses in parallel
    const [trends, customerNeeds, competitive] = await Promise.all([
      this.synthesizeIndustryTrends(dataPoints, context),
      this.synthesizeCustomerNeeds(dataPoints, context),
      this.synthesizeCompetitiveInsights(dataPoints, context)
    ]);

    // Update deepContext with synthesized insights
    deepContext.industry.trends = trends;
    deepContext.customerPsychology.unarticulated = customerNeeds;
    deepContext.competitiveIntel.blindSpots = competitive.blindSpots;
    deepContext.competitiveIntel.opportunities = competitive.gaps;

    // Update synthesis metadata
    deepContext.synthesis.keyInsights = [
      `Identified ${trends.length} specific industry trends from ${dataPoints.filter(dp => dp.type === 'trending_topic').length} data points`,
      `Extracted ${customerNeeds.length} unarticulated customer needs from ${dataPoints.filter(dp => dp.type === 'customer_trigger').length} reviews`,
      `Found ${competitive.blindSpots.length} competitor blind spots and ${competitive.gaps.length} market gaps`
    ];

    deepContext.synthesis.confidenceLevel = Math.min(1, 0.6 + (dataPoints.length / 200));
    deepContext.synthesis.opportunityScore = Math.round(
      (trends.length * 15) + (customerNeeds.length * 20) + (competitive.blindSpots.length * 25)
    );

    console.log('[InsightSynthesis] ✅ Synthesis complete');
    console.log(`  - Industry Trends: ${trends.length}`);
    console.log(`  - Customer Needs: ${customerNeeds.length}`);
    console.log(`  - Competitive Insights: ${competitive.blindSpots.length + competitive.gaps.length}`);
  }
}

export const insightSynthesis = new InsightSynthesisService();
