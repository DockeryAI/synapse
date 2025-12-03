/**
 * Parallel Intelligence Orchestrator Service
 *
 * Orchestrates the consolidated AI extraction system for sub-60 second performance.
 *
 * Architecture (ALL 3 AI CALLS IN PARALLEL):
 * ┌─────────────────────────────────────────────────────────────────────────────────────┐
 * │                      FULLY PARALLEL EXECUTION (~50-60s)                             │
 * │  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────────┐ │
 * │  │ UnifiedPersona      │  │ UnifiedOfferings    │  │ JTBD Transformer            │ │
 * │  │ - Buyer personas    │  │ - Products/services │  │ - Outcome-focused messaging │ │
 * │  │ - Customer profiles │  │ - Differentiators   │  │ - Golden Circle framework   │ │
 * │  │ - Pain points       │  │ - Methodology       │  │ - Value prop canvas         │ │
 * │  │ - Desired outcomes  │  │                     │  │                             │ │
 * │  └─────────────────────┘  └─────────────────────┘  └─────────────────────────────┘ │
 * └─────────────────────────────────────────────────────────────────────────────────────┘
 *                                         ↓
 * ┌─────────────────────────────────────────────────────────────────────────────────────┐
 * │                         LOCAL SYNTHESIS (~100ms)                                    │
 * │  - Combine extraction results                                                       │
 * │  - Calculate EQ score (local, no AI)                                               │
 * │  - Build UI data structures                                                         │
 * └─────────────────────────────────────────────────────────────────────────────────────┘
 *
 * TOTAL TARGET: ~50-60 seconds (down from 2.5 minutes / 105s after first optimization)
 *
 * Created: 2025-11-25
 * Updated: 2025-11-25 - Moved JTBD to parallel execution
 */

import type { WebsiteData } from '@/services/scraping/websiteScraper';
import type { DataSource } from '@/components/onboarding-v5/SourceCitation';
import type { ConfidenceScore } from '@/components/onboarding-v5/ConfidenceMeter';
import type { ValueProposition } from '@/components/onboarding-v5/ValuePropositionPage';
import type { CustomerTrigger, BuyerPersona } from '@/components/onboarding-v5/BuyerIntelligencePage';
import type { CoreTruth, MessagingPillar } from '@/components/onboarding-v5/CoreTruthPage';
import type { Transformation } from '@/components/onboarding-v5/TransformationCascade';
import type { EQCalculationResult, EQScore } from '@/types/eq-calculator.types';

import {
  unifiedPersonaIntelligence,
  type UnifiedPersonaResult
} from './unified-persona-intelligence.service';
import {
  unifiedOfferingsStrategy,
  type UnifiedOfferingsResult
} from './unified-offerings-strategy.service';
import { jtbdTransformer } from './jtbd-transformer.service';
import { eqIntegration } from '@/services/eq-v2/eq-integration.service';

/**
 * Complete intelligence package from parallel extraction
 */
export interface IntelligencePackage {
  // Page 1: Value Propositions
  valuePropositions: ValueProposition[];

  // Page 2: Buyer Intelligence
  customerTriggers: CustomerTrigger[];
  buyerPersonas: BuyerPersona[];
  transformations: Transformation[];
  industryEQScore: number;

  // Page 3: Core Truth
  coreTruth: CoreTruth;

  // EQ Calculator Results
  eqScore?: EQScore;
  eqFullResult?: EQCalculationResult;

  // Raw extraction data (for UVP flow)
  rawPersonaData?: UnifiedPersonaResult;
  rawOfferingsData?: UnifiedOfferingsResult;

  // Metadata
  collectionTimestamp: Date;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  extractionDuration: number; // milliseconds
  warnings: string[];
}

/**
 * Progress callback for real-time updates
 */
export type IntelligenceProgress = {
  stage: 'parallel_extraction' | 'jtbd_transformation' | 'synthesis' | 'complete';
  progress: number; // 0-100
  message: string;
  details?: string;
  duration?: number;
};

class ParallelIntelligenceOrchestratorService {
  /**
   * Execute parallel intelligence extraction
   *
   * Runs 2 unified AI calls in parallel, then JTBD transformer sequentially
   * Target: sub-60 seconds total
   */
  async extractIntelligence(
    websiteData: WebsiteData,
    businessName: string,
    industry: string,
    onProgress?: (progress: IntelligenceProgress) => void
  ): Promise<IntelligencePackage> {
    const startTime = Date.now();
    const warnings: string[] = [];

    console.log('[Orchestrator] Starting parallel intelligence extraction...');
    console.log(`  - Business: ${businessName}`);
    console.log(`  - Industry: ${industry}`);
    console.log(`  - URL: ${websiteData.url}`);

    try {
      // ============================================
      // STAGE 1: PARALLEL EXTRACTION (~15-20s)
      // ============================================
      onProgress?.({
        stage: 'parallel_extraction',
        progress: 10,
        message: 'Starting parallel AI extraction',
        details: 'Analyzing personas and offerings simultaneously'
      });

      const parallelStartTime = Date.now();

      // Prepare website data for both extractors
      const websiteInput = {
        url: websiteData.url,
        content: this.prepareContentString(websiteData),
        testimonials: this.extractTestimonials(websiteData),
        case_studies: [],
        about_page: '',
        services: []
      };

      // Extract initial value statements from website for JTBD (doesn't need other results)
      const initialValueStatements = this.extractInitialValueStatements(websiteData, businessName);
      console.log(`[Orchestrator] Initial value statements for JTBD: ${initialValueStatements.length}`);

      // Run ALL THREE extractions in PARALLEL using Promise.all
      // JTBD doesn't need persona/offerings results - it uses website content directly
      const [personaResult, offeringsResult, jtbdResult] = await Promise.all([
        unifiedPersonaIntelligence.extractUnifiedPersonas(websiteInput, businessName),
        unifiedOfferingsStrategy.extractUnifiedOfferings(
          websiteData,
          [websiteData.url],
          businessName,
          industry
        ),
        // Run JTBD in parallel with basic context from website
        jtbdTransformer.transformValuePropositions(
          initialValueStatements,
          {
            businessName,
            industry,
            targetAudience: [], // Will be enriched later if needed
            customerProblems: [],
            solutions: [],
            differentiators: []
          }
        ).catch((jtbdError) => {
          console.error('[Orchestrator] JTBD parallel extraction failed:', jtbdError);
          warnings.push('JTBD transformation failed - using basic propositions');
          return null;
        })
      ]);

      const parallelDuration = Date.now() - parallelStartTime;
      console.log(`[Orchestrator] ALL PARALLEL extraction complete in ${parallelDuration}ms`);
      console.log(`  - Personas: ${personaResult.buyerIntelligence.personas.length}`);
      console.log(`  - Products: ${offeringsResult.products.products.length}`);
      console.log(`  - JTBD: ${jtbdResult ? 'success' : 'fallback'}`);

      onProgress?.({
        stage: 'parallel_extraction',
        progress: 70,
        message: 'All parallel extractions complete',
        details: `Found ${personaResult.buyerIntelligence.personas.length} personas, ${offeringsResult.products.products.length} products`,
        duration: parallelDuration
      });

      // ============================================
      // STAGE 2: SYNTHESIS (no more AI calls - just local processing)
      // ============================================
      onProgress?.({
        stage: 'jtbd_transformation',
        progress: 75,
        message: 'Synthesizing results',
        details: 'Combining extractions and calculating EQ'
      });

      const synthesisStartTime = Date.now();

      // Transform value propositions from offerings
      let valuePropositions = this.transformToValuePropositions(
        offeringsResult,
        businessName,
        websiteData.url
      );

      // Enrich with JTBD outcomes if available
      if (jtbdResult) {
        valuePropositions = this.enrichWithJTBD(valuePropositions, jtbdResult);
      }

      // Calculate EQ score using V2
      const industryContent = [
        ...websiteData.content.headings,
        ...websiteData.content.paragraphs
      ].join(' ');

      const eqResult = await eqIntegration.calculateEQ({
        businessName,
        websiteContent: [industryContent],
        industry
      });
      const eqScore = eqResult.eq_score;
      console.log(`[Orchestrator] EQ Score: ${eqScore.overall}% (${eqScore.classification})`);

      const synthesisDuration = Date.now() - synthesisStartTime;
      console.log(`[Orchestrator] Synthesis complete in ${synthesisDuration}ms`);

      onProgress?.({
        stage: 'jtbd_transformation',
        progress: 85,
        message: 'Synthesis complete',
        details: `EQ Score: ${eqScore.overall}%`,
        duration: synthesisDuration
      });

      // ============================================
      // STAGE 3: SYNTHESIS (~5s)
      // ============================================
      onProgress?.({
        stage: 'synthesis',
        progress: 80,
        message: 'Synthesizing insights',
        details: 'Building customer triggers, personas, and core truth'
      });

      // Transform to UI formats
      const customerTriggers = this.transformToCustomerTriggers(
        personaResult.buyerIntelligence,
        websiteData.url
      );
      const buyerPersonas = this.transformToBuyerPersonas(personaResult.buyerIntelligence);
      const transformations = this.transformToTransformations(personaResult.buyerIntelligence);

      // Synthesize core truth
      const coreTruth = this.synthesizeCoreTruth(
        businessName,
        industry,
        valuePropositions,
        buyerPersonas,
        eqScore.overall,
        websiteData,
        offeringsResult.differentiators
      );

      const totalDuration = Date.now() - startTime;

      // Assess data quality
      const dataQuality = this.assessDataQuality(
        offeringsResult.products.confidence.overall,
        personaResult.buyerIntelligence.extraction_quality,
        eqScore.overall
      );

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Intelligence extraction complete',
        details: `Total time: ${(totalDuration / 1000).toFixed(1)}s`,
        duration: totalDuration
      });

      console.log('[Orchestrator] ========================================');
      console.log(`[Orchestrator] EXTRACTION COMPLETE`);
      console.log(`[Orchestrator] Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(1)}s)`);
      console.log(`[Orchestrator] - Parallel phase (ALL 3 calls): ${parallelDuration}ms`);
      console.log(`[Orchestrator] - Synthesis phase: ${synthesisDuration}ms`);
      console.log(`[Orchestrator] Results:`);
      console.log(`[Orchestrator] - Value Propositions: ${valuePropositions.length}`);
      console.log(`[Orchestrator] - Buyer Personas: ${buyerPersonas.length}`);
      console.log(`[Orchestrator] - Customer Triggers: ${customerTriggers.length}`);
      console.log(`[Orchestrator] - Products: ${offeringsResult.products.products.length}`);
      console.log(`[Orchestrator] - Differentiators: ${offeringsResult.differentiators.differentiators.length}`);
      console.log(`[Orchestrator] - Industry EQ: ${eqScore.overall}%`);
      console.log(`[Orchestrator] - Data Quality: ${dataQuality}`);
      console.log('[Orchestrator] ========================================');

      return {
        valuePropositions,
        customerTriggers,
        buyerPersonas,
        transformations,
        industryEQScore: eqScore.overall,
        coreTruth,
        eqScore,
        rawPersonaData: personaResult,
        rawOfferingsData: offeringsResult,
        collectionTimestamp: new Date(),
        dataQuality,
        extractionDuration: totalDuration,
        warnings
      };

    } catch (error) {
      console.error('[Orchestrator] Extraction failed:', error);
      throw new Error(`Intelligence extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================
  // TRANSFORMATION HELPERS
  // ============================================

  /**
   * Transform offerings to value propositions
   */
  private transformToValuePropositions(
    offeringsResult: UnifiedOfferingsResult,
    businessName: string,
    sourceUrl: string
  ): ValueProposition[] {
    const propositions: ValueProposition[] = [];

    // Use products for value propositions
    offeringsResult.products.products.slice(0, 5).forEach((product, index) => {
      const sources: DataSource[] = [{
        id: `source-${Date.now()}-${index}`,
        type: 'website',
        name: 'Website Content',
        url: sourceUrl,
        extractedAt: new Date(),
        reliability: product.confidence,
        dataPoints: 1,
        excerpt: product.sourceExcerpt
      }];

      const confidence: ConfidenceScore = {
        overall: product.confidence,
        dataQuality: Math.round(product.confidence * 0.9),
        sourceCount: 1,
        modelAgreement: product.confidence,
        reasoning: `Found in ${product.category}`
      };

      const proposition: ValueProposition = {
        id: `vp-${Date.now()}-${index}`,
        statement: `We help businesses ${product.description.toLowerCase()}`,
        outcomeStatement: undefined,
        category: index === 0 ? 'core' : 'secondary',
        confidence,
        sources,
        marketPosition: 'Value leader',
        differentiators: offeringsResult.differentiators.differentiators
          .slice(0, 3)
          .map(d => d.statement),
        validated: false
      };

      propositions.push(proposition);
    });

    // If no products, create from differentiators
    if (propositions.length === 0 && offeringsResult.differentiators.differentiators.length > 0) {
      const diff = offeringsResult.differentiators.differentiators[0];
      propositions.push({
        id: `vp-${Date.now()}-diff`,
        statement: diff.statement,
        outcomeStatement: undefined,
        category: 'core',
        confidence: {
          overall: diff.strengthScore,
          dataQuality: 70,
          sourceCount: 1,
          modelAgreement: diff.strengthScore,
          reasoning: 'From differentiator analysis'
        },
        sources: [{
          id: `source-diff-${Date.now()}`,
          type: 'website',
          name: 'Website Content',
          url: sourceUrl,
          extractedAt: new Date(),
          reliability: diff.strengthScore,
          dataPoints: 1,
          excerpt: diff.evidence
        }],
        marketPosition: 'Differentiated',
        differentiators: [diff.statement],
        validated: false
      });
    }

    return propositions;
  }

  /**
   * Enrich value propositions with JTBD outcomes
   */
  private enrichWithJTBD(
    propositions: ValueProposition[],
    transformed: any
  ): ValueProposition[] {
    return propositions.map((prop, index) => {
      if (index === 0 && transformed.primary) {
        return {
          ...prop,
          outcomeStatement: transformed.primary.outcomeStatement,
          jtbdInsights: {
            functionalJob: transformed.primary.jtbd?.functionalJob,
            emotionalJob: transformed.primary.jtbd?.emotionalJob,
            painReliever: transformed.primary.value?.painReliever,
            gainCreator: transformed.primary.value?.gainCreator
          }
        };
      }

      const supportingIndex = index - 1;
      if (supportingIndex >= 0 && supportingIndex < (transformed.supporting?.length || 0)) {
        const supporting = transformed.supporting[supportingIndex];
        return {
          ...prop,
          outcomeStatement: supporting.outcomeStatement,
          jtbdInsights: {
            functionalJob: supporting.jtbd?.functionalJob,
            emotionalJob: supporting.jtbd?.emotionalJob,
            painReliever: supporting.value?.painReliever,
            gainCreator: supporting.value?.gainCreator
          }
        };
      }

      return prop;
    });
  }

  /**
   * Transform buyer intelligence to customer triggers
   */
  private transformToCustomerTriggers(buyerData: any, sourceUrl: string): CustomerTrigger[] {
    const triggers: CustomerTrigger[] = [];

    // Extract from common pain points
    const painPoints = buyerData?.common_pain_points || [];
    painPoints.forEach((painPoint: any, index: number) => {
      triggers.push({
        id: `trigger-pain-${index}`,
        type: 'pain',
        description: painPoint.description || String(painPoint),
        urgency: this.mapIntensityToNumber(painPoint.intensity || 'medium'),
        frequency: painPoint.frequency || 50,
        emotionalWeight: this.mapCategoryToEQ(painPoint.category || 'general'),
        sources: []
      });
    });

    // Extract from common outcomes
    const outcomes = buyerData?.common_outcomes || [];
    outcomes.forEach((outcome: any, index: number) => {
      triggers.push({
        id: `trigger-desire-${index}`,
        type: 'desire',
        description: outcome.description || String(outcome),
        urgency: 70,
        frequency: 60,
        emotionalWeight: outcome.emotional_benefit ? 80 : 50,
        sources: []
      });
    });

    return triggers;
  }

  /**
   * Transform buyer intelligence to buyer personas
   */
  private transformToBuyerPersonas(buyerData: any): BuyerPersona[] {
    const personas = buyerData?.personas || [];
    if (personas.length === 0) return [];

    return personas.map((persona: any) => {
      const confidence: ConfidenceScore = {
        overall: persona.confidence_score || 70,
        dataQuality: (persona.sample_size || 0) > 3 ? 80 : 60,
        sourceCount: (persona.evidence_sources || []).length,
        modelAgreement: persona.confidence_score || 70,
        reasoning: `Based on ${persona.sample_size || 0} customer examples`
      };

      const emotionalScore = persona.buying_behavior?.relationship_vs_transactional === 'relationship' ? 70 : 40;
      const rationalScore = persona.buying_behavior?.research_intensity === 'heavy' ? 80 : 50;
      const socialScore = persona.role?.influence_level === 'high' ? 75 : 40;

      return {
        id: persona.id,
        name: persona.persona_name,
        archetype: `${persona.role?.title || 'Professional'} seeking ${persona.desired_outcomes?.[0]?.description || 'better solutions'}`,
        demographics: {
          ageRange: undefined,
          income: undefined,
          location: persona.industry?.primary_industry
        },
        psychographics: {
          values: (persona.desired_outcomes || []).map((o: any) => o.description).slice(0, 3),
          fears: (persona.pain_points || []).filter((p: any) => p.category === 'risk').map((p: any) => p.description),
          goals: (persona.desired_outcomes || []).map((o: any) => o.metric || o.description).slice(0, 3)
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

    personas.forEach((persona: any) => {
      const metrics = persona?.success_metrics || [];
      metrics.forEach((metric: any, index: number) => {
        if (!metric.baseline || !metric.achieved) return;

        const painPoint = (persona.pain_points || [])[0]?.description || `${metric.category}: ${metric.baseline}`;
        const pleasureGoal = (persona.desired_outcomes || [])[0]?.description || `${metric.category}: ${metric.achieved}`;
        const mechanism = (persona.desired_outcomes || [])[0]?.metric || 'Strategic implementation';

        transformations.push({
          id: `transform-${persona.id}-${index}`,
          painPoint,
          pleasureGoal,
          mechanism,
          clarity: Math.round((persona.confidence_score || 70) / 100 * 100),
          confidence: {
            overall: persona.confidence_score || 70,
            dataQuality: 70,
            sourceCount: (persona.evidence_sources || []).length,
            modelAgreement: persona.confidence_score || 70,
            reasoning: `Based on ${metric.improvement || 'measurable'} improvement`
          }
        });
      });
    });

    return transformations.slice(0, 5);
  }

  /**
   * Synthesize core truth from all data
   */
  private synthesizeCoreTruth(
    businessName: string,
    industry: string,
    valueProps: ValueProposition[],
    personas: BuyerPersona[],
    eqScore: number,
    websiteData: WebsiteData,
    differentiators: any
  ): CoreTruth {
    const coreVP = valueProps.find(vp => vp.category === 'core') || valueProps[0];
    const topPersona = personas[0];
    const topDiff = differentiators?.differentiators?.[0];

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

    const confidence: ConfidenceScore = {
      overall: Math.round(((coreVP?.confidence.overall || 70) + (topPersona?.confidence.overall || 70)) / 2),
      dataQuality: 80,
      sourceCount: valueProps.reduce((sum, vp) => sum + vp.sources.length, 0),
      modelAgreement: 85,
      reasoning: 'Synthesized from parallel extraction'
    };

    return {
      id: `core-truth-${Date.now()}`,
      narrative: topDiff?.statement ||
        `${businessName} transforms ${topPersona?.name || 'businesses'} by ${coreVP?.statement || 'delivering exceptional value'}.`,
      tagline: websiteData.metadata.description?.split('.')[0] || `${businessName}: ${industry} Excellence`,
      positioning: `The ${coreVP?.marketPosition || 'trusted'} choice for ${topPersona?.archetype || 'businesses'}`,
      messagingPillars,
      brandVoice: {
        personality: [emotionalTone, 'Customer-focused', 'Authentic'],
        tone: ['Professional', eqScore > 60 ? 'Warm' : 'Clear', 'Confident'],
        avoidWords: ['Cheap', 'Basic', 'Simple', 'Just']
      },
      keyTransformation: {
        id: 'key-transformation',
        painPoint: topPersona?.psychographics.fears[0] || 'Struggling with challenges',
        pleasureGoal: topPersona?.psychographics.goals[0] || 'Achieving success',
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
      confidence
    };
  }

  // ============================================
  // UTILITY HELPERS
  // ============================================

  /**
   * Extract initial value statements from website for parallel JTBD processing
   * These are used to start JTBD transformation without waiting for other extractors
   */
  private extractInitialValueStatements(websiteData: WebsiteData, businessName: string): string[] {
    const statements: string[] = [];

    // Extract from headings (usually contain value props)
    websiteData.content.headings.forEach(heading => {
      if (heading.length > 20 && heading.length < 200) {
        // Skip navigation-like headings
        if (!heading.match(/^(menu|nav|about|contact|home|login|sign)/i)) {
          statements.push(heading);
        }
      }
    });

    // Extract from first few paragraphs (usually contain main value props)
    websiteData.content.paragraphs.slice(0, 10).forEach(para => {
      // Look for value-prop-like sentences
      if (para.length > 30 && para.length < 300) {
        if (para.match(/help|provide|offer|deliver|enable|empower|transform|solution/i)) {
          statements.push(para);
        }
      }
    });

    // Extract from meta description
    if (websiteData.metadata.description) {
      statements.push(websiteData.metadata.description);
    }

    // Deduplicate and limit
    const uniqueStatements = [...new Set(statements)].slice(0, 5);

    // If we don't have enough, add some generic ones based on title
    if (uniqueStatements.length < 3 && websiteData.metadata.title) {
      uniqueStatements.push(`${businessName} provides expert solutions`);
      uniqueStatements.push(`${businessName} helps businesses succeed`);
    }

    return uniqueStatements;
  }

  private prepareContentString(websiteData: WebsiteData): string {
    return [
      ...websiteData.content.headings,
      ...websiteData.content.paragraphs
    ].join('\n');
  }

  private extractTestimonials(websiteData: WebsiteData): string[] {
    return websiteData.content.paragraphs.filter(p =>
      p.includes('"') || p.includes('helped') || p.includes('amazing') || p.length > 100
    ).slice(0, 10);
  }

  private mapIntensityToNumber(intensity: string): number {
    switch (intensity?.toLowerCase()) {
      case 'critical': return 90;
      case 'high': return 75;
      case 'medium': return 50;
      case 'low': return 25;
      default: return 50;
    }
  }

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

  private assessDataQuality(
    productsConfidence: number,
    buyerQuality: string,
    eqScore: number
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    const avgConfidence = (productsConfidence + (buyerQuality === 'excellent' ? 90 : buyerQuality === 'good' ? 70 : 50)) / 2;
    if (avgConfidence >= 80) return 'excellent';
    if (avgConfidence >= 65) return 'good';
    if (avgConfidence >= 45) return 'fair';
    return 'poor';
  }
}

// Export singleton
export const parallelIntelligenceOrchestrator = new ParallelIntelligenceOrchestratorService();
export { ParallelIntelligenceOrchestratorService };
