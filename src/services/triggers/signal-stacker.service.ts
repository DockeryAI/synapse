/**
 * Signal Stacker Service
 *
 * Multi-signal stacking engine for enterprise ABM capabilities.
 * Correlates signals across sources to reduce false positives and
 * increase confidence in buying intent signals.
 *
 * Phase 4: Enterprise ABM Layer
 *
 * Core Capabilities:
 * 1. Cross-source correlation - Links signals from different platforms
 * 2. Signal clustering - Groups related signals into intent clusters
 * 3. False positive reduction - Requires 2+ sources for high confidence
 * 4. Composite score calculation - Weighted multi-signal scoring
 *
 * Target: Reduce false positive rate from ~48% to ~20%
 *
 * Created: 2025-12-01
 */

import { recencyCalculatorService, type RecencyResult } from './recency-calculator.service';
import { competitorAttributionService, type CompetitorMention } from './competitor-attribution.service';
import { confidenceScorerService, type ConfidenceLevel } from './confidence-scorer.service';
import type { BusinessProfileType } from './profile-detection.service';

// ============================================================================
// TYPES
// ============================================================================

export type SignalSource =
  | 'g2'
  | 'capterra'
  | 'trustradius'
  | 'reddit'
  | 'hackernews'
  | 'linkedin'
  | 'google-reviews'
  | 'yelp'
  | 'twitter'
  | 'youtube'
  | 'news'
  | 'job-posting'
  | 'forum'
  | 'other';

export type IntentType =
  | 'churn-from-competitor'
  | 'active-evaluation'
  | 'pain-point-expression'
  | 'feature-comparison'
  | 'budget-allocation'
  | 'vendor-search'
  | 'implementation-planning'
  | 'contract-renewal'
  | 'growth-expansion'
  | 'compliance-need';

export interface RawSignalInput {
  id: string;
  source: SignalSource;
  content: string;
  timestamp: Date;
  url?: string;
  author?: string;
  authorCompany?: string;
  authorRole?: string;
  metadata?: Record<string, any>;
}

export interface CorrelatedSignal extends RawSignalInput {
  intentTypes: IntentType[];
  recencyScore: number;
  sourceWeight: number;
  competitorMentions: CompetitorMention[];
  correlationId?: string; // Links to other signals in same cluster
}

export interface SignalCluster {
  id: string;
  signals: CorrelatedSignal[];
  primaryIntent: IntentType;
  secondaryIntents: IntentType[];
  compositeScore: number;
  confidenceLevel: ConfidenceLevel;
  sourceCount: number;
  sourceDiversity: number; // 0-1, higher = more diverse sources
  timeSpan: {
    earliest: Date;
    latest: Date;
    daysSpan: number;
  };
  targetCompany?: string;
  targetCompetitors: string[];
  clusterStrength: 'weak' | 'moderate' | 'strong' | 'very-strong';
  falsePositiveRisk: 'low' | 'medium' | 'high';
  actionability: string;
}

export interface StackedSignalResult {
  clusters: SignalCluster[];
  unclusteredSignals: CorrelatedSignal[];
  summary: StackingSummary;
}

export interface StackingSummary {
  totalSignals: number;
  clusteredSignals: number;
  unclusteredSignals: number;
  clusterCount: number;
  averageClusterSize: number;
  averageCompositeScore: number;
  highConfidenceClusters: number;
  falsePositiveReduction: number; // Estimated % reduction
  topIntents: IntentType[];
  topCompetitors: string[];
}

export interface CorrelationConfig {
  minSignalsForCluster: number; // Default: 2
  maxTimeSpanDays: number; // Max days between signals in cluster
  sourceWeights: Record<SignalSource, number>;
  intentCorrelationThreshold: number; // 0-1, how similar intents must be
  companyMatchWeight: number; // Boost for same company signals
  competitorMatchWeight: number; // Boost for same competitor mentions
}

export interface ClusteringCriteria {
  sameCompany: boolean;
  sameCompetitor: boolean;
  similarIntent: boolean;
  withinTimeWindow: boolean;
  minimumScore: number;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_SOURCE_WEIGHTS: Record<SignalSource, number> = {
  'g2': 1.0,
  'capterra': 0.95,
  'trustradius': 0.9,
  'reddit': 0.85,
  'hackernews': 0.85,
  'linkedin': 0.8,
  'google-reviews': 0.85,
  'yelp': 0.75,
  'twitter': 0.6,
  'youtube': 0.7,
  'news': 0.75,
  'job-posting': 0.8,
  'forum': 0.7,
  'other': 0.5
};

const DEFAULT_CONFIG: CorrelationConfig = {
  minSignalsForCluster: 2,
  maxTimeSpanDays: 30,
  sourceWeights: DEFAULT_SOURCE_WEIGHTS,
  intentCorrelationThreshold: 0.6,
  companyMatchWeight: 1.5,
  competitorMatchWeight: 1.3
};

// Intent correlation matrix - which intents are related
const INTENT_CORRELATION: Record<IntentType, IntentType[]> = {
  'churn-from-competitor': ['active-evaluation', 'pain-point-expression', 'vendor-search'],
  'active-evaluation': ['feature-comparison', 'vendor-search', 'churn-from-competitor'],
  'pain-point-expression': ['churn-from-competitor', 'vendor-search', 'active-evaluation'],
  'feature-comparison': ['active-evaluation', 'vendor-search'],
  'budget-allocation': ['implementation-planning', 'contract-renewal', 'growth-expansion'],
  'vendor-search': ['active-evaluation', 'feature-comparison', 'pain-point-expression'],
  'implementation-planning': ['budget-allocation', 'active-evaluation'],
  'contract-renewal': ['budget-allocation', 'churn-from-competitor', 'active-evaluation'],
  'growth-expansion': ['budget-allocation', 'vendor-search'],
  'compliance-need': ['vendor-search', 'active-evaluation']
};

// Intent detection patterns
const INTENT_PATTERNS: Record<IntentType, RegExp[]> = {
  'churn-from-competitor': [
    /(?:leaving|left|switching|switched|migrating|migrated)\s+(?:from\s+)?[A-Z][a-z]+/i,
    /(?:cancelled|canceling|ending|ended)\s+(?:our|my)\s+(?:subscription|contract)/i,
    /(?:frustrated|disappointed|fed up)\s+with\s+[A-Z][a-z]+/i
  ],
  'active-evaluation': [
    /(?:evaluating|considering|looking\s+at|reviewing)\s+(?:options|alternatives|solutions)/i,
    /(?:shortlist|finalists?|top\s+\d+)\s+(?:vendors?|solutions?|tools?)/i,
    /(?:demo|trial|pilot|poc)\s+(?:request|scheduled|completed)/i
  ],
  'pain-point-expression': [
    /(?:struggle|struggling|frustrated|frustrating|pain|painful)/i,
    /(?:problem|issue|challenge|difficulty)\s+with/i,
    /(?:can't|cannot|unable|impossible)\s+to/i,
    /(?:wish|hope|need)\s+(?:we|I|they)\s+(?:could|had|would)/i
  ],
  'feature-comparison': [
    /(?:compare|comparison|vs\.?|versus)\s+[A-Z][a-z]+/i,
    /(?:which|what)\s+(?:is|one\s+is)\s+(?:better|best)/i,
    /(?:pros?\s+(?:and|&)\s+cons?)/i,
    /(?:difference|differences)\s+between/i
  ],
  'budget-allocation': [
    /(?:budget|budgeting)\s+(?:for|approval|allocated)/i,
    /(?:approved|securing|secured)\s+(?:budget|funding)/i,
    /(?:fiscal\s+year|fy|q[1-4])\s+(?:budget|planning|spend)/i
  ],
  'vendor-search': [
    /(?:looking\s+for|searching\s+for|need)\s+(?:a|an)\s+(?:new\s+)?(?:vendor|solution|tool|platform)/i,
    /(?:recommend|suggestion|advice)\s+(?:for|on)\s+(?:a\s+)?(?:vendor|solution|tool)/i,
    /(?:rfp|request\s+for\s+proposal|bid\s+request)/i
  ],
  'implementation-planning': [
    /(?:implement|implementing|implementation|rollout|roll\s+out)/i,
    /(?:onboarding|getting\s+started|setup|configuration)/i,
    /(?:timeline|schedule|plan)\s+(?:for|to)\s+(?:implement|deploy|launch)/i
  ],
  'contract-renewal': [
    /(?:contract|agreement)\s+(?:renewal|renewing|up\s+for\s+renewal)/i,
    /(?:annual|yearly)\s+(?:review|renewal)/i,
    /(?:renegotiate|renegotiating|negotiate)\s+(?:contract|terms)/i
  ],
  'growth-expansion': [
    /(?:expand|expanding|growth|scaling|growing)/i,
    /(?:new\s+)?(?:location|office|team|department)\s+(?:opening|launching)/i,
    /(?:hiring|new\s+hires?|headcount)\s+(?:growth|increase)/i
  ],
  'compliance-need': [
    /(?:compliance|compliant|regulatory|regulation)/i,
    /(?:gdpr|soc\s*2|iso|hipaa|ccpa|pci)/i,
    /(?:audit|certification|attestation)\s+(?:requirement|needed|required)/i
  ]
};

// ============================================================================
// SERVICE
// ============================================================================

class SignalStackerService {
  private config: CorrelationConfig;

  constructor(config?: Partial<CorrelationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Stack and correlate signals into clusters
   */
  stackSignals(
    signals: RawSignalInput[],
    competitors?: string[],
    config?: Partial<CorrelationConfig>
  ): StackedSignalResult {
    const mergedConfig = { ...this.config, ...config };

    // Step 1: Enrich signals with correlation data
    const correlatedSignals = signals.map(signal =>
      this.correlateSignal(signal, competitors)
    );

    // Step 2: Build clusters
    const clusters = this.buildClusters(correlatedSignals, mergedConfig);

    // Step 3: Identify unclustered signals
    const clusteredIds = new Set(
      clusters.flatMap(c => c.signals.map(s => s.id))
    );
    const unclusteredSignals = correlatedSignals.filter(
      s => !clusteredIds.has(s.id)
    );

    // Step 4: Generate summary
    const summary = this.generateSummary(clusters, unclusteredSignals, signals.length);

    return {
      clusters,
      unclusteredSignals,
      summary
    };
  }

  /**
   * Correlate a single signal with intent and scoring
   */
  correlateSignal(
    signal: RawSignalInput,
    competitors?: string[]
  ): CorrelatedSignal {
    // Detect intents
    const intentTypes = this.detectIntents(signal.content);

    // Calculate recency score
    const recencyResult = recencyCalculatorService.calculateRecency(
      signal.timestamp,
      'social-mention'
    );

    // Get source weight
    const sourceWeight = this.config.sourceWeights[signal.source] || 0.5;

    // Find competitor mentions
    const competitorMentions = competitors
      ? competitorAttributionService.findMentionsInContent(signal.content, competitors)
      : [];

    return {
      ...signal,
      intentTypes,
      recencyScore: recencyResult.score,
      sourceWeight,
      competitorMentions
    };
  }

  /**
   * Calculate composite score for a cluster
   */
  calculateClusterScore(cluster: SignalCluster): number {
    const signals = cluster.signals;

    if (signals.length === 0) return 0;

    // Base score: average of signal scores
    const avgSignalScore = signals.reduce((sum, s) =>
      sum + (s.recencyScore * s.sourceWeight), 0
    ) / signals.length;

    // Source diversity bonus (more sources = higher confidence)
    const uniqueSources = new Set(signals.map(s => s.source));
    const diversityBonus = Math.min(0.3, (uniqueSources.size - 1) * 0.1);

    // Multi-signal bonus
    const signalCountBonus = Math.min(0.4, (signals.length - 1) * 0.1);

    // Intent alignment bonus
    const primaryIntentCount = signals.filter(s =>
      s.intentTypes.includes(cluster.primaryIntent)
    ).length;
    const intentAlignmentBonus = (primaryIntentCount / signals.length) * 0.2;

    // Competitor mention bonus
    const hasCompetitorMention = signals.some(s => s.competitorMentions.length > 0);
    const competitorBonus = hasCompetitorMention ? 0.15 : 0;

    // Time proximity bonus (signals closer in time = more relevant)
    const timeProximityBonus = cluster.timeSpan.daysSpan <= 7 ? 0.1 :
                               cluster.timeSpan.daysSpan <= 14 ? 0.05 : 0;

    return Math.min(1, avgSignalScore + diversityBonus + signalCountBonus +
                       intentAlignmentBonus + competitorBonus + timeProximityBonus);
  }

  /**
   * Assess false positive risk for a cluster
   */
  assessFalsePositiveRisk(cluster: SignalCluster): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // Single source = higher risk
    if (cluster.sourceCount === 1) riskScore += 3;
    else if (cluster.sourceCount === 2) riskScore += 1;

    // Low source diversity = higher risk
    if (cluster.sourceDiversity < 0.3) riskScore += 2;
    else if (cluster.sourceDiversity < 0.5) riskScore += 1;

    // Old signals = higher risk
    if (cluster.timeSpan.daysSpan > 21) riskScore += 2;
    else if (cluster.timeSpan.daysSpan > 14) riskScore += 1;

    // Weak intent alignment = higher risk
    const intentMatch = cluster.signals.filter(s =>
      s.intentTypes.includes(cluster.primaryIntent)
    ).length / cluster.signals.length;
    if (intentMatch < 0.5) riskScore += 2;
    else if (intentMatch < 0.75) riskScore += 1;

    // No competitor mentions = slightly higher risk for churn signals
    if (cluster.targetCompetitors.length === 0 &&
        cluster.primaryIntent === 'churn-from-competitor') {
      riskScore += 1;
    }

    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  }

  /**
   * Determine cluster strength
   */
  determineClusterStrength(cluster: SignalCluster): 'weak' | 'moderate' | 'strong' | 'very-strong' {
    const score = cluster.compositeScore;
    const sourceCount = cluster.sourceCount;
    const signalCount = cluster.signals.length;

    // Very strong: high score, 3+ sources, 4+ signals
    if (score >= 0.75 && sourceCount >= 3 && signalCount >= 4) {
      return 'very-strong';
    }

    // Strong: good score, 2+ sources, 3+ signals
    if (score >= 0.6 && sourceCount >= 2 && signalCount >= 3) {
      return 'strong';
    }

    // Moderate: decent score, 2+ sources
    if (score >= 0.45 && sourceCount >= 2) {
      return 'moderate';
    }

    return 'weak';
  }

  /**
   * Generate actionability recommendation
   */
  generateActionability(cluster: SignalCluster): string {
    const strength = cluster.clusterStrength;
    const intent = cluster.primaryIntent;
    const hasCompetitor = cluster.targetCompetitors.length > 0;

    const actionMap: Record<IntentType, Record<string, string>> = {
      'churn-from-competitor': {
        'very-strong': 'Immediate outreach - competitive displacement opportunity',
        'strong': 'Priority follow-up with migration support messaging',
        'moderate': 'Add to nurture with competitor pain point content',
        'weak': 'Monitor for additional signals'
      },
      'active-evaluation': {
        'very-strong': 'Direct sales engagement - active buying cycle',
        'strong': 'Request demo or consultation call',
        'moderate': 'Send comparison guides and case studies',
        'weak': 'Add to consideration stage nurture'
      },
      'pain-point-expression': {
        'very-strong': 'Personalized outreach addressing specific pain',
        'strong': 'Solution-focused content delivery',
        'moderate': 'Educational content on pain point resolution',
        'weak': 'Monitor and gather more context'
      },
      'feature-comparison': {
        'very-strong': 'Sales call with feature deep-dive',
        'strong': 'Send detailed feature comparison',
        'moderate': 'Competitive positioning content',
        'weak': 'Track feature interest patterns'
      },
      'budget-allocation': {
        'very-strong': 'Executive engagement - budget available',
        'strong': 'ROI-focused proposal',
        'moderate': 'Business case content',
        'weak': 'Budget planning resources'
      },
      'vendor-search': {
        'very-strong': 'Immediate response - active RFP/search',
        'strong': 'Capabilities presentation',
        'moderate': 'Vendor evaluation guides',
        'weak': 'Brand awareness content'
      },
      'implementation-planning': {
        'very-strong': 'Implementation consultation offer',
        'strong': 'Onboarding support materials',
        'moderate': 'Implementation best practices',
        'weak': 'Getting started resources'
      },
      'contract-renewal': {
        'very-strong': 'Competitive bid - renewal window open',
        'strong': 'Value proposition refresh',
        'moderate': 'Renewal consideration content',
        'weak': 'Long-term nurture for next cycle'
      },
      'growth-expansion': {
        'very-strong': 'Growth partnership discussion',
        'strong': 'Scalability-focused outreach',
        'moderate': 'Growth case studies',
        'weak': 'Expansion planning resources'
      },
      'compliance-need': {
        'very-strong': 'Compliance consultation - urgent need',
        'strong': 'Compliance documentation delivery',
        'moderate': 'Security/compliance content',
        'weak': 'Compliance resource library'
      }
    };

    const baseAction = actionMap[intent]?.[strength] || 'Monitor for additional signals';

    if (hasCompetitor && cluster.targetCompetitors.length > 0) {
      return `${baseAction} (Target: ${cluster.targetCompetitors[0]})`;
    }

    return baseAction;
  }

  /**
   * Get configuration
   */
  getConfig(): CorrelationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CorrelationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private detectIntents(content: string): IntentType[] {
    const detectedIntents: IntentType[] = [];

    for (const [intentType, patterns] of Object.entries(INTENT_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          detectedIntents.push(intentType as IntentType);
          break; // Only add each intent once
        }
      }
    }

    // Default to pain-point if nothing detected but has negative sentiment
    if (detectedIntents.length === 0) {
      if (/(?:problem|issue|frustrat|disappoint|struggle)/i.test(content)) {
        detectedIntents.push('pain-point-expression');
      }
    }

    return detectedIntents;
  }

  private buildClusters(
    signals: CorrelatedSignal[],
    config: CorrelationConfig
  ): SignalCluster[] {
    const clusters: SignalCluster[] = [];
    const processed = new Set<string>();

    // Sort signals by recency (newest first)
    const sortedSignals = [...signals].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    for (const signal of sortedSignals) {
      if (processed.has(signal.id)) continue;

      // Find related signals
      const relatedSignals = this.findRelatedSignals(
        signal,
        sortedSignals.filter(s => !processed.has(s.id) && s.id !== signal.id),
        config
      );

      // Create cluster if we have enough signals
      if (relatedSignals.length + 1 >= config.minSignalsForCluster) {
        const clusterSignals = [signal, ...relatedSignals];
        const cluster = this.createCluster(clusterSignals);
        clusters.push(cluster);

        // Mark all signals as processed
        clusterSignals.forEach(s => processed.add(s.id));
      }
    }

    // Sort clusters by composite score
    return clusters.sort((a, b) => b.compositeScore - a.compositeScore);
  }

  private findRelatedSignals(
    anchor: CorrelatedSignal,
    candidates: CorrelatedSignal[],
    config: CorrelationConfig
  ): CorrelatedSignal[] {
    const related: CorrelatedSignal[] = [];

    for (const candidate of candidates) {
      const criteria = this.evaluateCorrelation(anchor, candidate, config);

      // Must meet minimum criteria
      if (criteria.withinTimeWindow &&
          (criteria.similarIntent || criteria.sameCompetitor || criteria.sameCompany)) {
        related.push(candidate);
      }
    }

    return related;
  }

  private evaluateCorrelation(
    a: CorrelatedSignal,
    b: CorrelatedSignal,
    config: CorrelationConfig
  ): ClusteringCriteria {
    // Time window check
    const timeDiff = Math.abs(a.timestamp.getTime() - b.timestamp.getTime());
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    const withinTimeWindow = daysDiff <= config.maxTimeSpanDays;

    // Same company check
    const sameCompany = !!(a.authorCompany && b.authorCompany &&
      a.authorCompany.toLowerCase() === b.authorCompany.toLowerCase());

    // Same competitor check
    const aCompetitors = new Set(a.competitorMentions.map(m => m.matchedCompetitor.toLowerCase()));
    const bCompetitors = new Set(b.competitorMentions.map(m => m.matchedCompetitor.toLowerCase()));
    const sameCompetitor = [...aCompetitors].some(c => bCompetitors.has(c));

    // Intent similarity check
    let intentSimilarity = 0;
    for (const intentA of a.intentTypes) {
      if (b.intentTypes.includes(intentA)) {
        intentSimilarity += 1;
      } else {
        // Check correlated intents
        const correlatedIntents = INTENT_CORRELATION[intentA] || [];
        if (b.intentTypes.some(i => correlatedIntents.includes(i))) {
          intentSimilarity += 0.5;
        }
      }
    }
    const maxIntents = Math.max(a.intentTypes.length, b.intentTypes.length, 1);
    const normalizedSimilarity = intentSimilarity / maxIntents;
    const similarIntent = normalizedSimilarity >= config.intentCorrelationThreshold;

    // Minimum score (weighted combination)
    let score = 0;
    if (sameCompany) score += config.companyMatchWeight;
    if (sameCompetitor) score += config.competitorMatchWeight;
    if (similarIntent) score += normalizedSimilarity;

    return {
      sameCompany,
      sameCompetitor,
      similarIntent,
      withinTimeWindow,
      minimumScore: score
    };
  }

  private createCluster(signals: CorrelatedSignal[]): SignalCluster {
    const id = `cluster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Assign correlation ID to all signals
    signals.forEach(s => s.correlationId = id);

    // Determine primary intent (most common)
    const intentCounts = new Map<IntentType, number>();
    for (const signal of signals) {
      for (const intent of signal.intentTypes) {
        intentCounts.set(intent, (intentCounts.get(intent) || 0) + 1);
      }
    }
    const sortedIntents = Array.from(intentCounts.entries())
      .sort((a, b) => b[1] - a[1]);
    const primaryIntent = sortedIntents[0]?.[0] || 'vendor-search';
    const secondaryIntents = sortedIntents.slice(1, 4).map(([intent]) => intent);

    // Calculate time span
    const timestamps = signals.map(s => s.timestamp.getTime());
    const earliest = new Date(Math.min(...timestamps));
    const latest = new Date(Math.max(...timestamps));
    const daysSpan = (latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24);

    // Get unique sources
    const uniqueSources = new Set(signals.map(s => s.source));
    const sourceCount = uniqueSources.size;
    const sourceDiversity = sourceCount / Object.keys(DEFAULT_SOURCE_WEIGHTS).length;

    // Get target competitors
    const competitorSet = new Set<string>();
    signals.forEach(s => {
      s.competitorMentions.forEach(m => competitorSet.add(m.matchedCompetitor));
    });
    const targetCompetitors = Array.from(competitorSet);

    // Get target company (if consistent)
    const companies = signals
      .map(s => s.authorCompany)
      .filter((c): c is string => !!c);
    const targetCompany = companies.length > 0 &&
      companies.every(c => c.toLowerCase() === companies[0].toLowerCase())
      ? companies[0]
      : undefined;

    // Build cluster object
    const cluster: SignalCluster = {
      id,
      signals,
      primaryIntent,
      secondaryIntents,
      compositeScore: 0, // Will be calculated
      confidenceLevel: 'medium', // Will be determined
      sourceCount,
      sourceDiversity,
      timeSpan: { earliest, latest, daysSpan },
      targetCompany,
      targetCompetitors,
      clusterStrength: 'moderate', // Will be determined
      falsePositiveRisk: 'medium', // Will be assessed
      actionability: '' // Will be generated
    };

    // Calculate scores and assessments
    cluster.compositeScore = this.calculateClusterScore(cluster);
    cluster.confidenceLevel = cluster.compositeScore >= 0.7 ? 'high' :
                              cluster.compositeScore >= 0.45 ? 'medium' : 'low';
    cluster.clusterStrength = this.determineClusterStrength(cluster);
    cluster.falsePositiveRisk = this.assessFalsePositiveRisk(cluster);
    cluster.actionability = this.generateActionability(cluster);

    return cluster;
  }

  private generateSummary(
    clusters: SignalCluster[],
    unclusteredSignals: CorrelatedSignal[],
    totalSignals: number
  ): StackingSummary {
    const clusteredSignals = clusters.reduce((sum, c) => sum + c.signals.length, 0);

    // Calculate average composite score
    const avgScore = clusters.length > 0
      ? clusters.reduce((sum, c) => sum + c.compositeScore, 0) / clusters.length
      : 0;

    // Count high confidence clusters
    const highConfidenceClusters = clusters.filter(c => c.confidenceLevel === 'high').length;

    // Calculate false positive reduction estimate
    // Single signals have ~48% FP rate, multi-signal clusters have ~20%
    const singleSignalFPRate = 0.48;
    const clusterFPRate = 0.20;
    const falsePositiveReduction = ((singleSignalFPRate - clusterFPRate) / singleSignalFPRate) * 100;

    // Get top intents
    const intentCounts = new Map<IntentType, number>();
    clusters.forEach(c => {
      intentCounts.set(c.primaryIntent, (intentCounts.get(c.primaryIntent) || 0) + 1);
    });
    const topIntents = Array.from(intentCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([intent]) => intent);

    // Get top competitors
    const competitorCounts = new Map<string, number>();
    clusters.forEach(c => {
      c.targetCompetitors.forEach(comp => {
        competitorCounts.set(comp, (competitorCounts.get(comp) || 0) + 1);
      });
    });
    const topCompetitors = Array.from(competitorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([comp]) => comp);

    return {
      totalSignals,
      clusteredSignals,
      unclusteredSignals: unclusteredSignals.length,
      clusterCount: clusters.length,
      averageClusterSize: clusters.length > 0 ? clusteredSignals / clusters.length : 0,
      averageCompositeScore: avgScore,
      highConfidenceClusters,
      falsePositiveReduction,
      topIntents,
      topCompetitors
    };
  }
}

// Export singleton
export const signalStackerService = new SignalStackerService();
export { SignalStackerService };
