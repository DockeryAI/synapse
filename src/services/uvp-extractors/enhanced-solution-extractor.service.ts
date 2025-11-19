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

import { claudeAIService } from '@/services/ai/ClaudeAIService';
import { getIndustryEQ } from '@/services/uvp-wizard/emotional-quotient';
import type { UniqueSolution, Differentiator } from '@/types/uvp-flow.types';

interface SolutionExtractionResult {
  solutions: UniqueSolution[];
  differentiators: Differentiator[];
  methodology?: string;
  confidence: {
    overall: number;
    dataQuality: number;
    modelAgreement: number;
  };
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
    // Find methodology-specific content
    const methodologyContent = findMethodologyContent(websiteContent);
    console.log(`[EnhancedSolutionExtractor] Found ${methodologyContent.length} methodology sections`);

    // Get industry EQ for context
    const industryEQ = await getIndustryEQ(industry);

    // Prepare content for analysis
    const fullContent = websiteContent.join('\n\n').substring(0, 10000);
    const methodologyText = methodologyContent.join('\n\n');

    // Build extraction prompt - VERY CLEAR about HOW not WHO
    const prompt = `Analyze this ${industry} business website to extract their UNIQUE SOLUTION/APPROACH.

CRITICAL: Extract HOW they solve problems, NOT WHO they serve!
- WRONG: "We serve car collectors" (that's a customer)
- RIGHT: "We use a proprietary 3-step authentication process" (that's a solution)

BUSINESS: ${businessName}
INDUSTRY: ${industry}

LOOK FOR:
1. **Process/Methodology**: "Our 5-step process", "How we work", "Our approach"
2. **Proprietary Systems**: "Our unique method", "Proprietary technology", "Exclusive process"
3. **Differentiators**: "Unlike other ${industry} providers, we...", "Only ${industry} company that..."
4. **Approach/Philosophy**: "We believe in...", "Our method focuses on..."

METHODOLOGY CONTENT FOUND:
${methodologyText || 'No specific methodology content found'}

FULL WEBSITE:
${fullContent}

Extract 3-5 unique solutions that describe HOW they work. For each solution:

**Required Elements:**
1. Clear description of the METHOD/PROCESS/APPROACH
2. What makes it UNIQUE or DIFFERENT from alternatives
3. The MECHANISM of how it works
4. Why this approach is BETTER

Return JSON array:
[
  {
    "id": "unique-id",
    "statement": "Clear description of HOW they solve the problem differently",
    "methodology": "The process/method/system they use",
    "differentiators": [
      {
        "id": "diff-id",
        "statement": "Specific differentiator",
        "category": "process" | "technology" | "approach" | "expertise" | "speed" | "quality",
        "evidence": "Evidence from website",
        "strengthScore": 0-100
      }
    ],
    "competitiveAdvantage": "Why this is better than alternatives",
    "evidenceQuotes": ["supporting quotes"],
    "confidence": {
      "overall": 0-100,
      "dataQuality": 0-100,
      "modelAgreement": 0-100
    }
  }
]

ONLY include SOLUTIONS (how they work), NOT customer segments!`;

    const response = await claudeAIService.generateContent(prompt);
    const solutions = parseSolutions(response);

    // Extract all differentiators
    const allDifferentiators = solutions.flatMap(s => s.differentiators || []);

    const confidence = {
      overall: calculateConfidence(solutions, methodologyContent),
      dataQuality: methodologyContent.length > 0 ? 85 : 50,
      modelAgreement: 80,
    };

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
          sources: [{ type: 'website' as const, url: '' }],
        })),
        competitiveAdvantage: s.competitiveAdvantage || '',
        evidenceQuotes: s.evidenceQuotes || [],
        sources: [{ type: 'website' as const, url: '' }],
        confidence: s.confidence || {
          overall: 70,
          dataQuality: 70,
          modelAgreement: 70,
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
