/**
 * ThumbScrollTest - Thumb-Scroll Stopping Power Analysis
 *
 * Simulates the sacred art of thumb-scrolling and predicts if your content
 * can stop the endless dopamine-seeking scroll through social media
 *
 * Science? Maybe. Dark arts? Definitely.
 *
 * @author Roy (who's pretty sure this is how society ends)
 */

import {
  MobilePlatform,
  ThumbScrollMetrics,
  HeatmapPoint,
  ABTestVariant,
  SCROLL_SCORING_WEIGHTS,
  MINIMUM_SCORES,
} from '../../types/mobile.types';

interface ContentInput {
  text: string;
  hasVideo: boolean;
  hasImage: boolean;
  hasMotion: boolean;
  hasFaces: boolean;
  hasText: boolean;
  visualElements: {
    colorContrast: number; // 0-1
    brightness: number; // 0-1
    complexity: number; // 0-1 (simple to cluttered)
  };
  firstThreeSeconds?: {
    hasHook: boolean;
    hookText?: string;
    hookType?: 'question' | 'shock' | 'curiosity' | 'emotion' | 'value';
    hasMotion: boolean;
    hasAudio: boolean;
  };
  textReadability?: {
    fontSize: number;
    contrast: number;
    duration: number; // seconds text is on screen
  };
}

interface ScrollSimulation {
  scrollSpeed: number; // pixels per second
  attentionSpan: number; // seconds
  platform: MobilePlatform;
  deviceHeight: number; // viewport height
}

export class ThumbScrollTest {
  /**
   * Analyze content's thumb-scroll stopping power
   * Returns metrics, recommendations, and your content's fate
   */
  static analyze(
    content: ContentInput,
    platform: MobilePlatform = 'instagram'
  ): ThumbScrollMetrics {
    // Calculate individual component scores
    const hookStrength = this.analyzeHook(content);
    const visualAppeal = this.analyzeVisualAppeal(content, platform);
    const readability = this.analyzeReadability(content);

    // Calculate weighted stop score
    const stopScore = this.calculateStopScore(hookStrength, visualAppeal, readability);

    // Generate heatmap data (attention over time)
    const heatmapData = this.generateHeatmap(content, hookStrength, visualAppeal);

    // Generate recommendations if score is weak
    const recommendations = this.generateRecommendations(
      stopScore,
      hookStrength,
      visualAppeal,
      readability,
      platform
    );

    return {
      stopScore,
      hookStrength,
      visualAppeal,
      readability,
      recommendations,
      heatmapData,
    };
  }

  /**
   * Simulate auto-scroll behavior
   * Returns whether the scroll would stop (true = user stopped scrolling)
   */
  static simulateScroll(
    content: ContentInput,
    simulation: ScrollSimulation
  ): { stopped: boolean; stopTime?: number; reason?: string } {
    const metrics = this.analyze(content, simulation.platform);

    // Probability of stopping based on stop score
    const stopProbability = metrics.stopScore / 100;

    // Simulate scroll time before content leaves viewport
    const visibilityDuration = simulation.deviceHeight / simulation.scrollSpeed;

    // Check if content catches attention within visibility window
    if (visibilityDuration < 0.5) {
      // Scrolling too fast, content barely visible
      return { stopped: false, reason: 'Scrolled past too quickly' };
    }

    // Hook must catch attention in first 3 seconds
    const hookWindow = Math.min(3, visibilityDuration);
    const hookCatchesAttention = Math.random() < (metrics.hookStrength / 100);

    if (!hookCatchesAttention) {
      return { stopped: false, reason: 'Hook failed to catch attention' };
    }

    // Visual appeal must maintain attention
    const visualHoldsAttention = Math.random() < (metrics.visualAppeal / 100);

    if (!visualHoldsAttention) {
      const stopTime = Math.random() * hookWindow + 0.5;
      return { stopped: false, stopTime, reason: 'Lost interest after initial hook' };
    }

    // If we made it here, content stopped the scroll
    const stopTime = Math.random() * hookWindow + 0.3;
    return { stopped: true, stopTime, reason: 'Content successfully stopped scroll' };
  }

  /**
   * Run A/B test on different hooks
   * Returns performance comparison
   */
  static abTestHooks(
    baseContent: ContentInput,
    hooks: string[]
  ): ABTestVariant[] {
    const variants: ABTestVariant[] = [];

    hooks.forEach((hook, index) => {
      const testContent = { ...baseContent };
      if (testContent.firstThreeSeconds) {
        testContent.firstThreeSeconds.hookText = hook;
        testContent.firstThreeSeconds.hasHook = true;
      }

      const metrics = this.analyze(testContent);

      // Simulate impressions and stops
      const impressions = 1000;
      const stopRate = metrics.stopScore / 100;
      const stops = Math.round(impressions * stopRate);

      variants.push({
        id: `variant-${index}`,
        hook,
        stopScore: metrics.stopScore,
        impressions,
        stops,
        stopRate: stopRate * 100,
      });
    });

    // Sort by performance
    return variants.sort((a, b) => b.stopRate - a.stopRate);
  }

  // ============================================================================
  // ANALYSIS METHODS (where the magic/chaos happens)
  // ============================================================================

  private static analyzeHook(content: ContentInput): number {
    let score = 0;

    if (!content.firstThreeSeconds) {
      return 30; // No first 3 seconds data, assume mediocre
    }

    const { hasHook, hookText, hookType, hasMotion, hasAudio } = content.firstThreeSeconds;

    // Base score for having a hook
    if (hasHook) {
      score += 20;
    }

    // Hook type effectiveness (based on platform psychology research)
    const hookTypeScores = {
      question: 25, // "Did you know...?"
      shock: 30, // "This will blow your mind"
      curiosity: 28, // "Wait until you see..."
      emotion: 26, // "This made me cry"
      value: 23, // "Here's how to..."
    };

    if (hookType) {
      score += hookTypeScores[hookType];
    }

    // Hook text analysis
    if (hookText) {
      score += this.analyzeHookText(hookText);
    }

    // Motion in first 3 seconds is CRITICAL
    if (hasMotion) {
      score += 15;
    }

    // Audio adds engagement
    if (hasAudio) {
      score += 10;
    }

    return Math.min(100, score);
  }

  private static analyzeHookText(text: string): number {
    let score = 0;

    // Short and punchy is good (under 10 words)
    const wordCount = text.split(/\s+/).length;
    if (wordCount <= 10) {
      score += 10;
    } else if (wordCount <= 15) {
      score += 5;
    }

    // Numbers are engaging ("5 ways to...", "3 secrets...")
    if (/\d+/.test(text)) {
      score += 8;
    }

    // Questions drive engagement
    if (text.includes('?')) {
      score += 7;
    }

    // Power words (based on copywriting research)
    const powerWords = [
      'secret', 'proven', 'guaranteed', 'instant', 'easy',
      'simple', 'shocking', 'amazing', 'incredible', 'revolutionary',
      'exclusive', 'limited', 'free', 'new', 'discover'
    ];

    const lowerText = text.toLowerCase();
    const foundPowerWords = powerWords.filter(word => lowerText.includes(word));
    score += Math.min(15, foundPowerWords.length * 5);

    // All caps is aggressive but effective (use sparingly)
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio > 0.3 && capsRatio < 0.7) {
      score += 5;
    } else if (capsRatio >= 0.7) {
      score -= 5; // Too aggressive, looks like spam
    }

    return score;
  }

  private static analyzeVisualAppeal(
    content: ContentInput,
    platform: MobilePlatform
  ): number {
    let score = 0;

    // Video generally outperforms images (sad but true for static content creators)
    if (content.hasVideo) {
      score += 25;
    } else if (content.hasImage) {
      score += 15;
    } else {
      score += 5; // Text-only is rough
    }

    // Motion is king on mobile
    if (content.hasMotion) {
      score += 20;
    }

    // Faces increase engagement (humans are narcissistic)
    if (content.hasFaces) {
      score += 15;
    }

    // Visual elements scoring
    const { colorContrast, brightness, complexity } = content.visualElements;

    // High contrast stops scrolls
    score += colorContrast * 15;

    // Brightness (not too dark, not too bright)
    const brightnessScore = 1 - Math.abs(brightness - 0.6); // Optimal around 0.6
    score += brightnessScore * 10;

    // Complexity (simple is better for mobile)
    const complexityScore = 1 - complexity; // Lower complexity is better
    score += complexityScore * 15;

    // Platform-specific adjustments
    switch (platform) {
      case 'tiktok':
        // TikTok rewards motion and faces heavily
        if (content.hasMotion) score += 10;
        if (content.hasFaces) score += 10;
        break;
      case 'instagram':
        // Instagram is more aesthetic-focused
        score += colorContrast * 5;
        break;
      case 'facebook':
        // Facebook is more casual
        score += 5;
        break;
    }

    return Math.min(100, score);
  }

  private static analyzeReadability(content: ContentInput): number {
    let score = 50; // Base score

    if (!content.textReadability) {
      return score;
    }

    const { fontSize, contrast, duration } = content.textReadability;

    // Font size scoring (mobile-optimized)
    if (fontSize >= 36) {
      score += 20;
    } else if (fontSize >= 28) {
      score += 15;
    } else if (fontSize >= 24) {
      score += 10;
    } else {
      score -= 10; // Too small for mobile
    }

    // Contrast is critical for readability
    score += contrast * 20;

    // Duration (text needs to be visible long enough to read)
    const readingTime = content.text.split(/\s+/).length * 0.3; // ~300ms per word
    if (duration >= readingTime) {
      score += 15;
    } else {
      score -= Math.min(20, (readingTime - duration) * 5);
    }

    // Text overlay on video/image
    if (content.hasText && (content.hasVideo || content.hasImage)) {
      score += 10; // Reinforcement is good
    }

    return Math.max(0, Math.min(100, score));
  }

  private static calculateStopScore(
    hookStrength: number,
    visualAppeal: number,
    readability: number
  ): number {
    const score =
      hookStrength * SCROLL_SCORING_WEIGHTS.hookStrength +
      visualAppeal * SCROLL_SCORING_WEIGHTS.visualAppeal +
      readability * SCROLL_SCORING_WEIGHTS.readability;

    return Math.round(score);
  }

  private static generateHeatmap(
    content: ContentInput,
    hookStrength: number,
    visualAppeal: number
  ): HeatmapPoint[] {
    const points: HeatmapPoint[] = [];

    // Generate attention curve over 10 seconds
    for (let t = 0; t <= 10; t += 0.5) {
      // Hook impact peaks at 1.5 seconds
      const hookImpact = hookStrength / 100 * Math.exp(-Math.pow(t - 1.5, 2) / 2);

      // Visual appeal maintains throughout
      const visualImpact = visualAppeal / 100 * Math.exp(-t / 5);

      // Combined intensity
      const intensity = Math.min(1, hookImpact + visualImpact);

      // Random position (simulating eye tracking)
      points.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        intensity,
        timestamp: t * 1000,
      });
    }

    return points;
  }

  private static generateRecommendations(
    stopScore: number,
    hookStrength: number,
    visualAppeal: number,
    readability: number,
    platform: MobilePlatform
  ): string[] {
    const recommendations: string[] = [];

    // Overall score recommendations
    if (stopScore < MINIMUM_SCORES.stopScore) {
      recommendations.push(
        `⚠️ Overall stop score (${stopScore}) is below minimum ${MINIMUM_SCORES.stopScore}. High risk of being scrolled past.`
      );
    }

    // Hook recommendations
    if (hookStrength < MINIMUM_SCORES.hookStrength) {
      recommendations.push(
        `🎣 Hook strength (${hookStrength}) is weak. First 3 seconds are critical!`
      );
      recommendations.push(
        '💡 Add a strong hook: ask a question, create curiosity, or show immediate value'
      );
      recommendations.push(
        '💡 Use power words: "secret", "proven", "shocking", "exclusive"'
      );
      recommendations.push(
        '💡 Add motion or surprising visuals in the first frame'
      );
    }

    // Visual appeal recommendations
    if (visualAppeal < MINIMUM_SCORES.visualAppeal) {
      recommendations.push(
        `🎨 Visual appeal (${visualAppeal}) needs improvement`
      );

      if (platform === 'tiktok' || platform === 'instagram') {
        recommendations.push(
          '💡 Add motion - static images perform 60% worse on video platforms'
        );
        recommendations.push(
          '💡 Include faces - human faces increase engagement by 38%'
        );
      }

      recommendations.push(
        '💡 Increase color contrast - bold colors stop scrolls'
      );
      recommendations.push(
        '💡 Simplify visual composition - mobile screens are small'
      );
    }

    // Readability recommendations
    if (readability < MINIMUM_SCORES.readability) {
      recommendations.push(
        `📖 Readability (${readability}) is below acceptable level`
      );
      recommendations.push(
        '💡 Increase font size to at least 36px for mobile'
      );
      recommendations.push(
        '💡 Use high contrast text (white on dark or dark on light)'
      );
      recommendations.push(
        '💡 Keep text visible longer - users need time to read'
      );
    }

    // Platform-specific recommendations
    switch (platform) {
      case 'tiktok':
        if (!recommendations.length) {
          recommendations.push('✅ Content optimized for TikTok');
        }
        recommendations.push(
          '🎵 TikTok tip: Use trending audio for 30% better performance'
        );
        break;
      case 'instagram':
        if (!recommendations.length) {
          recommendations.push('✅ Content optimized for Instagram');
        }
        recommendations.push(
          '📸 Instagram tip: High aesthetic quality trumps raw authenticity'
        );
        break;
      case 'facebook':
        if (!recommendations.length) {
          recommendations.push('✅ Content optimized for Facebook');
        }
        recommendations.push(
          '👥 Facebook tip: Community and conversation drive engagement'
        );
        break;
    }

    return recommendations;
  }

  /**
   * Get passing grade assessment
   * Because everyone needs validation
   */
  static getGrade(score: number): { grade: string; emoji: string; message: string } {
    if (score >= 90) {
      return {
        grade: 'A+',
        emoji: '🔥',
        message: 'Viral potential! This will stop thumbs dead in their tracks.',
      };
    } else if (score >= 80) {
      return {
        grade: 'A',
        emoji: '✨',
        message: 'Excellent! High chance of stopping scrolls.',
      };
    } else if (score >= 70) {
      return {
        grade: 'B',
        emoji: '👍',
        message: 'Good! Will catch attention but has room for improvement.',
      };
    } else if (score >= 60) {
      return {
        grade: 'C',
        emoji: '😐',
        message: 'Mediocre. Might work but needs optimization.',
      };
    } else if (score >= 50) {
      return {
        grade: 'D',
        emoji: '😬',
        message: 'Poor. High risk of being scrolled past.',
      };
    } else {
      return {
        grade: 'F',
        emoji: '💀',
        message: 'Fail. Will be scrolled past faster than you can say "algorithm".',
      };
    }
  }
}

export default ThumbScrollTest;
