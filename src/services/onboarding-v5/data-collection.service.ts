/**
 * Onboarding V5 Data Collection Service
 *
 * Orchestrates all AI services to collect comprehensive business intelligence.
 *
 * PERFORMANCE OPTIMIZED V3 (2025-11-25):
 * Now uses SERVER-SIDE orchestrator that bypasses browser's 6-TCP-connection limit!
 * - ONE request to Supabase Edge Function
 * - Edge Function runs 6 parallel AI calls server-side
 * - Total: ~30-40 seconds with COMPLETE data
 *
 * Architecture (Netflix/Uber API Gateway Pattern):
 * Browser ──► 1 Request ──► Edge Function ──► 6 Parallel AI ──► All Results
 *
 * Created: 2025-11-18 (Week 2, Track D)
 * Optimized V2: 2025-11-25 (Full parallel extraction with focused extractors)
 * Optimized V3: 2025-11-25 (Server-side orchestration - bypasses browser connection limits)
 */

import type { WebsiteData } from '@/services/scraping/websiteScraper';
import {
  serverOrchestrator,
  type OrchestrationProgress
} from '@/services/intelligence/server-orchestrator.service';
// Legacy imports - kept for backward compatibility
import { jtbdTransformer } from '@/services/intelligence/jtbd-transformer.service';
// EQ import for FAB cascade balancing
import { INDUSTRY_EQ_MAP } from '@/services/uvp-wizard/emotional-quotient';
import type { ValueProposition } from '@/components/onboarding-v5/ValuePropositionPage';
import type { CustomerTrigger, BuyerPersona } from '@/components/onboarding-v5/BuyerIntelligencePage';
import type { CoreTruth, MessagingPillar } from '@/components/onboarding-v5/CoreTruthPage';
import type { Transformation } from '@/components/onboarding-v5/TransformationCascade';
import type { ConfidenceScore } from '@/components/onboarding-v5/ConfidenceMeter';
import type { DataSource } from '@/components/onboarding-v5/SourceCitation';
import type { EQRecommendation, EQCalculationResult, EQScore } from '@/types/eq-calculator.types';
import type { ProductServiceExtractionResult, CustomerExtractionResult, DifferentiatorExtractionResult, BenefitExtractionResult } from '@/types/uvp-flow.types';
import type { BuyerIntelligenceResult } from '@/types/buyer-persona.types';
import type { SmartTransformationResult } from '@/services/uvp-extractors/smart-transformation-generator.service';

/**
 * Complete onboarding data package
 */
export interface OnboardingDataPackage {
  // Page 1: Value Propositions
  valuePropositions: ValueProposition[];

  // Page 2: Buyer Intelligence
  customerTriggers: CustomerTrigger[];
  buyerPersonas: BuyerPersona[];
  transformations: Transformation[];
  industryEQScore: number;

  // Page 3: Core Truth
  coreTruth: CoreTruth;

  // ✨ EQ Calculator v2.0
  eqScore?: EQScore;
  eqRecommendations?: EQRecommendation[];
  eqFullResult?: EQCalculationResult;

  // 🚀 Raw extraction data (for UVP flow - avoids redundant extractions)
  // Now with COMPLETE data from focused extractors
  rawProductsData?: ProductServiceExtractionResult;
  rawCustomersData?: CustomerExtractionResult;
  rawDifferentiatorsData?: DifferentiatorExtractionResult;
  rawBuyerIntelData?: BuyerIntelligenceResult;
  rawTransformationsData?: SmartTransformationResult;
  rawBenefitsData?: BenefitExtractionResult;

  // Metadata
  collectionTimestamp: Date;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  warnings: string[];
}

/**
 * Progress callback for real-time updates
 */
export type DataCollectionProgress = {
  stage: 'scanning_website' | 'extracting_personas' | 'calculating_eq' | 'synthesizing_truth' | 'complete';
  progress: number; // 0-100
  message: string;
  details?: string;
};

/**
 * Orchestrates all AI services to collect onboarding data
 */
class DataCollectionService {
  // Store background promises for progressive loading
  private phase1Promise: Promise<any> | null = null; // Customers + Differentiators
  private phase2Promise: Promise<any> | null = null; // BuyerPersonas, Transformations, Benefits
  private cachedWebsiteData: WebsiteData | null = null;
  private cachedBusinessInfo: { name: string; industry: string } | null = null;
  private cachedProducts: any[] = [];

  /**
   * PHASE 0: Products ONLY (~12-15s)
   * Returns as fast as possible so user can see products page
   * Call startBackgroundLoading() immediately after to load customers + rest in background
   */
  async collectProductsOnly(
    websiteData: WebsiteData,
    businessName: string,
    industry: string,
    onProgress?: (progress: DataCollectionProgress) => void
  ): Promise<OnboardingDataPackage> {
    console.log('[DataCollection] 🚀 PHASE 0: Products ONLY (single AI call ~12-15s)');

    // Cache for background phases
    this.cachedWebsiteData = websiteData;
    this.cachedBusinessInfo = { name: businessName, industry };
    serverOrchestrator.clearCache();

    try {
      onProgress?.({
        stage: 'scanning_website',
        progress: 10,
        message: 'Extracting products...',
        details: 'Phase 0: Products only for fast load'
      });

      // Get ONLY products (Phase 0)
      const phase0Result = await serverOrchestrator.extractPhase0(
        websiteData,
        businessName,
        industry
      );

      const products = phase0Result.products || [];
      this.cachedProducts = products;

      console.log('[DataCollection] ✅ Phase 0 complete');
      console.log(`  - Products: ${products.length}`);
      console.log(`  - Time: ${phase0Result.extractionTime}ms`);

      // Get industry EQ score
      const industryEQ = INDUSTRY_EQ_MAP[industry] || INDUSTRY_EQ_MAP['default'];
      const emotionalWeight = industryEQ?.emotional_weight || 50;

      // Convert to legacy format
      const legacy = serverOrchestrator.convertToLegacyFormats({
        products,
        customers: [],
        differentiators: [],
        buyerPersonas: [],
        transformations: [],
        benefits: [],
        extractionTime: phase0Result.extractionTime || 0,
        parallelCalls: 1
      });

      return {
        valuePropositions: [],
        customerTriggers: [],
        buyerPersonas: [],
        transformations: [],
        industryEQScore: emotionalWeight,
        coreTruth: this.synthesizeCoreTruth(businessName, industry, [], [], emotionalWeight, websiteData),
        rawProductsData: legacy.products,
        rawCustomersData: undefined,
        rawDifferentiatorsData: undefined,
        rawBuyerIntelData: undefined,
        rawTransformationsData: undefined,
        rawBenefitsData: undefined,
        collectionTimestamp: new Date(),
        dataQuality: 'fair',
        warnings: ['Loading customers and insights in background...']
      };

    } catch (error) {
      console.error('[DataCollection] Phase 0 failed:', error);
      throw error;
    }
  }

  /**
   * Start Phase 1 (Customers ONLY) IMMEDIATELY - in parallel with Phase 0
   * Call this at the same time as collectProductsOnly() for maximum parallelism
   */
  startPhase1Immediately(
    websiteData: WebsiteData,
    businessName: string,
    industry: string
  ): void {
    // Cache for later phases
    this.cachedWebsiteData = websiteData;
    this.cachedBusinessInfo = { name: businessName, industry };

    console.log('[DataCollection] 🚀🚀🚀 PARALLEL: Starting Phase 1 (Customers ONLY) with Phase 0 🚀🚀🚀');

    // Phase 1: Customers ONLY - start NOW, in parallel with Phase 0
    this.phase1Promise = serverOrchestrator.extractPhase1(
      websiteData,
      businessName,
      industry
    ).then(result => {
      console.log('[DataCollection] ✅ Phase 1 (Customers) complete');
      console.log(`  - Customers: ${result.customers?.length || 0}`);
      return result;
    }).catch(err => {
      console.error('[DataCollection] Phase 1 (Customers) failed:', err);
      return { customers: [] };
    });
  }

  /**
   * Start Phase 2 (Differentiators) - called after BOTH Phase 0 and Phase 1 complete
   * Chains: Phase 2 (Differentiators) → Phase 3 (Benefits)
   */
  startPhase2Differentiators(): void {
    if (!this.cachedWebsiteData || !this.cachedBusinessInfo) {
      console.warn('[DataCollection] Cannot start Phase 2: missing cached data');
      return;
    }

    if (this.phase2Promise) {
      console.log('[DataCollection] Phase 2 (Differentiators) already running, skipping...');
      return;
    }

    console.log('[DataCollection] 🔄 Starting Phase 2 (Differentiators)...');

    this.phase2Promise = serverOrchestrator.extractPhase2(
      this.cachedWebsiteData,
      this.cachedBusinessInfo.name,
      this.cachedBusinessInfo.industry
    ).then(result => {
      console.log('[DataCollection] ✅ Phase 2 (Differentiators) complete');
      console.log(`  - Differentiators: ${result.differentiators?.length || 0}`);

      // Chain: Start Phase 3 (Benefits) after Differentiators complete
      this.startPhase3Benefits();

      return result;
    }).catch(error => {
      console.error('[DataCollection] Phase 2 (Differentiators) failed:', error);
      // Still try to load benefits even if differentiators failed
      this.startPhase3Benefits();
      return null;
    });
  }

  /**
   * Start Phase 3 (Benefits) - called after Phase 2 (Differentiators) completes
   */
  private phase3Promise: Promise<any> | null = null;

  startPhase3Benefits(): void {
    if (!this.cachedWebsiteData || !this.cachedBusinessInfo) {
      console.warn('[DataCollection] Cannot start Phase 3: missing cached data');
      return;
    }

    if (this.phase3Promise) {
      console.log('[DataCollection] Phase 3 (Benefits) already running, skipping...');
      return;
    }

    console.log('[DataCollection] 🔄 Starting Phase 3 (Benefits)...');

    this.phase3Promise = serverOrchestrator.extractPhase3(
      this.cachedWebsiteData,
      this.cachedBusinessInfo.name,
      this.cachedBusinessInfo.industry
    ).then(result => {
      console.log('[DataCollection] ✅ Phase 3 (Benefits) complete');
      console.log(`  - Benefits: ${result.benefits?.length || 0}`);
      return result;
    }).catch(error => {
      console.error('[DataCollection] Phase 3 (Benefits) failed:', error);
      return null;
    });
  }

  /**
   * DEPRECATED: Old background loading - replaced by sequential chaining
   * Kept for backwards compatibility
   */
  startBackgroundLoading(): void {
    console.log('[DataCollection] ⚠️ startBackgroundLoading() deprecated - use startPhase2Differentiators() instead');
    this.startPhase2Differentiators();
  }

  /**
   * Get Phase 1 results (Customers ONLY)
   * Returns immediately if ready, or waits if still loading
   */
  async getPhase1Results(): Promise<any | null> {
    if (!this.phase1Promise) {
      console.warn('[DataCollection] Phase 1 not started');
      return null;
    }
    return this.phase1Promise;
  }

  /**
   * Get Phase 2 results (Differentiators ONLY)
   * Returns immediately if ready, or waits if still loading
   */
  async getPhase2Results(): Promise<any | null> {
    if (!this.phase2Promise) {
      console.warn('[DataCollection] Phase 2 not started');
      return null;
    }
    return this.phase2Promise;
  }

  /**
   * Get Phase 3 results (Benefits ONLY)
   * Returns immediately if ready, or waits if still loading
   */
  async getPhase3Results(): Promise<any | null> {
    if (!this.phase3Promise) {
      console.warn('[DataCollection] Phase 3 not started');
      return null;
    }
    return this.phase3Promise;
  }

  /**
   * LEGACY: Phase 1 that includes customers (for backwards compatibility)
   * Now calls Phase 0 + starts background, returns when Phase 1 ready
   */
  async collectPhase1Data(
    websiteData: WebsiteData,
    businessName: string,
    industry: string,
    onProgress?: (progress: DataCollectionProgress) => void
  ): Promise<OnboardingDataPackage> {
    // Use new Phase 0 approach
    const package0 = await this.collectProductsOnly(websiteData, businessName, industry, onProgress);

    // Start background loading
    this.startBackgroundLoading();

    return package0;
  }

  /**
   * Start Phase 2 loading in background (BuyerPersonas, Transformations, Benefits)
   * Call immediately after collectPhase1Data(), no await needed
   * Note: This is now called automatically by startBackgroundLoading()
   */
  startPhase2(): void {
    // Guard: Don't start if already running
    if (this.phase2Promise) {
      console.log('[DataCollection] Phase 2 already running, skipping duplicate start');
      return;
    }
    if (!this.cachedWebsiteData || !this.cachedBusinessInfo) {
      console.warn('[DataCollection] Cannot start Phase 2: missing cached data');
      return;
    }

    console.log('[DataCollection] Starting Phase 2 in background...');

    this.phase2Promise = serverOrchestrator.extractPhase2(
      this.cachedWebsiteData,
      this.cachedBusinessInfo.name,
      this.cachedBusinessInfo.industry
    ).then(result => {
      console.log('[DataCollection] Phase 2 complete');
      console.log(`  - BuyerPersonas: ${result.buyerPersonas?.length || 0}`);
      console.log(`  - Transformations: ${result.transformations?.length || 0}`);
      console.log(`  - Benefits: ${result.benefits?.length || 0}`);
      return result;
    }).catch(error => {
      console.error('[DataCollection] Phase 2 failed:', error);
      return null;
    });
  }

  /**
   * Get Phase 2 results (await if still loading)
   */
  async getPhase2Results(): Promise<any | null> {
    if (!this.phase2Promise) {
      console.warn('[DataCollection] Phase 2 not started');
      return null;
    }
    return this.phase2Promise;
  }

  /**
   * Merge Phase 2 results into existing data package
   */
  async mergePhase2Data(existingPackage: OnboardingDataPackage): Promise<OnboardingDataPackage> {
    const phase2Result = await this.getPhase2Results();
    if (!phase2Result) {
      return existingPackage;
    }

    const buyerPersonas = phase2Result.buyerPersonas || [];
    const transformations = phase2Result.transformations || [];
    const benefits = phase2Result.benefits || [];
    const websiteData = this.cachedWebsiteData!;
    const industry = this.cachedBusinessInfo?.industry || 'general';
    const businessName = this.cachedBusinessInfo?.name || '';

    const industryEQ = INDUSTRY_EQ_MAP[industry] || INDUSTRY_EQ_MAP['default'];
    const emotionalWeight = industryEQ?.emotional_weight || 50;

    // Convert to UI format
    const newBuyerPersonas: BuyerPersona[] = buyerPersonas.slice(0, 5).map((p: any, i: number) => ({
      id: `persona-${i}`,
      name: p.name,
      archetype: `${p.title} seeking ${p.desiredOutcomes?.[0] || 'better solutions'}`,
      demographics: {
        ageRange: undefined,
        income: undefined,
        location: p.industry
      },
      psychographics: {
        values: (p.desiredOutcomes || []).slice(0, 3),
        fears: (p.painPoints || []).slice(0, 2),
        goals: (p.desiredOutcomes || []).slice(0, 3)
      },
      decisionDrivers: {
        emotional: 65,
        rational: 70,
        social: 55
      },
      confidence: {
        overall: p.confidence || 70,
        dataQuality: 70,
        sourceCount: 1,
        modelAgreement: p.confidence || 70,
        reasoning: 'Phase 2 extraction'
      }
    }));

    const newTriggers: CustomerTrigger[] = buyerPersonas.flatMap((p: any, i: number) => [
      ...(p.painPoints || []).slice(0, 2).map((pain: string, j: number) => ({
        id: `trigger-pain-${i}-${j}`,
        type: 'pain' as const,
        description: pain,
        urgency: 75,
        frequency: 60,
        emotionalWeight: 70,
        sources: []
      })),
      ...(p.desiredOutcomes || []).slice(0, 1).map((outcome: string, j: number) => ({
        id: `trigger-desire-${i}-${j}`,
        type: 'desire' as const,
        description: outcome,
        urgency: 65,
        frequency: 55,
        emotionalWeight: 65,
        sources: []
      }))
    ]).slice(0, 10);

    const newTransformations: Transformation[] = transformations.slice(0, 5).map((t: any, i: number) => ({
      id: `trans-${i}`,
      painPoint: t.fromState,
      pleasureGoal: t.toState,
      mechanism: t.mechanism,
      clarity: 80,
      confidence: {
        overall: t.confidence || 70,
        dataQuality: 70,
        sourceCount: 1,
        modelAgreement: t.confidence || 70,
        reasoning: 'Phase 2 extraction'
      }
    }));

    // Enhanced value propositions from benefits
    const enhancedValueProps: ValueProposition[] = benefits.slice(0, 5).map((b: any, i: number) => {
      const functionalOutcome = b.benefit || b.feature || 'Key benefit';
      const emotionalTransform = b.emotionalBenefit || '';
      const shouldIncludeEmotional = emotionalWeight > 70 ? true : emotionalWeight > 40 ? (i < 2) : false;

      let combinedStatement: string;
      if (shouldIncludeEmotional && functionalOutcome && emotionalTransform && emotionalTransform !== functionalOutcome) {
        combinedStatement = `${functionalOutcome} so you ${emotionalTransform.toLowerCase()}`;
      } else {
        combinedStatement = functionalOutcome;
      }

      return {
        id: `vp-${Date.now()}-${i}`,
        statement: combinedStatement,
        outcomeStatement: combinedStatement,
        category: i === 0 ? 'core' as const : 'secondary' as const,
        confidence: {
          overall: b.confidence || 70,
          dataQuality: 75,
          sourceCount: 1,
          modelAgreement: b.confidence || 70,
          reasoning: `EQ-balanced FAB cascade (${emotionalWeight}% emotional)`
        },
        sources: [{
          type: 'website' as const,
          url: websiteData.url,
          snippet: b.feature || '',
          confidence: b.confidence || 70
        }],
        marketPosition: 'Value leader',
        differentiators: [],
        validated: false,
        jtbdInsights: undefined
      };
    });

    // Convert for raw data
    const legacy = serverOrchestrator.convertToLegacyFormats({
      products: [],
      customers: [],
      differentiators: [],
      buyerPersonas,
      transformations,
      benefits,
      extractionTime: 0,
      parallelCalls: 3
    });

    // Merge data
    return {
      ...existingPackage,
      // Use enhanced value props if available, otherwise keep existing
      valuePropositions: enhancedValueProps.length > 0 ? enhancedValueProps : existingPackage.valuePropositions,
      customerTriggers: newTriggers,
      buyerPersonas: newBuyerPersonas,
      transformations: newTransformations,
      rawBuyerIntelData: legacy.buyerIntelligence,
      rawTransformationsData: legacy.transformations,
      rawBenefitsData: legacy.benefits,
      dataQuality: 'good',
      warnings: []
    };
  }

  /**
   * Collect complete onboarding data from website
   *
   * PERFORMANCE OPTIMIZED V3 (2025-11-25):
   * Now uses SERVER-SIDE orchestrator that bypasses browser's 6-TCP-connection limit!
   * Architecture:
   * - ONE request to Supabase Edge Function
   * - Edge Function runs 6 parallel AI calls server-side (no connection limits!)
   * - ~30-40 seconds total with ALL data (products, customers, differentiators, personas, transformations, benefits)
   */
  async collectOnboardingData(
    websiteData: WebsiteData,
    businessName: string,
    industry: string,
    onProgress?: (progress: DataCollectionProgress) => void
  ): Promise<OnboardingDataPackage> {
    console.log('[DataCollection] Starting SERVER-SIDE parallel extraction...');
    console.log('[DataCollection] Using server orchestrator (bypasses browser connection limits)');

    try {
      // Call server-side orchestrator (ONE request, ALL parallel extractions server-side)
      const serverResult = await serverOrchestrator.extractAll(
        websiteData,
        businessName,
        industry,
        // Map orchestrator progress to data collection progress
        (orchProgress: OrchestrationProgress) => {
          let stage: DataCollectionProgress['stage'];
          switch (orchProgress.stage) {
            case 'sending':
              stage = 'scanning_website';
              break;
            case 'processing':
              stage = 'extracting_personas';
              break;
            case 'complete':
            default:
              stage = 'complete';
          }

          onProgress?.({
            stage,
            progress: orchProgress.progress,
            message: orchProgress.message,
            details: `Server-side: 6 parallel AI calls`
          });
        }
      );

      // Convert server result to legacy formats for backward compatibility
      const legacy = serverOrchestrator.convertToLegacyFormats(serverResult);

      // Get industry EQ score to balance functional vs emotional messaging
      const industryEQ = INDUSTRY_EQ_MAP[industry] || INDUSTRY_EQ_MAP['default'];
      const emotionalWeight = industryEQ?.emotional_weight || 50; // Default to balanced
      console.log(`[DataCollection] Industry EQ: ${emotionalWeight}% emotional for ${industry}`);

      // Transform benefits (with FAB cascade) to value propositions
      // EQ-BALANCED: Use industry emotional quotient to decide how much emotional content to include
      // - High EQ (>70): Full functional + emotional combo
      // - Medium EQ (40-70): Functional first, light emotional touch
      // - Low EQ (<40): Pure functional outcomes
      const valuePropositions: ValueProposition[] = serverResult.benefits.slice(0, 5).map((b, i) => {
        // Get functional outcome (benefit) - ALWAYS primary
        const functionalOutcome = b.benefit || b.feature || 'Key benefit';
        // Get emotional transformation (emotionalBenefit) - used based on EQ
        const emotionalTransform = b.emotionalBenefit || '';

        // EQ-based emotional inclusion logic
        // High EQ (>70): Include emotional transformation for all items
        // Medium EQ (40-70): Include emotional only for first 2 items
        // Low EQ (<40): Skip emotional entirely - pure functional
        const shouldIncludeEmotional = emotionalWeight > 70 ? true :
                                       emotionalWeight > 40 ? (i < 2) :
                                       false;

        let combinedStatement: string;
        if (shouldIncludeEmotional && functionalOutcome && emotionalTransform && emotionalTransform !== functionalOutcome) {
          // Full FAB+T combo: "[Functional result] so you [emotional transformation]"
          combinedStatement = `${functionalOutcome} so you ${emotionalTransform.toLowerCase()}`;
        } else {
          // Functional only (for rational industries or lower-priority items)
          combinedStatement = functionalOutcome;
        }

        return {
          id: `vp-${Date.now()}-${i}`,
          // Combined functional + emotional statement
          statement: combinedStatement,
          outcomeStatement: combinedStatement,
          category: i === 0 ? 'core' as const : 'secondary' as const,
          confidence: {
            overall: b.confidence || 70,
            dataQuality: 75,
            sourceCount: 1,
            modelAgreement: b.confidence || 70,
            reasoning: `EQ-balanced FAB cascade (${emotionalWeight}% emotional)`
          },
          sources: [{
            type: 'website' as const,
            url: websiteData.url,
            snippet: b.feature || '',
            confidence: b.confidence || 70
          }],
          marketPosition: 'Value leader',
          differentiators: [],
          validated: false,
          jtbdInsights: undefined
        };
      });
      // Transform directly from server result (simpler, more reliable)
      const customerTriggers: CustomerTrigger[] = serverResult.buyerPersonas.flatMap((p, i) => [
        ...p.painPoints.slice(0, 2).map((pain, j) => ({
          id: `trigger-pain-${i}-${j}`,
          type: 'pain' as const,
          description: pain,
          urgency: 75,
          frequency: 60,
          emotionalWeight: 70,
          sources: []
        })),
        ...p.desiredOutcomes.slice(0, 1).map((outcome, j) => ({
          id: `trigger-desire-${i}-${j}`,
          type: 'desire' as const,
          description: outcome,
          urgency: 65,
          frequency: 55,
          emotionalWeight: 65,
          sources: []
        }))
      ]).slice(0, 10);

      const buyerPersonas: BuyerPersona[] = serverResult.buyerPersonas.slice(0, 5).map((p, i) => ({
        id: `persona-${i}`,
        name: p.name,
        archetype: `${p.title} seeking ${p.desiredOutcomes[0] || 'better solutions'}`,
        demographics: {
          ageRange: undefined,
          income: undefined,
          location: p.industry
        },
        psychographics: {
          values: p.desiredOutcomes.slice(0, 3),
          fears: p.painPoints.slice(0, 2),
          goals: p.desiredOutcomes.slice(0, 3)
        },
        decisionDrivers: {
          emotional: 65,
          rational: 70,
          social: 55
        },
        confidence: {
          overall: p.confidence,
          dataQuality: 70,
          sourceCount: 1,
          modelAgreement: p.confidence,
          reasoning: 'Server-side AI extraction'
        }
      }));

      const transformations = serverResult.transformations.slice(0, 5).map((t, i) => ({
        id: `trans-${i}`,
        painPoint: t.fromState,
        pleasureGoal: t.toState,
        mechanism: t.mechanism,
        clarity: 80,
        confidence: {
          overall: t.confidence,
          dataQuality: 70,
          sourceCount: 1,
          modelAgreement: t.confidence,
          reasoning: 'Server-side AI extraction'
        }
      }));

      // Use EQ score calculated earlier (from INDUSTRY_EQ_MAP)
      const industryEQScore = emotionalWeight;

      // Synthesize core truth
      const coreTruth = this.synthesizeCoreTruth(
        businessName,
        industry,
        valuePropositions,
        buyerPersonas,
        industryEQScore,
        websiteData
      );

      // Assess data quality
      const totalItems =
        serverResult.products.length +
        serverResult.customers.length +
        serverResult.differentiators.length +
        serverResult.buyerPersonas.length +
        serverResult.transformations.length +
        serverResult.benefits.length;

      const dataQuality: 'excellent' | 'good' | 'fair' | 'poor' =
        totalItems >= 40 ? 'excellent' :
        totalItems >= 25 ? 'good' :
        totalItems >= 15 ? 'fair' : 'poor';

      console.log('[DataCollection] ========================================');
      console.log('[DataCollection] SERVER-SIDE EXTRACTION COMPLETE');
      console.log(`[DataCollection] Server Processing: ${serverResult.extractionTime}ms (${(serverResult.extractionTime / 1000).toFixed(1)}s)`);
      console.log(`[DataCollection] Parallel Calls: ${serverResult.parallelCalls}`);
      console.log(`[DataCollection] - Products: ${serverResult.products.length}`);
      console.log(`[DataCollection] - Customers: ${serverResult.customers.length}`);
      console.log(`[DataCollection] - Differentiators: ${serverResult.differentiators.length}`);
      console.log(`[DataCollection] - Buyer Personas: ${serverResult.buyerPersonas.length}`);
      console.log(`[DataCollection] - Transformations: ${serverResult.transformations.length}`);
      console.log(`[DataCollection] - Benefits: ${serverResult.benefits.length}`);
      console.log(`[DataCollection] - Value Propositions (UI): ${valuePropositions.length}`);
      console.log(`[DataCollection] - Industry EQ: ${industryEQScore}%`);
      console.log(`[DataCollection] - Data Quality: ${dataQuality}`);
      console.log('[DataCollection] ========================================');

      return {
        valuePropositions,
        customerTriggers,
        buyerPersonas,
        transformations,
        industryEQScore,
        coreTruth,
        // Pass through ALL raw extraction data for UVP flow (avoids redundant AI calls)
        rawProductsData: legacy.products,
        rawCustomersData: legacy.customers,
        rawDifferentiatorsData: legacy.differentiators,
        rawBuyerIntelData: legacy.buyerIntelligence,
        rawTransformationsData: legacy.transformations,
        rawBenefitsData: legacy.benefits,
        collectionTimestamp: new Date(),
        dataQuality,
        warnings: []
      };

    } catch (error) {
      console.error('[DataCollection] Collection failed:', error);
      throw new Error(`Data collection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // =========================================================================
  // LEGACY METHODS (kept for backward compatibility if needed)
  // These were used by the old serial extraction system
  // =========================================================================

  /**
   * Transform deep scan results to value propositions
   * NOW WITH JTBD TRANSFORMATION: Feature-focused → Outcome-focused
   */
  private transformToValuePropositions(
    scanResult: any,
    businessName: string,
    sourceUrl: string
  ): ValueProposition[] {
    const propositions: ValueProposition[] = [];

    // Create value propositions from primary services
    scanResult.primaryServices.slice(0, 5).forEach((serviceName: string, index: number) => {
      const service = scanResult.services.find((s: any) => s.name === serviceName);
      if (!service) return;

      const sources: DataSource[] = service.sources.map((src: any) => ({
        type: src.type === 'navigation' ? 'website' as const :
              src.type === 'pricing-table' ? 'pricing' as const : 'website' as const,
        url: sourceUrl,
        snippet: src.matchedText,
        confidence: Math.round(src.confidence * 100)
      }));

      const confidence: ConfidenceScore = {
        overall: Math.round(service.confidence * 100),
        dataQuality: Math.round((service.sources.length / 3) * 100),
        sourceCount: service.sources.length,
        modelAgreement: Math.round(service.confidence * 100),
        reasoning: `Found via ${service.sources.map((s: any) => s.type).join(', ')}`
      };

      const proposition: ValueProposition = {
        id: `vp-${Date.now()}-${index}`,
        statement: `We help businesses ${service.description.toLowerCase()}`,
        // outcomeStatement will be populated by enrichValuePropositionsWithJTBD() later
        outcomeStatement: undefined,
        category: index === 0 ? 'core' : 'secondary',
        confidence,
        sources,
        marketPosition: service.pricing ? 'Premium specialist' : 'Value leader',
        differentiators: service.features.slice(0, 3),
        validated: false,
        jtbdInsights: undefined
      };

      propositions.push(proposition);
    });

    return propositions;
  }

  /**
   * Enrich value propositions with JTBD outcome-focused transformations
   */
  private async enrichValuePropositionsWithJTBD(
    propositions: ValueProposition[],
    businessName: string,
    industry: string
  ): Promise<ValueProposition[]> {
    if (propositions.length === 0) {
      return propositions;
    }

    try {
      // Extract feature statements
      const featureStatements = propositions.map(p => p.statement);

      // Apply JTBD transformation
      const transformed = await jtbdTransformer.transformValuePropositions(
        featureStatements,
        {
          businessName,
          industry,
          // Pass additional context if available
          targetAudience: [], // Could be enriched with data from buyerData
          customerProblems: [],
          solutions: featureStatements,
          differentiators: propositions[0]?.differentiators || []
        }
      );

      // Enrich propositions with outcome statements
      const enriched = propositions.map((prop, index) => {
        // Primary gets the primary transformation
        if (index === 0 && transformed.primary) {
          return {
            ...prop,
            outcomeStatement: transformed.primary.outcomeStatement,
            jtbdInsights: {
              functionalJob: transformed.primary.jtbd.functionalJob,
              emotionalJob: transformed.primary.jtbd.emotionalJob,
              painReliever: transformed.primary.value.painReliever,
              gainCreator: transformed.primary.value.gainCreator
            }
          };
        }

        // Supporting props get supporting transformations
        const supportingIndex = index - 1;
        if (supportingIndex >= 0 && supportingIndex < transformed.supporting.length) {
          const supporting = transformed.supporting[supportingIndex];
          return {
            ...prop,
            outcomeStatement: supporting.outcomeStatement,
            jtbdInsights: {
              functionalJob: supporting.jtbd.functionalJob,
              emotionalJob: supporting.jtbd.emotionalJob,
              painReliever: supporting.value.painReliever,
              gainCreator: supporting.value.gainCreator
            }
          };
        }

        // Fallback: no transformation available
        return prop;
      });

      return enriched;

    } catch (error) {
      console.error('[DataCollection] JTBD enrichment failed:', error);
      // Return original propositions if transformation fails
      return propositions;
    }
  }

  /**
   * Transform buyer intelligence to customer triggers
   */
  private transformToCustomerTriggers(buyerData: any, sourceUrl: string): CustomerTrigger[] {
    const triggers: CustomerTrigger[] = [];

    // Defensive: ensure buyerData has expected structure
    const painPoints = buyerData?.common_pain_points || [];
    const outcomes = buyerData?.common_outcomes || [];

    // Extract triggers from common pain points
    painPoints.forEach((painPoint: any, index: number) => {
      const sources: DataSource[] = painPoint.evidence?.slice(0, 2).map((quote: string) => ({
        type: 'testimonial' as const,
        url: sourceUrl,
        snippet: quote,
        confidence: 85
      })) || [];

      const trigger: CustomerTrigger = {
        id: `trigger-pain-${index}`,
        type: 'pain',
        description: painPoint.description,
        urgency: this.mapIntensityToNumber(painPoint.intensity),
        frequency: painPoint.frequency || 50,
        emotionalWeight: this.mapCategoryToEQ(painPoint.category),
        sources
      };

      triggers.push(trigger);
    });

    // Extract triggers from desired outcomes
    outcomes.forEach((outcome: any, index: number) => {
      const sources: DataSource[] = outcome.evidence?.slice(0, 2).map((quote: string) => ({
        type: 'case-study' as const,
        url: sourceUrl,
        snippet: quote,
        confidence: 90
      })) || [];

      const trigger: CustomerTrigger = {
        id: `trigger-desire-${index}`,
        type: 'desire',
        description: outcome.description,
        urgency: 70,
        frequency: 60,
        emotionalWeight: outcome.emotional_benefit ? 80 : 50,
        sources
      };

      triggers.push(trigger);
    });

    return triggers;
  }

  /**
   * Transform buyer intelligence to buyer personas
   */
  private transformToBuyerPersonas(buyerData: any): BuyerPersona[] {
    const personas = buyerData?.personas || [];
    if (personas.length === 0) return [];

    return personas.map((persona: any, index: number) => {
      const confidence: ConfidenceScore = {
        overall: persona.confidence_score,
        dataQuality: persona.sample_size > 3 ? 80 : 60,
        sourceCount: persona.evidence_sources.length,
        modelAgreement: persona.confidence_score,
        reasoning: `Based on ${persona.sample_size} customer examples`
      };

      // Calculate decision drivers from buying behavior
      const emotionalScore = persona.buying_behavior.relationship_vs_transactional === 'relationship' ? 70 : 40;
      const rationalScore = persona.buying_behavior.research_intensity === 'heavy' ? 80 : 50;
      const socialScore = persona.role.influence_level === 'high' ? 75 : 40;

      return {
        id: persona.id,
        name: persona.persona_name,
        archetype: `${persona.role.title} seeking ${persona.desired_outcomes[0]?.description || 'better solutions'}`,
        demographics: {
          ageRange: undefined, // Not extracted by buyer intelligence service
          income: undefined,
          location: persona.industry.primary_industry
        },
        psychographics: {
          values: persona.desired_outcomes.map((o: any) => o.description).slice(0, 3),
          fears: persona.pain_points.filter((p: any) => p.category === 'risk').map((p: any) => p.description),
          goals: persona.desired_outcomes.map((o: any) => o.metric || o.description).slice(0, 3)
        },
        decisionDrivers: {
          emotional: emotionalScore,
          rational: rationalScore,
          social: socialScore
        },
        confidence
      };
    });
  }

  /**
   * Transform buyer intelligence to transformations
   */
  private transformToTransformations(buyerData: any): Transformation[] {
    const transformations: Transformation[] = [];
    const personas = buyerData?.personas || [];
    if (personas.length === 0) return [];

    personas.forEach((persona: any) => {
      const metrics = persona?.success_metrics || [];
      metrics.forEach((metric: any, index: number) => {
        if (!metric.baseline || !metric.achieved) return;

        const painPoint = persona.pain_points[0]?.description || `${metric.category}: ${metric.baseline}`;
        const pleasureGoal = persona.desired_outcomes[0]?.description || `${metric.category}: ${metric.achieved}`;
        const mechanism = persona.desired_outcomes[0]?.metric || 'Strategic implementation and optimization';

        const confidence: ConfidenceScore = {
          overall: persona.confidence_score,
          dataQuality: persona.sample_size > 3 ? 80 : 60,
          sourceCount: persona.evidence_sources.length,
          modelAgreement: persona.confidence_score,
          reasoning: `Based on ${persona.sample_size} customer examples with ${metric.improvement || 'measurable'} improvement`
        };

        const transformation: Transformation = {
          id: `transform-${persona.id}-${index}`,
          painPoint,
          pleasureGoal,
          mechanism,
          clarity: Math.round((persona.confidence_score / 100) * 100), // 0-100 scale
          confidence
        };

        transformations.push(transformation);
      });
    });

    return transformations.slice(0, 5); // Top 5 transformations
  }

  /**
   * Synthesize core truth from all gathered data
   */
  private synthesizeCoreTruth(
    businessName: string,
    industry: string,
    valueProps: ValueProposition[],
    personas: BuyerPersona[],
    eqScore: number,
    websiteData: WebsiteData
  ): CoreTruth {
    const coreVP = valueProps.find(vp => vp.category === 'core') || valueProps[0];
    const topPersona = personas[0];

    const messagingPillars: MessagingPillar[] = valueProps.slice(0, 3).map((vp, index) => ({
      id: `pillar-${index}`,
      title: vp.statement.split(' ').slice(0, 4).join(' '),
      description: vp.statement,
      supportingPoints: vp.differentiators,
      whenToUse: vp.category === 'core' ? 'Primary messaging in all content' :
                 'Secondary messaging for specific use cases'
    }));

    const emotionalTone = eqScore > 70 ? 'Inspiring and aspirational' :
                         eqScore > 40 ? 'Balanced and approachable' :
                         'Professional and analytical';

    const confidence: ConfidenceScore = {
      overall: Math.round((valueProps[0]?.confidence.overall + (topPersona?.confidence.overall || 70)) / 2),
      dataQuality: 80,
      sourceCount: valueProps.reduce((sum, vp) => sum + vp.sources.length, 0),
      modelAgreement: 85,
      reasoning: 'Synthesized from value propositions and buyer personas'
    };

    return {
      id: `core-truth-${Date.now()}`,
      narrative: `${businessName} transforms ${topPersona?.name || 'businesses'} by ${coreVP?.statement || 'delivering exceptional value'}. We understand that ${personas[0]?.psychographics.fears[0] || 'quality matters'}, and we're committed to ${valueProps[0]?.differentiators[0] || 'exceptional service'}.`,
      tagline: websiteData.metadata.description?.split('.')[0] || `${businessName}: ${industry} Excellence`,
      positioning: `The ${coreVP?.marketPosition || 'trusted'} choice for ${topPersona?.archetype || 'businesses seeking quality'}`,
      messagingPillars,
      brandVoice: {
        personality: [emotionalTone, 'Customer-focused', 'Authentic'],
        tone: ['Professional', eqScore > 60 ? 'Warm' : 'Clear', 'Confident'],
        avoidWords: ['Cheap', 'Basic', 'Simple', 'Just']
      },
      keyTransformation: {
        id: 'key-transformation',
        painPoint: personas[0]?.psychographics.fears[0] || 'Struggling with challenges',
        pleasureGoal: personas[0]?.psychographics.goals[0] || 'Achieving success',
        mechanism: `Partnering with ${businessName} to implement proven strategies`,
        clarity: 80,
        confidence: {
          overall: 75,
          dataQuality: 70,
          sourceCount: personas.length,
          modelAgreement: 80,
          reasoning: 'Synthesized from buyer persona insights and common transformation patterns'
        }
      },
      confidence
    };
  }

  /**
   * Helper: Prepare website content as string
   */
  private prepareContentString(websiteData: WebsiteData): string {
    return [
      ...websiteData.content.headings,
      ...websiteData.content.paragraphs
    ].join('\n');
  }

  /**
   * Helper: Extract testimonials from website data
   */
  private extractTestimonials(websiteData: WebsiteData): string[] {
    // Look for testimonial-like paragraphs (quotes, customer stories)
    return websiteData.content.paragraphs.filter(p =>
      p.includes('"') || p.includes('helped') || p.includes('amazing') || p.length > 100
    ).slice(0, 10);
  }

  /**
   * Helper: Map intensity to number
   */
  private mapIntensityToNumber(intensity: string): number {
    switch (intensity?.toLowerCase()) {
      case 'critical': return 90;
      case 'high': return 75;
      case 'medium': return 50;
      case 'low': return 25;
      default: return 50;
    }
  }

  /**
   * Helper: Map pain category to EQ weight
   */
  private mapCategoryToEQ(category: string): number {
    switch (category?.toLowerCase()) {
      case 'time': return 70;
      case 'cost': return 60;
      case 'quality': return 75;
      case 'trust': return 85;
      case 'expertise': return 65;
      case 'risk': return 80;
      default: return 60;
    }
  }

  /**
   * Helper: Assess overall data quality
   */
  private assessOverallQuality(
    scanConfidence: number,
    buyerQuality: string,
    eqScore: number
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    const avgConfidence = (scanConfidence * 100 + (buyerQuality === 'excellent' ? 90 : buyerQuality === 'good' ? 70 : 50)) / 2;

    if (avgConfidence >= 80) return 'excellent';
    if (avgConfidence >= 65) return 'good';
    if (avgConfidence >= 45) return 'fair';
    return 'poor';
  }
}

// Export singleton instance
export const dataCollectionService = new DataCollectionService();
