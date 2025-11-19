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

    // Transform raw extraction into typed result
    const result = transformToResult(rawExtraction, websiteUrls);

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
  const prompt = `You are an expert business analyst extracting REAL differentiators from website content.

Your task: Identify ONLY the differentiators that are EXPLICITLY STATED on the website.

CRITICAL RULES:
- Extract ONLY what is explicitly stated - no inference, no assumptions
- Look for clear "how we're different" language
- Find methodology/process descriptions that are unique
- Identify proprietary terms, frameworks, or approaches
- Each differentiator must have EVIDENCE (exact quote from the website)
- Be CONSERVATIVE - if it's not clearly stated, don't extract it
- Return EMPTY arrays if no clear differentiators are found

BUSINESS: ${businessName}

CONTENT:
${content}

WHAT TO LOOK FOR:

1. DIFFERENTIATING STATEMENTS:
   Look for phrases like:
   - "Unlike other [competitors]..."
   - "The only [company] that..."
   - "Our unique approach..."
   - "What sets us apart..."
   - "Different from traditional..."

2. METHODOLOGY DESCRIPTIONS:
   - Named processes (e.g., "The 5-Step Success Framework")
   - Unique workflows or approaches
   - Proprietary methods or systems
   - Specific steps or phases that differentiate

3. PROPRIETARY APPROACHES:
   - Trademarked terms or frameworks
   - Custom-built tools or systems
   - Unique combinations of services
   - Specialized expertise or certifications

4. EVIDENCE REQUIREMENTS:
   - Must extract exact quote from website
   - Must include source URL
   - Quote must support the differentiator claim

5. STRENGTH SCORING (0-100):
   - 90-100: Truly unique, proprietary, or trademarked approach
   - 70-89: Clear differentiation with specific methodology
   - 50-69: Notable difference but not entirely unique
   - 30-49: Somewhat different but common in industry
   - 0-29: Weak or vague differentiation

EXAMPLES OF VALID DIFFERENTIATORS:

Good (Extract these):
- "Our proprietary 4D Marketing Framework combines data, design, distribution, and dollars in a unique sequencing that achieves 3x better results than traditional approaches"
  Evidence: [exact quote from website]
  Strength: 85

- "Unlike agencies that outsource, we have an in-house team of 50+ specialists under one roof"
  Evidence: [exact quote from website]
  Strength: 70

Bad (Do NOT extract these):
- "We provide excellent customer service" (too generic, everyone says this)
- "We use cutting-edge technology" (vague, no specifics)
- "We're the best in the industry" (claim without evidence)

Return ONLY valid JSON (no markdown, no explanations):
{
  "differentiators": [
    {
      "statement": "Our proprietary 4D Marketing Framework",
      "evidence": "Exact quote from the website that supports this differentiator",
      "source_url": "https://example.com/methodology",
      "strength_score": 85,
      "category": "proprietary_approach"
    }
  ],
  "methodology": {
    "description": "Clear description of their unique methodology if one exists",
    "evidence": "Exact quote describing the methodology",
    "source_url": "https://example.com/how-we-work"
  },
  "proprietary_approach": {
    "description": "Description of proprietary approach if one exists",
    "evidence": "Exact quote describing the approach",
    "source_url": "https://example.com/our-approach"
  },
  "confidence": "high | medium | low",
  "extraction_notes": "Brief note about extraction quality and any limitations"
}

IMPORTANT: If you don't find clear differentiators, return empty arrays and null for methodology/proprietary_approach. Do NOT make up differentiators.`;

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
  websiteUrls: string[]
): DifferentiatorExtractionResult {
  // Transform differentiators
  const differentiators: Differentiator[] = raw.differentiators.map((diff, index) => {
    const source: DataSource = {
      type: 'website',
      url: diff.source_url || websiteUrls[0] || '',
      snippet: diff.evidence,
      confidence: diff.strength_score
    };

    return {
      id: `diff-${Date.now()}-${index}`,
      statement: diff.statement,
      evidence: diff.evidence,
      source,
      strengthScore: diff.strength_score
    };
  });

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
      type: 'website',
      url: raw.methodology.source_url || websiteUrls[0] || '',
      snippet: raw.methodology.evidence,
      confidence: 80
    });
  }

  // Add proprietary approach source if present
  if (raw.proprietary_approach) {
    sources.push({
      type: 'website',
      url: raw.proprietary_approach.source_url || websiteUrls[0] || '',
      snippet: raw.proprietary_approach.evidence,
      confidence: 80
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
 * Calculate confidence score
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

  // Adjust based on number and strength of differentiators
  const avgStrength = differentiators.length > 0
    ? differentiators.reduce((sum, d) => sum + d.strengthScore, 0) / differentiators.length
    : 0;

  // Weight: 60% Claude confidence, 40% average strength
  overall = Math.round(overall * 0.6 + avgStrength * 0.4);

  // Data quality based on evidence richness
  const dataQuality = Math.min(
    100,
    (differentiators.filter(d => d.evidence.length > 50).length / Math.max(differentiators.length, 1)) * 100
  );

  return {
    overall: Math.max(0, Math.min(100, overall)),
    dataQuality: Math.round(dataQuality),
    sourceCount: differentiators.length,
    modelAgreement: overall,
    reasoning: raw.extraction_notes || 'Differentiators extracted from website content'
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
