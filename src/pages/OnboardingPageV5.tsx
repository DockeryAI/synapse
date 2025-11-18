/**
 * Onboarding Page V5 - Discovery-First Smart Onboarding
 *
 * Week 7: Orchestrates the complete onboarding flow with source verification
 *
 * Flow: URL Input → UVP Extraction → Smart Confirmation → Insights Dashboard →
 *       Smart Suggestions → Content Generation → Preview → Email Capture
 */

import React, { useState } from 'react';
import { OnboardingFlow } from '@/components/onboarding-v5/OnboardingFlow';
import { SmartConfirmation, type RefinedBusinessData } from '@/components/onboarding-v5/SmartConfirmation';
import { InsightsDashboard } from '@/components/onboarding-v5/InsightsDashboard';
import { SmartSuggestions } from '@/components/onboarding-v5/SmartSuggestions';
import { PathSelector, ContentPath } from '@/components/onboarding-v5/PathSelector';
import { SinglePostTypeSelector } from '@/components/onboarding-v5/SinglePostTypeSelector';
import { ContentPreview } from '@/components/onboarding-v5/ContentPreview';
import { GenerationProgressComponent } from '@/components/onboarding-v5/GenerationProgress';
import { OnboardingCampaignPreview } from '@/components/onboarding-v5/OnboardingCampaignPreview';
import { OnboardingSinglePostPreview } from '@/components/onboarding-v5/OnboardingSinglePostPreview';
import { ValuePropositionPage, type ValueProposition } from '@/components/onboarding-v5/ValuePropositionPage';
import { BuyerIntelligencePage, type CustomerTrigger, type BuyerPersona } from '@/components/onboarding-v5/BuyerIntelligencePage';
import { CoreTruthPage, type CoreTruth } from '@/components/onboarding-v5/CoreTruthPage';
import type { Transformation } from '@/components/onboarding-v5/TransformationCascade';
import { useNavigate } from 'react-router-dom';
import { SmartUVPExtractor } from '@/services/uvp-wizard/SmartUVPExtractor';
import { IndustryMatchingService } from '@/services/industry/IndustryMatchingService';
import { websiteAnalyzer } from '@/services/intelligence/website-analyzer.service';
import { campaignGenerator } from '@/services/campaign/CampaignGenerator';
import { scrapeWebsite } from '@/services/scraping/websiteScraper';
import { locationDetectionService } from '@/services/intelligence/location-detection.service';
import { productScannerService } from '@/services/intelligence/product-scanner.service';
import { dataCollectionService, type OnboardingDataPackage } from '@/services/onboarding-v5/data-collection.service';
import { onboardingV5DataService } from '@/services/supabase/onboarding-v5-data.service';
import { useBrand } from '@/contexts/BrandContext';
import { supabase } from '@/lib/supabase';
import { insightsStorageService, type BusinessInsights } from '@/services/insights/insights-storage.service';
import type { ExtractedUVPData } from '@/types/smart-uvp.types';
import type { IndustryOption } from '@/components/onboarding-v5/IndustrySelector';
import type { WebsiteMessagingAnalysis } from '@/services/intelligence/website-analyzer.service';
import type {
  GeneratedCampaign,
  GeneratedPost,
  CampaignGenerationInput,
  PostGenerationInput,
  GenerationProgress,
} from '@/types/campaign-generation.types';
import { mapCampaignIdToType, mapPostIdToType, PostType } from '@/types/campaign-generation.types';

type FlowStep =
  | 'url_input'
  | 'data_collection'
  | 'value_propositions'
  | 'buyer_intelligence'
  | 'core_truth'
  | 'uvp_extraction'
  | 'smart_confirmation'
  | 'quick_refinement'
  | 'insights'
  | 'suggestions'
  | 'path_selection'
  | 'post_type_selection'
  | 'content_generation'
  | 'content_preview'
  | 'complete';

export interface DetectedBusinessData {
  url: string;
  businessName: string;
  industry: string;
  industryCode: string;
  specialization: string;
  location?: string;
  services: string[];
  competitors: string[];
  uvpData?: ExtractedUVPData;
  sources: {
    website: string;
    verified: boolean;
  };
}

export const OnboardingPageV5: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentBrand } = useBrand();
  const [currentStep, setCurrentStep] = useState<FlowStep>('url_input');
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [businessData, setBusinessData] = useState<DetectedBusinessData | null>(null);
  const [websiteAnalysis, setWebsiteAnalysis] = useState<WebsiteMessagingAnalysis | null>(null);
  const [refinedData, setRefinedData] = useState<RefinedBusinessData | null>(null);
  const [selectedPath, setSelectedPath] = useState<ContentPath | null>(null);
  const [selectedPostType, setSelectedPostType] = useState<PostType | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [progressSteps, setProgressSteps] = useState<Array<{step: string; status: 'pending' | 'in_progress' | 'complete' | 'error'; details?: string}>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCampaign, setGeneratedCampaign] = useState<GeneratedCampaign | null>(null);
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);

  // New state for Week 2 3-page flow
  const [collectedData, setCollectedData] = useState<OnboardingDataPackage | null>(null);
  const [validatedValueProps, setValidatedValueProps] = useState<Set<string>>(new Set());
  const [validatedTriggers, setValidatedTriggers] = useState<Set<string>>(new Set());
  const [validatedPersonas, setValidatedPersonas] = useState<Set<string>>(new Set());

  const addProgressStep = (step: string, status: 'pending' | 'in_progress' | 'complete' | 'error', details?: string) => {
    setProgressSteps(prev => {
      const existing = prev.find(s => s.step === step);
      if (existing) {
        return prev.map(s => s.step === step ? { ...s, status, details } : s);
      }
      return [...prev, { step, status, details }];
    });
  };

  // Handle URL submission - START Track E MARBA data collection
  const handleUrlSubmit = async (url: string, industry: IndustryOption) => {
    console.log('[OnboardingPageV5] URL submitted:', url);
    console.log('[OnboardingPageV5] Industry selected:', industry.displayName);

    // Validate URL format
    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      new URL(fullUrl);
    } catch {
      setExtractionError('Please enter a valid website URL');
      return;
    }

    setWebsiteUrl(url);
    setCurrentStep('data_collection');
    setIsExtracting(true);
    setExtractionError(null);
    setProgressSteps([
      { step: 'Scanning website content', status: 'pending' },
      { step: 'Extracting value propositions', status: 'pending' },
      { step: 'Analyzing buyer intelligence', status: 'pending' },
      { step: 'Synthesizing brand narrative', status: 'pending' },
    ]);

    try {
      // Step 1: Scrape website to get content
      addProgressStep('Scanning website content', 'in_progress', 'Reading your website...');
      const scrapedData = await scrapeWebsite(url);
      addProgressStep('Scanning website content', 'complete', 'Website scanned successfully');

      // Extract business name from website metadata
      let businessName = 'Your Business';
      if (scrapedData?.metadata?.title) {
        // Clean and extract business name from title
        let cleanTitle = scrapedData.metadata.title
          .replace(/\s+/g, ' ')
          .trim();

        // Extract business name from title (remove common suffixes)
        businessName = cleanTitle
          .replace(/\s*[-|–]\s*(Home|About|Services|Welcome).*$/i, '')
          .split(/\s*[|–-]\s*/)[0]
          .trim();

        // Fallback to h1 if extraction failed
        if (!businessName || businessName.length < 3 || businessName.toLowerCase() === 'home') {
          const firstH1 = scrapedData.content?.headings?.find((h: string) => h && h.length < 50 && h.length > 3);
          if (firstH1) {
            businessName = firstH1.trim();
          } else {
            businessName = 'Your Business';
          }
        }
      }

      console.log('[OnboardingPageV5] Extracted business name:', businessName);

      // Step 2-4: Run comprehensive MARBA data collection
      const collectedOnboardingData = await dataCollectionService.collectOnboardingData(
        scrapedData,
        businessName,
        industry.displayName,
        (progress) => {
          // Map DataCollectionProgress to addProgressStep format
          addProgressStep(
            progress.message,
            progress.progress >= 100 ? 'complete' : 'in_progress',
            progress.details
          );
        }
      );

      console.log('[OnboardingPageV5] Data collection complete:', {
        valueProps: collectedOnboardingData.valuePropositions.length,
        personas: collectedOnboardingData.buyerPersonas.length,
        triggers: collectedOnboardingData.customerTriggers.length,
        transformations: collectedOnboardingData.transformations.length,
        hasCoreTruth: !!collectedOnboardingData.coreTruth,
      });

      // Set the collected data for the 3-page review flow
      setCollectedData(collectedOnboardingData);

      // Wait a moment to show completed state
      await new Promise(resolve => setTimeout(resolve, 500));

      setIsExtracting(false);

      // Transition to Track E 3-page flow: value_propositions → buyer_intelligence → core_truth
      setCurrentStep('value_propositions');

    } catch (error) {
      console.error('[OnboardingPageV5] Data collection error:', error);
      setExtractionError(error instanceof Error ? error.message : 'Failed to collect onboarding data');
      setIsExtracting(false);
      setCurrentStep('url_input');
    }
  };

  // Legacy handler for OnboardingFlow component
  const handleBusinessDetected = (businessData: DetectedBusinessData) => {
    console.log('[OnboardingPageV5] Business detected (legacy):', businessData);
    setBusinessData(businessData);
    setCurrentStep('path_selection');
  };

  // Handle smart confirmation - user has reviewed and confirmed/refined data
  const handleSmartConfirmation = async (refined: RefinedBusinessData) => {
    console.log('[OnboardingPageV5] handleSmartConfirmation called with:', refined);
    // Update business data with refined values
    if (businessData) {
      setBusinessData({
        ...businessData,
        businessName: refined.businessName,
        location: refined.location,
        services: refined.selectedServices,
      });
    }

    // Set refined data and immediately save to database and navigate to dashboard
    setRefinedData(refined);
    console.log('[OnboardingPageV5] Refined data set, now saving and navigating to dashboard');

    // Call handleInsightsContinue to save data and navigate
    // Use setTimeout to ensure state updates complete
    setTimeout(() => {
      handleInsightsContinue();
    }, 0);
  };

  // Handle insights continue - user reviewed insights, save to database and move to suggestions
  const handleInsightsContinue = async () => {
    if (!refinedData || !businessData || !websiteAnalysis) {
      console.error('[OnboardingPageV5] Missing data for saving insights');
      setCurrentStep('suggestions');
      return;
    }

    try {
      console.log('[OnboardingPageV5] Creating/updating brand and saving insights...');

      // Step 1: Create or update brand in Supabase
      const { data: existingBrand, error: checkError } = await supabase
        .from('brands')
        .select('id')
        .eq('name', refinedData.businessName)
        .maybeSingle();

      if (checkError) {
        console.error('[OnboardingPageV5] Error checking for existing brand:', checkError);
      }

      let brandId: string;

      if (existingBrand) {
        // Update existing brand
        brandId = existingBrand.id;
        console.log('[OnboardingPageV5] Updating existing brand:', brandId);

        const { error: updateError } = await supabase
          .from('brands')
          .update({
            industry: businessData.industry,
            website: businessData.url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', brandId);

        if (updateError) {
          console.error('[OnboardingPageV5] Error updating brand:', updateError);
        }
      } else {
        // Create new brand
        console.log('[OnboardingPageV5] Creating new brand');

        const { data: newBrand, error: createError } = await supabase
          .from('brands')
          .insert({
            name: refinedData.businessName,
            industry: businessData.industry,
            website: businessData.url,
            description: businessData.specialization,
          })
          .select()
          .single();

        if (createError || !newBrand) {
          console.error('[OnboardingPageV5] Error creating brand:', createError);
          throw new Error('Failed to create brand');
        }

        brandId = newBrand.id;
        console.log('[OnboardingPageV5] Created new brand:', brandId);
      }

      // Step 2: Build BusinessInsights object from gathered data
      const insights: BusinessInsights = {
        websiteAnalysis: {
          uvps: websiteAnalysis.valuePropositions || [],
          keyMessages: websiteAnalysis.solutions || [],
          brandVoice: websiteAnalysis.targetAudience.join(', ') || 'professional',
          contentThemes: websiteAnalysis.differentiators || [],
        },
        locationData: refinedData.location ? {
          city: refinedData.location.split(',')[0]?.trim() || '',
          state: refinedData.location.split(',')[1]?.trim() || '',
          serviceArea: [],
        } : undefined,
        servicesProducts: refinedData.selectedServices.map(name => ({
          name,
          description: '',
        })),
        customerTriggers: refinedData.selectedCustomers.map(customer => ({
          trigger: customer,
          painPoint: websiteAnalysis.customerProblems[0] || 'Unknown pain point',
          desire: websiteAnalysis.solutions[0] || 'Unknown desire',
          source: 'website_analysis',
        })),
        marketTrends: [],
        competitorData: [],
        brandVoice: {
          personality: websiteAnalysis.targetAudience[0] || 'professional',
          tone: websiteAnalysis.differentiators || [],
        },
      };

      // Step 3: Save insights to database
      console.log('[OnboardingPageV5] Saving insights to database...');
      await insightsStorageService.saveInsights(brandId, insights);
      console.log('[OnboardingPageV5] Insights saved successfully');

      // Step 4: Set brand in context for use across the app
      const brandData = {
        id: brandId,
        name: refinedData.businessName,
        industry: businessData.industry,
        description: businessData.specialization,
        website: businessData.url,
      };

      setCurrentBrand(brandData);
      console.log('[OnboardingPageV5] Brand set in context');

      // Step 5: Navigate to dashboard
      console.log('[OnboardingPageV5] Onboarding complete - redirecting to dashboard');
      navigate('/dashboard');
    } catch (error) {
      console.error('[OnboardingPageV5] Failed to save insights:', error);
      // Navigate to dashboard anyway to prevent blocking the user
      navigate('/dashboard');
    }
  };

  // Track E Navigation Handlers - Value Propositions Page
  const handleValidateValueProp = (id: string) => {
    console.log('[OnboardingPageV5] Validating value prop:', id);
    setValidatedValueProps(prev => new Set(prev).add(id));
  };

  const handleRejectValueProp = (id: string) => {
    console.log('[OnboardingPageV5] Rejecting value prop:', id);
    if (!collectedData) return;

    setCollectedData({
      ...collectedData,
      valuePropositions: collectedData.valuePropositions.filter(vp => vp.id !== id),
    });
  };

  const handleEditValueProp = (id: string, text: string) => {
    console.log('[OnboardingPageV5] Editing value prop:', id, text);
    if (!collectedData) return;

    setCollectedData({
      ...collectedData,
      valuePropositions: collectedData.valuePropositions.map(vp =>
        vp.id === id ? { ...vp, text } : vp
      ),
    });
  };

  const handleRegenerateAllValueProps = () => {
    console.log('[OnboardingPageV5] Regenerating all value props - placeholder');
    // TODO: Implement regeneration logic
  };

  const handleValuePropsNext = () => {
    console.log('[OnboardingPageV5] Moving to buyer intelligence');
    setCurrentStep('buyer_intelligence');
  };

  // Track E Navigation Handlers - Buyer Intelligence Page
  const handleValidateTrigger = (id: string) => {
    console.log('[OnboardingPageV5] Validating trigger:', id);
    setValidatedTriggers(prev => new Set(prev).add(id));
  };

  const handleValidatePersona = (id: string) => {
    console.log('[OnboardingPageV5] Validating persona:', id);
    setValidatedPersonas(prev => new Set(prev).add(id));
  };

  const handleBuyerIntelNext = () => {
    console.log('[OnboardingPageV5] Moving to core truth');
    setCurrentStep('core_truth');
  };

  const handleBackFromBuyerIntel = () => {
    console.log('[OnboardingPageV5] Going back to value propositions');
    setCurrentStep('value_propositions');
  };

  // Track E Navigation Handlers - Core Truth Page
  const handleCoreTruthComplete = async () => {
    console.log('[OnboardingPageV5] Completing core truth and saving to database');

    if (!collectedData || !businessData || !refinedData) {
      console.error('[OnboardingPageV5] Missing required data for saving');
      navigate('/dashboard');
      return;
    }

    try {
      // Step 1: Create or update brand in Supabase
      const { data: existingBrand, error: checkError } = await supabase
        .from('brands')
        .select('id')
        .eq('name', refinedData.businessName)
        .maybeSingle();

      if (checkError) {
        console.error('[OnboardingPageV5] Error checking for existing brand:', checkError);
      }

      let brandId: string;

      if (existingBrand) {
        // Update existing brand
        brandId = existingBrand.id;
        console.log('[OnboardingPageV5] Updating existing brand:', brandId);

        const { error: updateError } = await supabase
          .from('brands')
          .update({
            industry: businessData.industry,
            website: businessData.url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', brandId);

        if (updateError) {
          console.error('[OnboardingPageV5] Error updating brand:', updateError);
        }
      } else {
        // Create new brand
        console.log('[OnboardingPageV5] Creating new brand');

        const { data: newBrand, error: createError } = await supabase
          .from('brands')
          .insert({
            name: refinedData.businessName,
            industry: businessData.industry,
            website: businessData.url,
            description: businessData.specialization,
          })
          .select()
          .single();

        if (createError || !newBrand) {
          console.error('[OnboardingPageV5] Error creating brand:', createError);
          throw new Error('Failed to create brand');
        }

        brandId = newBrand.id;
        console.log('[OnboardingPageV5] Created new brand:', brandId);
      }

      // Step 2: Save validated value propositions
      const validatedProps = collectedData.valuePropositions.filter(vp =>
        validatedValueProps.has(vp.id)
      );
      await onboardingV5DataService.saveValuePropositions(brandId, validatedProps as any);
      console.log('[OnboardingPageV5] Saved', validatedProps.length, 'value propositions');

      // Step 3: Save validated buyer personas
      const validatedPersonasData = collectedData.buyerPersonas.filter(persona =>
        validatedPersonas.has(persona.id)
      );
      await onboardingV5DataService.saveBuyerPersonas(brandId, validatedPersonasData as any);
      console.log('[OnboardingPageV5] Saved', validatedPersonasData.length, 'buyer personas');

      // Step 4: Save core truth insight
      await onboardingV5DataService.saveCoreTruthInsight(brandId, collectedData.coreTruth);
      console.log('[OnboardingPageV5] Saved core truth insight');

      // Step 5: Set brand in context
      const brandData = {
        id: brandId,
        name: refinedData.businessName,
        industry: businessData.industry,
        description: businessData.specialization,
        website: businessData.url,
      };

      setCurrentBrand(brandData);
      console.log('[OnboardingPageV5] Brand set in context');

      // Step 6: Navigate to dashboard
      console.log('[OnboardingPageV5] Track E onboarding complete - redirecting to dashboard');
      navigate('/dashboard');
    } catch (error) {
      console.error('[OnboardingPageV5] Failed to save Track E data:', error);
      // Navigate to dashboard anyway to prevent blocking the user
      navigate('/dashboard');
    }
  };

  const handleCoreTruthExport = () => {
    console.log('[OnboardingPageV5] Exporting core truth - placeholder');
    // TODO: Implement export logic
  };

  const handleBackFromCoreTruth = () => {
    console.log('[OnboardingPageV5] Going back to buyer intelligence');
    setCurrentStep('buyer_intelligence');
  };

  // Handle campaign selection from SmartSuggestions
  const handleCampaignSelected = async (campaignId: string) => {
    console.log('[OnboardingPageV5] Campaign selected:', campaignId);

    if (!refinedData || !businessData || !websiteAnalysis) {
      console.error('[OnboardingPageV5] Missing required data for campaign generation');
      return;
    }

    // Transition to content generation step
    setCurrentStep('content_generation');
    setIsGenerating(true);

    // Initialize progress
    const sessionId = `campaign-${Date.now()}`;
    const totalPosts = 7;

    setGenerationProgress({
      sessionId,
      stage: 'initializing',
      progress: 0,
      totalPosts,
      errors: [],
    });

    try {
      const campaignType = mapCampaignIdToType(campaignId);

      // Update progress stages
      setGenerationProgress({
        sessionId,
        stage: 'analyzing_business',
        progress: 15,
        totalPosts,
        errors: [],
      });

      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay

      setGenerationProgress({
        sessionId,
        stage: 'selecting_insights',
        progress: 30,
        totalPosts,
        errors: [],
      });

      await new Promise(resolve => setTimeout(resolve, 800));

      setGenerationProgress({
        sessionId,
        stage: 'generating_content',
        progress: 50,
        currentPost: 1,
        totalPosts,
        estimatedTimeRemaining: 20,
        errors: [],
      });

      const input: CampaignGenerationInput = {
        campaignId: sessionId,
        campaignType,
        businessContext: {
          businessData: refinedData,
          uvpData: businessData.uvpData!,
          websiteAnalysis,
          specialization: businessData.specialization,
        },
        options: {
          postsPerCampaign: totalPosts,
          platforms: ['linkedin', 'facebook'],
          includeVisuals: true,
          saveToDatabase: true,
        },
      };

      const campaign = await campaignGenerator.generateCampaign(input);

      // Update progress for visuals
      setGenerationProgress({
        sessionId,
        stage: 'generating_visuals',
        progress: 80,
        totalPosts,
        errors: [],
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update progress for saving
      setGenerationProgress({
        sessionId,
        stage: 'saving_to_database',
        progress: 95,
        totalPosts,
        errors: [],
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Complete
      setGenerationProgress({
        sessionId,
        stage: 'complete',
        progress: 100,
        totalPosts,
        errors: [],
      });

      setGeneratedCampaign(campaign);
      console.log('[OnboardingPageV5] Campaign generated:', campaign);

      // Small delay before transitioning to preview
      await new Promise(resolve => setTimeout(resolve, 800));
      setCurrentStep('content_preview');
    } catch (error) {
      console.error('[OnboardingPageV5] Campaign generation failed:', error);
      setGenerationProgress({
        sessionId,
        stage: 'failed',
        progress: 0,
        totalPosts,
        errors: [
          {
            stage: 'generating_content',
            message: error instanceof Error ? error.message : 'Failed to generate campaign',
            timestamp: new Date(),
            retryable: true,
          },
        ],
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle post selection from SmartSuggestions
  const handlePostSelected = async (postId: string) => {
    console.log('[OnboardingPageV5] Post selected:', postId);

    if (!refinedData || !businessData || !websiteAnalysis) {
      console.error('[OnboardingPageV5] Missing required data for post generation');
      return;
    }

    // Transition to content generation step
    setCurrentStep('content_generation');
    setIsGenerating(true);

    // Initialize progress
    const sessionId = `post-${Date.now()}`;
    const totalPosts = 1;

    setGenerationProgress({
      sessionId,
      stage: 'initializing',
      progress: 0,
      totalPosts,
      errors: [],
    });

    try {
      const postType: PostType = mapPostIdToType(postId);
      setSelectedPostType(postType as PostType);

      // Update progress stages
      setGenerationProgress({
        sessionId,
        stage: 'analyzing_business',
        progress: 20,
        totalPosts,
        errors: [],
      });

      await new Promise(resolve => setTimeout(resolve, 800));

      setGenerationProgress({
        sessionId,
        stage: 'selecting_insights',
        progress: 40,
        totalPosts,
        errors: [],
      });

      await new Promise(resolve => setTimeout(resolve, 600));

      setGenerationProgress({
        sessionId,
        stage: 'generating_content',
        progress: 60,
        currentPost: 1,
        totalPosts,
        estimatedTimeRemaining: 10,
        errors: [],
      });

      const input: PostGenerationInput = {
        postType,
        businessContext: {
          businessData: refinedData,
          uvpData: businessData.uvpData!,
          websiteAnalysis,
          specialization: businessData.specialization,
        },
        platforms: ['linkedin', 'facebook'],
        options: {
          includeVisuals: true,
          saveToDatabase: true,
        },
      };

      const post = await campaignGenerator.generatePost(input);

      // Update progress for visuals
      setGenerationProgress({
        sessionId,
        stage: 'generating_visuals',
        progress: 85,
        totalPosts,
        errors: [],
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update progress for saving
      setGenerationProgress({
        sessionId,
        stage: 'saving_to_database',
        progress: 95,
        totalPosts,
        errors: [],
      });

      await new Promise(resolve => setTimeout(resolve, 400));

      // Complete
      setGenerationProgress({
        sessionId,
        stage: 'complete',
        progress: 100,
        totalPosts,
        errors: [],
      });

      setGeneratedPost(post);
      console.log('[OnboardingPageV5] Post generated:', post);

      // Small delay before transitioning to preview
      await new Promise(resolve => setTimeout(resolve, 600));
      setCurrentStep('content_preview');
    } catch (error) {
      console.error('[OnboardingPageV5] Post generation failed:', error);
      setGenerationProgress({
        sessionId,
        stage: 'failed',
        progress: 0,
        totalPosts,
        errors: [
          {
            stage: 'generating_content',
            message: error instanceof Error ? error.message : 'Failed to generate post',
            timestamp: new Date(),
            retryable: true,
          },
        ],
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle custom builder from SmartSuggestions
  const handleBuildCustom = () => {
    console.log('[OnboardingPageV5] Building custom content');
    setSelectedPath('single_post');
    // Show post type selector for custom building
    setCurrentStep('post_type_selection');
  };

  // Handle path selection
  const handlePathSelected = (path: ContentPath) => {
    console.log('[OnboardingPageV5] Path selected:', path);
    setSelectedPath(path);

    if (path === 'campaign') {
      // Campaign path: Generate full campaign via CampaignTypeEngine
      generateCampaign();
    } else {
      // Single post path: Show post type selector
      setCurrentStep('post_type_selection');
    }
  };

  // Handle post type selection
  const handlePostTypeSelected = (postType: PostType, storyData?: any) => {
    console.log('[OnboardingPageV5] Post type selected:', postType, storyData);
    setSelectedPostType(postType);
    generateSinglePost(postType, storyData);
  };

  // Generate full campaign
  const generateCampaign = async () => {
    console.log('[OnboardingPageV5] Generating campaign...');
    // TODO: Wire to CampaignTypeEngine
    // For now, show placeholder content
    setCurrentStep('content_preview');
  };

  // Generate single post
  const generateSinglePost = async (postType: PostType, storyData?: any) => {
    console.log('[OnboardingPageV5] Generating single post:', postType, storyData);
    // Store the selected post type for content preview
    setSelectedPostType(postType);
    // TODO: Wire to actual content generation + calendar integration
    setCurrentStep('content_preview');
  };

  // Handle copy action
  const handleCopy = () => {
    console.log('[OnboardingPageV5] Content copied');
    // TODO: Analytics tracking
  };

  // Handle save to calendar
  const handleSaveToCalendar = () => {
    console.log('[OnboardingPageV5] Saving to calendar...');
    // TODO: Wire to calendar system
    setCurrentStep('complete');

    // Navigate to campaign page after save
    setTimeout(() => {
      navigate('/campaign/new');
    }, 2000);
  };

  // Handle email capture
  const handleEmailCapture = (email: string) => {
    console.log('[OnboardingPageV5] Email captured:', email);
    // TODO: Save to Supabase email_captures table
    // TODO: Analytics tracking
  };

  // Handle schedule campaign - transitions to complete, navigates to calendar
  const handleScheduleCampaign = () => {
    console.log('[OnboardingPageV5] Scheduling campaign...');
    setCurrentStep('complete');

    // Navigate to calendar after a brief delay
    setTimeout(() => {
      navigate('/calendar');
    }, 2000);
  };

  // Handle schedule single post - saves post, navigates to calendar
  const handleScheduleSinglePost = () => {
    console.log('[OnboardingPageV5] Scheduling single post...');
    setCurrentStep('complete');

    // Navigate to calendar after a brief delay
    setTimeout(() => {
      navigate('/calendar');
    }, 2000);
  };

  // Handle back to suggestions - goes back to suggestions step
  const handleBackToSuggestions = () => {
    console.log('[OnboardingPageV5] Going back to suggestions');
    setCurrentStep('suggestions');
    setGeneratedCampaign(null);
    setGeneratedPost(null);
    setGenerationProgress(null);
  };

  return (
    <div className="min-h-screen">
      {currentStep === 'url_input' && (
        <OnboardingFlow
          onUrlSubmit={handleUrlSubmit}
          onComplete={handleBusinessDetected}
          error={extractionError}
        />
      )}

      {currentStep === 'uvp_extraction' && (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-6"></div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Learning About Your Business...
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Analyzing your website to understand what makes you unique
              </p>
            </div>

            {/* Progress Steps */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 space-y-4">
              {progressSteps.map((step, index) => (
                <div
                  key={step.step}
                  className={`flex items-start gap-4 pb-4 ${
                    index < progressSteps.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''
                  }`}
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {step.status === 'pending' && (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
                    )}
                    {step.status === 'in_progress' && (
                      <div className="w-6 h-6 rounded-full border-2 border-purple-600 border-t-transparent animate-spin"></div>
                    )}
                    {step.status === 'complete' && (
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    {step.status === 'error' && (
                      <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-lg font-semibold ${
                      step.status === 'in_progress'
                        ? 'text-purple-600 dark:text-purple-400'
                        : step.status === 'complete'
                        ? 'text-green-600 dark:text-green-400'
                        : step.status === 'error'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step.step}
                    </h3>
                    {step.details && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {step.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {extractionError && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-red-600 dark:text-red-400 mb-3">{extractionError}</p>
                <button
                  onClick={() => setCurrentStep('url_input')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {currentStep === 'value_propositions' && collectedData && (
        <ValuePropositionPage
          {...{
            valuePropositions: collectedData.valuePropositions,
            validatedIds: validatedValueProps,
            onValidate: handleValidateValueProp,
            onReject: handleRejectValueProp,
            onEdit: handleEditValueProp,
            onRegenerateAll: handleRegenerateAllValueProps,
            onNext: handleValuePropsNext,
          } as any}
        />
      )}

      {currentStep === 'buyer_intelligence' && collectedData && (
        <BuyerIntelligencePage
          {...{
            triggers: collectedData.customerTriggers,
            personas: collectedData.buyerPersonas,
            validatedTriggerIds: validatedTriggers,
            validatedPersonaIds: validatedPersonas,
            onValidateTrigger: handleValidateTrigger,
            onValidatePersona: handleValidatePersona,
            onNext: handleBuyerIntelNext,
            onBack: handleBackFromBuyerIntel,
          } as any}
        />
      )}

      {currentStep === 'core_truth' && collectedData && (
        <CoreTruthPage
          {...{
            coreTruth: collectedData.coreTruth,
            transformations: collectedData.transformations,
            industryEQScore: collectedData.industryEQScore,
            onComplete: handleCoreTruthComplete,
            onExport: handleCoreTruthExport,
            onBack: handleBackFromCoreTruth,
          } as any}
        />
      )}

      {currentStep === 'smart_confirmation' && businessData && websiteAnalysis && (
        <SmartConfirmation
          businessName={businessData.businessName}
          specialization={businessData.specialization}
          location={businessData.location || ''}
          uvpData={businessData.uvpData!}
          websiteAnalysis={websiteAnalysis}
          onConfirm={handleSmartConfirmation}
          onBack={() => setCurrentStep('url_input')}
        />
      )}

      {currentStep === 'insights' && businessData && websiteAnalysis && refinedData && (
        <InsightsDashboard
          refinedData={refinedData}
          uvpData={businessData.uvpData!}
          websiteAnalysis={websiteAnalysis}
          specialization={businessData.specialization}
          onContinue={handleInsightsContinue}
        />
      )}

      {currentStep === 'suggestions' && businessData && websiteAnalysis && refinedData && (
        <SmartSuggestions
          refinedData={refinedData}
          uvpData={businessData.uvpData!}
          websiteAnalysis={websiteAnalysis}
          onSelectCampaign={handleCampaignSelected}
          onSelectPost={handlePostSelected}
          onBuildCustom={handleBuildCustom}
        />
      )}

      {currentStep === 'path_selection' && businessData && (
        <div>
          <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6 max-w-4xl mx-auto my-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Your Business Profile is Ready!
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Business Name</p>
                <p className="font-medium text-gray-900 dark:text-white">{businessData.businessName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Business Type</p>
                <p className="font-medium text-gray-900 dark:text-white">{businessData.industry}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Specialization</p>
                <p className="font-medium text-gray-900 dark:text-white">{businessData.specialization}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Service Area</p>
                <p className="font-medium text-gray-900 dark:text-white">{businessData.location}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Services Identified</p>
                <p className="font-medium text-gray-900 dark:text-white">{businessData.services.length}</p>
              </div>
            </div>
            {businessData.uvpData && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">What We Found:</p>
                <div className="text-sm space-y-1">
                  <p className="text-gray-700 dark:text-gray-300">
                    • {businessData.uvpData.customerTypes.length} customer types
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    • {businessData.uvpData.services.length} services
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    • {businessData.uvpData.problemsSolved.length} problems you solve
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    • {businessData.uvpData.testimonials.length} customer testimonials
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    • {((businessData.uvpData.verificationRate || 0) * 100).toFixed(0)}% verified from your website
                  </p>
                </div>
              </div>
            )}
          </div>
          <PathSelector onSelectPath={handlePathSelected} />
        </div>
      )}

      {currentStep === 'post_type_selection' && (
        <SinglePostTypeSelector onSelectType={handlePostTypeSelected} />
      )}

      {currentStep === 'content_generation' && generationProgress && (
        <GenerationProgressComponent progress={generationProgress} />
      )}

      {currentStep === 'content_preview' && (
        <>
          {generatedCampaign ? (
            <OnboardingCampaignPreview
              campaign={generatedCampaign}
              onSchedule={handleScheduleCampaign}
              onBack={handleBackToSuggestions}
            />
          ) : generatedPost ? (
            <OnboardingSinglePostPreview
              post={generatedPost}
              onSchedule={handleScheduleSinglePost}
              onBack={handleBackToSuggestions}
            />
          ) : (
            <ContentPreview
              content={{
                type: selectedPath === 'campaign' ? 'campaign' : 'single_post',
                content: 'Generated content will appear here...',
                sources: businessData?.sources.website
                  ? [
                      {
                        url: businessData.sources.website,
                        title: businessData.businessName,
                        type: 'website',
                      },
                    ]
                  : [],
              }}
              onCopy={handleCopy}
              onSaveToCalendar={handleSaveToCalendar}
              onEmailCapture={handleEmailCapture}
            />
          )}
        </>
      )}

      {currentStep === 'complete' && (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              All Set! 🎉
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Redirecting to your calendar...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
