/**
 * V5 Content Panel Component
 *
 * Main generation interface with platform selection, customer category, and generation controls.
 *
 * Created: 2025-12-01
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ContentCard } from './ContentCard';
import { useV5ContentGeneration } from '@/hooks/useV5ContentGeneration';
import type { Platform, CustomerCategory, ContentType } from '@/services/v5/types';
import { PLATFORM_CONSTRAINTS, CUSTOMER_CATEGORY_MAPPINGS } from '@/services/v5/types';
import {
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
  Sparkles,
  Loader2,
  AlertCircle,
  Settings2,
  ChevronDown,
} from 'lucide-react';

export interface V5ContentPanelProps {
  brandId?: string;
  industrySlug?: string;
  eqScore?: number;
  onSaveToCalendar?: (content: any) => void;
  className?: string;
}

const PLATFORMS: { id: Platform; label: string; icon: React.ReactNode }[] = [
  { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin className="w-5 h-5" /> },
  { id: 'facebook', label: 'Facebook', icon: <Facebook className="w-5 h-5" /> },
  { id: 'instagram', label: 'Instagram', icon: <Instagram className="w-5 h-5" /> },
  { id: 'twitter', label: 'Twitter', icon: <Twitter className="w-5 h-5" /> },
  {
    id: 'tiktok',
    label: 'TikTok',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    ),
  },
];

const CONTENT_TYPES: { id: ContentType; label: string }[] = [
  { id: 'promotional', label: 'Promotional' },
  { id: 'educational', label: 'Educational' },
  { id: 'community', label: 'Community' },
  { id: 'authority', label: 'Authority' },
  { id: 'engagement', label: 'Engagement' },
];

const CUSTOMER_CATEGORIES: { id: CustomerCategory; label: string; description: string }[] = [
  { id: 'pain-driven', label: 'Pain-Driven', description: 'Immediate problem needing solution' },
  { id: 'aspiration-driven', label: 'Aspiration', description: 'Desire for transformation' },
  { id: 'trust-seeking', label: 'Trust-Seeking', description: 'Need validation' },
  { id: 'convenience-driven', label: 'Convenience', description: 'Path of least resistance' },
  { id: 'value-driven', label: 'Value-Driven', description: 'ROI and outcome focus' },
  { id: 'community-driven', label: 'Community', description: 'Belonging and identity' },
];

export function V5ContentPanel({
  brandId,
  industrySlug,
  eqScore,
  onSaveToCalendar,
  className,
}: V5ContentPanelProps) {
  // Generation hook
  const {
    state,
    generatedContent,
    generate,
    regenerate,
    clear,
  } = useV5ContentGeneration();

  // Form state
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('linkedin');
  const [selectedCategory, setSelectedCategory] = useState<CustomerCategory>('pain-driven');
  const [selectedContentType, setSelectedContentType] = useState<ContentType>('promotional');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [skipAI, setSkipAI] = useState(false);

  const handleGenerate = async () => {
    await generate({
      platform: selectedPlatform,
      contentType: selectedContentType,
      customerCategory: selectedCategory,
      brandId,
      industrySlug,
      eqScore,
      skipAI,
    });
  };

  const getStepLabel = (): string => {
    switch (state.currentStep) {
      case 'loading-data':
        return 'Loading context...';
      case 'selecting-template':
        return 'Selecting template...';
      case 'populating-template':
        return 'Populating template...';
      case 'enhancing':
        return 'AI enhancing...';
      case 'scoring':
        return 'Scoring content...';
      case 'complete':
        return 'Complete!';
      case 'error':
        return 'Error';
      default:
        return 'Ready';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Platform Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Platform</label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((platform) => (
            <button
              key={platform.id}
              onClick={() => setSelectedPlatform(platform.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all',
                selectedPlatform === platform.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              )}
            >
              {platform.icon}
              <span className="text-sm font-medium">{platform.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Customer Category */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Target Customer</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {CUSTOMER_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                'flex flex-col items-start p-3 rounded-lg border transition-all text-left',
                selectedCategory === category.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              <span
                className={cn(
                  'text-sm font-medium',
                  selectedCategory === category.id ? 'text-purple-700' : 'text-gray-700'
                )}
              >
                {category.label}
              </span>
              <span className="text-xs text-gray-500">{category.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Options Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <Settings2 className="w-4 h-4" />
        <span>Advanced Options</span>
        <ChevronDown
          className={cn('w-4 h-4 transition-transform', showAdvanced && 'rotate-180')}
        />
      </button>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          {/* Content Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Content Type</label>
            <div className="flex flex-wrap gap-2">
              {CONTENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedContentType(type.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full border text-sm transition-all',
                    selectedContentType === type.id
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Skip AI Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={skipAI}
              onChange={(e) => setSkipAI(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Skip AI enhancement (template only)</span>
          </label>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={state.isGenerating}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-all',
          state.isGenerating
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
        )}
      >
        {state.isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{getStepLabel()}</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>Generate V5 Content</span>
          </>
        )}
      </button>

      {/* Progress Bar */}
      {state.isGenerating && (
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${state.progress}%` }}
          />
        </div>
      )}

      {/* Error Message */}
      {state.error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Generation Failed</p>
            <p className="text-sm text-red-600">{state.error}</p>
          </div>
        </div>
      )}

      {/* Generated Content */}
      {generatedContent && (
        <ContentCard
          content={generatedContent}
          onRegenerate={regenerate}
          onSaveToCalendar={onSaveToCalendar ? () => onSaveToCalendar(generatedContent) : undefined}
          isRegenerating={state.isGenerating}
          showDetailedScore
        />
      )}

      {/* Empty State */}
      {!generatedContent && !state.isGenerating && !state.error && (
        <div className="text-center py-12 text-gray-400">
          <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Ready to generate</p>
          <p className="text-sm">Select a platform and customer type, then click Generate</p>
        </div>
      )}
    </div>
  );
}

export default V5ContentPanel;
