/**
 * INDUSTRY PROFILE FLOW - COMPLETE INTEGRATION EXAMPLE
 *
 * Demonstrates the complete flow:
 * 1. User enters industry
 * 2. Detect NAICS code
 * 3. Confirm NAICS code
 * 4. Generate profile with progress tracking
 * 5. Save mapping for future use
 *
 * This component can be used directly or serve as a reference implementation.
 */

import React, { useState } from 'react';
import { NAICSDetectorService } from '@/services/industry/NAICSDetector.service';
import { IndustryProfileGenerator } from '@/services/industry/IndustryProfileGenerator.service';
import { NAICSMappingService } from '@/services/industry/NAICSMapping.service';
import { NAICSConfirmation } from './NAICSConfirmation';
import { ProfileGenerationProgress } from './ProfileGenerationProgress';
import { type NAICSCandidate, type GenerationProgress, type IndustryProfileFull } from '@/types/industry-profile.types';
import { Search, Loader2 } from 'lucide-react';

type FlowState = 'input' | 'detecting' | 'confirming' | 'generating' | 'complete' | 'error';

export function IndustryProfileFlow() {
  // State
  const [flowState, setFlowState] = useState<FlowState>('input');
  const [industryInput, setIndustryInput] = useState('');
  const [detectedNAICS, setDetectedNAICS] = useState<NAICSCandidate | null>(null);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [generatedProfile, setGeneratedProfile] = useState<IndustryProfileFull | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Detect NAICS Code
  const handleDetectIndustry = async () => {
    if (!industryInput.trim()) {
      setError('Please enter an industry');
      return;
    }

    setFlowState('detecting');
    setError(null);

    try {
      console.log('[IndustryProfileFlow] Detecting NAICS code...');

      const result = await NAICSDetectorService.detectNAICSCode(industryInput);

      console.log('[IndustryProfileFlow] Detection result:', result);

      setDetectedNAICS(result);
      setFlowState('confirming');

    } catch (err) {
      console.error('[IndustryProfileFlow] Detection failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to detect industry');
      setFlowState('error');
    }
  };

  // Step 2: Confirm NAICS and Generate Profile
  const handleConfirmNAICS = async (naicsCode: string, displayName: string) => {
    setFlowState('generating');
    setError(null);

    try {
      console.log('[IndustryProfileFlow] Generating profile for:', displayName, naicsCode);

      // Save mapping for future use
      if (detectedNAICS) {
        await NAICSMappingService.saveMapping(
          industryInput,
          naicsCode,
          displayName,
          detectedNAICS.confidence
        );
      }

      // Generate profile with progress tracking
      const profile = await IndustryProfileGenerator.generateProfile(
        displayName,
        naicsCode,
        (progress) => {
          console.log('[IndustryProfileFlow] Progress:', progress);
          setGenerationProgress(progress);
        }
      );

      console.log('[IndustryProfileFlow] Profile generated successfully');

      setGeneratedProfile(profile);
      setFlowState('complete');

    } catch (err) {
      console.error('[IndustryProfileFlow] Generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate profile');
      setFlowState('error');
    }
  };

  // Step 3: Reject NAICS and Try Again
  const handleRejectNAICS = () => {
    setDetectedNAICS(null);
    setFlowState('input');
  };

  // Reset Flow
  const handleReset = () => {
    setFlowState('input');
    setIndustryInput('');
    setDetectedNAICS(null);
    setGenerationProgress(null);
    setGeneratedProfile(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Industry Profile Generator
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Generate comprehensive industry profiles powered by Claude Opus 4.1
          </p>
        </div>

        {/* Step 1: Industry Input */}
        {flowState === 'input' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              What industry are you in?
            </label>

            <div className="flex space-x-3">
              <input
                type="text"
                value={industryInput}
                onChange={(e) => setIndustryInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleDetectIndustry()}
                placeholder="e.g., dentist, plumber, bakery, marketing agency..."
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />

              <button
                onClick={handleDetectIndustry}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Search className="w-5 h-5" />
                <span>Detect</span>
              </button>
            </div>

            {error && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            {/* Examples */}
            <div className="mt-6">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Try these examples:</p>
              <div className="flex flex-wrap gap-2">
                {['Dental Practice', 'HVAC Contractor', 'Coffee Shop', 'Yoga Studio', 'IT Consulting'].map((example) => (
                  <button
                    key={example}
                    onClick={() => setIndustryInput(example)}
                    className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Detecting */}
        {flowState === 'detecting' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Detecting Industry Classification...
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md">
                Using Claude Opus 4.1 to analyze "{industryInput}" and match to the most appropriate NAICS code.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Confirm NAICS */}
        {flowState === 'confirming' && detectedNAICS && (
          <NAICSConfirmation
            detected={detectedNAICS}
            alternatives={[]} // Could add fuzzy matches here
            onConfirm={handleConfirmNAICS}
            onReject={handleRejectNAICS}
          />
        )}

        {/* Step 4: Generating Profile */}
        {flowState === 'generating' && generationProgress && detectedNAICS && (
          <ProfileGenerationProgress
            progress={generationProgress}
            industryName={detectedNAICS.display_name}
          />
        )}

        {/* Step 5: Complete */}
        {flowState === 'complete' && generatedProfile && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                <span className="text-3xl">🎉</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Profile Generated Successfully!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your {generatedProfile.industry_name} industry profile is ready.
              </p>
            </div>

            {/* Profile Preview */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Profile Summary
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="Customer Triggers"
                  value={Array.isArray(generatedProfile.customer_triggers) ? generatedProfile.customer_triggers.length : 0}
                />
                <StatCard
                  label="Power Words"
                  value={Array.isArray(generatedProfile.power_words) ? generatedProfile.power_words.length : 0}
                />
                <StatCard
                  label="Headline Templates"
                  value={Array.isArray(generatedProfile.headline_templates) ? generatedProfile.headline_templates.length : 0}
                />
                <StatCard
                  label="Social Hooks"
                  value={Array.isArray(generatedProfile.social_media_hooks) ? generatedProfile.social_media_hooks.length : 0}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center space-x-3">
              <button
                onClick={handleReset}
                className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Generate Another Profile
              </button>

              <button
                onClick={() => console.log('Profile:', generatedProfile)}
                className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Full Profile
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {flowState === 'error' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                <span className="text-3xl">❌</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Something Went Wrong
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error || 'An unexpected error occurred'}
              </p>

              <button
                onClick={handleReset}
                className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for stat cards
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
        {value}
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
        {label}
      </div>
    </div>
  );
}

export default IndustryProfileFlow;
