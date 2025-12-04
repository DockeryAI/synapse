/**
 * Customer Title Generator Service
 *
 * Generates customer-focused titles that make CUSTOMERS want to click,
 * not business owners. Uses industry-agnostic formulas from Content Writing Bible.
 *
 * Phase 2: Customer-First Title Generation
 */

import type { DataPoint } from '@/types/connections.types';
import type { ContentFramework } from '@/services/synapse-v6/generation/ContentFrameworkLibrary';
import { frameworkRouter } from './FrameworkRouter.service';

export interface DataPattern {
  type: 'problem' | 'desire' | 'comparison' | 'urgency' | 'transformation';
  confidence: number;
  keywords: string[];
  sentimentBias?: 'positive' | 'negative' | 'mixed';
}

export interface CustomerTitleContext {
  dataPoints: DataPoint[];
  framework: ContentFramework;
  dataPattern: DataPattern;
  industry?: string;
  platform?: 'social' | 'email' | 'blog';
}

export interface TitleFormula {
  name: string;
  pattern: string;
  examples: string[];
  applicability: {
    dataPattern: string[];
    sentimentBias?: 'positive' | 'negative';
  };
}

export interface CustomerTitleResult {
  title: string;
  formula: string;
  reasoning: string;
  confidence: number;
}

class CustomerTitleGenerator {
  /**
   * Industry-agnostic title formulas from Content Writing Bible
   * These work for ANY industry
   */
  private readonly TITLE_FORMULAS: TitleFormula[] = [
    // Problem-focused formulas
    {
      name: 'problem-solution',
      pattern: '[Customer Problem] → [Specific Solution]',
      examples: [
        'Wait Times Frustrate Customers → Skip the Line with Text Orders',
        'Forgotten Passwords → One-Click Login Now Available',
        'Confusing Checkout → Pay in 3 Taps'
      ],
      applicability: {
        dataPattern: ['problem'],
        sentimentBias: 'negative'
      }
    },
    {
      name: 'problem-elimination',
      pattern: 'No More [Customer Frustration]',
      examples: [
        'No More Waiting for Refunds',
        'No More Guessing What to Order',
        'No More Parking Hassles'
      ],
      applicability: {
        dataPattern: ['problem'],
        sentimentBias: 'negative'
      }
    },

    // Desire-focused formulas
    {
      name: 'desire-benefit',
      pattern: '[Customer Desire] + [What Enables It]',
      examples: [
        'Fresh Ingredients Everyone Notices + Daily Local Sourcing',
        'Coffee That Tastes Like Home + Small-Batch Roasting',
        'Service That Feels Personal + We Remember Your Name'
      ],
      applicability: {
        dataPattern: ['desire'],
        sentimentBias: 'positive'
      }
    },
    {
      name: 'benefit-outcome',
      pattern: '[Benefit] That [Customer Outcome]',
      examples: [
        'Speed That Gets You to Work on Time',
        'Quality That Makes You Look Good',
        'Service That Feels Like Family'
      ],
      applicability: {
        dataPattern: ['desire']
      }
    },

    // Urgency-focused formulas
    {
      name: 'urgency-opportunity',
      pattern: '[Time-Sensitive Benefit] + [Why Now]',
      examples: [
        'Weekend Brunch Without the Wait + New Reservation System',
        'Same-Day Appointments + New Hours Added',
        'Holiday Shopping Without Crowds + Extended Evening Hours'
      ],
      applicability: {
        dataPattern: ['urgency']
      }
    },
    {
      name: 'urgency-scarcity',
      pattern: '[Limited Availability] [Customer Benefit]',
      examples: [
        'Last Few Slots for This Weekend',
        'Only Available This Month',
        'While Fresh Stock Lasts'
      ],
      applicability: {
        dataPattern: ['urgency']
      }
    },

    // Transformation-focused formulas
    {
      name: 'before-after',
      pattern: '[Before State] → [After State]',
      examples: [
        'Long Lines → In and Out in 5 Minutes',
        'Confusing Menu → Know Exactly What You Want',
        'Stale Bread → Fresh from Oven Every Hour'
      ],
      applicability: {
        dataPattern: ['transformation']
      }
    },
    {
      name: 'transformation-result',
      pattern: 'How [We Changed] Makes [Your Experience Better]',
      examples: [
        'How Our New Ovens Make Crispier Pizza',
        'How Mobile Ordering Saves You 10 Minutes',
        'How Our Training Creates Better Service'
      ],
      applicability: {
        dataPattern: ['transformation']
      }
    },

    // Comparison-focused formulas
    {
      name: 'unique-difference',
      pattern: 'Why [Our Difference] Matters to You',
      examples: [
        'Why Our 24-Hour Dough Makes Better Pizza',
        'Why We Answer Calls in 30 Seconds',
        'Why Our Ingredients Cost More (And You Can Tell)'
      ],
      applicability: {
        dataPattern: ['comparison']
      }
    },
    {
      name: 'comparison-benefit',
      pattern: '[What Makes Us Different] + [Customer Benefit]',
      examples: [
        'Real Ingredients + Taste You Remember',
        'Local Owners + Service That Cares',
        'Family Recipes + Authentic Flavor'
      ],
      applicability: {
        dataPattern: ['comparison']
      }
    }
  ];

  /**
   * Generate customer-focused title from data points and framework
   */
  generateCustomerTitle(context: CustomerTitleContext): CustomerTitleResult {
    const selectedFormula = this.selectTitleFormula(context.dataPattern, context.framework);

    // Build title guidance for AI
    const guidance = this.buildTitleGuidance(context);

    // Extract key concepts from data
    const concepts = this.extractCustomerConcepts(context.dataPoints);

    // Generate reasoning
    const reasoning = `Using ${selectedFormula.name} formula because data shows ${context.dataPattern.type} pattern. ` +
      `Framework: ${context.framework.name}. Customer focus: ${concepts.benefit || concepts.problem || 'general value'}.`;

    return {
      title: guidance,  // This is guidance for AI, not final title
      formula: selectedFormula.pattern,
      reasoning,
      confidence: context.dataPattern.confidence
    };
  }

  /**
   * Select best title formula based on data pattern and framework
   */
  private selectTitleFormula(dataPattern: DataPattern, framework: ContentFramework): TitleFormula {
    // Filter formulas by data pattern
    const applicableFormulas = this.TITLE_FORMULAS.filter(formula => {
      const patternMatch = formula.applicability.dataPattern.includes(dataPattern.type);
      const sentimentMatch = !formula.applicability.sentimentBias ||
        formula.applicability.sentimentBias === dataPattern.sentimentBias;
      return patternMatch && sentimentMatch;
    });

    if (applicableFormulas.length === 0) {
      // Fallback to first formula of pattern type
      return this.TITLE_FORMULAS.find(f => f.applicability.dataPattern.includes(dataPattern.type)) ||
        this.TITLE_FORMULAS[0];
    }

    // Select based on framework alignment
    // AIDA → desire/benefit formulas
    // PAS → problem formulas
    // BAB → transformation formulas
    if (framework.id === 'aida' && applicableFormulas.some(f => f.name.includes('desire') || f.name.includes('benefit'))) {
      return applicableFormulas.find(f => f.name.includes('desire') || f.name.includes('benefit'))!;
    }
    if (framework.id === 'problem-agitate-solution' && applicableFormulas.some(f => f.name.includes('problem'))) {
      return applicableFormulas.find(f => f.name.includes('problem'))!;
    }
    if (framework.id === 'before-after-bridge' && applicableFormulas.some(f => f.name.includes('before') || f.name.includes('transformation'))) {
      return applicableFormulas.find(f => f.name.includes('before') || f.name.includes('transformation'))!;
    }

    // Default to first applicable formula
    return applicableFormulas[0];
  }

  /**
   * Build comprehensive title generation guidance for AI
   */
  buildTitleGuidance(context: CustomerTitleContext): string {
    const formula = this.selectTitleFormula(context.dataPattern, context.framework);
    const concepts = this.extractCustomerConcepts(context.dataPoints);

    let guidance = `**Title Formula: ${formula.name}**\n\n`;
    guidance += `**Pattern**: ${formula.pattern}\n\n`;

    guidance += `**Examples from This Formula**:\n`;
    for (const example of formula.examples.slice(0, 3)) {
      guidance += `- ${example}\n`;
    }

    guidance += `\n**Customer Concepts from Data**:\n`;
    if (concepts.problem) guidance += `- Customer Problem: ${concepts.problem}\n`;
    if (concepts.benefit) guidance += `- Customer Benefit: ${concepts.benefit}\n`;
    if (concepts.desire) guidance += `- Customer Desire: ${concepts.desire}\n`;
    if (concepts.urgency) guidance += `- Time-Sensitive: ${concepts.urgency}\n`;

    guidance += `\n**CRITICAL CUSTOMER FOCUS RULES**:\n`;
    guidance += `1. Write for CUSTOMERS who will see this content, NOT for business owners\n`;
    guidance += `2. Use "you", "your" when referring to customers\n`;
    guidance += `3. Focus on what customer gets/feels/experiences\n`;
    guidance += `4. NEVER use business operations language ("improve operations", "increase efficiency")\n`;
    guidance += `5. NEVER concatenate keywords (word + word + word)\n`;
    guidance += `6. Be specific, not generic ("Weekend Wait Times Peak at 30 Min" not "Product Quality Loved")\n\n`;

    guidance += `**BAD EXAMPLES** (NEVER DO THIS):\n`;
    guidance += `❌ "Social media + engagement = Post about your bakery"\n`;
    guidance += `❌ "How to improve your bakery operations"\n`;
    guidance += `❌ "Product Quality Loved"\n`;
    guidance += `❌ "Best Bakery Pattern"\n\n`;

    guidance += `**GOOD EXAMPLES** (DO THIS):\n`;
    guidance += `✅ "Why Your Weekend Croissants Taste Better Here"\n`;
    guidance += `✅ "Skip the Line: Text Orders Ready in 5 Minutes"\n`;
    guidance += `✅ "Fresh Ingredients Everyone Notices"\n`;
    guidance += `✅ "No More Waiting for Your Morning Coffee"\n\n`;

    return guidance;
  }

  /**
   * Extract customer-focused concepts from data points
   */
  private extractCustomerConcepts(dataPoints: DataPoint[]): {
    problem?: string;
    benefit?: string;
    desire?: string;
    urgency?: string;
  } {
    const concepts: any = {};
    const allContent = dataPoints.map(d => d.content).join(' ').toLowerCase();

    // Detect problem keywords
    const problemKeywords = ['wait', 'slow', 'frustrat', 'disappoint', 'confus', 'difficult', 'problem', 'issue', 'complaint'];
    for (const keyword of problemKeywords) {
      if (allContent.includes(keyword)) {
        const sentence = this.extractSentenceContaining(dataPoints, keyword);
        if (sentence) {
          concepts.problem = sentence.substring(0, 50);
          break;
        }
      }
    }

    // Detect benefit keywords
    const benefitKeywords = ['love', 'great', 'excellent', 'amazing', 'best', 'fresh', 'quality', 'perfect', 'wonderful'];
    for (const keyword of benefitKeywords) {
      if (allContent.includes(keyword)) {
        const sentence = this.extractSentenceContaining(dataPoints, keyword);
        if (sentence) {
          concepts.benefit = sentence.substring(0, 50);
          break;
        }
      }
    }

    // Detect desire keywords
    const desireKeywords = ['want', 'need', 'wish', 'hope', 'looking for', 'desire', 'expect'];
    for (const keyword of desireKeywords) {
      if (allContent.includes(keyword)) {
        const sentence = this.extractSentenceContaining(dataPoints, keyword);
        if (sentence) {
          concepts.desire = sentence.substring(0, 50);
          break;
        }
      }
    }

    // Detect urgency keywords
    const urgencyKeywords = ['now', 'today', 'weekend', 'season', 'holiday', 'limited', 'soon', 'urgent'];
    for (const keyword of urgencyKeywords) {
      if (allContent.includes(keyword)) {
        const sentence = this.extractSentenceContaining(dataPoints, keyword);
        if (sentence) {
          concepts.urgency = sentence.substring(0, 50);
          break;
        }
      }
    }

    return concepts;
  }

  /**
   * Extract sentence containing keyword from data points
   */
  private extractSentenceContaining(dataPoints: DataPoint[], keyword: string): string | null {
    for (const point of dataPoints) {
      if (point.content.toLowerCase().includes(keyword)) {
        // Simple sentence extraction
        const sentences = point.content.split(/[.!?]/);
        for (const sentence of sentences) {
          if (sentence.toLowerCase().includes(keyword)) {
            return sentence.trim();
          }
        }
        return point.content.substring(0, 100);
      }
    }
    return null;
  }

  /**
   * Validate title follows customer-first principles
   * Returns validation result with issues and suggestions
   */
  validateCustomerFocus(title: string): {
    isCustomerFocused: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for keyword concatenation
    if (/\w+\s*[\+\=]\s*\w+/i.test(title)) {
      issues.push('Contains keyword concatenation (word + word)');
      suggestions.push('Write a natural sentence instead of concatenating keywords');
    }

    // Check for business owner focus
    const businessTriggers = ['your business', 'your bakery', 'your restaurant', 'improve operations', 'increase efficiency', 'manage your', 'optimize your'];
    for (const trigger of businessTriggers) {
      if (title.toLowerCase().includes(trigger)) {
        issues.push(`Contains business owner language: "${trigger}"`);
        suggestions.push('Rewrite from customer perspective: what do they get/feel/experience?');
        break;
      }
    }

    // Check for generic patterns
    const genericPatterns = [
      /product quality/i,
      /best.*pattern/i,
      /loved.*pattern/i,
      /\w+\s+best\s+\w+/i
    ];
    for (const pattern of genericPatterns) {
      if (pattern.test(title)) {
        issues.push('Contains generic pattern - be more specific');
        suggestions.push('Use specific customer benefits or problems instead of generic terms');
        break;
      }
    }

    // Check for customer benefit indicators
    const hasCustomerLanguage = /you|your|get|save|enjoy|notice|skip|faster|easier|better|no more/i.test(title);
    if (!hasCustomerLanguage && issues.length === 0) {
      issues.push('Missing clear customer benefit or outcome');
      suggestions.push('Include what customer gets/saves/enjoys');
    }

    return {
      isCustomerFocused: issues.length === 0,
      issues,
      suggestions
    };
  }
}

export const customerTitleGenerator = new CustomerTitleGenerator();
