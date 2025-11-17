/**
 * Onboarding Page V5 - Discovery-First Smart Onboarding
 *
 * Week 7: Orchestrates the complete onboarding flow with source verification
 *
 * Flow: URL Input → UVP Extraction → Smart Confirmation → Quick Refinement →
 *       Path Selection → Content Generation → Preview → Email Capture
 */

import React, { useState } from 'react';
import { OnboardingFlow } from '@/components/onboarding-v5/OnboardingFlow';
import { PathSelector, ContentPath } from '@/components/onboarding-v5/PathSelector';
import { SinglePostTypeSelector, PostType } from '@/components/onboarding-v5/SinglePostTypeSelector';
import { ContentPreview } from '@/components/onboarding-v5/ContentPreview';
import { useNavigate } from 'react-router-dom';
import { SmartUVPExtractor } from '@/services/uvp-wizard/SmartUVPExtractor';
import { locationDetectionService } from '@/services/intelligence/location-detection.service';
import { IndustryMatchingService } from '@/services/industry/IndustryMatchingService';
import type { ExtractedUVPData } from '@/types/smart-uvp.types';
import type { RetryProgress } from '@/services/errors/error-handler.service';
import { RetryProgress as RetryProgressComponent } from '@/components/onboarding-v5/RetryProgress';

type FlowStep =
  | 'url_input'
  | 'uvp_extraction'
  | 'smart_confirmation'
  | 'quick_refinement'
  | 'path_selection'
  | 'post_type_selection'
  | 'content_preview'
  | 'complete';

interface DetectedBusinessData {
  url: string;
  businessName: string;
  industry: string;
  location: string;
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
  const [currentStep, setCurrentStep] = useState<FlowStep>('url_input');
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [businessData, setBusinessData] = useState<DetectedBusinessData | null>(null);
  const [selectedPath, setSelectedPath] = useState<ContentPath | null>(null);
  const [selectedPostType, setSelectedPostType] = useState<PostType | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [progressSteps, setProgressSteps] = useState<Array<{step: string; status: 'pending' | 'in_progress' | 'complete' | 'error'; details?: string}>>([]);
  const [retryProgress, setRetryProgress] = useState<RetryProgress | null>(null);

  const addProgressStep = (step: string, status: 'pending' | 'in_progress' | 'complete' | 'error', details?: string) => {
    setProgressSteps(prev => {
      const existing = prev.find(s => s.step === step);
      if (existing) {
        return prev.map(s => s.step === step ? { ...s, status, details } : s);
      }
      return [...prev, { step, status, details }];
    });
  };

  // Handle URL submission - START UVP extraction process
  const handleUrlSubmit = async (url: string) => {
    console.log('[OnboardingPageV5] URL submitted:', url);
    setWebsiteUrl(url);
    setCurrentStep('uvp_extraction');
    setIsExtracting(true);
    setExtractionError(null);
    setProgressSteps([
      { step: 'Extracting UVP Data', status: 'pending' },
      { step: 'Detecting Location', status: 'pending' },
      { step: 'Detecting Industry', status: 'pending' },
      { step: 'Finalizing Discovery', status: 'pending' },
    ]);

    try {
      // Step 1: Extract UVP with retry and cache fallback
      addProgressStep('Understanding your unique offerings', 'in_progress', 'Reading your website content...');

      const smartUVPExtractor = new SmartUVPExtractor();
      const uvpData = await smartUVPExtractor.extractUVPWithCache(
        {
          websiteUrl: url,
          minConfidence: 0.6,
          requireSources: true,
        },
        (progress) => {
          // Update retry progress state
          setRetryProgress(progress);

          // Update UI message based on retry state
          if (progress.attempt > 1) {
            addProgressStep(
              'Understanding your unique offerings',
              'in_progress',
              `Retry attempt ${progress.attempt}/${progress.maxAttempts}...`
            );
          }
        }
      );

      // Clear retry progress after successful extraction
      setRetryProgress(null);

      addProgressStep('Understanding your unique offerings', 'complete', `Found ${uvpData.customerTypes.length} customers, ${uvpData.services.length} services, ${uvpData.problemsSolved.length} problems`);
      console.log('[OnboardingPageV5] UVP extracted:', {
        customers: uvpData.customerTypes.length,
        services: uvpData.services.length,
        problems: uvpData.problemsSolved.length,
      });

      // Step 2: Detect location
      addProgressStep('Detecting Location', 'in_progress', 'Analyzing website for location data...');
      const locationResult = await locationDetectionService.detectLocation(url);

      const locationStr = locationResult
        ? (locationResult.city ? `${locationResult.city}, ${locationResult.state}` : locationResult.state)
        : 'Not detected';
      addProgressStep('Detecting Location', 'complete', locationStr);
      console.log('[OnboardingPageV5] Location detected:', locationResult);

      // Step 3: Detect industry
      addProgressStep('Detecting Industry', 'in_progress', 'Matching services to industry codes...');
      let industry = 'General Business';

      if (uvpData.services.length > 0) {
        const industryMatch = await IndustryMatchingService.findMatch(
          uvpData.services.map(s => s.text).join(', ')
        );
        if (industryMatch && industryMatch.match) {
          industry = industryMatch.match.display_name;
        }
      }

      addProgressStep('Detecting Industry', 'complete', industry);
      console.log('[OnboardingPageV5] Industry detected:', industry);

      // Combine all detected data
      const detectedData: DetectedBusinessData = {
        url,
        businessName: uvpData.businessName || 'Your Business',
        industry,
        location: locationResult
          ? (locationResult.city ? `${locationResult.city}, ${locationResult.state}` : locationResult.state)
          : 'Location not detected',
        services: uvpData.services.map(s => s.text),
        competitors: [], // TODO: Add competitor detection
        uvpData,
        sources: {
          website: url,
          verified: uvpData.verificationRate > 0.7,
        },
      };

      addProgressStep('Finalizing Discovery', 'in_progress', 'Preparing summary...');
      setBusinessData(detectedData);

      addProgressStep('Finalizing Discovery', 'complete', 'Discovery complete!');

      // Wait a moment to show completed state
      await new Promise(resolve => setTimeout(resolve, 1000));

      setIsExtracting(false);

      // Clear retry progress on success
      setRetryProgress(null);

      // Auto-transition to path selection (skipping confirmation for now)
      // TODO: Add SmartConfirmation and QuickRefinement steps
      setCurrentStep('path_selection');

    } catch (error) {
      console.error('[OnboardingPageV5] URL submission error:', error);
      setIsExtracting(false);

      // Check if we got retry error information
      if (retryProgress && retryProgress.error) {
        setExtractionError(retryProgress.error.userMessage);
      } else {
        setExtractionError(
          error instanceof Error
            ? error.message
            : 'Failed to analyze website. Please try again or check the URL.'
        );
      }

      setCurrentStep('url_input');

      // Clear retry progress
      setRetryProgress(null);

      // Update progress steps to show error
      addProgressStep('Understanding your unique offerings', 'error', 'Analysis failed');
    }
  };

  // Legacy handler for OnboardingFlow component
  const handleBusinessDetected = (data: DetectedBusinessData) => {
    console.log('[OnboardingPageV5] Business detected (legacy):', data);
    setBusinessData(data);
    setCurrentStep('path_selection');
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
    console.log('[OnboardingPageV5] Generating single post:', postType);
    // TODO: Wire to content generation + calendar integration
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

  return (
    <div className="min-h-screen">
      {currentStep === 'url_input' && (
        <OnboardingFlow onUrlSubmit={handleUrlSubmit} onComplete={handleBusinessDetected} />
      )}

      {currentStep === 'uvp_extraction' && (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-6"></div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Discovering Your Business...
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                AI-powered analysis in progress
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

            {/* Retry Progress (if retrying) */}
            {retryProgress && retryProgress.attempt > 1 && (
              <div className="mt-4">
                <RetryProgressComponent
                  progress={retryProgress}
                  operation="website analysis"
                />
              </div>
            )}

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

      {currentStep === 'path_selection' && businessData && (
        <div>
          <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6 max-w-4xl mx-auto my-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Discovery Complete! 🎉
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Business</p>
                <p className="font-medium text-gray-900 dark:text-white">{businessData.businessName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Industry</p>
                <p className="font-medium text-gray-900 dark:text-white">{businessData.industry}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                <p className="font-medium text-gray-900 dark:text-white">{businessData.location}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Services Found</p>
                <p className="font-medium text-gray-900 dark:text-white">{businessData.services.length}</p>
              </div>
            </div>
            {businessData.uvpData && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">UVP Data Extracted:</p>
                <div className="text-sm space-y-1">
                  <p className="text-gray-700 dark:text-gray-300">
                    • {businessData.uvpData.customerTypes.length} customer types
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    • {businessData.uvpData.services.length} services
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    • {businessData.uvpData.problemsSolved.length} problems solved
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    • {businessData.uvpData.testimonials.length} testimonials
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    • Verification Rate: {((businessData.uvpData.verificationRate || 0) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            )}
          </div>
          <PathSelector onSelectPath={handlePathSelected} />
        </div>
      )}

      {currentStep === 'post_type_selection' && (
        <SinglePostTypeSelector onSelectPostType={handlePostTypeSelected} />
      )}

      {currentStep === 'content_preview' && (
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

      {currentStep === 'complete' && (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              All Set! 🎉
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Redirecting to your campaign...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
