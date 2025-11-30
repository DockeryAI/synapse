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
import { ContentFrameworkLibrary, type FrameworkType } from '@/services/synapse/generation/ContentFrameworkLibrary';
import type { EnrichedContext } from './content-synthesis-orchestrator.service';

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
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
 * Main synthesis function - orchestrates Opus + Sonnet models
 * V3.1: Now accepts enriched context with EQ, Industry Profile, and Segment data
 */
export async function synthesizeInsights(input: SynthesisInput): Promise<SynthesizedInsight[]> {
  const { connections, dataPoints, uvpData, brandData, targetCount = 100, enrichedContext } = input;
  const startTime = Date.now();

  console.log(`[AI-Synthesizer] Starting synthesis for ${connections.length} connections, ${dataPoints.length} data points`);
  console.log(`[AI-Synthesizer] Target: ${targetCount} unique insights`);

  // V3.1: Log enriched context if available
  if (enrichedContext) {
    console.log(`[AI-Synthesizer] Enriched context available:`);
    console.log(`  - EQ Profile: ${enrichedContext.eqProfile.emotional_weight}% emotional, JTBD: ${enrichedContext.eqProfile.jtbd_focus}`);
    console.log(`  - Segment: ${enrichedContext.segment}`);
    console.log(`  - Industry Profile: ${enrichedContext.industryProfile ? 'Loaded' : 'Not available'}`);
  }

  // Step 1: Use Opus 4.5 to analyze connections and identify breakthrough patterns
  // V3 FIX: Increased from 30 to 100 for more comprehensive analysis
  const breakthroughAnalysis = await analyzeBreakthroughsWithOpus(
    connections.slice(0, 100),
    dataPoints,
    uvpData,
    brandData,
    enrichedContext // V3.1: Pass enriched context
  );

  // Step 2: Use Sonnet 4.5 to generate titles/hooks at scale
  const generatedInsights = await generateInsightsWithSonnet(
    breakthroughAnalysis,
    connections,
    dataPoints,
    uvpData,
    brandData,
    targetCount,
    enrichedContext // V3.1: Pass enriched context
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
        uvpMatch: uvpData?.target_customer ? 0.7 : undefined,
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
 * V3.1: Enhanced with EQ Profile, Industry Profile, and Segment context
 */
async function analyzeBreakthroughsWithOpus(
  topConnections: any[],
  dataPoints: DataPoint[],
  uvpData: any,
  brandData: any,
  enrichedContext?: EnrichedContext
): Promise<any> {
  console.log('[AI-Synthesizer/Opus] Analyzing breakthroughs with Opus 4.5...');

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
${eqContextBlock}${industryContextBlock}${segmentContextBlock}
TOP CROSS-PLATFORM CONNECTIONS (sorted by breakthrough score):
${JSON.stringify(connectionSummary, null, 2)}

RAW DATA POINT SAMPLE (from multiple APIs):
${JSON.stringify(dataPointSample, null, 2)}

YOUR TASK: Identify the top 10 breakthrough content opportunities that:
1. Connect insights from 3+ different sources
2. Address the TARGET CUSTOMER's problems (not the business owner's)
3. ALIGN with the EQ profile above - use the TOP decision drivers
4. Match the SEGMENT tone and language guidelines
5. Use INDUSTRY power words and avoid forbidden words
6. Can be actioned immediately with specific content angles

CRITICAL - CUSTOMER-FIRST FOCUS:
- The customer is the HERO. The business is the GUIDE.
- Content should help the TARGET CUSTOMER achieve THEIR goals
- Example: For insurance software, write for "Insurance Operations Directors" not "OpenDialog"

For each breakthrough, provide:
1. Breakthrough Theme (2-5 words)
2. Why It's Powerful (what psychological lever does it pull - MUST align with top EQ drivers)
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
        model: 'anthropic/claude-sonnet-4', // Sonnet 4 for fast deep analysis
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
 */
async function generateInsightsWithSonnet(
  breakthroughAnalysis: any,
  connections: any[],
  dataPoints: DataPoint[],
  uvpData: any,
  brandData: any,
  targetCount: number,
  enrichedContext?: EnrichedContext
): Promise<SynthesizedInsight[]> {
  console.log('[AI-Synthesizer/Sonnet] Generating insights with Sonnet 4.5...');

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
      enrichedContext
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
            model: 'anthropic/claude-3.5-sonnet', // 3.5 Sonnet is faster than Sonnet 4
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
 * V3.1: Enhanced with EQ, Industry Profile, and Segment context
 */
function buildSonnetPrompt(
  breakthroughs: any[],
  connections: any[],
  dataPoints: DataPoint[],
  uvpData: any,
  brandData: any,
  batchNumber: number,
  batchSize: number,
  enrichedContext?: EnrichedContext
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

  // V3.1: Build UVP-aligned CTA guidance
  const ctaGuidance = transformation ? `
UVP-ALIGNED CTAs:
- Every CTA must connect to transformation: "${transformation.substring(0, 100)}"
- Awareness CTAs: "Learn how to [achieve transformation]"
- Consideration CTAs: "See how [key benefit] works"
- Decision CTAs: "Start your [transformation] today"
` : '';

  return `You are an expert content strategist creating insights for ${brandData?.name || 'a business'}.

TARGET CUSTOMER (the HERO of our content):
${targetCustomer.substring(0, 500)}

KEY BENEFIT WE HELP THEM ACHIEVE:
${keyBenefit.substring(0, 300)}

TRANSFORMATION PROMISE:
${transformation.substring(0, 200)}
${eqGuidance}${industryGuidance}${segmentGuidance}${ctaGuidance}
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

CRITICAL RULES:
1. CUSTOMER IS HERO - Write for the TARGET CUSTOMER, not the business
2. NO TEMPLATES - Each title/hook must be completely unique
3. SPECIFIC > GENERIC - Use actual data points, not vague claims
4. EQ-ALIGNED - Use psychological triggers that match the EQ profile
5. INDUSTRY LANGUAGE - Use power words, avoid forbidden words
6. SEGMENT APPROPRIATE - Match the tone and focus areas
7. UVP CTAs - Connect every CTA to the transformation promise

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

export const aiInsightSynthesizer = {
  synthesizeInsights,
  generateFallbackInsights
};
