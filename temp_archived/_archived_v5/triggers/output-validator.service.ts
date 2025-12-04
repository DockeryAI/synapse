/**
 * Output Validator Service - Triggers 4.0
 *
 * CRITICAL: This service validates LLM output BEFORE it's processed.
 * It rejects any response containing hallucination indicators like URLs,
 * @usernames, or generated quote/author/url JSON fields.
 *
 * Based on research:
 * - DoorDash: Two-tier guardrail system achieved 90% hallucination reduction
 * - Stanford 2024: Guardrails layer is key to 96% hallucination reduction
 *
 * Created: 2025-12-01
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  cleanedOutput?: string;
}

export interface ValidationError {
  type: HallucinationType;
  pattern: string;
  location: string;
  severity: 'critical' | 'warning';
}

export type HallucinationType =
  | 'url_in_output'
  | 'username_in_output'
  | 'quote_field'
  | 'author_field'
  | 'url_field'
  | 'evidence_object'
  | 'invalid_sample_id'
  | 'fabricated_source';

// ============================================================================
// HALLUCINATION DETECTION PATTERNS
// ============================================================================

/**
 * Patterns that indicate hallucinated content in LLM output
 * These should NEVER appear in valid trigger synthesis output
 */
const HALLUCINATION_PATTERNS = {
  // URLs in any form (LLM should never output URLs)
  urls: [
    /https?:\/\/[^\s"',}\]]+/gi,
    /www\.[^\s"',}\]]+/gi,
    /\b[a-z0-9-]+\.(com|org|net|io|co|ai|dev|app)\b/gi,
  ],

  // Social media usernames (LLM should never output these)
  usernames: [
    /@[a-zA-Z0-9_]{1,30}\b/g, // Twitter/X handles
    /u\/[a-zA-Z0-9_-]+/g, // Reddit usernames
    /r\/[a-zA-Z0-9_]+/g, // Subreddit names (could be hallucinated)
  ],

  // JSON field names that should NOT appear (LLM should use sampleIds only)
  forbiddenFields: [
    /"url"\s*:/gi,
    /"author"\s*:/gi,
    /"quote"\s*:/gi,
    /"source_url"\s*:/gi,
    /"original_url"\s*:/gi,
    /"username"\s*:/gi,
    /"handle"\s*:/gi,
    /"link"\s*:/gi,
  ],

  // Evidence object patterns (old format - should be replaced with sampleIds)
  evidencePatterns: [
    /"evidence"\s*:\s*\[/gi,
    /"sources"\s*:\s*\[/gi,
  ],
};

/**
 * Required fields for valid output
 */
const REQUIRED_FIELDS = ['sampleIds', 'category', 'title', 'confidence'];

/**
 * Valid category values
 */
const VALID_CATEGORIES = [
  'fear',
  'desire',
  'pain-point',
  'objection',
  'motivation',
  'trust',
  'urgency',
];

// ============================================================================
// VALIDATOR CLASS
// ============================================================================

class OutputValidatorService {
  private rejectionCount = 0;
  private totalValidations = 0;

  /**
   * Validate LLM output for hallucination indicators
   * Returns ValidationResult with errors if invalid
   */
  validate(rawOutput: string): ValidationResult {
    this.totalValidations++;
    const errors: ValidationError[] = [];

    // Check for URL patterns
    for (const pattern of HALLUCINATION_PATTERNS.urls) {
      const matches = rawOutput.match(pattern);
      if (matches) {
        matches.forEach(match => {
          errors.push({
            type: 'url_in_output',
            pattern: match,
            location: this.findLocation(rawOutput, match),
            severity: 'critical',
          });
        });
      }
    }

    // Check for username patterns
    for (const pattern of HALLUCINATION_PATTERNS.usernames) {
      const matches = rawOutput.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Allow r/ in the title since it could be legitimate subreddit reference in extracted quote
          // But flag @ mentions which are likely fabricated
          if (match.startsWith('@')) {
            errors.push({
              type: 'username_in_output',
              pattern: match,
              location: this.findLocation(rawOutput, match),
              severity: 'critical',
            });
          }
        });
      }
    }

    // Check for forbidden JSON fields
    for (const pattern of HALLUCINATION_PATTERNS.forbiddenFields) {
      const matches = rawOutput.match(pattern);
      if (matches) {
        matches.forEach(match => {
          errors.push({
            type: this.getFieldType(match),
            pattern: match,
            location: this.findLocation(rawOutput, match),
            severity: 'critical',
          });
        });
      }
    }

    // Check for evidence object patterns (legacy format)
    for (const pattern of HALLUCINATION_PATTERNS.evidencePatterns) {
      const matches = rawOutput.match(pattern);
      if (matches) {
        matches.forEach(match => {
          errors.push({
            type: 'evidence_object',
            pattern: match,
            location: this.findLocation(rawOutput, match),
            severity: 'warning', // Warning, not critical - we can still extract sampleIds
          });
        });
      }
    }

    const isValid = errors.filter(e => e.severity === 'critical').length === 0;

    if (!isValid) {
      this.rejectionCount++;
      console.warn(`[OutputValidator] REJECTED output with ${errors.length} hallucination indicators:`);
      errors.forEach(e => console.warn(`  - ${e.type}: "${e.pattern}" at ${e.location}`));
    }

    return {
      isValid,
      errors,
      cleanedOutput: isValid ? rawOutput : undefined,
    };
  }

  /**
   * Validate a parsed trigger object
   * Ensures it has required fields and valid sampleIds
   */
  validateTriggerObject(trigger: Record<string, unknown>, maxSampleIndex: number): ValidationResult {
    const errors: ValidationError[] = [];

    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!(field in trigger)) {
        errors.push({
          type: 'fabricated_source',
          pattern: `Missing field: ${field}`,
          location: 'trigger object',
          severity: 'critical',
        });
      }
    }

    // Validate sampleIds
    const sampleIds = trigger.sampleIds as number[] | undefined;
    if (!Array.isArray(sampleIds) || sampleIds.length === 0) {
      errors.push({
        type: 'fabricated_source',
        pattern: 'sampleIds must be a non-empty array',
        location: 'sampleIds field',
        severity: 'critical',
      });
    } else {
      // Check each sampleId is within valid range
      for (const id of sampleIds) {
        if (typeof id !== 'number' || id < 1 || id > maxSampleIndex) {
          errors.push({
            type: 'invalid_sample_id',
            pattern: `Invalid sampleId: ${id} (max: ${maxSampleIndex})`,
            location: 'sampleIds array',
            severity: 'critical',
          });
        }
      }
    }

    // Validate category
    const category = trigger.category as string | undefined;
    if (category && !VALID_CATEGORIES.includes(category)) {
      errors.push({
        type: 'fabricated_source',
        pattern: `Invalid category: ${category}`,
        location: 'category field',
        severity: 'warning',
      });
    }

    // Check for forbidden fields that might have slipped through
    const forbiddenInObject = ['url', 'author', 'quote', 'source_url', 'username', 'link'];
    for (const field of forbiddenInObject) {
      if (field in trigger) {
        errors.push({
          type: this.getFieldType(`"${field}":`),
          pattern: `Forbidden field present: ${field}`,
          location: 'trigger object',
          severity: 'critical',
        });
      }
    }

    // Check evidence array if present (should be empty or absent)
    if ('evidence' in trigger && Array.isArray(trigger.evidence) && (trigger.evidence as unknown[]).length > 0) {
      errors.push({
        type: 'evidence_object',
        pattern: 'Legacy evidence array present',
        location: 'evidence field',
        severity: 'warning',
      });
    }

    const isValid = errors.filter(e => e.severity === 'critical').length === 0;

    return {
      isValid,
      errors,
    };
  }

  /**
   * Get rejection statistics
   */
  getStats(): { totalValidations: number; rejections: number; rejectionRate: number } {
    return {
      totalValidations: this.totalValidations,
      rejections: this.rejectionCount,
      rejectionRate: this.totalValidations > 0
        ? (this.rejectionCount / this.totalValidations) * 100
        : 0,
    };
  }

  /**
   * Reset statistics (for testing)
   */
  resetStats(): void {
    this.rejectionCount = 0;
    this.totalValidations = 0;
  }

  // Private helpers

  private findLocation(text: string, pattern: string): string {
    const index = text.indexOf(pattern);
    if (index === -1) return 'unknown';

    const start = Math.max(0, index - 20);
    const end = Math.min(text.length, index + pattern.length + 20);
    return `...${text.substring(start, end)}...`;
  }

  private getFieldType(match: string): HallucinationType {
    const lower = match.toLowerCase();
    if (lower.includes('url')) return 'url_field';
    if (lower.includes('author')) return 'author_field';
    if (lower.includes('quote')) return 'quote_field';
    return 'fabricated_source';
  }
}

// Export singleton
export const outputValidator = new OutputValidatorService();

/**
 * Convenience function to validate raw LLM output
 */
export function validateLLMOutput(rawOutput: string): ValidationResult {
  return outputValidator.validate(rawOutput);
}

/**
 * Convenience function to validate a parsed trigger object
 */
export function validateTrigger(
  trigger: Record<string, unknown>,
  maxSampleIndex: number
): ValidationResult {
  return outputValidator.validateTriggerObject(trigger, maxSampleIndex);
}
