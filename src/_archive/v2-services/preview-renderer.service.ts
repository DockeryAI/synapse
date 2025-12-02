/**
 * PreviewRendererService - Platform-specific content rendering
 *
 * Handles:
 * - Content parsing and analysis
 * - Platform-specific formatting
 * - Character limits and validations
 * - Link preview generation
 * - Hashtag and mention extraction
 */

import type {
  PlatformType,
  PlatformPreviewData,
  RenderOptions,
  ContentAnalysis,
  LinkPreview,
  PreviewWarning,
} from '../../types/v2/preview.types';
import { PLATFORM_LIMITS } from '../../types/v2/preview.types';

export class PreviewRendererService {
  private static instance: PreviewRendererService;

  private constructor() {}

  static getInstance(): PreviewRendererService {
    if (!PreviewRendererService.instance) {
      PreviewRendererService.instance = new PreviewRendererService();
    }
    return PreviewRendererService.instance;
  }

  /**
   * Render content for a specific platform
   */
  async renderContent(options: RenderOptions): Promise<PlatformPreviewData> {
    const { platform, content, includeMetadata } = options;

    // Parse content
    const hashtags = this.extractHashtags(content);
    const mentions = this.extractMentions(content);
    const links = await this.extractLinks(content);

    // Get platform limits
    const limits = PLATFORM_LIMITS[platform];

    // Generate warnings
    const warnings = this.generateWarnings(content, hashtags, mentions, platform);

    // Build preview data
    const previewData: PlatformPreviewData = {
      content,
      characterCount: content.length,
      characterLimit: limits.maxCharacters,
      hashtags,
      mentions,
      links,
      warnings,
    };

    return previewData;
  }

  /**
   * Extract hashtags from content
   */
  private extractHashtags(content: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex) || [];
    return matches;
  }

  /**
   * Extract mentions from content
   */
  private extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const matches = content.match(mentionRegex) || [];
    return matches;
  }

  /**
   * Extract and generate link previews
   */
  private async extractLinks(content: string): Promise<LinkPreview[]> {
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    const matches = content.match(linkRegex) || [];

    const linkPreviews: LinkPreview[] = [];

    for (const url of matches) {
      try {
        const urlObj = new URL(url);
        linkPreviews.push({
          url,
          title: 'Link Preview',
          description: 'Preview description would appear here',
          domain: urlObj.hostname,
        });
      } catch (error) {
        console.warn('Invalid URL:', url);
      }
    }

    return linkPreviews;
  }

  /**
   * Generate warnings based on platform limits
   */
  private generateWarnings(
    content: string,
    hashtags: string[],
    mentions: string[],
    platform: PlatformType
  ): PreviewWarning[] {
    const warnings: PreviewWarning[] = [];
    const limits = PLATFORM_LIMITS[platform];

    // Character limit warning
    if (content.length > limits.maxCharacters) {
      warnings.push({
        type: 'character_limit',
        message: `Content exceeds ${platform} character limit by ${
          content.length - limits.maxCharacters
        } characters`,
        severity: 'error',
      });
    } else if (content.length > limits.maxCharacters * 0.9) {
      warnings.push({
        type: 'character_limit',
        message: `Approaching character limit (${content.length}/${limits.maxCharacters})`,
        severity: 'info',
      });
    }

    // Hashtag limit warning
    if (hashtags.length > limits.maxHashtags) {
      warnings.push({
        type: 'hashtag_limit',
        message: `Too many hashtags: ${hashtags.length}/${limits.maxHashtags}`,
        severity: 'warning',
      });
    }

    // Mention limit warning
    if (mentions.length > limits.maxMentions) {
      warnings.push({
        type: 'mention_limit',
        message: `Too many mentions: ${mentions.length}/${limits.maxMentions}`,
        severity: 'warning',
      });
    }

    return warnings;
  }

  /**
   * Analyze content for readability and sentiment
   */
  analyzeContent(content: string): ContentAnalysis {
    // Extract components
    const hashtags = this.extractHashtags(content);
    const mentions = this.extractMentions(content);
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    const links = content.match(linkRegex) || [];
    const emojiRegex = /[\p{Emoji}]/gu;
    const emojis = content.match(emojiRegex) || [];

    // Calculate metrics
    const characterCount = content.length;
    const words = content.trim().split(/\s+/);
    const wordCount = words.filter((w) => w.length > 0).length;
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const sentenceCount = sentences.length;

    // Simple readability score (Flesch-Kincaid approximation)
    const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const avgSyllablesPerWord = 1.5; // Simplified assumption
    const readabilityScore = Math.max(
      0,
      Math.min(100, 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord)
    );

    // Simple sentiment score (keyword-based)
    const positiveWords = [
      'great',
      'awesome',
      'excellent',
      'amazing',
      'love',
      'best',
      'wonderful',
      'fantastic',
    ];
    const negativeWords = [
      'bad',
      'terrible',
      'awful',
      'hate',
      'worst',
      'disappointing',
      'poor',
    ];

    const lowerContent = content.toLowerCase();
    const positiveCount = positiveWords.filter((word) => lowerContent.includes(word)).length;
    const negativeCount = negativeWords.filter((word) => lowerContent.includes(word)).length;
    const sentimentScore = (positiveCount - negativeCount) / Math.max(1, wordCount) * 100;

    // Detect emotional tone (simplified)
    const emotionalTone: any[] = [];

    return {
      characterCount,
      wordCount,
      sentenceCount,
      hashtags,
      mentions,
      emojis,
      links,
      readabilityScore,
      sentimentScore,
      emotionalTone,
    };
  }

  /**
   * Format content for specific platform
   */
  formatForPlatform(content: string, platform: PlatformType): string {
    const limits = PLATFORM_LIMITS[platform];

    // Truncate if exceeds limit
    if (content.length > limits.maxCharacters) {
      return content.substring(0, limits.maxCharacters - 3) + '...';
    }

    // Platform-specific formatting
    switch (platform) {
      case 'twitter':
        // Twitter: Add thread indicators if needed
        return content;

      case 'linkedin':
        // LinkedIn: Add professional formatting
        return content;

      case 'instagram':
        // Instagram: Ensure hashtags at end
        const hashtagRegex = /#\w+/g;
        const hashtags = content.match(hashtagRegex) || [];
        const contentWithoutHashtags = content.replace(hashtagRegex, '').trim();

        if (hashtags.length > 0) {
          return `${contentWithoutHashtags}\n\n${hashtags.join(' ')}`;
        }
        return content;

      default:
        return content;
    }
  }

  /**
   * Generate thumbnail for content
   */
  async generateThumbnail(content: string, platform: PlatformType): Promise<string | null> {
    // TODO: Implement thumbnail generation
    // This would use a headless browser or canvas to generate an image
    return null;
  }

  /**
   * Validate content for platform
   */
  validateContent(content: string, platform: PlatformType): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const limits = PLATFORM_LIMITS[platform];

    // Check character limit
    if (content.length > limits.maxCharacters) {
      errors.push(`Content exceeds character limit (${content.length}/${limits.maxCharacters})`);
    }

    // Check if content is empty
    if (content.trim().length === 0) {
      errors.push('Content cannot be empty');
    }

    // Check hashtag limit
    const hashtags = this.extractHashtags(content);
    if (hashtags.length > limits.maxHashtags) {
      errors.push(`Too many hashtags (${hashtags.length}/${limits.maxHashtags})`);
    }

    // Check mention limit
    const mentions = this.extractMentions(content);
    if (mentions.length > limits.maxMentions) {
      errors.push(`Too many mentions (${mentions.length}/${limits.maxMentions})`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get optimal posting times for platform
   */
  getOptimalPostingTimes(platform: PlatformType): string[] {
    // Based on industry research
    const optimalTimes: Record<PlatformType, string[]> = {
      facebook: ['13:00-16:00', '19:00-21:00'],
      instagram: ['11:00-13:00', '19:00-21:00'],
      linkedin: ['07:30-09:00', '12:00-13:00', '17:00-18:00'],
      twitter: ['09:00-11:00', '12:00-13:00', '17:00-19:00'],
      tiktok: ['18:00-24:00'],
      youtube: ['14:00-16:00', '19:00-22:00'],
      email: ['06:00-10:00', '14:00-16:00'],
    };

    return optimalTimes[platform] || [];
  }

  /**
   * Suggest improvements for content
   */
  suggestImprovements(content: string, platform: PlatformType): string[] {
    const suggestions: string[] = [];
    const analysis = this.analyzeContent(content);

    // Readability suggestions
    if (analysis.readabilityScore < 50) {
      suggestions.push('Consider simplifying your language for better readability');
    }

    // Hashtag suggestions
    if (analysis.hashtags.length === 0 && platform !== 'email') {
      suggestions.push('Add relevant hashtags to increase discoverability');
    } else if (analysis.hashtags.length > 5 && platform === 'linkedin') {
      suggestions.push('LinkedIn recommends 3-5 hashtags for best engagement');
    }

    // Emoji suggestions
    if (analysis.emojis.length === 0 && ['instagram', 'facebook', 'twitter'].includes(platform)) {
      suggestions.push('Consider adding emojis to increase engagement');
    }

    // Link suggestions
    if (analysis.links.length > 0 && platform === 'instagram') {
      suggestions.push(
        'Instagram posts don\'t support clickable links. Add link to bio or use Stories/Reels'
      );
    }

    // Length suggestions
    const limits = PLATFORM_LIMITS[platform];
    if (content.length < limits.maxCharacters * 0.3) {
      suggestions.push('Consider adding more detail to increase engagement');
    }

    return suggestions;
  }
}

// Export singleton instance
export const previewRenderer = PreviewRendererService.getInstance();
