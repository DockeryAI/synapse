/**
 * Benefit/Outcome Extraction Service - JTBD Framework
 *
 * Extracts REAL customer outcomes using Jobs-to-be-Done framework:
 * - Functional outcomes: What customers can DO/ACHIEVE
 * - Emotional outcomes: How customers FEEL
 * - Social outcomes: How customers are PERCEIVED
 *
 * CRITICAL: Extracts OUTCOMES not FEATURES
 * ❌ "Independent financial advisory" = feature
 * ✅ "Save 25% on premiums while improving coverage" = outcome
 *
 * Created: 2025-11-18
 * Enhanced: 2025-11-19
 */

import { getIndustryEQ } from '@/services/uvp-wizard/emotional-quotient';
import type { BenefitExtractionResult, BenefitMetric, KeyBenefit } from '@/types/uvp-flow.types';
import type { ConfidenceScore, DataSource } from '@/types/uvp-flow.types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Extract benefits and outcomes from content using JTBD framework
 */
export async function extractBenefits(
  transformations: any[],
  solutions: any[],
  websiteContent: string[],
  businessName: string,
  industry: string
): Promise<BenefitExtractionResult> {
  console.log('[BenefitExtractor] Starting OUTCOME extraction...');
  console.log(`  - Industry: ${industry}`);
  console.log(`  - Transformations: ${transformations.length}`);
  console.log(`  - Solutions: ${solutions.length}`);
  console.log(`  - Website content: ${websiteContent.length} sections`);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[BenefitExtractor] No Supabase configuration - returning fallback');
    return createFallbackBenefits(industry);
  }

  try {
    // Get industry EQ for outcome weighting
    const industryEQ = await getIndustryEQ(industry);
    console.log(`[BenefitExtractor] Industry EQ: ${industryEQ.emotional_weight}% emotional`);

    // Combine content for analysis (limit size)
    const contentForAnalysis = websiteContent.join('\n\n').substring(0, 10000);

    // Build context from transformations and solutions
    const transformationContext = transformations.map(t => t.statement || t.fromState + ' → ' + t.toState).join('\n');
    const solutionContext = solutions.map(s => s.statement || s.methodology).join('\n');

    const prompt = buildOutcomeExtractionPrompt(
      businessName,
      industry,
      contentForAnalysis,
      transformationContext,
      solutionContext,
      industryEQ
    );

    // Call Claude API
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'openrouter',
        model: 'anthropic/claude-3.5-sonnet',
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

    const benefits = parseOutcomeResponse(analysisText, industryEQ);

    console.log(`[BenefitExtractor] Extracted ${benefits.length} outcome-focused benefits`);

    return {
      benefits,
      metrics: benefits.flatMap(b => b.metrics || []),
      confidence: calculateConfidence(benefits, websiteContent.length),
      sources: benefits.flatMap(b => b.sources || [])
    };

  } catch (error) {
    console.error('[BenefitExtractor] Extraction failed:', error);
    return createFallbackBenefits(industry);
  }
}

/**
 * Build prompt for outcome extraction using JTBD
 */
function buildOutcomeExtractionPrompt(
  businessName: string,
  industry: string,
  websiteContent: string,
  transformationContext: string,
  solutionContext: string,
  industryEQ: any
): string {
  const emotionalWeight = industryEQ.emotional_weight;
  const functionalWeight = 100 - emotionalWeight;

  return `Extract customer OUTCOMES (not features) for ${businessName} in the ${industry} industry using the Jobs-to-be-Done framework.

**CRITICAL: OUTCOMES vs FEATURES**

❌ WRONG (these are features/services):
- "Independent financial advisory services"
- "Fiduciary commitment to clients"
- "Comprehensive insurance solutions"
- "24/7 customer support"

✅ RIGHT (these are customer outcomes):
- "Cut insurance costs by 25% without sacrificing coverage" (functional)
- "Sleep soundly knowing your family's future is protected" (emotional)
- "Be recognized as a trusted advisor by your clients" (social)
- "Save 10 hours per month on policy management" (functional + metric)

**TRANSFORMATION CONTEXT** (Benefits must DELIVER ON these transformations):
${transformationContext || 'Not provided'}

**SOLUTION CONTEXT** (Benefits come FROM these solutions):
${solutionContext || 'Not provided'}

**WEBSITE CONTENT**:
${websiteContent}

**INDUSTRY INTELLIGENCE**:
- Emotional weight: ${emotionalWeight}% (${emotionalWeight > 60 ? 'high - emphasize feelings' : 'moderate - balance rational and emotional'})
- Functional weight: ${functionalWeight}%
- Purchase mindset: ${industryEQ.purchase_mindset}
- Key drivers: Fear ${industryEQ.decision_drivers.fear}%, Aspiration ${industryEQ.decision_drivers.aspiration}%

**EXTRACTION REQUIREMENTS**:

Extract 5-8 benefits across these JTBD dimensions:

1. **FUNCTIONAL OUTCOMES** (${functionalWeight}% weight):
   - What customers can DO or ACHIEVE
   - Measurable improvements (time/money saved, efficiency gained)
   - Quantify when possible: "Save X hours", "Reduce costs by Y%", "Increase Z by 50%"
   - Examples: "Process claims 3x faster", "Cut premiums by 20%", "Get approved in 24 hours"

2. **EMOTIONAL OUTCOMES** (${emotionalWeight}% weight):
   - How customers FEEL after using the solution
   - Focus on: ${industryEQ.decision_drivers.fear > 30 ? 'relief from anxiety, peace of mind, confidence, security' : 'satisfaction, excitement, pride, joy'}
   - Examples: "Never lose sleep over coverage gaps", "Feel confident your assets are protected", "Eliminate the stress of claims"

3. **SOCIAL OUTCOMES** (10% weight):
   - How customers are PERCEIVED
   - Status, recognition, reputation, trust
   - Examples: "Be seen as a responsible business owner", "Gain respect from your community", "Build a reputation for taking care of your team"

**OUTCOME VALIDATION**:
- Does it describe what the customer GETS (outcome) not what you DO (feature)?
- Is it specific to THIS business based on website content?
- Does it complete a transformation story (from problem → to outcome)?
- Can a customer picture themselves experiencing this benefit?

Return JSON with this structure:
\`\`\`json
{
  "outcomes": [
    {
      "id": "unique-id",
      "statement": "Clear outcome statement (not feature description)",
      "outcomeType": "functional" | "emotional" | "social" | "mixed",
      "metrics": ["Specific metric if mentioned"],
      "eqFraming": "emotional" | "rational" | "balanced",
      "evidence": "Quote from website showing this outcome",
      "confidence": 0-100,
      "reasoning": "Why this is an outcome not a feature"
    }
  ]
}
\`\`\`

REMEMBER: Extract OUTCOMES (what customers achieve/feel) NOT FEATURES (what you offer).`;
}

/**
 * Parse AI response into outcome-based benefits
 */
function parseOutcomeResponse(response: string, industryEQ: any): KeyBenefit[] {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/) || response.match(/\{[\s\S]*"outcomes"[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const outcomes = Array.isArray(parsed) ? parsed : parsed.outcomes || [];

    return outcomes
      .filter(validateOutcome) // Filter out feature-based "benefits"
      .map((outcome: any) => ({
        id: outcome.id || `benefit-${Date.now()}-${Math.random()}`,
        statement: outcome.statement,
        outcomeType: outcome.outcomeType === 'functional' ? 'quantifiable' : (outcome.outcomeType === 'emotional' ? 'qualitative' : outcome.outcomeType),
        metrics: parseMetrics(outcome.metrics),
        eqFraming: outcome.eqFraming || 'balanced',
        confidence: {
          overall: outcome.confidence || 75,
          dataQuality: 70,
          sourceCount: 1,
          modelAgreement: 75
        },
        sources: [{
          id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'website' as const,
          name: 'Website Content',
          url: '',
          extractedAt: new Date(),
          reliability: outcome.confidence || 75,
          dataPoints: 1
        }],
        isManualInput: false
      }));

  } catch (error) {
    console.error('[BenefitExtractor] Parse error:', error);
    return [];
  }
}

/**
 * Validate that extracted benefit is an OUTCOME not a FEATURE
 */
function validateOutcome(outcome: any): boolean {
  if (!outcome.statement) return false;

  const statement = outcome.statement.toLowerCase();

  // Red flags: feature words
  const featureWords = [
    'services',
    'solutions',
    'platform',
    'system',
    'tool',
    'software',
    'commitment',
    'approach',
    'methodology',
    'process',
    'advisory',
    'consulting'
  ];

  // If statement starts with or heavily contains feature words, reject it
  const hasFeatureLanguage = featureWords.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return statement.startsWith(word) || (statement.match(regex) && statement.length < 50);
  });

  if (hasFeatureLanguage) {
    console.log(`[BenefitExtractor] ⚠️ Rejected feature-based benefit: "${outcome.statement}"`);
    return false;
  }

  // Green flags: outcome words
  const outcomeWords = ['save', 'reduce', 'increase', 'achieve', 'get', 'gain', 'feel', 'eliminate', 'never worry', 'peace of mind', 'confidence', 'faster', 'better'];
  const hasOutcomeLanguage = outcomeWords.some(word => statement.includes(word));

  if (!hasOutcomeLanguage && !outcome.metrics?.length) {
    console.log(`[BenefitExtractor] ⚠️ Rejected vague benefit: "${outcome.statement}"`);
    return false;
  }

  return true;
}

/**
 * Parse metrics from various formats
 */
function parseMetrics(metrics: any): any[] {
  if (!metrics) return [];
  if (typeof metrics === 'string') return [metrics];
  if (Array.isArray(metrics)) return metrics;
  return [];
}

/**
 * Calculate confidence based on outcome quality
 */
function calculateConfidence(benefits: KeyBenefit[], contentSections: number): ConfidenceScore {
  if (benefits.length === 0) {
    return {
      overall: 0,
      dataQuality: 0,
      sourceCount: 0,
      modelAgreement: 0,
      reasoning: 'No benefits extracted'
    };
  }

  const avgConfidence = benefits.reduce((sum, b) => {
    const conf = typeof b.confidence === 'number' ? b.confidence : (b.confidence?.overall || 0);
    return sum + conf;
  }, 0) / benefits.length;
  const hasMetrics = benefits.filter(b => b.metrics && b.metrics.length > 0).length;

  return {
    overall: Math.round(avgConfidence),
    dataQuality: contentSections > 3 ? 80 : 60,
    sourceCount: benefits.length,
    modelAgreement: hasMetrics > 0 ? 85 : 70,
    reasoning: `Extracted ${benefits.length} outcome-focused benefits, ${hasMetrics} with metrics`
  };
}

/**
 * Create fallback benefits based on industry
 */
function createFallbackBenefits(industry: string): BenefitExtractionResult {
  console.log('[BenefitExtractor] Creating industry-based fallback benefits');

  // Generic outcome-focused benefits by industry type
  const fallbackBenefits: KeyBenefit[] = [
    {
      id: 'benefit-functional-1',
      statement: `Achieve measurable results in your ${industry} operations`,
      outcomeType: 'quantifiable',
      metrics: [],
      eqFraming: 'rational',
      confidence: {
        overall: 60,
        dataQuality: 50,
        sourceCount: 1,
        modelAgreement: 60
      },
      sources: [{
        id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'api',
        name: 'Industry Data',
        url: '',
        extractedAt: new Date(),
        reliability: 60,
        dataPoints: 1
      }],
      isManualInput: false
    },
    {
      id: 'benefit-emotional-1',
      statement: `Gain peace of mind knowing your ${industry} needs are handled`,
      outcomeType: 'qualitative',
      metrics: [],
      eqFraming: 'emotional',
      confidence: {
        overall: 60,
        dataQuality: 50,
        sourceCount: 1,
        modelAgreement: 60
      },
      sources: [{
        id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'api',
        name: 'Industry Data',
        url: '',
        extractedAt: new Date(),
        reliability: 60,
        dataPoints: 1
      }],
      isManualInput: false
    }
  ];

  return {
    benefits: fallbackBenefits,
    metrics: [],
    confidence: {
      overall: 60,
      dataQuality: 50,
      sourceCount: 0,
      modelAgreement: 60,
      reasoning: 'Using industry-based fallback benefits'
    },
    sources: fallbackBenefits.flatMap(b => b.sources || [])
  };
}

/**
 * Export singleton pattern
 */
export const benefitExtractorService = {
  extractBenefits
};
