/**
 * useInlineEdit Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInlineEdit } from '../useInlineEdit';

describe('useInlineEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with initial value', () => {
    const { result } = renderHook(() =>
      useInlineEdit('Initial text', {
        onSave: vi.fn(),
      })
    );

    expect(result.current.value).toBe('Initial text');
    expect(result.current.originalValue).toBe('Initial text');
    expect(result.current.isDirty).toBe(false);
    expect(result.current.isEditing).toBe(false);
    expect(result.current.isSaving).toBe(false);
  });

  it('should enter edit mode', () => {
    const onEditModeChange = vi.fn();
    const { result } = renderHook(() =>
      useInlineEdit('Test', {
        onSave: vi.fn(),
        onEditModeChange,
      })
    );

    act(() => {
      result.current.edit();
    });

    expect(result.current.isEditing).toBe(true);
    expect(onEditModeChange).toHaveBeenCalledWith(true);
  });

  it('should track dirty state', () => {
    const { result } = renderHook(() =>
      useInlineEdit('Initial', {
        onSave: vi.fn(),
      })
    );

    expect(result.current.isDirty).toBe(false);

    act(() => {
      result.current.setValue('Modified');
    });

    expect(result.current.isDirty).toBe(true);
    expect(result.current.value).toBe('Modified');
  });

  it('should save changes', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onSaveComplete = vi.fn();

    const { result } = renderHook(() =>
      useInlineEdit('Original', {
        onSave,
        onSaveComplete,
      })
    );

    act(() => {
      result.current.setValue('Updated');
    });

    expect(result.current.isDirty).toBe(true);

    await act(async () => {
      await result.current.save();
    });

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('Updated');
      expect(onSaveComplete).toHaveBeenCalledWith('Updated');
      expect(result.current.isDirty).toBe(false);
      expect(result.current.originalValue).toBe('Updated');
    });
  });

  it('should handle save errors', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));
    const onSaveError = vi.fn();

    const { result } = renderHook(() =>
      useInlineEdit('Original', {
        onSave,
        onSaveError,
      })
    );

    act(() => {
      result.current.setValue('Updated');
    });

    await act(async () => {
      try {
        await result.current.save();
      } catch (error) {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toBe('Save failed');
      expect(onSaveError).toHaveBeenCalled();
    });
  });

  it('should cancel and revert changes', () => {
    const { result } = renderHook(() =>
      useInlineEdit('Original', {
        onSave: vi.fn(),
      })
    );

    act(() => {
      result.current.edit();
      result.current.setValue('Modified');
    });

    expect(result.current.isDirty).toBe(true);
    expect(result.current.value).toBe('Modified');

    act(() => {
      result.current.cancel();
    });

    expect(result.current.isDirty).toBe(false);
    expect(result.current.value).toBe('Original');
    expect(result.current.isEditing).toBe(false);
  });

  it('should reset to new value', () => {
    const { result } = renderHook(() =>
      useInlineEdit('Initial', {
        onSave: vi.fn(),
      })
    );

    act(() => {
      result.current.setValue('Modified');
    });

    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.reset('New Value');
    });

    expect(result.current.value).toBe('New Value');
    expect(result.current.originalValue).toBe('New Value');
    expect(result.current.isDirty).toBe(false);
    expect(result.current.isEditing).toBe(false);
  });

  it('should support auto-save with debounce', async () => {
    vi.useFakeTimers();
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useInlineEdit('Original', {
        onSave,
        autoSave: true,
        debounceMs: 500,
      })
    );

    act(() => {
      result.current.setValue('Updated');
    });

    // Save should not be called immediately
    expect(onSave).not.toHaveBeenCalled();

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('Updated');
    });

    vi.useRealTimers();
  });
});
