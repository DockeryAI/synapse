/**
 * Narrative Continuity Service
 *
 * Analyzes and enforces story coherence across multi-piece campaigns.
 * Ensures campaigns tell a cohesive story that builds toward conversion.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  DEFAULT_NARRATIVE_CONFIG,
  type CampaignPiece,
  type ContinuityReport,
  type NarrativeAnalysisConfig,
  type NarrativeAnalysisInput,
  type PieceScore,
  type Transition,
  type NarrativeSuggestion,
  type NarrativeArc,
  type EmotionalJourney,
  type CoherenceEnforcementResult,
} from '@/types/v2/narrative.types';

// Emotional tone intensity mappings
const TONE_INTENSITY: Record<string, number> = {
  empathetic: 40,
  curious: 50,
  hopeful: 60,
  confident: 70,
  authoritative: 75,
  urgent: 85,
};

// Expected emotional progressions for different arc types
const ARC_PROGRESSIONS: Record<string, string[]> = {
  'problem-solution': ['empathetic', 'curious', 'hopeful', 'confident', 'urgent'],
  'hero-journey': ['curious', 'empathetic', 'hopeful', 'confident', 'authoritative'],
  'before-after': ['empathetic', 'curious', 'hopeful', 'confident', 'authoritative'],
  'educational': ['curious', 'confident', 'authoritative', 'hopeful', 'urgent'],
  'trust-ladder': ['curious', 'empathetic', 'hopeful', 'confident', 'authoritative'],
  'urgency-build': ['curious', 'hopeful', 'confident', 'urgent', 'urgent'],
};

// Story beats for different arc types
const ARC_BEATS: Record<string, string[]> = {
  'problem-solution': ['Problem Identification', 'Pain Amplification', 'Solution Introduction', 'Proof Points', 'Call to Action'],
  'hero-journey': ['Status Quo', 'Challenge', 'Struggle', 'Transformation', 'New Normal'],
  'before-after': ['Before State', 'Trigger Event', 'Transition', 'After State', 'Social Proof'],
  'educational': ['Hook', 'Context', 'Key Insight', 'Application', 'Next Steps'],
  'trust-ladder': ['Introduction', 'Credibility', 'Value Demonstration', 'Social Proof', 'Commitment'],
  'urgency-build': ['Opportunity', 'Stakes', 'Scarcity', 'Fear of Missing Out', 'Immediate Action'],
};

class NarrativeContinuityService {
  /**
   * Main analysis method - analyzes narrative continuity across all pieces
   */
  analyzeNarrativeContinuity(input: NarrativeAnalysisInput): ContinuityReport {
    const config: NarrativeAnalysisConfig = {
      ...DEFAULT_NARRATIVE_CONFIG,
      ...input.config,
    };

    console.log(`[NarrativeContinuity] Analyzing ${input.pieces.length} pieces`);

    // Sort pieces by position
    const sortedPieces = [...input.pieces].sort((a, b) => a.position - b.position);

    // Score individual pieces
    const pieceScores = this.scorePieces(sortedPieces, config);

    // Generate transitions
    const transitions = this.generateTransitions(sortedPieces, config);

    // Calculate transition quality
    const transitionQuality = transitions.length > 0
      ? transitions.reduce((sum, t) => sum + t.quality, 0) / transitions.length
      : 100;

    // Analyze narrative arc
    const narrativeArc = this.analyzeNarrativeArc(sortedPieces, config);

    // Analyze emotional journey
    const emotionalJourney = this.analyzeEmotionalJourney(sortedPieces);

    // Calculate theme consistency
    const themeConsistency = this.calculateThemeConsistency(sortedPieces);

    // Generate improvement suggestions
    const suggestions = this.suggestImprovements(
      pieceScores,
      transitions,
      narrativeArc,
      emotionalJourney,
      themeConsistency
    );

    // Calculate overall score
    const overallScore = this.calculateOverallScore(
      pieceScores,
      transitionQuality,
      narrativeArc,
      themeConsistency.score,
      config
    );

    // Generate summary
    const summary = this.generateSummary(
      overallScore,
      pieceScores,
      transitions,
      narrativeArc,
      suggestions
    );

    console.log(`[NarrativeContinuity] Analysis complete. Score: ${overallScore}`);

    return {
      overallScore,
      pieceScores,
      transitions,
      transitionQuality,
      narrativeArc,
      emotionalJourney,
      suggestions,
      themeConsistency,
      summary,
    };
  }

  /**
   * Score individual pieces for narrative contribution
   */
  private scorePieces(pieces: CampaignPiece[], config: NarrativeAnalysisConfig): PieceScore[] {
    return pieces.map((piece, index) => {
      const prevPiece = index > 0 ? pieces[index - 1] : null;
      const nextPiece = index < pieces.length - 1 ? pieces[index + 1] : null;

      // Calculate continuity from previous piece
      const continuityScore = prevPiece
        ? this.calculateContinuity(prevPiece, piece)
        : 100;

      // Calculate setup for next piece
      const setupScore = nextPiece
        ? this.calculateSetup(piece, nextPiece)
        : 100;

      // Calculate theme consistency
      const allThemes = pieces.flatMap(p => p.themes);
      const commonThemes = this.findCommonThemes(allThemes);
      const themeConsistency = this.calculatePieceThemeConsistency(piece.themes, commonThemes);

      // Calculate emotional progression
      const emotionalProgression = this.calculateEmotionalProgression(pieces, index);

      // Identify issues
      const issues: string[] = [];
      if (continuityScore < 50) {
        issues.push(`Weak connection from previous piece`);
      }
      if (setupScore < 50) {
        issues.push(`Does not set up next piece well`);
      }
      if (themeConsistency < 50) {
        issues.push(`Theme drift from campaign focus`);
      }
      if (emotionalProgression < 50) {
        issues.push(`Emotional tone disrupts flow`);
      }

      const overallScore = Math.round(
        (continuityScore * 0.3 + setupScore * 0.2 + themeConsistency * 0.25 + emotionalProgression * 0.25)
      );

      return {
        pieceId: piece.id,
        position: piece.position,
        continuityScore,
        setupScore,
        themeConsistency,
        emotionalProgression,
        overallScore,
        issues,
      };
    });
  }

  /**
   * Generate transitions between consecutive pieces
   */
  generateTransitions(pieces: CampaignPiece[], config?: Partial<NarrativeAnalysisConfig>): Transition[] {
    const mergedConfig = { ...DEFAULT_NARRATIVE_CONFIG, ...config };
    const transitions: Transition[] = [];

    for (let i = 0; i < pieces.length - 1; i++) {
      const from = pieces[i];
      const to = pieces[i + 1];

      // Determine connection type
      const connectionType = this.determineConnectionType(from, to);

      // Calculate quality
      const quality = this.calculateTransitionQuality(from, to, connectionType);

      // Identify issues
      const issues: string[] = [];
      if (quality < 50) {
        issues.push(`Abrupt transition between pieces ${from.position} and ${to.position}`);
      }
      if (from.emotionalTone === to.emotionalTone && connectionType !== 'continuation') {
        issues.push(`Emotional flatline - consider varying tone`);
      }

      // Generate bridge text if configured
      let bridgeText: string | undefined;
      if (mergedConfig.generateBridges && quality < 70) {
        bridgeText = this.generateBridgeText(from, to, connectionType);
      }

      transitions.push({
        fromPieceId: from.id,
        toPieceId: to.id,
        fromPosition: from.position,
        toPosition: to.position,
        quality,
        connectionType,
        bridgeText,
        issues,
      });
    }

    return transitions;
  }

  /**
   * Enforce story coherence by suggesting/making changes
   */
  enforceStoryCoherence(
    pieces: CampaignPiece[],
    targetScore: number = 70
  ): CoherenceEnforcementResult {
    const changes: CoherenceEnforcementResult['changes'] = [];
    const remainingIssues: string[] = [];

    // First, analyze current state
    const analysis = this.analyzeNarrativeContinuity({ pieces });

    if (analysis.overallScore >= targetScore) {
      return {
        success: true,
        newScore: analysis.overallScore,
        changes: [],
        remainingIssues: [],
      };
    }

    // Identify critical issues
    const criticalSuggestions = analysis.suggestions.filter(s => s.priority === 'critical');

    // Apply fixes for critical issues
    for (const suggestion of criticalSuggestions) {
      if (suggestion.type === 'reorder') {
        changes.push({
          pieceId: suggestion.pieceIds[0],
          changeType: 'reordered',
          description: suggestion.suggestion,
        });
      } else if (suggestion.type === 'add_transition') {
        changes.push({
          pieceId: suggestion.pieceIds[0],
          changeType: 'transition_added',
          description: suggestion.suggestion,
        });
      } else if (suggestion.type === 'adjust_tone' || suggestion.type === 'rewrite') {
        changes.push({
          pieceId: suggestion.pieceIds[0],
          changeType: 'modified',
          description: suggestion.suggestion,
        });
      }
    }

    // Collect remaining issues from non-critical suggestions
    const remainingSuggestions = analysis.suggestions.filter(s => s.priority !== 'critical');
    for (const s of remainingSuggestions) {
      remainingIssues.push(s.issue);
    }

    // Estimate new score (would need actual re-analysis with modified pieces)
    const estimatedImprovement = criticalSuggestions.reduce(
      (sum, s) => sum + s.expectedImprovement,
      0
    );
    const newScore = Math.min(100, analysis.overallScore + estimatedImprovement);

    return {
      success: newScore >= targetScore,
      newScore,
      changes,
      remainingIssues,
    };
  }

  /**
   * Generate improvement suggestions based on analysis
   */
  suggestImprovements(
    pieceScores: PieceScore[],
    transitions: Transition[],
    narrativeArc: NarrativeArc,
    emotionalJourney: EmotionalJourney,
    themeConsistency: { commonThemes: string[]; score: number; orphanedThemes: string[] }
  ): NarrativeSuggestion[] {
    const suggestions: NarrativeSuggestion[] = [];

    // Check for weak piece scores
    for (const score of pieceScores) {
      if (score.overallScore < 50) {
        suggestions.push({
          id: uuidv4(),
          pieceIds: [score.pieceId],
          type: 'rewrite',
          priority: 'critical',
          issue: `Piece ${score.position} has low narrative score (${score.overallScore})`,
          suggestion: `Rewrite to strengthen connection to adjacent pieces and maintain theme consistency`,
          expectedImprovement: Math.round((70 - score.overallScore) * 0.3),
        });
      } else if (score.overallScore < 70) {
        suggestions.push({
          id: uuidv4(),
          pieceIds: [score.pieceId],
          type: 'strengthen_theme',
          priority: 'high',
          issue: `Piece ${score.position} could be stronger (${score.overallScore})`,
          suggestion: `Reinforce campaign themes: ${themeConsistency.commonThemes.slice(0, 3).join(', ')}`,
          expectedImprovement: Math.round((80 - score.overallScore) * 0.2),
        });
      }
    }

    // Check for weak transitions
    for (const transition of transitions) {
      if (transition.quality < 50) {
        suggestions.push({
          id: uuidv4(),
          pieceIds: [transition.fromPieceId, transition.toPieceId],
          type: 'add_transition',
          priority: 'critical',
          issue: `Weak transition between pieces ${transition.fromPosition} and ${transition.toPosition}`,
          suggestion: transition.bridgeText || `Add bridging content to connect these pieces`,
          expectedImprovement: 5,
        });
      }
    }

    // Check narrative arc adherence
    if (narrativeArc.arcAdherence < 60) {
      const missing = narrativeArc.missingElements.slice(0, 2);
      suggestions.push({
        id: uuidv4(),
        pieceIds: [],
        type: 'reorder',
        priority: 'high',
        issue: `Campaign doesn't follow ${narrativeArc.arcType} structure well (${narrativeArc.arcAdherence}%)`,
        suggestion: `Add or strengthen: ${missing.join(', ')}`,
        expectedImprovement: 10,
      });
    }

    // Check emotional journey
    if (!emotionalJourney.isSmooth) {
      for (const issue of emotionalJourney.issues) {
        suggestions.push({
          id: uuidv4(),
          pieceIds: [],
          type: 'adjust_tone',
          priority: 'medium',
          issue,
          suggestion: `Smooth emotional transitions to maintain audience engagement`,
          expectedImprovement: 5,
        });
      }
    }

    // Check for orphaned themes
    if (themeConsistency.orphanedThemes.length > 0) {
      suggestions.push({
        id: uuidv4(),
        pieceIds: [],
        type: 'strengthen_theme',
        priority: 'low',
        issue: `Themes appear only once: ${themeConsistency.orphanedThemes.slice(0, 3).join(', ')}`,
        suggestion: `Either reinforce these themes across multiple pieces or remove them`,
        expectedImprovement: 3,
      });
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return suggestions;
  }

  /**
   * Analyze the narrative arc of the campaign
   */
  private analyzeNarrativeArc(pieces: CampaignPiece[], config: NarrativeAnalysisConfig): NarrativeArc {
    // Detect arc type based on content types
    const arcType = config.targetArc || this.detectArcType(pieces);
    const expectedBeats = ARC_BEATS[arcType] || ARC_BEATS['problem-solution'];

    // Check for story beats
    const storyBeats = expectedBeats.map((beatName, index) => {
      const expectedPosition = Math.ceil((index + 1) * pieces.length / expectedBeats.length);
      const nearbyPieces = pieces.filter(p =>
        Math.abs(p.position - expectedPosition) <= 1
      );

      // Check if any nearby piece matches the beat
      const present = nearbyPieces.some(p =>
        this.pieceMatchesBeat(p, beatName, arcType)
      );

      const strength = present ? this.calculateBeatStrength(nearbyPieces, beatName, arcType) : 0;

      return {
        name: beatName,
        position: expectedPosition,
        present,
        strength,
      };
    });

    // Calculate adherence
    const presentBeats = storyBeats.filter(b => b.present).length;
    const arcAdherence = Math.round((presentBeats / storyBeats.length) * 100);

    // Identify missing elements
    const missingElements = storyBeats
      .filter(b => !b.present)
      .map(b => b.name);

    return {
      arcType,
      arcAdherence,
      storyBeats,
      missingElements,
    };
  }

  /**
   * Analyze emotional journey through campaign
   */
  private analyzeEmotionalJourney(pieces: CampaignPiece[]): EmotionalJourney {
    const progression = pieces.map(p => ({
      position: p.position,
      pieceId: p.id,
      tone: p.emotionalTone,
      intensity: TONE_INTENSITY[p.emotionalTone] || 50,
    }));

    const issues: string[] = [];
    const peaks: number[] = [];
    const valleys: number[] = [];

    // Find peaks and valleys
    for (let i = 1; i < progression.length - 1; i++) {
      const prev = progression[i - 1].intensity;
      const curr = progression[i].intensity;
      const next = progression[i + 1].intensity;

      if (curr > prev && curr > next) {
        peaks.push(i);
      }
      if (curr < prev && curr < next) {
        valleys.push(i);
      }
    }

    // Check for smoothness
    let isSmooth = true;
    for (let i = 1; i < progression.length; i++) {
      const diff = Math.abs(progression[i].intensity - progression[i - 1].intensity);
      if (diff > 30) {
        isSmooth = false;
        issues.push(`Abrupt emotional shift between pieces ${i} and ${i + 1} (${diff}pt jump)`);
      }
    }

    // Check for monotony
    const uniqueTones = new Set(pieces.map(p => p.emotionalTone));
    if (uniqueTones.size === 1 && pieces.length > 3) {
      isSmooth = false;
      issues.push(`Emotional flatline - same tone throughout entire campaign`);
    }

    // Check for proper climax
    if (peaks.length === 0 && pieces.length > 4) {
      issues.push(`No emotional peak detected - consider building to a climax`);
    }

    return {
      progression,
      isSmooth,
      peaks,
      valleys,
      issues,
    };
  }

  /**
   * Calculate theme consistency across campaign
   */
  private calculateThemeConsistency(pieces: CampaignPiece[]): {
    commonThemes: string[];
    score: number;
    orphanedThemes: string[];
  } {
    const allThemes = pieces.flatMap(p => p.themes);
    const themeCounts = new Map<string, number>();

    for (const theme of allThemes) {
      const normalized = theme.toLowerCase();
      themeCounts.set(normalized, (themeCounts.get(normalized) || 0) + 1);
    }

    const commonThemes = Array.from(themeCounts.entries())
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([theme]) => theme);

    const orphanedThemes = Array.from(themeCounts.entries())
      .filter(([, count]) => count === 1)
      .map(([theme]) => theme);

    // Calculate score based on theme coverage
    const piecesWithCommonThemes = pieces.filter(p =>
      p.themes.some(t => commonThemes.includes(t.toLowerCase()))
    ).length;

    const score = pieces.length > 0
      ? Math.round((piecesWithCommonThemes / pieces.length) * 100)
      : 0;

    return {
      commonThemes,
      score,
      orphanedThemes,
    };
  }

  /**
   * Calculate overall continuity score
   */
  private calculateOverallScore(
    pieceScores: PieceScore[],
    transitionQuality: number,
    narrativeArc: NarrativeArc,
    themeScore: number,
    config: NarrativeAnalysisConfig
  ): number {
    const avgPieceScore = pieceScores.length > 0
      ? pieceScores.reduce((sum, p) => sum + p.overallScore, 0) / pieceScores.length
      : 0;

    const score = (
      avgPieceScore * 0.3 +
      transitionQuality * 0.25 +
      narrativeArc.arcAdherence * 0.25 +
      themeScore * config.themeWeight / (config.themeWeight + config.emotionalWeight) * 0.2
    );

    return Math.round(score);
  }

  /**
   * Generate summary of analysis
   */
  private generateSummary(
    overallScore: number,
    pieceScores: PieceScore[],
    transitions: Transition[],
    narrativeArc: NarrativeArc,
    suggestions: NarrativeSuggestion[]
  ): ContinuityReport['summary'] {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Analyze strengths
    if (overallScore >= 80) {
      strengths.push('Strong overall narrative cohesion');
    }
    if (narrativeArc.arcAdherence >= 80) {
      strengths.push(`Clear ${narrativeArc.arcType} structure`);
    }
    const strongPieces = pieceScores.filter(p => p.overallScore >= 80);
    if (strongPieces.length > pieceScores.length / 2) {
      strengths.push('Majority of pieces are well-connected');
    }
    const goodTransitions = transitions.filter(t => t.quality >= 70);
    if (goodTransitions.length === transitions.length && transitions.length > 0) {
      strengths.push('Smooth transitions between all pieces');
    }

    // Analyze weaknesses
    const weakPieces = pieceScores.filter(p => p.overallScore < 60);
    if (weakPieces.length > 0) {
      weaknesses.push(`${weakPieces.length} piece(s) have weak narrative contribution`);
    }
    const poorTransitions = transitions.filter(t => t.quality < 50);
    if (poorTransitions.length > 0) {
      weaknesses.push(`${poorTransitions.length} transition(s) need improvement`);
    }
    if (narrativeArc.missingElements.length > 2) {
      weaknesses.push(`Missing key story elements: ${narrativeArc.missingElements.slice(0, 2).join(', ')}`);
    }
    const criticalSuggestions = suggestions.filter(s => s.priority === 'critical');
    if (criticalSuggestions.length > 0) {
      weaknesses.push(`${criticalSuggestions.length} critical issues need attention`);
    }

    // Determine verdict
    let verdict: 'excellent' | 'good' | 'needs-work' | 'poor';
    if (overallScore >= 85) {
      verdict = 'excellent';
    } else if (overallScore >= 70) {
      verdict = 'good';
    } else if (overallScore >= 50) {
      verdict = 'needs-work';
    } else {
      verdict = 'poor';
    }

    return {
      strengths,
      weaknesses,
      verdict,
    };
  }

  // Helper methods

  private calculateContinuity(from: CampaignPiece, to: CampaignPiece): number {
    let score = 50; // Base score

    // Theme overlap bonus
    const sharedThemes = from.themes.filter(t =>
      to.themes.map(x => x.toLowerCase()).includes(t.toLowerCase())
    );
    score += sharedThemes.length * 10;

    // Emotional progression bonus
    const fromIntensity = TONE_INTENSITY[from.emotionalTone] || 50;
    const toIntensity = TONE_INTENSITY[to.emotionalTone] || 50;
    const intensityDiff = Math.abs(toIntensity - fromIntensity);
    if (intensityDiff <= 15) {
      score += 15; // Smooth transition
    } else if (intensityDiff > 30) {
      score -= 15; // Abrupt change
    }

    // Content type flow bonus
    if (this.isNaturalTypeProgression(from.type, to.type)) {
      score += 15;
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculateSetup(current: CampaignPiece, next: CampaignPiece): number {
    let score = 50;

    // CTA pointing forward
    if (current.cta && current.cta.toLowerCase().includes('next')) {
      score += 20;
    }

    // Theme foreshadowing
    const foreshadowedThemes = current.themes.filter(t =>
      next.themes.map(x => x.toLowerCase()).includes(t.toLowerCase())
    );
    score += foreshadowedThemes.length * 10;

    // Natural progression
    if (this.isNaturalTypeProgression(current.type, next.type)) {
      score += 20;
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculatePieceThemeConsistency(pieceThemes: string[], commonThemes: string[]): number {
    if (commonThemes.length === 0) return 100;

    const matches = pieceThemes.filter(t =>
      commonThemes.includes(t.toLowerCase())
    ).length;

    return Math.round((matches / Math.max(1, pieceThemes.length)) * 100);
  }

  private calculateEmotionalProgression(pieces: CampaignPiece[], index: number): number {
    if (pieces.length < 3) return 80;

    const current = pieces[index];
    const currentIntensity = TONE_INTENSITY[current.emotionalTone] || 50;

    // Check if intensity follows expected pattern
    const avgIntensityBefore = index > 0
      ? pieces.slice(0, index).reduce((sum, p) => sum + (TONE_INTENSITY[p.emotionalTone] || 50), 0) / index
      : 0;

    const avgIntensityAfter = index < pieces.length - 1
      ? pieces.slice(index + 1).reduce((sum, p) => sum + (TONE_INTENSITY[p.emotionalTone] || 50), 0) / (pieces.length - index - 1)
      : 100;

    // Generally expect intensity to build toward end
    if (index < pieces.length / 2 && currentIntensity > avgIntensityAfter) {
      return 60; // Peaked too early
    }

    if (index > pieces.length / 2 && currentIntensity < avgIntensityBefore - 20) {
      return 50; // Dropped off too much
    }

    return 80;
  }

  private determineConnectionType(from: CampaignPiece, to: CampaignPiece): Transition['connectionType'] {
    const fromIntensity = TONE_INTENSITY[from.emotionalTone] || 50;
    const toIntensity = TONE_INTENSITY[to.emotionalTone] || 50;

    if (Math.abs(fromIntensity - toIntensity) <= 10) {
      return 'continuation';
    }
    if (toIntensity > fromIntensity + 15) {
      return 'escalation';
    }
    if (from.type !== to.type) {
      return 'pivot';
    }
    if (to.themes.some(t => from.themes.includes(t))) {
      return 'callback';
    }
    if (to.type === 'cta' || to.type === 'offer') {
      return 'resolution';
    }

    return 'continuation';
  }

  private calculateTransitionQuality(
    from: CampaignPiece,
    to: CampaignPiece,
    connectionType: Transition['connectionType']
  ): number {
    let score = 60;

    // Connection type appropriateness
    const typeFlow = {
      awareness: ['education', 'story'],
      education: ['proof', 'story', 'engagement'],
      proof: ['offer', 'cta', 'engagement'],
      story: ['proof', 'engagement', 'cta'],
      engagement: ['proof', 'offer'],
      offer: ['cta'],
      cta: [],
    };

    if (typeFlow[from.type]?.includes(to.type)) {
      score += 20;
    }

    // Theme connection
    const sharedThemes = from.themes.filter(t =>
      to.themes.map(x => x.toLowerCase()).includes(t.toLowerCase())
    );
    score += Math.min(20, sharedThemes.length * 10);

    // Escalation should increase intensity
    if (connectionType === 'escalation') {
      const fromIntensity = TONE_INTENSITY[from.emotionalTone] || 50;
      const toIntensity = TONE_INTENSITY[to.emotionalTone] || 50;
      if (toIntensity > fromIntensity) {
        score += 10;
      } else {
        score -= 10;
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  private generateBridgeText(
    from: CampaignPiece,
    to: CampaignPiece,
    connectionType: Transition['connectionType']
  ): string {
    const bridges: Record<string, string> = {
      continuation: `Building on this, let's explore ${to.themes[0] || 'the next step'}...`,
      escalation: `Now that you understand this, here's why it matters even more...`,
      pivot: `With that foundation, let's shift to ${to.themes[0] || 'another crucial aspect'}...`,
      callback: `Remember when we discussed ${from.themes[0] || 'this'}? Here's how it connects...`,
      resolution: `Now it's time to take action on what you've learned...`,
    };

    return bridges[connectionType] || bridges.continuation;
  }

  private findCommonThemes(allThemes: string[]): string[] {
    const themeCounts = new Map<string, number>();
    for (const theme of allThemes) {
      const normalized = theme.toLowerCase();
      themeCounts.set(normalized, (themeCounts.get(normalized) || 0) + 1);
    }

    return Array.from(themeCounts.entries())
      .filter(([, count]) => count >= 2)
      .map(([theme]) => theme);
  }

  private detectArcType(pieces: CampaignPiece[]): NarrativeArc['arcType'] {
    const types = pieces.map(p => p.type);

    // Check patterns
    if (types.includes('awareness') && types.includes('offer')) {
      return 'problem-solution';
    }
    if (types.filter(t => t === 'story').length >= 2) {
      return 'hero-journey';
    }
    if (types.filter(t => t === 'proof').length >= 2) {
      return 'trust-ladder';
    }
    if (types.filter(t => t === 'education').length >= 3) {
      return 'educational';
    }
    if (pieces.some(p => p.emotionalTone === 'urgent')) {
      return 'urgency-build';
    }

    return 'problem-solution'; // Default
  }

  private pieceMatchesBeat(piece: CampaignPiece, beatName: string, arcType: string): boolean {
    const beatMatches: Record<string, (p: CampaignPiece) => boolean> = {
      'Problem Identification': p => p.type === 'awareness' || p.emotionalTone === 'empathetic',
      'Pain Amplification': p => p.type === 'awareness' || p.emotionalTone === 'urgent',
      'Solution Introduction': p => p.type === 'education' || p.type === 'story',
      'Proof Points': p => p.type === 'proof',
      'Call to Action': p => p.type === 'cta' || p.type === 'offer',
      'Hook': p => p.position === 1 || p.type === 'awareness',
      'Context': p => p.type === 'education',
      'Key Insight': p => p.type === 'education' || p.type === 'story',
      'Application': p => p.type === 'proof' || p.type === 'engagement',
      'Next Steps': p => p.type === 'cta',
    };

    const matcher = beatMatches[beatName];
    return matcher ? matcher(piece) : false;
  }

  private calculateBeatStrength(pieces: CampaignPiece[], beatName: string, arcType: string): number {
    // Simple strength calculation based on piece quality signals
    let strength = 60;

    for (const piece of pieces) {
      if (piece.themes.length > 0) strength += 10;
      if (piece.cta) strength += 10;
      if (piece.content.length > 100) strength += 10;
    }

    return Math.min(100, strength);
  }

  private isNaturalTypeProgression(from: CampaignPiece['type'], to: CampaignPiece['type']): boolean {
    const naturalFlows: Record<string, string[]> = {
      awareness: ['education', 'story', 'engagement'],
      education: ['proof', 'story', 'engagement'],
      story: ['proof', 'engagement', 'cta'],
      proof: ['offer', 'cta', 'engagement'],
      engagement: ['proof', 'offer'],
      offer: ['cta'],
      cta: [],
    };

    return naturalFlows[from]?.includes(to) || false;
  }
}

export const narrativeContinuityService = new NarrativeContinuityService();
