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

import { supabase } from '@/utils/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Banned clichés that indicate lazy, generic messaging
const BANNED_CLICHES = [
  'sleep soundly',
  'sleep better',
  'peace of mind',
  'rest easy',
  'worry-free',
  'stress-free',
  'comprehensive solutions',
  'cutting-edge',
  'best-in-class',
  'world-class',
  'industry-leading',
  'one-stop shop',
  'trusted partner',
  'seamless experience',
  'unlock potential',
  'drive growth',
  'maximize value',
  'optimize performance',
  'leverage expertise',
  'transform your business'
];

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
   * Get industry profile for context
   */
  private async getIndustryProfile(industry?: string) {
    if (!industry) return null;

    try {
      // Try to get NAICS code from industry name - try multiple strategies

      // Strategy 1: Find NAICS code by title
      let { data: naicsData, error } = await supabase
        .from('naics_codes')
        .select('code')
        .filter('title', 'ilike', `%${industry}%`)
        .limit(1)
        .maybeSingle();

      if (naicsData?.code) {
        // Now look up the profile using the NAICS code
        const { data: profileData } = await supabase
          .from('industry_profiles')
          .select('profile_data')
          .eq('naics_code', naicsData.code)
          .maybeSingle();

        if (profileData?.profile_data) {
          console.log('[JTBD] Found industry profile for:', industry);
          return profileData.profile_data;
        }
      }
    } catch (error) {
      // Silently handle missing profile - this is expected for many industries
      // console.log('[JTBD] No industry profile found for:', industry);
    }

    return null;
  }

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
      testimonials?: string[];
      naicsCode?: string;
    }
  ): Promise<TransformedValueProps> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('[JTBD Transformer] No Supabase configuration - returning basic transformation');
      return this.basicTransformation(featureProps, businessContext);
    }

    try {
      console.log('[JTBD Transformer] Transforming', featureProps.length, 'value props for', businessContext.businessName);

      // Get industry profile for context
      const industryProfile = await this.getIndustryProfile(businessContext.industry || businessContext.naicsCode);

      // Extract testimonial outcomes if available
      const testimonialOutcomes = businessContext.testimonials?.map(t =>
        `"${t}"`
      ).join('\n') || '';

      const prompt = `You are a strategic messaging consultant specializing in Jobs-to-be-Done, Golden Circle, and Value Proposition Canvas frameworks.

BUSINESS CONTEXT:
Name: ${businessContext.businessName}
${businessContext.industry ? `Industry: ${businessContext.industry}` : ''}
${businessContext.targetAudience?.length ? `Target Audience: ${businessContext.targetAudience.join(', ')}` : ''}
${businessContext.customerProblems?.length ? `Known Customer Problems: ${businessContext.customerProblems.join('; ')}` : ''}
${businessContext.solutions?.length ? `Their Solutions: ${businessContext.solutions.join('; ')}` : ''}
${businessContext.differentiators?.length ? `Differentiators: ${businessContext.differentiators.join('; ')}` : ''}

${industryProfile ? `
INDUSTRY-SPECIFIC INSIGHTS:
${industryProfile.customer_triggers ? `Customer Triggers: ${industryProfile.customer_triggers.join('; ')}` : ''}
${industryProfile.transformations ? `Customer Transformations: ${industryProfile.transformations.join('; ')}` : ''}
${industryProfile.pain_points ? `Pain Points: ${industryProfile.pain_points.map(p => p.pain).join('; ')}` : ''}
${industryProfile.unique_mechanisms ? `Unique Solutions: ${industryProfile.unique_mechanisms.join('; ')}` : ''}
${industryProfile.customer_language_dictionary ? `Customer Language: ${Array.isArray(industryProfile.customer_language_dictionary) ? industryProfile.customer_language_dictionary.slice(0, 10).join(', ') : JSON.stringify(industryProfile.customer_language_dictionary).slice(0, 200)}` : ''}
` : ''}

${testimonialOutcomes ? `
CUSTOMER TESTIMONIALS (actual voice of customer):
${testimonialOutcomes}
` : ''}

CURRENT VALUE PROPOSITIONS (feature-focused):
${featureProps.map((prop, i) => `${i + 1}. "${prop}"`).join('\n')}

YOUR TASK:
Transform these feature-focused statements into outcome-focused value propositions using these frameworks:

FRAMEWORK 1: Jobs-to-be-Done (JTBD)
Ask: "What PROGRESS is the customer trying to make in their life?"
- Functional Job: What are they trying to GET DONE? (Not the service, but the outcome)
- Emotional Job: What FEELING are they trying to achieve? (confident, in control, protected, understood)
- Social Job: How do they want to BE SEEN by others? (prepared, smart, caring, professional)
- Customer Progress: FROM struggling with [current state] TO achieving [desired state]

FRAMEWORK 2: Golden Circle (Why → How → What)
- WHY: What's the deeper purpose/belief? Why does this business exist?
- HOW: What's their unique approach that makes them different?
- WHAT: What do they actually offer? (keep this part, but lead with WHY)

FRAMEWORK 3: Value Proposition Canvas
- Pain Relievers: What ANXIETY or FRUSTRATION goes away? (Not "saves time" but "stops the 2am worry")
- Gain Creators: What NEW CAPABILITY do they gain? (Not "better results" but "confidence to expand")
- Customer Jobs: What are they REALLY trying to achieve? (Not "buy insurance" but "protect what I've built")

TRANSFORMATION RULES:
1. FOCUS ON CUSTOMER TRANSFORMATION, NOT METRICS
   ❌ Bad: "Save 3 hours per week"
   ❌ Bad: "Reduce costs by 40%"
   ✅ Good: "Stop being the insurance company's problem and start being their priority"
   ✅ Good: "Know you're actually covered for what matters to your business"

2. IDENTIFY THE REAL JOB THEY'RE HIRING YOU FOR
   - Insurance: Not "save money" but "stop worrying about gaps in coverage"
   - Marketing: Not "more engagement" but "create content that feels authentic to your voice"
   - IT: Not "faster response" but "technology that just works so you can focus on growth"

3. USE PROGRESS-FOCUSED LANGUAGE
   ❌ Bad: "Get results faster"
   ✅ Good: "Move from constantly putting out fires to actually building your business"
   ✅ Good: "Go from feeling overwhelmed by insurance to confident you're protected"

4. CAPTURE THE BEFORE → AFTER TRANSFORMATION
   - FROM: Frustrated state (checking coverage gaps at 2am)
   - TO: Desired state (confident your business is protected)
   - Example: "From second-guessing coverage to knowing you're protected"

5. AVOID QUANTIFICATION UNLESS IT'S THE CORE VALUE
   - Only use numbers if they appear in source data AND are central to the value
   - Default to emotional/functional progress over metrics
   - "Finally understand what you're actually covered for" > "Save 20% on premiums"

6. THE OUTCOME MUST BE WHAT CUSTOMERS ACTUALLY WANT
   - They don't want "comprehensive insurance"
   - They want "to stop worrying about what happens if something goes wrong"
   - They don't want "AI-powered content"
   - They want "to stop staring at blank screens wondering what to post"

CRITICAL: AVOID THESE BANNED CLICHÉS AT ALL COSTS:
${BANNED_CLICHES.map(cliche => `- "${cliche}"`).join('\n')}

If you use ANY of these clichés, the transformation FAILS. Focus on the REAL transformation:
- Instead of "sleep soundly" → "Stop wondering if your collection is covered and know it's protected at true collector value"
- Instead of "peace of mind" → "From panicking about claims to knowing exactly how you're covered"
- Instead of "comprehensive solutions" → "Finally, insurance that understands what collectors actually need to protect"

USE INDUSTRY-SPECIFIC LANGUAGE:
${industryProfile?.customer_language_dictionary ?
  `The customer actually says: "${Array.isArray(industryProfile.customer_language_dictionary) ? industryProfile.customer_language_dictionary.slice(0, 5).join('", "') : 'See testimonials above'}"` :
  'Extract specific language from testimonials above'}

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

      // No timeout - let synthesis complete naturally for complete data
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: 'openrouter',
          model: 'anthropic/claude-sonnet-4.5', // Switched from Opus 4.1 for faster transformations
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
        console.error('[JTBD Transformer] API error details:', {
          status: response.status,
          statusText: response.statusText,
          errorMessage: errorText,
          businessName: businessContext.businessName,
          propsCount: featureProps.length,
          industry: businessContext.industry,
          timestamp: new Date().toISOString()
        });
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const transformationText = data.choices[0].message.content;

      console.log('[JTBD Transformer] Raw transformation:', transformationText.substring(0, 200) + '...');

      // Clean the response - remove markdown code blocks if present
      let cleanedText = transformationText;
      if (transformationText.includes('```json')) {
        cleanedText = transformationText
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .trim();
      } else if (transformationText.includes('```')) {
        cleanedText = transformationText
          .replace(/```\s*/g, '')
          .trim();
      }

      // Parse JSON response
      const transformed = JSON.parse(cleanedText);

      console.log('[JTBD Transformer] Transformation complete:');
      console.log('  - Primary outcome:', transformed.primary?.outcomeStatement?.substring(0, 80) + '...');
      console.log('  - Supporting props:', transformed.supporting?.length || 0);
      console.log('  - Transformation quality:', transformed.transformationQuality?.score || 0);

      return transformed as TransformedValueProps;

    } catch (error) {
      const errorDetails = {
        message: error instanceof Error ? error.message : String(error),
        businessName: businessContext.businessName,
        industry: businessContext.industry,
        propsCount: featureProps.length,
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined
      };

      if (error instanceof SyntaxError) {
        console.error('[JTBD Transformer] JSON parsing failed:', errorDetails);
      } else if (error instanceof Error && error.message.includes('aborted')) {
        console.error('[JTBD Transformer] Request aborted:', errorDetails);
      } else {
        console.error('[JTBD Transformer] Transformation failed:', errorDetails);
      }

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
