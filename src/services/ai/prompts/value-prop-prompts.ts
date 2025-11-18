/**
 * Value Proposition AI Prompts
 *
 * Structured prompts for the 3-tier AI pipeline:
 * - Tier 1 (Haiku): Extract raw value signals
 * - Tier 2 (Sonnet): Analyze and structure value propositions
 * - Tier 3 (Opus): Synthesize compelling value statements
 *
 * Created: 2025-11-18
 */

export interface BusinessContext {
  businessName: string;
  industry: string;
  website?: string;
  services?: string[];
  targetAudience?: string;
}

/**
 * TIER 1: EXTRACT - Haiku
 * Fast extraction of value signals from raw data
 */
export function getExtractPrompt(context: BusinessContext, rawData: string): string {
  return `Extract value proposition signals from the following business data.

Business: ${context.businessName}
Industry: ${context.industry}
${context.targetAudience ? `Target Audience: ${context.targetAudience}` : ''}

Instructions:
1. Extract EXPLICIT value claims (what they say they offer)
2. Extract IMPLICIT value signals (testimonials, reviews, case studies)
3. Extract differentiators (what makes them unique)
4. Extract proof points (metrics, achievements, credentials)
5. Identify market positioning clues (premium/budget, specialist/generalist)

Raw Data:
${rawData}

Output JSON with:
{
  "dataPoints": ["array of value claims and signals"],
  "sources": ["website", "reviews", "testimonials", etc],
  "raw": {
    "explicitClaims": [],
    "implicitSignals": [],
    "differentiators": [],
    "proofPoints": [],
    "positioning": ""
  }
}`;
}

/**
 * TIER 2: ANALYZE - Sonnet
 * Structure extracted data into value proposition candidates
 */
export function getAnalyzePrompt(context: BusinessContext): string {
  return `Analyze the extracted value signals and structure them into value proposition candidates.

Business: ${context.businessName}
Industry: ${context.industry}

Instructions:
1. Identify 3-5 distinct value propositions
2. Categorize each as "core", "secondary", or "aspirational"
3. For each value proposition:
   - Write a clear, concise statement (1-2 sentences)
   - Identify the market position it implies
   - List 3 key differentiators
   - Calculate confidence based on data quality

Analysis Framework:
- Core value: The PRIMARY reason customers choose this business
- Secondary value: Additional benefits that support the core
- Aspirational value: Forward-looking value (where they want to be)

Market Positions:
- Premium specialist (high price, narrow focus)
- Premium generalist (high price, broad offerings)
- Value specialist (competitive price, narrow focus)
- Value leader (competitive price, broad offerings)

Output JSON with:
{
  "structured": {
    "valuePropositions": [
      {
        "id": "vp-1",
        "statement": "Clear value prop statement",
        "category": "core|secondary|aspirational",
        "marketPosition": "market position",
        "differentiators": ["diff1", "diff2", "diff3"],
        "supportingEvidence": ["evidence1", "evidence2"],
        "confidence": 0-100
      }
    ]
  },
  "patterns": ["identified patterns"],
  "confidence": 0-100,
  "reasoning": "why these value props were selected"
}`;
}

/**
 * TIER 3: SYNTHESIZE - Opus
 * Polish and validate value propositions
 */
export function getSynthesizePrompt(context: BusinessContext, eqScore?: number): string {
  const emotionalGuidance = eqScore && eqScore > 70
    ? 'Use emotionally resonant language that speaks to customer aspirations and transformations.'
    : eqScore && eqScore < 40
    ? 'Use clear, factual language emphasizing measurable outcomes and ROI.'
    : 'Balance emotional appeal with rational benefits.';

  return `Synthesize and validate the analyzed value propositions into polished, compelling statements.

Business: ${context.businessName}
Industry: ${context.industry}
${eqScore ? `Industry Emotional Quotient: ${eqScore}% - ${emotionalGuidance}` : ''}

Instructions:
1. Refine each value proposition statement for clarity and impact
2. Ensure they follow best practices:
   - Clear and specific (not vague claims)
   - Customer-centric (focus on their outcome, not your features)
   - Differentiated (unique, not generic)
   - Provable (backed by evidence)
   - Concise (1-2 sentences max)

3. Validate each proposition:
   - Does it pass the "So what?" test?
   - Is it meaningfully different from competitors?
   - Is it supported by evidence?
   - Would customers care about this?

4. Calculate final confidence scores based on:
   - Data quality (how much evidence)
   - Model agreement (consistency across data)
   - Uniqueness (how differentiated)
   - Clarity (how well-articulated)

Output JSON with:
{
  "final": {
    "valuePropositions": [
      {
        "id": "vp-1",
        "statement": "Polished value prop statement",
        "category": "core|secondary|aspirational",
        "marketPosition": "market position",
        "differentiators": ["diff1", "diff2", "diff3"],
        "confidence": {
          "overall": 0-100,
          "dataQuality": 0-100,
          "sourceCount": number,
          "modelAgreement": 0-100,
          "reasoning": "why this confidence score"
        }
      }
    ]
  },
  "validation": {
    "passed": true|false,
    "issues": ["any validation issues found"],
    "confidence": 0-100
  }
}`;
}

/**
 * Complete value prop prompts for full pipeline
 */
export function getValuePropPrompts(context: BusinessContext, rawData: string, eqScore?: number) {
  return {
    extract: getExtractPrompt(context, rawData),
    analyze: getAnalyzePrompt(context),
    synthesize: getSynthesizePrompt(context, eqScore)
  };
}
