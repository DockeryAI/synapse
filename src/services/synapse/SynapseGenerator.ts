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

export interface ProofPoint {
  type: string;
  title: string;
  value: string;
  source: string;
  qualityScore?: number;
}

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
  detailedDataPoints?: any[]; // Raw data points from DeepContext for provenance
  selectedProof?: ProofPoint[]; // Phase 5.1: Proof points to incorporate into content
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
 * Transform raw data points into detailed data sources for provenance
 */
function transformToDetailedDataSources(dataPoints: any[]): any[] {
  if (!dataPoints || dataPoints.length === 0) return [];

  // Group data points by source
  const grouped = new Map<string, any[]>();

  for (const point of dataPoints) {
    const source = point.source || 'unknown';
    if (!grouped.has(source)) {
      grouped.set(source, []);
    }
    grouped.get(source)!.push({
      type: point.type,
      content: point.content,
      metadata: point.metadata,
      confidence: point.confidence,
      timestamp: point.timestamp
    });
  }

  // Convert to array format
  return Array.from(grouped.entries()).map(([source, dataPoints]) => ({
    source,
    dataPoints
  }));
}

/**
 * Format proof points for inclusion in the prompt (Phase 5.1 + 5.2)
 * Includes source attribution for credibility
 */
function formatProofForPrompt(proofPoints?: ProofPoint[]): string {
  if (!proofPoints || proofPoints.length === 0) {
    return '';
  }

  const sections: string[] = [];

  // Group by type for better organization
  const byType = new Map<string, ProofPoint[]>();
  for (const proof of proofPoints) {
    const type = proof.type || 'other';
    if (!byType.has(type)) {
      byType.set(type, []);
    }
    byType.get(type)!.push(proof);
  }

  sections.push('CREDIBILITY & SOCIAL PROOF TO INCORPORATE:');
  sections.push('(Use these naturally in content - cite sources for attribution)');
  sections.push('');

  // Format each type
  const typeLabels: Record<string, string> = {
    rating: '⭐ RATINGS',
    review: '💬 REVIEWS',
    testimonial: '🗣️ TESTIMONIALS',
    metric: '📊 METRICS',
    certification: '🏆 CERTIFICATIONS',
    award: '🏅 AWARDS',
    years: '📅 EXPERIENCE',
    logo: '🏢 CLIENT LOGOS',
    press: '📰 PRESS MENTIONS',
    social: '👥 SOCIAL PROOF'
  };

  for (const [type, proofs] of byType) {
    const label = typeLabels[type] || type.toUpperCase();
    sections.push(`${label}:`);

    for (const proof of proofs) {
      // Include source attribution (Phase 5.2)
      const attribution = proof.source ? ` (Source: ${proof.source})` : '';
      const quality = proof.qualityScore ? ` [Quality: ${proof.qualityScore}/100]` : '';
      sections.push(`  • ${proof.value}${attribution}${quality}`);
    }
    sections.push('');
  }

  sections.push('PROOF INTEGRATION GUIDELINES:');
  sections.push('- Weave proof naturally into content, don\'t just list it');
  sections.push('- For Awareness content: Use volume proof ("500+ customers trust us")');
  sections.push('- For Consideration content: Use outcome proof ("40% cost reduction")');
  sections.push('- For Decision content: Use risk-removal proof ("Money-back guarantee")');
  sections.push('- Always cite the source when using specific claims');
  sections.push('');

  return sections.join('\n');
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
  // STEP 0: Transform detailed data points for provenance
  // ==========================================================================
  const detailedDataSources = input.detailedDataPoints
    ? transformToDetailedDataSources(input.detailedDataPoints)
    : [];

  if (detailedDataSources.length > 0) {
    console.log(`[Synapse] Transformed ${input.detailedDataPoints?.length} data points into ${detailedDataSources.length} source groups for provenance`);
  }

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
  // STEP 3.5: Format Proof Points (Phase 5.1)
  // ==========================================================================
  const proofText = formatProofForPrompt(input.selectedProof);
  if (input.selectedProof && input.selectedProof.length > 0) {
    console.log(`[Synapse] Including ${input.selectedProof.length} proof points in generation`);
  }

  // ==========================================================================
  // STEP 4: Build Synapse Prompt
  // ==========================================================================
  console.log('[Synapse] Step 4: Building prompt...');

  const prompt = buildSynapsePrompt({
    business: input.business,
    dataContext,
    costEquivalenceText,
    connectionHintText,
    proofText
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

  const synapses = parseClaudeResponse(claudeResponse, input.business, detailedDataSources);

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
 * Extract business specialization from DeepContext
 */
function extractBusinessSpecialization(intelligence: any): {
  specialization: string;
  targetAudience: string[];
  valueProps: string[];
  differentiators: string[];
} {
  const result = {
    specialization: '',
    targetAudience: [] as string[],
    valueProps: [] as string[],
    differentiators: [] as string[]
  };

  console.log('[SynapseGenerator] Extracting specialization from DeepContext...');
  console.log('[SynapseGenerator] Available sections:', Object.keys(intelligence || {}));

  // V3 FIX: Check business.uvp and business.profile - this is where DeepContext stores UVP data
  const businessUvp = intelligence?.business?.uvp;
  const businessProfile = intelligence?.business?.profile;

  if (businessUvp) {
    console.log('[SynapseGenerator] Found business.uvp, extracting UVP data...');

    if (businessUvp.uniqueSolution) {
      result.specialization = businessUvp.uniqueSolution;
      result.differentiators.push(businessUvp.uniqueSolution);
    }
    if (businessUvp.keyBenefit) {
      result.valueProps.push(businessUvp.keyBenefit);
    }
    if (businessUvp.targetCustomer) {
      result.targetAudience.push(businessUvp.targetCustomer);
    }
    if (businessUvp.desiredOutcome) {
      result.valueProps.push(businessUvp.desiredOutcome);
    }
    if (businessUvp.customerProblem) {
      result.differentiators.push(`Solves: ${businessUvp.customerProblem}`);
    }
  }

  if (businessProfile) {
    console.log('[SynapseGenerator] Found business.profile, extracting brand data...');

    if (businessProfile.industry) {
      result.differentiators.push(`Specializes in ${businessProfile.industry}`);
    }
    if (businessProfile.name && !result.specialization) {
      result.specialization = `${businessProfile.name} - ${businessProfile.industry || 'industry'} specialist`;
    }
  }

  // Also check for brandProfile (alternative structure)
  const brandProfile = intelligence?.brandProfile;
  if (brandProfile?.uvpElements) {
    const uvp = brandProfile.uvpElements;
    if (uvp.transformation && !result.specialization) {
      result.specialization = uvp.transformation;
    }
    if (uvp.keyBenefit && !result.valueProps.includes(uvp.keyBenefit)) {
      result.valueProps.push(uvp.keyBenefit);
    }
    if (uvp.targetCustomer && !result.targetAudience.includes(uvp.targetCustomer)) {
      result.targetAudience.push(uvp.targetCustomer);
    }
  }

  // Try multiple possible locations for website data (fallback)
  const sections = [
    intelligence?.business?.uniqueAdvantages || [],
    intelligence?.competitiveIntel?.opportunities || [],
    intelligence?.competitiveIntel?.blindSpots || [],
    intelligence?.customerPsychology?.behavioral || [],
    intelligence?.customerPsychology?.unarticulated || [],
    intelligence?.customerPsychology?.emotional || [],
    intelligence?.synthesis?.keyInsights || []
  ];

  sections.forEach(section => {
    if (Array.isArray(section)) {
      section.forEach((item: any) => {
        const content = typeof item === 'string' ? item : item.content || item;
        if (!content || typeof content !== 'string') return;

        const lower = content.toLowerCase();

        // Target audience patterns (broader)
        if (lower.match(/(owner|collector|enthusiast|client|customer|reader|book lover|community|local|neighborhood)/i)) {
          result.targetAudience.push(content);
        }

        // Specialization/differentiator patterns (MUCH BROADER)
        if (lower.match(/(specialist|expert|premium|luxury|rare|classic|exotic|vintage|unique|specialized|exclusive|independent|locally[-\s]owned|curated|handpicked|personal|custom|boutique|artisan|family[-\s]owned|authentic|original|established|trusted|experienced|dedicated|passionate|community|local)/i)) {
          result.differentiators.push(content);
        }

        // Value prop patterns (broader)
        if (lower.match(/(coverage|protection|value|service|guarantee|ensure|support|help|provide|offer|deliver|create|experience|selection|quality|expertise|knowledge|advice|guidance)/i)) {
          result.valueProps.push(content);
        }

        // If no matches but content seems valuable, add to differentiators anyway
        if (!lower.match(/(owner|collector|enthusiast|client|customer|reader|book lover|community|local|neighborhood|specialist|expert|premium|luxury|rare|classic|exotic|vintage|unique|specialized|exclusive|independent|locally[-\s]owned|curated|handpicked|personal|custom|boutique|artisan|family[-\s]owned|authentic|original|established|trusted|experienced|dedicated|passionate|community|local|coverage|protection|value|service|guarantee|ensure|support|help|provide|offer|deliver|create|experience|selection|quality|expertise|knowledge|advice|guidance)/i) &&
            content.length > 20 && content.length < 200) {
          result.differentiators.push(content);
        }
      });
    }
  });

  // Build specialization from differentiators
  if (result.differentiators.length > 0) {
    result.specialization = result.differentiators[0];
    console.log('[SynapseGenerator] Found specialization:', result.specialization);
  } else {
    console.warn('[SynapseGenerator] NO SPECIALIZATION FOUND - will use generic industry');
  }

  console.log('[SynapseGenerator] Extraction results:', {
    specialization: result.specialization,
    targetAudience: result.targetAudience.length,
    valueProps: result.valueProps.length,
    differentiators: result.differentiators.length
  });

  return result;
}

/**
 * Build data context from intelligence
 */
function buildDataContext(intelligence: any): string {
  let context = '';

  // CRITICAL: Extract business specialization from website analysis FIRST
  const specialization = extractBusinessSpecialization(intelligence);

  if (specialization.specialization || specialization.targetAudience.length > 0 ||
      specialization.valueProps.length > 0 || specialization.differentiators.length > 0) {
    context += '### BUSINESS SPECIALIZATION (from website analysis)\n';

    if (specialization.specialization) {
      context += `**What They Actually Specialize In:** ${specialization.specialization}\n`;
    }

    if (specialization.targetAudience.length > 0) {
      context += `**Their Actual Target Audience:** ${specialization.targetAudience.slice(0, 3).join(', ')}\n`;
    }

    if (specialization.differentiators.length > 0) {
      context += `**What Makes Them Unique:** ${specialization.differentiators.slice(0, 3).join(', ')}\n`;
    }

    context += '\n**CRITICAL: Generate content about THEIR SPECIALIZATION, not generic industry content!**\n\n';
  }

  // Trending Topics (from realTimeCultural)
  if (intelligence.realTimeCultural?.trending?.topics && intelligence.realTimeCultural.trending.topics.length > 0) {
    context += '### Trending Topics\n';
    for (const topic of intelligence.realTimeCultural.trending.topics.slice(0, 10)) {
      const topicText = typeof topic === 'string' ? topic : topic.term || topic.topic || topic;
      context += `- ${topicText}\n`;
    }
    context += '\n';
  }

  // Competitive Opportunities (from competitiveIntel)
  if (intelligence.competitiveIntel?.opportunities && intelligence.competitiveIntel.opportunities.length > 0) {
    context += '### What Competitors Are Missing (Opportunities)\n';
    for (const opp of intelligence.competitiveIntel.opportunities.slice(0, 10)) {
      const oppText = typeof opp === 'string' ? opp : opp.opportunity || opp.description || opp;
      context += `- ${oppText}\n`;
    }
    context += '\n';
  }

  // Customer Psychology - Behavioral Triggers
  if (intelligence.customerPsychology?.behavioral && intelligence.customerPsychology.behavioral.length > 0) {
    context += '### Customer Behavioral Triggers\n';
    for (const trigger of intelligence.customerPsychology.behavioral.slice(0, 8)) {
      const triggerText = typeof trigger === 'string' ? trigger : trigger.trigger || trigger.description || trigger;
      context += `- ${triggerText}\n`;
    }
    context += '\n';
  }

  // Customer Psychology - Unarticulated Needs
  if (intelligence.customerPsychology?.unarticulated && intelligence.customerPsychology.unarticulated.length > 0) {
    context += '### Customer Unarticulated Needs\n';
    for (const need of intelligence.customerPsychology.unarticulated.slice(0, 5)) {
      const needText = typeof need === 'string' ? need : need.need || need.description || need;
      context += `- ${needText}\n`;
    }
    context += '\n';
  }

  // Synthesis Insights
  if (intelligence.synthesis?.keyInsights && intelligence.synthesis.keyInsights.length > 0) {
    context += '### Key Insights\n';
    for (const insight of intelligence.synthesis.keyInsights.slice(0, 5)) {
      const insightText = typeof insight === 'string' ? insight : insight.insight || insight;
      context += `- ${insightText}\n`;
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
  proofText?: string;
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

${params.proofText || ''}

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
            "content": "Actual quote from review that triggered this",
            "sentiment": "negative"
          }
        ],
        "reasoning": "1-2 sentence explanation of how the data led to this insight"
      }
    }
  ]
}

CRITICAL REQUIREMENTS:
1. Make whyNow 2-3 full sentences with specific details
2. Include evidencePoints with 2-3 concrete examples
3. Include provenance with 1-2 actual data quotes and brief reasoning
4. Each synapse should be complete but concise

Generate EXACTLY 3 business-focused insights that DRIVE CUSTOMER ACTION. Content must be engaging but professional, with clear CTAs that lead to visits, bookings, or inquiries.`;
}

/**
 * Call Claude 3.5 Sonnet via AI Proxy Edge Function
 */
async function callClaude(prompt: string): Promise<any> {
  const aiProxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseAnonKey) {
    throw new Error('Supabase configuration is missing');
  }

  const response = await fetch(aiProxyUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      provider: 'openrouter',  // Route through ai-proxy to OpenRouter
      model: 'anthropic/claude-opus-4.1',
      max_tokens: 16384,  // Increased to allow 3 synapses with full provenance (~5k tokens each)
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

  // Log finish reason to detect truncation
  const finishReason = data.choices[0].finish_reason;
  if (finishReason === 'length') {
    console.warn('[Synapse] ⚠️ Response truncated due to max_tokens limit!');
    console.warn('[Synapse] Consider increasing max_tokens or simplifying the prompt');
  }

  console.log('[Synapse] Response finish_reason:', finishReason);
  console.log('[Synapse] Response length:', data.choices[0].message.content.length, 'characters');

  // Return in the same format as before
  return {
    content: [{
      text: data.choices[0].message.content
    }],
    usage: data.usage
  };
}

/**
 * Parse Claude response into SynapseInsight objects
 */
function parseClaudeResponse(response: any, business: any, detailedDataSources: any[]): SynapseInsight[] {
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

      // 1. Remove comments (both // and /* */)
      fixedJson = fixedJson.replace(/\/\/.*$/gm, ''); // Remove // comments
      fixedJson = fixedJson.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove /* */ comments

      // 2. Fix trailing commas
      fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');

      // 3. Handle incomplete JSON by trying to close arrays/objects
      const openBraces = (fixedJson.match(/{/g) || []).length;
      const closeBraces = (fixedJson.match(/}/g) || []).length;
      const openBrackets = (fixedJson.match(/\[/g) || []).length;
      const closeBrackets = (fixedJson.match(/\]/g) || []).length;

      // Add missing closing brackets
      if (openBrackets > closeBrackets) {
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          fixedJson += ']';
        }
      }

      // Add missing closing braces
      if (openBraces > closeBraces) {
        for (let i = 0; i < openBraces - closeBraces; i++) {
          fixedJson += '}';
        }
      }

      try {
        parsed = JSON.parse(fixedJson);
        console.log('[Synapse] ✅ JSON recovery successful!');
      } catch (secondError) {
        console.error('[Synapse] ❌ JSON recovery failed after fixes');
        console.error('[Synapse] JSON length:', jsonMatch[0].length, 'characters');
        console.error('[Synapse] First 1000 chars:', jsonMatch[0].substring(0, 1000));
        console.error('[Synapse] Last 500 chars:', jsonMatch[0].substring(jsonMatch[0].length - 500));
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

      // DEEP PROVENANCE: Capture the provenance data from Claude + add detailedDataSources
      deepProvenance: {
        ...(bt.provenance || {}),
        detailedDataSources  // Add the transformed data sources for complete transparency
      }
    } as any));

  } catch (error) {
    console.error('[Synapse] Error parsing response:', error);
    return [];
  }
}
