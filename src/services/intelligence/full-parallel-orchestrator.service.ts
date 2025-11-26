/**
 * Full Parallel Intelligence Orchestrator Service
 *
 * Runs ALL focused extractors in PARALLEL for maximum speed + complete data.
 *
 * Architecture:
 * ┌─────────────────────────────────────────────────────────────────────────────────────┐
 * │                    PHASE 1: ALL INDEPENDENT EXTRACTORS IN PARALLEL (~50-60s)        │
 * │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
 * │  │ Products     │ │ Customers    │ │Differentiators│ │ Buyer Intel │               │
 * │  │ (18 items)   │ │ (10 profiles)│ │ (focused)    │ │ (personas)  │               │
 * │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘               │
 * │  ┌──────────────┐                                                                   │
 * │  │Transformations│                                                                  │
 * │  │ (focused)    │                                                                   │
 * │  └──────────────┘                                                                   │
 * └─────────────────────────────────────────────────────────────────────────────────────┘
 *                                         ↓
 * ┌─────────────────────────────────────────────────────────────────────────────────────┐
 * │            PHASE 2: DEPENDENT EXTRACTORS IN PARALLEL (~15-20s additional)           │
 * │  ┌──────────────┐ ┌──────────────┐                                                  │
 * │  │ Benefits     │ │ JTBD         │                                                  │
 * │  │ (uses trans) │ │ (outcomes)   │                                                  │
 * │  └──────────────┘ └──────────────┘                                                  │
 * └─────────────────────────────────────────────────────────────────────────────────────┘
 *                                         ↓
 *                         Local synthesis & EQ calculation (~100ms)
 *
 * TOTAL TARGET: ~50-60 seconds with COMPLETE data
 *
 * Created: 2025-11-25
 */

import type { WebsiteData } from '@/services/scraping/websiteScraper';
import type { DataSource } from '@/components/onboarding-v5/SourceCitation';
import type { ConfidenceScore } from '@/components/onboarding-v5/ConfidenceMeter';
import type { ValueProposition } from '@/components/onboarding-v5/ValuePropositionPage';
import type { CustomerTrigger, BuyerPersona } from '@/components/onboarding-v5/BuyerIntelligencePage';
import type { CoreTruth, MessagingPillar } from '@/components/onboarding-v5/CoreTruthPage';
import type { Transformation } from '@/components/onboarding-v5/TransformationCascade';
import type { ProductServiceExtractionResult, CustomerExtractionResult, DifferentiatorExtractionResult, BenefitExtractionResult } from '@/types/uvp-flow.types';
import type { BuyerIntelligenceResult } from '@/types/buyer-persona.types';
import type { SmartTransformationResult } from '@/services/uvp-extractors/smart-transformation-generator.service';
import type { TransformedValueProps } from '@/services/intelligence/jtbd-transformer.service';

// Import original focused extractors
import { extractProductsServices } from '@/services/uvp-extractors/product-service-extractor.service';
import { extractTargetCustomer } from '@/services/uvp-extractors/customer-extractor.service';
import { extractDifferentiators } from '@/services/uvp-extractors/differentiator-extractor.service';
import { extractBenefits } from '@/services/uvp-extractors/benefit-extractor.service';
import { buyerIntelligenceExtractor } from '@/services/intelligence/buyer-intelligence-extractor.service';
import { generateSmartTransformations } from '@/services/uvp-extractors/smart-transformation-generator.service';
import { jtbdTransformer } from '@/services/intelligence/jtbd-transformer.service';
import { eqCalculator } from '@/services/ai/eq-calculator.service';

/**
 * Complete intelligence package with ALL extracted data
 */
export interface FullIntelligencePackage {
  // Raw extraction results (complete data)
  products: ProductServiceExtractionResult;
  customers: CustomerExtractionResult;
  differentiators: DifferentiatorExtractionResult;
  buyerIntelligence: BuyerIntelligenceResult;
  transformations: SmartTransformationResult;
  benefits: BenefitExtractionResult;
  jtbdOutcomes: TransformedValueProps | null;

  // UI-ready data
  valuePropositions: ValueProposition[];
  customerTriggers: CustomerTrigger[];
  buyerPersonas: BuyerPersona[];
  uiTransformations: Transformation[];
  coreTruth: CoreTruth;

  // Metrics
  industryEQScore: number;
  collectionTimestamp: Date;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  extractionDuration: number;
  phase1Duration: number;
  phase2Duration: number;
  warnings: string[];
}

/**
 * Progress callback for real-time updates
 */
export type FullIntelligenceProgress = {
  stage: 'phase1_parallel' | 'phase2_dependent' | 'synthesis' | 'complete';
  progress: number;
  message: string;
  details?: string;
  duration?: number;
};

class FullParallelOrchestratorService {
  /**
   * Execute full parallel intelligence extraction
   * Runs 5 independent extractors in parallel, then 2 dependent ones
   */
  async extractFullIntelligence(
    websiteData: WebsiteData,
    businessName: string,
    industry: string,
    onProgress?: (progress: FullIntelligenceProgress) => void
  ): Promise<FullIntelligencePackage> {
    const startTime = Date.now();
    const warnings: string[] = [];

    console.log('[FullParallelOrchestrator] Starting FULL parallel extraction...');
    console.log(`  - Business: ${businessName}`);
    console.log(`  - Industry: ${industry}`);
    console.log(`  - URL: ${websiteData.url}`);

    try {
      // ============================================
      // PHASE 1: ALL INDEPENDENT EXTRACTORS IN PARALLEL
      // ============================================
      onProgress?.({
        stage: 'phase1_parallel',
        progress: 10,
        message: 'Starting Phase 1: Independent extractors',
        details: 'Running 5 focused extractors in parallel'
      });

      const phase1Start = Date.now();

      // Prepare content arrays for extractors
      const contentArray = [
        ...websiteData.content.headings,
        ...websiteData.content.paragraphs
      ];
      const testimonials = this.extractTestimonials(websiteData);

      // Run ALL independent extractors in PARALLEL
      const [
        productsResult,
        customersResult,
        differentiatorsResult,
        buyerIntelResult,
        transformationsResult
      ] = await Promise.all([
        // 1. Products/Services
        extractProductsServices(websiteData, [websiteData.url], businessName, industry)
          .catch(err => {
            console.error('[FullParallelOrchestrator] Products extraction failed:', err);
            warnings.push('Products extraction failed');
            return this.emptyProductsResult();
          }),

        // 2. Target Customers (with drivers!)
        extractTargetCustomer(contentArray, testimonials, [], businessName)
          .catch(err => {
            console.error('[FullParallelOrchestrator] Customers extraction failed:', err);
            warnings.push('Customer extraction failed');
            return this.emptyCustomersResult();
          }),

        // 3. Differentiators
        extractDifferentiators(contentArray, [websiteData.url], [], businessName, industry)
          .catch(err => {
            console.error('[FullParallelOrchestrator] Differentiators extraction failed:', err);
            warnings.push('Differentiator extraction failed');
            return this.emptyDifferentiatorsResult();
          }),

        // 4. Buyer Intelligence (personas)
        buyerIntelligenceExtractor.extractBuyerPersonas({
          url: websiteData.url,
          content: contentArray.join('\n'),
          testimonials,
          case_studies: [],
          about_page: '',
          services: []
        }).catch(err => {
          console.error('[FullParallelOrchestrator] Buyer intelligence failed:', err);
          warnings.push('Buyer intelligence extraction failed');
          return this.emptyBuyerIntelResult();
        }),

        // 5. Transformations
        generateSmartTransformations({
          businessName,
          industry,
          testimonials,
          websiteParagraphs: websiteData.content.paragraphs
        }).catch(err => {
          console.error('[FullParallelOrchestrator] Transformations failed:', err);
          warnings.push('Transformation generation failed');
          return this.emptyTransformationsResult();
        })
      ]);

      const phase1Duration = Date.now() - phase1Start;
      console.log(`[FullParallelOrchestrator] Phase 1 complete in ${phase1Duration}ms`);
      console.log(`  - Products: ${productsResult.products.length}`);
      console.log(`  - Customers: ${customersResult.profiles.length}`);
      console.log(`  - Differentiators: ${differentiatorsResult.differentiators.length}`);
      console.log(`  - Buyer personas: ${buyerIntelResult.personas.length}`);
      console.log(`  - Transformations: ${transformationsResult.goals.length}`);

      onProgress?.({
        stage: 'phase1_parallel',
        progress: 60,
        message: 'Phase 1 complete',
        details: `${productsResult.products.length} products, ${customersResult.profiles.length} customers`,
        duration: phase1Duration
      });

      // ============================================
      // PHASE 2: DEPENDENT EXTRACTORS IN PARALLEL
      // ============================================
      onProgress?.({
        stage: 'phase2_dependent',
        progress: 65,
        message: 'Starting Phase 2: Dependent extractors',
        details: 'Running benefits and JTBD in parallel'
      });

      const phase2Start = Date.now();

      // Run dependent extractors in PARALLEL
      const [benefitsResult, jtbdResult] = await Promise.all([
        // Benefits (needs transformations and solutions)
        extractBenefits(
          transformationsResult.goals,
          productsResult.products,
          contentArray,
          businessName,
          industry,
          customersResult.profiles
        ).catch(err => {
          console.error('[FullParallelOrchestrator] Benefits extraction failed:', err);
          warnings.push('Benefits extraction failed');
          return this.emptyBenefitsResult();
        }),

        // JTBD Transformer (can use product descriptions)
        jtbdTransformer.transformValuePropositions(
          productsResult.products.slice(0, 5).map(p => p.description || p.name),
          {
            businessName,
            industry,
            targetAudience: customersResult.profiles.map(c => c.statement || ''),
            customerProblems: buyerIntelResult.personas
              .flatMap(p => p.pain_points?.map(pp => pp.description) || []),
            solutions: productsResult.products.map(p => p.name),
            differentiators: differentiatorsResult.differentiators.map(d => d.statement)
          }
        ).catch(err => {
          console.error('[FullParallelOrchestrator] JTBD transformation failed:', err);
          warnings.push('JTBD transformation failed');
          return null;
        })
      ]);

      const phase2Duration = Date.now() - phase2Start;
      console.log(`[FullParallelOrchestrator] Phase 2 complete in ${phase2Duration}ms`);
      console.log(`  - Benefits: ${benefitsResult.keyBenefits?.length || 0}`);
      console.log(`  - JTBD: ${jtbdResult ? 'success' : 'failed'}`);

      onProgress?.({
        stage: 'phase2_dependent',
        progress: 85,
        message: 'Phase 2 complete',
        details: `Benefits and JTBD extracted`,
        duration: phase2Duration
      });

      // ============================================
      // SYNTHESIS: Build UI-ready data
      // ============================================
      onProgress?.({
        stage: 'synthesis',
        progress: 90,
        message: 'Synthesizing results',
        details: 'Building UI data structures'
      });

      // Calculate EQ score (local, fast)
      const industryContent = contentArray.join(' ');
      const eqScore = eqCalculator.calculateEQ(industryContent);
      console.log(`[FullParallelOrchestrator] EQ Score: ${eqScore.overall}%`);

      // Transform to UI formats
      const valuePropositions = this.buildValuePropositions(
        productsResult,
        differentiatorsResult,
        jtbdResult,
        websiteData.url
      );
      const customerTriggers = this.buildCustomerTriggers(buyerIntelResult);
      const buyerPersonas = this.buildBuyerPersonas(buyerIntelResult);
      const uiTransformations = this.buildUITransformations(transformationsResult, buyerIntelResult);
      const coreTruth = this.buildCoreTruth(
        businessName,
        industry,
        valuePropositions,
        buyerPersonas,
        eqScore.overall,
        differentiatorsResult
      );

      const totalDuration = Date.now() - startTime;

      // Assess data quality
      const dataQuality = this.assessDataQuality(
        productsResult.products.length,
        customersResult.profiles.length,
        buyerIntelResult.personas.length
      );

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Extraction complete',
        details: `Total: ${(totalDuration / 1000).toFixed(1)}s`,
        duration: totalDuration
      });

      console.log('[FullParallelOrchestrator] ========================================');
      console.log(`[FullParallelOrchestrator] EXTRACTION COMPLETE`);
      console.log(`[FullParallelOrchestrator] Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(1)}s)`);
      console.log(`[FullParallelOrchestrator] - Phase 1 (5 extractors): ${phase1Duration}ms`);
      console.log(`[FullParallelOrchestrator] - Phase 2 (2 extractors): ${phase2Duration}ms`);
      console.log(`[FullParallelOrchestrator] Results:`);
      console.log(`[FullParallelOrchestrator] - Products: ${productsResult.products.length}`);
      console.log(`[FullParallelOrchestrator] - Customers: ${customersResult.profiles.length}`);
      console.log(`[FullParallelOrchestrator] - Differentiators: ${differentiatorsResult.differentiators.length}`);
      console.log(`[FullParallelOrchestrator] - Buyer Personas: ${buyerIntelResult.personas.length}`);
      console.log(`[FullParallelOrchestrator] - Transformations: ${transformationsResult.goals.length}`);
      console.log(`[FullParallelOrchestrator] - Benefits: ${benefitsResult.keyBenefits?.length || 0}`);
      console.log(`[FullParallelOrchestrator] - Industry EQ: ${eqScore.overall}%`);
      console.log(`[FullParallelOrchestrator] - Data Quality: ${dataQuality}`);
      console.log('[FullParallelOrchestrator] ========================================');

      return {
        // Raw results
        products: productsResult,
        customers: customersResult,
        differentiators: differentiatorsResult,
        buyerIntelligence: buyerIntelResult,
        transformations: transformationsResult,
        benefits: benefitsResult,
        jtbdOutcomes: jtbdResult,

        // UI-ready data
        valuePropositions,
        customerTriggers,
        buyerPersonas,
        uiTransformations,
        coreTruth,

        // Metrics
        industryEQScore: eqScore.overall,
        collectionTimestamp: new Date(),
        dataQuality,
        extractionDuration: totalDuration,
        phase1Duration,
        phase2Duration,
        warnings
      };

    } catch (error) {
      console.error('[FullParallelOrchestrator] Fatal error:', error);
      throw new Error(`Full parallel extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================
  // TRANSFORMATION HELPERS
  // ============================================

  private buildValuePropositions(
    products: ProductServiceExtractionResult,
    differentiators: DifferentiatorExtractionResult,
    jtbd: TransformedValueProps | null,
    sourceUrl: string
  ): ValueProposition[] {
    return products.products.slice(0, 10).map((product, index) => {
      const jtbdOutcome = index === 0 && jtbd?.primary
        ? jtbd.primary.outcomeStatement
        : (jtbd?.supporting?.[index - 1]?.outcomeStatement || undefined);

      return {
        id: `vp-${Date.now()}-${index}`,
        statement: product.description || product.name,
        outcomeStatement: jtbdOutcome,
        category: index === 0 ? 'core' : 'secondary',
        confidence: {
          overall: product.confidence,
          dataQuality: product.confidence,
          sourceCount: 1,
          modelAgreement: product.confidence,
          reasoning: `Extracted from ${product.category}`
        },
        sources: [{
          id: `source-${Date.now()}-${index}`,
          type: 'website' as const,
          name: 'Website Content',
          url: sourceUrl,
          extractedAt: new Date(),
          reliability: product.confidence,
          dataPoints: 1,
          excerpt: product.sourceExcerpt
        }],
        marketPosition: 'Value leader',
        differentiators: differentiators.differentiators.slice(0, 3).map(d => d.statement),
        validated: false
      };
    });
  }

  private buildCustomerTriggers(buyerIntel: BuyerIntelligenceResult): CustomerTrigger[] {
    const triggers: CustomerTrigger[] = [];

    // From common pain points
    (buyerIntel.common_pain_points || []).forEach((pp, index) => {
      triggers.push({
        id: `trigger-pain-${index}`,
        type: 'pain',
        description: typeof pp === 'string' ? pp : pp.description,
        urgency: 70,
        frequency: 60,
        emotionalWeight: 70,
        sources: []
      });
    });

    // From common outcomes
    (buyerIntel.common_outcomes || []).forEach((outcome, index) => {
      triggers.push({
        id: `trigger-desire-${index}`,
        type: 'desire',
        description: typeof outcome === 'string' ? outcome : outcome.description,
        urgency: 60,
        frequency: 50,
        emotionalWeight: 65,
        sources: []
      });
    });

    return triggers;
  }

  private buildBuyerPersonas(buyerIntel: BuyerIntelligenceResult): BuyerPersona[] {
    return (buyerIntel.personas || []).map(persona => ({
      id: persona.id,
      name: persona.persona_name,
      archetype: `${persona.role?.title || 'Professional'} in ${persona.industry?.primary_industry || 'business'}`,
      demographics: {
        location: persona.industry?.primary_industry
      },
      psychographics: {
        values: persona.desired_outcomes?.map(o => o.description).slice(0, 3) || [],
        fears: persona.pain_points?.filter(p => p.category === 'risk').map(p => p.description) || [],
        goals: persona.desired_outcomes?.map(o => o.metric || o.description).slice(0, 3) || []
      },
      decisionDrivers: {
        emotional: persona.buying_behavior?.relationship_vs_transactional === 'relationship' ? 70 : 40,
        rational: persona.buying_behavior?.research_intensity === 'heavy' ? 80 : 50,
        social: persona.role?.influence_level === 'high' ? 75 : 40
      },
      confidence: {
        overall: persona.confidence_score || 70,
        dataQuality: 70,
        sourceCount: (persona.evidence_sources || []).length,
        modelAgreement: persona.confidence_score || 70,
        reasoning: `Based on ${persona.sample_size || 0} customer examples`
      }
    }));
  }

  private buildUITransformations(
    transformations: SmartTransformationResult,
    buyerIntel: BuyerIntelligenceResult
  ): Transformation[] {
    const result: Transformation[] = [];

    // From transformation goals
    transformations.goals.forEach((goal, index) => {
      result.push({
        id: `transform-${Date.now()}-${index}`,
        painPoint: goal.fromState || 'Current challenge',
        pleasureGoal: goal.toState || 'Desired outcome',
        mechanism: goal.mechanism || 'Through our solution',
        clarity: goal.confidence || 70,
        confidence: {
          overall: goal.confidence || 70,
          dataQuality: 70,
          sourceCount: 1,
          modelAgreement: goal.confidence || 70,
          reasoning: goal.evidence || 'From transformation analysis'
        }
      });
    });

    // Add from buyer personas if we need more
    if (result.length < 3) {
      buyerIntel.personas?.slice(0, 3 - result.length).forEach((persona, index) => {
        const pain = persona.pain_points?.[0]?.description || 'Business challenge';
        const outcome = persona.desired_outcomes?.[0]?.description || 'Business goal';

        result.push({
          id: `transform-persona-${index}`,
          painPoint: pain,
          pleasureGoal: outcome,
          mechanism: 'Through strategic partnership',
          clarity: 60,
          confidence: {
            overall: 60,
            dataQuality: 60,
            sourceCount: 1,
            modelAgreement: 60,
            reasoning: 'Derived from buyer persona'
          }
        });
      });
    }

    return result.slice(0, 5);
  }

  private buildCoreTruth(
    businessName: string,
    industry: string,
    valueProps: ValueProposition[],
    personas: BuyerPersona[],
    eqScore: number,
    differentiators: DifferentiatorExtractionResult
  ): CoreTruth {
    const coreVP = valueProps.find(vp => vp.category === 'core') || valueProps[0];
    const topPersona = personas[0];
    const topDiff = differentiators.differentiators[0];

    const messagingPillars: MessagingPillar[] = valueProps.slice(0, 3).map((vp, index) => ({
      id: `pillar-${index}`,
      title: vp.statement.split(' ').slice(0, 4).join(' '),
      description: vp.outcomeStatement || vp.statement,
      supportingPoints: vp.differentiators || [],
      whenToUse: vp.category === 'core' ? 'Primary messaging' : 'Secondary messaging'
    }));

    const emotionalTone = eqScore > 70 ? 'Inspiring and aspirational' :
                         eqScore > 40 ? 'Balanced and approachable' :
                         'Professional and analytical';

    return {
      id: `core-truth-${Date.now()}`,
      narrative: topDiff?.statement ||
        `${businessName} transforms ${topPersona?.name || 'businesses'} by ${coreVP?.statement || 'delivering exceptional value'}.`,
      tagline: `${businessName}: ${industry} Excellence`,
      positioning: `The trusted choice for ${topPersona?.archetype || 'businesses'}`,
      messagingPillars,
      brandVoice: {
        personality: [emotionalTone, 'Customer-focused', 'Authentic'],
        tone: ['Professional', eqScore > 60 ? 'Warm' : 'Clear', 'Confident'],
        avoidWords: ['Cheap', 'Basic', 'Simple', 'Just']
      },
      keyTransformation: {
        id: 'key-transformation',
        painPoint: topPersona?.psychographics.fears[0] || 'Current challenges',
        pleasureGoal: topPersona?.psychographics.goals[0] || 'Business success',
        mechanism: `Partnering with ${businessName}`,
        clarity: 80,
        confidence: {
          overall: 75,
          dataQuality: 70,
          sourceCount: personas.length,
          modelAgreement: 80,
          reasoning: 'Synthesized from buyer insights'
        }
      },
      confidence: {
        overall: Math.round(((coreVP?.confidence.overall || 70) + (topPersona?.confidence.overall || 70)) / 2),
        dataQuality: 80,
        sourceCount: valueProps.reduce((sum, vp) => sum + vp.sources.length, 0),
        modelAgreement: 85,
        reasoning: 'Synthesized from full parallel extraction'
      }
    };
  }

  // ============================================
  // UTILITY HELPERS
  // ============================================

  private extractTestimonials(websiteData: WebsiteData): string[] {
    return websiteData.content.paragraphs.filter(p =>
      p.includes('"') || p.includes('helped') || p.includes('amazing') || p.length > 100
    ).slice(0, 10);
  }

  private assessDataQuality(
    productsCount: number,
    customersCount: number,
    personasCount: number
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    const total = productsCount + customersCount + personasCount;
    if (total >= 20) return 'excellent';
    if (total >= 12) return 'good';
    if (total >= 6) return 'fair';
    return 'poor';
  }

  // ============================================
  // EMPTY RESULT FACTORIES
  // ============================================

  private emptyProductsResult(): ProductServiceExtractionResult {
    return {
      products: [],
      categories: [],
      confidence: { overall: 0, dataQuality: 0, sourceCount: 0, modelAgreement: 0, reasoning: 'Extraction failed' },
      sources: [],
      extractionComplete: false
    };
  }

  private emptyCustomersResult(): CustomerExtractionResult {
    return {
      profiles: [],
      confidence: { overall: 0, dataQuality: 0, sourceCount: 0, modelAgreement: 0, reasoning: 'Extraction failed' },
      sources: [],
      evidenceQuotes: []
    };
  }

  private emptyDifferentiatorsResult(): DifferentiatorExtractionResult {
    return {
      differentiators: [],
      methodology: undefined,
      proprietaryApproach: undefined,
      confidence: { overall: 0, dataQuality: 0, sourceCount: 0, modelAgreement: 0, reasoning: 'Extraction failed' },
      sources: []
    };
  }

  private emptyBuyerIntelResult(): BuyerIntelligenceResult {
    return {
      personas: [],
      common_pain_points: [],
      common_outcomes: [],
      industry_patterns: [],
      extraction_quality: 'poor',
      data_sources: []
    };
  }

  private emptyTransformationsResult(): SmartTransformationResult {
    return {
      goals: [],
      source: 'generated',
      confidence: 0,
      method: 'fallback'
    };
  }

  private emptyBenefitsResult(): BenefitExtractionResult {
    return {
      keyBenefits: [],
      metrics: [],
      emotionalOutcomes: [],
      functionalOutcomes: [],
      socialOutcomes: [],
      confidence: { overall: 0, dataQuality: 0, sourceCount: 0, modelAgreement: 0, reasoning: 'Extraction failed' },
      sources: []
    };
  }
}

// Export singleton
export const fullParallelOrchestrator = new FullParallelOrchestratorService();
export { FullParallelOrchestratorService };
