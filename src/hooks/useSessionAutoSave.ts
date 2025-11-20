/**
 * useSessionAutoSave Hook
 *
 * Auto-saves UVP session state with debouncing
 * Triggers save after each step completion
 *
 * Created: 2025-11-20
 */

import { useEffect, useRef, useCallback } from 'react';
import { sessionManager } from '@/services/uvp/session-manager.service';
import type { UVPStepKey, UpdateSessionInput } from '@/types/session.types';

interface UseSessionAutoSaveOptions {
  sessionId: string | null;
  currentStep: UVPStepKey;
  onSaveSuccess?: () => void;
  onSaveError?: (error: string) => void;
  debounceMs?: number;
}

export function useSessionAutoSave({
  sessionId,
  currentStep,
  onSaveSuccess,
  onSaveError,
  debounceMs = 500
}: UseSessionAutoSaveOptions) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');

  /**
   * Save session data
   */
  const saveSession = useCallback(async (updateData: Partial<UpdateSessionInput>) => {
    if (!sessionId) {
      console.warn('[useSessionAutoSave] No session ID, skipping save');
      return;
    }

    try {
      console.log('[useSessionAutoSave] Saving session...');

      const result = await sessionManager.updateSession({
        session_id: sessionId,
        ...updateData,
      });

      if (result.success) {
        console.log('[useSessionAutoSave] Save successful');
        onSaveSuccess?.();
      } else {
        console.error('[useSessionAutoSave] Save failed:', result.error);
        onSaveError?.(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('[useSessionAutoSave] Save error:', error);
      onSaveError?.(String(error));
    }
  }, [sessionId, onSaveSuccess, onSaveError]);

  /**
   * Debounced save function
   */
  const debouncedSave = useCallback((updateData: Partial<UpdateSessionInput>) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Check if data actually changed
    const dataStr = JSON.stringify(updateData);
    if (dataStr === lastSavedDataRef.current) {
      console.log('[useSessionAutoSave] Data unchanged, skipping save');
      return;
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      lastSavedDataRef.current = dataStr;
      saveSession(updateData);
    }, debounceMs);
  }, [saveSession, debounceMs]);

  /**
   * Immediate save (no debounce)
   */
  const saveNow = useCallback((updateData: Partial<UpdateSessionInput>) => {
    // Clear any pending debounced saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveSession(updateData);
  }, [saveSession]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    saveSession: debouncedSave,
    saveImmediately: saveNow,
  };
}
