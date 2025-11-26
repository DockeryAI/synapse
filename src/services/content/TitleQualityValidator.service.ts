/**
 * Title Quality Validator Service
 *
 * Validates titles follow customer-first principles:
 * - No keyword concatenation
 * - Customer focus (not business owner)
 * - Specific (not generic)
 * - Clear benefit or action
 *
 * Phase 2: Customer-First Title Generation
 */

export interface TitleQualityReport {
  score: number;  // 0-10
  passed: boolean;  // score >= 7
  issues: TitleIssue[];
  suggestions: string[];
}

export interface TitleIssue {
  type: 'keyword_concatenation' | 'business_focus' | 'generic' | 'no_benefit' | 'unclear_action';
  severity: 'critical' | 'warning';
  message: string;
  location?: string;
}

class TitleQualityValidator {
  /**
   * Known bad patterns to detect and reject
   */
  private readonly BAD_PATTERNS = [
    // Keyword concatenation
    { pattern: /\w+\s*\+\s*\w+/i, type: 'keyword_concatenation' as const, message: 'Contains keyword concatenation (word + word)' },
    { pattern: /\w+\s*\=\s*\w+/i, type: 'keyword_concatenation' as const, message: 'Contains keyword concatenation (word = word)' },

    // Business owner focus
    { pattern: /your (business|bakery|restaurant|shop|store|company|practice|clinic)/i, type: 'business_focus' as const, message: 'Targets business owners, not customers' },
    { pattern: /improve.*(operations|efficiency|process|workflow)/i, type: 'business_focus' as const, message: 'Business operations focus, not customer benefit' },
    { pattern: /(manage|optimize|streamline) your/i, type: 'business_focus' as const, message: 'Business management language' },

    // Generic patterns
    { pattern: /(product|service) quality/i, type: 'generic' as const, message: 'Too generic - be specific about what quality means' },
    { pattern: /best.*pattern/i, type: 'generic' as const, message: 'Generic "pattern" language' },
    { pattern: /loved.*pattern/i, type: 'generic' as const, message: 'Generic "loved pattern" phrase' },
    { pattern: /\w+\s+best\s+\w+/i, type: 'generic' as const, message: 'Vague "best" claim without specifics' }
  ];

  /**
   * Business owner trigger words that indicate wrong audience
   */
  private readonly BUSINESS_TRIGGERS = [
    'operations', 'efficiency', 'profit', 'revenue', 'ROI',
    'optimize', 'streamline', 'improve your', 'manage your',
    'grow your', 'scale your', 'expand your', 'boost your business'
  ];

  /**
   * Customer benefit indicators (positive signals)
   */
  private readonly CUSTOMER_BENEFITS = [
    'you get', 'you save', 'you enjoy', 'you notice', 'you feel',
    'skip the', 'no more', 'faster', 'easier', 'better',
    'without', 'your time', 'your money', 'for you'
  ];

  /**
   * Action words that indicate clear customer action
   */
  private readonly ACTION_WORDS = [
    'get', 'save', 'skip', 'enjoy', 'discover', 'try', 'taste',
    'feel', 'notice', 'experience', 'find', 'see', 'choose'
  ];

  /**
   * Validate title quality with comprehensive scoring
   */
  validateTitle(title: string, context?: { industry?: string; dataPattern?: string }): TitleQualityReport {
    const issues: TitleIssue[] = [];
    const suggestions: string[] = [];
    let score = 10;  // Start with perfect score, deduct for issues

    // Check for bad patterns
    const concatenationIssues = this.detectKeywordConcatenation(title);
    issues.push(...concatenationIssues);
    score -= concatenationIssues.filter(i => i.severity === 'critical').length * 3;
    score -= concatenationIssues.filter(i => i.severity === 'warning').length * 1;

    // Check for business focus
    const businessIssues = this.detectBusinessFocus(title);
    issues.push(...businessIssues);
    score -= businessIssues.filter(i => i.severity === 'critical').length * 3;
    score -= businessIssues.filter(i => i.severity === 'warning').length * 1;

    // Check for generic patterns
    const genericIssues = this.detectGenericPatterns(title);
    issues.push(...genericIssues);
    score -= genericIssues.filter(i => i.severity === 'critical').length * 2;
    score -= genericIssues.filter(i => i.severity === 'warning').length * 1;

    // Check for customer benefit
    const benefitCheck = this.detectCustomerBenefit(title);
    if (!benefitCheck.hasBenefit) {
      issues.push({
        type: 'no_benefit',
        severity: 'warning',
        message: 'No clear customer benefit detected'
      });
      suggestions.push('Add specific customer benefit: what do they get/save/enjoy?');
      score -= 1;
    }

    // Check for clear action
    const actionCheck = this.detectClearAction(title);
    if (!actionCheck.hasAction) {
      issues.push({
        type: 'unclear_action',
        severity: 'warning',
        message: 'No clear customer action or outcome'
      });
      suggestions.push('Include what customer can do or what happens for them');
      score -= 1;
    }

    // Generate suggestions based on issues
    if (concatenationIssues.length > 0) {
      suggestions.push('Write a natural sentence instead of concatenating keywords');
    }
    if (businessIssues.length > 0) {
      suggestions.push('Rewrite from customer perspective: what do they get/feel/experience?');
    }
    if (genericIssues.length > 0) {
      suggestions.push('Be more specific - use concrete numbers, outcomes, or experiences');
    }

    // Ensure score is in valid range
    score = Math.max(0, Math.min(10, score));

    return {
      score,
      passed: score >= 7,
      issues,
      suggestions
    };
  }

  /**
   * Detect keyword concatenation patterns
   */
  private detectKeywordConcatenation(title: string): TitleIssue[] {
    const issues: TitleIssue[] = [];

    // Check for + or = operators
    if (/\w+\s*[\+\=]\s*\w+/i.test(title)) {
      issues.push({
        type: 'keyword_concatenation',
        severity: 'critical',
        message: 'Contains keyword concatenation with + or = operators',
        location: title.match(/\w+\s*[\+\=]\s*\w+/i)?.[0]
      });
    }

    // Check for suspicious word combinations (3+ capitalized words without natural language)
    const words = title.split(/\s+/);
    let capitalizedSequence = 0;
    for (const word of words) {
      if (/^[A-Z]/.test(word) && word.length > 3) {
        capitalizedSequence++;
        if (capitalizedSequence >= 4) {
          issues.push({
            type: 'keyword_concatenation',
            severity: 'warning',
            message: 'Possible keyword stuffing - too many capitalized terms in sequence'
          });
          break;
        }
      } else {
        capitalizedSequence = 0;
      }
    }

    return issues;
  }

  /**
   * Detect business owner focus vs customer focus
   */
  private detectBusinessFocus(title: string): TitleIssue[] {
    const issues: TitleIssue[] = [];
    const titleLower = title.toLowerCase();

    // Check business trigger phrases
    for (const trigger of this.BUSINESS_TRIGGERS) {
      if (titleLower.includes(trigger)) {
        issues.push({
          type: 'business_focus',
          severity: 'critical',
          message: `Contains business owner language: "${trigger}"`,
          location: trigger
        });
      }
    }

    // Check for specific bad patterns
    for (const { pattern, type, message } of this.BAD_PATTERNS) {
      if (type === 'business_focus' && pattern.test(title)) {
        const match = title.match(pattern);
        issues.push({
          type: 'business_focus',
          severity: 'critical',
          message,
          location: match?.[0]
        });
      }
    }

    return issues;
  }

  /**
   * Detect generic, vague patterns
   */
  private detectGenericPatterns(title: string): TitleIssue[] {
    const issues: TitleIssue[] = [];

    // Check for specific generic patterns
    for (const { pattern, type, message } of this.BAD_PATTERNS) {
      if (type === 'generic' && pattern.test(title)) {
        const match = title.match(pattern);
        issues.push({
          type: 'generic',
          severity: 'critical',
          message,
          location: match?.[0]
        });
      }
    }

    // Check for vague qualifiers without specifics
    const vagueQualifiers = /\b(great|good|nice|best|top|quality)\b/gi;
    const matches = title.match(vagueQualifiers);
    if (matches && matches.length >= 2) {
      issues.push({
        type: 'generic',
        severity: 'warning',
        message: 'Multiple vague qualifiers - be more specific'
      });
    }

    return issues;
  }

  /**
   * Check for customer benefit in title
   */
  private detectCustomerBenefit(title: string): { hasBenefit: boolean; reasoning: string } {
    const titleLower = title.toLowerCase();

    // Check for benefit indicator words
    for (const benefit of this.CUSTOMER_BENEFITS) {
      if (titleLower.includes(benefit)) {
        return {
          hasBenefit: true,
          reasoning: `Contains customer benefit indicator: "${benefit}"`
        };
      }
    }

    // Check for "you" pronouns (customer-directed)
    if (/\byou\b|\byour\b/i.test(title)) {
      return {
        hasBenefit: true,
        reasoning: 'Uses customer-directed language ("you", "your")'
      };
    }

    // Check for time/money savings
    if (/save|faster|quicker|cheaper|less expensive|free/i.test(title)) {
      return {
        hasBenefit: true,
        reasoning: 'Mentions time or money savings'
      };
    }

    // Check for specific numbers (usually indicate benefits)
    if (/\d+\s*(minutes?|hours?|dollars?|%|percent)/i.test(title)) {
      return {
        hasBenefit: true,
        reasoning: 'Contains specific measurable benefit'
      };
    }

    return {
      hasBenefit: false,
      reasoning: 'No clear customer benefit detected'
    };
  }

  /**
   * Check for clear customer action or outcome
   */
  private detectClearAction(title: string): { hasAction: boolean; reasoning: string } {
    const titleLower = title.toLowerCase();

    // Check for action words
    for (const action of this.ACTION_WORDS) {
      if (new RegExp(`\\b${action}\\b`, 'i').test(title)) {
        return {
          hasAction: true,
          reasoning: `Contains action word: "${action}"`
        };
      }
    }

    // Check for outcome indicators
    if (/without|no more|skip|avoid|eliminate/i.test(title)) {
      return {
        hasAction: true,
        reasoning: 'Describes outcome (what customer avoids or eliminates)'
      };
    }

    // Check for transformation indicators
    if (/→|->|to|become|turn into/i.test(title)) {
      return {
        hasAction: true,
        reasoning: 'Shows transformation or change'
      };
    }

    // Check for question format (often implies action)
    if (/\?$/.test(title.trim())) {
      return {
        hasAction: true,
        reasoning: 'Question format implies customer consideration/action'
      };
    }

    return {
      hasAction: false,
      reasoning: 'No clear action or outcome for customer'
    };
  }

  /**
   * Get detailed explanation of validation results
   */
  explainValidation(report: TitleQualityReport, title: string): string {
    let explanation = `**Title Quality Report for**: "${title}"\n\n`;
    explanation += `**Score**: ${report.score}/10 (${report.passed ? 'PASSED ✅' : 'FAILED ❌'})\n\n`;

    if (report.issues.length > 0) {
      explanation += `**Issues Found (${report.issues.length})**:\n`;
      for (const issue of report.issues) {
        const emoji = issue.severity === 'critical' ? '🔴' : '⚠️';
        explanation += `${emoji} [${issue.type}] ${issue.message}\n`;
        if (issue.location) {
          explanation += `   Location: "${issue.location}"\n`;
        }
      }
      explanation += `\n`;
    }

    if (report.suggestions.length > 0) {
      explanation += `**Suggestions**:\n`;
      for (const suggestion of report.suggestions) {
        explanation += `💡 ${suggestion}\n`;
      }
      explanation += `\n`;
    }

    if (report.passed) {
      explanation += `✅ This title meets customer-first quality standards.\n`;
    } else {
      explanation += `❌ This title needs improvement to meet quality standards.\n`;
    }

    return explanation;
  }
}

export const titleQualityValidator = new TitleQualityValidator();
