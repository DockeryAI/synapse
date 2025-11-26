/**
 * Keyboard Shortcuts Hook
 * Provides keyboard navigation and shortcuts for power users
 */

import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  callback: () => void;
  description: string;
  global?: boolean; // If true, works even when input is focused
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

/**
 * Hook to handle keyboard shortcuts
 *
 * @example
 * useKeyboardShortcuts([
 *   { key: 'k', metaKey: true, callback: openCommandPalette, description: 'Open command palette' },
 *   { key: 'n', metaKey: true, callback: createNew, description: 'Create new campaign' }
 * ]);
 */
export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) => {
  const { enabled = true, preventDefault = true } = options;
  const shortcutsRef = useRef(shortcuts);

  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Skip if user is typing in an input, textarea, or contenteditable
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isContentEditable = target.isContentEditable;

      shortcutsRef.current.forEach((shortcut) => {
        // Skip non-global shortcuts if user is typing
        if ((isInput || isContentEditable) && !shortcut.global) {
          return;
        }

        const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchesCtrl = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey;
        const matchesMeta = shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey;
        const matchesShift = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey;
        const matchesAlt = shortcut.altKey === undefined || event.altKey === shortcut.altKey;

        if (matchesKey && matchesCtrl && matchesMeta && matchesShift && matchesAlt) {
          if (preventDefault) {
            event.preventDefault();
          }
          shortcut.callback();
        }
      });
    },
    [enabled, preventDefault]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
};

/**
 * Get the modifier key name based on platform
 */
export const getModifierKey = (): 'Cmd' | 'Ctrl' => {
  if (typeof navigator === 'undefined') return 'Ctrl';
  return navigator.platform.toLowerCase().includes('mac') ? 'Cmd' : 'Ctrl';
};

/**
 * Format shortcut for display
 * @example formatShortcut({ key: 'k', metaKey: true }) => 'Cmd+K' or 'Ctrl+K'
 */
export const formatShortcut = (shortcut: Omit<KeyboardShortcut, 'callback' | 'description'>): string => {
  const parts: string[] = [];

  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.metaKey) parts.push(getModifierKey());
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.altKey) parts.push('Alt');
  parts.push(shortcut.key.toUpperCase());

  return parts.join('+');
};

/**
 * Common keyboard shortcuts for dashboard
 */
export const createDashboardShortcuts = (actions: {
  onCommandPalette?: () => void;
  onNewCampaign?: () => void;
  onNewContent?: () => void;
  onSearch?: () => void;
  onToggleMode?: (mode: number) => void;
  onRefresh?: () => void;
}): KeyboardShortcut[] => {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');

  return [
    // Command palette
    ...(actions.onCommandPalette
      ? [{
          key: 'k',
          [isMac ? 'metaKey' : 'ctrlKey']: true,
          callback: actions.onCommandPalette,
          description: 'Open command palette',
          global: true,
        }]
      : []),

    // New campaign
    ...(actions.onNewCampaign
      ? [{
          key: 'n',
          [isMac ? 'metaKey' : 'ctrlKey']: true,
          callback: actions.onNewCampaign,
          description: 'Create new campaign',
        }]
      : []),

    // New content
    ...(actions.onNewContent
      ? [{
          key: 's',
          [isMac ? 'metaKey' : 'ctrlKey']: true,
          callback: actions.onNewContent,
          description: 'Create new Synapse content',
        }]
      : []),

    // Search
    ...(actions.onSearch
      ? [{
          key: '/',
          callback: actions.onSearch,
          description: 'Focus search',
        }]
      : []),

    // Mode switching
    ...(actions.onToggleMode
      ? [
          {
            key: '1',
            callback: () => actions.onToggleMode(0),
            description: 'Switch to Easy mode',
          },
          {
            key: '2',
            callback: () => actions.onToggleMode(1),
            description: 'Switch to Power mode',
          },
          {
            key: '3',
            callback: () => actions.onToggleMode(2),
            description: 'Switch to Campaign mode',
          },
        ]
      : []),

    // Refresh
    ...(actions.onRefresh
      ? [{
          key: 'r',
          [isMac ? 'metaKey' : 'ctrlKey']: true,
          callback: actions.onRefresh,
          description: 'Refresh intelligence',
        }]
      : []),
  ];
};

/**
 * Hook for handling Escape key
 */
export const useEscapeKey = (callback: () => void, enabled = true) => {
  useKeyboardShortcuts(
    [
      {
        key: 'Escape',
        callback,
        description: 'Close/Cancel',
        global: true,
      },
    ],
    { enabled }
  );
};
