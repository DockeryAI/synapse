/**
 * Onboarding Page V5 - Discovery-First Smart Onboarding
 *
 * Week 7: Orchestrates the complete onboarding flow with source verification
 *
 * Flow: URL Input → Path Selection → Content Generation → Preview → Email Capture
 */

import React, { useState } from 'react';
import { OnboardingFlow } from '@/components/onboarding-v5/OnboardingFlow';
import { PathSelector, ContentPath } from '@/components/onboarding-v5/PathSelector';
import { SinglePostTypeSelector, PostType } from '@/components/onboarding-v5/SinglePostTypeSelector';
import { ContentPreview } from '@/components/onboarding-v5/ContentPreview';
import { useNavigate } from 'react-router-dom';

type FlowStep = 'url_input' | 'path_selection' | 'post_type_selection' | 'content_preview' | 'complete';

interface DetectedBusinessData {
  url: string;
  businessName: string;
  industry: string;
  location: string;
  services: string[];
  competitors: string[];
  sources: {
    website: string;
    verified: boolean;
  };
}

export const OnboardingPageV5: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<FlowStep>('url_input');
  const [businessData, setBusinessData] = useState<DetectedBusinessData | null>(null);
  const [selectedPath, setSelectedPath] = useState<ContentPath | null>(null);
  const [selectedPostType, setSelectedPostType] = useState<PostType | null>(null);

  // Handle URL input completion
  const handleBusinessDetected = (data: DetectedBusinessData) => {
    console.log('[OnboardingPageV5] Business detected:', data);
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
        <OnboardingFlow onComplete={handleBusinessDetected} />
      )}

      {currentStep === 'path_selection' && (
        <PathSelector onSelectPath={handlePathSelected} />
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
