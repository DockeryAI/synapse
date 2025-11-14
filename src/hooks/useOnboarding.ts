/**
 * useOnboarding Hook
 *
 * Orchestrates the complete business onboarding flow:
 * URL Input → Parse → Gather Intelligence → Detect Specialty
 *
 * This hook connects Worktree 1 backend services to the UI,
 * providing a single interface for the entire onboarding process.
 *
 * @example
 * ```tsx
 * const { data, loading, error, execute } = useOnboarding();
 *
 * const handleSubmit = async () => {
 *   await execute('https://example.com');
 *   // data.specialty, data.intelligence available
 * };
 * ```
 */

import { useState, useCallback } from 'react';
import { urlParser, ParsedURL } from '../services/url-parser.service';
import { ParallelIntelligenceService } from '../services/parallel-intelligence.service';
import { SpecialtyDetectionService } from '../services/specialty-detection.service';
import type { IntelligenceResult } from '../services/parallel-intelligence.service';
import type { SpecialtyDetection } from '../services/specialty-detection.service';

/**
 * Complete onboarding data returned after successful execution
 */
export interface OnboardingData {
  /** Original URL input */
  url: string;
  /** Parsed URL components */
  parsedUrl: ParsedURL;
  /** Intelligence gathered from all sources */
  intelligence: IntelligenceResult[];
  /** Detected business specialty */
  specialty: SpecialtyDetection;
  /** Timestamp of completion */
  completedAt: Date;
}

/**
 * Current step in the onboarding process
 */
export type OnboardingStep =
  | 'idle'
  | 'parsing'
  | 'gathering-intelligence'
  | 'detecting-specialty'
  | 'complete'
  | 'error';

/**
 * Error that occurred during onboarding
 */
export interface OnboardingError {
  /** Which step failed */
  step: OnboardingStep;
  /** Error message */
  message: string;
  /** Original error */
  originalError?: Error;
}

/**
 * Return type of useOnboarding hook
 */
export interface UseOnboardingReturn {
  /** Complete onboarding data (null until complete) */
  data: OnboardingData | null;
  /** Is onboarding currently running */
  loading: boolean;
  /** Current step in the process */
  currentStep: OnboardingStep;
  /** Error if one occurred */
  error: OnboardingError | null;
  /** Execute the onboarding flow */
  execute: (url: string) => Promise<OnboardingData>;
  /** Reset the onboarding state */
  reset: () => void;
  /** Progress percentage (0-100) */
  progress: number;
}

// Initialize services
const parallelIntelligence = new ParallelIntelligenceService();
const specialtyDetector = new SpecialtyDetectionService();

/**
 * Custom hook for orchestrating business onboarding flow
 *
 * Handles the complete flow from URL input to specialty detection,
 * including all intermediate steps and error handling.
 *
 * @returns {UseOnboardingReturn} Onboarding state and controls
 */
export function useOnboarding(): UseOnboardingReturn {
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('idle');
  const [error, setError] = useState<OnboardingError | null>(null);

  /**
   * Calculate progress percentage based on current step
   */
  const getProgress = useCallback((): number => {
    switch (currentStep) {
      case 'idle':
        return 0;
      case 'parsing':
        return 10;
      case 'gathering-intelligence':
        return 40;
      case 'detecting-specialty':
        return 80;
      case 'complete':
        return 100;
      case 'error':
        return 0;
      default:
        return 0;
    }
  }, [currentStep]);

  /**
   * Reset onboarding state to initial values
   */
  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setCurrentStep('idle');
    setError(null);
  }, []);

  /**
   * Execute the complete onboarding flow
   *
   * @param url - Business website URL to analyze
   * @returns Promise resolving to complete onboarding data
   * @throws {OnboardingError} If any step fails
   */
  const execute = useCallback(async (url: string): Promise<OnboardingData> => {
    console.log('🚀 Starting onboarding flow for:', url);

    // Reset state
    setData(null);
    setError(null);
    setLoading(true);

    try {
      // STEP 1: Parse URL
      setCurrentStep('parsing');
      console.log('📝 Step 1/3: Parsing URL...');

      const parsedUrl = urlParser.parse(url);

      if (!parsedUrl.isValid) {
        throw new Error('Invalid URL format. Please enter a valid website URL.');
      }

      console.log('✅ URL parsed:', parsedUrl.normalized);

      // STEP 2: Gather Intelligence (17 parallel APIs)
      setCurrentStep('gathering-intelligence');
      console.log('🔍 Step 2/3: Gathering intelligence from 17 sources...');
      console.log('   This may take up to 30 seconds...');

      const intelligence = await parallelIntelligence.gather(parsedUrl);

      const successfulSources = intelligence.filter(r => r.success).length;
      console.log(`✅ Intelligence gathered: ${successfulSources}/${intelligence.length} sources successful`);

      if (successfulSources < 8) {
        console.warn(`⚠️ Only ${successfulSources} sources succeeded. Minimum is 8.`);
        throw new Error(
          `Insufficient intelligence data. Only ${successfulSources} of 17 sources responded. ` +
          `Please check your internet connection and try again.`
        );
      }

      // STEP 3: Detect Specialty
      setCurrentStep('detecting-specialty');
      console.log('🎯 Step 3/3: Detecting business specialty...');

      const specialty = await specialtyDetector.detectSpecialty(
        intelligence,
        parsedUrl.domain,
        parsedUrl.normalized
      );

      console.log('✅ Specialty detected:', specialty.specialty);
      console.log('   Industry:', specialty.industry);
      console.log('   NAICS Code:', specialty.naicsCode);
      console.log('   Confidence:', `${specialty.confidence}%`);

      // Complete!
      setCurrentStep('complete');

      const onboardingData: OnboardingData = {
        url,
        parsedUrl,
        intelligence,
        specialty,
        completedAt: new Date()
      };

      setData(onboardingData);
      setLoading(false);

      console.log('🎉 Onboarding complete!');

      return onboardingData;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';

      const onboardingError: OnboardingError = {
        step: currentStep,
        message: errorMessage,
        originalError: err instanceof Error ? err : undefined
      };

      console.error('❌ Onboarding failed at step:', currentStep);
      console.error('   Error:', errorMessage);

      setError(onboardingError);
      setCurrentStep('error');
      setLoading(false);

      throw onboardingError;
    }
  }, [currentStep]);

  return {
    data,
    loading,
    currentStep,
    error,
    execute,
    reset,
    progress: getProgress()
  };
}

/**
 * Helper function to get user-friendly step names
 */
export function getStepName(step: OnboardingStep): string {
  switch (step) {
    case 'idle':
      return 'Ready';
    case 'parsing':
      return 'Parsing URL';
    case 'gathering-intelligence':
      return 'Gathering Intelligence';
    case 'detecting-specialty':
      return 'Detecting Specialty';
    case 'complete':
      return 'Complete';
    case 'error':
      return 'Error';
    default:
      return 'Unknown';
  }
}

/**
 * Helper function to get step descriptions
 */
export function getStepDescription(step: OnboardingStep): string {
  switch (step) {
    case 'idle':
      return 'Enter a business website URL to begin';
    case 'parsing':
      return 'Validating and normalizing URL...';
    case 'gathering-intelligence':
      return 'Analyzing website, reviews, social media, and more (17 sources)...';
    case 'detecting-specialty':
      return 'Identifying business niche and industry classification...';
    case 'complete':
      return 'Analysis complete!';
    case 'error':
      return 'An error occurred during analysis';
    default:
      return '';
  }
}
