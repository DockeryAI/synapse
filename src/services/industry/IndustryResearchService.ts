/**
 * ============================================================================
 * INDUSTRY RESEARCH SERVICE - DEEP CONSULTANT-LEVEL ANALYSIS
 * ============================================================================
 *
 * Conducts comprehensive multi-phase research on industries like a consultant would.
 * First time: 2-3 minutes of deep research.
 * Subsequent uses: Instant from cache.
 *
 * RESEARCH PHASES (6 phases):
 * 1. Customer Psychology & Behavior
 * 2. Business Model & Economics
 * 3. Competitive Landscape
 * 4. Success Patterns & Best Practices
 * 5. Marketing Intelligence
 * 6. Calibration & Strategy
 *
 * Each phase builds on the last, creating a comprehensive industry profile.
 */

import { llmService } from '../llm/LLMService';
import { supabase } from '../../utils/supabase/client';
import type { IndustryProfileV3 } from '../../types/onboarding-v3.types';
import type { IndustryDetection } from './IndustryDetectionService';
import { getNAICSCode, getNAICSHierarchy } from '../../data/naics-codes';

export interface ResearchProgress {
  jobId: string;
  industryCode: string;
  status: 'queued' | 'analyzing' | 'complete' | 'failed';
  currentPhase: string;
  progressPercent: number;
  phasesCompleted: string[];
  totalPhases: number;
}

export type ProgressCallback = (progress: ResearchProgress) => void;

export interface ResearchResult {
  profile: IndustryProfileV3;
  researchQuality: number; // 0-1 score
  researchTime: number; // milliseconds
  model: string; // Which LLM was used
  wasFallback: boolean; // If GPT-4 fallback was used
}

interface ResearchJobContext {
  jobId: string;
  industryCode: string;
  brandId?: string;
  triggeredBy: 'onboarding' | 'manual' | 'scheduled_refresh';
}

export class IndustryResearchService {
  private readonly RESEARCH_PHASES = [
    'Customer Psychology & Behavior',
    'Business Model & Economics',
    'Competitive Landscape',
    'Success Patterns & Best Practices',
    'Marketing Intelligence',
    'Calibration & Strategy',
  ];

  // In-memory caching (database-optional)
  private profileCache: Map<string, ResearchResult> = new Map(); // Completed research results
  private activeResearch: Map<string, ResearchProgress> = new Map(); // Progress tracking
  private progressCallbacks: Map<string, ProgressCallback[]> = new Map(); // Callbacks

  /**
   * Subscribe to progress updates for an industry
   */
  subscribeToProgress(industryCode: string, callback: ProgressCallback): () => void {
    const callbacks = this.progressCallbacks.get(industryCode) || [];
    callbacks.push(callback);
    this.progressCallbacks.set(industryCode, callbacks);

    // Return unsubscribe function
    return () => {
      const cbs = this.progressCallbacks.get(industryCode) || [];
      const index = cbs.indexOf(callback);
      if (index > -1) {
        cbs.splice(index, 1);
      }
    };
  }

  /**
   * Emit progress update to all subscribers
   */
  private emitProgress(industryCode: string, progress: ResearchProgress): void {
    // Update in-memory store
    this.activeResearch.set(industryCode, progress);

    // Notify all callbacks
    const callbacks = this.progressCallbacks.get(industryCode) || [];
    callbacks.forEach(cb => cb(progress));
  }

  /**
   * MAIN ENTRY POINT - Get industry profile (from cache or research)
   * NOW SUPPORTS SUB-INDUSTRY NAICS-BASED DETECTION
   */
  async getOrResearchIndustry(
    industryDetectionOrCode: IndustryDetection | string,
    websiteData?: any,
    brandId?: string,
    forceRefresh: boolean = false,
    onProgress?: (phase: string, percent: number) => void
  ): Promise<ResearchResult> {
    // Convert to IndustryDetection if string provided (backward compatibility)
    const industryDetection: IndustryDetection = typeof industryDetectionOrCode === 'string'
      ? {
          primaryNAICS: industryDetectionOrCode,
          industryChain: [industryDetectionOrCode],
          customerLanguage: industryDetectionOrCode,
          confidence: 0.5,
          detectionMethod: 'keyword'
        }
      : industryDetectionOrCode;

    const primaryCode = industryDetection.primaryNAICS;
    console.log(`[IndustryResearch] Getting profile for: ${industryDetection.customerLanguage} (${primaryCode})`);

    // Check cache first (unless force refresh) - try hierarchy from specific to general
    if (!forceRefresh) {
      const cached = await this.getFromCacheHierarchy(industryDetection.industryChain);
      if (cached) {
        console.log(`[IndustryResearch] Cache hit in hierarchy`);

        // If we found a parent profile but user has specific sub-industry, enhance it
        if (cached.profile.industryCode !== primaryCode && websiteData) {
          return await this.enhanceWithSubIndustry(cached, industryDetection, websiteData);
        }

        return cached;
      }
    }

    // Not in cache - conduct research
    console.log(`[IndustryResearch] Cache miss - conducting research for ${primaryCode}`);
    return this.conductResearch(industryDetection, websiteData, {
      triggeredBy: brandId ? 'onboarding' : 'manual',
      brandId,
    }, onProgress);
  }

  /**
   * NEW: Check cache at multiple levels of hierarchy
   * Try most specific first, fall back to parent levels
   */
  private async getFromCacheHierarchy(industryChain: string[]): Promise<ResearchResult | null> {
    // Try from most specific to least specific
    for (let i = industryChain.length - 1; i >= 0; i--) {
      const code = industryChain[i];
      const cached = await this.getFromCache(code);
      if (cached) {
        console.log(`[IndustryResearch] Found cached profile at level ${i + 1}/${industryChain.length}: ${code}`);
        return cached;
      }
    }
    return null;
  }

  /**
   * NEW: Enhance parent profile with sub-industry specifics
   */
  private async enhanceWithSubIndustry(
    parentResult: ResearchResult,
    industryDetection: IndustryDetection,
    websiteData: any
  ): Promise<ResearchResult> {
    console.log(`[IndustryResearch] Enhancing parent profile for sub-industry: ${industryDetection.customerLanguage}`);

    const naicsInfo = getNAICSCode(industryDetection.primaryNAICS);
    const parentNAICS = getNAICSCode(parentResult.profile.industryCode);

    // Create enhancement prompt
    const prompt = `You are enhancing an industry profile for a SPECIFIC sub-industry.

PARENT INDUSTRY: ${parentNAICS?.title || parentResult.profile.displayName}
SUB-INDUSTRY: ${naicsInfo?.title || industryDetection.customerLanguage}
CUSTOMER LANGUAGE: "${industryDetection.customerLanguage}"

BUSINESS DATA:
${JSON.stringify(websiteData, null, 2).substring(0, 1000)}

TASK: Provide SUB-INDUSTRY SPECIFIC enhancements to the parent profile.

IMPORTANT: A "${industryDetection.customerLanguage}" is VERY DIFFERENT from a generic "${parentResult.profile.displayName}".
For example, a Construction Consultant focuses on construction projects, risk management, contractor relationships.
A Software Consultant focuses on technology, digital transformation, development processes.

Provide 3-5 sub-industry specific insights:
1. How customer psychology differs for this sub-industry
2. Unique pain points specific to this niche
3. Specialized language and terminology
4. Sub-industry specific success factors
5. Different competitive dynamics

RESPOND WITH ONLY VALID JSON:
{
  "subIndustryInsights": {
    "customerPsychologyDifferences": "How customers differ in this sub-industry",
    "uniquePainPoints": ["Pain 1", "Pain 2", "Pain 3"],
    "specializedLanguage": ["Term 1", "Term 2", "Term 3"],
    "successFactors": ["Factor 1", "Factor 2"],
    "competitiveDifferences": "How competition differs"
  },
  "calibrationAdjustments": {
    "emotionalLevel": 0.5,
    "formalityLevel": 0.5,
    "urgencyLevel": 0.5,
    "primaryValueDrivers": ["value1", "value2", "value3"],
    "powerWords": ["word1", "word2", "word3"],
    "reasoning": "Why these adjustments for this sub-industry"
  }
}`;

    try {
      const response = await llmService.research(prompt, { industryCode: industryDetection.primaryNAICS });
      const enhancements = this.parseResearchResponse(response.content, 'Industry Learning Enhancement');

      // Merge enhancements into profile
      const enhancedProfile: IndustryProfileV3 = {
        ...parentResult.profile,
        industryCode: industryDetection.primaryNAICS,
        displayName: industryDetection.customerLanguage,
        commonNames: [
          industryDetection.customerLanguage,
          industryDetection.customerLanguage.toLowerCase(),
          ...parentResult.profile.commonNames
        ],
        calibration: {
          ...parentResult.profile.calibration,
          ...enhancements.calibrationAdjustments,
          subIndustryInsights: enhancements.subIndustryInsights
        }
      };

      const enhancedResult: ResearchResult = {
        ...parentResult,
        profile: enhancedProfile,
        researchQuality: parentResult.researchQuality * 0.9, // Slight reduction for enhanced vs full research
      };

      // Cache the enhanced profile
      this.profileCache.set(industryDetection.primaryNAICS, enhancedResult);

      return enhancedResult;
    } catch (error) {
      console.error('[IndustryResearch] Enhancement failed, returning parent profile:', error);
      return parentResult;
    }
  }

  /**
   * CONDUCT COMPREHENSIVE RESEARCH (2-3 minutes)
   * NOW USES CUSTOMER LANGUAGE AND SUB-INDUSTRY AWARENESS
   */
  private async conductResearch(
    industryDetection: IndustryDetection,
    websiteData: any,
    options: {
      triggeredBy: 'onboarding' | 'manual' | 'scheduled_refresh';
      brandId?: string;
    },
    onProgress?: (phase: string, percent: number) => void
  ): Promise<ResearchResult> {
    const startTime = Date.now();
    const industryCode = industryDetection.primaryNAICS;
    const customerLanguage = industryDetection.customerLanguage;

    console.log(`[IndustryResearch] Conducting research for: "${customerLanguage}" (${industryCode})`);

    // Create research job for tracking
    const job = await this.createResearchJob(industryCode, options);

    try {
      const phasesCompleted: string[] = [];

      // Phase 1: Customer Psychology & Behavior
      this.updateJobProgress(job.jobId, industryCode, this.RESEARCH_PHASES[0], 10, phasesCompleted);
      onProgress?.(this.RESEARCH_PHASES[0], 10);
      const customerResearch = await this.researchCustomerPsychology(customerLanguage, industryCode);
      phasesCompleted.push(this.RESEARCH_PHASES[0]);

      // Phase 2: Business Model & Economics
      this.updateJobProgress(job.jobId, industryCode, this.RESEARCH_PHASES[1], 25, phasesCompleted);
      onProgress?.(this.RESEARCH_PHASES[1], 25);
      const businessModelResearch = await this.researchBusinessModel(
        customerLanguage,
        industryCode,
        customerResearch
      );
      phasesCompleted.push(this.RESEARCH_PHASES[1]);

      // Phase 3: Competitive Landscape
      this.updateJobProgress(job.jobId, industryCode, this.RESEARCH_PHASES[2], 40, phasesCompleted);
      onProgress?.(this.RESEARCH_PHASES[2], 40);
      const competitiveResearch = await this.researchCompetitiveLandscape(
        customerLanguage,
        industryCode,
        customerResearch,
        businessModelResearch
      );
      phasesCompleted.push(this.RESEARCH_PHASES[2]);

      // Phase 4: Success Patterns & Best Practices
      this.updateJobProgress(job.jobId, industryCode, this.RESEARCH_PHASES[3], 55, phasesCompleted);
      onProgress?.(this.RESEARCH_PHASES[3], 55);
      const successPatterns = await this.researchSuccessPatterns(
        customerLanguage,
        industryCode,
        customerResearch,
        competitiveResearch
      );
      phasesCompleted.push(this.RESEARCH_PHASES[3]);

      // Phase 5: Marketing Intelligence
      this.updateJobProgress(job.jobId, industryCode, this.RESEARCH_PHASES[4], 75, phasesCompleted);
      onProgress?.(this.RESEARCH_PHASES[4], 75);
      const marketingIntelligence = await this.researchMarketingIntelligence(
        customerLanguage,
        industryCode,
        customerResearch,
        successPatterns
      );
      phasesCompleted.push(this.RESEARCH_PHASES[4]);

      // Phase 6: Calibration & Strategy Synthesis
      this.updateJobProgress(job.jobId, industryCode, this.RESEARCH_PHASES[5], 90, phasesCompleted);
      onProgress?.(this.RESEARCH_PHASES[5], 90);
      const calibration = await this.generateCalibration(customerLanguage, industryCode, {
        customerResearch,
        businessModelResearch,
        competitiveResearch,
        successPatterns,
        marketingIntelligence,
      });
      phasesCompleted.push(this.RESEARCH_PHASES[5]);

      // Synthesize into complete profile
      const profile = this.synthesizeProfile(industryDetection, {
        customerResearch,
        businessModelResearch,
        competitiveResearch,
        successPatterns,
        marketingIntelligence,
        calibration,
      });

      // Calculate research quality score
      const researchQuality = this.calculateQualityScore(profile);

      const researchTime = Date.now() - startTime;

      console.log(
        `[IndustryResearch] Research complete for ${industryCode} in ${(researchTime / 1000).toFixed(1)}s (quality: ${researchQuality.toFixed(2)})`
      );

      // Create result object
      const result: ResearchResult = {
        profile,
        researchQuality,
        researchTime,
        model: 'anthropic/claude-3.5-sonnet', // Primary model
        wasFallback: false, // Would be true if GPT-4 was used
      };

      // CRITICAL: Store in cache BEFORE emitting complete status
      // This prevents race condition where UI reacts before cache is populated
      this.profileCache.set(industryCode, result);
      console.log(`[IndustryResearch] Stored ${industryCode} in in-memory cache`);

      // Store in database (fire and forget)
      await this.saveToDatabase(industryCode, profile, {
        researchQuality,
        jobId: job.jobId,
      });

      // Emit complete status (UI will react to this immediately)
      await this.completeResearchJob(job.jobId, industryCode, 'complete');

      return result;
    } catch (error: any) {
      console.error(`[IndustryResearch] Research failed for ${industryCode}:`, error);

      // Mark job as failed
      await this.completeResearchJob(job.jobId, industryCode, 'failed', error.message);

      throw new Error(`Industry research failed: ${error.message}`);
    }
  }

  /**
   * PHASE 1: Customer Psychology & Behavior
   * NOW USES CUSTOMER LANGUAGE for sub-industry precision
   */
  private async researchCustomerPsychology(customerLanguage: string, industryCode: string): Promise<any> {
    const prompt = `You are an expert market researcher analyzing the "${customerLanguage}" industry.

IMPORTANT: "${customerLanguage}" is a SPECIFIC type of business, not a generic category.
Focus your research on the unique characteristics of "${customerLanguage}" businesses specifically.

TASK: Provide deep insights into customer psychology and behavior for this industry.

ANALYZE:
1. **Customer Segments**: Who are the typical customers? (B2C and B2B if applicable)
2. **Pain Points**: What problems keep them up at night?
3. **Goals & Desires**: What do they ultimately want to achieve?
4. **Decision Factors**: How do they choose between providers?
5. **Emotional Triggers**: What emotions drive their decisions? (fear, aspiration, trust, urgency, etc.)
6. **Customer Journey**: What's the typical path from awareness to purchase?
7. **Objections & Hesitations**: What makes them hesitate or say no?

RESPOND WITH ONLY VALID JSON in this exact structure:
{
  "segments": {
    "b2c": [
      {
        "name": "Segment name",
        "description": "Who they are",
        "demographics": "Age, income, location, etc.",
        "psychographics": "Values, lifestyle, preferences",
        "painPoints": ["Pain 1", "Pain 2", "Pain 3"],
        "goals": ["Goal 1", "Goal 2", "Goal 3"],
        "decisionFactors": ["Factor 1", "Factor 2", "Factor 3"],
        "emotionalTriggers": ["Emotion 1", "Emotion 2"],
        "typicalJourney": "Awareness → Consideration → Decision path",
        "commonObjections": ["Objection 1", "Objection 2"]
      }
    ],
    "b2b": []
  },
  "insights": {
    "primaryMotivation": "What fundamentally drives purchase decisions",
    "trustBuilders": ["What builds credibility in this industry"],
    "dealBreakers": ["What causes customers to walk away"],
    "seasonalBehavior": "How customer behavior changes throughout the year"
  }
}`;

    const response = await llmService.research(prompt, { industryCode });
    return this.parseResearchResponse(response.content, 'Customer Psychology');
  }

  /**
   * PHASE 2: Business Model & Economics
   */
  private async researchBusinessModel(
    customerLanguage: string,
    industryCode: string,
    customerResearch: any
  ): Promise<any> {
    const prompt = `You are an expert business analyst analyzing the "${customerLanguage}" industry.

IMPORTANT: Focus on "${customerLanguage}" businesses specifically, not generic industry analysis.

CONTEXT: You've already researched customer psychology. Now analyze business models.

CUSTOMER INSIGHTS:
${JSON.stringify(customerResearch.segments, null, 2)}

TASK: Analyze typical business models and economics for this industry.

ANALYZE:
1. **Revenue Models**: How do businesses in this industry make money?
2. **Pricing Structures**: Common pricing models (hourly, project, subscription, etc.)
3. **Unit Economics**: Typical margins, costs, customer lifetime value
4. **Growth Levers**: What drives business growth?
5. **Operational Model**: How the business actually operates
6. **Service/Product Mix**: What do successful businesses offer?

RESPOND WITH ONLY VALID JSON:
{
  "revenueModels": [
    {
      "model": "Model name (e.g., Service-based, Product sales, Subscription)",
      "description": "How it works",
      "prevalence": "How common (very common, common, niche)",
      "margins": "Typical margins or profitability"
    }
  ],
  "pricingStructures": [
    {
      "structure": "Pricing model name",
      "description": "How pricing works",
      "customerPreference": "How customers feel about this model"
    }
  ],
  "unitEconomics": {
    "avgTransactionValue": "Typical sale amount",
    "acquisitionCost": "Typical customer acquisition cost",
    "lifetime value": "Customer lifetime value",
    "margins": "Typical profit margins"
  },
  "growthLevers": ["Lever 1", "Lever 2", "Lever 3"],
  "operationalModel": {
    "staffing": "Typical staffing model",
    "overhead": "Main overhead costs",
    "scalability": "How scalable is the business"
  }
}`;

    const response = await llmService.research(prompt, { industryCode });
    return this.parseResearchResponse(response.content, 'Business Model');
  }

  /**
   * PHASE 3: Competitive Landscape
   */
  private async researchCompetitiveLandscape(
    customerLanguage: string,
    industryCode: string,
    customerResearch: any,
    businessModelResearch: any
  ): Promise<any> {
    const prompt = `You are an expert competitive analyst analyzing the "${customerLanguage}" industry.

IMPORTANT: Focus on competitive dynamics specific to "${customerLanguage}" businesses.

TASK: Map the competitive landscape and differentiation strategies.

ANALYZE:
1. **Market Structure**: Fragmented vs consolidated? Local vs national players?
2. **Competitive Intensity**: How fierce is competition?
3. **Differentiation Strategies**: How do winners stand out?
4. **Barriers to Entry**: What makes it hard for new entrants?
5. **Competitive Advantages**: What creates lasting competitive advantage?

RESPOND WITH ONLY VALID JSON:
{
  "marketStructure": {
    "concentration": "Fragmented, Moderately concentrated, or Highly concentrated",
    "description": "Who dominates the market",
    "typicalCompetitors": "Who businesses compete against"
  },
  "competitiveIntensity": {
    "level": "Low, Medium, or High",
    "factors": ["What makes it competitive"]
  },
  "differentiationStrategies": [
    {
      "strategy": "Strategy name",
      "description": "How it works",
      "effectiveness": "How well it works"
    }
  ],
  "barriersToEntry": ["Barrier 1", "Barrier 2"],
  "competitiveAdvantages": ["Advantage 1", "Advantage 2"],
  "insights": {
    "howToStandOut": "What makes businesses memorable in this industry",
    "commonMistakes": "What causes businesses to blend in or fail"
  }
}`;

    const response = await llmService.research(prompt, { industryCode });
    return this.parseResearchResponse(response.content, 'Competitive Landscape');
  }

  /**
   * PHASE 4: Success Patterns & Best Practices
   */
  private async researchSuccessPatterns(
    customerLanguage: string,
    industryCode: string,
    customerResearch: any,
    competitiveResearch: any
  ): Promise<any> {
    const prompt = `You are an expert business strategist analyzing success patterns in the "${customerLanguage}" industry.

IMPORTANT: Success patterns for "${customerLanguage}" businesses are unique to this sub-industry.

TASK: Identify what makes businesses succeed or fail in this industry.

ANALYZE:
1. **Success Indicators**: What do winning businesses have in common?
2. **Failure Patterns**: Why do businesses in this industry fail?
3. **Best Practices**: Proven strategies that work
4. **Critical Success Factors**: Must-haves for survival
5. **Growth Trajectories**: How successful businesses scale

RESPOND WITH ONLY VALID JSON:
{
  "successIndicators": [
    {
      "indicator": "Success factor",
      "importance": "Critical, Important, or Nice-to-have",
      "description": "Why it matters"
    }
  ],
  "failurePatterns": [
    {
      "pattern": "Common failure mode",
      "frequency": "How common",
      "prevention": "How to avoid"
    }
  ],
  "bestPractices": [
    {
      "practice": "Best practice",
      "category": "Marketing, Operations, Customer Service, etc.",
      "impact": "Expected impact"
    }
  ],
  "criticalSuccessFactors": ["Factor 1", "Factor 2", "Factor 3"],
  "growthTrajectories": {
    "typical": "How businesses typically grow",
    "accelerators": ["What speeds up growth"],
    "plateaus": "Where businesses typically stall"
  }
}`;

    const response = await llmService.research(prompt, { industryCode });
    return this.parseResearchResponse(response.content, 'Success Patterns');
  }

  /**
   * PHASE 5: Marketing Intelligence
   */
  private async researchMarketingIntelligence(
    customerLanguage: string,
    industryCode: string,
    customerResearch: any,
    successPatterns: any
  ): Promise<any> {
    const prompt = `You are an expert marketing strategist analyzing the "${customerLanguage}" industry.

IMPORTANT: Marketing strategies for "${customerLanguage}" businesses differ from generic approaches.

TASK: Provide comprehensive marketing intelligence for this industry.

ANALYZE:
1. **Content That Works**: Topics, formats, hooks that perform well
2. **Marketing Channels**: Where to reach customers (priority order)
3. **Messaging Strategies**: What messages resonate
4. **Seasonality**: When to market (peak seasons, key dates)
5. **Compliance**: Required disclosures, prohibited claims

RESPOND WITH ONLY VALID JSON:
{
  "contentThatWorks": {
    "topics": [
      {
        "topic": "Content topic",
        "effectiveness": "high, medium, or low",
        "examples": ["Example 1", "Example 2"],
        "rationale": "Why this works"
      }
    ],
    "formats": [
      {
        "format": "Content format",
        "platforms": ["Platform 1", "Platform 2"],
        "effectiveness": "high, medium, or low",
        "bestUseCase": "When to use this format"
      }
    ],
    "hooks": ["Hook 1", "Hook 2", "Hook 3"],
    "optimalLength": {
      "social_post": {"min": 100, "max": 200},
      "blog_post": {"min": 800, "max": 1500},
      "email": {"min": 150, "max": 300}
    }
  },
  "marketingChannels": {
    "primary": [
      {
        "name": "Channel name",
        "platform": "Platform identifier",
        "rationale": "Why this channel works",
        "postingFrequency": "How often to post",
        "bestTimes": ["Best time 1", "Best time 2"]
      }
    ],
    "secondary": []
  },
  "messagingStrategies": {
    "corePitch": "The fundamental value proposition structure",
    "proofPoints": ["What builds credibility"],
    "callsToAction": ["Effective CTAs for this industry"]
  },
  "seasonality": {
    "peakMonths": [1, 2, 3],
    "keyDates": [
      {
        "date": "MM-DD or description",
        "event": "Event name",
        "importance": "critical, important, or nice-to-have",
        "contentOpportunity": "How to leverage"
      }
    ]
  },
  "compliance": {
    "requiredDisclosures": ["Disclosure 1", "Disclosure 2"],
    "prohibitedClaims": ["What not to claim"]
  }
}`;

    const response = await llmService.research(prompt, { industryCode });
    return this.parseResearchResponse(response.content, 'Marketing Intelligence');
  }

  /**
   * PHASE 6: Calibration & Strategy Synthesis
   */
  private async generateCalibration(
    customerLanguage: string,
    industryCode: string,
    allResearch: {
      customerResearch: any;
      businessModelResearch: any;
      competitiveResearch: any;
      successPatterns: any;
      marketingIntelligence: any;
    }
  ): Promise<any> {
    const prompt = `You are an expert brand strategist synthesizing research for the "${customerLanguage}" industry.

IMPORTANT: Calibration settings must be specific to "${customerLanguage}" businesses, not generic.

TASK: Generate precise calibration settings for content generation.

RESEARCH SUMMARY:
- Customer emotional triggers: ${JSON.stringify(allResearch.customerResearch.segments.b2c[0]?.emotionalTriggers || [])}
- Primary motivation: ${allResearch.customerResearch.insights.primaryMotivation}
- Competitive landscape: ${allResearch.competitiveResearch.competitiveIntensity.level}
- Key success factors: ${JSON.stringify(allResearch.successPatterns.criticalSuccessFactors)}

DETERMINE:
1. **emotionalLevel** (0.0-1.0): How emotional vs factual should messaging be?
   - 0.0-0.3: Facts, credentials, zero fluff (e.g., lawyers, accountants)
   - 0.3-0.5: Professional warmth with credibility (e.g., consultants, dentists)
   - 0.5-0.7: Balanced emotion and benefits (e.g., gyms, salons)
   - 0.7-1.0: Sensory storytelling, nostalgia (e.g., restaurants, bakeries)

2. **formalityLevel** (0.0-1.0): How formal vs casual?
   - 0.0-0.3: Casual, friendly, conversational
   - 0.3-0.7: Professional but approachable
   - 0.7-1.0: Formal, authoritative

3. **urgencyLevel** (0.0-1.0): How urgent is the need?
   - 0.0-0.3: Long-term, considered decisions
   - 0.3-0.6: Moderate timeliness
   - 0.6-1.0: Emergency-driven, 24/7 availability matters

4. **technicalLevel** (0.0-1.0): How much expertise to show?
   - 0.0-0.3: Simple language, no jargon
   - 0.3-0.6: Some expertise demonstrated
   - 0.6-1.0: Technical details important

5. **transformationApproach**: emotional, functional, or balanced?

6. **primaryValueDrivers**: Top 4-5 things customers value most

7. **powerWords**: 5-8 words that resonate in this industry

8. **avoidPhrases**: 3-5 clichés or phrases to avoid

RESPOND WITH ONLY VALID JSON:
{
  "emotionalLevel": 0.75,
  "formalityLevel": 0.3,
  "urgencyLevel": 0.5,
  "technicalLevel": 0.2,
  "transformationApproach": "emotional",
  "primaryValueDrivers": ["value1", "value2", "value3", "value4"],
  "avoidancePatterns": ["generic claims", "unsubstantiated promises"],
  "powerWords": ["word1", "word2", "word3", "word4", "word5"],
  "avoidPhrases": ["phrase1", "phrase2", "phrase3"],
  "reasoning": "2-3 sentence explanation of these settings"
}`;

    const response = await llmService.calibrate(prompt, { industryCode });
    return this.parseResearchResponse(response.content, 'Calibration');
  }

  /**
   * SYNTHESIZE - Combine all research into IndustryProfileV3
   * NOW USES INDUSTRY DETECTION DATA
   */
  private synthesizeProfile(
    industryDetection: IndustryDetection,
    research: {
      customerResearch: any;
      businessModelResearch: any;
      competitiveResearch: any;
      successPatterns: any;
      marketingIntelligence: any;
      calibration: any;
    }
  ): IndustryProfileV3 {
    const industryCode = industryDetection.primaryNAICS;
    const displayName = industryDetection.customerLanguage;

    // Build comprehensive profile
    const profile: IndustryProfileV3 = {
      industryCode,
      displayName,
      commonNames: [
        industryDetection.customerLanguage,
        industryDetection.customerLanguage.toLowerCase(),
        ...industryDetection.industryChain.map(code => this.formatDisplayName(code))
      ],

      typicalCustomers: {
        b2c: research.customerResearch.segments.b2c,
        b2b: research.customerResearch.segments.b2b,
      },

      contentThatWorks: research.marketingIntelligence.contentThatWorks,

      marketingChannels: research.marketingIntelligence.marketingChannels,

      seasonality: research.marketingIntelligence.seasonality,

      compliance: research.marketingIntelligence.compliance,

      kpis: {
        primary: this.extractKPIs(research.successPatterns),
        benchmarks: this.extractBenchmarks(research.businessModelResearch),
      },

      questions: this.generateIndustryQuestions(displayName),

      calibration: research.calibration,
    };

    return profile;
  }

  /**
   * HELPER: Extract KPIs from success patterns
   */
  private extractKPIs(successPatterns: any): any[] {
    return (successPatterns.successIndicators || []).slice(0, 5).map((indicator: any) => ({
      name: indicator.indicator,
      description: indicator.description,
      target: indicator.importance === 'Critical' ? 'High' : 'Moderate',
      measurement: 'Track monthly',
    }));
  }

  /**
   * HELPER: Extract benchmarks from business model research
   */
  private extractBenchmarks(businessModelResearch: any): any[] {
    const benchmarks = [];

    if (businessModelResearch.unitEconomics) {
      const economics = businessModelResearch.unitEconomics;

      if (economics.margins) {
        benchmarks.push({
          metric: 'Profit Margin',
          industry_average: parseFloat(economics.margins) || 20,
          top_performers: parseFloat(economics.margins) * 1.5 || 30,
          unit: '%',
        });
      }

      if (economics.avgTransactionValue) {
        const avg = parseFloat(economics.avgTransactionValue.replace(/[^0-9.]/g, ''));
        if (!isNaN(avg)) {
          benchmarks.push({
            metric: 'Average Transaction Value',
            industry_average: avg,
            top_performers: avg * 1.3,
            unit: '$',
          });
        }
      }
    }

    return benchmarks;
  }

  /**
   * HELPER: Generate industry-specific questions
   */
  private generateIndustryQuestions(industryCode: string): {
    whatYouDo: string;
    targetCustomer: string;
    uniqueValue: string;
  } {
    return {
      whatYouDo: `What ${industryCode} services do you provide, and what's your specialty?`,
      targetCustomer: `Who are your typical customers? What do they value most when choosing a ${industryCode}?`,
      uniqueValue: `What makes your ${industryCode} business different from competitors?`,
    };
  }

  /**
   * HELPER: Format display name
   */
  private formatDisplayName(industryCode: string): string {
    return industryCode
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * CALCULATE QUALITY SCORE (0-1)
   */
  private calculateQualityScore(profile: IndustryProfileV3): number {
    let score = 0;
    let maxScore = 0;

    // Customer segments (20 points)
    maxScore += 20;
    const customerCount = (profile.typicalCustomers.b2c?.length || 0) + (profile.typicalCustomers.b2b?.length || 0);
    score += Math.min(customerCount * 10, 20);

    // Content topics (20 points)
    maxScore += 20;
    score += Math.min(profile.contentThatWorks.topics.length * 5, 20);

    // Marketing channels (15 points)
    maxScore += 15;
    score += Math.min(profile.marketingChannels.primary.length * 5, 15);

    // Calibration (25 points)
    maxScore += 25;
    if (profile.calibration) {
      score += 25;
    }

    // KPIs (10 points)
    maxScore += 10;
    score += Math.min(profile.kpis.primary.length * 2, 10);

    // Benchmarks (10 points)
    maxScore += 10;
    score += Math.min(profile.kpis.benchmarks.length * 5, 10);

    return Math.min(score / maxScore, 1);
  }

  /**
   * DATABASE OPERATIONS
   */

  private async getFromCache(industryCode: string): Promise<ResearchResult | null> {
    // Check in-memory cache first (instant, works without database)
    const inMemory = this.profileCache.get(industryCode);
    if (inMemory) {
      console.log(`[IndustryResearch] In-memory cache hit for ${industryCode}`);
      return inMemory;
    }

    // Fallback to database if available
    try {
      const { data, error } = await supabase
        .from('industry_profiles')
        .select('*')
        .eq('industry_code', industryCode)
        .single();

      if (error || !data) {
        return null;
      }

      const result: ResearchResult = {
        profile: data.profile_data as IndustryProfileV3,
        researchQuality: data.research_quality_score || 0,
        researchTime: 0, // From cache
        model: 'cached',
        wasFallback: false,
      };

      // Store in memory for next time
      this.profileCache.set(industryCode, result);
      console.log(`[IndustryResearch] Database cache hit for ${industryCode}, stored in memory`);

      return result;
    } catch (error) {
      console.error('[IndustryResearch] Error fetching from cache:', error);
      return null;
    }
  }

  private async saveToDatabase(
    industryCode: string,
    profile: IndustryProfileV3,
    metadata: {
      researchQuality: number;
      jobId: string;
    }
  ): Promise<void> {
    try {
      // Separate profile_data from research_insights
      const profileData = {
        typicalCustomers: profile.typicalCustomers,
        contentThatWorks: profile.contentThatWorks,
        marketingChannels: profile.marketingChannels,
        seasonality: profile.seasonality,
        compliance: profile.compliance,
        kpis: profile.kpis,
        questions: profile.questions,
        calibration: profile.calibration,
      };

      await supabase.from('industry_profiles').upsert({
        industry_code: industryCode,
        display_name: profile.displayName,
        common_names: profile.commonNames,
        research_version: 1,
        research_quality_score: metadata.researchQuality,
        research_completed_at: new Date().toISOString(),
        profile_data: profileData,
        research_insights: {}, // Will be populated with raw research data if needed
        total_uses: 0,
        successful_outcomes: 0,
        refinement_count: 0,
      });

      console.log(`[IndustryResearch] Saved profile for ${industryCode} to database`);
    } catch (error) {
      console.error('[IndustryResearch] Error saving to database:', error);
      // Don't throw - profile is still usable even if save fails
    }
  }

  private async createResearchJob(
    industryCode: string,
    options: {
      triggeredBy: 'onboarding' | 'manual' | 'scheduled_refresh';
      brandId?: string;
    }
  ): Promise<{ jobId: string }> {
    try {
      const { data, error } = await supabase
        .from('research_jobs')
        .insert({
          industry_code: industryCode,
          status: 'queued',
          current_phase: null,
          progress_percent: 0,
          phases_completed: [],
          total_phases: this.RESEARCH_PHASES.length,
          triggered_by: options.triggeredBy,
          brand_id: options.brandId,
        })
        .select()
        .single();

      if (error || !data) {
        throw new Error('Failed to create research job');
      }

      return { jobId: data.id };
    } catch (error) {
      console.error('[IndustryResearch] Error creating research job:', error);
      // Return a fake ID if database fails - research can still proceed
      return { jobId: 'local-' + Date.now() };
    }
  }

  /**
   * Extract and parse JSON from LLM response
   * Handles cases where LLM adds text before/after JSON
   */
  private parseResearchResponse(response: string, phase: string): any {
    let content = response.trim();

    // Try to find JSON object in the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }

    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error(`[IndustryResearch] Failed to parse ${phase} JSON:`, content.substring(0, 200));
      throw new Error(`Failed to parse ${phase} response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`);
    }
  }

  private updateJobProgress(
    jobId: string,
    industryCode: string,
    currentPhase: string,
    progressPercent: number,
    phasesCompleted: string[]
  ): void {
    // Emit progress via callbacks (works without database)
    this.emitProgress(industryCode, {
      jobId,
      industryCode,
      status: 'analyzing',
      currentPhase,
      progressPercent,
      phasesCompleted: [...phasesCompleted],
      totalPhases: this.RESEARCH_PHASES.length,
    });

    console.log(`[IndustryResearch] Progress: ${currentPhase} (${progressPercent}%) [${phasesCompleted.length}/${this.RESEARCH_PHASES.length} phases complete]`);

    // Also save to database if available (fire and forget)
    if (!jobId.startsWith('local-')) {
      supabase
        .from('research_jobs')
        .update({
          status: 'analyzing',
          current_phase: currentPhase,
          progress_percent: progressPercent,
          phases_completed: phasesCompleted,
        })
        .eq('id', jobId)
        .then(() => {})
        .catch(() => {}); // Ignore database errors
    }
  }

  private completeResearchJob(
    jobId: string,
    industryCode: string,
    status: 'complete' | 'failed',
    errorMessage?: string
  ): void {
    // Emit final progress via callbacks
    this.emitProgress(industryCode, {
      jobId,
      industryCode,
      status,
      currentPhase: status === 'complete' ? 'Complete!' : 'Failed',
      progressPercent: status === 'complete' ? 100 : 0,
      phasesCompleted: status === 'complete' ? this.RESEARCH_PHASES : [],
      totalPhases: this.RESEARCH_PHASES.length,
    });

    // Also save to database if available (fire and forget)
    if (!jobId.startsWith('local-')) {
      supabase
        .from('research_jobs')
        .update({
          status,
          progress_percent: status === 'complete' ? 100 : undefined,
          completed_at: new Date().toISOString(),
          error_message: errorMessage,
        })
        .eq('id', jobId)
        .then(() => {
          // Success - database updated
        })
        .catch(() => {
          // Ignore database errors
        });
    }
  }

  /**
   * GET RESEARCH PROGRESS (for UI)
   * Uses in-memory data first, falls back to database if available
   */
  async getResearchProgress(industryCode: string): Promise<ResearchProgress | null> {
    // Check in-memory store first (works without database)
    const inMemory = this.activeResearch.get(industryCode);
    if (inMemory) {
      return inMemory;
    }

    // Fallback to database if no in-memory data
    try {
      const { data, error } = await supabase
        .from('research_jobs')
        .select('*')
        .eq('industry_code', industryCode)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        jobId: data.id,
        industryCode: data.industry_code,
        status: data.status,
        currentPhase: data.current_phase || '',
        progressPercent: data.progress_percent || 0,
        phasesCompleted: data.phases_completed || [],
        totalPhases: data.total_phases || this.RESEARCH_PHASES.length,
      };
    } catch (error) {
      // Database not available, return null
      return null;
    }
  }
}

// Export singleton
export const industryResearchService = new IndustryResearchService();
