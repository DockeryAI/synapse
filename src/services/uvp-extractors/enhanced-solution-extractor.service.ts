/**
 * Enhanced Solution Extractor - FIXED
 *
 * CRITICAL FIX: This extracts HOW they solve problems (methodology/process/approach)
 * NOT WHO they serve (that's the customer extractor)
 *
 * Extracts from:
 * - "How We Work" / "Our Process" pages
 * - "What Makes Us Different" content
 * - Methodology descriptions
 * - Proprietary approaches
 * - Competitive differentiation vs alternatives
 */

import { getIndustryEQ } from '@/services/uvp-wizard/emotional-quotient';
import type { UniqueSolution, Differentiator } from '@/types/uvp-flow.types';
import { jtbdTransformer } from '@/services/intelligence/jtbd-transformer.service';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface SolutionExtractionResult {
  solutions: UniqueSolution[];
  differentiators: Differentiator[];
  methodology?: string;
  confidence: {
    overall: number;
    dataQuality: number;
    modelAgreement: number;
    sourceCount?: number;
  };
}

/**
 * Extract contrarian statements directly from content (MARBA-style quote mining)
 */
function extractContrarianStatements(websiteContent: string[]): string[] {
  const contrarian: string[] = [];

  websiteContent.forEach(content => {
    // Look for contrarian language patterns
    const contrarianPatterns = [
      /Unlike\s+(?:most|traditional|other)\s+([^.!?]{15,200})[.!?]/gi,
      /Instead\s+of\s+([^,]{10,150}),\s+we\s+([^.!?]{10,150})[.!?]/gi,
      /We\s+refuse\s+to\s+([^.!?]{15,150})[.!?]/gi,
      /(?:We|Our)\s+believe\s+([^.!?]{15,200})[.!?]/gi,
      /The\s+problem\s+with\s+(?:traditional|most)\s+([^.!?]{15,150})[.!?]/gi,
      /What\s+makes\s+us\s+different\s+(?:is|:)\s+([^.!?]{15,200})[.!?]/gi,
    ];

    contrarianPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const statement = match[0].trim();
        if (statement.length >= 30 && statement.length < 300) {
          contrarian.push(statement);
        }
      }
    });
  });

  return contrarian.slice(0, 10); // Top 10 contrarian statements
}

/**
 * Find process/methodology content in website
 */
function findMethodologyContent(websiteContent: string[]): string[] {
  const methodologyContent: string[] = [];

  websiteContent.forEach(content => {
    const lowerContent = content.toLowerCase();

    // Look for process/methodology sections
    const methodologyKeywords = [
      'how we work',
      'our process',
      'our approach',
      'methodology',
      'our method',
      'step-by-step',
      'what makes us different',
      'unlike others',
      'proprietary',
      'unique approach',
    ];

    const hasMethodology = methodologyKeywords.some(keyword =>
      lowerContent.includes(keyword)
    );

    if (hasMethodology) {
      // Extract relevant sections
      const sections = content.split(/\n\n+/);
      sections.forEach(section => {
        if (section.length > 50 && section.length < 1000) {
          const sectionLower = section.toLowerCase();
          if (methodologyKeywords.some(kw => sectionLower.includes(kw))) {
            methodologyContent.push(section);
          }
        }
      });
    }
  });

  return methodologyContent;
}

/**
 * Extract unique solutions with focus on HOW, not WHO
 */
export async function extractEnhancedSolutions(
  websiteContent: string[],
  businessName: string,
  industry: string
): Promise<SolutionExtractionResult> {
  console.log('[EnhancedSolutionExtractor] Starting extraction...');
  console.log(`  - Industry: ${industry}`);
  console.log(`  - Focus: HOW they solve, not WHO they serve`);

  try {
    // MARBA-style: Extract contrarian statements FIRST using regex
    const contrarianStatements = extractContrarianStatements(websiteContent);
    console.log(`[EnhancedSolutionExtractor] Found ${contrarianStatements.length} contrarian statements via regex`);

    // Find methodology-specific content
    const methodologyContent = findMethodologyContent(websiteContent);
    console.log(`[EnhancedSolutionExtractor] Found ${methodologyContent.length} methodology sections`);

    // Get industry EQ for context
    const industryEQ = await getIndustryEQ(industry);

    // Prepare content for analysis
    const fullContent = websiteContent.join('\n\n').substring(0, 10000);
    const methodologyText = methodologyContent.join('\n\n');
    const contrarianText = contrarianStatements.length > 0
      ? contrarianStatements.map((s, i) => `${i + 1}. "${s}"`).join('\n')
      : 'No contrarian statements found via regex mining';

    // Build extraction prompt - Focus on contrarian beliefs
    const prompt = `Find what makes ${businessName} CONTRARIAN in the ${industry} industry - what do they refuse to do that everyone else does?

BUSINESS: ${businessName}
INDUSTRY: ${industry}

**CONTRARIAN STATEMENTS FOUND (via quote mining):**
${contrarianText}

WEBSITE CONTENT:
${fullContent}

METHODOLOGY CONTENT:
${methodologyText || 'No methodology section found'}

**FIND THE CONTRARIAN BELIEF:**

Not "We believe clients deserve great service" (everyone says this)
But "We believe the first generation to create wealth shouldn't die at their desk" (contrarian belief)

**LOOK FOR (in priority order):**

1. **WHAT PISSES THEM OFF about their industry:**
   - "Unlike most [industry], we..."
   - "We refuse to..."
   - "The problem with traditional [industry] is..."
   - "Other [industry] do X, but we believe..."

2. **THEIR FOUNDING STORY/PHILOSOPHY:**
   - Why did they start this business?
   - What problem with the industry made them angry?
   - What do they believe customers deserve that they aren't getting?

3. **THEIR DIFFERENT APPROACH:**
   - "Instead of [industry standard], we..."
   - "We start with [X], not [Y like everyone else]"
   - Specific methodology with evidence (NOT invented)

**MINE FOR EVIDENCE:**
- Look for "We believe..." statements
- Look for "Unlike..." comparisons
- Look for founder story explaining their WHY
- Look for process names that are ACTUALLY STATED (not invented)

**CONTRARIAN EXAMPLES:**

GOOD:
- "We believe wealth advisors should eat last - your returns before our fees"
- "Unlike investment-first advisors, we calculate backward from your perfect day at 70"
- "We refuse to take commissions on products we recommend"

BAD (Generic):
- "We put clients first" (everyone says this)
- "Our unique approach" (meaningless)
- "Comprehensive methodology" (banned corporate speak)

Return JSON array with 1-2 solutions (quality over quantity):
[
  {
    "id": "unique-id",
    "statement": "CONTRARIAN belief or philosophy (use exact quote if possible)",
    "methodology": "ONLY if they actually name their process/methodology with evidence",
    "differentiators": [
      {
        "id": "diff-id",
        "statement": "What they do INSTEAD of industry standard",
        "category": "contrarian" | "philosophy" | "approach",
        "evidence": "EXACT quote from website",
        "strengthScore": 90 if contrarian, 40 if generic
      }
    ],
    "competitiveAdvantage": "Why this contrarian belief matters to customers",
    "evidenceQuotes": ["EXACT quotes from website"],
    "confidence": {
      "overall": 90 if contrarian with evidence, 70 if specific approach, 50 if somewhat generic,
      "dataQuality": 90 if quoted, 70 if paraphrased, 50 if inferred,
      "modelAgreement": 80-100
    }
  }
]

**COMPETITOR TEST:**
Could any competitor use this exact same statement?
- If YES → Too generic, find the contrarian angle
- If NO → Good, it's unique

**If no strong contrarian beliefs found:**
1. Look for their SPECIFIC PROCESS or METHODOLOGY (even if not contrarian)
2. Look for their FOUNDING STORY or BACKGROUND that shapes their approach
3. Look for WHAT THEY EMPHASIZE that others don't
4. Set confidence to 60-70 (not 90) if it's approach-based rather than contrarian

**DO NOT return empty array unless website has literally NO information about how they work.**

CRITICAL: NEVER create fake proprietary names, trademarks, or methodology names!`;

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

    const solutions = parseSolutions(analysisText);

    // Extract all differentiators
    const allDifferentiators = solutions.flatMap(s => s.differentiators || []);

    const confidence = {
      overall: calculateConfidence(solutions, methodologyContent),
      dataQuality: methodologyContent.length > 0 ? 85 : 50,
      modelAgreement: 80,
    };

    // Apply JTBD transformation to solution statements
    if (solutions.length > 0) {
      console.log('[EnhancedSolutionExtractor] Applying JTBD transformation to solutions...');
      try {
        const solutionStatements = solutions.map(s => s.statement);
        const transformedProps = await jtbdTransformer.transformValuePropositions(
          solutionStatements,
          {
            businessName,
            industry,
            differentiators: solutions.map(s => s.statement),
            solutions: solutions.map(s => s.methodology || s.statement)
          }
        );

        // Apply primary outcome to first solution
        if (transformedProps.primary && solutions[0]) {
          solutions[0].outcomeStatement = transformedProps.primary.outcomeStatement;
          console.log('[EnhancedSolutionExtractor] Applied JTBD outcome to primary solution:', transformedProps.primary.outcomeStatement);
        }

        // Apply supporting outcomes to other solutions
        transformedProps.supporting.forEach((support, index) => {
          if (solutions[index + 1]) {
            solutions[index + 1].outcomeStatement = support.outcomeStatement;
            console.log('[EnhancedSolutionExtractor] Applied JTBD outcome to solution', index + 1, ':', support.outcomeStatement);
          }
        });
      } catch (jtbdError) {
        console.error('[EnhancedSolutionExtractor] JTBD transformation failed:', jtbdError);
        // Continue without outcome statements
      }
    }

    return {
      solutions,
      differentiators: allDifferentiators,
      methodology: methodologyContent[0],
      confidence,
    };

  } catch (error) {
    console.error('[EnhancedSolutionExtractor] Extraction failed:', error);

    // Return empty - NO FAKE DATA
    return {
      solutions: [],
      differentiators: [],
      confidence: {
        overall: 0,
        dataQuality: 0,
        modelAgreement: 0,
      },
    };
  }
}

/**
 * Parse AI response into solutions
 */
function parseSolutions(response: string): UniqueSolution[] {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return parsed.map((s: any) => {
      // Validate this is actually a SOLUTION not a CUSTOMER
      const statement = s.statement || '';
      const lowerStatement = statement.toLowerCase();

      // Red flags that indicate this is a customer, not a solution
      const customerRedFlags = [
        'collector', 'investor', 'owner', 'business', 'individual',
        'age', 'income', 'demographics', 'buyer', 'customer type',
      ];

      const isCustomer = customerRedFlags.some(flag => lowerStatement.includes(flag));

      if (isCustomer) {
        console.warn('[EnhancedSolutionExtractor] Filtered out customer statement:', statement);
        return null;
      }

      return {
        id: s.id || `solution-${Date.now()}-${Math.random()}`,
        statement: statement,
        methodology: s.methodology || '',
        differentiators: (s.differentiators || []).map((d: any) => ({
          id: d.id || `diff-${Date.now()}-${Math.random()}`,
          statement: d.statement || '',
          category: d.category || 'approach',
          evidence: d.evidence || '',
          strengthScore: d.strengthScore || 70,
          sources: [{
            id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'website',
            name: 'Website Content',
            url: '',
            extractedAt: new Date(),
            reliability: 85,
            dataPoints: 1
          }],
        })),
        competitiveAdvantage: s.competitiveAdvantage || '',
        evidenceQuotes: s.evidenceQuotes || [],
        sources: [{
          id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'website',
          name: 'Website Content',
          url: '',
          extractedAt: new Date(),
          reliability: 85,
          dataPoints: 1
        }],
        confidence: {
          ...s.confidence || {
            overall: 70,
            dataQuality: 70,
            modelAgreement: 70,
          },
          sourceCount: s.confidence?.sourceCount ?? 1,
        },
      };
    }).filter(Boolean); // Remove nulls
  } catch (error) {
    console.error('[EnhancedSolutionExtractor] Parse error:', error);
    return [];
  }
}

/**
 * Calculate confidence based on methodology content quality
 */
function calculateConfidence(solutions: UniqueSolution[], methodologyContent: string[]): number {
  if (solutions.length === 0) return 0;

  const avgConfidence = solutions.reduce((sum, s) => sum + s.confidence.overall, 0) / solutions.length;
  const methodologyBonus = methodologyContent.length > 0 ? 15 : 0;
  const differentiatorBonus = solutions.some(s => s.differentiators && s.differentiators.length > 0) ? 10 : 0;

  return Math.min(100, avgConfidence + methodologyBonus + differentiatorBonus);
}
