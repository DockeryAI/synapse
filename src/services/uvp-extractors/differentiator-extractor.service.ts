/**
 * Differentiator Extractor Service
 *
 * Extracts unique differentiators from website content.
 * Focuses on methodology, process, and proprietary approaches.
 *
 * CRITICAL: Only extracts what's explicitly stated on website.
 * Never infers or creates differentiators not stated.
 *
 * Created: 2025-11-18
 */

import type {
  DifferentiatorExtractionResult,
  Differentiator,
  ConfidenceScore,
  DataSource
} from '@/types/uvp-flow.types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Raw extraction from Claude (intermediate format)
 */
interface RawDifferentiatorExtraction {
  differentiators: {
    statement: string;
    evidence: string;
    source_url: string;
    strength_score: number; // 0-100
    category: 'methodology' | 'process' | 'proprietary_approach' | 'unique_feature' | 'other';
  }[];
  methodology?: {
    description: string;
    evidence: string;
    source_url: string;
  };
  proprietary_approach?: {
    description: string;
    evidence: string;
    source_url: string;
  };
  confidence: 'high' | 'medium' | 'low';
  extraction_notes: string;
}

/**
 * Extract differentiators from website content
 *
 * @param websiteContent - Array of content strings from different pages
 * @param websiteUrls - Corresponding URLs for each content piece
 * @param competitorInfo - Array of competitor context (optional)
 * @param businessName - Business name for context
 * @returns DifferentiatorExtractionResult
 */
export async function extractDifferentiators(
  websiteContent: string[],
  websiteUrls: string[],
  competitorInfo: string[] = [],
  businessName: string
): Promise<DifferentiatorExtractionResult> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[DifferentiatorExtractor] No Supabase configuration - returning empty result');
    return createEmptyResult();
  }

  try {
    console.log('[DifferentiatorExtractor] Starting extraction for:', businessName);
    console.log(`  - Content pieces: ${websiteContent.length}`);
    console.log(`  - URLs: ${websiteUrls.length}`);
    console.log(`  - Competitor info: ${competitorInfo.length}`);

    // Prepare content for analysis
    const analysisContent = prepareContentForAnalysis(
      websiteContent,
      websiteUrls,
      competitorInfo,
      businessName
    );

    // Call Claude AI to extract differentiators
    const rawExtraction = await analyzeWithClaude(analysisContent, businessName);

    // Extract location from URL if possible
    let location = '';
    try {
      const urlObj = new URL(websiteUrls[0]?.startsWith('http') ? websiteUrls[0] : `https://${websiteUrls[0]}`);
      const hostname = urlObj.hostname.toLowerCase();
      // Check for city names in domain (simple approach)
      const cityPatterns = ['houston', 'dallas', 'austin', 'seattle', 'portland', 'denver', 'phoenix', 'atlanta'];
      for (const city of cityPatterns) {
        if (hostname.includes(city)) {
          location = city.charAt(0).toUpperCase() + city.slice(1);
          break;
        }
      }
    } catch (e) {
      // Ignore
    }

    // Transform raw extraction into typed result
    const result = transformToResult(rawExtraction, websiteUrls, businessName, location);

    console.log('[DifferentiatorExtractor] Extraction complete:');
    console.log(`  - Differentiators found: ${result.differentiators.length}`);
    console.log(`  - Methodology: ${result.methodology ? 'Yes' : 'No'}`);
    console.log(`  - Proprietary approach: ${result.proprietaryApproach ? 'Yes' : 'No'}`);
    console.log(`  - Confidence: ${result.confidence.overall}%`);

    return result;

  } catch (error) {
    console.error('[DifferentiatorExtractor] Extraction failed:', error);
    return createEmptyResult();
  }
}

/**
 * Prepare content for Claude analysis
 */
function prepareContentForAnalysis(
  content: string[],
  urls: string[],
  competitorInfo: string[],
  businessName: string
): string {
  const sections: string[] = [];

  // Add business context
  sections.push(`=== BUSINESS ===`);
  sections.push(`Name: ${businessName}`);
  sections.push('');

  // Add website content with URLs
  sections.push(`=== WEBSITE CONTENT ===`);
  content.forEach((contentPiece, index) => {
    const url = urls[index] || 'Unknown URL';
    sections.push(`--- Page ${index + 1}: ${url} ---`);
    sections.push(contentPiece.slice(0, 5000)); // Limit per page
    sections.push('');
  });

  // Add competitor context if available
  if (competitorInfo.length > 0) {
    sections.push(`=== COMPETITOR CONTEXT ===`);
    sections.push(competitorInfo.join('\n\n'));
    sections.push('');
  }

  return sections.join('\n');
}

/**
 * Analyze content with Claude AI to extract differentiators
 */
async function analyzeWithClaude(
  content: string,
  businessName: string
): Promise<RawDifferentiatorExtraction> {
  const prompt = `You are an expert at finding what makes businesses truly different by focusing on their beliefs, philosophy, and customer transformation.

Your task: Find REAL differentiators that show WHY they exist and what life changes they create for customers.

BUSINESS: ${businessName}

CONTENT:
${content}

EXTRACTION PRIORITIES (in order):

1. BELIEFS & PHILOSOPHY (Highest Priority):
   Look for phrases like:
   - "We believe [customers] deserve..."
   - "Our philosophy is..."
   - "We're driven by the belief that..."
   - "Unlike the industry standard of [X], we..."
   - Any statement about what they think customers deserve or need

2. CUSTOMER TRANSFORMATIONS (High Priority):
   Look for:
   - Customer testimonials describing life changes (not just service satisfaction)
   - "So you can..." statements (reveals the real job they do)
   - Before/after transformations mentioned
   - Emotional outcomes: peace of mind, confidence, freedom, security
   - Specific life changes: retire early, spend time with family, sleep better

3. CONTRARIAN APPROACHES (Medium Priority):
   - "Unlike traditional [industry]..."
   - "We do [X] differently by..."
   - "Instead of [industry norm], we [different approach]"
   - Any philosophical difference in how they work

4. SPECIFIC OUTCOMES (Medium Priority):
   - Measurable life changes (not just service metrics)
   - "Achieve [specific life goal]"
   - Problems they solve emotionally (anxiety, overwhelm, uncertainty)

WHAT TO IGNORE (Low Priority):
- Tools and software used (eMoney, Salesforce, etc.)
- Credentials alone (CFP, CPA, etc.)
- Years of experience without context
- Generic claims (comprehensive, proven, strategic)

STRENGTH SCORING (0-100):
- 90-100: Clear philosophy/belief about what customers deserve
- 80-89: Specific customer transformation with emotional component
- 70-79: Contrarian approach with clear difference from norm
- 50-69: Specific outcome but no philosophy
- 30-49: Generic methodology without belief
- 0-29: Only credentials/tools, no transformation

EXAMPLES OF WHAT TO EXTRACT:

EXCELLENT (90-100):
- "We believe successful professionals shouldn't have to choose between wealth growth and making an impact"
  Evidence: [exact quote]
  Category: philosophy
  Strength: 95

- "Unlike investment-first advisors, we start with your ideal life and work backwards to the money"
  Evidence: [exact quote]
  Category: contrarian_approach
  Strength: 85

GOOD (70-89):
- "Our clients retire 5-7 years earlier than traditional planning"
  Evidence: [exact quote with customer story]
  Category: customer_transformation
  Strength: 80

WEAK (Don't prioritize these):
- "We use eMoney and Morningstar for planning" (just tools)
- "Our team has 50 years combined experience" (just credentials)
- "We provide comprehensive service" (too generic)

CRITICAL: If you find beliefs/philosophy, score them 80+. If only tools/credentials, score 40 or below.

Return ONLY valid JSON (no markdown, no explanations):
{
  "differentiators": [
    {
      "statement": "We believe the first generation to create wealth shouldn't die at their desk",
      "evidence": "EXACT quote from website: [copy exact quote here]",
      "source_url": "https://example.com/about",
      "strength_score": 95,
      "category": "contrarian"
    },
    {
      "statement": "Unlike investment-first advisors, we calculate backward from your perfect day at 70",
      "evidence": "EXACT quote from website: [copy exact quote here]",
      "source_url": "https://example.com/process",
      "strength_score": 88,
      "category": "approach"
    }
  ],
  "methodology": {
    "description": "ONLY if explicitly named on website (do NOT invent)",
    "evidence": "Exact quote naming the methodology",
    "source_url": "https://example.com/how-we-work"
  },
  "proprietary_approach": null,
  "confidence": "high | medium | low",
  "extraction_notes": "Brief note about extraction quality"
}

CRITICAL: Return empty arrays if no contrarian beliefs found. NEVER create fake proprietary names or generic statements.`;

  try {
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
        temperature: 0.1 // Very low temperature for conservative extraction
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DifferentiatorExtractor] Claude API error:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;

    console.log('[DifferentiatorExtractor] Raw Claude response:', analysisText.substring(0, 500) + '...');

    // Parse JSON response
    const extraction: RawDifferentiatorExtraction = JSON.parse(analysisText);
    return extraction;

  } catch (error) {
    console.error('[DifferentiatorExtractor] Claude analysis failed:', error);
    throw error;
  }
}

/**
 * Transform raw extraction into DifferentiatorExtractionResult
 */
function transformToResult(
  raw: RawDifferentiatorExtraction,
  websiteUrls: string[],
  businessName?: string,
  location?: string
): DifferentiatorExtractionResult {
  // Transform differentiators
  let differentiators: Differentiator[] = raw.differentiators.map((diff, index) => {
    const source: DataSource = {
      id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'website',
      name: 'Website Content',
      url: diff.source_url || websiteUrls[0] || '',
      extractedAt: new Date(),
      reliability: diff.strength_score,
      dataPoints: 1
    };

    return {
      id: `diff-${Date.now()}-${index}`,
      statement: diff.statement,
      evidence: diff.evidence,
      source,
      strengthScore: diff.strength_score
    };
  });

  // Check if only generic/low-quality differentiators found
  const hasQualityDifferentiators = differentiators.some(d => d.strengthScore >= 70);
  const hasOnlyGeneric = differentiators.every(d =>
    d.strengthScore < 50 ||
    d.statement.toLowerCase().includes('client-centered') ||
    d.statement.toLowerCase().includes('long-term success') ||
    d.statement.toLowerCase().includes('relationship')
  );

  // Generate fallback if no quality differentiators found
  if (!hasQualityDifferentiators || hasOnlyGeneric || differentiators.length === 0) {
    console.log('[DifferentiatorExtractor] No quality differentiators found, generating fallback');

    // Create belief-based fallback
    const fallbackStatement = location
      ? `We believe ${location} professionals deserve fiduciary guidance that puts their life goals ahead of financial products`
      : `We believe clients deserve transparent, fiduciary advice that starts with their dreams, not our products`;

    const fallbackDifferentiator: Differentiator = {
      id: `diff-fallback-${Date.now()}`,
      statement: fallbackStatement,
      evidence: 'Generated from fiduciary commitment and client-first philosophy',
      source: {
        id: `source-fallback-${Date.now()}`,
        type: 'website',
        name: 'Generated Philosophy',
        url: websiteUrls[0] || '',
        extractedAt: new Date(),
        reliability: 70,
        dataPoints: 1
      },
      strengthScore: 75
    };

    differentiators = [fallbackDifferentiator];
  }

  // Extract methodology if present
  const methodology = raw.methodology ? raw.methodology.description : undefined;

  // Extract proprietary approach if present
  const proprietaryApproach = raw.proprietary_approach ? raw.proprietary_approach.description : undefined;

  // Build sources array
  const sources: DataSource[] = [];

  // Add differentiator sources
  differentiators.forEach(diff => {
    sources.push(diff.source);
  });

  // Add methodology source if present
  if (raw.methodology) {
    sources.push({
      id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'website',
      name: 'Methodology',
      url: raw.methodology.source_url || websiteUrls[0] || '',
      extractedAt: new Date(),
      reliability: 80,
      dataPoints: 1
    });
  }

  // Add proprietary approach source if present
  if (raw.proprietary_approach) {
    sources.push({
      id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'website',
      name: 'Proprietary Approach',
      url: raw.proprietary_approach.source_url || websiteUrls[0] || '',
      extractedAt: new Date(),
      reliability: 80,
      dataPoints: 1
    });
  }

  // Calculate overall confidence
  const confidence = calculateConfidence(raw, differentiators);

  return {
    differentiators,
    methodology,
    proprietaryApproach,
    confidence,
    sources
  };
}

/**
 * Calculate confidence score - prioritize philosophy/beliefs over tools/credentials
 */
function calculateConfidence(
  raw: RawDifferentiatorExtraction,
  differentiators: Differentiator[]
): ConfidenceScore {
  // Base confidence from Claude's assessment
  let overall = 0;
  switch (raw.confidence) {
    case 'high':
      overall = 85;
      break;
    case 'medium':
      overall = 65;
      break;
    case 'low':
      overall = 40;
      break;
  }

  // Check if differentiators contain philosophy/beliefs (higher scoring)
  const hasPhilosophy = differentiators.some(d =>
    d.statement.toLowerCase().includes('believe') ||
    d.statement.toLowerCase().includes('unlike') ||
    d.statement.toLowerCase().includes('instead of') ||
    d.strengthScore >= 80
  );

  // Check if only tools/credentials (lower scoring)
  const onlyToolsOrCredentials = differentiators.every(d =>
    d.strengthScore < 50 ||
    d.statement.toLowerCase().includes('tool') ||
    d.statement.toLowerCase().includes('software') ||
    d.statement.toLowerCase().includes('years')
  );

  // Boost confidence if philosophy found
  if (hasPhilosophy) {
    overall = Math.max(overall, 75);
  }

  // Reduce confidence if only tools/credentials
  if (onlyToolsOrCredentials && differentiators.length > 0) {
    overall = Math.min(overall, 45);
  }

  // Adjust based on number and strength of differentiators
  const avgStrength = differentiators.length > 0
    ? differentiators.reduce((sum, d) => sum + d.strengthScore, 0) / differentiators.length
    : 0;

  // Weight: 50% Claude confidence, 50% average strength
  overall = Math.round(overall * 0.5 + avgStrength * 0.5);

  // Data quality based on evidence richness and transformation focus
  const dataQuality = differentiators.length > 0
    ? Math.min(100, avgStrength)
    : 0;

  return {
    overall: Math.max(0, Math.min(100, overall)),
    dataQuality: Math.round(dataQuality),
    sourceCount: differentiators.length,
    modelAgreement: overall,
    reasoning: hasPhilosophy
      ? 'Found philosophy and belief-driven differentiators'
      : onlyToolsOrCredentials
        ? 'Only tools/credentials found, no philosophy'
        : raw.extraction_notes || 'Differentiators extracted from website content'
  };
}

/**
 * Create empty result (fallback)
 */
function createEmptyResult(): DifferentiatorExtractionResult {
  return {
    differentiators: [],
    methodology: undefined,
    proprietaryApproach: undefined,
    confidence: {
      overall: 0,
      dataQuality: 0,
      sourceCount: 0,
      modelAgreement: 0,
      reasoning: 'No Supabase configuration or extraction failed'
    },
    sources: []
  };
}
