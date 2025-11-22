/**
 * Narrative Continuity Types
 *
 * Types for analyzing and enforcing story coherence across
 * multi-piece campaigns.
 */

/**
 * A single piece of content in a campaign
 */
export interface CampaignPiece {
  id: string;
  /** Position in the campaign sequence (1-based) */
  position: number;
  /** Title or headline */
  title: string;
  /** Main content body */
  content: string;
  /** Content type/format */
  type: 'awareness' | 'education' | 'proof' | 'offer' | 'cta' | 'story' | 'engagement';
  /** Emotional tone target */
  emotionalTone: 'hopeful' | 'urgent' | 'curious' | 'confident' | 'empathetic' | 'authoritative';
  /** Key themes/topics */
  themes: string[];
  /** Call to action if any */
  cta?: string;
  /** Platform target */
  platform?: string;
  /** Scheduled date */
  scheduledDate?: Date;
}

/**
 * Score for an individual piece's contribution to narrative
 */
export interface PieceScore {
  pieceId: string;
  position: number;
  /** How well this piece continues from the previous (0-100) */
  continuityScore: number;
  /** How well this piece sets up the next (0-100) */
  setupScore: number;
  /** Theme consistency with overall campaign (0-100) */
  themeConsistency: number;
  /** Emotional arc progression score (0-100) */
  emotionalProgression: number;
  /** Overall piece score (0-100) */
  overallScore: number;
  /** Issues identified with this piece */
  issues: string[];
}

/**
 * Transition between two consecutive pieces
 */
export interface Transition {
  fromPieceId: string;
  toPieceId: string;
  fromPosition: number;
  toPosition: number;
  /** Quality score of the transition (0-100) */
  quality: number;
  /** Type of narrative connection */
  connectionType: 'continuation' | 'escalation' | 'pivot' | 'callback' | 'resolution';
  /** Suggested bridge text */
  bridgeText?: string;
  /** Issues with this transition */
  issues: string[];
}

/**
 * Suggestion for improving narrative continuity
 */
export interface NarrativeSuggestion {
  id: string;
  /** Which piece(s) this applies to */
  pieceIds: string[];
  /** Type of suggestion */
  type: 'reorder' | 'rewrite' | 'add_transition' | 'adjust_tone' | 'add_callback' | 'strengthen_theme';
  /** Priority level */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** Description of the issue */
  issue: string;
  /** Suggested fix */
  suggestion: string;
  /** Expected improvement in continuity score */
  expectedImprovement: number;
}

/**
 * Overall narrative arc analysis
 */
export interface NarrativeArc {
  /** Type of story arc detected */
  arcType: 'problem-solution' | 'hero-journey' | 'before-after' | 'educational' | 'trust-ladder' | 'urgency-build';
  /** How well the campaign follows this arc (0-100) */
  arcAdherence: number;
  /** Key story beats identified */
  storyBeats: Array<{
    name: string;
    position: number;
    present: boolean;
    strength: number;
  }>;
  /** Missing story elements */
  missingElements: string[];
}

/**
 * Emotional journey through the campaign
 */
export interface EmotionalJourney {
  /** Progression of emotional states */
  progression: Array<{
    position: number;
    pieceId: string;
    tone: string;
    intensity: number; // 0-100
  }>;
  /** Whether emotional progression is smooth */
  isSmooth: boolean;
  /** Emotional peaks */
  peaks: number[];
  /** Emotional valleys */
  valleys: number[];
  /** Issues with emotional flow */
  issues: string[];
}

/**
 * Complete continuity report for a campaign
 */
export interface ContinuityReport {
  /** Overall narrative continuity score (0-100) */
  overallScore: number;
  /** Individual piece scores */
  pieceScores: PieceScore[];
  /** Transition quality between pieces */
  transitions: Transition[];
  /** Average transition quality */
  transitionQuality: number;
  /** Narrative arc analysis */
  narrativeArc: NarrativeArc;
  /** Emotional journey analysis */
  emotionalJourney: EmotionalJourney;
  /** Improvement suggestions */
  suggestions: NarrativeSuggestion[];
  /** Theme consistency across campaign */
  themeConsistency: {
    commonThemes: string[];
    score: number;
    orphanedThemes: string[];
  };
  /** Summary assessment */
  summary: {
    strengths: string[];
    weaknesses: string[];
    verdict: 'excellent' | 'good' | 'needs-work' | 'poor';
  };
}

/**
 * Configuration for narrative analysis
 */
export interface NarrativeAnalysisConfig {
  /** Minimum acceptable continuity score */
  minContinuityScore: number;
  /** Minimum acceptable transition quality */
  minTransitionQuality: number;
  /** Weight for theme consistency in scoring */
  themeWeight: number;
  /** Weight for emotional progression in scoring */
  emotionalWeight: number;
  /** Whether to generate bridge text suggestions */
  generateBridges: boolean;
  /** Target narrative arc type */
  targetArc?: NarrativeArc['arcType'];
}

/**
 * Default configuration
 */
export const DEFAULT_NARRATIVE_CONFIG: NarrativeAnalysisConfig = {
  minContinuityScore: 70,
  minTransitionQuality: 60,
  themeWeight: 0.3,
  emotionalWeight: 0.3,
  generateBridges: true,
};

/**
 * Input for narrative analysis
 */
export interface NarrativeAnalysisInput {
  /** Campaign pieces to analyze */
  pieces: CampaignPiece[];
  /** Campaign metadata */
  campaignId?: string;
  campaignType?: string;
  /** Configuration overrides */
  config?: Partial<NarrativeAnalysisConfig>;
}

/**
 * Result of story coherence enforcement
 */
export interface CoherenceEnforcementResult {
  /** Whether coherence was achieved */
  success: boolean;
  /** New score after enforcement */
  newScore: number;
  /** Changes made */
  changes: Array<{
    pieceId: string;
    changeType: 'reordered' | 'modified' | 'transition_added';
    description: string;
  }>;
  /** Remaining issues */
  remainingIssues: string[];
}
