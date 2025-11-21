/**
 * Onboarding Page V5 - Discovery-First Smart Onboarding
 *
 * Week 7: Orchestrates the complete onboarding flow with source verification
 *
 * Flow: URL Input → UVP Extraction → Smart Confirmation → Insights Dashboard →
 *       Smart Suggestions → Content Generation → Preview → Email Capture
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
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
import { comprehensiveProductScannerService } from '@/services/intelligence/comprehensive-product-scanner.service';
import { dataCollectionService, type OnboardingDataPackage } from '@/services/onboarding-v5/data-collection.service';
import { onboardingV5DataService } from '@/services/supabase/onboarding-v5-data.service';
import { saveCompleteUVP } from '@/services/database/marba-uvp.service';
import { hasPendingUVP, migratePendingUVP } from '@/services/database/marba-uvp-migration.service';
import { synthesizeCompleteUVP } from '@/services/uvp-extractors/uvp-synthesis.service';
import { sessionManager } from '@/services/uvp/session-manager.service';
import { useSessionAutoSave } from '@/hooks/useSessionAutoSave';
import type { UVPStepKey } from '@/types/session.types';
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

// UVP Flow imports - Using SIMPLE versions with progressive loading
import { ProductServiceDiscoveryPage } from '@/components/uvp-flow/ProductServiceDiscoveryPage';
import { TargetCustomerPage } from '@/components/uvp-flow/TargetCustomerPage-SIMPLE';
import { TransformationGoalPage } from '@/components/uvp-flow/TransformationGoalPage-SIMPLE';
import { UniqueSolutionPage } from '@/components/uvp-flow/UniqueSolutionPage-SIMPLE';
import { KeyBenefitPage } from '@/components/uvp-flow/KeyBenefitPage-SIMPLE';
import { UVPSynthesisPage } from '@/components/uvp-flow/UVPSynthesisPage';
import { UVPMilestoneProgress, type UVPStep } from '@/components/uvp-flow/UVPMilestoneProgress';
import { InitialLoadingScreen } from '@/components/onboarding-v5/InitialLoadingScreen';

// UVP Extraction services
import { extractProductsServices } from '@/services/uvp-extractors/product-service-extractor.service';
import { extractTargetCustomer } from '@/services/uvp-extractors/customer-extractor.service';
import { analyzeTransformationLanguage } from '@/services/uvp-extractors/transformation-analyzer.service';
import { extractDifferentiators } from '@/services/uvp-extractors/differentiator-extractor.service';
import { extractBenefits } from '@/services/uvp-extractors/benefit-extractor.service';
import type {
  ProductServiceData,
  ProductService,
  CustomerProfile,
  TransformationGoal,
  UniqueSolution,
  KeyBenefit,
  CompleteUVP,
  UVPFlowState,
} from '@/types/uvp-flow.types';

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
  | 'complete'
  // UVP Flow steps
  | 'uvp_products'
  | 'uvp_customer'
  | 'uvp_transformation'
  | 'uvp_solution'
  | 'uvp_benefit'
  | 'uvp_synthesis';

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
  const { currentBrand, setCurrentBrand } = useBrand();
  const [currentStep, setCurrentStep] = useState<FlowStep>('url_input');

  // Check for session ID in URL params for restoration
  React.useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sessionId = searchParams.get('sessionId');

    if (sessionId && currentBrand?.id) {
      restoreSession(sessionId);
    }
  }, [currentBrand?.id]);

  // Check for and migrate pending UVP data after authentication
  React.useEffect(() => {
    const checkPendingUVP = async () => {
      if (!hasPendingUVP()) return;

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();

      if (user && currentBrand?.id) {
        console.log('[OnboardingPageV5] Migrating pending UVP data...');
        const success = await migratePendingUVP(currentBrand.id);

        if (success) {
          console.log('[OnboardingPageV5] Successfully migrated UVP data');
        } else {
          console.error('[OnboardingPageV5] Failed to migrate UVP data');
        }
      }
    };

    checkPendingUVP();
  }, [currentBrand?.id]);

  // Restore session from ID
  const restoreSession = async (sessionId: string) => {
    console.log('[OnboardingPageV5] Restoring session:', sessionId);

    try {
      const result = await sessionManager.getSession(sessionId);

      if (result.success && result.session) {
        const session = result.session;

        // Set session ID
        setCurrentSessionId(session.id);

        // Restore business data
        if (session.business_info) {
          setExtractedBusinessName(session.business_info.name);
          setExtractedLocation(session.business_info.location || '');
        }

        // Restore scraped content
        if (session.scraped_content) {
          setScrapedWebsiteContent(session.scraped_content.content || []);
          setScrapedWebsiteUrls(session.scraped_content.urls || []);
        }

        // Restore UVP data
        if (session.products_data) setProductServiceData(session.products_data as any);
        if (session.customer_data?.selected) setSelectedCustomerProfile(session.customer_data.selected as any);
        if (session.transformation_data?.selected) setSelectedTransformation(session.transformation_data.selected as any);
        if (session.solution_data?.selected) setSelectedSolution(session.solution_data.selected as any);
        if (session.benefit_data?.selected) setSelectedBenefit(session.benefit_data.selected as any);
        if (session.complete_uvp) setCompleteUVP(session.complete_uvp as any);

        // Restore completed steps
        setCompletedUVPSteps(session.completed_steps as any);

        // Navigate to current step
        const stepMap: Record<UVPStepKey, FlowStep> = {
          'products': 'uvp_products',
          'customer': 'uvp_customer',
          'transformation': 'uvp_transformation',
          'solution': 'uvp_solution',
          'benefit': 'uvp_benefit',
          'synthesis': 'uvp_synthesis',
        };
        setCurrentStep(stepMap[session.current_step] || 'uvp_products');
        setWebsiteUrl(session.website_url);

        console.log('[OnboardingPageV5] Session restored successfully');
      } else {
        console.error('[OnboardingPageV5] Failed to restore session:', result.error);
      }
    } catch (error) {
      console.error('[OnboardingPageV5] Error restoring session:', error);
    }
  };
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
  const [isSynthesizingUVP, setIsSynthesizingUVP] = useState(false);
  const [generatedCampaign, setGeneratedCampaign] = useState<GeneratedCampaign | null>(null);
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);

  // New state for Week 2 3-page flow
  const [collectedData, setCollectedData] = useState<OnboardingDataPackage | null>(null);
  const [validatedValueProps, setValidatedValueProps] = useState<Set<string>>(new Set());
  const [validatedTriggers, setValidatedTriggers] = useState<Set<string>>(new Set());
  const [validatedPersonas, setValidatedPersonas] = useState<Set<string>>(new Set());

  // UVP Flow state
  const [uvpFlowData, setUVPFlowData] = useState<Partial<UVPFlowState> | null>(null);
  const [productServiceData, setProductServiceData] = useState<ProductServiceData | null>(null);
  const [selectedCustomerProfile, setSelectedCustomerProfile] = useState<CustomerProfile | null>(null);
  const [selectedTransformation, setSelectedTransformation] = useState<TransformationGoal | null>(null);
  const [selectedTransformations, setSelectedTransformations] = useState<TransformationGoal[]>([]); // Multi-select support
  const [selectedSolution, setSelectedSolution] = useState<UniqueSolution | null>(null);
  const [selectedSolutions, setSelectedSolutions] = useState<UniqueSolution[]>([]); // Multi-select support
  const [selectedBenefit, setSelectedBenefit] = useState<KeyBenefit | null>(null);
  const [completeUVP, setCompleteUVP] = useState<CompleteUVP | null>(null);

  // Track completed UVP steps for navigation
  const [completedUVPSteps, setCompletedUVPSteps] = useState<('products' | 'customer' | 'transformation' | 'solution' | 'benefit' | 'synthesis')[]>([]);

  // Session management state
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Scraped website content for extraction services
  const [scrapedWebsiteContent, setScrapedWebsiteContent] = useState<string[]>([]);
  const [scrapedWebsiteUrls, setScrapedWebsiteUrls] = useState<string[]>([]);

  // AI Suggestions state for UVP Flow
  const [customerSuggestions, setCustomerSuggestions] = useState<CustomerProfile[]>([]);
  const [transformationSuggestions, setTransformationSuggestions] = useState<TransformationGoal[]>([]);
  const [solutionSuggestions, setSolutionSuggestions] = useState<UniqueSolution[]>([]);
  const [benefitSuggestions, setBenefitSuggestions] = useState<KeyBenefit[]>([]);

  // Track if AI suggestions are still loading
  const [aiSuggestionsLoading, setAiSuggestionsLoading] = useState(false);

  // Business info state (editable)
  const [extractedBusinessName, setExtractedBusinessName] = useState<string>('');
  const [extractedLocation, setExtractedLocation] = useState<string>('');

  // Get current UVP step key based on flow step
  const getCurrentUVPStepKey = (): UVPStepKey | null => {
    const stepMap: Record<string, UVPStepKey> = {
      'uvp_products': 'products',
      'uvp_customer': 'customer',
      'uvp_transformation': 'transformation',
      'uvp_solution': 'solution',
      'uvp_benefit': 'benefit',
      'uvp_synthesis': 'synthesis',
    };
    return stepMap[currentStep] || null;
  };

  // Initialize auto-save hook
  const { saveSession, saveImmediately } = useSessionAutoSave({
    sessionId: currentSessionId,
    currentStep: getCurrentUVPStepKey() || 'products',
    onSaveSuccess: () => console.log('[OnboardingPageV5] Session auto-saved'),
    onSaveError: (error) => console.error('[OnboardingPageV5] Session save error:', error),
  });

  // Handle milestone click navigation
  const handleMilestoneClick = (step: UVPStep) => {
    console.log('[OnboardingPageV5] Navigating to step:', step);

    // Only allow navigation to completed steps
    if (!completedUVPSteps.includes(step as any)) {
      console.warn('[OnboardingPageV5] Cannot navigate to incomplete step:', step);
      return;
    }

    // Map UVP step to flow step
    const stepMap: Record<UVPStep, FlowStep> = {
      'products': 'uvp_products',
      'customer': 'uvp_customer',
      'transformation': 'uvp_transformation',
      'solution': 'uvp_solution',
      'benefit': 'uvp_benefit',
      'synthesis': 'uvp_synthesis',
    };

    setCurrentStep(stepMap[step]);
  };

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
    // Pre-define ALL steps in logical order from top to bottom
    setProgressSteps([
      { step: 'Scanning website content', status: 'pending' },
      { step: 'Scanning website for services and products', status: 'pending' },
      { step: 'Analyzing customer testimonials and case studies', status: 'pending' },
      { step: 'Extracting value propositions', status: 'pending' },
      { step: 'Extracting products and services', status: 'pending' },
      { step: 'Calculating brand EQ', status: 'pending' },
    ]);

    try {
      // Step 1: Scrape website to get content
      addProgressStep('Scanning website content', 'in_progress', 'Reading your website...');
      const scrapedData = await scrapeWebsite(url);
      addProgressStep('Scanning website content', 'complete', 'Website scanned successfully');

      // Extract business name from website (prioritize website metadata over domain)
      let businessName = 'Your Business';

      // Method 1: Check metadata title FIRST (most complete business name)
      if (scrapedData?.metadata?.title) {
        const title = scrapedData.metadata.title.trim();

        // Remove navigation words from BEGINNING (handles "Home - Lockwood Wealth" case)
        businessName = title
          .replace(/^\s*\b(Home|About|Services|Contact|Welcome|Page|Menu|Shop|Store|Blog)\b\s*[-|–]\s*/gi, '')
          .trim();

        // Remove common page suffixes and separators
        businessName = businessName
          .replace(/\s*[-|–]\s*(Home|About|Services|Welcome|Contact).*$/i, '')
          .split(/\s*[|–]\s*/)[0]
          .trim();

        // Remove navigation words from END of business name (handles "Lockwood Wealth Home" case)
        businessName = businessName.replace(/\s*\b(Home|About|Services|Contact|Welcome|Page|Menu|Shop|Store|Blog)\b\s*$/gi, '').trim();

        // Reject if it's ONLY a tagline (no business name)
        const obviousTaglines = /^(financial and investment strategies for|welcome to|search with|find your|discover)/i;
        const commonPageWords = /^(home|about|services|contact|welcome|menu|shop|store|blog)$/i;

        if (obviousTaglines.test(businessName) || commonPageWords.test(businessName)) {
          console.log('[OnboardingPageV5] Rejected tagline or page word:', businessName);
          businessName = 'Your Business';
        } else if (businessName && businessName.length >= 3 && businessName.length < 80) {
          console.log('[OnboardingPageV5] Extracted from title:', businessName);
        } else {
          businessName = 'Your Business';
        }
      }

      // Method 2: Try domain name if title didn't work
      if (businessName === 'Your Business') {
        try {
          const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
          const domainName = domain.replace('www.', '').split('.')[0];

          // Convert camelCase and remove only technical suffixes
          const cleanName = domainName
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/(ws|llc|inc|co)$/i, '')
            .trim();

          if (cleanName && cleanName.length >= 3) {
            businessName = cleanName
              .split(/[\s-_]+/)
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
            console.log('[OnboardingPageV5] Extracted from domain:', businessName);
          }
        } catch (e) {
          console.warn('[OnboardingPageV5] Domain parsing failed:', e);
        }
      }

      // Method 3: Try first H1 that looks like a business name
      if (businessName === 'Your Business' && scrapedData.content?.headings) {
        const taglineWords = /search|find|discover|intention|belong|dream|perfect|where you|helping|your|best|top|leading|welcome/i;
        const potentialName = scrapedData.content.headings.find((h: string) =>
          h &&
          h.length >= 3 &&
          h.length < 60 &&
          !taglineWords.test(h) &&
          !/^(home|about|services|contact|welcome|menu)$/i.test(h.toLowerCase())
        );

        if (potentialName) {
          businessName = potentialName.trim();
          console.log('[OnboardingPageV5] Extracted from H1:', businessName);
        }
      }

      console.log('[OnboardingPageV5] Final business name:', businessName);
      setExtractedBusinessName(businessName);

      // Extract location from website
      console.log('[OnboardingPageV5] Detecting location...');
      let location = '';
      try {
        const locationResult = await locationDetectionService.detectLocation(url, industry.displayName);
        if (locationResult) {
          location = `${locationResult.city}, ${locationResult.state}`;
          console.log('[OnboardingPageV5] Location detected:', location, `(${locationResult.method}, confidence: ${locationResult.confidence})`);
        } else {
          console.log('[OnboardingPageV5] No location detected');
          location = '';
        }
      } catch (err) {
        console.error('[OnboardingPageV5] Location detection failed:', err);
        location = '';
      }
      setExtractedLocation(location);

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

      // Prepare content for extraction (needed for all extraction services)
      const websiteContent = [
        scrapedData.content?.paragraphs?.join('\n') || '',
        scrapedData.content?.headings?.join('\n') || '',
      ].filter(c => c.length > 0);

      const websiteUrls = [url];

      // Save to state for UVP flow pages
      setScrapedWebsiteContent(websiteContent);
      setScrapedWebsiteUrls(websiteUrls);

      // Create REAL brand in database - no temp brand bullshit
      // Every onboarding creates a real brand so intelligence system can run
      if (!currentBrand) {
        console.log('[OnboardingPageV5] Creating REAL brand in database...');
        const { supabase } = await import('@/lib/supabase');

        // Get user if authenticated, null if not (user_id is nullable)
        const { data: { user } } = await supabase.auth.getUser();

        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .insert({
            name: businessName,
            industry: industry.displayName,
            website: url,
            user_id: user?.id || null, // Nullable - allows unauthenticated onboarding
            emotional_quotient: null, // Will be set after EQ calculation
            eq_calculated_at: null,
          })
          .select()
          .single();

        if (brandError) {
          console.error('[OnboardingPageV5] FAILED to create brand in database:', brandError);
          throw new Error(`Brand creation failed: ${brandError.message}. Cannot continue without real brand.`);
        }

        setCurrentBrand(brandData);
        console.log('[OnboardingPageV5] ✅ REAL brand created in database:', brandData.id);
      }

      // =========================================================================
      // EARLY START: Customer extraction runs in parallel with product scan
      // =========================================================================
      console.log('[OnboardingPageV5] Starting customer extraction early (parallel with product scan)...');

      // Start customer extraction immediately - doesn't depend on products
      const customerExtractionPromise = extractTargetCustomer(
        websiteContent,
        [], // testimonials - not available yet
        [], // case studies - not available yet
        businessName
      ).then(result => {
        console.log('[OnboardingPageV5] Early customer extraction complete:', result.profiles.length);
        // Map partial profiles to full CustomerProfile objects
        const suggestions = result.profiles.map(p => ({
          id: p.id || `customer-${Date.now()}`,
          statement: p.statement || '',
          industry: p.industry,
          companySize: p.companySize,
          role: p.role,
          confidence: p.confidence || {
            overall: 0,
            dataQuality: 0,
            sourceCount: 0,
            modelAgreement: 0
          },
          sources: p.sources || [],
          evidenceQuotes: p.evidenceQuotes || [],
          isManualInput: false,
        })) as CustomerProfile[];
        setCustomerSuggestions(suggestions);
        return suggestions;
      }).catch(err => {
        console.error('[OnboardingPageV5] Early customer extraction failed:', err);
        setCustomerSuggestions([]);
        return [];
      });

      // Extract products/services from website content using comprehensive scanner
      console.log('[OnboardingPageV5] Extracting products/services with comprehensive scanner...');
      addProgressStep('Extracting products and services', 'in_progress', 'Analyzing your offerings across multiple pages...');

      let extractedProducts: any = null; // Declare outside try block for access in Promise.all()

      try {
        // Use comprehensive scanner with full WebsiteData for maximum coverage
        extractedProducts = await comprehensiveProductScannerService.scanForProducts(
          scrapedData,
          businessName,
          {
            enableMultiPage: true,
            maxAdditionalPages: 5,
            enableDeepScan: true,
            enableSemanticScan: true,
            deduplicationThreshold: 0.85
          }
        );

        console.log('[OnboardingPageV5] Comprehensive scan complete:', {
          products: extractedProducts.products.length,
          categories: extractedProducts.categories.length,
          confidence: extractedProducts.confidence,
          strategies: extractedProducts.scanStrategies,
          mergeStats: extractedProducts.mergeStats
        });

        // Map extraction results to ProductServiceData format
        setProductServiceData({
          categories: extractedProducts.categories.map(cat => ({
            id: cat,
            name: cat,
            items: extractedProducts.products.filter(p => p.category === cat)
          })),
          extractionComplete: true,
          extractionConfidence: typeof extractedProducts.confidence === 'number' && !isNaN(extractedProducts.confidence)
            ? {
                overall: extractedProducts.confidence,
                dataQuality: extractedProducts.confidence,
                sourceCount: extractedProducts.sources.length,
                modelAgreement: extractedProducts.confidence,
              }
            : (typeof extractedProducts.confidence === 'object' && extractedProducts.confidence !== null)
              ? {
                  overall: isNaN(extractedProducts.confidence.overall) ? 0 : extractedProducts.confidence.overall,
                  dataQuality: isNaN(extractedProducts.confidence.dataQuality) ? 0 : extractedProducts.confidence.dataQuality,
                  sourceCount: isNaN(extractedProducts.confidence.sourceCount) ? 0 : extractedProducts.confidence.sourceCount,
                  modelAgreement: isNaN(extractedProducts.confidence.modelAgreement) ? 0 : extractedProducts.confidence.modelAgreement,
                  reasoning: extractedProducts.confidence.reasoning
                }
              : {
                  overall: 0,
                  dataQuality: 0,
                  sourceCount: 0,
                  modelAgreement: 0,
                  reasoning: 'Confidence data unavailable'
                },
          sources: extractedProducts.sources,
        });

        addProgressStep('Extracting products and services', 'complete', `Found ${extractedProducts.products.length} offerings`);
      } catch (error) {
        console.error('[OnboardingPageV5] Product extraction failed:', error);
        addProgressStep('Extracting products and services', 'error', 'Extraction failed, manual input available');

        // Initialize with empty data as fallback
        setProductServiceData({
          categories: [],
          extractionComplete: false,
          extractionConfidence: {
            overall: 0,
            dataQuality: 0,
            sourceCount: 0,
            modelAgreement: 0,
          },
          sources: [],
        });
      }

      // =========================================================================
      // ✨ EQ CALCULATOR V2.0: Calculate Emotional Quotient
      // =========================================================================
      console.log('[OnboardingPageV5] Calculating Emotional Quotient...');
      addProgressStep('Calculating brand EQ', 'in_progress', 'Analyzing emotional vs rational messaging...');

      try {
        const { eqIntegration } = await import('@/services/eq-v2/eq-integration.service');

        // Detect specialty from collected data or industry
        const specialty =
          collectedOnboardingData.valuePropositions[0]?.specialty ||
          industry.displayName ||
          undefined;

        // Calculate EQ from website content
        const eqResult = await eqIntegration.calculateEQ({
          businessName,
          websiteContent,
          specialty,
        });

        console.log('[OnboardingPageV5] EQ calculated successfully:', {
          overall: eqResult.eq_score.overall,
          emotional: eqResult.eq_score.emotional,
          rational: eqResult.eq_score.rational,
          confidence: eqResult.eq_score.confidence,
          method: eqResult.eq_score.calculation_method,
          specialty: eqResult.specialty_context?.specialty,
        });

        // Store in collected data for database save
        setCollectedData(prev => ({
          ...prev!,
          eqScore: eqResult.eq_score,
          eqRecommendations: eqResult.recommendations,
          eqFullResult: eqResult,
        }));

        // Save EQ to database if brand exists
        if (currentBrand?.id) {
          try {
            const { eqStorage } = await import('@/services/eq-v2/eq-storage.service');
            const { supabase } = await import('@/lib/supabase');

            // Save full EQ result
            await eqStorage.saveEQScore(currentBrand.id, eqResult);

            // Update brand table with EQ
            await supabase
              .from('brands')
              .update({
                emotional_quotient: eqResult.eq_score.overall,
                eq_calculated_at: new Date().toISOString(),
              })
              .eq('id', currentBrand.id);

            console.log('[OnboardingPageV5] EQ saved to database for brand:', currentBrand.id);
          } catch (saveError) {
            console.error('[OnboardingPageV5] Failed to save EQ to database:', saveError);
            // Continue anyway - EQ can be recalculated later
          }
        }

        addProgressStep(
          'Calculating brand EQ',
          'complete',
          `EQ: ${eqResult.eq_score.overall}/100 (${eqResult.eq_score.emotional}% emotional, ${eqResult.eq_score.rational}% rational)`
        );
      } catch (error) {
        console.error('[OnboardingPageV5] EQ calculation failed:', error);
        addProgressStep('Calculating brand EQ', 'error', 'Using default EQ (can recalculate later)');

        // Set default EQ so app continues to function
        setCollectedData(prev => ({
          ...prev!,
          eqScore: {
            emotional: 50,
            rational: 50,
            overall: 50,
            confidence: 50,
            calculation_method: 'content_only' as const,
          },
          eqRecommendations: [],
        }));
      }
      // =========================================================================
      // END EQ CALCULATION
      // =========================================================================

      // Extract transformations, solutions, and benefits in parallel
      // Customer extraction already started earlier (parallel with product scan)
      // This runs in the background and populates AI suggestions for later steps
      console.log('[OnboardingPageV5] Extracting AI suggestions for UVP steps...');
      setAiSuggestionsLoading(true);

      Promise.all([
        // Customer extraction already running - just wait for it
        customerExtractionPromise,

        // Extract transformation goals using smart multi-layer approach
        (async () => {
          try {
            // Import the smart generator
            const { generateSmartTransformations } = await import('@/services/uvp-extractors/smart-transformation-generator.service');

            // Extract testimonials from paragraphs (look for quote patterns, exclude legal text)
            const testimonials = scrapedData.content.paragraphs
              .filter(p => {
                const lower = p.toLowerCase();

                // Exclude legal disclaimers and copyright text
                const isLegalText =
                  lower.includes('copyright') ||
                  lower.includes('disclaimer') ||
                  lower.includes('terms of use') ||
                  lower.includes('privacy policy') ||
                  lower.includes('all rights reserved') ||
                  lower.includes('finra') ||
                  lower.includes('sec.gov') ||
                  lower.includes('securities') ||
                  lower.includes('regulation') ||
                  lower.includes('legal');

                if (isLegalText) return false;

                // Look for testimonial patterns
                return (
                  p.length > 80 &&
                  p.length < 500 && // Testimonials are usually not super long
                  (lower.includes('"') || lower.includes('testimonial') || lower.includes('review') || lower.includes('client said'))
                );
              });

            console.log('[OnboardingPageV5] Smart transformation input:', {
              businessName,
              industry: industry.displayName,
              testimonialsCount: testimonials.length,
              paragraphsCount: scrapedData.content.paragraphs.length,
              servicesCount: extractedProducts?.products?.length || 0
            });

            const result = await generateSmartTransformations({
              businessName,
              industry: industry.displayName,
              services: extractedProducts?.products || [],
              customers: [], // Will be populated after customer extraction completes
              testimonials: testimonials.length > 0 ? testimonials : undefined,
              websiteParagraphs: scrapedData.content.paragraphs.filter(p => p.length > 50)
            });

            console.log('[OnboardingPageV5] Smart transformation generation complete:', {
              goalsCount: result.goals.length,
              source: result.source,
              confidence: result.confidence,
              method: result.method
            });

            // For bakeries, ensure we have ALL customer segments covered
            const isBakery = industry.displayName?.toLowerCase().includes('bakery') ||
                             industry.displayName?.toLowerCase().includes('food') ||
                             industry.displayName?.toLowerCase().includes('cafe') ||
                             industry.displayName?.toLowerCase().includes('restaurant');

            if (isBakery) {
              console.log('[OnboardingPageV5] Bakery detected, ensuring all customer segments covered');

              // Check which segments are already covered
              const hasCorpCatering = result.goals.some(g =>
                g.statement.toLowerCase().includes('office') ||
                g.statement.toLowerCase().includes('corporate') ||
                g.statement.toLowerCase().includes('catering') ||
                g.statement.toLowerCase().includes('colleagues')
              );

              const hasEvents = result.goals.some(g =>
                g.statement.toLowerCase().includes('wedding') ||
                g.statement.toLowerCase().includes('celebration') ||
                g.statement.toLowerCase().includes('party') ||
                g.statement.toLowerCase().includes('event')
              );

              const hasDietary = result.goals.some(g =>
                g.statement.toLowerCase().includes('dietary') ||
                g.statement.toLowerCase().includes('gluten') ||
                g.statement.toLowerCase().includes('vegan') ||
                g.statement.toLowerCase().includes('restriction')
              );

              const additionalGoals: TransformationGoal[] = [];

              // Add missing corporate catering segment
              if (!hasCorpCatering) {
                additionalGoals.push({
                  id: `bakery-corp-${Date.now()}`,
                  statement: `From "struggling to coordinate lunch for the office" → To "being the hero who brings in fresh, delicious options" through our Delivery Service`,
                  functionalDrivers: ['convenient ordering', 'reliable delivery timing'],
                  emotionalDrivers: ['desire to impress colleagues', 'relief from coordination stress'],
                  eqScore: { emotional: 60, rational: 40, overall: 70 },
                  customerQuotes: [],
                  sources: [],
                  confidence: { overall: 80, dataQuality: 75, modelAgreement: 85, sourceCount: 1 },
                  isManualInput: false
                });
              }

              // Add missing events segment
              if (!hasEvents) {
                additionalGoals.push({
                  id: `bakery-event-${Date.now()}`,
                  statement: `From "worried about finding the perfect centerpiece for the celebration" → To "wowing guests with an artisan custom cake"`,
                  functionalDrivers: ['custom design', 'reliable quality'],
                  emotionalDrivers: ['desire to impress', 'pride in hosting'],
                  eqScore: { emotional: 70, rational: 30, overall: 75 },
                  customerQuotes: [],
                  sources: [],
                  confidence: { overall: 80, dataQuality: 75, modelAgreement: 85, sourceCount: 1 },
                  isManualInput: false
                });
              }

              // Add missing dietary segment
              if (!hasDietary) {
                additionalGoals.push({
                  id: `bakery-dietary-${Date.now()}`,
                  statement: `From "frustrated by lack of quality options for dietary restrictions" → To "enjoying delicious treats that meet dietary needs without compromise"`,
                  functionalDrivers: ['dietary accommodations', 'ingredient transparency'],
                  emotionalDrivers: ['inclusion', 'relief from restrictions'],
                  eqScore: { emotional: 65, rational: 35, overall: 72 },
                  customerQuotes: [],
                  sources: [],
                  confidence: { overall: 80, dataQuality: 75, modelAgreement: 85, sourceCount: 1 },
                  isManualInput: false
                });
              }

              if (additionalGoals.length > 0) {
                console.log(`[OnboardingPageV5] Adding ${additionalGoals.length} missing bakery segments`);
                result.goals = [...result.goals, ...additionalGoals];
              }
            }

            setTransformationSuggestions(result.goals);
            return result;
          } catch (err) {
            console.error('[OnboardingPageV5] Smart transformation generation failed:', err);
            console.error('[OnboardingPageV5] Error details:', err instanceof Error ? err.message : String(err));
            console.error('[OnboardingPageV5] Error stack:', err instanceof Error ? err.stack : 'No stack trace');
            setTransformationSuggestions([]);
            return { goals: [], source: 'generated' as const, confidence: 0, method: 'Failed' };
          }
        })(),

        // Extract differentiators/unique solutions
        extractDifferentiators(
          websiteContent,
          websiteUrls,
          [], // competitor info - not available yet
          businessName,
          industry.displayName // Pass industry for context-aware extraction
        ).then(result => {
          console.log('[OnboardingPageV5] Differentiator extraction complete:', result.differentiators.length);

          // Create UniqueSolution suggestions from actual differentiators (not hardcoded)
          const suggestions: UniqueSolution[] = result.differentiators
            .filter(diff => diff.strengthScore >= 60) // Only include quality differentiators
            .map((diff, index) => ({
              id: `solution-${Date.now()}-${index}`,
              statement: diff.statement, // Use ACTUAL differentiator statement
              differentiators: [diff],
              methodology: index === 0 ? result.methodology : undefined, // First one gets methodology
              proprietaryApproach: index === 0 ? result.proprietaryApproach : undefined,
              confidence: {
                overall: diff.strengthScore,
                dataQuality: diff.strengthScore,
                sourceCount: 1,
                modelAgreement: diff.strengthScore,
              },
              sources: [diff.source],
              isManualInput: false,
            }));

          // If no quality differentiators found, create a simple fallback
          if (suggestions.length === 0) {
            console.warn('[OnboardingPageV5] No quality differentiators found, creating minimal fallback');
            suggestions.push({
              id: `solution-fallback-${Date.now()}`,
              statement: `${businessName} provides quality ${industry.displayName.toLowerCase()} services`,
              differentiators: [],
              confidence: {
                overall: 30,
                dataQuality: 30,
                sourceCount: 0,
                modelAgreement: 30,
              },
              sources: [],
              isManualInput: false,
            });
          }

          setSolutionSuggestions(suggestions);
        }).catch(err => {
          console.error('[OnboardingPageV5] Differentiator extraction failed:', err);
          setSolutionSuggestions([]);
        }),

        // Extract benefits
        extractBenefits(
          [], // case studies - not available yet
          [], // testimonials - not available yet
          websiteContent, // results content - use general website content
          businessName,
          industry.displayName || 'General'
        ).then(result => {
          console.log('[OnboardingPageV5] Benefit extraction complete:', result.benefits.length);
          // Map partial benefits to full KeyBenefit objects
          const suggestions = result.benefits.map(b => ({
            id: b.id || `benefit-${Date.now()}`,
            statement: b.statement || '',
            outcomeType: b.outcomeType || 'mixed',
            metrics: b.metrics || [],
            industryComparison: b.industryComparison,
            eqFraming: b.eqFraming || 'balanced',
            confidence: b.confidence || 0,
            sources: b.sources || [],
            isManualInput: false,
          })) as KeyBenefit[];
          setBenefitSuggestions(suggestions);
        }).catch(err => {
          console.error('[OnboardingPageV5] Benefit extraction failed:', err);
          setBenefitSuggestions([]);
        }),
      ]).then(() => {
        console.log('[OnboardingPageV5] All AI extractions complete');
        setAiSuggestionsLoading(false);
      }).catch(err => {
        console.error('[OnboardingPageV5] AI extraction error:', err);
        setAiSuggestionsLoading(false);
      });

      setIsExtracting(false);

      // Create or find session for this URL
      if (currentBrand?.id && !currentSessionId) {
        const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
        console.log('[OnboardingPageV5] Creating/finding session for URL:', normalizedUrl);
        try {
          const sessionResult = await sessionManager.findOrCreateSession(
            currentBrand.id,
            normalizedUrl,
            extractedBusinessName || 'Business'
          );

          if (sessionResult.success && sessionResult.session) {
            setCurrentSessionId(sessionResult.session.id);
            console.log('[OnboardingPageV5] Session created/found:', sessionResult.session.id, 'IsNew:', sessionResult.isNew);

            // Save initial scraped content
            if (sessionResult.isNew) {
              await sessionManager.updateSession({
                session_id: sessionResult.session.id,
                scraped_content: {
                  content: websiteContent,
                  urls: websiteUrls,
                },
                business_info: {
                  name: extractedBusinessName || 'Business',
                  location: extractedLocation || '',
                },
                industry_info: {
                  industry: industry.displayName,
                  specialization: '',
                  naics_code: industry.naicsCode,
                },
              });
            }
          }
        } catch (error) {
          console.error('[OnboardingPageV5] Failed to create/find session:', error);
        }
      }

      // Transition to UVP Flow (6 steps)
      console.log('[OnboardingPageV5] Transitioning to uvp_products step', {
        hasProductData: !!productServiceData,
        productCategories: productServiceData?.categories?.length || 0
      });
      setCurrentStep('uvp_products');

      // Initialize UVP flow data
      setUVPFlowData({
        currentStep: 'products',
        productsServices: undefined,  // Will be populated by extraction service
        isComplete: false,
      });

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
          services: refinedData.selectedServices || [],
        },
        locationData: refinedData.location ? {
          address: refinedData.location || '',
          city: refinedData.location.split(',')[0]?.trim() || '',
          state: refinedData.location.split(',')[1]?.trim() || '',
          country: 'USA',
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
          archetype: 'expert',
          writingStyle: 'professional',
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
    if (!collectedData) return;

    // Update the validated property on the proposition object
    setCollectedData({
      ...collectedData,
      valuePropositions: collectedData.valuePropositions.map(vp =>
        vp.id === id ? { ...vp, validated: true } : vp
      ),
    });

    // Also track in the Set for convenience
    setValidatedValueProps(prev => new Set(prev).add(id));
  };

  const handleRejectValueProp = (id: string) => {
    console.log('[OnboardingPageV5] Rejecting value prop:', id);
    if (!collectedData) return;

    // Check if this proposition is currently validated (unvalidate it)
    const prop = collectedData.valuePropositions.find(vp => vp.id === id);
    if (prop?.validated) {
      // Unvalidate it
      setCollectedData({
        ...collectedData,
        valuePropositions: collectedData.valuePropositions.map(vp =>
          vp.id === id ? { ...vp, validated: false } : vp
        ),
      });
      setValidatedValueProps(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } else {
      // Remove it entirely
      setCollectedData({
        ...collectedData,
        valuePropositions: collectedData.valuePropositions.filter(vp => vp.id !== id),
      });
    }
  };

  const handleEditValueProp = (id: string, newStatement: string) => {
    console.log('[OnboardingPageV5] Editing value prop:', id, newStatement);
    if (!collectedData) return;

    setCollectedData({
      ...collectedData,
      valuePropositions: collectedData.valuePropositions.map(vp =>
        vp.id === id ? { ...vp, statement: newStatement, userEdited: true } : vp
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
      await onboardingV5DataService.saveCoreTruthInsight(brandId, collectedData.coreTruth as any);
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

  // ==================== UVP FLOW HANDLERS ====================

  // UVP Step 1: Products/Services
  const handleProductsConfirm = (confirmedItems: ProductService[]) => {
    console.log('[UVP Flow] Products confirmed:', confirmedItems.length);

    // Update product confirmation state
    setProductServiceData(prev => ({
      ...prev!,
      categories: prev!.categories.map(cat => ({
        ...cat,
        items: cat.items.map(item => ({
          ...item,
          confirmed: confirmedItems.some(ci => ci.id === item.id),
        })),
      })),
    }));

    // Filter customer suggestions based on removed products
    // If user removed products, filter out customer profiles that mention those products
    if (productServiceData) {
      const allProducts = productServiceData.categories.flatMap(cat => cat.items);
      const removedProducts = allProducts.filter(p => !confirmedItems.some(ci => ci.id === p.id));

      if (removedProducts.length > 0) {
        console.log('[UVP Flow] Filtering customer profiles - removed products:', removedProducts.map(p => p.name));

        // Filter customer suggestions to remove profiles mentioning removed products
        setCustomerSuggestions(prev => {
          const filtered = prev.filter(profile => {
            // Check if profile mentions any removed product names
            const profileText = `${profile.statement} ${profile.evidenceQuotes.join(' ')}`.toLowerCase();
            const mentionsRemovedProduct = removedProducts.some(product =>
              profileText.includes(product.name.toLowerCase())
            );

            if (mentionsRemovedProduct) {
              console.log('[UVP Flow] Removing customer profile (mentions removed product):', profile.id);
              return false;
            }
            return true;
          });

          console.log('[UVP Flow] Customer profiles after filtering:', filtered.length, 'kept,', prev.length - filtered.length, 'removed');
          return filtered;
        });
      }
    }
  };

  const handleProductsAddManual = (item: Partial<ProductService>) => {
    console.log('[UVP Flow] Manual product added:', item);
    // Add to existing categories or create "Manual Additions" category
    setProductServiceData(prev => {
      if (!prev) return prev;

      const manualCat = prev.categories.find(c => c.name === 'Manual Additions');
      const newItem: ProductService = {
        id: `manual-${Date.now()}`,
        name: item.name || '',
        description: item.description || '',
        category: item.category || 'Other',
        confidence: 100,
        source: 'manual',
        confirmed: true,
      };

      if (manualCat) {
        return {
          ...prev,
          categories: prev.categories.map(cat =>
            cat.name === 'Manual Additions'
              ? { ...cat, items: [...cat.items, newItem] }
              : cat
          ),
        };
      } else {
        return {
          ...prev,
          categories: [
            ...prev.categories,
            {
              id: 'manual',
              name: 'Manual Additions',
              items: [newItem],
            },
          ],
        };
      }
    });
  };

  const handleProductsNext = () => {
    console.log('[UVP Flow] Moving to customer step');

    // Mark products step as completed
    const newCompletedSteps = [...completedUVPSteps, 'products'] as UVPStepKey[];
    setCompletedUVPSteps(newCompletedSteps);

    // Auto-save session
    if (currentSessionId) {
      saveSession({
        session_id: currentSessionId,
        current_step: 'customer',
        products_data: productServiceData ? {
          categories: productServiceData.categories,
          selectedProducts: productServiceData.categories.flatMap(cat =>
            cat.items.filter(item => item.confirmed)
          ),
        } : undefined,
        completed_steps: newCompletedSteps,
        progress_percentage: sessionManager.calculateProgress(newCompletedSteps),
      });
    }

    setCurrentStep('uvp_customer');
  };

  // Handle business info editing
  const handleBusinessInfoUpdate = (businessName: string, location: string) => {
    console.log('[UVP Flow] Business info updated:', { businessName, location });
    setExtractedBusinessName(businessName);
    setExtractedLocation(location);
  };

  // UVP Step 2: Target Customer
  const handleCustomerAccept = (profile: CustomerProfile) => {
    console.log('[UVP Flow] Customer profile accepted:', profile.id);
    setSelectedCustomerProfile(profile);
  };

  const handleCustomerManualSubmit = (profile: Partial<CustomerProfile>) => {
    console.log('[UVP Flow] Manual customer profile submitted');
    const newProfile: CustomerProfile = {
      id: `manual-${Date.now()}`,
      statement: profile.statement || '',
      industry: profile.industry,
      companySize: profile.companySize,
      role: profile.role,
      confidence: {
        overall: 100,
        dataQuality: 100,
        sourceCount: 1,
        modelAgreement: 100
      },
      sources: [],
      evidenceQuotes: [],
      isManualInput: true,
    };
    setSelectedCustomerProfile(newProfile);
  };

  const handleCustomerNext = () => {
    console.log('[UVP Flow] Moving to transformation step');

    // Mark customer step as completed
    const newCompletedSteps = [...completedUVPSteps, 'customer'] as UVPStepKey[];
    setCompletedUVPSteps(newCompletedSteps);

    // Auto-save session
    if (currentSessionId && selectedCustomerProfile) {
      saveSession({
        session_id: currentSessionId,
        current_step: 'transformation',
        customer_data: {
          selected: selectedCustomerProfile,
          suggestions: customerSuggestions,
        },
        completed_steps: newCompletedSteps,
        progress_percentage: sessionManager.calculateProgress(newCompletedSteps),
      });
    }

    setCurrentStep('uvp_transformation');
  };

  // UVP Step 3: Transformation Goal
  const handleTransformationAccept = (goal: TransformationGoal) => {
    console.log('[UVP Flow] Transformation goal accepted:', goal.id);
    setSelectedTransformation(goal);
  };

  const handleTransformationManualSubmit = (goal: Partial<TransformationGoal>) => {
    console.log('[UVP Flow] Manual transformation goal submitted');
    const newGoal: TransformationGoal = {
      id: `manual-${Date.now()}`,
      statement: goal.statement || '',
      emotionalDrivers: goal.emotionalDrivers || [],
      functionalDrivers: goal.functionalDrivers || [],
      eqScore: {
        emotional: 50,
        rational: 50,
        overall: 50,
      },
      confidence: {
        overall: 100,
        dataQuality: 100,
        sourceCount: 1,
        modelAgreement: 100
      },
      sources: [],
      customerQuotes: [],
      isManualInput: true,
    };
    setSelectedTransformation(newGoal);
  };

  const handleTransformationNext = () => {
    console.log('[UVP Flow] Moving to solution step');

    // Mark transformation step as completed
    const newCompletedSteps = [...completedUVPSteps, 'transformation'] as UVPStepKey[];
    setCompletedUVPSteps(newCompletedSteps);

    // Auto-save session
    if (currentSessionId && selectedTransformation) {
      saveSession({
        session_id: currentSessionId,
        current_step: 'solution',
        transformation_data: {
          selected: selectedTransformation,
          suggestions: transformationSuggestions,
        },
        completed_steps: newCompletedSteps,
        progress_percentage: sessionManager.calculateProgress(newCompletedSteps),
      });
    }

    setCurrentStep('uvp_solution');
  };

  // UVP Step 4: Unique Solution
  const handleSolutionAccept = (solution: UniqueSolution) => {
    console.log('[UVP Flow] Solution accepted:', solution.id);
    setSelectedSolution(solution);
  };

  const handleSolutionManualSubmit = (solution: Partial<UniqueSolution>) => {
    console.log('[UVP Flow] Manual solution submitted');
    const newSolution: UniqueSolution = {
      id: `manual-${Date.now()}`,
      statement: solution.statement || '',
      differentiators: solution.differentiators || [],
      methodology: solution.methodology,
      proprietaryApproach: solution.proprietaryApproach,
      confidence: {
        overall: 100,
        dataQuality: 100,
        sourceCount: 1,
        modelAgreement: 100
      },
      sources: [],
      isManualInput: true,
    };
    setSelectedSolution(newSolution);
  };

  const handleSolutionNext = () => {
    console.log('[UVP Flow] Moving to benefit step');

    // Mark solution step as completed
    const newCompletedSteps = [...completedUVPSteps, 'solution'] as UVPStepKey[];
    setCompletedUVPSteps(newCompletedSteps);

    // Auto-save session
    if (currentSessionId && selectedSolution) {
      saveSession({
        session_id: currentSessionId,
        current_step: 'benefit',
        solution_data: {
          selected: selectedSolution,
          suggestions: solutionSuggestions,
        },
        completed_steps: newCompletedSteps,
        progress_percentage: sessionManager.calculateProgress(newCompletedSteps),
      });
    }

    setCurrentStep('uvp_benefit');
  };

  // UVP Step 5: Key Benefit
  const handleBenefitAccept = (benefit: KeyBenefit) => {
    console.log('[UVP Flow] Benefit accepted:', benefit.id);
    setSelectedBenefit(benefit);
  };

  const handleBenefitManualSubmit = (benefit: Partial<KeyBenefit>) => {
    console.log('[UVP Flow] Manual benefit submitted');
    const newBenefit: KeyBenefit = {
      id: `manual-${Date.now()}`,
      statement: benefit.statement || '',
      outcomeType: benefit.outcomeType || 'qualitative',
      metrics: benefit.metrics,
      industryComparison: benefit.industryComparison,
      eqFraming: benefit.eqFraming || 'balanced',
      confidence: {
        overall: 100,
        dataQuality: 100,
        sourceCount: 1,
        modelAgreement: 100
      },
      sources: [],
      isManualInput: true,
    };
    setSelectedBenefit(newBenefit);
  };

  const handleBenefitNext = async () => {
    console.log('[UVP Flow] Moving to synthesis step, generating UVP statements...');

    // Mark benefit step as completed
    const newCompletedSteps = [...completedUVPSteps, 'benefit'] as UVPStepKey[];
    setCompletedUVPSteps(newCompletedSteps);

    // Auto-save session
    if (currentSessionId && selectedBenefit) {
      saveSession({
        session_id: currentSessionId,
        current_step: 'synthesis',
        benefit_data: {
          selected: selectedBenefit,
          suggestions: benefitSuggestions,
        },
        completed_steps: newCompletedSteps,
        progress_percentage: sessionManager.calculateProgress(newCompletedSteps),
      });
    }

    // Show loading screen immediately
    setIsSynthesizingUVP(true);

    // Synthesize complete UVP with AI before showing synthesis page
    if (selectedCustomerProfile && selectedTransformation && selectedSolution && selectedBenefit) {
      try {
        // Pass ALL selected transformations for inclusive synthesis
        const transformationsToUse = selectedTransformations.length > 0
          ? selectedTransformations
          : [selectedTransformation];

        // For synthesis, we still need a primary transformation for backward compatibility
        // but we'll include context from all selected transformations
        const primaryTransformation = selectedTransformation || selectedTransformations[0];

        // Create a combined transformation that represents all segments
        const combinedTransformation: TransformationGoal = {
          ...primaryTransformation,
          statement: transformationsToUse.length > 1
            ? `Multiple transformations: ${transformationsToUse.map(t => t.statement).join(' AND ')}`
            : primaryTransformation.statement,
          emotionalDrivers: [...new Set(transformationsToUse.flatMap(t => t.emotionalDrivers || []))],
          functionalDrivers: [...new Set(transformationsToUse.flatMap(t => t.functionalDrivers || []))]
        };

        const synthesizedUVP = await synthesizeCompleteUVP({
          customer: selectedCustomerProfile,
          transformation: combinedTransformation,
          solution: selectedSolution,
          benefit: selectedBenefit,
          businessName: refinedData?.businessName || extractedBusinessName || 'Your Business',
          industry: refinedData?.specialization || 'General'
        });

        console.log('[UVP Flow] Synthesis complete, UVP:', synthesizedUVP.valuePropositionStatement);
        setCompleteUVP(synthesizedUVP);

        // Save complete UVP to session
        if (currentSessionId) {
          await saveImmediately({
            session_id: currentSessionId,
            complete_uvp: synthesizedUVP,
          });
        }

        setIsSynthesizingUVP(false);
        setCurrentStep('uvp_synthesis');
      } catch (error) {
        console.error('[UVP Flow] Synthesis failed:', error);
        // Still proceed to synthesis page, will show fallback
        setIsSynthesizingUVP(false);
        setCurrentStep('uvp_synthesis');
      }
    } else {
      console.warn('[UVP Flow] Missing required data for synthesis');
      setIsSynthesizingUVP(false);
      setCurrentStep('uvp_synthesis');
    }
  };

  // UVP Step 6: Synthesis
  const handleUVPComplete = async (uvp: CompleteUVP) => {
    console.log('[UVP Flow] UVP complete, saving to database');
    setCompleteUVP(uvp);

    try {
      // Get brand ID from current brand context
      const brandId = currentBrand?.id;
      if (!brandId) {
        console.error('[UVP Flow] No brand ID found in context');
        alert('Unable to save UVP: No brand selected. Please try again or contact support.');
        return;
      }

      console.log('[UVP Flow] Saving UVP for brand:', brandId);

      // Save to database
      const result = await saveCompleteUVP(uvp, brandId);

      if (result.success) {
        console.log('[UVP Flow] UVP saved successfully:', result.uvpId);

        // Mark synthesis as completed and update session to 100%
        const finalSteps = [...completedUVPSteps, 'synthesis'] as UVPStepKey[];
        setCompletedUVPSteps(finalSteps);

        if (currentSessionId) {
          await saveImmediately({
            session_id: currentSessionId,
            completed_steps: finalSteps,
            progress_percentage: 100,
          });
        }

        navigate('/dashboard');
      } else {
        throw new Error(result.error || 'Failed to save UVP');
      }
    } catch (error) {
      console.error('[UVP Flow] Failed to save UVP:', error);
      alert('Failed to save UVP. Please try again.');
    }
  };

  const handleUVPExport = () => {
    console.log('[UVP Flow] Exporting UVP');
    // TODO: Implement export functionality
  };

  const handleUVPBack = () => {
    console.log('[UVP Flow] Going back from synthesis');
    setCurrentStep('uvp_benefit');
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

      {(currentStep === 'data_collection' || currentStep === 'uvp_extraction') && (
        <InitialLoadingScreen
          websiteUrl={websiteUrl}
          businessName={extractedBusinessName || businessData?.businessName}
        />
      )}

      {currentStep === 'value_propositions' && collectedData && (
        <ValuePropositionPage
          {...{
            propositions: collectedData.valuePropositions,
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

      {/* ==================== UVP FLOW PAGES ==================== */}

      {currentStep === 'uvp_products' && (
        <>
          {!productServiceData && (
            <div className="flex flex-col items-center justify-center min-h-screen p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading product data...</p>
            </div>
          )}
          {productServiceData && (
            <ProductServiceDiscoveryPage
              businessName={extractedBusinessName || 'Your Business'}
              location={extractedLocation}
              isLoading={false}
              data={productServiceData}
              onConfirm={handleProductsConfirm}
              onAddManual={handleProductsAddManual}
              onNext={handleProductsNext}
              onBusinessInfoUpdate={handleBusinessInfoUpdate}
              completedSteps={completedUVPSteps as any}
              onStepClick={handleMilestoneClick}
            />
          )}
        </>
      )}

      {currentStep === 'uvp_customer' && (
        <TargetCustomerPage
          businessName={businessData?.businessName || 'Your Business'}
          industry={businessData?.industry || ''}
          websiteUrl={websiteUrl}
          websiteContent={scrapedWebsiteContent}
          websiteUrls={scrapedWebsiteUrls}
          preloadedData={{ profiles: customerSuggestions, loading: aiSuggestionsLoading }}
          value={selectedCustomerProfile?.statement || ''}
          onChange={(value) => {
            if (selectedCustomerProfile) {
              setSelectedCustomerProfile({ ...selectedCustomerProfile, statement: value });
            } else {
              setSelectedCustomerProfile({
                id: `manual-${Date.now()}`,
                statement: value,
                industry: businessData?.industry,
                companySize: undefined,
                role: undefined,
                confidence: {
                  overall: 100,
                  dataQuality: 100,
                  sourceCount: 1,
                  modelAgreement: 100,
                  reasoning: 'Manual input'
                },
                sources: [],
                evidenceQuotes: [],
                isManualInput: true
              });
            }
          }}
          onNext={handleCustomerNext}
          onBack={() => setCurrentStep('uvp_products')}
          showProgress={true}
          progressPercentage={20}
          completedSteps={completedUVPSteps as any}
          onStepClick={handleMilestoneClick}
        />
      )}

      {currentStep === 'uvp_transformation' && (
        <TransformationGoalPage
          businessName={businessData?.businessName || 'Your Business'}
          industry={businessData?.industry || ''}
          websiteUrl={websiteUrl}
          websiteContent={scrapedWebsiteContent}
          websiteUrls={scrapedWebsiteUrls}
          preloadedData={{ goals: transformationSuggestions, loading: false }}
          value={selectedTransformation?.statement || ''}
          onChange={(value) => {
            if (selectedTransformation) {
              setSelectedTransformation({ ...selectedTransformation, statement: value });
            } else {
              setSelectedTransformation({
                id: `manual-${Date.now()}`,
                statement: value,
                emotionalDrivers: [],
                functionalDrivers: [],
                eqScore: { emotional: 50, rational: 50, overall: 50 },
                confidence: {
                  overall: 100,
                  dataQuality: 100,
                  sourceCount: 1,
                  modelAgreement: 100,
                  reasoning: 'Manual input'
                },
                sources: [],
                customerQuotes: [],
                isManualInput: true
              });
            }
          }}
          onGoalsSelected={(goals) => {
            console.log('[OnboardingPageV5] Transformation goals selected:', goals.length);
            setSelectedTransformations(goals);
            // Also set the first one as primary for backward compatibility
            if (goals.length > 0) {
              setSelectedTransformation(goals[0]);
            }
          }}
          onNext={handleTransformationNext}
          onBack={() => setCurrentStep('uvp_customer')}
          showProgress={true}
          progressPercentage={40}
          completedSteps={completedUVPSteps as any}
          onStepClick={handleMilestoneClick}
        />
      )}

      {currentStep === 'uvp_solution' && (
        <UniqueSolutionPage
          businessName={businessData?.businessName || 'Your Business'}
          industry={businessData?.industry || ''}
          websiteUrl={websiteUrl}
          websiteContent={scrapedWebsiteContent}
          websiteUrls={scrapedWebsiteUrls}
          competitorInfo={[]}
          preloadedData={{ solutions: solutionSuggestions, loading: false }}
          value={selectedSolution?.statement || ''}
          onChange={(value) => {
            // Update selected solution with new value
            if (selectedSolution) {
              setSelectedSolution({ ...selectedSolution, statement: value });
            } else {
              // Create new solution if none exists
              setSelectedSolution({
                id: `manual-${Date.now()}`,
                statement: value,
                differentiators: [],
                confidence: {
                  overall: 100,
                  dataQuality: 100,
                  sourceCount: 1,
                  modelAgreement: 100,
                  reasoning: 'Manual input'
                },
                sources: [],
                isManualInput: true
              });
            }
          }}
          onSolutionsSelected={(solutions) => {
            console.log('[OnboardingPageV5] Unique solutions selected:', solutions.length);
            setSelectedSolutions(solutions);
            // Also set the first one as primary for backward compatibility
            if (solutions.length > 0) {
              setSelectedSolution(solutions[0]);
            }
          }}
          onNext={handleSolutionNext}
          onBack={() => setCurrentStep('uvp_transformation')}
          showProgress={true}
          progressPercentage={60}
          completedSteps={completedUVPSteps as any}
          onStepClick={handleMilestoneClick}
        />
      )}

      {currentStep === 'uvp_benefit' && (
        <KeyBenefitPage
          businessName={businessData?.businessName || 'Your Business'}
          industry={businessData?.industry || ''}
          websiteUrl={websiteUrl}
          websiteContent={scrapedWebsiteContent}
          websiteUrls={scrapedWebsiteUrls}
          preloadedData={{ benefits: benefitSuggestions, loading: false }}
          value={selectedBenefit?.statement || ''}
          onChange={(value) => {
            if (selectedBenefit) {
              setSelectedBenefit({ ...selectedBenefit, statement: value });
            } else {
              setSelectedBenefit({
                id: `manual-${Date.now()}`,
                statement: value,
                outcomeType: 'mixed',
                metrics: [],
                industryComparison: undefined,
                eqFraming: 'balanced',
                confidence: {
                  overall: 100,
                  dataQuality: 100,
                  sourceCount: 1,
                  modelAgreement: 100,
                  reasoning: 'Manual input'
                },
                sources: [],
                isManualInput: true
              });
            }
          }}
          onNext={handleBenefitNext}
          onBack={() => setCurrentStep('uvp_solution')}
          showProgress={true}
          progressPercentage={80}
          completedSteps={completedUVPSteps as any}
          onStepClick={handleMilestoneClick}
        />
      )}

      {/* UVP Synthesis Loading Screen - Show regardless of step when synthesizing */}
      {isSynthesizingUVP && (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 flex flex-col items-center justify-center p-6 fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            {/* Simple single spinner */}
            <div className="relative w-16 h-16 mx-auto">
              <Loader2 className="w-16 h-16 text-slate-400 dark:text-slate-500 animate-spin" />
            </div>

            {/* Clean simple text */}
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300">
                Crafting Your Value Proposition
              </h2>
              <p className="text-base text-slate-500 dark:text-slate-400">
                This will take just a moment...
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {currentStep === 'uvp_synthesis' && !isSynthesizingUVP && selectedCustomerProfile && selectedTransformation && selectedSolution && selectedBenefit && (() => {
        // Use synthesized UVP from state, or create fallback if synthesis failed
        const uvpToDisplay: CompleteUVP = completeUVP || {
          id: `uvp-${Date.now()}`,
          targetCustomer: selectedCustomerProfile,
          transformationGoal: selectedTransformation,
          uniqueSolution: selectedSolution,
          keyBenefit: selectedBenefit,
          valuePropositionStatement: '', // Fallback if synthesis failed
          whyStatement: '',
          whatStatement: '',
          howStatement: '',
          overallConfidence: {
            overall: 80,
            dataQuality: 80,
            sourceCount: 0,
            modelAgreement: 80,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        return (
          <UVPSynthesisPage
            completeUVP={uvpToDisplay}
            onEdit={(step) => {
              // Map step to appropriate handler
              if (step === 'customer') setCurrentStep('uvp_customer');
              else if (step === 'transformation') setCurrentStep('uvp_transformation');
              else if (step === 'solution') setCurrentStep('uvp_solution');
              else if (step === 'benefit') setCurrentStep('uvp_benefit');
            }}
            onSave={async () => {
              console.log('[UVP Flow] Saving complete UVP...');
              console.log('[UVP Flow] UVP data:', JSON.stringify(uvpToDisplay, null, 2));

              // Validate UVP data first
              if (!uvpToDisplay.targetCustomer || !uvpToDisplay.transformationGoal || !uvpToDisplay.uniqueSolution || !uvpToDisplay.keyBenefit) {
                console.error('[UVP Flow] Incomplete UVP data:', {
                  hasCustomer: !!uvpToDisplay.targetCustomer,
                  hasTransformation: !!uvpToDisplay.transformationGoal,
                  hasSolution: !!uvpToDisplay.uniqueSolution,
                  hasBenefit: !!uvpToDisplay.keyBenefit,
                });
                alert('Unable to save: Some UVP components are missing. Please complete all steps.');
                return;
              }

              // Check if user is authenticated first
              const { data: { user } } = await supabase.auth.getUser();

              // If no authenticated user, save to localStorage for onboarding
              if (!user) {
                console.log('[UVP Flow] No authenticated user, saving to localStorage');

                // Save business metadata to localStorage for session display
                if (extractedBusinessName) {
                  localStorage.setItem('business_name', extractedBusinessName);
                }
                if (websiteUrl) {
                  localStorage.setItem('website_url', websiteUrl);
                }

                const result = await saveCompleteUVP(uvpToDisplay, undefined);

                if (result.success) {
                  console.log('[UVP Flow] Successfully saved to localStorage, session:', result.sessionId);
                  console.log('[UVP Flow] UVP saved successfully - navigating to dashboard');

                  // Navigate immediately to dashboard - no blocking alert
                  navigate('/dashboard');
                } else {
                  console.error('[UVP Flow] Failed to save:', result.error);
                  alert(`Failed to save UVP: ${result.error}`);
                }
                return;
              }

              // Check if brand exists, create if needed
              let brandId = currentBrand?.id;

              if (!brandId) {
                console.warn('[UVP Flow] No brand found, creating in database...');
                try {
                  const { data: brandData, error: brandError } = await supabase
                    .from('brands')
                    .insert({
                      name: extractedBusinessName || 'My Business',
                      industry: currentBrand?.industry || 'General',
                      website: websiteUrl || '',
                      user_id: user.id
                    })
                    .select()
                    .single();

                  if (brandError) {
                    console.error('[UVP Flow] Failed to create brand:', brandError);
                    alert('Unable to save: Could not create business profile. Please contact support.');
                    return;
                  }

                  brandId = brandData.id;
                  setCurrentBrand(brandData);
                  console.log('[UVP Flow] Brand created successfully:', brandId);
                } catch (err) {
                  console.error('[UVP Flow] Error creating brand:', err);
                  alert('An error occurred while creating your business profile. Please try again.');
                  return;
                }
              }

              // Now save UVP with valid brand ID
              try {
                console.log('[UVP Flow] Calling saveCompleteUVP with brand ID:', brandId);
                const result = await saveCompleteUVP(uvpToDisplay, brandId);

                if (result.success) {
                  console.log('[UVP Flow] UVP saved successfully:', result.uvpId);
                  alert('Your Value Proposition has been saved successfully!');
                  // Navigate to dashboard after successful save
                  navigate('/dashboard');
                } else {
                  console.error('[UVP Flow] Failed to save UVP:', result.error);
                  alert(`Failed to save UVP: ${result.error}\n\nPlease check the console for more details.`);
                }
              } catch (error) {
                console.error('[UVP Flow] Error saving UVP:', error);
                console.error('[UVP Flow] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
                alert(`An error occurred while saving: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check the console for more details.`);
              }
            }}
            onDownload={handleUVPExport}
            onShare={() => {
              console.log('[UVP Flow] Share clicked');
            }}
            completedSteps={completedUVPSteps as any}
            onStepClick={handleMilestoneClick}
          />
        );
      })()}

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
