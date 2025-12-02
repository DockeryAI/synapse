/**
 * V5 Synapse Scorer Service
 *
 * Psychology-first content scoring with 6 dimensions.
 * Ports V1's proven scoring algorithm with V5's customer category awareness.
 *
 * 6 Scoring Dimensions:
 * 1. Power Words (20%) - Industry-specific language
 * 2. Emotional Triggers (25%) - Customer category alignment
 * 3. Readability (20%) - Flesch-Kincaid simplicity
 * 4. CTA (15%) - Call-to-action presence and strength
 * 5. Urgency (10%) - Time pressure elements
 * 6. Trust (10%) - Credibility signals
 *
 * Created: 2025-12-01
 */

import type {
  ContentScore,
  ScoreBreakdown,
  QualityTier,
  ScoringWeights,
  CustomerCategory,
  Platform,
  IndustryPsychology,
  ISynapseScorerService,
} from './types';

import {
  CUSTOMER_CATEGORY_MAPPINGS,
  DEFAULT_SCORING_WEIGHTS,
  QUALITY_THRESHOLDS,
} from './types';

// ============================================================================
// SCORING CONTEXT
// ============================================================================

export interface ScoringContext {
  industryPsychology: IndustryPsychology;
  customerCategory: CustomerCategory;
  platform: Platform;
  customWeights?: Partial<ScoringWeights>;
}

// ============================================================================
// POWER WORD ANALYZER
// ============================================================================

interface PowerWordResult {
  score: number;
  found: string[];
  total: number;
  percentage: number;
}

/**
 * Analyze content for industry power words
 */
export function analyzePowerWords(
  content: string,
  powerWords: string[]
): PowerWordResult {
  if (!powerWords || powerWords.length === 0) {
    return { score: 50, found: [], total: 0, percentage: 0 };
  }

  const contentLower = content.toLowerCase();
  const found: string[] = [];

  for (const word of powerWords) {
    const wordLower = word.toLowerCase();
    // Match whole word or phrase
    const regex = new RegExp(`\\b${escapeRegex(wordLower)}\\b`, 'i');
    if (regex.test(contentLower)) {
      found.push(word);
    }
  }

  const percentage = (found.length / powerWords.length) * 100;

  // Scoring curve: 5% match = 60, 10% = 75, 15% = 85, 20%+ = 95
  let score: number;
  if (percentage >= 20) {
    score = 95;
  } else if (percentage >= 15) {
    score = 85 + (percentage - 15) * 2;
  } else if (percentage >= 10) {
    score = 75 + (percentage - 10) * 2;
  } else if (percentage >= 5) {
    score = 60 + (percentage - 5) * 3;
  } else {
    score = percentage * 12;
  }

  return {
    score: Math.min(100, Math.round(score)),
    found,
    total: powerWords.length,
    percentage: Math.round(percentage * 10) / 10,
  };
}

// ============================================================================
// EMOTIONAL TRIGGER ANALYZER
// ============================================================================

interface EmotionalTriggerResult {
  score: number;
  triggersFound: string[];
  categoryAlignment: number;
  urgencyDetected: boolean;
}

/**
 * Analyze content for emotional triggers based on customer category
 */
export function analyzeEmotionalTriggers(
  content: string,
  customerCategory: CustomerCategory,
  psychology: IndustryPsychology
): EmotionalTriggerResult {
  const contentLower = content.toLowerCase();
  const triggersFound: string[] = [];

  // Category-specific trigger patterns
  const categoryTriggers: Record<CustomerCategory, string[]> = {
    'pain-driven': [
      'tired of', 'frustrated', 'struggling', 'problem', 'pain', 'stuck',
      'finally', 'solution', 'fix', 'stop', 'end', 'relief', 'escape',
    ],
    'aspiration-driven': [
      'transform', 'achieve', 'dream', 'goal', 'success', 'growth',
      'level up', 'unlock', 'become', 'future', 'vision', 'potential',
    ],
    'trust-seeking': [
      'proven', 'trusted', 'expert', 'years', 'experience', 'guarantee',
      'certified', 'professional', 'reliable', 'safe', 'secure',
    ],
    'convenience-driven': [
      'easy', 'simple', 'quick', 'fast', 'effortless', 'hassle-free',
      'step', 'just', 'only', 'instant', 'automatic', 'done for you',
    ],
    'value-driven': [
      'save', 'value', 'worth', 'invest', 'return', 'roi', 'cost',
      'free', 'bonus', 'included', 'get more', 'maximize',
    ],
    'community-driven': [
      'join', 'together', 'community', 'belong', 'share', 'connect',
      'family', 'tribe', 'group', 'team', 'us', 'we', 'our',
    ],
  };

  const targetTriggers = categoryTriggers[customerCategory] || [];

  // Check for category triggers
  for (const trigger of targetTriggers) {
    if (contentLower.includes(trigger.toLowerCase())) {
      triggersFound.push(trigger);
    }
  }

  // Check psychology customer triggers
  if (psychology.customerTriggers) {
    for (const trigger of psychology.customerTriggers) {
      const triggerLower = trigger.trigger.toLowerCase();
      if (contentLower.includes(triggerLower) && !triggersFound.includes(trigger.trigger)) {
        triggersFound.push(trigger.trigger);
      }
    }
  }

  // Calculate alignment score
  const minTriggersNeeded = 3;
  const optimalTriggers = 6;
  let categoryAlignment: number;

  if (triggersFound.length >= optimalTriggers) {
    categoryAlignment = 100;
  } else if (triggersFound.length >= minTriggersNeeded) {
    categoryAlignment = 70 + ((triggersFound.length - minTriggersNeeded) / (optimalTriggers - minTriggersNeeded)) * 30;
  } else {
    categoryAlignment = (triggersFound.length / minTriggersNeeded) * 70;
  }

  // Check for urgency signals
  const urgencyPatterns = [
    'now', 'today', 'limited', 'hurry', 'don\'t wait', 'act fast',
    'last chance', 'ending soon', 'only', 'before it\'s', 'while',
  ];
  const urgencyDetected = urgencyPatterns.some(p => contentLower.includes(p));

  // Boost score if urgency matches high-urgency category
  let score = categoryAlignment;
  if (urgencyDetected && (customerCategory === 'pain-driven' || customerCategory === 'aspiration-driven')) {
    score = Math.min(100, score + 10);
  }

  return {
    score: Math.round(score),
    triggersFound,
    categoryAlignment: Math.round(categoryAlignment),
    urgencyDetected,
  };
}

// ============================================================================
// READABILITY SCORER
// ============================================================================

interface ReadabilityResult {
  score: number;
  gradeLevel: number;
  sentenceCount: number;
  wordCount: number;
  avgWordsPerSentence: number;
}

/**
 * Calculate Flesch-Kincaid readability
 * Target: Grade 6-10 for social media
 */
export function analyzeReadability(content: string): ReadabilityResult {
  // Count sentences
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);

  // Count words
  const words = content.split(/\s+/).filter(w => w.length > 0);
  const wordCount = Math.max(1, words.length);

  // Count syllables (simplified)
  let syllableCount = 0;
  for (const word of words) {
    syllableCount += countSyllables(word);
  }

  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / wordCount;

  // Flesch-Kincaid Grade Level
  const gradeLevel = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
  const clampedGrade = Math.max(1, Math.min(20, gradeLevel));

  // Score: Optimal is grade 6-10 for social media
  let score: number;
  if (clampedGrade >= 6 && clampedGrade <= 10) {
    score = 95; // Perfect range
  } else if (clampedGrade >= 4 && clampedGrade <= 12) {
    // Acceptable range
    if (clampedGrade < 6) {
      score = 80 + (clampedGrade - 4) * 7.5;
    } else {
      score = 95 - (clampedGrade - 10) * 7.5;
    }
  } else if (clampedGrade < 4) {
    score = 60 + clampedGrade * 5; // Too simple
  } else {
    score = Math.max(40, 80 - (clampedGrade - 12) * 5); // Too complex
  }

  return {
    score: Math.round(Math.min(100, Math.max(0, score))),
    gradeLevel: Math.round(clampedGrade * 10) / 10,
    sentenceCount,
    wordCount,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
  };
}

/**
 * Count syllables in a word (simplified algorithm)
 */
function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;

  let count = 0;
  const vowels = 'aeiouy';
  let prevVowel = false;

  for (let i = 0; i < w.length; i++) {
    const isVowel = vowels.includes(w[i]);
    if (isVowel && !prevVowel) {
      count++;
    }
    prevVowel = isVowel;
  }

  // Adjustments
  if (w.endsWith('e')) count--;
  if (w.endsWith('le') && w.length > 2 && !vowels.includes(w[w.length - 3])) count++;

  return Math.max(1, count);
}

// ============================================================================
// CTA DETECTOR
// ============================================================================

interface CTAResult {
  score: number;
  ctaFound: boolean;
  ctaStrength: 'none' | 'weak' | 'medium' | 'strong';
  ctaText: string | null;
}

/**
 * Detect and score call-to-action
 */
export function analyzeCTA(content: string, platform: Platform): CTAResult {
  const contentLower = content.toLowerCase();

  // Strong CTAs
  const strongCTAs = [
    'book now', 'sign up', 'get started', 'buy now', 'order now',
    'claim your', 'reserve your', 'start your', 'grab your',
    'dm me', 'message us', 'call now', 'schedule', 'register',
  ];

  // Medium CTAs
  const mediumCTAs = [
    'click', 'tap', 'visit', 'check out', 'learn more', 'find out',
    'discover', 'explore', 'see how', 'try', 'download',
    'comment', 'share', 'tag', 'follow', 'subscribe',
  ];

  // Weak CTAs (engagement prompts)
  const weakCTAs = [
    'let me know', 'what do you think', 'thoughts', 'agree',
    'drop', 'tell me', 'save this', 'link in bio', 'info',
  ];

  // Check for CTAs
  let ctaText: string | null = null;
  let ctaStrength: 'none' | 'weak' | 'medium' | 'strong' = 'none';

  for (const cta of strongCTAs) {
    if (contentLower.includes(cta)) {
      ctaText = cta;
      ctaStrength = 'strong';
      break;
    }
  }

  if (!ctaText) {
    for (const cta of mediumCTAs) {
      if (contentLower.includes(cta)) {
        ctaText = cta;
        ctaStrength = 'medium';
        break;
      }
    }
  }

  if (!ctaText) {
    for (const cta of weakCTAs) {
      if (contentLower.includes(cta)) {
        ctaText = cta;
        ctaStrength = 'weak';
        break;
      }
    }
  }

  // Platform-specific scoring
  let score: number;
  switch (ctaStrength) {
    case 'strong':
      score = 95;
      break;
    case 'medium':
      score = 75;
      break;
    case 'weak':
      // Weak CTAs are fine for community content
      score = platform === 'twitter' || platform === 'tiktok' ? 70 : 55;
      break;
    default:
      // No CTA is acceptable for community/educational content
      score = 40;
  }

  return {
    score,
    ctaFound: ctaStrength !== 'none',
    ctaStrength,
    ctaText,
  };
}

// ============================================================================
// URGENCY ANALYZER
// ============================================================================

interface UrgencyResult {
  score: number;
  urgencyLevel: 'none' | 'low' | 'medium' | 'high';
  signals: string[];
}

/**
 * Analyze urgency signals in content
 */
export function analyzeUrgency(content: string): UrgencyResult {
  const contentLower = content.toLowerCase();
  const signals: string[] = [];

  // High urgency signals
  const highUrgency = [
    'last chance', 'ending today', 'only [0-9]+ left', 'limited spots',
    'act now', 'don\'t miss', 'expires', 'deadline', 'final',
  ];

  // Medium urgency signals
  const mediumUrgency = [
    'this week', 'this month', 'limited time', 'soon', 'hurry',
    'before it\'s gone', 'while supplies', 'special offer',
  ];

  // Low urgency signals
  const lowUrgency = [
    'now', 'today', 'available', 'open', 'ready', 'waiting',
  ];

  let urgencyLevel: 'none' | 'low' | 'medium' | 'high' = 'none';

  // Check high urgency
  for (const pattern of highUrgency) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(contentLower)) {
      signals.push(pattern);
      urgencyLevel = 'high';
    }
  }

  // Check medium urgency
  if (urgencyLevel !== 'high') {
    for (const pattern of mediumUrgency) {
      if (contentLower.includes(pattern)) {
        signals.push(pattern);
        if (urgencyLevel !== 'medium') urgencyLevel = 'medium';
      }
    }
  }

  // Check low urgency
  if (urgencyLevel === 'none') {
    for (const pattern of lowUrgency) {
      if (contentLower.includes(pattern)) {
        signals.push(pattern);
        urgencyLevel = 'low';
        break;
      }
    }
  }

  // Scoring
  let score: number;
  switch (urgencyLevel) {
    case 'high':
      score = 95;
      break;
    case 'medium':
      score = 75;
      break;
    case 'low':
      score = 55;
      break;
    default:
      score = 40;
  }

  return {
    score,
    urgencyLevel,
    signals,
  };
}

// ============================================================================
// TRUST ANALYZER
// ============================================================================

interface TrustResult {
  score: number;
  signals: string[];
  hasNumbers: boolean;
  hasCredentials: boolean;
}

/**
 * Analyze trust signals in content
 */
export function analyzeTrust(content: string): TrustResult {
  const contentLower = content.toLowerCase();
  const signals: string[] = [];

  // Credential signals
  const credentialPatterns = [
    'certified', 'licensed', 'award', 'recognized', 'accredited',
    'professional', 'expert', 'specialist', 'years of experience',
  ];

  // Social proof signals
  const proofPatterns = [
    'clients', 'customers', 'reviews', 'testimonial', 'case study',
    'results', 'success stor', 'helped', 'transformed',
  ];

  // Number patterns (specificity builds trust)
  const hasNumbers = /\d+/.test(content);
  const hasSpecificStats = /\d+%|\d+\+|\d+ (years|clients|customers|projects)/.test(content);

  let hasCredentials = false;

  // Check credentials
  for (const pattern of credentialPatterns) {
    if (contentLower.includes(pattern)) {
      signals.push(pattern);
      hasCredentials = true;
    }
  }

  // Check social proof
  for (const pattern of proofPatterns) {
    if (contentLower.includes(pattern)) {
      signals.push(pattern);
    }
  }

  // Calculate score
  let score = 50; // Base

  if (hasCredentials) score += 20;
  if (signals.length >= 3) score += 15;
  else if (signals.length >= 1) score += 10;
  if (hasSpecificStats) score += 15;
  else if (hasNumbers) score += 5;

  return {
    score: Math.min(100, score),
    signals,
    hasNumbers,
    hasCredentials,
  };
}

// ============================================================================
// HINT GENERATOR
// ============================================================================

/**
 * Generate actionable hints based on score breakdown
 */
export function generateHints(
  breakdown: ScoreBreakdown,
  psychology: IndustryPsychology,
  customerCategory: CustomerCategory
): string[] {
  const hints: string[] = [];

  // Power words hint
  if (breakdown.powerWords < 70) {
    const sampleWords = psychology.powerWords?.slice(0, 5).join(', ') || '';
    if (sampleWords) {
      hints.push(`Add industry power words: ${sampleWords}`);
    } else {
      hints.push('Include more industry-specific terminology');
    }
  }

  // Emotional triggers hint
  if (breakdown.emotionalTriggers < 70) {
    const categoryHints: Record<CustomerCategory, string> = {
      'pain-driven': 'Emphasize the pain point and relief ("tired of...", "finally...")',
      'aspiration-driven': 'Add transformation language ("become...", "achieve...")',
      'trust-seeking': 'Include credibility signals ("proven", "expert", specific numbers)',
      'convenience-driven': 'Highlight simplicity ("easy", "just 3 steps", "quick")',
      'value-driven': 'Show ROI and value ("save", "worth", specific outcomes)',
      'community-driven': 'Use inclusive language ("join us", "together", "community")',
    };
    hints.push(categoryHints[customerCategory]);
  }

  // Readability hint
  if (breakdown.readability < 70) {
    hints.push('Simplify sentences - aim for grade 6-10 reading level');
  }

  // CTA hint
  if (breakdown.cta < 60) {
    hints.push('Add a clear call-to-action ("DM me", "Book now", "Comment below")');
  }

  // Urgency hint
  if (breakdown.urgency < 50 && (customerCategory === 'pain-driven' || customerCategory === 'aspiration-driven')) {
    hints.push('Add urgency element ("limited", "this week", "before...")');
  }

  // Trust hint
  if (breakdown.trust < 60 && customerCategory === 'trust-seeking') {
    hints.push('Add credibility signals (numbers, credentials, social proof)');
  }

  // Limit to top 3 most actionable hints
  return hints.slice(0, 3);
}

// ============================================================================
// MAIN SCORER
// ============================================================================

/**
 * Score content across all 6 dimensions
 */
export function score(content: string, context: ScoringContext): ContentScore {
  const { industryPsychology, customerCategory, platform, customWeights } = context;

  // Get weights (category-specific or default)
  const categoryMapping = CUSTOMER_CATEGORY_MAPPINGS[customerCategory];
  const baseWeights = DEFAULT_SCORING_WEIGHTS;

  const weights: ScoringWeights = {
    ...baseWeights,
    ...categoryMapping?.scoringWeights,
    ...customWeights,
  };

  // Analyze each dimension
  const powerWordResult = analyzePowerWords(content, industryPsychology.powerWords || []);
  const emotionalResult = analyzeEmotionalTriggers(content, customerCategory, industryPsychology);
  const readabilityResult = analyzeReadability(content);
  const ctaResult = analyzeCTA(content, platform);
  const urgencyResult = analyzeUrgency(content);
  const trustResult = analyzeTrust(content);

  // Build breakdown
  const breakdown: ScoreBreakdown = {
    powerWords: powerWordResult.score,
    emotionalTriggers: emotionalResult.score,
    readability: readabilityResult.score,
    cta: ctaResult.score,
    urgency: urgencyResult.score,
    trust: trustResult.score,
  };

  // Calculate weighted total
  const total = Math.round(
    breakdown.powerWords * weights.powerWords +
    breakdown.emotionalTriggers * weights.emotionalTriggers +
    breakdown.readability * weights.readability +
    breakdown.cta * weights.cta +
    breakdown.urgency * weights.urgency +
    breakdown.trust * weights.trust
  );

  // Determine tier
  const thresholds = QUALITY_THRESHOLDS;
  let tier: QualityTier = 'poor';
  for (const [tierName, range] of Object.entries(thresholds) as [QualityTier, { min: number; max: number }][]) {
    if (total >= range.min && total <= range.max) {
      tier = tierName;
      break;
    }
  }

  // Generate hints if not passing
  const passed = total >= 75;
  const hints = passed ? [] : generateHints(breakdown, industryPsychology, customerCategory);

  return {
    total,
    breakdown,
    tier,
    passed,
    hints,
  };
}

/**
 * Synchronous score function (avoids dynamic imports)
 */
export function scoreSync(
  content: string,
  context: ScoringContext,
  weights: ScoringWeights = {
    powerWords: 0.20,
    emotionalTriggers: 0.25,
    readability: 0.20,
    cta: 0.15,
    urgency: 0.10,
    trust: 0.10,
  }
): ContentScore {
  const { industryPsychology, customerCategory, platform, customWeights } = context;

  // Merge weights
  const finalWeights: ScoringWeights = {
    ...weights,
    ...customWeights,
  };

  // Analyze each dimension
  const powerWordResult = analyzePowerWords(content, industryPsychology.powerWords || []);
  const emotionalResult = analyzeEmotionalTriggers(content, customerCategory, industryPsychology);
  const readabilityResult = analyzeReadability(content);
  const ctaResult = analyzeCTA(content, platform);
  const urgencyResult = analyzeUrgency(content);
  const trustResult = analyzeTrust(content);

  // Build breakdown
  const breakdown: ScoreBreakdown = {
    powerWords: powerWordResult.score,
    emotionalTriggers: emotionalResult.score,
    readability: readabilityResult.score,
    cta: ctaResult.score,
    urgency: urgencyResult.score,
    trust: trustResult.score,
  };

  // Calculate weighted total
  const total = Math.round(
    breakdown.powerWords * finalWeights.powerWords +
    breakdown.emotionalTriggers * finalWeights.emotionalTriggers +
    breakdown.readability * finalWeights.readability +
    breakdown.cta * finalWeights.cta +
    breakdown.urgency * finalWeights.urgency +
    breakdown.trust * finalWeights.trust
  );

  // Determine tier
  let tier: QualityTier;
  if (total >= 85) tier = 'excellent';
  else if (total >= 75) tier = 'great';
  else if (total >= 65) tier = 'good';
  else if (total >= 50) tier = 'fair';
  else tier = 'poor';

  // Generate hints if not passing
  const passed = total >= 75;
  const hints = passed ? [] : generateHints(breakdown, industryPsychology, customerCategory);

  return {
    total,
    breakdown,
    tier,
    passed,
    hints,
  };
}

// ============================================================================
// HELPER
// ============================================================================

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================================
// EXPORT SERVICE
// ============================================================================

export const synapseScorerService: ISynapseScorerService = {
  score: scoreSync,
  generateHints,
};

export default synapseScorerService;
