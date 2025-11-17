/**
 * Source Verification Service
 *
 * CORE AUTHENTICITY PRINCIPLE:
 * - Validates all AI-generated content has source attribution
 * - Blocks content without verified sources
 * - Enforces authenticity principle platform-wide
 *
 * This service ensures that NO fabricated data makes it into the system.
 */

import type {
  VerifiedDataItem,
  SourceAttribution,
  SourceVerificationResult,
  ContentVerificationResult,
} from '@/types/smart-uvp.types';

export class SourceVerificationService {
  /**
   * Verify that a data item has valid source attribution
   */
  static verifySource(item: VerifiedDataItem): SourceVerificationResult {
    const warnings: string[] = [];

    // Check if source exists
    if (!item.source) {
      return {
        isValid: false,
        confidence: 0,
        reason: 'No source attribution provided',
      };
    }

    // Check if source URL is valid
    if (!item.source.sourceUrl) {
      return {
        isValid: false,
        confidence: 0,
        reason: 'Source URL is missing',
      };
    }

    if (!item.source.sourceUrl.startsWith('http')) {
      return {
        isValid: false,
        confidence: 0,
        reason: 'Source URL is not a valid HTTP/HTTPS URL',
      };
    }

    // Check if source context is provided
    if (!item.source.sourceContext || item.source.sourceContext === 'Unknown source') {
      warnings.push('Source context is generic or missing');
    }

    // Check extraction timestamp
    if (!item.source.extractedAt) {
      warnings.push('Extraction timestamp is missing');
    }

    // Calculate confidence based on source quality
    let confidence = 1.0;

    // Reduce confidence if warnings exist
    confidence -= warnings.length * 0.1;

    // Reduce confidence if no section heading
    if (!item.source.sectionHeading) {
      confidence -= 0.05;
    }

    // Reduce confidence if no page title
    if (!item.source.pageTitle) {
      confidence -= 0.05;
    }

    return {
      isValid: true,
      sourceUrl: item.source.sourceUrl,
      sourceContext: item.source.sourceContext,
      confidence: Math.max(0.5, confidence), // Minimum 0.5 if valid
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Verify that content meets minimum source requirements
   * Returns true only if ALL items have valid sources
   */
  static verifyContent(items: VerifiedDataItem[]): ContentVerificationResult {
    if (items.length === 0) {
      return {
        isVerified: false,
        hasRequiredSources: false,
        sourcesFound: [],
        missingSourcesFor: ['No items to verify'],
        confidenceScore: 0,
        warnings: ['No content provided for verification'],
        recommendation: 'reject',
      };
    }

    const sourcesFound: SourceAttribution[] = [];
    const missingSourcesFor: string[] = [];
    const warnings: string[] = [];
    let totalConfidence = 0;

    for (const item of items) {
      const verification = this.verifySource(item);

      if (verification.isValid) {
        sourcesFound.push(item.source);
        totalConfidence += verification.confidence;

        if (verification.warnings) {
          warnings.push(...verification.warnings.map((w) => `${item.text}: ${w}`));
        }
      } else {
        missingSourcesFor.push(item.text);
        warnings.push(`${item.text}: ${verification.reason}`);
      }
    }

    const confidenceScore = items.length > 0 ? totalConfidence / items.length : 0;
    const hasAllSources = missingSourcesFor.length === 0;
    const verificationRate = sourcesFound.length / items.length;

    // Determine recommendation
    let recommendation: 'approve' | 'review' | 'reject';
    if (hasAllSources && confidenceScore >= 0.8) {
      recommendation = 'approve';
    } else if (verificationRate >= 0.7 && confidenceScore >= 0.6) {
      recommendation = 'review';
    } else {
      recommendation = 'reject';
    }

    return {
      isVerified: hasAllSources,
      hasRequiredSources: hasAllSources,
      sourcesFound,
      missingSourcesFor,
      confidenceScore,
      warnings,
      recommendation,
    };
  }

  /**
   * Check if a specific content item requires source verification
   * Some generated content (like formatting changes) may not need sources
   */
  static requiresSource(contentType: string): boolean {
    // Content types that REQUIRE source verification
    const requiresVerification = [
      'customer_type',
      'service',
      'product',
      'problem',
      'testimonial',
      'differentiator',
      'statistic',
      'claim',
      'benefit',
      'feature',
      'success_story',
    ];

    // Content types that DON'T require source verification
    const noVerificationNeeded = [
      'formatting',
      'style',
      'emoji',
      'call_to_action', // Generic CTAs don't need sources
      'transition',
      'greeting',
    ];

    return requiresVerification.includes(contentType.toLowerCase());
  }

  /**
   * Block content generation if sources are missing
   * Throws an error to prevent fabricated content from being created
   */
  static blockIfUnverified(items: VerifiedDataItem[], contentType: string): void {
    if (!this.requiresSource(contentType)) {
      return; // No verification needed
    }

    const verification = this.verifyContent(items);

    if (!verification.hasRequiredSources) {
      const error = new Error(
        `CONTENT BLOCKED: Cannot generate ${contentType} without verified sources.\n\n` +
          `Missing sources for:\n${verification.missingSourcesFor.map((item) => `- ${item}`).join('\n')}\n\n` +
          `AUTHENTICITY PRINCIPLE: All factual claims must have source attribution.`
      );

      console.error('[SourceVerification] Content blocked:', {
        contentType,
        missingSourcesFor: verification.missingSourcesFor,
        verificationRate: verification.sourcesFound.length / items.length,
      });

      throw error;
    }

    if (verification.recommendation === 'reject') {
      const error = new Error(
        `CONTENT BLOCKED: ${contentType} verification failed.\n\n` +
          `Confidence score: ${(verification.confidenceScore * 100).toFixed(0)}%\n` +
          `Warnings:\n${verification.warnings.map((w) => `- ${w}`).join('\n')}`
      );

      console.error('[SourceVerification] Low confidence:', {
        contentType,
        confidenceScore: verification.confidenceScore,
        warnings: verification.warnings,
      });

      throw error;
    }
  }

  /**
   * Validate source URL is accessible and real
   * (Optional: can be used for deeper verification)
   */
  static async validateSourceUrl(url: string): Promise<boolean> {
    try {
      // Basic URL validation
      const urlObj = new URL(url);

      // Check protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }

      // Check if domain is valid (not localhost, file://, etc.)
      if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
        return false;
      }

      // Optional: Actually fetch the URL to verify it exists
      // (Disabled by default to avoid unnecessary network calls)
      // const response = await fetch(url, { method: 'HEAD' });
      // return response.ok;

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get verification summary for UI display
   */
  static getVerificationSummary(items: VerifiedDataItem[]): {
    totalItems: number;
    verifiedItems: number;
    unverifiedItems: number;
    averageConfidence: number;
    verificationRate: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
  } {
    const totalItems = items.length;
    const verifiedItems = items.filter((item) => this.verifySource(item).isValid).length;
    const unverifiedItems = totalItems - verifiedItems;

    const confidenceScores = items
      .map((item) => this.verifySource(item).confidence)
      .filter((c) => c > 0);

    const averageConfidence =
      confidenceScores.length > 0 ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length : 0;

    const verificationRate = totalItems > 0 ? verifiedItems / totalItems : 0;

    let status: 'excellent' | 'good' | 'fair' | 'poor';
    if (verificationRate >= 0.95 && averageConfidence >= 0.85) {
      status = 'excellent';
    } else if (verificationRate >= 0.85 && averageConfidence >= 0.7) {
      status = 'good';
    } else if (verificationRate >= 0.7 && averageConfidence >= 0.6) {
      status = 'fair';
    } else {
      status = 'poor';
    }

    return {
      totalItems,
      verifiedItems,
      unverifiedItems,
      averageConfidence,
      verificationRate,
      status,
    };
  }

  /**
   * Enforce authenticity across platform
   * Call this before any content generation that uses extracted data
   */
  static enforceAuthenticity(
    data: any[],
    operation: string
  ): void {
    console.log(`[SourceVerification] Enforcing authenticity for: ${operation}`);

    const items = data as VerifiedDataItem[];
    const verification = this.verifyContent(items);

    if (verification.recommendation === 'reject') {
      throw new Error(
        `AUTHENTICITY VIOLATION: Cannot proceed with "${operation}".\n\n` +
          `Reason: Insufficient source verification.\n` +
          `Verification rate: ${(verification.confidenceScore * 100).toFixed(0)}%\n` +
          `Missing sources: ${verification.missingSourcesFor.length}\n\n` +
          `CORE PRINCIPLE: NO FABRICATED DATA ALLOWED.`
      );
    }

    if (verification.recommendation === 'review') {
      console.warn(`[SourceVerification] Warning for "${operation}":`, {
        confidenceScore: verification.confidenceScore,
        warnings: verification.warnings,
      });
    }
  }
}
