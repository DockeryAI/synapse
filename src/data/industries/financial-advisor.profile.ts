/**
 * FINANCIAL ADVISOR INDUSTRY PROFILE
 *
 * Psychology and messaging for financial advisors, planners, wealth managers
 */

import type { IndustryProfile } from '../../types/industry-profile.types';

export const FinancialAdvisorProfile: IndustryProfile = {
  id: 'financial-advisor',
  name: 'Financial Advisory & Wealth Management',
  naicsCode: '523930', // Investment Advice

  // Audience
  targetAudience: 'High-net-worth individuals, professionals, business owners, retirees planning for wealth preservation and growth',
  audienceCharacteristics: [
    'Highly educated and financially savvy',
    'Value discretion and privacy',
    'Research advisors extensively',
    'Need to build deep trust before committing',
    'Concerned about market volatility',
    'Want personalized service',
    'Long-term relationship mindset',
    'Prefer data-driven recommendations',
  ],

  // Pain Points
  commonPainPoints: [
    'Worried about retirement security',
    'Not confident in investment strategy',
    'Overwhelmed by financial complexity',
    'Concerned about market downturns',
    'Don\'t know if they\'re on track financially',
    'Tax burden too high',
    'Estate planning concerns',
    'College funding worries',
    'Want to leave a legacy',
    'Need better risk management',
    'Previous advisor didn\'t perform',
    'Lack of financial plan or clarity',
  ],

  // Buying Triggers
  commonBuyingTriggers: [
    'Major life event (marriage, divorce, birth, death)',
    'Inheritance or windfall received',
    'Job change or promotion with stock options',
    'Business sale or liquidity event',
    'Approaching retirement (5-10 years out)',
    'Market volatility causing concern',
    'Current advisor retiring or leaving',
    'Portfolio underperformance',
    'Tax bill shock or audit',
    'Estate planning needs for aging parents',
    'College admission for children',
    'Desire to retire early',
  ],

  // Trust Builders
  trustBuilders: [
    'CFP, CFA, or other recognized credentials',
    'Fiduciary commitment and fee transparency',
    'Years of market experience through cycles',
    'Client testimonials and referrals',
    'Educational content and thought leadership',
    'Clear investment philosophy',
    'Specialization in specific client needs',
    'Regulatory compliance and clean record',
    'Technology and reporting capabilities',
    'Holistic financial planning approach',
    'Accessibility and communication style',
  ],

  // Language Optimization
  powerWords: [
    // Security & Trust
    'secure', 'protect', 'preserve', 'fiduciary', 'trusted', 'confidence',
    // Growth & Planning
    'grow', 'plan', 'strategy', 'wealth', 'future', 'goals',
    // Expertise
    'experienced', 'certified', 'professional', 'expert', 'specialized', 'proven',
    // Value & Results
    'performance', 'returns', 'tax-efficient', 'optimized', 'personalized',
    // Peace of Mind
    'clarity', 'peace of mind', 'confident', 'prepared', 'on track',
    // Legacy & Purpose
    'legacy', 'values', 'impact', 'family', 'generations', 'purpose',
    // Process
    'comprehensive', 'holistic', 'strategic', 'disciplined', 'tailored',
  ],

  avoidWords: [
    'guaranteed returns', 'hot tip', 'get rich', 'beat the market',
    'risk-free', 'secret', 'insider', 'can\'t lose', 'sure thing',
  ],

  toneGuidelines: 'Professional, trustworthy, and reassuring. Be the calm voice of reason. Educate without condescension. Empathize with financial anxiety while instilling confidence. Data-driven yet personable.',

  // Content Strategy
  contentThemes: [
    'Market insights and economic commentary',
    'Retirement planning tips and strategies',
    'Tax-efficient investing strategies',
    'Estate planning and wealth transfer',
    'Investment philosophy and approach',
    'Client success stories (anonymized)',
    'Financial planning for life events',
    'Behavioral finance and investor psychology',
    'Risk management and asset allocation',
    'Education funding strategies',
    'Charitable giving and impact investing',
    'Market volatility and staying disciplined',
    'Common financial mistakes to avoid',
    'Industry trends and regulatory changes',
    'Financial literacy and education',
  ],

  postingFrequency: {
    optimal: 3, // 3 thoughtful posts per week
    minimum: 2,
    maximum: 5, // Quality and trust over quantity
  },

  // Timing
  bestPostingTimes: [
    { dayOfWeek: 'monday', hourOfDay: 7 }, // Early market open insights
    { dayOfWeek: 'tuesday', hourOfDay: 12 }, // Midday financial planning tips
    { dayOfWeek: 'wednesday', hourOfDay: 15 }, // Mid-week market updates
    { dayOfWeek: 'thursday', hourOfDay: 9 }, // Retirement planning content
    { dayOfWeek: 'friday', hourOfDay: 16 }, // Week in review / weekend reading
  ],

  // Psychology Profile (Hidden)
  psychologyProfile: {
    primaryTriggers: ['trust', 'achievement'],
    secondaryTriggers: ['fear', 'desire'],
    buyerJourneyStage: 'consideration', // Extremely long research phase
    decisionDrivers: [
      'Credentials and professional certifications',
      'Fiduciary standard and fee structure',
      'Investment philosophy alignment',
      'Years of experience through market cycles',
      'Client referrals and testimonials',
      'Specialized expertise in specific needs',
      'Communication style and accessibility',
      'Technology and reporting capabilities',
      'Personal rapport and cultural fit',
      'Track record and performance',
    ],
    urgencyLevel: 'low', // Very long sales cycle (often 6-12 months)
    trustImportance: 'high', // Highest trust industry - handling life savings
  },
};
