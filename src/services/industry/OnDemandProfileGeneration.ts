/**
 * ON-DEMAND INDUSTRY PROFILE GENERATION
 *
 * Generates full 40-field profiles on-demand when user selects
 * an industry that doesn't have a pre-generated profile yet.
 *
 * Uses the master Opus template for consistency.
 */

import { supabase } from '@/lib/supabase';

export interface GenerationProgress {
  stage: string;
  progress: number;
  message: string;
  estimatedTimeRemaining: number; // seconds
}

export type ProgressCallback = (progress: GenerationProgress) => void;

/**
 * MASTER TEMPLATE - All 40 fields
 */
const MASTER_TEMPLATE_PROMPT = `Generate a comprehensive industry profile for {INDUSTRY_NAME} (NAICS: {NAICS_CODE}).

This profile will be used to power AI-driven marketing message generation for SMBs in this industry.

Generate ALL 40 fields with rich, actionable data:

## CORE IDENTIFICATION (5 fields)
1. industry: {INDUSTRY_NAME}
2. industry_name: {INDUSTRY_NAME}
3. naics_code: {NAICS_CODE}
4. category: [Determine primary category]
5. subcategory: [Determine subcategory if applicable]

## CUSTOMER PSYCHOLOGY & TRIGGERS (8 fields)
**CRITICAL: All of these are from the perspective of the END CUSTOMER (the person/business buying from this industry), NOT the business owner**

6. customer_triggers: [10+ specific situations that make END CUSTOMERS urgently need to buy from businesses in this industry]
   Example for Food Truck: "Last-minute event catering need", "Want to impress party guests", "Office lunch monotony"

7. customer_journey: [Detailed map of how END CUSTOMERS go from awareness to purchase to advocacy]

8. transformations: [10+ emotional before→after transformations that END CUSTOMERS experience when buying from this industry]
   Example for Food Truck: "From 'my event will have boring catering' → 'I look like a hero who found this amazing food'", "From 'stressed about party planning' → 'confident my guests will love this'"

9. success_metrics: [10+ ways END CUSTOMERS measure if their purchase was successful]
   Example for Food Truck: "Guests asking where I found the caterer", "Event went smoothly", "Instagram-worthy food"

10. urgency_drivers: [10+ factors that make END CUSTOMERS need to buy RIGHT NOW]

11. objection_handlers: [10+ common objections END CUSTOMERS have with proven responses]

12. risk_reversal: [Guarantees, warranties, and risk-reduction strategies that make END CUSTOMERS feel safe buying]

13. customer_language_dictionary: [50+ phrases/terms END CUSTOMERS actually use when describing their needs, problems, and desired outcomes]

## VALUE PROPOSITION & DIFFERENTIATION (7 fields)
14. value_propositions: [10+ unique value propositions ranked by impact]
15. differentiators: [10+ ways businesses in this industry differentiate]
16. competitive_advantages: [Sustainable advantages businesses can build]
17. pricing_strategies: [Common pricing models and positioning strategies]
18. service_delivery_models: [How service is typically delivered]
19. unique_selling_propositions: [Template USPs for different market positions]
20. brand_positioning_templates: [Pre-built positioning strategies]

## MESSAGING & COMMUNICATION (9 fields)
21. power_words: [50+ high-converting words for this industry]
22. avoid_words: [20+ words to avoid - clichés, jargon, red flags]
23. headline_templates: [20+ proven headline formulas]
24. call_to_action_templates: [15+ CTAs optimized for different stages]
25. email_subject_line_templates: [20+ subject line formulas]
26. social_media_hooks: [30+ attention-grabbing opening hooks]
27. pain_point_language: [How to articulate pain points authentically]
28. solution_language: [How to present solutions compellingly]
29. proof_point_frameworks: [How to structure credibility elements]

## MARKET INTELLIGENCE (6 fields)
30. seasonal_patterns: [How demand fluctuates throughout the year]
31. geographic_variations: [Regional differences in service needs]
32. demographic_insights: [Target customer demographic patterns]
33. psychographic_profiles: [Mindset and values of ideal customers]
34. market_trends: [Current and emerging trends affecting this industry]
35. innovation_opportunities: [Where this industry is evolving]

## OPERATIONAL CONTEXT (5 fields)
36. typical_business_models: [Common ways businesses in this industry operate]
37. common_challenges: [Top operational challenges these businesses face]
38. growth_strategies: [Proven paths to scaling in this industry]
39. technology_stack_recommendations: [Tools/platforms commonly used]
40. industry_associations_resources: [Professional organizations, certifications, resources]

For each field, provide:
- DEPTH: Not generic advice - specific, actionable insights
- QUANTITY: Hit or exceed target counts (e.g., "10+ triggers" means give 12-15)
- QUALITY: Based on real market research, customer behavior, industry analysis
- USABILITY: Written to be directly used in marketing message generation

Return as valid JSON with all 40 fields populated.`;

export class OnDemandProfileGenerator {
  /**
   * Generate a full profile on-demand
   */
  static async generateProfile(
    industryName: string,
    naicsCode: string,
    onProgress?: ProgressCallback
  ): Promise<any> {
    console.log(`[OnDemand] Starting generation for: ${industryName} (${naicsCode})`);

    // Stage 1: Initial Research
    onProgress?.({
      stage: 'research',
      progress: 10,
      message: `Researching ${industryName} industry...`,
      estimatedTimeRemaining: 180
    });

    await this.sleep(2000);

    // Stage 2: Customer Psychology Analysis
    onProgress?.({
      stage: 'psychology',
      progress: 25,
      message: 'Analyzing customer psychology and triggers...',
      estimatedTimeRemaining: 150
    });

    await this.sleep(2000);

    // Stage 3: Market Intelligence Gathering
    onProgress?.({
      stage: 'market',
      progress: 40,
      message: 'Gathering market intelligence and trends...',
      estimatedTimeRemaining: 120
    });

    await this.sleep(2000);

    // Stage 4: Messaging Framework Development
    onProgress?.({
      stage: 'messaging',
      progress: 55,
      message: 'Developing messaging frameworks and templates...',
      estimatedTimeRemaining: 90
    });

    await this.sleep(1000);

    // Stage 5: AI Profile Generation
    onProgress?.({
      stage: 'generating',
      progress: 60,
      message: 'Generating comprehensive profile with AI...',
      estimatedTimeRemaining: 75
    });

    // Make the actual API call
    const prompt = MASTER_TEMPLATE_PROMPT
      .replace(/{INDUSTRY_NAME}/g, industryName)
      .replace(/{NAICS_CODE}/g, naicsCode);

    let profile;
    try {
      profile = await this.callOpusAPI(prompt, (apiProgress) => {
        // Map API progress to overall progress (60% to 90%)
        const overallProgress = 60 + (apiProgress * 0.3);
        onProgress?.({
          stage: 'generating',
          progress: overallProgress,
          message: 'AI is analyzing industry patterns and customer psychology...',
          estimatedTimeRemaining: Math.max(10, 60 * (1 - apiProgress))
        });
      });
    } catch (error) {
      console.error('[OnDemand] API call failed, will throw after updating progress');
      // Update progress to show we reached this stage before failing
      onProgress?.({
        stage: 'error',
        progress: 90,
        message: 'Profile generation encountered an error',
        estimatedTimeRemaining: 0
      });
      throw error; // Re-throw to be handled by caller
    }

    // Stage 6: Validation & Storage
    onProgress?.({
      stage: 'saving',
      progress: 92,
      message: 'Validating and saving profile to database...',
      estimatedTimeRemaining: 8
    });

    // Store in Supabase
    try {
      await this.saveProfile(profile, naicsCode);
    } catch (error) {
      console.error('[OnDemand] Failed to save profile, but continuing');
      // Don't throw - we have the profile even if save failed
    }

    // Complete
    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Profile generation complete!',
      estimatedTimeRemaining: 0
    });

    console.log(`[OnDemand] Generation complete for: ${industryName}`);

    return profile;
  }

  /**
   * Call Opus API for profile generation
   */
  private static async callOpusAPI(
    prompt: string,
    onProgress?: (progress: number) => void
  ): Promise<any> {
    const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

    // Simulate progress during API call
    const progressInterval = setInterval(() => {
      const currentProgress = Math.random() * 0.2 + 0.3; // 30-50%
      onProgress?.(currentProgress);
    }, 3000);

    try {
      console.log('[OnDemand] ===== STARTING API CALL =====');
      console.log('[OnDemand] API Key present:', !!OPENROUTER_API_KEY);
      console.log('[OnDemand] API Key length:', OPENROUTER_API_KEY?.length);
      console.log('[OnDemand] Prompt length:', prompt.length);

      const requestBody = {
        model: 'anthropic/claude-opus-4.1', // OPUS 4.1 - ALWAYS USE OPUS FOR ONBOARDING
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 16000
      };

      console.log('[OnDemand] Request body:', JSON.stringify(requestBody, null, 2).substring(0, 500));
      console.log('[OnDemand] Making fetch request to OpenRouter...');

      const fetchStartTime = Date.now();

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'BranDock Industry Profile Generator'
        },
        body: JSON.stringify(requestBody)
      });

      const fetchDuration = Date.now() - fetchStartTime;
      console.log('[OnDemand] Fetch completed in', fetchDuration, 'ms');
      console.log('[OnDemand] Response status:', response.status);
      console.log('[OnDemand] Response statusText:', response.statusText);
      console.log('[OnDemand] Response headers:', Object.fromEntries(response.headers.entries()));

      clearInterval(progressInterval);
      onProgress?.(0.9);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[OnDemand] API error response body:', errorText);
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Read response as text FIRST (more reliable than .json() for large responses)
      console.log('[OnDemand] Reading response as text...');
      let textResponse: string;
      let data;

      try {
        // Create timeout for reading text (30 seconds)
        const textTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Reading response text timed out after 30 seconds')), 30000)
        );

        const textReadStartTime = Date.now();
        textResponse = await Promise.race([
          response.text(),
          textTimeout
        ]);

        const textReadDuration = Date.now() - textReadStartTime;
        console.log('[OnDemand] Text read successfully in', textReadDuration, 'ms');
        console.log('[OnDemand] Response length:', textResponse.length, 'characters');
        console.log('[OnDemand] Response preview (first 200 chars):', textResponse.substring(0, 200));

        // Now parse the text as JSON (this is typically fast)
        console.log('[OnDemand] Parsing text as JSON...');
        const jsonParseStartTime = Date.now();
        data = JSON.parse(textResponse);
        const jsonParseDuration = Date.now() - jsonParseStartTime;
        console.log('[OnDemand] JSON parsed successfully in', jsonParseDuration, 'ms');
        console.log('[OnDemand] Response data keys:', Object.keys(data));

      } catch (error) {
        console.error('[OnDemand] Failed to read/parse response:', error);

        if (textResponse) {
          console.error('[OnDemand] Raw response length:', textResponse.length);
          console.error('[OnDemand] Raw response (first 1000 chars):', textResponse.substring(0, 1000));
          console.error('[OnDemand] Raw response (last 500 chars):', textResponse.substring(Math.max(0, textResponse.length - 500)));
        }

        throw new Error(`Failed to parse API response: ${error instanceof Error ? error.message : String(error)}`);
      }

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('[OnDemand] Invalid API response structure:', data);
        throw new Error('Invalid API response structure');
      }

      const content = data.choices[0].message.content;
      console.log('[OnDemand] Content length:', content.length);

      // Parse JSON from response - try multiple approaches
      let profile;

      // Try 1: Extract from JSON code block
      const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch) {
        console.log('[OnDemand] Found JSON code block');
        try {
          profile = JSON.parse(jsonBlockMatch[1]);
          console.log('[OnDemand] Successfully parsed JSON from code block');
        } catch (e) {
          console.warn('[OnDemand] Failed to parse JSON block:', e);
        }
      }

      // Try 2: Extract raw JSON object
      if (!profile) {
        const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          console.log('[OnDemand] Found JSON object');
          try {
            profile = JSON.parse(jsonObjectMatch[0]);
            console.log('[OnDemand] Successfully parsed raw JSON object');
          } catch (e) {
            console.warn('[OnDemand] Failed to parse raw JSON:', e);

            // Try 3: Clean up common JSON errors and retry
            try {
              console.log('[OnDemand] Attempting to clean and re-parse JSON...');
              let cleaned = jsonObjectMatch[0]
                .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
                .replace(/\n/g, ' ')            // Remove newlines
                .replace(/\r/g, '');            // Remove carriage returns

              profile = JSON.parse(cleaned);
              console.log('[OnDemand] Successfully parsed cleaned JSON');
            } catch (e2) {
              console.error('[OnDemand] All JSON parsing attempts failed');
              console.error('[OnDemand] Raw content preview:', content.substring(0, 500));
              throw new Error(`Failed to parse JSON response after multiple attempts: ${e2}`);
            }
          }
        }
      }

      if (!profile) {
        console.error('[OnDemand] No JSON found in response');
        console.error('[OnDemand] Content preview:', content.substring(0, 500));
        throw new Error('No valid JSON found in API response');
      }

      onProgress?.(1.0);
      console.log('[OnDemand] Profile generation complete');

      return profile;

    } catch (error) {
      clearInterval(progressInterval);
      console.error('[OnDemand] Opus API error:', error);

      // Log more details about the error
      if (error instanceof Error) {
        console.error('[OnDemand] Error message:', error.message);
        console.error('[OnDemand] Error stack:', error.stack);

        // Check if it's an abort error (timeout)
        if (error.name === 'AbortError') {
          throw new Error('API request timed out after 3 minutes. Please try again.');
        }
      }

      throw error;
    }
  }

  /**
   * Save generated profile to Supabase
   */
  private static async saveProfile(profile: any, naicsCode: string): Promise<void> {
    console.log('[OnDemand] Attempting to save profile for NAICS:', naicsCode);
    console.log('[OnDemand] Profile keys:', Object.keys(profile));

    const { data, error } = await supabase
      .from('industry_profiles')
      .upsert({
        ...profile,
        naics_code: naicsCode,
        generated_on_demand: true,
        generated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('[OnDemand] Failed to save profile');
      console.error('[OnDemand] Error code:', error.code);
      console.error('[OnDemand] Error message:', error.message);
      console.error('[OnDemand] Error details:', error.details);
      console.error('[OnDemand] Error hint:', error.hint);
      console.error('[OnDemand] Full error object:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('[OnDemand] Profile saved successfully');
    console.log('[OnDemand] Saved data:', data);
  }

  /**
   * Check if profile exists in cache
   */
  static async checkCachedProfile(naicsCode: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('industry_profiles')
      .select('*')
      .eq('naics_code', naicsCode)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
