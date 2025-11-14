/**
 * Breakthrough Prompt Library
 *
 * Specialized prompts for different thinking styles to generate
 * breakthrough insights. This is the SECRET SAUCE - prompt quality
 * determines insight quality.
 *
 * Created: 2025-11-10
 */

import {
  PromptTemplate,
  BreakthroughInsight,
  InsightType,
  ThinkingStyle
} from '../../../types/breakthrough.types';
import { DeepContext } from '../../../types/deepContext.types';
import { Connection } from '../../../types/connections.types';

export class BreakthroughPromptLibrary {
  /**
   * LATERAL THINKING: Find unexpected connections
   */
  getLateralThinkingPrompt(context: DeepContext, seeds?: Connection[]): string {
    const culturalMoments = context.realTimeCultural?.culturalMoments
      ?.slice(0, 5)
      .map(m => `- ${m.title}`)
      .join('\n') || 'None available';

    const seedConnections = seeds && seeds.length > 0
      ? `\n\nSTARTING SEEDS (use these as inspiration):\n${seeds.map(s => `- ${s.relationship.explanation}`).join('\n')}`
      : '';

    return `
You are a lateral thinking AI that finds genuinely unexpected connections that reveal deeper truths.

BUSINESS: ${context.business.name}
INDUSTRY: ${context.business.industry}

CURRENT CULTURAL MOMENTS:
${culturalMoments}

CUSTOMER PAIN POINTS:
${context.realTimeCultural?.painPoints?.slice(0, 5).map(p => `- ${p.painPoint}`).join('\n') || 'None'}

TRENDING TOPICS:
${context.realTimeCultural?.trendingTopics?.slice(0, 5).map(t => `- ${t.topic}`).join('\n') || 'None'}
${seedConnections}

YOUR TASK: Find 5 unexpected connections between this business and:
1. Current cultural moments (what's happening RIGHT NOW)
2. Other industries that solved similar problems differently
3. Psychological principles that explain customer behavior
4. Metaphors from nature, science, or everyday life

QUALITY CRITERIA:
✓ Genuinely unexpected (not obvious industry connection)
✓ Reveals a deeper truth about human behavior or the market
✓ Actionable today (can create content immediately)
✓ Passes the "why didn't anyone think of this?" test
✓ Natural connection (not forced or gimmicky)

OUTPUT FORMAT (valid JSON array):
[
  {
    "connection": "What is the unexpected link?",
    "whyProfound": "What deeper truth does this reveal?",
    "whyNow": "Why is this timely right now?",
    "contentAngle": "Specific content angle to pursue",
    "expectedReaction": "What reaction will this get from the audience?",
    "insight": "One sentence summary of the insight",
    "evidence": ["Evidence point 1", "Evidence point 2", "Evidence point 3"],
    "confidence": 0.85
  }
]

Remember: The best lateral thinking insights feel surprising yet obvious in hindsight.
`.trim();
  }

  /**
   * ANALYTICAL THINKING: Find counter-intuitive insights
   */
  getCounterIntuitivePrompt(context: DeepContext, seeds?: Connection[]): string {
    const conventionalWisdom = context.industry?.commonBeliefs?.join(', ') ||
      'Traditional industry practices';

    const competitorApproaches = context.competitiveIntel?.mistakes
      ?.slice(0, 3)
      .map(m => `- ${m.mistake}`)
      .join('\n') || 'Standard competitor approaches';

    const customerComplaints = context.realTimeCultural?.painPoints
      ?.slice(0, 5)
      .map(p => `- ${p.painPoint}`)
      .join('\n') || 'No complaints available';

    const seedInsights = seeds && seeds.length > 0
      ? `\n\nSEED CONNECTIONS:\n${seeds.map(s => `- ${s.breakthroughPotential.contentAngle}`).join('\n')}`
      : '';

    return `
You are an analytical AI that finds counter-intuitive truths by examining contradictions between what people say and what they do.

BUSINESS: ${context.business.name}
INDUSTRY: ${context.business.industry}

CONVENTIONAL WISDOM:
${conventionalWisdom}

COMPETITOR APPROACHES:
${competitorApproaches}

CUSTOMER COMPLAINTS:
${customerComplaints}

CUSTOMER BEHAVIOR DATA:
${JSON.stringify(context.customerPsychology || {}, null, 2)}
${seedInsights}

YOUR TASK: Generate 5 counter-intuitive insights that challenge industry conventional wisdom.

Focus on:
- What everyone believes but customer behavior contradicts
- Hidden opportunities in common complaints (the complaint itself is the opportunity)
- Contrarian strategies backed by psychology
- Obvious truths that everyone ignores because they seem "too simple"

QUALITY CRITERIA:
✓ Directly contradicts conventional wisdom
✓ Backed by evidence from customer behavior
✓ Explains why competitors miss this
✓ Has immediate strategic implications
✓ Creates a strong content hook

OUTPUT FORMAT (valid JSON array):
[
  {
    "counterIntuitiveTruth": "The surprising truth",
    "conventionalWisdom": "What everyone believes",
    "evidence": ["Behavior 1", "Behavior 2", "Behavior 3"],
    "whyCompetitorsMissThis": "Why others don't see this",
    "strategicImplication": "What this means for strategy",
    "contentHook": "Compelling content angle",
    "whyProfound": "Why this matters",
    "whyNow": "Why this is timely",
    "insight": "One sentence summary",
    "expectedReaction": "Expected audience response",
    "confidence": 0.8
  }
]

Remember: The best counter-intuitive insights make you think "Of course! How did I miss that?"
`.trim();
  }

  /**
   * PREDICTIVE THINKING: Spot emerging opportunities
   */
  getPredictivePrompt(context: DeepContext, seeds?: Connection[]): string {
    const risingSearches = context.realTimeCultural?.trendingTopics
      ?.filter(t => t.velocity === 'explosive' || t.velocity === 'rising')
      .slice(0, 5)
      .map(t => `- ${t.topic} (${t.velocity})`)
      .join('\n') || 'No rising searches';

    const emergingTrends = context.industry?.emergingTrends?.slice(0, 5).join('\n- ') || 'No trends';

    const seedPatterns = seeds && seeds.length > 0
      ? `\n\nPATTERNS FROM CONNECTIONS:\n${seeds.map(s => `- ${s.sources.primary.content} → ${s.sources.secondary.content}`).join('\n')}`
      : '';

    return `
You are a predictive AI that spots specific opportunities emerging in the next 2-4 weeks based on momentum signals.

BUSINESS: ${context.business.name}
INDUSTRY: ${context.business.industry}

RISING SEARCHES:
${risingSearches}

EMERGING TRENDS:
- ${emergingTrends}

ECONOMIC INDICATORS:
${JSON.stringify(context.industry?.economicFactors || {}, null, 2)}

SEASONAL FACTORS:
${JSON.stringify(context.industry?.seasonalTrends || [], null, 2)}
${seedPatterns}

YOUR TASK: Predict 5 specific opportunities emerging in 2-4 weeks.

Requirements:
- Based on current momentum (not speculation)
- Specific and actionable (not vague predictions)
- Timed for preparation (act now to capitalize)
- Backed by multiple signals converging

QUALITY CRITERIA:
✓ Supported by 3+ momentum signals
✓ Specific timeframe (not "eventually")
✓ Clear business impact quantified
✓ Preparation strategy provided
✓ Content opportunity identified

OUTPUT FORMAT (valid JSON array):
[
  {
    "whatWillHappen": "Specific prediction",
    "whyItsComing": "Momentum signals driving this",
    "timing": "2-weeks",
    "businessImpact": "Specific impact on the business",
    "preparationStrategy": "What to do NOW to prepare",
    "contentOpportunity": "Content to create this week",
    "whyProfound": "Why this matters",
    "whyNow": "Why act now",
    "insight": "One sentence summary",
    "evidence": ["Signal 1", "Signal 2", "Signal 3"],
    "expectedReaction": "Expected response",
    "confidence": 0.75
  }
]

Remember: The best predictions are obvious in hindsight but non-obvious now.
`.trim();
  }

  /**
   * DEEP PSYCHOLOGY: Uncover hidden wants
   */
  getDeepPsychologyPrompt(context: DeepContext, seeds?: Connection[]): string {
    const painPoints = context.realTimeCultural?.painPoints
      ?.slice(0, 5)
      .map(p => `- ${p.painPoint}`)
      .join('\n') || 'No pain points';

    const unarticulated = context.customerPsychology?.unarticulated
      ?.slice(0, 5)
      .map(u => `- ${u.need}`)
      .join('\n') || 'No unarticulated needs';

    const objections = context.customerPsychology?.hiddenObjections
      ?.slice(0, 3)
      .map(o => `- ${o.objection}`)
      .join('\n') || 'No objections';

    const seedPatterns = seeds && seeds.length > 0
      ? `\n\nPSYCHOLOGICAL PATTERNS FROM DATA:\n${seeds.filter(s => s.sources.primary.metadata.domain === 'psychology').map(s => `- ${s.relationship.explanation}`).join('\n')}`
      : '';

    return `
You are a depth psychology AI that uncovers what customers REALLY want but can't articulate.

BUSINESS: ${context.business.name}
INDUSTRY: ${context.business.industry}

STATED PAIN POINTS:
${painPoints}

UNARTICULATED NEEDS (what we've inferred):
${unarticulated}

HIDDEN OBJECTIONS:
${objections}

IDENTITY DESIRES:
${JSON.stringify(context.customerPsychology?.identity || {}, null, 2)}
${seedPatterns}

YOUR TASK: Uncover 5 deep psychological insights about what customers REALLY want.

Focus on:
- What they want but can't articulate (identity desires)
- Identity desires they don't admit publicly
- Emotional jobs they're hiring the business to do
- Real reason they buy (vs. stated reason)
- Permission they need to be granted

QUALITY CRITERIA:
✓ Goes beyond surface-level wants
✓ Explains the "why behind the why"
✓ Identifies emotional jobs-to-be-done
✓ Addresses identity and status
✓ Creates a permission grant strategy

OUTPUT FORMAT (valid JSON array):
[
  {
    "hiddenWant": "What they really want (deeper level)",
    "whyTheyCantSayIt": "Why they can't articulate this",
    "realJob": "Emotional job they're hiring business for",
    "identityDesire": "Who they want to become",
    "contentStrategy": "How to address this in content",
    "permissionGrant": "What permission they need",
    "whyProfound": "Why this insight matters",
    "whyNow": "Why address this now",
    "insight": "One sentence summary",
    "evidence": ["Behavioral evidence 1", "Evidence 2", "Evidence 3"],
    "expectedReaction": "How they'll respond",
    "confidence": 0.8
  }
]

Remember: The best psychology insights explain behavior that seemed irrational before.
`.trim();
  }

  /**
   * CULTURAL INTELLIGENCE: Connect to cultural moments
   */
  getCulturalMomentPrompt(context: DeepContext, seeds?: Connection[]): string {
    const culturalMoments = context.realTimeCultural?.culturalMoments
      ?.slice(0, 5)
      .map(m => `- ${m.title}: ${m.description}`)
      .join('\n') || 'No current moments';

    const trendingTopics = context.realTimeCultural?.trendingTopics
      ?.slice(0, 5)
      .map(t => `- ${t.topic} (${t.platform})`)
      .join('\n') || 'No trending topics';

    const seedMoments = seeds && seeds.length > 0
      ? `\n\nCULTURAL CONNECTIONS FOUND:\n${seeds.filter(s => s.sources.primary.metadata.domain === 'timing').map(s => `- ${s.breakthroughPotential.contentAngle}`).join('\n')}`
      : '';

    return `
You are a cultural intelligence AI with real-time awareness that finds authentic connections between businesses and current cultural moments.

BUSINESS: ${context.business.name}
INDUSTRY: ${context.business.industry}
LOCATION: ${context.business.location?.city}, ${context.business.location?.state}

CURRENT CULTURAL MOMENTS:
${culturalMoments}

TRENDING TOPICS RIGHT NOW:
${trendingTopics}

BUSINESS VALUES/MISSION:
${context.business.mission || 'Not specified'}
${seedMoments}

YOUR TASK: Find 5 authentic connections between this business and current cultural moments.

Requirements:
- Natural connection (not forced)
- Adds value to the cultural conversation
- Unique perspective (not what everyone else is saying)
- Timely (must act this week)
- Authentic (passes the authenticity test)

QUALITY CRITERIA:
✓ Natural bridge to the business
✓ Unique angle (not generic)
✓ Adds value (not just riding trends)
✓ Authentic (doesn't feel opportunistic)
✓ Actionable today

OUTPUT FORMAT (valid JSON array):
[
  {
    "culturalMoment": "What's happening right now",
    "bridge": "Natural connection to business",
    "uniqueAngle": "What unique perspective can we add?",
    "contentConcept": "Specific content idea",
    "authenticityCheck": true,
    "whyProfound": "Why this connection matters",
    "whyNow": "Why this is timely",
    "insight": "One sentence summary",
    "evidence": ["Why authentic 1", "Why authentic 2", "Why authentic 3"],
    "expectedReaction": "Expected response",
    "confidence": 0.75
  }
]

Remember: The best cultural moments feel like a natural extension of the brand, not a forced trend-jack.
`.trim();
  }

  /**
   * HIDDEN PATTERNS: Find non-obvious patterns in data
   */
  getHiddenPatternPrompt(context: DeepContext, seeds?: Connection[]): string {
    const seedConnections = seeds && seeds.length > 0
      ? seeds.map(s => ({
          primary: s.sources.primary.content,
          secondary: s.sources.secondary.content,
          similarity: s.relationship.semanticSimilarity
        }))
      : [];

    return `
You are a pattern recognition AI that finds non-obvious patterns in customer behavior, market dynamics, and competitive landscapes.

BUSINESS DATA:
${JSON.stringify(context.business, null, 2)}

CUSTOMER PSYCHOLOGY:
${JSON.stringify(context.customerPsychology, null, 2)}

COMPETITIVE INTELLIGENCE:
${JSON.stringify(context.competitiveIntel, null, 2)}

DISCOVERED CONNECTIONS:
${JSON.stringify(seedConnections, null, 2)}

YOUR TASK: Find 5 hidden patterns that reveal strategic insights.

Focus on:
- Correlations between seemingly unrelated data points
- Cyclical patterns in customer behavior
- Gaps between what competitors do and what customers want
- Timing patterns in purchase decisions
- Behavioral contradictions (say vs. do)

QUALITY CRITERIA:
✓ Non-obvious (requires data analysis to see)
✓ Actionable (can change strategy)
✓ Backed by multiple data points
✓ Explains unexpected outcomes
✓ Reveals competitive advantage

OUTPUT FORMAT (valid JSON array):
[
  {
    "pattern": "Description of the pattern",
    "dataPoints": ["Data 1", "Data 2", "Data 3"],
    "whyHidden": "Why competitors miss this",
    "strategicImplication": "What to do with this",
    "contentAngle": "How to communicate this",
    "whyProfound": "Why this matters",
    "whyNow": "Why act now",
    "insight": "One sentence summary",
    "evidence": ["Evidence 1", "Evidence 2", "Evidence 3"],
    "expectedReaction": "Expected response",
    "confidence": 0.8
  }
]

Remember: The best patterns explain anomalies and reveal unseen opportunities.
`.trim();
  }

  /**
   * Parse model response into insights
   */
  parseInsights(
    response: string,
    thinkingStyle: ThinkingStyle,
    insightType: InsightType,
    model: string
  ): BreakthroughInsight[] {
    try {
      // Strip markdown code blocks if present
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Try to parse as JSON
      let parsed = JSON.parse(cleanedResponse);

      // Handle if response is wrapped in a container object
      if (parsed.insights) {
        parsed = parsed.insights;
      }

      // Ensure it's an array
      if (!Array.isArray(parsed)) {
        parsed = [parsed];
      }

      // Convert to BreakthroughInsight format
      return parsed.map((item: any, index: number) => ({
        id: `insight-${thinkingStyle}-${Date.now()}-${index}`,
        type: insightType,
        thinkingStyle,
        insight: item.insight || item.connection || item.counterIntuitiveTruth || 'No insight',
        whyProfound: item.whyProfound || 'Not specified',
        whyNow: item.whyNow || 'Timely opportunity',
        contentAngle: item.contentAngle || item.contentConcept || item.contentStrategy || 'Not specified',
        expectedReaction: item.expectedReaction || 'Positive engagement',
        evidence: item.evidence || [],
        confidence: item.confidence || 0.7,
        rawOutput: item,
        metadata: {
          generatedAt: new Date(),
          model
        }
      }));
    } catch (error) {
      console.error(`[BreakthroughPromptLibrary] Failed to parse response:`, error);
      console.error('Response:', response);
      return [];
    }
  }
}
