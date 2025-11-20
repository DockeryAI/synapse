/**
 * Jobs-to-be-Done (JTBD) Value Proposition Transformer
 *
 * Transforms feature-focused value props into outcome-focused messaging
 * using JTBD, Golden Circle, and Value Proposition Canvas frameworks.
 *
 * Framework Integration:
 * - JTBD: What progress is the customer trying to make?
 * - Golden Circle: Start with WHY (purpose), then HOW (approach), then WHAT (features)
 * - Value Prop Canvas: Pain relievers + Gain creators = Customer outcomes
 *
 * Created: November 20, 2025
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface OutcomeFocusedValueProp {
  // Original feature-focused statement
  originalStatement: string;

  // Transformed outcome-focused statement
  outcomeStatement: string;

  // JTBD components
  jtbd: {
    functionalJob: string;      // What task are they trying to complete?
    emotionalJob: string;        // How do they want to feel?
    socialJob: string;           // How do they want to be perceived?
    customerProgress: string;    // What progress are they making?
  };

  // Golden Circle components
  goldenCircle: {
    why: string;                 // Purpose/belief
    how: string;                 // Unique approach
    what: string;                // Actual offering
  };

  // Value delivered
  value: {
    painReliever: string;        // What frustration does this eliminate?
    gainCreator: string;         // What positive outcome does this enable?
    timeSaved?: string;          // Time/efficiency benefit
    costSaved?: string;          // Financial benefit
    confidenceGained?: string;   // Emotional benefit
  };

  // Confidence in transformation
  transformationConfidence: number;

  // Alternative formulations
  alternatives: string[];
}

export interface TransformedValueProps {
  // Primary value prop (hero message)
  primary: OutcomeFocusedValueProp;

  // Supporting value props
  supporting: OutcomeFocusedValueProp[];

  // Overall transformation quality
  transformationQuality: {
    score: number;
    outcomeClarity: number;
    emotionalResonance: number;
    differentiation: number;
    reasoning: string;
  };
}

class JTBDTransformerService {
  /**
   * Transform feature-focused value props into outcome-focused messaging
   */
  async transformValuePropositions(
    featureProps: string[],
    businessContext: {
      businessName: string;
      industry?: string;
      targetAudience?: string[];
      customerProblems?: string[];
      solutions?: string[];
      differentiators?: string[];
    }
  ): Promise<TransformedValueProps> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('[JTBD Transformer] No Supabase configuration - returning basic transformation');
      return this.basicTransformation(featureProps, businessContext);
    }

    try {
      console.log('[JTBD Transformer] Transforming', featureProps.length, 'value props for', businessContext.businessName);

      const prompt = `You are a strategic messaging consultant specializing in Jobs-to-be-Done, Golden Circle, and Value Proposition Canvas frameworks.

BUSINESS CONTEXT:
Name: ${businessContext.businessName}
${businessContext.industry ? `Industry: ${businessContext.industry}` : ''}
${businessContext.targetAudience?.length ? `Target Audience: ${businessContext.targetAudience.join(', ')}` : ''}
${businessContext.customerProblems?.length ? `Known Customer Problems: ${businessContext.customerProblems.join('; ')}` : ''}
${businessContext.solutions?.length ? `Their Solutions: ${businessContext.solutions.join('; ')}` : ''}
${businessContext.differentiators?.length ? `Differentiators: ${businessContext.differentiators.join('; ')}` : ''}

CURRENT VALUE PROPOSITIONS (feature-focused):
${featureProps.map((prop, i) => `${i + 1}. "${prop}"`).join('\n')}

YOUR TASK:
Transform these feature-focused statements into outcome-focused value propositions using these frameworks:

FRAMEWORK 1: Jobs-to-be-Done (JTBD)
Ask: "When customers hire this business, what JOB are they trying to get done?"
- Functional Job: What task/problem needs solving?
- Emotional Job: How do they want to FEEL? (confident, secure, successful, relieved, proud)
- Social Job: How do they want to be PERCEIVED? (professional, savvy, responsible, innovative)
- Customer Progress: What progress are they making in their life/business?

FRAMEWORK 2: Golden Circle (Why → How → What)
- WHY: What's the deeper purpose/belief? Why does this business exist?
- HOW: What's their unique approach that makes them different?
- WHAT: What do they actually offer? (keep this part, but lead with WHY)

FRAMEWORK 3: Value Proposition Canvas
- Pain Relievers: What specific frustrations does this ELIMINATE?
- Gain Creators: What positive outcomes does this ENABLE?
- Customer Jobs: What are customers trying to accomplish?

TRANSFORMATION RULES:
1. START WITH OUTCOMES, not features
   ❌ Bad: "AI-powered campaign generation"
   ✅ Good: "Turn 10 minutes into 2 weeks of posts that actually get customers"

2. USE EMOTIONAL LANGUAGE for high-touch services, RATIONAL for technical/B2B
   - Emotional: "Never stare at a blank screen again" (confidence gained)
   - Rational: "3x more engagement in half the time" (measurable results)

3. MAKE IT SPECIFIC AND TANGIBLE
   ❌ Bad: "Better marketing results"
   ✅ Good: "Go from 2% to 6% engagement rate in 30 days"

4. PASS THE "SO WHAT?" TEST
   Customer should think: "That solves MY problem" (not "that's nice technology")

5. FOCUS ON PROGRESS, NOT FEATURES
   ❌ Bad: "We use psychological triggers"
   ✅ Good: "Posts that make people stop scrolling and start buying"

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown):
{
  "primary": {
    "originalStatement": "original prop",
    "outcomeStatement": "transformed outcome-focused statement",
    "jtbd": {
      "functionalJob": "the task they're trying to complete",
      "emotionalJob": "how they want to feel",
      "socialJob": "how they want to be perceived",
      "customerProgress": "what progress they're making"
    },
    "goldenCircle": {
      "why": "deeper purpose/belief",
      "how": "unique approach",
      "what": "actual offering"
    },
    "value": {
      "painReliever": "frustration eliminated",
      "gainCreator": "positive outcome enabled",
      "timeSaved": "time/efficiency benefit (if applicable)",
      "costSaved": "financial benefit (if applicable)",
      "confidenceGained": "emotional benefit (if applicable)"
    },
    "transformationConfidence": 85,
    "alternatives": [
      "alternative formulation 1",
      "alternative formulation 2",
      "alternative formulation 3"
    ]
  },
  "supporting": [
    {
      "originalStatement": "...",
      "outcomeStatement": "...",
      "jtbd": {...},
      "goldenCircle": {...},
      "value": {...},
      "transformationConfidence": 80,
      "alternatives": [...]
    }
  ],
  "transformationQuality": {
    "score": 88,
    "outcomeClarity": 90,
    "emotionalResonance": 85,
    "differentiation": 88,
    "reasoning": "Why this transformation quality score"
  }
}

PRIORITIZATION:
- Select the STRONGEST value prop as primary (highest customer impact)
- Include 2-3 supporting props that reinforce the primary
- Ensure props work together to tell a coherent story`;

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
          max_tokens: 6000,
          temperature: 0.4
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[JTBD Transformer] API error:', response.status, errorText);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const transformationText = data.choices[0].message.content;

      console.log('[JTBD Transformer] Raw transformation:', transformationText.substring(0, 200) + '...');

      // Parse JSON response
      const transformed = JSON.parse(transformationText);

      console.log('[JTBD Transformer] Transformation complete:');
      console.log('  - Primary outcome:', transformed.primary?.outcomeStatement?.substring(0, 80) + '...');
      console.log('  - Supporting props:', transformed.supporting?.length || 0);
      console.log('  - Transformation quality:', transformed.transformationQuality?.score || 0);

      return transformed as TransformedValueProps;

    } catch (error) {
      console.error('[JTBD Transformer] Transformation failed:', error);
      return this.basicTransformation(featureProps, businessContext);
    }
  }

  /**
   * Basic transformation fallback (no AI)
   */
  private basicTransformation(
    featureProps: string[],
    businessContext: any
  ): TransformedValueProps {
    // Simple rule-based transformation
    const primary: OutcomeFocusedValueProp = {
      originalStatement: featureProps[0] || 'Value proposition',
      outcomeStatement: this.applyBasicRules(featureProps[0] || '', businessContext),
      jtbd: {
        functionalJob: 'Solve business problem',
        emotionalJob: 'Feel confident',
        socialJob: 'Be perceived as professional',
        customerProgress: 'Make progress toward goals'
      },
      goldenCircle: {
        why: 'Help businesses succeed',
        how: 'Through specialized solutions',
        what: featureProps[0] || 'Services'
      },
      value: {
        painReliever: 'Eliminate frustration',
        gainCreator: 'Enable success',
        confidenceGained: 'Feel more confident'
      },
      transformationConfidence: 50,
      alternatives: []
    };

    const supporting: OutcomeFocusedValueProp[] = featureProps.slice(1, 4).map(prop => ({
      originalStatement: prop,
      outcomeStatement: this.applyBasicRules(prop, businessContext),
      jtbd: {
        functionalJob: 'Complete task',
        emotionalJob: 'Feel relieved',
        socialJob: 'Be seen as capable',
        customerProgress: 'Move forward'
      },
      goldenCircle: {
        why: 'Support customers',
        how: 'With expertise',
        what: prop
      },
      value: {
        painReliever: 'Remove obstacle',
        gainCreator: 'Create opportunity'
      },
      transformationConfidence: 50,
      alternatives: []
    }));

    return {
      primary,
      supporting,
      transformationQuality: {
        score: 50,
        outcomeClarity: 50,
        emotionalResonance: 50,
        differentiation: 50,
        reasoning: 'Basic transformation (AI unavailable)'
      }
    };
  }

  /**
   * Apply basic transformation rules without AI
   */
  private applyBasicRules(featureProp: string, context: any): string {
    // Simple heuristics for outcome-focused language
    const prop = featureProp.toLowerCase();

    // Time-saving patterns
    if (prop.includes('fast') || prop.includes('quick') || prop.includes('efficient')) {
      return `Save time and get results faster with ${context.businessName}`;
    }

    // Quality patterns
    if (prop.includes('quality') || prop.includes('premium') || prop.includes('expert')) {
      return `Get professional-grade results without the premium price`;
    }

    // Automation patterns
    if (prop.includes('automat') || prop.includes('ai') || prop.includes('smart')) {
      return `Stop doing it manually - get it done automatically`;
    }

    // Default outcome
    return `Achieve better results with ${context.businessName}`;
  }

  /**
   * Get just the primary outcome statement (convenience method)
   */
  async getPrimaryOutcome(
    featureProps: string[],
    businessContext: any
  ): Promise<string> {
    const transformed = await this.transformValuePropositions(featureProps, businessContext);
    return transformed.primary.outcomeStatement;
  }

  /**
   * Get all outcome statements (convenience method)
   */
  async getAllOutcomes(
    featureProps: string[],
    businessContext: any
  ): Promise<string[]> {
    const transformed = await this.transformValuePropositions(featureProps, businessContext);
    return [
      transformed.primary.outcomeStatement,
      ...transformed.supporting.map(s => s.outcomeStatement)
    ];
  }
}

export const jtbdTransformer = new JTBDTransformerService();
export { JTBDTransformerService };
