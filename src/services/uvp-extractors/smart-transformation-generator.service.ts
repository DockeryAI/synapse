/**
 * Smart Transformation Generator Service
 *
 * Generates transformation goals using a multi-layer approach:
 * Layer 1: Industry Baseline (pain points, triggers, psychology)
 * Layer 2: Personalization (buyer personas, services, testimonials)
 * Layer 3: Claude Synthesis (combines all data into transformations)
 *
 * Priority Order:
 * 1. Website testimonials (most specific)
 * 2. Industry profile + Services combo (highly relevant)
 * 3. Generic industry patterns (fallback)
 *
 * Created: 2025-11-19
 */

import type { TransformationGoal } from '@/types/uvp-flow.types';
import type { CustomerProfile, ProductService } from '@/types/uvp-flow.types';
import type { IndustryProfile } from '@/types/industry-profile.types';
import { getIndustryEQ } from '@/services/uvp-wizard/emotional-quotient';
import { industryRegistry } from '@/data/industries';
import { jtbdTransformer } from '@/services/intelligence/jtbd-transformer.service';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface SmartTransformationInput {
  businessName: string;
  industry?: string;
  services?: ProductService[];
  customers?: CustomerProfile[];
  testimonials?: string[];
  websiteParagraphs?: string[];
}

export interface SmartTransformationResult {
  goals: TransformationGoal[];
  source: 'testimonials' | 'industry-services' | 'industry-baseline' | 'generated';
  confidence: number;
  method: string;
}

/**
 * Generate transformation goals using smart multi-layer approach
 */
export async function generateSmartTransformations(
  input: SmartTransformationInput
): Promise<SmartTransformationResult> {
  console.log('[SmartTransformationGenerator] Starting smart generation...');
  console.log('[SmartTransformationGenerator] Input:', {
    industry: input.industry,
    servicesCount: input.services?.length || 0,
    customersCount: input.customers?.length || 0,
    testimonialsCount: input.testimonials?.length || 0,
    paragraphsCount: input.websiteParagraphs?.length || 0
  });

  // Get industry profile and EQ score
  // Try to match industry by name using search
  const industryProfile = input.industry
    ? (industryRegistry.search(input.industry)[0] || null)
    : null;
  const industryEQ = input.industry ? await getIndustryEQ(input.industry) : null;

  console.log('[SmartTransformationGenerator] Industry data:', {
    hasProfile: !!industryProfile,
    hasEQ: !!industryEQ,
    eqScore: industryEQ
  });

  // Try each strategy in priority order (with fallback on failure)

  // Strategy 1: Use testimonials if available (most specific)
  if (input.testimonials && input.testimonials.length > 0) {
    console.log('[SmartTransformationGenerator] Strategy 1: Using testimonials');
    const result = await generateFromTestimonials(input, industryProfile, industryEQ);
    if (result.goals.length > 0) {
      return result;
    }
    console.warn('[SmartTransformationGenerator] Strategy 1 failed (no goals), falling back to Strategy 2');
  }

  // Strategy 2: Use industry profile + services combo (highly relevant)
  if (industryProfile && input.services && input.services.length > 0) {
    console.log('[SmartTransformationGenerator] Strategy 2: Using industry profile + services');
    const result = await generateFromIndustryAndServices(input, industryProfile, industryEQ);
    if (result.goals.length > 0) {
      return result;
    }
    console.warn('[SmartTransformationGenerator] Strategy 2 failed (no goals), falling back to Strategy 3');
  }

  // Strategy 3: Use industry baseline patterns (fallback)
  if (industryProfile) {
    console.log('[SmartTransformationGenerator] Strategy 3: Using industry baseline');
    const result = await generateFromIndustryBaseline(input, industryProfile, industryEQ);
    if (result.goals.length > 0) {
      return result;
    }
    console.warn('[SmartTransformationGenerator] Strategy 3 failed (no goals), falling back to Strategy 3.5');
  }

  // Strategy 3.5: Use services + website content (even without industry profile)
  if (input.services && input.services.length > 0) {
    console.log('[SmartTransformationGenerator] Strategy 3.5: Using services + website content (no industry profile)');
    const result = await generateFromServicesAndWebsite(input);
    if (result.goals.length > 0) {
      return result;
    }
    console.warn('[SmartTransformationGenerator] Strategy 3.5 failed (no goals), falling back to generic');
  }

  // Strategy 4: Generic fallback (last resort)
  console.log('[SmartTransformationGenerator] Strategy 4: Generic fallback');
  return await generateGenericTransformations(input);
}

/**
 * Strategy 1: Generate from website testimonials
 */
async function generateFromTestimonials(
  input: SmartTransformationInput,
  industryProfile: IndustryProfile | null,
  industryEQ: any
): Promise<SmartTransformationResult> {
  const prompt = buildTestimonialPrompt(input, industryProfile, industryEQ);
  const goals = await callClaudeForTransformations(prompt, input);

  return {
    goals,
    source: 'testimonials',
    confidence: 95,
    method: 'Extracted from website testimonials with industry context'
  };
}

/**
 * Strategy 2: Generate from industry profile + services
 */
async function generateFromIndustryAndServices(
  input: SmartTransformationInput,
  industryProfile: IndustryProfile,
  industryEQ: any
): Promise<SmartTransformationResult> {
  const prompt = buildIndustryServicesPrompt(input, industryProfile, industryEQ);
  const goals = await callClaudeForTransformations(prompt, input);

  return {
    goals,
    source: 'industry-services',
    confidence: 85,
    method: 'Generated from industry profile and extracted services'
  };
}

/**
 * Strategy 3: Generate from industry baseline
 */
async function generateFromIndustryBaseline(
  input: SmartTransformationInput,
  industryProfile: IndustryProfile,
  industryEQ: any
): Promise<SmartTransformationResult> {
  const prompt = buildIndustryBaselinePrompt(input, industryProfile, industryEQ);
  const goals = await callClaudeForTransformations(prompt, input);

  return {
    goals,
    source: 'industry-baseline',
    confidence: 70,
    method: 'Generated from industry baseline patterns'
  };
}

/**
 * Strategy 3.5: Generate from services + website content (no industry profile needed)
 */
async function generateFromServicesAndWebsite(
  input: SmartTransformationInput
): Promise<SmartTransformationResult> {
  const prompt = buildServicesWebsitePrompt(input);
  const goals = await callClaudeForTransformations(prompt, input);

  return {
    goals,
    source: 'industry-services',
    confidence: 70,
    method: 'Generated from services and website analysis'
  };
}

/**
 * Strategy 4: Generic fallback transformations (last resort)
 */
async function generateGenericTransformations(
  input: SmartTransformationInput
): Promise<SmartTransformationResult> {
  const prompt = buildGenericPrompt(input);
  const goals = await callClaudeForTransformations(prompt, input);

  return {
    goals,
    source: 'generated',
    confidence: 50,
    method: 'Generated from basic business information'
  };
}

/**
 * Build prompt for testimonial-based generation
 */
function buildTestimonialPrompt(
  input: SmartTransformationInput,
  industryProfile: IndustryProfile | null,
  industryEQ: any
): string {
  const eqRatio = industryEQ || { emotional: 50, rational: 50 };
  const testimonials = input.testimonials!.join('\n\n');

  // For bakeries/food services, need more segments to cover B2B and B2C
  const isBakery = input.industry?.toLowerCase().includes('bakery') ||
                   input.industry?.toLowerCase().includes('food') ||
                   input.industry?.toLowerCase().includes('cafe') ||
                   input.industry?.toLowerCase().includes('restaurant');

  return `You are analyzing transformation goals for "${input.businessName}", a ${input.industry || 'business'}.

TESTIMONIALS FROM WEBSITE:
${testimonials}

${industryProfile ? `
INDUSTRY CONTEXT:
Pain Points: ${industryProfile.commonPainPoints.join(', ')}
Decision Triggers: ${industryProfile.commonBuyingTriggers.join(', ')}
` : ''}

EMOTIONAL QUOTIENT TARGET: ${eqRatio.emotional}% emotional, ${eqRatio.rational}% rational

TASK:
Extract ${isBakery ? '6-8' : '3-5'} transformation goals from the testimonials. Each transformation should describe:
- BEFORE state: The problem/pain the customer had
- AFTER state: The transformation they achieved

Format as JSON with structured fields:
{
  "goals": [
    {
      "id": "trans-1",
      "who": "Customer segment from testimonial (1 sentence)",
      "before": "Problem/pain they had (from testimonial, 1-2 sentences)",
      "after": "Transformation achieved (from testimonial, 1-2 sentences)",
      "how": "Solution/service used (1-2 sentences)",
      "why": "Key benefit - MAX 10 WORDS",
      "emotionalDrivers": ["driver1", "driver2"],
      "functionalDrivers": ["driver1", "driver2"],
      "eqScore": { "emotional": 70, "rational": 30, "overall": 85 },
      "confidence": 95,
      "sources": ["testimonial"],
      "customerQuotes": ["relevant quote from testimonial"]
    }
  ]
}

Balance the emotional/rational language according to the EQ target.
Make transformations specific and compelling.`;
}

/**
 * Build prompt for industry + services generation (data-driven methodology with industry profile)
 */
function buildIndustryServicesPrompt(
  input: SmartTransformationInput,
  industryProfile: IndustryProfile,
  industryEQ: any
): string {
  const eqRatio = industryEQ || { emotional: 50, rational: 50 };
  const services = input.services!.map(s => `- ${s.name}: ${s.description || 'No description'}`).join('\n');
  const customers = input.customers?.map(c => `- ${c.statement}`).join('\n') || 'No buyer personas extracted';
  const testimonials = input.testimonials?.join('\n\n') || 'No testimonials available';

  // For bakeries/food services, need more segments to cover B2B and B2C
  const isBakery = input.industry?.toLowerCase().includes('bakery') ||
                   input.industry?.toLowerCase().includes('food') ||
                   input.industry?.toLowerCase().includes('cafe') ||
                   input.industry?.toLowerCase().includes('restaurant');

  return `You are generating customer transformation goals using a specific data-driven methodology. Follow this EXACT process:

AVAILABLE DATA INPUTS:
1. Industry Profile - Pain points, triggers, buyer psychology
2. EQ Score - ${eqRatio.emotional}% emotional, ${eqRatio.rational}% rational
3. Buyer Intelligence - Extracted customer personas
4. Products/Services - Actual offerings
5. Customer testimonials/quotes (if available)

SERVICES OFFERED:
${services}

BUYER PERSONAS (if extracted):
${customers}

CUSTOMER TESTIMONIALS (if available):
${testimonials}

INDUSTRY PROFILE DATA:

Pain Points (what customers struggle with):
${industryProfile.commonPainPoints.map(p => `- ${p}`).join('\n')}

Decision Triggers (what makes them buy):
${industryProfile.commonBuyingTriggers.map(t => `- ${t}`).join('\n')}

Psychology Profile:
- Decision Drivers: ${industryProfile.psychologyProfile.decisionDrivers.join(', ')}
- Primary Triggers: ${industryProfile.psychologyProfile.primaryTriggers.join(', ')}
- Urgency Level: ${industryProfile.psychologyProfile.urgencyLevel}
- Trust Importance: ${industryProfile.psychologyProfile.trustImportance}

METHODOLOGY - FOLLOW IN THIS ORDER:

LAYER 1: Industry Baseline
- Extract transformation patterns from industry pain points above
- Use psychologyProfile.decisionDrivers to understand core motivations
- Apply EQ score (${eqRatio.emotional}% emotional, ${eqRatio.rational}% rational) to determine language balance

LAYER 2: Personalization
- Cross-reference with extracted buyer personas
- Map EACH service to specific pain points from industry profile
- Incorporate actual testimonial language when available
- Use decision triggers to frame the "to" state

LAYER 3: Synthesis
Generate ${isBakery ? '8-10' : '4-6'} transformation goals where EACH:
- Maps to a detected service from the list above
- Addresses an industry pain point using customer's natural language
- Matches the ${eqRatio.emotional}% emotional / ${eqRatio.rational}% rational balance
- Uses decision drivers and triggers from psychology profile

${isBakery ? `
REQUIRED CUSTOMER SEGMENTS FOR BAKERY/FOOD:
Include transformations for EACH of these segments:
- Individual customers (daily treats, indulgence)
- Corporate/catering (office lunches, meetings, events)
- Celebrations/events (weddings, birthdays, custom orders)
- Regular customers (daily/weekly rituals)
- Dietary restrictions (gluten-free, vegan, allergies)
` : ''}

OUTPUT FORMAT (JSON) - Use structured fields for better AI parsing:
{
  "goals": [
    {
      "id": "trans-1",
      "who": "Specific customer segment from buyer personas (e.g., 'Busy professionals aged 30-45 with families')",
      "before": "Current pain/frustration from industry pain points (e.g., 'Feeling overwhelmed managing multiple home service vendors')",
      "after": "Desired outcome mapped to decision triggers (e.g., 'Have all home services coordinated seamlessly through one trusted provider')",
      "how": "Solution approach from actual services (e.g., 'Full-service home concierge managing all vendors and scheduling')",
      "why": "Emotional + functional benefit - MAX 10 WORDS (e.g., 'Peace of mind and 5+ hours saved monthly')",
      "emotionalDrivers": ["emotions from psychologyProfile.decisionDrivers", "max 3"],
      "functionalDrivers": ["practical benefits from actual service", "max 3"],
      "eqScore": { "emotional": ${eqRatio.emotional}, "rational": ${eqRatio.rational}, "overall": 85 },
      "confidence": 85,
      "sources": ["industry-profile", "service-analysis"],
      "customerQuotes": ["actual quote if available, otherwise empty array"]
    }
  ]
}

CRITICAL RULES:
1. Use customer's natural language for ${input.industry} (not generic business speak)
2. "From" state MUST use pain points from industry profile above
3. "To" state MUST reference actual services AND decision triggers
4. Emotional % MUST be ${eqRatio.emotional}% (not 50/50 or any other split)
5. Each transformation MUST map to an actual service offered
6. Use industry-appropriate language from psychologyProfile

INDUSTRY-SPECIFIC LANGUAGE EXAMPLES FOR ${input.industry}:
- Use words and phrases from the decisionDrivers list above
- Frame pain points using the primaryTriggers above
- Match the urgency level (${industryProfile.psychologyProfile.urgencyLevel}) in tone

Generate transformations that sound like how customers in ${input.industry} actually talk about their problems and desired outcomes.`;
}

/**
 * Build prompt for industry baseline generation
 */
function buildIndustryBaselinePrompt(
  input: SmartTransformationInput,
  industryProfile: IndustryProfile,
  industryEQ: any
): string {
  const eqRatio = industryEQ || { emotional: 50, rational: 50 };

  // For bakeries/food services, need more segments to cover B2B and B2C
  const isBakery = input.industry?.toLowerCase().includes('bakery') ||
                   input.industry?.toLowerCase().includes('food') ||
                   input.industry?.toLowerCase().includes('cafe') ||
                   input.industry?.toLowerCase().includes('restaurant');

  return `You are creating transformation goals for "${input.businessName}", a ${input.industry}.

INDUSTRY PAIN POINTS:
${industryProfile.commonPainPoints.join('\n')}

DECISION TRIGGERS:
${industryProfile.commonBuyingTriggers.join('\n')}

BUYER PSYCHOLOGY:
Decision Drivers: ${industryProfile.psychologyProfile.decisionDrivers.join(', ')}
Primary Triggers: ${industryProfile.psychologyProfile.primaryTriggers.join(', ')}
Urgency Level: ${industryProfile.psychologyProfile.urgencyLevel}
Trust Importance: ${industryProfile.psychologyProfile.trustImportance}

EMOTIONAL QUOTIENT TARGET: ${eqRatio.emotional}% emotional, ${eqRatio.rational}% rational

TASK:
Generate ${isBakery ? '6-8' : '3-5'} transformation goals based on common industry patterns. Each should address:
- A major industry pain point
- A common decision trigger
- The buyer psychology (fears, desires, objections)

Format as JSON with structured fields:
{
  "goals": [
    {
      "id": "trans-1",
      "who": "Target customer segment for this industry (1 sentence)",
      "before": "Industry pain point (1-2 sentences)",
      "after": "Desired state addressing decision trigger (1-2 sentences)",
      "how": "How ${input.businessName} solves this (1-2 sentences)",
      "why": "Key benefit - MAX 10 WORDS",
      "emotionalDrivers": ["fear/anxiety addressed"],
      "functionalDrivers": ["practical need met"],
      "eqScore": { "emotional": ${eqRatio.emotional}, "rational": ${eqRatio.rational}, "overall": 75 },
      "confidence": 70,
      "sources": ["industry-baseline"],
      "customerQuotes": []
    }
  ]
}

Use industry-standard language but make it specific to ${input.businessName}.`;
}

/**
 * Build prompt for services + website content (data-driven methodology)
 */
function buildServicesWebsitePrompt(input: SmartTransformationInput): string {
  const services = input.services!.map(s => `- ${s.name}${s.description ? `: ${s.description}` : ''}`).join('\n');
  const websiteContext = input.websiteParagraphs?.slice(0, 10).join('\n\n') || '';
  const testimonials = input.testimonials?.join('\n\n') || 'No testimonials available';
  const customers = input.customers?.map(c => `- ${c.statement}`).join('\n') || 'No buyer personas extracted';

  // For bakeries/food services, need more segments to cover B2B and B2C
  const isBakery = input.industry?.toLowerCase().includes('bakery') ||
                   input.industry?.toLowerCase().includes('food') ||
                   input.industry?.toLowerCase().includes('cafe') ||
                   input.industry?.toLowerCase().includes('restaurant');

  return `You are generating customer transformation goals using a specific data-driven methodology. Follow this EXACT process:

AVAILABLE DATA INPUTS:
1. Industry: ${input.industry || 'Not specified'}
2. Products/Services: What they actually offer
3. Website Content: Tone and messaging analysis
4. Customer testimonials/quotes (if available)
5. Buyer Personas: ${input.customers && input.customers.length > 0 ? 'Available' : 'Not available'}

SERVICES OFFERED:
${services}

BUYER PERSONAS (if extracted):
${customers}

CUSTOMER TESTIMONIALS (if available):
${testimonials}

WEBSITE CONTENT (for tone and context):
${websiteContext}

METHODOLOGY - FOLLOW IN THIS ORDER:

LAYER 1: Service Baseline
- Identify the core value proposition of each service
- Determine what customer problems each service solves
- Extract the emotional and functional benefits

LAYER 2: Personalization
- Cross-reference with buyer personas (if found)
- Map each service to specific pain points mentioned in testimonials
- Use actual customer language from website content
- Apply appropriate emotional/functional balance (60% emotional, 40% functional as default)

LAYER 3: Synthesis
Generate ${isBakery ? '6-8' : '3-5'} transformation goals where EACH:
- Maps to a specific detected service (use the exact service name)
- Addresses a pain point in the customer's natural language (not generic business speak)
- Matches emotional/functional balance
- Uses industry-appropriate language (how customers in THIS industry actually talk)

OUTPUT FORMAT (JSON) with structured fields:
{
  "goals": [
    {
      "id": "trans-1",
      "who": "Customer segment from personas (1 sentence in customer's language)",
      "before": "Specific pain in customer's natural language (1-2 sentences)",
      "after": "Desired outcome in customer's natural language (1-2 sentences)",
      "how": "Service/solution approach using exact service name (1-2 sentences)",
      "why": "Key benefit in customer language - MAX 10 WORDS",
      "emotionalDrivers": ["emotion from customer voice", "max 3 items"],
      "functionalDrivers": ["practical benefit from actual service", "max 3 items"],
      "eqScore": { "emotional": 60, "rational": 40, "overall": 70 },
      "confidence": 70,
      "sources": ["services", "website"],
      "customerQuotes": ["actual quote if available, otherwise empty array"]
    }
  ]
}

CRITICAL RULES:
1. Use the customer's natural language for ${input.industry || 'this industry'} (not generic business speak)
2. "Transform from/to" statements must be SPECIFIC to what ${input.businessName} offers
3. Each transformation MUST map to an actual service listed above
4. Use industry-specific pain language:
   - Real Estate: "drowning in offers" not "overwhelmed by options"
   - Financial Services: "worried about outliving savings" not "financial insecurity"
   - Healthcare: "afraid of the diagnosis" not "health concerns"
5. Pull emotional language from actual testimonials when available
6. DO NOT generate generic transformations that could apply to any ${input.industry || 'business'}

Generate transformations that sound like how ${input.businessName}'s actual customers talk about their problems and desired outcomes.`;
}

/**
 * Build generic fallback prompt (improved with all available data)
 */
function buildGenericPrompt(input: SmartTransformationInput): string {
  const services = input.services?.map(s => `- ${s.name}`).join('\n') || 'Services not specified';
  const websiteContext = input.websiteParagraphs?.slice(0, 5).join('\n') || 'No website content available';

  // For bakeries/food services, need more segments to cover B2B and B2C
  const isBakery = input.industry?.toLowerCase().includes('bakery') ||
                   input.industry?.toLowerCase().includes('food') ||
                   input.industry?.toLowerCase().includes('cafe') ||
                   input.industry?.toLowerCase().includes('restaurant');

  const goalCount = isBakery ? "6-8" : "3";

  return `Create ${goalCount} transformation goals for "${input.businessName}", a ${input.industry || 'business'}.

AVAILABLE SERVICES:
${services}

WEBSITE CONTEXT:
${websiteContext}

Each transformation should describe a journey from a problem state to a solution state, using the actual services and context above.

${isBakery ? `
IMPORTANT FOR BAKERY/FOOD BUSINESSES:
You MUST include transformations for ALL these customer segments:
1. Individual customers (daily treats, special occasions, indulgence)
2. Corporate/office catering (team lunches, meetings, impress colleagues)
3. Event customers (weddings, parties, celebrations)
4. Regular/loyal customers (daily rituals, weekly visits)
5. Dietary needs customers (gluten-free, vegan, allergies)
6. Seasonal/specialty customers (holidays, limited offerings)

Make sure to cover B2B (corporate catering) AND B2C segments!
` : ''}

Format as JSON with structured fields:
{
  "goals": [
    {
      "id": "trans-1",
      "who": "Target customer segment (1 sentence)",
      "before": "Current problem/pain (1-2 sentences)",
      "after": "Desired solution/outcome (1-2 sentences)",
      "how": "How business solves this (1-2 sentences)",
      "why": "Key benefit - MAX 10 WORDS",
      "emotionalDrivers": ["driver1"],
      "functionalDrivers": ["driver1"],
      "eqScore": { "emotional": 50, "rational": 50, "overall": 60 },
      "confidence": 50,
      "sources": ["generated"],
      "customerQuotes": []
    }
  ]
}`;
}

/**
 * Call Claude API to generate transformations
 */
async function callClaudeForTransformations(
  prompt: string,
  input: SmartTransformationInput
): Promise<TransformationGoal[]> {
  try {
    console.log('[SmartTransformationGenerator] Calling Claude API...');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('[SmartTransformationGenerator] Missing Supabase credentials');
      console.error('[SmartTransformationGenerator] SUPABASE_URL:', SUPABASE_URL ? 'defined' : 'undefined');
      console.error('[SmartTransformationGenerator] SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'defined' : 'undefined');
      return [];
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'openrouter',
        model: 'anthropic/claude-sonnet-4.5', // Switched from Opus 4.1 for faster generation
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 4096,
        temperature: 0.3
      })
    });

    console.log('[SmartTransformationGenerator] API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SmartTransformationGenerator] AI proxy error:', response.statusText);
      console.error('[SmartTransformationGenerator] Error body:', errorText);
      throw new Error(`AI proxy error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[SmartTransformationGenerator] API response received, parsing...');

    const responseText = data.choices?.[0]?.message?.content || '';
    console.log('[SmartTransformationGenerator] Response text length:', responseText.length);

    if (!responseText) {
      console.error('[SmartTransformationGenerator] Empty response from API');
      console.error('[SmartTransformationGenerator] Full response:', JSON.stringify(data, null, 2));
      return [];
    }

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*"goals"[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[SmartTransformationGenerator] No JSON found in response');
      console.error('[SmartTransformationGenerator] Response text:', responseText.substring(0, 500));
      return [];
    }

    console.log('[SmartTransformationGenerator] JSON found, parsing...');

    // Sanitize JSON: replace undefined with null (Claude sometimes outputs invalid JSON)
    const sanitizedJson = jsonMatch[0].replace(/:\s*undefined\s*([,}])/g, ': null$1');

    const parsed = JSON.parse(sanitizedJson);

    if (!parsed.goals || !Array.isArray(parsed.goals)) {
      console.error('[SmartTransformationGenerator] Invalid goals format:', parsed);
      return [];
    }

    const goals: TransformationGoal[] = parsed.goals.map((g: any) => ({
      id: g.id || `trans-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      statement: g.statement || '',  // Keep for backward compatibility
      who: g.who,
      before: g.before,
      after: g.after,
      how: g.how,
      why: g.why,
      emotionalDrivers: g.emotionalDrivers || [],
      functionalDrivers: g.functionalDrivers || [],
      eqScore: g.eqScore || { emotional: 50, rational: 50, overall: 60 },
      confidence: g.confidence || 50,
      sources: g.sources || [],
      customerQuotes: g.customerQuotes || [],
      isManualInput: false
    }));

    console.log('[SmartTransformationGenerator] Generated', goals.length, 'goals');
    console.log('[SmartTransformationGenerator] Goals:', goals.map(g => g.statement));

    // NOTE: JTBD transformation is now handled by the orchestrator in Phase 2
    // to avoid blocking parallel extraction. Don't call JTBD here.

    return goals;
  } catch (error) {
    console.error('[SmartTransformationGenerator] Claude API error:', error);
    console.error('[SmartTransformationGenerator] Error details:', error instanceof Error ? error.message : String(error));
    console.error('[SmartTransformationGenerator] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return [];
  }
}
