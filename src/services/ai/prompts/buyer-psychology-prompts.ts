/**
 * Buyer Psychology AI Prompts
 *
 * Structured prompts for analyzing customer triggers, personas, and transformations
 *
 * Created: 2025-11-18
 */

import type { BusinessContext } from './value-prop-prompts';

/**
 * TIER 1: EXTRACT - Haiku
 * Extract psychological triggers from customer data
 */
export function getExtractBuyerPsychologyPrompt(context: BusinessContext, rawData: string): string {
  return `Extract buyer psychology signals from customer data (reviews, testimonials, social media, etc.).

Business: ${context.businessName}
Industry: ${context.industry}

Instructions:
1. Extract PAIN POINTS (problems, frustrations, obstacles)
2. Extract DESIRES (aspirations, goals, wanted outcomes)
3. Extract FEARS (anxieties, worries, risks they want to avoid)
4. Extract TRIGGERS (events that prompt them to seek a solution)
5. Extract TRANSFORMATION language (before/after states)
6. Extract decision criteria (what they care about when choosing)

Customer Data:
${rawData}

Output JSON with:
{
  "dataPoints": ["array of psychological signals"],
  "sources": ["reviews", "testimonials", "social", etc],
  "raw": {
    "painPoints": ["array of pain points"],
    "desires": ["array of desires"],
    "fears": ["array of fears"],
    "triggers": ["array of triggering events"],
    "transformations": ["array of before/after language"],
    "decisionCriteria": ["what matters in their decision"]
  }
}`;
}

/**
 * TIER 2: ANALYZE - Sonnet
 * Analyze psychology data into structured buyer insights
 */
export function getAnalyzeBuyerPsychologyPrompt(context: BusinessContext, eqScore?: number): string {
  return `Analyze buyer psychology signals to create buyer personas and customer triggers.

Business: ${context.businessName}
Industry: ${context.industry}
${eqScore ? `Industry EQ: ${eqScore}% (${eqScore > 70 ? 'emotional' : eqScore > 40 ? 'mixed' : 'rational'})` : ''}

Instructions:
1. Create 2-3 buyer personas based on patterns in the data
2. For each persona:
   - Name and archetype (e.g., "Budget-conscious parent")
   - Psychographics (values, fears, goals)
   - Decision drivers (emotional vs rational vs social %)
   - Primary transformation they seek

3. Identify top 5-7 customer triggers:
   - Categorize as: pain, desire, fear, or aspiration
   - Rate urgency (0-100: how pressing is this need?)
   - Rate frequency (0-100: how often does this appear in data?)
   - Calculate emotional weight using EQ principles

4. Map customer transformations:
   - Before state (problem/pain)
   - During (process/journey)
   - After state (outcome/result)
   - Timeline (how long does transformation take?)

Output JSON with:
{
  "structured": {
    "personas": [
      {
        "id": "persona-1",
        "name": "Descriptive name",
        "archetype": "Brief description",
        "psychographics": {
          "values": ["value1", "value2"],
          "fears": ["fear1", "fear2"],
          "goals": ["goal1", "goal2"]
        },
        "decisionDrivers": {
          "emotional": 0-100,
          "rational": 0-100,
          "social": 0-100
        }
      }
    ],
    "triggers": [
      {
        "id": "trigger-1",
        "type": "pain|desire|fear|aspiration",
        "description": "What triggers the need",
        "urgency": 0-100,
        "frequency": 0-100,
        "emotionalWeight": 0-100
      }
    ],
    "transformations": [
      {
        "id": "trans-1",
        "before": {
          "state": "Current situation",
          "emotion": "frustrated|confused|overwhelmed|anxious",
          "painPoints": ["pain1", "pain2"]
        },
        "during": {
          "process": "What they go through",
          "touchpoints": ["step1", "step2"]
        },
        "after": {
          "state": "Desired outcome",
          "emotion": "confident|relieved|empowered|satisfied",
          "outcomes": ["outcome1", "outcome2"]
        },
        "timeline": "Duration (e.g., '3 weeks', 'immediate')"
      }
    ]
  },
  "patterns": ["identified behavioral patterns"],
  "confidence": 0-100,
  "reasoning": "why these insights"
}`;
}

/**
 * TIER 3: SYNTHESIZE - Opus
 * Validate and refine buyer psychology insights
 */
export function getSynthesizeBuyerPsychologyPrompt(context: BusinessContext, eqScore?: number): string {
  return `Synthesize and validate buyer psychology insights into actionable intelligence.

Business: ${context.businessName}
Industry: ${context.industry}
${eqScore ? `Industry EQ: ${eqScore}% - ${getEQGuidance(eqScore)}` : ''}

Instructions:
1. Validate each persona:
   - Is it distinct from other personas?
   - Is it based on real patterns in the data?
   - Are the psychographics consistent?
   - Are decision drivers realistic for this persona?

2. Validate each trigger:
   - Is it a genuine customer trigger (not assumed)?
   - Are urgency/frequency scores justified by data?
   - Does emotional weight align with industry EQ?

3. Validate transformations:
   - Is the before/after realistic and specific?
   - Are the emotions authentic (from customer language)?
   - Is the timeline realistic?
   - Can this business actually deliver this transformation?

4. Calculate confidence scores based on:
   - Data richness (how much customer data we have)
   - Pattern strength (how consistent the signals are)
   - Specificity (how detailed vs generic)

Output JSON with:
{
  "final": {
    "personas": [...with refined descriptions and confidence scores...],
    "triggers": [...with validation and confidence scores...],
    "transformations": [...with validation...]
  },
  "validation": {
    "passed": true|false,
    "issues": ["any red flags or concerns"],
    "confidence": 0-100
  },
  "recommendations": [
    "Actionable insights for marketing/messaging"
  ]
}`;
}

/**
 * Get EQ-specific guidance
 */
function getEQGuidance(eqScore: number): string {
  if (eqScore >= 70) {
    return 'Highly emotional industry - focus on feelings, aspirations, and transformations';
  } else if (eqScore >= 40) {
    return 'Mixed emotional/rational - balance desires with practical benefits';
  } else {
    return 'Highly rational industry - emphasize logic, metrics, and ROI';
  }
}

/**
 * Complete buyer psychology prompts for full pipeline
 */
export function getBuyerPsychologyPrompts(
  context: BusinessContext,
  rawData: string,
  eqScore?: number
) {
  return {
    extract: getExtractBuyerPsychologyPrompt(context, rawData),
    analyze: getAnalyzeBuyerPsychologyPrompt(context, eqScore),
    synthesize: getSynthesizeBuyerPsychologyPrompt(context, eqScore)
  };
}
