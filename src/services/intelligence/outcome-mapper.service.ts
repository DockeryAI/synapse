/**
 * Service-to-Outcome Mapper
 *
 * Transforms detected services/products into customer outcomes
 * using Jobs-to-be-Done (JTBD) and Value Proposition frameworks.
 *
 * Instead of listing what a business offers, we identify what
 * progress customers are trying to make.
 */

import type { ProductService } from '@/types/uvp-flow.types';

// ============================================================================
// Types
// ============================================================================

export interface OutcomeMapping {
  service: string;
  functionalJob: string;      // What task are they trying to complete?
  emotionalJob: string;        // How do they want to feel?
  socialJob: string;           // How do they want to be perceived?
  painPoint: string;           // What pain are they escaping?
  desiredOutcome: string;      // What transformation do they seek?
  valueStatement: string;      // The complete value prop
  confidence: number;
}

export interface IndustryOutcomePattern {
  industry: string;
  triggers: string[];
  commonPains: string[];
  commonOutcomes: string[];
  emotionalDrivers: string[];
  socialDrivers: string[];
}

// ============================================================================
// Industry-Specific Outcome Patterns
// ============================================================================

const INDUSTRY_PATTERNS: IndustryOutcomePattern[] = [
  {
    industry: 'tax',
    triggers: ['tax', 'irs', 'audit', 'filing', 'return', 'deduction', 'compliance'],
    commonPains: [
      'fear of IRS penalties',
      'confusion about tax laws',
      'stress from tax debt',
      'worry about audits',
      'missing deductions',
      'compliance anxiety'
    ],
    commonOutcomes: [
      'peace of mind about taxes',
      'confidence in compliance',
      'maximum legal deductions',
      'freedom from tax stress',
      'protection from penalties',
      'clear path to resolution'
    ],
    emotionalDrivers: [
      'relief', 'confidence', 'peace', 'security', 'control', 'clarity'
    ],
    socialDrivers: [
      'responsible citizen', 'financially savvy', 'compliant', 'protected', 'prepared'
    ]
  },
  {
    industry: 'legal',
    triggers: ['attorney', 'lawyer', 'legal', 'lawsuit', 'defense', 'representation', 'counsel'],
    commonPains: [
      'fear of losing case',
      'unfair treatment',
      'legal vulnerability',
      'complex legal system',
      'financial loss',
      'reputation damage'
    ],
    commonOutcomes: [
      'justice and fair treatment',
      'protection of rights',
      'favorable resolution',
      'peace of mind',
      'financial recovery',
      'reputation restoration'
    ],
    emotionalDrivers: [
      'vindication', 'safety', 'empowerment', 'relief', 'confidence', 'closure'
    ],
    socialDrivers: [
      'standing up for rights', 'being heard', 'getting justice', 'protecting family', 'maintaining dignity'
    ]
  },
  {
    industry: 'financial',
    triggers: ['investment', 'wealth', 'retirement', 'planning', 'advisor', 'portfolio', 'insurance'],
    commonPains: [
      'financial insecurity',
      'retirement anxiety',
      'investment confusion',
      'wealth erosion',
      'legacy concerns',
      'market volatility'
    ],
    commonOutcomes: [
      'financial security',
      'comfortable retirement',
      'wealth preservation',
      'legacy creation',
      'investment growth',
      'peace of mind'
    ],
    emotionalDrivers: [
      'security', 'confidence', 'pride', 'peace', 'accomplishment', 'control'
    ],
    socialDrivers: [
      'provider', 'successful', 'responsible', 'wise', 'prepared', 'generous'
    ]
  },
  {
    industry: 'healthcare',
    triggers: ['health', 'medical', 'doctor', 'treatment', 'therapy', 'care', 'wellness'],
    commonPains: [
      'health anxiety',
      'chronic pain',
      'quality of life issues',
      'treatment confusion',
      'healthcare costs',
      'lack of control'
    ],
    commonOutcomes: [
      'restored health',
      'pain relief',
      'improved quality of life',
      'clear treatment path',
      'affordable care',
      'health confidence'
    ],
    emotionalDrivers: [
      'hope', 'relief', 'confidence', 'vitality', 'control', 'optimism'
    ],
    socialDrivers: [
      'active', 'healthy', 'independent', 'capable', 'vibrant', 'present'
    ]
  },
  {
    industry: 'real-estate',
    triggers: ['property', 'real estate', 'home', 'house', 'mortgage', 'realtor', 'listing'],
    commonPains: [
      'overwhelming process',
      'financial risk',
      'market uncertainty',
      'finding right property',
      'negotiation stress',
      'paperwork complexity'
    ],
    commonOutcomes: [
      'dream home found',
      'profitable sale',
      'smooth transaction',
      'best value achieved',
      'stress-free process',
      'confident decisions'
    ],
    emotionalDrivers: [
      'excitement', 'security', 'pride', 'accomplishment', 'relief', 'satisfaction'
    ],
    socialDrivers: [
      'homeowner', 'investor', 'provider', 'successful', 'established', 'wise'
    ]
  }
];

// ============================================================================
// Service-Specific Transformations
// ============================================================================

const SERVICE_TRANSFORMATIONS: Record<string, Partial<OutcomeMapping>> = {
  // Tax Services
  'tax preparation': {
    functionalJob: 'File taxes accurately and on time',
    emotionalJob: 'Feel confident about tax compliance',
    socialJob: 'Be seen as financially responsible',
    painPoint: 'Anxiety about making tax mistakes',
    desiredOutcome: 'Peace of mind knowing taxes are done right',
    valueStatement: 'Never worry about tax mistakes or missed deductions again'
  },
  'irs resolution': {
    functionalJob: 'Resolve IRS debt and penalties',
    emotionalJob: 'Escape the stress of IRS problems',
    socialJob: 'Restore financial reputation',
    painPoint: 'Overwhelming IRS debt and fear of consequences',
    desiredOutcome: 'Freedom from IRS stress with manageable resolution',
    valueStatement: 'Get your life back from IRS stress with a clear path forward'
  },
  'audit defense': {
    functionalJob: 'Successfully navigate IRS audit',
    emotionalJob: 'Feel protected and supported',
    socialJob: 'Maintain integrity and compliance',
    painPoint: 'Fear and confusion about audit process',
    desiredOutcome: 'Confident audit resolution with minimal impact',
    valueStatement: 'Face audits with confidence knowing experts protect you'
  },

  // Legal Services
  'personal injury': {
    functionalJob: 'Get compensation for injuries',
    emotionalJob: 'Feel vindicated and supported',
    socialJob: 'Stand up for your rights',
    painPoint: 'Suffering without compensation',
    desiredOutcome: 'Fair compensation and justice',
    valueStatement: 'Turn your injury into the compensation you deserve'
  },
  'estate planning': {
    functionalJob: 'Protect assets and family future',
    emotionalJob: 'Peace of mind about legacy',
    socialJob: 'Be a responsible provider',
    painPoint: 'Worry about family\'s future',
    desiredOutcome: 'Secured legacy and protected family',
    valueStatement: 'Ensure your family is protected no matter what happens'
  },
  'business litigation': {
    functionalJob: 'Protect business interests',
    emotionalJob: 'Feel empowered and protected',
    socialJob: 'Maintain business reputation',
    painPoint: 'Business under legal threat',
    desiredOutcome: 'Business protected and disputes resolved',
    valueStatement: 'Protect what you\'ve built with aggressive legal defense'
  },

  // Financial Services
  'wealth management': {
    functionalJob: 'Grow and protect wealth',
    emotionalJob: 'Feel secure about future',
    socialJob: 'Be seen as financially successful',
    painPoint: 'Wealth not growing or at risk',
    desiredOutcome: 'Growing wealth with minimized risk',
    valueStatement: 'Build lasting wealth while you sleep'
  },
  'retirement planning': {
    functionalJob: 'Ensure comfortable retirement',
    emotionalJob: 'Feel confident about future',
    socialJob: 'Be prepared and responsible',
    painPoint: 'Retirement anxiety and uncertainty',
    desiredOutcome: 'Clear path to dream retirement',
    valueStatement: 'Retire with confidence knowing you have enough'
  }
};

// ============================================================================
// Core Mapping Functions
// ============================================================================

export class OutcomeMapperService {
  /**
   * Transform a service/product into customer outcomes
   */
  transformToOutcome(service: ProductService): OutcomeMapping {
    const serviceLower = service.name.toLowerCase();

    // Check for direct service match
    const directMatch = this.findDirectMatch(serviceLower);
    if (directMatch) {
      return {
        service: service.name,
        ...directMatch,
        confidence: 90
      } as OutcomeMapping;
    }

    // Find industry pattern
    const industryPattern = this.detectIndustryPattern(serviceLower);
    if (industryPattern) {
      return this.generateIndustryOutcome(service, industryPattern);
    }

    // Generic transformation
    return this.generateGenericOutcome(service);
  }

  /**
   * Find direct service match in transformation table
   */
  private findDirectMatch(serviceName: string): Partial<OutcomeMapping> | null {
    // Check exact matches
    for (const [key, mapping] of Object.entries(SERVICE_TRANSFORMATIONS)) {
      if (serviceName.includes(key)) {
        return mapping;
      }
    }

    // Check partial matches
    const words = serviceName.split(/\s+/);
    for (const [key, mapping] of Object.entries(SERVICE_TRANSFORMATIONS)) {
      const keyWords = key.split(/\s+/);
      const matchCount = keyWords.filter(kw =>
        words.some(w => w.includes(kw) || kw.includes(w))
      ).length;

      if (matchCount >= keyWords.length * 0.5) { // 50% match threshold
        return mapping;
      }
    }

    return null;
  }

  /**
   * Detect industry pattern from service name
   */
  private detectIndustryPattern(serviceName: string): IndustryOutcomePattern | null {
    for (const pattern of INDUSTRY_PATTERNS) {
      const hasMatch = pattern.triggers.some(trigger =>
        serviceName.includes(trigger)
      );

      if (hasMatch) {
        return pattern;
      }
    }
    return null;
  }

  /**
   * Generate outcome based on industry pattern
   */
  private generateIndustryOutcome(
    service: ProductService,
    pattern: IndustryOutcomePattern
  ): OutcomeMapping {
    // Select appropriate elements from pattern
    const pain = pattern.commonPains[0] || 'current challenges';
    const outcome = pattern.commonOutcomes[0] || 'desired improvement';
    const emotional = pattern.emotionalDrivers[0] || 'confidence';
    const social = pattern.socialDrivers[0] || 'success';

    return {
      service: service.name,
      functionalJob: `Solve ${pain} in ${pattern.industry}`,
      emotionalJob: `Feel ${emotional} about ${pattern.industry} matters`,
      socialJob: `Be seen as ${social}`,
      painPoint: pain,
      desiredOutcome: outcome,
      valueStatement: `Transform ${pain} into ${outcome}`,
      confidence: 75
    };
  }

  /**
   * Generate generic outcome for unmatched services
   */
  private generateGenericOutcome(service: ProductService): OutcomeMapping {
    return {
      service: service.name,
      functionalJob: `Get ${service.name} done efficiently`,
      emotionalJob: 'Feel confident and supported',
      socialJob: 'Be seen as making smart choices',
      painPoint: `Challenges with ${service.name}`,
      desiredOutcome: `Success with ${service.name}`,
      valueStatement: service.description || `Professional ${service.name} that delivers results`,
      confidence: 50
    };
  }

  /**
   * Enhance a product/service with JTBD outcomes
   */
  enhanceWithOutcomes(service: ProductService): ProductService & { outcomes: OutcomeMapping } {
    const outcomes = this.transformToOutcome(service);

    return {
      ...service,
      // Override description with value statement if better
      description: outcomes.confidence > 70 ? outcomes.valueStatement : service.description,
      outcomes
    };
  }

  /**
   * Batch transform services to outcomes
   */
  transformServices(services: ProductService[]): (ProductService & { outcomes: OutcomeMapping })[] {
    return services.map(service => this.enhanceWithOutcomes(service));
  }

  /**
   * Generate customer problem statement from services
   */
  generateCustomerProblem(services: ProductService[]): string {
    const outcomes = services.map(s => this.transformToOutcome(s));
    const topPains = outcomes
      .map(o => o.painPoint)
      .filter((p, i, arr) => arr.indexOf(p) === i) // unique
      .slice(0, 3);

    if (topPains.length === 0) {
      return 'Seeking professional solutions for their challenges';
    }

    if (topPains.length === 1) {
      return topPains[0];
    }

    return `${topPains.slice(0, -1).join(', ')} and ${topPains[topPains.length - 1]}`;
  }

  /**
   * Generate transformation goal from services
   */
  generateTransformationGoal(services: ProductService[]): string {
    const outcomes = services.map(s => this.transformToOutcome(s));
    const topOutcomes = outcomes
      .map(o => o.desiredOutcome)
      .filter((o, i, arr) => arr.indexOf(o) === i) // unique
      .slice(0, 3);

    if (topOutcomes.length === 0) {
      return 'Achieve their goals with expert support';
    }

    if (topOutcomes.length === 1) {
      return topOutcomes[0];
    }

    return `Achieve ${topOutcomes.slice(0, -1).join(', ')} and ${topOutcomes[topOutcomes.length - 1]}`;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const outcomeMapper = new OutcomeMapperService();