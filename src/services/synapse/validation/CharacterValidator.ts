/**
 * Character Count Validator
 *
 * Validates content character counts against platform-specific limits.
 * Provides detailed validation results with status and recommendations.
 *
 * Created: 2025-11-11
 */

import type {
  SynapseContent,
  Platform,
  CharacterValidation,
  ContentValidationResult
} from '@/types/synapse/synapseContent.types';
import { PLATFORM_LIMITS, getPlatformLimits } from '@/config/synapse/platformLimits';

export class CharacterValidator {
  /**
   * Validate content against platform limits
   */
  validateContent(
    content: SynapseContent,
    platforms: Platform[] = ['linkedin', 'twitter']
  ): ContentValidationResult {
    const validations: CharacterValidation[] = [];

    for (const platform of platforms) {
      // Validate each section
      validations.push(this.validateHeadline(content, platform));
      validations.push(this.validateHook(content, platform));
      validations.push(this.validateBody(content, platform));
      validations.push(this.validateCTA(content, platform));
      validations.push(this.validateTotal(content, platform));
    }

    // Determine overall status
    const hasErrors = validations.some(v => v.status === 'error');
    const hasWarnings = validations.some(v => v.status === 'warning');

    const overallStatus = hasErrors ? 'error' : hasWarnings ? 'warning' : 'valid';

    // Generate recommendations
    const recommendations = this.generateRecommendations(validations);

    return {
      contentId: content.id,
      isValid: !hasErrors,
      validations,
      overallStatus,
      recommendations
    };
  }

  /**
   * Validate headline length
   */
  private validateHeadline(content: SynapseContent, platform: Platform): CharacterValidation {
    const text = content.content?.headline || '';
    const count = text.length;
    const limits = getPlatformLimits(platform);

    if (!limits || !limits.headline) {
      return {
        platform,
        section: 'headline',
        characterCount: count,
        limit: 1000,
        optimal: 100,
        status: 'valid',
        message: `${count} chars`
      };
    }

    const { min, max, optimal } = limits.headline;

    return this.createValidation(platform, 'headline', count, min, max, optimal, text);
  }

  /**
   * Validate hook length
   */
  private validateHook(content: SynapseContent, platform: Platform): CharacterValidation {
    const text = content.content?.hook || '';
    const count = text.length;
    const limits = getPlatformLimits(platform);

    if (!limits || !limits.body) {
      return {
        platform,
        section: 'hook',
        characterCount: count,
        limit: 3000,
        optimal: 300,
        status: 'valid',
        message: `${count} chars`
      };
    }

    const { min, max, optimal } = limits.body;

    return this.createValidation(platform, 'hook', count, min, max, optimal, text);
  }

  /**
   * Validate body length
   */
  private validateBody(content: SynapseContent, platform: Platform): CharacterValidation {
    const text = content.content?.body || '';
    const count = text.length;
    const limits = getPlatformLimits(platform);

    if (!limits || !limits.body) {
      return {
        platform,
        section: 'body',
        characterCount: count,
        limit: 5000,
        optimal: 1500,
        status: 'valid',
        message: `${count} chars`
      };
    }

    const { min, max, optimal } = limits.body;

    return this.createValidation(platform, 'body', count, min, max, optimal, text);
  }

  /**
   * Validate CTA length
   */
  private validateCTA(content: SynapseContent, platform: Platform): CharacterValidation {
    const text = content.content?.cta || '';
    const count = text.length;
    const limits = getPlatformLimits(platform);

    if (!limits || !limits.headline) {
      return {
        platform,
        section: 'cta',
        characterCount: count,
        limit: 150,
        optimal: 100,
        status: 'valid',
        message: `${count} chars`
      };
    }

    const { min, max, optimal } = limits.headline;

    return this.createValidation(platform, 'cta', count, min, max, optimal, text);
  }

  /**
   * Validate total content length
   */
  private validateTotal(content: SynapseContent, platform: Platform): CharacterValidation {
    const total =
      (content.content?.headline?.length || 0) +
      (content.content?.hook?.length || 0) +
      (content.content?.body?.length || 0) +
      (content.content?.cta?.length || 0);

    const limits = getPlatformLimits(platform);

    if (!limits || !limits.total) {
      return {
        platform,
        section: 'total',
        characterCount: total,
        limit: 5000,
        optimal: 2000,
        status: 'valid',
        message: `Total: ${total} chars`
      };
    }

    const { min, max, optimal } = limits.total;

    return this.createValidation(
      platform,
      'total',
      total,
      min,
      max,
      optimal,
      `Total: ${total} chars`
    );
  }

  /**
   * Create validation result
   */
  private createValidation(
    platform: Platform,
    section: 'headline' | 'hook' | 'body' | 'cta' | 'total',
    count: number,
    min: number,
    max: number,
    optimal: number,
    text: string
  ): CharacterValidation {
    let status: 'valid' | 'warning' | 'error';
    let message: string;

    if (count < min) {
      status = 'error';
      message = `Too short: ${count}/${min} chars (needs ${min - count} more)`;
    } else if (count > max) {
      status = 'error';
      message = `Too long: ${count}/${max} chars (over by ${count - max})`;
    } else if (count < optimal * 0.8 || count > optimal * 1.2) {
      status = 'warning';
      const deviation = Math.abs(count - optimal);
      message = `${count} chars (${deviation} from optimal ${optimal})`;
    } else {
      status = 'valid';
      message = `${count} chars ✓`;
    }

    return {
      platform,
      section,
      characterCount: count,
      limit: max,
      optimal,
      status,
      message
    };
  }

  /**
   * Generate recommendations based on validations
   */
  private generateRecommendations(validations: CharacterValidation[]): string[] {
    const recommendations: string[] = [];
    const errors = validations.filter(v => v.status === 'error');
    const warnings = validations.filter(v => v.status === 'warning');

    if (errors.length === 0 && warnings.length === 0) {
      recommendations.push('✅ All content meets platform requirements');
      return recommendations;
    }

    // Group by platform
    const platformErrors = this.groupByPlatform(errors);
    const platformWarnings = this.groupByPlatform(warnings);

    // Generate error recommendations
    for (const [platform, items] of Object.entries(platformErrors)) {
      for (const item of items) {
        if (item.characterCount < PLATFORM_LIMITS[item.platform].headline.min) {
          recommendations.push(
            `❌ ${platform} ${item.section}: Add ${PLATFORM_LIMITS[item.platform].headline.min - item.characterCount} more characters`
          );
        } else {
          recommendations.push(
            `❌ ${platform} ${item.section}: Reduce by ${item.characterCount - item.limit} characters`
          );
        }
      }
    }

    // Generate warning recommendations
    for (const [platform, items] of Object.entries(platformWarnings)) {
      for (const item of items) {
        const diff = Math.abs(item.characterCount - item.optimal);
        if (item.characterCount < item.optimal) {
          recommendations.push(
            `⚠️ ${platform} ${item.section}: Consider adding ${diff} characters for optimal engagement`
          );
        } else {
          recommendations.push(
            `⚠️ ${platform} ${item.section}: Consider reducing by ${diff} characters for optimal engagement`
          );
        }
      }
    }

    return recommendations;
  }

  /**
   * Group validations by platform
   */
  private groupByPlatform(
    validations: CharacterValidation[]
  ): Record<Platform, CharacterValidation[]> {
    const grouped: Record<string, CharacterValidation[]> = {};

    for (const validation of validations) {
      if (!grouped[validation.platform]) {
        grouped[validation.platform] = [];
      }
      grouped[validation.platform].push(validation);
    }

    return grouped as Record<Platform, CharacterValidation[]>;
  }

  /**
   * Quick check if content is valid for a platform
   */
  isValidForPlatform(content: SynapseContent, platform: Platform): boolean {
    const result = this.validateContent(content, [platform]);
    return result.isValid;
  }

  /**
   * Get character count summary for content
   */
  getCharacterSummary(content: SynapseContent): {
    headline: number;
    hook: number;
    body: number;
    cta: number;
    total: number;
  } {
    return {
      headline: content.content.headline.length,
      hook: content.content.hook.length,
      body: content.content.body.length,
      cta: content.content.cta.length,
      total:
        content.content.headline.length +
        content.content.hook.length +
        content.content.body.length +
        content.content.cta.length
    };
  }
}
