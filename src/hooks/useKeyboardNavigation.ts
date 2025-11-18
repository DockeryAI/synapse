/**
 * Keyboard Navigation Hook
 * Provides accessible keyboard navigation for interactive elements
 */

import { useEffect, useCallback, RefObject } from 'react';

interface UseKeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: () => void;
  onShiftTab?: () => void;
  enabled?: boolean;
}

/**
 * Hook for handling keyboard navigation events
 */
export const useKeyboardNavigation = (options: UseKeyboardNavigationOptions) => {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onShiftTab,
    enabled = true,
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;

        case 'Enter':
          if (onEnter) {
            event.preventDefault();
            onEnter();
          }
          break;

        case 'ArrowUp':
          if (onArrowUp) {
            event.preventDefault();
            onArrowUp();
          }
          break;

        case 'ArrowDown':
          if (onArrowDown) {
            event.preventDefault();
            onArrowDown();
          }
          break;

        case 'ArrowLeft':
          if (onArrowLeft) {
            event.preventDefault();
            onArrowLeft();
          }
          break;

        case 'ArrowRight':
          if (onArrowRight) {
            event.preventDefault();
            onArrowRight();
          }
          break;

        case 'Tab':
          if (event.shiftKey && onShiftTab) {
            event.preventDefault();
            onShiftTab();
          } else if (!event.shiftKey && onTab) {
            event.preventDefault();
            onTab();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab, onShiftTab]);
};

/**
 * Hook for trapping focus within a container (useful for modals, dialogs)
 */
export const useFocusTrap = (containerRef: RefObject<HTMLElement>, isActive: boolean = true) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus first element when trap activates
    firstElement?.focus();

    container.addEventListener('keydown', handleTabKey as EventListener);

    return () => {
      container.removeEventListener('keydown', handleTabKey as EventListener);
    };
  }, [containerRef, isActive]);
};

/**
 * Hook for handling list navigation with arrow keys
 */
interface UseListNavigationOptions<T> {
  items: T[];
  onSelect: (item: T, index: number) => void;
  loop?: boolean;
  orientation?: 'vertical' | 'horizontal';
  enabled?: boolean;
}

export const useListNavigation = <T,>({
  items,
  onSelect,
  loop = true,
  orientation = 'vertical',
  enabled = true,
}: UseListNavigationOptions<T>) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const navigate = useCallback(
    (direction: 'next' | 'previous') => {
      if (!enabled || items.length === 0) return;

      let newIndex: number;

      if (direction === 'next') {
        newIndex = currentIndex + 1;
        if (newIndex >= items.length) {
          newIndex = loop ? 0 : items.length - 1;
        }
      } else {
        newIndex = currentIndex - 1;
        if (newIndex < 0) {
          newIndex = loop ? items.length - 1 : 0;
        }
      }

      setCurrentIndex(newIndex);
      onSelect(items[newIndex], newIndex);
    },
    [currentIndex, items, onSelect, loop, enabled]
  );

  useKeyboardNavigation({
    onArrowUp: orientation === 'vertical' ? () => navigate('previous') : undefined,
    onArrowDown: orientation === 'vertical' ? () => navigate('next') : undefined,
    onArrowLeft: orientation === 'horizontal' ? () => navigate('previous') : undefined,
    onArrowRight: orientation === 'horizontal' ? () => navigate('next') : undefined,
    enabled,
  });

  return { currentIndex, setCurrentIndex };
};

// Import useState for useListNavigation
import { useState } from 'react';

/**
 * Hook for announcing changes to screen readers
 */
export const useScreenReaderAnnouncement = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return { announce };
};
