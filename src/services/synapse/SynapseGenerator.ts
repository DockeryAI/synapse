/**
 * Simple Synapse Generator
 *
 * Replaces the complex multi-model orchestra with a single Claude 3.5 Sonnet call
 * Integrates cost equivalences calculator and semantic connection hints
 * Produces synapse content in the original behavioral economics style
 */

import {
  calculateCostEquivalences,
  formatForPrompt as formatCostEquivalences,
  getIndustryExamples,
  type ServiceCost
} from './helpers/CostEquivalenceCalculator';

import {
  generateConnectionHints,
  formatHintsForPrompt,
  createDataSourcesFromIntelligence
} from './helpers/ConnectionHintGenerator';

import type { SynapseInsight } from '@/types/synapse/synapse.types';

export interface SynapseInput {
  business: {
    name: string;
    industry: string;
    location: {
      city: string;
      state: string;
    };
    services?: ServiceCost[];
  };
  intelligence: any; // BusinessIntelligence or similar
}

export interface SynapseResult {
  synapses: SynapseInsight[];
  metadata: {
    generationTimeMs: number;
    costEquivalencesUsed: number;
    connectionHintsUsed: number;
    totalCost: number;
    model: string;
  };
}

/**
 * Clean meta-instructions from content
 * Removes common instruction patterns like "Start with 'secret'", "Begin with...", etc.
 */
function cleanMetaInstructions(text: string): string {
  if (!text) return text;

  // Log if we find meta-instructions
  if (text.toLowerCase().includes('start with') || text.toLowerCase().includes('secret')) {
    console.warn('[SynapseGenerator] Found meta-instruction in text:', text.substring(0, 100));
  }

  // AGGRESSIVE cleaning - match all variants
  const patterns = [
    /^Start with ["']?secret["']?\s*/i,  // Specific "secret" pattern FIRST
    /^Start with ["'][^"']*["']\s*/i,    // Any quoted phrase after "Start with"
    /^Start with\s+/i,                   // Just "Start with"
    /^Begin with\s+/i,
    /^Open with\s+/i,
    /^Create (a|an)\s+/i,
    /^Write (a|an)\s+/i,
    /^Make (a|an)\s+/i,
    /^Build (a|an)\s+/i,
    /^Use (a|an)\s+/i,
    /^Try (a|an)\s+/i,
    /^Consider (a|an)\s+/i,
    /^Post (a|an)\s+/i,
    /^Share (a|an)\s+/i,
    /^Show (a|an)\s+/i,
    /^POV:\s*/i,
    /^Video series:\s*/i,
    /^"?secret"?\s*/i  // Any remaining "secret" at start
  ];

  let cleaned = text;
  for (const pattern of patterns) {
    const before = cleaned;
    cleaned = cleaned.replace(pattern, '');
    if (before !== cleaned) {
      console.warn('[SynapseGenerator] Removed pattern:', pattern.toString().substring(0, 50));
    }
  }

  // Remove "secret" from anywhere in the text (it's a meta-instruction artifact)
  if (cleaned.toLowerCase().includes('secret')) {
    console.warn('[SynapseGenerator] Removing "secret" from text');
    cleaned = cleaned.replace(/\bsecret\b\s*/gi, '');
  }

  // If we removed something, capitalize the first letter
  if (cleaned !== text && cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  if (cleaned !== text) {
    console.log('[SynapseGenerator] Cleaned text:', text.substring(0, 80), '→', cleaned.substring(0, 80));
  }

  return cleaned;
}

/**
 * Generate synapses using simple single-model approach
 */
export async function generateSynapses(
  input: SynapseInput
): Promise<SynapseResult> {
  const startTime = Date.now();
  console.log(`[Synapse] Starting generation for ${input.business.name}...`);

  // ==========================================================================
  // STEP 1: Calculate Cost Equivalences
  // ==========================================================================
  console.log('[Synapse] Step 1: Calculating cost equivalences...');

  const services = input.business.services || getIndustryExamples(input.business.industry);
  const costEquivalences = services.length > 0
    ? services.map(service => calculateCostEquivalences(service))
    : [];

  const costEquivalenceText = costEquivalences.length > 0
    ? costEquivalences.map(eq => formatCostEquivalences(eq)).join('\n\n')
    : 'No service costs provided for equivalence calculation.';

  console.log(`[Synapse] Found ${costEquivalences.length} cost equivalence sets`);

  // ==========================================================================
  // STEP 2: Generate Semantic Connection Hints
  // ==========================================================================
  console.log('[Synapse] Step 2: Generating connection hints...');

  const dataSources = createDataSourcesFromIntelligence(input.intelligence);
  const connectionResult = await generateConnectionHints(dataSources, {
    minSimilarity: 0.65,
    maxHints: 5,
    prioritizeCrossDomain: true
  });

  const connectionHintText = formatHintsForPrompt(connectionResult);
  console.log(`[Synapse] Found ${connectionResult.hints.length} connection hints`);

  // ==========================================================================
  // STEP 3: Build Comprehensive Data Context
  // ==========================================================================
  console.log('[Synapse] Step 3: Building data context...');

  const dataContext = buildDataContext(input.intelligence);

  // ==========================================================================
  // STEP 4: Build Synapse Prompt
  // ==========================================================================
  console.log('[Synapse] Step 4: Building prompt...');

  const prompt = buildSynapsePrompt({
    business: input.business,
    dataContext,
    costEquivalenceText,
    connectionHintText
  });

  // ==========================================================================
  // STEP 5: Call Claude 3.5 Sonnet
  // ==========================================================================
  console.log('[Synapse] Step 5: Calling Claude 3.5 Sonnet...');

  const claudeResponse = await callClaude(prompt);

  // ==========================================================================
  // STEP 6: Parse Response into Synapses
  // ==========================================================================
  console.log('[Synapse] Step 6: Parsing response...');

  const synapses = parseClaudeResponse(claudeResponse, input.business);

  const generationTimeMs = Date.now() - startTime;
  const totalCost = connectionResult.cost + (claudeResponse.usage?.total_tokens || 0) * 0.000015; // Sonnet pricing

  console.log(`[Synapse] ✓ Generated ${synapses.length} synapses in ${generationTimeMs}ms`);
  console.log(`[Synapse] Total cost: $${totalCost.toFixed(4)}`);

  return {
    synapses,
    metadata: {
      generationTimeMs,
      costEquivalencesUsed: costEquivalences.length,
      connectionHintsUsed: connectionResult.hints.length,
      totalCost,
      model: 'claude-3-5-sonnet-20241022'
    }
  };
}

/**
 * Build data context from intelligence
 */
function buildDataContext(intelligence: any): string {
  let context = '';

  // Weather
  if (intelligence.realTimeSignals?.weather?.triggers) {
    context += '### Weather Context\n';
    for (const trigger of intelligence.realTimeSignals.weather.triggers.slice(0, 3)) {
      context += `- ${trigger.type}: ${trigger.description}\n`;
    }
    context += '\n';
  }

  // Local Events
  if (intelligence.localIntelligence?.localEvents) {
    context += '### Local Events\n';
    for (const event of intelligence.localIntelligence.localEvents.slice(0, 5)) {
      context += `- ${event.title} (${event.date}): ${event.relevance || ''}\n`;
    }
    context += '\n';
  }

  // Review Pain Points
  if (intelligence.reviewData?.painPoints) {
    context += '### Customer Pain Points (from reviews)\n';
    for (const pain of intelligence.reviewData.painPoints.slice(0, 5)) {
      context += `- ${pain.concern || pain}\n`;
    }
    context += '\n';
  }

  // Trending Topics
  if (intelligence.culturalSnapshot?.trendingTopics) {
    context += '### Trending Topics\n';
    for (const topic of intelligence.culturalSnapshot.trendingTopics.slice(0, 5)) {
      context += `- ${topic.term || topic} (${topic.volume || 'N/A'} mentions)\n`;
    }
    context += '\n';
  }

  // Search Keywords
  if (intelligence.searchData?.opportunityKeywords) {
    context += '### Search Opportunity Keywords\n';
    for (const kw of intelligence.searchData.opportunityKeywords.slice(0, 5)) {
      context += `- ${kw.keyword || kw} (position ${kw.position || 'N/A'})\n`;
    }
    context += '\n';
  }

  // Competitive Gaps
  if (intelligence.competitive?.contentGaps) {
    context += '### What Competitors Are Missing\n';
    for (const gap of intelligence.competitive.contentGaps.slice(0, 5)) {
      context += `- ${gap.gap || gap}\n`;
    }
    context += '\n';
  }

  return context || 'No real-time intelligence data available.';
}

/**
 * Build the synapse prompt
 */
function buildSynapsePrompt(params: {
  business: any;
  dataContext: string;
  costEquivalenceText: string;
  connectionHintText: string;
}): string {
  // Get current date for seasonal context
  const now = new Date();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const currentDate = `${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  return `You are a business marketing strategist who creates engaging content that DRIVES CUSTOMER ACTION.

Your job: Find insights that are BOTH engaging AND business-focused, with clear calls-to-action that drive visits, bookings, purchases, or inquiries.

BUSINESS: ${params.business.name} (${params.business.industry})
LOCATION: ${params.business.location.city}, ${params.business.location.state}
TODAY'S DATE: ${currentDate}

${params.dataContext}

${params.costEquivalenceText}

${params.connectionHintText}

---

CRITICAL FACT-CHECKING RULES:

1. WEATHER & SEASONS: Use CURRENT weather and season data from the context above. It is ${currentDate} - do NOT reference summer, heat waves, or hot weather unless the weather data specifically shows that. Use actual current conditions and upcoming seasonal transitions.

2. NO FALSE URGENCY: Do NOT create fake deadlines or urgency unless there's ACTUAL supporting data:
   ❌ "The next 72 hours are crucial" (unless there's actual weather/event data showing this)
   ❌ "You only have until Friday" (unless there's a real deadline)
   ❌ "Winter is coming" in November in Austin, TX (it doesn't freeze there until late December/January)
   ✅ "Holiday entertaining season is starting" (factually true in November)
   ✅ "Fall planting window is closing" (if weather data supports this)

3. VERIFY CLAIMS: Only make claims you can support with the data provided. If you don't have weather data showing freezing temps, don't claim urgency around freezing. If you don't have event data, don't invent events.

YOUR TASK: Generate 3 business-focused content ideas that connect behavioral insights to customer action.

WHAT MAKES GREAT BUSINESS CONTENT:

For a Bar/Pub:
❌ "Getting drunk at our bar is your toxic trait" (irresponsible, legal liability)
❌ "Taylor Swift Eras cocktails" (dated reference, no business purpose)
✅ "Thursday nights in Uptown - when 'one drink' turns into reconnecting with your college friends. That's why we added the nostalgia playlist. Reserve your table." (relatable + clear CTA)

For a Coffee Cart:
❌ "We're the wedding crashers but everyone loves us" (no clear value)
❌ "Save $500 on coffee service vs venue pricing" (ROI/cost-saving angle)
✅ "Wedding planners: Your 3pm ceremony energy slump? We handle it. Mobile espresso bar shows up at golden hour. Guests stay energized through speeches. DM to add us to your next event." (problem + solution + CTA)

For a Local Business:
❌ "Mercury Retrograde vibes at the office" (random, no purpose)
✅ "Dallas mornings hit different when your usual spot is packed. We're the quiet alternative with the strong cold brew locals know about. Find us on Oak Lawn." (relatable + clear direction)

RULES FOR BUSINESS CONTENT:
1. ✅ BUSINESS PURPOSE - Every insight must lead to a clear action (visit, book, try, join, inquire)
2. ✅ PROFESSIONAL TONE - Match small business owner voice, not Gen Z social media manager
3. ✅ LEGALLY SAFE - No irresponsible messaging (avoid "get drunk", liability issues)
4. ✅ BEHAVIORAL INSIGHTS - Focus on customer behavior patterns, timing, needs
5. ✅ CLEAR VALUE - What problem does this solve? What experience does it create?
6. ✅ ACTIONABLE CTA - Every insight needs a next step (visit, book, DM, try, find us)
7. ✅ RELEVANT HOOKS - Weather, local events, seasonal moments (but not memes)
8. ❌ NO VIRAL MEMES - No TikTok sounds, dated trends (Taylor Swift Eras), Gen Z slang
9. ❌ NO IRRESPONSIBLE CONTENT - No encouraging excessive drinking, risky behavior
10. ❌ NO ROI/COST-SAVING ANGLES - No "save money", "cut costs", "increase productivity", "improve ROI"
11. ✅ FRAMEWORK-READY - Insights should work with Hook-Story-Offer, AIDA, PAS structures

TONE GUIDELINES BY INDUSTRY:
- Bar/Pub: Welcoming, community-focused, responsible ("great night out" not "get drunk")
- Coffee/Food: Service-focused, problem-solving, professional
- Events: Value-demonstrating, reliability-focused
- Professional Services: Authority-building, trust-focused

CRITICAL RULES FOR contentAngle:
1. Write the ACTUAL CONTENT HOOK - exactly what the headline should say
2. NEVER include meta-instructions like "Start with", "Begin with", "Create a", etc.
3. NEVER use the word "secret" anywhere in your content (it's a meta-instruction artifact)
4. Write as if you're posting directly to social media

BAD contentAngle: "Start with 'secret' Video series showing..."
GOOD contentAngle: "The quiet coffee shop locals know about when the main street is packed"

BAD contentAngle: "Guest room isn't secret ready" (uses "secret" as a word)
GOOD contentAngle: "When your in-laws announce their visit and your guest room needs an upgrade"

BAD insight: "Taylor Swift fans love themed cocktails"
GOOD insight: "Thursday nights in Dallas - when coworkers become friends over drinks, not just small talk"

OUTPUT FORMAT (JSON):

{
  "synapses": [
    {
      "title": "Hook-style title that captures attention",
      "insight": "The behavioral insight (customer-focused, business-appropriate)",
      "whyProfound": "Why this matters to the customer and business",
      "whyNow": "2-3 sentences explaining why this timing/moment matters with specific details (seasonal, local, behavioral)",
      "evidencePoints": ["Specific example or proof point 1", "Specific example or proof point 2", "Specific example or proof point 3"],
      "psychologyPrinciple": "The psychological/behavioral principle at work",
      "contentAngle": "THE ACTUAL CONTENT HOOK - ready to use as headline",
      "expectedReaction": "What customer action or emotional response this drives",
      "callToAction": "Clear next step (visit, book, DM, try, find us, call)",
      "dataUsed": ["weather", "local event", "behavioral pattern", "seasonal timing"],
      "confidence": 0.85,

      "provenance": {
        "rawDataSources": [
          {
            "platform": "google-reviews",
            "type": "review",
            "content": "Actual quote from review/comment/post that triggered this insight",
            "sentiment": "negative",
            "relevanceScore": 0.9
          }
        ],
        "psychologySelection": {
          "selectedPrinciple": "The psychology principle chosen",
          "selectionReasoning": "Why this principle was selected based on the data",
          "dataPointsThatTriggered": ["Review about X", "Comment mentioning Y"]
        },
        "topicCorrelation": {
          "primaryTopic": "Main topic identified",
          "relatedTopics": [
            {"topic": "Related topic 1", "similarityScore": 0.85, "source": "reviews"}
          ]
        },
        "platformBreakdown": [
          {
            "platform": "Google Reviews",
            "dataPoints": 3,
            "keyInsights": ["Pain point about X", "Positive mention of Y"],
            "contributionToFinalContent": "Drove the hook about timing anxiety"
          }
        ],
        "decisionPipeline": [
          {"step": 1, "action": "Analyzed review sentiment", "input": "5 reviews mentioning X", "output": "85% negative sentiment", "reasoning": "High pain point signal"},
          {"step": 2, "action": "Selected psychology principle", "input": "Negative sentiment + urgency timing", "output": "Cognitive Dissonance", "reasoning": "Gap between customer expectation and reality"}
        ]
      }
    }
  ]
}

CRITICAL: Make whyNow 2-3 full sentences with specific details, NOT just one short sentence. Include evidencePoints with 2-3 concrete examples or proof points that support the insight.

DEEP PROVENANCE: Include the provenance object showing exactly what data triggered this insight - quote actual reviews/comments/posts, show psychology selection reasoning, include platform breakdown, and document the complete decision pipeline.

Generate 3 business-focused insights that DRIVE CUSTOMER ACTION. Content must be engaging but professional, with clear CTAs that lead to visits, bookings, or inquiries.`;
}

/**
 * Call Claude 3.5 Sonnet via OpenRouter
 */
async function callClaude(prompt: string): Promise<any> {
  const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!openRouterKey) {
    throw new Error('No OpenRouter API key found');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://marba-agent.app',
      'X-Title': 'MARBA.ai Synapse Generator'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      max_tokens: 4096,
      temperature: 0.8,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();

  // OpenRouter returns the response in data.choices[0].message.content
  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from OpenRouter');
  }

  // Return in the same format as before
  return {
    content: [{
      text: data.choices[0].message.content
    }]
  };
}

/**
 * Parse Claude response into SynapseInsight objects
 */
function parseClaudeResponse(response: any, business: any): SynapseInsight[] {
  try {
    // Extract text content
    const content = response.content[0]?.text || '';

    // Find JSON in response
    const jsonMatch = content.match(/\{[\s\S]*"synapses"[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Synapse] No JSON found in response');
      console.error('[Synapse] Response content:', content.substring(0, 500));
      return [];
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      // Try to fix common JSON issues
      console.error('[Synapse] Initial JSON parse failed, attempting recovery...');
      let fixedJson = jsonMatch[0];

      // Fix trailing commas
      fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');

      try {
        parsed = JSON.parse(fixedJson);
        console.log('[Synapse] JSON recovery successful!');
      } catch (secondError) {
        console.error('[Synapse] JSON recovery failed');
        console.error('[Synapse] Malformed JSON (first 1000 chars):', jsonMatch[0].substring(0, 1000));
        return [];
      }
    }

    const synapses = parsed.synapses || [];

    // Convert to SynapseInsight format
    return synapses.map((bt: any, index: number) => ({
      id: `simple-${Date.now()}-${index}`,
      type: 'counter_intuitive',
      thinkingStyle: 'analytical',
      insight: cleanMetaInstructions(bt.insight || ''),
      whyProfound: bt.whyProfound || bt.psychologyPrinciple || '',
      whyNow: bt.whyNow || `Based on current ${(bt.dataUsed || []).join(', ')}`,
      contentAngle: cleanMetaInstructions(bt.contentAngle || ''),
      expectedReaction: bt.expectedReaction,
      // Use evidencePoints from Claude response if available
      evidence: bt.evidencePoints || [],
      confidence: bt.confidence || 0.75,
      metadata: {
        generatedAt: new Date(),
        model: 'claude-3-5-sonnet-20241022',
        tokensUsed: response.usage?.total_tokens,
        generationTimeMs: 0
      },
      // Additional fields for display
      title: bt.title,
      psychologyPrinciple: bt.psychologyPrinciple,
      dataUsed: bt.dataUsed,
      callToAction: bt.callToAction,  // Capture CTA from prompt response

      // DEEP PROVENANCE: Capture the provenance data from Claude
      deepProvenance: bt.provenance || null
    } as any));

  } catch (error) {
    console.error('[Synapse] Error parsing response:', error);
    return [];
  }
}
