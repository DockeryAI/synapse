/**
 * Emotional Quotient (EQ) Calculator for Industries
 *
 * Uses Brandock's industry profile data to determine emotional weighting
 * Based on customer triggers, transformations, and pain/aspiration keywords
 */

import { supabase } from '@/lib/supabase'

export interface IndustryEQ {
  industry: string
  emotional_weight: number // 0-100 (0 = purely rational, 100 = purely emotional)
  decision_drivers: {
    fear: number      // Fear of loss, FOMO, security concerns
    aspiration: number // Dreams, status, lifestyle improvement
    trust: number     // Relationship, reputation, reliability
    urgency: number   // Time pressure, immediate needs
    logic: number     // ROI, efficiency, measurable outcomes
  }
  jtbd_focus: 'functional' | 'emotional' | 'social' // Primary job type
  purchase_mindset: string // How customers think when buying
  urgency_score: number // Average urgency from customer triggers
}

/**
 * Industry EQ Database
 * Based on research into purchasing behavior across industries
 */
export const INDUSTRY_EQ_MAP: Record<string, IndustryEQ> = {
  'Real Estate': {
    industry: 'Real Estate',
    emotional_weight: 85,
    decision_drivers: {
      fear: 30,      // Fear of missing out, market timing
      aspiration: 35, // Dream home, lifestyle upgrade
      trust: 25,     // Agent relationship critical
      urgency: 8,    // Market pressure
      logic: 2       // Some financial consideration
    },
    jtbd_focus: 'emotional',
    purchase_mindset: 'Buying a home is buying a future, a lifestyle, and security for loved ones'
  },

  'Healthcare': {
    industry: 'Healthcare',
    emotional_weight: 75,
    decision_drivers: {
      fear: 40,      // Health anxiety, fear of illness
      aspiration: 10, // Better quality of life
      trust: 35,     // Provider trust essential
      urgency: 10,   // Health issues urgent
      logic: 5       // Some cost/benefit analysis
    },
    jtbd_focus: 'emotional',
    purchase_mindset: 'Seeking peace of mind, relief from suffering, and hope for better health'
  },

  'Financial Services': {
    industry: 'Financial Services',
    emotional_weight: 65,
    decision_drivers: {
      fear: 35,      // Fear of loss, financial insecurity
      aspiration: 20, // Wealth goals, retirement dreams
      trust: 20,     // Advisor credibility
      urgency: 5,    // Some time-sensitive opportunities
      logic: 20      // ROI and performance metrics
    },
    jtbd_focus: 'emotional',
    purchase_mindset: 'Protecting what matters most and building a secure future'
  },

  'Technology': {
    industry: 'Technology',
    emotional_weight: 35,
    decision_drivers: {
      fear: 10,      // Fear of falling behind
      aspiration: 15, // Innovation, competitive edge
      trust: 10,     // Vendor reliability
      urgency: 5,    // Some deadlines
      logic: 60      // Features, performance, ROI
    },
    jtbd_focus: 'functional',
    purchase_mindset: 'Solving specific problems efficiently and staying competitive'
  },

  'IT Services': {
    industry: 'IT Services',
    emotional_weight: 40,
    decision_drivers: {
      fear: 20,      // Fear of downtime, security breaches
      aspiration: 10, // Digital transformation goals
      trust: 25,     // Provider expertise critical
      urgency: 15,   // System issues need quick resolution
      logic: 30      // Cost-effectiveness, capabilities
    },
    jtbd_focus: 'functional',
    purchase_mindset: 'Ensuring reliable technology operations and enabling business growth'
  },

  'Information Technology': {
    industry: 'Information Technology',
    emotional_weight: 40,
    decision_drivers: {
      fear: 20,      // Fear of outages, data loss
      aspiration: 10, // Innovation goals
      trust: 25,     // Vendor trust essential
      urgency: 15,   // Critical systems
      logic: 30      // Technical specs, ROI
    },
    jtbd_focus: 'functional',
    purchase_mindset: 'Maintaining operational excellence and driving digital innovation'
  },

  'B2B Software': {
    industry: 'B2B Software',
    emotional_weight: 25,
    decision_drivers: {
      fear: 5,       // Risk of wrong choice
      aspiration: 10, // Business growth
      trust: 15,     // Vendor stability
      urgency: 5,    // Implementation timelines
      logic: 65      // ROI, features, integration
    },
    jtbd_focus: 'functional',
    purchase_mindset: 'Improving operations and delivering measurable business outcomes'
  },

  'Retail': {
    industry: 'Retail',
    emotional_weight: 60,
    decision_drivers: {
      fear: 10,      // Missing deals
      aspiration: 30, // Lifestyle, self-expression
      trust: 15,     // Brand loyalty
      urgency: 20,   // Sales, limited availability
      logic: 25      // Price, value, features
    },
    jtbd_focus: 'social',
    purchase_mindset: 'Expressing identity and improving daily life'
  },

  'Automotive': {
    industry: 'Automotive',
    emotional_weight: 70,
    decision_drivers: {
      fear: 15,      // Safety concerns
      aspiration: 35, // Status, lifestyle
      trust: 20,     // Brand reliability
      urgency: 10,   // Deal timing
      logic: 20      // Features, fuel economy
    },
    jtbd_focus: 'social',
    purchase_mindset: 'Buying freedom, status, and an extension of personality'
  },

  'Education': {
    industry: 'Education',
    emotional_weight: 80,
    decision_drivers: {
      fear: 25,      // Fear of falling behind
      aspiration: 40, // Future success, dreams
      trust: 20,     // Institution reputation
      urgency: 10,   // Application deadlines
      logic: 5       // Some ROI consideration
    },
    jtbd_focus: 'emotional',
    purchase_mindset: 'Investing in potential and opening doors to opportunity'
  },

  'Fashion': {
    industry: 'Fashion',
    emotional_weight: 90,
    decision_drivers: {
      fear: 5,       // Fear of looking bad
      aspiration: 45, // Self-expression, looking good
      trust: 10,     // Brand authenticity
      urgency: 15,   // Trends, seasons
      logic: 5       // Price considerations
    },
    jtbd_focus: 'social',
    purchase_mindset: 'Expressing who I am and feeling confident in how I look'
  },

  'Clothing': {
    industry: 'Clothing',
    emotional_weight: 85,
    decision_drivers: {
      fear: 5,       // Fashion mistakes
      aspiration: 40, // Looking good, feeling good
      trust: 15,     // Quality, brand trust
      urgency: 10,   // Seasonal needs
      logic: 10      // Practicality, durability
    },
    jtbd_focus: 'social',
    purchase_mindset: 'Looking good, feeling confident, and expressing personal style'
  },

  'Apparel': {
    industry: 'Apparel',
    emotional_weight: 85,
    decision_drivers: {
      fear: 5,       // Fashion faux pas
      aspiration: 40, // Style goals, confidence
      trust: 15,     // Brand loyalty
      urgency: 10,   // Seasonal, events
      logic: 10      // Value, versatility
    },
    jtbd_focus: 'social',
    purchase_mindset: 'Curating a wardrobe that makes me feel amazing'
  },

  'Restaurants': {
    industry: 'Restaurants',
    emotional_weight: 80,
    decision_drivers: {
      fear: 5,       // Bad experience
      aspiration: 35, // Experience, enjoyment
      trust: 20,     // Reviews, reputation
      urgency: 15,   // Hunger, occasion
      logic: 5       // Price/value
    },
    jtbd_focus: 'emotional',
    purchase_mindset: 'Creating memorable experiences and enjoying life\'s pleasures'
  },

  'Food & Beverage': {
    industry: 'Food & Beverage',
    emotional_weight: 75,
    decision_drivers: {
      fear: 10,      // Health concerns
      aspiration: 30, // Enjoyment, indulgence
      trust: 20,     // Quality, safety
      urgency: 20,   // Cravings, convenience
      logic: 10      // Nutrition, value
    },
    jtbd_focus: 'emotional',
    purchase_mindset: 'Satisfying cravings and enjoying life\'s simple pleasures'
  },

  'Bars & Nightlife': {
    industry: 'Bars & Nightlife',
    emotional_weight: 90,
    decision_drivers: {
      fear: 5,       // Missing out
      aspiration: 45, // Fun, social connection
      trust: 10,     // Venue reputation
      urgency: 20,   // Weekend, events
      logic: 5       // Cover charge, drink prices
    },
    jtbd_focus: 'social',
    purchase_mindset: 'Escaping routine, connecting with friends, and creating memories'
  },

  'Entertainment': {
    industry: 'Entertainment',
    emotional_weight: 85,
    decision_drivers: {
      fear: 10,      // Missing out, boredom
      aspiration: 40, // Enjoyment, escape
      trust: 15,     // Reviews, recommendations
      urgency: 20,   // Limited time, events
      logic: 5       // Ticket price
    },
    jtbd_focus: 'emotional',
    purchase_mindset: 'Escaping reality and experiencing joy'
  },

  'Beauty & Cosmetics': {
    industry: 'Beauty & Cosmetics',
    emotional_weight: 85,
    decision_drivers: {
      fear: 10,      // Skin problems, aging
      aspiration: 40, // Looking beautiful, confidence
      trust: 20,     // Ingredients, brand
      urgency: 10,   // Events, occasions
      logic: 10      // Results, value
    },
    jtbd_focus: 'social',
    purchase_mindset: 'Enhancing natural beauty and feeling confident'
  },

  'Wellness & Spa': {
    industry: 'Wellness & Spa',
    emotional_weight: 85,
    decision_drivers: {
      fear: 15,      // Stress, burnout
      aspiration: 35, // Relaxation, self-care
      trust: 25,     // Practitioner expertise
      urgency: 10,   // Stress relief needed
      logic: 5       // Treatment benefits
    },
    jtbd_focus: 'emotional',
    purchase_mindset: 'Investing in self-care and finding peace'
  },

  'default': {
    industry: 'General',
    emotional_weight: 50,
    decision_drivers: {
      fear: 20,
      aspiration: 20,
      trust: 20,
      urgency: 10,
      logic: 30
    },
    jtbd_focus: 'functional',
    purchase_mindset: 'Solving problems and improving outcomes'
  }
}

/**
 * Calculate EQ from Brandock industry profile data
 */
export async function calculateEQFromBrandockData(naicsCode?: string): Promise<IndustryEQ> {
  if (!naicsCode) {
    return INDUSTRY_EQ_MAP['default']
  }

  try {
    // Fetch industry profile from database
    const { data: profile } = await supabase
      .from('industry_profiles')
      .select('title, full_profile_data')
      .eq('naics_code', naicsCode)
      .single()

    if (!profile?.full_profile_data) {
      return INDUSTRY_EQ_MAP['default']
    }

    const fullData = profile.full_profile_data

    // Calculate urgency from customer triggers
    let avgUrgency = 5
    if (fullData.customer_triggers?.length > 0) {
      const urgencies = fullData.customer_triggers
        .map((t: any) => t.urgency || 5)
        .filter((u: number) => u > 0)
      avgUrgency = urgencies.reduce((a: number, b: number) => a + b, 0) / urgencies.length
    }

    // Analyze emotional keywords
    const painKeywords = fullData.customer_language_dictionary?.pain_keywords || []
    const aspirationKeywords = fullData.customer_language_dictionary?.aspiration_keywords || []

    // Count emotional vs rational keywords
    const emotionalPainWords = ['frustrated', 'overwhelmed', 'anxious', 'worried', 'stressed', 'afraid', 'desperate']
    const rationalPainWords = ['expensive', 'inefficient', 'slow', 'complex', 'unreliable', 'outdated']

    const emotionalPainCount = painKeywords.filter((w: string) =>
      emotionalPainWords.some(ew => w.toLowerCase().includes(ew))
    ).length

    const rationalPainCount = painKeywords.filter((w: string) =>
      rationalPainWords.some(rw => w.toLowerCase().includes(rw))
    ).length

    // Analyze transformations for emotional payoff
    const transformations = fullData.transformations || []
    const hasEmotionalPayoffs = transformations.some((t: any) =>
      t.emotional_payoff && ['confidence', 'pride', 'peace', 'relief', 'joy'].some(e =>
        t.emotional_payoff.toLowerCase().includes(e)
      )
    )

    // Calculate emotional weight based on data
    const urgencyWeight = (avgUrgency / 10) * 30 // 0-30 points from urgency
    const emotionalKeywordWeight = (emotionalPainCount / (emotionalPainCount + rationalPainCount + 1)) * 40 // 0-40 points
    const transformationWeight = hasEmotionalPayoffs ? 30 : 10 // 10-30 points

    const emotional_weight = Math.round(urgencyWeight + emotionalKeywordWeight + transformationWeight)

    // Determine JTBD focus
    let jtbd_focus: 'functional' | 'emotional' | 'social' = 'functional'
    if (emotional_weight > 70) {
      jtbd_focus = 'emotional'
    } else if (emotional_weight > 50 && aspirationKeywords.some((k: string) =>
      ['status', 'prestige', 'image', 'reputation'].some(s => k.toLowerCase().includes(s))
    )) {
      jtbd_focus = 'social'
    }

    // Build purchase mindset from transformations
    let purchase_mindset = 'Solving problems and improving outcomes'
    if (transformations.length > 0 && transformations[0].after) {
      purchase_mindset = `Achieving ${transformations[0].after}`
    }

    return {
      industry: profile.title,
      emotional_weight,
      decision_drivers: {
        fear: emotionalPainCount > rationalPainCount ? 35 : 15,
        aspiration: aspirationKeywords.length > 10 ? 30 : 15,
        trust: 20, // Default, could analyze trust signals
        urgency: avgUrgency > 7 ? 25 : 10,
        logic: rationalPainCount > emotionalPainCount ? 40 : 15
      },
      jtbd_focus,
      purchase_mindset,
      urgency_score: avgUrgency
    }
  } catch (error) {
    console.error('[EQ Calculator] Error fetching profile:', error)
    return INDUSTRY_EQ_MAP['default']
  }
}

/**
 * Get emotional quotient for an industry (with Brandock data fallback)
 */
export async function getIndustryEQ(industry: string, naicsCode?: string): Promise<IndustryEQ> {
  // First try to calculate from Brandock data if we have NAICS code
  if (naicsCode) {
    const brandockEQ = await calculateEQFromBrandockData(naicsCode)
    if (brandockEQ.industry !== 'General') {
      console.log('[EQ Calculator] Using Brandock-calculated EQ:', brandockEQ)
      return brandockEQ
    }
  }

  // Fall back to predefined mappings
  return INDUSTRY_EQ_MAP[industry] || INDUSTRY_EQ_MAP['default']
}

/**
 * Generate JTBD-focused prompts based on industry EQ
 */
export function getJTBDPrompts(industry: string): {
  problem_prompt: string
  solution_prompt: string
  benefit_prompt: string
} {
  const eq = getIndustryEQ(industry)

  if (eq.emotional_weight > 70) {
    // Highly emotional industries
    return {
      problem_prompt: `What deep emotional pain or unfulfilled desire keeps your ${industry} customers awake at night? What are they REALLY trying to achieve in their life?`,
      solution_prompt: `How do you help them become who they want to be? What transformation do you enable?`,
      benefit_prompt: `What will they FEEL when this problem is solved? How will their life be different?`
    }
  } else if (eq.emotional_weight > 40) {
    // Mixed emotional/rational
    return {
      problem_prompt: `What critical challenge is preventing your customers from achieving their goals? What job are they really trying to get done?`,
      solution_prompt: `How do you uniquely solve this in a way that matters to them?`,
      benefit_prompt: `What specific outcome or transformation will they experience?`
    }
  } else {
    // Highly rational industries
    return {
      problem_prompt: `What specific operational or performance problem costs your customers time or money?`,
      solution_prompt: `What is your unique approach to solving this problem efficiently?`,
      benefit_prompt: `What measurable improvements will they see? (time saved, cost reduced, efficiency gained)`
    }
  }
}

/**
 * Adjust suggestion generation based on emotional quotient
 */
export function adjustSuggestionPrompt(basePrompt: string, industry: string, step: string): string {
  const eq = getIndustryEQ(industry)

  let adjustedPrompt = basePrompt

  // Add JTBD context based on emotional weight
  if (eq.jtbd_focus === 'emotional') {
    adjustedPrompt += `\n\nFocus on deep emotional drivers: ${eq.purchase_mindset}.`
    adjustedPrompt += `\nEmphasize feelings, transformations, and life changes.`
    adjustedPrompt += `\nUse language that connects with fears (${eq.decision_drivers.fear}%) and aspirations (${eq.decision_drivers.aspiration}%).`
  } else if (eq.jtbd_focus === 'social') {
    adjustedPrompt += `\n\nFocus on social and identity aspects: ${eq.purchase_mindset}.`
    adjustedPrompt += `\nEmphasize status, belonging, and self-expression.`
  } else {
    adjustedPrompt += `\n\nFocus on functional outcomes: ${eq.purchase_mindset}.`
    adjustedPrompt += `\nEmphasize measurable results, efficiency, and ROI.`
  }

  // Add specific guidance for problem identification
  if (step === 'customer-problem') {
    if (eq.emotional_weight > 70) {
      adjustedPrompt += `\n\nFrame problems as emotional struggles, unmet desires, or life obstacles that create real pain.`
      adjustedPrompt += `\nThink about what they're REALLY buying beyond the obvious solution.`
    } else {
      adjustedPrompt += `\n\nFrame problems as specific obstacles to achieving business or personal goals.`
    }
  }

  return adjustedPrompt
}

/**
 * Transform a standard question to be more JTBD-centric based on industry
 */
export function makeQuestionJTBD(originalQuestion: string, industry: string, step: string): string {
  const eq = getIndustryEQ(industry)

  const jtbdQuestions: Record<string, Record<string, string>> = {
    'customer-problem': {
      'emotional': `What deep frustration or unfulfilled desire drives your ${industry} customers to seek change? What job are they really hiring you to do in their life?`,
      'social': `What identity or status challenge are your customers trying to overcome? How do they want to be perceived?`,
      'functional': `What specific task or outcome are your customers struggling to achieve? What's blocking their progress?`
    },
    'unique-solution': {
      'emotional': `How do you uniquely help customers achieve the transformation they seek? What emotional journey do you guide them through?`,
      'social': `How do you help customers become the person they want to be seen as? What social outcome do you enable?`,
      'functional': `What's your unique method or approach to getting the job done better than alternatives?`
    },
    'key-benefit': {
      'emotional': `What will customers FEEL when you solve this for them? How will their life be transformed?`,
      'social': `How will this change how others see them? What new identity will they claim?`,
      'functional': `What measurable outcome or specific result will customers achieve?`
    }
  }

  return jtbdQuestions[step]?.[eq.jtbd_focus] || originalQuestion
}