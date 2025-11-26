/**
 * Framework Router Service
 *
 * Routes content generation through selected framework structures.
 * Translates framework stages into actionable generation guidelines.
 *
 * Part of Content Fix Phase 1: Framework Integration Core
 */

import type {
  ContentFramework,
  FrameworkStage
} from '@/services/synapse/generation/ContentFrameworkLibrary';

import type { DataPoint } from '@/types/connections.types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Generation guidelines extracted from framework
 */
export interface GenerationGuidelines {
  framework: ContentFramework;
  stageGuidelines: Map<string, string[]>; // stage name → guidelines
  toneAdjustments: string[];
  ctaStyle: string;
  psychologyPrinciples: string[];
}

/**
 * Context for title generation
 */
export interface TitleGenerationContext {
  dataPoints: DataPoint[];
  framework: ContentFramework;
  customerFocus: boolean;
}

/**
 * Comprehensive routing result for synapse generation
 */
export interface SynapseRoutingResult {
  titleGuidance: string;
  hookGuidance: string;
  bodyGuidance: string;
  ctaGuidance: string;
  psychologyPrinciples: string[];
}

// ============================================================================
// FRAMEWORK ROUTER SERVICE
// ============================================================================

class FrameworkRouter {
  /**
   * Build actionable generation guidelines from framework
   */
  buildGenerationGuidelines(framework: ContentFramework): GenerationGuidelines {
    console.log(`[FrameworkRouter] Building guidelines for ${framework.name}...`);

    const stageGuidelines = new Map<string, string[]>();
    const psychologyPrinciples: string[] = [];

    // Extract guidelines from each stage
    for (const stage of framework.stages) {
      stageGuidelines.set(stage.name, stage.guidelines);

      if (stage.psychologyPrinciple) {
        psychologyPrinciples.push(`${stage.name}: ${stage.psychologyPrinciple}`);
      }
    }

    // Determine tone based on framework
    const toneAdjustments: string[] = [];

    if (framework.conversionFocus > 0.8) {
      toneAdjustments.push('Action-oriented', 'Direct', 'Benefit-focused');
    }

    if (framework.engagementFocus > 0.8) {
      toneAdjustments.push('Conversational', 'Story-driven', 'Relatable');
    }

    // Determine CTA style based on framework
    let ctaStyle = 'Clear single call-to-action';

    if (framework.id.includes('problem')) {
      ctaStyle = 'Solution-focused CTA (relief and hope)';
    } else if (framework.id.includes('before-after')) {
      ctaStyle = 'Transformation CTA (join the journey)';
    } else if (framework.id.includes('hook-story')) {
      ctaStyle = 'Opportunity CTA (take advantage now)';
    }

    console.log(`[FrameworkRouter] ✓ Extracted ${stageGuidelines.size} stages, ${psychologyPrinciples.length} principles`);

    return {
      framework,
      stageGuidelines,
      toneAdjustments,
      ctaStyle,
      psychologyPrinciples
    };
  }

  /**
   * Route title generation through framework with customer focus
   */
  routeTitleGeneration(context: TitleGenerationContext): string {
    const { framework, customerFocus } = context;

    console.log(`[FrameworkRouter] Routing title through ${framework.name} (customer focus: ${customerFocus})`);

    // Get first stage (Hook/Attention/Problem) for title guidance
    const firstStage = framework.stages[0];

    if (!firstStage) {
      return 'Create compelling title that grabs attention';
    }

    let guidance = `**Title Framework: ${framework.name} - ${firstStage.name}**\n\n`;
    guidance += `**Purpose**: ${firstStage.purpose}\n\n`;

    // Add example formulas if available
    if (firstStage.exampleFormulas && firstStage.exampleFormulas.length > 0) {
      guidance += `**Title Formulas**:\n`;
      for (const formula of firstStage.exampleFormulas) {
        guidance += `- ${formula}\n`;
      }
      guidance += '\n';
    }

    // Add guidelines
    guidance += `**Guidelines**:\n`;
    for (const guideline of firstStage.guidelines) {
      guidance += `- ${guideline}\n`;
    }

    // Add psychology principle
    if (firstStage.psychologyPrinciple) {
      guidance += `\n**Psychology**: ${firstStage.psychologyPrinciple}\n`;
    }

    // CRITICAL: Add customer focus reminders
    if (customerFocus) {
      guidance += `\n**CRITICAL CUSTOMER FOCUS**:\n`;
      guidance += `- Write for CUSTOMERS, not business owners\n`;
      guidance += `- Focus on customer benefits and desires\n`;
      guidance += `- Use "you" language (customer perspective)\n`;
      guidance += `- Example transformation:\n`;
      guidance += `  ❌ Business: "How to improve your bakery operations"\n`;
      guidance += `  ✅ Customer: "Why your weekend croissants taste better here"\n`;
    }

    return guidance;
  }

  /**
   * Route complete synapse generation through framework
   */
  routeSynapseGeneration(
    dataPoints: DataPoint[],
    framework: ContentFramework
  ): SynapseRoutingResult {
    console.log(`[FrameworkRouter] Routing synapse generation through ${framework.name}...`);

    const guidelines = this.buildGenerationGuidelines(framework);

    // Title guidance (first stage)
    const titleStage = framework.stages[0];
    let titleGuidance = `**${titleStage.name}**: ${titleStage.purpose}\n`;
    if (titleStage.exampleFormulas) {
      titleGuidance += `Formulas: ${titleStage.exampleFormulas.slice(0, 2).join(' OR ')}\n`;
    }
    titleGuidance += `Guidelines: ${titleStage.guidelines.slice(0, 3).join(', ')}`;

    // Hook guidance (first stage psychology + example)
    let hookGuidance = `**Opening Hook using ${framework.name}**:\n`;
    hookGuidance += `${titleStage.purpose}\n`;
    if (titleStage.psychologyPrinciple) {
      hookGuidance += `Apply: ${titleStage.psychologyPrinciple}\n`;
    }
    hookGuidance += `Style: ${titleStage.guidelines[0] || 'Grab attention immediately'}`;

    // Body guidance (middle stages)
    let bodyGuidance = `**Content Body Structure**:\n`;

    for (let i = 1; i < framework.stages.length - 1; i++) {
      const stage = framework.stages[i];
      bodyGuidance += `\n**${stage.name}**: ${stage.purpose}\n`;
      bodyGuidance += `- ${stage.guidelines.slice(0, 2).join('\n- ')}`;
    }

    // CTA guidance (last stage)
    const ctaStage = framework.stages[framework.stages.length - 1];
    let ctaGuidance = `**Call-to-Action (${ctaStage.name})**:\n`;
    ctaGuidance += `${ctaStage.purpose}\n`;
    ctaGuidance += `Style: ${guidelines.ctaStyle}\n`;
    ctaGuidance += `Guidelines: ${ctaStage.guidelines.join(', ')}`;

    console.log(`[FrameworkRouter] ✓ Generated complete routing guidance`);

    return {
      titleGuidance,
      hookGuidance,
      bodyGuidance,
      ctaGuidance,
      psychologyPrinciples: guidelines.psychologyPrinciples
    };
  }

  /**
   * Route cluster naming through framework
   */
  routeClusterNaming(
    dataPoints: DataPoint[],
    framework: ContentFramework
  ): string {
    console.log(`[FrameworkRouter] Routing cluster naming through ${framework.name}...`);

    // Analyze what type of cluster this is based on data
    const hasNegativeSentiment = dataPoints.some(
      dp => dp.metadata?.sentiment === 'negative'
    );

    const hasPositiveSentiment = dataPoints.some(
      dp => dp.metadata?.sentiment === 'positive'
    );

    let namingGuidance = `**Cluster Name Framework: ${framework.name}**\n\n`;

    // Apply framework-specific naming patterns
    if (framework.id.includes('problem') && hasNegativeSentiment) {
      namingGuidance += `**Pattern**: [Specific Customer Pain]: [How It Manifests]\n`;
      namingGuidance += `**Examples**:\n`;
      namingGuidance += `- "Weekend Wait Times Hit 30 Minutes"\n`;
      namingGuidance += `- "Parking Frustration During Lunch Rush"\n`;
      namingGuidance += `- "Online Orders Often Missing Items"\n\n`;
      namingGuidance += `**Requirements**:\n`;
      namingGuidance += `- Be SPECIFIC (include numbers/times if available)\n`;
      namingGuidance += `- Customer perspective (what THEY experience)\n`;
      namingGuidance += `- NOT generic like "Service Issues" or "Product Quality Loved"\n`;
    } else if (framework.id.includes('before-after')) {
      namingGuidance += `**Pattern**: [Before State] → [After State]\n`;
      namingGuidance += `**Examples**:\n`;
      namingGuidance += `- "From Basic Breakfast to Instagram Favorite"\n`;
      namingGuidance += `- "Cold Coffee Problem Solved With New System"\n`;
      namingGuidance += `- "Generic Service → Personalized Experience"\n`;
    } else if (hasPositiveSentiment) {
      namingGuidance += `**Pattern**: [Customer Benefit] + [What Enables It]\n`;
      namingGuidance += `**Examples**:\n`;
      namingGuidance += `- "Fresh-Baked Every Morning Appeals To Health-Conscious"\n`;
      namingGuidance += `- "Local Ingredients Win Over Foodies"\n`;
      namingGuidance += `- "Family Recipes Keep Regulars Coming Back"\n`;
    } else {
      namingGuidance += `**Pattern**: [Specific Insight] + [Customer Impact]\n`;
      namingGuidance += `**Examples**:\n`;
      namingGuidance += `- "Outdoor Seating Drives Weekend Traffic"\n`;
      namingGuidance += `- "Text-Ahead Orders Skip The Line"\n`;
      namingGuidance += `- "Late Night Hours Capture Bar Crowd"\n`;
    }

    namingGuidance += `\n**CRITICAL**: Customer-focused, specific, actionable`;

    return namingGuidance;
  }

  /**
   * Attach framework metadata for tracking
   */
  attachMetadata(framework: ContentFramework, confidence: number): {
    frameworkId: string;
    frameworkName: string;
    confidence: number;
    timestamp: string;
    channel: string;
  } {
    return {
      frameworkId: framework.id,
      frameworkName: framework.name,
      confidence,
      timestamp: new Date().toISOString(),
      channel: framework.channel
    };
  }

  /**
   * Format framework guidance for injection into AI prompts
   */
  formatForPrompt(routing: SynapseRoutingResult, framework: ContentFramework): string {
    let prompt = `## CONTENT FRAMEWORK: ${framework.name}\n\n`;
    prompt += `**Framework Description**: ${framework.description}\n\n`;

    prompt += `### Title Generation\n${routing.titleGuidance}\n\n`;
    prompt += `### Hook/Opening\n${routing.hookGuidance}\n\n`;
    prompt += `### Body Structure\n${routing.bodyGuidance}\n\n`;
    prompt += `### Call-to-Action\n${routing.ctaGuidance}\n\n`;

    if (routing.psychologyPrinciples.length > 0) {
      prompt += `### Psychology Principles to Apply\n`;
      for (const principle of routing.psychologyPrinciples) {
        prompt += `- ${principle}\n`;
      }
    }

    prompt += `\n**IMPORTANT**: Follow this framework structure in your generated content.\n`;

    return prompt;
  }
}

// Export singleton instance
export const frameworkRouter = new FrameworkRouter();
