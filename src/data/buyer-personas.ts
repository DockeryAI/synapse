/**
 * Pre-built Customer Personas by Industry
 * 5 common personas for each industry that users can select from
 */

import type { CustomerPersona } from '@/types/buyer-journey'

/**
 * Home Services Personas
 */
export const homeServicesPersonas: CustomerPersona[] = [
  {
    id: 'hs-busy-homeowners',
    name: 'Busy Homeowners',
    avatar_color: '#3b82f6', // blue
    industry: 'Home Services',
    quick_description: '35-55, dual-income families, time-starved',
    key_traits: ['Time-conscious', 'Quality-focused', 'Price-aware', 'Family-oriented'],
    demographics: {
      age_range: '35-55',
      income_range: '$75k-$150k',
      location_type: 'Suburban',
    },
    pain_points: [
      'No time to research or wait around for quotes',
      'Worried about getting ripped off or scammed',
      'Need work done quickly without disrupting family life',
    ],
    goals: [
      'Get reliable service without hassle',
      'Protect their investment (home)',
      'Free up time for family',
    ],
  },
  {
    id: 'hs-first-time-buyers',
    name: 'First-Time Homebuyers',
    avatar_color: '#8b5cf6', // purple
    industry: 'Home Services',
    quick_description: '28-35, new homeowners, learning the ropes',
    key_traits: ['Budget-conscious', 'Information-seeking', 'Nervous', 'Tech-savvy'],
    demographics: {
      age_range: '28-35',
      income_range: '$50k-$90k',
      location_type: 'Suburban/Urban',
    },
    pain_points: [
      "Don't know what's normal pricing or what to expect",
      'Afraid of making expensive mistakes',
      'Overwhelmed by all the maintenance needs',
    ],
    goals: [
      'Learn how to maintain their home properly',
      'Build relationships with trustworthy contractors',
      'Stay within budget',
    ],
  },
  {
    id: 'hs-retirees',
    name: 'Retired Homeowners',
    avatar_color: '#10b981', // green
    industry: 'Home Services',
    quick_description: '60+, fixed income, aging in place',
    key_traits: ['Relationship-focused', 'Value-conscious', 'Patient', 'Loyal'],
    demographics: {
      age_range: '60+',
      income_range: '$40k-$80k',
      location_type: 'Suburban',
    },
    pain_points: [
      "Can't do physical work themselves anymore",
      'Worried about being taken advantage of',
      'Need modifications for aging in place',
    ],
    goals: [
      'Find honest, reliable service providers',
      'Maintain home value',
      'Stay independent in their home',
    ],
  },
  {
    id: 'hs-property-investors',
    name: 'Property Investors',
    avatar_color: '#f59e0b', // amber
    industry: 'Home Services',
    quick_description: 'Real estate investors, multiple properties',
    key_traits: ['ROI-focused', 'Efficiency-driven', 'Professional', 'Price-negotiator'],
    demographics: {
      age_range: '35-60',
      income_range: '$100k+',
      location_type: 'Various',
    },
    pain_points: [
      'Need fast, reliable service across multiple properties',
      'Hard to find contractors who understand rental business',
      'Constant scheduling and coordination headaches',
    ],
    goals: [
      'Maximize ROI on repairs and upgrades',
      'Build team of reliable contractors',
      'Minimize tenant turnover',
    ],
  },
  {
    id: 'hs-emergency-situations',
    name: 'Emergency Customers',
    avatar_color: '#ef4444', // red
    industry: 'Home Services',
    quick_description: 'Any age, dealing with urgent home crisis',
    key_traits: ['Stressed', 'Urgent-need', 'Less price-sensitive', 'Relief-seeking'],
    demographics: {
      age_range: '25-70',
      income_range: '$40k+',
      location_type: 'Various',
    },
    pain_points: [
      'Something broke and needs immediate attention',
      'Don\'t have time to shop around or research',
      'Scared the problem will get worse',
    ],
    goals: [
      'Get problem fixed NOW',
      'Prevent further damage',
      'Get back to normal life ASAP',
    ],
  },
]

/**
 * Professional Services Personas
 */
export const professionalServicesPersonas: CustomerPersona[] = [
  {
    id: 'ps-growth-startups',
    name: 'Growth-Stage Startups',
    avatar_color: '#3b82f6',
    industry: 'Professional Services',
    quick_description: 'Tech startups, 10-50 employees, scaling fast',
    key_traits: ['Fast-paced', 'Results-driven', 'Tech-forward', 'ROI-focused'],
    demographics: {
      age_range: '30-45 (decision-makers)',
      income_range: '$150k+ (budget)',
      location_type: 'Urban tech hubs',
    },
    pain_points: [
      'Growing too fast to build in-house expertise',
      'Need specialists who understand startup culture',
      'Budget constraints despite growth',
    ],
    goals: [
      'Scale operations without slowing down',
      'Access expertise on-demand',
      'Maintain startup agility',
    ],
  },
  {
    id: 'ps-established-smb',
    name: 'Established SMBs',
    avatar_color: '#10b981',
    industry: 'Professional Services',
    quick_description: '5-25 years in business, stable growth',
    key_traits: ['Relationship-focused', 'Risk-averse', 'Value-driven', 'Practical'],
    demographics: {
      age_range: '40-60',
      income_range: '$100k-$500k (budget)',
      location_type: 'Suburban/Urban',
    },
    pain_points: [
      'Outgrown DIY solutions but cautious about big changes',
      'Need to modernize but afraid of disruption',
      'Want long-term partnerships, not vendors',
    ],
    goals: [
      'Professionalize operations',
      'Reduce owner dependency',
      'Position for succession or sale',
    ],
  },
  {
    id: 'ps-solopreneurs',
    name: 'Solopreneurs & Freelancers',
    avatar_color: '#8b5cf6',
    industry: 'Professional Services',
    quick_description: 'One-person businesses, juggling everything',
    key_traits: ['Time-starved', 'Budget-conscious', 'Self-sufficient', 'Learning-focused'],
    demographics: {
      age_range: '28-50',
      income_range: '$30k-$100k',
      location_type: 'Various (often remote)',
    },
    pain_points: [
      'Wearing too many hats, need to outsource',
      'Limited budget but need professional quality',
      'Hard to find services that scale with growth',
    ],
    goals: [
      'Focus on their core business',
      'Look more professional',
      'Scale income without trading time',
    ],
  },
  {
    id: 'ps-enterprise-buyers',
    name: 'Enterprise Buyers',
    avatar_color: '#f59e0b',
    industry: 'Professional Services',
    quick_description: 'Large companies, complex procurement',
    key_traits: ['Process-driven', 'Committee-decision', 'Compliance-focused', 'Risk-averse'],
    demographics: {
      age_range: '35-55',
      income_range: '$500k+ (budget)',
      location_type: 'Major metros',
    },
    pain_points: [
      'Long procurement cycles and approval processes',
      'Need vendors who understand enterprise complexity',
      'Require extensive documentation and compliance',
    ],
    goals: [
      'Find vetted, credible partners',
      'Minimize risk',
      'Justify decisions to stakeholders',
    ],
  },
  {
    id: 'ps-nonprofit-orgs',
    name: 'Nonprofit Organizations',
    avatar_color: '#ec4899',
    industry: 'Professional Services',
    quick_description: 'Mission-driven orgs with limited budgets',
    key_traits: ['Mission-focused', 'Budget-constrained', 'Relationship-driven', 'Impact-oriented'],
    demographics: {
      age_range: '30-55 (decision-makers)',
      income_range: '$20k-$200k (budget)',
      location_type: 'Various',
    },
    pain_points: [
      'Need professional services on nonprofit budgets',
      'Hard to justify overhead spending to board',
      'Want partners who understand their mission',
    ],
    goals: [
      'Maximize impact per dollar',
      'Build long-term strategic partnerships',
      'Professionalize without losing mission focus',
    ],
  },
]

/**
 * Retail/E-commerce Personas
 */
export const retailEcommercePersonas: CustomerPersona[] = [
  {
    id: 'ret-convenience-shoppers',
    name: 'Convenience Shoppers',
    avatar_color: '#3b82f6',
    industry: 'Retail/E-commerce',
    quick_description: 'Busy professionals, value time over price',
    key_traits: ['Time-poor', 'Mobile-first', 'Convenience-focused', 'Subscription-friendly'],
    demographics: {
      age_range: '25-45',
      income_range: '$60k-$150k',
      location_type: 'Urban/Suburban',
    },
    pain_points: [
      'No time to shop around or visit stores',
      'Frustrated by slow shipping or complicated checkout',
      'Want easy returns and customer service',
    ],
    goals: [
      'Get what they need quickly and easily',
      'Minimize shopping time',
      'Automate regular purchases',
    ],
  },
  {
    id: 'ret-deal-hunters',
    name: 'Deal Hunters',
    avatar_color: '#f59e0b',
    industry: 'Retail/E-commerce',
    quick_description: 'Price-conscious, comparison shoppers',
    key_traits: ['Price-sensitive', 'Research-heavy', 'Coupon-users', 'Patient'],
    demographics: {
      age_range: '25-60',
      income_range: '$30k-$80k',
      location_type: 'Various',
    },
    pain_points: [
      'Afraid of overpaying or missing a better deal',
      'Overwhelmed by choice and comparison shopping',
      'Don\'t trust "sale" prices',
    ],
    goals: [
      'Get the best price possible',
      'Feel smart about purchases',
      'Stretch their budget',
    ],
  },
  {
    id: 'ret-brand-loyalists',
    name: 'Brand Loyalists',
    avatar_color: '#10b981',
    industry: 'Retail/E-commerce',
    quick_description: 'Repeat customers, high lifetime value',
    key_traits: ['Brand-focused', 'Quality-conscious', 'Community-oriented', 'Advocacy-prone'],
    demographics: {
      age_range: '25-55',
      income_range: '$50k-$150k',
      location_type: 'Various',
    },
    pain_points: [
      'Frustrated when favorite brands don\'t recognize loyalty',
      'Annoyed by generic marketing',
      'Want VIP treatment for loyalty',
    ],
    goals: [
      'Support brands they believe in',
      'Get recognized and rewarded',
      'Be part of brand community',
    ],
  },
  {
    id: 'ret-research-driven',
    name: 'Research-Driven Buyers',
    avatar_color: '#8b5cf6',
    industry: 'Retail/E-commerce',
    quick_description: 'Thorough researchers, high-ticket purchases',
    key_traits: ['Detail-oriented', 'Review-readers', 'Risk-averse', 'Patient'],
    demographics: {
      age_range: '30-60',
      income_range: '$60k-$150k',
      location_type: 'Various',
    },
    pain_points: [
      'Need extensive information before purchasing',
      'Hard to find detailed specs and comparisons',
      'Frustrated by lack of reviews or social proof',
    ],
    goals: [
      'Make well-informed decisions',
      'Avoid buyer\'s remorse',
      'Find the perfect product for their needs',
    ],
  },
  {
    id: 'ret-impulse-buyers',
    name: 'Impulse Buyers',
    avatar_color: '#ec4899',
    industry: 'Retail/E-commerce',
    quick_description: 'Emotional shoppers, spontaneous purchases',
    key_traits: ['Emotional', 'Visual-driven', 'Trend-followers', 'Social-influenced'],
    demographics: {
      age_range: '18-35',
      income_range: '$30k-$90k',
      location_type: 'Urban',
    },
    pain_points: [
      'Get bored easily with generic shopping experiences',
      'Want instant gratification',
      'Frustrated by slow websites or checkout',
    ],
    goals: [
      'Discover new and exciting products',
      'Express their personality through purchases',
      'Share finds with friends',
    ],
  },
]

/**
 * Insurance Personas (for insurance agencies/brokerages selling to businesses)
 */
export const insurancePersonas: CustomerPersona[] = [
  {
    id: 'ins-commercial-smb',
    name: 'Commercial SMB Owners',
    avatar_color: '#3b82f6',
    industry: 'Insurance',
    quick_description: 'Small-medium business owners, need comprehensive coverage',
    key_traits: ['Risk-aware', 'Budget-conscious', 'Compliance-focused', 'Growth-oriented'],
    demographics: {
      age_range: '35-60',
      income_range: '$100k-$500k (business revenue)',
      location_type: 'Various',
    },
    pain_points: [
      'Confused by insurance jargon and policy options',
      'Worried about gaps in coverage that could sink the business',
      'Frustrated by one-size-fits-all policies that don\'t fit their needs',
      'Concerned about rising premiums eating into profits',
    ],
    goals: [
      'Protect their business investment and livelihood',
      'Get tailored coverage without overpaying',
      'Work with an advisor who understands their industry',
      'Simplify insurance management across multiple policies',
    ],
  },
  {
    id: 'ins-high-risk-contractors',
    name: 'High-Risk Contractors',
    avatar_color: '#f59e0b',
    industry: 'Insurance',
    quick_description: 'Construction, trades, specialized contractors',
    key_traits: ['Safety-focused', 'Compliance-driven', 'Price-sensitive', 'Experience-valued'],
    demographics: {
      age_range: '30-55',
      income_range: '$75k-$300k (business revenue)',
      location_type: 'Suburban/Urban',
    },
    pain_points: [
      'Hard to find affordable coverage for high-risk work',
      'Rejected by standard carriers or quoted astronomical rates',
      'Need specialized liability coverage most agents don\'t understand',
      'Worried about claims ruining their reputation or insurability',
    ],
    goals: [
      'Find carriers who specialize in their high-risk industry',
      'Get competitive rates despite risk profile',
      'Protect against catastrophic liability claims',
      'Maintain proper coverage to win contracts',
    ],
  },
  {
    id: 'ins-professional-services',
    name: 'Professional Services Firms',
    avatar_color: '#8b5cf6',
    industry: 'Insurance',
    quick_description: 'Lawyers, accountants, consultants, advisors',
    key_traits: ['Detail-oriented', 'Liability-conscious', 'Credential-focused', 'Relationship-driven'],
    demographics: {
      age_range: '35-65',
      income_range: '$150k-$1M+ (firm revenue)',
      location_type: 'Urban/Suburban',
    },
    pain_points: [
      'Need specialized E&O/professional liability coverage',
      'Worried about malpractice claims that could end their career',
      'Frustrated by carriers who don\'t understand professional risks',
      'Concerned about cyber liability and data breach exposure',
    ],
    goals: [
      'Get comprehensive professional liability protection',
      'Find carriers with expertise in their profession',
      'Protect personal assets from business claims',
      'Maintain required coverage for licensing/credentials',
    ],
  },
  {
    id: 'ins-healthcare-providers',
    name: 'Healthcare Providers',
    avatar_color: '#10b981',
    industry: 'Insurance',
    quick_description: 'Doctors, dentists, therapists, medical practices',
    key_traits: ['Patient-focused', 'Compliance-heavy', 'Risk-averse', 'Quality-driven'],
    demographics: {
      age_range: '30-65',
      income_range: '$200k-$2M+ (practice revenue)',
      location_type: 'Urban/Suburban',
    },
    pain_points: [
      'Skyrocketing malpractice insurance costs',
      'Complex compliance requirements (HIPAA, state regulations)',
      'Need specialized medical professional liability coverage',
      'Worried about career-ending malpractice claims',
    ],
    goals: [
      'Secure comprehensive malpractice protection',
      'Find carriers who understand medical specialties',
      'Minimize insurance costs without sacrificing coverage',
      'Protect practice assets and personal wealth',
    ],
  },
  {
    id: 'ins-growing-tech-companies',
    name: 'Growing Tech Companies',
    avatar_color: '#ec4899',
    industry: 'Insurance',
    quick_description: 'SaaS, software, tech startups scaling up',
    key_traits: ['Innovation-focused', 'Fast-paced', 'Data-conscious', 'Investor-backed'],
    demographics: {
      age_range: '28-45 (founders/CFOs)',
      income_range: '$500k-$10M+ (company revenue)',
      location_type: 'Tech hubs',
    },
    pain_points: [
      'Traditional insurance doesn\'t cover modern tech risks',
      'Need cyber liability, E&O, and tech-specific coverage',
      'Frustrated by carriers who don\'t understand SaaS/software',
      'Investors requiring specific insurance minimums',
    ],
    goals: [
      'Get comprehensive tech-specific insurance package',
      'Protect against cyber attacks and data breaches',
      'Meet investor and customer insurance requirements',
      'Scale coverage as company grows without hassle',
    ],
  },
]

/**
 * Get personas for a specific industry
 */
export const getPersonasForIndustry = (industry: string): CustomerPersona[] => {
  const normalized = industry.toLowerCase()

  // Insurance
  if (normalized.includes('insurance') || normalized.includes('brokerage') || normalized.includes('underwriting')) {
    return insurancePersonas
  }

  // Home Services
  if (normalized.includes('home') || normalized.includes('hvac') || normalized.includes('plumb') || normalized.includes('electric')) {
    return homeServicesPersonas
  }

  // Professional Services
  if (normalized.includes('professional') || normalized.includes('consulting') || normalized.includes('agency') || normalized.includes('b2b')) {
    return professionalServicesPersonas
  }

  // Retail/E-commerce
  if (normalized.includes('retail') || normalized.includes('ecommerce') || normalized.includes('e-commerce') || normalized.includes('shop')) {
    return retailEcommercePersonas
  }

  // Default to professional services for unknown industries
  console.warn(`[buyer-personas] No specific personas found for industry: "${industry}", defaulting to Professional Services`)
  return professionalServicesPersonas
}

/**
 * Get all personas across all industries
 */
export const getAllPersonas = (): CustomerPersona[] => {
  return [
    ...homeServicesPersonas,
    ...professionalServicesPersonas,
    ...retailEcommercePersonas,
    ...insurancePersonas,
  ]
}
