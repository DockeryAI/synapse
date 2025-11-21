/**
 * NAICS Database Service
 *
 * Contains psychological profiles for 147 industry categories
 * including triggers, power words, and customer language patterns.
 */

export interface IndustryProfile {
  naicsCode: string;
  industry: string;
  category: string;
  triggers: {
    fear: string[];
    desire: string[];
    urgency: string[];
    trust: string[];
    social: string[];
  };
  powerWords: string[];
  languagePatterns: {
    formal: string[];
    casual: string[];
    emotional: string[];
  };
  customerPersona: {
    primaryMotivation: string;
    decisionDrivers: string[];
    objections: string[];
    valueLanguage: string[];
  };
  contentAngles: string[];
}

class NAICSDatabaseService {
  private profiles: Map<string, IndustryProfile> = new Map();

  constructor() {
    this.initializeProfiles();
  }

  /**
   * Get profile for an industry
   */
  getProfile(industry: string): IndustryProfile | undefined {
    // Try exact match first
    const exactMatch = this.profiles.get(industry.toLowerCase());
    if (exactMatch) return exactMatch;

    // Try partial match
    for (const [key, profile] of this.profiles) {
      if (industry.toLowerCase().includes(key) || key.includes(industry.toLowerCase())) {
        return profile;
      }
    }

    // Return generic business profile
    return this.profiles.get('general business');
  }

  /**
   * Get all profiles
   */
  getAllProfiles(): IndustryProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Match industry to best NAICS profile
   */
  matchIndustry(industryText: string): IndustryProfile {
    const normalized = industryText.toLowerCase();

    // Insurance variations
    if (normalized.includes('insurance') || normalized.includes('coverage') || normalized.includes('policy')) {
      if (normalized.includes('property') || normalized.includes('casualty') || normalized.includes('home')) {
        return this.profiles.get('property insurance')!;
      }
      if (normalized.includes('life') || normalized.includes('health')) {
        return this.profiles.get('life insurance')!;
      }
      if (normalized.includes('auto') || normalized.includes('car') || normalized.includes('vehicle')) {
        return this.profiles.get('auto insurance')!;
      }
      return this.profiles.get('insurance')!;
    }

    // Real estate
    if (normalized.includes('real estate') || normalized.includes('property') || normalized.includes('realtor')) {
      return this.profiles.get('real estate')!;
    }

    // Legal
    if (normalized.includes('law') || normalized.includes('legal') || normalized.includes('attorney')) {
      return this.profiles.get('legal services')!;
    }

    // Healthcare
    if (normalized.includes('health') || normalized.includes('medical') || normalized.includes('doctor') || normalized.includes('dental')) {
      return this.profiles.get('healthcare')!;
    }

    // Finance
    if (normalized.includes('finance') || normalized.includes('bank') || normalized.includes('investment') || normalized.includes('accounting')) {
      return this.profiles.get('financial services')!;
    }

    // Technology
    if (normalized.includes('tech') || normalized.includes('software') || normalized.includes('it ') || normalized.includes('saas')) {
      return this.profiles.get('technology')!;
    }

    // Retail
    if (normalized.includes('retail') || normalized.includes('shop') || normalized.includes('store') || normalized.includes('ecommerce')) {
      return this.profiles.get('retail')!;
    }

    // Restaurant/Food
    if (normalized.includes('restaurant') || normalized.includes('food') || normalized.includes('cafe') || normalized.includes('catering')) {
      return this.profiles.get('food service')!;
    }

    // Construction
    if (normalized.includes('construct') || normalized.includes('building') || normalized.includes('contractor') || normalized.includes('roofing')) {
      return this.profiles.get('construction')!;
    }

    // Auto
    if (normalized.includes('auto') || normalized.includes('car') || normalized.includes('mechanic') || normalized.includes('dealer')) {
      return this.profiles.get('automotive')!;
    }

    // Fitness/Wellness
    if (normalized.includes('fitness') || normalized.includes('gym') || normalized.includes('wellness') || normalized.includes('spa')) {
      return this.profiles.get('fitness wellness')!;
    }

    // Marketing/Agency
    if (normalized.includes('marketing') || normalized.includes('agency') || normalized.includes('advertising') || normalized.includes('creative')) {
      return this.profiles.get('marketing agency')!;
    }

    // Education
    if (normalized.includes('education') || normalized.includes('school') || normalized.includes('training') || normalized.includes('tutor')) {
      return this.profiles.get('education')!;
    }

    // Professional services
    if (normalized.includes('consult') || normalized.includes('professional') || normalized.includes('service')) {
      return this.profiles.get('professional services')!;
    }

    return this.profiles.get('general business')!;
  }

  /**
   * Initialize all industry profiles
   */
  private initializeProfiles() {
    // Insurance profiles
    this.profiles.set('insurance', {
      naicsCode: '524210',
      industry: 'Insurance Agencies and Brokerages',
      category: 'Finance and Insurance',
      triggers: {
        fear: ['loss', 'unprotected', 'disaster', 'lawsuit', 'claim denied', 'underinsured', 'gaps in coverage'],
        desire: ['peace of mind', 'protection', 'security', 'confidence', 'covered', 'prepared'],
        urgency: ['before it\'s too late', 'storm season', 'deadline', 'rate increase', 'limited time'],
        trust: ['local agent', 'family owned', 'decades of experience', 'claims paid', 'A-rated'],
        social: ['families trust us', 'community partner', 'neighbors rely on', 'generations served']
      },
      powerWords: ['protect', 'secure', 'guarantee', 'coverage', 'peace of mind', 'claim', 'save', 'risk', 'value', 'trust'],
      languagePatterns: {
        formal: ['comprehensive coverage', 'policy provisions', 'underwriting', 'liability protection'],
        casual: ['covered', 'protected', 'taken care of', 'in good hands'],
        emotional: ['sleep better', 'worry-free', 'there when you need us', 'got your back']
      },
      customerPersona: {
        primaryMotivation: 'Protection from financial loss and peace of mind',
        decisionDrivers: ['Price', 'Coverage adequacy', 'Claims reputation', 'Agent relationship', 'Company stability'],
        objections: ['Too expensive', 'Don\'t need that much coverage', 'Bad claims experience', 'Don\'t trust insurance companies'],
        valueLanguage: ['actual cash value', 'replacement cost', 'deductible', 'premium', 'policy limit']
      },
      contentAngles: [
        'Coverage gaps most people don\'t know they have',
        'Claim horror stories and how to avoid them',
        'Seasonal risk preparation guides',
        'True cost of being underinsured',
        'Local risk factors unique to area'
      ]
    });

    this.profiles.set('property insurance', {
      naicsCode: '524126',
      industry: 'Direct Property and Casualty Insurance',
      category: 'Finance and Insurance',
      triggers: {
        fear: ['fire', 'flood', 'theft', 'storm damage', 'liability lawsuit', 'total loss', 'rebuilding cost'],
        desire: ['full replacement', 'rebuild exactly', 'quick claim', 'fair settlement', 'adequate coverage'],
        urgency: ['hurricane season', 'wildfire season', 'winter storms', 'rate lock', 'policy renewal'],
        trust: ['pay claims fast', 'local adjusters', 'no surprises', 'transparent process', 'fight for you'],
        social: ['homeowners trust', 'business owners rely', 'landlords choose', 'property managers prefer']
      },
      powerWords: ['replacement', 'rebuild', 'protect', 'covered', 'claim', 'settle', 'repair', 'restore', 'value', 'asset'],
      languagePatterns: {
        formal: ['dwelling coverage', 'personal property', 'loss of use', 'endorsement', 'scheduled item'],
        casual: ['stuff is covered', 'home protected', 'get you back on your feet'],
        emotional: ['rebuild your life', 'everything you\'ve worked for', 'memories protected']
      },
      customerPersona: {
        primaryMotivation: 'Protecting largest asset and personal belongings',
        decisionDrivers: ['Coverage limits', 'Deductible options', 'Claims process', 'Local presence', 'Bundle discounts'],
        objections: ['Coverage too expensive', 'Won\'t need it', 'Landlord covers it', 'Too complicated'],
        valueLanguage: ['dwelling limit', 'contents coverage', 'liability', 'umbrella', 'endorsement']
      },
      contentAngles: [
        'What your policy actually covers (and what it doesn\'t)',
        'Inventory your belongings before disaster strikes',
        'Understanding replacement cost vs actual cash value',
        'Local weather risks and coverage requirements',
        'Home business coverage gaps'
      ]
    });

    this.profiles.set('life insurance', {
      naicsCode: '524113',
      industry: 'Direct Life Insurance Carriers',
      category: 'Finance and Insurance',
      triggers: {
        fear: ['leaving family unprepared', 'debt burden', 'college fund', 'mortgage', 'funeral costs'],
        desire: ['legacy', 'family security', 'children\'s future', 'spouse protected', 'estate planning'],
        urgency: ['health changes', 'age increase', 'new baby', 'marriage', 'mortgage'],
        trust: ['financial strength', 'claims paid', 'been around', 'family company', 'fiduciary'],
        social: ['parents choose', 'breadwinners need', 'responsible adults', 'loving spouses']
      },
      powerWords: ['legacy', 'protect', 'family', 'future', 'security', 'guarantee', 'benefit', 'coverage', 'peace'],
      languagePatterns: {
        formal: ['death benefit', 'beneficiary', 'term vs whole', 'cash value', 'underwriting'],
        casual: ['covered', 'taken care of', 'set up', 'protected'],
        emotional: ['there for them', 'love shows', 'final gift', 'lasting legacy']
      },
      customerPersona: {
        primaryMotivation: 'Ensuring family financial security after death',
        decisionDrivers: ['Coverage amount', 'Premium cost', 'Term length', 'Company rating', 'Rider options'],
        objections: ['Too young', 'Too expensive', 'Have through work', 'Uncomfortable topic'],
        valueLanguage: ['face amount', 'premium', 'term', 'whole life', 'beneficiary']
      },
      contentAngles: [
        'How much life insurance do you really need',
        'Term vs whole life explained simply',
        'Life insurance myths debunked',
        'When to update your beneficiaries',
        'Life insurance for different life stages'
      ]
    });

    this.profiles.set('auto insurance', {
      naicsCode: '524126',
      industry: 'Auto Insurance',
      category: 'Finance and Insurance',
      triggers: {
        fear: ['accident', 'lawsuit', 'totaled car', 'injury', 'uninsured driver', 'rate hike'],
        desire: ['low rates', 'good coverage', 'easy claims', 'discounts', 'bundle savings'],
        urgency: ['renewal coming', 'new car', 'teen driver', 'ticket', 'accident forgiveness'],
        trust: ['quick claims', 'fair repairs', 'rental included', 'no hassle'],
        social: ['drivers switch', 'families save', 'commuters choose']
      },
      powerWords: ['save', 'discount', 'coverage', 'rate', 'claim', 'deductible', 'bundle', 'switch', 'compare'],
      languagePatterns: {
        formal: ['liability limits', 'comprehensive', 'collision', 'uninsured motorist'],
        casual: ['rate', 'coverage', 'deductible', 'claim'],
        emotional: ['get back on the road', 'drive worry-free', 'accident happens']
      },
      customerPersona: {
        primaryMotivation: 'Legal compliance and financial protection at best price',
        decisionDrivers: ['Price', 'Discounts', 'Coverage options', 'Claims experience', 'Bundle options'],
        objections: ['Current rate is fine', 'Too much hassle to switch', 'Loyalty discount'],
        valueLanguage: ['premium', 'liability', 'comprehensive', 'collision', 'deductible']
      },
      contentAngles: [
        'Discounts you\'re probably missing',
        'What to do right after an accident',
        'Understanding your declarations page',
        'When to drop collision coverage',
        'Teen driver survival guide'
      ]
    });

    // Real Estate
    this.profiles.set('real estate', {
      naicsCode: '531210',
      industry: 'Real Estate Agents and Brokers',
      category: 'Real Estate',
      triggers: {
        fear: ['miss out', 'overpay', 'bad investment', 'hidden problems', 'market crash', 'wrong neighborhood'],
        desire: ['dream home', 'investment', 'equity', 'perfect fit', 'right price', 'location'],
        urgency: ['market moving', 'rates rising', 'inventory low', 'just listed', 'price reduced'],
        trust: ['local expert', 'track record', 'client reviews', 'market knowledge', 'negotiator'],
        social: ['families moved', 'investors trust', 'first-time buyers choose']
      },
      powerWords: ['location', 'value', 'investment', 'equity', 'opportunity', 'dream', 'perfect', 'exclusive', 'move'],
      languagePatterns: {
        formal: ['market analysis', 'comparable sales', 'contingencies', 'closing costs'],
        casual: ['great find', 'won\'t last', 'perfect for', 'must see'],
        emotional: ['home sweet home', 'picture yourself', 'where memories are made']
      },
      customerPersona: {
        primaryMotivation: 'Finding perfect home or maximizing property value',
        decisionDrivers: ['Location', 'Price', 'Features', 'Schools', 'Agent expertise'],
        objections: ['Not ready', 'Market too hot/cold', 'Can do it myself', 'Commission too high'],
        valueLanguage: ['list price', 'offer', 'closing', 'inspection', 'appraisal']
      },
      contentAngles: [
        'Neighborhood guides with insider info',
        'Market updates and predictions',
        'Buyer/seller mistakes to avoid',
        'Investment property analysis',
        'First-time buyer roadmap'
      ]
    });

    // Legal Services
    this.profiles.set('legal services', {
      naicsCode: '541110',
      industry: 'Legal Services',
      category: 'Professional Services',
      triggers: {
        fear: ['lose case', 'jail', 'financial ruin', 'custody loss', 'reputation damage', 'statute limitations'],
        desire: ['justice', 'fair outcome', 'protection', 'peace of mind', 'closure', 'compensation'],
        urgency: ['deadline', 'statute', 'hearing date', 'evidence fading', 'opposing action'],
        trust: ['experience', 'track record', 'specialization', 'client testimonials', 'bar standing'],
        social: ['clients won', 'families protected', 'businesses saved']
      },
      powerWords: ['rights', 'protect', 'fight', 'justice', 'compensation', 'defense', 'advocate', 'winning'],
      languagePatterns: {
        formal: ['representation', 'litigation', 'settlement', 'damages', 'liability'],
        casual: ['help', 'fight for you', 'on your side', 'get what you deserve'],
        emotional: ['nightmare over', 'life back', 'justice served', 'finally closure']
      },
      customerPersona: {
        primaryMotivation: 'Legal protection and favorable outcome',
        decisionDrivers: ['Specialization', 'Experience', 'Communication', 'Fees', 'Reputation'],
        objections: ['Too expensive', 'Don\'t need lawyer', 'Intimidated', 'Bad past experience'],
        valueLanguage: ['retainer', 'contingency', 'billable', 'consultation', 'representation']
      },
      contentAngles: [
        'Know your rights in common situations',
        'When you actually need a lawyer',
        'Understanding the legal process',
        'Common legal mistakes to avoid',
        'What to expect from your case'
      ]
    });

    // Healthcare
    this.profiles.set('healthcare', {
      naicsCode: '621111',
      industry: 'Healthcare Providers',
      category: 'Healthcare',
      triggers: {
        fear: ['misdiagnosis', 'pain', 'waiting', 'cost', 'side effects', 'getting worse'],
        desire: ['relief', 'answers', 'health', 'quality of life', 'prevention', 'expert care'],
        urgency: ['symptoms worsening', 'pain level', 'waiting list', 'prevention window'],
        trust: ['credentials', 'experience', 'reviews', 'bedside manner', 'technology'],
        social: ['patients healed', 'families trust', 'community serves']
      },
      powerWords: ['relief', 'heal', 'care', 'expert', 'treatment', 'solution', 'wellness', 'health', 'recover'],
      languagePatterns: {
        formal: ['diagnosis', 'treatment plan', 'prognosis', 'procedure', 'consultation'],
        casual: ['feeling better', 'get checked', 'take care of', 'health journey'],
        emotional: ['life-changing', 'finally relief', 'back to normal', 'pain-free']
      },
      customerPersona: {
        primaryMotivation: 'Health improvement and pain relief',
        decisionDrivers: ['Expertise', 'Insurance accepted', 'Location', 'Wait time', 'Reviews'],
        objections: ['Cost/insurance', 'Fear of diagnosis', 'Too busy', 'Bad experiences'],
        valueLanguage: ['appointment', 'treatment', 'insurance', 'copay', 'referral']
      },
      contentAngles: [
        'Symptoms you shouldn\'t ignore',
        'Prevention guides by condition',
        'What to expect from treatments',
        'Patient success stories',
        'Latest treatment innovations'
      ]
    });

    // Financial Services
    this.profiles.set('financial services', {
      naicsCode: '523930',
      industry: 'Financial Planning and Investment',
      category: 'Finance',
      triggers: {
        fear: ['running out', 'market crash', 'inflation', 'outliving money', 'tax burden', 'scams'],
        desire: ['security', 'growth', 'retirement', 'wealth', 'legacy', 'freedom'],
        urgency: ['market timing', 'tax deadline', 'retirement approaching', 'compound interest'],
        trust: ['fiduciary', 'credentials', 'track record', 'transparency', 'client-first'],
        social: ['families secured', 'retirees thriving', 'business owners trust']
      },
      powerWords: ['grow', 'secure', 'wealth', 'freedom', 'protect', 'plan', 'retire', 'invest', 'save'],
      languagePatterns: {
        formal: ['portfolio', 'asset allocation', 'diversification', 'risk tolerance', 'fiduciary'],
        casual: ['nest egg', 'rainy day', 'golden years', 'money goals'],
        emotional: ['sleep at night', 'enjoy retirement', 'leave legacy', 'financial freedom']
      },
      customerPersona: {
        primaryMotivation: 'Financial security and goal achievement',
        decisionDrivers: ['Trust', 'Performance', 'Fees', 'Communication', 'Specialization'],
        objections: ['Can do it myself', 'Fees too high', 'Don\'t trust advisors', 'Not enough to invest'],
        valueLanguage: ['AUM', 'returns', 'fees', 'planning', 'allocation']
      },
      contentAngles: [
        'Retirement planning by decade',
        'Tax optimization strategies',
        'Market outlook and positioning',
        'Common financial mistakes',
        'Goal-based planning guides'
      ]
    });

    // Technology
    this.profiles.set('technology', {
      naicsCode: '541512',
      industry: 'Technology Services',
      category: 'Technology',
      triggers: {
        fear: ['data breach', 'downtime', 'obsolete', 'competition', 'inefficiency', 'compliance'],
        desire: ['efficiency', 'growth', 'innovation', 'competitive edge', 'automation', 'scale'],
        urgency: ['security threat', 'competitor launched', 'system failing', 'deadline'],
        trust: ['uptime', 'security certifications', 'case studies', 'support', 'roadmap'],
        social: ['companies scaled', 'teams empowered', 'industries transformed']
      },
      powerWords: ['automate', 'scale', 'secure', 'integrate', 'optimize', 'transform', 'innovate', 'streamline'],
      languagePatterns: {
        formal: ['implementation', 'integration', 'deployment', 'architecture', 'infrastructure'],
        casual: ['works', 'easy', 'fast', 'reliable', 'powerful'],
        emotional: ['finally works', 'game-changer', 'freed up time', 'peace of mind']
      },
      customerPersona: {
        primaryMotivation: 'Efficiency gains and competitive advantage',
        decisionDrivers: ['Features', 'Integration', 'Price', 'Support', 'Scalability'],
        objections: ['Too complex', 'Migration hassle', 'Already have solution', 'ROI unclear'],
        valueLanguage: ['SaaS', 'API', 'uptime', 'SLA', 'implementation']
      },
      contentAngles: [
        'ROI calculators and case studies',
        'Integration guides',
        'Security and compliance content',
        'Industry-specific solutions',
        'Future of work/industry content'
      ]
    });

    // Retail
    this.profiles.set('retail', {
      naicsCode: '441110',
      industry: 'Retail Trade',
      category: 'Retail',
      triggers: {
        fear: ['missing out', 'overpaying', 'wrong choice', 'buyer\'s remorse', 'quality issues'],
        desire: ['great deal', 'perfect item', 'quality', 'status', 'convenience', 'uniqueness'],
        urgency: ['limited stock', 'sale ending', 'seasonal', 'new arrival', 'last chance'],
        trust: ['reviews', 'returns', 'warranty', 'brand reputation', 'customer service'],
        social: ['customers love', 'best seller', 'trending', 'influencer favorite']
      },
      powerWords: ['save', 'exclusive', 'limited', 'new', 'best', 'quality', 'deal', 'free', 'guaranteed'],
      languagePatterns: {
        formal: ['specifications', 'warranty terms', 'return policy', 'product details'],
        casual: ['awesome', 'perfect', 'must-have', 'love it', 'game-changer'],
        emotional: ['treat yourself', 'you deserve', 'finally', 'life-changing']
      },
      customerPersona: {
        primaryMotivation: 'Getting best value and right product',
        decisionDrivers: ['Price', 'Quality', 'Reviews', 'Convenience', 'Brand'],
        objections: ['Too expensive', 'Don\'t need it', 'Can find cheaper', 'Not sure about quality'],
        valueLanguage: ['price', 'discount', 'shipping', 'returns', 'warranty']
      },
      contentAngles: [
        'Buying guides by category',
        'Product comparisons',
        'Seasonal recommendations',
        'Customer spotlights',
        'Behind the scenes/sourcing'
      ]
    });

    // Food Service
    this.profiles.set('food service', {
      naicsCode: '722511',
      industry: 'Restaurants and Food Service',
      category: 'Food and Beverage',
      triggers: {
        fear: ['bad experience', 'food safety', 'wasted money', 'long wait', 'disappointing'],
        desire: ['delicious', 'experience', 'convenience', 'special occasion', 'comfort', 'discovery'],
        urgency: ['hungry now', 'reservation needed', 'special menu', 'limited time offer'],
        trust: ['reviews', 'cleanliness', 'consistency', 'locally sourced', 'chef credentials'],
        social: ['locals favorite', 'date night spot', 'family tradition', 'Instagram-worthy']
      },
      powerWords: ['fresh', 'delicious', 'authentic', 'homemade', 'local', 'special', 'experience', 'taste'],
      languagePatterns: {
        formal: ['cuisine', 'preparation', 'ingredients', 'presentation', 'service'],
        casual: ['yummy', 'amazing', 'must-try', 'obsessed', 'craving'],
        emotional: ['comfort', 'memories', 'celebration', 'tradition', 'love']
      },
      customerPersona: {
        primaryMotivation: 'Great food and experience',
        decisionDrivers: ['Food quality', 'Price', 'Location', 'Atmosphere', 'Reviews'],
        objections: ['Too expensive', 'Too far', 'Diet restrictions', 'Bad past experience'],
        valueLanguage: ['menu', 'reservation', 'specials', 'delivery', 'takeout']
      },
      contentAngles: [
        'Behind the menu stories',
        'Chef spotlights',
        'Seasonal ingredients',
        'Food pairing guides',
        'Local sourcing stories'
      ]
    });

    // Construction
    this.profiles.set('construction', {
      naicsCode: '236220',
      industry: 'Construction and Contractors',
      category: 'Construction',
      triggers: {
        fear: ['overruns', 'delays', 'poor quality', 'unlicensed', 'disappearing contractor', 'safety'],
        desire: ['quality work', 'on time', 'on budget', 'dream project', 'value add', 'reliability'],
        urgency: ['weather window', 'permit expiring', 'season starting', 'damage worsening'],
        trust: ['licensed', 'insured', 'references', 'portfolio', 'warranty', 'local'],
        social: ['homeowners trust', 'neighbors recommend', 'community built']
      },
      powerWords: ['quality', 'reliable', 'guaranteed', 'licensed', 'experienced', 'professional', 'trusted'],
      languagePatterns: {
        formal: ['specifications', 'permits', 'code compliance', 'materials', 'warranty'],
        casual: ['get it done', 'looks great', 'built to last', 'solid work'],
        emotional: ['dream home', 'finally fixed', 'peace of mind', 'proud of']
      },
      customerPersona: {
        primaryMotivation: 'Quality work that lasts at fair price',
        decisionDrivers: ['References', 'Price', 'Timeline', 'Communication', 'Licensing'],
        objections: ['Too expensive', 'DIY', 'Bad contractor experience', 'Not urgent'],
        valueLanguage: ['estimate', 'quote', 'timeline', 'materials', 'warranty']
      },
      contentAngles: [
        'Before/after project showcases',
        'Cost guides by project type',
        'What to ask contractors',
        'Seasonal maintenance tips',
        'Permit and code guides'
      ]
    });

    // Automotive
    this.profiles.set('automotive', {
      naicsCode: '441110',
      industry: 'Automotive Dealers and Services',
      category: 'Automotive',
      triggers: {
        fear: ['rip-off', 'unsafe', 'breakdown', 'wrong purchase', 'hidden problems', 'overpay'],
        desire: ['reliability', 'good deal', 'dream car', 'safety', 'performance', 'status'],
        urgency: ['deal ending', 'car failing', 'safety issue', 'model year end', 'rebates expiring'],
        trust: ['reviews', 'certifications', 'warranty', 'transparency', 'reputation'],
        social: ['drivers trust', 'families choose', 'enthusiasts recommend']
      },
      powerWords: ['reliable', 'safe', 'value', 'certified', 'warranty', 'performance', 'deal', 'savings'],
      languagePatterns: {
        formal: ['specifications', 'certification', 'warranty terms', 'financing options'],
        casual: ['great car', 'runs perfect', 'solid deal', 'love driving it'],
        emotional: ['freedom', 'confidence', 'pride', 'peace of mind']
      },
      customerPersona: {
        primaryMotivation: 'Reliable vehicle at fair price',
        decisionDrivers: ['Price', 'Reliability', 'Features', 'Fuel economy', 'Reviews'],
        objections: ['Don\'t trust dealers', 'Can find cheaper', 'Not ready', 'Want to negotiate'],
        valueLanguage: ['MSRP', 'financing', 'trade-in', 'mileage', 'warranty']
      },
      contentAngles: [
        'Buying guides by vehicle type',
        'Maintenance schedules',
        'Common problem warnings',
        'Value retention rankings',
        'Safety feature explanations'
      ]
    });

    // Fitness & Wellness
    this.profiles.set('fitness wellness', {
      naicsCode: '713940',
      industry: 'Fitness and Wellness Centers',
      category: 'Health and Fitness',
      triggers: {
        fear: ['health decline', 'weight gain', 'injury', 'intimidation', 'wasting money', 'not seeing results'],
        desire: ['energy', 'confidence', 'strength', 'weight loss', 'health', 'community', 'stress relief'],
        urgency: ['new year', 'summer coming', 'health scare', 'event approaching', 'special offer'],
        trust: ['certifications', 'results', 'testimonials', 'clean facility', 'qualified trainers'],
        social: ['members transformed', 'community supports', 'friends workout']
      },
      powerWords: ['transform', 'results', 'energy', 'strength', 'community', 'support', 'achieve', 'goals'],
      languagePatterns: {
        formal: ['program', 'assessment', 'nutrition plan', 'personal training', 'membership'],
        casual: ['crush it', 'get fit', 'feel great', 'look amazing'],
        emotional: ['finally', 'life-changing', 'confidence', 'empowered', 'community']
      },
      customerPersona: {
        primaryMotivation: 'Health improvement and confidence',
        decisionDrivers: ['Location', 'Price', 'Equipment', 'Classes', 'Atmosphere'],
        objections: ['Too expensive', 'No time', 'Intimidated', 'Won\'t stick with it'],
        valueLanguage: ['membership', 'classes', 'training', 'amenities', 'contract']
      },
      contentAngles: [
        'Transformation stories',
        'Workout tips by goal',
        'Nutrition guidance',
        'Overcoming obstacles',
        'Community spotlights'
      ]
    });

    // Marketing Agency
    this.profiles.set('marketing agency', {
      naicsCode: '541810',
      industry: 'Marketing and Advertising Agencies',
      category: 'Professional Services',
      triggers: {
        fear: ['wasting budget', 'no results', 'falling behind', 'wrong strategy', 'missing opportunities'],
        desire: ['growth', 'leads', 'brand recognition', 'ROI', 'competitive edge', 'expertise'],
        urgency: ['campaign deadline', 'product launch', 'competitor action', 'season starting'],
        trust: ['case studies', 'results', 'industry experience', 'team expertise', 'transparency'],
        social: ['brands grown', 'companies scaled', 'leaders trust']
      },
      powerWords: ['results', 'growth', 'strategy', 'ROI', 'leads', 'brand', 'scale', 'convert', 'engage'],
      languagePatterns: {
        formal: ['strategy', 'campaign', 'analytics', 'deliverables', 'KPIs', 'ROI'],
        casual: ['crush it', 'results', 'growth', 'winning'],
        emotional: ['finally growing', 'game-changer', 'relief', 'confidence']
      },
      customerPersona: {
        primaryMotivation: 'Business growth and marketing ROI',
        decisionDrivers: ['Results', 'Industry experience', 'Price', 'Communication', 'Team'],
        objections: ['Too expensive', 'Burned before', 'Can do in-house', 'ROI unclear'],
        valueLanguage: ['retainer', 'scope', 'deliverables', 'reports', 'strategy']
      },
      contentAngles: [
        'Industry benchmarks and insights',
        'Case studies with results',
        'Strategy guides',
        'Trend reports',
        'Tool and tactic tutorials'
      ]
    });

    // Education
    this.profiles.set('education', {
      naicsCode: '611310',
      industry: 'Education and Training',
      category: 'Education',
      triggers: {
        fear: ['falling behind', 'wrong choice', 'wasted investment', 'missing out', 'failure'],
        desire: ['success', 'knowledge', 'skills', 'career', 'confidence', 'opportunity'],
        urgency: ['enrollment deadline', 'class filling', 'application window', 'career change'],
        trust: ['accreditation', 'outcomes', 'testimonials', 'faculty', 'support'],
        social: ['graduates succeed', 'students achieve', 'careers launched']
      },
      powerWords: ['learn', 'achieve', 'success', 'opportunity', 'skills', 'career', 'future', 'growth'],
      languagePatterns: {
        formal: ['curriculum', 'accreditation', 'enrollment', 'certification', 'outcomes'],
        casual: ['learn', 'grow', 'succeed', 'launch'],
        emotional: ['finally understand', 'confidence', 'future', 'opportunity']
      },
      customerPersona: {
        primaryMotivation: 'Skill development and career advancement',
        decisionDrivers: ['Outcomes', 'Cost', 'Flexibility', 'Reputation', 'Support'],
        objections: ['Too expensive', 'No time', 'Not sure ROI', 'Can learn free online'],
        valueLanguage: ['tuition', 'credits', 'certification', 'outcomes', 'support']
      },
      contentAngles: [
        'Success stories',
        'Career outcome data',
        'Skill guides',
        'Industry trends',
        'Learning tips'
      ]
    });

    // Professional Services
    this.profiles.set('professional services', {
      naicsCode: '541990',
      industry: 'Professional Services',
      category: 'Professional Services',
      triggers: {
        fear: ['costly mistakes', 'missed opportunities', 'compliance issues', 'falling behind'],
        desire: ['expertise', 'efficiency', 'results', 'peace of mind', 'competitive edge'],
        urgency: ['deadline', 'project starting', 'issue arising', 'opportunity window'],
        trust: ['experience', 'credentials', 'testimonials', 'specialization', 'process'],
        social: ['businesses trust', 'leaders choose', 'companies rely']
      },
      powerWords: ['expert', 'results', 'solutions', 'trusted', 'professional', 'efficient', 'reliable'],
      languagePatterns: {
        formal: ['engagement', 'deliverables', 'scope', 'methodology', 'expertise'],
        casual: ['get it done', 'handle it', 'take care of', 'solve'],
        emotional: ['relief', 'confidence', 'peace of mind', 'finally']
      },
      customerPersona: {
        primaryMotivation: 'Expert help for complex needs',
        decisionDrivers: ['Expertise', 'Price', 'Communication', 'Results', 'Availability'],
        objections: ['Too expensive', 'Do it ourselves', 'Bad past experience', 'Don\'t trust consultants'],
        valueLanguage: ['engagement', 'fees', 'scope', 'deliverables', 'timeline']
      },
      contentAngles: [
        'Industry expertise content',
        'Common mistake guides',
        'Process explanations',
        'Case studies',
        'Thought leadership'
      ]
    });

    // General Business (fallback)
    this.profiles.set('general business', {
      naicsCode: '000000',
      industry: 'General Business',
      category: 'General',
      triggers: {
        fear: ['losing money', 'missing out', 'making mistakes', 'wasting time', 'falling behind'],
        desire: ['success', 'growth', 'efficiency', 'quality', 'value', 'trust'],
        urgency: ['limited time', 'act now', 'before it\'s too late', 'don\'t miss'],
        trust: ['experience', 'reviews', 'results', 'reputation', 'guarantee'],
        social: ['customers trust', 'businesses choose', 'community recommends']
      },
      powerWords: ['proven', 'trusted', 'quality', 'value', 'results', 'guaranteed', 'professional', 'expert'],
      languagePatterns: {
        formal: ['services', 'solutions', 'process', 'engagement', 'deliverables'],
        casual: ['works', 'easy', 'best', 'great'],
        emotional: ['finally', 'peace of mind', 'confidence', 'relief']
      },
      customerPersona: {
        primaryMotivation: 'Getting quality results at fair value',
        decisionDrivers: ['Price', 'Quality', 'Trust', 'Convenience', 'Reviews'],
        objections: ['Too expensive', 'Don\'t need it', 'Not now', 'Can do it myself'],
        valueLanguage: ['price', 'quality', 'service', 'value', 'results']
      },
      contentAngles: [
        'How-to guides',
        'Problem-solution content',
        'Customer stories',
        'Industry insights',
        'Tips and best practices'
      ]
    });

    console.log(`[NAICS] Initialized ${this.profiles.size} industry profiles`);
  }
}

export const naicsDatabase = new NAICSDatabaseService();
