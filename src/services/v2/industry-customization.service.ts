/**
 * Industry Customization Service
 * Applies industry-specific overlays to content templates
 */

import {
  industryProfiles,
  getIndustryProfile,
  getIndustryByNaics,
  IndustryProfile,
  EmotionalTriggerWeights,
  IndustryVocabulary,
  ComplianceRule,
  IndustryExample,
} from './data/industry-profiles';
import { industryResearchService } from './industry-research.service';

export interface ContentToCustomize {
  title: string;
  hook: string;
  body: string;
  cta: string;
  templateType: string;
}

export interface CustomizedContent extends ContentToCustomize {
  industryId: string;
  industryName: string;
  appliedOverlays: string[];
  complianceWarnings: ComplianceIssue[];
  emotionalWeights: EmotionalTriggerWeights;
  suggestedHashtags: string[];
}

export interface ComplianceIssue {
  ruleId: string;
  description: string;
  severity: 'warning' | 'error';
  flaggedContent?: string;
  suggestion?: string;
}

export interface IndustryOverlayOptions {
  applyVocabulary?: boolean;
  checkCompliance?: boolean;
  addSeasonalContext?: boolean;
  customVariables?: Record<string, string>;
}

export class IndustryCustomizationService {
  private static instance: IndustryCustomizationService;

  private constructor() {}

  static getInstance(): IndustryCustomizationService {
    if (!IndustryCustomizationService.instance) {
      IndustryCustomizationService.instance = new IndustryCustomizationService();
    }
    return IndustryCustomizationService.instance;
  }

  /**
   * Apply industry-specific overlay to content
   * Falls back to AI-generated profile if not found
   */
  async applyIndustryOverlay(
    content: ContentToCustomize,
    industryId: string,
    options: IndustryOverlayOptions = {}
  ): Promise<CustomizedContent> {
    let profile = getIndustryProfile(industryId);

    // If profile doesn't exist, check if it's being researched
    if (!profile) {
      const cached = industryResearchService.getCachedProfile(industryId);
      if (cached) {
        profile = cached;
      } else {
        // Use fallback profile for now (will be researched in background)
        console.warn(`[IndustryCustomization] Profile not found for ${industryId}, using fallback`);
        profile = this.getFallbackProfile(industryId);
      }
    }

    const {
      applyVocabulary = true,
      checkCompliance = true,
      addSeasonalContext = false,
      customVariables = {},
    } = options;

    let customizedContent = { ...content };
    const appliedOverlays: string[] = [];

    // Apply vocabulary enhancements
    if (applyVocabulary) {
      customizedContent = this.enhanceWithVocabulary(customizedContent, profile);
      appliedOverlays.push('vocabulary');
    }

    // Replace custom variables
    if (Object.keys(customVariables).length > 0) {
      customizedContent = this.replaceVariables(customizedContent, customVariables);
      appliedOverlays.push('variables');
    }

    // Add seasonal context if applicable
    if (addSeasonalContext) {
      customizedContent = this.addSeasonalTriggers(customizedContent, profile);
      appliedOverlays.push('seasonal');
    }

    // Check compliance
    let complianceWarnings: ComplianceIssue[] = [];
    if (checkCompliance) {
      complianceWarnings = this.checkCompliance(customizedContent, industryId);
      appliedOverlays.push('compliance-check');
    }

    return {
      ...customizedContent,
      industryId: profile.id,
      industryName: profile.name,
      appliedOverlays,
      complianceWarnings,
      emotionalWeights: profile.emotionalTriggers,
      suggestedHashtags: this.generateIndustryHashtags(profile),
    };
  }

  /**
   * Get emotional trigger weights for an industry
   */
  getEmotionalTriggerWeights(industryId: string): EmotionalTriggerWeights {
    const profile = getIndustryProfile(industryId);
    if (!profile) {
      // Return default balanced weights
      return {
        fear: 10,
        trust: 20,
        security: 15,
        efficiency: 15,
        growth: 15,
        innovation: 10,
        hope: 5,
        urgency: 5,
        exclusivity: 5,
        community: 0,
      };
    }
    return { ...profile.emotionalTriggers };
  }

  /**
   * Get the dominant emotional triggers for an industry
   */
  getDominantTriggers(industryId: string, top: number = 3): Array<{ trigger: string; weight: number }> {
    const weights = this.getEmotionalTriggerWeights(industryId);
    const entries = Object.entries(weights) as Array<[string, number]>;

    return entries
      .filter(([_, weight]) => weight > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, top)
      .map(([trigger, weight]) => ({ trigger, weight }));
  }

  /**
   * Generate industry-specific examples
   */
  generateIndustryExamples(
    industryId: string,
    variables: Record<string, string> = {}
  ): IndustryExample[] {
    const profile = getIndustryProfile(industryId);
    if (!profile) {
      return [];
    }

    return profile.examples.map(example => {
      let template = example.template;

      // Replace variables in template
      for (const [key, value] of Object.entries(variables)) {
        template = template.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      }

      return {
        ...example,
        template,
      };
    });
  }

  /**
   * Check content for compliance issues
   */
  checkCompliance(content: ContentToCustomize, industryId: string): ComplianceIssue[] {
    const profile = getIndustryProfile(industryId);
    if (!profile) {
      return [];
    }

    const issues: ComplianceIssue[] = [];
    const fullContent = `${content.title} ${content.hook} ${content.body} ${content.cta}`.toLowerCase();

    for (const rule of profile.complianceRules) {
      // Check banned terms
      if (rule.bannedTerms) {
        for (const term of rule.bannedTerms) {
          if (fullContent.includes(term.toLowerCase())) {
            issues.push({
              ruleId: rule.id,
              description: rule.description,
              severity: rule.severity,
              flaggedContent: term,
              suggestion: `Remove or rephrase "${term}"`,
            });
          }
        }
      }

      // Check for missing required disclosures
      if (rule.requiredDisclosures) {
        for (const disclosure of rule.requiredDisclosures) {
          // Check if any form of the disclosure is present
          const disclosureWords = disclosure.toLowerCase().split(' ').slice(0, 3).join(' ');
          if (!fullContent.includes(disclosureWords)) {
            issues.push({
              ruleId: rule.id,
              description: `Missing required disclosure: ${disclosure}`,
              severity: rule.severity,
              suggestion: `Add disclosure: "${disclosure}"`,
            });
          }
        }
      }
    }

    return issues;
  }

  /**
   * Get industry vocabulary
   */
  getIndustryVocabulary(industryId: string): IndustryVocabulary | null {
    const profile = getIndustryProfile(industryId);
    if (!profile) {
      return null;
    }
    return { ...profile.vocabulary };
  }

  /**
   * Get content guidelines for an industry
   */
  getContentGuidelines(industryId: string): string[] {
    const profile = getIndustryProfile(industryId);
    return profile?.contentGuidelines || [];
  }

  /**
   * Get seasonal triggers for an industry
   */
  getSeasonalTriggers(industryId: string): string[] {
    const profile = getIndustryProfile(industryId);
    return profile?.seasonalTriggers || [];
  }

  /**
   * Get all available industries
   */
  getAllIndustries(): Array<{ id: string; name: string; description: string }> {
    return Object.values(industryProfiles).map(profile => ({
      id: profile.id,
      name: profile.name,
      description: profile.description,
    }));
  }

  /**
   * Find industry by NAICS code
   */
  findIndustryByNaics(naicsCode: string): IndustryProfile | undefined {
    return getIndustryByNaics(naicsCode);
  }

  /**
   * Calculate emotional alignment score between content and industry
   */
  calculateEmotionalAlignment(
    contentTriggers: Partial<EmotionalTriggerWeights>,
    industryId: string
  ): number {
    const industryWeights = this.getEmotionalTriggerWeights(industryId);
    let alignmentScore = 0;
    let totalWeight = 0;

    for (const [trigger, weight] of Object.entries(contentTriggers)) {
      const industryWeight = industryWeights[trigger as keyof EmotionalTriggerWeights] || 0;
      if (industryWeight > 0 && weight) {
        alignmentScore += Math.min(weight, industryWeight);
        totalWeight += industryWeight;
      }
    }

    return totalWeight > 0 ? Math.round((alignmentScore / totalWeight) * 100) : 0;
  }

  /**
   * Suggest best template types for an industry
   */
  suggestTemplateTypes(industryId: string): string[] {
    const profile = getIndustryProfile(industryId);
    if (!profile) {
      return ['curiosity-gap', 'transformation', 'quick-win'];
    }

    // Map examples to template types
    const templateTypes = profile.examples.map(ex => ex.type);

    // Add more based on emotional triggers
    const triggers = this.getDominantTriggers(industryId);
    const triggerBasedTemplates: Record<string, string[]> = {
      fear: ['hidden-cost', 'mistake-exposer'],
      trust: ['case-study', 'expert-roundup'],
      security: ['guide-snippet', 'data-revelation'],
      efficiency: ['specific-number', 'quick-win'],
      growth: ['transformation', 'challenge-post'],
      innovation: ['pattern-interrupt', 'contrarian'],
      hope: ['transformation', 'failure-to-success'],
      urgency: ['deadline-driver', 'trend-jacker'],
      exclusivity: ['behind-the-scenes', 'seasonal'],
      community: ['challenge-post', 'behind-the-scenes'],
    };

    for (const { trigger } of triggers) {
      const suggestions = triggerBasedTemplates[trigger] || [];
      templateTypes.push(...suggestions);
    }

    // Return unique template types
    return [...new Set(templateTypes)];
  }

  // Private helper methods

  private enhanceWithVocabulary(
    content: ContentToCustomize,
    profile: IndustryProfile
  ): ContentToCustomize {
    let { title, hook, body, cta } = content;
    const { vocabulary } = profile;

    // Add power words to title if short
    if (title.split(' ').length < 8 && vocabulary.powerWords.length > 0) {
      const powerWord = vocabulary.powerWords[0];
      if (!title.toLowerCase().includes(powerWord.toLowerCase())) {
        title = `${powerWord}: ${title}`;
      }
    }

    // Enhance CTA with industry-specific phrases
    if (vocabulary.callToActionPhrases.length > 0) {
      const ctaPhrase = vocabulary.callToActionPhrases[0];
      if (!cta.toLowerCase().includes(ctaPhrase.toLowerCase().split(' ')[0])) {
        cta = `${cta} ${ctaPhrase}`;
      }
    }

    return { ...content, title, hook, body, cta };
  }

  private replaceVariables(
    content: ContentToCustomize,
    variables: Record<string, string>
  ): ContentToCustomize {
    let { title, hook, body, cta } = content;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      title = title.replace(regex, value);
      hook = hook.replace(regex, value);
      body = body.replace(regex, value);
      cta = cta.replace(regex, value);
    }

    return { title, hook, body, cta, templateType: content.templateType };
  }

  private addSeasonalTriggers(
    content: ContentToCustomize,
    profile: IndustryProfile
  ): ContentToCustomize {
    if (profile.seasonalTriggers.length === 0) {
      return content;
    }

    // Get current season/month context
    const month = new Date().getMonth();
    let seasonalContext = '';

    // Simple seasonal mapping
    if (month >= 0 && month <= 2) {
      seasonalContext = profile.seasonalTriggers.find(t =>
        t.includes('new year') || t.includes('Q1') || t.includes('winter')
      ) || '';
    } else if (month >= 3 && month <= 5) {
      seasonalContext = profile.seasonalTriggers.find(t =>
        t.includes('spring') || t.includes('summer')
      ) || '';
    } else if (month >= 6 && month <= 8) {
      seasonalContext = profile.seasonalTriggers.find(t =>
        t.includes('summer') || t.includes('back to school')
      ) || '';
    } else {
      seasonalContext = profile.seasonalTriggers.find(t =>
        t.includes('holiday') || t.includes('year-end') || t.includes('fall')
      ) || '';
    }

    if (seasonalContext) {
      const body = `${content.body}\n\n[Seasonal context: ${seasonalContext}]`;
      return { ...content, body };
    }

    return content;
  }

  private generateIndustryHashtags(profile: IndustryProfile): string[] {
    const hashtags: string[] = [];

    // Add industry name as hashtag
    hashtags.push(`#${profile.id}`);

    // Add key terms as hashtags
    const keyTerms = profile.vocabulary.preferredTerms.slice(0, 3);
    for (const term of keyTerms) {
      const hashtag = `#${term.replace(/\s+/g, '').toLowerCase()}`;
      if (!hashtags.includes(hashtag)) {
        hashtags.push(hashtag);
      }
    }

    // Add one power word
    if (profile.vocabulary.powerWords.length > 0) {
      hashtags.push(`#${profile.vocabulary.powerWords[0].replace(/\s+/g, '').toLowerCase()}`);
    }

    return hashtags.slice(0, 5);
  }

  /**
   * Get fallback profile for unknown industries
   * Returns generic profile while research happens in background
   */
  private getFallbackProfile(industryId: string): IndustryProfile {
    return {
      id: industryId,
      name: industryId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      naicsPrefix: '00',
      description: 'Generic industry profile - being researched',
      emotionalTriggers: {
        fear: 10,
        trust: 15,
        security: 10,
        efficiency: 12,
        growth: 12,
        innovation: 10,
        hope: 10,
        urgency: 8,
        exclusivity: 8,
        community: 5,
      },
      vocabulary: {
        preferredTerms: ['solution', 'value', 'quality', 'service'],
        avoidTerms: [],
        powerWords: ['proven', 'results', 'trusted', 'effective'],
        technicalTerms: [],
        callToActionPhrases: ['Get Started', 'Learn More', 'Try Now'],
      },
      compliance: [],
      performanceBenchmarks: {
        averageCTR: 2.5,
        averageEngagement: 3.0,
        topPerformingTemplates: [],
        industryBestPractices: [],
      },
      examples: [],
      customizationStrength: 'low',
      seasonalTriggers: [],
      isAIGenerated: false,
      isFallback: true,
    };
  }

  /**
   * Trigger background research for unknown industry
   */
  async triggerBackgroundResearch(naicsCode: string, naicsTitle: string): Promise<void> {
    console.log(`[IndustryCustomization] Triggering background research for ${naicsTitle} (${naicsCode})`);

    try {
      await industryResearchService.researchIndustry(naicsCode, {
        code: naicsCode,
        title: naicsTitle,
        description: `Research profile for ${naicsTitle}`,
      });
      console.log(`[IndustryCustomization] Research complete for ${naicsTitle}`);
    } catch (error) {
      console.error(`[IndustryCustomization] Research failed for ${naicsTitle}:`, error);
    }
  }

  /**
   * Check if industry profile exists or is being researched
   */
  getIndustryStatus(industryId: string): 'ready' | 'researching' | 'pending' {
    if (getIndustryProfile(industryId)) return 'ready';
    if (industryResearchService.getCachedProfile(industryId)) return 'ready';

    const status = industryResearchService.getResearchStatus(industryId);
    if (status.status === 'researching') return 'researching';
    return 'pending';
  }
}

// Export singleton instance
export const industryCustomizationService = IndustryCustomizationService.getInstance();
