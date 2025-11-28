/**
 * Insight Atomizer Service V3
 *
 * Takes breakthrough insights and "atomizes" them into multiple content variations:
 * - 1 breakthrough → 6+ format variations (Hook, Data, Story, FAQ, Comparison, Controversial)
 * - Cross-pollination with different journey stages
 * - Variety enforcement via dimension tracking
 *
 * Target: 50 breakthroughs × 6 formats × 2 stages = 500+ unique insights
 */

import type { DataPoint } from '@/types/connections.types';

export type ValidationLabel = 'multi-validated-breakthrough' | 'cross-platform-insight' | 'validated-pattern' | 'emerging-signal' | 'early-indicator';

export interface AtomizedInsight {
  id: string;
  parentId: string; // Original breakthrough ID
  title: string;
  hook: string;
  format: 'hook' | 'data-point' | 'story' | 'faq' | 'comparison' | 'controversial' | 'how-to' | 'case-study';
  journeyStage: 'awareness' | 'consideration' | 'decision' | 'retention';
  persona: string;
  angle: string;
  breakthroughScore: number;
  sources: string[];
  cta: string;
  psychology: {
    trigger: string;
    intensity: number;
  };
  // V3: Multi-source validation
  validation: {
    sourceCount: number;
    crossPlatform: boolean;
    validationLabel: ValidationLabel;
  };
}

/**
 * Get validation label based on source count
 */
function getValidationLabel(sourceCount: number): ValidationLabel {
  if (sourceCount >= 5) return 'multi-validated-breakthrough';
  if (sourceCount === 4) return 'cross-platform-insight';
  if (sourceCount === 3) return 'validated-pattern';
  if (sourceCount === 2) return 'emerging-signal';
  return 'early-indicator';
}

export interface AtomizerInput {
  breakthroughs: any[];
  correlatedInsights: any[];
  uvpData: any;
  brandData: any;
  targetCount?: number;
}

/**
 * Format templates for atomization
 * Each format transforms the same insight differently
 */
const FORMAT_TRANSFORMS = {
  hook: {
    prefix: '',
    style: 'attention-grabbing opening',
    cta: 'Learn more'
  },
  'data-point': {
    prefix: '📊 ',
    style: 'statistic or metric focused',
    cta: 'See the data'
  },
  story: {
    prefix: '',
    style: 'narrative with beginning-middle-end',
    cta: 'Read the full story'
  },
  faq: {
    prefix: 'Q: ',
    style: 'question format that addresses common concerns',
    cta: 'Get answers'
  },
  comparison: {
    prefix: '',
    style: 'vs format comparing options or approaches',
    cta: 'Compare options'
  },
  controversial: {
    prefix: '🔥 ',
    style: 'challenges conventional wisdom or industry norms',
    cta: 'Prove us wrong'
  },
  'how-to': {
    prefix: 'How to ',
    style: 'actionable step-by-step guidance',
    cta: 'Start now'
  },
  'case-study': {
    prefix: 'Case Study: ',
    style: 'real example with specific outcomes',
    cta: 'See results'
  }
};

/**
 * Journey stage transformations
 */
const JOURNEY_TRANSFORMS = {
  awareness: {
    focus: 'problem recognition',
    cta: 'Learn more',
    tone: 'educational'
  },
  consideration: {
    focus: 'solution evaluation',
    cta: 'Compare options',
    tone: 'consultative'
  },
  decision: {
    focus: 'purchase confidence',
    cta: 'Get started',
    tone: 'persuasive'
  },
  retention: {
    focus: 'value reinforcement',
    cta: 'Unlock more',
    tone: 'supportive'
  }
};

/**
 * Main atomization function
 */
export function atomizeInsights(input: AtomizerInput): AtomizedInsight[] {
  const { breakthroughs, correlatedInsights, uvpData, brandData, targetCount = 500 } = input;
  const startTime = Date.now();

  console.log(`[Atomizer] Starting atomization for ${breakthroughs.length} breakthroughs, ${correlatedInsights.length} correlations`);
  console.log(`[Atomizer] Target: ${targetCount} insights`);
  console.log(`[Atomizer] Will try: ${breakthroughs.length} × 8 formats × 4 stages = ${breakthroughs.length * 8 * 4} potential variations`);

  const atomized: AtomizedInsight[] = [];
  const seenTitles = new Set<string>();
  const dimensionCounts = {
    format: new Map<string, number>(),
    journeyStage: new Map<string, number>(),
    persona: new Map<string, number>()
  };

  // V3 FIX: Track skip reasons for debugging
  let skipReasons = { noTitle: 0, duplicate: 0, formatCap: 0, stageCap: 0, nullReturn: 0 };

  // Calculate limits per dimension for variety
  const maxPerFormat = Math.ceil(targetCount / Object.keys(FORMAT_TRANSFORMS).length) + 20;
  const maxPerStage = Math.ceil(targetCount / Object.keys(JOURNEY_TRANSFORMS).length) + 20;

  console.log(`[Atomizer] Dimension limits: maxPerFormat=${maxPerFormat}, maxPerStage=${maxPerStage}`);

  // Process breakthroughs first (highest quality)
  for (const breakthrough of breakthroughs) {
    if (atomized.length >= targetCount) break;

    const formats = Object.keys(FORMAT_TRANSFORMS) as Array<keyof typeof FORMAT_TRANSFORMS>;
    const stages = Object.keys(JOURNEY_TRANSFORMS) as Array<keyof typeof JOURNEY_TRANSFORMS>;

    // Atomize into multiple formats
    for (const format of formats) {
      if (atomized.length >= targetCount) break;

      // Skip if we have enough of this format
      const formatCount = dimensionCounts.format.get(format) || 0;
      if (formatCount >= maxPerFormat) {
        skipReasons.formatCap++;
        continue;
      }

      // Atomize across journey stages
      for (const stage of stages) {
        if (atomized.length >= targetCount) break;

        // Skip if we have enough of this stage
        const stageCount = dimensionCounts.journeyStage.get(stage) || 0;
        if (stageCount >= maxPerStage) {
          skipReasons.stageCap++;
          continue;
        }

        const atomizedInsight = atomizeBreakthrough(
          breakthrough,
          format,
          stage,
          uvpData,
          brandData
        );

        if (!atomizedInsight) {
          skipReasons.nullReturn++;
          continue;
        }

        // V3 FIX: Dedup by format+stage+title combo, not just title
        // This allows the SAME insight to appear in multiple formats/stages
        const titleKey = `${format}:${stage}:${atomizedInsight.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 30)}`;
        if (seenTitles.has(titleKey)) {
          skipReasons.duplicate++;
          continue;
        }
        seenTitles.add(titleKey);

        atomized.push(atomizedInsight);

        // Update dimension counts
        dimensionCounts.format.set(format, formatCount + 1);
        dimensionCounts.journeyStage.set(stage, stageCount + 1);
      }
    }
  }

  // Process correlated insights if we need more
  if (atomized.length < targetCount && correlatedInsights.length > 0) {
    console.log(`[Atomizer] Adding correlations to reach target (have ${atomized.length}, need ${targetCount})`);

    for (const insight of correlatedInsights) {
      if (atomized.length >= targetCount) break;

      // Find format with least coverage
      const formatEntries = Array.from(dimensionCounts.format.entries());
      const leastFormat = formatEntries.reduce((min, [f, c]) =>
        c < (dimensionCounts.format.get(min) || 0) ? f : min,
        'hook'
      ) as keyof typeof FORMAT_TRANSFORMS;

      // Find stage with least coverage
      const stageEntries = Array.from(dimensionCounts.journeyStage.entries());
      const leastStage = stageEntries.reduce((min, [s, c]) =>
        c < (dimensionCounts.journeyStage.get(min) || 0) ? s : min,
        'awareness'
      ) as keyof typeof JOURNEY_TRANSFORMS;

      const atomizedInsight = atomizeCorrelation(
        insight,
        leastFormat,
        leastStage,
        uvpData,
        brandData
      );

      if (!atomizedInsight) continue;

      // V3 FIX: Dedup by format+stage+title combo for correlations too
      const titleKey = `${leastFormat}:${leastStage}:${atomizedInsight.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 30)}`;
      if (seenTitles.has(titleKey)) continue;
      seenTitles.add(titleKey);

      atomized.push(atomizedInsight);

      // Update dimension counts
      dimensionCounts.format.set(leastFormat, (dimensionCounts.format.get(leastFormat) || 0) + 1);
      dimensionCounts.journeyStage.set(leastStage, (dimensionCounts.journeyStage.get(leastStage) || 0) + 1);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Atomizer] ✅ Atomized into ${atomized.length} insights in ${elapsed}s`);

  // Log skip reasons for debugging
  console.log(`[Atomizer] Skip reasons:`, skipReasons);

  // Log dimension distribution
  console.log(`[Atomizer] Format distribution:`, Object.fromEntries(dimensionCounts.format));
  console.log(`[Atomizer] Journey distribution:`, Object.fromEntries(dimensionCounts.journeyStage));

  return atomized;
}

/**
 * Atomize a single breakthrough into a specific format and stage
 */
function atomizeBreakthrough(
  breakthrough: any,
  format: keyof typeof FORMAT_TRANSFORMS,
  stage: keyof typeof JOURNEY_TRANSFORMS,
  uvpData: any,
  brandData: any
): AtomizedInsight | null {
  const formatConfig = FORMAT_TRANSFORMS[format];
  const stageConfig = JOURNEY_TRANSFORMS[stage];

  // Extract base content
  const baseTitle = breakthrough.title || breakthrough.angle || '';
  const baseHook = breakthrough.hook || breakthrough.reasoning || '';
  const baseSources = breakthrough.provenance || breakthrough.sources || [];

  if (!baseTitle || baseTitle.length < 10) return null;

  // Transform title based on format
  let title = baseTitle;
  switch (format) {
    case 'faq':
      title = transformToQuestion(baseTitle);
      break;
    case 'how-to':
      title = `How to ${extractAction(baseTitle)}`;
      break;
    case 'comparison':
      title = transformToComparison(baseTitle, brandData?.industry);
      break;
    case 'controversial':
      title = transformToControversial(baseTitle);
      break;
    case 'case-study':
      title = `Case Study: ${extractOutcome(baseTitle)}`;
      break;
    case 'data-point':
      title = addDataPrefix(baseTitle);
      break;
    default:
      title = formatConfig.prefix + baseTitle;
  }

  // Transform CTA based on journey stage
  const cta = stageConfig.cta;

  // Calculate breakthrough score (slightly reduced from parent)
  const score = Math.max(30, (breakthrough.score || 70) - 10 + Math.random() * 5);
  const sourcesList = Array.isArray(baseSources) ? baseSources.slice(0, 3) : [];
  const sourceCount = sourcesList.length;

  return {
    id: `atom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    parentId: breakthrough.id || 'unknown',
    title: title.substring(0, 150),
    hook: baseHook.substring(0, 300),
    format,
    journeyStage: stage,
    persona: extractPersona(baseTitle, uvpData),
    angle: formatConfig.style,
    breakthroughScore: Math.round(score),
    sources: sourcesList,
    cta,
    psychology: {
      trigger: breakthrough.urgency || 'curiosity',
      intensity: (breakthrough.emotionalIntensity || 0.6) * 0.9
    },
    validation: {
      sourceCount,
      crossPlatform: sourceCount > 1,
      validationLabel: getValidationLabel(sourceCount)
    }
  };
}

/**
 * Atomize a correlated insight
 */
function atomizeCorrelation(
  insight: any,
  format: keyof typeof FORMAT_TRANSFORMS,
  stage: keyof typeof JOURNEY_TRANSFORMS,
  uvpData: any,
  brandData: any
): AtomizedInsight | null {
  const formatConfig = FORMAT_TRANSFORMS[format];
  const stageConfig = JOURNEY_TRANSFORMS[stage];

  const baseTitle = insight.title || '';
  const baseDescription = insight.description || insight.actionableInsight || '';

  if (!baseTitle || baseTitle.length < 10) return null;

  // Transform based on format
  let title = baseTitle;
  switch (format) {
    case 'faq':
      title = transformToQuestion(baseTitle);
      break;
    case 'how-to':
      title = `How to ${extractAction(baseTitle)}`;
      break;
    default:
      title = formatConfig.prefix + baseTitle;
  }

  const sources = insight.sources?.map((s: any) => s.source || s).slice(0, 3) || [];
  const sourceCount = sources.length;

  return {
    id: `atom-corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    parentId: insight.id || 'unknown',
    title: title.substring(0, 150),
    hook: baseDescription.substring(0, 300),
    format,
    journeyStage: stage,
    persona: extractPersona(baseTitle, uvpData),
    angle: formatConfig.style,
    breakthroughScore: Math.round((insight.breakthroughScore || 60) * 0.9),
    sources,
    cta: stageConfig.cta,
    psychology: {
      trigger: insight.psychology?.triggerCategory || 'curiosity',
      intensity: 0.6
    },
    validation: {
      sourceCount,
      crossPlatform: sourceCount > 1,
      validationLabel: getValidationLabel(sourceCount)
    }
  };
}

// Helper functions for transformations

function transformToQuestion(title: string): string {
  // Convert statement to question
  const questionStarters = ['Why do', 'How can', 'What makes', 'When should', 'Who needs'];
  const starter = questionStarters[Math.floor(Math.random() * questionStarters.length)];

  // Simple transformation - prepend question starter
  const cleanTitle = title.replace(/^(How to|Why|What|When|Who|Which)/i, '').trim();
  return `${starter} ${cleanTitle.toLowerCase()}?`;
}

function extractAction(title: string): string {
  // Extract the actionable part from a title
  const words = title.split(/\s+/);
  const actionWords = ['improve', 'increase', 'reduce', 'fix', 'solve', 'avoid', 'achieve', 'optimize', 'leverage'];

  for (let i = 0; i < words.length; i++) {
    if (actionWords.includes(words[i].toLowerCase())) {
      return words.slice(i).join(' ').toLowerCase();
    }
  }

  return words.slice(0, 8).join(' ').toLowerCase();
}

function transformToComparison(title: string, industry?: string): string {
  const vsTerms = ['traditional methods', 'manual processes', 'competitors', 'old approaches'];
  const vsTerm = vsTerms[Math.floor(Math.random() * vsTerms.length)];
  return `${title.split(' ').slice(0, 6).join(' ')} vs ${vsTerm}`;
}

function transformToControversial(title: string): string {
  const controversialPrefixes = [
    'Unpopular opinion: ',
    'The truth about ',
    'Why everyone is wrong about ',
    'Stop believing '
  ];
  const prefix = controversialPrefixes[Math.floor(Math.random() * controversialPrefixes.length)];
  return prefix + title.toLowerCase();
}

function extractOutcome(title: string): string {
  const words = title.split(/\s+/);
  return words.slice(0, 8).join(' ');
}

function addDataPrefix(title: string): string {
  const dataIndicators = ['📊', '📈', '💡', '🔢'];
  const indicator = dataIndicators[Math.floor(Math.random() * dataIndicators.length)];
  return `${indicator} ${title}`;
}

function extractPersona(title: string, uvpData: any): string {
  // Try to extract persona from UVP
  const targetCustomer = uvpData?.target_customer?.toLowerCase() || '';

  if (targetCustomer.includes('director')) return 'Director';
  if (targetCustomer.includes('manager')) return 'Manager';
  if (targetCustomer.includes('owner')) return 'Business Owner';
  if (targetCustomer.includes('ceo') || targetCustomer.includes('executive')) return 'Executive';
  if (targetCustomer.includes('developer') || targetCustomer.includes('engineer')) return 'Technical';

  // Fallback based on title content
  const titleLower = title.toLowerCase();
  if (titleLower.includes('cost') || titleLower.includes('roi') || titleLower.includes('budget')) return 'Decision Maker';
  if (titleLower.includes('implement') || titleLower.includes('setup') || titleLower.includes('configure')) return 'Technical';
  if (titleLower.includes('team') || titleLower.includes('hire') || titleLower.includes('staff')) return 'Manager';

  return 'Decision Maker';
}

export const insightAtomizer = {
  atomizeInsights
};
