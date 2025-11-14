/**
 * Attribute Generation Service
 *
 * Generates industry-specific brand attributes (personality & tribe)
 * based on industry profile and business analysis
 */

import type { BrandAttribute } from '@/types/valueForge';
import type { ValueForgeContext } from '@/types/valueForge';

export class AttributeGenerationService {
  /**
   * Generate industry-appropriate brand attributes
   */
  generateAttributes(context: ValueForgeContext): BrandAttribute[] {
    const industryProfile = context.industryProfile;

    if (!industryProfile) {
      console.warn('[AttributeGeneration] No industry profile available');
      return [];
    }

    // Extract attributes dynamically from industry profile
    const dynamicAttributes = this.extractAttributesFromProfile(industryProfile, context);

    console.log(`[AttributeGeneration] Generated ${dynamicAttributes.length} attributes from industry profile`);

    return dynamicAttributes;
  }

  /**
   * Extract brand attributes dynamically from industry profile
   */
  private extractAttributesFromProfile(
    industryProfile: any,
    context: ValueForgeContext
  ): BrandAttribute[] {
    const attributes: BrandAttribute[] = [];

    // 1. Extract from competitive advantages
    if (industryProfile.competitive_advantages && Array.isArray(industryProfile.competitive_advantages)) {
      const advantageAttrs = this.extractFromCompetitiveAdvantages(industryProfile.competitive_advantages);
      attributes.push(...advantageAttrs);
    }

    // 2. Extract from transformations (emotional states)
    if (industryProfile.transformations && Array.isArray(industryProfile.transformations)) {
      const transformationAttrs = this.extractFromTransformations(industryProfile.transformations);
      attributes.push(...transformationAttrs);
    }

    // 3. Extract from customer triggers (urgency/needs)
    if (industryProfile.customer_triggers && Array.isArray(industryProfile.customerTriggers || industryProfile.customer_triggers)) {
      const triggerAttrs = this.extractFromTriggers(
        industryProfile.customerTriggers || industryProfile.customer_triggers
      );
      attributes.push(...triggerAttrs);
    }

    // 4. Extract from quality indicators
    if (industryProfile.quality_indicators && Array.isArray(industryProfile.quality_indicators)) {
      const qualityAttrs = this.extractFromQualityIndicators(industryProfile.quality_indicators);
      attributes.push(...qualityAttrs);
    }

    // Deduplicate and limit to 5-7 best attributes
    const uniqueAttributes = this.deduplicateAttributes(attributes);
    const scoredAttributes = uniqueAttributes.map(attr => ({
      ...attr,
      alignmentScore: this.calculateAlignmentScore(attr, context)
    }));

    // Sort by alignment score and return top 5-7
    return scoredAttributes
      .sort((a, b) => b.alignmentScore - a.alignmentScore)
      .slice(0, 7);
  }

  /**
   * Extract attributes from competitive advantages
   */
  private extractFromCompetitiveAdvantages(advantages: any[]): BrandAttribute[] {
    const attributes: BrandAttribute[] = [];
    const attributePatterns = [
      { pattern: /expert|expertise|specialized|specialist/i, attr: 'Expert & Specialized' },
      { pattern: /quality|premium|excellence|superior/i, attr: 'Quality-Focused' },
      { pattern: /fast|quick|rapid|efficient|speed/i, attr: 'Fast & Efficient' },
      { pattern: /personal|customized|tailored|bespoke/i, attr: 'Personalized & Custom' },
      { pattern: /reliable|dependable|consistent|trustworthy/i, attr: 'Reliable & Trustworthy' },
      { pattern: /innovative|cutting-edge|modern|advanced/i, attr: 'Innovative & Modern' },
      { pattern: /local|community|neighborhood|nearby/i, attr: 'Local & Community-Focused' },
      { pattern: /comprehensive|full-service|complete/i, attr: 'Comprehensive Solutions' },
      { pattern: /affordable|value|cost-effective|budget/i, attr: 'Value-Driven' },
      { pattern: /professional|certified|licensed|qualified/i, attr: 'Professional & Certified' }
    ];

    advantages.slice(0, 5).forEach((adv: any) => {
      const text = typeof adv === 'string' ? adv : adv.advantage || adv.name || '';

      for (const { pattern, attr } of attributePatterns) {
        if (pattern.test(text) && !attributes.find(a => a.label === attr)) {
          attributes.push({
            id: attr.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'),
            label: attr,
            description: `Clients who value ${attr.toLowerCase()}`,
            category: 'personality',
            selected: false,
            alignmentScore: 0
          });
          break;
        }
      }
    });

    return attributes;
  }

  /**
   * Extract attributes from transformations
   */
  private extractFromTransformations(transformations: any[]): BrandAttribute[] {
    const attributes: BrandAttribute[] = [];
    const emotionalPatterns = [
      { pattern: /anxious|worried|stressed|overwhelmed|confused/i, result: 'Reassuring & Clear' },
      { pattern: /cramped|limited|constrained|restricted/i, result: 'Freedom-Enabling' },
      { pattern: /isolated|alone|disconnected/i, result: 'Community-Building' },
      { pattern: /unsafe|insecure|vulnerable/i, result: 'Secure & Protective' },
      { pattern: /dated|outdated|old/i, result: 'Modern & Updated' },
      { pattern: /complicated|difficult|challenging/i, result: 'Simple & Easy' },
      { pattern: /uncertain|unsure|unclear/i, result: 'Confident & Clear' }
    ];

    transformations.slice(0, 5).forEach((trans: any) => {
      const fromState = typeof trans === 'object' ? trans.from || '' : '';

      for (const { pattern, result } of emotionalPatterns) {
        if (pattern.test(fromState) && !attributes.find(a => a.label === result)) {
          attributes.push({
            id: result.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'),
            label: result,
            description: `Clients seeking ${result.toLowerCase()} experiences`,
            category: 'personality',
            selected: false,
            alignmentScore: 0
          });
          break;
        }
      }
    });

    return attributes;
  }

  /**
   * Extract attributes from customer triggers
   */
  private extractFromTriggers(triggers: any[]): BrandAttribute[] {
    const attributes: BrandAttribute[] = [];
    const urgencyPatterns = [
      { pattern: /emergency|urgent|immediate|crisis/i, attr: 'Responsive & Available' },
      { pattern: /deadline|expir|time-sensitive/i, attr: 'Fast & Deadline-Focused' },
      { pattern: /growing|expanding|scaling/i, attr: 'Growth-Oriented' },
      { pattern: /life change|relocation|transition/i, attr: 'Life Transition Support' },
      { pattern: /problem|issue|trouble|difficulty/i, attr: 'Problem-Solving' }
    ];

    triggers.slice(0, 5).forEach((trigger: any) => {
      const text = typeof trigger === 'string' ? trigger : trigger.trigger || '';

      for (const { pattern, attr } of urgencyPatterns) {
        if (pattern.test(text) && !attributes.find(a => a.label === attr)) {
          attributes.push({
            id: attr.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'),
            label: attr,
            description: `Clients needing ${attr.toLowerCase()}`,
            category: 'personality',
            selected: false,
            alignmentScore: 0
          });
          break;
        }
      }
    });

    return attributes;
  }

  /**
   * Extract attributes from quality indicators
   */
  private extractFromQualityIndicators(indicators: any[]): BrandAttribute[] {
    const attributes: BrandAttribute[] = [];
    const qualityPatterns = [
      { pattern: /attention to detail|meticulous|thorough/i, attr: 'Detail-Oriented' },
      { pattern: /transparent|honest|upfront/i, attr: 'Transparent & Honest' },
      { pattern: /responsive|accessible|available/i, attr: 'Highly Responsive' },
      { pattern: /experience|years|veteran/i, attr: 'Experienced & Proven' }
    ];

    indicators.slice(0, 3).forEach((indicator: any) => {
      const text = typeof indicator === 'string' ? indicator : indicator.indicator || indicator.signal || '';

      for (const { pattern, attr } of qualityPatterns) {
        if (pattern.test(text) && !attributes.find(a => a.label === attr)) {
          attributes.push({
            id: attr.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'),
            label: attr,
            description: `Clients who value ${attr.toLowerCase()} service`,
            category: 'personality',
            selected: false,
            alignmentScore: 0
          });
          break;
        }
      }
    });

    return attributes;
  }

  /**
   * Deduplicate attributes
   */
  private deduplicateAttributes(attributes: BrandAttribute[]): BrandAttribute[] {
    const seen = new Map<string, BrandAttribute>();

    attributes.forEach(attr => {
      if (!seen.has(attr.id)) {
        seen.set(attr.id, attr);
      }
    });

    return Array.from(seen.values());
  }

  /**
   * Get base attributes for industry (DEPRECATED - kept for reference)
   */
  private getIndustryAttributes(industryCode: string): BrandAttribute[] {
    const attributeMap: Record<string, BrandAttribute[]> = {
      '541211': [ // CPA / Accounting
        {
          id: 'professional-trustworthy',
          label: 'Professional & Trustworthy',
          description: 'Clients who value reliability, accuracy, and ethical standards',
          category: 'personality',
          selected: false,
          alignmentScore: 0
        },
        {
          id: 'detail-oriented',
          label: 'Detail-Oriented & Thorough',
          description: 'Clients who appreciate meticulous attention to every number',
          category: 'personality',
          selected: false,
          alignmentScore: 0
        },
        {
          id: 'proactive-strategic',
          label: 'Proactive & Strategic',
          description: 'Clients seeking forward-thinking tax and financial planning',
          category: 'personality',
          selected: false,
          alignmentScore: 0
        },
        {
          id: 'personalized-responsive',
          label: 'Personalized & Responsive',
          description: 'Clients who want accessible, dedicated service',
          category: 'personality',
          selected: false,
          alignmentScore: 0
        },
        {
          id: 'tech-savvy',
          label: 'Tech-Savvy & Modern',
          description: 'Clients who appreciate digital tools and efficient processes',
          category: 'personality',
          selected: false,
          alignmentScore: 0
        }
      ],
      '541213': [ // Tax Preparation Services
        {
          id: 'professional-trustworthy',
          label: 'Professional & Trustworthy',
          description: 'Clients who value reliability, accuracy, and ethical standards',
          category: 'personality',
          selected: false,
          alignmentScore: 0
        },
        {
          id: 'detail-oriented',
          label: 'Detail-Oriented & Thorough',
          description: 'Clients who appreciate meticulous attention to every number',
          category: 'personality',
          selected: false,
          alignmentScore: 0
        },
        {
          id: 'proactive-strategic',
          label: 'Proactive & Strategic',
          description: 'Clients seeking forward-thinking tax and financial planning',
          category: 'personality',
          selected: false,
          alignmentScore: 0
        },
        {
          id: 'personalized-responsive',
          label: 'Personalized & Responsive',
          description: 'Clients who want accessible, dedicated service',
          category: 'personality',
          selected: false,
          alignmentScore: 0
        },
        {
          id: 'tech-savvy',
          label: 'Tech-Savvy & Modern',
          description: 'Clients who appreciate digital tools and efficient processes',
          category: 'personality',
          selected: false,
          alignmentScore: 0
        }
      ],
      '722511': [ // Fine Dining
        {
          id: 'refined',
          label: 'Refined & Sophisticated',
          description: 'Customers who appreciate artistry over efficiency',
          category: 'personality',
          selected: false,
          alignmentScore: 0
        },
        {
          id: 'bold',
          label: 'Bold & Avant-Garde',
          description: 'Customers who seek the unexpected and cutting-edge',
          category: 'personality',
          selected: false,
          alignmentScore: 0
        },
        {
          id: 'warm',
          label: 'Warm & Welcoming',
          description: 'Customers who value hospitality and personal connection',
          category: 'personality',
          selected: false,
          alignmentScore: 0
        },
        {
          id: 'exclusive',
          label: 'Exclusive & Prestigious',
          description: 'Customers seeking status and unique experiences',
          category: 'personality',
          selected: false,
          alignmentScore: 0
        },
        {
          id: 'sustainable',
          label: 'Sustainable & Conscious',
          description: 'Customers who prioritize ethical and local sourcing',
          category: 'personality',
          selected: false,
          alignmentScore: 0
        }
      ],
      '541611': [ // Management Consulting
        {
          id: 'strategic-analytical',
          label: 'Strategic & Analytical',
          description: 'Clients who value data-driven insights',
          category: 'personality',
          selected: false,
          alignmentScore: 0
        },
        {
          id: 'innovative-disruptive',
          label: 'Innovative & Disruptive',
          description: 'Clients seeking breakthrough solutions',
          category: 'personality',
          selected: false,
          alignmentScore: 0
        },
        {
          id: 'pragmatic-results',
          label: 'Pragmatic & Results-Focused',
          description: 'Clients who prioritize measurable outcomes',
          category: 'personality',
          selected: false,
          alignmentScore: 0
        },
        {
          id: 'collaborative-partner',
          label: 'Collaborative Partner',
          description: 'Clients who want hands-on partnership',
          category: 'personality',
          selected: false,
          alignmentScore: 0
        },
        {
          id: 'thought-leader',
          label: 'Thought Leader',
          description: 'Clients seeking cutting-edge industry expertise',
          category: 'personality',
          selected: false,
          alignmentScore: 0
        }
      ],
      '541810': [ // Advertising
        {
          id: 'creative-bold',
          label: 'Creative & Bold',
          description: 'Clients who value breakthrough creative work',
          category: 'personality',
          selected: false,
          alignmentScore: 0
        },
        {
          id: 'data-driven',
          label: 'Data-Driven & Strategic',
          description: 'Clients who want measurable marketing ROI',
          category: 'personality',
          selected: false,
          alignmentScore: 0
        },
        {
          id: 'agile-fast',
          label: 'Agile & Fast-Moving',
          description: 'Clients who need rapid campaign execution',
          category: 'personality',
          selected: false,
          alignmentScore: 0
        },
        {
          id: 'authentic-storyteller',
          label: 'Authentic Storyteller',
          description: 'Clients seeking genuine brand narratives',
          category: 'personality',
          selected: false,
          alignmentScore: 0
        },
        {
          id: 'integrated-holistic',
          label: 'Integrated & Holistic',
          description: 'Clients wanting comprehensive campaigns',
          category: 'personality',
          selected: false,
          alignmentScore: 0
        }
      ]
    };

    // Return industry-specific attributes, or generic fallback
    return attributeMap[industryCode] || this.getGenericAttributes();
  }

  /**
   * Get generic attributes as fallback
   */
  private getGenericAttributes(): BrandAttribute[] {
    return [
      {
        id: 'professional',
        label: 'Professional & Reliable',
        description: 'Clients who value dependability and expertise',
        category: 'personality',
        selected: false,
        alignmentScore: 0
      },
      {
        id: 'innovative',
        label: 'Innovative & Forward-Thinking',
        description: 'Clients seeking modern solutions',
        category: 'personality',
        selected: false,
        alignmentScore: 0
      },
      {
        id: 'customer-focused',
        label: 'Customer-Focused',
        description: 'Clients who appreciate personalized service',
        category: 'personality',
        selected: false,
        alignmentScore: 0
      },
      {
        id: 'results-driven',
        label: 'Results-Driven',
        description: 'Clients who prioritize tangible outcomes',
        category: 'personality',
        selected: false,
        alignmentScore: 0
      },
      {
        id: 'quality-focused',
        label: 'Quality-Focused',
        description: 'Clients who demand excellence',
        category: 'personality',
        selected: false,
        alignmentScore: 0
      }
    ];
  }

  /**
   * Calculate alignment score based on context
   */
  private calculateAlignmentScore(
    attribute: BrandAttribute,
    context: ValueForgeContext
  ): number {
    let score = 50; // Base score

    // Check detected archetype alignment
    const archetype = context.detectedArchetype;
    if (archetype) {
      const archetypeBoosts: Record<string, string[]> = {
        sage: ['professional-trustworthy', 'detail-oriented', 'strategic-analytical'],
        ruler: ['exclusive', 'professional-trustworthy', 'thought-leader'],
        caregiver: ['warm', 'personalized-responsive', 'customer-focused'],
        creator: ['bold', 'creative-bold', 'innovative-disruptive'],
        explorer: ['innovative-disruptive', 'agile-fast', 'bold'],
        hero: ['results-driven', 'proactive-strategic', 'pragmatic-results'],
        magician: ['innovative-disruptive', 'creative-bold', 'tech-savvy'],
        rebel: ['bold', 'innovative-disruptive', 'authentic-storyteller'],
        lover: ['warm', 'refined', 'authentic-storyteller'],
        jester: ['bold', 'warm', 'creative-bold'],
        everyperson: ['customer-focused', 'warm', 'personalized-responsive'],
        innocent: ['professional-trustworthy', 'sustainable', 'authentic-storyteller']
      };

      if (archetypeBoosts[archetype]?.includes(attribute.id)) {
        score += 30;
      }
    }

    // Check value proposition alignment
    const valueProps = context.detectedValueProps || [];
    const attrKeywords = attribute.label.toLowerCase().split(' ');

    valueProps.forEach((vp: string) => {
      const vpLower = vp.toLowerCase();
      attrKeywords.forEach(keyword => {
        if (vpLower.includes(keyword)) {
          score += 10;
        }
      });
    });

    // Check differentiators
    const differentiators = context.detectedDifferentiators || [];
    differentiators.forEach((diff: string) => {
      const diffLower = diff.toLowerCase();
      attrKeywords.forEach(keyword => {
        if (diffLower.includes(keyword)) {
          score += 15;
        }
      });
    });

    return Math.min(score, 100);
  }

  /**
   * Validate custom attribute
   */
  validateCustomAttribute(label: string, description: string): boolean {
    return (
      label.trim().length >= 3 &&
      label.trim().length <= 50 &&
      description.trim().length >= 10 &&
      description.trim().length <= 200
    );
  }

  /**
   * Create custom attribute
   */
  createCustomAttribute(
    label: string,
    description: string,
    context: ValueForgeContext
  ): BrandAttribute {
    const id = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const attribute: BrandAttribute = {
      id: `custom-${id}`,
      label: label.trim(),
      description: description.trim(),
      category: 'personality',
      selected: false,
      alignmentScore: 0
    };

    // Calculate alignment for custom attribute
    attribute.alignmentScore = this.calculateAlignmentScore(attribute, context);

    return attribute;
  }
}

export const attributeGenerationService = new AttributeGenerationService();
