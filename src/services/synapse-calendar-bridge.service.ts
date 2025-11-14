/**
 * Synapse Calendar Bridge Service
 *
 * Transforms Synapse intelligence data into calendar-ready content.
 * Connects the intelligence gathering layer with the content calendar system.
 *
 * Key responsibilities:
 * - Extract content pillars from intelligence and specialty data
 * - Generate 30 content ideas based on specialty, intelligence, buyer personas
 * - Detect opportunities from intelligence data (weather, trends, competitors, seasonal)
 * - Transform raw intelligence into structured calendar format
 */

import { ContentItem, Platform, OpportunityType } from '../types/content-calendar.types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface IntelligenceResult {
  source: string;
  data: any;
  success: boolean;
  duration: number;
  error?: string;
}

export interface SpecialtyDetection {
  industry: string;
  specialty: string;
  nicheKeywords: string[];
  targetMarket: string;
  confidence: number;
  reasoning: string;
  industryProfileId?: string; // Links to industry_profiles table
}

export interface BridgeConfig {
  brandId: string;
  intelligenceData: IntelligenceResult[];
  specialty: SpecialtyDetection;
  startDate: Date;
  endDate: Date;
}

export interface ContentPillar {
  id: string;
  name: string;
  description: string;
  percentage: number; // Distribution percentage (e.g., 40% educational)
  color: string; // For UI visualization
  examples: string[]; // Example topics for this pillar
}

export interface Opportunity {
  id: string;
  type: OpportunityType;
  title: string;
  description: string;
  impactScore: number; // 0-100
  urgency: 'low' | 'medium' | 'high' | 'critical';
  expiresAt?: Date;
  source: string; // Which intelligence source detected this
  suggestedActions: string[];
}

export interface CalendarReadyContent {
  contentIdeas: ContentIdea[];
  pillars: ContentPillar[];
  opportunities: Opportunity[];
  metadata: {
    intelligenceSources: number;
    specialtyDetected: boolean;
    confidenceScore: number;
    generatedAt: Date;
  };
}

export interface ContentIdea {
  topic: string;
  platform: Platform;
  pillarId: string;
  suggestedDate: Date;
  reasoning: string; // Why this topic, why this time
  intelligenceSource: string[]; // Which sources contributed
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export class SynapseCalendarBridge {
  /**
   * Main entry point: Transform intelligence data into calendar-ready content
   */
  async transformIntelligence(
    config: BridgeConfig
  ): Promise<CalendarReadyContent> {
    // 1. Extract content pillars from intelligence
    const pillars = this.extractPillars(config);

    // 2. Generate 30 content ideas
    const ideas = this.generateIdeas(config, pillars);

    // 3. Detect opportunities from intelligence
    const opportunities = this.detectOpportunities(config);

    return {
      contentIdeas: ideas,
      pillars,
      opportunities,
      metadata: this.buildMetadata(config)
    };
  }

  /**
   * Extract 3-5 content pillars from specialty and intelligence data
   * Pillars are the foundational themes that organize content
   */
  private extractPillars(config: BridgeConfig): ContentPillar[] {
    const { specialty, intelligenceData } = config;

    // Base pillars from specialty
    const pillars: ContentPillar[] = [];

    // Extract pillars based on specialty (e.g., for "wedding bakery")
    if (specialty.specialty) {
      // Pillar 1: Specialty showcase (e.g., "Custom Wedding Cakes")
      pillars.push({
        id: 'specialty-showcase',
        name: `${specialty.specialty} Showcase`,
        description: `Highlight your specialty in ${specialty.specialty}`,
        percentage: 30,
        color: '#3b82f6', // blue
        examples: [
          `Our signature ${specialty.specialty} process`,
          `What makes our ${specialty.specialty} unique`,
          `Recent ${specialty.specialty} projects`
        ]
      });
    }

    // Pillar 2: Educational content
    pillars.push({
      id: 'educational',
      name: 'Educational Content',
      description: 'Teach your audience about your industry',
      percentage: 40,
      color: '#10b981', // green
      examples: [
        'Industry tips and tricks',
        'Common misconceptions',
        'How-to guides',
        'FAQs answered'
      ]
    });

    // Pillar 3: Customer stories and social proof
    const hasReviews = intelligenceData.some(
      r => r.source === 'outscaper' && r.success
    );

    if (hasReviews) {
      pillars.push({
        id: 'social-proof',
        name: 'Customer Stories',
        description: 'Showcase customer success stories and testimonials',
        percentage: 20,
        color: '#f59e0b', // amber
        examples: [
          'Customer testimonials',
          'Before and after stories',
          'Case studies',
          'Review highlights'
        ]
      });
    }

    // Pillar 4: Behind the scenes
    pillars.push({
      id: 'behind-scenes',
      name: 'Behind the Scenes',
      description: 'Show the human side of your business',
      percentage: 10,
      color: '#8b5cf6', // purple
      examples: [
        'Team introductions',
        'Day in the life',
        'Process walkthroughs',
        'Company culture'
      ]
    });

    return pillars.slice(0, 5); // Max 5 pillars
  }

  /**
   * Generate 30 content ideas using:
   * - Specialty detection
   * - Intelligence insights
   * - Buyer personas
   * - Platform optimization
   */
  private generateIdeas(
    config: BridgeConfig,
    pillars: ContentPillar[]
  ): ContentIdea[] {
    const { specialty, startDate, endDate } = config;
    const ideas: ContentIdea[] = [];

    // Calculate days in range
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const targetCount = Math.min(days, 30); // Generate up to 30 ideas

    // Distribute ideas across pillars
    pillars.forEach(pillar => {
      const pillarCount = Math.round((pillar.percentage / 100) * targetCount);

      for (let i = 0; i < pillarCount; i++) {
        const daysOffset = Math.floor((ideas.length / targetCount) * days);
        const suggestedDate = new Date(startDate);
        suggestedDate.setDate(suggestedDate.getDate() + daysOffset);

        // Rotate through platforms
        const platforms: Platform[] = ['instagram', 'linkedin', 'facebook', 'twitter'];
        const platform = platforms[ideas.length % platforms.length];

        ideas.push({
          topic: this.generateTopicForPillar(pillar, specialty, i),
          platform,
          pillarId: pillar.id,
          suggestedDate,
          reasoning: `${pillar.name} content, optimized for ${platform}`,
          intelligenceSource: ['specialty-detection', 'content-strategy']
        });
      }
    });

    return ideas.slice(0, targetCount);
  }

  /**
   * Generate a specific topic for a pillar
   */
  private generateTopicForPillar(
    pillar: ContentPillar,
    specialty: SpecialtyDetection,
    index: number
  ): string {
    const example = pillar.examples[index % pillar.examples.length];

    // Personalize with specialty keywords
    if (specialty.nicheKeywords && specialty.nicheKeywords.length > 0) {
      const keyword = specialty.nicheKeywords[index % specialty.nicheKeywords.length];
      return example.replace('our', `our ${keyword}`);
    }

    return example;
  }

  /**
   * Detect opportunities from intelligence data:
   * - Weather-based (sunny weekend → outdoor events)
   * - Trending topics (from Serper)
   * - Seasonal events (from calendar data)
   * - Competitor gaps (from competitive intelligence)
   */
  private detectOpportunities(config: BridgeConfig): Opportunity[] {
    const opportunities: Opportunity[] = [];

    // Extract opportunities from each intelligence source
    config.intelligenceData.forEach(intel => {
      if (!intel.success) return;

      switch (intel.source) {
        case 'serper':
          opportunities.push(...this.detectTrendingOpportunities(intel.data));
          break;
        case 'weather':
          opportunities.push(...this.detectWeatherOpportunities(intel.data));
          break;
        case 'news':
          opportunities.push(...this.detectNewsOpportunities(intel.data));
          break;
        case 'competitive':
          opportunities.push(...this.detectCompetitorOpportunities(intel.data));
          break;
      }
    });

    // Sort by impact score (highest first)
    return opportunities.sort((a, b) => b.impactScore - a.impactScore);
  }

  /**
   * Detect trending topic opportunities
   */
  private detectTrendingOpportunities(data: any): Opportunity[] {
    // Stub - would analyze Serper trends data
    return [];
  }

  /**
   * Detect weather-based opportunities
   */
  private detectWeatherOpportunities(data: any): Opportunity[] {
    // Stub - would analyze weather forecasts
    return [];
  }

  /**
   * Detect news-based opportunities
   */
  private detectNewsOpportunities(data: any): Opportunity[] {
    // Stub - would analyze news articles
    return [];
  }

  /**
   * Detect competitor gap opportunities
   */
  private detectCompetitorOpportunities(data: any): Opportunity[] {
    // Stub - would analyze competitor activity
    return [];
  }

  /**
   * Build metadata about the intelligence transformation
   */
  private buildMetadata(config: BridgeConfig) {
    const successfulSources = config.intelligenceData.filter(r => r.success);

    return {
      intelligenceSources: successfulSources.length,
      specialtyDetected: config.specialty.confidence > 50,
      confidenceScore: config.specialty.confidence,
      generatedAt: new Date()
    };
  }
}

// ============================================================================
// FACTORY
// ============================================================================

let bridgeInstance: SynapseCalendarBridge | null = null;

export const createSynapseCalendarBridge = (): SynapseCalendarBridge => {
  if (!bridgeInstance) {
    bridgeInstance = new SynapseCalendarBridge();
  }
  return bridgeInstance;
};
