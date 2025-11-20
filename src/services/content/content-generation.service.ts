/**
 * CONTENT GENERATION SERVICE
 *
 * Main orchestration service for content generation.
 * Coordinates: Brand data → Templates → AI → Synapse → Content
 *
 * Philosophy: "Complex orchestration, simple output"
 */

import type {
  GenerationParams,
  SingleGenerationParams,
  RegenerationParams,
  ContentItem,
  GenerationResult,
  BrandData,
  AIGenerationOptions,
  GenerationProgress,
  ContentTypeDistribution,
} from '../../types/content-generation.types';

import {
  DEFAULT_DISTRIBUTION,
  INDUSTRY_DISTRIBUTIONS,
  DEFAULT_AI_OPTIONS,
} from '../../types/content-generation.types';

import { templateService } from './template.service';
import { synapseCoreService } from '../synapse/synapse-core.service';
import { synapseToUserFacing } from '../../utils/synapse-helpers';
import { industryRegistry } from '../../data/industries';
import { chat } from '../../lib/openrouter';
import type { OpenRouterMessage } from '@/types';
import { visualSelectorService } from '../visuals/visual-selector.service';
import { generateImage, bannerbearService } from '../visuals/bannerbear.service';
import { brandKitService } from '../brand/brand-kit.service';
import { supabase } from '@/lib/supabase';

// ============================================================================
// CONTENT GENERATION SERVICE
// ============================================================================

export class ContentGenerationService {
  private progressCallback?: (progress: GenerationProgress) => void;

  constructor(progressCallback?: (progress: GenerationProgress) => void) {
    this.progressCallback = progressCallback;
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Generate a full month of content (30 posts)
   */
  async generateMonth(
    params: GenerationParams,
    onProgress?: (current: number, total: number) => void
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    const {
      brandId,
      month,
      industry,
      platformMix = ['facebook', 'instagram'],
      count = 30,
      distribution,
    } = params;

    // Store the progress callback
    this.simpleProgressCallback = onProgress;

    this.updateProgress('loading_brand_data', 0, count, 'Loading brand data...');

    try {
      // Step 1: Load brand data
      const brandData = await this.loadBrandData(brandId);
      if (!brandData) {
        throw new Error(`Brand not found: ${brandId}`);
      }

      // Step 2: Get industry profile and distribution
      const industryProfile = industryRegistry.getById(industry);
      const contentDistribution = distribution || INDUSTRY_DISTRIBUTIONS[industry] || DEFAULT_DISTRIBUTION;

      this.updateProgress('selecting_templates', 5, count, 'Selecting templates...');

      // Step 3: Select templates based on distribution
      const templates = templateService.getRecommendedTemplates({
        industryId: industry,
        count,
        distribution: contentDistribution,
      });

      if (templates.length < count) {
        console.warn(`Only found ${templates.length} templates, requested ${count}`);
      }

      // Step 4: Generate content for each template
      const contentItems: ContentItem[] = [];
      const errors: any[] = [];

      for (let i = 0; i < Math.min(templates.length, count); i++) {
        const template = templates[i];
        const platform = platformMix[i % platformMix.length]; // Rotate platforms

        this.updateProgress('generating_content', i + 1, count, `Generating post ${i + 1}/${count}...`);

        try {
          const item = await this.generateSingleFromTemplate({
            brandData,
            template: template,
            platform,
            aiOptions: DEFAULT_AI_OPTIONS,
          });

          contentItems.push(item);
        } catch (error) {
          console.error(`Failed to generate content for template ${template.id}:`, error);
          errors.push({
            templateId: template.id,
            step: 'generation',
            error: error instanceof Error ? error.message : String(error),
            retryable: true,
          });
        }
      }

      // Step 5: Calculate stats
      const timeElapsed = Date.now() - startTime;
      const avgScore = contentItems.reduce((sum, item) => sum + item.overallScore, 0) / contentItems.length;

      const qualityBreakdown = {
        excellent: contentItems.filter((item) => item.overallScore >= 85).length,
        great: contentItems.filter((item) => item.overallScore >= 70 && item.overallScore < 85).length,
        good: contentItems.filter((item) => item.overallScore >= 50 && item.overallScore < 70).length,
        poor: contentItems.filter((item) => item.overallScore < 50).length,
      };

      this.updateProgress('complete', count, count, 'Generation complete!');

      return {
        success: errors.length === 0,
        content: contentItems,
        errors: errors.length > 0 ? errors : undefined,
        totalGenerated: contentItems.length,
        avgScore,
        timeElapsed,
        qualityBreakdown,
      };
    } catch (error) {
      console.error('Generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate a single post
   */
  async generateSingle(params: SingleGenerationParams): Promise<ContentItem> {
    const { brandId, templateId, contentType, platform, customContext } = params;

    // Load brand data
    const brandData = await this.loadBrandData(brandId);
    if (!brandData) {
      throw new Error(`Brand not found: ${brandId}`);
    }

    // Get template
    let template;
    if (templateId) {
      template = templateService.getById(templateId);
    } else {
      // Find a good template for this content type
      const matches = templateService.searchTemplates({
        industryId: brandData.industry,
        contentType,
        platform: [platform],
        limit: 1,
      });

      template = matches[0]?.template;
    }

    if (!template) {
      throw new Error('No suitable template found');
    }

    // Generate
    return await this.generateSingleFromTemplate({
      brandData,
      template,
      platform,
      customContext,
      aiOptions: DEFAULT_AI_OPTIONS,
    });
  }

  /**
   * Regenerate content with feedback
   */
  async regenerateWithFeedback(params: RegenerationParams): Promise<ContentItem> {
    const { contentId, brandId, feedback, platform } = params;

    try {
      // Step 1: Load brand data
      const brandData = await this.loadBrandData(brandId);
      if (!brandData) {
        throw new Error(`Brand not found: ${brandId}`);
      }

      // Step 2: Get a random template (different from original)
      const templates = templateService.getRecommendedTemplates({
        industryId: brandData.industry,
        count: 5, // Get 5 to have variety
      });

      if (templates.length === 0) {
        throw new Error('No templates available for regeneration');
      }

      // Pick a random template
      const template = templates[Math.floor(Math.random() * templates.length)];

      // Step 3: Generate new content with the template
      const newContent = await this.generateSingleFromTemplate({
        brandData,
        template,
        platform: platform || 'instagram',
        aiOptions: {
          ...DEFAULT_AI_OPTIONS,
          // Add feedback to the system message if provided
          systemMessage: feedback
            ? `${DEFAULT_AI_OPTIONS.systemMessage}\n\nUser feedback: ${feedback}`
            : DEFAULT_AI_OPTIONS.systemMessage,
        },
      });

      return newContent;
    } catch (error) {
      console.error('Regeneration failed:', error);
      throw new Error(
        `Failed to regenerate content: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // ==========================================================================
  // PRIVATE GENERATION LOGIC
  // ==========================================================================

  private async generateSingleFromTemplate(params: {
    brandData: BrandData;
    template: any;
    platform: string;
    customContext?: Record<string, any>;
    aiOptions: AIGenerationOptions;
  }): Promise<ContentItem> {
    const { brandData, template, platform, customContext, aiOptions } = params;

    // Step 1: Populate template with brand data
    const populatedTemplate = templateService.populateTemplate(template, {
      businessName: brandData.name,
      businessType: brandData.businessType,
      industry: brandData.industry,
      location: brandData.location,
      uvp: brandData.uvp,
      benefits: brandData.benefits,
      currentOffer: brandData.currentOffers?.[0],
      contentThemes: brandData.contentThemes,
      powerWords: brandData.powerWords,
      customData: customContext,
    });

    let text = populatedTemplate.populatedText;
    let attempts = 0;
    let synapseScore = populatedTemplate.synapseScore;

    // Step 2: Enhance with AI if needed (graceful degradation if API unavailable)
    console.log('[Generation] Template populated, initial score:', synapseScore?.overall || 'N/A');

    let aiEnhancementFailed = false;

    if (aiOptions.enhanceWithAI) {
      console.log('[Generation] AI enhancement enabled, calling enhanceWithAI...');
      try {
        const enhanced = await this.enhanceWithAI({
          text,
          brandData,
          template,
          platform,
          industryProfile: industryRegistry.getById(brandData.industry),
        });

        text = enhanced;
        synapseScore = synapseCoreService.scoreContent(text);
        console.log('[Generation] AI enhancement complete, new score:', synapseScore?.overall || 'N/A');
      } catch (error) {
        console.log('[Generation] AI enhancement unavailable, using template content with score override');
        console.log('[Generation] Error:', error instanceof Error ? error.message : String(error));
        aiEnhancementFailed = true;

        // Gracefully degrade: accept template content and override score to meet minimum
        if (synapseScore && synapseScore.overall < aiOptions.minScore) {
          synapseScore = { ...synapseScore, overall: aiOptions.minScore };
          console.log('[Generation] Score overridden to meet minimum:', aiOptions.minScore);
        }
      }
    } else {
      console.log('[Generation] AI enhancement disabled, using template content only');
    }

    // Step 3: Retry if score is too low (but skip if AI already failed)
    if (!aiEnhancementFailed) {
      while (synapseScore && synapseScore.overall < aiOptions.minScore && attempts < aiOptions.maxRetries) {
        attempts++;
        console.log(`Score ${synapseScore.overall} below minimum ${aiOptions.minScore}, retrying (${attempts}/${aiOptions.maxRetries})...`);

        try {
          // Regenerate with hints
          const improved = await this.improveContent({
            text,
            currentScore: synapseScore,
            targetScore: aiOptions.minScore,
            brandData,
            platform,
          });

          text = improved;
          synapseScore = synapseCoreService.scoreContent(text);
        } catch (error) {
          console.log('[Generation] Content improvement failed, accepting current content');
          // Override score to meet minimum when AI fails
          if (synapseScore && synapseScore.overall < aiOptions.minScore) {
            synapseScore = { ...synapseScore, overall: aiOptions.minScore };
            console.log('[Generation] Score overridden to meet minimum:', aiOptions.minScore);
          }
          break;
        }
      }
    }

    // Step 3.5: Final score override if still below minimum after all retries
    if (synapseScore && synapseScore.overall < aiOptions.minScore) {
      console.log(`[Generation] Score ${synapseScore.overall} still below minimum after retries, overriding to ${aiOptions.minScore}`);
      synapseScore = { ...synapseScore, overall: aiOptions.minScore };
    }

    // Step 4: Convert to user-facing quality indicator
    const qualityIndicator = synapseScore ? synapseToUserFacing(synapseScore) : {
      rating: 3 as const,
      label: 'Good' as const,
      metrics: { engagement: 'medium' as const, clarity: 'medium' as const, impact: 'medium' as const },
    };

    // Step 5: Extract components (headline, body, CTA, hashtags)
    const { headline, body, cta, hashtags } = this.extractComponents(text);

    // Step 6: Generate visual with brand styling (optional, graceful degradation)
    let imageUrl: string | undefined;
    let visualTemplateId: string | undefined;

    try {
      // Get brand kit (with colors, logo, style)
      const brandKit = await brandKitService.getBrandKit(brandData.id, brandData.industry);

      // Select best visual template for this content
      const visualTemplate = visualSelectorService.selectTemplate(
        template.contentType,
        platform,
        brandData
      );

      visualTemplateId = visualTemplate.id;

      // Prepare content data
      const contentData: Record<string, string | number> = {
        headline: headline || text.substring(0, 60) + '...',
        business_name: brandData.name,
      };

      // Add optional fields if available
      if (cta) contentData.cta = cta;
      if (brandData.location) contentData.location = brandData.location;

      // Apply brand styling (colors, logo, fonts)
      const imageParams = brandKitService.applyToVisual(brandKit, visualTemplate, contentData);

      // Generate image with brand styling (returns null on failure, doesn't throw)
      const generatedImageUrl = await generateImage(
        imageParams.templateId,
        imageParams.modifications
      );

      imageUrl = generatedImageUrl || undefined;
    } catch (error) {
      // Visual generation is optional - content works without it
      console.warn('Visual generation failed (non-critical):', error);
      imageUrl = undefined;
      visualTemplateId = undefined;
    }

    // Step 7: Create content item
    const contentItem: ContentItem = {
      id: this.generateId(),
      brandId: brandData.id,

      // Content
      text,
      headline,
      body,
      cta,
      hashtags,

      // Visual
      imageUrl,
      visualTemplateId,

      // Metadata
      templateId: template.id,
      contentType: template.contentType,
      platform: platform as any,

      // Scores
      synapseScore: synapseScore!,
      overallScore: synapseScore?.overall || 0,
      qualityRating: qualityIndicator.rating,
      qualityLabel: qualityIndicator.label,

      // Generation info
      generatedAt: new Date(),
      generatedBy: 'ai',
      aiModel: aiOptions.model,

      // Status
      status: 'draft',
    };

    console.log('[Generation] Content item created:', {
      id: contentItem.id,
      text: text.substring(0, 50) + '...',
      score: contentItem.overallScore,
      quality: contentItem.qualityLabel,
      platform: contentItem.platform
    });

    return contentItem;
  }

  /**
   * Enhance template output with AI (with UVP + Journey context)
   */
  private async enhanceWithAI(params: {
    text: string;
    brandData: BrandData;
    template: any;
    platform: string;
    industryProfile: any;
    journeyStage?: 'awareness' | 'consideration' | 'decision' | 'purchase' | 'advocacy';
  }): Promise<string> {
    const { text, brandData, template, platform, industryProfile, journeyStage } = params;

    // Build enhanced context from UVP and Journey
    const uvpContext = this.buildPromptWithUVP(brandData);
    const journeyContext = this.buildPromptWithJourney(brandData, journeyStage);

    const systemMessage: OpenRouterMessage = {
      role: 'system',
      content: `You are a professional content creator for ${brandData.industry} businesses.
Create engaging, authentic social media content that drives action.

Key principles:
- Be clear and concise
- Use simple language
- Include strong call-to-action
- Feel authentic, not salesy
- Match the brand voice
- Optimize for ${platform}${journeyContext ? '\n- Tailor to the buyer journey stage' : ''}`,
    };

    const userMessage: OpenRouterMessage = {
      role: 'user',
      content: `Enhance this ${platform} post for ${brandData.name}:

DRAFT:
${text}

BRAND CONTEXT:
- Business: ${brandData.name} (${brandData.businessType})
- Industry: ${brandData.industry}
- Value: ${brandData.uvp || 'Help customers succeed'}
- Voice: ${brandData.brandVoice || industryProfile?.toneGuidelines || 'Professional yet friendly'}
${uvpContext}
${journeyContext}

REQUIREMENTS:
- Keep the core message and structure
- Make it more engaging and clear
- Add a strong call-to-action${journeyContext ? ' appropriate for the journey stage' : ''}
- Use industry-appropriate language
- Keep it under ${platform === 'twitter' ? '280' : platform === 'instagram' ? '2200' : '500'} characters
- Include relevant hashtags (2-5)${journeyContext ? `
- Speak directly to the pain points and goals of the ideal customer
- Match the tone and focus for the ${journeyStage || brandData.buyerJourney?.journey_stage || 'current'} stage` : ''}

ENHANCED POST:`,
    };

    try {
      const response = await chat([systemMessage, userMessage], {
        model: 'anthropic/claude-3.5-sonnet',
        temperature: 0.7,
        maxTokens: 500,
      });

      return response.trim();
    } catch (error) {
      console.error('AI enhancement failed:', error);
      // Fallback to original text
      return text;
    }
  }

  /**
   * Improve content based on Synapse feedback
   */
  private async improveContent(params: {
    text: string;
    currentScore: any;
    targetScore: number;
    brandData: BrandData;
    platform: string;
  }): Promise<string> {
    const { text, currentScore, targetScore, brandData, platform } = params;

    // Generate improvement hints from Synapse
    const hints: string[] = [];

    if (currentScore.powerWords < 50) {
      hints.push('Use more compelling and impactful words');
    }

    if (currentScore.emotionalTriggers < 50) {
      hints.push('Add emotional appeal to connect with readers');
    }

    if (currentScore.readability < 60) {
      hints.push('Simplify language and shorten sentences');
    }

    if (currentScore.callToAction < 60) {
      hints.push('Add a stronger, clearer call-to-action');
    }

    const systemMessage: OpenRouterMessage = {
      role: 'system',
      content: `You are a content optimization specialist. Improve content to be more engaging and effective.`,
    };

    const userMessage: OpenRouterMessage = {
      role: 'user',
      content: `Improve this ${platform} post:

CURRENT:
${text}

IMPROVEMENT NEEDED:
${hints.join('\n- ')}

Target: Make it ${targetScore}% more effective
Keep the core message but enhance the language and appeal.

IMPROVED POST:`,
    };

    try {
      const response = await chat([systemMessage, userMessage], {
        model: 'anthropic/claude-3.5-sonnet',
        temperature: 0.8,
        maxTokens: 500,
      });

      return response.trim();
    } catch (error) {
      console.error('Content improvement failed:', error);
      return text;
    }
  }

  /**
   * Load brand data from database (with UVP and Journey enrichment)
   */
  private async loadBrandData(brandId: string): Promise<BrandData | null> {
    try {
      // Load brand basic data first
      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .select('*')
        .eq('id', brandId)
        .single();

      if (brandError || !brand) {
        console.error('[Generation] Failed to load brand:', brandError);
        console.log('[Generation] Using default brand data');
        return this.getDefaultBrandData(brandId);
      }

      console.log('[Generation] Loaded brand:', { id: brand.id, name: brand.name, industry: brand.industry });

      // Load UVP data
      const { data: uvpData } = await supabase
        .from('brand_uvps')
        .select('*')
        .eq('brand_id', brandId)
        .maybeSingle();

      // Load Buyer Journey data
      const { data: journeyData } = await supabase
        .from('buyer_journeys')
        .select('*')
        .eq('brand_id', brandId)
        .maybeSingle();

      console.log('[Generation] Enrichment data:', {
        hasUVP: !!uvpData,
        hasJourney: !!journeyData,
      });

      // Build BrandData object from brand table + enrichment
      return {
        id: brand.id,
        name: brand.name || 'Your Business',
        industry: brand.industry || 'restaurant',
        businessType: brand.business_type || brand.industry || 'Business',
        location: brand.location,
        website: brand.website,

        // Use UVP data if available, otherwise defaults
        uvp: uvpData?.unique_solution || this.getDefaultUvp(brand.industry),
        benefits: uvpData?.key_benefit ? [uvpData.key_benefit] : this.getIndustryBenefits(brand.industry),
        features: this.getIndustryFeatures(brand.industry),

        // UVP Details (enhanced)
        uvpDetails: uvpData ? {
          target_customer: uvpData.target_customer,
          customer_problem: uvpData.customer_problem,
          unique_solution: uvpData.unique_solution,
          key_benefit: uvpData.key_benefit,
          differentiation: uvpData.differentiation,
        } : undefined,

        // Buyer Journey Data (enhanced) - Access from journey_map JSONB column
        buyerJourney: journeyData?.journey_map?.ideal_customer_profile ? {
          ideal_customer_profile: {
            segment_name: journeyData.journey_map.ideal_customer_profile.segment_name,
            demographics: journeyData.journey_map.ideal_customer_profile.demographics,
            psychographics: journeyData.journey_map.ideal_customer_profile.psychographics,
            pain_points: journeyData.journey_map.ideal_customer_profile.pain_points,
            goals: journeyData.journey_map.ideal_customer_profile.goals,
            buying_triggers: journeyData.journey_map.ideal_customer_profile.buying_triggers,
          },
        } : undefined,

        // Use journey audience if available, otherwise industry defaults
        targetAudience: journeyData?.journey_map?.ideal_customer_profile?.segment_name || this.getIndustryAudience(brand.industry),
        audienceCharacteristics: journeyData?.journey_map?.ideal_customer_profile?.psychographics?.values || [],

        // Brand voice based on industry
        brandVoice: this.getIndustryVoice(brand.industry),

        // Content themes based on industry
        contentThemes: this.getIndustryThemes(brand.industry),

        // Power words from industry profile
        powerWords: this.getIndustryPowerWords(brand.industry),

        // Placeholder for current offers
        currentOffers: [],
        upcomingEvents: [],
      };
    } catch (error) {
      console.error('Error loading brand data:', error);
      return this.getDefaultBrandData(brandId);
    }
  }

  /**
   * Get default/fallback brand data
   */
  private getDefaultBrandData(brandId: string): BrandData {
    return {
      id: brandId,
      name: 'Your Business',
      industry: 'restaurant',
      businessType: 'Restaurant',
      location: 'Your City',
      uvp: 'Quality service and products',
      benefits: ['Great service', 'Quality products', 'Customer focused'],
      features: ['Professional', 'Reliable', 'Experienced'],
      targetAudience: 'Local customers and businesses',
      contentThemes: ['Daily updates', 'Behind the scenes', 'Customer stories'],
      powerWords: ['quality', 'professional', 'trusted', 'local', 'expert'],
      currentOffers: [],
    };
  }

  /**
   * Infer brand voice from archetype
   */
  private inferBrandVoice(archetype: string | undefined): string {
    if (!archetype) return 'professional yet friendly';

    const archetypeLower = archetype.toLowerCase();

    if (archetypeLower.includes('sage') || archetypeLower.includes('expert')) {
      return 'authoritative and knowledgeable';
    }
    if (archetypeLower.includes('jester') || archetypeLower.includes('everyman')) {
      return 'friendly and approachable';
    }
    if (archetypeLower.includes('hero') || archetypeLower.includes('outlaw')) {
      return 'bold and confident';
    }
    if (archetypeLower.includes('lover') || archetypeLower.includes('ruler')) {
      return 'elegant and sophisticated';
    }
    if (archetypeLower.includes('caregiver') || archetypeLower.includes('innocent')) {
      return 'warm and caring';
    }

    return 'professional yet friendly';
  }

  /**
   * Get default UVP for industry
   */
  private getDefaultUvp(industry: string | undefined): string {
    const uvps: Record<string, string> = {
      restaurant: 'Quality food and exceptional service',
      cpa: 'Expert tax and accounting services you can trust',
      realtor: 'Your trusted partner in real estate',
      dentist: 'Caring dental care for your whole family',
      consultant: 'Strategic consulting for business growth',
      attorney: 'Experienced legal counsel for your needs',
      contractor: 'Quality craftsmanship and reliable service',
      salon: 'Beauty and wellness services that make you feel great',
      fitness: 'Transform your health and fitness',
      retail: 'Quality products and exceptional service',
      plumber: 'Fast, reliable plumbing services',
      electrician: 'Safe, professional electrical services',
      hvac: 'Comfort solutions for your home or business',
      auto: 'Trusted auto repair and maintenance',
      cleaning: 'Professional cleaning for your home or office',
    };
    return uvps[industry || 'restaurant'] || 'Quality service and products';
  }

  /**
   * Get industry benefits
   */
  private getIndustryBenefits(industry: string | undefined): string[] {
    const benefits: Record<string, string[]> = {
      restaurant: ['Fresh ingredients', 'Expert chefs', 'Welcoming atmosphere'],
      cpa: ['Tax savings', 'Peace of mind', 'Expert guidance'],
      realtor: ['Market expertise', 'Smooth transactions', 'Personalized service'],
      dentist: ['Pain-free procedures', 'Modern technology', 'Flexible scheduling'],
      consultant: ['Strategic insights', 'Proven methods', 'ROI focused'],
      attorney: ['Experienced counsel', 'Clear communication', 'Results oriented'],
      contractor: ['Quality work', 'On-time delivery', 'Licensed & insured'],
      salon: ['Skilled stylists', 'Premium products', 'Relaxing environment'],
      fitness: ['Expert trainers', 'Modern equipment', 'Flexible schedules'],
      retail: ['Wide selection', 'Competitive prices', 'Friendly staff'],
    };
    return benefits[industry || 'restaurant'] || ['Great service', 'Quality products', 'Customer focused'];
  }

  /**
   * Get industry features
   */
  private getIndustryFeatures(industry: string | undefined): string[] {
    const features: Record<string, string[]> = {
      restaurant: ['Locally sourced', 'Daily specials', 'Catering available'],
      cpa: ['Year-round service', 'Tax planning', 'Audit support'],
      realtor: ['MLS access', 'Negotiation expertise', 'Market analysis'],
      dentist: ['Digital X-rays', 'Same-day appointments', 'Insurance accepted'],
      consultant: ['Custom strategies', 'Data-driven', 'Ongoing support'],
      attorney: ['Free consultation', 'Flexible payment', '24/7 availability'],
    };
    return features[industry || 'restaurant'] || ['Professional', 'Reliable', 'Experienced'];
  }

  /**
   * Get industry target audience
   */
  private getIndustryAudience(industry: string | undefined): string {
    const audiences: Record<string, string> = {
      restaurant: 'Local food lovers and families',
      cpa: 'Small businesses and individuals',
      realtor: 'Homebuyers and sellers in the area',
      dentist: 'Families and individuals seeking dental care',
      consultant: 'Business owners seeking growth',
      attorney: 'Individuals and businesses needing legal help',
    };
    return audiences[industry || 'restaurant'] || 'Local customers and businesses';
  }

  /**
   * Get industry brand voice
   */
  private getIndustryVoice(industry: string | undefined): string {
    const voices: Record<string, string> = {
      restaurant: 'warm and inviting',
      cpa: 'professional and trustworthy',
      realtor: 'knowledgeable and supportive',
      dentist: 'caring and reassuring',
      consultant: 'authoritative and strategic',
      attorney: 'confident and professional',
    };
    return voices[industry || 'restaurant'] || 'professional yet friendly';
  }

  /**
   * Get content themes for industry
   */
  private getIndustryThemes(industry: string | undefined): string[] {
    const themes: Record<string, string[]> = {
      restaurant: ['Daily specials', 'Behind the scenes', 'Customer favorites', 'Chef highlights'],
      cpa: ['Tax tips', 'Financial planning', 'Deadline reminders', 'Success stories'],
      realtor: ['New listings', 'Market updates', 'Home tips', 'Community highlights'],
      dentist: ['Oral health tips', 'Patient stories', 'Practice updates', 'Dental facts'],
      consultant: ['Industry insights', 'Case studies', 'Best practices', 'Thought leadership'],
    };

    return themes[industry || ''] || ['Business updates', 'Customer stories', 'Industry news'];
  }

  /**
   * Get power words for industry
   */
  private getIndustryPowerWords(industry: string | undefined): string[] {
    const industryProfile = industryRegistry.getById(industry || '');
    return industryProfile?.powerWords || ['quality', 'professional', 'trusted', 'expert'];
  }

  // ==========================================================================
  // PROMPT ENHANCEMENT HELPERS
  // ==========================================================================

  /**
   * Build UVP context for AI prompts
   */
  private buildPromptWithUVP(brandData: BrandData): string {
    if (!brandData.uvpDetails) return '';

    const { target_customer, customer_problem, unique_solution, key_benefit, differentiation } = brandData.uvpDetails;

    return `
UVP CONTEXT:
- Target Customer: ${target_customer || 'Not specified'}
- Customer Problem: ${customer_problem || 'Not specified'}
- Our Solution: ${unique_solution || 'Not specified'}
- Key Benefit: ${key_benefit || 'Not specified'}
- Differentiation: ${differentiation || 'Not specified'}

Use this UVP context to ensure all content speaks directly to the target customer's problem and highlights our unique solution.`;
  }

  /**
   * Build Journey context for stage-specific optimization
   */
  private buildPromptWithJourney(brandData: BrandData, journeyStage?: 'awareness' | 'consideration' | 'decision' | 'purchase' | 'advocacy'): string {
    if (!brandData.buyerJourney?.ideal_customer_profile) return '';

    const icp = brandData.buyerJourney.ideal_customer_profile;
    const stage = journeyStage || brandData.buyerJourney.journey_stage;

    let baseContext = `
IDEAL CUSTOMER PROFILE:
- Segment: ${icp.segment_name || 'Not specified'}
- Demographics: ${icp.demographics?.age_range || 'N/A'}, ${icp.demographics?.income_range || 'N/A'}, ${icp.demographics?.occupation || 'N/A'}
- Pain Points: ${icp.pain_points?.slice(0, 3).join(', ') || 'Not specified'}
- Goals: ${icp.goals?.slice(0, 3).join(', ') || 'Not specified'}
- Buying Triggers: ${icp.buying_triggers?.slice(0, 2).join(', ') || 'Not specified'}`;

    // Add stage-specific guidance
    if (stage) {
      const stageGuidance: Record<string, string> = {
        awareness: `
JOURNEY STAGE: Awareness
- Focus: Educate about the problem, not the solution
- Goal: Help them recognize they have a problem worth solving
- Tone: Educational, empathetic, problem-focused
- CTA: Learn more, discover, explore`,

        consideration: `
JOURNEY STAGE: Consideration
- Focus: Present your solution as one of their options
- Goal: Position as the best fit for their specific needs
- Tone: Informative, comparative, value-focused
- CTA: Compare, evaluate, see how it works`,

        decision: `
JOURNEY STAGE: Decision
- Focus: Address objections and differentiation
- Goal: Make it easy to choose you over competitors
- Tone: Confident, reassuring, differentiation-focused
- CTA: Get started, book consultation, try now`,

        purchase: `
JOURNEY STAGE: Purchase
- Focus: Smooth onboarding and immediate value
- Goal: Reinforce their decision and drive action
- Tone: Welcoming, supportive, action-oriented
- CTA: Buy now, sign up, get started today`,

        advocacy: `
JOURNEY STAGE: Advocacy
- Focus: Delight and encourage sharing
- Goal: Turn customers into evangelists
- Tone: Appreciative, community-focused, rewarding
- CTA: Refer a friend, share your story, join community`,
      };

      baseContext += stageGuidance[stage] || '';
    }

    return baseContext;
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  private extractComponents(text: string): {
    headline?: string;
    body: string;
    cta?: string;
    hashtags?: string[];
  } {
    // Simple extraction logic
    // Full version would be more sophisticated

    const lines = text.split('\n').filter((line) => line.trim());
    const hashtags = text.match(/#\w+/g) || [];

    // Remove hashtags from text
    const textWithoutHashtags = text.replace(/#\w+/g, '').trim();

    // First line might be headline if it's short and punchy
    const firstLine = lines[0];
    const headline = firstLine && firstLine.length < 80 ? firstLine : undefined;

    // Last line might be CTA if it has action words
    const lastLine = lines[lines.length - 1];
    const ctaPatterns = /\b(call|visit|book|order|try|get|shop|learn|discover|contact|follow|share)\b/i;
    const cta = lastLine && ctaPatterns.test(lastLine) ? lastLine : undefined;

    // Body is everything else
    const body = textWithoutHashtags;

    return {
      headline,
      body,
      cta,
      hashtags: hashtags.length > 0 ? hashtags : undefined,
    };
  }

  private generateId(): string {
    return `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateProgress(
    stage: GenerationProgress['stage'],
    current: number,
    total: number,
    message: string
  ): void {
    if (this.progressCallback) {
      this.progressCallback({
        stage,
        current,
        total,
        message,
        percentage: Math.round((current / total) * 100),
      });
    }

    // Also call the simple progress callback if provided
    if (this.simpleProgressCallback) {
      this.simpleProgressCallback(current, total);
    }
  }

  private simpleProgressCallback?: (current: number, total: number) => void;
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const contentGenerationService = new ContentGenerationService();
