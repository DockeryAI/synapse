/**
 * Persona Detection Service
 *
 * Detects and enriches buyer personas from:
 * - Industry Ideal Customer Profiles (ICPs)
 * - Review sentiment analysis
 * - Website targeting signals
 */

import type { BuyerPersona, Demographics, Psychographics, SituationalTriggers, PersonaMotivations, ValueForgeContext } from '@/types/valueForge';

export class PersonaDetectionService {
  /**
   * Detect buyer personas from context
   */
  detectPersonas(context: ValueForgeContext): BuyerPersona[] {
    const personas: BuyerPersona[] = [];

    // Load from industry ICPs (Ideal Customer Profiles)
    const industryPersonas = this.loadIndustryICPs(context);
    personas.push(...industryPersonas);

    // Enrich with review sentiment if available
    this.enrichWithReviews(personas, context);

    // Enrich with website targeting signals
    this.enrichWithWebsiteSignals(personas, context);

    // Calculate market sizes
    this.calculateMarketSizes(personas, context);

    return personas.slice(0, 3); // Return top 3
  }

  /**
   * Load personas from industry profiles
   */
  private loadIndustryICPs(context: ValueForgeContext): BuyerPersona[] {
    const industryProfile = context.industryProfile;
    if (!industryProfile?.idealCustomerProfiles) {
      return this.getDefaultPersonas(context);
    }

    return industryProfile.idealCustomerProfiles.map((icp: any, idx: number) => ({
      id: `persona-icp-${idx}`,
      name: icp.name || `Customer Segment ${idx + 1}`,
      demographics: this.parseDemographics(icp),
      psychographics: this.parsePsychographics(icp),
      situational: this.parseSituational(icp),
      motivations: this.parseMotivations(icp),
      confidence: 85,
      marketSize: icp.marketSize || undefined
    }));
  }

  /**
   * Get default personas when no industry data available
   */
  private getDefaultPersonas(context: ValueForgeContext): BuyerPersona[] {
    const industryCode = context.industryCode;

    // Default personas for common industries
    const defaults: Record<string, Partial<BuyerPersona>[]> = {
      '722511': [ // Fine Dining
        {
          name: 'Experience Seekers',
          demographics: {
            ageRange: '35-55',
            income: 'High ($150k+)',
            location: 'Urban/Suburban',
            occupation: 'Professional/Executive'
          },
          psychographics: {
            values: ['Quality', 'Authenticity', 'Experience'],
            lifestyle: 'Affluent, cultured, adventurous eaters',
            interests: ['Fine dining', 'Wine', 'Travel', 'Arts'],
            personality: ['Sophisticated', 'Discerning', 'Social']
          },
          situational: {
            triggers: ['Special occasions', 'Business entertainment', 'Date nights'],
            frequency: 'Monthly',
            timeframe: 'Planning 1-2 weeks ahead'
          },
          motivations: {
            hopes: ['Memorable experiences', 'Impressing guests', 'Discovering new flavors'],
            needs: ['Exceptional service', 'Ambiance', 'Unique menu'],
            dreams: ['Being part of an exclusive community', 'Culinary expertise'],
            fears: ['Disappointing experience', 'Poor value for money', 'Looking unsophisticated']
          }
        }
      ],
      '541611': [ // Management Consulting
        {
          name: 'Growth-Focused Executives',
          demographics: {
            ageRange: '40-60',
            income: 'High ($200k+)',
            location: 'Major metro areas',
            occupation: 'C-Suite/VP'
          },
          psychographics: {
            values: ['Results', 'Innovation', 'Efficiency'],
            lifestyle: 'Fast-paced, ambitious, data-driven',
            interests: ['Business strategy', 'Leadership', 'Technology'],
            personality: ['Decisive', 'Strategic', 'Achievement-oriented']
          },
          situational: {
            triggers: ['Business challenges', 'Growth plateaus', 'Market disruption'],
            frequency: 'As needed',
            timeframe: 'Immediate to 3 months'
          },
          motivations: {
            hopes: ['Business transformation', 'Competitive advantage', 'Team excellence'],
            needs: ['Expert guidance', 'Proven frameworks', 'Quick wins'],
            dreams: ['Industry leadership', 'Sustainable growth', 'Legacy building'],
            fears: ['Wrong decisions', 'Wasted investment', 'Falling behind competitors']
          }
        }
      ]
    };

    const industryDefaults = defaults[industryCode] || [{
      name: 'Primary Customer',
      demographics: {
        ageRange: '25-65',
        income: 'Middle to High',
        location: 'Various',
        occupation: 'Professional'
      },
      psychographics: {
        values: ['Quality', 'Value', 'Service'],
        lifestyle: 'Busy, seeking solutions',
        interests: ['Industry-specific'],
        personality: ['Practical', 'Discerning']
      },
      situational: {
        triggers: ['Specific needs', 'Pain points'],
        frequency: 'Varies',
        timeframe: 'When needed'
      },
      motivations: {
        hopes: ['Desired outcomes'],
        needs: ['Reliable solutions'],
        dreams: ['Success in their goals'],
        fears: ['Wrong choice', 'Wasted resources']
      }
    }];

    return industryDefaults.map((def, idx) => ({
      id: `persona-default-${idx}`,
      name: def.name!,
      demographics: def.demographics!,
      psychographics: def.psychographics!,
      situational: def.situational!,
      motivations: def.motivations!,
      confidence: 60
    }));
  }

  /**
   * Parse demographics from ICP data
   */
  private parseDemographics(icp: any): Demographics {
    return {
      ageRange: icp.age || icp.ageRange || 'Not specified',
      income: icp.income || icp.incomeLevel || 'Not specified',
      location: icp.location || icp.geography || 'Not specified',
      occupation: icp.occupation || icp.jobTitle || 'Not specified'
    };
  }

  /**
   * Parse psychographics from ICP data
   */
  private parsePsychographics(icp: any): Psychographics {
    return {
      values: icp.values || icp.coreValues || [],
      lifestyle: icp.lifestyle || icp.lifestyleDescription || '',
      interests: icp.interests || icp.hobbies || [],
      personality: icp.personality || icp.personalityTraits || []
    };
  }

  /**
   * Parse situational triggers from ICP data
   */
  private parseSituational(icp: any): SituationalTriggers {
    return {
      triggers: icp.triggers || icp.buyingTriggers || [],
      frequency: icp.frequency || icp.purchaseFrequency || '',
      timeframe: icp.timeframe || icp.decisionTimeframe || ''
    };
  }

  /**
   * Parse motivations from ICP data
   */
  private parseMotivations(icp: any): PersonaMotivations {
    return {
      hopes: icp.hopes || icp.aspirations || [],
      needs: icp.needs || icp.requirements || [],
      dreams: icp.dreams || icp.goals || [],
      fears: icp.fears || icp.concerns || []
    };
  }

  /**
   * Enrich personas with review sentiment data
   */
  private enrichWithReviews(personas: BuyerPersona[], context: ValueForgeContext) {
    const reviewData = context.businessIntel?.reviews;
    if (!reviewData) return;

    // Extract common themes from reviews
    const positiveThemes = this.extractThemes(reviewData.positive || []);
    const negativeThemes = this.extractThemes(reviewData.negative || []);

    personas.forEach(persona => {
      // Add to hopes based on positive themes
      if (positiveThemes.length > 0) {
        persona.motivations.hopes = [
          ...persona.motivations.hopes,
          ...positiveThemes.slice(0, 2)
        ];
      }

      // Add to fears based on negative themes
      if (negativeThemes.length > 0) {
        persona.motivations.fears = [
          ...persona.motivations.fears,
          ...negativeThemes.slice(0, 2).map(theme => `Avoiding ${theme}`)
        ];
      }
    });
  }

  /**
   * Extract themes from review text
   */
  private extractThemes(reviews: string[]): string[] {
    // Simple keyword extraction - in production, use NLP
    const themes = new Set<string>();
    const keywords = [
      'quality', 'service', 'price', 'value', 'experience',
      'staff', 'atmosphere', 'location', 'timing', 'results'
    ];

    reviews.forEach(review => {
      const lowerReview = review.toLowerCase();
      keywords.forEach(keyword => {
        if (lowerReview.includes(keyword)) {
          themes.add(keyword);
        }
      });
    });

    return Array.from(themes);
  }

  /**
   * Enrich personas with website targeting signals
   */
  private enrichWithWebsiteSignals(personas: BuyerPersona[], context: ValueForgeContext) {
    const websiteAnalysis = context.businessIntel?.website_analysis;
    if (!websiteAnalysis) return;

    // Extract target audience signals
    if (websiteAnalysis.targetAudience) {
      websiteAnalysis.targetAudience.forEach((audience: string, idx: number) => {
        if (personas[idx]) {
          // Enrich personality traits
          if (audience.toLowerCase().includes('professional')) {
            personas[idx].psychographics.personality.push('Professional');
          }
          if (audience.toLowerCase().includes('premium')) {
            personas[idx].psychographics.values.push('Premium Quality');
          }
        }
      });
    }
  }

  /**
   * Calculate market sizes for personas
   */
  private calculateMarketSizes(personas: BuyerPersona[], context: ValueForgeContext) {
    const totalMarket = context.industryProfile?.marketSize || 1000000;

    // Simple distribution: Primary 50%, Secondary 30%, Tertiary 20%
    const distribution = [0.5, 0.3, 0.2];

    personas.forEach((persona, idx) => {
      if (!persona.marketSize) {
        persona.marketSize = Math.round(totalMarket * (distribution[idx] || 0.1));
      }
    });
  }

  /**
   * Validate persona completeness
   */
  validatePersona(persona: BuyerPersona): { valid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];

    if (!persona.name) missingFields.push('name');
    if (!persona.demographics.ageRange) missingFields.push('demographics.ageRange');
    if (persona.motivations.hopes.length === 0) missingFields.push('motivations.hopes');
    if (persona.motivations.fears.length === 0) missingFields.push('motivations.fears');

    return {
      valid: missingFields.length === 0,
      missingFields
    };
  }
}

export const personaDetectionService = new PersonaDetectionService();
