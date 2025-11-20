/**
 * Onboarding V5 Data Collection Service
 *
 * Orchestrates all AI services to collect comprehensive business intelligence:
 * - Deep Website Scanner → Services/Products
 * - Buyer Intelligence Extractor → Customer Personas + Triggers
 * - EQ Calculator → Emotional Quotient Scores
 * - Value Proposition Analysis → UVP Data
 *
 * Transforms raw AI outputs into formats expected by UI components
 *
 * Created: 2025-11-18 (Week 2, Track D)
 */

import type { WebsiteData } from '@/services/scraping/websiteScraper';
import { deepWebsiteScannerService } from '@/services/intelligence/deep-website-scanner.service';
import { buyerIntelligenceExtractor } from '@/services/intelligence/buyer-intelligence-extractor.service';
import { eqCalculator } from '@/services/ai/eq-calculator.service';
import type { ValueProposition } from '@/components/onboarding-v5/ValuePropositionPage';
import type { CustomerTrigger, BuyerPersona } from '@/components/onboarding-v5/BuyerIntelligencePage';
import type { CoreTruth, MessagingPillar } from '@/components/onboarding-v5/CoreTruthPage';
import type { Transformation } from '@/components/onboarding-v5/TransformationCascade';
import type { ConfidenceScore } from '@/components/onboarding-v5/ConfidenceMeter';
import type { DataSource } from '@/components/onboarding-v5/SourceCitation';
import type { EQScore, EQRecommendation, EQCalculationResult } from '@/types/eq-calculator.types';

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
  /**
   * Collect complete onboarding data from website
   */
  async collectOnboardingData(
    websiteData: WebsiteData,
    businessName: string,
    industry: string,
    onProgress?: (progress: DataCollectionProgress) => void
  ): Promise<OnboardingDataPackage> {
    console.log('[DataCollection] Starting comprehensive data collection...');

    const warnings: string[] = [];

    try {
      // Stage 1: Deep Website Scan (25%)
      onProgress?.({
        stage: 'scanning_website',
        progress: 10,
        message: 'Scanning website for services and products',
        details: 'Analyzing navigation, content patterns, and pricing'
      });

      const scanResult = await deepWebsiteScannerService.scanWebsite(websiteData, {
        minConfidence: 0.5,
        extractPricing: true,
        deduplicate: true
      });

      console.log(`[DataCollection] Deep scan complete: ${scanResult.services.length} services found`);
      warnings.push(...scanResult.warnings);

      onProgress?.({
        stage: 'scanning_website',
        progress: 25,
        message: 'Website scan complete',
        details: `Found ${scanResult.services.length} services`
      });

      // Stage 2: Extract Buyer Personas (50%)
      onProgress?.({
        stage: 'extracting_personas',
        progress: 30,
        message: 'Analyzing customer testimonials and case studies',
        details: 'Identifying buyer personas, pain points, and desired outcomes'
      });

      const buyerData = await buyerIntelligenceExtractor.extractBuyerPersonas({
        url: websiteData.url,
        content: this.prepareContentString(websiteData),
        testimonials: this.extractTestimonials(websiteData),
        services: scanResult.services.map(s => s.name)
      });

      console.log(`[DataCollection] Buyer intelligence complete: ${buyerData.personas.length} personas found`);

      onProgress?.({
        stage: 'extracting_personas',
        progress: 50,
        message: 'Buyer intelligence extracted',
        details: `Identified ${buyerData.personas.length} personas`
      });

      // Stage 3: Calculate EQ Scores (70%)
      onProgress?.({
        stage: 'calculating_eq',
        progress: 55,
        message: 'Calculating emotional quotient for industry',
        details: 'Analyzing emotional vs rational messaging patterns'
      });

      const industryContent = [
        ...websiteData.content.headings,
        ...websiteData.content.paragraphs
      ].join(' ');

      const eqScore = eqCalculator.calculateEQ(industryContent);
      console.log(`[DataCollection] EQ Score: ${eqScore.overall}% (${eqScore.classification})`);

      onProgress?.({
        stage: 'calculating_eq',
        progress: 70,
        message: 'Emotional analysis complete',
        details: `Industry EQ: ${eqScore.overall}% (${eqScore.classification})`
      });

      // Stage 4: Synthesize Core Truth (90%)
      onProgress?.({
        stage: 'synthesizing_truth',
        progress: 75,
        message: 'Synthesizing brand narrative and messaging framework',
        details: 'Creating core truth from all gathered intelligence'
      });

      // Transform all data into UI component formats
      const valuePropositions = this.transformToValuePropositions(scanResult, businessName, websiteData.url);
      const customerTriggers = this.transformToCustomerTriggers(buyerData, websiteData.url);
      const buyerPersonas = this.transformToBuyerPersonas(buyerData);
      const transformations = this.transformToTransformations(buyerData);
      const coreTruth = this.synthesizeCoreTruth(
        businessName,
        industry,
        valuePropositions,
        buyerPersonas,
        eqScore.overall,
        websiteData
      );

      onProgress?.({
        stage: 'synthesizing_truth',
        progress: 90,
        message: 'Brand narrative synthesized',
        details: 'All intelligence gathered and organized'
      });

      // Complete (100%)
      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Data collection complete',
        details: 'Ready to review insights'
      });

      const dataQuality = this.assessOverallQuality(
        scanResult.overallConfidence,
        buyerData.extraction_quality,
        eqScore.overall
      );

      console.log('[DataCollection] Collection complete!');
      console.log(`  - Value Propositions: ${valuePropositions.length}`);
      console.log(`  - Buyer Personas: ${buyerPersonas.length}`);
      console.log(`  - Customer Triggers: ${customerTriggers.length}`);
      console.log(`  - Industry EQ: ${eqScore.overall}%`);
      console.log(`  - Data Quality: ${dataQuality}`);

      return {
        valuePropositions,
        customerTriggers,
        buyerPersonas,
        transformations,
        industryEQScore: eqScore.overall,
        coreTruth,
        collectionTimestamp: new Date(),
        dataQuality,
        warnings
      };

    } catch (error) {
      console.error('[DataCollection] Collection failed:', error);
      throw new Error(`Data collection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transform deep scan results to value propositions
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
        category: index === 0 ? 'core' : 'secondary',
        confidence,
        sources,
        marketPosition: service.pricing ? 'Premium specialist' : 'Value leader',
        differentiators: service.features.slice(0, 3),
        validated: false
      };

      propositions.push(proposition);
    });

    return propositions;
  }

  /**
   * Transform buyer intelligence to customer triggers
   */
  private transformToCustomerTriggers(buyerData: any, sourceUrl: string): CustomerTrigger[] {
    const triggers: CustomerTrigger[] = [];

    // Extract triggers from common pain points
    buyerData.common_pain_points.forEach((painPoint: any, index: number) => {
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
    buyerData.common_outcomes.forEach((outcome: any, index: number) => {
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
    return buyerData.personas.map((persona: any, index: number) => {
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

    buyerData.personas.forEach((persona: any) => {
      persona.success_metrics.forEach((metric: any, index: number) => {
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
