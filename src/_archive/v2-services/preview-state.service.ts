/**
 * PreviewStateService - State management for preview system
 *
 * Handles:
 * - Preview state management
 * - Debounced updates (300ms delay)
 * - Change detection and diffing
 * - Preview cache for performance
 * - Auto-save preview state
 * - Undo/redo for preview changes
 * - Preview snapshots
 */

import type {
  PreviewState,
  PreviewSnapshot,
  PreviewCache,
  PreviewRendererConfig,
  PlatformPreviewData,
  PlatformType,
  PreviewDevice,
  MobileDevice,
  PreviewOrientation,
} from '../../types/v2/preview.types';
import { previewRenderer } from './preview-renderer.service';

export class PreviewStateService {
  private static instance: PreviewStateService;

  private state: PreviewState;
  private cache: PreviewCache = {};
  private snapshots: PreviewSnapshot[] = [];
  private historyStack: PreviewState[] = [];
  private historyIndex: number = -1;

  private config: PreviewRendererConfig = {
    debounceDelay: 300,
    cacheExpiration: 5 * 60 * 1000, // 5 minutes
    enableAutoSave: true,
    enableSnapshots: true,
    maxSnapshotHistory: 10,
  };

  private debounceTimer: NodeJS.Timeout | null = null;
  private listeners: Set<(state: PreviewState) => void> = new Set();

  private constructor() {
    // Initialize default state
    this.state = {
      currentPieceId: null,
      selectedPlatform: 'facebook',
      selectedDevice: 'desktop',
      selectedMobileDevice: 'iphone14',
      orientation: 'portrait',
      splitViewConfig: {
        ratio: '50/50',
        fullScreenMode: false,
        syncScroll: true,
        dividerPosition: 50,
      },
      previewData: null,
      timelineData: null,
      isLoading: false,
      error: null,
      lastUpdated: Date.now(),
    };

    // Load saved state from localStorage
    this.loadState();

    // Start cache cleanup interval
    this.startCacheCleanup();
  }

  static getInstance(): PreviewStateService {
    if (!PreviewStateService.instance) {
      PreviewStateService.instance = new PreviewStateService();
    }
    return PreviewStateService.instance;
  }

  /**
   * Get current state
   */
  getState(): PreviewState {
    return { ...this.state };
  }

  /**
   * Update state with debouncing
   */
  updateState(updates: Partial<PreviewState>, debounce: boolean = true): void {
    if (debounce) {
      // Clear existing timer
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      // Set new timer
      this.debounceTimer = setTimeout(() => {
        this.applyStateUpdate(updates);
      }, this.config.debounceDelay);
    } else {
      // Immediate update
      this.applyStateUpdate(updates);
    }
  }

  /**
   * Apply state update
   */
  private applyStateUpdate(updates: Partial<PreviewState>): void {
    // Save current state to history
    if (this.config.enableAutoSave) {
      this.saveToHistory();
    }

    // Merge updates
    this.state = {
      ...this.state,
      ...updates,
      lastUpdated: Date.now(),
    };

    // Notify listeners
    this.notifyListeners();

    // Save to localStorage
    if (this.config.enableAutoSave) {
      this.saveState();
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: PreviewState) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      listener(this.getState());
    });
  }

  /**
   * Update preview data with caching
   */
  async updatePreviewData(content: string, platform: PlatformType): Promise<void> {
    this.updateState({ isLoading: true }, false);

    try {
      // Check cache first
      const cacheKey = this.getCacheKey(content, platform);
      const cached = this.getFromCache(cacheKey);

      if (cached) {
        this.updateState({ previewData: cached, isLoading: false }, false);
        return;
      }

      // Render preview
      const previewData = await previewRenderer.renderContent({
        platform,
        device: this.state.selectedDevice,
        content,
        includeMetadata: true,
        generateThumbnail: false,
      });

      // Cache result
      this.addToCache(cacheKey, previewData);

      // Update state
      this.updateState({ previewData, isLoading: false, error: null }, false);
    } catch (error) {
      this.updateState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to render preview',
      }, false);
    }
  }

  /**
   * Save current state to history
   */
  private saveToHistory(): void {
    // Remove any states after current index
    this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);

    // Add current state
    this.historyStack.push({ ...this.state });
    this.historyIndex++;

    // Limit history size
    const maxHistory = 50;
    if (this.historyStack.length > maxHistory) {
      this.historyStack = this.historyStack.slice(-maxHistory);
      this.historyIndex = this.historyStack.length - 1;
    }
  }

  /**
   * Undo last change
   */
  undo(): boolean {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.state = { ...this.historyStack[this.historyIndex] };
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Redo last undone change
   */
  redo(): boolean {
    if (this.historyIndex < this.historyStack.length - 1) {
      this.historyIndex++;
      this.state = { ...this.historyStack[this.historyIndex] };
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Create snapshot of current preview
   */
  async createSnapshot(pieceId: string): Promise<PreviewSnapshot> {
    if (!this.config.enableSnapshots) {
      throw new Error('Snapshots are disabled');
    }

    if (!this.state.previewData) {
      throw new Error('No preview data available');
    }

    const snapshot: PreviewSnapshot = {
      id: `snapshot-${Date.now()}`,
      timestamp: Date.now(),
      pieceId,
      platform: this.state.selectedPlatform,
      content: this.state.previewData.content,
      previewData: this.state.previewData,
    };

    // Add to snapshots
    this.snapshots.push(snapshot);

    // Limit snapshot history
    if (this.snapshots.length > this.config.maxSnapshotHistory) {
      this.snapshots = this.snapshots.slice(-this.config.maxSnapshotHistory);
    }

    return snapshot;
  }

  /**
   * Get all snapshots
   */
  getSnapshots(): PreviewSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Get snapshot by ID
   */
  getSnapshot(id: string): PreviewSnapshot | null {
    return this.snapshots.find((s) => s.id === id) || null;
  }

  /**
   * Delete snapshot
   */
  deleteSnapshot(id: string): boolean {
    const index = this.snapshots.findIndex((s) => s.id === id);
    if (index !== -1) {
      this.snapshots.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Generate cache key
   */
  private getCacheKey(content: string, platform: PlatformType): string {
    // Simple hash function
    const hash = content.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);

    return `${platform}-${hash}`;
  }

  /**
   * Get from cache
   */
  private getFromCache(key: string): PlatformPreviewData | null {
    const cached = this.cache[key];

    if (!cached) return null;

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      delete this.cache[key];
      return null;
    }

    return cached.data;
  }

  /**
   * Add to cache
   */
  private addToCache(key: string, data: PlatformPreviewData): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.config.cacheExpiration,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = {};
  }

  /**
   * Start cache cleanup interval
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      Object.keys(this.cache).forEach((key) => {
        if (now > this.cache[key].expiresAt) {
          delete this.cache[key];
        }
      });
    }, 60000); // Clean every minute
  }

  /**
   * Save state to localStorage
   */
  private saveState(): void {
    try {
      const stateToSave = {
        selectedPlatform: this.state.selectedPlatform,
        selectedDevice: this.state.selectedDevice,
        selectedMobileDevice: this.state.selectedMobileDevice,
        orientation: this.state.orientation,
        splitViewConfig: this.state.splitViewConfig,
      };

      localStorage.setItem('preview-state', JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save preview state:', error);
    }
  }

  /**
   * Load state from localStorage
   */
  private loadState(): void {
    try {
      const saved = localStorage.getItem('preview-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = {
          ...this.state,
          ...parsed,
        };
      }
    } catch (error) {
      console.warn('Failed to load preview state:', error);
    }
  }

  /**
   * Reset state to defaults
   */
  reset(): void {
    this.state = {
      currentPieceId: null,
      selectedPlatform: 'facebook',
      selectedDevice: 'desktop',
      selectedMobileDevice: 'iphone14',
      orientation: 'portrait',
      splitViewConfig: {
        ratio: '50/50',
        fullScreenMode: false,
        syncScroll: true,
        dividerPosition: 50,
      },
      previewData: null,
      timelineData: null,
      isLoading: false,
      error: null,
      lastUpdated: Date.now(),
    };

    this.historyStack = [];
    this.historyIndex = -1;
    this.clearCache();
    this.notifyListeners();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PreviewRendererConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Get configuration
   */
  getConfig(): PreviewRendererConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const previewState = PreviewStateService.getInstance();
