/**
 * V4 Campaign Templates
 *
 * Pre-built campaign structures for different marketing goals:
 * - Product Launch (4 weeks)
 * - Evergreen (ongoing)
 * - Awareness Burst (2 weeks)
 * - Authority Builder (6 weeks)
 * - Engagement Drive (2 weeks)
 *
 * Each template includes weekly themes, funnel stages, and content types.
 *
 * Created: 2025-11-26
 */

import type {
  CampaignTemplateType,
  CampaignTemplate,
  CampaignWeek,
  FunnelStage,
  ContentMixRule,
  ContentPillar
} from './types';
import type { CompleteUVP } from '@/types/uvp-flow.types';

// ============================================================================
// CAMPAIGN TEMPLATE DEFINITIONS
// ============================================================================

const CAMPAIGN_TEMPLATES: Record<CampaignTemplateType, CampaignTemplate> = {
  product_launch: {
    type: 'product_launch',
    name: 'Product Launch Campaign',
    description: 'Build anticipation, launch with impact, and sustain momentum for a new product or service',
    durationWeeks: 4,
    contentMixRule: '4-1-1',
    primaryFunnel: 'MOFU',
    weeklyStructure: [
      {
        week: 1,
        theme: 'Teaser & Anticipation',
        funnelStage: 'TOFU',
        contentTypes: ['teaser', 'behind-the-scenes', 'countdown', 'problem-aware'],
        goals: ['Build curiosity', 'Grow email list', 'Set expectations']
      },
      {
        week: 2,
        theme: 'Launch Week',
        funnelStage: 'BOFU',
        contentTypes: ['announcement', 'demo', 'testimonial', 'offer'],
        goals: ['Drive initial sales', 'Generate buzz', 'Collect social proof']
      },
      {
        week: 3,
        theme: 'Social Proof & Stories',
        funnelStage: 'MOFU',
        contentTypes: ['case-study', 'user-generated', 'FAQ', 'comparison'],
        goals: ['Address objections', 'Show results', 'Build trust']
      },
      {
        week: 4,
        theme: 'Final Push & FOMO',
        funnelStage: 'BOFU',
        contentTypes: ['scarcity', 'reminder', 'bonus-offer', 'deadline'],
        goals: ['Convert fence-sitters', 'Close launch strong', 'Set up evergreen']
      }
    ]
  },

  evergreen: {
    type: 'evergreen',
    name: 'Evergreen Content Campaign',
    description: 'Consistent, sustainable content that builds long-term authority and audience',
    durationWeeks: 8, // Repeatable cycle
    contentMixRule: '70-20-10',
    primaryFunnel: 'TOFU',
    weeklyStructure: [
      {
        week: 1,
        theme: 'Value & Education',
        funnelStage: 'TOFU',
        contentTypes: ['how-to', 'tips', 'educational', 'listicle'],
        goals: ['Provide value', 'Grow audience', 'Establish expertise']
      },
      {
        week: 2,
        theme: 'Industry Insights',
        funnelStage: 'TOFU',
        contentTypes: ['trend-analysis', 'opinion', 'data', 'news-commentary'],
        goals: ['Position as thought leader', 'Drive discussion', 'Stay relevant']
      },
      {
        week: 3,
        theme: 'Story & Connection',
        funnelStage: 'MOFU',
        contentTypes: ['story', 'behind-the-scenes', 'journey', 'personal'],
        goals: ['Build emotional connection', 'Show authenticity', 'Increase engagement']
      },
      {
        week: 4,
        theme: 'Deep Value',
        funnelStage: 'MOFU',
        contentTypes: ['guide', 'framework', 'process', 'methodology'],
        goals: ['Demonstrate expertise', 'Capture leads', 'Build trust']
      },
      {
        week: 5,
        theme: 'Community & Engagement',
        funnelStage: 'TOFU',
        contentTypes: ['question', 'poll', 'discussion', 'user-spotlight'],
        goals: ['Boost engagement', 'Gather feedback', 'Build community']
      },
      {
        week: 6,
        theme: 'Results & Proof',
        funnelStage: 'MOFU',
        contentTypes: ['case-study', 'testimonial', 'results', 'transformation'],
        goals: ['Build credibility', 'Show social proof', 'Address skeptics']
      },
      {
        week: 7,
        theme: 'Expert Positioning',
        funnelStage: 'TOFU',
        contentTypes: ['contrarian', 'prediction', 'myth-busting', 'hot-take'],
        goals: ['Differentiate from competition', 'Spark conversation', 'Build brand']
      },
      {
        week: 8,
        theme: 'Soft Conversion',
        funnelStage: 'BOFU',
        contentTypes: ['offer', 'invitation', 'promotion', 'cta'],
        goals: ['Convert ready buyers', 'Drive action', 'Measure effectiveness']
      }
    ]
  },

  awareness_burst: {
    type: 'awareness_burst',
    name: 'Awareness Burst Campaign',
    description: 'High-frequency content push to rapidly grow audience and brand visibility',
    durationWeeks: 2,
    contentMixRule: '70-20-10',
    primaryFunnel: 'TOFU',
    weeklyStructure: [
      {
        week: 1,
        theme: 'Hook & Attract',
        funnelStage: 'TOFU',
        contentTypes: ['viral-hook', 'controversial', 'trending', 'shareable'],
        goals: ['Maximum reach', 'Viral potential', 'New followers']
      },
      {
        week: 2,
        theme: 'Value Flood',
        funnelStage: 'TOFU',
        contentTypes: ['tips-series', 'thread', 'carousel', 'infographic'],
        goals: ['Retain new audience', 'Establish value', 'Drive saves/shares']
      }
    ]
  },

  authority_builder: {
    type: 'authority_builder',
    name: 'Authority Builder Campaign',
    description: 'Establish yourself as the go-to expert in your niche through deep, valuable content',
    durationWeeks: 6,
    contentMixRule: '5-3-2',
    primaryFunnel: 'MOFU',
    weeklyStructure: [
      {
        week: 1,
        theme: 'Foundation',
        funnelStage: 'TOFU',
        contentTypes: ['origin-story', 'credentials', 'philosophy', 'values'],
        goals: ['Introduce yourself', 'Build trust', 'Set positioning']
      },
      {
        week: 2,
        theme: 'Expertise Display',
        funnelStage: 'MOFU',
        contentTypes: ['deep-dive', 'analysis', 'framework', 'methodology'],
        goals: ['Demonstrate knowledge', 'Provide unique insights', 'Build authority']
      },
      {
        week: 3,
        theme: 'Industry Commentary',
        funnelStage: 'TOFU',
        contentTypes: ['opinion', 'prediction', 'trend-analysis', 'hot-take'],
        goals: ['Position as thought leader', 'Drive engagement', 'Build brand']
      },
      {
        week: 4,
        theme: 'Case Studies',
        funnelStage: 'MOFU',
        contentTypes: ['case-study', 'results', 'transformation', 'proof'],
        goals: ['Show real results', 'Build credibility', 'Address skeptics']
      },
      {
        week: 5,
        theme: 'Teaching Series',
        funnelStage: 'MOFU',
        contentTypes: ['tutorial', 'course-preview', 'masterclass', 'workshop'],
        goals: ['Demonstrate teaching ability', 'Capture leads', 'Build email list']
      },
      {
        week: 6,
        theme: 'Call to Action',
        funnelStage: 'BOFU',
        contentTypes: ['offer', 'consultation', 'program-launch', 'invitation'],
        goals: ['Convert to clients', 'Fill program', 'Monetize authority']
      }
    ]
  },

  engagement_drive: {
    type: 'engagement_drive',
    name: 'Engagement Drive Campaign',
    description: 'Boost engagement metrics and community interaction through interactive content',
    durationWeeks: 2,
    contentMixRule: '70-20-10',
    primaryFunnel: 'TOFU',
    weeklyStructure: [
      {
        week: 1,
        theme: 'Conversation Starters',
        funnelStage: 'TOFU',
        contentTypes: ['question', 'poll', 'debate', 'opinion-ask'],
        goals: ['Increase comments', 'Drive discussion', 'Boost algorithm']
      },
      {
        week: 2,
        theme: 'Community Building',
        funnelStage: 'TOFU',
        contentTypes: ['user-spotlight', 'challenge', 'giveaway', 'collaboration'],
        goals: ['Build community', 'Encourage UGC', 'Increase loyalty']
      }
    ]
  }
};

// ============================================================================
// CAMPAIGN TEMPLATES SERVICE CLASS
// ============================================================================

class CampaignTemplatesService {
  /**
   * Get all available campaign templates
   */
  getAll(): CampaignTemplate[] {
    return Object.values(CAMPAIGN_TEMPLATES);
  }

  /**
   * Get a specific campaign template
   */
  get(type: CampaignTemplateType): CampaignTemplate {
    return CAMPAIGN_TEMPLATES[type];
  }

  /**
   * Get template recommendations based on goal
   */
  recommendTemplate(goal: 'launch' | 'grow' | 'authority' | 'engage' | 'sell'): {
    primary: CampaignTemplate;
    alternatives: CampaignTemplate[];
    reason: string;
  } {
    const recommendations: Record<string, {
      primary: CampaignTemplateType;
      alternatives: CampaignTemplateType[];
      reason: string;
    }> = {
      launch: {
        primary: 'product_launch',
        alternatives: ['awareness_burst', 'engagement_drive'],
        reason: 'Product launch campaign builds anticipation and maximizes impact'
      },
      grow: {
        primary: 'awareness_burst',
        alternatives: ['evergreen', 'engagement_drive'],
        reason: 'Awareness burst rapidly expands your audience reach'
      },
      authority: {
        primary: 'authority_builder',
        alternatives: ['evergreen'],
        reason: 'Authority builder establishes you as a thought leader'
      },
      engage: {
        primary: 'engagement_drive',
        alternatives: ['awareness_burst', 'evergreen'],
        reason: 'Engagement drive boosts community interaction'
      },
      sell: {
        primary: 'product_launch',
        alternatives: ['authority_builder', 'evergreen'],
        reason: 'Product launch has the strongest conversion focus'
      }
    };

    const rec = recommendations[goal];
    return {
      primary: this.get(rec.primary),
      alternatives: rec.alternatives.map(t => this.get(t)),
      reason: rec.reason
    };
  }

  /**
   * Generate campaign plan from template
   */
  generatePlan(
    template: CampaignTemplate,
    uvp: CompleteUVP,
    pillars: ContentPillar[],
    startDate: Date = new Date()
  ): {
    weeks: CampaignWeekPlan[];
    totalPosts: number;
    summary: string;
  } {
    const weeks: CampaignWeekPlan[] = [];
    let totalPosts = 0;

    template.weeklyStructure.forEach((week, index) => {
      const weekStartDate = new Date(startDate);
      weekStartDate.setDate(weekStartDate.getDate() + index * 7);

      const postsPerWeek = this.getPostsPerWeek(week.funnelStage);
      totalPosts += postsPerWeek;

      // Assign pillars to content types
      const contentPlan = this.assignPillarsToPosts(
        week.contentTypes,
        pillars,
        postsPerWeek
      );

      weeks.push({
        weekNumber: week.week,
        theme: week.theme,
        startDate: weekStartDate,
        funnelStage: week.funnelStage,
        goals: week.goals,
        contentPlan,
        postsCount: postsPerWeek
      });
    });

    const summary = this.generateCampaignSummary(template, uvp, totalPosts);

    return { weeks, totalPosts, summary };
  }

  /**
   * Customize a template
   */
  customizeTemplate(
    baseTemplate: CampaignTemplate,
    customizations: {
      durationWeeks?: number;
      contentMixRule?: ContentMixRule;
      weekThemes?: string[];
    }
  ): CampaignTemplate {
    const customized = { ...baseTemplate };

    if (customizations.durationWeeks) {
      // Extend or shrink weeks
      if (customizations.durationWeeks > baseTemplate.durationWeeks) {
        // Add weeks by repeating the cycle
        const extraWeeks = customizations.durationWeeks - baseTemplate.durationWeeks;
        for (let i = 0; i < extraWeeks; i++) {
          const sourceWeek = baseTemplate.weeklyStructure[i % baseTemplate.weeklyStructure.length];
          customized.weeklyStructure.push({
            ...sourceWeek,
            week: baseTemplate.durationWeeks + i + 1
          });
        }
      } else {
        // Truncate weeks
        customized.weeklyStructure = customized.weeklyStructure.slice(0, customizations.durationWeeks);
      }
      customized.durationWeeks = customizations.durationWeeks;
    }

    if (customizations.contentMixRule) {
      customized.contentMixRule = customizations.contentMixRule;
    }

    if (customizations.weekThemes) {
      customizations.weekThemes.forEach((theme, index) => {
        if (customized.weeklyStructure[index]) {
          customized.weeklyStructure[index].theme = theme;
        }
      });
    }

    return customized;
  }

  /**
   * Get posting frequency recommendation
   */
  getPostingFrequency(template: CampaignTemplate): {
    platform: string;
    postsPerWeek: number;
    bestDays: string[];
    bestTimes: string[];
  }[] {
    const frequencies = {
      linkedin: { postsPerWeek: 5, bestDays: ['Tuesday', 'Wednesday', 'Thursday'], bestTimes: ['8:00 AM', '12:00 PM', '5:00 PM'] },
      instagram: { postsPerWeek: 7, bestDays: ['Monday', 'Wednesday', 'Friday', 'Sunday'], bestTimes: ['11:00 AM', '2:00 PM', '7:00 PM'] },
      twitter: { postsPerWeek: 14, bestDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], bestTimes: ['8:00 AM', '12:00 PM', '5:00 PM'] },
      facebook: { postsPerWeek: 5, bestDays: ['Wednesday', 'Thursday', 'Friday'], bestTimes: ['9:00 AM', '1:00 PM', '4:00 PM'] },
      tiktok: { postsPerWeek: 7, bestDays: ['Tuesday', 'Thursday', 'Friday', 'Saturday'], bestTimes: ['7:00 PM', '8:00 PM', '9:00 PM'] }
    };

    return Object.entries(frequencies).map(([platform, freq]) => ({
      platform,
      ...freq
    }));
  }

  /**
   * Get template comparison
   */
  compareTemplates(types: CampaignTemplateType[]): {
    comparison: {
      template: CampaignTemplate;
      pros: string[];
      cons: string[];
      bestFor: string;
    }[];
  } {
    const analyses: Record<CampaignTemplateType, { pros: string[]; cons: string[]; bestFor: string }> = {
      product_launch: {
        pros: ['High conversion focus', 'Built-in urgency', 'Clear narrative arc'],
        cons: ['Not evergreen', 'Requires product ready', 'Time-sensitive'],
        bestFor: 'New product/service launches, reopening programs'
      },
      evergreen: {
        pros: ['Sustainable long-term', 'Low pressure', 'Builds compound value'],
        cons: ['Slower results', 'Requires consistency', 'Less urgency'],
        bestFor: 'Ongoing content strategy, long-term brand building'
      },
      awareness_burst: {
        pros: ['Fast audience growth', 'High visibility', 'Viral potential'],
        cons: ['High effort', 'Short-term', 'May attract wrong audience'],
        bestFor: 'New accounts, rebrand, entering new market'
      },
      authority_builder: {
        pros: ['Strong positioning', 'Premium brand', 'Higher prices'],
        cons: ['Requires expertise', 'Longer timeline', 'More depth needed'],
        bestFor: 'Consultants, coaches, experts, premium services'
      },
      engagement_drive: {
        pros: ['Algorithm boost', 'Community building', 'Quick wins'],
        cons: ['May not convert', 'Engagement can be shallow', 'Short-term'],
        bestFor: 'Before launches, recovering from low engagement, community building'
      }
    };

    return {
      comparison: types.map(type => ({
        template: this.get(type),
        ...analyses[type]
      }))
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private getPostsPerWeek(funnelStage: FunnelStage): number {
    const basePosts: Record<FunnelStage, number> = {
      TOFU: 5,
      MOFU: 4,
      BOFU: 3
    };
    return basePosts[funnelStage];
  }

  private assignPillarsToPosts(
    contentTypes: string[],
    pillars: ContentPillar[],
    postsCount: number
  ): { contentType: string; pillar?: ContentPillar }[] {
    const plan: { contentType: string; pillar?: ContentPillar }[] = [];

    for (let i = 0; i < postsCount; i++) {
      const contentType = contentTypes[i % contentTypes.length];
      const pillar = pillars.length > 0 ? pillars[i % pillars.length] : undefined;

      plan.push({ contentType, pillar });
    }

    return plan;
  }

  private generateCampaignSummary(
    template: CampaignTemplate,
    uvp: CompleteUVP,
    totalPosts: number
  ): string {
    const customerTarget = uvp.targetCustomer?.statement || 'your target audience';
    const benefit = uvp.keyBenefit?.statement || 'achieve their goals';

    return `${template.name}: A ${template.durationWeeks}-week campaign to help ${customerTarget} ${benefit}. ` +
      `This includes ${totalPosts} posts following the ${template.contentMixRule} content mix rule, ` +
      `primarily focused on ${template.primaryFunnel} stage content.`;
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface CampaignWeekPlan {
  weekNumber: number;
  theme: string;
  startDate: Date;
  funnelStage: FunnelStage;
  goals: string[];
  contentPlan: { contentType: string; pillar?: ContentPillar }[];
  postsCount: number;
}

// Export singleton instance
export const campaignTemplates = new CampaignTemplatesService();

// Export class for testing
export { CampaignTemplatesService };
