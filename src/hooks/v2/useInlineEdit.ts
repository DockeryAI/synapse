/**
 * useInlineEdit Hook
 *
 * Manage inline editing state with auto-save, debouncing, and error handling.
 * Provides a complete editing experience with dirty state tracking and cancel support.
 *
 * ISOLATION: Zero V1 imports - Pure React hook
 */

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook options
 */
export interface UseInlineEditOptions<T> {
  /** Async save callback */
  onSave: (value: T) => Promise<void>;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Enable auto-save on value change */
  autoSave?: boolean;
  /** Callback when edit mode changes */
  onEditModeChange?: (isEditing: boolean) => void;
  /** Callback when save completes */
  onSaveComplete?: (value: T) => void;
  /** Callback when save fails */
  onSaveError?: (error: Error) => void;
}

/**
 * Hook return value
 */
export interface UseInlineEditReturn<T> {
  /** Current value */
  value: T;
  /** Original value (for comparison) */
  originalValue: T;
  /** Has unsaved changes */
  isDirty: boolean;
  /** In edit mode */
  isEditing: boolean;
  /** Save in progress */
  isSaving: boolean;
  /** Save error */
  error: Error | null;
  /** Update value */
  setValue: (value: T) => void;
  /** Enter edit mode */
  edit: () => void;
  /** Save changes */
  save: () => Promise<void>;
  /** Cancel and revert to original */
  cancel: () => void;
  /** Reset to a new initial value */
  reset: (newValue: T) => void;
}

/**
 * useInlineEdit Hook
 *
 * Manages inline editing with auto-save, debouncing, and robust error handling.
 *
 * @example
 * ```tsx
 * function EditableText({ initialText }: { initialText: string }) {
 *   const {
 *     value,
 *     isDirty,
 *     isEditing,
 *     isSaving,
 *     edit,
 *     save,
 *     cancel,
 *     setValue
 *   } = useInlineEdit(initialText, {
 *     onSave: async (text) => {
 *       await api.updateText(text);
 *     },
 *     debounceMs: 500,
 *     autoSave: true
 *   });
 *
 *   if (!isEditing) {
 *     return <p onClick={edit}>{value}</p>;
 *   }
 *
 *   return (
 *     <input
 *       value={value}
 *       onChange={(e) => setValue(e.target.value)}
 *       onBlur={save}
 *     />
 *   );
 * }
 * ```
 */
export function useInlineEdit<T>(
  initialValue: T,
  options: UseInlineEditOptions<T>
): UseInlineEditReturn<T> {
  const {
    onSave,
    debounceMs = 500,
    autoSave = false,
    onEditModeChange,
    onSaveComplete,
    onSaveError,
  } = options;

  // State
  const [value, setValue] = useState<T>(initialValue);
  const [originalValue, setOriginalValue] = useState<T>(initialValue);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(true);

  // Computed
  const isDirty = value !== originalValue;

  /**
   * Save changes
   */
  const save = useCallback(async () => {
    // Prevent concurrent saves
    if (isSaving) {
      return pendingSaveRef.current;
    }

    // Nothing to save if not dirty
    if (!isDirty) {
      return Promise.resolve();
    }

    setIsSaving(true);
    setError(null);

    const savePromise = (async () => {
      try {
        await onSave(value);

        // Only update state if still mounted
        if (mountedRef.current) {
          setOriginalValue(value);
          setIsSaving(false);
          onSaveComplete?.(value);
        }
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));

        if (mountedRef.current) {
          setError(errorObj);
          setIsSaving(false);
          onSaveError?.(errorObj);
        }

        throw errorObj;
      }
    })();

    pendingSaveRef.current = savePromise;

    try {
      await savePromise;
    } finally {
      pendingSaveRef.current = null;
    }
  }, [value, isDirty, isSaving, onSave, onSaveComplete, onSaveError]);

  /**
   * Debounced save
   */
  const debouncedSave = useCallback(() => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Schedule save
    debounceTimeoutRef.current = setTimeout(() => {
      save().catch((error) => {
        console.error('Auto-save failed:', error);
      });
    }, debounceMs);
  }, [save, debounceMs]);

  /**
   * Update value (with auto-save support)
   */
  const handleSetValue = useCallback(
    (newValue: T) => {
      setValue(newValue);

      if (autoSave) {
        debouncedSave();
      }
    },
    [autoSave, debouncedSave]
  );

  /**
   * Enter edit mode
   */
  const edit = useCallback(() => {
    setIsEditing(true);
    setError(null);
    onEditModeChange?.(true);
  }, [onEditModeChange]);

  /**
   * Cancel and revert to original
   */
  const cancel = useCallback(() => {
    // Clear pending saves
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    // Revert to original
    setValue(originalValue);
    setIsEditing(false);
    setError(null);
    onEditModeChange?.(false);
  }, [originalValue, onEditModeChange]);

  /**
   * Reset to a new initial value
   */
  const reset = useCallback(
    (newValue: T) => {
      // Clear pending saves
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }

      setValue(newValue);
      setOriginalValue(newValue);
      setIsEditing(false);
      setError(null);
      onEditModeChange?.(false);
    },
    [onEditModeChange]
  );

  // Update original value when initialValue changes
  useEffect(() => {
    if (!isEditing && !isDirty) {
      setOriginalValue(initialValue);
      setValue(initialValue);
    }
  }, [initialValue, isEditing, isDirty]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      // Clear debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // If auto-save enabled and dirty, attempt final save
      if (autoSave && value !== originalValue) {
        onSave(value).catch((error) => {
          console.error('Final auto-save on unmount failed:', error);
        });
      }
    };
  }, [autoSave, value, originalValue, onSave]);

  return {
    value,
    originalValue,
    isDirty,
    isEditing,
    isSaving,
    error,
    setValue: handleSetValue,
    edit,
    save,
    cancel,
    reset,
  };
}
