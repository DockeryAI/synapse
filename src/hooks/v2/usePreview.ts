/**
 * usePreview - React hook for preview state management
 *
 * Provides easy access to preview state and actions
 *
 * Usage:
 * ```tsx
 * const {
 *   state,
 *   updateContent,
 *   updatePlatform,
 *   updateDevice,
 *   createSnapshot,
 *   undo,
 *   redo,
 * } = usePreview();
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  PreviewState,
  PlatformType,
  PreviewDevice,
  MobileDevice,
  PreviewOrientation,
  PreviewSnapshot,
  SplitViewConfig,
} from '../../types/v2/preview.types';
import { previewState as previewStateService } from '../../services/v2/preview-state.service';

interface UsePreviewReturn {
  state: PreviewState;
  isLoading: boolean;
  error: string | null;

  // Update functions
  updateContent: (content: string) => Promise<void>;
  updatePlatform: (platform: PlatformType) => void;
  updateDevice: (device: PreviewDevice) => void;
  updateMobileDevice: (device: MobileDevice) => void;
  updateOrientation: (orientation: PreviewOrientation) => void;
  updateSplitView: (config: Partial<SplitViewConfig>) => void;
  updateCurrentPiece: (pieceId: string | null) => void;

  // Snapshot functions
  createSnapshot: (pieceId: string) => Promise<PreviewSnapshot>;
  getSnapshots: () => PreviewSnapshot[];
  deleteSnapshot: (id: string) => boolean;

  // History functions
  undo: () => boolean;
  redo: () => boolean;
  canUndo: boolean;
  canRedo: boolean;

  // Utility functions
  reset: () => void;
  clearCache: () => void;
}

export const usePreview = (): UsePreviewReturn => {
  const [state, setState] = useState<PreviewState>(previewStateService.getState());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = previewStateService.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Update content with debouncing
  const updateContent = useCallback(async (content: string) => {
    await previewStateService.updatePreviewData(content, state.selectedPlatform);
  }, [state.selectedPlatform]);

  // Update platform
  const updatePlatform = useCallback((platform: PlatformType) => {
    previewStateService.updateState({ selectedPlatform: platform }, false);

    // Re-render preview with new platform
    if (state.previewData) {
      previewStateService.updatePreviewData(state.previewData.content, platform);
    }
  }, [state.previewData]);

  // Update device
  const updateDevice = useCallback((device: PreviewDevice) => {
    previewStateService.updateState({ selectedDevice: device }, false);
  }, []);

  // Update mobile device
  const updateMobileDevice = useCallback((device: MobileDevice) => {
    previewStateService.updateState({ selectedMobileDevice: device }, false);
  }, []);

  // Update orientation
  const updateOrientation = useCallback((orientation: PreviewOrientation) => {
    previewStateService.updateState({ orientation }, false);
  }, []);

  // Update split view config
  const updateSplitView = useCallback((config: Partial<SplitViewConfig>) => {
    const currentConfig = previewStateService.getState().splitViewConfig;
    previewStateService.updateState(
      {
        splitViewConfig: {
          ...currentConfig,
          ...config,
        },
      },
      false
    );
  }, []);

  // Update current piece
  const updateCurrentPiece = useCallback((pieceId: string | null) => {
    previewStateService.updateState({ currentPieceId: pieceId }, false);
  }, []);

  // Create snapshot
  const createSnapshot = useCallback(async (pieceId: string): Promise<PreviewSnapshot> => {
    return await previewStateService.createSnapshot(pieceId);
  }, []);

  // Get snapshots
  const getSnapshots = useCallback((): PreviewSnapshot[] => {
    return previewStateService.getSnapshots();
  }, []);

  // Delete snapshot
  const deleteSnapshot = useCallback((id: string): boolean => {
    return previewStateService.deleteSnapshot(id);
  }, []);

  // Undo
  const undo = useCallback((): boolean => {
    const result = previewStateService.undo();
    setCanUndo(previewStateService.getState() !== state);
    return result;
  }, [state]);

  // Redo
  const redo = useCallback((): boolean => {
    const result = previewStateService.redo();
    setCanRedo(previewStateService.getState() !== state);
    return result;
  }, [state]);

  // Reset
  const reset = useCallback(() => {
    previewStateService.reset();
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    previewStateService.clearCache();
  }, []);

  return {
    state,
    isLoading: state.isLoading,
    error: state.error,

    updateContent,
    updatePlatform,
    updateDevice,
    updateMobileDevice,
    updateOrientation,
    updateSplitView,
    updateCurrentPiece,

    createSnapshot,
    getSnapshots,
    deleteSnapshot,

    undo,
    redo,
    canUndo,
    canRedo,

    reset,
    clearCache,
  };
};

export default usePreview;
