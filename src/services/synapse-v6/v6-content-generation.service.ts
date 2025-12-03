// PRD Feature: SYNAPSE-V6
/**
 * V6 Content Generation Service
 *
 * Wires V6 insights to the V1 Content Generation pipeline:
 * 1. V6Insight → BreakthroughInsight adapter
 * 2. CostEquivalenceCalculator for behavioral economics
 * 3. ContentPsychologyEngine for psychological principles
 * 4. PowerWordOptimizer for language enhancement
 * 5. Format generators (HookPost, StoryPost, DataPost, ControversialPost)
 */

import { SynapseContentGenerator } from './generation/SynapseContentGenerator';
import { ContentPsychologyEngine } from './generation/ContentPsychologyEngine';
import { calculateCostEquivalences, type ServiceCost, type CostEquivalenceResult } from './helpers/CostEquivalenceCalculator';
import type { V6Insight, V6Connection } from './v6-insight-types';
import type { BreakthroughInsight } from '@/types/breakthrough.types';
import type { BusinessProfile, ContentFormat, GenerationResult, SynapseContent } from '@/types/synapseContent.types';

/**
 * V1 CONNECTION-AWARE FORMAT SELECTION
 * Maps connection types to optimal content formats based on psychology principles
 */
function getConnectionAwareFormat(insight: V6Insight): ContentFormat {
  const connections = insight.connections || [];
  const hasCrossDomain = connections.some(c => c.connectionType === 'cross-domain');
  const hasThreeWay = connections.length >= 3;
  const avgBreakthroughScore = connections.length > 0
    ? connections.reduce((sum, c) => sum + c.breakthroughScore, 0) / connections.length
    : 0;

  // V1 Format-Psychology Mapping (from additional-context.md)
  // Cross-domain (weather + review) → Story Post (narrative transportation)
  if (hasCrossDomain && insight.sourceTab === 'local_timing') {
    return 'story-post';
  }

  // Three-way breakthrough → Hook Post (holy shit moment - curiosity gap)
  if (hasThreeWay && avgBreakthroughScore >= 85) {
    return 'hook-post';
  }

  // Predictive/timing → Data Post (authority + proof)
  if (insight.sourceTab === 'trends' || insight.sourceTab === 'search') {
    return 'data-post';
  }

  // Counter-intuitive/competitive → Controversial Post (cognitive dissonance)
  if (insight.sourceTab === 'competitive') {
    return 'controversial-post';
  }

  // Cultural moment/community → Story Post (emotional connection)
  if (insight.sourceTab === 'community' || insight.sourceTab === 'voc') {
    return 'story-post';
  }

  // Unexpected connection → Hook Post (curiosity gap)
  if (hasCrossDomain) {
    return 'hook-post';
  }

  // Default to hook post (safe, high engagement)
  return 'hook-post';
}

/**
 * Determine insight type based on connection characteristics (V1 approach)
 * Not based on sourceTab category, but on CONNECTION properties
 */
function getConnectionBasedType(insight: V6Insight): BreakthroughInsight['type'] {
  const connections = insight.connections || [];
  const hasCrossDomain = connections.some(c => c.connectionType === 'cross-domain');
  const hasThreeWay = connections.length >= 3;
  const avgBreakthroughScore = connections.length > 0
    ? connections.reduce((sum, c) => sum + c.breakthroughScore, 0) / connections.length
    : 0;

  // Cross-domain = unexpected connection (V1's secret sauce)
  if (hasCrossDomain) {
    return 'unexpected_connection';
  }

  // High breakthrough score = predictive opportunity
  if (avgBreakthroughScore >= 80) {
    return 'predictive_opportunity';
  }

  // Three-way connection = hidden pattern
  if (hasThreeWay) {
    return 'hidden_pattern';
  }

  // Source-based fallback (less preferred)
  const sourceTypeMap: Record<string, BreakthroughInsight['type']> = {
    voc: 'deep_psychology',
    community: 'cultural_moment',
    competitive: 'counter_intuitive',
    trends: 'predictive_opportunity',
    search: 'hidden_pattern',
    local_timing: 'unexpected_connection',
  };

  return sourceTypeMap[insight.sourceTab] || 'unexpected_connection';
}

/**
 * Convert V6 insight to BreakthroughInsight (SynapseInsight) for content generation
 * V1-aligned: Uses connection properties, not emotion labels
 */
function v6InsightToBreakthrough(insight: V6Insight): BreakthroughInsight {
  // Calculate connection strength for scoring
  const connections = insight.connections || [];
  const connectionScore = connections.length
    ? connections.reduce((sum, c) => sum + c.breakthroughScore, 0) / connections.length / 100
    : 0.5;

  // Check for cross-domain connections (higher value in V1)
  const hasCrossDomain = connections.some(c => c.connectionType === 'cross-domain');
  const hasThreeWay = connections.length >= 3;

  // Confidence boost for V1-style valuable connections
  let confidence = insight.source.verified ? 0.9 : 0.7;
  if (hasCrossDomain) confidence += 0.05;
  if (hasThreeWay) confidence += 0.05;
  confidence = Math.min(confidence, 0.99);

  // Build connection-aware content angle
  const contentAngle = hasCrossDomain
    ? `Cross-domain connection: ${insight.title} - unexpected angle competitors miss`
    : hasThreeWay
      ? `Three-way breakthrough: ${insight.title} - multi-source validation`
      : `${insight.sourceTab} insight: ${insight.title}`;

  // SynapseInsight structure - V1 aligned
  return {
    id: insight.id,
    type: getConnectionBasedType(insight), // Connection-based, not source-based
    thinkingStyle: hasCrossDomain ? 'lateral' : 'analytical' as const,
    insight: insight.title,
    whyProfound: insight.text,
    whyNow: `Based on ${insight.sourceTab} data from ${insight.source.platform}`,
    contentAngle,
    expectedReaction: hasCrossDomain
      ? 'Surprise and curiosity - "I never thought of it that way"'
      : 'Recognition and engagement',
    evidence: [insight.text],
    confidence,
    metadata: {
      generatedAt: new Date(insight.timestamp),
      model: 'v6-insight-adapter',
      // V1 connection metadata for downstream use
      connectionType: hasCrossDomain ? 'cross-domain' : hasThreeWay ? 'three-way' : 'standard',
      breakthroughScore: connectionScore * 100,
    },
  };
}

/**
 * Content generation options
 */
export interface V6ContentGenerationOptions {
  formats?: ContentFormat[];
  maxContent?: number;
  includeVariants?: boolean;
  targetDemographic?: string;
  serviceCost?: ServiceCost; // For cost equivalence hooks
}

/**
 * Extended generation result with V6 context
 */
export interface V6GenerationResult extends GenerationResult {
  costEquivalences?: CostEquivalenceResult;
  psychologyExplanations?: Map<string, string>;
  sourceInsights: V6Insight[];
}

/**
 * Generate content from V6 insights
 * V1-aligned: Uses connection-aware format selection
 */
export async function generateV6Content(
  insights: V6Insight[],
  business: BusinessProfile,
  options: V6ContentGenerationOptions = {}
): Promise<V6GenerationResult> {
  const {
    maxContent = 10,
    targetDemographic,
    serviceCost,
  } = options;

  console.log(`[V6ContentGen] Generating content from ${insights.length} insights...`);

  // V1: Get connection-aware formats for each insight (not a static list)
  const insightFormats = insights.map(insight => ({
    insight,
    format: getConnectionAwareFormat(insight),
  }));

  // Log format selection reasoning
  insightFormats.forEach(({ insight, format }) => {
    const hasCrossDomain = insight.connections?.some(c => c.connectionType === 'cross-domain');
    const hasThreeWay = (insight.connections?.length || 0) >= 3;
    console.log(`[V6ContentGen] ${insight.id}: ${format} (cross-domain: ${hasCrossDomain}, 3-way: ${hasThreeWay})`);
  });

  // Convert V6 insights to BreakthroughInsights
  const breakthroughInsights = insights.map(v6InsightToBreakthrough);

  // Prioritize insights with cross-domain connections (V1's secret sauce)
  // Sort by metadata.breakthroughScore (higher is better for V1 connections)
  breakthroughInsights.sort((a, b) => {
    const scoreA = (a.metadata as any)?.breakthroughScore || 0;
    const scoreB = (b.metadata as any)?.breakthroughScore || 0;
    return scoreB - scoreA;
  });

  // Initialize generators
  const contentGenerator = new SynapseContentGenerator();

  // Calculate cost equivalences if service cost provided
  let costEquivalences: CostEquivalenceResult | undefined;
  if (serviceCost) {
    costEquivalences = calculateCostEquivalences(serviceCost, targetDemographic);
    console.log(`[V6ContentGen] Found ${costEquivalences.bestMatches.length} cost equivalences`);
  }

  // V1: Extract unique formats from connection-aware selection
  const formats = [...new Set(insightFormats.map(f => f.format))];

  // Generate content
  const result = await contentGenerator.generate(breakthroughInsights, business, {
    formats,
    maxContent,
    multiFormat: true,
    minImpactScore: 0.6,
  });

  // V1: Enhance content with connection hints and cost equivalence hooks
  result.content = result.content.map(content => {
    // Find the source V6 insight for this content
    const sourceInsight = insights.find(i => i.id === content.insightId);
    const connections = sourceInsight?.connections || [];
    const hasCrossDomain = connections.some(c => c.connectionType === 'cross-domain');
    const hasThreeWay = connections.length >= 3;
    const avgScore = connections.length > 0
      ? connections.reduce((sum, c) => sum + c.breakthroughScore, 0) / connections.length
      : 0;

    // Build connection hint string for content context
    const connectionHints = connections.length > 0
      ? connections.map(c => `${c.sourceType} ↔ ${c.targetType}: ${c.hint}`).join(' | ')
      : undefined;

    return {
      ...content,
      metadata: {
        ...content.metadata,
        // V1 Connection Metadata
        connectionHints,
        connectionCount: connections.length,
        hasCrossDomain,
        hasThreeWay,
        breakthroughScore: avgScore,
        // Cost equivalence hooks
        ...(costEquivalences && costEquivalences.bestMatches.length > 0 ? {
          costEquivalenceHook: costEquivalences.bestMatches[0].hook,
          costEquivalenceTimeframe: costEquivalences.bestMatches[0].timeframe,
        } : {}),
      },
    };
  });

  console.log(`[V6ContentGen] Generated ${result.content.length} content pieces`);

  return {
    ...result,
    costEquivalences,
    sourceInsights: insights,
  };
}

/**
 * Generate content for a single insight with all format options
 */
export async function generateAllFormatsForInsight(
  insight: V6Insight,
  business: BusinessProfile
): Promise<SynapseContent[]> {
  const contentGenerator = new SynapseContentGenerator();
  const breakthroughInsight = v6InsightToBreakthrough(insight);
  return await contentGenerator.generateAll(breakthroughInsight, business);
}

/**
 * Get format recommendation for an insight
 */
export function getFormatRecommendation(insight: V6Insight): {
  primary: ContentFormat;
  alternatives: ContentFormat[];
  reason: string;
} {
  const contentGenerator = new SynapseContentGenerator();
  const breakthroughInsight = v6InsightToBreakthrough(insight);
  return contentGenerator.getFormatRecommendation(breakthroughInsight);
}

/**
 * Generate content with psychology explanation
 */
export async function generateWithExplanation(
  insight: V6Insight,
  business: BusinessProfile,
  format?: ContentFormat
): Promise<{
  content: SynapseContent | null;
  explanation: string | null;
}> {
  const contentGenerator = new SynapseContentGenerator();
  const psychologyEngine = new ContentPsychologyEngine();
  const breakthroughInsight = v6InsightToBreakthrough(insight);

  const content = await contentGenerator.generateSingle(breakthroughInsight, business, format);

  if (!content) {
    return { content: null, explanation: null };
  }

  // Generate psychology explanation
  // Note: This requires BreakthroughContent type, which is different from SynapseContent
  // For now, return content without detailed explanation
  const explanation = `
## Why This Works

**Insight Type**: ${breakthroughInsight.type.replace(/_/g, ' ')}
**Source**: ${insight.sourceTab} - ${insight.source.platform}
**Confidence**: ${(breakthroughInsight.confidence * 100).toFixed(0)}%

${insight.connections && insight.connections.length > 0 ? `
**Cross-Domain Connections**: ${insight.connections.filter(c => c.connectionType === 'cross-domain').length}
This insight connects ideas from different domains, making it more likely to create "aha" moments.
` : ''}

**Format Selected**: ${content.format}
${getFormatReason(content.format)}
  `.trim();

  return { content, explanation };
}

/**
 * Get reason for format selection
 */
function getFormatReason(format: ContentFormat): string {
  const reasons: Partial<Record<ContentFormat, string>> = {
    'hook-post': 'Creates a curiosity gap that drives engagement through open loops.',
    'story-post': 'Uses narrative transportation to bypass logical resistance and create emotional connection.',
    'data-post': 'Establishes authority and credibility through evidence-based claims.',
    'controversial-post': 'Challenges assumptions to spark engagement and position you as a thought leader.',
    'thread': 'Deep-dive format for comprehensive exploration.',
    'carousel': 'Visual storytelling for complex ideas.',
    'blog-how-to': 'Step-by-step guidance that positions you as an expert.',
    'blog-listicle': 'Easy to scan format that maximizes engagement.',
    'blog-case-study': 'Real-world proof that builds trust.',
    'landing-hero': 'Attention-grabbing first impression.',
    'landing-sales': 'Conversion-focused persuasion.',
    'email-newsletter': 'Nurture relationships over time.',
    'email-promo': 'Drive action with urgency.',
    'email-sequence': 'Multi-touch persuasion journey.',
  };
  return reasons[format] || '';
}

export const v6ContentGenerationService = {
  generateV6Content,
  generateAllFormatsForInsight,
  getFormatRecommendation,
  generateWithExplanation,
};
