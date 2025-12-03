// PRD Feature: SYNAPSE-V6
/**
 * V6 Tab Data Hook
 *
 * Connects UI tabs to the V6 API orchestrator.
 * Provides reactive tab data with loading states.
 *
 * Key features:
 * - Profile-based API routing
 * - Real-time updates via EventEmitter
 * - Backward compatible with existing tab UI
 * - Caches results per tab
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiOrchestrator, type TabData, type ApiResult } from '@/services/synapse-v6/api-orchestrator.service';
import { getOrCreateBrandProfile, type BrandProfile, type InsightTab } from '@/services/synapse-v6/brand-profile.service';
import type { CompleteUVP } from '@/types/uvp-flow.types';

// V6 tab names mapped to legacy tab names
export const V6_TAB_MAPPING: Record<InsightTab, string> = {
  'voc': 'triggers',        // Voice of Customer -> Triggers
  'community': 'proof',     // Community -> Proof (social proof)
  'competitive': 'competition', // Competitive -> Competition
  'trends': 'trends',       // Trends -> Trends
  'search': 'all',          // Search -> All (for now)
  'local_timing': 'local',  // Local/Timing -> Local
};

// Reverse mapping for UI -> V6
export const LEGACY_TAB_MAPPING: Record<string, InsightTab> = {
  'triggers': 'voc',
  'proof': 'community',
  'competition': 'competitive',
  'trends': 'trends',
  'all': 'search',
  'local': 'local_timing',
  'weather': 'local_timing',
};

export interface UseV6TabDataOptions {
  brandId: string;
  uvp: CompleteUVP;
  autoLoad?: boolean;
}

export interface V6TabState {
  profile: BrandProfile | null;
  tabs: Map<InsightTab, TabData>;
  isLoading: boolean;
  error: string | null;
  activeTab: InsightTab;
}

export interface UseV6TabDataReturn {
  state: V6TabState;
  loadTab: (tab: InsightTab) => Promise<void>;
  loadAllTabs: () => Promise<void>;
  setActiveTab: (tab: InsightTab) => void;
  getTabData: (tab: InsightTab) => TabData | undefined;
  getLegacyTabData: (legacyTab: string) => TabData | undefined;
  refresh: () => Promise<void>;
  isTabLoading: (tab: InsightTab) => boolean;
  isTabComplete: (tab: InsightTab) => boolean;
}

/**
 * V6 Tab Data Hook
 */
export function useV6TabData(options: UseV6TabDataOptions): UseV6TabDataReturn {
  const { brandId, uvp, autoLoad = true } = options;

  const [state, setState] = useState<V6TabState>({
    profile: null,
    tabs: new Map(),
    isLoading: false,
    error: null,
    activeTab: 'voc',
  });

  const initializedRef = useRef(false);
  const profileRef = useRef<BrandProfile | null>(null);

  // Initialize profile and set up orchestrator
  const initialize = useCallback(async () => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get or create brand profile
      const profile = await getOrCreateBrandProfile(brandId, uvp);

      if (!profile) {
        throw new Error('Failed to create brand profile');
      }

      profileRef.current = profile;

      // Set profile on orchestrator
      await apiOrchestrator.setProfile(profile);

      setState((prev) => ({
        ...prev,
        profile,
        isLoading: false,
      }));

      console.log('[useV6TabData] Initialized with profile:', profile.profile_type);
    } catch (error) {
      console.error('[useV6TabData] Initialization error:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize',
      }));
    }
  }, [brandId, uvp]);

  // Set up event listeners
  useEffect(() => {
    const handleTabLoading = (data: { tab: InsightTab }) => {
      setState((prev) => {
        const tabs = new Map(prev.tabs);
        const existing = tabs.get(data.tab) || {
          tab: data.tab,
          results: [],
          loading: true,
          complete: false,
        };
        tabs.set(data.tab, { ...existing, loading: true, complete: false });
        return { ...prev, tabs };
      });
    };

    const handleTabUpdate = (data: { tab: InsightTab; result: ApiResult }) => {
      setState((prev) => {
        const tabs = new Map(prev.tabs);
        const existing = tabs.get(data.tab);
        if (existing) {
          tabs.set(data.tab, {
            ...existing,
            results: [...existing.results, data.result],
          });
        }
        return { ...prev, tabs };
      });
    };

    const handleTabComplete = (data: { tab: InsightTab; results: ApiResult[] }) => {
      setState((prev) => {
        const tabs = new Map(prev.tabs);
        tabs.set(data.tab, {
          tab: data.tab,
          results: data.results,
          loading: false,
          complete: true,
        });
        return { ...prev, tabs };
      });
    };

    const handleTabError = (data: { tab: InsightTab; result: ApiResult }) => {
      console.warn('[useV6TabData] Tab error:', data.tab, data.result.error);
    };

    const handleAllComplete = () => {
      setState((prev) => ({ ...prev, isLoading: false }));
    };

    apiOrchestrator.on('tab:loading', handleTabLoading);
    apiOrchestrator.on('tab:update', handleTabUpdate);
    apiOrchestrator.on('tab:complete', handleTabComplete);
    apiOrchestrator.on('tab:error', handleTabError);
    apiOrchestrator.on('all:complete', handleAllComplete);

    return () => {
      apiOrchestrator.off('tab:loading', handleTabLoading);
      apiOrchestrator.off('tab:update', handleTabUpdate);
      apiOrchestrator.off('tab:complete', handleTabComplete);
      apiOrchestrator.off('tab:error', handleTabError);
      apiOrchestrator.off('all:complete', handleAllComplete);
    };
  }, []);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      initialize();
    }
  }, [autoLoad, initialize]);

  // Load a specific tab
  const loadTab = useCallback(async (tab: InsightTab) => {
    if (!profileRef.current) {
      console.warn('[useV6TabData] Cannot load tab - profile not initialized');
      return;
    }

    try {
      await apiOrchestrator.loadTab(tab);
    } catch (error) {
      console.error('[useV6TabData] Load tab error:', error);
    }
  }, []);

  // Load all tabs
  const loadAllTabs = useCallback(async () => {
    if (!profileRef.current) {
      await initialize();
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const allData = await apiOrchestrator.loadAllTabs();
      setState((prev) => ({
        ...prev,
        tabs: allData,
        isLoading: false,
      }));
    } catch (error) {
      console.error('[useV6TabData] Load all tabs error:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load tabs',
      }));
    }
  }, [initialize]);

  // Set active tab
  const setActiveTab = useCallback((tab: InsightTab) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  // Get tab data by V6 tab name
  const getTabData = useCallback(
    (tab: InsightTab): TabData | undefined => {
      return state.tabs.get(tab);
    },
    [state.tabs]
  );

  // Get tab data by legacy tab name
  const getLegacyTabData = useCallback(
    (legacyTab: string): TabData | undefined => {
      const v6Tab = LEGACY_TAB_MAPPING[legacyTab];
      if (!v6Tab) return undefined;
      return state.tabs.get(v6Tab);
    },
    [state.tabs]
  );

  // Refresh all data
  const refresh = useCallback(async () => {
    initializedRef.current = false;
    await initialize();
    await loadAllTabs();
  }, [initialize, loadAllTabs]);

  // Check if tab is loading
  const isTabLoading = useCallback(
    (tab: InsightTab): boolean => {
      const data = state.tabs.get(tab);
      return data?.loading ?? false;
    },
    [state.tabs]
  );

  // Check if tab is complete
  const isTabComplete = useCallback(
    (tab: InsightTab): boolean => {
      const data = state.tabs.get(tab);
      return data?.complete ?? false;
    },
    [state.tabs]
  );

  return {
    state,
    loadTab,
    loadAllTabs,
    setActiveTab,
    getTabData,
    getLegacyTabData,
    refresh,
    isTabLoading,
    isTabComplete,
  };
}

export default useV6TabData;
