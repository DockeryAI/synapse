/**
 * FormatValidator - Mobile Content Format Validation
 *
 * Checks if your content meets platform requirements
 * Spoiler: It probably doesn't
 *
 * @author Roy (the guy who'll get paged when this breaks)
 */

import {
  MobilePlatform,
  AspectRatio,
  FormatValidationResult,
  ValidationError,
  ValidationWarning,
  MobileContentRequirements,
  PLATFORM_REQUIREMENTS,
} from '../../types/mobile.types';

interface ContentMetadata {
  width: number;
  height: number;
  fileSize: number;
  duration?: number; // seconds (for video)
  captionLength: number;
  fontSizes?: number[]; // detected font sizes in px
  hasAudio?: boolean;
  estimatedLoadTime?: number; // ms
}

export class FormatValidator {
  /**
   * Validate content against platform requirements
   * Returns errors, warnings, and a score because everyone loves being graded
   */
  static validate(
    platform: MobilePlatform,
    content: ContentMetadata
  ): FormatValidationResult {
    const requirements = PLATFORM_REQUIREMENTS[platform];
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Resolution check - the basics
    this.validateResolution(content, requirements, errors, warnings);

    // Aspect ratio - because math
    this.validateAspectRatio(content, requirements, errors);

    // File size - your API will thank me later
    this.validateFileSize(content, requirements, errors, warnings);

    // Caption length - some platforms are chatty, some aren't
    this.validateCaptionLength(content, requirements, errors);

    // Font size - can boomers read this?
    this.validateFontSize(content, requirements, warnings);

    // Video duration - if applicable
    if (content.duration !== undefined) {
      this.validateDuration(content, requirements, errors);
    }

    // Load time - because attention spans are measured in milliseconds now
    this.validateLoadTime(content, requirements, warnings);

    // Audio check for video platforms
    if (platform === 'tiktok' && content.duration !== undefined) {
      this.validateAudio(content, warnings);
    }

    // Calculate overall score (weighted by severity)
    const score = this.calculateScore(errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score,
    };
  }

  /**
   * Quick validation - just the critical stuff
   * For when you're in a hurry to fail
   */
  static quickValidate(
    platform: MobilePlatform,
    width: number,
    height: number,
    fileSize: number
  ): boolean {
    const requirements = PLATFORM_REQUIREMENTS[platform];

    // Check resolution
    if (width < requirements.minResolution.width || height < requirements.minResolution.height) {
      return false;
    }

    // Check file size
    if (fileSize > requirements.maxFileSize) {
      return false;
    }

    // Check aspect ratio
    const ratio = this.getAspectRatio(width, height);
    if (!requirements.aspectRatio.includes(ratio)) {
      return false;
    }

    return true;
  }

  /**
   * Get recommended fixes for validation errors
   * Because we're helpful like that
   */
  static getRecommendedFixes(result: FormatValidationResult): string[] {
    const fixes: string[] = [];

    result.errors.forEach(error => {
      if (error.fix) {
        fixes.push(`❌ ${error.field}: ${error.fix}`);
      }
    });

    result.warnings.forEach(warning => {
      if (warning.impact === 'high') {
        fixes.push(`⚠️  ${warning.field}: ${warning.suggestion}`);
      }
    });

    return fixes;
  }

  // ============================================================================
  // PRIVATE VALIDATION METHODS (where the fun happens)
  // ============================================================================

  private static validateResolution(
    content: ContentMetadata,
    requirements: MobileContentRequirements,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const { width, height } = content;
    const { minResolution, maxResolution } = requirements;

    // Too small - pixels matter
    if (width < minResolution.width || height < minResolution.height) {
      errors.push({
        field: 'resolution',
        message: `Resolution ${width}x${height} is below minimum ${minResolution.width}x${minResolution.height}`,
        severity: 'error',
        fix: `Upscale image to at least ${minResolution.width}x${minResolution.height} or re-export at higher quality`,
      });
    }

    // Too big - bandwidth matters (and so do API limits)
    if (width > maxResolution.width || height > maxResolution.height) {
      warnings.push({
        field: 'resolution',
        message: `Resolution ${width}x${height} exceeds recommended ${maxResolution.width}x${maxResolution.height}`,
        impact: 'medium',
        suggestion: `Downscale to ${maxResolution.width}x${maxResolution.height} to reduce file size and improve load times`,
      });
    }

    // Warn if non-standard resolution (will be cropped/letterboxed)
    if (width % 2 !== 0 || height % 2 !== 0) {
      warnings.push({
        field: 'resolution',
        message: 'Resolution dimensions should be even numbers for optimal encoding',
        impact: 'low',
        suggestion: 'Round dimensions to nearest even number',
      });
    }
  }

  private static validateAspectRatio(
    content: ContentMetadata,
    requirements: MobileContentRequirements,
    errors: ValidationError[]
  ): void {
    const ratio = this.getAspectRatio(content.width, content.height);

    if (!requirements.aspectRatio.includes(ratio)) {
      errors.push({
        field: 'aspectRatio',
        message: `Aspect ratio ${ratio} not supported. Accepted: ${requirements.aspectRatio.join(', ')}`,
        severity: 'error',
        fix: `Crop or resize to ${requirements.aspectRatio[0]} (${this.getRatioDimensions(requirements.aspectRatio[0])})`,
      });
    }
  }

  private static validateFileSize(
    content: ContentMetadata,
    requirements: MobileContentRequirements,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const { fileSize } = content;
    const { maxFileSize, optimalLoadTime } = requirements;

    // Hard limit
    if (fileSize > maxFileSize) {
      errors.push({
        field: 'fileSize',
        message: `File size ${this.formatBytes(fileSize)} exceeds platform limit of ${this.formatBytes(maxFileSize)}`,
        severity: 'error',
        fix: `Compress file or reduce quality to under ${this.formatBytes(maxFileSize)}`,
      });
    }

    // Soft warning for large files (> 50% of limit)
    const softLimit = maxFileSize * 0.5;
    if (fileSize > softLimit && fileSize <= maxFileSize) {
      warnings.push({
        field: 'fileSize',
        message: `File size ${this.formatBytes(fileSize)} is large and may impact load times`,
        impact: 'medium',
        suggestion: `Consider compressing to under ${this.formatBytes(softLimit)} for faster loading`,
      });
    }

    // Estimate load time warning
    const estimatedLoadTime = this.estimateLoadTime(fileSize);
    if (estimatedLoadTime > optimalLoadTime) {
      warnings.push({
        field: 'loadTime',
        message: `Estimated load time ${estimatedLoadTime}ms exceeds optimal ${optimalLoadTime}ms`,
        impact: 'high',
        suggestion: 'Compress file or optimize quality to improve load times',
      });
    }
  }

  private static validateCaptionLength(
    content: ContentMetadata,
    requirements: MobileContentRequirements,
    errors: ValidationError[]
  ): void {
    const { captionLength } = content;
    const { maxCaptionLength } = requirements;

    if (captionLength > maxCaptionLength) {
      errors.push({
        field: 'caption',
        message: `Caption length ${captionLength} exceeds platform limit of ${maxCaptionLength}`,
        severity: 'error',
        fix: `Trim caption to ${maxCaptionLength} characters or less`,
      });
    }
  }

  private static validateFontSize(
    content: ContentMetadata,
    requirements: MobileContentRequirements,
    warnings: ValidationWarning[]
  ): void {
    if (!content.fontSizes || content.fontSizes.length === 0) return;

    const { minFontSize } = requirements;
    const smallFonts = content.fontSizes.filter(size => size < minFontSize);

    if (smallFonts.length > 0) {
      warnings.push({
        field: 'fontSize',
        message: `Detected ${smallFonts.length} text elements below minimum readable size (${minFontSize}px)`,
        impact: 'high',
        suggestion: `Increase font sizes to at least ${minFontSize}px for mobile readability`,
      });
    }
  }

  private static validateDuration(
    content: ContentMetadata,
    requirements: MobileContentRequirements,
    errors: ValidationError[]
  ): void {
    if (!content.duration) return;

    const { maxVideoLength } = requirements;

    if (content.duration > maxVideoLength) {
      errors.push({
        field: 'duration',
        message: `Video duration ${content.duration}s exceeds platform limit of ${maxVideoLength}s`,
        severity: 'error',
        fix: `Trim video to ${maxVideoLength} seconds or less`,
      });
    }
  }

  private static validateLoadTime(
    content: ContentMetadata,
    requirements: MobileContentRequirements,
    warnings: ValidationWarning[]
  ): void {
    const loadTime = content.estimatedLoadTime || this.estimateLoadTime(content.fileSize);
    const { optimalLoadTime } = requirements;

    if (loadTime > optimalLoadTime * 1.5) {
      warnings.push({
        field: 'loadTime',
        message: `Estimated load time ${loadTime}ms is significantly higher than optimal ${optimalLoadTime}ms`,
        impact: 'high',
        suggestion: 'Users may scroll past before content loads. Consider aggressive compression.',
      });
    }
  }

  private static validateAudio(
    content: ContentMetadata,
    warnings: ValidationWarning[]
  ): void {
    if (!content.hasAudio) {
      warnings.push({
        field: 'audio',
        message: 'Video has no audio track',
        impact: 'high',
        suggestion: 'TikTok videos perform better with trending audio. Consider adding background music.',
      });
    }
  }

  // ============================================================================
  // HELPER METHODS (the boring but necessary stuff)
  // ============================================================================

  private static getAspectRatio(width: number, height: number): AspectRatio {
    const ratio = width / height;

    // Allow some tolerance for floating point madness
    const tolerance = 0.02;

    if (Math.abs(ratio - 9/16) < tolerance) return '9:16';
    if (Math.abs(ratio - 16/9) < tolerance) return '16:9';
    if (Math.abs(ratio - 1) < tolerance) return '1:1';
    if (Math.abs(ratio - 4/5) < tolerance) return '4:5';

    // Default to closest match
    const ratios: AspectRatio[] = ['9:16', '16:9', '1:1', '4:5'];
    const ratioValues = [9/16, 16/9, 1, 4/5];

    let closest = 0;
    let minDiff = Math.abs(ratio - ratioValues[0]);

    for (let i = 1; i < ratioValues.length; i++) {
      const diff = Math.abs(ratio - ratioValues[i]);
      if (diff < minDiff) {
        minDiff = diff;
        closest = i;
      }
    }

    return ratios[closest];
  }

  private static getRatioDimensions(ratio: AspectRatio): string {
    switch (ratio) {
      case '9:16':
        return '1080x1920';
      case '16:9':
        return '1920x1080';
      case '1:1':
        return '1080x1080';
      case '4:5':
        return '1080x1350';
      default:
        return '1080x1920';
    }
  }

  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  private static estimateLoadTime(fileSize: number): number {
    // Assume 4G mobile connection: ~5 Mbps average
    const bitsPerSecond = 5 * 1024 * 1024;
    const bitsPerMillisecond = bitsPerSecond / 1000;
    const fileSizeInBits = fileSize * 8;

    // Add 500ms overhead for connection establishment
    return Math.round((fileSizeInBits / bitsPerMillisecond) + 500);
  }

  private static calculateScore(
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): number {
    let score = 100;

    // Errors cost 20 points each (ouch)
    score -= errors.length * 20;

    // Warnings cost based on impact
    warnings.forEach(warning => {
      switch (warning.impact) {
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate a detailed validation report
   * For when you need to justify why the content sucks
   */
  static generateReport(result: FormatValidationResult): string {
    let report = `Mobile Format Validation Report\n`;
    report += `Score: ${result.score}/100\n`;
    report += `Status: ${result.isValid ? '✅ PASSED' : '❌ FAILED'}\n\n`;

    if (result.errors.length > 0) {
      report += `ERRORS (${result.errors.length}):\n`;
      result.errors.forEach((error, i) => {
        report += `${i + 1}. ${error.field}: ${error.message}\n`;
        if (error.fix) {
          report += `   Fix: ${error.fix}\n`;
        }
      });
      report += '\n';
    }

    if (result.warnings.length > 0) {
      report += `WARNINGS (${result.warnings.length}):\n`;
      result.warnings.forEach((warning, i) => {
        report += `${i + 1}. [${warning.impact.toUpperCase()}] ${warning.field}: ${warning.message}\n`;
        report += `   Suggestion: ${warning.suggestion}\n`;
      });
    }

    if (result.errors.length === 0 && result.warnings.length === 0) {
      report += '🎉 No issues found. Content is ready for mobile!\n';
    }

    return report;
  }
}

export default FormatValidator;
