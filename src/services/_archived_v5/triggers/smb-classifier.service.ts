/**
 * SMB Classifier Service
 *
 * Classifies signals for SMB-specific attributes:
 * - Company size estimation (solo, small team, growing, established)
 * - Decision-maker identification (owner vs. employee)
 * - Budget range estimation
 * - SMB segment classification
 *
 * Critical for SMB-first design principle in Triggers 3.0.
 * Different SMB segments have vastly different buying behaviors.
 *
 * Created: 2025-12-01
 * Phase: Triggers 3.0 - Phase 2 (SMB Signal Pipeline)
 */

import type { BusinessProfileType } from './_archived/profile-detection.service';

// ============================================================================
// TYPES
// ============================================================================

export type CompanySize = 'solo' | 'small-team' | 'growing' | 'established' | 'enterprise' | 'unknown';

export type DecisionMakerRole =
  | 'owner'
  | 'founder'
  | 'c-level'
  | 'director'
  | 'manager'
  | 'employee'
  | 'freelancer'
  | 'unknown';

export type BudgetRange =
  | 'free'
  | 'micro' // $0-50/mo
  | 'small' // $50-200/mo
  | 'medium' // $200-500/mo
  | 'growth' // $500-2000/mo
  | 'enterprise' // $2000+/mo
  | 'unknown';

export type SMBSegment =
  | 'solopreneur'
  | 'micro-business' // 1-5 employees
  | 'small-business' // 6-20 employees
  | 'medium-business' // 21-100 employees
  | 'mid-market' // 101-500 employees
  | 'unknown';

export interface CompanySizeIndicators {
  /** Detected company size */
  size: CompanySize;
  /** Confidence in detection (0-1) */
  confidence: number;
  /** Signals that led to this classification */
  signals: string[];
  /** Estimated employee count range */
  employeeRange?: { min: number; max: number };
}

export interface DecisionMakerIndicators {
  /** Detected role */
  role: DecisionMakerRole;
  /** Confidence in detection (0-1) */
  confidence: number;
  /** Signals that led to this classification */
  signals: string[];
  /** Whether this person likely has budget authority */
  hasBudgetAuthority: boolean;
  /** Whether this person likely makes final decisions */
  isFinalDecisionMaker: boolean;
}

export interface BudgetIndicators {
  /** Detected budget range */
  range: BudgetRange;
  /** Confidence in detection (0-1) */
  confidence: number;
  /** Signals that led to this classification */
  signals: string[];
  /** Specific amount mentioned if any */
  mentionedAmount?: string;
  /** Budget constraints mentioned */
  constraints?: string[];
}

export interface SMBClassification {
  /** Overall SMB segment */
  segment: SMBSegment;
  /** Company size indicators */
  companySize: CompanySizeIndicators;
  /** Decision maker indicators */
  decisionMaker: DecisionMakerIndicators;
  /** Budget indicators */
  budget: BudgetIndicators;
  /** Overall classification confidence */
  overallConfidence: number;
  /** Recommended business profile match */
  recommendedProfile?: BusinessProfileType;
  /** Classification reasoning */
  reasoning: string;
}

export interface ClassificationInput {
  /** Primary text to classify */
  text: string;
  /** Additional context (e.g., subreddit, platform) */
  context?: string;
  /** Author info if available */
  authorInfo?: {
    username?: string;
    bio?: string;
    accountAge?: string;
    karma?: number;
  };
  /** Source platform */
  platform?: string;
}

// ============================================================================
// CLASSIFICATION PATTERNS
// ============================================================================

/**
 * Company size patterns
 */
const COMPANY_SIZE_PATTERNS: Array<{
  patterns: RegExp[];
  size: CompanySize;
  employeeRange: { min: number; max: number };
  weight: number;
}> = [
  {
    patterns: [
      /(?:just me|solo|solopreneur|one-man|one-person|myself|by myself)/i,
      /(?:I run|I'm running|running my) (?:own |a small )?(?:business|company|shop)/i,
      /(?:freelancer|freelancing|self-employed|independent)/i,
    ],
    size: 'solo',
    employeeRange: { min: 1, max: 1 },
    weight: 1.0,
  },
  {
    patterns: [
      /(?:small team|few employees|2-5|3-5|handful of|couple of) (?:employees|people|team members)/i,
      /(?:team of|staff of|we have) (?:2|3|4|5|two|three|four|five)/i,
      /(?:me and|myself and) (?:my partner|a few|one other|two others)/i,
      /(?:under|less than) (?:5|10|five|ten) (?:employees|people)/i,
    ],
    size: 'small-team',
    employeeRange: { min: 2, max: 10 },
    weight: 0.95,
  },
  {
    patterns: [
      /(?:growing|scaling|hiring|expanding|10-50|20-50|around 20|around 30)/i,
      /(?:team of|staff of|we have) (?:10|15|20|25|30|40|50|ten|twenty|thirty)/i,
      /(?:recently hired|just hired|bringing on|adding)/i,
      /(?:series a|raised|funding|growth stage)/i,
    ],
    size: 'growing',
    employeeRange: { min: 10, max: 50 },
    weight: 0.9,
  },
  {
    patterns: [
      /(?:established|50\+|100|100\+|hundred|over 50|more than 50) (?:employees|people|team)/i,
      /(?:team of|staff of|we have) (?:50|60|70|80|90|100|over)/i,
      /(?:mid-size|midsize|medium-size|medium business)/i,
      /(?:multiple offices|multiple locations|nationwide)/i,
    ],
    size: 'established',
    employeeRange: { min: 50, max: 500 },
    weight: 0.85,
  },
  {
    patterns: [
      /(?:enterprise|large company|corporation|500\+|1000\+|thousands of employees)/i,
      /(?:fortune 500|public company|publicly traded|multinational)/i,
    ],
    size: 'enterprise',
    employeeRange: { min: 500, max: 100000 },
    weight: 0.8,
  },
];

/**
 * Decision maker patterns
 */
const DECISION_MAKER_PATTERNS: Array<{
  patterns: RegExp[];
  role: DecisionMakerRole;
  hasBudgetAuthority: boolean;
  isFinalDecisionMaker: boolean;
  weight: number;
}> = [
  {
    patterns: [
      /(?:I'm the owner|I own|my business|my company|I founded|I started)/i,
      /(?:as the owner|being the owner|owner here)/i,
      /(?:my shop|my store|my practice|my agency|my firm)/i,
    ],
    role: 'owner',
    hasBudgetAuthority: true,
    isFinalDecisionMaker: true,
    weight: 1.0,
  },
  {
    patterns: [
      /(?:I'm the founder|co-founder|I co-founded|I founded)/i,
      /(?:CEO|chief executive|chief technology|CTO|COO|CFO)/i,
    ],
    role: 'founder',
    hasBudgetAuthority: true,
    isFinalDecisionMaker: true,
    weight: 1.0,
  },
  {
    patterns: [
      /(?:I'm the|I am a|as a) (?:CEO|CTO|COO|CFO|CMO|CIO|CISO)/i,
      /(?:c-suite|c-level|executive|chief)/i,
    ],
    role: 'c-level',
    hasBudgetAuthority: true,
    isFinalDecisionMaker: true,
    weight: 0.95,
  },
  {
    patterns: [
      /(?:I'm the|I am a|as a) (?:director|head of|VP|vice president)/i,
      /(?:department head|division head|lead)/i,
    ],
    role: 'director',
    hasBudgetAuthority: true,
    isFinalDecisionMaker: false,
    weight: 0.85,
  },
  {
    patterns: [
      /(?:I'm a|I am a|as a) (?:manager|team lead|supervisor)/i,
      /(?:I manage|I oversee|my team|reporting to)/i,
    ],
    role: 'manager',
    hasBudgetAuthority: false,
    isFinalDecisionMaker: false,
    weight: 0.75,
  },
  {
    patterns: [
      /(?:I work at|I work for|employee at|working at|my job)/i,
      /(?:my boss|my manager|my supervisor|I report to)/i,
    ],
    role: 'employee',
    hasBudgetAuthority: false,
    isFinalDecisionMaker: false,
    weight: 0.7,
  },
  {
    patterns: [
      /(?:freelancer|freelancing|contractor|consultant)/i,
      /(?:I freelance|independent contractor|self-employed)/i,
    ],
    role: 'freelancer',
    hasBudgetAuthority: true,
    isFinalDecisionMaker: true,
    weight: 0.9,
  },
];

/**
 * Budget patterns
 */
const BUDGET_PATTERNS: Array<{
  patterns: RegExp[];
  range: BudgetRange;
  amountRange: { min: number; max: number };
  weight: number;
}> = [
  {
    patterns: [
      /(?:free|no budget|zero budget|can't spend|don't have budget)/i,
      /(?:bootstrap|bootstrapped|broke|tight budget)/i,
    ],
    range: 'free',
    amountRange: { min: 0, max: 0 },
    weight: 1.0,
  },
  {
    patterns: [
      /(?:under \$50|less than \$50|\$20|\$30|\$40|around \$50)/i,
      /(?:cheap|affordable|budget-friendly|low-cost)/i,
      /(?:\$10-50|\$20-50|under fifty)/i,
    ],
    range: 'micro',
    amountRange: { min: 0, max: 50 },
    weight: 0.9,
  },
  {
    patterns: [
      /(?:\$50-100|\$100|\$150|\$200|around \$100|about \$100)/i,
      /(?:\$50-200|\$100-200|hundred|couple hundred)/i,
    ],
    range: 'small',
    amountRange: { min: 50, max: 200 },
    weight: 0.85,
  },
  {
    patterns: [
      /(?:\$200-500|\$300|\$400|\$500|few hundred|several hundred)/i,
      /(?:\$200-1000|\$500|five hundred)/i,
    ],
    range: 'medium',
    amountRange: { min: 200, max: 500 },
    weight: 0.8,
  },
  {
    patterns: [
      /(?:\$500-2000|\$1000|\$1k|\$1,000|thousand|around a grand)/i,
      /(?:\$500-1000|\$1000-2000|a few thousand)/i,
    ],
    range: 'growth',
    amountRange: { min: 500, max: 2000 },
    weight: 0.75,
  },
  {
    patterns: [
      /(?:\$2000\+|\$5000|\$10000|\$5k|\$10k|enterprise budget)/i,
      /(?:unlimited budget|money is no object|whatever it takes)/i,
    ],
    range: 'enterprise',
    amountRange: { min: 2000, max: 100000 },
    weight: 0.7,
  },
];

/**
 * SMB segment mapping
 */
const SIZE_TO_SEGMENT: Record<CompanySize, SMBSegment> = {
  'solo': 'solopreneur',
  'small-team': 'micro-business',
  'growing': 'small-business',
  'established': 'medium-business',
  'enterprise': 'mid-market',
  'unknown': 'unknown',
};

/**
 * Segment to profile mapping
 */
const SEGMENT_TO_PROFILE: Record<SMBSegment, BusinessProfileType[]> = {
  'solopreneur': ['local-service-b2c', 'local-service-b2b'],
  'micro-business': ['local-service-b2b', 'local-service-b2c', 'regional-b2b-agency'],
  'small-business': ['regional-b2b-agency', 'regional-retail-b2c', 'national-saas-b2b'],
  'medium-business': ['national-saas-b2b', 'regional-b2b-agency'],
  'mid-market': ['national-saas-b2b', 'global-saas-b2b'],
  'unknown': ['national-saas-b2b'],
};

// ============================================================================
// SERVICE
// ============================================================================

class SMBClassifierService {
  /**
   * Classify a text input for SMB attributes
   */
  classify(input: ClassificationInput): SMBClassification {
    const { text, context, authorInfo, platform } = input;

    // Combine all available text
    const fullText = [
      text,
      context,
      authorInfo?.bio,
    ].filter(Boolean).join(' ');

    // Classify each dimension
    const companySize = this.classifyCompanySize(fullText);
    const decisionMaker = this.classifyDecisionMaker(fullText, authorInfo);
    const budget = this.classifyBudget(fullText);

    // Determine segment
    const segment = SIZE_TO_SEGMENT[companySize.size];

    // Calculate overall confidence
    const overallConfidence = (
      companySize.confidence * 0.4 +
      decisionMaker.confidence * 0.35 +
      budget.confidence * 0.25
    );

    // Determine recommended profile
    const recommendedProfile = this.recommendProfile(segment, platform);

    // Generate reasoning
    const reasoning = this.generateReasoning(companySize, decisionMaker, budget, segment);

    return {
      segment,
      companySize,
      decisionMaker,
      budget,
      overallConfidence,
      recommendedProfile,
      reasoning,
    };
  }

  /**
   * Classify company size from text
   */
  classifyCompanySize(text: string): CompanySizeIndicators {
    let bestMatch: {
      size: CompanySize;
      confidence: number;
      signals: string[];
      employeeRange: { min: number; max: number };
    } = {
      size: 'unknown',
      confidence: 0,
      signals: [],
      employeeRange: { min: 0, max: 0 },
    };

    for (const { patterns, size, employeeRange, weight } of COMPANY_SIZE_PATTERNS) {
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          if (weight > bestMatch.confidence) {
            bestMatch = {
              size,
              confidence: weight,
              signals: [match[0]],
              employeeRange,
            };
          } else if (weight === bestMatch.confidence && size === bestMatch.size) {
            bestMatch.signals.push(match[0]);
          }
        }
      }
    }

    return bestMatch;
  }

  /**
   * Classify decision maker role from text
   */
  classifyDecisionMaker(
    text: string,
    authorInfo?: ClassificationInput['authorInfo']
  ): DecisionMakerIndicators {
    let bestMatch: DecisionMakerIndicators = {
      role: 'unknown',
      confidence: 0,
      signals: [],
      hasBudgetAuthority: false,
      isFinalDecisionMaker: false,
    };

    for (const { patterns, role, hasBudgetAuthority, isFinalDecisionMaker, weight } of DECISION_MAKER_PATTERNS) {
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          if (weight > bestMatch.confidence) {
            bestMatch = {
              role,
              confidence: weight,
              signals: [match[0]],
              hasBudgetAuthority,
              isFinalDecisionMaker,
            };
          } else if (weight === bestMatch.confidence && role === bestMatch.role) {
            bestMatch.signals.push(match[0]);
          }
        }
      }
    }

    // Boost confidence if author bio confirms role
    if (authorInfo?.bio) {
      const bioClassification = this.classifyDecisionMaker(authorInfo.bio);
      if (bioClassification.role === bestMatch.role && bioClassification.confidence > 0) {
        bestMatch.confidence = Math.min(1, bestMatch.confidence + 0.1);
        bestMatch.signals.push(`Bio: ${bioClassification.signals[0]}`);
      }
    }

    return bestMatch;
  }

  /**
   * Classify budget range from text
   */
  classifyBudget(text: string): BudgetIndicators {
    let bestMatch: BudgetIndicators = {
      range: 'unknown',
      confidence: 0,
      signals: [],
      constraints: [],
    };

    for (const { patterns, range, weight } of BUDGET_PATTERNS) {
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          if (weight > bestMatch.confidence) {
            bestMatch = {
              range,
              confidence: weight,
              signals: [match[0]],
              mentionedAmount: match[0],
            };
          }
        }
      }
    }

    // Check for budget constraints
    const constraintPatterns = [
      /(?:can't afford|out of budget|too expensive for us)/i,
      /(?:need to justify|hard to get approval|budget approval)/i,
      /(?:quarterly budget|annual budget|budget cycle)/i,
    ];

    for (const pattern of constraintPatterns) {
      const match = text.match(pattern);
      if (match) {
        if (!bestMatch.constraints) bestMatch.constraints = [];
        bestMatch.constraints.push(match[0]);
      }
    }

    return bestMatch;
  }

  /**
   * Recommend a business profile based on segment
   */
  recommendProfile(
    segment: SMBSegment,
    platform?: string
  ): BusinessProfileType | undefined {
    const profiles = SEGMENT_TO_PROFILE[segment];
    if (!profiles || profiles.length === 0) return undefined;

    // Platform-based hints
    if (platform) {
      const platformLower = platform.toLowerCase();
      if (platformLower.includes('g2') || platformLower.includes('capterra')) {
        return 'national-saas-b2b';
      }
      if (platformLower.includes('yelp') || platformLower.includes('google')) {
        return segment === 'solopreneur' || segment === 'micro-business'
          ? 'local-service-b2c'
          : 'regional-retail-b2c';
      }
    }

    return profiles[0];
  }

  /**
   * Generate reasoning for the classification
   */
  generateReasoning(
    companySize: CompanySizeIndicators,
    decisionMaker: DecisionMakerIndicators,
    budget: BudgetIndicators,
    segment: SMBSegment
  ): string {
    const parts: string[] = [];

    if (companySize.size !== 'unknown') {
      parts.push(`Company size: ${companySize.size} (${companySize.signals[0] || 'inferred'})`);
    }

    if (decisionMaker.role !== 'unknown') {
      parts.push(`Decision maker: ${decisionMaker.role}${decisionMaker.hasBudgetAuthority ? ' with budget authority' : ''}`);
    }

    if (budget.range !== 'unknown') {
      parts.push(`Budget: ${budget.range}${budget.mentionedAmount ? ` (mentioned: ${budget.mentionedAmount})` : ''}`);
    }

    parts.push(`Segment: ${segment}`);

    return parts.join('; ');
  }

  /**
   * Check if a signal is from an SMB
   */
  isSMB(classification: SMBClassification): boolean {
    return ['solopreneur', 'micro-business', 'small-business', 'medium-business'].includes(classification.segment);
  }

  /**
   * Check if signal has budget authority
   */
  hasBudgetAuthority(classification: SMBClassification): boolean {
    return classification.decisionMaker.hasBudgetAuthority;
  }

  /**
   * Get actionability score for an SMB signal
   * Higher score = more likely to convert
   */
  getActionabilityScore(classification: SMBClassification): number {
    let score = 0;

    // Budget authority is critical
    if (classification.decisionMaker.hasBudgetAuthority) {
      score += 0.3;
    }

    // Final decision maker even better
    if (classification.decisionMaker.isFinalDecisionMaker) {
      score += 0.2;
    }

    // Known budget is actionable
    if (classification.budget.range !== 'unknown' && classification.budget.range !== 'free') {
      score += 0.2;
    }

    // SMB segments are more actionable than enterprise
    const segmentScores: Record<SMBSegment, number> = {
      'solopreneur': 0.15,
      'micro-business': 0.2,
      'small-business': 0.25,
      'medium-business': 0.2,
      'mid-market': 0.15,
      'unknown': 0.05,
    };
    score += segmentScores[classification.segment];

    // Confidence multiplier
    score *= classification.overallConfidence;

    return Math.min(1, score);
  }

  /**
   * Batch classify multiple inputs
   */
  batchClassify(inputs: ClassificationInput[]): SMBClassification[] {
    return inputs.map(input => this.classify(input));
  }

  /**
   * Get employee count estimate
   */
  getEmployeeEstimate(classification: SMBClassification): { min: number; max: number; label: string } {
    const { companySize } = classification;

    if (companySize.employeeRange) {
      return {
        ...companySize.employeeRange,
        label: `${companySize.employeeRange.min}-${companySize.employeeRange.max} employees`,
      };
    }

    // Fallback by segment
    const segmentRanges: Record<SMBSegment, { min: number; max: number; label: string }> = {
      'solopreneur': { min: 1, max: 1, label: '1 employee' },
      'micro-business': { min: 2, max: 10, label: '2-10 employees' },
      'small-business': { min: 11, max: 50, label: '11-50 employees' },
      'medium-business': { min: 51, max: 200, label: '51-200 employees' },
      'mid-market': { min: 201, max: 1000, label: '201-1000 employees' },
      'unknown': { min: 1, max: 100, label: 'Unknown' },
    };

    return segmentRanges[classification.segment];
  }
}

// Export singleton
export const smbClassifierService = new SMBClassifierService();

// Export class for testing
export { SMBClassifierService };
