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
    const prompt = `Create a complete Value Proposition for ${input.businessName} using the Golden Circle framework (Why/What/How).

BUSINESS: ${input.businessName}
INDUSTRY: ${input.industry}

**INPUT COMPONENTS:**

TARGET CUSTOMER:
${input.customer.statement}

TRANSFORMATION GOAL (What they're trying to achieve):
${input.transformation.statement}

UNIQUE SOLUTION (How we solve it):
${input.solution.statement}

KEY BENEFIT (Outcome they get):
${input.benefit.statement}

**INDUSTRY CONTEXT:**
- EQ: ${industryEQ.emotional_weight}% emotional, ${100 - industryEQ.emotional_weight}% rational
- JTBD Focus: ${industryEQ.jtbd_focus}
- Purchase Mindset: ${industryEQ.purchase_mindset}

**GENERATE:**

1. **Complete Value Proposition Statement** (2-3 sentences):
   - Combine all components into cohesive statement
   - Lead with customer/problem, not solution
   - Make it compelling and specific
   - Format: For [WHO] who [PROBLEM], we [SOLUTION] so you can [BENEFIT]

2. **Why Statement** (Purpose & Belief):
   - Why does this business exist?
   - What do they believe?
   - Draw from transformation goal
   - 1-2 sentences

3. **What Statement** (Tangible Offering):
   - What do they actually provide?
   - Draw from unique solution
   - 1-2 sentences

4. **How Statement** (Unique Approach):
   - How do they deliver differently?
   - Draw from methodology/differentiators
   - 1-2 sentences

Return JSON:
{
  "valuePropositionStatement": "Complete 2-3 sentence UVP",
  "whyStatement": "Purpose and belief",
  "whatStatement": "Tangible offering",
  "howStatement": "Unique approach",
  "confidence": {
    "overall": 0-100,
    "dataQuality": 0-100,
    "modelAgreement": 0-100
  }
}

Make it powerful, specific, and customer-focused.`;

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
      overallConfidence: synthesis.confidence,
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
 * Parse AI response
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

    return {
      valuePropositionStatement: parsed.valuePropositionStatement || '',
      whyStatement: parsed.whyStatement || '',
      whatStatement: parsed.whatStatement || '',
      howStatement: parsed.howStatement || '',
      confidence: parsed.confidence || {
        overall: 70,
        dataQuality: 70,
        modelAgreement: 70,
      },
    };
  } catch (error) {
    console.error('[UVPSynthesis] Parse error:', error);
    throw error;
  }
}

/**
 * Generate fallback synthesis
 */
function generateFallbackSynthesis(input: UVPSynthesisInput): CompleteUVP {
  // Build basic synthesis from components
  const vpStatement = `For ${input.customer.statement.substring(0, 100)} who ${input.transformation.fromState}, ${input.businessName} ${input.solution.statement.substring(0, 150)} so you can ${input.benefit.statement.substring(0, 100)}.`;

  return {
    id: `uvp-${Date.now()}`,
    targetCustomer: input.customer,
    transformationGoal: input.transformation,
    uniqueSolution: input.solution,
    keyBenefit: input.benefit,
    valuePropositionStatement: vpStatement,
    whyStatement: `We believe ${input.transformation.toState.toLowerCase()} for our customers.`,
    whatStatement: `We provide ${input.solution.methodology || 'comprehensive solutions'}.`,
    howStatement: `Through our ${input.solution.methodology || 'unique approach'}.`,
    overallConfidence: {
      overall: 60,
      dataQuality: 50,
      modelAgreement: 70,
      sourceCount: 4,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
