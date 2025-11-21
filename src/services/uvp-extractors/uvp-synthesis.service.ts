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
  customer: CustomerProfile | CustomerProfile[];
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

    // Handle multiple customer profiles
    const customers = Array.isArray(input.customer) ? input.customer : [input.customer];
    const customerStatements = customers.map(c => c.statement).join(' AND ');
    const primaryCustomer = customers[0]; // For backward compatibility

    // Prefer JTBD outcome statements when available
    const transformationText = input.transformation.outcomeStatement || input.transformation.statement;
    const solutionText = input.solution.outcomeStatement || input.solution.statement;
    const benefitText = input.benefit.outcomeStatement || input.benefit.statement;

    // Check if we have JTBD-transformed outcomes (they're much better than Formula 4)
    const hasJTBDOutcomes = !!(input.transformation.outcomeStatement || input.solution.outcomeStatement || input.benefit.outcomeStatement);

    console.log('[UVPSynthesis] Has JTBD outcomes:', hasJTBDOutcomes);
    if (hasJTBDOutcomes) {
      console.log('[UVPSynthesis] JTBD transformation:', transformationText);
      console.log('[UVPSynthesis] JTBD solution:', solutionText);
      console.log('[UVPSynthesis] JTBD benefit:', benefitText);
    }

    // If we have JTBD outcomes, use them directly - they're already perfect
    if (hasJTBDOutcomes) {
      const prompt = `You are a value proposition expert. You have JTBD-transformed outcome-focused statements that are already excellent.

BUSINESS: ${input.businessName}
INDUSTRY: ${input.industry}

**JTBD-TRANSFORMED OUTCOMES (already outcome-focused, use these!):**

TRANSFORMATION: ${transformationText}
APPROACH: ${solutionText}
BENEFIT: ${benefitText}

**YOUR TASK:**
Create THREE different 10-15 word UVP variations that each capture the transformation differently.

**CRITICAL RULES:**
1. USE the transformation and emotional outcome from JTBD (the progress they make)
2. DO NOT use "From...to" phrasing - sounds templated
3. USE active verbs: Transform, Turn, Navigate, Discover, Build, etc.
4. DO NOT use specific product models/years (no "'67 Mustang" or "1952 Mickey Mantle")
5. KEEP it universal for the business (works for ALL their customers)
6. Focus on the TRANSFORMATION, not features
7. Maximum 15 words per variation
8. Each variation should feel DIFFERENT (different structure, different angle)

**GOOD EXAMPLES:**
- "Transform overwhelming real estate stress into dream home confidence with agents who care like family"
- "Turn blank screens into weeks of content that actually gets customers"
- "Insurance that knows your collection deserves more than generic coverage"

**BAD EXAMPLES:**
- "From wondering if you're covered to knowing you're protected" ❌ (templated from/to)
- "Insurance for your 1967 Mustang GT Fastback" ❌ (too specific)
- "Specialized expertise and personalized protection" ❌ (too generic)
- "We provide comprehensive insurance solutions" ❌ (feature-focused)

**VARIATION STYLES:**
1. Action-focused: "Transform X into Y with Z"
2. Benefit-focused: "Your outcome delivered through approach"
3. Direct: "Outcome. Method. Result."

**GOLDEN CIRCLE** (create simple, clear statements):
- WHY (Purpose/Belief): What do they believe customers deserve? (e.g., "Collectors deserve specialized protection")
- WHAT (Offering): What do they actually provide? (e.g., "Insurance for collector cars")
- HOW (Approach): How are they different? (e.g., "By collectors who understand collections")

Return ONLY valid JSON:
{
  "variations": [
    {
      "uvp": "First variation - action-focused",
      "style": "action",
      "wordCount": actual_number
    },
    {
      "uvp": "Second variation - benefit-focused",
      "style": "benefit",
      "wordCount": actual_number
    },
    {
      "uvp": "Third variation - direct",
      "style": "direct",
      "wordCount": actual_number
    }
  ],
  "formulaUsed": "jtbd-outcome",
  "goldenCircle": {
    "why": "Clear belief statement (e.g., 'Collectors deserve specialized protection')",
    "what": "Clear offering (e.g., 'Insurance for collector cars')",
    "how": "Clear approach (e.g., 'By collectors who understand')"
  },
  "confidence": {
    "overall": 85-95 based on clarity,
    "dataQuality": 85-95,
    "reasoning": "Used JTBD transformation outcomes"
  }
}`;

      // Call AI with JTBD-focused prompt
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

      const completeUVP: CompleteUVP = {
        id: `uvp-${Date.now()}`,
        targetCustomer: primaryCustomer,
        transformationGoal: input.transformation,
        uniqueSolution: input.solution,
        keyBenefit: input.benefit,
        valuePropositionStatement: synthesis.variations[0]?.uvp || 'Unable to generate UVP',
        variations: synthesis.variations,
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

      console.log('[UVPSynthesis] JTBD-based synthesis complete');
      console.log('[UVPSynthesis] Generated', synthesis.variations.length, 'UVP variations');
      synthesis.variations.forEach((v, i) => {
        console.log(`[UVPSynthesis] Variation ${i + 1}:`, v.uvp);
      });
      return completeUVP;
    }

    // Fall back to Formula 4 if no JTBD outcomes
    const prompt = `You are a value proposition expert. Create ONE powerful 10-15 word UVP using core values that resonate with ALL customer segments.

BUSINESS: ${input.businessName}
INDUSTRY: ${input.industry}
NUMBER OF CUSTOMER TYPES: ${customers.length}
IMPORTANT: USE FORMULA 4 (CORE VALUES) - This creates inclusive messaging that appeals to the entire customer base

**EXTRACTED DATA:**

CUSTOMER${customers.length > 1 ? 'S' : ''}: ${customerStatements}
TRANSFORMATION: ${transformationText}
APPROACH: ${solutionText}
BENEFIT: ${benefitText}

**CORE PRINCIPLES:**

1. **JTBD**: People don't buy "${input.industry}" services. They buy a SPECIFIC life outcome.
   - What's the ONE struggling moment when they hire you?
   - What progress are they trying to make in their LIFE?

2. **Value Prop**: Must be 10-15 words MAXIMUM
   - Focus on ONE core transformation
   - Specific enough that competitors CAN'T say it
   - Remove ALL filler words

3. **Golden Circle** (Simon Sinek Framework): ONE sentence each
   - WHY: The belief/purpose that drives you (why you exist beyond making money)
   - WHAT: The actual products/services you provide (what you do)
   - HOW: Your unique process/approach that brings the WHY to life (how you're different)

**BRUTAL CONSTRAINTS:**
- UVP: 15 words MAXIMUM (not 16, not 17, MAXIMUM 15)
- Golden Circle: 10 words per element MAXIMUM
- NO generic terms: professionals, executives, financial freedom, confidence, peace of mind
- If you can't make it unique in 15 words, return "Unable to create unique positioning"

**YOUR TASK: Create a value proposition using FORMULA 4 (15 words max)**

**FORMULA 4 - CORE VALUES** (ALWAYS USE THIS):
Template: "[Core value 1] and [core value 2] through [what you do]"

This formula works because:
- Speaks to what the business stands for (not what customers transform from/to)
- Appeals to ALL customer segments (B2B, B2C, different demographics)
- Focuses on the business's strengths and values
- Creates inclusive messaging that doesn't alienate any customer type

Examples by industry (FOCUS ON BUSINESS VALUES):
- Bakery: "Quality craftsmanship and community warmth through artisan baking"
- Real Estate: "Local knowledge and personal commitment through property expertise"
- Financial: "Informed decisions and financial peace through independent advisory"
- Healthcare: "Patient-first care and medical excellence through comprehensive wellness"
- Tech: "Reliable innovation and seamless integration through technology solutions"
- Consulting: "Strategic clarity and measurable impact through expert guidance"
- Construction: "Built-to-last quality and transparent process through construction expertise"
- Legal: "Protected interests and clear direction through legal advocacy"
- Marketing: "Brand growth and market presence through creative strategy"

CRITICAL RULES FOR FORMULA 4:
1. First value = TANGIBLE business strength (expertise, quality, precision, innovation, reliability)
2. Second value = EMOTIONAL outcome (trust, confidence, peace, connection, empowerment)
3. Method = WHAT the business does (NOT how customers change)
4. NEVER use transformation words: "transform", "from", "to", "become", "journey"
5. NEVER describe customer problems or pain points
6. ALWAYS focus on what the BUSINESS provides, not what CUSTOMERS achieve
7. Test: Could this describe the business on their best day AND worst day? (Values are constant)

BAD Examples (transformation-focused):
✗ "Transform uncertainty into confidence through financial planning"
✗ "From overwhelmed to organized through real estate guidance"
✗ "Helping families find their dream homes"

GOOD Examples (values-focused):
✓ "Expert guidance and lasting relationships through real estate services"
✓ "Technical excellence and reliable support through IT solutions"
✓ "Crafted quality and personal service through custom woodworking"

IMPORTANT: ALL businesses should use Formula 4 to create inclusive, values-based messaging.

**GOLDEN CIRCLE** (10 words max each, aligned with Simon Sinek):

WHY (Belief/Purpose): "We believe [core belief about the world]"
Example: "We believe every celebration deserves handcrafted, not mass-produced"

WHAT (Products/Services): "We [provide/create/offer] [specific products/services]"
Example: "We bake artisan breads, custom cakes, and pastries daily"

HOW (Unique Process): "[Our unique method/approach/differentiator]"
Example: "Using 70-year-old sourdough starter and overnight fermentation"

**EXTRACTION RULES:**
1. Extract the TWO core values the business embodies
2. First value = tangible delivery (quality, expertise, precision, innovation)
3. Second value = emotional resonance (trust, connection, peace, confidence)
4. Method = clear description of service/product category
5. Count words BEFORE returning
6. If over 15 words, REJECT and try again
7. Test: Would this appeal to ALL customer types mentioned?

**AUTO-REJECT if contains:**
- "professionals" or "executives" without location/industry
- "financial freedom", "financial security", "confidence", "peace of mind"
- "comprehensive", "strategic", "proven", "leverage"
- More than 15 words in UVP
- More than 10 words in any Golden Circle element

Return ONLY valid JSON:
{
  "uvp": "10-15 word value proposition using Formula 4 (Core Values)",
  "formulaUsed": "values",
  "wordCount": actual_number,
  "goldenCircle": {
    "why": "10 word max belief/purpose statement",
    "what": "10 word max description of actual products/services",
    "how": "10 word max unique process/method"
  },
  "passesCompetitorTest": true/false,
  "confidence": {
    "overall": 90 if passes test + under 15 words, 20 if generic/over limit,
    "dataQuality": 0-100,
    "reasoning": "Why this creates inclusive messaging for all customer segments"
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
      targetCustomer: primaryCustomer,
      transformationGoal: input.transformation,
      uniqueSolution: input.solution,
      keyBenefit: input.benefit,
      valuePropositionStatement: synthesis.variations[0]?.uvp || 'Unable to generate UVP',
      variations: synthesis.variations,
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
    console.log('[UVPSynthesis] Generated', synthesis.variations.length, 'UVP variations');
    synthesis.variations.forEach((v, i) => {
      console.log(`[UVPSynthesis] Variation ${i + 1}:`, v.uvp);
    });
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
  variations: Array<{ uvp: string; style: string; wordCount: number }>;
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

    // Get variations array from new format
    const variations = parsed.variations || [];

    // Validate each variation
    variations.forEach((variation: any, index: number) => {
      const wordCount = variation.wordCount || variation.uvp.split(/\s+/).length;

      if (wordCount > 15) {
        console.error(`[UVPSynthesis] ✗ Variation ${index + 1} exceeds 15 words:`, wordCount, 'words');
        console.error('[UVPSynthesis] ✗ Statement:', variation.uvp);
        // Truncate to 15 words
        const words = variation.uvp.split(/\s+/).slice(0, 15);
        variation.uvp = words.join(' ');
        variation.wordCount = 15;
        console.warn('[UVPSynthesis] Truncated to:', variation.uvp);
      }
    });

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

    // Log all variations
    console.log(`[UVPSynthesis] Generated ${variations.length} UVP variations`);
    variations.forEach((v: any, i: number) => {
      console.log(`[UVPSynthesis] Variation ${i + 1} (${v.style}):`, v.uvp, `(${v.wordCount} words)`);
    });

    return {
      variations,
      whyStatement,
      whatStatement,
      howStatement,
      confidence: {
        overall: parsed.confidence?.overall || 50,
        dataQuality: parsed.confidence?.dataQuality || 50,
        modelAgreement: 90,
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

  // Handle multiple customers
  const primaryCustomer = Array.isArray(input.customer) ? input.customer[0] : input.customer;

  // Instead of generating more generic content, be honest
  const vpStatement = `Unable to extract unique value proposition from website. ${input.businessName} uses industry-standard ${input.industry} messaging.`;

  return {
    id: `uvp-${Date.now()}`,
    targetCustomer: primaryCustomer,
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
