/**
 * Benefit/Outcome Extraction Service
 *
 * Extracts quantifiable outcomes and benefits from case studies, testimonials,
 * and results content. Uses Claude API to identify real metrics without estimation.
 *
 * CRITICAL: Only extracts actual metrics found in content - NEVER estimates or makes up numbers.
 *
 * Created: 2025-11-18
 */

import type { BenefitExtractionResult, BenefitMetric, KeyBenefit } from '@/types/uvp-flow.types';
import type { ConfidenceScore, DataSource } from '@/types/uvp-flow.types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Extract benefits and outcomes from case studies and testimonials
 */
export async function extractBenefits(
  caseStudies: string[],
  testimonials: string[],
  resultsContent: string[],
  businessName: string,
  industry: string
): Promise<BenefitExtractionResult> {
  console.log('[BenefitExtractor] Starting benefit extraction...');
  console.log(`  - Case studies: ${caseStudies.length}`);
  console.log(`  - Testimonials: ${testimonials.length}`);
  console.log(`  - Results content: ${resultsContent.length}`);

  // Combine all content for analysis
  const allContent = [
    ...caseStudies.map(cs => `[CASE STUDY]\n${cs}`),
    ...testimonials.map(t => `[TESTIMONIAL]\n${t}`),
    ...resultsContent.map(r => `[RESULTS]\n${r}`)
  ];

  if (allContent.length === 0) {
    console.warn('[BenefitExtractor] No content provided - returning empty result');
    return {
      benefits: [],
      metrics: [],
      confidence: createLowConfidenceScore('No content provided for analysis'),
      sources: []
    };
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[BenefitExtractor] No Supabase configuration - returning fallback result');
    const fallbackResult = fallbackRegexExtraction(allContent);
    return {
      benefits: fallbackResult.benefits,
      metrics: fallbackResult.metrics,
      confidence: createLowConfidenceScore('No Supabase configuration - using fallback extraction'),
      sources: createDataSources(allContent, fallbackResult.metrics)
    };
  }

  try {
    // Call Claude API for extraction
    const extractionResult = await extractMetricsWithClaude(
      allContent.join('\n\n---\n\n'),
      businessName,
      industry
    );

    // Transform Claude response to typed results
    const metrics = extractionResult.metrics.map((m: any, index: number) =>
      createBenefitMetric(m, extractionResult.sources[index] || 'content')
    );

    const benefits = groupMetricsIntoBenefits(metrics, extractionResult.qualitative_benefits);

    const confidence = calculateExtractionConfidence(
      metrics.length,
      extractionResult.quality_indicators
    );

    const sources = createDataSources(allContent, metrics);

    console.log('[BenefitExtractor] Extraction complete:');
    console.log(`  - Quantifiable metrics: ${metrics.length}`);
    console.log(`  - Benefits identified: ${benefits.length}`);
    console.log(`  - Confidence: ${confidence.overall}%`);

    return {
      benefits,
      metrics,
      confidence,
      sources
    };

  } catch (error) {
    console.error('[BenefitExtractor] Extraction failed:', error);

    // Fallback: try basic regex extraction
    console.log('[BenefitExtractor] Attempting fallback regex extraction...');
    const fallbackResult = fallbackRegexExtraction(allContent);

    return {
      benefits: fallbackResult.benefits,
      metrics: fallbackResult.metrics,
      confidence: createLowConfidenceScore('Using fallback extraction due to API failure'),
      sources: createDataSources(allContent, fallbackResult.metrics)
    };
  }
}

/**
 * Call Claude API via Supabase Edge Function to extract metrics and benefits
 */
async function extractMetricsWithClaude(
  content: string,
  businessName: string,
  industry: string
): Promise<any> {
  const prompt = buildExtractionPrompt(content, businessName, industry);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      provider: 'openrouter',
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting quantifiable business outcomes and benefits from testimonials, case studies, and results content. You ONLY extract metrics that are explicitly stated - you NEVER estimate or make up numbers.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for factual extraction
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[BenefitExtractor] AI proxy error:', errorText);
    throw new Error(`AI proxy error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rawResponse = data.choices[0]?.message?.content;

  if (!rawResponse) {
    throw new Error('No response from Claude API');
  }

  // Parse JSON response from Claude
  try {
    const jsonMatch = rawResponse.match(/```json\n([\s\S]*?)\n```/) || rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    return JSON.parse(jsonStr);
  } catch (parseError) {
    console.error('[BenefitExtractor] Failed to parse Claude response:', rawResponse);
    throw new Error('Failed to parse Claude API response as JSON');
  }
}

/**
 * Build extraction prompt for Claude
 */
function buildExtractionPrompt(content: string, businessName: string, industry: string): string {
  return `# Benefit & Outcome Extraction Task

Extract quantifiable metrics and qualitative benefits from the following content about ${businessName} (${industry} industry).

## CRITICAL RULES:
1. ONLY extract metrics that are EXPLICITLY STATED in the content
2. NEVER estimate, infer, or make up numbers
3. Include the exact quote as evidence for each metric
4. If no specific numbers are found, return empty metrics array
5. Extract timeframes only if explicitly mentioned
6. Preserve exact numerical values (don't round or approximate)

## Content to Analyze:

${content}

## Required JSON Response Format:

\`\`\`json
{
  "metrics": [
    {
      "metric_name": "Revenue growth",
      "value": "40%",
      "value_numeric": 40,
      "unit": "percent",
      "timeframe": "6 months",
      "quote": "We saw a 40% increase in revenue within 6 months",
      "source_type": "case_study | testimonial | results",
      "confidence": 95
    }
  ],
  "qualitative_benefits": [
    {
      "benefit": "Better sleep and reduced stress",
      "category": "quality_of_life | efficiency | satisfaction | trust | expertise",
      "quote": "I finally sleep well at night knowing our systems are secure",
      "emotional_weight": 80
    }
  ],
  "industry_comparable_metrics": [
    "Revenue growth",
    "Time saved",
    "Cost reduction"
  ],
  "quality_indicators": {
    "total_metrics_found": 5,
    "metrics_with_numbers": 5,
    "metrics_with_timeframes": 3,
    "has_qualitative_benefits": true,
    "content_quality": "excellent | good | fair | poor"
  },
  "sources": [
    "case_study",
    "testimonial"
  ]
}
\`\`\`

## Metric Extraction Guidelines:

**Look for:**
- Revenue/sales increases: "increased revenue by 30%", "grew sales from $X to $Y"
- Time saved: "reduced processing time by 2 hours", "saved 10 hours per week"
- Cost reduction: "cut costs by $50k", "20% reduction in expenses"
- Efficiency gains: "doubled productivity", "50% faster delivery"
- Quality improvements: "reduced errors by 90%", "increased accuracy to 99%"
- Customer metrics: "NPS score increased from 40 to 75", "retention up 25%"
- Team metrics: "employee satisfaction up 40%", "turnover reduced by half"
- Growth metrics: "expanded from 5 to 50 clients", "tripled our capacity"

**Extract exactly as stated:**
- ✅ "40% increase in revenue" → metric: "Revenue growth", value: "40%"
- ✅ "saved 10 hours per week" → metric: "Time saved", value: "10 hours", timeframe: "per week"
- ✅ "grew from $100k to $150k" → metric: "Revenue growth", value: "50%", calculate if clear
- ❌ "significantly improved" → NO METRIC (no specific number)
- ❌ "much faster" → NO METRIC (no quantification)
- ❌ "great results" → qualitative benefit only

**Timeframes:**
- Only extract if explicitly stated: "in 3 months", "within 6 weeks", "per year"
- ✅ "40% growth in 6 months" → timeframe: "6 months"
- ❌ "40% growth recently" → timeframe: undefined (not specific)

**Industry Comparability:**
Identify metrics that can be compared to ${industry} industry benchmarks:
- Revenue/profit metrics
- Customer acquisition/retention
- Operational efficiency
- Quality/satisfaction scores
- Time-to-value metrics

Return your response as valid JSON only. No additional commentary.`;
}

/**
 * Create BenefitMetric from extracted data
 */
function createBenefitMetric(extractedMetric: any, source: string): BenefitMetric {
  return {
    id: `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    metric: extractedMetric.metric_name,
    value: extractedMetric.value,
    timeframe: extractedMetric.timeframe || undefined,
    source: {
      type: mapSourceType(extractedMetric.source_type),
      url: '', // Filled in later by createDataSources
      snippet: extractedMetric.quote,
      confidence: extractedMetric.confidence || 85
    }
  };
}

/**
 * Map source type string to DataSource type
 */
function mapSourceType(sourceType: string): DataSource['type'] {
  switch (sourceType?.toLowerCase()) {
    case 'case_study':
    case 'case-study':
      return 'case-study';
    case 'testimonial':
      return 'testimonial';
    case 'results':
    case 'analytics':
      return 'analytics';
    default:
      return 'website';
  }
}

/**
 * Group metrics into benefit statements
 */
function groupMetricsIntoBenefits(
  metrics: BenefitMetric[],
  qualitativeBenefits: any[]
): Partial<KeyBenefit>[] {
  const benefits: Partial<KeyBenefit>[] = [];

  // Group quantifiable metrics
  if (metrics.length > 0) {
    const primaryMetrics = metrics.slice(0, 3);

    benefits.push({
      id: `benefit-quantifiable-${Date.now()}`,
      statement: generateBenefitStatement(primaryMetrics),
      outcomeType: 'quantifiable',
      metrics: primaryMetrics,
      eqFraming: 'rational',
      confidence: {
        overall: Math.round(primaryMetrics.reduce((sum, m) => sum + (m.source.confidence || 85), 0) / primaryMetrics.length),
        dataQuality: primaryMetrics.length >= 3 ? 85 : 70,
        sourceCount: primaryMetrics.length,
        modelAgreement: 80,
        reasoning: `Based on ${primaryMetrics.length} quantifiable metrics extracted from content`
      },
      sources: primaryMetrics.map(m => m.source),
      isManualInput: false
    });
  }

  // Add qualitative benefits
  qualitativeBenefits?.forEach((qb: any) => {
    benefits.push({
      id: `benefit-qualitative-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      statement: qb.benefit,
      outcomeType: 'qualitative',
      metrics: [],
      eqFraming: qb.emotional_weight > 60 ? 'emotional' : 'balanced',
      confidence: {
        overall: 75,
        dataQuality: 70,
        sourceCount: 1,
        modelAgreement: 75,
        reasoning: 'Qualitative benefit extracted from customer feedback'
      },
      sources: [{
        type: 'testimonial',
        url: '',
        snippet: qb.quote,
        confidence: 75
      }],
      isManualInput: false
    });
  });

  // Mixed benefits (both quantitative and qualitative)
  if (metrics.length > 0 && qualitativeBenefits?.length > 0) {
    const topMetric = metrics[0];
    const topQualitative = qualitativeBenefits[0];

    benefits.push({
      id: `benefit-mixed-${Date.now()}`,
      statement: `${topQualitative.benefit} with ${topMetric.value} ${topMetric.metric.toLowerCase()}`,
      outcomeType: 'mixed',
      metrics: [topMetric],
      eqFraming: 'balanced',
      confidence: {
        overall: 80,
        dataQuality: 75,
        sourceCount: 2,
        modelAgreement: 80,
        reasoning: 'Combined quantifiable and qualitative benefits'
      },
      sources: [topMetric.source, {
        type: 'testimonial',
        url: '',
        snippet: topQualitative.quote,
        confidence: 75
      }],
      isManualInput: false
    });
  }

  return benefits;
}

/**
 * Generate benefit statement from metrics
 */
function generateBenefitStatement(metrics: BenefitMetric[]): string {
  if (metrics.length === 0) return 'Measurable results';
  if (metrics.length === 1) {
    return `${metrics[0].value} ${metrics[0].metric}${metrics[0].timeframe ? ` in ${metrics[0].timeframe}` : ''}`;
  }

  const metricsList = metrics.slice(0, 2).map(m => `${m.value} ${m.metric.toLowerCase()}`).join(' and ');
  return `Achieve ${metricsList}`;
}

/**
 * Calculate extraction confidence
 */
function calculateExtractionConfidence(
  metricsCount: number,
  qualityIndicators: any
): ConfidenceScore {
  let overall = 50; // Base score

  // More metrics = higher confidence
  if (metricsCount >= 5) overall += 20;
  else if (metricsCount >= 3) overall += 15;
  else if (metricsCount >= 1) overall += 10;

  // Quality indicators boost
  if (qualityIndicators?.metrics_with_numbers === qualityIndicators?.total_metrics_found) {
    overall += 15; // All metrics have numbers
  }

  if (qualityIndicators?.metrics_with_timeframes > 0) {
    overall += 10; // Has timeframes
  }

  if (qualityIndicators?.content_quality === 'excellent') {
    overall += 10;
  }

  overall = Math.min(overall, 95); // Cap at 95%

  return {
    overall,
    dataQuality: qualityIndicators?.content_quality === 'excellent' ? 90 :
                 qualityIndicators?.content_quality === 'good' ? 75 :
                 qualityIndicators?.content_quality === 'fair' ? 60 : 50,
    sourceCount: metricsCount,
    modelAgreement: overall,
    reasoning: metricsCount > 0
      ? `Extracted ${metricsCount} quantifiable metrics from content`
      : 'No quantifiable metrics found in content'
  };
}

/**
 * Create data sources from content
 */
function createDataSources(content: string[], metrics: BenefitMetric[]): DataSource[] {
  const sources: DataSource[] = [];

  metrics.forEach(metric => {
    // Try to find which content piece contained this metric
    const contentPiece = content.find(c => c.includes(metric.source.snippet || metric.value));

    if (contentPiece) {
      const sourceType = contentPiece.startsWith('[CASE STUDY]') ? 'case-study' :
                        contentPiece.startsWith('[TESTIMONIAL]') ? 'testimonial' :
                        'website';

      sources.push({
        type: sourceType,
        url: '', // Could be populated if we tracked source URLs
        snippet: metric.source.snippet,
        confidence: metric.source.confidence
      });
    }
  });

  return sources;
}

/**
 * Create low confidence score for errors
 */
function createLowConfidenceScore(reason: string): ConfidenceScore {
  return {
    overall: 20,
    dataQuality: 20,
    sourceCount: 0,
    modelAgreement: 20,
    reasoning: reason
  };
}

/**
 * Fallback regex extraction (when Claude API fails)
 */
function fallbackRegexExtraction(content: string[]): {
  metrics: BenefitMetric[];
  benefits: Partial<KeyBenefit>[];
} {
  console.log('[BenefitExtractor] Using fallback regex extraction...');

  const metrics: BenefitMetric[] = [];
  const contentStr = content.join('\n');

  // Common metric patterns
  const patterns = [
    // Percentage increases: "40% increase in revenue", "revenue increased by 30%"
    /(\d+)%\s+(?:increase|growth|improvement|boost|rise)\s+(?:in\s+)?([a-z\s]+)/gi,
    /([a-z\s]+)\s+(?:increased|grew|improved|boosted)\s+(?:by\s+)?(\d+)%/gi,

    // Time saved: "saved 10 hours", "reduced time by 5 hours"
    /(?:saved|reduced|cut)\s+(\d+)\s+(hours?|minutes?|days?|weeks?|months?)/gi,

    // Cost reduction: "reduced costs by $50k", "saved $10,000"
    /(?:reduced|saved|cut)\s+(?:costs?\s+)?(?:by\s+)?\$?([\d,]+)k?/gi,

    // Growth metrics: "from 5 to 50", "doubled", "tripled"
    /(?:from|grew from)\s+(\d+)\s+to\s+(\d+)/gi,
    /(doubled|tripled|quadrupled)/gi
  ];

  patterns.forEach(pattern => {
    const matches = contentStr.matchAll(pattern);
    for (const match of matches) {
      if (match[0].length < 200) { // Avoid matching huge text blocks
        metrics.push({
          id: `metric-fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          metric: extractMetricName(match[0]),
          value: extractMetricValue(match[0]),
          timeframe: extractTimeframe(match[0]),
          source: {
            type: 'website',
            url: '',
            snippet: match[0].trim(),
            confidence: 60 // Lower confidence for regex extraction
          }
        });
      }
    }
  });

  // Remove duplicates based on similar snippets
  const uniqueMetrics = deduplicateMetrics(metrics);

  console.log(`[BenefitExtractor] Fallback extraction found ${uniqueMetrics.length} metrics`);

  const benefits = groupMetricsIntoBenefits(uniqueMetrics, []);

  return { metrics: uniqueMetrics, benefits };
}

/**
 * Extract metric name from matched text
 */
function extractMetricName(text: string): string {
  // Try to identify what metric this is
  const lower = text.toLowerCase();

  if (lower.includes('revenue') || lower.includes('sales')) return 'Revenue growth';
  if (lower.includes('time') || lower.includes('hours') || lower.includes('faster')) return 'Time saved';
  if (lower.includes('cost') || lower.includes('expense')) return 'Cost reduction';
  if (lower.includes('productivity') || lower.includes('efficiency')) return 'Productivity increase';
  if (lower.includes('customer') || lower.includes('client')) return 'Customer growth';
  if (lower.includes('profit')) return 'Profit increase';
  if (lower.includes('quality') || lower.includes('accuracy')) return 'Quality improvement';

  return 'Performance improvement';
}

/**
 * Extract metric value from matched text
 */
function extractMetricValue(text: string): string {
  // Extract the number and unit
  const percentMatch = text.match(/(\d+)%/);
  if (percentMatch) return percentMatch[0];

  const numberMatch = text.match(/(\d+)\s*(hours?|minutes?|days?|weeks?|months?|k|\$)/i);
  if (numberMatch) return numberMatch[0];

  const rangeMatch = text.match(/from\s+(\d+)\s+to\s+(\d+)/i);
  if (rangeMatch) {
    const from = parseInt(rangeMatch[1]);
    const to = parseInt(rangeMatch[2]);
    const increase = Math.round(((to - from) / from) * 100);
    return `${increase}%`;
  }

  if (text.toLowerCase().includes('doubled')) return '100%';
  if (text.toLowerCase().includes('tripled')) return '200%';
  if (text.toLowerCase().includes('quadrupled')) return '300%';

  return 'significant increase';
}

/**
 * Extract timeframe from matched text
 */
function extractTimeframe(text: string): string | undefined {
  const timeframeMatch = text.match(/(?:in|within|over|after)\s+(\d+\s+(?:hours?|days?|weeks?|months?|years?))/i);
  return timeframeMatch?.[1] || undefined;
}

/**
 * Deduplicate metrics based on similar content
 */
function deduplicateMetrics(metrics: BenefitMetric[]): BenefitMetric[] {
  const seen = new Set<string>();
  return metrics.filter(m => {
    const key = `${m.metric}-${m.value}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Export singleton pattern (matching existing services)
 */
export const benefitExtractorService = {
  extractBenefits
};
