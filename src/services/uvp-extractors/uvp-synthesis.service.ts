/**
 * UVP Synthesis Service
 *
 * Generates complete Value Proposition statement from all UVP components
 * using JTBD framework and industry intelligence
 */

import { getIndustryEQ } from '@/services/uvp-wizard/emotional-quotient';
import type { CompleteUVP, CustomerProfile, TransformationGoal, UniqueSolution, KeyBenefit } from '@/types/uvp-flow.types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface UVPSynthesisInput {
  customer: CustomerProfile;
  transformation: TransformationGoal;
  solution: UniqueSolution;
  benefit: KeyBenefit;
  businessName: string;
  industry: string;
}

/**
 * Synthesize complete UVP with Why/What/How framework
 */
export async function synthesizeCompleteUVP(input: UVPSynthesisInput): Promise<CompleteUVP> {
  console.log('[UVPSynthesis] Synthesizing complete UVP...');

  try {
    // Get industry EQ for tone/style guidance
    const industryEQ = await getIndustryEQ(input.industry);

    // Build synthesis prompt
    const prompt = `You are a value proposition expert. Extract the SINGLE core job and create ONE powerful 10-15 word UVP.

BUSINESS: ${input.businessName}
INDUSTRY: ${input.industry}

**EXTRACTED DATA:**

CUSTOMER: ${input.customer.statement}
TRANSFORMATION: ${input.transformation.statement}
APPROACH: ${input.solution.statement}
BENEFIT: ${input.benefit.statement}

**CORE PRINCIPLES:**

1. **JTBD**: People don't buy "${input.industry}" services. They buy a SPECIFIC life outcome.
   - What's the ONE struggling moment when they hire you?
   - What progress are they trying to make in their LIFE?

2. **Value Prop**: Must be 10-15 words MAXIMUM
   - Focus on ONE core transformation
   - Specific enough that competitors CAN'T say it
   - Remove ALL filler words

3. **Golden Circle**: ONE sentence each
   - WHY: Your contrarian belief about the industry (not customer deserving)
   - WHAT: Proof it works (numbers/metrics)
   - HOW: What you do INSTEAD of industry standard

**BRUTAL CONSTRAINTS:**
- UVP: 15 words MAXIMUM (not 16, not 17, MAXIMUM 15)
- Golden Circle: 10 words per element MAXIMUM
- NO generic terms: professionals, executives, financial freedom, confidence, peace of mind
- If you can't make it unique in 15 words, return "Unable to create unique positioning"

**YOUR TASK: Pick ONE formula and fill it (15 words max)**

**FORMULA 1 - OUTCOME FOCUS** (Best for rational buyers):
Template: "[Location/Industry] [customer] get [specific outcome + number] through [unique method]"
Example: "Houston executives retire by 55 through life-backward planning"
Word count: 10 words

**FORMULA 2 - TRANSFORMATION FOCUS** (Best for emotional buyers):
Template: "From [specific pain] to [specific outcome] for [specific who]"
Example: "From 70-hour weeks to optional work by 55 for Houston founders"
Word count: 12 words

**FORMULA 3 - ONLY POSITION** (Best for competitive markets):
Template: "The only [location] [provider] who [contrarian approach]"
Example: "The only Houston advisor who refuses commission-based products"
Word count: 9 words

**PICK THE BEST FORMULA** based on data quality:
- If benefit has numbers → Use Formula 1 (Outcome)
- If transformation has specific pain → Use Formula 2 (Transformation)
- If solution has contrarian approach → Use Formula 3 (Only)
- If data is too generic → Return "Unable to create unique positioning"

**GOLDEN CIRCLE** (10 words max each):

WHY: "We believe [contrarian view]"
Example: "We believe wealth builders shouldn't die at their desk"

WHAT: "[Number/percentage] achieve [outcome]"
Example: "73% retire before 60 with $4M+ preserved"

HOW: "By [doing X] not [industry standard Y]"
Example: "By planning life-backward not product-forward"

**EXTRACTION RULES:**
1. Extract the ONE core transformation (not 3, not 5, ONE)
2. Extract location from customer data if present
3. Extract any numbers from benefit data
4. Extract contrarian approach from solution data
5. Count words BEFORE returning
6. If over 15 words, REJECT and try again

**AUTO-REJECT if contains:**
- "professionals" or "executives" without location/industry
- "financial freedom", "financial security", "confidence", "peace of mind"
- "comprehensive", "strategic", "proven", "leverage"
- More than 15 words in UVP
- More than 10 words in any Golden Circle element

Return ONLY valid JSON:
{
  "uvp": "10-15 word statement using ONE formula",
  "formulaUsed": "outcome" | "transformation" | "only",
  "wordCount": actual_number,
  "goldenCircle": {
    "why": "10 word max contrarian belief",
    "what": "10 word max proof with numbers",
    "how": "10 word max contrarian method"
  },
  "passesCompetitorTest": true/false,
  "confidence": {
    "overall": 90 if passes test + under 15 words, 20 if generic/over limit,
    "dataQuality": 0-100,
    "reasoning": "Why this passed or failed"
  }
}

If unable to create unique positioning in 15 words, return:
{
  "uvp": "Unable to create unique positioning from generic data",
  "wordCount": 7,
  "passesCompetitorTest": false,
  "confidence": {"overall": 10, "dataQuality": 10, "reasoning": "Website contains only industry-standard messaging"}
}`;

    // Call AI via Supabase edge function
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
        temperature: 0.3
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

    const synthesis = parseSynthesis(analysisText);

    // Build complete UVP object
    const completeUVP: CompleteUVP = {
      id: `uvp-${Date.now()}`,
      targetCustomer: input.customer,
      transformationGoal: input.transformation,
      uniqueSolution: input.solution,
      keyBenefit: input.benefit,
      valuePropositionStatement: synthesis.valuePropositionStatement,
      whyStatement: synthesis.whyStatement,
      whatStatement: synthesis.whatStatement,
      howStatement: synthesis.howStatement,
      overallConfidence: {
        ...synthesis.confidence,
        sourceCount: 4
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('[UVPSynthesis] Synthesis complete');
    return completeUVP;

  } catch (error) {
    console.error('[UVPSynthesis] Synthesis failed:', error);

    // Generate fallback synthesis
    return generateFallbackSynthesis(input);
  }
}

/**
 * Banned words that indicate generic corporate speak
 */
const BANNED_WORDS = [
  'comprehensive',
  'strategic',
  'proven',
  'leverage',
  'optimize',
  'solutions',
  'expertise',
  'innovative',
  'cutting-edge',
  'methodology',
  'best-in-class'
];

/**
 * Validate UVP statement quality - BRUTAL 15-word max
 */
function validateUVP(statement: string): { valid: boolean; reason?: string } {
  const wordCount = statement.split(/\s+/).length;

  // BRUTAL word count: 15 words MAXIMUM
  if (wordCount > 15) {
    return { valid: false, reason: `Too long (${wordCount} words, MAXIMUM 15)` };
  }

  // Warn if too short
  if (wordCount < 8) {
    console.warn('[UVPSynthesis] UVP very short:', wordCount, 'words');
  }

  // Check for banned words - AUTO REJECT
  const lowerStatement = statement.toLowerCase();
  const foundBannedWords = BANNED_WORDS.filter(word => lowerStatement.includes(word));
  if (foundBannedWords.length > 0) {
    return { valid: false, reason: `BANNED WORDS: ${foundBannedWords.join(', ')}` };
  }

  // Additional banned terms from the plan
  const additionalBanned = ['financial freedom', 'financial security', 'peace of mind', 'confidence'];
  const foundAdditionalBanned = additionalBanned.filter(phrase => lowerStatement.includes(phrase));
  if (foundAdditionalBanned.length > 0) {
    return { valid: false, reason: `GENERIC TERMS: ${foundAdditionalBanned.join(', ')}` };
  }

  // Check for "professionals" or "executives" without location/industry
  if ((lowerStatement.includes('professionals') || lowerStatement.includes('executives')) &&
      !lowerStatement.match(/\b(houston|texas|dallas|austin|energy|tech|medical|practice)\b/i)) {
    return { valid: false, reason: 'Generic "professionals/executives" without location/industry' };
  }

  return { valid: true };
}

/**
 * Parse AI response with formula-based approach
 */
function parseSynthesis(response: string): {
  valuePropositionStatement: string;
  whyStatement: string;
  whatStatement: string;
  howStatement: string;
  confidence: {
    overall: number;
    dataQuality: number;
    modelAgreement: number;
  };
} {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Get UVP from new simplified format
    const uvpStatement = parsed.uvp || '';
    const wordCount = parsed.wordCount || uvpStatement.split(/\s+/).length;

    // ENFORCE 15 word limit
    if (wordCount > 15) {
      console.error('[UVPSynthesis] ✗ UVP exceeds 15 words:', wordCount, 'words');
      console.error('[UVPSynthesis] ✗ Statement:', uvpStatement);
      // Truncate to 15 words
      const words = uvpStatement.split(/\s+/).slice(0, 15);
      const truncated = words.join(' ');
      console.warn('[UVPSynthesis] Truncated to:', truncated);
    }

    // Extract Golden Circle
    const whyStatement = parsed.goldenCircle?.why || '';
    const whatStatement = parsed.goldenCircle?.what || '';
    const howStatement = parsed.goldenCircle?.how || '';

    // Validate Golden Circle word counts (10 max each)
    const whyWords = whyStatement.split(/\s+/).length;
    const whatWords = whatStatement.split(/\s+/).length;
    const howWords = howStatement.split(/\s+/).length;

    if (whyWords > 10) {
      console.error('[UVPSynthesis] ✗ WHY exceeds 10 words:', whyWords);
    }
    if (whatWords > 10) {
      console.error('[UVPSynthesis] ✗ WHAT exceeds 10 words:', whatWords);
    }
    if (howWords > 10) {
      console.error('[UVPSynthesis] ✗ HOW exceeds 10 words:', howWords);
    }

    // Log formula used and competitor test result
    console.log('[UVPSynthesis] Formula used:', parsed.formulaUsed || 'unknown');
    console.log('[UVPSynthesis] Word count:', wordCount);
    console.log('[UVPSynthesis] Passes competitor test:', parsed.passesCompetitorTest);

    // Check if WHY needs "We believe" prefix
    let finalWhy = whyStatement;
    if (finalWhy && !finalWhy.toLowerCase().startsWith('we believe')) {
      finalWhy = `We believe ${finalWhy}`;
    }

    return {
      valuePropositionStatement: uvpStatement,
      whyStatement: finalWhy,
      whatStatement: whatStatement,
      howStatement: howStatement,
      confidence: {
        overall: parsed.confidence?.overall || 50,
        dataQuality: parsed.confidence?.dataQuality || 50,
        modelAgreement: parsed.passesCompetitorTest ? 90 : 30,
      },
    };
  } catch (error) {
    console.error('[UVPSynthesis] Parse error:', error);
    throw error;
  }
}

/**
 * Generate fallback synthesis - honest about generic data
 */
function generateFallbackSynthesis(input: UVPSynthesisInput): CompleteUVP {
  console.warn('[UVPSynthesis] Falling back - extracted data too generic for unique positioning');

  // Instead of generating more generic content, be honest
  const vpStatement = `Unable to extract unique value proposition from website. ${input.businessName} uses industry-standard ${input.industry} messaging.`;

  return {
    id: `uvp-${Date.now()}`,
    targetCustomer: input.customer,
    transformationGoal: input.transformation,
    uniqueSolution: input.solution,
    keyBenefit: input.benefit,
    valuePropositionStatement: vpStatement,
    whyStatement: 'No unique contrarian belief found on website',
    whatStatement: 'No specific measurable outcomes found on website',
    howStatement: 'No differentiated approach found on website',
    overallConfidence: {
      overall: 20, // Very low confidence
      dataQuality: 20,
      modelAgreement: 20,
      sourceCount: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
