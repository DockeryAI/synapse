/**
 * ModeContext Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as React from 'react';
import { ModeProvider, useMode } from '@/contexts/v2/ModeContext';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('ModeContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ModeProvider>{children}</ModeProvider>
  );

  describe('useMode', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useMode());
      }).toThrow('useMode must be used within a ModeProvider');
    });

    it('should return default mode as content', () => {
      const { result } = renderHook(() => useMode(), { wrapper });

      expect(result.current.mode).toBe('content');
      expect(result.current.isContentMode).toBe(true);
      expect(result.current.isCampaignMode).toBe(false);
    });

    it('should allow setting mode to campaign', () => {
      const { result } = renderHook(() => useMode(), { wrapper });

      act(() => {
        result.current.setMode('campaign');
      });

      expect(result.current.mode).toBe('campaign');
      expect(result.current.isContentMode).toBe(false);
      expect(result.current.isCampaignMode).toBe(true);
    });

    it('should persist mode to localStorage', () => {
      const { result } = renderHook(() => useMode(), { wrapper });

      act(() => {
        result.current.setMode('campaign');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('synapse_v2_mode', 'campaign');
    });

    it('should load mode from localStorage on init', () => {
      localStorageMock.getItem.mockReturnValueOnce('campaign');

      const { result } = renderHook(() => useMode(), { wrapper });

      expect(result.current.mode).toBe('campaign');
    });
  });

  describe('ModeProvider', () => {
    it('should accept custom default mode', () => {
      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <ModeProvider defaultMode="campaign">{children}</ModeProvider>
      );

      const { result } = renderHook(() => useMode(), { wrapper: customWrapper });

      expect(result.current.mode).toBe('campaign');
    });
  });
});
