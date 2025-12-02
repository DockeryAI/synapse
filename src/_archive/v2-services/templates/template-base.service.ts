/**
 * Base class for all content templates
 * Provides abstract generate() and performance prediction functionality
 */

export interface TemplateInput {
  topic: string;
  industry?: string;
  targetAudience?: string;
  tone?: 'professional' | 'casual' | 'authoritative' | 'friendly' | 'urgent';
  platform?: 'linkedin' | 'twitter' | 'instagram' | 'facebook' | 'blog' | 'email';
  customVariables?: Record<string, string>;
}

export interface TemplateSection {
  name: string;
  content: string;
  placeholder?: string;
}

export interface PerformancePrediction {
  ctrImprovement: number; // Percentage improvement (27-52%)
  engagementLift: number; // Expected engagement increase
  conversionPotential: 'low' | 'medium' | 'high' | 'very-high';
  bestPlatforms: string[];
  optimalPostingTimes: string[];
  confidenceScore: number; // 0-100
}

export interface GeneratedContent {
  title: string;
  hook: string;
  body: string;
  cta: string;
  sections: TemplateSection[];
  hashtags: string[];
  performance: PerformancePrediction;
  templateType: string;
  templateCategory: string;
}

export interface TemplateMetadata {
  id: string;
  name: string;
  category: 'hook' | 'problem-solution' | 'story' | 'educational' | 'urgency' | 'authority' | 'engagement';
  description: string;
  structure: string[];
  bestFor: string[];
  avgCtrImprovement: number;
  psychologicalTriggers: string[];
}

export abstract class ContentTemplateBase {
  abstract readonly metadata: TemplateMetadata;

  /**
   * Generate content using this template
   */
  abstract generate(input: TemplateInput): GeneratedContent;

  /**
   * Predict performance based on template type and input characteristics
   */
  predictPerformance(input: TemplateInput): PerformancePrediction {
    const baseImprovement = this.metadata.avgCtrImprovement;

    // Adjust based on platform
    let platformMultiplier = 1.0;
    const platformPerformance: Record<string, number> = {
      linkedin: 1.15,
      twitter: 1.0,
      instagram: 1.1,
      facebook: 1.05,
      blog: 0.95,
      email: 1.2,
    };
    platformMultiplier = platformPerformance[input.platform || 'blog'] || 1.0;

    // Adjust based on tone matching
    let toneMultiplier = 1.0;
    if (this.isToneOptimal(input.tone)) {
      toneMultiplier = 1.1;
    }

    const adjustedCtr = Math.round(baseImprovement * platformMultiplier * toneMultiplier);
    const engagementLift = Math.round(adjustedCtr * 0.8);

    return {
      ctrImprovement: Math.min(52, Math.max(27, adjustedCtr)),
      engagementLift: engagementLift,
      conversionPotential: this.calculateConversionPotential(adjustedCtr),
      bestPlatforms: this.getBestPlatforms(),
      optimalPostingTimes: this.getOptimalPostingTimes(input.platform),
      confidenceScore: this.calculateConfidence(input),
    };
  }

  /**
   * Check if the provided tone is optimal for this template
   */
  protected isToneOptimal(tone?: string): boolean {
    const optimalTones = this.getOptimalTones();
    return tone ? optimalTones.includes(tone) : false;
  }

  /**
   * Get optimal tones for this template type
   */
  protected abstract getOptimalTones(): string[];

  /**
   * Get best platforms for this template
   */
  protected abstract getBestPlatforms(): string[];

  /**
   * Get optimal posting times based on platform
   */
  protected getOptimalPostingTimes(platform?: string): string[] {
    const platformTimes: Record<string, string[]> = {
      linkedin: ['Tuesday 8-10 AM', 'Wednesday 8-10 AM', 'Thursday 8-10 AM'],
      twitter: ['Monday 9 AM', 'Wednesday 12 PM', 'Friday 3 PM'],
      instagram: ['Monday 11 AM', 'Tuesday 11 AM', 'Wednesday 11 AM'],
      facebook: ['Wednesday 11 AM', 'Thursday 1-2 PM', 'Friday 1-2 PM'],
      blog: ['Tuesday 10 AM', 'Thursday 10 AM'],
      email: ['Tuesday 10 AM', 'Thursday 2 PM'],
    };
    return platformTimes[platform || 'blog'] || ['Weekday mornings'];
  }

  /**
   * Calculate conversion potential based on CTR improvement
   */
  protected calculateConversionPotential(ctr: number): 'low' | 'medium' | 'high' | 'very-high' {
    if (ctr >= 45) return 'very-high';
    if (ctr >= 38) return 'high';
    if (ctr >= 32) return 'medium';
    return 'low';
  }

  /**
   * Calculate confidence score based on input completeness
   */
  protected calculateConfidence(input: TemplateInput): number {
    let score = 50; // Base confidence
    if (input.topic) score += 15;
    if (input.industry) score += 10;
    if (input.targetAudience) score += 10;
    if (input.tone) score += 8;
    if (input.platform) score += 7;
    return Math.min(100, score);
  }

  /**
   * Generate hashtags based on topic and industry
   */
  protected generateHashtags(input: TemplateInput): string[] {
    const hashtags: string[] = [];

    // Topic-based hashtags
    if (input.topic) {
      const topicWords = input.topic.toLowerCase().split(' ').slice(0, 3);
      topicWords.forEach(word => {
        if (word.length > 3) {
          hashtags.push(`#${word.replace(/[^a-z0-9]/g, '')}`);
        }
      });
    }

    // Industry hashtags
    if (input.industry) {
      hashtags.push(`#${input.industry.toLowerCase().replace(/\s+/g, '')}`);
    }

    // Template-specific hashtags
    hashtags.push(...this.getTemplateSpecificHashtags());

    return [...new Set(hashtags)].slice(0, 5);
  }

  /**
   * Get template-specific hashtags
   */
  protected abstract getTemplateSpecificHashtags(): string[];

  /**
   * Format content for specific platform
   */
  protected formatForPlatform(content: string, platform?: string): string {
    if (!platform) return content;

    const maxLengths: Record<string, number> = {
      twitter: 280,
      instagram: 2200,
      linkedin: 3000,
      facebook: 63206,
      blog: Infinity,
      email: Infinity,
    };

    const maxLength = maxLengths[platform] || Infinity;
    if (content.length > maxLength) {
      return content.substring(0, maxLength - 3) + '...';
    }
    return content;
  }

  /**
   * Create a section object
   */
  protected createSection(name: string, content: string, placeholder?: string): TemplateSection {
    return { name, content, placeholder };
  }
}
