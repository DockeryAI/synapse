/**
 * Regional Signals Service
 *
 * Specialized signal processing for regional business profiles:
 * - Regional B2B Agency (Marketing, accounting, HR consultants)
 * - Regional Retail B2C (Multi-location retail, franchise)
 *
 * Phase 3: Profile-Specific Pipelines - Regional Profiles
 *
 * Key Features:
 * 1. Multi-location analysis and consistency patterns
 * 2. Contract cycle awareness (retainer renewals, RFP timing)
 * 3. Franchise-specific patterns and franchisor/franchisee dynamics
 * 4. Territory-based routing and analysis
 * 5. Cross-location pattern detection
 *
 * Created: 2025-12-01
 */

import type { BusinessProfileType } from './_archived/profile-detection.service';
import { recencyCalculatorService, type RecencyResult } from './recency-calculator.service';
import { competitorAttributionService, type CompetitorMention } from './competitor-attribution.service';
import { smbClassifierService, type CompanySize, type DecisionMakerRole } from './smb-classifier.service';
import { urgencyDetectorService, type UrgencyLevel } from './urgency-detector.service';

// ============================================================================
// TYPES
// ============================================================================

export type RegionalSignalType =
  | 'agency-churn'
  | 'rfp-announcement'
  | 'agency-recommendation'
  | 'contract-renewal'
  | 'competitor-loss'
  | 'franchise-expansion'
  | 'franchise-complaint'
  | 'multi-location-need'
  | 'territory-expansion'
  | 'compliance-deadline'
  | 'budget-cycle'
  | 'leadership-change';

export interface Territory {
  name: string;
  states: string[];
  metros?: string[];
  population?: number;
  businessDensity?: 'low' | 'medium' | 'high';
}

export interface RegionalSignal {
  id: string;
  type: RegionalSignalType;
  source: string;
  content: string;
  timestamp: Date;
  territory?: Territory;
  locations?: LocationMention[];
  author?: string;
  authorRole?: DecisionMakerRole;
  url?: string;
  metadata?: RegionalSignalMetadata;
}

export interface LocationMention {
  city: string;
  state: string;
  context: 'headquarters' | 'branch' | 'expansion-target' | 'service-area' | 'mentioned';
}

export interface RegionalSignalMetadata {
  contractValue?: string; // e.g., "$50K-100K"
  contractLength?: string; // e.g., "12 months"
  locationCount?: number;
  franchiseSystem?: string;
  complianceType?: string;
  deadlineDate?: Date;
  decisionTimeframe?: string;
  competitorMentioned?: string;
  industryVertical?: string;
}

export interface ContractCycle {
  name: string;
  peakMonths: number[];
  budgetPlanningMonths: number[];
  renewalAdvanceMonths: number; // How many months before renewal decisions start
  industryRelevance: string[];
}

export interface FranchisePattern {
  type: 'single-unit' | 'multi-unit' | 'area-developer' | 'master-franchise';
  signals: string[];
  painPoints: string[];
  decisionMaker: 'franchisee' | 'franchisor' | 'both';
}

export interface RegionalSignalResult {
  signal: RegionalSignal;
  score: number;
  recencyScore: number;
  territoryRelevance: number;
  contractCycleRelevance: number;
  urgencyLevel: UrgencyLevel;
  companySize?: CompanySize;
  decisionMakerRole?: DecisionMakerRole;
  competitorAttribution?: CompetitorMention;
  actionableInsight: string;
  recommendedApproach: string;
  estimatedValue: 'low' | 'medium' | 'high' | 'enterprise';
}

export interface TerritoryAnalysis {
  territory: Territory;
  totalSignals: number;
  signalsByType: Record<RegionalSignalType, number>;
  topAgencies?: string[];
  franchiseSystems?: string[];
  contractCycleActivity: ContractCycleActivity[];
  marketPenetration: number; // 0-1
  competitiveIntensity: 'low' | 'medium' | 'high';
  growthIndicators: string[];
}

export interface ContractCycleActivity {
  cycleName: string;
  currentPhase: 'planning' | 'evaluation' | 'decision' | 'off-cycle';
  nextKeyDate?: Date;
  signalVolume: number;
}

export interface RegionalProcessingConfig {
  profileType: 'regional-b2b-agency' | 'regional-retail-b2c';
  territories: Territory[];
  prioritySources: string[];
  contractCycleTracking: boolean;
  franchisePatternDetection: boolean;
  minimumContractValue?: number;
  competitorList?: string[];
  industryFocus?: string[];
}

// ============================================================================
// CONTRACT CYCLES
// ============================================================================

const CONTRACT_CYCLES: ContractCycle[] = [
  {
    name: 'Marketing Agency Annual',
    peakMonths: [10, 11, 12], // Q4 planning
    budgetPlanningMonths: [9, 10, 11],
    renewalAdvanceMonths: 2,
    industryRelevance: ['marketing', 'advertising', 'digital', 'creative', 'pr']
  },
  {
    name: 'Accounting Tax Season',
    peakMonths: [1, 2, 3, 4],
    budgetPlanningMonths: [10, 11, 12],
    renewalAdvanceMonths: 3,
    industryRelevance: ['accounting', 'tax', 'bookkeeping', 'cpa', 'audit']
  },
  {
    name: 'HR/Benefits Annual',
    peakMonths: [10, 11, 12], // Open enrollment prep
    budgetPlanningMonths: [8, 9, 10],
    renewalAdvanceMonths: 4,
    industryRelevance: ['hr', 'human resources', 'benefits', 'recruiting', 'staffing']
  },
  {
    name: 'Legal Retainer Annual',
    peakMonths: [1, 2], // Fiscal year start
    budgetPlanningMonths: [11, 12],
    renewalAdvanceMonths: 2,
    industryRelevance: ['legal', 'law firm', 'attorney', 'counsel']
  },
  {
    name: 'IT Services Annual',
    peakMonths: [9, 10, 11], // IT budget cycle
    budgetPlanningMonths: [7, 8, 9],
    renewalAdvanceMonths: 3,
    industryRelevance: ['it', 'managed services', 'msp', 'technology', 'cybersecurity']
  },
  {
    name: 'Retail Holiday Planning',
    peakMonths: [7, 8, 9], // Prep for Q4
    budgetPlanningMonths: [5, 6, 7],
    renewalAdvanceMonths: 2,
    industryRelevance: ['retail', 'franchise', 'restaurant', 'hospitality']
  },
  {
    name: 'Fiscal Year End (Calendar)',
    peakMonths: [12, 1],
    budgetPlanningMonths: [10, 11, 12],
    renewalAdvanceMonths: 2,
    industryRelevance: ['all'] // Applies to most businesses
  },
  {
    name: 'Fiscal Year End (June)',
    peakMonths: [6, 7],
    budgetPlanningMonths: [4, 5, 6],
    renewalAdvanceMonths: 2,
    industryRelevance: ['government', 'education', 'nonprofit']
  }
];

// ============================================================================
// FRANCHISE PATTERNS
// ============================================================================

const FRANCHISE_PATTERNS: FranchisePattern[] = [
  {
    type: 'single-unit',
    signals: ['first location', 'single store', 'owner-operator', 'franchisee'],
    painPoints: ['overhead', 'support', 'marketing', 'training', 'royalties'],
    decisionMaker: 'franchisee'
  },
  {
    type: 'multi-unit',
    signals: ['multiple locations', 'expanding', 'area', 'regional', '3+ locations'],
    painPoints: ['consistency', 'management', 'scaling', 'systems', 'hiring'],
    decisionMaker: 'franchisee'
  },
  {
    type: 'area-developer',
    signals: ['territory', 'development rights', 'exclusive area', 'multi-state'],
    painPoints: ['growth targets', 'sub-franchising', 'territory protection', 'capital'],
    decisionMaker: 'both'
  },
  {
    type: 'master-franchise',
    signals: ['master franchise', 'international', 'national rights', 'brand development'],
    painPoints: ['brand control', 'quality standards', 'training systems', 'expansion'],
    decisionMaker: 'franchisor'
  }
];

// Standard US territories
const US_TERRITORIES: Territory[] = [
  { name: 'Northeast', states: ['ME', 'NH', 'VT', 'MA', 'RI', 'CT', 'NY', 'NJ', 'PA'], businessDensity: 'high' },
  { name: 'Southeast', states: ['DE', 'MD', 'DC', 'VA', 'WV', 'NC', 'SC', 'GA', 'FL'], businessDensity: 'high' },
  { name: 'Midwest', states: ['OH', 'MI', 'IN', 'IL', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'], businessDensity: 'medium' },
  { name: 'Southwest', states: ['TX', 'OK', 'AR', 'LA', 'NM', 'AZ'], businessDensity: 'medium' },
  { name: 'West', states: ['CO', 'WY', 'MT', 'ID', 'UT', 'NV'], businessDensity: 'low' },
  { name: 'Pacific', states: ['WA', 'OR', 'CA', 'AK', 'HI'], businessDensity: 'high' }
];

// Signal type detection patterns
const REGIONAL_SIGNAL_PATTERNS: Record<RegionalSignalType, RegExp[]> = {
  'agency-churn': [
    /(?:fired|dropped|let go|parted ways with)\s+(?:our|my|the)\s+(?:agency|firm|consultant)/i,
    /(?:leaving|left|ending|ended)\s+(?:our|my)\s+(?:relationship|partnership|retainer)/i,
    /(?:not\s+renewing|won't\s+renew|terminating)\s+(?:the\s+)?(?:contract|agreement|retainer)/i,
    /(?:agency|firm)\s+(?:relationship|partnership)\s+(?:didn't\s+work|failed|ended)/i
  ],
  'rfp-announcement': [
    /(?:rfp|request\s+for\s+proposal|bid\s+request|solicitation)/i,
    /(?:seeking|looking\s+for)\s+(?:proposals?|bids?|quotes?)/i,
    /(?:vendor|agency|partner)\s+(?:selection|search|evaluation)/i,
    /(?:open\s+for)\s+(?:bidding|proposals?|submissions?)/i
  ],
  'agency-recommendation': [
    /(?:recommend|suggest)\s+(?:a|an|any)\s+(?:good|great|reliable)?\s*(?:agency|firm|consultant)/i,
    /(?:looking\s+for|need|seeking)\s+(?:a|an)\s+(?:new\s+)?(?:marketing|accounting|hr|legal)\s+(?:agency|firm)/i,
    /(?:who\s+do\s+you\s+use|anyone\s+know)\s+(?:a|an)?\s*(?:good\s+)?(?:agency|firm)/i
  ],
  'contract-renewal': [
    /(?:contract|agreement|retainer)\s+(?:renewal|renewing|up\s+for\s+renewal)/i,
    /(?:annual|yearly)\s+(?:review|renewal|contract)/i,
    /(?:term|agreement)\s+(?:ending|expiring|up)/i,
    /(?:renegotiat|renew)\s+(?:our|the|my)\s+(?:contract|agreement)/i
  ],
  'competitor-loss': [
    /(?:lost|losing)\s+(?:to|against)\s+(?:competitor|rival|another)/i,
    /(?:switched|switching|moving)\s+to\s+(?:competitor|another|different)/i,
    /(?:competitor|rival)\s+(?:won|took|stole)\s+(?:the\s+)?(?:account|client|business)/i
  ],
  'franchise-expansion': [
    /(?:opening|launching|adding)\s+(?:new\s+)?(?:location|store|franchise)/i,
    /(?:expanding|expansion|growth)\s+(?:into|to|in)\s+(?:new\s+)?(?:market|territory|area)/i,
    /(?:franchise|franchising)\s+(?:opportunity|growth|expansion)/i,
    /(?:multi-unit|multiple\s+location)\s+(?:expansion|growth|development)/i
  ],
  'franchise-complaint': [
    /(?:franchise|franchisor)\s+(?:support|help|training)\s+(?:is|isn't|wasn't|sucks|terrible)/i,
    /(?:royalty|royalties|fees)\s+(?:too\s+high|expensive|killing)/i,
    /(?:corporate|franchisor)\s+(?:doesn't|won't|refused|failed)\s+(?:help|support|respond)/i,
    /(?:franchise|franchising)\s+(?:regret|mistake|nightmare|disappointment)/i
  ],
  'multi-location-need': [
    /(?:multiple|several|all)\s+(?:our\s+)?(?:locations?|stores?|branches?|offices?)/i,
    /(?:consistent|consistency)\s+(?:across|between)\s+(?:all\s+)?(?:locations?|stores?)/i,
    /(?:standardize|standardizing|centralize)\s+(?:across|for)\s+(?:all\s+)?(?:locations?)/i,
    /(?:location|store)-(?:specific|level)\s+(?:needs?|requirements?|challenges?)/i
  ],
  'territory-expansion': [
    /(?:expand|expanding|growth)\s+(?:into|to)\s+(?:new\s+)?(?:territory|region|market|state)/i,
    /(?:enter|entering)\s+(?:the\s+)?(?:northeast|southeast|midwest|southwest|west|pacific)/i,
    /(?:multi-state|regional|national)\s+(?:expansion|growth|coverage)/i
  ],
  'compliance-deadline': [
    /(?:compliance|regulatory)\s+(?:deadline|requirement|audit)/i,
    /(?:audit|inspection)\s+(?:coming|scheduled|approaching)/i,
    /(?:must|need\s+to|have\s+to)\s+(?:comply|be\s+compliant)\s+by/i,
    /(?:deadline|due\s+date)\s+(?:for|to)\s+(?:compliance|filing|submission)/i
  ],
  'budget-cycle': [
    /(?:budget|budgeting)\s+(?:season|cycle|planning|process)/i,
    /(?:fiscal\s+year|fy)\s+(?:planning|budget|allocation)/i,
    /(?:q4|end\s+of\s+year)\s+(?:budget|spending|planning)/i,
    /(?:new\s+year|next\s+year)\s+(?:budget|planning|priorities)/i
  ],
  'leadership-change': [
    /(?:new|incoming|just\s+hired)\s+(?:cmo|cfo|ceo|vp|director|head\s+of)/i,
    /(?:leadership|management|executive)\s+(?:change|transition|turnover)/i,
    /(?:hired|appointed|promoted)\s+(?:as|to)\s+(?:cmo|cfo|vp|director|head)/i
  ]
};

// Default configurations
const DEFAULT_CONFIGS: Record<'regional-b2b-agency' | 'regional-retail-b2c', RegionalProcessingConfig> = {
  'regional-b2b-agency': {
    profileType: 'regional-b2b-agency',
    territories: US_TERRITORIES,
    prioritySources: ['linkedin', 'clutch', 'g2', 'rfp-platform', 'reddit'],
    contractCycleTracking: true,
    franchisePatternDetection: false,
    minimumContractValue: 10000
  },
  'regional-retail-b2c': {
    profileType: 'regional-retail-b2c',
    territories: US_TERRITORIES,
    prioritySources: ['google-reviews', 'facebook', 'franchise-forum', 'reddit'],
    contractCycleTracking: true,
    franchisePatternDetection: true,
    minimumContractValue: 5000
  }
};

// ============================================================================
// SERVICE
// ============================================================================

class RegionalSignalsService {
  private activeContractCycles: ContractCycleActivity[] = [];

  constructor() {
    this.updateContractCycles();
  }

  /**
   * Get default configuration for a regional profile type
   */
  getDefaultConfig(
    profileType: 'regional-b2b-agency' | 'regional-retail-b2c'
  ): RegionalProcessingConfig {
    return { ...DEFAULT_CONFIGS[profileType] };
  }

  /**
   * Process a raw signal for regional context
   */
  processSignal(
    content: string,
    source: string,
    timestamp: Date = new Date(),
    config?: Partial<RegionalProcessingConfig>
  ): RegionalSignalResult {
    const fullConfig = {
      ...DEFAULT_CONFIGS['regional-b2b-agency'],
      ...config
    };

    // Detect signal type
    const signalType = this.detectSignalType(content);

    // Extract location mentions
    const locations = this.extractLocationMentions(content);

    // Detect territory
    const territory = this.detectTerritory(locations);

    // Classify company size and decision maker
    const smbClassification = smbClassifierService.classifyFromContent({
      content,
      source,
      hasCompanyIndicators: /company|business|organization|firm|enterprise/i.test(content),
      hasBudgetIndicators: /budget|contract|retainer|price|cost/i.test(content)
    });

    // Build the signal object
    const signal: RegionalSignal = {
      id: `regional-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: signalType,
      source,
      content,
      timestamp,
      territory,
      locations,
      authorRole: smbClassification.decisionMaker.role,
      metadata: this.extractMetadata(content, signalType, fullConfig)
    };

    // Calculate scores
    const recencyResult = recencyCalculatorService.calculateRecency(timestamp, 'news-article');
    const territoryRelevance = territory ? 1.0 : 0.7;
    const contractCycleRelevance = this.getContractCycleRelevance(content, fullConfig.industryFocus);

    // Check for competitor mentions
    let competitorAttribution: CompetitorMention | undefined;
    if (fullConfig.competitorList?.length) {
      const mentions = competitorAttributionService.findMentionsInContent(
        content,
        fullConfig.competitorList
      );
      if (mentions.length > 0) {
        competitorAttribution = mentions[0];
      }
    }

    // Detect urgency
    const urgencyAnalysis = urgencyDetectorService.detectUrgency({
      content,
      source,
      timestamp,
      hasCompetitorMention: !!competitorAttribution,
      hasPricingDiscussion: /price|cost|budget|retainer|contract\s+value/i.test(content),
      hasNegativeSentiment: this.hasNegativeSentiment(content),
      authorRole: signal.authorRole
    });

    // Calculate composite score
    let score = recencyResult.score * territoryRelevance;

    // Boost for contract cycle relevance
    score *= (1 + contractCycleRelevance * 0.3);

    // Boost for high-value signals
    if (signalType === 'rfp-announcement' || signalType === 'agency-churn') {
      score *= 1.4;
    }

    // Boost for decision-maker signals
    if (['c-level', 'director', 'owner'].includes(signal.authorRole || '')) {
      score *= 1.25;
    }

    // Boost for competitor loss (competitive displacement opportunity)
    if (competitorAttribution && signalType === 'competitor-loss') {
      score *= 1.5;
    }

    // Estimate deal value
    const estimatedValue = this.estimateDealValue(signal, smbClassification.companySize.size);

    // Generate actionable insight
    const { insight, approach } = this.generateActionableInsight(signal, urgencyAnalysis.level, estimatedValue);

    return {
      signal,
      score: Math.min(1, score),
      recencyScore: recencyResult.score,
      territoryRelevance,
      contractCycleRelevance,
      urgencyLevel: urgencyAnalysis.level,
      companySize: smbClassification.companySize.size,
      decisionMakerRole: signal.authorRole,
      competitorAttribution,
      actionableInsight: insight,
      recommendedApproach: approach,
      estimatedValue
    };
  }

  /**
   * Process multiple signals and return sorted by score
   */
  processSignals(
    signals: Array<{
      content: string;
      source: string;
      timestamp?: Date;
    }>,
    config?: Partial<RegionalProcessingConfig>
  ): RegionalSignalResult[] {
    return signals
      .map(s => this.processSignal(s.content, s.source, s.timestamp, config))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Get active contract cycles
   */
  getActiveContractCycles(): ContractCycleActivity[] {
    return this.activeContractCycles;
  }

  /**
   * Detect franchise pattern in content
   */
  detectFranchisePattern(content: string): FranchisePattern | null {
    const contentLower = content.toLowerCase();

    for (const pattern of FRANCHISE_PATTERNS) {
      const signalMatches = pattern.signals.filter(s => contentLower.includes(s)).length;
      const painPointMatches = pattern.painPoints.filter(p => contentLower.includes(p)).length;

      if (signalMatches >= 1 || painPointMatches >= 2) {
        return pattern;
      }
    }

    return null;
  }

  /**
   * Analyze a territory based on signals
   */
  analyzeTerritory(
    signals: RegionalSignalResult[],
    territory: Territory
  ): TerritoryAnalysis {
    const signalsByType: Record<RegionalSignalType, number> = {
      'agency-churn': 0,
      'rfp-announcement': 0,
      'agency-recommendation': 0,
      'contract-renewal': 0,
      'competitor-loss': 0,
      'franchise-expansion': 0,
      'franchise-complaint': 0,
      'multi-location-need': 0,
      'territory-expansion': 0,
      'compliance-deadline': 0,
      'budget-cycle': 0,
      'leadership-change': 0
    };

    const agencyCounts: Record<string, number> = {};
    const franchiseSystems = new Set<string>();
    const growthIndicators: string[] = [];
    let competitiveSignals = 0;

    for (const result of signals) {
      signalsByType[result.signal.type]++;

      if (result.competitorAttribution) {
        agencyCounts[result.competitorAttribution.matchedCompetitor] =
          (agencyCounts[result.competitorAttribution.matchedCompetitor] || 0) + 1;
        competitiveSignals++;
      }

      if (result.signal.metadata?.franchiseSystem) {
        franchiseSystems.add(result.signal.metadata.franchiseSystem);
      }

      // Track growth indicators
      if (['franchise-expansion', 'territory-expansion', 'multi-location-need'].includes(result.signal.type)) {
        growthIndicators.push(result.signal.type);
      }
    }

    // Get top agencies
    const topAgencies = Object.entries(agencyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([agency]) => agency);

    // Calculate competitive intensity
    const competitiveRatio = competitiveSignals / Math.max(signals.length, 1);
    const competitiveIntensity: 'low' | 'medium' | 'high' =
      competitiveRatio >= 0.4 ? 'high' :
      competitiveRatio >= 0.2 ? 'medium' : 'low';

    // Calculate market penetration (simplified)
    const marketPenetration = Math.min(1, signals.length / 50);

    return {
      territory,
      totalSignals: signals.length,
      signalsByType,
      topAgencies,
      franchiseSystems: Array.from(franchiseSystems),
      contractCycleActivity: this.activeContractCycles,
      marketPenetration,
      competitiveIntensity,
      growthIndicators: [...new Set(growthIndicators)]
    };
  }

  /**
   * Filter signals by territory
   */
  filterByTerritory(
    signals: RegionalSignalResult[],
    territory: Territory
  ): RegionalSignalResult[] {
    return signals.filter(result => {
      if (!result.signal.locations?.length) return true;

      return result.signal.locations.some(loc =>
        territory.states.includes(loc.state.toUpperCase())
      );
    });
  }

  /**
   * Get all available territories
   */
  getAllTerritories(): Territory[] {
    return [...US_TERRITORIES];
  }

  /**
   * Get all contract cycles
   */
  getAllContractCycles(): ContractCycle[] {
    return [...CONTRACT_CYCLES];
  }

  /**
   * Get relevant industries for current contract cycle phase
   */
  getIndustriesInCyclePhase(phase: 'planning' | 'evaluation' | 'decision'): string[] {
    const currentMonth = new Date().getMonth() + 1;
    const industries: string[] = [];

    for (const cycle of CONTRACT_CYCLES) {
      let inPhase = false;

      switch (phase) {
        case 'planning':
          inPhase = cycle.budgetPlanningMonths.includes(currentMonth);
          break;
        case 'evaluation':
          // Evaluation happens between planning and peak
          const evalMonths = cycle.budgetPlanningMonths.map(m =>
            m + 1 > 12 ? m + 1 - 12 : m + 1
          );
          inPhase = evalMonths.includes(currentMonth);
          break;
        case 'decision':
          inPhase = cycle.peakMonths.includes(currentMonth);
          break;
      }

      if (inPhase && !cycle.industryRelevance.includes('all')) {
        industries.push(...cycle.industryRelevance);
      }
    }

    return [...new Set(industries)];
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private updateContractCycles(): void {
    const currentMonth = new Date().getMonth() + 1;
    this.activeContractCycles = [];

    for (const cycle of CONTRACT_CYCLES) {
      let phase: 'planning' | 'evaluation' | 'decision' | 'off-cycle' = 'off-cycle';
      let nextKeyDate: Date | undefined;

      if (cycle.peakMonths.includes(currentMonth)) {
        phase = 'decision';
        // Next key date is end of peak
        const lastPeakMonth = Math.max(...cycle.peakMonths);
        nextKeyDate = new Date(new Date().getFullYear(), lastPeakMonth, 0);
      } else if (cycle.budgetPlanningMonths.includes(currentMonth)) {
        phase = 'planning';
        // Next key date is start of peak
        const firstPeakMonth = Math.min(...cycle.peakMonths);
        nextKeyDate = new Date(new Date().getFullYear(), firstPeakMonth - 1, 1);
      } else {
        // Check if we're in evaluation (between planning and decision)
        const planEnd = Math.max(...cycle.budgetPlanningMonths);
        const peakStart = Math.min(...cycle.peakMonths);
        if (currentMonth > planEnd && currentMonth < peakStart) {
          phase = 'evaluation';
          nextKeyDate = new Date(new Date().getFullYear(), peakStart - 1, 1);
        }
      }

      this.activeContractCycles.push({
        cycleName: cycle.name,
        currentPhase: phase,
        nextKeyDate,
        signalVolume: 0 // Will be updated when processing signals
      });
    }
  }

  private detectSignalType(content: string): RegionalSignalType {
    for (const [signalType, patterns] of Object.entries(REGIONAL_SIGNAL_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          return signalType as RegionalSignalType;
        }
      }
    }

    return 'agency-recommendation'; // Default
  }

  private extractLocationMentions(content: string): LocationMention[] {
    const locations: LocationMention[] = [];
    const stateAbbreviations = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
    ];

    // Match "City, ST" patterns
    const cityStatePattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z]{2})\b/g;
    let match;

    while ((match = cityStatePattern.exec(content)) !== null) {
      const [, city, state] = match;
      if (stateAbbreviations.includes(state)) {
        locations.push({
          city,
          state,
          context: this.determineLocationContext(content, match.index)
        });
      }
    }

    // Also check for state-only mentions
    for (const state of stateAbbreviations) {
      const statePattern = new RegExp(`\\b${state}\\b`, 'g');
      if (statePattern.test(content) && !locations.some(l => l.state === state)) {
        locations.push({
          city: 'Unknown',
          state,
          context: 'mentioned'
        });
      }
    }

    return locations;
  }

  private determineLocationContext(
    content: string,
    matchIndex: number
  ): LocationMention['context'] {
    // Get surrounding context
    const start = Math.max(0, matchIndex - 50);
    const end = Math.min(content.length, matchIndex + 50);
    const context = content.slice(start, end).toLowerCase();

    if (/headquarter|hq|based\s+in|home\s+office/i.test(context)) {
      return 'headquarters';
    }
    if (/branch|office|location/i.test(context)) {
      return 'branch';
    }
    if (/expand|opening|new\s+market/i.test(context)) {
      return 'expansion-target';
    }
    if (/serv(?:e|ing|ice)|coverage|territory/i.test(context)) {
      return 'service-area';
    }

    return 'mentioned';
  }

  private detectTerritory(locations: LocationMention[]): Territory | undefined {
    if (locations.length === 0) return undefined;

    // Count which territory has most mentions
    const territoryCounts: Record<string, number> = {};

    for (const location of locations) {
      for (const territory of US_TERRITORIES) {
        if (territory.states.includes(location.state)) {
          territoryCounts[territory.name] = (territoryCounts[territory.name] || 0) + 1;
        }
      }
    }

    // Return territory with most mentions
    const entries = Object.entries(territoryCounts);
    if (entries.length === 0) return undefined;

    entries.sort((a, b) => b[1] - a[1]);
    return US_TERRITORIES.find(t => t.name === entries[0][0]);
  }

  private extractMetadata(
    content: string,
    signalType: RegionalSignalType,
    config: RegionalProcessingConfig
  ): RegionalSignalMetadata {
    const metadata: RegionalSignalMetadata = {};

    // Extract contract value
    const valueMatch = content.match(/\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:k|K|thousand)?/);
    if (valueMatch) {
      let value = parseFloat(valueMatch[1].replace(/,/g, ''));
      if (valueMatch[0].toLowerCase().includes('k')) {
        value *= 1000;
      }
      if (value >= 1000) {
        metadata.contractValue = value >= 1000000
          ? `$${(value / 1000000).toFixed(1)}M`
          : `$${(value / 1000).toFixed(0)}K`;
      }
    }

    // Extract contract length
    const lengthMatch = content.match(/(\d+)\s*(?:month|year|yr)/i);
    if (lengthMatch) {
      const num = parseInt(lengthMatch[1], 10);
      const unit = lengthMatch[0].toLowerCase().includes('year') ? 'years' : 'months';
      metadata.contractLength = `${num} ${unit}`;
    }

    // Extract location count
    const locationMatch = content.match(/(\d+)\s*(?:location|store|franchise|office|branch)/i);
    if (locationMatch) {
      metadata.locationCount = parseInt(locationMatch[1], 10);
    }

    // Detect franchise system
    const franchiseSystems = [
      'McDonald\'s', 'Subway', 'Starbucks', 'Dunkin', 'Chick-fil-A',
      'Taco Bell', 'Pizza Hut', 'Domino\'s', 'KFC', 'Wendy\'s',
      'Marriott', 'Hilton', 'Holiday Inn', 'Hampton Inn',
      'Anytime Fitness', 'Planet Fitness', 'Orangetheory',
      'Great Clips', 'Sport Clips', 'Supercuts',
      'ServPro', 'ServiceMaster', 'Jan-Pro'
    ];
    for (const system of franchiseSystems) {
      if (content.toLowerCase().includes(system.toLowerCase())) {
        metadata.franchiseSystem = system;
        break;
      }
    }

    // Detect compliance type
    const complianceTypes = [
      'HIPAA', 'SOX', 'GDPR', 'PCI', 'SOC 2', 'ISO',
      'tax filing', 'audit', 'licensing', 'regulatory'
    ];
    for (const type of complianceTypes) {
      if (content.toLowerCase().includes(type.toLowerCase())) {
        metadata.complianceType = type;
        break;
      }
    }

    // Detect industry vertical
    if (config.industryFocus?.length) {
      for (const industry of config.industryFocus) {
        if (content.toLowerCase().includes(industry.toLowerCase())) {
          metadata.industryVertical = industry;
          break;
        }
      }
    }

    return metadata;
  }

  private getContractCycleRelevance(
    content: string,
    industryFocus?: string[]
  ): number {
    const currentMonth = new Date().getMonth() + 1;
    let maxRelevance = 0;

    for (const cycle of CONTRACT_CYCLES) {
      // Check if industry matches
      const industryMatch = cycle.industryRelevance.includes('all') ||
        (industryFocus?.some(ind =>
          cycle.industryRelevance.some(ci =>
            ci.toLowerCase().includes(ind.toLowerCase()) ||
            ind.toLowerCase().includes(ci.toLowerCase())
          )
        ));

      if (!industryMatch) continue;

      // Calculate relevance based on cycle phase
      if (cycle.peakMonths.includes(currentMonth)) {
        maxRelevance = Math.max(maxRelevance, 1.0);
      } else if (cycle.budgetPlanningMonths.includes(currentMonth)) {
        maxRelevance = Math.max(maxRelevance, 0.8);
      } else {
        // Check if we're close to peak
        const monthsToNearestPeak = cycle.peakMonths.reduce(
          (min, peak) => Math.min(min, Math.abs(peak - currentMonth)),
          12
        );
        if (monthsToNearestPeak <= cycle.renewalAdvanceMonths) {
          maxRelevance = Math.max(maxRelevance, 0.6);
        }
      }
    }

    return maxRelevance;
  }

  private hasNegativeSentiment(content: string): boolean {
    const negativePatterns = [
      /terrible|awful|worst|horrible|hate|angry|frustrated|disappointed/i,
      /fired|dropped|let go|terminated|ended|failed/i,
      /unprofessional|incompetent|unreliable|unresponsive/i,
      /waste|wasted|rip\s*off|scam|overpriced/i
    ];

    return negativePatterns.some(p => p.test(content));
  }

  private estimateDealValue(
    signal: RegionalSignal,
    companySize: CompanySize
  ): 'low' | 'medium' | 'high' | 'enterprise' {
    // Check explicit contract value
    if (signal.metadata?.contractValue) {
      const value = parseFloat(signal.metadata.contractValue.replace(/[$,KkMm]/g, ''));
      const multiplier = signal.metadata.contractValue.toLowerCase().includes('m') ? 1000000 :
                         signal.metadata.contractValue.toLowerCase().includes('k') ? 1000 : 1;
      const totalValue = value * multiplier;

      if (totalValue >= 500000) return 'enterprise';
      if (totalValue >= 100000) return 'high';
      if (totalValue >= 25000) return 'medium';
      return 'low';
    }

    // Estimate based on company size and signal type
    const sizeValueMap: Record<CompanySize, 'low' | 'medium' | 'high' | 'enterprise'> = {
      'solo': 'low',
      'small-team': 'low',
      'growing': 'medium',
      'established': 'high',
      'enterprise': 'enterprise'
    };

    let baseValue = sizeValueMap[companySize];

    // Upgrade value for high-value signal types
    if (['rfp-announcement', 'franchise-expansion', 'territory-expansion'].includes(signal.type)) {
      if (baseValue === 'low') baseValue = 'medium';
      else if (baseValue === 'medium') baseValue = 'high';
    }

    // Upgrade for multi-location
    if (signal.metadata?.locationCount && signal.metadata.locationCount >= 5) {
      if (baseValue === 'medium') baseValue = 'high';
      else if (baseValue === 'high') baseValue = 'enterprise';
    }

    return baseValue;
  }

  private generateActionableInsight(
    signal: RegionalSignal,
    urgency: UrgencyLevel,
    value: 'low' | 'medium' | 'high' | 'enterprise'
  ): { insight: string; approach: string } {
    const signalTypeInsights: Record<RegionalSignalType, { insight: string; approach: string }> = {
      'agency-churn': {
        insight: 'Agency relationship ending - active buyer in market',
        approach: 'Fast-track outreach with "we understand your concerns" positioning. Offer quick start options.'
      },
      'rfp-announcement': {
        insight: 'Formal vendor selection process initiated',
        approach: 'Prepare comprehensive proposal. Highlight differentiators and case studies. Request discovery call.'
      },
      'agency-recommendation': {
        insight: 'Active search for new agency/service provider',
        approach: 'Engage with helpful, non-salesy content. Offer resources. Position as trusted advisor.'
      },
      'contract-renewal': {
        insight: 'Contract renewal period - evaluation window open',
        approach: 'Competitive comparison positioning. ROI focus. Offer migration support.'
      },
      'competitor-loss': {
        insight: 'Competitor displacing current provider - competitive dynamics',
        approach: 'Gather intelligence on why switch happened. Position against new competitor\'s weaknesses.'
      },
      'franchise-expansion': {
        insight: 'Franchise growth - scalable vendor opportunity',
        approach: 'Multi-location packages. Consistency messaging. Growth partnership positioning.'
      },
      'franchise-complaint': {
        insight: 'Franchisee pain point - potential for independent vendor solutions',
        approach: 'Address specific pain points. Position as supplement to franchisor support. Flexible pricing.'
      },
      'multi-location-need': {
        insight: 'Multi-location standardization need - enterprise opportunity',
        approach: 'Centralized management messaging. Consistency guarantees. Volume pricing.'
      },
      'territory-expansion': {
        insight: 'Geographic expansion - new market entry support needed',
        approach: 'Regional expertise positioning. Local market knowledge. Expansion support services.'
      },
      'compliance-deadline': {
        insight: 'Compliance deadline creating urgency',
        approach: 'Expedited service positioning. Deadline-guaranteed delivery. Risk mitigation messaging.'
      },
      'budget-cycle': {
        insight: 'Budget planning phase - influence opportunity',
        approach: 'ROI calculators. Budget planning resources. Early engagement for budget allocation.'
      },
      'leadership-change': {
        insight: 'New leadership often reviews vendor relationships',
        approach: 'Fresh perspective positioning. New relationship opportunity. Quick wins focus.'
      }
    };

    const base = signalTypeInsights[signal.type];

    // Enhance based on urgency
    let enhancedInsight = base.insight;
    let enhancedApproach = base.approach;

    if (urgency === 'immediate') {
      enhancedInsight = `URGENT: ${enhancedInsight}`;
      enhancedApproach = `PRIORITY: ${enhancedApproach}`;
    }

    // Enhance based on value
    if (value === 'enterprise') {
      enhancedInsight += ' (Enterprise opportunity)';
      enhancedApproach += ' Consider executive-level engagement.';
    } else if (value === 'high') {
      enhancedInsight += ' (High-value opportunity)';
    }

    return { insight: enhancedInsight, approach: enhancedApproach };
  }
}

// Export singleton
export const regionalSignalsService = new RegionalSignalsService();
export { RegionalSignalsService };
