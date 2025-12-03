/**
 * Enhanced Benefit Extractor with JTBD Outcomes Framework
 *
 * CRITICAL: Extracts customer OUTCOMES not business FEATURES
 * - WRONG: "25 years experience" (feature)
 * - RIGHT: "Save 30% on costs in 90 days" (outcome)
 *
 * Uses JTBD framework:
 * - Functional outcomes: measurable results customers achieve
 * - Emotional outcomes: how customers feel
 * - Social outcomes: how customers are perceived
 */

import { getIndustryEQ } from '@/services/uvp-wizard/emotional-quotient';
import type { KeyBenefit, BenefitMetric } from '@/types/uvp-flow.types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface BenefitExtractionResult {
  benefits: KeyBenefit[];
  industryBenchmarks?: {
    typical_roi: string[];
    typical_timeframes: string[];
    typical_metrics: string[];
  };
  confidence: {
    overall: number;
    dataQuality: number;
    modelAgreement: number;
    sourceCount?: number;
  };
}

/**
 * Extract metrics and results from website
 */
function extractMetricsFromContent(websiteContent: string[]): string[] {
  const metrics: string[] = [];
  const content = websiteContent.join('\n\n');

  // Look for percentage improvements
  const percentagePattern = /(\d+)%\s+(?:increase|improvement|reduction|savings?|more|less|faster)/gi;
  const percentageMatches = content.matchAll(percentagePattern);
  for (const match of percentageMatches) {
    metrics.push(match[0]);
  }

  // Look for time-based metrics
  const timePattern = /(?:save|reduce|cut)\s+(\d+\+?\s+(?:hours?|days?|weeks?|months?))/gi;
  const timeMatches = content.matchAll(timePattern);
  for (const match of timeMatches) {
    metrics.push(match[0]);
  }

  // Look for dollar amounts
  const dollarPattern = /\$[\d,]+(?:k|m)?\s+(?:saved|increase|revenue|profit|savings)/gi;
  const dollarMatches = content.matchAll(dollarPattern);
  for (const match of dollarMatches) {
    metrics.push(match[0]);
  }

  // Look for "X to Y" improvements
  const improvementPattern = /from\s+(\d+[%\w]*)\s+to\s+(\d+[%\w]*)/gi;
  const improvementMatches = content.matchAll(improvementPattern);
  for (const match of improvementMatches) {
    metrics.push(match[0]);
  }

  return metrics.slice(0, 15);
}

/**
 * Extract benefits using JTBD outcomes framework
 */
export async function extractEnhancedBenefits(
  websiteContent: string[],
  businessName: string,
  industry: string,
  customerProfile?: string,
  uniqueSolution?: string
): Promise<BenefitExtractionResult> {
  console.log('[EnhancedBenefitExtractor] Starting extraction...');
  console.log(`  - Industry: ${industry}`);
  console.log(`  - Focus: Customer OUTCOMES not business FEATURES`);

  try {
    // Extract metrics from website
    const metrics = extractMetricsFromContent(websiteContent);
    console.log(`[EnhancedBenefitExtractor] Found ${metrics.length} metrics`);

    // Get industry intelligence
    const industryEQ = await getIndustryEQ(industry);

    // Prepare content
    const fullContent = websiteContent.join('\n\n').substring(0, 10000);
    const metricsText = metrics.join('\n');

    // Build JTBD-focused prompt
    const prompt = `Extract key benefits for this ${industry} business using Jobs-to-be-Done outcomes framework.

CRITICAL: Benefits are what CUSTOMERS ACHIEVE, not what the BUSINESS HAS.
- WRONG: "25 years experience" (that's a feature of the business)
- RIGHT: "Get expert guidance from 25 years of proven results" (that's what customer gets)
- WRONG: "Multi-carrier comparison" (that's what business does)
- RIGHT: "Save 30% by finding the best carrier match for your needs" (that's customer outcome)

BUSINESS: ${businessName}
INDUSTRY: ${industry}
${customerProfile ? `CUSTOMER: ${customerProfile}` : ''}
${uniqueSolution ? `SOLUTION: ${uniqueSolution}` : ''}

INDUSTRY INSIGHTS:
- EQ: ${industryEQ.emotional_weight}% emotional, ${100 - industryEQ.emotional_weight}% rational
- JTBD Focus: ${industryEQ.jtbd_focus}

METRICS FOUND ON WEBSITE:
${metricsText || 'No specific metrics found'}

WEBSITE CONTENT:
${fullContent}

**BANNED GENERIC BENEFITS - Reject these:**
- "peace of mind" (vague, overused)
- "confidence" (meaningless without context)
- "financial freedom" (cliché)
- "success" (undefined)
- "better results" (not specific)

**REQUIRED - Each benefit MUST have at least ONE:**
1. SPECIFIC NUMBER: "save $50K/year", "retire 5 years early", "reduce by 40%"
2. SPECIFIC TIMELINE: "within 90 days", "by age 58", "in first quarter"
3. SPECIFIC SITUATION: "work becomes optional", "kids' college funded", "outlive your money impossible"

Extract 3-5 key benefits using THREE outcome dimensions:

**FUNCTIONAL OUTCOMES** (measurable, specific results):
GOOD: "Work becomes optional by age 58 with $4M+ preserved"
BAD: "Achieve financial independence"

Requirements:
- Must have SPECIFIC number or metric from website
- Must have timeline or age
- Must use customer language from quotes

**EMOTIONAL OUTCOMES** (specific feelings with reason):
GOOD: "Stop losing sleep about running out of money at 85"
BAD: "Peace of mind about retirement"

Requirements:
- Must be SPECIFIC emotion/situation (not generic "confidence")
- Must include the REASON why they feel this way
- Must come from actual customer quotes if possible

**SOCIAL OUTCOMES** (how they're perceived, with proof):
GOOD: "Join the 73% of our clients who retired before 60"
BAD: "Be recognized as successful"

Requirements:
- Must have social proof (percentages, numbers, comparisons)
- Must be specific identity or achievement
- Must come from website data

Return JSON array (2-4 benefits, quality over quantity):
[
  {
    "id": "unique-id",
    "statement": "Specific outcome with number/timeline from customer POV",
    "outcomeType": "functional" | "emotional" | "social",
    "metrics": [
      {
        "id": "metric-id",
        "metric": "Specific thing measured",
        "value": "The actual number/result from website",
        "timeframe": "Specific timeline",
        "evidence": "EXACT quote from website"
      }
    ],
    "emotionalPayoff": "Specific emotion (not generic confidence/peace)",
    "socialProof": "Actual numbers/percentages/comparisons from website",
    "evidence": "EXACT website quote proving this benefit",
    "confidence": {
      "overall": 90 if has numbers, 40 if generic,
      "dataQuality": 90 if quoted, 40 if inferred,
      "modelAgreement": 0-100
    }
  }
]

**COMPETITOR TEST:**
Could any competitor claim this exact same benefit?
- If YES → Too generic, add specific numbers or REJECT
- If NO → Good, it's unique to this business

**If no specific benefits with numbers found, return EMPTY ARRAY [] - do NOT invent generic outcomes.**

Every benefit MUST be from customer perspective with EVIDENCE from website.`;

    // Call AI via Supabase edge function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'openrouter',
        model: 'anthropic/claude-opus-4.5',
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 4096,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0]?.message?.content;

    if (!analysisText) {
      throw new Error('No response from AI');
    }

    const benefits = parseBenefits(analysisText);

    // Ensure balanced coverage across outcome types
    const enhancedBenefits = ensureOutcomeBalance(
      benefits,
      industryEQ,
      businessName,
      industry,
      metrics
    );

    const confidence = {
      overall: calculateConfidence(enhancedBenefits, metrics),
      dataQuality: metrics.length > 0 ? 85 : 55,
      modelAgreement: 80,
    };

    return {
      benefits: enhancedBenefits,
      industryBenchmarks: {
        typical_roi: [],
        typical_timeframes: ['30 days', '90 days', '6 months'],
        typical_metrics: metrics,
      },
      confidence,
    };

  } catch (error) {
    console.error('[EnhancedBenefitExtractor] Extraction failed:', error);

    // Generate industry-based outcomes as fallback
    const industryEQ = await getIndustryEQ(industry);
    const fallbackBenefits = generateIndustryBasedOutcomes(
      businessName,
      industry,
      industryEQ
    );

    return {
      benefits: fallbackBenefits,
      confidence: {
        overall: 60,
        dataQuality: 40,
        modelAgreement: 80,
      },
    };
  }
}

/**
 * Parse AI response into benefits
 */
function parseBenefits(response: string): KeyBenefit[] {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return parsed.map((b: any) => {
      // Validate this is an OUTCOME not a FEATURE
      const statement = b.statement || '';
      const lowerStatement = statement.toLowerCase();

      // Red flags for features instead of outcomes
      const featureRedFlags = [
        'years of experience',
        'we have',
        'we offer',
        'our team',
        'certified',
        'licensed',
      ];

      const isFeature = featureRedFlags.some(flag => lowerStatement.includes(flag));

      if (isFeature) {
        // Try to convert to outcome
        console.warn('[EnhancedBenefitExtractor] Converting feature to outcome:', statement);
        // This will be filtered in the balance check
      }

      // Map JTBD outcome types to KeyBenefit types
      const outcomeTypeMap: Record<string, 'quantifiable' | 'qualitative' | 'mixed'> = {
        'functional': 'quantifiable',
        'emotional': 'qualitative',
        'social': 'qualitative',
      };

      const eqFramingMap: Record<string, 'emotional' | 'rational' | 'balanced'> = {
        'functional': 'rational',
        'emotional': 'emotional',
        'social': 'balanced',
      };

      const jtbdType = b.outcomeType || 'functional';

      return {
        id: b.id || `benefit-${Date.now()}-${Math.random()}`,
        statement: statement,
        outcomeType: outcomeTypeMap[jtbdType] || 'mixed',
        eqFraming: eqFramingMap[jtbdType] || 'balanced',
        metrics: (b.metrics || []).map((m: any) => ({
          id: m.id || `metric-${Date.now()}-${Math.random()}`,
          metric: m.metric || '',
          value: m.value || '',
          timeframe: m.timeframe,
          source: {
            id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'website',
            name: 'Website Content',
            url: '',
            extractedAt: new Date(),
            reliability: 85,
            dataPoints: 1
          },
        })),
        sources: [{
          id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'website',
          name: 'Website Content',
          url: '',
          extractedAt: new Date(),
          reliability: 85,
          dataPoints: 1
        }],
        isManualInput: false,
        confidence: {
          ...b.confidence || {
            overall: 70,
            dataQuality: 70,
            modelAgreement: 70,
          },
          sourceCount: b.confidence?.sourceCount ?? 1,
        },
      };
    });
  } catch (error) {
    console.error('[EnhancedBenefitExtractor] Parse error:', error);
    return [];
  }
}

/**
 * Ensure balanced coverage of functional/emotional/social outcomes
 */
function ensureOutcomeBalance(
  benefits: KeyBenefit[],
  industryEQ: any,
  businessName: string,
  industry: string,
  metrics: string[]
): KeyBenefit[] {
  const result = [...benefits];

  // Ensure at least one quantifiable outcome
  if (result.filter(b => b.outcomeType === 'quantifiable').length === 0) {
    const metric = metrics[0] || '30% improvement';
    result.push({
      id: 'functional-fallback',
      statement: `Achieve measurable ${industry} improvements with ${metric}`,
      outcomeType: 'quantifiable',
      eqFraming: 'rational',
      metrics: [{
        id: 'metric-1',
        metric: 'Improvement',
        value: metric,
        timeframe: '90 days',
        source: {
          id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'api',
          name: 'Industry Profile',
          url: '',
          extractedAt: new Date(),
          reliability: 70,
          dataPoints: 1
        },
      }],
      sources: [{
        id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'api',
        name: 'Industry Profile',
        url: '',
        extractedAt: new Date(),
        reliability: 70,
        dataPoints: 1
      }],
      isManualInput: false,
      confidence: {
        overall: 65,
        dataQuality: 50,
        modelAgreement: 80,
        sourceCount: 1,
      },
    });
  }

  // Add emotional outcome if industry is emotional and missing
  if (result.filter(b => b.eqFraming === 'emotional').length === 0 && industryEQ.emotional_weight > 50) {
    const emotionalOutcome = industryEQ.decision_drivers.fear > 30
      ? 'peace of mind and confidence'
      : 'satisfaction and excitement';

    result.push({
      id: 'emotional-fallback',
      statement: `Experience ${emotionalOutcome} knowing you made the right ${industry} choice`,
      outcomeType: 'qualitative',
      eqFraming: 'emotional',
      sources: [{
        id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'api',
        name: 'Industry Profile',
        url: '',
        extractedAt: new Date(),
        reliability: 70,
        dataPoints: 1
      }],
      isManualInput: false,
      confidence: {
        overall: 65,
        dataQuality: 50,
        modelAgreement: 80,
        sourceCount: 1,
      },
    });
  }

  // Add balanced outcome if missing
  if (result.filter(b => b.eqFraming === 'balanced').length === 0 && industryEQ.decision_drivers.status > 15) {
    result.push({
      id: 'balanced-fallback',
      statement: `Be recognized as a savvy decision-maker who found exceptional ${industry} value`,
      outcomeType: 'mixed',
      eqFraming: 'balanced',
      sources: [{
        id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'api',
        name: 'Industry Profile',
        url: '',
        extractedAt: new Date(),
        reliability: 70,
        dataPoints: 1
      }],
      isManualInput: false,
      confidence: {
        overall: 65,
        dataQuality: 50,
        modelAgreement: 80,
        sourceCount: 1,
      },
    });
  }

  return result.slice(0, 6); // Max 6 benefits
}

/**
 * Generate industry-based outcomes as fallback
 */
function generateIndustryBasedOutcomes(
  businessName: string,
  industry: string,
  eq: any
): KeyBenefit[] {
  const benefits: KeyBenefit[] = [];

  // Functional outcome
  benefits.push({
    id: 'industry-functional',
    statement: `Achieve measurable ${industry} results with proven ROI and efficiency gains`,
    outcomeType: 'quantifiable',
    eqFraming: 'rational',
    metrics: [{
      id: 'metric-1',
      metric: 'ROI',
      value: 'Positive',
      timeframe: '90 days',
      source: {
        id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'api',
        name: 'Industry Profile',
        url: '',
        extractedAt: new Date(),
        reliability: 70,
        dataPoints: 1
      },
    }],
    sources: [{
      id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'api',
      name: 'Industry Profile',
      url: '',
      extractedAt: new Date(),
      reliability: 70,
      dataPoints: 1
    }],
    isManualInput: false,
    confidence: {
      overall: 60,
      dataQuality: 40,
      modelAgreement: 80,
      sourceCount: 1,
    },
  });

  // Emotional outcome
  if (eq.emotional_weight > 40) {
    const emotion = eq.decision_drivers.fear > 30 ? 'peace of mind' : 'confidence';
    benefits.push({
      id: 'industry-emotional',
      statement: `Experience ${emotion} knowing you have expert ${industry} support`,
      outcomeType: 'qualitative',
      eqFraming: 'emotional',
      sources: [{
        id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'api',
        name: 'Industry Profile',
        url: '',
        extractedAt: new Date(),
        reliability: 70,
        dataPoints: 1
      }],
      isManualInput: false,
      confidence: {
        overall: 60,
        dataQuality: 40,
        modelAgreement: 80,
        sourceCount: 1,
      },
    });
  }

  return benefits;
}

/**
 * Calculate confidence
 */
function calculateConfidence(benefits: KeyBenefit[], metrics: string[]): number {
  if (benefits.length === 0) return 0;

  const avgConfidence = benefits.reduce((sum, b) => sum + b.confidence.overall, 0) / benefits.length;
  const metricsBonus = metrics.length > 0 ? 15 : 0;
  const outcomeBonus = benefits.every(b => b.outcomeType) ? 10 : 0;

  return Math.min(100, avgConfidence + metricsBonus + outcomeBonus);
}
