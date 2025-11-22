/**
 * Campaign Arc Generator Service
 * Generates complete campaign arcs with content for all pieces
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  Campaign,
  CampaignPiece,
  CampaignPurpose,
  EmotionalTrigger,
  CampaignTemplate,
} from '@/types/v2';
import { performancePredictor } from './performance-predictor.service';

export interface ArcGeneratorConfig {
  startDate: Date;
  targetAudience: string;
  primaryGoal: string;
  industryCode?: string;
  customConstraints?: {
    maxPieces?: number;
    intervalDays?: number;
    excludeTriggers?: EmotionalTrigger[];
  };
}

export interface BrandContext {
  brandId: string;
  brandName: string;
  industry: string;
  uvp?: string;
  targetAudience?: string;
  tone?: string;
}

export interface GeneratedArc {
  campaign: Campaign;
  pieces: CampaignPiece[];
  emotionalProgression: {
    score: number;
    flow: EmotionalTrigger[];
    suggestions: string[];
  };
  timeline: {
    startDate: Date;
    endDate: Date;
    totalDuration: number;
  };
}

export interface EmotionalProgressionResult {
  score: number;
  flow: EmotionalTrigger[];
  issues: string[];
  suggestions: string[];
}

export interface TimelineOptimizationResult {
  pieces: CampaignPiece[];
  optimizations: string[];
  totalDuration: number;
}

// Campaign template definitions for arc generation
const CAMPAIGN_TEMPLATES: Record<string, {
  name: string;
  pieces: number;
  duration: number;
  emotionalArc: EmotionalTrigger[];
  structure: string[];
}> = {
  race_journey: {
    name: 'RACE Journey',
    pieces: 4,
    duration: 14,
    emotionalArc: ['curiosity', 'trust', 'desire', 'urgency'],
    structure: ['Reach', 'Act', 'Convert', 'Engage'],
  },
  pas_series: {
    name: 'PAS Series',
    pieces: 3,
    duration: 7,
    emotionalArc: ['fear', 'hope', 'desire'],
    structure: ['Problem', 'Agitate', 'Solution'],
  },
  bab_campaign: {
    name: 'BAB Campaign',
    pieces: 3,
    duration: 7,
    emotionalArc: ['frustration', 'hope', 'desire'],
    structure: ['Before', 'After', 'Bridge'],
  },
  trust_ladder: {
    name: 'Trust Ladder',
    pieces: 5,
    duration: 21,
    emotionalArc: ['curiosity', 'trust', 'trust', 'desire', 'urgency'],
    structure: ['Introduction', 'Credibility', 'Social Proof', 'Value', 'Close'],
  },
  heros_journey: {
    name: "Hero's Journey",
    pieces: 5,
    duration: 21,
    emotionalArc: ['curiosity', 'fear', 'hope', 'triumph', 'inspiration'],
    structure: ['Call to Adventure', 'Challenge', 'Transformation', 'Victory', 'Return'],
  },
  product_launch: {
    name: 'Product Launch',
    pieces: 4,
    duration: 14,
    emotionalArc: ['curiosity', 'desire', 'urgency', 'excitement'],
    structure: ['Teaser', 'Reveal', 'Benefits', 'Launch'],
  },
  seasonal_urgency: {
    name: 'Seasonal Urgency',
    pieces: 3,
    duration: 7,
    emotionalArc: ['curiosity', 'desire', 'urgency'],
    structure: ['Context', 'Opportunity', 'Deadline'],
  },
  authority_builder: {
    name: 'Authority Builder',
    pieces: 4,
    duration: 14,
    emotionalArc: ['curiosity', 'trust', 'respect', 'desire'],
    structure: ['Expertise', 'Proof', 'Insight', 'Offer'],
  },
  comparison_campaign: {
    name: 'Comparison Campaign',
    pieces: 3,
    duration: 7,
    emotionalArc: ['curiosity', 'clarity', 'confidence'],
    structure: ['Options', 'Analysis', 'Recommendation'],
  },
  education_first: {
    name: 'Education First',
    pieces: 4,
    duration: 14,
    emotionalArc: ['curiosity', 'understanding', 'confidence', 'desire'],
    structure: ['Problem', 'Education', 'Application', 'Next Steps'],
  },
  social_proof: {
    name: 'Social Proof',
    pieces: 4,
    duration: 14,
    emotionalArc: ['curiosity', 'trust', 'desire', 'confidence'],
    structure: ['Promise', 'Testimonials', 'Results', 'Invitation'],
  },
  objection_crusher: {
    name: 'Objection Crusher',
    pieces: 4,
    duration: 14,
    emotionalArc: ['acknowledgment', 'understanding', 'resolution', 'confidence'],
    structure: ['Acknowledge', 'Empathize', 'Address', 'Reassure'],
  },
  quick_win_campaign: {
    name: 'Quick Win',
    pieces: 3,
    duration: 5,
    emotionalArc: ['curiosity', 'excitement', 'satisfaction'],
    structure: ['Promise', 'Method', 'Result'],
  },
  scarcity_sequence: {
    name: 'Scarcity Sequence',
    pieces: 4,
    duration: 7,
    emotionalArc: ['curiosity', 'desire', 'fear', 'urgency'],
    structure: ['Value', 'Limitation', 'Consequence', 'Action'],
  },
  value_stack: {
    name: 'Value Stack',
    pieces: 4,
    duration: 14,
    emotionalArc: ['curiosity', 'desire', 'excitement', 'urgency'],
    structure: ['Core Offer', 'Bonus 1', 'Bonus 2', 'Complete Package'],
  },
};

export class CampaignArcGeneratorService {
  /**
   * Generate a complete campaign arc from a template
   */
  generateArc(
    templateId: string,
    brandContext: BrandContext,
    config: ArcGeneratorConfig
  ): GeneratedArc {
    const template = CAMPAIGN_TEMPLATES[templateId];
    if (!template) {
      throw new Error(`Unknown campaign template: ${templateId}`);
    }

    // Create campaign
    const campaignId = uuidv4();
    const campaign: Campaign = {
      id: campaignId,
      brandId: brandContext.brandId,
      name: `${template.name} - ${brandContext.brandName}`,
      purpose: this.mapTemplateToPurpose(templateId),
      templateId,
      status: 'draft',
      startDate: config.startDate,
      endDate: this.calculateEndDate(config.startDate, template.duration),
      targetAudience: config.targetAudience,
      pieces: [],
      arc: {
        totalPieces: template.pieces,
        completedPieces: 0,
        emotionalProgression: template.emotionalArc,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Generate pieces
    const pieces = this.generatePieces(
      campaign,
      template,
      brandContext,
      config
    );

    // Calculate emotional progression
    const emotionalProgression = this.calculateEmotionalProgression(pieces);

    // Optimize timeline if needed
    const optimizedPieces = this.optimizeTimeline(pieces, config.customConstraints);

    // Update campaign with pieces
    campaign.pieces = optimizedPieces.pieces.map(p => p.id);

    return {
      campaign,
      pieces: optimizedPieces.pieces,
      emotionalProgression: {
        score: emotionalProgression.score,
        flow: emotionalProgression.flow,
        suggestions: emotionalProgression.suggestions,
      },
      timeline: {
        startDate: config.startDate,
        endDate: campaign.endDate,
        totalDuration: template.duration,
      },
    };
  }

  /**
   * Generate all pieces for a campaign
   */
  private generatePieces(
    campaign: Campaign,
    template: typeof CAMPAIGN_TEMPLATES[string],
    brandContext: BrandContext,
    config: ArcGeneratorConfig
  ): CampaignPiece[] {
    const pieces: CampaignPiece[] = [];
    const intervalDays = config.customConstraints?.intervalDays ||
      Math.floor(template.duration / template.pieces);

    for (let i = 0; i < template.pieces; i++) {
      const scheduledDate = new Date(config.startDate);
      scheduledDate.setDate(scheduledDate.getDate() + (i * intervalDays));

      const piece = this.generatePieceContent(
        {
          structure: template.structure[i],
          emotionalTrigger: template.emotionalArc[i],
          position: i,
          total: template.pieces,
        },
        brandContext,
        campaign.id,
        scheduledDate
      );

      pieces.push(piece);
    }

    return pieces;
  }

  /**
   * Generate content for a single piece
   */
  generatePieceContent(
    pieceTemplate: {
      structure: string;
      emotionalTrigger: EmotionalTrigger;
      position: number;
      total: number;
    },
    brandContext: BrandContext,
    campaignId: string,
    scheduledDate: Date
  ): CampaignPiece {
    const { structure, emotionalTrigger, position, total } = pieceTemplate;

    // Determine piece type based on position
    const pieceType = position === 0 ? 'opening' :
                      position === total - 1 ? 'closing' : 'middle';

    // Generate title based on structure and brand
    const title = this.generatePieceTitle(structure, brandContext, pieceType);

    // Generate content based on emotional trigger and position
    const content = this.generatePieceBody(
      structure,
      emotionalTrigger,
      brandContext,
      pieceType
    );

    // Get performance prediction
    const prediction = performancePredictor.predictPerformance(
      emotionalTrigger,
      'campaign',
      brandContext.industry
    );

    return {
      id: uuidv4(),
      campaignId,
      phaseId: `phase-${position + 1}`,
      title,
      content,
      emotionalTrigger,
      scheduledDate,
      status: 'pending',
      channel: 'linkedin', // Default channel
      pieceOrder: position,
      templateId: structure.toLowerCase().replace(/\s+/g, '_'),
      performancePrediction: {
        expectedCTR: prediction.expectedCTR,
        expectedEngagement: prediction.expectedEngagement,
        expectedConversion: prediction.expectedConversion,
        confidenceScore: prediction.confidenceScore,
      },
    };
  }

  /**
   * Calculate emotional progression score and analysis
   */
  calculateEmotionalProgression(pieces: CampaignPiece[]): EmotionalProgressionResult {
    const triggers = pieces.map(p => p.emotionalTrigger);
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Check for repeated triggers
    const triggerCounts = new Map<EmotionalTrigger, number>();
    triggers.forEach(t => {
      triggerCounts.set(t, (triggerCounts.get(t) || 0) + 1);
    });

    triggerCounts.forEach((count, trigger) => {
      if (count > 2) {
        issues.push(`Trigger "${trigger}" repeated ${count} times`);
        score -= 10 * (count - 2);
        suggestions.push(`Consider replacing some "${trigger}" triggers with variety`);
      }
    });

    // Check for emotional flow
    const hasOpening = ['curiosity', 'frustration', 'fear'].includes(triggers[0]);
    const hasClosing = ['urgency', 'confidence', 'desire', 'satisfaction'].includes(
      triggers[triggers.length - 1]
    );

    if (!hasOpening) {
      issues.push('Opening piece should create curiosity or tension');
      score -= 10;
      suggestions.push('Start with curiosity, frustration, or fear trigger');
    }

    if (!hasClosing) {
      issues.push('Closing piece should drive action');
      score -= 10;
      suggestions.push('End with urgency, confidence, or desire trigger');
    }

    // Check for emotional variety
    const uniqueTriggers = new Set(triggers).size;
    const varietyRatio = uniqueTriggers / triggers.length;
    if (varietyRatio < 0.6) {
      issues.push('Emotional variety is low');
      score -= 15;
      suggestions.push('Increase variety of emotional triggers');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      flow: triggers,
      issues,
      suggestions,
    };
  }

  /**
   * Optimize timeline for piece scheduling
   */
  optimizeTimeline(
    pieces: CampaignPiece[],
    constraints?: ArcGeneratorConfig['customConstraints']
  ): TimelineOptimizationResult {
    const optimizations: string[] = [];
    let optimizedPieces = [...pieces];

    // Apply max pieces constraint
    if (constraints?.maxPieces && pieces.length > constraints.maxPieces) {
      optimizedPieces = pieces.slice(0, constraints.maxPieces);
      optimizations.push(`Reduced from ${pieces.length} to ${constraints.maxPieces} pieces`);
    }

    // Apply interval constraint
    if (constraints?.intervalDays) {
      optimizedPieces = optimizedPieces.map((piece, i) => {
        if (i === 0) return piece;
        const newDate = new Date(optimizedPieces[0].scheduledDate);
        newDate.setDate(newDate.getDate() + (i * constraints.intervalDays!));
        return { ...piece, scheduledDate: newDate };
      });
      optimizations.push(`Applied ${constraints.intervalDays}-day intervals`);
    }

    // Remove excluded triggers
    if (constraints?.excludeTriggers?.length) {
      const filtered = optimizedPieces.filter(
        p => !constraints.excludeTriggers!.includes(p.emotionalTrigger)
      );
      if (filtered.length < optimizedPieces.length) {
        optimizations.push(`Removed ${optimizedPieces.length - filtered.length} pieces with excluded triggers`);
        optimizedPieces = filtered;
      }
    }

    // Calculate total duration
    const firstDate = optimizedPieces[0]?.scheduledDate || new Date();
    const lastDate = optimizedPieces[optimizedPieces.length - 1]?.scheduledDate || new Date();
    const totalDuration = Math.ceil(
      (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      pieces: optimizedPieces,
      optimizations,
      totalDuration,
    };
  }

  /**
   * Map template ID to campaign purpose
   */
  private mapTemplateToPurpose(templateId: string): CampaignPurpose {
    const purposeMap: Record<string, CampaignPurpose> = {
      race_journey: 'conversion',
      pas_series: 'conversion',
      bab_campaign: 'conversion',
      trust_ladder: 'nurture',
      heros_journey: 'brand_story',
      product_launch: 'launch',
      seasonal_urgency: 'promotion',
      authority_builder: 'authority',
      comparison_campaign: 'education',
      education_first: 'education',
      social_proof: 'trust',
      objection_crusher: 'conversion',
      quick_win_campaign: 'engagement',
      scarcity_sequence: 'promotion',
      value_stack: 'conversion',
    };
    return purposeMap[templateId] || 'general';
  }

  /**
   * Calculate end date from start date and duration
   */
  private calculateEndDate(startDate: Date, duration: number): Date {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);
    return endDate;
  }

  /**
   * Generate piece title based on structure and brand
   */
  private generatePieceTitle(
    structure: string,
    brandContext: BrandContext,
    pieceType: 'opening' | 'middle' | 'closing'
  ): string {
    const templates: Record<string, Record<string, string>> = {
      opening: {
        'Reach': `Discover How ${brandContext.brandName} Transforms Your Results`,
        'Problem': `The Hidden Challenge Facing ${brandContext.targetAudience || 'You'}`,
        'Before': `Life Before ${brandContext.brandName}`,
        'Introduction': `Meet ${brandContext.brandName}: Your New Partner`,
        'Call to Adventure': `Your Journey to Success Starts Here`,
        'Teaser': `Something Big is Coming from ${brandContext.brandName}`,
        'Context': `Why This Moment Matters`,
        'Expertise': `${brandContext.brandName}'s Proven Approach`,
        'Options': `Comparing Your Choices`,
        'Promise': `What ${brandContext.brandName} Delivers`,
        'Acknowledge': `We Hear Your Concerns`,
        'Value': `The Core Value of ${brandContext.brandName}`,
      },
      middle: {
        'Act': `Taking Action with ${brandContext.brandName}`,
        'Agitate': `Why This Problem Won't Solve Itself`,
        'After': `Life After ${brandContext.brandName}`,
        'Credibility': `Why Trust ${brandContext.brandName}`,
        'Social Proof': `Real Results from Real People`,
        'Challenge': `Overcoming the Obstacles`,
        'Transformation': `The Turning Point`,
        'Reveal': `Introducing Our Solution`,
        'Benefits': `What You'll Gain`,
        'Opportunity': `Your Window of Opportunity`,
        'Proof': `The Evidence Speaks`,
        'Insight': `Expert Insights from ${brandContext.brandName}`,
        'Analysis': `Breaking Down the Options`,
        'Education': `Understanding the Solution`,
        'Application': `Putting Knowledge to Work`,
        'Testimonials': `What Others Are Saying`,
        'Results': `Proven Results`,
        'Empathize': `We Understand Your Hesitation`,
        'Address': `Here's the Truth`,
        'Method': `The ${brandContext.brandName} Method`,
        'Limitation': `Limited Availability`,
        'Consequence': `What You Risk by Waiting`,
        'Bonus 1': `Added Value: First Bonus`,
        'Bonus 2': `Even More: Second Bonus`,
      },
      closing: {
        'Convert': `Take the Next Step with ${brandContext.brandName}`,
        'Engage': `Join the ${brandContext.brandName} Community`,
        'Solution': `Your Solution Awaits`,
        'Bridge': `How to Get Started`,
        'Value': `The Complete ${brandContext.brandName} Experience`,
        'Close': `Your Decision Point`,
        'Victory': `Achieving Success`,
        'Return': `Share Your Success Story`,
        'Launch': `It's Here: Get Started Now`,
        'Deadline': `Act Now: Time is Limited`,
        'Offer': `Your Exclusive Opportunity`,
        'Recommendation': `Our Recommendation`,
        'Next Steps': `Your Action Plan`,
        'Invitation': `Join Us Today`,
        'Reassure': `You're Making the Right Choice`,
        'Result': `Your Quick Win Awaits`,
        'Action': `Secure Your Spot Now`,
        'Complete Package': `Everything You Need`,
      },
    };

    return templates[pieceType]?.[structure] ||
           `${structure}: ${brandContext.brandName}`;
  }

  /**
   * Generate piece body content
   */
  private generatePieceBody(
    structure: string,
    emotionalTrigger: EmotionalTrigger,
    brandContext: BrandContext,
    pieceType: 'opening' | 'middle' | 'closing'
  ): string {
    const triggerPhrases: Record<EmotionalTrigger, string> = {
      curiosity: 'Have you ever wondered',
      fear: 'Don\'t let this happen to you',
      hope: 'Imagine a better way',
      desire: 'You deserve this',
      urgency: 'Time is running out',
      trust: 'Here\'s why you can count on us',
      frustration: 'Tired of the same old problems?',
      triumph: 'Success is within reach',
      inspiration: 'You have the power to change',
      excitement: 'Get ready for something amazing',
      confidence: 'You\'re making the right choice',
      understanding: 'Let us explain',
      clarity: 'Now it all makes sense',
      acknowledgment: 'We hear you',
      resolution: 'Here\'s the answer',
      satisfaction: 'You did it',
      respect: 'You\'ve earned this',
    };

    const openingLine = triggerPhrases[emotionalTrigger] || 'Here\'s what you need to know';

    const bodyTemplates: Record<string, string> = {
      opening: `${openingLine}?\n\n${brandContext.uvp || `${brandContext.brandName} helps ${brandContext.targetAudience || 'you'} achieve more.`}\n\nIn this series, we'll show you exactly how to transform your results.\n\nStay tuned for the next piece where we dive deeper.`,
      middle: `${openingLine}.\n\nAt ${brandContext.brandName}, we understand that ${brandContext.targetAudience || 'our clients'} need real solutions.\n\nHere's what makes our approach different:\n\n• Proven methodology\n• Real results\n• Expert support\n\nNext up: The transformation you've been waiting for.`,
      closing: `${openingLine}.\n\nYou've seen the evidence. You understand the value. Now it's time to act.\n\n${brandContext.brandName} is ready to help you achieve your goals.\n\nTake the next step today and join the many others who have already transformed their results.\n\n[Your Call to Action Here]`,
    };

    return bodyTemplates[pieceType] || bodyTemplates.middle;
  }
}

// Export singleton instance
export const campaignArcGenerator = new CampaignArcGeneratorService();
