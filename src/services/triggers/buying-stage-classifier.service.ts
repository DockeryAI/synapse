/**
 * Buying Stage Classifier Service
 *
 * Classifies signals into buyer journey stages for targeted engagement.
 * Maps intent signals to the B2B buying process to inform sales/marketing strategy.
 *
 * Phase 4: Enterprise ABM Layer
 *
 * Core Capabilities:
 * 1. Research phase indicators - Early awareness and education
 * 2. Evaluation phase signals - Active comparison and shortlisting
 * 3. Decision phase triggers - Ready to buy, final selection
 * 4. Post-purchase intent - Upsell, expansion, or churn risk
 *
 * Buying Journey Stages:
 * - Unaware: No active need recognized
 * - Problem-Aware: Recognizes pain but not solution
 * - Solution-Aware: Knows solutions exist, researching
 * - Vendor-Aware: Knows specific vendors, evaluating
 * - Decision: Ready to purchase, final negotiations
 * - Customer: Post-purchase (expansion/retention/churn)
 *
 * Created: 2025-12-01
 */

import type { BusinessProfileType } from './_archived/profile-detection.service';
import type { IntentType } from './signal-stacker.service';
import type { UrgencyLevel } from './urgency-detector.service';

// ============================================================================
// TYPES
// ============================================================================

export type BuyingStage =
  | 'unaware'
  | 'problem-aware'
  | 'solution-aware'
  | 'vendor-aware'
  | 'decision'
  | 'customer-expansion'
  | 'customer-retention'
  | 'customer-churn-risk';

export type StageVelocity = 'stalled' | 'slow' | 'normal' | 'fast' | 'accelerating';

export interface StageIndicator {
  pattern: RegExp;
  weight: number; // 0-1
  stage: BuyingStage;
  description: string;
}

export interface BuyingSignal {
  id: string;
  content: string;
  source: string;
  timestamp: Date;
  author?: string;
  authorRole?: string;
  authorCompany?: string;
  competitorMentioned?: string;
  metadata?: Record<string, any>;
}

export interface StageClassification {
  primaryStage: BuyingStage;
  confidence: number; // 0-1
  stageScores: Record<BuyingStage, number>;
  indicators: DetectedIndicator[];
  velocity: StageVelocity;
  timeInStage?: string;
  nextLikelyStage: BuyingStage | null;
  conversionProbability: number;
  recommendedAction: string;
  engagementPriority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface DetectedIndicator {
  indicator: string;
  stage: BuyingStage;
  weight: number;
  matchedText: string;
}

export interface JourneyAnalysis {
  signals: BuyingSignal[];
  classifications: StageClassification[];
  journeyMap: JourneyMapEntry[];
  currentStage: BuyingStage;
  stageHistory: StageHistoryEntry[];
  averageVelocity: StageVelocity;
  daysInJourney: number;
  conversionLikelihood: number;
  bottlenecks: string[];
  opportunities: string[];
}

export interface JourneyMapEntry {
  stage: BuyingStage;
  signalCount: number;
  averageConfidence: number;
  firstSeen: Date;
  lastSeen: Date;
  daysInStage: number;
}

export interface StageHistoryEntry {
  stage: BuyingStage;
  enteredAt: Date;
  exitedAt?: Date;
  daysInStage: number;
  velocity: StageVelocity;
}

export interface StageClassifierConfig {
  // Scoring weights
  indicatorMinWeight: number;
  multiIndicatorBonus: number;
  recencyBoost: number;

  // Velocity thresholds (days)
  velocityThresholds: {
    fast: number;
    normal: number;
    slow: number;
  };

  // Conversion probability adjustments
  conversionBaseRates: Record<BuyingStage, number>;

  // Profile-specific stage emphasis
  profileStageEmphasis?: Partial<Record<BusinessProfileType, BuyingStage[]>>;
}

// ============================================================================
// STAGE INDICATORS
// ============================================================================

const STAGE_INDICATORS: StageIndicator[] = [
  // Problem-Aware Stage
  {
    pattern: /(?:struggling|frustrated|pain|problem|issue|challenge)\s+with/i,
    weight: 0.9,
    stage: 'problem-aware',
    description: 'Expressing pain or frustration'
  },
  {
    pattern: /(?:how\s+do\s+(?:I|we|you)|what\s+is\s+the\s+best\s+way\s+to)/i,
    weight: 0.7,
    stage: 'problem-aware',
    description: 'Seeking general guidance'
  },
  {
    pattern: /(?:anyone\s+else\s+(?:have|experience)|is\s+it\s+just\s+me)/i,
    weight: 0.8,
    stage: 'problem-aware',
    description: 'Validating problem existence'
  },
  {
    pattern: /(?:wish|if\s+only|would\s+be\s+nice\s+if)/i,
    weight: 0.6,
    stage: 'problem-aware',
    description: 'Expressing unmet need'
  },

  // Solution-Aware Stage
  {
    pattern: /(?:what\s+(?:tools?|solutions?|software|platforms?)\s+(?:do|can|should))/i,
    weight: 0.85,
    stage: 'solution-aware',
    description: 'Asking about solution categories'
  },
  {
    pattern: /(?:looking\s+for|searching\s+for|need)\s+(?:a|an)\s+(?:tool|solution|software|platform|service)/i,
    weight: 0.9,
    stage: 'solution-aware',
    description: 'Active solution search'
  },
  {
    pattern: /(?:what\s+are\s+(?:the|some)\s+(?:best|top|popular))/i,
    weight: 0.75,
    stage: 'solution-aware',
    description: 'Researching options'
  },
  {
    pattern: /(?:how\s+(?:do|does)\s+(?:a|an)\s+\w+\s+(?:tool|platform|solution)\s+work)/i,
    weight: 0.7,
    stage: 'solution-aware',
    description: 'Understanding solution mechanics'
  },

  // Vendor-Aware Stage
  {
    pattern: /(?:compare|comparison|vs\.?|versus)\s+[A-Z][a-z]+/i,
    weight: 0.95,
    stage: 'vendor-aware',
    description: 'Comparing specific vendors'
  },
  {
    pattern: /(?:which\s+(?:one\s+)?is\s+better|pros?\s+(?:and|&)\s+cons?)/i,
    weight: 0.9,
    stage: 'vendor-aware',
    description: 'Evaluating trade-offs'
  },
  {
    pattern: /(?:anyone\s+(?:use|using|tried|recommend))\s+[A-Z][a-z]+/i,
    weight: 0.85,
    stage: 'vendor-aware',
    description: 'Seeking vendor validation'
  },
  {
    pattern: /(?:thinking\s+(?:about|of)\s+(?:trying|using|switching\s+to))\s+[A-Z][a-z]+/i,
    weight: 0.9,
    stage: 'vendor-aware',
    description: 'Considering specific vendor'
  },
  {
    pattern: /(?:shortlist|finalists?|top\s+\d+\s+(?:vendors?|options?))/i,
    weight: 0.95,
    stage: 'vendor-aware',
    description: 'Narrowing options'
  },

  // Decision Stage
  {
    pattern: /(?:ready\s+to\s+(?:buy|purchase|sign|commit|move\s+forward))/i,
    weight: 0.95,
    stage: 'decision',
    description: 'Purchase readiness'
  },
  {
    pattern: /(?:demo|trial|pilot|poc)\s+(?:scheduled|completed|went\s+well)/i,
    weight: 0.9,
    stage: 'decision',
    description: 'Trial/demo completed'
  },
  {
    pattern: /(?:negotiating|finalizing|signing)\s+(?:contract|agreement|deal)/i,
    weight: 0.95,
    stage: 'decision',
    description: 'Contract negotiation'
  },
  {
    pattern: /(?:approved|secured|allocated)\s+(?:budget|funding)/i,
    weight: 0.9,
    stage: 'decision',
    description: 'Budget approved'
  },
  {
    pattern: /(?:just\s+)?(?:chose|picked|selected|decided\s+on)\s+[A-Z][a-z]+/i,
    weight: 0.95,
    stage: 'decision',
    description: 'Vendor selection made'
  },

  // Customer-Expansion Stage
  {
    pattern: /(?:love|loving|great\s+experience\s+with)\s+[A-Z][a-z]+/i,
    weight: 0.7,
    stage: 'customer-expansion',
    description: 'Positive customer sentiment'
  },
  {
    pattern: /(?:expand|expanding|add(?:ing)?\s+more\s+(?:seats|licenses|users))/i,
    weight: 0.9,
    stage: 'customer-expansion',
    description: 'Usage expansion'
  },
  {
    pattern: /(?:upgrade|upgrading|moving\s+to\s+(?:pro|enterprise|premium))/i,
    weight: 0.9,
    stage: 'customer-expansion',
    description: 'Plan upgrade'
  },
  {
    pattern: /(?:recommend(?:ing)?|would\s+recommend|highly\s+recommend)/i,
    weight: 0.75,
    stage: 'customer-expansion',
    description: 'Recommending to others'
  },

  // Customer-Retention Stage
  {
    pattern: /(?:renew(?:ing|ed)?|renewal)\s+(?:our|my|the)?\s*(?:subscription|contract|license)/i,
    weight: 0.9,
    stage: 'customer-retention',
    description: 'Renewal discussion'
  },
  {
    pattern: /(?:still\s+(?:using|happy\s+with)|been\s+using\s+for\s+\d+\s+(?:months?|years?))/i,
    weight: 0.7,
    stage: 'customer-retention',
    description: 'Continued usage'
  },
  {
    pattern: /(?:works?\s+(?:well|great|fine)\s+for\s+(?:us|our|my))/i,
    weight: 0.65,
    stage: 'customer-retention',
    description: 'Satisfaction expression'
  },

  // Customer-Churn-Risk Stage
  {
    pattern: /(?:cancel(?:l?ing|l?ed)?|ending|terminating)\s+(?:our|my|the)?\s*(?:subscription|account|contract)/i,
    weight: 0.95,
    stage: 'customer-churn-risk',
    description: 'Cancellation intent'
  },
  {
    pattern: /(?:not\s+renewing|won't\s+renew|letting\s+(?:it\s+)?expire)/i,
    weight: 0.95,
    stage: 'customer-churn-risk',
    description: 'Non-renewal decision'
  },
  {
    pattern: /(?:looking\s+for\s+alternatives?\s+to|replacing|switching\s+away\s+from)/i,
    weight: 0.9,
    stage: 'customer-churn-risk',
    description: 'Active replacement search'
  },
  {
    pattern: /(?:disappointed|frustrated|unhappy)\s+with\s+[A-Z][a-z]+/i,
    weight: 0.85,
    stage: 'customer-churn-risk',
    description: 'Customer dissatisfaction'
  },
  {
    pattern: /(?:hate|regret|mistake)\s+(?:using|choosing|signing\s+up\s+(?:for|with))/i,
    weight: 0.9,
    stage: 'customer-churn-risk',
    description: 'Strong negative sentiment'
  }
];

// Stage progression order
const STAGE_PROGRESSION: BuyingStage[] = [
  'unaware',
  'problem-aware',
  'solution-aware',
  'vendor-aware',
  'decision',
  'customer-expansion' // Or customer-retention/customer-churn-risk
];

// Default configuration
const DEFAULT_CONFIG: StageClassifierConfig = {
  indicatorMinWeight: 0.5,
  multiIndicatorBonus: 0.1,
  recencyBoost: 0.15,
  velocityThresholds: {
    fast: 7,   // < 7 days = fast
    normal: 21, // 7-21 days = normal
    slow: 45    // 21-45 days = slow, > 45 = stalled
  },
  conversionBaseRates: {
    'unaware': 0.01,
    'problem-aware': 0.05,
    'solution-aware': 0.15,
    'vendor-aware': 0.35,
    'decision': 0.75,
    'customer-expansion': 0.60,
    'customer-retention': 0.85,
    'customer-churn-risk': 0.10
  }
};

// Stage-specific recommended actions
const STAGE_ACTIONS: Record<BuyingStage, Record<string, string>> = {
  'unaware': {
    low: 'Add to awareness campaigns',
    medium: 'Educational content distribution',
    high: 'Thought leadership engagement',
    urgent: 'High-value account - personalized outreach'
  },
  'problem-aware': {
    low: 'Problem-focused content nurture',
    medium: 'Pain point case studies',
    high: 'Solution education webinars',
    urgent: 'Consultative problem-solving call'
  },
  'solution-aware': {
    low: 'Category comparison guides',
    medium: 'Solution-fit assessment tools',
    high: 'ROI calculators and demos',
    urgent: 'Personalized solution briefing'
  },
  'vendor-aware': {
    low: 'Competitive positioning content',
    medium: 'Feature comparison and trials',
    high: 'Custom demo and proposal',
    urgent: 'Executive engagement and negotiation'
  },
  'decision': {
    low: 'Proposal support',
    medium: 'Contract and implementation planning',
    high: 'Final negotiation and closing',
    urgent: 'Immediate close - remove all barriers'
  },
  'customer-expansion': {
    low: 'Success check-ins and resources',
    medium: 'Upsell opportunity identification',
    high: 'Expansion proposal and planning',
    urgent: 'Strategic account growth partnership'
  },
  'customer-retention': {
    low: 'Value reinforcement and QBRs',
    medium: 'Renewal preparation and incentives',
    high: 'Proactive retention engagement',
    urgent: 'Executive sponsor renewal call'
  },
  'customer-churn-risk': {
    low: 'Satisfaction survey and follow-up',
    medium: 'Problem resolution and recovery',
    high: 'Executive intervention and save plan',
    urgent: 'Immediate escalation - save at all costs'
  }
};

// ============================================================================
// SERVICE
// ============================================================================

class BuyingStageClassifierService {
  private config: StageClassifierConfig;

  constructor(config?: Partial<StageClassifierConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Classify a single signal into a buying stage
   */
  classifySignal(
    signal: BuyingSignal,
    contextSignals?: BuyingSignal[]
  ): StageClassification {
    // Detect indicators
    const indicators = this.detectIndicators(signal.content);

    // Calculate stage scores
    const stageScores = this.calculateStageScores(indicators);

    // Determine primary stage
    const { stage: primaryStage, confidence } = this.determinePrimaryStage(stageScores);

    // Calculate velocity based on context
    const velocity = contextSignals
      ? this.calculateVelocity(signal, contextSignals)
      : 'normal';

    // Determine next likely stage
    const nextLikelyStage = this.predictNextStage(primaryStage, velocity);

    // Calculate conversion probability
    const conversionProbability = this.calculateConversionProbability(
      primaryStage,
      confidence,
      velocity,
      indicators
    );

    // Determine engagement priority
    const engagementPriority = this.determineEngagementPriority(
      primaryStage,
      confidence,
      velocity,
      conversionProbability
    );

    // Get recommended action
    const recommendedAction = STAGE_ACTIONS[primaryStage][engagementPriority];

    return {
      primaryStage,
      confidence,
      stageScores,
      indicators,
      velocity,
      nextLikelyStage,
      conversionProbability,
      recommendedAction,
      engagementPriority
    };
  }

  /**
   * Analyze complete buyer journey from multiple signals
   */
  analyzeJourney(signals: BuyingSignal[]): JourneyAnalysis {
    if (signals.length === 0) {
      return this.emptyJourneyAnalysis();
    }

    // Sort by timestamp
    const sortedSignals = [...signals].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Classify each signal
    const classifications: StageClassification[] = [];
    for (let i = 0; i < sortedSignals.length; i++) {
      const contextSignals = sortedSignals.slice(0, i);
      const classification = this.classifySignal(sortedSignals[i], contextSignals);
      classifications.push(classification);
    }

    // Build journey map
    const journeyMap = this.buildJourneyMap(sortedSignals, classifications);

    // Build stage history
    const stageHistory = this.buildStageHistory(sortedSignals, classifications);

    // Determine current stage
    const currentStage = classifications[classifications.length - 1]?.primaryStage || 'unaware';

    // Calculate average velocity
    const averageVelocity = this.calculateAverageVelocity(stageHistory);

    // Calculate days in journey
    const daysInJourney = Math.ceil(
      (sortedSignals[sortedSignals.length - 1].timestamp.getTime() -
       sortedSignals[0].timestamp.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate conversion likelihood
    const conversionLikelihood = this.calculateOverallConversionLikelihood(
      classifications,
      stageHistory,
      currentStage
    );

    // Identify bottlenecks and opportunities
    const { bottlenecks, opportunities } = this.identifyInsights(
      journeyMap,
      stageHistory,
      classifications
    );

    return {
      signals: sortedSignals,
      classifications,
      journeyMap,
      currentStage,
      stageHistory,
      averageVelocity,
      daysInJourney,
      conversionLikelihood,
      bottlenecks,
      opportunities
    };
  }

  /**
   * Get the next recommended stage in the journey
   */
  getNextStage(currentStage: BuyingStage): BuyingStage | null {
    const index = STAGE_PROGRESSION.indexOf(currentStage);
    if (index === -1 || index >= STAGE_PROGRESSION.length - 1) {
      return null;
    }
    return STAGE_PROGRESSION[index + 1];
  }

  /**
   * Get all stage indicators for reference
   */
  getStageIndicators(): StageIndicator[] {
    return [...STAGE_INDICATORS];
  }

  /**
   * Get recommended actions for a stage
   */
  getStageActions(stage: BuyingStage): Record<string, string> {
    return { ...STAGE_ACTIONS[stage] };
  }

  /**
   * Get configuration
   */
  getConfig(): StageClassifierConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<StageClassifierConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private detectIndicators(content: string): DetectedIndicator[] {
    const detected: DetectedIndicator[] = [];

    for (const indicator of STAGE_INDICATORS) {
      const match = content.match(indicator.pattern);
      if (match && indicator.weight >= this.config.indicatorMinWeight) {
        detected.push({
          indicator: indicator.description,
          stage: indicator.stage,
          weight: indicator.weight,
          matchedText: match[0]
        });
      }
    }

    return detected;
  }

  private calculateStageScores(
    indicators: DetectedIndicator[]
  ): Record<BuyingStage, number> {
    const scores: Record<BuyingStage, number> = {
      'unaware': 0,
      'problem-aware': 0,
      'solution-aware': 0,
      'vendor-aware': 0,
      'decision': 0,
      'customer-expansion': 0,
      'customer-retention': 0,
      'customer-churn-risk': 0
    };

    // Calculate weighted scores per stage
    for (const indicator of indicators) {
      scores[indicator.stage] += indicator.weight;
    }

    // Apply multi-indicator bonus
    for (const stage of Object.keys(scores) as BuyingStage[]) {
      const stageIndicators = indicators.filter(i => i.stage === stage);
      if (stageIndicators.length > 1) {
        scores[stage] += this.config.multiIndicatorBonus * (stageIndicators.length - 1);
      }
    }

    // Normalize scores
    const maxScore = Math.max(...Object.values(scores), 0.1);
    for (const stage of Object.keys(scores) as BuyingStage[]) {
      scores[stage] = scores[stage] / maxScore;
    }

    return scores;
  }

  private determinePrimaryStage(
    stageScores: Record<BuyingStage, number>
  ): { stage: BuyingStage; confidence: number } {
    let maxStage: BuyingStage = 'unaware';
    let maxScore = 0;

    for (const [stage, score] of Object.entries(stageScores)) {
      if (score > maxScore) {
        maxScore = score;
        maxStage = stage as BuyingStage;
      }
    }

    // If no indicators detected, default to unaware with low confidence
    if (maxScore === 0) {
      return { stage: 'unaware', confidence: 0.3 };
    }

    // Calculate confidence based on score margin
    const sortedScores = Object.values(stageScores).sort((a, b) => b - a);
    const margin = sortedScores.length > 1 ? sortedScores[0] - sortedScores[1] : sortedScores[0];
    const confidence = Math.min(1, 0.5 + margin * 0.5);

    return { stage: maxStage, confidence };
  }

  private calculateVelocity(
    signal: BuyingSignal,
    contextSignals: BuyingSignal[]
  ): StageVelocity {
    if (contextSignals.length === 0) {
      return 'normal';
    }

    // Get previous signal in same/adjacent stage
    const prevSignal = contextSignals[contextSignals.length - 1];
    const daysBetween = Math.ceil(
      (signal.timestamp.getTime() - prevSignal.timestamp.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Classify previous signal to check stage progression
    const prevClassification = this.classifySignal(prevSignal);
    const currentClassification = this.classifySignal(signal, contextSignals);

    const prevIndex = STAGE_PROGRESSION.indexOf(prevClassification.primaryStage);
    const currentIndex = STAGE_PROGRESSION.indexOf(currentClassification.primaryStage);

    // Stage progression indicates velocity
    if (currentIndex > prevIndex) {
      // Moved forward
      if (daysBetween <= this.config.velocityThresholds.fast) {
        return 'accelerating';
      } else if (daysBetween <= this.config.velocityThresholds.normal) {
        return 'fast';
      }
      return 'normal';
    } else if (currentIndex === prevIndex) {
      // Same stage
      if (daysBetween > this.config.velocityThresholds.slow) {
        return 'stalled';
      } else if (daysBetween > this.config.velocityThresholds.normal) {
        return 'slow';
      }
      return 'normal';
    }

    // Moved backward (churn path)
    return 'slow';
  }

  private predictNextStage(
    currentStage: BuyingStage,
    velocity: StageVelocity
  ): BuyingStage | null {
    // Customer stages have specific next stages
    if (currentStage === 'customer-churn-risk') {
      return null; // Terminal or requires intervention
    }
    if (currentStage === 'customer-retention') {
      return 'customer-expansion';
    }
    if (currentStage === 'customer-expansion') {
      return null; // Success state
    }

    // Stalled velocity might indicate churn risk
    if (velocity === 'stalled' && currentStage !== 'unaware') {
      return 'customer-churn-risk';
    }

    // Normal progression
    return this.getNextStage(currentStage);
  }

  private calculateConversionProbability(
    stage: BuyingStage,
    confidence: number,
    velocity: StageVelocity,
    indicators: DetectedIndicator[]
  ): number {
    let probability = this.config.conversionBaseRates[stage];

    // Adjust for confidence
    probability *= (0.5 + confidence * 0.5);

    // Adjust for velocity
    const velocityMultipliers: Record<StageVelocity, number> = {
      'accelerating': 1.4,
      'fast': 1.2,
      'normal': 1.0,
      'slow': 0.7,
      'stalled': 0.4
    };
    probability *= velocityMultipliers[velocity];

    // Adjust for indicator strength
    const avgWeight = indicators.length > 0
      ? indicators.reduce((sum, i) => sum + i.weight, 0) / indicators.length
      : 0.5;
    probability *= (0.7 + avgWeight * 0.3);

    return Math.min(0.95, Math.max(0.01, probability));
  }

  private determineEngagementPriority(
    stage: BuyingStage,
    confidence: number,
    velocity: StageVelocity,
    conversionProbability: number
  ): 'low' | 'medium' | 'high' | 'urgent' {
    // Decision stage is always high priority
    if (stage === 'decision') {
      return velocity === 'accelerating' || velocity === 'fast' ? 'urgent' : 'high';
    }

    // Churn risk is urgent
    if (stage === 'customer-churn-risk') {
      return confidence >= 0.7 ? 'urgent' : 'high';
    }

    // High conversion probability
    if (conversionProbability >= 0.6) {
      return 'urgent';
    }
    if (conversionProbability >= 0.4) {
      return 'high';
    }

    // Velocity-based priority
    if (velocity === 'accelerating') {
      return 'high';
    }
    if (velocity === 'fast') {
      return 'medium';
    }
    if (velocity === 'stalled') {
      return stage === 'vendor-aware' ? 'high' : 'medium';
    }

    // Default based on stage
    if (['vendor-aware', 'customer-expansion'].includes(stage)) {
      return 'medium';
    }

    return 'low';
  }

  private buildJourneyMap(
    signals: BuyingSignal[],
    classifications: StageClassification[]
  ): JourneyMapEntry[] {
    const stageMap = new Map<BuyingStage, {
      signals: BuyingSignal[];
      classifications: StageClassification[];
    }>();

    for (let i = 0; i < signals.length; i++) {
      const stage = classifications[i].primaryStage;
      if (!stageMap.has(stage)) {
        stageMap.set(stage, { signals: [], classifications: [] });
      }
      stageMap.get(stage)!.signals.push(signals[i]);
      stageMap.get(stage)!.classifications.push(classifications[i]);
    }

    const journeyMap: JourneyMapEntry[] = [];
    for (const [stage, data] of stageMap.entries()) {
      const timestamps = data.signals.map(s => s.timestamp.getTime());
      const firstSeen = new Date(Math.min(...timestamps));
      const lastSeen = new Date(Math.max(...timestamps));
      const daysInStage = Math.ceil((lastSeen.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24));

      journeyMap.push({
        stage,
        signalCount: data.signals.length,
        averageConfidence: data.classifications.reduce((s, c) => s + c.confidence, 0) / data.classifications.length,
        firstSeen,
        lastSeen,
        daysInStage
      });
    }

    return journeyMap.sort((a, b) => a.firstSeen.getTime() - b.firstSeen.getTime());
  }

  private buildStageHistory(
    signals: BuyingSignal[],
    classifications: StageClassification[]
  ): StageHistoryEntry[] {
    const history: StageHistoryEntry[] = [];
    let currentStage: BuyingStage | null = null;
    let stageStart: Date | null = null;

    for (let i = 0; i < signals.length; i++) {
      const stage = classifications[i].primaryStage;
      const timestamp = signals[i].timestamp;

      if (stage !== currentStage) {
        // Close previous stage
        if (currentStage && stageStart) {
          const daysInStage = Math.ceil(
            (timestamp.getTime() - stageStart.getTime()) / (1000 * 60 * 60 * 24)
          );
          history.push({
            stage: currentStage,
            enteredAt: stageStart,
            exitedAt: timestamp,
            daysInStage,
            velocity: this.daysToVelocity(daysInStage)
          });
        }

        // Start new stage
        currentStage = stage;
        stageStart = timestamp;
      }
    }

    // Close final stage (ongoing)
    if (currentStage && stageStart) {
      const daysInStage = Math.ceil(
        (Date.now() - stageStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      history.push({
        stage: currentStage,
        enteredAt: stageStart,
        daysInStage,
        velocity: this.daysToVelocity(daysInStage)
      });
    }

    return history;
  }

  private daysToVelocity(days: number): StageVelocity {
    if (days <= this.config.velocityThresholds.fast) return 'fast';
    if (days <= this.config.velocityThresholds.normal) return 'normal';
    if (days <= this.config.velocityThresholds.slow) return 'slow';
    return 'stalled';
  }

  private calculateAverageVelocity(history: StageHistoryEntry[]): StageVelocity {
    if (history.length === 0) return 'normal';

    const velocityOrder = ['stalled', 'slow', 'normal', 'fast', 'accelerating'];
    const avgIndex = history.reduce((sum, h) => sum + velocityOrder.indexOf(h.velocity), 0) / history.length;
    const roundedIndex = Math.round(avgIndex);

    return velocityOrder[roundedIndex] as StageVelocity;
  }

  private calculateOverallConversionLikelihood(
    classifications: StageClassification[],
    history: StageHistoryEntry[],
    currentStage: BuyingStage
  ): number {
    if (classifications.length === 0) return 0;

    // Get most recent classification
    const recent = classifications[classifications.length - 1];

    // Base on current stage conversion probability
    let likelihood = recent.conversionProbability;

    // Boost for positive velocity trend
    const velocityTrend = this.calculateVelocityTrend(history);
    if (velocityTrend === 'accelerating') {
      likelihood *= 1.3;
    } else if (velocityTrend === 'slowing') {
      likelihood *= 0.7;
    }

    // Boost for advanced stages
    const stageIndex = STAGE_PROGRESSION.indexOf(currentStage);
    if (stageIndex >= 3) { // vendor-aware or later
      likelihood *= 1.2;
    }

    return Math.min(0.95, likelihood);
  }

  private calculateVelocityTrend(
    history: StageHistoryEntry[]
  ): 'accelerating' | 'stable' | 'slowing' {
    if (history.length < 2) return 'stable';

    const velocityOrder = ['stalled', 'slow', 'normal', 'fast', 'accelerating'];
    const recentVelocities = history.slice(-3).map(h => velocityOrder.indexOf(h.velocity));

    if (recentVelocities.length < 2) return 'stable';

    const trend = recentVelocities[recentVelocities.length - 1] - recentVelocities[0];

    if (trend >= 1) return 'accelerating';
    if (trend <= -1) return 'slowing';
    return 'stable';
  }

  private identifyInsights(
    journeyMap: JourneyMapEntry[],
    history: StageHistoryEntry[],
    classifications: StageClassification[]
  ): { bottlenecks: string[]; opportunities: string[] } {
    const bottlenecks: string[] = [];
    const opportunities: string[] = [];

    // Check for stalled stages
    for (const entry of journeyMap) {
      if (entry.daysInStage > this.config.velocityThresholds.slow) {
        bottlenecks.push(`Stalled at ${entry.stage} stage for ${entry.daysInStage} days`);
      }
    }

    // Check for skipped stages
    const stagesVisited = new Set(journeyMap.map(j => j.stage));
    for (let i = 0; i < STAGE_PROGRESSION.length - 1; i++) {
      const stage = STAGE_PROGRESSION[i];
      const nextStage = STAGE_PROGRESSION[i + 1];
      if (!stagesVisited.has(stage) && stagesVisited.has(nextStage)) {
        opportunities.push(`Buyer skipped ${stage} stage - may need education`);
      }
    }

    // Check for high-confidence advanced stages
    const advancedClassifications = classifications.filter(c =>
      ['vendor-aware', 'decision'].includes(c.primaryStage) && c.confidence >= 0.8
    );
    if (advancedClassifications.length > 0) {
      opportunities.push('High-confidence buying signals detected - prioritize engagement');
    }

    // Check for velocity acceleration
    const velocityTrend = this.calculateVelocityTrend(history);
    if (velocityTrend === 'accelerating') {
      opportunities.push('Buyer velocity accelerating - strike while hot');
    } else if (velocityTrend === 'slowing') {
      bottlenecks.push('Buyer velocity slowing - may need intervention');
    }

    // Check for churn signals
    const churnSignals = classifications.filter(c => c.primaryStage === 'customer-churn-risk');
    if (churnSignals.length > 0) {
      bottlenecks.push(`${churnSignals.length} churn risk signals detected - immediate attention required`);
    }

    return { bottlenecks, opportunities };
  }

  private emptyJourneyAnalysis(): JourneyAnalysis {
    return {
      signals: [],
      classifications: [],
      journeyMap: [],
      currentStage: 'unaware',
      stageHistory: [],
      averageVelocity: 'normal',
      daysInJourney: 0,
      conversionLikelihood: 0,
      bottlenecks: [],
      opportunities: []
    };
  }
}

// Export singleton
export const buyingStageClassifierService = new BuyingStageClassifierService();
export { BuyingStageClassifierService };
