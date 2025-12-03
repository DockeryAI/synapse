/**
 * useSpecialtyGeneration Hook
 *
 * React hook for managing async specialty profile generation.
 * Integrates with the specialty detection service and Edge Function.
 *
 * Phase 4: Async Generation Pipeline
 *
 * @example
 * ```tsx
 * const { generate, isGenerating, progress, error, profile } = useSpecialtyGeneration();
 *
 * const handleOnboarding = async () => {
 *   const result = await generate(input, detectionResult, brandId);
 *   if (result.success) {
 *     console.log('Profile generated:', result.profile);
 *   }
 * };
 * ```
 */

import { useState, useCallback } from 'react';
import { specialtyDetector } from '../services/specialty-detection.service';
import type {
  SpecialtyDetectionInput,
  SpecialtyDetectionResult,
  SpecialtyProfileRow,
  SpecialtyGenerationProgress
} from '@/types/specialty-profile.types';

/**
 * Generation stage for UI display
 */
export type GenerationStage =
  | 'idle'
  | 'detecting'
  | 'creating'
  | 'triggering'
  | 'generating'
  | 'linking'
  | 'complete'
  | 'failed';

/**
 * Return type of useSpecialtyGeneration hook
 */
export interface UseSpecialtyGenerationReturn {
  /** Generated profile (null until complete) */
  profile: SpecialtyProfileRow | null;

  /** Is generation currently running */
  isGenerating: boolean;

  /** Current stage of the generation process */
  stage: GenerationStage;

  /** Progress percentage (0-100) */
  progress: number;

  /** Progress message for UI */
  progressMessage: string;

  /** Error if one occurred */
  error: string | null;

  /** Validation score of the generated profile */
  validationScore: number | null;

  /** Execute specialty detection (enhanced) */
  detect: (input: SpecialtyDetectionInput) => Promise<SpecialtyDetectionResult>;

  /** Generate specialty profile async */
  generate: (
    input: SpecialtyDetectionInput,
    detectionResult: SpecialtyDetectionResult,
    brandId?: string
  ) => Promise<{ success: boolean; profile: SpecialtyProfileRow | null; error?: string }>;

  /** Full flow: detect + generate if needed */
  detectAndGenerate: (
    input: SpecialtyDetectionInput,
    brandId?: string
  ) => Promise<{
    success: boolean;
    profile: SpecialtyProfileRow | null;
    detectionResult: SpecialtyDetectionResult;
    error?: string;
  }>;

  /** Reset the hook state */
  reset: () => void;
}

/**
 * Custom hook for managing specialty profile generation
 *
 * Provides a clean interface for:
 * 1. Detecting specialty businesses
 * 2. Triggering async profile generation
 * 3. Tracking generation progress
 * 4. Handling errors
 */
export function useSpecialtyGeneration(): UseSpecialtyGenerationReturn {
  const [profile, setProfile] = useState<SpecialtyProfileRow | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stage, setStage] = useState<GenerationStage>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationScore, setValidationScore] = useState<number | null>(null);

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    setProfile(null);
    setIsGenerating(false);
    setStage('idle');
    setProgress(0);
    setProgressMessage('');
    setError(null);
    setValidationScore(null);
  }, []);

  /**
   * Detect specialty from input
   */
  const detect = useCallback(async (input: SpecialtyDetectionInput): Promise<SpecialtyDetectionResult> => {
    setError(null);
    setStage('detecting');
    setProgress(5);
    setProgressMessage('Detecting specialty...');

    try {
      const result = await specialtyDetector.detectSpecialtyEnhanced(input);

      // If existing profile found, set it
      if (result.existingProfile) {
        setProfile(result.existingProfile);
        setValidationScore(result.existingProfile.multipass_validation_score);
        setStage('complete');
        setProgress(100);
        setProgressMessage('Found existing profile');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Detection failed';
      setError(errorMessage);
      setStage('failed');
      throw err;
    }
  }, []);

  /**
   * Generate specialty profile
   */
  const generate = useCallback(async (
    input: SpecialtyDetectionInput,
    detectionResult: SpecialtyDetectionResult,
    brandId?: string
  ): Promise<{ success: boolean; profile: SpecialtyProfileRow | null; error?: string }> => {
    setError(null);
    setIsGenerating(true);

    try {
      const result = await specialtyDetector.generateSpecialtyProfileAsync(
        input,
        detectionResult,
        brandId,
        (stageStr, prog, message) => {
          // Map string stage to GenerationStage
          const stageMap: Record<string, GenerationStage> = {
            'creating': 'creating',
            'triggering': 'triggering',
            'generating': 'generating',
            'linking': 'linking',
            'complete': 'complete'
          };
          setStage(stageMap[stageStr] || 'generating');
          setProgress(prog);
          setProgressMessage(message);
        }
      );

      if (result.success && result.profile) {
        setProfile(result.profile);
        setValidationScore(result.profile.multipass_validation_score);
        setStage('complete');
      } else {
        setStage('failed');
        setError(result.error || 'Generation failed');
      }

      setIsGenerating(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Generation failed';
      setError(errorMessage);
      setStage('failed');
      setIsGenerating(false);
      return { success: false, profile: null, error: errorMessage };
    }
  }, []);

  /**
   * Full flow: detect + generate if needed
   */
  const detectAndGenerate = useCallback(async (
    input: SpecialtyDetectionInput,
    brandId?: string
  ): Promise<{
    success: boolean;
    profile: SpecialtyProfileRow | null;
    detectionResult: SpecialtyDetectionResult;
    error?: string;
  }> => {
    try {
      // Step 1: Detect
      const detectionResult = await detect(input);

      // If existing profile found, we're done
      if (detectionResult.existingProfile) {
        return {
          success: true,
          profile: detectionResult.existingProfile,
          detectionResult
        };
      }

      // Step 2: Generate if needed
      if (detectionResult.needsGeneration) {
        const generateResult = await generate(input, detectionResult, brandId);
        return {
          success: generateResult.success,
          profile: generateResult.profile,
          detectionResult,
          error: generateResult.error
        };
      }

      // No generation needed and no existing profile
      return {
        success: true,
        profile: null,
        detectionResult
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed';
      return {
        success: false,
        profile: null,
        detectionResult: {
          isSpecialty: false,
          specialtyName: input.businessName,
          specialtyHash: '',
          specialtyDescription: '',
          baseNaicsCode: null,
          businessProfileType: 'national-saas-b2b',
          confidence: 0,
          reasoning: errorMessage,
          existingProfile: null,
          needsGeneration: false
        },
        error: errorMessage
      };
    }
  }, [detect, generate]);

  return {
    profile,
    isGenerating,
    stage,
    progress,
    progressMessage,
    error,
    validationScore,
    detect,
    generate,
    detectAndGenerate,
    reset
  };
}

/**
 * Helper function to get user-friendly stage names
 */
export function getStageName(stage: GenerationStage): string {
  switch (stage) {
    case 'idle':
      return 'Ready';
    case 'detecting':
      return 'Detecting Specialty';
    case 'creating':
      return 'Creating Profile';
    case 'triggering':
      return 'Starting Generation';
    case 'generating':
      return 'Generating Profile';
    case 'linking':
      return 'Linking to Brand';
    case 'complete':
      return 'Complete';
    case 'failed':
      return 'Failed';
    default:
      return 'Unknown';
  }
}

/**
 * Helper function to get stage descriptions
 */
export function getStageDescription(stage: GenerationStage): string {
  switch (stage) {
    case 'idle':
      return 'Ready to detect and generate specialty profile';
    case 'detecting':
      return 'Analyzing business to detect specialty...';
    case 'creating':
      return 'Creating specialty profile record...';
    case 'triggering':
      return 'Starting AI profile generation...';
    case 'generating':
      return 'AI is generating your custom industry profile (15-30 seconds)...';
    case 'linking':
      return 'Linking profile to your brand...';
    case 'complete':
      return 'Profile generation complete!';
    case 'failed':
      return 'An error occurred during generation';
    default:
      return '';
  }
}
