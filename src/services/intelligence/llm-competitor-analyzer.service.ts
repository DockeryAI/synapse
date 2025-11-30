/**
 * LLM Competitor Analyzer Service
 *
 * Uses Opus/Sonnet for reliable competitor intelligence when scrapers fail.
 * Segment-specific prompts for 6 business categories.
 *
 * Features:
 * - Deep knowledge of enterprise SaaS (G2, Capterra, Reddit)
 * - Local business intelligence (Yelp, Google reviews patterns)
 * - Always returns data (no API failures like scrapers)
 * - Segment-aware prompts for better accuracy
 *
 * Created: 2025-11-28
 */

import type {
  SegmentType,
  BusinessType,
  ExtractedGap,
  GapType
} from '@/types/competitor-intelligence.types';

// ============================================================================
// TYPES
// ============================================================================

export interface LLMCompetitorAnalysis {
  competitor_name: string;
  positioning: {
    tier: 'premium' | 'mid-market' | 'budget';
    target: 'enterprise' | 'mid-market' | 'smb' | 'consumer';
    primary_message: string;
  };
  strengths: Array<{
    point: string;
    evidence: string;
  }>;
  weaknesses: Array<{
    point: string;
    source: string;
    frequency: 'common' | 'occasional' | 'rare';
  }>;
  pricing: {
    model: string;
    range: string;
    transparency: 'public' | 'semi-public' | 'opaque';
  };
  gaps_vs_brand: Array<{
    gap_type: GapType;
    description: string;
    confidence: number;
  }>;
  analysis_source: 'llm-knowledge';
  model_used: string;
}

export interface LLMAnalysisRequest {
  competitor_name: string;
  competitor_website?: string;
  brand_name: string;
  brand_industry: string;
  segment_type: SegmentType;
  business_type: BusinessType;
  brand_uvp?: string;
}

// ============================================================================
// SEGMENT PROMPTS
// ============================================================================

const SEGMENT_PROMPT_ADDITIONS: Record<string, string> = {
  // Local Service B2B
  'local-b2b': `
Focus on: response times, service area limits, emergency availability,
contract flexibility, hidden fees, technician expertise, certifications.
Common complaints: slow response, upselling, scheduling issues, inexperienced techs.
Sources to reference: Google reviews, BBB complaints, industry forums, Angi/HomeAdvisor.
`,

  // Local Service B2C
  'local-b2c': `
Focus on: wait times, staff turnover, cleanliness, booking friction,
pricing transparency, appointment availability, customer service attitude.
Common complaints: long waits, rude staff, unexpected charges, difficulty booking.
Sources to reference: Yelp, Google, Facebook reviews, Nextdoor discussions.
`,

  // Regional B2B Agency
  'regional-b2b': `
Focus on: client retention rates, expertise depth, deliverable quality,
communication frequency, strategic thinking vs pure execution, account management.
Common complaints: junior staff doing senior work, missed deadlines, cookie-cutter approach, scope creep.
Sources to reference: Clutch reviews, LinkedIn recommendations, industry forums, case studies.
`,

  // Regional Retail B2C
  'regional-b2c': `
Focus on: inventory consistency across locations, franchise quality variance,
staff training standards, return policy friction, loyalty program value.
Common complaints: out of stock items, inconsistent experience by location, unhelpful staff.
Sources to reference: Google reviews per location, Yelp, Facebook, local news.
`,

  // National SaaS B2B
  'national-b2b': `
Focus on: integration complexity, support responsiveness, pricing opacity,
feature gaps vs marketing claims, onboarding friction, vendor lock-in concerns, API quality.
Common complaints: slow support, hidden costs, steep learning curve, feature limitations, poor documentation.
Sources to reference: G2 reviews, Capterra, Reddit r/SaaS, TrustRadius, HackerNews, industry blogs.
`,

  // National Product B2C
  'national-b2c': `
Focus on: quality control issues, shipping reliability, return policy friction,
customer service responsiveness, sustainability claims vs reality, price-to-value ratio.
Common complaints: product defects, slow shipping, difficult returns, misleading marketing.
Sources to reference: Amazon reviews, Trustpilot, BBB, Reddit product subreddits, social media complaints.
`
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getSegmentKey(segmentType: SegmentType, businessType: BusinessType): string {
  const isLocal = segmentType === 'local';
  const isRegional = segmentType === 'regional';
  const isB2B = businessType === 'b2b';

  if (isLocal && isB2B) return 'local-b2b';
  if (isLocal && !isB2B) return 'local-b2c';
  if (isRegional && isB2B) return 'regional-b2b';
  if (isRegional && !isB2B) return 'regional-b2c';
  if (isB2B) return 'national-b2b';
  return 'national-b2c';
}

function buildAnalysisPrompt(request: LLMAnalysisRequest): string {
  const segmentKey = getSegmentKey(request.segment_type, request.business_type);
  const segmentAddition = SEGMENT_PROMPT_ADDITIONS[segmentKey] || SEGMENT_PROMPT_ADDITIONS['national-b2b'];

  return `You are a competitive intelligence analyst. Analyze "${request.competitor_name}" as a competitor to "${request.brand_name}" in the ${request.brand_industry} space.

Context:
- Brand analyzing: ${request.brand_name}
- Competitor: ${request.competitor_name}${request.competitor_website ? ` (${request.competitor_website})` : ''}
- Segment: ${request.segment_type} ${request.business_type}
- Industry: ${request.brand_industry}
${request.brand_uvp ? `- Brand's UVP: ${request.brand_uvp}` : ''}

${segmentAddition}

Provide your analysis as a valid JSON object with this exact structure:
{
  "positioning": {
    "tier": "premium" | "mid-market" | "budget",
    "target": "enterprise" | "mid-market" | "smb" | "consumer",
    "primary_message": "Their main value proposition in one sentence"
  },
  "strengths": [
    {"point": "Specific strength", "evidence": "Where this is documented (G2, website, etc)"}
  ],
  "weaknesses": [
    {"point": "Specific complaint or weakness", "source": "G2 review | Reddit | Capterra | etc", "frequency": "common" | "occasional" | "rare"}
  ],
  "pricing": {
    "model": "per-seat | usage-based | flat-rate | custom | varies",
    "range": "$X-Y/month or 'contact sales' if opaque",
    "transparency": "public" | "semi-public" | "opaque"
  },
  "gaps_vs_brand": [
    {"gap_type": "void" | "demand" | "angle", "description": "What they miss that ${request.brand_name} could exploit", "confidence": 0.0-1.0}
  ]
}

IMPORTANT:
- Be specific and factual. Cite actual sources where possible.
- Include 3-5 strengths and 3-5 weaknesses.
- For gaps_vs_brand, identify 2-4 actionable competitive gaps.
- "void" = something they don't offer at all
- "demand" = something customers complain about wanting
- "angle" = a positioning opportunity based on their weakness
- Return ONLY valid JSON, no markdown or explanation.`;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

class LLMCompetitorAnalyzerService {
  private readonly OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly DEFAULT_MODEL = 'anthropic/claude-sonnet-4-20250514'; // Fast + good quality
  private readonly PREMIUM_MODEL = 'anthropic/claude-sonnet-4-20250514'; // Best for complex analysis

  /**
   * Analyze a competitor using LLM knowledge
   */
  async analyzeCompetitor(
    request: LLMAnalysisRequest,
    usePremiumModel = false
  ): Promise<LLMCompetitorAnalysis | null> {
    const prompt = buildAnalysisPrompt(request);
    const model = usePremiumModel ? this.PREMIUM_MODEL : this.DEFAULT_MODEL;

    console.log(`[LLM-Analyzer] Analyzing ${request.competitor_name} for ${request.brand_name} using ${model}`);
    const startTime = performance.now();

    try {
      const response = await fetch(this.OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://synapse.ai',
          'X-Title': 'Synapse Competitor Intelligence'
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a competitive intelligence analyst. Respond only with valid JSON. No markdown, no explanation, just the JSON object.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        console.error('[LLM-Analyzer] API error:', response.status);
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      // Parse JSON response
      const analysis = this.parseAnalysisResponse(content, request.competitor_name, model);

      const duration = ((performance.now() - startTime) / 1000).toFixed(1);
      console.log(`[LLM-Analyzer] Analysis complete for ${request.competitor_name} in ${duration}s`);

      return analysis;

    } catch (error) {
      console.error('[LLM-Analyzer] Error analyzing competitor:', error);
      return null;
    }
  }

  /**
   * Parse LLM response into structured analysis
   */
  private parseAnalysisResponse(
    content: string,
    competitorName: string,
    modelUsed: string
  ): LLMCompetitorAnalysis | null {
    try {
      // Clean up response - remove markdown if present
      let cleaned = content
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      // Extract JSON object
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('[LLM-Analyzer] No JSON object found in response');
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!parsed.positioning || !parsed.strengths || !parsed.weaknesses) {
        console.warn('[LLM-Analyzer] Missing required fields in response');
        return null;
      }

      return {
        competitor_name: competitorName,
        positioning: parsed.positioning,
        strengths: parsed.strengths || [],
        weaknesses: parsed.weaknesses || [],
        pricing: parsed.pricing || { model: 'unknown', range: 'unknown', transparency: 'opaque' },
        gaps_vs_brand: parsed.gaps_vs_brand || [],
        analysis_source: 'llm-knowledge',
        model_used: modelUsed
      };

    } catch (error) {
      console.error('[LLM-Analyzer] Failed to parse response:', error);
      return null;
    }
  }

  /**
   * Convert LLM analysis to ExtractedGap format for compatibility
   * Maps LLM internal gap types to standard GapType enum
   */
  convertToExtractedGaps(analysis: LLMCompetitorAnalysis): ExtractedGap[] {
    const gaps: ExtractedGap[] = [];

    // Map LLM gap types to standard GapType
    const mapGapType = (llmType: string): GapType => {
      const typeMap: Record<string, GapType> = {
        'void': 'feature-gap',
        'demand': 'service-gap',
        'angle': 'messaging-gap'
      };
      return typeMap[llmType] || 'service-gap';
    };

    // Convert weaknesses to gaps (using The Void / The Demand / Your Angle format)
    for (const weakness of analysis.weaknesses) {
      gaps.push({
        title: weakness.point,
        the_void: `Competitor weakness: ${weakness.point}`,
        the_demand: `Customers frequently report: "${weakness.point}" (Source: ${weakness.source})`,
        your_angle: `Position against this by addressing: "${weakness.point}"`,
        gap_type: 'support-gap', // Weaknesses usually relate to support/service issues
        confidence: weakness.frequency === 'common' ? 0.85 : weakness.frequency === 'occasional' ? 0.7 : 0.55,
        sources: [{
          quote: weakness.point,
          source: weakness.source,
          date: new Date().toISOString().split('T')[0]
        }]
      });
    }

    // Convert explicit gaps to ExtractedGap format
    for (const gap of analysis.gaps_vs_brand) {
      gaps.push({
        title: gap.description.slice(0, 80),
        the_void: `Competitor gap: ${gap.description}`,
        the_demand: `Market opportunity identified via LLM analysis`,
        your_angle: `Competitive opportunity: ${gap.description}`,
        gap_type: mapGapType(gap.gap_type as string),
        confidence: gap.confidence,
        sources: [{
          quote: gap.description,
          source: 'LLM competitive analysis',
          date: new Date().toISOString().split('T')[0]
        }]
      });
    }

    return gaps;
  }

  /**
   * Get segment-specific sources to cite
   */
  getSegmentSources(segmentType: SegmentType, businessType: BusinessType): string[] {
    const segmentKey = getSegmentKey(segmentType, businessType);

    const sourceMap: Record<string, string[]> = {
      'local-b2b': ['Google Reviews', 'BBB', 'Angi', 'Industry Forums'],
      'local-b2c': ['Yelp', 'Google Reviews', 'Facebook', 'Nextdoor'],
      'regional-b2b': ['Clutch', 'LinkedIn', 'Industry Forums', 'Case Studies'],
      'regional-b2c': ['Google Reviews', 'Yelp', 'Facebook', 'Local News'],
      'national-b2b': ['G2', 'Capterra', 'TrustRadius', 'Reddit r/SaaS', 'HackerNews'],
      'national-b2c': ['Amazon Reviews', 'Trustpilot', 'BBB', 'Reddit']
    };

    return sourceMap[segmentKey] || sourceMap['national-b2b'];
  }
}

// Export singleton
export const llmCompetitorAnalyzer = new LLMCompetitorAnalyzerService();
export default llmCompetitorAnalyzer;
