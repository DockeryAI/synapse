/**
 * Industry Profiles Data
 * Contains emotional trigger weights, vocabulary, compliance rules, and examples
 * for 12+ industries
 */

export interface EmotionalTriggerWeights {
  fear: number;
  trust: number;
  security: number;
  efficiency: number;
  growth: number;
  innovation: number;
  hope: number;
  urgency: number;
  exclusivity: number;
  community: number;
}

export interface ComplianceRule {
  id: string;
  description: string;
  severity: 'warning' | 'error';
  bannedTerms?: string[];
  requiredDisclosures?: string[];
  maxClaims?: number;
}

export interface IndustryVocabulary {
  preferredTerms: string[];
  avoidTerms: string[];
  powerWords: string[];
  technicalTerms: string[];
  callToActionPhrases: string[];
}

export interface IndustryExample {
  type: string;
  template: string;
  variables: string[];
  expectedCtr: number;
}

export interface IndustryProfile {
  id: string;
  name: string;
  naicsPrefix: string;
  description: string;
  emotionalTriggers: EmotionalTriggerWeights;
  vocabulary: IndustryVocabulary;
  complianceRules: ComplianceRule[];
  examples: IndustryExample[];
  contentGuidelines: string[];
  seasonalTriggers: string[];
}

export const industryProfiles: Record<string, IndustryProfile> = {
  insurance: {
    id: 'insurance',
    name: 'Insurance',
    naicsPrefix: '524',
    description: 'Insurance carriers and related activities',
    emotionalTriggers: {
      fear: 35,
      trust: 30,
      security: 35,
      efficiency: 0,
      growth: 0,
      innovation: 0,
      hope: 0,
      urgency: 0,
      exclusivity: 0,
      community: 0,
    },
    vocabulary: {
      preferredTerms: ['protection', 'coverage', 'peace of mind', 'safeguard', 'secure', 'comprehensive'],
      avoidTerms: ['cheap', 'discount', 'bargain', 'risky'],
      powerWords: ['protected', 'covered', 'guaranteed', 'trusted', 'reliable'],
      technicalTerms: ['premium', 'deductible', 'liability', 'underwriting', 'claims'],
      callToActionPhrases: ['Get your free quote', 'Protect what matters', 'Secure your future', 'Talk to an agent'],
    },
    complianceRules: [
      {
        id: 'ins-001',
        description: 'Cannot guarantee specific savings without disclosure',
        severity: 'error',
        bannedTerms: ['guaranteed savings'],
        requiredDisclosures: ['Actual savings may vary'],
      },
      {
        id: 'ins-002',
        description: 'Must include licensing information',
        severity: 'warning',
        requiredDisclosures: ['Licensed in [state]'],
      },
    ],
    examples: [
      {
        type: 'curiosity-gap',
        template: 'The {coverage_type} gap most {audience} don\'t know about until it\'s too late',
        variables: ['coverage_type', 'audience'],
        expectedCtr: 42,
      },
      {
        type: 'fear-appeal',
        template: '{percentage}% of {audience} are underinsured. Here\'s how to check yours.',
        variables: ['percentage', 'audience'],
        expectedCtr: 38,
      },
    ],
    contentGuidelines: [
      'Lead with protection, not price',
      'Use real scenarios to illustrate risk',
      'Emphasize peace of mind over features',
      'Include social proof from satisfied customers',
    ],
    seasonalTriggers: ['hurricane season', 'winter storms', 'tax season', 'open enrollment', 'new year planning'],
  },

  saas: {
    id: 'saas',
    name: 'SaaS / Software',
    naicsPrefix: '5112',
    description: 'Software publishers and cloud services',
    emotionalTriggers: {
      fear: 0,
      trust: 0,
      security: 0,
      efficiency: 40,
      growth: 35,
      innovation: 25,
      hope: 0,
      urgency: 0,
      exclusivity: 0,
      community: 0,
    },
    vocabulary: {
      preferredTerms: ['streamline', 'automate', 'scale', 'integrate', 'optimize', 'accelerate'],
      avoidTerms: ['complicated', 'manual', 'legacy', 'outdated'],
      powerWords: ['10x', 'automated', 'seamless', 'powerful', 'intelligent'],
      technicalTerms: ['API', 'integration', 'workflow', 'dashboard', 'analytics', 'ROI'],
      callToActionPhrases: ['Start free trial', 'See it in action', 'Book a demo', 'Get started free'],
    },
    complianceRules: [
      {
        id: 'saas-001',
        description: 'Performance claims must be verifiable',
        severity: 'warning',
        maxClaims: 3,
      },
      {
        id: 'saas-002',
        description: 'Must clarify free trial limitations',
        severity: 'error',
        requiredDisclosures: ['Trial period', 'Credit card requirement'],
      },
    ],
    examples: [
      {
        type: 'specific-number',
        template: 'How {company} saved {hours} hours/week by automating {process}',
        variables: ['company', 'hours', 'process'],
        expectedCtr: 45,
      },
      {
        type: 'comparison',
        template: '{old_way} vs {new_way}: Why {audience} are making the switch',
        variables: ['old_way', 'new_way', 'audience'],
        expectedCtr: 38,
      },
    ],
    contentGuidelines: [
      'Lead with time/money saved',
      'Show, don\'t tell - use demos',
      'Emphasize ease of implementation',
      'Include integration ecosystem',
    ],
    seasonalTriggers: ['Q1 budgeting', 'fiscal year end', 'back to work', 'summer slowdown', 'black friday deals'],
  },

  healthcare: {
    id: 'healthcare',
    name: 'Healthcare',
    naicsPrefix: '62',
    description: 'Healthcare and social assistance',
    emotionalTriggers: {
      fear: 15,
      trust: 25,
      security: 20,
      efficiency: 0,
      growth: 0,
      innovation: 0,
      hope: 30,
      urgency: 10,
      exclusivity: 0,
      community: 0,
    },
    vocabulary: {
      preferredTerms: ['wellness', 'care', 'health', 'treatment', 'recovery', 'prevention'],
      avoidTerms: ['cure', 'miracle', 'guaranteed results', 'disease-free'],
      powerWords: ['proven', 'evidence-based', 'personalized', 'comprehensive', 'compassionate'],
      technicalTerms: ['diagnosis', 'treatment plan', 'outcomes', 'patient care', 'preventive'],
      callToActionPhrases: ['Schedule your consultation', 'Take the first step', 'Learn about your options', 'Contact our care team'],
    },
    complianceRules: [
      {
        id: 'health-001',
        description: 'Cannot make specific cure claims',
        severity: 'error',
        bannedTerms: ['cure', 'miracle', '100% effective', 'guaranteed cure'],
      },
      {
        id: 'health-002',
        description: 'Must include medical disclaimer',
        severity: 'error',
        requiredDisclosures: ['Consult with a healthcare provider', 'Individual results may vary'],
      },
      {
        id: 'health-003',
        description: 'HIPAA compliance required',
        severity: 'error',
      },
    ],
    examples: [
      {
        type: 'transformation',
        template: 'From {before_state} to {after_state}: {patient_type}\'s journey to better health',
        variables: ['before_state', 'after_state', 'patient_type'],
        expectedCtr: 35,
      },
      {
        type: 'myth-buster',
        template: 'The {condition} myth that\'s keeping {audience} from getting help',
        variables: ['condition', 'audience'],
        expectedCtr: 40,
      },
    ],
    contentGuidelines: [
      'Prioritize empathy and understanding',
      'Use evidence-based messaging',
      'Maintain patient privacy always',
      'Focus on quality of life improvements',
    ],
    seasonalTriggers: ['flu season', 'allergy season', 'new year health goals', 'mental health awareness month', 'open enrollment'],
  },

  finance: {
    id: 'finance',
    name: 'Financial Services',
    naicsPrefix: '52',
    description: 'Finance and investment services',
    emotionalTriggers: {
      fear: 20,
      trust: 30,
      security: 25,
      efficiency: 0,
      growth: 15,
      innovation: 0,
      hope: 0,
      urgency: 10,
      exclusivity: 0,
      community: 0,
    },
    vocabulary: {
      preferredTerms: ['wealth', 'portfolio', 'investment', 'returns', 'diversification', 'planning'],
      avoidTerms: ['get rich quick', 'guaranteed returns', 'risk-free', 'double your money'],
      powerWords: ['secure', 'strategic', 'optimized', 'growth', 'protected'],
      technicalTerms: ['asset allocation', 'compound interest', 'diversification', 'liquidity', 'yield'],
      callToActionPhrases: ['Schedule a consultation', 'Get your free assessment', 'Plan your future', 'Speak with an advisor'],
    },
    complianceRules: [
      {
        id: 'fin-001',
        description: 'Cannot guarantee investment returns',
        severity: 'error',
        bannedTerms: ['guaranteed returns', 'risk-free investment', 'sure thing'],
        requiredDisclosures: ['Past performance does not guarantee future results'],
      },
      {
        id: 'fin-002',
        description: 'Must include regulatory disclosures',
        severity: 'error',
        requiredDisclosures: ['Securities offered through [firm]', 'FINRA/SIPC member'],
      },
    ],
    examples: [
      {
        type: 'data-revelation',
        template: '{percentage}% of {audience} aren\'t prepared for {event}. Are you?',
        variables: ['percentage', 'audience', 'event'],
        expectedCtr: 44,
      },
      {
        type: 'guide-snippet',
        template: 'The {age_group} guide to {financial_goal}: {number} steps to get started',
        variables: ['age_group', 'financial_goal', 'number'],
        expectedCtr: 36,
      },
    ],
    contentGuidelines: [
      'Build trust through transparency',
      'Use data to support claims',
      'Address fears without exploiting them',
      'Emphasize long-term thinking',
    ],
    seasonalTriggers: ['tax season', 'year-end planning', 'retirement month', 'back to school savings', 'market volatility'],
  },

  realestate: {
    id: 'realestate',
    name: 'Real Estate',
    naicsPrefix: '531',
    description: 'Real estate agents and property management',
    emotionalTriggers: {
      fear: 15,
      trust: 25,
      security: 20,
      efficiency: 0,
      growth: 10,
      innovation: 0,
      hope: 20,
      urgency: 10,
      exclusivity: 0,
      community: 0,
    },
    vocabulary: {
      preferredTerms: ['dream home', 'investment', 'location', 'value', 'opportunity', 'market'],
      avoidTerms: ['cheap', 'desperate seller', 'fixer-upper'],
      powerWords: ['exclusive', 'prime', 'stunning', 'move-in ready', 'rare opportunity'],
      technicalTerms: ['closing costs', 'pre-approval', 'appraisal', 'inspection', 'contingency'],
      callToActionPhrases: ['Schedule a showing', 'Get your home value', 'Find your dream home', 'Connect with an agent'],
    },
    complianceRules: [
      {
        id: 're-001',
        description: 'Fair Housing Act compliance',
        severity: 'error',
        bannedTerms: ['family neighborhood', 'young professionals area', 'exclusive community'],
      },
      {
        id: 're-002',
        description: 'Cannot guarantee property appreciation',
        severity: 'warning',
      },
    ],
    examples: [
      {
        type: 'trend-jacker',
        template: 'The {location} market just shifted. What {buyer_type} need to know now.',
        variables: ['location', 'buyer_type'],
        expectedCtr: 48,
      },
      {
        type: 'behind-the-scenes',
        template: 'What really happens during a {transaction_type}: An insider\'s view',
        variables: ['transaction_type'],
        expectedCtr: 33,
      },
    ],
    contentGuidelines: [
      'Lead with lifestyle, not just square footage',
      'Provide genuine market insights',
      'Showcase local expertise',
      'Use high-quality visuals',
    ],
    seasonalTriggers: ['spring market', 'back to school', 'interest rate changes', 'year-end closings', 'tax season'],
  },

  ecommerce: {
    id: 'ecommerce',
    name: 'E-commerce / Retail',
    naicsPrefix: '454',
    description: 'Electronic shopping and retail',
    emotionalTriggers: {
      fear: 5,
      trust: 15,
      security: 10,
      efficiency: 10,
      growth: 0,
      innovation: 0,
      hope: 0,
      urgency: 30,
      exclusivity: 20,
      community: 10,
    },
    vocabulary: {
      preferredTerms: ['exclusive', 'limited edition', 'bestseller', 'trending', 'must-have', 'deal'],
      avoidTerms: ['cheap', 'knockoff', 'imitation'],
      powerWords: ['flash sale', 'limited time', 'exclusive access', 'VIP', 'selling fast'],
      technicalTerms: ['free shipping', 'returns', 'warranty', 'in stock', 'pre-order'],
      callToActionPhrases: ['Shop now', 'Add to cart', 'Claim your deal', 'Get it before it\'s gone'],
    },
    complianceRules: [
      {
        id: 'ecom-001',
        description: 'Sale prices must be genuine',
        severity: 'error',
        requiredDisclosures: ['Original price', 'Sale end date'],
      },
      {
        id: 'ecom-002',
        description: 'Stock claims must be accurate',
        severity: 'warning',
      },
    ],
    examples: [
      {
        type: 'deadline-driver',
        template: '{hours} hours left: {discount}% off {product_category} ends tonight',
        variables: ['hours', 'discount', 'product_category'],
        expectedCtr: 52,
      },
      {
        type: 'challenge-post',
        template: 'The {number}-day {product_category} challenge: Transform your {outcome}',
        variables: ['number', 'product_category', 'outcome'],
        expectedCtr: 41,
      },
    ],
    contentGuidelines: [
      'Create urgency authentically',
      'Showcase real customer photos',
      'Highlight unique value proposition',
      'Make purchasing frictionless',
    ],
    seasonalTriggers: ['black friday', 'cyber monday', 'holiday season', 'back to school', 'summer sale', 'spring cleaning'],
  },

  legal: {
    id: 'legal',
    name: 'Legal Services',
    naicsPrefix: '5411',
    description: 'Legal services and law practices',
    emotionalTriggers: {
      fear: 25,
      trust: 35,
      security: 25,
      efficiency: 0,
      growth: 0,
      innovation: 0,
      hope: 15,
      urgency: 0,
      exclusivity: 0,
      community: 0,
    },
    vocabulary: {
      preferredTerms: ['rights', 'protection', 'advocate', 'justice', 'representation', 'counsel'],
      avoidTerms: ['win', 'guarantee outcome', 'sue'],
      powerWords: ['experienced', 'dedicated', 'aggressive representation', 'proven track record'],
      technicalTerms: ['litigation', 'settlement', 'statute of limitations', 'liability', 'damages'],
      callToActionPhrases: ['Free consultation', 'Protect your rights', 'Get legal help now', 'Speak with an attorney'],
    },
    complianceRules: [
      {
        id: 'legal-001',
        description: 'Cannot guarantee case outcomes',
        severity: 'error',
        bannedTerms: ['guaranteed win', 'we always win', 'certain outcome'],
        requiredDisclosures: ['Past results do not guarantee future outcomes'],
      },
      {
        id: 'legal-002',
        description: 'Must identify as attorney advertising',
        severity: 'error',
        requiredDisclosures: ['Attorney Advertising'],
      },
    ],
    examples: [
      {
        type: 'mistake-exposer',
        template: 'The {number} mistakes people make after {legal_event} (and how to avoid them)',
        variables: ['number', 'legal_event'],
        expectedCtr: 39,
      },
      {
        type: 'hidden-cost',
        template: 'The hidden costs of handling your {case_type} without legal help',
        variables: ['case_type'],
        expectedCtr: 43,
      },
    ],
    contentGuidelines: [
      'Build trust through expertise demonstration',
      'Avoid making promises about outcomes',
      'Educate about rights and options',
      'Show empathy for client situations',
    ],
    seasonalTriggers: ['tax filing deadline', 'new year estate planning', 'back to school custody', 'holiday accidents'],
  },

  education: {
    id: 'education',
    name: 'Education & Training',
    naicsPrefix: '61',
    description: 'Educational services and training',
    emotionalTriggers: {
      fear: 10,
      trust: 20,
      security: 0,
      efficiency: 15,
      growth: 25,
      innovation: 10,
      hope: 20,
      urgency: 0,
      exclusivity: 0,
      community: 0,
    },
    vocabulary: {
      preferredTerms: ['learn', 'grow', 'master', 'achieve', 'develop', 'transform'],
      avoidTerms: ['easy', 'instant mastery', 'no effort required'],
      powerWords: ['accelerated', 'proven', 'practical', 'hands-on', 'career-ready'],
      technicalTerms: ['curriculum', 'certification', 'credits', 'accreditation', 'outcomes'],
      callToActionPhrases: ['Enroll now', 'Start learning', 'Get certified', 'Transform your career'],
    },
    complianceRules: [
      {
        id: 'edu-001',
        description: 'Job placement claims must be documented',
        severity: 'error',
        requiredDisclosures: ['Placement rate methodology'],
      },
      {
        id: 'edu-002',
        description: 'Accreditation status must be clear',
        severity: 'warning',
      },
    ],
    examples: [
      {
        type: 'transformation',
        template: 'From {before_role} to {after_role}: How {student_type} made the transition in {timeframe}',
        variables: ['before_role', 'after_role', 'student_type', 'timeframe'],
        expectedCtr: 44,
      },
      {
        type: 'quick-win',
        template: '{number} {skill} tips you can apply today to {outcome}',
        variables: ['number', 'skill', 'outcome'],
        expectedCtr: 37,
      },
    ],
    contentGuidelines: [
      'Focus on outcomes and transformations',
      'Showcase student success stories',
      'Provide value before asking for enrollment',
      'Be clear about time and effort required',
    ],
    seasonalTriggers: ['back to school', 'new year goals', 'graduation season', 'career change season', 'summer learning'],
  },

  restaurant: {
    id: 'restaurant',
    name: 'Restaurant & Food Service',
    naicsPrefix: '722',
    description: 'Restaurants and food service',
    emotionalTriggers: {
      fear: 0,
      trust: 15,
      security: 0,
      efficiency: 5,
      growth: 0,
      innovation: 10,
      hope: 0,
      urgency: 20,
      exclusivity: 25,
      community: 25,
    },
    vocabulary: {
      preferredTerms: ['fresh', 'handcrafted', 'seasonal', 'local', 'authentic', 'experience'],
      avoidTerms: ['processed', 'frozen', 'cheap'],
      powerWords: ['mouthwatering', 'unforgettable', 'signature', 'chef-inspired', 'artisanal'],
      technicalTerms: ['reservation', 'tasting menu', 'pairing', 'locally sourced', 'made from scratch'],
      callToActionPhrases: ['Reserve your table', 'Order now', 'See our menu', 'Join the waitlist'],
    },
    complianceRules: [
      {
        id: 'rest-001',
        description: 'Allergen information must be available',
        severity: 'warning',
      },
      {
        id: 'rest-002',
        description: 'Health claims must be accurate',
        severity: 'error',
        bannedTerms: ['healthy', 'diet-friendly'],
      },
    ],
    examples: [
      {
        type: 'behind-the-scenes',
        template: 'How we make our {signature_dish}: A look inside our kitchen',
        variables: ['signature_dish'],
        expectedCtr: 38,
      },
      {
        type: 'seasonal',
        template: 'Our new {season} menu is here: {number} dishes you won\'t want to miss',
        variables: ['season', 'number'],
        expectedCtr: 42,
      },
    ],
    contentGuidelines: [
      'Use high-quality food photography',
      'Tell the story behind dishes',
      'Highlight local and seasonal ingredients',
      'Create FOMO with limited-time items',
    ],
    seasonalTriggers: ['valentines day', 'mothers day', 'holiday parties', 'summer patio season', 'restaurant week'],
  },

  fitness: {
    id: 'fitness',
    name: 'Fitness & Wellness',
    naicsPrefix: '7139',
    description: 'Fitness centers and wellness services',
    emotionalTriggers: {
      fear: 10,
      trust: 15,
      security: 0,
      efficiency: 15,
      growth: 25,
      innovation: 5,
      hope: 20,
      urgency: 10,
      exclusivity: 0,
      community: 0,
    },
    vocabulary: {
      preferredTerms: ['transform', 'achieve', 'strength', 'wellness', 'energy', 'results'],
      avoidTerms: ['easy', 'effortless', 'overnight results', 'miracle'],
      powerWords: ['powerful', 'proven', 'life-changing', 'breakthrough', 'sustainable'],
      technicalTerms: ['reps', 'sets', 'HIIT', 'recovery', 'macros', 'progressive overload'],
      callToActionPhrases: ['Start your journey', 'Get your free trial', 'Join the community', 'Transform your body'],
    },
    complianceRules: [
      {
        id: 'fit-001',
        description: 'Cannot make specific weight loss claims',
        severity: 'error',
        bannedTerms: ['lose X pounds guaranteed', 'shed fat instantly'],
        requiredDisclosures: ['Results may vary', 'Consult physician before starting'],
      },
    ],
    examples: [
      {
        type: 'challenge-post',
        template: 'Join our {number}-day {type} challenge: {outcome} guaranteed',
        variables: ['number', 'type', 'outcome'],
        expectedCtr: 46,
      },
      {
        type: 'transformation',
        template: '{name}\'s {timeframe} transformation: From {before} to {after}',
        variables: ['name', 'timeframe', 'before', 'after'],
        expectedCtr: 49,
      },
    ],
    contentGuidelines: [
      'Show real transformations with consent',
      'Focus on how people feel, not just look',
      'Provide actionable tips in content',
      'Build community around shared goals',
    ],
    seasonalTriggers: ['new year resolutions', 'summer body prep', 'back to school routines', 'holiday fitness', 'spring motivation'],
  },

  consulting: {
    id: 'consulting',
    name: 'Business Consulting',
    naicsPrefix: '5416',
    description: 'Management and business consulting',
    emotionalTriggers: {
      fear: 15,
      trust: 30,
      security: 10,
      efficiency: 20,
      growth: 20,
      innovation: 5,
      hope: 0,
      urgency: 0,
      exclusivity: 0,
      community: 0,
    },
    vocabulary: {
      preferredTerms: ['strategy', 'optimize', 'transform', 'scale', 'framework', 'roadmap'],
      avoidTerms: ['quick fix', 'magic bullet', 'overnight success'],
      powerWords: ['proven', 'strategic', 'data-driven', 'results-focused', 'expert'],
      technicalTerms: ['ROI', 'KPIs', 'stakeholders', 'implementation', 'methodology'],
      callToActionPhrases: ['Book a discovery call', 'Get your assessment', 'See how we can help', 'Schedule a consultation'],
    },
    complianceRules: [
      {
        id: 'cons-001',
        description: 'Results claims must be documented',
        severity: 'warning',
        maxClaims: 3,
      },
    ],
    examples: [
      {
        type: 'case-study',
        template: 'How {company_type} increased {metric} by {percentage}% in {timeframe}',
        variables: ['company_type', 'metric', 'percentage', 'timeframe'],
        expectedCtr: 41,
      },
      {
        type: 'contrarian',
        template: 'Why the {common_advice} advice is costing your business {outcome}',
        variables: ['common_advice', 'outcome'],
        expectedCtr: 44,
      },
    ],
    contentGuidelines: [
      'Lead with client results',
      'Show thought leadership through insights',
      'Provide frameworks and tools',
      'Build credibility before selling',
    ],
    seasonalTriggers: ['Q1 planning', 'fiscal year end', 'budget season', 'strategic planning season'],
  },

  manufacturing: {
    id: 'manufacturing',
    name: 'Manufacturing',
    naicsPrefix: '31-33',
    description: 'Manufacturing and production',
    emotionalTriggers: {
      fear: 10,
      trust: 30,
      security: 20,
      efficiency: 25,
      growth: 10,
      innovation: 5,
      hope: 0,
      urgency: 0,
      exclusivity: 0,
      community: 0,
    },
    vocabulary: {
      preferredTerms: ['precision', 'quality', 'efficiency', 'reliability', 'durability', 'performance'],
      avoidTerms: ['cheap', 'basic', 'simple'],
      powerWords: ['engineered', 'certified', 'tested', 'proven', 'industrial-grade'],
      technicalTerms: ['tolerances', 'specifications', 'compliance', 'ISO', 'lead time'],
      callToActionPhrases: ['Request a quote', 'See specifications', 'Talk to an engineer', 'Get samples'],
    },
    complianceRules: [
      {
        id: 'mfg-001',
        description: 'Specifications must be accurate',
        severity: 'error',
      },
      {
        id: 'mfg-002',
        description: 'Certifications must be current',
        severity: 'error',
        requiredDisclosures: ['Certification validity dates'],
      },
    ],
    examples: [
      {
        type: 'data-revelation',
        template: 'The {percentage}% efficiency gain that {company_type} companies are missing',
        variables: ['percentage', 'company_type'],
        expectedCtr: 37,
      },
      {
        type: 'comparison',
        template: '{material_a} vs {material_b}: Which delivers better {outcome} for {application}',
        variables: ['material_a', 'material_b', 'outcome', 'application'],
        expectedCtr: 35,
      },
    ],
    contentGuidelines: [
      'Lead with specifications and data',
      'Showcase quality control processes',
      'Highlight certifications and compliance',
      'Provide technical depth',
    ],
    seasonalTriggers: ['trade show season', 'budget planning', 'inventory planning', 'production ramp-up'],
  },
};

export const getIndustryProfile = (industryId: string): IndustryProfile | undefined => {
  return industryProfiles[industryId.toLowerCase()];
};

export const getIndustryByNaics = (naicsCode: string): IndustryProfile | undefined => {
  return Object.values(industryProfiles).find(
    profile => naicsCode.startsWith(profile.naicsPrefix)
  );
};

export const getAllIndustryIds = (): string[] => {
  return Object.keys(industryProfiles);
};

export const getIndustryCount = (): number => {
  return Object.keys(industryProfiles).length;
};
