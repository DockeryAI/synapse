/**
 * ModeContext
 * Manages Content vs Campaign mode state
 */

import * as React from 'react';
import type { CampaignMode } from '@/types/v2';

interface ModeContextValue {
  mode: CampaignMode;
  setMode: (mode: CampaignMode) => void;
  isContentMode: boolean;
  isCampaignMode: boolean;
}

const ModeContext = React.createContext<ModeContextValue | undefined>(undefined);

interface ModeProviderProps {
  children: React.ReactNode;
  defaultMode?: CampaignMode;
}

const STORAGE_KEY = 'synapse_v2_mode';

export const ModeProvider: React.FC<ModeProviderProps> = ({
  children,
  defaultMode = 'content'
}) => {
  // Initialize from localStorage or default
  const [mode, setModeState] = React.useState<CampaignMode>(() => {
    if (typeof window === 'undefined') return defaultMode;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'content' || stored === 'campaign') {
      return stored;
    }
    return defaultMode;
  });

  // Persist mode changes to localStorage
  const setMode = React.useCallback((newMode: CampaignMode) => {
    setModeState(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newMode);
    }
    console.log('[ModeContext] Mode changed to:', newMode);
  }, []);

  const value = React.useMemo<ModeContextValue>(() => ({
    mode,
    setMode,
    isContentMode: mode === 'content',
    isCampaignMode: mode === 'campaign'
  }), [mode, setMode]);

  return (
    <ModeContext.Provider value={value}>
      {children}
    </ModeContext.Provider>
  );
};

export const useMode = (): ModeContextValue => {
  const context = React.useContext(ModeContext);
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
};

export default ModeContext;
