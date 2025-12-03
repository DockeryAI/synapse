/**
 * Strategic Analyzer Service
 *
 * Advanced competitive analysis that goes beyond surface metrics.
 * Ported from CIAS project with TypeScript enhancements.
 *
 * Features:
 * - Narrative Dissonance: Gap between marketing claims and user reality
 * - Feature Velocity: Release cadence and momentum analysis
 * - Pricing Intelligence: Model comparison and arbitrage opportunities
 * - Strategic Weakness: Core vulnerabilities and attack vectors
 * - Customer Voice: Pain points, desires, objections from real users
 *
 * Created: 2025-11-29
 */

import type {
  CompetitorProfile,
  CompetitorGap,
  CustomerVoice,
  NarrativeDissonance,
  FeatureVelocity,
  PricingIntel,
  StrategicWeakness,
  ThreatScore,
  EnhancedCompetitorInsights
} from '@/types/competitor-intelligence.types';

// ============================================================================
// TYPES
// ============================================================================

interface AnalysisContext {
  brand_name: string;
  brand_industry: string;
  brand_uvp?: {
    unique_solution?: string;
    key_benefit?: string;
    target_customer?: string;
  };
}

interface CompetitorData {
  profile: CompetitorProfile;
  gaps: CompetitorGap[];
  reviews?: Array<{
    text: string;
    rating: number;
    source: string;
  }>;
  news?: Array<{
    title: string;
    snippet: string;
    date: string;
  }>;
  reddit_posts?: Array<{
    title: string;
    text: string;
    score: number;
    subreddit: string;
  }>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Safe JSON parser for LLM responses
 */
function safeParseJSON<T>(content: string, fallback: T): T {
  try {
    // Try to find JSON in the content
    const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return fallback;
  } catch {
    console.warn('[StrategicAnalyzer] Failed to parse JSON:', content.substring(0, 200));
    return fallback;
  }
}

/**
 * Call AI proxy for analysis with retry logic for transient errors (503, 502, etc.)
 */
async function callAIForAnalysis(prompt: string, systemPrompt: string, maxRetries = 3): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            provider: 'anthropic',
            model: 'anthropic/claude-opus-4.5',
            messages: [
              { role: 'user', content: prompt }
            ],
            system: systemPrompt,
            temperature: 0.3,
            max_tokens: 2000
          })
        }
      );

      if (!response.ok) {
        const isRetryable = response.status === 503 || response.status === 502 || response.status === 429;
        if (isRetryable && attempt < maxRetries) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 8000); // Exponential backoff: 1s, 2s, 4s, max 8s
          console.warn(`[StrategicAnalyzer] AI API error ${response.status}, retrying in ${backoffMs}ms (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || data.content?.[0]?.text || '';
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Retry on network errors
      if (attempt < maxRetries) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
        console.warn(`[StrategicAnalyzer] AI call failed, retrying in ${backoffMs}ms (attempt ${attempt}/${maxRetries}):`, lastError.message);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }
    }
  }

  console.error('[StrategicAnalyzer] AI call failed after', maxRetries, 'attempts:', lastError);
  throw lastError;
}

// ============================================================================
// STRATEGIC ANALYZER CLASS
// ============================================================================

class StrategicAnalyzer {

  /**
   * Analyze narrative dissonance - gap between marketing claims and user reality
   */
  async analyzeNarrativeDissonance(
    competitors: CompetitorData[],
    context: AnalysisContext
  ): Promise<NarrativeDissonance> {
    console.log('[StrategicAnalyzer] Analyzing narrative dissonance for', competitors.length, 'competitors');

    const competitorSummaries = competitors.map(c => ({
      name: c.profile.name,
      website: c.profile.website,
      description: c.profile.description,
      gaps: c.gaps.slice(0, 3).map(g => g.title),
      reviews: c.reviews?.slice(0, 5).map(r => r.text) || []
    }));

    const prompt = `Analyze the gap between marketing claims and user reality for these competitors:

COMPETITORS:
${JSON.stringify(competitorSummaries, null, 2)}

BRAND CONTEXT: ${context.brand_name} in ${context.brand_industry}

For each competitor, identify:
1. What they CLAIM in their marketing
2. What users ACTUALLY experience (based on reviews, gaps)
3. The positioning OPPORTUNITY this creates for ${context.brand_name}

Return JSON:
{
  "gaps": [
    {
      "competitor": "Name",
      "claim": "What they promise",
      "reality": "What users actually experience",
      "opportunity": "How ${context.brand_name} can position against this"
    }
  ],
  "key_insight": "Main strategic takeaway"
}`;

    try {
      const content = await callAIForAnalysis(
        prompt,
        'You are a competitive intelligence analyst. Analyze marketing vs reality gaps. Return only valid JSON.'
      );

      return safeParseJSON<NarrativeDissonance>(content, {
        gaps: [],
        key_insight: 'Analysis unavailable'
      });
    } catch (error) {
      console.error('[StrategicAnalyzer] Narrative dissonance analysis failed:', error);
      return { gaps: [], key_insight: 'Analysis failed' };
    }
  }

  /**
   * Analyze feature velocity - release cadence and momentum
   */
  async analyzeFeatureVelocity(
    competitors: CompetitorData[],
    context: AnalysisContext
  ): Promise<FeatureVelocity> {
    console.log('[StrategicAnalyzer] Analyzing feature velocity');

    const competitorInfo = competitors.map(c => ({
      name: c.profile.name,
      news: c.news?.slice(0, 5) || [],
      gaps: c.gaps.filter(g => g.gap_type === 'feature').slice(0, 3)
    }));

    const prompt = `Analyze feature release velocity and momentum for these competitors:

COMPETITORS:
${JSON.stringify(competitorInfo, null, 2)}

For each competitor, determine:
1. Release cadence (weekly/monthly/quarterly/yearly)
2. Momentum (accelerating/steady/decelerating/stalled)
3. Recent feature signals
4. Innovation gaps (where they're NOT innovating)

Return JSON:
{
  "velocity_analysis": [
    {
      "competitor": "Name",
      "cadence": "monthly",
      "momentum": "steady",
      "recent_releases": ["Feature 1", "Feature 2"],
      "signals": ["enterprise pivot", "AI focus"],
      "gaps": ["no mobile app", "weak integrations"]
    }
  ],
  "opportunities": "Where competitors are slow = your speed advantage"
}`;

    try {
      const content = await callAIForAnalysis(
        prompt,
        'You are a product analyst tracking competitor feature releases. Return only valid JSON.'
      );

      return safeParseJSON<FeatureVelocity>(content, {
        velocity_analysis: [],
        opportunities: ''
      });
    } catch (error) {
      console.error('[StrategicAnalyzer] Feature velocity analysis failed:', error);
      return { velocity_analysis: [], opportunities: '' };
    }
  }

  /**
   * Analyze pricing intelligence
   */
  async analyzePricing(
    competitor: CompetitorData,
    context: AnalysisContext
  ): Promise<PricingIntel> {
    console.log('[StrategicAnalyzer] Analyzing pricing for', competitor.profile.name);

    const prompt = `Research and analyze the pricing model for ${competitor.profile.name} (${competitor.profile.website}):

COMPETITOR: ${competitor.profile.name}
INDUSTRY: ${context.brand_industry}
BRAND CONTEXT: ${context.brand_name}

Determine:
1. Pricing model (freemium, subscription, usage-based, etc.)
2. Pricing tiers and their features
3. Arbitrage opportunity (where their pricing creates a gap)
4. Positioning gap (how ${context.brand_name} could price differently)

Return JSON:
{
  "competitor": "${competitor.profile.name}",
  "model": "subscription",
  "tiers": [
    {"name": "Starter", "price": "$29/mo", "features": ["Feature 1", "Feature 2"]}
  ],
  "arbitrage_opportunity": "They charge extra for X which you could include free",
  "positioning_gap": "How to position your pricing against them"
}`;

    try {
      const content = await callAIForAnalysis(
        prompt,
        'You are a pricing analyst. Research competitor pricing and find arbitrage opportunities. Return only valid JSON.'
      );

      return safeParseJSON<PricingIntel>(content, {
        competitor: competitor.profile.name,
        model: 'unknown',
        tiers: [],
        arbitrage_opportunity: '',
        positioning_gap: ''
      });
    } catch (error) {
      console.error('[StrategicAnalyzer] Pricing analysis failed:', error);
      return {
        competitor: competitor.profile.name,
        model: 'unknown',
        tiers: [],
        arbitrage_opportunity: '',
        positioning_gap: ''
      };
    }
  }

  /**
   * Identify strategic weaknesses
   */
  async identifyStrategicWeakness(
    competitor: CompetitorData,
    context: AnalysisContext
  ): Promise<StrategicWeakness> {
    console.log('[StrategicAnalyzer] Identifying strategic weakness for', competitor.profile.name);

    const prompt = `Analyze ${competitor.profile.name} for strategic weaknesses:

COMPETITOR: ${competitor.profile.name}
WEBSITE: ${competitor.profile.website}
GAPS FOUND: ${competitor.gaps.slice(0, 5).map(g => g.title).join(', ')}

Identify their CORE VULNERABILITY - not just features they lack, but fundamental strategic weaknesses that are hard for them to fix.

Consider:
- Business model constraints
- Technical debt or architecture issues
- Market positioning that limits them
- Organizational/cultural limitations

Return JSON:
{
  "competitor": "${competitor.profile.name}",
  "core_vulnerability": "The fundamental weakness",
  "why_hard_to_fix": "Why they can't easily solve this",
  "attack_vector": "How ${context.brand_name} should position against this",
  "confidence": 0.8
}`;

    try {
      const content = await callAIForAnalysis(
        prompt,
        'You are a strategic analyst identifying fundamental competitive weaknesses. Return only valid JSON.'
      );

      return safeParseJSON<StrategicWeakness>(content, {
        competitor: competitor.profile.name,
        core_vulnerability: 'Analysis unavailable',
        why_hard_to_fix: '',
        attack_vector: '',
        confidence: 0
      });
    } catch (error) {
      console.error('[StrategicAnalyzer] Strategic weakness analysis failed:', error);
      return {
        competitor: competitor.profile.name,
        core_vulnerability: 'Analysis failed',
        why_hard_to_fix: '',
        attack_vector: '',
        confidence: 0
      };
    }
  }

  /**
   * Extract customer voice from Reddit and reviews
   */
  extractCustomerVoice(
    reviews: Array<{ text: string; rating: number; source: string }> = [],
    redditPosts: Array<{ title: string; text: string; score: number; subreddit: string }> = []
  ): CustomerVoice {
    console.log('[StrategicAnalyzer] Extracting customer voice from', reviews.length, 'reviews,', redditPosts.length, 'reddit posts');

    const painPoints: string[] = [];
    const desires: string[] = [];
    const objections: string[] = [];
    const switchingTriggers: string[] = [];
    const commonPhrases: string[] = [];
    const sourceQuotes: CustomerVoice['source_quotes'] = [];

    // Pain point patterns
    const painPatterns = ['struggling with', 'problem with', 'hate that', 'frustrated', 'annoying', 'broken', 'doesn\'t work', 'terrible'];
    // Desire patterns
    const desirePatterns = ['i want', 'i wish', 'if only', 'would be great', 'need', 'looking for', 'hoping'];
    // Objection patterns
    const objectionPatterns = ['too expensive', 'don\'t trust', 'not worth', 'better alternative', 'overpriced', 'complicated'];
    // Switching patterns
    const switchPatterns = ['switched from', 'left', 'cancelled', 'moved to', 'migrated', 'replaced'];

    // Process reviews
    for (const review of reviews) {
      const text = review.text.toLowerCase();

      // Extract pain points
      if (painPatterns.some(p => text.includes(p))) {
        painPoints.push(review.text.slice(0, 150));
        sourceQuotes.push({
          quote: review.text.slice(0, 200),
          source: review.source,
          sentiment: review.rating < 3 ? 'negative' : review.rating > 3 ? 'positive' : 'neutral',
          relevance: 0.8
        });
      }

      // Extract desires
      if (desirePatterns.some(p => text.includes(p))) {
        desires.push(review.text.slice(0, 150));
      }

      // Extract objections
      if (objectionPatterns.some(p => text.includes(p))) {
        objections.push(review.text.slice(0, 150));
      }

      // Extract switching triggers
      if (switchPatterns.some(p => text.includes(p))) {
        switchingTriggers.push(review.text.slice(0, 150));
      }
    }

    // Process Reddit posts
    for (const post of redditPosts) {
      const content = `${post.title} ${post.text}`.toLowerCase();

      if (painPatterns.some(p => content.includes(p))) {
        painPoints.push(post.title);
        sourceQuotes.push({
          quote: post.title,
          source: `r/${post.subreddit}`,
          sentiment: 'negative',
          relevance: Math.min(1, post.score / 100)
        });
      }

      if (desirePatterns.some(p => content.includes(p))) {
        desires.push(post.title);
      }

      if (objectionPatterns.some(p => content.includes(p))) {
        objections.push(post.title);
      }

      if (switchPatterns.some(p => content.includes(p))) {
        switchingTriggers.push(post.title);
      }

      // Common phrases - high-scoring posts
      if (post.score > 10) {
        commonPhrases.push(post.title);
      }
    }

    return {
      pain_points: [...new Set(painPoints)].slice(0, 10),
      desires: [...new Set(desires)].slice(0, 10),
      objections: [...new Set(objections)].slice(0, 10),
      switching_triggers: [...new Set(switchingTriggers)].slice(0, 10),
      common_phrases: [...new Set(commonPhrases)].slice(0, 10),
      source_quotes: sourceQuotes.slice(0, 10)
    };
  }

  /**
   * Calculate threat score for a competitor
   */
  calculateThreatScore(
    competitor: CompetitorData,
    featureVelocity?: FeatureVelocity,
    customerVoice?: CustomerVoice
  ): ThreatScore {
    console.log('[StrategicAnalyzer] Calculating threat score for', competitor.profile.name);

    // Market presence score (based on confidence and validation)
    const marketPresence = Math.round((competitor.profile.confidence || 0.5) * 100);

    // Feature velocity score
    let velocityScore = 50;
    if (featureVelocity?.velocity_analysis) {
      const analysis = featureVelocity.velocity_analysis.find(
        v => v.competitor.toLowerCase() === competitor.profile.name.toLowerCase()
      );
      if (analysis) {
        const momentumScores = { accelerating: 80, steady: 60, decelerating: 40, stalled: 20 };
        velocityScore = momentumScores[analysis.momentum] || 50;
      }
    }

    // Customer satisfaction (inverse of pain points)
    let satisfactionScore = 70;
    if (customerVoice) {
      const painCount = customerVoice.pain_points.length;
      satisfactionScore = Math.max(20, 100 - (painCount * 8));
    }

    // Pricing pressure (based on gaps)
    const pricingGaps = competitor.gaps.filter(g =>
      g.title.toLowerCase().includes('price') ||
      g.title.toLowerCase().includes('cost') ||
      g.title.toLowerCase().includes('expensive')
    ).length;
    const pricingPressure = Math.min(100, 50 + (pricingGaps * 15));

    // Calculate overall
    const overall = Math.round(
      (marketPresence * 0.3) +
      (velocityScore * 0.25) +
      (satisfactionScore * 0.25) +
      (pricingPressure * 0.2)
    );

    // Determine trend
    const trend = velocityScore > 60 ? 'increasing' :
                  velocityScore < 40 ? 'decreasing' : 'stable';

    return {
      overall,
      breakdown: {
        market_presence: marketPresence,
        feature_velocity: velocityScore,
        customer_satisfaction: satisfactionScore,
        pricing_pressure: pricingPressure
      },
      trend
    };
  }

  /**
   * Run full strategic analysis for a competitor
   */
  async analyzeCompetitor(
    competitor: CompetitorData,
    context: AnalysisContext
  ): Promise<Partial<EnhancedCompetitorInsights>> {
    console.log('[StrategicAnalyzer] Running full analysis for', competitor.profile.name);

    try {
      // Extract customer voice (sync operation)
      const customerVoice = this.extractCustomerVoice(
        competitor.reviews,
        competitor.reddit_posts
      );

      // Run async analyses in parallel
      const [strategicWeakness, pricingIntel] = await Promise.all([
        this.identifyStrategicWeakness(competitor, context),
        this.analyzePricing(competitor, context)
      ]);

      // Calculate threat score
      const threatScore = this.calculateThreatScore(competitor, undefined, customerVoice);

      return {
        competitor_id: competitor.profile.id,
        competitor_name: competitor.profile.name,
        customer_voice: customerVoice,
        strategic_weakness: strategicWeakness,
        pricing_intel: pricingIntel,
        threat_score: threatScore,
        last_updated: new Date().toISOString(),
        data_sources: ['perplexity', 'reviews', 'reddit', 'llm-analysis'],
        confidence_score: threatScore.overall / 100
      };
    } catch (error) {
      console.error('[StrategicAnalyzer] Analysis failed for', competitor.profile.name, error);
      return {
        competitor_id: competitor.profile.id,
        competitor_name: competitor.profile.name,
        last_updated: new Date().toISOString(),
        data_sources: [],
        confidence_score: 0
      };
    }
  }

  /**
   * Run batch analysis for multiple competitors
   */
  async analyzeAll(
    competitors: CompetitorData[],
    context: AnalysisContext,
    onProgress?: (competitor: string, insights: Partial<EnhancedCompetitorInsights>) => void
  ): Promise<{
    insights: Partial<EnhancedCompetitorInsights>[];
    narrativeDissonance: NarrativeDissonance;
    featureVelocity: FeatureVelocity;
  }> {
    console.log('[StrategicAnalyzer] Running batch analysis for', competitors.length, 'competitors');

    // Run cross-competitor analyses
    const [narrativeDissonance, featureVelocity] = await Promise.all([
      this.analyzeNarrativeDissonance(competitors, context),
      this.analyzeFeatureVelocity(competitors, context)
    ]);

    // Run individual competitor analyses
    const insights: Partial<EnhancedCompetitorInsights>[] = [];

    for (const competitor of competitors) {
      const insight = await this.analyzeCompetitor(competitor, context);

      // Add feature velocity data
      if (featureVelocity?.velocity_analysis) {
        const velocityData = featureVelocity.velocity_analysis.find(
          v => v.competitor.toLowerCase() === competitor.profile.name.toLowerCase()
        );
        if (velocityData) {
          insight.feature_velocity = {
            velocity_analysis: [velocityData],
            opportunities: featureVelocity.opportunities
          };
        }
      }

      insights.push(insight);

      // Emit progress
      if (onProgress) {
        onProgress(competitor.profile.name, insight);
      }
    }

    return {
      insights,
      narrativeDissonance,
      featureVelocity
    };
  }
}

// Export singleton
export const strategicAnalyzer = new StrategicAnalyzer();
export default strategicAnalyzer;
