/**
 * SYNAPSE TYPES
 *
 * Internal psychology scoring engine types.
 * NEVER expose psychological terminology to users.
 * Users see: "Performance Score" or star ratings.
 * We track: Complex psychology underneath.
 */

// ============================================================================
// CORE SYNAPSE SCORING
// ============================================================================

/**
 * Main Synapse score (0-100)
 * Internal use only - users see star ratings
 */
export interface SynapseScore {
  overall: number; // 0-100 composite score
  powerWords: number; // 0-100 power word effectiveness
  emotionalTriggers: number; // 0-100 emotional impact
  readability: number; // 0-100 cognitive ease
  callToAction: number; // 0-100 CTA strength
  urgency: number; // 0-100 urgency level
  trust: number; // 0-100 trust signals

  // Hidden from users
  breakdown: SynapseBreakdown;
  suggestions?: string[]; // Internal improvement suggestions
}

/**
 * Detailed scoring breakdown
 * For internal analysis and optimization
 */
export interface SynapseBreakdown {
  powerWordCount: number;
  emotionalTriggerCount: number;
  sentenceComplexity: number;
  wordCount: number;
  averageWordLength: number;
  fleschReadingEase: number;

  // Psychology markers (internal)
  hasUrgency: boolean;
  hasSocialProof: boolean;
  hasAuthority: boolean;
  hasScarcity: boolean;
  hasReciprocity: boolean;
}

// ============================================================================
// POWER WORDS
// ============================================================================

export interface PowerWord {
  word: string;
  category: PowerWordCategory;
  intensity: number; // 1-10 scale
  emotionalImpact: 'positive' | 'negative' | 'neutral';
}

export type PowerWordCategory =
  | 'urgency'      // "now", "today", "limited"
  | 'exclusivity'  // "exclusive", "members-only", "VIP"
  | 'trust'        // "proven", "guaranteed", "certified"
  | 'emotion'      // "amazing", "devastating", "thrilling"
  | 'action'       // "discover", "unlock", "transform"
  | 'social'       // "popular", "trending", "loved"
  | 'authority';   // "expert", "professional", "leading"

export interface PowerWordAnalysis {
  totalCount: number;
  density: number; // Percentage of total words
  byCategory: Record<PowerWordCategory, number>;
  detectedWords: PowerWord[];
  score: number; // 0-100

  // Balance check (too many = spammy)
  isBalanced: boolean;
  warning?: string;
}

// ============================================================================
// EMOTIONAL TRIGGERS
// ============================================================================

export interface EmotionalTrigger {
  type: EmotionalTriggerType;
  text: string; // The actual text that triggered it
  intensity: number; // 1-10 scale
  position: number; // Character position in text
}

export type EmotionalTriggerType =
  | 'curiosity'     // "you won't believe", "secret to"
  | 'fear'          // "avoid", "mistake", "warning"
  | 'desire'        // "imagine", "dream", "achieve"
  | 'belonging'     // "join us", "community", "together"
  | 'achievement'   // "success", "victory", "accomplished"
  | 'trust'         // "honest", "transparent", "authentic"
  | 'urgency';      // "last chance", "running out", "limited"

export interface EmotionalTriggerAnalysis {
  triggers: EmotionalTrigger[];
  dominantEmotion: EmotionalTriggerType | null;
  emotionalBalance: Record<EmotionalTriggerType, number>;
  score: number; // 0-100

  // Journey position
  appropriateForStage?: 'awareness' | 'consideration' | 'decision';
}

// ============================================================================
// READABILITY
// ============================================================================

export interface ReadabilityScore {
  fleschReadingEase: number; // 0-100 (higher = easier)
  fleschKincaidGrade: number; // US grade level
  averageSentenceLength: number;
  averageWordLength: number;
  complexWordCount: number;

  // Simplified for users
  level: 'very-easy' | 'easy' | 'moderate' | 'difficult' | 'very-difficult';
  recommendation?: string;
  score: number; // 0-100
}

// ============================================================================
// CALL TO ACTION
// ============================================================================

export interface CallToActionAnalysis {
  hasCTA: boolean;
  ctaText?: string;
  ctaType?: CTAType;
  position: 'start' | 'middle' | 'end' | 'none';
  strength: number; // 0-100
  clarity: number; // 0-100

  suggestions?: string[];
}

export type CTAType =
  | 'soft'      // "Learn more", "Find out"
  | 'medium'    // "Get started", "Try now"
  | 'hard'      // "Buy now", "Book today"
  | 'social';   // "Share", "Follow", "Tag"

// ============================================================================
// CONTENT OPTIMIZATION
// ============================================================================

export interface ContentOptimizationRequest {
  content: string;
  targetScore: number; // Desired overall score
  preserveTone?: boolean;
  maxChanges?: number; // Limit how much we modify

  // Optional constraints
  constraints?: {
    maxLength?: number;
    requiredWords?: string[]; // Must keep these words
    forbiddenWords?: string[]; // Remove these
    targetReadabilityLevel?: ReadabilityScore['level'];
  };
}

export interface ContentOptimizationResult {
  original: string;
  optimized: string;
  improvements: OptimizationImprovement[];

  // Before/after scores
  scoreBefore: SynapseScore;
  scoreAfter: SynapseScore;

  // Change summary
  changesMade: number;
  significantChanges: boolean;
}

export interface OptimizationImprovement {
  type: 'power-word' | 'emotional-trigger' | 'readability' | 'cta' | 'structure';
  description: string;
  impact: number; // How much this improved the score
  position: number; // Where in the text
}

// ============================================================================
// SYNAPSE ENGINE CONFIG
// ============================================================================

export interface SynapseConfig {
  // Scoring weights (must sum to 100)
  weights: {
    powerWords: number;
    emotionalTriggers: number;
    readability: number;
    callToAction: number;
    urgency: number;
    trust: number;
  };

  // Thresholds
  thresholds: {
    excellent: number; // 85+
    good: number; // 70-84
    acceptable: number; // 50-69
    poor: number; // 0-49
  };

  // Power word limits
  powerWordDensity: {
    min: number; // 2%
    max: number; // 8% (above = spammy)
    optimal: number; // 4-5%
  };
}

// ============================================================================
// USER-FACING TYPES (SIMPLIFIED)
// ============================================================================

/**
 * What we actually show users
 * No psychology jargon - just clear performance indicators
 */
export interface ContentQualityIndicator {
  rating: 1 | 2 | 3 | 4 | 5; // Star rating
  label: 'Poor' | 'Fair' | 'Good' | 'Great' | 'Excellent';
  metrics: {
    engagement: 'low' | 'medium' | 'high';
    clarity: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
  };

  // Simple suggestions (no psychology terms)
  suggestions?: string[];
}

/**
 * Convert internal Synapse score to user-friendly indicator
 */
export function synapseToUserFacing(score: SynapseScore): ContentQualityIndicator {
  const overall = score.overall;

  let rating: 1 | 2 | 3 | 4 | 5;
  let label: ContentQualityIndicator['label'];

  if (overall >= 85) {
    rating = 5;
    label = 'Excellent';
  } else if (overall >= 70) {
    rating = 4;
    label = 'Great';
  } else if (overall >= 50) {
    rating = 3;
    label = 'Good';
  } else if (overall >= 30) {
    rating = 2;
    label = 'Fair';
  } else {
    rating = 1;
    label = 'Poor';
  }

  return {
    rating,
    label,
    metrics: {
      engagement: score.emotionalTriggers >= 70 ? 'high' : score.emotionalTriggers >= 40 ? 'medium' : 'low',
      clarity: score.readability >= 70 ? 'high' : score.readability >= 40 ? 'medium' : 'low',
      impact: score.callToAction >= 70 ? 'high' : score.callToAction >= 40 ? 'medium' : 'low',
    },
    suggestions: generateSimpleSuggestions(score),
  };
}

/**
 * Generate user-friendly suggestions (no psychology jargon)
 */
function generateSimpleSuggestions(score: SynapseScore): string[] {
  const suggestions: string[] = [];

  if (score.readability < 60) {
    suggestions.push('Try shorter sentences for better clarity');
  }

  if (score.callToAction < 60) {
    suggestions.push('Add a clear call-to-action');
  }

  if (score.emotionalTriggers < 50) {
    suggestions.push('Add more engaging language');
  }

  if (score.powerWords < 40) {
    suggestions.push('Use stronger, more compelling words');
  }

  return suggestions;
}
