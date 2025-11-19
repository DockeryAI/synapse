/**
 * Enhanced Transformation Goal Extractor with JTBD Framework
 *
 * Extracts transformation goals using:
 * - Customer testimonials and success stories
 * - About/Mission pages for "why we exist" language
 * - Industry EQ emotional drivers
 * - JTBD emotional/functional/social dimensions
 */

import { claudeAIService } from '@/services/ai/ClaudeAIService';
import { getIndustryEQ } from '@/services/uvp-wizard/emotional-quotient';
import type { TransformationGoal } from '@/types/uvp-flow.types';
import type { EmotionalGoal } from '@/types/jtbd.types';

interface CustomerQuote {
  quote: string;
  source: string;
  transformation_signals: string[];
}

interface TransformationExtractionResult {
  transformations: TransformationGoal[];
  quotes: CustomerQuote[];
  confidence: {
    overall: number;
    dataQuality: number;
    modelAgreement: number;
  };
}

/**
 * Extract customer quotes and transformation signals from website
 */
function extractCustomerQuotes(websiteContent: string[]): CustomerQuote[] {
  const quotes: CustomerQuote[] = [];

  websiteContent.forEach((content, index) => {
    // Extract testimonials
    const testimonialPatterns = [
      /<div[^>]*(?:class|id)="[^"]*testimonial[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
      /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi,
      /"([^"]{30,300})"/g,
    ];

    testimonialPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const quoteText = match[1]?.replace(/<[^>]*>/g, '').trim();
        if (quoteText && quoteText.length >= 30) {
          quotes.push({
            quote: quoteText,
            source: `page-${index}`,
            transformation_signals: extractTransformationSignals(quoteText),
          });
        }
      }
    });

    // Extract before/after language
    const transformationPatterns = [
      /(?:I|We|They)\s+(?:was|were|used to|had)\s+([^.!?]{20,200})[.!?]/gi,
      /Before\s+([^,]{10,100}),\s+(?:now|today|after)\s+([^.!?]{10,100})[.!?]/gi,
      /(?:from|went from)\s+([^→to]{10,100})\s+(?:→|to)\s+([^.!?]{10,100})/gi,
    ];

    transformationPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const fullMatch = match[0];
        if (fullMatch.length >= 30) {
          quotes.push({
            quote: fullMatch,
            source: `transformation-${index}`,
            transformation_signals: extractTransformationSignals(fullMatch),
          });
        }
      }
    });
  });

  return quotes.slice(0, 20); // Limit to top 20 quotes
}

/**
 * Extract transformation signals from text
 */
function extractTransformationSignals(text: string): string[] {
  const signals: string[] = [];
  const lowerText = text.toLowerCase();

  // Emotional signals
  const emotionalKeywords = [
    'confident', 'peace of mind', 'frustrated', 'worried', 'anxious',
    'relieved', 'excited', 'secure', 'empowered', 'overwhelmed',
  ];

  emotionalKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      signals.push(`emotional:${keyword}`);
    }
  });

  // Functional signals
  const functionalKeywords = [
    'saved', 'increased', 'reduced', 'improved', 'faster',
    'efficient', 'streamlined', 'optimized', 'automated',
  ];

  functionalKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      signals.push(`functional:${keyword}`);
    }
  });

  // Social signals
  const socialKeywords = [
    'recognized', 'respected', 'leader', 'trusted', 'recommended',
    'impressed', 'professional', 'expert',
  ];

  socialKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      signals.push(`social:${keyword}`);
    }
  });

  return signals;
}

/**
 * Extract transformation goals with industry intelligence
 */
export async function extractEnhancedTransformations(
  websiteContent: string[],
  businessName: string,
  industry: string
): Promise<TransformationExtractionResult> {
  console.log('[EnhancedTransformationExtractor] Starting extraction...');
  console.log(`  - Industry: ${industry}`);
  console.log(`  - Website pages: ${websiteContent.length}`);

  try {
    // Extract customer quotes
    const quotes = extractCustomerQuotes(websiteContent);
    console.log(`[EnhancedTransformationExtractor] Found ${quotes.length} quotes`);

    // Get industry EQ profile
    const industryEQ = await getIndustryEQ(industry);
    console.log('[EnhancedTransformationExtractor] Industry EQ loaded');

    // Prepare content for analysis
    const contentForAnalysis = websiteContent.join('\n\n').substring(0, 10000);
    const quotesText = quotes.map(q => `"${q.quote}"`).join('\n');

    // Build prompt with JTBD framework
    const prompt = `Analyze this ${industry} business to extract transformation goals using the Jobs-to-be-Done framework.

BUSINESS: ${businessName}
INDUSTRY: ${industry}

INDUSTRY CONTEXT:
- EQ Profile: ${industryEQ.emotional_weight}% emotional, ${100 - industryEQ.emotional_weight}% rational
- JTBD Focus: ${industryEQ.jtbd_focus}
- Purchase Mindset: ${industryEQ.purchase_mindset}
- Fear/Anxiety: ${industryEQ.decision_drivers.fear}%
- Status/Recognition: ${industryEQ.decision_drivers.status}%

CUSTOMER QUOTES FOUND:
${quotesText || 'No quotes found'}

WEBSITE CONTENT:
${contentForAnalysis}

Extract 5-7 transformation goals across the JTBD dimensions:

**FUNCTIONAL TRANSFORMATIONS** (what practical progress they make):
- From [current functional state] → To [desired functional state]
- Focus on measurable outcomes, time saved, efficiency gains, cost reductions

**EMOTIONAL TRANSFORMATIONS** (how they want to feel):
- From [current emotional state] → To [desired emotional state]
- Focus on feelings: anxiety→confidence, overwhelm→control, frustration→peace

**SOCIAL TRANSFORMATIONS** (how they want to be perceived):
- From [current social state] → To [desired social state]
- Focus on status, recognition, identity, belonging

Return JSON array with this exact structure:
[
  {
    "id": "unique-id",
    "statement": "Complete transformation statement showing before→after",
    "dimension": "functional" | "emotional" | "social",
    "fromState": "Clear current state description",
    "toState": "Clear desired state description",
    "emotionalDrivers": ["specific", "emotions", "involved"],
    "functionalDrivers": ["specific", "outcomes", "achieved"],
    "evidence": "Quote or content that supports this",
    "confidence": {
      "overall": 0-100,
      "dataQuality": 0-100,
      "modelAgreement": 0-100
    }
  }
]

Make transformations SPECIFIC to this business, not generic templates.
Focus on what customers REALLY care about based on the evidence.`;

    const response = await claudeAIService.generateContent(prompt);
    const transformations = parseTransformations(response, industryEQ);

    // Ensure we have good coverage across dimensions
    const enhancedTransformations = ensureDimensionCoverage(
      transformations,
      industryEQ,
      businessName,
      industry
    );

    const confidence = {
      overall: calculateConfidence(enhancedTransformations, quotes),
      dataQuality: quotes.length > 0 ? 85 : 50,
      modelAgreement: 80,
    };

    return {
      transformations: enhancedTransformations,
      quotes,
      confidence,
    };

  } catch (error) {
    console.error('[EnhancedTransformationExtractor] Extraction failed:', error);

    // Generate fallback using industry EQ
    const industryEQ = await getIndustryEQ(industry);
    const fallbackTransformations = generateIndustryBasedTransformations(
      businessName,
      industry,
      industryEQ
    );

    return {
      transformations: fallbackTransformations,
      quotes: [],
      confidence: {
        overall: 60,
        dataQuality: 40,
        modelAgreement: 80,
      },
    };
  }
}

/**
 * Parse AI response into transformation goals
 */
function parseTransformations(response: string, industryEQ: any): TransformationGoal[] {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return parsed.map((t: any) => ({
      id: t.id || `transformation-${Date.now()}-${Math.random()}`,
      statement: t.statement || '',
      fromState: t.fromState || '',
      toState: t.toState || '',
      emotionalDrivers: t.emotionalDrivers || [],
      functionalDrivers: t.functionalDrivers || [],
      evidenceQuotes: t.evidence ? [t.evidence] : [],
      sources: [{ type: 'website' as const, url: '' }],
      confidence: t.confidence || {
        overall: 70,
        dataQuality: 70,
        modelAgreement: 70,
      },
    }));
  } catch (error) {
    console.error('[EnhancedTransformationExtractor] Parse error:', error);
    return [];
  }
}

/**
 * Ensure we have transformations across all JTBD dimensions
 */
function ensureDimensionCoverage(
  transformations: TransformationGoal[],
  industryEQ: any,
  businessName: string,
  industry: string
): TransformationGoal[] {
  const result = [...transformations];

  // Check dimension coverage
  const hasFunctional = result.some(t => t.functionalDrivers.length > 0);
  const hasEmotional = result.some(t => t.emotionalDrivers.length > 0);

  // Add missing dimensions based on industry EQ
  if (!hasFunctional) {
    result.push({
      id: `functional-${Date.now()}`,
      statement: `From inefficient ${industry} processes → To optimized outcomes with measurable results`,
      fromState: `Inefficient ${industry} operations`,
      toState: 'Streamlined, optimized performance',
      functionalDrivers: ['Time savings', 'Cost reduction', 'Efficiency gains'],
      emotionalDrivers: [],
      evidenceQuotes: [],
      sources: [{ type: 'industry-profile' as const, url: '' }],
      confidence: {
        overall: 70,
        dataQuality: 60,
        modelAgreement: 80,
      },
    });
  }

  if (!hasEmotional && industryEQ.emotional_weight > 40) {
    const emotionalOutcome = industryEQ.decision_drivers.fear > 30
      ? 'confidence and peace of mind'
      : 'excitement and satisfaction';

    result.push({
      id: `emotional-${Date.now()}`,
      statement: `From anxiety about ${industry} challenges → To ${emotionalOutcome}`,
      fromState: `Worried about ${industry} outcomes`,
      toState: `Confident in results`,
      functionalDrivers: [],
      emotionalDrivers: [emotionalOutcome],
      evidenceQuotes: [],
      sources: [{ type: 'industry-profile' as const, url: '' }],
      confidence: {
        overall: 70,
        dataQuality: 60,
        modelAgreement: 80,
      },
    });
  }

  return result.slice(0, 7); // Max 7 transformations
}

/**
 * Generate industry-based transformations as fallback
 */
function generateIndustryBasedTransformations(
  businessName: string,
  industry: string,
  eq: any
): TransformationGoal[] {
  const transformations: TransformationGoal[] = [];

  // Functional transformation
  transformations.push({
    id: 'industry-functional',
    statement: `From struggling with ${industry} challenges → To achieving measurable results and efficiency`,
    fromState: `Inefficient ${industry} operations`,
    toState: 'Optimized performance with clear outcomes',
    functionalDrivers: ['Time savings', 'Cost reduction', 'Quality improvement'],
    emotionalDrivers: [],
    evidenceQuotes: [],
    sources: [{ type: 'industry-profile' as const, url: '' }],
    confidence: {
      overall: 65,
      dataQuality: 50,
      modelAgreement: 80,
    },
  });

  // Emotional transformation
  if (eq.jtbd_focus === 'emotional' || eq.emotional_weight > 50) {
    const emotionalOutcome = eq.decision_drivers.fear > 30
      ? 'peace of mind and confidence'
      : 'satisfaction and excitement';

    transformations.push({
      id: 'industry-emotional',
      statement: `From anxiety about ${industry} outcomes → To ${emotionalOutcome}`,
      fromState: `Worried and uncertain about ${industry}`,
      toState: 'Confident and reassured',
      functionalDrivers: [],
      emotionalDrivers: [emotionalOutcome, 'Trust', 'Relief'],
      evidenceQuotes: [],
      sources: [{ type: 'industry-profile' as const, url: '' }],
      confidence: {
        overall: 65,
        dataQuality: 50,
        modelAgreement: 80,
      },
    });
  }

  // Social transformation
  if (eq.decision_drivers.status > 15) {
    transformations.push({
      id: 'industry-social',
      statement: `From being overlooked → To being recognized as a ${industry} leader`,
      fromState: 'Unknown or overlooked',
      toState: 'Recognized and respected',
      functionalDrivers: [],
      emotionalDrivers: ['Pride', 'Recognition'],
      evidenceQuotes: [],
      sources: [{ type: 'industry-profile' as const, url: '' }],
      confidence: {
        overall: 65,
        dataQuality: 50,
        modelAgreement: 80,
      },
    });
  }

  return transformations;
}

/**
 * Calculate confidence based on evidence quality
 */
function calculateConfidence(transformations: TransformationGoal[], quotes: CustomerQuote[]): number {
  if (transformations.length === 0) return 0;

  const avgConfidence = transformations.reduce((sum, t) => sum + t.confidence.overall, 0) / transformations.length;
  const evidenceBonus = quotes.length > 0 ? 10 : 0;

  return Math.min(100, avgConfidence + evidenceBonus);
}
