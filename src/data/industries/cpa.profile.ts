/**
 * CPA (CERTIFIED PUBLIC ACCOUNTANT) INDUSTRY PROFILE
 *
 * Psychology and messaging for accountants, bookkeepers, tax professionals
 */

import type { IndustryProfile } from '../../types/industry-profile.types';

export const CPAProfile: IndustryProfile = {
  id: 'cpa',
  name: 'Accounting & Tax Services',
  naicsCode: '541211', // Offices of Certified Public Accountants

  // Audience
  targetAudience: 'Small business owners, self-employed professionals, families with complex taxes',
  audienceCharacteristics: [
    'Stressed about taxes and compliance',
    'Need help but don\'t know where to start',
    'Value expertise over price',
    'Looking for peace of mind',
    'Research-heavy decision makers',
    'Prefer long-term relationships',
  ],

  // Pain Points
  commonPainPoints: [
    'Fear of IRS audits and penalties',
    'Confusion about deductions',
    'Not knowing if they\'re paying too much tax',
    'Bookkeeping overwhelm',
    'Tax deadline stress',
    'Lack of financial clarity',
    'Making costly mistakes',
    'Not understanding financial statements',
    'Business entity choice confusion',
    'Quarterly tax payment uncertainty',
  ],

  // Buying Triggers
  commonBuyingTriggers: [
    'Tax season approaching (January - April)',
    'Received IRS notice or audit letter',
    'Starting or incorporating a new business',
    'Significant life event (marriage, divorce, inheritance)',
    'Business revenue milestone reached ($100K+)',
    'Year-end tax planning window (October - December)',
    'Quarterly estimated tax payment deadlines',
    'Preparing to sell business or major asset',
    'Previous accountant retired or relationship ended',
    'Expansion into new state or international operations',
    'Employee hiring triggering payroll tax obligations',
    'Received large unexpected income or windfall',
  ],

  // Trust Builders
  trustBuilders: [
    'CPA credentials and certifications',
    'Years of experience',
    'Client success stories',
    'Proactive advice (not just reactive)',
    'IRS representation experience',
    'Industry-specific expertise',
    'Clear communication in plain English',
    'Responsiveness and availability',
    'Educational content that helps',
    'Professional affiliations',
  ],

  // Language Optimization
  powerWords: [
    // Trust & authority
    'certified', 'expert', 'experienced', 'trusted', 'professional', 'qualified',
    // Value
    'save', 'maximize', 'optimize', 'protect', 'strategic', 'proactive',
    // Problem solving
    'solution', 'clarity', 'guidance', 'support', 'help', 'simplified',
    // Results
    'accurate', 'compliant', 'confident', 'secure', 'peace of mind',
    // Action
    'plan', 'prepare', 'avoid', 'discover', 'ensure',
    // Specificity
    'deductions', 'refund', 'savings', 'compliance', 'strategy',
  ],

  avoidWords: [
    'cheap', 'discount', 'quick', 'easy money', 'tricks',
    'loopholes', 'sketchy', 'aggressive', 'risky', 'questionable',
  ],

  toneGuidelines: 'Professional yet approachable. Be the calm expert in a stressful situation. Educate without talking down. Inspire confidence, not fear.',

  // Content Strategy
  contentThemes: [
    'Tax deadline reminders and tips',
    'Common deduction opportunities',
    'Year-end tax planning strategies',
    'Small business tax tips',
    'Financial clarity and education',
    'Client success stories (anonymized)',
    'Tax law changes and updates',
    'IRS notice guidance',
    'Business structure advice',
    'Quarterly tax planning',
    'Retirement planning basics',
    'Meet the team/expertise',
    'Common tax mistakes to avoid',
    'Industry-specific tax tips',
  ],

  postingFrequency: {
    optimal: 3, // 3 posts per week
    minimum: 2,
    maximum: 5, // Don't overwhelm
  },

  // Timing
  bestPostingTimes: [
    { dayOfWeek: 'monday', hourOfDay: 9 }, // Start of work week
    { dayOfWeek: 'tuesday', hourOfDay: 13 }, // Post-lunch business time
    { dayOfWeek: 'wednesday', hourOfDay: 10 }, // Mid-week
    { dayOfWeek: 'thursday', hourOfDay: 14 }, // Business decision time
    { dayOfWeek: 'friday', hourOfDay: 9 }, // Friday morning planning
  ],

  // Psychology Profile (Hidden)
  psychologyProfile: {
    primaryTriggers: ['trust', 'fear', 'achievement'],
    secondaryTriggers: ['curiosity', 'desire'],
    buyerJourneyStage: 'consideration', // Long research phase
    decisionDrivers: [
      'Credentials and expertise',
      'Trust and rapport',
      'Proactive communication',
      'Industry specialization',
      'Responsiveness',
      'Clear explanations',
      'Track record of results',
    ],
    urgencyLevel: 'medium', // High around tax deadlines, lower otherwise
    trustImportance: 'high', // Critical - they're trusting you with sensitive data
  },
};
