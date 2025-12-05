/**
 * AI Insight Synthesizer Service V3
 *
 * Replaces template-based insight generation with full AI synthesis using:
 * - Opus 4.5 for deep breakthrough analysis and connection discovery
 * - Sonnet 4.5 for fast title/hook generation at scale
 *
 * Key Features:
 * - No templates - Claude reads raw data and synthesizes unique content
 * - Customer-first focus (customer is hero, business is guide)
 * - Framework-aware (AIDA, PAS, BAB, Hook-Story-Offer)
 * - Provenance tracking with exact source quotes
 * - EQ scoring for psychological impact
 * - V3: ContentFrameworkLibrary integration for post-synthesis framework application
 */

import type { DataPoint } from '@/types/connections.types';
import { ContentFrameworkLibrary, type FrameworkType } from '@/services/synapse-v6/generation/ContentFrameworkLibrary';
import type { EnrichedContext } from './content-synthesis-orchestrator.service';
import { OutcomeDetectionService, type DetectedOutcome, type OutcomeDifferentiatorMapping } from '@/services/synapse-v6/outcome-detection.service';
import { businessPurposeDetector, type BusinessPurpose } from './business-purpose-detector.service';

export interface SynthesizedInsight {
  id: string;
  title: string;
  hook: string;
  body?: string[];
  cta: string;
  framework: 'aida' | 'pas' | 'bab' | 'hook-story-offer' | 'faq';
  // V3: Framework metadata from ContentFrameworkLibrary
  frameworkMetadata?: {
    id: string;
    name: string;
    stages: string[];
    conversionFocus: number;
    engagementFocus: number;
    bestFor: string[];
  };
  sources: Array<{
    platform: string;
    quote: string;
    url?: string;
  }>;
  psychology: {
    triggerType: string;
    emotionalIntensity: number;
    urgency: 'low' | 'medium' | 'high' | 'critical';
  };
  validation: {
    sourceCount: number;
    crossPlatform: boolean;
    uvpMatch?: string;
    // V3: Multi-source validation label
    validationLabel?: 'multi-validated-breakthrough' | 'cross-platform-insight' | 'validated-pattern' | 'emerging-signal' | 'early-indicator';
  };
  scores: {
    breakthrough: number;
    eq: number;
    relevance: number;
    actionability: number;
  };
  dimensions: {
    journeyStage: string;
    persona: string;
    format: string;
    angle: string;
  };
}

export interface SynthesisInput {
  connections: any[];
  dataPoints: DataPoint[];
  uvpData: any;
  brandData: any;
  targetCount?: number;
  // V3.1: Enriched context from orchestrator
  enrichedContext?: EnrichedContext;
  // V6: Outcome detection instead of V5 emotional filtering
  detectedOutcomes?: DetectedOutcome[];
  outcomeMappings?: OutcomeDifferentiatorMapping[];
  // Synapse 2.0: BuzzSumo content benchmarks
  buzzsumoData?: {
    topHeadlinePatterns?: string[];
    optimalWordCount?: number;
    bestPublishDays?: string[];
    performanceByFormat?: Record<string, number>;
  };
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// V6: Live Signal Detection Types (V1-style)
interface LiveSignals {
  buyingSignals: Array<{ signal: string; source: string; urgency: 'low' | 'medium' | 'high' | 'critical'; confidence: number }>;
  temporalOpportunities: Array<{ opportunity: string; source: string; timing: string; relevance: number }>;
  competitorGaps: Array<{ gap: string; competitor: string; source: string; advantage: number }>;
  customerConversations: Array<{ conversation: string; source: string; sentiment: 'positive' | 'negative' | 'neutral'; intent: string }>;
}

/**
 * V3: Assign validation label based on source count
 * Multi-source validation indicates confidence level
 */
function getValidationLabel(sourceCount: number): SynthesizedInsight['validation']['validationLabel'] {
  if (sourceCount >= 5) return 'multi-validated-breakthrough';
  if (sourceCount === 4) return 'cross-platform-insight';
  if (sourceCount === 3) return 'validated-pattern';
  if (sourceCount === 2) return 'emerging-signal';
  return 'early-indicator';
}

/**
 * Main synthesis function - orchestrates V6 outcome detection with AI synthesis
 * V6: Now uses outcome detection instead of V5 emotional filtering
 */
export async function synthesizeInsights(input: SynthesisInput): Promise<SynthesizedInsight[]> {
  const { connections, dataPoints, uvpData, brandData, targetCount = 100, enrichedContext, detectedOutcomes, outcomeMappings } = input;
  const startTime = Date.now();

  console.log(`[AI-Synthesizer] V6: Starting outcome-driven synthesis for ${connections.length} connections, ${dataPoints.length} data points`);
  console.log(`[AI-Synthesizer] Target: ${targetCount} unique insights`);

  // V6: Extract live signals with business purpose context
  console.log(`[AI-Synthesizer] V6: Detecting live signals from ${dataPoints.length} data points...`);

  // First detect business purpose to guide signal extraction
  let businessPurpose: BusinessPurpose | null = null;
  if (uvpData) {
    try {
      businessPurpose = businessPurposeDetector.detectBusinessPurpose(uvpData);
      console.log(`[AI-Synthesizer] V6: Business purpose detected - ${businessPurpose.productFunction.primary} for ${businessPurpose.customerRole.department} (${businessPurpose.confidence}% confidence)`);
      console.log(`[AI-Synthesizer] V6: Generated ${businessPurpose.contextualQueries.length} contextual queries: ${businessPurpose.contextualQueries.slice(0, 3).join(', ')}...`);
    } catch (error) {
      console.warn('[AI-Synthesizer] V6: Business purpose detection failed:', error);
    }
  }

  const liveSignals = extractLiveSignals(dataPoints, brandData, uvpData, businessPurpose);
  console.log(`[AI-Synthesizer] V6: Found ${liveSignals.buyingSignals.length} buying signals, ${liveSignals.temporalOpportunities.length} temporal opportunities, ${liveSignals.competitorGaps.length} competitor gaps`);

  // Use live signals instead of static UVP outcomes
  const signalContext = {
    buyingSignals: liveSignals.buyingSignals,
    temporalOpportunities: liveSignals.temporalOpportunities,
    competitorGaps: liveSignals.competitorGaps,
    customerConversations: liveSignals.customerConversations
  };

  // V3.1: Log enriched context if available
  if (enrichedContext) {
    console.log(`[AI-Synthesizer] Enriched context available:`);
    console.log(`  - EQ Profile: ${enrichedContext.eqProfile.emotional_weight}% emotional, JTBD: ${enrichedContext.eqProfile.jtbd_focus}`);
    console.log(`  - Segment: ${enrichedContext.segment}`);
    console.log(`  - Industry Profile: ${enrichedContext.industryProfile ? 'Loaded' : 'Not available'}`);
  }

  // Step 1: Use Opus 4.5 to analyze connections and identify breakthrough patterns
  // V6: Use live signals from API data instead of static UVP outcomes
  const breakthroughAnalysis = await analyzeBreakthroughsWithOpus(
    connections.slice(0, 100),
    dataPoints,
    uvpData,
    brandData,
    enrichedContext, // V3.1: Pass enriched context
    signalContext // V6: Pass live signal context
  );

  // Step 2: Use Sonnet 4.5 to generate titles/hooks at scale
  // V6: Pass outcomes for outcome-driven content generation
  const generatedInsights = await generateInsightsWithSonnet(
    breakthroughAnalysis,
    connections,
    dataPoints,
    uvpData,
    brandData,
    targetCount,
    enrichedContext, // V3.1: Pass enriched context
    input.buzzsumoData, // Synapse 2.0: Pass BuzzSumo benchmarks
    outcomes, // V6: Pass detected outcomes
    mappings // V6: Pass outcome-differentiator mappings
  );

  // Step 3: V3 - Apply ContentFrameworkLibrary post-synthesis
  const frameworkEnhancedInsights = applyContentFrameworks(generatedInsights);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[AI-Synthesizer] ✅ Synthesized ${frameworkEnhancedInsights.length} insights in ${elapsed}s`);

  return frameworkEnhancedInsights;
}

// Initialize the framework library
const frameworkLibrary = new ContentFrameworkLibrary();

/**
 * V3 FIX: Generate fallback insights when AI API fails
 * Creates genuine insights from raw breakthrough/connection data
 * instead of losing them entirely
 */
export function generateFallbackInsights(
  breakthroughs: any[],
  connections: any[],
  uvpData?: any,
  brandData?: any
): SynthesizedInsight[] {
  const insights: SynthesizedInsight[] = [];
  const frameworks = ['aida', 'pas', 'bab', 'hook-story-offer'];
  const journeyStages = ['awareness', 'consideration', 'decision', 'retention'];

  // Generate from breakthroughs
  breakthroughs.forEach((bt, idx) => {
    if (!bt.title || bt.title.length < 10) return;

    const framework = frameworks[idx % frameworks.length];
    const journeyStage = journeyStages[idx % journeyStages.length];
    const sources = bt.provenance || bt.sources || [];
    const sourceCount = Array.isArray(sources) ? sources.length : 1;

    insights.push({
      id: `fallback-bt-${Date.now()}-${idx}`,
      title: bt.title,
      hook: bt.hook || bt.reasoning || `Discover how ${bt.title.toLowerCase()}`,
      body: [],
      cta: uvpData?.key_benefit ? `Learn how to ${uvpData.key_benefit.toLowerCase()}` : 'Learn more',
      framework: framework as any,
      sources: Array.isArray(sources) ? sources.slice(0, 3) : [],
      psychology: {
        triggerType: bt.urgency === 'critical' ? 'fear' : 'curiosity',
        emotionalIntensity: bt.score ? bt.score / 100 : 0.7,
        urgency: bt.urgency || 'medium'
      },
      validation: {
        sourceCount,
        crossPlatform: sourceCount > 1,
        uvpMatch: uvpData?.target_customer ? 'target_customer' : undefined,
        validationLabel: getValidationLabel(sourceCount)
      },
      scores: {
        breakthrough: bt.score || 70,
        eq: 65,
        relevance: 75,
        actionability: 70
      },
      dimensions: {
        journeyStage: journeyStage as any,
        persona: 'decision-maker',
        format: 'insight',
        angle: 'educational'
      }
    });
  });

  // Generate from connections if we need more
  connections.forEach((conn, idx) => {
    if (!conn.angle || conn.angle.length < 10) return;

    const framework = frameworks[(idx + 2) % frameworks.length];
    const journeyStage = journeyStages[(idx + 1) % journeyStages.length];
    const sources = conn.sources || [];
    const sourceCount = Array.isArray(sources) ? sources.length : 1;

    insights.push({
      id: `fallback-conn-${Date.now()}-${idx}`,
      title: conn.angle.substring(0, 100),
      hook: conn.reasoning || `${sourceCount} sources reveal: ${conn.angle.substring(0, 60)}...`,
      body: [],
      cta: 'Discover more',
      framework: framework as any,
      sources: Array.isArray(sources) ? sources.slice(0, 3) : [],
      psychology: {
        triggerType: 'opportunity',
        emotionalIntensity: conn.emotionalIntensity || 0.6,
        urgency: conn.timingRelevance > 0.5 ? 'high' : 'medium'
      },
      validation: {
        sourceCount,
        crossPlatform: sourceCount > 1,
        validationLabel: getValidationLabel(sourceCount)
      },
      scores: {
        breakthrough: conn.breakthroughScore || 60,
        eq: 60,
        relevance: 70,
        actionability: 65
      },
      dimensions: {
        journeyStage: journeyStage as any,
        persona: 'decision-maker',
        format: 'insight',
        angle: 'discovery'
      }
    });
  });

  console.log(`[AI-Synthesizer/Fallback] Generated ${insights.length} fallback insights from ${breakthroughs.length} breakthroughs + ${connections.length} connections`);
  return insights;
}

/**
 * V3: Apply ContentFrameworkLibrary to enhance insights post-synthesis
 * Maps AI-generated framework names to validated library frameworks
 * V3 FIX: Uses semantic matching as fallback for unknown framework names
 */
function applyContentFrameworks(insights: SynthesizedInsight[]): SynthesizedInsight[] {
  console.log(`[AI-Synthesizer/Framework] Applying ContentFrameworkLibrary to ${insights.length} insights...`);

  // Map AI framework names to library framework IDs
  const frameworkMapping: Record<string, FrameworkType> = {
    'aida': 'aida',
    'pas': 'problem-agitate-solution',
    'problem-agitate-solution': 'problem-agitate-solution',
    'bab': 'before-after-bridge',
    'before-after-bridge': 'before-after-bridge',
    'hook-story-offer': 'hook-story-offer',
    'faq': 'blog-how-to',
    'curiosity': 'curiosity-gap',
    'curiosity-gap': 'curiosity-gap',
    'controversy': 'controversy-debate',
    'controversy-debate': 'controversy-debate',
    'story': 'hook-story-offer',
    'comparison': 'blog-comparison',
    'blog-comparison': 'blog-comparison',
    'case-study': 'blog-case-study',
    'blog-case-study': 'blog-case-study',
    'how-to': 'blog-how-to',
    'blog-how-to': 'blog-how-to',
    'listicle': 'blog-listicle',
    'blog-listicle': 'blog-listicle',
    // V3: Additional common AI outputs
    'emotional-hook': 'hook-story-offer',
    'fear-appeal': 'problem-agitate-solution',
    'aspiration': 'before-after-bridge',
    'proof-based': 'blog-case-study',
    'data-driven': 'blog-listicle',
    'question-based': 'curiosity-gap',
    'challenge': 'controversy-debate',
    'tutorial': 'blog-how-to',
    'guide': 'blog-how-to',
    'versus': 'blog-comparison',
    'success-story': 'blog-case-study'
  };

  // V3: Semantic fallback - match unknown frameworks to closest known one
  const semanticFallback = (aiFramework: string): FrameworkType => {
    const lowerFramework = aiFramework.toLowerCase();

    // Check for keywords that suggest specific frameworks
    if (lowerFramework.includes('problem') || lowerFramework.includes('pain') || lowerFramework.includes('agitate')) {
      return 'problem-agitate-solution';
    }
    if (lowerFramework.includes('before') || lowerFramework.includes('after') || lowerFramework.includes('transform')) {
      return 'before-after-bridge';
    }
    if (lowerFramework.includes('story') || lowerFramework.includes('hook') || lowerFramework.includes('narrative')) {
      return 'hook-story-offer';
    }
    if (lowerFramework.includes('curios') || lowerFramework.includes('question') || lowerFramework.includes('mystery')) {
      return 'curiosity-gap';
    }
    if (lowerFramework.includes('controversy') || lowerFramework.includes('debate') || lowerFramework.includes('challenge')) {
      return 'controversy-debate';
    }
    if (lowerFramework.includes('compare') || lowerFramework.includes('versus') || lowerFramework.includes('vs')) {
      return 'blog-comparison';
    }
    if (lowerFramework.includes('case') || lowerFramework.includes('success') || lowerFramework.includes('proof')) {
      return 'blog-case-study';
    }
    if (lowerFramework.includes('how') || lowerFramework.includes('guide') || lowerFramework.includes('tutorial')) {
      return 'blog-how-to';
    }
    if (lowerFramework.includes('list') || lowerFramework.includes('top') || lowerFramework.includes('best')) {
      return 'blog-listicle';
    }

    // Default fallback
    console.log(`[AI-Synthesizer/Framework] Unknown framework "${aiFramework}", defaulting to AIDA`);
    return 'aida';
  };

  return insights.map(insight => {
    // Get the framework from library based on AI's selection
    const aiFramework = insight.framework?.toLowerCase() || 'aida';

    // Try direct mapping first, then semantic fallback
    const libraryFrameworkId = frameworkMapping[aiFramework] || semanticFallback(aiFramework);
    const framework = frameworkLibrary.getFramework(libraryFrameworkId);

    if (framework) {
      // Enhance insight with framework metadata
      return {
        ...insight,
        framework: aiFramework as any,
        frameworkMetadata: {
          id: framework.id,
          name: framework.name,
          stages: framework.stages.map(s => s.name),
          conversionFocus: framework.conversionFocus,
          engagementFocus: framework.engagementFocus,
          bestFor: framework.bestFor
        }
      };
    }

    return insight;
  });
}

/**
 * Step 1: Use Opus 4.5 for deep breakthrough analysis
 * V6: Enhanced with live signal detection (V1-style) instead of static UVP parsing
 */
async function analyzeBreakthroughsWithOpus(
  topConnections: any[],
  dataPoints: DataPoint[],
  uvpData: any,
  brandData: any,
  enrichedContext?: EnrichedContext,
  signalContext?: any
): Promise<any> {
  console.log('[AI-Synthesizer/Opus] V6: Analyzing breakthroughs with live signal detection...');

  // V6: Build live signal context for Opus (V1-style)
  const signalContextBlock = signalContext ? `
V6 LIVE MARKET SIGNALS DETECTED:

BUYING SIGNALS (${signalContext.buyingSignals.length} found):
${signalContext.buyingSignals.slice(0, 8).map((s, i) => `${i+1}. [${s.urgency.toUpperCase()}] ${s.signal}
   - Source: ${s.source}
   - Confidence: ${(s.confidence * 100).toFixed(0)}%`).join('\n')}

TEMPORAL OPPORTUNITIES (${signalContext.temporalOpportunities.length} found):
${signalContext.temporalOpportunities.slice(0, 5).map((t, i) => `${i+1}. ${t.opportunity}
   - Timing: ${t.timing}
   - Source: ${t.source}`).join('\n')}

COMPETITOR GAPS (${signalContext.competitorGaps.length} found):
${signalContext.competitorGaps.slice(0, 5).map((c, i) => `${i+1}. ${c.gap}
   - Competitor: ${c.competitor}
   - Source: ${c.source}`).join('\n')}

CRITICAL: Use these LIVE signals from actual customer conversations and market intelligence, not static business descriptions.
` : '';

  // Build context for Opus
  const connectionSummary = topConnections.slice(0, 15).map((conn, i) => ({
    id: i + 1,
    type: conn.connectionType,
    score: conn.breakthroughScore,
    sources: conn.sources?.join(', ') || 'multiple',
    content: conn.dataPoints?.slice(0, 2).map((dp: any) => dp.content?.substring(0, 200)).join(' | ') || conn.reasoning
  }));

  const dataPointSample = dataPoints
    .filter(dp => dp.content && dp.content.length > 30)
    .slice(0, 50)
    .map(dp => ({
      source: dp.source,
      type: dp.type,
      content: dp.content.substring(0, 300),
      sentiment: dp.metadata?.sentiment
    }));

  // V3.1: Build EQ context block
  const eqContextBlock = enrichedContext ? `
EMOTIONAL QUOTIENT (EQ) PROFILE:
- Emotional Weight: ${enrichedContext.eqProfile.emotional_weight}% (${enrichedContext.eqProfile.emotional_weight > 60 ? 'HIGHLY EMOTIONAL' : enrichedContext.eqProfile.emotional_weight > 40 ? 'BALANCED' : 'RATIONAL'})
- Primary Decision Drivers:
  • Fear/Risk: ${enrichedContext.eqWeights.fear}%
  • Aspiration/Desire: ${enrichedContext.eqWeights.aspiration}%
  • Trust/Credibility: ${enrichedContext.eqWeights.trust}%
  • Urgency/Time: ${enrichedContext.eqWeights.urgency}%
  • Logic/ROI: ${enrichedContext.eqWeights.logic}%
- JTBD Focus: ${enrichedContext.eqProfile.jtbd_focus.toUpperCase()}
- Purchase Mindset: "${enrichedContext.eqProfile.purchase_mindset}"

PRIORITIZE psychological triggers that match the TOP decision drivers above.
` : '';

  // V3.1: Build Industry Profile context block
  const industryContextBlock = enrichedContext?.industryProfile ? `
INDUSTRY INTELLIGENCE:
- Customer Triggers: ${enrichedContext.industryProfile.customer_triggers?.slice(0, 5).join(', ')}
- Urgency Drivers: ${enrichedContext.industryProfile.urgency_drivers?.slice(0, 5).join(', ')}
- Power Words to USE: ${enrichedContext.industryProfile.power_words?.slice(0, 15).join(', ')}
- Words to AVOID: ${enrichedContext.industryProfile.avoid_words?.slice(0, 10).join(', ')}
- Customer Language: ${enrichedContext.industryProfile.customer_language_dictionary?.slice(0, 10).join(', ')}
- Pain Point Language: ${enrichedContext.industryProfile.pain_point_language?.slice(0, 5).join(', ')}
- Solution Language: ${enrichedContext.industryProfile.solution_language?.slice(0, 5).join(', ')}
` : '';

  // V3.1: Build Segment context block
  const segmentContextBlock = enrichedContext ? `
BUSINESS SEGMENT: ${enrichedContext.segment.toUpperCase().replace('_', ' ')}
- Tone: ${enrichedContext.segmentGuidelines.tone}
- Language to USE: ${enrichedContext.segmentGuidelines.language.join(', ')}
- Focus Areas: ${enrichedContext.segmentGuidelines.focusAreas.join(', ')}
- AVOID These Concepts: ${enrichedContext.segmentGuidelines.avoidAreas.join(', ')}
` : '';

  const prompt = `You are a breakthrough content strategist analyzing cross-platform intelligence data.

BUSINESS CONTEXT:
- Name: ${brandData?.name || 'Unknown'}
- Industry: ${brandData?.industry || 'Unknown'}
- Business Type: ${brandData?.businessType || 'b2b'}

UVP DATA:
- Target Customer: ${uvpData?.target_customer?.substring(0, 300) || 'Not specified'}
- Key Benefit: ${uvpData?.key_benefit?.substring(0, 200) || 'Not specified'}
- Transformation: ${uvpData?.transformation?.substring(0, 200) || 'Not specified'}
${signalContextBlock}${eqContextBlock}${industryContextBlock}${segmentContextBlock}
TOP CROSS-PLATFORM CONNECTIONS (sorted by breakthrough score):
${JSON.stringify(connectionSummary, null, 2)}

RAW DATA POINT SAMPLE (from multiple APIs):
${JSON.stringify(dataPointSample, null, 2)}

YOUR TASK: Identify the top 10 breakthrough content opportunities that:
1. Connect insights from 3+ different sources
2. Address LIVE MARKET SIGNALS from actual customer conversations above
3. Focus on BUYING SIGNALS and TEMPORAL OPPORTUNITIES with high urgency
4. Exploit COMPETITOR GAPS where we have clear advantages
5. Match the SEGMENT tone and language guidelines
6. Use INDUSTRY power words and avoid forbidden words
7. Can be actioned immediately with specific content angles

V6 CRITICAL - SIGNAL-FIRST FOCUS (V1-style):
- Use LIVE customer conversations, not static business descriptions
- Address ACTUAL buying intent: "looking for alternatives", "budget approved", "evaluating options"
- Leverage TEMPORAL opportunities: Q4 pressure, renewals, seasonal trends
- Exploit COMPETITOR weaknesses: "Salesforce too complex", "missing features"
- Example: "Q4 insurance agencies struggling with quote abandonment - here's what Salesforce users are missing"

For each breakthrough, provide:
1. Breakthrough Theme (2-5 words)
2. Why It's Powerful (which customer outcome does it address and which differentiator delivers it)
3. Sources That Validate It (which platforms confirm this pattern)
4. Content Angles (3 different ways to write about this)
5. Best Framework (AIDA for rational, PAS for fear-driven, BAB for transformation, Hook-Story-Offer for emotional)
6. Urgency Level (low/medium/high/critical)
7. Target Journey Stage (awareness/consideration/decision/retention)

OUTPUT FORMAT (JSON):
{
  "breakthroughs": [
    {
      "theme": "string",
      "whyPowerful": "string",
      "sources": ["string"],
      "contentAngles": ["string", "string", "string"],
      "bestFramework": "string",
      "urgency": "string",
      "journeyStage": "string",
      "psychologyTrigger": "string",
      "targetPersona": "string"
    }
  ],
  "overarchingInsights": "string - what's the big picture pattern across all data?"
}

Analyze deeply. Find the non-obvious connections. Think like a breakthrough content strategist.`;

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'openrouter',
        model: 'anthropic/claude-opus-4.5', // Opus 4.5 for quality analysis
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      console.warn('[AI-Synthesizer] API call failed, using fallback analysis');
      return { breakthroughs: [], overarchingInsights: '' };
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    if (content.includes('```json')) {
      content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    }

    const analysis = JSON.parse(content);
    console.log(`[AI-Synthesizer] ✅ Identified ${analysis.breakthroughs?.length || 0} breakthrough patterns`);

    return analysis;
  } catch (error) {
    console.error('[AI-Synthesizer] Error:', error);
    return { breakthroughs: [], overarchingInsights: '' };
  }
}

/**
 * Step 2: Use Sonnet 4.5 to generate titles/hooks at scale
 * V3.1: Enhanced with EQ, Industry Profile, and Segment context
 * Synapse 2.0: Now includes BuzzSumo content performance benchmarks
 */
async function generateInsightsWithSonnet(
  breakthroughAnalysis: any,
  connections: any[],
  dataPoints: DataPoint[],
  uvpData: any,
  brandData: any,
  targetCount: number,
  enrichedContext?: EnrichedContext,
  buzzsumoData?: SynthesisInput['buzzsumoData'],
  detectedOutcomes?: DetectedOutcome[],
  outcomeMappings?: OutcomeDifferentiatorMapping[]
): Promise<SynthesizedInsight[]> {
  console.log('[AI-Synthesizer/Sonnet] V6: Generating outcome-driven insights with Sonnet 4.5...');

  const insights: SynthesizedInsight[] = [];

  // V3 FIX: NO DEDUP HERE - Atomizer handles ALL deduplication
  // Generate insights from Opus breakthrough analysis
  const breakthroughs = breakthroughAnalysis.breakthroughs || [];

  // PERFORMANCE FIX: Reduced batch size for faster generation
  // Running 5 parallel batches of 20 = 100 insights fast
  const batchSize = 20;
  const MAX_PARALLEL_BATCHES = 5;
  const effectiveTarget = Math.min(targetCount, 100); // Cap at 100 for speed
  const totalBatches = Math.ceil(effectiveTarget / batchSize);

  console.log(`[AI-Synthesizer/Sonnet] Running ${totalBatches} batches in PARALLEL (max ${MAX_PARALLEL_BATCHES} concurrent)`);

  // Build all batch promises
  const batchPromises: Promise<any[]>[] = [];

  for (let batch = 0; batch < totalBatches; batch++) {
    const batchStart = batch * batchSize;
    const batchBreakthroughs = breakthroughs.slice(
      batchStart % breakthroughs.length,
      (batchStart % breakthroughs.length) + Math.min(batchSize, breakthroughs.length)
    );

    const batchConnections = connections.slice(batchStart, batchStart + batchSize);

    const prompt = buildSonnetPrompt(
      batchBreakthroughs,
      batchConnections,
      dataPoints.slice(0, 50), // Reduced from 100 for faster prompts
      uvpData,
      brandData,
      batch,
      batchSize,
      enrichedContext,
      buzzsumoData,
      detectedOutcomes, // V6: Pass outcomes
      outcomeMappings // V6: Pass mappings
    );

    // Create promise for this batch
    const batchPromise = (async () => {
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-proxy`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            provider: 'openrouter',
            model: 'anthropic/claude-opus-4.5', // All synthesis with Opus 4.5
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 4096, // Increased to prevent truncation
            temperature: 0.8
          })
        });

        if (!response.ok) {
          console.error(`[AI-Synthesizer/Sonnet] Batch ${batch + 1} FAILED: ${response.status}`);
          return [];
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || '';

        if (content.includes('```json')) {
          content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        }

        // JSON REPAIR: Fix truncated responses
        let batchInsights: any;
        try {
          batchInsights = JSON.parse(content);
        } catch (parseError) {
          console.warn(`[AI-Synthesizer/Sonnet] Batch ${batch + 1} JSON parse error, attempting repair...`);
          // Try to repair truncated JSON
          let repairedContent = content;

          // Count brackets to find imbalance
          const openBrackets = (repairedContent.match(/\[/g) || []).length;
          const closeBrackets = (repairedContent.match(/\]/g) || []).length;
          const openBraces = (repairedContent.match(/\{/g) || []).length;
          const closeBraces = (repairedContent.match(/\}/g) || []).length;

          // If inside an unterminated string, find and close it
          if (repairedContent.match(/"[^"]*$/)) {
            repairedContent = repairedContent.replace(/"[^"]*$/, '""');
          }

          // Close any unclosed arrays/objects
          for (let i = 0; i < openBrackets - closeBrackets; i++) {
            repairedContent += ']';
          }
          for (let i = 0; i < openBraces - closeBraces; i++) {
            repairedContent += '}';
          }

          // Try to extract partial valid JSON
          try {
            batchInsights = JSON.parse(repairedContent);
            console.log(`[AI-Synthesizer/Sonnet] Batch ${batch + 1} JSON REPAIRED successfully`);
          } catch {
            // Last resort: try to find insights array in the content
            const insightsMatch = content.match(/"insights"\s*:\s*\[([\s\S]*)/);
            if (insightsMatch) {
              try {
                // Extract individual insight objects
                const partialInsights: any[] = [];
                const objMatches = insightsMatch[1].matchAll(/\{[^{}]*("title"\s*:\s*"[^"]+")[^{}]*\}/g);
                for (const match of objMatches) {
                  try {
                    partialInsights.push(JSON.parse(match[0]));
                  } catch {}
                }
                if (partialInsights.length > 0) {
                  batchInsights = { insights: partialInsights };
                  console.log(`[AI-Synthesizer/Sonnet] Batch ${batch + 1} extracted ${partialInsights.length} partial insights`);
                }
              } catch {}
            }

            if (!batchInsights) {
              console.warn(`[AI-Synthesizer/Sonnet] Batch ${batch + 1} JSON repair FAILED - using raw fallback`);
              // FALLBACK: Create minimal insights from breakthroughs in this batch
              // This ensures we don't lose all data when AI returns bad JSON
              const fallbackInsights = batchBreakthroughs.map((b: any, idx: number) => ({
                id: `fallback-${batch}-${idx}`,
                title: b.hook || b.title || 'Insight discovered',
                hook: b.hook || '',
                body: [],
                sources: b.sources || ['Analysis'],
                psychology: { triggerType: 'curiosity', emotionalIntensity: 0.5, urgency: 'medium' },
                validation: { sourceCount: b.sources?.length || 1, crossPlatform: false },
                scores: { breakthrough: b.score || 50, eq: 50, relevance: 50, actionability: 50 }
              }));
              return fallbackInsights;
            }
          }
        }
        const results: any[] = [];

        for (const insight of (batchInsights.insights || [])) {
          if (!insight.title) continue;
          const sourceCount = insight.sources?.length || 1;
          results.push({
            id: `synth-${Date.now()}-${batch}-${results.length}`,
            title: insight.title,
            hook: insight.hook,
            body: insight.body || [],
            cta: insight.cta || 'Learn more',
            framework: insight.framework || 'aida',
            sources: insight.sources || [],
            psychology: {
              triggerType: insight.psychologyTrigger || 'curiosity',
              emotionalIntensity: insight.emotionalIntensity || 0.7,
              urgency: insight.urgency || 'medium'
            },
            validation: {
              sourceCount,
              crossPlatform: sourceCount > 1,
              uvpMatch: insight.uvpMatch,
              validationLabel: getValidationLabel(sourceCount)
            },
            scores: {
              breakthrough: insight.breakthroughScore || 70,
              eq: insight.eqScore || 65,
              relevance: insight.relevanceScore || 75,
              actionability: insight.actionabilityScore || 70
            },
            dimensions: {
              journeyStage: insight.journeyStage || 'awareness',
              persona: insight.persona || 'decision-maker',
              format: insight.format || 'insight',
              angle: insight.angle || 'educational'
            }
          });
        }

        console.log(`[AI-Synthesizer/Sonnet] Batch ${batch + 1}/${totalBatches} complete: ${results.length} insights`);
        return results;
      } catch (error) {
        console.error(`[AI-Synthesizer/Sonnet] Batch ${batch + 1} ERROR:`, error);
        return [];
      }
    })();

    batchPromises.push(batchPromise);
  }

  // Run all batches in parallel
  const batchResults = await Promise.all(batchPromises);

  // Flatten results
  for (const batchInsights of batchResults) {
    insights.push(...batchInsights);
  }

  console.log(`[AI-Synthesizer/Sonnet] ✅ All batches complete: ${insights.length} total insights`);
  return insights;
}

/**
 * Build the Sonnet prompt for batch generation
 * V6: Enhanced with outcome detection instead of V5 emotional filtering
 */
function buildSonnetPrompt(
  breakthroughs: any[],
  connections: any[],
  dataPoints: DataPoint[],
  uvpData: any,
  brandData: any,
  batchNumber: number,
  batchSize: number,
  enrichedContext?: EnrichedContext,
  buzzsumoData?: SynthesisInput['buzzsumoData'],
  detectedOutcomes?: DetectedOutcome[],
  outcomeMappings?: OutcomeDifferentiatorMapping[]
): string {
  const targetCustomer = uvpData?.target_customer || 'business professionals';
  const keyBenefit = uvpData?.key_benefit || 'improved outcomes';
  const transformation = uvpData?.transformation || '';

  // V3.1: Select framework based on EQ profile
  let focusFramework: string;
  if (enrichedContext) {
    const emotionalWeight = enrichedContext.eqProfile.emotional_weight;
    const topDriver = Object.entries(enrichedContext.eqWeights)
      .sort((a, b) => b[1] - a[1])[0][0];

    if (topDriver === 'fear') {
      focusFramework = 'pas'; // Problem-Agitate-Solution for fear
    } else if (topDriver === 'aspiration') {
      focusFramework = 'bab'; // Before-After-Bridge for transformation
    } else if (emotionalWeight > 60) {
      focusFramework = 'hook-story-offer'; // Emotional storytelling
    } else {
      focusFramework = 'aida'; // Structured for rational
    }
  } else {
    const frameworks = ['aida', 'pas', 'bab', 'hook-story-offer'];
    focusFramework = frameworks[batchNumber % frameworks.length];
  }

  // Vary journey stage focus
  const stages = ['awareness', 'consideration', 'decision', 'retention'];
  const focusStage = stages[batchNumber % stages.length];

  // V3.1: Build EQ-aware psychological trigger guidance
  const eqGuidance = enrichedContext ? `
EQ-ALIGNED PSYCHOLOGY (CRITICAL - use these triggers):
- Primary Driver: ${Object.entries(enrichedContext.eqWeights).sort((a, b) => b[1] - a[1])[0][0].toUpperCase()} (${Object.entries(enrichedContext.eqWeights).sort((a, b) => b[1] - a[1])[0][1]}%)
- Secondary Driver: ${Object.entries(enrichedContext.eqWeights).sort((a, b) => b[1] - a[1])[1][0].toUpperCase()} (${Object.entries(enrichedContext.eqWeights).sort((a, b) => b[1] - a[1])[1][1]}%)
- Emotional Weight: ${enrichedContext.eqProfile.emotional_weight}% (${enrichedContext.eqProfile.emotional_weight > 60 ? 'Lead with emotion' : enrichedContext.eqProfile.emotional_weight > 40 ? 'Balance emotion and logic' : 'Lead with data/ROI'})
- Purchase Mindset: "${enrichedContext.eqProfile.purchase_mindset}"
` : '';

  // V3.1: Build Industry-specific language guidance
  const industryGuidance = enrichedContext?.industryProfile ? `
INDUSTRY LANGUAGE REQUIREMENTS:
- MUST USE Power Words: ${enrichedContext.industryProfile.power_words?.slice(0, 10).join(', ')}
- MUST AVOID: ${enrichedContext.industryProfile.avoid_words?.slice(0, 8).join(', ')}
- Customer Phrases: ${enrichedContext.industryProfile.customer_language_dictionary?.slice(0, 8).join(', ')}
- Pain Language: ${enrichedContext.industryProfile.pain_point_language?.slice(0, 5).join(', ')}
` : '';

  // V3.1: Build Segment-specific tone guidance
  const segmentGuidance = enrichedContext ? `
SEGMENT TONE (${enrichedContext.segment.toUpperCase().replace('_', ' ')}):
- Tone: ${enrichedContext.segmentGuidelines.tone}
- Use phrases like: ${enrichedContext.segmentGuidelines.language.slice(0, 4).join(', ')}
- Focus on: ${enrichedContext.segmentGuidelines.focusAreas.slice(0, 3).join(', ')}
- NEVER mention: ${enrichedContext.segmentGuidelines.avoidAreas.slice(0, 3).join(', ')}
` : '';

  // V6: Build outcome context for content generation
  const outcomeContextBlock = detectedOutcomes ? `
V6 OUTCOME-DRIVEN CONTENT REQUIREMENTS:
${detectedOutcomes.map((o, i) => `${i+1}. [${o.type.toUpperCase()}] "${o.statement}" (Urgency: ${o.urgencyScore}/100, Impact: ${o.impactScore}/100)`).join('\n')}

OUTCOME-DIFFERENTIATOR MAPPINGS (USE THESE FOR INSIGHTS):
${outcomeMappings?.slice(0, 8).map((m, i) => `- Outcome "${detectedOutcomes.find(o => o.id === m.outcomeId)?.statement || 'Unknown'}" → Differentiator (${m.strengthScore}/100 strength)
  Reasoning: ${m.reasoning}`).join('\n') || 'No mappings available'}

CRITICAL: Every insight MUST address one of these specific customer outcomes. NO generic emotional content.
` : '';

  // V3.1: Build UVP-aligned CTA guidance
  const ctaGuidance = transformation ? `
UVP-ALIGNED CTAs:
- Every CTA must connect to transformation: "${transformation.substring(0, 100)}"
- Awareness CTAs: "Learn how to [achieve transformation]"
- Consideration CTAs: "See how [key benefit] works"
- Decision CTAs: "Start your [transformation] today"
` : '';

  // Synapse 2.0: Build BuzzSumo content performance benchmarks
  const buzzsumoGuidance = buzzsumoData ? `
CONTENT PERFORMANCE BENCHMARKS (from BuzzSumo):
${buzzsumoData.topHeadlinePatterns?.length ? `- Top-Performing Headline Patterns: ${buzzsumoData.topHeadlinePatterns.slice(0, 5).join(', ')}` : ''}
${buzzsumoData.optimalWordCount ? `- Optimal Content Length: ~${buzzsumoData.optimalWordCount} words (content this length gets highest engagement)` : ''}
${buzzsumoData.bestPublishDays?.length ? `- Best Days to Publish: ${buzzsumoData.bestPublishDays.join(', ')}` : ''}
${buzzsumoData.performanceByFormat ? `- Format Performance Ranking: ${Object.entries(buzzsumoData.performanceByFormat).sort((a, b) => b[1] - a[1]).map(([format, score]) => `${format} (${score}%)`).slice(0, 4).join(', ')}` : ''}

USE THESE BENCHMARKS: Model headlines after top-performing patterns. Match content length recommendations.
` : '';

  return `You are an expert content strategist creating insights for ${brandData?.name || 'a business'}.

TARGET CUSTOMER (the HERO of our content):
${targetCustomer.substring(0, 500)}

KEY BENEFIT WE HELP THEM ACHIEVE:
${keyBenefit.substring(0, 300)}

TRANSFORMATION PROMISE:
${transformation.substring(0, 200)}
${outcomeContextBlock}${eqGuidance}${industryGuidance}${segmentGuidance}${ctaGuidance}${buzzsumoGuidance}
BREAKTHROUGH PATTERNS IDENTIFIED:
${JSON.stringify(breakthroughs.slice(0, 5), null, 2)}

RAW DATA CONTEXT:
${dataPoints.slice(0, 15).map(dp => `[${dp.source}] ${dp.content?.substring(0, 150)}`).join('\n')}

BATCH INSTRUCTIONS:
- Generate exactly ${batchSize} unique insights
- Focus framework: ${focusFramework.toUpperCase()} (selected based on EQ profile)
- Focus journey stage: ${focusStage.toUpperCase()}
- Each insight MUST have a unique angle - no repetition
- Psychological triggers MUST align with EQ drivers above

V6 CRITICAL RULES:
1. OUTCOME-FIRST - Every insight MUST address a specific detected customer outcome above
2. CUSTOMER IS HERO - Write for the TARGET CUSTOMER achieving THEIR outcomes, not the business
3. NO TEMPLATES - Each title/hook must be completely unique
4. SPECIFIC > GENERIC - Use actual data points, not vague claims
5. MAP TO DIFFERENTIATORS - Connect insights to the strongest outcome-differentiator mappings
6. INDUSTRY LANGUAGE - Use power words, avoid forbidden words
7. SEGMENT APPROPRIATE - Match the tone and focus areas
8. UVP CTAs - Connect every CTA to the transformation promise

FRAMEWORK GUIDELINES:
- AIDA: Attention → Interest → Desire → Action (best for rational buyers)
- PAS: Problem → Agitate → Solution (best for fear-driven decisions)
- BAB: Before → After → Bridge (best for transformation messaging)
- Hook-Story-Offer: Compelling hook → Relatable story → Clear offer (best for emotional buyers)

OUTPUT FORMAT (JSON only):
{
  "insights": [
    {
      "title": "Compelling title using industry power words (no generic phrases)",
      "hook": "Opening sentence aligned with primary EQ driver",
      "body": ["Point 1", "Point 2", "Point 3"],
      "cta": "UVP-aligned call to action",
      "framework": "${focusFramework}",
      "sources": [{"platform": "reddit", "quote": "actual quote from data"}],
      "psychologyTrigger": "${enrichedContext ? Object.entries(enrichedContext.eqWeights).sort((a, b) => b[1] - a[1])[0][0] : 'curiosity'}",
      "emotionalIntensity": 0.8,
      "urgency": "low|medium|high|critical",
      "journeyStage": "${focusStage}",
      "persona": "specific persona this targets",
      "format": "insight|faq|howto|comparison|case-study",
      "angle": "educational|controversial|data-driven|story|comparison",
      "uvpMatch": "which UVP benefit this addresses",
      "breakthroughScore": 75,
      "eqScore": 70,
      "relevanceScore": 80,
      "actionabilityScore": 75
    }
  ]
}

Generate ${batchSize} high-quality, unique, EQ-aligned insights NOW. No explanations, just JSON.`;
}

// ============================================================================
// VOC (Voice of Customer) Phrase Extraction
// ============================================================================

/**
 * VOC Phrase Patterns - Customer voice signals
 * These patterns indicate high-intent customer needs and pain points
 */
const VOC_PATTERNS = {
  wishes: [
    /\bi wish\b/i,
    /\bif only\b/i,
    /\bwould be nice if\b/i,
    /\bi want\b/i,
    /\bi need\b/i,
    /\bi'm looking for\b/i,
    /\blooking for something that\b/i,
  ],
  frustrations: [
    /\bi hate\b/i,
    /\bi can't stand\b/i,
    /\bso frustrating\b/i,
    /\bdriving me crazy\b/i,
    /\bwaste of time\b/i,
    /\bwaste of money\b/i,
    /\bterrible experience\b/i,
    /\bawful\b/i,
  ],
  discoveries: [
    /\bfinally found\b/i,
    /\bgame changer\b/i,
    /\blife saver\b/i,
    /\bwish i knew\b/i,
    /\bwish i had found this\b/i,
    /\bwhere has this been\b/i,
  ],
  suggestions: [
    /\bsomeone should\b/i,
    /\bwhy doesn't\b/i,
    /\bwhy isn't there\b/i,
    /\bwhy can't\b/i,
    /\bthere should be\b/i,
    /\bneeds to be\b/i,
  ],
  comparisons: [
    /\bbetter than\b/i,
    /\bworse than\b/i,
    /\bunlike\b/i,
    /\bcompared to\b/i,
    /\bswitched from\b/i,
    /\bused to use\b/i,
  ],
  urgency: [
    /\bdesperately need\b/i,
    /\burgently looking\b/i,
    /\basap\b/i,
    /\bright now\b/i,
    /\bcan't wait\b/i,
    /\bimmediately\b/i,
  ],
};

export interface VOCPhrase {
  type: 'wish' | 'frustration' | 'discovery' | 'suggestion' | 'comparison' | 'urgency';
  phrase: string;
  context: string;
  source: string;
  emotionalIntensity: number;
}

export interface VOCExtractionResult {
  phrases: VOCPhrase[];
  summary: {
    totalWishes: number;
    totalFrustrations: number;
    totalDiscoveries: number;
    totalSuggestions: number;
    totalComparisons: number;
    totalUrgent: number;
  };
  topPainPoints: string[];
  topDesires: string[];
}

/**
 * Extract VOC (Voice of Customer) phrases from data points
 * Finds patterns like "I wish", "I hate", "Finally found", etc.
 */
export function extractVOCPhrases(dataPoints: DataPoint[]): VOCExtractionResult {
  console.log(`[VOC-Extractor] Analyzing ${dataPoints.length} data points for customer voice...`);

  const phrases: VOCPhrase[] = [];

  for (const dp of dataPoints) {
    if (!dp.content || dp.content.length < 20) continue;

    const content = dp.content;
    const source = dp.source || 'unknown';

    // Check each VOC pattern type
    for (const [type, patterns] of Object.entries(VOC_PATTERNS)) {
      for (const pattern of patterns) {
        const matches = content.match(new RegExp(`.{0,50}${pattern.source}.{0,100}`, 'gi'));

        if (matches) {
          for (const match of matches) {
            // Calculate emotional intensity based on punctuation and caps
            const exclamations = (match.match(/!/g) || []).length;
            const caps = (match.match(/[A-Z]{2,}/g) || []).length;
            const intensity = Math.min(1, 0.5 + (exclamations * 0.15) + (caps * 0.1));

            phrases.push({
              type: type.replace(/s$/, '') as VOCPhrase['type'], // Remove plural
              phrase: match.trim(),
              context: content.substring(0, 200),
              source,
              emotionalIntensity: intensity,
            });
          }
        }
      }
    }
  }

  // Deduplicate similar phrases
  const uniquePhrases = deduplicateVOCPhrases(phrases);

  // Calculate summary
  const summary = {
    totalWishes: uniquePhrases.filter(p => p.type === 'wish').length,
    totalFrustrations: uniquePhrases.filter(p => p.type === 'frustration').length,
    totalDiscoveries: uniquePhrases.filter(p => p.type === 'discovery').length,
    totalSuggestions: uniquePhrases.filter(p => p.type === 'suggestion').length,
    totalComparisons: uniquePhrases.filter(p => p.type === 'comparison').length,
    totalUrgent: uniquePhrases.filter(p => p.type === 'urgency').length,
  };

  // Extract top pain points (from frustrations + wishes)
  const painPhrases = uniquePhrases
    .filter(p => p.type === 'frustration' || p.type === 'wish')
    .sort((a, b) => b.emotionalIntensity - a.emotionalIntensity)
    .slice(0, 10);

  // Extract top desires (from wishes + discoveries)
  const desirePhrases = uniquePhrases
    .filter(p => p.type === 'wish' || p.type === 'discovery')
    .sort((a, b) => b.emotionalIntensity - a.emotionalIntensity)
    .slice(0, 10);

  const result: VOCExtractionResult = {
    phrases: uniquePhrases,
    summary,
    topPainPoints: painPhrases.map(p => p.phrase),
    topDesires: desirePhrases.map(p => p.phrase),
  };

  console.log(`[VOC-Extractor] ✅ Extracted ${uniquePhrases.length} VOC phrases:`, summary);

  return result;
}

/**
 * Deduplicate similar VOC phrases using simple text similarity
 */
function deduplicateVOCPhrases(phrases: VOCPhrase[]): VOCPhrase[] {
  const unique: VOCPhrase[] = [];

  for (const phrase of phrases) {
    const isDuplicate = unique.some(existing => {
      // Check if phrases are very similar (80%+ overlap)
      const words1 = new Set(phrase.phrase.toLowerCase().split(/\s+/));
      const words2 = new Set(existing.phrase.toLowerCase().split(/\s+/));
      const intersection = new Set([...words1].filter(w => words2.has(w)));
      const similarity = intersection.size / Math.max(words1.size, words2.size);
      return similarity > 0.8;
    });

    if (!isDuplicate) {
      unique.push(phrase);
    }
  }

  return unique;
}

/**
 * Enhance insights with VOC data
 * Adds customer voice quotes and emotional intensity to matching insights
 */
export function enhanceInsightsWithVOC(
  insights: SynthesizedInsight[],
  vocResult: VOCExtractionResult
): SynthesizedInsight[] {
  if (vocResult.phrases.length === 0) return insights;

  return insights.map(insight => {
    // Find matching VOC phrases for this insight
    const insightWords = new Set(insight.title.toLowerCase().split(/\s+/));

    const matchingVOC = vocResult.phrases.filter(voc => {
      const vocWords = new Set(voc.phrase.toLowerCase().split(/\s+/));
      const intersection = [...insightWords].filter(w => vocWords.has(w));
      return intersection.length >= 2; // At least 2 words match
    });

    if (matchingVOC.length > 0) {
      // Add VOC quotes as additional sources
      const vocSources = matchingVOC.slice(0, 2).map(voc => ({
        platform: `voc-${voc.type}`,
        quote: voc.phrase,
        url: undefined,
      }));

      // Boost emotional intensity based on VOC
      const maxVOCIntensity = Math.max(...matchingVOC.map(v => v.emotionalIntensity));

      return {
        ...insight,
        sources: [...insight.sources, ...vocSources],
        psychology: {
          ...insight.psychology,
          emotionalIntensity: Math.max(insight.psychology.emotionalIntensity, maxVOCIntensity),
        },
        validation: {
          ...insight.validation,
          sourceCount: insight.validation.sourceCount + vocSources.length,
          crossPlatform: true,
        },
      };
    }

    return insight;
  });
}

/**
 * V6: Extract live signals from API data (V1-style approach)
 * Now enhanced with business purpose context to target the right signals
 */
function extractLiveSignals(dataPoints: DataPoint[], brandData: any, uvpData: any, businessPurpose?: BusinessPurpose | null): LiveSignals {
  const signals: LiveSignals = {
    buyingSignals: [],
    temporalOpportunities: [],
    competitorGaps: [],
    customerConversations: []
  };

  // V6: Business purpose-aware buying signal patterns
  let buyingPatterns = [
    /looking for.*(?:alternative|replacement|new|better)/i,
    /switching from|migrating from|moving away from/i,
    /need(?:s)?\s+(?:a|an|to)/i,
    /budget.*(?:approved|allocated|available)/i,
    /evaluating|comparing|considering/i,
    /quote|proposal|pricing|cost/i,
    /implementation|deployment|rollout/i,
    /trial|demo|pilot|poc/i
  ];

  // Add business purpose-specific patterns
  if (businessPurpose) {
    const purposePatterns = getBuyingPatternsForPurpose(businessPurpose);
    buyingPatterns = [...buyingPatterns, ...purposePatterns];
  }

  // Temporal opportunity patterns (V1's timing-based triggers)
  const temporalPatterns = [
    /q[1-4]|quarter|quarterly/i,
    /year.?end|eoy|fiscal/i,
    /deadline|urgent|asap/i,
    /season|holiday|summer|winter/i,
    /renewal|contract.*expir/i,
    /budget.*cycle|planning/i
  ];

  // Competitor gap patterns (what competitors are missing)
  const competitorPatterns = [
    /(?:salesforce|hubspot|pipedrive).*(?:too|difficult|expensive|complex)/i,
    /wish.*(?:had|offered|supported)/i,
    /missing|lacking|doesn't have/i,
    /better.*than/i,
    /unlike.*competitor/i
  ];

  dataPoints.forEach(dp => {
    if (!dp.content || dp.content.length < 20) return;

    const content = dp.content.toLowerCase();
    const source = dp.source || 'unknown';

    // Extract buying signals (V1 approach: rational intent, not emotional filtering)
    buyingPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        signals.buyingSignals.push({
          signal: dp.content.substring(0, 200),
          source,
          urgency: getSignalUrgency(content),
          confidence: 0.8
        });
      }
    });

    // Extract temporal opportunities
    temporalPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        signals.temporalOpportunities.push({
          opportunity: dp.content.substring(0, 200),
          source,
          timing: extractTiming(content),
          relevance: 0.7
        });
      }
    });

    // Extract competitor gaps
    competitorPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        signals.competitorGaps.push({
          gap: dp.content.substring(0, 200),
          competitor: extractCompetitor(content),
          source,
          advantage: 0.8
        });
      }
    });

    // All meaningful conversations (not filtered by emotion like V5)
    if (dp.type === 'review' || dp.type === 'forum' || dp.type === 'social') {
      signals.customerConversations.push({
        conversation: dp.content.substring(0, 300),
        source,
        sentiment: dp.metadata?.sentiment || 'neutral',
        intent: detectIntent(content)
      });
    }
  });

  return signals;
}

// Helper functions for signal detection
function getSignalUrgency(content: string): 'low' | 'medium' | 'high' | 'critical' {
  if (/urgent|asap|immediate|deadline/i.test(content)) return 'critical';
  if (/soon|quick|fast|priority/i.test(content)) return 'high';
  if (/plan|consider|thinking/i.test(content)) return 'medium';
  return 'low';
}

function extractTiming(content: string): string {
  const timingMatch = content.match(/(q[1-4]|quarter|year.?end|fiscal|season|holiday|\d+\s*months?)/i);
  return timingMatch ? timingMatch[0] : 'general';
}

function extractCompetitor(content: string): string {
  const competitorMatch = content.match(/(salesforce|hubspot|pipedrive|marketo|pardot)/i);
  return competitorMatch ? competitorMatch[0] : 'competitor';
}

function detectIntent(content: string): string {
  if (/buy|purchase|price|quote/i.test(content)) return 'purchase';
  if (/problem|issue|trouble|help/i.test(content)) return 'support';
  if (/compare|versus|alternative/i.test(content)) return 'evaluation';
  if (/how.*work|feature|demo/i.test(content)) return 'research';
  return 'general';
}

// V6: Generate business purpose-specific buying patterns
function getBuyingPatternsForPurpose(businessPurpose: BusinessPurpose): RegExp[] {
  const patterns: RegExp[] = [];

  // Patterns based on product function
  switch (businessPurpose.productFunction.primary) {
    case 'automation':
      patterns.push(
        /automat.*(?:process|workflow|task)/i,
        /streamline.*(?:operations|workflow)/i,
        /reduce.*(?:manual|repetitive)/i,
        /ai.*(?:agent|assistant)/i
      );
      break;

    case 'compliance':
      patterns.push(
        /compliance.*(?:solution|software|tool)/i,
        /regulatory.*(?:requirement|mandate)/i,
        /audit.*(?:trail|report)/i,
        /risk.*(?:management|mitigation)/i
      );
      break;

    case 'analytics':
      patterns.push(
        /analytics.*(?:platform|dashboard)/i,
        /reporting.*(?:tool|solution)/i,
        /insight.*(?:platform|engine)/i,
        /data.*(?:visualization|analysis)/i
      );
      break;

    case 'communication':
      patterns.push(
        /customer.*(?:service|support)/i,
        /contact.*(?:center|management)/i,
        /chat.*(?:bot|platform)/i,
        /engagement.*(?:platform|tool)/i
      );
      break;
  }

  // Patterns based on customer role
  switch (businessPurpose.customerRole.department) {
    case 'sales':
      patterns.push(
        /sales.*(?:automation|tool|platform|crm)/i,
        /lead.*(?:generation|qualification|management)/i,
        /pipeline.*(?:management|automation)/i,
        /quota.*(?:attainment|management)/i,
        /crm.*(?:alternative|replacement|integration)/i
      );
      break;

    case 'operations':
      patterns.push(
        /operations.*(?:automation|efficiency)/i,
        /process.*(?:improvement|automation)/i,
        /workflow.*(?:management|optimization)/i,
        /productivity.*(?:tool|solution)/i
      );
      break;

    case 'marketing':
      patterns.push(
        /marketing.*(?:automation|platform)/i,
        /campaign.*(?:management|automation)/i,
        /customer.*(?:acquisition|engagement)/i,
        /attribution.*(?:tracking|analysis)/i
      );
      break;
  }

  // Patterns based on business outcome
  switch (businessPurpose.businessOutcome.primary) {
    case 'increase_revenue':
      patterns.push(
        /increase.*(?:revenue|sales|conversion)/i,
        /grow.*(?:business|revenue)/i,
        /boost.*(?:sales|performance)/i,
        /revenue.*(?:growth|optimization)/i
      );
      break;

    case 'improve_efficiency':
      patterns.push(
        /improve.*(?:efficiency|productivity)/i,
        /save.*(?:time|effort)/i,
        /optimize.*(?:process|workflow)/i,
        /eliminate.*(?:waste|manual)/i
      );
      break;

    case 'reduce_costs':
      patterns.push(
        /reduce.*(?:cost|expense)/i,
        /save.*(?:money|budget)/i,
        /cost.*(?:reduction|optimization)/i,
        /roi.*(?:improvement|optimization)/i
      );
      break;
  }

  // Add industry-specific patterns
  const industry = businessPurpose.targetIndustry.toLowerCase();
  if (industry.includes('insurance')) {
    patterns.push(
      /insurance.*(?:agent|broker|agency)/i,
      /policy.*(?:management|administration)/i,
      /claims.*(?:processing|management)/i,
      /underwriting.*(?:automation|support)/i,
      /quote.*(?:generation|management)/i
    );
  }

  return patterns;
}

export const aiInsightSynthesizer = {
  synthesizeInsights,
  generateFallbackInsights,
  extractVOCPhrases,
  enhanceInsightsWithVOC,
};
