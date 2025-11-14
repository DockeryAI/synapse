/**
 * Value Forge Orchestrator
 *
 * Main coordination service that:
 * - Loads context from Mirror analysis + Industry Profile
 * - Handles AI re-analysis when users customize data
 * - Propagates changes throughout the entire flow
 * - Synth

esizes all collected data for UVP generation
 */

import type {
  ValueForgeContext,
  ValueForgeState,
  ReAnalysisRequest,
  ReAnalysisResult,
  BrandIdentity,
  BrandDefinition,
  BuyerPersona,
  BVPModule,
  DiscoveryPathsModule,
  CustomerJourney
} from '@/types/valueForge';
import { LLMService } from '@/services/llm/LLMService';

class ValueForgeOrchestratorClass {
  private llmService: LLMService;

  constructor() {
    this.llmService = new LLMService();
  }

  /**
   * Load initial context from cached business intelligence
   */
  loadContext(): ValueForgeContext | null {
    try {
      const cachedIntel = localStorage.getItem('cached_business_intel');
      if (!cachedIntel) {
        console.error('[ValueForgeOrchestrator] No cached business intelligence found');
        return null;
      }

      const businessIntel = JSON.parse(cachedIntel);

      const context: ValueForgeContext = {
        businessIntel,
        analysis: businessIntel.analysis, // CompleteBrandAnalysis from Mirror
        industryProfile: businessIntel.industryProfile,
        businessName: businessIntel.business?.name || 'Your Business',
        businessUrl: businessIntel.business?.url || '',
        industryCode: businessIntel.business?.industry || '',
        industryName: businessIntel.industryProfile?.industryName || '',
        detectedArchetype: businessIntel.archetype,
        detectedValueProps: businessIntel.website_analysis?.valuePropositions || [],
        detectedDifferentiators: businessIntel.website_analysis?.differentiators || [],
        competitiveGaps: businessIntel.competitive,
        culturalSignals: businessIntel.culturalSignals || [],
        trendingTopics: businessIntel.trendingTopics || [],
        timingSignals: businessIntel.timingSignals
      };

      console.log('[ValueForgeOrchestrator] Context loaded successfully');
      return context;
    } catch (error) {
      console.error('[ValueForgeOrchestrator] Error loading context:', error);
      return null;
    }
  }

  /**
   * Analyze user customization and determine impact
   */
  async analyzeCustomization(request: ReAnalysisRequest): Promise<ReAnalysisResult> {
    console.log('[ValueForgeOrchestrator] Analyzing customization:', request.customizationPoint);

    try {
      // Build prompt for AI to analyze the customization impact
      const prompt = this.buildAnalysisPrompt(request);

      // Use LLM to analyze impact
      const response = await this.llmService.generateCompletion({
        model: 'claude-3-5-sonnet-20241022',
        prompt,
        maxTokens: 1000,
        temperature: 0.3 // Lower temperature for analytical task
      });

      // Parse the response to determine impact
      const result = this.parseAnalysisResponse(response, request);

      console.log('[ValueForgeOrchestrator] Analysis complete:', result);
      return result;
    } catch (error) {
      console.error('[ValueForgeOrchestrator] Error analyzing customization:', error);

      // Return safe default
      return {
        impactedModules: [],
        updatedRecommendations: {},
        propagationNeeded: false,
        analysisNotes: 'Analysis failed - using original recommendations'
      };
    }
  }

  /**
   * Build AI prompt for customization analysis
   */
  private buildAnalysisPrompt(request: ReAnalysisRequest): string {
    const { customizationPoint, oldValue, newValue, context } = request;

    return `You are analyzing how a user's customization impacts a strategic brand positioning workflow.

CUSTOMIZATION:
Point: ${customizationPoint}
Old Value: ${JSON.stringify(oldValue)}
New Value: ${JSON.stringify(newValue)}

CURRENT STATE:
${this.summarizeState(context)}

TASK:
Analyze how this customization should impact:
1. Brand messaging recommendations
2. Buyer persona suggestions
3. Discovery path priorities
4. Customer journey messaging
5. Final value propositions

Return JSON with:
{
  "impactedModules": ["module1", "module2"],
  "updatedRecommendations": {
    "module1": "specific updates needed",
    "module2": "specific updates needed"
  },
  "propagationNeeded": true/false,
  "analysisNotes": "brief explanation of impact"
}`;
  }

  /**
   * Summarize current state for AI context
   */
  private summarizeState(state: ValueForgeState): string {
    const summary = [];

    if (state.brandIdentity) {
      summary.push(`Brand Identity: ${state.brandIdentity.skills.length} skills, ${state.brandIdentity.attributes.filter(a => a.selected).length} attributes`);
    }

    if (state.brandDefinition) {
      summary.push(`Brand Definition: ${state.brandDefinition.painPoints.length} pain points, ${state.brandDefinition.pleasureGoals.length} pleasure goals`);
    }

    if (state.personas.length) {
      summary.push(`Personas: ${state.personas.map(p => p.name).join(', ')}`);
    }

    if (state.bvpModule) {
      summary.push(`BVP: "${state.bvpModule.bvp.bvpStatement}"`);
      summary.push(`USP: "${state.bvpModule.usp.uspStatement}"`);
    }

    return summary.join('\n');
  }

  /**
   * Parse AI response for analysis result
   */
  private parseAnalysisResponse(response: string, request: ReAnalysisRequest): ReAnalysisResult {
    try {
      // Remove markdown code blocks if present
      const cleaned = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      return {
        impactedModules: parsed.impactedModules || [],
        updatedRecommendations: parsed.updatedRecommendations || {},
        propagationNeeded: parsed.propagationNeeded !== false,
        analysisNotes: parsed.analysisNotes || 'Analysis complete'
      };
    } catch (error) {
      console.error('[ValueForgeOrchestrator] Error parsing analysis response:', error);

      // Infer impact based on customization point
      return this.inferImpact(request);
    }
  }

  /**
   * Infer impact when AI analysis fails
   */
  private inferImpact(request: ReAnalysisRequest): ReAnalysisResult {
    const { customizationPoint } = request;

    const impactMap: Record<string, string[]> = {
      'skills': ['brandIdentity', 'bvpModule', 'generatedUVPs'],
      'attributes': ['brandIdentity', 'personas', 'generatedUVPs'],
      'endResult': ['brandDefinition', 'generatedUVPs'],
      'brandTasks': ['brandDefinition', 'customerJourney'],
      'painPoints': ['brandDefinition', 'personas', 'generatedUVPs'],
      'pleasureGoals': ['brandDefinition', 'personas', 'generatedUVPs'],
      'persona': ['personas', 'discoveryPaths', 'customerJourney', 'generatedUVPs'],
      'bvp': ['bvpModule', 'customerJourney', 'generatedUVPs'],
      'usp': ['bvpModule', 'generatedUVPs'],
      'discoveryPath': ['discoveryPaths', 'customerJourney'],
      'journeyStage': ['customerJourney', 'generatedUVPs']
    };

    const impactedModules = impactMap[customizationPoint] || [];

    return {
      impactedModules,
      updatedRecommendations: {},
      propagationNeeded: impactedModules.length > 0,
      analysisNotes: `Inferred impact for ${customizationPoint} customization`
    };
  }

  /**
   * Propagate changes throughout affected modules
   */
  async propagateChanges(
    analysisResult: ReAnalysisResult,
    currentState: ValueForgeState
  ): Promise<Partial<ValueForgeState>> {
    console.log('[ValueForgeOrchestrator] Propagating changes to:', analysisResult.impactedModules);

    if (!analysisResult.propagationNeeded) {
      return {};
    }

    const updates: Partial<ValueForgeState> = {};

    // Track that customizations occurred
    updates.totalCustomizations = (currentState.totalCustomizations || 0) + 1;
    updates.lastUpdated = new Date().toISOString();

    // TODO: Implement specific module update logic
    // For now, just mark that changes need attention

    return updates;
  }

  /**
   * Synthesize all collected data for final UVP generation
   */
  synthesizeData(state: ValueForgeState): any {
    console.log('[ValueForgeOrchestrator] Synthesizing all data for UVP generation');

    return {
      // Brand Identity
      skills: state.brandIdentity?.skills.filter(s => s.isCore) || [],
      attributes: state.brandIdentity?.attributes.filter(a => a.selected) || [],

      // Brand Definition
      endResult: state.brandDefinition?.endResult.userInput || '',
      brandTasks: state.brandDefinition?.brandTasks.filter(t => t.selected) || [],
      painPoints: state.brandDefinition?.painPoints || [],
      pleasureGoals: state.brandDefinition?.pleasureGoals || [],
      transformationPower: state.brandDefinition?.transformationPower || 0,

      // Personas
      personas: state.personas || [],

      // BVP/USP
      bvp: state.bvpModule?.bvp || null,
      usp: state.bvpModule?.usp || null,

      // Discovery Paths
      discoveryPaths: state.discoveryPaths?.paths || {},
      discoveryStrategy: state.discoveryPaths?.strategy || null,

      // Customer Journey
      customerJourney: state.customerJourney?.stages || {},

      // Metadata
      totalCustomizations: state.totalCustomizations || 0,
      completionPercentage: state.completionPercentage || 0
    };
  }

  /**
   * Validate state completeness
   */
  validateState(state: ValueForgeState): { isComplete: boolean; missingModules: string[] } {
    const missingModules: string[] = [];

    if (!state.brandIdentity || state.brandIdentity.skills.length === 0) {
      missingModules.push('brandIdentity');
    }

    if (!state.brandDefinition) {
      missingModules.push('brandDefinition');
    }

    if (state.personas.length === 0) {
      missingModules.push('personas');
    }

    if (!state.bvpModule) {
      missingModules.push('bvpModule');
    }

    if (!state.discoveryPaths) {
      missingModules.push('discoveryPaths');
    }

    if (!state.customerJourney) {
      missingModules.push('customerJourney');
    }

    return {
      isComplete: missingModules.length === 0,
      missingModules
    };
  }
}

// Export singleton instance
export const ValueForgeOrchestrator = new ValueForgeOrchestratorClass();
