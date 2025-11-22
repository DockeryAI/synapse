/**
 * useUVPGeneration Hook
 *
 * Main orchestration hook for complete UVP generation flow.
 * Manages state, progress tracking, and coordinates with Week4Orchestrator.
 *
 * ISOLATION: Zero V1 imports - Uses V2 services only
 */

import { useReducer, useCallback, useEffect, useRef } from 'react';
import { Week4Orchestrator } from '@/services/v2/integration/Week4Orchestrator';
import type { OrchestratedUVPResult } from '@/services/v2/integration/Week4Orchestrator';
import type { ExtractionResult } from '@/types/v2/extractor.types';

/**
 * Generation phases
 */
export type GenerationPhase =
  | 'idle'
  | 'extraction'
  | 'analysis'
  | 'synthesis'
  | 'enhancement'
  | 'complete';

/**
 * Generation state
 */
type GenerationState =
  | { status: 'idle' }
  | {
      status: 'generating';
      progress: number;
      phase: GenerationPhase;
      sessionId: string;
    }
  | {
      status: 'complete';
      result: OrchestratedUVPResult;
      sessionId: string;
    }
  | { status: 'error'; error: Error; sessionId?: string };

/**
 * State actions
 */
type GenerationAction =
  | { type: 'START'; sessionId: string }
  | { type: 'UPDATE_PROGRESS'; phase: GenerationPhase; progress: number }
  | { type: 'COMPLETE'; result: OrchestratedUVPResult }
  | { type: 'ERROR'; error: Error }
  | { type: 'RESET' }
  | { type: 'CANCEL' };

/**
 * Hook options
 */
export interface UseUVPGenerationOptions {
  /** Enable session storage persistence */
  enablePersistence?: boolean;
  /** Minimum quality threshold */
  qualityThreshold?: number;
  /** Auto-enhance if quality below threshold */
  autoEnhance?: boolean;
}

/**
 * Hook return value
 */
export interface UseUVPGenerationReturn {
  /** Start UVP generation */
  generateUVP: (
    brandId: string,
    extractionResults: ExtractionResult[],
    options?: {
      websiteUrl?: string;
      industryContext?: {
        naicsCode: string;
        industryName: string;
      };
    }
  ) => Promise<void>;
  /** Is currently generating */
  isGenerating: boolean;
  /** Progress percentage (0-100) */
  progress: number;
  /** Current generation phase */
  currentPhase: GenerationPhase;
  /** Final result (when complete) */
  result: OrchestratedUVPResult | null;
  /** Error if failed */
  error: Error | null;
  /** Retry after error */
  retry: () => Promise<void>;
  /** Cancel ongoing generation */
  cancel: () => void;
  /** Reset to idle state */
  reset: () => void;
  /** Session ID (for tracking) */
  sessionId: string | null;
}

/**
 * State reducer
 */
function generationReducer(
  state: GenerationState,
  action: GenerationAction
): GenerationState {
  switch (action.type) {
    case 'START':
      return {
        status: 'generating',
        progress: 0,
        phase: 'extraction',
        sessionId: action.sessionId,
      };

    case 'UPDATE_PROGRESS':
      if (state.status !== 'generating') return state;
      return {
        ...state,
        progress: action.progress,
        phase: action.phase,
      };

    case 'COMPLETE':
      if (state.status !== 'generating') return state;
      return {
        status: 'complete',
        result: action.result,
        sessionId: state.sessionId,
      };

    case 'ERROR':
      return {
        status: 'error',
        error: action.error,
        sessionId: state.status === 'generating' ? state.sessionId : undefined,
      };

    case 'RESET':
    case 'CANCEL':
      return { status: 'idle' };

    default:
      return state;
  }
}

/**
 * Session storage key
 */
const STORAGE_KEY = 'uvp_generation_state_v2';

/**
 * useUVPGeneration Hook
 *
 * Orchestrates the complete UVP generation flow with progress tracking,
 * error handling, and session persistence.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     generateUVP,
 *     isGenerating,
 *     progress,
 *     currentPhase,
 *     result,
 *     error
 *   } = useUVPGeneration();
 *
 *   const handleGenerate = async () => {
 *     await generateUVP(brandId, extractionResults);
 *   };
 *
 *   return (
 *     <div>
 *       {isGenerating && <Progress value={progress} phase={currentPhase} />}
 *       {result && <UVPDisplay result={result} />}
 *       {error && <ErrorMessage error={error} />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useUVPGeneration(
  options: UseUVPGenerationOptions = {}
): UseUVPGenerationReturn {
  const {
    enablePersistence = true,
    qualityThreshold = 70,
    autoEnhance = true,
  } = options;

  // Initialize state
  const [state, dispatch] = useReducer(generationReducer, { status: 'idle' });

  // Orchestrator instance (persists across renders)
  const orchestratorRef = useRef<Week4Orchestrator | null>(null);
  const lastRequestRef = useRef<{
    brandId: string;
    extractionResults: ExtractionResult[];
    options?: any;
  } | null>(null);

  // Cancel flag
  const cancelledRef = useRef(false);

  // Initialize orchestrator
  useEffect(() => {
    orchestratorRef.current = new Week4Orchestrator({
      qualityThreshold,
      autoEnhance,
      enableCacheWarming: true,
      synthesisMode: 'standard' as any,
    });
  }, [qualityThreshold, autoEnhance]);

  // Load persisted state on mount
  useEffect(() => {
    if (!enablePersistence) return;

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedState = JSON.parse(stored);
        // Only restore if not idle
        if (parsedState.status !== 'idle') {
          // Restore state (but don't restart generation)
          dispatch({ type: 'RESET' });
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted generation state:', error);
    }
  }, [enablePersistence]);

  // Persist state changes
  useEffect(() => {
    if (!enablePersistence) return;

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to persist generation state:', error);
    }
  }, [state, enablePersistence]);

  /**
   * Generate UVP from extraction results
   */
  const generateUVP = useCallback(
    async (
      brandId: string,
      extractionResults: ExtractionResult[],
      options?: {
        websiteUrl?: string;
        industryContext?: {
          naicsCode: string;
          industryName: string;
        };
      }
    ) => {
      if (!orchestratorRef.current) {
        throw new Error('Orchestrator not initialized');
      }

      // Store request for retry
      lastRequestRef.current = { brandId, extractionResults, options };
      cancelledRef.current = false;

      // Generate session ID
      const sessionId = `gen_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Start generation
      dispatch({ type: 'START', sessionId });

      try {
        // Phase 1: Extraction (already done, but update progress)
        dispatch({ type: 'UPDATE_PROGRESS', phase: 'extraction', progress: 10 });
        await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay for UI

        if (cancelledRef.current) {
          dispatch({ type: 'CANCEL' });
          return;
        }

        // Phase 2: Analysis
        dispatch({ type: 'UPDATE_PROGRESS', phase: 'analysis', progress: 30 });
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (cancelledRef.current) {
          dispatch({ type: 'CANCEL' });
          return;
        }

        // Phase 3: Synthesis
        dispatch({ type: 'UPDATE_PROGRESS', phase: 'synthesis', progress: 50 });

        // Call orchestrator with website content
        const websiteAnalysis = options?.websiteUrl
          ? {
              domain: options.websiteUrl,
              brandVoice: options?.websiteContent?.description,
              keyMessages: [
                options?.websiteContent?.title,
                ...(options?.websiteContent?.headings || []).slice(0, 5)
              ].filter(Boolean),
              competitivePosition: options?.websiteContent?.description,
            }
          : undefined;

        console.log('[useUVPGeneration] Passing website analysis to orchestrator:', {
          hasWebsiteAnalysis: !!websiteAnalysis,
          keyMessagesCount: websiteAnalysis?.keyMessages?.length || 0,
          firstMessage: websiteAnalysis?.keyMessages?.[0],
        });

        const result = await orchestratorRef.current.orchestrate(
          brandId,
          extractionResults,
          {
            sessionId,
            industryContext: options?.industryContext,
            websiteAnalysis,
          }
        );

        if (cancelledRef.current) {
          dispatch({ type: 'CANCEL' });
          return;
        }

        // Phase 4: Enhancement (if applied)
        if (result.enhancements.length > 0) {
          dispatch({ type: 'UPDATE_PROGRESS', phase: 'enhancement', progress: 80 });
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        if (cancelledRef.current) {
          dispatch({ type: 'CANCEL' });
          return;
        }

        // Complete
        dispatch({ type: 'UPDATE_PROGRESS', phase: 'complete', progress: 100 });
        await new Promise((resolve) => setTimeout(resolve, 300));

        dispatch({ type: 'COMPLETE', result });
      } catch (error) {
        if (cancelledRef.current) {
          dispatch({ type: 'CANCEL' });
          return;
        }

        const errorObj = error instanceof Error ? error : new Error(String(error));
        dispatch({ type: 'ERROR', error: errorObj });
        throw errorObj;
      }
    },
    []
  );

  /**
   * Retry last failed generation
   */
  const retry = useCallback(async () => {
    if (!lastRequestRef.current) {
      throw new Error('No previous request to retry');
    }

    const { brandId, extractionResults, options } = lastRequestRef.current;
    await generateUVP(brandId, extractionResults, options);
  }, [generateUVP]);

  /**
   * Cancel ongoing generation
   */
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    dispatch({ type: 'CANCEL' });
  }, []);

  /**
   * Reset to idle state
   */
  const reset = useCallback(() => {
    lastRequestRef.current = null;
    cancelledRef.current = false;
    dispatch({ type: 'RESET' });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  return {
    generateUVP,
    isGenerating: state.status === 'generating',
    progress:
      state.status === 'generating'
        ? state.progress
        : state.status === 'complete'
          ? 100
          : 0,
    currentPhase:
      state.status === 'generating'
        ? state.phase
        : state.status === 'complete'
          ? 'complete'
          : 'idle',
    result: state.status === 'complete' ? state.result : null,
    error: state.status === 'error' ? state.error : null,
    retry,
    cancel,
    reset,
    sessionId:
      state.status === 'generating' || state.status === 'complete'
        ? state.sessionId
        : null,
  };
}
